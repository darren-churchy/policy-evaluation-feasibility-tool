import { describe, it, expect, beforeAll } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { parse } from 'yaml'
import { parseCsvRecords } from '../scripts/lib/csv.mjs'

const ROOT = new URL('..', import.meta.url).pathname
const read = f => readFileSync(join(ROOT, 'spec', f), 'utf8')

/** Every `var` referenced inside a JSON Logic expression. */
function varsIn(node, found = new Set()) {
  if (Array.isArray(node)) { node.forEach(n => varsIn(n, found)); return found }
  if (!node || typeof node !== 'object') return found
  for (const [k, v] of Object.entries(node)) {
    if (k === 'var') found.add(Array.isArray(v) ? v[0] : v)
    else varsIn(v, found)
  }
  return found
}

let questions, rules, designs, qById, allChecks

beforeAll(() => {
  questions = parse(read('questions.yaml')).questions
  rules = parse(read('rules.yaml')).designs
  designs = parseCsvRecords(read('designs.csv'), { pipeSeparated: ['estimator_options'] }).records
  qById = new Map(questions.map(q => [q.id, q]))
  allChecks = []
  for (const [designId, groups] of Object.entries(rules)) {
    for (const [group, checks] of Object.entries(groups)) {
      for (const check of checks) allChecks.push({ designId, group, check })
    }
  }
})

describe('rules.yaml — coverage', () => {
  it('defines rules for every design in the register', () => {
    const withRules = new Set(Object.keys(rules))
    const missing = designs.map(d => d.id).filter(id => !withRules.has(id))
    expect(missing, 'every design needs at least one rule or it can never be anything but Feasible').toEqual([])
  })

  it('defines rules only for designs that exist', () => {
    const designIds = new Set(designs.map(d => d.id))
    expect(Object.keys(rules).filter(id => !designIds.has(id))).toEqual([])
  })

  it('gives every counterfactual design at least one blocker', () => {
    const counterfactual = designs.filter(d => d.strand === 'counterfactual').map(d => d.id)
    const without = counterfactual.filter(id => !(rules[id].blockers?.length > 0))
    expect(without, 'a counterfactual design with no blocker can never be ruled out').toEqual([])
  })
})

describe('rules.yaml — every check is well formed', () => {
  it('carries at least one citation, so every rule is traceable to a source', () => {
    const uncited = allChecks.filter(c => !(c.check.citations?.length > 0))
      .map(c => `${c.designId}.${c.group}[${c.check.id}]`)
    expect(uncited).toEqual([])
  })

  it('gives every condition unlock text saying what would discharge it', () => {
    const noUnlock = allChecks.filter(c => c.group === 'conditions' && !c.check.unlock)
      .map(c => `${c.designId}.conditions[${c.check.id}]`)
    expect(noUnlock, 'a condition without an unlock tells the user they are stuck without saying why').toEqual([])
  })

  it('references at least one answer in every test', () => {
    // The engine decides Unknown from the variables a test reads. A test referencing no
    // answer would evaluate the same before and after the user has answered anything,
    // which is exactly the defect the redesign exists to fix.
    const constant = allChecks.filter(c => varsIn(c.check.test).size === 0)
      .map(c => `${c.designId}.${c.group}[${c.check.id}]`)
    expect(constant).toEqual([])
  })

  it('uses ids that are unique within their design and group', () => {
    for (const [designId, groups] of Object.entries(rules)) {
      for (const [group, checks] of Object.entries(groups)) {
        const ids = checks.map(c => c.id)
        expect(new Set(ids).size, `${designId}.${group} has duplicate check ids`).toBe(ids.length)
      }
    }
  })
})

describe('rules.yaml — cross-file integrity', () => {
  it('only tests questions that exist', () => {
    const bad = []
    for (const { designId, group, check } of allChecks) {
      for (const v of varsIn(check.test)) {
        if (!qById.has(v)) bad.push(`${designId}.${group}[${check.id}] -> ${v}`)
      }
    }
    expect(bad).toEqual([])
  })

  it('only compares against option values those questions offer', () => {
    // A typo'd value makes a blocker silently never fire, which surfaces as a design
    // looking Feasible when it has simply never been checked.
    const bad = []
    const walk = (node, cb) => {
      if (Array.isArray(node)) return node.forEach(n => walk(n, cb))
      if (!node || typeof node !== 'object') return
      for (const [op, args] of Object.entries(node)) {
        if (['==', '!=', '===', '!=='].includes(op) && Array.isArray(args) && args.length === 2) {
          const [a, b] = args
          if (a?.var && (typeof b === 'string' || typeof b === 'number')) cb(a.var, String(b))
        } else if (op === 'in' && Array.isArray(args?.[1])) {
          const [a, list] = args
          if (a?.var) for (const v of list) if (typeof v === 'string') cb(a.var, v)
        }
        walk(args, cb)
      }
    }
    for (const { designId, group, check } of allChecks) {
      walk(check.test, (qid, value) => {
        const q = qById.get(qid)
        if (q && !q.options.some(o => String(o.value) === value)) {
          bad.push(`${designId}.${group}[${check.id}] compares ${qid} with "${value}"`)
        }
      })
    }
    expect(bad).toEqual([])
  })
})

describe('questions.yaml — integrity', () => {
  it('has unique question ids', () => {
    const ids = questions.map(q => q.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('gives every option a distinct value within its question', () => {
    for (const q of questions) {
      const values = q.options.map(o => String(o.value))
      expect(new Set(values).size, `${q.id} has duplicate option values`).toBe(values.length)
    }
  })

  it('carries no stray option properties from unquoted commas in YAML flow mappings', () => {
    // A comma inside an unquoted flow-mapping value starts a new key, silently turning
    // part of a label into a bogus property. Caught once already in this file.
    const allowed = new Set(['value', 'label', 'hint', 'not_established'])
    const stray = []
    for (const q of questions) {
      for (const o of q.options) {
        for (const k of Object.keys(o)) if (!allowed.has(k)) stray.push(`${q.id}: "${k}"`)
      }
    }
    expect(stray).toEqual([])
  })

  it('only gates on questions that exist', () => {
    const bad = []
    for (const q of questions) {
      if (!q.applies_when) continue
      for (const v of varsIn(q.applies_when)) if (!qById.has(v)) bad.push(`${q.id} -> ${v}`)
    }
    expect(bad).toEqual([])
  })
})

describe('no question feeds nothing', () => {
  // The defect this redesign exists to fix: the previous tool collected 80 inputs and
  // scored on 23. Any question that reaches no rule is burden without purpose.
  //
  // A question counts as consumed if it reaches a rule test, a gating condition, a
  // readiness gate, the stage inference, a routing rule, an advisory guidance note, or the
  // statistics module.

  it('consumes every question', () => {
    const stages = parse(read('stages.yaml'))
    const consumed = new Set()

    for (const { check } of allChecks) for (const v of varsIn(check.test)) consumed.add(v)
    for (const q of questions) if (q.applies_when) for (const v of varsIn(q.applies_when)) consumed.add(v)
    for (const r of stages.readiness) { consumed.add(r.question); varsIn(r.fires_when).forEach(v => consumed.add(v)) }
    for (const r of stages.inference) varsIn(r.when).forEach(v => consumed.add(v))
    for (const r of stages.routing) varsIn(r.when).forEach(v => consumed.add(v))
    for (const g of stages.guidance ?? []) consumed.add(g.question)

    const statistics = parse(read('statistics.yaml'))
    for (const q of statistics.shared_questions) consumed.add(q)
    for (const approach of Object.values(statistics.approaches)) {
      for (const q of approach.questions) consumed.add(q)
      for (const t of approach.tensions) varsIn(t.when).forEach(v => consumed.add(v))
    }
    for (const m of statistics.ready_reckoner?.modes ?? []) for (const q of m.inputs) consumed.add(q)

    const orphans = questions.map(q => q.id).filter(id => !consumed.has(id))
    expect(orphans, 'a question reaching nothing is burden without purpose').toEqual([])
  })

  it('counts a question as consumed by the statistics module too', () => {
    // Statistics questions reach no design rule — they are consumed by statistics.yaml.
    // Without this the orphan check above would force them into rules they do not belong in.
    const statistics = parse(read('statistics.yaml'))
    const inStatistics = new Set([
      ...statistics.shared_questions,
      ...Object.values(statistics.approaches).flatMap(a => a.questions),
    ])
    expect(inStatistics.has('analysis_approach')).toBe(true)
    expect(inStatistics.size).toBe(25)
  })

  it('keeps the intake questions marked as intake', () => {
    for (const id of ['claim_type', 'intervention_defined', 'maturity', 'theory_of_change']) {
      expect(qById.get(id)?.intake, `${id} should be intake`).toBe(true)
    }
  })
})

describe('thresholds are presented honestly', () => {
  it('marks every numeric threshold with the basis it rests on', () => {
    const withThreshold = allChecks.filter(c => c.check.threshold)
    expect(withThreshold.length, 'expected some thresholds to exist').toBeGreaterThan(0)
    for (const { designId, check } of withThreshold) {
      expect(check.threshold.basis, `${designId}.${check.id} threshold needs a basis`).toBeTruthy()
      expect(['convention', 'derived', 'regulatory']).toContain(check.threshold.basis)
    }
  })

  it('carries a range alongside any contested threshold', () => {
    // The plan requires contested numbers to appear as ranges with their source rather
    // than as a single figure implying more precision than the literature supports.
    for (const { designId, check } of allChecks.filter(c => c.check.threshold?.contested)) {
      expect(check.threshold.range, `${designId}.${check.id} is contested so needs a range`).toHaveLength(2)
    }
  })

  it('treats the first-stage F convention as contested, per Lee et al. 2022', () => {
    const f = rules.iv_2sls.conditions.find(c => c.id === 'weak_instrument')
    expect(f.threshold.value).toBe(10)
    expect(f.threshold.basis).toBe('convention')
    expect(f.threshold.contested).toBe(true)
    expect(f.citations).toContain('lee_etal_2022')
  })

  it('treats the eight-points-per-segment ITS minimum as a convention, not a derived figure', () => {
    const t = rules.its.conditions.find(c => c.id === 'few_points').threshold
    expect(t.value).toBe(8)
    expect(t.basis).toBe('convention')
    expect(t.range).toEqual([6, 12])
  })
})

describe('specific rules the methodology depends on', () => {
  it('warns that TWFE can place negative weights under staggered adoption', () => {
    const w = rules.did_staggered.warnings.find(c => c.id === 'twfe_negative_weights')
    expect(w.citations).toEqual(expect.arrayContaining(['goodman_bacon_2021', 'callaway_santanna_2021']))
    expect(w.message, 'this is an estimator warning and must not read as a tier change').toMatch(/does not change the tier/)
  })

  it('routes between the 2x2 and staggered DiD designs rather than letting both apply', () => {
    expect(rules.did_2x2.blockers.some(b => b.id === 'staggered_adoption')).toBe(true)
    expect(rules.did_staggered.blockers.some(b => b.id === 'not_staggered')).toBe(true)
  })

  it('blocks sharp RD where the cutoff is fuzzy, pointing to the fuzzy design', () => {
    expect(rules.rd_sharp.blockers.some(b => b.id === 'not_sharp')).toBe(true)
  })

  it('blocks controlled ITS without a control series, since that is a Tier 5 design', () => {
    const b = rules.its_controlled.blockers.find(b => b.id === 'no_control_series')
    expect(b.message).toMatch(/Tier 5/)
  })

  it('treats a failed exclusion restriction as a blocker for IV, not a condition', () => {
    // The exclusion restriction is the entire basis of the design; a doubtful one is not
    // something that can be discharged by further work.
    expect(rules.iv_2sls.blockers.some(b => b.id === 'exclusion_fails')).toBe(true)
  })

  it('requires a sensitivity analysis rather than blocking when confounders are unmeasured', () => {
    for (const design of ['matching', 'weighting', 'gcomp', 'gmethods']) {
      const c = rules[design].conditions.find(c => c.id === 'unmeasured_confounding')
      expect(c, `${design} should condition on unmeasured confounding`).toBeDefined()
      expect(c.citations).toContain('vanderweele_ding_2017')
    }
  })

  it('gives the theory-based strand no blockers based on counterfactual requirements', () => {
    // The strand is never ruled out by the absence of comparison data — that is the
    // circumstance in which it becomes primary.
    const counterfactualQuestions = ['pre_periods', 'comparison_group', 'overlap', 'randomisation_barriers']
    for (const id of ['contribution_analysis', 'realist', 'process_tracing']) {
      for (const check of [...(rules[id].blockers ?? []), ...(rules[id].conditions ?? [])]) {
        for (const v of varsIn(check.test)) {
          expect(counterfactualQuestions, `${id} must not depend on ${v}`).not.toContain(v)
        }
      }
    }
  })
})
