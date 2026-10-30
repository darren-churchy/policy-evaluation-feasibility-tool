// The id mapping.
//
// The previous tool used four vocabularies for overlapping facts. spec/migration.yaml
// records what becomes of each id; these tests make that record total and honest.
//
// The totality check cannot live in the validator, because the validator reads spec/ and
// the old vocabulary lives in src/. So it is asserted here, by scanning the components
// still being migrated. As each is retired its ids leave the scan, and the check narrows
// to what remains — which is the correct behaviour, not a loophole.

import { describe, it, expect, beforeAll } from 'vitest'
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { parse } from 'yaml'
import { loadSpec } from '../scripts/lib/loadSpec.mjs'

const ROOT = new URL('..', import.meta.url).pathname

/** Every source file still carrying the old vocabulary. */
function legacySources() {
  const roots = ['src/components/pages', 'src/scoring', 'src/data', 'src/hooks']
  const files = []
  const walk = dir => {
    let entries
    try { entries = readdirSync(join(ROOT, dir)) } catch { return }
    for (const entry of entries) {
      const rel = `${dir}/${entry}`
      if (statSync(join(ROOT, rel)).isDirectory()) walk(rel)
      else if (/\.jsx?$/.test(entry)) files.push(rel)
    }
  }
  roots.forEach(walk)
  return files
}

const OLD_ID = /\b(?:p[0-9]|tte|screen|q)_[a-z0-9_]+/g

let spec, migration, dispositions
beforeAll(() => {
  spec = loadSpec()
  migration = parse(readFileSync(join(ROOT, 'spec', 'migration.yaml'), 'utf8'))
  dispositions = new Map()
  const add = (list, name) => (list ?? []).forEach(m => dispositions.set(m.from, name))
  add(migration.renamed, 'renamed')
  add(migration.split, 'split')
  add(migration.to_notes, 'to_notes')
  add(migration.dropped, 'dropped')
})

describe('the mapping is total', () => {
  // The failure this prevents: an id that nobody remembers, which simply stops being
  // asked when its component is deleted.
  it('accounts for every old id still in the source', () => {
    const found = new Set()
    for (const file of legacySources()) {
      const source = readFileSync(join(ROOT, file), 'utf8')
      for (const id of source.match(OLD_ID) ?? []) {
        // `tte_components` is the name of the exported array, not a stored field.
        if (id !== 'tte_components') found.add(id)
      }
    }
    const unaccounted = [...found].filter(id => !dispositions.has(id)).sort()
    expect(unaccounted, 'these have no disposition in spec/migration.yaml').toEqual([])
  })

  it('gives each id exactly one disposition', () => {
    const all = [
      ...(migration.renamed ?? []), ...(migration.split ?? []),
      ...(migration.to_notes ?? []), ...(migration.dropped ?? []),
    ].map(m => m.from)
    expect(new Set(all).size).toBe(all.length)
  })

  it('maps nothing that was never in the old vocabulary', () => {
    for (const id of dispositions.keys()) {
      expect(id, `${id} is not an old-vocabulary id`).toMatch(/^(?:p[0-9]|tte|screen|q)_/)
    }
  })
})

describe('the decisions it records', () => {
  // The compensatory multiplier the ladder replaced. Dropping these three is the decision
  // the whole mapping turns on, so it is pinned.
  it('drops the three assumption scores and their rationales', () => {
    for (const id of [
      'p3_exchangeability', 'p3_positivity', 'p3_consistency',
      'p3_exchangeability_rationale', 'p3_positivity_rationale', 'p3_consistency_rationale',
    ]) {
      expect(dispositions.get(id), `${id} must be dropped`).toBe('dropped')
    }
  })

  it('says why each drop happened, at length', () => {
    for (const entry of migration.dropped) {
      expect(entry.reason.length, `${entry.from} needs a real reason`).toBeGreaterThan(40)
    }
  })

  // N lives in the ready-reckoner's local state. Migrating it into the answer store would
  // reopen the path by which an illustrative figure could reach a verdict.
  it('keeps the numeric sample size out of the answer store', () => {
    expect(dispositions.get('p7_n')).toBe('dropped')
    expect(spec.questions.find(q => q.id === 'p7_n')).toBeUndefined()
  })

  // A screen asserted two or three things behind one yes/no, so its value cannot be
  // carried without inventing answers.
  it('splits every design screen rather than renaming it', () => {
    const screens = [...dispositions.entries()].filter(([id]) => id.startsWith('screen_'))
    expect(screens.length).toBe(6)
    for (const [id, disposition] of screens) {
      expect(disposition, `${id} must be split`).toBe('split')
    }
  })

  it('carries no value across a split', () => {
    for (const entry of migration.split) {
      expect(entry).not.toHaveProperty('values')
      expect(entry.into.length).toBeGreaterThan(1)
    }
  })

  it('records both names of every colliding question', () => {
    const byTarget = new Map()
    for (const m of migration.renamed) {
      if (!byTarget.has(m.to)) byTarget.set(m.to, [])
      byTarget.get(m.to).push(m.from)
    }
    for (const collision of migration.collisions ?? []) {
      expect(byTarget.get(collision.target)?.sort()).toEqual([...collision.from].sort())
    }
    // The four the redesign exists to fix.
    const targets = (migration.collisions ?? []).map(c => c.target)
    for (const t of ['intervention_defined', 'theory_of_change', 'maturity', 'prospective']) {
      expect(targets, `${t} was asked under two names`).toContain(t)
    }
  })
})

describe('a prospective evaluation that is only partly possible', () => {
  it('offers the middle answer rather than forcing a binary', () => {
    const q = spec.questions.find(x => x.id === 'prospective')
    expect(q.options.map(o => o.value)).toEqual(['yes', 'maybe', 'no'])
  })

  // It must not pass silently: part of the rollout being open is a real opportunity, and
  // a real narrowing of the estimand.
  it('leaves the randomised designs conditional, not feasible and not blocked', async () => {
    const { evaluate } = await import('../src/engine/evaluate.js')
    const base = {
      intervention_defined: 'yes', theory_of_change: 'yes', maturity: 'yes',
      record_linkage: 'individual', randomisation_barriers: 'none',
      allocation_unit: 'individual', equipoise: 'yes',
    }
    expect(evaluate({ ...base, prospective: 'yes' }, spec).designs.rct_individual.state).toBe('feasible')
    expect(evaluate({ ...base, prospective: 'no' }, spec).designs.rct_individual.state).toBe('blocked')

    const partly = evaluate({ ...base, prospective: 'maybe' }, spec).designs.rct_individual
    expect(partly.state).toBe('conditional')
    expect(partly.conditions.find(c => c.id === 'partly_prospective').unlock)
      .toMatch(/estimand narrows/)
  })

  it('applies to every design that a non-prospective answer blocks', () => {
    const blocked = Object.entries(spec.rules.designs)
      .filter(([, r]) => (r.blockers ?? []).some(b => JSON.stringify(b.test).includes('prospective')))
      .map(([id]) => id)
    for (const id of blocked) {
      const conditions = spec.rules.designs[id].conditions ?? []
      expect(conditions.some(c => c.id === 'partly_prospective'), `${id} needs the partial case`).toBe(true)
    }
  })
})
