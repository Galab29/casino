<script setup lang="ts">
import { computed } from 'vue'
import type { IdleGenerator } from '~/types/idle'
import { GENERATOR_MILESTONES } from '~/constants/idle'
import { useIdleStore } from '~/stores/idle'
import { useBlackjackStore } from '~/stores/blackjack'
import { useSoundEngine } from '~/composables/useSoundEngine'
import { formatNumber } from '~/utils/formatNumber'

const props = defineProps<{
  generator: IdleGenerator
  buyMode: '1' | '10' | '100' | 'max'
}>()

const nuxtApp = useNuxtApp()
const wallet = useBlackjackStore(nuxtApp?.$pinia)
const idleStore = useIdleStore()
const sound = useSoundEngine()

const isRevealed = computed(() => idleStore.isGeneratorRevealed(props.generator.id))
const owned = computed(() => idleStore.generators[props.generator.id] || 0)
const generatorCps = computed(() => idleStore.getGeneratorCps(props.generator.id))

// Próximo hito de producción
const nextMilestone = computed(() => {
  for (const m of GENERATOR_MILESTONES) {
    if (owned.value < m) return m
  }
  return null
})

const prevMilestone = computed(() => {
  let prev = 0
  for (const m of GENERATOR_MILESTONES) {
    if (owned.value >= m) prev = m
  }
  return prev
})

const milestoneProgressPercent = computed(() => {
  if (!nextMilestone.value) return 100
  const range = nextMilestone.value - prevMilestone.value
  const current = owned.value - prevMilestone.value
  return Math.min(100, Math.max(0, (current / range) * 100))
})

// Cantidad a comprar y costo
const purchaseInfo = computed(() => {
  if (props.buyMode === 'max') {
    const maxData = idleStore.getMaxBuyable(props.generator.id, wallet.player.chips)
    if (maxData.count > 0) {
      return {
        qty: maxData.count,
        cost: maxData.totalCost,
        canAfford: true,
      }
    }
    // Si no alcanza para ninguno con max, muestra costo de 1
    const costForOne = idleStore.getGeneratorCost(props.generator.id, 1)
    return {
      qty: 1,
      cost: costForOne,
      canAfford: wallet.player.chips >= costForOne,
    }
  }

  const qty = parseInt(props.buyMode, 10) || 1
  const cost = idleStore.getGeneratorCost(props.generator.id, qty)
  return {
    qty,
    cost,
    canAfford: wallet.player.chips >= cost,
  }
})

function handleBuy() {
  if (!purchaseInfo.value.canAfford) return
  let success = false
  if (props.buyMode === 'max') {
    success = idleStore.buyGeneratorMax(props.generator.id)
  } else {
    success = idleStore.buyGenerator(props.generator.id, purchaseInfo.value.qty)
  }

  if (success) {
    sound.playChipStack()
  }
}
</script>

<template>
  <v-card
    class="generator-card mb-3"
    :class="{ 'generator-card--locked': !isRevealed }"
    rounded="xl"
    elevation="0"
  >
    <!-- Fondo con gradiente sutil del color del generador -->
    <div
      class="generator-glow"
      :style="{ background: `radial-gradient(circle at 10% 50%, ${generator.color}15, transparent 70%)` }"
    />

    <v-card-text class="pa-4 generator-content">
      <!-- Caso No Revelado -->
      <div v-if="!isRevealed" class="d-flex align-center justify-space-between py-2">
        <div class="d-flex align-center ga-3">
          <div class="generator-avatar generator-avatar--locked">
            <v-icon size="32" color="grey">mdi-lock-outline</v-icon>
          </div>
          <div>
            <h3 class="generator-name text-grey">Negocio Desconocido</h3>
            <p class="generator-desc text-grey-darken-1 mb-0">
              Desbloquea capital de al menos {{ formatNumber(generator.baseCost * 0.5) }} fichas para revelar.
            </p>
          </div>
        </div>
        <v-chip size="small" color="grey-darken-2" variant="tonal">
          Bloqueado
        </v-chip>
      </div>

      <!-- Caso Revelado -->
      <div v-else class="d-flex flex-column flex-md-row align-md-center justify-space-between ga-3">
        <!-- Izquierda: Icono + Nombre + Detalle -->
        <div class="d-flex align-center ga-3 flex-grow-1">
          <div
            class="generator-avatar"
            :style="{
              background: `linear-gradient(135deg, ${generator.color}33, ${generator.color}11)`,
              borderColor: `${generator.color}66`,
            }"
          >
            <v-icon size="32" :color="generator.color">{{ generator.icon }}</v-icon>
          </div>

          <div class="generator-details">
            <div class="d-flex align-center ga-2 flex-wrap">
              <h3 class="generator-name mb-0">{{ generator.name }}</h3>
              <v-chip
                size="x-small"
                variant="flat"
                :style="{ backgroundColor: `${generator.color}22`, color: generator.color }"
                class="font-weight-bold"
              >
                {{ owned }} poseídos
              </v-chip>
              <v-btn
                v-if="generator.gameRoute"
                :to="generator.gameRoute"
                size="x-small"
                variant="text"
                color="amber"
                prepend-icon="mdi-arrow-top-right-bold-box"
                class="pa-0 ml-1 text-none"
              >
                Ir a jugar
              </v-btn>
            </div>

            <p class="generator-desc mb-1">{{ generator.description }}</p>

            <!-- Producción actual y barra de hitos -->
            <div class="d-flex align-center ga-3 flex-wrap">
              <span class="cps-stat">
                Genera: <strong>+{{ formatNumber(generatorCps) }}/s</strong>
              </span>

              <!-- Barra de progreso al siguiente hito x2 -->
              <div v-if="nextMilestone" class="milestone-wrap d-flex align-center ga-2">
                <span class="milestone-label">Hito x2 ({{ owned }}/{{ nextMilestone }}):</span>
                <v-progress-linear
                  :model-value="milestoneProgressPercent"
                  color="amber"
                  bg-color="grey-darken-3"
                  height="6"
                  rounded
                  class="milestone-bar"
                />
              </div>
              <span v-else class="text-caption text-amber font-weight-bold">
                ¡Hitos máximos completados (x32)!
              </span>
            </div>
          </div>
        </div>

        <!-- Derecha: Botón de Compra -->
        <div class="buy-section d-flex align-center justify-end">
          <v-btn
            color="amber-darken-2"
            size="large"
            rounded="lg"
            variant="elevated"
            class="buy-btn"
            :disabled="!purchaseInfo.canAfford"
            @click="handleBuy"
          >
            <div class="d-flex flex-column align-center">
              <span class="buy-label">
                COMPRAR +{{ purchaseInfo.qty }}
              </span>
              <span class="buy-cost">
                <v-icon size="14" class="mr-1">mdi-poker-chip</v-icon>
                {{ formatNumber(purchaseInfo.cost) }}
              </span>
            </div>
          </v-btn>
        </div>
      </div>
    </v-card-text>
  </v-card>
</template>

<style scoped>
.generator-card {
  position: relative;
  background: rgba(22, 22, 34, 0.7) !important;
  border: 1px solid rgba(255, 255, 255, 0.08);
  transition: transform 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease;
  overflow: hidden;
}

.generator-card:hover {
  border-color: rgba(255, 213, 79, 0.3);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
  transform: translateY(-2px);
}

.generator-card--locked {
  opacity: 0.6;
  border-style: dashed;
}

.generator-glow {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.generator-content {
  position: relative;
  z-index: 1;
}

.generator-avatar {
  width: 54px;
  height: 54px;
  min-width: 54px;
  border-radius: 14px;
  border: 1.5px solid;
  display: flex;
  align-items: center;
  justify-content: center;
}

.generator-avatar--locked {
  background: rgba(255, 255, 255, 0.04);
  border-color: rgba(255, 255, 255, 0.1);
}

.generator-name {
  font-family: 'Cinzel', serif;
  font-weight: 700;
  font-size: 1.1rem;
  letter-spacing: 1px;
  color: #fff;
}

.generator-desc {
  font-size: 0.8rem;
  color: rgba(255, 255, 255, 0.5);
  line-height: 1.3;
}

.cps-stat {
  font-size: 0.8rem;
  color: #69f0ae;
}

.cps-stat strong {
  color: #b9f6ca;
}

.milestone-wrap {
  width: 170px;
}

.milestone-label {
  font-size: 0.7rem;
  color: rgba(255, 255, 255, 0.6);
  white-space: nowrap;
}

.milestone-bar {
  width: 60px;
}

.buy-btn {
  min-width: 140px;
  height: 54px !important;
  font-weight: 800;
  letter-spacing: 1px;
}

.buy-label {
  font-size: 0.8rem;
  line-height: 1.2;
}

.buy-cost {
  font-family: 'Cinzel', serif;
  font-size: 0.95rem;
  color: #fff;
  line-height: 1.2;
}

@media (max-width: 600px) {
  .generator-details {
    width: 100%;
  }
  .buy-section {
    width: 100%;
  }
  .buy-btn {
    width: 100%;
  }
}
</style>
