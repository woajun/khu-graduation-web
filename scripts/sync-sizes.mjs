/**
 * public/interaction/ 의 이미지 크기를 읽어 src/lib/image-sizes.ts 를 다시 쓴다.
 * 에셋을 새로 구운 뒤 `yarn sync:sizes` 로 실행한다.
 */
import { readdir, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import sharp from 'sharp'

const DIR = 'public/interaction'

const files = (await readdir(DIR)).filter((f) => /\.(webp|png|jpe?g)$/i.test(f)).sort()
const entries = await Promise.all(
  files.map(async (f) => {
    const { width, height } = await sharp(join(DIR, f)).metadata()
    return `  '${f}': [${width}, ${height}],`
  }),
)

await writeFile(
  'src/lib/image-sizes.ts',
  `/**
 * public/interaction/ 안 이미지들의 실제 픽셀 크기.
 * img 에 width/height 를 박아 로딩 중 레이아웃이 밀리지 않게 하는 용도다.
 * 에셋을 다시 구우면 \`yarn sync:sizes\` 로 갱신한다.
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
