<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { ref } from 'vue'
import { useDadosStore } from '~/stores/dados'
import { useSoundEngine } from '~/composables/useSoundEngine'
import { useConfetti } from '~/composables/useConfetti'
import type { DadosBetType } from '~/types/dados'
import DiceArena from '~/components/dados/DiceArena.vue'
import DadosTable from '~/components/dados/DadosTable.vue'
import DadosControls from '~/components/dados/DadosControls.vue'
import DadosHistory from '~/components/dados/DadosHistory.vue'
import DadosStatsDialog from '~/components/dados/DadosStatsDialog.vue'
import GameRulesDialog from '~/components/common/GameRulesDialog.vue'
import RechargeDialog from '~/components/common/RechargeDialog.vue'

useHead({
  title: 'Dados (Craps) · Royal Casino',
  meta: [
    {
      name: 'description',
      content: 'Juega al auténtico juego de Dados (Craps) de Las Vegas en Royal Casino. Pass Line, Field, Place Bets, Hardways y pagos de hasta 30 a 1.',
    },
  ],
})

const router = useRouter()
const nuxtApp = useNuxtApp()
const store = useDadosStore(nuxtApp.$pinia)
const sound = useSoundEngine()
const effects = useConfetti()

const {
  chips,
  selectedChip,
  phase,
  point,
  status,
  isRolling,
  canRoll,
  dice,
  bets,
  totalBet,
  stats,
  history,
  lastRollResult,
} = storeToRefs(store)

const showRulesDialog = ref(false)
const showExitConfirmDialog = ref(false)
const showRefillDialog = ref(false)
const showRechargeModal = ref(false)
const showStatsDialog = ref(false)

// Dados preparados para el tiro
let pendingDie1 = 3
let pendingDie2 = 4

function handlePlaceBet(type: DadosBetType) {
  if (isRolling.value) return
  if (status.value === 'result') {
    store.resetRound()
  }

  const success = store.placeBet(type)
  if (success) {
    sound.playChipClick()
  } else if (chips.value < selectedChip.value) {
    if (chips.value === 0 && totalBet.value === 0) {
      showRefillDialog.value = true
    }
  }
}

function handleStartRoll() {
  if (!canRoll.value || isRolling.value) return
  if (status.value === 'result') {
    store.resetRound()
  }

  // Generar tirada aleatoria (1-6 para cada dado)
  pendingDie1 = Math.floor(Math.random() * 6) + 1
  pendingDie2 = Math.floor(Math.random() * 6) + 1

  // Sonido de agitar y rodar
  sound.playDiceShake()
  setTimeout(() => {
    sound.playDiceRoll()
  }, 350)

  // Iniciar estado de rodado y pasar los dados a la arena
  store.dice = [pendingDie1, pendingDie2]
  store.startRoll()
}

/** La animación 3D de DiceArena finaliza y emite roll-complete */
function handleRollComplete() {
  const result = store.resolveRoll(pendingDie1, pendingDie2)
  celebrate(result)
}

function celebrate(res: typeof lastRollResult.value) {
  if (!res) return

  // Efectos según ganancias
  if (res.totalWon > 0) {
    // Si hubo un pago gigante (como 30:1 en Snake Eyes o Boxcars)
    const hasHugeWin = res.winningBets.some((b) => b.payoutMultiplier >= 15)

    if (hasHugeWin) {
      sound.playJackpot()
      effects.launchConfetti(4000)
      effects.floatingText(`+${res.totalWon.toLocaleString()} 💎 ¡PREMIO MAYOR!`, '#ffd54f')
    } else {
      sound.playWin()
      sound.playCoinCascade(8)
      effects.launchConfetti(2200)
      effects.floatingText(`+${res.totalWon.toLocaleString()} 🪙`, '#69f0ae')
    }
  } else if (res.event === 'seven_out') {
    sound.playSevenOut()
    effects.screenShake(5, 350)
    effects.floatingText('¡SEVEN OUT!', '#ef5350')
  } else if (res.event === 'craps_loss') {
    sound.playBust()
    effects.screenShake(3, 250)
    effects.floatingText('¡CRAPS!', '#ef5350')
  }

  // Notificación del evento si no hubo ganancia directa
  if (res.totalWon === 0 && res.event === 'point_established') {
    effects.floatingText(`¡Punto en ${res.pointAfter}!`, '#ffd54f')
  }
}

function handleBack() {
  if (totalBet.value > 0 && !isRolling.value) {
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
</script>

<template>
  <div class="dados-page-wrapper">
    <!-- Luces de fondo y atmósfera casino -->
    <div class="bg-glow bg-glow--1" />
    <div class="bg-glow bg-glow--2" />

    <v-container fluid class="pa-4 pa-md-6 game-container">
      <!-- ── BARRA SUPERIOR DE NAVEGACIÓN Y SALDO ────────────────────── -->
      <header class="top-nav-bar d-flex align-center justify-space-between flex-wrap ga-3 mb-4">
        <!-- Volver al Casino -->
        <v-btn
          variant="tonal"
          color="amber-lighten-2"
          rounded="pill"
          size="small"
          prepend-icon="mdi-chevron-left"
          class="nav-btn"
          @click="handleBack"
        >
          Lobby
        </v-btn>

        <!-- Título del Juego -->
        <div class="d-flex align-center ga-2 game-brand">
          <div class="brand-icon-wrap">
            <v-icon color="amber" size="26">mdi-dice-multiple</v-icon>
          </div>
          <div>
            <h1 class="brand-title">DADOS · CRAPS</h1>
            <p class="brand-sub d-none d-sm-block">ROYAL CASINO · LAS VEGAS STYLE</p>
          </div>
        </div>

        <!-- Saldo y Botones de Menú -->
        <div class="d-flex align-center ga-2 flex-wrap">
          <!-- Píldora de Saldo -->
          <div class="balance-pill-badge">
            <v-icon color="amber" size="20" class="mr-1">mdi-poker-chip</v-icon>
            <span class="balance-val">{{ chips.toLocaleString() }}</span>
            <span class="balance-curr ml-1">fichas</span>
          </div>

          <!-- Botón Recarga -->
          <v-btn
            variant="elevated"
            color="amber-darken-2"
            size="small"
            rounded="pill"
            prepend-icon="mdi-cash-plus"
            @click="showRechargeModal = true"
          >
            + Recargar
          </v-btn>

          <!-- Estadísticas -->
          <v-btn
            icon="mdi-chart-bar"
            variant="tonal"
            color="amber-lighten-2"
            size="small"
            title="Estadísticas"
            @click="showStatsDialog = true"
          />

          <!-- Reglas -->
          <v-btn
            icon="mdi-help-circle-outline"
            variant="tonal"
            color="amber-lighten-2"
            size="small"
            title="Reglas del Juego"
            @click="showRulesDialog = true"
          />
        </div>
      </header>

      <!-- ── SECCIÓN CENTRAL: ARENA 3D Y MESA DE APUESTAS ─────────────── -->
      <div class="game-board-layout d-flex flex-column ga-4">
        <!-- 1. Arena 3D de Dados (Caja de Tiro) -->
        <DiceArena
          :die1="dice[0]"
          :die2="dice[1]"
          :is-rolling="isRolling"
          :point="point"
          :phase="phase"
          :last-event-label="lastRollResult?.eventLabel"
          :last-won="lastRollResult?.totalWon"
          @roll-complete="handleRollComplete"
        />

        <!-- 2. Paño Verde de la Mesa de Craps -->
        <DadosTable
          :bets="bets"
          :point="point"
          :phase="phase"
          :is-rolling="isRolling"
          :selected-chip="selectedChip"
          @place-bet="handlePlaceBet"
        />

        <!-- 3. Panel de Control de Apuestas (Fichas y Lanzar) -->
        <DadosControls
          :selected-chip="selectedChip"
          :total-bet="totalBet"
          :chips="chips"
          :is-rolling="isRolling"
          :can-roll="canRoll"
          :can-undo="true"
          :can-rebet="store.lastPlacedBets !== null"
          @select-chip="store.selectChip"
          @roll="handleStartRoll"
          @clear="store.clearBets"
          @undo="store.undoLastBet"
          @double="store.doubleBets"
          @rebet="store.rebet"
        />

        <!-- 4. Ticker de Tiradas Anteriores -->
        <DadosHistory :history="history" />
      </div>
    </v-container>

    <!-- Modal de Reglas Oficiales -->
    <GameRulesDialog v-model="showRulesDialog" game="dados" />

    <!-- Modal de Estadísticas -->
    <DadosStatsDialog
      v-model="showStatsDialog"
      :stats="stats"
      @reset-stats="store.resetStats"
    />

    <!-- Diálogo Confirmar Salir con Apuestas Activas -->
    <v-dialog v-model="showExitConfirmDialog" max-width="440">
      <v-card class="pa-4 modal-theme-card" rounded="xl">
        <v-card-title class="d-flex align-center ga-2">
          <v-icon color="amber">mdi-alert</v-icon>
          <span class="text-h6 font-weight-bold text-amber">¿Abandonar Mesa?</span>
        </v-card-title>
        <v-card-text>
          Tienes {{ totalBet.toLocaleString() }} fichas apostadas en la mesa de Craps. Si sales ahora, tus apuestas no comprometidas te serán devueltas.
        </v-card-text>
        <v-card-actions class="d-flex justify-end ga-2">
          <v-btn variant="text" @click="showExitConfirmDialog = false">Seguir Jugando</v-btn>
          <v-btn color="amber-darken-2" variant="elevated" rounded="lg" @click="confirmExit">
            Salir al Lobby
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Diálogo Saldo Insuficiente -->
    <v-dialog v-model="showRefillDialog" max-width="440">
      <v-card class="pa-4 modal-theme-card text-center" rounded="xl">
        <v-card-title class="justify-center">
          <v-icon color="amber" size="48">mdi-cash-remove</v-icon>
        </v-card-title>
        <h2 class="text-h6 font-weight-bold text-amber mb-2">¡Fichas Insuficientes!</h2>
        <v-card-text>
          Te has quedado sin fichas en el casino. Abre el cajero y canjea un código de recarga para continuar en la mesa de Dados.
        </v-card-text>
        <v-card-actions class="justify-center ga-2 mt-2">
          <v-btn variant="text" @click="showRefillDialog = false">Cerrar</v-btn>
          <v-btn color="amber-darken-2" variant="elevated" rounded="lg" prepend-icon="mdi-cash-plus" @click="handleRefill">
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
.dados-page-wrapper {
  min-height: 100vh;
  background: radial-gradient(circle at 50% 10%, #0a1710 0%, #040906 100%);
  position: relative;
  overflow-x: hidden;
  color: #fff;
  padding-bottom: 40px;
}

.game-container {
  max-width: 1240px;
  position: relative;
  z-index: 2;
}

/* Luces de Fondo */
.bg-glow {
  position: absolute;
  border-radius: 50%;
  filter: blur(120px);
  pointer-events: none;
  z-index: 1;
}

.bg-glow--1 {
  width: 500px;
  height: 500px;
  top: -100px;
  left: 10%;
  background: radial-gradient(circle, rgba(27, 94, 32, 0.25) 0%, transparent 70%);
}

.bg-glow--2 {
  width: 450px;
  height: 450px;
  bottom: 10%;
  right: 10%;
  background: radial-gradient(circle, rgba(255, 193, 7, 0.12) 0%, transparent 70%);
}

/* Barra de Navegación */
.top-nav-bar {
  background: #08170f;
  border: 2px solid #ffd54f;
  border-radius: 0;
  box-shadow: 3px 3px 0 #000;
  padding: 10px 18px;
}

.nav-btn {
  font-family: 'Press Start 2P', monospace;
  font-size: 0.52rem;
  letter-spacing: 0;
  text-transform: none;
}

.brand-icon-wrap {
  width: 38px;
  height: 38px;
  border-radius: 0;
  background: #000;
  border: 2px solid #ffd54f;
  box-shadow: 2px 2px 0 #000;
  display: flex;
  align-items: center;
  justify-content: center;
}

.brand-title {
  font-family: 'Press Start 2P', monospace;
  font-size: 0.8rem;
  font-weight: 700;
  letter-spacing: 0;
  color: #ffd54f;
  line-height: 1.2;
  margin: 0;
}

.brand-sub {
  font-family: 'Press Start 2P', monospace;
  font-size: 0.48rem;
  font-weight: 700;
  letter-spacing: 0;
  color: rgba(255, 255, 255, 0.6);
  margin-top: 3px;
}

.balance-pill-badge {
  background: #000;
  border: 2px solid #ffd54f;
  border-radius: 0;
  box-shadow: 2px 2px 0 #000;
  padding: 4px 10px;
  display: flex;
  align-items: center;
}

.balance-val {
  font-family: 'Press Start 2P', monospace;
  font-size: 0.78rem;
  font-weight: 700;
  color: #ffd54f;
  text-shadow: 1px 1px 0 #000;
}

.balance-curr {
  font-family: 'Press Start 2P', monospace;
  font-size: 0.48rem;
  color: rgba(255, 255, 255, 0.65);
}

.modal-theme-card {
  background: #0c1510 !important;
  border: 3px solid #ffd54f !important;
  border-radius: 0 !important;
  box-shadow: 6px 6px 0 #000 !important;
  color: #fff;
}

@media (max-width: 768px), (max-height: 800px) {
  .dados-page-wrapper {
    padding-bottom: 8px;
  }
  .game-container {
    padding: 4px 6px !important;
  }
  .top-nav-bar {
    padding: 4px 8px !important;
    gap: 6px !important;
    margin-bottom: 6px !important;
  }
  .game-board-layout {
    gap: 6px !important;
  }
  .brand-title {
    font-size: 0.65rem !important;
  }
  .brand-icon-wrap {
    width: 28px !important;
    height: 28px !important;
  }
}
</style>
