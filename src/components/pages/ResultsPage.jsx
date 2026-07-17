import { useNavigate } from 'react-router-dom'
import { Card, SectionTag, Alert, NavButtons, Button, Badge, PageHeader,
} from '../ui/GovukComponents.jsx'
import { WEIGHTS, CATEGORY_CEILINGS } from '../../scoring/config.js'
import { T } from '../../styles/tokens.js'

// ── Category badge styles — purple sequential (ordered, not verdicts) ──────────
const CAT_STYLE = {
  A: { background: T.purple25,       color: '#ffffff' },
  B: { background: T.purple50,       color: '#ffffff' },
  C: { background: T.purple,         color: '#ffffff' },
  D: { background: T.purpleTintMid,  color: T.purple25 },
  E: { background: T.purpleTint,     color: T.purple25 },
}

// ── Export helpers ────────────────────────────────────────────────────────────
function generateHtmlReport({ inputs, results, flaggedNextSteps, topDesign }) {
  const safe = (v) => (v == null || v === '' ? '—' : String(v))

  const resultRows = results.map(r => {
    const feasColor = { High: T.teal, Medium: T.ink, Low: T.magenta, 'N/A': T.greyText }[r.feasibility] ?? T.greyText
    const wt = r.weightedTotal != null ? r.weightedTotal.toFixed(3) : '—'
    return `<tr>
      <td>${r.category}</td><td>${r.family}</td><td>${r.variant}</td>
      <td>${r.dataScore != null ? r.dataScore.toFixed(3) : '—'}</td>
      <td>${r.causalScore != null ? r.causalScore.toFixed(3) : '—'}</td>
      <td>${wt}</td>
      <td style="color:${feasColor};font-weight:700">${r.feasibility}</td>
      <td>${r.blocker}</td>
    </tr>`
  }).join('\n')

  const nextStepsHtml = flaggedNextSteps.length === 0
    ? '<p>No major gaps identified — all key questions returned definitive answers.</p>'
    : flaggedNextSteps.map(item => `
      <div style="border-left:4px solid ${T.magenta};padding:12px 16px;margin-bottom:10px;background:${T.magentaTint};">
        <strong>${item.page} — ${item.question}</strong><br>
        <span style="color:${T.greyText};font-size:14px">${item.guidance}</span>
      </div>`).join('\n')

  return `<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8">
<title>Evaluation Feasibility Report — ${safe(inputs.p1_title)}</title>
<style>
  body{font-family:Arial,sans-serif;font-size:15px;color:${T.ink};max-width:960px;margin:40px auto;padding:0 20px}
  h1{font-size:26px;border-bottom:4px solid ${T.purple};padding-bottom:10px;color:${T.ink}}
  h2{font-size:18px;color:${T.purple};margin-top:30px;border-bottom:1px solid ${T.greyLine};padding-bottom:6px}
  table{width:100%;border-collapse:collapse;margin-top:12px;font-size:13px}
  th{background:${T.purple};color:#fff;padding:8px 10px;text-align:left;border:none}
  td{padding:8px 10px;border-bottom:1px solid ${T.greyLine};border-left:none;border-right:none}
  tr:nth-child(even) td{background:${T.greyBg}}
  .tag{display:inline-block;background:${T.purple};color:#fff;font-size:11px;font-weight:700;padding:2px 8px;text-transform:uppercase;margin-bottom:12px}
  .footer{margin-top:40px;padding-top:16px;border-top:1px solid ${T.greyLine};font-size:12px;color:${T.greyText}}
</style></head><body>
<div class="tag">Impact Evaluation Feasibility Tool</div>
<h1>Evaluation Feasibility Report</h1>
<p><strong>Project:</strong> ${safe(inputs.p1_title)}</p>
<p><strong>Generated:</strong> ${new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
<p><strong>Prospective evaluation:</strong> ${safe(inputs.p1_prospective)}</p>

<h2>Research Question</h2><p>${safe(inputs.p1_rq)}</p>

<h2>Policy Decision</h2>
<p>${safe(inputs.p1_policy_decision)}</p>
<p><strong>Decision deadline:</strong> ${safe(inputs.p1_deadline)}</p>

<h2>PICOTS</h2>
<table><tr><th>Element</th><th>Answer</th></tr>
<tr><td><strong>Population</strong></td><td>${safe(inputs.picots_p)}</td></tr>
<tr><td><strong>Intervention</strong></td><td>${safe(inputs.picots_i)}</td></tr>
<tr><td><strong>Comparator</strong></td><td>${safe(inputs.picots_c)}</td></tr>
<tr><td><strong>Outcome</strong></td><td>${safe(inputs.picots_o)}</td></tr>
<tr><td><strong>Timeframe</strong></td><td>${safe(inputs.picots_t)}</td></tr>
<tr><td><strong>Setting</strong></td><td>${safe(inputs.picots_s)}</td></tr>
</table>

<h2>Top Recommendation</h2>
${topDesign ? `<p><strong>${topDesign.variant}</strong> (${topDesign.family}, Category ${topDesign.category})</p>
<p>Weighted feasibility score: ${topDesign.weightedTotal?.toFixed(3)} / 1.000 &nbsp;|&nbsp;
Data: ${topDesign.dataScore?.toFixed(3)} &nbsp;|&nbsp; Causal validity: ${topDesign.causalScore?.toFixed(3)}</p>` : '<p>No eligible designs.</p>'}

<h2>Causal Diagram</h2><p>${safe(inputs.p5_dag)}</p>

<h2>Variable Classification</h2>
<table><tr><th>Category</th><th>Variables</th></tr>
<tr><td>Confounders</td><td>${safe(inputs.p5_confounders)}</td></tr>
<tr><td>Mediators</td><td>${safe(inputs.p5_mediators)}</td></tr>
<tr><td>Colliders</td><td>${safe(inputs.p5_colliders)}</td></tr>
<tr><td>Competing exposures</td><td>${safe(inputs.p5_competing)}</td></tr>
</table>

<h2>Statistical Feasibility</h2>
<table><tr><th>Parameter</th><th>Value</th></tr>
<tr><td>Estimated sample size</td><td>${safe(inputs.p7_n)}</td></tr>
<tr><td>MDE</td><td>${safe(inputs.p7_mde)} ${safe(inputs.p7_mde_unit)}</td></tr>
<tr><td>Analysis approach</td><td>${safe(inputs.p7_analysis)}</td></tr>
</table>

<h2>Recommended Next Steps</h2>
${nextStepsHtml}

<h2>Feasibility Rankings</h2>
<table>
<tr><th>Cat.</th><th>Design Family</th><th>Variant</th><th>Data</th><th>Causal</th><th>Total</th><th>Feasibility</th><th>Blockers</th></tr>
${resultRows}
</table>

<div class="footer">
  <p>Generated by the Impact Evaluation Feasibility Tool (Prototype v0.7).</p>
  <p>This report should be used to inform — not replace — professional methodological judgement.</p>
</div></body></html>`
}

function downloadReport(html, title) {
  const blob = new Blob([html], { type: 'text/html;charset=utf-8' })
  const url  = URL.createObjectURL(blob)
  const a    = document.createElement('a')
  a.href     = url
  a.download = `evaluation_feasibility_${(title || 'report').replace(/\s+/g, '_').toLowerCase()}_${new Date().toISOString().slice(0,10)}.html`
  a.click()
  URL.revokeObjectURL(url)
}

// ── Sub-components ────────────────────────────────────────────────────────────

function TopRecommendation({ topDesign }) {
  if (!topDesign) {
    return (
      <Card>
        <SectionTag>Top Recommendation</SectionTag>
        <Alert type="red" title="No eligible designs">
          All designs have been filtered out based on your responses. Review your answers
          on earlier pages.
        </Alert>
      </Card>
    )
  }
  return (
    <Card>
      <SectionTag>Top Recommendation</SectionTag>
      <h3 className="govuk-heading-m" style={{ borderBottom: `2px solid ${T.green}`, paddingBottom: '8px' }}>
        {topDesign.variant}
      </h3>
      <p className="govuk-body">
        <strong>Design family:</strong> {topDesign.family} &nbsp;|&nbsp;
        <strong>Category:</strong> <Badge label={topDesign.category} /> &nbsp;|&nbsp;
        <strong>Ceiling:</strong> {CATEGORY_CEILINGS[topDesign.ceilingKey]?.toFixed(2)}
      </p>
      <p className="govuk-body">
        <strong>Weighted feasibility score:</strong> {topDesign.weightedTotal?.toFixed(3)} / 1.000
        &nbsp;|&nbsp;
        <strong>Data:</strong> {topDesign.dataScore?.toFixed(3)}
        &nbsp;|&nbsp;
        <strong>Causal validity:</strong> {topDesign.causalScore?.toFixed(3)}
      </p>
      <Alert type="green" title="Why this design?">
        This design achieves the highest weighted feasibility score based on your answers
        across all sections. Scores update in real time as you change your responses —
        revisit earlier pages to see how design choices affect the ranking. Always review
        the full table and blocker column before finalising a design decision.
      </Alert>
    </Card>
  )
}

function ResultsTable({ results }) {
  const thStyle = {
    background: T.purple, color: '#fff',
    padding: '8px 10px', textAlign: 'left',
    fontSize: '13px', whiteSpace: 'nowrap',
    position: 'sticky', top: 0,
  }

  return (
    <Card>
      <SectionTag>Full Feasibility Ranking</SectionTag>
      <p className="govuk-hint">
        All 32 evaluation design variants ranked by weighted feasibility score. Scores
        update in real time as you change your answers. Blocked designs are capped at
        Low regardless of other scores. Theory-based designs are scored on parallel criteria.
      </p>
      <div style={{ overflowX: 'auto', maxHeight: '600px', overflowY: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
          <thead>
            <tr>
              <th style={thStyle}>Cat.</th>
              <th style={thStyle}>Design Family</th>
              <th style={thStyle}>Variant</th>
              <th style={{ ...thStyle, textAlign: 'right' }}>Data</th>
              <th style={{ ...thStyle, textAlign: 'right' }}>Causal</th>
              <th style={{ ...thStyle, textAlign: 'right' }}>Total</th>
              <th style={thStyle}>Feasibility</th>
              <th style={thStyle}>Blockers</th>
            </tr>
          </thead>
          <tbody>
            {results.map((r, i) => (
              <tr key={r.id} style={{ background: i % 2 === 0 ? '#fff' : '#f8f8f8' }}>
                <td style={{ padding: '8px 10px', textAlign: 'center' }}>
                  <span style={{
                    display: 'inline-block',
                    ...(CAT_STYLE[r.category] ?? { background: T.greyBg, color: T.ink }),
                    padding: '1px 6px',
                    fontWeight: 700,
                    fontSize: '12px',
                  }}>
                    {r.category}
                  </span>
                </td>
                <td style={{ padding: '8px 10px', fontWeight: 600 }}>{r.family}</td>
                <td style={{ padding: '8px 10px' }}>{r.variant}</td>
                <td style={{ padding: '8px 10px', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
                  {r.dataScore != null ? r.dataScore.toFixed(3) : '—'}
                </td>
                <td style={{ padding: '8px 10px', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
                  {r.causalScore != null ? r.causalScore.toFixed(3) : '—'}
                </td>
                <td style={{ padding: '8px 10px', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
                  {r.weightedTotal != null
                    ? <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '6px' }}>
                        <span style={{
                          display: 'inline-block',
                          width: `${Math.round((r.weightedTotal ?? 0) * 60)}px`,
                          height: '8px',
                          background: T.purple,
                          borderRadius: '2px',
                          opacity: 0.4,
                        }} />
                        {r.weightedTotal.toFixed(3)}
                      </span>
                    : '—'}
                </td>
                <td style={{ padding: '8px 10px' }}>
                  <Badge label={r.feasibility} />
                </td>
                <td style={{ padding: '8px 10px', color: r.blocker === 'None' ? T.greyText : T.magenta, fontSize: '12px' }}>
                  {r.blocker}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="govuk-body-s" style={{ marginTop: '12px', color: '#6f777b' }}>
        Scoring weights: Data {WEIGHTS.data * 100}% / Causal validity {WEIGHTS.causalValidity * 100}%.
        Configurable in <code>src/scoring/config.js</code>.
      </p>
    </Card>
  )
}

function NextStepsPanel({ flaggedNextSteps }) {
  return (
    <Card>
      <SectionTag>Recommended Next Steps</SectionTag>
      {flaggedNextSteps.length === 0 ? (
        <Alert type="green" title="No major gaps identified">
          Your current answers do not flag any critical uncertainties. Review the ranked
          table above and proceed with your preferred design. Remember to revisit this tool
          as your evaluation develops.
        </Alert>
      ) : (
        <>
          <Alert type="yellow" title="Questions requiring further work">
            {flaggedNextSteps.length} question{flaggedNextSteps.length > 1 ? 's' : ''} returned
            non-definitive answers. Resolving these will increase confidence in your design
            choice and improve the reliability of the feasibility scores.
          </Alert>
          {flaggedNextSteps.map(item => (
            <div key={item.id} style={{
              background: T.magentaTint,
              border: `1px solid ${T.magentaTintMid}`,
              borderLeft: `4px solid ${T.magenta}`,
              padding: '16px 20px',
              marginBottom: '10px',
            }}>
              <strong style={{ display: 'block', marginBottom: '4px' }}>
                {item.page} — {item.question}
              </strong>
              <span style={{ fontSize: '14px', color: '#6f777b', lineHeight: 1.5 }}>
                {item.guidance}
              </span>
            </div>
          ))}
        </>
      )}
    </Card>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

export default function ResultsPage({ inputs, results, flaggedNextSteps, topDesign }) {
  const navigate = useNavigate()

  const handleExport = () => {
    const html = generateHtmlReport({ inputs, results, flaggedNextSteps, topDesign })
    downloadReport(html, inputs.p1_title)
  }

  return (
    <div>
      <PageHeader title="Feasibility Assessment Results" />
      <div className="page-content">

        <Alert type="yellow" title="About these results">
          Scores update in real time as you change your answers on earlier pages. All
          scoring weights and category ceilings are configurable in{' '}
          <code>src/scoring/config.js</code> without touching page or scoring logic.
        </Alert>

        <TopRecommendation topDesign={topDesign} />

        <ResultsTable results={results} />

        <NextStepsPanel flaggedNextSteps={flaggedNextSteps} />

        <Card>
          <SectionTag>Export</SectionTag>
          <p className="govuk-hint">
            Download a full HTML report of your inputs and results to share with colleagues
            or archive for the evaluation record. The report can also be printed to PDF
            from your browser.
          </p>
          <Button variant="moj" onClick={handleExport}>
            Download HTML Report
          </Button>
        </Card>

        <NavButtons>
          <Button variant="secondary" onClick={() => navigate('/page7')}>
            ← Previous: Statistical Feasibility
          </Button>
        </NavButtons>
      </div>
    </div>
  )
}
