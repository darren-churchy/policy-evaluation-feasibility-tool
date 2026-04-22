import { useNavigate } from 'react-router-dom'
import {
  Card, SectionTag, Alert, NavButtons, Button,
  RadioQuestion, When, TextArea, PageHeader,
} from '../ui/GovukComponents.jsx'

const ALTERNATIVES = [
  { approach: 'Process evaluation',      purpose: 'Understand how the intervention is delivered, by whom, and with what fidelity',              when: 'Theory of change unclear; inconsistent delivery' },
  { approach: 'Developmental evaluation',purpose: 'Support ongoing development of the intervention in real time',                               when: 'Still being designed; early pilot phase' },
  { approach: 'Contribution analysis',   purpose: 'Build a structured causal narrative without a counterfactual',                               when: 'Counterfactual not available; complex causal pathway' },
  { approach: 'Realist evaluation',      purpose: 'Understand what works, for whom, in what context, and why',                                  when: 'Context-dependent intervention; mechanisms more important than average effects' },
]

// ── Gate failure HTML report generator ────────────────────────────────────────
function generateGateReport({ inputs, gateFailures }) {
  const safe = v => (v == null || v === '' ? '—' : String(v))
  const date = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })

  const failureRows = gateFailures.map(f =>
    `<tr><td style="padding:8px 10px;border-bottom:1px solid #e8e8e8">${f}</td></tr>`
  ).join('\n')

  const tteComponents = [
    { id: 'tte_eligibility', label: 'Eligibility Criteria' },
    { id: 'tte_treatment',   label: 'Treatment Strategies' },
    { id: 'tte_assignment',  label: 'Treatment Assignment' },
    { id: 'tte_followup',    label: 'Follow-up Period' },
    { id: 'tte_outcome',     label: 'Outcome' },
    { id: 'tte_contrast',    label: 'Causal Contrast' },
    { id: 'tte_analysis',    label: 'Analysis Plan' },
  ]

  const tteRows = tteComponents
    .filter(c => inputs[c.id])
    .map(c => `<tr>
      <td style="padding:8px 10px;border-bottom:1px solid #e8e8e8;font-weight:600;width:200px">${c.label}</td>
      <td style="padding:8px 10px;border-bottom:1px solid #e8e8e8">${safe(inputs[c.id])}</td>
    </tr>`).join('\n')

  const altRows = ALTERNATIVES.map(a => `<tr>
    <td style="padding:8px 10px;border-bottom:1px solid #e8e8e8;font-weight:600">${a.approach}</td>
    <td style="padding:8px 10px;border-bottom:1px solid #e8e8e8;color:#6f777b">${a.purpose}</td>
    <td style="padding:8px 10px;border-bottom:1px solid #e8e8e8;color:#6f777b">${a.when}</td>
  </tr>`).join('\n')

  return `<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8">
<title>Evaluation Readiness Assessment — ${safe(inputs.p1_title)}</title>
<style>
  body{font-family:Arial,sans-serif;font-size:15px;color:#0b0c0c;max-width:900px;margin:40px auto;padding:0 20px}
  h1{font-size:26px;border-bottom:4px solid #9c1b6d;padding-bottom:10px}
  h2{font-size:18px;color:#9c1b6d;margin-top:30px;border-bottom:1px solid #e8e8e8;padding-bottom:6px}
  table{width:100%;border-collapse:collapse;margin-top:12px;font-size:14px}
  th{background:#0b0c0c;color:#fff;padding:8px 10px;text-align:left}
  td{padding:8px 10px;border-bottom:1px solid #e8e8e8}
  .tag{display:inline-block;background:#9c1b6d;color:#fff;font-size:11px;font-weight:700;padding:2px 8px;text-transform:uppercase;margin-bottom:12px}
  .gate-box{border-left:6px solid #d4351c;background:#fde8e6;padding:16px 20px;margin-bottom:20px}
  .footer{margin-top:40px;padding-top:16px;border-top:1px solid #b1b4b6;font-size:12px;color:#6f777b}
</style></head><body>
<div class="tag">Ministry of Justice | Government Social Research</div>
<h1>Evaluation Readiness Assessment</h1>
<p><strong>Project:</strong> ${safe(inputs.p1_title)}</p>
<p><strong>Generated:</strong> ${date}</p>

<h2>Study Context</h2>
<table><tr><th>Field</th><th>Response</th></tr>
<tr><td><strong>Research question</strong></td><td>${safe(inputs.p1_rq)}</td></tr>
<tr><td><strong>Policy decision</strong></td><td>${safe(inputs.p1_policy_decision)}</td></tr>
<tr><td><strong>Decision deadline</strong></td><td>${safe(inputs.p1_deadline)}</td></tr>
<tr><td><strong>Prospective evaluation possible</strong></td><td>${safe(inputs.p1_prospective)}</td></tr>
</table>

<h2>Readiness Gate Outcome</h2>
<div class="gate-box">
  <strong>Impact evaluation is not recommended at this stage.</strong><br>
  The following critical readiness conditions were not met:
</div>
<table><tr><th>Failed condition</th></tr>
${failureRows}
</table>

<h2>Recommended Next Steps</h2>
<p>Before proceeding to impact evaluation, consider the following approaches to develop the evidence base and strengthen intervention readiness:</p>
<table>
<tr><th>Approach</th><th>Purpose</th><th>When to use</th></tr>
${altRows}
</table>

${tteRows ? `<h2>Target Trial Specification (completed)</h2>
<p>The following target trial components were specified before the readiness gate was triggered. This work can inform future evaluation planning once readiness conditions are met.</p>
<table><tr><th style="width:200px">Component</th><th>Specification</th></tr>
${tteRows}
</table>` : ''}

<div class="footer">
  <p>Generated by the MoJ Impact Evaluation Feasibility Tool (Prototype v0.6).</p>
  <p>This report should be used to inform — not replace — professional methodological judgement.</p>
</div></body></html>`
}

function downloadGateReport(html, title) {
  const blob = new Blob([html], { type: 'text/html;charset=utf-8' })
  const url  = URL.createObjectURL(blob)
  const a    = document.createElement('a')
  a.href     = url
  a.download = `readiness_assessment_${(title || 'report').replace(/\s+/g, '_').toLowerCase()}_${new Date().toISOString().slice(0,10)}.html`
  a.click()
  URL.revokeObjectURL(url)
}

// ── Main component ─────────────────────────────────────────────────────────────
export default function Page3({ inputs, set, gatePassed, gateFailures = [] }) {
  const navigate = useNavigate()

  const handleDownloadGateReport = () => {
    const html = generateGateReport({ inputs, gateFailures })
    downloadGateReport(html, inputs.p1_title)
  }

  return (
    <div>
      <PageHeader title="Causal Readiness Assessment" />
      <div className="page-content">
        <Alert type="blue" title="About this section">
          Before selecting an evaluation design, it is important to assess whether the
          intervention is ready to be evaluated for impact — and whether causal identification
          is likely to be achievable. This section contains a readiness gate: if critical
          conditions are not met, you will be directed to alternative evaluation approaches.
        </Alert>

        {/* Section A */}
        <Card>
          <SectionTag>Section A — Intervention Readiness</SectionTag>

          <RadioQuestion id="p3_defined"
            label="1. Is the intervention clearly defined and documented?"
            hint="The intervention should have a clear description of what it consists of, who delivers it, how it is delivered, and at what dose or intensity. Without this, you cannot attribute effects to the intervention rather than to contextual factors."
            value={inputs.p3_defined} onChange={v => set('p3_defined', v)}
            options={[{ value: 'yes', label: 'Yes' }, { value: 'partial', label: 'Partially' }, { value: 'no', label: 'No' }]}
            inline />

          <RadioQuestion id="p3_toc"
            label="2. Is there a logic model or theory of change describing the causal mechanism?"
            hint="A logic model sets out the assumed pathway from intervention inputs to outcomes. It is essential for specifying what the evaluation should measure and for interpreting findings."
            value={inputs.p3_toc} onChange={v => set('p3_toc', v)}
            options={[{ value: 'yes', label: 'Yes' }, { value: 'partial', label: 'In development' }, { value: 'no', label: 'No' }]}
            inline />

          <RadioQuestion id="p3_consistent"
            label="3. Is the intervention being delivered consistently across sites or practitioners?"
            hint="High variation in delivery means you may be evaluating a heterogeneous bundle of activities rather than a specific intervention. This limits your ability to make causal claims about 'the intervention'."
            value={inputs.p3_consistent} onChange={v => set('p3_consistent', v)}
            options={[{ value: 'yes', label: 'Yes' }, { value: 'partial', label: 'Somewhat' }, { value: 'no', label: 'No — high variation' }]}
            inline />

          <RadioQuestion id="p3_scale"
            label="4. Has the intervention reached sufficient scale or maturity for impact evaluation?"
            hint="An intervention still being developed at small scale is generally not ready for summative impact evaluation. Evaluating too early risks null results that reflect immaturity rather than ineffectiveness."
            value={inputs.p3_scale} onChange={v => set('p3_scale', v)}
            options={[{ value: 'yes', label: 'Yes' }, { value: 'partial', label: 'Borderline' }, { value: 'no', label: 'No — too early' }]}
            inline />

          <RadioQuestion id="p3_equipoise"
            label="5. Is there genuine uncertainty about whether the intervention is effective (equipoise)?"
            hint="Equipoise — genuine uncertainty about effectiveness — is an important condition for justifying the costs of rigorous evaluation. Pre-existing belief that something works is not sufficient evidence that it does."
            value={inputs.p3_equipoise} onChange={v => set('p3_equipoise', v)}
            options={[
              { value: 'yes',     label: 'Yes — genuine uncertainty exists' },
              { value: 'partial', label: 'Partial — some prior evidence but gaps remain' },
              { value: 'no',      label: 'No — decision already made' },
            ]} />
        </Card>

        {/* Gate: passed */}
        <When condition={gatePassed}>
          <Alert type="green" title="Intervention readiness: Conditions met">
            Your responses suggest the intervention is sufficiently defined and mature for
            impact evaluation. Proceed to Section B to assess causal identification assumptions.
          </Alert>
        </When>

        {/* Gate: failed */}
        <When condition={!gatePassed && (inputs.p3_defined || inputs.p3_toc || inputs.p3_scale)}>
          <Alert type="red" title="Hard gate: Impact evaluation is premature at this stage">
            One or more critical readiness conditions have not been met. Proceeding with an
            impact evaluation at this stage risks producing misleading results that reflect
            the immaturity of the intervention rather than its true effectiveness. Sections
            4–7 and Results are locked until these conditions are met.
          </Alert>

          <Card>
            <SectionTag>Recommended Alternatives</SectionTag>
            <p className="govuk-hint">
              Consider the following evaluation approaches before proceeding to impact evaluation:
            </p>
            <table className="govuk-table">
              <thead className="govuk-table__head">
                <tr className="govuk-table__row">
                  <th className="govuk-table__header" style={{ background: '#0b0c0c', color: '#fff', width: '22%' }}>Approach</th>
                  <th className="govuk-table__header" style={{ background: '#0b0c0c', color: '#fff', width: '40%' }}>Purpose</th>
                  <th className="govuk-table__header" style={{ background: '#0b0c0c', color: '#fff' }}>When to use</th>
                </tr>
              </thead>
              <tbody className="govuk-table__body">
                {ALTERNATIVES.map(alt => (
                  <tr className="govuk-table__row" key={alt.approach}>
                    <td className="govuk-table__cell"><strong>{alt.approach}</strong></td>
                    <td className="govuk-table__cell govuk-hint" style={{ color: '#6f777b' }}>{alt.purpose}</td>
                    <td className="govuk-table__cell govuk-hint" style={{ color: '#6f777b' }}>{alt.when}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>

          {/* Gate report download */}
          <Card>
            <SectionTag>Download Readiness Assessment Report</SectionTag>
            <p className="govuk-body">
              Download a summary report documenting why impact evaluation is not recommended
              at this stage, the failed readiness conditions, recommended alternative approaches,
              and any target trial specification completed on Section 2. This report can be shared
              with commissioners or used to inform planning for a future evaluation.
            </p>
            <p className="govuk-hint">
              The report will include: study context, failed conditions, alternatives table,
              and target trial components completed so far.
            </p>
            <Button variant="moj" onClick={handleDownloadGateReport}>
              Download Readiness Assessment Report
            </Button>
          </Card>
        </When>

        {/* Section B — shown only when gate passes */}
        <When condition={gatePassed}>
          <Card>
            <SectionTag>Section B — Causal Identification Assumptions</SectionTag>
            <Alert type="blue" title="About these assumptions">
              These three assumptions underpin all causal inference from observational data.
              Assessing whether they are likely to hold in your context is critical for selecting
              an appropriate design. Your responses here feed directly into the feasibility scoring.
            </Alert>

            {[
              {
                id: 'p3_exchangeability', ratId: 'p3_exchangeability_rationale',
                label: 'Exchangeability — Is there a plausible comparable control group?',
                hint: 'Exchangeability requires that, conditional on observed covariates, treated and untreated groups have the same potential outcomes. If selection into the intervention is driven by unmeasured factors (e.g. motivation, severity), exchangeability may not hold.',
              },
              {
                id: 'p3_positivity', ratId: 'p3_positivity_rationale',
                label: 'Positivity — Does every eligible unit have a non-zero probability of receiving treatment?',
                hint: 'Positivity requires that all units in your target population had some chance of receiving each treatment level. Violations occur when certain subgroups only ever receive one treatment.',
              },
              {
                id: 'p3_consistency', ratId: 'p3_consistency_rationale',
                label: 'Consistency — Is the intervention sufficiently well-defined that potential outcomes are unambiguous?',
                hint: 'Consistency can be violated if the same treatment label covers very different versions of treatment delivered by different providers.',
              },
            ].map(assump => (
              <div key={assump.id}>
                <RadioQuestion
                  id={assump.id} label={assump.label} hint={assump.hint}
                  value={inputs[assump.id]} onChange={v => set(assump.id, v)}
                  options={[
                    { value: 'yes',     label: 'Likely holds' },
                    { value: 'partial', label: 'Uncertain' },
                    { value: 'no',      label: 'Unlikely to hold' },
                  ]}
                  inline
                />
                <div className="govuk-form-group">
                  <TextArea id={assump.ratId} value={inputs[assump.ratId]}
                    onChange={v => set(assump.ratId, v)}
                    rows={2} placeholder="Explain your reasoning..." />
                </div>
              </div>
            ))}
          </Card>

          <NavButtons>
            <Button variant="secondary" onClick={() => navigate('/page2')}>← Previous: Target Trial</Button>
            <Button onClick={() => navigate('/page4')}>Next: Design Questions →</Button>
          </NavButtons>
        </When>

        <When condition={!gatePassed && (inputs.p3_defined || inputs.p3_toc || inputs.p3_scale)}>
          <NavButtons>
            <Button variant="secondary" onClick={() => navigate('/page2')}>← Revise Target Trial</Button>
            <Button variant="secondary" onClick={() => navigate('/page1')}>← Revise Research Question</Button>
          </NavButtons>
        </When>
      </div>
    </div>
  )
}
