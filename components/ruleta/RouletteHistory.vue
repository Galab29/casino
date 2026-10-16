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
.roulette-history-bar {
  background: #0b111c;
  border: 2px solid #ffd54f;
  border-radius: 0;
  box-shadow: 3px 3px 0 #000;
}

.history-strip {
  overflow-x: auto;
}

.history-label {
  font-family: 'Press Start 2P', monospace;
  font-size: 0.52rem;
  letter-spacing: 0;
  color: #ffd54f;
}

.no-history-text {
  font-family: 'Press Start 2P', monospace;
  font-size: 0.48rem;
  color: rgba(255, 255, 255, 0.4);
}

.history-badge {
  width: 24px;
  height: 24px;
  border-radius: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: 'Press Start 2P', monospace;
  font-size: 0.55rem;
  font-weight: 700;
  color: #fff;
  border: 1px solid rgba(255, 255, 255, 0.6);
  box-shadow: 2px 2px 0 #000;
  flex-shrink: 0;
  transition: transform 0.15s ease;
}

.history-badge--latest {
  border-color: #ffd54f;
  border-width: 2px;
  box-shadow: 0 0 10px rgba(255, 213, 79, 0.8), 2px 2px 0 #000;
  transform: scale(1.15);
}

.history-badge--green {
  background: #15803d;
}

.history-badge--red {
  background: #b91c1c;
}

.history-badge--black {
  background: #18181b;
}

.stats-toggle-btn {
  font-family: 'Press Start 2P', monospace !important;
  font-size: 0.52rem !important;
  letter-spacing: 0;
}

/* ═══ Diálogo de estadísticas ═══ */
.stats-dialog-card {
  background: #0c1017 !important;
  border: 3px solid #ffd54f !important;
  border-radius: 0 !important;
  box-shadow: 6px 6px 0 #000 !important;
}

.dialog-title {
  font-family: 'Press Start 2P', monospace;
  font-size: 0.72rem;
  font-weight: 700;
  color: #ffd54f;
}

.metric-card {
  background: #111827;
  border: 2px solid #2a3a55;
  border-radius: 0;
  box-shadow: 2px 2px 0 #000;
  padding: 8px;
  display: flex;
  flex-direction: column;
}

.metric-label {
  font-family: 'Press Start 2P', monospace;
  font-size: 0.45rem;
  color: rgba(255, 255, 255, 0.6);
}

.metric-val {
  font-family: 'Press Start 2P', monospace;
  font-size: 0.78rem;
  font-weight: 700;
  color: #fff;
  margin-top: 4px;
}

.distribution-bar {
  height: 20px;
  border-radius: 0;
  border: 2px solid #000;
  overflow: hidden;
  box-shadow: 2px 2px 0 #000;
}

.dist-segment {
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: 'Press Start 2P', monospace;
  font-size: 0.48rem;
  font-weight: 700;
  color: #fff;
  transition: width 0.3s ease;
}

.dist-red {
  background: #b91c1c;
}

.dist-green {
  background: #15803d;
}

.dist-black {
  background: #18181b;
}
</style>
