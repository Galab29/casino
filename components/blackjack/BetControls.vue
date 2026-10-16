<script setup lang="ts">
interface Props {
  maxBet: number
  disabled: boolean
}

const props = defineProps<Props>()

const modelValue = defineModel<number>({ default: 0 })

const emit = defineEmits<{
  (e: 'place-bet'): void
  (e: 'clear-bet'): void
  (e: 'chip-click'): void
}>()

const chipOptions = [10, 25, 50, 100, 250, 500]

const chipColors: Record<number, string> = {
  10: 'teal-darken-1',
  25: 'green-darken-2',
  50: 'blue-darken-2',
  100: 'deep-purple-darken-1',
  250: 'red-darken-3',
  500: 'amber-darken-3',
}

function addChips(amount: number) {
  const next = modelValue.value + amount
  if (next <= props.maxBet) {
    modelValue.value = next
  } else {
    modelValue.value = props.maxBet
  }
  emit('chip-click')
}

function clearBet() {
  modelValue.value = 0
  emit('clear-bet')
}

/** Quick all-in button */
function allIn() {
  modelValue.value = props.maxBet
  emit('chip-click')
}
</script>

<template>
  <v-card class="bet-controls pa-4" color="transparent" flat>
    <!-- Current bet display -->
    <div class="text-center mb-3">
      <div class="bet-amount-display">
        <PixelChip :value="modelValue || 25" size="xs" class="mr-2" />
        <span class="bet-value">{{ modelValue }}</span>
      </div>
      <div class="bet-label">APUESTA</div>
    </div>

    <!-- Chip buttons: 8-Bit Pixel Chips from /fichas/ -->
    <div class="d-flex justify-center flex-wrap ga-3 mb-4 align-center">
      <button
        v-for="chip in chipOptions"
        :key="chip"
        type="button"
        class="chip-pixel-btn"
        :disabled="disabled || chip > maxBet"
        :title="`Apostar ${chip} fichas`"
        @click="addChips(chip)"
      >
        <PixelChip
          :value="chip"
          size="md"
          :disabled="disabled || chip > maxBet"
        />
      </button>
    </div>

    <!-- Action buttons -->
    <div class="d-flex justify-center ga-3">
      <v-btn
        variant="outlined"
        color="grey-lighten-1"
        :disabled="disabled || modelValue === 0"
        prepend-icon="mdi-close-circle-outline"
        rounded="lg"
        @click="clearBet"
      >
        Limpiar
      </v-btn>

      <v-btn
        variant="tonal"
        color="red-lighten-1"
        :disabled="disabled || modelValue >= maxBet"
        prepend-icon="mdi-fire"
        rounded="lg"
        class="all-in-btn"
        @click="allIn"
      >
        All In
      </v-btn>

      <v-btn
        variant="elevated"
        color="amber-darken-2"
        :disabled="disabled || modelValue === 0"
        prepend-icon="mdi-check-bold"
        rounded="lg"
        class="place-bet-btn"
        @click="emit('place-bet')"
      >
        Apostar
      </v-btn>
    </div>
  </v-card>
</template>

<style scoped>
.bet-controls {
  backdrop-filter: blur(6px);
}

.bet-amount-display {
  display: inline-flex;
  align-items: center;
  background: #000;
  border: 2px solid #ffd54f;
  border-radius: 0;
  padding: 6px 20px;
  box-shadow: 3px 3px 0 #000;
}

.bet-value {
  font-family: 'Press Start 2P', monospace;
  font-size: 1.25rem;
  font-weight: 700;
  color: #ffd54f;
  text-shadow: 2px 2px 0 #000;
  min-width: 60px;
  text-align: center;
}

.bet-label {
  font-family: 'Press Start 2P', monospace;
  font-size: 0.5rem;
  letter-spacing: 0;
  color: rgba(255, 255, 255, 0.6);
  margin-top: 6px;
}

.chip-spin {
  animation: spin-slow 4s linear infinite;
}

@keyframes spin-slow {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.chip-pixel-btn {
  background: none;
  border: none;
  padding: 0;
  cursor: pointer;
  outline: none;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
}

.chip-pixel-btn:disabled {
  cursor: not-allowed;
}

.all-in-btn {
  font-family: 'Press Start 2P', monospace !important;
  font-size: 0.58rem !important;
  border-radius: 0 !important;
}

.place-bet-btn {
  font-family: 'Press Start 2P', monospace !important;
  font-size: 0.62rem !important;
  font-weight: 700;
  border-radius: 0 !important;
  border: 2px solid #000 !important;
  box-shadow: 3px 3px 0 #000 !important;
}
</style>
