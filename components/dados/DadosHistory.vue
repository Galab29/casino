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
  background: #08170f;
  border: 2px solid #ffd54f;
  border-radius: 0;
  box-shadow: 3px 3px 0 #000;
  padding: 10px 14px;
}

.history-title {
  font-family: 'Press Start 2P', monospace;
  font-size: 0.55rem;
  font-weight: 700;
  letter-spacing: 0;
  color: #ffd54f;
}

.history-count {
  font-family: 'Press Start 2P', monospace;
  font-size: 0.45rem;
  color: rgba(255, 255, 255, 0.5);
}

.history-empty {
  font-family: 'Press Start 2P', monospace;
  font-size: 0.48rem;
  color: rgba(255, 255, 255, 0.4);
  text-align: center;
  padding: 8px 0;
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
  background: #ffd54f;
}

.history-card {
  flex-shrink: 0;
  background: #000;
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 0;
  box-shadow: 2px 2px 0 #000;
  padding: 5px 8px;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: all 0.15s ease;
}

.history-card:hover {
  background: #112d1c;
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
  border-radius: 0;
  background: #dc2626;
  color: #fff;
  font-family: 'Press Start 2P', monospace;
  font-size: 0.52rem;
  font-weight: 700;
  box-shadow: 1px 1px 0 #000;
}

.roll-sum-pill {
  width: 22px;
  height: 22px;
  border-radius: 0;
  background: rgba(255, 213, 79, 0.15);
  border: 1px solid #ffd54f;
  box-shadow: 1px 1px 0 #000;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: 'Press Start 2P', monospace;
  font-size: 0.55rem;
  font-weight: 700;
  color: #ffd54f;
}

.roll-event-text {
  font-family: 'Press Start 2P', monospace;
  font-size: 0.48rem;
  font-weight: 700;
  letter-spacing: 0;
}

.roll-profit-badge {
  font-family: 'Press Start 2P', monospace;
  font-size: 0.48rem;
  font-weight: 700;
  color: #69f0ae;
  background: rgba(105, 240, 174, 0.1);
  padding: 2px 4px;
  border-radius: 0;
  border: 1px solid #69f0ae;
}
</style>
