/**
 * public/interaction/ 안 PNG 들의 실제 픽셀 크기.
 * img 에 width/height 를 박아 로딩 중 레이아웃이 밀리지 않게 하는 용도다.
 * 에셋을 다시 내보내면 `npm run sync:sizes` 로 갱신한다.
 */
export const IMAGE_SIZES: Record<string, readonly [number, number]> = {
  'archive-caps-01.png': [1920, 30],
  'archive-caps-02.png': [1920, 33],
  'archive-caps-03.png': [1920, 33],
  'archive-caps-04.png': [1920, 33],
  'archive-caps-05.png': [1920, 33],
  'archive-caps-06.png': [1920, 33],
  'archive-caps-07.png': [1920, 33],
  'archive-caps-08.png': [1920, 33],
  'archive-caps-09.png': [1920, 33],
  'archive-caps-10.png': [1920, 33],
  'archive-caps-11.png': [1440, 33],
  'archive-header.png': [1792, 96],
  'archive-row-01.png': [1920, 362],
  'archive-row-02.png': [1920, 363],
  'archive-row-03.png': [1920, 362],
  'archive-row-04.png': [1920, 362],
  'archive-row-05.png': [1920, 362],
  'archive-row-06.png': [1920, 362],
  'archive-row-07.png': [1920, 363],
  'archive-row-08.png': [1920, 362],
  'archive-row-09.png': [1920, 362],
  'archive-row-10.png': [1920, 362],
  'archive-row-11.png': [1440, 362],
  'arrow-down.png': [15, 36],
  'crumpled-paper.png': [381, 454],
  'index-col-1.png': [358, 671],
  'index-col-2.png': [362, 677],
  'index-col-3.png': [360, 533],
  'intro-paragraph.png': [1148, 418],
  'label-collected-waste.png': [234, 18],
  'label-crushed-blue.png': [185, 22],
  'label-crushed-silver.png': [209, 22],
  'label-discarded-color.png': [253, 22],
  'label-leftover-value.png': [200, 22],
  'label-plastic-trace.png': [186, 22],
  'line-1.png': [46, 79],
  'line-2.png': [62, 107],
  'line-3.png': [79, 77],
  'line-4.png': [33, 89],
  'line-5.png': [26, 91],
  'line-6.png': [75, 115],
  'nav.png': [1920, 106],
  'obj-1.png': [301, 362],
  'obj-2.png': [237, 336],
  'obj-3.png': [324, 395],
  'obj-4.png': [247, 406],
  'obj-5.png': [199, 303],
  'obj-6.png': [191, 343],
  'obj-foam-tray.png': [302, 218],
  'obj-sofa.png': [213, 106],
  'photo-desk.png': [239, 123],
  'title-colors.png': [1737, 284],
}

/** 시안 프레임의 가로 기준값. 에셋 폭을 퍼센트로 환산할 때 쓴다. */
export const FRAME_WIDTH = 1920

/** 에셋 원본 폭이 프레임에서 차지하던 비율. 1440px 짜리 마지막 행이 늘어나지 않게 해준다. */
export const frameRatio = (name: string) => {
  const size = IMAGE_SIZES[name]
  return size ? (size[0] / FRAME_WIDTH) * 100 : 100
}
