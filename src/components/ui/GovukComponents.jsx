// Reusable GOV.UK / MoJ Design System components
// Uses govuk-* and moj-* CSS classes throughout.
// Inline styles are used only for values that cannot be expressed as design system classes.

// ── Form inputs ───────────────────────────────────────────────────────────────

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
      id={id} name={id} rows={rows} placeholder={placeholder}
      value={value ?? ''}
      onChange={e => onChange(e.target.value)}
    />
  )
}

export function TextInput({ id, value, onChange, placeholder = '', width = 'full' }) {
  return (
    <input
      className={`govuk-input ${width !== 'full' ? `govuk-input--width-${width}` : ''}`}
      id={id} name={id} type="text" placeholder={placeholder}
      value={value ?? ''}
      onChange={e => onChange(e.target.value)}
    />
  )
}

export function NumberInput({ id, value, onChange, placeholder = '', width = 10 }) {
  return (
    <input
      className={`govuk-input govuk-input--width-${width}`}
      id={id} name={id} type="number" placeholder={placeholder}
      value={value ?? ''}
      onChange={e => onChange(e.target.value)}
    />
  )
}

// ── MoJ Date Picker — wraps a govuk-input with date type
// Full MoJ date-picker widget requires JS init; using accessible date input for now.
export function DateInput({ id, value, onChange }) {
  return (
    <div className="govuk-form-group">
      <input
        className="govuk-input govuk-input--width-20"
        id={id} name={id} type="date"
        value={value ?? ''}
        onChange={e => onChange(e.target.value)}
      />
      <div className="govuk-hint" style={{ marginTop: '4px' }}>
        For example, 27 03 2027
      </div>
    </div>
  )
}

export function Radios({ id, value, onChange, options, inline = false }) {
  return (
    <div className={`govuk-radios ${inline ? 'govuk-radios--inline' : ''}`} data-module="govuk-radios">
      {options.map(opt => (
        <div className="govuk-radios__item" key={opt.value}>
          <input
            className="govuk-radios__input"
            id={`${id}-${opt.value}`} name={id}
            type="radio" value={opt.value}
            checked={value === opt.value}
            onChange={() => onChange(opt.value)}
          />
          <label className="govuk-label govuk-radios__label" htmlFor={`${id}-${opt.value}`}>
            {opt.label}
          </label>
          {opt.hint && <div className="govuk-hint govuk-radios__hint">{opt.hint}</div>}
        </div>
      ))}
    </div>
  )
}

// ── Compound question components ──────────────────────────────────────────────

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
          {label}
        </legend>
        {hint && <Hint>{hint}</Hint>}
        <Radios id={id} value={value} onChange={onChange} options={options} inline={inline} />
      </fieldset>
    </div>
  )
}

// ── Layout ────────────────────────────────────────────────────────────────────

export function Card({ children, style = {} }) {
  return <div className="app-card" style={style}>{children}</div>
}

export function CardTitle({ children }) {
  return (
    <h3 className="govuk-heading-m" style={{ borderBottom: '2px solid #9c1b6d', paddingBottom: '8px', marginBottom: '16px' }}>
      {children}
    </h3>
  )
}

export function SectionTag({ children }) {
  return <span className="app-section-tag">{children}</span>
}

export function NavButtons({ children }) {
  return <div className="app-nav-buttons">{children}</div>
}

// ── Alerts ────────────────────────────────────────────────────────────────────

export function Alert({ type = 'blue', title, children }) {
  return (
    <div className={`app-alert app-alert--${type}`} role="note">
      {title && <p className="govuk-body" style={{ fontWeight: 700, marginBottom: '4px' }}>{title}</p>}
      <div className="govuk-body-s" style={{ margin: 0 }}>{children}</div>
    </div>
  )
}

// ── Buttons ───────────────────────────────────────────────────────────────────

export function Button({ onClick, children, variant = 'primary', disabled = false }) {
  const className = {
    primary:   'govuk-button',
    secondary: 'govuk-button govuk-button--secondary',
    warning:   'govuk-button govuk-button--warning',
    moj:       'govuk-button',
  }[variant] ?? 'govuk-button'

  const extraStyle = variant === 'moj'
    ? { background: '#9c1b6d', boxShadow: '0 2px 0 #5c1040' }
    : {}

  return (
    <button
      className={className}
      style={{ ...extraStyle, marginBottom: 0 }}
      onClick={onClick}
      disabled={disabled}
      data-module="govuk-button"
    >
      {children}
    </button>
  )
}

// ── MoJ Badge ─────────────────────────────────────────────────────────────────

export function Badge({ label }) {
  const key = label === 'N/A' ? 'NA' : label
  return <span className={`app-badge app-badge--${key}`}>{label}</span>
}

// ── MoJ Sub-navigation (within-page anchor links) ─────────────────────────────

export function SubNavigation({ sections, activeId }) {
  return (
    <nav className="moj-sub-navigation" aria-label="Navigate within this page">
      <ul className="moj-sub-navigation__list">
        {sections.map(section => (
          <li className="moj-sub-navigation__item" key={section.id}>
            <a
              href={`#${section.id}`}
              className={`moj-sub-navigation__link ${activeId === section.id ? 'moj-sub-navigation__link--active' : ''}`}
              onClick={e => {
                e.preventDefault()
                document.getElementById(section.id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
              }}
            >
              {section.label}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  )
}

// ── GOV.UK Tag ────────────────────────────────────────────────────────────────

export function Tag({ colour = 'grey', children }) {
  return <strong className={`govuk-tag govuk-tag--${colour}`}>{children}</strong>
}

// ── Conditional render ────────────────────────────────────────────────────────

export function When({ condition, children }) {
  return condition ? <>{children}</> : null
}

// ── Design card (Page 4) ──────────────────────────────────────────────────────

export function DesignCard({ title, hint, children }) {
  return (
    <div className="design-card">
      <h4 className="govuk-heading-s" style={{ marginBottom: '4px' }}>{title}</h4>
      {hint && <p className="govuk-hint">{hint}</p>}
      {children}
    </div>
  )
}

// ── Locked page ───────────────────────────────────────────────────────────────

export function LockedPage() {
  return (
    <div className="locked-page">
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

// ── Page header ───────────────────────────────────────────────────────────────

export function PageHeader({ title }) {
  return (
    <div className="page-header">
      <h1 className="govuk-heading-l">{title}</h1>
    </div>
  )
}
