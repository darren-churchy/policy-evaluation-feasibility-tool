import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { GATE_ENABLED } from '../../scoring/config.js'

const NAV_ITEMS = [
  { path: '/page1',   label: '1. Research Question',       icon: '?' },
  { path: '/page2',   label: '2. Target Trial',            icon: '⬡' },
  { path: '/page3',   label: '3. Causal Readiness',        icon: '✓' },
  { path: '/page4',   label: '4. Design Questions',        icon: '⊞' },
  { path: '/page5',   label: '5. Adjustment & DAG',        icon: '↗' },
  { path: '/page6',   label: '6. Data Sources',            icon: '⊙' },
  { path: '/page7',   label: '7. Statistical Feasibility', icon: '≈' },
  { path: '/results', label: 'Results',                    icon: '★' },
]

export default function AppLayout({ children, gatePassed }) {
  const location = useLocation()
  const navigate = useNavigate()
  const [navOpen, setNavOpen] = useState(true)

  const isLocked = (path) => {
    if (!GATE_ENABLED) return false
    if (gatePassed) return false
    const lockedPaths = ['/page4', '/page5', '/page6', '/page7', '/results']
    return lockedPaths.includes(path)
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>

      {/* MoJ Header */}
      <header className="govuk-header" style={{ background: '#0b0c0c', borderBottom: '10px solid #9c1b6d' }}>
        <div className="govuk-header__container" style={{ maxWidth: 'none', padding: '0 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            {/* MoJ crest placeholder — replace with actual SVG crest if available */}
            <span style={{ color: '#fff', fontSize: '28px', lineHeight: 1 }}>⚖</span>
            <div>
              <div style={{ color: '#fff', fontSize: '14px', opacity: 0.8 }}>Ministry of Justice</div>
              <div style={{ color: '#fff', fontSize: '18px', fontWeight: 700 }}>
                Evaluation Feasibility Tool
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <span style={{
              background: '#f47738',
              color: '#fff',
              fontSize: '11px',
              fontWeight: 700,
              padding: '3px 8px',
              letterSpacing: '0.5px',
            }}>
              PROTOTYPE
            </span>
            <span style={{ color: '#aaa', fontSize: '13px' }}>
              Government Social Research
            </span>
          </div>
        </div>
      </header>

      <div style={{ display: 'flex', flex: 1 }}>

        {/* MoJ-style Side Navigation */}
        <nav
          aria-label="Section navigation"
          style={{
            width: navOpen ? '280px' : '0',
            minWidth: navOpen ? '280px' : '0',
            background: '#0b0c0c',
            transition: 'min-width 0.2s',
            overflow: 'hidden',
            flexShrink: 0,
          }}
        >
          <ul style={{ listStyle: 'none', margin: 0, padding: '8px 0' }}>
            {NAV_ITEMS.map(item => {
              const active  = location.pathname === item.path || (location.pathname === '/' && item.path === '/page1')
              const locked  = isLocked(item.path)
              return (
                <li key={item.path}>
                  <button
                    onClick={() => !locked && navigate(item.path)}
                    disabled={locked}
                    style={{
                      width: '100%',
                      background: active ? '#1a1a1a' : 'transparent',
                      border: 'none',
                      borderLeft: active ? '4px solid #9c1b6d' : '4px solid transparent',
                      color: locked ? '#6f777b' : '#fff',
                      fontFamily: 'inherit',
                      fontSize: '15px',
                      fontStyle: locked ? 'italic' : 'normal',
                      padding: '12px 16px',
                      textAlign: 'left',
                      cursor: locked ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                    }}
                    aria-current={active ? 'page' : undefined}
                  >
                    <span style={{ fontSize: '14px', opacity: 0.7, minWidth: '16px' }}>
                      {locked ? '🔒' : item.icon}
                    </span>
                    {item.label}
                  </button>
                </li>
              )
            })}
          </ul>
        </nav>

        {/* Main content */}
        <main
          className="govuk-main-wrapper"
          id="main-content"
          tabIndex={-1}
          style={{ flex: 1, padding: 0, background: '#f3f2f1', minWidth: 0 }}
        >
          {children}
        </main>
      </div>

      {/* Footer */}
      <footer className="govuk-footer" style={{ borderTop: '1px solid #b1b4b6' }}>
        <div className="govuk-width-container" style={{ padding: '16px 20px' }}>
          <span className="govuk-footer__licence-description" style={{ fontSize: '14px', color: '#6f777b' }}>
            Impact Evaluation Feasibility Tool — Prototype v0.6 — Ministry of Justice |
            Government Social Research. This tool should be used to inform — not replace —
            professional methodological judgement.
          </span>
        </div>
      </footer>
    </div>
  )
}
