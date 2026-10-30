// The engine. Pure: no React, no I/O, no clock, no randomness. Given answers and a parsed
// specification it returns everything the tools display.
//
// Nothing here scores. A design is in one of four states, and the ladder recommends the
// highest rung that is feasible — it does not weigh a strong design with poor data against
// a weak design with good data, which is what let the previous tool rank a DiD above an RCT.

import { evaluateLogic, unansweredIn, variablesIn, UNKNOWN } from './logic.js'

/** Worst-first. A design takes the worst state across all its checks. */
export const STATES = ['blocked', 'conditional', 'unknown', 'feasible']

const severity = state => STATES.indexOf(state)
const worst = (a, b) => (severity(a) <= severity(b) ? a : b)

/** Shape a check for output, dropping spec-internal fields. */
function present(check, extra = {}) {
  return {
    id: check.id,
    message: check.message,
    ...(check.unlock ? { unlock: check.unlock } : {}),
    ...(check.rob_domain ? { robDomain: check.rob_domain } : {}),
    ...(check.threshold ? { threshold: check.threshold } : {}),
    citations: check.citations ?? [],
    ...extra,
  }
}

/** Readiness gates and warnings. Gates fire before any design is considered. */
function assessReadiness(answers, stagesSpec) {
  const fired = { gates: [], warnings: [], unknown: [] }

  for (const item of stagesSpec.readiness ?? []) {
    const result = evaluateLogic(item.fires_when, answers)
    const entry = {
      id: item.id,
      question: item.question,
      message: item.message,
      redirect: item.redirect,
      citations: item.citations ?? [],
    }
    if (result === UNKNOWN) fired.unknown.push(entry)
    else if (result === true) (item.severity === 'gate' ? fired.gates : fired.warnings).push(entry)
  }

  // Tri-state deliberately. "No gate has fired" is not the same as "readiness is
  // established" when nothing has been answered — a boolean would show a blank form as
  // having passed.
  const status = fired.gates.length ? 'failed' : fired.unknown.length ? 'undetermined' : 'passed'
  return { ...fired, status, passed: status === 'passed' }
}

/** First matching inference rule wins; order in the file is load-bearing. */
function inferStage(answers, stagesSpec) {
  for (const [index, rule] of (stagesSpec.inference ?? []).entries()) {
    if (evaluateLogic(rule.when, answers) === true) {
      return {
        stages: rule.stages,
        note: rule.note,
        citations: rule.citations ?? [],
        ruleIndex: index,
      }
    }
  }
  return { stages: [], note: null, citations: [], ruleIndex: null }
}

/** Evaluate one design's checks and resolve its state. */
function assessDesign(design, designRules, answers) {
  const blockers = []
  const conditions = []
  const warnings = []
  const unknownQuestions = new Set()
  let state = 'feasible'

  const run = (checks, group) => {
    for (const check of checks ?? []) {
      const result = evaluateLogic(check.test, answers)

      if (result === UNKNOWN) {
        // Warnings never affect the state, so an unanswered warning is not an unknown
        // the user needs to resolve.
        if (group !== 'warnings') {
          unansweredIn(check.test, answers).forEach(q => unknownQuestions.add(q))
          state = worst(state, 'unknown')
        }
        continue
      }
      if (result !== true) continue

      if (group === 'blockers') { blockers.push(present(check)); state = worst(state, 'blocked') }
      else if (group === 'conditions') { conditions.push(present(check)); state = worst(state, 'conditional') }
      else warnings.push(present(check))
    }
  }

  run(designRules?.blockers, 'blockers')
  run(designRules?.conditions, 'conditions')
  run(designRules?.warnings, 'warnings')

  return {
    id: design.id,
    name: design.name,
    family: design.family,
    strand: design.strand,
    ...(design.tier !== undefined ? { tier: design.tier } : {}),
    ...(design.tier_qualifier ? { tierQualifier: design.tier_qualifier } : {}),
    estimand: design.estimand,
    estimatorOptions: design.estimator_options ?? [],
    state,
    blockers,
    conditions,
    warnings,
    unknowns: [...unknownQuestions].sort(),
  }
}

/**
 * The theory-based strand runs beside the ladder and is never converted into a rung.
 *
 *   primary        every counterfactual design is blocked — there is no comparison to make
 *   complementary  a counterfactual design is available; theory-based work addresses
 *                  mechanism, implementation and context instead
 *   undetermined   too little is answered to say
 *
 * `candidate` flags the case where a rung is technically available but only the weakest
 * one, so theory-based work may serve the decision better than a thin counterfactual.
 */
function theoryBasedRole(counterfactual, bestAvailableTier) {
  const reasons = []
  const assessed = counterfactual.filter(d => d.state !== 'unknown')

  if (assessed.length === 0) {
    reasons.push('Not enough has been answered to tell whether a counterfactual design is available.')
    return { role: 'undetermined', candidate: false, reasons }
  }

  if (counterfactual.every(d => d.state === 'blocked')) {
    reasons.push('Every counterfactual design is blocked, so no comparison group or credible counterfactual is available.')
    return { role: 'primary', candidate: true, reasons }
  }

  const candidate = bestAvailableTier === 5
  if (candidate) {
    reasons.push('The only available rung is Tier 5, which rests entirely on the pre-intervention trend continuing. Theory-based work may support the decision better than a thin counterfactual.')
  }
  reasons.push('A counterfactual design is available, so theory-based work addresses mechanism, implementation and context rather than the effect estimate.')
  return { role: 'complementary', candidate, reasons }
}

/**
 * Ordered list of what to answer next. A question earns a place only if answering it
 * could change a verdict — it is read by a design currently Unknown, or by a readiness
 * gate that has not resolved.
 */
function buildAgenda(answers, questions, designs, readiness) {
  const unanswered = q => {
    const v = answers?.[q.id]
    return v === undefined || v === null || v === ''
  }

  const askable = q => {
    if (!q.applies_when) return true
    // A gating condition that is itself unresolved means the question is not yet askable.
    return evaluateLogic(q.applies_when, answers) === true
  }

  const affectsByQuestion = new Map()
  for (const design of designs) {
    if (design.state !== 'unknown') continue
    for (const q of design.unknowns) {
      if (!affectsByQuestion.has(q)) affectsByQuestion.set(q, [])
      affectsByQuestion.get(q).push(design)
    }
  }

  const readinessUnresolved = new Set((readiness.unknown ?? []).map(r => r.question))

  const items = []
  for (const q of questions) {
    if (!unanswered(q) || !askable(q)) continue

    const affected = affectsByQuestion.get(q.id) ?? []
    const gates = readinessUnresolved.has(q.id)
    if (!affected.length && !gates) continue

    const tiers = affected.map(d => d.tier).filter(t => t !== undefined)
    items.push({
      id: q.id,
      text: q.text,
      hint: q.hint,
      intake: Boolean(q.intake),
      gatesReadiness: gates,
      bestTierAffected: tiers.length ? Math.min(...tiers) : null,
      affects: affected.map(d => d.id),
    })
  }

  // Readiness first — a gate decides whether any of this applies. Then by the best rung
  // the answer could unlock, then by how many designs it resolves.
  return items.sort((a, b) => {
    if (a.gatesReadiness !== b.gatesReadiness) return a.gatesReadiness ? -1 : 1
    if (a.intake !== b.intake) return a.intake ? -1 : 1
    const at = a.bestTierAffected ?? 99
    const bt = b.bestTierAffected ?? 99
    if (at !== bt) return at - bt
    return b.affects.length - a.affects.length
  })
}

/** Routes whose condition holds (or which are unconditional). */
function activeRoutes(answers, stagesSpec) {
  return (stagesSpec.routing ?? [])
    .filter(route => !route.when || evaluateLogic(route.when, answers) === true)
    .map(route => ({ from: route.from, to: route.to, note: route.note, citations: route.citations ?? [] }))
}

/**
 * Advisory guidance keyed to an answer — where to spend effort, given a stated practical
 * constraint.
 *
 * Returned alongside the verdicts and never consulted in reaching one. A deadline or a
 * budget must not make a weaker design more valid, which is the compensatory trade-off the
 * ladder replaced; keeping this in its own function, called after everything else is
 * decided, is what makes that structural rather than a matter of care.
 */
function activeGuidance(answers, stagesSpec) {
  return (stagesSpec.guidance ?? [])
    .filter(entry => {
      const value = answers?.[entry.question]
      return value !== undefined && value !== null && value !== '' && String(value) === String(entry.when)
    })
    .map(entry => ({ question: entry.question, note: entry.note, citations: entry.citations ?? [] }))
}

/**
 * @param {object} answers  flat map of question id -> answer value
 * @param {object} spec     { tiers, designs, questions, rules, stages }
 */
/**
 * The statistics module. Returns the question set for the chosen approach, the tensions
 * the answers raise, and the quantity that plays the role of N for the designs still in
 * play.
 *
 * Tensions are raised as questions to take to a statistician, never as verdicts, and never
 * from an unanswered input — an UNKNOWN condition leaves the tension unraised rather than
 * raised in error.
 *
 * The ready-reckoner is deliberately NOT read here. It is declared in the specification so
 * the UI can render it, and the engine ignores it entirely so an illustrative figure can
 * never reach a verdict.
 */
function assessStatistics(answers, statisticsSpec, designsInPlay) {
  if (!statisticsSpec) return null

  const approachAnswer = answers?.analysis_approach
  const selected = approachAnswer === 'both'
    ? ['nhst', 'bayesian']
    : approachAnswer === 'nhst' || approachAnswer === 'bayesian'
      ? [approachAnswer]
      : []

  const askable = qid => {
    const q = statisticsSpec._questionsById?.get(qid)
    if (!q?.applies_when) return true
    return evaluateLogic(q.applies_when, answers) === true
  }

  const branches = selected.map(name => {
    const approach = statisticsSpec.approaches[name]
    const tensions = (approach.tensions ?? [])
      .filter(t => evaluateLogic(t.when, answers) === true)
      .map(t => ({ id: t.id, message: t.message, prompt: t.prompt, citations: t.citations ?? [] }))

    const questions = (approach.questions ?? []).filter(askable)
    const unanswered = questions.filter(qid => {
      const v = answers?.[qid]
      return v === undefined || v === null || v === ''
    })

    return {
      approach: name,
      label: approach.label,
      sampleRole: approach.sample_role,
      questions,
      unanswered,
      tensions,
    }
  })

  const quantities = (statisticsSpec.design_quantities ?? [])
    .filter(q => !designsInPlay || designsInPlay.has(q.design))
    .map(q => ({ design: q.design, quantity: q.quantity, note: q.note }))

  return {
    approach: approachAnswer ?? null,
    sharedQuestions: statisticsSpec.shared_questions ?? [],
    branches,
    // Shown only while the approach is undecided; it contrasts what each asks of the
    // design rather than arguing for either.
    comparison: selected.length ? [] : (statisticsSpec.undecided_comparison ?? []),
    designQuantities: quantities,
  }
}

/**
 * The screening set: the short run of questions that rules most designs in or out.
 *
 * **Derived, never listed.** A hand-kept list drifts — a question added later that rules
 * out four designs would sit outside the screen and nobody would notice. The rule is:
 *
 *   - every intake question, which is asked of everyone anyway; plus
 *   - every question that can be settled before the data exist (`ex_ante`), is asked
 *     unconditionally (no `applies_when`), and appears in **two or more blockers**.
 *
 * The threshold picks out the structural facts — whether allocation can be randomised,
 * whether a comparison group exists, how much pre-period data there is — and leaves the
 * design-specific detail for later. A question gated behind another is excluded because it
 * may not even be askable yet.
 */
export function screeningSet(spec) {
  const blockerCount = new Map()
  for (const design of Object.values(spec.rules?.designs ?? {})) {
    for (const blocker of design.blockers ?? []) {
      for (const v of variablesIn(blocker.test)) {
        blockerCount.set(v, (blockerCount.get(v) ?? 0) + 1)
      }
    }
  }

  return spec.questions
    .filter(q => q.intake || (
      q.establishable === 'ex_ante' && !q.applies_when && (blockerCount.get(q.id) ?? 0) >= 2
    ))
    .map(q => q.id)
}

/**
 * How far through the screen the user is, and what it already concludes.
 *
 * The screen is a stopping point, not a separate assessment: the same answers carry on
 * into the rest of the ladder. What it reports is deliberately not a recommendation —
 * early on there usually is not one. It reports what has been **settled**: which designs
 * are out, which are still live, and the highest rung still available.
 */
function assessScreening(answers, spec, assessed) {
  const questions = screeningSet(spec)
  const answered = questions.filter(id => {
    const v = answers?.[id]
    return v !== undefined && v !== null && v !== ''
  })
  const outstanding = questions.filter(id => !answered.includes(id))

  const counterfactual = assessed.filter(d => d.strand === 'counterfactual')
  const ruledOut = counterfactual.filter(d => d.state === 'blocked').map(d => d.id)
  const live = counterfactual.filter(d => d.state !== 'blocked')
  const tiers = live.map(d => d.tier).filter(t => t !== undefined)

  return {
    questions,
    answered,
    outstanding,
    complete: outstanding.length === 0,
    ruledOut,
    live: live.map(d => d.id),
    liveTiers: [...new Set(tiers)].sort((a, b) => a - b),
    highestLiveTier: tiers.length ? Math.min(...tiers) : null,
  }
}

export function evaluate(answers = {}, spec) {
  const { tiers: tiersSpec, designs: designRegister, questions, rules, stages: stagesSpec,
    statistics: statisticsSpec } = spec

  const readiness = assessReadiness(answers, stagesSpec)
  const stage = inferStage(answers, stagesSpec)

  const assessed = designRegister.map(d => assessDesign(d, rules.designs?.[d.id], answers))
  const byId = Object.fromEntries(assessed.map(d => [d.id, d]))

  const counterfactual = assessed.filter(d => d.strand === 'counterfactual')
  const theoryBased = assessed.filter(d => d.strand === 'theory_based')

  // Tier 1 is the highest rung, so the best tier is the lowest number.
  const tierOf = state => {
    const tiers = counterfactual.filter(d => d.state === state).map(d => d.tier)
    return tiers.length ? Math.min(...tiers) : null
  }
  const highestFeasibleTier = tierOf('feasible')
  const highestConditionalTier = tierOf('conditional')

  const bestAvailable = [highestFeasibleTier, highestConditionalTier]
    .filter(t => t !== null)
  const bestAvailableTier = bestAvailable.length ? Math.min(...bestAvailable) : null

  // The next rung up: the highest conditional design above the highest feasible one, and
  // what would unlock it. This is the "if you could also do X" line.
  let nextRungUp = null
  if (highestConditionalTier !== null && (highestFeasibleTier === null || highestConditionalTier < highestFeasibleTier)) {
    const candidates = counterfactual
      .filter(d => d.state === 'conditional' && d.tier === highestConditionalTier)
    const pick = candidates[0]
    if (pick) {
      nextRungUp = {
        tier: pick.tier,
        design: pick.id,
        name: pick.name,
        unlocks: pick.conditions.filter(c => c.unlock).map(c => ({ condition: c.id, unlock: c.unlock })),
      }
    }
  }

  const ladder = (tiersSpec.tiers ?? []).map(tier => ({
    tier: tier.id,
    name: tier.name,
    identifyingAssumption: tier.identifying_assumption,
    evidenceScales: tier.evidence_scales ?? {},
    designs: counterfactual.filter(d => d.tier === tier.id),
  }))

  // A fired gate means impact evaluation cannot answer the question yet, whatever the
  // data situation — so no rung is recommended even where one evaluates feasible.
  const recommendation = readiness.status === 'failed'
    ? null
    : highestFeasibleTier !== null
      ? {
          tier: highestFeasibleTier,
          designs: counterfactual
            .filter(d => d.state === 'feasible' && d.tier === highestFeasibleTier)
            .map(d => d.id),
        }
      : null

  return {
    specVersion: tiersSpec.spec_version,
    readiness,
    stage,
    designs: byId,
    ladder,
    theoryBasedDesigns: theoryBased.map(d => d.id),
    highestFeasibleTier,
    highestConditionalTier,
    recommendation,
    nextRungUp,
    theoryBased: theoryBasedRole(counterfactual, bestAvailableTier),
    statistics: assessStatistics(
      answers,
      statisticsSpec && { ...statisticsSpec, _questionsById: new Map(questions.map(q => [q.id, q])) },
      new Set(counterfactual.filter(d => d.state === 'feasible' || d.state === 'conditional').map(d => d.id)),
    ),
    agenda: buildAgenda(answers, questions, assessed, readiness),
    routes: activeRoutes(answers, stagesSpec),
    guidance: activeGuidance(answers, stagesSpec),
    screening: assessScreening(answers, spec, assessed),
  }
}
