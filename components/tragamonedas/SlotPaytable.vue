<script setup lang="ts">
import { computed } from 'vue'
import type { SlotMachineConfig } from '~/types/slots'
import { getRTP, getSymbol, getWinProbability, oneIn } from '~/constants/slotMachines'

interface Props {
  machine: SlotMachineConfig
  highlightSymbolId?: string | null
}

const props = withDefaults(defineProps<Props>(), {
  highlightSymbolId: null,
})

// Mostramos el premio mayor arriba
const rows = computed(() =>
  [...props.machine.paytable].reverse().map((rule) => ({
    ...rule,
    symbol: getSymbol(props.machine, rule.symbolId),
    payout: rule.multiplier * props.machine.cost,
  })),
)

const winProbability = computed(() => getWinProbability(props.machine))
const rtp = computed(() => getRTP(props.machine))
</script>

<template>
  <v-card class="paytable pa-4" rounded="xl" flat :style="{ '--m-primary': machine.theme.primary }">
    <div class="paytable-title mb-3">
      <v-icon size="18" class="mr-1" :color="machine.theme.primary">mdi-table-star</v-icon>
      TABLA DE PAGOS
    </div>

    <div
      v-for="row in rows"
      :key="row.symbolId"
      class="pay-row"
      :class="{ 'pay-row--hit': highlightSymbolId === row.symbolId }"
    >
      <div class="pay-symbols">
        <template v-for="n in 3" :key="n">
          <v-icon v-if="row.symbol.icon" size="20" :color="row.symbol.color">{{ row.symbol.icon }}</v-icon>
          <span v-else class="pay-text" :style="{ color: row.symbol.color }">{{ row.symbol.text }}</span>
        </template>
      </div>
      <div class="pay-info">
        <span class="pay-amount">{{ row.payout.toLocaleString() }}</span>
        <span class="pay-mult">x{{ row.multiplier }} · 1 en {{ oneIn(row.probability).toLocaleString() }}</span>
      </div>
    </div>

    <div class="paytable-footer mt-3">
      <div>
        <span class="footer-label">Prob. de ganar</span>
        <strong>{{ (winProbability * 100).toFixed(2) }}%</strong>
      </div>
      <div>
        <span class="footer-label">RTP teórico</span>
        <strong>{{ (rtp * 100).toFixed(1) }}%</strong>
      </div>
    </div>
    <p class="paytable-note mt-2">
      Sólo pagan 3 símbolos iguales en la línea central.
    </p>
  </v-card>
</template>

<style scoped>
.paytable {
  background: rgba(0, 0, 0, 0.45) !important;
  border: 1px solid rgba(255, 255, 255, 0.08);
  color: #fff;
  font-family: 'Outfit', sans-serif;
}

.paytable-title {
  font-family: 'Cinzel', serif;
  font-weight: 700;
  font-size: 0.85rem;
  letter-spacing: 3px;
  color: rgba(255, 255, 255, 0.8);
  display: flex;
  align-items: center;
}

.pay-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 7px 10px;
  border-radius: 10px;
  margin-bottom: 4px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid transparent;
  transition: background 0.3s ease, border-color 0.3s ease;
}

.pay-row--hit {
  background: rgba(255, 255, 255, 0.1);
  border-color: var(--m-primary);
  animation: row-flash 0.6s ease-in-out 4;
}

@keyframes row-flash {
  0%, 100% { box-shadow: 0 0 0 transparent; }
  50% { box-shadow: 0 0 16px var(--m-primary); }
}

.pay-symbols {
  display: flex;
  gap: 2px;
  align-items: center;
}

.pay-text {
  font-family: 'Cinzel', serif;
  font-weight: 900;
  font-size: 1.1rem;
  width: 20px;
  text-align: center;
}

.pay-info {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
}

.pay-amount {
  font-weight: 700;
  color: var(--m-primary);
  font-size: 0.95rem;
}

.pay-mult {
  font-size: 0.68rem;
  color: rgba(255, 255, 255, 0.45);
}

.paytable-footer {
  display: flex;
  justify-content: space-between;
  padding-top: 10px;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
  font-size: 0.85rem;
}

.paytable-footer > div {
  display: flex;
  flex-direction: column;
}

.footer-label {
  font-size: 0.65rem;
  letter-spacing: 1px;
  text-transform: uppercase;
  color: rgba(255, 255, 255, 0.45);
}

.paytable-note {
  font-size: 0.7rem;
  color: rgba(255, 255, 255, 0.35);
}
</style>
