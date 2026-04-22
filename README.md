# Impact Evaluation Feasibility Tool

A decision-support web application for government social researchers assessing the feasibility of different impact evaluation designs. Built with React and Vite, hosted as a static site on GitHub Pages.

> **Status:** Prototype v0.6 — for methodological peer review. Not for public release.
> Ministry of Justice | Government Social Research

---

## Contents

- [Purpose](#purpose)
- [Who it is for](#who-it-is-for)
- [How the app works](#how-the-app-works)
- [Getting started](#getting-started)
- [Repository structure](#repository-structure)
- [Scoring system](#scoring-system)
- [Design category framework](#design-category-framework)
- [Configuring the app](#configuring-the-app)
- [Editing text and data content](#editing-text-and-data-content)
- [Deploying to GitHub Pages](#deploying-to-github-pages)
- [Contributing and peer review](#contributing-and-peer-review)

---

## Purpose

The tool guides analysts through a structured feasibility assessment for impact evaluation, helping them:

- Specify their research question and policy context using established frameworks (PICOTS, Target Trial Emulation)
- Assess whether their intervention is ready for impact evaluation
- Work through design-specific feasibility questions across 32 evaluation design variants
- Receive a ranked feasibility table with scores, category ratings, and blocker explanations
- Identify unanswered questions and next steps before committing to a design
- Export a documented HTML report for sharing with commissioners and reviewers

The tool does not replace methodological expertise or peer review. It structures and prompts the thinking that should precede design decisions, and produces a record of that reasoning.

---

## Who it is for

**Primary users:** Analysts and researchers in government social research teams (primarily Grade 7 / SEO level) planning impact evaluations.

**Secondary users:** Evaluation leads commissioning external evaluations; methodology advisors reviewing a team's feasibility reasoning.

---

## How the app works

The app is organised into seven sequential sections plus a results page:

| Section | Title | Key content |
|---------|-------|-------------|
| 1 | Research Question & Study Context | Research question, PICOTS framework, prospective evaluation filter, policy decision and timeline |
| 2 | Target Trial Emulation | Seven TTE framework components — each with a feasibility edit prompt |
| 3 | Causal Readiness *(gate)* | Intervention readiness (5 questions); causal identification assumptions |
| 4 | Design-Specific Questions | Screening questions per design family; variant-specific feasibility questions |
| 5 | Adjustment & DAG | Causal diagram description; variable classification (confounders, mediators, colliders, competing exposures) |
| 6 | Data Sources | Dynamic data source inventory; linkage feasibility; missing data assessment |
| 7 | Statistical Feasibility | Sample size, MDE, power calculation, pre-intervention data, analysis approach |
| Results | Feasibility Assessment Results | Ranked table, top recommendation, next steps panel, HTML export |

### Prospective evaluation filter

The first question on Section 1 asks whether a prospective evaluation is possible. Selecting **No** hides all six RCT variants from Section 4 and marks them as N/A in the results table. This filter responds in real time — changing the answer updates the results immediately.

### Intervention readiness gate

Section 3 contains a hard gate based on five readiness questions. Three are designated critical:

- Is the intervention clearly defined and documented?
- Is there a logic model or theory of change?
- Has the intervention reached sufficient scale or maturity?

If any critical question is answered **No**, Sections 4–7 and the Results page are locked, and the user is shown a signpost table of alternative evaluation approaches (process evaluation, developmental evaluation, contribution analysis, realist evaluation).

The gate can be disabled for reviewer walkthroughs — see [Configuring the app](#configuring-the-app).

### Live scoring

All 32 design variant scores recalculate in real time as the user changes their answers. No page reload or submission is required. The scoring is pure JavaScript computed in the browser — there is no server.

---

## Getting started

### Prerequisites

- [Node.js](https://nodejs.org/) version 18 or higher
- npm (comes with Node.js)

### Run locally

```bash
# Clone the repository
git clone https://github.com/YOUR-ORG/evaluation-feasibility-tool.git
cd evaluation-feasibility-tool

# Install dependencies
npm install

# Start the development server
npm run dev
```

The app will open at `http://localhost:5173/evaluation-feasibility-tool/`.

Changes to any source file are reflected instantly in the browser without restarting the server.

### Build for production

```bash
npm run build
```

The compiled static files are written to `dist/`. These can be served by any static file host.

---

## Repository structure

```
evaluation-feasibility-tool/
│
├── .github/
│   └── workflows/
│       └── deploy.yml          # GitHub Actions: auto-build and deploy on push to main
│
├── public/
│   └── index.html              # HTML shell — loads GOV.UK and MoJ CSS from CDN
│
├── src/
│   ├── main.jsx                # React entry point; HashRouter for GitHub Pages compatibility
│   ├── App.jsx                 # Root component — routing and state wired to all pages
│   │
│   ├── data/                   # ── EDITABLE CONTENT (no code knowledge required) ──
│   │   ├── designs.js          # Design taxonomy: all 32 variants, categories, ceiling keys
│   │   ├── tteComponents.js    # Target Trial Emulation component titles, hints, placeholders
│   │   └── nextSteps.js        # Next steps registry: flagged questions and guidance text
│   │
│   ├── scoring/                # ── SCORING ENGINE ──
│   │   ├── config.js           # All configurable parameters: weights, thresholds, ceilings
│   │   └── scoring.js          # Per-design scoring functions and results assembly
│   │
│   ├── hooks/
│   │   └── useAppState.js      # Central state management; gate logic; live scoring
│   │
│   └── components/
│       ├── layout/
│       │   └── AppLayout.jsx   # MoJ header, sidebar navigation, footer
│       │
│       ├── ui/
│       │   └── GovukComponents.jsx  # Shared GOV.UK/MoJ Design System components
│       │
│       └── pages/
│           ├── Page1.jsx       # Research Question & Study Context
│           ├── Page2.jsx       # Target Trial Emulation
│           ├── Page3.jsx       # Causal Readiness (gate logic rendered here)
│           ├── Page4.jsx       # Design-Specific Feasibility Questions
│           ├── Page5.jsx       # Adjustment & DAG
│           ├── Page6.jsx       # Data Sources
│           ├── Page7.jsx       # Statistical Feasibility
│           └── ResultsPage.jsx # Results table, top recommendation, next steps, export
│
├── package.json                # Project dependencies and build scripts
└── vite.config.js              # Vite build configuration (set base to your repo name)
```

---

## Scoring system

Each of the 32 evaluation design variants receives two scores, combined into a weighted total.

### Weighted total

```
Weighted total = (Data score × data weight) + (Causal validity score × causal validity weight)
```

Default weights (set in `src/scoring/config.js`):

| Dimension | Default weight |
|-----------|---------------|
| Data availability | 0.50 |
| Causal validity | 0.50 |

### Feasibility classification

| Label | Threshold |
|-------|-----------|
| **High** | Weighted total ≥ 0.60 |
| **Medium** | Weighted total ≥ 0.35 |
| **Low** | Weighted total < 0.35 |

All thresholds are configurable in `src/scoring/config.js`.

### Causal validity score

Computed from two components multiplied together:

1. **Design-specific feasibility score (0–1):** derived from the answers to that design's questions on Section 4 — e.g. whether parallel trends is plausible for DiD, whether a valid instrument exists for IV.

2. **Global assumption score (0–1):** the mean of the three causal identification assumption ratings from Section 3 (exchangeability, positivity, consistency). Applied to all quantitative designs. Theory-based designs use a parallel set of criteria instead (theory of change quality, intervention definition).

The combined score is then **capped by the design's category validity ceiling** — see [Design category framework](#design-category-framework) below.

### Data availability score

Computed from shared sub-components that vary by design family, drawn from Sections 6 and 7:

| Design family | Data inputs used |
|---------------|-----------------|
| Experimental (RCT variants) | Sample size, power calculation readiness, missing data rate |
| Difference-based (DiD, synthetic control) | Pre-intervention data, pre-period time points, linkage feasibility, missing data rate |
| Discontinuity-based (RD variants) | Linkage feasibility, missing data rate |
| Instrumental variables | Linkage feasibility, missing data rate |
| Interrupted time series | Pre-intervention data, pre-period time points, missing data rate |
| Matching & weighting | Covariate richness, linkage feasibility, missing data rate |
| G-methods | Pre-intervention data, pre-period time points, covariate richness, linkage feasibility |
| Theory-based | Missing data rate (with +0.2 bonus reflecting lower data demands) |

### Blocker logic

Certain answer combinations trigger a hard blocker for a specific design. A blocked design's weighted total is capped at **0.15** regardless of its scored values, and the blocker reason is shown in the results table.

Examples:

| Condition | Designs blocked |
|-----------|----------------|
| Prospective evaluation not possible | All 6 RCT variants |
| Screening question answered No for a family | All variants in that family |
| Parallel trends unlikely to hold | Standard DiD |
| No staggered rollout | Staggered adoption DiD, Callaway-Sant'Anna DiD, Sun-Abraham DiD |
| Running variable manipulation detected | Sharp RD |
| Positivity violation confirmed | IPW / stabilised IPW |
| No pre-intervention data | All ITS, DiD, and synthetic control variants |
| No comparable control series | Controlled ITS |

The full blocker mapping is in `src/scoring/scoring.js` — the `getBlockers()` function.

### Where scoring lives

| File | What it controls |
|------|-----------------|
| `src/scoring/config.js` | Weights, feasibility thresholds, sample size reference, category ceilings |
| `src/scoring/scoring.js` | All per-design scoring functions, data score functions, blocker logic, `assembleResults()` |
| `src/data/designs.js` | Category and ceiling key per design — edit to reassign a design to a different category |
| `src/hooks/useAppState.js` | Calls `assembleResults()` reactively; gate logic; next steps flagging |

---

## Design category framework

To prevent designs with weak causal identification from outscoring rigorous designs on pure data availability, each design is assigned a **category** that imposes an upper ceiling on its causal validity score. The framework is analogous to the [Maryland Scientific Methods Scale](https://whatworks.gov.uk/).

| Category | Description | Maryland SMS | Ceiling |
|:---:|---|:---:|:---:|
| **A** | Randomised designs | Level 5 | 1.00 |
| **B** | Quasi-experimental — exogenous variation with a control group | Level 4 | 0.82 |
| **C** | Quasi-experimental — exogenous variation, no control group | Level 3 | 0.64 |
| **D** | Quasi-experimental — modelling assumptions, no exogenous variation | Level 2 | 0.44 |
| **D+** | Synthetic control variants (D-plus override) | Level 2+ | 0.54 |
| **E** | Theory-based and non-counterfactual approaches | Level 1 | 0.24 |

**Category A:** Individual RCT, Cluster RCT, Stepped-wedge RCT, Crossover RCT, Waitlist RCT, Encouragement design

**Category B:** Sharp RD, Fuzzy RD, RDIT, Standard IV / 2SLS, Fuzzy RD as IV, Controlled ITS

**Category C:** Standard ITS, Segmented regression ITS

**Category D:** All DiD variants, all matching and weighting methods, all G-methods

**Category D+:** Synthetic control, Augmented synthetic control

**Category E:** Contribution analysis, Realist evaluation, Process tracing

Category assignments per design are in `src/data/designs.js`. Ceiling values are in `src/scoring/config.js`. Changing a design's category requires editing only one row in `designs.js`.

> **Reviewer note:** Four boundary case assignments are open for peer review — see `REVIEWER_NOTES.md` for details on (1) Encouragement design as A vs B; (2) Standard ITS as C vs D; (3) Controlled ITS as B vs C; (4) G-methods as D vs D+.

---

## Configuring the app

All configurable parameters are in **`src/scoring/config.js`**. No other files need changing for routine configuration adjustments.

```js
// src/scoring/config.js

// Disable the Section 3 gate for reviewer walkthroughs
export const GATE_ENABLED = true

// Scoring weights — must sum to 1
export const WEIGHTS = { data: 0.5, causalValidity: 0.5 }

// Feasibility classification thresholds
export const THRESH_HIGH   = 0.60
export const THRESH_MEDIUM = 0.35

// Sample size at which RCT data score reaches 1.0
export const SAMPLE_REFERENCE = 500

// Category validity ceilings — adjust after peer review
export const CATEGORY_CEILINGS = {
  A:  1.00,  // Randomised designs
  B:  0.82,  // QE with exogenous variation + control group
  C:  0.64,  // QE with exogenous variation, no control group
  D:  0.44,  // QE relying on modelling assumptions
  Dp: 0.54,  // Synthetic control variants only
  E:  0.24,  // Theory-based / non-counterfactual
}
```

---

## Editing text and data content

The following files can be edited without any knowledge of React or scoring logic. They are plain JavaScript module files — the structure is self-explanatory.

### `src/data/designs.js`

Controls the design taxonomy — which variants exist, which family they belong to, which category they are assigned, and which ceiling key they use. Add a new design variant by adding a new object to the array. Reassign a category by changing the `category` and `ceilingKey` fields.

### `src/data/tteComponents.js`

Controls the seven Target Trial Emulation component cards on Section 2 — titles, hint text, and placeholder text. Edit to update the framing or guidance without touching the page component.

### `src/data/nextSteps.js`

Controls the Recommended Next Steps panel on the Results page. Each entry specifies:
- `id`: the input field to monitor
- `uncertainValues`: answer values that trigger this item to appear
- `page`: display label
- `question`: short question label
- `guidance`: the guidance text shown to the user

Add new entries or update guidance text here without touching any component code.

---

## Deploying to GitHub Pages

### First-time setup

1. **Update `vite.config.js`** — set `base` to match your repository name exactly:
   ```js
   base: '/your-repository-name/',
   ```

2. **Enable GitHub Pages** — in your repository: Settings → Pages → Source → **GitHub Actions**

3. **Push to `main`** — the Actions workflow (`.github/workflows/deploy.yml`) runs automatically, builds the app, and deploys it. Your site will be live at:
   ```
   https://YOUR-ORG.github.io/your-repository-name/
   ```

### Subsequent updates

Push any change to `main` and the site rebuilds and redeploys automatically within approximately 2 minutes. No local build step is required after initial setup.

### URL format

The app uses `HashRouter`, so page URLs take the form:
```
https://YOUR-ORG.github.io/your-repository-name/#/page1
https://YOUR-ORG.github.io/your-repository-name/#/results
```

This is required for GitHub Pages, which cannot perform server-side routing. If you later host on a server that supports SPA fallback routing (e.g. Netlify, Vercel), replace `HashRouter` with `BrowserRouter` in `src/main.jsx` for cleaner URLs.

---

## Contributing and peer review

This prototype is circulated for methodological peer review. The most important questions for reviewers are:

**On scoring weights and thresholds** — are the default weights (data 50%, causal validity 50%) appropriate? Should causal validity be weighted more heavily?

**On design category assignments** — the four boundary cases noted above. See `REVIEWER_NOTES.md`.

**On category validity ceilings** — are the ceiling values appropriately spaced? Should the gap between D and C be wider?

**On question coverage and wording** — are the right questions being asked for each design family? Is the hint text well-calibrated for the intended user group?

**On gate logic** — are the five intervention readiness questions the right conditions for the gate? Is a hard gate the right approach, or would a soft gate with strong warnings be preferable?

To suggest changes to scoring logic or category assignments, please raise a GitHub Issue with the label `methodology-review`. To suggest changes to wording or guidance text, edit the relevant file in `src/data/` and open a pull request.

---

## Companion documents

| Document | Description |
|----------|-------------|
| `REVIEWER_NOTES.md` | Design category boundary cases and open questions for peer review |
| `scoring_reference.xlsx` | Per-design scoring map and answer-to-score lookup tables |
| `spec_brief.docx` | Full specification document for non-technical reviewers |
| `checklist.pdf` / `checklist.docx` | Pre-assessment checklist for users to complete before opening the app |

---

## Licence

This project is developed by the Ministry of Justice for internal government use. Licensing terms to be confirmed before any public release.

---

*Impact Evaluation Feasibility Tool — Prototype v0.6 — Ministry of Justice | Government Social Research*
*This tool should be used to inform — not replace — professional methodological judgement.*
