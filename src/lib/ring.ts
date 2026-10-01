import { WASTE_SIZES, type WasteObject } from './waste'

/**
 * 랜딩의 개체들 — 어디서 들어와, 어디에 모였다가, 어디에 서는가.
 *
 * Landing 안에 있었는데 상세 페이지도 같은 목록을 읽어야 해서 밖으로 꺼냈다.
 * <b>어느 쪽 원에 섰나</b>가 상세로 넘어가는 방향을 정하기 때문이다.
 *
 * ── 모인 자리는 세지 않고 적는다 ──
 *
 * 원 위의 자리는 센다(360/n). 고르게 놓는 게 전부라 규칙이 곧 답이다.
 * 그런데 <b>모였을 때</b>의 자리는 규칙이 없다 — 시안에서 사람이 눈으로 맞춘 그림이다.
 * 극좌표로 흩뿌려 봤더니 비슷해 보이지도 않았고, 하나를 고치면 이웃이 어긋났다.
 * 그래서 그림에서 읽은 좌표를 그대로 적는다. 시안이 바뀌면 이 표만 고친다.
 */
export type Side = 'left' | 'right'

export const SIDES: Side[] = ['left', 'right']

/**
 * 모였을 때의 한 자리.
 *
 * `x`·`y` 는 화면 폭·높이에 대한 %, `w` 는 화면 폭에 대한 % 다.
 * 픽셀로 적으면 화면 크기가 바뀔 때 그림이 깨진다 — 시안도 비율로 그려져 있다.
 *
 * 차례가 곧 도착 차례다. 양쪽을 번갈아 두었다 — 한쪽이 다 찬 뒤 다른 쪽이 차면
 * '사방에서 모인다' 로 안 보인다.
 */
/**
 * *7 도는 차례 — 시안의 원 그림에서 맨 위부터 시계 방향으로 읽었다.
 *
 * 이 차례가 두 원에 번갈아 나뉜다. 한쪽에 앞 절반, 다른 쪽에 뒤 절반을 주면
 * 두 원의 생김새가 아주 달라진다 — 번갈아 주면 양쪽 모두 이 차례를 그대로 닮는다.
 */
const RING_ORDER: WasteObject[] = [
  'cup-noodle',
  'can-tuna',
  'can-coke-crushed',
  'box-foam',
  'cup-yogurt',
  'glove-black',
  'can-coke',
  'cap-blue',
  'glove-purple',
  'ashtray-jar',
  'box-adidas',
  'lid-red',
  'box-stack',
  'can-gatorade',
  'cup-coffee',
  'handle-yellow',
  'part-blue',
  'straw-red',
]

/**
 * *3 모였을 때의 자리 — 시안 그림에서 그대로 읽었다.
 *
 * `x`·`y` 는 화면 폭·높이에 대한 %, `w` 는 화면 폭에 대한 % 다.
 * 픽셀로 적으면 화면 크기가 바뀔 때 그림이 깨진다 — 시안도 비율로 그려져 있다.
 *
 * ── 왜 여기만 적는가 ──
 *
 * 원 위의 자리는 센다(360/n). 고르게 놓는 게 전부라 규칙이 곧 답이다.
 * 그런데 모인 자리는 규칙이 없다 — 시안에서 사람이 눈으로 맞춘 그림이다.
 * 극좌표로 흩뿌려 봤더니 비슷해 보이지도 않았고, 하나를 고치면 이웃이 어긋났다.
 */
type Spot = { x: number; y: number; w: number }

const GATHER: Partial<Record<WasteObject, Spot>> = {
  'straw-red': { x: 50.4, y: 13.5, w: 24.8 },
  'glove-purple': { x: 15.6, y: 36.9, w: 21.3 },
  'part-blue': { x: 66.4, y: 23.3, w: 13.5 },
  'box-foam': { x: 20.3, y: 18.4, w: 16.3 },
  'handle-yellow': { x: 89.4, y: 27.0, w: 12.1 },
  'can-gatorade': { x: 17.0, y: 76.2, w: 15.6 },
  'cup-coffee': { x: 67.7, y: 43.7, w: 11.1 },
  'ashtray-jar': { x: 29.1, y: 61.4, w: 18.4 },
  'box-stack': { x: 85.8, y: 59.7, w: 22.0 },
  'cup-noodle': { x: 31.5, y: 27.0, w: 10.6 },
  'lid-red': { x: 69.8, y: 71.7, w: 16.7 },
  'box-adidas': { x: 36.6, y: 78.1, w: 22.0 },
  'cap-blue': { x: 55.3, y: 84.8, w: 7.8 },
  'can-coke-crushed': { x: 9.2, y: 70.8, w: 15.6 },
  /* can-tuna · can-coke · cup-yogurt · glove-black 은 여기 없다.
     원 그림에는 있는데 모이는 그림에는 없어서다. 자리를 지어내지 않는다 —
     없는 것은 모일 때 안 나오고, 원이 된 뒤에 떠오른다. */
}

/** 컵 가운데가 서는 자리(화면 폭의 %). 컵이 반만 보이도록 양 끝에 둔다.
    styles.css 의 .cupring--left/right 와 같아야 한다 — 모인 자리를 그 가운데에서
    잰 거리로 넣기 때문이다. */
const CUP_X: Record<Side, number> = { left: 0, right: 100 }

/**
 * *2 다 날아드는 데 걸리는 폭(초).
 *
 * 처음에는 0.2초씩 또박또박 끊었다. 세어 보면 고른데 보고 있으면 기계가 찍어 내는
 * 것 같았다 — 주워 모은 쓰레기가 모이는 장면이라 그 고름이 거짓말이 된다.
 * 그래서 이 폭 안에서 저마다 제멋대로 도착한다. 올 때마다 차례가 달라진다.
 *
 * 3.2초였다가 줄였다. 첫째와 막내 사이가 그만큼 벌어지면 '하나씩 모인다' 가 아니라
 * '한참 기다린다' 가 된다 — 제멋대로인 것과 느린 것은 다른 일이다.
 */
const SPAN = 1.6
/** 원에 섰을 때의 기준 크기(vmin). 넓이가 이만큼 되게 폭을 맞춘다. */
const UNIT = 9

export type Piece = {
  name: WasteObject
  side: Side
  /** 원 위의 자리(도). 360/n 으로 고르게 나눈다. */
  angle: number
  /** 모인 자리 — 제 컵 가운데에서 얼마나 떨어져 있나. gx 는 vw, gy 는 vh. */
  gx: number
  gy: number
  /** 들어오기 전 자리 — 제 자리에서 얼마나 밀려나 있나. dx 는 화면 폭의 %, dy 는 높이의 %. */
  dx: number
  dy: number
  /** 모였을 때의 폭(vw 단위로 쓸 숫자). 떠오르는 개체는 모일 때가 없어서 0 이다. */
  gw: number
  /** 모이는 그림에 없던 개체. 원이 된 뒤에 투명에서 불투명으로 떠오른다. */
  late: boolean
  /** 원에 섰을 때의 폭(vmin 단위로 쓸 숫자) */
  w: number
  /** 몇 번째로 도착하나(초) */
  delay: number
  /** 둥실거리는 주기(초) */
  float: number
}

/** 소수점 둘째 자리까지. 스타일 값에 긴 소수가 박히면 읽히지 않는다. */
const round = (n: number) => Math.round(n * 100) / 100

/**
 * 넓적한 것과 길쭉한 것을 <b>같은 넓이</b>로 맞춘다.
 *
 * 폭을 전부 같게 주면 넓적한 개체가 훨씬 작아 보인다 — 높이가 그만큼 낮으니까.
 * 넓이를 맞추려면 폭 = 기준 × √(가로/세로) 다. 비율은 좁게 잘라 둔다 —
 * 넓이를 정확히 맞추는 것보다 열넷이 <b>한 벌</b>로 보이는 게 먼저다.
 */
function widthOf(name: WasteObject) {
  const size = WASTE_SIZES[`object/${name}`]
  const ratio = size ? Math.min(1.18, Math.max(0.85, size[0] / size[1])) : 1
  return UNIT * Math.sqrt(ratio)
}

/**
 * *2 어느 테두리에서 날아드나 — 제 자리에서 <b>가장 가까운</b> 쪽에서.
 *
 * 아무 방향에서나 오게 했더니 왼쪽 끝에 설 개체가 오른쪽 끝에서 화면을 가로질러
 * 왔다. 길이 서로 엉키고, 같은 1.5초에 어떤 것은 한 뼘 어떤 것은 화면 두 폭을 간다.
 * 가까운 테두리에서 똑바로 들어오면 길이 안 엉키고 속도도 고르게 보인다.
 *
 * 돌아오는 값은 <b>화면 폭·높이에 대한 %</b> 다 — 가로는 폭, 세로는 높이로 재야
 * 어느 화면에서나 같은 만큼 밖에 선다. 40 은 테두리 너머 여유다.
 */
function entry(spot: Spot) {
  const EDGE = 40
  const near = Math.min(spot.x, 100 - spot.x, spot.y, 100 - spot.y)
  if (near === spot.x) return { dx: -round(spot.x + EDGE), dy: 0 }
  if (near === 100 - spot.x) return { dx: round(100 - spot.x + EDGE), dy: 0 }
  if (near === spot.y) return { dx: 0, dy: -round(spot.y + EDGE) }
  return { dx: 0, dy: round(100 - spot.y + EDGE) }
}

export const PIECES: Piece[] = (() => {
  const n = RING_ORDER.length

  /* 두 원은 <b>같은 원</b>이다. 그래서 한 벌이 아니라 두 벌을 만든다.

     모일 때는 두 벌이 같은 자리에 정확히 겹쳐 있어서 열여덟 개로 보이고,
     원이 될 때 각자 제 컵으로 갈라진다 — '모였던 것이 둘로 나뉘어 돈다' 가 된다.
     한 벌만 만들어 두 쪽에 나눠 주면 양쪽 원이 서로 다른 원이 되어 버린다. */
  return SIDES.flatMap((side) =>
    RING_ORDER.map((name, i): Piece => {
      /* 모이는 그림에는 개체가 한 번씩만 나온다. 그러니 두 벌 중 한 벌만 모인다.

         어느 벌이 모일지는 <b>그 개체가 화면 어느 쪽에 모였나</b>로 정한다.
         왼쪽에 모인 것은 왼쪽 컵으로, 오른쪽에 모인 것은 오른쪽 컵으로 간다 —
         한 벌만 모이게 두면 오른쪽에 있던 개체가 화면을 가로질러 왼쪽으로 날아간다.

         나머지 한 벌과 그림에 아예 없던 개체는 원이 된 뒤에 떠오른다. */
      const here = GATHER[name]
      const spot = here && (here.x < 50 ? 'left' : 'right') === side ? here : undefined
      const w = round(widthOf(name))
      // 어디서 날아오나 — 제 자리에서 가장 가까운 테두리에서 똑바로.
      const in_ = spot ? entry(spot) : { dx: 0, dy: 0 }

      return {
        name,
        side,
        // -90 에서 시작해 맨 위부터 시계 방향으로 고르게 선다.
        angle: round((i * 360) / n - 90),
        // 떠오르는 개체는 처음부터 제 원 자리에 서 있다. 안 보이니 날아올 것도 없다.
        gx: spot ? round(spot.x - CUP_X[side]) : 0,
        gy: spot ? round(spot.y - 50) : 0,
        dx: in_.dx,
        dy: in_.dy,
        gw: spot ? spot.w : 0,
        late: !spot,
        w,
        delay: spot ? round(Math.random() * SPAN) : 0,
        float: 4.5 + (i % 4) * 0.7,
      }
    }),
  )
})()

/** 마지막 개체가 들어오고(지연 + 1.5s) 잠깐 머문 뒤 원으로 퍼진다.
    도착 차례가 제멋대로라 '마지막' 을 세어야 한다 — 늦게 오는 하나를 두고 갈라지면 안 된다. */
export const GATHER_MS = Math.round((Math.max(...PIECES.map((p) => p.delay)) + 1.5 + 1) * 1000)

export const piecesOf = (side: Side) => PIECES.filter((p) => p.side === side)

/**
 * 누르면 개체가 가는 방향. 왼쪽 원의 것은 오른쪽으로, 오른쪽 원의 것은 왼쪽으로 넘어간다.
 * 상세 페이지도 이 쪽에 큰 개체를 세운다 — 나간 자리에서 이어 받아야 끊기지 않는다.
 *
 * 이름으로는 못 정한다. 두 원이 같은 원이라 개체마다 양쪽에 하나씩 있기 때문이다 —
 * <b>어느 쪽 것을 눌렀나</b>가 곧 방향이다.
 */
export const arriveOf = (side: Side): Side => (side === 'left' ? 'right' : 'left')
