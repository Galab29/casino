<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useIdleStore } from '~/stores/idle'

const idleStore = useIdleStore()
const secondsLeft = ref(0)
let timer: ReturnType<typeof setInterval> | null = null

function updateTimer() {
  if (idleStore.adrenaline.active && idleStore.adrenaline.expiresAt > Date.now()) {
    secondsLeft.value = Math.ceil((idleStore.adrenaline.expiresAt - Date.now()) / 1000)
  } else {
    secondsLeft.value = 0
  }
}

onMounted(() => {
  updateTimer()
  timer = setInterval(updateTimer, 500)
})

onUnmounted(() => {
  if (timer) clearInterval(timer)
})

const isActive = computed(() => secondsLeft.value > 0)
const bonusPercent = computed(() => Math.round(idleStore.adrenaline.multiplier * 100))
</script>

<template>
  <transition name="adrenaline-fade">
    <div v-if="isActive" class="adrenaline-indicator">
      <v-icon color="#ffd54f" size="18" class="pulse-icon mr-1">mdi-lightning-bolt</v-icon>
      <span class="adrenaline-label">ADRENALINA</span>
      <span class="adrenaline-bonus">+{{ bonusPercent }}%</span>
      <span class="adrenaline-time">({{ secondsLeft }}s)</span>
    </div>
  </transition>
</template>

<style scoped>
.adrenaline-indicator {
  display: inline-flex;
  align-items: center;
  background: rgba(255, 179, 0, 0.15);
  border: 1px solid rgba(255, 179, 0, 0.5);
  border-radius: 20px;
  padding: 4px 12px;
  font-size: 0.8rem;
  font-weight: 700;
  box-shadow: 0 0 12px rgba(255, 179, 0, 0.3);
  animation: glow-pulse 2s infinite ease-in-out;
  user-select: none;
}

.adrenaline-label {
  color: #ffd54f;
  margin-right: 4px;
  letter-spacing: 0.5px;
}

.adrenaline-bonus {
  color: #69f0ae;
  margin-right: 4px;
}

.adrenaline-time {
  color: rgba(255, 255, 255, 0.7);
  font-size: 0.75rem;
}

.pulse-icon {
  animation: bolt-shake 1.2s infinite ease-in-out;
}

@keyframes bolt-shake {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.25); filter: drop-shadow(0 0 4px #ffd54f); }
}

@keyframes glow-pulse {
  0%, 100% { border-color: rgba(255, 179, 0, 0.4); box-shadow: 0 0 8px rgba(255, 179, 0, 0.2); }
  50% { border-color: rgba(255, 179, 0, 0.8); box-shadow: 0 0 16px rgba(255, 179, 0, 0.5); }
}

.adrenaline-fade-enter-active,
.adrenaline-fade-leave-active {
  transition: opacity 0.3s, transform 0.3s;
}

.adrenaline-fade-enter-from,
.adrenaline-fade-leave-to {
  opacity: 0;
  transform: scale(0.9);
}
</style>
