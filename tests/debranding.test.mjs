import { describe, it, expect, beforeAll } from 'vitest'
import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { parse } from 'yaml'
import { loadSpec } from '../scripts/lib/loadSpec.mjs'
import { evaluate } from '../src/engine/evaluate.js'

const ROOT = new URL('..', import.meta.url).pathname

/** Every source and doc file that ships, excluding generated output. */
function shippedFiles() {
  const files = []
  const walk = dir => {
    for (const entry of readdirSync(join(ROOT, dir), { withFileTypes: true })) {
      const rel = join(dir, entry.name)
      if (entry.isDirectory()) {
        if (['node_modules', 'dist', '.git'].includes(entry.name)) continue
        walk(rel)
      } else if (/\.(jsx?|mjs|css|html)$/.test(entry.name) && entry.name !== 'spec.generated.json') {
        files.push(rel)
      }
    }
  }
  walk('src')
  files.push('index.html')
  return files
}

describe('institutional identity is removed', () => {
  // The tool keeps GOV.UK and MoJ Frontend as CSS dependencies — naming a library is not
  // the same as claiming to be the institution. What goes is anything presenting the tool
  // as a government service.
  const INSTITUTIONAL = [
    /Ministry of Justice/i,
    /Government Social Research/i,
    /government social researchers/i,
  ]

  it.each(INSTITUTIONAL.map(p => [p.source, p]))('no "%s" anywhere in src or index.html', (_label, pattern) => {
    const offenders = shippedFiles().filter(f => pattern.test(readFileSync(join(ROOT, f), 'utf8')))
    expect(offenders).toEqual([])
  })

  it('keeps GOV.UK Frontend as a named dependency', () => {
    // Dependency naming is not institutional identity. Removing it would obscure what the
    // CSS actually is while the classes remain.
    const components = readFileSync(join(ROOT, 'src/components/ui/GovukComponents.jsx'), 'utf8')
    expect(components).toMatch(/GOV\.UK/)
    expect(components).toMatch(/govuk-\*/)
  })
})

describe('justice-specific wording is removed from the neutral core', () => {
  const JUSTICE = [/reoffend/i, /\bprobation\b/i, /\bcustody\b/i, /\bprisons?\b/i, /England and Wales/i]

  it.each(JUSTICE.map(p => [p.source, p]))('no "%s" in shipped source', (_label, pattern) => {
    const offenders = shippedFiles().filter(f => pattern.test(readFileSync(join(ROOT, f), 'utf8')))
    expect(offenders, 'sector examples belong in a context pack, not the core').toEqual([])
  })
})

describe('context packs', () => {
  let packs
  beforeAll(() => {
    const dir = join(ROOT, 'spec', 'packs')
    packs = readdirSync(dir)
      .filter(f => f.endsWith('.yaml'))
      .map(f => parse(readFileSync(join(dir, f), 'utf8')))
  })

  it('ships a generic default and a criminal justice pack', () => {
    const ids = packs.map(p => p.id).sort()
    expect(ids).toEqual(['criminal-justice', 'generic'])
  })

  it('marks exactly one pack as the default', () => {
    expect(packs.filter(p => p.default === true).map(p => p.id)).toEqual(['generic'])
  })

  it('gives every pack vocabulary and examples', () => {
    for (const pack of packs) {
      expect(pack.vocabulary, `${pack.id} needs vocabulary`).toBeTruthy()
      expect(Object.keys(pack.examples ?? {}).length, `${pack.id} needs examples`).toBeGreaterThan(0)
    }
  })

  it('keys examples to questions that exist', () => {
    const ids = new Set(loadSpec().questions.map(q => q.id))
    for (const pack of packs) {
      for (const key of Object.keys(pack.examples ?? {})) {
        expect(ids.has(key), `${pack.id} has examples for "${key}", which is not a question`).toBe(true)
      }
    }
  })

  // The guarantee that makes packs safe: they change what the user sees, never what the
  // tool concludes.
  it('cannot change a verdict — the engine does not read them', () => {
    const spec = loadSpec()
    const answers = {
      claim_type: 'causal', intervention_defined: 'yes', theory_of_change: 'yes',
      maturity: 'yes', prospective: 'no', pre_periods: 'many', comparison_group: 'yes',
      parallel_trends_evidence: 'untested', staggered_rollout: 'no',
    }
    const before = evaluate(answers, spec)
    const withPack = evaluate(answers, { ...spec, packs, activePack: 'criminal-justice' })
    expect(JSON.stringify(withPack)).toBe(JSON.stringify(before))
  })

  it('is not referenced anywhere in the engine source', () => {
    for (const file of ['evaluate.js', 'logic.js', 'stage.js']) {
      const source = readFileSync(join(ROOT, 'src', 'engine', file), 'utf8')
      const code = source.replace(/\/\/.*$/gm, '').replace(/\/\*[\s\S]*?\*\//g, '')
      expect(code, `${file} must not read context packs`).not.toMatch(/\bpacks?\b/)
    }
  })
})
