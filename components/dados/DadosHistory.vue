<script setup lang="ts">
import type { RollResult } from '~/types/dados'

interface Props {
  history: RollResult[]
}

defineProps<Props>()

function getEventColor(event: RollResult['event']): string {
  switch (event) {
    case 'natural_win':
    case 'point_hit':
      return '#4caf50'
    case 'seven_out':
    case 'craps_loss':
      return '#e53935'
    case 'point_established':
      return '#ffd54f'
    default:
      return '#90a4ae'
  }
}
</script>

<template>
  <div class="dados-history-strip">
    <div class="d-flex align-center justify-space-between mb-2">
      <div class="d-flex align-center ga-2">
        <v-icon color="amber" size="18">mdi-history</v-icon>
        <span class="history-title">ÚLTIMAS TIRADAS</span>
      </div>
      <span class="history-count" v-if="history.length > 0">
        {{ history.length }} lanzamientos
      </span>
    </div>

    <!-- Ticker Horizontal de Tiradas -->
    <div v-if="history.length === 0" class="history-empty">
      No hay tiradas registradas aún en esta sesión.
    </div>

    <div v-else class="history-scroll-track">
      <div
        v-for="roll in history"
        :key="roll.id"
        class="history-card"
        :style="{ '--badge-color': getEventColor(roll.event) }"
      >
        <!-- Mini Dados -->
        <div class="dice-pair-display">
          <span class="mini-die-red">{{ roll.die1 }}</span>
          <span class="mini-die-red">{{ roll.die2 }}</span>
        </div>

        <!-- Total de la suma -->
        <div class="roll-sum-pill">
          <span>{{ roll.total }}</span>
        </div>

        <!-- Evento / Resultado -->
        <div class="roll-event-text" :style="{ color: getEventColor(roll.event) }">
          <span v-if="roll.event === 'point_hit'">¡PUNTO!</span>
          <span v-else-if="roll.event === 'point_established'">PUNTO {{ roll.total }}</span>
          <span v-else-if="roll.event === 'natural_win'">NATURAL</span>
          <span v-else-if="roll.event === 'craps_loss'">CRAPS</span>
          <span v-else-if="roll.event === 'seven_out'">7 OUT</span>
          <span v-else>TIRO</span>
        </div>

        <!-- Ganancia neta si hubo apuesta -->
        <div v-if="roll.netProfit > 0" class="roll-profit-badge">
          +{{ roll.netProfit.toLocaleString() }}
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.dados-history-strip {
  background: rgba(10, 15, 20, 0.65);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 213, 79, 0.15);
  border-radius: 16px;
  padding: 12px 16px;
}

.history-title {
  font-family: 'Cinzel', serif;
  font-size: 0.78rem;
  font-weight: 800;
  letter-spacing: 1.5px;
  color: #ffd54f;
}

.history-count {
  font-size: 0.72rem;
  color: rgba(255, 255, 255, 0.5);
}

.history-empty {
  font-size: 0.75rem;
  color: rgba(255, 255, 255, 0.4);
  text-align: center;
  padding: 10px 0;
}

.history-scroll-track {
  display: flex;
  align-items: center;
  gap: 8px;
  overflow-x: auto;
  padding-bottom: 4px;
}

.history-scroll-track::-webkit-scrollbar {
  height: 4px;
}

.history-scroll-track::-webkit-scrollbar-thumb {
  background: rgba(255, 213, 79, 0.3);
  border-radius: 4px;
}

.history-card {
  flex-shrink: 0;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 10px;
  padding: 6px 10px;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: all 0.2s ease;
}

.history-card:hover {
  background: rgba(255, 255, 255, 0.08);
  border-color: var(--badge-color);
}

.dice-pair-display {
  display: flex;
  gap: 3px;
}

.mini-die-red {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 18px;
  height: 18px;
  border-radius: 4px;
  background: #d32f2f;
  color: #fff;
  font-size: 0.75rem;
  font-weight: 900;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.5);
}

.roll-sum-pill {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: rgba(255, 213, 79, 0.15);
  border: 1px solid #ffd54f;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: 'Cinzel', serif;
  font-size: 0.8rem;
  font-weight: 900;
  color: #ffd54f;
}

.roll-event-text {
  font-size: 0.68rem;
  font-weight: 800;
  letter-spacing: 0.5px;
}

.roll-profit-badge {
  font-size: 0.68rem;
  font-weight: 800;
  color: #69f0ae;
  background: rgba(105, 240, 174, 0.1);
  padding: 1px 6px;
  border-radius: 8px;
}
</style>
