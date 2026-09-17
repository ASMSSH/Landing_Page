import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { initAnalytics, observeSections } from './lib/analytics.ts'
import { pixelStartApplication } from './lib/metaPixel.ts'
import { isApplyPath } from './lib/route.ts'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

initAnalytics()
if (isApplyPath(location.pathname)) {
  // 메타 픽셀 StartApplication — 신청 진입(SSH-573). 랜딩→/apply가 풀 페이지 로드라 여기가 페이지 로드당
  // 정확히 1회다. React 마운트에 걸면 StrictMode 이중 실행으로 dev에서 두 번 찍힌다
  pixelStartApplication()
} else {
  requestAnimationFrame(() => {
    observeSections(['problem', 'features', 'faq', 'signup'])
  })
}
