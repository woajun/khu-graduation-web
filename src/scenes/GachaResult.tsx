import { useEffect, useLayoutEffect, useRef, useState, type FormEvent } from 'react'
import gsap from 'gsap'
import { photoSrc, thumbSrc } from '../lib/waste'

export type Picked = {
  name: string
  color: string
  // 누른 사진 칸의 화면 위치. 이 자리에서 왼쪽 절반으로 커진다
  from: { left: number; top: number; width: number; height: number }
}

// 사진 칸이 왼쪽 절반으로 커지는 시간, 오른쪽 색 면이 열리는 시간, 글자가 올라오는 시간
const GROW_DURATION = 0.6
const PANEL_DURATION = 0.5
const TEXT_DURATION = 0.4
const TEXT_STAGGER = 0.08

// 사진에서 색을 고를 때 쓰는 샘플 크기, 색상(hue) 구간 수, "색이 있다"고 볼 채도·밝기 기준
const SAMPLE = 48
const HUE_BINS = 12
const MIN_SATURATION = 0.2
const MIN_VALUE = 0.2
// 색 있는 픽셀의 가중치 합이 전체 픽셀 수의 이 비율보다 적으면 흑백 사진으로 보고 전체 평균색을 쓴다
const MIN_COLORED = 0.01

/**
 * 사진의 대표 색을 '#rrggbb' 로 뽑는다.
 * 아카이빙 사진은 배경이 흑백이고 쓰레기만 색이 남아 있다. 채도가 높을수록 크게 쳐서
 * 색상 구간별로 모은 뒤, 가장 무거운 구간의 픽셀만 평균 낸다 (바닥의 옅은 누런 기운보다 선명한 색이 이긴다)
 */
export function pickColor(img: HTMLImageElement): string {
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = SAMPLE
  const ctx = canvas.getContext('2d', { willReadFrequently: true })
  if (!ctx || !img.naturalWidth) return '#c1ccd4'
  ctx.drawImage(img, 0, 0, SAMPLE, SAMPLE)
  const { data } = ctx.getImageData(0, 0, SAMPLE, SAMPLE)

  const all = [0, 0, 0]
  // 구간마다 [가중치 합, r, g, b 가중 합]
  const bins = Array.from({ length: HUE_BINS }, () => [0, 0, 0, 0])
  for (let i = 0; i < data.length; i += 4) {
    const [r, g, b] = [data[i], data[i + 1], data[i + 2]]
    all[0] += r
    all[1] += g
    all[2] += b
    const max = Math.max(r, g, b)
    const min = Math.min(r, g, b)
    const v = max / 255
    const sat = max ? (max - min) / max : 0
    if (v < MIN_VALUE || sat < MIN_SATURATION) continue
    const d = max - min
    const hue =
      max === r ? ((g - b) / d + 6) % 6 : max === g ? (b - r) / d + 2 : (r - g) / d + 4
    const bin = bins[Math.floor((hue / 6) * HUE_BINS) % HUE_BINS]
    const w = sat * sat * v
    bin[0] += w
    bin[1] += r * w
    bin[2] += g * w
    bin[3] += b * w
  }
  const total = data.length / 4
  const [w, ...rgb] = bins.reduce((best, bin) => (bin[0] > best[0] ? bin : best))
  const [sum, n] = w / total >= MIN_COLORED ? [rgb, w] : [all, total]
  return `#${sum.map((c) => Math.round(c / n).toString(16).padStart(2, '0')).join('')}`
}

type Props = { picked: Picked; onBack: () => void }

const DEFAULT_NAME = 'YOUR COLOR'
const DEFAULT_AUTHOR = 'NAME'
// 이름 없이 OK 를 누르면 뜨는 안내가 머무는 시간(ms)
const EMPTY_NOTICE_MS = 2200
// 색 이름 → 작성자 이름 단계로 넘어갈 때 오른쪽 글자가 바뀌는 시간
const STEP_DURATION = 0.35
const HANGUL = /[\u3131-\u318e\uac00-\ud7a3]/

/**
 * 입력한 이름을 왼쪽 큰 글자로 옮긴다.
 * 영어는 대문자(CSS)로 띄어쓰기마다 줄을 바꾸고, 한글이 섞이면 글꼴과 행간을 바꾸고 칸 폭에 맞춰 줄바꿈한다
 */
function bigName(value: string) {
  const text = value.trim() || DEFAULT_NAME
  const ko = HANGUL.test(text)
  return { ko, text: ko ? text : text.split(/\s+/).join('\n') }
}

/** 작성자 이름은 왼쪽 아래에 '@' + 이름 으로 한 줄로 쓴다. 한글이 섞이면 코트라 볼드 */
function authorName(value: string) {
  const text = value.trim() || DEFAULT_AUTHOR
  return { ko: HANGUL.test(text), text: `@${text}` }
}

// 단계마다 오른쪽에 보이는 문구. 피그마 140:8400(색 이름), 140:8802(작성자 이름)
const STEPS = {
  color: {
    title: 'It’s Your Color!',
    desc: '이미지와 컬러를 보고 어울리는 이름을 지어주세요',
    placeholder: '예시) 폐수그린/폐지브라운 ...',
    label: '색 이름',
    notice: '이름을 지어주세요.',
  },
  author: {
    title: 'Your Name?',
    desc: '컬러 네임을 지어준 분의 이름을 작성해주세요',
    placeholder: 'YOUR NAME',
    label: '작성자 이름',
    notice: '작성자분의 네임을 입력해주세요.',
  },
} as const
// 두 번의 입력이 끝나면 피그마 140:6491 처럼 컬러칩을 보여주고 등록할지 묻는다
type Step = keyof typeof STEPS | 'confirm'

/** 왼쪽은 고른 사진, 오른쪽은 그 사진의 색으로 칠한 면에 색 이름 → 작성자 이름 순서로 입력 */
export function GachaResult({ picked, onBack }: Props) {
  const rootRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const tlRef = useRef<gsap.core.Timeline | null>(null)
  const [step, setStep] = useState<Step>('color')
  const [name, setName] = useState('')
  const [author, setAuthor] = useState('')
  const big = bigName(name)
  const by = authorName(author)
  const copy = step === 'confirm' ? null : STEPS[step]
  const value = step === 'color' ? name : author
  // 이름 없이 OK(또는 Enter)를 누르면 입력창 아래에 안내를 띄운다. 누를 때마다 숫자를 올려 다시 띄운다
  const [notice, setNotice] = useState(0)
  useEffect(() => {
    if (!notice) return
    const id = setTimeout(() => setNotice(0), EMPTY_NOTICE_MS)
    return () => clearTimeout(id)
  }, [notice])

  const submit = (e: FormEvent) => {
    e.preventDefault()
    if (!value.trim()) return setNotice((n) => n + 1)
    setStep(step === 'color' ? 'author' : 'confirm')
  }

  useLayoutEffect(() => {
    const root = rootRef.current
    if (!root) return
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches
    const { left, top, width, height } = picked.from
    // from() 은 지금 값을 끝 값으로 읽으므로, 정리할 때 revert 로 원래 스타일을 되돌려야 다시 실행해도 맞다
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: 'power3.inOut' } })
      tl.from('.gacha-result__photo', { left, top, width, height, duration: GROW_DURATION })
        .from('.gacha-result__panel', { clipPath: 'inset(0 0 0 100%)', duration: PANEL_DURATION }, '-=0.2')
        .from(
          '[data-rise]',
          { autoAlpha: 0, y: 24, duration: TEXT_DURATION, stagger: TEXT_STAGGER, ease: 'power2.out' },
          '-=0.2',
        )
      if (reduce) tl.progress(1)
      tlRef.current = tl
    }, root)
    return () => ctx.revert()
  }, [picked])

  // 단계가 바뀌면 오른쪽 문구와 입력창을 다시 올려 보여주고, 작성자 단계에선 왼쪽 아래 '@이름' 도 올린다
  // StrictMode 에서 처음에 두 번 실행돼도 움직이지 않도록, 직전 단계와 다를 때만 돈다
  const shownStep = useRef<Step>(step)
  useLayoutEffect(() => {
    if (shownStep.current === step) return
    shownStep.current = step
    // autoAlpha 가 visibility 를 숨기는 동안엔 포커스가 풀리므로, 다 보인 뒤에 입력창에 커서를 둔다
    const focus = () => inputRef.current?.focus()
    const root = rootRef.current
    if (!root || matchMedia('(prefers-reduced-motion: reduce)').matches) return focus()
    const ctx = gsap.context(() => {
      gsap.from('[data-step]', {
        autoAlpha: 0,
        y: 24,
        duration: STEP_DURATION,
        stagger: TEXT_STAGGER,
        ease: 'power2.out',
        onComplete: focus,
      })
    }, root)
    return () => ctx.revert()
  }, [step])

  // 작성자 단계에서는 색 이름 단계로 돌아간다 (확인 단계의 cancel 은 작성자 단계로).
  // 색 이름 단계에서는 들어올 때 모션을 거꾸로 돌려 사진 칸 자리로 돌아간 뒤 닫는다
  const back = () => {
    if (step === 'author') {
      setNotice(0)
      return setStep('color')
    }
    const tl = tlRef.current
    if (!tl || matchMedia('(prefers-reduced-motion: reduce)').matches) return onBack()
    tl.timeScale(1.6).eventCallback('onReverseComplete', onBack).reverse()
  }

  return (
    <div ref={rootRef} className="gacha-result" role="dialog" aria-label="당신의 색">
      {copy ? (
        <div className="gacha-result__panel" style={{ background: picked.color }}>
          <button type="button" className="gacha-result__back" onClick={back} aria-label="뒤로" data-rise>
            <svg viewBox="0 0 31 22" aria-hidden="true">
              <path d="M30 11H2M11 1.5L1.5 11L11 20.5" />
            </svg>
          </button>
          <h2 className="gacha-result__title" data-rise data-step>
            {copy.title}
          </h2>
          <p className="gacha-result__desc" data-rise data-step>
            {copy.desc}
          </p>
          <form className="gacha-result__form" onSubmit={submit} data-rise data-step>
            <input
              ref={inputRef}
              className="gacha-result__input"
              type="text"
              placeholder={copy.placeholder}
              aria-label={copy.label}
              value={value}
              onChange={(e) => {
                ;(step === 'color' ? setName : setAuthor)(e.target.value)
                setNotice(0)
              }}
            />
            <button type="submit" className="gacha-result__ok">
              OK
            </button>
          </form>
          {notice > 0 && (
            <p key={notice} className="gacha-result__notice" role="alert">
              {copy.notice}
            </p>
          )}
        </div>
      ) : (
        <div className="gacha-result__panel is-confirm">
          {/* 고른 사진을 흐리게 깔고 그 위에 컬러칩을 올린다 */}
          <div className="gacha-result__blur" style={{ backgroundImage: `url(${photoSrc(picked.name)})` }} />
          <h2 className="gacha-result__chip-title" data-step>
            Your Color Chip
          </h2>
          <p className="gacha-result__chip-desc" data-step>
            이대로 등록을 진행하시겠습니까?
          </p>
          <div className="gacha-result__chip" style={{ background: picked.color }} data-step>
            <p className={`gacha-result__chip-name${big.ko ? ' is-ko' : ''}`}>{big.text}</p>
            <p className="gacha-result__chip-by">{by.text}</p>
          </div>
          <div className="gacha-result__actions" data-step>
            <button type="button" className="gacha-result__cancel" onClick={() => setStep('author')}>
              cancel
            </button>
            <button type="button" className="gacha-result__confirm">
              OK
            </button>
          </div>
        </div>
      )}

      {/* 큰 사진을 받는 동안 이미 받아 둔 썸네일이 먼저 보인다 */}
      <div className="gacha-result__photo" style={{ backgroundImage: `url(${thumbSrc(picked.name)})` }}>
        <img src={photoSrc(picked.name)} alt="" />
        <p className={`gacha-result__your${big.ko ? ' is-ko' : ''}`} aria-hidden="true" data-rise>
          {big.text}
        </p>
        {/* 작성자 단계에 들어올 때만 올라오고, 확인 단계에서는 그대로 남는다 */}
        {step !== 'color' && (
          <p
            className={`gacha-result__by${by.ko ? ' is-ko' : ''}`}
            aria-hidden="true"
            data-step={step === 'author' ? '' : undefined}
          >
            {by.text}
          </p>
        )}
      </div>
    </div>
  )
}
