// Compiles spec/ into a JSON module the browser can import.
//
// The engine is pure and takes a parsed spec, but the browser cannot read YAML or CSV at
// runtime. This bakes the specification into the bundle at build time, so there is no
// fetch, no parse cost, and the app works offline.
//
// The output is committed and drift-checked, exactly like the reviewer pack: `npm run
// spec:build --check` fails if it has fallen behind spec/. Without that, a rule change
// would validate, generate a correct reviewer pack, and still ship the old behaviour.

import { writeFileSync, readFileSync, existsSync, mkdirSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { loadSpec } from './lib/loadSpec.mjs'

const ROOT = fileURLToPath(new URL('..', import.meta.url))
const OUT = join(ROOT, 'src', 'spec', 'spec.generated.json')

export function buildSpecBundle(specDir) {
  const spec = loadSpec(specDir)
  // Stable key order so the output is reproducible and diffs are readable.
  return JSON.stringify(
    {
      tiers: spec.tiers,
      designs: spec.designs,
      questions: spec.questions,
      rules: spec.rules,
      stages: spec.stages,
      statistics: spec.statistics,
      guides: spec.guides,
      migration: spec.migration,
    },
    null,
    2,
  ) + '\n'
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const content = buildSpecBundle()
  const check = process.argv.includes('--check')

  if (check) {
    if (!existsSync(OUT) || readFileSync(OUT, 'utf8') !== content) {
      console.error('spec bundle is out of date — run `npm run spec:build` and commit the result')
      process.exit(1)
    }
    console.log('spec bundle: up to date')
  } else {
    mkdirSync(dirname(OUT), { recursive: true })
    writeFileSync(OUT, content)
    const kb = (Buffer.byteLength(content) / 1024).toFixed(0)
    console.log(`spec bundle: wrote src/spec/spec.generated.json (${kb} KB)`)
  }
}
