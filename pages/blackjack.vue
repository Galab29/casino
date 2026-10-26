<script setup lang="ts">
import { useBlackjackStore } from '~/stores/blackjack'
import { useWalletStore } from '~/stores/wallet'
import type { SoundEvent } from '~/stores/blackjack'
import { useSoundEngine } from '~/composables/useSoundEngine'
import { useConfetti } from '~/composables/useConfetti'
import { storeToRefs } from 'pinia'
import GameRulesDialog from '~/components/common/GameRulesDialog.vue'
import RechargeDialog from '~/components/common/RechargeDialog.vue'
import { useDeckStyle } from '~/composables/useDeckStyle'
import { getPixelCardUrl } from '~/utils/pixelDeck'

const router = useRouter()
const nuxtApp = useNuxtApp()
const store = useBlackjackStore(nuxtApp.$pinia)
const wallet = useWalletStore(nuxtApp.$pinia)
const sound = useSoundEngine()
const effects = useConfetti()

const chips = computed(() => wallet.chips)

const {
  player,
  dealer,
  gameStatus,
  resultMessage,
  playerScore,
  dealerVisibleScore,
  canHit,
  canStand,
  canDoubleDown,
  isRoundOver,
  stats,
  winRate,
  isDealing,
  streakText,
  lastResult,
  currentStreak,
} = storeToRefs(store)

const betAmount = ref<number>(0)
const showRulesDialog = ref<boolean>(false)
const showExitConfirmDialog = ref<boolean>(false)
const showResetStatsDialog = ref<boolean>(false)

// ─── Realistic Card Backs Configuration ──────────────────
type CardBackColor = 'navy' | 'red' | 'blue' | 'black' | 'green'
const cardBackColor = ref<CardBackColor>('navy')
const cardBackOptions = [
  { text: 'Azul Real', value: 'navy', color: '#1a2550' },
  { text: 'Rojo Rubí', value: 'red', color: '#c62828' },
  { text: 'Negro Casino', value: 'black', color: '#1e1e1e' },
  { text: 'Verde Mesa', value: 'green', color: '#1b5e20' },
]

// ─── Deck Style (8-bit / classic), shared across all card games ───
const { isPixel, toggle: toggleDeckStyle } = useDeckStyle()
function cardBackUrl(color: CardBackColor) {
  const src = isPixel.value ? getPixelCardUrl({ type: 'BACK', theme: color }) : `/cards/back-${color}.png`
  return `url(${src})`
}

// ─── Sound System Hook ─────────────────────────────────
const soundMap: Record<SoundEvent, () => void> = {
  card_deal: sound.playCardDeal,
  card_flip: sound.playCardFlip,
  card_slide: sound.playCardSlide,
  chip_click: sound.playChipClick,
  chip_stack: sound.playChipStack,
  shuffle: sound.playShuffle,
  win: sound.playWin,
  blackjack: sound.playBlackjack,
  bust: sound.playBust,
  draw: sound.playDraw,
  button_click: sound.playButtonClick,
  bet_place: sound.playBetPlace,
}

store.onSoundEvent = (event: SoundEvent) => {
  soundMap[event]?.()
}

// ─── Visual Effects on Result ──────────────────────────
watch(lastResult, (val) => {
  if (!val) return
  if (val === 'win') {
    effects.launchConfetti(3500)
    const bet = player.value.currentBet
    if (bet > 0) {
      effects.floatingText(`+${bet} 💰`, '#4caf50')
    }
  } else if (val === 'lose') {
    effects.screenShake(5, 350)
  }
})

// Streak celebration: extra confetti on 3+ win streak
watch(currentStreak, (val) => {
  if (val >= 3) {
    setTimeout(() => effects.launchConfetti(2000), 500)
  }
})

// Initialize round on mount if needed
onMounted(() => {
  if (gameStatus.value === 'round_over' || player.value.hand.length === 0) {
    store.startNewGame()
  }
})

onUnmounted(() => {
  effects.cleanup()
})

function handlePlaceBet() {
  if (betAmount.value > 0) {
    store.placeBet(betAmount.value)
    betAmount.value = 0
  }
}

function handleClearBet() {
  betAmount.value = 0
}

function handleChipClick() {
  sound.playChipClick()
}

function handleHit() {
  store.hit()
}

function handleStand() {
  store.stand()
}

function handleDoubleDown() {
  store.doubleDown()
}

function handleNextRound() {
  store.resetRound()
}

function handleBackClick() {
  // If player is in active play with chips bet, ask for confirmation
  if (gameStatus.value === 'player_turn' || gameStatus.value === 'dealing' || gameStatus.value === 'dealer_turn') {
    showExitConfirmDialog.value = true
  } else {
    router.push('/')
  }
}

function confirmExit() {
  showExitConfirmDialog.value = false
  store.resetRound()
  router.push('/')
}

function confirmResetStats() {
  store.resetStats()
  showResetStatsDialog.value = false
}

// Status text for the scoreboard
const statusText = computed(() => {
  if (resultMessage.value) return resultMessage.value
  switch (gameStatus.value) {
    case 'betting':
      return '🎰 Haz tu apuesta para comenzar'
    case 'dealing':
      return '🃏 Repartiendo cartas…'
    case 'player_turn':
      return '🤔 Tu turno: ¿Pedir, Doblar o Plantarte?'
    case 'dealer_turn':
      return '🎩 Turno del Dealer…'
    default:
      return ''
  }
})

// Dynamic result icon
const resultIcon = computed(() => {
  if (player.value.status === 'blackjack') return 'mdi-star-circle'
  if (player.value.status === 'busted') return 'mdi-skull-crossbones'
  if (lastResult.value === 'win') return 'mdi-trophy'
  if (lastResult.value === 'draw') return 'mdi-handshake'
  return 'mdi-emoticon-sad'
})

const resultIconColor = computed(() => {
  if (player.value.status === 'blackjack') return 'amber-lighten-1'
  if (player.value.status === 'busted') return 'red'
  if (lastResult.value === 'win') return 'amber-darken-1'
  if (lastResult.value === 'draw') return 'grey-lighten-1'
  return 'red-lighten-1'
})
</script>

<template>
  <div class="blackjack-table">
    <!-- Background animated shapes -->
    <div class="bg-shape bg-shape--1" />
    <div class="bg-shape bg-shape--2" />
    <div class="bg-shape bg-shape--3" />

    <!-- Ambient felt texture particles -->
    <div v-for="i in 6" :key="`fp-${i}`" class="felt-particle" :class="`felt-particle--${i}`" />

    <v-container class="table-content" fluid>
      <!-- ═══ Top Navigation Bar ═══ -->
      <v-row align="center" justify="space-between" class="top-bar mb-3 px-2">
        <v-col cols="auto">
          <v-btn
            variant="tonal"
            color="amber-lighten-2"
            prepend-icon="mdi-arrow-left"
            rounded="pill"
            class="back-btn elevation-3"
            @click="handleBackClick"
          >
            <span class="d-none d-sm-inline">Volver al Casino</span>
            <span class="d-inline d-sm-none">Lobby</span>
          </v-btn>
        </v-col>

        <v-col cols="auto" class="text-center">
          <div class="table-badge d-flex align-center ga-2">
            <span class="pulse-dot" />
            <span class="table-badge-text">Mesa VIP Blackjack • Paga 3:2</span>
          </div>
        </v-col>

        <v-col cols="auto" class="d-none d-sm-flex align-center ga-2">
          <!-- Card back design selector menu -->
          <v-menu location="bottom end">
            <template #activator="{ props: menuProps }">
              <v-btn
                v-bind="menuProps"
                variant="outlined"
                color="amber-lighten-3"
                size="small"
                rounded="pill"
                prepend-icon="mdi-cards-playing-outline"
                append-icon="mdi-chevron-down"
                class="deck-selector-btn"
              >
                Dorso: {{ cardBackOptions.find(o => o.value === cardBackColor)?.text }}
              </v-btn>
            </template>
            <v-list density="compact" bg-color="#121824" rounded="lg" class="deck-menu-list pa-1">
              <v-list-item
                v-for="opt in cardBackOptions"
                :key="opt.value"
                :value="opt.value"
                :active="cardBackColor === opt.value"
                color="amber-lighten-2"
                rounded="md"
                class="mb-1"
                @click="cardBackColor = opt.value as CardBackColor"
              >
                <template #prepend>
                  <div
                    class="deck-sample mr-2"
                    :style="{ backgroundImage: cardBackUrl(opt.value as CardBackColor) }"
                  />
                </template>
                <v-list-item-title class="text-caption font-weight-bold">{{ opt.text }}</v-list-item-title>
              </v-list-item>
              <v-divider class="my-1" />
              <v-list-item
                id="blackjack-deck-style-toggle"
                rounded="md"
                :prepend-icon="isPixel ? 'mdi-image-outline' : 'mdi-gamepad-square-outline'"
                @click="toggleDeckStyle"
              >
                <v-list-item-title class="text-caption font-weight-bold">
                  {{ isPixel ? 'Usar baraja clásica' : 'Usar baraja 8-Bit' }}
                </v-list-item-title>
              </v-list-item>
            </v-list>
          </v-menu>

          <!-- Botón ¿Cómo Jugar? -->
          <v-btn
            id="blackjack-rules-btn"
            variant="tonal"
            color="amber-lighten-2"
            size="small"
            rounded="pill"
            prepend-icon="mdi-help-circle-outline"
            class="rules-btn font-weight-bold ml-1"
            @click="showRulesDialog = true"
          >
            ¿Cómo Jugar?
          </v-btn>

          <!-- Botón Recargar Monedas -->
          <v-btn
            variant="elevated"
            color="amber-darken-2"
            size="small"
            rounded="pill"
            prepend-icon="mdi-cash-plus"
            class="rules-btn font-weight-bold ml-1"
            @click="wallet.openRecharge()"
          >
            + Recargar
          </v-btn>
        </v-col>
      </v-row>

      <!-- ═══ Title ═══ -->
      <v-row justify="center" class="mb-1">
        <v-col cols="auto">
          <h1 class="game-title text-center">
            <v-icon color="amber" size="32" class="mr-2 title-icon-left">mdi-cards</v-icon>
            BLACKJACK ROYALE
            <v-icon color="amber" size="32" class="ml-2 title-icon-right">mdi-cards</v-icon>
          </h1>
        </v-col>
      </v-row>

      <!-- ═══ Scoreboard with Win/Loss Stats ═══ -->
      <v-row justify="center">
        <v-col cols="12" md="8" lg="6">
          <GameScoreboard
            :dealer-score="dealerVisibleScore"
            :player-score="playerScore"
            :chips="chips"
            :current-bet="player.currentBet"
            :status-message="statusText"
            :dealer-wins="stats.dealerWins"
            :player-wins="stats.playerWins"
            :draws="stats.draws"
            :win-rate="winRate"
            :streak-text="streakText"
            @reset-stats="showResetStatsDialog = true"
          />
        </v-col>
      </v-row>

      <!-- ═══ Felt Playing Area ═══ -->
      <div class="felt-surface">
        <!-- Visual Deck Shoe -->
        <div class="dealer-shoe d-none d-md-flex flex-column align-center" title="Zapato del Dealer">
          <div class="shoe-box">
            <div
              class="shoe-card shoe-card-1"
              :style="{ backgroundImage: cardBackUrl(cardBackColor) }"
            />
            <div
              class="shoe-card shoe-card-2"
              :style="{ backgroundImage: cardBackUrl(cardBackColor) }"
            />
            <div
              class="shoe-card shoe-card-3"
              :style="{ backgroundImage: cardBackUrl(cardBackColor) }"
            />
          </div>
          <span class="shoe-caption">Baraja</span>
        </div>

        <!-- ═══ Dealer Hand ═══ -->
        <v-row justify="center" class="mb-2">
          <v-col cols="12" class="text-center">
            <div class="hand-label">
              <v-icon size="18" class="mr-1">mdi-account-tie</v-icon>
              DEALER
            </div>
            <div class="hand-row d-flex justify-center flex-wrap align-center">
              <TransitionGroup name="card-deal">
                <PlayingCard
                  v-for="card in dealer.hand"
                  :key="card.id"
                  :card="card"
                  :face-down="card.hidden"
                  :back-color="cardBackColor"
                />
              </TransitionGroup>
              <div v-if="dealer.hand.length === 0" class="empty-hand-placeholder">
                <v-icon size="32" color="rgba(255,255,255,0.15)" class="mb-1">mdi-cards-outline</v-icon>
                <span>Esperando apuesta...</span>
              </div>
            </div>
          </v-col>
        </v-row>

        <!-- Divider with table insignia -->
        <v-row justify="center" class="my-1">
          <v-col cols="10" md="6" class="d-flex align-center justify-center">
            <div class="felt-divider-line flex-grow-1" />
            <div class="felt-emblem px-3">
              <v-icon size="22" color="amber-lighten-2">mdi-crown</v-icon>
            </div>
            <div class="felt-divider-line flex-grow-1" />
          </v-col>
        </v-row>

        <!-- ═══ Player Hand ═══ -->
        <v-row justify="center" class="mt-1">
          <v-col cols="12" class="text-center">
            <div class="hand-label hand-label--player">
              <v-icon size="18" class="mr-1">mdi-account</v-icon>
              JUGADOR
            </div>
            <div class="hand-row d-flex justify-center flex-wrap align-center">
              <TransitionGroup name="card-deal">
                <PlayingCard
                  v-for="card in player.hand"
                  :key="card.id"
                  :card="card"
                  :back-color="cardBackColor"
                />
              </TransitionGroup>
              <div v-if="player.hand.length === 0" class="empty-hand-placeholder">
                <v-icon size="32" color="rgba(255,255,255,0.15)" class="mb-1">mdi-poker-chip</v-icon>
                <span>Coloca fichas en el tapete</span>
              </div>
            </div>
          </v-col>
        </v-row>
      </div>

      <!-- ═══ Controls ═══ -->
      <v-row justify="center" class="mt-4">
        <v-col cols="12" md="6" lg="5">
          <!-- Betting phase -->
          <BetControls
            v-if="gameStatus === 'betting'"
            v-model="betAmount"
            :max-bet="chips"
            :disabled="gameStatus !== 'betting'"
            @place-bet="handlePlaceBet"
            @clear-bet="handleClearBet"
            @chip-click="handleChipClick"
          />

          <!-- Game-play / round-over phase -->
          <ActionPanel
            v-else
            :can-hit="canHit && !isDealing"
            :can-stand="canStand && !isDealing"
            :can-double-down="canDoubleDown && !isDealing"
            :is-round-over="isRoundOver"
            @hit="handleHit"
            @stand="handleStand"
            @double-down="handleDoubleDown"
            @next-round="handleNextRound"
          />
        </v-col>
      </v-row>

      <!-- ═══ Result dialog ═══ -->
      <v-dialog
        :model-value="isRoundOver && !!resultMessage"
        max-width="460"
        persistent
      >
        <v-card class="result-dialog pa-6 text-center" rounded="xl">
          <!-- Animated result icon -->
          <div class="result-icon mb-3">
            <div class="result-ring" :class="`result-ring--${lastResult || 'lose'}`" />
            <v-icon
              :color="resultIconColor"
              size="64"
              class="result-icon-inner"
            >
              {{ resultIcon }}
            </v-icon>
          </div>

          <h2 class="result-text mb-1">{{ resultMessage }}</h2>

          <!-- Streak badge in result -->
          <div v-if="streakText" class="result-streak mb-3">
            <v-chip size="small" variant="tonal" color="amber">{{ streakText }}</v-chip>
          </div>

          <div class="result-stats-summary pa-3 mb-4 rounded-lg">
            <div class="d-flex justify-space-between mb-1">
              <span class="text-grey-lighten-2">Fichas restantes:</span>
              <strong class="text-amber">{{ chips }}</strong>
            </div>
            <div class="d-flex justify-space-between">
              <span class="text-grey-lighten-2">Record Actual:</span>
              <span class="text-teal-lighten-2">Tú: {{ stats.playerWins }}</span>
              <span class="text-red-lighten-2">Dealer: {{ stats.dealerWins }}</span>
            </div>
          </div>
          <v-btn
            color="amber-darken-2"
            size="large"
            variant="elevated"
            rounded="lg"
            prepend-icon="mdi-refresh"
            block
            class="next-round-dialog-btn"
            @click="handleNextRound"
          >
            {{ chips <= 0 ? 'Recargar Fichas (Nuevo Juego)' : 'Siguiente Ronda' }}
          </v-btn>
        </v-card>
      </v-dialog>

      <!-- ═══ Exit Confirmation Dialog ═══ -->
      <v-dialog v-model="showExitConfirmDialog" max-width="400">
        <v-card class="exit-dialog pa-5 text-center" rounded="xl">
          <v-icon size="48" color="amber-lighten-1" class="mb-3">mdi-alert-circle-outline</v-icon>
          <h3 class="exit-title mb-2">¿Salir al Casino?</h3>
          <p class="text-grey-lighten-1 mb-4 text-body-2">
            Tienes una ronda activa con una apuesta de <strong>{{ player.currentBet }}</strong> fichas. Si sales ahora, se reiniciará la mano actual.
          </p>
          <v-row dense justify="center">
            <v-col cols="6">
              <v-btn
                variant="outlined"
                color="grey-lighten-1"
                rounded="lg"
                block
                @click="showExitConfirmDialog = false"
              >
                Quedarme
              </v-btn>
            </v-col>
            <v-col cols="6">
              <v-btn
                color="red-darken-3"
                variant="elevated"
                rounded="lg"
                block
                @click="confirmExit"
              >
                Salir
              </v-btn>
            </v-col>
          </v-row>
        </v-card>
      </v-dialog>

      <!-- ═══ Reset Stats Confirmation Dialog ═══ -->
      <v-dialog v-model="showResetStatsDialog" max-width="380">
        <v-card class="exit-dialog pa-5 text-center" rounded="xl">
          <v-icon size="48" color="red-lighten-2" class="mb-3">mdi-restore-alert</v-icon>
          <h3 class="exit-title mb-2">Reiniciar Estadísticas</h3>
          <p class="text-grey-lighten-1 mb-4 text-body-2">
            ¿Deseas poner a cero el contador de victorias, derrotas y empates? Esta acción no se puede deshacer.
          </p>
          <v-row dense justify="center">
            <v-col cols="6">
              <v-btn
                variant="outlined"
                color="grey-lighten-1"
                rounded="lg"
                block
                @click="showResetStatsDialog = false"
              >
                Cancelar
              </v-btn>
            </v-col>
            <v-col cols="6">
              <v-btn
                color="amber-darken-3"
                variant="elevated"
                rounded="lg"
                block
                @click="confirmResetStats"
              >
                Reiniciar
              </v-btn>
            </v-col>
          </v-row>
        </v-card>
      </v-dialog>

      <!-- Diálogo de Reglas del Blackjack -->
      <GameRulesDialog v-model="showRulesDialog" game="blackjack" />

      <!-- Diálogo de Recarga por Códigos -->
      <RechargeDialog v-model="wallet.isRechargeOpen" />
    </v-container>
  </div>
</template>

<style scoped>
/* ─── Google Fonts ────────────────────── */
@import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@600;700;900&family=Roboto:wght@400;500;700&display=swap');

/* ─── Table Background ──────────────── */
.blackjack-table {
  min-height: 100vh;
  background: radial-gradient(ellipse at 50% 30%, #175422 0%, #0c3311 55%, #051608 100%);
  position: relative;
  overflow: hidden;
  font-family: 'Roboto', sans-serif;
  color: #fff;
}

/* Decorative floating shapes */
.bg-shape {
  position: absolute;
  border-radius: 50%;
  opacity: 0.07;
  pointer-events: none;
}
.bg-shape--1 {
  width: 500px;
  height: 500px;
  background: radial-gradient(circle, #ffd54f, transparent 70%);
  top: -120px;
  right: -100px;
  animation: float 12s ease-in-out infinite;
}
.bg-shape--2 {
  width: 350px;
  height: 350px;
  background: radial-gradient(circle, #e53935, transparent 70%);
  bottom: -80px;
  left: -60px;
  animation: float 16s ease-in-out infinite reverse;
}
.bg-shape--3 {
  width: 280px;
  height: 280px;
  background: radial-gradient(circle, #4fc3f7, transparent 70%);
  top: 40%;
  left: 50%;
  animation: float 20s ease-in-out infinite;
}

@keyframes float {
  0%, 100% { transform: translateY(0) scale(1); }
  50% { transform: translateY(-30px) scale(1.05); }
}

/* Ambient felt particles */
.felt-particle {
  position: absolute;
  width: 3px;
  height: 3px;
  background: rgba(255, 213, 79, 0.15);
  border-radius: 50%;
  pointer-events: none;
  animation: felt-drift 20s linear infinite;
}

.felt-particle--1 { left: 10%; top: 20%; animation-duration: 25s; }
.felt-particle--2 { left: 80%; top: 30%; animation-duration: 18s; animation-delay: 3s; }
.felt-particle--3 { left: 30%; top: 70%; animation-duration: 22s; animation-delay: 5s; }
.felt-particle--4 { left: 60%; top: 50%; animation-duration: 20s; animation-delay: 2s; }
.felt-particle--5 { left: 90%; top: 80%; animation-duration: 28s; animation-delay: 8s; }
.felt-particle--6 { left: 50%; top: 15%; animation-duration: 16s; animation-delay: 1s; }

@keyframes felt-drift {
  0% { opacity: 0; transform: translateY(0) translateX(0); }
  20% { opacity: 0.4; }
  80% { opacity: 0.2; }
  100% { opacity: 0; transform: translateY(-60px) translateX(30px); }
}

/* ─── Table content ──────────────────── */
.table-content {
  position: relative;
  z-index: 1;
  padding-top: 16px;
  padding-bottom: 48px;
  max-width: 1200px;
}

/* ─── Top Bar ────────────────────────── */
.top-bar {
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  padding-bottom: 12px;
}

.back-btn {
  font-weight: 600;
  letter-spacing: 0.5px;
  text-transform: none;
  background: rgba(0, 0, 0, 0.35) !important;
  border: 1px solid rgba(255, 213, 79, 0.3);
  transition: all 0.3s ease;
}

.back-btn:hover {
  transform: translateX(-4px);
  background: rgba(255, 213, 79, 0.15) !important;
  border-color: #ffd54f;
}

.table-badge {
  background: rgba(0, 0, 0, 0.4);
  padding: 6px 14px;
  border-radius: 20px;
  border: 1px solid rgba(255, 213, 79, 0.25);
}

.table-badge-text {
  font-size: 12px;
  letter-spacing: 1px;
  text-transform: uppercase;
  color: #ffe082;
  font-weight: 500;
}

.pulse-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #00e676;
  box-shadow: 0 0 8px #00e676;
  animation: pulse 1.8s infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.4; transform: scale(0.85); }
}

/* ─── Title ──────────────────────────── */
.game-title {
  font-family: 'Cinzel', serif;
  font-weight: 900;
  font-size: 2.2rem;
  letter-spacing: 6px;
  color: #ffd54f;
  text-shadow: 0 2px 14px rgba(255, 213, 79, 0.35);
}

.title-icon-left {
  animation: tilt-left 3s ease-in-out infinite;
}

.title-icon-right {
  animation: tilt-right 3s ease-in-out infinite;
}

@keyframes tilt-left {
  0%, 100% { transform: rotate(0deg); }
  50% { transform: rotate(-10deg); }
}

@keyframes tilt-right {
  0%, 100% { transform: rotate(0deg); }
  50% { transform: rotate(10deg); }
}

/* ─── Felt Surface ───────────────────── */
.felt-surface {
  position: relative;
  background:
    radial-gradient(ellipse at 50% 50%, rgba(20, 80, 30, 0.5) 0%, rgba(6, 28, 10, 0.6) 100%);
  border: 2px solid rgba(255, 213, 79, 0.2);
  border-radius: 28px;
  padding: 24px 16px;
  box-shadow:
    inset 0 0 60px rgba(0, 0, 0, 0.5),
    inset 0 0 120px rgba(0, 0, 0, 0.2),
    0 10px 40px rgba(0, 0, 0, 0.5);
}

/* ─── Dealer Shoe ────────────────────── */
.dealer-shoe {
  position: absolute;
  top: 18px;
  right: 28px;
  opacity: 0.85;
}

.shoe-box {
  width: 52px;
  height: 72px;
  background: #111;
  border: 2px solid #b8860b;
  border-radius: 6px;
  position: relative;
  box-shadow: 0 6px 12px rgba(0,0,0,0.6);
}

.shoe-card {
  position: absolute;
  width: 44px;
  height: 62px;
  border-radius: 4px;
  background-size: cover;
  background-position: center;
  box-shadow: 0 2px 6px rgba(0,0,0,0.5);
  border: 1px solid rgba(255, 213, 79, 0.4);
  image-rendering: -webkit-optimize-contrast;
}

.shoe-card-1 {
  top: 4px;
  left: 3px;
  transform: rotate(-3deg);
}

.shoe-card-2 {
  top: 6px;
  left: 4px;
  transform: rotate(2deg);
}

.shoe-card-3 {
  top: 8px;
  left: 5px;
  transform: rotate(-1deg);
}

.shoe-caption {
  font-size: 10px;
  color: rgba(255, 213, 79, 0.7);
  letter-spacing: 1px;
  text-transform: uppercase;
  margin-top: 4px;
}

/* ─── Deck Selector Menu ─────────────── */
.deck-selector-btn {
  text-transform: none;
  font-size: 0.8rem;
  letter-spacing: 0.5px;
  border-color: rgba(255, 213, 79, 0.4) !important;
}

.deck-menu-list {
  border: 1px solid rgba(255, 213, 79, 0.25);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.6);
}

.deck-sample {
  width: 20px;
  height: 28px;
  border-radius: 3px;
  background-size: cover;
  background-position: center;
  border: 1px solid rgba(255, 213, 79, 0.4);
}

/* ─── Hand labels ────────────────────── */
.hand-label {
  font-family: 'Cinzel', serif;
  font-size: 12px;
  letter-spacing: 4px;
  color: rgba(255, 255, 255, 0.6);
  margin-bottom: 8px;
}
.hand-label--player {
  color: rgba(128, 203, 196, 0.85);
}

/* ─── Hand row ───────────────────────── */
.hand-row {
  min-height: 146px;
  gap: 6px;
}

.empty-hand-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  font-size: 13px;
  color: rgba(255, 255, 255, 0.3);
  font-style: italic;
  letter-spacing: 1px;
}

/* ─── Table divider ──────────────────── */
.felt-divider-line {
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(255, 213, 79, 0.4), transparent);
}

.felt-emblem {
  opacity: 0.7;
  animation: emblem-glow 4s ease-in-out infinite;
}

@keyframes emblem-glow {
  0%, 100% { filter: drop-shadow(0 0 4px rgba(255,213,79,0.2)); }
  50% { filter: drop-shadow(0 0 12px rgba(255,213,79,0.5)); }
}

/* ─── Card deal transition ───────────── */
.card-deal-enter-active {
  transition: all 0.55s cubic-bezier(0.22, 1, 0.36, 1);
}

.card-deal-leave-active {
  transition: all 0.3s ease-in;
}

.card-deal-enter-from {
  opacity: 0;
  transform: translate3d(140px, -90px, 0) rotate(28deg) scale(0.35);
}

.card-deal-leave-to {
  opacity: 0;
  transform: translateY(20px) scale(0.4);
}

/* ─── Result dialog & Exit Dialog ────── */
.result-dialog, .exit-dialog {
  background: linear-gradient(160deg, #121824 0%, #1a2336 100%) !important;
  border: 1.5px solid rgba(255, 213, 79, 0.35);
  box-shadow: 0 16px 40px rgba(0, 0, 0, 0.75);
}

.result-icon {
  position: relative;
  display: inline-block;
}

.result-icon-inner {
  animation: pop-in 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
  position: relative;
  z-index: 2;
}

.result-ring {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 80px;
  height: 80px;
  border-radius: 50%;
  transform: translate(-50%, -50%);
  z-index: 1;
  animation: ring-expand 1.5s ease-out infinite;
}

.result-ring--win {
  border: 2px solid rgba(255, 213, 79, 0.4);
  box-shadow: 0 0 20px rgba(255, 213, 79, 0.2);
}

.result-ring--lose {
  border: 2px solid rgba(244, 67, 54, 0.3);
  box-shadow: 0 0 20px rgba(244, 67, 54, 0.15);
}

.result-ring--draw {
  border: 2px solid rgba(189, 189, 189, 0.3);
  box-shadow: 0 0 20px rgba(189, 189, 189, 0.15);
}

@keyframes ring-expand {
  0% { transform: translate(-50%, -50%) scale(0.8); opacity: 0.8; }
  100% { transform: translate(-50%, -50%) scale(1.6); opacity: 0; }
}

.result-text {
  font-family: 'Cinzel', serif;
  font-size: 1.35rem;
  color: #fafafa;
}

.result-streak {
  animation: fade-in-up 0.4s ease-out 0.3s both;
}

@keyframes fade-in-up {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

.result-stats-summary {
  background: rgba(0, 0, 0, 0.35);
  border: 1px solid rgba(255, 255, 255, 0.08);
  font-size: 13px;
}

.next-round-dialog-btn {
  font-weight: 700;
  letter-spacing: 1px;
  transition: transform 0.2s ease;
}

.next-round-dialog-btn:hover {
  transform: translateY(-2px);
}

.exit-title {
  font-family: 'Cinzel', serif;
  font-size: 1.25rem;
  color: #fff;
}

@keyframes pop-in {
  0% { transform: scale(0); }
  100% { transform: scale(1); }
}

/* ─── Responsive & Pantallas Compactas (Todo Visible) ─── */
@media (max-width: 768px), (max-height: 800px) {
  .game-title {
    font-size: 1.1rem !important;
    letter-spacing: 1px !important;
    margin-bottom: 2px !important;
  }
  .table-content {
    padding-top: 2px;
    padding-bottom: 8px;
    padding-left: 4px !important;
    padding-right: 4px !important;
  }
  .top-bar {
    margin-bottom: 4px !important;
    padding-bottom: 4px !important;
  }
  .table-badge-text {
    font-size: 0.52rem !important;
  }
  .hand-row {
    min-height: 104px !important;
    gap: 4px;
  }
  .hand-label {
    margin-bottom: 2px !important;
    font-size: 10px !important;
  }
}
</style>
