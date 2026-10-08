<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useBlackjackStore } from '~/stores/blackjack'
import { useIdleStore } from '~/stores/idle'
import { formatNumber, formatChips } from '~/utils/formatNumber'

const props = defineProps<{
  buyMode: '1' | '10' | '100' | 'max'
}>()

const emit = defineEmits<{
  (e: 'update:buyMode', mode: '1' | '10' | '100' | 'max'): void
}>()

const nuxtApp = useNuxtApp()
const wallet = useBlackjackStore(nuxtApp?.$pinia)
const idleStore = useIdleStore()

const chips = computed(() => wallet.player.chips)
const cps = computed(() => idleStore.cps)

// Contador de tiempo restante de adrenalina
const adrenalineSecLeft = ref(0)
let timer: ReturnType<typeof setInterval> | null = null

function updateAdrenalineTimer() {
  if (idleStore.adrenaline.active && idleStore.adrenaline.expiresAt > Date.now()) {
    adrenalineSecLeft.value = Math.ceil((idleStore.adrenaline.expiresAt - Date.now()) / 1000)
  } else {
    adrenalineSecLeft.value = 0
  }
}

onMounted(() => {
  updateAdrenalineTimer()
  timer = setInterval(updateAdrenalineTimer, 500)
})

onUnmounted(() => {
  if (timer) clearInterval(timer)
})

const buyOptions: Array<{ label: string; value: '1' | '10' | '100' | 'max' }> = [
  { label: 'x1', value: '1' },
  { label: 'x10', value: '10' },
  { label: 'x100', value: '100' },
  { label: 'Máx', value: 'max' },
]
</script>

<template>
  <div class="production-bar-wrap">
    <!-- Fila de saldos y producción -->
    <div class="production-header d-flex justify-space-between align-center flex-wrap ga-3">
      <!-- Fichas actuales -->
      <div class="chips-display">
        <div class="chips-icon-box">
          <v-icon color="#ffd54f" size="28">mdi-poker-chip</v-icon>
        </div>
        <div class="chips-info">
          <span class="chips-title">FICHAS TOTALES</span>
          <span class="chips-num">{{ formatChips(chips) }}</span>
        </div>
      </div>

      <!-- Producción por segundo (CPS) -->
      <div class="cps-display">
        <div class="cps-icon-box">
          <v-icon color="#69f0ae" size="24">mdi-lightning-bolt</v-icon>
        </div>
        <div class="cps-info">
          <span class="cps-title">PRODUCCIÓN PASIVA</span>
          <span class="cps-num">+{{ formatNumber(cps) }} <small class="cps-unit">/s</small></span>
        </div>
      </div>

      <!-- Selector de cantidad de compra x1 / x10 / x100 / Máx -->
      <div class="buy-mode-selector">
        <v-btn-toggle
          :model-value="buyMode"
          density="compact"
          mandatory
          rounded="pill"
          color="amber"
          variant="outlined"
          class="mode-toggle"
          @update:model-value="emit('update:buyMode', $event)"
        >
          <v-btn
            v-for="opt in buyOptions"
            :key="opt.value"
            :value="opt.value"
            size="small"
            class="mode-btn"
          >
            {{ opt.label }}
          </v-btn>
        </v-btn-toggle>
      </div>
    </div>

    <!-- Barra de Adrenalina Activa -->
    <transition name="fade">
      <div v-if="adrenalineSecLeft > 0" class="adrenaline-bar mt-3">
        <div class="adrenaline-content d-flex justify-space-between align-center px-4 py-2">
          <div class="d-flex align-center ga-2">
            <v-icon color="#ffd54f" size="20" class="pulse-icon">mdi-fire</v-icon>
            <span class="adrenaline-text">
              ADRENALINA ACTIVA: <strong>+{{ Math.round(idleStore.adrenaline.multiplier * 100) }}%</strong> a toda la producción
            </span>
          </div>
          <div class="adrenaline-timer-badge">
            <v-icon size="14" color="amber" class="mr-1">mdi-timer-outline</v-icon>
            <span>{{ adrenalineSecLeft }} s</span>
          </div>
        </div>
      </div>
    </transition>
  </div>
</template>

<style scoped>
.production-bar-wrap {
  background: rgba(18, 18, 28, 0.85);
  backdrop-filter: blur(16px);
  border: 1px solid rgba(255, 213, 79, 0.2);
  border-radius: 20px;
  padding: 16px 20px;
  margin-bottom: 20px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
}

.chips-display, .cps-display {
  display: flex;
  align-items: center;
  gap: 12px;
}

.chips-icon-box {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  background: rgba(255, 213, 79, 0.12);
  border: 1px solid rgba(255, 213, 79, 0.3);
  display: flex;
  align-items: center;
  justify-content: center;
}

.chips-info, .cps-info {
  display: flex;
  flex-direction: column;
}

.chips-title, .cps-title {
  font-size: 0.7rem;
  letter-spacing: 1.5px;
  color: rgba(255, 255, 255, 0.5);
  font-weight: 600;
}

.chips-num {
  font-family: 'Cinzel', serif;
  font-size: 1.6rem;
  font-weight: 900;
  color: #ffd54f;
  text-shadow: 0 0 12px rgba(255, 213, 79, 0.4);
  line-height: 1.1;
}

.cps-icon-box {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  background: rgba(105, 240, 174, 0.12);
  border: 1px solid rgba(105, 240, 174, 0.3);
  display: flex;
  align-items: center;
  justify-content: center;
}

.cps-num {
  font-family: 'Outfit', sans-serif;
  font-size: 1.4rem;
  font-weight: 800;
  color: #69f0ae;
  line-height: 1.1;
}

.cps-unit {
  font-size: 0.9rem;
  color: rgba(255, 255, 255, 0.6);
  font-weight: 500;
}

.buy-mode-selector {
  display: flex;
  align-items: center;
}

.mode-toggle {
  background: rgba(0, 0, 0, 0.4);
  border: 1px solid rgba(255, 213, 79, 0.3) !important;
}

.mode-btn {
  font-weight: 700;
  letter-spacing: 0.5px;
  font-size: 0.8rem;
}

/* Adrenalina Bar */
.adrenaline-bar {
  background: linear-gradient(90deg, rgba(230, 81, 0, 0.3) 0%, rgba(255, 179, 0, 0.2) 50%, rgba(230, 81, 0, 0.3) 100%);
  border: 1px solid rgba(255, 179, 0, 0.5);
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 0 15px rgba(255, 179, 0, 0.2);
}

.pulse-icon {
  animation: pulse-fire 1.5s infinite;
}

@keyframes pulse-fire {
  0%, 100% { transform: scale(1); filter: drop-shadow(0 0 2px #ff9800); }
  50% { transform: scale(1.2); filter: drop-shadow(0 0 8px #ffeb3b); }
}

.adrenaline-text {
  font-size: 0.85rem;
  color: #fff;
  letter-spacing: 0.5px;
}

.adrenaline-text strong {
  color: #ffd54f;
}

.adrenaline-timer-badge {
  display: inline-flex;
  align-items: center;
  background: rgba(0, 0, 0, 0.5);
  border-radius: 20px;
  padding: 4px 10px;
  font-weight: 800;
  font-size: 0.85rem;
  color: #ffd54f;
}

.fade-enter-active, .fade-leave-active {
  transition: opacity 0.3s ease;
}
.fade-enter-from, .fade-leave-to {
  opacity: 0;
}

@media (max-width: 600px) {
  .production-header {
    justify-content: center;
    text-align: center;
  }
  .chips-display, .cps-display {
    width: 100%;
    justify-content: center;
  }
  .buy-mode-selector {
    width: 100%;
    justify-content: center;
  }
  .chips-num {
    font-size: 1.4rem;
  }
}
</style>
