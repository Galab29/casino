export type DadosBetType =
  // Line bets
  | 'pass_line'
  | 'dont_pass'
  // Place bets
  | 'place_4'
  | 'place_5'
  | 'place_6'
  | 'place_8'
  | 'place_9'
  | 'place_10'
  // Field bet
  | 'field'
  // Hardways
  | 'hard_4'
  | 'hard_6'
  | 'hard_8'
  | 'hard_10'
  // Proposition / One-roll bets
  | 'any_7'
  | 'any_craps'
  | 'craps_2' // Snake eyes (1+1)
  | 'craps_12' // Boxcars (6+6)
  | 'craps_3' // Ace-deuce
  | 'eleven' // Yo (11)
  // Low / High
  | 'under_7'
  | 'over_7'

export type CrapsPhase = 'come_out' | 'point'

export interface DadosBet {
  type: DadosBetType
  amount: number
  label: string
}

export interface DadosWinningBet {
  type: DadosBetType
  label: string
  betAmount: number
  payoutMultiplier: number
  wonAmount: number // Net profit + returned bet
  profit: number
}

export interface RollResult {
  id: number
  die1: number
  die2: number
  total: number
  isHardway: boolean
  phase: CrapsPhase
  pointBefore: number | null
  pointAfter: number | null
  event:
    | 'point_established'
    | 'point_hit'
    | 'seven_out'
    | 'natural_win'
    | 'craps_loss'
    | 'regular_roll'
  eventLabel: string
  totalBet: number
  totalWon: number
  netProfit: number
  winningBets: DadosWinningBet[]
  losingBets: { type: DadosBetType; label: string; amount: number }[]
  timestamp: number
}

export interface DadosStats {
  totalRolls: number
  comeOutRolls: number
  pointsEstablished: number
  pointsHit: number
  sevenOuts: number
  totalBet: number
  totalWon: number
  biggestWin: number
  numberFrequency: Record<number, number> // 2 to 12
}
