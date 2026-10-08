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
        <v-icon color="amber" size="28" class="mr-2 chip-spin">mdi-poker-chip</v-icon>
        <span class="bet-value">{{ modelValue }}</span>
      </div>
      <div class="bet-label">APUESTA</div>
    </div>

    <!-- Chip buttons -->
    <div class="d-flex justify-center flex-wrap ga-2 mb-4">
      <v-btn
        v-for="chip in chipOptions"
        :key="chip"
        :disabled="disabled || chip > maxBet"
        variant="elevated"
        rounded="pill"
        size="small"
        class="chip-btn"
        :color="chipColors[chip]"
        @click="addChips(chip)"
      >
        <v-icon start size="16">mdi-poker-chip</v-icon>
        {{ chip }}
      </v-btn>
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
  background: rgba(0,0,0,0.4);
  border: 2px solid rgba(255,213,79,0.4);
  border-radius: 16px;
  padding: 8px 24px;
  box-shadow: 0 0 20px rgba(255,213,79,0.1);
}

.bet-value {
  font-family: 'Cinzel', serif;
  font-size: 2rem;
  font-weight: 900;
  color: #ffd54f;
  text-shadow: 0 2px 10px rgba(255,213,79,0.4);
  min-width: 60px;
  text-align: center;
}

.bet-label {
  font-size: 10px;
  letter-spacing: 4px;
  color: rgba(255,255,255,0.4);
  margin-top: 4px;
}

.chip-spin {
  animation: spin-slow 4s linear infinite;
}

@keyframes spin-slow {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.chip-btn {
  font-weight: 700;
  letter-spacing: 0.5px;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.chip-btn:hover:not(:disabled) {
  transform: scale(1.15) translateY(-2px);
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.4);
}

.chip-btn:active:not(:disabled) {
  transform: scale(0.95);
}

.all-in-btn {
  font-weight: 700;
  letter-spacing: 1px;
}

.all-in-btn:not(:disabled):hover {
  box-shadow: 0 0 20px rgba(244,67,54,0.4);
}

.place-bet-btn {
  font-weight: 700;
  letter-spacing: 1px;
}
</style>
