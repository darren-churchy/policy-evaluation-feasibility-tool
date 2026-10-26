// The tool assesses PROSPECTIVE feasibility.
//
// Some things cannot honestly be established until the data exist — whether treated and
// untreated units overlap, how many observations sit near a cutoff, how strong a first
// stage is. The tool still has to be usable before any of that is known, which means
// three things have to hold, and holding them by careful authoring is not enough.
//
// `spec/questions.yaml` has stated the principle in its header from the start. These
// tests are what make it true.

import { describe, it, expect, beforeAll } from 'vitest'
import { loadSpec } from '../scripts/lib/loadSpec.mjs'
import { evaluate } from '../src/engine/evaluate.js'

let spec, questions, unestablished

beforeAll(() => {
  spec = loadSpec()
  questions = spec.questions
  // question id -> the values meaning "I have not established this yet"
  unestablished = new Map(
    questions
      .map(q => [q.id, new Set((q.options ?? []).filter(o => o.not_established).map(o => o.value))])
      .filter(([, values]) => values.size),
  )
})

/** Every {question, value} pair a JSON Logic test compares. */
function comparisons(node, found = []) {
  if (!node || typeof node !== 'object') return found
  for (const [op, args] of Object.entries(node)) {
    if ((op === '==' || op === '!=') && Array.isArray(args) && args[0]?.var) {
      found.push({ question: args[0].var, value: args[1] })
    } else if (op === 'in' && Array.isArray(args) && args[0]?.var) {
      for (const value of args[1] ?? []) found.push({ question: args[0].var, value })
    } else if (Array.isArray(args)) {
      for (const arg of args) comparisons(arg, found)
    } else {
      comparisons(args, found)
    }
  }
  return found
}

describe('every question declares whether it can be settled in advance', () => {
  it('marks each one ex_ante or needs_data', () => {
    for (const q of questions) {
      expect(['ex_ante', 'needs_data'], `${q.id}`).toContain(q.establishable)
    }
  })

  // Without this a user with no data has to pick between "good" and "poor" overlap, and
  // whichever they pick is then treated as a finding.
  it('gives every needs_data question a way to say it is not yet established', () => {
    for (const q of questions.filter(q => q.establishable === 'needs_data')) {
      const escape = (q.options ?? []).filter(o => o.not_established)
      expect(escape.length, `${q.id} must offer a not_established option`).toBeGreaterThan(0)
    }
  })

  // The six that genuinely need the data in hand. Pinned so that reclassifying one is a
  // deliberate act rather than a side effect.
  it('holds the agreed classification', () => {
    const needsData = questions.filter(q => q.establishable === 'needs_data').map(q => q.id).sort()
    expect(needsData).toEqual([
      'density_near_cutoff',
      'instrument_strength',
      'overlap',
      'parallel_trends_evidence',
      'threshold_enforced',
      'threshold_manipulation',
    ])
  })
})

describe('not having checked is never the same as having found a problem', () => {
  // The central guarantee. A blocker says the design cannot work. Firing one on an
  // unchecked value would rule a design out on the strength of an absent answer — the
  // mirror of the defect the three-valued logic exists to prevent.
  it('no blocker fires on a value meaning not yet established', () => {
    const offenders = []
    for (const [design, rules] of Object.entries(spec.rules.designs ?? {})) {
      for (const blocker of rules.blockers ?? []) {
        for (const { question, value } of comparisons(blocker.test)) {
          if (unestablished.get(question)?.has(value)) {
            offenders.push(`${design}/${blocker.id} on ${question}="${value}"`)
          }
        }
      }
    }
    expect(offenders).toEqual([])
  })

  // An unchecked answer has to lead somewhere. If it raises no condition, answering
  // honestly is indistinguishable from not answering, and the user is given no task.
  it('every unchecked value a rule reads carries unlock text telling the user what to do', () => {
    const readUnchecked = new Set()
    const withUnlock = new Set()

    for (const rules of Object.values(spec.rules.designs ?? {})) {
      for (const kind of ['blockers', 'conditions', 'warnings']) {
        for (const check of rules[kind] ?? []) {
          for (const { question, value } of comparisons(check.test)) {
            if (!unestablished.get(question)?.has(value)) continue
            readUnchecked.add(`${question}=${value}`)
            if (kind === 'conditions' && check.unlock) withUnlock.add(`${question}=${value}`)
          }
        }
      }
    }

    const silent = [...readUnchecked].filter(k => !withUnlock.has(k))
    expect(silent, 'these are read by a rule but discharge nothing').toEqual([])
  })
})

describe('a needs_data question answered honestly does not sink the design', () => {
  // The behaviour the whole thing is for: saying "I have not checked overlap yet" should
  // leave matching Conditional with something to go and do, not Blocked.
  const base = {
    intervention_defined: 'yes',
    theory_of_change: 'yes',
    maturity: 'yes',
    prospective: 'no',
    comparison_group: 'yes',
    covariate_richness: 'rich',
    confounders_measured: 'all_identified',
  }

  it('leaves matching conditional, with an unlock, when overlap is untested', () => {
    const result = evaluate({ ...base, overlap: 'untested' }, spec)
    const matching = result.designs.matching
    expect(matching.state).toBe('conditional')
    expect(matching.conditions.some(c => c.unlock)).toBe(true)
  })

  it('blocks matching only once overlap has actually been found poor', () => {
    const result = evaluate({ ...base, overlap: 'poor' }, spec)
    expect(result.designs.matching.state).toBe('blocked')
  })

  it('leaves a sharp discontinuity conditional when density has not been counted', () => {
    const result = evaluate(
      { ...base, assignment_threshold: 'yes', threshold_enforced: 'sharp', density_near_cutoff: 'unknown' },
      spec,
    )
    const rd = result.designs.rd_sharp
    expect(rd.state).not.toBe('blocked')
    expect(rd.conditions.some(c => c.id === 'density_unchecked')).toBe(true)
  })
})
