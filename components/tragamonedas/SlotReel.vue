<script setup lang="ts">
import { ref, computed, watch, nextTick, onBeforeUnmount } from 'vue'
import type { SlotSymbol } from '~/types/slots'

interface Props {
  symbols: SlotSymbol[]   // Símbolos disponibles en la máquina (para relleno aleatorio)
  result: SlotSymbol      // Símbolo que debe quedar en la línea de pago
  spinId: number          // Cada vez que cambia, el rodillo gira
  duration: number        // Duración del giro en ms
  accent?: string         // Color de acento de la máquina
  highlight?: boolean     // Resalta el símbolo central (tirada ganadora)
}

const props = withDefaults(defineProps<Props>(), {
  accent: '#ffd54f',
  highlight: false,
})

const emit = defineEmits<{
  (e: 'stop'): void
}>()

const VISIBLE = 3   // filas visibles: arriba, centro (línea de pago), abajo
const FILLERS = 18  // símbolos de relleno que pasan durante el giro

function randomSymbol(): SlotSymbol {
  return props.symbols[Math.floor(Math.random() * props.symbols.length)]
}

// La tira (strip) es una columna de símbolos que se desplaza verticalmente.
const strip = ref<SlotSymbol[]>([randomSymbol(), props.result, randomSymbol()])
const offsetPercent = ref(0)
const withTransition = ref(false)
const spinning = ref(false)
const landed = ref(false)
const stripEl = ref<HTMLElement | null>(null)
let fallbackTimer: ReturnType<typeof setTimeout> | null = null

const stripStyle = computed(() => ({
  transform: `translateY(${offsetPercent.value}%)`,
  transition: withTransition.value
    ? `transform ${props.duration}ms cubic-bezier(0.12, 0.72, 0.18, 1)`
    : 'none',
}))

/**
 * Animación del giro:
 * 1. Se arma una tira nueva: [resultado final] + [relleno] + [símbolos visibles actuales].
 * 2. Se posiciona (sin transición) mostrando los símbolos actuales (al final de la tira).
 * 3. Se activa la transición y se lleva a translateY(0) → los símbolos "caen" hasta el resultado.
 */
async function startSpin() {
  const current = strip.value.slice(0, VISIBLE)
  const fillers = Array.from({ length: FILLERS }, randomSymbol)
  const final = [randomSymbol(), props.result, randomSymbol()]
  const next = [...final, ...fillers, ...current]

  withTransition.value = false
  strip.value = next
  offsetPercent.value = -((next.length - VISIBLE) / next.length) * 100
  spinning.value = true
  landed.value = false

  await nextTick()
  void stripEl.value?.offsetHeight // fuerza reflow para que el navegador "vea" la posición inicial

  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      withTransition.value = true
      offsetPercent.value = 0
    })
  })

  // Respaldo por si 'transitionend' no se dispara (pestaña en segundo plano, etc.)
  if (fallbackTimer) clearTimeout(fallbackTimer)
  fallbackTimer = setTimeout(finish, props.duration + 400)
}

function finish() {
  if (!spinning.value) return
  if (fallbackTimer) {
    clearTimeout(fallbackTimer)
    fallbackTimer = null
  }
  spinning.value = false
  withTransition.value = false
  strip.value = strip.value.slice(0, VISIBLE) // deja sólo los 3 visibles
  offsetPercent.value = 0
  landed.value = true
  emit('stop')
}

function onTransitionEnd(e: TransitionEvent) {
  if (e.target !== stripEl.value || e.propertyName !== 'transform') return
  finish()
}

watch(
  () => props.spinId,
  (next, prev) => {
    if (next !== prev) startSpin()
  },
)

onBeforeUnmount(() => {
  if (fallbackTimer) clearTimeout(fallbackTimer)
})
</script>

<template>
  <div class="reel" :style="{ '--accent': accent }">
    <div class="reel-window" :class="{ 'reel-window--landed': landed }">
      <div
        ref="stripEl"
        class="reel-strip"
        :class="{ 'reel-strip--spinning': spinning }"
        :style="stripStyle"
        @transitionend="onTransitionEnd"
      >
        <div
          v-for="(sym, i) in strip"
          :key="i"
          class="symbol-cell"
          :class="{ 'symbol-cell--win': highlight && !spinning && i === 1 }"
        >
          <v-icon v-if="sym.icon" :color="sym.color" class="symbol-icon">{{ sym.icon }}</v-icon>
          <span v-else class="symbol-text" :style="{ color: sym.color }">{{ sym.text }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.reel {
  --cell-h: 96px;
  flex: 1 1 0;
  min-width: 0;
}

.reel-window {
  position: relative;
  height: calc(var(--cell-h) * 3);
  overflow: hidden;
  border-radius: 14px;
  background:
    linear-gradient(180deg, #d9d9d9 0%, #ffffff 18%, #ffffff 82%, #d0d0d0 100%);
  box-shadow:
    inset 0 0 0 2px rgba(0, 0, 0, 0.35),
    inset 0 10px 18px rgba(0, 0, 0, 0.35),
    inset 0 -10px 18px rgba(0, 0, 0, 0.35);
}

/* Sombreado cilíndrico superior / inferior */
.reel-window::after {
  content: '';
  position: absolute;
  inset: 0;
  pointer-events: none;
  background: linear-gradient(
    180deg,
    rgba(0, 0, 0, 0.55) 0%,
    rgba(0, 0, 0, 0) 28%,
    rgba(0, 0, 0, 0) 72%,
    rgba(0, 0, 0, 0.55) 100%
  );
}

.reel-window--landed {
  animation: reel-bounce 0.32s ease-out;
}

@keyframes reel-bounce {
  0% { transform: translateY(0); }
  40% { transform: translateY(6px); }
  100% { transform: translateY(0); }
}

.reel-strip {
  will-change: transform;
}

.symbol-cell {
  height: var(--cell-h);
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
}

.reel-strip--spinning .symbol-cell {
  filter: blur(1.4px);
}

.symbol-icon {
  font-size: calc(var(--cell-h) * 0.6) !important;
  filter: drop-shadow(0 3px 2px rgba(0, 0, 0, 0.35));
}

.symbol-text {
  font-family: 'Cinzel', serif;
  font-weight: 900;
  font-size: calc(var(--cell-h) * 0.66);
  line-height: 1;
  text-shadow:
    0 3px 0 rgba(0, 0, 0, 0.25),
    0 0 12px rgba(255, 23, 68, 0.35);
}

/* Símbolo ganador */
.symbol-cell--win::before {
  content: '';
  position: absolute;
  inset: 8px;
  border-radius: 12px;
  background: radial-gradient(circle, var(--accent) 0%, transparent 70%);
  opacity: 0.55;
  animation: win-glow 0.7s ease-in-out infinite alternate;
}

.symbol-cell--win .symbol-icon,
.symbol-cell--win .symbol-text {
  animation: win-pop 0.7s ease-in-out infinite alternate;
  position: relative;
}

@keyframes win-glow {
  from { opacity: 0.25; transform: scale(0.9); }
  to { opacity: 0.75; transform: scale(1.05); }
}

@keyframes win-pop {
  from { transform: scale(1); }
  to { transform: scale(1.14); }
}

@media (max-width: 600px) {
  .reel {
    --cell-h: 70px;
  }
}
</style>
