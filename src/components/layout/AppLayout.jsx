import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { T } from '../../styles/tokens.js'
import PrivacyBanner from '../ui/PrivacyBanner.jsx'

const GUIDE_NAV_ITEMS = [
  { path: '/guide/ideal_trial',   label: 'Ideal trial specification' },
  { path: '/guide/causal_diagram', label: 'Causal diagram' },
  { path: '/guide/data_sources',  label: 'Data source inventory' },
]

const TOOL_NAV_ITEMS = [
  { path: '/assessment',         label: 'Feasibility assessment'      },
  { path: '/question-type',      label: 'What kind of question?'      },
]

const MOBILE_BREAKPOINT = 768

export default function AppLayout({ children }) {
  const location  = useLocation()
  const navigate  = useNavigate()
  const [open, setOpen] = useState(() => window.innerWidth >= MOBILE_BREAKPOINT)
  const [showInstallInfo, setShowInstallInfo] = useState(false)

  const [installPrompt, setInstallPrompt] = useState(null)
  const [installed, setInstalled] = useState(false)

  useEffect(() => {
    const onBeforeInstall = (e) => { e.preventDefault(); setInstallPrompt(e) }
    const onInstalled = () => { setInstalled(true); setInstallPrompt(null) }
    window.addEventListener('beforeinstallprompt', onBeforeInstall)
    window.addEventListener('appinstalled', onInstalled)
    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstall)
      window.removeEventListener('appinstalled', onInstalled)
    }
  }, [])

  // The sidebar is the app's persistent wayfinding: it shows everywhere except
  // the landing page, tool pages included, so moving between the assessment and
  // the companion tools never drops the user out of the app shell.
  const isLanding = location.pathname === '/'
  const isNoSidebar = isLanding

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [location.pathname])

  useEffect(() => {
    if (window.innerWidth < MOBILE_BREAKPOINT) setOpen(false)
  }, [location.pathname])

  useEffect(() => {
    const handler = () => { if (window.innerWidth >= MOBILE_BREAKPOINT) setOpen(true) }
    window.addEventListener('resize', handler)
    return () => window.removeEventListener('resize', handler)
  }, [])

  const currentPath = location.pathname

  const currentLabel =
    [...TOOL_NAV_ITEMS, ...GUIDE_NAV_ITEMS].find(i => i.path === currentPath)?.label ?? ''

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>

      {/* ── Header ── */}
      <header className="govuk-header" style={{
        background: '#ffffff',
        borderBottom: `6px solid ${T.purple}`,
        flexShrink: 0,
        position: 'sticky',
        top: 0,
        zIndex: 200,
      }}>
        <div style={{
          padding: '0 16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          minHeight: '56px',
          gap: '12px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            {/* Hamburger — hidden on landing/tool pages */}
            {!isNoSidebar && (
              <button
                onClick={() => setOpen(o => !o)}
                aria-expanded={open}
                aria-controls="app-sidebar"
                aria-label={open ? 'Collapse navigation' : 'Expand navigation'}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  padding: '6px', display: 'flex', flexDirection: 'column',
                  gap: '5px', flexShrink: 0,
                }}
              >
                {[0, 1, 2].map(i => (
                  <span key={i} style={{
                    display: 'block', width: '22px', height: '2px',
                    background: T.ink, borderRadius: '1px',
                    transition: 'transform 0.2s, opacity 0.2s',
                    transformOrigin: 'center',
                    transform: open
                      ? i === 0 ? 'translateY(7px) rotate(45deg)'
                      : i === 1 ? 'scaleX(0)'
                      : 'translateY(-7px) rotate(-45deg)'
                      : 'none',
                    opacity: open && i === 1 ? 0 : 1,
                  }} />
                ))}
              </button>
            )}
            <img
              src="/icons/icon.svg"
              alt=""
              aria-hidden="true"
              style={{ width: '28px', height: '28px', flexShrink: 0 }}
            />
            <div style={{ minWidth: 0 }}>
              <button
                onClick={() => navigate('/')}
                style={{
                  background: 'none', border: 'none', padding: 0, cursor: 'pointer',
                  color: T.ink, fontWeight: 700, lineHeight: 1.2, fontFamily: 'inherit',
                  fontSize: 'clamp(14px, 2vw, 18px)',
                  whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                }}
              >
                Evaluation Feasibility Tool
              </button>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
            {!isNoSidebar && !open && currentLabel && (
              <span style={{
                color: T.greyText, fontSize: '13px',
                maxWidth: '140px', overflow: 'hidden',
                textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              }}>
                {currentLabel}
              </span>
            )}
            <strong className="govuk-tag govuk-tag--orange" style={{ fontSize: '11px', flexShrink: 0 }}>
              PROTOTYPE
            </strong>

            {/* Install button */}
            {!installed && (
              <div style={{ position: 'relative' }}>
                <button
                  onClick={async () => {
                    if (installPrompt) {
                      installPrompt.prompt()
                      const { outcome } = await installPrompt.userChoice
                      if (outcome === 'accepted') { setInstallPrompt(null); setShowInstallInfo(false) }
                    } else {
                      setShowInstallInfo(v => !v)
                    }
                  }}
                  aria-label={installPrompt ? 'Install app' : 'How to install this app'}
                  style={{
                    background: installPrompt ? T.purple : 'none',
                    border: '1px solid rgba(0,0,0,.25)',
                    color: installPrompt ? '#fff' : T.ink,
                    padding: '4px 10px',
                    fontSize: '12px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px',
                    flexShrink: 0,
                    whiteSpace: 'nowrap',
                  }}
                >
                  <span aria-hidden="true">⊕</span>
                  {installPrompt ? 'Install app' : 'Install ↓'}
                </button>
                {showInstallInfo && !installPrompt && (
                  <div style={{
                    position: 'absolute', right: 0, top: 'calc(100% + 8px)',
                    background: '#fff', border: '1px solid #b1b4b6',
                    padding: '14px 16px', zIndex: 300, width: '270px',
                    boxShadow: '0 4px 16px rgba(0,0,0,.2)',
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                      <strong style={{ fontSize: '13px', color: T.ink }}>Install this app</strong>
                      <button
                        onClick={() => setShowInstallInfo(false)}
                        aria-label="Close"
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: T.greyText, fontSize: '16px', padding: 0, lineHeight: 1 }}
                      >✕</button>
                    </div>
                    <p style={{ fontSize: '12px', color: T.greyText, margin: '0 0 10px', lineHeight: 1.5 }}>
                      Your browser doesn't support automatic install. Follow the steps for your browser below.
                    </p>
                    <p style={{ fontSize: '12px', color: T.greyText, margin: '0 0 8px', lineHeight: 1.5 }}>
                      <strong style={{ color: T.ink }}>Chrome / Edge:</strong> click the ⊕ icon in the address bar, or open the browser menu and select "Install app".
                    </p>
                    <p style={{ fontSize: '12px', color: T.greyText, margin: 0, lineHeight: 1.5 }}>
                      <strong style={{ color: T.ink }}>iOS Safari:</strong> tap the Share button (□↑), then tap "Add to Home Screen".
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </header>

      {/* ── Body ── */}
      <div className="app-body" style={{ flex: 1, position: 'relative' }}>

        {/* Overlay on mobile */}
        {!isNoSidebar && open && (
          <div
            onClick={() => setOpen(false)}
            style={{
              display: window.innerWidth < MOBILE_BREAKPOINT ? 'block' : 'none',
              position: 'fixed', inset: 0,
              background: 'rgba(0,0,0,.5)', zIndex: 149,
            }}
            aria-hidden="true"
          />
        )}

        {/* Sidebar — hidden on landing/tool pages */}
        {!isNoSidebar && (
          <nav
            id="app-sidebar"
            className="app-sidebar"
            aria-label="Section navigation"
            style={{
              width: open ? '272px' : '0',
              minWidth: open ? '272px' : '0',
              overflow: 'hidden',
              transition: 'min-width 0.25s ease, width 0.25s ease',
              ...(window.innerWidth < MOBILE_BREAKPOINT ? {
                position: 'fixed', top: '56px', left: 0, bottom: 0,
                zIndex: 150, height: 'calc(100vh - 56px)',
              } : {}),
            }}
          >
            <div style={{ width: '272px', paddingTop: '4px' }}>
              <p style={{
                color: T.greyText, padding: '12px 16px 4px',
                margin: 0, textTransform: 'uppercase', fontSize: '11px',
                letterSpacing: '.5px', whiteSpace: 'nowrap',
              }}>
                Assessment
              </p>
              <ul style={{ listStyle: 'none', margin: 0, padding: '0 0 4px' }}>
                {TOOL_NAV_ITEMS.map(item => {
                  const active = item.path === currentPath
                  return (
                    <li key={item.path} style={{ margin: 0 }}>
                      <button
                        onClick={() => navigate(item.path)}
                        aria-current={active ? 'page' : undefined}
                        style={{
                          background: active ? T.purpleTint : 'none',
                          border: 'none',
                          borderLeft: `3px solid ${active ? T.purple : 'transparent'}`,
                          color: T.ink, font: 'inherit', fontSize: '14px',
                          fontWeight: active ? 600 : 400,
                          cursor: 'pointer', width: '100%', textAlign: 'left',
                          padding: '7px 16px', lineHeight: 1.35,
                        }}
                      >
                        {item.label}
                      </button>
                    </li>
                  )
                })}
              </ul>
              {/* Guides — structured prompts that produce notes, never answers. Grouped
                  apart from the tools so the distinction is visible in the navigation. */}
              <p style={{
                color: T.greyText, padding: '16px 16px 4px',
                margin: 0, textTransform: 'uppercase', fontSize: '11px',
                letterSpacing: '.5px', whiteSpace: 'nowrap',
                borderTop: `1px solid ${T.greyLine}`,
              }}>
                Guides
              </p>
              <ul style={{ listStyle: 'none', margin: 0, padding: '0 0 4px' }}>
                {GUIDE_NAV_ITEMS.map(item => {
                  const active = item.path === currentPath
                  return (
                    <li key={item.path} style={{ margin: 0 }}>
                      <button
                        onClick={() => navigate(item.path)}
                        aria-current={active ? 'page' : undefined}
                        style={{
                          background: active ? T.purpleTint : 'none',
                          border: 'none',
                          borderLeft: `3px solid ${active ? T.purple : 'transparent'}`,
                          color: T.ink, font: 'inherit', fontSize: '14px',
                          fontWeight: active ? 600 : 400,
                          cursor: 'pointer', width: '100%', textAlign: 'left',
                          padding: '7px 16px', lineHeight: 1.35,
                        }}
                      >
                        {item.label}
                      </button>
                    </li>
                  )
                })}
              </ul>

              <InstallPrompt prompt={installPrompt} installed={installed} onInstall={setInstallPrompt} />
            </div>
          </nav>
        )}

        {/* Main content */}
        <main
          className={isNoSidebar ? '' : 'app-main govuk-main-wrapper'}
          id="main-content"
          tabIndex={-1}
          style={{ flex: 1, padding: 0, minWidth: 0 }}
        >
          <PrivacyBanner />
          {children}
        </main>
      </div>

      {/* ── Footer ── */}
      <footer className="govuk-footer" style={{ flexShrink: 0 }}>
        <div style={{ padding: '16px 20px' }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap',
            marginBottom: '10px', paddingBottom: '10px', borderBottom: '1px solid #b1b4b6',
          }}>
            <span className="govuk-body-s" style={{ color: T.greyText, margin: 0 }}>
              Feedback on this tool?
            </span>
            <a
              href="mailto:FEEDBACK_EMAIL_PLACEHOLDER?subject=Impact%20Evaluation%20Feasibility%20Tool%20%E2%80%94%20feedback"
              className="govuk-link govuk-body-s"
            >
              Email us
            </a>
            <span className="govuk-body-s" style={{ color: T.greyText, margin: 0 }}>or</span>
            <a
              href="https://github.com/darren-churchy/policy-evaluation-feasibility-tool/issues/new"
              target="_blank"
              rel="noopener noreferrer"
              className="govuk-link govuk-body-s"
            >
              raise a GitHub issue ↗
            </a>
          </div>
          <span className="govuk-body-s" style={{ color: T.greyText }}>
            Impact Evaluation Feasibility Tool — Prototype v{__APP_VERSION__}. This tool should be used to inform — not replace —
            professional methodological judgement.
          </span>
        </div>
      </footer>
    </div>
  )
}

function InstallPrompt({ prompt, installed, onInstall }) {
  const [showHelp, setShowHelp] = useState(false)

  if (installed) return null

  return (
    <div style={{
      margin: '16px 12px', padding: '12px',
      background: `rgba(84,49,159,.06)`, borderLeft: `3px solid ${T.purple}`,
    }}>
      <p style={{ color: T.ink, fontSize: '12px', margin: '0 0 8px', lineHeight: 1.4 }}>
        Install for offline use and faster loading.
      </p>
      {prompt ? (
        <button
          onClick={async () => {
            prompt.prompt()
            const { outcome } = await prompt.userChoice
            if (outcome === 'accepted') onInstall(null)
          }}
          style={{
            background: T.purple, color: '#fff', border: 'none',
            padding: '6px 12px', fontSize: '12px', fontWeight: 700,
            cursor: 'pointer', fontFamily: 'inherit', width: '100%',
          }}
        >
          Install app
        </button>
      ) : (
        <>
          <button
            onClick={() => setShowHelp(h => !h)}
            style={{
              background: 'transparent', color: T.greyText,
              border: `1px solid ${T.greyLine}`, padding: '6px 12px',
              fontSize: '12px', fontWeight: 600, cursor: 'pointer',
              fontFamily: 'inherit', width: '100%', textAlign: 'left',
            }}
          >
            How to install {showHelp ? '↑' : '↓'}
          </button>
          {showHelp && (
            <div style={{ marginTop: '8px', fontSize: '11px', color: T.greyText, lineHeight: 1.6 }}>
              <strong style={{ color: T.ink, display: 'block', marginBottom: '2px' }}>Chrome / Edge:</strong>
              Click the install icon (⊕) in the address bar, or open the browser menu and select "Install app".
              <br /><br />
              <strong style={{ color: T.ink, display: 'block', marginBottom: '2px' }}>iOS Safari:</strong>
              Tap the Share button (↑ box), then tap "Add to Home Screen".
            </div>
          )}
        </>
      )}
    </div>
  )
}
