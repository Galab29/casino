<script setup lang="ts">
import type { BaccaratHand, BaccaratBetType, BaccaratHandWinner } from '~/types/baccarat'
import { BACCARAT_PAYOUT_LABELS } from '~/constants/baccarat'
import { useSoundEngine } from '~/composables/useSoundEngine'
import PlayingCard from '~/components/blackjack/PlayingCard.vue'

interface Props {
  playerHand: BaccaratHand
  bankerHand: BaccaratHand
  bets: Record<BaccaratBetType, number>
  disabled: boolean
  isDealing: boolean
  winner: BaccaratHandWinner | null
}

const props = defineProps<Props>()
const emit = defineEmits<{
  (e: 'place-bet', type: BaccaratBetType): void
}>()

const sound = useSoundEngine()

function handleBetClick(type: BaccaratBetType) {
  if (props.disabled || props.isDealing) return
  sound.playChipClick()
  emit('place-bet', type)
}

function formatChipAmount(val: number): string {
  if (val >= 1000) {
    return `${(val / 1000).toFixed(val % 1000 === 0 ? 0 : 1)}k`
  }
  return val.toString()
}

function getChipColor(amount: number): string {
  if (amount >= 500) return '#f57f17'
  if (amount >= 250) return '#c62828'
  if (amount >= 100) return '#5e35b1'
  if (amount >= 50) return '#1565c0'
  if (amount >= 25) return '#2e7d32'
  return '#00897b'
}
</script>

<template>
  <div class="baccarat-felt-surface">
    <!-- ═══ 1. Área Superior: Manos del Jugador y del Banco ═══ -->
    <div class="hands-area d-flex justify-space-between align-center mb-4 px-3">
      <!-- ── Mano del Jugador (Azul) ── -->
      <div
        class="hand-station hand-station--player"
        :class="{
          'hand-station--winner': winner === 'player',
          'hand-station--dealing': isDealing && playerHand.cards.length > 0,
        }"
      >
        <div class="hand-header d-flex align-center justify-space-between mb-2">
          <div class="d-flex align-center ga-2">
            <v-icon color="blue-lighten-2" size="22">mdi-account</v-icon>
            <span class="hand-name">JUGADOR</span>
            <span v-if="playerHand.isNatural" class="badge-natural">NATURAL</span>
            <span v-if="playerHand.hasPair" class="badge-pair">PAREJA</span>
          </div>

          <!-- Puntuación actual -->
          <div class="score-circle score-circle--player">
            {{ playerHand.cards.length > 0 ? playerHand.score : '-' }}
          </div>
        </div>

        <!-- Cartas del Jugador -->
        <div class="cards-display d-flex align-center justify-center">
          <div v-if="playerHand.cards.length === 0" class="empty-cards-placeholder">
            <span>Esperando cartas...</span>
          </div>
          <div v-else class="cards-track d-flex">
            <PlayingCard
              v-for="card in playerHand.cards"
              :key="card.id"
              :card="card"
              back-color="blue"
            />
          </div>
        </div>
      </div>

      <!-- ── Divisor Central VS ── -->
      <div class="vs-station d-flex flex-column align-center px-2">
        <div class="vs-circle">VS</div>
        <div v-if="winner" class="winner-indicator-text mt-1">
          {{ winner === 'player' ? 'JUGADOR GANA' : winner === 'banker' ? 'BANCO GANA' : 'EMPATE' }}
        </div>
      </div>

      <!-- ── Mano del Banco (Rojo) ── -->
      <div
        class="hand-station hand-station--banker"
        :class="{
          'hand-station--winner': winner === 'banker',
          'hand-station--dealing': isDealing && bankerHand.cards.length > 0,
        }"
      >
        <div class="hand-header d-flex align-center justify-space-between mb-2">
          <div class="d-flex align-center ga-2">
            <v-icon color="red-lighten-2" size="22">mdi-bank</v-icon>
            <span class="hand-name">BANCO</span>
            <span v-if="bankerHand.isNatural" class="badge-natural">NATURAL</span>
            <span v-if="bankerHand.hasPair" class="badge-pair">PAREJA</span>
          </div>

          <!-- Puntuación actual -->
          <div class="score-circle score-circle--banker">
            {{ bankerHand.cards.length > 0 ? bankerHand.score : '-' }}
          </div>
        </div>

        <!-- Cartas del Banco -->
        <div class="cards-display d-flex align-center justify-center">
          <div v-if="bankerHand.cards.length === 0" class="empty-cards-placeholder">
            <span>Esperando cartas...</span>
          </div>
          <div v-else class="cards-track d-flex">
            <PlayingCard
              v-for="card in bankerHand.cards"
              :key="card.id"
              :card="card"
              back-color="red"
            />
          </div>
        </div>
      </div>
    </div>

    <!-- ═══ 2. Tapete Inferior: Zonas de Apuestas ═══ -->
    <div class="betting-felt-grid">
      <!-- Apuestas Secundarias: Parejas -->
      <div class="side-bets-row d-flex justify-space-between ga-3 mb-2">
        <!-- Par Jugador (11:1) -->
        <div
          class="bet-spot spot-pair spot-pair--player"
          :class="{ 'spot--winner': winner && playerHand.hasPair }"
          @click="handleBetClick('player_pair')"
        >
          <div class="bet-spot-title">PAR JUGADOR</div>
          <div class="bet-spot-payout">{{ BACCARAT_PAYOUT_LABELS.player_pair }}</div>
          <div
            v-if="bets.player_pair > 0"
            class="chip-token"
            :style="{ '--chip-color': getChipColor(bets.player_pair) }"
          >
            {{ formatChipAmount(bets.player_pair) }}
          </div>
        </div>

        <!-- Par Banco (11:1) -->
        <div
          class="bet-spot spot-pair spot-pair--banker"
          :class="{ 'spot--winner': winner && bankerHand.hasPair }"
          @click="handleBetClick('banker_pair')"
        >
          <div class="bet-spot-title">PAR BANCO</div>
          <div class="bet-spot-payout">{{ BACCARAT_PAYOUT_LABELS.banker_pair }}</div>
          <div
            v-if="bets.banker_pair > 0"
            class="chip-token"
            :style="{ '--chip-color': getChipColor(bets.banker_pair) }"
          >
            {{ formatChipAmount(bets.banker_pair) }}
          </div>
        </div>
      </div>

      <!-- Apuestas Principales: JUGADOR - EMPATE - BANCO -->
      <div class="main-bets-row d-flex ga-3">
        <!-- JUGADOR (1:1) -->
        <div
          class="bet-spot spot-main spot-player flex-1"
          :class="{ 'spot--winner': winner === 'player' }"
          @click="handleBetClick('player')"
        >
          <div class="spot-icon-wrap">
            <v-icon color="blue-lighten-2" size="28">mdi-account</v-icon>
          </div>
          <div class="bet-spot-title">JUGADOR</div>
          <div class="bet-spot-payout">PAGA 1 A 1</div>
          <div
            v-if="bets.player > 0"
            class="chip-token"
            :style="{ '--chip-color': getChipColor(bets.player) }"
          >
            {{ formatChipAmount(bets.player) }}
          </div>
        </div>

        <!-- EMPATE (8:1) -->
        <div
          class="bet-spot spot-main spot-tie"
          :class="{ 'spot--winner': winner === 'tie' }"
          @click="handleBetClick('tie')"
        >
          <div class="spot-icon-wrap">
            <v-icon color="green-lighten-2" size="24">mdi-handshake</v-icon>
          </div>
          <div class="bet-spot-title">EMPATE</div>
          <div class="bet-spot-payout">PAGA 8 A 1</div>
          <div
            v-if="bets.tie > 0"
            class="chip-token"
            :style="{ '--chip-color': getChipColor(bets.tie) }"
          >
            {{ formatChipAmount(bets.tie) }}
          </div>
        </div>

        <!-- BANCO (0.95:1) -->
        <div
          class="bet-spot spot-main spot-banker flex-1"
          :class="{ 'spot--winner': winner === 'banker' }"
          @click="handleBetClick('banker')"
        >
          <div class="spot-icon-wrap">
            <v-icon color="red-lighten-2" size="28">mdi-bank</v-icon>
          </div>
          <div class="bet-spot-title">BANCO</div>
          <div class="bet-spot-payout">PAGA 0.95 A 1 (COMISIÓN 5%)</div>
          <div
            v-if="bets.banker > 0"
            class="chip-token"
            :style="{ '--chip-color': getChipColor(bets.banker) }"
          >
            {{ formatChipAmount(bets.banker) }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.baccarat-felt-surface {
  background: radial-gradient(circle at 50% 30%, #082414 0%, #04120a 100%);
  border: 4px solid #b8860b;
  border-radius: 0;
  padding: 16px;
  box-shadow: 0 6px 0 #000, inset 0 0 0 2px #ffd54f;
  user-select: none;
}

/* ═══ Estaciones de las Manos ═══ */
.hand-station {
  flex: 1;
  background: #0d131f;
  border: 3px solid #2a3a55;
  border-radius: 0;
  box-shadow: 4px 4px 0 #000;
  padding: 12px 14px;
  transition: all 0.2s ease;
}

.hand-station--player {
  border-color: #2563eb;
}

.hand-station--banker {
  border-color: #dc2626;
}

.hand-station--winner {
  border-color: #ffd54f !important;
  box-shadow: 0 0 0 2px #fff, 4px 4px 0 #000 !important;
  transform: translateY(-2px);
}

.hand-name {
  font-family: 'Press Start 2P', monospace;
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0;
}

.score-circle {
  width: 36px;
  height: 36px;
  border-radius: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: 'Press Start 2P', monospace;
  font-size: 0.85rem;
  font-weight: 700;
  color: #fff;
  border: 2px solid #ffd54f;
  box-shadow: 2px 2px 0 #000;
}

.score-circle--player {
  background: #1d4ed8;
}

.score-circle--banker {
  background: #b91c1c;
}

.badge-natural {
  background: #ffd54f;
  color: #000;
  font-family: 'Press Start 2P', monospace;
  font-size: 0.5rem;
  font-weight: 700;
  padding: 3px 6px;
  border-radius: 0;
  box-shadow: 2px 2px 0 #000;
  animation: pulse 1s infinite alternate;
}

.badge-pair {
  background: #7e22ce;
  color: #fff;
  font-family: 'Press Start 2P', monospace;
  font-size: 0.5rem;
  font-weight: 700;
  padding: 3px 6px;
  border-radius: 0;
  box-shadow: 2px 2px 0 #000;
}

.cards-display {
  min-height: 120px;
}

.empty-cards-placeholder {
  font-family: 'Press Start 2P', monospace;
  font-size: 0.58rem;
  color: rgba(255, 255, 255, 0.4);
}

/* Divisor VS */
.vs-station {
  width: 90px;
}

.vs-circle {
  width: 42px;
  height: 42px;
  border-radius: 0;
  background: #ffd54f;
  color: #120b00;
  font-family: 'Press Start 2P', monospace;
  font-size: 0.78rem;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2px solid #000;
  box-shadow: 3px 3px 0 #000;
}

.winner-indicator-text {
  font-family: 'Press Start 2P', monospace;
  font-size: 0.52rem;
  font-weight: 700;
  color: #ffd54f;
  text-align: center;
  letter-spacing: 0;
  text-shadow: 1px 1px 0 #000;
}

/* ═══ Zonas de Apuestas ═══ */
.bet-spot {
  position: relative;
  background: #0e121a;
  border: 3px solid rgba(255, 213, 79, 0.4);
  border-radius: 0;
  padding: 12px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: 4px 4px 0 #000;
  transition: all 0.15s ease;
}

.bet-spot:hover {
  filter: brightness(1.2);
  border-color: #ffd54f;
  transform: translate(-2px, -2px);
  box-shadow: 6px 6px 0 #000;
}

.spot--winner {
  border-color: #ffd54f !important;
  box-shadow: 0 0 0 2px #fff, 4px 4px 0 #000 !important;
  animation: winningPulse 1.2s infinite alternate;
}

@keyframes winningPulse {
  0% { transform: scale(1); filter: brightness(1.1); }
  100% { transform: scale(1.02); filter: brightness(1.3); }
}

.spot-player {
  background: #0f1c3f;
  border-color: #3b82f6;
}

.spot-banker {
  background: #3a0d10;
  border-color: #ef4444;
}

.spot-tie {
  width: 180px;
  background: #0d2f1d;
  border-color: #22c55e;
}

.spot-pair {
  flex: 1;
  padding: 8px 12px;
}

.spot-pair--player { border-color: #3b82f6; }
.spot-pair--banker { border-color: #ef4444; }

.bet-spot-title {
  font-family: 'Press Start 2P', monospace;
  font-size: 0.72rem;
  font-weight: 700;
  color: #fff;
  letter-spacing: 0;
}

.spot-pair .bet-spot-title {
  font-size: 0.58rem;
}

.bet-spot-payout {
  font-family: 'Press Start 2P', monospace;
  font-size: 0.55rem;
  color: #ffd54f;
  font-weight: 700;
  margin-top: 4px;
}

/* Ficha 8-Bit Token */
.chip-token {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 32px;
  height: 32px;
  border-radius: 0;
  background: var(--chip-color);
  border: 2px solid #ffffff;
  box-shadow: 2px 2px 0 #000;
  color: #fff;
  font-family: 'Press Start 2P', monospace;
  font-size: 0.52rem;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 5;
  pointer-events: none;
  animation: dropChip 0.18s steps(4);
}

@keyframes dropChip {
  0% { transform: translate(-50%, -80%) scale(1.3); opacity: 0.5; }
  100% { transform: translate(-50%, -50%) scale(1); opacity: 1; }
}

@media (max-width: 768px) {
  .hands-area { flex-direction: column; gap: 10px; }
  .main-bets-row { flex-direction: column; }
  .spot-tie { width: 100%; }
}
</style>
