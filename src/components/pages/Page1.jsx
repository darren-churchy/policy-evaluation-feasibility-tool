import { useNavigate } from 'react-router-dom'
import {
  Card, CardTitle, SectionTag, Question, RadioQuestion,
  TextArea, TextInput, DateInput, Alert, NavButtons, Button, When,
PageHeader,
} from '../ui/GovukComponents.jsx'

const PICOTS = [
  { key: 'picots_p', element: 'P — Population',   desc: 'Who are the participants? Define inclusion and exclusion criteria.' },
  { key: 'picots_i', element: 'I — Intervention',  desc: 'What is the intervention? Describe dose, duration, and delivery.' },
  { key: 'picots_c', element: 'C — Comparator',    desc: 'What is the counterfactual? What would participants have received otherwise?' },
  { key: 'picots_o', element: 'O — Outcome',       desc: 'What outcomes will be measured? Distinguish primary from secondary.' },
  { key: 'picots_t', element: 'T — Timeframe',     desc: 'Over what period will outcomes be measured?' },
  { key: 'picots_s', element: 'S — Setting',       desc: 'Where does the intervention take place?' },
]

export default function Page1({ inputs, set }) {
  const navigate = useNavigate()

  return (
    <div>
      <PageHeader title="Research Question & Study Context" />
      <div className="page-content">

        <Alert type="blue" title="About this section">
          This section helps you clearly define your research question and policy context.
          A well-specified research question is the foundation of any evaluation design.
        </Alert>

        {/* Evaluation Timing */}
        <Card>
          <SectionTag>Evaluation Timing</SectionTag>
          <RadioQuestion
            id="p1_prospective"
            label="Is a prospective evaluation possible?"
            hint="A prospective evaluation plans data collection in advance of the intervention, enabling RCTs and other designs requiring pre-planned data collection. Selecting 'No' will hide prospective-only designs from later sections."
            value={inputs.p1_prospective}
            onChange={v => set('p1_prospective', v)}
            options={[
              { value: 'yes',   label: 'Yes — prospective evaluation is possible' },
              { value: 'maybe', label: 'Possibly — some prospective elements may be feasible' },
              { value: 'no',    label: 'No — retrospective evaluation only' },
            ]}
          />
          <When condition={inputs.p1_prospective === 'no'}>
            <Alert type="yellow" title="Retrospective evaluation selected">
              Designs requiring prospective randomisation or pre-planned data collection
              (RCTs, stepped-wedge, waitlist) will be hidden from the Design Questions section.
            </Alert>
          </When>
          <When condition={inputs.p1_prospective === 'maybe'}>
            <Question id="p1_prospective_detail" label="What prospective elements might be feasible?"
              hint="Describe which aspects of a prospective design could be incorporated.">
              <TextArea id="p1_prospective_detail" value={inputs.p1_prospective_detail}
                onChange={v => set('p1_prospective_detail', v)} rows={2} />
            </Question>
          </When>
        </Card>

        {/* Project Overview */}
        <Card>
          <SectionTag>Project Overview</SectionTag>
          <Question id="p1_title" label="Project title" hint="Give your evaluation project a short working title.">
            <TextInput id="p1_title" value={inputs.p1_title} onChange={v => set('p1_title', v)}
              placeholder="e.g. Evaluation of the Restart Scheme" />
          </Question>
          <Question id="p1_overview" label="Project overview"
            hint="Briefly describe the policy or programme being evaluated, the population it targets, and the context in which it operates.">
            <TextArea id="p1_overview" value={inputs.p1_overview} onChange={v => set('p1_overview', v)}
              rows={4} placeholder="Describe the intervention and its context..." />
          </Question>
          <Question id="p1_rq" label="Research question"
            hint="State your primary research question as precisely as possible. A good research question specifies who, what, compared to what, and over what time period.">
            <TextArea id="p1_rq" value={inputs.p1_rq} onChange={v => set('p1_rq', v)} rows={3}
              placeholder="e.g. What is the effect of [intervention] on [outcome] among [population] compared to [comparator] over [timeframe]?" />
          </Question>
        </Card>

        {/* Theory of Change */}
        <Card>
          <SectionTag>Theory of Change</SectionTag>
          <RadioQuestion
            id="p1_toc"
            label="Does your research question link to an existing theory of change or logic model?"
            hint="A theory of change describes the causal pathway from intervention to outcome — including intermediate steps, assumptions, and contextual factors."
            value={inputs.p1_toc}
            onChange={v => set('p1_toc', v)}
            options={[
              { value: 'yes',         label: 'Yes' },
              { value: 'no',          label: 'No' },
              { value: 'development', label: 'In development' },
            ]}
            inline
          />
          <When condition={inputs.p1_toc && inputs.p1_toc !== 'no'}>
            <Question id="p1_toc_detail" label="How does your research question link to the theory of change?"
              hint="Describe which part of the causal pathway your evaluation is testing.">
              <TextArea id="p1_toc_detail" value={inputs.p1_toc_detail}
                onChange={v => set('p1_toc_detail', v)} rows={3} />
            </Question>
          </When>
        </Card>

        {/* Policy Decision */}
        <Card>
          <SectionTag>Policy Decision</SectionTag>
          <Question id="p1_policy_decision" label="What policy decision will this evaluation inform?"
            hint="Be specific — e.g. whether to scale up a pilot, continue funding, or modify delivery. The nature of the decision affects what kind of evidence is needed and how quickly.">
            <TextArea id="p1_policy_decision" value={inputs.p1_policy_decision}
              onChange={v => set('p1_policy_decision', v)} rows={3} />
          </Question>
          <Question id="p1_deadline" label="When does this policy decision need to be made by?"
            hint="The decision timeline directly affects which evaluation designs are feasible. A decision needed in 6 months rules out many longitudinal designs.">
            <DateInput id="p1_deadline" value={inputs.p1_deadline}
              onChange={v => set('p1_deadline', v)} />
          </Question>
        </Card>

        {/* PICOTS */}
        <Card>
          <SectionTag>PICOTS Framework</SectionTag>
          <Alert type="blue" title="Why PICOTS?">
            PICOTS helps you specify your research question precisely and consistently.
            Each element shapes your evaluation design choices.
          </Alert>
          <table className="govuk-table">
            <thead className="govuk-table__head">
              <tr className="govuk-table__row">
                <th className="govuk-table__header" style={{ width: '22%', background: '#0b0c0c', color: '#fff' }}>Element</th>
                <th className="govuk-table__header" style={{ background: '#0b0c0c', color: '#fff' }}>Your answer</th>
              </tr>
            </thead>
            <tbody className="govuk-table__body">
              {PICOTS.map(row => (
                <tr className="govuk-table__row" key={row.key}>
                  <td className="govuk-table__cell" style={{ verticalAlign: 'top' }}>
                    <strong style={{ color: '#9c1b6d' }}>{row.element}</strong>
                    <div className="govuk-hint" style={{ marginBottom: 0, fontSize: '13px' }}>{row.desc}</div>
                  </td>
                  <td className="govuk-table__cell">
                    <TextArea id={row.key} value={inputs[row.key]}
                      onChange={v => set(row.key, v)} rows={2} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>

        <NavButtons>
          <Button onClick={() => navigate('/page2')}>Next: Target Trial →</Button>
        </NavButtons>
      </div>
    </div>
  )
}
