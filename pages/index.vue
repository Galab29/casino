<script setup lang="ts">
import { computed } from 'vue'
import { useBlackjackStore } from '~/stores/blackjack'

const nuxtApp = useNuxtApp()
const wallet = useBlackjackStore(nuxtApp.$pinia)
const chips = computed(() => wallet.player.chips)

interface GameCard {
  title: string
  icon: string
  description: string
  route?: string
  available: boolean
  gradient: string
  accentColor: string
}

const games: GameCard[] = [
  {
    title: 'Blackjack',
    icon: 'mdi-cards',
    description: 'El clásico juego de 21. Vence al dealer sin pasarte.',
    route: '/blackjack',
    available: true,
    gradient: 'linear-gradient(135deg, #1b5e20 0%, #2e7d32 50%, #43a047 100%)',
    accentColor: '#ffd54f',
  },
  {
    title: 'Poker',
    icon: 'mdi-cards-playing-spade',
    description: 'Texas Hold\'em No Limit. Farolea, sube y gana el bote.',
    route: '/poker',
    available: true,
    gradient: 'linear-gradient(135deg, #b71c1c 0%, #c62828 50%, #e53935 100%)',
    accentColor: '#ef5350',
  },
  {
    title: 'Ruleta',
    icon: 'mdi-circle-slice-6',
    description: 'Ruleta Europea de 37 casillas. Apuesta a plenos, docenas, colores y gana hasta 35 a 1.',
    route: '/ruleta',
    available: true,
    gradient: 'linear-gradient(135deg, #4a148c 0%, #6a1b9a 50%, #8e24aa 100%)',
    accentColor: '#ce93d8',
  },
  {
    title: 'Tragamonedas',
    icon: 'mdi-slot-machine',
    description: '3 máquinas: más cara, más premio y menos probabilidad.',
    route: '/tragamonedas',
    available: true,
    gradient: 'linear-gradient(135deg, #e65100 0%, #ef6c00 50%, #f57c00 100%)',
    accentColor: '#ffb74d',
  },
  {
    title: 'Baccarat',
    icon: 'mdi-cards-diamond',
    description: 'Punto Banco oficial. Apuesta al Jugador, al Banco o al Empate.',
    route: '/baccarat',
    available: true,
    gradient: 'linear-gradient(135deg, #01579b 0%, #0277bd 50%, #0288d1 100%)',
    accentColor: '#4fc3f7',
  },
  {
    title: 'Dados',
    icon: 'mdi-dice-multiple',
    description: 'El electrizante Craps de Las Vegas. Pass Line, Field, Place Bets y pagos de hasta 30 a 1.',
    route: '/dados',
    available: true,
    gradient: 'linear-gradient(135deg, #134e23 0%, #1b5e20 50%, #2e7d32 100%)',
    accentColor: '#ffd54f',
  },
]
</script>

<template>
  <div class="casino-lobby">
    <!-- Animated background elements -->
    <div class="bg-glow bg-glow--1" />
    <div class="bg-glow bg-glow--2" />
    <div class="bg-glow bg-glow--3" />

    <!-- Floating particles -->
    <div v-for="i in 12" :key="i" class="particle" :class="`particle--${i}`" />

    <v-container class="lobby-content" fluid>
      <!-- Hero Section -->
      <v-row justify="center" class="mb-6">
        <v-col cols="12" class="text-center">
          <div class="casino-logo mb-2">
            <v-icon color="amber" size="56" class="logo-icon">mdi-poker-chip</v-icon>
          </div>
          <h1 class="casino-title">
            ROYAL<span class="title-accent">CASINO</span>
          </h1>
          <p class="casino-subtitle">Elige tu juego y demuestra tu suerte</p>

          <!-- Saldo Global Compartido del Casino -->
          <div class="lobby-balance-wrap d-flex justify-center align-center ga-3 mt-3 mb-2 flex-wrap">
            <div class="balance-pill">
              <v-icon color="amber" size="22" class="mr-2">mdi-poker-chip</v-icon>
              <span class="balance-title mr-1">Saldo del Casino:</span>
              <span class="balance-value">{{ chips.toLocaleString() }}</span>
              <span class="balance-label ml-1">fichas</span>
            </div>
            <v-btn
              v-if="chips < 100"
              variant="elevated"
              color="amber-darken-2"
              size="small"
              rounded="pill"
              prepend-icon="mdi-gift"
              class="elevation-4 refill-btn"
              @click="wallet.refillChips(1000)"
            >
              +1,000 Fichas Gratis
            </v-btn>
          </div>

          <div class="title-divider">
            <span class="divider-diamond">◆</span>
          </div>
        </v-col>
      </v-row>

      <!-- Games Grid -->
      <v-row justify="center" class="games-grid">
        <v-col
          v-for="game in games"
          :key="game.title"
          cols="12"
          sm="6"
          md="4"
          class="game-col"
        >
          <v-card
            class="game-card"
            :class="{ 'game-card--available': game.available, 'game-card--locked': !game.available }"
            rounded="xl"
            elevation="0"
          >
            <!-- Card glow effect for available games -->
            <div v-if="game.available" class="card-glow" />

            <!-- Card background -->
            <div class="card-bg" :style="{ background: game.gradient }" />

            <v-card-text class="card-content d-flex flex-column align-center text-center pa-6">
              <!-- Icon -->
              <div class="game-icon-wrapper mb-4">
                <v-icon
                  :color="game.available ? game.accentColor : 'grey'"
                  size="52"
                  class="game-icon"
                >
                  {{ game.icon }}
                </v-icon>
              </div>

              <!-- Title -->
              <h2 class="game-name mb-2">{{ game.title }}</h2>

              <!-- Badge -->
              <v-chip
                v-if="!game.available"
                size="small"
                color="grey-darken-1"
                variant="flat"
                class="coming-soon-chip mb-3"
                prepend-icon="mdi-clock-outline"
              >
                Próximamente
              </v-chip>
              <v-chip
                v-else
                size="small"
                color="green"
                variant="flat"
                class="available-chip mb-3"
                prepend-icon="mdi-check-circle"
              >
                Disponible
              </v-chip>

              <!-- Description -->
              <p class="game-description mb-4">{{ game.description }}</p>

              <!-- Action Button -->
              <v-btn
                v-if="game.available"
                :to="game.route ?? undefined"
                color="amber-darken-2"
                size="large"
                variant="elevated"
                rounded="lg"
                class="play-btn"
                prepend-icon="mdi-play-circle"
                block
              >
                JUGAR
              </v-btn>
              <v-btn
                v-else
                disabled
                size="large"
                variant="outlined"
                rounded="lg"
                class="locked-btn"
                prepend-icon="mdi-lock"
                block
              >
                BLOQUEADO
              </v-btn>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>

      <!-- Footer -->
      <v-row justify="center" class="mt-10">
        <v-col cols="12" class="text-center">
          <p class="footer-text">
            <v-icon size="14" class="mr-1">mdi-information-outline</v-icon>
            Juega responsablemente · Solo con fines educativos
          </p>
        </v-col>
      </v-row>
    </v-container>
  </div>
</template>

<style scoped>
/* ─── Google Fonts ────────────────────── */
@import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@600;700;900&family=Outfit:wght@300;400;500;600;700&display=swap');

/* ─── Lobby Background ──────────────── */
.casino-lobby {
  min-height: 100vh;
  background: radial-gradient(ellipse at 50% 0%, #1a1a2e 0%, #0f0f1a 40%, #050510 100%);
  position: relative;
  overflow: hidden;
  font-family: 'Outfit', sans-serif;
  color: #fff;
}

/* ─── Background Glows ──────────────── */
.bg-glow {
  position: absolute;
  border-radius: 50%;
  filter: blur(80px);
  opacity: 0.12;
  pointer-events: none;
}
.bg-glow--1 {
  width: 600px;
  height: 600px;
  background: #ffd54f;
  top: -200px;
  left: 50%;
  transform: translateX(-50%);
  animation: glow-pulse 8s ease-in-out infinite;
}
.bg-glow--2 {
  width: 400px;
  height: 400px;
  background: #e53935;
  bottom: -100px;
  left: -100px;
  animation: glow-pulse 12s ease-in-out infinite reverse;
}
.bg-glow--3 {
  width: 350px;
  height: 350px;
  background: #7c4dff;
  bottom: 20%;
  right: -80px;
  animation: glow-pulse 10s ease-in-out infinite 2s;
}

@keyframes glow-pulse {
  0%, 100% { opacity: 0.08; transform: scale(1); }
  50% { opacity: 0.18; transform: scale(1.15); }
}

/* ─── Floating Particles ────────────── */
.particle {
  position: absolute;
  width: 4px;
  height: 4px;
  background: rgba(255, 213, 79, 0.4);
  border-radius: 50%;
  pointer-events: none;
  animation: particle-float linear infinite;
}

.particle--1  { left: 5%;  animation-duration: 18s; animation-delay: 0s; }
.particle--2  { left: 15%; animation-duration: 22s; animation-delay: 2s; }
.particle--3  { left: 25%; animation-duration: 16s; animation-delay: 4s; }
.particle--4  { left: 35%; animation-duration: 20s; animation-delay: 1s; }
.particle--5  { left: 45%; animation-duration: 24s; animation-delay: 3s; }
.particle--6  { left: 55%; animation-duration: 19s; animation-delay: 5s; }
.particle--7  { left: 65%; animation-duration: 21s; animation-delay: 0.5s; }
.particle--8  { left: 75%; animation-duration: 17s; animation-delay: 2.5s; }
.particle--9  { left: 85%; animation-duration: 23s; animation-delay: 4.5s; }
.particle--10 { left: 92%; animation-duration: 18s; animation-delay: 1.5s; }
.particle--11 { left: 10%; animation-duration: 25s; animation-delay: 6s; width: 3px; height: 3px; }
.particle--12 { left: 70%; animation-duration: 20s; animation-delay: 3.5s; width: 5px; height: 5px; }

@keyframes particle-float {
  0%   { bottom: -10px; opacity: 0; }
  10%  { opacity: 0.6; }
  90%  { opacity: 0.2; }
  100% { bottom: 110vh; opacity: 0; }
}

/* ─── Lobby Content ─────────────────── */
.lobby-content {
  position: relative;
  z-index: 1;
  padding-top: 48px;
  padding-bottom: 48px;
  max-width: 1200px;
}

/* ─── Casino Logo & Title ───────────── */
.casino-logo {
  animation: logo-float 4s ease-in-out infinite;
}

.logo-icon {
  filter: drop-shadow(0 0 20px rgba(255, 213, 79, 0.5));
}

@keyframes logo-float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-8px); }
}

.casino-title {
  font-family: 'Cinzel', serif;
  font-weight: 900;
  font-size: 3.2rem;
  letter-spacing: 12px;
  color: #e0e0e0;
  line-height: 1.1;
}

.title-accent {
  background: linear-gradient(135deg, #ffd54f, #ff8f00);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
}

.casino-subtitle {
  font-family: 'Outfit', sans-serif;
  font-weight: 300;
  font-size: 1.15rem;
  color: rgba(255, 255, 255, 0.45);
  letter-spacing: 3px;
  margin-top: 8px;
}

.title-divider {
  margin-top: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
}
.title-divider::before,
.title-divider::after {
  content: '';
  width: 80px;
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(255, 213, 79, 0.4), transparent);
}
.divider-diamond {
  color: #ffd54f;
  font-size: 10px;
  opacity: 0.6;
}

/* ─── Games Grid ────────────────────── */
.games-grid {
  max-width: 960px;
  margin: 0 auto;
}

.game-col {
  display: flex;
}

/* ─── Game Card ─────────────────────── */
.game-card {
  position: relative;
  overflow: hidden;
  width: 100%;
  border: 1px solid rgba(255, 255, 255, 0.06);
  transition: transform 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94),
              box-shadow 0.4s ease,
              border-color 0.4s ease;
  background: transparent !important;
}

.game-card--available:hover {
  transform: translateY(-8px) scale(1.02);
  box-shadow: 0 20px 60px rgba(255, 213, 79, 0.15);
  border-color: rgba(255, 213, 79, 0.25);
}

.game-card--locked {
  opacity: 0.55;
}
.game-card--locked:hover {
  transform: translateY(-2px);
}

/* Card background layer */
.card-bg {
  position: absolute;
  inset: 0;
  opacity: 0.25;
  transition: opacity 0.4s ease;
}
.game-card--available:hover .card-bg {
  opacity: 0.4;
}

/* Glow effect */
.card-glow {
  position: absolute;
  top: -50%;
  left: -50%;
  width: 200%;
  height: 200%;
  background: radial-gradient(circle at center, rgba(255, 213, 79, 0.06) 0%, transparent 60%);
  opacity: 0;
  transition: opacity 0.4s ease;
  pointer-events: none;
}
.game-card--available:hover .card-glow {
  opacity: 1;
}

/* ─── Card Content ──────────────────── */
.card-content {
  position: relative;
  z-index: 1;
}

.game-icon-wrapper {
  width: 88px;
  height: 88px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.08);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform 0.4s ease, background 0.4s ease;
}

.game-card--available:hover .game-icon-wrapper {
  transform: scale(1.1) rotate(5deg);
  background: rgba(255, 255, 255, 0.1);
}

.game-icon {
  transition: transform 0.4s ease;
}
.game-card--available:hover .game-icon {
  transform: scale(1.1);
}

.game-name {
  font-family: 'Cinzel', serif;
  font-weight: 700;
  font-size: 1.35rem;
  letter-spacing: 3px;
  color: #fafafa;
}

.coming-soon-chip {
  font-weight: 600;
  letter-spacing: 0.5px;
  font-size: 11px;
}

.available-chip {
  font-weight: 600;
  letter-spacing: 0.5px;
  font-size: 11px;
  animation: chip-glow 2.5s ease-in-out infinite;
}

@keyframes chip-glow {
  0%, 100% { box-shadow: 0 0 4px rgba(76, 175, 80, 0.3); }
  50% { box-shadow: 0 0 16px rgba(76, 175, 80, 0.5); }
}

.game-description {
  font-size: 0.9rem;
  color: rgba(255, 255, 255, 0.5);
  line-height: 1.5;
  min-height: 44px;
}

/* ─── Buttons ───────────────────────── */
.play-btn {
  font-weight: 700;
  letter-spacing: 2px;
  font-size: 0.95rem;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}
.play-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 30px rgba(255, 193, 7, 0.35);
}

.locked-btn {
  font-weight: 600;
  letter-spacing: 1px;
  border-color: rgba(255, 255, 255, 0.12) !important;
  color: rgba(255, 255, 255, 0.3) !important;
}

/* ─── Footer ────────────────────────── */
.footer-text {
  font-size: 0.8rem;
  color: rgba(255, 255, 255, 0.25);
  letter-spacing: 1px;
}

/* ─── Balance Pill ──────────────────── */
.balance-pill {
  display: inline-flex;
  align-items: center;
  background: rgba(0, 0, 0, 0.45);
  border: 1.5px solid rgba(255, 213, 79, 0.4);
  border-radius: 24px;
  padding: 8px 22px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.4), 0 0 15px rgba(255, 213, 79, 0.15);
}

.balance-title {
  font-size: 0.8rem;
  color: rgba(255, 255, 255, 0.6);
  font-weight: 500;
}

.balance-value {
  font-family: 'Cinzel', serif;
  font-size: 1.4rem;
  font-weight: 900;
  color: #ffd54f;
  text-shadow: 0 0 10px rgba(255, 213, 79, 0.5);
}

.balance-label {
  font-size: 0.75rem;
  color: rgba(255, 255, 255, 0.5);
}

.refill-btn {
  font-weight: 700;
  letter-spacing: 1px;
}

/* ─── Responsive ────────────────────── */
@media (max-width: 600px) {
  .casino-title {
    font-size: 2rem;
    letter-spacing: 6px;
  }
  .casino-subtitle {
    font-size: 0.9rem;
    letter-spacing: 1px;
  }
  .lobby-content {
    padding-top: 32px;
  }
}
</style>
