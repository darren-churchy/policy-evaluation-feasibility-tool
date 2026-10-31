// The review form.
//
// REVIEWER_PACK.md is for reading. This is for answering: one self-contained HTML file a
// reviewer opens from an email, works through at their own pace, and returns as text that
// can be pasted straight back into a conversation or an issue.
//
// Generated from spec/ like the pack, so a rule change regenerates the question about it.
// A hand-made form would be stale the first time a message was reworded.
//
// Three things it has to get right.
//
// **Silence is not agreement.** Every item starts with no response and the output carries
// only what the reviewer actually answered. A form that defaults to "agree" collects
// agreement it was never given — which is the same mistake the tool itself refuses to
// make when an unanswered question leaves a design Unknown rather than feasible.
//
// **A review is not 179 verdicts.** The checks are grouped per design and collapsed, so a
// reviewer can go straight to what they know about and leave the rest alone. Partial
// review is the expected case, not a failure.
//
// **It has to come back.** No server, no account: a Copy button puts compact Markdown on
// the clipboard, and save/load of a small JSON file means a long review survives being
// put down.

import { writeFileSync, mkdirSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { loadSpec } from './lib/loadSpec.mjs'
import { describeExpression } from './lib/describe.mjs'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const OUT = join(ROOT, 'reviewer-pack', 'REVIEW_FORM.html')

const esc = v => String(v ?? '')
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;').replace(/'/g, '&#39;')

const clean = v => String(v ?? '').replace(/\s+/g, ' ').trim()

/**
 * One reviewable item: a radio triple plus a comment box, answering nothing by default.
 *
 * `plain` is what the copied feedback carries. Stripping tags out of the displayed
 * heading instead ran the "Blocks" label straight into the message — readable on screen
 * where it is a coloured chip, nonsense once flattened to text.
 */
function item(id, heading, detail, plain) {
  return `
  <div class="item" data-id="${esc(id)}" data-heading="${esc(plain ?? heading)}">
    <div class="item__heading">${heading}</div>
    ${detail ? `<div class="item__detail">${detail}</div>` : ''}
    <div class="item__controls">
      ${['Agree', 'Disagree', 'Unsure'].map(v => `
        <label class="choice">
          <input type="radio" name="${esc(id)}" value="${v}"> ${v}
        </label>`).join('')}
      <button type="button" class="clear" onclick="clearItem(this)">clear</button>
    </div>
    <textarea rows="2" placeholder="Comment, or a suggested rewording — optional"></textarea>
  </div>`
}

function section(id, title, blurb, body) {
  return `
<section id="${esc(id)}">
  <h2>${esc(title)}</h2>
  ${blurb ? `<p class="blurb">${blurb}</p>` : ''}
  ${body}
</section>`
}

/** The claims the project treats as settled, each guarded by a test. */
function signOff(spec) {
  const tiers = [...spec.tiers.tiers].sort((a, b) => a.tier - b.tier)

  const fixed = [
    item('signoff_ladder',
      'Designs should be ranked by the assumption that makes their comparison valid, not by the sophistication of the estimator.',
      `The five rungs, highest first:<ul>${tiers
        .map(t => `<li><strong>Tier ${t.tier} ${esc(t.name)}</strong> — ${esc(clean(t.identifying_assumption))}</li>`)
        .join('')}</ul>`),
    item('signoff_worst_state',
      'A design should take its worst state across its checks, so no good answer offsets a bad one.',
      'A design with one blocker is blocked however well everything else is met. The alternative — averaging, or trading data quality against design strength — is what the previous tool did.'),
    item('signoff_unknown',
      'An unanswered question should leave a design Unknown, never feasible by default.',
      'The previous tool scored blanks at mid-range, so a recommendation appeared before anything had been answered.'),
    item('signoff_not_established',
      'Not having checked something should never rule a design out.',
      'Overlap, density at a cutoff and first-stage strength cannot be established before the data exist. Answering "not yet established" raises a condition with something to go and do; only an actual adverse finding blocks.'),
    item('signoff_theory_based',
      'The theory-based strand should run beside the ladder and never be converted into a rung.',
      `Covering ${spec.designs.filter(d => d.strand === 'theory_based').map(d => esc(d.name)).join(', ')}.`),
    item('signoff_estimator',
      'The register should hold one row per design, not per estimator.',
      'Estimator choice never moves a design up a tier, so Callaway-Sant’Anna and Sun-Abraham are options of staggered difference-in-differences rather than designs in their own right.'),
  ]

  const contested = (spec.tiers.contested_placements ?? []).map((c, i) => item(
    `contested_${i}`,
    `Contested placement: ${esc(c.subject)} sits at Tier ${c.default_tier}.`,
    `<div class="views">${(c.views ?? []).map(v => `
      <div class="view${v.tier === c.default_tier ? ' view--chosen' : ''}">
        <strong>Tier ${v.tier}${v.qualifier ? ` — ${esc(clean(v.qualifier))}` : ''}</strong>
        ${v.tier === c.default_tier ? ' <span class="chosen-tag">chosen</span>' : ''}
        <div>${esc(clean(v.argument))}</div>
      </div>`).join('')}</div>`,
  ))

  return section('signoff', '1. The decisions the tool rests on',
    'These are the ones worth your time if you read nothing else. Each is currently guarded by a test, so disagreeing with one means changing the tool deliberately rather than by accident.',
    fixed.join('') + contested.join(''))
}

function designRegister(spec) {
  const byTier = new Map()
  for (const d of spec.designs) {
    const key = d.tier ?? 'theory'
    if (!byTier.has(key)) byTier.set(key, [])
    byTier.get(key).push(d)
  }

  const rows = [...byTier.entries()]
    .sort((a, b) => (a[0] === 'theory' ? 99 : a[0]) - (b[0] === 'theory' ? 99 : b[0]))
    .map(([tier, designs]) => `
      <h3>${tier === 'theory' ? 'Theory-based strand' : `Tier ${tier}`}</h3>
      <table>
        <thead><tr><th>Design</th><th>Estimand</th><th>Estimator options</th></tr></thead>
        <tbody>${designs.map(d => `
          <tr>
            <td><strong>${esc(d.name)}</strong></td>
            <td>${esc(d.estimand)}</td>
            <td>${esc((d.estimator_options ?? []).join(', ') || '—')}</td>
          </tr>`).join('')}</tbody>
      </table>`).join('')

  return section('register', '2. The design register',
    `${spec.designs.length} designs, reduced from the previous tool’s 32 by merging estimator variants. Is anything here placed wrongly, missing, or not worth carrying?`,
    rows + item('register_overall', 'The register and its tier placements are right.',
      'Use the comment box for anything specific — a design in the wrong place, one that should not be offered, or one that is missing.'))
}

function rules(spec, questionsById) {
  const designsById = new Map(spec.designs.map(d => [d.id, d]))
  const blocks = []

  for (const [designId, groups] of Object.entries(spec.rules.designs)) {
    const design = designsById.get(designId)
    const checks = []
    for (const [group, label] of [['blockers', 'Blocks'], ['conditions', 'Conditional on'], ['warnings', 'Warns']]) {
      for (const check of groups[group] ?? []) {
        checks.push(item(
          `rule_${designId}_${check.id}`,
          `<span class="kind kind--${group}">${label}</span> ${esc(clean(check.message))}`,
          `<div class="fires">Fires when ${esc(describeExpression(check.test, questionsById))}</div>`
          + (check.unlock ? `<div class="unlock">To discharge: ${esc(clean(check.unlock))}</div>` : '')
          + (check.citations?.length ? `<div class="cites">${esc(check.citations.join(', '))}</div>` : ''),
          `${design?.name ?? designId} — ${label.toLowerCase()}: ${clean(check.message)}`,
        ))
      }
    }
    blocks.push(`
      <details>
        <summary>${esc(design?.name ?? designId)}${design?.tier ? ` — Tier ${design.tier}` : ''}
          <span class="count">${checks.length} check${checks.length === 1 ? '' : 's'}</span>
        </summary>
        <div class="checks">${checks.join('')}</div>
      </details>`)
  }

  return section('rules', '3. The rules, design by design',
    'Each is shown as the sentence it renders to, using the option labels a user sees. Open only the designs you want to comment on — leaving one closed says nothing either way.',
    blocks.join(''))
}

function questions(spec) {
  const rows = spec.questions.map(q => `
    <tr>
      <td><strong>${esc(q.text)}</strong>${q.hint ? `<div class="hint">${esc(clean(q.hint))}</div>` : ''}</td>
      <td>${q.options.map(o => esc(o.label)).join('<br>')}</td>
      <td class="nowrap">${q.establishable === 'needs_data' ? 'Needs the data' : 'Before the data'}</td>
    </tr>`).join('')

  return section('questions', '4. The questions',
    `All ${spec.questions.length}, with the options as a user sees them. Is anything asked in a way that would mislead, or missing?`,
    `<details><summary>Show the question bank<span class="count">${spec.questions.length}</span></summary>
      <table><thead><tr><th>Question</th><th>Options</th><th>When answerable</th></tr></thead>
      <tbody>${rows}</tbody></table></details>`
    + item('questions_overall', 'The questions are the right ones, asked the right way.',
      'Comment on anything specific — wording that would mislead, an option missing, or a question that should not be asked.'))
}

export function buildReviewForm() {
  const spec = loadSpec()
  const questionsById = new Map(spec.questions.map(q => [q.id, q]))
  const version = spec.tiers.spec_version

  return `<!DOCTYPE html>
<html lang="en"><head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Impact Evaluation Feasibility Tool — methods review</title>
<style>
  :root { --ink:#0b0c0c; --grey:#505a5f; --line:#b1b4b6; --bg:#f3f2f1;
          --purple:#54319f; --purple-tint:#eeeaf7; --green:#0f7a52; --magenta:#ca357c; }
  *{box-sizing:border-box}
  body{font-family:Arial,Helvetica,sans-serif;font-size:16px;line-height:1.5;color:var(--ink);
    max-width:860px;margin:0 auto;padding:0 20px 80px;background:#fff}
  h1{font-size:26px;border-bottom:4px solid var(--purple);padding-bottom:10px;margin-bottom:4px}
  h2{font-size:19px;color:var(--purple);margin-top:40px;border-bottom:1px solid var(--line);padding-bottom:6px}
  h3{font-size:15px;margin:22px 0 6px}
  .meta{font-size:13px;color:var(--grey)}
  .blurb{font-size:15px;color:var(--grey)}
  .who{background:var(--bg);padding:14px 16px;margin:20px 0}
  .who label{display:block;font-size:13px;font-weight:700;margin-bottom:4px}
  .who input{font:inherit;padding:6px 8px;border:2px solid var(--ink);width:100%;max-width:360px}
  .item{border-left:3px solid var(--line);padding:10px 0 10px 14px;margin:16px 0}
  .item--answered{border-left-color:var(--purple);background:var(--purple-tint)}
  .item__heading{font-weight:600}
  .item__detail{font-size:14px;color:var(--grey);margin-top:4px}
  .item__controls{display:flex;gap:14px;flex-wrap:wrap;align-items:center;margin:10px 0 6px}
  .choice{font-size:14px;cursor:pointer}
  .clear{font:inherit;font-size:12px;background:none;border:none;color:var(--grey);
    text-decoration:underline;cursor:pointer;padding:0}
  textarea{width:100%;font:inherit;font-size:14px;padding:6px 8px;border:2px solid var(--line)}
  textarea:focus,input:focus{outline:3px solid #fd0;outline-offset:0}
  details{border-top:1px solid var(--line);padding:8px 0}
  summary{cursor:pointer;font-weight:600}
  .count{float:right;font-weight:400;font-size:13px;color:var(--grey)}
  .checks{padding-left:4px}
  .kind{font-size:11px;font-weight:700;text-transform:uppercase;padding:1px 6px;color:#fff}
  .kind--blockers{background:var(--magenta)} .kind--conditions{background:var(--purple)}
  .kind--warnings{background:var(--grey)}
  .fires{font-family:monospace;font-size:13px;color:var(--grey);margin-top:4px}
  .unlock,.cites{font-size:13px;color:var(--grey)}
  .views{display:grid;gap:8px;margin-top:8px}
  .view{border:1px solid var(--line);padding:8px 10px;font-size:14px}
  .view--chosen{border-color:var(--purple);background:var(--purple-tint)}
  .chosen-tag{font-size:11px;font-weight:700;background:var(--purple);color:#fff;padding:1px 6px}
  table{width:100%;border-collapse:collapse;font-size:14px;margin:8px 0}
  th{background:var(--purple);color:#fff;text-align:left;padding:6px 8px;font-size:13px}
  td{border-bottom:1px solid var(--line);padding:6px 8px;vertical-align:top}
  .hint{font-size:13px;color:var(--grey)}
  .nowrap{white-space:nowrap}
  .bar{position:sticky;bottom:0;background:#fff;border-top:2px solid var(--purple);
    padding:12px 0;display:flex;gap:10px;flex-wrap:wrap;align-items:center}
  button.action{font:inherit;font-weight:600;padding:10px 16px;cursor:pointer;
    background:var(--purple);color:#fff;border:none}
  button.action--secondary{background:#fff;color:var(--ink);border:2px solid var(--ink)}
  .tally{font-size:14px;color:var(--grey)}
  @media print{.bar,.clear{display:none}details{display:block}details>div{display:block!important}}
</style>
</head>
<body>

<h1>Methods review</h1>
<p class="meta">Impact Evaluation Feasibility Tool · specification version ${esc(version)} ·
  ${spec.designs.length} designs · ${spec.questions.length} questions</p>

<p>Thank you for looking at this. It is a decision-support tool for choosing an impact
evaluation design: it asks what constraints apply, then says which designs are ruled out,
which remain possible and what would have to be established to use them. It ranks designs
by the assumption that makes their comparison valid and <strong>scores nothing</strong>.</p>

<p><strong>You are not expected to answer everything.</strong> Section 1 is the part worth
your time if you read nothing else. Everything is optional and nothing you leave blank is
recorded as agreement — the output carries only what you actually answered.</p>

<p>When you are done, press <strong>Copy for email</strong> at the bottom and paste the
result into your reply. <strong>Save progress</strong> downloads a small file you can load
back in later if you want to stop partway.</p>

<div class="who">
  <label for="reviewer">Your name, so the comments can be attributed</label>
  <input id="reviewer" type="text" placeholder="Optional">
</div>

${signOff(spec)}
${designRegister(spec)}
${rules(spec, questionsById)}
${questions(spec)}

${section('anything', '5. Anything else',
  'Anything the sections above did not have a box for — including whether the tool is answering the right question at all.',
  '<textarea id="freeform" rows="6" placeholder="Optional"></textarea>')}

<div class="bar">
  <button class="action" onclick="copyFeedback()">Copy for email</button>
  <button class="action action--secondary" onclick="saveProgress()">Save progress</button>
  <button class="action action--secondary" onclick="document.getElementById('load').click()">Load progress</button>
  <input id="load" type="file" accept="application/json" style="display:none" onchange="loadProgress(event)">
  <span class="tally" id="tally">nothing answered yet</span>
</div>

<script>
const SPEC_VERSION = ${JSON.stringify(version)}

function items() { return [...document.querySelectorAll('.item')] }

function readItem(el) {
  const choice = el.querySelector('input[type=radio]:checked')
  const comment = el.querySelector('textarea').value.trim()
  if (!choice && !comment) return null
  return { id: el.dataset.id, heading: el.dataset.heading,
           verdict: choice ? choice.value : '', comment }
}

function answered() { return items().map(readItem).filter(Boolean) }

function refresh() {
  for (const el of items()) el.classList.toggle('item--answered', !!readItem(el))
  const n = answered().length
  const free = document.getElementById('freeform').value.trim() ? 1 : 0
  document.getElementById('tally').textContent =
    (n + free) === 0 ? 'nothing answered yet'
    : (n + free) + ' response' + ((n + free) === 1 ? '' : 's') + ' — only these are included'
}
document.addEventListener('input', refresh)
document.addEventListener('change', refresh)

function clearItem(button) {
  const el = button.closest('.item')
  for (const r of el.querySelectorAll('input[type=radio]')) r.checked = false
  el.querySelector('textarea').value = ''
  refresh()
}

function asMarkdown() {
  const who = document.getElementById('reviewer').value.trim() || 'Unnamed reviewer'
  const free = document.getElementById('freeform').value.trim()
  const rows = answered()

  const lines = [
    '# Methods review — ' + who,
    '',
    'Specification version ' + SPEC_VERSION + '. ' + rows.length +
      ' item' + (rows.length === 1 ? '' : 's') + ' answered; everything else left without a response.',
    '',
  ]
  for (const r of rows) {
    lines.push('- **' + r.heading.replace(/<[^>]+>/g, '').trim() + '**')
    if (r.verdict) lines.push('  - ' + r.verdict.toUpperCase())
    if (r.comment) lines.push('  - ' + r.comment.replace(/\\n+/g, ' '))
  }
  if (free) { lines.push('', '## Anything else', '', free) }
  if (!rows.length && !free) lines.push('_No responses recorded._')
  return lines.join('\\n')
}

async function copyFeedback() {
  const text = asMarkdown()
  try {
    await navigator.clipboard.writeText(text)
    alert('Copied. Paste it into your reply.')
  } catch {
    // Clipboard access is blocked on some file:// origins; fall back to a download.
    download(text, 'methods-review.md', 'text/markdown')
    alert('Your browser would not let the page use the clipboard, so the feedback has been downloaded instead. Attach methods-review.md to your reply.')
  }
}

function download(content, name, type) {
  const a = document.createElement('a')
  a.href = URL.createObjectURL(new Blob([content], { type: type + ';charset=utf-8' }))
  a.download = name
  a.click()
  URL.revokeObjectURL(a.href)
}

function saveProgress() {
  const state = { specVersion: SPEC_VERSION, reviewer: document.getElementById('reviewer').value,
                  freeform: document.getElementById('freeform').value, items: {} }
  for (const el of items()) {
    const r = readItem(el)
    if (r) state.items[r.id] = { verdict: r.verdict, comment: r.comment }
  }
  download(JSON.stringify(state, null, 2), 'methods-review-progress.json', 'application/json')
}

function loadProgress(event) {
  const file = event.target.files[0]
  if (!file) return
  const reader = new FileReader()
  reader.onload = () => {
    let state
    try { state = JSON.parse(reader.result) } catch { alert('That file could not be read.'); return }
    if (state.specVersion && state.specVersion !== SPEC_VERSION) {
      alert('That review was started against specification version ' + state.specVersion +
            ', and this form is version ' + SPEC_VERSION + '. Your answers are restored, but check anything that may have been reworded since.')
    }
    document.getElementById('reviewer').value = state.reviewer ?? ''
    document.getElementById('freeform').value = state.freeform ?? ''
    for (const el of items()) {
      const saved = state.items?.[el.dataset.id]
      if (!saved) continue
      if (saved.verdict) {
        const radio = el.querySelector('input[value="' + saved.verdict + '"]')
        if (radio) radio.checked = true
      }
      el.querySelector('textarea').value = saved.comment ?? ''
    }
    refresh()
  }
  reader.readAsText(file)
  event.target.value = ''
}

refresh()
</script>
</body></html>`
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  mkdirSync(dirname(OUT), { recursive: true })
  writeFileSync(OUT, buildReviewForm())
  console.log('review form: reviewer-pack/REVIEW_FORM.html')
}
