// Old hash URLs, still arriving.
//
// The app used HashRouter from its GitHub Pages days, so every link ever shared, every
// bookmark and every page cached by the installed PWA looks like `/#/ladder`. Switching to
// real paths would strand all of them on the landing page with a dead fragment — silently,
// which is the worst way to break a link.
//
// So on first load a leftover `#/...` is translated into the equivalent path and replaced
// in history. Retired paths then redirect as they would have anyway, so `/#/results` lands
// where `/results` does.

import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

export default function LegacyHashRedirect() {
  const navigate = useNavigate()

  useEffect(() => {
    const hash = window.location.hash
    if (!hash.startsWith('#/')) return
    const target = hash.slice(1)
    // Replace rather than push: the hash URL should not sit in the back history, or Back
    // returns the user to a redirect that fires again.
    window.history.replaceState(null, '', window.location.pathname)
    navigate(target, { replace: true })
  }, [navigate])

  return null
}
