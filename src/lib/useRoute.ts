import { useEffect, useState } from 'react'

export type Route = 'landing' | 'archiving' | 'gacha'

/**
 * 주소창의 해시를 경로로 읽는다. 페이지가 몇 개뿐이라 라우터를 들일 이유가 없다.
 *
 * 맨 처음 화면도 이름을 갖는다(`#/archiving`). 시안에서 이 묶음을 그렇게 부르고,
 * 이름이 있어야 링크로 가리킬 수 있다 — 루트로 두면 "그 첫 화면" 이라고 말로만 부르게 된다.
 */
const read = (): Route => {
  const h = location.hash.replace(/^#\/?/, '')
  return h === 'gacha' ? 'gacha' : h === 'archiving' ? 'archiving' : 'landing'
}

/** 랜딩은 루트다 — 아이콘을 누르면 오는 자리라 주소도 맨 앞이어야 한다. */
export const routePath = (route: Route) => (route === 'landing' ? '#/' : `#/${route}`)

export function useRoute(): Route {
  const [route, setRoute] = useState<Route>(() =>
    typeof location === 'undefined' ? 'landing' : read(),
  )

  useEffect(() => {
    const onChange = () => setRoute(read())
    addEventListener('hashchange', onChange)
    return () => removeEventListener('hashchange', onChange)
  }, [])

  return route
}
