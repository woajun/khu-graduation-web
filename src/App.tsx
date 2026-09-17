import { Header } from './components/Header'
import { Lens } from './components/Lens'
import { useCutDeck } from './lib/useCutDeck'
import { useScrollFx } from './lib/useScrollFx'
import { Hero } from './scenes/Hero'
import { Intro } from './scenes/Intro'
import { Archive } from './scenes/Archive'
import { ColorIndex } from './scenes/ColorIndex'
import './styles/app.css'

/** Lens 가 두 번 렌더하는 본문. 밝은 사본과 어두운 사본이 완전히 같은 DOM 이어야 한다. */
function Content() {
  return (
    <>
      <Hero />
      <Intro />
      <Archive />
      <ColorIndex />
    </>
  )
}

export default function App() {
  useCutDeck()
  useScrollFx()

  return (
    <>
      <Header />
      <Lens>
        <Content />
      </Lens>
    </>
  )
}
