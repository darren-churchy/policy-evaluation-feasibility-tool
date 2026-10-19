import { describe, it, expect, beforeAll } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describeExpression, questionsRead, describeThreshold } from '../scripts/lib/describe.mjs'
import { buildPack } from '../scripts/build-reviewer-pack.mjs'
import { parseCsvRecords, toCsv } from '../scripts/lib/csv.mjs'
import { loadSpec } from '../scripts/lib/loadSpec.mjs'

const ROOT = new URL('..', import.meta.url).pathname

const QUESTIONS = new Map([
  ['pre_periods', { id: 'pre_periods', options: [
    { value: 'many', label: 'Several periods' },
    { value: 'none', label: 'None' },
    { value: 'one', label: 'One period only' },
  ] }],
  ['overlap', { id: 'overlap', options: [
    { value: 'good', label: 'Good — the groups overlap substantially' },
    { value: 'poor', label: 'Poor — the groups barely overlap' },
  ] }],
])

describe('describeExpression — JSON Logic as English', () => {
  it('renders equality using the option label, not the internal value', () => {
    // A reviewer judges the rule from this sentence, so "none" is not good enough.
    const text = describeExpression({ '==': [{ var: 'pre_periods' }, 'none'] }, QUESTIONS)
    expect(text).toBe('pre_periods is “None”')
  })

  it('renders inequality', () => {
    expect(describeExpression({ '!=': [{ var: 'overlap' }, 'poor'] }, QUESTIONS))
      .toBe('overlap is not “Poor — the groups barely overlap”')
  })

  it('renders membership as a list', () => {
    expect(describeExpression({ in: [{ var: 'pre_periods' }, ['none', 'one']] }, QUESTIONS))
      .toBe('pre_periods is one of “None” or “One period only”')
  })

  it('renders a single-item membership without the list wording', () => {
    expect(describeExpression({ in: [{ var: 'pre_periods' }, ['none']] }, QUESTIONS))
      .toBe('pre_periods is “None”')
  })

  it('renders and / or with bracketing that makes precedence visible', () => {
    const expr = {
      or: [
        { '==': [{ var: 'pre_periods' }, 'none'] },
        { and: [{ '==': [{ var: 'overlap' }, 'poor'] }, { '==': [{ var: 'pre_periods' }, 'one'] }] },
      ],
    }
    const text = describeExpression(expr, QUESTIONS)
    expect(text).toContain(' or ')
    expect(text).toContain(' and ')
    expect(text).toMatch(/\(.*and.*\)/)
  })

  it('falls back to the raw value when a question has no matching option', () => {
    expect(describeExpression({ '==': [{ var: 'unknown_q' }, 'x'] }, QUESTIONS))
      .toBe('unknown_q is “x”')
  })

  it('shows the raw expression for an operator it cannot render, rather than lying', () => {
    expect(describeExpression({ '>': [{ var: 'n' }, 5] }, QUESTIONS)).toContain('">"')
  })

  it('lists the questions an expression reads, in order', () => {
    expect(questionsRead({ or: [
      { '==': [{ var: 'b' }, 1] },
      { '==': [{ var: 'a' }, 2] },
      { '==': [{ var: 'b' }, 3] },
    ] })).toEqual(['b', 'a'])
  })

  it('renders a threshold with its range and what it rests on', () => {
    const text = describeThreshold({ value: 10, range: [10, 104], units: 'first-stage F', basis: 'convention', contested: true })
    expect(text).toContain('10 first-stage F')
    expect(text).toContain('range 10–104')
    expect(text).toContain('convention')
    expect(text).toContain('contested')
  })
})

describe('the reviewer pack', () => {
  let pack, spec, ruleRows

  beforeAll(() => {
    pack = buildPack()
    spec = loadSpec()
    ruleRows = parseCsvRecords(pack['rules.csv']).records
  })

  it('writes the six expected files', () => {
    expect(Object.keys(pack).sort()).toEqual(
      ['REVIEWER_PACK.md', 'designs.csv', 'questions.csv', 'rules.csv', 'statistics.csv', 'tiers.csv'],
    )
  })

  it('renders the statistics module for review', () => {
    const md = pack['REVIEWER_PACK.md']
    expect(md).toContain('## The statistics module')
    expect(md).toMatch(/Equal depth is asserted by test/)
    expect(md, 'the reviewer must see that the engine cannot read the ready-reckoner')
      .toMatch(/engine_reads: false/)
    // Every tension should be reviewable, with its prompt.
    const tensions = parseCsvRecords(pack['statistics.csv']).records
    expect(tensions.length).toBe(
      spec.statistics.approaches.nhst.tensions.length +
      spec.statistics.approaches.bayesian.tensions.length,
    )
    for (const t of tensions) {
      expect(t.raised_when, `${t.tension_id} unrendered`).toBeTruthy()
      expect(t.prompt, `${t.tension_id} has no prompt`).toBeTruthy()
      expect(t.citations, `${t.tension_id} has no source`).toBeTruthy()
    }
  })

  it('is reproducible — generating twice gives identical output', () => {
    // The drift check compares against the committed copy, so any nondeterminism
    // (a timestamp, an unstable sort) would fail CI on every run.
    const again = buildPack()
    for (const name of Object.keys(pack)) expect(again[name]).toBe(pack[name])
  })

  it('contains no generation timestamp', () => {
    expect(pack['REVIEWER_PACK.md']).not.toMatch(/\b20\d\d-\d\d-\d\dT/)
  })

  it('includes every check from rules.yaml, omitting none', () => {
    let expected = 0
    for (const groups of Object.values(spec.rules.designs)) {
      for (const checks of Object.values(groups)) expected += checks.length
    }
    expect(ruleRows.length).toBe(expected)
  })

  it('covers every design', () => {
    const inPack = new Set(ruleRows.map(r => r.design_id))
    for (const d of spec.designs) expect(inPack.has(d.id), `${d.id} missing from pack`).toBe(true)
  })

  it('renders every condition in English, leaving no raw JSON Logic', () => {
    for (const row of ruleRows) {
      expect(row.fires_when, `${row.check_id} is unrendered`).toBeTruthy()
      expect(row.fires_when, `${row.check_id} leaked raw JSON Logic`).not.toMatch(/\{"var"/)
    }
  })

  it('carries the sources for every check', () => {
    for (const row of ruleRows) {
      expect(row.citations, `${row.design_id}.${row.check_id} has no source`).toBeTruthy()
    }
  })

  it('gives every condition its discharge text', () => {
    for (const row of ruleRows.filter(r => r.type === 'Condition')) {
      expect(row.unlock, `${row.design_id}.${row.check_id} has no unlock`).toBeTruthy()
    }
  })

  it('round-trips through the CSV reader', () => {
    const columns = Object.keys(ruleRows[0])
    const rewritten = toCsv(ruleRows, columns)
    expect(parseCsvRecords(rewritten).records.length).toBe(ruleRows.length)
  })

  it('states the specification version', () => {
    expect(pack['REVIEWER_PACK.md']).toContain(`Specification version ${spec.tiers.spec_version}`)
  })

  it('tells the reviewer what they are being asked, and how verdicts work', () => {
    const md = pack['REVIEWER_PACK.md']
    expect(md).toMatch(/takes its worst state/i)
    expect(md).toMatch(/[Nn]othing is scored/)
    expect(md).toMatch(/leaves a design Unknown/i)
  })

  it('shows both views on every contested placement', () => {
    const md = pack['REVIEWER_PACK.md']
    for (const c of spec.tiers.contested_placements) {
      expect(md).toContain(c.subject)
      for (const v of c.views) expect(md).toContain(`Tier ${v.tier}`)
    }
  })

  it('lists every reference with its confidence note', () => {
    const md = pack['REVIEWER_PACK.md']
    const bib = readFileSync(join(ROOT, 'spec', 'references.bib'), 'utf8')
    const keys = [...bib.matchAll(/^\s*@\w+\s*\{\s*([^,\s]+)\s*,/gm)].map(m => m[1])
    expect(keys.length).toBeGreaterThan(0)
    for (const key of keys) expect(md, `${key} missing from pack`).toContain(`\`${key}\``)
  })

  it('matches what is committed', () => {
    // If this fails, the spec changed without regenerating: run `npm run pack`.
    for (const [name, content] of Object.entries(pack)) {
      const committed = readFileSync(join(ROOT, 'reviewer-pack', name), 'utf8')
      expect(committed, `${name} is out of date — run npm run pack`).toBe(content)
    }
  })
})
