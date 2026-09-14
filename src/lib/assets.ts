const BASE = '/interaction'

export const asset = (name: string) => `${BASE}/${name}`

/**
 * 히어로 오브젝트 6종. hero-objects.png(1920×635)에서 알파 기준으로 잘라낸 조각들이다.
 *
 * x/y/w 는 시안 프레임(1920×1316) 대비 퍼센트이고, y 는 한 줄로 정렬된 컷 3 기준이다.
 * zig 는 컷 2 에서의 세로 어긋남 — 하나 걸러 위아래로 엇갈려 있다가 컷 3 에서 0 이 된다.
 * 값은 시안 컷 이미지(2.png, 3.png)에서 오브젝트마다 윗변을 재서 뽑았다.
 */
export const HERO_OBJECTS = [
  { src: 'obj-1.png', alt: 'PANTONE 199 라벨이 붙은 구겨진 빨간 봉투', x: 1.77, y: 42.95, w: 15.7, zig: -6.92 },
  { src: 'obj-2.png', alt: '초록 그물망에 담긴 재활용 쓰레기', x: 22.19, y: 47.0, w: 12.3, zig: 12.88 },
  { src: 'obj-3.png', alt: '동전이 놓인 구겨진 영수증', x: 37.19, y: 42.95, w: 16.8, zig: -10.0 },
  { src: 'obj-4.png', alt: '푸른 비닐봉지', x: 56.35, y: 40.52, w: 12.7, zig: 16.89 },
  { src: 'obj-5.png', alt: '찌그러진 포카리스웨트 캔', x: 72.92, y: 41.33, w: 10.2, zig: -8.0 },
  { src: 'obj-6.png', alt: '찌그러진 다이어트 코크 캔', x: 88.12, y: 42.14, w: 9.9, zig: 17.12 },
] as const

/** 오브젝트를 가리키는 라벨과 지시선. */
export const HERO_LABELS = [
  { src: 'label-discarded-color.png', alt: 'DISCARDED COLOR', x: 12.78, y: 36.95, w: 13.18 },
  { src: 'label-leftover-value.png', alt: 'LEFTOVER VALUE', x: 42.0, y: 35.66, w: 10.42 },
  { src: 'label-crushed-blue.png', alt: 'CRUSHED BLUE', x: 82.0, y: 37.6, w: 9.64 },
  { src: 'label-crushed-silver.png', alt: 'CRUSHED SILVER', x: 81.44, y: 74.72, w: 10.89 },
  { src: 'label-collected-waste.png', alt: 'COLLECTED WASTE', x: 23.0, y: 76.82, w: 12.19 },
  { src: 'label-plastic-trace.png', alt: 'PLASTIC TRACE', x: 55.56, y: 78.61, w: 9.69 },
] as const

export const HERO_LINES = [
  { src: 'line-1.png', x: 13.1, y: 38.9, w: 2.4 },
  { src: 'line-2.png', x: 46.5, y: 37.6, w: 3.2 },
  { src: 'line-3.png', x: 77.5, y: 39.6, w: 4.1 },
  { src: 'line-4.png', x: 87.5, y: 66.7, w: 1.7 },
  { src: 'line-5.png', x: 27.6, y: 68.5, w: 1.4 },
  { src: 'line-6.png', x: 60.0, y: 68.3, w: 3.9 },
] as const

/** 사진 행 11개 + 그 아래 붙는 번호 캡션 행 11개. 색상 순서(red→…→white)대로 정렬돼 있다. */
export const ARCHIVE_ROWS = Array.from({ length: 11 }, (_, i) => {
  const n = String(i + 1).padStart(2, '0')
  return { row: `archive-row-${n}.png`, caps: `archive-caps-${n}.png`, index: i }
})

export const INDEX_COLUMNS = [
  { src: 'index-col-1.png', alt: '( 001 ) Crushed Red 부터 ( 015 ) 까지의 색 목록', x: 3.3 },
  { src: 'index-col-2.png', alt: '( 016 ) Plastic Yellow 부터 ( 030 ) 까지의 색 목록', x: 58 },
  { src: 'index-col-3.png', alt: '( 031 ) Can Blue 부터 ( 042 ) Plastic White 까지의 색 목록', x: 80 },
] as const
