import DecisionTree, { TlBadge } from '../../ui/DecisionTree.jsx'
import { tree, namedNodes, results } from '../../../data/quantTreeData.js'

function hexToRgba(hex, alpha) {
  const r = parseInt(hex.slice(1,3), 16), g = parseInt(hex.slice(3,5), 16), b = parseInt(hex.slice(5,7), 16)
  return `rgba(${r},${g},${b},${alpha})`
}

function renderQuantResult(key, reset) {
  const r = results[key]
  if (!r) return null

  if (r.isWarning) {
    return (
      <div style={{ background: '#fff8ee', borderLeft: '5px solid #c8903a', borderRadius: '0 6px 6px 0', padding: '1.5rem' }}>
        <div style={{ fontSize: '0.68rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#c8903a', marginBottom: '0.4rem' }}>⚠ Classification issue identified</div>
        <h2 style={{ fontSize: '1.2rem', fontWeight: 600, color: '#7a4a1a', marginBottom: '0.75rem' }}>{r.head}</h2>
        <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '0.86rem', lineHeight: 1.65, color: '#5a3a1a', marginBottom: '0.75rem' }}>{r.summary}</p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1rem' }}>
          <div style={{ background: 'white', borderRadius: '3px', padding: '0.65rem 0.75rem', fontFamily: "'DM Sans', sans-serif", fontSize: '0.78rem', lineHeight: 1.5 }}>
            <div style={{ fontWeight: 600, fontSize: '0.72rem', marginBottom: '0.25rem', color: '#1a5a8a' }}>Option A — reframe as prediction</div>
            Report associations honestly using language of association, not causation. Useful for profiling and targeting but not causal evaluation.
          </div>
          <div style={{ background: 'white', borderRadius: '3px', padding: '0.65rem 0.75rem', fontFamily: "'DM Sans', sans-serif", fontSize: '0.78rem', lineHeight: 1.5 }}>
            <div style={{ fontWeight: 600, fontSize: '0.72rem', marginBottom: '0.25rem', color: '#3a1a5a' }}>Option B — build a causal design</div>
            Identify whether a natural experiment, threshold, or instrument is available. If so, return to the start and select a causal design.
          </div>
        </div>
        <div style={{ background: '#fdf6ee', border: '1px solid #e8d5b8', borderRadius: '4px', padding: '0.75rem 1rem', fontFamily: "'DM Sans', sans-serif", fontSize: '0.82rem', lineHeight: 1.6, color: '#7a5a2a', display: 'flex', gap: '0.6rem', alignItems: 'flex-start', marginBottom: '1rem' }}>
          <span>⚠</span><span><strong>Watch out: </strong>{r.watchOut}</span>
        </div>
        <div style={{ background: '#f4f0fa', border: '1px solid #c8b8e8', borderRadius: '4px', padding: '0.75rem 1rem', fontFamily: "'DM Sans', sans-serif", fontSize: '0.8rem', lineHeight: 1.6, color: '#3a2a5a', display: 'flex', gap: '0.6rem', alignItems: 'flex-start', marginBottom: '1rem' }}>
          <span>⬧</span><span>{r.signpost}</span>
        </div>
        <button onClick={reset} style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '0.75rem', background: 'none', border: '1px solid #ccc', borderRadius: '3px', padding: '0.35rem 0.75rem', cursor: 'pointer', color: '#666' }}>
          ↩ Start again
        </button>
      </div>
    )
  }

  const ab = hexToRgba(r.accent, 0.12)
  const abo = hexToRgba(r.accent, 0.32)

  return (
    <div style={{ background: '#fff', borderLeft: `5px solid ${r.accent}`, borderRadius: '0 6px 6px 0', padding: '1.5rem' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1rem' }}>
        <div>
          <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '0.68rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#888', marginBottom: '0.3rem' }}>Question type / design identified</div>
          <div style={{ fontSize: '1.3rem', fontWeight: 600, color: r.color, marginBottom: '0.3rem' }}>{r.type}</div>
          <span style={{ display: 'inline-block', fontFamily: "'DM Sans', sans-serif", fontSize: '0.75rem', background: ab, color: r.color, padding: '0.2rem 0.6rem', borderRadius: '2px', border: `1px solid ${abo}` }}>{r.signal}</span>
          <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap', marginTop: '0.5rem', alignItems: 'center' }}>
            <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '0.68rem', color: '#888' }}>T&amp;L stage:</span>
            {r.tlStages.map(s => <TlBadge key={s} stage={s} />)}
          </div>
        </div>
        <button onClick={reset} style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '0.75rem', background: 'none', border: '1px solid #ccc', borderRadius: '3px', padding: '0.35rem 0.75rem', cursor: 'pointer', color: '#666', alignSelf: 'flex-start' }}>
          ↩ Start again
        </button>
      </div>

      <p style={{ fontSize: '0.9rem', lineHeight: 1.65, color: '#444', marginBottom: '1.25rem' }}>{r.summary}</p>

      {key === 'causal-efficacy' && (
        <div style={{ background: '#f4f0fa', border: '1px solid #c8b8e8', borderRadius: '4px', padding: '0.7rem 1rem', fontFamily: "'DM Sans', sans-serif", fontSize: '0.79rem', lineHeight: 1.6, color: '#3a2a5a', marginBottom: '1rem' }}>
          <strong style={{ color: '#5a2a8a' }}>Estimand at the Test stage:</strong> You are estimating the effect of a specific component or mechanism — not the whole programme. This narrower estimand is appropriate at the Test stage, but the identification requirements (random assignment, documented assumptions, adequate power) are identical to a Grow-stage evaluation.
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.25rem' }}>
        <div>
          <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '0.68rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#888', marginBottom: '0.6rem' }}>Methods &amp; designs</div>
          {r.methods.map((m, i) => (
            <div key={i} style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.45rem', alignItems: 'flex-start' }}>
              <div style={{ width: '5px', height: '5px', borderRadius: '50%', background: r.accent, flexShrink: 0, marginTop: '7px' }} />
              <div>
                <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '0.83rem', fontWeight: 600, color: r.color, display: 'block' }}>{m.name}</span>
                <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '0.74rem', color: '#777', lineHeight: 1.4 }}>{m.note}</span>
              </div>
            </div>
          ))}
        </div>
        <div>
          <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '0.68rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#888', marginBottom: '0.6rem' }}>Key assumptions</div>
          <div style={{ background: '#f0f4fa', border: '1px solid #c0d0e8', borderRadius: '4px', padding: '0.75rem 1rem', fontFamily: "'DM Sans', sans-serif", fontSize: '0.79rem', lineHeight: 1.55, color: '#2a3a5a' }}>
            <div style={{ fontSize: '0.63rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#7a9aca', fontWeight: 600, marginBottom: '0.4rem' }}>Required to justify the claim</div>
            {r.assumptions.map((a, i) => (
              <div key={i} style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.3rem', alignItems: 'flex-start', fontSize: '0.78rem' }}>
                <span style={{ color: r.accent, flexShrink: 0 }}>▸</span>
                <span><strong>{a.label}:</strong> {a.note}</span>
              </div>
            ))}
          </div>
          {r.isMatching && (
            <div style={{ marginTop: '0.75rem', padding: '0.65rem 0.85rem', background: '#fff8ee', border: '1px solid #e8d5b8', borderRadius: '4px', fontFamily: "'DM Sans', sans-serif", fontSize: '0.78rem', color: '#7a5a2a', lineHeight: 1.55 }}>
              <strong>Note on design strength:</strong> Matching is the weakest causal design. Before proceeding, explore whether a stronger identification strategy — a threshold, natural experiment, or instrument — is available.
            </div>
          )}
        </div>
      </div>

      <div style={{ background: '#fdf6ee', border: '1px solid #e8d5b8', borderRadius: '4px', padding: '0.75rem 1rem', fontFamily: "'DM Sans', sans-serif", fontSize: '0.82rem', lineHeight: 1.6, color: '#7a5a2a', display: 'flex', gap: '0.6rem', alignItems: 'flex-start', marginBottom: '1rem' }}>
        <span>⚠</span><span><strong>Watch out: </strong>{r.watchOut}</span>
      </div>
      <div style={{ background: '#f4f0fa', border: '1px solid #c8b8e8', borderRadius: '4px', padding: '0.75rem 1rem', fontFamily: "'DM Sans', sans-serif", fontSize: '0.8rem', lineHeight: 1.6, color: '#3a2a5a', display: 'flex', gap: '0.6rem', alignItems: 'flex-start' }}>
        <span>⬧</span><span>{r.signpost}</span>
      </div>
    </div>
  )
}

export default function PageQuantTree() {
  return (
    <div style={{ background: '#f5f2ed', minHeight: '100vh' }}>
      <div style={{ background: '#f5f2ed', padding: '2rem 1.5rem 0' }}>
        <div style={{ maxWidth: '720px', margin: '0 auto' }}>
          <div style={{ borderLeft: '4px solid #1c3f5e', paddingLeft: '1.25rem', marginBottom: '2rem' }}>
            <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '0.7rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: '#666', marginBottom: '0.4rem' }}>
              Analytical Framework
            </div>
            <h1 style={{ fontFamily: "'Source Serif 4', Georgia, serif", fontSize: '1.5rem', fontWeight: 400, color: '#1a1a1a', marginBottom: '0.4rem' }}>
              What kind of quantitative question is this?
            </h1>
            <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '0.85rem', color: '#666', lineHeight: 1.5 }}>
              Answer the questions below to classify your research question, identify the appropriate design, and understand what assumptions are required — located within the Magenta Book Test and Learn framework.
            </p>
          </div>
        </div>
      </div>
      <DecisionTree
        tree={tree}
        namedNodes={namedNodes}
        accentColor="#1c3f5e"
        renderResult={renderQuantResult}
      />
      <div style={{ maxWidth: '720px', margin: '0 auto', padding: '0 1.5rem 2rem', fontFamily: "'DM Sans', sans-serif", fontSize: '0.72rem', color: '#aaa', borderTop: '1px solid #d8d2c8', paddingTop: '1rem', lineHeight: 1.6 }}>
        Use alongside the combined Research Question Typology reference document · Herman &amp; Hsu (2017) extended · Magenta Book Test and Learn Annex (2026)
      </div>
    </div>
  )
}
