/**
 * 가챠 판에 놓이는 칸들.
 *
 * 시안(assets-src/reference/gacha/gacha.png)에서 180px 격자의 몇 행 몇 열에 무엇이
 * 있는지 읽어 옮겼다. 색 칸은 PNG 로 내보내져 있었지만 단색이라 CSS 로 칠한다.
 */
export type GachaCell =
  | { row: number; col: number; kind: 'photo'; src: string; alt: string }
  | { row: number; col: number; kind: 'color'; color: string; name: string }

export const GACHA_CELLS: readonly GachaCell[] = [
  { row: 0, col: 3, kind: 'color', color: '#d5d4c7', name: '베이지' },
  { row: 0, col: 10, kind: 'photo', src: 'gacha-asphalt.webp', alt: '아스팔트 위 노란 선' },
  { row: 1, col: 1, kind: 'color', color: '#fbed64', name: '노랑' },
  { row: 1, col: 6, kind: 'photo', src: 'gacha-box.webp', alt: '버려진 파란 운동화 상자' },
  { row: 2, col: 1, kind: 'photo', src: 'gacha-lock.webp', alt: '길바닥에 떨어진 노란 자물쇠' },
  { row: 2, col: 4, kind: 'photo', src: 'gacha-cups.webp', alt: '마시다 버린 플라스틱 컵 두 개' },
  { row: 2, col: 8, kind: 'color', color: '#fbe0ed', name: '연분홍' },
  { row: 2, col: 9, kind: 'color', color: '#ffaba2', name: '살구' },
  { row: 3, col: 0, kind: 'color', color: '#1a6edd', name: '파랑' },
  { row: 3, col: 5, kind: 'photo', src: 'gacha-tag.webp', alt: '아스팔트 위에 버려진 종이 태그' },
  { row: 4, col: 1, kind: 'photo', src: 'gacha-cups.webp', alt: '마시다 버린 플라스틱 컵 두 개' },
  { row: 4, col: 3, kind: 'color', color: '#eefbff', name: '연하늘' },
  { row: 4, col: 8, kind: 'photo', src: 'gacha-milk.webp', alt: '풀숲에 버려진 딸기우유 팩' },
  { row: 5, col: 4, kind: 'color', color: '#dbd9de', name: '연회색' },
]

/** 시안 격자 한 칸의 크기(px). */
export const CELL = 180

/** 판이 가로로 최소 이만큼은 나뉘어야 시안의 흩어진 느낌이 산다. */
const MIN_COLS = 4

/**
 * 이 화면에서 쓸 칸 크기.
 * 넓은 화면에서는 시안 그대로 180px 이고, 좁으면 최소 열 수를 확보하도록 줄인다.
 * 그대로 두면 휴대폰에서 두 열밖에 안 들어가 대부분이 화면 밖으로 나간다.
 */
export const cellSize = (viewportWidth: number) =>
  Math.min(CELL, Math.floor(viewportWidth / MIN_COLS))
