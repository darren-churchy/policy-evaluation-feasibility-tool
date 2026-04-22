import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { HashRouter } from 'react-router-dom'
import App from './App.jsx'

// HashRouter is used instead of BrowserRouter so that GitHub Pages
// can serve the app correctly without server-side routing configuration.
// URLs will be of the form: https://your-org.github.io/repo-name/#/page1
// If you host on a server that supports SPA fallback routing,
// replace HashRouter with BrowserRouter for cleaner URLs.

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <HashRouter>
      <App />
    </HashRouter>
  </StrictMode>
)
