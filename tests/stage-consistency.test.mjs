import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { inferStage, isGrowOnly, stageLabel, stageGloss, STAGE_ORDER } from '../src/engine/stage.js'

const ROOT = new URL('..', import.meta.url).pathname
const READY = { intervention_defined: 'yes', theory_of_change: 'yes', maturity: 'yes' }

describe('one stage rule for the whole app', () => {
  it('reaches Test and Grow together when readiness is met', () => {
    expect(inferStage(READY).stages).toEqual(['test', 'grow'])
  })

  it('narrows to Test when something is still settling', () => {
    expect(inferStage({ ...READY, maturity: 'partial' }).stages).toEqual(['test'])
  })

  it('says nothing while the readiness answers are outstanding', () => {
    // Guessing a stage from no answers is how the previous tool produced a verdict
    // before anything was known.
    expect(inferStage({}).stages).toEqual([])
  })

  it('routes a failed gate to Co-design and an immature intervention to Explore', () => {
    expect(inferStage({ ...READY, intervention_defined: 'no' }).stages).toEqual(['co_design'])
    expect(inferStage({ ...READY, theory_of_change: 'no' }).stages).toEqual(['co_design'])
    expect(inferStage({ ...READY, maturity: 'no' }).stages).toEqual(['explore'])
  })

  it('exposes labels and glosses for every stage', () => {
    for (const id of STAGE_ORDER) {
      expect(stageLabel(id)).toBeTruthy()
      expect(stageGloss(id), `${id} needs a gloss`).toBeTruthy()
    }
  })
})

// The defect this module exists to close. The quantitative tree tagged seven results
// Grow-only and the qualitative tree four, while the Design Finder and Causal Readiness
// page said Test and Grow. Those eleven tags were corrected; these tests stop them
// returning.
describe('nothing is restricted to Grow', () => {
  it('recognises a Grow-only combination as invalid', () => {
    expect(isGrowOnly(['grow'])).toBe(true)
    expect(isGrowOnly(['test', 'grow'])).toBe(false)
    expect(isGrowOnly(['test'])).toBe(false)
  })

  it('never infers Grow without Test, for any combination of readiness answers', () => {
    // Exhaustive over the readiness answer space rather than a sample.
    const values = ['yes', 'partial', 'no', undefined]
    for (const defined of values) {
      for (const toc of values) {
        for (const maturity of values) {
          const answers = {}
          if (defined) answers.intervention_defined = defined
          if (toc) answers.theory_of_change = toc
          if (maturity) answers.maturity = maturity
          const { stages } = inferStage(answers)
          expect(isGrowOnly(stages), `Grow-only for ${JSON.stringify(answers)}`).toBe(false)
        }
      }
    }
  })

  // designFinderData.js was retired with the Design Finder; the screening checkpoint in
  // the assessment replaced it, and takes its stage from the engine.
  it.each(['quantTreeData.js', 'qualTreeData.js'])(
    'has no Grow-only tag left in %s',
    file => {
      const source = readFileSync(join(ROOT, 'src', 'data', file), 'utf8')
      const growOnly = source.match(/tlStages:\s*\[\s*["']Grow["']\s*\]/g) ?? []
      expect(growOnly, 'a design restricted to Grow contradicts the signed-off resolution').toEqual([])
    },
  )

  it.each(['quantTreeData.js', 'qualTreeData.js'])(
    'pairs Grow with Test wherever Grow appears in %s',
    file => {
      const source = readFileSync(join(ROOT, 'src', 'data', file), 'utf8')
      for (const match of source.match(/tlStages:\s*\[[^\]]*\]/g) ?? []) {
        if (match.includes('Grow')) {
          expect(match, `${match} offers Grow without Test`).toContain('Test')
        }
      }
    },
  )
})
