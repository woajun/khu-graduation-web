import { Asset } from '../components/Asset'

const PARAGRAPH =
  'Since April, we have traveled across the country, photographing discarded objects and collecting the colors found within them. What we discovered was a landscape far more colorful than expected. These are not colors we created, but colors that already exist in the world we live in. Discarded things have remained with us for so long that they have become part of the landscape. We have adapted to a polluted world, until even pollution begins to feel natural. So, can we really call this colorful world beautiful?'

/**
 * 서문 — 컷 4.
 *
 * 시안 컷 이미지(4.png)에 맞춰 한 화면에 다 들어간다. 아카이브 머리말까지 이 컷의
 * 아래쪽에 걸쳐 있어서, 다음 컷으로 뭐가 오는지 미리 보인다.
 * 가로 위치와 크기는 화면 폭 기준, 세로 위치는 화면 높이 기준이다.
 */
export function Intro() {
  return (
    <section className="intro cut" aria-label="프로젝트 서문">
      <Asset
        className="cut__item cutout js-float"
        name="obj-foam-tray.png"
        alt="버려진 스티로폼 트레이"
        style={{ left: '84.4%', top: '10.6%', width: '12%' }}
      />
      <Asset
        className="cut__item ink"
        name="intro-paragraph.png"
        alt={PARAGRAPH}
        style={{ left: '19.5%', top: '24%', width: '61.4%' }}
      />
      <Asset
        className="cut__item cutout js-float"
        name="crumpled-paper.png"
        alt="구겨진 신문지"
        style={{ left: '9.7%', top: '57.9%', width: '13%' }}
      />
      <Asset
        className="cut__item ink"
        name="arrow-down.png"
        style={{ left: '50.5%', top: '83.1%', width: '0.78%' }}
      />
      <Asset
        className="cut__item ink js-archive-header"
        name="archive-header.png"
        alt="FIELD ARCHIVE — Collected scenes from altered nature. FILTER BY. 04.03 – 11.03, 2026. Photographed over 7 months."
        style={{ left: '3.4%', top: '91%', width: '93.3%' }}
      />
    </section>
  )
}
