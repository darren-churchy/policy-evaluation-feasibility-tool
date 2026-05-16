import { useNavigate } from 'react-router-dom'
import {
  Card, SectionTag, Alert, NavButtons, Button,
  RadioQuestion, When, TextArea, PageHeader,
} from '../ui/GovukComponents.jsx'

// ── Test and Learn stage mapping ───────────────────────────────────────────
// Maps readiness answers to T&L stage labels and guidance.
// Used to contextualise the gate outcome within the Magenta Book framework.

const TL_STAGES = {
  explore: {
    label: 'Explore',
    bg: '#e8f4e8', fg: '#1a5a2a',
    note: 'At the Explore stage the focus is on understanding the problem and the population it affects. Impact evaluation is not yet appropriate.',
  },
  codesign: {
    label: 'Co-design',
    bg: '#e8eef8', fg: '#1a3a6a',
    note: 'At the Co-design stage the focus is on developing and refining the intervention. Document the intervention specification and theory of change before returning to assess impact evaluation feasibility.',
  },
  test: {
    label: 'Test',
    bg: '#f5eaf8', fg: '#5a1a6a',
    note: 'At the Test stage the intervention is defined and has a theory of change. Impact evaluation is appropriate — the focus is on testing whether it works and for whom.',
  },
  grow: {
    label: 'Grow',
    bg: '#fef0e0', fg: '#6a3a1a',
    note: 'At the Grow stage the intervention is running at scale. Evaluation may focus on whether effects replicate at scale, in different contexts, or for different sub-populations.',
  },
}

function TLBadge({ stage }) {
  const s = TL_STAGES[stage]
  if (!s) return null
  return (
    <span style={{
      display: 'inline-block',
      background: s.bg,
      color: s.fg,
      fontSize: '12px',
      fontWeight: 700,
      padding: '3px 10px',
      borderRadius: '2px',
      fontFamily: 'inherit',
    }}>
      {s.label}
    </span>
  )
}

// Infer T&L stage from readiness answers
function inferTLStage(inputs) {
  const { p3_defined, p3_toc, p3_scale } = inputs
  if (p3_defined === 'no' || p3_toc === 'no') return 'codesign'
  if (p3_scale === 'no') return 'explore'
  if (p3_scale === 'partial') return 'test'
  if (p3_defined === 'partial' || p3_toc === 'partial') return 'test'
  return p3_scale === 'yes' ? 'grow' : 'test'
}

const ALTERNATIVES = [
  { approach: 'Process evaluation',      stage: 'Co-design', purpose: 'Understand how the intervention is delivered, by whom, and with what fidelity',              when: 'Theory of change unclear; inconsistent delivery' },
  { approach: 'Developmental evaluation',stage: 'Co-design', purpose: 'Support ongoing development of the intervention in real time',                               when: 'Still being designed; early pilot phase' },
  { approach: 'Contribution analysis',   stage: 'Test',      purpose: 'Build a structured causal narrative without requiring a counterfactual comparison group',      when: 'Counterfactual not available; complex multi-component pathway' },
  { approach: 'Realist evaluation',      stage: 'Test/Grow', purpose: 'Understand what works, for whom, in what context, and why',                                  when: 'Context-dependent mechanisms more important than average effects' },
]

export default function PageCausalReadiness({ inputs, set, gatePassed, gateFailures }) {
  const navigate = useNavigate()
  const tlStage  = inferTLStage(inputs)
  const hasAnswered = inputs.p3_defined || inputs.p3_toc || inputs.p3_scale

  return (
    <div>
      <PageHeader title="Causal Readiness Assessment" />
      <div className="page-content">

        {/* T&L context panel */}
        <div style={{
          background: '#0b0c0c',
          padding: '16px 20px',
          marginBottom: '20px',
          display: 'flex',
          gap: '12px',
          alignItems: 'flex-start',
        }}>
          <div style={{ fontSize: '18px', flexShrink: 0 }}>📋</div>
          <div>
            <div style={{ fontSize: '12px', fontWeight: 700, color: '#fff', marginBottom: '4px' }}>
              Magenta Book Test and Learn — Readiness Check
            </div>
            <p style={{ fontSize: '13px', color: 'rgba(255,255,255,.65)', lineHeight: 1.6, margin: 0 }}>
              This section checks whether your intervention is ready for impact evaluation.
              The T&amp;L framework identifies <strong style={{ color: '#fff' }}>Test</strong> and{' '}
              <strong style={{ color: '#fff' }}>Grow</strong> as the appropriate stages for impact evaluation —
              once the intervention is defined, has a theory of change, and is operating at
              sufficient scale. If critical conditions are not met, sections 3–7 and Results
              are locked and alternative evaluation approaches are signposted.
            </p>
            {hasAnswered && (
              <div style={{ marginTop: '10px', display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '11px', color: 'rgba(255,255,255,.5)' }}>Suggested stage:</span>
                <TLBadge stage={tlStage} />
                <span style={{ fontSize: '11px', color: 'rgba(255,255,255,.5)', fontStyle: 'italic' }}>
                  {TL_STAGES[tlStage]?.note}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Section A — Readiness */}
        <Card>
          <SectionTag>Section A — Intervention Readiness</SectionTag>
          <div className="govuk-hint" style={{ marginBottom: '16px' }}>
            Three critical conditions must be met to proceed. If any is answered "No",
            sections 3–7 are locked and alternative evaluation approaches are signposted.
            Answering "Partially" allows you to continue but raises a warning on the results page.
            <br />
            <span style={{ fontSize: '12px', marginTop: '4px', display: 'inline-block' }}>
              If you are unsure whether impact evaluation is the right approach, try the{' '}
              <a href="/policy-evaluation-feasibility-tool/research-question-framework.html" target="_blank" rel="noopener noreferrer" style={{ color: '#1d70b8' }}>
                Research Question Framework
              </a>{' '}
              or the{' '}
              <a href="/policy-evaluation-feasibility-tool/design-finder.html" target="_blank" rel="noopener noreferrer" style={{ color: '#1d70b8' }}>
                Evaluation Design Finder
              </a>{' '}
              first.
            </span>
          </div>

          <RadioQuestion id="p3_defined"
            label="1. Is the intervention clearly defined and documented?"
            hint="The intervention should have a written description of what it consists of, who delivers it, how it is delivered, and at what intensity. Without this, it is not possible to attribute any observed effects to the intervention rather than to variation in delivery. This is a prerequisite for the Co-design → Test transition."
            value={inputs.p3_defined} onChange={v => set('p3_defined', v)}
            options={[
              { value: 'yes',     label: 'Yes — clearly defined and documented' },
              { value: 'partial', label: 'Partially — elements are clear but not fully documented' },
              { value: 'no',      label: 'No — still being designed or varies substantially' },
            ]}
            inline />

          <RadioQuestion id="p3_toc"
            label="2. Is there a theory of change or logic model describing the causal mechanism?"
            hint="A theory of change sets out the assumed pathway from intervention inputs to outcomes — including intermediate steps, assumptions, and context. Without it, it is unclear what the evaluation should measure or how to interpret findings. This is a separate condition from intervention definition — both are required. This is a prerequisite for the Co-design → Test transition."
            value={inputs.p3_toc} onChange={v => set('p3_toc', v)}
            options={[
              { value: 'yes',     label: 'Yes — documented theory of change or logic model exists' },
              { value: 'partial', label: 'In development — draft exists and is being used' },
              { value: 'no',      label: 'No — no theory of change or logic model yet' },
            ]}
            inline />

          <RadioQuestion id="p3_consistent"
            label="3. Is the intervention being delivered consistently across sites or practitioners?"
            hint="High variation in delivery means you may be evaluating a heterogeneous bundle of activities rather than a specific intervention, which limits causal attribution."
            value={inputs.p3_consistent} onChange={v => set('p3_consistent', v)}
            options={[
              { value: 'yes',     label: 'Yes — consistent delivery' },
              { value: 'partial', label: 'Somewhat — some variation across sites' },
              { value: 'no',      label: 'No — high variation in delivery' },
            ]}
            inline />

          <RadioQuestion id="p3_scale"
            label="4. Has the intervention reached sufficient scale or maturity for impact evaluation?"
            hint="Evaluating too early — when an intervention is still changing, at very small scale, or not yet consistently delivered — risks findings that reflect immaturity rather than true effectiveness. This is the Test/Grow distinction: Test = defined and being trialled; Grow = running stably at scale."
            value={inputs.p3_scale} onChange={v => set('p3_scale', v)}
            options={[
              { value: 'yes',     label: 'Yes — well established and running at scale' },
              { value: 'partial', label: 'Borderline — partially scaled or still expanding' },
              { value: 'no',      label: 'No — still early stage, pilot, or highly variable' },
            ]}
            inline />

          <RadioQuestion id="p3_equipoise"
            label="5. Is there genuine uncertainty about whether the intervention is effective (equipoise)?"
            hint="Equipoise — genuine uncertainty about effectiveness — justifies the costs of rigorous evaluation. Pre-existing belief that something works is not sufficient evidence; equally, a decision already made removes the evaluative purpose."
            value={inputs.p3_equipoise} onChange={v => set('p3_equipoise', v)}
            options={[
              { value: 'yes',     label: 'Yes — genuine uncertainty exists' },
              { value: 'partial', label: 'Partial — some prior evidence but important gaps remain' },
              { value: 'no',      label: 'No — decision already made or effectiveness assumed' },
            ]} />
        </Card>

        {/* Gate: passed */}
        <When condition={gatePassed && hasAnswered}>
          <div style={{
            background: '#e3f3eb',
            borderLeft: '5px solid #00703c',
            padding: '14px 18px',
            marginBottom: '20px',
            display: 'flex',
            gap: '10px',
            alignItems: 'flex-start',
          }}>
            <span style={{ fontSize: '16px' }}>✓</span>
            <div>
              <strong style={{ fontSize: '14px', display: 'block', marginBottom: '2px' }}>
                Readiness conditions met — <TLBadge stage={tlStage} /> stage
              </strong>
              <span style={{ fontSize: '13px', color: '#6f777b' }}>
                Your intervention appears ready for impact evaluation. Proceed to Section B
                to assess causal identification assumptions, then continue to the Ideal Trial
                specification.
              </span>
            </div>
          </div>
        </When>

        {/* Gate: failed */}
        <When condition={!gatePassed && hasAnswered}>
          <Alert type="red" title="Hard gate: Impact evaluation is premature at this stage">
            One or more critical readiness conditions have not been met. Sections 3–7
            and Results are locked. Review the alternative approaches below, then return
            when the intervention is more developed.
          </Alert>

          {/* T&L stage callout */}
          <div style={{ background: '#0b0c0c', padding: '16px 20px', marginBottom: '16px' }}>
            <div style={{ fontSize: '12px', fontWeight: 700, color: '#fff', marginBottom: '8px' }}>
              Suggested T&amp;L stage based on your answers
            </div>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
              {(inputs.p3_defined === 'no' || inputs.p3_toc === 'no') && <TLBadge stage="codesign" />}
              {inputs.p3_scale === 'no' && !(inputs.p3_defined === 'no' || inputs.p3_toc === 'no') && <TLBadge stage="explore" />}
            </div>
            <p style={{ fontSize: '13px', color: 'rgba(255,255,255,.65)', marginTop: '8px', lineHeight: 1.6 }}>
              {inputs.p3_defined === 'no' || inputs.p3_toc === 'no'
                ? 'Your intervention appears to be at the Co-design stage. Focus on defining the intervention and developing a theory of change before attempting impact evaluation.'
                : 'Your intervention appears to be at the Explore or early Test stage. A process or developmental evaluation will generate more useful evidence than an impact evaluation at this point.'}
            </p>
          </div>

          <Card>
            <SectionTag>Recommended Alternative Approaches</SectionTag>
            <p className="govuk-hint" style={{ marginBottom: '12px' }}>
              These approaches are appropriate at the Explore and Co-design stages of the
              T&amp;L cycle and will help build readiness for future impact evaluation.
            </p>
            <table className="govuk-table">
              <thead className="govuk-table__head">
                <tr className="govuk-table__row">
                  <th className="govuk-table__header" style={{ background: '#0b0c0c', color: '#fff', width: '22%' }}>Approach</th>
                  <th className="govuk-table__header" style={{ background: '#0b0c0c', color: '#fff', width: '12%' }}>T&amp;L stage</th>
                  <th className="govuk-table__header" style={{ background: '#0b0c0c', color: '#fff', width: '38%' }}>Purpose</th>
                  <th className="govuk-table__header" style={{ background: '#0b0c0c', color: '#fff' }}>When to use</th>
                </tr>
              </thead>
              <tbody className="govuk-table__body">
                {ALTERNATIVES.map(alt => (
                  <tr className="govuk-table__row" key={alt.approach}>
                    <td className="govuk-table__cell"><strong>{alt.approach}</strong></td>
                    <td className="govuk-table__cell">
                      <TLBadge stage={alt.stage === 'Co-design' ? 'codesign' : alt.stage === 'Test' ? 'test' : 'grow'} />
                    </td>
                    <td className="govuk-table__cell govuk-hint" style={{ color: '#6f777b', fontSize: '13px' }}>{alt.purpose}</td>
                    <td className="govuk-table__cell govuk-hint" style={{ color: '#6f777b', fontSize: '13px' }}>{alt.when}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        </When>

        {/* Section B — shown when gate passes */}
        <When condition={gatePassed}>
          <Card>
            <SectionTag>Section B — Causal Identification Assumptions</SectionTag>
            <Alert type="blue" title="About these assumptions">
              These three assumptions underpin all causal inference from observational data.
              Your responses feed directly into the feasibility scoring — each is mapped to
              a 0–1 score and applied as a global modifier to all 29 quantitative designs.
            </Alert>

            {[
              {
                id: 'p3_exchangeability', ratId: 'p3_exchangeability_rationale',
                label: 'Exchangeability — Is there a plausible comparable control group?',
                hint: 'Exchangeability requires that, conditional on observed covariates, treated and untreated groups have the same potential outcomes. If selection into the intervention is driven by unmeasured factors (e.g. motivation, severity), exchangeability may not hold. Scoring: yes→1.0, partial→0.7, no→0.0.',
              },
              {
                id: 'p3_positivity', ratId: 'p3_positivity_rationale',
                label: 'Positivity — Does every eligible unit have a non-zero probability of receiving treatment?',
                hint: 'Positivity requires that all units in your target population had some chance of receiving each treatment level. A "No" answer also triggers a hard blocker for IPW and stabilised IPW designs. Overlap weights receive a +0.1 bonus if positivity is uncertain or unlikely to hold.',
              },
              {
                id: 'p3_consistency', ratId: 'p3_consistency_rationale',
                label: 'Consistency — Is the intervention sufficiently well-defined that potential outcomes are unambiguous?',
                hint: 'Consistency can be violated if the same treatment label covers very different versions delivered by different providers or at different intensities. Note that this assumption is related to but distinct from the intervention definition question in Section A.',
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

            {/* Live assumption score preview */}
            <When condition={inputs.p3_exchangeability && inputs.p3_positivity && inputs.p3_consistency}>
              <div style={{ background: '#f3f2f1', padding: '12px 14px', marginTop: '8px', fontSize: '13px', color: '#0b0c0c' }}>
                <strong>Global assumption score:</strong>{' '}
                {(() => {
                  const map = { yes: 1.0, partial: 0.7, no: 0.0 }
                  const vals = [inputs.p3_exchangeability, inputs.p3_positivity, inputs.p3_consistency]
                    .map(v => map[v] ?? 0.5)
                  const mean = vals.reduce((a, b) => a + b, 0) / vals.length
                  return `mean(${vals.join(', ')}) = ${mean.toFixed(2)}`
                })()}
                {' '}— applied as a multiplier to all quantitative design causal validity scores.
              </div>
            </When>
          </Card>

          <NavButtons>
            <Button variant="secondary" onClick={() => navigate('/research-question')}>← Previous: Research Question</Button>
            <Button onClick={() => navigate('/ideal-trial')}>Next: Ideal Trial →</Button>
          </NavButtons>
        </When>

        <When condition={!gatePassed && hasAnswered}>
          <NavButtons>
            <Button variant="secondary" onClick={() => navigate('/research-question')}>← Revise Research Question</Button>
          </NavButtons>
        </When>
      </div>
    </div>
  )
}
