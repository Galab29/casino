export type RouletteColor = 'green' | 'red' | 'black'

export type BetType =
  | 'straight' // Pleno (0-36) -> 35:1 (retorna 36x)
  | 'color'    // Rojo o Negro -> 1:1 (retorna 2x)
  | 'parity'   // Par o Impar -> 1:1 (retorna 2x)
  | 'range'    // Falta (1-18) o Pasa (19-36) -> 1:1 (retorna 2x)
  | 'dozen'    // 1ª (1-12), 2ª (13-24), 3ª (25-36) -> 2:1 (retorna 3x)
  | 'column'   // Col 1, Col 2, Col 3 -> 2:1 (retorna 3x)

export interface RouletteBet {
  id: string
  type: BetType
  target: string | number
  amount: number
  label: string
}

export interface RouletteNumberInfo {
  number: number
  color: RouletteColor
  isEven: boolean
  isOdd: boolean
  isLow: boolean
  isHigh: boolean
  dozen: 1 | 2 | 3 | null
  column: 1 | 2 | 3 | null
}

export interface WinningBetDetail {
  bet: RouletteBet
  multiplier: number
  payout: number
  profit: number
}

export interface SpinResult {
  id: number
  number: number
  info: RouletteNumberInfo
  totalBet: number
  totalWon: number
  netProfit: number
  winningBets: WinningBetDetail[]
  timestamp: number
}

export interface RuletaStats {
  spins: number
  wins: number
  totalBet: number
  totalWon: number
  biggestWin: number
}
