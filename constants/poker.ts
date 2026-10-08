import type { Card, Suit } from '~/types/blackjack'
import type { EvaluatedHand, PokerHandRank } from '~/types/poker'

export const SUITS: Suit[] = ['spades', 'hearts', 'diamonds', 'clubs']
export const VALUES: string[] = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A']

export const CARD_NUMERIC_RANK: Record<string, number> = {
  '2': 2,
  '3': 3,
  '4': 4,
  '5': 5,
  '6': 6,
  '7': 7,
  '8': 8,
  '9': 9,
  '10': 10,
  J: 11,
  Q: 12,
  K: 13,
  A: 14,
}

export const RANK_NAMES_PLURAL: Record<number, string> = {
  14: 'Ases',
  13: 'Reyes',
  12: 'Damas',
  11: 'Jotas',
  10: 'Dieces',
  9: 'Nueves',
  8: 'Ochos',
  7: 'Sietes',
  6: 'Seises',
  5: 'Cincos',
  4: 'Cuatros',
  3: 'Treses',
  2: 'Doses',
}

export const RANK_NAMES_SINGULAR: Record<number, string> = {
  14: 'As',
  13: 'Rey',
  12: 'Dama',
  11: 'Jota',
  10: 'Diez',
  9: 'Nueve',
  8: 'Ocho',
  7: 'Siete',
  6: 'Seis',
  5: 'Cinco',
  4: 'Cuatro',
  3: 'Tres',
  2: 'Dos',
}

export function createPokerDeck(): Card[] {
  const deck: Card[] = []
  for (const suit of SUITS) {
    for (const value of VALUES) {
      deck.push({
        id: `${suit}_${value}_${Math.random().toString(36).substring(2, 7)}`,
        suit,
        value,
        numericValue: CARD_NUMERIC_RANK[value],
        hidden: false,
      })
    }
  }
  return shufflePokerDeck(deck)
}

export function shufflePokerDeck(deck: Card[]): Card[] {
  const result = [...deck]
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[result[i], result[j]] = [result[j], result[i]]
  }
  return result
}

// ─── Combinations Helper ──────────────────────────────────────────
function getCombinations<T>(array: T[], size: number): T[][] {
  const result: T[][] = []
  function backtrack(start: number, current: T[]) {
    if (current.length === size) {
      result.push([...current])
      return
    }
    for (let i = start; i < array.length; i++) {
      current.push(array[i])
      backtrack(i + 1, current)
      current.pop()
    }
  }
  backtrack(0, [])
  return result
}

// ─── 5-Card Poker Evaluator ───────────────────────────────────────
export function evaluate5Cards(cards: Card[]): EvaluatedHand {
  if (cards.length < 5) {
    return evaluatePartialHand(cards)
  }

  // Sort descending by rank
  const sorted = [...cards].sort(
    (a, b) => CARD_NUMERIC_RANK[b.value] - CARD_NUMERIC_RANK[a.value],
  )
  const ranks = sorted.map((c) => CARD_NUMERIC_RANK[c.value])
  const suits = sorted.map((c) => c.suit)

  const isFlush = suits.every((s) => s === suits[0])

  // Count frequencies
  const counts: Record<number, number> = {}
  for (const r of ranks) {
    counts[r] = (counts[r] || 0) + 1
  }

  const uniqueRanks = Object.keys(counts)
    .map(Number)
    .sort((a, b) => {
      // Sort by count desc, then rank desc
      if (counts[b] !== counts[a]) {
        return counts[b] - counts[a]
      }
      return b - a
    })

  // Straight check
  let isStraight = false
  let straightHigh = 0

  if (uniqueRanks.length === 5) {
    if (ranks[0] - ranks[4] === 4) {
      isStraight = true
      straightHigh = ranks[0]
    } else if (
      ranks[0] === 14 &&
      ranks[1] === 5 &&
      ranks[2] === 4 &&
      ranks[3] === 3 &&
      ranks[4] === 2
    ) {
      // Ace-low wheel straight (A-2-3-4-5)
      isStraight = true
      straightHigh = 5
    }
  }

  // 1. Royal Flush & Straight Flush
  if (isFlush && isStraight) {
    if (straightHigh === 14) {
      return {
        rank: 'royal_flush',
        rankScore: 9,
        scoreValues: [9, 14],
        name: 'Escalera Real de Color',
        shortName: 'Escalera Real',
        bestFiveCards: sorted,
      }
    }
    return {
      rank: 'straight_flush',
      rankScore: 8,
      scoreValues: [8, straightHigh],
      name: `Escalera de Color al ${RANK_NAMES_SINGULAR[straightHigh]}`,
      shortName: 'Escalera de Color',
      bestFiveCards: sorted,
    }
  }

  // 2. Four of a kind (Póker)
  if (counts[uniqueRanks[0]] === 4) {
    const quad = uniqueRanks[0]
    const kicker = uniqueRanks[1]
    return {
      rank: 'four_of_a_kind',
      rankScore: 7,
      scoreValues: [7, quad, kicker],
      name: `Póker de ${RANK_NAMES_PLURAL[quad]}`,
      shortName: 'Póker',
      bestFiveCards: sorted,
    }
  }

  // 3. Full House
  if (counts[uniqueRanks[0]] === 3 && counts[uniqueRanks[1]] === 2) {
    const trio = uniqueRanks[0]
    const pair = uniqueRanks[1]
    return {
      rank: 'full_house',
      rankScore: 6,
      scoreValues: [6, trio, pair],
      name: `Full House de ${RANK_NAMES_PLURAL[trio]} y ${RANK_NAMES_PLURAL[pair]}`,
      shortName: 'Full House',
      bestFiveCards: sorted,
    }
  }

  // 4. Flush (Color)
  if (isFlush) {
    return {
      rank: 'flush',
      rankScore: 5,
      scoreValues: [5, ...ranks],
      name: `Color al ${RANK_NAMES_SINGULAR[ranks[0]]}`,
      shortName: 'Color',
      bestFiveCards: sorted,
    }
  }

  // 5. Straight (Escalera)
  if (isStraight) {
    return {
      rank: 'straight',
      rankScore: 4,
      scoreValues: [4, straightHigh],
      name: `Escalera al ${RANK_NAMES_SINGULAR[straightHigh]}`,
      shortName: 'Escalera',
      bestFiveCards: sorted,
    }
  }

  // 6. Three of a kind (Trío)
  if (counts[uniqueRanks[0]] === 3) {
    const trio = uniqueRanks[0]
    const kicker1 = uniqueRanks[1]
    const kicker2 = uniqueRanks[2]
    return {
      rank: 'three_of_a_kind',
      rankScore: 3,
      scoreValues: [3, trio, kicker1, kicker2],
      name: `Trío de ${RANK_NAMES_PLURAL[trio]}`,
      shortName: 'Trío',
      bestFiveCards: sorted,
    }
  }

  // 7. Two Pair (Doble Pareja)
  if (counts[uniqueRanks[0]] === 2 && counts[uniqueRanks[1]] === 2) {
    const highPair = Math.max(uniqueRanks[0], uniqueRanks[1])
    const lowPair = Math.min(uniqueRanks[0], uniqueRanks[1])
    const kicker = uniqueRanks[2]
    return {
      rank: 'two_pair',
      rankScore: 2,
      scoreValues: [2, highPair, lowPair, kicker],
      name: `Doble Pareja de ${RANK_NAMES_PLURAL[highPair]} y ${RANK_NAMES_PLURAL[lowPair]}`,
      shortName: 'Doble Pareja',
      bestFiveCards: sorted,
    }
  }

  // 8. One Pair (Pareja)
  if (counts[uniqueRanks[0]] === 2) {
    const pair = uniqueRanks[0]
    const kicker1 = uniqueRanks[1]
    const kicker2 = uniqueRanks[2]
    const kicker3 = uniqueRanks[3]
    return {
      rank: 'one_pair',
      rankScore: 1,
      scoreValues: [1, pair, kicker1, kicker2, kicker3],
      name: `Pareja de ${RANK_NAMES_PLURAL[pair]}`,
      shortName: 'Pareja',
      bestFiveCards: sorted,
    }
  }

  // 9. High Card (Carta Alta)
  return {
    rank: 'high_card',
    rankScore: 0,
    scoreValues: [0, ...ranks],
    name: `Carta Alta ${RANK_NAMES_SINGULAR[ranks[0]]}`,
    shortName: `Carta Alta ${RANK_NAMES_SINGULAR[ranks[0]]}`,
    bestFiveCards: sorted,
  }
}

// ─── Evaluator for Partial Hands (e.g. 2 cards pre-flop) ───────────
function evaluatePartialHand(cards: Card[]): EvaluatedHand {
  const sorted = [...cards].sort(
    (a, b) => CARD_NUMERIC_RANK[b.value] - CARD_NUMERIC_RANK[a.value],
  )
  if (sorted.length === 0) {
    return {
      rank: 'high_card',
      rankScore: 0,
      scoreValues: [0],
      name: 'Sin cartas',
      shortName: 'Sin cartas',
      bestFiveCards: [],
    }
  }

  const ranks = sorted.map((c) => CARD_NUMERIC_RANK[c.value])
  if (ranks.length === 2 && ranks[0] === ranks[1]) {
    return {
      rank: 'one_pair',
      rankScore: 1,
      scoreValues: [1, ranks[0]],
      name: `Pareja de mano de ${RANK_NAMES_PLURAL[ranks[0]]}`,
      shortName: `Pareja de ${RANK_NAMES_PLURAL[ranks[0]]}`,
      bestFiveCards: sorted,
    }
  }

  return {
    rank: 'high_card',
    rankScore: 0,
    scoreValues: [0, ...ranks],
    name: `Carta Alta ${RANK_NAMES_SINGULAR[ranks[0]]}`,
    shortName: `Carta Alta ${RANK_NAMES_SINGULAR[ranks[0]]}`,
    bestFiveCards: sorted,
  }
}

// ─── Compare two hands ────────────────────────────────────────────
// Returns > 0 if A wins, < 0 if B wins, 0 if tie
export function compareEvaluatedHands(a: EvaluatedHand, b: EvaluatedHand): number {
  const len = Math.max(a.scoreValues.length, b.scoreValues.length)
  for (let i = 0; i < len; i++) {
    const valA = a.scoreValues[i] ?? 0
    const valB = b.scoreValues[i] ?? 0
    if (valA > valB) return 1
    if (valA < valB) return -1
  }
  return 0
}

// ─── Best 5 of up to 7 cards ──────────────────────────────────────
export function getBestHand(holeCards: Card[], communityCards: Card[]): EvaluatedHand {
  const allCards = [...holeCards, ...communityCards]
  if (allCards.length <= 5) {
    return evaluate5Cards(allCards)
  }

  const combinations = getCombinations(allCards, 5)
  let best = evaluate5Cards(combinations[0])

  for (let i = 1; i < combinations.length; i++) {
    const current = evaluate5Cards(combinations[i])
    if (compareEvaluatedHands(current, best) > 0) {
      best = current
    }
  }

  return best
}

// ─── AI Opponent Quotes & Personalities ─────────────────────────────
export const DEALER_QUOTES = {
  check: [
    'Paso, la pelota está en tu tejado.',
    'Paso. Veamos la siguiente carta.',
    'Paso por ahora.',
    'Check.',
  ],
  call: [
    'Te igualo. Vamos a ver.',
    'Acepto tu apuesta.',
    'Pago para ver el desenlace.',
    'Igualo tu jugada.',
  ],
  raise: [
    'Esta mesa es mía. ¡Subo la apuesta!',
    'Huelo debilidad. Aumento el bote.',
    'Subo. ¿Te atreves a seguir?',
    'Presión sobre la mesa. ¡Subo!',
  ],
  fold: [
    'Me retiro. Esta mano te pertenece.',
    'Demasiado caro para lo que llevo. Retirada.',
    'Fold. Buena jugada.',
    'No voy a forzar esta mano. Te la llevas.',
  ],
  allin: [
    '¡Todo o nada! ¡Voy All-in!',
    'Pongo todas mis fichas en el centro. ¡All-in!',
    'Es momento de jugárselo todo. ¡All-in!',
  ],
}
