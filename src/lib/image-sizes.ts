/**
 * public/interaction/ 안 이미지들의 실제 픽셀 크기.
 * img 에 width/height 를 박아 로딩 중 레이아웃이 밀리지 않게 하는 용도다.
 * 에셋을 다시 구우면 `yarn sync:sizes` 로 갱신한다.
 */
export const IMAGE_SIZES: Record<string, readonly [number, number]> = {
  'archive-caps-01.webp': [1920, 30],
  'archive-caps-02.webp': [1920, 33],
  'archive-caps-03.webp': [1920, 33],
  'archive-caps-04.webp': [1920, 33],
  'archive-caps-05.webp': [1920, 33],
  'archive-caps-06.webp': [1920, 33],
  'archive-caps-07.webp': [1920, 33],
  'archive-caps-08.webp': [1920, 33],
  'archive-caps-09.webp': [1920, 33],
  'archive-caps-10.webp': [1920, 33],
  'archive-caps-11.webp': [1440, 33],
  'archive-header.webp': [1792, 96],
  'archive-row-01.webp': [1920, 362],
  'archive-row-02.webp': [1920, 363],
  'archive-row-03.webp': [1920, 362],
  'archive-row-04.webp': [1920, 362],
  'archive-row-05.webp': [1920, 362],
  'archive-row-06.webp': [1920, 362],
  'archive-row-07.webp': [1920, 363],
  'archive-row-08.webp': [1920, 362],
  'archive-row-09.webp': [1920, 362],
  'archive-row-10.webp': [1920, 362],
  'archive-row-11.webp': [1440, 362],
  'arrow-down.webp': [15, 36],
  'crumpled-paper.webp': [381, 454],
  'index-col-1.webp': [358, 671],
  'index-col-2.webp': [362, 677],
  'index-col-3.webp': [360, 533],
  'intro-paragraph.webp': [1148, 418],
  'label-collected-waste.webp': [234, 18],
  'label-crushed-blue.webp': [185, 22],
  'label-crushed-silver.webp': [209, 22],
  'label-discarded-color.webp': [253, 22],
  'label-leftover-value.webp': [200, 22],
  'label-plastic-trace.webp': [186, 22],
  'line-1.webp': [46, 79],
  'line-2.webp': [62, 107],
  'line-3.webp': [79, 77],
  'line-4.webp': [33, 89],
  'line-5.webp': [26, 91],
  'line-6.webp': [75, 115],
  'nav.webp': [1920, 106],
  'obj-1.webp': [301, 362],
  'obj-2.webp': [237, 336],
  'obj-3.webp': [324, 395],
  'obj-4.webp': [247, 406],
  'obj-5.webp': [199, 303],
  'obj-6.webp': [191, 343],
  'obj-foam-tray.webp': [302, 218],
  'obj-sofa.webp': [213, 106],
  'photo-desk.webp': [239, 123],
  'title-colors.webp': [1737, 284],
}

/** 시안 프레임의 가로 기준값. 에셋 폭을 퍼센트로 환산할 때 쓴다. */
export const FRAME_WIDTH = 1920

/** 에셋 원본 폭이 프레임에서 차지하던 비율. 1440px 짜리 마지막 행이 늘어나지 않게 해준다. */
export const frameRatio = (name: string) => {
  const size = IMAGE_SIZES[name]
  return size ? (size[0] / FRAME_WIDTH) * 100 : 100
}
