// The ladder flow — the engine-driven assessment.
//
// Walks down the rungs asking only what each needs, instead of putting every design's
// questions in front of everyone. Lives at /ladder alongside the existing assessment so
// the current tool stays usable while this is reviewed.

import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAnswers, buildSaveFile, parseSaveFile } from '../../state/AnswersContext.jsx'
import { stageLabel, stageGloss } from '../../engine/stage.js'
import { T } from '../../styles/tokens.js'
import {
  PageHeader, Card, SectionTag, Alert, Button, NavButtons, RadioQuestion, TlBadge,
} from '../ui/GovukComponents.jsx'

/** How many questions to reveal at a time. */
const BATCH = 6

const STATE_STYLE = {
  feasible:    { bg: T.greenTint,   fg: T.green,     label: 'Feasible' },
  conditional: { bg: T.purpleTint,  fg: T.purple25,  label: 'Conditional' },
  unknown:     { bg: T.greyBg,      fg: T.greyText,  label: 'Unknown' },
  blocked:     { bg: T.magentaTint, fg: T.magenta25, label: 'Blocked' },
}

function StateTag({ state }) {
  const s = STATE_STYLE[state] ?? STATE_STYLE.unknown
  return (
    <span style={{
      fontSize: '11px', fontWeight: 700, padding: '2px 8px', whiteSpace: 'nowrap',
      background: s.bg, color: s.fg,
    }}>
      {s.label}
    </span>
  )
}

/** Stage, highest feasible rung, open questions. Visible throughout. */
function SummaryPanel({ result }) {
  const { stage, highestFeasibleTier, highestConditionalTier, agenda, readiness } = result

  const rung = highestFeasibleTier !== null
    ? `Tier ${highestFeasibleTier}`
    : highestConditionalTier !== null
      ? `Tier ${highestConditionalTier}, conditionally`
      : 'None yet established'

  const cell = (label, value) => (
    <div style={{ flex: '1 1 170px' }}>
      <div style={{
        fontSize: '11px', letterSpacing: '.08em', textTransform: 'uppercase',
        color: T.greyText, marginBottom: '4px',
      }}>{label}</div>
      <div style={{ fontSize: '15px', fontWeight: 600, color: T.ink }}>{value}</div>
    </div>
  )

  return (
    <div style={{
      background: '#fff', border: `1px solid ${T.greyLine}`, borderLeft: `4px solid ${T.purple}`,
      padding: '14px 18px', marginBottom: '24px',
      display: 'flex', gap: '20px', flexWrap: 'wrap', alignItems: 'flex-start',
    }}>
      {cell('Stage', stage.stages.length
        ? <span style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
            {stage.stages.map(s => <TlBadge key={s} stage={stageLabel(s)} />)}
          </span>
        : 'Not yet established')}
      {cell('Highest rung available', rung)}
      {cell('Questions outstanding', agenda.length)}
      {cell('Readiness', readiness.status === 'passed' ? 'Met'
        : readiness.status === 'failed' ? 'Gate not met' : 'Not yet established')}
    </div>
  )
}

/** One rung of the ladder, with the designs on it. */
function Rung({ rung, isBest }) {
  const anyFeasible = rung.designs.some(d => d.state === 'feasible')

  return (
    <Card style={isBest ? { borderLeft: `5px solid ${T.green}` } : {}}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: '12px', flexWrap: 'wrap', marginBottom: '6px' }}>
        <SectionTag>Tier {rung.tier}</SectionTag>
        <h3 className="govuk-heading-s" style={{ margin: 0 }}>{rung.name}</h3>
        {isBest && <StateTag state="feasible" />}
      </div>
      <p className="govuk-body-s" style={{ color: T.greyText, marginBottom: '14px' }}>
        <strong>Identifying assumption.</strong> {rung.identifyingAssumption}
        {rung.evidenceScales?.maryland && (
          <> · Maryland level {rung.evidenceScales.maryland}</>
        )}
      </p>

      {rung.designs.map(design => (
        <div key={design.id} style={{
          borderTop: `1px solid ${T.greyLine}`, paddingTop: '12px', marginTop: '12px',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
            <div>
              <strong style={{ color: T.ink }}>{design.name}</strong>
              <div className="govuk-body-s" style={{ color: T.greyText, margin: 0 }}>{design.estimand}</div>
            </div>
            <StateTag state={design.state} />
          </div>

          {design.blockers.map(b => (
            <p key={b.id} className="govuk-body-s" style={{ color: T.magenta25, marginTop: '8px', marginBottom: 0 }}>
              <strong>Blocked.</strong> {b.message}
            </p>
          ))}

          {design.conditions.map(c => (
            <div key={c.id} style={{ marginTop: '8px' }}>
              <p className="govuk-body-s" style={{ margin: 0 }}><strong>Condition.</strong> {c.message}</p>
              {c.unlock && (
                <p className="govuk-body-s" style={{ margin: '2px 0 0', color: T.greyText }}>
                  <strong>To discharge:</strong> {c.unlock}
                </p>
              )}
              {c.threshold && (
                <p className="govuk-body-s" style={{ margin: '2px 0 0', color: T.greyText }}>
                  {c.threshold.value}{c.threshold.units ? ` ${c.threshold.units}` : ''}
                  {c.threshold.range && ` (range ${c.threshold.range[0]}–${c.threshold.range[1]})`}
                  {' — '}{c.threshold.basis}{c.threshold.contested && ', contested'}
                </p>
              )}
            </div>
          ))}

          {design.state === 'unknown' && design.unknowns.length > 0 && (
            <p className="govuk-body-s" style={{ color: T.greyText, marginTop: '8px', marginBottom: 0 }}>
              Waiting on: {design.unknowns.join(', ')}
            </p>
          )}

          {anyFeasible && design.warnings.map(w => (
            <p key={w.id} className="govuk-body-s" style={{ color: T.greyText, marginTop: '8px', marginBottom: 0 }}>
              <strong>Note.</strong> {w.message}
            </p>
          ))}
        </div>
      ))}
    </Card>
  )
}

export default function PageLadder() {
  const navigate = useNavigate()
  const { answers, set, clear, replace, result, spec } = useAnswers()
  const [loadWarnings, setLoadWarnings] = useState([])
  const fileInput = useRef(null)

  // Questions leave the agenda the moment they are answered. Removing them from the
  // screen at that moment would make the list jump under the user after every click, so
  // what is displayed accumulates: a question stays visible, showing its answer, until
  // the user starts again.
  const [shown, setShown] = useState([])
  useEffect(() => {
    setShown(prev => {
      const next = [...prev]
      for (const item of result.agenda.slice(0, BATCH)) {
        if (!next.includes(item.id)) next.push(item.id)
      }
      return next.length === prev.length ? prev : next
    })
  }, [result.agenda])

  // Starting again clears the answers, so the displayed set must reset with them.
  function startAgain() {
    clear()
    setShown([])
    setLoadWarnings([])
  }

  const questionsById = new Map(spec.questions.map(q => [q.id, q]))
  const answeredCount = shown.filter(id => answers[id] !== undefined).length
  const { readiness, stage, agenda, recommendation, nextRungUp, theoryBased, ladder } = result

  function save() {
    const file = buildSaveFile(answers, spec.tiers.spec_version)
    const blob = new Blob([JSON.stringify(file, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'evaluation-feasibility-answers.json'
    a.click()
    URL.revokeObjectURL(url)
  }

  function load(event) {
    const file = event.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      const { answers: loaded, warnings } = parseSaveFile(
        String(reader.result), spec.tiers.spec_version, new Set(questionsById.keys()),
      )
      setLoadWarnings(warnings)
      if (loaded) replace(loaded)
    }
    reader.readAsText(file)
    event.target.value = ''
  }

  return (
    <div>
      <PageHeader title="Evaluation design feasibility" />
      <div className="page-content">

        <SummaryPanel result={result} />

        {loadWarnings.map((w, i) => <Alert key={i} type="yellow" title="On loading">{w}</Alert>)}

        {/* Readiness gates come before any design is considered. */}
        {readiness.status === 'failed' && (
          <Card style={{ borderLeft: `5px solid ${T.magenta}` }}>
            <SectionTag>Not ready for impact evaluation</SectionTag>
            {readiness.gates.map(gate => (
              <div key={gate.id} style={{ marginBottom: '14px' }}>
                <p className="govuk-body" style={{ marginBottom: '4px' }}>{gate.message}</p>
                <p className="govuk-body-s" style={{ color: T.greyText, margin: 0 }}>
                  <strong>Instead:</strong> {gate.redirect}
                </p>
              </div>
            ))}
            <Alert type="blue">
              No data situation resolves this, so no design is recommended. The stage
              inferred is {stage.stages.map(stageLabel).join(' and ') || 'not yet established'}.
            </Alert>
          </Card>
        )}

        {readiness.warnings.map(w => (
          <Alert key={w.id} type="yellow" title="Worth weighing">
            {w.message} <strong>Consider:</strong> {w.redirect}
          </Alert>
        ))}

        {/* The question agenda — only what could change a verdict. */}
        {agenda.length > 0 && (
          <Card>
            <SectionTag>Next questions</SectionTag>
            <p className="govuk-body-s" style={{ color: T.greyText }}>
              Only questions whose answer could change a verdict are shown, highest rung
              first. {answeredCount} answered, {agenda.length} still outstanding.
            </p>
            {shown.map(id => {
              const question = questionsById.get(id)
              if (!question) return null
              return (
                <RadioQuestion
                  key={id}
                  id={id}
                  label={question.text}
                  hint={question.hint}
                  value={answers[id]}
                  onChange={v => set(id, v)}
                  options={question.options}
                />
              )
            })}
            {agenda.length > shown.filter(id => answers[id] === undefined).length && (
              <Button
                variant="secondary"
                onClick={() => setShown(prev => [
                  ...prev,
                  ...agenda.map(a => a.id).filter(id => !prev.includes(id)).slice(0, BATCH),
                ])}
              >
                Show more questions
              </Button>
            )}
          </Card>
        )}

        {agenda.length === 0 && readiness.status !== 'failed' && (
          <Alert type="blue" title="Nothing further to ask">
            Every question that could change a verdict has been answered.
          </Alert>
        )}

        {/* The recommendation. */}
        {recommendation && (
          <Alert type="blue" title={`Highest feasible rung: Tier ${recommendation.tier}`}>
            {recommendation.designs
              .map(id => result.designs[id].name)
              .join(', ')}
            {' — feasible on the answers given. Conditions and notes are listed below.'}
          </Alert>
        )}

        {nextRungUp && (
          <Alert type="yellow" title={`A higher rung may be reachable: Tier ${nextRungUp.tier}`}>
            <p style={{ marginBottom: nextRungUp.unlocks.length ? '8px' : 0 }}>
              <strong>{nextRungUp.name}</strong> is conditional rather than blocked.
            </p>
            {nextRungUp.unlocks.map(u => <p key={u.condition} style={{ margin: '0 0 4px' }}>{u.unlock}</p>)}
          </Alert>
        )}

        {/* The ladder itself, highest rung first. */}
        <h2 className="govuk-heading-m" style={{ marginTop: '28px' }}>The ladder</h2>
        <p className="govuk-body-s" style={{ color: T.greyText }}>
          Designs are ranked by the assumption that makes their comparison valid, not by how
          sophisticated the estimator is. Nothing here is scored.
        </p>
        {ladder.map(rung => (
          <Rung key={rung.tier} rung={rung} isBest={rung.tier === recommendation?.tier} />
        ))}

        {/* The theory-based strand, beside the ladder rather than on it. */}
        <Card style={{ borderLeft: `5px solid ${T.teal}` }}>
          <SectionTag>Theory-based strand</SectionTag>
          <p className="govuk-body">
            <strong style={{ textTransform: 'capitalize' }}>{theoryBased.role}</strong>
            {theoryBased.candidate && ' — worth considering as the primary approach'}
          </p>
          {theoryBased.reasons.map((reason, i) => (
            <p key={i} className="govuk-body-s" style={{ color: T.greyText }}>{reason}</p>
          ))}
          <p className="govuk-body-s" style={{ color: T.greyText, marginBottom: 0 }}>
            {result.theoryBasedDesigns.map(id => result.designs[id].name).join(' · ')}
          </p>
        </Card>

        {stage.stages.length > 0 && (
          <Alert type="blue" title="Test and Learn stage">
            <p style={{ marginBottom: '6px' }}>{stage.note}</p>
            {stage.stages.map(s => (
              <p key={s} className="govuk-body-s" style={{ margin: '0 0 2px' }}>
                <strong>{stageLabel(s)}</strong> — {stageGloss(s)}
              </p>
            ))}
          </Alert>
        )}

        <NavButtons>
          <Button variant="moj" onClick={save}>↓ Save answers</Button>
          <Button variant="secondary" onClick={() => fileInput.current?.click()}>↑ Load answers</Button>
          <Button variant="secondary" onClick={startAgain}>Start again</Button>
          <Button variant="secondary" onClick={() => navigate('/')}>← Home</Button>
        </NavButtons>

        <input
          ref={fileInput} type="file" accept="application/json"
          onChange={load} style={{ display: 'none' }}
          aria-hidden="true" tabIndex={-1}
        />

        <p className="govuk-body-s" style={{ color: T.greyText, borderTop: `1px solid ${T.greyLine}`, paddingTop: '12px' }}>
          Specification version {spec.tiers.spec_version}. Answers are held in this browser
          tab only — nothing is sent anywhere, and nothing is stored on this device unless
          you save a file.
        </p>
      </div>
    </div>
  )
}
