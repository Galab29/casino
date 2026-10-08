import type {
  BaccaratBetType,
  BaccaratCard,
  BaccaratHand,
} from '~/types/baccarat'

export const BACCARAT_PAYOUTS: Record<BaccaratBetType, number> = {
  player: 2,        // 1:1 + apuesta
  banker: 1.95,     // 0.95:1 (comisión 5%) + apuesta
  tie: 9,           // 8:1 + apuesta
  player_pair: 12,  // 11:1 + apuesta
  banker_pair: 12,  // 11:1 + apuesta
}

export const BACCARAT_PAYOUT_LABELS: Record<BaccaratBetType, string> = {
  player: '1 a 1',
  banker: '0.95 a 1 (comisión 5%)',
  tie: '8 a 1',
  player_pair: '11 a 1',
  banker_pair: '11 a 1',
}

export const CHIP_OPTIONS = [10, 25, 50, 100, 250, 500] as const

const SUITS: ('hearts' | 'diamonds' | 'clubs' | 'spades')[] = [
  'hearts',
  'diamonds',
  'clubs',
  'spades',
]

const VALUES: { value: string; numericValue: number; baccaratValue: number }[] = [
  { value: 'A', numericValue: 1, baccaratValue: 1 },
  { value: '2', numericValue: 2, baccaratValue: 2 },
  { value: '3', numericValue: 3, baccaratValue: 3 },
  { value: '4', numericValue: 4, baccaratValue: 4 },
  { value: '5', numericValue: 5, baccaratValue: 5 },
  { value: '6', numericValue: 6, baccaratValue: 6 },
  { value: '7', numericValue: 7, baccaratValue: 7 },
  { value: '8', numericValue: 8, baccaratValue: 8 },
  { value: '9', numericValue: 9, baccaratValue: 9 },
  { value: '10', numericValue: 10, baccaratValue: 0 },
  { value: 'J', numericValue: 10, baccaratValue: 0 },
  { value: 'Q', numericValue: 10, baccaratValue: 0 },
  { value: 'K', numericValue: 10, baccaratValue: 0 },
]

/** Construye un zapato de baccarat clásico de 8 barajas (416 cartas) */
export function buildShoe(decksCount = 8): BaccaratCard[] {
  const shoe: BaccaratCard[] = []
  for (let d = 0; d < decksCount; d++) {
    for (const suit of SUITS) {
      for (const v of VALUES) {
        shoe.push({
          id: `${v.value}_${suit}_${d}_${Math.random().toString(36).substring(2, 7)}`,
          suit,
          value: v.value,
          numericValue: v.numericValue,
          baccaratValue: v.baccaratValue,
          hidden: false,
        })
      }
    }
  }
  return shuffle(shoe)
}

/** Algoritmo de barajado Fisher-Yates */
export function shuffle<T>(array: T[]): T[] {
  const arr = [...array]
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}

/** Calcula la puntuación del baccarat (suma de cartas módulo 10) */
export function calculateBaccaratScore(cards: BaccaratCard[]): number {
  const sum = cards.reduce((acc, c) => acc + c.baccaratValue, 0)
  return sum % 10
}

/** Verifica si las dos primeras cartas forman una pareja del mismo valor */
export function checkPair(cards: BaccaratCard[]): boolean {
  if (cards.length < 2) return false
  return cards[0].value === cards[1].value
}

/** Regla del Jugador para pedir tercera carta */
export function shouldPlayerDraw(playerScore: number): boolean {
  return playerScore >= 0 && playerScore <= 5
}

/**
 * Regla oficial del Banco (Tableau de Punto Banco):
 * Si el jugador se plantó (no pidió 3ª carta): el banco pide con 0-5 y se planta con 6-7.
 * Si el jugador pidió 3ª carta: el banco actúa según su total y la carta del jugador.
 */
export function shouldBankerDraw(
  bankerScore: number,
  playerThirdCardValue: number | null,
): boolean {
  if (playerThirdCardValue === null) {
    return bankerScore <= 5
  }

  if (bankerScore <= 2) return true
  if (bankerScore === 3) return playerThirdCardValue !== 8
  if (bankerScore === 4) return [2, 3, 4, 5, 6, 7].includes(playerThirdCardValue)
  if (bankerScore === 5) return [4, 5, 6, 7].includes(playerThirdCardValue)
  if (bankerScore === 6) return [6, 7].includes(playerThirdCardValue)

  return false // con 7 o más, el banco siempre se planta
}
