import { useNavigate } from 'react-router-dom'
import {
  Card, SectionTag, Alert, NavButtons, Button,
  RadioQuestion, When, LockedPage, TextArea, PageHeader,
} from '../ui/GovukComponents.jsx'

// Bayesian callout — shown when sample is small or tiny
function BayesianNote({ sampleSize }) {
  if (!sampleSize || (sampleSize !== 'tiny' && sampleSize !== 'small')) return null
  const isTiny = sampleSize === 'tiny'
  return (
    <div style={{
      background: '#f0ebfa',
      border: '1px solid #c8b0e8',
      borderLeft: '5px solid #4c2c92',
      padding: '16px 20px',
      marginBottom: '20px',
    }}>
      <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#4c2c92', marginBottom: '8px' }}>
        𝔅 Consider Bayesian analysis approaches
      </h3>
      <p style={{ fontSize: '13px', color: '#3a2a5a', lineHeight: 1.6, marginBottom: '8px' }}>
        {isTiny
          ? 'With a very small sample, classical frequentist methods will have very limited power. Bayesian analysis is particularly valuable here — it can incorporate prior information from similar interventions, produce honest posterior uncertainty, and update as data accumulate.'
          : 'With a small sample (20–99 units), statistical power will be a constraint for all designs. Bayesian approaches offer two concrete advantages: informative priors from prior evidence can improve precision without additional data; and Bayesian adaptive designs (for RCTs) can stop early for efficacy or futility, reducing sample requirements.'}
      </p>
      <ul style={{ fontSize: '13px', color: '#3a2a5a', paddingLeft: '18px', lineHeight: 1.75 }}>
        <li>Ask your statistician whether informative priors are defensible from existing evidence on similar interventions</li>
        <li>For RCTs: consider whether a Bayesian adaptive design or sequential analysis is appropriate</li>
        <li>Bayesian results (posterior distributions, credible intervals) require different communication to decision-makers than p-values</li>
        <li>The full feasibility tool's results page will flag power calculation as a next step if not yet completed</li>
      </ul>
    </div>
  )
}

export default function Page7({ inputs, set, gatePassed }) {
  const navigate = useNavigate()

  if (!gatePassed) return (
    <>
      <PageHeader title="Statistical Feasibility" />
      <div className="page-content"><LockedPage /></div>
    </>
  )

  return (
    <div>
      <PageHeader title="Statistical Feasibility" />
      <div className="page-content">
        <Alert type="blue" title="About this section">
          This section assesses the statistical feasibility of your evaluation. Your responses
          inform the feasibility scoring — particularly for designs requiring large samples,
          long follow-up, or specific prior data. The full feasibility tool also produces
          a recommended next steps panel highlighting any unanswered or uncertain questions.
        </Alert>

        {/* T&L contextual note */}
        <div style={{
          background: '#0b0c0c', padding: '12px 16px', marginBottom: '20px',
          fontSize: '13px', color: 'rgba(255,255,255,.65)', lineHeight: 1.6,
        }}>
          <strong style={{ color: '#fff' }}>T&amp;L stage context:</strong>{' '}
          At the <span style={{ background: '#f5eaf8', color: '#5a1a6a', fontWeight: 700, padding: '1px 6px', borderRadius: '2px' }}>Test</span> stage,
          power calculations often rely on estimates from similar programmes. At the{' '}
          <span style={{ background: '#fef0e0', color: '#6a3a1a', fontWeight: 700, padding: '1px 6px', borderRadius: '2px' }}>Grow</span> stage,
          prior data from the Test phase evaluation may be available to inform priors or assumptions.
        </div>

        <Card>
          <SectionTag>Sample Size &amp; Power</SectionTag>

          <div className="govuk-form-group">
            <label className="govuk-label govuk-label--s" htmlFor="p7_n">
              Estimated total sample size (treated + untreated)
            </label>
            <div className="govuk-hint">
              Total number of participants or units available for analysis. An order of
              magnitude is sufficient if the exact count is unknown. This feeds into RCT
              data scores (scaled against a reference of 500 units in config.js).
            </div>
            <input className="govuk-input govuk-input--width-10" id="p7_n" type="number"
              value={inputs.p7_n ?? ''} onChange={e => set('p7_n', e.target.value)} />
          </div>

          {/* Show Bayesian note immediately after sample size entry */}
          <BayesianNote sampleSize={
            (() => {
              const n = parseFloat(inputs.p7_n)
              if (!n || isNaN(n)) return null
              if (n < 20)  return 'tiny'
              if (n < 100) return 'small'
              return null
            })()
          } />

          <div className="govuk-form-group">
            <label className="govuk-label govuk-label--s" htmlFor="p7_mde">
              Minimum detectable effect size (MDE)
            </label>
            <div className="govuk-hint">
              The smallest effect your study needs to detect to be policy-relevant. Express
              as an absolute difference where possible (e.g. 3 percentage point reduction
              in reoffending).
            </div>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
              <input className="govuk-input govuk-input--width-10" id="p7_mde" type="number"
                value={inputs.p7_mde ?? ''} onChange={e => set('p7_mde', e.target.value)} />
              <input className="govuk-input govuk-input--width-20" id="p7_mde_unit" type="text"
                placeholder="Unit (e.g. percentage points, days)"
                value={inputs.p7_mde_unit ?? ''} onChange={e => set('p7_mde_unit', e.target.value)} />
            </div>
          </div>

          <RadioQuestion id="p7_power_done"
            label="Have you conducted or reviewed a formal power calculation?"
            hint="A power calculation estimates the sample size required to detect an effect at a specified significance level and power (typically 80–90%). For complex designs (cluster RCT, ITS, DiD), simulation-based power methods are more reliable than analytical approximations."
            value={inputs.p7_power_done} onChange={v => set('p7_power_done', v)}
            options={[
              { value: 'yes',   label: 'Yes — formal calculation completed' },
              { value: 'maybe', label: 'Partially — rough estimates only' },
              { value: 'no',    label: 'No — not yet done' },
            ]} inline />

          <When condition={inputs.p7_power_done && inputs.p7_power_done !== 'no'}>
            <div className="govuk-form-group">
              <label className="govuk-label govuk-label--s" htmlFor="p7_power_detail">
                Summarise your power calculation assumptions
              </label>
              <div className="govuk-hint">
                Include: effect size, variance or event rate, alpha, desired power, any
                design effects, and required sample size.
              </div>
              <TextArea id="p7_power_detail" value={inputs.p7_power_detail}
                onChange={v => set('p7_power_detail', v)} rows={4} />
            </div>
          </When>

          <RadioQuestion id="p7_attrition"
            label="What level of attrition or loss to follow-up do you expect?"
            hint="Attrition reduces effective sample size and, if differential between groups, introduces bias."
            value={inputs.p7_attrition} onChange={v => set('p7_attrition', v)}
            options={[
              { value: 'low',      label: 'Low — less than 10%' },
              { value: 'moderate', label: 'Moderate — 10–25%' },
              { value: 'high',     label: 'High — more than 25%' },
              { value: 'unknown',  label: 'Unknown' },
            ]} />
        </Card>

        <Card>
          <SectionTag>Pre-Intervention Data</SectionTag>
          <RadioQuestion id="p7_predata"
            label="Is pre-intervention outcome data available?"
            hint="Required for DiD, ITS, and synthetic control designs. Strengthens any observational design by enabling pre-treatment balance checks and trend testing."
            value={inputs.p7_predata} onChange={v => set('p7_predata', v)}
            options={[
              { value: 'yes',   label: 'Yes — pre-intervention data available' },
              { value: 'maybe', label: 'Partial — limited pre-intervention data' },
              { value: 'no',    label: 'No' },
            ]} inline />
          <When condition={inputs.p7_predata && inputs.p7_predata !== 'no'}>
            <div className="govuk-form-group">
              <label className="govuk-label govuk-label--s" htmlFor="p7_pre_timepoints">
                How many pre-intervention time points are available?
              </label>
              <div className="govuk-hint">
                For ITS and DiD: fewer than 8 pre-periods substantially weakens the design.
                Aim for 12+ where possible. For Bayesian ITS (e.g. CausalImpact), shorter
                series are more tractable than with classical methods.
              </div>
              <input className="govuk-input govuk-input--width-5" id="p7_pre_timepoints"
                type="number" value={inputs.p7_pre_timepoints ?? ''}
                onChange={e => set('p7_pre_timepoints', e.target.value)} />
            </div>
          </When>
        </Card>

        <Card>
          <SectionTag>Analysis Approach</SectionTag>
          <RadioQuestion id="p7_analysis"
            label="What is your preferred analytical approach?"
            hint="The choice between Bayesian and frequentist analysis affects how uncertainty is expressed, how prior evidence is incorporated, and how findings are communicated. Both are valid; the choice should be driven by the evidence context, sample size, and stakeholder preferences."
            value={inputs.p7_analysis} onChange={v => set('p7_analysis', v)}
            options={[
              { value: 'freq',   label: 'Frequentist' },
              { value: 'bayes',  label: 'Bayesian' },
              { value: 'unsure', label: 'Unsure — open to either' },
            ]} inline />

          <When condition={inputs.p7_analysis === 'freq'}>
            <div style={{ borderLeft: '4px solid #1d70b8', padding: '16px 20px', background: '#e8f0fb', marginBottom: '16px' }}>
              <h4 className="govuk-heading-s" style={{ marginTop: 0 }}>Frequentist Analysis</h4>
              <RadioQuestion id="p7_freq_alpha"
                label="What significance threshold will you use?"
                hint="Pre-registration of a threshold is more important than the specific value chosen."
                value={inputs.p7_freq_alpha} onChange={v => set('p7_freq_alpha', v)}
                options={[
                  { value: '0.05',  label: 'p < 0.05 (conventional)' },
                  { value: '0.01',  label: 'p < 0.01 (conservative)' },
                  { value: 'other', label: 'Other — will specify in protocol' },
                ]} inline />
            </div>
          </When>

          <When condition={inputs.p7_analysis === 'bayes'}>
            <div style={{ borderLeft: '4px solid #4c2c92', padding: '16px 20px', background: '#f0ebfa', marginBottom: '16px' }}>
              <h4 className="govuk-heading-s" style={{ marginTop: 0 }}>Bayesian Analysis</h4>
              <Alert type="blue">
                Bayesian analysis is particularly valuable when: (1) the sample is small and
                informative priors from similar interventions exist; (2) adaptive stopping rules
                are needed; (3) communicating uncertainty as posterior distributions is preferable
                to p-values for decision-making stakeholders. Discuss prior specification with
                a statistician before finalising your protocol.
              </Alert>
              <RadioQuestion id="p7_bayes_prior"
                label="What prior information is available to inform your analysis?"
                value={inputs.p7_bayes_prior} onChange={v => set('p7_bayes_prior', v)}
                options={[
                  { value: 'strong', label: 'Strong prior data (e.g. previous trials, meta-analysis)' },
                  { value: 'weak',   label: 'Weak prior data — will use weakly informative priors' },
                  { value: 'none',   label: 'No prior data — will use non-informative priors' },
                ]} />
              <When condition={inputs.p7_bayes_prior === 'strong'}>
                <div className="govuk-form-group">
                  <label className="govuk-label govuk-label--s" htmlFor="p7_bayes_prior_source">
                    Describe the source and nature of your prior data
                  </label>
                  <TextArea id="p7_bayes_prior_source" value={inputs.p7_bayes_prior_source}
                    onChange={v => set('p7_bayes_prior_source', v)} rows={3} />
                </div>
              </When>
            </div>
          </When>
        </Card>

        <NavButtons>
          <Button variant="secondary" onClick={() => navigate('/data-sources')}>← Previous: Data Sources</Button>
          <Button onClick={() => navigate('/results')}>View Results →</Button>
        </NavButtons>
      </div>
    </div>
  )
}
