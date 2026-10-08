<script setup lang="ts">
import { ref, computed } from 'vue'
import { IDLE_GENERATORS, IDLE_UPGRADES } from '~/constants/idle'
import { useIdleStore } from '~/stores/idle'
import ProductionBar from '~/components/idle/ProductionBar.vue'
import ClickButton from '~/components/idle/ClickButton.vue'
import GeneratorRow from '~/components/idle/GeneratorRow.vue'
import UpgradeCard from '~/components/idle/UpgradeCard.vue'
import PrestigePanel from '~/components/idle/PrestigePanel.vue'
import AchievementGrid from '~/components/idle/AchievementGrid.vue'

const idleStore = useIdleStore()

// Pestaña activa: 'gerencia' | 'mejoras' | 'prestigio' | 'logros'
const activeTab = ref<'gerencia' | 'mejoras' | 'prestigio' | 'logros'>('gerencia')

// Modo de compra de generadores: 1, 10, 100, max
const buyMode = ref<'1' | '10' | '100' | 'max'>('1')

// Filtros para mejoras: disponibles vs compradas
const purchasedUpgradesSet = computed(() => new Set(idleStore.upgrades))

const availableUpgrades = computed(() => {
  return IDLE_UPGRADES.filter(
    (u) => !purchasedUpgradesSet.value.has(u.id) && idleStore.isUpgradeAvailable(u.id)
  )
})

const purchasedUpgrades = computed(() => {
  return IDLE_UPGRADES.filter((u) => purchasedUpgradesSet.value.has(u.id))
})
</script>

<template>
  <div class="tycoon-hub">
    <!-- Animated background particles and glow -->
    <div class="bg-glow bg-glow--gold" />
    <div class="bg-glow bg-glow--purple" />
    <div v-for="i in 8" :key="i" class="particle" :class="`particle--${i}`" />

    <v-container class="hub-container" fluid>
      <!-- Top Bar / Brand & Navigation -->
      <header class="hub-header mb-4">
        <div class="d-flex justify-space-between align-center flex-wrap ga-3">
          <div class="brand-wrap d-flex align-center ga-3">
            <div class="brand-icon-box">
              <v-icon color="#ffd54f" size="32">mdi-domain</v-icon>
            </div>
            <div>
              <h1 class="brand-title mb-0">ROYAL <span class="text-gold">TYCOON</span></h1>
              <span class="brand-subtitle">Imperio de Casinos & Juegos</span>
            </div>
          </div>

          <!-- Enlace directo al piso de juegos del Casino -->
          <div class="d-flex align-center ga-2">
            <v-btn
              to="/casino"
              color="amber-darken-2"
              rounded="pill"
              variant="elevated"
              prepend-icon="mdi-cards-playing-spade"
              class="casino-floor-btn font-weight-bold"
            >
              Piso de Casino
            </v-btn>
          </div>
        </div>

        <!-- Barra de Pestañas Principal -->
        <v-tabs
          v-model="activeTab"
          color="amber"
          align-tabs="center"
          class="hub-tabs mt-4"
          density="comfortable"
        >
          <v-tab value="gerencia" class="nav-tab">
            <v-icon start size="20">mdi-domain</v-icon>
            Gerencia
          </v-tab>
          <v-tab value="mejoras" class="nav-tab">
            <v-icon start size="20">mdi-arrow-up-bold-box</v-icon>
            Mejoras
            <v-badge
              v-if="availableUpgrades.length > 0"
              :content="availableUpgrades.length"
              color="amber-darken-2"
              inline
              class="ml-1"
            />
          </v-tab>
          <v-tab value="prestigio" class="nav-tab">
            <v-icon start size="20">mdi-license</v-icon>
            Prestigio
            <v-badge
              v-if="idleStore.pendingStars > 0"
              :content="`+${idleStore.pendingStars}★`"
              color="green"
              inline
              class="ml-1"
            />
          </v-tab>
          <v-tab value="logros" class="nav-tab">
            <v-icon start size="20">mdi-trophy</v-icon>
            Logros
          </v-tab>
        </v-tabs>
      </header>

      <!-- Barra de Producción y Fichas (Siempre visible) -->
      <ProductionBar v-model:buyMode="buyMode" />

      <!-- Pestaña 1: Gerencia (Clicker + Generadores) -->
      <div v-show="activeTab === 'gerencia'" class="tab-content">
        <!-- Botón de Click / Propina del Crupier -->
        <ClickButton />

        <!-- Lista de los 8 Generadores -->
        <div class="generators-list">
          <div class="d-flex justify-space-between align-center mb-3">
            <h2 class="section-heading mb-0">
              <v-icon color="amber" class="mr-2">mdi-store-cog</v-icon>
              PISOS & MESAS DE JUEGO
            </h2>
            <span class="text-caption text-grey">Modo de compra activo: x{{ buyMode.toUpperCase() }}</span>
          </div>

          <GeneratorRow
            v-for="gen in IDLE_GENERATORS"
            :key="gen.id"
            :generator="gen"
            :buyMode="buyMode"
          />
        </div>
      </div>

      <!-- Pestaña 2: Mejoras -->
      <div v-show="activeTab === 'mejoras'" class="tab-content">
        <div class="d-flex justify-space-between align-center mb-4">
          <h2 class="section-heading mb-0">
            <v-icon color="amber" class="mr-2">mdi-arrow-up-bold-box</v-icon>
            MEJORAS DISPONIBLES ({{ availableUpgrades.length }})
          </h2>
          <v-chip color="green" size="small" variant="flat">
            {{ purchasedUpgrades.length }} Adquiridas
          </v-chip>
        </div>

        <v-row v-if="availableUpgrades.length > 0">
          <v-col
            v-for="upg in availableUpgrades"
            :key="upg.id"
            cols="12"
            sm="6"
            md="4"
          >
            <UpgradeCard :upgrade="upg" :isPurchased="false" />
          </v-col>
        </v-row>
        <v-alert
          v-else
          type="info"
          color="grey-darken-3"
          variant="tonal"
          rounded="xl"
          class="mb-6"
        >
          No hay más mejoras disponibles en este momento. ¡Sigue comprando generadores para desbloquear más!
        </v-alert>

        <!-- Mejoras ya compradas -->
        <div v-if="purchasedUpgrades.length > 0" class="mt-8">
          <h3 class="section-subheading mb-3 text-grey">
            MEJORAS YA ADQUIRIDAS ({{ purchasedUpgrades.length }})
          </h3>
          <v-row>
            <v-col
              v-for="upg in purchasedUpgrades"
              :key="upg.id"
              cols="12"
              sm="6"
              md="4"
            >
              <UpgradeCard :upgrade="upg" :isPurchased="true" />
            </v-col>
          </v-row>
        </div>
      </div>

      <!-- Pestaña 3: Prestigio -->
      <div v-show="activeTab === 'prestigio'" class="tab-content">
        <PrestigePanel />
      </div>

      <!-- Pestaña 4: Logros -->
      <div v-show="activeTab === 'logros'" class="tab-content">
        <AchievementGrid />
      </div>

      <!-- Footer -->
      <footer class="hub-footer text-center mt-10">
        <p class="text-caption text-grey">
          Royal Casino Tycoon · Todos los derechos reservados · Juega responsablemente
        </p>
      </footer>
    </v-container>

    <!-- Navegación Inferior en Móviles (Bottom Navigation) -->
    <v-bottom-navigation
      v-model="activeTab"
      grow
      color="amber"
      class="mobile-bottom-nav d-sm-none"
    >
      <v-btn value="gerencia">
        <v-icon>mdi-domain</v-icon>
        <span>Gerencia</span>
      </v-btn>
      <v-btn value="mejoras">
        <v-icon>mdi-arrow-up-bold-box</v-icon>
        <span>Mejoras</span>
      </v-btn>
      <v-btn to="/casino">
        <v-icon>mdi-cards-playing-spade</v-icon>
        <span>Casino</span>
      </v-btn>
      <v-btn value="prestigio">
        <v-icon>mdi-license</v-icon>
        <span>Prestigio</span>
      </v-btn>
      <v-btn value="logros">
        <v-icon>mdi-trophy</v-icon>
        <span>Logros</span>
      </v-btn>
    </v-bottom-navigation>
  </div>
</template>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@700;800;900&family=Outfit:wght@400;500;600;700;800&display=swap');

.tycoon-hub {
  min-height: 100vh;
  background: radial-gradient(ellipse at 50% 0%, #151525 0%, #0d0d18 45%, #05050c 100%);
  position: relative;
  overflow-x: hidden;
  font-family: 'Outfit', sans-serif;
  color: #fff;
  padding-bottom: 70px; /* Espacio para bottom nav en móvil */
}

.hub-container {
  max-width: 1100px;
  position: relative;
  z-index: 1;
  padding-top: 24px;
}

/* Glows */
.bg-glow {
  position: absolute;
  border-radius: 50%;
  filter: blur(100px);
  pointer-events: none;
}
.bg-glow--gold {
  width: 500px;
  height: 500px;
  background: #ffd54f;
  top: -150px;
  left: 50%;
  transform: translateX(-50%);
  opacity: 0.08;
}
.bg-glow--purple {
  width: 400px;
  height: 400px;
  background: #7c4dff;
  bottom: 10%;
  right: -100px;
  opacity: 0.06;
}

/* Particles */
.particle {
  position: absolute;
  width: 4px;
  height: 4px;
  background: rgba(255, 213, 79, 0.3);
  border-radius: 50%;
  pointer-events: none;
  animation: particle-rise 16s linear infinite;
}
.particle--1 { left: 10%; animation-duration: 20s; }
.particle--2 { left: 30%; animation-duration: 15s; animation-delay: 2s; }
.particle--3 { left: 50%; animation-duration: 18s; animation-delay: 5s; }
.particle--4 { left: 70%; animation-duration: 22s; animation-delay: 1s; }
.particle--5 { left: 90%; animation-duration: 17s; animation-delay: 4s; }

@keyframes particle-rise {
  0% { bottom: -10px; opacity: 0; }
  15% { opacity: 0.5; }
  85% { opacity: 0.3; }
  100% { bottom: 110vh; opacity: 0; }
}

/* Brand */
.brand-icon-box {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  background: rgba(255, 213, 79, 0.12);
  border: 1px solid rgba(255, 213, 79, 0.3);
  display: flex;
  align-items: center;
  justify-content: center;
}

.brand-title {
  font-family: 'Cinzel', serif;
  font-weight: 900;
  font-size: 1.4rem;
  letter-spacing: 3px;
  color: #fff;
  line-height: 1.1;
}

.text-gold {
  color: #ffd54f;
  text-shadow: 0 0 10px rgba(255, 213, 79, 0.4);
}

.brand-subtitle {
  font-size: 0.75rem;
  color: rgba(255, 255, 255, 0.5);
  letter-spacing: 1px;
}

.casino-floor-btn {
  font-family: 'Cinzel', serif;
  letter-spacing: 1px;
  box-shadow: 0 4px 15px rgba(255, 179, 0, 0.3);
}

/* Hub Tabs */
.hub-tabs {
  background: rgba(0, 0, 0, 0.3);
  border-radius: 14px;
  border: 1px solid rgba(255, 255, 255, 0.08);
}

.nav-tab {
  font-weight: 700;
  letter-spacing: 1px;
  font-size: 0.85rem;
}

/* Section Headings */
.section-heading {
  font-family: 'Cinzel', serif;
  font-weight: 800;
  font-size: 1.15rem;
  letter-spacing: 2px;
  color: #fff;
  display: flex;
  align-items: center;
}

.section-subheading {
  font-family: 'Cinzel', serif;
  font-weight: 700;
  font-size: 0.95rem;
  letter-spacing: 1.5px;
}

/* Mobile Bottom Nav */
.mobile-bottom-nav {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: rgba(12, 12, 20, 0.95) !important;
  backdrop-filter: blur(12px);
  border-top: 1px solid rgba(255, 213, 79, 0.2);
  z-index: 1000;
}
</style>
