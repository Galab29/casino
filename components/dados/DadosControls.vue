<script setup lang="ts">
import { CHIP_OPTIONS, CHIP_CONFIG } from '~/constants/dados'
import { useSoundEngine } from '~/composables/useSoundEngine'

interface Props {
  selectedChip: number
  totalBet: number
  chips: number
  isRolling: boolean
  canRoll: boolean
  canUndo: boolean
  canRebet: boolean
}

const props = defineProps<Props>()

const emit = defineEmits<{
  (e: 'select-chip', chip: number): void
  (e: 'roll'): void
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

function handleRoll() {
  if (!props.canRoll || props.isRolling) return
  sound.playButtonClick()
  emit('roll')
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
  <div class="dados-controls-panel">
    <!-- Selector de Fichas -->
    <div class="d-flex align-center justify-center flex-wrap ga-3 mb-4">
      <div
        v-for="chip in CHIP_OPTIONS"
        :key="chip"
        class="chip-selector-item"
        :class="{
          'chip-selector-item--active': selectedChip === chip,
          'chip-selector-item--disabled': chip > chips && !isRolling,
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
          <span class="chip-val">{{ CHIP_CONFIG[chip].label }}</span>
        </div>
      </div>
    </div>

    <!-- Barra de Acciones y Apuesta Total -->
    <div class="d-flex align-center justify-space-between flex-wrap ga-3 mb-3 controls-row">
      <!-- Apuesta Total -->
      <div class="total-bet-display">
        <span class="total-bet-label">APUESTA TOTAL</span>
        <div class="d-flex align-center">
          <v-icon color="amber" size="22" class="mr-1">mdi-poker-chip</v-icon>
          <span class="total-bet-value">{{ totalBet.toLocaleString() }}</span>
          <span class="total-bet-sub ml-1">fichas</span>
        </div>
      </div>

      <!-- Botones de Utilidad: Deshacer, Borrar, Doblar, Repetir -->
      <div class="d-flex align-center ga-2 flex-wrap">
        <v-btn
          variant="outlined"
          color="blue-grey-lighten-2"
          size="small"
          rounded="lg"
          prepend-icon="mdi-undo"
          :disabled="!canUndo || isRolling"
          class="action-sub-btn"
          @click="handleUndo"
        >
          Deshacer
        </v-btn>

        <v-btn
          variant="outlined"
          color="blue-grey-lighten-2"
          size="small"
          rounded="lg"
          prepend-icon="mdi-close-circle-outline"
          :disabled="totalBet === 0 || isRolling"
          class="action-sub-btn"
          @click="handleClear"
        >
          Limpiar
        </v-btn>

        <v-btn
          variant="outlined"
          color="amber-lighten-1"
          size="small"
          rounded="lg"
          prepend-icon="mdi-numeric-2-box-multiple"
          :disabled="totalBet === 0 || chips < totalBet || isRolling"
          class="action-sub-btn"
          @click="handleDouble"
        >
          Doblar (2x)
        </v-btn>

        <v-btn
          variant="outlined"
          color="teal-lighten-2"
          size="small"
          rounded="lg"
          prepend-icon="mdi-replay"
          :disabled="!canRebet || isRolling"
          class="action-sub-btn"
          @click="handleRebet"
        >
          Repetir
        </v-btn>
      </div>

      <!-- Botón Principal: LANZAR DADOS -->
      <v-btn
        variant="elevated"
        color="amber-darken-2"
        size="large"
        rounded="xl"
        prepend-icon="mdi-dice-multiple"
        :loading="isRolling"
        :disabled="!canRoll || isRolling"
        class="roll-main-btn"
        @click="handleRoll"
      >
        <span class="roll-btn-text">LANZAR DADOS</span>
      </v-btn>
    </div>
  </div>
</template>

<style scoped>
.dados-controls-panel {
  background: rgba(10, 15, 20, 0.75);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 213, 79, 0.2);
  border-radius: 20px;
  padding: 16px 20px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.6);
}

/* Fichas */
.chip-selector-item {
  width: 52px;
  height: 52px;
  border-radius: 50%;
  background: var(--c-bg);
  border: 3px dashed var(--c-border);
  box-shadow:
    0 4px 10px rgba(0, 0, 0, 0.6),
    inset 0 2px 4px rgba(255, 255, 255, 0.35);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
  user-select: none;
}

.chip-selector-item:hover:not(.chip-selector-item--disabled) {
  transform: translateY(-4px) scale(1.08);
  box-shadow:
    0 8px 16px rgba(0, 0, 0, 0.8),
    0 0 16px var(--c-border);
}

.chip-selector-item--active {
  transform: translateY(-6px) scale(1.14);
  border-style: solid;
  border-width: 3.5px;
  box-shadow:
    0 10px 20px rgba(0, 0, 0, 0.8),
    0 0 22px rgba(255, 213, 79, 0.85);
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
  font-weight: 900;
  font-size: 0.82rem;
}

/* Display Apuesta Total */
.total-bet-display {
  background: rgba(0, 0, 0, 0.45);
  border: 1px solid rgba(255, 213, 79, 0.35);
  border-radius: 12px;
  padding: 6px 14px;
}

.total-bet-label {
  font-size: 0.65rem;
  font-weight: 800;
  letter-spacing: 1.5px;
  color: rgba(255, 255, 255, 0.6);
  display: block;
}

.total-bet-value {
  font-family: 'Cinzel', serif;
  font-size: 1.25rem;
  font-weight: 900;
  color: #ffd54f;
}

.total-bet-sub {
  font-size: 0.72rem;
  color: rgba(255, 255, 255, 0.6);
}

/* Botones Auxiliares */
.action-sub-btn {
  text-transform: none;
  font-size: 0.78rem;
  font-weight: 700;
  letter-spacing: 0.5px;
  background: rgba(255, 255, 255, 0.03);
}

/* Botón de Tirada */
.roll-main-btn {
  min-width: 190px;
  height: 48px;
  font-family: 'Cinzel', serif;
  font-weight: 900;
  letter-spacing: 1px;
  box-shadow: 0 4px 18px rgba(255, 143, 0, 0.45);
  transition: all 0.3s ease;
}

.roll-main-btn:not(:disabled):hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 24px rgba(255, 143, 0, 0.7);
}

.roll-btn-text {
  font-size: 0.95rem;
  letter-spacing: 1.5px;
}
</style>
