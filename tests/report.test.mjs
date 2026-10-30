// The shareable report.
//
// Its job is to be honest to someone who will never open the tool. Most of these tests
// are about what it must NOT say — above all, that it must not imply a recommendation
// exists when none does, which is the ordinary case rather than the edge case.

import { describe, it, expect, beforeAll } from 'vitest'
import { loadSpec } from '../scripts/lib/loadSpec.mjs'
import { evaluate } from '../src/engine/evaluate.js'
import { buildReport } from '../src/report/buildReport.js'

let spec
beforeAll(() => { spec = loadSpec() })

const render = answers => buildReport({
  result: evaluate(answers, spec),
  answers,
  spec,
  date: '30 October 2026',
})

const READY = {
  intervention_defined: 'yes', theory_of_change: 'yes', maturity: 'yes',
  record_linkage: 'individual',
}

describe('it is a complete, self-contained page', () => {
  it('needs no scripts and no external assets', () => {
    const html = render({ ...READY, prospective: 'no' })
    expect(html).not.toMatch(/<script/i)
    expect(html).not.toMatch(/https?:\/\//)
  })

  it('is reproducible — the same inputs give the same bytes', () => {
    const answers = { ...READY, prospective: 'no', comparison_group: 'yes' }
    expect(render(answers)).toBe(render(answers))
  })

  // Traceability: a report that cannot be tied to the rules that produced it cannot be
  // defended months later when the rules have moved on.
  it('carries the specification version it was produced against', () => {
    expect(render(READY)).toContain(evaluate(READY, spec).specVersion)
  })
})

describe('it does not overclaim', () => {
  it('says plainly that nothing is established when nothing is', () => {
    const html = render({})
    expect(html).toContain('Not enough answered to reach a verdict')
    expect(html).not.toContain('Most likely to be feasible')
  })

  // The common case early on, and the one the tool exists for.
  it('still reports what is ruled out before anything is feasible', () => {
    const html = render({ ...READY, prospective: 'no' })
    expect(html).not.toContain('Most likely to be feasible')
    expect(html).toContain('Ruled out, and why')
    expect(html).toContain('Individual RCT')
  })

  it('recommends nothing at all when a readiness gate has fired', () => {
    const html = render({ intervention_defined: 'no' })
    expect(html).toContain('Not ready for impact evaluation')
    expect(html).toContain('No design is recommended')
    expect(html).not.toContain('Most likely to be feasible')
  })

  it('names the design and its rung when one is feasible', () => {
    const html = render({
      ...READY, prospective: 'no', comparison_group: 'yes', pre_periods: 'many',
      parallel_trends_evidence: 'supported', staggered_rollout: 'no', cointerventions: 'none_known',
    })
    expect(html).toContain('Most likely to be feasible')
    expect(html).toContain('Difference-in-differences')
    expect(html).toContain('Tier 3')
  })
})

describe('it tells the reader where to put the effort', () => {
  it('lists the outstanding questions and the rung each could unlock', () => {
    const html = render({ ...READY, prospective: 'no' })
    expect(html).toContain('What to establish next')
    expect(html).toContain('Could unlock')
  })

  it('reports blockers with the reason, not just the verdict', () => {
    const html = render({ ...READY, prospective: 'no' })
    expect(html).toContain('Allocation cannot be randomised once the intervention has already been delivered.')
  })

  it('gives the discharge text for a condition', () => {
    const html = render({
      ...READY, prospective: 'no', comparison_group: 'yes', pre_periods: 'many',
      parallel_trends_evidence: 'untested',
    })
    expect(html).toContain('To discharge:')
  })
})

describe('it is readable by someone who has never opened the tool', () => {
  // A stakeholder cannot act on `density_near_cutoff`.
  it('never prints an internal question id', () => {
    const html = render({ ...READY, prospective: 'no', assignment_threshold: 'yes' })
    const ids = spec.questions.map(q => q.id)
    const leaked = ids.filter(id => html.includes(`>${id}<`) || html.includes(`<li>${id}</li>`))
    expect(leaked).toEqual([])
  })

  it('shows answers by their labels, not their stored values', () => {
    const html = render({ ...READY, prospective: 'no' })
    expect(html).toContain('Is the intervention clearly defined and documented?')
    expect(html).toContain('Yes — specified and documented')
  })

  it('states that nothing is scored', () => {
    expect(render(READY)).toContain('Nothing in this report is')
  })
})

describe('it escapes what it renders', () => {
  it('does not emit an unanswered question id as markup', () => {
    const answers = { ...READY, '<img src=x onerror=alert(1)>': 'yes' }
    const html = buildReport({ result: evaluate(answers, spec), answers, spec, date: 'x' })
    expect(html).not.toContain('<img src=x')
  })

  it('escapes a spec value that contains markup', () => {
    const tampered = {
      ...spec,
      questions: spec.questions.map(q => q.id === 'prospective'
        ? { ...q, text: '<script>bad()</script>' } : q),
    }
    const answers = { ...READY, prospective: 'no' }
    const html = buildReport({ result: evaluate(answers, tampered), answers, spec: tampered, date: 'x' })
    expect(html).not.toContain('<script>bad()</script>')
    expect(html).toContain('&lt;script&gt;')
  })
})
