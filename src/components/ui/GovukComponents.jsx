// Reusable GOV.UK / MoJ Design System components
// These map to govuk-frontend and MoJ frontend CSS classes

// ── Form inputs ──────────────────────────────────────────────────────────────

export function QuestionBlock({ children }) {
  return <div className="govuk-form-group">{children}</div>
}

export function Label({ htmlFor, children }) {
  return <label className="govuk-label govuk-label--s" htmlFor={htmlFor}>{children}</label>
}

export function Hint({ children }) {
  return <div className="govuk-hint">{children}</div>
}

export function TextArea({ id, value, onChange, rows = 3, placeholder = '' }) {
  return (
    <textarea
      className="govuk-textarea"
      id={id}
      name={id}
      rows={rows}
      placeholder={placeholder}
      value={value ?? ''}
      onChange={e => onChange(e.target.value)}
    />
  )
}

export function TextInput({ id, value, onChange, placeholder = '', width = 'full' }) {
  return (
    <input
      className={`govuk-input ${width !== 'full' ? `govuk-input--width-${width}` : ''}`}
      id={id}
      name={id}
      type="text"
      placeholder={placeholder}
      value={value ?? ''}
      onChange={e => onChange(e.target.value)}
    />
  )
}

export function NumberInput({ id, value, onChange, placeholder = '', width = 10 }) {
  return (
    <input
      className={`govuk-input govuk-input--width-${width}`}
      id={id}
      name={id}
      type="number"
      placeholder={placeholder}
      value={value ?? ''}
      onChange={e => onChange(e.target.value)}
    />
  )
}

export function DateInput({ id, value, onChange }) {
  return (
    <input
      className="govuk-input govuk-input--width-20"
      id={id}
      name={id}
      type="date"
      value={value ?? ''}
      onChange={e => onChange(e.target.value)}
    />
  )
}

export function Radios({ id, value, onChange, options, inline = false }) {
  return (
    <div className={`govuk-radios ${inline ? 'govuk-radios--inline' : ''}`} data-module="govuk-radios">
      {options.map(opt => (
        <div className="govuk-radios__item" key={opt.value}>
          <input
            className="govuk-radios__input"
            id={`${id}-${opt.value}`}
            name={id}
            type="radio"
            value={opt.value}
            checked={value === opt.value}
            onChange={() => onChange(opt.value)}
          />
          <label className="govuk-label govuk-radios__label" htmlFor={`${id}-${opt.value}`}>
            {opt.label}
          </label>
          {opt.hint && (
            <div className="govuk-hint govuk-radios__hint">{opt.hint}</div>
          )}
        </div>
      ))}
    </div>
  )
}

// ── Question wrapper — label + hint + input ───────────────────────────────────

export function Question({ id, label, hint, children }) {
  return (
    <div className="govuk-form-group" style={{ marginBottom: '1.5rem' }}>
      <Label htmlFor={id}>{label}</Label>
      {hint && <Hint>{hint}</Hint>}
      {children}
    </div>
  )
}

export function RadioQuestion({ id, label, hint, value, onChange, options, inline = false }) {
  return (
    <div className="govuk-form-group" style={{ marginBottom: '1.5rem' }}>
      <fieldset className="govuk-fieldset">
        <legend className="govuk-fieldset__legend govuk-fieldset__legend--s">
          <span className="govuk-label govuk-label--s">{label}</span>
        </legend>
        {hint && <Hint>{hint}</Hint>}
        <Radios id={id} value={value} onChange={onChange} options={options} inline={inline} />
      </fieldset>
    </div>
  )
}

// ── Layout ────────────────────────────────────────────────────────────────────

export function Card({ children, style = {} }) {
  return (
    <div style={{
      background: '#fff',
      border: '1px solid #b1b4b6',
      padding: '24px',
      marginBottom: '24px',
      ...style,
    }}>
      {children}
    </div>
  )
}

export function CardTitle({ children }) {
  return (
    <h3 className="govuk-heading-m" style={{
      borderBottom: '2px solid #9c1b6d',
      paddingBottom: '8px',
      marginBottom: '16px',
    }}>
      {children}
    </h3>
  )
}

export function SectionTag({ children }) {
  return (
    <span style={{
      display: 'inline-block',
      background: '#9c1b6d',
      color: '#fff',
      fontSize: '12px',
      fontWeight: 700,
      padding: '3px 10px',
      letterSpacing: '0.5px',
      textTransform: 'uppercase',
      marginBottom: '12px',
    }}>
      {children}
    </span>
  )
}

export function NavButtons({ children }) {
  return (
    <div style={{
      marginTop: '32px',
      paddingTop: '20px',
      borderTop: '1px solid #b1b4b6',
      display: 'flex',
      gap: '12px',
      flexWrap: 'wrap',
    }}>
      {children}
    </div>
  )
}

// ── Alerts ────────────────────────────────────────────────────────────────────

const ALERT_STYLES = {
  blue:   { borderLeft: '6px solid #1d70b8', background: '#e8f0fb' },
  green:  { borderLeft: '6px solid #00703c', background: '#e3f3eb' },
  yellow: { borderLeft: '6px solid #f47738', background: '#fef3e8' },
  red:    { borderLeft: '6px solid #d4351c', background: '#fde8e6' },
}

export function Alert({ type = 'blue', title, children }) {
  return (
    <div style={{ ...ALERT_STYLES[type], padding: '16px 20px', marginBottom: '20px' }}>
      {title && <strong style={{ display: 'block', marginBottom: '4px' }}>{title}</strong>}
      {children}
    </div>
  )
}

// ── Buttons ───────────────────────────────────────────────────────────────────

export function Button({ onClick, children, variant = 'primary', disabled = false }) {
  const styles = {
    primary:   'govuk-button',
    secondary: 'govuk-button govuk-button--secondary',
    warning:   'govuk-button govuk-button--warning',
    moj:       'govuk-button',
  }
  const extra = variant === 'moj' ? {
    background: '#9c1b6d',
    boxShadow: '0 2px 0 #5c1040',
  } : {}
  return (
    <button
      className={styles[variant] || 'govuk-button'}
      style={{ ...extra, marginBottom: 0 }}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  )
}

// ── MoJ Badge — for Category and Feasibility labels ──────────────────────────

const BADGE_COLORS = {
  A: { bg: '#00703c', fg: '#fff' },
  B: { bg: '#1d70b8', fg: '#fff' },
  C: { bg: '#f47738', fg: '#fff' },
  D: { bg: '#9c1b6d', fg: '#fff' },
  E: { bg: '#6f777b', fg: '#fff' },
  High:   { bg: '#00703c', fg: '#fff' },
  Medium: { bg: '#f47738', fg: '#fff' },
  Low:    { bg: '#d4351c', fg: '#fff' },
  'N/A':  { bg: '#6f777b', fg: '#fff' },
}

export function Badge({ label }) {
  const colors = BADGE_COLORS[label] ?? { bg: '#6f777b', fg: '#fff' }
  return (
    <strong style={{
      display: 'inline-block',
      background: colors.bg,
      color: colors.fg,
      fontSize: '13px',
      fontWeight: 700,
      padding: '2px 8px',
      borderRadius: '2px',
    }}>
      {label}
    </strong>
  )
}

// ── Conditional panel ─────────────────────────────────────────────────────────

export function When({ condition, children }) {
  return condition ? <>{children}</> : null
}

// ── Design card ───────────────────────────────────────────────────────────────

export function DesignCard({ title, hint, children }) {
  return (
    <div style={{
      background: '#fff',
      border: '1px solid #b1b4b6',
      borderLeft: '4px solid #1d70b8',
      padding: '20px',
      marginBottom: '16px',
    }}>
      <h4 className="govuk-heading-s" style={{ marginBottom: '4px' }}>{title}</h4>
      {hint && <p className="govuk-hint" style={{ marginBottom: '12px' }}>{hint}</p>}
      {children}
    </div>
  )
}

// ── Locked page ───────────────────────────────────────────────────────────────

export function LockedPage() {
  return (
    <div style={{ textAlign: 'center', padding: '60px 20px', color: '#6f777b' }}>
      <h3 className="govuk-heading-m">This section is locked</h3>
      <p className="govuk-body">
        Complete the Causal Readiness assessment (Section 3) and ensure all critical
        readiness conditions are met before proceeding.
      </p>
      <p className="govuk-body-s">
        To disable this gate, set <code>GATE_ENABLED = false</code> in{' '}
        <code>src/scoring/config.js</code>.
      </p>
    </div>
  )
}
