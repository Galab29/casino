import type { Card } from './blackjack'

export type PokerHandRank =
  | 'high_card'
  | 'one_pair'
  | 'two_pair'
  | 'three_of_a_kind'
  | 'straight'
  | 'flush'
  | 'full_house'
  | 'four_of_a_kind'
  | 'straight_flush'
  | 'royal_flush'

export interface EvaluatedHand {
  rank: PokerHandRank
  rankScore: number       // 0 to 9
  scoreValues: number[]   // For tie-breaking (e.g. [pairVal, kicker1, kicker2, kicker3])
  name: string            // e.g. "Doble Pareja de Reyes y Dieces"
  shortName: string       // e.g. "Doble Pareja"
  bestFiveCards: Card[]   // Exact 5 cards used
}

export type Street = 'idle' | 'preflop' | 'flop' | 'turn' | 'river' | 'showdown'

export type PlayerAction = 'fold' | 'check' | 'call' | 'bet' | 'raise' | 'allin'

export interface PokerPlayer {
  id: 'player' | 'dealer'
  name: string
  chips: number
  currentRoundBet: number // chips committed in the current street
  totalHandBet: number    // total chips committed in this entire hand
  cards: Card[]
  hasActed: boolean
  isFolded: boolean
  isAllIn: boolean
  lastAction: string | null
}

export interface DealerSpeech {
  text: string
  actionType: 'check' | 'call' | 'raise' | 'fold' | 'allin' | 'neutral'
  timestamp: number
}

export interface PokerRoundResult {
  winner: 'player' | 'dealer' | 'tie'
  pot: number
  playerWon: number
  dealerWon: number
  playerHand: EvaluatedHand
  dealerHand: EvaluatedHand
  reason: string
  byFold?: boolean        // true if the hand ended because someone folded (no card showdown)
}
