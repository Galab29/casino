<script setup lang="ts">
interface Props {
  canHit: boolean
  canStand: boolean
  canDoubleDown: boolean
  isRoundOver: boolean
}

defineProps<Props>()

const emit = defineEmits<{
  (e: 'hit'): void
  (e: 'stand'): void
  (e: 'double-down'): void
  (e: 'next-round'): void
}>()
</script>

<template>
  <v-card class="action-panel pa-4" color="transparent" flat>
    <div class="d-flex justify-center ga-3 flex-wrap">
      <!-- Game-play buttons -->
      <template v-if="!isRoundOver">
        <v-btn
          size="large"
          variant="elevated"
          color="green-darken-2"
          :disabled="!canHit"
          prepend-icon="mdi-cards-outline"
          rounded="lg"
          class="action-btn hit-btn"
          @click="emit('hit')"
        >
          Pedir
        </v-btn>

        <v-btn
          size="large"
          variant="elevated"
          color="orange-darken-3"
          :disabled="!canStand"
          prepend-icon="mdi-hand-back-left"
          rounded="lg"
          class="action-btn stand-btn"
          @click="emit('stand')"
        >
          Plantarse
        </v-btn>

        <v-btn
          size="large"
          variant="elevated"
          color="deep-purple-darken-1"
          :disabled="!canDoubleDown"
          prepend-icon="mdi-arrow-up-bold-circle"
          rounded="lg"
          class="action-btn double-btn"
          @click="emit('double-down')"
        >
          Doblar
        </v-btn>
      </template>

      <!-- Round-over button -->
      <v-btn
        v-else
        size="large"
        variant="elevated"
        color="amber-darken-2"
        prepend-icon="mdi-refresh"
        rounded="lg"
        class="action-btn next-round-btn"
        @click="emit('next-round')"
      >
        Siguiente Ronda
      </v-btn>
    </div>
  </v-card>
</template>

<style scoped>
.action-btn {
  font-weight: 700;
  letter-spacing: 1px;
  min-width: 130px;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.action-btn:hover:not(:disabled) {
  transform: translateY(-3px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
}

.hit-btn:not(:disabled) {
  animation: btn-pulse-green 2s ease-in-out infinite;
}

@keyframes btn-pulse-green {
  0%, 100% { box-shadow: 0 4px 12px rgba(46,125,50,0.3); }
  50% { box-shadow: 0 4px 24px rgba(46,125,50,0.6); }
}

.double-btn:not(:disabled) {
  animation: btn-pulse-purple 2.5s ease-in-out infinite;
}

@keyframes btn-pulse-purple {
  0%, 100% { box-shadow: 0 4px 12px rgba(94,53,177,0.3); }
  50% { box-shadow: 0 4px 24px rgba(94,53,177,0.6); }
}

.next-round-btn {
  animation: bounce-in 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
}

@keyframes bounce-in {
  0% { transform: scale(0.6); opacity: 0; }
  100% { transform: scale(1); opacity: 1; }
}
</style>
