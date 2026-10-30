import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.jsx'
import { AnswersProvider } from './state/AnswersContext.jsx'
import LegacyHashRedirect from './state/LegacyHashRedirect.jsx'

// Real paths, served by the SPA fallback in public/_redirects. LegacyHashRedirect
// translates the `#/...` URLs the app used before, which are still in bookmarks and in
// the installed PWA's cache.

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      {/* One answer store for every tool: a question answered once is never asked again. */}
      <AnswersProvider>
        <LegacyHashRedirect />
        <App />
      </AnswersProvider>
    </BrowserRouter>
  </StrictMode>
)
