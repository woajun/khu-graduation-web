/**
 * public/interaction/ 의 PNG 를 WebP 로 굽는다.
 *
 * Figma 에서 에셋을 다시 내보낸 뒤 `yarn assets:webp` 로 실행한다.
 * 원본 PNG 는 assets-src/ 에 두고, 배포되는 public/ 에는 WebP 만 남긴다.
 */
import { readdir, mkdir, rename, unlink, stat } from 'node:fs/promises'
import { join, parse } from 'node:path'
import sharp from 'sharp'

const SRC = 'assets-src'
const OUT = 'public/interaction'

/**
 * 글자·선으로만 된 에셋. 손실 압축하면 가장자리가 뭉개져서 무손실로 굽는다.
 * 나머지(사진, 누끼 오브젝트)는 손실 압축해도 티가 안 난다.
 */
const LINE_ART = /^(title-colors|intro-paragraph|archive-header|archive-caps-|index-col-|label-|line-|nav|arrow-down)/

await mkdir(SRC, { recursive: true })

// public/ 에 남아있는 PNG 를 원본 폴더로 옮긴다
for (const file of await readdir(OUT)) {
  if (file.endsWith('.png')) await rename(join(OUT, file), join(SRC, file))
}

const files = (await readdir(SRC)).filter((f) => f.endsWith('.png')).sort()
let before = 0
let after = 0

for (const file of files) {
  const src = join(SRC, file)
  const dest = join(OUT, `${parse(file).name}.webp`)
  // sharp 의 metadata().size 는 입력에 따라 비어 있다. 파일 크기는 stat 으로 읽는다.
  const { size } = await stat(src)
  const lossless = LINE_ART.test(file)

  const info = await sharp(src)
    .webp(lossless ? { lossless: true, effort: 6 } : { quality: 82, alphaQuality: 90, effort: 6 })
    .toFile(dest)

  before += size
  after += info.size
  const pct = Math.round((1 - info.size / size) * 100)
  console.log(
    `${file.padEnd(26)} ${(size / 1024).toFixed(0).padStart(6)}KB → ${(info.size / 1024).toFixed(0).padStart(6)}KB` +
      `  ${String(pct).padStart(3)}% 절감  ${lossless ? '무손실' : '손실'}`,
  )
}

// 이전에 구워둔 WebP 중 원본이 사라진 것은 정리
const kept = new Set(files.map((f) => `${parse(f).name}.webp`))
for (const file of await readdir(OUT)) {
  if (file.endsWith('.webp') && !kept.has(file)) {
    await unlink(join(OUT, file))
    console.log(`${file} — 원본이 없어 삭제`)
  }
}

console.log(`\n전체 ${(before / 1024 / 1024).toFixed(1)}MB → ${(after / 1024 / 1024).toFixed(1)}MB`)
