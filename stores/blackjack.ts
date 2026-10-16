import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'
import type { Card, Suit, PlayerState, DealerState, GameStatus, GameStats } from '~/types/blackjack'

// ─── Helpers ─────────────────────────────────────────────────

const SUITS: Suit[] = ['hearts', 'diamonds', 'clubs', 'spades']
const VALUES: { value: string; numericValue: number }[] = [
  { value: 'A', numericValue: 11 },
  { value: '2', numericValue: 2 },
  { value: '3', numericValue: 3 },
  { value: '4', numericValue: 4 },
  { value: '5', numericValue: 5 },
  { value: '6', numericValue: 6 },
  { value: '7', numericValue: 7 },
  { value: '8', numericValue: 8 },
  { value: '9', numericValue: 9 },
  { value: '10', numericValue: 10 },
  { value: 'J', numericValue: 10 },
  { value: 'Q', numericValue: 10 },
  { value: 'K', numericValue: 10 },
]

function buildDeck(): Card[] {
  const deck: Card[] = []
  for (const suit of SUITS) {
    for (const v of VALUES) {
      deck.push({
        id: `${v.value}_${suit}_${Math.random().toString(36).substring(2, 7)}`,
        suit,
        value: v.value,
        numericValue: v.numericValue,
        hidden: false,
      })
    }
  }
  return deck
}

/** Fisher-Yates shuffle (in-place) */
function shuffle(deck: Card[]): Card[] {
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[deck[i], deck[j]] = [deck[j], deck[i]]
  }
  return deck
}

/** Calculate score treating Aces as 11 or 1 to best advantage */
function calculateScore(hand: Card[]): number {
  let score = 0
  let aces = 0
  for (const card of hand) {
    if (card.hidden) continue
    score += card.numericValue
    if (card.value === 'A') aces++
  }
  while (score > 21 && aces > 0) {
    score -= 10
    aces--
  }
  return score
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

const STATS_STORAGE_KEY = 'blackjack_game_stats_v1'
const CHIPS_STORAGE_KEY = 'blackjack_player_chips_v1'

// ─── Sound event types ──────────────────────────────────────
export type SoundEvent =
  | 'card_deal'
  | 'card_flip'
  | 'card_slide'
  | 'chip_click'
  | 'chip_stack'
  | 'shuffle'
  | 'win'
  | 'blackjack'
  | 'bust'
  | 'draw'
  | 'button_click'
  | 'bet_place'

// ─── Store ───────────────────────────────────────────────────

export const useBlackjackStore = defineStore('blackjack', () => {
  // ── Sound callback ────────────────────────
  const onSoundEvent = ref<((event: SoundEvent) => void) | null>(null)

  function emitSound(event: SoundEvent) {
    onSoundEvent.value?.(event)
  }

  // ── Stats ─────────────────────────────────
  const stats = ref<GameStats>({
    playerWins: 0,
    dealerWins: 0,
    draws: 0,
    totalGames: 0,
  })

  // ── Streak tracking ──────────────────────
  const currentStreak = ref<number>(0) // positive = win streak, negative = loss streak
  const lastResult = ref<'win' | 'lose' | 'draw' | null>(null)

  function loadSavedData() {
    if (typeof window === 'undefined') return
    try {
      const savedStats = localStorage.getItem(STATS_STORAGE_KEY)
      if (savedStats) {
        const parsed = JSON.parse(savedStats)
        stats.value = {
          playerWins: Number(parsed.playerWins) || 0,
          dealerWins: Number(parsed.dealerWins) || 0,
          draws: Number(parsed.draws) || 0,
          totalGames: Number(parsed.totalGames) || 0,
        }
      }

      const savedChips = localStorage.getItem(CHIPS_STORAGE_KEY)
      if (savedChips !== null) {
        const parsedChips = Number(savedChips)
        if (!isNaN(parsedChips) && parsedChips >= 0) {
          player.value.chips = parsedChips
        }
      }
    } catch (e) {
      console.error('Error loading saved blackjack data:', e)
    }
  }

  function saveStats() {
    if (typeof window === 'undefined') return
    try {
      localStorage.setItem(STATS_STORAGE_KEY, JSON.stringify(stats.value))
      localStorage.setItem(CHIPS_STORAGE_KEY, player.value.chips.toString())
    } catch (e) {
      console.error('Error saving blackjack data:', e)
    }
  }

  function resetStats() {
    stats.value = {
      playerWins: 0,
      dealerWins: 0,
      draws: 0,
      totalGames: 0,
    }
    currentStreak.value = 0
    lastResult.value = null
    saveStats()
  }

  // ── Deck ─────────────────────────────────
  const deck = ref<Card[]>([])

  // ── Player ───────────────────────────────
  const player = ref<PlayerState>({
    hand: [],
    score: 0,
    chips: 1000,
    currentBet: 0,
    status: 'playing',
  })

  // Diálogo de recarga global
  const isRechargeOpen = ref(false)
  function openRecharge() {
    isRechargeOpen.value = true
  }
  function closeRecharge() {
    isRechargeOpen.value = false
  }

  // Sincronización con el servidor
  let syncTimeout: any = null
  function syncChipsWithServer(chipsAmount: number) {
    if (typeof window === 'undefined') return
    if (syncTimeout) clearTimeout(syncTimeout)
    syncTimeout = setTimeout(async () => {
      try {
        await $fetch('/api/user/sync-chips', {
          method: 'POST',
          body: { chips: chipsAmount },
        })
      } catch (e) {
        // Ignorar errores de red temporales
      }
    }, 400)
  }

  async function syncWithServer() {
    if (typeof window === 'undefined') return
    try {
      const data = await $fetch<{ success: boolean; user: { chips: number } }>('/api/auth/me')
      if (data?.user?.chips !== undefined && data.user.chips !== null) {
        player.value.chips = data.user.chips
        localStorage.setItem(CHIPS_STORAGE_KEY, data.user.chips.toString())
      }
    } catch (e) {
      console.warn('Could not sync chips with server:', e)
    }
  }

  // Auto-sync chips with localStorage whenever they change
  watch(
    () => player.value.chips,
    (val) => {
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem(CHIPS_STORAGE_KEY, val.toString())
          syncChipsWithServer(val)
        } catch (e) {
          console.error('Error auto-saving chips:', e)
        }
      }
    },
    { immediate: false },
  )

  function setChips(value: number) {
    player.value.chips = Math.max(0, Math.floor(value))
    saveStats()
    syncChipsWithServer(player.value.chips)
  }

  function addChips(amount: number) {
    player.value.chips = Math.max(0, player.value.chips + Math.floor(amount))
    saveStats()
    syncChipsWithServer(player.value.chips)
  }

  function removeChips(amount: number) {
    player.value.chips = Math.max(0, player.value.chips - Math.floor(amount))
    saveStats()
    syncChipsWithServer(player.value.chips)
  }

  function refillChips() {
    // Ya no se recargan fichas automáticamente; se abre el cajero de recarga
    openRecharge()
  }

  // ── Dealer ───────────────────────────────
  const dealer = ref<DealerState>({
    hand: [],
    score: 0,
    status: 'playing',
  })

  // ── Game ──────────────────────────────────
  const gameStatus = ref<GameStatus>('betting')
  const resultMessage = ref<string>('')
  const isDealing = ref<boolean>(false)

  // ── Computed ──────────────────────────────
  const playerScore = computed(() => calculateScore(player.value.hand))
  const dealerScore = computed(() => calculateScore(dealer.value.hand))

  const canHit = computed(
    () =>
      gameStatus.value === 'player_turn' &&
      player.value.status === 'playing' &&
      !isDealing.value,
  )
  const canStand = computed(
    () =>
      gameStatus.value === 'player_turn' &&
      player.value.status === 'playing' &&
      !isDealing.value,
  )

  /** Can double down: only if player has 2 cards, enough chips, and it's their turn */
  const canDoubleDown = computed(
    () =>
      gameStatus.value === 'player_turn' &&
      player.value.status === 'playing' &&
      player.value.hand.length === 2 &&
      player.value.chips >= player.value.currentBet &&
      !isDealing.value,
  )

  const isRoundOver = computed(() => gameStatus.value === 'round_over')

  const dealerVisibleScore = computed(() => {
    if (gameStatus.value === 'player_turn' || gameStatus.value === 'dealing') {
      return calculateScore(dealer.value.hand)
    }
    return dealerScore.value
  })

  // Win rate percentage
  const winRate = computed(() => {
    if (stats.value.totalGames === 0) return 0
    return Math.round((stats.value.playerWins / stats.value.totalGames) * 100)
  })

  // Streak description
  const streakText = computed(() => {
    const s = currentStreak.value
    if (s === 0) return ''
    if (s > 0) return `🔥 ${s} victoria${s > 1 ? 's' : ''} seguida${s > 1 ? 's' : ''}`
    const abs = Math.abs(s)
    return `❄️ ${abs} derrota${abs > 1 ? 's' : ''} seguida${abs > 1 ? 's' : ''}`
  })

  // ── Internal helpers ─────────────────────
  function drawCard(hidden = false): Card {
    if (deck.value.length === 0) {
      deck.value = shuffle(buildDeck())
    }
    const card = { ...deck.value.pop()!, hidden }
    return card
  }

  function syncScores() {
    player.value.score = playerScore.value
    dealer.value.score = dealerScore.value
  }

  // Initialize data
  loadSavedData()

  // ── Actions ──────────────────────────────

  function startNewGame() {
    deck.value = shuffle(buildDeck())
    emitSound('shuffle')
    player.value.hand = []
    player.value.score = 0
    player.value.currentBet = 0
    player.value.status = 'playing'
    if (player.value.chips <= 0) {
      openRecharge()
    }
    dealer.value = {
      hand: [],
      score: 0,
      status: 'playing',
    }
    gameStatus.value = 'betting'
    resultMessage.value = ''
    isDealing.value = false
    saveStats()
  }

  async function placeBet(amount: number) {
    if (gameStatus.value !== 'betting') return
    if (amount > player.value.chips || amount <= 0) return

    emitSound('bet_place')
    player.value.currentBet = amount
    player.value.chips -= amount
    gameStatus.value = 'dealing'
    isDealing.value = true
    resultMessage.value = ''
    player.value.hand = []
    dealer.value.hand = []

    // Sequential realistic card dealing
    // 1. Player Card 1
    await sleep(200)
    emitSound('card_deal')
    player.value.hand.push(drawCard(false))
    syncScores()

    // 2. Dealer Card 1 (face-up)
    await sleep(280)
    emitSound('card_deal')
    dealer.value.hand.push(drawCard(false))
    syncScores()

    // 3. Player Card 2
    await sleep(280)
    emitSound('card_deal')
    player.value.hand.push(drawCard(false))
    syncScores()

    // 4. Dealer Card 2 (hole card face-down)
    await sleep(280)
    emitSound('card_slide')
    dealer.value.hand.push(drawCard(true))
    syncScores()

    await sleep(350)
    isDealing.value = false

    // Check for natural blackjack
    if (playerScore.value === 21) {
      player.value.status = 'blackjack'
      revealDealerHole()
      evaluateWinner()
      return
    }

    gameStatus.value = 'player_turn'
  }

  async function hit() {
    if (!canHit.value) return
    isDealing.value = true
    emitSound('card_deal')
    player.value.hand.push(drawCard())
    syncScores()
    await sleep(300)
    isDealing.value = false

    if (playerScore.value > 21) {
      player.value.status = 'busted'
      await sleep(400)
      revealDealerHole()
      evaluateWinner()
    } else if (playerScore.value === 21) {
      await sleep(300)
      await stand()
    }
  }

  /** Double Down: double the bet, receive exactly one more card, then stand */
  async function doubleDown() {
    if (!canDoubleDown.value) return

    emitSound('chip_click')
    // Double the bet
    player.value.chips -= player.value.currentBet
    player.value.currentBet *= 2
    player.value.status = 'doubled_down'

    isDealing.value = true
    await sleep(300)
    emitSound('card_deal')
    player.value.hand.push(drawCard())
    syncScores()
    await sleep(400)
    isDealing.value = false

    if (playerScore.value > 21) {
      player.value.status = 'busted'
      await sleep(400)
      revealDealerHole()
      evaluateWinner()
    } else {
      // After double down, automatically stand
      player.value.status = 'stand'
      gameStatus.value = 'dealer_turn'
      isDealing.value = true

      await sleep(350)
      revealDealerHole()

      await sleep(500)
      await dealerPlay()
      isDealing.value = false
    }
  }

  async function stand() {
    if (gameStatus.value !== 'player_turn' || isDealing.value) return
    emitSound('button_click')
    player.value.status = 'stand'
    gameStatus.value = 'dealer_turn'
    isDealing.value = true

    // Flip dealer hole card smoothly
    await sleep(350)
    revealDealerHole()

    // Dealer draws
    await sleep(500)
    await dealerPlay()
    isDealing.value = false
  }

  function revealDealerHole() {
    emitSound('card_flip')
    for (const card of dealer.value.hand) {
      card.hidden = false
    }
    syncScores()
  }

  async function dealerPlay() {
    gameStatus.value = 'dealer_turn'

    // Dealer draws cards one by one until >= 17
    while (calculateScore(dealer.value.hand) < 17) {
      emitSound('card_deal')
      dealer.value.hand.push(drawCard())
      dealer.value.score = calculateScore(dealer.value.hand)
      await sleep(650)
    }

    dealer.value.score = calculateScore(dealer.value.hand)
    if (dealer.value.score > 21) {
      dealer.value.status = 'busted'
    } else {
      dealer.value.status = 'stand'
    }

    await sleep(300)
    evaluateWinner()
  }

  function evaluateWinner() {
    gameStatus.value = 'round_over'
    const ps = playerScore.value
    const ds = calculateScore(dealer.value.hand)
    stats.value.totalGames++
    const isDoubled = player.value.status === 'doubled_down' || player.value.currentBet > 0

    if (player.value.status === 'busted') {
      resultMessage.value = '💥 ¡Te pasaste! El Dealer gana.'
      stats.value.dealerWins++
      lastResult.value = 'lose'
      currentStreak.value = currentStreak.value < 0 ? currentStreak.value - 1 : -1
      emitSound('bust')
    } else if (player.value.status === 'blackjack' && ds !== 21) {
      resultMessage.value = '🎰 ¡BLACKJACK! ¡Ganaste x2.5!'
      player.value.chips += Math.floor(player.value.currentBet * 2.5)
      stats.value.playerWins++
      lastResult.value = 'win'
      currentStreak.value = currentStreak.value > 0 ? currentStreak.value + 1 : 1
      emitSound('blackjack')
    } else if (player.value.status === 'blackjack' && ds === 21) {
      resultMessage.value = '🤝 ¡Empate de Blackjack! Se devuelve tu apuesta.'
      player.value.chips += player.value.currentBet
      stats.value.draws++
      lastResult.value = 'draw'
      currentStreak.value = 0
      emitSound('draw')
    } else if (dealer.value.status === 'busted') {
      resultMessage.value = '🎉 ¡El Dealer se pasó! ¡Ganaste!'
      player.value.chips += player.value.currentBet * 2
      stats.value.playerWins++
      lastResult.value = 'win'
      currentStreak.value = currentStreak.value > 0 ? currentStreak.value + 1 : 1
      emitSound('win')
    } else if (ps > ds) {
      resultMessage.value = '🏆 ¡Ganaste la ronda!'
      player.value.chips += player.value.currentBet * 2
      stats.value.playerWins++
      lastResult.value = 'win'
      currentStreak.value = currentStreak.value > 0 ? currentStreak.value + 1 : 1
      emitSound('win')
    } else if (ps < ds) {
      resultMessage.value = '😞 El Dealer gana esta ronda.'
      stats.value.dealerWins++
      lastResult.value = 'lose'
      currentStreak.value = currentStreak.value < 0 ? currentStreak.value - 1 : -1
      emitSound('bust')
    } else {
      resultMessage.value = '🤝 ¡Empate! Se devuelve tu apuesta.'
      player.value.chips += player.value.currentBet
      stats.value.draws++
      lastResult.value = 'draw'
      currentStreak.value = 0
      emitSound('draw')
    }

    saveStats()
  }

  function resetRound() {
    player.value.hand = []
    player.value.score = 0
    player.value.currentBet = 0
    player.value.status = 'playing'
    dealer.value.hand = []
    dealer.value.score = 0
    dealer.value.status = 'playing'
    resultMessage.value = ''
    isDealing.value = false

    if (player.value.chips <= 0) {
      openRecharge()
    }

    gameStatus.value = 'betting'
  }

  return {
    // state
    stats,
    deck,
    player,
    dealer,
    gameStatus,
    resultMessage,
    isDealing,
    currentStreak,
    lastResult,
    isRechargeOpen,
    // computed
    playerScore,
    dealerScore,
    dealerVisibleScore,
    canHit,
    canStand,
    canDoubleDown,
    isRoundOver,
    winRate,
    streakText,
    // actions
    loadSavedData,
    saveStats,
    resetStats,
    syncWithServer,
    setChips,
    addChips,
    removeChips,
    refillChips,
    openRecharge,
    closeRecharge,
    startNewGame,
    placeBet,
    hit,
    stand,
    doubleDown,
    dealerPlay,
    evaluateWinner,
    resetRound,
    // sound hook
    onSoundEvent,
  }
})
