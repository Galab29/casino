<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { getRollNickname } from '~/constants/dados'

interface Props {
  die1: number
  die2: number
  isRolling: boolean
  point: number | null
  phase: 'come_out' | 'point'
  lastEventLabel?: string
  lastWon?: number
}

const props = withDefaults(defineProps<Props>(), {
  lastEventLabel: '',
  lastWon: 0,
})

const emit = defineEmits<{
  (e: 'roll-complete'): void
}>()

// Ángulos de rotación 3D para cada dado
const rot1 = ref({ x: 0, y: 0, z: 0 })
const rot2 = ref({ x: 0, y: 0, z: 0 })

// Vueltas completas acumuladas para que el dado siga rodando hacia adelante
let spinCount = 0

// Coordenadas base para mostrar cada cara de un dado estándar (opuestas suman 7)
function getFaceRotations(face: number): { x: number; y: number; z: number } {
  switch (face) {
    case 1:
      return { x: 0, y: 0, z: 0 }
    case 6:
      return { x: 0, y: 180, z: 0 }
    case 2:
      return { x: 0, y: -90, z: 0 }
    case 5:
      return { x: 0, y: 90, z: 0 }
    case 3:
      return { x: -90, y: 0, z: 0 }
    case 4:
      return { x: 90, y: 0, z: 0 }
    default:
      return { x: 0, y: 0, z: 0 }
  }
}

// Inicializar posición inicial según props
const initial1 = getFaceRotations(props.die1)
const initial2 = getFaceRotations(props.die2)
rot1.value = { ...initial1 }
rot2.value = { ...initial2 }

// Efecto de lanzamiento cuando isRolling pasa a true
watch(
  () => props.isRolling,
  (rolling) => {
    if (rolling) {
      spinCount++
      const baseSpins1 = 360 * (3 + Math.floor(Math.random() * 2))
      const baseSpins2 = 360 * (3 + Math.floor(Math.random() * 2))

      const target1 = getFaceRotations(props.die1)
      const target2 = getFaceRotations(props.die2)

      // Se aplican rotaciones con giros completos
      rot1.value = {
        x: target1.x + baseSpins1 + (spinCount % 2 === 0 ? 360 : 0),
        y: target1.y + baseSpins1,
        z: (Math.random() - 0.5) * 40,
      }

      rot2.value = {
        x: target2.x - baseSpins2,
        y: target2.y + baseSpins2,
        z: (Math.random() - 0.5) * 40,
      }

      // La animación dura 1100ms
      setTimeout(() => {
        emit('roll-complete')
      }, 1150)
    }
  }
)

const diceSum = computed(() => props.die1 + props.die2)
const nickname = computed(() => getRollNickname(props.die1, props.die2))
</script>

<template>
  <div class="dice-arena-container">
    <!-- Pared Trasera Amortiguadora con Textura Pirámide de Casino ("Alligator Bumper") -->
    <div class="arena-bumper-wall">
      <div class="bumper-diamonds" />
      <div class="bumper-rail">
        <span class="casino-craps-brand">ROYAL CASINO CRAPS</span>
      </div>
    </div>

    <!-- Mesa / Fieltro de Juego -->
    <div class="arena-felt">
      <!-- Indicador / Disco Puck de Craps (ON / OFF) -->
      <div class="puck-wrapper">
        <div
          class="craps-puck"
          :class="{
            'craps-puck--on': phase === 'point' && point !== null,
            'craps-puck--off': phase === 'come_out' || point === null,
          }"
        >
          <div class="puck-face">
            <span v-if="phase === 'point' && point !== null" class="puck-text puck-on">
              ON
              <span class="puck-point-val">{{ point }}</span>
            </span>
            <span v-else class="puck-text puck-off">OFF</span>
          </div>
        </div>
        <div class="puck-label">
          <span v-if="phase === 'point' && point !== null">PUNTO: {{ point }}</span>
          <span v-else>COME OUT ROLL</span>
        </div>
      </div>

      <!-- Zona de Lanzamiento 3D con Dados de Casino -->
      <div class="dice-stage">
        <!-- Dado 1 -->
        <div class="die-scene" :class="{ 'die-scene--rolling': isRolling }">
          <div
            class="die-cube die-cube--1"
            :style="{
              transform: `rotateX(${rot1.x}deg) rotateY(${rot1.y}deg) rotateZ(${rot1.z}deg)`,
            }"
          >
            <!-- Cara 1 -->
            <div class="die-face die-face--1">
              <span class="pip pip--center" />
            </div>
            <!-- Cara 6 -->
            <div class="die-face die-face--6">
              <span class="pip pip--tl" /><span class="pip pip--tr" />
              <span class="pip pip--ml" /><span class="pip pip--mr" />
              <span class="pip pip--bl" /><span class="pip pip--br" />
            </div>
            <!-- Cara 2 -->
            <div class="die-face die-face--2">
              <span class="pip pip--tl" /><span class="pip pip--br" />
            </div>
            <!-- Cara 5 -->
            <div class="die-face die-face--5">
              <span class="pip pip--tl" /><span class="pip pip--tr" />
              <span class="pip pip--center" />
              <span class="pip pip--bl" /><span class="pip pip--br" />
            </div>
            <!-- Cara 3 -->
            <div class="die-face die-face--3">
              <span class="pip pip--tl" /><span class="pip pip--center" /><span class="pip pip--br" />
            </div>
            <!-- Cara 4 -->
            <div class="die-face die-face--4">
              <span class="pip pip--tl" /><span class="pip pip--tr" />
              <span class="pip pip--bl" /><span class="pip pip--br" />
            </div>
          </div>
          <!-- Sombra Dinámica del Dado -->
          <div class="die-shadow" :class="{ 'die-shadow--bouncing': isRolling }" />
        </div>

        <!-- Dado 2 -->
        <div class="die-scene" :class="{ 'die-scene--rolling': isRolling }">
          <div
            class="die-cube die-cube--2"
            :style="{
              transform: `rotateX(${rot2.x}deg) rotateY(${rot2.y}deg) rotateZ(${rot2.z}deg)`,
            }"
          >
            <!-- Cara 1 -->
            <div class="die-face die-face--1">
              <span class="pip pip--center" />
            </div>
            <!-- Cara 6 -->
            <div class="die-face die-face--6">
              <span class="pip pip--tl" /><span class="pip pip--tr" />
              <span class="pip pip--ml" /><span class="pip pip--mr" />
              <span class="pip pip--bl" /><span class="pip pip--br" />
            </div>
            <!-- Cara 2 -->
            <div class="die-face die-face--2">
              <span class="pip pip--tl" /><span class="pip pip--br" />
            </div>
            <!-- Cara 5 -->
            <div class="die-face die-face--5">
              <span class="pip pip--tl" /><span class="pip pip--tr" />
              <span class="pip pip--center" />
              <span class="pip pip--bl" /><span class="pip pip--br" />
            </div>
            <!-- Cara 3 -->
            <div class="die-face die-face--3">
              <span class="pip pip--tl" /><span class="pip pip--center" /><span class="pip pip--br" />
            </div>
            <!-- Cara 4 -->
            <div class="die-face die-face--4">
              <span class="pip pip--tl" /><span class="pip pip--tr" />
              <span class="pip pip--bl" /><span class="pip pip--br" />
            </div>
          </div>
          <!-- Sombra Dinámica del Dado -->
          <div class="die-shadow" :class="{ 'die-shadow--bouncing': isRolling }" />
        </div>
      </div>

      <!-- Placa de Resultado de la Tirada -->
      <div class="roll-result-banner" :class="{ 'roll-result-banner--active': !isRolling }">
        <div class="d-flex align-center justify-center ga-3 mb-1">
          <div class="sum-badge">
            <span class="sum-value">{{ diceSum }}</span>
          </div>
          <div class="nickname-text">
            {{ nickname }}
          </div>
        </div>

        <div v-if="lastEventLabel" class="event-pill">
          {{ lastEventLabel }}
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.dice-arena-container {
  width: 100%;
  border-radius: 20px;
  background: radial-gradient(circle at 50% 20%, #155724 0%, #0c3816 70%, #06230e 100%);
  border: 4px solid #b8860b;
  box-shadow:
    0 12px 36px rgba(0, 0, 0, 0.7),
    inset 0 0 40px rgba(0, 0, 0, 0.6),
    0 0 0 2px #d4af37;
  overflow: hidden;
  position: relative;
  user-select: none;
}

/* Pared de Goma Piramidal de Craps ("Alligator Bumper") */
.arena-bumper-wall {
  height: 48px;
  background: linear-gradient(180deg, #3e2723 0%, #261611 100%);
  border-bottom: 3px solid #1a0f0a;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: inset 0 4px 8px rgba(0, 0, 0, 0.8);
}

.bumper-diamonds {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-image:
    repeating-linear-gradient(45deg, rgba(0, 0, 0, 0.4) 0, rgba(0, 0, 0, 0.4) 4px, transparent 4px, transparent 8px),
    repeating-linear-gradient(-45deg, rgba(0, 0, 0, 0.4) 0, rgba(0, 0, 0, 0.4) 4px, transparent 4px, transparent 8px);
  opacity: 0.6;
}

.bumper-rail {
  position: relative;
  z-index: 2;
  font-family: 'Cinzel', serif;
  font-size: 0.85rem;
  letter-spacing: 3px;
  font-weight: 800;
  color: #ffd54f;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.9);
}

/* Paño Fieltro */
.arena-felt {
  padding: 24px 20px;
  min-height: 220px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: space-between;
  position: relative;
  background:
    radial-gradient(circle at 50% 50%, rgba(38, 166, 91, 0.15) 0%, transparent 70%),
    linear-gradient(180deg, rgba(0, 0, 0, 0.1) 0%, rgba(0, 0, 0, 0.4) 100%);
}

/* Disco Puck de Craps */
.puck-wrapper {
  position: absolute;
  top: 14px;
  left: 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  z-index: 5;
}

.craps-puck {
  width: 48px;
  height: 48px;
  border-radius: 4px;
  border: 3px solid #000;
  box-shadow: 0 4px 0 #000;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.craps-puck--off {
  background: #272738;
  color: #cfd8dc;
}

.craps-puck--on {
  background: var(--pixel-gold);
  color: #1a1a1a;
  box-shadow: 0 4px 0 #000, 0 0 14px rgba(251, 192, 45, 0.5);
}

.puck-face {
  font-family: 'Press Start 2P', monospace !important;
  font-weight: 700;
  text-align: center;
  line-height: 1.2;
}

.puck-on {
  display: flex;
  flex-direction: column;
  font-size: 0.65rem;
  color: #000;
}

.puck-point-val {
  font-size: 0.6rem;
  font-weight: 900;
  color: #c62828;
}

.puck-off {
  font-size: 0.62rem;
  color: #ffffff;
}

.puck-label {
  font-family: 'Press Start 2P', monospace !important;
  font-size: 0.5rem;
  letter-spacing: 0px;
  color: #ffd54f;
  text-shadow: 1px 1px 0 #000;
}

/* Escena 3D de los Dados */
.dice-stage {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 40px;
  margin: 15px 0 10px 0;
  perspective: 900px;
}

.die-scene {
  width: 64px;
  height: 64px;
  position: relative;
  transform-style: preserve-3d;
}

.die-scene--rolling {
  animation: dieTumble 1.1s cubic-bezier(0.25, 1, 0.5, 1);
}

@keyframes dieTumble {
  0% {
    transform: translate(0, 0) scale(0.9);
  }
  20% {
    transform: translate(-10px, -45px) scale(1.15);
  }
  45% {
    transform: translate(12px, -20px) scale(1.05);
  }
  70% {
    transform: translate(-4px, -10px) scale(1.02);
  }
  100% {
    transform: translate(0, 0) scale(1);
  }
}

/* Cubo 3D de 6 Caras */
.die-cube {
  width: 64px;
  height: 64px;
  position: absolute;
  transform-style: preserve-3d;
  transition: transform 1.1s cubic-bezier(0.18, 0.89, 0.32, 1.15);
}

/* Caras del Dado: 8-Bit Pixel Cube */
.die-face {
  position: absolute;
  width: 64px;
  height: 64px;
  border-radius: 4px;
  background: #d90429;
  border: 2px solid #000;
  box-shadow:
    inset -4px -4px 0px 0px #800010,
    inset 4px 4px 0px 0px #ff6b6b;
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  grid-template-rows: repeat(3, 1fr);
  padding: 6px;
  box-sizing: border-box;
  image-rendering: pixelated;
}

/* Posiciones 3D de cada cara de un cubo de 64px (radio = 32px) */
.die-face--1 { transform: rotateY(0deg) translateZ(32px); }
.die-face--6 { transform: rotateY(180deg) translateZ(32px); }
.die-face--2 { transform: rotateY(90deg) translateZ(32px); }
.die-face--5 { transform: rotateY(-90deg) translateZ(32px); }
.die-face--3 { transform: rotateX(90deg) translateZ(32px); }
.die-face--4 { transform: rotateX(-90deg) translateZ(32px); }

/* Puntos / Pips del Dado (Puntos Cuadrados 8-bit) */
.pip {
  display: block;
  width: 12px;
  height: 12px;
  border-radius: 2px;
  background: #ffffff;
  border: 1px solid #000;
  box-shadow: 1px 1px 0 #000;
  place-self: center;
}

.pip--tl { grid-column: 1; grid-row: 1; }
.pip--tr { grid-column: 3; grid-row: 1; }
.pip--ml { grid-column: 1; grid-row: 2; }
.pip--mr { grid-column: 3; grid-row: 2; }
.pip--center { grid-column: 2; grid-row: 2; }
.pip--bl { grid-column: 1; grid-row: 3; }
.pip--br { grid-column: 3; grid-row: 3; }

/* Sombra proyectada en el fieltro */
.die-shadow {
  position: absolute;
  bottom: -16px;
  left: 6px;
  width: 52px;
  height: 14px;
  border-radius: 4px;
  background: rgba(0, 0, 0, 0.7);
  transition: all 0.3s ease;
}

.die-shadow--bouncing {
  animation: shadowBounce 1.1s cubic-bezier(0.25, 1, 0.5, 1);
}

@keyframes shadowBounce {
  0% { transform: scale(1); opacity: 0.65; }
  20% { transform: scale(0.6); opacity: 0.2; }
  45% { transform: scale(1.1); opacity: 0.55; }
  70% { transform: scale(0.9); opacity: 0.45; }
  100% { transform: scale(1); opacity: 0.65; }
}

/* Placa de Resultado */
.roll-result-banner {
  text-align: center;
  transition: all 0.3s ease;
  min-height: 44px;
}

.sum-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 38px;
  height: 38px;
  border-radius: 4px;
  background: var(--pixel-gold);
  border: 2px solid #000;
  box-shadow: 0 3px 0 #000;
  color: #000;
  font-family: 'Press Start 2P', monospace !important;
  font-weight: 700;
  font-size: 0.85rem;
}

.nickname-text {
  font-family: 'Press Start 2P', monospace !important;
  font-weight: 700;
  font-size: 0.75rem;
  color: #ffffff;
  text-shadow: 2px 2px 0 #000;
  margin-top: 4px;
}

.event-pill {
  display: inline-block;
  padding: 4px 12px;
  border-radius: 4px;
  background: #181822;
  border: 2px solid var(--pixel-gold);
  box-shadow: 0 3px 0 #000;
  font-family: 'Press Start 2P', monospace !important;
  font-size: 0.55rem;
  font-weight: 700;
  color: #ffd54f;
  letter-spacing: 0px;
}
</style>
