import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type {
  RouletteBet,
  BetType,
  SpinResult,
  RuletaStats,
  WinningBetDetail,
} from '~/types/ruleta'
import {
  getNumberInfo,
  isWinningBet,
  PAYOUT_MULTIPLIERS,
  CHIP_OPTIONS,
} from '~/constants/ruleta'
import { useBlackjackStore } from '~/stores/blackjack'

const STATS_STORAGE_KEY = 'ruleta_game_stats_v1'
const HISTORY_LIMIT = 15

export const useRuletaStore = defineStore('ruleta', () => {
  // ─── Billetera compartida centralizada ─────────────────────
  const wallet = useBlackjackStore()

  const chips = computed(() => wallet.player.chips)

  function setChips(value: number) {
    wallet.setChips(value)
  }

  function refillChips() {
    wallet.refillChips(1000)
  }

  // ─── Ficha seleccionada ────────────────────────────────────
  const selectedChip = ref<number>(25)

  function selectChip(val: number) {
    selectedChip.value = val
  }

  // ─── Apuestas activas en el tapete ─────────────────────────
  const bets = ref<Record<string, RouletteBet>>({})
  const betHistory = ref<{ id: string; amount: number }[]>([])
  const lastPlacedBets = ref<RouletteBet[]>([])

  const totalBet = computed(() => {
    return Object.values(bets.value).reduce((sum, b) => sum + b.amount, 0)
  })

  const betList = computed(() => Object.values(bets.value))

  // ─── Estado del juego ──────────────────────────────────────
  const status = ref<'betting' | 'spinning' | 'result'>('betting')
  const winningNumber = ref<number | null>(null)
  const pendingOutcome = ref<SpinResult | null>(null)
  const lastOutcome = ref<SpinResult | null>(null)

  const isSpinning = computed(() => status.value === 'spinning')
  const canSpin = computed(() => !isSpinning.value && totalBet.value > 0)
  const canAffordChip = computed(() => chips.value >= selectedChip.value)

  // ─── Estadísticas e Historial ──────────────────────────────
  const stats = ref<RuletaStats>({
    spins: 0,
    wins: 0,
    totalBet: 0,
    totalWon: 0,
    biggestWin: 0,
  })

  const history = ref<SpinResult[]>([])
  let spinCounter = 0

  function loadStats() {
    if (typeof window === 'undefined') return
    try {
      const raw = localStorage.getItem(STATS_STORAGE_KEY)
      if (raw) {
        const parsed = JSON.parse(raw)
        stats.value = {
          spins: Number(parsed.spins) || 0,
          wins: Number(parsed.wins) || 0,
          totalBet: Number(parsed.totalBet) || 0,
          totalWon: Number(parsed.totalWon) || 0,
          biggestWin: Number(parsed.biggestWin) || 0,
        }
      }
    } catch (e) {
      console.error('Error loading ruleta stats:', e)
    }
  }

  function saveStats() {
    if (typeof window === 'undefined') return
    try {
      localStorage.setItem(STATS_STORAGE_KEY, JSON.stringify(stats.value))
    } catch (e) {
      console.error('Error saving ruleta stats:', e)
    }
  }

  function resetStats() {
    stats.value = {
      spins: 0,
      wins: 0,
      totalBet: 0,
      totalWon: 0,
      biggestWin: 0,
    }
    history.value = []
    saveStats()
  }

  loadStats()

  // ─── Advertencias de reglas de casino ──────────────────────
  const ruleWarning = ref<string | null>(null)

  function clearRuleWarning() {
    ruleWarning.value = null
  }

  /**
   * Verifica las reglas oficiales de casino para apuestas en la ruleta:
   * 1. No se permiten apuestas opuestas de suerte sencilla (Rojo y Negro, Par e Impar, Falta y Pasa).
   * 2. No se permite cubrir todas las docenas (1ª, 2ª y 3ª) simultáneamente (arbitraje sin riesgo).
   * 3. No se permite cubrir todas las columnas (1ª, 2ª y 3ª) simultáneamente (arbitraje sin riesgo).
   */
  function checkCasinoBetRules(type: BetType, target: string | number): { allowed: boolean; reason?: string } {
    const id = `${type}-${target}`
    // Si ya existe apuesta en esta casilla, siempre se puede aumentar
    if (bets.value[id]) return { allowed: true }

    // 1. Suertes Sencillas Opuestas
    if (type === 'color') {
      if (target === 'red' && bets.value['color-black']) {
        return { allowed: false, reason: 'Regla de casino: No se permite apostar a Rojo y Negro simultáneamente.' }
      }
      if (target === 'black' && bets.value['color-red']) {
        return { allowed: false, reason: 'Regla de casino: No se permite apostar a Rojo y Negro simultáneamente.' }
      }
    }

    if (type === 'parity') {
      if (target === 'even' && bets.value['parity-odd']) {
        return { allowed: false, reason: 'Regla de casino: No se permite apostar a Par e Impar simultáneamente.' }
      }
      if (target === 'odd' && bets.value['parity-even']) {
        return { allowed: false, reason: 'Regla de casino: No se permite apostar a Par e Impar simultáneamente.' }
      }
    }

    if (type === 'range') {
      if (target === 'low' && bets.value['range-high']) {
        return { allowed: false, reason: 'Regla de casino: No se permite apostar a Falta (1-18) y Pasa (19-36) simultáneamente.' }
      }
      if (target === 'high' && bets.value['range-low']) {
        return { allowed: false, reason: 'Regla de casino: No se permite apostar a Falta (1-18) y Pasa (19-36) simultáneamente.' }
      }
    }

    // 2. Cobertura de las 3 docenas
    if (type === 'dozen') {
      const activeDozens = [1, 2, 3].filter((d) => bets.value[`dozen-${d}`] && d !== Number(target))
      if (activeDozens.length >= 2) {
        return { allowed: false, reason: 'Regla de casino: No se permite cubrir las 3 docenas al mismo tiempo.' }
      }
    }

    // 3. Cobertura de las 3 columnas
    if (type === 'column') {
      const activeCols = [1, 2, 3].filter((c) => bets.value[`column-${c}`] && c !== Number(target))
      if (activeCols.length >= 2) {
        return { allowed: false, reason: 'Regla de casino: No se permite cubrir las 3 columnas al mismo tiempo.' }
      }
    }

    return { allowed: true }
  }

  // ─── Acciones de apuestas ──────────────────────────────────

  /** Coloca o incrementa una apuesta en el tapete */
  function placeBet(type: BetType, target: string | number, label: string) {
    if (isSpinning.value) return false

    // Validar reglas oficiales de casino
    const ruleCheck = checkCasinoBetRules(type, target)
    if (!ruleCheck.allowed) {
      ruleWarning.value = ruleCheck.reason || null
      return false
    }
    ruleWarning.value = null

    const amount = selectedChip.value
    if (chips.value < amount) return false

    // Cobrar ficha de la billetera
    setChips(chips.value - amount)

    const id = `${type}-${target}`
    if (bets.value[id]) {
      bets.value[id].amount += amount
    } else {
      bets.value[id] = {
        id,
        type,
        target,
        amount,
        label,
      }
    }

    betHistory.value.push({ id, amount })
    return true
  }

  /** Deshace la última ficha colocada */
  function undoBet() {
    if (isSpinning.value || betHistory.value.length === 0) return
    const last = betHistory.value.pop()
    if (!last) return

    // Reembolsar ficha a la billetera
    setChips(chips.value + last.amount)

    const bet = bets.value[last.id]
    if (bet) {
      bet.amount -= last.amount
      if (bet.amount <= 0) {
        delete bets.value[last.id]
      }
    }
  }

  /** Limpia y reembolsa todas las apuestas colocadas antes de girar */
  function clearBets() {
    if (isSpinning.value) return
    if (totalBet.value > 0) {
      // Reembolso completo
      setChips(chips.value + totalBet.value)
    }
    bets.value = {}
    betHistory.value = []
  }

  /** Dobla el valor de todas las apuestas actuales en la mesa */
  function doubleBets() {
    if (isSpinning.value || totalBet.value === 0) return
    const currentTotal = totalBet.value
    if (chips.value < currentTotal) return // No alcanza el saldo

    setChips(chips.value - currentTotal)

    for (const key of Object.keys(bets.value)) {
      bets.value[key].amount *= 2
    }
    betHistory.value.push({ id: '__double__', amount: currentTotal })
  }

  /** Repite las apuestas de la última ronda finalizada */
  function rebet() {
    if (isSpinning.value || lastPlacedBets.value.length === 0) return
    const needed = lastPlacedBets.value.reduce((s, b) => s + b.amount, 0)
    if (chips.value < needed) return

    clearBets()

    setChips(chips.value - needed)
    for (const b of lastPlacedBets.value) {
      bets.value[b.id] = { ...b }
    }
  }

  // ─── Mecánica del giro ─────────────────────────────────────

  /**
   * Inicia el giro:
   * Determina el número ganador con RNG justo (0-36)
   * Calcula de antemano el desenlace y los pagos.
   */
  function spin(): { winningNum: number; outcome: SpinResult } | null {
    if (!canSpin.value) return null

    // Guardar para repetir ronda
    lastPlacedBets.value = Object.values(bets.value).map((b) => ({ ...b }))

    // Determinar número ganador (0 al 36)
    const winningNum = Math.floor(Math.random() * 37)
    winningNumber.value = winningNum

    const numInfo = getNumberInfo(winningNum)
    const currentBets = Object.values(bets.value)
    const winningBets: WinningBetDetail[] = []
    let totalWon = 0

    for (const bet of currentBets) {
      if (isWinningBet(bet, winningNum)) {
        const mult = PAYOUT_MULTIPLIERS[bet.type]
        const payout = bet.amount * mult
        const profit = payout - bet.amount
        totalWon += payout
        winningBets.push({
          bet,
          multiplier: mult,
          payout,
          profit,
        })
      }
    }

    const outcome: SpinResult = {
      id: ++spinCounter,
      number: winningNum,
      info: numInfo,
      totalBet: totalBet.value,
      totalWon,
      netProfit: totalWon - totalBet.value,
      winningBets,
      timestamp: Date.now(),
    }

    pendingOutcome.value = outcome
    lastOutcome.value = null
    status.value = 'spinning'

    return { winningNum, outcome }
  }

  /**
   * Se ejecuta cuando la rueda y la bola se detienen por completo.
   * Acredita las ganancias y registra el historial.
   */
  function resolveSpin() {
    const outcome = pendingOutcome.value
    if (!outcome || status.value !== 'spinning') return

    // Acreditar ganancias
    if (outcome.totalWon > 0) {
      setChips(chips.value + outcome.totalWon)
    }

    // Actualizar estadísticas
    stats.value.spins++
    stats.value.totalBet += outcome.totalBet
    if (outcome.totalWon > 0) {
      stats.value.wins++
      stats.value.totalWon += outcome.totalWon
      stats.value.biggestWin = Math.max(stats.value.biggestWin, outcome.totalWon)
    }

    // Historial
    history.value.unshift(outcome)
    if (history.value.length > HISTORY_LIMIT) {
      history.value.splice(HISTORY_LIMIT)
    }

    lastOutcome.value = outcome
    pendingOutcome.value = null
    bets.value = {}
    betHistory.value = []
    status.value = 'result'

    saveStats()
  }

  function resetRound() {
    if (isSpinning.value) return
    status.value = 'betting'
    lastOutcome.value = null
  }

  return {
    // state
    selectedChip,
    bets,
    status,
    winningNumber,
    lastOutcome,
    stats,
    history,
    lastPlacedBets,
    ruleWarning,
    // computed
    chips,
    totalBet,
    betList,
    isSpinning,
    canSpin,
    canAffordChip,
    // actions
    setChips,
    refillChips,
    selectChip,
    placeBet,
    undoBet,
    clearBets,
    clearRuleWarning,
    doubleBets,
    rebet,
    spin,
    resolveSpin,
    resetRound,
    resetStats,
  }
})
