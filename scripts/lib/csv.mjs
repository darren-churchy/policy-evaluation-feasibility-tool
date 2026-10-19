// Minimal RFC 4180 CSV reader.
//
// spec/designs.csv is edited in a spreadsheet, so it will contain quoted fields with
// embedded commas and escaped quotes. Getting that wrong shifts every column after the
// offending field, which is the kind of error that reads as a schema failure somewhere
// unrelated — hence a real parser rather than source.split(',').

/**
 * Parse CSV source into rows of raw cells, each tagged with the 1-indexed line where
 * the row begins (so validation errors can point at it).
 */
export function parseCsv(source) {
  const rows = []
  let cells = []
  let field = ''
  let inQuotes = false
  let line = 1
  let rowStartLine = 1
  let sawContent = false

  const endField = () => { cells.push(field); field = '' }
  const endRow = () => {
    endField()
    // Skip rows that are entirely empty (trailing newline at end of file).
    if (!(cells.length === 1 && cells[0] === '')) rows.push({ cells, line: rowStartLine })
    cells = []
    sawContent = false
  }

  for (let i = 0; i < source.length; i++) {
    const ch = source[i]

    if (inQuotes) {
      if (ch === '"') {
        if (source[i + 1] === '"') { field += '"'; i++ }  // escaped quote
        else inQuotes = false
      } else {
        if (ch === '\n') line++
        field += ch
      }
      continue
    }

    if (ch === '"') { inQuotes = true; sawContent = true; continue }
    if (ch === ',') { endField(); sawContent = true; continue }
    if (ch === '\r') continue
    if (ch === '\n') { endRow(); line++; rowStartLine = line; continue }

    field += ch
    sawContent = true
  }

  if (field !== '' || cells.length || sawContent) endRow()
  return rows
}

/**
 * Parse CSV into objects keyed by the header row, applying the coercions the spec
 * schemas expect:
 *   - an empty cell omits the key entirely (so `tier` is absent, not '', on
 *     theory-based rows — the schema forbids a tier there rather than allowing a blank)
 *   - `true` / `false` become booleans
 *   - columns named in `pipeSeparated` split on `|` into arrays
 *   - anything else that is all digits becomes a number
 *
 * Returns { records, lines } where lines[i] is the source line of records[i].
 */
export function parseCsvRecords(source, { pipeSeparated = [] } = {}) {
  const rows = parseCsv(source)
  if (!rows.length) return { records: [], lines: [], header: [] }

  const header = rows[0].cells.map(h => h.trim())
  const records = []
  const lines = []

  for (const row of rows.slice(1)) {
    const record = {}
    header.forEach((key, i) => {
      const raw = (row.cells[i] ?? '').trim()
      if (raw === '') return                       // absent, not empty
      if (pipeSeparated.includes(key)) {
        record[key] = raw.split('|').map(s => s.trim()).filter(Boolean)
      } else if (raw === 'true' || raw === 'false') {
        record[key] = raw === 'true'
      } else if (/^-?\d+$/.test(raw)) {
        record[key] = Number(raw)
      } else {
        record[key] = raw
      }
    })
    records.push(record)
    lines.push(row.line)
  }

  return { records, lines, header }
}

/**
 * Write rows as RFC 4180 CSV. Quotes any field containing a comma, quote or newline, so
 * the result round-trips through parseCsv.
 */
export function toCsv(rows, columns) {
  const escape = value => {
    const s = value === undefined || value === null ? '' : String(value)
    return /["\n\r,]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
  }
  const lines = [columns.join(',')]
  for (const row of rows) lines.push(columns.map(c => escape(row[c])).join(','))
  return lines.join('\n') + '\n'
}
