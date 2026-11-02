import { useCallback, useEffect, useMemo, useState, type CSSProperties } from 'react'
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

function scatter(cells: readonly GachaCell[], cols: number, rows: number): GachaCell[] {
  const taken = new Set<string>()
  const blocked = (row: number) => row === 0

  return cells.map((cell) => {
    for (let tries = 0; tries < 200; tries++) {
      const row = Math.floor(Math.random() * rows)
      const col = Math.floor(Math.random() * cols)
      const key = `${row}:${col}`
      if (taken.has(key) || blocked(row)) continue
      taken.add(key)
      return { ...cell, row, col }
    }
    return cell
  })
}

export function Gacha() {
  const { cell: cellPx, cols, rows } = useBoard()
  const [drawn, setDrawn] = useState<readonly GachaCell[] | null>(null)
  const [drawing, setDrawing] = useState(false)

  const fitsDesign = cols >= 11 && rows >= 6
  const fallback = useMemo(() => scatter(GACHA_CELLS, cols, rows), [cols, rows])
  const cells = drawn ?? (fitsDesign ? GACHA_CELLS : fallback)

  const draw = useCallback(() => {
    if (drawing) return
    setDrawing(true)
    setDrawn(scatter(GACHA_CELLS, cols, rows))
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
              left: `${cell.col * cellPx}px`,
              top: `${cell.row * cellPx}px`,
              width: `${cellPx}px`,
              height: `${cellPx}px`,
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

      <button type="button" className="gacha__start" onClick={draw} disabled={drawing}>
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
