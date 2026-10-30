// The guides and the notes annex.
//
// A guide captures the reasoning a methods reviewer reads — the ideal trial, the causal
// diagram, what data exists — without any of it reaching a verdict. The previous tool
// gated this material behind a scored assessment, which implied it was part of the verdict
// when it never was.
//
// Most of what follows tests that separation, because it is the whole point: if a note
// could reach the engine, the guides would be questions wearing a different label.

import { describe, it, expect, beforeAll } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { loadSpec } from '../scripts/lib/loadSpec.mjs'
import { evaluate } from '../src/engine/evaluate.js'
import { buildReport } from '../src/report/buildReport.js'
import { buildSaveFile, parseSaveFile } from '../src/state/AnswersContext.jsx'

const ROOT = new URL('..', import.meta.url).pathname

let spec, guides
beforeAll(() => {
  spec = loadSpec()
  guides = spec.guides.guides
})

const ANSWERS = {
  intervention_defined: 'yes', theory_of_change: 'yes', maturity: 'yes',
  record_linkage: 'individual', prospective: 'no', comparison_group: 'yes',
  pre_periods: 'many',
}

describe('a note can never reach a verdict', () => {
  // The structural guarantee. evaluate() takes answers; notes are a separate object that
  // is never passed to it, and the engine does not know the word.
  it('the engine mentions neither notes nor guides', () => {
    for (const file of ['evaluate.js', 'logic.js', 'stage.js']) {
      const source = readFileSync(join(ROOT, 'src', 'engine', file), 'utf8')
      const code = source.replace(/\/\/.*$/gm, '').replace(/\/\*[\s\S]*?\*\//g, '')
      expect(code, `${file} must not read notes`).not.toMatch(/\bnotes\b|\bguides\b/)
    }
  })

  // The belt to that brace: even if some future code did merge the two objects, an id
  // collision is the only way a note could be read as an answer — and the spec validator
  // refuses one.
  it('no guide field shares an id with a question', () => {
    const questionIds = new Set(spec.questions.map(q => q.id))
    for (const guide of guides) {
      for (const field of guide.fields ?? []) {
        expect(questionIds.has(field.id), `${field.id} collides with a question`).toBe(false)
      }
      if (guide.table) {
        expect(questionIds.has(guide.table.id)).toBe(false)
      }
    }
  })

  it('every note id is unique across all guides', () => {
    const ids = guides.flatMap(g => [
      ...(g.fields ?? []).map(f => f.id),
      ...(g.table ? [g.table.id] : []),
    ])
    expect(new Set(ids).size).toBe(ids.length)
  })

  // The demonstration, rather than the argument: notes that look exactly like answers
  // change nothing, because they never go in.
  it('produces an identical verdict however the notes are filled in', () => {
    const baseline = JSON.stringify(evaluate(ANSWERS, spec))
    const noisy = {
      ...ANSWERS,
      // These keys are notes, not answers — and must stay inert.
      trial_outcome: 'anything at all',
      dag_unmeasured: 'prospective',
      data_gaps: 'no',
    }
    // Even passed in as though they were answers, the engine has no rule reading them.
    expect(JSON.stringify(evaluate(noisy, spec))).toBe(baseline)
  })
})

describe('the save file keeps them apart', () => {
  it('writes notes in their own key, not among the answers', () => {
    const file = buildSaveFile({ prospective: 'no' }, '1.2.0', { trial_outcome: 'a note' })
    expect(file.answers).toEqual({ prospective: 'no' })
    expect(file.notes).toEqual({ trial_outcome: 'a note' })
    expect(file.answers.trial_outcome).toBeUndefined()
  })

  it('round trips both', () => {
    const notes = { trial_eligibility: 'adults', data_sources: [{ name: 'A system' }] }
    const file = buildSaveFile({ prospective: 'no' }, '1.2.0', notes)
    const loaded = parseSaveFile(JSON.stringify(file), '1.2.0', new Set(['prospective']))
    expect(loaded.answers).toEqual({ prospective: 'no' })
    expect(loaded.notes).toEqual(notes)
  })

  // Answers are validated against the question bank and dropped if unrecognised. Notes
  // reach no rule, so there is nothing to validate them against and nothing to gain by
  // discarding a user's reasoning.
  it('keeps an unrecognised note rather than dropping it', () => {
    const file = buildSaveFile({}, '1.2.0', { some_retired_field: 'still worth reading' })
    const loaded = parseSaveFile(JSON.stringify(file), '1.2.0', new Set())
    expect(loaded.notes.some_retired_field).toBe('still worth reading')
  })

  it('tolerates a file saved before notes existed', () => {
    const old = { format: 'impact-evaluation-feasibility/answers', specVersion: '1.2.0', answers: { prospective: 'no' } }
    const loaded = parseSaveFile(JSON.stringify(old), '1.2.0', new Set(['prospective']))
    expect(loaded.notes).toEqual({})
    expect(loaded.warnings).toEqual([])
  })
})

describe('the report carries the notes', () => {
  const NOTES = {
    trial_eligibility: 'All adults first referred in the eligible areas.',
    dag_unmeasured: 'Motivation at the point of referral',
    data_sources: [{ name: 'Case management system', holder: 'Delivery directorate' }],
    data_gaps: 'Outcome field incomplete before 2021.',
  }
  const render = (notes = NOTES) => buildReport({
    result: evaluate(ANSWERS, spec), answers: ANSWERS, notes, spec, date: '30 October 2026',
  })

  it('renders them under their own heading', () => {
    const html = render()
    expect(html).toContain('Notes and supporting work')
    expect(html).toContain('All adults first referred in the eligible areas.')
    expect(html).toContain('Case management system')
  })

  it('says they contributed nothing to the verdicts', () => {
    expect(render()).toMatch(/None of it contributed to the\s+verdicts/)
  })

  it('leaves the section out entirely when there are no notes', () => {
    expect(render({})).not.toContain('Notes and supporting work')
  })

  it('skips a guide the user did not fill in', () => {
    const html = render({ data_gaps: 'only this' })
    expect(html).toContain('Data source inventory')
    expect(html).not.toContain('Ideal trial specification')
  })

  it('escapes what it renders', () => {
    const html = render({ trial_eligibility: '<script>bad()</script>' })
    expect(html).not.toContain('<script>bad()</script>')
    expect(html).toContain('&lt;script&gt;')
  })
})

describe('the guides themselves', () => {
  it('ships the three', () => {
    expect(guides.map(g => g.id)).toEqual(['ideal_trial', 'causal_diagram', 'data_sources'])
  })

  it('says what each is for and when to use it', () => {
    for (const guide of guides) {
      expect(guide.purpose, `${guide.id} needs a purpose`).toBeTruthy()
      expect(guide.when, `${guide.id} needs a "when"`).toBeTruthy()
    }
  })

  it('gives every field a label, and a hint where one would help', () => {
    for (const guide of guides) {
      for (const field of guide.fields ?? []) {
        expect(field.label, `${field.id} needs a label`).toBeTruthy()
      }
    }
  })

  // The two symmetrical failures the causal-diagram guide exists to prevent.
  it('warns against adjusting for mediators and colliders', () => {
    const dag = guides.find(g => g.id === 'causal_diagram')
    const mediators = dag.fields.find(f => f.id === 'dag_mediators')
    const colliders = dag.fields.find(f => f.id === 'dag_colliders')
    expect(mediators.hint).toMatch(/Do not adjust/i)
    expect(colliders.hint).toMatch(/Never adjust/i)
  })

  // Time zero is the assignment, not the receipt — the most common source of bias the
  // ideal-trial exercise is meant to catch.
  it('names time zero in the follow-up field', () => {
    const trial = guides.find(g => g.id === 'ideal_trial')
    expect(trial.fields.find(f => f.id === 'trial_followup').hint).toMatch(/not of receipt/i)
  })

  it('gives the inventory table its columns', () => {
    const data = guides.find(g => g.id === 'data_sources')
    expect(data.table.columns.map(c => c.id)).toContain('identifiers')
  })
})
