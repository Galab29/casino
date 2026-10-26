<script setup lang="ts">
import { ref, computed } from 'vue'
import type { BetType, RouletteBet } from '~/types/ruleta'
import {
  TABLE_ROWS,
  RED_NUMBERS,
  BLACK_NUMBERS,
  getNumberInfo,
  CHIP_CONFIG,
} from '~/constants/ruleta'
import { useSoundEngine } from '~/composables/useSoundEngine'

interface Props {
  bets: Record<string, RouletteBet>
  disabled: boolean
  winningNumber: number | null
}

const props = defineProps<Props>()
const emit = defineEmits<{
  (e: 'place-bet', type: BetType, target: string | number, label: string): void
}>()

const sound = useSoundEngine()

// ─── Estado de zona resaltada al pasar el ratón ─────────────
const hoveredZone = ref<string | null>(null)

function isHighlighted(num: number): boolean {
  if (!hoveredZone.value) return false
  const [type, target] = hoveredZone.value.split(':')

  if (num === 0) {
    return type === 'straight' && target === '0'
  }

  const info = getNumberInfo(num)

  switch (type) {
    case 'straight':
      return target === num.toString()
    case 'color':
      return info.color === target
    case 'parity':
      return (target === 'even' && info.isEven) || (target === 'odd' && info.isOdd)
    case 'range':
      return (target === 'low' && info.isLow) || (target === 'high' && info.isHigh)
    case 'dozen':
      return info.dozen?.toString() === target
    case 'column':
      return info.column?.toString() === target
    default:
      return false
  }
}

function handleBetClick(type: BetType, target: string | number, label: string) {
  if (props.disabled) return
  sound.playChipClick()
  emit('place-bet', type, target, label)
}

/** Formatea fichas para que entren estéticamente dentro de la ficha (ej: 100, 1.5k) */
function formatChipAmount(val: number): string {
  if (val >= 1000) {
    return `${(val / 1000).toFixed(val % 1000 === 0 ? 0 : 1)}k`
  }
  return val.toString()
}

/** Elige el color visual de la ficha según la cuantía acumulada */
function getChipColor(amount: number): string {
  if (amount >= 500) return '#f57f17'
  if (amount >= 250) return '#c62828'
  if (amount >= 100) return '#5e35b1'
  if (amount >= 50) return '#1565c0'
  if (amount >= 25) return '#2e7d32'
  return '#00897b'
}
</script>

<template>
  <div class="roulette-table-felt">
    <!-- Marco dorado exterior del tapete -->
    <div class="felt-border">
      <!-- ═══ Contenedor Principal de Apuestas ═══ -->
      <div class="grid-table">
        <!-- ─── Casilla del CERO (Izquierda, abarca las 3 filas) ─── -->
        <div
          class="bet-spot spot-zero"
          :class="{
            'spot--highlight': isHighlighted(0),
            'spot--winner': winningNumber === 0,
          }"
          @mouseenter="hoveredZone = 'straight:0'"
          @mouseleave="hoveredZone = null"
          @click="handleBetClick('straight', 0, 'Pleno al 0')"
        >
          <div class="zero-content">
            <span class="zero-text">0</span>
          </div>
          <!-- Ficha colocada -->
          <div v-if="bets['straight-0']" class="chip-token" :style="{ '--chip-color': getChipColor(bets['straight-0'].amount) }">
            {{ formatChipAmount(bets['straight-0'].amount) }}
          </div>
        </div>

        <!-- ─── Matriz de 36 Números (3 filas × 12 columnas) ─── -->
        <div class="numbers-matrix">
          <div
            v-for="(row, rowIdx) in TABLE_ROWS"
            :key="`row-${rowIdx}`"
            class="numbers-row"
          >
            <div
              v-for="num in row"
              :key="`num-${num}`"
              class="bet-spot spot-number"
              :class="{
                'spot--red': RED_NUMBERS.has(num),
                'spot--black': BLACK_NUMBERS.has(num),
                'spot--highlight': isHighlighted(num),
                'spot--winner': winningNumber === num,
              }"
              @mouseenter="hoveredZone = `straight:${num}`"
              @mouseleave="hoveredZone = null"
              @click="handleBetClick('straight', num, `Pleno al ${num}`)"
            >
              <span class="number-label">{{ num }}</span>

              <!-- Ficha colocada -->
              <div
                v-if="bets[`straight-${num}`]"
                class="chip-token"
                :style="{ '--chip-color': getChipColor(bets[`straight-${num}`].amount) }"
              >
                {{ formatChipAmount(bets[`straight-${num}`].amount) }}
              </div>
            </div>
          </div>
        </div>

        <!-- ─── Columnas 2:1 (Derecha, al final de cada fila) ─── -->
        <div class="columns-col">
          <!-- Fila superior es Columna 3 -->
          <div
            class="bet-spot spot-col"
            @mouseenter="hoveredZone = 'column:3'"
            @mouseleave="hoveredZone = null"
            @click="handleBetClick('column', 3, 'Columna 3 (2 a 1)')"
          >
            <span class="col-label">2 a 1</span>
            <div
              v-if="bets['column-3']"
              class="chip-token"
              :style="{ '--chip-color': getChipColor(bets['column-3'].amount) }"
            >
              {{ formatChipAmount(bets['column-3'].amount) }}
            </div>
          </div>

          <!-- Fila media es Columna 2 -->
          <div
            class="bet-spot spot-col"
            @mouseenter="hoveredZone = 'column:2'"
            @mouseleave="hoveredZone = null"
            @click="handleBetClick('column', 2, 'Columna 2 (2 a 1)')"
          >
            <span class="col-label">2 a 1</span>
            <div
              v-if="bets['column-2']"
              class="chip-token"
              :style="{ '--chip-color': getChipColor(bets['column-2'].amount) }"
            >
              {{ formatChipAmount(bets['column-2'].amount) }}
            </div>
          </div>

          <!-- Fila inferior es Columna 1 -->
          <div
            class="bet-spot spot-col"
            @mouseenter="hoveredZone = 'column:1'"
            @mouseleave="hoveredZone = null"
            @click="handleBetClick('column', 1, 'Columna 1 (2 a 1)')"
          >
            <span class="col-label">2 a 1</span>
            <div
              v-if="bets['column-1']"
              class="chip-token"
              :style="{ '--chip-color': getChipColor(bets['column-1'].amount) }"
            >
              {{ formatChipAmount(bets['column-1'].amount) }}
            </div>
          </div>
        </div>
      </div>

      <!-- ═══ Fila de Docenas (1-12, 13-24, 25-36) ═══ -->
      <div class="dozens-row">
        <!-- Espacio alineado con el 0 -->
        <div class="spacer-zero" />

        <div
          class="bet-spot spot-dozen"
          @mouseenter="hoveredZone = 'dozen:1'"
          @mouseleave="hoveredZone = null"
          @click="handleBetClick('dozen', 1, '1ª Docena (1-12)')"
        >
          <span class="outside-title">1ª 12</span>
          <span class="outside-sub">Paga 2 a 1</span>
          <div
            v-if="bets['dozen-1']"
            class="chip-token"
            :style="{ '--chip-color': getChipColor(bets['dozen-1'].amount) }"
          >
            {{ formatChipAmount(bets['dozen-1'].amount) }}
          </div>
        </div>

        <div
          class="bet-spot spot-dozen"
          @mouseenter="hoveredZone = 'dozen:2'"
          @mouseleave="hoveredZone = null"
          @click="handleBetClick('dozen', 2, '2ª Docena (13-24)')"
        >
          <span class="outside-title">2ª 12</span>
          <span class="outside-sub">Paga 2 a 1</span>
          <div
            v-if="bets['dozen-2']"
            class="chip-token"
            :style="{ '--chip-color': getChipColor(bets['dozen-2'].amount) }"
          >
            {{ formatChipAmount(bets['dozen-2'].amount) }}
          </div>
        </div>

        <div
          class="bet-spot spot-dozen"
          @mouseenter="hoveredZone = 'dozen:3'"
          @mouseleave="hoveredZone = null"
          @click="handleBetClick('dozen', 3, '3ª Docena (25-36)')"
        >
          <span class="outside-title">3ª 12</span>
          <span class="outside-sub">Paga 2 a 1</span>
          <div
            v-if="bets['dozen-3']"
            class="chip-token"
            :style="{ '--chip-color': getChipColor(bets['dozen-3'].amount) }"
          >
            {{ formatChipAmount(bets['dozen-3'].amount) }}
          </div>
        </div>

        <!-- Espacio alineado con columnas -->
        <div class="spacer-col" />
      </div>

      <!-- ═══ Fila de Apuestas Simples (1:1) ═══ -->
      <div class="outside-row">
        <!-- Espacio alineado con el 0 -->
        <div class="spacer-zero" />

        <!-- 1 a 18 (Falta) -->
        <div
          class="bet-spot spot-simple"
          @mouseenter="hoveredZone = 'range:low'"
          @mouseleave="hoveredZone = null"
          @click="handleBetClick('range', 'low', '1 a 18 (Falta)')"
        >
          <span class="outside-title">1 - 18</span>
          <div
            v-if="bets['range-low']"
            class="chip-token"
            :style="{ '--chip-color': getChipColor(bets['range-low'].amount) }"
          >
            {{ formatChipAmount(bets['range-low'].amount) }}
          </div>
        </div>

        <!-- PAR -->
        <div
          class="bet-spot spot-simple"
          @mouseenter="hoveredZone = 'parity:even'"
          @mouseleave="hoveredZone = null"
          @click="handleBetClick('parity', 'even', 'Par (Even)')"
        >
          <span class="outside-title">PAR</span>
          <div
            v-if="bets['parity-even']"
            class="chip-token"
            :style="{ '--chip-color': getChipColor(bets['parity-even'].amount) }"
          >
            {{ formatChipAmount(bets['parity-even'].amount) }}
          </div>
        </div>

        <!-- ROJO -->
        <div
          class="bet-spot spot-simple spot-red-box"
          @mouseenter="hoveredZone = 'color:red'"
          @mouseleave="hoveredZone = null"
          @click="handleBetClick('color', 'red', 'Color Rojo')"
        >
          <div class="color-diamond red-diamond">
            <span>ROJO</span>
          </div>
          <div
            v-if="bets['color-red']"
            class="chip-token"
            :style="{ '--chip-color': getChipColor(bets['color-red'].amount) }"
          >
            {{ formatChipAmount(bets['color-red'].amount) }}
          </div>
        </div>

        <!-- NEGRO -->
        <div
          class="bet-spot spot-simple spot-black-box"
          @mouseenter="hoveredZone = 'color:black'"
          @mouseleave="hoveredZone = null"
          @click="handleBetClick('color', 'black', 'Color Negro')"
        >
          <div class="color-diamond black-diamond">
            <span>NEGRO</span>
          </div>
          <div
            v-if="bets['color-black']"
            class="chip-token"
            :style="{ '--chip-color': getChipColor(bets['color-black'].amount) }"
          >
            {{ formatChipAmount(bets['color-black'].amount) }}
          </div>
        </div>

        <!-- IMPAR -->
        <div
          class="bet-spot spot-simple"
          @mouseenter="hoveredZone = 'parity:odd'"
          @mouseleave="hoveredZone = null"
          @click="handleBetClick('parity', 'odd', 'Impar (Odd)')"
        >
          <span class="outside-title">IMPAR</span>
          <div
            v-if="bets['parity-odd']"
            class="chip-token"
            :style="{ '--chip-color': getChipColor(bets['parity-odd'].amount) }"
          >
            {{ formatChipAmount(bets['parity-odd'].amount) }}
          </div>
        </div>

        <!-- 19 a 36 (Pasa) -->
        <div
          class="bet-spot spot-simple"
          @mouseenter="hoveredZone = 'range:high'"
          @mouseleave="hoveredZone = null"
          @click="handleBetClick('range', 'high', '19 a 36 (Pasa)')"
        >
          <span class="outside-title">19 - 36</span>
          <div
            v-if="bets['range-high']"
            class="chip-token"
            :style="{ '--chip-color': getChipColor(bets['range-high'].amount) }"
          >
            {{ formatChipAmount(bets['range-high'].amount) }}
          </div>
        </div>

        <!-- Espacio alineado con columnas -->
        <div class="spacer-col" />
      </div>
    </div>
  </div>
</template>

<style scoped>
.roulette-table-felt {
  width: 100%;
  overflow-x: auto;
  padding: 8px 4px;
}

.felt-border {
  min-width: 680px;
  background: radial-gradient(circle at 50% 50%, #0d4422 0%, #082d16 100%);
  border: 4px solid #b8860b;
  border-radius: 0;
  padding: 14px;
  box-shadow: 0 6px 0 #000, inset 0 0 0 2px #ffd54f;
  position: relative;
  user-select: none;
}

/* ═══ Estructura de la grilla ═══ */
.grid-table {
  display: flex;
  margin-bottom: 6px;
}

.spot-zero {
  width: 58px;
  background: #15803d;
  border: 2px solid rgba(255, 213, 79, 0.7);
  border-radius: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  position: relative;
  box-shadow: 2px 2px 0 #000;
  transition: all 0.15s ease;
}

.zero-text {
  font-family: 'Press Start 2P', monospace;
  font-size: 1.2rem;
  font-weight: 700;
  color: #fff;
  text-shadow: 2px 2px 0 #000;
}

.numbers-matrix {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.numbers-row {
  display: flex;
  flex: 1;
}

.spot-number {
  flex: 1;
  height: 48px;
  border: 1px solid rgba(255, 213, 79, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  position: relative;
  transition: all 0.15s ease;
}

.spot--red {
  background: #b91c1c;
}

.spot--black {
  background: #111418;
}

.number-label {
  font-family: 'Press Start 2P', monospace;
  font-size: 0.82rem;
  font-weight: 700;
  color: #ffffff;
  text-shadow: 1px 1px 0 #000;
}

/* Columnas (2 a 1) */
.columns-col {
  width: 52px;
  display: flex;
  flex-direction: column;
}

.spot-col {
  flex: 1;
  height: 48px;
  background: #092c15;
  border: 1.5px solid rgba(255, 213, 79, 0.5);
  border-left: none;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  position: relative;
  transition: all 0.15s ease;
}

.col-label {
  font-family: 'Press Start 2P', monospace;
  font-size: 0.52rem;
  font-weight: 700;
  color: #ffd54f;
  letter-spacing: 0;
}

/* ═══ Fila de Docenas ═══ */
.dozens-row {
  display: flex;
  margin-bottom: 6px;
}

.spacer-zero {
  width: 58px;
}

.spacer-col {
  width: 52px;
}

.spot-dozen {
  flex: 1;
  height: 42px;
  background: #0c381c;
  border: 2px solid rgba(255, 213, 79, 0.5);
  margin: 0 2px;
  border-radius: 0;
  box-shadow: 2px 2px 0 #000;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  position: relative;
  transition: all 0.15s ease;
}

.outside-title {
  font-family: 'Press Start 2P', monospace;
  font-size: 0.58rem;
  font-weight: 700;
  color: #ffffff;
  letter-spacing: 0;
}

.outside-sub {
  font-family: 'Press Start 2P', monospace;
  font-size: 0.48rem;
  color: #ffd54f;
  font-weight: 700;
}

/* ═══ Fila de Apuestas Simples (1:1) ═══ */
.outside-row {
  display: flex;
}

.spot-simple {
  flex: 1;
  height: 44px;
  background: #0c381c;
  border: 2px solid rgba(255, 213, 79, 0.5);
  margin: 0 2px;
  border-radius: 0;
  box-shadow: 2px 2px 0 #000;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  position: relative;
  transition: all 0.15s ease;
}

.color-diamond {
  width: 80%;
  height: 70%;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 0;
  font-family: 'Press Start 2P', monospace;
  font-size: 0.55rem;
  font-weight: 700;
  border: 2px solid rgba(255, 255, 255, 0.6);
  box-shadow: 1px 1px 0 #000;
}

.red-diamond {
  background: #dc2626;
  color: #fff;
}

.black-diamond {
  background: #18181b;
  color: #fff;
}

/* ═══ Efectos de interacción y hover ═══ */
.bet-spot:hover {
  filter: brightness(1.2);
  border-color: #ffd54f !important;
  box-shadow: 0 0 0 2px #fff, 2px 2px 0 #000;
}

.spot--highlight {
  border-color: #ffd54f !important;
  box-shadow: 0 0 10px rgba(255, 213, 79, 0.85), 2px 2px 0 #000;
  filter: brightness(1.25);
  z-index: 2;
}

.spot--winner {
  animation: winningSpotPulse 1s ease-in-out infinite alternate !important;
  z-index: 5;
}

@keyframes winningSpotPulse {
  0% {
    box-shadow: 0 0 0 2px #ffd54f, 2px 2px 0 #000;
    border-color: #ffffff;
    filter: brightness(1.3);
  }
  100% {
    box-shadow: 0 0 16px #ffd54f, 0 0 0 3px #fff, 2px 2px 0 #000;
    border-color: #ffe082;
    filter: brightness(1.6);
  }
}

/* ═══ Ficha 8-Bit sobre la casilla ═══ */
.chip-token {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 28px;
  height: 28px;
  border-radius: 0;
  background: var(--chip-color);
  border: 2px solid #ffffff;
  box-shadow: 2px 2px 0 #000;
  color: #fff;
  font-family: 'Press Start 2P', monospace;
  font-size: 0.5rem;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 3;
  pointer-events: none;
  animation: dropChip 0.18s steps(4);
}

@keyframes dropChip {
  0% {
    transform: translate(-50%, -80%) scale(1.3);
    opacity: 0.5;
  }
  100% {
    transform: translate(-50%, -50%) scale(1);
    opacity: 1;
  }
}

/* ═══ Adaptabilidad Compacta para que Todo Quepa en Pantalla ═══ */
@media (max-width: 768px) {
  .roulette-table-felt {
    padding: 2px;
  }
  .felt-border {
    min-width: 0 !important;
    width: 100% !important;
    padding: 6px 4px !important;
  }
  .grid-table {
    margin-bottom: 3px;
  }
  .spot-number {
    height: 28px !important;
  }
  .number-label {
    font-size: 0.52rem !important;
  }
  .spot-zero {
    width: 32px !important;
  }
  .zero-text {
    font-size: 0.75rem !important;
  }
  .columns-col {
    width: 32px !important;
  }
  .spot-col {
    height: 28px !important;
  }
  .col-label {
    font-size: 0.36rem !important;
  }
  .spacer-zero {
    width: 32px !important;
  }
  .spacer-col {
    width: 32px !important;
  }
  .dozens-row {
    margin-bottom: 3px;
  }
  .spot-dozen {
    height: 26px !important;
  }
  .spot-simple {
    height: 26px !important;
  }
  .outside-title {
    font-size: 0.4rem !important;
  }
  .outside-sub {
    display: none !important;
  }
  .color-diamond {
    font-size: 0.4rem !important;
    height: 80% !important;
  }
  .chip-token {
    width: 18px !important;
    height: 18px !important;
    font-size: 0.35rem !important;
  }
}
</style>
