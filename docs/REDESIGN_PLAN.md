# Redesign Plan — dev branch adaptation

**Status:** approved to proceed · 19 Oct 2026
**Adapts:** `Feasibility_Tool_Redesign_Plan.md` (Oct 19 2026)
**Baseline:** dev @ `26dc61e`
**App version during redesign:** 0.7.x

This document is the executable plan. The source proposal remains the reference for
*methodology* — the robustness ladder, tier placements, evidence standards and the
statistics module. This document records what changes for **this repository**: the
decisions taken, the deltas from the proposal, the branch model, and the acceptance
check for each phase.

---

## 1. Decisions taken

| Question | Decision |
| --- | --- |
| Sequencing | All seven phases, in order |
| GOV.UK / MoJ CSS | **Kept.** Phase 6 reduced to wording and examples only |
| Version | Stay 0.7.x; normalise the existing inconsistency to 0.7.1 and revisit at phase 5 |
| Transition | Long-lived `redesign` branch; `dev` stays stable and deployable throughout |

### Still open — needed before the phase they block

| Item | Blocks | Default if undecided |
| --- | --- | --- |
| Rule format: YAML + JSON Logic, or an in-house expression format | Phase 2 | JSON Logic — portable, library-backed, the proposal's own recommendation |
| RD-in-time defaults to Tier 3; matching with prior-outcome controls shows as upper Tier 4 | Phase 2 | As proposed, with both views shown where sources disagree |
| First-release context packs: generic + criminal justice only | Phase 6 | As proposed |

The rule-format question can be defaulted safely. The other two are methodological and
should carry your explicit sign-off before the tier table is locked, because changing a
placement after rules are written means rewriting every rule that references it.

---

## 2. Deltas from the source proposal

The proposal was written against this branch and its findings verified (section 3). Four
things change.

**Phase 6 shrinks substantially.** The proposal removes 216 `govuk-*` and 36 `moj-*`
class uses in favour of an own CSS layer. That is cancelled. What remains is removing
institutional *identity* — and the distinction that matters is:

- **Institutional identity** — "Ministry of Justice | Government Social Research" in the
  footer, README and CLAUDE.md. Presents the tool as a government service. **Removed.**
- **Dependency naming** — `GovukComponents.jsx`, `govuk-*` classes, "GOV.UK Frontend CSS"
  in comments. Names a CSS library the way "Bootstrap" would be. **Kept.** The file is not
  renamed; renaming it while retaining `govuk-` classes would obscure rather than clarify.
- **Methodology citation** — Magenta Book, Test and Learn stage labels. **Kept**, per the
  proposal, with version, date and a one-line gloss on first use.

Consequence: the proposal's phase 6 acceptance test ("a search of `src` finds no `govuk-`,
`moj-` or institutional names") is replaced by "no institutional identity strings in `src`,
`index.html` or docs; justice-specific examples come from the active context pack".

**One genuine benefit of the CSS decision is left on the table, and should be taken
anyway.** Keeping the classes does not require keeping the CDN. Vendoring
`govuk-frontend` and `@ministryofjustice/frontend` as npm dependencies and importing the
stylesheets locally gets the two real wins the proposal attributed to removal — the PWA
caches fully offline, and the jsDelivr supply-chain dependency disappears — without
touching a single class name. This is a small, self-contained task. **Recommended for
phase 6.** The same applies to the Google Fonts stylesheet in `index.html`, which the
proposal does not mention but is the same category of dependency.

**No feature flag is needed.** The proposal assumed phases 2–5 would land on a branch that
had to stay usable, implying a flag to switch engines. The long-lived branch removes that:
`src/scoring/` can be deleted outright when `evaluate()` replaces it, because `dev`
continues to serve the current tool from its own history. One engine on the branch at any
time; no dual maintenance.

**Phase 1's CLAUDE.md refresh is urgent, not housekeeping.** CLAUDE.md currently documents
the pre-Cloudflare architecture and is actively wrong in five places (section 3). Anyone —
human or agent — starting phase 1 from it will be misled. Corrected ahead of phase 1 as
part of the version normalisation.

---

## 3. Verified baseline

Every quantitative claim in the proposal was checked against `26dc61e`.

| Proposal claim | Verified |
| --- | --- |
| ~220 `govuk-*`, 37 `moj-*` class uses | 216 and 36 |
| ~14 "Magenta Book", 22 "Test and Learn" | 14 and 18 |
| 32 design variants | 32 (an earlier count of 33 was wrong — it matched an explanatory comment) |
| `did_cs` and `did_sa` share one function | Confirmed — both call `scoreDidCs` |
| Ideal Trial, data inventory, DAG, `p7_mde`, `p7_attrition`, `p3_equipoise` feed nothing | Confirmed — zero references in `scoring.js` |
| No tests, nothing persisted | Confirmed |

**The orphaned-input problem is larger than the proposal states.** The pages collect **80
distinct input IDs**; `scoring.js` reads **23**. Roughly 71% of what the tool asks a user
changes no output. This strengthens the case for the question-agenda model — the current
tool already asks far more than it uses, so pruning to "only what each rung needs" removes
burden rather than capability.

**Version markers are inconsistent at baseline** — three versions live simultaneously:

| Location | Says |
| --- | --- |
| `package.json` | `0.6.0` |
| `src/components/pages/LandingPage.jsx` | Prototype v0.6 |
| `AppLayout.jsx` footer, `ResultsPage.jsx`, `utils/exportToolResult.js` | v0.7 |
| `README.md`, `CLAUDE.md`, `ACKNOWLEDGEMENTS.md` | v0.7 |

**CLAUDE.md is wrong in five places** following the Cloudflare migration:

1. Dev server URL still includes the `/policy-evaluation-feasibility-tool/` base path
2. The companion-tools table describes `public/*.html` as standalone tools — they are
   seven-line redirect stubs; the tools are React routes
3. Deployment section describes GitHub Actions → GitHub Pages
4. "`base` path must match the repository name" — `base` is now `/`
5. Key-files table points at `vite.config.js → REPO_NAME`, which no longer exists

---

## 4. Branch, deploy and version model

```
main                     production  (stable, unchanged by the redesign)
  └─ dev                 staging     (current tool — stays deployable throughout)
       └─ redesign       phases 1–7, one PR per phase into redesign
            └─ redesign/phase-N   individual phase branches
```

`dev` is not touched by redesign work until the ladder flow is complete. Each phase is a
PR into `redesign` with its own acceptance check. `redesign` merges to `dev` after phase 5
at the earliest — the first point at which the tool is coherent end to end.

**Cloudflare:** branch control is currently set to custom branch `dev` only, so the
redesign branch will not get a preview URL. Add `redesign` to the custom branch list to
get `redesign.<project>.pages.dev` for review between phases. One dashboard change,
worth doing before phase 1.

**Two version numbers, deliberately separate:**

- **App version** — `package.json` and all UI/doc surfaces. Normalised to **0.7.1** now.
  Stays 0.7.x through the redesign. Revisited at phase 5, when the shape is clear enough
  to judge whether the result is 0.8.0 or 1.0.0.
- **Spec version** — declared in `spec/tiers.yaml`, independent of the app version.
  Written into every JSON export and every generated reviewer pack. A load with a
  mismatched spec version warns. Starts at `1.0.0` when phase 2 lands, and increments on
  any change to tiers, rules or design identity — not on wording or example changes.

---

## 5. The seven phases

Each phase is one PR into `redesign`. A phase is not merged until its acceptance check
passes.

### Phase 1 — Foundations

Vitest and CI; JSON Schemas for the spec files; corrected CLAUDE.md.

- `vitest` + `@vitest/coverage-v8`; `npm test` and `npm run test:watch`
- `.github/workflows/ci.yml` — schema validation and unit tests on every push
- `spec/schema/*.schema.json` — one per spec file, errors reported with line numbers
- CLAUDE.md corrected (the five errors in section 3) and restructured for the redesign

**Accepted when** CI runs schema validation and unit tests on push, and both pass.

### Phase 2 — Specification and engine

The spec files and `evaluate()`. The largest and highest-risk phase.

- `spec/tiers.yaml`, `designs.csv`, `questions.yaml`, `rules.yaml`, `stages.yaml`,
  `statistics.yaml`, `references.bib`
- `src/engine/evaluate.js` — pure, no React
- 33 variants collapse to ~18 designs with estimators listed beneath; `did_cs`/`did_sa`
  become estimator options of one DiD design, which is what the shared `scoreDidCs`
  function already implies
- `src/scoring/` deleted — weights, ceilings and thresholds go with it
- Build check: fails on schema breach, a rule citing a missing BibTeX key, or a reference
  to a design or question that does not exist
- Reviewer pack generated as CSV and Markdown

**Accepted when** the seven golden scenarios pass, the reviewer pack generates, and every
rule carries a citation key.

**Risk:** the design-level collapse and the tier placements are methodological judgements
encoded in files. Get the two open tier questions signed off before this phase starts.

### Phase 3 — Statistics module

Approach question, both question sets at equal depth, the design/quantity table, the
opt-in ready-reckoner.

**Accepted when** both approaches have the same number of questions and sections, and a
test asserts the engine never reads ready-reckoner output.

**Research pass complete** — see `docs/BAYESIAN_SAMPLE_SIZE.md`. Covers the role of sample
size in Bayesian inference (a small sample does not invalidate the inference; it makes the
prior load-bearing), assurance and precision-based planning as the replacements for power,
SHELF and the Classical Method for prior elicitation, threshold probabilities and the
HDI+ROPE rule for effect size, and the FDA's January 2026 draft guidance. Proposes the
ten-question Bayesian branch. Twelve citations added to `references.bib`.

One gap recorded rather than closed: no UK policy-evaluation source gives Bayesian
sample-size guidance, and the Magenta Book does not address it. Every substantive source
is clinical or US federal.

### Phase 4 — Shared intake and tool consistency

One answer store; all four tools reading one spec.

- Stage, the three readiness checks and claim type asked once
- A single stage-inference function replaces the three current implementations — resolving
  the live contradiction where the quant tree tags RCT/DiD/RD/ITS/IV Grow-only while the
  Design Finder and Causal Readiness say Test and Grow
- Hand-offs between tools carry answers

**Accepted when** an answer given once is prefilled in every tool, and stage tags match
across all four.

### Phase 5 — Flow, layout and results

Ladder flow, persistent summary panel, ladder results view, JSON save/load.

- Rungs asked one at a time; a rung's questions skipped once blocked
- Unanswered stays Unknown — nothing scored from a default
- Save/load via downloaded JSON carrying the spec version; nothing in browser storage by
  default
- The Ideal Trial section, data inventory and DAG get wired into rules, closing most of
  the 57-input orphan gap

**Accepted when** blank answers give Unknown everywhere with no recommendation, and a
save/load round trip restores identical results.

**Decision point:** review the app version here. This is where 0.8.0 vs 1.0.0 becomes
answerable.

### Phase 6 — De-branding and context packs *(reduced scope)*

Wording and examples only. The CSS layer is untouched.

| Target | Count | Action |
| --- | --- | --- |
| "Ministry of Justice \| Government Social Research" | footer, README, CLAUDE.md | Replaced with neutral attribution |
| MoJ references in `README.md` | 5 | Reworded |
| Justice-specific examples (reoffending ×5, probation ×3, custody ×3, prisons, England and Wales) | ~15 | Drawn from the active context pack |
| `spec/packs/generic.yaml`, `spec/packs/criminal-justice.yaml` | new | Examples, benchmark ranges, vocabulary |

Plus the recommended dependency work: vendor `govuk-frontend`, `@ministryofjustice/frontend`
and Source Sans 3 locally, removing the jsDelivr and Google Fonts CDN dependencies.
`vite.config.js` `runtimeCaching` for jsDelivr is then removed from the PWA config.

**Accepted when** no institutional identity strings remain in `src`, `index.html` or docs;
justice-specific examples come from the active pack; and the installed PWA works offline
with no external requests.

**Not in scope:** `govuk-*` and `moj-*` class names, `GovukComponents.jsx`, GOV.UK/MoJ
Frontend as dependencies.

### Phase 7 — Docs and release

README, CLAUDE.md, acknowledgements, merge to `dev`, then `main`.

**Accepted when** a methods reviewer has signed off the reviewer pack.

---

## 6. Golden scenarios

From the proposal, unchanged. These are the phase 2 acceptance tests.

| Scenario | Expected |
| --- | --- |
| Allocation or rollout order randomisable, enough clusters | Tier 1 feasible; theory-based complementary |
| Published score threshold, rule enforced, no sorting evidence | Tier 2 RD feasible; density test a condition |
| Fixed phased rollout, years of pre-data, comparison units | Tier 3 DiD conditional on parallel trends; unlock to Tier 1 names randomised rollout order |
| Single site, no comparison group, one series | Tier 5 conditional; theory-based primary candidate |
| Cross-sectional only, rich covariates | Tier 4 conditional on unmeasured confounding |
| Intervention not defined | Hard gate; routed to process or developmental evaluation |
| Every answer blank | Every design Unknown; no recommendation |

---

## 7. Risks specific to this repository

**Phase 2 is most of the risk.** It deletes the scoring engine and encodes methodology into
files. If the tier placements are wrong, every downstream phase builds on the error. The
long-lived branch contains the blast radius — `dev` keeps serving the current tool — but
the rework cost inside the branch is high. Mitigation: sign off the tier questions first;
golden scenarios written before the rules they test.

**The branch will drift from `dev`.** Any fix landing on `dev` during the redesign must be
rebased into `redesign`. Keep `dev` changes minimal while the redesign is live; rebase at
each phase boundary rather than at the end.

**Accessibility is now lower risk.** Retaining GOV.UK Frontend means retaining its tested
accessible components. The proposal's headline risk — "owning the CSS layer means owning
accessibility conformance" — no longer applies. Axe and keyboard checks are still worth
adding in phase 1, but as regression cover rather than as the safety net for a rewrite.

**ROBINS-I V2 is a draft** dated 20 Nov 2025. The spec records the version date and is
revisited when final.

**Few numeric thresholds have published support.** They appear as warning ranges with
their source; genuine disagreements are shown rather than resolved silently.

---

## 7a. Status at the end of this pass

| Phase | State |
|---|---|
| 1 Foundations | **Done** — Vitest, CI, JSON Schemas, validator |
| 2 Specification and engine | **Done** — six spec files, `evaluate()`, golden scenarios, reviewer pack |
| 3 Statistics module | **Done** — both branches at equal depth; research pass in `docs/BAYESIAN_SAMPLE_SIZE.md` |
| 4 Shared intake and tool consistency | **Done in substance** — spec bundle, one answer store, one stage rule, eleven contradictory tags corrected. The four companion tools still carry their own question flows and have not been migrated to the shared store. |
| 5 Flow, layout and results | **Partly done** — the ladder flow, summary panel, ladder results view, save/load, the statistics module and the ready-reckoner all exist at `/ladder`. The existing seven sections remain; the switchover has not happened. |
| 6 De-branding and context packs | **Done** — institutional identity and justice-specific wording removed, two packs shipped, stylesheets vendored locally |
| 7 Docs and release | **Docs done.** Release requires a methods reviewer to sign off the reviewer pack, and the `redesign` → `dev` merge. |

### What remains

1. **Migrate the four companion tools to the shared store.** They work, and they now
   agree on stage, but each still holds its own question flow. Until they read
   `spec/questions.yaml` an answer given in one is not prefilled in another — which is
   phase 4's full acceptance test.
2. **Switch over from the seven sections to the ladder flow**, and delete `src/scoring/`.
   Retained so far because `npm run check` builds the app and its consumers are live.
   `ResultsPage.jsx` imports `WEIGHTS` and `CATEGORY_CEILINGS` directly, so it is the one
   thing structurally blocking the deletion.
3. **Carry the spec version into exports.** `src/utils/exportToolResult.js` stamps the app
   version only, so an exported result cannot be traced to the rules that produced it.
4. **Self-host the typeface** — the last runtime third-party fetch.
5. **Methods review** of the reviewer pack, which is phase 7's acceptance.

## 8. Immediate next steps

1. Sign off the two methodological open items (tier placements) — blocks phase 2
2. Add `redesign` to Cloudflare custom preview branches — one dashboard change
3. Commission the narrow Bayesian sample-size literature pass — blocks phase 3
4. Begin phase 1

Version normalisation to 0.7.1 and the CLAUDE.md corrections land on `dev` ahead of
phase 1, since both are true regardless of how the redesign proceeds.
