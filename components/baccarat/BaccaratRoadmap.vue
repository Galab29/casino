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
  background: rgba(10, 16, 26, 0.7);
  border: 1px solid rgba(255, 213, 79, 0.2);
  border-radius: 14px;
  backdrop-filter: blur(8px);
}

.roadmap-label {
  font-family: 'Cinzel', serif;
  font-size: 0.72rem;
  font-weight: 800;
  letter-spacing: 1.5px;
  color: #ffd54f;
}

.no-history-text {
  font-size: 0.75rem;
  color: rgba(255, 255, 255, 0.4);
  font-style: italic;
}

.bead-circle {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: 'Cinzel', serif;
  font-size: 0.72rem;
  font-weight: 900;
  color: #fff;
  border: 1.5px solid rgba(255, 255, 255, 0.4);
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.6);
  flex-shrink: 0;
  transition: transform 0.2s ease;
}

.bead-circle--latest {
  border-color: #ffd54f;
  box-shadow: 0 0 10px rgba(255, 213, 79, 0.85);
  transform: scale(1.18);
}

.bead-circle--player {
  background: radial-gradient(circle at 35% 35%, #1976d2, #0d47a1);
}

.bead-circle--banker {
  background: radial-gradient(circle at 35% 35%, #e53935, #b71c1c);
}

.bead-circle--tie {
  background: radial-gradient(circle at 35% 35%, #43a047, #1b5e20);
}

.badge-item {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 0.72rem;
  font-weight: 700;
}

.badge-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.dot-player { background: #1976d2; box-shadow: 0 0 5px #1976d2; }
.dot-banker { background: #e53935; box-shadow: 0 0 5px #e53935; }
.dot-tie { background: #43a047; box-shadow: 0 0 5px #43a047; }
</style>
