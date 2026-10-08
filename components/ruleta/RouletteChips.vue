<script setup lang="ts">
import { CHIP_OPTIONS, CHIP_CONFIG } from '~/constants/ruleta'
import { useSoundEngine } from '~/composables/useSoundEngine'

interface Props {
  selectedChip: number
  totalBet: number
  chips: number
  isSpinning: boolean
  canSpin: boolean
  canUndo: boolean
  canRebet: boolean
}

const props = defineProps<Props>()
const emit = defineEmits<{
  (e: 'select-chip', chip: number): void
  (e: 'spin'): void
  (e: 'clear'): void
  (e: 'undo'): void
  (e: 'double'): void
  (e: 'rebet'): void
}>()

const sound = useSoundEngine()

function handleSelect(chip: number) {
  sound.playChipClick()
  emit('select-chip', chip)
}

function handleSpin() {
  if (!props.canSpin) return
  sound.playButtonClick()
  emit('spin')
}

function handleClear() {
  sound.playButtonClick()
  emit('clear')
}

function handleUndo() {
  sound.playButtonClick()
  emit('undo')
}

function handleDouble() {
  sound.playChipStack()
  emit('double')
}

function handleRebet() {
  sound.playChipStack()
  emit('rebet')
}
</script>

<template>
  <div class="roulette-controls-panel">
    <!-- Fila Superior: Selector de Fichas -->
    <div class="d-flex align-center justify-center flex-wrap ga-3 mb-4">
      <div
        v-for="chip in CHIP_OPTIONS"
        :key="chip"
        class="chip-selector-item"
        :class="{
          'chip-selector-item--active': selectedChip === chip,
          'chip-selector-item--disabled': chip > chips && !isSpinning,
        }"
        :style="{
          '--c-bg': CHIP_CONFIG[chip].color,
          '--c-border': CHIP_CONFIG[chip].border,
          '--c-text': CHIP_CONFIG[chip].textColor,
        }"
        @click="handleSelect(chip)"
      >
        <div class="chip-inner">
          <v-icon size="16" class="mr-1">mdi-poker-chip</v-icon>
          <span class="chip-val">{{ chip }}</span>
        </div>
      </div>
    </div>

    <!-- Fila Media: Botones de Acción de Apuestas + Total -->
    <div class="d-flex align-center justify-space-between flex-wrap ga-3 mb-4 controls-row">
      <!-- Apuesta Total -->
      <div class="total-bet-display">
        <span class="total-bet-label">APUESTA TOTAL</span>
        <div class="d-flex align-center">
          <v-icon color="amber" size="22" class="mr-1">mdi-poker-chip</v-icon>
          <span class="total-bet-value">{{ totalBet.toLocaleString() }}</span>
          <span class="total-bet-sub ml-1">fichas</span>
        </div>
      </div>

      <!-- Botones de Utilidad -->
      <div class="d-flex align-center ga-2 flex-wrap">
        <v-btn
          variant="outlined"
          color="grey-lighten-1"
          size="small"
          rounded="lg"
          prepend-icon="mdi-close-circle-outline"
          :disabled="isSpinning || totalBet === 0"
          @click="handleClear"
        >
          Limpiar
        </v-btn>

        <v-btn
          variant="outlined"
          color="blue-grey-lighten-2"
          size="small"
          rounded="lg"
          prepend-icon="mdi-undo"
          :disabled="isSpinning || !canUndo"
          @click="handleUndo"
        >
          Deshacer
        </v-btn>

        <v-btn
          variant="tonal"
          color="amber-lighten-1"
          size="small"
          rounded="lg"
          prepend-icon="mdi-multiplication"
          :disabled="isSpinning || totalBet === 0 || totalBet > chips"
          @click="handleDouble"
        >
          Doblar ×2
        </v-btn>

        <v-btn
          v-if="canRebet"
          variant="tonal"
          color="cyan-lighten-2"
          size="small"
          rounded="lg"
          prepend-icon="mdi-history"
          :disabled="isSpinning"
          @click="handleRebet"
        >
          Repetir
        </v-btn>
      </div>
    </div>

    <!-- Fila Inferior: Botón Principal de Giro -->
    <div class="text-center">
      <v-btn
        id="spin-roulette-btn"
        size="x-large"
        color="amber-darken-2"
        variant="elevated"
        rounded="xl"
        class="spin-btn px-10 elevation-10"
        :loading="isSpinning"
        :disabled="!canSpin"
        prepend-icon="mdi-circle-slice-6"
        @click="handleSpin"
      >
        <span class="spin-btn-text">
          {{ isSpinning ? '¡GIRANDO LA RULETA...!' : 'GIRAR RULETA' }}
        </span>
      </v-btn>
    </div>
  </div>
</template>

<style scoped>
.roulette-controls-panel {
  background: rgba(13, 20, 32, 0.7);
  border: 1px solid rgba(255, 213, 79, 0.2);
  border-radius: 16px;
  padding: 16px 20px;
  backdrop-filter: blur(10px);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
}

/* ═══ Fichas Selectoras ═══ */
.chip-selector-item {
  width: 58px;
  height: 58px;
  border-radius: 50%;
  background: radial-gradient(circle at 35% 30%, var(--c-bg), #0a0e14);
  border: 3px dashed var(--c-border);
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  user-select: none;
}

.chip-selector-item:hover:not(.chip-selector-item--disabled) {
  transform: translateY(-4px) scale(1.08);
  box-shadow: 0 8px 18px rgba(0, 0, 0, 0.7), 0 0 12px var(--c-bg);
}

.chip-selector-item--active {
  transform: translateY(-6px) scale(1.15) !important;
  border-color: #ffffff !important;
  box-shadow: 0 8px 25px rgba(255, 213, 79, 0.7), 0 0 16px var(--c-bg) !important;
  animation: chipActivePulse 1.8s ease-in-out infinite alternate;
}

@keyframes chipActivePulse {
  0% {
    box-shadow: 0 8px 25px rgba(255, 213, 79, 0.7), 0 0 14px var(--c-bg);
  }
  100% {
    box-shadow: 0 10px 30px rgba(255, 255, 255, 0.8), 0 0 22px var(--c-bg);
  }
}

.chip-selector-item--disabled {
  opacity: 0.35;
  cursor: not-allowed;
  filter: grayscale(0.8);
}

.chip-inner {
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--c-text);
  font-family: 'Cinzel', serif;
  font-size: 0.95rem;
  font-weight: 900;
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.8);
}

/* ═══ Apuesta Total ═══ */
.total-bet-display {
  display: flex;
  flex-direction: column;
  background: rgba(0, 0, 0, 0.4);
  border: 1px solid rgba(255, 213, 79, 0.3);
  border-radius: 12px;
  padding: 6px 18px;
}

.total-bet-label {
  font-size: 0.65rem;
  letter-spacing: 2px;
  color: rgba(255, 255, 255, 0.6);
  font-weight: 700;
}

.total-bet-value {
  font-family: 'Cinzel', serif;
  font-size: 1.5rem;
  font-weight: 900;
  color: #ffd54f;
  text-shadow: 0 0 10px rgba(255, 213, 79, 0.4);
}

.total-bet-sub {
  font-size: 0.8rem;
  color: rgba(255, 255, 255, 0.5);
}

/* ═══ Botón de Giro ═══ */
.spin-btn {
  font-family: 'Cinzel', serif;
  font-weight: 900;
  letter-spacing: 2px;
  background: linear-gradient(135deg, #ffb300 0%, #ff8f00 50%, #f57f17 100%) !important;
  color: #120c02 !important;
  min-height: 56px;
  transition: all 0.3s ease;
}

.spin-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 0 25px rgba(255, 179, 0, 0.7) !important;
}

.spin-btn-text {
  font-size: 1.15rem;
}
</style>
