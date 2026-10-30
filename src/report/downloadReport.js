// Hands the built report to the browser as a download.
//
// Separated from buildReport.js so the report itself stays pure and testable in Node:
// everything touching Blob, URL and the DOM lives here.

import { buildReport } from './buildReport.js'

export function downloadReport({ result, answers, spec, appVersion }) {
  const now = new Date()
  const html = buildReport({
    result,
    answers,
    spec,
    date: now.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }),
    appVersion,
  })

  const blob = new Blob([html], { type: 'text/html;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `evaluation-design-feasibility-${now.toISOString().slice(0, 10)}.html`
  a.click()
  URL.revokeObjectURL(url)
}
