<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { useRuletaStore } from '~/stores/ruleta'
import { useSoundEngine } from '~/composables/useSoundEngine'
import { useConfetti } from '~/composables/useConfetti'
import type { BetType } from '~/types/ruleta'
import { RED_NUMBERS } from '~/constants/ruleta'
import GameRulesDialog from '~/components/common/GameRulesDialog.vue'
import AdrenalineBanner from '~/components/idle/AdrenalineBanner.vue'

useHead({
  title: 'Ruleta Europea · Royal Casino',
  meta: [
    {
      name: 'description',
      content: 'Juega a la Ruleta Europea en Royal Casino. 37 casillas con un solo cero, apuestas interiores y exteriores y pagos de hasta 35 a 1.',
    },
  ],
})

const router = useRouter()
const nuxtApp = useNuxtApp()
const store = useRuletaStore(nuxtApp.$pinia)
const sound = useSoundEngine()
const effects = useConfetti()

const {
  selectedChip,
  bets,
  status,
  winningNumber,
  lastOutcome,
  stats,
  history,
  chips,
  totalBet,
  isSpinning,
  canSpin,
  lastPlacedBets,
} = storeToRefs(store)

const wheelCabinetRef = ref<HTMLElement | null>(null)
const showRulesDialog = ref(false)
const showExitConfirmDialog = ref(false)
const showRefillDialog = ref(false)
const showStatsDialog = ref(false)
const displayedWin = ref(0)
let counterRaf: number | null = null

// ─── Handlers de Apuestas y Acciones ───────────────────────
function handlePlaceBet(type: BetType, target: string | number, label: string) {
  if (isSpinning.value) return
  if (status.value === 'result') {
    store.resetRound()
  }
  const success = store.placeBet(type, target, label)
  if (!success && chips.value < selectedChip.value) {
    if (chips.value === 0 && totalBet.value === 0) {
      showRefillDialog.value = true
    }
  }
}

function handleSpin() {
  if (!canSpin.value || isSpinning.value) return
  if (status.value === 'result') {
    store.resetRound()
  }
  displayedWin.value = 0

  // ── Animación que lleva la atención y la vista a la ruleta enseguida ──
  if (wheelCabinetRef.value) {
    wheelCabinetRef.value.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
  }

  store.spin()
}

/** La rueda SVG emite 'spin-complete' cuando la bola y el rotor se detienen */
function handleSpinComplete() {
  store.resolveSpin()
  celebrate()
}

// ─── Celebración de Premios ────────────────────────────────
function celebrate() {
  const outcome = lastOutcome.value
  if (!outcome) return

  if (outcome.totalWon > 0) {
    animateWinCounter(outcome.totalWon)
    const isJackpotWin = outcome.winningBets.some((b) => b.multiplier >= 36)

    if (isJackpotWin) {
      sound.playJackpot()
      effects.launchConfetti(4000)
      effects.floatingText(`+${outcome.totalWon.toLocaleString()} 💎 PLENO!`, '#ffd54f')
    } else {
      sound.playWin()
      sound.playCoinCascade(10)
      effects.launchConfetti(2500)
      effects.floatingText(`+${outcome.totalWon.toLocaleString()} 🪙`, '#69f0ae')
    }
  } else {
    sound.playBust()
    effects.screenShake(4, 300)
  }
}

function animateWinCounter(target: number, duration = 1200) {
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
  if (totalBet.value > 0 && !isSpinning.value) {
    showExitConfirmDialog.value = true
  } else {
    router.push('/casino')
  }
}

function confirmExit() {
  store.clearBets() // reembolsa las fichas antes de salir
  showExitConfirmDialog.value = false
  router.push('/casino')
}

function handleRefill() {
  store.refillChips()
  sound.playCoinCascade(12)
  effects.floatingText('+1,000 🪙', '#ffd54f')
  showRefillDialog.value = false
}

// Atajo de teclado: Barra espaciadora para girar
function onKeydown(e: KeyboardEvent) {
  if (e.code !== 'Space') return
  const tag = (e.target as HTMLElement | null)?.tagName
  if (tag === 'INPUT' || tag === 'TEXTAREA') return
  e.preventDefault()
  if (showExitConfirmDialog.value || showRefillDialog.value || showStatsDialog.value) return
  handleSpin()
}

const winRate = computed(() => {
  if (stats.value.spins === 0) return 0
  return Math.round((stats.value.wins / stats.value.spins) * 100)
})

const colorDistribution = computed(() => {
  if (history.value.length === 0) return { red: 0, black: 0, green: 0 }
  let red = 0, black = 0, green = 0
  for (const h of history.value) {
    if (h.number === 0) green++
    else if (RED_NUMBERS.has(h.number)) red++
    else black++
  }
  const total = history.value.length
  return {
    red: Math.round((red / total) * 100),
    black: Math.round((black / total) * 100),
    green: Math.round((green / total) * 100),
  }
})

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
  <div class="ruleta-room">
    <!-- Luces de fondo y resplandores ambientales -->
    <div class="room-glow room-glow--1" />
    <div class="room-glow room-glow--2" />
    <div class="room-glow room-glow--3" />

    <div class="room-content">
      <!-- ═══ Barra Superior Compacta (Encaja en pantalla sin empujar el juego) ═══ -->
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

        <!-- Centro: Título Compacto + Tira de Últimos Números -->
        <div class="d-none d-md-flex align-center ga-3 header-center">
          <div class="compact-title d-flex align-center ga-1">
            <v-icon color="amber" size="20">mdi-circle-slice-6</v-icon>
            <span class="title-text">ROYAL ROULETTE</span>
          </div>

          <div class="divider-v" />

          <!-- Tira de últimos números ganadores -->
          <div class="mini-history d-flex align-center ga-1.5">
            <span class="mini-history-label">HISTORIAL:</span>
            <div v-if="history.length === 0" class="mini-history-empty">
              Sin tiradas
            </div>
            <div
              v-for="(h, idx) in history.slice(0, 8)"
              :key="h.id"
              class="mini-history-badge"
              :class="[
                `mini-history-badge--${h.info.color}`,
                { 'mini-history-badge--latest': idx === 0 }
              ]"
            >
              {{ h.number }}
            </div>
          </div>

          <v-btn
            variant="text"
            color="amber-lighten-3"
            size="x-small"
            rounded="pill"
            prepend-icon="mdi-chart-bell-curve-cumulative"
            class="stats-btn ml-1"
            @click="showStatsDialog = true"
          >
            Stats
          </v-btn>

          <v-btn
            id="ruleta-rules-btn"
            variant="tonal"
            color="amber-lighten-2"
            size="x-small"
            rounded="pill"
            prepend-icon="mdi-help-circle-outline"
            class="rules-btn font-weight-bold ml-1"
            @click="showRulesDialog = true"
          >
            ¿Cómo Jugar?
          </v-btn>
        </div>

        <!-- Derecha: Recarga rápida + Saldo centralizado -->
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

          <AdrenalineBanner />

          <div class="balance-pill">
            <v-icon color="amber" size="18" class="mr-1.5">mdi-poker-chip</v-icon>
            <span class="balance-value">{{ chips.toLocaleString() }}</span>
            <span class="balance-label ml-1">fichas</span>
          </div>
        </div>
      </header>

      <!-- ═══ Escenario de Casino Siempre Visible (Rueda + Tapete) ═══ -->
      <main class="casino-stage" :class="{ 'casino-stage--spinning': isSpinning }">
        <!-- ─── Columna Izquierda: Rueda y Cartel de Resultado ─── -->
        <section ref="wheelCabinetRef" class="left-column">
          <!-- Gabinete de la Rueda con animación cinematográfica de acercamiento -->
          <div
            class="wheel-cabinet"
            :class="{ 'wheel-cabinet--focused': isSpinning }"
          >
            <RouletteWheel
              :winning-number="winningNumber"
              :is-spinning="isSpinning"
              @spin-complete="handleSpinComplete"
            />
          </div>

          <!-- Banner de Resultado siempre encuadrado bajo la rueda -->
          <div
            class="result-banner"
            :class="{
              'result-banner--win': lastOutcome && lastOutcome.totalWon > 0,
              'result-banner--lose': lastOutcome && lastOutcome.totalWon === 0,
              'result-banner--standby': !lastOutcome,
            }"
          >
            <!-- Caso con resultado -->
            <template v-if="lastOutcome">
              <div class="d-flex align-center ga-3">
                <div
                  class="result-number-badge"
                  :class="`result-number-badge--${lastOutcome.info.color}`"
                >
                  {{ lastOutcome.number }}
                </div>
                <div class="text-left flex-grow-1">
                  <div class="result-number-name">
                    {{ lastOutcome.number === 0 ? '0 CERO' : `${lastOutcome.number} ${lastOutcome.info.color.toUpperCase()}` }}
                  </div>
                  <div class="result-tags">
                    <span v-if="lastOutcome.number !== 0">
                      {{ lastOutcome.info.isEven ? 'Par' : 'Impar' }} ·
                      {{ lastOutcome.info.isLow ? 'Falta (1-18)' : 'Pasa (19-36)' }} ·
                      {{ lastOutcome.info.dozen }}ª Doc.
                    </span>
                    <span v-else>Verde · Casilla Especial</span>
                  </div>
                </div>
              </div>

              <!-- Ganancia o Pérdida -->
              <div v-if="lastOutcome.totalWon > 0" class="win-banner-line mt-2">
                <div class="d-flex align-center justify-space-between">
                  <span class="win-headline">¡¡PREMIO GANADO!!</span>
                  <span class="win-chips">+{{ displayedWin.toLocaleString() }} fichas</span>
                </div>
                <div class="winning-tags-row mt-1">
                  <span
                    v-for="(b, idx) in lastOutcome.winningBets"
                    :key="idx"
                    class="winning-tag"
                  >
                    {{ b.bet.label }} (+{{ b.payout.toLocaleString() }})
                  </span>
                </div>
              </div>
              <div v-else class="lose-banner-line mt-2">
                <span class="lose-headline">Sin premio esta tirada</span>
                <span class="lose-sub ml-2">¡Sigue probando tu suerte!</span>
              </div>
            </template>

            <!-- Caso standby (antes de la primera tirada) -->
            <template v-else>
              <div class="d-flex align-center ga-3">
                <div class="result-number-badge result-number-badge--standby">
                  <v-icon color="amber" size="24">mdi-poker-chip</v-icon>
                </div>
                <div class="text-left">
                  <div class="result-number-name">MESA ABIERTA</div>
                  <div class="result-tags">
                    Haz tus apuestas en el tapete y pulsa GIRAR RULETA
                  </div>
                </div>
              </div>
            </template>
          </div>
        </section>

        <!-- ─── Columna Derecha: Tapete de Apuestas y Controles de Fichas ─── -->
        <section class="right-column">
          <!-- Tapete Verde de Apuestas -->
          <div class="table-container mb-2">
            <RouletteTable
              :bets="bets"
              :disabled="isSpinning"
              :winning-number="status === 'result' ? winningNumber : null"
              @place-bet="handlePlaceBet"
            />
          </div>

          <!-- Controles de Fichas y Botón de Giro -->
          <div class="controls-container">
            <RouletteChips
              :selected-chip="selectedChip"
              :total-bet="totalBet"
              :chips="chips"
              :is-spinning="isSpinning"
              :can-spin="canSpin"
              :can-undo="Object.keys(bets).length > 0"
              :can-rebet="lastPlacedBets.length > 0"
              @select-chip="store.selectChip($event)"
              @spin="handleSpin"
              @clear="store.clearBets()"
              @undo="store.undoBet()"
              @double="store.doubleBets()"
              @rebet="store.rebet()"
            />
          </div>
        </section>
      </main>
    </div>

    <!-- Diálogo de Confirmación de Salida -->
    <v-dialog v-model="showExitConfirmDialog" max-width="420">
      <v-card class="dialog-card pa-4" rounded="xl">
        <v-card-title class="d-flex align-center ga-2">
          <v-icon color="amber" size="26">mdi-alert-circle</v-icon>
          <span class="dialog-heading">¿Volver al Casino?</span>
        </v-card-title>
        <v-card-text>
          Tienes <strong>{{ totalBet.toLocaleString() }} fichas</strong> apostadas en el tapete. Si sales ahora, tus fichas se reembolsarán a tu saldo.
        </v-card-text>
        <v-card-actions class="d-flex justify-end ga-2">
          <v-btn variant="text" @click="showExitConfirmDialog = false">Cancelar</v-btn>
          <v-btn color="amber-darken-2" variant="elevated" @click="confirmExit">Reembolsar y Salir</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Diálogo de Recarga Gratuita de Fichas -->
    <v-dialog v-model="showRefillDialog" max-width="400">
      <v-card class="dialog-card pa-4 text-center" rounded="xl">
        <v-card-title class="justify-center">
          <v-icon color="amber" size="48">mdi-gift</v-icon>
        </v-card-title>
        <h2 class="dialog-heading mb-2">¡Bono de Fichas Gratis!</h2>
        <v-card-text>
          Te has quedado sin fichas para apostar. En Royal Casino la diversión no se detiene: ¡recibe <strong>1,000 fichas gratis</strong> ahora mismo!
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

    <!-- Diálogo de Estadísticas de Ruleta -->
    <v-dialog v-model="showStatsDialog" max-width="500">
      <v-card class="dialog-card pa-4" rounded="xl">
        <v-card-title class="d-flex align-center justify-space-between">
          <div class="d-flex align-center ga-2">
            <v-icon color="amber" size="26">mdi-chart-line</v-icon>
            <span class="dialog-heading">Estadísticas de Ruleta</span>
          </div>
          <v-btn icon="mdi-close" variant="text" size="small" @click="showStatsDialog = false" />
        </v-card-title>
        <v-card-text class="pt-2">
          <v-row dense class="mb-4">
            <v-col cols="6">
              <div class="metric-card">
                <span class="metric-label">Tiradas Totales</span>
                <span class="metric-val">{{ stats.spins }}</span>
              </div>
            </v-col>
            <v-col cols="6">
              <div class="metric-card">
                <span class="metric-label">Tasa de Acierto</span>
                <span class="metric-val text-green">{{ winRate }}%</span>
              </div>
            </v-col>
            <v-col cols="6">
              <div class="metric-card">
                <span class="metric-label">Total Apostado</span>
                <span class="metric-val">{{ stats.totalBet.toLocaleString() }}</span>
              </div>
            </v-col>
            <v-col cols="6">
              <div class="metric-card">
                <span class="metric-label">Mayor Premio</span>
                <span class="metric-val text-amber">+{{ stats.biggestWin.toLocaleString() }}</span>
              </div>
            </v-col>
          </v-row>
          <div class="mb-2">
            <div class="d-flex justify-space-between text-caption font-weight-bold mb-1">
              <span>Distribución de Color</span>
              <span>Últimas {{ history.length }} tiradas</span>
            </div>
            <div class="distribution-bar d-flex">
              <div class="dist-segment dist-red" :style="{ width: `${colorDistribution.red}%` }">
                {{ colorDistribution.red > 10 ? `${colorDistribution.red}%` : '' }}
              </div>
              <div class="dist-segment dist-green" :style="{ width: `${colorDistribution.green}%` }">
                {{ colorDistribution.green > 10 ? `${colorDistribution.green}%` : '' }}
              </div>
              <div class="dist-segment dist-black" :style="{ width: `${colorDistribution.black}%` }">
                {{ colorDistribution.black > 10 ? `${colorDistribution.black}%` : '' }}
              </div>
            </div>
            <div class="d-flex justify-space-around text-caption mt-1">
              <span class="text-red font-weight-bold">Rojo: {{ colorDistribution.red }}%</span>
              <span class="text-green font-weight-bold">Cero: {{ colorDistribution.green }}%</span>
              <span class="text-grey font-weight-bold">Negro: {{ colorDistribution.black }}%</span>
            </div>
          </div>
        </v-card-text>
        <v-card-actions class="d-flex justify-space-between">
          <v-btn
            variant="text"
            color="red-lighten-2"
            size="small"
            prepend-icon="mdi-refresh"
            @click="store.resetStats()"
          >
            Reiniciar
          </v-btn>
          <v-btn
            color="amber-darken-2"
            variant="elevated"
            size="small"
            rounded="lg"
            @click="showStatsDialog = false"
          >
            Cerrar
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Diálogo de Reglas de Ruleta Europea -->
    <GameRulesDialog v-model="showRulesDialog" game="ruleta" />
  </div>
</template>

<style scoped>
.ruleta-room {
  position: relative;
  min-height: 100vh;
  background: radial-gradient(circle at 50% 25%, #161c2e 0%, #0d111b 50%, #080b12 100%);
  color: #fff;
  padding: 8px 12px 16px;
  overflow-x: hidden;
  display: flex;
  flex-direction: column;
}

/* Luces ambientales */
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
  background: #6a1b9a;
  top: -100px;
  left: 10%;
}

.room-glow--2 {
  width: 520px;
  height: 520px;
  background: #1b5e20;
  top: 30%;
  right: -80px;
}

.room-glow--3 {
  width: 420px;
  height: 420px;
  background: #ff8f00;
  bottom: -100px;
  left: 30%;
}

.room-content {
  position: relative;
  z-index: 1;
  width: 100%;
  max-width: 1440px;
  margin: 0 auto;
}

/* ═══ Barra Superior Compacta (42px) ═══ */
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
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(255, 213, 79, 0.15);
  border-radius: 20px;
  padding: 3px 12px;
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

.mini-history-label {
  font-family: 'Cinzel', serif;
  font-size: 0.68rem;
  font-weight: 800;
  letter-spacing: 1px;
  color: rgba(255, 255, 255, 0.6);
}

.mini-history-empty {
  font-size: 0.7rem;
  color: rgba(255, 255, 255, 0.4);
  font-style: italic;
}

.mini-history-badge {
  width: 22px;
  height: 22px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: 'Cinzel', serif;
  font-size: 0.68rem;
  font-weight: 900;
  color: #fff;
  border: 1px solid rgba(255, 255, 255, 0.3);
}

.mini-history-badge--latest {
  border-color: #ffd54f;
  box-shadow: 0 0 8px #ffd54f;
  transform: scale(1.15);
}

.mini-history-badge--green { background: #1b5e20; }
.mini-history-badge--red { background: #c62828; }
.mini-history-badge--black { background: #212529; }

.stats-btn {
  font-size: 0.68rem;
  letter-spacing: 0.5px;
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

/* ═══ Escenario de Casino Principal (Ajustado siempre en pantalla) ═══ */
.casino-stage {
  display: flex;
  align-items: flex-start;
  justify-content: center;
  gap: 16px;
  transition: all 0.4s ease;
}

/* Columna Izquierda: Rueda y Banner */
.left-column {
  flex: 0 0 clamp(340px, 32vw, 410px);
  display: flex;
  flex-direction: column;
}

.wheel-cabinet {
  background: radial-gradient(circle at 50% 50%, #151c2c 0%, #0d121c 100%);
  border: 1.5px solid rgba(255, 213, 79, 0.3);
  border-radius: 20px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.7);
  width: 100%;
  padding: 12px;
  transition: transform 0.6s cubic-bezier(0.2, 0.8, 0.2, 1), box-shadow 0.6s ease, border-color 0.4s ease;
  position: relative;
  z-index: 5;
}

/* Animación cuando gira la ruleta: acerca la cámara hacia ella con un resplandor dorado */
.wheel-cabinet--focused {
  transform: scale(1.06);
  box-shadow: 0 0 50px rgba(255, 213, 79, 0.55), 0 20px 50px rgba(0, 0, 0, 0.95);
  border-color: #ffd54f;
  z-index: 20;
}

.casino-stage--spinning .right-column {
  opacity: 0.85;
  transition: opacity 0.5s ease;
}

/* Banner de Resultado (Mismo diseño de la captura) */
.result-banner {
  width: 100%;
  margin-top: 10px;
  border-radius: 16px;
  padding: 10px 16px;
  background: linear-gradient(135deg, rgba(13, 50, 24, 0.9) 0%, rgba(8, 34, 16, 0.95) 100%);
  border: 2px solid #2e7d32;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.6);
  transition: all 0.3s ease;
}

.result-banner--win {
  border-color: #69f0ae !important;
  box-shadow: 0 0 25px rgba(105, 240, 174, 0.35), 0 8px 24px rgba(0, 0, 0, 0.7) !important;
}

.result-banner--lose {
  background: linear-gradient(135deg, rgba(38, 50, 56, 0.9) 0%, rgba(20, 28, 32, 0.95) 100%);
  border-color: rgba(255, 255, 255, 0.2) !important;
}

.result-banner--standby {
  background: rgba(14, 20, 32, 0.85);
  border-color: rgba(255, 213, 79, 0.25);
}

.result-number-badge {
  width: 46px;
  height: 46px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: 'Cinzel', serif;
  font-size: 1.55rem;
  font-weight: 900;
  color: #fff;
  border: 2px solid #ffd54f;
  box-shadow: 0 0 12px rgba(255, 213, 79, 0.6);
  flex-shrink: 0;
}

.result-number-badge--green { background: #1b5e20; }
.result-number-badge--red { background: #c62828; }
.result-number-badge--black { background: #1e1e1e; }
.result-number-badge--standby {
  background: #151d2a;
  border-color: rgba(255, 213, 79, 0.4);
}

.result-number-name {
  font-family: 'Cinzel', serif;
  font-size: 1.15rem;
  font-weight: 900;
  color: #ffd54f;
  line-height: 1.15;
}

.result-tags {
  font-size: 0.72rem;
  color: rgba(255, 255, 255, 0.75);
}

.win-headline {
  font-family: 'Cinzel', serif;
  font-size: 1.05rem;
  font-weight: 900;
  color: #69f0ae;
  letter-spacing: 2px;
}

.win-chips {
  font-family: 'Cinzel', serif;
  font-size: 1.15rem;
  font-weight: 900;
  color: #ffd54f;
  text-shadow: 0 0 8px rgba(255, 213, 79, 0.5);
}

.winning-tags-row {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.winning-tag {
  background: rgba(0, 0, 0, 0.4);
  border: 1px solid rgba(255, 213, 79, 0.4);
  border-radius: 10px;
  padding: 1px 8px;
  font-size: 0.68rem;
  color: #ffd54f;
  font-weight: 700;
}

.lose-headline {
  font-family: 'Cinzel', serif;
  font-size: 0.95rem;
  font-weight: 800;
  color: rgba(255, 255, 255, 0.85);
}

.lose-sub {
  font-size: 0.72rem;
  color: rgba(255, 255, 255, 0.5);
}

/* Columna Derecha: Tapete y Controles */
.right-column {
  flex: 1 1 680px;
  max-width: 860px;
  display: flex;
  flex-direction: column;
}

/* ═══ Diálogos ═══ */
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

.metric-card {
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 10px;
  padding: 8px;
  display: flex;
  flex-direction: column;
}

.metric-label {
  font-size: 0.7rem;
  color: rgba(255, 255, 255, 0.5);
}

.metric-val {
  font-family: 'Cinzel', serif;
  font-size: 1.25rem;
  font-weight: 800;
  color: #fff;
}

.distribution-bar {
  height: 18px;
  border-radius: 9px;
  overflow: hidden;
  box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.6);
}

.dist-segment {
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.65rem;
  font-weight: 800;
  color: #fff;
}

.dist-red { background: #c62828; }
.dist-green { background: #1b5e20; }
.dist-black { background: #212529; }

/* ═══ Responsive para Móvil / Pantallas Pequeñas ═══ */
@media (max-width: 960px) {
  .casino-stage {
    flex-direction: column;
    align-items: center;
  }
  .left-column {
    flex: 1 1 100%;
    max-width: 440px;
    margin-bottom: 12px;
  }
  .right-column {
    flex: 1 1 100%;
    width: 100%;
  }
}
</style>
