import { useEffect, useState } from 'react'
import { Asset } from '../components/Asset'
import { asset } from '../lib/assets'
import { objectSrc, type WasteObject } from '../lib/waste'

/**
 * 랜딩 — 아이콘을 누르면 오는 자리.
 *
 * 시안(랜딩_B)의 차례 그대로다.
 *   ① 빈 검은 화면
 *   ② 로고가 투명에서 불투명으로 천천히 나타난다
 *   ③ 양옆에서 개체가 하나씩, 각각 다른 타이밍으로 들어와 둥실거린다
 *
 * 들어오는 때를 하나씩 어긋나게 둔 이유: 한꺼번에 들어오면 '화면이 바뀌었다' 로 읽히고,
 * 차례로 들어오면 '하나씩 주워 모은 것' 으로 읽힌다. 주제가 그쪽이다.
 *
 * 그 다음이 2단계다 — 바탕이 희어지고, 떠 있던 개체들이 <b>양쪽 컵 둘레로 원을 그리며</b>
 * 왼쪽은 반시계, 오른쪽은 시계로 돈다. 하나에 손을 올리면 전부 멈추고 그것만 커진다.
 *
 * 1단계 자리는 가장자리가 아니라 <b>로고 둘레</b>다. 멀찍이 떨어뜨려 두면 배경 장식이 되는데,
 * 시안에서는 로고를 반쯤 덮으며 가운데로 몰려 있다 — 쌓인 것 위에 이름이 얹힌 모양이다.
 */

type Piece = {
  name: WasteObject
  /** 화면 기준 퍼센트. 개체의 가운데가 이 자리에 온다.
   *  크기(w)는 <b>로고에 견줘</b> 잡았다 — 로고가 화면의 3분의 1쯤이고 개체는 그 절반에서
   *  비슷한 크기까지다. 작게 두면 배경 무늬가 되고, 주제는 이것들이 주인공인 쪽이다. */
  x: number
  y: number
  w: number
  rot: number
  /** 들어오기 시작하는 때(초) */
  delay: number
  from: 'left' | 'right'
}

const PIECES: Piece[] = [
  { name: 'glove-purple', x: 13, y: 45, w: 22, rot: -14, delay: 1.5, from: 'left' },
  { name: 'box-foam', x: 16, y: 22, w: 17, rot: 12, delay: 2.1, from: 'left' },
  { name: 'cup-noodle', x: 30, y: 27, w: 12, rot: -6, delay: 2.6, from: 'left' },
  { name: 'can-gatorade', x: 11, y: 71, w: 17, rot: 8, delay: 3.0, from: 'left' },
  { name: 'ashtray-jar', x: 27, y: 74, w: 15, rot: -5, delay: 3.5, from: 'left' },
  { name: 'box-adidas', x: 38, y: 85, w: 18, rot: 6, delay: 2.9, from: 'left' },
  { name: 'straw-red', x: 45, y: 8, w: 34, rot: -4, delay: 1.9, from: 'right' },
  { name: 'part-blue', x: 63, y: 22, w: 14, rot: 9, delay: 2.3, from: 'right' },
  { name: 'handle-yellow', x: 85, y: 27, w: 12, rot: -10, delay: 2.8, from: 'right' },
  { name: 'cup-coffee', x: 61, y: 47, w: 14, rot: 5, delay: 1.7, from: 'right' },
  { name: 'cap-blue', x: 74, y: 22, w: 7, rot: 0, delay: 3.3, from: 'right' },
  { name: 'lid-red', x: 69, y: 73, w: 19, rot: -7, delay: 2.5, from: 'right' },
  { name: 'box-stack', x: 87, y: 59, w: 20, rot: 7, delay: 3.1, from: 'right' },
  { name: 'cap-blue', x: 57, y: 85, w: 9, rot: 14, delay: 3.7, from: 'right' },
]

/** 1단계에서 2단계로 넘어가는 때. 마지막 개체가 들어오고(3.7s + 1.2s) 잠깐 머문 뒤다. */
const SETTLE_MS = 6200

export function Landing() {
  /* 두 단계를 한 화면에서 바꾼다. 페이지를 나누면 들어오던 개체가 한 번 사라졌다 다시 선다. */
  const [ring, setRing] = useState(false)
  useEffect(() => {
    const t = setTimeout(() => setRing(true), SETTLE_MS)
    return () => clearTimeout(t)
  }, [])

  const half = Math.ceil(PIECES.length / 2)
  const sides = [
    { key: 'left' as const, items: PIECES.slice(0, half) },
    { key: 'right' as const, items: PIECES.slice(half) },
  ]

  if (ring) {
    return (
      <main className="landing landing--ring" aria-label="TOXIC EARTH ARCHIVE">
        <h1 className="landing__logo">
          <Asset name="logo-tea-dark.webp" alt="TOXIC EARTH ARCHIVE" eager />
        </h1>

        {sides.map((side) => (
          <div key={side.key} className={`cupring cupring--${side.key}`}>
            <img className="cupring__cup" src={asset('cup-tea.webp')} alt="" aria-hidden="true" />
            <div className="cupring__orbit">
              {side.items.map((p, i) => {
                const a = (360 / side.items.length) * i
                return (
                  <button
                    key={p.name + i}
                    className="cupring__item"
                    style={{ ['--a' as string]: `${a}deg` }}
                    title={p.name}
                  >
                    <img src={objectSrc(p.name)} alt="" aria-hidden="true" />
                  </button>
                )
              })}
            </div>
          </div>
        ))}
      </main>
    )
  }

  return (
    <main className="landing" aria-label="TOXIC EARTH ARCHIVE">
      {/* 로고는 글자가 아니라 그림이다 — O 가 점 격자로 돼 있어 서체로는 못 만든다. */}
      <h1 className="landing__logo">
        <Asset name="logo-tea.webp" alt="TOXIC EARTH ARCHIVE" eager />
      </h1>

      {PIECES.map((p, i) => (
        /* 들어오기와 둥실거리기가 둘 다 translate 를 쓴다. 한 요소에 겹치면 뒤엣것이
           앞엣것을 지우므로 자리는 바깥이, 흔들림은 안쪽이 맡는다. */
        <span
          key={p.name + i}
          className={`landing__slot landing__slot--${p.from}`}
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: `${p.w}%`,
            animationDelay: `${p.delay}s`,
          }}
        >
          <img
            className="landing__obj"
            src={objectSrc(p.name)}
            alt=""
            aria-hidden="true"
            style={{
              rotate: `${p.rot}deg`,
              animationDelay: `${p.delay + 1.1}s`,
              animationDuration: `${4.5 + (i % 4) * 0.7}s`,
            }}
          />
        </span>
      ))}
    </main>
  )
}
