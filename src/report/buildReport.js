// The shareable report.
//
// A self-contained HTML page a user can hand to a stakeholder who will not open the tool:
// what looks feasible and why, what else might be, what is ruled out, and what has to be
// established next. No JavaScript, no external assets, prints cleanly.
//
// Pure: takes the engine's result and returns a string. No React, no DOM, no clock — the
// date is passed in, so the same inputs always give the same bytes and the output can be
// tested.
//
// The thing this has to get right is not overclaiming. Early on — which is most of the
// time — nothing is established as feasible, and the honest report says so while still
// being useful: what is already ruled out, and what to go and find out. A report that
// only works once everything is answered would be a report nobody can use when they need
// it.

import { T } from '../styles/tokens.js'

const esc = value => String(value ?? '')
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;').replace(/'/g, '&#39;')

const STATE_LABEL = {
  feasible: 'Feasible',
  conditional: 'Conditional',
  unknown: 'Not yet established',
  blocked: 'Ruled out',
}

const STATE_COLOUR = {
  feasible: T.green,
  conditional: T.purple,
  unknown: T.greyText,
  blocked: T.magenta,
}

const tag = state => `<span class="tag tag--${state}">${STATE_LABEL[state]}</span>`

/** The headline. Everything else in the report explains or qualifies this. */
function verdict(result) {
  const { readiness, recommendation, designs, highestConditionalTier, ladder } = result

  if (readiness.status === 'failed') {
    return `
      <div class="verdict verdict--blocked">
        <h2>Not ready for impact evaluation</h2>
        <p>No design is recommended, and no data situation changes that. The questions
        below have to be resolved first.</p>
        ${readiness.gates.map(gate => `
          <p><strong>${esc(gate.message)}</strong><br>
          <span class="muted">Instead: ${esc(gate.redirect)}</span></p>`).join('')}
      </div>`
  }

  if (recommendation) {
    const rung = ladder.find(r => r.tier === recommendation.tier)
    const named = recommendation.designs.map(id => designs[id])
    return `
      <div class="verdict verdict--feasible">
        <h2>Most likely to be feasible: ${named.map(d => esc(d.name)).join(', ')}</h2>
        <p><strong>Tier ${recommendation.tier} — ${esc(rung?.name)}.</strong>
        ${esc(rung?.identifyingAssumption)}</p>
        <p>This is the highest rung of the ladder the answers given support. Designs are
        ranked by the assumption that makes their comparison valid, not by how
        sophisticated the method is, so a higher rung is a stronger claim.</p>
        ${named.map(d => `
          <p><strong>${esc(d.name)}</strong> — ${esc(d.estimand)}.
          ${d.warnings.length
            ? `<br><span class="muted">Worth noting: ${d.warnings.map(w => esc(w.message)).join(' ')}</span>`
            : ''}</p>`).join('')}
      </div>`
  }

  if (highestConditionalTier !== null) {
    const rung = ladder.find(r => r.tier === highestConditionalTier)
    return `
      <div class="verdict verdict--conditional">
        <h2>Nothing established as feasible yet — Tier ${highestConditionalTier} is the
        nearest</h2>
        <p><strong>${esc(rung?.name)}.</strong> ${esc(rung?.identifyingAssumption)}</p>
        <p>One or more designs on this rung are conditional rather than ruled out: something
        they need is unmet or has not been checked. What would discharge each condition is
        listed below.</p>
      </div>`
  }

  return `
    <div class="verdict verdict--unknown">
      <h2>Not enough answered to reach a verdict</h2>
      <p>No design has been established as feasible, and none has been ruled out on the
      answers given so far. Nothing here is scored from a blank — an unanswered question
      leaves the designs that depend on it undetermined rather than assumed to be fine.</p>
      <p>The questions below are the ones that would change this, most consequential first.</p>
    </div>`
}

/** Where to focus effort next. For a screening report this is the most useful section. */
function agenda(result) {
  if (!result.agenda.length) {
    return `<h2>What to establish next</h2>
      <p>Every question that could change a verdict has been answered.</p>`
  }

  const rows = result.agenda.map(item => `
    <tr>
      <td>${esc(item.text)}</td>
      <td class="nowrap">${item.gatesReadiness
        ? 'Readiness'
        : item.bestTierAffected !== null ? `Tier ${item.bestTierAffected}` : '—'}</td>
      <td>${item.affects.map(id => esc(result.designs[id]?.name ?? id)).join(', ') || '—'}</td>
    </tr>`).join('')

  return `
    <h2>What to establish next</h2>
    <p>Only questions whose answer could change a verdict are listed, and the highest rung
    each could unlock is given — so effort spent at the top of this list buys the strongest
    available design.</p>
    <table>
      <thead><tr><th>Question</th><th>Could unlock</th><th>Designs waiting on it</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>`
}

/** Every design, by rung, with the reasoning. */
function ladderSection(result, questionText) {
  const rungs = result.ladder.map(rung => {
    const designs = rung.designs.map(design => {
      const detail = []

      for (const b of design.blockers) {
        detail.push(`<p class="reason reason--blocked"><strong>Ruled out.</strong> ${esc(b.message)}</p>`)
      }
      for (const c of design.conditions) {
        detail.push(`<p class="reason"><strong>Condition.</strong> ${esc(c.message)}${
          c.unlock ? `<br><span class="muted">To discharge: ${esc(c.unlock)}</span>` : ''}</p>`)
      }
      if (design.state === 'unknown' && design.unknowns.length) {
        // The question as the user was asked it, not its internal id — this report is
        // read by people who have never opened the tool.
        detail.push(`<p class="reason muted"><strong>Waiting on:</strong></p>
          <ul class="muted">${design.unknowns
            .map(id => `<li>${esc(questionText.get(id) ?? id)}</li>`).join('')}</ul>`)
      }
      if (design.state === 'feasible') {
        for (const w of design.warnings) {
          detail.push(`<p class="reason muted"><strong>Note.</strong> ${esc(w.message)}</p>`)
        }
      }

      return `
        <div class="design">
          <div class="design__head">
            <strong>${esc(design.name)}</strong>${tag(design.state)}
          </div>
          <div class="muted">${esc(design.estimand)}</div>
          ${detail.join('')}
        </div>`
    }).join('')

    return `
      <section class="rung">
        <h3>Tier ${rung.tier} — ${esc(rung.name)}</h3>
        <p class="muted"><strong>Identifying assumption.</strong> ${esc(rung.identifyingAssumption)}${
          rung.evidenceScales?.maryland ? ` · Maryland level ${esc(rung.evidenceScales.maryland)}` : ''}</p>
        ${designs}
      </section>`
  }).join('')

  return `<h2>Every design, by rung</h2>
    <p>Each design takes its worst state across its checks. No good answer offsets a bad
    one.</p>
    ${rungs}`
}

/** Called out separately because "why not" is the question stakeholders ask first. */
function ruledOut(result) {
  const blocked = Object.values(result.designs).filter(d => d.state === 'blocked')
  if (!blocked.length) {
    return `<h2>Ruled out</h2><p>No design has been ruled out on the answers given.</p>`
  }
  const rows = blocked.map(d => `
    <tr>
      <td>${esc(d.name)}</td>
      <td class="nowrap">${d.tier ? `Tier ${d.tier}` : 'Theory-based'}</td>
      <td>${d.blockers.map(b => esc(b.message)).join(' ')}</td>
    </tr>`).join('')
  return `
    <h2>Ruled out, and why</h2>
    <p>These cannot work given the answers provided. Each is ruled out by a specific
    condition, not by a judgement about the method.</p>
    <table>
      <thead><tr><th>Design</th><th>Rung</th><th>Why</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>`
}

function answersGiven(answers, spec) {
  const byId = new Map(spec.questions.map(q => [q.id, q]))
  const rows = Object.entries(answers)
    .map(([id, value]) => {
      const q = byId.get(id)
      if (!q) return null
      const option = q.options.find(o => String(o.value) === String(value))
      return `<tr><td>${esc(q.text)}</td><td>${esc(option?.label ?? value)}</td></tr>`
    })
    .filter(Boolean)

  if (!rows.length) return ''
  return `
    <h2>Answers given</h2>
    <p>${rows.length} of ${spec.questions.length} questions answered.</p>
    <table><thead><tr><th>Question</th><th>Answer</th></tr></thead>
    <tbody>${rows.join('')}</tbody></table>`
}

/**
 * @param {object} args
 * @param {object} args.result    what evaluate() returned
 * @param {object} args.answers   the answer store
 * @param {object} args.spec      the compiled spec
 * @param {string} args.date      rendered as given, so the output is reproducible
 * @param {string} args.appVersion
 */
export function buildReport({ result, answers, spec, date, appVersion = '0.7.1' }) {
  const theory = result.theoryBased
  const questionText = new Map(spec.questions.map(q => [q.id, q.text]))

  return `<!DOCTYPE html>
<html lang="en"><head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Evaluation design feasibility — report</title>
<style>
  body{font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.5;color:${T.ink};
    max-width:820px;margin:40px auto;padding:0 20px;background:#fff}
  h1{font-size:24px;border-bottom:4px solid ${T.purple};padding-bottom:10px;margin-bottom:6px}
  h2{font-size:17px;color:${T.purple};margin-top:34px;border-bottom:1px solid ${T.greyLine};
    padding-bottom:4px}
  h3{font-size:15px;margin:22px 0 4px}
  table{width:100%;border-collapse:collapse;margin-top:10px;font-size:14px}
  th{background:${T.purple};color:#fff;padding:7px 10px;text-align:left;font-size:13px}
  td{vertical-align:top;padding:7px 10px;border-bottom:1px solid ${T.greyLine}}
  .nowrap{white-space:nowrap}
  .muted{color:${T.greyText};font-size:14px}
  .brand{display:inline-block;background:${T.purple};color:#fff;font-size:11px;font-weight:700;
    padding:2px 8px;text-transform:uppercase;letter-spacing:.06em;margin-bottom:14px}
  .meta{font-size:13px;color:${T.greyText};margin-bottom:24px}
  .verdict{padding:16px 20px;margin:24px 0;border-left:5px solid ${T.greyLine};background:${T.greyBg}}
  .verdict h2{margin-top:0;border:0;padding:0;color:${T.ink}}
  .verdict--feasible{border-left-color:${T.green};background:${T.greenTint}}
  .verdict--conditional{border-left-color:${T.purple};background:${T.purpleTint}}
  .verdict--blocked{border-left-color:${T.magenta};background:${T.magentaTint}}
  .rung{margin-bottom:18px}
  .design{border-top:1px solid ${T.greyLine};padding:10px 0 2px}
  .design__head{display:flex;justify-content:space-between;align-items:baseline;gap:12px}
  .reason{margin:6px 0}
  .reason--blocked{color:${T.magenta25}}
  .tag{font-size:11px;font-weight:700;padding:2px 8px;white-space:nowrap;color:#fff}
  .tag--feasible{background:${STATE_COLOUR.feasible}}
  .tag--conditional{background:${STATE_COLOUR.conditional}}
  .tag--unknown{background:${STATE_COLOUR.unknown}}
  .tag--blocked{background:${STATE_COLOUR.blocked}}
  .footer{margin-top:44px;padding-top:14px;border-top:1px solid ${T.greyLine};font-size:12px;
    color:${T.greyText}}
  @media print{body{margin:0;max-width:none}h2{page-break-after:avoid}.design,.verdict{page-break-inside:avoid}}
</style>
</head>
<body>

<div class="brand">Impact Evaluation Feasibility</div>
<h1>Evaluation design feasibility</h1>
<p class="meta"><strong>Generated:</strong> ${esc(date)}
 · <strong>Specification version:</strong> ${esc(result.specVersion)}
 · <strong>Tool version:</strong> ${esc(appVersion)}</p>

${verdict(result)}

${result.nextRungUp ? `
  <h2>A stronger design may be within reach</h2>
  <p><strong>Tier ${result.nextRungUp.tier} — ${esc(result.nextRungUp.name)}</strong> is
  conditional rather than ruled out. What would unlock it:</p>
  <ul>${result.nextRungUp.unlocks.map(u => `<li>${esc(u.unlock)}</li>`).join('')}</ul>` : ''}

${result.readiness.warnings.length ? `
  <h2>Worth weighing</h2>
  ${result.readiness.warnings.map(w => `<p>${esc(w.message)}
    <br><span class="muted">Consider: ${esc(w.redirect)}</span></p>`).join('')}` : ''}

${agenda(result)}

${ruledOut(result)}

${ladderSection(result, questionText)}

<h2>Theory-based evaluation</h2>
<p><strong style="text-transform:capitalize">${esc(theory.role)}</strong>${
  theory.candidate ? ' — worth considering as the primary approach' : ''}.</p>
${theory.reasons.map(r => `<p class="muted">${esc(r)}</p>`).join('')}
<p class="muted">${result.theoryBasedDesigns.map(id => esc(result.designs[id].name)).join(' · ')}</p>

${answersGiven(answers, spec)}

<div class="footer">
  <p>Generated by the Impact Evaluation Feasibility Tool, prototype v${esc(appVersion)},
  against specification version ${esc(result.specVersion)}. Nothing in this report is
  scored: each design takes its worst state across its checks, and an unanswered question
  leaves a design undetermined rather than assumed feasible.</p>
  <p>This output should be used to inform — not replace — professional methodological
  judgement. It is a structured way of reaching a conversation with a methodologist.</p>
</div>

</body></html>`
}
