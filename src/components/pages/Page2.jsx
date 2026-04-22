import { useNavigate } from 'react-router-dom'
import { TTE_COMPONENTS } from '../../data/tteComponents.js'
import {
  Card, SectionTag, Alert, NavButtons, Button, RadioQuestion, When, TextArea,
PageHeader,
} from '../ui/GovukComponents.jsx'

function TteCard({ comp, inputs, set }) {
  const feasId = `${comp.id}_feasible`
  const editsId = `${comp.id}_edits`
  return (
    <div style={{
      background: '#fff',
      border: '1px solid #b1b4b6',
      borderLeft: '4px solid #9c1b6d',
      padding: '20px',
      marginBottom: '16px',
    }}>
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
          <div className="govuk-hint">
            This will be used to assess whether an RCT or observational study is more appropriate.
          </div>
          <TextArea id={editsId} value={inputs[editsId]}
            onChange={v => set(editsId, v)} rows={2}
            placeholder="Describe required modifications..." />
        </div>
      </When>
    </div>
  )
}

export default function Page2({ inputs, set }) {
  const navigate = useNavigate()
  return (
    <div>
      <PageHeader title="Target Trial Emulation" />
      <div className="page-content">
        <Alert type="yellow" title="Important framing for this section">
          The target trial emulation framework asks you to first design the ideal randomised
          trial to answer your research question — as if no practical, ethical, or financial
          constraints existed. This is not about what is currently feasible; it is about
          clarifying what you are trying to estimate. Once you have specified the ideal trial,
          you will be prompted to consider whether minor modifications could make each
          component feasible.
        </Alert>
        {TTE_COMPONENTS.map(comp => (
          <TteCard key={comp.id} comp={comp} inputs={inputs} set={set} />
        ))}
        <NavButtons>
          <Button variant="secondary" onClick={() => navigate('/page1')}>← Previous: Research Question</Button>
          <Button onClick={() => navigate('/page3')}>Next: Causal Readiness →</Button>
        </NavButtons>
      </div>
    </div>
  )
}
