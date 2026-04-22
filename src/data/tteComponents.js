// TTE component definitions — equivalent to data/tte_components.yaml in the R version
// Edit hint and placeholder text here without touching component code.

export const TTE_COMPONENTS = [
  {
    id: 'tte_eligibility',
    title: '1. Eligibility Criteria',
    hint: 'Who would be eligible to participate in the ideal trial? Define inclusion and exclusion criteria precisely. Consider age, geography, prior history, referral route, or other relevant characteristics. Being precise here helps identify whether your target population is observable in your data.',
    placeholder: 'e.g. All adults referred to probation services in England and Wales, first offence only, aged 18–65',
  },
  {
    id: 'tte_treatment',
    title: '2. Treatment Strategies',
    hint: 'What are the treatment strategies being compared? Define each strategy precisely — including what receiving treatment means and what the comparator involves. Vague treatment definitions often mask heterogeneity that undermines causal identification.',
    placeholder: 'e.g. Strategy A: enrolment in 12-week keyworker programme. Strategy B: standard supervision only',
  },
  {
    id: 'tte_assignment',
    title: '3. Treatment Assignment',
    hint: 'In the ideal trial, how would participants be assigned to treatment strategies? Describe the randomisation mechanism — individual, cluster, stepped-wedge, etc. If assignment would be by a third party, note this as it has implications for compliance and intent-to-treat analysis.',
    placeholder: 'e.g. Individual randomisation at point of referral, stratified by region and risk score',
  },
  {
    id: 'tte_followup',
    title: '4. Follow-up Period',
    hint: 'When does follow-up begin (time zero) and when does it end? Defining time zero precisely is critical — it should be the moment of treatment assignment, not treatment receipt. Misalignment of time zero is a common source of bias in observational studies.',
    placeholder: 'e.g. Follow-up begins at date of randomisation. Ends 12 months after programme exit or 24 months from baseline',
  },
  {
    id: 'tte_outcome',
    title: '5. Outcome',
    hint: 'What is the primary outcome and how would it be measured in the ideal trial? Be specific about measurement method, timing, and how missing outcomes would be handled. Consider whether your outcome is binary, continuous, or time-to-event.',
    placeholder: 'e.g. Binary: any reconviction within 12 months of programme exit, measured via Police National Computer records',
  },
  {
    id: 'tte_contrast',
    title: '6. Causal Contrast',
    hint: 'What causal quantity are you trying to estimate? The intention-to-treat (ITT) effect estimates the effect of being assigned to treatment regardless of compliance. The per-protocol effect estimates the effect of actually receiving treatment. The choice shapes your analysis strategy.',
    placeholder: 'e.g. Intention-to-treat: effect of being assigned to the programme regardless of whether participants completed it',
  },
  {
    id: 'tte_analysis',
    title: '7. Analysis Plan',
    hint: 'In the ideal trial, how would you analyse the data? Include randomisation unit, primary estimator, handling of covariates, and approach to missing data. This is the target analysis — in practice you may need to adapt it.',
    placeholder: 'e.g. Logistic regression of binary outcome on treatment assignment, adjusted for pre-specified covariates, complete case with sensitivity analysis',
  },
]
