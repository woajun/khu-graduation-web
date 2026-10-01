import { Asset } from '../components/Asset'
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
 * 자리는 가장자리가 아니라 <b>로고 둘레</b>다. 멀찍이 떨어뜨려 두면 배경 장식이 되는데,
 * 시안에서는 로고를 반쯤 덮으며 가운데로 몰려 있다 — 쌓인 것 위에 이름이 얹힌 모양이다.
 */

type Piece = {
  name: WasteObject
  /** 화면 기준 퍼센트. 개체의 가운데가 이 자리에 온다. */
  x: number
  y: number
  w: number
  rot: number
  /** 들어오기 시작하는 때(초) */
  delay: number
  from: 'left' | 'right'
}

const PIECES: Piece[] = [
  { name: 'glove-purple', x: 14, y: 46, w: 17, rot: -14, delay: 1.5, from: 'left' },
  { name: 'box-foam', x: 17, y: 24, w: 13, rot: 12, delay: 2.1, from: 'left' },
  { name: 'cup-noodle', x: 29, y: 28, w: 9, rot: -6, delay: 2.6, from: 'left' },
  { name: 'can-gatorade', x: 12, y: 70, w: 13, rot: 8, delay: 3.0, from: 'left' },
  { name: 'ashtray-jar', x: 26, y: 72, w: 12, rot: -5, delay: 3.5, from: 'left' },
  { name: 'box-adidas', x: 36, y: 82, w: 14, rot: 6, delay: 2.9, from: 'left' },
  { name: 'straw-red', x: 46, y: 9, w: 22, rot: -4, delay: 1.9, from: 'right' },
  { name: 'part-blue', x: 62, y: 24, w: 11, rot: 9, delay: 2.3, from: 'right' },
  { name: 'handle-yellow', x: 84, y: 28, w: 9, rot: -10, delay: 2.8, from: 'right' },
  { name: 'cup-coffee', x: 60, y: 48, w: 11, rot: 5, delay: 1.7, from: 'right' },
  { name: 'cap-blue', x: 73, y: 24, w: 5, rot: 0, delay: 3.3, from: 'right' },
  { name: 'lid-red', x: 68, y: 72, w: 15, rot: -7, delay: 2.5, from: 'right' },
  { name: 'box-stack', x: 86, y: 60, w: 15, rot: 7, delay: 3.1, from: 'right' },
  { name: 'cap-blue', x: 56, y: 82, w: 7, rot: 14, delay: 3.7, from: 'right' },
]

export function Landing() {
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
