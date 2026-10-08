// ─── Símbolos ────────────────────────────────────────────────
export interface SlotSymbol {
  id: string
  name: string
  icon?: string   // Icono MDI (ej: 'mdi-fruit-cherries')
  text?: string   // Texto alternativo (ej: '7')
  color: string   // Color principal del símbolo
}

// ─── Tabla de pagos ──────────────────────────────────────────
export interface PayoutRule {
  symbolId: string
  multiplier: number   // Retorno total = costo × multiplicador
  probability: number  // Probabilidad (0-1) de obtener 3 iguales de este símbolo
}

// ─── Máquina ─────────────────────────────────────────────────
export type MachineTier = 'bronze' | 'gold' | 'royal'

export interface MachineTheme {
  primary: string
  secondary: string
  glow: string
  gradient: string
}

export interface SlotMachineConfig {
  id: MachineTier
  name: string
  subtitle: string
  icon: string
  cost: number          // Fichas por tirada
  spinDuration: number  // Duración base (ms) del giro del primer rodillo
  risk: 1 | 2 | 3       // Nivel de riesgo visual
  theme: MachineTheme
  symbols: SlotSymbol[]
  paytable: PayoutRule[] // Ordenada de menor a mayor premio
}

// ─── Estado del juego ────────────────────────────────────────
export type SlotStatus = 'idle' | 'spinning' | 'result'

export type WinLevel = 'none' | 'small' | 'big' | 'jackpot'

export interface SpinOutcome {
  reels: [string, string, string] // ids de símbolos en la línea de pago
  winningSymbolId: string | null
  multiplier: number
  payout: number
  winLevel: WinLevel
}

export interface MachineStats {
  spins: number
  wins: number
  totalBet: number
  totalWon: number
  biggestWin: number
}

export interface SpinHistoryEntry {
  id: number
  machineId: MachineTier
  reels: [string, string, string]
  cost: number
  payout: number
}
