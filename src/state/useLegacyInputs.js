// The old vocabularies, backed by the shared answer store.
//
// Used by the seven sections and by the Design Finder, so the routing lives in one place
// and the two cannot drift. Retired with the components that need it.

import { useState, useCallback, useMemo } from 'react'
import { useAnswers } from './AnswersContext.jsx'
import { buildBridge, routeWrite, toLegacyInputs, SHARED, NOTE } from './legacyBridge.js'

export function useLegacyInputs() {
  const { answers, set: setAnswer, notes, setNote, spec } = useAnswers()
  const bridge = useMemo(() => buildBridge(spec.migration), [spec.migration])

  // Only ids with no home in the shared store or the notes annex: the ones dropped with
  // the scoring, and the design screens whose bundled yes/no cannot be carried.
  const [local, setLocal] = useState({})

  const inputs = useMemo(
    () => toLegacyInputs(bridge, answers, notes, local),
    [bridge, answers, notes, local],
  )

  const set = useCallback((id, value) => {
    const routed = routeWrite(bridge, id, value)
    if (routed.kind === SHARED) setAnswer(routed.id, routed.value)
    else if (routed.kind === NOTE) setNote(routed.id, routed.value)
    else setLocal(prev => ({ ...prev, [routed.id]: routed.value }))
  }, [bridge, setAnswer, setNote])

  const setMany = useCallback(updates => {
    for (const [id, value] of Object.entries(updates)) set(id, value)
  }, [set])

  return { inputs, set, setMany, bridge }
}
