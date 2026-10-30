# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this project is

A static React/Vite single-page application for assessing which impact evaluation designs
are feasible given a set of constraints, which are ruled out and why, and where to put the
effort to establish the rest. Designs are ranked by the assumption that makes their
comparison valid — the robustness ladder — and **nothing is scored**. There is no backend;
everything runs in the browser.

The methodology lives in `spec/`, not in JavaScript, so a rule change appears everywhere at
once and a methodologist can read it without reading code.

Prototype v0.8.0. Not for public release.

> **Redesign complete through phase 7.** See `docs/REDESIGN_PLAN.md` and
> `docs/TARGET_ARCHITECTURE.md`. Work happens on the `redesign` branch; `dev` and `main`
> still serve the previous tool until this is merged.

## Commands

```
npm install        # Install dependencies (Node 20+ required)
npm run dev        # Start dev server at http://localhost:5173/
npm run build      # Build to dist/ (static files, no server required)
npm run preview    # Serve the dist/ build locally for final checks

npm test           # Vitest, single run
npm run test:watch # Vitest, watch mode
npm run spec:check # Validate spec/ against its JSON Schemas
npm run pack       # Regenerate the reviewer pack from spec/
npm run pack:check # Fail if the committed pack has drifted from spec/
npm run check      # spec:check + pack:check + test + build — what CI runs
```

CI (`.github/workflows/ci.yml`) runs `spec:check`, `pack:check`, `test` and `build` on
every push and pull request. There are no linting scripts.

---

## Architecture

### State management

One store, `src/state/AnswersContext.jsx`, holding two objects kept deliberately apart:

- **`answers`** — question id to value, from `spec/questions.yaml`. This is what the engine
  is passed, and the only thing that can reach a verdict.
- **`notes`** — guide fields, from `spec/guides.yaml`. Carried into the report, never into
  a verdict. See *The guides and the notes annex*.

`result` is `evaluate(answers, spec)`, recomputed on change. The engine is pure and the
spec static, so it is the only derived state in the app.

### Routing

`BrowserRouter` with real paths, served by the SPA fallback in `public/_redirects` and, in
the installed app, by `navigateFallback` in the service worker.

| Route | What it is |
|---|---|
| `/` | The front door. Asks `claim_type` and routes |
| `/assessment` | The assessment: screening checkpoint, question agenda, ladder, statistics |
| `/question-type` | What kind of question is this — trees and taxonomy in one tool |
| `/guide/:guideId` | A guide from `spec/guides.yaml`, producing notes |

Everything the previous tool used — the seven numbered sections, `/results`,
`/design-finder`, the three question-typing routes, `/page1`–`/page7` — redirects to its
replacement rather than 404ing. `RETIRED` in `src/App.jsx` is the map.

**Old hash URLs still work.** The app used `HashRouter` from its GitHub Pages days, so
every shared link, bookmark and PWA-cached page looks like `/#/ladder`.
`src/state/LegacyHashRedirect.jsx` translates a leftover `#/...` into the equivalent path
on first load and replaces it in history. Breaking those silently would have been the worst
way to break a link.

### What was retired, and what replaced it

The seven numbered sections, the scored results page and the Design Finder are gone, with
`src/scoring/`, `useAppState`, the legacy bridge and their data — about 3,500 lines.

| Retired | Replaced by |
|---|---|
| 1. Research Question | The front door, and the project guide |
| 2. Causal Readiness | The assessment — readiness gates come from `spec/stages.yaml` |
| 3. Ideal Trial | The ideal trial guide |
| 4. Design Questions | The assessment's question agenda |
| 5. Adjustment & DAG | The causal diagram guide |
| 6. Data Sources | The data source inventory guide |
| 7. Statistical Feasibility | The statistics module |
| Results (scored ranking) | The ladder, and the downloadable report |
| Design Finder | The screening checkpoint |

**Nothing is scored.** There are no weights, ceilings or thresholds, and no `GATE_ENABLED`
flag — a readiness gate is a rule in `spec/stages.yaml`, not a switch in code.

### The app version

Injected from `package.json` by Vite as `__APP_VERSION__`. It had been copied into seven
places and had already drifted, so there is now one source of it. `buildReport.js` carries
a Node fallback because the report is tested outside Vite.

## Specification (`spec/`) — redesign

Questions, rules, tiers and citations live in reviewer-editable files rather than in
JavaScript, so a rule change appears in every tool at once. Added in phase 1; populated
in phase 2. See `docs/REDESIGN_PLAN.md`.

| File | Holds | Status |
|---|---|---|
| `spec/tiers.yaml` | The five robustness tiers, the theory-based strand, contested placements | Seeded |
| `spec/references.bib` | Every citation, with a confidence note | Seeded |
| `spec/designs.csv` | One row per design (not per estimator) — 22 designs | Seeded |
| `spec/questions.yaml` | Question bank shared by all tools — 67 questions | Seeded |
| `spec/rules.yaml` | Per design: blockers, conditions, warnings as JSON Logic — 179 checks | Seeded |
| `spec/stages.yaml` | Stage vocabulary, readiness gates, routing | Seeded |
| `spec/statistics.yaml` | NHST and Bayesian question sets — 10 questions and 6 tensions each | Seeded |
| `spec/packs/*.yaml` | Context packs: examples, benchmarks, vocabulary | Phase 6 |
| `spec/schema/*.schema.json` | JSON Schemas (draft 2020-12) for the above | Done |

`scripts/validate-spec.mjs` validates each file against its schema and reports failures as
`file:line`, and enforces cross-file integrity. The build fails on:

- a **dangling citation** — a key cited anywhere that `references.bib` does not define
- a rule defined for a **design that is not in `designs.csv`**
- a rule or `applies_when` testing a **question that is not in `questions.yaml`**
- a rule comparing a question against an **option value it does not offer**
- a readiness gate, stage inference rule or route in `stages.yaml` reading a question that
  does not exist, or concluding a stage that is not defined

The option-value check is the subtle one: a typo'd value makes a blocker silently never
fire, which surfaces as a design looking Feasible when it has simply never been checked.

**Every question is consumed.** All 67 reach a rule test, a gating condition, a readiness
gate, the stage inference, a route or the statistics module — asserted by test. The previous tool collected 80
inputs and scored on 23, so this is checked rather than assumed.

### Stages and readiness

`spec/stages.yaml` holds the **single** stage rule, and every tool now reads it — see
`StageTags` below for how the trees were brought onto it, which they were not before.

Two hard gates (intervention specification, theory of change) and one warning (maturity).
A gate means impact evaluation cannot answer the question yet whatever the data situation,
so it fires before any design is considered. Maturity warns and redirects rather than
blocking, because a settled component of a partly-scaled intervention can still support a
Test-stage evaluation. Every gate carries a redirect — a gate without an alternative is a
dead end.

**The Grow-only contradiction is resolved here.** The previous tool implemented stage
logic in three places that disagreed: the quantitative tree tagged RCT, DiD, RD, ITS and
IV as Grow-stage only, while the Design Finder and Causal Readiness page said impact
evaluation suits Test and Grow. The resolution follows the Test and Learn annex — impact
evaluation designs are available at **both**. What differs is the estimand (a component or
mechanism at Test; the whole programme at Grow) and the decision it informs. Identification
requirements are identical, so no design is ever restricted to Grow. Tests assert that no
inference rule concludes Grow without also concluding Test, and that rule order keeps the
two gates ahead of maturity.

### The engine

`src/engine/evaluate.js` — `evaluate(answers, spec)`. Pure: no React, no I/O, no clock.
`scripts/lib/loadSpec.mjs` reads `spec/` for Node consumers, kept out of `src/engine` so
the engine stays usable in the browser with a spec bundled at build time.

`src/engine/logic.js` implements **three-valued** JSON Logic. This is where the central
guarantee lives. Under ordinary two-valued logic an unanswered variable reads as null, so
`{'==': [{var: 'prospective'}, 'no']}` returns false, the blocker does not fire, and a
design nobody has assessed presents as Feasible — exactly how the previous tool produced a
recommendation before anything was answered. Here an unanswered variable yields UNKNOWN,
propagated under Kleene's strong logic, so `or` still resolves when one branch is known
true. Supported operators are `var`, `==`, `!=`, `in`, `and`, `or`, `!`; anything else
throws rather than quietly returning false, and a test asserts the spec uses no others.

`evaluate()` returns the stage, readiness (tri-state: `passed` / `failed` / `undetermined`
— no gate having fired is not the same as readiness being established), every design with
its state, blockers, conditions, warnings and outstanding questions, the ladder, the
highest feasible tier, the next rung up with what would unlock it, the theory-based role,
the ordered question agenda, and the active routes.

The seven golden scenarios in `tests/golden-scenarios.test.mjs` are phase 2's acceptance
test. They are mutation-verified: making the logic two-valued, taking the best state
instead of the worst, or letting a fired gate through all break them.

### The statistics module

`spec/statistics.yaml`. Asks for the analytical approach first, then gives each approach
its own question set. Sample size does a different job under each, so the Bayesian
questions are **not** translations of the frequentist ones.

Both branches carry **10 questions and 6 tensions**, asserted by test, so the Bayesian half
cannot quietly become the thinner one. Research behind it is in
`docs/BAYESIAN_SAMPLE_SIZE.md`.

The framing the Bayesian branch exists to carry: *a small sample does not invalidate a
Bayesian inference — it means the prior supplies more of the answer.* That is acceptable
where the prior can be defended and not otherwise, so the questions make the prior's
contribution explicit: where it came from, by what elicitation protocol, what share of the
posterior it supplies, and what happens if it conflicts with the data. The
`prior_doing_the_work` tension names the failure this guards against — Bayesian methods
chosen to rescue an underpowered study rather than because the decision is probabilistic.

Tensions are raised **as questions to take to a statistician, never as verdicts**, each
carrying a `prompt`. A tension whose condition is unresolved is not raised, the same
guarantee the design verdicts rely on.

`design_quantities` records what plays the role of N per design, because total sample size
is frequently the wrong quantity — observations near the cutoff for a discontinuity design,
clusters rather than people for a cluster trial, effective sample size after weighting.

**The engine never reads the ready-reckoner.** It is declared in the spec so the UI can
render it, and `evaluate()` ignores it entirely, so an illustrative figure can never reach a
verdict. Two tests enforce this: output is identical when the ready-reckoner is replaced
wholesale, and the engine source contains no reference to it.

### The statistics UI

`src/components/statistics/` renders the module. `StatisticsModule.jsx` shows the shared
questions, the undecided comparison, each branch with its questions and tensions, and what
counts as the sample per design. It is rendered on `/ladder` after the ladder and withheld
when a readiness gate has fired.

`ReadyReckoner.jsx` is the opt-in panel; `readyReckoner.js` holds its arithmetic, free of
React, the engine and the spec bundle. The isolation runs both ways: the engine cannot read
the reckoner, and the panel **never writes to the answer store**, so a sample size typed
into an illustration cannot reach a verdict by the back door. `tests/ready-reckoner.test.mjs`
asserts both directions, and both guards are mutation-verified.

The arithmetic is the textbook normal approximation for a two-arm comparison and returns
its assumptions alongside every figure. Two deliberate refusals: a time-to-event outcome
produces no figure at all, because power there is driven by events rather than people and a
sample-size calculation would be wrong in a way that looks plausible; and a blank numeric
field is parsed as missing rather than as zero, since `Number('')` is `0` and the lazy
version reintroduces exactly the defect the redesign exists to remove.

### Prospective feasibility

The tool assesses what can be established **before** the data exist. Some questions cannot
honestly be answered until they do — overlap between treated and untreated units (which is
positivity), how many observations sit near a cutoff, how strong a first stage is.

Every question carries `establishable: ex_ante | needs_data`. Six are `needs_data`:
`overlap`, `density_near_cutoff`, `instrument_strength`, `parallel_trends_evidence`,
`threshold_enforced`, `threshold_manipulation`. Options meaning "I have not established
this yet" carry `not_established: true` — 32 of them, across both categories.

Three invariants hold this in place. The first two fail the build, the third is a test:

- **No blocker fires on a `not_established` value.** A blocker says the design cannot
  work; firing one on an unchecked value rules a design out on the strength of an absent
  answer. Not having checked is never the same as having found a problem. This is the
  mirror of the guarantee the three-valued logic provides.
- **Every `needs_data` question offers a `not_established` option.** Without one a user
  with no data must guess, and the guess then drives a condition as though it were a
  finding. `density_near_cutoff` failed this and was fixed.
- **Every unchecked value a rule reads discharges through a condition carrying `unlock`.**
  An honest "not yet" has to produce a task, otherwise it is indistinguishable from
  silence.

So `overlap: untested` leaves matching **Conditional** with "compare covariate
distributions before committing", while `overlap: poor` — an actual finding — blocks it.
The ladder UI marks a `needs_data` question so it does not read as an invitation to guess.

`tests/prospective-feasibility.test.mjs` pins the classification, so reclassifying a
question is a deliberate act.

### The shareable report

`src/report/buildReport.js` turns the engine's result into a self-contained HTML page for
someone who will never open the tool: what looks feasible and why, what else might be,
what is ruled out and why, and what to establish next. No scripts, no external assets,
prints cleanly.

Pure — the date is passed in, so the same inputs give the same bytes and the output is
testable. `downloadReport.js` holds everything touching Blob and the DOM.

What it must get right is **not overclaiming**. Early on, which is most of the time,
nothing is established as feasible: the report says so plainly and is still useful,
reporting what is already ruled out and what would change it. Tests assert it never prints
"Most likely to be feasible" without a recommendation, recommends nothing when a readiness
gate has fired, never leaks an internal question id to a stakeholder, and escapes
everything it renders. Both guards are mutation-verified.

It carries the spec version as well as the app version, so a report can be traced to the
rules that produced it.

### Scope gate and advisory guidance

`claim_type` is a **scope gate, not a classification**: it asks only whether the question
is causal, with `unsure` routing to the question-typing tool rather than making the user
guess. An earlier version routed `describe` to the qualitative strand and `predict` to the
quantitative tree, which confused a quantitative descriptive question with qualitative
research and implied impact evaluation is only counterfactual. Both are false — the two
taxonomies in `questionFrameworkData.js` carry their own categories, and the design
register has a theory-based strand. Tests assert no route keys on `describe` or `predict`.

`spec/stages.yaml` also holds a **`guidance`** block: advisory notes keyed to an answer,
currently for `primary_constraint` (time / data / budget / ethics). A practical constraint
shapes where to spend effort and must never shape what counts as a valid comparison —
letting a deadline reorder the ladder is the compensatory trade-off the redesign removed,
and since cost and speed both favour the lower rungs it would reorder downwards.
`activeGuidance()` runs after every verdict is settled, and `tests/guidance.test.mjs`
asserts the designs, ladder, recommendation and agenda are byte-identical whatever is
answered, and that no rule mentions it. The validator fails on guidance keyed to an option
the question does not offer — mutation-verified.

`delivery_consistency` is asked after `maturity` as a readiness **warning**, not a gate:
inconsistent delivery changes what the estimand means — the effect as delivered rather than
as specified — which has to be stated, not treated as disqualifying.

### Record linkage

`record_linkage` asks whether treatment status and outcomes can be brought together for
the same units. It is a structural constraint, not a data-quality note: an effect is a
contrast between outcomes with and without treatment, so estimating one requires observing
both on the same units. It rules designs out more sharply than most methodological
considerations do, which is why it is a ladder question with rules rather than a note in a
data-sources guide.

The partition, pinned by `tests/linkage.test.mjs`:

| Answer | Effect |
|---|---|
| **individual** | Nothing ruled out on linkage grounds |
| **group** — areas, sites, cohorts | Blocks the nine designs that compare individuals by construction. `rd_sharp` and `rd_fuzzy` are **conditional**, not blocked — an eligibility rule can apply to areas, with the estimand moving to that level |
| **no** | Blocks seventeen. Only `its` and `rdit` survive: a single outcome series and a known date need nothing joined |
| **unsure** | Blocks nothing; seventeen conditions, each with what to go and confirm |

`outcome_missingness` is asked alongside `expected_attrition` in the statistics module and
deliberately not merged with it — a unit leaving the study and a record with an empty
outcome field are different events, handled differently. It raises a tension under each
approach, and they are not translations of one another: the frequentist concern is bias
from a complete-case analysis, the Bayesian one is a prior buying precision the observed
records cannot support.

### The guides and the notes annex

`spec/guides.yaml` declares three guides — **ideal trial specification**, **causal diagram
and adjustment set**, **data source inventory** — rendered by one component,
`src/components/guides/PageGuide.jsx`, at `/guide/:guideId`. Adding a guide is a
specification change, not a new component.

**Guides produce notes, never answers.** They capture the reasoning a methods reviewer
reads without any of it reaching a verdict. The previous tool gated this material behind a
scored assessment, implying it was part of the verdict when it never was.

The separation is enforced four ways:

- Notes live in their **own object** in the answer store (`notes`, `setNote`), never merged
  into `answers`. `evaluate()` is passed answers and nothing else.
- The **engine source mentions neither `notes` nor `guides`** — asserted by test.
- The **save file keeps them in separate keys**, so a load cannot turn a note into an
  answer. A file saved before notes existed loads without warnings.
- The **validator refuses a guide field that shares an id with a question**, which is the
  only route by which a note could later be mistaken for an answer — and refuses a
  duplicate field id across guides, since notes are one flat object. Both
  mutation-verified.

Unlike answers, an **unrecognised note is kept rather than dropped** on load: it reaches no
rule, so there is nothing to validate it against and nothing downstream can act on it.

The report renders notes last, under their own heading, stating that none of it contributed
to the verdicts.

### The id migration

`spec/migration.yaml` records what becomes of every id in the previous tool's **four**
vocabularies — 43 `p*_`, 13 `q_*`, 6 `screen_*`, 7 `tte_*`, 69 in all, plus the
data-source table.

**It is not a runtime loader.** The previous tool persisted nothing — no browser storage,
no file save — so there are no old files to read. It is the specification the component
migration is written against, and the record of the decisions behind it.

Four dispositions, and every id takes exactly one:

| | |
|---|---|
| `renamed` | Same question, new name. `values` maps the option set where it changed |
| `split` | One old question bundling two or three conditions. **No value is carried** — a `yes` asserted several things and there is no telling which |
| `to_notes` | Free text and metadata, to a guide field |
| `dropped` | With a reason, at length |

The build enforces that the target of a rename is a real question, that every mapped value
is one the target offers, that a note never maps onto a question id, and that no id
appears under two dispositions. **Totality is a test rather than a build rule**, because
the validator reads `spec/` and the old vocabulary lives in `src/`:
`tests/migration.test.mjs` scans the components still being migrated and fails on an id
with no disposition. As each component is retired its ids leave the scan.

The decisions it pins: the three assumption scores are **dropped** (they fed the
compensatory multiplier the ladder replaced — exchangeability now comes from the tier,
positivity is `overlap`, consistency is `intervention_defined` plus
`delivery_consistency`); `p7_n` is **dropped** so an illustrative figure cannot reach the
answer store; `screen_*` values are **not carried**, leaving designs Unknown rather than
inheriting a verdict nobody gave.

`prospective` gained a third option, `maybe`, for a rollout already part way through. It
does not block the randomised designs and does not pass silently — it leaves all six
**conditional**, asking which component or cohort could still be allocated, and noting
that randomising a component narrows the estimand to that component. A test asserts every
design blocked by `prospective: no` carries the partial case.

### The id migration, after the switchover

`spec/migration.yaml` remains as the record of what became of every id in the previous
tool's four vocabularies. The legacy bridge that routed them — `legacyBridge.js`,
`useLegacyInputs.js` — went with the components it served, and `tests/prefill.test.mjs`
with it: its subject was the bridge, and phase 4's criterion is now trivially true because
there is one vocabulary and one store.

`tests/migration.test.mjs` survives, with its scan inverted. It used to assert that every
old id still in the source had a disposition; it now asserts the scan comes back **empty**.
A component reintroducing one of those ids would be reaching for a vocabulary with no store
behind it.

**Stage tags come from the engine everywhere.** CLAUDE.md once claimed this when it was
not true of the two decision trees, which rendered per-node tags from their own data.
`src/components/ui/StageTags.jsx` resolves it without deleting either, because they say
different things: the engine infers a stage from what the user has said about the
intervention, while a tree node's tag is a guess from where you have walked to. The engine
wins where it has an answer and says so; otherwise the positional tag is shown as a hint.

### The screening checkpoint

The tool has to be useful to someone deciding where to put their effort, not only to
someone who has already decided everything. `screeningSet(spec)` derives the short run of
questions that rules most designs in or out, and `evaluate()` returns progress through it
as `screening`.

**Derived, never listed**, because a list is what drifts: a question added later that rules
out four designs would sit outside a hand-kept screen unnoticed. The rule is every intake
question, plus every question that is `ex_ante`, ungated, and appears in **two or more
blockers**. That currently gives 17 of 67, reaching 74% of all blockers and at least one on
every counterfactual design.

What it reports is **not a recommendation**. The ladder rules out fast and rules in slowly
— nine designs of nineteen gone by the ninth answer, none established as feasible by the
twelfth — so a screen leading on "your design is X" would be silent exactly when it is most
needed. It reports what is settled: ruled out, still in play, the highest rung not ruled
out, and where effort goes next. The panel says explicitly that **not ruled out is not the
same as available**, because an unestablished design counts as in play.

`tests/screening.test.mjs` pins the derivation rule. Two of its checks are deliberately
independent of that rule — blocker coverage, and reaching every design — because the
rule-shaped assertions recompute the rule and would agree with themselves if the
specification quietly weakened the screen.

### The front door and question typing

The landing page asks **one** question: `claim_type`, the scope gate. Yes routes to the
assessment, No and Not sure to the question-typing tool, which exists to settle exactly
that. It no longer offers three question-typing tools as equal cards competing with the
assessment, and no longer describes the tool as scoring 32 variants across seven sections.

`/question-type` is one tool replacing three. The Research Question Framework and the two
decision trees covered the same ground by different means — a taxonomy you browse, and
traversal to the same categories — and `questionFrameworkData.js` already held both halves,
with quantitative types Description, Prediction and Causal Inference: the same three
distinctions the quantitative tree walks to. The three bodies are extracted as
`QuantTreeBody`, `QualTreeBody` and `TaxonomyBody` and placed in tabs. `/quant-tree`,
`/qual-tree` and `/question-framework` redirect, so old links still resolve.

### The reviewer pack

`reviewer-pack/` is the specification rendered for a methods reviewer who knows evaluation
methodology but does not read YAML or JSON Logic. `REVIEWER_PACK.md` reads end to end;
`rules.csv`, `designs.csv`, `questions.csv` and `tiers.csv` open in a spreadsheet for
filtering and annotation. Phase 7 is accepted when a methods reviewer has signed it off.

Every rule condition is rendered as a sentence using the **option labels the user sees**,
not internal values — `pre_periods is “None”` rather than `{"==": [{"var": …}]}`. A
reviewer cannot judge a rule they cannot read.

**The pack is committed, not just built.** That way a change to a rule appears in a pull
request as a change to the sentence a reviewer reads, rather than as a YAML diff. To keep
it honest, `npm run pack:check` regenerates and fails if the committed copy has drifted,
and CI runs it. The output carries no timestamp, so it is reproducible.

Edit `spec/`, never `reviewer-pack/`, then run `npm run pack` and commit both.

### How a verdict is reached

Each design takes its **worst** state across its checks, in the order
Blocked > Conditional > Unknown > Feasible. No good answer offsets a bad one.

| State | Meaning |
|---|---|
| Blocked | A blocker test is true. The design cannot work with these answers. |
| Conditional | No blocker, but something required is unmet or not yet evidenced. Carries `unlock` text. |
| Unknown | A question the design depends on is unanswered. |
| Feasible | Conditions met. Warnings are still listed. |

An unanswered question leaves every design depending on it **Unknown** — nothing is scored
from a default. The engine derives this from the variables each test references, so there
is no separate dependency list to keep in step.

Numeric thresholds appear only where the literature gives one, carry a `range`, and are
marked `basis: convention` where that is what they are. A `contested: true` threshold must
carry a range — enforced by test.

**Two separate version numbers.** The app version is 0.8.0, held in `package.json` and
injected everywhere else. The **spec version** in `tiers.yaml` is independent: it
is written into every export, and a load with a mismatched version warns. It increments on
changes to tiers, rules or design identity — not on wording.

**Signed-off methodology is guarded by tests**, not just by file contents.
`tests/validate-spec.test.mjs` asserts the tier ordering, the theory-based strand staying
off the ladder, and the three contested placements (RDIT → Tier 3, controlled ITS →
Tier 3, matching with prior-outcome controls → upper Tier 4). `tests/designs.test.mjs`
asserts the agreed 32 → 22 register: the tier distribution (6/3/5/4/1 plus 3 theory-based)
and every merge. Changing any of them requires deliberately changing a test.

**The design register is one row per design, not per estimator.** Estimator choice never
moves a design up a tier, so Callaway-Sant'Anna and Sun-Abraham are `estimator_options` of
`did_staggered` rather than designs. A theory-based row must carry **no** tier — the
schema rejects one, because the strand runs beside the ladder and is never converted into
a rung.

---

## Key files

| Task | File(s) |
|---|---|
| Change a question, its wording or its options | `spec/questions.yaml` |
| Add, remove or recategorise a design | `spec/designs.csv` + `spec/rules.yaml` + the guard test in `tests/designs.test.mjs` |
| Change when a design is blocked, conditional or warned about | `spec/rules.yaml`, then `npm run pack` |
| Change a readiness gate, the stage rule or routing | `spec/stages.yaml` |
| Change a tier or a contested placement | `spec/tiers.yaml` + the guard test in `tests/validate-spec.test.mjs` |
| Add or change a guide | `spec/guides.yaml` — no new component needed |
| Add a citation | `spec/references.bib` (dangling keys fail CI) |
| Change what the build enforces | `spec/schema/*.schema.json`, `scripts/validate-spec.mjs` |
| Change the report | `src/report/buildReport.js` |
| Change the reviewer pack's layout | `scripts/build-reviewer-pack.mjs`, `scripts/lib/describe.mjs` |
| Change the front door or its routing | `src/components/pages/LandingPage.jsx`, `src/App.jsx` |
| Change the app version | `package.json` only — it is injected everywhere else |

---

## UI components

`src/components/ui/GovukComponents.jsx` exports shared primitives wrapping GOV.UK Frontend CSS (`govuk-*`) and MoJ Frontend classes (`moj-*`). Both are npm dependencies compiled locally by `npm run css:vendor`; nothing is fetched at
runtime. Avoid inline styles except where design system classes are insufficient.

The sidebar is collapsible. Hamburger button in the header toggles `open` state. On mobile
(<768px) it overlays content with a backdrop, and it is hidden entirely on the landing page.
It carries two groups — Assessment and Guides. The section progress tracker, the gate
locking and `LockedPage` went with the seven sections.

---

## Deployment

Hosted on **Cloudflare Pages**, built from this repo.

| Branch | Environment |
|---|---|
| `main` | Production |
| `dev` | Staging preview |

Cloudflare runs `npm run build` and serves `dist/`. `base` in `vite.config.js` is `/` —
the app is served from the domain root, not a subdirectory. `public/_redirects` provides
the SPA fallback and `public/_headers` sets security headers.

`.github/workflows/deploy.yml` is retained as a manual-dispatch fallback only; it no longer
runs on push.

---

## PWA

Configured via `vite-plugin-pwa` with `autoUpdate` service worker strategy. All built assets are precached for offline use, and `navigateFallback` serves index.html for real paths offline. Manifest defined inline in `vite.config.js`. Icons in `public/icons/`.

---

## PWA install button

The sidebar shows an "Install app" button when the browser fires the `beforeinstallprompt` event (Chrome/Edge on desktop and Android). When that event isn't available (iOS Safari, Firefox, dev mode, or already installed), a "How to install ↓" toggle appears instead with browser-specific instructions.

The `beforeinstallprompt` listener is held in `AppLayout` (not inside `InstallPrompt`) so the event is captured even when the user is on the landing page where the sidebar is hidden.

> **Note:** Do not add a file at `public/index.html`. Vite copies everything in `public/` verbatim to `dist/` after processing the root `index.html`, so `public/index.html` would silently overwrite the built file and strip the PWA manifest link and service worker registration injected by `vite-plugin-pwa`.
