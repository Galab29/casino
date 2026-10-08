<script setup lang="ts">
import { ref, computed } from 'vue'
import type { SpinResult, RuletaStats } from '~/types/ruleta'
import { RED_NUMBERS } from '~/constants/ruleta'

interface Props {
  history: SpinResult[]
  stats: RuletaStats
}

const props = defineProps<Props>()
const emit = defineEmits<{
  (e: 'reset-stats'): void
}>()

const showStatsDialog = ref(false)

const winRate = computed(() => {
  if (props.stats.spins === 0) return 0
  return Math.round((props.stats.wins / props.stats.spins) * 100)
})

// Estadísticas de frecuencia de color
const colorDistribution = computed(() => {
  if (props.history.length === 0) return { red: 0, black: 0, green: 0 }
  let red = 0, black = 0, green = 0
  for (const h of props.history) {
    if (h.number === 0) green++
    else if (RED_NUMBERS.has(h.number)) red++
    else black++
  }
  const total = props.history.length
  return {
    red: Math.round((red / total) * 100),
    black: Math.round((black / total) * 100),
    green: Math.round((green / total) * 100),
  }
})
</script>

<template>
  <div class="roulette-history-bar d-flex align-center justify-space-between flex-wrap ga-2 px-3 py-2">
    <!-- Últimos números sorteados -->
    <div class="d-flex align-center ga-2 history-strip">
      <span class="history-label">HISTORIAL:</span>

      <div v-if="history.length === 0" class="no-history-text">
        Realiza una tirada para ver el historial
      </div>

      <div v-else class="d-flex align-center ga-1.5 overflow-x-auto">
        <div
          v-for="(res, idx) in history.slice(0, 10)"
          :key="res.id"
          class="history-badge"
          :class="[
            `history-badge--${res.info.color}`,
            { 'history-badge--latest': idx === 0 }
          ]"
        >
          {{ res.number }}
        </div>
      </div>
    </div>

    <!-- Botón para ver Estadísticas Completas -->
    <v-btn
      variant="tonal"
      color="amber-lighten-2"
      size="small"
      rounded="pill"
      prepend-icon="mdi-chart-bell-curve-cumulative"
      class="stats-toggle-btn"
      @click="showStatsDialog = true"
    >
      Estadísticas
    </v-btn>

    <!-- Diálogo de Estadísticas de la Sesión -->
    <v-dialog v-model="showStatsDialog" max-width="500">
      <v-card class="stats-dialog-card pa-4" rounded="xl">
        <v-card-title class="d-flex align-center justify-space-between">
          <div class="d-flex align-center ga-2">
            <v-icon color="amber" size="26">mdi-chart-line</v-icon>
            <span class="dialog-title">Estadísticas de Ruleta</span>
          </div>
          <v-btn icon="mdi-close" variant="text" size="small" @click="showStatsDialog = false" />
        </v-card-title>

        <v-card-text class="pt-2">
          <!-- Métricas clave -->
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

          <!-- Distribución de colores recientes -->
          <div class="mb-3">
            <div class="d-flex justify-space-between text-caption font-weight-bold mb-1">
              <span>Distribución reciente</span>
              <span>Últimas {{ history.length }} tiradas</span>
            </div>
            <div class="distribution-bar d-flex">
              <div
                class="dist-segment dist-red"
                :style="{ width: `${colorDistribution.red}%` }"
                :title="`Rojo: ${colorDistribution.red}%`"
              >
                {{ colorDistribution.red > 10 ? `${colorDistribution.red}%` : '' }}
              </div>
              <div
                class="dist-segment dist-green"
                :style="{ width: `${colorDistribution.green}%` }"
                :title="`Cero: ${colorDistribution.green}%`"
              >
                {{ colorDistribution.green > 10 ? `${colorDistribution.green}%` : '' }}
              </div>
              <div
                class="dist-segment dist-black"
                :style="{ width: `${colorDistribution.black}%` }"
                :title="`Negro: ${colorDistribution.black}%`"
              >
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
            @click="emit('reset-stats')"
          >
            Reiniciar Estadísticas
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
  </div>
</template>

<style scoped>
.roulette-history-bar {
  background: rgba(10, 16, 26, 0.65);
  border: 1px solid rgba(255, 213, 79, 0.15);
  border-radius: 12px;
  backdrop-filter: blur(8px);
}

.history-strip {
  overflow-x: auto;
}

.history-label {
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

.history-badge {
  width: 26px;
  height: 26px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: 'Cinzel', serif;
  font-size: 0.75rem;
  font-weight: 900;
  color: #fff;
  border: 1px solid rgba(255, 255, 255, 0.3);
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.6);
  flex-shrink: 0;
  transition: transform 0.2s ease;
}

.history-badge--latest {
  border-color: #ffd54f;
  border-width: 2px;
  box-shadow: 0 0 10px rgba(255, 213, 79, 0.8);
  transform: scale(1.15);
}

.history-badge--green {
  background: #1b5e20;
}

.history-badge--red {
  background: #c62828;
}

.history-badge--black {
  background: #212529;
}

.stats-toggle-btn {
  font-size: 0.72rem;
  letter-spacing: 0.5px;
}

/* ═══ Diálogo de estadísticas ═══ */
.stats-dialog-card {
  background: #101624 !important;
  border: 1px solid rgba(255, 213, 79, 0.3);
}

.dialog-title {
  font-family: 'Cinzel', serif;
  font-weight: 800;
  color: #ffd54f;
}

.metric-card {
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 10px;
  padding: 10px;
  display: flex;
  flex-direction: column;
}

.metric-label {
  font-size: 0.7rem;
  color: rgba(255, 255, 255, 0.5);
}

.metric-val {
  font-family: 'Cinzel', serif;
  font-size: 1.3rem;
  font-weight: 800;
  color: #fff;
}

.distribution-bar {
  height: 20px;
  border-radius: 10px;
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
  transition: width 0.3s ease;
}

.dist-red {
  background: #c62828;
}

.dist-green {
  background: #1b5e20;
}

.dist-black {
  background: #212529;
}
</style>
