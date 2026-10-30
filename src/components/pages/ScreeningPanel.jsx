// The screening checkpoint.
//
// A short run of questions that rules most designs in or out, so the tool is useful to
// someone deciding where to put their effort rather than only to someone who has already
// decided everything. The set is derived in the engine, never listed, so a question added
// later that rules out four designs cannot sit outside the screen unnoticed.
//
// What it reports is deliberately not a recommendation. The ladder rules out fast and
// rules in slowly — nine designs of nineteen gone by the ninth answer, none established as
// feasible by the twelfth — so a screen that led on "your design is X" would be silent
// exactly when it is most needed. It leads on what has been settled.

import { useAnswers } from '../../state/AnswersContext.jsx'
import { T } from '../../styles/tokens.js'
import { Card, SectionTag, Button } from '../ui/GovukComponents.jsx'

export default function ScreeningPanel({ onContinue, onDownload }) {
  const { result } = useAnswers()
  const { screening, designs, agenda, readiness } = result

  const done = screening.answered.length
  const total = screening.questions.length
  const pct = Math.round((done / total) * 100)

  const stat = (value, label) => (
    <div style={{ flex: '1 1 130px' }}>
      <div style={{ fontSize: '26px', fontWeight: 700, color: T.ink, lineHeight: 1.1 }}>{value}</div>
      <div style={{ fontSize: '12px', color: T.greyText }}>{label}</div>
    </div>
  )

  return (
    <Card style={{ borderLeft: `5px solid ${screening.complete ? T.green : T.purple}` }}>
      <SectionTag>{screening.complete ? 'Screening complete' : 'Screening'}</SectionTag>

      {!screening.complete && (
        <>
          <p className="govuk-body">
            {done} of {total} screening questions answered. These are the ones that rule
            designs in or out — the rest narrow down what is already available.
          </p>
          <div style={{ background: T.greyBg, height: '8px', marginBottom: '14px' }}>
            <div style={{ background: T.purple, height: '8px', width: `${pct}%` }} />
          </div>
        </>
      )}

      {screening.complete && readiness.status !== 'failed' && (
        <p className="govuk-body">
          Enough is known to say what is ruled out and where the remaining effort should go.
          You can stop here and take this away, or carry on and narrow it further.
        </p>
      )}

      <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', margin: '16px 0' }}>
        {stat(screening.ruledOut.length, 'designs ruled out')}
        {stat(screening.live.length, 'still in play')}
        {stat(
          screening.highestLiveTier !== null ? `Tier ${screening.highestLiveTier}` : '—',
          'highest rung not ruled out',
        )}
        {stat(agenda.length, 'questions outstanding')}
      </div>

      {screening.highestLiveTier !== null && (
        <p className="govuk-body-s" style={{ color: T.greyText }}>
          <strong>Not ruled out is not the same as available.</strong> A design stays in
          play until something rules it out, so the highest rung here is the best that
          remains possible — not one established as feasible. The ladder below says which
          of the two each design is.
        </p>
      )}

      {screening.ruledOut.length > 0 && (
        <p className="govuk-body-s" style={{ color: T.greyText }}>
          <strong>Already ruled out:</strong>{' '}
          {screening.ruledOut.map(id => designs[id]?.name ?? id).join(', ')}.
        </p>
      )}

      {agenda.length > 0 && (
        <p className="govuk-body-s" style={{ color: T.greyText }}>
          <strong>Where effort goes next:</strong>{' '}
          {agenda.slice(0, 3).map(a => a.text).join(' ')}
        </p>
      )}

      {screening.complete && (
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginTop: '14px' }}>
          <Button variant="moj" onClick={onDownload}>↓ Download this as a report</Button>
          {agenda.length > 0 && (
            <Button variant="secondary" onClick={onContinue}>Carry on narrowing it down</Button>
          )}
        </div>
      )}
    </Card>
  )
}
