// Renders JSON Logic as English, for the reviewer pack.
//
// A methods reviewer is being asked whether a rule is correct. They cannot answer that
// from `{"in": [{"var": "pre_periods"}, ["none", "one"]]}`, so every condition in the pack
// is rendered as a sentence, using the option labels the user actually sees rather than
// the internal values.

/** @param {Map<string, object>} questions  id -> question, for option labels */
function labelFor(questionId, value, questions) {
  const option = questions?.get(questionId)?.options?.find(o => String(o.value) === String(value))
  return option ? `“${option.label}”` : `“${value}”`
}

function varName(node) {
  if (!node || typeof node !== 'object' || !('var' in node)) return null
  return Array.isArray(node.var) ? node.var[0] : node.var
}

/**
 * Render an expression as a readable condition.
 * Returns '(always)' for an absent expression, so a table cell is never blank-ambiguous.
 */
export function describeExpression(expr, questions, { top = true } = {}) {
  if (!expr || typeof expr !== 'object') return expr === undefined ? '(always)' : String(expr)

  const [op] = Object.keys(expr)
  const raw = expr[op]
  const args = Array.isArray(raw) ? raw : [raw]

  const wrap = text => (top ? text : `(${text})`)

  switch (op) {
    case 'var':
      return varName(expr)

    case '==':
    case '!=': {
      const name = varName(args[0])
      if (!name) return `${JSON.stringify(args[0])} ${op} ${JSON.stringify(args[1])}`
      const verb = op === '==' ? 'is' : 'is not'
      return `${name} ${verb} ${labelFor(name, args[1], questions)}`
    }

    case 'in': {
      const name = varName(args[0])
      const list = (args[1] ?? []).map(v => labelFor(name, v, questions))
      if (list.length === 1) return `${name} is ${list[0]}`
      return `${name} is one of ${list.join(' or ')}`
    }

    case 'and':
    case 'or': {
      const joined = args
        .map(a => describeExpression(a, questions, { top: false }))
        .join(op === 'and' ? ' and ' : ' or ')
      return wrap(joined)
    }

    case '!':
      return wrap(`not ${describeExpression(args[0], questions, { top: false })}`)

    default:
      // Unknown operator: show the raw expression rather than pretending to read it.
      return JSON.stringify(expr)
  }
}

/** The questions an expression reads, in order of first appearance. */
export function questionsRead(expr, found = []) {
  if (Array.isArray(expr)) { expr.forEach(e => questionsRead(e, found)); return found }
  if (!expr || typeof expr !== 'object') return found
  for (const [key, value] of Object.entries(expr)) {
    if (key === 'var') {
      const name = Array.isArray(value) ? value[0] : value
      if (typeof name === 'string' && !found.includes(name)) found.push(name)
    } else {
      questionsRead(value, found)
    }
  }
  return found
}

/** A threshold rendered for a reviewer: the figure, its range, and what it rests on. */
export function describeThreshold(threshold) {
  if (!threshold) return ''
  const parts = [`${threshold.value}${threshold.units ? ' ' + threshold.units : ''}`]
  if (threshold.range) parts.push(`(range ${threshold.range[0]}–${threshold.range[1]})`)
  parts.push(`— ${threshold.basis}`)
  if (threshold.contested) parts.push('· contested')
  return parts.join(' ')
}
