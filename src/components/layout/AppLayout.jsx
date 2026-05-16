import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { GATE_ENABLED } from '../../scoring/config.js'

const NAV_ITEMS = [
  { path: '/research-question', label: '1. Research Question'       },
  { path: '/causal-readiness',  label: '2. Causal Readiness'        },
  { path: '/ideal-trial',       label: '3. Ideal Trial'             },
  { path: '/design-questions',  label: '4. Design Questions'        },
  { path: '/adjustment',        label: '5. Adjustment & DAG'        },
  { path: '/data-sources',      label: '6. Data Sources'            },
  { path: '/statistical',       label: '7. Statistical Feasibility' },
  { path: '/results',           label: 'Results'                    },
]

const LOCKED_PATHS = new Set([
  '/ideal-trial', '/design-questions', '/adjustment',
  '/data-sources', '/statistical', '/results',
])

const MOBILE_BREAKPOINT = 768

export default function AppLayout({ children, gatePassed, completedSections = new Set() }) {
  const location  = useLocation()
  const navigate  = useNavigate()
  const [open, setOpen] = useState(() => window.innerWidth >= MOBILE_BREAKPOINT)

  // PWA install prompt — captured here so it isn't lost when the landing page
  // is shown (InstallPrompt only renders inside the sidebar, which is hidden there)
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

  // Landing page — render children full-width with no sidebar
  const isLanding = location.pathname === '/'

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

  const isLocked = (path) => {
    if (!GATE_ENABLED) return false
    if (gatePassed) return false
    return LOCKED_PATHS.has(path)
  }

  const getState = (path) => {
    if (path === currentPath)         return 'active'
    if (isLocked(path))               return 'locked'
    if (completedSections.has(path))  return 'complete'
    return 'todo'
  }

  const currentLabel = NAV_ITEMS.find(i => i.path === currentPath)?.label ?? ''

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>

      {/* ── MoJ Header ── */}
      <header className="govuk-header" style={{
        background: '#0b0c0c',
        borderBottom: '10px solid #9c1b6d',
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
            {/* Hamburger — hidden on landing page */}
            {!isLanding && (
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
                    background: '#fff', borderRadius: '1px',
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
            <span style={{ color: '#fff', fontSize: '22px', lineHeight: 1, flexShrink: 0 }}
              aria-hidden="true">⚖</span>
            <div style={{ minWidth: 0 }}>
              <div className="govuk-body-s"
                style={{ color: 'rgba(255,255,255,.65)', margin: 0, lineHeight: 1.2 }}>
                Ministry of Justice
              </div>
              <button
                onClick={() => navigate('/')}
                style={{
                  background: 'none', border: 'none', padding: 0, cursor: 'pointer',
                  color: '#fff', fontWeight: 700, lineHeight: 1.2, fontFamily: 'inherit',
                  fontSize: 'clamp(14px, 2vw, 18px)',
                  whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                }}
              >
                Evaluation Feasibility Tool
              </button>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
            {!isLanding && !open && currentLabel && (
              <span style={{
                color: 'rgba(255,255,255,.6)', fontSize: '13px',
                maxWidth: '140px', overflow: 'hidden',
                textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              }}>
                {currentLabel}
              </span>
            )}
            <strong className="govuk-tag govuk-tag--orange" style={{ fontSize: '11px', flexShrink: 0 }}>
              PROTOTYPE
            </strong>
          </div>
        </div>
      </header>

      {/* ── Body ── */}
      <div className="app-body" style={{ flex: 1, position: 'relative' }}>

        {/* Overlay on mobile */}
        {!isLanding && open && (
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

        {/* Sidebar — hidden on landing page */}
        {!isLanding && (
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
                color: 'rgba(255,255,255,.45)', padding: '12px 16px 4px',
                margin: 0, textTransform: 'uppercase', fontSize: '11px',
                letterSpacing: '.5px', whiteSpace: 'nowrap',
              }}>
                Assessment sections
              </p>
              <ul className="moj-progress-tracker__list">
                {NAV_ITEMS.map(item => {
                  const state  = getState(item.path)
                  const locked = state === 'locked'
                  return (
                    <li key={item.path}
                      className={`moj-progress-tracker__item moj-progress-tracker__item--${state}`}
                    >
                      <span
                        className={`moj-progress-tracker__status-icon moj-progress-tracker__status-icon--${state}`}
                        aria-hidden="true"
                      >
                        {state === 'complete' && '✓'}
                        {state === 'active'   && '●'}
                        {state === 'locked'   && '🔒'}
                        {state === 'todo'     && '○'}
                      </span>
                      {locked ? (
                        <span style={{ fontSize: '14px', whiteSpace: 'nowrap' }}>{item.label}</span>
                      ) : (
                        <button
                          onClick={() => navigate(item.path)}
                          aria-current={state === 'active' ? 'page' : undefined}
                          style={{
                            background: 'none', border: 'none', color: 'inherit',
                            font: 'inherit', fontSize: '14px', cursor: 'pointer',
                            padding: 0, textAlign: 'left', whiteSpace: 'nowrap',
                            textDecoration: state === 'active' ? 'none' : 'underline',
                            textDecorationColor: 'rgba(255,255,255,.3)',
                          }}
                        >
                          {item.label}
                        </button>
                      )}
                    </li>
                  )
                })}
              </ul>
              {!gatePassed && (
                <div style={{
                  margin: '8px 12px 12px', padding: '8px 12px',
                  background: 'rgba(212,53,28,.15)', borderLeft: '3px solid #d4351c',
                  fontSize: '12px', color: '#ff8c7a',
                }}>
                  Sections 3–7 locked. Complete the Causal Readiness assessment to continue.
                </div>
              )}
              <InstallPrompt prompt={installPrompt} installed={installed} onInstall={setInstallPrompt} />
            </div>
          </nav>
        )}

        {/* Main content */}
        <main
          className={isLanding ? '' : 'app-main govuk-main-wrapper'}
          id="main-content"
          tabIndex={-1}
          style={{ flex: 1, padding: 0, minWidth: 0 }}
        >
          {children}
        </main>
      </div>

      {/* ── Footer ── */}
      <footer className="govuk-footer" style={{ flexShrink: 0 }}>
        <div style={{ padding: '16px 20px' }}>
          <span className="govuk-body-s" style={{ color: '#6f777b' }}>
            Impact Evaluation Feasibility Tool — Prototype v0.6 — Ministry of Justice |
            Government Social Research. This tool should be used to inform — not replace —
            professional methodological judgement.
          </span>
        </div>
      </footer>
    </div>
  )
}

function InstallPrompt({ prompt, installed, onInstall }) {
  if (installed || !prompt) return null

  return (
    <div style={{
      margin: '16px 12px', padding: '12px',
      background: 'rgba(255,255,255,.07)', borderLeft: '3px solid #9c1b6d',
    }}>
      <p style={{ color: 'rgba(255,255,255,.8)', fontSize: '12px', margin: '0 0 8px', lineHeight: 1.4 }}>
        Install this tool to your device for offline use and faster loading.
      </p>
      <button
        onClick={async () => {
          prompt.prompt()
          const { outcome } = await prompt.userChoice
          if (outcome === 'accepted') onInstall(null)
        }}
        style={{
          background: '#9c1b6d', color: '#fff', border: 'none',
          padding: '6px 12px', fontSize: '12px', fontWeight: 700,
          cursor: 'pointer', fontFamily: 'inherit', width: '100%',
        }}
      >
        Install app
      </button>
    </div>
  )
}
