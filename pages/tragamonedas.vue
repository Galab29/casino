<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { useSlotsStore } from '~/stores/slots'
import { useSoundEngine } from '~/composables/useSoundEngine'
import { useConfetti } from '~/composables/useConfetti'
import { getMaxPayout, getSymbol } from '~/constants/slotMachines'
import type { MachineTier, SlotMachineConfig } from '~/types/slots'
import GameRulesDialog from '~/components/common/GameRulesDialog.vue'
import RechargeDialog from '~/components/common/RechargeDialog.vue'

useHead({
  title: 'Tragamonedas · Royal Casino',
  meta: [
    {
      name: 'description',
      content: 'Juega a 3 tragamonedas: Fruit Classic, Golden Deluxe y Royal Jackpot. Más riesgo, más premio.',
    },
  ],
})

const router = useRouter()
const nuxtApp = useNuxtApp()
const store = useSlotsStore(nuxtApp.$pinia)
const sound = useSoundEngine()
const effects = useConfetti()

const {
  selectedId,
  machine,
  reels,
  spinId,
  status,
  isSpinning,
  canSpin,
  canAfford,
  isBroke,
  chips,
  lastOutcome,
  currentStats,
  history,
  sessionNet,
} = storeToRefs(store)

const machines = store.machines

// ─── v-model del selector conectado a la acción del store ──
const selectedMachine = computed<MachineTier>({
  get: () => selectedId.value,
  set: (id) => store.selectMachine(id),
})

// ─── Estado local de la vista ──────────────────────────────
const stoppedReels = ref(0)
const displayedWin = ref(0)
const showRulesDialog = ref(false)
const showJackpotDialog = ref(false)
const showResetStatsDialog = ref(false)
const showRechargeModal = ref(false)
const jackpotAmount = ref(0)

let tickTimer: ReturnType<typeof setInterval> | null = null
let counterRaf: number | null = null

// ─── Computed de presentación ──────────────────────────────
const reelSymbols = computed(() => reels.value.map((id) => getSymbol(machine.value, id)))

const isWinning = computed(
  () => status.value === 'result' && !!lastOutcome.value && lastOutcome.value.payout > 0,
)

const winningSymbol = computed(() =>
  lastOutcome.value?.winningSymbolId ? getSymbol(machine.value, lastOutcome.value.winningSymbolId) : null,
)

const themeVars = computed(() => ({
  '--m-primary': machine.value.theme.primary,
  '--m-secondary': machine.value.theme.secondary,
  '--m-glow': machine.value.theme.glow,
  '--m-gradient': machine.value.theme.gradient,
}))

const lcdMessage = computed(() => {
  if (isSpinning.value) return '🎰 ¡GIRANDO…!'
  if (status.value === 'result' && lastOutcome.value) {
    if (lastOutcome.value.winLevel === 'jackpot') return `💎 ¡¡JACKPOT!! +${lastOutcome.value.payout.toLocaleString()}`
    if (lastOutcome.value.payout > 0) {
      return `¡3 × ${winningSymbol.value?.name}! +${lastOutcome.value.payout.toLocaleString()}`
    }
    return 'Sin premio · ¡Inténtalo de nuevo!'
  }
  if (!canAfford.value) return 'Fichas insuficientes para esta máquina'
  return `Tirada: ${machine.value.cost} fichas · ¡Tira de la palanca!`
})

const machineWinRate = computed(() => {
  const s = currentStats.value
  return s.spins > 0 ? Math.round((s.wins / s.spins) * 100) : 0
})

function machineById(id: MachineTier): SlotMachineConfig {
  return machines.find((m) => m.id === id) ?? machines[0]
}

// ─── Animación del contador de ganancia ────────────────────
function animateCounter(target: number, duration = 1200) {
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

// ─── Sonido de rodillos girando ────────────────────────────
function startTicking() {
  stopTicking()
  tickTimer = setInterval(() => sound.playReelTick(), 85)
}

function stopTicking() {
  if (tickTimer) {
    clearInterval(tickTimer)
    tickTimer = null
  }
}

// ─── Handlers ──────────────────────────────────────────────
function handleSpin() {
  if (!canSpin.value) return
  sound.playLeverPull()
  const outcome = store.spin()
  if (!outcome) return
  stoppedReels.value = 0
  displayedWin.value = 0
  startTicking()
}

/** Cada SlotReel emite 'stop' al detenerse; cuando paran los 3 se resuelve la tirada */
function handleReelStop() {
  sound.playReelStop()
  stoppedReels.value++
  if (stoppedReels.value < 3) return

  stopTicking()
  store.resolveSpin()
  celebrate()
}

function celebrate() {
  const outcome = lastOutcome.value
  if (!outcome || outcome.payout <= 0) return

  animateCounter(outcome.payout, outcome.winLevel === 'jackpot' ? 2500 : 1200)

  switch (outcome.winLevel) {
    case 'small':
      sound.playWin()
      sound.playCoinCascade(6)
      effects.floatingText(`+${outcome.payout} 🪙`, '#69f0ae')
      break
    case 'big':
      sound.playBlackjack()
      sound.playCoinCascade(14)
      effects.launchConfetti(3000)
      effects.floatingText(`+${outcome.payout.toLocaleString()} 💰`, '#ffd54f')
      break
    case 'jackpot':
      sound.playJackpot()
      effects.launchConfetti(6000)
      setTimeout(() => effects.launchConfetti(4000), 1800)
      jackpotAmount.value = outcome.payout
      showJackpotDialog.value = true
      break
  }
}

function handleMachineChange() {
  sound.playChipClick()
  displayedWin.value = 0
}

function handleBack() {
  router.push('/')
}

function handleRefill() {
  showRechargeModal.value = true
}

function confirmResetStats() {
  store.resetStats()
  showResetStatsDialog.value = false
}

function onKeydown(e: KeyboardEvent) {
  if (e.code !== 'Space') return
  const tag = (e.target as HTMLElement | null)?.tagName
  if (tag === 'INPUT' || tag === 'TEXTAREA') return
  e.preventDefault()
  if (showJackpotDialog.value || showResetStatsDialog.value) return
  handleSpin()
}

onMounted(() => {
  window.addEventListener('keydown', onKeydown)
})

onUnmounted(() => {
  window.removeEventListener('keydown', onKeydown)
  stopTicking()
  if (counterRaf) cancelAnimationFrame(counterRaf)
  // Si el jugador sale a mitad de la tirada, igual se le acredita el premio
  if (isSpinning.value) store.resolveSpin()
  effects.cleanup()
})
</script>

<template>
  <div class="slots-room" :style="themeVars">
    <div class="room-glow room-glow--1" />
    <div class="room-glow room-glow--2" />

    <v-container class="room-content" fluid>
      <!-- ═══ Barra superior ═══ -->
      <v-row align="center" justify="space-between" class="top-bar mb-3 px-2">
        <v-col cols="auto">
          <v-btn
            id="back-to-casino"
            variant="tonal"
            color="amber-lighten-2"
            prepend-icon="mdi-arrow-left"
            rounded="pill"
            class="back-btn elevation-3"
            @click="handleBack"
          >
            <span class="d-none d-sm-inline">Volver al Casino</span>
            <span class="d-inline d-sm-none">Lobby</span>
          </v-btn>
        </v-col>

        <v-col cols="auto" class="d-none d-md-flex">
          <div class="room-badge d-flex align-center ga-2">
            <span class="pulse-dot" />
            <span>Sala de Tragamonedas · 3 máquinas</span>
          </div>
        </v-col>

        <v-col cols="auto" class="d-flex align-center ga-2">
          <v-btn
            id="slots-rules-btn"
            variant="tonal"
            color="amber-lighten-2"
            size="small"
            rounded="pill"
            prepend-icon="mdi-help-circle-outline"
            class="rules-btn font-weight-bold"
            @click="showRulesDialog = true"
          >
            <span class="d-none d-sm-inline">¿Cómo Jugar?</span>
            <span class="d-inline d-sm-none">Reglas</span>
          </v-btn>

          <v-btn
            variant="elevated"
            color="amber-darken-2"
            size="small"
            rounded="pill"
            prepend-icon="mdi-cash-plus"
            class="rules-btn font-weight-bold mr-1"
            @click="showRechargeModal = true"
          >
            + Recargar
          </v-btn>

          <div class="balance-pill">
            <PixelChip :value="100" size="xs" class="mr-2" />
            <span class="balance-value">{{ chips.toLocaleString() }}</span>
            <span class="balance-label ml-1">fichas</span>
          </div>
        </v-col>
      </v-row>

      <!-- ═══ Título ═══ -->
      <h1 class="room-title text-center mb-1">
        <v-icon size="34" class="mr-2 title-icon">mdi-slot-machine</v-icon>
        ROYAL SLOTS
        <v-icon size="34" class="ml-2 title-icon">mdi-slot-machine</v-icon>
      </h1>
      <p class="room-subtitle text-center mb-5">
        Más cara la máquina → mayor premio, pero menor probabilidad de ganar
      </p>

      <!-- ═══ Selector de máquinas ═══ -->
      <SlotMachineSelector
        v-model="selectedMachine"
        :machines="machines"
        :chips="chips"
        :disabled="isSpinning"
        class="mb-6"
        @change="handleMachineChange"
      />

      <v-row>
        <!-- ═══ Gabinete de la máquina ═══ -->
        <v-col cols="12" md="8">
          <section
            class="cabinet"
            :class="{
              'cabinet--spinning': isSpinning,
              'cabinet--win': isWinning,
              'cabinet--jackpot': isWinning && lastOutcome?.winLevel === 'jackpot',
            }"
          >
            <!-- Marquesina -->
            <div class="marquee">
              <div class="bulbs">
                <span v-for="i in 18" :key="`b-${i}`" class="bulb" :style="{ '--i': i }" />
              </div>
              <div class="marquee-title">
                <v-icon size="30" :color="machine.theme.primary" class="mr-2">{{ machine.icon }}</v-icon>
                {{ machine.name }}
              </div>
              <div class="marquee-sub">
                Premio mayor
                <strong>{{ getMaxPayout(machine).toLocaleString() }}</strong>
                fichas
              </div>
            </div>

            <!-- Rodillos + palanca -->
            <div class="cabinet-body">
              <div class="reels-frame">
                <SlotReel
                  v-for="(sym, i) in reelSymbols"
                  :key="`${machine.id}-${i}`"
                  :symbols="machine.symbols"
                  :result="sym"
                  :spin-id="spinId"
                  :duration="machine.spinDuration + i * 450"
                  :accent="machine.theme.primary"
                  :highlight="isWinning"
                  @stop="handleReelStop"
                />
                <div class="payline" :class="{ 'payline--active': isWinning }">
                  <span class="payline-arrow payline-arrow--left" />
                  <span class="payline-arrow payline-arrow--right" />
                </div>
              </div>

              <SlotLever
                class="d-none d-sm-flex"
                :disabled="!canSpin"
                :accent="machine.theme.secondary"
                @pull="handleSpin"
              />
            </div>

            <!-- Pantalla LCD -->
            <div class="lcd">
              <div class="lcd-cell">
                <span class="lcd-label">CRÉDITOS</span>
                <span class="lcd-value">{{ chips.toLocaleString() }}</span>
              </div>
              <div class="lcd-message" :class="{ 'lcd-message--win': isWinning }">
                {{ lcdMessage }}
              </div>
              <div class="lcd-cell lcd-cell--right">
                <span class="lcd-label">GANANCIA</span>
                <span class="lcd-value lcd-value--win">{{ displayedWin.toLocaleString() }}</span>
              </div>
            </div>

            <!-- Controles -->
            <div class="controls">
              <div class="bet-badge">
                <span class="bet-badge-label">APUESTA</span>
                <span class="bet-badge-value">
                  <v-icon size="16" class="mr-1">mdi-poker-chip</v-icon>{{ machine.cost }}
                </span>
              </div>

              <button
                id="spin-button"
                type="button"
                class="spin-btn"
                :disabled="!canSpin"
                @click="handleSpin"
              >
                <v-icon size="26" class="mr-2" :class="{ 'spin-icon--rotating': isSpinning }">mdi-sync</v-icon>
                {{ isSpinning ? 'GIRANDO…' : 'GIRAR' }}
              </button>

              <div class="key-hint">
                <kbd>Espacio</kbd>
                <span>para girar</span>
              </div>
            </div>
          </section>
        </v-col>

        <!-- ═══ Panel lateral ═══ -->
        <v-col cols="12" md="4" class="d-flex flex-column ga-4">
          <SlotPaytable
            :machine="machine"
            :highlight-symbol-id="isWinning ? lastOutcome?.winningSymbolId : null"
          />

          <!-- Estadísticas de la máquina -->
          <v-card class="side-card pa-4" rounded="xl" flat>
            <div class="side-title mb-3 d-flex align-center justify-space-between">
              <span>
                <v-icon size="18" class="mr-1" :color="machine.theme.primary">mdi-chart-box-outline</v-icon>
                ESTADÍSTICAS
              </span>
              <v-btn
                id="reset-slot-stats"
                icon="mdi-restore"
                size="x-small"
                variant="text"
                color="grey-lighten-1"
                title="Reiniciar estadísticas"
                @click="showResetStatsDialog = true"
              />
            </div>
            <div class="stats-grid">
              <div class="stat-box">
                <span class="stat-box-label">Tiradas</span>
                <span class="stat-box-value">{{ currentStats.spins }}</span>
              </div>
              <div class="stat-box">
                <span class="stat-box-label">Aciertos</span>
                <span class="stat-box-value">{{ currentStats.wins }} <small>({{ machineWinRate }}%)</small></span>
              </div>
              <div class="stat-box">
                <span class="stat-box-label">Apostado</span>
                <span class="stat-box-value">{{ currentStats.totalBet.toLocaleString() }}</span>
              </div>
              <div class="stat-box">
                <span class="stat-box-label">Ganado</span>
                <span class="stat-box-value text-green-accent-2">{{ currentStats.totalWon.toLocaleString() }}</span>
              </div>
              <div class="stat-box">
                <span class="stat-box-label">Mayor premio</span>
                <span class="stat-box-value text-amber">{{ currentStats.biggestWin.toLocaleString() }}</span>
              </div>
              <div class="stat-box">
                <span class="stat-box-label">Balance total</span>
                <span
                  class="stat-box-value"
                  :class="sessionNet >= 0 ? 'text-green-accent-2' : 'text-red-lighten-2'"
                >
                  {{ sessionNet >= 0 ? '+' : '' }}{{ sessionNet.toLocaleString() }}
                </span>
              </div>
            </div>
          </v-card>

          <!-- Historial -->
          <v-card class="side-card pa-4" rounded="xl" flat>
            <div class="side-title mb-3">
              <v-icon size="18" class="mr-1" :color="machine.theme.primary">mdi-history</v-icon>
              ÚLTIMAS TIRADAS
            </div>
            <div v-if="history.length === 0" class="empty-history">
              Aún no has girado ninguna máquina.
            </div>
            <TransitionGroup name="history" tag="div" class="history-list">
              <div v-for="h in history" :key="h.id" class="history-row">
                <span
                  class="history-machine"
                  :style="{ color: machineById(h.machineId).theme.primary }"
                >
                  {{ machineById(h.machineId).name.split(' ')[0] }}
                </span>
                <span class="history-symbols">
                  <template v-for="(id, idx) in h.reels" :key="idx">
                    <v-icon
                      v-if="getSymbol(machineById(h.machineId), id).icon"
                      size="16"
                      :color="getSymbol(machineById(h.machineId), id).color"
                    >
                      {{ getSymbol(machineById(h.machineId), id).icon }}
                    </v-icon>
                    <span
                      v-else
                      class="history-text"
                      :style="{ color: getSymbol(machineById(h.machineId), id).color }"
                    >
                      {{ getSymbol(machineById(h.machineId), id).text }}
                    </span>
                  </template>
                </span>
                <span
                  class="history-amount"
                  :class="h.payout > 0 ? 'text-green-accent-2' : 'text-red-lighten-2'"
                >
                  {{ h.payout > 0 ? `+${h.payout.toLocaleString()}` : `-${h.cost}` }}
                </span>
              </div>
            </TransitionGroup>
          </v-card>
        </v-col>
      </v-row>

      <p class="footer-text text-center mt-8">
        <v-icon size="14" class="mr-1">mdi-information-outline</v-icon>
        Juega responsablemente · Solo con fines educativos · El saldo es compartido con el Blackjack
      </p>
    </v-container>

    <!-- ═══ Diálogo JACKPOT ═══ -->
    <v-dialog v-model="showJackpotDialog" max-width="460" persistent>
      <v-card class="jackpot-dialog pa-8 text-center" rounded="xl">
        <div class="jackpot-rays" />
        <v-icon size="80" color="cyan-accent-2" class="jackpot-icon mb-2">mdi-diamond</v-icon>
        <h2 class="jackpot-title">¡¡JACKPOT!!</h2>
        <p class="jackpot-sub mb-4">Has conseguido el premio mayor de {{ machine.name }}</p>
        <div class="jackpot-amount mb-6">+{{ jackpotAmount.toLocaleString() }}</div>
        <v-btn
          id="collect-jackpot"
          color="amber-darken-2"
          size="x-large"
          rounded="lg"
          block
          prepend-icon="mdi-cash-multiple"
          @click="showJackpotDialog = false"
        >
          ¡Cobrar premio!
        </v-btn>
      </v-card>
    </v-dialog>

    <!-- ═══ Diálogo sin fichas ═══ -->
    <v-dialog :model-value="isBroke" max-width="400" persistent>
      <v-card class="info-dialog pa-6 text-center" rounded="xl">
        <v-icon size="54" color="red-lighten-2" class="mb-3">mdi-wallet-outline</v-icon>
        <h3 class="dialog-title mb-2">Te quedaste sin fichas</h3>
        <p class="text-grey-lighten-1 text-body-2 mb-5">
          No tienes saldo suficiente para ninguna máquina. Recarga para seguir jugando.
        </p>
        <v-btn
          id="refill-chips"
          color="amber-darken-2"
          size="large"
          rounded="lg"
          block
          prepend-icon="mdi-cash-plus"
          @click="handleRefill"
        >
          Canjear Código en Cajero
        </v-btn>
      </v-card>
    </v-dialog>

    <!-- Diálogo de Recarga por Códigos -->
    <RechargeDialog v-model="showRechargeModal" />

    <!-- ═══ Diálogo reiniciar estadísticas ═══ -->
    <v-dialog v-model="showResetStatsDialog" max-width="380">
      <v-card class="info-dialog pa-5 text-center" rounded="xl">
        <v-icon size="48" color="red-lighten-2" class="mb-3">mdi-restore-alert</v-icon>
        <h3 class="dialog-title mb-2">Reiniciar Estadísticas</h3>
        <p class="text-grey-lighten-1 mb-4 text-body-2">
          Se borrarán las estadísticas e historial de las 3 máquinas. Tus fichas no cambian.
        </p>
        <v-row dense>
          <v-col cols="6">
            <v-btn variant="outlined" color="grey-lighten-1" rounded="lg" block @click="showResetStatsDialog = false">
              Cancelar
            </v-btn>
          </v-col>
          <v-col cols="6">
            <v-btn color="amber-darken-3" variant="elevated" rounded="lg" block @click="confirmResetStats">
              Reiniciar
            </v-btn>
          </v-col>
        </v-row>
      </v-card>
    </v-dialog>

    <!-- Diálogo de Reglas de Tragamonedas -->
    <GameRulesDialog v-model="showRulesDialog" game="tragamonedas" />
  </div>
</template>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@600;700;900&family=Outfit:wght@300;400;500;600;700&family=Orbitron:wght@500;700;900&display=swap');

/* ─── Sala ─────────────────────────────── */
.slots-room {
  min-height: 100vh;
  position: relative;
  overflow: hidden;
  font-family: 'Outfit', sans-serif;
  color: #fff;
  background: radial-gradient(ellipse at 50% 0%, #1a1426 0%, #0d0a14 45%, #050308 100%);
}

.room-glow {
  position: absolute;
  border-radius: 50%;
  filter: blur(90px);
  pointer-events: none;
  transition: background 0.6s ease;
}

.room-glow--1 {
  width: 620px;
  height: 620px;
  top: -260px;
  left: 50%;
  transform: translateX(-50%);
  background: var(--m-glow);
  opacity: 0.35;
  animation: glow-breathe 9s ease-in-out infinite;
}

.room-glow--2 {
  width: 420px;
  height: 420px;
  bottom: -160px;
  right: -120px;
  background: var(--m-secondary);
  opacity: 0.12;
  animation: glow-breathe-2 12s ease-in-out infinite;
}

@keyframes glow-breathe-2 {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.15); }
}

@keyframes glow-breathe {
  0%, 100% { transform: translateX(-50%) scale(1); }
  50% { transform: translateX(-50%) scale(1.12); }
}

.room-content {
  position: relative;
  z-index: 1;
  max-width: 1240px;
  padding-top: 16px;
  padding-bottom: 48px;
}

/* ─── Barra superior ───────────────────── */
.top-bar {
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  padding-bottom: 12px;
}

.back-btn {
  font-weight: 600;
  text-transform: none;
  background: rgba(0, 0, 0, 0.35) !important;
  border: 1px solid rgba(255, 213, 79, 0.3);
  transition: all 0.3s ease;
}

.back-btn:hover {
  transform: translateX(-4px);
  border-color: #ffd54f;
}

.room-badge {
  background: rgba(0, 0, 0, 0.4);
  padding: 6px 14px;
  border-radius: 4px;
  border: 1px solid rgba(255, 213, 79, 0.3);
}

.balance-value {
  font-family: 'Press Start 2P', monospace;
  font-weight: 700;
  font-size: 0.8rem;
  color: #ffd54f;
  text-shadow: 1px 1px 0 #000;
}

.balance-label {
  font-family: 'Press Start 2P', monospace;
  font-size: 0.5rem;
  color: rgba(255, 255, 255, 0.5);
}

/* ─── Título ───────────────────────────── */
.room-title {
  font-family: 'Press Start 2P', monospace;
  font-weight: 700;
  font-size: 1.25rem;
  letter-spacing: 0;
  background: linear-gradient(135deg, #fff 0%, var(--m-primary) 50%, var(--m-secondary) 100%);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  display: flex;
  align-items: center;
  justify-content: center;
}

.title-icon {
  color: var(--m-primary);
  -webkit-text-fill-color: initial;
  animation: title-wobble 3s ease-in-out infinite;
}

@keyframes title-wobble {
  0%, 100% { transform: rotate(0deg); }
  50% { transform: rotate(-8deg); }
}

.room-subtitle {
  font-family: 'Press Start 2P', monospace;
  color: rgba(255, 255, 255, 0.5);
  letter-spacing: 0;
  font-size: 0.55rem;
}

/* ─── Gabinete ─────────────────────────── */
.cabinet {
  position: relative;
  border-radius: 0;
  padding: 18px 22px 22px;
  background: var(--m-gradient);
  border: 3px solid var(--m-primary);
  box-shadow:
    0 6px 0 #000,
    0 0 35px var(--m-glow),
    inset 0 2px 0 rgba(255, 255, 255, 0.15);
  transition: box-shadow 0.4s ease, border-color 0.4s ease;
}

.cabinet--win {
  animation: cabinet-win 0.5s ease-in-out 6;
}

@keyframes cabinet-win {
  0%, 100% { box-shadow: 0 6px 0 #000, 0 0 35px var(--m-glow); }
  50% { box-shadow: 0 6px 0 #000, 0 0 70px var(--m-primary); }
}

.cabinet--jackpot {
  animation: cabinet-jackpot 0.8s linear infinite;
}

@keyframes cabinet-jackpot {
  0% { border-color: #18ffff; box-shadow: 0 0 90px #18ffff; }
  33% { border-color: #ff4081; box-shadow: 0 0 90px #ff4081; }
  66% { border-color: #ffd740; box-shadow: 0 0 90px #ffd740; }
  100% { border-color: #18ffff; box-shadow: 0 0 90px #18ffff; }
}

/* Marquesina */
.marquee {
  text-align: center;
  margin-bottom: 16px;
}

.bulbs {
  display: flex;
  justify-content: space-between;
  padding: 0 6px;
  margin-bottom: 10px;
}

.bulb {
  width: 8px;
  height: 8px;
  border-radius: 0;
  background: var(--m-primary);
  opacity: 0.2;
  box-shadow: 1px 1px 0 #000;
  animation: bulb-chase 1.6s ease-in-out infinite;
  animation-delay: calc(var(--i) * 0.09s);
}

.cabinet--spinning .bulb {
  animation-duration: 0.45s;
  animation-delay: calc(var(--i) * 0.025s);
}

.cabinet--win .bulb {
  animation: bulb-flash 0.25s steps(2) infinite;
}

@keyframes bulb-chase {
  0%, 100% { opacity: 0.2; box-shadow: 1px 1px 0 #000; }
  50% { opacity: 1; box-shadow: 0 0 10px var(--m-primary), 1px 1px 0 #000; }
}

@keyframes bulb-flash {
  0% { opacity: 0.2; }
  100% { opacity: 1; box-shadow: 0 0 14px var(--m-primary); }
}

.marquee-title {
  font-family: 'Press Start 2P', monospace;
  font-weight: 700;
  font-size: 0.95rem;
  letter-spacing: 0;
  color: var(--m-primary);
  text-shadow: 0 0 18px var(--m-glow), 2px 2px 0 #000;
  display: flex;
  align-items: center;
  justify-content: center;
}

.marquee-sub {
  font-family: 'Press Start 2P', monospace;
  font-size: 0.52rem;
  letter-spacing: 0;
  text-transform: uppercase;
  color: rgba(255, 255, 255, 0.7);
  margin-top: 4px;
}

.marquee-sub strong {
  color: var(--m-primary);
}

/* Rodillos */
.cabinet-body {
  display: flex;
  align-items: center;
  gap: 16px;
}

.reels-frame {
  position: relative;
  flex: 1;
  display: flex;
  gap: 10px;
  padding: 14px;
  border-radius: 0;
  background: #09090b;
  border: 3px solid var(--m-secondary);
  box-shadow: 4px 4px 0 #000, inset 0 0 20px rgba(0, 0, 0, 0.9);
}

.payline {
  position: absolute;
  left: 8px;
  right: 8px;
  top: 50%;
  height: 3px;
  transform: translateY(-50%);
  background: rgba(255, 23, 68, 0.55);
  pointer-events: none;
  border-radius: 0;
  transition: background 0.3s ease, box-shadow 0.3s ease;
}

.payline--active {
  background: var(--m-primary);
  box-shadow: 0 0 14px var(--m-primary), 0 0 28px var(--m-primary);
  animation: payline-flash 0.4s ease-in-out infinite alternate;
}

@keyframes payline-flash {
  from { opacity: 0.5; }
  to { opacity: 1; }
}

.payline-arrow {
  position: absolute;
  top: 50%;
  width: 0;
  height: 0;
  border-top: 9px solid transparent;
  border-bottom: 9px solid transparent;
  transform: translateY(-50%);
}

.payline-arrow--left {
  left: -10px;
  border-left: 12px solid #ff1744;
}

.payline-arrow--right {
  right: -10px;
  border-right: 12px solid #ff1744;
}

/* LCD */
.lcd {
  margin-top: 18px;
  display: grid;
  grid-template-columns: auto 1fr auto;
  align-items: center;
  gap: 14px;
  padding: 10px 16px;
  border-radius: 0;
  background: #000000;
  border: 2px solid #22c55e;
  box-shadow: 3px 3px 0 #000;
}

.lcd-cell {
  display: flex;
  flex-direction: column;
  min-width: 92px;
}

.lcd-cell--right {
  align-items: flex-end;
}

.lcd-label {
  font-family: 'Press Start 2P', monospace;
  font-size: 0.48rem;
  letter-spacing: 0;
  color: rgba(105, 240, 174, 0.7);
}

.lcd-value {
  font-family: 'Press Start 2P', monospace;
  font-weight: 700;
  font-size: 0.8rem;
  color: #69f0ae;
  text-shadow: 1px 1px 0 #000;
  margin-top: 2px;
}

.lcd-value--win {
  color: #ffd740;
  text-shadow: 1px 1px 0 #000;
}

.lcd-message {
  font-family: 'Press Start 2P', monospace;
  font-weight: 700;
  font-size: 0.55rem;
  text-align: center;
  color: #b9f6ca;
  letter-spacing: 0;
}

.lcd-message--win {
  color: #ffd740;
  animation: lcd-blink 0.5s steps(2) 6;
}

@keyframes lcd-blink {
  0% { opacity: 1; }
  100% { opacity: 0.35; }
}

/* Controles */
.controls {
  margin-top: 18px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.bet-badge {
  display: flex;
  flex-direction: column;
  padding: 6px 12px;
  border-radius: 0;
  background: #000;
  border: 2px solid var(--m-primary);
  box-shadow: 2px 2px 0 #000;
  min-width: 96px;
}

.bet-badge-label {
  font-family: 'Press Start 2P', monospace;
  font-size: 0.48rem;
  letter-spacing: 0;
  color: rgba(255, 255, 255, 0.7);
}

.bet-badge-value {
  font-family: 'Press Start 2P', monospace;
  font-weight: 700;
  font-size: 0.8rem;
  color: var(--m-primary);
  display: flex;
  align-items: center;
  margin-top: 2px;
}

.spin-btn {
  position: relative;
  overflow: hidden;
  flex: 1;
  max-width: 320px;
  height: 54px;
  border: 2px solid #000;
  border-radius: 0;
  font-family: 'Press Start 2P', monospace;
  font-weight: 700;
  font-size: 0.82rem;
  letter-spacing: -0.5px;
  color: #000;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #ffd54f;
  box-shadow: 0 4px 0 #000;
  transition: transform 0.1s ease, box-shadow 0.1s ease;
}

.spin-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 0 #000;
}

.spin-btn:active:not(:disabled) {
  transform: translateY(2px);
  box-shadow: 0 2px 0 #000;
}

.spin-btn:disabled {
  cursor: not-allowed;
  filter: grayscale(0.8) brightness(0.6);
}

.spin-icon--rotating {
  animation: rotate 0.6s linear infinite;
}

@keyframes rotate {
  to { transform: rotate(360deg); }
}

.key-hint {
  display: flex;
  flex-direction: column;
  align-items: center;
  font-size: 0.65rem;
  color: rgba(255, 255, 255, 0.45);
  min-width: 96px;
}

kbd {
  font-family: 'Outfit', sans-serif;
  font-size: 0.7rem;
  padding: 2px 8px;
  border-radius: 6px;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-bottom-width: 3px;
  margin-bottom: 2px;
  color: #fff;
}

/* ─── Panel lateral ────────────────────── */
.side-card {
  background: rgba(0, 0, 0, 0.45) !important;
  border: 1px solid rgba(255, 255, 255, 0.08);
  color: #fff;
}

.side-title {
  font-family: 'Cinzel', serif;
  font-weight: 700;
  font-size: 0.85rem;
  letter-spacing: 3px;
  color: rgba(255, 255, 255, 0.8);
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px;
}

.stat-box {
  display: flex;
  flex-direction: column;
  padding: 8px 10px;
  border-radius: 0;
  border: 1px solid rgba(255, 255, 255, 0.12);
  background: rgba(255, 255, 255, 0.03);
}

.stat-box-label {
  font-family: 'Press Start 2P', monospace;
  font-size: 0.45rem;
  letter-spacing: 0;
  text-transform: uppercase;
  color: rgba(255, 255, 255, 0.5);
}

.stat-box-value {
  font-family: 'Press Start 2P', monospace;
  font-weight: 700;
  font-size: 0.72rem;
  margin-top: 4px;
}

.stat-box-value small {
  font-family: 'Press Start 2P', monospace;
  font-size: 0.48rem;
  color: rgba(255, 255, 255, 0.5);
}

.empty-history {
  font-family: 'Press Start 2P', monospace;
  font-size: 0.52rem;
  color: rgba(255, 255, 255, 0.4);
}

.history-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
  max-height: 300px;
  overflow-y: auto;
}

.history-row {
  display: grid;
  grid-template-columns: 80px 1fr auto;
  align-items: center;
  padding: 5px 8px;
  border-radius: 0;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(255, 255, 255, 0.02);
  font-size: 0.65rem;
}

.history-machine {
  font-family: 'Press Start 2P', monospace;
  font-weight: 700;
  font-size: 0.5rem;
  letter-spacing: 0;
}

.history-symbols {
  display: flex;
  gap: 3px;
  align-items: center;
}

.history-text {
  font-family: 'Press Start 2P', monospace;
  font-weight: 700;
  font-size: 0.55rem;
  width: 16px;
  text-align: center;
}

.history-amount {
  font-weight: 700;
  font-family: 'Press Start 2P', monospace;
  font-size: 0.58rem;
}

.history-enter-active {
  transition: all 0.35s ease;
}

.history-enter-from {
  opacity: 0;
  transform: translateX(-16px);
}

.footer-text {
  font-family: 'Press Start 2P', monospace;
  font-size: 0.48rem;
  color: rgba(255, 255, 255, 0.35);
  letter-spacing: 0;
}

/* ─── Diálogos ─────────────────────────── */
.jackpot-dialog {
  position: relative;
  overflow: hidden;
  background: #090312 !important;
  border: 3px solid #18ffff !important;
  border-radius: 0 !important;
  box-shadow: 6px 6px 0 #000, 0 0 40px rgba(24, 255, 255, 0.4);
  color: #fff;
}

.jackpot-rays {
  position: absolute;
  inset: -50%;
  background: repeating-conic-gradient(rgba(24, 255, 255, 0.08) 0deg 10deg, transparent 10deg 20deg);
  animation: rotate 12s linear infinite;
  pointer-events: none;
}

.jackpot-dialog > *:not(.jackpot-rays) {
  position: relative;
}

.jackpot-icon {
  filter: drop-shadow(0 0 20px #18ffff);
  animation: win-bounce 0.8s ease-in-out infinite alternate;
}

@keyframes win-bounce {
  from { transform: translateY(0) scale(1); }
  to { transform: translateY(-8px) scale(1.08); }
}

.jackpot-title {
  font-family: 'Press Start 2P', monospace;
  font-weight: 700;
  font-size: 1.35rem;
  letter-spacing: 0;
  background: linear-gradient(90deg, #18ffff, #ff4081, #ffd740, #18ffff);
  background-size: 300% 100%;
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  animation: gradient-move 2s linear infinite;
}

@keyframes gradient-move {
  to { background-position: 300% 0; }
}

.jackpot-sub {
  font-family: 'Press Start 2P', monospace;
  font-size: 0.6rem;
  color: rgba(255, 255, 255, 0.7);
}

.jackpot-amount {
  font-family: 'Press Start 2P', monospace;
  font-weight: 700;
  font-size: 1.4rem;
  color: #ffd740;
  text-shadow: 2px 2px 0 #000;
}

.info-dialog {
  background: #0c1017 !important;
  border: 3px solid rgba(255, 213, 79, 0.5) !important;
  border-radius: 0 !important;
  box-shadow: 6px 6px 0 #000 !important;
  color: #fff;
}

.dialog-title {
  font-family: 'Press Start 2P', monospace;
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0;
}

/* ─── Responsive & Pantallas Compactas (Todo Visible) ─── */
@media (max-width: 768px), (max-height: 800px) {
  .room-content {
    padding-top: 4px !important;
    padding-bottom: 16px !important;
  }
  .room-title {
    font-size: 1.1rem !important;
    letter-spacing: 1px !important;
    margin-bottom: 2px !important;
  }
  .room-subtitle {
    display: none !important;
  }
  .cabinet {
    padding: 10px 8px 12px !important;
  }
  .marquee-title {
    font-size: 1.1rem !important;
  }
  .reels-frame {
    gap: 4px !important;
    padding: 6px !important;
  }
  .lcd {
    grid-template-columns: 1fr 1fr;
    gap: 4px !important;
    margin-bottom: 8px !important;
  }
  .lcd-message {
    grid-column: 1 / -1;
    grid-row: 1;
  }
  .controls {
    flex-wrap: wrap;
    gap: 6px !important;
  }
  .spin-btn {
    order: -1;
    flex-basis: 100%;
    max-width: none;
    min-height: 42px !important;
  }
  .key-hint {
    display: none;
  }
}
</style>
