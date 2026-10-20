# Phase 4.1 — the id mapping, for review

**Status: proposed, not implemented.** Nothing in the code has changed. This is the
content audit that phase 4 depends on; everything else in phase 4 is mechanical once it is
signed off.

Phase 4's acceptance test is that an answer given in one tool is prefilled in every other.
That cannot be built until the three vocabularies in use today are resolved onto the one in
`spec/questions.yaml` — and most of that is a methodological judgement rather than a
rename.

---

## 1. What exists now

Three separate vocabularies, 62 ids, describing overlapping facts:

| Vocabulary | Count | Where | Shape |
|---|---|---|---|
| `p*_` | 43 | the seven assessment sections | radios, numbers and free text |
| `screen_*` | 6 | Section 4 design screens | yes/no |
| `q_*` | 13 | the Design Finder | radios |

Against `spec/questions.yaml`: **63 questions**.

The two trees are not in this list. They hold no answers — `DecisionTree.jsx` keeps a
traversal position in local state and nothing is persisted. Only their opening question has
a counterpart in the specification (below).

**The headline number: 27 of the 63 specification questions have a predecessor. 36 are
new.** That is not drift. The old tool asked one bundled question where identification
needs two or three — "is there a plausible comparison group *with* pre-intervention outcome
data?" is two conditions behind one yes/no, which is precisely why the old screens could
not tell a strong design from a weak one.

---

## 2. Direct maps — 20 ids

Same question, same meaning. These need a rename and nothing else.

| Old id | Spec id | Note |
|---|---|---|
| `p3_defined` | `intervention_defined` | identical, yes/partial/no both sides |
| `p3_toc` | `theory_of_change` | identical |
| `p3_scale` | `maturity` | identical |
| `p3_equipoise` | `equipoise` | identical |
| `q_defined` | `intervention_defined` | **collides with `p3_defined`** — see §7 |
| `q_toc` | `theory_of_change` | collides with `p3_toc` |
| `q_scale` | `maturity` | collides with `p3_scale` |
| `q_prospective` | `prospective` | collides with `p1_prospective` |
| `q_comparison` | `comparison_group` | |
| `q_stagger` | `staggered_rollout` | yes/planned both sides |
| `q_threshold` | `assignment_threshold` | |
| `q_instrument` | `instrument_available` | |
| `q_covariates` | `covariate_richness` | yes/partial/no → rich/partial/sparse |
| `q_predata` | `pre_periods` | many/none → many/few/one/none, a widening |
| `q_randomisation` | `randomisation_barriers` | none/partial/high → none/some/high/impossible |
| `p5_confounder_confidence` | `confounders_measured` | |
| `p7_analysis` | `analysis_approach` | freq/bayes → nhst/bayesian/both/undecided |
| `p7_attrition` | `expected_attrition` | |
| `p7_predata` | `pre_periods` | yes/no → a four-point band |
| `p7_bayes_prior` | `bayes_prior_source` | |

**Eleven of the Design Finder's thirteen questions map directly.** That is the clearest
evidence the consolidation holds: the Finder was already asking the right questions under
the wrong names.

---

## 3. Splits — one old question becomes two or three

Each of these bundled conditions that have to be judged separately. **This is where the
redesign earns its keep**, and each split needs confirming.

| Old id | Asked | Becomes |
|---|---|---|
| `screen_did` | "a plausible comparison group **with** pre-intervention outcome data?" | `comparison_group` + `pre_periods` + `parallel_trends_evidence` |
| `screen_rd` | "a continuous assignment variable **with** a known threshold?" | `assignment_threshold` + `threshold_enforced` + `density_near_cutoff` |
| `screen_iv` | "a plausible instrument — affects take-up, no direct effect?" | `instrument_available` + `instrument_strength` + `exclusion_restriction` |
| `screen_its` | "a clear intervention date **and** sufficient time series?" | `policy_date_known` + `time_points` + `autocorrelation_plan` |
| `screen_match` | rich covariates? | `covariate_richness` + `overlap` |
| `screen_gmethod` | time-varying confounding? | `time_varying_confounding` + `repeated_measures` |

A `screen_*` answer of `yes` cannot be migrated — it asserts two or three things at once
and we cannot tell which the user meant. **Recommendation: do not migrate `screen_*`
values. Treat them as unanswered.** Under three-valued logic that is honest: the designs
go Unknown rather than inheriting a verdict from a question nobody actually answered.

---

## 4. Merges — several old ids become one

| Old ids | Spec id | Note |
|---|---|---|
| `p7_power_done` + `p7_freq_alpha` | `nhst_alpha_power` | the old pair asked whether it was done and what alpha was; the spec asks whether both were agreed |
| `p7_mde` + `p7_mde_unit` | `nhst_mde` | numeric + unit → agreed / informal / not_set |
| `p7_predata` + `p7_pre_timepoints` | `pre_periods` | yes/no plus a count → one band |
| `p1_toc` + `p3_toc` | `theory_of_change` | **not strictly the same question** — see §7 |

---

## 5. Drops — and why

### 5a. The assumption scores — `p3_exchangeability`, `p3_positivity`, `p3_consistency` (and their three `_rationale` fields)

**Recommendation: drop. This is the most consequential item here.**

These three fed the global `assumptionScore`, a mean applied as a multiplier to every
quantitative design's causal score. The robustness ladder replaces that idea outright:
**the identifying assumption is a property of the design's tier, not something the user
rates.** A randomised design gets exchangeability from randomisation; asking the user to
score it, and then multiplying a comparison-group design's score by their answer, is the
compensatory logic the redesign exists to remove.

If they are kept, they must be kept as something other than a score.

### 5b. `p7_n` — estimated total sample size

**Recommendation: drop from the answer store.**

The specification deliberately has no numeric N question. N now lives in the
ready-reckoner, in local state that is never written to the store, so a sample size cannot
reach a verdict. Migrating `p7_n` into the store would reopen exactly that path.

### 5c. `q_sample` (tiny/small) and `q_constraint` (time/data/budget/ethics)

`q_sample` is superseded by the statistics module, which asks what plays the role of N per
design rather than for a total.

`q_constraint` has no equivalent and never reached a rule. **This one is a genuine
question for you:** a primary constraint of "ethics" or "budget" is real information about
what is feasible. Add it to the specification, or drop it?

---

## 6. Questions with no spec equivalent — add, or drop?

Each of these was asked, is methodologically real, and has nowhere to go. **These are the
decisions I cannot make for you.**

| Old id | Asked | My view |
|---|---|---|
| `p3_consistent` | Is the intervention delivered consistently across sites or practitioners? | **Add.** Implementation fidelity bears directly on what the estimand means, and it is not covered by `maturity`. |
| `p6_linkage` | Can the exposure and outcome data be linked at individual level? | **Add.** A hard constraint — unlinkable data blocks every individual-level design, and nothing currently asks it. |
| `p6_missing` | Expected level of missing data in the primary outcome | **Add, separately from `expected_attrition`.** Missingness in a measure is not the same as loss to follow-up, and conflating them would be wrong. |
| `q_constraint` | Primary constraint: time / data / budget / ethics | **Your call.** Real, but it routes rather than identifies. |
| `p1_policy_decision` | What policy decision will this inform? | Keep as metadata (§8), though `claim_type` covers part of it. |

---

## 7. Collisions and near-misses — the ones to look at twice

**Four questions exist in both vocabularies and must resolve to one answer.** This is the
documented defect — `q_defined` in the Finder and `p3_defined` in the assessment could hold
different values and reach different conclusions from the same facts. Merging them is the
fix. But if a save file holds both and they disagree, something has to give.

**Recommendation: on load, if the two disagree, keep neither and leave the question
unanswered,** with a warning naming it. Silently preferring one would hide a real
contradiction in the user's own answers.

**`p1_toc` and `p3_toc` are not the same question.** `p3_toc` asks whether a theory of
change exists; `p1_toc` asks whether the *research question links to* it. The second is a
coherence check, not an existence check. Merging them loses that. **Recommendation: map
`p3_toc` → `theory_of_change` and treat `p1_toc` as a §8 annex note, or add a question.**

**`p1_prospective` has a `maybe` that `prospective` does not.** The spec offers yes/no
only. `maybe` is currently answered by a quarter of a page of free text
(`p1_prospective_detail`). Forcing it to yes/no changes what is asked. **Recommendation:
add a third option to `prospective`** rather than discard the distinction — but it touches
the RCT blockers, so it needs a rules pass and a spec-version bump.

---

## 8. Free text — the annex question

Seventeen free-text and metadata fields carry no answer the engine could read, but they are
what a reviewer actually reads:

`p1_title`, `p1_overview`, `p1_rq`, `p1_policy_decision`, `p1_deadline`,
`p1_prospective_detail`, `p1_toc_detail`, `p5_dag`, `p5_dag_key`, `p5_confounders`,
`p5_mediators`, `p5_colliders`, `p5_competing`, `p5_unmeasured`, `p6_gaps`,
`p7_power_detail`, `p7_bayes_prior_source`

Plus `dataRows`, the structured Section 6 data inventory, which is not a flat id at all.

**Recommendation: keep project metadata and the DAG narrative as a separate `notes` object
in the save file, outside `answers`.** The engine never reads it; exports and the reviewer
pack do. That keeps the answer store exactly what the engine consumes — which is the
property the whole redesign rests on — without throwing away the user's reasoning.

The DAG elicitation (`p5_confounders` / `p5_mediators` / `p5_colliders` / `p5_competing`)
is a structured exercise the specification does not model. It is good practice and it
produces nothing the engine uses. **Your call: annex, or build it into the spec as its own
module?**

---

## 9. What I need from you

| # | Decision | Blocks |
|---|---|---|
| 1 | Drop the three assumption scores (§5a) | the whole mapping — it is the compensatory-scoring question |
| 2 | Drop `p7_n` from the store (§5b) | the reckoner's isolation guarantee |
| 3 | Do not migrate `screen_*` values (§3) | whether old save files carry verdicts forward |
| 4 | Add `p3_consistent`, `p6_linkage`, `p6_missing` to the spec (§6) | a spec-version bump and a rules pass |
| 5 | `q_constraint` — add or drop (§5c) | small |
| 6 | Add `maybe` to `prospective` (§7) | the RCT blockers; a rules pass |
| 7 | `p1_toc` — annex note or new question (§7) | small |
| 8 | Collision rule: disagreement leaves it unanswered (§7) | the save-file loader |
| 9 | Free text as a separate `notes` object (§8) | the save format, and exports |
| 10 | The DAG module — annex or spec (§8) | the largest of the optional items |

Decisions 1, 2 and 3 are the ones that matter. The rest can be settled as the migration
proceeds.

---

## 10. What happens once this is signed off

4.2–4.6 are mechanical:

1. Write the agreed mapping into `spec/migration.yaml`, validated like every other spec
   file, so an old save file can be loaded and a test can assert the mapping is total.
2. Migrate the seven sections, the Design Finder, the Question Framework and both trees to
   `useAnswers()`.
3. Add the prefill test — answer in one tool, assert prefilled in another. That is phase
   4's acceptance criterion, and it is not met until it exists.
