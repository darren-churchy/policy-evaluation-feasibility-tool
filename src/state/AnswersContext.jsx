// The single answer store.
//
// Every tool reads and writes this one object, so a question answered in the Design Finder
// is already answered when the user reaches the full assessment. The previous tool kept
// separate state per tool under different ids — `q_defined` in the Finder, `p3_defined` in
// the assessment — which is why the two could reach different conclusions from the same
// facts.
//
// Answers are keyed by question id from spec/questions.yaml. There is no second vocabulary.

import { createContext, useContext, useState, useMemo, useCallback } from 'react'
import { evaluate } from '../engine/evaluate.js'
import spec from '../spec/spec.generated.json'

const AnswersContext = createContext(null)

/** The shape written to disk by save, and expected by load. */
export const SAVE_FORMAT = 'impact-evaluation-feasibility/answers'

export function AnswersProvider({ children, initialAnswers = {}, initialNotes = {} }) {
  const [answers, setAnswers] = useState(initialAnswers)

  // Notes are held in their own object, never merged into answers. The engine is passed
  // `answers` and nothing else, so a guide field cannot reach a verdict however it is
  // worded — and the spec validator refuses a guide field that shares an id with a
  // question, so the two vocabularies cannot collide even if some future code did merge
  // them.
  const [notes, setNotes] = useState(initialNotes)

  const set = useCallback((id, value) => {
    setAnswers(prev => {
      // Clearing an answer removes the key, so the engine sees it as unanswered rather
      // than as an empty string that happens to match nothing.
      if (value === undefined || value === null || value === '') {
        if (!(id in prev)) return prev
        const next = { ...prev }
        delete next[id]
        return next
      }
      if (prev[id] === value) return prev
      return { ...prev, [id]: value }
    })
  }, [])

  const setNote = useCallback((id, value) => {
    setNotes(prev => {
      const empty = value === undefined || value === null || value === ''
        || (Array.isArray(value) && value.length === 0)
      if (empty) {
        if (!(id in prev)) return prev
        const next = { ...prev }
        delete next[id]
        return next
      }
      if (prev[id] === value) return prev
      return { ...prev, [id]: value }
    })
  }, [])

  const clear = useCallback(() => { setAnswers({}); setNotes({}) }, [])

  const replace = useCallback((next, nextNotes) => {
    setAnswers(next ?? {})
    if (nextNotes !== undefined) setNotes(nextNotes ?? {})
  }, [])

  // Recomputed on every answer change. The engine is pure and the spec is static, so this
  // is the only derived state in the app.
  const result = useMemo(() => evaluate(answers, spec), [answers])

  const value = useMemo(
    () => ({ answers, set, notes, setNote, clear, replace, result, spec }),
    [answers, set, notes, setNote, clear, replace, result],
  )

  return <AnswersContext.Provider value={value}>{children}</AnswersContext.Provider>
}

export function useAnswers() {
  const context = useContext(AnswersContext)
  if (!context) throw new Error('useAnswers must be used inside an AnswersProvider')
  return context
}

/** One question's current value and setter, by id. */
export function useAnswer(id) {
  const { answers, set } = useAnswers()
  return [answers[id], value => set(id, value)]
}

// ── Save and load ────────────────────────────────────────────────────────────
//
// A downloaded JSON file, not browser storage. Nothing is written to the device unless the
// user asks for it, which is what the privacy notice promises.

export function buildSaveFile(answers, specVersion, notes = {}) {
  return {
    format: SAVE_FORMAT,
    specVersion,
    savedAt: new Date().toISOString(),
    answers,
    // Separate from answers in the file as well as in memory, so a load cannot turn a
    // note into an answer and the distinction survives a round trip.
    notes,
  }
}

/**
 * Parse a loaded file. Returns { answers, warnings } — a spec version mismatch is a
 * warning rather than a refusal, because the answers are usually still usable and
 * refusing would lose the user's work.
 */
export function parseSaveFile(raw, currentSpecVersion, questionIds) {
  const warnings = []
  let parsed
  try {
    parsed = typeof raw === 'string' ? JSON.parse(raw) : raw
  } catch {
    return { answers: null, warnings: ['That file could not be read as JSON.'] }
  }

  if (!parsed || typeof parsed !== 'object' || parsed.format !== SAVE_FORMAT) {
    return { answers: null, warnings: ['That file was not saved by this tool.'] }
  }

  if (parsed.specVersion && parsed.specVersion !== currentSpecVersion) {
    warnings.push(
      `Saved against specification version ${parsed.specVersion}; this tool uses ` +
      `${currentSpecVersion}. Rules may have changed since, so check the verdicts rather ` +
      `than assuming they carry over.`,
    )
  }

  const answers = {}
  const unrecognised = []
  for (const [id, value] of Object.entries(parsed.answers ?? {})) {
    if (questionIds.has(id)) answers[id] = value
    else unrecognised.push(id)
  }

  if (unrecognised.length) {
    warnings.push(
      `${unrecognised.length} saved answer${unrecognised.length === 1 ? '' : 's'} ` +
      `no longer correspond to a question and ${unrecognised.length === 1 ? 'was' : 'were'} ` +
      `dropped: ${unrecognised.join(', ')}.`,
    )
  }

  // Notes are carried through as written. They reach no rule, so there is nothing to
  // validate them against — an unrecognised note is kept rather than dropped, because the
  // user's reasoning is worth more than tidiness and nothing downstream can act on it.
  const notes = (parsed.notes && typeof parsed.notes === 'object' && !Array.isArray(parsed.notes))
    ? parsed.notes
    : {}

  return { answers, notes, warnings }
}
