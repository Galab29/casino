import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type {
  BaccaratBetType,
  BaccaratCard,
  BaccaratHand,
  BaccaratRoundResult,
  BaccaratStats,
  BaccaratWinningBet,
} from '~/types/baccarat'
import {
  BACCARAT_PAYOUTS,
  BACCARAT_PAYOUT_LABELS,
  buildShoe,
  calculateBaccaratScore,
  checkPair,
  shouldPlayerDraw,
  shouldBankerDraw,
} from '~/constants/baccarat'
import { useBlackjackStore } from '~/stores/blackjack'
import { useCasinoBridge } from '~/composables/useCasinoBridge'

const STATS_STORAGE_KEY = 'baccarat_game_stats_v1'
const HISTORY_LIMIT = 36
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

export const useBaccaratStore = defineStore('baccarat', () => {
  // ─── Billetera Compartida ──────────────────────────────────
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

  // ─── Apuestas en la mesa ───────────────────────────────────
  const bets = ref<Record<BaccaratBetType, number>>({
    player: 0,
    banker: 0,
    tie: 0,
    player_pair: 0,
    banker_pair: 0,
  })

  const betHistory = ref<{ type: BaccaratBetType; amount: number }[]>([])
  const lastPlacedBets = ref<Record<BaccaratBetType, number> | null>(null)

  const totalBet = computed(() => {
    return Object.values(bets.value).reduce((sum, a) => sum + a, 0)
  })

  // ─── Estado de la Ronda ────────────────────────────────────
  const status = ref<'betting' | 'dealing' | 'result'>('betting')
  const isDealing = computed(() => status.value === 'dealing')
  const canDeal = computed(() => !isDealing.value && totalBet.value > 0)

  const shoe = ref<BaccaratCard[]>(buildShoe())

  const playerHand = ref<BaccaratHand>({
    cards: [],
    score: 0,
    isNatural: false,
    hasPair: false,
  })

  const bankerHand = ref<BaccaratHand>({
    cards: [],
    score: 0,
    isNatural: false,
    hasPair: false,
  })

  const lastOutcome = ref<BaccaratRoundResult | null>(null)

  // ─── Estadísticas ──────────────────────────────────────────
  const stats = ref<BaccaratStats>({
    rounds: 0,
    playerWins: 0,
    bankerWins: 0,
    ties: 0,
    totalBet: 0,
    totalWon: 0,
    biggestWin: 0,
  })

  const history = ref<BaccaratRoundResult[]>([])
  let roundCounter = 0

  function loadStats() {
    if (typeof window === 'undefined') return
    try {
      const raw = localStorage.getItem(STATS_STORAGE_KEY)
      if (raw) {
        const p = JSON.parse(raw)
        stats.value = {
          rounds: Number(p.rounds) || 0,
          playerWins: Number(p.playerWins) || 0,
          bankerWins: Number(p.bankerWins) || 0,
          ties: Number(p.ties) || 0,
          totalBet: Number(p.totalBet) || 0,
          totalWon: Number(p.totalWon) || 0,
          biggestWin: Number(p.biggestWin) || 0,
        }
      }
    } catch (e) {
      console.error('Error loading baccarat stats:', e)
    }
  }

  function saveStats() {
    if (typeof window === 'undefined') return
    try {
      localStorage.setItem(STATS_STORAGE_KEY, JSON.stringify(stats.value))
    } catch (e) {
      console.error('Error saving baccarat stats:', e)
    }
  }

  function resetStats() {
    stats.value = {
      rounds: 0,
      playerWins: 0,
      bankerWins: 0,
      ties: 0,
      totalBet: 0,
      totalWon: 0,
      biggestWin: 0,
    }
    history.value = []
    saveStats()
  }

  loadStats()

  // ─── Acciones de Apuesta ───────────────────────────────────

  function placeBet(type: BaccaratBetType) {
    if (isDealing.value) return false
    const amount = selectedChip.value
    if (chips.value < amount) return false

    setChips(chips.value - amount)
    bets.value[type] += amount
    betHistory.value.push({ type, amount })
    return true
  }

  function undoBet() {
    if (isDealing.value || betHistory.value.length === 0) return
    const last = betHistory.value.pop()
    if (!last) return

    setChips(chips.value + last.amount)
    bets.value[last.type] = Math.max(0, bets.value[last.type] - last.amount)
  }

  function clearBets() {
    if (isDealing.value) return
    if (totalBet.value > 0) {
      setChips(chips.value + totalBet.value)
    }
    bets.value = {
      player: 0,
      banker: 0,
      tie: 0,
      player_pair: 0,
      banker_pair: 0,
    }
    betHistory.value = []
  }

  function doubleBets() {
    if (isDealing.value || totalBet.value === 0) return
    const current = totalBet.value
    if (chips.value < current) return

    setChips(chips.value - current)
    for (const key of Object.keys(bets.value) as BaccaratBetType[]) {
      bets.value[key] *= 2
    }
  }

  function rebet() {
    if (isDealing.value || !lastPlacedBets.value) return
    const needed = Object.values(lastPlacedBets.value).reduce((s, a) => s + a, 0)
    if (chips.value < needed) return

    clearBets()
    setChips(chips.value - needed)
    bets.value = { ...lastPlacedBets.value }
  }

  // ─── Mecánica del Reparto (Punto Banco Oficial) ────────────

  function drawCard(hidden = false): BaccaratCard {
    if (shoe.value.length < 16) {
      shoe.value = buildShoe()
    }
    const card = { ...shoe.value.pop()!, hidden }
    return card
  }

  async function dealRound() {
    if (!canDeal.value) return

    lastPlacedBets.value = { ...bets.value }
    status.value = 'dealing'
    lastOutcome.value = null

    // Resetear manos
    playerHand.value = { cards: [], score: 0, isNatural: false, hasPair: false }
    bankerHand.value = { cards: [], score: 0, isNatural: false, hasPair: false }

    // 1. Carta 1 Jugador
    await sleep(250)
    const p1 = drawCard()
    playerHand.value.cards.push(p1)
    playerHand.value.score = calculateBaccaratScore(playerHand.value.cards)

    // 2. Carta 1 Banco
    await sleep(250)
    const b1 = drawCard()
    bankerHand.value.cards.push(b1)
    bankerHand.value.score = calculateBaccaratScore(bankerHand.value.cards)

    // 3. Carta 2 Jugador
    await sleep(250)
    const p2 = drawCard()
    playerHand.value.cards.push(p2)
    playerHand.value.score = calculateBaccaratScore(playerHand.value.cards)
    playerHand.value.hasPair = checkPair(playerHand.value.cards)

    // 4. Carta 2 Banco
    await sleep(250)
    const b2 = drawCard()
    bankerHand.value.cards.push(b2)
    bankerHand.value.score = calculateBaccaratScore(bankerHand.value.cards)
    bankerHand.value.hasPair = checkPair(bankerHand.value.cards)

    // 5. Verificar "Naturales" (8 o 9)
    const pScore = playerHand.value.score
    const bScore = bankerHand.value.score

    if (pScore >= 8 || bScore >= 8) {
      playerHand.value.isNatural = pScore >= 8
      bankerHand.value.isNatural = bScore >= 8
      await sleep(400)
      finalizeRound()
      return
    }

    // 6. Regla de la 3ª Carta para el Jugador
    let playerThirdCardVal: number | null = null
    if (shouldPlayerDraw(pScore)) {
      await sleep(350)
      const p3 = drawCard()
      playerHand.value.cards.push(p3)
      playerHand.value.score = calculateBaccaratScore(playerHand.value.cards)
      playerThirdCardVal = p3.baccaratValue
    }

    // 7. Regla de la 3ª Carta para el Banco (Tableau)
    if (shouldBankerDraw(bScore, playerThirdCardVal)) {
      await sleep(350)
      const b3 = drawCard()
      bankerHand.value.cards.push(b3)
      bankerHand.value.score = calculateBaccaratScore(bankerHand.value.cards)
    }

    await sleep(400)
    finalizeRound()
  }

  function finalizeRound() {
    const finalP = playerHand.value.score
    const finalB = bankerHand.value.score

    let winner: 'player' | 'banker' | 'tie' = 'tie'
    if (finalP > finalB) winner = 'player'
    else if (finalB > finalP) winner = 'banker'

    const winningBets: BaccaratWinningBet[] = []
    let totalWon = 0

    // Apuesta Jugador
    if (bets.value.player > 0) {
      if (winner === 'player') {
        const mult = BACCARAT_PAYOUTS.player
        const payout = bets.value.player * mult
        totalWon += payout
        winningBets.push({
          type: 'player',
          label: 'Victoria del Jugador',
          betAmount: bets.value.player,
          multiplier: mult,
          payout,
          profit: payout - bets.value.player,
        })
      } else if (winner === 'tie') {
        // En empate, la apuesta al Jugador se reembolsa íntegra (Push)
        totalWon += bets.value.player
        winningBets.push({
          type: 'player',
          label: 'Jugador (Push / Empate)',
          betAmount: bets.value.player,
          multiplier: 1,
          payout: bets.value.player,
          profit: 0,
        })
      }
    }

    // Apuesta Banco
    if (bets.value.banker > 0) {
      if (winner === 'banker') {
        const mult = BACCARAT_PAYOUTS.banker
        const payout = Math.floor(bets.value.banker * mult)
        totalWon += payout
        winningBets.push({
          type: 'banker',
          label: 'Victoria del Banco (Comisión 5%)',
          betAmount: bets.value.banker,
          multiplier: mult,
          payout,
          profit: payout - bets.value.banker,
        })
      } else if (winner === 'tie') {
        // En empate, la apuesta al Banco se reembolsa íntegra (Push)
        totalWon += bets.value.banker
        winningBets.push({
          type: 'banker',
          label: 'Banco (Push / Empate)',
          betAmount: bets.value.banker,
          multiplier: 1,
          payout: bets.value.banker,
          profit: 0,
        })
      }
    }

    // Apuesta Empate (8:1)
    if (bets.value.tie > 0 && winner === 'tie') {
      const mult = BACCARAT_PAYOUTS.tie
      const payout = bets.value.tie * mult
      totalWon += payout
      winningBets.push({
        type: 'tie',
        label: 'Empate (Paga 8 a 1)',
        betAmount: bets.value.tie,
        multiplier: mult,
        payout,
        profit: payout - bets.value.tie,
      })
    }

    // Apuesta Par Jugador (11:1)
    if (bets.value.player_pair > 0 && playerHand.value.hasPair) {
      const mult = BACCARAT_PAYOUTS.player_pair
      const payout = bets.value.player_pair * mult
      totalWon += payout
      winningBets.push({
        type: 'player_pair',
        label: 'Pareja del Jugador (Paga 11 a 1)',
        betAmount: bets.value.player_pair,
        multiplier: mult,
        payout,
        profit: payout - bets.value.player_pair,
      })
    }

    // Apuesta Par Banco (11:1)
    if (bets.value.banker_pair > 0 && bankerHand.value.hasPair) {
      const mult = BACCARAT_PAYOUTS.banker_pair
      const payout = bets.value.banker_pair * mult
      totalWon += payout
      winningBets.push({
        type: 'banker_pair',
        label: 'Pareja del Banco (Paga 11 a 1)',
        betAmount: bets.value.banker_pair,
        multiplier: mult,
        payout,
        profit: payout - bets.value.banker_pair,
      })
    }

    // Acreditar fichas a la billetera central
    if (totalWon > 0) {
      setChips(chips.value + totalWon)
    }

    // Estadísticas
    stats.value.rounds++
    stats.value.totalBet += totalBet.value
    if (winner === 'player') stats.value.playerWins++
    else if (winner === 'banker') stats.value.bankerWins++
    else stats.value.ties++

    if (totalWon > 0) {
      stats.value.totalWon += totalWon
      stats.value.biggestWin = Math.max(stats.value.biggestWin, totalWon)
    }

    const outcome: BaccaratRoundResult = {
      id: ++roundCounter,
      winner,
      playerScore: finalP,
      bankerScore: finalB,
      playerHand: [...playerHand.value.cards],
      bankerHand: [...bankerHand.value.cards],
      playerPair: playerHand.value.hasPair,
      bankerPair: bankerHand.value.hasPair,
      isNatural: playerHand.value.isNatural || bankerHand.value.isNatural,
      totalBet: totalBet.value,
      totalWon,
      netProfit: totalWon - totalBet.value,
      winningBets,
      timestamp: Date.now(),
    }

    history.value.unshift(outcome)
    if (history.value.length > HISTORY_LIMIT) {
      history.value.splice(HISTORY_LIMIT)
    }

    lastOutcome.value = outcome
    // Limpiar apuestas para la próxima mano
    bets.value = {
      player: 0,
      banker: 0,
      tie: 0,
      player_pair: 0,
      banker_pair: 0,
    }
    betHistory.value = []
    status.value = 'result'

    saveStats()

    useCasinoBridge().reportRound({
      game: 'baccarat',
      bet: outcome.totalBet,
      payout: outcome.totalWon,
      isJackpot: outcome.isNatural && outcome.totalWon > outcome.totalBet * 2,
    })
  }

  function resetRound() {
    if (isDealing.value) return
    status.value = 'betting'
    lastOutcome.value = null
  }

  return {
    // state
    selectedChip,
    bets,
    status,
    playerHand,
    bankerHand,
    lastOutcome,
    stats,
    history,
    lastPlacedBets,
    shoe,
    // computed
    chips,
    totalBet,
    isDealing,
    canDeal,
    // actions
    setChips,
    refillChips,
    selectChip,
    placeBet,
    undoBet,
    clearBets,
    doubleBets,
    rebet,
    dealRound,
    resetRound,
    resetStats,
  }
})
