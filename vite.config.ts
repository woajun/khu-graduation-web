import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

/**
 * GitHub Pages 프로젝트 사이트는 https://<아이디>.github.io/<저장소>/ 로 서빙된다.
 * base 를 저장소 이름으로 맞춰야 에셋 경로 앞에 그 한 칸이 붙는다.
 * 개발 서버나 다른 호스팅(Vercel 등)에서는 루트로 두면 된다.
 */
const base = process.env.BASE_PATH ?? '/'

// https://vite.dev/config/
export default defineConfig({
  base,
  plugins: [react()],
})
