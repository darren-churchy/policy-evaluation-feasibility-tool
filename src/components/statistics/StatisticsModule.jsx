// The statistics module, rendered.
//
// `evaluate()` returns the whole module — the shared questions, the branch for the chosen
// approach with its question set and its tensions, the comparison shown while the approach
// is undecided, and the quantity that plays the role of N for the designs still in play.
// This renders it.
//
// Two things it must get right. Tensions are questions to take to a statistician, never
// verdicts, so they are headed as questions and carry the prompt rather than a judgement.
// And a tension whose condition is unresolved is not raised at all — that filtering
// happens in the engine, so there is nothing to do here but trust it and not add a
// fallback that would reintroduce the behaviour.

import { useAnswers } from '../../state/AnswersContext.jsx'
import { T } from '../../styles/tokens.js'
import { Card, SectionTag, Alert, RadioQuestion } from '../ui/GovukComponents.jsx'
import ReadyReckoner from './ReadyReckoner.jsx'

function QuestionList({ ids, questionsById, answers, set }) {
  return ids.map(id => {
    const question = questionsById.get(id)
    if (!question) return null
    return (
      <RadioQuestion
        key={id}
        id={id}
        label={question.text}
        hint={question.hint}
        value={answers[id]}
        onChange={value => set(id, value)}
        options={question.options}
      />
    )
  })
}

/** What each approach asks of the design. Shown only while the approach is undecided. */
function Comparison({ rows }) {
  return (
    <table className="govuk-table" style={{ marginTop: '8px' }}>
      <thead className="govuk-table__head">
        <tr className="govuk-table__row">
          <th scope="col" className="govuk-table__header"></th>
          <th scope="col" className="govuk-table__header">Frequentist</th>
          <th scope="col" className="govuk-table__header">Bayesian</th>
        </tr>
      </thead>
      <tbody className="govuk-table__body">
        {rows.map(row => (
          <tr key={row.topic} className="govuk-table__row">
            <th scope="row" className="govuk-table__header">{row.topic}</th>
            <td className="govuk-table__cell govuk-body-s">{row.nhst}</td>
            <td className="govuk-table__cell govuk-body-s">{row.bayesian}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

/** A tension: what the answers have raised, and the question it turns into. */
function Tension({ tension }) {
  return (
    <div style={{
      borderLeft: `4px solid ${T.magentaTintMid}`, paddingLeft: '12px', margin: '14px 0',
    }}>
      <p className="govuk-body-s" style={{ margin: 0 }}>{tension.message}</p>
      <p className="govuk-body-s" style={{ margin: '6px 0 0', color: T.purple25 }}>
        <strong>Ask:</strong> {tension.prompt}
      </p>
    </div>
  )
}

function Branch({ branch, questionsById, answers, set }) {
  return (
    <div style={{ marginTop: '22px' }}>
      <h3 className="govuk-heading-s" style={{ marginBottom: '4px' }}>{branch.label}</h3>
      <p className="govuk-body-s" style={{ color: T.greyText }}>
        <strong>What the sample is for.</strong> {branch.sampleRole}
      </p>
      {/* The agenda above gives a sense of how much is left; this set is not part of the
          agenda, so without a count it reads as an undifferentiated wall. */}
      <p className="govuk-body-s" style={{ color: T.greyText }}>
        {branch.questions.length - branch.unanswered.length} of {branch.questions.length}{' '}
        answered.
      </p>

      <QuestionList ids={branch.questions} questionsById={questionsById} answers={answers} set={set} />

      {branch.tensions.length > 0 && (
        <div style={{ marginTop: '14px' }}>
          <SectionTag>Questions for a statistician</SectionTag>
          <p className="govuk-body-s" style={{ color: T.greyText }}>
            Raised by the answers given. None of them is a verdict on the design, and a
            question whose condition is still unanswered is not raised at all.
          </p>
          {branch.tensions.map(tension => <Tension key={tension.id} tension={tension} />)}
        </div>
      )}

      {branch.tensions.length === 0 && branch.unanswered.length === 0 && (
        <p className="govuk-body-s" style={{ color: T.greyText }}>
          Nothing in these answers raises a question to take further.
        </p>
      )}
    </div>
  )
}

/** What plays the role of N, for the designs still in play. */
function Quantities({ quantities, designs }) {
  return (
    <div style={{ marginTop: '22px' }}>
      <SectionTag>What counts as the sample</SectionTag>
      <p className="govuk-body-s" style={{ color: T.greyText }}>
        Total sample size is frequently the wrong quantity. For the designs still in play:
      </p>
      {/* The engine lists this only for designs it has established as feasible or
          conditional. Saying so is better than an empty space, because the absence is a
          consequence of the ladder not having resolved yet rather than of there being
          nothing to say. */}
      {!quantities.length && (
        <p className="govuk-body-s" style={{ color: T.greyText }}>
          No design has been established as feasible or conditional yet, so there is
          nothing to list. Answer enough of the ladder&rsquo;s questions to settle at least
          one design and this will fill in.
        </p>
      )}
      {quantities.map(q => (
        <div key={q.design} style={{
          borderTop: `1px solid ${T.greyLine}`, paddingTop: '10px', marginBottom: '10px',
        }}>
          <strong style={{ color: T.ink }}>{designs[q.design]?.name ?? q.design}</strong>
          <div className="govuk-body-s" style={{ margin: 0 }}>{q.quantity}</div>
          {q.note && (
            <p className="govuk-body-s" style={{ color: T.greyText, margin: '2px 0 0' }}>{q.note}</p>
          )}
        </div>
      ))}
    </div>
  )
}

export default function StatisticsModule() {
  const { answers, set, result, spec } = useAnswers()
  const statistics = result.statistics
  if (!statistics) return null

  const questionsById = new Map(spec.questions.map(q => [q.id, q]))
  const approaches = statistics.branches.map(b => b.approach)

  return (
    <Card>
      <SectionTag>Statistical feasibility</SectionTag>
      <p className="govuk-body-s" style={{ color: T.greyText }}>
        Sample size does a different job under each approach, so the approach is asked
        first and each gets its own questions. This section produces questions to take to a
        statistician — it never returns a pass or a fail on a number.
      </p>

      <QuestionList
        ids={statistics.sharedQuestions}
        questionsById={questionsById} answers={answers} set={set}
      />

      {statistics.comparison.length > 0 && (
        <div style={{ marginTop: '18px' }}>
          <Alert type="blue" title="While the approach is undecided">
            What each approach would ask of this design. Neither is the safer choice — they
            ask for different things to be established in advance.
          </Alert>
          <Comparison rows={statistics.comparison} />
        </div>
      )}

      {statistics.branches.map(branch => (
        <Branch
          key={branch.approach} branch={branch}
          questionsById={questionsById} answers={answers} set={set}
        />
      ))}

      <Quantities quantities={statistics.designQuantities} designs={result.designs} />

      <ReadyReckoner approaches={approaches} />
    </Card>
  )
}
