// Generates the reviewer pack: the specification rendered for a methods reviewer who
// knows evaluation methodology but does not read YAML or JSON Logic.
//
// The pack is committed, not just built, so that a change to a rule shows up in a pull
// request as a change to the sentence a reviewer reads. `npm run pack:check` regenerates
// it and fails if it differs from what is committed, so it cannot drift from the spec.
//
// Deliberately contains no timestamp: the output must be reproducible, or the drift check
// would fail on every run.

import { writeFileSync, mkdirSync, readFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { loadSpec } from './lib/loadSpec.mjs'
import { toCsv } from './lib/csv.mjs'
import { describeExpression, questionsRead, describeThreshold } from './lib/describe.mjs'

const ROOT = fileURLToPath(new URL('..', import.meta.url))
const OUT = join(ROOT, 'reviewer-pack')

const GROUP_LABEL = { blockers: 'Blocker', conditions: 'Condition', warnings: 'Warning' }

/** Parse references.bib into { key: { type, fields } } — enough to list them. */
function parseBib(source) {
  const entries = []
  const re = /@(\w+)\s*\{\s*([^,\s]+)\s*,([\s\S]*?)\n\}/g
  let m
  while ((m = re.exec(source))) {
    const [, type, key, body] = m
    const field = name => {
      const fm = new RegExp(`\\b${name}\\s*=\\s*\\{([\\s\\S]*?)\\}\\s*(?:,|$)`).exec(body)
      return fm ? fm[1].replace(/\s+/g, ' ').replace(/[{}]/g, '').trim() : ''
    }
    entries.push({ key, type, title: field('title'), author: field('author'), year: field('year'), doi: field('doi'), url: field('url'), note: field('note') })
  }
  return entries
}

/** Flatten every check in rules.yaml into one row per check. */
function flattenRules(spec, questionsById) {
  const designsById = new Map(spec.designs.map(d => [d.id, d]))
  const rows = []

  for (const [designId, groups] of Object.entries(spec.rules.designs)) {
    const design = designsById.get(designId)
    for (const group of ['blockers', 'conditions', 'warnings']) {
      for (const check of groups[group] ?? []) {
        rows.push({
          design_id: designId,
          design_name: design?.name ?? '',
          tier: design?.tier ?? '',
          strand: design?.strand ?? '',
          type: GROUP_LABEL[group],
          check_id: check.id,
          fires_when: describeExpression(check.test, questionsById),
          reads: questionsRead(check.test).join(' '),
          message: check.message?.replace(/\s+/g, ' ').trim() ?? '',
          unlock: check.unlock?.replace(/\s+/g, ' ').trim() ?? '',
          rob_domain: check.rob_domain ?? '',
          threshold: describeThreshold(check.threshold),
          citations: (check.citations ?? []).join(' '),
        })
      }
    }
  }
  return rows
}

function buildCsvs(spec, questionsById, ruleRows) {
  const files = {}

  files['rules.csv'] = toCsv(ruleRows, [
    'design_id', 'design_name', 'tier', 'strand', 'type', 'check_id',
    'fires_when', 'reads', 'message', 'unlock', 'rob_domain', 'threshold', 'citations',
  ])

  files['tiers.csv'] = toCsv(
    spec.tiers.tiers.map(t => ({
      tier: t.id,
      name: t.name,
      identifying_assumption: t.identifying_assumption.replace(/\s+/g, ' ').trim(),
      maryland: t.evidence_scales?.maryland ?? '',
      maryland_note: (t.evidence_scales?.maryland_note ?? '').replace(/\s+/g, ' ').trim(),
      designs: spec.designs.filter(d => d.tier === t.id).map(d => d.id).join(' '),
      citations: (t.citations ?? []).join(' '),
    })),
    ['tier', 'name', 'identifying_assumption', 'maryland', 'maryland_note', 'designs', 'citations'],
  )

  files['designs.csv'] = toCsv(
    spec.designs.map(d => ({
      id: d.id,
      name: d.name,
      strand: d.strand,
      tier: d.tier ?? '',
      tier_qualifier: (d.tier_qualifier ?? '').replace(/\s+/g, ' ').trim(),
      family: d.family,
      estimand: d.estimand,
      estimator_options: (d.estimator_options ?? []).join(' | '),
      prospective_only: d.prospective_only ?? false,
      blockers: (spec.rules.designs[d.id]?.blockers ?? []).length,
      conditions: (spec.rules.designs[d.id]?.conditions ?? []).length,
      warnings: (spec.rules.designs[d.id]?.warnings ?? []).length,
      notes: (d.notes ?? '').replace(/\s+/g, ' ').trim(),
    })),
    ['id', 'name', 'strand', 'tier', 'tier_qualifier', 'family', 'estimand',
      'estimator_options', 'prospective_only', 'blockers', 'conditions', 'warnings', 'notes'],
  )

  const usedBy = new Map()
  for (const row of ruleRows) {
    for (const q of row.reads.split(' ').filter(Boolean)) {
      if (!usedBy.has(q)) usedBy.set(q, new Set())
      usedBy.get(q).add(row.design_id)
    }
  }

  files['questions.csv'] = toCsv(
    spec.questions.map(q => ({
      id: q.id,
      text: q.text.replace(/\s+/g, ' ').trim(),
      hint: (q.hint ?? '').replace(/\s+/g, ' ').trim(),
      intake: Boolean(q.intake),
      tier: q.tier ?? '',
      establishable: q.establishable ?? '',
      asked_when: q.applies_when ? describeExpression(q.applies_when, questionsById) : '(always)',
      options: q.options.map(o => `${o.value}=${o.label}`).join(' | '),
      rob_domain: q.rob_domain ?? '',
      used_by: [...(usedBy.get(q.id) ?? [])].sort().join(' '),
      references: (q.references ?? []).join(' '),
    })),
    ['id', 'text', 'hint', 'intake', 'tier', 'establishable', 'asked_when', 'options', 'rob_domain', 'used_by', 'references'],
  )

  const stats = spec.statistics
  if (stats) {
    const rows = []
    for (const [approach, body] of Object.entries(stats.approaches ?? {})) {
      for (const t of body.tensions ?? []) {
        rows.push({
          approach,
          tension_id: t.id,
          raised_when: describeExpression(t.when, questionsById),
          reads: questionsRead(t.when).join(' '),
          message: (t.message ?? '').replace(/\s+/g, ' ').trim(),
          prompt: (t.prompt ?? '').replace(/\s+/g, ' ').trim(),
          citations: (t.citations ?? []).join(' '),
        })
      }
    }
    files['statistics.csv'] = toCsv(rows, [
      'approach', 'tension_id', 'raised_when', 'reads', 'message', 'prompt', 'citations',
    ])
  }

  return files
}

function buildMarkdown(spec, questionsById, ruleRows, bib) {
  const L = []
  const w = (...lines) => L.push(...lines)
  const clean = s => (s ?? '').replace(/\s+/g, ' ').trim()
  const designsById = new Map(spec.designs.map(d => [d.id, d]))

  const counts = {
    designs: spec.designs.length,
    counterfactual: spec.designs.filter(d => d.strand === 'counterfactual').length,
    theory: spec.designs.filter(d => d.strand === 'theory_based').length,
    questions: spec.questions.length,
    needsData: spec.questions.filter(q => q.establishable === 'needs_data').length,
    checks: ruleRows.length,
    blockers: ruleRows.filter(r => r.type === 'Blocker').length,
    conditions: ruleRows.filter(r => r.type === 'Condition').length,
    warnings: ruleRows.filter(r => r.type === 'Warning').length,
    references: bib.length,
  }

  w('# Reviewer pack', '')
  w(`**Specification version ${spec.tiers.spec_version}**`, '')
  w('Generated from `spec/` by `npm run pack`. Do not edit — edit the specification and',
    'regenerate. `npm run pack:check` fails if this file has drifted from the spec.', '')

  w('## What you are being asked', '')
  w('Whether each rule below is methodologically correct: that the condition it fires on is',
    'the right one, that blocking, conditioning or warning is the right response, and that',
    'the source cited supports it.', '')
  w('Four things are worth knowing before reading:', '')
  w('1. **A design takes its worst state.** No good answer offsets a bad one. A design with',
    '   one blocker is blocked regardless of everything else being in place.',
    '2. **Nothing is scored.** There are no weights and no thresholds that trade one quality',
    '   against another. The tool recommends the highest rung that is feasible.',
    '3. **An unanswered question leaves a design Unknown**, never feasible by default.',
    '4. **The tool assesses prospective feasibility.** Some questions cannot honestly be',
    '   answered until the data exist — overlap between treated and untreated units, how',
    '   many observations sit near a cutoff, how strong a first stage is. Each of those is',
    '   marked `needs_data` in `questions.csv` and offers an explicit "not yet established"',
    '   answer. **No blocker fires on such an answer**, enforced by the build: not having',
    '   checked something is never treated as having found it wanting. It raises a condition',
    '   carrying what to go and do instead.', '')

  w('## Summary', '')
  w('| | Count |', '|---|---|')
  w(`| Designs | ${counts.designs} (${counts.counterfactual} on the ladder, ${counts.theory} theory-based) |`)
  w(`| Questions | ${counts.questions} |`)
  w(`| — needing the data in hand | ${counts.needsData} |`)
  w(`| Checks | ${counts.checks} |`)
  w(`| — blockers | ${counts.blockers} |`)
  w(`| — conditions | ${counts.conditions} |`)
  w(`| — warnings | ${counts.warnings} |`)
  w(`| References | ${counts.references} |`, '')

  w('## The robustness ladder', '')
  w('Designs are ranked by the assumption that makes their comparison valid, not by how',
    'sophisticated the estimator is.', '')
  w('| Tier | Name | Identifying assumption | Maryland | Designs |', '|---|---|---|---|---|')
  for (const t of spec.tiers.tiers) {
    const designs = spec.designs.filter(d => d.tier === t.id).map(d => d.name).join(', ')
    w(`| ${t.id} | ${t.name} | ${clean(t.identifying_assumption)} | ${t.evidence_scales?.maryland ?? ''} | ${designs} |`)
  }
  w('')
  for (const t of spec.tiers.tiers) {
    if (t.evidence_scales?.maryland_note) {
      w(`**Tier ${t.id} note.** ${clean(t.evidence_scales.maryland_note)}`, '')
    }
  }

  w('### The theory-based strand', '')
  w(`${clean(spec.tiers.theory_based.name)} runs beside every rung and is never converted into one.`, '')
  for (const role of spec.tiers.theory_based.roles) {
    w(`- **${role.id}** — ${clean(role.when)}`)
  }
  w('')

  if (spec.tiers.contested_placements?.length) {
    w('### Placements where sources disagree', '')
    w('Shown with both views rather than resolved silently. Each default below has been',
      'explicitly signed off.', '')
    for (const c of spec.tiers.contested_placements) {
      w(`**${c.subject}** — placed at Tier ${c.default_tier}${c.signed_off ? ' (signed off)' : ''}`, '')
      for (const v of c.views) {
        w(`- *Tier ${v.tier}${v.qualifier ? `, ${v.qualifier}` : ''}:* ${clean(v.argument)}`)
      }
      w('', `Sources: ${(c.citations ?? []).join(', ')}`, '')
    }
  }

  w('## Readiness gates', '')
  w('Checked before any design is considered. A gate means impact evaluation cannot answer',
    'the question yet, whatever the data situation.', '')
  w('| Gate | Reads | Severity | Fires when | Message | Instead |', '|---|---|---|---|---|---|')
  for (const r of spec.stages.readiness) {
    w(`| ${r.id} | \`${r.question}\` | **${r.severity}** | ${describeExpression(r.fires_when, questionsById)} | ${clean(r.message)} | ${clean(r.redirect)} |`)
  }
  w('')

  w('## Stage inference', '')
  w('Ordered; the first matching rule wins.', '')
  w('| # | When | Stage | Reasoning |', '|---|---|---|---|')
  spec.stages.inference.forEach((rule, i) => {
    w(`| ${i + 1} | ${describeExpression(rule.when, questionsById)} | ${rule.stages.join(', ')} | ${clean(rule.note)} |`)
  })
  w('')

  w('## Rules, by design', '')
  w('Each design in tier order. `Fires when` is the condition rendered in plain English;',
    'the underlying expression is in `spec/rules.yaml`.', '')

  const ordered = [...spec.designs].sort((a, b) => {
    if (a.strand !== b.strand) return a.strand === 'counterfactual' ? -1 : 1
    if ((a.tier ?? 99) !== (b.tier ?? 99)) return (a.tier ?? 99) - (b.tier ?? 99)
    return a.id.localeCompare(b.id)
  })

  for (const design of ordered) {
    const rows = ruleRows.filter(r => r.design_id === design.id)
    const heading = design.strand === 'theory_based'
      ? `${design.name} — theory-based strand`
      : `${design.name} — Tier ${design.tier}`
    w(`### ${heading}`, '')
    w(`\`${design.id}\` · *${design.estimand}*`, '')
    if (design.estimator_options?.length) {
      w(`Estimators: ${design.estimator_options.join(', ')}`, '')
    }
    if (design.tier_qualifier) w(`**Tier qualifier.** ${clean(design.tier_qualifier)}`, '')
    if (design.notes) w(`${clean(design.notes)}`, '')

    if (!rows.length) { w('_No rules defined._', ''); continue }

    w('| Type | Fires when | Message | What would discharge it | Threshold | Sources |',
      '|---|---|---|---|---|---|')
    for (const r of rows) {
      w(`| ${r.type} | ${r.fires_when} | ${r.message} | ${r.unlock || '—'} | ${r.threshold || '—'} | ${r.citations} |`)
    }
    w('')
  }

  const stats = spec.statistics
  if (stats) {
    w('## The statistics module', '')
    w('Asks for the analytical approach first, then gives each approach its own question',
      'set. Sample size does a different job under each, so the Bayesian questions are not',
      'translations of the frequentist ones. The module produces questions to take to a',
      'statistician; it never returns a pass or fail on sample size.', '')

    const nq = stats.approaches.nhst.questions.length
    const bq = stats.approaches.bayesian.questions.length
    const nt = stats.approaches.nhst.tensions.length
    const bt = stats.approaches.bayesian.tensions.length
    w(`Frequentist: ${nq} questions, ${nt} tensions. Bayesian: ${bq} questions, ${bt} tensions.`,
      'Equal depth is asserted by test.', '')

    w('### Asked of everyone', '')
    for (const qid of stats.shared_questions) {
      const q = questionsById.get(qid)
      w(`- **${clean(q?.text ?? qid)}** \`${qid}\``)
    }
    w('')

    for (const [name, body] of Object.entries(stats.approaches)) {
      w(`### ${body.label}`, '')
      w(`*What the sample is for:* ${clean(body.sample_role)}`, '')
      w('| Question | Options |', '|---|---|')
      for (const qid of body.questions) {
        const q = questionsById.get(qid)
        w(`| **${clean(q?.text ?? qid)}**<br>\`${qid}\` | ${(q?.options ?? []).map(o => o.label).join(' · ')} |`)
      }
      w('')
      w('**Tensions raised**', '')
      w('| Raised when | Message | Take to a statistician | Sources |', '|---|---|---|---|')
      for (const t of body.tensions) {
        w(`| ${describeExpression(t.when, questionsById)} | ${clean(t.message)} | ${clean(t.prompt)} | ${(t.citations ?? []).join(' ')} |`)
      }
      w('')
    }

    if (stats.undecided_comparison?.length) {
      w('### Shown while the approach is undecided', '')
      w('| | Frequentist | Bayesian |', '|---|---|---|')
      for (const row of stats.undecided_comparison) {
        w(`| **${clean(row.topic)}** | ${clean(row.nhst)} | ${clean(row.bayesian)} |`)
      }
      w('')
    }

    w('### What plays the role of N', '')
    w('Total sample size is frequently the wrong quantity.', '')
    w('| Design | Quantity that matters | Note |', '|---|---|---|')
    for (const q of stats.design_quantities ?? []) {
      const design = designsById.get(q.design)
      w(`| ${design?.name ?? q.design} | ${clean(q.quantity)} | ${clean(q.note) || '—'} |`)
    }
    w('')

    if (stats.ready_reckoner) {
      w('### Ready-reckoner', '')
      w(`${clean(stats.ready_reckoner.note)}`, '')
      w(`\`engine_reads: ${stats.ready_reckoner.engine_reads}\` — the engine does not read it,`,
        'so a figure produced here cannot change any verdict. Enforced by test.', '')
    }
  }

  w('## Questions', '')
  w('| Question | Asked | Options | Read by |', '|---|---|---|---|')
  for (const q of spec.questions) {
    const used = ruleRows.filter(r => r.reads.split(' ').includes(q.id)).map(r => r.design_id)
    const unique = [...new Set(used)]
    const readBy = unique.length ? `${unique.length} design${unique.length === 1 ? '' : 's'}` : 'readiness / routing only'
    const asked = q.applies_when ? describeExpression(q.applies_when, questionsById) : 'always'
    w(`| **${clean(q.text)}**<br>\`${q.id}\` | ${asked} | ${q.options.map(o => o.label).join(' · ')} | ${readBy} |`)
  }
  w('')

  w('## References', '')
  w('Each carries a confidence note: how firmly the source supports the use made of it.', '')
  for (const e of bib.sort((a, b) => a.key.localeCompare(b.key))) {
    const link = e.doi ? `https://doi.org/${e.doi}` : e.url
    w(`**\`${e.key}\`** — ${e.author ? e.author + '. ' : ''}${e.title}${e.year ? ` (${e.year})` : ''}`)
    if (link) w(`  <${link}>`)
    if (e.note) w('', `  *${clean(e.note)}*`)
    w('')
  }

  return L.join('\n')
}

export function buildPack(specDir) {
  const spec = loadSpec(specDir)
  const questionsById = new Map(spec.questions.map(q => [q.id, q]))
  const bibPath = join(specDir ?? join(ROOT, 'spec'), 'references.bib')
  const bib = parseBib(readFileSync(bibPath, 'utf8'))
  const ruleRows = flattenRules(spec, questionsById)

  return {
    ...buildCsvs(spec, questionsById, ruleRows),
    'REVIEWER_PACK.md': buildMarkdown(spec, questionsById, ruleRows, bib),
  }
}

// CLI: `--check` compares against what is committed instead of writing.
if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const files = buildPack()
  const check = process.argv.includes('--check')

  if (check) {
    const stale = []
    for (const [name, content] of Object.entries(files)) {
      const path = join(OUT, name)
      if (!existsSync(path) || readFileSync(path, 'utf8') !== content) stale.push(name)
    }
    if (stale.length) {
      console.error(`reviewer pack is out of date: ${stale.join(', ')}`)
      console.error('run `npm run pack` and commit the result')
      process.exit(1)
    }
    console.log(`reviewer pack: up to date (${Object.keys(files).length} files)`)
  } else {
    mkdirSync(OUT, { recursive: true })
    for (const [name, content] of Object.entries(files)) writeFileSync(join(OUT, name), content)
    console.log(`reviewer pack: wrote ${Object.keys(files).length} files to reviewer-pack/`)
  }
}
