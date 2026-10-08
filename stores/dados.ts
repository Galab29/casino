import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type {
  DadosBetType,
  CrapsPhase,
  DadosWinningBet,
  RollResult,
  DadosStats,
} from '~/types/dados'
import {
  DADOS_BET_DEFINITIONS,
  VALID_POINTS,
  getRollNickname,
  type ValidPoint,
} from '~/constants/dados'
import { useBlackjackStore } from '~/stores/blackjack'
import { useCasinoBridge } from '~/composables/useCasinoBridge'

const STATS_STORAGE_KEY = 'craps_dados_stats_v1'
const HISTORY_LIMIT = 40

export const useDadosStore = defineStore('dados', () => {
  // ─── Billetera Compartida del Casino ──────────────────────────
  const wallet = useBlackjackStore()
  const chips = computed(() => wallet.player.chips)

  function setChips(val: number) {
    wallet.setChips(val)
  }

  function refillChips() {
    wallet.refillChips(1000)
  }

  // ─── Ficha Seleccionada ──────────────────────────────────────
  const selectedChip = ref<number>(25)

  function selectChip(val: number) {
    selectedChip.value = val
  }

  // ─── Estado de la Mesa de Craps ──────────────────────────────
  const phase = ref<CrapsPhase>('come_out')
  const point = ref<number | null>(null)
  const status = ref<'betting' | 'rolling' | 'result'>('betting')
  const isRolling = computed(() => status.value === 'rolling')

  // Valores de los dados actuales
  const dice = ref<[number, number]>([3, 4])
  const diceTotal = computed(() => dice.value[0] + dice.value[1])

  // ─── Apuestas en la Mesa ─────────────────────────────────────
  const bets = ref<Record<DadosBetType, number>>({
    pass_line: 0,
    dont_pass: 0,
    field: 0,
    place_4: 0,
    place_5: 0,
    place_6: 0,
    place_8: 0,
    place_9: 0,
    place_10: 0,
    hard_4: 0,
    hard_6: 0,
    hard_8: 0,
    hard_10: 0,
    any_7: 0,
    any_craps: 0,
    craps_2: 0,
    craps_12: 0,
    craps_3: 0,
    eleven: 0,
    under_7: 0,
    over_7: 0,
  })

  // Historial de cambios de apuesta para Deshacer
  const betHistory = ref<{ type: DadosBetType; amount: number }[]>([])
  // Últimas apuestas colocadas para Repetir (Rebet)
  const lastPlacedBets = ref<Record<DadosBetType, number> | null>(null)

  const totalBet = computed(() => {
    return Object.values(bets.value).reduce((sum, amt) => sum + (amt || 0), 0)
  })

  // Se puede tirar si hay apuestas o si estamos en ronda de punto (el jugador ya tiene apuestas retenidas)
  const canRoll = computed(() => {
    if (isRolling.value) return false
    return totalBet.value > 0
  })

  // ─── Estadísticas e Historial ─────────────────────────────────
  const stats = ref<DadosStats>({
    totalRolls: 0,
    comeOutRolls: 0,
    pointsEstablished: 0,
    pointsHit: 0,
    sevenOuts: 0,
    totalBet: 0,
    totalWon: 0,
    biggestWin: 0,
    numberFrequency: {
      2: 0,
      3: 0,
      4: 0,
      5: 0,
      6: 0,
      7: 0,
      8: 0,
      9: 0,
      10: 0,
      11: 0,
      12: 0,
    },
  })

  const history = ref<RollResult[]>([])
  const lastRollResult = ref<RollResult | null>(null)
  let rollCounter = 0

  function loadStats() {
    if (import.meta.client) {
      try {
        const raw = localStorage.getItem(STATS_STORAGE_KEY)
        if (raw) {
          const parsed = JSON.parse(raw)
          stats.value = {
            ...stats.value,
            ...parsed,
            numberFrequency: {
              ...stats.value.numberFrequency,
              ...(parsed.numberFrequency || {}),
            },
          }
        }
      } catch (err) {
        console.warn('Error loading craps stats:', err)
      }
    }
  }

  function saveStats() {
    if (import.meta.client) {
      try {
        localStorage.setItem(STATS_STORAGE_KEY, JSON.stringify(stats.value))
      } catch (err) {
        console.warn('Error saving craps stats:', err)
      }
    }
  }

  function resetStats() {
    stats.value = {
      totalRolls: 0,
      comeOutRolls: 0,
      pointsEstablished: 0,
      pointsHit: 0,
      sevenOuts: 0,
      totalBet: 0,
      totalWon: 0,
      biggestWin: 0,
      numberFrequency: {
        2: 0,
        3: 0,
        4: 0,
        5: 0,
        6: 0,
        7: 0,
        8: 0,
        9: 0,
        10: 0,
        11: 0,
        12: 0,
      },
    }
    history.value = []
    lastRollResult.value = null
    saveStats()
  }

  // ─── Gestión de Apuestas ──────────────────────────────────────
  function placeBet(type: DadosBetType, customAmount?: number): boolean {
    if (isRolling.value) return false

    // Regla de Craps: Pass Line y Don't Pass sólo se pueden colocar en Come Out
    if ((type === 'pass_line' || type === 'dont_pass') && phase.value === 'point') {
      return false
    }

    const amount = customAmount ?? selectedChip.value
    if (chips.value < amount) return false

    // Deducir del monedero del jugador
    setChips(chips.value - amount)
    bets.value[type] = (bets.value[type] || 0) + amount
    betHistory.value.push({ type, amount })
    return true
  }

  function undoLastBet(): boolean {
    if (isRolling.value || betHistory.value.length === 0) return false
    const last = betHistory.value.pop()
    if (!last) return false

    // Reembolsar al monedero
    bets.value[last.type] = Math.max(0, (bets.value[last.type] || 0) - last.amount)
    setChips(chips.value + last.amount)
    return true
  }

  function clearBets(): boolean {
    if (isRolling.value) return false

    // En craps tradicional, si hay un punto activo, las apuestas de línea (pass_line y dont_pass)
    // están comprometidas en el contrato, pero se permite retirar apuestas de proposición/place/field.
    // Si estamos en come_out, se reembolsa todo. Si estamos en point, reembolsamos todo excepto pass_line/dont_pass si se prefiere,
    // o para mayor flexibilidad del jugador, reembolsamos todas las apuestas no comprometidas.
    let refunded = 0
    const keys = Object.keys(bets.value) as DadosBetType[]

    for (const key of keys) {
      if (phase.value === 'point' && (key === 'pass_line' || key === 'dont_pass')) {
        // En punto la línea está activa
        continue
      }
      const amt = bets.value[key] || 0
      if (amt > 0) {
        refunded += amt
        bets.value[key] = 0
      }
    }

    setChips(chips.value + refunded)
    betHistory.value = betHistory.value.filter(
      (b) => phase.value === 'point' && (b.type === 'pass_line' || b.type === 'dont_pass')
    )
    return true
  }

  function doubleBets(): boolean {
    if (isRolling.value) return false
    const currentTotal = totalBet.value
    if (currentTotal === 0 || chips.value < currentTotal) return false

    const keys = Object.keys(bets.value) as DadosBetType[]
    for (const key of keys) {
      const amt = bets.value[key] || 0
      if (amt > 0) {
        bets.value[key] = amt * 2
        betHistory.value.push({ type: key, amount: amt })
      }
    }
    setChips(chips.value - currentTotal)
    return true
  }

  function rebet(): boolean {
    if (isRolling.value || !lastPlacedBets.value) return false
    const needed = Object.values(lastPlacedBets.value).reduce((s, a) => s + (a || 0), 0)
    if (needed === 0 || chips.value < needed) return false

    clearBets()
    const keys = Object.keys(lastPlacedBets.value) as DadosBetType[]
    for (const key of keys) {
      const amt = lastPlacedBets.value[key] || 0
      if (amt > 0) {
        bets.value[key] = amt
        betHistory.value.push({ type: key, amount: amt })
      }
    }
    setChips(chips.value - needed)
    return true
  }

  // ─── Lanzamiento de Dados (Roll Engine) ───────────────────────
  function startRoll() {
    if (!canRoll.value || isRolling.value) return
    status.value = 'rolling'

    // Guardar snapshot de apuestas colocadas
    lastPlacedBets.value = { ...bets.value }
  }

  function resolveRoll(d1: number, d2: number): RollResult {
    dice.value = [d1, d2]
    const sum = d1 + d2
    const isHardway = d1 === d2
    const pointBefore = point.value
    const phaseBefore = phase.value

    let pointAfter = pointBefore
    let phaseAfter = phaseBefore
    let event: RollResult['event'] = 'regular_roll'
    let eventLabel = getRollNickname(d1, d2)

    const winningBets: DadosWinningBet[] = []
    const losingBets: RollResult['losingBets'] = []

    let totalRoundBet = 0
    let totalWon = 0

    // ── 1. Evaluar Lógica de Fase de Craps (Come Out vs Point) ──
    if (phaseBefore === 'come_out') {
      stats.value.comeOutRolls++
      if (sum === 7 || sum === 11) {
        event = 'natural_win'
        eventLabel = `¡Natural ${sum}! ¡Pass Line Gana!`
      } else if (sum === 2 || sum === 3 || sum === 12) {
        event = 'craps_loss'
        eventLabel = sum === 12 ? '¡Craps 12! (Bar 12)' : `¡Craps ${sum}!`
      } else if (VALID_POINTS.includes(sum as ValidPoint)) {
        event = 'point_established'
        pointAfter = sum
        phaseAfter = 'point'
        eventLabel = `¡Punto Establecido en ${sum}!`
        stats.value.pointsEstablished++
      }
    } else {
      // Estamos en Fase de Punto
      if (sum === pointBefore) {
        event = 'point_hit'
        eventLabel = `¡Punto ${sum} Alcanzado! ¡Pass Line Gana!`
        pointAfter = null
        phaseAfter = 'come_out'
        stats.value.pointsHit++
      } else if (sum === 7) {
        event = 'seven_out'
        eventLabel = '¡Seven Out! Fin de ronda de Punto'
        pointAfter = null
        phaseAfter = 'come_out'
        stats.value.sevenOuts++
      } else {
        event = 'regular_roll'
      }
    }

    // ── 2. Resolver cada tipo de apuesta activa ──
    const currentBets = { ...bets.value }

    // Helper para registrar victoria
    const winBet = (type: DadosBetType, multProfit: number) => {
      const amt = currentBets[type]
      if (amt <= 0) return
      totalRoundBet += amt
      const profit = Math.round(amt * multProfit)
      const wonAmount = amt + profit
      totalWon += wonAmount
      winningBets.push({
        type,
        label: DADOS_BET_DEFINITIONS[type].name,
        betAmount: amt,
        payoutMultiplier: multProfit,
        wonAmount,
        profit,
      })
      bets.value[type] = 0 // Cobrado
    }

    // Helper para registrar pérdida
    const loseBet = (type: DadosBetType) => {
      const amt = currentBets[type]
      if (amt <= 0) return
      totalRoundBet += amt
      losingBets.push({
        type,
        label: DADOS_BET_DEFINITIONS[type].name,
        amount: amt,
      })
      bets.value[type] = 0 // Perdido
    }

    // Helper para empate / push (Bar 12)
    const pushBet = (type: DadosBetType) => {
      const amt = currentBets[type]
      if (amt <= 0) return
      totalRoundBet += amt
      totalWon += amt
      winningBets.push({
        type,
        label: `${DADOS_BET_DEFINITIONS[type].name} (Empate)`,
        betAmount: amt,
        payoutMultiplier: 0,
        wonAmount: amt,
        profit: 0,
      })
      bets.value[type] = 0
    }

    // A) PASS LINE
    if (currentBets.pass_line > 0) {
      if (phaseBefore === 'come_out') {
        if (sum === 7 || sum === 11) {
          winBet('pass_line', 1.0)
        } else if (sum === 2 || sum === 3 || sum === 12) {
          loseBet('pass_line')
        } else {
          // El punto se fijó; la apuesta permanece en la mesa
          totalRoundBet += currentBets.pass_line
        }
      } else {
        // En punto
        if (sum === pointBefore) {
          winBet('pass_line', 1.0)
        } else if (sum === 7) {
          loseBet('pass_line')
        } else {
          totalRoundBet += currentBets.pass_line
        }
      }
    }

    // B) DON'T PASS
    if (currentBets.dont_pass > 0) {
      if (phaseBefore === 'come_out') {
        if (sum === 2 || sum === 3) {
          winBet('dont_pass', 1.0)
        } else if (sum === 12) {
          pushBet('dont_pass')
        } else if (sum === 7 || sum === 11) {
          loseBet('dont_pass')
        } else {
          // Punto fijado; la apuesta permanece
          totalRoundBet += currentBets.dont_pass
        }
      } else {
        // En punto
        if (sum === 7) {
          winBet('dont_pass', 1.0)
        } else if (sum === pointBefore) {
          loseBet('dont_pass')
        } else {
          totalRoundBet += currentBets.dont_pass
        }
      }
    }

    // C) FIELD (Apuesta de 1 tirada)
    if (currentBets.field > 0) {
      if (sum === 2) {
        winBet('field', 2.0) // 2 paga doble
      } else if (sum === 12) {
        winBet('field', 3.0) // 12 paga triple
      } else if ([3, 4, 9, 10, 11].includes(sum)) {
        winBet('field', 1.0) // 1:1
      } else {
        loseBet('field') // 5, 6, 7, 8 pierden
      }
    }

    // D) APUESTAS DE SITIO (Place Bets: 4, 5, 6, 8, 9, 10)
    const placeMap: Record<number, DadosBetType> = {
      4: 'place_4',
      5: 'place_5',
      6: 'place_6',
      8: 'place_8',
      9: 'place_9',
      10: 'place_10',
    }

    if (sum === 7) {
      // En seven out, todas las place bets se pierden
      Object.values(placeMap).forEach((pType) => {
        if (currentBets[pType] > 0) loseBet(pType)
      })
    } else if (placeMap[sum] && currentBets[placeMap[sum]] > 0) {
      const pType = placeMap[sum]
      let mult = 1.0
      if (sum === 4 || sum === 10) mult = 9 / 5 // 1.8
      else if (sum === 5 || sum === 9) mult = 7 / 5 // 1.4
      else if (sum === 6 || sum === 8) mult = 7 / 6 // 1.1667

      winBet(pType, mult)
    } else {
      // Las demás place bets permanecen en mesa
      Object.values(placeMap).forEach((pType) => {
        if (currentBets[pType] > 0) totalRoundBet += currentBets[pType]
      })
    }

    // E) HARDWAYS (Hard 4, 6, 8, 10)
    const hardways: { num: number; type: DadosBetType; mult: number }[] = [
      { num: 4, type: 'hard_4', mult: 7.0 },
      { num: 6, type: 'hard_6', mult: 9.0 },
      { num: 8, type: 'hard_8', mult: 9.0 },
      { num: 10, type: 'hard_10', mult: 7.0 },
    ]

    for (const hw of hardways) {
      if (currentBets[hw.type] > 0) {
        if (sum === 7) {
          loseBet(hw.type)
        } else if (sum === hw.num) {
          if (isHardway) {
            winBet(hw.type, hw.mult)
          } else {
            loseBet(hw.type) // Cayó "fácil" (soft), pierde
          }
        } else {
          // Permanece en mesa
          totalRoundBet += currentBets[hw.type]
        }
      }
    }

    // F) PROPOSICIONES / ONE-ROLL BETS (Resueltas cada tirada)
    // Any 7
    if (currentBets.any_7 > 0) {
      if (sum === 7) winBet('any_7', 4.0)
      else loseBet('any_7')
    }

    // Any Craps
    if (currentBets.any_craps > 0) {
      if (sum === 2 || sum === 3 || sum === 12) winBet('any_craps', 7.0)
      else loseBet('any_craps')
    }

    // Snake Eyes (2 = 1+1)
    if (currentBets.craps_2 > 0) {
      if (d1 === 1 && d2 === 1) winBet('craps_2', 30.0)
      else loseBet('craps_2')
    }

    // Boxcars (12 = 6+6)
    if (currentBets.craps_12 > 0) {
      if (d1 === 6 && d2 === 6) winBet('craps_12', 30.0)
      else loseBet('craps_12')
    }

    // Ace-Deuce (3)
    if (currentBets.craps_3 > 0) {
      if (sum === 3) winBet('craps_3', 15.0)
      else loseBet('craps_3')
    }

    // Yo-Eleven (11)
    if (currentBets.eleven > 0) {
      if (sum === 11) winBet('eleven', 15.0)
      else loseBet('eleven')
    }

    // Under 7
    if (currentBets.under_7 > 0) {
      if (sum < 7) winBet('under_7', 1.0)
      else loseBet('under_7')
    }

    // Over 7
    if (currentBets.over_7 > 0) {
      if (sum > 7) winBet('over_7', 1.0)
      else loseBet('over_7')
    }

    // ── 3. Aplicar Ganancias al Monedero ──
    if (totalWon > 0) {
      setChips(chips.value + totalWon)
    }

    // ── 4. Actualizar Estado ──
    point.value = pointAfter
    phase.value = phaseAfter
    status.value = 'result'

    // Actualizar Estadísticas
    rollCounter++
    stats.value.totalRolls++
    stats.value.totalBet += totalRoundBet
    stats.value.totalWon += totalWon
    if (totalWon > stats.value.biggestWin) {
      stats.value.biggestWin = totalWon
    }
    stats.value.numberFrequency[sum] = (stats.value.numberFrequency[sum] || 0) + 1

    const netProfit = totalWon - totalRoundBet
    const outcome: RollResult = {
      id: rollCounter,
      die1: d1,
      die2: d2,
      total: sum,
      isHardway,
      phase: phaseBefore,
      pointBefore,
      pointAfter,
      event,
      eventLabel,
      totalBet: totalRoundBet,
      totalWon,
      netProfit,
      winningBets,
      losingBets,
      timestamp: Date.now(),
    }

    lastRollResult.value = outcome
    history.value.unshift(outcome)
    if (history.value.length > HISTORY_LIMIT) {
      history.value.pop()
    }

    saveStats()

    useCasinoBridge().reportRound({
      game: 'dados',
      bet: outcome.totalBet,
      payout: outcome.totalWon,
      isJackpot: outcome.winningBets.some((w) => w.payoutMultiplier >= 30),
    })

    return outcome
  }

  function resetRound() {
    status.value = 'betting'
  }

  // Cargar estadísticas guardadas al inicializar
  loadStats()

  return {
    // Wallet
    chips,
    refillChips,
    setChips,

    // Controls
    selectedChip,
    selectChip,

    // Craps State
    phase,
    point,
    status,
    isRolling,
    canRoll,
    dice,
    diceTotal,

    // Bets
    bets,
    totalBet,
    lastPlacedBets,
    placeBet,
    undoLastBet,
    clearBets,
    doubleBets,
    rebet,

    // Roll
    startRoll,
    resolveRoll,
    resetRound,

    // Stats & History
    stats,
    history,
    lastRollResult,
    resetStats,
  }
})
