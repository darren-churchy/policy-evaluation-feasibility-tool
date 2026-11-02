// The screen must always be completable.
//
// Reported from use: a real assessment reached "0 questions outstanding" while the screen
// still said 14 of 17, so the statistics section — gated on the screen completing — could
// never open. The saved answers are kept here as the fixture, because the shape of the
// failure matters more than any example I would have invented.
//
// Three separate faults produced it, and each is guarded below.

import { describe, it, expect, beforeAll } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { loadSpec } from '../scripts/lib/loadSpec.mjs'
import { evaluate, screeningSet } from '../src/engine/evaluate.js'
import { variablesIn } from '../src/engine/logic.js'

const ROOT = new URL('..', import.meta.url).pathname
const page = () => readFileSync(join(ROOT, 'src', 'components', 'pages', 'PageAssessment.jsx'), 'utf8')

let spec, reported
beforeAll(() => {
  spec = loadSpec()
  reported = JSON.parse(readFileSync(join(ROOT, 'tests', 'fixtures', 'deadlocked-screen.json'), 'utf8')).answers
})

describe('the reported deadlock', () => {
  it('leaves nothing on the agenda, as it did when reported', () => {
    expect(evaluate(reported, spec).agenda).toEqual([])
  })

  // Fault one: a screening question whose designs are all ruled out stayed outstanding,
  // so the screen could never complete however much was answered.
  it('does not hold the screen open on a question that can no longer matter', () => {
    const { screening } = evaluate(reported, spec)
    expect(screening.moot).toContain('staggered_rollout')
    expect(screening.outstanding).not.toContain('staggered_rollout')
  })

  // Fault two: the only questions still genuinely outstanding were ones the page never
  // asked, because no design rule reads them so they never reach the agenda.
  it('leaves only intake questions outstanding, and the page asks them', () => {
    const { screening } = evaluate(reported, spec)
    const byId = new Map(spec.questions.map(q => [q.id, q]))
    for (const id of screening.outstanding) {
      expect(byId.get(id).intake, `${id} is outstanding but not intake`).toBe(true)
    }
    // The page seeds every intake question regardless of the agenda.
    expect(page()).toMatch(/const intakeIds = useMemo/)
    expect(page()).toMatch(/for \(const id of intakeIds\)/)
  })

  it('completes once those are answered', () => {
    const done = { ...reported, claim_type: 'causal', primary_constraint: 'data' }
    expect(evaluate(done, spec).screening.complete).toBe(true)
  })
})

describe('every screening question can be reached', () => {
  // The general form of fault two. A question in the screen that no rule reads and that
  // is not intake would be unanswerable from the assessment, deadlocking the screen for
  // everyone rather than for one set of answers.
  it('is either read by a rule or asked as intake', () => {
    const readByRules = new Set()
    for (const design of Object.values(spec.rules.designs)) {
      for (const group of ['blockers', 'conditions', 'warnings']) {
        for (const check of design[group] ?? []) {
          for (const v of variablesIn(check.test)) readByRules.add(v)
        }
      }
    }
    const byId = new Map(spec.questions.map(q => [q.id, q]))
    for (const id of screeningSet(spec)) {
      const reachable = readByRules.has(id) || byId.get(id).intake
      expect(reachable, `${id} is in the screen but nothing would ever ask it`).toBe(true)
    }
  })

  // The invariant behind the fix: whatever the answers, the screen is completable.
  it('never leaves a question outstanding that no answer could reach', () => {
    const states = [
      {},
      reported,
      { ...reported, claim_type: 'causal' },
      { intervention_defined: 'no' },
      { prospective: 'no', pre_periods: 'none', record_linkage: 'no' },
    ]
    const byId = new Map(spec.questions.map(q => [q.id, q]))
    for (const answers of states) {
      const r = evaluate(answers, spec)
      for (const id of r.screening.outstanding) {
        const onAgenda = r.agenda.some(a => a.id === id)
        expect(onAgenda || byId.get(id).intake,
          `${id} is outstanding, off the agenda and not intake — the screen cannot complete`).toBe(true)
      }
    }
  })
})

describe('answers stay editable after the last question', () => {
  // Reported alongside the deadlock: once the agenda emptied, every answer vanished from
  // the page, so changing one meant starting again. The card was gated on the agenda
  // rather than on there being anything to show.
  it('renders the question card on what is being asked, not on what is left', () => {
    const source = page()
    expect(source).toMatch(/\{asking\.length > 0 && \(/)
    expect(source, 'gating on the agenda hides every answer once it empties')
      .not.toMatch(/\{agenda\.length > 0 && \(\s*\n\s*<Card>/)
  })

  it('keeps an unanswered intake question on screen even when the agenda is empty', () => {
    expect(page()).toMatch(/answers\[id\] !== undefined \|\| onAgenda\.has\(id\) \|\| intakeIds\.has\(id\)/)
  })
})
