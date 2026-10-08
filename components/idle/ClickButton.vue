<script setup lang="ts">
import { ref } from 'vue'
import { useIdleStore } from '~/stores/idle'
import { useSoundEngine } from '~/composables/useSoundEngine'
import { formatNumber } from '~/utils/formatNumber'

const idleStore = useIdleStore()
const sound = useSoundEngine()

interface FloatingText {
  id: number
  x: number
  y: number
  text: string
}

const floatingTexts = ref<FloatingText[]>([])
let nextId = 0
const isPressed = ref(false)

function handleClick(event: MouseEvent) {
  const gained = idleStore.click()
  sound.playChipClick()

  // Efecto de presión
  isPressed.value = true
  setTimeout(() => {
    isPressed.value = false
  }, 100)

  // Coordenadas para el texto flotante
  const rect = (event.currentTarget as HTMLElement)?.getBoundingClientRect()
  const x = event.clientX - (rect?.left || 0) + (Math.random() * 20 - 10)
  const y = event.clientY - (rect?.top || 0)

  const id = nextId++
  floatingTexts.value.push({
    id,
    x,
    y,
    text: `+${formatNumber(gained)}`,
  })

  setTimeout(() => {
    floatingTexts.value = floatingTexts.value.filter((t) => t.id !== id)
  }, 900)
}
</script>

<template>
  <div class="click-button-container">
    <button
      class="clicker-btn"
      :class="{ 'clicker-btn--pressed': isPressed }"
      @click="handleClick"
      type="button"
      id="croupier-tip-button"
    >
      <!-- Halo pulsante exterior -->
      <div class="btn-halo" />

      <!-- Fondo y bisel dorado -->
      <div class="btn-inner">
        <div class="btn-icon-wrap">
          <v-icon size="40" color="#ffd54f" class="tip-icon">mdi-hand-coin</v-icon>
        </div>
        <div class="btn-text-wrap">
          <span class="btn-title">PROPINA DEL CRUPIER</span>
          <span class="btn-sub">+{{ formatNumber(idleStore.clickValue) }} fichas por clic</span>
        </div>
      </div>

      <!-- Textos flotantes dinámicos -->
      <span
        v-for="item in floatingTexts"
        :key="item.id"
        class="floating-chip-text"
        :style="{ left: `${item.x}px`, top: `${item.y}px` }"
      >
        {{ item.text }}
      </span>
    </button>
  </div>
</template>

<style scoped>
.click-button-container {
  display: flex;
  justify-content: center;
  align-items: center;
  position: relative;
  margin: 12px 0 20px 0;
}

.clicker-btn {
  position: relative;
  background: none;
  border: none;
  outline: none;
  cursor: pointer;
  padding: 0;
  width: 100%;
  max-width: 480px;
  user-select: none;
  -webkit-tap-highlight-color: transparent;
  transition: transform 0.1s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

.clicker-btn:hover {
  transform: translateY(-2px);
}

.clicker-btn--pressed {
  transform: scale(0.96) translateY(2px) !important;
}

.btn-halo {
  position: absolute;
  inset: -4px;
  border-radius: 20px;
  background: linear-gradient(135deg, rgba(255, 213, 79, 0.4), rgba(255, 143, 0, 0.1), rgba(255, 213, 79, 0.3));
  filter: blur(8px);
  opacity: 0.7;
  transition: opacity 0.3s;
}

.clicker-btn:hover .btn-halo {
  opacity: 1;
  filter: blur(12px);
}

.btn-inner {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
  padding: 14px 28px;
  border-radius: 18px;
  background: linear-gradient(145deg, #2a2012 0%, #17130a 60%, #0d0a05 100%);
  border: 1.5px solid rgba(255, 213, 79, 0.4);
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.6), inset 0 1px 1px rgba(255, 255, 255, 0.2);
  overflow: hidden;
}

.btn-inner::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 50%;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.08) 0%, transparent 100%);
  border-radius: 16px 16px 0 0;
  pointer-events: none;
}

.btn-icon-wrap {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(255, 213, 79, 0.2) 0%, rgba(0, 0, 0, 0.4) 100%);
  border: 1px solid rgba(255, 213, 79, 0.35);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 12px rgba(255, 193, 7, 0.2);
}

.tip-icon {
  filter: drop-shadow(0 2px 6px rgba(255, 213, 79, 0.6));
}

.btn-text-wrap {
  display: flex;
  flex-direction: column;
  text-align: left;
}

.btn-title {
  font-family: 'Cinzel', serif;
  font-weight: 900;
  font-size: 1.15rem;
  letter-spacing: 2px;
  color: #ffd54f;
  text-shadow: 0 2px 8px rgba(0, 0, 0, 0.8), 0 0 10px rgba(255, 213, 79, 0.4);
}

.btn-sub {
  font-size: 0.85rem;
  color: rgba(255, 255, 255, 0.7);
  letter-spacing: 0.5px;
  font-weight: 500;
}

/* Floating particle text */
.floating-chip-text {
  position: absolute;
  pointer-events: none;
  font-family: 'Cinzel', serif;
  font-weight: 900;
  font-size: 1.1rem;
  color: #ffd54f;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.9), 0 0 8px rgba(255, 193, 7, 0.8);
  animation: float-fade 0.9s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards;
  z-index: 99;
}

@keyframes float-fade {
  0% {
    opacity: 1;
    transform: translate(-50%, -10px) scale(0.9);
  }
  50% {
    opacity: 0.9;
    transform: translate(-50%, -35px) scale(1.15);
  }
  100% {
    opacity: 0;
    transform: translate(-50%, -60px) scale(0.95);
  }
}
</style>
