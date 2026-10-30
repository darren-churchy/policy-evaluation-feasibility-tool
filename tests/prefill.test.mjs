// Phase 4's acceptance criterion: an answer given once is prefilled everywhere.
//
// The previous tool kept separate state per tool under different ids — `q_defined` in the
// Design Finder, `p3_defined` in the assessment — so the two could hold different values
// and reach different conclusions from the same facts. These tests assert that is no
// longer possible, at the level where it was possible: the bridge that routes every old id
// into the one store.
//
// The components are tested through that bridge rather than by rendering them, because the
// bridge is where the sharing happens — a page reads `inputs[id]` and writes `set(id, v)`,
// and both go through here.

import { describe, it, expect, beforeAll } from 'vitest'
import { loadSpec } from '../scripts/lib/loadSpec.mjs'
import {
  buildBridge, routeWrite, toLegacyInputs, toLegacyRows, fromLegacyRows,
  SHARED, NOTE, LOCAL,
} from '../src/state/legacyBridge.js'

let spec, bridge
beforeAll(() => {
  spec = loadSpec()
  bridge = buildBridge(spec.migration)
})

/** Apply a write the way the pages do, and read the result back as `inputs`. */
function write(store, id, value) {
  const routed = routeWrite(bridge, id, value)
  if (routed.kind === SHARED) store.answers[routed.id] = routed.value
  else if (routed.kind === NOTE) store.notes[routed.id] = routed.value
  else store.local[routed.id] = routed.value
  return store
}
const emptyStore = () => ({ answers: {}, notes: {}, local: {} })
const read = store => toLegacyInputs(bridge, store.answers, store.notes, store.local)

describe('an answer given once is prefilled everywhere', () => {
  // The four questions the previous tool asked twice, under two names each. This is the
  // defect, stated as a test.
  const COLLISIONS = [
    ['q_defined', 'p3_defined', 'yes'],
    ['q_toc', 'p3_toc', 'yes'],
    ['q_scale', 'p3_scale', 'yes'],
  ]

  it.each(COLLISIONS)('answering %s prefills %s', (finderId, assessmentId, value) => {
    const store = write(emptyStore(), finderId, value)
    expect(read(store)[assessmentId]).toBe(value)
  })

  it.each(COLLISIONS)('and the reverse: answering %s prefills %s', (finderId, assessmentId, value) => {
    const store = write(emptyStore(), assessmentId, value)
    expect(read(store)[finderId]).toBe(value)
  })

  // The two spell prospectiveness differently, so this one has to survive a value
  // translation in both directions as well as a rename.
  it('shares prospectiveness between the Finder and the assessment', () => {
    expect(read(write(emptyStore(), 'q_prospective', 'no')).p1_prospective).toBe('no')
    expect(read(write(emptyStore(), 'p1_prospective', 'no')).q_prospective).toBe('no')
  })

  it('reaches the shared store under the new id, not the old one', () => {
    const store = write(emptyStore(), 'q_defined', 'yes')
    expect(store.answers).toEqual({ intervention_defined: 'yes' })
    expect(store.answers.q_defined).toBeUndefined()
    expect(store.answers.p3_defined).toBeUndefined()
  })

  // Every collision the migration records must actually collapse, not just be listed.
  it('collapses every recorded collision to one stored answer', () => {
    for (const collision of spec.migration.collisions ?? []) {
      const [first] = collision.from
      const entry = spec.migration.renamed.find(m => m.from === first)
      const value = [...Object.values(entry.values ?? {})][0]
        ?? [...spec.questions.find(q => q.id === collision.target).options][0].value
      const store = write(emptyStore(), first, Object.keys(entry.values ?? {})[0] ?? value)
      expect(Object.keys(store.answers), `${first} should write one answer`).toEqual([collision.target])
    }
  })
})

describe('values are translated, not passed through', () => {
  it('maps the Finder\'s coarser covariate answer onto the richer scale', () => {
    const store = write(emptyStore(), 'q_covariates', 'partial')
    expect(store.answers.covariate_richness).toBe('partial')
    expect(read(write(emptyStore(), 'q_covariates', 'yes')).q_covariates).toBe('yes')
  })

  it('maps the old analysis approach onto the new vocabulary', () => {
    expect(write(emptyStore(), 'p7_analysis', 'freq').answers.analysis_approach).toBe('nhst')
    expect(write(emptyStore(), 'p7_analysis', 'bayes').answers.analysis_approach).toBe('bayesian')
  })

  // Reading back a many-to-one mapping cannot be exact. It must still be a value the old
  // page offers, or the page renders nothing selected.
  it('reads every translated value back as something the old page recognises', () => {
    for (const entry of spec.migration.renamed) {
      for (const [oldValue, newValue] of Object.entries(entry.values ?? {})) {
        const back = read({ answers: { [entry.to]: newValue }, notes: {}, local: {} })[entry.from]
        expect(back, `${entry.from}=${oldValue} did not survive the round trip`).toBeDefined()
      }
    }
  })

  it('writes only values the target question offers', () => {
    const options = new Map(spec.questions.map(q => [q.id, new Set(q.options.map(o => String(o.value)))]))
    for (const entry of spec.migration.renamed) {
      for (const oldValue of Object.keys(entry.values ?? {})) {
        const store = write(emptyStore(), entry.from, oldValue)
        expect(options.get(entry.to).has(String(store.answers[entry.to])),
          `${entry.from}=${oldValue} wrote a value ${entry.to} does not offer`).toBe(true)
      }
    }
  })
})

describe('what is deliberately not shared', () => {
  // A screen asserted two or three conditions behind one yes/no. Sharing its value would
  // mean inventing answers to questions the user was never asked.
  it('keeps design-screen answers out of the shared store', () => {
    for (const entry of spec.migration.split) {
      const store = write(emptyStore(), entry.from, 'yes')
      expect(store.answers, `${entry.from} must not reach the engine`).toEqual({})
      expect(store.local[entry.from]).toBe('yes')
    }
  })

  it('keeps the dropped ids out of the shared store', () => {
    for (const entry of spec.migration.dropped) {
      const store = write(emptyStore(), entry.from, 'yes')
      expect(store.answers, `${entry.from} was dropped and must not reach the engine`).toEqual({})
    }
  })

  // The ready-reckoner's isolation, approached from the other side.
  it('never lets the old numeric sample size reach an answer', () => {
    const store = write(emptyStore(), 'p7_n', '250')
    expect(store.answers).toEqual({})
    expect(store.notes).toEqual({})
    expect(read(store).p7_n).toBe('250')
  })

  it('still renders a dropped id on the page that asks it', () => {
    const store = write(emptyStore(), 'p3_exchangeability', 'partial')
    expect(read(store).p3_exchangeability).toBe('partial')
  })
})

describe('free text reaches the notes annex', () => {
  it('routes the DAG fields to their guide fields', () => {
    const store = write(emptyStore(), 'p5_confounders', 'prior history, area')
    expect(store.notes).toEqual({ dag_confounders: 'prior history, area' })
    expect(store.answers).toEqual({})
  })

  it('shows a note written in a guide back on the old page', () => {
    const inputs = toLegacyInputs(bridge, {}, { dag_unmeasured: 'motivation' }, {})
    expect(inputs.p5_unmeasured).toBe('motivation')
  })
})

describe('the data source table', () => {
  it('round trips through the notes annex', () => {
    const rows = [{
      name: 'Case system', type: 'Administrative', period: '2019–', geo: 'National',
      quality: 'Good', linkable: 'Local ID', hasExposure: 'Yes', hasOutcome: 'No',
    }]
    const stored = fromLegacyRows(bridge, rows)
    expect(stored[0].coverage).toBe('National')
    expect(stored[0].holds_exposure).toBe('Yes')

    const back = toLegacyRows(bridge, { data_sources: stored }, () => ({}))
    expect(back[0].geo).toBe('National')
    expect(back[0].hasExposure).toBe('Yes')
    // Columns the inventory does not carry are kept rather than discarded.
    expect(back[0].quality).toBe('Good')
  })

  it('gives the old page a blank row when there is nothing stored', () => {
    const blank = () => ({ name: '' })
    expect(toLegacyRows(bridge, {}, blank)).toEqual([{ name: '' }])
  })
})
