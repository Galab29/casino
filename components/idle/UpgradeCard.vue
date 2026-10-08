<script setup lang="ts">
import { computed } from 'vue'
import type { IdleUpgrade } from '~/types/idle'
import { useIdleStore } from '~/stores/idle'
import { useBlackjackStore } from '~/stores/blackjack'
import { useSoundEngine } from '~/composables/useSoundEngine'
import { formatNumber } from '~/utils/formatNumber'

const props = defineProps<{
  upgrade: IdleUpgrade
  isPurchased?: boolean
}>()

const nuxtApp = useNuxtApp()
const wallet = useBlackjackStore(nuxtApp?.$pinia)
const idleStore = useIdleStore()
const sound = useSoundEngine()

const canAfford = computed(() => wallet.player.chips >= props.upgrade.cost)

function handleBuy() {
  if (!canAfford.value || props.isPurchased) return
  const success = idleStore.buyUpgrade(props.upgrade.id)
  if (success) {
    sound.playChipStack()
  }
}

// Icono y color según el tipo de efecto
const effectBadge = computed(() => {
  switch (props.upgrade.effect.type) {
    case 'generatorMult':
      return { label: `x${props.upgrade.effect.value} Producción`, color: 'amber' }
    case 'globalMult':
      return { label: `+${Math.round((props.upgrade.effect.value - 1) * 100)}% Global`, color: 'purple' }
    case 'clickMult':
      return { label: `x${props.upgrade.effect.value} Clic`, color: 'cyan' }
    case 'clickFlat':
      return { label: `+${props.upgrade.effect.value} Clic Base`, color: 'teal' }
    case 'clickCpsPercent':
      return { label: `+${props.upgrade.effect.value}% CPS al Clic`, color: 'green' }
    case 'adrenalineDuration':
      return { label: `+${props.upgrade.effect.value}s Adrenalina`, color: 'orange' }
    case 'costDiscount':
      return { label: `-${Math.round(props.upgrade.effect.value * 100)}% Costo`, color: 'blue' }
    default:
      return { label: 'Mejora', color: 'amber' }
  }
})
</script>

<template>
  <v-card
    class="upgrade-card h-100"
    :class="{ 'upgrade-card--purchased': isPurchased }"
    rounded="xl"
    elevation="0"
  >
    <v-card-text class="d-flex flex-column h-100 pa-4">
      <div class="d-flex justify-space-between align-start mb-2">
        <h4 class="upgrade-name mb-0">{{ upgrade.name }}</h4>
        <v-chip
          size="x-small"
          :color="effectBadge.color"
          variant="flat"
          class="font-weight-bold"
        >
          {{ effectBadge.label }}
        </v-chip>
      </div>

      <p class="upgrade-desc flex-grow-1 mb-3">
        {{ upgrade.description }}
      </p>

      <div class="d-flex justify-space-between align-center mt-auto pt-2 border-top">
        <div class="cost-wrap">
          <span class="cost-label">Costo:</span>
          <span class="cost-value">
            <v-icon size="14" color="amber" class="mr-1">mdi-poker-chip</v-icon>
            {{ formatNumber(upgrade.cost) }}
          </span>
        </div>

        <v-btn
          v-if="!isPurchased"
          color="amber-darken-2"
          size="small"
          variant="elevated"
          rounded="lg"
          class="font-weight-bold"
          :disabled="!canAfford"
          @click="handleBuy"
        >
          COMPRAR
        </v-btn>
        <v-chip
          v-else
          size="small"
          color="green-darken-2"
          variant="flat"
          prepend-icon="mdi-check"
          class="font-weight-bold"
        >
          Comprado
        </v-chip>
      </div>
    </v-card-text>
  </v-card>
</template>

<style scoped>
.upgrade-card {
  background: rgba(22, 22, 34, 0.75) !important;
  border: 1px solid rgba(255, 255, 255, 0.08);
  transition: transform 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease;
}

.upgrade-card:hover {
  border-color: rgba(255, 213, 79, 0.3);
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.3);
  transform: translateY(-2px);
}

.upgrade-card--purchased {
  opacity: 0.65;
  border-color: rgba(76, 175, 80, 0.3) !important;
}

.upgrade-name {
  font-family: 'Cinzel', serif;
  font-weight: 700;
  font-size: 0.95rem;
  letter-spacing: 0.5px;
  color: #fff;
}

.upgrade-desc {
  font-size: 0.8rem;
  color: rgba(255, 255, 255, 0.6);
  line-height: 1.35;
}

.border-top {
  border-top: 1px solid rgba(255, 255, 255, 0.06);
}

.cost-label {
  font-size: 0.7rem;
  color: rgba(255, 255, 255, 0.4);
  margin-right: 4px;
}

.cost-value {
  font-family: 'Cinzel', serif;
  font-size: 0.9rem;
  font-weight: 800;
  color: #ffd54f;
}
</style>
