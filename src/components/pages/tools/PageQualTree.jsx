import { useNavigate } from 'react-router-dom'
import DecisionTree, { TlBadge } from '../../ui/DecisionTree.jsx'
import { tree, namedNodes, results } from '../../../data/qualTreeData.js'
import { downloadToolResult } from '../../../utils/exportToolResult.js'
import { hexToRgba } from '../../../utils/colorUtils.js'
import { T } from '../../../styles/tokens.js'
import { PageHeader, Alert, Button, NavButtons } from '../../ui/GovukComponents.jsx'

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
    <div>
      <div style={{ background: '#fff', borderLeft: `5px solid ${r.accent}`, padding: '1.5rem', marginBottom: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1rem' }}>
          <div>
            <div style={{ fontSize: '0.68rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: T.greyText, marginBottom: '0.3rem' }}>Question type identified</div>
            <div style={{ fontSize: '1.3rem', fontWeight: 600, color: r.color, marginBottom: '0.3rem' }}>{r.type}</div>
            <span style={{ display: 'inline-block', fontSize: '0.75rem', background: ab, color: r.color, padding: '0.2rem 0.6rem', border: `1px solid ${abo}` }}>{r.signal}</span>
            <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap', marginTop: '0.5rem', alignItems: 'center' }}>
              <span style={{ fontSize: '0.68rem', color: T.greyText }}>T&amp;L stage:</span>
              {r.tlStages.map(s => <TlBadge key={s} stage={s} />)}
            </div>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignSelf: 'flex-start' }}>
            <Button variant="secondary" onClick={reset}>↩ Start again</Button>
            <Button variant="moj" onClick={handleDownload}>↓ Download summary</Button>
          </div>
        </div>

        <p className="govuk-body">{r.summary}</p>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.25rem' }}>
          <div>
            <div style={{ fontSize: '0.68rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: T.greyText, marginBottom: '0.6rem' }}>Suggested approaches</div>
            {r.approaches.map((a, i) => (
              <div key={i} style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.4rem', alignItems: 'flex-start' }}>
                <div style={{ width: '5px', height: '5px', borderRadius: '50%', background: r.accent, flexShrink: 0, marginTop: '7px' }} />
                <span className="govuk-body-s">{a}</span>
              </div>
            ))}
          </div>
          <div>
            <div style={{ fontSize: '0.68rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: T.greyText, marginBottom: '0.6rem' }}>Example question</div>
            <div style={{ background: T.greyBg, border: `1px solid ${T.greyLine}`, padding: '0.75rem', fontSize: '0.85rem', lineHeight: 1.6, color: T.ink, fontStyle: 'italic' }}>
              {r.example}
            </div>
          </div>
        </div>

        <Alert type="yellow" title="Watch out">{r.watchOut}</Alert>
        <Alert type="blue">{r.signpost}</Alert>
      </div>
    </div>
  )
}

export default function PageQualTree() {
  const navigate = useNavigate()
  return (
    <div>
      <PageHeader title="What kind of qualitative question is this?" />
      <div className="page-content tool-column">
          <Alert type="blue">
            Answer the questions below to classify your research question, identify appropriate
            qualitative approaches, and locate your work within the Magenta Book Test and Learn
            framework.
          </Alert>
          <DecisionTree
            tree={tree}
            namedNodes={namedNodes}
            accentColor={T.teal}
            renderResult={renderQualResult}
          />
          <NavButtons>
            <Button variant="secondary" onClick={() => navigate('/')}>← Home</Button>
          </NavButtons>
          <p className="govuk-body-s" style={{ color: T.greyText, borderTop: `1px solid ${T.greyLine}`, paddingTop: '1rem', marginTop: '1rem' }}>
            Use alongside the combined Research Question Typology reference document · Ritchie &amp; Lewis (2003) extended · Magenta Book Test and Learn Annex (2026)
          </p>
      </div>
    </div>
  )
}
