<script setup lang="ts">
import { computed, ref } from 'vue'
import { useDeckStyle } from '~/composables/useDeckStyle'
import {
  BACK_THEMES,
  CARD_H,
  CARD_W,
  buildPixelSpritesheet,
  downloadCanvas,
  getPixelCardUrl,
  pixelSpecKey,
  renderPixelCardCanvas,
  type PixelBackTheme,
  type PixelCardSpec,
  type PixelRank,
  type PixelSuit,
} from '~/utils/pixelDeck'

definePageMeta({
  middleware: [
    () => navigateTo('/'),
  ],
})

useHead({
  title: 'Baraja 8-Bit Traditional · Royal Casino',
  meta: [
    {
      name: 'description',
      content: 'Galería de la baraja 8-Bit Traditional: 52 cartas, 2 Jokers y reverso en pixel art puro de 78×110 px. Inspecciona y descarga cada carta o el spritesheet completo.',
    },
  ],
})

// ─── Deck data ──────────────────────────────────────────────
type DeckGroup = PixelSuit | 'SPECIAL'

interface DeckEntry {
  id: string
  sortOrder: number
  group: DeckGroup
  isFace: boolean
  spec: PixelCardSpec
  title: string
}

const SUIT_INFO: Record<PixelSuit, { name: string; symbol: string }> = {
  S: { name: 'Picas', symbol: '♠' },
  H: { name: 'Corazones', symbol: '♥' },
  D: { name: 'Diamantes', symbol: '♦' },
  C: { name: 'Tréboles', symbol: '♣' },
}

const RANKS: { id: PixelRank; name: string }[] = [
  { id: 'A', name: 'As' },
  { id: '2', name: 'Dos' },
  { id: '3', name: 'Tres' },
  { id: '4', name: 'Cuatro' },
  { id: '5', name: 'Cinco' },
  { id: '6', name: 'Seis' },
  { id: '7', name: 'Siete' },
  { id: '8', name: 'Ocho' },
  { id: '9', name: 'Nueve' },
  { id: '10', name: 'Diez' },
  { id: 'J', name: 'Jota' },
  { id: 'Q', name: 'Reina' },
  { id: 'K', name: 'Rey' },
]

const backTheme = ref<PixelBackTheme>('navy')
const backSpec = computed<PixelCardSpec>(() => ({ type: 'BACK', theme: backTheme.value }))

function buildDeck(): DeckEntry[] {
  const deck: DeckEntry[] = []
  let order = 0
  for (const suit of Object.keys(SUIT_INFO) as PixelSuit[]) {
    for (const r of RANKS) {
      deck.push({
        id: `${r.id}_${suit}`,
        sortOrder: order++,
        group: suit,
        isFace: r.id === 'J' || r.id === 'Q' || r.id === 'K',
        spec: { type: 'STANDARD', rank: r.id, suit },
        title: `${r.name} de ${SUIT_INFO[suit].name} (${r.id}${SUIT_INFO[suit].symbol})`,
      })
    }
  }
  deck.push(
    { id: 'JOKER_RED', sortOrder: order++, group: 'SPECIAL', isFace: false, spec: { type: 'JOKER', color: 'red' }, title: 'Joker Rojo' },
    { id: 'JOKER_BLACK', sortOrder: order++, group: 'SPECIAL', isFace: false, spec: { type: 'JOKER', color: 'black' }, title: 'Joker Azul' },
    { id: 'CARD_BACK', sortOrder: order++, group: 'SPECIAL', isFace: false, spec: { type: 'BACK' }, title: 'Reverso Oficial' },
  )
  return deck
}

const deck = ref<DeckEntry[]>(buildDeck())

/** The back entry always follows the selected theme. */
function entrySpec(entry: DeckEntry): PixelCardSpec {
  return entry.spec.type === 'BACK' ? backSpec.value : entry.spec
}

// ─── Filters ────────────────────────────────────────────────
type Filter = 'ALL' | PixelSuit | 'FACES' | 'SPECIAL'
const filter = ref<Filter>('ALL')

const filterOptions: { value: Filter; label: string; icon?: string; symbol?: string; tone: string }[] = [
  { value: 'ALL', label: 'Todas', icon: 'mdi-cards-outline', tone: 'neutral' },
  { value: 'S', label: 'Picas', symbol: '♠', tone: 'neutral' },
  { value: 'H', label: 'Corazones', symbol: '♥', tone: 'red' },
  { value: 'D', label: 'Diamantes', symbol: '♦', tone: 'red' },
  { value: 'C', label: 'Tréboles', symbol: '♣', tone: 'neutral' },
  { value: 'FACES', label: 'Figuras', icon: 'mdi-crown', tone: 'gold' },
  { value: 'SPECIAL', label: 'Jokers y Reverso', icon: 'mdi-drama-masks', tone: 'purple' },
]

function matchesFilter(entry: DeckEntry, f: Filter) {
  if (f === 'ALL') return true
  if (f === 'FACES') return entry.isFace
  return entry.group === f
}

const filterCounts = computed(() =>
  Object.fromEntries(filterOptions.map(o => [o.value, deck.value.filter(e => matchesFilter(e, o.value)).length])),
)

const visibleCards = computed(() => deck.value.filter(e => matchesFilter(e, filter.value)))

// ─── View controls ──────────────────────────────────────────
const cardWidth = ref(170)
const allFlipped = ref(false)
const { isPixel, setStyle } = useDeckStyle()

const backThemeOptions = (Object.keys(BACK_THEMES) as PixelBackTheme[]).map(value => ({
  value,
  title: BACK_THEMES[value].label,
}))

// ─── Actions ────────────────────────────────────────────────
const toast = ref({ show: false, text: '' })
function notify(text: string) {
  toast.value = { show: true, text }
}

/** Fisher–Yates: uniform shuffle (sort with Math.random() - 0.5 is biased). */
function shuffleDeck() {
  const arr = [...deck.value]
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  deck.value = arr
  notify('¡Mazo barajado aleatoriamente!')
}

function sortDeck() {
  deck.value = [...deck.value].sort((a, b) => a.sortOrder - b.sortOrder)
  notify('Baraja ordenada por palo y valor')
}

function downloadSpritesheet() {
  const ordered = [...deck.value].sort((a, b) => a.sortOrder - b.sortOrder).map(entrySpec)
  downloadCanvas(buildPixelSpritesheet(ordered, 13, 3), 'baraja_8bit_traditional_spritesheet.png')
  notify(`Spritesheet completo (${ordered.length} cartas) descargado`)
}

// ─── Inspect dialog ─────────────────────────────────────────
const dialogOpen = ref(false)
const activeCard = ref<DeckEntry | null>(null)
const dialogShowingBack = ref(false)

const dialogSpec = computed<PixelCardSpec | null>(() => {
  if (!activeCard.value) return null
  return dialogShowingBack.value ? backSpec.value : entrySpec(activeCard.value)
})

function openCard(entry: DeckEntry) {
  activeCard.value = entry
  dialogShowingBack.value = false
  dialogOpen.value = true
}

function downloadActiveCard(scale = 8) {
  if (!dialogSpec.value || !activeCard.value) return
  const name = dialogShowingBack.value ? `reverso_${backTheme.value}` : pixelSpecKey(dialogSpec.value).toLowerCase()
  downloadCanvas(renderPixelCardCanvas(dialogSpec.value, scale), `carta_8bit_${name}.png`)
  notify(`${dialogShowingBack.value ? 'Reverso' : activeCard.value.title} descargado a ${CARD_W * scale}×${CARD_H * scale} px`)
}
</script>

<template>
  <div class="deck-page">
    <div class="deck-glow deck-glow--1" />
    <div class="deck-glow deck-glow--2" />

    <!-- ═══ Header & Controls ═══ -->
    <header class="deck-header">
      <div class="deck-header__inner">
        <div class="deck-header__top">
          <div class="d-flex align-center ga-3">
            <v-btn
              id="baraja-back-btn"
              icon="mdi-arrow-left"
              variant="tonal"
              color="amber-lighten-2"
              size="small"
              to="/"
              aria-label="Volver al lobby"
            />
            <div class="brand-badge">
              <span>♠</span>
            </div>
            <div>
              <h1 class="pixel-font deck-title">8-BIT TRADITIONAL DECK</h1>
              <p class="deck-subtitle">
                52 cartas + 2 Jokers + Reverso en pixel art puro ({{ CARD_W }}×{{ CARD_H }} px por carta)
              </p>
            </div>
          </div>

          <div class="d-flex flex-wrap align-center ga-2">
            <v-btn id="btn-shuffle" variant="tonal" size="small" rounded="lg" prepend-icon="mdi-shuffle-variant" @click="shuffleDeck">
              Barajar
            </v-btn>
            <v-btn id="btn-sort" variant="tonal" size="small" rounded="lg" prepend-icon="mdi-sort-numeric-ascending" @click="sortDeck">
              Ordenar
            </v-btn>
            <v-btn
              id="btn-flip"
              variant="tonal"
              size="small"
              rounded="lg"
              prepend-icon="mdi-rotate-3d-variant"
              @click="allFlipped = !allFlipped"
            >
              {{ allFlipped ? 'Mostrar frentes' : 'Voltear todas' }}
            </v-btn>
            <v-btn
              id="btn-spritesheet"
              color="amber-darken-1"
              variant="elevated"
              size="small"
              rounded="lg"
              prepend-icon="mdi-download"
              class="font-weight-bold"
              @click="downloadSpritesheet"
            >
              Spritesheet PNG
            </v-btn>
          </div>
        </div>

        <div class="deck-header__bottom">
          <div id="suit-filters" class="d-flex flex-wrap align-center ga-2">
            <button
              v-for="opt in filterOptions"
              :id="`filter-${opt.value.toLowerCase()}`"
              :key="opt.value"
              type="button"
              class="filter-chip"
              :class="[`filter-chip--${opt.tone}`, { 'is-active': filter === opt.value }]"
              @click="filter = opt.value"
            >
              <v-icon v-if="opt.icon" size="14">{{ opt.icon }}</v-icon>
              <span v-else class="filter-chip__symbol">{{ opt.symbol }}</span>
              {{ opt.label }}
              <span class="filter-chip__count">{{ filterCounts[opt.value] }}</span>
            </button>
          </div>

          <div class="d-flex flex-wrap align-center ga-4">
            <v-select
              id="back-theme-select"
              v-model="backTheme"
              :items="backThemeOptions"
              label="Reverso"
              density="compact"
              variant="outlined"
              hide-details
              class="theme-select"
              color="amber"
            >
              <template #prepend-inner>
                <span class="theme-swatch" :style="{ background: BACK_THEMES[backTheme].base }" />
              </template>
            </v-select>

            <div class="d-flex align-center ga-2 size-control">
              <v-icon size="16" color="grey-lighten-1">mdi-magnify-minus-outline</v-icon>
              <v-slider
                id="size-slider"
                v-model="cardWidth"
                :min="110"
                :max="280"
                :step="1"
                color="amber"
                track-color="grey-darken-2"
                hide-details
                density="compact"
                aria-label="Tamaño de las cartas"
              />
              <v-icon size="16" color="grey-lighten-1">mdi-magnify-plus-outline</v-icon>
            </div>

            <v-switch
              id="deck-style-switch"
              :model-value="isPixel"
              color="amber"
              density="compact"
              hide-details
              inset
              :label="isPixel ? 'Usar en las mesas: Sí' : 'Usar en las mesas: No'"
              class="style-switch"
              @update:model-value="v => setStyle(v ? 'pixel' : 'classic')"
            />
          </div>
        </div>
      </div>
    </header>

    <!-- ═══ Card Grid ═══ -->
    <main class="deck-main" :style="{ '--card-width': `${cardWidth}px` }">
      <TransitionGroup id="cards-grid" tag="div" name="deal" class="cards-grid">
        <button
          v-for="(entry, i) in visibleCards"
          :id="`card-${entry.id.toLowerCase()}`"
          :key="entry.id"
          type="button"
          class="pixel-playing-card"
          :class="{ 'is-flipped': allFlipped }"
          :style="{ '--deal-delay': `${Math.min(i, 30) * 12}ms` }"
          :title="`${entry.title} · Clic para ampliar o descargar`"
          :aria-label="entry.title"
          @click="openCard(entry)"
        >
          <div class="pixel-card-inner">
            <div class="pixel-card-face">
              <img :src="getPixelCardUrl(entrySpec(entry))" :alt="entry.title" draggable="false" />
            </div>
            <div class="pixel-card-face pixel-card-face--back">
              <img :src="getPixelCardUrl(backSpec)" alt="Reverso 8-Bit" draggable="false" />
            </div>
          </div>
        </button>
      </TransitionGroup>
    </main>

    <footer class="deck-footer">
      <v-icon size="14" class="mr-1">mdi-information-outline</v-icon>
      Haz clic en cualquier carta para inspeccionar sus píxeles o descargarla en alta resolución.
    </footer>

    <!-- ═══ Inspect Dialog ═══ -->
    <v-dialog v-model="dialogOpen" max-width="440">
      <div v-if="activeCard && dialogSpec" class="inspect-panel">
        <v-btn
          id="close-modal"
          icon="mdi-close"
          size="small"
          variant="tonal"
          class="inspect-close"
          aria-label="Cerrar"
          @click="dialogOpen = false"
        />
        <h2 class="pixel-font inspect-title">
          {{ dialogShowingBack ? 'REVERSO' : activeCard.title.toUpperCase() }}
        </h2>
        <p class="inspect-subtitle">Resolución nativa {{ CARD_W }}×{{ CARD_H }} px · vista a 4× sin pérdida</p>

        <div class="inspect-card">
          <img :src="getPixelCardUrl(dialogSpec)" :alt="activeCard.title" draggable="false" />
        </div>

        <div class="d-flex flex-wrap justify-center ga-3">
          <v-btn
            id="modal-flip-btn"
            variant="tonal"
            rounded="lg"
            prepend-icon="mdi-rotate-3d-variant"
            @click="dialogShowingBack = !dialogShowingBack"
          >
            {{ dialogShowingBack ? 'Ver frente' : 'Ver reverso' }}
          </v-btn>
          <v-btn
            id="modal-download-btn"
            color="amber-darken-1"
            variant="elevated"
            rounded="lg"
            prepend-icon="mdi-download"
            class="font-weight-bold"
            @click="downloadActiveCard(8)"
          >
            PNG {{ CARD_W * 8 }}×{{ CARD_H * 8 }}
          </v-btn>
        </div>
      </div>
    </v-dialog>

    <v-snackbar v-model="toast.show" :timeout="2800" color="amber-darken-1" location="bottom right" rounded="lg">
      <v-icon class="mr-2" size="18">mdi-star-four-points</v-icon>
      <span class="font-weight-bold">{{ toast.text }}</span>
    </v-snackbar>
  </div>
</template>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Press+Start+2P&family=Outfit:wght@400;500;600;700&display=swap');

.deck-page {
  position: relative;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  overflow-x: hidden;
  font-family: 'Outfit', sans-serif;
  color: #f4f4f5;
  background-color: #111114;
  background-image:
    radial-gradient(rgba(251, 192, 45, 0.07) 1px, transparent 1px),
    radial-gradient(ellipse at 50% -10%, #23202e 0%, #111114 55%);
  background-size: 22px 22px, 100% 100%;
}

.deck-glow {
  position: absolute;
  border-radius: 50%;
  filter: blur(90px);
  pointer-events: none;
  opacity: 0.35;
}
.deck-glow--1 {
  width: 420px;
  height: 420px;
  top: 120px;
  left: -140px;
  background: #283593;
}
.deck-glow--2 {
  width: 380px;
  height: 380px;
  top: 480px;
  right: -120px;
  background: #b71c1c;
}

.pixel-font {
  font-family: 'Press Start 2P', monospace;
}

/* ─── Header ─── */
.deck-header {
  position: sticky;
  top: 0;
  z-index: 10;
  background: rgba(17, 17, 20, 0.88);
  backdrop-filter: blur(14px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.07);
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.35);
}
.deck-header__inner {
  max-width: 1280px;
  margin: 0 auto;
  padding: 14px 20px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.deck-header__top,
.deck-header__bottom {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}
.deck-header__bottom {
  padding-top: 12px;
  border-top: 1px solid rgba(255, 255, 255, 0.06);
}

.brand-badge {
  width: 42px;
  height: 42px;
  border-radius: 10px;
  background: #fff;
  color: #1a1a1a;
  display: grid;
  place-items: center;
  font-size: 26px;
  box-shadow: 0 0 0 2px #fbc02d, 0 6px 18px rgba(251, 192, 45, 0.25);
}
.deck-title {
  font-size: clamp(11px, 1.6vw, 16px);
  color: #fbc02d;
  letter-spacing: -0.5px;
  text-shadow: 2px 2px 0 #7a4f00;
  margin: 0 0 6px;
}
.deck-subtitle {
  font-size: 12px;
  color: #a1a1aa;
  margin: 0;
}

/* ─── Filter chips ─── */
.filter-chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.08);
  color: #d4d4d8;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.2s ease, transform 0.15s ease, box-shadow 0.2s ease;
}
.filter-chip:hover {
  background: rgba(255, 255, 255, 0.1);
  transform: translateY(-1px);
}
.filter-chip__symbol {
  font-size: 14px;
  line-height: 1;
}
.filter-chip__count {
  font-size: 10px;
  padding: 1px 6px;
  border-radius: 999px;
  background: rgba(0, 0, 0, 0.35);
}
.filter-chip--red {
  color: #f87171;
}
.filter-chip--gold {
  color: #fcd34d;
}
.filter-chip--purple {
  color: #d8b4fe;
}
.filter-chip.is-active {
  background: #fbc02d;
  border-color: #fbc02d;
  color: #18181b;
  font-weight: 700;
  box-shadow: 0 0 14px rgba(251, 192, 45, 0.45);
}

.theme-select {
  width: 180px;
  flex: none;
}
.theme-swatch {
  width: 14px;
  height: 14px;
  border-radius: 3px;
  margin-right: 4px;
  box-shadow: 0 0 0 1px #fbc02d;
}
.size-control {
  width: 200px;
}
.style-switch {
  flex: none;
}
.style-switch :deep(.v-label) {
  font-size: 12px;
  opacity: 0.85;
}

/* ─── Grid ─── */
.deck-main {
  position: relative;
  flex: 1;
  width: 100%;
  max-width: 1280px;
  margin: 0 auto;
  padding: 32px 20px;
}
.cards-grid {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 22px;
}

.pixel-playing-card {
  width: var(--card-width);
  aspect-ratio: 78 / 110;
  perspective: 1000px;
  padding: 0;
  border: none;
  background: none;
  cursor: pointer;
  user-select: none;
}
.pixel-playing-card:focus-visible {
  outline: 2px solid #fbc02d;
  outline-offset: 4px;
  border-radius: 10px;
}

.pixel-card-inner {
  position: relative;
  width: 100%;
  height: 100%;
  transform-style: preserve-3d;
  border-radius: 10px;
  transition: transform 0.55s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.25s ease;
  box-shadow: 0 6px 14px rgba(0, 0, 0, 0.45), 0 1px 3px rgba(0, 0, 0, 0.3);
}
.pixel-playing-card:hover .pixel-card-inner {
  transform: translateY(-6px) scale(1.03);
  box-shadow: 0 16px 28px rgba(0, 0, 0, 0.6), 0 0 0 2px #fbc02d;
}
.pixel-playing-card.is-flipped .pixel-card-inner {
  transform: rotateY(180deg);
}
.pixel-playing-card.is-flipped:hover .pixel-card-inner {
  transform: rotateY(180deg) translateY(-6px) scale(1.03);
}

.pixel-card-face {
  position: absolute;
  inset: 0;
  border-radius: 10px;
  overflow: hidden;
  background: #fff;
  border: 1px solid #e4e4e7;
  -webkit-backface-visibility: hidden;
  backface-visibility: hidden;
}
.pixel-card-face--back {
  transform: rotateY(180deg);
}
.pixel-card-face img {
  width: 100%;
  height: 100%;
  display: block;
  pointer-events: none;
}

/* Deal-in animation when filtering / shuffling */
.deal-enter-active {
  transition: opacity 0.35s ease, transform 0.35s cubic-bezier(0.2, 0.8, 0.2, 1);
  transition-delay: var(--deal-delay);
}
.deal-enter-from {
  opacity: 0;
  transform: translateY(18px) rotate(-4deg) scale(0.92);
}
.deal-move {
  transition: transform 0.45s cubic-bezier(0.4, 0, 0.2, 1);
}

/* ─── Footer ─── */
.deck-footer {
  position: relative;
  text-align: center;
  font-size: 12px;
  color: #71717a;
  padding: 18px;
  border-top: 1px solid rgba(255, 255, 255, 0.06);
}

/* ─── Inspect Dialog ─── */
.inspect-panel {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 26px 22px 22px;
  border-radius: 18px;
  background: linear-gradient(160deg, #1f1d29 0%, #141418 100%);
  border: 1px solid rgba(251, 192, 45, 0.25);
  box-shadow: 0 30px 60px rgba(0, 0, 0, 0.6);
  color: #f4f4f5;
}
.inspect-close {
  position: absolute;
  top: 12px;
  right: 12px;
}
.inspect-title {
  font-size: 11px;
  line-height: 1.6;
  color: #fbc02d;
  text-align: center;
  margin: 0 36px 6px;
}
.inspect-subtitle {
  font-size: 12px;
  color: #a1a1aa;
  margin: 0 0 18px;
}
.inspect-card {
  width: min(312px, 70vw);
  aspect-ratio: 78 / 110;
  border-radius: 14px;
  overflow: hidden;
  background: #fff;
  box-shadow: 0 0 0 2px #52525b, 0 20px 40px rgba(0, 0, 0, 0.55);
  margin-bottom: 20px;
}
.inspect-card img {
  width: 100%;
  height: 100%;
  display: block;
  image-rendering: pixelated;
}

@media (max-width: 600px) {
  .deck-header__inner {
    padding: 12px;
  }
  .cards-grid {
    gap: 14px;
  }
  .size-control {
    width: 150px;
  }
}
</style>
