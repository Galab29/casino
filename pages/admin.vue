<template>
  <div class="admin-page">
    <div class="admin-container">
      <!-- ═══ Pantalla de Login si no es Admin ═══ -->
      <div v-if="!isAdmin" class="login-wrapper">
        <div class="login-card">
          <div class="login-header">
            <span class="login-icon">👑</span>
            <h1 class="pixel-title">ROYAL ADMIN PANEL</h1>
            <p class="login-sub">ACCESO RESTRINGIDO A DIRECCIÓN DE CASINO</p>
          </div>

          <form class="login-form" @submit.prevent="handleLogin">
            <div class="form-group">
              <label class="pixel-label">USUARIO</label>
              <input
                v-model="loginUsername"
                type="text"
                class="pixel-input"
                placeholder="admin"
                autocomplete="username"
                required
              />
            </div>

            <div class="form-group mt-3">
              <label class="pixel-label">CONTRASEÑA</label>
              <input
                v-model="loginPassword"
                type="password"
                class="pixel-input"
                placeholder="••••••••••••"
                autocomplete="current-password"
                required
              />
            </div>

            <div v-if="loginError" class="pixel-error-banner mt-3">
              <span class="error-icon">⚠</span>
              <span>{{ loginError }}</span>
            </div>

            <button
              type="submit"
              class="pixel-btn pixel-btn--gold mt-4 w-100"
              :disabled="loginLoading"
            >
              <span v-if="loginLoading">ACCEDIENDO...</span>
              <span v-else>INGRESAR AL PANEL</span>
            </button>
          </form>

          <div class="login-footer mt-4 text-center">
            <NuxtLink to="/" class="pixel-back-link">← Volver al Casino</NuxtLink>
          </div>
        </div>
      </div>

      <!-- ═══ Panel de Control Autorizado ═══ -->
      <div v-else class="dashboard-wrapper">
        <!-- Barra de Navegación Admin -->
        <header class="admin-header">
          <div class="d-flex align-center ga-3">
            <span class="header-badge">👑 ADMIN</span>
            <h1 class="admin-title">SISTEMA DE GESTIÓN DE CÓDIGOS</h1>
          </div>

          <div class="d-flex align-center ga-2">
            <NuxtLink to="/" class="pixel-btn pixel-btn--sm pixel-btn--ghost">
              🎰 JUGAR
            </NuxtLink>
            <button class="pixel-btn pixel-btn--sm pixel-btn--danger" @click="handleLogout">
              SALIR ✕
            </button>
          </div>
        </header>

        <!-- Tarjetas de Métricas -->
        <div class="metrics-grid mt-4">
          <div class="metric-box">
            <div class="metric-label">TOTAL CÓDIGOS</div>
            <div class="metric-value">{{ stats.totalCodes }}</div>
          </div>
          <div class="metric-box metric-box--green">
            <div class="metric-label">CÓDIGOS ACTIVOS</div>
            <div class="metric-value">{{ stats.activeCodes }}</div>
            <div class="metric-sub">{{ stats.activeChips.toLocaleString() }} 🪙</div>
          </div>
          <div class="metric-box metric-box--blue">
            <div class="metric-label">CANJEADOS</div>
            <div class="metric-value">{{ stats.redeemedCodes }}</div>
            <div class="metric-sub">{{ stats.redeemedChips.toLocaleString() }} 🪙</div>
          </div>
          <div class="metric-box metric-box--red">
            <div class="metric-label">DESACTIVADOS</div>
            <div class="metric-value">{{ stats.disabledCodes }}</div>
          </div>
        </div>

        <!-- ═══ Generador de Códigos ═══ -->
        <section class="admin-card mt-4">
          <div class="card-header">
            <span class="card-icon">⚡</span>
            <h2 class="card-title">GENERADOR DE CÓDIGOS DE RECARGA</h2>
          </div>

          <form class="generator-form pa-4" @submit.prevent="handleGenerateCodes">
            <div class="form-row">
              <div class="col-field">
                <label class="pixel-label">VALOR EN FICHAS</label>
                <div class="chip-presets mb-2">
                  <button
                    v-for="amt in [500, 1000, 5000, 10000, 50000]"
                    :key="amt"
                    type="button"
                    class="preset-chip"
                    :class="{ active: genAmount === amt }"
                    @click="genAmount = amt"
                  >
                    +{{ amt.toLocaleString() }}
                  </button>
                </div>
                <input
                  v-model.number="genAmount"
                  type="number"
                  min="1"
                  max="1000000"
                  class="pixel-input"
                  required
                />
              </div>

              <div class="col-field">
                <label class="pixel-label">CANTIDAD A GENERAR</label>
                <div class="count-presets mb-2">
                  <button
                    v-for="c in [1, 5, 10, 25]"
                    :key="c"
                    type="button"
                    class="preset-chip"
                    :class="{ active: genCount === c }"
                    @click="genCount = c"
                  >
                    {{ c }} {{ c === 1 ? 'cód' : 'códs' }}
                  </button>
                </div>
                <input
                  v-model.number="genCount"
                  type="number"
                  min="1"
                  max="50"
                  class="pixel-input"
                  required
                />
              </div>

              <div class="col-field">
                <label class="pixel-label">EXPIRACIÓN (HORAS, OPCIONAL)</label>
                <div class="count-presets mb-2">
                  <button
                    type="button"
                    class="preset-chip"
                    :class="{ active: genExpiresInHours === null }"
                    @click="genExpiresInHours = null"
                  >
                    Sin límite
                  </button>
                  <button
                    v-for="h in [24, 72, 168]"
                    :key="h"
                    type="button"
                    class="preset-chip"
                    :class="{ active: genExpiresInHours === h }"
                    @click="genExpiresInHours = h"
                  >
                    {{ h === 24 ? '24h' : h === 72 ? '3 días' : '7 días' }}
                  </button>
                </div>
                <input
                  v-model.number="genExpiresInHours"
                  type="number"
                  min="1"
                  placeholder="Sin expiración (permanente)"
                  class="pixel-input"
                />
              </div>
            </div>

            <div class="d-flex justify-space-between align-center mt-4">
              <span class="preview-text">
                Generará <strong>{{ genCount }}</strong> código(s) por valor de
                <strong class="text-amber">{{ (genAmount * genCount).toLocaleString() }} fichas</strong> en total.
              </span>
              <button
                type="submit"
                class="pixel-btn pixel-btn--gold"
                :disabled="generating"
              >
                <span v-if="generating">GENERANDO...</span>
                <span v-else>+ GENERAR CÓDIGOS</span>
              </button>
            </div>
          </form>

          <!-- Banner de Códigos recién creados -->
          <div v-if="recentlyCreated.length > 0" class="new-codes-banner pa-4">
            <div class="d-flex justify-space-between align-center mb-2">
              <span class="new-codes-title">¡CÓDIGOS RECIÉN GENERADOS ({{ recentlyCreated.length }})!</span>
              <button class="pixel-btn pixel-btn--sm pixel-btn--cyan" @click="copyAllNewCodes">
                COPIAR TODOS
              </button>
            </div>
            <div class="new-codes-grid">
              <div
                v-for="c in recentlyCreated"
                :key="c.id"
                class="new-code-pill"
                @click="copyToClipboard(c.code)"
              >
                <span class="new-code-text">{{ c.code }}</span>
                <span class="new-code-badge">+{{ c.amount.toLocaleString() }} 🪙</span>
                <span class="copy-hint">Copiar 📋</span>
              </div>
            </div>
          </div>
        </section>

        <!-- ═══ Listado y Gestión de Códigos ═══ -->
        <section class="admin-card mt-4 mb-8">
          <div class="card-header d-flex justify-space-between align-center flex-wrap ga-2">
            <div class="d-flex align-center ga-2">
              <span class="card-icon">📋</span>
              <h2 class="card-title">REGISTRO DE CÓDIGOS</h2>
            </div>

            <!-- Filtros -->
            <div class="d-flex align-center ga-2 flex-wrap">
              <input
                v-model="searchQuery"
                type="text"
                placeholder="Buscar código o usuario..."
                class="pixel-input pixel-input--sm search-input"
                @input="debouncedFetch"
              />

              <div class="status-filters">
                <button
                  class="filter-pill"
                  :class="{ active: filterStatus === '' }"
                  @click="setFilter('')"
                >
                  TODOS
                </button>
                <button
                  class="filter-pill"
                  :class="{ active: filterStatus === 'active' }"
                  @click="setFilter('active')"
                >
                  ACTIVOS
                </button>
                <button
                  class="filter-pill"
                  :class="{ active: filterStatus === 'redeemed' }"
                  @click="setFilter('redeemed')"
                >
                  CANJEADOS
                </button>
                <button
                  class="filter-pill"
                  :class="{ active: filterStatus === 'disabled' }"
                  @click="setFilter('disabled')"
                >
                  DESACTIVADOS
                </button>
              </div>

              <button class="pixel-btn pixel-btn--sm pixel-btn--ghost" @click="fetchCodes">
                🔄
              </button>
            </div>
          </div>

          <!-- Tabla de Códigos -->
          <div class="table-responsive">
            <table class="pixel-table">
              <thead>
                <tr>
                  <th>CÓDIGO</th>
                  <th>VALOR</th>
                  <th>ESTADO</th>
                  <th>CREADO</th>
                  <th>EXPIRA</th>
                  <th>CANJEADO POR</th>
                  <th>FECHA CANJE</th>
                  <th>ACCIONES</th>
                </tr>
              </thead>
              <tbody>
                <tr v-if="loadingCodes">
                  <td colspan="8" class="text-center py-6">
                    <span class="pixel-loading">CARGANDO CÓDIGOS...</span>
                  </td>
                </tr>
                <tr v-else-if="codes.length === 0">
                  <td colspan="8" class="text-center py-6 text-grey">
                    NO SE ENCONTRARON CÓDIGOS CON LOS CRITERIOS ESPECIFICADOS
                  </td>
                </tr>
                <tr
                  v-for="item in codes"
                  v-else
                  :key="item.id"
                  :class="`row-status--${item.status}`"
                >
                  <td class="font-mono font-weight-bold">
                    <span class="code-copyable" @click="copyToClipboard(item.code)">
                      {{ item.code }} <span class="copy-icon">📋</span>
                    </span>
                  </td>
                  <td class="text-amber font-weight-bold">
                    +{{ item.amount.toLocaleString() }} 🪙
                  </td>
                  <td>
                    <span class="badge" :class="`badge--${item.status}`">
                      {{ statusLabel(item.status) }}
                    </span>
                  </td>
                  <td class="text-muted">{{ formatDate(item.createdAt) }}</td>
                  <td class="text-muted">
                    {{ item.expiresAt ? formatDate(item.expiresAt) : 'Permanente' }}
                  </td>
                  <td>
                    <span v-if="item.redeemedBy" class="redeemer-name">
                      👤 {{ item.redeemedBy }}
                    </span>
                    <span v-else class="text-muted">—</span>
                  </td>
                  <td class="text-muted">
                    {{ item.redeemedAt ? formatDate(item.redeemedAt) : '—' }}
                  </td>
                  <td>
                    <div class="d-flex ga-1">
                      <button
                        v-if="item.status === 'active'"
                        class="action-btn action-btn--disable"
                        title="Desactivar código"
                        @click="toggleStatus(item, 'disabled')"
                      >
                        DESACTIVAR
                      </button>
                      <button
                        v-else-if="item.status === 'disabled'"
                        class="action-btn action-btn--enable"
                        title="Reactivar código"
                        @click="toggleStatus(item, 'active')"
                      >
                        ACTIVAR
                      </button>
                      <span v-else class="text-muted text-center">—</span>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>

    <!-- Toast de Notificación -->
    <transition name="fade">
      <div v-if="toastMessage" class="admin-toast">
        {{ toastMessage }}
      </div>
    </transition>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useAdminStore } from '~/stores/admin'

useHead({
  title: 'Panel Administrativo · Códigos de Recarga · Royal Casino',
})

const store = useAdminStore()

const loginUsername = ref('admin')
const loginPassword = ref('')
const genAmount = ref<number>(1000)
const genCount = ref<number>(1)
const genExpiresInHours = ref<number | null>(null)

// Bindings reactivos desde el Store
const isAdmin = computed(() => store.isAdmin)
const loginLoading = computed(() => store.loginLoading)
const loginError = computed(() => store.loginError)
const stats = computed(() => store.stats)
const codes = computed(() => store.codes)
const loadingCodes = computed(() => store.loadingCodes)
const generating = computed(() => store.generating)
const recentlyCreated = computed(() => store.recentlyCreated)
const toastMessage = computed(() => store.toastMessage)

const filterStatus = computed({
  get: () => store.filterStatus,
  set: (val) => store.setFilter(val as any),
})

const searchQuery = computed({
  get: () => store.searchQuery,
  set: (val) => {
    store.searchQuery = val
  },
})

function debouncedFetch() {
  store.debouncedFetchCodes()
}

function setFilter(st: string) {
  store.setFilter(st as any)
}

async function handleLogin() {
  await store.login(loginUsername.value, loginPassword.value)
}

async function handleLogout() {
  await store.logout()
}

async function handleGenerateCodes() {
  await store.generateCodes({
    amount: genAmount.value,
    count: genCount.value,
    expiresInHours: genExpiresInHours.value,
  })
}

async function toggleStatus(item: any, newStatus: 'active' | 'disabled') {
  await store.setCodeStatus(item, newStatus)
}

function copyToClipboard(text: string) {
  if (navigator.clipboard) {
    navigator.clipboard.writeText(text)
    store.showToast(`Copiado: ${text}`)
  }
}

function copyAllNewCodes() {
  const all = recentlyCreated.value.map((c) => `${c.code} (${c.amount} fichas)`).join('\n')
  if (navigator.clipboard) {
    navigator.clipboard.writeText(all)
    store.showToast('¡Todos los códigos copiados!')
  }
}

function statusLabel(st: string) {
  switch (st) {
    case 'active':
      return 'ACTIVO'
    case 'redeemed':
      return 'CANJEADO'
    case 'disabled':
      return 'DESACTIVADO'
    case 'expired':
      return 'CADUCADO'
    default:
      return st.toUpperCase()
  }
}

function formatDate(epochSec: number) {
  if (!epochSec) return '—'
  const date = new Date(epochSec * 1000)
  return date.toLocaleString('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

onMounted(() => {
  store.checkSession()
})
</script>

<style scoped>
.admin-page {
  min-height: 100vh;
  background-color: #0b0f19;
  background-image: 
    radial-gradient(#1f293d 1px, transparent 1px),
    radial-gradient(#1f293d 1px, #0b0f19 1px);
  background-size: 24px 24px;
  background-position: 0 0, 12px 12px;
  color: #f3f4f6;
  font-family: 'Inter', sans-serif;
  padding: 24px 16px;
}

.admin-container {
  max-width: 1200px;
  margin: 0 auto;
}

/* Login */
.login-wrapper {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 80vh;
}

.login-card {
  width: 100%;
  max-width: 440px;
  background: #111827;
  border: 4px solid #ffd54f;
  box-shadow: 8px 8px 0 #000;
  padding: 32px 24px;
}

.login-header {
  text-align: center;
  margin-bottom: 24px;
}

.login-icon {
  font-size: 2.4rem;
}

.pixel-title {
  font-family: 'Press Start 2P', monospace;
  font-size: 0.85rem;
  color: #ffd54f;
  margin-top: 8px;
  letter-spacing: 0.5px;
}

.login-sub {
  font-family: 'Press Start 2P', monospace;
  font-size: 0.48rem;
  color: #9ca3af;
  margin-top: 6px;
}

.pixel-label {
  display: block;
  font-family: 'Press Start 2P', monospace;
  font-size: 0.52rem;
  color: #ffd54f;
  margin-bottom: 6px;
}

.pixel-input {
  width: 100%;
  background: #030712;
  border: 2px solid #374151;
  color: #60a5fa;
  font-family: 'Press Start 2P', monospace;
  font-size: 0.65rem;
  padding: 10px 12px;
  outline: none;
  transition: border-color 0.15s;
}

.pixel-input:focus {
  border-color: #ffd54f;
  color: #ffd54f;
}

.pixel-input--sm {
  font-size: 0.55rem;
  padding: 6px 10px;
}

.pixel-error-banner {
  background: rgba(239, 68, 68, 0.15);
  border: 2px solid #ef4444;
  color: #f87171;
  font-family: 'Press Start 2P', monospace;
  font-size: 0.52rem;
  padding: 8px 10px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.pixel-btn {
  font-family: 'Press Start 2P', monospace;
  font-size: 0.6rem;
  padding: 10px 16px;
  border: 3px solid;
  box-shadow: 4px 4px 0 #000;
  cursor: pointer;
  transition: transform 0.1s, box-shadow 0.1s;
}

.pixel-btn:hover:not(:disabled) {
  transform: translate(-1px, -1px);
  box-shadow: 5px 5px 0 #000;
}

.pixel-btn:active:not(:disabled) {
  transform: translate(2px, 2px);
  box-shadow: 2px 2px 0 #000;
}

.pixel-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.pixel-btn--gold {
  background: #f59e0b;
  border-color: #ffd54f;
  color: #000;
  font-weight: 700;
}

.pixel-btn--sm {
  font-size: 0.52rem;
  padding: 6px 10px;
  box-shadow: 2px 2px 0 #000;
}

.pixel-btn--ghost {
  background: #1f2937;
  border-color: #4b5563;
  color: #d1d5db;
}

.pixel-btn--danger {
  background: #991b1b;
  border-color: #ef4444;
  color: #fff;
}

.pixel-btn--cyan {
  background: #0891b2;
  border-color: #22d3ee;
  color: #fff;
}

.pixel-back-link {
  font-family: 'Press Start 2P', monospace;
  font-size: 0.52rem;
  color: #9ca3af;
  text-decoration: none;
}
.pixel-back-link:hover {
  color: #ffd54f;
}

/* Dashboard */
.admin-header {
  background: #111827;
  border: 3px solid #374151;
  box-shadow: 4px 4px 0 #000;
  padding: 14px 18px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
}

.header-badge {
  background: #f59e0b;
  color: #000;
  font-family: 'Press Start 2P', monospace;
  font-size: 0.55rem;
  font-weight: 700;
  padding: 4px 8px;
  border: 2px solid #000;
}

.admin-title {
  font-family: 'Press Start 2P', monospace;
  font-size: 0.72rem;
  color: #ffd54f;
  margin: 0;
}

/* Metrics */
.metrics-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 12px;
}

.metric-box {
  background: #111827;
  border: 2px solid #374151;
  box-shadow: 3px 3px 0 #000;
  padding: 14px 16px;
}

.metric-box--green {
  border-color: #10b981;
}
.metric-box--blue {
  border-color: #3b82f6;
}
.metric-box--red {
  border-color: #ef4444;
}

.metric-label {
  font-family: 'Press Start 2P', monospace;
  font-size: 0.5rem;
  color: #9ca3af;
}

.metric-value {
  font-family: 'Press Start 2P', monospace;
  font-size: 1.3rem;
  font-weight: 700;
  color: #fff;
  margin-top: 6px;
}

.metric-sub {
  font-family: 'Press Start 2P', monospace;
  font-size: 0.52rem;
  color: #ffd54f;
  margin-top: 4px;
}

/* Card */
.admin-card {
  background: #111827;
  border: 3px solid #374151;
  box-shadow: 4px 4px 0 #000;
}

.card-header {
  background: #1f2937;
  border-bottom: 2px solid #374151;
  padding: 12px 16px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.card-icon {
  font-size: 1.1rem;
}

.card-title {
  font-family: 'Press Start 2P', monospace;
  font-size: 0.65rem;
  color: #ffd54f;
  margin: 0;
}

/* Generator */
.form-row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 16px;
}

.chip-presets, .count-presets {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.preset-chip {
  background: #1f2937;
  border: 1px solid #4b5563;
  color: #d1d5db;
  font-family: 'Press Start 2P', monospace;
  font-size: 0.45rem;
  padding: 4px 6px;
  cursor: pointer;
}

.preset-chip:hover {
  color: #fff;
  border-color: #ffd54f;
}

.preset-chip.active {
  background: #f59e0b;
  border-color: #ffd54f;
  color: #000;
  font-weight: 700;
}

.preview-text {
  font-size: 0.75rem;
  color: #9ca3af;
}

.new-codes-banner {
  background: #042f2e;
  border-top: 2px solid #14b8a6;
}

.new-codes-title {
  font-family: 'Press Start 2P', monospace;
  font-size: 0.58rem;
  color: #2dd4bf;
}

.new-codes-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 8px;
}

.new-code-pill {
  background: #111827;
  border: 1px solid #14b8a6;
  padding: 6px 10px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  cursor: pointer;
  transition: all 0.15s;
}

.new-code-pill:hover {
  background: #134e4a;
  border-color: #2dd4bf;
}

.new-code-text {
  font-family: 'Press Start 2P', monospace;
  font-size: 0.55rem;
  color: #ffd54f;
}

.new-code-badge {
  font-family: 'Press Start 2P', monospace;
  font-size: 0.5rem;
  color: #6ee7b7;
}

.copy-hint {
  font-size: 0.65rem;
  color: #9ca3af;
}

/* Tabla */
.table-responsive {
  overflow-x: auto;
}

.pixel-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.72rem;
}

.pixel-table th {
  background: #0d121c;
  color: #ffd54f;
  font-family: 'Press Start 2P', monospace;
  font-size: 0.48rem;
  padding: 10px 12px;
  text-align: left;
  border-bottom: 2px solid #374151;
  white-space: nowrap;
}

.pixel-table td {
  padding: 10px 12px;
  border-bottom: 1px solid #1f2937;
  white-space: nowrap;
}

.code-copyable {
  cursor: pointer;
  color: #93c5fd;
  transition: color 0.15s;
}

.code-copyable:hover {
  color: #ffd54f;
}

.copy-icon {
  font-size: 0.7rem;
  opacity: 0.7;
}

.badge {
  font-family: 'Press Start 2P', monospace;
  font-size: 0.45rem;
  padding: 3px 6px;
  border: 1px solid;
}

.badge--active {
  background: rgba(16, 185, 129, 0.15);
  border-color: #10b981;
  color: #6ee7b7;
}

.badge--redeemed {
  background: rgba(59, 130, 246, 0.15);
  border-color: #3b82f6;
  color: #93c5fd;
}

.badge--disabled {
  background: rgba(239, 68, 68, 0.15);
  border-color: #ef4444;
  color: #fca5a5;
}

.badge--expired {
  background: rgba(107, 114, 128, 0.15);
  border-color: #6b7280;
  color: #9ca3af;
}

.action-btn {
  font-family: 'Press Start 2P', monospace;
  font-size: 0.45rem;
  padding: 4px 6px;
  border: 1px solid;
  cursor: pointer;
}

.action-btn--disable {
  background: #450a0a;
  border-color: #ef4444;
  color: #fca5a5;
}

.action-btn--disable:hover {
  background: #ef4444;
  color: #000;
}

.action-btn--enable {
  background: #064e3b;
  border-color: #10b981;
  color: #6ee7b7;
}

.action-btn--enable:hover {
  background: #10b981;
  color: #000;
}

.search-input {
  max-width: 220px;
}

.status-filters {
  display: flex;
  gap: 4px;
}

.filter-pill {
  background: #1f2937;
  border: 1px solid #4b5563;
  color: #9ca3af;
  font-family: 'Press Start 2P', monospace;
  font-size: 0.45rem;
  padding: 6px 8px;
  cursor: pointer;
}

.filter-pill.active {
  background: #ffd54f;
  border-color: #ffd54f;
  color: #000;
  font-weight: 700;
}

.admin-toast {
  position: fixed;
  bottom: 24px;
  right: 24px;
  background: #111827;
  border: 2px solid #ffd54f;
  box-shadow: 4px 4px 0 #000;
  color: #ffd54f;
  font-family: 'Press Start 2P', monospace;
  font-size: 0.55rem;
  padding: 12px 18px;
  z-index: 9999;
}

.pixel-loading {
  font-family: 'Press Start 2P', monospace;
  font-size: 0.55rem;
  color: #ffd54f;
}
</style>
