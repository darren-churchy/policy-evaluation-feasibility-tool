import { useNavigate } from 'react-router-dom'
import {
  Card, SectionTag, Alert, NavButtons, Button,
  RadioQuestion, DesignCard, LockedPage, When, SubNavigation, PageHeader,
} from '../ui/GovukComponents.jsx'

const PAGE4_SECTIONS = [
  { id: 's-randomisation', label: 'Randomisation' },
  { id: 's-did',           label: 'Difference-in-Differences' },
  { id: 's-rd',            label: 'Regression Discontinuity' },
  { id: 's-iv',            label: 'Instrumental Variables' },
  { id: 's-its',           label: 'Interrupted Time Series' },
  { id: 's-matching',      label: 'Matching & Weighting' },
  { id: 's-gmethods',      label: 'G-Methods' },
]

export default function Page4({ inputs, set, gatePassed, prospectiveOk }) {
  const navigate = useNavigate()
  if (!gatePassed) return (
    <>
      <PageHeader title="Design-Specific Feasibility Questions" />
      <div className="page-content"><LockedPage /></div>
    </>
  )

  const r = (id, label, hint, options, inline = false) => (
    <RadioQuestion id={id} label={label} hint={hint} value={inputs[id]}
      onChange={v => set(id, v)} options={options} inline={inline} />
  )
  const yn = (id, label, hint, inline = true) => r(id, label, hint,
    [{ value: 'yes', label: 'Yes' }, { value: 'maybe', label: 'Possibly' }, { value: 'no', label: 'No' }], inline)

  return (
    <div>
      <PageHeader title="Design-Specific Feasibility Questions" />
      <div className="page-content">
        <Alert type="blue" title="About this section">
          For each design family, a screening question determines whether the approach is worth
          exploring. Design-specific feasibility questions then appear for relevant designs.
          Answer as honestly as possible — this feeds directly into the results ranking.
        </Alert>
        <When condition={!prospectiveOk}>
          <Alert type="yellow" title="Prospective designs hidden">
            You indicated a prospective evaluation is not possible. RCT variants have been
            hidden. Update your answer on Page 1 if this changes.
          </Alert>
        </When>
        <SubNavigation sections={prospectiveOk ? PAGE4_SECTIONS : PAGE4_SECTIONS.slice(1)} />

        {/* ── RANDOMISATION ── */}
        <When condition={prospectiveOk}>
          <Card>
            <span id="s-randomisation" /><SectionTag>Randomisation</SectionTag>
            <Alert type="yellow" title="Consider carefully before ruling out randomisation">
              Randomisation is often dismissed too quickly. Work through the specific barriers
              below — many can be addressed through design adaptations.
            </Alert>
            <h3 className="govuk-heading-s">Step 1 — Identify barriers to randomisation</h3>
            {r('b_ethics','Ethical concerns about withholding treatment','Is the intervention proven effective? If not, withholding it is ethically defensible. Waitlist and encouragement designs ensure everyone eventually receives the intervention.',
              [{ value: 'yes', label: 'Yes — this is a barrier' }, { value: 'partial', label: 'Partially' }, { value: 'no', label: 'No' }], true)}
            {r('b_logistics','Operational or logistical barriers to random assignment','Could randomisation be done at a different unit? Could it be embedded in an existing referral process?',
              [{ value: 'yes', label: 'Yes — this is a barrier' }, { value: 'partial', label: 'Partially' }, { value: 'no', label: 'No' }], true)}
            {r('b_political','Political or stakeholder resistance to randomisation','Has resistance been formally assessed or is it assumed? A stepped-wedge or encouragement design may be more acceptable.',
              [{ value: 'yes', label: 'Yes — this is a barrier' }, { value: 'partial', label: 'Partially' }, { value: 'no', label: 'No' }], true)}
            {r('b_rollout','Intervention already rolled out to all eligible units','If already universal, consider whether a waitlist applies to future expansion or an encouragement design is feasible.',
              [{ value: 'yes', label: 'Yes — already universal' }, { value: 'partial', label: 'Partial rollout underway' }, { value: 'no', label: 'No — not yet rolled out' }], true)}
            {r('b_sample','Sample size too small for individual-level randomisation','Consider cluster randomisation or crossover (uses each participant as their own control).',
              [{ value: 'yes', label: 'Yes — insufficient sample' }, { value: 'partial', label: 'Uncertain' }, { value: 'no', label: 'No — sample is sufficient' }], true)}
            <h3 className="govuk-heading-s" style={{ marginTop: '24px' }}>Step 2 — RCT variants to consider</h3>
            <DesignCard title="Individual RCT" hint="The gold standard for causal inference. Provides the strongest basis for causal claims if implemented with fidelity.">
              {yn('rct_ind_feasible','Is individual-level randomisation feasible?','Consider whether the referral or allocation process could incorporate randomisation.')}
            </DesignCard>
            <DesignCard title="Cluster RCT" hint="Randomisation at group level (e.g. prisons, probation teams). Requires more total participants than individual randomisation.">
              {r('rct_cluster_n','Do you have a sufficient number of clusters?','Cluster RCTs typically require at least 10–20 clusters per arm.',
                [{ value: 'yes', label: 'Yes — 20+ clusters' }, { value: 'maybe', label: 'Borderline — 10–20' }, { value: 'no', label: 'No — fewer than 10' }], true)}
              {r('rct_cluster_contam','Is there risk of contamination between clusters?','Clusters should be sufficiently separated to prevent treated units influencing control units.',
                [{ value: 'low', label: 'Low risk' }, { value: 'moderate', label: 'Moderate risk' }, { value: 'high', label: 'High risk' }], true)}
            </DesignCard>
            <DesignCard title="Stepped-Wedge RCT" hint="All units eventually receive the intervention; timing is randomised. Well-suited where permanently withholding treatment is not acceptable.">
              {r('rct_sw_rollout','Is a phased rollout planned or feasible?','Requires sequential introduction across sites or time periods.',
                [{ value: 'yes', label: 'Yes — planned' }, { value: 'maybe', label: 'Possibly' }, { value: 'no', label: 'No — simultaneous rollout' }], true)}
              {yn('rct_sw_time','Are sufficient time points available within each step?','Very short steps reduce statistical power.')}
            </DesignCard>
            <DesignCard title="Crossover RCT" hint="Participants receive both conditions in sequence; order is randomised. Requires a washout period between conditions.">
              {yn('rct_cross_washout','Is a washout period feasible between treatment conditions?','Behavioural interventions may have lasting effects making washout impractical.')}
              {yn('rct_cross_chronic','Is the condition being treated stable over the study period?','Crossover designs assume the underlying condition is stable at the start of each period.')}
            </DesignCard>
            <DesignCard title="Waitlist (Delayed Treatment) RCT" hint="The control group receives the intervention after a delay. Addresses ethical concerns while maintaining a randomised comparison.">
              {yn('rct_wait_delay','Is it feasible to delay treatment for a control group?','The delay must be long enough for outcomes to be observed before crossover begins.')}
              {yn('rct_wait_demand','Is there sufficient demand that a waiting list would be natural?','Waitlist designs are most credible when a waiting list would exist regardless of the evaluation.')}
            </DesignCard>
            <DesignCard title="Encouragement Design" hint="Random assignment to an encouragement (invitation, nudge, priority access) rather than to the intervention itself. Uptake remains voluntary. Produces a LATE among compliers.">
              {yn('rct_enc_variation','Is there meaningful variation in take-up or access?','Near-universal or near-zero take-up eliminates statistical power.')}
              {yn('rct_enc_instrument','Is the encouragement itself randomly assignable?','The encouragement must affect take-up without directly affecting the outcome.')}
            </DesignCard>
          </Card>
        </When>

        {/* ── DiD ── */}
        <Card>
          <span id="s-did" /><SectionTag>Difference-in-Differences</SectionTag>
          {yn('screen_did','Is there a plausible comparison group with pre-intervention outcome data?','DiD compares the change in outcomes over time in a treated group to the change in a comparable untreated group.')}
          <When condition={inputs.screen_did !== 'no'}>
            <DesignCard title="Standard DiD (2×2)" hint="One treated group, one control group, one pre-period, one post-period.">
              {yn('did_parallel','Is the parallel trends assumption plausible?','Assess by examining pre-intervention trends in both groups — diverging pre-trends are a warning sign.')}
              {r('did_predata','How many pre-intervention time periods are available?','More pre-periods allow more rigorous testing of parallel trends.',
                [{ value: '3plus', label: '3 or more' }, { value: 'two', label: '2' }, { value: 'one', label: '1' }, { value: 'none', label: 'None' }], true)}
            </DesignCard>
            <DesignCard title="Staggered Adoption DiD" hint="Units treated at different times; not-yet-treated units serve as controls.">
              {r('did_stagger','Did or will the intervention roll out at different times across units?','Requires variation in the timing of treatment adoption.',
                [{ value: 'yes', label: 'Yes — staggered rollout' }, { value: 'maybe', label: 'Partially staggered' }, { value: 'no', label: 'No — simultaneous rollout' }], true)}
            </DesignCard>
            <DesignCard title="Callaway-Sant'Anna / Sun-Abraham DiD" hint="Modern estimators addressing bias from treatment effect heterogeneity in staggered adoption settings.">
              {yn('did_het','Is there reason to expect treatment effects to vary across cohorts or over time?','If early adopters differ from late adopters, standard DiD may be biased.')}
            </DesignCard>
            <DesignCard title="Synthetic Control / Augmented Synthetic Control" hint="Constructs a weighted combination of control units matching the treated unit's pre-intervention trajectory.">
              {yn('sc_donor','Is there a pool of comparable untreated units?','Donors should be similar to the treated unit and not themselves affected by the intervention.')}
              {r('sc_prefit','Is there sufficient pre-intervention period for good synthetic fit?','Very short pre-periods produce unreliable synthetic controls.',
                [{ value: 'yes', label: 'Yes — 5 or more pre-periods' }, { value: 'maybe', label: 'Borderline — 3–4' }, { value: 'no', label: 'No — fewer than 3' }], true)}
            </DesignCard>
          </When>
        </Card>

        {/* ── RD ── */}
        <Card>
          <span id="s-rd" /><SectionTag>Regression Discontinuity</SectionTag>
          {yn('screen_rd','Is there a continuous assignment variable with a known threshold determining treatment eligibility?','RD exploits a discontinuity in treatment assignment at a known cutoff on a running variable.')}
          <When condition={inputs.screen_rd !== 'no'}>
            <DesignCard title="Sharp RD" hint="All units above the cutoff receive treatment; all below do not. Requires strict enforcement of the assignment rule.">
              {yn('rd_sharp_cutoff','Is the assignment rule strictly enforced at the cutoff?','Sharp RD requires no discretion or override at the threshold.')}
              {r('rd_sharp_manip','Is there evidence of manipulation of the running variable near the cutoff?','If units can manipulate their score, the comparability assumption breaks down.',
                [{ value: 'no', label: 'No evidence of manipulation' }, { value: 'maybe', label: 'Uncertain' }, { value: 'yes', label: 'Yes — manipulation likely' }], true)}
            </DesignCard>
            <DesignCard title="Fuzzy RD" hint="Treatment probability increases discontinuously at the cutoff but is not deterministic. The cutoff serves as an instrument, producing a LATE.">
              {r('rd_fuzzy_jump','Is there a meaningful jump in treatment probability at the cutoff?','A very small jump (< ~20 percentage points) produces weak instrument concerns.',
                [{ value: 'yes', label: 'Yes — large jump' }, { value: 'maybe', label: 'Moderate jump' }, { value: 'no', label: 'No — small or no jump' }], true)}
            </DesignCard>
            <DesignCard title="Regression Discontinuity in Time (RDIT)" hint="The running variable is calendar time; the discontinuity is a policy change date.">
              {yn('rdit_date','Is there a clear policy change date creating a discontinuity in treatment?','The change should be exogenous — not anticipated or pre-empted by units.')}
              {yn('rdit_confound','Is it plausible that no other significant changes occurred around the same time?','Confounding concurrent events are the key threat to RDIT validity.')}
            </DesignCard>
          </When>
        </Card>

        {/* ── IV ── */}
        <Card>
          <span id="s-iv" /><SectionTag>Instrumental Variables</SectionTag>
          {yn('screen_iv','Is there a plausible instrument — something affecting treatment uptake but with no direct effect on the outcome?','A valid instrument must satisfy: relevance, exclusion restriction, and independence.')}
          <When condition={inputs.screen_iv !== 'no'}>
            <DesignCard title="Standard IV / 2SLS" hint="Two-stage least squares estimates the causal effect of treatment instrumented by the IV. Produces a LATE for compliers.">
              {yn('iv_relevance','Is the instrument strongly correlated with treatment receipt?','Weak instruments (F-statistic below 10) produce biased estimates.')}
              {yn('iv_exclusion','Is the exclusion restriction plausible?','The restriction — instrument affects outcome only through treatment — is untestable and must be argued on substantive grounds.')}
            </DesignCard>
            <DesignCard title="Fuzzy RD as IV" hint="When a fuzzy RD exists, the cutoff crossing can be used as an instrument for actual treatment receipt.">
              {yn('iv_frd_linked','Have you also completed the Fuzzy RD questions above?','Fuzzy RD as IV and the Fuzzy RD design are the same analytical approach.')}
            </DesignCard>
          </When>
        </Card>

        {/* ── ITS ── */}
        <Card>
          <span id="s-its" /><SectionTag>Interrupted Time Series</SectionTag>
          {yn('screen_its','Is there a clear intervention date and sufficient time series data before and after?','ITS designs model the pre-intervention trend and test whether the intervention produced a change in level or slope.')}
          <When condition={inputs.screen_its !== 'no'}>
            <DesignCard title="Standard ITS" hint="Models outcome trends before and after a single intervention point. Vulnerable to confounding from concurrent events.">
              {r('its_prepoints','How many pre-intervention time points are available?','Fewer than 8 pre-intervention time points is generally considered insufficient.',
                [{ value: '12plus', label: '12 or more' }, { value: '8to11', label: '8–11' }, { value: 'under8', label: 'Less than 8' }], true)}
              {r('its_postpoints','How many post-intervention time points are available?','At least 6 post-intervention time points are generally recommended.',
                [{ value: '12plus', label: '12 or more' }, { value: '6to11', label: '6–11' }, { value: 'under6', label: 'Less than 6' }], true)}
              {yn('its_autocorr','Have you considered autocorrelation in the outcome series?','Time series data often exhibit autocorrelation that must be accounted for (e.g. ARIMA, Prais-Winsten).')}
            </DesignCard>
            <DesignCard title="Controlled ITS" hint="Adds a control series to standard ITS. Substantially strengthens causal claims by accounting for secular trends.">
              {yn('its_control','Is there a comparable control series available?','The control series should follow a similar pre-trend and not be affected by the intervention.')}
            </DesignCard>
            <DesignCard title="Segmented Regression ITS" hint="Fits separate regression lines to pre- and post-intervention segments, estimating changes in both level and slope.">
              {yn('its_seg_smooth','Is the outcome trend reasonably smooth and linear within each segment?','Strong nonlinearity or seasonality may require more complex modelling.')}
            </DesignCard>
          </When>
        </Card>

        {/* ── MATCHING ── */}
        <Card>
          <span id="s-matching" /><SectionTag>Matching &amp; Propensity Score Methods</SectionTag>
          {r('screen_match','Do you have rich covariate data on both treated and untreated units?','Matching methods construct a comparable control group from observational data. Validity rests on the assumption that all relevant confounders are measured.',
            [{ value: 'yes', label: 'Yes — rich covariate data' }, { value: 'maybe', label: 'Partially' }, { value: 'no', label: 'No — limited covariates' }], true)}
          <When condition={inputs.screen_match !== 'no'}>
            <DesignCard title="Propensity Score Matching (PSM)" hint="Matches on estimated probability of treatment. Reduces dimensionality of matching to a single score.">
              {yn('psm_overlap','Is there good overlap in propensity scores between groups?','Lack of overlap leads to extrapolation and poor matching quality.')}
            </DesignCard>
            <DesignCard title="Mahalanobis Distance Matching" hint="Matches on multivariate distance between covariate vectors. Works well with a moderate number of covariates.">
              {r('mah_covs','How many covariates do you plan to match on?','Mahalanobis matching becomes less reliable as covariates increase.',
                [{ value: 'low', label: 'Fewer than 10' }, { value: 'medium', label: '10–20' }, { value: 'high', label: 'More than 20' }], true)}
            </DesignCard>
            <DesignCard title="Coarsened Exact Matching (CEM)" hint="Coarsens each covariate into bins and exactly matches on coarsened values. Highly transparent but may reduce matched sample.">
              {yn('cem_sample','After matching, will the retained sample be sufficient?','CEM often produces a smaller matched sample.')}
            </DesignCard>
            <DesignCard title="IPW / Stabilised IPW" hint="Reweights the observed sample to create a pseudo-population free from measured confounding.">
              {r('ipw_extreme','Are there concerns about extreme propensity scores (near 0 or 1)?','Extreme weights can dominate the analysis. Overlap weights may be preferable.',
                [{ value: 'no', label: 'No — weights expected to be stable' }, { value: 'maybe', label: 'Uncertain' }, { value: 'yes', label: 'Yes — extreme weights likely' }], true)}
            </DesignCard>
            <DesignCard title="Overlap Weights / Trimming" hint="Higher weights for units near propensity score 0.5 — the region of strongest common support. More robust to positivity violations than IPW.">
              {yn('ow_target','Is the overlap (equipoise) population the most policy-relevant estimand?','Overlap weights target the treatment effect for those with genuine uncertainty about treatment.')}
            </DesignCard>
            <DesignCard title="G-Computation / Standardisation" hint="Models outcome as a function of treatment and covariates, then standardises predictions over the covariate distribution.">
              {yn('gcomp_model','Can you specify a credible outcome model?','G-computation requires a correctly specified outcome model. Model misspecification biases estimates.')}
            </DesignCard>
          </When>
        </Card>

        {/* ── G-METHODS ── */}
        <Card>
          <span id="s-gmethods" /><SectionTag>G-Methods (Time-Varying Confounding)</SectionTag>
          {yn('screen_gmethod','Do you have longitudinal data with time-varying exposures or confounders affected by prior treatment?','Standard regression is biased when confounders are affected by prior treatment. G-methods are designed for this setting.')}
          <When condition={inputs.screen_gmethod !== 'no'}>
            <DesignCard title="Marginal Structural Models (MSM)" hint="Uses time-varying IPW to create a pseudo-population free from time-varying confounding. Requires positivity at each time point.">
              {r('msm_timepoints','How many time points of exposure and confounder data are available?','Very few time points limit the ability to model time-varying confounding adequately.',
                [{ value: '5plus', label: '5 or more' }, { value: '3to4', label: '3–4' }, { value: 'under3', label: 'Fewer than 3' }], true)}
            </DesignCard>
            <DesignCard title="G-Estimation" hint="Estimates structural nested model parameters by finding values that remove the association between treatment and a transformed outcome.">
              {yn('gest_snm','Can you specify a structural nested model for your outcome?','Requires careful theoretical specification of how treatment effects accumulate over time.')}
            </DesignCard>
            <DesignCard title="G-Computation (Time-Varying)" hint="Extends g-computation to time-varying treatments by simulating counterfactual outcomes under specified treatment regimes.">
              {yn('gcomp_tv_regime','Can you specify the treatment regimes you want to compare?','You must be able to define regimes precisely in terms of your measured variables.')}
            </DesignCard>
          </When>
        </Card>

        <NavButtons>
          <Button variant="secondary" onClick={() => navigate('/page3')}>← Previous: Causal Readiness</Button>
          <Button onClick={() => navigate('/page5')}>Next: Adjustment &amp; DAG →</Button>
        </NavButtons>
      </div>
    </div>
  )
}
