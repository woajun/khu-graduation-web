/**
 * 드라이브에서 받은 폴더(`drive-download-*`)를 assets-src/waste/ 로 옮긴다.  한 번만 돌린다.
 *
 * 원본 이름(`image 6346057.png`)으로는 무엇인지 알 수 없어 코드에서 부를 수가 없다.
 * 누끼는 <b>무엇인지</b>로, 사진은 <b>무슨 색이 살아 있는지</b>로 이름을 짓는다 —
 * 이 시안의 사진은 배경이 흑백이고 버려진 것만 색이 남아 있어서 색이 곧 분류다.
 *
 * 아래 이름표를 저장소에 남겨 두는 이유: 원본은 무거워서 깃에 안 넣는다. 드라이브에서
 * 다시 받았을 때 이 표가 없으면 46개를 눈으로 다시 짝지어야 한다.
 */
import { mkdir, readdir, copyFile, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { accent } from './waste-color.mjs'

const SRC = 'assets-src/waste'
const dirs = (await readdir('.')).filter((d) => d.startsWith('drive-download-'))

/* 맥은 한글 파일명을 NFD 로 쓴다. 코드에 적은 NFC 와 글자는 같아도 바이트가 달라 못 찾는다. */
const nfc = (s) => s.normalize('NFC')
const find = async (name) => {
  for (const d of dirs) {
    const hit = (await readdir(d)).find((f) => nfc(f) === nfc(name))
    if (hit) return join(d, hit)
  }
  throw new Error('없는 파일: ' + name)
}

/** 누끼 — 보이는 대로 붙인 이름. 코드에서 이 이름으로 고른다. */
const OBJECT = {
  'image 6345927.png': 'box-adidas',        'image 6345929.png': 'can-coke-crushed',
  'image 6345951.png': 'bottle-red',        'image 6345952.png': 'can-green-crushed',
  'image 6345953.png': 'bag-lays',          'image 6345954.png': 'can-pocari',
  'image 6345956.png': 'cup-dome',          'image 6345957.png': 'sofa-mint',
  'image 6345958.png': 'part-blue',         'image 6345959.png': 'handle-yellow',
  'image 6345960.png': 'can-coke',          'image 6345961.png': 'bottle-crushed',
  'image 6345962.png': 'tray-foam',         'image 6345963.png': 'bag-white',
  'image 6345966.png': 'can-pringles-red',  'image 6345967.png': 'bottle-vita',
  'image 6345968.png': 'lighter-green',     'image 6345974.png': 'wrapper-gold',
  'image 6345994.png': 'glove-black',       'image 6345995.png': 'bag-pink',
  'image 6346057.png': 'net-red',           'image 6346058.png': 'ashtray-jar',
  'image 6346059.png': 'cup-yogurt',        'image 6346060.png': 'box-stack',
  'image 6346061.png': 'lid-red',           'image 6346062.png': 'tube-red',
  'image 6346063.png': 'can-gatorade',      'image 6346064.png': 'bottle-barley',
  'image 6346065.png': 'cup-coffee',        'image 6346067.png': 'cup-noodle',
  'image 6346068.png': 'cap-blue',          'image 6346069.png': 'straw-red',
  'image 6346071.png': 'box-foam',          'image 6346072.png': 'umbrella-purple',
  'image 6346073.png': 'can-tuna',          'image 6346074.png': 'can-pringles-green',
  'image 6346075.png': 'floss-pick',        'image 6346076.png': 'can-cantata',
  'image 6346077.png': 'bag-snack-red',     'image 6346078.png': 'bottle-purple',
  'image 6346079.png': 'bag-blue',          'image 6346107.png': 'doll-rabbit',
  'IMG_6847 1.png': 'bag-trash-blue',       'IMG_6850 1.png': 'bin-pink',
  '그물 누끼 1.png': 'net-green',            '보라 5.png': 'glove-purple',
}

const PHOTO = []
for (const d of dirs) {
  for (const f of (await readdir(d)).sort()) {
    if (!/\.(png|jpe?g)$/i.test(f)) continue
    if (OBJECT[nfc(f)]) continue
    PHOTO.push(join(d, f))
  }
}

await mkdir(join(SRC, 'object'), { recursive: true })
await mkdir(join(SRC, 'photo'), { recursive: true })
const manifest = { object: [], photo: [] }

for (const [orig, slug] of Object.entries(OBJECT)) {
  await copyFile(await find(orig), join(SRC, 'object', slug + '.png'))
  manifest.object.push({ name: slug, from: orig })
}

/* 색은 기계가 읽는다. 사람이 99장을 눈으로 세면 틀린다. */
const seq = {}
for (const p of PHOTO.sort()) {
  const { color, ratio } = await accent(p)
  const n = (seq[color] = (seq[color] ?? 0) + 1)
  const ext = p.toLowerCase().endsWith('.png') ? '.png' : '.jpg'
  const slug = `${color}-${String(n).padStart(2, '0')}`
  await copyFile(p, join(SRC, 'photo', slug + ext))
  manifest.photo.push({ name: slug, color, ratio, from: p.split('/').pop() })
}

await writeFile(join(SRC, '_manifest.json'), JSON.stringify(manifest, null, 1))
await writeFile('scripts/waste-manifest.json', JSON.stringify(manifest, null, 1))
console.log('누끼', manifest.object.length, '장 · 사진', manifest.photo.length, '장')
console.log('색:', Object.entries(seq).sort((a, b) => b[1] - a[1]).map(([k, v]) => `${k} ${v}`).join(' · '))
