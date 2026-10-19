// The one place the app asks what Test and Learn stage applies.
//
// The previous tool inferred the stage in three places that disagreed: the quantitative
// tree tagged seven of its results Grow-only, the Design Finder and the Causal Readiness
// page both said impact evaluation suits Test and Grow. All three now read this, which
// reads spec/stages.yaml via the engine.
//
// Resolution, per the Test and Learn annex: impact evaluation designs are available at
// BOTH Test and Grow. What differs is the estimand — a component or mechanism at Test, the
// whole programme at Grow — and the decision it informs. Identification requirements are
// identical, so no design is ever restricted to Grow.

import spec from '../spec/spec.generated.json'
import { evaluate } from './evaluate.js'

/** Stage definitions, with the gloss each label carries on first use. */
export const STAGES = Object.fromEntries(spec.stages.stages.map(s => [s.id, s]))

/** Display labels, in ladder order. */
export const STAGE_ORDER = spec.stages.stages.map(s => s.id)

/**
 * Infer the stage from answers. Returns { stages, note, citations }.
 * `stages` is empty while the readiness answers are outstanding — the tool says nothing
 * rather than guessing.
 */
export function inferStage(answers) {
  return evaluate(answers, spec).stage
}

/**
 * True if this set of stages would restrict a design to Grow. Nothing in the
 * specification may do this, and a test asserts it of both the spec and the tree data.
 */
export function isGrowOnly(stages) {
  return stages.includes('grow') && !stages.includes('test')
}

/** The published label for a stage id, falling back to the id itself. */
export function stageLabel(id) {
  return STAGES[id]?.label ?? id
}

/** The one-line gloss, so a label never requires prior familiarity to read. */
export function stageGloss(id) {
  return STAGES[id]?.gloss ?? ''
}
