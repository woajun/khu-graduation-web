import { Asset } from '../components/Asset'
import { HERO_LABELS, HERO_LINES, HERO_OBJECTS } from '../lib/assets'

/**
 * 첫 화면.
 *
 * 들어오면 타이틀이 왼쪽으로 밀려 있어 "LEFT BEHIND" 만 보이고, 스크롤에 따라
 * 오른쪽으로 미끄러지며 "COLORS WE" 가 드러난다. 확대/축소가 아니라 가로 이동이다 —
 * 시안 영상에서 첫 프레임과 정착 상태의 글자 폭이 같다(440px 대 439px).
 *
 * 오브젝트는 같이 움직이지 않고 제자리에서 떠오르며 나타난다.
 */
export function Hero() {
  return (
    <section className="hero js-hero-spacer" aria-label="COLORS WE LEFT BEHIND">
      <div className="hero__sticky">
        <div className="stage">
          {/* 가로로 미끄러지는 건 이 묶음뿐이다 */}
          <div className="hero__headline js-hero-headline">
            <Asset
              className="stage__item ink"
              name="title-colors.webp"
              alt="COLORS WE LEFT BEHIND"
              eager
              style={{ left: '3.78%', top: '8.59%', width: '91.64%' }}
            />
            <Asset
              className="stage__item photo"
              name="photo-desk.webp"
              alt="수집한 쓰레기 사진을 책상 위에 늘어놓고 작업하는 장면"
              eager
              style={{ left: '18.67%', top: '21.56%', width: '14.67%' }}
            />
          </div>

          {HERO_OBJECTS.map((o) => (
            <Asset
              key={o.src}
              className="stage__item cutout js-hero-object"
              name={o.src}
              alt={o.alt}
              eager
              style={{ left: `${o.x}%`, top: `${o.y}%`, width: `${o.w}%` }}
            />
          ))}

          {HERO_LINES.map((l) => (
            <Asset
              key={l.src}
              className="stage__item ink js-hero-annotation"
              name={l.src}
              style={{ left: `${l.x}%`, top: `${l.y}%`, width: `${l.w}%` }}
            />
          ))}

          {HERO_LABELS.map((l) => (
            <Asset
              key={l.src}
              className="stage__item ink js-hero-annotation"
              name={l.src}
              alt={l.alt}
              style={{ left: `${l.x}%`, top: `${l.y}%`, width: `${l.w}%` }}
            />
          ))}

          {/* 첫 화면 오른쪽 아래 모서리에 걸치는 트레이 */}
          <Asset
            className="stage__item cutout"
            name="obj-foam-tray.webp"
            alt="버려진 스티로폼 트레이"
            eager
            style={{ left: '87.8%', top: '91.6%', width: '12.2%' }}
          />
        </div>
      </div>
    </section>
  )
}
