# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this project is

A static React/Vite single-page application for assessing the feasibility of impact evaluation designs. It guides government social researchers through a structured seven-section questionnaire and produces a ranked feasibility table for 32 evaluation design variants. There is no backend — all scoring is pure JavaScript computed in the browser.

Prototype v0.7, Ministry of Justice | Government Social Research. Not for public release.

## Commands

```
npm install        # Install dependencies (Node 18+ required)
npm run dev        # Start dev server at http://localhost:5173/policy-evaluation-feasibility-tool/
npm run build      # Build to dist/ (static files, no server required)
npm run preview    # Serve the dist/ build locally for final checks
```

There is no test runner configured. There are no linting scripts in `package.json`.

---

## Architecture

### State management

All application state lives in a single custom hook: `src/hooks/useAppState.js`. It holds:

- `inputs` — flat key-value object mapping field IDs to answer values. Every form field writes into this via `set(id, value)`.
- `dataRows` — array of structured objects for the Section 6 data source inventory.

All derived values (gate status, scoring results, flagged next steps, section completion) are `useMemo` computations from `inputs`. No context, no Redux, no external state library.

### Routing

`HashRouter` is used for GitHub Pages compatibility. Routes use **semantic paths** (changed in v0.7 — no longer `/page1` through `/page7`):

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

### Companion tools (public/)

Standalone HTML tools hosted at the same GitHub Pages URL. No build step required — Vite copies everything in `public/` verbatim to `dist/`. These are linked from the landing page.

| File | Tool | Linked from |
|---|---|---|
| `public/research-question-framework.html` | Research Question Framework | Landing page Section 1 |
| `public/quant-decision-tree.html` | Quantitative Decision Tree | Landing page Section 1 |
| `public/qual-decision-tree.html` | Qualitative Decision Tree | Landing page Section 1 |
| `public/design-finder.html` | Evaluation Design Finder (v0.7) | Landing page Section 2 |

Tool link constants are defined at the top of `LandingPage.jsx` as `TOOL_LINKS` — update paths there if filenames change.

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
| Change repo name for GitHub Pages base path | `vite.config.js` → `REPO_NAME` |
| Edit landing page tool links | `src/components/pages/LandingPage.jsx` → `TOOL_LINKS` |

---

## UI components

`src/components/ui/GovukComponents.jsx` exports shared primitives wrapping GOV.UK Frontend CSS (`govuk-*`) and MoJ Frontend classes (`moj-*`). Both CSS frameworks load from CDN in `index.html` — not npm dependencies. Avoid inline styles except where design system classes are insufficient.

The sidebar is collapsible (v0.7). Hamburger button in the header toggles `open` state. On mobile (<768px) the sidebar overlays content with a backdrop. The sidebar is hidden entirely on the landing page (`/`). The LockedPage component references "Section 2" (Causal Readiness) — update this if section order changes again.

---

## Deployment

Push to `main` — GitHub Actions (`.github/workflows/deploy.yml`) builds and deploys to GitHub Pages automatically. The `base` path in `vite.config.js` must match the repository name exactly (`policy-evaluation-feasibility-tool`).

---

## PWA

Configured via `vite-plugin-pwa` with `autoUpdate` service worker strategy. All built assets and CDN resources (jsDelivr) are precached for offline use. Manifest defined inline in `vite.config.js`. Icons in `public/icons/`.

---

## Pending items (as of v0.7 branch)

These changes were developed in a Claude chat session and are packaged in `feasibility_updates.zip`. They need to be applied to the repo before the Claude Code session begins:

### File renames required in src/components/pages/
- `Page1.jsx` → `PageResearchQuestion.jsx`
- `Page4.jsx` → `PageDesignQuestions.jsx`
- `Page5.jsx` → `PageAdjustment.jsx`
- `Page6.jsx` → `PageDataSources.jsx`
- `Page7.jsx` → delete; use `PageStatistical.jsx` from zip

### New files to add
- `src/components/pages/LandingPage.jsx`
- `src/components/pages/PageCausalReadiness.jsx`
- `src/components/pages/PageIdealTrial.jsx`
- `src/components/pages/PageStatistical.jsx`

### Files to replace
- `src/App.jsx`
- `src/hooks/useAppState.js`
- `src/components/layout/AppLayout.jsx`
- `src/data/nextSteps.js`

### Manual edits still needed in existing page files
- `PageResearchQuestion.jsx`: Next button `navigate('/page2')` → `navigate('/causal-readiness')`; label `'Next: Target Trial →'` → `'Next: Causal Readiness →'`
- `PageDesignQuestions.jsx`: Prev button `navigate('/page3')` → `navigate('/ideal-trial')`; label `'← Previous: Causal Readiness'` → `'← Previous: Ideal Trial'`; Next `navigate('/page5')` → `navigate('/adjustment')`
- `PageAdjustment.jsx`: Prev `navigate('/page4')` → `navigate('/design-questions')`; Next `navigate('/page6')` → `navigate('/data-sources')`
- `PageDataSources.jsx`: Prev `navigate('/page5')` → `navigate('/adjustment')`; Next `navigate('/page7')` → `navigate('/statistical')`
- `src/components/ui/GovukComponents.jsx`: LockedPage text `'Section 3'` → `'Section 2'`
