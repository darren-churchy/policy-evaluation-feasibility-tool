// The typeface, self-hosted.
//
// It was the last thing fetched at runtime. These guard the two ways that could quietly
// come back: a CDN link reappearing in the page, and GDS Transport — which GOV.UK
// licenses for use on gov.uk only — being requested again.

import { describe, it, expect } from 'vitest'
import { readFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'

const ROOT = new URL('..', import.meta.url).pathname
const read = p => readFileSync(join(ROOT, p), 'utf8')

describe('nothing is fetched from a third party', () => {
  it('the page links to no external stylesheet or font', () => {
    const html = read('index.html')
    expect(html, 'a CDN link has come back').not.toMatch(/https?:\/\/(?!\s)/)
  })

  it('the compiled vendor stylesheet fetches nothing either', () => {
    const css = read('src/styles/vendor/govuk-moj.css')
    expect(css).not.toMatch(/url\(\s*["']?https?:/)
  })

  it('the font is served from the bundle, not a URL', () => {
    const css = read('src/styles/fonts.css')
    expect(css).toMatch(/@fontsource-variable\/source-sans-3/)
    expect(css).not.toMatch(/https?:/)
  })
})

describe('GDS Transport is not requested', () => {
  // GOV.UK licenses it for gov.uk only. The files are not in the npm package and we may
  // not host them, but GOV.UK Frontend still emits an @font-face unless told not to — so
  // the browser was asking for /assets/fonts/*.woff2 and 404ing on every page load.
  it('the vendor stylesheet declares no @font-face for it', () => {
    const css = read('src/styles/vendor/govuk-moj.css')
    expect(css, 'a font file reference has come back').not.toMatch(/assets\/fonts/)
  })

  it('the SCSS switches the declarations off, so a recompile keeps them off', () => {
    expect(read('scripts/vendor-css.scss'))
      .toMatch(/\$govuk-include-default-font-face:\s*false/)
  })
})

describe('the licence travels with the font', () => {
  // SIL OFL 1.1 requires the notice to be distributed with the font software.
  it('ships the Open Font License where the built app serves it', () => {
    expect(existsSync(join(ROOT, 'public', 'fonts', 'OFL.txt'))).toBe(true)
    expect(read('public/fonts/OFL.txt')).toMatch(/SIL Open Font License/)
  })

  it('records it among the dependencies', () => {
    expect(read('README.md')).toMatch(/Source Sans 3.*SIL Open Font License/s)
  })
})

describe('only the subsets the interface needs', () => {
  // The package ships eleven. Precaching all of them would be ~200KB of Cyrillic, Greek
  // and Vietnamese for text this tool does not produce.
  it('declares latin and latin-ext, and nothing else', () => {
    const css = read('src/styles/fonts.css')
    const faces = css.match(/source-sans-3-[a-z-]+-wght-normal\.woff2/g) ?? []
    expect(faces.sort()).toEqual([
      'source-sans-3-latin-ext-wght-normal.woff2',
      'source-sans-3-latin-wght-normal.woff2',
    ])
  })

  // One variable file covers every weight the interface uses, which is why this costs
  // less than the three static files it replaced.
  it('uses the variable axis rather than one file per weight', () => {
    expect(read('src/styles/fonts.css')).toMatch(/font-weight:\s*200 900/)
  })

  it('names the variable family first in the stack', () => {
    expect(read('src/index.css')).toMatch(/"Source Sans 3 Variable",\s*"Source Sans 3"/)
  })
})
