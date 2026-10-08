export type BaccaratBetType = 'player' | 'banker' | 'tie' | 'player_pair' | 'banker_pair'

export interface BaccaratBet {
  type: BaccaratBetType
  amount: number
  label: string
}

export type BaccaratHandWinner = 'player' | 'banker' | 'tie'

export interface BaccaratCard {
  id: string
  suit: 'hearts' | 'diamonds' | 'clubs' | 'spades'
  value: string
  numericValue: number
  baccaratValue: number
  hidden: boolean
}

export interface BaccaratHand {
  cards: BaccaratCard[]
  score: number
  isNatural: boolean
  hasPair: boolean
}

export interface BaccaratWinningBet {
  type: BaccaratBetType
  label: string
  betAmount: number
  multiplier: number
  payout: number
  profit: number
}

export interface BaccaratRoundResult {
  id: number
  winner: BaccaratHandWinner
  playerScore: number
  bankerScore: number
  playerHand: BaccaratCard[]
  bankerHand: BaccaratCard[]
  playerPair: boolean
  bankerPair: boolean
  isNatural: boolean
  totalBet: number
  totalWon: number
  netProfit: number
  winningBets: BaccaratWinningBet[]
  timestamp: number
}

export interface BaccaratStats {
  rounds: number
  playerWins: number
  bankerWins: number
  ties: number
  totalBet: number
  totalWon: number
  biggestWin: number
}
