import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { initAnalytics, observeSections } from './lib/analytics.ts'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

initAnalytics()
requestAnimationFrame(() => {
  observeSections(['problem', 'features', 'reviews', 'faq', 'signup'])
})
