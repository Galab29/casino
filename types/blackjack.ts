// ─── Card ────────────────────────────────────────────────────
export type Suit = 'hearts' | 'diamonds' | 'clubs' | 'spades'

export interface Card {
  id: string
  suit: Suit
  value: string          // 'A','2',…,'10','J','Q','K'
  numericValue: number   // base value (Ace = 11, face = 10)
  hidden: boolean
}

// ─── Player / Dealer State ───────────────────────────────────
export type HandStatus = 'playing' | 'stand' | 'busted' | 'blackjack' | 'doubled_down'

export interface PlayerState {
  hand: Card[]
  score: number
  chips: number
  currentBet: number
  status: HandStatus
}

export interface DealerState {
  hand: Card[]
  score: number
  status: HandStatus
}

// ─── Game Status ─────────────────────────────────────────────
export type GameStatus =
  | 'betting'
  | 'dealing'
  | 'player_turn'
  | 'dealer_turn'
  | 'round_over'

// ─── Statistics ──────────────────────────────────────────────
export interface GameStats {
  playerWins: number
  dealerWins: number
  draws: number
  totalGames: number
}

