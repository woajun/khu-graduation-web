import { useEffect, useRef } from 'react'

// 빈 자리에 멈춰 있으면 커서가 커지며 띄우는 안내. 한글로 쳤다가 지우고 영어로 다시 친다
export type CursorTip = { ko: readonly string[]; en: readonly string[] }

// 이 시간 동안 움직이지 않으면 안내를 띄운다(ms)
const IDLE_MS = 2000
// 손이 살짝 떨리는 정도는 움직임으로 치지 않는다(px)
const IDLE_SLOP = 3
// 타자 속도: 한글 한 타(자모 하나), 영어 한 글자, 글자 하나 지우는 간격,
// 한글을 다 친 뒤 지우기 전까지 기다리는 시간(ms)
const KO_TYPE_MS = 22
const EN_TYPE_MS = 26
const ERASE_MS = 14
const HOLD_MS = 1000
// 줄을 다 치고 다음 줄로 넘어가기 전 잠깐 쉬는 시간(ms)
const LINE_PAUSE_MS = 120

const CHOSEONG = 'ㄱㄲㄴㄷㄸㄹㅁㅂㅃㅅㅆㅇㅈㅉㅊㅋㅌㅍㅎ'

/** 한글 한 글자를 치는 순서대로 쪼갠다. '픽' → ㅍ, 피, 픽 */
function keystrokes(ch: string): string[] {
  const code = ch.charCodeAt(0) - 0xac00
  if (code < 0 || code > 11171) return [ch]
  const cho = Math.floor(code / 588)
  const jung = Math.floor((code % 588) / 28)
  const open = String.fromCharCode(0xac00 + cho * 588 + jung * 28)
  return code % 28 ? [CHOSEONG[cho], open, ch] : [CHOSEONG[cho], ch]
}

type Frame = { lines: string[]; caret: number; wait: number }

/** 한글 타자 → 잠깐 멈춤 → 뒤에서부터 지우기 → 영어 타자 순서로 화면에 보일 상태를 만든다 */
function tipFrames({ ko, en }: CursorTip): Frame[] {
  const frames: Frame[] = []
  const lines = ko.map(() => '')
  const push = (caret: number, wait: number) => frames.push({ lines: [...lines], caret, wait })
  const type = (text: readonly string[], split: (ch: string) => string[], ms: number) =>
    text.forEach((line, i) => {
      for (const ch of line) {
        const done = lines[i]
        for (const stroke of split(ch)) {
          lines[i] = done + stroke
          push(i, ms)
        }
      }
      frames[frames.length - 1].wait = LINE_PAUSE_MS
    })

  type(ko, keystrokes, KO_TYPE_MS)
  frames[frames.length - 1].wait = HOLD_MS
  for (let i = lines.length - 1; i >= 0; i--)
    while (lines[i]) {
      lines[i] = [...lines[i]].slice(0, -1).join('')
      push(i, ERASE_MS)
    }
  type(en, (ch) => [ch], EN_TYPE_MS)
  return frames
}

// 브라우저 기본 cursor 이미지는 128px 제한이 있어 DOM 요소로 커서를 대체
export function Cursor({ tip }: { tip?: CursorTip }) {
  const ref = useRef<HTMLDivElement>(null)
  const linesRef = useRef<(HTMLSpanElement | null)[]>([])

  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (!matchMedia('(pointer: fine)').matches) return

    document.documentElement.classList.add('has-cursor')

    let idleTimer = 0
    let typeTimer = 0
    let rest: { x: number; y: number } | null = null

    const show = (frame: Frame) =>
      linesRef.current.forEach((span, i) => {
        if (!span) return
        span.textContent = frame.lines[i] ?? ''
        span.parentElement!.classList.toggle('is-empty', !frame.lines[i])
        span.parentElement!.classList.toggle('is-typing', frame.caret === i)
      })
    const play = (frames: Frame[], i = 0) => {
      show(frames[i])
      if (i + 1 < frames.length) typeTimer = window.setTimeout(() => play(frames, i + 1), frames[i].wait)
    }
    const startIdle = () => {
      if (!tip) return
      el.classList.add('is-idle')
      const frames = tipFrames(tip)
      // 움직임을 줄이는 설정이면 타자 없이 영어 안내만 보여준다
      if (matchMedia('(prefers-reduced-motion: reduce)').matches) show({ ...frames[frames.length - 1], caret: -1 })
      else play(frames)
    }
    const stopIdle = () => {
      clearTimeout(idleTimer)
      clearTimeout(typeTimer)
      if (!el.classList.contains('is-idle')) return
      el.classList.remove('is-idle')
      show({ lines: [], caret: -1, wait: 0 })
    }

    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== 'mouse') return
      // 1920 기준 크기라 좁은 화면에서는 화면 축소(useFitWidth)와 같은 비율로 줄인다
      const scale = Math.min(1, document.documentElement.clientWidth / 1920)
      el.style.transform = `translate3d(${e.clientX}px, ${e.clientY}px, 0) translate(-50%, -50%) scale(${scale})`
      el.classList.add('is-visible')

      if (rest && Math.hypot(e.clientX - rest.x, e.clientY - rest.y) <= IDLE_SLOP) return
      stopIdle()
      rest = { x: e.clientX, y: e.clientY }
      // data-cursor-idle 이 붙은 요소 바로 위(그 안의 칸·버튼이 아닌 빈 자리)에 멈춰 있을 때만 안내를 띄운다
      if (tip && e.target instanceof Element && e.target.hasAttribute('data-cursor-idle'))
        idleTimer = window.setTimeout(startIdle, IDLE_MS)
    }
    const onLeave = () => {
      el.classList.remove('is-visible')
      stopIdle()
      rest = null
    }

    addEventListener('pointermove', onMove, { passive: true })
    document.documentElement.addEventListener('pointerleave', onLeave)
    // 클릭하면 안내를 거둔다
    addEventListener('pointerdown', stopIdle)

    return () => {
      stopIdle()
      removeEventListener('pointermove', onMove)
      removeEventListener('pointerdown', stopIdle)
      document.documentElement.removeEventListener('pointerleave', onLeave)
      document.documentElement.classList.remove('has-cursor')
    }
  }, [tip])

  return (
    <div ref={ref} className="cursor" aria-hidden="true">
      {tip && (
        <div className="cursor__tips">
          {tip.ko.map((_, i) => (
            <p key={i} className="cursor__tip is-empty">
              <span
                ref={(span) => {
                  linesRef.current[i] = span
                }}
              />
            </p>
          ))}
        </div>
      )}
    </div>
  )
}
