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
  background: rgba(10, 18, 30, 0.85);
  border: 1px solid var(--accent-color);
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.5), inset 0 0 12px rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(8px);
  border-radius: 999px;
  padding: 4px 14px;
  display: inline-flex;
  flex-direction: column;
  align-items: center;
  transition: all 0.3s ease;
}

.hand-badge--winning {
  box-shadow: 0 0 20px var(--accent-color), inset 0 0 15px rgba(255, 255, 255, 0.2);
  transform: scale(1.05);
  animation: winningPulse 1.8s infinite ease-in-out;
}

@keyframes winningPulse {
  0%, 100% {
    box-shadow: 0 0 15px var(--accent-color);
  }
  50% {
    box-shadow: 0 0 30px var(--accent-color), 0 0 45px rgba(255, 215, 0, 0.4);
  }
}

.badge-label {
  font-size: 0.65rem;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: #cfd8dc;
  line-height: 1;
  margin-bottom: 2px;
}

.rank-tag {
  color: #0b101b;
  font-weight: 900;
  font-size: 0.68rem;
  padding: 1px 7px;
  border-radius: 6px;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.hand-full-name {
  color: #fff;
  font-weight: 700;
  font-size: 0.8rem;
  letter-spacing: 0.02em;
}
</style>
