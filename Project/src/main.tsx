import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { initAnalytics, observeSections } from './lib/analytics.ts'
import { isApplyPath } from './lib/route.ts'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

initAnalytics()
if (!isApplyPath(location.pathname)) {
  requestAnimationFrame(() => {
    observeSections(['problem', 'features', 'faq', 'signup'])
  })
}
