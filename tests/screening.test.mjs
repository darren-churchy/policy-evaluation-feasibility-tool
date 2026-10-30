// The screening checkpoint.
//
// The tool has to be useful to someone deciding where to put their effort, not only to
// someone who has already decided everything. A short run of questions rules most designs
// in or out; stopping there is a complete outcome, not an abandoned one.
//
// The set is DERIVED. These tests pin the derivation rule rather than a list of ids,
// because a list is exactly what drifts: a question added later that rules out four
// designs would sit outside a hand-kept screen and nobody would notice.

import { describe, it, expect, beforeAll } from 'vitest'
import { loadSpec } from '../scripts/lib/loadSpec.mjs'
import { evaluate, screeningSet } from '../src/engine/evaluate.js'
import { variablesIn } from '../src/engine/logic.js'

let spec, screen
beforeAll(() => {
  spec = loadSpec()
  screen = screeningSet(spec)
})

const blockerCounts = spec => {
  const counts = new Map()
  for (const design of Object.values(spec.rules.designs ?? {})) {
    for (const blocker of design.blockers ?? []) {
      for (const v of variablesIn(blocker.test)) counts.set(v, (counts.get(v) ?? 0) + 1)
    }
  }
  return counts
}

describe('the set is derived, not listed', () => {
  it('includes every intake question', () => {
    for (const q of spec.questions.filter(q => q.intake)) {
      expect(screen, `${q.id} is intake and must be screened`).toContain(q.id)
    }
  })

  // The rule in full. If this passes for every question, no hand-kept list is involved.
  it('includes exactly the structural discriminators and nothing else', () => {
    const counts = blockerCounts(spec)
    for (const q of spec.questions) {
      const qualifies = q.intake || (
        q.establishable === 'ex_ante' && !q.applies_when && (counts.get(q.id) ?? 0) >= 2
      )
      expect(screen.includes(q.id), `${q.id}: expected ${qualifies ? 'in' : 'out of'} the screen`)
        .toBe(qualifies)
    }
  })

  // A question that cannot be settled before the data exist cannot be part of a screen
  // done before the data exist.
  it('asks nothing that needs the data in hand', () => {
    const byId = new Map(spec.questions.map(q => [q.id, q]))
    for (const id of screen) {
      expect(byId.get(id).establishable, `${id} needs data and cannot be screened`).toBe('ex_ante')
    }
  })

  // A gated question may not even be askable, so it cannot be required to finish a screen.
  it('asks nothing gated behind another answer', () => {
    const byId = new Map(spec.questions.map(q => [q.id, q]))
    for (const id of screen) {
      if (byId.get(id).intake) continue
      expect(byId.get(id).applies_when, `${id} is gated`).toBeUndefined()
    }
  })

  // The checks above restate the rule, so they catch the implementation drifting from it
  // but not the specification quietly weakening it — gating a key question would shrink
  // the screen and every rule-shaped assertion would still agree with itself. These two
  // are independent of the rule: they measure what the screen actually reaches.
  it('reaches a blocker on every counterfactual design', () => {
    const screen = new Set(screeningSet(spec))
    for (const design of spec.designs.filter(d => d.strand === 'counterfactual')) {
      const blockers = spec.rules.designs[design.id]?.blockers ?? []
      const reachable = blockers.some(b => [...variablesIn(b.test)].some(v => screen.has(v)))
      expect(reachable, `${design.id} cannot be ruled out by anything in the screen`).toBe(true)
    }
  })

  it('reaches most of the blockers in the specification', () => {
    const screen = new Set(screeningSet(spec))
    const blockers = Object.values(spec.rules.designs)
      .flatMap(r => r.blockers ?? [])
    const reached = blockers.filter(b => [...variablesIn(b.test)].some(v => screen.has(v)))
    // 74% when this was written. A floor, not a target: if it drops, something that rules
    // designs out has moved outside the screen.
    expect(reached.length / blockers.length).toBeGreaterThan(0.65)
  })

  it('is a small fraction of the whole bank', () => {
    expect(screen.length).toBeLessThan(spec.questions.length / 2)
    expect(screen.length).toBeGreaterThan(8)
  })
})

describe('what the screen reports', () => {
  const COMPLETE = {
    claim_type: 'causal', intervention_defined: 'yes', theory_of_change: 'yes',
    maturity: 'yes', delivery_consistency: 'yes', primary_constraint: 'data',
    record_linkage: 'individual', prospective: 'no', randomisation_barriers: 'impossible',
    allocation_unit: 'cluster', assignment_threshold: 'no', pre_periods: 'many',
    comparison_group: 'yes', staggered_rollout: 'no', policy_date_known: 'yes',
    cointerventions: 'none_known', covariate_richness: 'rich',
  }

  it('tracks progress before it is complete', () => {
    const { screening } = evaluate({ intervention_defined: 'yes' }, spec)
    expect(screening.complete).toBe(false)
    expect(screening.answered).toEqual(['intervention_defined'])
    expect(screening.outstanding.length).toBe(screening.questions.length - 1)
  })

  it('completes once every screening question is answered', () => {
    const { screening } = evaluate(COMPLETE, spec)
    expect(screening.complete).toBe(true)
    expect(screening.outstanding).toEqual([])
  })

  // The honest headline. The ladder rules out fast and rules in slowly, so a screen that
  // led on a recommendation would be silent exactly when it is most needed.
  it('reports what is ruled out and what remains, not a recommendation', () => {
    const result = evaluate(COMPLETE, spec)
    expect(result.screening.ruledOut.length).toBeGreaterThan(0)
    expect(result.screening.live.length).toBeGreaterThan(0)
    expect(result.screening.highestLiveTier).not.toBeNull()
    // Still no recommendation at this point, which is the thing it must not pretend to.
    expect(result.recommendation).toBeNull()
  })

  it('counts only counterfactual designs, leaving the theory-based strand aside', () => {
    const { screening, designs } = evaluate(COMPLETE, spec)
    for (const id of [...screening.ruledOut, ...screening.live]) {
      expect(designs[id].strand).toBe('counterfactual')
    }
  })

  // "Still in play" means "nothing has ruled it out", which is weaker than feasible.
  it('counts an unestablished design as in play, not as available', () => {
    const { screening, designs } = evaluate(COMPLETE, spec)
    const unknown = screening.live.filter(id => designs[id].state === 'unknown')
    expect(unknown.length, 'the distinction only matters if some are unestablished')
      .toBeGreaterThan(0)
  })

  it('leaves nothing in play when a readiness gate has fired', () => {
    const { screening, recommendation } = evaluate(
      { ...COMPLETE, intervention_defined: 'no' }, spec,
    )
    expect(recommendation).toBeNull()
    expect(screening.complete).toBe(true)
  })
})
