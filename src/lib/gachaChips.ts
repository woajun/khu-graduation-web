// 가챠에서 등록한 컬러칩. 전시용 iMac 한 대에서만 쌓이면 되므로 그 브라우저의 localStorage 에 둔다
// (글자 몇 줄짜리라 용량 걱정이 없고, 창을 닫거나 재부팅해도 남는다)
export type GachaChip = {
  id: string
  color: string
  name: string
  author: string
  // 색을 뽑은 아카이빙 사진 이름
  photo: string
  createdAt: number
}

const STORAGE_KEY = 'gacha-chips-v1'

const isChip = (v: unknown): v is GachaChip => {
  const c = v as GachaChip
  return !!c && typeof c.id === 'string' && typeof c.color === 'string' && typeof c.name === 'string'
}

/** 저장된 컬러칩을 읽는다. 저장소를 못 쓰거나 값이 깨져 있으면 빈 목록 */
export function loadChips(): GachaChip[] {
  try {
    const list: unknown = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]')
    return Array.isArray(list) ? list.filter(isChip) : []
  } catch {
    return []
  }
}

const newId = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`

/**
 * 지금 목록 뒤에 새 컬러칩을 붙여 저장하고 새 목록을 돌려준다.
 * 저장이 막혀도 이번 화면에서는 보이도록 목록은 그대로 돌려준다
 */
export function addChip(chips: readonly GachaChip[], chip: Omit<GachaChip, 'id' | 'createdAt'>): GachaChip[] {
  const list = [...chips, { ...chip, id: newId(), createdAt: Date.now() }]
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list))
  } catch {
    // 시크릿 창 등에서 저장이 막혀도 화면 흐름은 그대로 둔다
  }
  return list
}
