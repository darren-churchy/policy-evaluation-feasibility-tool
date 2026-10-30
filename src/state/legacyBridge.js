// The bridge from the previous tool's vocabularies to the shared answer store.
//
// This exists so the seven sections, the Design Finder, the Question Framework and both
// trees can share one set of answers without being rewritten — they are all scheduled for
// retirement or rewrite at the switchover, and investing in their internals would be
// spending on code about to be deleted. The bridge dies with them.
//
// Everything it does is read from spec/migration.yaml. There is no second mapping to keep
// in step: an id's disposition there decides where its value is kept.
//
//   renamed   -> the shared answer store, under the new id, with values translated
//   to_notes  -> the notes annex
//   split     -> local only. A screen asserted two or three things behind one yes/no and
//                there is no telling which was meant, so it is deliberately not shared.
//   dropped   -> local only. The old page still renders it; nothing downstream reads it.
//
// Local means held in the old page's own state for the session, exactly as before. It
// never reaches the engine, which is the point of having dropped it.

export const SHARED = 'shared'
export const NOTE = 'note'
export const LOCAL = 'local'

/**
 * @param {object} migration  the parsed spec/migration.yaml
 * @returns a lookup from old id to where its value lives and how to translate it
 */
export function buildBridge(migration) {
  const byOldId = new Map()

  for (const entry of migration?.renamed ?? []) {
    const forward = new Map(Object.entries(entry.values ?? {}))
    // Several old values can map to one new one — p7_predata's "yes" and q_predata's
    // "many" both become `many`. Reversing keeps the first, which is the closest reading.
    const reverse = new Map()
    for (const [from, to] of forward) if (!reverse.has(to)) reverse.set(to, from)
    byOldId.set(entry.from, { kind: SHARED, target: entry.to, forward, reverse })
  }

  for (const entry of migration?.to_notes ?? []) {
    byOldId.set(entry.from, { kind: NOTE, target: entry.to })
  }

  for (const entry of [...(migration?.split ?? []), ...(migration?.dropped ?? [])]) {
    byOldId.set(entry.from, { kind: LOCAL })
  }

  const table = migration?.table
  const columns = new Map(Object.entries(table?.columns ?? {}))
  const columnsBack = new Map([...columns].map(([from, to]) => [to, from]))

  return { byOldId, table: table ? { ...table, columns, columnsBack } : null }
}

/** Where an old id's value belongs, and what it becomes on the way. */
export function routeWrite(bridge, id, value) {
  const entry = bridge.byOldId.get(id)
  if (!entry) return { kind: LOCAL, id, value }
  if (entry.kind === SHARED) {
    return { kind: SHARED, id: entry.target, value: entry.forward.get(value) ?? value }
  }
  if (entry.kind === NOTE) return { kind: NOTE, id: entry.target, value }
  return { kind: LOCAL, id, value }
}

/**
 * Rebuild the flat `inputs` object the old pages read, from wherever each value now lives.
 *
 * Several old ids can share one target — the four collisions the redesign exists to fix.
 * They now all read the same value, which is the whole point: answering in the Design
 * Finder answers it in the assessment too.
 */
export function toLegacyInputs(bridge, answers, notes, local) {
  const inputs = { ...local }

  for (const [oldId, entry] of bridge.byOldId) {
    if (entry.kind === SHARED) {
      const value = answers?.[entry.target]
      if (value !== undefined) inputs[oldId] = entry.reverse.get(value) ?? value
    } else if (entry.kind === NOTE) {
      const value = notes?.[entry.target]
      if (value !== undefined) inputs[oldId] = value
    }
  }

  return inputs
}

/** The data-source table, in the shape the old page expects. */
export function toLegacyRows(bridge, notes, blankRow) {
  const rows = notes?.[bridge.table?.to]
  if (!bridge.table || !Array.isArray(rows) || !rows.length) return [blankRow()]
  return rows.map(row => {
    const out = { ...blankRow() }
    for (const [oldColumn, newColumn] of bridge.table.columns) {
      if (row[newColumn] !== undefined) out[oldColumn] = row[newColumn]
    }
    // Columns the inventory does not carry are kept on the row rather than discarded, so
    // the old page round trips without losing what the user typed.
    for (const [key, value] of Object.entries(row)) {
      if (!bridge.table.columnsBack.has(key)) out[key] = value
    }
    return out
  })
}

/** The reverse: the old page's rows, in the shape the notes annex holds. */
export function fromLegacyRows(bridge, rows) {
  if (!bridge.table) return []
  return (rows ?? []).map(row => {
    const out = {}
    for (const [key, value] of Object.entries(row)) {
      out[bridge.table.columns.get(key) ?? key] = value
    }
    return out
  })
}
