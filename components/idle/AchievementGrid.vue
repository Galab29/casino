<script setup lang="ts">
import { computed } from 'vue'
import { IDLE_ACHIEVEMENTS } from '~/constants/idle'
import { useIdleStore } from '~/stores/idle'

const idleStore = useIdleStore()
const unlockedSet = computed(() => new Set(idleStore.achievements))

const unlockedCount = computed(() => idleStore.achievements.length)
const totalCount = computed(() => IDLE_ACHIEVEMENTS.length)
const bonusPercent = computed(() => unlockedCount.value) // +1% c/u
</script>

<template>
  <div class="achievements-section">
    <!-- Resumen de Logros -->
    <v-card class="achievements-header-card mb-6" rounded="xl" elevation="0">
      <v-card-text class="d-flex justify-space-between align-center flex-wrap ga-3 pa-5">
        <div class="d-flex align-center ga-3">
          <v-icon color="#ffd700" size="36">mdi-trophy-variant</v-icon>
          <div>
            <h3 class="ach-header-title mb-0">SALA DE TROFEOS</h3>
            <p class="ach-header-sub mb-0">Cada logro desbloqueado aporta un +1 % permanente a toda la producción.</p>
          </div>
        </div>

        <div class="d-flex align-center ga-3">
          <v-chip color="amber" variant="outlined" size="large" class="font-weight-bold">
            <v-icon start size="18">mdi-trophy-award</v-icon>
            {{ unlockedCount }} / {{ totalCount }} Desbloqueados
          </v-chip>
          <v-chip color="green" variant="flat" size="large" class="font-weight-bold">
            +{{ bonusPercent }} % Producción Global
          </v-chip>
        </div>
      </v-card-text>
    </v-card>

    <!-- Cuadrícula de Logros -->
    <v-row>
      <v-col
        v-for="ach in IDLE_ACHIEVEMENTS"
        :key="ach.id"
        cols="12"
        sm="6"
        md="4"
        lg="3"
      >
        <v-card
          class="ach-card h-100"
          :class="{
            'ach-card--unlocked': unlockedSet.has(ach.id),
            'ach-card--locked': !unlockedSet.has(ach.id)
          }"
          rounded="xl"
          elevation="0"
        >
          <v-card-text class="pa-4 d-flex align-center ga-3">
            <div
              class="ach-icon-box"
              :class="{ 'ach-icon-box--unlocked': unlockedSet.has(ach.id) }"
            >
              <v-icon size="28" :color="unlockedSet.has(ach.id) ? '#ffd700' : 'grey'">
                {{ ach.icon }}
              </v-icon>
            </div>

            <div class="ach-info">
              <div class="d-flex align-center ga-2">
                <h4 class="ach-name mb-0">{{ ach.name }}</h4>
                <v-icon v-if="unlockedSet.has(ach.id)" size="16" color="green">mdi-check-circle</v-icon>
              </div>
              <p class="ach-desc mb-0">{{ ach.description }}</p>
            </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </div>
</template>

<style scoped>
.achievements-header-card {
  background: rgba(22, 22, 34, 0.8) !important;
  border: 1px solid rgba(255, 213, 79, 0.3);
}

.ach-header-title {
  font-family: 'Cinzel', serif;
  font-weight: 800;
  font-size: 1.2rem;
  letter-spacing: 2px;
  color: #ffd54f;
}

.ach-header-sub {
  font-size: 0.85rem;
  color: rgba(255, 255, 255, 0.6);
}

.ach-card {
  background: rgba(22, 22, 34, 0.6) !important;
  border: 1px solid rgba(255, 255, 255, 0.08);
  transition: transform 0.2s ease, border-color 0.2s ease;
}

.ach-card--unlocked {
  background: rgba(25, 30, 22, 0.75) !important;
  border-color: rgba(76, 175, 80, 0.35);
}

.ach-card--locked {
  opacity: 0.55;
  filter: grayscale(0.5);
}

.ach-icon-box {
  width: 44px;
  height: 44px;
  min-width: 44px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
}

.ach-icon-box--unlocked {
  background: rgba(255, 213, 79, 0.15);
  border-color: rgba(255, 213, 79, 0.4);
}

.ach-name {
  font-family: 'Cinzel', serif;
  font-weight: 700;
  font-size: 0.95rem;
  color: #fff;
}

.ach-desc {
  font-size: 0.8rem;
  color: rgba(255, 255, 255, 0.55);
  line-height: 1.3;
}
</style>
