// What kind of question is this?
//
// One tool, replacing three: the Research Question Framework and the two decision trees.
// They covered the same ground by different means — the Framework is a taxonomy you browse,
// the trees reach the same categories by traversal — and as three equal cards on the
// landing page they competed for attention with the assessment itself.
//
// `questionFrameworkData.js` already exports both halves of the taxonomy, and its
// quantitative types are Description, Prediction and Causal Inference: the same three
// distinctions the quantitative tree walks you to. Merging them is bringing one body of
// content under one roof, not inventing a new tool.
//
// This is where `claim_type: unsure` routes. Someone sent here cannot yet say whether
// their question is causal, which is exactly what this settles.

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { QuantTreeBody } from './PageQuantTree.jsx'
import { QualTreeBody } from './PageQualTree.jsx'
import { TaxonomyBody } from './PageQuestionFramework.jsx'
import { useAnswers } from '../../../state/AnswersContext.jsx'
import { T } from '../../../styles/tokens.js'
import { PageHeader, Alert, Button, NavButtons } from '../../ui/GovukComponents.jsx'

const TABS = [
  { id: 'quant', label: 'Quantitative', body: QuantTreeBody,
    blurb: 'Walk the questions to reach a quantitative question type and the designs that answer it.' },
  { id: 'qual', label: 'Qualitative', body: QualTreeBody,
    blurb: 'Walk the questions to reach a qualitative question type and the approaches that answer it.' },
  { id: 'browse', label: 'Browse every type', body: TaxonomyBody,
    blurb: 'The whole taxonomy, quantitative and qualitative, to read rather than to walk.' },
]

export default function PageQuestionType() {
  const navigate = useNavigate()
  const { answers, set } = useAnswers()
  const [tab, setTab] = useState('quant')

  const active = TABS.find(t => t.id === tab) ?? TABS[0]
  const Body = active.body

  return (
    <div>
      <PageHeader title="What kind of question is this?" />
      <div className="page-content tool-column tool-column--wide">

        <Alert type="blue">
          This tool settles what kind of question you are asking. Only causal questions —
          what effect an intervention or policy had — are what the feasibility assessment
          covers; description, prediction and the qualitative strands have their own methods
          and their own standards, set out here.
        </Alert>

        <div role="tablist" aria-label="Ways in" style={{
          display: 'flex', gap: '4px', flexWrap: 'wrap',
          borderBottom: `2px solid ${T.greyLine}`, marginBottom: '6px',
        }}>
          {TABS.map(t => {
            const on = t.id === tab
            return (
              <button
                key={t.id}
                role="tab"
                aria-selected={on}
                onClick={() => setTab(t.id)}
                style={{
                  font: 'inherit', fontSize: '15px', fontWeight: on ? 700 : 400,
                  background: on ? '#fff' : 'transparent',
                  color: on ? T.purple : T.ink,
                  border: 'none', borderBottom: `3px solid ${on ? T.purple : 'transparent'}`,
                  padding: '10px 16px', cursor: 'pointer', marginBottom: '-2px',
                }}
              >
                {t.label}
              </button>
            )
          })}
        </div>
        <p className="govuk-body-s" style={{ color: T.greyText }}>{active.blurb}</p>

        <Body />

        {/* The way back. Settling that the question is causal is the one thing from here
            the assessment needs, so it is offered rather than asked for a second time. */}
        <div style={{
          background: T.purpleTint, borderLeft: `4px solid ${T.purple}`,
          padding: '14px 18px', marginTop: '24px',
        }}>
          <p className="govuk-body" style={{ marginBottom: '10px' }}>
            {answers.claim_type === 'causal'
              ? 'Your question is recorded as a causal one, so the feasibility assessment applies.'
              : 'If this has settled that your question is a causal one — what effect an intervention had — the feasibility assessment applies.'}
          </p>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <Button
              variant="moj"
              onClick={() => { set('claim_type', 'causal'); navigate('/ladder') }}
            >
              It is a causal question — start the assessment
            </Button>
            <Button variant="secondary" onClick={() => navigate('/')}>← Home</Button>
          </div>
        </div>

        <NavButtons />
      </div>
    </div>
  )
}
