<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useApuestasStore } from '~/stores/apuestas'
import { useSoundEngine } from '~/composables/useSoundEngine'
import { useConfetti } from '~/composables/useConfetti'

useHead({ title: 'Apuestas · Royal Casino' })

const store = useApuestasStore()
const sound = useSoundEngine()
const effects = useConfetti()

const pot = ref<{ download: (withText?: boolean) => void } | null>(null)

const amount = computed(() => store.amount)
const allIn = computed(() => store.allIn)
const chipsBalance = computed(() => store.chips)
const history = computed(() => store.historyEntries)
const error = computed(() => store.error)
const isSaving = computed(() => store.isSaving)

onMounted(() => {
  store.loadHistory()
})

const chips = [
  { v: 10, bg: '#008075' }, { v: 25, bg: '#388e3c' }, { v: 50, bg: '#1976d2' },
  { v: 100, bg: '#5e35b1' }, { v: 250, bg: '#c62828' }, { v: 500, bg: '#f39c12' },
  { v: 1000, bg: '#d81b60' }, { v: 5000, bg: '#00acc1' }, { v: 10000, bg: '#212121' },
  { v: 50000, bg: '#ffd54f' },
]

function add(v: number) {
  sound.playChipClick()
  store.addAmount(v)
}
function clear() {
  sound.playButtonClick()
  store.clearAmount()
}
function onInput(e: Event) {
  const val = parseInt((e.target as HTMLInputElement).value.replace(/\D/g, ''), 10) || 0
  store.setAmount(val)
}
function handleAllIn() {
  sound.playChipStack()
  store.setAllIn()
}
async function handlePlaceBet() {
  const betVal = allIn.value ? chipsBalance.value : amount.value
  const ok = await store.placeBet()
  if (ok) {
    sound.playBetPlace()
    effects.floatingText(`-${betVal.toLocaleString()} 🪙`, '#ef4444')
  } else {
    sound.playBust()
  }
}
</script>

<template>
  <main class="apuestas">
    <h1>MANOJO DE FICHAS</h1>

    <!-- Saldo del Usuario en el Servidor -->
    <div class="balance-card">
      <div class="d-flex align-center ga-2">
        <span class="coin-icon">🪙</span>
        <span class="balance-label">SALDO:</span>
        <span class="balance-num">{{ chipsBalance.toLocaleString() }}</span>
        <span class="balance-unit">FICHAS</span>
      </div>
      <button class="recharge-link-btn" @click="store.openRecharge()">+ RECARGAR</button>
    </div>

    <div v-if="error" class="error-banner">
      ⚠ {{ error }}
    </div>

    <div class="stage">
      <BetPot ref="pot" :amount="amount" :all-in="allIn" />
    </div>

    <div class="row">
      <label class="field">
        TOTAL $
        <input id="bet-input" type="text" inputmode="numeric" maxlength="9"
               :value="allIn ? 'ALL IN' : amount" @input="onInput">
      </label>
      <button id="bet-clear" class="btn alt" @click="clear">LIMPIAR</button>
      <button id="bet-place" class="btn" :disabled="isSaving || (amount <= 0 && !allIn)" @click="handlePlaceBet">
        {{ isSaving ? 'GUARDANDO...' : 'APOSTAR' }}
      </button>
    </div>

    <div class="row">
      <button v-for="c in chips" :key="c.v" class="chip"
              :style="{ background: c.bg, color: c.v === 50000 ? '#000' : '#fff' }"
              @click="add(c.v)">+{{ c.v >= 1000 ? c.v / 1000 + 'K' : c.v }}</button>
      <button id="bet-allin" class="chip" style="background:#7f0000;color:#ffd54f"
              @click="handleAllIn">ALL IN</button>
    </div>

    <div class="row">
      <button id="bet-dl-text" class="btn" @click="pot?.download(true)">PNG (CON MONTO)</button>
      <button id="bet-dl-empty" class="btn alt" @click="pot?.download(false)">PNG (VACÍO)</button>
    </div>

    <BetHistory :bets="history" class="hist" />
  </main>
</template>

<style scoped>
.apuestas {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
  padding: 25px;
  font-family: 'Press Start 2P', monospace;
  color: #fff;
}
h1 {
  font-size: 14px;
  color: #ffd54f;
  text-shadow: 2px 2px 0 #000;
}
.balance-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  background: #111827;
  border: 3px solid #ffd54f;
  padding: 10px 16px;
  box-shadow: 4px 4px 0 #000;
  width: 100%;
  max-width: 520px;
}
.coin-icon {
  font-size: 16px;
}
.balance-label {
  font-size: 10px;
  color: #9ca3af;
}
.balance-num {
  font-size: 12px;
  color: #ffd54f;
  text-shadow: 1px 1px 0 #000;
}
.balance-unit {
  font-size: 9px;
  color: #6b7280;
}
.recharge-link-btn {
  background: #059669;
  color: #fff;
  border: 2px solid #34d399;
  font-family: inherit;
  font-size: 8px;
  padding: 6px 10px;
  cursor: pointer;
  box-shadow: 2px 2px 0 #000;
}
.recharge-link-btn:active {
  transform: translateY(2px);
  box-shadow: none;
}
.error-banner {
  background: #7f1d1d;
  color: #fca5a5;
  border: 2px solid #ef4444;
  padding: 8px 12px;
  font-size: 9px;
  text-align: center;
  max-width: 520px;
  width: 100%;
}
.stage {
  background: radial-gradient(circle, #1e4d26 0%, #112a15 100%);
  border: 4px solid #061108;
  padding: 20px;
}
.row {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  justify-content: center;
  align-items: center;
}
.field {
  display: flex;
  align-items: center;
  gap: 10px;
  background: #1a1a1a;
  padding: 10px 14px;
  border: 3px solid #ffd54f;
  font-size: 10px;
  color: #ffd54f;
}
.field input {
  font-family: inherit;
  font-size: 12px;
  background: #000;
  color: #fff;
  border: 2px solid #555;
  padding: 6px 10px;
  width: 130px;
  text-align: right;
}
.chip, .btn {
  font-family: inherit;
  font-size: 10px;
  cursor: pointer;
  border: 3px solid #fff;
  padding: 10px 12px;
  color: #fff;
  box-shadow: 0 3px 0 #000;
}
.btn {
  background: #ffd54f;
  color: #000;
  border-color: #000;
  box-shadow: 4px 4px 0 #000;
  padding: 12px 16px;
}
.btn.alt { background: #e0e0e0; }
.chip:active, .btn:active { transform: translateY(3px); box-shadow: none; }
.hist { width: 100%; max-width: 520px; }

@media (max-width: 600px) {
  .apuestas {
    padding: 12px 8px;
    gap: 14px;
  }
  .stage {
    padding: 10px 4px;
    width: 100%;
    display: flex;
    justify-content: center;
  }
  .chip, .btn {
    font-size: 8px;
    padding: 8px 10px;
  }
  .field {
    width: 100%;
    justify-content: space-between;
  }
}
</style>
