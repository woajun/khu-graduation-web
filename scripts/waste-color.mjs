/** 흑백 배경 + 한 가지만 컬러인 사진들이다. 채도 높은 픽셀만 모아 색상(hue)의 중앙값을 본다. */
import { readdir } from 'node:fs/promises'
import { join } from 'node:path'
import sharp from 'sharp'

const BUCKET = [
  [345, 15, 'red'], [15, 45, 'orange'], [45, 70, 'yellow'], [70, 160, 'green'],
  [160, 200, 'cyan'], [200, 255, 'blue'], [255, 290, 'purple'], [290, 345, 'pink'],
]
const nameOf = (h) => BUCKET.find(([a, b]) => (a > b ? h >= a || h < b : h >= a && h < b))?.[2] ?? 'gray'

export async function accent(file) {
  const { data, info } = await sharp(file).resize(160, 160, { fit: 'inside' })
    .removeAlpha().raw().toBuffer({ resolveWithObject: true })
  const hues = []
  for (let i = 0; i < data.length; i += info.channels) {
    const r = data[i] / 255, g = data[i + 1] / 255, b = data[i + 2] / 255
    const mx = Math.max(r, g, b), mn = Math.min(r, g, b), d = mx - mn
    if (d < 0.22 || mx < 0.18) continue          // 회색이거나 너무 어두우면 뺀다
    let h = mx === r ? ((g - b) / d) % 6 : mx === g ? (b - r) / d + 2 : (r - g) / d + 4
    h = (h * 60 + 360) % 360
    hues.push([h, d])
  }
  if (hues.length < 40) return { color: 'gray', ratio: 0 }
  const count = {}
  for (const [h, d] of hues) { const n = nameOf(h); count[n] = (count[n] ?? 0) + d }
  const top = Object.entries(count).sort((a, b) => b[1] - a[1])[0]
  return { color: top[0], ratio: +(hues.length / (info.width * info.height)).toFixed(3) }
}

if (process.argv[2] === 'run') {
  const dirs = (await readdir('.')).filter((d) => d.startsWith('drive-download-'))
  for (const d of dirs) for (const f of (await readdir(d)).sort()) {
    if (!/\.(png|jpe?g)$/i.test(f)) continue
    const a = await accent(join(d, f))
    console.log([a.color.padEnd(7), String(a.ratio).padStart(6), join(d, f)].join(' '))
  }
}
