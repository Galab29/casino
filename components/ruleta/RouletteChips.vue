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
    <!-- Fila Superior: Selector de Fichas 8-Bit -->
    <div class="d-flex align-center justify-center flex-wrap ga-3 mb-4">
      <div
        v-for="chip in CHIP_OPTIONS"
        :key="chip"
        class="chip-selector-item"
        :class="{
          'chip-selector-item--disabled': chip > chips && !isSpinning,
        }"
        :title="`Ficha de ${chip}`"
        @click="handleSelect(chip)"
      >
        <PixelChip
          :value="chip"
          size="md"
          :active="selectedChip === chip"
          :disabled="chip > chips && !isSpinning"
        />
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

/* ═══ Fichas Selectoras 8-Bit ═══ */
.chip-selector-item {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  user-select: none;
  background: none;
  border: none;
  padding: 0;
  transition: transform 0.15s ease;
}

.chip-selector-item--disabled {
  opacity: 0.35;
  cursor: not-allowed;
  pointer-events: none;
}

.chip-inner {
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--c-text);
  font-family: 'Press Start 2P', monospace !important;
  font-size: 0.55rem;
  font-weight: 700;
  letter-spacing: -0.5px;
  text-shadow: 1px 1px 0 #000;
}

/* ═══ Apuesta Total ═══ */
.total-bet-display {
  display: flex;
  flex-direction: column;
  background: #14141d;
  border: 2px solid #000;
  box-shadow: 0 3px 0 #000;
  border-radius: 4px;
  padding: 6px 14px;
}

.total-bet-label {
  font-family: 'Press Start 2P', monospace !important;
  font-size: 0.5rem;
  letter-spacing: 0px;
  color: rgba(255, 255, 255, 0.6);
  font-weight: 700;
}

.total-bet-value {
  font-family: 'Press Start 2P', monospace !important;
  font-size: 0.85rem;
  font-weight: 700;
  color: #ffd54f;
  text-shadow: 1px 1px 0 #000;
}

.total-bet-sub {
  font-size: 0.68rem;
  color: rgba(255, 255, 255, 0.5);
}

/* ═══ Botón de Giro ═══ */
.spin-btn {
  font-family: 'Press Start 2P', monospace !important;
  font-weight: 700;
  letter-spacing: -0.5px;
  background: var(--pixel-gold) !important;
  color: #000 !important;
  min-height: 50px;
  border: 2px solid #000 !important;
  box-shadow: 0 4px 0 #000 !important;
  border-radius: 4px !important;
  transition: all 0.1s ease;
}

.spin-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 0 #000 !important;
}

.spin-btn-text {
  font-size: 0.75rem;
}
</style>
