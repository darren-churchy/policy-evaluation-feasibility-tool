import { useNavigate } from 'react-router-dom'
import { TTE_COMPONENTS } from '../../data/tteComponents.js'
import {
  Card, SectionTag, Alert, NavButtons, Button,
  RadioQuestion, When, TextArea, PageHeader, LockedPage,
} from '../ui/GovukComponents.jsx'

function IdealTrialCard({ comp, inputs, set }) {
  const feasId = `${comp.id}_feasible`
  const editsId = `${comp.id}_edits`
  return (
    <div className="tte-card">
      <h4 className="govuk-heading-s" style={{ marginBottom: '4px' }}>{comp.title}</h4>
      <p className="govuk-hint">{comp.hint}</p>
      <div className="govuk-form-group">
        <textarea
          className="govuk-textarea"
          id={comp.id}
          rows={3}
          placeholder={comp.placeholder}
          value={inputs[comp.id] ?? ''}
          onChange={e => set(comp.id, e.target.value)}
        />
      </div>
      <hr style={{ borderColor: '#e8e8e8', margin: '16px 0' }} />
      <RadioQuestion
        id={feasId}
        label="Could this component be made feasible with minor edits?"
        hint="Consider small modifications to design, timing, or measurement that would make this component achievable without fundamentally changing what is being estimated."
        value={inputs[feasId]}
        onChange={v => set(feasId, v)}
        options={[
          { value: 'yes',   label: 'Yes — with minor edits' },
          { value: 'maybe', label: 'Possibly — with significant edits' },
          { value: 'no',    label: 'No — not achievable' },
        ]}
      />
      <When condition={inputs[feasId] && inputs[feasId] !== 'no'}>
        <div className="govuk-form-group">
          <label className="govuk-label govuk-label--s" htmlFor={editsId}>
            What edits would be needed?
          </label>
          <TextArea id={editsId} value={inputs[editsId]}
            onChange={v => set(editsId, v)} rows={2}
            placeholder="Describe required modifications..." />
        </div>
      </When>
    </div>
  )
}

export default function PageIdealTrial({ inputs, set, gatePassed }) {
  const navigate = useNavigate()

  if (!gatePassed) return (
    <>
      <PageHeader title="Ideal Trial Specification" />
      <div className="page-content"><LockedPage /></div>
    </>
  )

  return (
    <div>
      <PageHeader title="Ideal Trial Specification" />
      <div className="page-content">

        {/* Framing note */}
        <Alert type="yellow" title="What this section is asking — and why">
          <p style={{ margin: 0 }}>
            This section asks you to specify the <strong>ideal randomised trial</strong> to
            answer your research question — as if no practical, ethical, or resource constraints
            existed. This is an <em>ex ante</em> exercise: you are clarifying what you want to
            estimate before deciding how to estimate it.
          </p>
          <p style={{ margin: '8px 0 0' }}>
            This is related to, but distinct from, Target Trial Emulation (TTE). TTE is a
            framework for designing observational analyses ex post to emulate a specific
            hypothetical trial. Here you are doing the prior step: specifying what the
            ideal trial would look like so that later design choices are anchored to a
            clear causal estimand.
          </p>
        </Alert>

        <Alert type="blue">
          Specifying the ideal trial helps clarify: <strong>what are you trying to estimate?</strong>{' '}
          (intention-to-treat vs per-protocol; ATE vs LATE); <strong>who for?</strong> (the
          target population); and <strong>over what period?</strong> (follow-up and outcome
          timing). These decisions shape every design choice that follows.
        </Alert>

        {TTE_COMPONENTS.map(comp => (
          <IdealTrialCard key={comp.id} comp={comp} inputs={inputs} set={set} />
        ))}

        <NavButtons>
          <Button variant="secondary" onClick={() => navigate('/causal-readiness')}>← Previous: Causal Readiness</Button>
          <Button onClick={() => navigate('/design-questions')}>Next: Design Questions →</Button>
        </NavButtons>
      </div>
    </div>
  )
}
