import { useCallback, useEffect, useMemo, useState } from 'react'
import { asset } from '../lib/assets'
import { cellSize, GACHA_CELLS, type GachaCell } from '../lib/gachaCells'

/** 판이 화면을 다 덮도록 칸 크기와 행·열 수를 센다. */
function useBoard() {
  const [board, setBoard] = useState(() => ({ cell: 180, cols: 11, rows: 6 }))

  useEffect(() => {
    const measure = () => {
      const cell = cellSize(innerWidth)
      setBoard({ cell, cols: Math.ceil(innerWidth / cell), rows: Math.ceil(innerHeight / cell) })
    }
    measure()
    addEventListener('resize', measure)
    return () => removeEventListener('resize', measure)
  }, [])

  return board
}

/** 칸들을 판 안의 빈 자리로 흩뿌린다. 같은 자리에 둘이 겹치지 않게 한다. */
function scatter(cells: readonly GachaCell[], cols: number, rows: number): GachaCell[] {
  const taken = new Set<string>()
  // 헤더가 덮는 맨 윗줄은 통째로 비운다. 화면이 좁으면 메뉴가 가로 전체를 차지해
  // 몇 열을 피할지 미리 정할 수 없다.
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

/**
 * 가챠 페이지.
 *
 * 시안(assets-src/reference/gacha/gacha.png) 그대로 180px 격자 위에 사진과 색 칸이
 * 흩어져 있고, 가운데 오른쪽에 start 버튼이 놓인다.
 * start 를 누르면 칸들이 판 위에서 다시 뽑힌다.
 */
export function Gacha() {
  const { cell: cellPx, cols, rows } = useBoard()
  const [drawn, setDrawn] = useState<readonly GachaCell[] | null>(null)
  const [drawing, setDrawing] = useState(false)

  // 시안 배치는 11x6 판을 전제로 한다. 판이 그보다 작으면 다 들어가지 못하니
  // 첫 화면부터 보이는 자리로 흩뿌린다.
  const fitsDesign = cols >= 11 && rows >= 6
  const fallback = useMemo(() => scatter(GACHA_CELLS, cols, rows), [cols, rows])
  const cells = drawn ?? (fitsDesign ? GACHA_CELLS : fallback)

  const draw = useCallback(() => {
    if (drawing) return
    setDrawing(true)
    setDrawn(scatter(GACHA_CELLS, cols, rows))
    setTimeout(() => setDrawing(false), 600)
  }, [cols, rows, drawing])

  // 격자선은 배경으로 그린다. 칸마다 요소를 두면 화면당 수십 개가 늘어난다.
  const boardStyle = useMemo(
    () => ({ backgroundSize: `${cellPx}px ${cellPx}px` }) as const,
    [cellPx],
  )

  return (
    <main className="gacha" aria-label="가챠">
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
        start
      </button>
    </main>
  )
}
