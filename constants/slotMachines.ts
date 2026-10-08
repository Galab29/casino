import type { SlotMachineConfig, SlotSymbol } from '~/types/slots'

/**
 * Configuración de las 3 máquinas tragamonedas.
 *
 * Regla de diseño: cada máquina es MÁS CARA, paga PREMIOS MAYORES
 * pero tiene MENOR PROBABILIDAD de ganar.
 *
 * | Máquina          | Costo | Prob. ganar | Premio máx.  | RTP  |
 * |------------------|-------|-------------|--------------|------|
 * | Fruit Classic    |   10  |   ~27.1 %   |   x50  (500) | 95 % |
 * | Golden Deluxe    |   50  |   ~13.8 %   |  x100 (5000) | 94 % |
 * | Royal Jackpot    |  200  |    ~5.3 %   | x1000 (200k) | 94 % |
 *
 * RTP (Return To Player) = Σ (probabilidad × multiplicador)
 */
export const SLOT_MACHINES: SlotMachineConfig[] = [
  // ─── 1. BRONCE ─────────────────────────────────────────────
  {
    id: 'bronze',
    name: 'Fruit Classic',
    subtitle: 'Ganancias frecuentes, premios modestos',
    icon: 'mdi-fruit-cherries',
    cost: 10,
    spinDuration: 1100,
    risk: 1,
    theme: {
      primary: '#e0a060',
      secondary: '#a0602a',
      glow: 'rgba(224, 160, 96, 0.55)',
      gradient: 'linear-gradient(160deg, #4e2a12 0%, #2b1609 60%, #140a04 100%)',
    },
    symbols: [
      { id: 'cherry', name: 'Cereza', icon: 'mdi-fruit-cherries', color: '#ff5252' },
      { id: 'lemon', name: 'Limón', icon: 'mdi-fruit-citrus', color: '#ffee58' },
      { id: 'watermelon', name: 'Sandía', icon: 'mdi-fruit-watermelon', color: '#66bb6a' },
      { id: 'grapes', name: 'Uvas', icon: 'mdi-fruit-grapes', color: '#ba68c8' },
      { id: 'bell', name: 'Campana', icon: 'mdi-bell', color: '#ffca28' },
      { id: 'seven', name: 'Siete', text: '7', color: '#ff1744' },
    ],
    paytable: [
      { symbolId: 'cherry', multiplier: 2, probability: 0.14 },
      { symbolId: 'lemon', multiplier: 3, probability: 0.07 },
      { symbolId: 'watermelon', multiplier: 5, probability: 0.035 },
      { symbolId: 'grapes', multiplier: 8, probability: 0.02 },
      { symbolId: 'bell', multiplier: 15, probability: 0.005 },
      { symbolId: 'seven', multiplier: 50, probability: 0.001 },
    ],
  },

  // ─── 2. ORO ────────────────────────────────────────────────
  {
    id: 'gold',
    name: 'Golden Deluxe',
    subtitle: 'Equilibrio entre riesgo y recompensa',
    icon: 'mdi-crown',
    cost: 50,
    spinDuration: 1400,
    risk: 2,
    theme: {
      primary: '#ffd54f',
      secondary: '#ff8f00',
      glow: 'rgba(255, 213, 79, 0.55)',
      gradient: 'linear-gradient(160deg, #4a3a0a 0%, #2a1f04 60%, #120d02 100%)',
    },
    symbols: [
      { id: 'clover', name: 'Trébol', icon: 'mdi-clover', color: '#69f0ae' },
      { id: 'star', name: 'Estrella', icon: 'mdi-star', color: '#ea80fc' },
      { id: 'goldbar', name: 'Lingotes', icon: 'mdi-gold', color: '#ffab40' },
      { id: 'crown', name: 'Corona', icon: 'mdi-crown', color: '#ffd740' },
      { id: 'diamond', name: 'Diamante', icon: 'mdi-diamond-stone', color: '#40c4ff' },
    ],
    paytable: [
      { symbolId: 'clover', multiplier: 3, probability: 0.07 },
      { symbolId: 'star', multiplier: 5, probability: 0.04 },
      { symbolId: 'goldbar', multiplier: 10, probability: 0.02 },
      { symbolId: 'crown', multiplier: 25, probability: 0.006 },
      { symbolId: 'diamond', multiplier: 100, probability: 0.0018 },
    ],
  },

  // ─── 3. ROYAL ──────────────────────────────────────────────
  {
    id: 'royal',
    name: 'Royal Jackpot',
    subtitle: 'Alto riesgo · Premio mayor de x1000',
    icon: 'mdi-diamond',
    cost: 200,
    spinDuration: 1800,
    risk: 3,
    theme: {
      primary: '#b388ff',
      secondary: '#e040fb',
      glow: 'rgba(179, 136, 255, 0.6)',
      gradient: 'linear-gradient(160deg, #2a0f4a 0%, #170833 60%, #0a0418 100%)',
    },
    symbols: [
      { id: 'dice', name: 'Dado', icon: 'mdi-dice-5', color: '#eceff1' },
      { id: 'trophy', name: 'Copa', icon: 'mdi-trophy-variant', color: '#90caf9' },
      { id: 'fire', name: 'Fuego', icon: 'mdi-fire', color: '#ff6e40' },
      { id: 'crystal', name: 'Bola de Cristal', icon: 'mdi-crystal-ball', color: '#b388ff' },
      { id: 'jackpot', name: 'Diamante Royale', icon: 'mdi-diamond', color: '#18ffff' },
    ],
    paytable: [
      { symbolId: 'dice', multiplier: 5, probability: 0.03 },
      { symbolId: 'trophy', multiplier: 12, probability: 0.015 },
      { symbolId: 'fire', multiplier: 30, probability: 0.006 },
      { symbolId: 'crystal', multiplier: 100, probability: 0.0018 },
      { symbolId: 'jackpot', multiplier: 10000, probability: 0.00025 },
    ],
  },
]

// ─── Helpers matemáticos ─────────────────────────────────────

/** Probabilidad total de ganar algo en una tirada (0-1) */
export function getWinProbability(machine: SlotMachineConfig): number {
  return machine.paytable.reduce((acc, rule) => acc + rule.probability, 0)
}

/** Retorno teórico al jugador (0-1) */
export function getRTP(machine: SlotMachineConfig): number {
  return machine.paytable.reduce((acc, rule) => acc + rule.probability * rule.multiplier, 0)
}

/** Premio máximo en fichas */
export function getMaxPayout(machine: SlotMachineConfig): number {
  const top = machine.paytable[machine.paytable.length - 1]
  return top ? top.multiplier * machine.cost : 0
}

/** Busca un símbolo por id dentro de una máquina */
export function getSymbol(machine: SlotMachineConfig, symbolId: string): SlotSymbol {
  return machine.symbols.find((s) => s.id === symbolId) ?? machine.symbols[0]
}

/** "1 de cada N" tiradas, útil para mostrar en la UI */
export function oneIn(probability: number): number {
  return probability > 0 ? Math.round(1 / probability) : Infinity
}
