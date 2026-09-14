/**
 * 컷(슬라이드) 위치.
 *
 * 페이지는 평범한 문서 스크롤을 유지하되, 컷 구간 안에서는 여기서 정한 지점에만 멈춘다.
 * 값은 문서 스크롤 px 이고 화면 크기가 바뀌면 다시 잰다.
 *
 * 마지막 컷(아카이브 머리말)까지만 컷 단위로 움직이고, 그 아래는 평범한 스크롤이다.
 * 사진 41장을 한 화면씩 끊어 넘기는 건 읽는 흐름을 끊기만 한다.
 */

/** 히어로가 차지하는 컷 수. 참고 이미지 1~3 이 각각 여기에 해당한다. */
export const HERO_CUTS = 3

/** 마지막 컷에서 아카이브 머리말이 놓이는 높이(화면 대비). 참고 이미지 5 에서 잰 값. */
const ARCHIVE_HEADER_TOP = 0.083

export function measureCuts(): number[] {
  const root = document.querySelector<HTMLElement>('.lens__layer--light')
  if (!root) return [0]

  const vh = innerHeight
  const max = Math.max(0, document.documentElement.scrollHeight - vh)
  const raw: number[] = []

  const push = (y: number) => raw.push(Math.min(Math.max(Math.round(y), 0), max))

  // offsetTop 은 offsetParent 기준이라 섹션마다 기준이 달라진다. 문서 기준으로 통일한다.
  const docTop = (el: HTMLElement) => el.getBoundingClientRect().top + scrollY

  const hero = root.querySelector<HTMLElement>('.hero')
  if (hero) for (let i = 0; i < HERO_CUTS; i++) push(docTop(hero) + i * vh)

  const intro = root.querySelector<HTMLElement>('.intro')
  if (intro) push(docTop(intro))

  // 마지막 컷: 머리말이 화면 위쪽에 걸리는 자리
  const header = root.querySelector<HTMLElement>('.js-archive-header')
  if (header) push(docTop(header) - vh * ARCHIVE_HEADER_TOP)

  // 8px 안쪽으로 겹치는 컷은 같은 컷으로 본다
  return raw
    .sort((a, b) => a - b)
    .filter((v, i, all) => i === 0 || v - all[i - 1] > 8)
}

/** 지금 스크롤 위치에서 가장 가까운 컷 번호. */
export function nearestCut(cuts: number[], y: number): number {
  let best = 0
  let bestGap = Infinity
  for (let i = 0; i < cuts.length; i++) {
    const gap = Math.abs(cuts[i] - y)
    if (gap < bestGap) {
      bestGap = gap
      best = i
    }
  }
  return best
}
