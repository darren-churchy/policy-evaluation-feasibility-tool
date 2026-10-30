// Practical constraints are advice, never feasibility.
//
// The old tool let data availability and causal validity trade against each other, so a
// difference-in-differences with good data could outrank a randomised trial with adequate
// data. The ladder removed that. A deadline or a budget reintroducing it by the back door
// — reordering the ladder, or making a weaker design "recommended" because it is cheaper —
// would be the same defect wearing different clothes.
//
// So the guarantee here is the one the context packs and the ready-reckoner already have:
// the engine returns this and is structurally unable to act on it.

import { describe, it, expect, beforeAll } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { loadSpec } from '../scripts/lib/loadSpec.mjs'
import { evaluate } from '../src/engine/evaluate.js'

const ROOT = new URL('..', import.meta.url).pathname

let spec
beforeAll(() => { spec = loadSpec() })

const BASE = {
  intervention_defined: 'yes', theory_of_change: 'yes', maturity: 'yes',
  prospective: 'no', comparison_group: 'yes', pre_periods: 'many',
  parallel_trends_evidence: 'supported', staggered_rollout: 'no',
  cointerventions: 'none_known', covariate_richness: 'rich',
}

const CONSTRAINTS = ['time', 'data', 'budget', 'ethics', 'unsure']

/** Everything that constitutes a verdict. Guidance and routes are advice. */
const verdict = result => JSON.stringify({
  designs: result.designs,
  ladder: result.ladder,
  recommendation: result.recommendation,
  nextRungUp: result.nextRungUp,
  highestFeasibleTier: result.highestFeasibleTier,
  highestConditionalTier: result.highestConditionalTier,
  theoryBased: result.theoryBased,
  readiness: result.readiness,
  agenda: result.agenda,
})

describe('a practical constraint cannot change a verdict', () => {
  it('gives byte-identical verdicts whatever the constraint is', () => {
    const baseline = verdict(evaluate(BASE, spec))
    for (const constraint of CONSTRAINTS) {
      expect(verdict(evaluate({ ...BASE, primary_constraint: constraint }, spec)),
        `constraint "${constraint}" changed a verdict`).toBe(baseline)
    }
  })

  // Specifically the thing the old tool got wrong: cost and speed favour the lower rungs,
  // so a constraint that reordered anything would reorder it downwards.
  it('does not reorder the ladder', () => {
    const order = result => result.ladder.map(r => [r.tier, r.designs.map(d => d.id).join(',')].join(':'))
    const baseline = order(evaluate(BASE, spec))
    for (const constraint of CONSTRAINTS) {
      expect(order(evaluate({ ...BASE, primary_constraint: constraint }, spec))).toEqual(baseline)
    }
  })

  it('does not reorder the question agenda', () => {
    const ids = result => result.agenda.map(a => a.id)
    const baseline = ids(evaluate(BASE, spec))
    for (const constraint of CONSTRAINTS) {
      expect(ids(evaluate({ ...BASE, primary_constraint: constraint }, spec))).toEqual(baseline)
    }
  })

  // The structural half: no rule may read it at all.
  it('is read by no design rule', () => {
    const json = JSON.stringify(spec.rules)
    expect(json).not.toContain('primary_constraint')
  })
})

describe('it still does its job', () => {
  it('returns the note matching the stated constraint, and only that one', () => {
    for (const constraint of CONSTRAINTS) {
      const { guidance } = evaluate({ ...BASE, primary_constraint: constraint }, spec)
      expect(guidance).toHaveLength(1)
      expect(guidance[0].question).toBe('primary_constraint')
      expect(guidance[0].note.length).toBeGreaterThan(40)
    }
  })

  it('returns nothing while the constraint is unanswered', () => {
    expect(evaluate(BASE, spec).guidance).toEqual([])
  })

  it('covers every option the question offers', () => {
    const question = spec.questions.find(q => q.id === 'primary_constraint')
    const covered = new Set((spec.stages.guidance ?? [])
      .filter(g => g.question === 'primary_constraint').map(g => String(g.when)))
    for (const option of question.options) {
      expect(covered, `no guidance for "${option.value}"`).toContain(String(option.value))
    }
  })
})

describe('the new intake questions', () => {
  it('asks about delivery consistency, with an explicit not-yet-established answer', () => {
    const q = spec.questions.find(x => x.id === 'delivery_consistency')
    expect(q).toBeTruthy()
    expect(q.intake).toBe(true)
    expect(q.options.map(o => o.value)).toEqual(['yes', 'unsure', 'no'])
    expect(q.options.find(o => o.value === 'unsure').not_established).toBe(true)
  })

  // Delivery variation changes what the estimand means; it does not make evaluation
  // impossible. A gate here would be wrong.
  it('warns on inconsistent delivery rather than gating on it', () => {
    const result = evaluate({ ...BASE, delivery_consistency: 'no' }, spec)
    expect(result.readiness.status).not.toBe('failed')
    expect(result.readiness.warnings.some(w => w.id === 'delivery_consistent')).toBe(true)
  })

  it('warns separately when delivery consistency has not been checked', () => {
    const result = evaluate({ ...BASE, delivery_consistency: 'unsure' }, spec)
    expect(result.readiness.status).not.toBe('failed')
    expect(result.readiness.warnings.some(w => w.id === 'delivery_consistency_unchecked')).toBe(true)
  })

  it('every readiness warning carries a redirect', () => {
    for (const item of spec.stages.readiness) {
      expect(item.redirect, `${item.id} has no redirect`).toBeTruthy()
    }
  })
})

describe('claim_type is a scope gate, not a taxonomy', () => {
  // The earlier version asked the user to sort their question into describe / predict /
  // causal and routed "describe" to the qualitative strand — which confused a quantitative
  // descriptive question with qualitative research, and implied impact evaluation is only
  // counterfactual when the tool carries a theory-based strand precisely because it is not.
  it('offers causal, other and unsure', () => {
    const q = spec.questions.find(x => x.id === 'claim_type')
    expect(q.options.map(o => o.value)).toEqual(['causal', 'other', 'unsure'])
  })

  it('sends anyone not sure to the question-typing tool rather than guessing for them', () => {
    const routes = evaluate({ claim_type: 'unsure' }, spec).routes
    expect(routes.some(r => r.to === 'question_typing')).toBe(true)
  })

  it('routes a causal question to the assessment', () => {
    const routes = evaluate({ claim_type: 'causal' }, spec).routes
    expect(routes.some(r => r.to === 'assessment')).toBe(true)
  })

  it('does not route a non-causal question into the ladder', () => {
    const routes = evaluate({ claim_type: 'other' }, spec).routes
    expect(routes.some(r => r.to === 'assessment')).toBe(false)
    expect(routes.some(r => r.to === 'question_typing')).toBe(true)
  })

  it('no longer claims a descriptive question is a qualitative one', () => {
    const source = readFileSync(join(ROOT, 'spec', 'stages.yaml'), 'utf8')
    expect(source).not.toMatch(/claim_type \}, describe/)
    expect(source).not.toMatch(/claim_type \}, predict/)
  })
})
