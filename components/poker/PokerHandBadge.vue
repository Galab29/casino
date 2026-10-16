<script setup lang="ts">
import { computed } from 'vue'
import type { EvaluatedHand, PokerHandRank } from '~/types/poker'

interface Props {
  hand: EvaluatedHand | null
  label?: string
  isWinning?: boolean
}

const props = defineProps<Props>()

const rankColors: Record<PokerHandRank, string> = {
  royal_flush: '#ffd700',
  straight_flush: '#ff6d00',
  four_of_a_kind: '#d500f9',
  full_house: '#00e5ff',
  flush: '#00e676',
  straight: '#76ff03',
  three_of_a_kind: '#ffea00',
  two_pair: '#40c4ff',
  one_pair: '#b0bec5',
  high_card: '#90a4ae',
}

const accentColor = computed(() => {
  if (!props.hand) return '#ffd54f'
  return rankColors[props.hand.rank] || '#ffd54f'
})
</script>

<template>
  <div
    v-if="hand"
    class="hand-badge"
    :class="{ 'hand-badge--winning': isWinning }"
    :style="{ '--accent-color': accentColor }"
  >
    <div v-if="label" class="badge-label">{{ label }}</div>
    <div class="d-flex align-center ga-2">
      <span class="rank-tag" :style="{ background: accentColor }">
        {{ hand.shortName }}
      </span>
      <span class="hand-full-name">{{ hand.name }}</span>
    </div>
  </div>
</template>

<style scoped>
.hand-badge {
  background: #14141d;
  border: 2px solid var(--accent-color);
  box-shadow: 0 3px 0 0 #000, 0 0 10px rgba(0, 0, 0, 0.8);
  border-radius: 4px;
  padding: 5px 12px;
  display: inline-flex;
  flex-direction: column;
  align-items: center;
  transition: all 0.2s ease;
}

.hand-badge--winning {
  box-shadow: 0 0 16px var(--accent-color), 0 4px 0 0 #000;
  transform: scale(1.05);
  animation: winningPulse 1.2s infinite ease-in-out;
}

@keyframes winningPulse {
  0%, 100% {
    box-shadow: 0 0 12px var(--accent-color), 0 4px 0 0 #000;
  }
  50% {
    box-shadow: 0 0 24px var(--accent-color), 0 0 36px rgba(255, 215, 0, 0.5), 0 4px 0 0 #000;
  }
}

.badge-label {
  font-family: 'Press Start 2P', monospace !important;
  font-size: 0.48rem;
  text-transform: uppercase;
  letter-spacing: 0px;
  color: #a1a1aa;
  line-height: 1;
  margin-bottom: 4px;
}

.rank-tag {
  font-family: 'Press Start 2P', monospace !important;
  color: #000;
  font-weight: 700;
  font-size: 0.52rem;
  padding: 2px 6px;
  border-radius: 3px;
  text-transform: uppercase;
  border: 1px solid #000;
}

.hand-full-name {
  font-family: 'Press Start 2P', monospace !important;
  color: #fff;
  font-weight: 700;
  font-size: 0.55rem;
  text-shadow: 1px 1px 0 #000;
  letter-spacing: 0.02em;
}
</style>
