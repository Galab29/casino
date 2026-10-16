<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { usePokerStore } from '~/stores/poker'
import { useSoundEngine } from '~/composables/useSoundEngine'
import PokerChip3D from '~/components/poker/PokerChip3D.vue'

const store = usePokerStore()
const sounds = useSoundEngine()

// Raise amount state
const raiseSliderValue = ref<number>(store.minRaiseAmount)

function resetSlider() {
  raiseSliderValue.value = Math.min(store.minRaiseAmount, store.maxRaiseAmount)
}

// Keep slider updated when min/max bet changes
watch(
  () => [store.minRaiseAmount, store.maxRaiseAmount],
  () => resetSlider(),
  { immediate: true },
)

const isRaiseOpen = ref<boolean>(false)

// Close raise panel whenever it's no longer the player's turn
watch(
  () => store.currentTurn,
  (turn) => {
    if (turn !== 'player') isRaiseOpen.value = false
  },
)

function toggleRaise() {
  if (!isRaiseOpen.value) resetSlider()
  isRaiseOpen.value = !isRaiseOpen.value
}

const isCallAllIn = computed(
  () => !store.canCheck && store.callAmount >= store.playerChips,
)

const canDeal = computed(() => store.playerChips >= store.bigBlind)

// ─── Estilo Blackjack: Selector de fichas interactivas ───
const chipOptions = [10, 25, 50, 100, 250, 500]

function addChips(amount: number) {
  sounds.playChipStack()
  const next = raiseSliderValue.value + amount
  raiseSliderValue.value = Math.min(Math.max(next, store.minRaiseAmount), store.maxRaiseAmount)
}

function clearBet() {
  sounds.playButtonClick()
  raiseSliderValue.value = store.minRaiseAmount
}

// Presets
function setPreset(multiplier: number | 'half_pot' | 'pot' | 'allin') {
  if (multiplier === 'half_pot') {
    const half = Math.round(store.pot * 0.5 / 10) * 10
    const target = store.currentBet + Math.max(half, store.minRaise)
    raiseSliderValue.value = Math.min(Math.max(target, store.minRaiseAmount), store.maxRaiseAmount)
  } else if (multiplier === 'pot') {
    const target = store.currentBet + store.pot
    raiseSliderValue.value = Math.min(Math.max(target, store.minRaiseAmount), store.maxRaiseAmount)
  } else if (multiplier === 'allin') {
    raiseSliderValue.value = store.maxRaiseAmount
  } else if (typeof multiplier === 'number') {
    const target = Math.max(store.currentBet * multiplier, store.minRaiseAmount)
    raiseSliderValue.value = Math.min(target, store.maxRaiseAmount)
  }
}

function handleFold() {
  sounds.playCardSlide()
  store.playerFold()
}

function handleCheck() {
  sounds.playButtonClick()
  store.playerCheck()
}

function handleCall() {
  sounds.playChipStack()
  store.playerCall()
}

function handleConfirmRaise() {
  sounds.playChipStack()
  store.playerBetOrRaise(raiseSliderValue.value)
  isRaiseOpen.value = false
}

function handleAllIn() {
  sounds.playChipStack()
  store.playerBetOrRaise(store.maxRaiseAmount)
  isRaiseOpen.value = false
}

function handleStartHand() {
  if (!canDeal.value) return
  sounds.playShuffle()
  store.startNewHand()
}
</script>

<template>
  <div class="poker-controls-container">
    <!-- ═══ IDLE / SHOWDOWN STATE: DEAL BUTTON ═══ -->
    <div
      v-if="store.street === 'idle' || store.street === 'showdown'"
      class="d-flex flex-column align-center ga-3"
    >
      <!-- Blind Stake Selector between hands -->
      <div class="stakes-selector d-flex align-center ga-2">
        <span class="stakes-label">Ciegas:</span>
        <button
          v-for="sb in [10, 25, 50, 100]"
          :key="sb"
          class="stake-pill"
          :class="{ 'stake-pill--active': store.smallBlind === sb }"
          @click="store.setStakes(sb)"
        >
          {{ sb }} / {{ sb * 2 }}
        </button>
      </div>

      <!-- Action Button -->
      <v-btn
        id="poker-deal-btn"
        color="amber-darken-2"
        size="large"
        rounded="pill"
        elevation="8"
        class="deal-btn font-weight-black px-8 py-3"
        prepend-icon="mdi-cards-playing-outline"
        :disabled="!canDeal"
        @click="handleStartHand"
      >
        {{ store.street === 'idle' ? 'Repartir Mano' : 'Siguiente Mano' }}
      </v-btn>
      <div v-if="!canDeal" class="no-chips-hint">
        Necesitas al menos {{ store.bigBlind }} fichas para la ciega grande.
      </div>
    </div>

    <!-- ═══ ACTIVE ROUND CONTROLS ═══ -->
    <div v-else class="active-controls-wrap">
      <!-- Waiting for dealer notice -->
      <div v-if="store.currentTurn === 'dealer'" class="dealer-wait-banner d-flex align-center justify-center ga-2">
        <v-progress-circular indeterminate size="18" width="2" color="amber" />
        <span>El Dealer está decidiendo su jugada...</span>
      </div>

      <!-- All-in run-out (no more decisions) -->
      <div v-else-if="store.currentTurn !== 'player'" class="dealer-wait-banner d-flex align-center justify-center ga-2">
        <v-icon color="amber" size="18">mdi-cards-playing</v-icon>
        <span>All-in · Repartiendo el resto de la mesa...</span>
      </div>

      <!-- Player action buttons -->
      <div v-else class="d-flex flex-column align-center ga-2">
        <!-- Raise Options Drawer/Row -->
        <!-- Raise Options Drawer (Estilo Blackjack con selector de fichas) -->
        <transition name="expand">
          <div v-if="isRaiseOpen && store.canFullRaise" class="raise-panel mb-2">
            <!-- Amount Display (Estilo Blackjack) -->
            <div class="bet-display-header d-flex align-center justify-space-between mb-2">
              <span class="raise-title">{{ store.currentBet === 0 ? 'Apostar:' : 'Subir a:' }}</span>
              <div class="bet-display-pill d-flex align-center ga-2">
                <PokerChip3D :amount="raiseSliderValue" size="sm" :stacked="raiseSliderValue >= 50" />
                <span class="raise-val">{{ raiseSliderValue.toLocaleString() }}</span>
                <span class="raise-unit">fichas</span>
              </div>
            </div>

            <!-- Fichas Interactivas 8-Bit -->
            <div class="chip-rack d-flex justify-center flex-wrap ga-2 mb-3">
              <button
                v-for="chip in chipOptions"
                :key="chip"
                class="rack-chip-btn"
                :disabled="raiseSliderValue + chip > store.maxRaiseAmount"
                @click="addChips(chip)"
              >
                <PixelChip :value="chip" size="sm" :disabled="raiseSliderValue + chip > store.maxRaiseAmount" />
                <span class="chip-add-text">+{{ chip }}</span>
              </button>
            </div>

            <!-- Presets Rápidos -->
            <div class="d-flex ga-1 justify-center mb-2 flex-wrap align-center">
              <button class="preset-btn" @click="clearBet">Mínimo</button>
              <button class="preset-btn" @click="setPreset('half_pot')">1/2 Bote</button>
              <button class="preset-btn" @click="setPreset('pot')">Bote</button>
              <button class="preset-btn preset-btn--allin d-inline-flex align-center ga-1" @click="setPreset('allin')">
                <PixelChip value="all-in" size="xs" />
                <span>All-in</span>
              </button>
            </div>

            <!-- Slider para ajuste fino -->
            <div class="slider-row d-flex align-center ga-2">
              <span class="slider-bound">{{ store.minRaiseAmount }}</span>
              <input
                v-model.number="raiseSliderValue"
                type="range"
                :min="store.minRaiseAmount"
                :max="store.maxRaiseAmount"
                step="5"
                class="poker-slider"
              />
              <span class="slider-bound">{{ store.maxRaiseAmount }}</span>
            </div>

            <!-- Confirm / Cancel buttons -->
            <div class="d-flex ga-2 justify-end mt-2">
              <v-btn size="small" variant="text" color="grey-lighten-1" @click="isRaiseOpen = false">
                Cancelar
              </v-btn>
              <v-btn
                size="small"
                color="amber-darken-2"
                rounded="pill"
                class="font-weight-bold px-4"
                @click="handleConfirmRaise"
              >
                Confirmar {{ store.currentBet === 0 ? 'Apuesta' : 'Subida' }} ({{ raiseSliderValue }})
              </v-btn>
            </div>
          </div>
        </transition>

        <!-- Main Button Bar -->
        <div class="actions-button-bar d-flex align-center ga-2">
          <!-- Fold (Retirarse) -->
          <v-btn
            id="poker-fold-btn"
            color="red-darken-3"
            variant="tonal"
            size="large"
            rounded="pill"
            prepend-icon="mdi-close-circle-outline"
            class="action-btn font-weight-bold"
            @click="handleFold"
          >
            Retirarse (Fold)
          </v-btn>

          <!-- Check (Pasar) or Call (Igualar) -->
          <v-btn
            v-if="store.canCheck"
            id="poker-check-btn"
            color="light-blue-darken-2"
            variant="elevated"
            size="large"
            rounded="pill"
            prepend-icon="mdi-hand-okay"
            class="action-btn font-weight-bold"
            @click="handleCheck"
          >
            Pasar (Check)
          </v-btn>

          <v-btn
            v-else
            id="poker-call-btn"
            color="teal-darken-2"
            variant="elevated"
            size="large"
            rounded="pill"
            prepend-icon="mdi-check-circle-outline"
            class="action-btn font-weight-bold"
            @click="handleCall"
          >
            {{ isCallAllIn ? `All-in ${store.callAmount}` : `Igualar ${store.callAmount}` }}
          </v-btn>

          <!-- Raise (Subir / Apostar) -->
          <v-btn
            v-if="store.canFullRaise"
            id="poker-raise-btn"
            color="amber-darken-3"
            variant="elevated"
            size="large"
            rounded="pill"
            prepend-icon="mdi-trending-up"
            class="action-btn font-weight-bold"
            :class="{ 'btn-raise-active': isRaiseOpen }"
            @click="toggleRaise"
          >
            {{ store.currentBet === 0 ? 'Apostar' : 'Subir' }}
          </v-btn>

          <!-- All In Quick Button if not enough chips for a full raise -->
          <v-btn
            v-else-if="store.canRaise"
            id="poker-allin-btn"
            color="deep-purple-darken-2"
            variant="elevated"
            size="large"
            rounded="pill"
            prepend-icon="mdi-flash"
            class="action-btn font-weight-black"
            @click="handleAllIn"
          >
            ¡All-In! ({{ store.maxRaiseAmount }})
          </v-btn>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.poker-controls-container {
  width: 100%;
  max-width: 640px;
  margin: 12px auto 24px auto;
  padding: 0 8px 16px 8px;
  display: flex;
  justify-content: center;
}

/* Stakes Selector */
.stakes-label {
  font-size: 0.78rem;
  color: #cfd8dc;
  font-weight: 700;
  text-transform: uppercase;
}

.stake-pill {
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 215, 0, 0.3);
  color: #cfd8dc;
  font-size: 0.75rem;
  font-weight: 800;
  padding: 3px 10px;
  border-radius: 999px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.stake-pill:hover {
  background: rgba(255, 215, 0, 0.2);
  color: #ffd54f;
}

.stake-pill--active {
  background: linear-gradient(135deg, #ffd54f, #ffb300);
  color: #111;
  border-color: #ffd54f;
  box-shadow: 0 0 10px rgba(255, 213, 79, 0.4);
}

/* Deal Button */
.deal-btn {
  font-family: 'Press Start 2P', monospace !important;
  font-size: 0.72rem !important;
  letter-spacing: -0.5px;
  background: var(--pixel-gold) !important;
  color: #000 !important;
  border: 2px solid #000 !important;
  box-shadow: 0 4px 0 #000 !important;
  border-radius: 4px !important;
  transition: all 0.1s ease;
}

.deal-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 0 #000 !important;
}

/* Active Controls */
.active-controls-wrap {
  width: 100%;
}

.dealer-wait-banner {
  background: #14141d;
  border: 2px solid #000;
  box-shadow: 0 3px 0 #000;
  border-radius: 4px;
  padding: 8px 18px;
  font-family: 'Press Start 2P', monospace !important;
  font-size: 0.62rem;
  color: #ffd54f;
}

.no-chips-hint {
  font-family: 'Press Start 2P', monospace !important;
  font-size: 0.55rem;
  color: #ef9a9a;
  font-weight: 700;
}

.actions-button-bar {
  flex-wrap: wrap;
  justify-content: center;
}

.action-btn {
  font-family: 'Press Start 2P', monospace !important;
  letter-spacing: -0.5px;
  font-size: 0.65rem !important;
  min-width: 110px;
  border: 2px solid #000 !important;
  box-shadow: 0 4px 0 #000 !important;
  border-radius: 4px !important;
  transition: all 0.1s ease;
}

.action-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 0 #000 !important;
}

.action-btn:active {
  transform: translateY(3px) !important;
  box-shadow: 0 1px 0 #000 !important;
}

.btn-raise-active {
  box-shadow: 0 0 15px #ffd54f, 0 4px 0 #000 !important;
}

/* Raise Panel */
.raise-panel {
  width: 100%;
  background: #14141d;
  border: 3px solid #000;
  border-radius: 6px;
  padding: 10px 16px;
  box-shadow: 0 6px 0 #000;
}

.bet-display-header {
  border-bottom: 1px solid rgba(255, 215, 0, 0.2);
  padding-bottom: 6px;
}

.bet-display-pill {
  background: #0d0d14;
  border: 2px solid #000;
  border-radius: 4px;
  padding: 4px 12px;
  box-shadow: 0 2px 0 #000;
}

.raise-title {
  font-family: 'Press Start 2P', monospace !important;
  font-size: 0.55rem;
  color: #a1a1aa;
  text-transform: uppercase;
}

.raise-val {
  font-family: 'Press Start 2P', monospace !important;
  font-size: 0.85rem !important;
  font-weight: 700;
  color: #ffd54f;
  text-shadow: 1px 1px 0 #000;
}

.raise-unit {
  font-size: 0.65rem;
  color: #cfd8dc;
  text-transform: uppercase;
}

/* Chip Rack (Estilo Blackjack) */
.chip-rack {
  padding: 4px 0;
}

.rack-chip-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 215, 0, 0.35);
  border-radius: 999px;
  padding: 3px 10px 3px 4px;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

.rack-chip-btn:hover:not(:disabled) {
  background: rgba(255, 213, 79, 0.2);
  border-color: #ffd54f;
  transform: translateY(-3px) scale(1.05);
  box-shadow: 0 4px 12px rgba(255, 213, 79, 0.3);
}

.rack-chip-btn:active:not(:disabled) {
  transform: translateY(0) scale(0.98);
}

.rack-chip-btn:disabled {
  opacity: 0.35;
  cursor: not-allowed;
  filter: grayscale(0.8);
}

.chip-add-text {
  font-family: 'Cinzel', serif;
  font-size: 0.76rem;
  font-weight: 900;
  color: #ffd54f;
}

.preset-btn {
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 215, 0, 0.3);
  color: #cfd8dc;
  font-size: 0.7rem;
  font-weight: 800;
  padding: 2px 8px;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.preset-btn:hover {
  background: rgba(255, 213, 79, 0.25);
  color: #ffd54f;
}

.preset-btn--allin {
  border-color: #ef5350;
  color: #ef5350;
}

.preset-btn--allin:hover {
  background: rgba(239, 83, 80, 0.3);
  color: #fff;
}

.slider-bound {
  font-size: 0.7rem;
  color: #90a4ae;
  font-weight: 700;
}

.poker-slider {
  flex: 1;
  accent-color: #ffd54f;
  cursor: pointer;
}

/* Animations */
.expand-enter-active,
.expand-leave-active {
  transition: all 0.25s ease;
}
.expand-enter-from,
.expand-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}
</style>
