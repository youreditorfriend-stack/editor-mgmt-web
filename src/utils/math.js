import { evaluate as mathEval } from 'mathjs'

export function evalMath(input) {
  const trimmed = String(input ?? '').trim()
  if (!trimmed) return null

  const hasMath = /[+\-*/()^]/.test(trimmed)
  if (!hasMath) {
    const n = Number(trimmed)
    return isNaN(n) ? null : formatNum(n)
  }

  try {
    const result = mathEval(trimmed)
    if (typeof result !== 'number' || !isFinite(result)) return null
    return formatNum(result)
  } catch {
    return null
  }
}

function formatNum(n) {
  if (Number.isInteger(n)) return String(n)
  return parseFloat(n.toFixed(2)).toString()
}

export function isMathExpr(input) {
  return /[+\-*/()^]/.test(String(input ?? ''))
}
