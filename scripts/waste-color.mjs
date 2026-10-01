/**
 * 사진 한 장의 '살아 있는 색' 을 고른다.
 *
 * 이 시안의 사진은 배경이 흑백이고 버려진 것만 색이 남아 있다. 그래서 채도 높은 픽셀만
 * 모으면 그게 곧 피사체다. 색 이름은 <b>시안의 Similar Colors 목록</b>을 그대로 쓴다 —
 * 내가 따로 cyan·pink 를 만들면 화면의 필터와 한 칸씩 어긋난다.
 *
 * Brown · Black · White 는 색상(hue)만으로 안 갈라진다. 갈색은 어두운 주황이고,
 * 검정과 흰색은 채도가 거의 없다 — 밝기를 같이 본다.
 */
import { readdir } from 'node:fs/promises'
import { join } from 'node:path'
import sharp from 'sharp'

/** 시안의 색 목록 순서 그대로 */
export const COLORS = ['Red', 'Orange', 'Yellow', 'Green', 'Blue', 'Purple', 'Brown', 'Black', 'White']

const HUE = [
  [345, 20, 'Red'], [20, 45, 'Orange'], [45, 70, 'Yellow'], [70, 165, 'Green'],
  [165, 255, 'Blue'], [255, 345, 'Purple'],
]
const byHue = (h) => HUE.find(([a, b]) => (a > b ? h >= a || h < b : h >= a && h < b))?.[1 + 1] ?? 'Red'

export async function accent(file) {
  const { data, info } = await sharp(file)
    .resize(160, 160, { fit: 'inside' })
    .flatten({ background: '#ffffff' })
    .raw().toBuffer({ resolveWithObject: true })

  const color = []   // 채도가 있는 픽셀
  const plain = []   // 회색 픽셀의 밝기
  for (let i = 0; i < data.length; i += info.channels) {
    const r = data[i] / 255, g = data[i + 1] / 255, b = data[i + 2] / 255
    const mx = Math.max(r, g, b), mn = Math.min(r, g, b), d = mx - mn
    if (d < 0.22 || mx < 0.12) { plain.push(mx); continue }
    let h = mx === r ? ((g - b) / d) % 6 : mx === g ? (b - r) / d + 2 : (r - g) / d + 4
    color.push({ h: (h * 60 + 360) % 360, d, v: mx })
  }

  const total = color.length + plain.length
  const ratio = +(color.length / total).toFixed(3)

  /* 색이 거의 없으면 Black/White 다. 회색 픽셀 중 <b>가장 어두운 쪽과 밝은 쪽</b>을 보고
     어느 극단이 더 두드러지는지로 가른다 — 아스팔트 배경이 중간 밝기라 평균은 못 쓴다. */
  if (color.length < total * 0.02) {
    plain.sort((a, b) => a - b)
    const dark = plain[Math.floor(plain.length * 0.05)] ?? 0.5
    const light = plain[Math.floor(plain.length * 0.95)] ?? 0.5
    return { color: 1 - light < dark ? 'White' : 'Black', ratio }
  }

  /* 색이 있을 때. 어둡고 탁한 주황·빨강은 갈색으로 민다. */
  const score = {}
  for (const { h, d, v } of color) {
    const brown = (h < 45 || h > 345) && v < 0.55 && d < 0.5
    const name = brown ? 'Brown' : byHue(h)
    score[name] = (score[name] ?? 0) + d
  }
  return { color: Object.entries(score).sort((a, b) => b[1] - a[1])[0][0], ratio }
}

if (process.argv[2] === 'run') {
  const dirs = (await readdir('.')).filter((d) => d.startsWith('drive-download-'))
  for (const d of dirs) for (const f of (await readdir(d)).sort()) {
    if (!/\.(png|jpe?g)$/i.test(f)) continue
    const a = await accent(join(d, f))
    console.log([a.color.padEnd(7), String(a.ratio).padStart(6), join(d, f)].join(' '))
  }
}
