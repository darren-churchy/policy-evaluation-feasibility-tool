import { useNavigate } from 'react-router-dom'
import DecisionTree from '../../ui/DecisionTree.jsx'
import StageTags from '../../ui/StageTags.jsx'
import { tree, namedNodes, results } from '../../../data/quantTreeData.js'
import { downloadToolResult } from '../../../utils/exportToolResult.js'
import { hexToRgba } from '../../../utils/colorUtils.js'
import { T } from '../../../styles/tokens.js'
import { PageHeader, Alert, Button, NavButtons } from '../../ui/GovukComponents.jsx'

function renderQuantResult(key, reset, path) {
  const r = results[key]
  if (!r) return null

  function handleDownload() {
    let resultHtml
    if (r.isWarning) {
      resultHtml = `
<h2 style="font-size:18px">${r.head}</h2>
<p>${r.summary}</p>
<h3 style="font-size:14px">Options</h3>
<p><strong>Option A — reframe as prediction:</strong> Report associations honestly using language of association, not causation. Useful for profiling and targeting but not causal evaluation.</p>
<p><strong>Option B — build a causal design:</strong> Identify whether a natural experiment, threshold, or instrument is available. If so, return to the start and select a causal design.</p>
<p><strong>Watch out:</strong> ${r.watchOut}</p>
<p><strong>Next step:</strong> ${r.signpost}</p>`
    } else {
      resultHtml = `
<h2 style="font-size:18px">${r.type}</h2>
<p>${r.summary}</p>
<h3 style="font-size:14px">Methods &amp; designs</h3>
<ul>${r.methods.map(m => `<li><strong>${m.name}</strong> — ${m.note}</li>`).join('')}</ul>
<h3 style="font-size:14px">Key assumptions</h3>
<ul>${r.assumptions.map(a => `<li><strong>${a.label}:</strong> ${a.note}</li>`).join('')}</ul>
<p><strong>Watch out:</strong> ${r.watchOut}</p>
<p><strong>Next step:</strong> ${r.signpost}</p>`
    }
    downloadToolResult({ toolName: 'Quantitative Decision Tree', breadcrumb: path, resultHtml })
  }

  if (r.isWarning) {
    return (
      <div>
        <Alert type="yellow" title="Classification issue identified">
          <p style={{ marginBottom: '0.75rem' }}>{r.summary}</p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '0.75rem' }}>
            <div style={{ background: '#fff', border: `1px solid ${T.greyLine}`, padding: '0.65rem 0.75rem', fontSize: '0.78rem', lineHeight: 1.5 }}>
              <div style={{ fontWeight: 600, fontSize: '0.72rem', marginBottom: '0.25rem', color: T.teal }}>Option A — reframe as prediction</div>
              Report associations honestly using language of association, not causation. Useful for profiling and targeting but not causal evaluation.
            </div>
            <div style={{ background: '#fff', border: `1px solid ${T.greyLine}`, padding: '0.65rem 0.75rem', fontSize: '0.78rem', lineHeight: 1.5 }}>
              <div style={{ fontWeight: 600, fontSize: '0.72rem', marginBottom: '0.25rem', color: T.purple25 }}>Option B — build a causal design</div>
              Identify whether a natural experiment, threshold, or instrument is available. If so, return to the start and select a causal design.
            </div>
          </div>
        </Alert>
        <Alert type="yellow" title="Watch out">{r.watchOut}</Alert>
        <Alert type="blue">{r.signpost}</Alert>
        <NavButtons>
          <Button variant="secondary" onClick={reset}>↩ Start again</Button>
          <Button variant="moj" onClick={handleDownload}>↓ Download summary</Button>
        </NavButtons>
      </div>
    )
  }

  const ab = hexToRgba(r.accent, 0.12)
  const abo = hexToRgba(r.accent, 0.32)

  return (
    <div>
      <div style={{ background: '#fff', borderLeft: `5px solid ${r.accent}`, padding: '1.5rem', marginBottom: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1rem' }}>
          <div>
            <div style={{ fontSize: '0.68rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: T.greyText, marginBottom: '0.3rem' }}>Question type / design identified</div>
            <div style={{ fontSize: '1.3rem', fontWeight: 600, color: r.color, marginBottom: '0.3rem' }}>{r.type}</div>
            <span style={{ display: 'inline-block', fontSize: '0.75rem', background: ab, color: r.color, padding: '0.2rem 0.6rem', border: `1px solid ${abo}` }}>{r.signal}</span>
            <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap', marginTop: '0.5rem', alignItems: 'center' }}>
              <span style={{ fontSize: '0.68rem', color: T.greyText }}>T&amp;L stage:</span>
              <StageTags positional={r.tlStages} />
            </div>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignSelf: 'flex-start' }}>
            <Button variant="secondary" onClick={reset}>↩ Start again</Button>
            <Button variant="moj" onClick={handleDownload}>↓ Download summary</Button>
          </div>
        </div>

        <p className="govuk-body">{r.summary}</p>

        {key === 'causal-efficacy' && (
          <Alert type="blue" title="Estimand at the Test stage">
            You are estimating the effect of a specific component or mechanism — not the whole programme. This narrower estimand is appropriate at the Test stage, but the identification requirements (random assignment, documented assumptions, adequate power) are identical to a Grow-stage evaluation.
          </Alert>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.25rem' }}>
          <div>
            <div style={{ fontSize: '0.68rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: T.greyText, marginBottom: '0.6rem' }}>Methods &amp; designs</div>
            {r.methods.map((m, i) => (
              <div key={i} style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.45rem', alignItems: 'flex-start' }}>
                <div style={{ width: '5px', height: '5px', borderRadius: '50%', background: r.accent, flexShrink: 0, marginTop: '7px' }} />
                <div>
                  <span style={{ fontSize: '0.83rem', fontWeight: 600, color: r.color, display: 'block' }}>{m.name}</span>
                  <span style={{ fontSize: '0.74rem', color: T.greyText, lineHeight: 1.4 }}>{m.note}</span>
                </div>
              </div>
            ))}
          </div>
          <div>
            <div style={{ fontSize: '0.68rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: T.greyText, marginBottom: '0.6rem' }}>Key assumptions</div>
            <div style={{ background: T.purpleTint, border: `1px solid ${T.purpleTintMid}`, padding: '0.75rem 1rem', fontSize: '0.79rem', lineHeight: 1.55, color: T.ink }}>
              <div style={{ fontSize: '0.63rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: T.purple, fontWeight: 600, marginBottom: '0.4rem' }}>Required to justify the claim</div>
              {r.assumptions.map((a, i) => (
                <div key={i} style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.3rem', alignItems: 'flex-start', fontSize: '0.78rem' }}>
                  <span style={{ color: r.accent, flexShrink: 0 }}>▸</span>
                  <span><strong>{a.label}:</strong> {a.note}</span>
                </div>
              ))}
            </div>
            {r.isMatching && (
              <Alert type="yellow" title="Note on design strength">
                Matching is the weakest causal design. Before proceeding, explore whether a stronger identification strategy — a threshold, natural experiment, or instrument — is available.
              </Alert>
            )}
          </div>
        </div>

        <Alert type="yellow" title="Watch out">{r.watchOut}</Alert>
        <Alert type="blue">{r.signpost}</Alert>
      </div>
    </div>
  )
}

export default function PageQuantTree() {
  const navigate = useNavigate()
  return (
    <div>
      <PageHeader title="What kind of quantitative question is this?" />
      <div className="page-content tool-column">
          <Alert type="blue">
            Answer the questions below to classify your research question, identify the appropriate
            design, and understand what assumptions are required — located within the Magenta Book
            Test and Learn framework.
          </Alert>
          <DecisionTree
            tree={tree}
            namedNodes={namedNodes}
            accentColor={T.purple}
            renderResult={renderQuantResult}
          />
          <NavButtons>
            <Button variant="secondary" onClick={() => navigate('/')}>← Home</Button>
          </NavButtons>
          <p className="govuk-body-s" style={{ color: T.greyText, borderTop: `1px solid ${T.greyLine}`, paddingTop: '1rem', marginTop: '1rem' }}>
            Use alongside the combined Research Question Typology reference document · Herman &amp; Hsu (2017) extended · Magenta Book Test and Learn Annex (2026)
          </p>
      </div>
    </div>
  )
}
