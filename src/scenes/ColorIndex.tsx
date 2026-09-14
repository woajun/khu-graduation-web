import { Asset } from '../components/Asset'
import { INDEX_COLUMNS } from '../lib/assets'

/** 수집한 색 42개의 이름 목록. 가운데 빈 자리에 소파가 놓인다. */
export function ColorIndex() {
  return (
    <section className="color-index" aria-label="수집한 색 목록">
      <div className="stage">
        {INDEX_COLUMNS.map((c) => (
          <Asset
            key={c.src}
            className="stage__item ink"
            name={c.src}
            alt={c.alt}
            style={{ left: `${c.x}%`, top: '8%', width: '18.75%' }}
          />
        ))}
        <Asset
          className="stage__item cutout js-float"
          name="obj-sofa.png"
          alt="길가에 버려진 줄무늬 소파"
          style={{ left: '33%', top: '72%', width: '14%' }}
        />
      </div>
    </section>
  )
}
