import { useEffect, useState } from 'react'

export type Route = 'archive' | 'gacha'

/** 주소창의 해시를 경로로 읽는다. 페이지가 몇 개뿐이라 라우터를 들일 이유가 없다. */
const read = (): Route => (location.hash.replace(/^#\/?/, '') === 'gacha' ? 'gacha' : 'archive')

export const routePath = (route: Route) => (route === 'archive' ? '#/' : `#/${route}`)

export function useRoute(): Route {
  const [route, setRoute] = useState<Route>(() =>
    typeof location === 'undefined' ? 'archive' : read(),
  )

  useEffect(() => {
    const onChange = () => setRoute(read())
    addEventListener('hashchange', onChange)
    return () => removeEventListener('hashchange', onChange)
  }, [])

  return route
}
