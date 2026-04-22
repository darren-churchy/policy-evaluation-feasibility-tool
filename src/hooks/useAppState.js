import { useState, useCallback, useMemo } from 'react'
import { assembleResults } from '../scoring/scoring.js'
import { NEXT_STEPS } from '../data/nextSteps.js'
import { GATE_ENABLED } from '../scoring/config.js'

const DEFAULT_STATE = {}
const DEFAULT_DATA_ROW = () => ({
  name: '', type: '', period: '', geo: '',
  quality: '', linkable: '', hasExposure: '', hasOutcome: '',
})

function getCompletedSections(inputs) {
  const completed = new Set()
  if (inputs.p1_rq && inputs.p1_prospective) completed.add('/page1')
  if (inputs.tte_eligibility && inputs.tte_outcome) completed.add('/page2')
  if (inputs.p3_defined && inputs.p3_toc && inputs.p3_scale) completed.add('/page3')
  if (inputs.screen_did || inputs.screen_rd || inputs.screen_its || inputs.screen_iv || inputs.screen_match) completed.add('/page4')
  if (inputs.p5_dag) completed.add('/page5')
  if (inputs.p6_linkage) completed.add('/page6')
  if (inputs.p7_n || inputs.p7_predata) completed.add('/page7')
  return completed
}

export function useAppState() {
  const [inputs, setInputs] = useState(DEFAULT_STATE)
  const [dataRows, setDataRows] = useState([DEFAULT_DATA_ROW()])

  const set = useCallback((id, value) => {
    setInputs(prev => ({ ...prev, [id]: value }))
  }, [])

  const setMany = useCallback((updates) => {
    setInputs(prev => ({ ...prev, ...updates }))
  }, [])

  const addDataRow = useCallback(() => {
    setDataRows(prev => [...prev, DEFAULT_DATA_ROW()])
  }, [])

  const removeDataRow = useCallback(() => {
    setDataRows(prev => prev.length > 1 ? prev.slice(0, -1) : prev)
  }, [])

  const updateDataRow = useCallback((index, field, value) => {
    setDataRows(prev => prev.map((row, i) =>
      i === index ? { ...row, [field]: value } : row
    ))
  }, [])

  const gatePassed = useMemo(() => {
    if (!GATE_ENABLED) return true
    const critical = ['p3_defined', 'p3_toc', 'p3_scale']
    return !critical.some(id => inputs[id] === 'no')
  }, [inputs])

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
