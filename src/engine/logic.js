// Three-valued JSON Logic evaluation.
//
// The defect this exists to prevent: with ordinary two-valued logic, a test like
// `{'==': [{var: 'prospective'}, 'no']}` evaluates to FALSE when `prospective` has not
// been answered — because an absent variable reads as null, and null is not 'no'. A
// blocker that reads false does not fire, so a design that has never been checked
// presents as Feasible. That is exactly how the previous tool produced a top
// recommendation before the user had answered anything.
//
// Here an unanswered variable yields UNKNOWN, and UNKNOWN propagates under Kleene's
// strong three-valued logic:
//
//   AND  false if any operand is false; true if all are true; otherwise unknown
//   OR   true if any operand is true; false if all are false; otherwise unknown
//
// So `or` can still resolve when one branch is known true even if another is unanswered,
// which is what lets stage inference conclude as soon as any readiness answer is partial.

export const UNKNOWN = Symbol('unknown')

const SUPPORTED = new Set(['var', '==', '!=', 'in', 'and', 'or', '!'])

/** Operators this evaluator implements. The spec is checked against this set by test. */
export function supportedOperators() {
  return new Set(SUPPORTED)
}

function asTruth(value) {
  return value === UNKNOWN ? UNKNOWN : Boolean(value)
}

/** Values are compared as strings: the answer domain is string enums from YAML. */
function sameValue(a, b) {
  return String(a) === String(b)
}

/**
 * Evaluate a JSON Logic expression against an answer store.
 * Returns true, false, UNKNOWN, or a literal value (for `var` and plain literals).
 *
 * Throws on an operator it does not implement, rather than silently returning false —
 * a quietly misevaluated rule is worse than a loud failure.
 */
export function evaluateLogic(expr, answers) {
  if (expr === null || expr === undefined) return expr
  if (Array.isArray(expr)) return expr.map(e => evaluateLogic(e, answers))
  if (typeof expr !== 'object') return expr

  const keys = Object.keys(expr)
  if (keys.length !== 1) {
    throw new Error(`JSON Logic expression must have exactly one operator, found: ${keys.join(', ') || '(none)'}`)
  }

  const op = keys[0]
  if (!SUPPORTED.has(op)) {
    throw new Error(`unsupported JSON Logic operator "${op}"`)
  }

  const raw = expr[op]

  if (op === 'var') {
    const name = Array.isArray(raw) ? raw[0] : raw
    const value = answers?.[name]
    // Absent, null and empty string all mean "not answered".
    return value === undefined || value === null || value === '' ? UNKNOWN : value
  }

  const args = Array.isArray(raw) ? raw : [raw]

  switch (op) {
    case 'and': {
      const values = args.map(a => asTruth(evaluateLogic(a, answers)))
      if (values.some(v => v === false)) return false
      if (values.some(v => v === UNKNOWN)) return UNKNOWN
      return true
    }

    case 'or': {
      const values = args.map(a => asTruth(evaluateLogic(a, answers)))
      if (values.some(v => v === true)) return true
      if (values.some(v => v === UNKNOWN)) return UNKNOWN
      return false
    }

    case '!': {
      const v = asTruth(evaluateLogic(args[0], answers))
      return v === UNKNOWN ? UNKNOWN : !v
    }

    case '==':
    case '!=': {
      const [a, b] = args.map(x => evaluateLogic(x, answers))
      if (a === UNKNOWN || b === UNKNOWN) return UNKNOWN
      const equal = sameValue(a, b)
      return op === '==' ? equal : !equal
    }

    case 'in': {
      const needle = evaluateLogic(args[0], answers)
      const haystack = args[1]
      if (!Array.isArray(haystack)) {
        throw new Error('`in` expects an array as its second argument')
      }
      if (needle === UNKNOWN) return UNKNOWN
      return haystack.some(h => sameValue(evaluateLogic(h, answers), needle))
    }

    default:
      throw new Error(`unsupported JSON Logic operator "${op}"`)
  }
}

/** Every `var` name an expression reads. */
export function variablesIn(expr, found = new Set()) {
  if (Array.isArray(expr)) {
    expr.forEach(e => variablesIn(e, found))
    return found
  }
  if (!expr || typeof expr !== 'object') return found
  for (const [key, value] of Object.entries(expr)) {
    if (key === 'var') {
      const name = Array.isArray(value) ? value[0] : value
      if (typeof name === 'string') found.add(name)
    } else {
      variablesIn(value, found)
    }
  }
  return found
}

/** The variables an expression reads that have no answer yet. */
export function unansweredIn(expr, answers) {
  return [...variablesIn(expr)].filter(name => {
    const v = answers?.[name]
    return v === undefined || v === null || v === ''
  })
}
