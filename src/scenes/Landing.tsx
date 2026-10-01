import { WASTE_OBJECTS, objectSrc, type WasteObject } from '../lib/waste'

/**
 * 랜딩 — 아이콘을 누르면 오는 자리.
 *
 * 시안(랜딩_B)의 차례 그대로다.
 *   ① 빈 검은 화면
 *   ② 로고가 투명에서 불투명으로 천천히 나타난다
 *   ③ 양옆에서 개체가 하나씩, 각각 다른 타이밍으로 들어와 둥실거린다
 *
 * 들어오는 타이밍을 하나씩 다르게 둔 이유: 한꺼번에 들어오면 '화면이 바뀌었다' 로 읽히고,
 * 차례로 들어오면 '하나씩 주워 모은 것' 으로 읽힌다. 주제가 그쪽이다.
 */

/** 왼쪽에서 들어오는 것과 오른쪽에서 들어오는 것. 시안의 개체 배치를 눈으로 옮겼다. */
const LEFT: { name: WasteObject; top: number; w: number; delay: number }[] = [
  { name: 'box-foam', top: 14, w: 15, delay: 1.6 },
  { name: 'glove-purple', top: 40, w: 17, delay: 2.4 },
  { name: 'can-pocari', top: 62, w: 11, delay: 3.1 },
  { name: 'box-adidas', top: 74, w: 16, delay: 2.0 },
  { name: 'can-gatorade', top: 30, w: 12, delay: 3.6 },
]

const RIGHT: { name: WasteObject; top: number; w: number; delay: number }[] = [
  { name: 'cap-blue', top: 18, w: 12, delay: 1.9 },
  { name: 'cup-coffee', top: 34, w: 13, delay: 2.7 },
  { name: 'handle-yellow', top: 52, w: 11, delay: 2.2 },
  { name: 'lid-red', top: 68, w: 15, delay: 3.3 },
  { name: 'straw-red', top: 8, w: 14, delay: 3.9 },
]

export function Landing() {
  return (
    <main className="landing" aria-label="TOXIC EARTH ARCHIVE">
      <h1 className="landing__logo">
        <span>TOXIC</span>
        <span>EARTH</span>
        <span>
          ARCHIVE<sup>™</sup>
        </span>
      </h1>

      {[...LEFT.map((o) => ({ ...o, from: 'left' as const })), ...RIGHT.map((o) => ({ ...o, from: 'right' as const }))]
        .filter((o) => (WASTE_OBJECTS as readonly string[]).includes(o.name))
        .map((o) => (
          <img
            key={o.name}
            className={`landing__obj landing__obj--${o.from}`}
            src={objectSrc(o.name)}
            alt=""
            aria-hidden="true"
            style={{
              top: `${o.top}%`,
              width: `${o.w}%`,
              [o.from]: 0,
              /* 들어오는 때와 둥실거리는 주기를 개체마다 어긋나게 둔다 */
              animationDelay: `${o.delay}s, ${o.delay + 1.2}s`,
              animationDuration: `1.1s, ${5 + (o.delay % 2)}s`,
            }}
          />
        ))}
    </main>
  )
}
