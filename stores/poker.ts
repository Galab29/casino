import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useWalletStore } from '~/stores/wallet'
import { createStatsPersistence } from '~/services/stats.api'
import type { Card } from '~/types/blackjack'
import type {
  Street,
  PokerRoundResult,
  EvaluatedHand,
  DealerSpeech,
} from '~/types/poker'
import {
  createPokerDeck,
  getBestHand,
  compareEvaluatedHands,
  DEALER_QUOTES,
} from '~/constants/poker'

const LEGACY_STATS_KEY = 'poker_royal_stats_v1'

export const usePokerStore = defineStore('poker', () => {
  const wallet = useWalletStore()

  // ─── Stakes & Configuration ─────────────────────────────────────
  const smallBlind = ref<number>(25)
  const bigBlind = computed(() => smallBlind.value * 2)
  const dealerChips = ref<number>(5000)

  // ─── Game State ─────────────────────────────────────────────────
  const street = ref<Street>('idle')
  const deck = ref<Card[]>([])
  const communityCards = ref<Card[]>([])
  const pot = ref<number>(0)
  const currentBet = ref<number>(0) // current bet to match in current street
  const minRaise = ref<number>(50) // size of the last full raise (min raise increment)
  const dealerButton = ref<'player' | 'dealer'>('dealer') // alternates each hand
  const currentTurn = ref<'player' | 'dealer' | null>(null)
  const isDealerThinking = ref<boolean>(false)
  const roundResult = ref<PokerRoundResult | null>(null)

  // ─── Players ───────────────────────────────────────────────────
  const playerCards = ref<Card[]>([])
  const playerRoundBet = ref<number>(0)
  const playerTotalBet = ref<number>(0)
  const playerHasActed = ref<boolean>(false)
  const playerIsFolded = ref<boolean>(false)
  const playerIsAllIn = ref<boolean>(false)
  const playerLastAction = ref<string | null>(null)

  const dealerCards = ref<Card[]>([])
  const dealerRoundBet = ref<number>(0)
  const dealerTotalBet = ref<number>(0)
  const dealerHasActed = ref<boolean>(false)
  const dealerIsFolded = ref<boolean>(false)
  const dealerIsAllIn = ref<boolean>(false)
  const dealerLastAction = ref<string | null>(null)

  const dealerSpeech = ref<DealerSpeech | null>(null)

  // ─── Stats ─────────────────────────────────────────────────────
  const stats = ref({
    handsPlayed: 0,
    handsWon: 0,
    handsLost: 0,
    handsTied: 0,
    totalProfit: 0,
    biggestPotWon: 0,
  })

  const persistence = createStatsPersistence<typeof stats.value>({
    game: 'poker',
    legacyKey: LEGACY_STATS_KEY,
    getState: () => stats.value,
    applyState: (saved) => {
      stats.value = {
        handsPlayed: Number(saved?.handsPlayed) || 0,
        handsWon: Number(saved?.handsWon) || 0,
        handsLost: Number(saved?.handsLost) || 0,
        handsTied: Number(saved?.handsTied) || 0,
        totalProfit: Number(saved?.totalProfit) || 0,
        biggestPotWon: Number(saved?.biggestPotWon) || 0,
      }
    },
  })

  function loadStats() {
    return persistence.load()
  }

  function saveStats() {
    persistence.save()
  }

  function resetStats() {
    stats.value = {
      handsPlayed: 0,
      handsWon: 0,
      handsLost: 0,
      handsTied: 0,
      totalProfit: 0,
      biggestPotWon: 0,
    }
    persistence.reset()
  }

  loadStats()

  // ─── Timers (invalidated when a new hand starts / hand is abandoned) ──
  let handId = 0
  const pendingTimers = new Set<ReturnType<typeof setTimeout>>()

  function schedule(fn: () => void, ms: number) {
    const id = handId
    const t = setTimeout(() => {
      pendingTimers.delete(t)
      if (id !== handId) return // stale timer from a previous hand
      fn()
    }, ms)
    pendingTimers.add(t)
  }

  function clearTimers() {
    pendingTimers.forEach((t) => clearTimeout(t))
    pendingTimers.clear()
  }

  // ─── Computed Properties ────────────────────────────────────────
  const playerChips = computed(() => wallet.chips)

  const isHandActive = computed(
    () => street.value !== 'idle' && street.value !== 'showdown',
  )

  /** Chips the player must add to call (capped to their stack → all-in call). */
  const callAmount = computed(() => {
    const need = Math.max(0, currentBet.value - playerRoundBet.value)
    return Math.min(need, playerChips.value)
  })

  const canCheck = computed(() => currentBet.value - playerRoundBet.value <= 0)

  /** Max total the player can have in front of them this street (all-in). */
  const maxRaiseAmount = computed(() => playerChips.value + playerRoundBet.value)

  /** Min legal total bet/raise, capped at the player's all-in amount. */
  const minRaiseAmount = computed(() => {
    const fullMin = Math.max(currentBet.value + minRaise.value, bigBlind.value)
    return Math.min(fullMin, maxRaiseAmount.value)
  })

  /** Player can bet/raise (even if only all-in) */
  const canRaise = computed(
    () =>
      currentTurn.value === 'player' &&
      !dealerIsAllIn.value &&
      maxRaiseAmount.value > currentBet.value,
  )

  /** Player has enough chips for a full (non all-in) raise */
  const canFullRaise = computed(
    () =>
      canRaise.value &&
      maxRaiseAmount.value > Math.max(currentBet.value + minRaise.value, bigBlind.value),
  )

  const playerBestHand = computed<EvaluatedHand | null>(() => {
    if (playerCards.value.length === 0) return null
    return getBestHand(playerCards.value, communityCards.value)
  })

  const dealerBestHand = computed<EvaluatedHand | null>(() => {
    if (dealerCards.value.length === 0) return null
    return getBestHand(dealerCards.value, communityCards.value)
  })

  // ─── Dealer Speech Helper ───────────────────────────────────────
  function setDealerSpeech(action: 'check' | 'call' | 'raise' | 'fold' | 'allin') {
    const list = DEALER_QUOTES[action] || DEALER_QUOTES.check
    const randomQuote = list[Math.floor(Math.random() * list.length)]
    dealerSpeech.value = {
      text: randomQuote,
      actionType: action,
      timestamp: Date.now(),
    }
  }

  // ─── Start New Hand ─────────────────────────────────────────────
  function startNewHand() {
    if (isHandActive.value) return false
    if (playerChips.value < bigBlind.value) {
      return false
    }

    // Invalidate any pending timers from previous hand
    handId++
    clearTimers()
    isDealerThinking.value = false

    // Toggle button
    dealerButton.value = dealerButton.value === 'player' ? 'dealer' : 'player'

    // Reset round state
    street.value = 'preflop'
    deck.value = createPokerDeck()
    communityCards.value = []
    pot.value = 0
    roundResult.value = null
    dealerSpeech.value = null

    playerCards.value = []
    playerRoundBet.value = 0
    playerTotalBet.value = 0
    playerHasActed.value = false
    playerIsFolded.value = false
    playerIsAllIn.value = false
    playerLastAction.value = null

    dealerCards.value = []
    dealerRoundBet.value = 0
    dealerTotalBet.value = 0
    dealerHasActed.value = false
    dealerIsFolded.value = false
    dealerIsAllIn.value = false
    dealerLastAction.value = null

    // Refill dealer bankroll if low
    if (dealerChips.value < 1000) {
      dealerChips.value = 5000
    }

    // Post Blinds
    const sb = smallBlind.value
    const bb = bigBlind.value

    if (dealerButton.value === 'player') {
      // In Heads-up: Player has button -> posts SB. Dealer posts BB.
      postPlayerChips(sb)
      postDealerChips(bb)
      // In Heads-Up Texas Hold'em, the button (SB) acts first preflop!
      currentTurn.value = 'player'
    } else {
      // Dealer has button -> posts SB. Player posts BB.
      postDealerChips(sb)
      postPlayerChips(bb)
      // Dealer is button -> Dealer acts first preflop!
      currentTurn.value = 'dealer'
    }
    currentBet.value = bb
    minRaise.value = bb

    // Deal 2 hole cards to each
    const c1 = deck.value.pop()!
    const c2 = deck.value.pop()!
    const c3 = deck.value.pop()!
    const c4 = deck.value.pop()!

    playerCards.value = [c1, c3]
    dealerCards.value = [
      { ...c2, hidden: true },
      { ...c4, hidden: true },
    ]

    stats.value.handsPlayed++
    saveStats()

    // If dealer goes first, trigger AI turn
    if (currentTurn.value === 'dealer') {
      triggerDealerTurn()
    }

    return true
  }

  function postPlayerChips(amount: number) {
    const actual = Math.max(0, Math.min(Math.floor(amount), playerChips.value))
    wallet.removeChips(actual)
    playerRoundBet.value += actual
    playerTotalBet.value += actual
    pot.value += actual
    if (playerChips.value === 0) {
      playerIsAllIn.value = true
    }
  }

  function postDealerChips(amount: number) {
    const actual = Math.max(0, Math.min(Math.floor(amount), dealerChips.value))
    dealerChips.value -= actual
    dealerRoundBet.value += actual
    dealerTotalBet.value += actual
    pot.value += actual
    if (dealerChips.value === 0) {
      dealerIsAllIn.value = true
    }
  }

  // ─── Betting Round Flow ─────────────────────────────────────────
  /** Is the current betting round finished? */
  function isBettingClosed(): boolean {
    const p = playerRoundBet.value
    const d = dealerRoundBet.value
    if (playerIsAllIn.value && dealerIsAllIn.value) return true
    // Player all-in: closed once dealer has matched (or exceeded, excess is refunded)
    if (playerIsAllIn.value) return d >= p
    // Dealer all-in: closed once player has matched (or exceeded)
    if (dealerIsAllIn.value) return p >= d
    return playerHasActed.value && dealerHasActed.value && p === d
  }

  /** After someone acts: either close the round or pass the turn. */
  function afterAction(next: 'player' | 'dealer') {
    if (isBettingClosed()) {
      advanceStreet()
      return
    }
    currentTurn.value = next
    if (next === 'dealer') triggerDealerTurn()
  }

  /** Return chips that the opponent could not match (all-in for less). */
  function returnUncalledBets() {
    const diff = playerRoundBet.value - dealerRoundBet.value
    if (diff > 0) {
      wallet.addChips(diff)
      playerRoundBet.value -= diff
      playerTotalBet.value -= diff
      pot.value -= diff
      if (playerChips.value > 0) playerIsAllIn.value = false
    } else if (diff < 0) {
      const back = -diff
      dealerChips.value += back
      dealerRoundBet.value -= back
      dealerTotalBet.value -= back
      pot.value -= back
      if (dealerChips.value > 0) dealerIsAllIn.value = false
    }
  }

  // ─── Player Actions ─────────────────────────────────────────────
  function playerFold() {
    if (currentTurn.value !== 'player' || !isHandActive.value) return
    playerIsFolded.value = true
    playerLastAction.value = 'Fold'
    endHandWithFold('dealer')
  }

  function playerCheck() {
    if (currentTurn.value !== 'player' || !isHandActive.value || !canCheck.value) return
    playerHasActed.value = true
    playerLastAction.value = 'Pasa'
    afterAction('dealer')
  }

  function playerCall() {
    if (currentTurn.value !== 'player' || !isHandActive.value) return
    if (canCheck.value) {
      playerCheck()
      return
    }
    postPlayerChips(callAmount.value)
    playerHasActed.value = true
    playerLastAction.value = playerIsAllIn.value ? 'All-in' : 'Iguala'
    afterAction('dealer')
  }

  function playerBetOrRaise(totalTargetAmount: number) {
    if (currentTurn.value !== 'player' || !isHandActive.value || !canRaise.value) return

    // Clamp to legal range [minRaise, all-in]
    const maxT = maxRaiseAmount.value
    let target = Math.floor(Number(totalTargetAmount) || 0)
    target = Math.min(Math.max(target, minRaiseAmount.value), maxT)

    if (target <= currentBet.value) {
      playerCall()
      return
    }

    const prevBet = currentBet.value
    postPlayerChips(target - playerRoundBet.value)

    const raiseSize = playerRoundBet.value - prevBet
    if (raiseSize > minRaise.value) minRaise.value = raiseSize
    currentBet.value = playerRoundBet.value

    playerHasActed.value = true
    playerLastAction.value = playerIsAllIn.value
      ? 'All-in'
      : prevBet === 0
      ? `Apuesta ${currentBet.value}`
      : `Sube a ${currentBet.value}`

    // Dealer must react to the raise
    dealerHasActed.value = false
    afterAction('dealer')
  }

  /** Abandon the hand (e.g. leaving the table): counts as a fold. */
  function forfeitHand() {
    if (!isHandActive.value) return
    clearTimers()
    isDealerThinking.value = false
    playerIsFolded.value = true
    playerLastAction.value = 'Fold'
    endHandWithFold('dealer')
  }

  // ─── Dealer AI Logic ────────────────────────────────────────────
  function triggerDealerTurn() {
    if (!isHandActive.value) return
    isDealerThinking.value = true

    schedule(() => {
      isDealerThinking.value = false
      executeDealerAi()
    }, 900 + Math.random() * 500)
  }

  function executeDealerAi() {
    if (!isHandActive.value || currentTurn.value !== 'dealer') return
    if (dealerIsFolded.value || playerIsFolded.value) return

    // If dealer is all in, nothing to decide
    if (dealerIsAllIn.value) {
      dealerHasActed.value = true
      afterAction('player')
      return
    }

    const toCall = Math.max(0, currentBet.value - dealerRoundBet.value)

    // Preflop decision
    if (street.value === 'preflop') {
      executeDealerPreflop(toCall)
      return
    }

    // Postflop decision (Flop, Turn, River)
    const hand = getBestHand(dealerCards.value, communityCards.value)
    executeDealerPostflop(toCall, hand.rankScore) // 0 to 9
  }

  function executeDealerPreflop(toCall: number) {
    const c1 = dealerCards.value[0]
    const c2 = dealerCards.value[1]
    const isPair = c1.value === c2.value
    const isSuited = c1.suit === c2.suit
    const highCard = Math.max(c1.numericValue, c2.numericValue)

    // Strong hand preflop
    if (isPair || highCard >= 12 || (highCard >= 10 && isSuited)) {
      // ~35% chance to raise if facing small bet
      if (toCall <= bigBlind.value && Math.random() < 0.35 && dealerChips.value > bigBlind.value * 3) {
        dealerRaise(currentBet.value + bigBlind.value * 2)
        return
      }
      dealerCall(toCall)
      return
    }

    // Medium hand
    if (highCard >= 9 || isSuited) {
      if (toCall <= bigBlind.value) {
        dealerCall(toCall)
      } else if (toCall <= bigBlind.value * 2.5 && Math.random() < 0.5) {
        dealerCall(toCall)
      } else {
        dealerFold()
      }
      return
    }

    // Weak hand
    if (toCall === 0) {
      dealerCheck()
    } else if (toCall <= bigBlind.value && Math.random() < 0.4) {
      dealerCall(toCall)
    } else {
      dealerFold()
    }
  }

  function executeDealerPostflop(toCall: number, score: number) {
    // Bluff probability: ~12% chance
    const isBluff = Math.random() < 0.12

    if (toCall === 0) {
      // Facing a check (or acting first)
      if (score >= 2 || (score === 1 && Math.random() < 0.6) || isBluff) {
        // Bet about half pot
        const betAmount = Math.max(bigBlind.value, Math.round((pot.value * 0.5) / 10) * 10)
        if (Math.random() < 0.65) {
          dealerRaise(currentBet.value + betAmount)
          return
        }
      }
      dealerCheck()
      return
    }

    // Facing a bet / raise
    // Score: 0 (high card), 1 (pair), 2 (two pair), 3 (trips), 4+ (straight, flush, full house, etc)
    if (score >= 3) {
      // Monster hand: call or re-raise
      if (Math.random() < 0.4) {
        dealerRaise(currentBet.value + Math.max(toCall * 2, bigBlind.value * 2))
      } else {
        dealerCall(toCall)
      }
      return
    }

    if (score === 2) {
      // Two pair: usually call, sometimes raise
      if (Math.random() < 0.25) {
        dealerRaise(currentBet.value + toCall * 2)
      } else {
        dealerCall(toCall)
      }
      return
    }

    if (score === 1) {
      // One pair: call if bet is reasonable
      if (toCall <= pot.value * 0.75 || Math.random() < 0.7) {
        dealerCall(toCall)
      } else {
        dealerFold()
      }
      return
    }

    // High card (score 0)
    if (toCall <= bigBlind.value && Math.random() < 0.35) {
      dealerCall(toCall)
    } else if (isBluff && Math.random() < 0.3) {
      dealerRaise(currentBet.value + toCall * 2)
    } else {
      dealerFold()
    }
  }

  function dealerCheck() {
    // Safety: never "check" when facing a bet
    if (currentBet.value - dealerRoundBet.value > 0) {
      dealerFold()
      return
    }
    dealerHasActed.value = true
    dealerLastAction.value = 'Pasa'
    setDealerSpeech('check')
    afterAction('player')
  }

  function dealerCall(amount: number) {
    if (amount <= 0) {
      dealerCheck()
      return
    }
    postDealerChips(amount)
    dealerHasActed.value = true
    dealerLastAction.value = dealerIsAllIn.value ? 'All-in' : 'Iguala'
    setDealerSpeech(dealerIsAllIn.value ? 'allin' : 'call')
    afterAction('player')
  }

  function dealerRaise(totalTargetAmount: number) {
    const toCall = Math.max(0, currentBet.value - dealerRoundBet.value)

    // No point raising if the player can't respond
    if (playerIsAllIn.value) {
      dealerCall(toCall)
      return
    }

    const dealerMax = dealerChips.value + dealerRoundBet.value
    const playerMax = playerChips.value + playerRoundBet.value
    const minLegal = Math.max(currentBet.value + minRaise.value, bigBlind.value)

    let target = Math.max(Math.round(totalTargetAmount / 5) * 5, minLegal)
    // Never bet more than the dealer has or more than the player can match
    target = Math.min(target, dealerMax, playerMax)

    if (target <= currentBet.value) {
      dealerCall(toCall)
      return
    }

    const prevBet = currentBet.value
    postDealerChips(target - dealerRoundBet.value)

    const raiseSize = dealerRoundBet.value - prevBet
    if (raiseSize > minRaise.value) minRaise.value = raiseSize
    currentBet.value = dealerRoundBet.value

    dealerHasActed.value = true
    dealerLastAction.value = dealerIsAllIn.value
      ? 'All-in'
      : prevBet === 0
      ? `Apuesta ${currentBet.value}`
      : `Sube a ${currentBet.value}`

    setDealerSpeech(dealerIsAllIn.value || target >= playerMax ? 'allin' : 'raise')

    // Player needs to respond
    playerHasActed.value = false
    afterAction('player')
  }

  function dealerFold() {
    dealerIsFolded.value = true
    dealerLastAction.value = 'Fold'
    setDealerSpeech('fold')
    endHandWithFold('player')
  }

  // ─── Advance Street ─────────────────────────────────────────────
  function advanceStreet() {
    returnUncalledBets()

    // Reset round bets
    playerRoundBet.value = 0
    dealerRoundBet.value = 0
    currentBet.value = 0
    minRaise.value = bigBlind.value
    playerHasActed.value = false
    dealerHasActed.value = false

    // If anyone is all-in, run out the remaining board and go to showdown
    if (playerIsAllIn.value || dealerIsAllIn.value) {
      runOutBoard()
      return
    }

    playerLastAction.value = null
    dealerLastAction.value = null

    if (street.value === 'preflop') {
      street.value = 'flop'
      // Flop deals 3 cards
      dealOneCommunityCard()
      dealOneCommunityCard()
      dealOneCommunityCard()
    } else if (street.value === 'flop') {
      street.value = 'turn'
      dealOneCommunityCard()
    } else if (street.value === 'turn') {
      street.value = 'river'
      dealOneCommunityCard()
    } else if (street.value === 'river') {
      executeShowdown()
      return
    }

    // Set first turn for new street:
    // Out of position acts first! If player is button -> dealer acts first postflop.
    // If dealer is button -> player acts first postflop.
    if (dealerButton.value === 'player') {
      currentTurn.value = 'dealer'
      triggerDealerTurn()
    } else {
      currentTurn.value = 'player'
    }
  }

  /** All-in: reveal hands and deal the remaining streets one by one. */
  function runOutBoard() {
    currentTurn.value = null
    isDealerThinking.value = false
    dealerCards.value = dealerCards.value.map((c) => ({ ...c, hidden: false }))

    const step = () => {
      const n = communityCards.value.length
      if (n < 3) {
        street.value = 'flop'
        while (communityCards.value.length < 3) dealOneCommunityCard()
      } else if (n < 4) {
        street.value = 'turn'
        dealOneCommunityCard()
      } else if (n < 5) {
        street.value = 'river'
        dealOneCommunityCard()
      } else {
        executeShowdown()
        return
      }
      schedule(step, 1000)
    }

    schedule(step, 700)
  }

  function dealOneCommunityCard() {
    if (deck.value.length > 0) {
      communityCards.value.push(deck.value.pop()!)
    }
  }

  // ─── Showdown & Endings ─────────────────────────────────────────
  function executeShowdown() {
    if (street.value === 'showdown' || street.value === 'idle') return
    street.value = 'showdown'
    currentTurn.value = null
    isDealerThinking.value = false

    // Unhide dealer cards
    dealerCards.value = dealerCards.value.map((c) => ({ ...c, hidden: false }))

    const pHand = getBestHand(playerCards.value, communityCards.value)
    const dHand = getBestHand(dealerCards.value, communityCards.value)

    const cmp = compareEvaluatedHands(pHand, dHand)
    const totalPot = pot.value

    if (cmp > 0) {
      // Player wins
      wallet.addChips(totalPot)
      const profit = totalPot - playerTotalBet.value
      stats.value.handsWon++
      stats.value.totalProfit += profit
      if (totalPot > stats.value.biggestPotWon) {
        stats.value.biggestPotWon = totalPot
      }

      roundResult.value = {
        winner: 'player',
        pot: totalPot,
        playerWon: totalPot,
        dealerWon: 0,
        playerHand: pHand,
        dealerHand: dHand,
        reason: `¡Ganas el bote con ${pHand.name}!`,
        byFold: false,
      }
    } else if (cmp < 0) {
      // Dealer wins
      dealerChips.value += totalPot
      const loss = playerTotalBet.value
      stats.value.handsLost++
      stats.value.totalProfit -= loss

      roundResult.value = {
        winner: 'dealer',
        pot: totalPot,
        playerWon: 0,
        dealerWon: totalPot,
        playerHand: pHand,
        dealerHand: dHand,
        reason: `El Dealer gana con ${dHand.name}.`,
        byFold: false,
      }
    } else {
      // Tie (Split pot) – odd chip goes to the player
      const playerShare = Math.ceil(totalPot / 2)
      const dealerShare = totalPot - playerShare
      wallet.addChips(playerShare)
      dealerChips.value += dealerShare
      stats.value.handsTied++
      stats.value.totalProfit += playerShare - playerTotalBet.value

      roundResult.value = {
        winner: 'tie',
        pot: totalPot,
        playerWon: playerShare,
        dealerWon: dealerShare,
        playerHand: pHand,
        dealerHand: dHand,
        reason: `¡Bote dividido! Ambos tienen ${pHand.name}.`,
        byFold: false,
      }
    }

    saveStats()
  }

  function endHandWithFold(winner: 'player' | 'dealer') {
    street.value = 'showdown'
    currentTurn.value = null
    isDealerThinking.value = false
    // Revelar cartas del crupier al terminar la mano
    dealerCards.value = dealerCards.value.map((c) => ({ ...c, hidden: false }))
    const totalPot = pot.value

    const pHand = getBestHand(playerCards.value, communityCards.value)
    const dHand = getBestHand(dealerCards.value, communityCards.value)

    if (winner === 'player') {
      wallet.addChips(totalPot)
      const profit = totalPot - playerTotalBet.value
      stats.value.handsWon++
      stats.value.totalProfit += profit
      if (totalPot > stats.value.biggestPotWon) {
        stats.value.biggestPotWon = totalPot
      }

      roundResult.value = {
        winner: 'player',
        pot: totalPot,
        playerWon: totalPot,
        dealerWon: 0,
        playerHand: pHand,
        dealerHand: dHand,
        reason: 'El Dealer se ha retirado (Fold). ¡Te llevas el bote!',
        byFold: true,
      }
    } else {
      dealerChips.value += totalPot
      const loss = playerTotalBet.value
      stats.value.handsLost++
      stats.value.totalProfit -= loss

      roundResult.value = {
        winner: 'dealer',
        pot: totalPot,
        playerWon: 0,
        dealerWon: totalPot,
        playerHand: pHand,
        dealerHand: dHand,
        reason: 'Te has retirado de la mano. El Dealer se lleva el bote.',
        byFold: true,
      }
    }

    saveStats()
  }

  function setStakes(sb: number) {
    if (isHandActive.value) return
    smallBlind.value = sb
  }

  return {
    smallBlind,
    bigBlind,
    dealerChips,
    street,
    deck,
    communityCards,
    pot,
    currentBet,
    minRaise,
    dealerButton,
    currentTurn,
    isDealerThinking,
    roundResult,

    playerCards,
    playerRoundBet,
    playerTotalBet,
    playerHasActed,
    playerIsFolded,
    playerIsAllIn,
    playerLastAction,

    dealerCards,
    dealerRoundBet,
    dealerTotalBet,
    dealerHasActed,
    dealerIsFolded,
    dealerIsAllIn,
    dealerLastAction,
    dealerSpeech,

    stats,
    playerChips,
    isHandActive,
    callAmount,
    canCheck,
    canRaise,
    canFullRaise,
    minRaiseAmount,
    maxRaiseAmount,
    playerBestHand,
    dealerBestHand,

    startNewHand,
    playerFold,
    playerCheck,
    playerCall,
    playerBetOrRaise,
    forfeitHand,
    setStakes,
    resetStats,
  }
})
