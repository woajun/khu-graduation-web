import type { CSSProperties } from 'react'
import { asset } from '../lib/assets'
import { IMAGE_SIZES } from '../lib/image-sizes'

type Props = {
  /** public/interaction/ 안의 파일명. */
  name: string
  /** 빈 문자열이면 장식으로 보고 접근성 트리에서 뺀다. */
  alt?: string
  className?: string
  style?: CSSProperties
  /** 첫 화면에 보이는 이미지에만 켠다. */
  eager?: boolean
}

/**
 * 시안 에셋 한 장. width/height 를 원본 픽셀로 박아 두기 때문에 브라우저가
 * 로딩 전에 자리를 잡아 두고, 늦게 뜬 사진이 스크롤을 밀어 올리지 않는다.
 */
export function Asset({ name, alt = '', className, style, eager }: Props) {
  const [width, height] = IMAGE_SIZES[name] ?? [undefined, undefined]
  const decorative = alt === ''

  return (
    <img
      className={className}
      src={asset(name)}
      alt={alt}
      aria-hidden={decorative || undefined}
      width={width}
      height={height}
      loading={eager ? 'eager' : 'lazy'}
      decoding="async"
      draggable={false}
      style={style}
    />
  )
}
