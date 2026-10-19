import { describe, it, expect, beforeAll } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { loadSpec } from '../scripts/lib/loadSpec.mjs'
import { evaluate } from '../src/engine/evaluate.js'
import { variablesIn } from '../src/engine/logic.js'

const ROOT = new URL('..', import.meta.url).pathname

let spec, stats, qById
beforeAll(() => {
  spec = loadSpec()
  stats = spec.statistics
  qById = new Map(spec.questions.map(q => [q.id, q]))
})

// The plan's phase 3 acceptance criterion. Sample size does a different job under each
// approach, so the Bayesian set is not a translation of the frequentist one — but it must
// not therefore be the thinner one.
describe('both approaches have equal depth', () => {
  it('asks the same number of questions', () => {
    expect(stats.approaches.bayesian.questions.length)
      .toBe(stats.approaches.nhst.questions.length)
  })

  it('raises the same number of tensions', () => {
    expect(stats.approaches.bayesian.tensions.length)
      .toBe(stats.approaches.nhst.tensions.length)
  })

  it('states what the sample is for under each', () => {
    for (const name of ['nhst', 'bayesian']) {
      expect(stats.approaches[name].sample_role, `${name} needs a sample_role`).toBeTruthy()
    }
  })

  it('records the framing that a small sample does not invalidate a Bayesian inference', () => {
    // The point of docs/BAYESIAN_SAMPLE_SIZE.md, and the thing most likely to be lost if
    // the Bayesian branch is ever rewritten by someone who has not read it.
    const role = stats.approaches.bayesian.sample_role
    expect(role).toMatch(/does not invalidate/i)
    expect(role, 'the corollary must travel with the claim').toMatch(/prior supplies more/i)
  })
})

describe('statistics.yaml — integrity', () => {
  it('lists only questions that exist', () => {
    const all = [
      ...stats.shared_questions,
      ...stats.approaches.nhst.questions,
      ...stats.approaches.bayesian.questions,
    ]
    for (const qid of all) expect(qById.has(qid), `${qid} is not a question`).toBe(true)
  })

  it('asks for the approach before anything that depends on it', () => {
    expect(stats.shared_questions[0]).toBe('analysis_approach')
  })

  it('gates every approach-specific question on the approach', () => {
    for (const [name, values] of [['nhst', ['nhst', 'both']], ['bayesian', ['bayesian', 'both']]]) {
      for (const qid of stats.approaches[name].questions) {
        const q = qById.get(qid)
        expect(q.applies_when, `${qid} must be gated on the approach`).toBeTruthy()
        expect(variablesIn(q.applies_when).has('analysis_approach')).toBe(true)
        expect(JSON.stringify(q.applies_when)).toContain(values[0])
      }
    }
  })

  it('gives every tension a condition, a message and a prompt', () => {
    for (const name of ['nhst', 'bayesian']) {
      for (const t of stats.approaches[name].tensions) {
        expect(t.when, `${t.id} needs a condition — an unconditional tension is a leaflet`).toBeTruthy()
        expect(t.message, `${t.id} needs a message`).toBeTruthy()
        expect(t.prompt, `${t.id} needs a prompt — the tool produces questions, not verdicts`).toBeTruthy()
        expect(t.citations?.length, `${t.id} needs a source`).toBeGreaterThan(0)
      }
    }
  })

  it('names a quantity for every counterfactual design', () => {
    const covered = new Set(stats.design_quantities.map(d => d.design))
    const missing = spec.designs
      .filter(d => d.strand === 'counterfactual')
      .map(d => d.id)
      .filter(id => !covered.has(id))
    expect(missing, 'every design needs the quantity that plays the role of N').toEqual([])
  })

  it('names no quantity for the theory-based strand, which has no N', () => {
    const theory = new Set(spec.designs.filter(d => d.strand === 'theory_based').map(d => d.id))
    for (const q of stats.design_quantities) expect(theory.has(q.design)).toBe(false)
  })

  it('says total sample is the wrong quantity where it is', () => {
    // The specific correction most worth making: a large dataset can be thin where it counts.
    const rd = stats.design_quantities.find(d => d.design === 'rd_sharp')
    expect(rd.quantity).toMatch(/cutoff/i)
    expect(rd.note).toMatch(/[Nn]ot the total/)
    const cluster = stats.design_quantities.find(d => d.design === 'rct_cluster')
    expect(cluster.quantity).toMatch(/clusters/i)
  })

  it('offers a comparison covering both approaches on every dimension', () => {
    expect(stats.undecided_comparison.length).toBeGreaterThan(0)
    for (const row of stats.undecided_comparison) {
      expect(row.topic).toBeTruthy()
      expect(row.nhst).toBeTruthy()
      expect(row.bayesian).toBeTruthy()
    }
  })
})

describe('the engine never reads the ready-reckoner', () => {
  // The plan requires this to be enforced by test. An illustrative figure must not be able
  // to reach a verdict, however the UI later chooses to present it.

  it('produces identical output when the ready-reckoner is replaced wholesale', () => {
    const answers = {
      analysis_approach: 'bayesian',
      bayes_prior_source: 'elicited',
      bayes_elicitation_protocol: 'informal',
      bayes_prior_share: 'unknown',
      prospective: 'no',
      pre_periods: 'many',
      comparison_group: 'yes',
    }
    const before = evaluate(answers, spec)

    const tampered = {
      ...spec,
      statistics: {
        ...spec.statistics,
        ready_reckoner: {
          engine_reads: true,
          note: 'tampered',
          modes: [{ approach: 'nhst', inputs: ['outcome_type'], outputs: 'nonsense' }],
          detectable_effect: 0.001,
          recommended_tier: 1,
        },
      },
    }
    const after = evaluate(answers, tampered)

    expect(JSON.stringify(after)).toBe(JSON.stringify(before))
  })

  it('does not reference the ready-reckoner anywhere in the engine source', () => {
    for (const file of ['evaluate.js', 'logic.js']) {
      const source = readFileSync(join(ROOT, 'src', 'engine', file), 'utf8')
      const code = source.replace(/\/\/.*$/gm, '').replace(/\/\*[\s\S]*?\*\//g, '')
      expect(code, `${file} must not read the ready-reckoner`).not.toMatch(/ready_reckoner|readyReckoner/)
    }
  })

  it('declares engine_reads false in the specification', () => {
    expect(stats.ready_reckoner.engine_reads).toBe(false)
  })

  it('labels it illustrative', () => {
    expect(stats.ready_reckoner.note).toMatch(/[Ii]llustrative/)
  })
})

describe('the engine statistics output', () => {
  const run = a => evaluate(a, spec).statistics

  it('shows the comparison screen while the approach is undecided', () => {
    const s = run({ analysis_approach: 'undecided' })
    expect(s.branches).toEqual([])
    expect(s.comparison.length).toBeGreaterThan(0)
  })

  it('shows the comparison screen before the approach is answered at all', () => {
    expect(run({}).comparison.length).toBeGreaterThan(0)
  })

  it('activates one branch for a single approach', () => {
    expect(run({ analysis_approach: 'nhst' }).branches.map(b => b.approach)).toEqual(['nhst'])
    expect(run({ analysis_approach: 'bayesian' }).branches.map(b => b.approach)).toEqual(['bayesian'])
  })

  it('activates both branches when both approaches are planned', () => {
    expect(run({ analysis_approach: 'both' }).branches.map(b => b.approach)).toEqual(['nhst', 'bayesian'])
  })

  it('hides the comparison once an approach is chosen', () => {
    expect(run({ analysis_approach: 'nhst' }).comparison).toEqual([])
  })

  it('raises no tension from an unanswered input', () => {
    // An unresolved condition must leave the tension unraised, not raised in error — the
    // same guarantee the design verdicts rely on.
    const s = run({ analysis_approach: 'bayesian' })
    expect(s.branches[0].tensions).toEqual([])
  })

  it('raises a tension once the answers warrant it', () => {
    const s = run({ analysis_approach: 'nhst', nhst_multiplicity: 'unplanned' })
    expect(s.branches[0].tensions.map(t => t.id)).toContain('multiplicity_unplanned')
  })

  it('gives every raised tension a prompt to take to a statistician', () => {
    const s = run({
      analysis_approach: 'bayesian',
      bayes_prior_source: 'elicited',
      bayes_elicitation_protocol: 'informal',
      bayes_prior_share: 'unknown',
      bayes_sensitivity: 'no',
    })
    expect(s.branches[0].tensions.length).toBeGreaterThan(0)
    for (const t of s.branches[0].tensions) expect(t.prompt).toBeTruthy()
  })

  it('names the underpowered-rescue risk when the prior is doing the work', () => {
    const s = run({
      analysis_approach: 'bayesian',
      bayes_prior_source: 'elicited',
      bayes_prior_share: 'unknown',
    })
    const tension = s.branches[0].tensions.find(t => t.id === 'prior_doing_the_work')
    expect(tension, 'this is the tension the research pass exists to surface').toBeDefined()
    expect(tension.message).toMatch(/underpowered/i)
    expect(tension.prompt).toMatch(/sceptical prior/i)
  })

  it('reports only the outstanding questions for the chosen approach', () => {
    const s = run({ analysis_approach: 'nhst', nhst_mde: 'agreed' })
    expect(s.branches[0].unanswered).not.toContain('nhst_mde')
    expect(s.branches[0].unanswered).toContain('nhst_alpha_power')
  })

  it('withholds the elicitation-protocol question until a prior is elicited', () => {
    const notElicited = run({ analysis_approach: 'bayesian', bayes_prior_source: 'weak' })
    expect(notElicited.branches[0].questions).not.toContain('bayes_elicitation_protocol')

    const elicited = run({ analysis_approach: 'bayesian', bayes_prior_source: 'elicited' })
    expect(elicited.branches[0].questions).toContain('bayes_elicitation_protocol')
  })

  it('narrows the design quantities to the designs still in play', () => {
    const narrow = evaluate({
      claim_type: 'causal', intervention_defined: 'yes', theory_of_change: 'yes', maturity: 'yes',
      analysis_approach: 'nhst',
      prospective: 'yes', randomisation_barriers: 'none', allocation_unit: 'individual',
      equipoise: 'yes',
    }, spec).statistics

    const ids = narrow.designQuantities.map(d => d.design)
    expect(ids).toContain('rct_individual')
    expect(ids.length).toBeLessThan(spec.statistics.design_quantities.length)
  })
})
