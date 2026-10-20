// The ready-reckoner panel.
//
// Opt-in, collapsed by default, and explicitly illustrative — the three things
// `spec/statistics.yaml` asks of it.
//
// Its own numeric inputs are held in local state and are deliberately NOT written to the
// answer store. The store is what the engine reads, so a sample size typed in here cannot
// reach a verdict even in principle. It reads the three answers the specification lists as
// its inputs, and nothing else.

import { useState } from 'react'
import { useAnswers } from '../../state/AnswersContext.jsx'
import { reckonNhst, reckonBayesian } from './readyReckoner.js'
import { T } from '../../styles/tokens.js'
import { Alert, Label, Hint, NumberInput } from '../ui/GovukComponents.jsx'

const MODE = {
  nhst: { label: 'Frequentist', reckon: reckonNhst },
  bayesian: { label: 'Bayesian', reckon: reckonBayesian },
}

function Field({ id, label, hint, value, onChange, width = 10 }) {
  return (
    <div className="govuk-form-group" style={{ marginBottom: '14px' }}>
      <Label htmlFor={id}>{label}</Label>
      {hint && <Hint>{hint}</Hint>}
      <NumberInput id={id} value={value} onChange={onChange} width={width} />
    </div>
  )
}

function Result({ result }) {
  if (!result) return null

  if (result.unavailable) {
    return <Alert type="yellow" title="No figure for this outcome type">{result.unavailable}</Alert>
  }

  return (
    <div style={{ marginTop: '16px' }}>
      {result.figures.map(figure => (
        <div key={figure.label} style={{
          borderTop: `1px solid ${T.greyLine}`, paddingTop: '10px', marginBottom: '10px',
        }}>
          <div style={{
            fontSize: '11px', letterSpacing: '.08em', textTransform: 'uppercase',
            color: T.greyText, marginBottom: '2px',
          }}>{figure.label}</div>
          <div style={{ fontSize: '22px', fontWeight: 700, color: T.ink }}>{figure.value}</div>
          <p className="govuk-body-s" style={{ color: T.greyText, margin: '2px 0 0' }}>{figure.note}</p>
        </div>
      ))}

      <details className="govuk-details" style={{ marginTop: '6px', marginBottom: 0 }}>
        <summary className="govuk-details__summary">
          <span className="govuk-details__summary-text">What this assumes</span>
        </summary>
        <div className="govuk-details__text">
          <ul className="govuk-list govuk-list--bullet govuk-body-s" style={{ marginBottom: 0 }}>
            {result.assumptions.map((line, i) => <li key={i}>{line}</li>)}
          </ul>
        </div>
      </details>
    </div>
  )
}

/**
 * @param {string[]} approaches  which modes to offer — derived from the chosen approach,
 *                               so a frequentist study is not asked for a prior.
 */
export default function ReadyReckoner({ approaches }) {
  const { answers, spec } = useAnswers()
  const reckoner = spec.statistics?.ready_reckoner
  const [inputs, setInputs] = useState({ n: '', baseline: '', icc: '', clusterSize: '', priorEss: '' })

  if (!reckoner || !approaches.length) return null

  // Named `update`, not `set`, so it can never be confused with the answer-store setter of
  // that name — and so the guard test asserting this panel never calls `set(` means what
  // it says.
  const update = key => value => setInputs(prev => ({ ...prev, [key]: value }))

  const outcomeType = answers.outcome_type
  const clustered = answers.outcome_clustered === 'yes'
  const shared = {
    n: inputs.n,
    attritionBand: answers.expected_attrition,
    outcomeType,
    baseline: inputs.baseline,
    clustered,
    icc: inputs.icc,
    clusterSize: inputs.clusterSize,
  }

  // The modes the specification declares, narrowed to the approach actually chosen.
  const modes = (reckoner.modes ?? []).filter(m => approaches.includes(m.approach))

  return (
    <details className="govuk-details" style={{ marginTop: '20px' }}>
      <summary className="govuk-details__summary">
        <span className="govuk-details__summary-text">
          Ready-reckoner — a rough figure to take into the conversation
        </span>
      </summary>
      <div className="govuk-details__text">

        <Alert type="yellow" title="Illustrative only">{reckoner.note}</Alert>

        {!outcomeType && (
          <p className="govuk-body-s" style={{ color: T.greyText }}>
            Answer <strong>what kind of outcome you are measuring</strong> above and the
            reckoner will work from it.
          </p>
        )}

        {outcomeType && (
          <>
            <Field
              id="rr-n"
              label="How many units will be in the analysis, across both arms?"
              hint="People, cases or sites — whichever the comparison is between."
              value={inputs.n} onChange={update('n')}
            />

            {(outcomeType === 'binary' || outcomeType === 'count') && (
              <Field
                id="rr-baseline"
                label={outcomeType === 'binary'
                  ? 'What proportion would you expect in the comparison group?'
                  : 'What average count would you expect in the comparison group?'}
                hint={outcomeType === 'binary'
                  ? 'As a proportion between 0 and 1 — 0.3 for 30%.'
                  : 'Per unit, over the follow-up period.'}
                value={inputs.baseline} onChange={update('baseline')}
              />
            )}

            {clustered && (
              <>
                <Field
                  id="rr-cluster-size"
                  label="How many units in an average cluster?"
                  hint="People per site, per practitioner or per caseload."
                  value={inputs.clusterSize} onChange={update('clusterSize')}
                />
                <Field
                  id="rr-icc"
                  label="Intracluster correlation"
                  hint="Between 0 and 1. If it has not been estimated, 0.05 is a common placeholder for service outcomes — and the figure is sensitive to it, so it is worth estimating."
                  value={inputs.icc} onChange={update('icc')}
                />
              </>
            )}

            {approaches.includes('bayesian') && (
              <Field
                id="rr-prior-ess"
                label="How many observations is the prior worth?"
                hint="Its effective sample size. If the prior came from a trial of 200 people you would broadly trust here, 200. If it is weakly informative, a small number or zero."
                value={inputs.priorEss} onChange={update('priorEss')}
              />
            )}

            {modes.map(mode => {
              const result = MODE[mode.approach]?.reckon({ ...shared, priorEss: inputs.priorEss })
              return (
                <div key={mode.approach} style={{
                  background: T.greyBg, padding: '14px 16px', marginTop: '16px',
                }}>
                  <h4 className="govuk-heading-s" style={{ marginBottom: '4px' }}>
                    {MODE[mode.approach]?.label ?? mode.approach}
                  </h4>
                  <p className="govuk-body-s" style={{ color: T.greyText, marginBottom: 0 }}>
                    {mode.outputs}
                  </p>
                  {result
                    ? <Result result={result} />
                    : <p className="govuk-body-s" style={{ color: T.greyText, marginTop: '10px', marginBottom: 0 }}>
                        Fill in the fields above to see a figure.
                      </p>}
                </div>
              )
            })}
          </>
        )}
      </div>
    </details>
  )
}
