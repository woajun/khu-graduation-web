import { useEffect, useRef, type ReactNode } from 'react'
import gsap from 'gsap'
import { LENS_STOPS } from '../lib/lensPath'
import { measureCuts } from '../lib/cuts'

type Props = { children: ReactNode }

type Key = { at: number; x: number; y: number }

/**
 * 컷 위치에 렌즈 정차 지점을 하나씩 붙인다.
 * 컷이 끝난 뒤(아카이브 자유 스크롤 구간)에는 남은 지점을 한 화면 간격으로 이어 붙여
 * 원이 오른쪽으로 빠져나가게 한다.
 */
function buildKeys(cuts: number[]): Key[] {
  const keys: Key[] = cuts.map((at, i) => {
    const stop = LENS_STOPS[Math.min(i, LENS_STOPS.length - 1)]
    return { at, x: stop.x, y: stop.y }
  })

  let at = cuts[cuts.length - 1] ?? 0
  for (let i = cuts.length; i < LENS_STOPS.length; i++) {
    at += innerHeight
    keys.push({ at, x: LENS_STOPS[i].x, y: LENS_STOPS[i].y })
  }

  return keys
}

/** 컷 사이를 부드럽게 잇는다. */
const smoothstep = (t: number) => t * t * (3 - 2 * t)

/**
 * 자유 스크롤 구간에서 원이 목표 지점을 따라잡는 속도.
 * 컷 구간은 스크롤 자체가 이징된 트윈이라 그대로 따라가면 되지만, 자유 구간의
 * 네이티브 스크롤은 휠 눈금마다 뚝뚝 끊겨서 원도 같이 튄다. 여기서만 감쇠를 건다.
 */
const FREE_LERP = 0.09

function sample(keys: Key[], scroll: number) {
  if (keys.length === 0) return { x: 50, y: 50 }
  if (scroll <= keys[0].at) return keys[0]

  for (let i = 1; i < keys.length; i++) {
    const b = keys[i]
    if (scroll > b.at) continue

    const a = keys[i - 1]
    const span = b.at - a.at
    const t = span <= 0 ? 1 : smoothstep((scroll - a.at) / span)
    return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t }
  }

  return keys[keys.length - 1]
}

/**
 * 원형 인버전 렌즈.
 *
 * 같은 내용을 두 벌 그린다. 밝은 레이어는 평범한 문서 흐름이고, 어두운 레이어는 그 위에
 * 절대 위치로 포개진 뒤 clip-path 로 원만 남긴다. 두 레이어의 DOM 이 동일하므로 높이도
 * 스크롤 위치도 저절로 맞는다 — 따로 동기화할 게 없다.
 *
 * 원의 자리는 컷마다 정해져 있고(lensPath.ts), 컷이 넘어가는 동안 그 사이를 지나간다.
 * clip-path 좌표는 어두운 레이어의 박스(=문서 전체) 기준이라 세로값에 scrollY 를 더한다.
 *
 * 위치 갱신은 GSAP 티커에 얹는다. 컷 전환은 GSAP 트윈이 scrollTo 를 부르는 방식이라,
 * 별도 rAF 로 돌리면 트윈보다 먼저 실행돼 한 프레임 전의 scrollY 를 읽는다. 그러면
 * 전환 중에만 프레임당 스크롤 속도만큼 원이 떠올랐다가 속도가 0 이 되는 끝에서
 * 제자리로 돌아온다. 티커에 나중에 등록된 콜백은 트윈이 스크롤을 옮긴 뒤에 돈다.
 */
export function Lens({ children }: Props) {
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const root = rootRef.current
    if (!root) return
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return

    let keys: Key[] = []
    let deckEnd = 0
    let curX = NaN
    let curY = NaN
    let lastX = NaN
    let lastY = NaN

    // 이미지가 늦게 떠서 컷 위치가 밀리면 경로도 같이 다시 잰다.
    // 매 프레임 offsetHeight 를 읽으면 강제 리플로우가 걸리므로 관찰자에게 맡긴다.
    const remeasure = () => {
      const cuts = measureCuts()
      deckEnd = cuts[cuts.length - 1] ?? 0
      keys = buildKeys(cuts)
    }
    remeasure()
    const observer = new ResizeObserver(remeasure)
    observer.observe(root)
    addEventListener('resize', remeasure)

    const tick = () => {
      const target = sample(keys, scrollY)

      if (Number.isNaN(curX) || scrollY <= deckEnd) {
        // 컷 구간: 스크롤 트윈이 이미 부드러우니 그대로 따라간다
        curX = target.x
        curY = target.y
      } else {
        curX += (target.x - curX) * FREE_LERP
        curY += (target.y - curY) * FREE_LERP
      }

      const px = (curX / 100) * innerWidth
      const py = (curY / 100) * innerHeight + scrollY
      // 값이 그대로면 건드리지 않는다. 같은 값을 다시 써도 스타일 재계산이 돈다.
      if (px === lastX && py === lastY) return

      lastX = px
      lastY = py
      root.style.setProperty('--lx', `${px}px`)
      root.style.setProperty('--ly', `${py}px`)
    }

    gsap.ticker.add(tick)
    return () => {
      observer.disconnect()
      removeEventListener('resize', remeasure)
      gsap.ticker.remove(tick)
    }
  }, [])

  return (
    <div className="lens" ref={rootRef}>
      <div className="lens__layer lens__layer--light">{children}</div>
      <div className="lens__layer lens__layer--dark" aria-hidden="true">
        {children}
      </div>
    </div>
  )
}
