import { useEffect } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { HERO_OBJECTS } from './assets'

gsap.registerPlugin(ScrollTrigger)

/** 히어로 컷 전환이 읽히는 최소 폭. 이보다 좁으면 구도가 너무 작아 의미가 없다. */
const WIDE = '(min-width: 861px)'

/**
 * 아카이브에서 지금 보고 있는 사진 행이 커지는 배율.
 *
 * 행 아래 캡션까지 여백이 화면 폭의 1.7% 뿐이라 1.2 를 넘기면 번호를 덮는다.
 * 더 키우려면 app.css 의 .archive__caps 위쪽 여백을 같이 늘려야 한다.
 */
const FOCUS_SCALE = 1.15

/**
 * 배율이 오르내리는 화면 세로 구간. 행 중심이 enter 에서 leave 로 올라가는 동안
 * 커졌다 되돌아오므로, 가장 큰 지점은 둘의 가운데(= 화면 위에서 30%)가 된다.
 */
const FOCUS_BAND = { enter: '52%', leave: '8%' }

/**
 * 컷과 함께 움직이는 요소들.
 *
 * 각 애니메이션의 구간을 컷 경계(뷰포트 높이의 배수)에 딱 맞춰 두었기 때문에,
 * 컷 전환이 끝나는 순간 애니메이션도 정확히 끝난다.
 *
 *   컷 1 → 2 : 오브젝트가 떠오르고, 타이틀이 절반쯤 미끄러진다
 *   컷 2 → 3 : 라벨과 지시선이 들어오고, 타이틀이 제자리에 선다
 *
 * 타깃은 전부 `.js-*` 클래스 셀렉터다. Lens 가 같은 DOM 을 두 벌 그리기 때문에
 * 클래스로 잡으면 밝은 사본과 어두운 사본이 한 번에, 똑같이 움직인다.
 */
export function useScrollFx() {
  useEffect(() => {
    const mm = gsap.matchMedia()

    mm.add(`${WIDE} and (prefers-reduced-motion: no-preference)`, () => {
      gsap.utils.toArray<HTMLElement>('.js-hero-spacer').forEach((spacer) => {
        const headline = spacer.querySelector('.js-hero-headline')
        if (!headline) return

        // 타이틀은 무대 폭의 45.2% 만큼 왼쪽에서 출발한다. 이때 "LEFT BEHIND" 의 L 이
        // 화면 왼쪽 끝에 걸린다. 컷 3 에서 제자리.
        gsap.fromTo(
          headline,
          { xPercent: -45.2 },
          {
            xPercent: 0,
            ease: 'none',
            scrollTrigger: {
              trigger: spacer,
              // 컷 경계는 문서 스크롤 절대값으로 잡는다. 'top-=' 같은 상대 오프셋은
              // 방향이 헷갈려 컷과 어긋나기 쉽다.
              start: () => spacer.offsetTop,
              end: () => spacer.offsetTop + innerHeight * 2,
              scrub: true,
              invalidateOnRefresh: true,
            },
          },
        )

        // 오브젝트는 컷 2 에서 지그재그로 나타났다가 컷 3 에서 한 줄로 정렬된다.
        // 어긋남은 무대 높이 대비 퍼센트라, 무대 크기가 바뀌면 다시 계산해야 한다.
        const stage = spacer.querySelector<HTMLElement>('.stage')
        const stageHeight = () => stage?.offsetHeight ?? 0
        const zigPx = (percent: number) => (stageHeight() * percent) / 100

        /** 등장 전 대기 위치까지의 거리. 화면 안에서 출발하므로 무대 높이의 일부면 된다. */
        const TRAVEL = 0.22

        /**
         * 등장 전 대기 위치.
         * 지그재그에서 위에 서는 무리(zig 가 음수)는 제자리보다 위, 아래 무리는 아래에서
         * 출발한다. 그래야 위 3개는 떨어지고 아래 3개는 올라오는 것처럼 보인다.
         */
        const enterFrom = (zig: number) =>
          zigPx(zig) + stageHeight() * (zig < 0 ? -TRAVEL : TRAVEL)

        spacer.querySelectorAll<HTMLElement>('.js-hero-object').forEach((obj, i) => {
          const { zig } = HERO_OBJECTS[i % HERO_OBJECTS.length]
          // 뒤쪽 오브젝트일수록 조금 늦게 출발해 한꺼번에 딱 맞아떨어지지 않게 한다.
          const lag = (i % HERO_OBJECTS.length) * 0.07

          const tl = gsap.timeline({
            scrollTrigger: {
              trigger: spacer,
              start: () => spacer.offsetTop,
              end: () => spacer.offsetTop + innerHeight * 2,
              scrub: true,
              invalidateOnRefresh: true,
            },
          })

          // 앞 절반(컷 1 → 2): 위/아래에서 제 어긋난 자리로 들어오며 서서히 드러난다.
          tl.fromTo(
            obj,
            { y: () => enterFrom(zig), opacity: 0 },
            { y: () => zigPx(zig), opacity: 1, ease: 'none', duration: 1 },
            0,
          )
            // 뒷 절반(컷 2 → 3): 한 줄로 모인다.
            // 이징을 또 걸면 컷을 넘기는 스크롤 트윈(power2.inOut)과 곱해져
            // 중간 구간이 확 빨라진다. 여기서는 스크롤 진행에 그대로 비례시킨다.
            .fromTo(
              obj,
              { y: () => zigPx(zig) },
              { y: 0, ease: 'none', duration: 1 - lag, immediateRender: false },
              1 + lag,
            )
        })

        // 라벨과 지시선은 컷 2 → 3 구간에서만 들어온다.
        // fromTo 에 stagger 를 같이 주면 첫 요소에만 시작값이 박히므로 set 으로 먼저 눕힌다.
        const annotations = spacer.querySelectorAll('.js-hero-annotation')
        gsap.set(annotations, { opacity: 0 })
        gsap.to(
          annotations,
          {
            opacity: 1,
            ease: 'none',
            stagger: 0.05,
            scrollTrigger: {
              trigger: spacer,
              // 컷 2 에 도착한 뒤부터 들어와 컷 3 직전에 끝난다.
              start: () => spacer.offsetTop + innerHeight * 1.05,
              end: () => spacer.offsetTop + innerHeight * 1.92,
              scrub: true,
              invalidateOnRefresh: true,
            },
          },
        )
      })
    })

    mm.add('(prefers-reduced-motion: no-preference)', () => {
      // 떠다니는 오브젝트에 패럴랙스.
      gsap.utils.toArray<HTMLElement>('.js-float').forEach((el, i) => {
        gsap.to(el, {
          yPercent: -12 * (i % 2 === 0 ? 1.4 : 0.7),
          ease: 'none',
          scrollTrigger: { trigger: el, start: 'top bottom', end: 'bottom top', scrub: true },
        })
      })

      // 아카이브 사진 행은 화면 위쪽을 지나는 동안 부풀었다가 제 크기로 돌아온다.
      // 행 중심이 52% → 30% 로 오르는 동안 커지고, 30% → 8% 구간에서 되돌아온다.
      // scrub 에 시간을 줘서 자유 스크롤의 휠 눈금이 그대로 튀지 않게 한다.
      gsap.utils.toArray<HTMLElement>('.js-focus').forEach((row) => {
        gsap
          .timeline({
            scrollTrigger: {
              trigger: row,
              start: `center ${FOCUS_BAND.enter}`,
              end: `center ${FOCUS_BAND.leave}`,
              scrub: 0.6,
            },
          })
          .to(row, { scale: FOCUS_SCALE, ease: 'sine.inOut', duration: 1 })
          .to(row, { scale: 1, ease: 'sine.inOut', duration: 1 })
      })

      // 아카이브 행은 아래에서 살짝 밀려 올라온다.
      gsap.utils.toArray<HTMLElement>('.js-archive-row').forEach((row) => {
        gsap.fromTo(
          row,
          { y: 40, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            duration: 0.7,
            ease: 'power2.out',
            scrollTrigger: { trigger: row, start: 'top 95%' },
          },
        )
      })
    })

    // 이미지가 늦게 뜨면 문서 높이가 바뀌어 컷 경계도 밀린다. 다 뜬 뒤 한 번 다시 잰다.
    const refresh = () => ScrollTrigger.refresh()
    if (document.readyState === 'complete') refresh()
    else addEventListener('load', refresh, { once: true })

    return () => {
      removeEventListener('load', refresh)
      mm.revert()
    }
  }, [])
}
