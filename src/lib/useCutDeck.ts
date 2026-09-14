import { useEffect } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { measureCuts, nearestCut } from './cuts'

/** 컷 하나를 넘기는 데 걸리는 시간(초). */
const DURATION = 1.35
/** 전환이 끝난 뒤 입력을 다시 받기까지의 여유. 트랙패드 관성이 다음 컷을 밀어버리는 걸 막는다. */
const COOLDOWN = 160
/** 터치로 컷을 넘길 최소 스와이프 거리(px). */
const SWIPE = 48

const KEY_STEP: Record<string, number> = {
  ArrowDown: 1,
  ArrowRight: 1,
  PageDown: 1,
  ' ': 1,
  ArrowUp: -1,
  ArrowLeft: -1,
  PageUp: -1,
}

/**
 * 스크롤을 컷 단위로 바꾼다.
 *
 * 네이티브 스크롤은 막고, 휠/스와이프/키 입력 한 번마다 다음 컷까지 스크롤을 애니메이션한다.
 * 전환이 끝나기 전에는 어떤 입력도 받지 않아서 컷이 건너뛰어지지 않는다.
 *
 * 단, 마지막 컷(아카이브 머리말) 아래로는 손을 떼고 평범한 스크롤로 돌려준다.
 * 사진 41장을 한 화면씩 끊어 넘기면 훑어보기가 불편하다. 다시 위로 올라와
 * 마지막 컷에 닿으면 컷 모드가 알아서 다시 잡는다.
 *
 * prefers-reduced-motion 에서는 아무것도 하지 않는다. 스크롤을 가로채는 것 자체가
 * 멀미를 유발하는 동작이라, 그런 사용자에게는 평범한 스크롤을 그대로 남겨둔다.
 */
export function useCutDeck() {
  useEffect(() => {
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return

    history.scrollRestoration = 'manual'

    let cuts = measureCuts()
    let index = nearestCut(cuts, scrollY)
    let animating = false
    let lockedUntil = 0
    let tween: gsap.core.Tween | null = null

    /** 컷 구간의 끝. 이 아래는 평범한 스크롤이다. */
    const deckEnd = () => cuts[cuts.length - 1] ?? 0

    /** 지금 위치가 자유 스크롤 구간인지. */
    const isFree = (goingDown: boolean) =>
      scrollY > deckEnd() + 2 || (goingDown && scrollY >= deckEnd() - 2)

    /** 지금 실제 스크롤에서 다시 센다. 밖에서 스크롤이 바뀌어도 컷 번호가 어긋나지 않는다. */
    const sync = () => {
      if (!animating) index = nearestCut(cuts, scrollY)
      return index
    }

    const goTo = (next: number) => {
      const target = Math.min(Math.max(next, 0), cuts.length - 1)
      if (target === index && !animating) return

      index = target
      animating = true
      tween?.kill()

      const proxy = { y: scrollY }
      tween = gsap.to(proxy, {
        y: cuts[index],
        duration: DURATION,
        ease: 'power2.inOut',
        onUpdate: () => scrollTo(0, proxy.y),
        onComplete: () => {
          animating = false
          lockedUntil = performance.now() + COOLDOWN
        },
      })
    }

    const onWheel = (e: WheelEvent) => {
      if (isFree(e.deltaY > 0)) {
        // preventDefault 를 하지 않으면 브라우저가 알아서 스크롤한다
        tween?.kill()
        animating = false
        return
      }
      e.preventDefault()

      const now = performance.now()
      if (animating || now < lockedUntil) {
        // 관성이 이어지는 동안에는 잠금을 계속 뒤로 민다. 손을 뗀 뒤에야 다음 컷으로 간다.
        lockedUntil = Math.max(lockedUntil, now + COOLDOWN)
        return
      }
      if (Math.abs(e.deltaY) < 4) return

      goTo(sync() + (e.deltaY > 0 ? 1 : -1))
    }

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return

      if (e.key === 'Home' || e.key === 'End') {
        e.preventDefault()
        if (!animating) goTo(e.key === 'Home' ? 0 : cuts.length - 1)
        return
      }

      const step = KEY_STEP[e.key]
      if (step === undefined) return
      if (isFree(step > 0)) return
      e.preventDefault()
      if (animating) return
      goTo(sync() + step)
    }

    let touchY = 0
    const onTouchStart = (e: TouchEvent) => {
      touchY = e.touches[0].clientY
    }
    const onTouchMove = (e: TouchEvent) => {
      // 손가락이 올라가면(아래로 스크롤) 자유 구간인지 그때그때 본다
      if (isFree(touchY - e.touches[0].clientY > 0)) return
      e.preventDefault()
    }
    const onTouchEnd = (e: TouchEvent) => {
      if (animating || performance.now() < lockedUntil) return
      const dy = touchY - e.changedTouches[0].clientY
      if (Math.abs(dy) < SWIPE) return
      if (isFree(dy > 0)) return
      goTo(sync() + (dy > 0 ? 1 : -1))
    }

    const onResize = () => {
      cuts = measureCuts()
      index = Math.min(index, cuts.length - 1)
      tween?.kill()
      animating = false
      scrollTo(0, cuts[index])
      ScrollTrigger.refresh()
    }

    scrollTo(0, cuts[index])

    addEventListener('wheel', onWheel, { passive: false })
    addEventListener('keydown', onKeyDown)
    addEventListener('touchstart', onTouchStart, { passive: true })
    addEventListener('touchmove', onTouchMove, { passive: false })
    addEventListener('touchend', onTouchEnd, { passive: true })
    addEventListener('resize', onResize)

    return () => {
      tween?.kill()
      removeEventListener('wheel', onWheel)
      removeEventListener('keydown', onKeyDown)
      removeEventListener('touchstart', onTouchStart)
      removeEventListener('touchmove', onTouchMove)
      removeEventListener('touchend', onTouchEnd)
      removeEventListener('resize', onResize)
      history.scrollRestoration = 'auto'
    }
  }, [])
}
