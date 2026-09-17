import { useEffect, useRef, useState } from 'react'

/** 메뉴 항목. 아직 붙일 페이지가 없어 링크는 현재 문서를 가리킨다. */
const LINKS = [
  { label: 'Archiving', href: '#', current: true },
  { label: 'magazine', href: '#', current: false },
  { label: 'gacha', href: '#', current: false },
]

/**
 * 상단 헤더.
 *
 * 평소에는 격자 표시만 떠 있고, 여기에 마우스를 올리거나 누르면 활성 상태가 된다.
 * 활성 상태에서는 격자 칸이 검게 차고 아래로 메뉴가 펼쳐진다(reference/Frame 32.png).
 *
 * 렌즈 바깥에 둔다. 화면에 고정된 요소를 렌즈 안에 넣으면 clip-path 가 문서 좌표로
 * 자르기 때문에 엉뚱한 데가 잘린다.
 */
export function Header() {
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

  const active = open || pinned

  return (
    <header
      className={`nav${active ? ' is-active' : ''}`}
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
        onClick={() => setPinned((v) => !v)}
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
        {LINKS.map((link) => (
          <a
            key={link.label}
            className={`nav__link${link.current ? ' is-current' : ''}`}
            href={link.href}
            aria-current={link.current ? 'page' : undefined}
            tabIndex={active ? undefined : -1}
          >
            {link.label}
          </a>
        ))}
      </nav>
    </header>
  )
}
