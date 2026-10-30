# Target architecture

**Status: §2 and §7 are settled and implemented in `spec/`. The rest is proposed.** This is the shape the app takes once phases 4
and 5 complete, and the decisions it needs. Read alongside
[`REDESIGN_PLAN.md`](REDESIGN_PLAN.md) (what the redesign is doing) and
[`ID_MAPPING.md`](ID_MAPPING.md) (the question-vocabulary audit it depends on).

The brief it serves: **a tool light enough to screen quickly what could be possible, and
to say where further effort should go to establish the rest.**

---

## 1. The shape

One assessment, one answer store, one engine. Everything else is a front door or a guide.

| | Now | Target |
|---|---|---|
| **Front door** | Landing page: three tool cards, equal weight | Landing page asks **one consequential question** — `claim_type` — and routes |
| **Assessment** | Seven numbered sections, scored | **The ladder**, with a screening checkpoint partway |
| **Quick screen** | Design Finder, a separate tool with its own 13 questions | **The ladder's first 14 questions.** No separate tool |
| **Question typing** | Question Framework + two decision trees, three cards | **One "what kind of question is this?" tool**, reached when `claim_type` is not causal |
| **Ideal Trial, DAG** | Sections 3 and 5, gated, feeding a score | **Guides** that produce notes, never verdicts |
| **Results** | Scored ranking at `/results` | The ladder page, plus the **downloadable report** (built) |

The governing rule: **anything that does not change a verdict does not belong in the
assessment flow.** It belongs on the landing page, in a guide, or in the notes annex.

---

## 2. The router is a scope gate, not a classification

**Corrected.** The first version of this document, and the `routing` block in
`spec/stages.yaml` it was based on, routed `claim_type: describe` to the qualitative
strand and `predict` to the quantitative tree. That was wrong twice over:

- **It confused a quantitative descriptive question with qualitative research.** The two
  taxonomies in `questionFrameworkData.js` each carry their own categories —
  `quantData` has Description, Prediction and Causal Inference; `qualData` has six of its
  own, including *Evaluative — Impact*. "What is the prevalence?" is a quantitative
  descriptive question, not a qualitative one, and qualitative impact work exists.
- **It implied impact evaluation is only counterfactual.** The design register carries a
  theory-based strand precisely because it is not.

Those three categories are how quantitative research questions are typed. They are not a
map of qualitative research, impact evaluation and prediction onto three tools.

### What it asks instead

`claim_type` now asks only whether the tool applies:

> Is your research question a causal one — establishing what effect an intervention or
> policy caused?
>
> This tool covers impact evaluation: establishing what effect was caused by an
> intervention or policy. That can be approached with counterfactual designs or with
> theory-based ones, and both are covered here.

| Answer | Route |
|---|---|
| **Yes** — establishing what effect an intervention or policy caused | the assessment |
| **No** — my question is about something else | question-typing tool, which points to the methods that do address it |
| **Not sure** | question-typing tool, then back to the assessment if it turns out to be causal |

`unsure` carries `not_established: true`, consistent with the rest of the specification:
not having settled what kind of question you have is a real answer, and the tool's response
is to help settle it rather than to make the user guess.

**This is a scope gate, not a taxonomy.** Classifying the question is what the
question-typing tool is for, and asking the user to do it at the front door asks them to
classify before they have the vocabulary to. The tools become the destination for anyone
who cannot answer the gate — not three parallel entrances.

Tests assert that a non-causal answer never reaches the assessment, that `unsure` routes to
question typing, and that no route keys on `describe` or `predict` any more.

## 3. The Design Finder becomes the ladder's screening checkpoint

Not a branch. The first stretch of the one flow, with an explicit stopping point.

### The evidence that this loses nothing

Ranking every question by how many blockers it can fire gives the structural
discriminators. The set that falls out — intake plus the ungated, `ex_ante`, high-coverage
questions — is **14 questions**. The Design Finder asks **13**.

**Eleven are the same question.**

| Design Finder | Spec id | In the engine-derived screen |
|---|---|---|
| `q_defined`, `q_toc`, `q_scale` | `intervention_defined`, `theory_of_change`, `maturity` | yes |
| `q_prospective`, `q_randomisation` | `prospective`, `randomisation_barriers` | yes |
| `q_predata`, `q_comparison`, `q_stagger` | `pre_periods`, `comparison_group`, `staggered_rollout` | yes |
| `q_threshold`, `q_instrument`, `q_covariates` | `assignment_threshold`, `instrument_available`, `covariate_richness` | yes |
| `q_sample` | — | superseded by the statistics module |
| `q_constraint` | — | **open decision, §7** |

The screen adds three the Finder missed: `claim_type` (the router), `allocation_unit`
(2 blockers) and `policy_date_known` (3 blockers).

The Design Finder was already asking the right questions under the wrong names. Folding it
in costs one question set to maintain instead of two, and removes the possibility of the
two disagreeing.

### What the screen produces

Measured on the real engine, three profiles, 13 answers each:

| Profile | Ruled out | Still live | Highest live rung | Outstanding |
|---|---|---|---|---|
| Retrospective, admin data, comparison group | 9 of 19 | 10 | Tier 3 | 12 |
| Prospective pilot, can randomise | 4 | 15 | Tier 1 | 16 |
| National rollout, no comparison, eligibility cutoff | 9 | 10 | Tier 2 | 13 |

Each gets a distinct, correct, actionable answer, and the right next three questions.

### The thing the UI has to get right

**The ladder is fast at ruling out and slow at ruling in.**

| Questions answered | Ruled out | Feasible |
|---|---|---|
| 4 | 6 of 19 | 0 |
| 9 | 9 | 0 |
| 12 | 10 | 0 |

Nothing is feasible even at twelve answers. So the screening output cannot be "here is
your design". It is **"here is what is out, here is what is still live, here is what to go
and establish"** — which is the brief.

This means the current ladder page is framed wrongly for screening: it leads on "highest
feasible rung", which stays empty for a long time and reads as failure. The screening
checkpoint should lead on what has been *settled*, not on what has not.

**Stopping at the checkpoint must be a first-class outcome**, not an unfinished
assessment: a complete screening report, downloadable, with the open questions listed.

---

## 4. The landing page

Three equal tool cards become one question and a short route.

**Above the fold:** what the tool is for, and `claim_type`.

- **causal** → the ladder (screening checkpoint first)
- **predict** → the quantitative strand
- **describe** → the qualitative strand

**Below:** the research-question material — project title, overview, the question itself,
the policy decision it informs, the deadline. None of it reaches the engine; all of it
reaches the report. It is an opinionated workflow for defining the question, which is
what it was always doing.

**Merging the Question Framework and the trees.** `questionFrameworkData.js` exports
`quantData` whose three top-level types are **Description, Prediction, Causal Inference** —
the same three values as `claim_type`. The Framework's quantitative half *is* `claim_type`,
expanded into a taxonomy. The trees reach the same categories by traversal instead of
browsing.

So: **one tool, two ways in.** Answer a few questions, or browse the taxonomy. One body of
content (`questionFrameworkData.js` already holds both halves), one destination. That
replaces three cards and roughly 850 lines across four components with one.

---

## 5. Ideal Trial and the DAG become guides

Both are good practice. Neither produces anything the engine reads. Keeping them as gated,
numbered sections implied they were part of the verdict, which was a category error.

- **Ideal Trial** — a guide to specifying the estimand before choosing a design. Linked
  from the ladder, at the point where the estimand starts to matter.
- **DAG** — a guide to the adjustment set, with the free-text elicitation retained.

Both write to the **notes annex**, not to `answers`.

### The notes annex

`ID_MAPPING.md` §8 proposed this for the seventeen free-text fields; it is the same
mechanism.

```
save file
├── answers   what the engine reads — spec question ids only
└── notes     project metadata, the research question, the DAG narrative,
              data-source inventory, free-text rationale
```

The engine never sees `notes`. The report renders it. That keeps the answer store exactly
what the engine consumes — the property the whole redesign rests on — without discarding
the user's reasoning, which is what a reviewer actually reads.

---

## 6. What happens to each existing piece

| Piece | Fate |
|---|---|
| `PageLadder` | **Becomes the assessment.** Off the Tools list, onto the landing page |
| Seven numbered sections | **Retired** once their non-duplicated content has a home (§7) |
| `ResultsPage`, `src/scoring/`, `useAppState` | **Deleted.** `ResultsPage` imports `WEIGHTS`/`CATEGORY_CEILINGS`, so it goes first |
| `PageDesignFinder` (602 lines) | **Deleted.** Becomes the screening checkpoint |
| `PageQuestionFramework` + both trees | **Merged** into one question-typing tool |
| `questionFrameworkData.js` | **Kept** — it is the taxonomy |
| `quantTreeData` / `qualTreeData` | Kept as the traversal into the taxonomy |
| `tteComponents.js` | **Superseded** by `spec/guides.yaml`; deleted with its section |
| `exportToolResult.js` | **Deleted** once the tools that use it are gone; the report replaces it |
| `src/report/` | **Built.** Nothing further needed |

---

## 7. Decisions

| # | Decision | Status |
|---|---|---|
| 1 | The router | **Settled — scope gate** (§2). `claim_type` reframed, routing rewritten, old mapping removed |
| 2 | `q_constraint` | **Settled — add.** Now `primary_constraint`, and structurally unable to change a verdict (below) |
| 3 | The three missing questions | **Partly settled.** `delivery_consistency` added; `p6_linkage` and `p6_missing` open (below) |
| 4 | Screening checkpoint | **Settled — derived**, from `establishable` and blocker coverage, so it cannot drift |
| 5 | Screening report | **Settled — the full report**, which already handles "nothing feasible yet". Revisit later |
| 6 | App version | **Settled — 0.8.0**, applied at switchover, not before |

### `primary_constraint` — advice, never feasibility

Time, data, budget or ethics. The original Design Finder used it to reorder the shortlist.
That is exactly the compensatory trade-off the ladder replaced: a deadline does not make a
weaker design more valid, and because cost and speed both favour the lower rungs, a
constraint that reordered anything would reorder it downwards.

So it is returned as advisory guidance keyed to the answer, in a `guidance` block the
engine reads only after every verdict is settled. Tests assert that the designs, the
ladder, the recommendation and the question agenda are **byte-identical** whatever is
answered, and that no design rule mentions it at all — the same isolation the context packs
and the ready-reckoner already carry.

### `delivery_consistency` — added

Asked after `maturity`, as a readiness **warning** rather than a gate, with two notes: one
for inconsistent delivery, one for not having checked. Inconsistent delivery does not make
evaluation impossible — it changes what the estimand means, from the effect of the
intervention as specified to its effect as delivered. That has to be stated in the protocol
rather than discovered afterwards, which is a warning's job, not a gate's.

### Settled: the data-sources guide, `record_linkage` and `outcome_missingness`

**The guide: yes.** A place to map data sources — names, owners, access routes, coverage,
dates — is genuinely notes. It produces nothing the engine reads and belongs with the Ideal
Trial and DAG guides.

**But the two questions did not move into it**, for different reasons, and both are now in
the specification:

- **`record_linkage`** is a ladder question with rules. Whether treatment and outcome can
  be brought together is a structural constraint: with no linkage at all only `its` and
  `rdit` survive, and with group-level linkage only the nine designs that compare
  individuals by construction are ruled out. That is a blocker, and a blocker has to be a
  ladder question. 45 rules, pinned by test.
- **`outcome_missingness`** went into the statistics module beside `expected_attrition`,
  not merged with it — a unit leaving the study and a record with an empty outcome field
  are different events. It raises a tension under each approach, and the two say different
  things.

**Built.** `spec/guides.yaml` declares all three guides — ideal trial, causal diagram, data
source inventory — rendered by one component at `/guide/:guideId`. The notes annex is in
the answer store and the save file, and the report renders it.

## 8. Sequencing

Nothing here can start with deletion. The sections are currently the only place some
answers can be given.

1. **Settle the `ID_MAPPING.md` decisions** — particularly dropping the three assumption
   scores and not migrating `screen_*` values.
2. **Add the three missing questions** (decision 3). Useful regardless of what else
   happens, and it is the hard dependency.
3. ~~Build the notes annex~~ — **done**, along with all three guides.
4. **Migrate the tools to the shared store** (phase 4.2–4.6), ending with the prefill
   test, which is phase 4's acceptance criterion.
5. **Add the screening checkpoint** to the ladder.
6. **Rework the landing page** and merge the question-typing tools.
7. **Retire the sections**, delete `src/scoring/`, `ResultsPage` and `useAppState`.
8. **Switch `/ladder` to `/`**, and `BrowserRouter` while touching routing anyway.

Steps 2 and 3 are independent of the rest and could start now.
