import { useState } from 'react'

const STORAGE_KEY = 'peft-privacy-dismissed'

export default function PrivacyBanner() {
  const [dismissed, setDismissed] = useState(() => {
    try { return localStorage.getItem(STORAGE_KEY) === '1' } catch { return false }
  })

  if (dismissed) return null

  const dismiss = () => {
    try { localStorage.setItem(STORAGE_KEY, '1') } catch {}
    setDismissed(true)
  }

  return (
    <div style={{
      background: '#f3f2f1',
      borderBottom: '1px solid #b1b4b6',
      padding: '10px 20px',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      gap: '16px',
      flexWrap: 'wrap',
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', flex: 1, minWidth: 0 }}>
        <span style={{ fontSize: '14px', flexShrink: 0, marginTop: '1px' }} aria-hidden="true">🔒</span>
        <p className="govuk-body-s" style={{ margin: 0, color: '#505a5f' }}>
          <strong style={{ color: '#0b0c0c' }}>Your privacy — </strong>
          Everything you type stays on your device. Nothing is sent to any server and there is no account or login. Refreshing or closing the page will clear your answers.
        </p>
      </div>
      <button
        onClick={dismiss}
        style={{
          background: 'none',
          border: '1px solid #b1b4b6',
          padding: '4px 12px',
          fontSize: '13px',
          cursor: 'pointer',
          fontFamily: 'inherit',
          color: '#505a5f',
          whiteSpace: 'nowrap',
          flexShrink: 0,
        }}
      >
        Got it, close ✕
      </button>
    </div>
  )
}
