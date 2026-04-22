// Design taxonomy — equivalent to data/designs.csv in the R version
// Edit here to add, remove, or recategorise designs.
// category: display label shown in results table
// ceilingKey: maps to CATEGORY_CEILINGS in src/scoring/config.js

export const DESIGNS = [
  { id: 'ind_rct',      family: 'Experimental',             variant: 'Individual RCT',                  prospectiveOnly: true,  category: 'A', ceilingKey: 'A', baseBlocker: 'None' },
  { id: 'cluster_rct',  family: 'Experimental',             variant: 'Cluster RCT',                     prospectiveOnly: true,  category: 'A', ceilingKey: 'A', baseBlocker: 'None' },
  { id: 'stepped_rct',  family: 'Experimental',             variant: 'Stepped-wedge RCT',               prospectiveOnly: true,  category: 'A', ceilingKey: 'A', baseBlocker: 'None' },
  { id: 'crossover_rct',family: 'Experimental',             variant: 'Crossover RCT',                   prospectiveOnly: true,  category: 'A', ceilingKey: 'A', baseBlocker: 'Requires washout period' },
  { id: 'waitlist_rct', family: 'Experimental',             variant: 'Waitlist RCT',                    prospectiveOnly: true,  category: 'A', ceilingKey: 'A', baseBlocker: 'None' },
  { id: 'enc_design',   family: 'Experimental',             variant: 'Encouragement design',            prospectiveOnly: true,  category: 'A', ceilingKey: 'A', baseBlocker: 'None' },
  { id: 'psm',          family: 'Selection on observables', variant: 'Propensity score matching',       prospectiveOnly: false, category: 'D', ceilingKey: 'D', baseBlocker: 'Requires rich covariate data' },
  { id: 'mahal',        family: 'Selection on observables', variant: 'Mahalanobis matching',            prospectiveOnly: false, category: 'D', ceilingKey: 'D', baseBlocker: 'Requires rich covariate data' },
  { id: 'cem',          family: 'Selection on observables', variant: 'Coarsened exact matching',        prospectiveOnly: false, category: 'D', ceilingKey: 'D', baseBlocker: 'Requires rich covariate data' },
  { id: 'ipw',          family: 'Selection on observables', variant: 'IPW / stabilised IPW',            prospectiveOnly: false, category: 'D', ceilingKey: 'D', baseBlocker: 'Requires positivity' },
  { id: 'ow',           family: 'Selection on observables', variant: 'Overlap weights / trimming',      prospectiveOnly: false, category: 'D', ceilingKey: 'D', baseBlocker: 'Requires positivity' },
  { id: 'gcomp',        family: 'Selection on observables', variant: 'G-computation / standardisation', prospectiveOnly: false, category: 'D', ceilingKey: 'D', baseBlocker: 'Requires rich covariate data' },
  { id: 'msm',          family: 'Time-varying confounding', variant: 'Marginal structural models',      prospectiveOnly: false, category: 'D', ceilingKey: 'D', baseBlocker: 'Requires longitudinal time-varying data' },
  { id: 'gest',         family: 'Time-varying confounding', variant: 'G-estimation',                    prospectiveOnly: false, category: 'D', ceilingKey: 'D', baseBlocker: 'Requires longitudinal time-varying data' },
  { id: 'gcomp_tv',     family: 'Time-varying confounding', variant: 'G-computation (time-varying)',    prospectiveOnly: false, category: 'D', ceilingKey: 'D', baseBlocker: 'Requires longitudinal time-varying data' },
  { id: 'rd_sharp',     family: 'Discontinuity-based',      variant: 'Sharp RD',                        prospectiveOnly: false, category: 'B', ceilingKey: 'B', baseBlocker: 'Requires assignment variable with known cutoff' },
  { id: 'rd_fuzzy',     family: 'Discontinuity-based',      variant: 'Fuzzy RD',                        prospectiveOnly: false, category: 'B', ceilingKey: 'B', baseBlocker: 'Requires assignment variable with known cutoff' },
  { id: 'rdit',         family: 'Discontinuity-based',      variant: 'Regression discontinuity in time',prospectiveOnly: false, category: 'B', ceilingKey: 'B', baseBlocker: 'Requires known policy change date with time series' },
  { id: 'did_std',      family: 'Difference-based',         variant: 'Standard DiD (2×2)',               prospectiveOnly: false, category: 'D', ceilingKey: 'D', baseBlocker: 'Requires parallel trends' },
  { id: 'did_stagger',  family: 'Difference-based',         variant: 'Staggered adoption DiD',          prospectiveOnly: false, category: 'D', ceilingKey: 'D', baseBlocker: 'Requires staggered rollout data' },
  { id: 'did_cs',       family: 'Difference-based',         variant: 'Callaway-Sant\'Anna DiD',         prospectiveOnly: false, category: 'D', ceilingKey: 'D', baseBlocker: 'Requires staggered rollout data' },
  { id: 'did_sa',       family: 'Difference-based',         variant: 'Sun-Abraham DiD',                 prospectiveOnly: false, category: 'D', ceilingKey: 'D', baseBlocker: 'Requires staggered rollout data' },
  { id: 'synth',        family: 'Difference-based',         variant: 'Synthetic control',               prospectiveOnly: false, category: 'D', ceilingKey: 'Dp', baseBlocker: 'Requires donor pool of comparable units' },
  { id: 'asc',          family: 'Difference-based',         variant: 'Augmented synthetic control',     prospectiveOnly: false, category: 'D', ceilingKey: 'Dp', baseBlocker: 'Requires donor pool of comparable units' },
  { id: 'iv_2sls',      family: 'Instrumental variables',   variant: 'Standard IV / 2SLS',              prospectiveOnly: false, category: 'B', ceilingKey: 'B', baseBlocker: 'Requires valid instrument' },
  { id: 'iv_frd',       family: 'Instrumental variables',   variant: 'Fuzzy RD as IV',                  prospectiveOnly: false, category: 'B', ceilingKey: 'B', baseBlocker: 'Requires valid instrument near cutoff' },
  { id: 'its_std',      family: 'Interrupted time series',  variant: 'Standard ITS',                    prospectiveOnly: false, category: 'C', ceilingKey: 'C', baseBlocker: 'Requires sufficient pre/post time points' },
  { id: 'its_ctrl',     family: 'Interrupted time series',  variant: 'Controlled ITS',                  prospectiveOnly: false, category: 'B', ceilingKey: 'B', baseBlocker: 'Requires comparable control series' },
  { id: 'its_seg',      family: 'Interrupted time series',  variant: 'Segmented regression',            prospectiveOnly: false, category: 'C', ceilingKey: 'C', baseBlocker: 'Requires sufficient pre/post time points' },
  { id: 'contrib',      family: 'Theory-based',             variant: 'Contribution analysis',           prospectiveOnly: false, category: 'E', ceilingKey: 'E', baseBlocker: 'None' },
  { id: 'realist',      family: 'Theory-based',             variant: 'Realist evaluation',              prospectiveOnly: false, category: 'E', ceilingKey: 'E', baseBlocker: 'Requires stakeholder access' },
  { id: 'process',      family: 'Theory-based',             variant: 'Process tracing',                 prospectiveOnly: false, category: 'E', ceilingKey: 'E', baseBlocker: 'Requires document/data access' },
]
