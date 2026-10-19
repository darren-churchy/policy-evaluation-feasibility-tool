import { describe, it, expect, beforeAll } from 'vitest'
import { evaluateLogic, variablesIn, unansweredIn, supportedOperators, UNKNOWN } from '../src/engine/logic.js'
import { evaluate, STATES } from '../src/engine/evaluate.js'
import { loadSpec } from '../scripts/lib/loadSpec.mjs'

describe('three-valued logic', () => {
  const A = { x: 'yes', y: 'no' }

  it('reads an answered variable', () => {
    expect(evaluateLogic({ var: 'x' }, A)).toBe('yes')
  })

  it.each([
    ['absent', {}],
    ['null', { x: null }],
    ['empty string', { x: '' }],
  ])('treats an %s answer as unknown', (_label, answers) => {
    expect(evaluateLogic({ var: 'x' }, answers)).toBe(UNKNOWN)
  })

  it('compares answered values', () => {
    expect(evaluateLogic({ '==': [{ var: 'x' }, 'yes'] }, A)).toBe(true)
    expect(evaluateLogic({ '==': [{ var: 'x' }, 'no'] }, A)).toBe(false)
    expect(evaluateLogic({ '!=': [{ var: 'x' }, 'no'] }, A)).toBe(true)
  })

  // The central guarantee. With ordinary logic this returns false, the blocker does not
  // fire, and a design nobody has assessed presents as feasible.
  it('returns unknown rather than false when comparing an unanswered variable', () => {
    expect(evaluateLogic({ '==': [{ var: 'missing' }, 'no'] }, A)).toBe(UNKNOWN)
    expect(evaluateLogic({ '!=': [{ var: 'missing' }, 'no'] }, A)).toBe(UNKNOWN)
    expect(evaluateLogic({ in: [{ var: 'missing' }, ['a', 'b']] }, A)).toBe(UNKNOWN)
  })

  it('handles membership tests', () => {
    expect(evaluateLogic({ in: [{ var: 'x' }, ['yes', 'maybe']] }, A)).toBe(true)
    expect(evaluateLogic({ in: [{ var: 'x' }, ['no']] }, A)).toBe(false)
  })

  describe('Kleene propagation', () => {
    const T = { '==': [{ var: 'x' }, 'yes'] }   // true
    const F = { '==': [{ var: 'y' }, 'yes'] }   // false
    const U = { '==': [{ var: 'z' }, 'yes'] }   // unknown

    it('resolves OR as soon as one branch is true, even with an unanswered branch', () => {
      // This is what lets stage inference conclude "Test" the moment any readiness
      // answer is partial, without waiting for the others.
      expect(evaluateLogic({ or: [T, U] }, A)).toBe(true)
    })

    it('leaves OR unknown when no branch is true and one is unanswered', () => {
      expect(evaluateLogic({ or: [F, U] }, A)).toBe(UNKNOWN)
    })

    it('resolves AND to false as soon as one branch is false', () => {
      expect(evaluateLogic({ and: [F, U] }, A)).toBe(false)
    })

    it('leaves AND unknown when nothing is false and one branch is unanswered', () => {
      expect(evaluateLogic({ and: [T, U] }, A)).toBe(UNKNOWN)
    })

    it('propagates unknown through negation', () => {
      expect(evaluateLogic({ '!': [U] }, A)).toBe(UNKNOWN)
      expect(evaluateLogic({ '!': [T] }, A)).toBe(false)
    })
  })

  it('throws on an operator it does not implement rather than returning false', () => {
    // A silently misevaluated rule is worse than a loud failure: it would read as the
    // design being fine.
    expect(() => evaluateLogic({ '>': [{ var: 'x' }, 1] }, A)).toThrow(/unsupported/i)
    expect(() => evaluateLogic({ missing: [] }, A)).toThrow(/unsupported/i)
  })

  it('throws on a malformed expression with more than one operator', () => {
    expect(() => evaluateLogic({ '==': [1, 1], '!=': [1, 2] }, A)).toThrow(/exactly one operator/)
  })

  it('reports the variables an expression reads, and which are unanswered', () => {
    const expr = { or: [{ '==': [{ var: 'a' }, 1] }, { in: [{ var: 'b' }, ['x'] ] }] }
    expect(variablesIn(expr)).toEqual(new Set(['a', 'b']))
    expect(unansweredIn(expr, { a: 'set' })).toEqual(['b'])
  })
})

describe('the specification uses only operators the engine implements', () => {
  it('has no operator outside the supported set', () => {
    const spec = loadSpec()
    const supported = supportedOperators()
    const found = new Set()

    const walk = node => {
      if (Array.isArray(node)) return node.forEach(walk)
      if (!node || typeof node !== 'object') return
      for (const [key, value] of Object.entries(node)) {
        if (key !== 'var') found.add(key)
        walk(value)
      }
    }
    for (const groups of Object.values(spec.rules.designs)) {
      for (const checks of Object.values(groups)) for (const c of checks) walk(c.test)
    }
    for (const q of spec.questions) if (q.applies_when) walk(q.applies_when)
    for (const r of spec.stages.readiness) walk(r.fires_when)
    for (const r of spec.stages.inference) walk(r.when)
    for (const r of spec.stages.routing) if (r.when) walk(r.when)

    const unsupported = [...found].filter(op => !supported.has(op))
    expect(unsupported, 'the engine would throw on these at runtime').toEqual([])
  })
})

describe('state resolution', () => {
  let spec
  beforeAll(() => { spec = loadSpec() })

  it('orders states worst-first', () => {
    expect(STATES).toEqual(['blocked', 'conditional', 'unknown', 'feasible'])
  })

  it('takes the worst state, so a good answer never offsets a bad one', () => {
    // Individual RCT with no barriers at all except that the intervention has already
    // been delivered: everything else is fine, and it is still blocked.
    const r = evaluate({
      prospective: 'no',
      randomisation_barriers: 'none',
      allocation_unit: 'individual',
      equipoise: 'yes',
    }, spec)
    expect(r.designs.rct_individual.state).toBe('blocked')
  })

  it('reports a blocked design without inventing conditions for it', () => {
    const r = evaluate({ prospective: 'no', allocation_unit: 'individual' }, spec)
    const d = r.designs.rct_individual
    expect(d.blockers.length).toBeGreaterThan(0)
    expect(d.state).toBe('blocked')
  })

  it('lists the unanswered questions a design is waiting on', () => {
    const r = evaluate({ prospective: 'yes' }, spec)
    const d = r.designs.rct_individual
    expect(d.state).toBe('unknown')
    expect(d.unknowns).toContain('randomisation_barriers')
    expect(d.unknowns, 'prospective is answered, so it is not outstanding').not.toContain('prospective')
  })

  it('does not let an unanswered warning make a design unknown', () => {
    // Warnings never change the state, so they must not generate unknowns either.
    const r = evaluate({
      prospective: 'yes',
      randomisation_barriers: 'none',
      allocation_unit: 'individual',
      equipoise: 'yes',
    }, spec)
    expect(r.designs.rct_individual.state).toBe('feasible')
  })
})

describe('evaluate() is pure', () => {
  let spec
  beforeAll(() => { spec = loadSpec() })

  it('does not mutate the answers it is given', () => {
    const answers = { prospective: 'yes', randomisation_barriers: 'none' }
    const before = JSON.stringify(answers)
    evaluate(answers, spec)
    expect(JSON.stringify(answers)).toBe(before)
  })

  it('does not mutate the spec', () => {
    const before = JSON.stringify(spec)
    evaluate({ prospective: 'yes' }, spec)
    expect(JSON.stringify(spec)).toBe(before)
  })

  it('returns the same result for the same input', () => {
    const answers = { prospective: 'no', pre_periods: 'many', comparison_group: 'yes' }
    expect(JSON.stringify(evaluate(answers, spec))).toBe(JSON.stringify(evaluate(answers, spec)))
  })

  it('tolerates being called with no answers at all', () => {
    expect(() => evaluate(undefined, spec)).not.toThrow()
    expect(evaluate(undefined, spec).recommendation).toBeNull()
  })
})

describe('the question agenda', () => {
  let spec
  beforeAll(() => { spec = loadSpec() })

  it('only asks questions that could change a verdict', () => {
    const r = evaluate({}, spec)
    const ids = r.agenda.map(a => a.id)
    expect(ids.length).toBeGreaterThan(0)
    // Every item must be read by a design that is currently unknown, or gate readiness.
    for (const item of r.agenda) {
      expect(item.affects.length > 0 || item.gatesReadiness).toBe(true)
    }
  })

  it('never asks a question that has already been answered', () => {
    const answers = { prospective: 'yes', intervention_defined: 'yes' }
    const ids = evaluate(answers, spec).agenda.map(a => a.id)
    for (const answered of Object.keys(answers)) expect(ids).not.toContain(answered)
  })

  it('withholds a question until its gating condition is met', () => {
    const before = evaluate({}, spec).agenda.map(a => a.id)
    expect(before).not.toContain('cluster_count')

    const after = evaluate({ allocation_unit: 'cluster' }, spec).agenda.map(a => a.id)
    expect(after).toContain('cluster_count')
  })

  it('shrinks as questions are answered', () => {
    const empty = evaluate({}, spec).agenda.length
    const partial = evaluate({
      intervention_defined: 'yes', theory_of_change: 'yes', maturity: 'yes', prospective: 'no',
    }, spec).agenda.length
    expect(partial).toBeLessThan(empty)
  })
})

describe('the ladder', () => {
  let spec
  beforeAll(() => { spec = loadSpec() })

  it('exposes all five rungs with their identifying assumptions', () => {
    const r = evaluate({}, spec)
    expect(r.ladder.map(l => l.tier)).toEqual([1, 2, 3, 4, 5])
    for (const rung of r.ladder) expect(rung.identifyingAssumption).toBeTruthy()
  })

  it('places every counterfactual design on exactly one rung', () => {
    const r = evaluate({}, spec)
    const onLadder = r.ladder.flatMap(l => l.designs.map(d => d.id))
    const counterfactual = Object.values(r.designs).filter(d => d.strand === 'counterfactual')
    expect(onLadder.sort()).toEqual(counterfactual.map(d => d.id).sort())
  })

  it('keeps the theory-based designs off the ladder entirely', () => {
    const r = evaluate({}, spec)
    const onLadder = new Set(r.ladder.flatMap(l => l.designs.map(d => d.id)))
    for (const id of r.theoryBasedDesigns) expect(onLadder.has(id)).toBe(false)
  })

  it('recommends the highest feasible rung, not the one with the most designs', () => {
    const r = evaluate({
      claim_type: 'causal', intervention_defined: 'yes', theory_of_change: 'yes', maturity: 'yes',
      prospective: 'yes', randomisation_barriers: 'none', allocation_unit: 'individual',
      equipoise: 'yes',
      // Plenty available lower down too.
      pre_periods: 'many', comparison_group: 'yes', parallel_trends_evidence: 'supported',
      staggered_rollout: 'no', covariate_richness: 'rich', overlap: 'good',
      confounders_measured: 'all_identified',
    }, spec)
    expect(r.recommendation.tier).toBe(1)
  })
})
