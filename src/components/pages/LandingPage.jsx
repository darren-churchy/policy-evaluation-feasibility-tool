import { useNavigate } from 'react-router-dom'

// ── Tool routes ─────────────────────────────────────────────────────────────
const TOOL_LINKS = {
  questionFramework: '#/question-framework',
  quantTree:         '#/quant-tree',
  qualTree:          '#/qual-tree',
  designFinder:      '#/design-finder',
}

// ── Sub-components ─────────────────────────────────────────────────────────

function ToolCard({ title, description, href, tag, tagColor = '#1d70b8' }) {
  const navigate = useNavigate()
  const isInternal = href && href.startsWith('#/')

  const sharedStyle = {
    display: 'block',
    background: '#ffffff',
    border: '1px solid #b1b4b6',
    borderTop: `4px solid ${tagColor}`,
    padding: '20px',
    textDecoration: 'none',
    color: '#0b0c0c',
    cursor: 'pointer',
    transition: 'box-shadow .15s, transform .1s',
    width: '100%',
    textAlign: 'left',
    fontFamily: 'inherit',
  }

  const inner = (
    <>
      {tag && (
        <span style={{
          display: 'inline-block',
          background: tagColor,
          color: '#fff',
          fontSize: '10px',
          fontWeight: 700,
          padding: '2px 8px',
          textTransform: 'uppercase',
          letterSpacing: '.5px',
          marginBottom: '10px',
        }}>
          {tag}
        </span>
      )}
      <div style={{ fontSize: '16px', fontWeight: 700, marginBottom: '6px' }}>{title}</div>
      <div style={{ fontSize: '13px', color: '#6f777b', lineHeight: 1.6 }}>{description}</div>
      <div style={{ marginTop: '12px', fontSize: '13px', color: tagColor, fontWeight: 600 }}>
        Open tool →
      </div>
    </>
  )

  const hoverOn = e => { e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,.12)'; e.currentTarget.style.transform = 'translateY(-2px)' }
  const hoverOff = e => { e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.transform = 'none' }

  if (isInternal) {
    return (
      <button
        onClick={() => navigate(href.slice(1))}
        style={sharedStyle}
        onMouseEnter={hoverOn}
        onMouseLeave={hoverOff}
      >
        {inner}
      </button>
    )
  }

  return (
    <a
      href={href}
      style={sharedStyle}
      onMouseEnter={hoverOn}
      onMouseLeave={hoverOff}
    >
      {inner}
    </a>
  )
}

function StageWorkflowStep({ number, path, label, description, navigate, locked = false }) {
  return (
    <div style={{
      display: 'flex',
      gap: '16px',
      alignItems: 'flex-start',
      padding: '14px 0',
      borderBottom: '1px solid #e8e8e8',
    }}>
      <div style={{
        width: '28px', height: '28px',
        borderRadius: '50%',
        background: locked ? '#b1b4b6' : '#9c1b6d',
        color: '#fff',
        fontSize: '13px',
        fontWeight: 700,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        marginTop: '2px',
      }}>
        {number}
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: '14px', fontWeight: 700, color: '#0b0c0c', marginBottom: '2px' }}>
          {label}
        </div>
        <div style={{ fontSize: '13px', color: '#6f777b', lineHeight: 1.5 }}>
          {description}
        </div>
      </div>
    </div>
  )
}

// ── Main landing page ──────────────────────────────────────────────────────

export default function LandingPage() {
  const navigate = useNavigate()

  return (
    <div style={{ minHeight: '100vh', background: '#f3f2f1' }}>

      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <div style={{
        background: '#0b0c0c',
        borderBottom: '8px solid #9c1b6d',
        padding: '48px 40px',
      }}>
        <div style={{ maxWidth: '900px', margin: '0 auto' }}>
          <h1 style={{
            fontFamily: "'DM Serif Display', Georgia, serif",
            fontSize: 'clamp(28px, 4vw, 44px)',
            color: '#ffffff',
            lineHeight: 1.15,
            marginBottom: '16px',
          }}>
            Impact Evaluation<br />
            <span style={{ color: '#c97db0' }}>Feasibility Tool</span>
          </h1>
          <p style={{ fontSize: '16px', color: 'rgba(255,255,255,.7)', lineHeight: 1.7, maxWidth: '600px', marginBottom: '28px' }}>
            A structured decision-support tool for government social researchers planning
            impact evaluations. Work through seven sections to receive a scored feasibility
            assessment across 32 evaluation design variants.
          </p>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
            <span style={{ background: 'rgba(156,27,109,.3)', color: '#e0a8d0', border: '1px solid rgba(156,27,109,.5)', fontSize: '12px', padding: '4px 12px' }}>
              Prototype v0.6
            </span>
            <span style={{ fontSize: '12px', color: 'rgba(255,255,255,.4)' }}>
              32 design variants · Causal validity scoring · GOV.UK Design System
            </span>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '40px 40px 64px' }}>

        {/* ── Section 1: Research questions ──────────────────────────────── */}
        <div style={{ marginBottom: '48px' }}>
          <div style={{
            fontSize: '11px', fontWeight: 700, color: '#9c1b6d',
            textTransform: 'uppercase', letterSpacing: '.8px', marginBottom: '8px',
          }}>
            Step 1 — Before you start
          </div>
          <h2 style={{ fontSize: '22px', fontWeight: 700, color: '#0b0c0c', marginBottom: '12px' }}>
            Clarify your research question
          </h2>
          <p style={{ fontSize: '15px', color: '#6f777b', lineHeight: 1.7, marginBottom: '8px', maxWidth: '680px' }}>
            Every evaluation begins with a question. The type of question — descriptive,
            causal, predictive, or exploratory — determines what methods are appropriate.
            Committing to an impact evaluation design before clarifying the question is
            one of the most common sources of avoidable methodological error.
          </p>
          <p style={{ fontSize: '14px', color: '#6f777b', lineHeight: 1.6, marginBottom: '24px', maxWidth: '680px' }}>
            If you are uncertain about your question type, or whether impact evaluation
            is the right approach at all, use the tools below before proceeding.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '14px' }}>
            <ToolCard
              href={TOOL_LINKS.questionFramework}
              title="Research Question Framework"
              description="Classify your research question and understand which evaluation approaches are appropriate for your context."
              tag="Start here"
              tagColor="#1d70b8"
            />
            <ToolCard
              href={TOOL_LINKS.quantTree}
              title="Quantitative Decision Tree"
              description="Guides you through selecting a quantitative method based on your data structure and research question."
              tag="Decision tool"
              tagColor="#6f777b"
            />
            <ToolCard
              href={TOOL_LINKS.qualTree}
              title="Qualitative Decision Tree"
              description="Helps identify whether qualitative methods — or a mixed-methods approach — are appropriate for your question."
              tag="Decision tool"
              tagColor="#6f777b"
            />
          </div>
        </div>

        {/* ── Divider ───────────────────────────────────────────────────── */}
        <div style={{ borderTop: '3px solid #9c1b6d', marginBottom: '48px' }} />

        {/* ── Section 2: Impact evaluation ──────────────────────────────── */}
        <div style={{ marginBottom: '48px' }}>
          <div style={{
            fontSize: '11px', fontWeight: 700, color: '#9c1b6d',
            textTransform: 'uppercase', letterSpacing: '.8px', marginBottom: '8px',
          }}>
            Step 2 — Scoping your approach
          </div>
          <h2 style={{ fontSize: '22px', fontWeight: 700, color: '#0b0c0c', marginBottom: '12px' }}>
            Impact evaluation and causal inference
          </h2>
          <p style={{ fontSize: '15px', color: '#6f777b', lineHeight: 1.7, marginBottom: '8px', maxWidth: '680px' }}>
            Impact evaluation seeks to estimate the <strong style={{ color: '#0b0c0c' }}>causal effect</strong> of
            an intervention on outcomes — answering "does this intervention work?" rather than
            "what happened?". This requires a credible counterfactual: what would have
            happened in the absence of the intervention.
          </p>
          <p style={{ fontSize: '14px', color: '#6f777b', lineHeight: 1.6, marginBottom: '20px', maxWidth: '680px' }}>
            The methods in this tool are drawn from the causal inference literature.
            The Magenta Book Test and Learn framework identifies the <strong style={{ color: '#0b0c0c' }}>Test</strong> and{' '}
            <strong style={{ color: '#0b0c0c' }}>Grow</strong> stages as the appropriate point for impact evaluation —
            once an intervention is defined, has a theory of change, and is operating at
            sufficient scale.
          </p>

          {/* T&L stage badges */}
          <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', flexWrap: 'wrap', alignItems: 'center' }}>
            <span style={{ fontSize: '13px', color: '#6f777b' }}>This tool covers:</span>
            {[
              { label: 'Test', bg: '#f5eaf8', fg: '#5a1a6a' },
              { label: 'Grow', bg: '#fef0e0', fg: '#6a3a1a' },
            ].map(s => (
              <span key={s.label} style={{
                background: s.bg, color: s.fg,
                fontSize: '12px', fontWeight: 700,
                padding: '3px 10px', borderRadius: '2px',
              }}>
                {s.label}
              </span>
            ))}
            <span style={{ fontSize: '13px', color: '#6f777b' }}>stages of the Magenta Book T&amp;L cycle</span>
          </div>

          {/* Design finder card */}
          <div style={{ background: '#fff', border: '1px solid #b1b4b6', borderLeft: '5px solid #00703c', padding: '20px 24px', marginBottom: '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px', flexWrap: 'wrap' }}>
              <div style={{ flex: 1, minWidth: '240px' }}>
                <span style={{ background: '#00703c', color: '#fff', fontSize: '10px', fontWeight: 700, padding: '2px 8px', textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: '8px', display: 'inline-block' }}>
                  Early screening
                </span>
                <div style={{ fontSize: '16px', fontWeight: 700, marginBottom: '6px' }}>
                  Evaluation Design Finder
                </div>
                <p style={{ fontSize: '13px', color: '#6f777b', lineHeight: 1.6, margin: 0 }}>
                  Answer 10–12 questions to identify which design families are most
                  worth exploring for your context. Takes about 3 minutes. No detailed
                  data information required at this stage — use this as a first screen
                  before committing to the full feasibility assessment below.
                </p>
              </div>
              <button
                onClick={() => navigate('/design-finder')}
                style={{
                  display: 'inline-block',
                  background: '#00703c',
                  color: '#fff',
                  padding: '10px 20px',
                  fontSize: '14px',
                  fontWeight: 600,
                  border: 'none',
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                  whiteSpace: 'nowrap',
                  flexShrink: 0,
                }}
              >
                Open Design Finder →
              </button>
            </div>
          </div>
        </div>

        {/* ── Divider ───────────────────────────────────────────────────── */}
        <div style={{ borderTop: '3px solid #9c1b6d', marginBottom: '48px' }} />

        {/* ── Section 3: Full feasibility assessment ─────────────────────── */}
        <div>
          <div style={{
            fontSize: '11px', fontWeight: 700, color: '#9c1b6d',
            textTransform: 'uppercase', letterSpacing: '.8px', marginBottom: '8px',
          }}>
            Step 3 — Detailed assessment
          </div>
          <h2 style={{ fontSize: '22px', fontWeight: 700, color: '#0b0c0c', marginBottom: '12px' }}>
            Full feasibility review
          </h2>
          <p style={{ fontSize: '15px', color: '#6f777b', lineHeight: 1.7, marginBottom: '20px', maxWidth: '680px' }}>
            The full assessment guides you through seven sections, scoring 32 design variants
            on two dimensions — causal validity and data availability — to produce a ranked
            feasibility table with blockers, recommended next steps, and a downloadable report.
          </p>

          {/* Disclaimer */}
          <div style={{
            background: '#fef3e8',
            borderLeft: '5px solid #f47738',
            padding: '14px 18px',
            marginBottom: '28px',
            fontSize: '13px',
            color: '#6f777b',
            lineHeight: 1.6,
          }}>
            <strong style={{ color: '#0b0c0c' }}>User discretion:</strong>{' '}
            Scores and rankings produced by this tool are based on your answers to structured
            questions. They are decision-support outputs, not definitive recommendations.
            Professional methodological judgement should always be applied when determining
            the feasibility and appropriateness of any design. Complex evaluations should
            involve a methodology adviser.
          </div>

          {/* Workflow steps */}
          <div style={{ background: '#fff', border: '1px solid #b1b4b6', padding: '20px 24px', marginBottom: '28px' }}>
            <div style={{ fontSize: '13px', fontWeight: 700, color: '#0b0c0c', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '.4px' }}>
              Assessment sections
            </div>
            {[
              { n: '1', label: 'Research Question',      desc: 'PICOTS framework, policy decision, prospective evaluation filter' },
              { n: '2', label: 'Causal Readiness',        desc: 'Intervention readiness gate (T&L stage check) and causal identification assumptions' },
              { n: '3', label: 'Ideal Trial Specification', desc: 'Specify your ideal trial to clarify the causal estimand before choosing a design' },
              { n: '4', label: 'Design-Specific Questions', desc: '32 design variants across 7 families, with screening questions and blockers' },
              { n: '5', label: 'Adjustment & DAG',        desc: 'Causal diagram, variable classification, confounder confidence' },
              { n: '6', label: 'Data Sources',            desc: 'Data inventory, linkage feasibility, missing data assessment' },
              { n: '7', label: 'Statistical Feasibility', desc: 'Sample size, MDE, power calculation, pre-intervention data' },
              { n: '★', label: 'Results',                 desc: 'Ranked feasibility table, top recommendation, next steps, HTML export' },
            ].map(s => (
              <StageWorkflowStep key={s.n} number={s.n} label={s.label} description={s.desc} />
            ))}
          </div>

          {/* Start CTA */}
          <div style={{ display: 'flex', gap: '14px', alignItems: 'center', flexWrap: 'wrap' }}>
            <button
              onClick={() => navigate('/research-question')}
              style={{
                background: '#9c1b6d',
                color: '#fff',
                border: 'none',
                padding: '14px 32px',
                fontSize: '16px',
                fontWeight: 700,
                cursor: 'pointer',
                fontFamily: 'inherit',
                boxShadow: '0 3px 0 #5c1040',
                transition: 'background .12s, box-shadow .12s, transform .1s',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = '#6b1249'; e.currentTarget.style.transform = 'translateY(-1px)' }}
              onMouseLeave={e => { e.currentTarget.style.background = '#9c1b6d'; e.currentTarget.style.transform = 'none' }}
            >
              Start the feasibility assessment →
            </button>
            <span style={{ fontSize: '13px', color: '#6f777b' }}>
              ~20–30 minutes · All sections required for results
            </span>
          </div>
        </div>

      </div>
    </div>
  )
}
