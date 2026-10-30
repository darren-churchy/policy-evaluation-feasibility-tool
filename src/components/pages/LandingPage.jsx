// The front door.
//
// It used to offer three question-typing tools as equal cards alongside the assessment,
// and describe the tool as scoring 32 design variants across seven sections — which is no
// longer what it does.
//
// It now asks one consequential question. `claim_type` is a scope gate, not a
// classification: it establishes whether this tool applies at all. Anyone who cannot
// answer it goes to the question-typing tool, which exists to settle exactly that, rather
// than being asked to classify their own question before they have the vocabulary to.
//
// Everything else here is a signpost. The research-question material lives in the project
// guide rather than being duplicated on this page.

import { useNavigate } from 'react-router-dom'
import { useAnswers } from '../../state/AnswersContext.jsx'
import { T } from '../../styles/tokens.js'

const GUIDES = [
  { id: 'project', title: 'The evaluation in brief',
    blurb: 'What is being evaluated, the question it answers and the decision it informs.' },
  { id: 'ideal_trial', title: 'Ideal trial specification',
    blurb: 'The trial you would run if nothing stood in the way — it settles the estimand.' },
  { id: 'causal_diagram', title: 'Causal diagram and adjustment set',
    blurb: 'Which variables cause which, so what to adjust for follows from the structure.' },
  { id: 'data_sources', title: 'Data source inventory',
    blurb: 'What data exists, who holds it, and whether it can be linked.' },
]

function Choice({ title, detail, onClick, primary }) {
  return (
    <button
      onClick={onClick}
      style={{
        display: 'block', width: '100%', textAlign: 'left', cursor: 'pointer',
        font: 'inherit', background: '#fff',
        border: `2px solid ${primary ? T.purple : T.greyLine}`,
        borderLeft: `5px solid ${primary ? T.purple : T.greyLine}`,
        padding: '16px 20px', marginBottom: '12px',
      }}
    >
      <span style={{ display: 'block', fontSize: '17px', fontWeight: 700, color: T.ink, marginBottom: '4px' }}>
        {title}
      </span>
      <span style={{ display: 'block', fontSize: '14px', color: T.greyText, lineHeight: 1.6 }}>
        {detail}
      </span>
    </button>
  )
}

export default function LandingPage() {
  const navigate = useNavigate()
  const { set } = useAnswers()

  const choose = (value, to) => { set('claim_type', value); navigate(to) }

  return (
    <div style={{ minHeight: '100vh', background: T.greyBg }}>

      <div style={{ background: T.purple25, padding: '48px 40px' }}>
        <div style={{ maxWidth: '760px', margin: '0 auto' }}>
          <h1 style={{
            fontSize: 'clamp(28px, 4vw, 44px)', fontWeight: 700, letterSpacing: '-0.5px',
            color: '#fff', lineHeight: 1.15, marginBottom: '16px',
          }}>
            Impact Evaluation<br />
            <span style={{ color: T.purpleTintMid }}>Feasibility Tool</span>
          </h1>
          <p style={{ fontSize: '16px', color: '#d9d2ec', lineHeight: 1.7, marginBottom: '20px' }}>
            Which impact evaluation designs are possible given your constraints, which are
            ruled out and why, and where to put the effort to establish the rest. Designs
            are ranked by the assumption that makes their comparison valid. Nothing is
            scored.
          </p>
          <span style={{
            background: T.purple50, color: '#fff', fontSize: '12px',
            padding: '4px 12px', fontWeight: 600,
          }}>
            Prototype v0.7.1
          </span>
        </div>
      </div>

      <div style={{ maxWidth: '760px', margin: '0 auto', padding: '40px 40px 64px' }}>

        <h2 style={{ fontSize: '22px', fontWeight: 700, color: T.ink, marginBottom: '10px' }}>
          Is your research question a causal one?
        </h2>
        <p style={{ fontSize: '15px', color: T.greyText, lineHeight: 1.7, marginBottom: '20px' }}>
          This tool covers <strong>impact evaluation</strong>: establishing what effect was
          caused by an intervention or policy. That can be approached with counterfactual
          designs or with theory-based ones, and both are covered here. Questions that are
          not causal — what is happening, who is likely to be affected, how delivery worked —
          need different methods and different standards.
        </p>

        <Choice
          primary
          title="Yes — I need to establish what effect an intervention or policy caused"
          detail="Start the assessment. A short screen rules most designs in or out before anything design-specific is asked."
          onClick={() => choose('causal', '/ladder')}
        />
        <Choice
          title="Not sure — help me work out what kind of question this is"
          detail="The question-typing tool walks you to an answer, or lets you browse the whole taxonomy. Come back here once it is settled."
          onClick={() => choose('unsure', '/question-type')}
        />
        <Choice
          title="No — my question is about something else"
          detail="The question-typing tool points to the methods that do address it, rather than leaving you at a dead end."
          onClick={() => choose('other', '/question-type')}
        />

        <h2 style={{ fontSize: '18px', fontWeight: 700, color: T.ink, margin: '40px 0 6px' }}>
          Guides
        </h2>
        <p style={{ fontSize: '14px', color: T.greyText, lineHeight: 1.7, marginBottom: '16px' }}>
          Structured prompts for the work around the assessment. Nothing written in them
          changes which designs are feasible — they are kept with your answers and carried
          into the report.
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(230px, 1fr))', gap: '12px' }}>
          {GUIDES.map(g => (
            <button
              key={g.id}
              onClick={() => navigate(`/guide/${g.id}`)}
              style={{
                textAlign: 'left', cursor: 'pointer', font: 'inherit', background: '#fff',
                border: `1px solid ${T.greyLine}`, borderTop: `3px solid ${T.teal}`,
                padding: '14px 16px',
              }}
            >
              <span style={{ display: 'block', fontSize: '15px', fontWeight: 600, color: T.ink, marginBottom: '4px' }}>
                {g.title}
              </span>
              <span style={{ display: 'block', fontSize: '13px', color: T.greyText, lineHeight: 1.5 }}>
                {g.blurb}
              </span>
            </button>
          ))}
        </div>

        <p style={{ fontSize: '13px', color: T.greyText, lineHeight: 1.7, marginTop: '40px', borderTop: `1px solid ${T.greyLine}`, paddingTop: '14px' }}>
          Answers are held in this browser tab only — nothing is sent anywhere, and nothing
          is stored on this device unless you save a file. This tool should be used to
          inform, not replace, professional methodological judgement.
        </p>

      </div>
    </div>
  )
}
