<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { usePokerStore } from '~/stores/poker'
import { useBlackjackStore } from '~/stores/blackjack'
import { useSoundEngine } from '~/composables/useSoundEngine'
import { useConfetti } from '~/composables/useConfetti'
import PokerTable from '~/components/poker/PokerTable.vue'
import PokerControls from '~/components/poker/PokerControls.vue'
import GameRulesDialog from '~/components/common/GameRulesDialog.vue'
import AdrenalineBanner from '~/components/idle/AdrenalineBanner.vue'

useHead({
  title: 'Texas Hold\'em Poker · Royal Casino',
  meta: [
    {
      name: 'description',
      content: 'Juega al Poker Texas Hold\'em No Limit Heads-Up contra el Croupier en Royal Casino. Apuesta, sube, farolea y llévate el bote.',
    },
  ],
})

const router = useRouter()
const store = usePokerStore()
const wallet = useBlackjackStore()
const sound = useSoundEngine()
const confetti = useConfetti()

// Dialog states
const showRulesDialog = ref<boolean>(false)
const showExitConfirmDialog = ref<boolean>(false)
const showRefillDialog = ref<boolean>(false)
const showStatsDialog = ref<boolean>(false)

// Chips
const chips = computed(() => wallet.player.chips)

// Sound & animations on round finish
watch(
  () => store.roundResult,
  (res) => {
    if (!res) return
    if (res.winner === 'player') {
      sound.playWin()
      confetti.launchConfetti(2800)
    } else if (res.winner === 'dealer') {
      sound.playBust()
    } else {
      sound.playDraw()
    }
  },
)

// Sound on street advance
watch(
  () => store.street,
  (newStreet, oldStreet) => {
    if (newStreet === 'flop' || newStreet === 'turn' || newStreet === 'river') {
      sound.playCardDeal()
    }
  },
)

function handleBack() {
  if (store.street !== 'idle' && store.street !== 'showdown') {
    showExitConfirmDialog.value = true
  } else {
    router.push('/casino')
  }
}

function confirmExit() {
  showExitConfirmDialog.value = false
  store.forfeitHand()
  router.push('/casino')
}

function handleRefill() {
  wallet.refillChips(1000)
  sound.playCoinCascade(10)
  showRefillDialog.value = false
}

// Keyboard shortcuts: Space/Enter = Start hand or Next hand
function onKeydown(e: KeyboardEvent) {
  const tag = (e.target as HTMLElement | null)?.tagName
  if (tag === 'INPUT' || tag === 'TEXTAREA') return

  if (e.code === 'Space' || e.code === 'Enter') {
    if (store.street === 'idle' || store.street === 'showdown') {
      e.preventDefault()
      if (chips.value < store.bigBlind) return
      sound.playShuffle()
      store.startNewHand()
    }
  } else if (e.code === 'KeyF') {
    if (store.currentTurn === 'player') {
      e.preventDefault()
      sound.playCardSlide()
      store.playerFold()
    }
  } else if (e.code === 'KeyC') {
    if (store.currentTurn === 'player') {
      e.preventDefault()
      if (store.canCheck) {
        sound.playButtonClick()
        store.playerCheck()
      } else {
        sound.playChipStack()
        store.playerCall()
      }
    }
  }
}

onMounted(() => {
  window.addEventListener('keydown', onKeydown)
})

onUnmounted(() => {
  window.removeEventListener('keydown', onKeydown)
})
</script>

<template>
  <div class="poker-page">
    <!-- Background Luxury Glow Elements -->
    <div class="poker-bg-glow poker-bg-glow--top" />
    <div class="poker-bg-glow poker-bg-glow--bottom" />

    <v-container fluid class="poker-container pa-2 d-flex flex-column justify-space-between">
      <!-- ═══ TOP BAR ═══ -->
      <header class="poker-topbar d-flex align-center justify-space-between px-3 py-1">
        <!-- Left: Back button + Title -->
        <div class="d-flex align-center ga-2">
          <v-btn
            id="poker-back-btn"
            icon="mdi-arrow-left"
            variant="text"
            color="amber-lighten-2"
            size="small"
            title="Volver al Lobby"
            @click="handleBack"
          />

          <div class="d-flex align-center ga-2">
            <v-icon color="red-lighten-1" size="26">mdi-cards-playing-spade</v-icon>
            <div>
              <h1 class="poker-heading">RETRO TEXAS HOLD'EM</h1>
              <div class="poker-subheading">★ ARCADE POKER ROOM · 16-BIT HEADS-UP ★</div>
            </div>
          </div>

          <!-- Rules Modal Button -->
          <v-btn
            id="poker-rules-btn"
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

          <!-- Stats Button -->
          <v-btn
            id="poker-stats-btn"
            variant="text"
            color="grey-lighten-1"
            size="x-small"
            rounded="pill"
            prepend-icon="mdi-chart-bar"
            class="stats-btn ml-1"
            @click="showStatsDialog = true"
          >
            Estadísticas
          </v-btn>
        </div>

        <!-- Right: Refill + Centralized Balance -->
        <div class="d-flex align-center ga-2">
          <v-btn
            v-if="chips < store.bigBlind"
            variant="elevated"
            color="amber-darken-2"
            size="small"
            rounded="pill"
            prepend-icon="mdi-gift"
            class="elevation-4 refill-btn"
            @click="showRefillDialog = true"
          >
            +1,000 Fichas
          </v-btn>

          <AdrenalineBanner />

          <div class="balance-pill">
            <v-icon color="amber" size="18" class="mr-1">mdi-poker-chip</v-icon>
            <span class="balance-amount">{{ chips.toLocaleString() }}</span>
            <span class="balance-lbl ml-1">fichas</span>
          </div>
        </div>
      </header>

      <!-- ═══ ROUND WINNER CELEBRATION / RESULT BANNER ═══ -->
      <transition name="result-slide">
        <div v-if="store.roundResult" class="result-banner px-4 py-2 mt-1">
          <div class="d-flex align-center justify-space-between">
            <div class="d-flex align-center ga-2">
              <v-icon
                :color="store.roundResult.winner === 'player' ? 'amber' : store.roundResult.winner === 'tie' ? 'blue' : 'red'"
                size="24"
              >
                {{
                  store.roundResult.winner === 'player'
                    ? 'mdi-crown'
                    : store.roundResult.winner === 'tie'
                    ? 'mdi-scale-balance'
                    : 'mdi-alert-circle-outline'
                }}
              </v-icon>
              <div>
                <div class="result-title">
                  {{
                    store.roundResult.winner === 'player'
                      ? '¡VICTORIA! GANAS EL BOTE'
                      : store.roundResult.winner === 'tie'
                      ? '¡BOTE DIVIDIDO!'
                      : 'MANO PARA EL DEALER'
                  }}
                </div>
                <div class="result-reason">{{ store.roundResult.reason }}</div>
              </div>
            </div>

            <div v-if="store.roundResult.winner === 'player'" class="result-chips-won">
              +{{ store.roundResult.pot.toLocaleString() }} fichas
            </div>
            <div v-else-if="store.roundResult.winner === 'tie'" class="result-chips-tie">
              +{{ store.roundResult.playerWon.toLocaleString() }} fichas
            </div>
          </div>
        </div>
      </transition>

      <!-- ═══ MAIN POKER TABLE ═══ -->
      <main class="table-area my-auto">
        <PokerTable />
      </main>

      <!-- ═══ CONTROLS AREA ═══ -->
      <footer class="controls-area">
        <PokerControls />
      </footer>
    </v-container>

    <!-- ═══ MODAL: ¿CÓMO JUGAR? ═══ -->
    <GameRulesDialog v-model="showRulesDialog" game="poker" />

    <!-- ═══ MODAL: CONFIRMAR SALIDA ═══ -->
    <v-dialog v-model="showExitConfirmDialog" max-width="440">
      <v-card class="dialog-card pa-4" rounded="xl">
        <v-card-title class="d-flex align-center ga-2 text-amber">
          <v-icon color="amber">mdi-alert</v-icon>
          <span>¿Abandonar mano activa?</span>
        </v-card-title>
        <v-card-text class="dialog-text">
          Hay una mano de Poker en curso con fichas apostadas en el bote. Si sales ahora, te retirarás (Fold) y perderás tus fichas en juego.
        </v-card-text>
        <v-card-actions class="d-flex justify-end ga-2 pt-2">
          <v-btn variant="text" color="grey-lighten-1" @click="showExitConfirmDialog = false">
            Seguir jugando
          </v-btn>
          <v-btn color="red-darken-2" variant="elevated" rounded="pill" @click="confirmExit">
            Retirarme y Salir
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- ═══ MODAL: RECARGAR FICHAS ═══ -->
    <v-dialog v-model="showRefillDialog" max-width="440">
      <v-card class="dialog-card pa-4" rounded="xl">
        <v-card-title class="d-flex align-center ga-2 text-amber">
          <v-icon color="amber">mdi-gift</v-icon>
          <span>Recarga de Cortesía</span>
        </v-card-title>
        <v-card-text class="dialog-text">
          ¡El Royal Casino te otorga <strong>1,000 fichas de cortesía</strong> para continuar en la mesa de Poker!
        </v-card-text>
        <v-card-actions class="d-flex justify-end ga-2 pt-2">
          <v-btn color="amber-darken-2" variant="elevated" rounded="pill" @click="handleRefill">
            Recibir 1,000 Fichas
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- ═══ MODAL: ESTADÍSTICAS ═══ -->
    <v-dialog v-model="showStatsDialog" max-width="460">
      <v-card class="dialog-card pa-4" rounded="xl">
        <v-card-title class="d-flex align-center justify-space-between pb-2">
          <div class="d-flex align-center ga-2 text-amber">
            <v-icon color="amber">mdi-chart-line</v-icon>
            <span>Estadísticas de Poker</span>
          </div>
          <v-btn icon="mdi-close" variant="text" size="small" @click="showStatsDialog = false" />
        </v-card-title>
        <v-card-text class="dialog-text">
          <v-row dense class="mt-1">
            <v-col cols="6">
              <div class="stat-box">
                <div class="stat-num">{{ store.stats.handsPlayed }}</div>
                <div class="stat-lbl">Manos Jugadas</div>
              </div>
            </v-col>
            <v-col cols="6">
              <div class="stat-box">
                <div class="stat-num text-green">{{ store.stats.handsWon }}</div>
                <div class="stat-lbl">Manos Ganadas</div>
              </div>
            </v-col>
            <v-col cols="6">
              <div class="stat-box">
                <div class="stat-num text-red">{{ store.stats.handsLost }}</div>
                <div class="stat-lbl">Manos Perdidas</div>
              </div>
            </v-col>
            <v-col cols="6">
              <div class="stat-box">
                <div class="stat-num text-amber">{{ store.stats.biggestPotWon.toLocaleString() }}</div>
                <div class="stat-lbl">Mayor Bote Ganado</div>
              </div>
            </v-col>
          </v-row>
        </v-card-text>
      </v-card>
    </v-dialog>
  </div>
</template>

<style scoped>
.poker-page {
  width: 100%;
  min-height: 100vh;
  overflow-x: hidden;
  overflow-y: auto;
  background: radial-gradient(circle at 50% 30%, #150608 0%, #0c0305 60%, #050102 100%);
  color: #fff;
  position: relative;
  display: flex;
  flex-direction: column;
}

/* Background Atmosphere Glows */
.poker-bg-glow {
  position: fixed;
  border-radius: 50%;
  filter: blur(120px);
  pointer-events: none;
  opacity: 0.15;
}

.poker-bg-glow--top {
  top: -150px;
  left: 20%;
  width: 500px;
  height: 400px;
  background: #b71c1c;
}

.poker-bg-glow--bottom {
  bottom: -150px;
  right: 20%;
  width: 600px;
  height: 450px;
  background: #d32f2f;
}

.poker-container {
  min-height: 100vh;
  max-width: 1200px;
  margin: 0 auto;
  position: relative;
  z-index: 1;
}

@import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@700;900&family=Press+Start+2P&family=Outfit:wght@400;600;700;800;900&display=swap');

.poker-topbar {
  background: rgba(14, 5, 8, 0.92);
  border: 1.5px solid #ffd54f;
  border-radius: 14px;
  backdrop-filter: blur(10px);
  box-shadow:
    0 0 0 1px #050102,
    0 4px 20px rgba(0, 0, 0, 0.8),
    0 0 15px rgba(255, 213, 79, 0.15);
  z-index: 10;
}

.poker-heading {
  font-family: 'Cinzel', serif;
  font-size: 1.05rem;
  font-weight: 900;
  letter-spacing: 0.12em;
  color: #ffd54f;
  line-height: 1.1;
  text-shadow: 0 0 10px rgba(255, 213, 79, 0.4);
}

.poker-subheading {
  font-size: 0.62rem;
  letter-spacing: 0.14em;
  color: #ffb74d;
  line-height: 1;
  font-weight: 700;
}

.rules-btn {
  border: 1px solid rgba(255, 215, 0, 0.4);
  background: rgba(255, 213, 79, 0.12);
}

.stats-btn {
  font-size: 0.72rem;
}

/* Balance Pill */
.balance-pill {
  display: flex;
  align-items: center;
  background: rgba(0, 0, 0, 0.75);
  border: 1.5px solid #ffd54f;
  border-radius: 999px;
  padding: 4px 14px;
  box-shadow: 0 0 10px rgba(255, 213, 79, 0.25);
}

.balance-amount {
  font-family: 'Cinzel', serif;
  font-size: 0.95rem;
  font-weight: 900;
  color: #ffd54f;
}

.balance-lbl {
  font-size: 0.68rem;
  color: #cfd8dc;
  text-transform: uppercase;
}

/* Result Banner */
.result-banner {
  background: radial-gradient(circle, #22080c 0%, #120305 100%);
  border: 1.5px solid #ffd54f;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.8), 0 0 20px rgba(255, 213, 79, 0.25);
  animation: bannerGlow 1.8s infinite ease-in-out;
  z-index: 10;
}

@keyframes bannerGlow {
  0%, 100% {
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.8), 0 0 15px rgba(255, 213, 79, 0.2);
  }
  50% {
    box-shadow: 0 4px 25px rgba(0, 0, 0, 0.9), 0 0 30px rgba(255, 213, 79, 0.5);
  }
}

.result-title {
  font-family: 'Cinzel', serif;
  font-size: 0.95rem;
  font-weight: 900;
  letter-spacing: 0.08em;
  color: #ffd54f;
}

.result-reason {
  font-size: 0.78rem;
  color: #fff;
}

.result-chips-won {
  font-family: 'Cinzel', serif;
  font-size: 1.15rem;
  font-weight: 900;
  color: #00e676;
  text-shadow: 0 0 10px rgba(0, 230, 118, 0.6);
}

.result-chips-tie {
  font-family: 'Cinzel', serif;
  font-size: 1.1rem;
  font-weight: 900;
  color: #4fc3f7;
}

/* Dialog styling */
.dialog-card {
  background: #15080b !important;
  border: 1.5px solid rgba(255, 215, 0, 0.35);
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.9);
  color: #fff;
}

.dialog-text {
  font-size: 0.85rem;
  color: #cfd8dc;
  line-height: 1.5;
}

.stat-box {
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 215, 0, 0.2);
  border-radius: 10px;
  padding: 10px;
  text-align: center;
}

.stat-num {
  font-family: 'Cinzel', serif;
  font-size: 1.3rem;
  font-weight: 900;
}

.stat-lbl {
  font-size: 0.7rem;
  color: #90a4ae;
  text-transform: uppercase;
}

/* Result slide transition */
.result-slide-enter-active,
.result-slide-leave-active {
  transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}
.result-slide-enter-from,
.result-slide-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}
</style>
