import { describe, it, expect, beforeAll } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { parse } from 'yaml'

const ROOT = new URL('..', import.meta.url).pathname
const read = f => readFileSync(join(ROOT, 'spec', f), 'utf8')

function varsIn(node, found = new Set()) {
  if (Array.isArray(node)) { node.forEach(n => varsIn(n, found)); return found }
  if (!node || typeof node !== 'object') return found
  for (const [k, v] of Object.entries(node)) {
    if (k === 'var') found.add(Array.isArray(v) ? v[0] : v)
    else varsIn(v, found)
  }
  return found
}

let stages, questions, qById, stageIds

beforeAll(() => {
  stages = parse(read('stages.yaml'))
  questions = parse(read('questions.yaml')).questions
  qById = new Map(questions.map(q => [q.id, q]))
  stageIds = new Set(stages.stages.map(s => s.id))
})

describe('stages.yaml — vocabulary', () => {
  it('defines the four Test and Learn stages', () => {
    expect(stages.stages.map(s => s.id)).toEqual(['explore', 'co_design', 'test', 'grow'])
  })

  it('gives every stage a gloss, so the label does not assume prior familiarity', () => {
    // Part of keeping named guidance usable outside the context that produced it: the
    // labels stay as published references, but each is explained on first use.
    for (const s of stages.stages) {
      expect(s.gloss, `${s.id} needs a gloss`).toBeTruthy()
      expect(s.gloss.length).toBeGreaterThan(20)
    }
  })

  it('cites the source for each stage label rather than asserting the vocabulary', () => {
    for (const s of stages.stages) expect(s.citations).toContain('magenta_book')
  })
})

describe('stages.yaml — readiness gates', () => {
  it('treats intervention specification and theory of change as hard gates', () => {
    const gates = stages.readiness.filter(r => r.severity === 'gate').map(r => r.question)
    expect(gates.sort()).toEqual(['intervention_defined', 'theory_of_change'])
  })

  it('treats maturity as a warning, not a gate', () => {
    // A partly-scaled intervention can still support a Test-stage evaluation of a settled
    // component, so maturity redirects rather than blocks.
    const maturity = stages.readiness.find(r => r.question === 'maturity')
    expect(maturity.severity).toBe('warning')
  })

  it('tells the user what is missing and what to do instead', () => {
    for (const r of stages.readiness) {
      expect(r.message, `${r.id} needs a message`).toBeTruthy()
      expect(r.redirect, `${r.id} needs a redirect — a gate without an alternative is a dead end`).toBeTruthy()
    }
  })

  it('reads only questions that exist, comparing against options they offer', () => {
    for (const r of stages.readiness) {
      const q = qById.get(r.question)
      expect(q, `${r.id} reads unknown question ${r.question}`).toBeDefined()
      for (const v of varsIn(r.fires_when)) expect(qById.has(v)).toBe(true)
    }
  })
})

describe('stages.yaml — stage inference', () => {
  it('reads only questions that exist', () => {
    for (const rule of stages.inference) {
      for (const v of varsIn(rule.when)) expect(qById.has(v), `unknown question ${v}`).toBe(true)
    }
  })

  it('concludes only stages that are defined', () => {
    for (const rule of stages.inference) {
      for (const s of rule.stages) expect(stageIds.has(s), `undefined stage ${s}`).toBe(true)
    }
  })

  it('explains and cites every conclusion', () => {
    for (const [i, rule] of stages.inference.entries()) {
      expect(rule.note, `inference[${i}] needs a note`).toBeTruthy()
      expect(rule.citations?.length, `inference[${i}] needs a citation`).toBeGreaterThan(0)
    }
  })

  it('checks the two gates before maturity', () => {
    // A missing specification or theory of change is the more fundamental problem, so it
    // must win over the maturity rule regardless of how maturity was answered.
    const order = stages.inference.map(r => [...varsIn(r.when)].join(','))
    const firstMaturityOnly = order.findIndex(v => v === 'maturity')
    const gateIndexes = order
      .map((v, i) => (v === 'intervention_defined' || v === 'theory_of_change' ? i : -1))
      .filter(i => i >= 0)
    expect(gateIndexes.length).toBe(2)
    for (const gi of gateIndexes) expect(gi).toBeLessThan(firstMaturityOnly)
  })

  it('routes a failed gate to Co-design and an immature intervention to Explore', () => {
    const find = qid => stages.inference.find(r => [...varsIn(r.when)].join(',') === qid)
    expect(find('intervention_defined').stages).toEqual(['co_design'])
    expect(find('theory_of_change').stages).toEqual(['co_design'])
    expect(find('maturity').stages).toEqual(['explore'])
  })
})

// The review found stage logic implemented in three places that disagreed: the
// quantitative tree tagged RCT, DiD, RD, ITS and IV as Grow-stage only, while the Design
// Finder and the Causal Readiness page said impact evaluation suits Test and Grow. These
// assertions pin the resolution so it cannot drift back.
describe('stages.yaml — the Grow-only contradiction stays resolved', () => {
  it('never concludes Grow without also concluding Test', () => {
    const growOnly = stages.inference.filter(r => r.stages.includes('grow') && !r.stages.includes('test'))
    expect(
      growOnly,
      'no state of the world makes Grow available while Test is not — the identification requirements are identical',
    ).toEqual([])
  })

  it('reaches Test and Grow together when all three readiness answers are yes', () => {
    const rule = stages.inference.find(r => r.stages.includes('grow'))
    expect(rule.stages).toEqual(['test', 'grow'])
    expect(varsIn(rule.when)).toEqual(new Set(['intervention_defined', 'theory_of_change', 'maturity']))
  })

  it('records that what differs between Test and Grow is the estimand, not design availability', () => {
    const rule = stages.inference.find(r => r.stages.includes('grow'))
    expect(rule.note).toMatch(/[Ii]dentification requirements are identical/)
  })

  it('narrows the claim rather than the design set when something is partial', () => {
    const partial = stages.inference.find(r => r.stages.length === 1 && r.stages[0] === 'test')
    expect(partial.note).toMatch(/component or mechanism/)
    expect(partial.note, 'a partial answer must not remove designs from consideration')
      .toMatch(/design remains available|designs remain available/)
  })
})

describe('stages.yaml — tool routing', () => {
  it('routes every claim type somewhere', () => {
    const claimRoutes = stages.routing.filter(r => varsIn(r.when ?? {}).has('claim_type'))
    const covered = new Set()
    for (const r of claimRoutes) {
      const walk = n => {
        if (Array.isArray(n)) return n.forEach(walk)
        if (!n || typeof n !== 'object') return
        for (const [op, args] of Object.entries(n)) {
          if (op === '==' && Array.isArray(args) && typeof args[1] === 'string') covered.add(args[1])
          else walk(args)
        }
      }
      walk(r.when)
    }
    const claimValues = qById.get('claim_type').options.map(o => o.value)
    for (const v of claimValues) {
      expect(covered.has(v), `claim type "${v}" has no route`).toBe(true)
    }
  })

  it('sends causal questions to the ladder and the others away from it', () => {
    const to = value => stages.routing.find(
      r => r.when && JSON.stringify(r.when).includes(`"${value}"`),
    )?.to
    expect(to('causal')).toBe('design_finder')
    expect(to('describe')).toBe('qual_tree')
    expect(to('predict')).toBe('quant_tree')
  })

  it('sends a fired readiness gate to the theory-based strand, not to a counterfactual design', () => {
    const route = stages.routing.find(r => r.from === 'readiness_gate')
    expect(route, 'a fired gate needs somewhere to go').toBeDefined()
    expect(route.to).toBe('qual_tree')
  })

  it('states a reason for every route', () => {
    for (const r of stages.routing) {
      expect(r.note, `route ${r.from} -> ${r.to} needs a note`).toBeTruthy()
    }
  })

  it('reads only questions that exist', () => {
    for (const r of stages.routing) {
      for (const v of varsIn(r.when)) expect(qById.has(v), `unknown question ${v}`).toBe(true)
    }
  })
})
