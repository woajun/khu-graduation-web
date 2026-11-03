import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type CSSProperties, type RefObject } from 'react'
import gsap from 'gsap'
import type { CursorTip } from '../components/Cursor'
import { asset } from '../lib/assets'
import { addChip, loadChips, type GachaChip } from '../lib/gachaChips'
import { CELL, cellSize, GACHA_CELLS, type GachaCell } from '../lib/gachaCells'
import { thumbSrc, WASTE_PHOTOS } from '../lib/waste'
import { bigName, GachaResult, pickColor, type Picked, type Registered } from './GachaResult'

function useBoard() {
  const [board, setBoard] = useState(() => ({ cell: 180, cols: 11, rows: 6, fullCols: 10, fullRows: 6 }))

  useEffect(() => {
    const measure = () => {
      // 스크롤바 폭을 빼려고 innerWidth 대신 clientWidth 를 쓴다
      const { clientWidth: w, clientHeight: h } = document.documentElement
      const cell = cellSize(w)
      // 화면 끝에서 잘리는 칸까지 센 수와, 다 보이는 칸만 센 수
      setBoard({
        cell,
        cols: Math.ceil(w / cell),
        rows: Math.ceil(h / cell),
        fullCols: Math.floor(w / cell),
        fullRows: Math.floor(h / cell),
      })
    }
    measure()
    addEventListener('resize', measure)
    return () => removeEventListener('resize', measure)
  }, [])

  return board
}

// 피그마 가챠 화면처럼 칸 크기를 섞는다. chip 은 칸 한쪽 모서리에 붙는 작은 정사각형(칸의 37%, 피그마 140:8101)
// text 는 박스 없이 색 이름과 '@작성자' 만 2×2 자리에 쓴다 (피그마 140:8128)
type Size = 'chip' | '1x1' | '2x1' | '2x2' | 'text'
const SIZE_SPAN: Record<Size, readonly [cols: number, rows: number]> = {
  chip: [1, 1],
  '1x1': [1, 1],
  '2x1': [2, 1],
  '2x2': [2, 2],
  text: [2, 2],
}
// 종류마다 크기가 나올 비중. 사진은 칸을 꽉 채우고, 컬러칩은 작은 칩이 가장 많다
const SIZE_WEIGHTS: Record<GachaCell['kind'], Partial<Record<Size, number>>> = {
  photo: { '1x1': 5, '2x2': 2, '2x1': 1 },
  color: { chip: 4, '1x1': 2, '2x1': 2, '2x2': 1, text: 2 },
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
 * keep 이면 원래 자리를 먼저 쓰고, 자리가 없을 때만 빈 곳을 찾는다.
 * 텍스트만 있는 칸은 글자가 잘리지 않게 화면 끝에서 잘리는 칸(full 바깥)에는 두지 않는다
 */
function place(
  cells: readonly GachaCell[],
  cols: number,
  rows: number,
  keep: boolean,
  full: { cols: number; rows: number },
): PlacedCell[] {
  const taken = new Set<string>()
  // 첫 줄은 헤더 자리라 비운다
  const fits = (row: number, col: number, size: Size) => {
    const [w, h] = SIZE_SPAN[size]
    const [maxCols, maxRows] = size === 'text' ? [full.cols, full.rows] : [cols, rows]
    if (row < 1 || col < 0 || row + h > maxRows || col + w > maxCols) return false
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
      const size = sizes.find((s) => fits(cell.row, cell.col, s))
      if (size) {
        take(cell.row, cell.col, SIZE_SPAN[size])
        return { ...cell, size, corner: corner() }
      }
    }
    for (const size of sizes) {
      for (let tries = 0; tries < 200; tries++) {
        const row = Math.floor(Math.random() * rows)
        const col = Math.floor(Math.random() * cols)
        if (!fits(row, col, size)) continue
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

// start 를 누른 뒤 사진·컬러칩이 사라지는 리듬. 한 번에 1~2개씩, 묶음 사이 간격만큼 기다린다
const VANISH_GAP = 0.09
const VANISH_DURATION = 0.18

/** 칸들을 무작위 순서로 섞어 1~2개씩 묶은 뒤 빠르게 차례로 지우고, last 는 맨 마지막에 지운다 */
function vanish(els: HTMLElement[], last?: HTMLElement | null) {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches
  const order = gsap.utils.shuffle(els)
  if (last) order.push(last)
  const tl = gsap.timeline()
  for (let i = 0, at = 0; i < order.length; at += VANISH_GAP) {
    const count = Math.random() < 0.5 ? 1 : 2
    tl.to(
      order.slice(i, i + count),
      { autoAlpha: 0, scale: reduce ? 1 : 0.85, duration: reduce ? 0 : VANISH_DURATION, ease: 'power2.in' },
      reduce ? 0 : at,
    )
    i += count
  }
  return tl
}

// 다 사라진 뒤 아카이빙 사진이 채워지는 리듬
// 대각선 한 줄(행+열이 같은 칸들)마다 늦어지는 시간과 사진 하나가 나타나는 시간
const ARCHIVE_STEP = 0.045
const ARCHIVE_DURATION = 0.28

type ArchiveTile = { name: string; row: number; col: number }

/** 격자의 모든 칸을 아카이빙 사진으로 빈칸 없이 채운다. 사진은 섞어서 겹치지 않게 고른다 */
function layoutArchive(cols: number, rows: number): ArchiveTile[] {
  const names = gsap.utils.shuffle(WASTE_PHOTOS.map((p) => p.name))
  const tiles: ArchiveTile[] = []
  for (let row = 0; row < rows; row++)
    for (let col = 0; col < cols; col++)
      tiles.push({ name: names[tiles.length % names.length], row, col })
  return tiles
}

/** 박스 없이 쓰는 컬러칩 이름. 결과 화면처럼 영어는 띄어쓰기마다 줄을 바꾼다 */
function ChipText({ name, author }: { name: string; author?: string }) {
  const big = bigName(name)
  return (
    <>
      <p className={`gacha__chip-name${big.ko ? ' is-ko' : ''}`}>{big.text}</p>
      {author && <p className="gacha__chip-by">@{author}</p>}
    </>
  )
}

// 컬러칩에 hover 하면 2×2 로 커지는 시간과, 커진 뒤 글자가 나타나는 시간
const HOVER_GROW = 0.35
const HOVER_TEXT = 0.25
// 줄어들 때는 글자를 먼저 빠르게 지우고, 박스는 칩 자리로 부드럽게 접혀 칩과 그대로 겹친다
const HOVER_TEXT_OUT = 0.12
const HOVER_SHRINK = 0.4
// 텍스트만 있는 칸은 크기가 그대로라, 마우스가 들어온 자리에서 색이 번지듯 원으로 채우고 글자색을 함께 바꾼다
const FILL_IN = 0.6
const FILL_OUT = 0.45
const TEXT_INK = '#000000'

/** 배경색이 밝으면 검은 글자, 어두우면 흰 글자 (상대 휘도 기준) */
function inkOn(hex: string) {
  const [r, g, b] = [1, 3, 5].map((i) => {
    const c = parseInt(hex.slice(i, i + 2), 16) / 255
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
  })
  return 0.2126 * r + 0.7152 * g + 0.0722 * b > 0.4 ? '#030303' : '#ffffff'
}

// 메인 화면 빈 칸에 커서를 2초 넘게 두면 커서 옆에 띄우는 안내 (피그마 140:7613)
export const GACHA_CURSOR_TIP: CursorTip = {
  ko: ['랜덤으로 나만의 컬러를 뽑아보세요.', '뽑은 컬러에 직접 이름을 지어줄 수 있어요.'],
  en: ['Pick your color at random.', 'You can assign your own color names.'],
}

// 메인 화면에 깔리는 사진은 시안 그대로, 컬러칩은 등록된 것 중에서만 고른다
const PHOTO_CELLS = GACHA_CELLS.filter((c) => c.kind === 'photo')
// 등록된 칩이 많아도 화면이 붐비지 않게 한 번에 보여주는 최대 개수 (시안의 컬러칩 7개와 비슷하게)
const MAX_COLORS = 8
// 등록을 마치고 메인으로 돌아올 때 사진·컬러칩이 다시 나타나는 리듬
const RETURN_STAGGER = 0.05
const RETURN_DURATION = 0.4

/** 등록된 칩을 섞어 MAX_COLORS 개까지 고른다. 방금 등록한 칩은 꼭 넣는다. 자리는 place 가 랜덤으로 정한다 */
function chipCells(chips: readonly GachaChip[], featured?: string): GachaCell[] {
  const mine = chips.filter((c) => c.id === featured)
  const others = gsap.utils.shuffle(chips.filter((c) => c.id !== featured))
  return [...mine, ...others]
    .slice(0, MAX_COLORS)
    .map((c) => ({ row: -1, col: -1, kind: 'color', color: c.color, name: c.name, author: c.author }))
}

/**
 * 가챠 한 판. 최종 OK 로 컬러칩을 등록하면 새 판으로 바꿔(key) start 버튼과 배치를 처음 상태로 되돌린다
 */
export function Gacha() {
  const [chips, setChips] = useState(loadChips)
  const [round, setRound] = useState<{ n: number; featured?: string }>({ n: 0 })
  const register = useCallback(
    (chip: Registered) => {
      const list = addChip(chips, chip)
      setChips(list)
      setRound((r) => ({ n: r.n + 1, featured: list[list.length - 1].id }))
    },
    [chips],
  )
  return (
    <GachaRound
      key={round.n}
      chips={chips}
      featured={round.featured}
      returning={round.n > 0}
      onRegister={register}
    />
  )
}

type RoundProps = {
  chips: readonly GachaChip[]
  featured?: string
  returning: boolean
  onRegister: (chip: Registered) => void
}

function GachaRound({ chips, featured, returning, onRegister }: RoundProps) {
  const { cell: cellPx, cols, rows, fullCols, fullRows } = useBoard()
  // start 를 누르면 화면이 어두워지고 사진·컬러칩이 하나둘씩 사라진다
  const [started, setStarted] = useState(false)
  const startRef = useRef<HTMLButtonElement>(null)
  const boardRef = useRef<HTMLDivElement>(null)
  const archiveRef = useRef<HTMLDivElement>(null)
  // 다 사라진 뒤 채울 아카이빙 사진 배치 (그 전엔 null)
  const [archive, setArchive] = useState<ArchiveTile[] | null>(null)
  // 아카이빙 사진 하나를 누르면 그 사진과 색으로 결과 화면을 연다
  const [picked, setPicked] = useState<Picked | null>(null)
  const pick = useCallback((name: string, img: HTMLImageElement) => {
    const { left, top, width, height } = img.getBoundingClientRect()
    setPicked({ name, color: pickColor(img), from: { left, top, width, height } })
  }, [])
  useDrift(startRef, cellPx)

  // hover 한 컬러칩 (cells 의 번호). 칩 자리에서 2×2 로 커지며 그 색과 이름을 보여준다
  const [hover, setHover] = useState<number | null>(null)
  const hoverRef = useRef<HTMLDivElement>(null)
  const leaving = useRef<gsap.core.Timeline | null>(null)
  // 색이 번지기 시작할 자리 (보드 기준 px)
  const pointer = useRef({ x: 0, y: 0 })
  const fillAt = (x: number, y: number, size: number) => {
    const { left, top } = boardRef.current!.getBoundingClientRect()
    return `circle(${size}% at ${x - left - grown!.left}px ${y - top - grown!.top}px)`
  }

  // 화면이 시안 배치(11×6)를 다 담으면 원래 자리를 살리고 크기만 랜덤으로 바꾼다
  const fitsDesign = cols >= 11 && rows >= 6
  // 판이 바뀔 때만 칩을 새로 고른다 (창 크기가 바뀌어도 같은 칩을 다시 배치한다)
  const colors = useMemo(() => chipCells(chips, featured), [chips, featured])
  const cells = useMemo(
    () => place([...PHOTO_CELLS, ...colors], cols, rows, fitsDesign, { cols: fullCols, rows: fullRows }),
    [colors, cols, rows, fitsDesign, fullCols, fullRows],
  )

  // 등록하고 돌아왔을 땐 사진·컬러칩이 하나둘씩 다시 나타난다
  useLayoutEffect(() => {
    const board = boardRef.current
    if (!returning || !board || matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const tween = gsap.from(gsap.utils.shuffle([...board.querySelectorAll<HTMLElement>('.gacha__cell')]), {
      autoAlpha: 0,
      scale: 0.85,
      duration: RETURN_DURATION,
      stagger: RETURN_STAGGER,
      ease: 'power2.out',
    })
    return () => void tween.revert()
  }, [returning])

  const start = useCallback(() => {
    if (started) return
    setStarted(true)
    const tiles = layoutArchive(cols, rows)
    // 사라지는 동안 사진을 미리 받아 둬서 나타날 때 빈 칸이 보이지 않게 한다
    tiles.forEach((t) => (new Image().src = thumbSrc(t.name)))
    const board = boardRef.current
    // start 버튼도 사진·컬러칩을 다 지운 뒤 같은 방식으로 사라진다
    const els = board ? [...board.querySelectorAll<HTMLElement>('.gacha__cell')] : []
    vanish(els, startRef.current).eventCallback('onComplete', () => setArchive(tiles))
  }, [started, cols, rows])

  // 아카이빙 사진이 왼쪽 위에서 오른쪽 아래로 대각선을 따라 빠르게 나타난다
  useLayoutEffect(() => {
    const root = archiveRef.current
    if (!archive || !root) return
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches
    const tiles = [...root.querySelectorAll<HTMLElement>('.gacha__archive-tile')]
    const tween = gsap.fromTo(
      tiles,
      { autoAlpha: 0, scale: reduce ? 1 : 0.6 },
      {
        autoAlpha: 1,
        scale: 1,
        duration: reduce ? 0 : ARCHIVE_DURATION,
        ease: 'power3.out',
        delay: (i) => (reduce ? 0 : (archive[i].row + archive[i].col) * ARCHIVE_STEP),
      },
    )
    return () => void tween.kill()
  }, [archive])

  // 커질 자리: 칩이 있는 칸을 왼쪽 위로 두고, 화면 끝이나 헤더 줄에 걸리면 안쪽으로 당긴다
  const hovered = hover === null ? null : cells[hover]
  const grown = hovered && {
    left: gsap.utils.clamp(0, Math.max(0, fullCols - 2), hovered.col) * cellPx,
    top: gsap.utils.clamp(1, Math.max(1, fullRows - 2), hovered.row) * cellPx,
    width: 2 * cellPx,
    height: 2 * cellPx,
  }
  useLayoutEffect(() => {
    const el = hoverRef.current
    if (!el || !hovered || !grown) return
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches
    const ctx = gsap.context(() => {
      if (hovered.kind === 'color' && hovered.size === 'text') {
        const { x, y } = pointer.current
        gsap
          .timeline()
          .fromTo(
            '.gacha__hover-fill',
            { clipPath: fillAt(x, y, 0) },
            { clipPath: fillAt(x, y, 150), duration: reduce ? 0 : FILL_IN, ease: 'power2.inOut' },
          )
          .fromTo(
            el,
            { color: TEXT_INK },
            { color: inkOn(hovered.color), duration: reduce ? 0 : FILL_IN * 0.7, ease: 'power1.inOut' },
            reduce ? 0 : FILL_IN * 0.15,
          )
        return
      }
      gsap
        .timeline()
        .fromTo(
          el,
          { ...cellBox(hovered, cellPx), autoAlpha: 1 },
          { ...grown, duration: reduce ? 0 : HOVER_GROW, ease: 'power3.out' },
        )
        .fromTo('p', { autoAlpha: 0 }, { autoAlpha: 1, duration: reduce ? 0 : HOVER_TEXT }, reduce ? 0 : '-=0.15')
    }, el)
    return () => ctx.revert()
    // 칩이 바뀔 때만 다시 키운다
  }, [hover, cellPx])

  const enter = (i: number, x: number, y: number) => {
    if (started) return
    pointer.current = { x, y }
    const tl = leaving.current
    leaving.current = null
    // 접히는 도중에 같은 칩으로 돌아오면 그 자리에서 다시 펼친다
    if (tl?.isActive() && i === hover) return void tl.eventCallback('onComplete', null).reverse()
    tl?.kill()
    setHover(i)
  }
  // 칩과 커진 박스 사이를 오갈 땐 그대로 두고, 둘 다 벗어나면 칩 크기로 줄이며 닫는다
  const leave = (to: EventTarget | null, x: number, y: number) => {
    const el = hoverRef.current
    const cell = boardRef.current?.querySelector(`[data-cell="${hover}"]`)
    if (to instanceof Node && (el?.contains(to) || cell?.contains(to))) return
    if (!el || !hovered || matchMedia('(prefers-reduced-motion: reduce)').matches) return setHover(null)
    leaving.current?.kill()
    const tl = gsap.timeline({ onComplete: () => setHover(null) })
    // 텍스트만 있는 칸: 마우스가 나간 자리로 색을 거둬들이며 글자색도 원래대로 돌린다
    if (hovered.size === 'text') {
      tl.to(el.querySelector('.gacha__hover-fill'), {
        clipPath: fillAt(x, y, 0),
        duration: FILL_OUT,
        ease: 'power2.inOut',
      }).to(el, { color: TEXT_INK, duration: FILL_OUT * 0.7, ease: 'power1.inOut' }, 0)
      leaving.current = tl
      return
    }
    tl.to(el.querySelectorAll('p'), { autoAlpha: 0, duration: HOVER_TEXT_OUT, ease: 'power1.out' }).to(
      el,
      { ...cellBox(hovered, cellPx), duration: HOVER_SHRINK, ease: 'power3.inOut' },
      '<',
    )
    leaving.current = tl
  }

  const boardStyle = useMemo(
    () => ({ backgroundSize: `${cellPx}px ${cellPx}px` }) as const,
    [cellPx],
  )

  return (
    <main
      className={`gacha${started ? ' is-started' : ''}`}
      aria-label="가챠"
      // start 버튼이 칸과 같은 비율로 줄어들도록 1920 기준 배율을 넘긴다
      style={{ '--gacha-scale': cellPx / CELL } as CSSProperties}
    >
      {/* 빈 칸(보드 바로 위)에 멈춰 있으면 커서가 안내를 띄운다. start 뒤에는 띄우지 않는다 */}
      <div
        ref={boardRef}
        className="gacha__board"
        style={boardStyle}
        aria-hidden="true"
        data-cursor-idle={started ? undefined : ''}
      >
        {cells.map((cell, i) => (
          <div
            key={`${cell.kind}-${i}`}
            className={`gacha__cell${cell.size === 'text' ? ' is-text' : ''}`}
            data-cell={i}
            onMouseEnter={cell.kind === 'color' ? (e) => enter(i, e.clientX, e.clientY) : undefined}
            onMouseLeave={cell.kind === 'color' ? (e) => leave(e.relatedTarget, e.clientX, e.clientY) : undefined}
            style={{
              ...cellBox(cell, cellPx),
              ...(cell.kind === 'color' && cell.size !== 'text' ? { background: cell.color } : null),
            }}
          >
            {cell.kind === 'photo' && (
              <img className="gacha__photo" src={asset(cell.src)} alt="" loading="lazy" />
            )}
            {cell.kind === 'color' && cell.size === 'text' && <ChipText name={cell.name} author={cell.author} />}
          </div>
        ))}
        {hovered?.kind === 'color' && !started && (
          <div
            key={hover}
            ref={hoverRef}
            className="gacha__hover"
            style={
              hovered.size === 'text'
                ? { ...grown, color: TEXT_INK }
                : { ...grown, background: hovered.color, color: inkOn(hovered.color) }
            }
            // 접히는 박스 위로 마우스가 돌아와도 다시 펼친다
            onMouseEnter={(e) => enter(hover!, e.clientX, e.clientY)}
            onMouseLeave={(e) => leave(e.relatedTarget, e.clientX, e.clientY)}
          >
            {hovered.size === 'text' && (
              <div className="gacha__hover-fill" style={{ background: hovered.color }} />
            )}
            <ChipText name={hovered.name} author={hovered.author} />
          </div>
        )}
      </div>

      {archive && (
        <div ref={archiveRef} className="gacha__archive">
          {archive.map((t) => (
            <button
              key={`${t.row}:${t.col}`}
              type="button"
              className="gacha__archive-tile"
              aria-label={`${t.name} 사진 고르기`}
              onClick={(e) => pick(t.name, e.currentTarget.querySelector('img')!)}
              style={{
                left: t.col * cellPx,
                top: t.row * cellPx,
                width: cellPx,
                height: cellPx,
              }}
            >
              <img src={thumbSrc(t.name)} alt="" />
            </button>
          ))}
        </div>
      )}

      {picked && <GachaResult picked={picked} onBack={() => setPicked(null)} onRegister={onRegister} />}

      <button ref={startRef} type="button" className="gacha__start" onClick={start} disabled={started}>
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
