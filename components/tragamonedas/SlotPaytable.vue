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
  background: #09090e !important;
  border: 2px solid var(--m-primary) !important;
  border-radius: 0 !important;
  box-shadow: 3px 3px 0 #000 !important;
  color: #fff;
  font-family: 'Press Start 2P', monospace;
}

.paytable-title {
  font-family: 'Press Start 2P', monospace;
  font-weight: 700;
  font-size: 0.62rem;
  letter-spacing: 0;
  color: var(--m-primary);
  display: flex;
  align-items: center;
}

.pay-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 6px 8px;
  border-radius: 0;
  margin-bottom: 4px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.08);
  transition: background 0.2s ease, border-color 0.2s ease;
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
  font-family: 'Press Start 2P', monospace;
  font-weight: 700;
  font-size: 0.65rem;
  width: 18px;
  text-align: center;
}

.pay-info {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
}

.pay-amount {
  font-family: 'Press Start 2P', monospace;
  font-weight: 700;
  color: var(--m-primary);
  font-size: 0.65rem;
}

.pay-mult {
  font-family: 'Press Start 2P', monospace;
  font-size: 0.42rem;
  color: rgba(255, 255, 255, 0.5);
  margin-top: 2px;
}

.paytable-footer {
  display: flex;
  justify-content: space-between;
  padding-top: 10px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  font-size: 0.65rem;
}

.paytable-footer > div {
  display: flex;
  flex-direction: column;
}

.footer-label {
  font-family: 'Press Start 2P', monospace;
  font-size: 0.42rem;
  letter-spacing: 0;
  text-transform: uppercase;
  color: rgba(255, 255, 255, 0.5);
}

.paytable-footer strong {
  font-family: 'Press Start 2P', monospace;
  font-size: 0.55rem;
  margin-top: 3px;
}

.paytable-note {
  font-family: 'Press Start 2P', monospace;
  font-size: 0.42rem;
  color: rgba(255, 255, 255, 0.4);
  line-height: 1.4;
}
</style>
