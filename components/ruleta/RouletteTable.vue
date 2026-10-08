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
  border-radius: 18px;
  padding: 14px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.6), inset 0 0 25px rgba(0, 0, 0, 0.8),
    0 0 0 2px rgba(255, 213, 79, 0.3);
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
  background: #1b5e20;
  border: 1.5px solid rgba(255, 213, 79, 0.6);
  border-top-left-radius: 12px;
  border-bottom-left-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  position: relative;
  transition: all 0.2s ease;
}

.zero-text {
  font-family: 'Cinzel', serif;
  font-size: 2rem;
  font-weight: 900;
  color: #fff;
  text-shadow: 0 2px 8px rgba(0, 0, 0, 0.7);
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
  background: linear-gradient(135deg, #c62828 0%, #b71c1c 100%);
}

.spot--black {
  background: linear-gradient(135deg, #212529 0%, #15181b 100%);
}

.number-label {
  font-family: 'Cinzel', serif;
  font-size: 1.25rem;
  font-weight: 800;
  color: #ffffff;
  text-shadow: 0 1px 4px rgba(0, 0, 0, 0.8);
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
  background: rgba(10, 50, 24, 0.8);
  border: 1.5px solid rgba(255, 213, 79, 0.5);
  border-left: none;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  position: relative;
  transition: all 0.2s ease;
}

.col-label {
  font-size: 0.8rem;
  font-weight: 700;
  color: #ffd54f;
  letter-spacing: 0.5px;
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
  background: rgba(13, 60, 30, 0.85);
  border: 1.5px solid rgba(255, 213, 79, 0.5);
  margin: 0 2px;
  border-radius: 6px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  position: relative;
  transition: all 0.2s ease;
}

.outside-title {
  font-family: 'Cinzel', serif;
  font-size: 0.95rem;
  font-weight: 800;
  color: #ffffff;
  letter-spacing: 1px;
}

.outside-sub {
  font-size: 0.65rem;
  color: #ffd54f;
  font-weight: 600;
}

/* ═══ Fila de Apuestas Simples (1:1) ═══ */
.outside-row {
  display: flex;
}

.spot-simple {
  flex: 1;
  height: 44px;
  background: rgba(13, 60, 30, 0.85);
  border: 1.5px solid rgba(255, 213, 79, 0.5);
  margin: 0 2px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  position: relative;
  transition: all 0.2s ease;
}

.color-diamond {
  width: 80%;
  height: 70%;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
  font-family: 'Cinzel', serif;
  font-size: 0.85rem;
  font-weight: 800;
  border: 1px solid rgba(255, 255, 255, 0.4);
}

.red-diamond {
  background: #c62828;
  color: #fff;
}

.black-diamond {
  background: #1e1e1e;
  color: #fff;
}

/* ═══ Efectos de interacción y hover ═══ */
.bet-spot:hover {
  filter: brightness(1.2);
  border-color: #ffe082 !important;
  box-shadow: inset 0 0 10px rgba(255, 213, 79, 0.4);
}

.spot--highlight {
  border-color: #ffd54f !important;
  box-shadow: inset 0 0 14px rgba(255, 213, 79, 0.85), 0 0 8px rgba(255, 213, 79, 0.6);
  filter: brightness(1.3);
  z-index: 2;
}

.spot--winner {
  animation: winningSpotPulse 1s ease-in-out infinite alternate !important;
  z-index: 5;
}

@keyframes winningSpotPulse {
  0% {
    box-shadow: 0 0 10px #ffd54f, inset 0 0 15px #ffd54f;
    border-color: #ffffff;
    filter: brightness(1.4);
  }
  100% {
    box-shadow: 0 0 25px #ffd54f, inset 0 0 25px #ffd54f;
    border-color: #ffe082;
    filter: brightness(1.8);
  }
}

/* ═══ Ficha 3D sobre la casilla ═══ */
.chip-token {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: radial-gradient(circle at 35% 35%, var(--chip-color), #000);
  border: 2px dashed rgba(255, 255, 255, 0.85);
  box-shadow: 0 3px 6px rgba(0, 0, 0, 0.8), 0 0 8px var(--chip-color);
  color: #fff;
  font-size: 0.62rem;
  font-weight: 900;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 3;
  pointer-events: none;
  animation: dropChip 0.18s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

@keyframes dropChip {
  0% {
    transform: translate(-50%, -80%) scale(1.4);
    opacity: 0.5;
  }
  100% {
    transform: translate(-50%, -50%) scale(1);
    opacity: 1;
  }
}
</style>
