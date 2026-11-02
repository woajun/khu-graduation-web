import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties, type RefObject } from 'react'
import gsap from 'gsap'
import { asset } from '../lib/assets'
import { CELL, cellSize, GACHA_CELLS, type GachaCell } from '../lib/gachaCells'

function useBoard() {
  const [board, setBoard] = useState(() => ({ cell: 180, cols: 11, rows: 6 }))

  useEffect(() => {
    const measure = () => {
      // 스크롤바 폭을 빼려고 innerWidth 대신 clientWidth 를 쓴다
      const { clientWidth: w, clientHeight: h } = document.documentElement
      const cell = cellSize(w)
      setBoard({ cell, cols: Math.ceil(w / cell), rows: Math.ceil(h / cell) })
    }
    measure()
    addEventListener('resize', measure)
    return () => removeEventListener('resize', measure)
  }, [])

  return board
}

// 피그마 가챠 화면처럼 칸 크기를 섞는다. chip 은 칸 한쪽 모서리에 붙는 작은 정사각형(칸의 37%)
type Size = 'chip' | '1x1' | '2x1' | '2x2'
const SIZE_SPAN: Record<Size, readonly [cols: number, rows: number]> = {
  chip: [1, 1],
  '1x1': [1, 1],
  '2x1': [2, 1],
  '2x2': [2, 2],
}
// 종류마다 크기가 나올 비중. 사진은 칸을 꽉 채우고, 컬러칩은 작은 칩이 가장 많다
const SIZE_WEIGHTS: Record<GachaCell['kind'], Partial<Record<Size, number>>> = {
  photo: { '1x1': 5, '2x2': 2, '2x1': 1 },
  color: { chip: 4, '1x1': 2, '2x1': 2, '2x2': 1 },
}
const CHIP_RATIO = 0.37

type PlacedCell = GachaCell & {
  size: Size
  // chip 이 붙는 모서리 (0 이면 왼쪽·위, 1 이면 오른쪽·아래)
  corner: readonly [x: 0 | 1, y: 0 | 1]
}

/** 비중대로 크기를 하나 고르고, 안 들어갈 때 쓸 나머지 크기를 작은 순으로 뒤에 붙인다 */
function sizeOrder(kind: GachaCell['kind']): Size[] {
  const weights = Object.entries(SIZE_WEIGHTS[kind]) as [Size, number][]
  let pick = Math.random() * weights.reduce((sum, [, w]) => sum + w, 0)
  const first = weights.find(([, w]) => (pick -= w) < 0)?.[0] ?? weights[0][0]
  const rest = weights
    .map(([size]) => size)
    .filter((size) => size !== first)
    .sort((x, y) => SIZE_SPAN[x][0] * SIZE_SPAN[x][1] - SIZE_SPAN[y][0] * SIZE_SPAN[y][1])
  return [first, ...rest]
}

/**
 * 칸마다 크기를 랜덤으로 정해 겹치지 않게 배치한다.
 * keep 이면 원래 자리를 먼저 쓰고, 자리가 없을 때만 빈 곳을 찾는다
 */
function place(cells: readonly GachaCell[], cols: number, rows: number, keep: boolean): PlacedCell[] {
  const taken = new Set<string>()
  // 첫 줄은 헤더 자리라 비운다
  const fits = (row: number, col: number, [w, h]: readonly [number, number]) => {
    if (row < 1 || col < 0 || row + h > rows || col + w > cols) return false
    for (let r = row; r < row + h; r++)
      for (let c = col; c < col + w; c++) if (taken.has(`${r}:${c}`)) return false
    return true
  }
  const take = (row: number, col: number, [w, h]: readonly [number, number]) => {
    for (let r = row; r < row + h; r++) for (let c = col; c < col + w; c++) taken.add(`${r}:${c}`)
  }
  const corner = () => [Math.round(Math.random()), Math.round(Math.random())] as [0 | 1, 0 | 1]

  return cells.map((cell) => {
    const sizes = sizeOrder(cell.kind)
    if (keep) {
      const size = sizes.find((s) => fits(cell.row, cell.col, SIZE_SPAN[s]))
      if (size) {
        take(cell.row, cell.col, SIZE_SPAN[size])
        return { ...cell, size, corner: corner() }
      }
    }
    for (const size of sizes) {
      for (let tries = 0; tries < 200; tries++) {
        const row = Math.floor(Math.random() * rows)
        const col = Math.floor(Math.random() * cols)
        if (!fits(row, col, SIZE_SPAN[size])) continue
        take(row, col, SIZE_SPAN[size])
        return { ...cell, row, col, size, corner: corner() }
      }
    }
    return { ...cell, size: 'chip', corner: corner() }
  })
}

/** 크기에 맞춰 칸의 left, top, width, height 를 px 로 계산한다 */
function cellBox(cell: PlacedCell, cellPx: number) {
  if (cell.size === 'chip') {
    const chip = Math.round(cellPx * CHIP_RATIO)
    return {
      left: cell.col * cellPx + cell.corner[0] * (cellPx - chip),
      top: cell.row * cellPx + cell.corner[1] * (cellPx - chip),
      width: chip,
      height: chip,
    }
  }
  const [w, h] = SIZE_SPAN[cell.size]
  return { left: cell.col * cellPx, top: cell.row * cellPx, width: w * cellPx, height: h * cellPx }
}

// start 버튼이 떠다니는 속도(px/초). 1920 기준 값
const DRIFT_SPEED = 60
const DRIFT_MIN_DURATION = 4
// 화면을 3×3 으로 나눠 9칸을 한 번씩 다 돌고 나서 다시 섞는다
const DRIFT_GRID = 3
// x, y 에 서로 다른 ease 를 걸어 칸 사이를 직선이 아닌 곡선으로 지나간다
const DRIFT_EASES = ['sine.inOut', 'power2.inOut'] as const
// hover 하면 이 시간 동안 서서히 멈추고, 떠나면 다시 같은 시간 동안 출발한다
const DRIFT_BRAKE = 0.5
const APPEAR_DURATION = 0.8

/** start 버튼을 화면 안 아무 곳에 띄운 뒤 9분할한 칸을 골고루 돌며 유기적으로 떠다니게 한다 */
function useDrift(ref: RefObject<HTMLButtonElement | null>, cellPx: number) {
  useEffect(() => {
    const el = ref.current
    if (!el) return

    const scale = cellPx / CELL
    // 피그마 start 컴포넌트의 1px (app.css 의 --k 와 같은 값)
    const k = 0.98276 * scale
    // hover 모양은 기본 박스보다 위로 10, 오른쪽으로 22 만큼 커진다. 첫 줄은 헤더 자리라 비운다
    const bounds = () => {
      const { clientWidth: w, clientHeight: h } = document.documentElement
      return {
        minX: 16 * scale,
        maxX: Math.max(16 * scale, w - el.offsetWidth - 22 * k - 16 * scale),
        minY: cellPx + 10 * k,
        maxY: Math.max(cellPx + 10 * k, h - el.offsetHeight - 16 * scale),
      }
    }
    // 9칸을 섞은 주머니에서 하나씩 꺼낸다. 다시 채울 땐 방금 있던 칸이 바로 또 나오지 않게 한다
    let bag: number[] = []
    let zone = -1
    const nextPoint = () => {
      if (bag.length === 0) {
        bag = gsap.utils.shuffle([...Array(DRIFT_GRID * DRIFT_GRID).keys()])
        if (bag[bag.length - 1] === zone) bag.unshift(bag.pop()!)
      }
      zone = bag.pop()!
      const { minX, maxX, minY, maxY } = bounds()
      const cw = (maxX - minX) / DRIFT_GRID
      const ch = (maxY - minY) / DRIFT_GRID
      const col = zone % DRIFT_GRID
      const row = Math.floor(zone / DRIFT_GRID)
      return {
        x: minX + cw * (col + gsap.utils.random(0.15, 0.85)),
        y: minY + ch * (row + gsap.utils.random(0.15, 0.85)),
      }
    }

    gsap.set(el, nextPoint())
    const appear = gsap.fromTo(
      el,
      { opacity: 0, scale: 0.85 },
      { opacity: 1, scale: 1, duration: APPEAR_DURATION, ease: 'power2.out' },
    )

    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return () => void appear.kill()

    const tweens: Partial<Record<'x' | 'y', gsap.core.Tween>> = {}
    // 멈추는 도중에 새로 시작하는 tween 도 같은 속도를 따르도록 속도를 한곳에 둔다
    const speed = { value: 1 }
    const wander = () => {
      const from = { x: gsap.getProperty(el, 'x') as number, y: gsap.getProperty(el, 'y') as number }
      const to = nextPoint()
      const distance = Math.hypot(to.x - from.x, to.y - from.y)
      const duration = Math.max(DRIFT_MIN_DURATION, distance / (DRIFT_SPEED * scale))
      // 어느 축에 어떤 ease 를 걸지 매번 바꿔서 휘는 방향이 달라진다
      const [easeX, easeY] = gsap.utils.shuffle([...DRIFT_EASES])
      tweens.x = gsap.to(el, { x: to.x, duration, ease: easeX }).timeScale(speed.value)
      tweens.y = gsap
        .to(el, { y: to.y, duration, ease: easeY, onComplete: wander })
        .timeScale(speed.value)
    }
    wander()

    let brake: gsap.core.Tween | undefined
    const setSpeed = (timeScale: number) => {
      brake?.kill()
      brake = gsap.to(speed, {
        value: timeScale,
        duration: DRIFT_BRAKE,
        ease: 'power1.out',
        onUpdate: () => Object.values(tweens).forEach((t) => t.timeScale(speed.value)),
      })
    }
    const stop = () => setSpeed(0)
    const go = () => setSpeed(1)
    el.addEventListener('mouseenter', stop)
    el.addEventListener('mouseleave', go)

    return () => {
      el.removeEventListener('mouseenter', stop)
      el.removeEventListener('mouseleave', go)
      appear.kill()
      brake?.kill()
      tweens.x?.kill()
      tweens.y?.kill()
    }
  }, [ref, cellPx])
}

export function Gacha() {
  const { cell: cellPx, cols, rows } = useBoard()
  const [drawn, setDrawn] = useState<readonly PlacedCell[] | null>(null)
  const [drawing, setDrawing] = useState(false)
  const startRef = useRef<HTMLButtonElement>(null)
  useDrift(startRef, cellPx)

  // 화면이 시안 배치(11×6)를 다 담으면 원래 자리를 살리고 크기만 랜덤으로 바꾼다
  const fitsDesign = cols >= 11 && rows >= 6
  const initial = useMemo(() => place(GACHA_CELLS, cols, rows, fitsDesign), [cols, rows, fitsDesign])
  const cells = drawn ?? initial

  const draw = useCallback(() => {
    if (drawing) return
    setDrawing(true)
    setDrawn(place(GACHA_CELLS, cols, rows, false))
    setTimeout(() => setDrawing(false), 600)
  }, [cols, rows, drawing])

  const boardStyle = useMemo(
    () => ({ backgroundSize: `${cellPx}px ${cellPx}px` }) as const,
    [cellPx],
  )

  return (
    <main
      className="gacha"
      aria-label="가챠"
      // start 버튼이 칸과 같은 비율로 줄어들도록 1920 기준 배율을 넘긴다
      style={{ '--gacha-scale': cellPx / CELL } as CSSProperties}
    >
      <div className="gacha__board" style={boardStyle} aria-hidden="true">
        {cells.map((cell, i) => (
          <div
            key={`${cell.kind}-${i}`}
            className={`gacha__cell${drawing ? ' is-drawing' : ''}`}
            style={{
              ...cellBox(cell, cellPx),
              transitionDelay: `${(i % 7) * 40}ms`,
              ...(cell.kind === 'color' ? { background: cell.color } : null),
            }}
          >
            {cell.kind === 'photo' && (
              <img className="gacha__photo" src={asset(cell.src)} alt="" loading="lazy" />
            )}
          </div>
        ))}
      </div>

      <button ref={startRef} type="button" className="gacha__start" onClick={draw} disabled={drawing}>
        {/* 피그마 start 버튼: 평소엔 직사각형, hover 하면 모서리가 잘린 입체 박스로 바뀐다 */}
        <svg className="gacha__start-box" viewBox="0 0 272 175" aria-hidden="true">
          <path className="gacha__start-shape" />
        </svg>
        <span className="gacha__start-label">start</span>
        <svg className="gacha__start-arrow" viewBox="0 0 57 24" aria-hidden="true">
          <path d="M0 11.692L0 13.2798L55.4101 13.2798V11.692V10.1042L0 10.1042L0 11.692ZM56.5328 12.8147C57.1529 12.1947 57.1529 11.1893 56.5328 10.5693L46.4283 0.464693C45.8082 -0.155375 44.8029 -0.155375 44.1828 0.464693C43.5627 1.08476 43.5627 2.09009 44.1828 2.71015L53.1646 11.692L44.1828 20.6739C43.5627 21.2939 43.5627 22.2993 44.1828 22.9193C44.8029 23.5394 45.8082 23.5394 46.4283 22.9193L56.5328 12.8147Z" />
        </svg>
      </button>
    </main>
  )
}
