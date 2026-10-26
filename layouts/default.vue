<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useBlackjackStore } from '~/stores/blackjack'
import { useSoundEngine } from '~/composables/useSoundEngine'
import RechargeDialog from '~/components/common/RechargeDialog.vue'
import GameRulesDialog from '~/components/common/GameRulesDialog.vue'

const route = useRoute()
const router = useRouter()
const nuxtApp = useNuxtApp()
const wallet = useBlackjackStore(nuxtApp.$pinia)
const sound = useSoundEngine()

// Estado local del layout
const drawerOpen = ref(false)
const showRulesDialog = ref(false)
const activeRuleGame = ref<'blackjack' | 'tragamonedas' | 'ruleta' | 'baccarat' | 'poker' | 'dados'>('blackjack')

// Saldo reactivo conectado con la Store central
const chips = computed(() => wallet.player.chips)
const chipsFormatted = computed(() => chips.value.toLocaleString())

// Sincronizar saldo con el servidor al cargar
onMounted(() => {
  wallet.syncWithServer()
})

// Catálogo de juegos para la navegación
interface NavGame {
  id: string
  name: string
  shortName: string
  path: string
  icon: string
  color: string
  tag: string
  rulesKey?: 'blackjack' | 'tragamonedas' | 'ruleta' | 'baccarat' | 'poker' | 'dados'
}

const games: NavGame[] = [
  {
    id: 'blackjack',
    name: 'Blackjack 21',
    shortName: 'Blackjack',
    path: '/blackjack',
    icon: '🃏',
    color: '#16a34a',
    tag: 'PAGA 3:2',
    rulesKey: 'blackjack',
  },
  {
    id: 'ruleta',
    name: 'Ruleta Europea',
    shortName: 'Ruleta',
    path: '/ruleta',
    icon: '🎡',
    color: '#9333ea',
    tag: '35 A 1',
    rulesKey: 'ruleta',
  },
  {
    id: 'tragamonedas',
    name: 'Tragamonedas',
    shortName: 'Slots',
    path: '/tragamonedas',
    icon: '🎰',
    color: '#d97706',
    tag: 'JACKPOT',
    rulesKey: 'tragamonedas',
  },
  {
    id: 'poker',
    name: "Texas Hold'em",
    shortName: 'Poker',
    path: '/poker',
    icon: '♠️',
    color: '#dc2626',
    tag: 'NO LIMIT',
    rulesKey: 'poker',
  },
  {
    id: 'baccarat',
    name: 'Baccarat VIP',
    shortName: 'Baccarat',
    path: '/baccarat',
    icon: '👑',
    color: '#0284c7',
    tag: 'PUNTO BANCO',
    rulesKey: 'baccarat',
  },
  {
    id: 'dados',
    name: 'Dados Craps',
    shortName: 'Dados',
    path: '/dados',
    icon: '🎲',
    color: '#10b981',
    tag: 'TABLERO',
    rulesKey: 'dados',
  },
  {
    id: 'apuestas',
    name: 'Mesa de Fichas',
    shortName: 'Fichas',
    path: '/apuestas',
    icon: '🎟️',
    color: '#e11d48',
    tag: 'DEMO',
  },
]

// Identificar juego activo
const currentGame = computed(() => {
  return games.find((g) => g.path === route.path)
})

const isHome = computed(() => route.path === '/')

function openRules(gameKey?: 'blackjack' | 'tragamonedas' | 'ruleta' | 'baccarat' | 'poker' | 'dados') {
  activeRuleGame.value = gameKey || currentGame.value?.rulesKey || 'blackjack'
  showRulesDialog.value = true
  drawerOpen.value = false
  sound.playButtonClick()
}

function handleRechargeClick() {
  sound.playChipStack()
  wallet.openRecharge()
  drawerOpen.value = false
}

function navigateTo(path: string) {
  sound.playButtonClick()
  drawerOpen.value = false
  router.push(path)
}
</script>

<template>
  <div class="royal-layout">
    <!-- ═══ Barra de Navegación Superior Unificada (Navbar) ═══ -->
    <header class="royal-navbar" :class="{ 'royal-navbar--home': isHome }">
      <div class="royal-navbar__container">
        <!-- Lado Izquierdo: Marca / Logo + Botón Lobby -->
        <div class="royal-navbar__brand-section">
          <NuxtLink to="/" class="royal-brand" @click="sound.playButtonClick()">
            <span class="royal-brand__crown animate-pulse">👑</span>
            <div class="royal-brand__text">
              <span class="royal-brand__title">ROYAL CASINO</span>
              <span class="royal-brand__sub">RETRO 8-BIT</span>
            </div>
          </NuxtLink>

          <!-- Botón Volver al Lobby cuando se está jugando -->
          <NuxtLink
            v-if="!isHome"
            to="/"
            class="royal-back-lobby-btn"
            title="Volver al Lobby principal"
            @click="sound.playButtonClick()"
          >
            <span class="royal-back-lobby-btn__arrow">◀</span>
            <span class="royal-back-lobby-btn__text">LOBBY</span>
          </NuxtLink>

          <!-- Badge del juego activo -->
          <div v-if="currentGame" class="royal-active-badge d-none d-md-flex">
            <span class="royal-active-badge__dot" :style="{ backgroundColor: currentGame.color }" />
            <span class="royal-active-badge__icon">{{ currentGame.icon }}</span>
            <span class="royal-active-badge__name">{{ currentGame.name }}</span>
          </div>
        </div>

        <!-- Centro: Tira de Acceso Rápido a Juegos (Desktop y Tablets grandes) -->
        <nav class="royal-navbar__games-strip d-none d-lg-flex" aria-label="Juegos del Casino">
          <NuxtLink
            v-for="game in games"
            :key="game.id"
            :to="game.path"
            class="royal-game-pill"
            :class="{ 'royal-game-pill--active': route.path === game.path }"
            @click="sound.playButtonClick()"
          >
            <span class="royal-game-pill__icon">{{ game.icon }}</span>
            <span class="royal-game-pill__name">{{ game.shortName }}</span>
          </NuxtLink>
        </nav>

        <!-- Lado Derecho: Saldo + Botón Recargar + Menú -->
        <div class="royal-navbar__actions">
          <!-- Widget de Saldo Interactivo (al hacer clic también abre recarga) -->
          <button
            type="button"
            class="royal-balance-widget"
            title="Tu saldo de fichas (Clic para recargar)"
            @click="handleRechargeClick"
          >
            <div class="royal-balance-widget__icon-wrap">
              <svg class="royal-coin-svg" viewBox="0 0 24 24" width="22" height="22">
                <circle cx="12" cy="12" r="10" fill="#f59e0b" stroke="#78350f" stroke-width="2" />
                <circle cx="12" cy="12" r="7" fill="#fbbf24" stroke="#d97706" stroke-width="1.5" />
                <rect x="10.5" y="7.5" width="3" height="9" fill="#78350f" />
                <rect x="9" y="9" width="6" height="2" fill="#78350f" />
                <rect x="9" y="13" width="6" height="2" fill="#78350f" />
              </svg>
            </div>
            <div class="royal-balance-widget__content">
              <span class="royal-balance-widget__label">SALDO:</span>
              <strong class="royal-balance-widget__amount">{{ chipsFormatted }}</strong>
            </div>
          </button>

          <!-- Botón Dorado de Recarga Rápida -->
          <button
            type="button"
            class="royal-recharge-btn"
            @click="handleRechargeClick"
          >
            <span class="royal-recharge-btn__icon">+</span>
            <span class="royal-recharge-btn__text">RECARGAR</span>
          </button>

          <!-- Botón Menú Hamburguesa / Drawer -->
          <button
            type="button"
            class="royal-burger-btn"
            :class="{ 'royal-burger-btn--open': drawerOpen }"
            aria-label="Abrir menú de navegación"
            @click="drawerOpen = !drawerOpen; sound.playButtonClick()"
          >
            <span class="royal-burger-bar" />
            <span class="royal-burger-bar" />
            <span class="royal-burger-bar" />
          </button>
        </div>
      </div>
    </header>

    <!-- ═══ Drawer / Menú Desplegable Lateral ═══ -->
    <transition name="drawer-fade">
      <div v-if="drawerOpen" class="royal-drawer-backdrop" @click="drawerOpen = false" />
    </transition>

    <aside class="royal-drawer" :class="{ 'royal-drawer--open': drawerOpen }">
      <div class="royal-drawer__header">
        <div class="d-flex align-center ga-2">
          <span class="royal-drawer__crown">👑</span>
          <div>
            <h2 class="royal-drawer__title">ROYAL CASINO</h2>
            <p class="royal-drawer__sub">MENÚ PRINCIPAL</p>
          </div>
        </div>
        <button
          type="button"
          class="royal-drawer__close-btn"
          aria-label="Cerrar menú"
          @click="drawerOpen = false; sound.playButtonClick()"
        >
          ✕
        </button>
      </div>

      <!-- Tarjeta de Saldo del Usuario dentro del Drawer -->
      <div class="royal-drawer__balance-card">
        <div class="d-flex justify-space-between align-center mb-2">
          <span class="royal-drawer__balance-tag">FICHAS DISPONIBLES</span>
          <span class="royal-drawer__vip-badge">JUGADOR VIP</span>
        </div>
        <div class="royal-drawer__balance-display">
          <span class="royal-drawer__coin-icon">🪙</span>
          <strong class="royal-drawer__balance-num">{{ chipsFormatted }}</strong>
        </div>
        <button
          type="button"
          class="royal-drawer__recharge-btn mt-3 w-100"
          @click="handleRechargeClick"
        >
          ⚡ CANJEAR CÓDIGO / RECARGAR
        </button>
      </div>

      <!-- Lista de Juegos -->
      <div class="royal-drawer__section-title">
        <span>🎮 JUEGOS DISPONIBLES</span>
      </div>

      <nav class="royal-drawer__games-list">
        <NuxtLink
          to="/"
          class="royal-drawer__item"
          :class="{ 'royal-drawer__item--active': route.path === '/' }"
          @click="navigateTo('/')"
        >
          <span class="royal-drawer__item-icon">🏠</span>
          <div class="royal-drawer__item-info">
            <span class="royal-drawer__item-name">Lobby Principal</span>
            <span class="royal-drawer__item-desc">Sala principal con todos los juegos</span>
          </div>
        </NuxtLink>

        <NuxtLink
          v-for="game in games"
          :key="game.id"
          :to="game.path"
          class="royal-drawer__item"
          :class="{ 'royal-drawer__item--active': route.path === game.path }"
          @click="navigateTo(game.path)"
        >
          <span class="royal-drawer__item-icon">{{ game.icon }}</span>
          <div class="royal-drawer__item-info">
            <div class="d-flex align-center ga-2">
              <span class="royal-drawer__item-name">{{ game.name }}</span>
              <span class="royal-drawer__item-tag" :style="{ backgroundColor: game.color }">{{ game.tag }}</span>
            </div>
          </div>
        </NuxtLink>
      </nav>

      <!-- Enlaces adicionales y Configuración -->
      <div class="royal-drawer__section-title mt-4">
        <span>⚙️ UTILIDADES</span>
      </div>

      <div class="royal-drawer__tools-list">
        <button
          type="button"
          class="royal-drawer__tool-btn"
          @click="openRules()"
        >
          <span class="tool-icon">📖</span>
          <span>Reglas del Casino</span>
        </button>

        <NuxtLink
          to="/admin"
          class="royal-drawer__tool-btn"
          @click="navigateTo('/admin')"
        >
          <span class="tool-icon">🛠️</span>
          <span>Panel de Administración</span>
        </NuxtLink>
      </div>

      <div class="royal-drawer__footer">
        <p class="royal-drawer__version">Royal Casino v2.0 · 8-Bit Pixel Edition</p>
      </div>
    </aside>

    <!-- ═══ Contenido Principal de las Páginas ═══ -->
    <main class="royal-main-content">
      <slot />
    </main>

    <!-- ═══ Barra de Navegación Inferior para Móviles ═══ -->
    <nav class="royal-mobile-nav d-flex d-md-none" aria-label="Navegación móvil inferior">
      <NuxtLink
        to="/"
        class="royal-mobile-nav__btn"
        :class="{ 'royal-mobile-nav__btn--active': route.path === '/' }"
        @click="sound.playButtonClick()"
      >
        <span class="royal-mobile-nav__icon">🏠</span>
        <span class="royal-mobile-nav__label">Lobby</span>
      </NuxtLink>

      <NuxtLink
        to="/blackjack"
        class="royal-mobile-nav__btn"
        :class="{ 'royal-mobile-nav__btn--active': route.path === '/blackjack' }"
        @click="sound.playButtonClick()"
      >
        <span class="royal-mobile-nav__icon">🃏</span>
        <span class="royal-mobile-nav__label">Blackjack</span>
      </NuxtLink>

      <NuxtLink
        to="/ruleta"
        class="royal-mobile-nav__btn"
        :class="{ 'royal-mobile-nav__btn--active': route.path === '/ruleta' }"
        @click="sound.playButtonClick()"
      >
        <span class="royal-mobile-nav__icon">🎡</span>
        <span class="royal-mobile-nav__label">Ruleta</span>
      </NuxtLink>

      <NuxtLink
        to="/tragamonedas"
        class="royal-mobile-nav__btn"
        :class="{ 'royal-mobile-nav__btn--active': route.path === '/tragamonedas' }"
        @click="sound.playButtonClick()"
      >
        <span class="royal-mobile-nav__icon">🎰</span>
        <span class="royal-mobile-nav__label">Slots</span>
      </NuxtLink>

      <button
        type="button"
        class="royal-mobile-nav__btn royal-mobile-nav__btn--recharge"
        @click="handleRechargeClick"
      >
        <span class="royal-mobile-nav__icon">💰</span>
        <span class="royal-mobile-nav__label">Recargar</span>
      </button>
    </nav>

    <!-- ═══ Footer Retro Unificado (Visible en páginas con scroll) ═══ -->
    <footer class="royal-footer" :class="{ 'royal-footer--compact': !isHome }">
      <div class="royal-footer__container">
        <div class="royal-footer__top">
          <div class="royal-footer__brand">
            <span class="royal-footer__crown">👑</span>
            <span class="royal-footer__name">ROYAL CASINO</span>
            <span class="royal-footer__badge">100% RETRO PIXEL ART</span>
          </div>
          <p class="royal-footer__desc">
            Experiencia de casino retro inspirada en los salones recreativos arcade de los años 80 y 90.
          </p>
        </div>

        <div class="royal-footer__bottom">
          <p class="royal-footer__warning">
            ⚠ Juega con responsabilidad · Apuestas para mayores de 18 años · Fichas de casino simuladas
          </p>
          <p class="royal-footer__copy">
            © 2026 Royal Casino Entertainment Ltd. Todos los derechos reservados.
          </p>
        </div>
      </div>
    </footer>

    <!-- ═══ Modales Globales Centralizados ═══ -->
    <RechargeDialog v-model="wallet.isRechargeOpen" />
    <GameRulesDialog v-model="showRulesDialog" :game="activeRuleGame" />
  </div>
</template>

<style scoped>
/* ============================================================================
 * ROYAL CASINO UNIFIED LAYOUT STYLES
 * ============================================================================ */

.royal-layout {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background-color: var(--pixel-bg-dark, #0f0f14);
  color: #f4f4f5;
  position: relative;
  width: 100%;
}

/* ─── Top Navbar ───────────────────────────────────────────────────────────── */
.royal-navbar {
  position: sticky;
  top: 0;
  left: 0;
  right: 0;
  z-index: 1000;
  background: rgba(18, 18, 28, 0.94);
  backdrop-filter: blur(10px);
  border-bottom: 2px solid #2e2e42;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.6);
  transition: all 0.25s ease;
}

.royal-navbar--home {
  border-bottom: 3px solid #fbc02d;
  box-shadow: 0 4px 25px rgba(251, 192, 45, 0.15);
}

.royal-navbar__container {
  max-width: 1540px;
  margin: 0 auto;
  padding: 8px 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

/* ─── Brand ────────────────────────────────────────────────────────────────── */
.royal-navbar__brand-section {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-shrink: 0;
}

.royal-brand {
  display: flex;
  align-items: center;
  gap: 8px;
  text-decoration: none;
  color: inherit;
  user-select: none;
}

.royal-brand__crown {
  font-size: 20px;
  filter: drop-shadow(0 0 6px rgba(251, 192, 45, 0.6));
}

.royal-brand__text {
  display: flex;
  flex-direction: column;
}

.royal-brand__title {
  font-family: var(--pixel-font, 'Press Start 2P', monospace);
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 1px;
  background: linear-gradient(180deg, #fff3b0 0%, #ffd54f 50%, #f59e0b 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.9));
}

.royal-brand__sub {
  font-family: var(--pixel-lcd-font, 'VT323', monospace);
  font-size: 11px;
  letter-spacing: 1.5px;
  color: #a1a1aa;
}

/* ─── Volver al Lobby Button ──────────────────────────────────────────────── */
.royal-back-lobby-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: #1e1e2d;
  border: 1.5px solid #fbc02d;
  color: #ffd54f;
  text-decoration: none;
  font-family: var(--pixel-font, 'Press Start 2P', monospace);
  font-size: 10px;
  padding: 6px 10px;
  border-radius: 4px;
  transition: all 0.15s ease;
  box-shadow: 0 2px 0 #78350f;
}

.royal-back-lobby-btn:hover {
  background: #fbc02d;
  color: #0f0f14;
  box-shadow: 0 0 10px rgba(251, 192, 45, 0.5);
  transform: translateY(-1px);
}

.royal-back-lobby-btn:active {
  transform: translateY(1px);
  box-shadow: none;
}

.royal-back-lobby-btn__arrow {
  font-size: 9px;
}

/* ─── Badge del Juego Activo ──────────────────────────────────────────────── */
.royal-active-badge {
  display: flex;
  align-items: center;
  gap: 6px;
  background: rgba(30, 30, 46, 0.8);
  border: 1px solid #3f3f5a;
  border-radius: 20px;
  padding: 4px 10px;
  font-family: var(--pixel-font-alt, 'Silkscreen', monospace);
  font-size: 10px;
  color: #e4e4e7;
}

.royal-active-badge__dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  animation: pulse-dot 1.8s infinite;
}

@keyframes pulse-dot {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.4; transform: scale(0.85); }
}

/* ─── Tira de Juegos (Desktop) ────────────────────────────────────────────── */
.royal-navbar__games-strip {
  display: flex;
  align-items: center;
  gap: 6px;
  overflow-x: auto;
  padding: 2px 4px;
}

.royal-game-pill {
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 5px 9px;
  border-radius: 4px;
  text-decoration: none;
  color: #a1a1aa;
  font-family: var(--pixel-font-alt, 'Silkscreen', sans-serif);
  font-size: 10px;
  border: 1px solid transparent;
  background: transparent;
  transition: all 0.15s ease;
  white-space: nowrap;
}

.royal-game-pill:hover {
  background: #222234;
  color: #ffffff;
  border-color: #3f3f5a;
}

.royal-game-pill--active {
  background: #2a2a44;
  color: #ffd54f;
  border-color: #fbc02d;
  box-shadow: 0 0 8px rgba(251, 192, 45, 0.25);
}

.royal-game-pill__icon {
  font-size: 13px;
}

/* ─── Lado Derecho Acciones ───────────────────────────────────────────────── */
.royal-navbar__actions {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-shrink: 0;
}

/* ─── Widget de Saldo ─────────────────────────────────────────────────────── */
.royal-balance-widget {
  display: flex;
  align-items: center;
  gap: 8px;
  background: linear-gradient(180deg, #1f1f2e 0%, #151522 100%);
  border: 1.5px solid #4a3a14;
  border-radius: 6px;
  padding: 4px 10px;
  cursor: pointer;
  color: inherit;
  transition: all 0.2s ease;
  box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.5), 0 2px 6px rgba(0, 0, 0, 0.3);
}

.royal-balance-widget:hover {
  border-color: #fbc02d;
  box-shadow: 0 0 12px rgba(251, 192, 45, 0.35);
  transform: translateY(-1px);
}

.royal-balance-widget__icon-wrap {
  display: flex;
  align-items: center;
  justify-content: center;
  animation: coin-shine 3s ease-in-out infinite;
}

@keyframes coin-shine {
  0%, 100% { transform: rotate(0deg); }
  15% { transform: rotate(15deg) scale(1.1); }
  30% { transform: rotate(0deg); }
}

.royal-balance-widget__content {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  line-height: 1.1;
}

.royal-balance-widget__label {
  font-family: var(--pixel-font, 'Press Start 2P', monospace);
  font-size: 8px;
  color: #f59e0b;
  letter-spacing: 0.5px;
}

.royal-balance-widget__amount {
  font-family: var(--pixel-lcd-font, 'VT323', monospace);
  font-size: 18px;
  letter-spacing: 1px;
  color: #69f0ae;
  text-shadow: 0 0 6px rgba(105, 240, 174, 0.4);
}

/* ─── Botón Dorado de Recarga ─────────────────────────────────────────────── */
.royal-recharge-btn {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  background: linear-gradient(180deg, #fbc02d 0%, #d97706 100%);
  border: 1.5px solid #fff3b0;
  color: #1a0f00;
  font-family: var(--pixel-font, 'Press Start 2P', monospace);
  font-size: 9px;
  font-weight: 700;
  padding: 7px 12px;
  border-radius: 4px;
  cursor: pointer;
  box-shadow: 0 3px 0 #78350f, 0 4px 10px rgba(245, 158, 11, 0.4);
  transition: all 0.15s ease;
  user-select: none;
}

.royal-recharge-btn:hover {
  filter: brightness(1.1);
  box-shadow: 0 3px 0 #78350f, 0 0 16px rgba(251, 192, 45, 0.7);
  transform: translateY(-1px);
}

.royal-recharge-btn:active {
  transform: translateY(2px);
  box-shadow: 0 1px 0 #78350f;
}

.royal-recharge-btn__icon {
  font-size: 13px;
  font-weight: 900;
}

/* ─── Botón Hamburguesa ───────────────────────────────────────────────────── */
.royal-burger-btn {
  display: flex;
  flex-direction: column;
  justify-content: space-around;
  width: 36px;
  height: 36px;
  background: #1e1e2e;
  border: 1.5px solid #3f3f5a;
  border-radius: 6px;
  padding: 7px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.royal-burger-btn:hover {
  border-color: #fbc02d;
  background: #29293e;
}

.royal-burger-bar {
  width: 100%;
  height: 2px;
  background-color: #ffd54f;
  border-radius: 1px;
  transition: all 0.2s ease;
}

/* ─── Drawer Lateral ──────────────────────────────────────────────────────── */
.royal-drawer-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(4px);
  z-index: 10000;
}

.royal-drawer {
  position: fixed;
  top: 0;
  right: -360px;
  width: 340px;
  max-width: 85vw;
  height: 100vh;
  background: #151522;
  border-left: 2px solid #3f3f5a;
  box-shadow: -10px 0 30px rgba(0, 0, 0, 0.8);
  z-index: 10001;
  display: flex;
  flex-direction: column;
  padding: 20px;
  overflow-y: auto;
  transition: right 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}

.royal-drawer--open {
  right: 0;
}

.royal-drawer__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-bottom: 16px;
  border-bottom: 1.5px solid #2e2e42;
}

.royal-drawer__crown {
  font-size: 24px;
}

.royal-drawer__title {
  font-family: var(--pixel-font, 'Press Start 2P', monospace);
  font-size: 11px;
  color: #ffd54f;
  margin: 0;
}

.royal-drawer__sub {
  font-family: var(--pixel-lcd-font, 'VT323', monospace);
  font-size: 12px;
  color: #a1a1aa;
  margin: 0;
}

.royal-drawer__close-btn {
  background: #252538;
  border: 1px solid #4a4a66;
  color: #e4e4e7;
  font-size: 14px;
  width: 32px;
  height: 32px;
  border-radius: 4px;
  cursor: pointer;
}

.royal-drawer__close-btn:hover {
  background: #e52521;
  color: #fff;
}

/* Tarjeta Saldo Drawer */
.royal-drawer__balance-card {
  background: linear-gradient(135deg, #1c1c2c 0%, #26263c 100%);
  border: 1.5px solid #fbc02d;
  border-radius: 8px;
  padding: 14px;
  margin: 16px 0;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.5);
}

.royal-drawer__balance-tag {
  font-family: var(--pixel-font, 'Press Start 2P', monospace);
  font-size: 8px;
  color: #a1a1aa;
}

.royal-drawer__vip-badge {
  font-family: var(--pixel-font-alt, 'Silkscreen', monospace);
  font-size: 8px;
  background: #78350f;
  color: #ffd54f;
  padding: 2px 6px;
  border-radius: 3px;
  border: 1px solid #fbc02d;
}

.royal-drawer__balance-display {
  display: flex;
  align-items: center;
  gap: 8px;
}

.royal-drawer__coin-icon {
  font-size: 20px;
}

.royal-drawer__balance-num {
  font-family: var(--pixel-lcd-font, 'VT323', monospace);
  font-size: 26px;
  color: #69f0ae;
  letter-spacing: 1px;
}

.royal-drawer__recharge-btn {
  background: #fbc02d;
  border: 1px solid #fff3b0;
  color: #1a0f00;
  font-family: var(--pixel-font, 'Press Start 2P', monospace);
  font-size: 8px;
  font-weight: 700;
  padding: 9px;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.15s ease;
}

.royal-drawer__recharge-btn:hover {
  background: #f59e0b;
}

.royal-drawer__section-title {
  font-family: var(--pixel-font, 'Press Start 2P', monospace);
  font-size: 9px;
  color: #fbc02d;
  letter-spacing: 0.5px;
  margin-bottom: 8px;
}

.royal-drawer__games-list,
.royal-drawer__tools-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.royal-drawer__item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px;
  background: #1c1c2c;
  border: 1px solid #2e2e44;
  border-radius: 6px;
  text-decoration: none;
  color: #f4f4f5;
  transition: all 0.15s ease;
}

.royal-drawer__item:hover {
  background: #2a2a42;
  border-color: #ffd54f;
  transform: translateX(4px);
}

.royal-drawer__item--active {
  border-color: #fbc02d;
  background: #2a2a44;
}

.royal-drawer__item-icon {
  font-size: 20px;
}

.royal-drawer__item-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.royal-drawer__item-name {
  font-family: var(--pixel-font, 'Press Start 2P', monospace);
  font-size: 9px;
  color: #ffd54f;
}

.royal-drawer__item-desc {
  font-family: var(--pixel-body-font, sans-serif);
  font-size: 11px;
  color: #a1a1aa;
}

.royal-drawer__item-tag {
  font-family: var(--pixel-font-alt, 'Silkscreen', monospace);
  font-size: 7px;
  color: #ffffff;
  padding: 1px 5px;
  border-radius: 2px;
  text-transform: uppercase;
}

.royal-drawer__tool-btn {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px;
  background: #1e1e2d;
  border: 1px solid #33334c;
  border-radius: 6px;
  color: #e4e4e7;
  font-family: var(--pixel-font-alt, 'Silkscreen', sans-serif);
  font-size: 11px;
  cursor: pointer;
  text-decoration: none;
  width: 100%;
  text-align: left;
}

.royal-drawer__tool-btn:hover {
  background: #27273c;
  border-color: #fbc02d;
}

.royal-drawer__footer {
  margin-top: auto;
  padding-top: 20px;
  text-align: center;
}

.royal-drawer__version {
  font-family: var(--pixel-lcd-font, 'VT323', monospace);
  font-size: 12px;
  color: #71717a;
  margin: 0;
}

/* ─── Main Content Wrapper ────────────────────────────────────────────────── */
.royal-main-content {
  flex: 1 0 auto;
  position: relative;
  width: 100%;
  min-height: calc(100vh - 60px);
}

/* ─── Barra Móvil Inferior ─────────────────────────────────────────────────── */
.royal-mobile-nav {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  height: 58px;
  background: #12121a;
  border-top: 2px solid #2e2e42;
  box-shadow: 0 -4px 16px rgba(0, 0, 0, 0.7);
  z-index: 999;
  justify-content: space-around;
  align-items: center;
  padding: 2px 6px;
}

.royal-mobile-nav__btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2px;
  flex: 1;
  height: 100%;
  text-decoration: none;
  color: #a1a1aa;
  background: transparent;
  border: none;
  font-family: var(--pixel-font, 'Press Start 2P', monospace);
  font-size: 7px;
  cursor: pointer;
  transition: all 0.15s ease;
}

.royal-mobile-nav__icon {
  font-size: 18px;
}

.royal-mobile-nav__btn:hover,
.royal-mobile-nav__btn--active {
  color: #ffd54f;
}

.royal-mobile-nav__btn--recharge {
  color: #f59e0b;
}

/* ─── Footer Unificado ─────────────────────────────────────────────────────── */
.royal-footer {
  background: #0d0d13;
  border-top: 1.5px solid #222230;
  padding: 24px 16px;
  margin-top: auto;
  font-family: var(--pixel-body-font, sans-serif);
}

.royal-footer--compact {
  padding: 12px 16px;
  background: rgba(13, 13, 19, 0.8);
}

.royal-footer__container {
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  text-align: center;
}

.royal-footer__brand {
  display: flex;
  align-items: center;
  gap: 8px;
  justify-content: center;
}

.royal-footer__crown {
  font-size: 16px;
}

.royal-footer__name {
  font-family: var(--pixel-font, 'Press Start 2P', monospace);
  font-size: 11px;
  color: #ffd54f;
  letter-spacing: 1px;
}

.royal-footer__badge {
  font-family: var(--pixel-font-alt, 'Silkscreen', monospace);
  font-size: 8px;
  background: #252538;
  color: #a1a1aa;
  padding: 2px 6px;
  border-radius: 3px;
  border: 1px solid #3f3f5a;
}

.royal-footer__desc {
  font-size: 12px;
  color: #71717a;
  max-width: 600px;
  margin: 0;
}

.royal-footer__warning {
  font-family: var(--pixel-font-alt, 'Silkscreen', monospace);
  font-size: 9px;
  color: #f59e0b;
  margin: 0;
}

.royal-footer__copy {
  font-size: 11px;
  color: #52525b;
  margin: 4px 0 0 0;
}

/* ─── Responsivo ──────────────────────────────────────────────────────────── */
@media (max-width: 768px) {
  .royal-main-content {
    padding-bottom: 64px; /* Espacio para barra móvil inferior */
  }

  .royal-recharge-btn__text {
    display: none;
  }

  .royal-balance-widget__label {
    display: none;
  }

  .royal-brand__sub {
    display: none;
  }
}

/* Animaciones */
.animate-pulse {
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.8; transform: scale(1.08); }
}

.drawer-fade-enter-active,
.drawer-fade-leave-active {
  transition: opacity 0.25s ease;
}

.drawer-fade-enter-from,
.drawer-fade-leave-to {
  opacity: 0;
}
</style>

<!-- Estilos globales para armonizar páginas individuales con el layout único -->
<style>
/* Si el layout ya incluye la barra de navegación unificada, ocultamos la cabecera duplicada de index.vue */
.casino-home > .casino-header {
  display: none !important;
}

/* Ajuste sutil de margen para que las mesas de juego se integren limpiamente */
.blackjack-table,
.ruleta-room,
.poker-page,
.slots-room,
.baccarat-room,
.craps-room,
.apuestas {
  width: 100%;
}
</style>
