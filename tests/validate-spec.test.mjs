import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { mkdtempSync, writeFileSync, rmSync, mkdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { parse } from 'yaml'
import { validateSpec } from '../scripts/validate-spec.mjs'

const ROOT = new URL('..', import.meta.url).pathname
const SCHEMA_DIR = join(ROOT, 'spec', 'schema')

/** Build a throwaway spec directory containing the given files. */
function fixture(files) {
  const dir = mkdtempSync(join(tmpdir(), 'spec-'))
  for (const [name, body] of Object.entries(files)) {
    const path = join(dir, name)
    mkdirSync(join(path, '..'), { recursive: true })
    writeFileSync(path, body)
  }
  return dir
}

const MINIMAL_BIB = '@misc{src_a, title = {A}}\n@misc{src_b, title = {B}}\n'

/** A schema-valid tiers.yaml, used as the base for mutation in failure tests. */
function validTiers({ citation = 'src_a' } = {}) {
  const tier = (id, name) => `  - id: ${id}
    name: ${name}
    identifying_assumption: Something must hold for this comparison to be valid.
    evidence_scales:
      maryland: "3"
    citations: [${citation}]`
  return `spec_version: 1.0.0
tiers:
${[1, 2, 3, 4, 5].map(i => tier(i, `Tier ${i}`)).join('\n')}
theory_based:
  name: Theory-based evaluation
  roles:
    - id: primary
      when: Every counterfactual tier is blocked.
    - id: complementary
      when: A counterfactual tier is available.
  citations: [src_b]
`
}

describe('validateSpec — the real specification', () => {
  it('validates cleanly', () => {
    const { errors, checked } = validateSpec()
    expect(errors).toEqual([])
    expect(checked).toContain('tiers.yaml')
  })
})

describe('validateSpec — catches schema breaches', () => {
  let dir
  afterAll(() => dir && rmSync(dir, { recursive: true, force: true }))

  it('reports a missing required property at the line of the offending tier', () => {
    // Strip identifying_assumption from the third tier only.
    const lines = validTiers().split('\n')
    const idx = lines.findIndex((l, i) => l.includes('name: Tier 3') && i > 0)
    const removeAt = idx + 1 // the identifying_assumption line directly beneath
    expect(lines[removeAt]).toContain('identifying_assumption')
    lines.splice(removeAt, 1)

    dir = fixture({ 'tiers.yaml': lines.join('\n'), 'references.bib': MINIMAL_BIB })
    const { errors } = validateSpec({ specDir: dir, schemaDir: SCHEMA_DIR })

    expect(errors.length).toBeGreaterThan(0)
    const err = errors.find(e => e.message.includes('identifying_assumption'))
    expect(err, 'expected an error naming the missing property').toBeDefined()
    expect(err.file).toBe('tiers.yaml')
    // The reported line should land inside tier 3's block, not default to 1.
    expect(err.line).toBeGreaterThan(1)
    const reported = lines[err.line - 1]
    expect(reported, `line ${err.line} should be within the tier 3 block`).toMatch(/Tier 3|id: 3|citations|maryland|evidence_scales|- id/)
  })

  it('rejects a ladder with fewer than five tiers', () => {
    const fourTiers = validTiers().replace(/ {2}- id: 5\n(?: {4}.*\n)*/, '')
    const d = fixture({ 'tiers.yaml': fourTiers, 'references.bib': MINIMAL_BIB })
    const { errors } = validateSpec({ specDir: d, schemaDir: SCHEMA_DIR })
    expect(errors.some(e => /fewer than 5 items|minItems/.test(e.message))).toBe(true)
    rmSync(d, { recursive: true, force: true })
  })

  it('reports a YAML syntax error rather than throwing', () => {
    const d = fixture({ 'tiers.yaml': 'spec_version: 1.0.0\ntiers:\n  - id: 1\n   bad indent: [\n', 'references.bib': MINIMAL_BIB })
    const { errors } = validateSpec({ specDir: d, schemaDir: SCHEMA_DIR })
    expect(errors.length).toBeGreaterThan(0)
    expect(errors[0].file).toBe('tiers.yaml')
    rmSync(d, { recursive: true, force: true })
  })
})

describe('validateSpec — citation integrity', () => {
  it('fails when a cited key is absent from references.bib', () => {
    const d = fixture({
      'tiers.yaml': validTiers({ citation: 'nonexistent_key' }),
      'references.bib': MINIMAL_BIB,
    })
    const { errors } = validateSpec({ specDir: d, schemaDir: SCHEMA_DIR })
    const err = errors.find(e => e.message.includes('nonexistent_key'))
    expect(err, 'a dangling citation must be an error — every rule must be traceable').toBeDefined()
    expect(err.message).toMatch(/not defined in references\.bib/)
    rmSync(d, { recursive: true, force: true })
  })

  it('fails when references.bib is missing entirely', () => {
    const d = fixture({ 'tiers.yaml': validTiers() })
    const { errors } = validateSpec({ specDir: d, schemaDir: SCHEMA_DIR })
    expect(errors.some(e => e.file === 'references.bib')).toBe(true)
    rmSync(d, { recursive: true, force: true })
  })

  it('passes when every cited key resolves', () => {
    const d = fixture({ 'tiers.yaml': validTiers(), 'references.bib': MINIMAL_BIB })
    const { errors } = validateSpec({ specDir: d, schemaDir: SCHEMA_DIR })
    expect(errors).toEqual([])
    rmSync(d, { recursive: true, force: true })
  })

  // Regression: citation errors used to report line 1 unconditionally, which defeated
  // the point of line-accurate reporting.
  it('reports the line where the dangling citation actually appears', () => {
    const d = fixture({
      'tiers.yaml': validTiers({ citation: 'nonexistent_key' }),
      'references.bib': MINIMAL_BIB,
    })
    const { errors } = validateSpec({ specDir: d, schemaDir: SCHEMA_DIR })
    const err = errors.find(e => e.message.includes('nonexistent_key'))
    expect(err.line).toBeGreaterThan(1)
    rmSync(d, { recursive: true, force: true })
  })
})

// Regression: a file that failed to PARSE was not added to `checked`, so the CLI's
// "nothing to validate" branch ran first and exited 0 — CI would go green on a spec
// that could not even be read.
describe('validateSpec — unparseable files are not silently skipped', () => {
  it('counts a file with parse errors as checked, so the CLI cannot report success', () => {
    const d = fixture({
      'tiers.yaml': 'spec_version: 1.0.0\ntiers:\n  - id: 1\n   bad indent: [\n',
      'references.bib': MINIMAL_BIB,
    })
    const { errors, checked } = validateSpec({ specDir: d, schemaDir: SCHEMA_DIR })
    expect(errors.length).toBeGreaterThan(0)
    expect(checked, 'an unparseable file must still count as checked').toContain('tiers.yaml')
    rmSync(d, { recursive: true, force: true })
  })
})

// These guard methodological decisions that were explicitly signed off. Changing any of
// them should require deliberately changing a test, not just editing a YAML file.
describe('tiers.yaml — signed-off decisions', () => {
  let tiers
  beforeAll(() => {
    tiers = parse(readFileSync(join(ROOT, 'spec', 'tiers.yaml'), 'utf8'))
  })

  it('has exactly five counterfactual tiers, ordered 1 to 5', () => {
    expect(tiers.tiers.map(t => t.id)).toEqual([1, 2, 3, 4, 5])
  })

  it('ranks tier 1 on random allocation and tier 5 on trend continuation', () => {
    expect(tiers.tiers[0].identifying_assumption).toMatch(/[Rr]andom allocation/)
    expect(tiers.tiers[4].identifying_assumption).toMatch(/trend would have continued/)
  })

  it('keeps the theory-based strand off the ladder, with both roles defined', () => {
    expect(tiers.tiers.map(t => t.name)).not.toContain('Theory-based evaluation')
    expect(tiers.theory_based.roles.map(r => r.id).sort()).toEqual(['complementary', 'primary'])
  })

  it.each([
    ['Regression discontinuity in time (RDIT)', 3],
    ['Controlled interrupted time series', 3],
    ['Matching and weighting with prior-outcome controls', 4],
  ])('places %s at tier %i, signed off, with both views recorded', (subject, tier) => {
    const p = tiers.contested_placements.find(c => c.subject === subject)
    expect(p, `missing contested placement: ${subject}`).toBeDefined()
    expect(p.default_tier).toBe(tier)
    expect(p.signed_off).toBe(true)
    expect(p.views.length).toBeGreaterThanOrEqual(2)
  })

  it('declares a semver spec_version', () => {
    expect(tiers.spec_version).toMatch(/^\d+\.\d+\.\d+$/)
  })
})
