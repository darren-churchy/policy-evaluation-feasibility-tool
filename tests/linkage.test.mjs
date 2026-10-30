// Record linkage.
//
// A structural constraint rather than a data-quality note: an effect is a contrast between
// outcomes with and without treatment, so estimating one requires observing both on the
// same units. Where that is impossible, no amount of methodological sophistication helps,
// and the tool should say so before asking anything design-specific.
//
// The partition below is the methodological claim, so it is pinned. Changing which designs
// survive which level of linkage means deliberately changing this file.

import { describe, it, expect, beforeAll } from 'vitest'
import { loadSpec } from '../scripts/lib/loadSpec.mjs'
import { evaluate } from '../src/engine/evaluate.js'

let spec
beforeAll(() => { spec = loadSpec() })

const READY = { intervention_defined: 'yes', theory_of_change: 'yes', maturity: 'yes' }

const states = (value) => {
  const result = evaluate({ ...READY, record_linkage: value }, spec)
  const counterfactual = Object.values(result.designs).filter(d => d.strand === 'counterfactual')
  return {
    blocked: counterfactual.filter(d => d.state === 'blocked').map(d => d.id).sort(),
    conditional: counterfactual.filter(d => d.state === 'conditional').map(d => d.id).sort(),
    surviving: counterfactual.filter(d => d.state !== 'blocked').map(d => d.id).sort(),
  }
}

describe('no linkage at all', () => {
  // All that remains is a single outcome series and a date. That supports an interrupted
  // time series, and nothing stronger — every other design needs treatment and outcome
  // brought together somehow, even if only at the level of an area.
  it('leaves only the single-series designs', () => {
    expect(states('no').surviving).toEqual(['its', 'rdit'])
  })

  it('blocks the other seventeen', () => {
    expect(states('no').blocked).toHaveLength(17)
  })

  it('gives a reason on each, not a bare verdict', () => {
    const result = evaluate({ ...READY, record_linkage: 'no' }, spec)
    const blocker = result.designs.matching.blockers.find(b => b.id === 'no_record_linkage')
    expect(blocker).toBeTruthy()
    expect(blocker.message).toMatch(/no contrast to estimate/)
  })
})

describe('group-level linkage only', () => {
  // The designs that compare individuals by construction. There is no group-level version
  // of a within-person contrast, or of a region of common support over people.
  it('blocks the designs that compare individuals', () => {
    expect(states('group').blocked).toEqual([
      'encouragement', 'gcomp', 'gmethods', 'iv_2sls', 'matching',
      'rct_crossover', 'rct_individual', 'rct_waitlist', 'weighting',
    ])
  })

  // An eligibility rule can apply to areas or cohorts rather than people, so this is a
  // condition with a change of estimand, not a blocker.
  it('leaves the discontinuity designs conditional rather than ruled out', () => {
    const { blocked, conditional } = states('group')
    for (const id of ['rd_sharp', 'rd_fuzzy']) {
      expect(blocked).not.toContain(id)
      expect(conditional).toContain(id)
    }
  })

  it('tells the discontinuity designs what would discharge it', () => {
    const result = evaluate({ ...READY, record_linkage: 'group' }, spec)
    const condition = result.designs.rd_sharp.conditions.find(c => c.id === 'group_level_assignment_rule')
    expect(condition.unlock).toMatch(/estimand at that level/)
  })

  it('keeps the cluster-allocated and area-level designs available', () => {
    const { surviving } = states('group')
    for (const id of ['rct_cluster', 'rct_stepped_wedge', 'did_2x2', 'synth', 'its_controlled']) {
      expect(surviving, `${id} should survive group-level linkage`).toContain(id)
    }
  })
})

describe('linkage not yet established', () => {
  // The prospective-feasibility invariant in miniature: not having checked is not the same
  // as having found a problem.
  it('blocks nothing', () => {
    expect(states('unsure').blocked).toEqual([])
  })

  it('leaves the affected designs conditional, with something to go and do', () => {
    const { conditional } = states('unsure')
    expect(conditional).toHaveLength(17)
    const result = evaluate({ ...READY, record_linkage: 'unsure' }, spec)
    const condition = result.designs.matching.conditions.find(c => c.id === 'record_linkage_unchecked')
    expect(condition.unlock).toMatch(/identifiers/)
    expect(condition.unlock, 'this is settleable now, and should say so').toMatch(/does not need the data/)
  })
})

describe('full linkage', () => {
  it('rules nothing out on linkage grounds', () => {
    expect(states('individual').blocked).toEqual([])
    expect(states('individual').conditional).toEqual([])
  })
})

describe('missing outcomes are asked about separately from attrition', () => {
  // A unit leaving the study and a record with an empty outcome field are different
  // events, arising for different reasons and handled differently. Merging them would lose
  // that.
  it('asks both, of everyone', () => {
    expect(spec.statistics.shared_questions).toContain('outcome_missingness')
    expect(spec.statistics.shared_questions).toContain('expected_attrition')
  })

  it('raises a tension under each approach, not just one', () => {
    for (const approach of ['nhst', 'bayesian']) {
      const answers = {
        ...READY, record_linkage: 'individual',
        analysis_approach: approach, outcome_missingness: 'high',
      }
      const branch = evaluate(answers, spec).statistics.branches.find(b => b.approach === approach)
      expect(branch.tensions.map(t => t.id).join(' '), `${approach} raises nothing`)
        .toMatch(/missing/)
    }
  })

  // They are not translations of each other: the frequentist concern is bias from
  // complete-case analysis, the Bayesian one is a prior buying precision the observed
  // records cannot support.
  it('says something different under each', () => {
    const run = approach => {
      const answers = {
        ...READY, record_linkage: 'individual',
        analysis_approach: approach, outcome_missingness: 'high',
      }
      return evaluate(answers, spec).statistics.branches
        .find(b => b.approach === approach).tensions
        .find(t => /missing/.test(t.id))
    }
    expect(run('nhst').message).toMatch(/complete-case/i)
    expect(run('bayesian').message).toMatch(/prior/i)
    expect(run('nhst').message).not.toBe(run('bayesian').message)
  })

  it('raises it when the share has not been established, as well as when it is high', () => {
    const answers = {
      ...READY, record_linkage: 'individual',
      analysis_approach: 'nhst', outcome_missingness: 'unknown',
    }
    const branch = evaluate(answers, spec).statistics.branches[0]
    expect(branch.tensions.map(t => t.id)).toContain('missing_outcomes_unhandled')
  })

  it('stays quiet when missingness is low', () => {
    const answers = {
      ...READY, record_linkage: 'individual',
      analysis_approach: 'nhst', outcome_missingness: 'low',
    }
    const branch = evaluate(answers, spec).statistics.branches[0]
    expect(branch.tensions.map(t => t.id)).not.toContain('missing_outcomes_unhandled')
  })
})
