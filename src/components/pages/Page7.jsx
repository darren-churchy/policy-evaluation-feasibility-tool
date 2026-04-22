import { useNavigate } from 'react-router-dom'
import {
  Card, SectionTag, Alert, NavButtons, Button,
  RadioQuestion, When, LockedPage, TextArea,
} from '../ui/GovukComponents.jsx'

export default function Page7({ inputs, set, gatePassed }) {
  const navigate = useNavigate()
  if (!gatePassed) return <><div style={{ background: '#fff', borderBottom: '4px solid #9c1b6d', padding: '20px 30px' }}><h1 className="govuk-heading-l" style={{ margin: 0 }}>Statistical Feasibility</h1></div><div style={{ padding: '30px' }}><LockedPage /></div></>

  return (
    <div>
      <div style={{ background: '#fff', borderBottom: '4px solid #9c1b6d', padding: '20px 30px' }}>
        <h1 className="govuk-heading-l" style={{ margin: 0 }}>Statistical Feasibility</h1>
      </div>
      <div style={{ padding: '30px' }}>
        <Alert type="blue" title="About this section">
          This section assesses the statistical feasibility of your evaluation. Your responses
          will inform the feasibility scoring — particularly for designs requiring large samples,
          long follow-up periods, or specific prior data.
        </Alert>

        <Card>
          <SectionTag>Sample Size &amp; Power</SectionTag>

          <div className="govuk-form-group">
            <label className="govuk-label govuk-label--s" htmlFor="p7_n">Estimated total sample size</label>
            <div className="govuk-hint">Total number of participants or units available for analysis (treated plus untreated). An order of magnitude is sufficient if exact count is unknown.</div>
            <input className="govuk-input govuk-input--width-10" id="p7_n" type="number"
              value={inputs.p7_n ?? ''} onChange={e => set('p7_n', e.target.value)} />
          </div>

          <div className="govuk-form-group">
            <label className="govuk-label govuk-label--s" htmlFor="p7_mde">Minimum detectable effect size (MDE)</label>
            <div className="govuk-hint">The smallest effect your study needs to detect to be policy-relevant. Express as an absolute difference where possible.</div>
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
            hint="A power calculation estimates the sample size required to detect an effect at a specified significance level and power (typically 80–90%)."
            value={inputs.p7_power_done} onChange={v => set('p7_power_done', v)}
            options={[
              { value: 'yes',   label: 'Yes — formal calculation completed' },
              { value: 'maybe', label: 'Partially — rough estimates only' },
              { value: 'no',    label: 'No — not yet done' },
            ]} inline />

          <When condition={inputs.p7_power_done && inputs.p7_power_done !== 'no'}>
            <div className="govuk-form-group">
              <label className="govuk-label govuk-label--s" htmlFor="p7_power_detail">Summarise your power calculation assumptions</label>
              <div className="govuk-hint">Include: effect size, variance or event rate, alpha, desired power, any design effects, and required sample size.</div>
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
            hint="Required for DiD, ITS, and synthetic control designs. Strengthens any observational design by enabling pre-treatment balance checks."
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
                For ITS and DiD designs, the number of pre-intervention periods directly affects
                your ability to test identification assumptions. More is generally better.
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
            hint="The choice between Bayesian and frequentist analysis affects how uncertainty is expressed and how prior evidence is incorporated. Both are valid — the choice should be driven by context and stakeholder preferences."
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
                  { value: 'other', label: 'Other / will specify in protocol' },
                ]} inline />
              <div className="govuk-form-group">
                <label className="govuk-label govuk-label--s" htmlFor="p7_freq_assumptions">Summarise power calculation assumptions</label>
                <TextArea id="p7_freq_assumptions" value={inputs.p7_freq_assumptions}
                  onChange={v => set('p7_freq_assumptions', v)} rows={3} />
              </div>
            </div>
          </When>

          <When condition={inputs.p7_analysis === 'bayes'}>
            <div style={{ borderLeft: '4px solid #9c1b6d', padding: '16px 20px', background: '#f8f0fc', marginBottom: '16px' }}>
              <h4 className="govuk-heading-s" style={{ marginTop: 0 }}>Bayesian Analysis</h4>
              <RadioQuestion id="p7_bayes_prior"
                label="What prior information is available to inform your analysis?"
                hint="Strong prior data can be incorporated as informative priors. If weak or contested, weakly informative or non-informative priors are appropriate."
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
              <RadioQuestion id="p7_bayes_decision"
                label="What decision threshold or credible interval will you use?"
                hint="Define in advance what posterior probability or credible interval constitutes sufficient evidence to inform your policy decision."
                value={inputs.p7_bayes_decision} onChange={v => set('p7_bayes_decision', v)}
                options={[
                  { value: '95',    label: 'Posterior probability > 95% that effect is positive' },
                  { value: 'ci95',  label: '95% credible interval excludes zero' },
                  { value: 'other', label: 'Other — will specify in protocol' },
                ]} />
            </div>
          </When>
        </Card>

        <NavButtons>
          <Button variant="secondary" onClick={() => navigate('/page6')}>← Previous: Data Sources</Button>
          <Button onClick={() => navigate('/results')}>View Results →</Button>
        </NavButtons>
      </div>
    </div>
  )
}
