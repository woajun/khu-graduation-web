import { Header } from './components/Header'
import { Lens } from './components/Lens'
import { useCutDeck } from './lib/useCutDeck'
import { useRoute } from './lib/useRoute'
import { useScrollFx } from './lib/useScrollFx'
import { Hero } from './scenes/Hero'
import { Intro } from './scenes/Intro'
import { Archive } from './scenes/Archive'
import { ColorIndex } from './scenes/ColorIndex'
import { Gacha } from './scenes/Gacha'
import './styles/app.css'

/** Lens 가 두 번 렌더하는 본문. 밝은 사본과 어두운 사본이 완전히 같은 DOM 이어야 한다. */
function ArchiveContent() {
  return (
    <>
      <Hero />
      <Intro />
      <Archive />
      <ColorIndex />
    </>
  )
}

/** 컷 전환과 렌즈는 아카이브 페이지에만 붙는다. */
function ArchivePage() {
  useCutDeck()
  useScrollFx()

  return (
    <Lens>
      <ArchiveContent />
    </Lens>
  )
}

export default function App() {
  const route = useRoute()

  return (
    <>
      <Header route={route} variant={route === 'gacha' ? 'inline' : 'reveal'} />
      {route === 'gacha' ? <Gacha /> : <ArchivePage />}
    </>
  )
}
