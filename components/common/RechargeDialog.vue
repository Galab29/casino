<template>
  <v-dialog v-model="isOpen" max-width="520" persistent>
    <div class="pixel-dialog">
      <!-- Header -->
      <div class="dialog-header">
        <div class="d-flex align-center ga-2">
          <span class="header-icon">🪙</span>
          <span class="pixel-title">CAJERO · RECARGA</span>
        </div>
        <button class="pixel-close-btn" @click="close">✕</button>
      </div>

      <!-- Saldo Actual Banner -->
      <div class="balance-banner">
        <div class="d-flex flex-column">
          <span class="banner-label">SALDO EN CUENTA</span>
          <div class="d-flex align-center ga-2 mt-1">
            <span class="pixel-balance">{{ chips.toLocaleString() }}</span>
            <span class="banner-unit">FICHAS</span>
          </div>
        </div>
        <div class="chip-avatar">🎰</div>
      </div>

      <!-- Tabs de navegación -->
      <div class="pixel-tabs">
        <button
          class="pixel-tab"
          :class="{ active: activeTab === 'redeem' }"
          @click="activeTab = 'redeem'"
        >
          CANJEAR CÓDIGO
        </button>
        <button
          class="pixel-tab"
          :class="{ active: activeTab === 'history' }"
          @click="loadHistoryTab"
        >
          HISTORIAL
        </button>
      </div>

      <!-- Contenido de Canje -->
      <div v-if="activeTab === 'redeem'" class="dialog-body">
        <p class="section-desc">
          Ingresa tu código de recarga de Royal Casino para acreditar monedas inmediatamente a tu saldo:
        </p>

        <div class="input-container">
          <label class="pixel-input-label">CÓDIGO DE RECARGA</label>
          <div class="input-wrapper">
            <input
              v-model="inputCode"
              type="text"
              class="pixel-input"
              placeholder="ROYAL-XXXX-XXXX-XXXX"
              maxlength="30"
              spellcheck="false"
              :disabled="loading"
              @input="formatCodeInput"
              @keyup.enter="handleRedeem"
            />
          </div>
        </div>

        <!-- Mensaje de Feedback -->
        <transition name="fade">
          <div
            v-if="feedbackMessage"
            class="feedback-banner"
            :class="feedbackType"
          >
            <span class="feedback-icon">{{ feedbackType === 'success' ? '✔' : '⚠' }}</span>
            <span class="feedback-text">{{ feedbackMessage }}</span>
          </div>
        </transition>

        <!-- Botón Canjear -->
        <button
          class="pixel-redeem-btn"
          :disabled="loading || !inputCode.trim()"
          @click="handleRedeem"
        >
          <span v-if="loading">VERIFICANDO...</span>
          <span v-else>CANJEAR CÓDIGO</span>
        </button>

        <div class="info-note">
          Los códigos son de un solo uso y se validan en tiempo real en los servidores de Royal Casino.
        </div>
      </div>

      <!-- Contenido de Historial -->
      <div v-else class="dialog-body">
        <div v-if="loadingHistory" class="text-center py-6">
          <span class="pixel-loading">CARGANDO HISTORIAL...</span>
        </div>
        <div v-else-if="transactions.length === 0" class="empty-state">
          <span>NO HAY RECARGAS REGISTRADAS</span>
        </div>
        <div v-else class="history-list">
          <div
            v-for="tx in transactions"
            :key="tx.id"
            class="history-card"
          >
            <div class="d-flex justify-space-between align-center">
              <span class="tx-code">{{ tx.code || 'CÓDIGO' }}</span>
              <span class="tx-amount">+{{ tx.amount.toLocaleString() }} 🪙</span>
            </div>
            <div class="d-flex justify-space-between align-center mt-1">
              <span class="tx-date">{{ formatDate(tx.createdAt) }}</span>
              <span class="tx-balance">Saldo: {{ tx.balanceAfter.toLocaleString() }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </v-dialog>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useWalletStore } from '~/stores/wallet'
import { useRechargeStore } from '~/stores/recharge'
import { useSoundEngine } from '~/composables/useSoundEngine'
import { useConfetti } from '~/composables/useConfetti'

const props = defineProps<{
  modelValue: boolean
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', val: boolean): void
  (e: 'recharged', amount: number): void
}>()

const wallet = useWalletStore()
const recharge = useRechargeStore()
const sound = useSoundEngine()
const effects = useConfetti()

const isOpen = computed({
  get: () => props.modelValue,
  set: (val: boolean) => emit('update:modelValue', val),
})

const chips = computed(() => wallet.chips)

const activeTab = ref<'redeem' | 'history'>('redeem')
const inputCode = ref('')

const loading = computed(() => recharge.isRedeeming)
const feedbackMessage = computed(() => recharge.feedbackMessage)
const feedbackType = computed(() => recharge.feedbackType)
const transactions = computed(() => recharge.transactions)
const loadingHistory = computed(() => recharge.isLoadingHistory)

function close() {
  isOpen.value = false
  recharge.clearFeedback()
}

function formatCodeInput() {
  // Convertir a mayúsculas y quitar espacios extra
  inputCode.value = inputCode.value.toUpperCase().replace(/\s+/g, '')
}

async function handleRedeem() {
  const code = inputCode.value.trim()
  if (!code || loading.value) return

  const amount = await recharge.redeem(code)

  if (amount !== null) {
    inputCode.value = ''
    sound.playWin()
    sound.playCoinCascade(12)
    effects.launchConfetti(2500)
    effects.floatingText(`+${amount.toLocaleString()} 🪙`, '#69f0ae')
    emit('recharged', amount)
  } else {
    sound.playBust()
  }
}

async function loadHistoryTab() {
  activeTab.value = 'history'
  await recharge.loadTransactions()
}

function formatDate(epochSec: number) {
  if (!epochSec) return ''
  const date = new Date(epochSec * 1000)
  return date.toLocaleDateString('es-ES', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
}
</script>

<style scoped>
.pixel-dialog {
  background: #0d1117;
  border: 4px solid #ffd54f;
  box-shadow: 6px 6px 0 #000;
  color: #fff;
  font-family: 'Inter', sans-serif;
  overflow: hidden;
}

.dialog-header {
  background: #161b22;
  border-bottom: 3px solid #30363d;
  padding: 12px 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-icon {
  font-size: 1.2rem;
}

.pixel-title {
  font-family: 'Press Start 2P', monospace;
  font-size: 0.72rem;
  color: #ffd54f;
  text-shadow: 1px 1px 0 #000;
  letter-spacing: 0.5px;
}

.pixel-close-btn {
  background: #21262d;
  border: 2px solid #30363d;
  color: #c9d1d9;
  font-family: 'Press Start 2P', monospace;
  font-size: 0.65rem;
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.15s;
}

.pixel-close-btn:hover {
  background: #da3633;
  color: #fff;
  border-color: #f85149;
}

.balance-banner {
  background: linear-gradient(135deg, #1b2330 0%, #0d1117 100%);
  border-bottom: 2px solid #ffd54f;
  padding: 14px 18px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.banner-label {
  font-family: 'Press Start 2P', monospace;
  font-size: 0.5rem;
  color: #8b949e;
  letter-spacing: 0.5px;
}

.pixel-balance {
  font-family: 'Press Start 2P', monospace;
  font-size: 1.1rem;
  font-weight: 700;
  color: #ffd54f;
  text-shadow: 2px 2px 0 #000;
}

.banner-unit {
  font-family: 'Press Start 2P', monospace;
  font-size: 0.55rem;
  color: #69f0ae;
}

.chip-avatar {
  font-size: 2rem;
  filter: drop-shadow(2px 2px 0 #000);
}

.pixel-tabs {
  display: flex;
  background: #161b22;
  border-bottom: 2px solid #30363d;
}

.pixel-tab {
  flex: 1;
  padding: 10px 8px;
  background: transparent;
  border: none;
  border-bottom: 3px solid transparent;
  color: #8b949e;
  font-family: 'Press Start 2P', monospace;
  font-size: 0.52rem;
  cursor: pointer;
  transition: all 0.2s;
}

.pixel-tab:hover {
  color: #f0f6fc;
}

.pixel-tab.active {
  color: #ffd54f;
  border-bottom-color: #ffd54f;
  background: rgba(255, 213, 79, 0.08);
}

.dialog-body {
  padding: 20px 18px;
}

.section-desc {
  font-size: 0.78rem;
  color: #c9d1d9;
  line-height: 1.4;
  margin-bottom: 16px;
}

.pixel-input-label {
  display: block;
  font-family: 'Press Start 2P', monospace;
  font-size: 0.52rem;
  color: #ffd54f;
  margin-bottom: 8px;
  letter-spacing: 0.5px;
}

.pixel-input {
  width: 100%;
  background: #040d21;
  border: 2px solid #388bfd;
  box-shadow: inset 2px 2px 0 #000;
  color: #58a6ff;
  font-family: 'Press Start 2P', monospace;
  font-size: 0.72rem;
  padding: 12px 14px;
  outline: none;
  letter-spacing: 1px;
}

.pixel-input:focus {
  border-color: #ffd54f;
  color: #ffd54f;
}

.feedback-banner {
  margin-top: 14px;
  padding: 10px 12px;
  border: 2px solid;
  display: flex;
  align-items: center;
  gap: 10px;
}

.feedback-banner.success {
  background: rgba(105, 240, 174, 0.12);
  border-color: #69f0ae;
  color: #69f0ae;
}

.feedback-banner.error {
  background: rgba(255, 82, 82, 0.12);
  border-color: #ff5252;
  color: #ff5252;
}

.feedback-icon {
  font-family: 'Press Start 2P', monospace;
  font-size: 0.7rem;
}

.feedback-text {
  font-family: 'Press Start 2P', monospace;
  font-size: 0.55rem;
  line-height: 1.4;
}

.pixel-redeem-btn {
  margin-top: 18px;
  width: 100%;
  padding: 14px;
  background: #f59e0b;
  border: 3px solid #ffd54f;
  box-shadow: 4px 4px 0 #000;
  color: #000;
  font-family: 'Press Start 2P', monospace;
  font-size: 0.65rem;
  font-weight: 700;
  cursor: pointer;
  transition: transform 0.1s, box-shadow 0.1s;
}

.pixel-redeem-btn:hover:not(:disabled) {
  background: #fbbf24;
  transform: translate(-1px, -1px);
  box-shadow: 5px 5px 0 #000;
}

.pixel-redeem-btn:active:not(:disabled) {
  transform: translate(2px, 2px);
  box-shadow: 2px 2px 0 #000;
}

.pixel-redeem-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  filter: grayscale(0.7);
}

.info-note {
  margin-top: 16px;
  font-size: 0.68rem;
  color: #8b949e;
  text-align: center;
  line-height: 1.4;
}

/* Historial */
.history-list {
  max-height: 240px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.history-card {
  background: #161b22;
  border: 1px solid #30363d;
  padding: 8px 12px;
}

.tx-code {
  font-family: 'Press Start 2P', monospace;
  font-size: 0.52rem;
  color: #ffd54f;
}

.tx-amount {
  font-family: 'Press Start 2P', monospace;
  font-size: 0.55rem;
  color: #69f0ae;
  font-weight: 700;
}

.tx-date {
  font-size: 0.65rem;
  color: #8b949e;
}

.tx-balance {
  font-size: 0.65rem;
  color: #c9d1d9;
}

.empty-state, .pixel-loading {
  font-family: 'Press Start 2P', monospace;
  font-size: 0.55rem;
  color: #8b949e;
  text-align: center;
}
</style>
