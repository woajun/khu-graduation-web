import { useEffect, useRef, useState } from 'react'

import { routePath, type Route } from '../lib/useRoute'

/**
 * 메뉴 항목.
 *
 * 시안마다 첫 항목 이름이 다르다 — 아카이브 쪽은 'Archiving', 가챠 쪽은 'color book'.
 * 나중 시안인 가챠 것을 따랐다. magazine 은 아직 페이지가 없어 자리만 잡아둔다.
 */
const LINKS: { label: string; route: Route | null }[] = [
  { label: 'color book', route: 'archive' },
  { label: 'magazine', route: null },
  { label: 'gacha', route: 'gacha' },
]

/**
 * 상단 헤더.
 *
 * 평소에는 격자 표시만 떠 있고, 여기에 마우스를 올리거나 누르면 활성 상태가 된다.
 * 활성 상태에서는 격자 칸이 검게 차고 아래로 메뉴가 펼쳐진다(assets-src/reference/Frame 32.png).
 *
 * 렌즈 바깥에 둔다. 화면에 고정된 요소를 렌즈 안에 넣으면 clip-path 가 문서 좌표로
 * 자르기 때문에 엉뚱한 데가 잘린다.
 */
type Props = {
  /** 지금 보고 있는 페이지. 해당 항목이 검게 표시된다. */
  route: Route
  /**
   * 'reveal' — 격자만 떠 있다가 올리면 메뉴가 펼쳐진다(아카이브).
   * 'inline' — 격자가 왼쪽에 붙고 메뉴가 늘 보인다(가챠).
   */
  variant?: 'reveal' | 'inline'
}

export function Header({ route, variant = 'reveal' }: Props) {
  const [open, setOpen] = useState(false)
  const [pinned, setPinned] = useState(false)
  const rootRef = useRef<HTMLElement>(null)

  // 눌러서 연 경우에는 바깥을 누르거나 Esc 를 눌러야 닫힌다.
  useEffect(() => {
    if (!pinned) return

    const onPointerDown = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) {
        setPinned(false)
        setOpen(false)
      }
    }
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setPinned(false)
        setOpen(false)
      }
    }

    addEventListener('pointerdown', onPointerDown)
    addEventListener('keydown', onKeyDown)
    return () => {
      removeEventListener('pointerdown', onPointerDown)
      removeEventListener('keydown', onKeyDown)
    }
  }, [pinned])

  const active = variant === 'inline' || open || pinned

  return (
    <header
      className={`nav nav--${variant}${active ? ' is-active' : ''}`}
      ref={rootRef}
      onPointerEnter={(e) => {
        // 터치는 탭으로만 연다. 손가락이 스치는 것까지 열리면 성가시다.
        if (e.pointerType === 'mouse') setOpen(true)
      }}
      onPointerLeave={(e) => {
        if (e.pointerType === 'mouse') setOpen(false)
      }}
      onFocus={() => setOpen(true)}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node)) setOpen(false)
      }}
    >
      <button
        type="button"
        className="nav__toggle"
        aria-expanded={active}
        aria-controls="nav-menu"
        // 메뉴가 늘 보이는 쪽에서는 여는 버튼이 아니라 홈으로 가는 표시다
        onClick={() => {
          if (variant === 'inline') location.hash = routePath('archive')
          else setPinned((v) => !v)
        }}
      >
        {/* 시안은 1920 폭에서 28px 격자 — 1px 선 네 줄과 8px 칸 세 개로 딱 떨어진다.
            선을 0.5 좌표에 놓아야 1px 이 픽셀 경계에 정확히 앉아 뭉개지지 않는다. */}
        <svg className="nav__grid" viewBox="0 0 28 28" aria-hidden="true">
          {/* 칸 안쪽. 활성일 때만 채워진다 */}
          <rect className="nav__grid-fill" x="0" y="0" width="28" height="28" />
          {/* 격자선은 두 상태에서 똑같다 */}
          <path
            className="nav__grid-lines"
            d="M0.5 0V28M9.5 0V28M18.5 0V28M27.5 0V28M0 0.5H28M0 9.5H28M0 18.5H28M0 27.5H28"
          />
        </svg>
        <span className="nav__label">메뉴</span>
      </button>

      <nav className="nav__menu" id="nav-menu" aria-label="주요 메뉴">
        {LINKS.map((link) => {
          const current = link.route === route
          return (
            <a
              key={link.label}
              className={`nav__link${current ? ' is-current' : ''}`}
              href={link.route ? routePath(link.route) : '#'}
              aria-current={current ? 'page' : undefined}
              aria-disabled={link.route ? undefined : true}
              tabIndex={active ? undefined : -1}
            >
              {link.label}
            </a>
          )
        })}
      </nav>
    </header>
  )
}
