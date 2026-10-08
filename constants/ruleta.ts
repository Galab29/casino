import type { BetType, RouletteColor, RouletteNumberInfo, RouletteBet } from '~/types/ruleta'

/**
 * Secuencia estándar de la rueda europea (37 casillas, con un solo cero).
 * Sentido horario clásico.
 */
export const WHEEL_NUMBERS: number[] = [
  0, 32, 15, 19, 4, 21, 2, 25, 17, 34, 6, 27, 13, 36, 11, 30, 8, 23, 10, 5, 24, 16, 33, 1,
  20, 14, 31, 9, 22, 18, 29, 7, 28, 12, 35, 3, 26,
]

export const RED_NUMBERS = new Set<number>([
  1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36,
])

export const BLACK_NUMBERS = new Set<number>([
  2, 4, 6, 8, 10, 11, 13, 15, 17, 20, 22, 24, 26, 28, 29, 31, 33, 35,
])

export const CHIP_OPTIONS = [10, 25, 50, 100, 250, 500] as const

export const CHIP_CONFIG: Record<
  number,
  { color: string; textColor: string; border: string; label: string }
> = {
  10: { color: '#00897b', textColor: '#ffffff', border: '#80cbc4', label: '10' },
  25: { color: '#2e7d32', textColor: '#ffffff', border: '#a5d6a7', label: '25' },
  50: { color: '#1565c0', textColor: '#ffffff', border: '#90caf9', label: '50' },
  100: { color: '#5e35b1', textColor: '#ffffff', border: '#b39ddb', label: '100' },
  250: { color: '#c62828', textColor: '#ffffff', border: '#ef9a9a', label: '250' },
  500: { color: '#f57f17', textColor: '#000000', border: '#ffe082', label: '500' },
}

export const PAYOUT_MULTIPLIERS: Record<BetType, number> = {
  straight: 36, // 35:1 + 1 (retorno total)
  color: 2,     // 1:1 + 1
  parity: 2,    // 1:1 + 1
  range: 2,     // 1:1 + 1
  dozen: 3,     // 2:1 + 1
  column: 3,    // 2:1 + 1
}

export const PAYOUT_LABELS: Record<BetType, string> = {
  straight: '35 a 1',
  color: '1 a 1',
  parity: '1 a 1',
  range: '1 a 1',
  dozen: '2 a 1',
  column: '2 a 1',
}

/** Obtiene la información completa de cualquier número de la ruleta (0-36) */
export function getNumberInfo(n: number): RouletteNumberInfo {
  if (n === 0) {
    return {
      number: 0,
      color: 'green',
      isEven: false,
      isOdd: false,
      isLow: false,
      isHigh: false,
      dozen: null,
      column: null,
    }
  }

  const isRed = RED_NUMBERS.has(n)
  const color: RouletteColor = isRed ? 'red' : 'black'
  const isEven = n % 2 === 0
  const isOdd = !isEven
  const isLow = n >= 1 && n <= 18
  const isHigh = n >= 19 && n <= 36

  let dozen: 1 | 2 | 3 = 1
  if (n >= 13 && n <= 24) dozen = 2
  else if (n >= 25 && n <= 36) dozen = 3

  let column: 1 | 2 | 3 = 1
  if (n % 3 === 1) column = 1
  else if (n % 3 === 2) column = 2
  else column = 3

  return {
    number: n,
    color,
    isEven,
    isOdd,
    isLow,
    isHigh,
    dozen,
    column,
  }
}

/**
 * Evalúa si una apuesta resulta ganadora dado el número sorteado.
 */
export function isWinningBet(bet: RouletteBet, resultNumber: number): boolean {
  if (resultNumber === 0) {
    // Si sale 0, solo ganan las apuestas a pleno directo al 0
    return bet.type === 'straight' && Number(bet.target) === 0
  }

  const info = getNumberInfo(resultNumber)

  switch (bet.type) {
    case 'straight':
      return Number(bet.target) === resultNumber

    case 'color':
      return bet.target === info.color

    case 'parity':
      return (bet.target === 'even' && info.isEven) || (bet.target === 'odd' && info.isOdd)

    case 'range':
      return (bet.target === 'low' && info.isLow) || (bet.target === 'high' && info.isHigh)

    case 'dozen':
      return Number(bet.target) === info.dozen

    case 'column':
      return Number(bet.target) === info.column

    default:
      return false
  }
}

/** Matriz del tapete: 3 filas por 12 columnas */
export const TABLE_ROWS = [
  // Fila superior (Columna 3): 3, 6, 9, 12, 15, 18, 21, 24, 27, 30, 33, 36
  [3, 6, 9, 12, 15, 18, 21, 24, 27, 30, 33, 36],
  // Fila media (Columna 2): 2, 5, 8, 11, 14, 17, 20, 23, 26, 29, 32, 35
  [2, 5, 8, 11, 14, 17, 20, 23, 26, 29, 32, 35],
  // Fila inferior (Columna 1): 1, 4, 7, 10, 13, 16, 19, 22, 25, 28, 31, 34
  [1, 4, 7, 10, 13, 16, 19, 22, 25, 28, 31, 34],
] as const
