/**
 * assets-src/waste/ 의 원본을 public/waste/ 로 굽는다.  `yarn assets:waste`
 *
 * 원본은 376MB 라 저장소에 넣지 않는다(.gitignore). 구운 WebP 만 커밋한다 —
 * 원본이 필요하면 드라이브에서 다시 받으면 되지만, 저장소가 한 번 무거워지면 되돌리기 어렵다.
 *
 * 사진은 두 벌로 굽는다. 목록에 서른 장을 깔면서 1800px 짜리를 받으면 첫 화면이 안 뜬다.
 */
import { mkdir, readdir, writeFile, readFile } from 'node:fs/promises'
import { join, parse } from 'node:path'
import { stat } from 'node:fs/promises'
import sharp from 'sharp'
import { COLORS } from './waste-color.mjs'

const SRC = 'assets-src/waste'
const OUT = 'public/waste'

/** [폴더, 가로 최대, 품질] — 누끼는 가장자리가 살아야 해서 조금 더 준다. */
const JOB = [
  ['object', 1200, 86, 'object'],
  ['photo', 1800, 80, 'photo'],
  ['photo', 640, 72, 'photo/thumb'],
]

const FORCE = process.argv.includes('--force')

/** 이미 있는 파일의 크기. 없으면 null — 그러면 굽는다. */
async function probe(file) {
  try {
    const { width, height } = await sharp(file).metadata()
    /* metadata().size 는 파일에서 읽을 때 비어 있다. 줄어든 양을 세려면 실제 크기가 필요하다. */
    const { size } = await stat(file)
    return { width, height, size }
  } catch {
    return null
  }
}

const sizes = {}
let before = 0
let after = 0

for (const [dir, width, quality, outDir] of JOB) {
  await mkdir(join(OUT, outDir), { recursive: true })
  for (const f of (await readdir(join(SRC, dir))).sort()) {
    if (!/\.(png|jpe?g)$/i.test(f)) continue
    const name = parse(f).name
    const dest = join(OUT, outDir, name + '.webp')
    const buf = await readFile(join(SRC, dir, f))

    /* 이미 구운 것은 건너뛴다. 목록만 다시 쓰려고 99장을 다시 굽느라 4분을 기다릴 이유가 없다.
       원본을 갈아끼웠으면 `yarn assets:waste --force` 로 다시 굽는다. */
    let info = FORCE ? null : await probe(dest)
    if (!info) {
      info = await sharp(buf).resize({ width, withoutEnlargement: true })
        .webp({ quality, alphaQuality: 100, effort: 6 }).toFile(dest)
    }
    if (outDir !== 'photo/thumb') {
      before += buf.length
      after += info.size
      sizes[`${dir}/${name}`] = [info.width, info.height]
    }
  }
}

/* 화면이 쓸 목록. 손으로 적으면 파일을 지운 뒤에도 목록에 남아 깨진 그림이 뜬다. */
const manifest = JSON.parse(await readFile(join(SRC, '_manifest.json'), 'utf8'))

/* 시안처럼 사진마다 번호를 붙인다(No.001~). 무엇을 뜻하는 번호는 아니지만 <b>한 번 정하면
   안 바뀌어야</b> 한다 — 다시 구울 때마다 번호가 흔들리면 주소도 캡션도 같이 흔들린다.
   그래서 난수가 아니라 정해진 차례(색 목록 순 → 이름 순)로 센다. */
manifest.photo.sort(
  (a, b) => COLORS.indexOf(a.color) - COLORS.indexOf(b.color) || a.name.localeCompare(b.name),
)
manifest.photo.forEach((p, i) => { p.no = i + 1 })
await writeFile('scripts/waste-manifest.json', JSON.stringify(manifest, null, 1))
await writeFile(
  'src/lib/waste.ts',
  `/**
 * public/waste/ 안 이미지 목록. \`yarn assets:waste\` 가 다시 쓴다 — 손으로 고치지 않는다.
 *
 * <b>누끼(object)</b>는 흰 배경에서 오려 낸 물건 하나. 어디에든 얹을 수 있다.
 * <b>사진(photo)</b>은 배경이 흑백이고 버려진 것만 색이 남은 길거리 사진이다.
 * 그래서 \`color\` 가 곧 분류다 — 색으로 고르면 화면의 톤이 맞는다.
 */
export type WasteColor = ${COLORS.map((c) => `'${c}'`).join(' | ')}

/** 시안의 Similar Colors 목록 순서. 알파벳순으로 세우면 화면의 차례와 어긋난다. */
export const WASTE_COLORS: WasteColor[] = [${COLORS.map((c) => `'${c}'`).join(', ')}]

export const WASTE_OBJECTS = [
${manifest.object.map((o) => `  '${o.name}',`).join('\n')}
] as const

export type WasteObject = (typeof WASTE_OBJECTS)[number]

export const WASTE_PHOTOS: { no: number; name: string; color: WasteColor }[] = [
${manifest.photo.map((p) => `  { no: ${p.no}, name: '${p.name}', color: '${p.color}' },`).join('\n')}
]

/** 구운 이미지의 실제 크기. img 에 박아 두면 뜨는 동안 글이 밀리지 않는다. */
export const WASTE_SIZES: Record<string, readonly [number, number]> = {
${Object.entries(sizes).map(([k, v]) => `  '${k}': [${v[0]}, ${v[1]}],`).join('\n')}
}

const base = import.meta.env.BASE_URL

export const objectSrc = (name: WasteObject) => \`\${base}waste/object/\${name}.webp\`
export const photoSrc = (name: string) => \`\${base}waste/photo/\${name}.webp\`
/** 목록에 여러 장을 깔 때. 640px 짜리라 첫 화면이 빨리 뜬다. */
export const thumbSrc = (name: string) => \`\${base}waste/photo/thumb/\${name}.webp\`

export const photosOf = (color: WasteColor) => WASTE_PHOTOS.filter((p) => p.color === color)

/** 시안의 캡션 모양 그대로. ( No.018 ) */
export const photoLabel = (no: number) => \`( No.\${String(no).padStart(3, '0')} )\`

export const photoByNo = (no: number) => WASTE_PHOTOS.find((p) => p.no === no)
`,
)

console.log(`원본 ${(before / 1024 / 1024).toFixed(0)}MB → WebP ${(after / 1024 / 1024).toFixed(1)}MB`)
