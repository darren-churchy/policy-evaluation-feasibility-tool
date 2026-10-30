// What the assessment page shows, and when.
//
// These assert the engine-side facts the page's behaviour rests on, so a change to the
// rules that would silently alter the flow — questions staying on the agenda when they can
// no longer matter, or the screen never completing — fails here rather than being noticed
// by whoever is scrolling.

import { describe, it, expect, beforeAll } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { loadSpec } from '../scripts/lib/loadSpec.mjs'
import { evaluate } from '../src/engine/evaluate.js'

const ROOT = new URL('..', import.meta.url).pathname
const page = () => readFileSync(join(ROOT, 'src', 'components', 'pages', 'PageAssessment.jsx'), 'utf8')

let spec
beforeAll(() => { spec = loadSpec() })

const READY = {
  intervention_defined: 'yes', theory_of_change: 'yes', maturity: 'yes',
  record_linkage: 'individual',
}

describe('questions stop being asked once they cannot change anything', () => {
  // The behaviour the page relies on: a question leaves the agenda when every design that
  // depended on it has been ruled out.
  it('drops the randomised questions once the intervention has been delivered', () => {
    const before = evaluate(READY, spec).agenda.map(a => a.id)
    const after = evaluate({ ...READY, prospective: 'no' }, spec).agenda.map(a => a.id)

    for (const id of ['randomisation_barriers', 'allocation_unit', 'equipoise']) {
      expect(before, `${id} should be asked before`).toContain(id)
      expect(after, `${id} cannot matter once nothing can be randomised`).not.toContain(id)
    }
  })

  it('drops the panel and time-series questions when there is no pre-intervention data', () => {
    const base = { ...READY, prospective: 'no' }
    const before = evaluate(base, spec).agenda.map(a => a.id)
    const after = evaluate({ ...base, pre_periods: 'none' }, spec).agenda.map(a => a.id)

    // parallel_trends_evidence is deliberately absent from both: it is gated behind
    // comparison_group, so it is not asked until there is a comparison group to ask about.
    expect(before).not.toContain('parallel_trends_evidence')

    for (const id of ['time_points', 'control_series', 'cointerventions', 'policy_date_known']) {
      expect(before).toContain(id)
      expect(after, `${id} cannot matter with no pre-period data`).not.toContain(id)
    }
    // 16 questions to 8 when this was written: one answer halves what is left to ask.
    expect(after.length).toBeLessThanOrEqual(before.length / 2)
  })

  // The page renders `shown` filtered to what still applies. If the agenda ever stopped
  // shrinking, that filter would silently do nothing.
  it('the agenda only ever shrinks as answers accumulate', () => {
    const steps = [
      {}, READY,
      { ...READY, prospective: 'no' },
      { ...READY, prospective: 'no', pre_periods: 'none' },
      { ...READY, prospective: 'no', pre_periods: 'none', covariate_richness: 'sparse' },
    ]
    const lengths = steps.map(a => evaluate(a, spec).agenda.length)
    for (let i = 2; i < lengths.length; i++) {
      expect(lengths[i], `step ${i} grew the agenda`).toBeLessThanOrEqual(lengths[i - 1])
    }
  })
})

describe('the page defers what it cannot yet usefully ask', () => {
  // Four screens of questions about priors and multiplicity, in front of someone still
  // establishing whether any design works, put the longest section before the shortest
  // useful one.
  it('withholds the statistics module until the screen is complete', () => {
    expect(evaluate(READY, spec).screening.complete).toBe(false)
    const source = page()
    expect(source, 'the statistics module must be gated on the screen')
      .toMatch(/result\.screening\.complete \? \(/)
  })

  it('renders only the questions that still apply, not everything ever shown', () => {
    const source = page()
    expect(source).toMatch(/const asking = shown\.filter\(stillApplies\)/)
    expect(source).toMatch(/const noLongerApply = shown\.filter\(id => !stillApplies\(id\)\)/)
    expect(source, 'the question list must render `asking`, not `shown`')
      .toMatch(/\{asking\.map\(id => \{/)
  })

  it('keeps the summary in view rather than letting it scroll away', () => {
    expect(page()).toMatch(/position: 'sticky'/)
  })

  it('collapses the ladder, which runs to several screens', () => {
    expect(page()).toMatch(/The ladder — all \{/)
  })
})

describe('the summary carries the verdict, not just a count', () => {
  it('reports designs ruled out as well as the highest rung', () => {
    const source = page()
    expect(source).toMatch(/Ruled out/)
    expect(source).toMatch(/Highest rung/)
  })

  // It must not claim a rung the engine has not established.
  it('says nothing is established when nothing is', () => {
    const r = evaluate(READY, spec)
    expect(r.highestFeasibleTier).toBeNull()
    expect(r.recommendation).toBeNull()
  })
})
