import { useNavigate } from 'react-router-dom'
import {
  Card, SectionTag, Alert, NavButtons, Button, RadioQuestion, When, TextArea,
} from '../ui/GovukComponents.jsx'

const ALTERNATIVES = [
  { approach: 'Process evaluation',     purpose: 'Understand how the intervention is delivered, by whom, and with what fidelity', when: 'Theory of change unclear; inconsistent delivery' },
  { approach: 'Developmental evaluation',purpose: 'Support ongoing development of the intervention in real time', when: 'Still being designed; early pilot phase' },
  { approach: 'Contribution analysis',  purpose: 'Build a structured causal narrative without a counterfactual', when: 'Counterfactual not available; complex causal pathway' },
  { approach: 'Realist evaluation',     purpose: 'Understand what works, for whom, in what context, and why', when: 'Context-dependent intervention; mechanisms more important than average effects' },
]

export default function Page3({ inputs, set, gatePassed }) {
  const navigate = useNavigate()

  return (
    <div>
      <div style={{ background: '#fff', borderBottom: '4px solid #9c1b6d', padding: '20px 30px' }}>
        <h1 className="govuk-heading-l" style={{ margin: 0 }}>Causal Readiness Assessment</h1>
      </div>
      <div style={{ padding: '30px' }}>
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

        {/* Gate output */}
        <When condition={gatePassed}>
          <Alert type="green" title="Intervention readiness: Conditions met">
            Your responses suggest the intervention is sufficiently defined and mature for
            impact evaluation. Proceed to Section B to assess causal identification assumptions.
          </Alert>
        </When>

        <When condition={!gatePassed && (inputs.p3_defined || inputs.p3_toc || inputs.p3_scale)}>
          <Alert type="red" title="Hard gate: Impact evaluation is premature at this stage">
            One or more critical readiness conditions have not been met. Proceeding with an
            impact evaluation at this stage risks producing misleading results. Sections 4–7
            and Results are locked until these conditions are met.
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
        </When>

        {/* Section B — shown only when gate passes */}
        <When condition={gatePassed}>
          <Card>
            <SectionTag>Section B — Causal Identification Assumptions</SectionTag>
            <Alert type="blue" title="About these assumptions">
              These three assumptions underpin all causal inference from observational data.
              Assessing whether they are likely to hold in your context is critical for selecting
              an appropriate design. Your responses feed directly into the feasibility scoring.
            </Alert>

            {[
              {
                id: 'p3_exchangeability',
                ratId: 'p3_exchangeability_rationale',
                label: 'Exchangeability — Is there a plausible comparable control group?',
                hint: 'Exchangeability requires that, conditional on observed covariates, treated and untreated groups have the same potential outcomes. If selection into the intervention is driven by unmeasured factors (e.g. motivation, severity), exchangeability may not hold.',
              },
              {
                id: 'p3_positivity',
                ratId: 'p3_positivity_rationale',
                label: 'Positivity — Does every eligible unit have a non-zero probability of receiving treatment?',
                hint: 'Positivity requires that all units in your target population had some chance of receiving each treatment level. Violations occur when certain subgroups only ever receive one treatment.',
              },
              {
                id: 'p3_consistency',
                ratId: 'p3_consistency_rationale',
                label: 'Consistency — Is the intervention sufficiently well-defined that potential outcomes are unambiguous?',
                hint: 'Consistency can be violated if the same treatment label covers very different versions of treatment delivered by different providers.',
              },
            ].map(assump => (
              <div key={assump.id}>
                <RadioQuestion
                  id={assump.id}
                  label={assump.label}
                  hint={assump.hint}
                  value={inputs[assump.id]}
                  onChange={v => set(assump.id, v)}
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
