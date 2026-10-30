import { useState, useCallback, useMemo } from 'react'
import { assembleResults } from '../scoring/scoring.js'
import { NEXT_STEPS } from '../data/nextSteps.js'
import { GATE_ENABLED } from '../scoring/config.js'
import { useAnswers } from '../state/AnswersContext.jsx'
import { useLegacyInputs } from '../state/useLegacyInputs.js'
import { toLegacyRows, fromLegacyRows } from '../state/legacyBridge.js'

const DEFAULT_DATA_ROW = () => ({
  name: '', type: '', period: '', geo: '',
  quality: '', linkable: '', hasExposure: '', hasOutcome: '',
})

// Section completion — uses semantic paths matching new App.jsx routes
function getCompletedSections(inputs) {
  const completed = new Set()
  if (inputs.p1_rq && inputs.p1_prospective)        completed.add('/research-question')
  if (inputs.p3_defined && inputs.p3_toc && inputs.p3_scale) completed.add('/causal-readiness')
  if (inputs.tte_eligibility && inputs.tte_outcome)  completed.add('/ideal-trial')
  if (inputs.screen_did || inputs.screen_rd || inputs.screen_its ||
      inputs.screen_iv  || inputs.screen_match)       completed.add('/design-questions')
  if (inputs.p5_dag)                                 completed.add('/adjustment')
  if (inputs.p6_linkage)                             completed.add('/data-sources')
  if (inputs.p7_n || inputs.p7_predata)              completed.add('/statistical')
  return completed
}

/**
 * The seven sections' state, now backed by the shared answer store.
 *
 * The surface is unchanged — `inputs`, `set`, `dataRows` and the derived values all behave
 * as before — but the storage underneath is the one every tool uses, routed through
 * spec/migration.yaml. That is what makes an answer given in the Design Finder appear in
 * the assessment: they are the same answer now, not two that happen to agree.
 *
 * Values whose old id was dropped or split keep working here, in local state, because the
 * page still renders them. They never reach the engine, which is why they were dropped.
 */
export function useAppState() {
  const { notes, setNote } = useAnswers()
  const { inputs, set, setMany, bridge } = useLegacyInputs()

  const dataRows = useMemo(
    () => toLegacyRows(bridge, notes, DEFAULT_DATA_ROW),
    [bridge, notes],
  )

  const writeRows = useCallback(rows => {
    setNote(bridge.table?.to ?? 'data_sources', fromLegacyRows(bridge, rows))
  }, [bridge, setNote])

  const addDataRow = useCallback(() => {
    writeRows([...dataRows, DEFAULT_DATA_ROW()])
  }, [dataRows, writeRows])

  const removeDataRow = useCallback(() => {
    if (dataRows.length > 1) writeRows(dataRows.slice(0, -1))
  }, [dataRows, writeRows])

  const updateDataRow = useCallback((index, field, value) => {
    writeRows(dataRows.map((row, i) => (i === index ? { ...row, [field]: value } : row)))
  }, [dataRows, writeRows])

  // Gate — now checks definition AND ToC as separate conditions
  const gatePassed = useMemo(() => {
    if (!GATE_ENABLED) return true
    const critical = ['p3_defined', 'p3_toc', 'p3_scale']
    return !critical.some(id => inputs[id] === 'no')
  }, [inputs])

  // Gate failures — specific failed condition labels for targeted messaging
  const gateFailures = useMemo(() => {
    const LABELS = {
      p3_defined: 'Intervention is not clearly defined and documented',
      p3_toc:     'No logic model or theory of change exists',
      p3_scale:   'Intervention has not reached sufficient scale or maturity for evaluation',
    }
    return Object.entries(LABELS)
      .filter(([id]) => inputs[id] === 'no')
      .map(([, label]) => label)
  }, [inputs])

  const prospectiveOk = useMemo(() =>
    inputs.p1_prospective == null || inputs.p1_prospective !== 'no',
  [inputs])

  const results = useMemo(() => assembleResults(inputs), [inputs])

  const flaggedNextSteps = useMemo(() =>
    NEXT_STEPS.filter(item => {
      const val = inputs[item.id]
      return val != null && item.uncertainValues.includes(val)
    }),
  [inputs])

  const topDesign = useMemo(() => {
    const eligible = results.filter(r => r.weightedTotal !== null)
    return eligible.length > 0 ? eligible[0] : null
  }, [results])

  const completedSections = useMemo(() => getCompletedSections(inputs), [inputs])

  return {
    inputs, set, setMany,
    dataRows, addDataRow, removeDataRow, updateDataRow,
    gatePassed, gateFailures,
    prospectiveOk,
    results, flaggedNextSteps, topDesign,
    completedSections,
  }
}
