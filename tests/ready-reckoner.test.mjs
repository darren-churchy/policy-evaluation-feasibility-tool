// The ready-reckoner: its arithmetic, and its isolation from the engine.
//
// The isolation matters more than the arithmetic. The specification declares the reckoner
// with `engine_reads: false` and tests/statistics.test.mjs asserts the engine never reads
// it. These tests close the other half of the loop: that the reckoner never reaches back,
// and that the panel does not write its inputs into the store the engine reads.

import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import {
  effectiveSample, reckonNhst, reckonBayesian, ATTRITION_RATE,
} from '../src/components/statistics/readyReckoner.js'

const ROOT = new URL('..', import.meta.url).pathname
const STATS_DIR = join(ROOT, 'src', 'components', 'statistics')
const read = name => readFileSync(join(STATS_DIR, name), 'utf8')

describe('the reckoner cannot reach a verdict', () => {
  it('imports neither the engine nor the specification bundle', () => {
    const source = read('readyReckoner.js')
    expect(source, 'the arithmetic must not import the engine').not.toMatch(/engine\//)
    expect(source, 'the arithmetic must not import the spec bundle').not.toMatch(/spec\.generated/)
    expect(source, 'the arithmetic must not reach the answer store').not.toMatch(/AnswersContext/)
  })

  it('takes plain values and returns plain values, with no React', () => {
    const source = read('readyReckoner.js')
    expect(source).not.toMatch(/from 'react'/)
  })

  // The panel reads three answers the specification lists as its inputs. It must not
  // write any answer back, because the store is what the engine reads — so a sample size
  // typed into an illustration could otherwise reach a verdict by the back door.
  it('the panel never writes to the answer store', () => {
    const source = read('ReadyReckoner.jsx')
    const code = source.replace(/\/\/.*$/gm, '').replace(/\/\*[\s\S]*?\*\//g, '')
    expect(code, 'the panel must not destructure the store setter').not.toMatch(/\bset\b\s*[,}]/)
    expect(code, 'the panel must not call the store setter').not.toMatch(/\bset\(/)
  })
})

describe('the sample the analysis actually has', () => {
  it('applies the midpoint of the stated attrition band', () => {
    const s = effectiveSample({ n: 1000, attritionBand: 'moderate', clustered: false })
    expect(s.attritionRate).toBe(ATTRITION_RATE.moderate)
    expect(s.analysed).toBe(825)
    expect(s.effective).toBe(825)
  })

  it('makes no allowance when attrition is not yet established', () => {
    const s = effectiveSample({ n: 500, attritionBand: 'unknown', clustered: false })
    expect(s.attritionRate).toBe(0)
    expect(s.effective).toBe(500)
  })

  // The correction most often omitted, and the one that bites hardest.
  it('divides by the design effect when outcomes are clustered', () => {
    const s = effectiveSample({
      n: 1000, attritionBand: 'unknown', clustered: true, icc: 0.05, clusterSize: 50,
    })
    expect(s.designEffect).toBeCloseTo(1 + 49 * 0.05, 10) // 3.45
    expect(s.effective).toBeCloseTo(1000 / 3.45, 6)
  })

  it('returns nothing rather than guessing when clustering inputs are missing', () => {
    expect(effectiveSample({ n: 1000, clustered: true, icc: '', clusterSize: 50 })).toBeNull()
    expect(effectiveSample({ n: 1000, clustered: true, icc: 0.05, clusterSize: '' })).toBeNull()
  })

  it('rejects a sample that is absent or impossible', () => {
    expect(effectiveSample({ n: '' })).toBeNull()
    expect(effectiveSample({ n: 0 })).toBeNull()
    expect(effectiveSample({ n: -50 })).toBeNull()
  })
})

describe('the frequentist figure', () => {
  // MDE = (z(0.975) + z(0.80)) * 2 / sqrt(n) for a standardised continuous outcome.
  it('matches the textbook two-arm calculation', () => {
    const r = reckonNhst({ n: 825, attritionBand: 'unknown', outcomeType: 'continuous', clustered: false })
    const expected = (1.959964 + 0.841621) * 2 / Math.sqrt(825)
    expect(expected).toBeCloseTo(0.195, 3)
    expect(r.figures[0].value).toBe(`${0.2} standard deviations`)
  })

  it('reports a binary outcome in percentage points and against its baseline', () => {
    const r = reckonNhst({
      n: 1000, attritionBand: 'unknown', outcomeType: 'binary', baseline: 0.3, clustered: false,
    })
    expect(r.figures[0].value).toMatch(/percentage points$/)
    expect(r.figures[1].label).toMatch(/baseline/)
  })

  it('needs a baseline before it will produce a figure for a binary outcome', () => {
    expect(reckonNhst({
      n: 1000, attritionBand: 'unknown', outcomeType: 'binary', baseline: '', clustered: false,
    })).toBeNull()
  })

  // Power for a survival outcome is driven by events, not people. A figure derived from
  // sample size would be wrong in a way that looks plausible, so none is given.
  it('refuses a time-to-event outcome rather than approximating it', () => {
    const r = reckonNhst({ n: 1000, outcomeType: 'time_to_event' })
    expect(r.unavailable).toMatch(/number of events/)
    expect(r.figures).toBeUndefined()
  })

  it('states its conventions rather than burying them', () => {
    const r = reckonNhst({ n: 500, attritionBand: 'low', outcomeType: 'continuous', clustered: false })
    expect(r.assumptions.join(' ')).toMatch(/conventions, not requirements/)
    expect(r.assumptions.join(' ')).toMatch(/5%/)
  })
})

describe('the Bayesian figure', () => {
  const base = {
    n: 200, attritionBand: 'unknown', outcomeType: 'continuous', clustered: false,
  }

  it('narrows the interval as the prior is given more weight', () => {
    const weak = reckonBayesian({ ...base, priorEss: 0 })
    const strong = reckonBayesian({ ...base, priorEss: 400 })
    const width = r => Number(r.figures[0].value.match(/[\d.]+/)[0])
    expect(width(strong)).toBeLessThan(width(weak))
  })

  // The framing the whole Bayesian branch exists to carry: a small sample does not
  // invalidate the inference, it means the prior supplies more of the answer. The figure
  // has to make that share visible rather than letting it hide in a narrow interval.
  it('reports the share of posterior precision the prior supplies', () => {
    const r = reckonBayesian({ ...base, priorEss: 200 })
    expect(r.figures[1].value).toBe('50%')
  })

  it('names the prior as doing most of the work when it is', () => {
    const r = reckonBayesian({ ...base, priorEss: 600 })
    expect(r.figures[1].value).toBe('75%')
    expect(r.figures[1].note).toMatch(/most of the answer/)
    expect(r.figures[1].note).toMatch(/defensible/)
  })

  it('credits the data when the data are doing the work', () => {
    const r = reckonBayesian({ ...base, priorEss: 10 })
    expect(r.figures[1].note).toMatch(/data are supplying most/)
  })

  it('shows what the data alone would give, alongside the figure with the prior', () => {
    const r = reckonBayesian({ ...base, priorEss: 200 })
    expect(r.figures[0].note).toMatch(/Data alone would give/)
  })

  it('says the prior is assumed to agree with the data', () => {
    const r = reckonBayesian({ ...base, priorEss: 100 })
    expect(r.assumptions.join(' ')).toMatch(/conflicts with the data gives a wider interval/)
  })

  it('needs a prior weight before it will produce a figure', () => {
    expect(reckonBayesian({ ...base, priorEss: '' })).toBeNull()
  })

  it('refuses a time-to-event outcome, as the frequentist mode does', () => {
    expect(reckonBayesian({ ...base, outcomeType: 'time_to_event', priorEss: 100 }).unavailable)
      .toMatch(/number of events/)
  })
})
