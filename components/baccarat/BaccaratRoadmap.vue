<script setup lang="ts">
import { computed } from 'vue'
import type { BaccaratRoundResult, BaccaratStats } from '~/types/baccarat'

interface Props {
  history: BaccaratRoundResult[]
  stats: BaccaratStats
}

const props = defineProps<Props>()

const winPercents = computed(() => {
  if (props.stats.rounds === 0) return { player: 0, banker: 0, tie: 0 }
  const total = props.stats.rounds
  return {
    player: Math.round((props.stats.playerWins / total) * 100),
    banker: Math.round((props.stats.bankerWins / total) * 100),
    tie: Math.round((props.stats.ties / total) * 100),
  }
})
</script>

<template>
  <div class="baccarat-roadmap px-3 py-2">
    <div class="d-flex align-center justify-space-between flex-wrap ga-2">
      <!-- Tira de Bead Plate / Tendencias -->
      <div class="d-flex align-center ga-2 roadmap-strip-wrap">
        <span class="roadmap-label">TENDENCIA:</span>

        <div v-if="history.length === 0" class="no-history-text">
          Haz tu apuesta y reparte para registrar tendencias
        </div>

        <div v-else class="d-flex align-center ga-1.5 overflow-x-auto py-1">
          <div
            v-for="(round, idx) in history.slice(0, 16)"
            :key="round.id"
            class="bead-circle"
            :class="[
              `bead-circle--${round.winner}`,
              { 'bead-circle--latest': idx === 0 }
            ]"
            :title="`Ronda ${round.id}: ${round.winner.toUpperCase()} (${round.playerScore} vs ${round.bankerScore})`"
          >
            <span class="bead-text">
              {{ round.winner === 'player' ? 'J' : round.winner === 'banker' ? 'B' : 'E' }}
            </span>
          </div>
        </div>
      </div>

      <!-- Resumen de porcentajes -->
      <div class="d-flex align-center ga-3 stats-badges">
        <div class="badge-item text-blue">
          <span class="badge-dot dot-player" />
          <span>Jugador: {{ winPercents.player }}%</span>
        </div>
        <div class="badge-item text-red">
          <span class="badge-dot dot-banker" />
          <span>Banco: {{ winPercents.banker }}%</span>
        </div>
        <div class="badge-item text-green">
          <span class="badge-dot dot-tie" />
          <span>Empate: {{ winPercents.tie }}%</span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.baccarat-roadmap {
  background: #0b111c;
  border: 2px solid #ffd54f;
  border-radius: 0;
  box-shadow: 3px 3px 0 #000;
}

.roadmap-label {
  font-family: 'Press Start 2P', monospace;
  font-size: 0.55rem;
  letter-spacing: 0;
  color: #ffd54f;
}

.no-history-text {
  font-family: 'Press Start 2P', monospace;
  font-size: 0.52rem;
  color: rgba(255, 255, 255, 0.4);
}

.bead-circle {
  width: 22px;
  height: 22px;
  border-radius: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: 'Press Start 2P', monospace;
  font-size: 0.58rem;
  font-weight: 700;
  color: #fff;
  border: 1px solid #fff;
  box-shadow: 2px 2px 0 #000;
  flex-shrink: 0;
  transition: transform 0.15s ease;
}

.bead-circle--latest {
  border-color: #ffd54f;
  border-width: 2px;
  box-shadow: 0 0 8px rgba(255, 213, 79, 0.85), 2px 2px 0 #000;
  transform: scale(1.15);
}

.bead-circle--player {
  background: #1d4ed8;
}

.bead-circle--banker {
  background: #b91c1c;
}

.bead-circle--tie {
  background: #15803d;
}

.badge-item {
  display: flex;
  align-items: center;
  gap: 5px;
  font-family: 'Press Start 2P', monospace;
  font-size: 0.52rem;
  font-weight: 700;
}

.badge-dot {
  width: 8px;
  height: 8px;
  border-radius: 0;
}

.dot-player { background: #3b82f6; box-shadow: 1px 1px 0 #000; }
.dot-banker { background: #ef4444; box-shadow: 1px 1px 0 #000; }
.dot-tie { background: #22c55e; box-shadow: 1px 1px 0 #000; }
</style>
