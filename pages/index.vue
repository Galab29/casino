<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useBlackjackStore } from '~/stores/blackjack'
import RechargeDialog from '~/components/common/RechargeDialog.vue'

const nuxtApp = useNuxtApp()
const wallet = useBlackjackStore(nuxtApp.$pinia)
const chips = computed(() => wallet.player.chips)
const showRechargeModal = ref(false)
const showMenuDrawer = ref(false)

onMounted(() => {
  wallet.syncWithServer()
})

interface GameItem {
  id: string
  title: string
  tagColor: string
  description: string
  route: string
  status: string
  themeClass: string
}

const games: GameItem[] = [
  {
    id: 'blackjack',
    title: 'BLACKJACK',
    tagColor: '#16a34a',
    description: 'El clásico juego de 21. Vence al dealer sin pasarte.',
    route: '/blackjack',
    status: 'Disponible',
    themeClass: 'game-blackjack',
  },
  {
    id: 'poker',
    title: 'POKER',
    tagColor: '#dc2626',
    description: "Texas Hold'em. Limita, farolea y sube el bote.",
    route: '/poker',
    status: 'Disponible',
    themeClass: 'game-poker',
  },
  {
    id: 'ruleta',
    title: 'RULETA',
    tagColor: '#9333ea',
    description: 'Apuesta a números, colores y mucho más.',
    route: '/ruleta',
    status: 'Disponible',
    themeClass: 'game-roulette',
  },
  {
    id: 'tragamonedas',
    title: 'TRAGAMONEDAS',
    tagColor: '#d97706',
    description: 'Tres máquinas, más cara o más premio.',
    route: '/tragamonedas',
    status: 'Disponible',
    themeClass: 'game-slots',
  },
  {
    id: 'baccarat',
    title: 'BACCARAT',
    tagColor: '#0284c7',
    description: 'Elige jugador, banca o empate.',
    route: '/baccarat',
    status: 'Disponible',
    themeClass: 'game-baccarat',
  },
  {
    id: 'dados',
    title: 'DADOS',
    tagColor: '#16a34a',
    description: 'Prueba tu suerte con los dados.',
    route: '/dados',
    status: 'Disponible',
    themeClass: 'game-dice',
  },
]
</script>

<template>
  <div class="casino-home">
    <!-- Fondos decorativos atmosféricos -->
    <div class="crt-scanlines" />
    <div class="side-coin side-coin--left" />
    <div class="side-coin side-coin--right" />
    <div class="bottom-coins bottom-coins--left" />
    <div class="bottom-coins bottom-coins--right" />

    <!-- ═══ Cabecera Superior Principal ═══ -->
    <header class="casino-header">
      <!-- Logo y Subtítulo -->
      <div class="logo-group">
        <div class="casino-logo">
          <span class="pixel-crown">👑</span>
          <span class="logo-text">ROYAL CASINO</span>
          <span class="pixel-crown">👑</span>
        </div>
        <p class="casino-subtitle">8-BIT RETRO ARCADE CASINO · 100% PIXEL ART</p>
      </div>

      <!-- Barra de herramientas (Saldo + Recargar + Menú) -->
      <div class="casino-toolbar">
        <!-- Píldora de Saldo -->
        <div class="casino-balance">
          <div class="balance-icon-wrap">
            <svg class="pixel-coin-icon" viewBox="0 0 24 24" width="28" height="28">
              <circle cx="12" cy="12" r="10" fill="#f59e0b" stroke="#78350f" stroke-width="2" />
              <circle cx="12" cy="12" r="7" fill="#fbbf24" stroke="#d97706" stroke-width="1.5" />
              <rect x="10.5" y="7.5" width="3" height="9" fill="#78350f" />
              <rect x="9" y="9" width="6" height="2" fill="#78350f" />
              <rect x="9" y="13" width="6" height="2" fill="#78350f" />
            </svg>
          </div>
          <div class="balance-text-wrap">
            <span class="balance-label">Saldo del casino:</span>
            <strong class="balance-number">{{ chips.toLocaleString() }}</strong>
          </div>
        </div>

        <!-- Botón Recargar Monedas -->
        <button
          type="button"
          class="casino-btn-gold recharge-btn"
          @click="showRechargeModal = true"
        >
          <svg class="btn-coin-icon mr-1" viewBox="0 0 24 24" width="18" height="18">
            <circle cx="12" cy="12" r="9" fill="#f59e0b" stroke="#451a03" stroke-width="2" />
            <circle cx="12" cy="12" r="6" fill="#fde68a" stroke="#d97706" stroke-width="1" />
          </svg>
          RECARGAR MONEDAS
        </button>

        <!-- Botón Hamburguesa -->
        <button
          type="button"
          class="casino-burger-btn"
          title="Menú del Casino"
          @click="showMenuDrawer = !showMenuDrawer"
        >
          <span class="burger-bar" />
          <span class="burger-bar" />
          <span class="burger-bar" />
        </button>
      </div>
    </header>

    <!-- ═══ Cuadrícula de Juegos (2 filas x 3 columnas) ═══ -->
    <main class="casino-games">
      <article
        v-for="game in games"
        :key="game.id"
        class="casino-card"
        :class="game.themeClass"
      >
        <!-- Decoraciones de esquinas pixeladas -->
        <span class="pixel-corner corner--tl" />
        <span class="pixel-corner corner--tr" />
        <span class="pixel-corner corner--bl" />
        <span class="pixel-corner corner--br" />

        <!-- Cuerpo superior de la tarjeta -->
        <div class="card-body">
          <!-- Icono / Ilustración Pixel Art del juego -->
          <div class="casino-icon">
            <!-- BLACKJACK: Cartas A♠ y J♥ -->
            <svg
              v-if="game.id === 'blackjack'"
              viewBox="0 0 64 64"
              width="64"
              height="64"
              class="game-pixel-art"
            >
              <!-- Carta 1 (A Picas) -->
              <rect x="6" y="10" width="28" height="42" rx="2" fill="#f8fafc" stroke="#000" stroke-width="2" />
              <text x="10" y="22" font-family="'Press Start 2P', monospace" font-size="9" font-weight="bold" fill="#000">A</text>
              <path d="M 20 28 C 17 32, 14 36, 17 38 C 19 39, 21 37, 20 35 C 20 37, 21 40, 22 41 L 18 41 L 22 41 C 23 40, 24 37, 24 35 C 23 37, 25 39, 27 38 C 30 36, 27 32, 24 28 Z" fill="#000" />
              
              <!-- Carta 2 (J Corazones) -->
              <rect x="22" y="14" width="28" height="42" rx="2" fill="#fff" stroke="#000" stroke-width="2" />
              <text x="26" y="26" font-family="'Press Start 2P', monospace" font-size="9" font-weight="bold" fill="#dc2626">J</text>
              <path d="M 36 32 C 34 29, 30 31, 32 35 L 36 41 L 40 35 C 42 31, 38 29, 36 32 Z" fill="#dc2626" />

              <!-- Chispitas amarillas -->
              <rect x="44" y="6" width="3" height="3" fill="#ffd54f" />
              <rect x="52" y="14" width="2" height="2" fill="#ffd54f" />
            </svg>

            <!-- POKER: Cartas A♥ K♠ + Fichas -->
            <svg
              v-else-if="game.id === 'poker'"
              viewBox="0 0 64 64"
              width="64"
              height="64"
              class="game-pixel-art"
            >
              <!-- Carta As Corazones -->
              <rect x="14" y="6" width="26" height="38" rx="2" fill="#fff" stroke="#000" stroke-width="2" transform="rotate(-10 27 25)" />
              <text x="18" y="18" font-family="'Press Start 2P', monospace" font-size="8" font-weight="bold" fill="#dc2626">A</text>
              
              <!-- Carta Rey Picas -->
              <rect x="26" y="8" width="26" height="38" rx="2" fill="#f8fafc" stroke="#000" stroke-width="2" transform="rotate(12 39 27)" />
              <text x="44" y="22" font-family="'Press Start 2P', monospace" font-size="8" font-weight="bold" fill="#000">K</text>

              <!-- Fichas de Casino Apiladas -->
              <g transform="translate(6, 28)">
                <ellipse cx="14" cy="22" rx="10" ry="4" fill="#1e40af" stroke="#000" stroke-width="1.5" />
                <ellipse cx="14" cy="18" rx="10" ry="4" fill="#3b82f6" stroke="#000" stroke-width="1.5" />
                <ellipse cx="14" cy="14" rx="10" ry="4" fill="#60a5fa" stroke="#000" stroke-width="1.5" />
                <ellipse cx="14" cy="10" rx="10" ry="4" fill="#3b82f6" stroke="#000" stroke-width="1.5" />

                <ellipse cx="26" cy="24" rx="10" ry="4" fill="#991b1b" stroke="#000" stroke-width="1.5" />
                <ellipse cx="26" cy="20" rx="10" ry="4" fill="#dc2626" stroke="#000" stroke-width="1.5" />
                <ellipse cx="26" cy="16" rx="10" ry="4" fill="#ef4444" stroke="#000" stroke-width="1.5" />
              </g>
            </svg>

            <!-- RULETA: Rueda multicolor pixel art -->
            <svg
              v-else-if="game.id === 'ruleta'"
              viewBox="0 0 64 64"
              width="64"
              height="64"
              class="game-pixel-art"
            >
              <circle cx="32" cy="32" r="26" fill="#1e293b" stroke="#000" stroke-width="3" />
              <circle cx="32" cy="32" r="23" fill="#b45309" stroke="#78350f" stroke-width="2" />
              <!-- Sectores rojo, negro y verde -->
              <path d="M 32 32 L 32 10 A 22 22 0 0 1 48 16 Z" fill="#dc2626" stroke="#000" stroke-width="1" />
              <path d="M 32 32 L 48 16 A 22 22 0 0 1 54 32 Z" fill="#18181b" stroke="#000" stroke-width="1" />
              <path d="M 32 32 L 54 32 A 22 22 0 0 1 48 48 Z" fill="#dc2626" stroke="#000" stroke-width="1" />
              <path d="M 32 32 L 48 48 A 22 22 0 0 1 32 54 Z" fill="#18181b" stroke="#000" stroke-width="1" />
              <path d="M 32 32 L 32 54 A 22 22 0 0 1 16 48 Z" fill="#dc2626" stroke="#000" stroke-width="1" />
              <path d="M 32 32 L 16 48 A 22 22 0 0 1 10 32 Z" fill="#18181b" stroke="#000" stroke-width="1" />
              <path d="M 32 32 L 10 32 A 22 22 0 0 1 16 16 Z" fill="#dc2626" stroke="#000" stroke-width="1" />
              <path d="M 32 32 L 16 16 A 22 22 0 0 1 32 10 Z" fill="#15803d" stroke="#000" stroke-width="1" />
              <!-- Centro dorado -->
              <circle cx="32" cy="32" r="10" fill="#fbbf24" stroke="#78350f" stroke-width="2" />
              <circle cx="32" cy="32" r="4" fill="#d97706" />
              <rect x="30" y="26" width="4" height="12" fill="#fef08a" />
              <rect x="26" y="30" width="12" height="4" fill="#fef08a" />
            </svg>

            <!-- TRAGAMONEDAS: Gabinete 777 con palanca -->
            <svg
              v-else-if="game.id === 'tragamonedas'"
              viewBox="0 0 64 64"
              width="64"
              height="64"
              class="game-pixel-art"
            >
              <!-- Carcasa principal -->
              <rect x="10" y="10" width="38" height="44" rx="3" fill="#dc2626" stroke="#000" stroke-width="3" />
              <!-- Corona superior -->
              <rect x="12" y="12" width="34" height="6" fill="#fbbf24" />
              <circle cx="16" cy="15" r="1.5" fill="#fff" />
              <circle cx="23" cy="15" r="1.5" fill="#fff" />
              <circle cx="30" cy="15" r="1.5" fill="#fff" />
              <circle cx="37" cy="15" r="1.5" fill="#fff" />
              <circle cx="44" cy="15" r="1.5" fill="#fff" />

              <!-- Pantalla de rodillos -->
              <rect x="13" y="20" width="32" height="22" rx="2" fill="#fff" stroke="#000" stroke-width="2" />
              <line x1="23" y1="20" x2="23" y2="42" stroke="#94a3b8" stroke-width="1.5" />
              <line x1="34" y1="20" x2="34" y2="42" stroke="#94a3b8" stroke-width="1.5" />
              <text x="14" y="36" font-family="'Press Start 2P', monospace" font-size="10" font-weight="bold" fill="#dc2626">7</text>
              <text x="25" y="36" font-family="'Press Start 2P', monospace" font-size="10" font-weight="bold" fill="#dc2626">7</text>
              <text x="36" y="36" font-family="'Press Start 2P', monospace" font-size="10" font-weight="bold" fill="#dc2626">7</text>

              <!-- Bandeja de monedas inferior -->
              <rect x="15" y="45" width="28" height="5" fill="#991b1b" stroke="#000" stroke-width="1.5" />

              <!-- Palanca derecha -->
              <line x1="48" y1="36" x2="56" y2="28" stroke="#78350f" stroke-width="3" stroke-linecap="round" />
              <circle cx="56" cy="28" r="4.5" fill="#ef4444" stroke="#000" stroke-width="1.5" />
            </svg>

            <!-- BACCARAT: Diamante rojo brillante de píxeles -->
            <svg
              v-else-if="game.id === 'baccarat'"
              viewBox="0 0 64 64"
              width="64"
              height="64"
              class="game-pixel-art"
            >
              <!-- Diamante exterior -->
              <polygon points="32,6 56,32 32,58 8,32" fill="#991b1b" stroke="#000" stroke-width="3" />
              <polygon points="32,10 52,32 32,54 12,32" fill="#dc2626" />
              <!-- Facetas de brillo -->
              <polygon points="32,14 46,32 32,48 18,32" fill="#ef4444" />
              <polygon points="32,18 40,32 32,42 24,32" fill="#f87171" />
              <!-- Reflejo blanco de píxel -->
              <rect x="28" y="24" width="4" height="4" fill="#fff" />
              <rect x="32" y="20" width="4" height="4" fill="#fff" />
            </svg>

            <!-- DADOS: Dos dados blancos en 3D isométrico -->
            <svg
              v-else-if="game.id === 'dados'"
              viewBox="0 0 64 64"
              width="64"
              height="64"
              class="game-pixel-art"
            >
              <!-- Dado 1 (Izquierdo) -->
              <g transform="translate(6, 16)">
                <!-- Cara superior -->
                <polygon points="14,0 26,6 14,12 2,6" fill="#ffffff" stroke="#000" stroke-width="2" />
                <circle cx="14" cy="6" r="1.5" fill="#000" />
                <!-- Cara izquierda -->
                <polygon points="2,6 14,12 14,26 2,20" fill="#e2e8f0" stroke="#000" stroke-width="2" />
                <circle cx="6" cy="13" r="1.2" fill="#000" />
                <circle cx="10" cy="19" r="1.2" fill="#000" />
                <!-- Cara derecha -->
                <polygon points="14,12 26,6 26,20 14,26" fill="#cbd5e1" stroke="#000" stroke-width="2" />
                <circle cx="18" cy="16" r="1.2" fill="#000" />
                <circle cx="22" cy="11" r="1.2" fill="#000" />
                <circle cx="22" cy="21" r="1.2" fill="#000" />
              </g>

              <!-- Dado 2 (Derecho) -->
              <g transform="translate(28, 10)">
                <!-- Cara superior -->
                <polygon points="14,0 26,6 14,12 2,6" fill="#ffffff" stroke="#000" stroke-width="2" />
                <circle cx="8" cy="4" r="1.2" fill="#000" />
                <circle cx="20" cy="8" r="1.2" fill="#000" />
                <circle cx="14" cy="6" r="1.2" fill="#000" />
                <!-- Cara izquierda -->
                <polygon points="2,6 14,12 14,26 2,20" fill="#e2e8f0" stroke="#000" stroke-width="2" />
                <circle cx="5" cy="12" r="1.2" fill="#000" />
                <circle cx="11" cy="20" r="1.2" fill="#000" />
                <circle cx="5" cy="18" r="1.2" fill="#000" />
                <circle cx="11" cy="14" r="1.2" fill="#000" />
                <!-- Cara derecha -->
                <polygon points="14,12 26,6 26,20 14,26" fill="#cbd5e1" stroke="#000" stroke-width="2" />
                <circle cx="18" cy="15" r="1.5" fill="#000" />
                <circle cx="22" cy="19" r="1.5" fill="#000" />
              </g>
            </svg>
          </div>

          <!-- Texto descriptivo a la derecha -->
          <div class="card-info">
            <h2 class="casino-title">{{ game.title }}</h2>
            <p class="casino-description">{{ game.description }}</p>
            <div class="casino-status">
              <span class="status-dot" />
              <span class="status-text">{{ game.status }}</span>
            </div>
          </div>
        </div>

        <!-- Botón Inferior INSERT COIN · JUGAR -->
        <NuxtLink :to="game.route" class="casino-btn-gold insert-coin-btn">
          <span class="spade-icon">♠</span>
          <span>INSERT COIN · JUGAR</span>
        </NuxtLink>
      </article>
    </main>

    <!-- Diálogo de Recarga por Códigos -->
    <RechargeDialog v-model="showRechargeModal" />

    <!-- Menú Lateral Retro para el Botón Hamburguesa -->
    <v-dialog v-model="showMenuDrawer" max-width="380">
      <div class="pixel-menu-card">
        <div class="pixel-menu-header">
          <span class="pixel-menu-title">OPCIONES DEL CASINO</span>
          <button class="pixel-menu-close" @click="showMenuDrawer = false">✕</button>
        </div>
        <div class="pixel-menu-body">
          <NuxtLink to="/admin" class="menu-item-btn" @click="showMenuDrawer = false">
            <span class="menu-item-icon">👑</span>
            <div class="menu-item-text">
              <span class="menu-item-title">PANEL DE ADMINISTRACIÓN</span>
              <span class="menu-item-sub">Generar códigos y gestionar casino</span>
            </div>
          </NuxtLink>

          <button
            type="button"
            class="menu-item-btn"
            @click="showRechargeModal = true; showMenuDrawer = false;"
          >
            <span class="menu-item-icon">🪙</span>
            <div class="menu-item-text">
              <span class="menu-item-title">CANJEAR CÓDIGO</span>
              <span class="menu-item-sub">Recargar saldo de fichas</span>
            </div>
          </button>

          <div class="menu-divider" />

          <p class="menu-info-note">
            Royal Casino 8-Bit Retro Edition. Todos los juegos comparten saldo único en cuenta.
          </p>
        </div>
      </div>
    </v-dialog>
  </div>
</template>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Press+Start+2P&family=VT323&display=swap');

:root {
  --casino-bg: #06170f;
  --casino-panel: #0d2b1b;
  --casino-green: #16a34a;
  --casino-mint: #6ee7a0;
  --casino-gold: #ffc928;
  --casino-gold-light: #ffe47b;
  --casino-border: #020804;
  --casino-text: #f5f3df;
  --casino-muted: #a7b8aa;
  --pixel-shadow: 4px 5px 0 #020804;
}

/* ═══ Contenedor Principal y Fondos ═══ */
.casino-home {
  min-height: 100vh;
  padding: 24px 28px 48px;
  background-color: #06170f;
  background-image:
    repeating-linear-gradient(
      0deg,
      transparent 0px,
      transparent 3px,
      rgba(0, 0, 0, 0.15) 4px
    ),
    radial-gradient(ellipse at top, #143e28 0%, #081b11 50%, #030a06 100%);
  position: relative;
  overflow-x: hidden;
  box-sizing: border-box;
  font-family: 'VT323', monospace;
  color: #f5f3df;
}

/* Efecto Scanlines CRT */
.crt-scanlines {
  position: fixed;
  inset: 0;
  pointer-events: none;
  background: linear-gradient(
    rgba(18, 16, 16, 0) 50%,
    rgba(0, 0, 0, 0.25) 50%
  );
  background-size: 100% 4px;
  z-index: 1;
  opacity: 0.4;
}

/* Decoración de Monedas en las esquinas */
.side-coin {
  position: fixed;
  width: 64px;
  height: 64px;
  border-radius: 50%;
  pointer-events: none;
  background: radial-gradient(circle, #f59e0b 30%, #78350f 70%, transparent 75%);
  filter: drop-shadow(0 0 16px rgba(245, 158, 11, 0.3));
  opacity: 0.25;
  z-index: 0;
}
.side-coin--left {
  top: 180px;
  left: 20px;
}
.side-coin--right {
  top: 240px;
  right: 25px;
}

/* ═══ Cabecera ═══ */
.casino-header {
  position: relative;
  z-index: 2;
  max-width: 1200px;
  margin: 0 auto 28px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 16px;
}

.logo-group {
  text-align: left;
}

.casino-logo {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #ffc928;
  font-family: 'Press Start 2P', monospace;
  font-size: clamp(20px, 2.4vw, 32px);
  line-height: 1.4;
  text-shadow:
    3px 3px 0 #78350f,
    5px 5px 0 #000;
  letter-spacing: -0.5px;
}

.pixel-crown {
  font-size: 1.1em;
  filter: drop-shadow(2px 2px 0 #000);
}

.casino-subtitle {
  margin-top: 6px;
  color: #ffe47b;
  font-family: 'Press Start 2P', monospace;
  font-size: clamp(7px, 0.9vw, 9px);
  line-height: 1.6;
  letter-spacing: 0.5px;
  text-shadow: 1px 1px 0 #000;
}

/* ═══ Barra de Herramientas (Toolbar) ═══ */
.casino-toolbar {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.casino-balance {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 16px;
  background: #08120b;
  border: 3px solid #16a34a;
  box-shadow: 3px 4px 0 #000;
}

.balance-icon-wrap {
  display: flex;
  align-items: center;
  justify-content: center;
}

.balance-text-wrap {
  display: flex;
  flex-direction: column;
}

.balance-label {
  font-family: 'Press Start 2P', monospace;
  font-size: 7px;
  color: #a7b8aa;
  letter-spacing: 0.5px;
}

.balance-number {
  font-family: 'Press Start 2P', monospace;
  font-size: 16px;
  color: #ffc928;
  text-shadow: 2px 2px 0 #000;
  letter-spacing: 0.5px;
  margin-top: 3px;
}

/* Botón Dorado de Recarga */
.casino-btn-gold {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 44px;
  padding: 0 18px;
  color: #1a0f00 !important;
  background: linear-gradient(
    180deg,
    #ffe66d 0%,
    #ffc21b 50%,
    #e99b00 100%
  ) !important;
  border: 3px solid #000 !important;
  box-shadow: 0 4px 0 #000 !important;
  font-family: 'Press Start 2P', monospace !important;
  font-size: 9px !important;
  font-weight: 700;
  text-transform: uppercase;
  text-decoration: none;
  cursor: pointer;
  transition: transform 0.12s ease, filter 0.12s ease, box-shadow 0.12s ease;
  user-select: none;
}

.casino-btn-gold:hover {
  filter: brightness(1.15);
  transform: translateY(-2px);
  box-shadow: 0 6px 0 #000 !important;
}

.casino-btn-gold:active {
  transform: translateY(2px);
  box-shadow: 0 1px 0 #000 !important;
}

.recharge-btn {
  letter-spacing: 0.5px;
}

/* Botón Hamburguesa */
.casino-burger-btn {
  width: 44px;
  height: 44px;
  background: #08120b;
  border: 3px solid #16a34a;
  box-shadow: 3px 4px 0 #000;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  gap: 5px;
  cursor: pointer;
  transition: transform 0.12s, border-color 0.12s;
}

.casino-burger-btn:hover {
  border-color: #ffc928;
  transform: translateY(-2px);
}

.burger-bar {
  width: 20px;
  height: 3px;
  background: #ffc928;
  box-shadow: 1px 1px 0 #000;
}

/* ═══ Cuadrícula de Juegos ═══ */
.casino-games {
  position: relative;
  z-index: 2;
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

/* ═══ Tarjeta de Juego ═══ */
.casino-card {
  --game-color: #16a34a;
  position: relative;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: 20px 18px 16px;
  background: linear-gradient(
    145deg,
    rgba(13, 43, 27, 0.95) 0%,
    rgba(6, 23, 15, 0.98) 100%
  );
  border: 3px solid var(--game-color);
  box-shadow: 4px 5px 0 #000;
  transition: transform 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease;
  animation: card-appear 0.4s ease both;
}

.casino-card:hover {
  transform: translateY(-5px);
  border-color: #ffc928;
  box-shadow: 0 0 0 2px rgba(255, 201, 40, 0.2), 0 8px 0 #000;
}

/* Colores temáticos por juego */
.game-blackjack {
  --game-color: #16a34a;
}
.game-poker {
  --game-color: #dc2626;
}
.game-roulette {
  --game-color: #9333ea;
}
.game-slots {
  --game-color: #d97706;
}
.game-baccarat {
  --game-color: #0284c7;
}
.game-dice {
  --game-color: #16a34a;
}

/* Remates decorativos de esquina */
.pixel-corner {
  position: absolute;
  width: 5px;
  height: 5px;
  background: var(--game-color);
}
.corner--tl { top: -4px; left: -4px; }
.corner--tr { top: -4px; right: -4px; }
.corner--bl { bottom: -4px; left: -4px; }
.corner--br { bottom: -4px; right: -4px; }

/* Cuerpo de la Tarjeta */
.card-body {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 18px;
  text-align: left;
}

/* Icono Pixel Art */
.casino-icon {
  flex-shrink: 0;
  width: 74px;
  height: 74px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #040906;
  border: 2px solid #000;
  box-shadow: inset 1px 1px 0 rgba(255, 255, 255, 0.1), 2px 2px 0 #000;
}

.game-pixel-art {
  image-rendering: pixelated;
  shape-rendering: crispEdges;
  filter: drop-shadow(2px 2px 0 #000);
}

/* Información del juego */
.card-info {
  flex: 1;
  min-width: 0;
}

.casino-title {
  margin: 0 0 6px;
  color: #ffc928;
  font-family: 'Press Start 2P', monospace;
  font-size: 11px;
  line-height: 1.4;
  letter-spacing: 0.5px;
  text-shadow: 2px 2px 0 #000;
}

.casino-description {
  margin: 0 0 10px;
  color: #a7b8aa;
  font-family: 'VT323', monospace;
  font-size: 18px;
  line-height: 1.15;
}

.casino-status {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #22c55e;
  box-shadow: 0 0 6px #22c55e;
}

.status-text {
  font-family: 'VT323', monospace;
  font-size: 17px;
  color: #22c55e;
  letter-spacing: 0.5px;
}

/* Botón INSERT COIN */
.insert-coin-btn {
  width: 100%;
  min-height: 38px;
  padding: 0 12px;
  gap: 6px;
}

.spade-icon {
  font-size: 12px;
}

/* ═══ Menú Modal Hamburguesa ═══ */
.pixel-menu-card {
  background: #08120b;
  border: 4px solid #ffc928;
  box-shadow: 6px 6px 0 #000;
  color: #fff;
  font-family: 'VT323', monospace;
}

.pixel-menu-header {
  background: #0d2b1b;
  border-bottom: 3px solid #16a34a;
  padding: 12px 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.pixel-menu-title {
  font-family: 'Press Start 2P', monospace;
  font-size: 10px;
  color: #ffc928;
}

.pixel-menu-close {
  background: #1f2937;
  border: 2px solid #374151;
  color: #fff;
  font-family: 'Press Start 2P', monospace;
  font-size: 10px;
  width: 26px;
  height: 26px;
  cursor: pointer;
}

.pixel-menu-close:hover {
  background: #dc2626;
  border-color: #ef4444;
}

.pixel-menu-body {
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.menu-item-btn {
  display: flex;
  align-items: center;
  gap: 12px;
  background: #0d2b1b;
  border: 2px solid #16a34a;
  box-shadow: 3px 3px 0 #000;
  padding: 10px 12px;
  color: #fff;
  text-decoration: none;
  cursor: pointer;
  text-align: left;
  transition: all 0.15s;
}

.menu-item-btn:hover {
  background: #143e28;
  border-color: #ffc928;
  transform: translateY(-2px);
}

.menu-item-icon {
  font-size: 1.6rem;
}

.menu-item-text {
  display: flex;
  flex-direction: column;
}

.menu-item-title {
  font-family: 'Press Start 2P', monospace;
  font-size: 8px;
  color: #ffc928;
}

.menu-item-sub {
  font-size: 16px;
  color: #a7b8aa;
  margin-top: 3px;
}

.menu-divider {
  height: 2px;
  background: #16a34a;
  margin: 6px 0;
}

.menu-info-note {
  font-size: 15px;
  color: #a7b8aa;
  text-align: center;
  margin: 0;
}

/* Animaciones */
@keyframes card-appear {
  from {
    opacity: 0;
    transform: translateY(12px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.casino-card:nth-child(2) { animation-delay: 0.05s; }
.casino-card:nth-child(3) { animation-delay: 0.10s; }
.casino-card:nth-child(4) { animation-delay: 0.15s; }
.casino-card:nth-child(5) { animation-delay: 0.20s; }
.casino-card:nth-child(6) { animation-delay: 0.25s; }

/* ═══ Responsive ═══ */
@media (max-width: 980px) {
  .casino-games {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 16px;
  }
}

@media (max-width: 680px) {
  .casino-header {
    flex-direction: column;
    text-align: center;
  }
  .logo-group {
    text-align: center;
  }
  .casino-logo {
    justify-content: center;
  }
  .casino-toolbar {
    justify-content: center;
  }
  .casino-games {
    grid-template-columns: 1fr;
    max-width: 440px;
  }
}
</style>
