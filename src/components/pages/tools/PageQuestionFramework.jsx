import { useState, useEffect, useRef } from 'react'
import { qualData, quantData } from '../../../data/questionFrameworkData.js'

function hexToRgba(hex, alpha) {
  const r = parseInt(hex.slice(1,3), 16), g = parseInt(hex.slice(3,5), 16), b = parseInt(hex.slice(5,7), 16)
  return `rgba(${r},${g},${b},${alpha})`
}

const TL_MAP = { 'Explore': 'tl-explore', 'Co-design': 'tl-codesign', 'Test': 'tl-test', 'Grow': 'tl-grow' }
const TL_STYLES = {
  Explore: { background: '#e8f4e8', color: '#1a5a2a' },
  'Co-design': { background: '#e8eef8', color: '#1a3a6a' },
  Test: { background: '#f5eaf8', color: '#5a1a6a' },
  Grow: { background: '#fef0e0', color: '#6a3a1a' },
}

function TlTag({ stage }) {
  return (
    <span style={{
      fontFamily: "'DM Sans', sans-serif", fontSize: '0.65rem', fontWeight: 600,
      padding: '0.15rem 0.4rem', borderRadius: '2px', textAlign: 'center',
      display: 'inline-block', marginBottom: '0.25rem', marginRight: '0.15rem',
      ...(TL_STYLES[stage] || {}),
    }}>
      {stage}
    </span>
  )
}

function claimDotsHtml(n, accent) {
  return Array.from({ length: 3 }, (_, i) => (
    <span key={i} style={{
      width: '7px', height: '7px', borderRadius: '50%',
      background: i < n ? accent : '#ddd',
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
        fontFamily: "'DM Sans', sans-serif",
        fontSize: '0.64rem',
        letterSpacing: '0.1em',
        textTransform: 'uppercase',
        color: '#999',
        borderBottom: '1px solid #d0c9bc',
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
                background: isActive ? '#eee9e3' : '#faf8f5',
                marginBottom: '0.25rem',
                cursor: 'pointer',
                transition: 'background 0.15s',
                borderRadius: '0 4px 4px 0',
                userSelect: 'none',
              }}
            >
              <div>
                <div style={{ fontFamily: "'Source Serif 4', Georgia, serif", fontWeight: 600, fontSize: '0.9rem', color: row.color, marginBottom: '0.2rem', lineHeight: 1.3 }}>
                  {row.type}
                </div>
                <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '0.68rem', display: 'inline-block', padding: '0.12rem 0.45rem', borderRadius: '2px', background: ab, color: row.color, border: `1px solid ${abo}`, marginTop: '0.2rem' }}>
                  {row.signal}
                </span>
                {isQuant && (
                  <div style={{ marginTop: '0.35rem', fontFamily: "'DM Sans', sans-serif", fontSize: '0.68rem', color: '#888' }}>
                    {claimDotsHtml(row.claimDots, row.accent)}
                    {row.claimDots === 3 ? 'Causal' : row.claimDots === 2 ? 'Associational' : 'Descriptive'} claim
                  </div>
                )}
              </div>
              <div>
                <div style={{ fontSize: '0.84rem', lineHeight: 1.5, color: '#333', marginBottom: '0.3rem' }}>
                  {row.logic}
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem' }}>
                  {row.signalPhrases.map((p, pi) => (
                    <span key={pi} style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '0.68rem', background: '#e0dbd2', color: '#555', padding: '0.1rem 0.45rem', borderRadius: '2px', fontStyle: 'italic' }}>
                      {p}
                    </span>
                  ))}
                </div>
              </div>
              <div>
                <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '0.78rem', fontWeight: 600, color: row.color, marginBottom: '0.15rem', lineHeight: 1.3 }}
                  dangerouslySetInnerHTML={{ __html: row.evalHome }} />
                <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '0.68rem', color: '#777', lineHeight: 1.35 }}>
                  {row.evalNote}
                </div>
                <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '0.67rem', color: '#999', textDecoration: 'underline', marginTop: '0.35rem', display: 'block' }}>
                  {isActive ? '▲ collapse' : '▼ expand'}
                </span>
              </div>
              <div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                  {row.tlStages.map(s => <TlTag key={s} stage={s} />)}
                </div>
              </div>
            </div>

            {/* Expand panel */}
            {isActive && (
              <div style={{
                background: '#fff',
                borderLeft: `4px solid ${row.accent}`,
                borderRadius: '0 4px 4px 0',
                padding: '1.1rem 1.25rem',
                marginBottom: '0.25rem',
                marginTop: '-0.2rem',
              }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
                  <div>
                    <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '0.63rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#999', marginBottom: '0.6rem' }}>
                      {isQuant ? 'Methods & Designs' : 'Qualitative Approaches'}
                    </div>
                    {methods.map((m, mi) => (
                      <div key={mi} style={{ display: 'flex', gap: '0.55rem', marginBottom: '0.5rem', alignItems: 'flex-start' }}>
                        <div style={{ width: '5px', height: '5px', borderRadius: '50%', background: row.accent, flexShrink: 0, marginTop: '6px' }} />
                        <div>
                          <span style={{ fontSize: '0.85rem', fontWeight: 600, color: row.color, display: 'block' }}>{m.name}</span>
                          <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '0.74rem', color: '#666', lineHeight: 1.35 }}>
                            {isQuant ? m.note : '— ' + m.note}
                          </span>
                        </div>
                      </div>
                    ))}
                    {!isQuant && (
                      <div style={{ background: '#fdf6ee', border: '1px solid #e8d5b8', borderRadius: '4px', padding: '0.65rem 0.85rem', fontSize: '0.82rem', lineHeight: 1.55, color: '#555', fontStyle: 'italic', marginTop: '0.75rem' }}>
                        "{row.weakness}"
                      </div>
                    )}
                  </div>
                  <div>
                    {isQuant ? (
                      <>
                        <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '0.63rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#999', marginBottom: '0.6rem' }}>Key Assumptions</div>
                        <div style={{ background: '#f0f4fa', border: '1px solid #c0d0e8', borderRadius: '4px', padding: '0.65rem 0.85rem', fontFamily: "'DM Sans', sans-serif", fontSize: '0.76rem', lineHeight: 1.5, color: '#2a3a5a' }}>
                          {row.assumptions.map((a, ai) => (
                            <div key={ai} style={{ display: 'flex', gap: '0.4rem', marginBottom: '0.25rem', alignItems: 'flex-start', fontSize: '0.75rem' }}>
                              <span style={{ color: row.accent, flexShrink: 0 }}>▸</span>
                              <span><strong>{a.label}:</strong> {a.note}</span>
                            </div>
                          ))}
                        </div>
                        {row.extraNote && (
                          <div style={{ marginTop: '0.75rem', background: '#f4f0fa', border: '1px solid #c8b8e8', borderRadius: '4px', padding: '0.6rem 0.85rem', fontFamily: "'DM Sans', sans-serif", fontSize: '0.76rem', color: '#3a2a5a', lineHeight: 1.55 }}>
                            <strong>Efficacy vs Effectiveness:</strong> {row.extraNote}
                          </div>
                        )}
                        <div style={{ background: '#fdf6ee', border: '1px solid #e8d5b8', borderRadius: '4px', padding: '0.65rem 0.85rem', fontSize: '0.82rem', lineHeight: 1.55, color: '#555', fontStyle: 'italic', marginTop: '0.75rem' }}>
                          "{row.weakness}"
                        </div>
                      </>
                    ) : (
                      <>
                        <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '0.63rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#999', marginBottom: '0.6rem' }}>Common Commissioning Pitfall</div>
                        <div style={{ background: '#fdf6ee', border: '1px solid #e8d5b8', borderRadius: '4px', padding: '0.65rem 0.85rem', fontSize: '0.82rem', lineHeight: 1.55, color: '#555', fontStyle: 'italic' }}>
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
  { target: 'cover', label: 'Introduction', accent: '#4a9eda', section: 'Overview' },
  { target: 'qual-systems', label: 'Systems & Complexity', accent: '#2a8a5a', section: 'Qualitative' },
  { target: 'qual-contextual', label: 'Contextual', accent: '#4a9eda', section: null },
  { target: 'qual-diagnostic', label: 'Diagnostic', accent: '#4acba0', section: null },
  { target: 'qual-eval-process', label: 'Evaluative — Process', accent: '#9a7eda', section: null },
  { target: 'qual-eval-impact', label: 'Evaluative — Impact', accent: '#e07a4a', section: null },
  { target: 'qual-strategic', label: 'Strategic', accent: '#c8b84a', section: null },
  { target: 'quant-description', label: 'Description', accent: '#3a80b8', section: 'Quantitative' },
  { target: 'quant-prediction', label: 'Prediction', accent: '#2a9a6a', section: null },
  { target: 'quant-causal', label: 'Causal Inference', accent: '#8a4aba', section: null },
  { target: 'tl-map', label: 'Stage Mapping', accent: '#e07a2a', section: 'Test & Learn' },
]

export default function PageQuestionFramework() {
  const [activeSection, setActiveSection] = useState('cover')
  const observerRef = useRef(null)

  useEffect(() => {
    const sections = SIDEBAR_ITEMS.map(i => document.getElementById(i.target)).filter(Boolean)
    observerRef.current = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          setActiveSection(entry.target.id)
        }
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
    <div style={{ display: 'flex', minHeight: '100%', fontFamily: "'Source Serif 4', Georgia, serif", background: '#f5f2ed', color: '#1a1a1a' }}>
      {/* Sidebar */}
      <nav style={{
        width: '220px', minWidth: '220px', background: '#1c2a3a', minHeight: '100vh',
        position: 'sticky', top: '0', height: '100vh', overflowY: 'auto',
        display: 'flex', flexDirection: 'column', flexShrink: 0,
      }}>
        <div style={{ padding: '1.25rem 1rem 0.75rem', borderBottom: '1px solid rgba(255,255,255,0.1)', marginBottom: '0.5rem' }}>
          <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '0.6rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)', marginBottom: '0.3rem' }}>Analytical Framework</div>
          <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '0.82rem', fontWeight: 600, color: 'rgba(255,255,255,0.9)', lineHeight: 1.3 }}>Research Question Typology</div>
        </div>

        {(() => {
          let lastSection = null
          return SIDEBAR_ITEMS.map((item, i) => {
            const sectionLabel = item.section && item.section !== lastSection ? (() => { lastSection = item.section; return item.section })() : null
            return (
              <div key={item.target}>
                {sectionLabel && (
                  <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '0.6rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.3)', padding: '0.75rem 1rem 0.3rem' }}>
                    {i > 0 && <div style={{ height: '1px', background: 'rgba(255,255,255,0.08)', marginBottom: '0.75rem', marginTop: '-0.3rem' }} />}
                    {sectionLabel}
                  </div>
                )}
                <button
                  onClick={() => scrollTo(item.target)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '0.5rem',
                    padding: '0.4rem 1rem', width: '100%', textAlign: 'left',
                    fontFamily: "'DM Sans', sans-serif", fontSize: '0.78rem',
                    color: activeSection === item.target ? '#fff' : 'rgba(255,255,255,0.6)',
                    background: activeSection === item.target ? 'rgba(255,255,255,0.08)' : 'none',
                    border: 'none', borderLeft: `3px solid ${activeSection === item.target ? item.accent : 'transparent'}`,
                    cursor: 'pointer', lineHeight: 1.35,
                  }}
                >
                  <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: item.accent, flexShrink: 0, opacity: activeSection === item.target ? 1 : 0.7 }} />
                  {item.label}
                </button>
              </div>
            )
          })
        })()}

        <div style={{ marginTop: 'auto', padding: '0.75rem 1rem', fontFamily: "'DM Sans', sans-serif", fontSize: '0.62rem', color: 'rgba(255,255,255,0.25)', borderTop: '1px solid rgba(255,255,255,0.08)', lineHeight: 1.5 }}>
          Magenta Book (2020, updated 2026)<br />
          Test &amp; Learn Annex (2026)<br />
          Ritchie &amp; Lewis (2003)<br />
          Herman &amp; Hsu (2017)
        </div>
      </nav>

      {/* Main content */}
      <main style={{ flex: 1, minWidth: 0, padding: '2.5rem 2.5rem 4rem', maxWidth: '960px' }}>

        {/* Cover */}
        <div id="cover" style={{ borderLeft: '4px solid #1c3f5e', paddingLeft: '1.5rem', marginBottom: '2.5rem', paddingBottom: '2rem', borderBottom: '1px solid #d0c9bc', scrollMarginTop: '2rem' }}>
          <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '0.7rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: '#777', marginBottom: '0.5rem' }}>Analytical Framework</div>
          <h1 style={{ fontSize: '1.9rem', fontWeight: 300, lineHeight: 1.2, color: '#1a1a1a', marginBottom: '0.6rem' }}>A Typology of Research Questions</h1>
          <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '0.9rem', color: '#444', maxWidth: '620px', lineHeight: 1.65, marginBottom: '1.25rem' }}>
            A combined qualitative and quantitative framework for classifying research questions, selecting appropriate methods, and locating analytical work within the Magenta Book Test and Learn policy cycle. Updated to reflect the Test and Learn Annex (May 2026).
          </p>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            {['Click any row to expand methods & assumptions', 'Qual: Ritchie & Lewis (2003) extended', 'Quant: Herman & Hsu (2017) extended', 'T&L: Magenta Book Annex (2026)'].map(tag => (
              <span key={tag} style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '0.72rem', color: '#555', background: '#e0dbd2', padding: '0.2rem 0.6rem', borderRadius: '2px' }}>{tag}</span>
            ))}
          </div>
        </div>

        {/* Qualitative section */}
        <div id="qual-section" style={{ marginBottom: '3.5rem', scrollMarginTop: '2rem' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '1rem', marginBottom: '0.5rem', paddingBottom: '0.6rem', borderBottom: '2px solid #d0c9bc' }}>
            <div style={{ width: '3px', height: '1.5rem', borderRadius: '2px', background: '#4a9eda', flexShrink: 0 }} />
            <div>
              <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '0.65rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: '#aaa', marginBottom: '0.2rem' }}>Part One</div>
              <h2 style={{ fontSize: '1.3rem', fontWeight: 400, color: '#1a1a1a' }}>Qualitative Research Questions</h2>
            </div>
          </div>
          <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '0.88rem', color: '#444', lineHeight: 1.65, marginBottom: '1.25rem', maxWidth: '700px' }}>
            Six question types distinguished by the kind of claim being made, not the topic. Positioned within the Test and Learn framework from Explore through to Grow. Qualitative work is not confined to process evaluation — evaluative-impact questions have legitimate qualitative homes.
          </p>
        </div>

        <div style={{ marginTop: '-2rem', marginBottom: '3rem' }}>
          <FrameworkTable data={qualData} isQuant={false} />
        </div>

        {/* Quantitative section */}
        <div id="quant-section" style={{ marginBottom: '3.5rem', scrollMarginTop: '2rem' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '1rem', marginBottom: '0.5rem', paddingBottom: '0.6rem', borderBottom: '2px solid #d0c9bc' }}>
            <div style={{ width: '3px', height: '1.5rem', borderRadius: '2px', background: '#3a80b8', flexShrink: 0 }} />
            <div>
              <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '0.65rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: '#aaa', marginBottom: '0.2rem' }}>Part Two</div>
              <h2 style={{ fontSize: '1.3rem', fontWeight: 400, color: '#1a1a1a' }}>Quantitative Research Questions</h2>
            </div>
          </div>
          <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '0.88rem', color: '#444', lineHeight: 1.65, marginBottom: '1.25rem', maxWidth: '700px' }}>
            Three question types forming a hierarchy of claim strength. Each stronger type requires a stronger identification strategy to support it.
          </p>

          {/* Hierarchy strip */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 0, marginBottom: '1.5rem', overflowX: 'auto' }}>
            {[
              { label: 'Description', sub: 'What is the case?', bg: '#2a6496' },
              { label: 'Prediction', sub: 'What tends to occur?', bg: '#1a7a5a' },
              { label: 'Causal Inference', sub: 'What is the effect of X on Y?', bg: '#5a2a6a' },
            ].map((block, i, arr) => (
              <>
                <div key={block.label} style={{ padding: '0.5rem 0.85rem', color: 'white', whiteSpace: 'nowrap', flexShrink: 0, background: block.bg }}>
                  <div style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 600, fontSize: '0.78rem' }}>{block.label}</div>
                  <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '0.65rem', opacity: 0.82, marginTop: '0.1rem' }}>{block.sub}</div>
                </div>
                {i < arr.length - 1 && <span style={{ fontSize: '0.9rem', color: '#bbb', flexShrink: 0, padding: '0 0.1rem' }}>→</span>}
              </>
            ))}
            <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '0.7rem', color: '#777', paddingLeft: '0.75rem', borderLeft: '1px solid #d0c9bc', marginLeft: '0.5rem', lineHeight: 1.5, flexShrink: 0 }}>
              Each type makes a stronger claim<br />and requires stronger assumptions.
            </div>
          </div>

          {/* Drivers callout */}
          <div style={{ background: '#f4f0fa', border: '1px solid #c8b8e8', borderLeft: '4px solid #7a5aba', borderRadius: '0 4px 4px 0', padding: '0.85rem 1rem', fontFamily: "'DM Sans', sans-serif", fontSize: '0.82rem', lineHeight: 1.6, color: '#3a2a5a', margin: '0.75rem 0 1.25rem', display: 'flex', gap: '0.75rem' }}>
            <span style={{ flexShrink: 0 }}>⬧</span>
            <div>
              <p style={{ color: '#3a2a5a', marginBottom: '0.4rem' }}><strong>Boundary case — "drivers" and "risk factor" questions</strong></p>
              <p style={{ color: '#3a2a5a', marginBottom: '0.4rem' }}>These are among the most frequently misclassified question types. The language implies causation but the methods used typically support only associational claims.</p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.6rem', marginTop: '0.5rem' }}>
                <div style={{ background: 'white', borderRadius: '3px', padding: '0.55rem 0.7rem', fontSize: '0.76rem', lineHeight: 1.5 }}>
                  <div style={{ fontWeight: 600, fontSize: '0.69rem', marginBottom: '0.2rem', color: '#1a5a8a' }}>→ Prediction</div>
                  <em>"Which factors are associated with reoffending?"</em><br />
                  Regression, descriptive modelling. Reports association.
                </div>
                <div style={{ background: 'white', borderRadius: '3px', padding: '0.55rem 0.7rem', fontSize: '0.76rem', lineHeight: 1.5 }}>
                  <div style={{ fontWeight: 600, fontSize: '0.69rem', marginBottom: '0.2rem', color: '#3a1a5a' }}>→ Causal Inference</div>
                  <em>"Does housing instability cause reoffending?"</em><br />
                  Requires a credible identification strategy.
                </div>
              </div>
            </div>
          </div>
        </div>

        <div style={{ marginTop: '-1rem', marginBottom: '3rem' }}>
          <FrameworkTable data={quantData} isQuant={true} />
        </div>

        {/* T&L mapping */}
        <div id="tl-map" style={{ marginBottom: '3.5rem', scrollMarginTop: '2rem' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '1rem', marginBottom: '0.5rem', paddingBottom: '0.6rem', borderBottom: '2px solid #d0c9bc' }}>
            <div style={{ width: '3px', height: '1.5rem', borderRadius: '2px', background: '#e07a2a', flexShrink: 0 }} />
            <div>
              <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '0.65rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: '#aaa', marginBottom: '0.2rem' }}>Part Three · Magenta Book Test &amp; Learn Annex (2026)</div>
              <h2 style={{ fontSize: '1.3rem', fontWeight: 400, color: '#1a1a1a' }}>Question Types Across the Test and Learn Cycle</h2>
            </div>
          </div>
          <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '0.88rem', color: '#444', lineHeight: 1.65, marginBottom: '1.5rem', maxWidth: '700px' }}>
            The Test and Learn framework organises evaluation activity around four stages: Explore, Co-design, Test, and Grow. Different question types belong at different stages.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 0, border: '1px solid #d0c9bc', borderRadius: '6px', overflow: 'hidden', marginBottom: '1.5rem' }}>
            {[
              { name: 'Explore', q: 'What is the system? What is the problem?', bg: '#1a5a2a', badges: [['Systems & Complexity','#e8f4e8','#1a5a2a'],['Contextual','#e8f2fc','#1a3a5c'],['Diagnostic','#e8f7f2','#1a4a3a'],['Description','#e8f4fc','#1c3f5e']], purpose: 'Build shared understanding of the system. Map actors, relationships, feedback loops, and behavioural drivers.', methods: 'Systems mapping · Actor mapping · SSM · Stakeholder engagement · Descriptive data analysis · Behavioural diagnosis', output: 'Outputs: shared system map, behavioural analysis, evidence gaps, leverage point assessment' },
              { name: 'Co-design', q: 'What might work? What do people need?', bg: '#1a3a6a', badges: [['Strategic','#faf5e0','#3a3a1a'],['Systems & Complexity','#e8f4e8','#1a5a2a'],['Contextual','#e8f2fc','#1a3a5c'],['Description','#e8f4fc','#1c3f5e'],['Prediction','#eaf7f2','#1a4a2a']], purpose: 'Generate and compare intervention options. Build a Theory of Change. Test paper prototypes with users and staff.', methods: 'Co-production workshops · Prototype testing · Think-aloud testing · Journey mapping · Theory of Change development', output: 'Outputs: prioritised prototypes, initial Theory of Change, refined assumptions' },
              { name: 'Test', q: 'Are the critical assumptions holding?', bg: '#4a1a6a', badges: [['Diagnostic','#e8f7f2','#1a4a3a'],['Evaluative — Process','#f0ebfc','#3a2a5c'],['Evaluative — Impact','#fdf0e8','#4a2a1a'],['Prediction','#eaf7f2','#1a4a2a'],['Causal — Efficacy','#f0ebff','#3a1a5a']], purpose: 'Test riskiest assumptions in real-world settings. Examine whether mechanisms are operating as expected. Assess early behavioural signals.', methods: 'Qualitative sprints · A/B testing · Nimble RCTs · Mechanism experiments · Bayesian adaptive trials · Process evaluation techniques', output: 'Outputs: evidence on critical assumptions, updated ToC, decision to iterate/continue/stop' },
              { name: 'Grow', q: 'Does it work at scale, for whom, at what cost?', bg: '#6a3a1a', badges: [['Evaluative — Process','#f0ebfc','#3a2a5c'],['Evaluative — Impact','#fdf0e8','#4a2a1a'],['Causal — Effectiveness','#f0ebff','#3a1a5a']], purpose: 'Robustly evaluate a stable, well-specified intervention. Establish whether it achieves intended outcomes, for whom, and at what cost.', methods: 'RCT · DiD · RDD · ITS · IV · Matching/PSM · Realist evaluation · Contribution analysis · Value for money analysis', output: 'Outputs: impact findings, process evaluation, VfM assessment, scale/adapt/stop recommendation' },
            ].map(stage => (
              <div key={stage.name} style={{ borderRight: '1px solid #d0c9bc' }}>
                <div style={{ padding: '0.65rem 0.85rem', color: 'white', borderBottom: '1px solid rgba(255,255,255,0.2)', background: stage.bg }}>
                  <div style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 600, fontSize: '0.85rem', marginBottom: '0.15rem' }}>{stage.name}</div>
                  <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '0.68rem', opacity: 0.85 }}>{stage.q}</div>
                </div>
                <div style={{ padding: '0.75rem 0.85rem', background: 'white' }}>
                  <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '0.6rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#aaa', marginBottom: '0.4rem' }}>Primary question types</div>
                  {stage.badges.map(([label, bg, fg]) => (
                    <span key={label} style={{ display: 'inline-block', fontFamily: "'DM Sans', sans-serif", fontSize: '0.68rem', fontWeight: 500, padding: '0.15rem 0.5rem', borderRadius: '2px', margin: '0.15rem 0.15rem 0.15rem 0', lineHeight: 1.4, background: bg, color: fg }}>{label}</span>
                  ))}
                  <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '0.6rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#aaa', marginBottom: '0.4rem', marginTop: '0.6rem' }}>Analytical purpose</div>
                  <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '0.75rem', color: '#444', lineHeight: 1.55 }}>{stage.purpose}</div>
                  <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '0.6rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#aaa', marginBottom: '0.4rem', marginTop: '0.6rem' }}>Typical methods</div>
                  <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '0.73rem', color: '#666', lineHeight: 1.5 }}>{stage.methods}</div>
                  <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '0.72rem', color: '#777', lineHeight: 1.5, marginTop: '0.6rem', fontStyle: 'italic', paddingTop: '0.5rem', borderTop: '1px solid #e0dbd2' }}>{stage.output}</div>
                </div>
              </div>
            ))}
          </div>

          <div style={{ background: '#fdf6ee', border: '1px solid #e8d5b8', borderRadius: '4px', padding: '0.6rem 0.85rem', fontFamily: "'DM Sans', sans-serif", fontSize: '0.75rem', lineHeight: 1.55, color: '#7a5a2a', display: 'flex', gap: '0.5rem' }}>
            <span>⚠</span>
            <span><strong>On causal inference across stages:</strong> The identification standard for causal questions does not relax at the Test stage. A nimble RCT, A/B test, or mechanism experiment still requires a valid identification strategy — what changes is the <em>estimand</em> (a specific component or mechanism rather than whole-programme effectiveness) and the <em>decision it informs</em>.</span>
          </div>
        </div>

        {/* Footer */}
        <div style={{ marginTop: '3rem', paddingTop: '1rem', borderTop: '1px solid #d0c9bc', fontFamily: "'DM Sans', sans-serif", fontSize: '0.73rem', color: '#999', display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
          <div><strong style={{ color: '#666' }}>Qualitative references:</strong> Ritchie &amp; Lewis (2003); Pawson &amp; Tilley (1997); Mayne (2001); Mason (2002); Checkland (2000)</div>
          <div><strong style={{ color: '#666' }}>Quantitative references:</strong> Herman &amp; Hsu (2017); Hernán &amp; Robins (2020); Angrist &amp; Pischke (2009); Huntington-Klein (2021)</div>
          <div><strong style={{ color: '#666' }}>Policy cycle:</strong> HM Treasury Magenta Book (2020); Test and Learn Annex (2026); Nesta Test and Learn Playbook</div>
        </div>
      </main>
    </div>
  )
}
