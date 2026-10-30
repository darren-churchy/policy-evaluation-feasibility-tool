# Impact Evaluation Feasibility Tool

A decision-support web application for assessing the feasibility of different impact
evaluation designs. Built with React and Vite, hosted as a static site on Cloudflare Pages.

> **Status:** Prototype v0.7.1 — for methodological peer review. Not for public release.
> A decision-support tool for evaluation design feasibility.

> **Redesign in progress.** The tool is being rebuilt around a robustness ladder, with
> the methodology moved out of JavaScript into reviewer-editable specification files. See
> [`docs/REDESIGN_PLAN.md`](docs/REDESIGN_PLAN.md). Work happens on the `redesign` branch;
> `dev` and `main` continue to serve the current tool.

---

## Contents

- [Purpose](#purpose)
- [Who it is for](#who-it-is-for)
- [The redesign](#the-redesign)
- [Getting started](#getting-started)
- [Repository structure](#repository-structure)
- [The specification](#the-specification)
- [Review](#review)
- [Deployment](#deployment)
- [Contributing](#contributing)
- [Acknowledgements](#acknowledgements)
- [Licence](#licence)

---

## Purpose

Choosing an evaluation design is a methodological judgement made under constraints —
what data exists, whether allocation can be randomised, whether a comparison group is
available, how mature the intervention is. The tool makes those constraints explicit and
shows which designs they rule in and out, with the reasoning and the sources.

It is a structured way of reaching a conversation with a methodologist, not a substitute
for one. It produces questions to take to that conversation.

## Who it is for

Analysts planning an evaluation, and methods reviewers assessing a proposed design. It
assumes familiarity with evaluation methodology but not with any particular framework.

---

## The redesign

The current tool scores 32 design variants and ranks them. A review of it found three
problems that scoring could not fix:

- **The score was compensatory.** Data availability and causal validity were weighted
  equally and summed, so a difference-in-differences with excellent data could outrank a
  randomised trial with adequate data. That inverts the thing the tool exists to advise on.
- **Unanswered questions scored.** Blank answers contributed mid-range values, so a top
  recommendation appeared before the user had answered anything.
- **The tools disagreed.** Stage logic was implemented in three places with different
  conclusions, and the Design Finder and full assessment asked overlapping questions under
  different ids, so they could reach different answers from the same facts.

The redesign replaces scoring with a **robustness ladder**. Designs are ranked by the
assumption that makes their comparison valid — not by how sophisticated the estimator is —
and the tool recommends the highest rung that is feasible.

| Tier | Identifying assumption |
|---|---|
| 1 Randomised | Random allocation gives exchangeability |
| 2 Local as-if random | An assignment rule or instrument isolates exogenous variation |
| 3 Comparison-group panel | Parallel trends, or weighted comparison units that tracked the treated unit |
| 4 Selection on observables | No unmeasured confounding given the measured covariates |
| 5 Single time series | The pre-intervention trend would have continued |

A theory-based strand runs beside the ladder and is never converted into a rung.

Each design is **Blocked**, **Conditional**, **Unknown** or **Feasible**, taking its worst
state across its checks — so no good answer offsets a bad one. An unanswered question
leaves a design Unknown rather than feasible by default. Nothing is scored.

The new flow is at `/ladder`, running alongside the existing sections while it is reviewed.

---

## Getting started

Node 20 or later.

```bash
git clone https://github.com/darren-churchy/policy-evaluation-feasibility-tool.git
cd policy-evaluation-feasibility-tool
npm install
npm run dev          # http://localhost:5173/
```

| Command | Does |
|---|---|
| `npm run dev` | Development server |
| `npm run build` | Production build to `dist/` |
| `npm run preview` | Serve the built output |
| `npm test` | Vitest, single run |
| `npm run spec:check` | Validate `spec/` against its schemas |
| `npm run spec:build` | Recompile the spec bundle the browser imports |
| `npm run pack` | Regenerate the reviewer pack |
| `npm run css:vendor` | Recompile GOV.UK and MoJ Frontend to a local stylesheet |
| `npm run check` | Everything CI runs |

---

## Repository structure

```
spec/                     The methodology, in reviewer-editable files
  tiers.yaml                Five robustness tiers; contested placements
  designs.csv              22 designs, one row each (not per estimator)
  questions.yaml           65 questions — the single source of wording
  rules.yaml               Per design: blockers, conditions, warnings
  stages.yaml              Stage vocabulary, readiness gates, routing
  statistics.yaml          Frequentist and Bayesian question sets
  packs/                   Context packs: examples and vocabulary by sector
  references.bib           Every citation, with a confidence note
  schema/                  JSON Schemas for the above

src/
  engine/                  evaluate() — pure, no React, no I/O
    logic.js                 Three-valued JSON Logic
    evaluate.js              Verdicts, ladder, agenda, statistics
    stage.js                 The one place the app infers a stage
  spec/spec.generated.json Compiled spec the browser imports
  report/                  The shareable HTML report
  state/                   The single answer store
  components/              Pages and shared UI
    statistics/              The statistics module and the ready-reckoner
  data/, scoring/          The current tool, until the switchover

reviewer-pack/            The specification rendered for a methods reviewer
scripts/                  Validation, spec bundle, reviewer pack, CSS
tests/                    312 tests
docs/                     Redesign plan; Bayesian sample-size research
```

---

## The specification

Questions, rules, tiers and citations live in `spec/` rather than in JavaScript, so a
change appears in every tool at once and a methodologist can read and edit it without
reading code.

**Every rule carries a citation**, and the build fails on a key the bibliography does not
define. It also fails on a rule defined for a design that does not exist, a rule testing a
question that does not exist, and — the subtle one — a rule comparing a question against an
option value it does not offer. That last case would make a blocker silently never fire,
which surfaces as a design looking feasible when it has simply never been checked.

**Every question is consumed.** All 65 reach a rule, a gate, a route or the statistics
module, asserted by test. The previous tool collected 80 inputs and scored on 23.

**The tool assesses prospective feasibility.** Some things cannot honestly be established
until the data exist — overlap between treated and untreated units, how many observations
sit near a cutoff, first-stage strength. Those questions are marked `needs_data` and offer
an explicit "not yet established" answer. **No blocker fires on such an answer**, enforced
by the build: not having checked something is never treated as having found it wanting. It
raises a condition carrying what to go and do.

**Numeric thresholds appear only where the literature gives one**, carry their range, and
are marked as conventions where that is what they are. A contested threshold must carry a
range.

---

## Review

`reviewer-pack/` is the specification rendered for someone who knows evaluation
methodology but does not read YAML. Every rule condition appears as a sentence using the
option labels the user sees — `pre_periods is "None"` rather than the underlying
expression — because a reviewer cannot judge a rule they cannot read.

The pack is committed, so a rule change appears in a pull request as a change to the
sentence a reviewer reads. `npm run pack:check` fails if it has drifted.

Open `reviewer-pack/REVIEWER_PACK.md` to read it end to end, or the CSVs to filter and
annotate in a spreadsheet.

---

## Deployment

Cloudflare Pages, built from this repository.

| Branch | Environment |
|---|---|
| `main` | Production |
| `dev` | Staging |
| `redesign` | Redesign work |

Cloudflare runs `npm run build` and serves `dist/`. `public/_redirects` provides the SPA
fallback; `public/_headers` sets security headers.

GOV.UK and MoJ Frontend are compiled locally from npm dependencies, so no stylesheet is
fetched at runtime. The typeface is still loaded from Google Fonts and degrades to a system
fallback if unavailable.

---

## Contributing

Changes to methodology go in `spec/`, never in `reviewer-pack/` or
`src/spec/spec.generated.json` — both are generated. After editing the specification:

```bash
npm run spec:check     # schemas and cross-file integrity
npm run spec:build     # recompile what the browser imports
npm run pack           # regenerate the reviewer pack
npm test
```

Or `npm run check`, which runs all of it plus the build. CI runs the same on every push.

Methodological decisions that have been signed off are guarded by tests — the tier
ordering, the contested placements, the design register, and the rule that no design is
ever restricted to the Grow stage. Changing one requires deliberately changing a test,
which is the point.

---

## Acknowledgements

### AI assistance

This project was developed with substantial assistance from
[Claude](https://claude.ai) (Anthropic), via Claude.ai and Claude Code, during 2025–2026.

Claude assisted with application architecture, code generation, the preceding R Shiny
prototype, methodology documentation, and content including question wording and guidance
text. During the redesign it also assisted with the specification files, the evaluation
engine, the reviewer pack, and the literature pass on Bayesian sample size.

All design decisions, methodological choices and content were directed, reviewed and
approved by the named author, who takes full responsibility for the accuracy,
appropriateness and fitness for purpose of this work.

Claude cannot be attributed as an author or co-author under current copyright law and does
not hold any rights in this work.

See [ACKNOWLEDGEMENTS.md](ACKNOWLEDGEMENTS.md) for the full acknowledgement.

### Methodology sources

The specification cites its sources in `spec/references.bib`, each with a note on how
firmly it supports the use made of it. Principal sources include the Magenta Book and its
Test and Learn annex, the Maryland Scientific Methods Scale, RoB 2 and ROBINS-I, and the
design-specific methods literature. Named guidance is cited as published reference material
and implies no endorsement.

---

## Licence

Copyright © 2026 Darren Churchy

Licensed under the **GNU General Public License v3.0**. You are free to use, modify and
distribute this software under its terms; modified versions distributed to others must also
be released under GPL v3 with source available.

See [LICENSE](LICENSE), or <https://www.gnu.org/licenses/gpl-3.0.html>.

### Dependencies

| Package | Licence |
|---|---|
| [React](https://react.dev) | MIT |
| [Vite](https://vitejs.dev) | MIT |
| [React Router](https://reactrouter.com) | MIT |
| [GOV.UK Frontend](https://frontend.design-system.service.gov.uk) | MIT |
| [MoJ Frontend](https://design-patterns.service.justice.gov.uk) | MIT |
| [Vitest](https://vitest.dev) | MIT |
| [Ajv](https://ajv.js.org) | MIT |
| [yaml](https://eemeli.org/yaml/) | ISC |
| [Sass](https://sass-lang.com) | MIT |

---

*Impact Evaluation Feasibility Tool — Prototype v0.7.1*
*This tool should be used to inform — not replace — professional methodological judgement.*
