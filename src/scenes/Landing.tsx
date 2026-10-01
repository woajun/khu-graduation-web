import { useEffect, useState } from 'react'
import { Asset } from '../components/Asset'
import { asset } from '../lib/assets'
import { objectSrc, type WasteObject } from '../lib/waste'

/**
 * 랜딩 — 아이콘을 누르면 오는 자리.
 *
 * 시안(랜딩_W)의 차례 그대로다.
 *   ① 빈 화면에서 로고가 투명에서 불투명으로 천천히 나타난다
 *   ② 양옆에서 개체가 하나씩 들어와 로고 둘레에 흩어져 둥실거린다
 *   ③ <b>그 개체들이 그대로</b> 컵 둘레의 원으로 모여 돈다
 *   ④ 하나에 손을 올리면 전부 멈추고 그것만 커진다
 *
 * 바탕은 흰색 하나다. 검은 판을 같이 두었다가 걷었다 — 고를 일이 아니었다.
 *
 * ── 왜 한 벌로 그리나 ──
 *
 * 흩어진 자리와 원 위의 자리를 따로 그렸더니, 넘어가는 순간 개체가 한 번 사라졌다 다시 섰다.
 * 들어온 것과 도는 것이 <b>같은 개체</b>로 보여야 "주워 모은 것이 모였다" 가 된다.
 *
 * 그래서 처음부터 원 위에 놓되, 1단계에서는 <b>반지름과 각도만 흐트러뜨린다</b>.
 * 2단계는 그 둘을 가지런한 값으로 되돌리는 일뿐이라 자리가 이어진다 —
 * 좌표를 재서 옮기는 것보다 단순하고, 화면 크기가 바뀌어도 따라온다.
 */

type Piece = {
  name: WasteObject
  /** 2단계에서 설 자리. 원 위의 각도다(도). 1단계에서는 여기서 scatter 만큼 비틀어 둔다. */
  spread: number
  /** 1단계의 흐트러짐 — 각도와 반지름을 얼마나 어긋나게 둘지 */
  offA: number
  offR: number
  w: number
  delay: number
}

const LEFT: Piece[] = [
  { name: 'glove-purple', spread: 200, offA: -26, offR: 9, w: 15, delay: 1.5 },
  { name: 'box-foam', spread: 250, offA: 18, offR: -7, w: 12, delay: 2.1 },
  { name: 'cup-noodle', spread: 295, offA: -12, offR: 6, w: 9, delay: 2.6 },
  { name: 'can-gatorade', spread: 150, offA: 22, offR: 8, w: 12, delay: 3.0 },
  { name: 'ashtray-jar', spread: 110, offA: -18, offR: -5, w: 11, delay: 3.5 },
  { name: 'box-adidas', spread: 60, offA: 14, offR: 10, w: 13, delay: 2.9 },
  { name: 'can-coke-crushed', spread: 20, offA: -8, offR: -9, w: 12, delay: 3.8 },
]

const RIGHT: Piece[] = [
  { name: 'straw-red', spread: 340, offA: 16, offR: 11, w: 18, delay: 1.9 },
  { name: 'part-blue', spread: 30, offA: -20, offR: -6, w: 11, delay: 2.3 },
  { name: 'handle-yellow', spread: 80, offA: 12, offR: 7, w: 9, delay: 2.8 },
  { name: 'cup-coffee', spread: 130, offA: -24, offR: -10, w: 11, delay: 1.7 },
  { name: 'cap-blue', spread: 180, offA: 10, offR: 5, w: 6, delay: 3.3 },
  { name: 'lid-red', spread: 230, offA: -14, offR: 9, w: 14, delay: 2.5 },
  { name: 'box-stack', spread: 280, offA: 20, offR: -8, w: 14, delay: 3.1 },
]

/** 개체가 다 들어오고(3.8s + 1.2s) 잠깐 머문 뒤 원으로 모인다. */
const SETTLE_MS = 6200

export function Landing() {
  const [ring, setRing] = useState(false)
  useEffect(() => {
    const t = setTimeout(() => setRing(true), SETTLE_MS)
    return () => clearTimeout(t)
  }, [])

  const sides = [
    { key: 'left' as const, items: LEFT },
    { key: 'right' as const, items: RIGHT },
  ]

  return (
    <main className={'landing' + (ring ? ' landing--ring' : '')} aria-label="TOXIC EARTH ARCHIVE">
      <h1 className="landing__logo">
        <Asset name="logo-tea-dark.webp" alt="TOXIC EARTH ARCHIVE" eager />
      </h1>

      {sides.map((side) => (
        <div key={side.key} className={`cupring cupring--${side.key}`}>
          <img className="cupring__cup" src={asset('cup-tea.webp')} alt="" aria-hidden="true" />
          <div className="cupring__orbit">
            {side.items.map((p, i) => (
              <button
                key={p.name + i}
                className="cupring__item"
                style={{
                  ['--a' as string]: `${p.spread}deg`,
                  ['--off-a' as string]: `${p.offA}deg`,
                  ['--off-r' as string]: `${p.offR}vmin`,
                  ['--w' as string]: `${p.w}vmin`,
                  ['--in' as string]: `${p.delay}s`,
                  ['--float' as string]: `${4.5 + (i % 4) * 0.7}s`,
                }}
                title={p.name}
              >
                <img src={objectSrc(p.name)} alt="" aria-hidden="true" />
              </button>
            ))}
          </div>
        </div>
      ))}
    </main>
  )
}
