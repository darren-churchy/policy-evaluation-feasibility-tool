import { useState } from 'react'
import { TlBadge } from './GovukComponents.jsx'
import { T } from '../../styles/tokens.js'

export { TlBadge }

export default function DecisionTree({ tree, namedNodes = {}, renderResult, accentColor = T.purple }) {
  const [currentNode, setCurrentNode] = useState(tree)
  const [path, setPath] = useState([])
  const [currentTlStages, setCurrentTlStages] = useState([])
  const [resultKey, setResultKey] = useState(null)

  function choose(optIdx) {
    const opt = currentNode.options[optIdx]
    const newPath = [...path, { question: currentNode.question, chosen: opt.label }]
    setPath(newPath)
    if (opt.tlStages) setCurrentTlStages(opt.tlStages)

    if (opt.result) {
      if (namedNodes[opt.result]) {
        setCurrentNode(namedNodes[opt.result])
        setResultKey(null)
      } else {
        setResultKey(opt.result)
      }
    } else if (opt.next) {
      setCurrentNode(opt.next)
    }
  }

  function stepBack() {
    if (path.length === 0) return
    const newPath = path.slice(0, -1)
    setPath(newPath)
    setResultKey(null)
    setCurrentTlStages([])

    let node = tree
    for (const step of newPath) {
      const opt = node.options.find(o => o.label === step.chosen)
      if (!opt) break
      if (opt.tlStages) setCurrentTlStages(opt.tlStages)
      if (opt.result && namedNodes[opt.result]) node = namedNodes[opt.result]
      else if (opt.next) node = opt.next
    }
    setCurrentNode(node)
  }

  function reset() {
    setCurrentNode(tree)
    setPath([])
    setResultKey(null)
    setCurrentTlStages([])
  }

  if (resultKey) {
    return (
      <div style={{ paddingBottom: '1.5rem' }}>
        {path.length > 0 && (
          <div style={{ marginBottom: '1.25rem' }}>
            <div style={{ fontSize: '0.68rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: T.greyText, marginBottom: '0.5rem' }}>Your path</div>
            {path.map((s, i) => (
              <div key={i} style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.3rem', fontSize: '0.72rem' }}>
                <span style={{ color: T.greyLine, flexShrink: 0 }}>{i + 1}.</span>
                <span><span style={{ color: T.greyText }}>{s.question} </span><span style={{ color: T.ink, fontWeight: 600 }}>→ {s.chosen}</span></span>
              </div>
            ))}
          </div>
        )}
        {renderResult(resultKey, reset, path)}
      </div>
    )
  }

  return (
    <div style={{ paddingBottom: '1.5rem' }}>
      {/* Progress bar */}
      <div style={{ display: 'flex', gap: '0.3rem', marginBottom: '1rem' }}>
        {[0,1,2,3].map(i => (
          <div key={i} style={{
            height: '3px', flex: 1,
            background: i <= path.length ? accentColor : T.greyLine,
            transition: 'background 0.3s',
          }} />
        ))}
      </div>

      {/* T&L indicator */}
      {currentTlStages.length > 0 && (
        <div style={{ marginBottom: '1.25rem', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
          <span style={{ color: T.greyText }}>T&amp;L stage suggested:</span>
          {currentTlStages.map(s => <TlBadge key={s} stage={s} />)}
        </div>
      )}

      {/* Breadcrumb */}
      {path.length > 0 && (
        <div style={{ marginBottom: '1.25rem' }}>
          <div style={{ fontSize: '0.68rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: T.greyText, marginBottom: '0.5rem' }}>Your path</div>
          {path.map((s, i) => (
            <div key={i} style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.3rem', fontSize: '0.72rem' }}>
              <span style={{ color: T.greyLine, flexShrink: 0 }}>{i + 1}.</span>
              <span><span style={{ color: T.greyText }}>{s.question} </span><span style={{ color: T.ink, fontWeight: 600 }}>→ {s.chosen}</span></span>
            </div>
          ))}
          <button
            onClick={stepBack}
            className="govuk-button govuk-button--secondary"
            style={{ marginTop: '0.5rem', marginBottom: 0, fontSize: '0.8rem', padding: '0.35rem 0.75rem' }}
          >
            ← Back
          </button>
        </div>
      )}

      {/* Question card */}
      <div style={{ background: '#fff', border: `1px solid ${T.greyLine}`, padding: '1.5rem' }}>
        <div style={{ fontSize: '1.05rem', lineHeight: 1.55, color: T.ink, marginBottom: '0.5rem' }}>
          {currentNode.question}
        </div>
        {currentNode.hint && (
          <div style={{
            fontSize: '0.78rem', color: T.ink, lineHeight: 1.5,
            background: T.purpleTint, borderLeft: `3px solid ${T.purpleTintMid}`,
            padding: '0.5rem 0.75rem', marginBottom: '0.9rem',
          }}>
            {currentNode.hint}
          </div>
        )}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {currentNode.options.map((opt, i) => (
            <button
              key={i}
              onClick={() => choose(i)}
              style={{
                textAlign: 'left', background: T.greyBg, border: `1px solid ${T.greyLine}`,
                padding: '0.85rem 1rem', cursor: 'pointer', width: '100%',
                transition: 'background 0.15s, border-color 0.15s',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = T.purpleTint; e.currentTarget.style.borderColor = T.purpleTintMid }}
              onMouseLeave={e => { e.currentTarget.style.background = T.greyBg; e.currentTarget.style.borderColor = T.greyLine }}
            >
              <div style={{ fontSize: '0.9rem', fontWeight: 600, color: T.ink, marginBottom: opt.sublabel ? '0.2rem' : 0 }}>
                {opt.label}
              </div>
              {opt.sublabel && (
                <div style={{ fontSize: '0.78rem', color: T.greyText }}>{opt.sublabel}</div>
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
