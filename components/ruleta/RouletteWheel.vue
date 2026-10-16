<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { WHEEL_NUMBERS, RED_NUMBERS, getNumberInfo } from '~/constants/ruleta'
import { useSoundEngine } from '~/composables/useSoundEngine'

interface Props {
  winningNumber: number | null
  isSpinning: boolean
}

const props = defineProps<Props>()
const emit = defineEmits<{
  (e: 'spin-complete'): void
}>()

const sound = useSoundEngine()

// ─── Dimensiones de la rueda ───────────────────────────────
const CX = 200
const CY = 200
const R_OUTER_RIM = 198
const R_BALL_TRACK = 184
const R_POCKET_OUTER = 170
const R_POCKET_INNER = 118
const R_TEXT = 144
const R_INNER_CONE = 114
const R_CENTER_TURRET = 48

const STEP_ANGLE = 360 / WHEEL_NUMBERS.length // ≈ 9.7297°

// ─── Estado de animación ───────────────────────────────────
const wheelAngle = ref(0)
const ballAngle = ref(0)
const ballRadius = ref(R_BALL_TRACK)
const ballOpacity = ref(0.95)
const isBallVisible = ref(true)
const isHighlighting = ref(false)

let animRaf: number | null = null
let bounceTimeouts: ReturnType<typeof setTimeout>[] = []

// ─── Generación de sectores SVG de la rueda ─────────────────
interface SectorDef {
  number: number
  color: 'green' | 'red' | 'black'
  fill: string
  path: string
  textX: number
  textY: number
  textAngle: number
}

function polarToCartesian(cx: number, cy: number, r: number, angleDeg: number) {
  const rad = ((angleDeg - 90) * Math.PI) / 180
  return {
    x: cx + r * Math.cos(rad),
    y: cy + r * Math.sin(rad),
  }
}

function makeSectorPath(cx: number, cy: number, rOut: number, rIn: number, startAngle: number, endAngle: number): string {
  const p1 = polarToCartesian(cx, cy, rOut, startAngle)
  const p2 = polarToCartesian(cx, cy, rOut, endAngle)
  const p3 = polarToCartesian(cx, cy, rIn, endAngle)
  const p4 = polarToCartesian(cx, cy, rIn, startAngle)

  return `M ${p1.x} ${p1.y} A ${rOut} ${rOut} 0 0 1 ${p2.x} ${p2.y} L ${p3.x} ${p3.y} A ${rIn} ${rIn} 0 0 0 ${p4.x} ${p4.y} Z`
}

const sectors = computed<SectorDef[]>(() => {
  return WHEEL_NUMBERS.map((num, i) => {
    const startA = (i - 0.5) * STEP_ANGLE
    const endA = (i + 0.5) * STEP_ANGLE
    const midA = i * STEP_ANGLE

    const color = num === 0 ? 'green' : RED_NUMBERS.has(num) ? 'red' : 'black'
    const fill = color === 'green' ? '#1b5e20' : color === 'red' ? '#b71c1c' : '#171923'

    const path = makeSectorPath(CX, CY, R_POCKET_OUTER, R_POCKET_INNER, startA, endA)
    const textPos = polarToCartesian(CX, CY, R_TEXT, midA)

    return {
      number: num,
      color,
      fill,
      path,
      textX: textPos.x,
      textY: textPos.y,
      textAngle: midA,
    }
  })
})

// ─── Posición de la bola en pantalla ───────────────────────
const ballCoords = computed(() => {
  return polarToCartesian(CX, CY, ballRadius.value, ballAngle.value)
})

// ─── Lógica de animación del giro ──────────────────────────
function startSpinAnimation(targetNum: number) {
  if (animRaf) cancelAnimationFrame(animRaf)
  bounceTimeouts.forEach(clearTimeout)
  bounceTimeouts = []

  isHighlighting.value = false
  isBallVisible.value = true

  // Sonido de giro
  sound.playWheelSpin()
  sound.playBallRoll()

  const targetIndex = WHEEL_NUMBERS.indexOf(targetNum)
  const pocketAngle = targetIndex * STEP_ANGLE

  // La rueda gira en sentido antihorario
  // Queremos que el pocketAngle quede exactamente en 0° (arriba, bajo el marcador)
  const currentWheelMod = ((wheelAngle.value % 360) + 360) % 360
  const desiredWheelMod = (360 - pocketAngle) % 360
  let wheelDelta = desiredWheelMod - currentWheelMod
  if (wheelDelta > 0) wheelDelta -= 360

  const WHEEL_SPINS = 4
  const finalWheelAngle = wheelAngle.value + wheelDelta - WHEEL_SPINS * 360

  // La bola gira en sentido horario a alta velocidad
  const BALL_SPINS = 7
  const initialBallAngle = ballAngle.value
  const finalBallAngle = initialBallAngle + BALL_SPINS * 360 - (initialBallAngle % 360) // se detiene arriba en 0°

  const DURATION = 4600 // ms
  const startTime = performance.now()

  // Sonidos de rebote programados cerca del final
  bounceTimeouts.push(setTimeout(() => sound.playBallBounce(), 3400))
  bounceTimeouts.push(setTimeout(() => sound.playBallBounce(), 3800))
  bounceTimeouts.push(setTimeout(() => sound.playBallBounce(), 4150))
  bounceTimeouts.push(setTimeout(() => sound.playBallPocket(), 4450))

  function easeOutCubic(t: number): number {
    return 1 - Math.pow(1 - t, 3)
  }

  function easeOutQuint(t: number): number {
    return 1 - Math.pow(1 - t, 5)
  }

  function frame(now: number) {
    const elapsed = now - startTime
    const progress = Math.min(1, elapsed / DURATION)

    // Animación de la rueda (suave deceleración)
    const wheelProgress = easeOutCubic(progress)
    wheelAngle.value = wheelAngle.value + (finalWheelAngle - wheelAngle.value) * (wheelProgress * 0.05 + 0.01)

    // Animación de la bola
    const ballProgress = easeOutQuint(progress)
    ballAngle.value = initialBallAngle + (finalBallAngle - initialBallAngle) * ballProgress

    // Trayectoria radial de la bola:
    // Fase 1 (0-65%): en la pista exterior (R_BALL_TRACK)
    // Fase 2 (65-88%): cae hacia el anillo de casillas
    // Fase 3 (88-100%): pequeños botes y reposo en R_TEXT
    if (progress < 0.65) {
      ballRadius.value = R_BALL_TRACK
    } else if (progress < 0.88) {
      const dropP = (progress - 0.65) / 0.23
      ballRadius.value = R_BALL_TRACK - (R_BALL_TRACK - R_TEXT) * easeOutCubic(dropP)
    } else {
      const settleP = (progress - 0.88) / 0.12
      // Pequeño rebote físico
      const bounce = Math.sin(settleP * Math.PI * 2) * 5 * (1 - settleP)
      ballRadius.value = R_TEXT + bounce
    }

    if (progress < 1) {
      animRaf = requestAnimationFrame(frame)
    } else {
      // Fin del giro: sincronizar posición exacta
      wheelAngle.value = finalWheelAngle
      ballAngle.value = 0 // exactamente arriba en el marcador
      ballRadius.value = R_TEXT
      isHighlighting.value = true
      emit('spin-complete')
    }
  }

  animRaf = requestAnimationFrame(frame)
}

// ─── Observar cuando comienza el giro en el padre ───────────
watch(
  () => props.isSpinning,
  (spinning) => {
    if (spinning && props.winningNumber !== null) {
      startSpinAnimation(props.winningNumber)
    }
  },
)

onUnmounted(() => {
  if (animRaf) cancelAnimationFrame(animRaf)
  bounceTimeouts.forEach(clearTimeout)
})
</script>

<template>
  <div class="roulette-wheel-wrapper">
    <!-- Resplandor ambiental de la rueda -->
    <div class="wheel-glow" :class="{ 'wheel-glow--active': isSpinning || isHighlighting }" />

    <svg
      viewBox="0 0 400 400"
      class="roulette-svg"
      role="img"
      aria-label="Rueda de Ruleta Europea"
    >
      <defs>
        <!-- Gradiente para el borde exterior de madera de caoba pulida -->
        <radialGradient id="woodRimGradient" cx="50%" cy="50%" r="50%">
          <stop offset="85%" stop-color="#2c1208" />
          <stop offset="93%" stop-color="#4a2211" />
          <stop offset="97%" stop-color="#5f2e17" />
          <stop offset="100%" stop-color="#1f0b04" />
        </radialGradient>

        <!-- Anillo metálico dorado/bronce -->
        <linearGradient id="brassGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#ffd54f" />
          <stop offset="25%" stop-color="#b8860b" />
          <stop offset="50%" stop-color="#fff8e1" />
          <stop offset="75%" stop-color="#d4af37" />
          <stop offset="100%" stop-color="#8a6314" />
        </linearGradient>

        <!-- Cono interior metálico con sombras -->
        <radialGradient id="coneGradient" cx="45%" cy="40%" r="50%">
          <stop offset="0%" stop-color="#ffe082" />
          <stop offset="35%" stop-color="#c59b27" />
          <stop offset="70%" stop-color="#7a550c" />
          <stop offset="100%" stop-color="#3d2600" />
        </radialGradient>

        <!-- Torreta central cromada con brillos -->
        <linearGradient id="chromeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#ffffff" />
          <stop offset="30%" stop-color="#cfd8dc" />
          <stop offset="70%" stop-color="#78909c" />
          <stop offset="100%" stop-color="#37474f" />
        </linearGradient>

        <!-- Bola de marfil 3D -->
        <radialGradient id="ivoryBall" cx="35%" cy="30%" r="65%">
          <stop offset="0%" stop-color="#ffffff" />
          <stop offset="40%" stop-color="#fdfbf7" />
          <stop offset="75%" stop-color="#e2dad0" />
          <stop offset="100%" stop-color="#9e9488" />
        </radialGradient>

        <!-- Sombra proyectada de la bola -->
        <radialGradient id="ballShadow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stop-color="rgba(0,0,0,0.6)" />
          <stop offset="100%" stop-color="rgba(0,0,0,0)" />
        </radialGradient>

        <!-- Filtro de sombra profunda -->
        <filter id="shadowFilter" x="-10%" y="-10%" width="120%" height="120%">
          <feDropShadow dx="0" dy="6" stdDeviation="8" flood-color="#000" flood-opacity="0.8" />
        </filter>
      </defs>

      <!-- ═══ 1. Borde exterior de madera de caoba ═══ -->
      <circle
        :cx="CX"
        :cy="CY"
        :r="R_OUTER_RIM"
        fill="url(#woodRimGradient)"
        stroke="#ffd54f"
        stroke-width="3"
        filter="url(#shadowFilter)"
      />

      <!-- Pista exterior de bronce (por donde corre la bola) -->
      <circle
        :cx="CX"
        :cy="CY"
        :r="R_BALL_TRACK + 4"
        fill="#120703"
        stroke="url(#brassGradient)"
        stroke-width="2.5"
      />

      <!-- Rombos deflectores metálicos en la pista (8 pivotes clásicos) -->
      <g class="deflectors">
        <path
          v-for="i in 8"
          :key="`def-${i}`"
          d="M -3 -6 L 3 0 L -3 6 L -9 0 Z"
          fill="url(#brassGradient)"
          :transform="`translate(${polarToCartesian(CX, CY, R_BALL_TRACK - 3, (i * 360) / 8).x}, ${polarToCartesian(CX, CY, R_BALL_TRACK - 3, (i * 360) / 8).y}) rotate(${(i * 360) / 8 + 45})`"
        />
      </g>

      <!-- ═══ 2. Rotor giratorio (casillas y números) ═══ -->
      <g :transform="`rotate(${wheelAngle}, ${CX}, ${CY})`">
        <!-- Fondo del anillo de casillas -->
        <circle :cx="CX" :cy="CY" :r="R_POCKET_OUTER" fill="#0b0e14" />

        <!-- Sectores de números -->
        <g v-for="sec in sectors" :key="sec.number">
          <!-- Casilla coloreada -->
          <path
            :d="sec.path"
            :fill="sec.fill"
            stroke="#b0bec5"
            stroke-width="0.8"
            class="sector-path"
            :class="{ 'sector--winning': isHighlighting && sec.number === winningNumber }"
          />

          <!-- Número orientado radialmente -->
          <text
            :x="sec.textX"
            :y="sec.textY"
            fill="#ffffff"
            font-size="10.5"
            font-family="'Cinzel', serif, sans-serif"
            font-weight="900"
            text-anchor="middle"
            dominant-baseline="central"
            :transform="`rotate(${sec.textAngle}, ${sec.textX}, ${sec.textY})`"
            class="sector-number"
          >
            {{ sec.number }}
          </text>
        </g>

        <!-- Anillo separador interior de latón -->
        <circle
          :cx="CX"
          :cy="CY"
          :r="R_POCKET_INNER"
          fill="none"
          stroke="url(#brassGradient)"
          stroke-width="2"
        />

        <!-- Cono central dorado con reflejos radiales -->
        <circle :cx="CX" :cy="CY" :r="R_INNER_CONE" fill="url(#coneGradient)" />

        <!-- 8 rayos del cono central -->
        <line
          v-for="i in 8"
          :key="`cone-ray-${i}`"
          :x1="CX"
          :y1="CY"
          :x2="polarToCartesian(CX, CY, R_INNER_CONE, (i * 360) / 8).x"
          :y2="polarToCartesian(CX, CY, R_INNER_CONE, (i * 360) / 8).y"
          stroke="rgba(255, 213, 79, 0.4)"
          stroke-width="1.2"
        />
      </g>

      <!-- ═══ 3. Torreta central estacionaria de latón/cromo ═══ -->
      <g class="center-turret">
        <!-- Base de la torreta -->
        <circle
          :cx="CX"
          :cy="CY"
          :r="R_CENTER_TURRET"
          fill="url(#brassGradient)"
          stroke="#422e03"
          stroke-width="2"
          filter="url(#shadowFilter)"
        />

        <!-- Anillo cromo interior -->
        <circle
          :cx="CX"
          :cy="CY"
          :r="R_CENTER_TURRET - 12"
          fill="url(#chromeGradient)"
          stroke="#ffffff"
          stroke-width="1"
        />

        <!-- Manijas cruzadas de giro de la torreta (4 brazos) -->
        <g :transform="`rotate(${wheelAngle * 0.4}, ${CX}, ${CY})`">
          <line
            :x1="CX - 36"
            :y1="CY"
            :x2="CX + 36"
            :y2="CY"
            stroke="url(#brassGradient)"
            stroke-width="5"
            stroke-linecap="round"
          />
          <line
            :x1="CX"
            :y1="CY - 36"
            :x2="CX"
            :y2="CY + 36"
            stroke="url(#brassGradient)"
            stroke-width="5"
            stroke-linecap="round"
          />
          <!-- Pomos de las manijas -->
          <circle :cx="CX - 36" :cy="CY" r="4.5" fill="#ffd54f" stroke="#5d4037" stroke-width="1" />
          <circle :cx="CX + 36" :cy="CY" r="4.5" fill="#ffd54f" stroke="#5d4037" stroke-width="1" />
          <circle :cx="CX" :cy="CY - 36" r="4.5" fill="#ffd54f" stroke="#5d4037" stroke-width="1" />
          <circle :cx="CX" :cy="CY + 36" r="4.5" fill="#ffd54f" stroke="#5d4037" stroke-width="1" />
        </g>

        <!-- Botón superior de la torreta -->
        <circle :cx="CX" :cy="CY" r="14" fill="url(#brassGradient)" stroke="#ffffff" stroke-width="1.2" />
        <circle :cx="CX - 2" :cy="CY - 2" r="4" fill="rgba(255,255,255,0.7)" />
      </g>

      <!-- ═══ 4. La Bola de Marfil ═══ -->
      <g v-if="isBallVisible" class="roulette-ball">
        <!-- Sombra de la bola -->
        <ellipse
          :cx="ballCoords.x + 2"
          :cy="ballCoords.y + 3"
          rx="6.5"
          ry="5"
          fill="url(#ballShadow)"
        />
        <!-- Esfera 3D -->
        <circle
          :cx="ballCoords.x"
          :cy="ballCoords.y"
          r="6"
          fill="url(#ivoryBall)"
          stroke="#d7ccc8"
          stroke-width="0.8"
        />
        <!-- Brillo especular -->
        <circle
          :cx="ballCoords.x - 1.8"
          :cy="ballCoords.y - 1.8"
          r="2"
          fill="#ffffff"
          opacity="0.9"
        />
      </g>

      <!-- ═══ 5. Marcador / Indicador fijo en la parte superior (12 horas) ═══ -->
      <g class="top-marker" filter="url(#shadowFilter)">
        <polygon
          points="200,8 190,-4 210,-4"
          fill="#ffd54f"
          stroke="#5d4037"
          stroke-width="1.5"
        />
        <circle cx="200" cy="-3" r="3" fill="#ffe082" />
      </g>
    </svg>

    <!-- Indicador de estado flotante -->
    <div v-if="isHighlighting && winningNumber !== null" class="winner-callout animate-pop">
      <div
        class="winner-badge"
        :class="`winner-badge--${getNumberInfo(winningNumber).color}`"
      >
        <span class="winner-num">{{ winningNumber }}</span>
        <span class="winner-label">{{ getNumberInfo(winningNumber).color.toUpperCase() }}</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.roulette-wheel-wrapper {
  position: relative;
  width: 100%;
  max-width: clamp(300px, 36vh, 400px);
  aspect-ratio: 1;
  margin: 0 auto;
  display: flex;
  align-items: center;
  justify-content: center;
}

.roulette-svg {
  width: 100%;
  height: 100%;
  overflow: visible;
  filter: drop-shadow(0 15px 35px rgba(0, 0, 0, 0.7));
}

.wheel-glow {
  position: absolute;
  inset: -10px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(255, 213, 79, 0.15) 0%, rgba(0, 0, 0, 0) 70%);
  pointer-events: none;
  transition: all 0.5s ease;
  opacity: 0.4;
}

.wheel-glow--active {
  opacity: 1;
  background: radial-gradient(
    circle,
    rgba(255, 213, 79, 0.35) 0%,
    rgba(230, 81, 0, 0.2) 45%,
    rgba(0, 0, 0, 0) 75%
  );
  animation: glowPulse 2s ease-in-out infinite alternate;
}

@keyframes glowPulse {
  0% {
    transform: scale(0.98);
    opacity: 0.7;
  }
  100% {
    transform: scale(1.04);
    opacity: 1;
  }
}

.sector-path {
  transition: filter 0.3s ease;
}

.sector--winning {
  fill: #ffd54f !important;
  stroke: #ffffff !important;
  stroke-width: 2 !important;
  filter: drop-shadow(0 0 8px rgba(255, 213, 79, 0.9));
}

.sector--winning + .sector-number {
  fill: #000000 !important;
  font-weight: 900;
}

.winner-callout {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  pointer-events: none;
  z-index: 10;
}

.winner-badge {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 90px;
  height: 90px;
  border-radius: 0;
  border: 3px solid #ffd54f;
  box-shadow: 4px 4px 0 #000, 0 0 20px rgba(255, 213, 79, 0.8);
  color: #fff;
  text-shadow: 2px 2px 0 #000;
}

.winner-badge--green {
  background: #15803d;
}

.winner-badge--red {
  background: #b91c1c;
}

.winner-badge--black {
  background: #18181b;
}

.winner-num {
  font-family: 'Press Start 2P', monospace;
  font-size: 1.35rem;
  font-weight: 700;
  line-height: 1;
}

.winner-label {
  font-family: 'Press Start 2P', monospace;
  font-size: 0.48rem;
  font-weight: 700;
  letter-spacing: 0;
  margin-top: 4px;
}

@keyframes popIn {
  0% {
    opacity: 0;
    transform: translate(-50%, -50%) scale(0.3);
  }
  70% {
    opacity: 1;
    transform: translate(-50%, -50%) scale(1.15);
  }
  100% {
    opacity: 1;
    transform: translate(-50%, -50%) scale(1);
  }
}

.animate-pop {
  animation: popIn 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
}
</style>
