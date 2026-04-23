import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { GATE_ENABLED } from '../../scoring/config.js'

const NAV_ITEMS = [
  { path: '/page1',   label: '1. Research Question'       },
  { path: '/page2',   label: '2. Target Trial'            },
  { path: '/page3',   label: '3. Causal Readiness'        },
  { path: '/page4',   label: '4. Design Questions'        },
  { path: '/page5',   label: '5. Adjustment & DAG'        },
  { path: '/page6',   label: '6. Data Sources'            },
  { path: '/page7',   label: '7. Statistical Feasibility' },
  { path: '/results', label: 'Results'                    },
]

const LOCKED_PATHS = new Set(['/page4', '/page5', '/page6', '/page7', '/results'])
const SIDEBAR_WIDTH_OPEN   = 272
const SIDEBAR_WIDTH_CLOSED = 0

// Below this viewport width the sidebar starts collapsed
const MOBILE_BREAKPOINT = 768

export default function AppLayout({ children, gatePassed, completedSections = new Set() }) {
  const location  = useLocation()
  const navigate  = useNavigate()

  // Start collapsed on mobile, open on desktop
  const [open, setOpen] = useState(() => window.innerWidth >= MOBILE_BREAKPOINT)

  // Collapse automatically when navigating on mobile
  useEffect(() => {
    if (window.innerWidth < MOBILE_BREAKPOINT) {
      setOpen(false)
    }
  }, [location.pathname])

  // Re-evaluate on resize
  useEffect(() => {
    const handler = () => {
      if (window.innerWidth >= MOBILE_BREAKPOINT) setOpen(true)
    }
    window.addEventListener('resize', handler)
    return () => window.removeEventListener('resize', handler)
  }, [])

  const currentPath = location.pathname === '/' ? '/page1' : location.pathname

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

  // Current section label for collapsed state
  const currentLabel = NAV_ITEMS.find(i => i.path === currentPath)?.label ?? 'Navigation'

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>

      {/* ── MoJ Header ────────────────────────────────────────────────────────── */}
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
          {/* Left: hamburger + wordmark */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>

            {/* Hamburger toggle */}
            <button
              onClick={() => setOpen(o => !o)}
              aria-expanded={open}
              aria-controls="app-sidebar"
              aria-label={open ? 'Collapse navigation' : 'Expand navigation'}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: '6px',
                display: 'flex',
                flexDirection: 'column',
                gap: '5px',
                flexShrink: 0,
              }}
            >
              {/* Three-bar icon — animates to X when open */}
              {[0, 1, 2].map(i => (
                <span key={i} style={{
                  display: 'block',
                  width: '22px',
                  height: '2px',
                  background: '#fff',
                  borderRadius: '1px',
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

            <span style={{ color: '#fff', fontSize: '22px', lineHeight: 1, flexShrink: 0 }}
              aria-hidden="true">⚖</span>

            <div style={{ minWidth: 0 }}>
              <div className="govuk-body-s"
                style={{ color: 'rgba(255,255,255,0.65)', margin: 0, lineHeight: 1.2 }}>
                Ministry of Justice
              </div>
              <div style={{
                color: '#fff', fontWeight: 700, lineHeight: 1.2,
                fontSize: 'clamp(14px, 2vw, 18px)',
                whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
              }}>
                Evaluation Feasibility Tool
              </div>
            </div>
          </div>

          {/* Right: current section label (mobile) + prototype tag */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
            {/* Current section — shown on mobile when nav is closed */}
            {!open && (
              <span style={{
                color: 'rgba(255,255,255,0.6)',
                fontSize: '13px',
                maxWidth: '140px',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                display: window.innerWidth < MOBILE_BREAKPOINT ? 'block' : 'none',
              }}>
                {currentLabel}
              </span>
            )}
            <strong className="govuk-tag govuk-tag--orange"
              style={{ fontSize: '11px', flexShrink: 0 }}>
              PROTOTYPE
            </strong>
          </div>
        </div>
      </header>

      {/* ── Body ──────────────────────────────────────────────────────────────── */}
      <div className="app-body" style={{ flex: 1, position: 'relative' }}>

        {/* ── Sidebar overlay on mobile (closes nav when tapping outside) ──── */}
        {open && (
          <div
            onClick={() => setOpen(false)}
            style={{
              display: window.innerWidth < MOBILE_BREAKPOINT ? 'block' : 'none',
              position: 'fixed',
              inset: 0,
              background: 'rgba(0,0,0,0.5)',
              zIndex: 149,
            }}
            aria-hidden="true"
          />
        )}

        {/* ── Sidebar ───────────────────────────────────────────────────────── */}
        <nav
          id="app-sidebar"
          className="app-sidebar"
          aria-label="Section navigation"
          style={{
            width: open ? `${SIDEBAR_WIDTH_OPEN}px` : `${SIDEBAR_WIDTH_CLOSED}px`,
            minWidth: open ? `${SIDEBAR_WIDTH_OPEN}px` : `${SIDEBAR_WIDTH_CLOSED}px`,
            overflow: 'hidden',
            transition: 'min-width 0.25s ease, width 0.25s ease',
            // On mobile: position fixed so it overlays the content
            ...(window.innerWidth < MOBILE_BREAKPOINT ? {
              position: 'fixed',
              top: '56px',
              left: 0,
              bottom: 0,
              zIndex: 150,
              height: 'calc(100vh - 56px)',
            } : {}),
          }}
        >
          {/* Sidebar contents — always rendered so transition is smooth */}
          <div style={{ width: `${SIDEBAR_WIDTH_OPEN}px`, paddingTop: '4px' }}>

            {/* Section list */}
            <p style={{
              color: 'rgba(255,255,255,0.45)',
              padding: '12px 16px 4px',
              margin: 0,
              textTransform: 'uppercase',
              fontSize: '11px',
              letterSpacing: '0.5px',
              whiteSpace: 'nowrap',
            }}>
              Sections
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
                          background: 'none', border: 'none',
                          color: 'inherit', font: 'inherit',
                          fontSize: '14px', cursor: 'pointer',
                          padding: 0, textAlign: 'left',
                          whiteSpace: 'nowrap',
                          textDecoration: state === 'active' ? 'none' : 'underline',
                          textDecorationColor: 'rgba(255,255,255,0.3)',
                        }}
                      >
                        {item.label}
                      </button>
                    )}
                  </li>
                )
              })}
            </ul>

            {/* Gate locked notice */}
            {!gatePassed && (
              <div style={{
                margin: '8px 12px 12px',
                padding: '8px 12px',
                background: 'rgba(212,53,28,0.15)',
                borderLeft: '3px solid #d4351c',
                fontSize: '12px',
                color: '#ff8c7a',
              }}>
                Sections 4–7 locked. Complete Section 3 to continue.
              </div>
            )}

            {/* Install prompt — shown when PWA is installable */}
            <InstallPrompt />
          </div>
        </nav>

        {/* ── Main content ──────────────────────────────────────────────────── */}
        <main
          className="app-main govuk-main-wrapper"
          id="main-content"
          tabIndex={-1}
          style={{
            padding: 0,
            // On mobile, sidebar overlays content so no offset needed
            marginLeft: 0,
          }}
        >
          {children}
        </main>
      </div>

      {/* ── Footer ────────────────────────────────────────────────────────────── */}
      <footer className="govuk-footer" style={{ flexShrink: 0 }}>
        <div style={{ padding: '12px 20px' }}>
          <span className="govuk-body-s" style={{ color: '#6f777b' }}>
            Impact Evaluation Feasibility Tool — Prototype v0.6 —
            Ministry of Justice | Government Social Research.
            This tool should be used to inform — not replace — professional methodological judgement.
          </span>
        </div>
      </footer>
    </div>
  )
}

// ── PWA install prompt component ───────────────────────────────────────────────
// Captures the browser's beforeinstallprompt event and shows a tidy
// install button inside the sidebar when the app is installable.
function InstallPrompt() {
  const [prompt, setPrompt] = useState(null)
  const [installed, setInstalled] = useState(false)

  useEffect(() => {
    const handler = (e) => {
      e.preventDefault()
      setPrompt(e)
    }
    window.addEventListener('beforeinstallprompt', handler)
    window.addEventListener('appinstalled', () => {
      setInstalled(true)
      setPrompt(null)
    })
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  if (installed || !prompt) return null

  return (
    <div style={{
      margin: '16px 12px',
      padding: '12px',
      background: 'rgba(255,255,255,0.07)',
      borderLeft: '3px solid #9c1b6d',
      borderRadius: '2px',
    }}>
      <p style={{
        color: 'rgba(255,255,255,0.8)',
        fontSize: '12px',
        margin: '0 0 8px 0',
        lineHeight: 1.4,
      }}>
        Install this tool to your device for offline use and faster loading.
      </p>
      <button
        onClick={async () => {
          prompt.prompt()
          const { outcome } = await prompt.userChoice
          if (outcome === 'accepted') setPrompt(null)
        }}
        style={{
          background: '#9c1b6d',
          color: '#fff',
          border: 'none',
          padding: '6px 12px',
          fontSize: '12px',
          fontWeight: 700,
          cursor: 'pointer',
          fontFamily: 'inherit',
          width: '100%',
        }}
      >
        Install app
      </button>
    </div>
  )
}
