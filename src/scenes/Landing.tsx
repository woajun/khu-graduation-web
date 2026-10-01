import { useEffect, useState } from 'react'
import { Asset } from '../components/Asset'
import { asset } from '../lib/assets'
import { GATHER_MS, SIDES, piecesOf } from '../lib/ring'
import { objectSrc } from '../lib/waste'

/**
 * 랜딩 — 아이콘을 누르면 오는 자리.
 *
 * 시안의 차례 그대로다.
 *   *1 빈 화면에서 로고가 투명에서 불투명으로 천천히 나타난다
 *   *2 개체가 <b>사방에서</b> 하나씩 빨려 들어온다 (staggered implosion)
 *   *3 시안 그림의 자리에 모인다
 *   *4 좌우 바깥에서 컵이 밀려 들어온다 — 반만 보인다
 *   *5 모였던 것이 둘로 갈라져 컵 둘레의 원이 된다
 *   *6 두 원은 같은 원이라 모자라는 만큼이 그 자리에서 떠오른다
 *   *7 원이 돈다 — 왼쪽은 시계, 오른쪽은 반시계
 *   *8 하나에 손을 올리면 전부 멈추고 그것만 커진다
 *   *9 누르면 가로 중앙에 멈췄다가 반대쪽으로 밀려 나간다 (아직 없다)
 *
 * 번호는 작업 보드 ~8 의 컨텍스트와 같다. "*5 좀 더 빠르게" 처럼 가리킨다.
 *
 * 바탕은 흰색 하나다. 검은 판을 같이 두었다가 걷었다 — 고를 일이 아니었다.
 *
 * ── 왜 한 벌로 그리나 ──
 *
 * 단계마다 개체를 따로 그렸더니 넘어가는 순간 한 번 사라졌다 다시 섰다. 들어온 것과
 * 도는 것이 <b>같은 개체</b>로 보여야 "주워 모은 것이 모였다" 가 된다.
 *
 * 그래서 자리를 한 식으로 쓰고, 단계가 바뀌면 그 식 안의 값만 바꾼다(styles.css 참고).
 * 식이 그대로면 브라우저가 두 자리 사이를 알아서 이어 준다.
 */
type Stage = 'out' | 'gather' | 'ring'

export function Landing() {
  const [stage, setStage] = useState<Stage>('out')

  useEffect(() => {
    /* 첫 그림이 그려진 뒤에 켜야 자리가 이어진다. 같은 틀에서 바꾸면 브라우저가
       두 자리를 한 값으로 보고 그냥 건너뛴다.

       requestAnimationFrame 을 쓰다가 바꿨다. 탭이 가려진 채로 열리면 그 호출이
       아예 안 불린다 — 그러면 ② 모이는 단계를 통째로 건너뛰고 개체가 갑자기 원에
       나타난다. 시계는 가려져도 간다. */
    const open = setTimeout(() => setStage('gather'), 60)
    const spread = setTimeout(() => setStage('ring'), GATHER_MS)
    return () => {
      clearTimeout(open)
      clearTimeout(spread)
    }
  }, [])

  return (
    <main className={`landing landing--${stage}`} aria-label="TOXIC EARTH ARCHIVE">
      <h1 className="landing__logo">
        <Asset name="logo-tea-dark.webp" alt="TOXIC EARTH ARCHIVE" eager />
      </h1>

      {SIDES.map((side) => (
        <div key={side} className={`cupring cupring--${side}`}>
          <img className="cupring__cup" src={asset('cup-tea.webp')} alt="" aria-hidden="true" />
          <div className="cupring__orbit">
            {piecesOf(side).map((p) => (
              <button
                key={p.name}
                className={'cupring__item' + (p.late ? ' is-late' : '')}
                style={{
                  ['--a' as string]: `${p.angle}deg`,
                  /* 단위 없는 숫자만 넘긴다. 단위를 붙여 인라인으로 박으면 단계가
                     바뀌어도 안 바뀐다 — 인라인이 클래스 규칙을 이기기 때문이다. */
                  ['--gx' as string]: p.gx,
                  ['--gy' as string]: p.gy,
                  ['--dx' as string]: p.dx,
                  ['--dy' as string]: p.dy,
                  ['--gw' as string]: p.gw,
                  ['--w' as string]: p.w,
                  ['--in' as string]: `${p.delay}s`,
                  ['--float' as string]: `${p.float}s`,
                }}
                title={p.name}
              >
                {/* 둥실거림은 이 칸이 맡는다. 자리를 옮기는 식과 섞이면 서로 덮어쓴다. */}
                <span className="cupring__float">
                  <img src={objectSrc(p.name)} alt="" aria-hidden="true" />
                </span>
              </button>
            ))}
          </div>
        </div>
      ))}
    </main>
  )
}
