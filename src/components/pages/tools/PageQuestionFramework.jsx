import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { qualData, quantData } from '../../../data/questionFrameworkData.js'
import { hexToRgba } from '../../../utils/colorUtils.js'
import { T } from '../../../styles/tokens.js'
import { TlBadge, Alert, Button, NavButtons, PageHeader } from '../../ui/GovukComponents.jsx'

function claimDotsHtml(n, accent) {
  return Array.from({ length: 3 }, (_, i) => (
    <span key={i} style={{
      width: '7px', height: '7px', borderRadius: '50%',
      background: i < n ? accent : T.greyLine,
      display: 'inline-block', marginRight: '3px', verticalAlign: 'middle',
    }} />
  ))
}

function FrameworkTable({ data, isQuant }) {
  const [activeIndex, setActiveIndex] = useState(null)

  function toggle(i) {
    setActiveIndex(activeIndex === i ? null : i)
  }

  return (
    <div>
      {/* Column headers */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '190px 1fr 110px 145px',
        gap: '0 0.75rem',
        padding: '0.35rem 0.75rem 0.35rem 1.1rem',
        fontSize: '0.64rem',
        letterSpacing: '0.1em',
        textTransform: 'uppercase',
        color: T.greyText,
        borderBottom: `1px solid ${T.greyLine}`,
        marginBottom: '0.2rem',
      }}>
        <span>Question Type</span>
        <span>Core Logic &amp; Signal Phrases</span>
        <span>Evaluation Home</span>
        <span>T&amp;L Stage</span>
      </div>

      {data.map((row, i) => {
        const ab = hexToRgba(row.accent, 0.12)
        const abo = hexToRgba(row.accent, 0.32)
        const isActive = activeIndex === i
        const methods = isQuant ? row.methods : row.approaches

        return (
          <div key={row.id} id={row.id} style={{ scrollMarginTop: '2rem' }}>
            {/* Row */}
            <div
              onClick={() => toggle(i)}
              style={{
                display: 'grid',
                gridTemplateColumns: '190px 1fr 110px 145px',
                gap: '0 0.75rem',
                padding: '0.85rem 0.75rem 0.85rem 1.1rem',
                borderLeft: `4px solid ${row.accent}`,
                background: isActive ? T.purpleTint : T.greyBg,
                marginBottom: '0.25rem',
                cursor: 'pointer',
                transition: 'background 0.15s',
                userSelect: 'none',
              }}
            >
              <div>
                <div style={{ fontWeight: 600, fontSize: '0.9rem', color: row.color, marginBottom: '0.2rem', lineHeight: 1.3 }}>
                  {row.type}
                </div>
                <span style={{ fontSize: '0.68rem', display: 'inline-block', padding: '0.12rem 0.45rem', background: ab, color: row.color, border: `1px solid ${abo}`, marginTop: '0.2rem' }}>
                  {row.signal}
                </span>
                {isQuant && (
                  <div style={{ marginTop: '0.35rem', fontSize: '0.68rem', color: T.greyText }}>
                    {claimDotsHtml(row.claimDots, row.accent)}
                    {row.claimDots === 3 ? 'Causal' : row.claimDots === 2 ? 'Associational' : 'Descriptive'} claim
                  </div>
                )}
              </div>
              <div>
                <div style={{ fontSize: '0.84rem', lineHeight: 1.5, color: T.ink, marginBottom: '0.3rem' }}>
                  {row.logic}
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem' }}>
                  {row.signalPhrases.map((p, pi) => (
                    <span key={pi} style={{ fontSize: '0.68rem', background: T.greyBg, color: T.greyText, padding: '0.1rem 0.45rem', fontStyle: 'italic' }}>
                      {p}
                    </span>
                  ))}
                </div>
              </div>
              <div>
                <div style={{ fontSize: '0.78rem', fontWeight: 600, color: row.color, marginBottom: '0.15rem', lineHeight: 1.3 }}
                  dangerouslySetInnerHTML={{ __html: row.evalHome }} />
                <div style={{ fontSize: '0.68rem', color: T.greyText, lineHeight: 1.35 }}>
                  {row.evalNote}
                </div>
                <span style={{ fontSize: '0.67rem', color: T.teal, textDecoration: 'underline', marginTop: '0.35rem', display: 'block' }}>
                  {isActive ? '▲ collapse' : '▼ expand'}
                </span>
              </div>
              <div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                  {row.tlStages.map(s => <TlBadge key={s} stage={s} />)}
                </div>
              </div>
            </div>

            {/* Expand panel */}
            {isActive && (
              <div style={{
                background: '#fff',
                borderLeft: `4px solid ${row.accent}`,
                padding: '1.1rem 1.25rem',
                marginBottom: '0.25rem',
                marginTop: '-0.2rem',
              }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
                  <div>
                    <div style={{ fontSize: '0.63rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: T.greyText, marginBottom: '0.6rem' }}>
                      {isQuant ? 'Methods & Designs' : 'Qualitative Approaches'}
                    </div>
                    {methods.map((m, mi) => (
                      <div key={mi} style={{ display: 'flex', gap: '0.55rem', marginBottom: '0.5rem', alignItems: 'flex-start' }}>
                        <div style={{ width: '5px', height: '5px', borderRadius: '50%', background: row.accent, flexShrink: 0, marginTop: '6px' }} />
                        <div>
                          <span style={{ fontSize: '0.85rem', fontWeight: 600, color: row.color, display: 'block' }}>{m.name}</span>
                          <span style={{ fontSize: '0.74rem', color: T.greyText, lineHeight: 1.35 }}>
                            {isQuant ? m.note : '— ' + m.note}
                          </span>
                        </div>
                      </div>
                    ))}
                    {!isQuant && (
                      <div style={{ background: T.magentaTint, border: `1px solid ${T.magentaTintMid}`, padding: '0.65rem 0.85rem', fontSize: '0.82rem', lineHeight: 1.55, color: T.ink, fontStyle: 'italic', marginTop: '0.75rem' }}>
                        "{row.weakness}"
                      </div>
                    )}
                  </div>
                  <div>
                    {isQuant ? (
                      <>
                        <div style={{ fontSize: '0.63rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: T.greyText, marginBottom: '0.6rem' }}>Key Assumptions</div>
                        <div style={{ background: T.purpleTint, border: `1px solid ${T.purpleTintMid}`, padding: '0.65rem 0.85rem', fontSize: '0.76rem', lineHeight: 1.5, color: T.ink }}>
                          {row.assumptions.map((a, ai) => (
                            <div key={ai} style={{ display: 'flex', gap: '0.4rem', marginBottom: '0.25rem', alignItems: 'flex-start', fontSize: '0.75rem' }}>
                              <span style={{ color: row.accent, flexShrink: 0 }}>▸</span>
                              <span><strong>{a.label}:</strong> {a.note}</span>
                            </div>
                          ))}
                        </div>
                        {row.extraNote && (
                          <div style={{ marginTop: '0.75rem', background: T.purpleTint, border: `1px solid ${T.purpleTintMid}`, padding: '0.6rem 0.85rem', fontSize: '0.76rem', color: T.purple25, lineHeight: 1.55 }}>
                            <strong>Efficacy vs Effectiveness:</strong> {row.extraNote}
                          </div>
                        )}
                        <div style={{ background: T.magentaTint, border: `1px solid ${T.magentaTintMid}`, padding: '0.65rem 0.85rem', fontSize: '0.82rem', lineHeight: 1.55, color: T.ink, fontStyle: 'italic', marginTop: '0.75rem' }}>
                          "{row.weakness}"
                        </div>
                      </>
                    ) : (
                      <>
                        <div style={{ fontSize: '0.63rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: T.greyText, marginBottom: '0.6rem' }}>Common Commissioning Pitfall</div>
                        <div style={{ background: T.magentaTint, border: `1px solid ${T.magentaTintMid}`, padding: '0.65rem 0.85rem', fontSize: '0.82rem', lineHeight: 1.55, color: T.ink, fontStyle: 'italic' }}>
                          "{row.weakness}"
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

const SIDEBAR_ITEMS = [
  { target: 'cover',             label: 'Introduction',          accent: T.greyLine,  section: 'Overview' },
  { target: 'qual-systems',      label: 'Systems & Complexity',  accent: T.teal,      section: 'Qualitative' },
  { target: 'qual-contextual',   label: 'Contextual',            accent: T.teal,      section: null },
  { target: 'qual-diagnostic',   label: 'Diagnostic',            accent: T.teal,      section: null },
  { target: 'qual-eval-process', label: 'Evaluative — Process',  accent: T.teal,      section: null },
  { target: 'qual-eval-impact',  label: 'Evaluative — Impact',   accent: T.teal,      section: null },
  { target: 'qual-strategic',    label: 'Strategic',             accent: T.teal,      section: null },
  { target: 'quant-description', label: 'Description',           accent: T.purple,    section: 'Quantitative' },
  { target: 'quant-prediction',  label: 'Prediction',            accent: T.purple,    section: null },
  { target: 'quant-causal',      label: 'Causal Inference',      accent: T.purple,    section: null },
  { target: 'tl-map',            label: 'Stage Mapping',         accent: T.green,     section: 'Test & Learn' },
]

export default function PageQuestionFramework() {
  const navigate = useNavigate()
  const [activeSection, setActiveSection] = useState('cover')
  const observerRef = useRef(null)

  useEffect(() => {
    const sections = SIDEBAR_ITEMS.map(i => document.getElementById(i.target)).filter(Boolean)
    observerRef.current = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) setActiveSection(entry.target.id)
      })
    }, { rootMargin: '-20% 0px -60% 0px', threshold: 0 })
    sections.forEach(s => observerRef.current.observe(s))
    return () => observerRef.current && observerRef.current.disconnect()
  }, [])

  function scrollTo(id) {
    const el = document.getElementById(id)
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <div>
      <PageHeader title="A Typology of Research Questions" />
      <div className="page-content tool-column tool-column--wide">

        {/* On this page — replaces the standalone sidebar this page used to
            carry, so the app sidebar stays the only persistent navigation. */}
        <nav className="toc-panel" aria-label="On this page">
          <div className="toc-panel__label">On this page</div>
          <div className="toc-panel__list">
            {SIDEBAR_ITEMS.map(item => (
              <button
                key={item.target}
                type="button"
                className="toc-panel__item"
                aria-current={activeSection === item.target}
                onClick={() => scrollTo(item.target)}
              >
                <span className="toc-panel__dot" style={{ background: item.accent }} />
                {item.label}
              </button>
            ))}
          </div>
        </nav>

        <div>

          {/* Cover */}
          <div id="cover" style={{ borderLeft: `4px solid ${T.purple}`, paddingLeft: '1.5rem', marginBottom: '2.5rem', paddingBottom: '2rem', borderBottom: `1px solid ${T.greyLine}`, scrollMarginTop: '2rem' }}>
            <div style={{ fontSize: '0.7rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: T.greyText, marginBottom: '0.5rem' }}>Analytical Framework</div>
            <p className="govuk-body" style={{ maxWidth: '620px' }}>
              A combined qualitative and quantitative framework for classifying research questions, selecting appropriate methods, and locating analytical work within the Magenta Book Test and Learn policy cycle. Updated to reflect the Test and Learn Annex (May 2026).
            </p>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              {['Click any row to expand methods & assumptions', 'Qual: Ritchie & Lewis (2003) extended', 'Quant: Herman & Hsu (2017) extended', 'T&L: Magenta Book Annex (2026)'].map(tag => (
                <span key={tag} style={{ fontSize: '0.72rem', color: T.greyText, background: T.greyBg, padding: '0.2rem 0.6rem', border: `1px solid ${T.greyLine}` }}>{tag}</span>
              ))}
            </div>
          </div>

          {/* Qualitative section */}
          <div id="qual-section" style={{ marginBottom: '3.5rem', scrollMarginTop: '2rem' }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '1rem', marginBottom: '0.5rem', paddingBottom: '0.6rem', borderBottom: `2px solid ${T.greyLine}` }}>
              <div style={{ width: '3px', height: '1.5rem', background: T.teal, flexShrink: 0 }} />
              <div>
                <div style={{ fontSize: '0.65rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: T.greyText, marginBottom: '0.2rem' }}>Part One</div>
                <h2 className="govuk-heading-m" style={{ marginBottom: 0 }}>Qualitative Research Questions</h2>
              </div>
            </div>
            <p className="govuk-body" style={{ maxWidth: '700px' }}>
              Six question types distinguished by the kind of claim being made, not the topic. Positioned within the Test and Learn framework from Explore through to Grow. Qualitative work is not confined to process evaluation — evaluative-impact questions have legitimate qualitative homes.
            </p>
          </div>

          <div style={{ marginTop: '-2rem', marginBottom: '3rem' }}>
            <FrameworkTable data={qualData} isQuant={false} />
          </div>

          {/* Quantitative section */}
          <div id="quant-section" style={{ marginBottom: '3.5rem', scrollMarginTop: '2rem' }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '1rem', marginBottom: '0.5rem', paddingBottom: '0.6rem', borderBottom: `2px solid ${T.greyLine}` }}>
              <div style={{ width: '3px', height: '1.5rem', background: T.purple, flexShrink: 0 }} />
              <div>
                <div style={{ fontSize: '0.65rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: T.greyText, marginBottom: '0.2rem' }}>Part Two</div>
                <h2 className="govuk-heading-m" style={{ marginBottom: 0 }}>Quantitative Research Questions</h2>
              </div>
            </div>
            <p className="govuk-body" style={{ maxWidth: '700px' }}>
              Three question types forming a hierarchy of claim strength. Each stronger type requires a stronger identification strategy to support it.
            </p>

            {/* Hierarchy strip */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 0, marginBottom: '1.5rem', overflowX: 'auto' }}>
              {[
                { label: 'Description',     sub: 'What is the case?',          bg: T.teal    },
                { label: 'Prediction',      sub: 'What tends to occur?',       bg: T.green   },
                { label: 'Causal Inference',sub: 'What is the effect of X on Y?', bg: T.purple  },
              ].map((block, i, arr) => (
                <>
                  <div key={block.label} style={{ padding: '0.5rem 0.85rem', color: 'white', whiteSpace: 'nowrap', flexShrink: 0, background: block.bg }}>
                    <div style={{ fontWeight: 600, fontSize: '0.78rem' }}>{block.label}</div>
                    <div style={{ fontSize: '0.65rem', opacity: 0.82, marginTop: '0.1rem' }}>{block.sub}</div>
                  </div>
                  {i < arr.length - 1 && <span style={{ fontSize: '0.9rem', color: T.greyLine, flexShrink: 0, padding: '0 0.1rem' }}>→</span>}
                </>
              ))}
              <div style={{ fontSize: '0.7rem', color: T.greyText, paddingLeft: '0.75rem', borderLeft: `1px solid ${T.greyLine}`, marginLeft: '0.5rem', lineHeight: 1.5, flexShrink: 0 }}>
                Each type makes a stronger claim<br />and requires stronger assumptions.
              </div>
            </div>

            {/* Drivers callout */}
            <Alert type="blue" title="Boundary case — 'drivers' and 'risk factor' questions">
              <p style={{ marginBottom: '0.4rem' }}>These are among the most frequently misclassified question types. The language implies causation but the methods used typically support only associational claims.</p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.6rem', marginTop: '0.5rem' }}>
                <div style={{ background: 'white', border: `1px solid ${T.greyLine}`, padding: '0.55rem 0.7rem', fontSize: '0.76rem', lineHeight: 1.5 }}>
                  <div style={{ fontWeight: 600, fontSize: '0.69rem', marginBottom: '0.2rem', color: T.teal }}>→ Prediction</div>
                  <em>"Which factors are associated with reoffending?"</em><br />
                  Regression, descriptive modelling. Reports association.
                </div>
                <div style={{ background: 'white', border: `1px solid ${T.greyLine}`, padding: '0.55rem 0.7rem', fontSize: '0.76rem', lineHeight: 1.5 }}>
                  <div style={{ fontWeight: 600, fontSize: '0.69rem', marginBottom: '0.2rem', color: T.purple25 }}>→ Causal Inference</div>
                  <em>"Does housing instability cause reoffending?"</em><br />
                  Requires a credible identification strategy.
                </div>
              </div>
            </Alert>
          </div>

          <div style={{ marginTop: '-1rem', marginBottom: '3rem' }}>
            <FrameworkTable data={quantData} isQuant={true} />
          </div>

          {/* T&L mapping */}
          <div id="tl-map" style={{ marginBottom: '3.5rem', scrollMarginTop: '2rem' }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '1rem', marginBottom: '0.5rem', paddingBottom: '0.6rem', borderBottom: `2px solid ${T.greyLine}` }}>
              <div style={{ width: '3px', height: '1.5rem', background: T.green, flexShrink: 0 }} />
              <div>
                <div style={{ fontSize: '0.65rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: T.greyText, marginBottom: '0.2rem' }}>Part Three · Magenta Book Test &amp; Learn Annex (2026)</div>
                <h2 className="govuk-heading-m" style={{ marginBottom: 0 }}>Question Types Across the Test and Learn Cycle</h2>
              </div>
            </div>
            <p className="govuk-body" style={{ maxWidth: '700px' }}>
              The Test and Learn framework organises evaluation activity around four stages: Explore, Co-design, Test, and Grow. Different question types belong at different stages.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 0, border: `1px solid ${T.greyLine}`, overflow: 'hidden', marginBottom: '1.5rem' }}>
              {[
                { name: 'Explore',   bg: T.greyText,    q: 'What is the system? What is the problem?',            badges: [['Systems & Complexity',T.greyBg,T.greyText],['Contextual',T.greyBg,T.greyText],['Diagnostic',T.greyBg,T.greyText],['Description',T.greyBg,T.greyText]], purpose: 'Build shared understanding of the system. Map actors, relationships, feedback loops, and behavioural drivers.', methods: 'Systems mapping · Actor mapping · SSM · Stakeholder engagement · Descriptive data analysis · Behavioural diagnosis', output: 'Outputs: shared system map, behavioural analysis, evidence gaps, leverage point assessment' },
                { name: 'Co-design', bg: T.magenta25,   q: 'What might work? What do people need?',               badges: [['Strategic',T.magentaTint,T.magenta25],['Systems & Complexity',T.magentaTint,T.magenta25],['Contextual',T.magentaTint,T.magenta25],['Description',T.magentaTint,T.magenta25],['Prediction',T.magentaTint,T.magenta25]], purpose: 'Generate and compare intervention options. Build a Theory of Change. Test paper prototypes with users and staff.', methods: 'Co-production workshops · Prototype testing · Think-aloud testing · Journey mapping · Theory of Change development', output: 'Outputs: prioritised prototypes, initial Theory of Change, refined assumptions' },
                { name: 'Test',      bg: T.purple25,    q: 'Are the critical assumptions holding?',               badges: [['Diagnostic',T.purpleTint,T.purple25],['Evaluative — Process',T.purpleTint,T.purple25],['Evaluative — Impact',T.purpleTint,T.purple25],['Prediction',T.purpleTint,T.purple25],['Causal — Efficacy',T.purpleTint,T.purple25]], purpose: 'Test riskiest assumptions in real-world settings. Examine whether mechanisms are operating as expected. Assess early behavioural signals.', methods: 'Qualitative sprints · A/B testing · Nimble RCTs · Mechanism experiments · Bayesian adaptive trials · Process evaluation techniques', output: 'Outputs: evidence on critical assumptions, updated ToC, decision to iterate/continue/stop' },
                { name: 'Grow',      bg: T.teal25,      q: 'Does it work at scale, for whom, at what cost?',      badges: [['Evaluative — Process',T.tealTint,T.teal25],['Evaluative — Impact',T.tealTint,T.teal25],['Causal — Effectiveness',T.tealTint,T.teal25]], purpose: 'Robustly evaluate a stable, well-specified intervention. Establish whether it achieves intended outcomes, for whom, and at what cost.', methods: 'RCT · DiD · RDD · ITS · IV · Matching/PSM · Realist evaluation · Contribution analysis · Value for money analysis', output: 'Outputs: impact findings, process evaluation, VfM assessment, scale/adapt/stop recommendation' },
              ].map(stage => (
                <div key={stage.name} style={{ borderRight: `1px solid ${T.greyLine}` }}>
                  <div style={{ padding: '0.65rem 0.85rem', color: 'white', borderBottom: '1px solid rgba(255,255,255,0.2)', background: stage.bg }}>
                    <div style={{ fontWeight: 600, fontSize: '0.85rem', marginBottom: '0.15rem' }}>{stage.name}</div>
                    <div style={{ fontSize: '0.68rem', opacity: 0.85 }}>{stage.q}</div>
                  </div>
                  <div style={{ padding: '0.75rem 0.85rem', background: 'white' }}>
                    <div style={{ fontSize: '0.6rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: T.greyText, marginBottom: '0.4rem' }}>Primary question types</div>
                    {stage.badges.map(([label, bg, fg]) => (
                      <span key={label} style={{ display: 'inline-block', fontSize: '0.68rem', fontWeight: 500, padding: '0.15rem 0.5rem', margin: '0.15rem 0.15rem 0.15rem 0', lineHeight: 1.4, background: bg, color: fg }}>{label}</span>
                    ))}
                    <div style={{ fontSize: '0.6rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: T.greyText, marginBottom: '0.4rem', marginTop: '0.6rem' }}>Analytical purpose</div>
                    <div style={{ fontSize: '0.75rem', color: T.greyText, lineHeight: 1.55 }}>{stage.purpose}</div>
                    <div style={{ fontSize: '0.6rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: T.greyText, marginBottom: '0.4rem', marginTop: '0.6rem' }}>Typical methods</div>
                    <div style={{ fontSize: '0.73rem', color: T.greyText, lineHeight: 1.5 }}>{stage.methods}</div>
                    <div style={{ fontSize: '0.72rem', color: T.greyText, lineHeight: 1.5, marginTop: '0.6rem', fontStyle: 'italic', paddingTop: '0.5rem', borderTop: `1px solid ${T.greyLine}` }}>{stage.output}</div>
                  </div>
                </div>
              ))}
            </div>

            <Alert type="yellow" title="On causal inference across stages">
              The identification standard for causal questions does not relax at the Test stage. A nimble RCT, A/B test, or mechanism experiment still requires a valid identification strategy — what changes is the <em>estimand</em> (a specific component or mechanism rather than whole-programme effectiveness) and the <em>decision it informs</em>.
            </Alert>
          </div>

          {/* Footer */}
          <div style={{ marginTop: '3rem', paddingTop: '1rem', borderTop: `1px solid ${T.greyLine}`, display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
            <p className="govuk-body-s" style={{ color: T.greyText }}><strong>Qualitative references:</strong> Ritchie &amp; Lewis (2003); Pawson &amp; Tilley (1997); Mayne (2001); Mason (2002); Checkland (2000)</p>
            <p className="govuk-body-s" style={{ color: T.greyText }}><strong>Quantitative references:</strong> Herman &amp; Hsu (2017); Hernán &amp; Robins (2020); Angrist &amp; Pischke (2009); Huntington-Klein (2021)</p>
            <p className="govuk-body-s" style={{ color: T.greyText }}><strong>Policy cycle:</strong> HM Treasury Magenta Book (2020); Test and Learn Annex (2026); Nesta Test and Learn Playbook</p>
          </div>

          <NavButtons>
            <Button variant="secondary" onClick={() => navigate('/')}>← Home</Button>
          </NavButtons>
        </div>
      </div>
    </div>
  )
}
