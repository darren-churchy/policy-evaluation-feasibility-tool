// Loads the specification from spec/ for Node consumers — tests, the reviewer-pack
// generator, and the build step that will bundle it for the browser.
//
// Kept out of src/engine so the engine itself stays free of I/O and remains usable in the
// browser with a spec that was bundled at build time.

import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { parse } from 'yaml'
import { parseCsvRecords } from './csv.mjs'

const DEFAULT_SPEC_DIR = join(new URL('../..', import.meta.url).pathname, 'spec')

export function loadSpec(specDir = DEFAULT_SPEC_DIR) {
  const yaml = name => parse(readFileSync(join(specDir, name), 'utf8'))

  return {
    tiers: yaml('tiers.yaml'),
    questions: yaml('questions.yaml').questions,
    rules: yaml('rules.yaml'),
    stages: yaml('stages.yaml'),
    designs: parseCsvRecords(readFileSync(join(specDir, 'designs.csv'), 'utf8'), {
      pipeSeparated: ['estimator_options'],
    }).records,
  }
}
