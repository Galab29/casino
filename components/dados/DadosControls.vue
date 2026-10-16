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
    <!-- Selector de Fichas 8-Bit -->
    <div class="d-flex align-center justify-center flex-wrap ga-3 mb-4">
      <div
        v-for="chip in CHIP_OPTIONS"
        :key="chip"
        class="chip-selector-item"
        :class="{
          'chip-selector-item--disabled': chip > chips && !isRolling,
        }"
        :title="`Ficha de ${chip}`"
        @click="handleSelect(chip)"
      >
        <PixelChip
          :value="chip"
          size="md"
          :active="selectedChip === chip"
          :disabled="chip > chips && !isRolling"
        />
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
  font-weight: 700;
  font-size: 0.52rem;
  letter-spacing: -0.5px;
}

/* Display Apuesta Total */
.total-bet-display {
  background: #14141d;
  border: 2px solid #000;
  box-shadow: 0 3px 0 #000;
  border-radius: 4px;
  padding: 6px 14px;
}

.total-bet-label {
  font-family: 'Press Start 2P', monospace !important;
  font-size: 0.5rem;
  font-weight: 700;
  letter-spacing: 0px;
  color: rgba(255, 255, 255, 0.6);
  display: block;
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
  color: rgba(255, 255, 255, 0.6);
}

/* Botones Auxiliares */
.action-sub-btn {
  text-transform: uppercase;
  font-family: 'Press Start 2P', monospace !important;
  font-size: 0.58rem;
  letter-spacing: -0.5px;
  background: rgba(255, 255, 255, 0.03);
}

/* Botón de Tirada */
.roll-main-btn {
  min-width: 190px;
  height: 48px;
  font-family: 'Press Start 2P', monospace !important;
  font-weight: 700;
  letter-spacing: -0.5px;
  box-shadow: 0 4px 0 #000 !important;
  border: 2px solid #000 !important;
  transition: all 0.1s ease;
}

.roll-main-btn:not(:disabled):hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 0 #000 !important;
}

.roll-btn-text {
  font-size: 0.72rem;
  letter-spacing: -0.5px;
}
</style>
