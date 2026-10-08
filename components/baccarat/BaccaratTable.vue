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
  background: radial-gradient(circle at 50% 30%, #0d3820 0%, #082414 100%);
  border: 4px solid #b8860b;
  border-radius: 20px;
  padding: 16px;
  box-shadow: 0 10px 35px rgba(0, 0, 0, 0.7), inset 0 0 30px rgba(0, 0, 0, 0.7);
  user-select: none;
}

/* ═══ Estaciones de las Manos ═══ */
.hand-station {
  flex: 1;
  background: rgba(0, 0, 0, 0.4);
  border: 1.5px solid rgba(255, 213, 79, 0.3);
  border-radius: 16px;
  padding: 12px 14px;
  transition: all 0.3s ease;
}

.hand-station--player {
  border-color: rgba(66, 165, 245, 0.4);
}

.hand-station--banker {
  border-color: rgba(239, 83, 80, 0.4);
}

.hand-station--winner {
  border-color: #ffd54f !important;
  box-shadow: 0 0 25px rgba(255, 213, 79, 0.5), inset 0 0 15px rgba(255, 213, 79, 0.2);
  transform: translateY(-2px);
}

.hand-name {
  font-family: 'Cinzel', serif;
  font-size: 1.05rem;
  font-weight: 900;
  letter-spacing: 1px;
}

.score-circle {
  width: 38px;
  height: 38px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: 'Cinzel', serif;
  font-size: 1.3rem;
  font-weight: 900;
  color: #fff;
  border: 2px solid #ffd54f;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.6);
}

.score-circle--player {
  background: radial-gradient(circle, #1e88e5, #0d47a1);
}

.score-circle--banker {
  background: radial-gradient(circle, #e53935, #b71c1c);
}

.badge-natural {
  background: linear-gradient(135deg, #ffd54f 0%, #ff8f00 100%);
  color: #000;
  font-size: 0.65rem;
  font-weight: 900;
  padding: 2px 6px;
  border-radius: 8px;
  letter-spacing: 1px;
  animation: pulse 1s infinite alternate;
}

.badge-pair {
  background: #6a1b9a;
  color: #fff;
  font-size: 0.65rem;
  font-weight: 800;
  padding: 2px 6px;
  border-radius: 8px;
}

.cards-display {
  min-height: 120px;
}

.empty-cards-placeholder {
  font-size: 0.8rem;
  color: rgba(255, 255, 255, 0.35);
  font-style: italic;
}

/* Divisor VS */
.vs-station {
  width: 90px;
}

.vs-circle {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: radial-gradient(circle, #ffd54f 0%, #ff8f00 100%);
  color: #120b00;
  font-family: 'Cinzel', serif;
  font-size: 1.1rem;
  font-weight: 900;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 0 15px rgba(255, 213, 79, 0.4);
}

.winner-indicator-text {
  font-family: 'Cinzel', serif;
  font-size: 0.68rem;
  font-weight: 900;
  color: #ffd54f;
  text-align: center;
  letter-spacing: 1px;
}

/* ═══ Zonas de Apuestas ═══ */
.bet-spot {
  position: relative;
  background: rgba(0, 0, 0, 0.45);
  border: 2px solid rgba(255, 213, 79, 0.4);
  border-radius: 14px;
  padding: 12px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
}

.bet-spot:hover {
  filter: brightness(1.2);
  border-color: #ffd54f;
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.5);
}

.spot--winner {
  border-color: #ffd54f !important;
  box-shadow: 0 0 25px rgba(255, 213, 79, 0.8), inset 0 0 15px rgba(255, 213, 79, 0.3) !important;
  animation: winningPulse 1.2s infinite alternate;
}

@keyframes winningPulse {
  0% { transform: scale(1); filter: brightness(1.2); }
  100% { transform: scale(1.03); filter: brightness(1.4); }
}

.spot-player {
  background: linear-gradient(135deg, rgba(25, 118, 210, 0.3) 0%, rgba(13, 71, 161, 0.45) 100%);
  border-color: #42a5f5;
}

.spot-banker {
  background: linear-gradient(135deg, rgba(229, 57, 53, 0.3) 0%, rgba(183, 28, 28, 0.45) 100%);
  border-color: #ef5350;
}

.spot-tie {
  width: 180px;
  background: linear-gradient(135deg, rgba(67, 160, 71, 0.3) 0%, rgba(27, 94, 32, 0.45) 100%);
  border-color: #66bb6a;
}

.spot-pair {
  flex: 1;
  padding: 8px 12px;
}

.spot-pair--player { border-color: rgba(66, 165, 245, 0.5); }
.spot-pair--banker { border-color: rgba(239, 83, 80, 0.5); }

.bet-spot-title {
  font-family: 'Cinzel', serif;
  font-size: 1.15rem;
  font-weight: 900;
  color: #fff;
  letter-spacing: 1.5px;
}

.spot-pair .bet-spot-title {
  font-size: 0.85rem;
}

.bet-spot-payout {
  font-size: 0.7rem;
  color: #ffd54f;
  font-weight: 700;
  letter-spacing: 0.5px;
}

/* Ficha 3D */
.chip-token {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: radial-gradient(circle at 35% 35%, var(--chip-color), #000);
  border: 2px dashed rgba(255, 255, 255, 0.85);
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.8), 0 0 10px var(--chip-color);
  color: #fff;
  font-size: 0.7rem;
  font-weight: 900;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 5;
  pointer-events: none;
  animation: dropChip 0.18s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

@keyframes dropChip {
  0% { transform: translate(-50%, -80%) scale(1.4); opacity: 0.5; }
  100% { transform: translate(-50%, -50%) scale(1); opacity: 1; }
}

@media (max-width: 768px) {
  .hands-area { flex-direction: column; gap: 10px; }
  .main-bets-row { flex-direction: column; }
  .spot-tie { width: 100%; }
}
</style>
