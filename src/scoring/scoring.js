// ============================================================
// Scoring Engine — direct port of R/scoring.R
// Pure functions only — no React, no side effects.
// All inputs are plain values resolved before calling.
// ============================================================

import {
  WEIGHTS, CATEGORY_CEILINGS, THRESH_HIGH, THRESH_MEDIUM,
  SAMPLE_REFERENCE, SCORE_YES_PARTIAL_NO, SCORE_YES_MAYBE_NO,
} from './config.js'
import { DESIGNS } from '../data/designs.js'

// ── Utility ──────────────────────────────────────────────────────────────────

// Map an answer value to a 0-1 score via a lookup object; returns `def` if unrecognised
export const mapScore = (val, lookup, def = 0.5) => {
  if (val == null || val === '') return def
  return lookup[val] ?? def
}

const mean = (...args) => args.reduce((a, b) => a + b, 0) / args.length
const clamp = (v, lo = 0, hi = 1) => Math.min(hi, Math.max(lo, v))

// ── Global sub-scores ─────────────────────────────────────────────────────────

export const assumptionScore = (exchangeability, positivity, consistency) => mean(
  mapScore(exchangeability, SCORE_YES_PARTIAL_NO, 0.5),
  mapScore(positivity,      SCORE_YES_PARTIAL_NO, 0.5),
  mapScore(consistency,     SCORE_YES_PARTIAL_NO, 0.5),
)

export const sampleScoreFn = (n) => {
  const num = parseFloat(n)
  if (!num || num <= 0) return 0.5
  return Math.min(1.0, num / SAMPLE_REFERENCE)
}

export const preperiodScoreFn = (predata, preTp) => {
  if (!predata || predata === 'no') return 0.0
  const tp = parseFloat(preTp)
  if (isNaN(tp)) return 0.3
  if (tp >= 12) return 1.0
  if (tp >= 8)  return 0.8
  if (tp >= 4)  return 0.55
  if (tp >= 2)  return 0.35
  return 0.15
}

export const powerScoreFn = (powerDone) =>
  mapScore(powerDone, { yes: 1.0, maybe: 0.6, no: 0.3 }, 0.5)

// ── Per-design causal scores ──────────────────────────────────────────────────

export const scoreRctIndividual = (rctIndFeasible, bEthics, bLogistics, assum) => {
  const f = mapScore(rctIndFeasible, SCORE_YES_MAYBE_NO, 0.5)
  const e = mapScore(bEthics,    { yes: 0.3, partial: 0.7, no: 1.0 }, 0.7)
  const l = mapScore(bLogistics, { yes: 0.3, partial: 0.7, no: 1.0 }, 0.7)
  return mean(f, e, l) * assum
}

export const scoreRctCluster = (rctClusterN, rctClusterContam, bLogistics, assum) => {
  const n = mapScore(rctClusterN,      { yes: 1.0, maybe: 0.6, no: 0.1 }, 0.5)
  const c = mapScore(rctClusterContam, { low: 1.0, moderate: 0.6, high: 0.2 }, 0.6)
  const l = mapScore(bLogistics,       { yes: 0.5, partial: 0.8, no: 1.0 }, 0.8)
  return mean(n, c, l) * assum
}

export const scoreRctStepped = (rollout, time, assum) =>
  mean(mapScore(rollout, SCORE_YES_MAYBE_NO, 0.5), mapScore(time, SCORE_YES_MAYBE_NO, 0.5)) * assum

export const scoreRctCrossover = (washout, chronic, assum) =>
  mean(mapScore(washout, SCORE_YES_MAYBE_NO, 0.3), mapScore(chronic, SCORE_YES_MAYBE_NO, 0.5)) * assum

export const scoreRctWaitlist = (delay, demand, assum) =>
  mean(mapScore(delay, SCORE_YES_MAYBE_NO, 0.5), mapScore(demand, SCORE_YES_MAYBE_NO, 0.5)) * assum

export const scoreRctEncouragement = (variation, instrument, assum) =>
  mean(mapScore(variation, SCORE_YES_MAYBE_NO, 0.5), mapScore(instrument, SCORE_YES_MAYBE_NO, 0.5)) * assum

export const scoreDidStandard = (screenDid, didParallel, didPredata, assum) => {
  if (screenDid === 'no') return 0.05
  return mean(
    mapScore(didParallel, SCORE_YES_MAYBE_NO, 0.4),
    mapScore(didPredata, { '3plus': 1.0, two: 0.7, one: 0.35, none: 0.0 }, 0.4),
  ) * assum
}

export const scoreDidStagger = (screenDid, didStagger, didParallel, assum) => {
  if (screenDid === 'no') return 0.05
  return mean(mapScore(didStagger, SCORE_YES_MAYBE_NO, 0.4), mapScore(didParallel, SCORE_YES_MAYBE_NO, 0.4)) * assum
}

export const scoreDidCs = (screenDid, didStagger, didHet, assum) => {
  if (screenDid === 'no') return 0.05
  return mean(mapScore(didStagger, SCORE_YES_MAYBE_NO, 0.4), mapScore(didHet, SCORE_YES_MAYBE_NO, 0.5)) * assum
}

export const scoreSynth = (screenDid, scDonor, scPrefit, preS, assum) => {
  if (screenDid === 'no') return 0.05
  return mean(mapScore(scDonor, SCORE_YES_MAYBE_NO, 0.4), mapScore(scPrefit, SCORE_YES_MAYBE_NO, 0.4), preS) * assum
}

export const scoreRdSharp = (screenRd, cutoff, manip, assum) => {
  if (screenRd === 'no') return 0.05
  return mean(
    mapScore(cutoff, SCORE_YES_MAYBE_NO, 0.5),
    mapScore(manip, { no: 1.0, maybe: 0.5, yes: 0.0 }, 0.5),
  ) * assum
}

export const scoreRdFuzzy = (screenRd, jump, assum) => {
  if (screenRd === 'no') return 0.05
  return mapScore(jump, SCORE_YES_MAYBE_NO, 0.4) * assum
}

export const scoreRdit = (screenRd, date, confound, assum) => {
  if (screenRd === 'no') return 0.05
  return mean(mapScore(date, SCORE_YES_MAYBE_NO, 0.5), mapScore(confound, SCORE_YES_MAYBE_NO, 0.5)) * assum
}

export const scoreIv2sls = (screenIv, relevance, exclusion, assum) => {
  if (screenIv === 'no') return 0.05
  return mean(mapScore(relevance, SCORE_YES_MAYBE_NO, 0.4), mapScore(exclusion, SCORE_YES_MAYBE_NO, 0.4)) * assum
}

export const scoreIvFrd = (screenIv, screenRd, jump, exclusion, assum) => {
  if (screenIv === 'no' || screenRd === 'no') return 0.05
  return mean(mapScore(jump, SCORE_YES_MAYBE_NO, 0.4), mapScore(exclusion, SCORE_YES_MAYBE_NO, 0.4)) * assum
}

export const scoreItsStandard = (screenIts, pre, post, autocorr, assum) => {
  if (screenIts === 'no') return 0.05
  const TP = { '12plus': 1.0, '8to11': 0.75, under8: 0.3 }
  const PP = { '12plus': 1.0, '6to11': 0.75, under6: 0.3 }
  return mean(mapScore(pre, TP, 0.4), mapScore(post, PP, 0.4), mapScore(autocorr, SCORE_YES_MAYBE_NO, 0.5)) * assum
}

export const scoreItsControlled = (screenIts, ctrl, pre, assum) => {
  if (screenIts === 'no') return 0.05
  const TP = { '12plus': 1.0, '8to11': 0.75, under8: 0.3 }
  return mean(mapScore(ctrl, SCORE_YES_MAYBE_NO, 0.4), mapScore(pre, TP, 0.4)) * assum
}

export const scoreItsSegmented = (screenIts, smooth, pre, assum) => {
  if (screenIts === 'no') return 0.05
  const TP = { '12plus': 1.0, '8to11': 0.75, under8: 0.3 }
  return mean(mapScore(smooth, SCORE_YES_MAYBE_NO, 0.5), mapScore(pre, TP, 0.4)) * assum
}

export const scorePsm = (screenMatch, overlap, assum) => {
  if (screenMatch === 'no') return 0.05
  return mapScore(overlap, SCORE_YES_MAYBE_NO, 0.4) * assum
}

export const scoreMahalanobis = (screenMatch, covs, assum) => {
  if (screenMatch === 'no') return 0.05
  return mapScore(covs, { low: 1.0, medium: 0.7, high: 0.4 }, 0.6) * assum
}

export const scoreCem = (screenMatch, sample, assum) => {
  if (screenMatch === 'no') return 0.05
  return mapScore(sample, SCORE_YES_MAYBE_NO, 0.5) * assum
}

export const scoreIpw = (screenMatch, extreme, assum) => {
  if (screenMatch === 'no') return 0.05
  return mapScore(extreme, { no: 1.0, maybe: 0.55, yes: 0.2 }, 0.5) * assum
}

export const scoreOverlapWeights = (screenMatch, target, positivity, assum) => {
  if (screenMatch === 'no') return 0.05
  const t = mapScore(target, SCORE_YES_MAYBE_NO, 0.5)
  const bonus = positivity !== 'yes' ? 0.1 : 0.0
  return Math.min(1.0, (t * assum) + bonus)
}

export const scoreGcomp = (screenMatch, model, assum) => {
  if (screenMatch === 'no') return 0.05
  return mapScore(model, SCORE_YES_MAYBE_NO, 0.5) * assum
}

export const scoreMsm = (screenGmethod, tp, assum) => {
  if (screenGmethod === 'no') return 0.05
  return mapScore(tp, { '5plus': 1.0, '3to4': 0.6, under3: 0.2 }, 0.4) * assum
}

export const scoreGestimation = (screenGmethod, snm, assum) => {
  if (screenGmethod === 'no') return 0.05
  return mapScore(snm, SCORE_YES_MAYBE_NO, 0.4) * assum
}

export const scoreGcompTv = (screenGmethod, regime, assum) => {
  if (screenGmethod === 'no') return 0.05
  return mapScore(regime, SCORE_YES_MAYBE_NO, 0.4) * assum
}

// Theory-based — parallel criteria (no causal assumption modifier)
export const scoreContribution = (p3Toc, p3Defined) =>
  mean(mapScore(p3Toc, SCORE_YES_PARTIAL_NO, 0.5), mapScore(p3Defined, SCORE_YES_PARTIAL_NO, 0.5))

export const scoreRealist = (p3Consistent, p3Toc) =>
  mean(mapScore(p3Consistent, SCORE_YES_PARTIAL_NO, 0.5), mapScore(p3Toc, SCORE_YES_PARTIAL_NO, 0.5))

export const scoreProcess = (p3Defined) =>
  mapScore(p3Defined, SCORE_YES_PARTIAL_NO, 0.6)

// ── Per-family data scores ────────────────────────────────────────────────────

const dLinkage = (l) => mapScore(l, { yes: 1.0, maybe: 0.6, no: 0.1 }, 0.5)
const dMissing = (m) => mapScore(m, { low: 1.0, moderate: 0.65, high: 0.2, unknown: 0.4 }, 0.5)

export const dscrRct       = (n, powerDone, p6Missing) =>
  mean(sampleScoreFn(n), powerScoreFn(powerDone), dMissing(p6Missing))

export const dscrDid       = (predata, preTp, p6Linkage, p6Missing) =>
  mean(preperiodScoreFn(predata, preTp), dLinkage(p6Linkage), dMissing(p6Missing))

export const dscrRd        = (p6Linkage, p6Missing) =>
  mean(dLinkage(p6Linkage), dMissing(p6Missing))

export const dscrIv        = dscrRd

export const dscrIts       = (predata, preTp, p6Missing) =>
  mean(preperiodScoreFn(predata, preTp), dMissing(p6Missing))

export const dscrMatching  = (screenMatch, p6Linkage, p6Missing) =>
  mean(mapScore(screenMatch, { yes: 1.0, maybe: 0.6, no: 0.2 }, 0.4), dLinkage(p6Linkage), dMissing(p6Missing))

export const dscrGmethod   = (predata, preTp, screenMatch, p6Linkage) =>
  mean(preperiodScoreFn(predata, preTp), mapScore(screenMatch, { yes: 1.0, maybe: 0.6, no: 0.2 }, 0.4), dLinkage(p6Linkage))

export const dscrTheory    = (p6Missing) =>
  Math.min(1.0, dMissing(p6Missing) + 0.2)

// ── Blocker logic ─────────────────────────────────────────────────────────────

export const getBlockers = (i) => {
  const prospNo      = i.p1_prospective === 'no'
  const didBlocked   = i.screen_did     === 'no'
  const rdBlocked    = i.screen_rd      === 'no'
  const ivBlocked    = i.screen_iv      === 'no'
  const itsBlocked   = i.screen_its     === 'no'
  const matchBlocked = i.screen_match   === 'no'
  const gmBlocked    = i.screen_gmethod === 'no'
  const predataNone  = i.p7_predata     === 'no'
  const linkBlocked  = i.p6_linkage     === 'no'

  const B = (cond, msg) => cond ? msg : 'None'

  return {
    ind_rct:      B(prospNo, 'Prospective evaluation not possible'),
    cluster_rct:  prospNo ? 'Prospective evaluation not possible' : B(i.rct_cluster_n === 'no', 'Insufficient clusters'),
    stepped_rct:  prospNo ? 'Prospective evaluation not possible' : B(i.rct_sw_rollout === 'no', 'Simultaneous rollout — stepped-wedge not applicable'),
    crossover_rct:prospNo ? 'Prospective evaluation not possible' : B(i.rct_cross_washout === 'no', 'Carryover effects prevent washout period'),
    waitlist_rct: B(prospNo, 'Prospective evaluation not possible'),
    enc_design:   B(prospNo, 'Prospective evaluation not possible'),
    psm:          matchBlocked ? 'No rich covariate data available' : B(linkBlocked, 'Data linkage not possible'),
    mahal:        B(matchBlocked, 'No rich covariate data available'),
    cem:          B(matchBlocked, 'No rich covariate data available'),
    ipw:          matchBlocked ? 'No rich covariate data available' : B(i.p3_positivity === 'no', 'Positivity violation — IPW unreliable'),
    ow:           B(matchBlocked, 'No rich covariate data available'),
    gcomp:        B(matchBlocked, 'No rich covariate data available'),
    msm:          gmBlocked ? 'No time-varying longitudinal data' : B(i.msm_timepoints === 'under3', 'Insufficient time points for MSM'),
    gest:         B(gmBlocked, 'No time-varying longitudinal data'),
    gcomp_tv:     B(gmBlocked, 'No time-varying longitudinal data'),
    rd_sharp:     rdBlocked ? 'No assignment variable with known cutoff' : B(i.rd_sharp_manip === 'yes', 'Running variable manipulation detected'),
    rd_fuzzy:     rdBlocked ? 'No assignment variable with known cutoff' : B(i.rd_fuzzy_jump === 'no', 'Insufficient jump at cutoff — weak instrument'),
    rdit:         rdBlocked ? 'No known policy change date' : B(i.rdit_confound === 'no', 'Concurrent events confound the discontinuity'),
    did_std:      didBlocked ? 'No comparable control group with pre-period data' : i.did_parallel === 'no' ? 'Parallel trends assumption unlikely to hold' : B(predataNone, 'No pre-intervention data available'),
    did_stagger:  didBlocked ? 'No comparable control group with pre-period data' : i.did_stagger === 'no' ? 'No staggered rollout — design not applicable' : B(predataNone, 'No pre-intervention data available'),
    did_cs:       didBlocked ? 'No comparable control group with pre-period data' : i.did_stagger === 'no' ? 'No staggered rollout — design not applicable' : B(predataNone, 'No pre-intervention data available'),
    did_sa:       didBlocked ? 'No comparable control group with pre-period data' : i.did_stagger === 'no' ? 'No staggered rollout — design not applicable' : B(predataNone, 'No pre-intervention data available'),
    synth:        didBlocked ? 'No comparable donor pool available' : i.sc_donor === 'no' ? 'No suitable donor pool' : B(predataNone, 'No pre-intervention data available'),
    asc:          didBlocked ? 'No comparable donor pool available' : i.sc_donor === 'no' ? 'No suitable donor pool' : B(predataNone, 'No pre-intervention data available'),
    iv_2sls:      ivBlocked ? 'No plausible instrument identified' : i.iv_exclusion === 'no' ? 'Exclusion restriction implausible' : B(i.iv_relevance === 'no', 'Weak instrument — poor first stage'),
    iv_frd:       ivBlocked ? 'No plausible instrument identified' : B(rdBlocked, 'No cutoff variable available'),
    its_std:      itsBlocked ? 'No clear intervention date or time series data' : B(predataNone, 'No pre-intervention data available'),
    its_ctrl:     itsBlocked ? 'No clear intervention date or time series data' : i.its_control === 'no' ? 'No comparable control series available' : B(predataNone, 'No pre-intervention data available'),
    its_seg:      itsBlocked ? 'No clear intervention date or time series data' : B(predataNone, 'No pre-intervention data available'),
    contrib:      'None',
    realist:      'None',
    process:      'None',
  }
}

// ── Assemble results ──────────────────────────────────────────────────────────

export const assembleResults = (inputs) => {
  const {
    p1_prospective, p3_exchangeability, p3_positivity, p3_consistency,
    p3_toc, p3_defined, p3_consistent,
    screen_did, screen_rd, screen_iv, screen_its, screen_match, screen_gmethod,
    b_ethics, b_logistics,
    rct_ind_feasible, rct_cluster_n, rct_cluster_contam,
    rct_sw_rollout, rct_sw_time, rct_cross_washout, rct_cross_chronic,
    rct_wait_delay, rct_wait_demand, rct_enc_variation, rct_enc_instrument,
    did_parallel, did_predata, did_stagger, did_het,
    sc_donor, sc_prefit,
    rd_sharp_cutoff, rd_sharp_manip, rd_fuzzy_jump, rdit_date, rdit_confound,
    iv_relevance, iv_exclusion,
    its_prepoints, its_postpoints, its_autocorr, its_control, its_seg_smooth,
    psm_overlap, mah_covs, cem_sample, ipw_extreme, ow_target, gcomp_model,
    msm_timepoints, gest_snm, gcomp_tv_regime,
    p5_confounder_confidence,
    p6_linkage, p6_missing,
    p7_n, p7_power_done, p7_predata, p7_pre_timepoints,
  } = inputs

  const assum  = assumptionScore(p3_exchangeability, p3_positivity, p3_consistency)
  const preS   = preperiodScoreFn(p7_predata, p7_pre_timepoints)
  const prospNo = p1_prospective === 'no'

  const dRct  = dscrRct(p7_n, p7_power_done, p6_missing)
  const dDid  = dscrDid(p7_predata, p7_pre_timepoints, p6_linkage, p6_missing)
  const dRd   = dscrRd(p6_linkage, p6_missing)
  const dIv   = dscrIv(p6_linkage, p6_missing)
  const dIts  = dscrIts(p7_predata, p7_pre_timepoints, p6_missing)
  const dMat  = dscrMatching(screen_match, p6_linkage, p6_missing)
  const dGm   = dscrGmethod(p7_predata, p7_pre_timepoints, screen_match, p6_linkage)
  const dTh   = dscrTheory(p6_missing)

  const causalScores = {
    ind_rct:      scoreRctIndividual(rct_ind_feasible, b_ethics, b_logistics, assum),
    cluster_rct:  scoreRctCluster(rct_cluster_n, rct_cluster_contam, b_logistics, assum),
    stepped_rct:  scoreRctStepped(rct_sw_rollout, rct_sw_time, assum),
    crossover_rct:scoreRctCrossover(rct_cross_washout, rct_cross_chronic, assum),
    waitlist_rct: scoreRctWaitlist(rct_wait_delay, rct_wait_demand, assum),
    enc_design:   scoreRctEncouragement(rct_enc_variation, rct_enc_instrument, assum),
    psm:          scorePsm(screen_match, psm_overlap, assum),
    mahal:        scoreMahalanobis(screen_match, mah_covs, assum),
    cem:          scoreCem(screen_match, cem_sample, assum),
    ipw:          scoreIpw(screen_match, ipw_extreme, assum),
    ow:           scoreOverlapWeights(screen_match, ow_target, p3_positivity, assum),
    gcomp:        scoreGcomp(screen_match, gcomp_model, assum),
    msm:          scoreMsm(screen_gmethod, msm_timepoints, assum),
    gest:         scoreGestimation(screen_gmethod, gest_snm, assum),
    gcomp_tv:     scoreGcompTv(screen_gmethod, gcomp_tv_regime, assum),
    rd_sharp:     scoreRdSharp(screen_rd, rd_sharp_cutoff, rd_sharp_manip, assum),
    rd_fuzzy:     scoreRdFuzzy(screen_rd, rd_fuzzy_jump, assum),
    rdit:         scoreRdit(screen_rd, rdit_date, rdit_confound, assum),
    did_std:      scoreDidStandard(screen_did, did_parallel, did_predata, assum),
    did_stagger:  scoreDidStagger(screen_did, did_stagger, did_parallel, assum),
    did_cs:       scoreDidCs(screen_did, did_stagger, did_het, assum),
    did_sa:       scoreDidCs(screen_did, did_stagger, did_het, assum),
    synth:        scoreSynth(screen_did, sc_donor, sc_prefit, preS, assum),
    asc:          Math.min(1.0, scoreSynth(screen_did, sc_donor, sc_prefit, preS, assum) * 1.05),
    iv_2sls:      scoreIv2sls(screen_iv, iv_relevance, iv_exclusion, assum),
    iv_frd:       scoreIvFrd(screen_iv, screen_rd, rd_fuzzy_jump, iv_exclusion, assum),
    its_std:      scoreItsStandard(screen_its, its_prepoints, its_postpoints, its_autocorr, assum),
    its_ctrl:     scoreItsControlled(screen_its, its_control, its_prepoints, assum),
    its_seg:      scoreItsSegmented(screen_its, its_seg_smooth, its_prepoints, assum),
    contrib:      scoreContribution(p3_toc, p3_defined),
    realist:      scoreRealist(p3_consistent, p3_toc),
    process:      scoreProcess(p3_defined),
  }

  const dataScoreMap = {
    ind_rct: dRct, cluster_rct: dRct, stepped_rct: dRct, crossover_rct: dRct, waitlist_rct: dRct, enc_design: dRct,
    psm: dMat, mahal: dMat, cem: dMat, ipw: dMat, ow: dMat, gcomp: dMat,
    msm: dGm, gest: dGm, gcomp_tv: dGm,
    rd_sharp: dRd, rd_fuzzy: dRd, rdit: dRd,
    did_std: dDid, did_stagger: dDid, did_cs: dDid, did_sa: dDid, synth: dDid, asc: dDid,
    iv_2sls: dIv, iv_frd: dIv,
    its_std: dIts, its_ctrl: dIts, its_seg: dIts,
    contrib: dTh, realist: dTh, process: dTh,
  }

  const blockers = getBlockers(inputs)

  return DESIGNS.map((design) => {
    const rawCausal  = clamp(causalScores[design.id] ?? 0)
    const ceiling    = CATEGORY_CEILINGS[design.ceilingKey] ?? 1.0
    const causal     = Math.min(rawCausal, ceiling)
    const data       = clamp(dataScoreMap[design.id] ?? 0.5)
    const blocker    = blockers[design.id] ?? 'None'
    let total        = Math.round((data * WEIGHTS.data + causal * WEIGHTS.causalValidity) * 1000) / 1000

    // Cap blocked designs
    if (blocker !== 'None') total = Math.min(total, 0.15)

    let feasibility
    if (prospNo && design.prospectiveOnly) {
      feasibility = 'N/A'
      return { ...design, causalScore: null, dataScore: null, weightedTotal: null, feasibility, blocker }
    }
    feasibility = total >= THRESH_HIGH ? 'High' : total >= THRESH_MEDIUM ? 'Medium' : 'Low'

    return {
      ...design,
      causalScore:   Math.round(causal * 1000) / 1000,
      dataScore:     Math.round(data   * 1000) / 1000,
      weightedTotal: total,
      feasibility,
      blocker,
    }
  }).sort((a, b) => {
    if (a.weightedTotal === null) return 1
    if (b.weightedTotal === null) return -1
    return b.weightedTotal - a.weightedTotal
  })
}
