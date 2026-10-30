import { describe, it, expect, beforeAll } from 'vitest'
import { loadSpec } from '../scripts/lib/loadSpec.mjs'
import { evaluate } from '../src/engine/evaluate.js'

// The seven scenarios from the redesign plan. These are phase 2's acceptance test: if
// they pass, the ladder behaves as the methodology says it should.
//
// Readiness is supplied in every scenario except the gate one, because a fired gate
// suppresses the recommendation entirely — which is the point of scenario 6.

const READY = {
  claim_type: 'causal',
  intervention_defined: 'yes',
  theory_of_change: 'yes',
  maturity: 'yes',
  // Linkage is supplied too, so these scenarios exercise design logic rather than data
  // access. Without it every counterfactual design is Unknown, which is correct but tests
  // something else — tests/engine.test.mjs covers that case directly.
  record_linkage: 'individual',
}

let spec
beforeAll(() => { spec = loadSpec() })

const run = answers => evaluate(answers, spec)

describe('Scenario 1 — allocation can be randomised, enough clusters', () => {
  let r
  beforeAll(() => {
    r = run({
      ...READY,
      prospective: 'yes',
      randomisation_barriers: 'none',
      allocation_unit: 'cluster',
      cluster_count: 'many',
      rollout_order_controllable: 'yes',
      equipoise: 'yes',
    })
  })

  it('makes Tier 1 feasible', () => {
    expect(r.highestFeasibleTier).toBe(1)
    expect(r.recommendation.tier).toBe(1)
  })

  it('recommends the cluster design, since the intervention is delivered to groups', () => {
    expect(r.recommendation.designs).toContain('rct_cluster')
    expect(r.designs.rct_cluster.state).toBe('feasible')
  })

  it('blocks individual randomisation, because allocation is at cluster level', () => {
    expect(r.designs.rct_individual.state).toBe('blocked')
    expect(r.designs.rct_individual.blockers.map(b => b.id)).toContain('cluster_delivered')
  })

  it('leaves the theory-based strand complementary, not primary', () => {
    expect(r.theoryBased.role).toBe('complementary')
    expect(r.theoryBased.candidate).toBe(false)
  })

  it('reaches Test and Grow together', () => {
    expect(r.stage.stages).toEqual(['test', 'grow'])
  })
})

describe('Scenario 2 — published score threshold, rule enforced, sorting not yet tested', () => {
  let r
  beforeAll(() => {
    r = run({
      ...READY,
      prospective: 'no',
      assignment_threshold: 'yes',
      threshold_enforced: 'sharp',
      threshold_manipulation: 'untested',
      density_near_cutoff: 'many',
    })
  })

  it('puts sharp RD at Tier 2 as the best available rung', () => {
    expect(r.designs.rd_sharp.tier).toBe(2)
    expect(r.highestConditionalTier).toBe(2)
  })

  it('lists the density test as a condition, not as a granted assumption', () => {
    // An untested running variable is something to discharge, not something to assume.
    const ids = r.designs.rd_sharp.conditions.map(c => c.id)
    expect(ids).toContain('manipulation_untested')
    expect(r.designs.rd_sharp.state).toBe('conditional')
  })

  it('says what would discharge it, citing the density test', () => {
    const condition = r.designs.rd_sharp.conditions.find(c => c.id === 'manipulation_untested')
    expect(condition.unlock).toMatch(/density test/i)
    expect(condition.citations).toContain('mccrary_2008')
  })

  it('blocks every randomised design, since the intervention has already been delivered', () => {
    const tier1 = r.ladder.find(l => l.tier === 1).designs
    expect(tier1.every(d => d.state === 'blocked')).toBe(true)
  })
})

describe('Scenario 3 — phased rollout not yet begun, years of pre-data, comparison units', () => {
  let r
  beforeAll(() => {
    r = run({
      ...READY,
      prospective: 'yes',
      staggered_rollout: 'planned',
      rollout_order_controllable: 'partly',
      pre_periods: 'many',
      comparison_group: 'yes',
      parallel_trends_evidence: 'untested',
      randomisation_barriers: 'some',
      allocation_unit: 'cluster',
      cluster_count: 'many',
    })
  })

  it('makes staggered DiD conditional on the parallel-trends argument', () => {
    expect(r.designs.did_staggered.state).toBe('conditional')
    expect(r.designs.did_staggered.conditions.map(c => c.id)).toContain('trends_untested')
  })

  it('names randomising the rollout order as the route to Tier 1', () => {
    const unlock = r.designs.did_staggered.conditions
      .find(c => c.id === 'rollout_not_begun').unlock
    expect(unlock).toMatch(/randomis/i)
    expect(unlock).toMatch(/Tier 1/)
  })

  it('warns that two-way fixed effects is the wrong estimator here, without changing the tier', () => {
    const warning = r.designs.did_staggered.warnings.find(w => w.id === 'twfe_negative_weights')
    expect(warning).toBeDefined()
    expect(warning.message).toMatch(/does not change the tier/)
    expect(r.designs.did_staggered.tier).toBe(3)
  })

  it('blocks the 2x2 design rather than offering both', () => {
    expect(r.designs.did_2x2.state).toBe('blocked')
    expect(r.designs.did_2x2.blockers.map(b => b.id)).toContain('staggered_adoption')
  })

  it('surfaces the reachable Tier 1 rather than settling for the Tier 3 fallback', () => {
    // The rollout has not begun and its order is still partly open, so a randomised
    // design is available. The ladder recommends the highest feasible rung, which is the
    // whole point of ordering by identifying assumption.
    expect(r.highestFeasibleTier).toBe(1)
    expect(r.recommendation.tier).toBe(1)
    expect(r.designs.rct_stepped_wedge.state).toBe('conditional')
    expect(r.designs.rct_stepped_wedge.conditions.map(c => c.id)).toContain('partial_control')
  })

  it('keeps staggered DiD available as the fallback at Tier 3', () => {
    expect(r.designs.did_staggered.tier).toBe(3)
    expect(r.designs.did_staggered.state).toBe('conditional')
  })
})

describe('Scenario 4 — single site, no comparison group, one series', () => {
  let r
  beforeAll(() => {
    r = run({
      ...READY,
      prospective: 'no',
      comparison_group: 'no',
      donor_pool: 'no',
      control_series: 'no',
      pre_periods: 'many',
      policy_date_known: 'yes',
      time_points: 'few',
      autocorrelation_plan: 'yes',
      cointerventions: 'possible',
      assignment_threshold: 'no',
      instrument_available: 'no',
      covariate_richness: 'sparse',
      time_varying_confounding: 'no',
    })
  })

  it('leaves Tier 5 as the only available rung, and conditional', () => {
    expect(r.designs.its.state).toBe('conditional')
    expect(r.highestFeasibleTier).toBeNull()
    expect(r.highestConditionalTier).toBe(5)
  })

  it('blocks every comparison-group design', () => {
    for (const id of ['did_2x2', 'did_staggered', 'synth', 'its_controlled']) {
      expect(r.designs[id].state, `${id} should be blocked`).toBe('blocked')
    }
  })

  it('blocks RDIT, which needs observations close to the date rather than a long series', () => {
    // Without this RDIT and ITS would be indistinguishable, and RDIT sits two rungs
    // higher — so ITS could never be the recommendation on any answers at all.
    expect(r.designs.rdit.state).toBe('blocked')
    expect(r.designs.rdit.blockers.map(b => b.id)).toContain('too_sparse_near_date')
  })

  it('flags the theory-based strand as a candidate for the primary role', () => {
    // A rung is technically available, but only the weakest one, which rests entirely on
    // the pre-intervention trend continuing.
    expect(r.theoryBased.candidate).toBe(true)
    expect(r.theoryBased.reasons.join(' ')).toMatch(/Tier 5/)
  })

  it('tells the user a control series would move the design up a rung', () => {
    const warning = r.designs.its.warnings.find(w => w.id === 'no_counterfactual_check')
    expect(warning.message).toMatch(/Tier 3/)
  })
})

describe('Scenario 5 — cross-sectional data only, rich covariates', () => {
  let r
  beforeAll(() => {
    r = run({
      ...READY,
      prospective: 'no',
      pre_periods: 'none',
      comparison_group: 'possible',
      covariate_richness: 'rich',
      overlap: 'good',
      confounders_measured: 'some_unmeasured',
      time_varying_confounding: 'no',
      assignment_threshold: 'no',
      instrument_available: 'no',
      policy_date_known: 'no',
    })
  })

  it('makes Tier 4 the best available rung, conditional on unmeasured confounding', () => {
    expect(r.highestConditionalTier).toBe(4)
    expect(r.designs.matching.state).toBe('conditional')
    expect(r.designs.matching.conditions.map(c => c.id)).toContain('unmeasured_confounding')
  })

  it('asks for a sensitivity analysis rather than blocking', () => {
    const condition = r.designs.matching.conditions.find(c => c.id === 'unmeasured_confounding')
    expect(condition.unlock).toMatch(/sensitivity analysis/i)
    expect(condition.citations).toContain('vanderweele_ding_2017')
  })

  it('blocks the panel designs for want of pre-intervention data', () => {
    expect(r.designs.did_2x2.state).toBe('blocked')
    expect(r.designs.its.state).toBe('blocked')
  })

  it('warns that good balance is not evidence against unmeasured confounding', () => {
    const warning = r.designs.matching.warnings.find(w => w.id === 'balance_not_bias')
    expect(warning.message).toMatch(/not evidence/i)
  })
})

describe('Scenario 6 — intervention not defined', () => {
  let r
  beforeAll(() => {
    r = run({
      claim_type: 'causal',
      intervention_defined: 'no',
      theory_of_change: 'yes',
      maturity: 'yes',
      prospective: 'yes',
      randomisation_barriers: 'none',
      allocation_unit: 'individual',
      equipoise: 'yes',
      record_linkage: 'individual',
    })
  })

  it('fails readiness on a hard gate', () => {
    expect(r.readiness.status).toBe('failed')
    expect(r.readiness.gates.map(g => g.id)).toContain('intervention_specified')
  })

  it('makes no recommendation, even though a randomised design would otherwise be feasible', () => {
    // This is the gate doing its job: no data situation resolves a missing specification.
    expect(r.designs.rct_individual.state).toBe('feasible')
    expect(r.recommendation).toBeNull()
  })

  it('infers the Co-design stage', () => {
    expect(r.stage.stages).toEqual(['co_design'])
  })

  it('routes to process or developmental work rather than to a counterfactual design', () => {
    const gate = r.readiness.gates.find(g => g.id === 'intervention_specified')
    expect(gate.redirect).toMatch(/process evaluation/i)
    expect(r.routes.some(route => route.from === 'readiness_gate' && route.to === 'theory_based_strand')).toBe(true)
  })
})

describe('Scenario 7 — every answer blank', () => {
  let r
  beforeAll(() => { r = run({}) })

  it('leaves every design Unknown', () => {
    const states = new Set(Object.values(r.designs).map(d => d.state))
    expect(states).toEqual(new Set(['unknown']))
  })

  it('makes no recommendation', () => {
    // The previous tool produced a top recommendation before anything was answered,
    // because unanswered questions scored 0.4 to 0.6 rather than nothing.
    expect(r.recommendation).toBeNull()
    expect(r.highestFeasibleTier).toBeNull()
    expect(r.highestConditionalTier).toBeNull()
  })

  it('reports readiness as undetermined rather than passed', () => {
    expect(r.readiness.status).toBe('undetermined')
    expect(r.readiness.passed).toBe(false)
  })

  it('leaves the theory-based role undetermined rather than guessing', () => {
    expect(r.theoryBased.role).toBe('undetermined')
  })

  it('puts the readiness gates at the top of the question agenda', () => {
    const top = r.agenda.slice(0, 3).map(a => a.id).sort()
    expect(top).toEqual(['intervention_defined', 'maturity', 'theory_of_change'])
  })

  it('asks nothing whose gating condition has not been met', () => {
    // cluster_count only applies once allocation_unit is known.
    expect(r.agenda.map(a => a.id)).not.toContain('cluster_count')
  })
})
