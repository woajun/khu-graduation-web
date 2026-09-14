import { Asset } from '../components/Asset'
import { ARCHIVE_ROWS } from '../lib/assets'
import { frameRatio } from '../lib/image-sizes'

/**
 * 41점의 현장 기록. 사진 행 아래에 번호 캡션 행이 붙는 구조가 11번 반복된다.
 * 머리말은 앞 컷(서문) 아래쪽에 있고, 여기서는 사진부터 시작한다.
 * 분량이 많아 한 화면씩 컷으로 나뉜다.
 *
 * 마지막 행은 사진이 셋뿐이라 원본이 1440px 이고, 그래서 폭을 원본 비율대로 준다.
 */
export function Archive() {
  return (
    <section className="archive" aria-label="FIELD ARCHIVE">
      {ARCHIVE_ROWS.map(({ row, caps, index }) => (
        <div className="archive__group js-archive-row" key={row}>
          <Asset
            className="archive__row photo js-focus"
            name={row}
            alt={`현장 기록 ${index + 1}번째 행`}
            eager={index < 2}
            style={{ width: `${frameRatio(row)}%` }}
          />
          <Asset className="archive__caps ink" name={caps} style={{ width: `${frameRatio(caps)}%` }} />
        </div>
      ))}
    </section>
  )
}
