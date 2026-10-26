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
import RechargeDialog from '~/components/common/RechargeDialog.vue'

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
const showRechargeModal = ref(false)
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
  showRefillDialog.value = false
  showRechargeModal.value = true
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
            <span class="d-none d-sm-inline">Volver al Casino</span>
            <span class="d-inline d-sm-none">Lobby</span>
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
            variant="elevated"
            color="amber-darken-2"
            size="small"
            rounded="pill"
            prepend-icon="mdi-cash-plus"
            class="elevation-4 refill-alert-btn"
            @click="showRechargeModal = true"
          >
            + Recargar
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
        <!-- Fila de Fichas 8-Bit -->
        <div class="d-flex align-center justify-center flex-wrap ga-3 mb-3">
          <div
            v-for="chip in CHIP_OPTIONS"
            :key="chip"
            class="chip-selector-item"
            :class="{
              'chip-selector-item--disabled': chip > chips && !isDealing,
            }"
            :title="`Ficha de ${chip}`"
            @click="sound.playChipClick(); store.selectChip(chip)"
          >
            <PixelChip
              :value="chip"
              size="md"
              :active="selectedChip === chip"
              :disabled="chip > chips && !isDealing"
            />
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

    <!-- Diálogo de Saldo Insuficiente -->
    <v-dialog v-model="showRefillDialog" max-width="440">
      <v-card class="dialog-card pa-4 text-center" rounded="xl">
        <v-card-title class="justify-center">
          <v-icon color="amber" size="48">mdi-cash-remove</v-icon>
        </v-card-title>
        <h2 class="dialog-heading mb-2">¡Fichas Insuficientes!</h2>
        <v-card-text>
          Te has quedado sin fichas en tu cuenta. Para continuar jugando en el Baccarat Royale, canjea un código de recarga en el cajero.
        </v-card-text>
        <v-card-actions class="justify-center mt-2 ga-2">
          <v-btn variant="text" @click="showRefillDialog = false">Cerrar</v-btn>
          <v-btn
            size="large"
            color="amber-darken-2"
            variant="elevated"
            rounded="pill"
            prepend-icon="mdi-cash-plus"
            @click="handleRefill"
          >
            Abrir Cajero
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Diálogo de Recarga por Códigos -->
    <RechargeDialog v-model="showRechargeModal" />
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
  background: #0d121c;
  border: 2px solid #ffd54f;
  border-radius: 0;
  box-shadow: 3px 3px 0 #000;
}

.back-btn {
  font-family: 'Press Start 2P', monospace;
  font-size: 0.55rem;
  letter-spacing: 0;
}

.header-center {
  background: #06090f;
  border: 1px solid rgba(255, 213, 79, 0.4);
  border-radius: 0;
  padding: 4px 12px;
}

.compact-title {
  font-family: 'Press Start 2P', monospace;
  font-weight: 700;
  letter-spacing: 0;
  color: #ffd54f;
  font-size: 0.68rem;
}

.divider-v {
  width: 2px;
  height: 18px;
  background: rgba(255, 213, 79, 0.4);
}

.rules-btn {
  font-family: 'Press Start 2P', monospace;
  letter-spacing: 0;
  font-size: 0.52rem;
}

.balance-pill {
  display: flex;
  align-items: center;
  background: #000;
  border: 2px solid #ffd54f;
  border-radius: 0;
  padding: 4px 10px;
  box-shadow: 2px 2px 0 #000;
}

.balance-value {
  font-family: 'Press Start 2P', monospace;
  font-size: 0.78rem;
  font-weight: 700;
  color: #ffd54f;
  text-shadow: 1px 1px 0 #000;
}

.balance-label {
  font-family: 'Press Start 2P', monospace;
  font-size: 0.48rem;
  color: rgba(255, 255, 255, 0.6);
}

/* ═══ Banner de Resultado ═══ */
.result-banner {
  border-radius: 0;
  border: 3px solid #ffe600;
  box-shadow: 4px 4px 0 #000;
}

.result-banner--win {
  background: #05260f;
  border-color: #22c55e;
  box-shadow: 0 0 16px rgba(34, 197, 94, 0.4), 4px 4px 0 #000;
}

.result-banner--lose {
  background: #1e1115;
  border-color: #ef4444;
  box-shadow: 4px 4px 0 #000;
}

.result-headline {
  font-family: 'Press Start 2P', monospace;
  font-size: 0.8rem;
  font-weight: 700;
  color: #ffd54f;
  letter-spacing: 0;
}

.result-score-tag {
  background: #000;
  border: 2px solid #ffd54f;
  border-radius: 0;
  padding: 3px 8px;
  font-family: 'Press Start 2P', monospace;
  font-size: 0.62rem;
  font-weight: 700;
  color: #fff;
}

.win-chips {
  font-family: 'Press Start 2P', monospace;
  font-size: 0.95rem;
  font-weight: 700;
  color: #69f0ae;
  text-shadow: 2px 2px 0 #000;
}

.lose-sub {
  font-family: 'Press Start 2P', monospace;
  font-size: 0.58rem;
  color: rgba(255, 255, 255, 0.7);
}

/* ═══ Panel de Control ═══ */
.controls-panel {
  background: #0b111c;
  border: 2px solid #ffd54f;
  border-radius: 0;
  box-shadow: 4px 4px 0 #000;
}

.chip-selector-item {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  user-select: none;
  background: none;
  border: none;
  padding: 0;
  transition: transform 0.15s ease;
}

.chip-selector-item--disabled {
  opacity: 0.35;
  cursor: not-allowed;
  pointer-events: none;
}

.chip-inner {
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--c-text);
  font-family: 'Press Start 2P', monospace;
  font-size: 0.58rem;
  font-weight: 700;
}

.total-bet-display {
  display: flex;
  flex-direction: column;
  background: #000;
  border: 2px solid #ffd54f;
  border-radius: 0;
  box-shadow: 2px 2px 0 #000;
  padding: 4px 12px;
}

.total-bet-label {
  font-family: 'Press Start 2P', monospace;
  font-size: 0.48rem;
  letter-spacing: 0;
  color: rgba(255, 255, 255, 0.7);
  font-weight: 700;
}

.total-bet-val {
  font-family: 'Press Start 2P', monospace;
  font-size: 0.85rem;
  font-weight: 700;
  color: #ffd54f;
  text-shadow: 1px 1px 0 #000;
}

.total-bet-sub {
  font-family: 'Press Start 2P', monospace;
  font-size: 0.48rem;
  color: rgba(255, 255, 255, 0.5);
}

.deal-btn {
  font-family: 'Press Start 2P', monospace !important;
  font-size: 0.72rem !important;
  font-weight: 700;
  letter-spacing: -0.5px;
  background: #ffd54f !important;
  color: #000 !important;
  border: 2px solid #000 !important;
  box-shadow: 4px 4px 0 #000 !important;
  border-radius: 0 !important;
  min-height: 48px;
}

.deal-btn:hover:not(:disabled) {
  transform: translate(-2px, -2px);
  box-shadow: 6px 6px 0 #000 !important;
}

.dialog-card {
  background: #0c1017 !important;
  border: 3px solid #ffd54f !important;
  box-shadow: 6px 6px 0 #000 !important;
  border-radius: 0 !important;
  color: #fff;
}

.dialog-heading {
  font-family: 'Press Start 2P', monospace;
  font-size: 0.75rem;
  font-weight: 700;
  color: #ffd54f;
}

.slide-fade-enter-active { transition: all 0.3s ease-out; }
.slide-fade-leave-active { transition: all 0.2s cubic-bezier(1, 0.5, 0.8, 1); }
.slide-fade-enter-from, .slide-fade-leave-to { transform: translateY(15px); opacity: 0; }

@media (max-width: 768px), (max-height: 800px) {
  .baccarat-room {
    padding: 4px 6px 8px;
    min-height: 100vh;
  }
  .top-compact-bar {
    flex-wrap: wrap;
    padding: 4px 6px !important;
    gap: 4px;
    margin-bottom: 4px !important;
  }
  .header-center {
    order: 3;
    width: 100%;
    justify-content: center;
    margin-top: 2px;
  }
  .mb-3 {
    margin-bottom: 4px !important;
  }
  .refill-alert-btn {
    font-size: 0.58rem !important;
    padding: 0 6px !important;
  }
}
</style>
