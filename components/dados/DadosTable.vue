<script setup lang="ts">
import { computed } from 'vue'
import type { DadosBetType, CrapsPhase } from '~/types/dados'
import { DADOS_BET_DEFINITIONS } from '~/constants/dados'

interface Props {
  bets: Record<DadosBetType, number>
  point: number | null
  phase: CrapsPhase
  isRolling: boolean
  selectedChip: number
}

const props = defineProps<Props>()

const emit = defineEmits<{
  (e: 'place-bet', type: DadosBetType): void
}>()

function handleClick(type: DadosBetType) {
  if (props.isRolling) return
  emit('place-bet', type)
}

function formatChips(val: number): string {
  if (val >= 1000) return `${(val / 1000).toFixed(val % 1000 === 0 ? 0 : 1)}k`
  return String(val)
}

// Números de Sitio / Place Numbers
const placeNumbers = [
  { num: 4, type: 'place_4' as DadosBetType, payout: '9:5' },
  { num: 5, type: 'place_5' as DadosBetType, payout: '7:5' },
  { num: 6, type: 'place_6' as DadosBetType, payout: '7:6' },
  { num: 8, type: 'place_8' as DadosBetType, payout: '7:6' },
  { num: 9, type: 'place_9' as DadosBetType, payout: '7:5' },
  { num: 10, type: 'place_10' as DadosBetType, payout: '9:5' },
]

// Hardways
const hardwaysList = [
  { type: 'hard_4' as DadosBetType, label: 'HARD 4', dice: [2, 2], payout: '7:1' },
  { type: 'hard_6' as DadosBetType, label: 'HARD 6', dice: [3, 3], payout: '9:1' },
  { type: 'hard_8' as DadosBetType, label: 'HARD 8', dice: [4, 4], payout: '9:1' },
  { type: 'hard_10' as DadosBetType, label: 'HARD 10', dice: [5, 5], payout: '7:1' },
]

// Proposition One-Roll Bets
const propBets = [
  { type: 'craps_2' as DadosBetType, label: 'SNAKE EYES', sub: '1 - 1', payout: '30:1', accent: '#ffd54f' },
  { type: 'craps_12' as DadosBetType, label: 'BOXCARS', sub: '6 - 6', payout: '30:1', accent: '#ffd54f' },
  { type: 'craps_3' as DadosBetType, label: 'ACE-DEUCE', sub: '1 - 2', payout: '15:1', accent: '#81c784' },
  { type: 'eleven' as DadosBetType, label: 'YO-ELEVEN', sub: '5 - 6', payout: '15:1', accent: '#81c784' },
  { type: 'any_craps' as DadosBetType, label: 'ANY CRAPS', sub: '2, 3 o 12', payout: '7:1', accent: '#ffb74d' },
  { type: 'any_7' as DadosBetType, label: 'ANY 7', sub: 'Cualquier 7', payout: '4:1', accent: '#ef5350' },
]
</script>

<template>
  <div class="craps-table-layout">
    <div class="felt-surface">
      <!-- Layout Principal en Dos Columnas: Zona de Juego Principal + Proposiciones Derecha -->
      <div class="table-grid">
        <!-- ── COLUMNA IZQUIERDA: LÍNEA, SITIO Y CAMPO ────────────────────── -->
        <div class="main-playing-area">
          <!-- Fila Superior: Números de Sitio / Place Numbers (4, 5, 6, 8, 9, 10) -->
          <div class="place-numbers-row">
            <div
              v-for="item in placeNumbers"
              :key="item.type"
              class="place-box"
              :class="{
                'place-box--active-point': point === item.num,
                'place-box--has-bet': (bets[item.type] || 0) > 0,
              }"
              @click="handleClick(item.type)"
            >
              <div class="place-puck-indicator" v-if="point === item.num">
                <span class="puck-tag">PUNTO</span>
              </div>
              <div class="place-number-val">{{ item.num }}</div>
              <div class="place-payout">{{ item.payout }}</div>
              <div class="place-label">SITIO</div>

              <!-- Ficha colocada -->
              <div v-if="(bets[item.type] || 0) > 0" class="bet-chip-badge">
                <v-icon size="13" color="amber" class="mr-1">mdi-poker-chip</v-icon>
                <span>{{ formatChips(bets[item.type]) }}</span>
              </div>
            </div>
          </div>

          <!-- Fila Central: EL CAMPO (FIELD BET) -->
          <div
            class="field-bet-box"
            :class="{ 'field-bet-box--has-bet': (bets.field || 0) > 0 }"
            @click="handleClick('field')"
          >
            <div class="field-header">
              <span class="field-title">F I E L D</span>
              <span class="field-subtitle">PAGA 1 A 1 · 1 TIRO</span>
            </div>

            <div class="field-numbers-row">
              <div class="field-bubble field-bubble--double">
                <span class="bubble-num">2</span>
                <span class="bubble-tag">DOBLE</span>
              </div>
              <div class="field-bubble"><span class="bubble-num">3</span></div>
              <div class="field-bubble"><span class="bubble-num">4</span></div>
              <div class="field-bubble"><span class="bubble-num">9</span></div>
              <div class="field-bubble"><span class="bubble-num">10</span></div>
              <div class="field-bubble"><span class="bubble-num">11</span></div>
              <div class="field-bubble field-bubble--triple">
                <span class="bubble-num">12</span>
                <span class="bubble-tag">TRIPLE</span>
              </div>
            </div>

            <!-- Ficha en Campo -->
            <div v-if="(bets.field || 0) > 0" class="bet-chip-badge bet-chip-badge--center">
              <v-icon size="14" color="amber" class="mr-1">mdi-poker-chip</v-icon>
              <span>{{ formatChips(bets.field) }}</span>
            </div>
          </div>

          <!-- Fila de Rango Intuitivo: UNDER 7 vs OVER 7 -->
          <div class="ranges-row">
            <div
              class="range-box range-box--under"
              :class="{ 'range-box--has-bet': (bets.under_7 || 0) > 0 }"
              @click="handleClick('under_7')"
            >
              <div class="range-title">BAJO 7</div>
              <div class="range-sub">SUMA 2 AL 6 (1:1)</div>
              <div v-if="(bets.under_7 || 0) > 0" class="bet-chip-badge">
                <v-icon size="13" color="amber" class="mr-1">mdi-poker-chip</v-icon>
                <span>{{ formatChips(bets.under_7) }}</span>
              </div>
            </div>

            <div
              class="range-box range-box--over"
              :class="{ 'range-box--has-bet': (bets.over_7 || 0) > 0 }"
              @click="handleClick('over_7')"
            >
              <div class="range-title">ALTO 7</div>
              <div class="range-sub">SUMA 8 AL 12 (1:1)</div>
              <div v-if="(bets.over_7 || 0) > 0" class="bet-chip-badge">
                <v-icon size="13" color="amber" class="mr-1">mdi-poker-chip</v-icon>
                <span>{{ formatChips(bets.over_7) }}</span>
              </div>
            </div>
          </div>

          <!-- Fila Inferior: BARRA DE NO PASE (DON'T PASS) -->
          <div
            class="dont-pass-box"
            :class="{
              'dont-pass-box--has-bet': (bets.dont_pass || 0) > 0,
              'line-box--disabled': phase === 'point' && (bets.dont_pass || 0) === 0,
            }"
            @click="handleClick('dont_pass')"
          >
            <div class="line-header">
              <span class="line-title">DON'T PASS BAR</span>
              <span class="line-payout">1:1 (BAR 12 EMPATE)</span>
            </div>
            <div class="line-desc">
              <span v-if="phase === 'come_out'">Gana con 2 o 3, 12 Push | Pierde con 7 u 11</span>
              <span v-else class="text-amber">ACTIVA: Gana si sale 7 antes del punto</span>
            </div>
            <div v-if="(bets.dont_pass || 0) > 0" class="bet-chip-badge">
              <v-icon size="14" color="amber" class="mr-1">mdi-poker-chip</v-icon>
              <span>{{ formatChips(bets.dont_pass) }}</span>
            </div>
          </div>

          <!-- Fila Inferior: LÍNEA DE PASE (PASS LINE) -->
          <div
            class="pass-line-box"
            :class="{
              'pass-line-box--has-bet': (bets.pass_line || 0) > 0,
              'line-box--disabled': phase === 'point' && (bets.pass_line || 0) === 0,
            }"
            @click="handleClick('pass_line')"
          >
            <div class="line-header">
              <span class="line-title">PASS LINE</span>
              <span class="line-payout">1:1</span>
            </div>
            <div class="line-desc">
              <span v-if="phase === 'come_out'">7 u 11 Gana de Inmediato | 2, 3 o 12 Pierde (Craps)</span>
              <span v-else class="text-amber">ACTIVA: Gana si sale el punto {{ point }} antes de un 7</span>
            </div>
            <div v-if="(bets.pass_line || 0) > 0" class="bet-chip-badge">
              <v-icon size="14" color="amber" class="mr-1">mdi-poker-chip</v-icon>
              <span>{{ formatChips(bets.pass_line) }}</span>
            </div>
          </div>
        </div>

        <!-- ── COLUMNA DERECHA: PROPOSICIONES & HARDWAYS ────────────────── -->
        <div class="center-props-area">
          <div class="props-title-bar">
            <span>PROPOSICIONES & HARDWAYS</span>
          </div>

          <!-- Bloque de Hardways (Lances Difíciles) -->
          <div class="hardways-grid">
            <div
              v-for="hw in hardwaysList"
              :key="hw.type"
              class="hardway-item"
              :class="{ 'hardway-item--has-bet': (bets[hw.type] || 0) > 0 }"
              @click="handleClick(hw.type)"
            >
              <div class="hw-dice-pair">
                <span class="mini-die">{{ hw.dice[0] }}</span>
                <span class="mini-die">{{ hw.dice[1] }}</span>
              </div>
              <div class="hw-label">{{ hw.label }}</div>
              <div class="hw-payout">{{ hw.payout }}</div>
              <div v-if="(bets[hw.type] || 0) > 0" class="bet-chip-badge bet-chip-badge--mini">
                <v-icon size="11" color="amber">mdi-poker-chip</v-icon>
                <span>{{ formatChips(bets[hw.type]) }}</span>
              </div>
            </div>
          </div>

          <!-- Bloque de Apuestas de 1 Tirada (Proposiciones) -->
          <div class="prop-bets-grid">
            <div
              v-for="p in propBets"
              :key="p.type"
              class="prop-item"
              :class="{ 'prop-item--has-bet': (bets[p.type] || 0) > 0 }"
              @click="handleClick(p.type)"
            >
              <div class="prop-label" :style="{ color: p.accent }">{{ p.label }}</div>
              <div class="prop-sub">{{ p.sub }}</div>
              <div class="prop-payout-pill">{{ p.payout }}</div>
              <div v-if="(bets[p.type] || 0) > 0" class="bet-chip-badge bet-chip-badge--mini">
                <v-icon size="11" color="amber">mdi-poker-chip</v-icon>
                <span>{{ formatChips(bets[p.type]) }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.craps-table-layout {
  width: 100%;
  border-radius: 20px;
  background: #0f3d1e;
  border: 4px solid #b8860b;
  box-shadow:
    0 12px 30px rgba(0, 0, 0, 0.7),
    inset 0 0 30px rgba(0, 0, 0, 0.8),
    0 0 0 2px #d4af37;
  overflow: hidden;
  user-select: none;
}

.felt-surface {
  padding: 18px;
  background:
    radial-gradient(ellipse at 50% 50%, #175e2f 0%, #0c3816 75%, #06230e 100%);
  background-size: cover;
}

.table-grid {
  display: grid;
  grid-template-columns: 1fr 300px;
  gap: 16px;
}

@media (max-width: 960px) {
  .table-grid {
    grid-template-columns: 1fr;
  }
}

/* ─── Columna Izquierda ───────────────────────────────────── */
.main-playing-area {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

/* Place Numbers (4, 5, 6, 8, 9, 10) */
.place-numbers-row {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 8px;
}

.place-box {
  background: rgba(0, 0, 0, 0.35);
  border: 2px solid #ffd54f;
  border-radius: 12px;
  padding: 10px 4px;
  text-align: center;
  position: relative;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.25, 0.8, 0.25, 1);
  min-height: 86px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.place-box:hover {
  background: rgba(255, 213, 79, 0.15);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(255, 213, 79, 0.3);
}

.place-box--active-point {
  border-color: #ffffff;
  background: radial-gradient(circle, rgba(255, 255, 255, 0.25) 0%, rgba(0, 0, 0, 0.4) 100%);
  box-shadow: 0 0 16px rgba(255, 255, 255, 0.7);
}

.place-puck-indicator {
  position: absolute;
  top: -8px;
  background: #ffffff;
  color: #111;
  padding: 1px 6px;
  border-radius: 10px;
  font-size: 0.62rem;
  font-weight: 900;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.5);
}

.place-number-val {
  font-family: 'Cinzel', serif;
  font-size: 1.6rem;
  font-weight: 900;
  color: #ffd54f;
  line-height: 1;
}

.place-payout {
  font-size: 0.75rem;
  font-weight: 800;
  color: #ffffff;
  opacity: 0.9;
  margin-top: 3px;
}

.place-label {
  font-size: 0.65rem;
  font-weight: 700;
  color: rgba(255, 255, 255, 0.6);
  letter-spacing: 1px;
}

/* El Campo (Field Bet) */
.field-bet-box {
  background: rgba(0, 0, 0, 0.35);
  border: 2px solid #ffd54f;
  border-radius: 14px;
  padding: 12px 14px;
  cursor: pointer;
  position: relative;
  transition: all 0.2s ease;
}

.field-bet-box:hover {
  background: rgba(255, 213, 79, 0.12);
  box-shadow: 0 4px 14px rgba(255, 213, 79, 0.25);
}

.field-header {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  margin-bottom: 8px;
}

.field-title {
  font-family: 'Cinzel', serif;
  font-size: 1.25rem;
  font-weight: 900;
  letter-spacing: 4px;
  color: #ffd54f;
}

.field-subtitle {
  font-size: 0.75rem;
  font-weight: 800;
  color: #ffffff;
  opacity: 0.8;
}

.field-numbers-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 6px;
}

.field-bubble {
  flex: 1;
  text-align: center;
  padding: 6px 2px;
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 10px;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.field-bubble--double {
  border-color: #42a5f5;
  background: rgba(33, 150, 243, 0.15);
}

.field-bubble--triple {
  border-color: #ef5350;
  background: rgba(239, 83, 80, 0.15);
}

.bubble-num {
  font-family: 'Cinzel', serif;
  font-size: 1.15rem;
  font-weight: 900;
  color: #ffffff;
}

.bubble-tag {
  font-size: 0.6rem;
  font-weight: 800;
  color: #ffd54f;
  margin-top: 1px;
}

/* Rangos Bajo / Alto */
.ranges-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}

.range-box {
  background: rgba(0, 0, 0, 0.3);
  border: 1.5px solid rgba(255, 213, 79, 0.6);
  border-radius: 10px;
  padding: 8px 12px;
  text-align: center;
  cursor: pointer;
  position: relative;
  transition: all 0.2s ease;
}

.range-box:hover {
  background: rgba(255, 213, 79, 0.12);
}

.range-title {
  font-family: 'Cinzel', serif;
  font-size: 0.95rem;
  font-weight: 800;
  color: #ffd54f;
}

.range-sub {
  font-size: 0.7rem;
  font-weight: 700;
  color: rgba(255, 255, 255, 0.8);
}

/* Líneas Pass Line & Don't Pass */
.dont-pass-box,
.pass-line-box {
  background: rgba(0, 0, 0, 0.4);
  border: 2px solid #ffd54f;
  border-radius: 12px;
  padding: 10px 16px;
  cursor: pointer;
  position: relative;
  transition: all 0.2s ease;
}

.dont-pass-box:hover,
.pass-line-box:hover {
  background: rgba(255, 213, 79, 0.15);
}

.pass-line-box {
  border-width: 2.5px;
  border-color: #ffd54f;
  background: rgba(0, 0, 0, 0.45);
}

.line-header {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
}

.line-title {
  font-family: 'Cinzel', serif;
  font-size: 1.15rem;
  font-weight: 900;
  letter-spacing: 2px;
  color: #ffd54f;
}

.line-payout {
  font-size: 0.75rem;
  font-weight: 800;
  color: #ffffff;
}

.line-desc {
  font-size: 0.72rem;
  color: rgba(255, 255, 255, 0.75);
  margin-top: 3px;
}

.line-box--disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

/* ─── Columna Derecha: Proposiciones ──────────────────────── */
.center-props-area {
  background: rgba(0, 0, 0, 0.4);
  border: 2px solid #b8860b;
  border-radius: 14px;
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.props-title-bar {
  text-align: center;
  font-family: 'Cinzel', serif;
  font-size: 0.8rem;
  font-weight: 800;
  letter-spacing: 1.5px;
  color: #ffd54f;
  border-bottom: 1px solid rgba(255, 213, 79, 0.3);
  padding-bottom: 6px;
}

/* Hardways Grid */
.hardways-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 6px;
}

.hardway-item {
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.18);
  border-radius: 8px;
  padding: 6px 4px;
  text-align: center;
  cursor: pointer;
  position: relative;
  transition: all 0.2s ease;
}

.hardway-item:hover {
  background: rgba(255, 213, 79, 0.15);
  border-color: #ffd54f;
}

.hw-dice-pair {
  display: flex;
  justify-content: center;
  gap: 4px;
  margin-bottom: 2px;
}

.mini-die {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 18px;
  height: 18px;
  border-radius: 4px;
  background: #c62828;
  color: #fff;
  font-size: 0.75rem;
  font-weight: 900;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.6);
}

.hw-label {
  font-size: 0.68rem;
  font-weight: 800;
  color: #ffffff;
}

.hw-payout {
  font-size: 0.65rem;
  font-weight: 700;
  color: #ffd54f;
}

/* Proposiciones Grid */
.prop-bets-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 6px;
}

.prop-item {
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 8px;
  padding: 6px 4px;
  text-align: center;
  cursor: pointer;
  position: relative;
  transition: all 0.2s ease;
}

.prop-item:hover {
  background: rgba(255, 213, 79, 0.15);
  border-color: #ffd54f;
}

.prop-label {
  font-family: 'Cinzel', serif;
  font-size: 0.7rem;
  font-weight: 900;
  letter-spacing: 0.5px;
}

.prop-sub {
  font-size: 0.62rem;
  color: rgba(255, 255, 255, 0.65);
}

.prop-payout-pill {
  font-size: 0.68rem;
  font-weight: 800;
  color: #ffffff;
  margin-top: 2px;
}

/* Fichas Sobre las Cajas de Apuesta */
.bet-chip-badge {
  position: absolute;
  bottom: 4px;
  right: 6px;
  background: #111;
  border: 1.5px solid #ffd54f;
  border-radius: 12px;
  padding: 1px 6px;
  display: flex;
  align-items: center;
  font-size: 0.72rem;
  font-weight: 900;
  color: #ffd54f;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.8);
  z-index: 3;
}

.bet-chip-badge--center {
  bottom: 6px;
  right: auto;
  left: 50%;
  transform: translateX(-50%);
}

.bet-chip-badge--mini {
  bottom: 2px;
  right: 2px;
  padding: 0 4px;
  font-size: 0.65rem;
}
</style>
