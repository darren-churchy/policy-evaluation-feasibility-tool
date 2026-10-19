import { useNavigate } from 'react-router-dom'
import { T } from '../../styles/tokens.js'

// ── Tool routes ─────────────────────────────────────────────────────────────
const TOOL_LINKS = {
  questionFramework: '#/question-framework',
  quantTree:         '#/quant-tree',
  qualTree:          '#/qual-tree',
  designFinder:      '#/design-finder',
}

// ── Sub-components ─────────────────────────────────────────────────────────

function ToolCard({ title, description, href, tag, tagColor, topBorderColor, linkColor }) {
  const navigate = useNavigate()
  const isInternal = href && href.startsWith('#/')

  const resolvedTagColor = tagColor ?? T.purple
  const resolvedTopBorder = topBorderColor ?? resolvedTagColor
  const resolvedLinkColor = linkColor ?? T.teal

  const sharedStyle = {
    display: 'block',
    background: '#ffffff',
    border: `1px solid ${T.greyLine}`,
    borderTop: `4px solid ${resolvedTopBorder}`,
    padding: '20px',
    textDecoration: 'none',
    color: T.ink,
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
          background: resolvedTagColor,
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
      <div style={{ fontSize: '13px', color: T.greyText, lineHeight: 1.6 }}>{description}</div>
      <div style={{ marginTop: '12px', fontSize: '13px', color: resolvedLinkColor, fontWeight: 600, textDecoration: 'underline' }}>
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

function StageWorkflowStep({ number, label, description, locked = false }) {
  return (
    <div style={{
      display: 'flex',
      gap: '16px',
      alignItems: 'flex-start',
      padding: '14px 0',
      borderBottom: `1px solid ${T.greyLine}`,
    }}>
      <div style={{
        width: '28px', height: '28px',
        borderRadius: '50%',
        background: locked ? T.greyLine : T.purple,
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
        <div style={{ fontSize: '14px', fontWeight: 700, color: T.ink, marginBottom: '2px' }}>
          {label}
        </div>
        <div style={{ fontSize: '13px', color: T.greyText, lineHeight: 1.5 }}>
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
    <div style={{ minHeight: '100vh', background: T.greyBg }}>

      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <div style={{
        background: T.purple25,
        padding: '48px 40px',
      }}>
        <div style={{ maxWidth: '900px', margin: '0 auto' }}>
          <h1 style={{
            fontSize: 'clamp(28px, 4vw, 46px)',
            fontWeight: 700,
            letterSpacing: '-0.5px',
            color: '#ffffff',
            lineHeight: 1.15,
            marginBottom: '16px',
          }}>
            Impact Evaluation<br />
            <span style={{ color: T.purpleTintMid }}>Feasibility Tool</span>
          </h1>
          <p style={{ fontSize: '16px', color: '#d9d2ec', lineHeight: 1.7, maxWidth: '600px', marginBottom: '28px' }}>
            A structured decision-support tool for government social researchers planning
            impact evaluations. Work through seven sections to receive a scored feasibility
            assessment across 32 evaluation design variants.
          </p>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
            <span style={{
              background: T.purple50, color: '#ffffff',
              fontSize: '12px', padding: '4px 12px', fontWeight: 600,
            }}>
              Prototype v0.7.1
            </span>
            <span style={{ fontSize: '12px', color: 'rgba(255,255,255,.5)' }}>
              32 design variants · Causal validity scoring · GOV.UK Design System
            </span>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '40px 40px 64px' }}>

        {/* ── Section 1: Research questions ──────────────────────────────── */}
        <div style={{ marginBottom: '48px' }}>
          <div style={{
            fontSize: '11px', fontWeight: 700, color: T.purple,
            textTransform: 'uppercase', letterSpacing: '.8px', marginBottom: '8px',
          }}>
            Step 1 — Before you start
          </div>
          <h2 style={{ fontSize: '22px', fontWeight: 700, color: T.ink, marginBottom: '12px' }}>
            Clarify your research question
          </h2>
          <p style={{ fontSize: '15px', color: T.greyText, lineHeight: 1.7, marginBottom: '8px', maxWidth: '680px' }}>
            Every evaluation begins with a question. The type of question — descriptive,
            causal, predictive, or exploratory — determines what methods are appropriate.
            Committing to an impact evaluation design before clarifying the question is
            one of the most common sources of avoidable methodological error.
          </p>
          <p style={{ fontSize: '14px', color: T.greyText, lineHeight: 1.6, marginBottom: '24px', maxWidth: '680px' }}>
            If you are uncertain about your question type, or whether impact evaluation
            is the right approach at all, use the tools below before proceeding.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '14px' }}>
            <ToolCard
              href={TOOL_LINKS.questionFramework}
              title="Research Question Framework"
              description="Classify your research question and understand which evaluation approaches are appropriate for your context."
              tag="Start here"
              tagColor={T.purple}
              topBorderColor={T.purple}
              linkColor={T.teal}
            />
            <ToolCard
              href={TOOL_LINKS.quantTree}
              title="Quantitative Decision Tree"
              description="Guides you through selecting a quantitative method based on your data structure and research question."
              tag="Decision tool"
              tagColor={T.teal}
              topBorderColor={T.teal}
              linkColor={T.teal}
            />
            <ToolCard
              href={TOOL_LINKS.qualTree}
              title="Qualitative Decision Tree"
              description="Helps identify whether qualitative methods — or a mixed-methods approach — are appropriate for your question."
              tag="Decision tool"
              tagColor={T.teal}
              topBorderColor={T.teal}
              linkColor={T.teal}
            />
          </div>
        </div>

        {/* ── Divider ───────────────────────────────────────────────────── */}
        <div style={{ borderTop: `3px solid ${T.purple}`, marginBottom: '48px' }} />

        {/* ── Section 2: Impact evaluation ──────────────────────────────── */}
        <div style={{ marginBottom: '48px' }}>
          <div style={{
            fontSize: '11px', fontWeight: 700, color: T.purple,
            textTransform: 'uppercase', letterSpacing: '.8px', marginBottom: '8px',
          }}>
            Step 2 — Scoping your approach
          </div>
          <h2 style={{ fontSize: '22px', fontWeight: 700, color: T.ink, marginBottom: '12px' }}>
            Impact evaluation and causal inference
          </h2>
          <p style={{ fontSize: '15px', color: T.greyText, lineHeight: 1.7, marginBottom: '8px', maxWidth: '680px' }}>
            Impact evaluation seeks to estimate the <strong style={{ color: T.ink }}>causal effect</strong> of
            an intervention on outcomes — answering "does this intervention work?" rather than
            "what happened?". This requires a credible counterfactual: what would have
            happened in the absence of the intervention.
          </p>
          <p style={{ fontSize: '14px', color: T.greyText, lineHeight: 1.6, marginBottom: '20px', maxWidth: '680px' }}>
            The methods in this tool are drawn from the causal inference literature.
            The Magenta Book Test and Learn framework identifies the <strong style={{ color: T.ink }}>Test</strong> and{' '}
            <strong style={{ color: T.ink }}>Grow</strong> stages as the appropriate point for impact evaluation —
            once an intervention is defined, has a theory of change, and is operating at
            sufficient scale.
          </p>

          {/* T&L stage badges */}
          <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', flexWrap: 'wrap', alignItems: 'center' }}>
            <span style={{ fontSize: '13px', color: T.greyText }}>This tool covers:</span>
            {[
              { label: 'Test', bg: T.purpleTint, fg: T.purple25 },
              { label: 'Grow', bg: T.tealTint,   fg: T.teal25   },
            ].map(s => (
              <span key={s.label} style={{
                background: s.bg, color: s.fg,
                fontSize: '12px', fontWeight: 700,
                padding: '3px 10px', borderRadius: '2px',
              }}>
                {s.label}
              </span>
            ))}
            <span style={{ fontSize: '13px', color: T.greyText }}>stages of the Magenta Book T&amp;L cycle</span>
          </div>

          {/* Design finder card */}
          <div style={{
            background: '#fff', border: `1px solid ${T.greyLine}`,
            borderLeft: `5px solid ${T.green}`, padding: '20px 24px', marginBottom: '8px',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px', flexWrap: 'wrap' }}>
              <div style={{ flex: 1, minWidth: '240px' }}>
                <span style={{
                  background: T.green, color: '#fff',
                  fontSize: '10px', fontWeight: 700, padding: '2px 8px',
                  textTransform: 'uppercase', letterSpacing: '.5px',
                  marginBottom: '8px', display: 'inline-block',
                }}>
                  Early screening
                </span>
                <div style={{ fontSize: '16px', fontWeight: 700, marginBottom: '6px' }}>
                  Evaluation Design Finder
                </div>
                <p style={{ fontSize: '13px', color: T.greyText, lineHeight: 1.6, margin: 0 }}>
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
                  background: T.green,
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
                onMouseEnter={e => { e.currentTarget.style.background = T.green25 }}
                onMouseLeave={e => { e.currentTarget.style.background = T.green }}
              >
                Open Design Finder →
              </button>
            </div>
          </div>
        </div>

        {/* ── Divider ───────────────────────────────────────────────────── */}
        <div style={{ borderTop: `3px solid ${T.purple}`, marginBottom: '48px' }} />

        {/* ── Section 3: Full feasibility assessment ─────────────────────── */}
        <div>
          <div style={{
            fontSize: '11px', fontWeight: 700, color: T.purple,
            textTransform: 'uppercase', letterSpacing: '.8px', marginBottom: '8px',
          }}>
            Step 3 — Detailed assessment
          </div>
          <h2 style={{ fontSize: '22px', fontWeight: 700, color: T.ink, marginBottom: '12px' }}>
            Full feasibility review
          </h2>
          <p style={{ fontSize: '15px', color: T.greyText, lineHeight: 1.7, marginBottom: '20px', maxWidth: '680px' }}>
            The full assessment guides you through seven sections, scoring 32 design variants
            on two dimensions — causal validity and data availability — to produce a ranked
            feasibility table with blockers, recommended next steps, and a downloadable report.
          </p>

          {/* Disclaimer — magenta caution callout */}
          <div style={{
            background: T.magentaTint,
            borderLeft: `4px solid ${T.magenta}`,
            padding: '14px 18px',
            marginBottom: '28px',
            fontSize: '13px',
            color: T.ink,
            lineHeight: 1.6,
          }}>
            <strong>User discretion:</strong>{' '}
            Scores and rankings produced by this tool are based on your answers to structured
            questions. They are decision-support outputs, not definitive recommendations.
            Professional methodological judgement should always be applied when determining
            the feasibility and appropriateness of any design. Complex evaluations should
            involve a methodology adviser.
          </div>

          {/* Workflow steps */}
          <div style={{
            background: '#fff', border: `1px solid ${T.greyLine}`,
            padding: '20px 24px', marginBottom: '28px',
          }}>
            <div style={{
              fontSize: '13px', fontWeight: 700, color: T.ink,
              marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '.4px',
            }}>
              Assessment sections
            </div>
            {[
              { n: '1', label: 'Research Question',        desc: 'PICOTS framework, policy decision, prospective evaluation filter' },
              { n: '2', label: 'Causal Readiness',          desc: 'Intervention readiness gate (T&L stage check) and causal identification assumptions' },
              { n: '3', label: 'Ideal Trial Specification', desc: 'Specify your ideal trial to clarify the causal estimand before choosing a design' },
              { n: '4', label: 'Design-Specific Questions', desc: '32 design variants across 7 families, with screening questions and blockers' },
              { n: '5', label: 'Adjustment & DAG',          desc: 'Causal diagram, variable classification, confounder confidence' },
              { n: '6', label: 'Data Sources',              desc: 'Data inventory, linkage feasibility, missing data assessment' },
              { n: '7', label: 'Statistical Feasibility',   desc: 'Sample size, MDE, power calculation, pre-intervention data' },
              { n: '★', label: 'Results',                   desc: 'Ranked feasibility table, top recommendation, next steps, HTML export' },
            ].map(s => (
              <StageWorkflowStep key={s.n} number={s.n} label={s.label} description={s.desc} />
            ))}
          </div>

          {/* Start CTA */}
          <div style={{ display: 'flex', gap: '14px', alignItems: 'center', flexWrap: 'wrap' }}>
            <button
              onClick={() => navigate('/research-question')}
              style={{
                background: T.purple,
                color: '#fff',
                border: 'none',
                padding: '14px 32px',
                fontSize: '16px',
                fontWeight: 700,
                cursor: 'pointer',
                fontFamily: 'inherit',
                boxShadow: `0 3px 0 ${T.purple25}`,
                transition: 'background .12s, box-shadow .12s, transform .1s',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = T.purple50; e.currentTarget.style.transform = 'translateY(-1px)' }}
              onMouseLeave={e => { e.currentTarget.style.background = T.purple; e.currentTarget.style.transform = 'none' }}
            >
              Start the feasibility assessment →
            </button>
            <span style={{ fontSize: '13px', color: T.greyText }}>
              ~20–30 minutes · All sections required for results
            </span>
          </div>
        </div>

      </div>
    </div>
  )
}
