// Validates the specification files against their JSON Schemas and checks cross-file
// integrity. Run by `npm run spec:check` and by CI on every push.
//
// Two classes of failure are reported:
//   1. Schema breaches — reported with the file and line of the offending node, so a
//      reviewer editing YAML in an editor can jump straight to it.
//   2. Dangling citations — a tier, rule or question citing a key that references.bib
//      does not define. Every rule must be traceable to a source, so this is an error,
//      not a warning.

import { readFileSync, existsSync, readdirSync } from 'node:fs'
import { join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'
import Ajv from 'ajv/dist/2020.js'
import addFormats from 'ajv-formats'
import { parseDocument } from 'yaml'
import { parseCsvRecords } from './lib/csv.mjs'

const ROOT = fileURLToPath(new URL('..', import.meta.url))
const SPEC = join(ROOT, 'spec')
const SCHEMA = join(SPEC, 'schema')

// Spec files that exist at this phase. Phase 2 adds the rest; a file listed here but not
// yet present is skipped rather than failing, so the check is useful before the spec is
// complete but still enforces every file that does exist.
const TARGETS = [
  { file: 'tiers.yaml',      schema: 'tiers.schema.json' },
  { file: 'questions.yaml',  schema: 'questions.schema.json' },
  { file: 'rules.yaml',      schema: 'rules.schema.json' },
  { file: 'stages.yaml',     schema: 'stages.schema.json' },
  { file: 'statistics.yaml', schema: 'statistics.schema.json' },
  { file: 'guides.yaml',     schema: 'guides.schema.json' },
]

// CSV targets are validated as the array of records parsed from them.
const CSV_TARGETS = [
  {
    file: 'designs.csv',
    schema: 'designs.schema.json',
    pipeSeparated: ['estimator_options'],
    // Design ids are referenced by rules.yaml and questions.yaml, so a duplicate would
    // silently shadow a rule set rather than raise anything.
    uniqueBy: 'id',
  },
]

/** Resolve a JSON Pointer-ish instance path to a 1-indexed line in the source YAML. */
function lineFor(doc, source, instancePath) {
  const path = Array.isArray(instancePath)
    ? instancePath
    : String(instancePath || '')
        .split('/')
        .filter(Boolean)
        .map(seg => (/^\d+$/.test(seg) ? Number(seg) : seg.replace(/~1/g, '/').replace(/~0/g, '~')))
  if (!path.length) return 1

  // Walk as deep as the path resolves; a failed lookup falls back to the nearest ancestor.
  for (let depth = path.length; depth >= 0; depth--) {
    const node = depth === 0 ? doc.contents : doc.getIn(path.slice(0, depth), true)
    const offset = node?.range?.[0]
    if (typeof offset === 'number') {
      return source.slice(0, offset).split('\n').length
    }
  }
  return 1
}

/** Collect every citation key in a parsed spec object, with the path where it appears. */
function collectCitations(node, path = [], found = []) {
  if (Array.isArray(node)) {
    node.forEach((n, i) => collectCitations(n, [...path, i], found))
  } else if (node && typeof node === 'object') {
    for (const [key, value] of Object.entries(node)) {
      if ((key === 'citations' || key === 'references') && Array.isArray(value)) {
        value.forEach((v, i) => {
          if (typeof v === 'string') found.push({ key: v, path: [...path, key, i] })
        })
      } else {
        collectCitations(value, [...path, key], found)
      }
    }
  }
  return found
}

/** Keys defined in references.bib, e.g. `@article{lee_etal_2022,` -> lee_etal_2022 */
function bibKeys(bibSource) {
  return new Set([...bibSource.matchAll(/^\s*@\w+\s*\{\s*([^,\s]+)\s*,/gm)].map(m => m[1]))
}

/**
 * Turn ajv's conditional-schema errors into something a reviewer editing a spreadsheet
 * can act on. ajv reports an `if/then` failure as a pair: a specific error plus a generic
 * "must match then schema" companion. The companion is dropped, and the `not` case — which
 * ajv renders as the unhelpful "must NOT be valid" — is named explicitly.
 */
function humaniseCsvError(error, row) {
  if (error.keyword === 'if') return null
  if (error.keyword === 'not' && row?.strand === 'theory_based') {
    return `row "${row.id}": a theory-based design must not carry a tier — the theory-based strand runs beside the ladder, never on it`
  }
  const where = error.instancePath.split('/').slice(2).join('/')
  const prefix = row?.id ? `row "${row.id}"` : error.instancePath || '/'
  return where ? `${prefix}: ${where} ${error.message}` : `${prefix}: ${error.message}`
}

/** Every `var` reference inside a JSON Logic expression. */
function collectVars(node, found = new Set()) {
  if (Array.isArray(node)) { node.forEach(n => collectVars(n, found)); return found }
  if (!node || typeof node !== 'object') return found
  for (const [key, value] of Object.entries(node)) {
    if (key === 'var') {
      const name = Array.isArray(value) ? value[0] : value
      if (typeof name === 'string') found.add(name)
    } else {
      collectVars(value, found)
    }
  }
  return found
}

/** Literal values compared against a given answer id, for option-value checking. */
function collectComparisons(node, out = []) {
  if (Array.isArray(node)) { node.forEach(n => collectComparisons(n, out)); return out }
  if (!node || typeof node !== 'object') return out
  for (const [op, args] of Object.entries(node)) {
    if ((op === '==' || op === '!=' || op === '===' || op === '!==') && Array.isArray(args) && args.length === 2) {
      const [a, b] = args
      if (a && typeof a === 'object' && 'var' in a && (typeof b === 'string' || typeof b === 'number')) {
        out.push({ question: Array.isArray(a.var) ? a.var[0] : a.var, value: String(b) })
      }
    } else if (op === 'in' && Array.isArray(args) && args.length === 2 && Array.isArray(args[1])) {
      const [a, list] = args
      if (a && typeof a === 'object' && 'var' in a) {
        for (const v of list) {
          if (typeof v === 'string' || typeof v === 'number') {
            out.push({ question: Array.isArray(a.var) ? a.var[0] : a.var, value: String(v) })
          }
        }
      }
    }
    collectComparisons(args, out)
  }
  return out
}

/**
 * Cross-file integrity. The plan requires the build to fail where a rule or question
 * refers to something that does not exist, so these are errors rather than warnings:
 * a typo in a question id would otherwise make a blocker silently never fire, which
 * reads as a design being Feasible when it has simply not been checked.
 */
function checkReferences(parsed, errors) {
  const designs = parsed['designs.csv']?.data
  const questions = parsed['questions.yaml']?.data?.questions
  const rules = parsed['rules.yaml']?.data?.designs
  if (!rules) return

  const designIds = new Set((designs ?? []).map(d => d.id))
  const optionsByQuestion = new Map(
    (questions ?? []).map(q => [q.id, new Set((q.options ?? []).map(o => String(o.value)))]),
  )
  const doc = parsed['rules.yaml'].doc
  const source = parsed['rules.yaml'].source
  const at = path => lineFor(doc, source, ['designs', ...path])

  for (const [designId, groups] of Object.entries(rules)) {
    if (designs && !designIds.has(designId)) {
      errors.push({ file: 'rules.yaml', line: at([designId]), message: `rules are defined for "${designId}", which is not a design in designs.csv` })
    }
    for (const [group, checks] of Object.entries(groups ?? {})) {
      ;(checks ?? []).forEach((check, i) => {
        const where = [designId, group, i]
        for (const v of collectVars(check.test)) {
          if (questions && !optionsByQuestion.has(v)) {
            errors.push({ file: 'rules.yaml', line: at(where), message: `${designId}.${group}[${check.id ?? i}] tests "${v}", which is not a question in questions.yaml` })
          }
        }
        for (const { question, value } of collectComparisons(check.test)) {
          const opts = optionsByQuestion.get(question)
          if (opts && !opts.has(value)) {
            errors.push({ file: 'rules.yaml', line: at(where), message: `${designId}.${group}[${check.id ?? i}] compares ${question} with "${value}", which is not one of its options (${[...opts].join(', ')})` })
          }
        }
      })
    }
  }

  // stages.yaml: readiness gates, stage inference and routing all read answers, and a
  // bad reference here would make a hard gate silently never fire.
  const stages = parsed['stages.yaml']?.data
  if (stages && questions) {
    const sdoc = parsed['stages.yaml'].doc
    const ssrc = parsed['stages.yaml'].source
    const stageIds = new Set((stages.stages ?? []).map(s => s.id))

    ;(stages.readiness ?? []).forEach((r, i) => {
      const line = lineFor(sdoc, ssrc, ['readiness', i])
      if (!optionsByQuestion.has(r.question)) {
        errors.push({ file: 'stages.yaml', line, message: `readiness "${r.id}" reads question "${r.question}", which is not in questions.yaml` })
      }
      for (const v of collectVars(r.fires_when)) {
        if (!optionsByQuestion.has(v)) {
          errors.push({ file: 'stages.yaml', line, message: `readiness "${r.id}" fires_when tests "${v}", which is not a question` })
        }
      }
      for (const { question, value } of collectComparisons(r.fires_when)) {
        const opts = optionsByQuestion.get(question)
        if (opts && !opts.has(value)) {
          errors.push({ file: 'stages.yaml', line, message: `readiness "${r.id}" compares ${question} with "${value}", which is not one of its options (${[...opts].join(', ')})` })
        }
      }
    })

    ;(stages.inference ?? []).forEach((rule, i) => {
      const line = lineFor(sdoc, ssrc, ['inference', i])
      for (const v of collectVars(rule.when)) {
        if (!optionsByQuestion.has(v)) {
          errors.push({ file: 'stages.yaml', line, message: `inference[${i}] tests "${v}", which is not a question` })
        }
      }
      for (const { question, value } of collectComparisons(rule.when)) {
        const opts = optionsByQuestion.get(question)
        if (opts && !opts.has(value)) {
          errors.push({ file: 'stages.yaml', line, message: `inference[${i}] compares ${question} with "${value}", which is not one of its options (${[...opts].join(', ')})` })
        }
      }
      for (const st of rule.stages ?? []) {
        if (!stageIds.has(st)) {
          errors.push({ file: 'stages.yaml', line, message: `inference[${i}] concludes stage "${st}", which is not defined in stages` })
        }
      }
    })

    // Guidance is advisory, but a typo'd option value makes a note silently never show —
    // the same class of failure as a blocker that never fires.
    ;(stages.guidance ?? []).forEach((entry, i) => {
      const line = lineFor(sdoc, ssrc, ['guidance', i])
      const opts = optionsByQuestion.get(entry.question)
      if (!opts) {
        errors.push({ file: 'stages.yaml', line, message: `guidance reads "${entry.question}", which is not a question` })
      } else if (!opts.has(String(entry.when))) {
        errors.push({ file: 'stages.yaml', line, message: `guidance on ${entry.question} fires when "${entry.when}", which is not one of its options (${[...opts].join(', ')})` })
      }
    })

    ;(stages.routing ?? []).forEach((route, i) => {
      const line = lineFor(sdoc, ssrc, ['routing', i])
      for (const v of collectVars(route.when)) {
        if (!optionsByQuestion.has(v)) {
          errors.push({ file: 'stages.yaml', line, message: `routing ${route.from} -> ${route.to} tests "${v}", which is not a question` })
        }
      }
      for (const { question, value } of collectComparisons(route.when)) {
        const opts = optionsByQuestion.get(question)
        if (opts && !opts.has(value)) {
          errors.push({ file: 'stages.yaml', line, message: `routing ${route.from} -> ${route.to} compares ${question} with "${value}", which is not one of its options (${[...opts].join(', ')})` })
        }
      }
    })
  }

  // statistics.yaml: a question listed in an approach set but absent from the bank would
  // simply never be asked, and a tension reading a question that does not exist would
  // never fire — both silent.
  const statistics = parsed['statistics.yaml']?.data
  if (statistics && questions) {
    const sdoc = parsed['statistics.yaml'].doc
    const ssrc = parsed['statistics.yaml'].source
    const designIds = new Set((designs ?? []).map(d => d.id))

    const checkQuestionList = (list, path, label) => {
      ;(list ?? []).forEach((qid, i) => {
        if (!optionsByQuestion.has(qid)) {
          errors.push({ file: 'statistics.yaml', line: lineFor(sdoc, ssrc, [...path, i]), message: `${label} lists "${qid}", which is not a question in questions.yaml` })
        }
      })
    }

    checkQuestionList(statistics.shared_questions, ['shared_questions'], 'shared_questions')

    for (const [name, approach] of Object.entries(statistics.approaches ?? {})) {
      checkQuestionList(approach.questions, ['approaches', name, 'questions'], `approaches.${name}.questions`)

      ;(approach.tensions ?? []).forEach((tension, i) => {
        const line = lineFor(sdoc, ssrc, ['approaches', name, 'tensions', i])
        for (const v of collectVars(tension.when)) {
          if (!optionsByQuestion.has(v)) {
            errors.push({ file: 'statistics.yaml', line, message: `${name} tension "${tension.id}" tests "${v}", which is not a question` })
          }
        }
        for (const { question, value } of collectComparisons(tension.when)) {
          const opts = optionsByQuestion.get(question)
          if (opts && !opts.has(value)) {
            errors.push({ file: 'statistics.yaml', line, message: `${name} tension "${tension.id}" compares ${question} with "${value}", which is not one of its options (${[...opts].join(', ')})` })
          }
        }
      })
    }

    ;(statistics.design_quantities ?? []).forEach((entry, i) => {
      if (designs && !designIds.has(entry.design)) {
        errors.push({ file: 'statistics.yaml', line: lineFor(sdoc, ssrc, ['design_quantities', i]), message: `design_quantities names "${entry.design}", which is not a design in designs.csv` })
      }
    })

    ;(statistics.ready_reckoner?.modes ?? []).forEach((mode, i) => {
      checkQuestionList(mode.inputs, ['ready_reckoner', 'modes', i, 'inputs'], `ready_reckoner.modes[${i}].inputs`)
    })
  }

  // questions.yaml applies_when must reference real questions too.
  if (questions && parsed['questions.yaml'].doc) {
    const qdoc = parsed['questions.yaml'].doc
    const qsrc = parsed['questions.yaml'].source
    questions.forEach((q, i) => {
      if (q.applies_when) {
        for (const v of collectVars(q.applies_when)) {
          if (!optionsByQuestion.has(v)) {
            errors.push({ file: 'questions.yaml', line: lineFor(qdoc, qsrc, ['questions', i]), message: `${q.id}.applies_when tests "${v}", which is not a question` })
          }
        }
      }

      // The tool assesses PROSPECTIVE feasibility. A question that cannot honestly be
      // answered until the data exist must let the user say so, or it forces a guess —
      // and a guess then drives a condition as if it were a finding.
      if (q.establishable === 'needs_data' && !(q.options ?? []).some(o => o.not_established)) {
        errors.push({ file: 'questions.yaml', line: lineFor(qdoc, qsrc, ['questions', i]), message: `${q.id} is marked establishable: needs_data but offers no option marked not_established, so a user without the data must guess` })
      }
    })
  }

  // Guides produce notes, never answers. A guide field sharing an id with a question is
  // the one way a note could later be mistaken for an answer and reach a verdict, so it is
  // refused outright rather than left to the code that keeps the two apart.
  const guides = parsed['guides.yaml']?.data?.guides
  if (guides && questions && parsed['guides.yaml'].doc) {
    const gdoc = parsed['guides.yaml'].doc
    const gsrc = parsed['guides.yaml'].source
    const questionIds = new Set(questions.map(q => q.id))
    const seen = new Map()

    guides.forEach((guide, gi) => {
      ;(guide.fields ?? []).forEach((field, fi) => {
        const line = lineFor(gdoc, gsrc, ['guides', gi, 'fields', fi])
        if (questionIds.has(field.id)) {
          errors.push({ file: 'guides.yaml', line, message: `guide field "${field.id}" shares an id with a question. Guides produce notes, never answers, and an id collision is the one way a note could reach a verdict.` })
        }
        if (seen.has(field.id)) {
          errors.push({ file: 'guides.yaml', line, message: `guide field "${field.id}" is already defined in guide "${seen.get(field.id)}" — notes are held in one flat object, so the later one would overwrite the earlier` })
        }
        seen.set(field.id, guide.id)
      })

      if (guide.table) {
        const line = lineFor(gdoc, gsrc, ['guides', gi, 'table'])
        if (questionIds.has(guide.table.id)) {
          errors.push({ file: 'guides.yaml', line, message: `guide table "${guide.table.id}" shares an id with a question` })
        }
        if (seen.has(guide.table.id)) {
          errors.push({ file: 'guides.yaml', line, message: `guide table "${guide.table.id}" is already defined in guide "${seen.get(guide.table.id)}"` })
        }
        seen.set(guide.table.id, guide.id)
      }
    })
  }

  // The central prospective-feasibility guarantee: not having checked something is never
  // the same as having found it wanting. A blocker says the design cannot work; firing one
  // on an unchecked value would rule out a design on the strength of an absent answer.
  if (questions && rules && parsed['rules.yaml'].doc) {
    const rdoc = parsed['rules.yaml'].doc
    const rsrc = parsed['rules.yaml'].source
    const unestablished = new Map()
    for (const q of questions) {
      const values = (q.options ?? []).filter(o => o.not_established).map(o => o.value)
      if (values.length) unestablished.set(q.id, new Set(values))
    }

    for (const [design, spec] of Object.entries(rules)) {
      ;(spec.blockers ?? []).forEach((blocker, i) => {
        for (const { question, value } of collectComparisons(blocker.test)) {
          if (unestablished.get(question)?.has(value)) {
            errors.push({
              file: 'rules.yaml',
              line: lineFor(rdoc, rsrc, ['designs', design, 'blockers', i]),
              message: `${design} blocker "${blocker.id}" fires on ${question} = "${value}", which means the user has not established this yet. An unchecked assumption is a condition to discharge, not a blocker.`,
            })
          }
        }
      })
    }
  }
}

export function validateSpec({ specDir = SPEC, schemaDir = SCHEMA } = {}) {
  const errors = []
  const checked = []

  const ajv = new Ajv({ allErrors: true, strict: false })
  addFormats(ajv)

  const parsed = {}

  for (const { file, schema } of TARGETS) {
    const specPath = join(specDir, file)
    if (!existsSync(specPath)) continue

    const schemaPath = join(schemaDir, schema)
    if (!existsSync(schemaPath)) {
      errors.push({ file, line: 1, message: `schema not found: ${schema}` })
      continue
    }

    const source = readFileSync(specPath, 'utf8')
    const doc = parseDocument(source)

    if (doc.errors.length) {
      for (const e of doc.errors) {
        errors.push({
          file,
          line: source.slice(0, e.pos?.[0] ?? 0).split('\n').length,
          message: `YAML parse error: ${e.message}`,
        })
      }
      checked.push(file)
      continue
    }

    const data = doc.toJS()
    parsed[file] = { data, doc, source }
    checked.push(file)

    const validate = ajv.compile(JSON.parse(readFileSync(schemaPath, 'utf8')))
    if (!validate(data)) {
      for (const e of validate.errors) {
        errors.push({
          file,
          line: lineFor(doc, source, e.instancePath),
          message: `${e.instancePath || '/'} ${e.message}`,
        })
      }
    }
  }

  for (const { file, schema, pipeSeparated, uniqueBy } of CSV_TARGETS) {
    const specPath = join(specDir, file)
    if (!existsSync(specPath)) continue

    const source = readFileSync(specPath, 'utf8')
    const { records, lines } = parseCsvRecords(source, { pipeSeparated })
    parsed[file] = { data: records, csvLines: lines }
    checked.push(file)

    const validate = ajv.compile(JSON.parse(readFileSync(join(schemaDir, schema), 'utf8')))
    if (!validate(records)) {
      for (const e of validate.errors) {
        // instancePath starts /<rowIndex>/... — map the row back to its source line.
        const rowIndex = Number(e.instancePath.split('/')[1])
        const row = Number.isInteger(rowIndex) ? records[rowIndex] : undefined
        const message = humaniseCsvError(e, row)
        if (message === null) continue   // redundant companion error
        errors.push({
          file,
          line: Number.isInteger(rowIndex) ? (lines[rowIndex] ?? 1) : 1,
          message,
        })
      }
    }

    if (uniqueBy) {
      const seen = new Map()
      records.forEach((r, i) => {
        const key = r[uniqueBy]
        if (key === undefined) return
        if (seen.has(key)) {
          errors.push({ file, line: lines[i], message: `duplicate ${uniqueBy} "${key}" (first seen at line ${lines[seen.get(key)]})` })
        } else {
          seen.set(key, i)
        }
      })
    }
  }

  // Context packs share one schema.
  const packDir = join(specDir, 'packs')
  if (existsSync(packDir) && existsSync(join(schemaDir, 'pack.schema.json'))) {
    const validate = ajv.compile(JSON.parse(readFileSync(join(schemaDir, 'pack.schema.json'), 'utf8')))
    for (const name of readdirSync(packDir).filter(f => f.endsWith('.yaml'))) {
      const source = readFileSync(join(packDir, name), 'utf8')
      const doc = parseDocument(source)
      const data = doc.toJS()
      parsed[`packs/${name}`] = { data, doc, source }
      checked.push(`packs/${name}`)
      if (!validate(data)) {
        for (const e of validate.errors) {
          errors.push({
            file: `packs/${name}`,
            line: lineFor(doc, source, e.instancePath),
            message: `${e.instancePath || '/'} ${e.message}`,
          })
        }
      }
    }
  }

  checkReferences(parsed, errors)

  // Cross-file: every cited key must be defined in references.bib.
  const bibPath = join(specDir, 'references.bib')
  if (existsSync(bibPath)) {
    const defined = bibKeys(readFileSync(bibPath, 'utf8'))
    for (const [file, entry] of Object.entries(parsed)) {
      const { data, doc, source, csvLines } = entry
      for (const { key, path } of collectCitations(data)) {
        if (!defined.has(key)) {
          const line = doc
            ? lineFor(doc, source, path)
            : (csvLines?.[Number(path[0])] ?? 1)
          errors.push({ file, line, message: `citation "${key}" is not defined in references.bib` })
        }
      }
    }
  } else if (checked.length) {
    errors.push({ file: 'references.bib', line: 1, message: 'references.bib not found' })
  }

  return { errors, checked }
}

// CLI
if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const { errors, checked } = validateSpec()
  // Errors are reported first and unconditionally: a file that fails to parse yields
  // errors, and reporting "nothing to validate" ahead of them would exit 0 on a broken spec.
  if (errors.length) {
    console.error(`spec: ${errors.length} error(s)\n`)
    for (const e of errors) {
      console.error(`  ${relative(ROOT, join(SPEC, e.file))}:${e.line}  ${e.message}`)
    }
    process.exit(1)
  }
  if (!checked.length) {
    console.log('spec: no specification files present yet — nothing to validate')
    process.exit(0)
  }
  console.log(`spec: ok — ${checked.length} file(s) validated (${checked.join(', ')})`)
}
