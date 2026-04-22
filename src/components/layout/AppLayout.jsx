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

export default function AppLayout({ children, gatePassed, completedSections = new Set() }) {
  const location = useLocation()
  const navigate = useNavigate()

  const currentPath = location.pathname === '/' ? '/page1' : location.pathname

  const isLocked = (path) => {
    if (!GATE_ENABLED) return false
    if (gatePassed) return false
    return LOCKED_PATHS.has(path)
  }

  const getItemState = (path) => {
    if (path === currentPath)              return 'active'
    if (isLocked(path))                   return 'locked'
    if (completedSections.has(path))      return 'complete'
    return 'todo'
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>

      {/* ── MoJ Header ── */}
      <header className="govuk-header" style={{
        background: '#0b0c0c',
        borderBottom: '10px solid #9c1b6d',
        flexShrink: 0,
      }}>
        <div style={{
          maxWidth: 'none',
          padding: '0 20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          minHeight: '60px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <span style={{ color: '#fff', fontSize: '26px', lineHeight: 1 }} aria-hidden="true">⚖</span>
            <div>
              <div className="govuk-body-s" style={{ color: 'rgba(255,255,255,0.7)', margin: 0 }}>
                Ministry of Justice
              </div>
              <div style={{ color: '#fff', fontSize: '18px', fontWeight: 700, lineHeight: 1.2 }}>
                Evaluation Feasibility Tool
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <strong className="govuk-tag govuk-tag--orange" style={{ fontSize: '11px' }}>
              PROTOTYPE
            </strong>
            <span className="govuk-body-s" style={{ color: 'rgba(255,255,255,0.6)', margin: 0 }}>
              Government Social Research
            </span>
          </div>
        </div>
      </header>

      {/* ── Body: sidebar + main ── */}
      <div className="app-body" style={{ flex: 1 }}>

        {/* ── Sticky sidebar with MoJ progress tracker ── */}
        <nav
          className="app-sidebar"
          aria-label="Section navigation"
          style={{ width: '272px' }}
        >
          <div className="moj-progress-tracker" aria-label="Progress through sections">
            <p className="govuk-body-s" style={{
              color: 'rgba(255,255,255,0.5)',
              padding: '16px 16px 4px',
              margin: 0,
              textTransform: 'uppercase',
              fontSize: '11px',
              letterSpacing: '0.5px',
            }}>
              Sections
            </p>
            <ul className="moj-progress-tracker__list">
              {NAV_ITEMS.map(item => {
                const state  = getItemState(item.path)
                const locked = state === 'locked'

                return (
                  <li
                    key={item.path}
                    className={`moj-progress-tracker__item moj-progress-tracker__item--${state}`}
                  >
                    {/* Status icon */}
                    <span className={`moj-progress-tracker__status-icon moj-progress-tracker__status-icon--${state}`}
                      aria-hidden="true">
                      {state === 'complete' && '✓'}
                      {state === 'active'   && '●'}
                      {state === 'locked'   && '🔒'}
                      {state === 'todo'     && '○'}
                    </span>

                    {/* Label — button if navigable, span if locked */}
                    {locked ? (
                      <span style={{ fontSize: '14px' }}>{item.label}</span>
                    ) : (
                      <button
                        onClick={() => navigate(item.path)}
                        aria-current={state === 'active' ? 'page' : undefined}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: 'inherit',
                          font: 'inherit',
                          fontSize: '14px',
                          cursor: 'pointer',
                          padding: 0,
                          textAlign: 'left',
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

            {/* Gate status indicator */}
            {!gatePassed && (
              <div style={{
                margin: '8px 12px 12px',
                padding: '8px 12px',
                background: 'rgba(212, 53, 28, 0.15)',
                borderLeft: '3px solid #d4351c',
                fontSize: '12px',
                color: '#ff8c7a',
              }}>
                Sections 4–7 locked. Complete Section 3 to continue.
              </div>
            )}
          </div>
        </nav>

        {/* ── Main content ── */}
        <main
          className="app-main govuk-main-wrapper"
          id="main-content"
          tabIndex={-1}
          style={{ padding: 0 }}
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
