import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { QUESTIONS, FAMILIES, BAYES_BULLETS } from '../../../data/designFinderData.js'

const MOJ = '#9C1B6D'
const MOJ_DK = '#6b1249'
const MOJ_LT = '#f5e8f1'
const GREEN = '#00703C'
const GREEN_LT = '#e3f3eb'
const RED = '#D4351C'
const ORANGE = '#F47738'
const ORANGE_LT = '#fef3e8'
const PURPLE = '#4C2C92'
const PURPLE_LT = '#f0ebfa'
const DARK = '#0B0C0C'
const GREY_1 = '#F3F2F1'
const GREY_2 = '#E8E8E8'
const GREY_3 = '#B1B4B6'
const GREY_4 = '#6F777B'

const TL_STYLES = {
  Test: { background: '#f5eaf8', color: '#5a1a6a' },
  Grow: { background: '#fef0e0', color: '#6a3a1a' },
  Explore: { background: '#e8f4e8', color: '#1a5a2a' },
  'Co-design': { background: '#e8eef8', color: '#1a3a6a' },
}

function TlBadge({ stage, cls }) {
  const s = TL_STYLES[stage] || {}
  return (
    <span style={{ fontSize: '11px', fontWeight: 700, padding: '2px 8px', borderRadius: '2px', fontFamily: "'DM Sans', system-ui, sans-serif", ...s }}>
      {stage}
    </span>
  )
}

function inferTLStage(a) {
  if (a.q_scale === 'yes' && a.q_defined === 'yes' && a.q_toc === 'yes') {
    return {
      stages: ['Test', 'Grow'],
      note: 'Your intervention is well-defined, has a theory of change, and is running at scale. Both <strong>Test</strong> and <strong>Grow</strong> stage evaluations are appropriate — the distinction is whether you are still refining the programme model (Test) or evaluating a stable programme at full scale (Grow). Most impact evaluation designs apply at both stages.'
    }
  }
  return {
    stages: ['Test'],
    note: 'Your intervention is still developing or partially scaled. A <strong>Test</strong> stage evaluation is most appropriate — testing whether specific components or mechanisms work. Consider whether a targeted mechanism test or pilot evaluation is preferable to a full impact evaluation while delivery is still stabilising.'
  }
}

function gateFailures(a) {
  const f = []
  if (a.q_defined === 'no') f.push({ id: 'q_defined', label: 'Intervention definition', stage: 'Co-design', stageBadge: 'Co-design', reason: 'The intervention is not yet clearly defined or documented. Without a specification of what the intervention consists of, it is not possible to attribute any observed effects to the intervention rather than to variation in delivery.', action: 'Document what the intervention consists of, who delivers it, and at what intensity. Consider a <strong>process evaluation</strong> to describe and standardise delivery before testing impact.' })
  if (a.q_toc === 'no') f.push({ id: 'q_toc', label: 'Theory of change', stage: 'Co-design', stageBadge: 'Co-design', reason: 'No theory of change or logic model exists. Without a causal model linking the intervention to expected outcomes, it is unclear what the evaluation should measure or how to interpret findings.', action: 'Develop a logic model or theory of change with delivery staff and stakeholders. A <strong>developmental evaluation</strong> can support this in real time.' })
  if (a.q_scale === 'no') f.push({ id: 'q_scale', label: 'Maturity and scale', stage: 'Explore', stageBadge: 'Explore', reason: 'The intervention is not yet at sufficient scale or maturity. Evaluating impact now risks findings that reflect the immaturity of the intervention rather than its true effectiveness.', action: 'Consider a <strong>process evaluation</strong> or <strong>developmental evaluation</strong> to document and improve delivery before attempting impact evaluation.' })
  return f
}

function getNextQuestion(from, answers) {
  for (let i = from; i < QUESTIONS.length; i++) {
    if (!QUESTIONS[i].skipIf || !QUESTIONS[i].skipIf(answers)) return i
  }
  return null
}

function countVisible(answers) {
  let n = 0
  for (let i = 0; i < QUESTIONS.length; i++) {
    if (!QUESTIONS[i].skipIf || !QUESTIONS[i].skipIf(answers)) n++
  }
  return n
}

function getRationale(key, a) {
  const r = {
    rct: a.q_randomisation === 'none'
      ? 'Your answers suggest no significant barriers to randomisation. RCTs provide the strongest causal evidence and should be the first option to explore seriously before committing to an observational design.'
      : a.q_randomisation === 'high'
      ? 'Significant barriers to randomisation exist. However, design adaptations — stepped-wedge, waitlist, or encouragement designs — address many common ethical and logistical concerns while preserving much of the rigour of a randomised approach.'
      : 'Some barriers to randomisation exist, but design adaptations (stepped-wedge, waitlist, encouragement) may make an RCT feasible while addressing the concerns identified.',
    did: a.q_predata === 'many' && a.q_comparison === 'yes'
      ? 'A strong pre-intervention series and a plausible comparison group are both available — a solid foundation for DiD. The parallel trends assumption will need careful testing across all available pre-periods.'
      : 'Pre-intervention data and a comparison group are available. DiD is feasible but the shorter pre-period or less certain comparison group means you will have limited ability to test identification assumptions.',
    synth: a.q_predata === 'many'
      ? 'A long pre-intervention series gives the synthetic control room to achieve a good pre-period fit. Particularly valuable if you have a single treated unit (one institution, region, or policy area).'
      : 'Some pre-intervention data is available. Synthetic control is feasible but a shorter pre-period limits match quality — an augmented synthetic control (ASC) may improve fit.',
    rd: a.q_threshold === 'yes'
      ? 'A clear assignment threshold exists — this is a strong candidate for RD. Regression discontinuity has high internal validity near the cutoff and requires neither randomisation nor a comparison group.'
      : 'A possible threshold has been identified. Further investigation is needed to confirm whether it meets the requirements for a credible RD design.',
    iv: 'A potential instrument has been identified. IV designs can recover causal estimates from observational data, but the validity of the exclusion restriction — that the instrument affects outcomes only through treatment — must be argued on substantive grounds.',
    its: a.q_predata === 'many'
      ? 'A strong pre-intervention time series is available. ITS models the pre-intervention trend and tests for changes in level or slope at the intervention date. Adding a control series substantially strengthens the design.'
      : 'Some pre-intervention data is available. ITS is feasible but the shorter pre-period limits trend estimation precision. Aim for at least 8 pre-intervention time points if possible.',
    matching: a.q_covariates === 'yes'
      ? 'Rich covariate data is available on both treated and untreated groups. Matching and weighting methods can construct a comparison group from observational data — validity rests on the unconfoundedness assumption.'
      : 'Partial covariate data is available. Matching is feasible but unmeasured confounding is a concern. Plan sensitivity analyses to characterise the potential impact.',
    theory: 'Theory-based methods do not require a counterfactual and make fewer data demands. Most appropriate when understanding causal mechanisms is as important as estimating an average effect, or when other quantitative methods are not feasible.',
  }
  return r[key] || ''
}

function buildConstraintNote(c, s) {
  const msgs = {
    time: { icon: '⏱', title: 'Constraint: Time', body: 'Designs with shorter lead times have been prioritised. ITS and observational designs using existing administrative data can typically be implemented faster than prospective experimental designs.' },
    data: { icon: '📋', title: 'Constraint: Data availability', body: 'Designs with lower data demands have been prioritised. Theory-based approaches and simpler observational designs are highlighted where data access is limited.' },
    budget: { icon: '💷', title: 'Constraint: Resources', body: 'Lower-cost designs using existing administrative data have been prioritised over designs requiring primary data collection or large-scale fieldwork.' },
    ethics: { icon: '⚖', title: 'Constraint: Ethical concerns', body: 'Designs where all participants eventually receive the intervention (stepped-wedge, waitlist) or where treatment is not withheld have been given higher priority.' },
  }
  const sn = s === 'small' ? '<br><br><strong>Small sample note:</strong> RCT remains the priority design where feasible. A formal power calculation is essential. Cluster RCT variants are unlikely to be viable with fewer than 100 units. See the Bayesian consideration panel below.' : ''
  if (!msgs[c] && !sn) return null
  const m = msgs[c]
  return { icon: m ? m.icon : '📋', title: m ? m.title : '', body: m ? m.body + sn : sn }
}

function buildWarnings(a) {
  const w = []
  if (a.q_defined === 'partial') w.push('Your intervention definition is still being developed. Incomplete documentation weakens your ability to interpret findings and attribute effects. Aim to finalise this before the evaluation begins.')
  if (a.q_toc === 'partial') w.push('Your theory of change is in development. Finalising it before analysis will help you specify the right outcomes and interpret findings within the expected causal pathway.')
  if (a.q_scale === 'partial') w.push('The intervention is not yet fully at scale. Consider whether a targeted mechanism test is preferable to a full impact evaluation at this stage, or whether the design should explicitly account for implementation variation.')
  if (a.q_covariates === 'partial' && !a.q_threshold && !a.q_instrument) w.push('Covariate data gaps exist. Document which confounders are unmeasured and plan sensitivity analyses to characterise the potential impact on your conclusions.')
  return w
}

const PRIORITY_LABEL = { 1: 'Investigate first', 2: 'Worth exploring', 3: 'Consider if others are not feasible' }
const PRIORITY_COLORS = {
  1: { border: GREEN, badge_bg: GREEN_LT, badge_fg: GREEN },
  2: { border: '#1D70B8', badge_bg: '#e8f0fb', badge_fg: '#1D70B8' },
  3: { border: ORANGE, badge_bg: ORANGE_LT, badge_fg: '#b35900' },
}

export default function PageDesignFinder() {
  const navigate = useNavigate()
  const [phase, setPhase] = useState('intro')
  const [answers, setAnswers] = useState({})
  const [history, setHistory] = useState([])
  const [currentQ, setCurrentQ] = useState(0)
  const [selected, setSelected] = useState(null)

  function startQuiz() {
    const first = getNextQuestion(0, {})
    setCurrentQ(first ?? 0)
    setSelected(null)
    setPhase('quiz')
  }

  function selectOption(value) {
    setSelected(value)
  }

  function goNext() {
    if (selected == null) return
    const q = QUESTIONS[currentQ]
    const newAnswers = { ...answers, [q.id]: selected }
    setAnswers(newAnswers)
    setHistory([...history, currentQ])
    const next = getNextQuestion(currentQ + 1, newAnswers)
    if (next !== null) {
      setCurrentQ(next)
      setSelected(newAnswers[QUESTIONS[next].id] ?? null)
    } else {
      setPhase('result')
    }
  }

  function goBack() {
    if (!history.length) return
    const prev = history[history.length - 1]
    setHistory(history.slice(0, -1))
    setCurrentQ(prev)
    setSelected(answers[QUESTIONS[prev].id] ?? null)
  }

  function restart() {
    setAnswers({})
    setHistory([])
    setCurrentQ(0)
    setSelected(null)
    setPhase('intro')
  }

  const q = QUESTIONS[currentQ]
  const total = countVisible(answers)
  const pos = history.length + 1
  const pct = Math.round((pos / (total + 1)) * 100)

  const TAGS = ['Intervention readiness', 'Evaluation timing', 'Randomisation', 'Data availability', 'Design-specific', 'Statistical feasibility', 'Primary constraint']
  const seenTags = new Set(history.map(i => QUESTIONS[i].tag))

  // Build result
  function buildResult() {
    const a = answers
    const failures = gateFailures(a)
    if (failures.length > 0) return { type: 'notready', failures }

    const removed = {}, included = {}
    if (a.q_prospective === 'no') { removed.rct = 'Prospective evaluation not possible' }
    else {
      if (a.q_randomisation === 'none') included.rct = 1
      else if (a.q_randomisation === 'partial') included.rct = 2
      else if (a.q_randomisation === 'high') included.rct = 3
      else included.rct = 2
    }
    if (a.q_predata === 'none') { removed.did = 'No pre-intervention data available' }
    else if (a.q_comparison === 'no') { removed.did = 'No plausible comparison group' }
    else {
      included.did = (a.q_predata === 'many' && a.q_comparison === 'yes') ? 1 : 2
      if ((a.q_stagger === 'yes' || a.q_stagger === 'planned') && included.did > 1) included.did = 1
    }
    if (a.q_predata === 'none') { removed.synth = 'No pre-intervention data available' }
    else if (a.q_comparison === 'no') { removed.synth = 'No comparable donor pool available' }
    else { included.synth = a.q_predata === 'many' ? 2 : 3 }
    if (a.q_threshold === 'no') { removed.rd = 'No assignment threshold or cutoff identified' }
    else { included.rd = a.q_threshold === 'yes' ? 1 : 2 }
    if (a.q_instrument === 'no') { removed.iv = 'No plausible instrument identified' }
    else { included.iv = a.q_instrument === 'yes' ? 2 : 3 }
    if (a.q_predata === 'none') { removed.its = 'No pre-intervention data available' }
    else { included.its = a.q_predata === 'many' ? 1 : 2 }
    if (a.q_covariates === 'no') { removed.matching = 'Insufficient covariate data' }
    else { included.matching = a.q_covariates === 'yes' ? 2 : 3 }

    const sq = Object.values(included).filter(v => v === 1).length
    included.theory = sq >= 2 ? 3 : (Object.keys(included).length === 0 ? 1 : 3)

    if (a.q_constraint === 'time') {
      if (included.its !== undefined) included.its = Math.max(1, included.its - 1)
      if (included.theory !== undefined) included.theory = Math.max(2, included.theory - 1)
    }
    if (a.q_constraint === 'data') {
      if (included.theory !== undefined) included.theory = Math.max(2, included.theory - 1)
      if (included.matching !== undefined) included.matching = Math.min(3, included.matching + 1)
    }
    if (a.q_constraint === 'budget') {
      if (included.its !== undefined) included.its = Math.max(1, included.its - 1)
      if (included.matching !== undefined) included.matching = Math.max(2, included.matching - 1)
    }
    if (a.q_constraint === 'ethics') {
      if (included.rct !== undefined) included.rct = Math.max(1, included.rct - 1)
    }
    if (a.q_sample === 'tiny') {
      if (included.rct !== undefined) included.rct = 3
      if (included.matching !== undefined) included.matching = 3
      if (included.did !== undefined) included.did = Math.min(3, included.did + 1)
      included.theory = 1
    } else if (a.q_sample === 'small') {
      if (included.rct !== undefined && included.rct === 1) included.rct = 2
    }

    const sorted = Object.entries(included).sort((a, b) => a[1] - b[1])
    const showBayes = a.q_sample === 'tiny' || a.q_sample === 'small'
    const tlInfo = inferTLStage(a)
    const constraintInfo = buildConstraintNote(a.q_constraint, a.q_sample)
    const warnings = buildWarnings(a)

    return { type: 'ready', sorted, removed, showBayes, tlInfo, constraintInfo, warnings }
  }

  const result = phase === 'result' ? buildResult() : null

  const QLAB = { q_defined:'Intervention clearly defined?', q_toc:'Theory of change exists?', q_scale:'Sufficient scale / maturity?', q_prospective:'Prospective evaluation possible?', q_randomisation:'Barriers to randomisation?', q_predata:'Pre-intervention data available?', q_comparison:'Comparison group available?', q_stagger:'Staggered rollout?', q_threshold:'Assignment threshold or cutoff?', q_instrument:'Plausible instrument available?', q_covariates:'Rich covariate data available?', q_sample:'Approximate study size?', q_constraint:'Primary constraint?' }

  return (
    <div style={{ background: GREY_1, minHeight: '100%', fontFamily: "'DM Sans', system-ui, sans-serif" }}>

      {/* ── INTRO ── */}
      {phase === 'intro' && (
        <div style={{ width: '100%', maxWidth: '680px', margin: '0 auto', padding: '40px 16px 64px' }}>
          <div style={{ fontSize: '11px', fontWeight: 600, color: MOJ, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '12px' }}>
            Evaluation Design Finder
          </div>
          <h1 style={{ fontFamily: "'DM Serif Display', Georgia, serif", fontSize: 'clamp(28px, 5vw, 40px)', lineHeight: 1.15, color: DARK, marginBottom: '20px' }}>
            Find the right <em style={{ fontStyle: 'italic', color: MOJ }}>evaluation design</em> for your study
          </h1>
          <div style={{ width: '48px', height: '3px', background: MOJ, marginBottom: '24px' }} />
          <p style={{ fontSize: '16px', color: GREY_4, lineHeight: 1.7, marginBottom: '20px' }}>
            Answer 10–12 questions about your intervention, data, and context. In about 3 minutes you'll receive a shortlist of the most promising evaluation design families to explore — along with the key questions to investigate before committing to a design.
          </p>
          <div style={{ background: '#fff', border: `1px solid ${GREY_2}`, borderLeft: `4px solid #1D70B8`, padding: '14px 18px', marginBottom: '28px', fontSize: '13px', color: GREY_4, lineHeight: 1.6 }}>
            <strong style={{ color: DARK }}>Where this tool fits.</strong> This tool is for impact evaluation — causal questions about whether an intervention works. It is most appropriate at the <strong>Test</strong> or <strong>Grow</strong> stages of the Magenta Book Test and Learn cycle, once your intervention is defined, has a theory of change, and is running at sufficient scale.
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '8px', alignItems: 'center' }}>
              <span style={{ fontSize: '12px', color: GREY_4 }}>T&amp;L stages covered:&nbsp;</span>
              <TlBadge stage="Test" /><TlBadge stage="Grow" />
            </div>
            <div style={{ marginTop: '8px', fontSize: '12px', color: GREY_4 }}>At the <strong>Explore</strong> or <strong>Co-design</strong> stage, start with the <em>Research Question Framework</em> or the decision trees to clarify your question type before selecting a design.</div>
          </div>
          <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', marginBottom: '36px' }}>
            {['10–12 questions','~3 minutes','No login required'].map(item => (
              <div key={item} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: GREY_4 }}>
                <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: MOJ, flexShrink: 0, display: 'inline-block' }} />
                {item}
              </div>
            ))}
          </div>
          <button
            onClick={startQuiz}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '10px', background: MOJ, color: '#fff', border: 'none', padding: '14px 28px', fontFamily: "'DM Sans', system-ui, sans-serif", fontSize: '16px', fontWeight: 600, cursor: 'pointer' }}
          >
            Start →
          </button>
          <p style={{ marginTop: '16px', fontSize: '13px', color: GREY_4 }}>
            Already know your design family?{' '}
            <button onClick={() => navigate('/research-question')} style={{ background: 'none', border: 'none', color: '#1D70B8', cursor: 'pointer', fontFamily: 'inherit', fontSize: '13px', padding: 0, textDecoration: 'underline' }}>
              Use the full feasibility tool
            </button>{' '}
            for a detailed scored assessment of all 32 design variants.
          </p>
        </div>
      )}

      {/* ── QUIZ ── */}
      {phase === 'quiz' && q && (
        <div style={{ width: '100%', maxWidth: '680px', margin: '0 auto', padding: '40px 16px 64px' }}>
          <div style={{ marginBottom: '28px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <span style={{ fontSize: '12px', color: GREY_4, fontWeight: 500 }}>Question {pos}</span>
              <span style={{ fontSize: '13px', fontWeight: 700, color: MOJ }}>{pos} of ~{total}</span>
            </div>
            <div style={{ height: '3px', background: GREY_2, borderRadius: '2px' }}>
              <div style={{ height: '100%', background: MOJ, borderRadius: '2px', width: pct + '%', transition: 'width 0.4s' }} />
            </div>
          </div>

          {/* Breadcrumb */}
          <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', marginBottom: '24px', alignItems: 'center' }}>
            {TAGS.filter(t => seenTags.has(t) || t === q.tag).map(t => (
              <div key={t} style={{ fontSize: '11px', color: t === q.tag ? DARK : GREY_4, fontWeight: t === q.tag ? 600 : 400, display: 'flex', alignItems: 'center', gap: '4px' }}>
                {t}{t !== TAGS[TAGS.length - 1] && <span style={{ color: GREY_3, fontSize: '10px', marginLeft: '4px' }}>→</span>}
              </div>
            ))}
          </div>

          <div style={{ background: '#fff', borderTop: `4px solid ${MOJ}`, padding: '32px 36px', marginBottom: '20px', boxShadow: '0 1px 4px rgba(0,0,0,.07)' }}>
            {q.isGate && (
              <div style={{ fontSize: '11px', fontWeight: 700, color: RED, textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                ⚠ Gate condition
              </div>
            )}
            <div style={{ fontSize: '11px', fontWeight: 600, color: MOJ, textTransform: 'uppercase', letterSpacing: '.8px', marginBottom: '10px' }}>{q.tag}</div>
            <h2 style={{ fontFamily: "'DM Serif Display', Georgia, serif", fontSize: 'clamp(18px, 3vw, 24px)', lineHeight: 1.3, color: DARK, marginBottom: '10px' }}>{q.heading}</h2>
            <div style={{ fontSize: '14px', color: GREY_4, lineHeight: 1.6, marginBottom: '28px', paddingLeft: '14px', borderLeft: `3px solid ${GREY_2}` }}>{q.hint}</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {q.options.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => selectOption(opt.value)}
                  style={{
                    display: 'flex', alignItems: 'flex-start', gap: '14px',
                    background: selected === opt.value ? MOJ_LT : '#fff',
                    border: `2px solid ${selected === opt.value ? MOJ : GREY_2}`,
                    padding: '15px 18px', cursor: 'pointer',
                    fontFamily: "'DM Sans', system-ui, sans-serif", width: '100%', textAlign: 'left',
                  }}
                >
                  <div style={{
                    width: '22px', height: '22px', borderRadius: '50%',
                    border: `2px solid ${selected === opt.value ? MOJ : GREY_3}`,
                    background: selected === opt.value ? MOJ : 'transparent',
                    flexShrink: 0, marginTop: '1px',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    {selected === opt.value && (
                      <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                        <path d="M1 4l3 3 5-6" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    )}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '15px', fontWeight: 600, color: DARK, marginBottom: '2px' }}>{opt.label}</div>
                    {opt.desc && <div style={{ fontSize: '13px', color: GREY_4, lineHeight: 1.5 }}>{opt.desc}</div>}
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px' }}>
            <button
              onClick={goBack}
              disabled={!history.length}
              style={{ background: 'none', border: 'none', fontFamily: 'inherit', fontSize: '14px', color: GREY_4, cursor: history.length ? 'pointer' : 'default', display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 0', opacity: history.length ? 1 : 0.3 }}
            >
              ← Back
            </button>
            <button
              onClick={goNext}
              disabled={selected == null}
              style={{
                background: selected != null ? DARK : GREY_3,
                color: '#fff', border: 'none',
                fontFamily: 'inherit', fontSize: '15px', fontWeight: 600,
                padding: '11px 26px', cursor: selected != null ? 'pointer' : 'not-allowed',
              }}
            >
              {getNextQuestion(currentQ + 1, { ...answers, [q.id]: selected ?? '' }) === null ? 'See results →' : 'Next →'}
            </button>
          </div>
        </div>
      )}

      {/* ── RESULT ── */}
      {phase === 'result' && result && result.type === 'notready' && (
        <div style={{ width: '100%', maxWidth: '760px', margin: '0 auto', padding: '40px 16px 64px' }}>
          <div style={{ background: DARK, padding: '28px 32px', marginBottom: '24px', borderLeft: `6px solid ${RED}` }}>
            <h2 style={{ fontFamily: "'DM Serif Display', Georgia, serif", fontSize: '22px', color: '#fff', marginBottom: '8px' }}>Impact evaluation is premature at this stage</h2>
            <p style={{ fontSize: '14px', color: 'rgba(255,255,255,.7)', lineHeight: 1.6 }}>One or more critical readiness conditions are not yet met. Evaluating impact before these conditions are in place risks producing findings that reflect the immaturity of the intervention rather than its true effectiveness.</p>
          </div>

          {result.failures.map(f => (
            <div key={f.id} style={{ background: '#fff', border: `1px solid ${GREY_2}`, borderLeft: `5px solid ${RED}`, padding: '22px 24px', boxShadow: '0 1px 3px rgba(0,0,0,.05)', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px', marginBottom: '10px' }}>
                <div>
                  <div style={{ fontSize: '17px', fontWeight: 700, color: RED, marginBottom: '4px' }}>⚠ {f.label} not yet in place</div>
                  <div style={{ fontSize: '12px', color: GREY_4 }}>Suggested T&amp;L stage: <TlBadge stage={f.stage} /></div>
                </div>
              </div>
              <p style={{ fontSize: '13px', color: GREY_4, lineHeight: 1.6, marginBottom: '12px' }}>{f.reason}</p>
              <div style={{ background: GREY_1, padding: '12px 14px', borderLeft: `3px solid ${GREY_3}` }}>
                <p style={{ fontSize: '12px', fontWeight: 700, color: DARK, marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '.4px' }}>Recommended action</p>
                <p style={{ fontSize: '13px', color: GREY_4, lineHeight: 1.6 }} dangerouslySetInnerHTML={{ __html: f.action }} />
              </div>
            </div>
          ))}

          <div style={{ background: '#fff', border: `1px solid ${GREY_2}`, borderLeft: `5px solid ${ORANGE}`, padding: '22px 24px', marginBottom: '24px' }}>
            <div style={{ fontSize: '17px', fontWeight: 700, marginBottom: '10px' }}>Alternative evaluation approaches appropriate at this stage</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '12px' }}>
              {['Process evaluation','Developmental evaluation','Contribution analysis','Realist evaluation'].map(d => (
                <span key={d} style={{ fontSize: '12px', padding: '3px 10px', background: GREY_1, border: `1px solid ${GREY_2}`, color: DARK }}>{d}</span>
              ))}
            </div>
            <ul style={{ paddingLeft: '16px', fontSize: '13px', color: GREY_4, lineHeight: 1.75 }}>
              <li>A <strong>process evaluation</strong> documents how the intervention is delivered, by whom, and with what fidelity</li>
              <li>A <strong>developmental evaluation</strong> supports real-time adaptation during programme development</li>
              <li><strong>Contribution analysis</strong> builds a structured causal narrative without requiring a counterfactual design</li>
              <li><strong>Realist evaluation</strong> asks what works, for whom, in what context, and why</li>
            </ul>
          </div>

          <div style={{ background: DARK, padding: '24px 28px', marginBottom: '24px' }}>
            <h3 style={{ fontFamily: "'DM Serif Display', Georgia, serif", fontSize: '20px', color: '#fff', marginBottom: '8px' }}>Return when ready</h3>
            <p style={{ fontSize: '13px', color: 'rgba(255,255,255,.65)', lineHeight: 1.6 }}>Once the intervention is clearly defined, has a theory of change, and is operating at sufficient scale (Test or Grow stage), return to this tool to identify the most promising impact evaluation designs.</p>
          </div>

          <div style={{ textAlign: 'center', marginTop: '32px' }}>
            <button onClick={restart} style={{ background: 'none', border: 'none', fontFamily: 'inherit', fontSize: '13px', color: GREY_4, cursor: 'pointer', textDecoration: 'underline' }}>
              ← Start again with different answers
            </button>
          </div>
        </div>
      )}

      {phase === 'result' && result && result.type === 'ready' && (() => {
        const { sorted, removed, showBayes, tlInfo, constraintInfo, warnings } = result
        const a = answers
        return (
          <div style={{ width: '100%', maxWidth: '760px', margin: '0 auto', padding: '40px 16px 64px' }}>
            <div style={{ marginBottom: '28px' }}>
              <div style={{ fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '10px', color: GREEN }}>Assessment complete</div>
              <h2 style={{ fontFamily: "'DM Serif Display', Georgia, serif", fontSize: 'clamp(24px, 4vw, 34px)', lineHeight: 1.2, color: DARK, marginBottom: '8px' }}>Your evaluation design shortlist</h2>
              <p style={{ fontSize: '15px', color: GREY_4, lineHeight: 1.6 }}>Based on your answers, {sorted.length} design {sorted.length === 1 ? 'family is' : 'families are'} worth exploring. Review the key investigation questions for each before committing to a design.</p>
            </div>

            {/* T&L stage panel */}
            <div style={{ background: DARK, padding: '18px 22px', marginBottom: '24px', display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
              <div style={{ fontSize: '20px', flexShrink: 0 }}>📋</div>
              <div>
                <h3 style={{ fontSize: '13px', fontWeight: 700, color: '#fff', marginBottom: '4px' }}>Magenta Book Test and Learn stage</h3>
                <p style={{ fontSize: '13px', color: 'rgba(255,255,255,.65)', lineHeight: 1.6, marginBottom: '8px' }} dangerouslySetInnerHTML={{ __html: tlInfo.note }} />
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  {tlInfo.stages.map(s => <TlBadge key={s} stage={s} />)}
                </div>
              </div>
            </div>

            {/* Constraint callout */}
            {constraintInfo && (
              <div style={{ background: DARK, color: '#fff', padding: '18px 22px', marginBottom: '24px', display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
                <div style={{ fontSize: '20px', flexShrink: 0 }}>{constraintInfo.icon}</div>
                <div>
                  {constraintInfo.title && <h3 style={{ fontSize: '14px', fontWeight: 700, marginBottom: '4px' }}>{constraintInfo.title}</h3>}
                  <p style={{ fontSize: '13px', color: 'rgba(255,255,255,.7)', lineHeight: 1.6 }} dangerouslySetInnerHTML={{ __html: constraintInfo.body }} />
                </div>
              </div>
            )}

            {/* Bayesian callout */}
            {showBayes && (
              <div style={{ background: PURPLE_LT, border: `1px solid #c8b0e8`, borderLeft: `5px solid ${PURPLE}`, padding: '16px 20px', marginBottom: '24px' }}>
                <h3 style={{ fontSize: '13px', fontWeight: 700, color: PURPLE, marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>𝔅 Consider Bayesian analysis approaches</h3>
                <p style={{ fontSize: '13px', color: '#3a2a5a', lineHeight: 1.6, marginBottom: '8px' }}>
                  {a.q_sample === 'tiny'
                    ? 'With a very small sample, classical frequentist methods will have very limited power and wide confidence intervals. Bayesian analysis is particularly valuable here: it can incorporate prior information from similar interventions or contexts, produce honest posterior uncertainty rather than binary significance decisions, and update as data accumulate.'
                    : 'With a small sample (20–99 units), statistical power will be a constraint for all designs. Bayesian approaches offer two concrete advantages: informative priors from prior evidence can improve precision without additional data collection; and Bayesian adaptive designs (for RCTs) can stop early for efficacy or futility, reducing sample requirements.'}
                </p>
                <ul style={{ fontSize: '13px', color: '#3a2a5a', paddingLeft: '18px', lineHeight: 1.75, marginTop: '6px' }}>
                  <li>Ask your statistician whether informative priors are defensible from existing evidence on similar interventions</li>
                  <li>For RCTs: consider whether a Bayesian adaptive design or sequential analysis is appropriate</li>
                  <li>For observational methods: Bayesian sensitivity analysis for unmeasured confounding provides a more honest quantification of uncertainty</li>
                  <li>Note that Bayesian results (posterior distributions, credible intervals) require different communication to decision-makers than p-values and confidence intervals</li>
                </ul>
              </div>
            )}

            {/* Warnings */}
            {warnings.length > 0 && (
              <div style={{ marginBottom: '20px' }}>
                {warnings.map((w, i) => (
                  <div key={i} style={{ background: '#fff', border: `1px solid ${GREY_2}`, borderLeft: `5px solid ${ORANGE}`, padding: '14px 18px', marginBottom: '10px', fontSize: '13px', color: GREY_4, lineHeight: 1.6 }}>
                    ⚠ {w}
                  </div>
                ))}
              </div>
            )}

            {/* Family cards */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '28px' }}>
              {sorted.map(([key, priority]) => {
                const f = FAMILIES[key]
                const pc = PRIORITY_COLORS[priority] || PRIORITY_COLORS[3]
                return (
                  <div key={key} style={{ background: '#fff', border: `1px solid ${GREY_2}`, borderLeft: `5px solid ${pc.border}`, padding: '22px 24px', boxShadow: '0 1px 3px rgba(0,0,0,.05)' }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px', marginBottom: '10px' }}>
                      <div>
                        <div style={{ fontSize: '17px', fontWeight: 700, color: DARK }}>{f.name}</div>
                        <div style={{ fontSize: '12px', color: GREY_4, marginTop: '2px' }}>{f.catLabel}</div>
                      </div>
                      <span style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.5px', padding: '3px 9px', flexShrink: 0, whiteSpace: 'nowrap', background: pc.badge_bg, color: pc.badge_fg }}>
                        {PRIORITY_LABEL[priority]}
                      </span>
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '12px' }}>
                      {f.designs.map(d => (
                        <span key={d} style={{ fontSize: '12px', padding: '3px 10px', background: GREY_1, border: `1px solid ${GREY_2}`, color: DARK }}>{d}</span>
                      ))}
                    </div>
                    <p style={{ fontSize: '13px', color: GREY_4, lineHeight: 1.6, marginBottom: '14px' }}>{getRationale(key, a)}</p>
                    <div style={{ background: GREY_1, padding: '12px 14px', borderLeft: `3px solid ${GREY_3}` }}>
                      <p style={{ fontSize: '12px', fontWeight: 700, color: DARK, marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '.4px' }}>Key questions to investigate</p>
                      <ul style={{ paddingLeft: '16px', fontSize: '13px', color: GREY_4, lineHeight: 1.75 }}>
                        {f.investigate.map((item, i) => <li key={i}>{item}</li>)}
                        {BAYES_BULLETS[key] && showBayes && (
                          <li dangerouslySetInnerHTML={{ __html: BAYES_BULLETS[key] }} />
                        )}
                      </ul>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Removed */}
            {Object.keys(removed).length > 0 && (
              <div style={{ marginBottom: '28px' }}>
                <div style={{ fontSize: '12px', fontWeight: 700, color: GREY_4, textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  Removed from consideration
                  <span style={{ flex: 1, height: '1px', background: GREY_2 }} />
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {Object.entries(removed).map(([key, reason]) => (
                    <div key={key} style={{ fontSize: '12px', padding: '5px 12px', background: '#fff', border: `1px solid ${GREY_2}`, color: GREY_3, display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ textDecoration: 'line-through', textDecorationColor: GREY_3 }}>{FAMILIES[key].name}</span>
                      <span style={{ fontSize: '11px', color: RED, fontStyle: 'italic', textDecoration: 'none' }}>{reason}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Handoff */}
            <div style={{ background: DARK, padding: '24px 28px', marginBottom: '24px' }}>
              <h3 style={{ fontFamily: "'DM Serif Display', Georgia, serif", fontSize: '20px', color: '#fff', marginBottom: '8px' }}>Ready for a detailed assessment?</h3>
              <p style={{ fontSize: '13px', color: 'rgba(255,255,255,.65)', lineHeight: 1.6, marginBottom: '16px' }}>
                When you have worked through the investigation questions above, use the full <strong>Impact Evaluation Feasibility Tool</strong> to score and rank all 32 design variants based on your specific data landscape, causal structure, and statistical parameters.
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '18px' }}>
                {[
                  { label: 'Intervention clearly defined', ready: a.q_defined === 'yes' },
                  { label: 'Theory of change documented', ready: a.q_toc === 'yes' },
                  { label: 'Intervention at sufficient scale', ready: a.q_scale === 'yes' },
                  { label: 'Pre-intervention data confirmed', ready: a.q_predata !== 'none' && a.q_predata !== undefined },
                  { label: 'Key investigation questions answered', ready: false },
                ].map(c => (
                  <span key={c.label} style={{ fontSize: '11px', padding: '4px 10px', background: c.ready ? 'rgba(0,112,60,.25)' : 'rgba(255,255,255,.07)', color: c.ready ? '#7ed4a8' : 'rgba(255,255,255,.6)', border: `1px solid ${c.ready ? 'rgba(0,112,60,.4)' : 'rgba(255,255,255,.14)'}` }}>
                    {c.ready ? '✓' : '○'} {c.label}
                  </span>
                ))}
              </div>
              <button
                onClick={() => navigate('/research-question')}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '10px', background: MOJ, color: '#fff', border: 'none', padding: '12px 24px', fontFamily: "'DM Sans', system-ui, sans-serif", fontSize: '15px', fontWeight: 600, cursor: 'pointer', textDecoration: 'none' }}
              >
                Open the full feasibility tool →
              </button>
            </div>

            {/* Summary */}
            <div style={{ background: '#fff', border: `1px solid ${GREY_2}`, padding: '20px 22px', marginBottom: '24px' }}>
              <h4 style={{ fontSize: '12px', fontWeight: 700, color: GREY_4, textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: '12px' }}>Your answers</h4>
              {QUESTIONS.filter(q => a[q.id] !== undefined).map(q => {
                const opt = q.options.find(o => o.value === a[q.id])
                return (
                  <div key={q.id} style={{ display: 'flex', gap: '12px', fontSize: '12px', padding: '5px 0', borderBottom: `1px solid ${GREY_1}` }}>
                    <span style={{ color: GREY_4, flex: 1 }}>{QLAB[q.id] || q.heading.slice(0, 60) + '...'}</span>
                    <span style={{ fontWeight: 600, color: DARK, flexShrink: 0, maxWidth: '220px', textAlign: 'right' }}>{opt ? opt.label : a[q.id]}</span>
                  </div>
                )
              })}
              <div style={{ display: 'flex', gap: '12px', fontSize: '12px', padding: '5px 0' }}>
                <span style={{ color: GREY_4, flex: 1 }}>Suggested T&amp;L stage</span>
                <span style={{ display: 'flex', gap: '4px', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                  {tlInfo.stages.map(s => <TlBadge key={s} stage={s} />)}
                </span>
              </div>
            </div>

            <div style={{ textAlign: 'center', marginTop: '32px', paddingBottom: '8px' }}>
              <button onClick={restart} style={{ background: 'none', border: 'none', fontFamily: 'inherit', fontSize: '13px', color: GREY_4, cursor: 'pointer', textDecoration: 'underline' }}>
                ← Start again with different answers
              </button>
            </div>
          </div>
        )
      })()}
    </div>
  )
}
