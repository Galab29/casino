<script setup lang="ts">
import type { BetEntry } from '~/components/common/BetHistory.vue'

useHead({ title: 'Apuestas' })

const amount = ref(0)
const allIn = ref(false)
const history = ref<BetEntry[]>([])
const pot = ref<{ download: (withText?: boolean) => void } | null>(null)
let nextId = 1

const chips = [
  { v: 10, bg: '#008075' }, { v: 25, bg: '#388e3c' }, { v: 50, bg: '#1976d2' },
  { v: 100, bg: '#5e35b1' }, { v: 250, bg: '#c62828' }, { v: 500, bg: '#f39c12' },
  { v: 1000, bg: '#d81b60' }, { v: 5000, bg: '#00acc1' }, { v: 10000, bg: '#212121' },
  { v: 50000, bg: '#ffd54f' },
]

function add(v: number) {
  allIn.value = false
  amount.value += v
}
function clear() {
  allIn.value = false
  amount.value = 0
}
function onInput(e: Event) {
  allIn.value = false
  amount.value = parseInt((e.target as HTMLInputElement).value.replace(/\D/g, ''), 10) || 0
}
function placeBet() {
  if (amount.value <= 0) return
  history.value.unshift({ id: nextId++, cantidad: amount.value })
  clear()
}
</script>

<template>
  <main class="apuestas">
    <h1>MANOJO DE FICHAS</h1>

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
      <button id="bet-place" class="btn" @click="placeBet">APOSTAR</button>
    </div>

    <div class="row">
      <button v-for="c in chips" :key="c.v" class="chip"
              :style="{ background: c.bg, color: c.v === 50000 ? '#000' : '#fff' }"
              @click="add(c.v)">+{{ c.v >= 1000 ? c.v / 1000 + 'K' : c.v }}</button>
      <button id="bet-allin" class="chip" style="background:#7f0000;color:#ffd54f"
              @click="allIn = true">ALL IN</button>
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
