<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { useBaccaratStore } from '~/stores/baccarat'
import { useSoundEngine } from '~/composables/useSoundEngine'
import { useConfetti } from '~/composables/useConfetti'
import type { BaccaratBetType } from '~/types/baccarat'
import { CHIP_OPTIONS, CHIP_CONFIG } from '~/constants/ruleta'
import BaccaratRoadmap from '~/components/baccarat/BaccaratRoadmap.vue'
import BaccaratTable from '~/components/baccarat/BaccaratTable.vue'
import GameRulesDialog from '~/components/common/GameRulesDialog.vue'

useHead({
  title: 'Baccarat Royale · Royal Casino',
  meta: [
    {
      name: 'description',
      content: 'Juega al Baccarat Punto Banco en Royal Casino. Apuesta al Jugador, al Banco o al Empate con el clásico reglamento oficial y zapato de 8 barajas.',
    },
  ],
})

const router = useRouter()
const nuxtApp = useNuxtApp()
const store = useBaccaratStore(nuxtApp.$pinia)
const sound = useSoundEngine()
const effects = useConfetti()

const {
  selectedChip,
  bets,
  status,
  playerHand,
  bankerHand,
  lastOutcome,
  stats,
  history,
  chips,
  totalBet,
  isDealing,
  canDeal,
  lastPlacedBets,
} = storeToRefs(store)

const showRulesDialog = ref(false)
const showExitConfirmDialog = ref(false)
const showRefillDialog = ref(false)
const displayedWin = ref(0)
let counterRaf: number | null = null

// ─── Handlers de Apuesta y Reparto ─────────────────────────
function handlePlaceBet(type: BaccaratBetType) {
  if (isDealing.value) return
  if (status.value === 'result') {
    store.resetRound()
  }
  const success = store.placeBet(type)
  if (!success && chips.value < selectedChip.value) {
    if (chips.value === 0 && totalBet.value === 0) {
      showRefillDialog.value = true
    }
  }
}

async function handleDeal() {
  if (!canDeal.value || isDealing.value) return
  if (status.value === 'result') {
    store.resetRound()
  }
  displayedWin.value = 0
  sound.playShuffle()

  // Iniciar reparto con sonidos secuenciales
  setTimeout(() => sound.playCardDeal(), 250)
  setTimeout(() => sound.playCardDeal(), 500)
  setTimeout(() => sound.playCardDeal(), 750)
  setTimeout(() => sound.playCardDeal(), 1000)

  await store.dealRound()
  celebrate()
}

// ─── Celebración de Premios ────────────────────────────────
function celebrate() {
  const outcome = lastOutcome.value
  if (!outcome) return

  if (outcome.totalWon > 0) {
    animateWinCounter(outcome.totalWon)
    const isBigWin = outcome.winningBets.some((b) => b.multiplier >= 8)

    if (isBigWin) {
      sound.playJackpot()
      effects.launchConfetti(3500)
      effects.floatingText(`+${outcome.totalWon.toLocaleString()} 💎`, '#ffd54f')
    } else {
      sound.playWin()
      sound.playCoinCascade(8)
      effects.launchConfetti(2000)
      effects.floatingText(`+${outcome.totalWon.toLocaleString()} 🪙`, '#69f0ae')
    }
  } else {
    sound.playBust()
    effects.screenShake(4, 300)
  }
}

function animateWinCounter(target: number, duration = 1000) {
  if (counterRaf) cancelAnimationFrame(counterRaf)
  const start = performance.now()
  const step = (t: number) => {
    const k = Math.min(1, (t - start) / duration)
    const eased = 1 - Math.pow(1 - k, 3)
    displayedWin.value = Math.round(target * eased)
    counterRaf = k < 1 ? requestAnimationFrame(step) : null
  }
  counterRaf = requestAnimationFrame(step)
}

function handleBack() {
  if (totalBet.value > 0 && !isDealing.value) {
    showExitConfirmDialog.value = true
  } else {
    router.push('/')
  }
}

function confirmExit() {
  store.clearBets()
  showExitConfirmDialog.value = false
  router.push('/')
}

function handleRefill() {
  store.refillChips()
  sound.playCoinCascade(12)
  effects.floatingText('+1,000 🪙', '#ffd54f')
  showRefillDialog.value = false
}

// Atajo de teclado: Barra espaciadora para repartir
function onKeydown(e: KeyboardEvent) {
  if (e.code !== 'Space') return
  const tag = (e.target as HTMLElement | null)?.tagName
  if (tag === 'INPUT' || tag === 'TEXTAREA') return
  e.preventDefault()
  if (showExitConfirmDialog.value || showRefillDialog.value || showRulesDialog.value) return
  handleDeal()
}

onMounted(() => {
  window.addEventListener('keydown', onKeydown)
})

onUnmounted(() => {
  window.removeEventListener('keydown', onKeydown)
  if (counterRaf) cancelAnimationFrame(counterRaf)
  effects.cleanup()
})
</script>

<template>
  <div class="baccarat-room">
    <!-- Luces ambientales -->
    <div class="room-glow room-glow--1" />
    <div class="room-glow room-glow--2" />

    <div class="room-content">
      <!-- ═══ Barra Superior Compacta con Botón de Reglas y Saldo ═══ -->
      <header class="top-compact-bar px-3 py-1 mb-2">
        <!-- Izquierda: Volver al Casino -->
        <div class="d-flex align-center ga-2">
          <v-btn
            id="back-to-casino-btn"
            variant="tonal"
            color="amber-lighten-2"
            size="small"
            prepend-icon="mdi-arrow-left"
            rounded="pill"
            class="back-btn"
            @click="handleBack"
          >
            Volver al Casino
          </v-btn>
        </div>

        <!-- Centro: Título + Botón de Reglas / ¿Cómo Jugar? -->
        <div class="d-flex align-center ga-3 header-center">
          <div class="compact-title d-flex align-center ga-1">
            <v-icon color="amber" size="20">mdi-cards-diamond</v-icon>
            <span class="title-text">BACCARAT ROYALE</span>
          </div>

          <div class="divider-v" />

          <!-- Botón de Instrucciones de Juego -->
          <v-btn
            id="baccarat-rules-btn"
            variant="tonal"
            color="amber-lighten-2"
            size="x-small"
            rounded="pill"
            prepend-icon="mdi-help-circle-outline"
            class="rules-btn font-weight-bold"
            @click="showRulesDialog = true"
          >
            ¿Cómo Jugar?
          </v-btn>
        </div>

        <!-- Derecha: Recarga rápida + Saldo Compartido -->
        <div class="d-flex align-center ga-2">
          <v-btn
            v-if="chips < 10"
            variant="elevated"
            color="amber-darken-2"
            size="small"
            rounded="pill"
            prepend-icon="mdi-plus-circle"
            class="elevation-4 refill-alert-btn"
            @click="handleRefill"
          >
            +1,000 Fichas
          </v-btn>

          <div class="balance-pill">
            <v-icon color="amber" size="18" class="mr-1.5">mdi-poker-chip</v-icon>
            <span class="balance-value">{{ chips.toLocaleString() }}</span>
            <span class="balance-label ml-1">fichas</span>
          </div>
        </div>
      </header>

      <!-- ═══ Tira de Tendencias / Bead Plate ═══ -->
      <div class="mb-3">
        <BaccaratRoadmap :history="history" :stats="stats" />
      </div>

      <!-- ═══ Mesa de Juego del Baccarat (Manos + Tapete) ═══ -->
      <main class="table-stage mb-3">
        <BaccaratTable
          :player-hand="playerHand"
          :banker-hand="bankerHand"
          :bets="bets"
          :disabled="isDealing"
          :is-dealing="isDealing"
          :winner="status === 'result' && lastOutcome ? lastOutcome.winner : null"
          @place-bet="handlePlaceBet"
        />

        <!-- Banner de Resultado de la Ronda -->
        <transition name="slide-fade">
          <div
            v-if="status === 'result' && lastOutcome"
            class="result-banner mt-3 pa-3 text-center"
            :class="{
              'result-banner--win': lastOutcome.totalWon > 0,
              'result-banner--lose': lastOutcome.totalWon === 0,
            }"
          >
            <div class="d-flex align-center justify-center ga-3">
              <span class="result-headline">
                {{ lastOutcome.winner === 'player' ? '¡JUGADOR GANA!' : lastOutcome.winner === 'banker' ? '¡BANCO GANA!' : '¡EMPATE!' }}
              </span>
              <span class="result-score-tag">
                {{ lastOutcome.playerScore }} vs {{ lastOutcome.bankerScore }}
              </span>
            </div>

            <div v-if="lastOutcome.totalWon > 0" class="win-chips mt-1">
              +{{ displayedWin.toLocaleString() }} fichas
            </div>
            <div v-else class="lose-sub mt-1">
              Gana {{ lastOutcome.winner === 'player' ? 'el Jugador' : lastOutcome.winner === 'banker' ? 'el Banco' : 'Empate' }}
            </div>
          </div>
        </transition>
      </main>

      <!-- ═══ Panel de Control de Fichas y Reparto ═══ -->
      <footer class="controls-panel pa-3">
        <!-- Fila de Fichas -->
        <div class="d-flex align-center justify-center flex-wrap ga-3 mb-3">
          <div
            v-for="chip in CHIP_OPTIONS"
            :key="chip"
            class="chip-selector-item"
            :class="{
              'chip-selector-item--active': selectedChip === chip,
              'chip-selector-item--disabled': chip > chips && !isDealing,
            }"
            :style="{
              '--c-bg': CHIP_CONFIG[chip].color,
              '--c-border': CHIP_CONFIG[chip].border,
              '--c-text': CHIP_CONFIG[chip].textColor,
            }"
            @click="sound.playChipClick(); store.selectChip(chip)"
          >
            <div class="chip-inner">
              <v-icon size="14" class="mr-0.5">mdi-poker-chip</v-icon>
              <span>{{ chip }}</span>
            </div>
          </div>
        </div>

        <!-- Fila de Botones y Total -->
        <div class="d-flex align-center justify-space-between flex-wrap ga-3">
          <!-- Apuesta Total -->
          <div class="total-bet-display">
            <span class="total-bet-label">APUESTA TOTAL</span>
            <div class="d-flex align-center">
              <v-icon color="amber" size="20" class="mr-1">mdi-poker-chip</v-icon>
              <span class="total-bet-val">{{ totalBet.toLocaleString() }}</span>
              <span class="total-bet-sub ml-1">fichas</span>
            </div>
          </div>

          <!-- Acciones de Apuesta -->
          <div class="d-flex align-center ga-2 flex-wrap">
            <v-btn
              variant="outlined"
              color="grey-lighten-1"
              size="small"
              rounded="lg"
              prepend-icon="mdi-close-circle-outline"
              :disabled="isDealing || totalBet === 0"
              @click="sound.playButtonClick(); store.clearBets()"
            >
              Limpiar
            </v-btn>

            <v-btn
              variant="outlined"
              color="blue-grey-lighten-2"
              size="small"
              rounded="lg"
              prepend-icon="mdi-undo"
              :disabled="isDealing || totalBet === 0"
              @click="sound.playButtonClick(); store.undoBet()"
            >
              Deshacer
            </v-btn>

            <v-btn
              variant="tonal"
              color="amber-lighten-1"
              size="small"
              rounded="lg"
              prepend-icon="mdi-multiplication"
              :disabled="isDealing || totalBet === 0 || totalBet > chips"
              @click="sound.playChipStack(); store.doubleBets()"
            >
              Doblar ×2
            </v-btn>

            <v-btn
              v-if="lastPlacedBets"
              variant="tonal"
              color="cyan-lighten-2"
              size="small"
              rounded="lg"
              prepend-icon="mdi-history"
              :disabled="isDealing"
              @click="sound.playChipStack(); store.rebet()"
            >
              Repetir
            </v-btn>
          </div>

          <!-- Botón REPARTIR -->
          <v-btn
            id="baccarat-deal-btn"
            size="large"
            color="amber-darken-2"
            variant="elevated"
            rounded="xl"
            class="deal-btn px-8 elevation-8"
            :loading="isDealing"
            :disabled="!canDeal"
            prepend-icon="mdi-cards-playing-outline"
            @click="handleDeal"
          >
            {{ isDealing ? 'REPARTIENDO...' : 'REPARTIR' }}
          </v-btn>
        </div>
      </footer>
    </div>

    <!-- Diálogo de Instrucciones y Reglas Oficiales -->
    <GameRulesDialog v-model="showRulesDialog" game="baccarat" />

    <!-- Diálogo de Confirmación de Salida -->
    <v-dialog v-model="showExitConfirmDialog" max-width="420">
      <v-card class="dialog-card pa-4" rounded="xl">
        <v-card-title class="d-flex align-center ga-2">
          <v-icon color="amber" size="26">mdi-alert-circle</v-icon>
          <span class="dialog-heading">¿Volver al Casino?</span>
        </v-card-title>
        <v-card-text>
          Tienes <strong>{{ totalBet.toLocaleString() }} fichas</strong> apostadas en la mesa de Baccarat. Si sales ahora, se reembolsarán a tu saldo.
        </v-card-text>
        <v-card-actions class="d-flex justify-end ga-2">
          <v-btn variant="text" @click="showExitConfirmDialog = false">Cancelar</v-btn>
          <v-btn color="amber-darken-2" variant="elevated" @click="confirmExit">Reembolsar y Salir</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Diálogo de Recarga Gratuita -->
    <v-dialog v-model="showRefillDialog" max-width="400">
      <v-card class="dialog-card pa-4 text-center" rounded="xl">
        <v-card-title class="justify-center">
          <v-icon color="amber" size="48">mdi-gift</v-icon>
        </v-card-title>
        <h2 class="dialog-heading mb-2">¡Bono de Fichas Gratis!</h2>
        <v-card-text>
          Te has quedado sin fichas. En Royal Casino recibe <strong>1,000 fichas gratis</strong> para seguir jugando.
        </v-card-text>
        <v-card-actions class="justify-center mt-2">
          <v-btn
            size="large"
            color="amber-darken-2"
            variant="elevated"
            rounded="pill"
            prepend-icon="mdi-poker-chip"
            @click="handleRefill"
          >
            Reclamar 1,000 Fichas
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<style scoped>
.baccarat-room {
  position: relative;
  min-height: 100vh;
  background: radial-gradient(circle at 50% 25%, #101c2e 0%, #0a111a 50%, #05080e 100%);
  color: #fff;
  padding: 8px 12px 24px;
  overflow-x: hidden;
}

.room-glow {
  position: fixed;
  border-radius: 50%;
  pointer-events: none;
  filter: blur(120px);
  z-index: 0;
  opacity: 0.35;
}

.room-glow--1 {
  width: 480px;
  height: 480px;
  background: #01579b;
  top: -100px;
  left: 10%;
}

.room-glow--2 {
  width: 500px;
  height: 500px;
  background: #b71c1c;
  bottom: -100px;
  right: 10%;
}

.room-content {
  position: relative;
  z-index: 1;
  width: 100%;
  max-width: 1300px;
  margin: 0 auto;
}

/* ═══ Barra Superior ═══ */
.top-compact-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: rgba(14, 20, 32, 0.75);
  border: 1px solid rgba(255, 213, 79, 0.2);
  border-radius: 30px;
  backdrop-filter: blur(10px);
}

.back-btn {
  font-family: 'Cinzel', serif;
  font-weight: 700;
  letter-spacing: 0.5px;
}

.header-center {
  background: rgba(0, 0, 0, 0.35);
  border: 1px solid rgba(255, 213, 79, 0.15);
  border-radius: 20px;
  padding: 3px 14px;
}

.compact-title {
  font-family: 'Cinzel', serif;
  font-weight: 900;
  letter-spacing: 1.5px;
  color: #ffd54f;
  font-size: 0.85rem;
}

.divider-v {
  width: 1px;
  height: 18px;
  background: rgba(255, 213, 79, 0.25);
}

.rules-btn {
  letter-spacing: 0.5px;
  font-size: 0.72rem;
}

.balance-pill {
  display: flex;
  align-items: center;
  background: rgba(0, 0, 0, 0.55);
  border: 1.5px solid rgba(255, 213, 79, 0.4);
  border-radius: 20px;
  padding: 4px 14px;
}

.balance-value {
  font-family: 'Cinzel', serif;
  font-size: 1.15rem;
  font-weight: 900;
  color: #ffd54f;
  text-shadow: 0 0 8px rgba(255, 213, 79, 0.5);
}

.balance-label {
  font-size: 0.7rem;
  color: rgba(255, 255, 255, 0.5);
}

/* ═══ Banner de Resultado ═══ */
.result-banner {
  border-radius: 14px;
  backdrop-filter: blur(10px);
}

.result-banner--win {
  background: linear-gradient(135deg, rgba(27, 94, 32, 0.9) 0%, rgba(13, 50, 20, 0.95) 100%);
  border: 2px solid #69f0ae;
  box-shadow: 0 0 25px rgba(105, 240, 174, 0.35);
}

.result-banner--lose {
  background: linear-gradient(135deg, rgba(38, 50, 56, 0.9) 0%, rgba(20, 28, 32, 0.95) 100%);
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.result-headline {
  font-family: 'Cinzel', serif;
  font-size: 1.2rem;
  font-weight: 900;
  color: #ffd54f;
  letter-spacing: 2px;
}

.result-score-tag {
  background: rgba(0, 0, 0, 0.4);
  border: 1px solid rgba(255, 213, 79, 0.4);
  border-radius: 12px;
  padding: 2px 10px;
  font-size: 0.8rem;
  font-weight: 800;
  color: #fff;
}

.win-chips {
  font-family: 'Cinzel', serif;
  font-size: 1.4rem;
  font-weight: 900;
  color: #69f0ae;
  text-shadow: 0 0 10px rgba(105, 240, 174, 0.5);
}

.lose-sub {
  font-size: 0.8rem;
  color: rgba(255, 255, 255, 0.6);
}

/* ═══ Panel de Control ═══ */
.controls-panel {
  background: rgba(13, 20, 32, 0.75);
  border: 1px solid rgba(255, 213, 79, 0.2);
  border-radius: 16px;
  backdrop-filter: blur(10px);
}

.chip-selector-item {
  width: 52px;
  height: 52px;
  border-radius: 50%;
  background: radial-gradient(circle at 35% 30%, var(--c-bg), #0a0e14);
  border: 3px dashed var(--c-border);
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  user-select: none;
}

.chip-selector-item:hover:not(.chip-selector-item--disabled) {
  transform: translateY(-3px) scale(1.08);
  box-shadow: 0 8px 18px rgba(0, 0, 0, 0.7), 0 0 12px var(--c-bg);
}

.chip-selector-item--active {
  transform: translateY(-5px) scale(1.15) !important;
  border-color: #ffffff !important;
  box-shadow: 0 8px 25px rgba(255, 213, 79, 0.7), 0 0 16px var(--c-bg) !important;
}

.chip-selector-item--disabled {
  opacity: 0.35;
  cursor: not-allowed;
  filter: grayscale(0.8);
}

.chip-inner {
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--c-text);
  font-family: 'Cinzel', serif;
  font-size: 0.85rem;
  font-weight: 900;
}

.total-bet-display {
  display: flex;
  flex-direction: column;
  background: rgba(0, 0, 0, 0.45);
  border: 1px solid rgba(255, 213, 79, 0.3);
  border-radius: 12px;
  padding: 4px 16px;
}

.total-bet-label {
  font-size: 0.62rem;
  letter-spacing: 1.5px;
  color: rgba(255, 255, 255, 0.6);
  font-weight: 700;
}

.total-bet-val {
  font-family: 'Cinzel', serif;
  font-size: 1.3rem;
  font-weight: 900;
  color: #ffd54f;
  text-shadow: 0 0 8px rgba(255, 213, 79, 0.4);
}

.total-bet-sub {
  font-size: 0.75rem;
  color: rgba(255, 255, 255, 0.5);
}

.deal-btn {
  font-family: 'Cinzel', serif;
  font-weight: 900;
  letter-spacing: 2px;
  background: linear-gradient(135deg, #ffb300 0%, #ff8f00 50%, #f57f17 100%) !important;
  color: #120c02 !important;
  min-height: 50px;
}

.deal-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 0 25px rgba(255, 179, 0, 0.7) !important;
}

.dialog-card {
  background: #101624 !important;
  border: 1px solid rgba(255, 213, 79, 0.3);
  color: #fff;
}

.dialog-heading {
  font-family: 'Cinzel', serif;
  font-weight: 800;
  color: #ffd54f;
}

.slide-fade-enter-active { transition: all 0.3s ease-out; }
.slide-fade-leave-active { transition: all 0.2s cubic-bezier(1, 0.5, 0.8, 1); }
.slide-fade-enter-from, .slide-fade-leave-to { transform: translateY(15px); opacity: 0; }
</style>
