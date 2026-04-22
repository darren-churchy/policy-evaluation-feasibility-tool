import { useNavigate } from 'react-router-dom'
import {
  Card, SectionTag, Alert, NavButtons, Button,
  RadioQuestion, When, TextArea, LockedPage,
} from '../ui/GovukComponents.jsx'

export default function Page5({ inputs, set, gatePassed }) {
  const navigate = useNavigate()
  if (!gatePassed) return <><div style={{ background: '#fff', borderBottom: '4px solid #9c1b6d', padding: '20px 30px' }}><h1 className="govuk-heading-l" style={{ margin: 0 }}>Adjustment Variables &amp; Causal Diagram</h1></div><div style={{ padding: '30px' }}><LockedPage /></div></>

  return (
    <div>
      <div style={{ background: '#fff', borderBottom: '4px solid #9c1b6d', padding: '20px 30px' }}>
        <h1 className="govuk-heading-l" style={{ margin: 0 }}>Adjustment Variables &amp; Causal Diagram</h1>
      </div>
      <div style={{ padding: '30px' }}>
        <Alert type="blue" title="About this section">
          This section asks you to describe the causal structure of your problem and classify
          variables. Clear thinking here is essential for identifying appropriate adjustment
          strategies and avoiding bias from over- or under-adjustment.
        </Alert>

        <Card>
          <SectionTag>Causal Diagram (DAG)</SectionTag>
          <Alert type="yellow" title="What is a DAG?">
            A Directed Acyclic Graph (DAG) shows causal relationships between variables —
            arrows represent direct causal effects. DAGs help identify which variables to
            adjust for (confounders), which to avoid (colliders and mediators), and which
            pathways carry the causal effect of interest.
          </Alert>
          <div className="govuk-form-group">
            <label className="govuk-label govuk-label--s" htmlFor="p5_dag">
              Describe the causal relationships between your key variables
            </label>
            <div className="govuk-hint">
              In plain language, describe which variables cause which others. For example:
              'Age causes both treatment uptake and outcome. Employment status is caused by
              treatment and also causes outcome.' A text description is sufficient — you do
              not need to draw a diagram at this stage.
            </div>
            <TextArea id="p5_dag" value={inputs.p5_dag} onChange={v => set('p5_dag', v)}
              rows={6} placeholder="e.g. Prior risk score → treatment assignment. Age → treatment uptake and → outcome..." />
          </div>
          <div className="govuk-form-group">
            <label className="govuk-label govuk-label--s" htmlFor="p5_dag_key">
              List the key variables in your causal diagram
            </label>
            <div className="govuk-hint">List the main variables — one per line or comma-separated.</div>
            <TextArea id="p5_dag_key" value={inputs.p5_dag_key} onChange={v => set('p5_dag_key', v)}
              rows={3} placeholder="e.g. Age, prior risk score, treatment assignment, employment status, reoffending" />
          </div>
        </Card>

        <Card>
          <SectionTag>Variable Classification</SectionTag>
          <Alert type="blue" title="Why variable classification matters">
            Confounders should be adjusted for. Mediators should generally not be adjusted
            for when estimating total effects. Colliders must never be adjusted for — doing
            so opens non-causal pathways (collider bias). Competing exposures require careful
            consideration depending on your estimand.
          </Alert>

          {[
            { id: 'p5_confounders', label: 'Confounders', hint: 'Variables that cause both treatment assignment and the outcome. Must be adjusted for to block non-causal associations.', placeholder: 'e.g. Age, sex, prior risk score, socioeconomic status, region of delivery' },
            { id: 'p5_mediators',   label: 'Mediators',   hint: 'Variables on the causal pathway between treatment and outcome — caused by treatment and in turn causing the outcome. Do not adjust for mediators when estimating total treatment effects.', placeholder: 'e.g. Employment status (caused by programme; causes reoffending)' },
            { id: 'p5_colliders',   label: 'Colliders',   hint: 'Variables caused by both treatment and outcome (or their causes). Never adjust for colliders — this introduces bias by opening a non-causal pathway.', placeholder: 'e.g. Programme completion (caused by engagement and personal stability)' },
            { id: 'p5_competing',   label: 'Competing Exposures', hint: 'Other interventions or exposures occurring simultaneously that may also affect the outcome.', placeholder: 'e.g. Concurrent housing support received by some participants during follow-up' },
          ].map(v => (
            <div className="govuk-form-group" key={v.id} style={{ marginBottom: '24px' }}>
              <label className="govuk-label govuk-label--s" htmlFor={v.id}>{v.label}</label>
              <div className="govuk-hint">{v.hint}</div>
              <TextArea id={v.id} value={inputs[v.id]} onChange={val => set(v.id, val)} rows={3} placeholder={v.placeholder} />
            </div>
          ))}

          <hr style={{ borderColor: '#e8e8e8', margin: '24px 0' }} />

          <RadioQuestion id="p5_confounder_confidence"
            label="Do you feel you have adequately identified all major confounders?"
            hint="Reflect on whether there are plausible common causes of treatment and outcome that you cannot measure. Unmeasured confounding is the primary threat to validity in observational studies."
            value={inputs.p5_confounder_confidence}
            onChange={v => set('p5_confounder_confidence', v)}
            options={[
              { value: 'yes',   label: 'Yes — confident all major confounders identified and measurable' },
              { value: 'maybe', label: 'Mostly — some residual unmeasured confounding likely' },
              { value: 'no',    label: 'No — significant unmeasured confounding expected' },
            ]} />

          <When condition={inputs.p5_confounder_confidence && inputs.p5_confounder_confidence !== 'yes'}>
            <div className="govuk-form-group">
              <label className="govuk-label govuk-label--s" htmlFor="p5_unmeasured">
                What unmeasured confounders are you concerned about?
              </label>
              <div className="govuk-hint">
                This will be flagged on the results page as a validity concern.
              </div>
              <TextArea id="p5_unmeasured" value={inputs.p5_unmeasured}
                onChange={v => set('p5_unmeasured', v)} rows={3} />
            </div>
          </When>
        </Card>

        <NavButtons>
          <Button variant="secondary" onClick={() => navigate('/page4')}>← Previous: Design Questions</Button>
          <Button onClick={() => navigate('/page6')}>Next: Data Sources →</Button>
        </NavButtons>
      </div>
    </div>
  )
}
