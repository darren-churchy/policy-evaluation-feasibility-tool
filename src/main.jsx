import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { HashRouter } from 'react-router-dom'
import './index.css'
import App from './App.jsx'
import { AnswersProvider } from './state/AnswersContext.jsx'

// HashRouter is retained from the GitHub Pages era. On Cloudflare Pages a _redirects SPA
// fallback is in place, so BrowserRouter is now viable — see docs/REDESIGN_PLAN.md.

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <HashRouter>
      {/* One answer store for every tool: a question answered once is never asked again. */}
      <AnswersProvider>
        <App />
      </AnswersProvider>
    </HashRouter>
  </StrictMode>
)
