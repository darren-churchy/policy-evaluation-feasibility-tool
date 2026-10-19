import { describe, it, expect } from 'vitest'
import { buildSaveFile, parseSaveFile, SAVE_FORMAT } from '../src/state/AnswersContext.jsx'
import { loadSpec } from '../scripts/lib/loadSpec.mjs'
import { buildSpecBundle } from '../scripts/build-spec.mjs'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { evaluate } from '../src/engine/evaluate.js'

const ROOT = new URL('..', import.meta.url).pathname
const spec = loadSpec()
const QUESTION_IDS = new Set(spec.questions.map(q => q.id))
const VERSION = spec.tiers.spec_version

describe('the spec bundle', () => {
  it('matches what is committed', () => {
    // The bundle is what the browser actually runs. If it drifts, a rule change validates
    // and generates a correct reviewer pack while shipping the old behaviour.
    const committed = readFileSync(join(ROOT, 'src', 'spec', 'spec.generated.json'), 'utf8')
    expect(committed, 'run `npm run spec:build` and commit the result').toBe(buildSpecBundle())
  })

  it('is reproducible', () => {
    expect(buildSpecBundle()).toBe(buildSpecBundle())
  })

  it('produces the same verdicts as the source specification', () => {
    const bundled = JSON.parse(buildSpecBundle())
    const answers = {
      claim_type: 'causal', intervention_defined: 'yes', theory_of_change: 'yes',
      maturity: 'yes', prospective: 'yes', randomisation_barriers: 'none',
      allocation_unit: 'individual', equipoise: 'yes',
    }
    expect(JSON.stringify(evaluate(answers, bundled)))
      .toBe(JSON.stringify(evaluate(answers, spec)))
  })

  it('carries every spec file the engine reads', () => {
    const bundled = JSON.parse(buildSpecBundle())
    for (const key of ['tiers', 'designs', 'questions', 'rules', 'stages', 'statistics']) {
      expect(bundled[key], `${key} missing from the bundle`).toBeTruthy()
    }
  })
})

describe('save and load', () => {
  it('round-trips answers unchanged', () => {
    const answers = { prospective: 'yes', pre_periods: 'many', analysis_approach: 'bayesian' }
    const file = buildSaveFile(answers, VERSION)
    const { answers: back, warnings } = parseSaveFile(JSON.stringify(file), VERSION, QUESTION_IDS)
    expect(back).toEqual(answers)
    expect(warnings).toEqual([])
  })

  it('records the spec version it was saved against', () => {
    expect(buildSaveFile({}, VERSION).specVersion).toBe(VERSION)
    expect(buildSaveFile({}, VERSION).format).toBe(SAVE_FORMAT)
  })

  it('warns on a spec version mismatch rather than refusing', () => {
    // Refusing would lose the user's work. The answers are usually still usable; what is
    // not safe is assuming the verdicts carry over.
    const file = buildSaveFile({ prospective: 'yes' }, '0.9.0')
    const { answers, warnings } = parseSaveFile(JSON.stringify(file), VERSION, QUESTION_IDS)
    expect(answers).toEqual({ prospective: 'yes' })
    expect(warnings[0]).toMatch(/0\.9\.0/)
    expect(warnings[0]).toMatch(/Rules may have changed/)
  })

  it('drops answers whose question no longer exists, and says so', () => {
    const file = buildSaveFile({ prospective: 'yes', p3_defined: 'yes' }, VERSION)
    const { answers, warnings } = parseSaveFile(JSON.stringify(file), VERSION, QUESTION_IDS)
    expect(answers).toEqual({ prospective: 'yes' })
    expect(warnings.join(' ')).toMatch(/p3_defined/)
  })

  it('rejects a file this tool did not write', () => {
    const { answers, warnings } = parseSaveFile('{"answers":{"a":1}}', VERSION, QUESTION_IDS)
    expect(answers).toBeNull()
    expect(warnings[0]).toMatch(/not saved by this tool/)
  })

  it('rejects unparseable input without throwing', () => {
    const { answers, warnings } = parseSaveFile('not json at all', VERSION, QUESTION_IDS)
    expect(answers).toBeNull()
    expect(warnings[0]).toMatch(/could not be read/)
  })

  it('restores identical verdicts after a round trip', () => {
    const answers = {
      claim_type: 'causal', intervention_defined: 'yes', theory_of_change: 'yes',
      maturity: 'yes', prospective: 'no', pre_periods: 'many', comparison_group: 'yes',
      parallel_trends_evidence: 'untested', staggered_rollout: 'no',
    }
    const file = JSON.stringify(buildSaveFile(answers, VERSION))
    const { answers: restored } = parseSaveFile(file, VERSION, QUESTION_IDS)
    expect(JSON.stringify(evaluate(restored, spec)))
      .toBe(JSON.stringify(evaluate(answers, spec)))
  })
})
