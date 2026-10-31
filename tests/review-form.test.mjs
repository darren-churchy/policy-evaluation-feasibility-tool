// The review form.
//
// Generated from spec/ so it cannot describe rules that no longer exist. What these guard
// is the property that makes the feedback trustworthy: nothing a reviewer did not answer
// may appear in the output as though they had.

import { describe, it, expect, beforeAll } from 'vitest'
import { loadSpec } from '../scripts/lib/loadSpec.mjs'
import { buildReviewForm } from '../scripts/build-review-form.mjs'

let html, spec
beforeAll(() => {
  spec = loadSpec()
  html = buildReviewForm()
})

describe('silence is never recorded as agreement', () => {
  // The same principle the engine applies to an unanswered question. A form that
  // pre-selects "agree" collects agreement nobody gave.
  it('pre-selects no verdict anywhere', () => {
    // `\schecked` rather than `checked`: several rule ids end in "unchecked", and a
    // looser pattern matches inside them and reports a problem that is not there.
    expect(html).not.toMatch(/<input[^>]*type="radio"[^>]*\schecked[\s>=]/)
  })

  it('builds the output from answered items only', () => {
    expect(html).toMatch(/function answered\(\)[\s\S]*?\.filter\(Boolean\)/)
    expect(html).toMatch(/if \(!choice && !comment\) return null/)
  })

  it('says so to the reviewer', () => {
    expect(html).toMatch(/nothing you leave blank is\s*recorded as agreement/)
  })
})

describe('it covers what a reviewer is being asked to judge', () => {
  it('asks about every contested placement', () => {
    for (const c of spec.tiers.contested_placements ?? []) {
      expect(html, `${c.subject} is contested and must be asked about`).toContain(c.subject)
    }
  })

  it('shows every rule as the sentence it renders to', () => {
    const checks = Object.values(spec.rules.designs)
      .flatMap(r => [...(r.blockers ?? []), ...(r.conditions ?? []), ...(r.warnings ?? [])])
    expect(checks.length).toBeGreaterThan(150)
    // A sample is enough: if the generator drops a group it drops all of them.
    for (const check of [checks[0], checks[Math.floor(checks.length / 2)], checks.at(-1)]) {
      const words = check.message.replace(/\s+/g, ' ').trim().slice(0, 40)
      expect(html).toContain(words.replace(/&/g, '&amp;').replace(/'/g, '&#39;'))
    }
  })

  it('lists every design and every question', () => {
    for (const d of spec.designs) expect(html).toContain(d.name)
    expect(html).toContain(`${spec.questions.length} questions`)
  })

  it('carries the spec version, so feedback can be tied to what was reviewed', () => {
    expect(html).toContain(spec.tiers.spec_version)
  })
})

describe('it works from an email attachment', () => {
  it('fetches nothing', () => {
    expect(html).not.toMatch(/<(?:link|script)[^>]+src=|@import|https?:\/\//)
  })

  // Clipboard access is refused on some file:// origins, which would otherwise lose the
  // whole review at the last step.
  it('falls back to a download when the clipboard is blocked', () => {
    expect(html).toMatch(/catch \{[\s\S]*?download\(text, 'methods-review\.md'/)
  })

  it('can be put down and picked up again', () => {
    expect(html).toMatch(/function saveProgress/)
    expect(html).toMatch(/function loadProgress/)
    // A review started against older rules must not silently look current.
    expect(html).toMatch(/state\.specVersion !== SPEC_VERSION/)
  })
})
