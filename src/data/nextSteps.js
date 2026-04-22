// Next steps registry — equivalent to data/next_steps.yaml in the R version
// Edit guidance text here. Add new entries by following the same structure.
// uncertainValues: answer values that trigger this item to appear on the results page.

export const NEXT_STEPS = [
  {
    id: 'p3_exchangeability',
    uncertainValues: ['partial', 'no'],
    page: 'Page 3',
    question: 'Exchangeability assumption',
    guidance: 'Consider whether additional administrative data or expert elicitation could support a stronger argument for exchangeability. A sensitivity analysis using E-values can quantify how much unmeasured confounding would be needed to explain away your result. If exchangeability is unlikely to hold, designs that exploit quasi-random variation (RD, IV, ITS) should be prioritised over matching or DiD approaches.',
  },
  {
    id: 'p3_positivity',
    uncertainValues: ['partial', 'no'],
    page: 'Page 3',
    question: 'Positivity assumption',
    guidance: 'Review the distribution of your treatment propensity across covariate strata. If some subgroups are always treated or never treated, consider restricting your target population to the region of common support, or using overlap weights which are more robust to positivity violations. Structural positivity violations (by design) are more serious than random violations and may rule out IPW-based approaches entirely.',
  },
  {
    id: 'p3_consistency',
    uncertainValues: ['partial', 'no'],
    page: 'Page 3',
    question: 'Consistency assumption',
    guidance: 'Revisit the precision of your intervention definition. Consider whether the intervention can be further standardised across delivery sites, or whether a per-protocol analysis restricting to recipients receiving a consistent version would be more appropriate. Document the specific ways in which the intervention varies and assess whether this variation is relevant to the outcome.',
  },
  {
    id: 'p3_consistent',
    uncertainValues: ['partial', 'no'],
    page: 'Page 3',
    question: 'Intervention delivery consistency',
    guidance: 'Conduct a process evaluation to document variation in delivery before proceeding to impact evaluation. Alternatively, consider stratifying your analysis by delivery fidelity level. High delivery variation weakens your ability to attribute effects to the intervention and may mean a developmental or process evaluation is more appropriate at this stage.',
  },
  {
    id: 'did_parallel',
    uncertainValues: ['maybe', 'no'],
    page: 'Page 4',
    question: 'Parallel trends assumption (DiD)',
    guidance: 'Plot pre-intervention trends for treated and control groups across all available pre-periods. If trends diverge, consider whether a conditional parallel trends assumption (adjusting for time-varying covariates) is more plausible, or whether synthetic control or ITS would be more appropriate. The Callaway-Sant\'Anna and Sun-Abraham estimators are more robust to some forms of parallel trends violation than standard two-way fixed effects.',
  },
  {
    id: 'sc_prefit',
    uncertainValues: ['maybe', 'no'],
    page: 'Page 4',
    question: 'Synthetic control pre-period fit',
    guidance: 'Extending the pre-intervention observation period — if data allow — will substantially improve the credibility of the synthetic control. If the pre-period is very short, an augmented synthetic control (ASC) incorporating an outcome model alongside the weighting approach can improve fit and reduce sensitivity to poor pre-period matching.',
  },
  {
    id: 'iv_exclusion',
    uncertainValues: ['maybe', 'no'],
    page: 'Page 4',
    question: 'IV exclusion restriction',
    guidance: 'Document all plausible pathways from the instrument to the outcome other than through treatment. Consult subject matter experts and search for empirical tests of the exclusion restriction where possible. If direct effects are plausible, consider whether a partial identification approach (e.g. bounds analysis) could be used to characterise the range of causal effects consistent with your data.',
  },
  {
    id: 'its_prepoints',
    uncertainValues: ['8to11', 'under8'],
    page: 'Page 4',
    question: 'ITS pre-intervention time points',
    guidance: 'If fewer than 8 pre-intervention time points are available, the ITS trend estimate will be imprecise and assumption testing will be limited. Consider whether older archival data could extend the series, or whether a controlled ITS (adding a comparison series) could compensate for a shorter pre-period by controlling for secular trends.',
  },
  {
    id: 'p5_confounder_confidence',
    uncertainValues: ['maybe', 'no'],
    page: 'Page 5',
    question: 'Confounder identification confidence',
    guidance: 'Document known unmeasured confounders explicitly in your evaluation protocol. Plan sensitivity analyses — E-values, negative control outcomes, or quantitative bias analysis — to quantify and communicate the potential impact of unmeasured confounding on your conclusions.',
  },
  {
    id: 'p6_linkage',
    uncertainValues: ['maybe', 'no'],
    page: 'Page 6',
    question: 'Data linkage feasibility',
    guidance: 'Initiate conversations with data custodians and your Information Governance team early — linkage approval can take 6–18 months. Identify whether a unique linkage key exists across datasets (e.g. NINO, CRN, NHS number). If linkage is not feasible, assess whether a single dataset containing both exposure and outcome variables is available.',
  },
  {
    id: 'p6_missing',
    uncertainValues: ['moderate', 'high', 'unknown'],
    page: 'Page 6',
    question: 'Missing outcome data',
    guidance: 'Plan and pre-register your missing data approach before data collection or analysis. Multiple imputation by chained equations (MICE) or inverse probability weighting for censoring are appropriate for moderate missingness under a missing-at-random assumption. For high missingness, report sensitivity analyses under different missing data assumptions.',
  },
  {
    id: 'p7_power_done',
    uncertainValues: ['maybe', 'no'],
    page: 'Page 7',
    question: 'Power calculation',
    guidance: 'Conduct a formal power calculation before finalising your design and pre-register it in your evaluation protocol. For complex designs (cluster RCT, ITS, DiD), use simulation-based power methods rather than analytical approximations. Document all assumptions transparently — overly optimistic effect size assumptions are a common source of underpowered evaluations.',
  },
  {
    id: 'p7_predata',
    uncertainValues: ['maybe', 'no'],
    page: 'Page 7',
    question: 'Pre-intervention data availability',
    guidance: 'Investigate whether historical administrative data could provide a pre-intervention outcome series. Even limited pre-period data (2–3 time points) substantially improves DiD and ITS credibility compared to no pre-period data, by enabling some assessment of pre-existing trends.',
  },
]
