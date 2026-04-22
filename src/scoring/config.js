// ============================================================
// Scoring Configuration
// Edit these values to adjust app behaviour.
// No other files need changing for routine configuration.
// ============================================================

// Set to false to allow free navigation regardless of gate (reviewer mode)
export const GATE_ENABLED = true

// Scoring weights — must sum to 1
export const WEIGHTS = { data: 0.5, causalValidity: 0.5 }

// Feasibility classification thresholds (weighted total score)
export const THRESH_HIGH   = 0.60
export const THRESH_MEDIUM = 0.35

// Sample size reference: n at which RCT data score reaches 1.0
export const SAMPLE_REFERENCE = 500

// ============================================================
// Design Category Validity Ceilings
// ============================================================
// These encode the methodological hierarchy of evaluation designs,
// analogous to the Maryland Scientific Methods Scale.
// Each value is the maximum causal validity score a design in that
// category can achieve, regardless of feasibility question answers.
//
// Category definitions:
//   A   Randomised designs (RCT and variants)                         Maryland 5
//   B   QE — exogenous variation WITH a control group                 Maryland 4
//   C   QE — exogenous variation, NO control group                    Maryland 3
//   D   QE — modelling assumptions, no exogenous variation            Maryland 2
//   Dp  D-plus override for synthetic control variants only
//   E   Theory-based / non-counterfactual                             Maryland 1
// ============================================================
export const CATEGORY_CEILINGS = {
  A:  1.00,
  B:  0.82,
  C:  0.64,
  D:  0.44,
  Dp: 0.54,  // Synthetic control / augmented synthetic control only
  E:  0.24,
}

// Standard answer-to-score lookup maps (reused across scoring functions)
export const SCORE_YES_PARTIAL_NO = { yes: 1.0, partial: 0.7, no: 0.0 }
export const SCORE_YES_MAYBE_NO   = { yes: 1.0, maybe:   0.5, no: 0.0 }
