import { describe, it, expect, beforeAll } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { parseCsv, parseCsvRecords } from '../scripts/lib/csv.mjs'

const ROOT = new URL('..', import.meta.url).pathname
const PIPE = { pipeSeparated: ['estimator_options'] }

describe('parseCsv — RFC 4180 handling', () => {
  it('splits plain rows and tracks the source line of each', () => {
    const rows = parseCsv('a,b\n1,2\n3,4\n')
    expect(rows.map(r => r.cells)).toEqual([['a', 'b'], ['1', '2'], ['3', '4']])
    expect(rows.map(r => r.line)).toEqual([1, 2, 3])
  })

  it('keeps commas inside quoted fields', () => {
    const rows = parseCsv('a,b\n"one, two",three\n')
    expect(rows[1].cells).toEqual(['one, two', 'three'])
  })

  it('unescapes doubled quotes', () => {
    const rows = parseCsv('a\n"he said ""no"""\n')
    expect(rows[1].cells).toEqual(['he said "no"'])
  })

  it('keeps newlines inside quoted fields and still counts lines correctly after', () => {
    const rows = parseCsv('a,b\n"line one\nline two",x\nlast,y\n')
    expect(rows[1].cells[0]).toBe('line one\nline two')
    expect(rows[2].cells).toEqual(['last', 'y'])
    expect(rows[2].line, 'the embedded newline must advance the line counter').toBe(4)
  })

  it('preserves empty trailing cells rather than dropping them', () => {
    expect(parseCsv('a,b,c\n1,,\n')[1].cells).toEqual(['1', '', ''])
  })

  it('tolerates CRLF and a missing final newline', () => {
    const rows = parseCsv('a,b\r\n1,2')
    expect(rows.map(r => r.cells)).toEqual([['a', 'b'], ['1', '2']])
  })
})

describe('parseCsvRecords — coercions the schemas rely on', () => {
  it('omits empty cells entirely rather than setting them to an empty string', () => {
    const { records } = parseCsvRecords('id,tier\nx,\n')
    expect('tier' in records[0], 'an empty tier must be absent, not ""').toBe(false)
  })

  it('coerces booleans and integers', () => {
    const { records } = parseCsvRecords('id,flag,n\nx,true,4\ny,false,-2\n')
    expect(records[0].flag).toBe(true)
    expect(records[1].flag).toBe(false)
    expect(records[0].n).toBe(4)
    expect(records[1].n).toBe(-2)
  })

  it('splits only the named pipe-separated columns', () => {
    const { records } = parseCsvRecords('id,estimator_options,notes\nx,A|B,C|D\n', PIPE)
    expect(records[0].estimator_options).toEqual(['A', 'B'])
    expect(records[0].notes, 'notes is not declared pipe-separated').toBe('C|D')
  })

  it('reports the source line of each record', () => {
    const { lines } = parseCsvRecords('id\na\nb\n')
    expect(lines).toEqual([2, 3])
  })
})

// These lock in the signed-off 32 -> 22 mapping. Changing the register should require
// changing a test, not just editing a spreadsheet.
describe('designs.csv — the signed-off register', () => {
  let records, byId
  beforeAll(() => {
    const src = readFileSync(join(ROOT, 'spec', 'designs.csv'), 'utf8')
    records = parseCsvRecords(src, PIPE).records
    byId = Object.fromEntries(records.map(r => [r.id, r]))
  })

  it('holds 22 designs', () => {
    expect(records.length).toBe(22)
  })

  it('has unique ids', () => {
    expect(new Set(records.map(r => r.id)).size).toBe(records.length)
  })

  it('distributes counterfactual designs 6/3/5/4/1 across tiers 1 to 5', () => {
    const counts = [1, 2, 3, 4, 5].map(t => records.filter(r => r.tier === t).length)
    expect(counts).toEqual([6, 3, 5, 4, 1])
  })

  it('keeps the theory-based strand off the ladder', () => {
    const tb = records.filter(r => r.strand === 'theory_based')
    expect(tb.length).toBe(3)
    expect(tb.every(r => !('tier' in r)), 'a theory-based design must carry no tier').toBe(true)
  })

  it('gives every counterfactual design a tier', () => {
    expect(records.filter(r => r.strand === 'counterfactual').every(r => r.tier >= 1 && r.tier <= 5)).toBe(true)
  })

  it('marks exactly the six randomised designs prospective-only', () => {
    const prospective = records.filter(r => r.prospective_only).map(r => r.id).sort()
    expect(prospective).toEqual([
      'encouragement', 'rct_cluster', 'rct_crossover',
      'rct_individual', 'rct_stepped_wedge', 'rct_waitlist',
    ])
  })

  describe('merges agreed in the mapping', () => {
    it('folds Callaway-Sant\'Anna and Sun-Abraham into staggered DiD as estimators', () => {
      expect(byId.did_cs).toBeUndefined()
      expect(byId.did_sa).toBeUndefined()
      expect(byId.did_staggered.estimator_options).toEqual(
        expect.arrayContaining(["Callaway-Sant'Anna", 'Sun-Abraham']),
      )
    })

    it('keeps 2x2 and staggered DiD as separate designs', () => {
      expect(byId.did_2x2).toBeDefined()
      expect(byId.did_staggered).toBeDefined()
      expect(byId.did_2x2.tier).toBe(byId.did_staggered.tier)
    })

    it('folds fuzzy-RD-as-IV into rd_fuzzy, removing the duplicate IV entry', () => {
      expect(byId.iv_frd).toBeUndefined()
      expect(byId.rd_fuzzy.estimator_options).toEqual(expect.arrayContaining(['Fuzzy RD as IV']))
      expect(byId.iv_2sls, 'standard IV stays a design in its own right').toBeDefined()
    })

    it('folds the three g-methods into one design', () => {
      for (const gone of ['msm', 'gest', 'gcomp_tv']) expect(byId[gone]).toBeUndefined()
      expect(byId.gmethods.estimator_options.length).toBe(3)
    })

    it('folds segmented regression into ITS as an estimator', () => {
      expect(byId.its_seg).toBeUndefined()
      expect(byId.its.estimator_options).toEqual(expect.arrayContaining(['Segmented regression']))
    })

    it('folds augmented synthetic control into synth', () => {
      expect(byId.asc).toBeUndefined()
      expect(byId.synth.estimator_options).toEqual(expect.arrayContaining(['Augmented synthetic control']))
    })

    it('keeps matching, weighting and g-computation apart at tier 4', () => {
      for (const id of ['matching', 'weighting', 'gcomp']) expect(byId[id].tier).toBe(4)
      // Separated because they fail differently: covariate richness vs positivity.
      expect(byId.weighting.notes).toMatch(/positivity/i)
      expect(byId.matching.notes).toMatch(/covariate/i)
    })
  })

  describe('tier placements carried over from sign-off', () => {
    it('places RDIT and controlled ITS at tier 3, not tier 2', () => {
      expect(byId.rdit.tier).toBe(3)
      expect(byId.its_controlled.tier).toBe(3)
    })

    it('qualifies matching as upper tier 4 where prior outcomes are used', () => {
      expect(byId.matching.tier_qualifier).toMatch(/[Uu]pper Tier 4/)
    })

    it('places encouragement at tier 1, recording that the LATE needs the exclusion restriction', () => {
      expect(byId.encouragement.tier).toBe(1)
      expect(byId.encouragement.tier_qualifier).toMatch(/exclusion restriction/i)
    })

    it('leaves the single-series ITS alone at tier 5', () => {
      expect(byId.its.tier).toBe(5)
      expect(records.filter(r => r.tier === 5).map(r => r.id)).toEqual(['its'])
    })
  })
})
