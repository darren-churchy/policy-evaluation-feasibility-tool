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

  // Cross-file: every cited key must be defined in references.bib.
  const bibPath = join(specDir, 'references.bib')
  if (existsSync(bibPath)) {
    const defined = bibKeys(readFileSync(bibPath, 'utf8'))
    for (const [file, { data, doc, source }] of Object.entries(parsed)) {
      for (const { key, path } of collectCitations(data)) {
        if (!defined.has(key)) {
          errors.push({
            file,
            line: lineFor(doc, source, path),
            message: `citation "${key}" is not defined in references.bib`,
          })
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
