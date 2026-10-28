import { useLayoutEffect, useRef, type CSSProperties, type RefObject } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

import { useFitWidth } from '../lib/useFitWidth'
import { objectSrc, photoSrc, type WasteObject } from '../lib/waste'
import '../styles/about.css'

gsap.registerPlugin(ScrollTrigger)

const CAPTION_LEFT = ['버려진 것들을 촬영하고,', '그 안에 남겨진 색을 수집한다.']
const CAPTION_RIGHT = ['자연스럽다고 받아들이기 시작한 풍경을', '다시 낯설게 바라보는 데서 시작하다.']
const QUESTION = '너무 익숙해서, 그 안의 변화를 알아채지 못한 채'

// 첫 화면 그리드 사진 (왼쪽 두 열, 오른쪽 두 열 · 위에서 아래로)
const GRID_LEFT = ['Black-01', 'Orange-17', 'Yellow-07', 'Orange-07', 'Red-09', 'Red-07']
const GRID_RIGHT = ['Yellow-01', 'Orange-09', 'White-03', 'Red-17', 'Orange-14', 'Green-06']
const STRIP = ['Black-08', 'Blue-11', 'Red-07', 'Yellow-07', 'Blue-04']

const READ_LINES = [
  { text: 'We see it every day.', kind: 'en' },
  { text: 'So often that we stopped noticing it.', kind: 'en' },
  { text: '오랫동안 마주한 오염은 어느새 일상에 스며들고,', kind: 'ko' },
  { text: '우리는 그 변화마저 자연스러운 풍경으로 받아들인다.', kind: 'ko' },
]

type Palette = {
  key: string
  no: number
  name: string
  hex: string
  panel: string
  inset: string
  side: string
  object: WasteObject
  tagline: string[]
  tags: string
  ko1: string[]
  en: string[]
  ko2: string[]
}

const PALETTES: Palette[] = [
  {
    key: 'red',
    no: 1,
    name: 'RED',
    hex: '8B0113',
    panel: 'Red-13',
    inset: 'Red-07',
    side: 'Red-11',
    object: 'net-red',
    tagline: ['RED IS STILL A WARNING.', 'WE JUST STOPPED NOTICING IT.'],
    tags: 'VISIBLE / PERSISTENT / IGNORE',
    ko1: ['가장 먼저 눈에 들어오는 색,', '그리고 가장 쉽게 지나쳐버린 경고.'],
    en: [
      'THE COLOR WE STOPPED NOTICING.',
      'Once a color of warning,',
      'red now remains in the things we throw away.',
      'The warning is still there.',
      'We have simply learned to live with it.',
    ],
    ko2: [
      '우리가 수집한 풍경 속 빨강은',
      '버려진 플라스틱과 포장재, 생활용품 곳곳에 남아 있었다.',
      '위험을 알리는 색은 사라지지 않았지만,',
      '반복되는 풍경 속에서 우리는 그 경고에 익숙해졌다.',
    ],
  },
  {
    key: 'blue',
    no: 2,
    name: 'BLUE',
    hex: '247FF5',
    panel: 'Blue-08',
    inset: 'Blue-04',
    side: 'Blue-12',
    object: 'box-adidas',
    tagline: ['BLUE STILL LOOKS CLEAN.', 'WE JUST STOPPED QUESTIONING IT.'],
    tags: 'CLEAR / DISGUISED / POLLUTED',
    ko1: ['깨끗함을 떠올리게 하는 색,', '그리고 가장 조용히 오염을 감추는 색.'],
    en: [
      'THE COLOR WE MISTOOK FOR CLEAN.',
      'Once a color of clarity,',
      'blue now remains in the things we leave behind.',
      'The surface still looks clean.',
      'What lies beneath it does not.',
    ],
    ko2: [
      '우리가 수집한 풍경 속 파랑은',
      '버려진 페트병과 비닐, 일회용품 곳곳에 남아 있었다.',
      '깨끗함을 떠올리게 하는 색은 그대로였지만,',
      '그 아래 남겨진 오염은 더 이상 깨끗하지 않았다.',
    ],
  },
  {
    key: 'green',
    no: 3,
    name: 'GREEN',
    hex: '01602C',
    panel: 'Green-04',
    inset: 'Green-07',
    side: 'Green-09',
    object: 'net-green',
    tagline: ['GREEN STILL LOOKS NATURAL.', 'WE JUST STOPPED QUESTIONING IT.'],
    tags: 'NATURAL / BLENDED / ARTIFICIAL',
    ko1: ['자연을 떠올리게 하는 색,', '그리고 가장 자연스럽게 섞여버린 흔적.'],
    en: [
      'THE COLOR WE MISTOOK FOR NATURE.',
      'Once a color of nature,',
      'green now remains in the things we discard.',
      'It blends into the landscape.',
      'But belonging is not the same as being natural.',
    ],
    ko2: [
      '우리가 수집한 풍경 속 초록은',
      '버려진 병과 포장재, 생활용품 곳곳에 남아 있었다.',
      '자연을 닮은 색은 풍경 속에 쉽게 섞여들었지만,',
      '그곳에 어울려 보인다고 자연의 일부가 되는 것은 아니었다.',
    ],
  },
]

const chars = (text: string) =>
  [...text].map((c, i) => (
    <span key={i} className="about-type" aria-hidden="true">
      {c}
    </span>
  ))

// 글자가 한 자씩 찍히듯 나타난다
function useTyping(root: RefObject<HTMLElement | null>) {
  useLayoutEffect(() => {
    const el = root.current
    if (!el) return
    const ctx = gsap.context(() => {
      el.querySelectorAll<HTMLElement>('[data-type]').forEach((box) => {
        gsap.fromTo(
          box.querySelectorAll('.about-type'),
          { opacity: 0 },
          {
            opacity: 1,
            duration: 0.01,
            stagger: 0.045,
            ease: 'none',
            scrollTrigger: { trigger: box, start: 'top 85%', toggleActions: 'play none none reverse' },
          },
        )
      })
    }, el)
    return () => ctx.revert()
  }, [root])
}

// 첫 화면: 형광펜, 둥실거림, 비닐봉지 고정, 양옆에서 들어오는 사진, 한 줄씩 읽히는 문장, 가운데 사진 확대
function useIntro(root: RefObject<HTMLElement | null>) {
  useLayoutEffect(() => {
    const el = root.current
    if (!el) return
    const ctx = gsap.context(() => {
      gsap.utils.toArray<HTMLElement>('.about-mark').forEach((mark) => {
        gsap.fromTo(
          mark,
          { backgroundSize: '0% 100%' },
          {
            backgroundSize: '100% 100%',
            duration: 0.9,
            ease: 'power2.out',
            scrollTrigger: { trigger: mark, start: 'top bottom', toggleActions: 'play none none reverse' },
            delay: 0.4,
          },
        )
      })

      gsap.utils.toArray<HTMLElement>('.about-bob').forEach((node, i) => {
        gsap.to(node, { y: -10, duration: 2.2 + i * 0.3, ease: 'sine.inOut', yoyo: true, repeat: -1 })
      })

      gsap.to('.about-bag', {
        x: 19,
        y: 1225,
        scale: 0.96,
        ease: 'none',
        scrollTrigger: { trigger: '.about-hero', start: 'top top', end: '+=1225', scrub: true },
      })

      gsap.utils.toArray<HTMLElement>('.about-grid__cell').forEach((cell) => {
        const fromLeft = cell.dataset.side === 'left'
        gsap.from(cell, {
          x: fromLeft ? -420 : 420,
          opacity: 0,
          ease: 'power2.out',
          scrollTrigger: { trigger: cell, start: 'top 95%', end: 'top 60%', scrub: true },
        })
      })

      gsap.utils.toArray<HTMLElement>('.about-read__line').forEach((line) => {
        gsap
          .timeline({ scrollTrigger: { trigger: line, start: 'top 65%', end: 'top 35%', scrub: true } })
          .to(line, { color: '#000000', duration: 1 })
          .to(line, { color: '#9a9a9a', duration: 1 })
      })

      gsap.fromTo(
        '.about-strip__photo--center',
        { width: 360, height: 393 },
        {
          width: 486,
          height: 486,
          ease: 'none',
          scrollTrigger: { trigger: '.about-strip', start: 'top 80%', end: 'top 30%', scrub: true },
        },
      )
    }, el)
    return () => ctx.revert()
  }, [root])
}

// 색 구역: 차오르는 색, 옮겨 가는 사진, 시간차로 들어오는 줄, 빠져나오는 개체
function useColors(root: RefObject<HTMLElement | null>) {
  useLayoutEffect(() => {
    const el = root.current
    if (!el) return
    const ctx = gsap.context(() => {
      gsap.utils.toArray<HTMLElement>('.about-color').forEach((sec) => {
        const q = gsap.utils.selector(sec)
        const st = (start: string, end: string) => ({ trigger: sec, start, end, scrub: true })

        gsap.fromTo(q('.about-color__fill'), { scaleY: 0 }, { scaleY: 1, ease: 'none', scrollTrigger: st('top 90%', 'top 20%') })
        gsap.from(q('.about-color__name'), { yPercent: 110, opacity: 0, ease: 'power2.out', scrollTrigger: st('top 50%', 'top 10%') })
        gsap.from(q('.about-color__suffix'), { xPercent: -40, opacity: 0, ease: 'power2.out', scrollTrigger: st('top 45%', 'top 5%') })

        gsap
          .timeline({ scrollTrigger: st('top 20%', '+=1100') })
          .fromTo(q('.about-color__inset'), { x: 0, y: 0 }, { x: -470, y: 1123, ease: 'none' }, 0)
          .fromTo(q('.about-color__tint'), { opacity: 0 }, { opacity: 0.45, ease: 'none' }, 0)

        gsap.from(q('.about-color__tagline > *'), {
          x: 160,
          opacity: 0,
          stagger: 0.15,
          ease: 'power2.out',
          scrollTrigger: { trigger: q('.about-color__tagline')[0], start: 'top 85%', toggleActions: 'play none none reverse' },
        })
        gsap.from(q('.about-color__big'), {
          x: 600,
          opacity: 0,
          ease: 'power2.out',
          scrollTrigger: { trigger: q('.about-color__big')[0], start: 'top 100%', end: 'top 60%', scrub: true },
        })

        gsap.fromTo(
          q('.about-color__object'),
          { x: -560, y: -900, scale: 0.45, opacity: 0 },
          {
            x: 0,
            y: 0,
            scale: 1,
            opacity: 1,
            ease: 'power1.inOut',
            scrollTrigger: { trigger: q('.about-color__shells')[0], start: 'top 95%', end: 'top 25%', scrub: true },
          },
        )

        gsap.from(q('.about-color__line'), {
          x: -160,
          opacity: 0,
          stagger: 0.08,
          ease: 'power2.out',
          scrollTrigger: { trigger: q('.about-color__shells')[0], start: 'top 70%', toggleActions: 'play none none reverse' },
        })
      })
    }, el)
    return () => ctx.revert()
  }, [root])
}

function Callout({ side }: { side: 'left' | 'right' }) {
  const lines = side === 'left' ? CAPTION_LEFT : CAPTION_RIGHT
  return (
    <div className={`about-callout about-callout--${side}`}>
      <svg className="about-callout__stroke about-bob" viewBox="0 0 620 170" aria-hidden="true">
        {side === 'left' ? (
          <>
            <polyline points="611,9 461,9 402,104 113,104" />
            <circle cx="611" cy="9" r="7" />
            <circle cx="611" cy="9" r="3" className="about-callout__dot" />
          </>
        ) : (
          <>
            <polyline points="9,9 167,9 221,163 588,163" />
            <circle cx="9" cy="9" r="7" />
            <circle cx="9" cy="9" r="3" className="about-callout__dot" />
          </>
        )}
      </svg>
      <p className="about-callout__text" data-type aria-label={lines.join(' ')}>
        {lines.map((line, i) => (
          <span key={i} className="about-callout__line">
            {chars(line)}
          </span>
        ))}
      </p>
    </div>
  )
}

function ColorSection({ p }: { p: Palette }) {
  const style = { '--c': `#${p.hex}` } as CSSProperties
  return (
    <section className={`about-color about-color--${p.key}`} style={style} aria-label={p.name}>
      <div className="about-color__panel">
        <span className="about-color__fill" aria-hidden="true" />
        <h2 className="about-color__title">
          <span className="about-color__name">{p.name}</span>
          <span className="about-color__suffix">_COLOR</span>
        </h2>
        <p className="about-color__no">( {p.no} )</p>
      </div>
      <img className="about-color__photo about-color__photo--panel" src={photoSrc(p.panel)} alt="" />
      <img className="about-color__photo about-color__photo--side" src={photoSrc(p.side)} alt="" />

      <div className="about-color__inset">
        <img src={photoSrc(p.inset)} alt="" />
        <span className="about-color__tint" aria-hidden="true" />
      </div>

      <div className="about-color__tagline">
        <p className="about-color__key">( {p.name} )</p>
        {p.tagline.map((t) => (
          <p key={t} className="about-color__claim">
            {t}
          </p>
        ))}
        <p className="about-color__tags">{p.tags}</p>
      </div>
      <p className="about-color__big" aria-hidden="true">
        {p.name}
      </p>

      <div className="about-color__shells">
        <p className="about-color__label about-color__line">
          {p.name} <span className="about-color__hex"># {p.hex}</span>
        </p>
        <span className="about-color__rule about-color__rule--lead about-color__line" aria-hidden="true" />
        <h3 className="about-color__heading about-color__line">NETTED SHELLS</h3>
        <p className="about-color__ko about-color__ko--lead about-color__line">
          {p.ko1.map((t) => (
            <span key={t}>{t}</span>
          ))}
        </p>
        <p className="about-color__en about-color__line">
          {p.en.map((t) => (
            <span key={t}>{t}</span>
          ))}
        </p>
        <span className="about-color__rule about-color__rule--mid about-color__line" aria-hidden="true" />
        <p className="about-color__ko about-color__ko--tail about-color__line">
          {p.ko2.map((t) => (
            <span key={t}>{t}</span>
          ))}
        </p>
        <span className="about-color__rule about-color__rule--end about-color__line" aria-hidden="true" />
      </div>
      <img className={`about-color__object about-color__object--${p.key}`} src={objectSrc(p.object)} alt="" />
    </section>
  )
}

export function About() {
  const ref = useRef<HTMLElement>(null)
  useFitWidth(ref)
  useTyping(ref)
  useIntro(ref)
  useColors(ref)

  return (
    <main ref={ref} className="about">
      <section className="about-hero">
        <span className="about-hero__vline about-hero__vline--a" aria-hidden="true" />
        <span className="about-hero__vline about-hero__vline--b" aria-hidden="true" />
        {[319, 758, 1835, 2477].map((y) => (
          <span key={y} className="about-hero__hline" style={{ top: y }} aria-hidden="true" />
        ))}

        <h1 className="about-hero__title about-bob">
          <span className="about-mark">I</span>s the nature
        </h1>

        <div className="about-bag">
          <img className="about-bob" src={objectSrc('bag-blue')} alt="" />
        </div>

        <p className="about-hero__ask">
          우리가 보는 자연은
          <br />
          진짜 자연의 모습인가
        </p>

        <Callout side="left" />
        <Callout side="right" />

        <p className="about-hero__seeing about-bob">
          <span className="about-mark">we are seeing tru</span>ly nature?
        </p>

        <p className="about-hero__question" data-type aria-label={QUESTION}>
          {chars(QUESTION)}
        </p>

        <div className="about-grid">
          {GRID_LEFT.map((name, i) => (
            <img
              key={name + i}
              className="about-grid__cell"
              data-side="left"
              src={photoSrc(name)}
              alt=""
              style={{ left: 62 + (i % 2) * 292, top: 1322 + Math.floor(i / 2) * 244 }}
            />
          ))}
          {GRID_RIGHT.map((name, i) => (
            <img
              key={name + i}
              className="about-grid__cell"
              data-side="right"
              src={photoSrc(name)}
              alt=""
              style={{ left: 1302 + (i % 2) * 292, top: 1322 + Math.floor(i / 2) * 244 }}
            />
          ))}
        </div>

        <div className="about-read">
          {READ_LINES.map((l) => (
            <p key={l.text} className={`about-read__line about-read__line--${l.kind}`}>
              {l.text}
            </p>
          ))}
        </div>

        <div className="about-strip">
          {STRIP.map((name, i) => (
            <img
              key={name + i}
              className={`about-strip__photo${i === 2 ? ' about-strip__photo--center' : ''}`}
              src={photoSrc(name)}
              alt=""
            />
          ))}
        </div>
      </section>

      {PALETTES.map((p) => (
        <ColorSection key={p.key} p={p} />
      ))}
    </main>
  )
}
