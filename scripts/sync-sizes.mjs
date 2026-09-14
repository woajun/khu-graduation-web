/**
 * public/interaction/ 의 PNG 크기를 읽어 src/lib/image-sizes.ts 를 다시 쓴다.
 * Figma 에서 에셋을 다시 내보낸 뒤 `npm run sync:sizes` 로 실행한다.
 */
import { readdir, writeFile, readFile } from 'node:fs/promises'
import { join } from 'node:path'

const DIR = 'public/interaction'

/** PNG IHDR 청크에서 폭과 높이를 읽는다. */
async function readSize(path) {
  const buf = await readFile(path)
  if (buf.readUInt32BE(0) !== 0x89504e47) throw new Error(`PNG 가 아님: ${path}`)
  return [buf.readUInt32BE(16), buf.readUInt32BE(20)]
}

const files = (await readdir(DIR)).filter((f) => f.endsWith('.png')).sort()
const entries = await Promise.all(
  files.map(async (f) => `  '${f}': [${(await readSize(join(DIR, f))).join(', ')}],`),
)

await writeFile(
  'src/lib/image-sizes.ts',
  `/**
 * public/interaction/ 안 PNG 들의 실제 픽셀 크기.
 * img 에 width/height 를 박아 로딩 중 레이아웃이 밀리지 않게 하는 용도다.
 * 에셋을 다시 내보내면 \`npm run sync:sizes\` 로 갱신한다.
 */
export const IMAGE_SIZES: Record<string, readonly [number, number]> = {
${entries.join('\n')}
}

/** 시안 프레임의 가로 기준값. 에셋 폭을 퍼센트로 환산할 때 쓴다. */
export const FRAME_WIDTH = 1920

/** 에셋 원본 폭이 프레임에서 차지하던 비율. 1440px 짜리 마지막 행이 늘어나지 않게 해준다. */
export const frameRatio = (name: string) => {
  const size = IMAGE_SIZES[name]
  return size ? (size[0] / FRAME_WIDTH) * 100 : 100
}
`,
)
console.log(`image-sizes.ts 갱신 — ${files.length}개`)
