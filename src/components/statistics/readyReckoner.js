// The ready-reckoner's arithmetic.
//
// Held apart from the engine on purpose. `spec/statistics.yaml` declares the reckoner with
// `engine_reads: false`, and tests assert the engine source never mentions it, so a figure
// produced here cannot reach a verdict. Nothing in this file imports the engine, the spec
// bundle or the answer store: it takes plain numbers and returns plain numbers.
//
// Everything is the textbook normal approximation for a two-arm comparison with equal
// allocation. That is the point — it exists to make a conversation with a statistician
// concrete, not to stand in for one. Every assumption it makes is returned alongside the
// figure so the user can see what would move it.

/**
 * Strict numeric parse. `Number('')` is 0 and `Number(' ')` is 0, so the lazy version
 * turns a field the user has not filled in into a figure resting on a zero they never
 * typed — the same failure the whole redesign exists to remove, in miniature. A blank is
 * missing, not nought.
 */
function num(value) {
  if (value === undefined || value === null) return NaN
  if (typeof value === 'string' && value.trim() === '') return NaN
  return Number(value)
}

/** Two-sided 5% significance, 80% power. */
const Z_ALPHA = 1.959964
const Z_POWER = 0.841621
const MDE_MULTIPLIER = Z_ALPHA + Z_POWER

/**
 * Midpoints for the attrition bands `expected_attrition` offers. Returned with the result
 * rather than hidden inside it, because the bands are wide and the figure moves with them.
 * The high band is a floor rather than an estimate — attrition has no upper bound.
 */
export const ATTRITION_RATE = {
  low: 0.05,
  moderate: 0.175,
  high: 0.30,
}

/** Bands that carry no usable rate. `unknown` is treated as none, and said so. */
export const ATTRITION_LABEL = {
  low: 'under 10%, taken as 5%',
  moderate: '10% to 25%, taken as 17.5%',
  high: 'over 25%, taken as 30% — a floor, not an estimate',
  unknown: 'not yet established, so no allowance is made',
}

/**
 * The sample the analysis actually has, after loss to follow-up and after clustering.
 *
 * Clustering is the correction people most often omit, and it is the one that bites: a
 * study of 1,000 people in 20 sites with an ICC of 0.05 carries roughly the information
 * of 345 independent people, not 1,000.
 *
 * @returns null when the inputs are not yet sufficient — the caller shows nothing rather
 *          than a figure resting on a guess.
 */
export function effectiveSample({ n, attritionBand, clustered, icc, clusterSize }) {
  const total = num(n)
  if (!Number.isFinite(total) || total <= 0) return null

  const attritionRate = ATTRITION_RATE[attritionBand] ?? 0
  const analysed = total * (1 - attritionRate)

  let designEffect = 1
  if (clustered) {
    const r = num(icc)
    const m = num(clusterSize)
    if (!Number.isFinite(r) || r < 0 || r > 1) return null
    if (!Number.isFinite(m) || m < 1) return null
    designEffect = 1 + (m - 1) * r
  }

  return { total, attritionRate, analysed, designEffect, effective: analysed / designEffect }
}

/**
 * Variance of a single observation, in the units the effect will be reported in.
 * Continuous outcomes are standardised, so the effect comes out in standard deviations
 * and no baseline is needed.
 */
function unitVariance(outcomeType, baseline) {
  if (outcomeType === 'continuous') return 1

  const b = num(baseline)
  if (outcomeType === 'binary') {
    if (!Number.isFinite(b) || b <= 0 || b >= 1) return null
    return b * (1 - b)
  }
  if (outcomeType === 'count') {
    if (!Number.isFinite(b) || b <= 0) return null
    return b // Poisson: variance equals the mean
  }
  return null
}

/**
 * Time-to-event outcomes are refused rather than approximated. Power is driven by the
 * number of events, not the number of people, so a figure computed from sample size here
 * would be wrong in a way that looks plausible.
 */
const TIME_TO_EVENT_REFUSAL =
  'Power for a time-to-event outcome is driven by the number of events observed, not the '
  + 'number of people followed. A figure computed from sample size would mislead, so none '
  + 'is given. Ask instead how many events the follow-up period is expected to produce.'

/** Units the effect is expressed in, per outcome type. */
const UNITS = {
  continuous: 'standard deviations',
  binary: 'percentage points',
  count: 'events per unit',
}

/** Two significant figures, which is as much as an illustration can carry. */
function sig2(x) {
  if (!Number.isFinite(x)) return null
  if (x === 0) return 0
  const magnitude = Math.floor(Math.log10(Math.abs(x)))
  const factor = 10 ** (1 - magnitude)
  return Math.round(x * factor) / factor
}

function scaleFor(outcomeType) {
  return outcomeType === 'binary' ? 100 : 1
}

/** Assumptions shared by both modes, stated in full. */
function sharedAssumptions(sample, attritionBand, clustered) {
  const lines = [
    'Two arms, equal allocation, a simple difference between them.',
    `Loss to follow-up: ${ATTRITION_LABEL[attritionBand] ?? 'none assumed'}.`,
  ]
  if (clustered) {
    lines.push(
      // Two decimals rather than two significant figures: the design effect sits just
      // above 1, where rounding to "2" would read as precise and be wrong.
      `Clustering reduces the sample by a design effect of ${Math.round(sample.designEffect * 100) / 100}, `
      + `from ${Math.round(sample.analysed)} analysed to ${Math.round(sample.effective)} `
      + 'effectively independent observations.',
    )
  }
  return lines
}

/**
 * Frequentist mode: the smallest effect the stated sample could detect.
 *
 * Reported as a detectable effect rather than as a required sample, because the question
 * worth asking of a fixed sample is whether what it can detect is an effect anyone would
 * act on.
 */
export function reckonNhst(inputs) {
  if (inputs.outcomeType === 'time_to_event') {
    return { unavailable: TIME_TO_EVENT_REFUSAL }
  }

  const sample = effectiveSample(inputs)
  if (!sample) return null

  const variance = unitVariance(inputs.outcomeType, inputs.baseline)
  if (variance === null) return null

  const standardError = Math.sqrt((4 * variance) / sample.effective)
  const mde = MDE_MULTIPLIER * standardError
  const scale = scaleFor(inputs.outcomeType)

  const figures = [{
    label: 'Smallest effect detectable',
    value: `${sig2(mde * scale)} ${UNITS[inputs.outcomeType]}`,
    note: 'Anything smaller than this would most often be missed, however real it is.',
  }]

  if (inputs.outcomeType === 'binary') {
    const relative = (mde / num(inputs.baseline)) * 100
    figures.push({
      label: 'As a change in the baseline rate',
      value: `${sig2(relative)}%`,
      note: `A move from ${sig2(num(inputs.baseline) * 100)}% to `
        + `${sig2((num(inputs.baseline) + mde) * 100)}%.`,
    })
  }

  return {
    sample,
    figures,
    assumptions: [
      ...sharedAssumptions(sample, inputs.attritionBand, inputs.clustered),
      'Two-sided significance at 5%, power at 80% — conventions, not requirements.',
    ],
  }
}

/**
 * Bayesian mode: the precision the sample would buy, and how much of it the prior supplies.
 *
 * The prior is expressed as the number of observations it is worth, because that is the
 * form in which its contribution can be compared against the data's — and the share it
 * supplies is the figure the `prior_doing_the_work` tension exists to put in front of
 * someone. A small sample does not invalidate the inference; it means this share is large,
 * which is acceptable where the prior can be defended and not otherwise.
 */
export function reckonBayesian(inputs) {
  if (inputs.outcomeType === 'time_to_event') {
    return { unavailable: TIME_TO_EVENT_REFUSAL }
  }

  const sample = effectiveSample(inputs)
  if (!sample) return null

  const variance = unitVariance(inputs.outcomeType, inputs.baseline)
  if (variance === null) return null

  const priorEss = num(inputs.priorEss)
  if (!Number.isFinite(priorEss) || priorEss < 0) return null

  const scale = scaleFor(inputs.outcomeType)
  const units = UNITS[inputs.outcomeType]

  const halfWidth = k => Z_ALPHA * Math.sqrt((4 * variance) / k)
  const withPrior = halfWidth(sample.effective + priorEss)
  const dataOnly = halfWidth(sample.effective)
  const priorShare = priorEss / (sample.effective + priorEss)

  return {
    sample,
    figures: [
      {
        label: '95% credible interval, half-width',
        value: `± ${sig2(withPrior * scale)} ${units}`,
        note: `Data alone would give ± ${sig2(dataOnly * scale)} ${units}.`,
      },
      {
        label: 'Share of posterior precision from the prior',
        value: `${Math.round(priorShare * 100)}%`,
        note: priorShare >= 0.5
          ? 'The prior is supplying most of the answer. That is defensible where the prior '
            + 'can be defended, and not otherwise — it is the thing to take to review.'
          : 'The data are supplying most of the answer.',
      },
    ],
    assumptions: [
      ...sharedAssumptions(sample, inputs.attritionBand, inputs.clustered),
      `The prior is treated as worth ${priorEss} observations, and as agreeing with the `
        + 'data. A prior that conflicts with the data gives a wider interval than this, not '
        + 'a narrower one.',
      'A 95% interval, and a normal posterior — reasonable for a mean or a proportion away '
        + 'from 0 and 1, less so near them.',
    ],
  }
}
