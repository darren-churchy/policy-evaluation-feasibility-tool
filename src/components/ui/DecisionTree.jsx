import { useState } from 'react'

function TlBadge({ stage }) {
  const styles = {
    Explore:    { background: '#e8f4e8', color: '#1a5a2a' },
    'Co-design':{ background: '#e8eef8', color: '#1a3a6a' },
    Test:       { background: '#f5eaf8', color: '#5a1a6a' },
    Grow:       { background: '#fef0e0', color: '#6a3a1a' },
  }
  return (
    <span style={{
      fontSize: '0.7rem', fontWeight: 600, padding: '0.15rem 0.5rem',
      borderRadius: '2px', fontFamily: 'sans-serif',
      ...(styles[stage] ?? {}),
    }}>
      {stage}
    </span>
  )
}

export { TlBadge }

export default function DecisionTree({ tree, namedNodes = {}, renderResult, accentColor = '#1c3f5e' }) {
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
      <div style={{ maxWidth: '720px', margin: '0 auto', padding: '2rem 1.5rem', fontFamily: "'DM Sans', system-ui, sans-serif" }}>
        {path.length > 0 && (
          <div style={{ marginBottom: '1.25rem' }}>
            <div style={{ fontSize: '0.68rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#888', marginBottom: '0.5rem' }}>Your path</div>
            {path.map((s, i) => (
              <div key={i} style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.3rem', fontSize: '0.72rem' }}>
                <span style={{ color: '#aaa', flexShrink: 0 }}>{i + 1}.</span>
                <span><span style={{ color: '#999' }}>{s.question} </span><span style={{ color: '#555', fontWeight: 600 }}>→ {s.chosen}</span></span>
              </div>
            ))}
          </div>
        )}
        {renderResult(resultKey, reset, path)}
      </div>
    )
  }

  return (
    <div style={{ maxWidth: '720px', margin: '0 auto', padding: '2rem 1.5rem', fontFamily: "'DM Sans', system-ui, sans-serif" }}>
      {/* Progress bar */}
      <div style={{ display: 'flex', gap: '0.3rem', marginBottom: '1rem' }}>
        {[0,1,2,3].map(i => (
          <div key={i} style={{
            height: '3px', flex: 1, borderRadius: '2px',
            background: i <= path.length ? accentColor : '#d8d2c8',
            transition: 'background 0.3s',
          }} />
        ))}
      </div>

      {/* T&L indicator */}
      {currentTlStages.length > 0 && (
        <div style={{ marginBottom: '1.25rem', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
          <span style={{ color: '#888' }}>T&amp;L stage suggested:</span>
          {currentTlStages.map(s => <TlBadge key={s} stage={s} />)}
        </div>
      )}

      {/* Breadcrumb */}
      {path.length > 0 && (
        <div style={{ marginBottom: '1.25rem' }}>
          <div style={{ fontSize: '0.68rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#888', marginBottom: '0.5rem' }}>Your path</div>
          {path.map((s, i) => (
            <div key={i} style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.3rem', fontSize: '0.72rem' }}>
              <span style={{ color: '#aaa', flexShrink: 0 }}>{i + 1}.</span>
              <span><span style={{ color: '#999' }}>{s.question} </span><span style={{ color: '#555', fontWeight: 600 }}>→ {s.chosen}</span></span>
            </div>
          ))}
          <button
            onClick={stepBack}
            style={{ marginTop: '0.5rem', fontSize: '0.72rem', background: 'none', border: '1px solid #ccc', borderRadius: '3px', padding: '0.25rem 0.6rem', cursor: 'pointer', color: '#666' }}
          >
            ← Back
          </button>
        </div>
      )}

      {/* Question card */}
      <div style={{ background: '#fff', borderRadius: '6px', padding: '1.5rem', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
        <div style={{ fontSize: '1.05rem', lineHeight: 1.55, color: '#1a1a1a', marginBottom: '0.5rem' }}>
          {currentNode.question}
        </div>
        {currentNode.hint && (
          <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '0.78rem', color: '#777', lineHeight: 1.5, background: '#f0ece6', padding: '0.5rem 0.75rem', borderRadius: '3px', borderLeft: '3px solid #ccc', marginBottom: '0.9rem' }}>
            {currentNode.hint}
          </div>
        )}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {currentNode.options.map((opt, i) => (
            <button
              key={i}
              onClick={() => choose(i)}
              style={{
                textAlign: 'left', background: '#faf8f5', border: '1px solid #d8d2c8',
                borderRadius: '4px', padding: '0.85rem 1rem', cursor: 'pointer',
                fontFamily: "'DM Sans', sans-serif", width: '100%',
                transition: 'background 0.15s, border-color 0.15s',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = '#f0ece6'; e.currentTarget.style.borderColor = '#b8b0a0' }}
              onMouseLeave={e => { e.currentTarget.style.background = '#faf8f5'; e.currentTarget.style.borderColor = '#d8d2c8' }}
            >
              <div style={{ fontSize: '0.9rem', fontWeight: 600, color: '#1a1a1a', marginBottom: opt.sublabel ? '0.2rem' : 0 }}>
                {opt.label}
              </div>
              {opt.sublabel && (
                <div style={{ fontSize: '0.78rem', color: '#777' }}>{opt.sublabel}</div>
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
