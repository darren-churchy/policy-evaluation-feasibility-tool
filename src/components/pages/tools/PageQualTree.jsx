import DecisionTree, { TlBadge } from '../../ui/DecisionTree.jsx'
import { tree, namedNodes, results } from '../../../data/qualTreeData.js'
import { downloadToolResult } from '../../../utils/exportToolResult.js'

function hexToRgba(hex, alpha) {
  const r = parseInt(hex.slice(1,3), 16), g = parseInt(hex.slice(3,5), 16), b = parseInt(hex.slice(5,7), 16)
  return `rgba(${r},${g},${b},${alpha})`
}

function renderQualResult(key, reset, path) {
  const r = results[key]
  if (!r) return null

  const ab = hexToRgba(r.accent, 0.13)
  const abo = hexToRgba(r.accent, 0.33)

  function handleDownload() {
    const resultHtml = `
<h2 style="font-size:18px">${r.type}</h2>
<p>${r.summary}</p>
<h3 style="font-size:14px">Suggested approaches</h3>
<ul>${r.approaches.map(a => `<li>${a}</li>`).join('')}</ul>
<h3 style="font-size:14px">Example question</h3>
<p style="font-style:italic">${r.example}</p>
<p><strong>Watch out:</strong> ${r.watchOut}</p>
<p><strong>Next step:</strong> ${r.signpost}</p>`
    downloadToolResult({ toolName: 'Qualitative Decision Tree', breadcrumb: path, resultHtml })
  }

  return (
    <div style={{ background: '#fff', borderLeft: `5px solid ${r.accent}`, borderRadius: '0 6px 6px 0', padding: '1.5rem' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1rem' }}>
        <div>
          <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '0.68rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#888', marginBottom: '0.3rem' }}>Question type identified</div>
          <div style={{ fontSize: '1.3rem', fontWeight: 600, color: r.color, marginBottom: '0.3rem' }}>{r.type}</div>
          <span style={{ display: 'inline-block', fontFamily: "'DM Sans', sans-serif", fontSize: '0.75rem', background: ab, color: r.color, padding: '0.2rem 0.6rem', borderRadius: '2px', border: `1px solid ${abo}` }}>{r.signal}</span>
          <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap', marginTop: '0.5rem', alignItems: 'center' }}>
            <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '0.68rem', color: '#888' }}>T&amp;L stage:</span>
            {r.tlStages.map(s => <TlBadge key={s} stage={s} />)}
          </div>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignSelf: 'flex-start' }}>
          <button onClick={reset} style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '0.75rem', background: 'none', border: '1px solid #ccc', borderRadius: '3px', padding: '0.35rem 0.75rem', cursor: 'pointer', color: '#666' }}>
            ↩ Start again
          </button>
          <button onClick={handleDownload} style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '0.75rem', background: '#1a3a5c', border: 'none', borderRadius: '3px', padding: '0.35rem 0.75rem', cursor: 'pointer', color: '#fff' }}>
            ↓ Download summary
          </button>
        </div>
      </div>

      <p style={{ fontSize: '0.9rem', lineHeight: 1.65, color: '#444', marginBottom: '1.25rem' }}>{r.summary}</p>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.25rem' }}>
        <div>
          <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '0.68rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#888', marginBottom: '0.6rem' }}>Suggested approaches</div>
          {r.approaches.map((a, i) => (
            <div key={i} style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.4rem', alignItems: 'flex-start' }}>
              <div style={{ width: '5px', height: '5px', borderRadius: '50%', background: r.accent, flexShrink: 0, marginTop: '7px' }} />
              <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '0.83rem', color: '#444' }}>{a}</span>
            </div>
          ))}
        </div>
        <div>
          <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '0.68rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#888', marginBottom: '0.6rem' }}>Example question</div>
          <div style={{ background: '#f8f5f0', border: '1px solid #e0d8cc', borderRadius: '4px', padding: '0.75rem', fontSize: '0.85rem', lineHeight: 1.6, color: '#555', fontStyle: 'italic' }}>
            {r.example}
          </div>
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

export default function PageQualTree() {
  return (
    <div style={{ background: '#f5f2ed', minHeight: '100vh' }}>
      <div style={{ background: '#f5f2ed', padding: '2rem 1.5rem 0' }}>
        <div style={{ maxWidth: '720px', margin: '0 auto' }}>
          <div style={{ borderLeft: '4px solid #1a3a5c', paddingLeft: '1.25rem', marginBottom: '2rem' }}>
            <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '0.7rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: '#666', marginBottom: '0.4rem' }}>
              Analytical Framework
            </div>
            <h1 style={{ fontFamily: "'Source Serif 4', Georgia, serif", fontSize: '1.5rem', fontWeight: 400, color: '#1a1a1a', marginBottom: '0.4rem' }}>
              What kind of qualitative question is this?
            </h1>
            <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '0.85rem', color: '#666', lineHeight: 1.5 }}>
              Answer the questions below to classify your research question, identify appropriate qualitative approaches, and locate your work within the Magenta Book Test and Learn framework.
            </p>
          </div>
        </div>
      </div>
      <DecisionTree
        tree={tree}
        namedNodes={namedNodes}
        accentColor="#1a3a5c"
        renderResult={renderQualResult}
      />
      <div style={{ maxWidth: '720px', margin: '0 auto', padding: '1rem 1.5rem 2rem', fontFamily: "'DM Sans', sans-serif", fontSize: '0.72rem', color: '#aaa', borderTop: '1px solid #d8d2c8', lineHeight: 1.6 }}>
        Use alongside the combined Research Question Typology reference document · Ritchie &amp; Lewis (2003) extended · Magenta Book Test and Learn Annex (2026)
      </div>
    </div>
  )
}
