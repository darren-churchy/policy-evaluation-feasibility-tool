# Reviewer pack

**Specification version 1.0.0**

Generated from `spec/` by `npm run pack`. Do not edit — edit the specification and
regenerate. `npm run pack:check` fails if this file has drifted from the spec.

## What you are being asked

Whether each rule below is methodologically correct: that the condition it fires on is
the right one, that blocking, conditioning or warning is the right response, and that
the source cited supports it.

Three things are worth knowing before reading:

1. **A design takes its worst state.** No good answer offsets a bad one. A design with
   one blocker is blocked regardless of everything else being in place.
2. **Nothing is scored.** There are no weights and no thresholds that trade one quality
   against another. The tool recommends the highest rung that is feasible.
3. **An unanswered question leaves a design Unknown**, never feasible by default.

## Summary

| | Count |
|---|---|
| Designs | 22 (19 on the ladder, 3 theory-based) |
| Questions | 38 |
| Checks | 132 |
| — blockers | 53 |
| — conditions | 60 |
| — warnings | 19 |
| References | 24 |

## The robustness ladder

Designs are ranked by the assumption that makes their comparison valid, not by how
sophisticated the estimator is.

| Tier | Name | Identifying assumption | Maryland | Designs |
|---|---|---|---|---|
| 1 | Randomised | Random allocation gives exchangeability: treated and untreated groups differ only by chance, in measured and unmeasured characteristics alike. | 5 | Individual RCT, Cluster RCT, Stepped-wedge RCT, Crossover RCT, Waitlist RCT, Encouragement design |
| 2 | Local as-if random | An assignment rule or instrument isolates exogenous variation — but only where its own conditions hold, and those conditions are themselves testable claims. | 4 | Sharp regression discontinuity, Fuzzy regression discontinuity, Instrumental variables |
| 3 | Comparison-group panel | Parallel trends — the treated and comparison groups would have moved together absent the intervention — or weighted comparison units that tracked the treated unit before it. | 3 | Difference-in-differences (2x2), Staggered-adoption difference-in-differences, Synthetic control, Controlled interrupted time series, Regression discontinuity in time |
| 4 | Selection on observables | No unmeasured confounding given the measured covariates. Untestable in principle; the argument rests on substantive knowledge of the assignment process. | 2 | Matching, Weighting, G-computation and standardisation, G-methods for time-varying treatment |
| 5 | Single time series | The pre-intervention trend would have continued unchanged. No comparison group exists to falsify this, so it stands or falls on the plausibility of the counterfactual trend. | 1 to 2 | Interrupted time series |

**Tier 4 note.** Level 3 where pre-period outcomes are used as controls and comparability is demonstrated rather than asserted.

### The theory-based strand

Theory-based evaluation runs beside every rung and is never converted into one.

- **primary** — Every counterfactual tier is Blocked, or there are too few units for any counterfactual comparison to be informative.
- **complementary** — A counterfactual tier is available. Theory-based work then addresses mechanism, implementation and context — questions an effect estimate cannot answer.

### Placements where sources disagree

Shown with both views rather than resolved silently. Each default below has been
explicitly signed off.

**Regression discontinuity in time (RDIT)** — placed at Tier 3 (signed off)

- *Tier 3:* Identification rests on a continuity assumption across a date, which is a time-series claim: nothing else changed at the cutoff. That is the same class of assumption as a comparison-group panel, not local randomisation.
- *Tier 2, where a sharp administrative cutoff in time is externally imposed:* Treated as a discontinuity design proper, on the grounds that the running variable is a genuine assignment rule.

Sources: whatworks_sms, robins_i_v2

**Controlled interrupted time series** — placed at Tier 3 (signed off)

- *Tier 3:* The control series supplies a comparison group, placing it with the panel designs rather than with as-if-random assignment.
- *Tier 2:* Sometimes grouped with quasi-experimental designs of higher internal validity where the control series is strongly comparable.

Sources: whatworks_sms

**Matching and weighting with prior-outcome controls** — placed at Tier 4 (signed off)

- *Tier 4, upper:* Still selection on observables — conditioning on prior outcomes narrows the scope for unmeasured confounding but does not remove it.
- *Tier 3:* Where pre-period outcomes are used and comparability is demonstrated, the Maryland scale allows level 3, which maps to Tier 3.

Sources: whatworks_sms, robins_i_v2

## Readiness gates

Checked before any design is considered. A gate means impact evaluation cannot answer
the question yet, whatever the data situation.

| Gate | Reads | Severity | Fires when | Message | Instead |
|---|---|---|---|---|---|
| intervention_specified | `intervention_defined` | **gate** | intervention_defined is “No” | The intervention is not yet specified, so an observed change could not be attributed to it rather than to variation in what was delivered. No impact evaluation design resolves this. | Document what the intervention consists of, who delivers it and at what intensity. A process evaluation can describe and standardise delivery first. |
| theory_articulated | `theory_of_change` | **gate** | theory_of_change is “No” | With no theory of change there is nothing to say which outcomes should move, over what period, or how a result should be read. The evaluation would have no stated expectation to test. | Develop a logic model with delivery staff and stakeholders. A developmental evaluation can support this while the intervention is still forming. |
| sufficient_maturity | `maturity` | **warning** | maturity is “No — early or small-scale” | The intervention is early or small-scale, so an evaluation now would largely measure its immaturity rather than its effect. | Consider a process or developmental evaluation while delivery stabilises. Where a specific component is already settled, a Test-stage evaluation of that component may still be worthwhile. |

## Stage inference

Ordered; the first matching rule wins.

| # | When | Stage | Reasoning |
|---|---|---|---|
| 1 | intervention_defined is “No” | co_design | The work needed is specifying the intervention, which is Co-design activity. |
| 2 | theory_of_change is “No” | co_design | Articulating how the intervention is meant to work is Co-design activity. |
| 3 | maturity is “No — early or small-scale” | explore | Where the intervention is early and small, the useful work is understanding the problem and the delivery context rather than estimating an effect. |
| 4 | intervention_defined is “Partly — being developed” or theory_of_change is “Partly — in development” or maturity is “Partly — scaling or still changing” | test | Something is still settling, so the appropriate estimand is the effect of a specific component or mechanism rather than of the whole programme. Every impact evaluation design remains available; what narrows is the claim being made. |
| 5 | intervention_defined is “Yes — specified and documented” and theory_of_change is “Yes — documented” and maturity is “Yes — stable and at scale” | test, grow | Defined, theorised and at scale. Both stages apply: the distinction is whether the programme model is still being refined (Test) or is stable and being evaluated at full scale (Grow). Identification requirements are identical, so no design is excluded by the choice between them. |

## Rules, by design

Each design in tier order. `Fires when` is the condition rendered in plain English;
the underlying expression is in `spec/rules.yaml`.

### Encouragement design — Tier 1

`encouragement` · *ITT of the encouragement; LATE among compliers*

Estimators: ITT, 2SLS for the LATE

**Tier qualifier.** Tier 1 for the ITT, which inherits exchangeability from randomisation. The LATE additionally requires the exclusion restriction, which is a Tier 2 assumption.

Randomises an offer or nudge rather than the treatment itself, so it suits settings where treatment cannot be withheld

| Type | Fires when | Message | What would discharge it | Threshold | Sources |
|---|---|---|---|---|---|
| Blocker | prospective is “No — the intervention has already been delivered or allocated” | The encouragement cannot be randomised once the intervention has been delivered. | — | — | angrist_pischke_2009 |
| Blocker | encouragement_lever is “No” | No credible way to encourage take-up without assigning the intervention itself, which is what this design requires. | — | — | angrist_pischke_2009 |
| Condition | encouragement_lever is “Possibly — needs exploration” | A possible encouragement has been identified but not established. | Check that it moves take-up appreciably. A weak encouragement yields an estimate for too few people to be useful. | — | angrist_pischke_2009 lee_etal_2022 |
| Condition | exclusion_restriction is one of “Doubtful — plausible alternative routes exist” or “Not yet considered” | The encouragement must affect the outcome only by changing take-up. If it carries information or incentive that acts directly, the complier estimate is biased. | Set out why the encouragement has no direct route to the outcome. This cannot be tested, so it has to be argued. | — | angrist_pischke_2009 |
| Warning | encouragement_lever is not “No” | This estimates the effect for those whose take-up the encouragement changed, not for everyone. Those people may differ from the population the decision is about. | — | — | angrist_pischke_2009 |

### Cluster RCT — Tier 1

`rct_cluster` · *ATE where groups are the unit of allocation*

Estimators: Mixed-effects model, GEE, Cluster-robust OLS

Feasibility is driven by the number of clusters and the ICC, not by total participants

| Type | Fires when | Message | What would discharge it | Threshold | Sources |
|---|---|---|---|---|---|
| Blocker | prospective is “No — the intervention has already been delivered or allocated” | Allocation cannot be randomised once the intervention has already been delivered. | — | — | rob2 |
| Blocker | randomisation_barriers is “Randomisation is ruled out” | Randomisation has been ruled out, so no randomised design is available. | — | — | rob2 |
| Blocker | allocation_unit is “Individual people” | The intervention is delivered to individuals, so there are no natural clusters to allocate. | — | — | rob2 |
| Condition | cluster_count is “Fewer than 15” | Fewer than about 15 clusters. Precision in a cluster design is governed by the number of clusters, so a large number of individuals within them does not compensate. | Establish whether more clusters can be recruited, or whether individual allocation is possible after all. | 15 clusters (range 10–20) — convention · contested | rob2 |
| Condition | randomisation_barriers is “Significant” | Significant barriers to randomisation were identified. | Check whether randomising the order of a phased rollout is acceptable instead. | — | rob2 |
| Warning | cluster_count is one of “Roughly 15 to 40” or “Fewer than 15” | A cluster design needs an intracluster correlation estimate to size properly. With this few clusters the result is sensitive to the value assumed, so take a range to your statistician rather than a single figure. | — | — | rob2 |

### Crossover RCT — Tier 1

`rct_crossover` · *Within-person ATE*

Estimators: Paired analysis, Mixed-effects

Requires a reversible outcome and an adequate washout period

| Type | Fires when | Message | What would discharge it | Threshold | Sources |
|---|---|---|---|---|---|
| Blocker | prospective is “No — the intervention has already been delivered or allocated” | Allocation cannot be randomised once the intervention has already been delivered. | — | — | rob2 |
| Blocker | outcome_reversible is “No — effects persist or accumulate” | The outcome does not return to baseline, so a participant cannot serve as their own control in a later period. | — | — | rob2 |
| Blocker | washout_feasible is “No” | Without a washout period the first condition contaminates the second. | — | — | rob2 |
| Condition | outcome_reversible is “Unclear” | Whether the effect persists has not been established. | Check the evidence on how long the effect lasts; this determines both whether a crossover is possible and how long the washout must be. | — | rob2 |
| Condition | washout_feasible is “Unclear” | The feasibility of a washout period has not been established. | Establish the minimum gap needed, then whether delivery can accommodate it. | — | rob2 |

### Individual RCT — Tier 1

`rct_individual` · *ATE among those randomised*

Estimators: Intention-to-treat, Per-protocol, CACE

| Type | Fires when | Message | What would discharge it | Threshold | Sources |
|---|---|---|---|---|---|
| Blocker | prospective is “No — the intervention has already been delivered or allocated” | Allocation cannot be randomised once the intervention has already been delivered. | — | — | rob2 |
| Blocker | randomisation_barriers is “Randomisation is ruled out” | Randomisation has been ruled out, so no randomised design is available. | — | — | rob2 |
| Blocker | allocation_unit is “Groups — sites, teams, areas or caseloads” | The intervention is delivered to whole groups, so individuals within them cannot be allocated separately. | — | — | rob2 |
| Condition | randomisation_barriers is “Significant” | Significant barriers to randomisation were identified. | Check whether a stepped-wedge, waitlist or encouragement design addresses the specific objection — these are often accepted where straightforward randomisation is not. | — | rob2 magenta_book |
| Condition | equipoise is “No — the effect is considered established” | The effect is considered already established, which makes withholding the intervention hard to justify. | Document the remaining uncertainty, or move to a design that withholds nothing. | — | magenta_book |
| Condition | equipoise is “Contested among stakeholders” | Stakeholders disagree about whether the effect is already established. | Resolve this before an ethics application, since it is the usual ground for refusal. | — | magenta_book |

### Stepped-wedge RCT — Tier 1

`rct_stepped_wedge` · *ATE averaged over exposure time*

Estimators: Mixed-effects with time adjustment, Permutation test

Requires a phased rollout that already exists and whose order can be randomised

| Type | Fires when | Message | What would discharge it | Threshold | Sources |
|---|---|---|---|---|---|
| Blocker | prospective is “No — the intervention has already been delivered or allocated” | The rollout order cannot be randomised once delivery has happened. | — | — | rob2 |
| Blocker | rollout_order_controllable is “No — the order is fixed or externally determined” | The rollout order is fixed or externally determined, so there is nothing left to randomise. | — | — | magenta_book |
| Condition | rollout_order_controllable is “Partly — some influence over sequencing” | Only partial influence over the sequencing of the rollout. | Establish which part of the order is genuinely open. Randomising even a subset of the sequence can be enough. | — | magenta_book |
| Condition | cluster_count is “Fewer than 15” | Too few clusters to allocate across a useful number of steps. | Establish whether more sites can join, or whether fewer, larger steps would work. | — | rob2 |
| Warning | rollout_order_controllable is not “No — the order is fixed or externally determined” | In a stepped-wedge design every unit is treated later in the study than it is untreated, so the treatment effect is entangled with any underlying time trend. The analysis must adjust for time. | — | — | rob2 |

### Waitlist RCT — Tier 1

`rct_waitlist` · *Short-run ATE before the control group crosses over*

Estimators: ITT at first follow-up, Mixed-effects

Everyone is eventually treated; the effect is identified only before crossover

| Type | Fires when | Message | What would discharge it | Threshold | Sources |
|---|---|---|---|---|---|
| Blocker | prospective is “No — the intervention has already been delivered or allocated” | Allocation cannot be randomised once the intervention has already been delivered. | — | — | rob2 |
| Blocker | delay_acceptable is “No — delay is not acceptable” | A waitlist design requires part of the group to receive the intervention later. | — | — | magenta_book |
| Condition | delay_acceptable is “Unclear — needs discussion” | Whether a delay is acceptable has not been settled. | Agree the maximum tolerable wait with delivery colleagues. That wait is also the window in which the effect must be measured. | — | magenta_book |
| Warning | delay_acceptable is “Yes — a delay is tolerable” | The comparison exists only until the waitlist group is treated, so the design measures a short-run effect. Outcomes that take longer to emerge cannot be captured this way. | — | — | magenta_book |

### Instrumental variables — Tier 2

`iv_2sls` · *LATE among compliers*

Estimators: 2SLS, LIML, JIVE

The exclusion restriction is argued on substantive grounds and cannot be tested

| Type | Fires when | Message | What would discharge it | Threshold | Sources |
|---|---|---|---|---|---|
| Blocker | instrument_available is “No” | No factor identified that shifts take-up without affecting the outcome by any other route. | — | — | angrist_pischke_2009 |
| Blocker | exclusion_restriction is “Doubtful — plausible alternative routes exist” | Plausible alternative routes from the instrument to the outcome were identified. The exclusion restriction is the whole basis of the design, so this blocks it rather than qualifying it. | — | — | angrist_pischke_2009 |
| Condition | instrument_available is “Possibly — needs investigation” | A candidate instrument has been identified but not established. | Check that it predicts take-up, and set out why it cannot affect the outcome directly. | — | angrist_pischke_2009 |
| Condition | exclusion_restriction is “Not yet considered” | The exclusion restriction has not yet been considered. | Write down every route by which the instrument could reach the outcome, and argue each one away. This cannot be tested statistically. | — | angrist_pischke_2009 |
| Condition | instrument_strength is “Weakly” | A weak instrument gives estimates that are biased towards the unadjusted association and confidence intervals that understate uncertainty. | Report first-stage strength. The conventional F above 10 is a rule of thumb that recent work shows is not sufficient for valid inference, so treat it as a floor rather than a target. | 10 first-stage F (range 10–104) — convention · contested | lee_etal_2022 |
| Condition | instrument_strength is “Not yet established” | The strength of the instrument has not been established. | Estimate the first stage before committing to the design. | — | lee_etal_2022 |

### Fuzzy regression discontinuity — Tier 2

`rd_fuzzy` · *LATE among compliers at the cutoff*

Estimators: Fuzzy RD, Fuzzy RD as IV, Local 2SLS

Absorbs the former iv_frd entry: fuzzy RD and fuzzy-RD-as-IV are one design under two estimation framings, not two designs

| Type | Fires when | Message | What would discharge it | Threshold | Sources |
|---|---|---|---|---|---|
| Blocker | assignment_threshold is “No” | A discontinuity design requires assignment by a score, date or threshold. | — | — | imbens_lemieux_2008 |
| Blocker | threshold_manipulation is “Sorting is likely or demonstrated” | Sorting around the cutoff removes the basis for the comparison. | — | — | mccrary_2008 |
| Condition | threshold_manipulation is “Not yet tested” | Whether people can position themselves around the cutoff has not been tested. | Run a density test for bunching at the cutoff. | — | mccrary_2008 |
| Condition | instrument_strength is one of “Weakly” or “Not yet established” | A fuzzy design relies on a clear jump in the probability of treatment at the cutoff. A small jump identifies the effect for very few people. | Estimate the size of the jump in take-up at the cutoff before committing. | — | lee_etal_2022 imbens_lemieux_2008 |
| Condition | density_near_cutoff is “Few” | Few observations near the cutoff, and a fuzzy design needs more than a sharp one. | Count observations within a plausible bandwidth and power on that figure. | — | cattaneo_etal_2020 |
| Warning | assignment_threshold is not “No” | This estimates the effect for those at the cutoff whose treatment the rule actually changed — a narrower group than a sharp design addresses. | — | — | imbens_lemieux_2008 |

### Sharp regression discontinuity — Tier 2

`rd_sharp` · *ATE at the cutoff*

Estimators: Local linear, Local polynomial, Bias-corrected robust

Requires a continuous running variable and a cutoff that is actually enforced

| Type | Fires when | Message | What would discharge it | Threshold | Sources |
|---|---|---|---|---|---|
| Blocker | assignment_threshold is “No” | A discontinuity design requires assignment by a score, date or threshold. | — | — | imbens_lemieux_2008 |
| Blocker | threshold_enforced is “Mostly — the cutoff shifts the probability of treatment” | The cutoff shifts the probability of treatment rather than determining it, which is a fuzzy design rather than a sharp one. | — | — | imbens_lemieux_2008 |
| Blocker | threshold_manipulation is “Sorting is likely or demonstrated” | Sorting around the cutoff means those either side differ in ways beyond treatment, which removes the basis for the comparison. | — | — | mccrary_2008 |
| Condition | threshold_manipulation is “Not yet tested” | Whether people can position themselves around the cutoff has not been tested. | Run a density test for bunching at the cutoff, and check whether those it affects could know the rule and act on it. | — | mccrary_2008 |
| Condition | threshold_enforced is “Not yet established” | How strictly the cutoff is applied in practice has not been established. | Examine administrative records to see how often the rule was overridden. This decides between a sharp and a fuzzy design. | — | imbens_lemieux_2008 |
| Condition | density_near_cutoff is “Few” | Few observations fall near the cutoff, and only those identify the effect. A large total sample does not help. | Count observations within a plausible bandwidth rather than in the dataset as a whole, and take that figure to a power calculation. | — | cattaneo_etal_2020 |
| Warning | assignment_threshold is “Yes — a documented cutoff exists” | The estimate depends on the bandwidth chosen around the cutoff. Report results across a range of bandwidths rather than only the one that was selected. | — | — | cattaneo_etal_2020 |
| Warning | assignment_threshold is “Yes — a documented cutoff exists” | The result applies at the cutoff. It says little about people far from it, who may be the group the decision concerns. | — | — | imbens_lemieux_2008 |

### Difference-in-differences (2x2) — Tier 3

`did_2x2` · *ATT*

Estimators: Two-way fixed effects

One treatment date. Parallel trends can only be examined where more than one pre-period exists

| Type | Fires when | Message | What would discharge it | Threshold | Sources |
|---|---|---|---|---|---|
| Blocker | pre_periods is “None” | A difference-in-differences comparison requires outcome data from before the intervention. | — | — | angrist_pischke_2009 |
| Blocker | comparison_group is “No” | No comparison group that did not receive the intervention. | — | — | whatworks_sms |
| Blocker | parallel_trends_evidence is “No — the trends clearly diverge” | The groups were already moving apart before the intervention, so the difference afterwards cannot be attributed to it. | — | — | angrist_pischke_2009 |
| Blocker | staggered_rollout is one of “Yes — adoption was staggered” or “Planned but not yet begun” | Adoption is or will be staggered, so this is not a two-period comparison. The staggered-adoption design applies instead. | — | — | goodman_bacon_2021 |
| Condition | pre_periods is “One period only” | With one pre-period the parallel-trends assumption cannot be examined at all. It would be assumed rather than supported. | Find at least two further pre-periods so the trends can be compared. | — | angrist_pischke_2009 |
| Condition | parallel_trends_evidence is “Not yet examined” | Whether the groups moved together before the intervention has not been examined. | Plot both series across every available pre-period. This is the main thing a reviewer will look for. | — | angrist_pischke_2009 |
| Condition | comparison_group is “Possibly — needs investigation” | A possible comparison group has been identified but its comparability is not established. | Check that it faced comparable conditions and was not affected by the intervention itself. | — | whatworks_sms |

### Staggered-adoption difference-in-differences — Tier 3

`did_staggered` · *Group-time ATT; aggregated to an overall ATT*

Estimators: Two-way fixed effects, Callaway-Sant'Anna, Sun-Abraham, Borusyak-Jaravel-Spiess

Kept separate from the 2x2 case because variation in treatment timing is a different data requirement. TWFE can carry negative weights here; the other estimators correct this

| Type | Fires when | Message | What would discharge it | Threshold | Sources |
|---|---|---|---|---|---|
| Blocker | pre_periods is “None” | A difference-in-differences comparison requires outcome data from before the intervention. | — | — | angrist_pischke_2009 |
| Blocker | comparison_group is “No” | No comparison group that did not receive the intervention. | — | — | whatworks_sms |
| Blocker | staggered_rollout is “No — a single common start date” | All units started at the same time, so there is no variation in timing. The two-period design applies instead. | — | — | goodman_bacon_2021 |
| Blocker | parallel_trends_evidence is “No — the trends clearly diverge” | The groups were already moving apart before the intervention. | — | — | angrist_pischke_2009 |
| Condition | parallel_trends_evidence is “Not yet examined” | Whether the groups moved together before the intervention has not been examined. | Compare trends for each adoption cohort separately, not just in aggregate — a single cohort can mask divergence in another. | — | angrist_pischke_2009 callaway_santanna_2021 |
| Condition | staggered_rollout is “Planned but not yet begun” | The staggered rollout is planned but has not begun. | If the order is still open, randomising it gives a stepped-wedge design at Tier 1 for no additional data cost. | — | goodman_bacon_2021 |
| Warning | staggered_rollout is one of “Yes — adoption was staggered” or “Planned but not yet begun” | Under staggered adoption the conventional two-way fixed effects estimator averages comparisons that include already-treated units acting as controls, and can place negative weights on some of them. Use an estimator built for staggered timing — Callaway-Sant'Anna, Sun-Abraham or Borusyak-Jaravel-Spiess. This is an estimator choice; it does not change the tier. | — | — | goodman_bacon_2021 callaway_santanna_2021 sun_abraham_2021 |

### Controlled interrupted time series — Tier 3

`its_controlled` · *Change in level and slope relative to a control series*

Estimators: Segmented regression with control series, Comparative ITS

The control series is what lifts this above a single series. Placed at Tier 3 by sign-off rather than Tier 2

| Type | Fires when | Message | What would discharge it | Threshold | Sources |
|---|---|---|---|---|---|
| Blocker | control_series is “No” | No equivalent series for an unaffected group. Without one this is a single interrupted time series at Tier 5. | — | — | bernal_etal_2017 |
| Blocker | pre_periods is “None” | A pre-intervention trend must be estimable on both series. | — | — | bernal_etal_2017 |
| Blocker | policy_date_known is “No” | The interruption point must be known to separate before from after. | — | — | bernal_etal_2017 |
| Condition | control_series is “Possibly — needs investigation” | A possible control series has been identified but not established. | Check it was genuinely unaffected by the intervention and is subject to the same external influences. | — | bernal_etal_2017 |
| Condition | time_points is “Fewer than four each side” | Too few time points to estimate a trend on each side of the interruption with any confidence. | Aim for roughly eight points per segment. This is a working convention rather than a derived minimum. | 8 time points per segment (range 6–12) — convention · contested | wagner_etal_2002 bernal_etal_2017 |
| Condition | cointerventions is “Yes — other changes coincided” | Other changes coincided with the intervention. A control series helps only where it was exposed to those same changes. | Establish whether the control series was affected by the same coinciding changes. | — | bernal_etal_2017 |
| Condition | cointerventions is “Possibly — not yet checked” | Whether anything else changed at the same time has not been checked. | Compile a timeline of other policy and funding changes across the study period. | — | bernal_etal_2017 robins_i_v2 |

### Regression discontinuity in time — Tier 3

`rdit` · *Effect at the date of the policy change*

Estimators: Local linear in time, Donut RD

Placed at Tier 3 by sign-off: continuity across a date is a time-series claim that nothing else changed, not local randomisation

| Type | Fires when | Message | What would discharge it | Threshold | Sources |
|---|---|---|---|---|---|
| Blocker | policy_date_known is “No” | This design compares either side of a date, so the date must be known precisely. | — | — | bernal_etal_2017 |
| Blocker | pre_periods is “None” | No data from before the change. | — | — | bernal_etal_2017 |
| Blocker | cointerventions is “Yes — other changes coincided” | Other changes occurred at the same date. With no comparison group there is nothing to separate their effect from the intervention's. | — | — | robins_i_v2 |
| Blocker | time_points is “Fewer than four each side” | This design estimates locally either side of the date, so it needs observations close to it. With very few time points there is nothing to fit a local comparison to, and a plain interrupted time series over the whole series is the available design instead. | — | — | cattaneo_etal_2020 bernal_etal_2017 |
| Condition | time_points is “Roughly four to eight each side” | Local estimation around the date rests on the observations nearest it, which are fewer than the length of the series suggests. | Count the observations within a plausible window either side of the date rather than across the whole series, and power on that figure. | — | cattaneo_etal_2020 |
| Condition | policy_date_known is “Approximately — phased or uncertain” | The date is approximate or the change was phased, which blurs the discontinuity. | Establish a precise date. Where the change was genuinely phased, a design built on the phasing is likely to serve better. | — | bernal_etal_2017 |
| Condition | cointerventions is “Possibly — not yet checked” | Whether anything else changed at the same date has not been checked. | Compile a timeline around the date. This is the main threat to the design, so it needs doing before committing to it. | — | robins_i_v2 bernal_etal_2017 |
| Warning | policy_date_known is not “No” | Placed at Tier 3 rather than Tier 2: continuity across a date is a claim that nothing else changed then, which is a time-series argument rather than local randomisation. Some sources place it higher where the cutoff is externally imposed. | — | — | whatworks_sms robins_i_v2 |

### Synthetic control — Tier 3

`synth` · *ATT for the treated unit*

Estimators: Synthetic control, Augmented synthetic control, Matrix completion

For one or a few treated units. Needs a donor pool and a long pre-period; the augmented estimator is the fallback where pre-period fit is poor

| Type | Fires when | Message | What would discharge it | Threshold | Sources |
|---|---|---|---|---|---|
| Blocker | pre_periods is one of “None” or “One period only” | A synthetic control is built by matching the treated unit's pre-intervention path, which requires a run of periods rather than one. | — | — | abadie_2021 |
| Blocker | donor_pool is “No comparable units” | No untreated units available to weight into a comparison. | — | — | abadie_2021 |
| Condition | pre_periods is “Two or three periods” | A short pre-period gives the weighting little to match on, so good pre-period fit may be achieved by chance rather than by genuine similarity. | Extend the pre-period if the data allow. Where it cannot be extended, the augmented estimator corrects some of the resulting bias. | — | abadie_2021 |
| Condition | donor_pool is “A few, of uncertain comparability” | Few candidate donor units, of uncertain comparability. | Check that donors were not themselves affected by the intervention, and that none experienced its own shock during the period. | — | abadie_2021 |
| Warning | donor_pool is not “No comparable units” | Conventional confidence intervals do not apply. Inference is by placebo tests across the donor pool, which is why pool size affects what can be concluded as well as how well the method fits. | — | — | abadie_2021 |

### G-computation and standardisation — Tier 4

`gcomp` · *ATE or ATT*

Estimators: G-computation, Standardisation, Doubly-robust (AIPW), TMLE

Models the outcome rather than treatment assignment, so model specification rather than balance is the diagnostic

| Type | Fires when | Message | What would discharge it | Threshold | Sources |
|---|---|---|---|---|---|
| Blocker | covariate_richness is “Little” | Standardisation models the outcome given the covariates, so it needs those covariates to be measured. | — | — | hernan_robins_2020 |
| Blocker | overlap is “Poor — the groups barely overlap” | With no overlap the outcome model would extrapolate into regions where no comparable units exist, which the method cannot signal. | — | — | hernan_robins_2020 |
| Condition | confounders_measured is “Some known drivers are not measured” | Known drivers of selection are not in the data. | Plan a sensitivity analysis for unmeasured confounding. | — | vanderweele_ding_2017 |
| Condition | confounders_measured is “Not yet established” | The drivers of who received the intervention have not been established. | List them, then check which are measured. | — | hernan_robins_2020 |
| Condition | overlap is “Not yet examined” | Overlap has not been examined, and extrapolation beyond it is silent here. | Check overlap even though this method does not require it as directly as matching, because the model will extrapolate without warning. | — | hernan_robins_2020 |
| Warning | covariate_richness is not “Little” | The estimate depends on the outcome model being correctly specified. A doubly-robust estimator gives a second chance: it remains consistent if either the outcome model or the treatment model is right. | — | — | hernan_robins_2020 |

### G-methods for time-varying treatment — Tier 4

`gmethods` · *Effect of a treatment strategy sustained over time*

Estimators: MSM with IPTW, G-estimation, G-computation (time-varying)

For confounders that are themselves affected by prior treatment, where conventional adjustment is biased in both directions

| Type | Fires when | Message | What would discharge it | Threshold | Sources |
|---|---|---|---|---|---|
| Blocker | time_varying_confounding is “No — treatment is a one-off” | Treatment is a one-off, so conventional adjustment is appropriate and simpler. The g-methods exist for feedback between treatment and confounders. | — | — | robins_etal_2000 |
| Blocker | repeated_measures is “No” | Modelling the feedback between treatment and confounders requires repeated measures of both. | — | — | robins_etal_2000 |
| Blocker | covariate_richness is “Little” | The time-varying confounders must themselves be measured. | — | — | hernan_robins_2020 |
| Condition | time_varying_confounding is “Unclear” | Whether treatment affects later confounders has not been established. | Draw the causal structure over time. If no arrow runs from treatment to a later confounder, a simpler design will serve. | — | hernan_robins_2020 |
| Condition | confounders_measured is “Some known drivers are not measured” | Known drivers of selection are not in the data. The g-methods address confounding by measured time-varying factors; they do nothing about unmeasured ones. | Plan a sensitivity analysis for unmeasured confounding. | — | vanderweele_ding_2017 robins_etal_2000 |
| Warning | time_varying_confounding is “Yes — treatment and confounders evolve together” | Where treatment affects later confounders, adjusting for them conventionally blocks part of the effect, while omitting them leaves confounding. Both directions are wrong, which is why a g-method is needed rather than preferred. | — | — | robins_etal_2000 hernan_robins_2020 |

### Matching — Tier 4

`matching` · *ATT or ATE on the region of common support*

Estimators: Propensity score matching, Mahalanobis matching, Coarsened exact matching

**Tier qualifier.** Upper Tier 4 where prior outcomes are matched on and comparability is demonstrated rather than asserted

Blocks on covariate richness. Balance diagnostics are the characteristic check

| Type | Fires when | Message | What would discharge it | Threshold | Sources |
|---|---|---|---|---|---|
| Blocker | covariate_richness is “Little” | Matching can only adjust for what is measured. With little covariate data there is nothing to match on. | — | — | stuart_2010 |
| Blocker | overlap is “Poor — the groups barely overlap” | Where treated and untreated units barely resemble each other there are no comparable pairs to form. | — | — | austin_2011 li_etal_2018 |
| Condition | overlap is “Limited — overlap only in part of the range” | Overlap exists only across part of the range, so any estimate applies to that part and not to the whole population. | Define the region of common support and state that the result applies there. Weighting handles limited overlap better than matching does. | — | li_etal_2018 |
| Condition | overlap is “Not yet examined” | Whether the groups overlap has not been examined. | Compare covariate distributions between treated and untreated units before committing. | — | austin_2011 |
| Condition | confounders_measured is “Some known drivers are not measured” | Known drivers of selection are not in the data. Matching cannot adjust for them and balance diagnostics will not reveal them. | Plan a sensitivity analysis quantifying how strong an unmeasured confounder would need to be to overturn the finding. | — | vanderweele_ding_2017 |
| Condition | confounders_measured is “Not yet established” | The drivers of who received the intervention have not been established. | List them first, then check which are measured. The gap between the two lists is the design's main weakness. | — | hernan_robins_2020 |
| Condition | covariate_richness is “Some, with known gaps” | Covariate data has known gaps. | Document which variables are missing and why, so reviewers can judge the residual risk. | — | stuart_2010 robins_i_v2 |
| Warning | covariate_richness is not “Little” | Good balance on measured covariates is not evidence that unmeasured confounding is absent. It shows the matching worked, not that the assumption holds. | — | — | stuart_2010 |
| Warning | pre_periods is one of “Several periods” or “Two or three periods” | Pre-intervention outcome data is available. Matching on prior outcomes as well as characteristics places this at the upper end of Tier 4, and the Maryland scale allows level 3 where comparability is demonstrated rather than asserted. | — | — | whatworks_sms |

### Weighting — Tier 4

`weighting` · *ATE or ATT*

Estimators: IPW, Stabilised IPW, Overlap weights, Trimming

Kept separate from matching because it blocks on positivity rather than covariate richness, and extreme weights are its characteristic failure mode

| Type | Fires when | Message | What would discharge it | Threshold | Sources |
|---|---|---|---|---|---|
| Blocker | covariate_richness is “Little” | Weighting can only adjust for what is measured. | — | — | austin_2011 |
| Blocker | overlap is “Poor — the groups barely overlap” | Where some units had almost no chance of receiving the intervention, their weights become extreme and the estimate is driven by a handful of observations. This is a positivity violation. | — | — | li_etal_2018 hernan_robins_2020 |
| Condition | overlap is “Limited — overlap only in part of the range” | Limited overlap produces large weights that dominate the estimate. | Use overlap weights or trimming, which target the population where the comparison is actually supported, and report how many observations the weights concentrate on. | — | li_etal_2018 |
| Condition | overlap is “Not yet examined” | Whether the groups overlap has not been examined. | Examine the distribution of estimated propensity scores in both groups before committing; this is what determines whether weighting is viable at all. | — | austin_2011 li_etal_2018 |
| Condition | confounders_measured is “Some known drivers are not measured” | Known drivers of selection are not in the data. | Plan a sensitivity analysis for unmeasured confounding. | — | vanderweele_ding_2017 |
| Condition | confounders_measured is “Not yet established” | The drivers of who received the intervention have not been established. | List them, then check which are measured. | — | hernan_robins_2020 |
| Warning | covariate_richness is not “Little” | Report the distribution of the weights alongside the estimate. A result resting on a few heavily weighted observations is fragile even where the average looks sound. | — | — | li_etal_2018 |

### Interrupted time series — Tier 5

`its` · *Change in level and slope at the interruption*

Estimators: Segmented regression, ARIMA, GLS with autocorrelation correction

No comparison group, so the verdict rests entirely on the pre-intervention trend having continued. Segmented regression is the usual estimator, not a separate design

| Type | Fires when | Message | What would discharge it | Threshold | Sources |
|---|---|---|---|---|---|
| Blocker | pre_periods is “None” | The whole design rests on estimating the pre-intervention trend, so pre-period data is required. | — | — | bernal_etal_2017 |
| Blocker | policy_date_known is “No” | The interruption point must be known. | — | — | bernal_etal_2017 |
| Blocker | cointerventions is “Yes — other changes coincided” | Other changes coincided with the intervention. With no comparison group there is nothing to distinguish their effect from the intervention's. | — | — | robins_i_v2 bernal_etal_2017 |
| Condition | time_points is “Fewer than four each side” | Too few time points to estimate a trend on each side of the interruption. | Aim for roughly eight points per segment. A working convention rather than a derived minimum, so treat it as a range. | 8 time points per segment (range 6–12) — convention · contested | wagner_etal_2002 bernal_etal_2017 |
| Condition | time_points is “Roughly four to eight each side” | Enough points to fit a model, but not enough to characterise the trend confidently. | Extend the series if the data allow, and report the estimate's sensitivity to the window chosen. | — | bernal_etal_2017 |
| Condition | autocorrelation_plan is one of “No” or “Not yet decided” | Adjacent time points resemble each other. Ignoring this makes the effect appear more precisely estimated than it is. | Test for autocorrelation and model it, or use an estimator that accounts for it. | — | bernal_etal_2017 |
| Condition | cointerventions is “Possibly — not yet checked” | Whether anything else changed at the same time has not been checked. | Compile a timeline of other changes across the study period. Without a comparison group this is the design's central vulnerability. | — | bernal_etal_2017 |
| Warning | pre_periods is not “None” | Nothing here can test whether the pre-intervention trend would have continued. If a control series can be found the design moves to Tier 3 for no extra data on the treated unit. | — | — | bernal_etal_2017 whatworks_sms |

### Contribution analysis — theory-based strand

`contribution_analysis` · *Confidence in a stated contribution claim*

Estimators: Contribution analysis

Builds a structured causal narrative; requires no counterfactual

| Type | Fires when | Message | What would discharge it | Threshold | Sources |
|---|---|---|---|---|---|
| Condition | theory_of_change is “No” | Contribution analysis tests a stated theory of change. Without one there is no claim to assess. | Develop a theory of change with delivery staff and stakeholders. That work is part of the evaluation rather than a prerequisite for it. | — | mayne_2001 |
| Condition | theory_of_change is “Partly — in development” | The theory of change is still in development. | Finalise the causal chain and the assumptions at each link before gathering evidence against it. | — | mayne_2001 |
| Condition | documentary_evidence is “Patchy” | Evidence for the steps in the causal chain is patchy. | Identify which links are least evidenced; those determine what can be concluded. | — | mayne_2001 |
| Warning | theory_of_change is not “No” | The output is confidence in a contribution claim, not an effect size. Where a number is needed for a business case, this will not produce one. | — | — | mayne_2001 magenta_book |

### Process tracing — theory-based strand

`process_tracing` · *Confidence in a hypothesised causal pathway*

Estimators: Process tracing, Bayesian process tracing

Requires documentary or interview evidence at each step of the pathway

| Type | Fires when | Message | What would discharge it | Threshold | Sources |
|---|---|---|---|---|---|
| Blocker | documentary_evidence is “No” | Process tracing tests a causal pathway step by step against evidence. Without documentation of those steps there is nothing to trace. | — | — | beach_pedersen_2019 |
| Condition | documentary_evidence is “Patchy” | Documentation covers only part of the hypothesised pathway. | Identify which steps lack evidence. A pathway can still be assessed where the gaps are at links that carry less of the argument. | — | beach_pedersen_2019 |
| Condition | theory_of_change is “No” | There is no stated pathway to trace. | Set out the hypothesised causal chain before gathering evidence against it. | — | beach_pedersen_2019 |
| Warning | documentary_evidence is not “No” | Conclusions apply within the case examined. Establishing that a mechanism operated here is not evidence about how often it operates elsewhere. | — | — | beach_pedersen_2019 |

### Realist evaluation — theory-based strand

`realist` · *Context-mechanism-outcome configurations*

Estimators: Realist evaluation, Realist synthesis

Requires stakeholder access to elicit mechanisms

| Type | Fires when | Message | What would discharge it | Threshold | Sources |
|---|---|---|---|---|---|
| Blocker | stakeholder_access is “No” | Realist evaluation works by eliciting mechanisms from those who deliver and receive the intervention. Without access to them the method has no input. | — | — | pawson_tilley_1997 |
| Condition | stakeholder_access is “Limited” | Limited access to the people involved in delivery. | Establish which groups can be reached. Partial access narrows which context-mechanism-outcome configurations can be examined rather than ruling the method out. | — | pawson_tilley_1997 |
| Warning | stakeholder_access is not “No” | Findings are explicitly about what works for whom in which context. They do not generalise in the way an average effect is assumed to. | — | — | pawson_tilley_1997 |

## Questions

| Question | Asked | Options | Read by |
|---|---|---|---|
| **What kind of claim do you need to make?**<br>`claim_type` | always | Describe what is happening, or who is affected · Predict who is likely to experience an outcome · Establish whether an intervention caused a change | readiness / routing only |
| **Is the intervention clearly defined and documented?**<br>`intervention_defined` | always | Yes — specified and documented · Partly — being developed · No | readiness / routing only |
| **Does a theory of change or logic model exist?**<br>`theory_of_change` | always | Yes — documented · Partly — in development · No | 2 designs |
| **Is the intervention operating at sufficient scale and maturity?**<br>`maturity` | always | Yes — stable and at scale · Partly — scaling or still changing · No — early or small-scale | readiness / routing only |
| **Can the evaluation be planned before the intervention reaches participants?**<br>`prospective` | always | Yes — the evaluation can be designed in advance · No — the intervention has already been delivered or allocated | 6 designs |
| **What barriers are there to randomising who receives the intervention?**<br>`randomisation_barriers` | always | None identified · Some, likely addressable by design adaptation · Significant · Randomisation is ruled out | 2 designs |
| **What is the natural unit of allocation?**<br>`allocation_unit` | always | Individual people · Groups — sites, teams, areas or caseloads · Either is possible | 2 designs |
| **How many clusters could be allocated?**<br>`cluster_count` | allocation_unit is one of “Groups — sites, teams, areas or caseloads” or “Either is possible” | 40 or more · Roughly 15 to 40 · Fewer than 15 | 2 designs |
| **Is there a phased rollout whose order you could set?**<br>`rollout_order_controllable` | always | Yes — the order is ours to decide · Partly — some influence over sequencing · No — the order is fixed or externally determined | 1 design |
| **Would delaying the intervention for part of the group be acceptable?**<br>`delay_acceptable` | always | Yes — a delay is tolerable · Unclear — needs discussion · No — delay is not acceptable | 1 design |
| **Does the outcome return to baseline once the intervention stops?**<br>`outcome_reversible` | always | Yes — the effect does not persist · Unclear · No — effects persist or accumulate | 1 design |
| **Can a washout period be built in between conditions?**<br>`washout_feasible` | outcome_reversible is one of “Yes — the effect does not persist” or “Unclear” | Yes · Unclear · No | 1 design |
| **Is there a way to encourage take-up without assigning the intervention itself?**<br>`encouragement_lever` | always | Yes — a credible encouragement exists · Possibly — needs exploration · No | 1 design |
| **Is there genuine uncertainty about whether the intervention works?**<br>`equipoise` | always | Yes — the effect is genuinely uncertain · Contested among stakeholders · No — the effect is considered established | 1 design |
| **Is the intervention assigned by a score, date or threshold?**<br>`assignment_threshold` | always | Yes — a documented cutoff exists · Possibly — needs investigation · No | 2 designs |
| **How strictly is the cutoff followed in practice?**<br>`threshold_enforced` | assignment_threshold is one of “Yes — a documented cutoff exists” or “Possibly — needs investigation” | Strictly — the cutoff determines treatment · Mostly — the cutoff shifts the probability of treatment · Not yet established | 1 design |
| **Could people position themselves either side of the cutoff?**<br>`threshold_manipulation` | assignment_threshold is one of “Yes — a documented cutoff exists” or “Possibly — needs investigation” | Tested — no evidence of sorting · Not yet tested · Sorting is likely or demonstrated | 2 designs |
| **How many observations fall close to the cutoff?**<br>`density_near_cutoff` | assignment_threshold is one of “Yes — a documented cutoff exists” or “Possibly — needs investigation” | Many · Some · Few | 2 designs |
| **Is there a factor that shifts take-up but has no other route to the outcome?**<br>`instrument_available` | always | Yes — a candidate instrument exists · Possibly — needs investigation · No | 1 design |
| **How strongly does that factor predict take-up?**<br>`instrument_strength` | instrument_available is one of “Yes — a candidate instrument exists” or “Possibly — needs investigation” | Strongly · Weakly · Not yet established | 2 designs |
| **Can you argue the factor affects the outcome only through take-up?**<br>`exclusion_restriction` | instrument_available is one of “Yes — a candidate instrument exists” or “Possibly — needs investigation” | Yes — a clear substantive argument exists · Doubtful — plausible alternative routes exist · Not yet considered | 2 designs |
| **How much outcome data do you have from before the intervention?**<br>`pre_periods` | always | Several periods · Two or three periods · One period only · None | 7 designs |
| **Is there a group that did not receive the intervention but is otherwise similar?**<br>`comparison_group` | always | Yes — a credible comparison exists · Possibly — needs investigation · No | 2 designs |
| **Did the two groups move together before the intervention?**<br>`parallel_trends_evidence` | pre_periods is one of “Several periods” or “Two or three periods” | Yes — examined and consistent · Not yet examined · No — the trends clearly diverge | 2 designs |
| **Did different groups start at different times?**<br>`staggered_rollout` | always | Yes — adoption was staggered · Planned but not yet begun · No — a single common start date | 2 designs |
| **Are there untreated units that resemble the treated one?**<br>`donor_pool` | comparison_group is one of “Yes — a credible comparison exists” or “Possibly — needs investigation” or “No” | Yes — a reasonable pool exists · A few, of uncertain comparability · No comparable units | 1 design |
| **Is there an equivalent time series for an unaffected group?**<br>`control_series` | always | Yes · Possibly — needs investigation · No | 1 design |
| **Is the date the intervention took effect precisely known?**<br>`policy_date_known` | always | Yes — a specific date · Approximately — phased or uncertain · No | 3 designs |
| **Did anything else change at the same time?**<br>`cointerventions` | always | Nothing else identified · Possibly — not yet checked · Yes — other changes coincided | 3 designs |
| **How much do you know about the characteristics of both groups?**<br>`covariate_richness` | always | Extensive, for treated and untreated alike · Some, with known gaps · Little | 4 designs |
| **Do treated and untreated units actually resemble each other?**<br>`overlap` | covariate_richness is one of “Extensive, for treated and untreated alike” or “Some, with known gaps” | Good — the groups overlap substantially · Limited — overlap only in part of the range · Poor — the groups barely overlap · Not yet examined | 3 designs |
| **Are the main reasons people received the intervention captured in your data?**<br>`confounders_measured` | always | The main drivers are measured · Some known drivers are not measured · Not yet established | 4 designs |
| **Does treatment at one point change the factors that drive later treatment?**<br>`time_varying_confounding` | always | Yes — treatment and confounders evolve together · Unclear · No — treatment is a one-off | 1 design |
| **Do you hold repeated measures of treatment and of the confounders over time?**<br>`repeated_measures` | time_varying_confounding is one of “Yes — treatment and confounders evolve together” or “Unclear” | Yes — at several time points · No | 1 design |
| **How many time points do you have before and after the intervention?**<br>`time_points` | always | Eight or more each side · Roughly four to eight each side · Fewer than four each side | 3 designs |
| **Is there a plan to account for correlation between adjacent time points?**<br>`autocorrelation_plan` | always | Yes — it will be modelled · Not yet decided · No | 1 design |
| **Can you speak to the people who deliver and receive the intervention?**<br>`stakeholder_access` | always | Yes · Limited · No | 1 design |
| **Is there documentation covering each step of the intended causal chain?**<br>`documentary_evidence` | always | Yes — substantial · Patchy · No | 2 designs |

## References

Each carries a confidence note: how firmly the source supports the use made of it.

**`abadie_2021`** — Abadie, Alberto. Using synthetic controls: Feasibility, data requirements, and methodological aspects (2021)
  <https://doi.org/10.1257/jel.20191450>

  *High confidence. States the data requirements directly: a sizeable donor pool, a long pre-period, and good pre-period fit as a precondition rather than a diagnostic to report afterwards.*

**`angrist_pischke_2009`** — Angrist, Joshua D. and Pischke, J\"orn-Steffen. Mostly Harmless Econometrics: An Empiricist's Companion (2009)

  *High confidence for instrumental variables, the exclusion restriction and the LATE interpretation, and for the difference-in-differences framing.*

**`austin_2011`** — Austin, Peter C.. An introduction to propensity score methods for reducing the effects of confounding in observational studies (2011)
  <https://doi.org/10.1080/00273171.2011.568786>

  *High confidence for propensity score practice and overlap assessment.*

**`beach_pedersen_2019`** — Beach, Derek and Pedersen, Rasmus Brun. Process-Tracing Methods: Foundations and Guidelines (2019)

  *High confidence for process tracing and its requirement for evidence at each step of the hypothesised causal pathway.*

**`bernal_etal_2017`** — Bernal, James Lopez and Cummins, Steven and Gasparrini, Antonio. Interrupted time series regression for the evaluation of public health interventions: a tutorial (2017)
  <https://doi.org/10.1093/ije/dyw098>

  *High confidence for ITS requirements: a clearly defined interruption point, autocorrelation handling, and the value of a control series.*

**`callaway_santanna_2021`** — Callaway, Brantly and Sant'Anna, Pedro H. C.. Difference-in-differences with multiple time periods (2021)
  <https://doi.org/10.1016/j.jeconom.2020.12.001>

  *High confidence. Group-time average treatment effects; one of the estimators offered under the staggered-adoption design.*

**`cattaneo_etal_2020`** — Cattaneo, Matias D. and Idrobo, Nicol\'as and Titiunik, Roc\'\io. A Practical Introduction to Regression Discontinuity Designs: Foundations (2020)
  <https://doi.org/10.1017/9781108684606>

  *High confidence for bandwidth selection and for the point that effective sample size near the cutoff, not total N, governs precision.*

**`goodman_bacon_2021`** — Goodman-Bacon, Andrew. Difference-in-differences with variation in treatment timing (2021)
  <https://doi.org/10.1016/j.jeconom.2021.03.014>

  *High confidence. Shows two-way fixed effects under staggered adoption is a weighted average that can place negative weights on some comparisons — the basis for warning on estimator choice rather than on the design.*

**`hernan_robins_2020`** — Hern\'an, Miguel A. and Robins, James M.. Causal Inference: What If (2020)

  *High confidence. The reference for exchangeability, positivity and consistency as the identifying conditions behind selection-on-observables designs, and for the g-methods.*

**`imbens_lemieux_2008`** — Imbens, Guido W. and Lemieux, Thomas. Regression discontinuity designs: A guide to practice (2008)
  <https://doi.org/10.1016/j.jeconom.2007.05.001>

  *High confidence for the sharp/fuzzy distinction and the requirements of a credible discontinuity design.*

**`lee_etal_2022`** — Lee, David S. and McCrary, Justin and Moreira, Marcelo J. and Porter, Jack. Valid t-ratio Inference for IV (2022)
  <https://doi.org/10.1257/aer.20211063>

  *High confidence. Directly relevant to the first-stage F convention: shows the conventional F > 10 rule of thumb is not a sufficient basis for valid inference, which is why the specification carries that threshold as a warning with its range rather than as a blocker.*

**`li_etal_2018`** — Li, Fan and Morgan, Kari Lock and Zaslavsky, Alan M.. Balancing covariates via propensity score weighting (2018)
  <https://doi.org/10.1080/01621459.2016.1260466>

  *High confidence. Overlap weights as the response to limited common support, and the basis for treating weighting as failing on positivity where matching fails on covariate richness.*

**`magenta_book`** — HM Treasury. The Magenta Book: central government guidance on evaluation (2020)
  <https://www.gov.uk/government/publications/the-magenta-book>

  *Updated 2026; Test and Learn Annex 2026. High confidence as the reference for stage vocabulary (Explore, Co-design, Test, Grow) and for the general evaluation framing. Cited as published guidance, not as endorsement.*

**`mayne_2001`** — Mayne, John. Addressing Attribution Through Contribution Analysis (2001)

  *High confidence for contribution analysis as a theory-based approach that does not require a counterfactual. Supports the parallel-strand treatment rather than placement on the counterfactual ladder.*

**`mccrary_2008`** — McCrary, Justin. Manipulation of the running variable in the regression discontinuity design: A density test (2008)
  <https://doi.org/10.1016/j.jeconom.2007.05.005>

  *High confidence. The basis for treating an untested running variable as a condition to discharge rather than an assumption to grant.*

**`pawson_tilley_1997`** — Pawson, Ray and Tilley, Nick. Realistic Evaluation (1997)

  *High confidence for realist evaluation and the context-mechanism-outcome framing, including its dependence on stakeholder access.*

**`rob2`** — Sterne, Jonathan A C and Savovi\'c. RoB 2: a revised tool for assessing risk of bias in randomised trials (2019)
  <https://doi.org/10.1136/bmj.l4898>

  *High confidence. Used for the risk-of-bias domain structure applied to randomised designs — randomisation process, deviations from intended intervention, missing outcome data, measurement, selective reporting.*

**`robins_etal_2000`** — Robins, James M. and Hern\'an, Miguel \'Angel and Brumback, Babette. Marginal structural models and causal inference in epidemiology (2000)
  <https://doi.org/10.1097/00001648-200009000-00011>

  *High confidence. Establishes that conventional adjustment is biased where confounders are affected by prior treatment, which is what makes the g-methods a distinct design rather than an estimator choice.*

**`robins_i_v2`** — ROBINS-I Development Group. ROBINS-I V2: Risk Of Bias In Non-randomised Studies of Interventions (2025)
  <https://www.riskofbias.info/welcome/robins-i-v2>

  *DRAFT dated 20 November 2025. Medium confidence pending the final release. Used for risk-of-bias domain structure. Revisit when final; the version date is recorded so the dependency is visible.*

**`stuart_2010`** — Stuart, Elizabeth A.. Matching methods for causal inference: A review and a look forward (2010)
  <https://doi.org/10.1214/09-STS313>

  *High confidence for matching requirements and for balance assessment as the characteristic diagnostic.*

**`sun_abraham_2021`** — Sun, Liyang and Abraham, Sarah. Estimating dynamic treatment effects in event studies with heterogeneous treatment effects (2021)
  <https://doi.org/10.1016/j.jeconom.2020.09.006>

  *High confidence. Interaction-weighted estimator; an alternative to Callaway-Sant'Anna under the same design.*

**`vanderweele_ding_2017`** — VanderWeele, Tyler J. and Ding, Peng. Sensitivity analysis in observational research: Introducing the E-value (2017)
  <https://doi.org/10.7326/M16-2607>

  *High confidence. Supports requiring a sensitivity analysis, rather than a blocker, where confounders are known to be unmeasured.*

**`wagner_etal_2002`** — Wagner, Anita K. and Soumerai, Stephen B. and Zhang, Fang and Ross-Degnan, Dennis. Segmented regression analysis of interrupted time series studies in medication use research (2002)
  <https://doi.org/10.1046/j.1365-2710.2002.00430.x>

  *Medium confidence for the commonly cited minimum of roughly eight time points per segment. This is a practical convention, not a derived threshold, and is presented in the tool as a range with its source.*

**`whatworks_sms`** — What Works Centre for Local Economic Growth. The Maryland Scientific Methods Scale (SMS) (2016)
  <https://whatworksgrowth.org/resource-library/the-maryland-scientific-methods-scale-sms/>

  *High confidence for the five-level ranking itself. The mapping from individual designs to levels is the contested part: the scale was written for appraisal of completed studies, not for prospective design choice, and several placements are read differently across the literature.*
