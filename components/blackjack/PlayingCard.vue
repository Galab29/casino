<script setup lang="ts">
import { computed, ref } from 'vue'
import type { Card } from '~/types/blackjack'

interface Props {
  card: Card
  faceDown?: boolean
  backColor?: 'navy' | 'red' | 'blue' | 'black' | 'green'
}

const props = withDefaults(defineProps<Props>(), {
  faceDown: false,
  backColor: 'navy',
})

const isFlipped = computed(() => props.faceDown || props.card.hidden)

const isRed = computed(() =>
  props.card.suit === 'hearts' || props.card.suit === 'diamonds',
)

// Map blackjack suit to svg-cards naming convention
const suitToKey: Record<string, string> = {
  hearts: 'heart',
  diamonds: 'diamond',
  clubs: 'club',
  spades: 'spade',
}

// Map blackjack value to svg-cards naming convention
const valueToKey: Record<string, string> = {
  A: '1',
  '2': '2',
  '3': '3',
  '4': '4',
  '5': '5',
  '6': '6',
  '7': '7',
  '8': '8',
  '9': '9',
  '10': '10',
  J: 'jack',
  Q: 'queen',
  K: 'king',
}

const cardImageSrc = computed(() => {
  const suitKey = suitToKey[props.card.suit] || 'spade'
  const valueKey = valueToKey[props.card.value] || '1'
  return `/cards/${suitKey}_${valueKey}.png`
})

const cardBackSrc = computed(() => {
  const color = props.backColor || 'navy'
  return `/cards/back-${color}.png`
})

const cardAlt = computed(() => {
  const suitNames: Record<string, string> = {
    hearts: 'Corazones',
    diamonds: 'Diamantes',
    clubs: 'Tréboles',
    spades: 'Picas',
  }
  const valNames: Record<string, string> = {
    A: 'As',
    J: 'Jota',
    Q: 'Reina',
    K: 'Rey',
  }
  const val = valNames[props.card.value] || props.card.value
  const suit = suitNames[props.card.suit] || props.card.suit
  return `${val} de ${suit}`
})

// Fallback in case of asset load issues
const imageError = ref(false)
function onImageError() {
  imageError.value = true
}

const suitSymbol = computed(() => {
  const map: Record<string, string> = {
    hearts: '♥',
    diamonds: '♦',
    clubs: '♣',
    spades: '♠',
  }
  return map[props.card.suit] || '♠'
})
</script>

<template>
  <div
    class="playing-card-wrapper mx-1"
    :class="{ 'is-flipped': isFlipped }"
    :title="isFlipped ? 'Carta oculta' : cardAlt"
  >
    <div class="card-inner">
      <!-- Front (Face Up) -->
      <div class="card-face card-front elevation-6">
        <!-- Realistic vector-rendered card artwork -->
        <img
          v-if="!imageError"
          :src="cardImageSrc"
          :alt="cardAlt"
          class="card-img"
          loading="eager"
          draggable="false"
          @error="onImageError"
        />

        <!-- Resilient Fallback -->
        <div
          v-else
          class="card-fallback d-flex flex-column align-center justify-center fill-height"
          :class="{ 'text-red': isRed }"
        >
          <div class="fallback-corner fallback-corner--tl">
            <div>{{ card.value }}</div>
            <div>{{ suitSymbol }}</div>
          </div>
          <div class="fallback-center">
            <span class="fallback-val">{{ card.value }}</span>
            <span class="fallback-suit">{{ suitSymbol }}</span>
          </div>
          <div class="fallback-corner fallback-corner--br">
            <div>{{ card.value }}</div>
            <div>{{ suitSymbol }}</div>
          </div>
        </div>

        <!-- Realistic specular sheen overlay -->
        <div class="card-sheen" />
        <!-- Subtle paper edge highlight -->
        <div class="card-edge-bevel" />
      </div>

      <!-- Back (Face Down) -->
      <div class="card-face card-back elevation-6">
        <img
          :src="cardBackSrc"
          alt="Dorso de carta de casino"
          class="card-img card-back-img"
          loading="eager"
          draggable="false"
        />
        <!-- Realistic specular sheen overlay -->
        <div class="card-sheen" />
        <!-- Subtle paper edge highlight -->
        <div class="card-edge-bevel" />
      </div>
    </div>
  </div>
</template>

<style scoped>
.playing-card-wrapper {
  perspective: 1200px;
  width: 98px;
  height: 142px;
  display: inline-block;
  user-select: none;
  cursor: default;
  transition: transform 0.25s ease;
}

.card-inner {
  position: relative;
  width: 100%;
  height: 100%;
  transform-style: preserve-3d;
  transition: transform 0.65s cubic-bezier(0.34, 1.45, 0.64, 1),
              box-shadow 0.3s ease;
  border-radius: 9px;
}

/* 3D Lift & Tilt on Hover */
.playing-card-wrapper:hover .card-inner {
  transform: translateY(-8px) scale(1.05) rotateX(4deg);
  box-shadow: 0 16px 32px rgba(0, 0, 0, 0.55);
}

.playing-card-wrapper.is-flipped .card-inner {
  transform: rotateY(180deg);
}

.playing-card-wrapper.is-flipped:hover .card-inner {
  transform: rotateY(180deg) translateY(-8px) scale(1.05) rotateX(-4deg);
  box-shadow: 0 16px 32px rgba(0, 0, 0, 0.55);
}

/* ─── Card Faces ─── */
.card-face {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  -webkit-backface-visibility: hidden;
  backface-visibility: hidden;
  border-radius: 9px;
  overflow: hidden;
  background: #ffffff;
  box-shadow:
    0 10px 24px -4px rgba(0, 0, 0, 0.45),
    0 3px 8px rgba(0, 0, 0, 0.3),
    inset 0 0 0 1px rgba(0, 0, 0, 0.08);
}

/* Front & Back */
.card-front {
  transform: rotateY(0deg);
}

.card-back {
  background: #0d1b2a;
  transform: rotateY(180deg);
}

/* Realistic Card Image */
.card-img {
  width: 100%;
  height: 100%;
  object-fit: fill;
  display: block;
  border-radius: 9px;
  image-rendering: -webkit-optimize-contrast;
  image-rendering: crisp-edges;
  pointer-events: none;
}

.card-back-img {
  width: 100%;
  height: 100%;
  object-fit: fill;
}

/* ─── Realistic Satin Sheen Overlay ─── */
.card-sheen {
  position: absolute;
  inset: 0;
  border-radius: 9px;
  background: linear-gradient(
    130deg,
    rgba(255, 255, 255, 0.38) 0%,
    rgba(255, 255, 255, 0.12) 28%,
    transparent 50%,
    rgba(0, 0, 0, 0.04) 75%,
    rgba(255, 255, 255, 0.08) 100%
  );
  pointer-events: none;
  z-index: 2;
  transition: opacity 0.3s ease;
}

.playing-card-wrapper:hover .card-sheen {
  background: linear-gradient(
    130deg,
    rgba(255, 255, 255, 0.55) 0%,
    rgba(255, 255, 255, 0.22) 32%,
    transparent 55%,
    rgba(255, 255, 255, 0.12) 100%
  );
}

/* Subtle edge bevel */
.card-edge-bevel {
  position: absolute;
  inset: 0;
  border-radius: 9px;
  border: 1px solid rgba(255, 255, 255, 0.25);
  box-shadow: inset 0 0 2px rgba(0, 0, 0, 0.15);
  pointer-events: none;
  z-index: 3;
}

/* ─── Fallback Styles ─── */
.card-fallback {
  background: #fff;
  color: #1a1a2e;
  position: relative;
  font-family: 'Cinzel', serif;
}

.card-fallback.text-red {
  color: #d32f2f;
}

.fallback-corner {
  position: absolute;
  font-size: 13px;
  font-weight: 700;
  line-height: 1;
}

.fallback-corner--tl {
  top: 6px;
  left: 6px;
}

.fallback-corner--br {
  bottom: 6px;
  right: 6px;
  transform: rotate(180deg);
}

.fallback-center {
  font-size: 32px;
  display: flex;
  align-items: center;
  gap: 4px;
}

/* ─── Responsive ─── */
@media (max-width: 600px) {
  .playing-card-wrapper {
    width: 72px;
    height: 104px;
    margin: 2px !important;
  }
}
</style>
