# Bayesian sample size — research pass

**Status:** closes the evidence gap the redesign plan flagged before `spec/statistics.yaml`
is written. 19 Oct 2026.

The plan recorded that its literature pass "covered NHST power and minimum detectable
effect methods well, but Bayesian sample-size practice (assurance, precision-based
planning, practical-equivalence decision rules, regulator guidance) only lightly", and
that the statistics block should not be locked until that was addressed. The statistics
module requires both approaches to have question sets "of equal depth", so an
under-researched Bayesian half would make that requirement impossible to meet honestly.

This note sets out what the tool should ask and why. Section 7 is the proposed question
set; the rest is the justification a reviewer would need to judge it.

---

## 1. What sample size does in a Bayesian analysis

**The framing the tool should carry: a small sample does not invalidate a Bayesian
inference. It changes what the inference rests on.**

Frequentist inference is justified by the sampling distribution of an estimator — properties
that hold over hypothetical repetitions of the study. Many of those properties are
asymptotic, so with a small sample the nominal coverage of a confidence interval and the
nominal size of a test can both be wrong. Small-sample corrections exist, but they are
approximations to a justification that was never exact at that size.

A posterior distribution is not justified that way. It is a coherent statement about
parameter uncertainty given a prior and the observed data, and that statement is as valid
with 20 units as with 20,000. What changes is not validity but **information**: the
posterior is wider, and a larger share of it comes from the prior rather than from the
data.

That shift is the whole point, and it cuts both ways:

- **It is why Bayesian analysis is worth considering at small N.** The analysis does not
  break; it simply reports more uncertainty. And it can still answer the decision-maker's
  actual question — the probability that the effect exceeds some value that matters —
  where a frequentist test can only decline to reject a null.
- **It is also why Bayesian analysis is not a way to rescue an underpowered study.** If the
  prior is doing most of the work, the conclusion is mostly a restatement of the prior. A
  study of the NICHD Late Hypothermia Trial argues precisely this: with a strong prior and
  a small sample, Bayesian results can mislead, because the posterior largely reflects what
  was assumed rather than what was observed.

The literature does not agree that Bayesian methods are generally better in small samples.
Work reviewed for this pass argues the advantage is often overstated, that estimates can be
worse than frequentist ones where small-sample corrections are used, and that relying on
software-default or diffuse priors at small N is itself risky. The defensible claim is
narrower and more useful:

> At small N, a Bayesian analysis remains valid, and the prior becomes load-bearing.
> Whether that is acceptable depends entirely on whether the prior can be defended.

**Consequence for the tool.** The Bayesian question set must make the prior's contribution
explicit rather than leaving it implicit. A user who cannot say where their prior came from,
or how much of the answer it supplies, does not yet have a Bayesian plan — they have a
frequentist plan with different software.

---

## 2. What replaces power

Power is conditional: the probability of a significant result *given* an assumed true
effect. Three Bayesian alternatives, in rough order of how often they appear in practice.

### Assurance

The unconditional probability that the study produces a positive result, computed as the
prior expectation of power averaged over a prior distribution for the treatment effect.
Introduced by O'Hagan, Stevens and Campbell (2005).

The distinction matters for a commissioner. Conventional power answers "what is the chance
of a significant result if the effect is exactly 0.3?" Assurance answers "what is the chance
this study succeeds, given what we actually believe about the effect?" The second is the
question being asked when a programme board approves a budget.

Sample size is then chosen to reach a target assurance rather than a target power at an
assumed effect.

### Precision-based planning

Choose the sample size so the posterior reaches a stated precision — typically a credible
interval no wider than some value. Often combined with assurance: take the smallest n that
gives the required assurance of achieving the target width.

This is the approach that fits a fixed-budget policy context best, where the question is
less "will it be significant" than "will the estimate be precise enough to act on".
Literature reviewed notes it is most useful where recruitment or cost caps the sample, and
that it is hard to use as the sole criterion — it says nothing about whether the effect is
worth detecting.

### Expected utility and value of information

Choose n by the expected gain from the decision the evidence informs. Conceptually the
cleanest for policy, since it directly prices the evaluation against the decision — and the
least used, because it requires a loss function most teams will not have.

### What practice actually looks like

A systematic review of Bayesian randomised trials found fully Bayesian sample-size methods
are rare: around 4% (7 of 164) of Bayesian RCTs used them, with the rest using hybrid or
frequentist sizing. This is worth carrying into the tool. "Which approach are you using for
sample size?" is a real question with a real chance of the answer being "a frequentist power
calculation, then Bayesian analysis" — a hybrid that is defensible but should be stated
rather than drifted into.

---

## 3. Where the prior comes from

The single most consequential question in a small-sample Bayesian plan, and the one most
often answered with a shrug.

### SHELF — the Sheffield Elicitation Framework

A structured protocol for turning expert judgement into a probability distribution, and the
most established option. Its sequence:

1. **Training**, including basic probability, since experts often have little formal
   statistics.
2. **Disclosure** of conflicts of interest, the basis of each expert's expertise, and the
   evidence they are drawing on.
3. **Individual judgements** — typically minimum, maximum, median and quartiles, asked in an
   order chosen to reduce anchoring and overconfidence.
4. **Facilitated group discussion** toward a consensus distribution (behavioural
   aggregation, rather than averaging individual answers).
5. **Fitting** a distribution to the agreed judgements.

Implemented as an R package covering single or multiple experts across several distribution
families. Extended since to multidimensional quantities and geographically dispersed panels.
A comparison study of aggregation methods found all three studied methods outperformed
individual experts, with SHELF performing best among them.

### The Classical Method

Cooke's alternative, which weights experts by measured performance on calibration questions
with known answers rather than by group consensus. Appropriate where expert quality varies
and can be tested; heavier to run.

### Why the tool should name these

"We used an informative prior based on expert opinion" is not reviewable. "We ran a SHELF
elicitation with five practitioners, individual judgements before discussion, consensus
distribution fitted" is. Signposting a named protocol turns an unauditable claim into an
auditable one — the same move the tool makes everywhere else by asking for the source of a
threshold rather than the threshold alone.

A prior drawn from previous evaluations rather than from experts is usually easier to defend
and should be the first thing asked about.

---

## 4. Effect size: thresholds, equivalence regions and interval width

Under NHST the planning question is "what is the smallest effect worth detecting, and who
decided that?" The Bayesian equivalents are different questions, not translations.

### Decision threshold

What value of the effect would change the decision? The analysis then reports
P(effect > threshold | data) — a direct answer to the question a decision-maker asked.

This is the reframing with the most value for a policy audience: from *is there an effect*
to *how likely is it that the effect is large enough to matter*. Guidance aimed at social
policy evaluation makes the same point, noting that Bayesian methods let evaluators express
findings as probabilities — a stated chance that a programme reduced costs, for instance.

A worked illustration from the social policy literature: an education pilot that misses
conventional significance can still report roughly a 50% probability that the programme
achieves a 10% improvement. That is actionable — it supports either a national rollout
decision or a further pilot — where "not significant" supports neither.

### Region of practical equivalence (ROPE)

A band of effect values treated as practically indistinguishable from no effect. Kruschke's
HDI+ROPE decision rule compares the posterior's highest density interval to that band:

| Posterior HDI | Decision |
|---|---|
| Falls entirely outside the ROPE | Reject the null value |
| Falls entirely inside the ROPE | Accept the null value for practical purposes |
| Overlaps the ROPE | Undecided |

Two things the tool should carry with it:

- **The band is a judgement, not a statistic.** A default of roughly −0.1 to 0.1 on a
  standardised scale is sometimes used, corresponding to a negligible effect under Cohen's
  conventions, but a defensible ROPE comes from what the decision treats as negligible, not
  from a convention. A wider ROPE produces more "accept" decisions and fewer "reject" ones,
  so who set it and on what basis is a question the tool should ask.
- **It is not universally applicable.** Kruschke has used an 89% rather than 95% HDI to
  reduce instability at small samples, and ROPE-based inference is noted as inappropriate
  under multicollinearity.

The ability to *accept* a null for practical purposes is the capability most often missing
from policy evaluation, where "no significant effect" is routinely and wrongly read as
evidence of no effect. A ROPE makes the distinction statable.

### Target interval width

How precise does the estimate need to be to be useful? This is the fixed-budget question,
and it pairs with precision-based planning in section 2. Where the sample is already fixed
by context, the question inverts: what posterior precision should be expected, and how much
of it comes from the prior?

---

## 5. Institutional and regulatory position

### FDA

Two separate documents, often conflated:

- **January 2026 draft guidance, "Use of Bayesian Methodology in Clinical Trials of Drug and
  Biological Products"** (CDER and CBER, docket FDA-2025-D-3217). Scope is drugs and
  biological products — *not* devices, despite at least one secondary source describing it
  as device guidance. Non-binding, and still draft; the comment period closed March 2026.
  Commentary reports it treats Bayesian methods as suitable for confirmatory trials
  including external data borrowing, and that it requires sponsors to justify the prior's
  source, quantify its influence, demonstrate sensitivity to alternative priors and to
  prior-data conflict, and supply enough code for reviewers to reproduce the analysis.
  Reportedly it steps back from insisting on type I error control where an informative prior
  is used, while retaining it for non-informative priors.
- **2010 guidance on Bayesian statistics in medical device clinical trials** — separate, and
  still the device reference.

The substance worth importing is not the regulatory status but the **four requirements**:
justify the prior's source, quantify its influence, show sensitivity, enable reproduction.
Those are exactly the questions a methods reviewer of a policy evaluation would ask.

### Social policy

The US federal evaluation office (OPRE, within ACF) has published an overview of Bayesian
methods for social policy research and evaluation, noting improved precision in small
samples and small subgroups, and the value of probability-framed results. A recent
methodological proposal sets out Bayesian adaptive trials for social policy, arguing they
are particularly suited to pilots intended to scale.

### The gap

**There is no UK policy-evaluation equivalent.** The Magenta Book does not give Bayesian
sample-size guidance. Every substantive source found in this pass is either clinical or US
federal. The tool should therefore present Bayesian planning as a legitimate and
well-specified route while being explicit that the named protocols come from clinical
practice — rather than implying a settled UK convention that does not exist.

---

## 6. Evidence quality

Following the convention used in `spec/references.bib`.

| Topic | Confidence | Basis |
|---|---|---|
| Assurance as the Bayesian counterpart to power | High | Primary source, widely adopted |
| Precision-based planning | High | Multiple methodological papers |
| SHELF protocol and sequence | High | Primary source plus independent comparison study |
| HDI+ROPE decision rule | High | Primary source; limits explicitly a judgement |
| Fully Bayesian SSD is rare in practice | High | Systematic review, explicit proportion |
| FDA Jan 2026 draft content | **Medium** | Title, scope and docket verified against FDA's own listing; substantive requirements from legal and academic commentary, not the text. Still draft. |
| Bayesian advantage at small N | **Contested** | Sources disagree in both directions; the tool should carry the disagreement, not resolve it |
| Bayesian sample-size practice in UK policy evaluation | **No sources found** | A genuine gap, not an omission from this pass |

---

## 7. Proposed question set for `spec/statistics.yaml`

The plan requires both approaches to have question sets of equal depth. Ten questions,
matching the NHST branch in number and structure.

### Shared, asked before the approach splits

Estimand, clustering, outcome type, expected attrition, and whether the sample is fixed by
context or can be chosen.

### Bayesian branch

| # | Question | Why it earns a place |
|---|---|---|
| 1 | What decision does this evidence inform, and what effect size would change it? | Without a threshold the posterior cannot be turned into a decision |
| 2 | Is there a range of effects you would treat as practically equivalent to no effect? | Makes "accept the null for practical purposes" available; forces the band to be a judgement someone owns |
| 3 | Where does your prior come from — previous evaluations, expert elicitation, or a weakly informative default? | The load-bearing question at small N |
| 4 | If elicited, by what protocol? | SHELF, Classical Method, or informal. Signposts a named process |
| 5 | How much of the posterior will come from the prior rather than the data? | Makes the prior's share explicit rather than implicit |
| 6 | Is a prior sensitivity analysis planned, and against which alternatives? | The FDA requirement, and the standard reviewer challenge |
| 7 | What is the plan if the prior and the data conflict? | Prior-data conflict is foreseeable and should have a stated response |
| 8 | Is the sample fixed, or can it be chosen? | Routes to assurance / target interval width, or to expected precision and the prior's contribution |
| 9 | Will the audience expect frequentist error-rate calibration? | If so, operating characteristics need simulating; this is a real constraint in government |
| 10 | If the design adapts, what are the stopping rules and have their operating characteristics been simulated? | Adaptive stopping without simulation is the characteristic failure |

### Tensions to flag — as questions, never verdicts

- An informative prior built on weak or indirect evidence, with no sensitivity plan
- No stated decision threshold or practical-equivalence range, so no decision can follow
- An audience expecting error-rate control, with no simulation planned
- Adaptive stopping rules with no simulated operating characteristics
- The prior supplying most of the information, with no plan to report that share
- **Bayesian methods chosen to rescue an underpowered study rather than because the
  decision is probabilistic** — the tension this whole note exists to make visible

### The ready-reckoner

The plan specifies an opt-in, collapsed-by-default, explicitly illustrative panel, which in
Bayesian mode gives rough expected interval width and the prior's share of the information
from the user's own inputs. Section 1 is the argument for why the prior's share is the right
thing to show: it is the quantity that determines whether a small-sample Bayesian analysis
is informative or merely a restatement of its assumptions.

The engine must never read it. The plan requires a test enforcing that, and it should be
written alongside the panel rather than after.

---

## Sources

- [O'Hagan, Stevens & Campbell (2005), *Assurance in clinical trial design*, Pharmaceutical Statistics 4(3):187–201](https://tonyohagan.co.uk/academic/abs/assurance.html)
- [Gosling, *SHELF: The Sheffield Elicitation Framework*](https://downloads.regulations.gov/FWS-R5-ES-2023-0122-0003/attachment_18.pdf)
- [Comparison of prior elicitation aggregation using the Classical Method and SHELF](https://academic.oup.com/jrsssa/article/184/3/920/7068419)
- [Kruschke (2018), *Rejecting or Accepting Parameter Values in Bayesian Estimation*](https://journals.sagepub.com/doi/10.1177/2515245918771304)
- [Region of Practical Equivalence — bayestestR documentation](https://easystats.github.io/bayestestR/articles/region_of_practical_equivalence.html)
- [Systematic review of sample size determination in Bayesian randomized clinical trials](https://pmc.ncbi.nlm.nih.gov/articles/PMC13220564/)
- [Wilson et al. (2022), *Bayesian sample size determination for diagnostic accuracy studies*](https://onlinelibrary.wiley.com/doi/10.1002/sim.9393)
- [Wilson et al. (2021), *Bayesian design and analysis of external pilot trials for complex interventions*](https://onlinelibrary.wiley.com/doi/full/10.1002/sim.8941)
- [*Why results from Bayesian analyses with a strong prior and small sample sizes may be misleading* — NICHD Late Hypothermia Trial](https://www.ncbi.nlm.nih.gov/pmc/articles/PMC6618074/)
- [FDA, *Use of Bayesian Methodology in Clinical Trials of Drug and Biological Products* (draft, Jan 2026)](https://www.fda.gov/regulatory-information/search-fda-guidance-documents/use-bayesian-methodology-clinical-trials-drug-and-biological-products)
- [FDA, *Guidance for the Use of Bayesian Statistics in Medical Device Clinical Trials* (2010)](https://www.federalregister.gov/documents/2010/02/08/2010-2596/guidance-for-industry-and-food-and-drug-administration-guidance-for-the-use-of-bayesian-statistics)
- [OPRE/ACF, *Bayesian Methods for Social Policy Research and Evaluation*](https://www.acf.hhs.gov/opre/report/bayesian-methods-social-policy-research-and-evaluation)
- [*Bayesian adaptive trials for social policy*, Data & Policy](https://www.cambridge.org/core/journals/data-and-policy/article/bayesian-adaptive-trials-for-social-policy/95BED92A367269D01A4C367F315A5302)
- [*A Bayesian Perspective on Intervention Research*, Journal of the Society for Social Work and Research](https://www.journals.uchicago.edu/doi/full/10.1086/693432)
