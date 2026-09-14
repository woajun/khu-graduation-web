import { Asset } from './components/Asset'
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
      {/* 내비는 렌즈 밖에 둔다. 화면에 고정된 요소를 렌즈 안에 넣으면
          clip-path 가 문서 좌표로 자르기 때문에 엉뚱한 데가 잘린다. */}
      <Asset className="nav" name="nav.webp" alt="ARCHIVE" eager />
      <Lens>
        <Content />
      </Lens>
    </>
  )
}
