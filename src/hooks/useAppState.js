import { useState, useCallback, useMemo } from 'react'
import { assembleResults } from '../scoring/scoring.js'
import { NEXT_STEPS } from '../data/nextSteps.js'
import { GATE_ENABLED } from '../scoring/config.js'

// Default state — all inputs start empty/null so scoring defaults apply
const DEFAULT_STATE = {}

export function useAppState() {
  const [inputs, setInputs] = useState(DEFAULT_STATE)

  // Update a single input field
  const set = useCallback((id, value) => {
    setInputs(prev => ({ ...prev, [id]: value }))
  }, [])

  // Bulk update (e.g. resetting a section)
  const setMany = useCallback((updates) => {
    setInputs(prev => ({ ...prev, ...updates }))
  }, [])

  // Gate logic — mirrors R gate_passed reactive
  const gatePassed = useMemo(() => {
    if (!GATE_ENABLED) return true
    const critical = ['p3_defined', 'p3_toc', 'p3_scale']
    return !critical.some(id => inputs[id] === 'no')
  }, [inputs])

  // Prospective filter
  const prospectiveOk = useMemo(() =>
    inputs.p1_prospective == null || inputs.p1_prospective !== 'no',
  [inputs])

  // Live scoring — recomputes whenever any input changes
  const results = useMemo(() => assembleResults(inputs), [inputs])

  // Next steps — flagged items from registry
  const flaggedNextSteps = useMemo(() =>
    NEXT_STEPS.filter(item => {
      const val = inputs[item.id]
      return val != null && item.uncertainValues.includes(val)
    }),
  [inputs])

  // Top recommendation
  const topDesign = useMemo(() => {
    const eligible = results.filter(r => r.weightedTotal !== null)
    return eligible.length > 0 ? eligible[0] : null
  }, [results])

  return {
    inputs,
    set,
    setMany,
    gatePassed,
    prospectiveOk,
    results,
    flaggedNextSteps,
    topDesign,
  }
}
