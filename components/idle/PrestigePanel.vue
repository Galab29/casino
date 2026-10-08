<script setup lang="ts">
import { ref, computed } from 'vue'
import { PRESTIGE_UPGRADES, PRESTIGE_DIVISOR } from '~/constants/idle'
import { useIdleStore } from '~/stores/idle'
import { useConfetti } from '~/composables/useConfetti'
import { useSoundEngine } from '~/composables/useSoundEngine'
import { formatNumber } from '~/utils/formatNumber'

const idleStore = useIdleStore()
const confetti = useConfetti()
const sound = useSoundEngine()

const showConfirmDialog = ref(false)

const pendingStars = computed(() => idleStore.pendingStars)
const totalStars = computed(() => idleStore.stars + idleStore.spentStars)
const nextStarProgress = computed(() => {
  const currentRun = idleStore.runChips
  if (currentRun < PRESTIGE_DIVISOR) {
    return Math.min(100, (currentRun / PRESTIGE_DIVISOR) * 100)
  }
  const currentS = Math.floor(Math.sqrt(currentRun / PRESTIGE_DIVISOR))
  const chipsForCurrent = Math.pow(currentS, 2) * PRESTIGE_DIVISOR
  const chipsForNext = Math.pow(currentS + 1, 2) * PRESTIGE_DIVISOR
  const range = chipsForNext - chipsForCurrent
  return Math.min(100, Math.max(0, ((currentRun - chipsForCurrent) / range) * 100))
})

function handlePrestigeConfirm() {
  const starsGained = pendingStars.value
  const success = idleStore.claimPrestige()
  showConfirmDialog.value = false
  if (success) {
    confetti.celebrate()
    sound.playWin()
  }
}

function handleBuyPrestigeUpgrade(id: string) {
  const success = idleStore.buyPrestigeUpgrade(id)
  if (success) {
    sound.playChipStack()
  }
}
</script>

<template>
  <div class="prestige-panel">
    <!-- Header Banner de Prestigio -->
    <v-card class="prestige-hero mb-6" rounded="xl" elevation="0">
      <div class="prestige-hero-bg" />
      <v-card-text class="pa-6 text-center position-relative">
        <div class="star-badge mb-3">
          <v-icon color="#ffd700" size="44">mdi-license</v-icon>
        </div>
        <h2 class="prestige-title mb-2">LICENCIA DE CASINO REAL</h2>
        <p class="prestige-subtitle mx-auto mb-4">
          Reinicia tu imperio actual a cambio de <strong>Estrellas de Prestigio</strong> permanentes.
          Cada estrella otorga un <strong>+2 % permanente</strong> a toda tu producción futura.
        </p>

        <!-- Stats de Prestigio -->
        <div class="d-flex justify-center align-center ga-4 flex-wrap mb-5">
          <div class="stat-pill">
            <v-icon color="#ffd700" size="20" class="mr-1">mdi-star</v-icon>
            <span class="stat-label">Estrellas Disponibles:</span>
            <span class="stat-value text-amber">{{ idleStore.stars }}</span>
          </div>

          <div class="stat-pill">
            <v-icon color="#69f0ae" size="20" class="mr-1">mdi-star-shooting</v-icon>
            <span class="stat-label">Bono Total:</span>
            <span class="stat-value text-green-accent-2">+{{ Math.round(idleStore.starBonus * 100) }}%</span>
          </div>

          <div class="stat-pill">
            <v-icon color="#4fc3f7" size="20" class="mr-1">mdi-cash-multiple</v-icon>
            <span class="stat-label">Fichas en esta Partida:</span>
            <span class="stat-value text-light-blue-accent-2">{{ formatNumber(idleStore.runChips) }}</span>
          </div>
        </div>

        <!-- Barra de Progreso hacia la próxima estrella -->
        <div class="progress-wrap mx-auto mb-5">
          <div class="d-flex justify-space-between text-caption mb-1">
            <span>Progreso hacia la siguiente estrella</span>
            <span>{{ nextStarProgress.toFixed(1) }}%</span>
          </div>
          <v-progress-linear
            :model-value="nextStarProgress"
            color="amber-darken-2"
            bg-color="grey-darken-3"
            height="8"
            rounded
          />
        </div>

        <!-- Botón de Prestigio -->
        <v-btn
          color="amber-darken-2"
          size="x-large"
          rounded="pill"
          variant="elevated"
          class="prestige-btn px-8"
          prepend-icon="mdi-star-shooting"
          :disabled="pendingStars < 1"
          @click="showConfirmDialog = true"
        >
          REINICIAR POR +{{ pendingStars }} {{ pendingStars === 1 ? 'ESTRELLA' : 'ESTRELLAS' }}
        </v-btn>
        <p v-if="pendingStars < 1" class="text-caption text-grey mt-2">
          (Necesitas ganar al menos 10,000,000 de fichas en esta partida para conseguir tu 1ª estrella)
        </p>
      </v-card-text>
    </v-card>

    <!-- Tienda de Prestigio -->
    <h3 class="section-title mb-4">
      <v-icon color="amber" class="mr-2">mdi-store-star</v-icon>
      TIENDA DE ESTRELLAS DE PRESTIGIO
    </h3>

    <v-row>
      <v-col
        v-for="p in PRESTIGE_UPGRADES"
        :key="p.id"
        cols="12"
        sm="6"
        md="4"
      >
        <v-card class="prestige-upgrade-card h-100" rounded="xl" elevation="0">
          <v-card-text class="d-flex flex-column h-100 pa-4">
            <div class="d-flex justify-space-between align-center mb-2">
              <h4 class="upgrade-name mb-0">{{ p.name }}</h4>
              <v-chip size="x-small" color="amber" variant="outlined" class="font-weight-bold">
                Nivel {{ idleStore.prestigeUpgrades[p.id] || 0 }} / {{ p.maxLevel }}
              </v-chip>
            </div>

            <p class="upgrade-desc flex-grow-1 mb-3">
              {{ p.description }}
            </p>

            <div class="d-flex justify-space-between align-center mt-auto pt-2 border-top">
              <div v-if="(idleStore.prestigeUpgrades[p.id] || 0) < p.maxLevel">
                <span class="text-caption text-grey">Costo:</span>
                <span class="font-weight-bold text-amber ml-1">
                  {{ idleStore.getPrestigeUpgradeCost(p.id) }} ★
                </span>
              </div>
              <span v-else class="text-caption text-green font-weight-bold">
                NIVEL MÁXIMO
              </span>

              <v-btn
                v-if="(idleStore.prestigeUpgrades[p.id] || 0) < p.maxLevel"
                size="small"
                color="amber-darken-2"
                variant="elevated"
                rounded="lg"
                class="font-weight-bold"
                :disabled="idleStore.stars < idleStore.getPrestigeUpgradeCost(p.id)"
                @click="handleBuyPrestigeUpgrade(p.id)"
              >
                MEJORAR
              </v-btn>
            </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Diálogo de Confirmación en Dos Pasos -->
    <v-dialog v-model="showConfirmDialog" max-width="500">
      <v-card rounded="xl" class="confirm-dialog-card pa-4">
        <v-card-title class="text-center font-family-cinzel text-amber font-weight-bold">
          <v-icon color="amber" size="32" class="mr-2">mdi-alert-decagram</v-icon>
          ¿CONFIRMAR PRESTIGIO?
        </v-card-title>
        <v-card-text class="text-center">
          <p class="mb-3">
            Obtendrás <strong>+{{ pendingStars }} Estrellas de Prestigio</strong>, equivalentes a un
            <strong>+{{ pendingStars * 2 }}% permanente</strong> a toda tu producción futura.
          </p>
          <div class="warning-box pa-3 mb-3 text-caption text-left">
            <v-icon color="orange" size="16" class="mr-1">mdi-information</v-icon>
            <strong>Se reiniciarán:</strong> Tus fichas de billetera, generadores comprados, mejoras normales y adrenalina activa.
            <br />
            <strong>Conservarás:</strong> Todas tus estrellas, mejoras de prestigio, logros, estadísticas históricas y saldo base aumentado.
          </div>
        </v-card-text>
        <v-card-actions class="d-flex justify-space-between">
          <v-btn variant="text" color="grey" @click="showConfirmDialog = false">
            Cancelar
          </v-btn>
          <v-btn
            color="amber-darken-2"
            variant="elevated"
            class="font-weight-bold"
            @click="handlePrestigeConfirm"
          >
            SÍ, PRESTIGIAR AHORA
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<style scoped>
.prestige-hero {
  position: relative;
  background: linear-gradient(145deg, #1f1a10 0%, #110e08 60%, #080604 100%) !important;
  border: 1.5px solid rgba(255, 213, 79, 0.4);
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.6), 0 0 20px rgba(255, 213, 79, 0.15);
  overflow: hidden;
}

.prestige-hero-bg {
  position: absolute;
  inset: 0;
  background: radial-gradient(circle at 50% 20%, rgba(255, 213, 79, 0.12) 0%, transparent 60%);
  pointer-events: none;
}

.prestige-title {
  font-family: 'Cinzel', serif;
  font-weight: 900;
  font-size: 1.8rem;
  letter-spacing: 4px;
  color: #ffd54f;
  text-shadow: 0 0 12px rgba(255, 213, 79, 0.5);
}

.prestige-subtitle {
  max-width: 650px;
  color: rgba(255, 255, 255, 0.7);
  font-size: 0.95rem;
  line-height: 1.5;
}

.stat-pill {
  display: inline-flex;
  align-items: center;
  background: rgba(0, 0, 0, 0.5);
  border: 1px solid rgba(255, 213, 79, 0.3);
  border-radius: 20px;
  padding: 6px 14px;
  font-size: 0.85rem;
}

.stat-label {
  color: rgba(255, 255, 255, 0.6);
  margin-right: 6px;
}

.stat-value {
  font-family: 'Cinzel', serif;
  font-weight: 800;
}

.progress-wrap {
  max-width: 480px;
}

.prestige-btn {
  font-family: 'Cinzel', serif;
  font-weight: 900;
  letter-spacing: 2px;
  box-shadow: 0 8px 30px rgba(255, 193, 7, 0.4);
}

.section-title {
  font-family: 'Cinzel', serif;
  font-weight: 800;
  font-size: 1.2rem;
  letter-spacing: 2px;
  color: #fff;
  display: flex;
  align-items: center;
}

.prestige-upgrade-card {
  background: rgba(22, 22, 34, 0.75) !important;
  border: 1px solid rgba(255, 213, 79, 0.2);
}

.border-top {
  border-top: 1px solid rgba(255, 255, 255, 0.08);
}

.confirm-dialog-card {
  background: #1a1610 !important;
  border: 1px solid rgba(255, 213, 79, 0.4);
  color: #fff;
}

.warning-box {
  background: rgba(255, 152, 0, 0.1);
  border-left: 3px solid #ff9800;
  border-radius: 6px;
  color: rgba(255, 255, 255, 0.8);
}
</style>
