# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this project is

A static React/Vite single-page application for assessing the feasibility of impact evaluation designs. It guides government social researchers through a structured seven-section questionnaire and produces a ranked feasibility table for 32 evaluation design variants. There is no backend — all scoring is pure JavaScript computed in the browser.

Prototype v0.7.1, Ministry of Justice | Government Social Research. Not for public release.

> **Redesign in progress.** See `docs/REDESIGN_PLAN.md`. Redesign work happens on the
> `redesign` branch; `dev` continues to serve the current tool.

## Commands

```
npm install        # Install dependencies (Node 20+ required)
npm run dev        # Start dev server at http://localhost:5173/
npm run build      # Build to dist/ (static files, no server required)
npm run preview    # Serve the dist/ build locally for final checks

npm test           # Vitest, single run
npm run test:watch # Vitest, watch mode
npm run spec:check # Validate spec/ against its JSON Schemas
npm run check      # spec:check + test + build — what CI runs
```

CI (`.github/workflows/ci.yml`) runs `spec:check`, `test` and `build` on every push and
pull request. There are no linting scripts.

---

## Architecture

### State management

All application state lives in a single custom hook: `src/hooks/useAppState.js`. It holds:

- `inputs` — flat key-value object mapping field IDs to answer values. Every form field writes into this via `set(id, value)`.
- `dataRows` — array of structured objects for the Section 6 data source inventory.

All derived values (gate status, scoring results, flagged next steps, section completion) are `useMemo` computations from `inputs`. No context, no Redux, no external state library.

### Routing

`HashRouter` is used (originally for GitHub Pages compatibility; now on Cloudflare Pages a `_redirects` SPA fallback is in place, so `BrowserRouter` is viable — see `docs/REDESIGN_PLAN.md`). Routes use **semantic paths** (changed in v0.7 — no longer `/page1` through `/page7`):

| Route | Component | Section |
|---|---|---|
| `/` | `LandingPage` | Landing page |
| `/research-question` | `PageResearchQuestion` | 1. Research Question |
| `/causal-readiness` | `PageCausalReadiness` | 2. Causal Readiness (gate) |
| `/ideal-trial` | `PageIdealTrial` | 3. Ideal Trial Specification |
| `/design-questions` | `PageDesignQuestions` | 4. Design Questions |
| `/adjustment` | `PageAdjustment` | 5. Adjustment & DAG |
| `/data-sources` | `PageDataSources` | 6. Data Sources |
| `/statistical` | `PageStatistical` | 7. Statistical Feasibility |
| `/results` | `ResultsPage` | Results |

Legacy routes `/page1`–`/page7` redirect automatically to their semantic equivalents.

### Section order change (v0.7)

The section order changed from v0.6. The key structural change is:

- **Causal Readiness moved to Section 2** (was Section 3 in v0.6). The gate now fires before the Ideal Trial section — there is no point specifying an ideal trial if the intervention is not ready. Sections 3–7 and Results lock when the gate fails (was Sections 4–7 in v0.6).
- **TTE renamed to Ideal Trial Specification** (Section 3). The old "Target Trial Emulation" framing was ex post (TTE is a framework for designing observational analyses). The new framing is ex ante — specifying what the ideal trial would look like to clarify the causal estimand before choosing a design.

### Gate logic

Gate is controlled by `GATE_ENABLED` in `src/scoring/config.js`. In v0.7, three independent critical conditions are checked separately (not combined as in v0.6):

- `p3_defined` — intervention clearly defined and documented
- `p3_toc` — theory of change or logic model exists (**new separate condition in v0.7**)
- `p3_scale` — intervention at sufficient scale or maturity

If **any** is answered `'no'`, `gatePassed` is `false`. This catches two distinct failure modes: a well-defined intervention without a ToC (common in older services), and a ToC without a clear implementation specification (common in new pilots).

`gateFailures` (from `useAppState`) returns an array of specific failure label strings for targeted messaging on the not-ready screen.

Set `GATE_ENABLED = false` for reviewer walkthroughs.

### Test and Learn framework integration (v0.7)

The Magenta Book Test and Learn (T&L) framework is referenced throughout the app. Key integration points:

- **Landing page** — positions the tool as appropriate for Test and Grow stages
- **PageCausalReadiness** — infers T&L stage from readiness answers and displays it live; gate failure screen names the T&L stage (Co-design / Explore) and signposts appropriate alternatives
- **PageStatistical** — T&L context strip noting that Test stage often relies on estimates from similar programmes; Grow stage may have prior data from Test phase
- **T&L stage inference logic** (in `PageCausalReadiness.jsx`):
  - All three readiness = yes → Test + Grow
  - Scale = partial or any readiness = partial → Test only
  - Any = no → gate fires, Co-design or Explore depending on which failed

### Scoring pipeline

In `src/scoring/scoring.js` — pure functions, no React dependency.

1. `assembleResults(inputs)` called reactively via `useMemo` on every input change
2. Global `assumptionScore` = mean of `p3_exchangeability`, `p3_positivity`, `p3_consistency` (mapped: yes→1.0, partial→0.7, no→0.0). Applied as multiplier to all quantitative design causal scores.
3. Per-family data scores from Sections 6 & 7 inputs
4. Per-design causal validity scores via design-specific functions
5. `getBlockers(inputs)` returns hard-block reason or `'None'` per design
6. Raw causal score capped by category ceiling from `CATEGORY_CEILINGS` in `config.js`
7. `weightedTotal = (dataScore × WEIGHTS.data) + (causalScore × WEIGHTS.causalValidity)`
8. Blocked designs capped at 0.15
9. Feasibility: High ≥ `THRESH_HIGH` (0.60), Medium ≥ `THRESH_MEDIUM` (0.35), Low otherwise

### Category ceiling system

Each design in `src/data/designs.js` has a `ceilingKey` mapping to a max causal validity score:

| Key | Ceiling | Designs |
|---|---|---|
| A | 1.00 | 6 RCT variants |
| B | 0.82 | Sharp/Fuzzy RD, RDIT, IV/2SLS, Fuzzy RD as IV, Controlled ITS |
| C | 0.64 | Standard ITS, Segmented regression ITS |
| D | 0.44 | All DiD variants, matching/weighting, G-methods |
| Dp | 0.54 | Synthetic control, Augmented synthetic control |
| E | 0.24 | Theory-based (no assumption multiplier applied) |

### Prospective filter

If `inputs.p1_prospective === 'no'`, all six RCT variants (`prospectiveOnly: true` in `designs.js`) are shown as N/A in results and hidden from Section 4. Passed as `prospectiveOk` prop to `PageDesignQuestions`.

### Configurable parameters (src/scoring/config.js)

| Constant | Default | Effect |
|---|---|---|
| `GATE_ENABLED` | `true` | Set false for reviewer walkthroughs |
| `WEIGHTS.data` | `0.5` | Weight of data availability in weighted total |
| `WEIGHTS.causalValidity` | `0.5` | Weight of causal validity in weighted total |
| `SAMPLE_REFERENCE` | `500` | RCT sample score denominator |
| `THRESH_HIGH` | `0.60` | Minimum score for "High" feasibility label |
| `THRESH_MEDIUM` | `0.35` | Minimum score for "Medium" feasibility label |

### Bayesian additions (v0.7)

Bayesian considerations are surfaced in two places:

- **PageStatistical** — purple callout panel when `p7_n < 20` (tiny) or `p7_n < 100` (small). Covers informative priors, adaptive RCT designs, communication of posterior distributions. Separate content for tiny vs small.
- **PageStatistical** — Bayesian analysis approach option in the analysis section, with sub-questions for prior data source if Bayesian selected
- **nextSteps.js** — Bayesian notes woven into guidance for power calculation, ITS pre-period, confounder confidence, and synthetic control pre-fit items

### Companion tools

The four companion tools are **React routes**, not standalone HTML. The files in `public/`
are seven-line redirect stubs kept so old bookmarked URLs still resolve.

| Route | Component | Stub kept for old URLs |
|---|---|---|
| `/question-framework` | `tools/PageQuestionFramework.jsx` | `public/questionFramework.html` |
| `/quant-tree` | `tools/PageQuantTree.jsx` | `public/quantTree.html` |
| `/qual-tree` | `tools/PageQualTree.jsx` | `public/qualTree.html` |
| `/design-finder` | `tools/PageDesignFinder.jsx` | `public/designFinder.html` |

`TOOL_LINKS` at the top of `LandingPage.jsx` holds the hash routes.

Tool pages share the assessment shell: `PageHeader` > `.page-content.tool-column`, with the
app sidebar visible (it carries an ungated **Tools** group alongside the assessment sections).

---

## Specification (`spec/`) — redesign

Questions, rules, tiers and citations live in reviewer-editable files rather than in
JavaScript, so a rule change appears in every tool at once. Added in phase 1; populated
in phase 2. See `docs/REDESIGN_PLAN.md`.

| File | Holds | Status |
|---|---|---|
| `spec/tiers.yaml` | The five robustness tiers, the theory-based strand, contested placements | Seeded |
| `spec/references.bib` | Every citation, with a confidence note | Seeded |
| `spec/designs.csv` | One row per design (not per estimator) — 22 designs | Seeded |
| `spec/questions.yaml` | Question bank shared by all tools — 38 questions | Seeded |
| `spec/rules.yaml` | Per design: blockers, conditions, warnings as JSON Logic — 130 checks | Seeded |
| `spec/stages.yaml` | Stage vocabulary, readiness gates, routing | Seeded |
| `spec/statistics.yaml` | NHST and Bayesian question sets | Phase 3 |
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

**Every question is consumed.** All 38 reach a rule test, a gating condition, a readiness
gate, the stage inference or a route — asserted by test. The previous tool collected 80
inputs and scored on 23, so this is checked rather than assumed.

### Stages and readiness

`spec/stages.yaml` holds the **single** stage rule. The Causal Readiness page, the Design
Finder and both trees all call the engine's inference, which reads only that file.

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

**Two separate version numbers.** The app version (`package.json`, UI, docs) is 0.7.1 and
stays 0.7.x through the redesign. The **spec version** in `tiers.yaml` is independent: it
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
| Adjust scoring weights or feasibility thresholds | `src/scoring/config.js` |
| Add/remove/recategorise a design variant | `src/data/designs.js` + scoring function in `src/scoring/scoring.js` |
| Change question wording or hint text | Relevant `src/components/pages/Page*.jsx` |
| Edit Ideal Trial component cards (Section 3) | `src/data/tteComponents.js` |
| Add/edit next steps guidance (Results page) | `src/data/nextSteps.js` |
| Change category ceilings | `src/scoring/config.js` → `CATEGORY_CEILINGS` |
| Disable the Section 2 gate | `src/scoring/config.js` → `GATE_ENABLED = false` |
| Change the base path or PWA manifest | `vite.config.js` (`base` is `/`; there is no `REPO_NAME`) |
| Add or change a tier, or a contested placement | `spec/tiers.yaml` + the guard test in `tests/validate-spec.test.mjs` |
| Add a citation | `spec/references.bib` (dangling keys fail CI) |
| Change what the spec validator enforces | `spec/schema/*.schema.json`, `scripts/validate-spec.mjs` |
| Edit landing page tool links | `src/components/pages/LandingPage.jsx` → `TOOL_LINKS` |

---

## UI components

`src/components/ui/GovukComponents.jsx` exports shared primitives wrapping GOV.UK Frontend CSS (`govuk-*`) and MoJ Frontend classes (`moj-*`). Both CSS frameworks load from CDN in `index.html` — not npm dependencies. Avoid inline styles except where design system classes are insufficient.

The sidebar is collapsible (v0.7). Hamburger button in the header toggles `open` state. On mobile (<768px) the sidebar overlays content with a backdrop. The sidebar is hidden entirely on the landing page (`/`). The LockedPage component references "Section 2" (Causal Readiness) — update this if section order changes again.

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

Configured via `vite-plugin-pwa` with `autoUpdate` service worker strategy. All built assets and CDN resources (jsDelivr) are precached for offline use. Manifest defined inline in `vite.config.js`. Icons in `public/icons/`.

---

## PWA install button

The sidebar shows an "Install app" button when the browser fires the `beforeinstallprompt` event (Chrome/Edge on desktop and Android). When that event isn't available (iOS Safari, Firefox, dev mode, or already installed), a "How to install ↓" toggle appears instead with browser-specific instructions.

The `beforeinstallprompt` listener is held in `AppLayout` (not inside `InstallPrompt`) so the event is captured even when the user is on the landing page where the sidebar is hidden.

> **Note:** Do not add a file at `public/index.html`. Vite copies everything in `public/` verbatim to `dist/` after processing the root `index.html`, so `public/index.html` would silently overwrite the built file and strip the PWA manifest link and service worker registration injected by `vite-plugin-pwa`.
