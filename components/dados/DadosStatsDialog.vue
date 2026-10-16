<script setup lang="ts">
import { computed } from 'vue'
import type { DadosStats } from '~/types/dados'

interface Props {
  stats: DadosStats
}

const props = defineProps<Props>()
const modelValue = defineModel<boolean>({ default: false })

const emit = defineEmits<{
  (e: 'reset-stats'): void
}>()

// Máximo de apariciones para escalar las barras de frecuencia
const maxFrequency = computed(() => {
  const vals = Object.values(props.stats.numberFrequency)
  return Math.max(1, ...vals)
})

// Probabilidad teórica de Craps (36 combinaciones posibles)
const theoreticalPct: Record<number, number> = {
  2: 2.8,
  3: 5.6,
  4: 8.3,
  5: 11.1,
  6: 13.9,
  7: 16.7,
  8: 13.9,
  9: 11.1,
  10: 8.3,
  11: 5.6,
  12: 2.8,
}
</script>

<template>
  <v-dialog v-model="modelValue" max-width="600" scrollable>
    <v-card class="dados-stats-card pa-4" rounded="xl">
      <!-- Encabezado -->
      <v-card-title class="d-flex align-center justify-space-between pb-2">
        <div class="d-flex align-center ga-3">
          <div class="stats-icon-wrap">
            <v-icon color="amber" size="28">mdi-chart-bar</v-icon>
          </div>
          <div>
            <h2 class="stats-title">Estadísticas de Craps</h2>
            <p class="stats-subtitle">Frecuencia de Dados y Rendimiento</p>
          </div>
        </div>
        <v-btn icon="mdi-close" variant="text" size="small" @click="modelValue = false" />
      </v-card-title>

      <v-divider class="my-3 border-opacity-25" />

      <v-card-text class="pa-2">
        <!-- Tarjetas Resumen -->
        <div class="stats-grid mb-4">
          <div class="stat-box">
            <span class="stat-label">TIRADAS TOTALES</span>
            <span class="stat-val">{{ stats.totalRolls }}</span>
          </div>

          <div class="stat-box">
            <span class="stat-label">PUNTOS CONCRETADOS</span>
            <span class="stat-val text-green-accent-3">{{ stats.pointsHit }}</span>
          </div>

          <div class="stat-box">
            <span class="stat-label">SEVEN OUTS</span>
            <span class="stat-val text-red-accent-2">{{ stats.sevenOuts }}</span>
          </div>

          <div class="stat-box">
            <span class="stat-label">MAYOR GANANCIA</span>
            <span class="stat-val text-amber">+{{ stats.biggestWin.toLocaleString() }}</span>
          </div>
        </div>

        <!-- Gráfico de Distribución de Frecuencia de Números (2 al 12) -->
        <div class="frequency-section">
          <div class="frequency-title-bar mb-3">
            <span class="freq-heading">DISTRIBUCIÓN DE FRECUENCIA (CAMPANA DE GAUSS)</span>
            <span class="freq-sub">Compara tus resultados reales con la probabilidad matemática</span>
          </div>

          <div class="frequency-chart">
            <div
              v-for="num in [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]"
              :key="num"
              class="freq-column"
            >
              <div class="bar-track">
                <!-- Barra Real -->
                <div
                  class="bar-fill"
                  :class="{ 'bar-fill--peak': num === 7 }"
                  :style="{
                    height: `${((stats.numberFrequency[num] || 0) / maxFrequency) * 100}%`,
                  }"
                />
              </div>
              <span class="freq-count">{{ stats.numberFrequency[num] || 0 }}</span>
              <span class="freq-label" :class="{ 'freq-label--seven': num === 7 }">{{ num }}</span>
              <span class="freq-theo">{{ theoreticalPct[num] }}%</span>
            </div>
          </div>
        </div>
      </v-card-text>

      <v-divider class="my-3 border-opacity-25" />

      <!-- Pie con botón de Reinicio -->
      <v-card-actions class="d-flex justify-space-between pa-2">
        <v-btn
          variant="text"
          color="red-lighten-2"
          prepend-icon="mdi-trash-can-outline"
          size="small"
          @click="emit('reset-stats')"
        >
          Reiniciar Estadísticas
        </v-btn>

        <v-btn
          variant="elevated"
          color="amber-darken-2"
          rounded="lg"
          @click="modelValue = false"
        >
          Cerrar
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<style scoped>
.dados-stats-card {
  background: #0c1218 !important;
  border: 3px solid #ffd54f !important;
  border-radius: 0 !important;
  box-shadow: 6px 6px 0 #000;
  color: #fff;
}

.stats-icon-wrap {
  width: 40px;
  height: 40px;
  border-radius: 0;
  background: #000;
  border: 2px solid #ffd54f;
  box-shadow: 2px 2px 0 #000;
  display: flex;
  align-items: center;
  justify-content: center;
}

.stats-title {
  font-family: 'Press Start 2P', monospace;
  font-size: 0.72rem;
  font-weight: 700;
  color: #ffd54f;
  line-height: 1.3;
}

.stats-subtitle {
  font-family: 'Press Start 2P', monospace;
  font-size: 0.45rem;
  color: rgba(255, 255, 255, 0.6);
  margin-top: 3px;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px;
}

.stat-box {
  background: #111827;
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 0;
  padding: 8px 10px;
}

.stat-label {
  display: block;
  font-family: 'Press Start 2P', monospace;
  font-size: 0.45rem;
  font-weight: 700;
  letter-spacing: 0;
  color: rgba(255, 255, 255, 0.6);
}

.stat-val {
  font-family: 'Press Start 2P', monospace;
  font-size: 0.72rem;
  font-weight: 700;
  margin-top: 4px;
}

/* Gráfico de Frecuencias */
.frequency-section {
  background: #000;
  border: 2px solid #ffd54f;
  border-radius: 0;
  box-shadow: 2px 2px 0 #000;
  padding: 12px;
}

.frequency-title-bar {
  display: flex;
  flex-direction: column;
}

.freq-heading {
  font-family: 'Press Start 2P', monospace;
  font-size: 0.52rem;
  font-weight: 700;
  letter-spacing: 0;
  color: #ffd54f;
}

.freq-sub {
  font-family: 'Press Start 2P', monospace;
  font-size: 0.42rem;
  color: rgba(255, 255, 255, 0.6);
  margin-top: 2px;
}

.frequency-chart {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 6px;
  height: 160px;
  padding-top: 10px;
}

.freq-column {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  height: 100%;
}

.bar-track {
  flex: 1;
  width: 100%;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 0;
  display: flex;
  align-items: flex-end;
  overflow: hidden;
  position: relative;
}

.bar-fill {
  width: 100%;
  background: #ffd54f;
  border-radius: 0;
  transition: height 0.4s ease;
  min-height: 2px;
}

.bar-fill--peak {
  background: #dc2626;
}

.freq-count {
  font-family: 'Press Start 2P', monospace;
  font-size: 0.45rem;
  font-weight: 700;
  color: #ffd54f;
  margin-top: 4px;
}

.freq-label {
  font-family: 'Press Start 2P', monospace;
  font-size: 0.55rem;
  font-weight: 700;
  color: #ffffff;
  margin-top: 2px;
}

.freq-label--seven {
  color: #ef4444;
}

.freq-theo {
  font-family: 'Press Start 2P', monospace;
  font-size: 0.4rem;
  color: rgba(255, 255, 255, 0.45);
  margin-top: 2px;
}
</style>
