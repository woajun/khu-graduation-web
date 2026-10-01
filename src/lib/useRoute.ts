import { useEffect, useState } from 'react'

export type Route = 'archiving' | 'gacha'

/**
 * 주소창의 해시를 경로로 읽는다. 페이지가 몇 개뿐이라 라우터를 들일 이유가 없다.
 *
 * 맨 처음 화면도 이름을 갖는다(`#/archiving`). 시안에서 이 묶음을 그렇게 부르고,
 * 이름이 있어야 링크로 가리킬 수 있다 — 루트로 두면 "그 첫 화면" 이라고 말로만 부르게 된다.
 */
const read = (): Route => (location.hash.replace(/^#\/?/, '') === 'gacha' ? 'gacha' : 'archiving')

export const routePath = (route: Route) => `#/${route}`

export function useRoute(): Route {
  const [route, setRoute] = useState<Route>(() =>
    typeof location === 'undefined' ? 'archiving' : read(),
  )

  useEffect(() => {
    /* 맨 처음 들어오면 주소에 이름을 적어 준다. 뒤로 가기에 빈 칸을 남기지 않으려고
       history 를 쌓지 않고 바꿔 끼운다. */
    if (!location.hash || location.hash === '#' || location.hash === '#/') {
      history.replaceState(null, '', routePath('archiving'))
      setRoute('archiving')
    }
    const onChange = () => setRoute(read())
    addEventListener('hashchange', onChange)
    return () => removeEventListener('hashchange', onChange)
  }, [])

  return route
}
