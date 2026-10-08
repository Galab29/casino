<script setup lang="ts">
import type { MachineTier, SlotMachineConfig } from '~/types/slots'
import { getMaxPayout, getWinProbability } from '~/constants/slotMachines'

interface Props {
  machines: SlotMachineConfig[]
  chips: number
  disabled?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  disabled: false,
})

// v-model: id de la máquina seleccionada
const selected = defineModel<MachineTier>({ required: true })

const emit = defineEmits<{
  (e: 'change', id: MachineTier): void
}>()

function choose(machine: SlotMachineConfig) {
  if (props.disabled || selected.value === machine.id) return
  selected.value = machine.id
  emit('change', machine.id)
}

function formatPercent(p: number): string {
  return `${(p * 100).toFixed(1)}%`
}
</script>

<template>
  <div class="selector-grid">
    <button
      v-for="m in machines"
      :id="`machine-${m.id}`"
      :key="m.id"
      type="button"
      class="machine-option"
      :class="{
        'machine-option--active': selected === m.id,
        'machine-option--disabled': disabled && selected !== m.id,
      }"
      :style="{
        '--m-primary': m.theme.primary,
        '--m-secondary': m.theme.secondary,
        '--m-glow': m.theme.glow,
        '--m-gradient': m.theme.gradient,
      }"
      :disabled="disabled && selected !== m.id"
      @click="choose(m)"
    >
      <div class="option-bg" />

      <div class="option-header">
        <div class="option-icon">
          <v-icon size="26" :color="m.theme.primary">{{ m.icon }}</v-icon>
        </div>
        <div class="option-titles">
          <span class="option-name">{{ m.name }}</span>
          <span class="option-sub">{{ m.subtitle }}</span>
        </div>
      </div>

      <div class="option-stats">
        <div class="stat">
          <span class="stat-label">Costo</span>
          <span class="stat-value">
            <v-icon size="14" class="mr-1">mdi-poker-chip</v-icon>{{ m.cost }}
          </span>
        </div>
        <div class="stat">
          <span class="stat-label">Premio máx.</span>
          <span class="stat-value stat-value--prize">{{ getMaxPayout(m).toLocaleString() }}</span>
        </div>
        <div class="stat">
          <span class="stat-label">Prob. ganar</span>
          <span class="stat-value">{{ formatPercent(getWinProbability(m)) }}</span>
        </div>
      </div>

      <div class="prob-bar">
        <div class="prob-bar-fill" :style="{ width: `${Math.min(100, (getWinProbability(m) / 0.3) * 100)}%` }" />
      </div>

      <div class="option-footer">
        <span class="risk">
          Riesgo
          <v-icon
            v-for="n in 3"
            :key="n"
            size="14"
            :color="n <= m.risk ? '#ff6e40' : 'rgba(255,255,255,0.18)'"
          >
            mdi-fire
          </v-icon>
        </span>
        <span v-if="chips < m.cost" class="no-funds">
          <v-icon size="12" class="mr-1">mdi-lock</v-icon>Sin fondos
        </span>
        <span v-else-if="selected === m.id" class="active-tag">
          <v-icon size="12" class="mr-1">mdi-check-circle</v-icon>Seleccionada
        </span>
      </div>
    </button>
  </div>
</template>

<style scoped>
.selector-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 14px;
}

.machine-option {
  position: relative;
  overflow: hidden;
  text-align: left;
  padding: 14px 16px;
  border-radius: 18px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(10, 10, 20, 0.6);
  color: #fff;
  cursor: pointer;
  transition: transform 0.3s ease, border-color 0.3s ease, box-shadow 0.3s ease;
  font-family: 'Outfit', sans-serif;
}

.option-bg {
  position: absolute;
  inset: 0;
  background: var(--m-gradient);
  opacity: 0.55;
  transition: opacity 0.3s ease;
  pointer-events: none;
}

.machine-option > *:not(.option-bg) {
  position: relative;
}

.machine-option:hover:not(:disabled) {
  transform: translateY(-4px);
  border-color: var(--m-primary);
}

.machine-option--active {
  border-color: var(--m-primary);
  box-shadow: 0 0 0 1px var(--m-primary), 0 10px 36px var(--m-glow);
}

.machine-option--active .option-bg {
  opacity: 0.95;
}

.machine-option--disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.option-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}

.option-icon {
  width: 44px;
  height: 44px;
  flex-shrink: 0;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.35);
  border: 1px solid var(--m-primary);
  box-shadow: 0 0 14px var(--m-glow);
}

.option-titles {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.option-name {
  font-family: 'Cinzel', serif;
  font-weight: 700;
  font-size: 1.02rem;
  letter-spacing: 1.5px;
  color: var(--m-primary);
}

.option-sub {
  font-size: 0.72rem;
  color: rgba(255, 255, 255, 0.55);
  line-height: 1.3;
}

.option-stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 6px;
  margin-bottom: 10px;
}

.stat {
  display: flex;
  flex-direction: column;
  background: rgba(0, 0, 0, 0.3);
  border-radius: 10px;
  padding: 6px 8px;
}

.stat-label {
  font-size: 0.62rem;
  letter-spacing: 1px;
  text-transform: uppercase;
  color: rgba(255, 255, 255, 0.45);
}

.stat-value {
  font-weight: 700;
  font-size: 0.95rem;
  display: flex;
  align-items: center;
}

.stat-value--prize {
  color: var(--m-primary);
}

.prob-bar {
  height: 4px;
  border-radius: 4px;
  background: rgba(255, 255, 255, 0.08);
  overflow: hidden;
  margin-bottom: 10px;
}

.prob-bar-fill {
  height: 100%;
  border-radius: 4px;
  background: linear-gradient(90deg, var(--m-secondary), var(--m-primary));
}

.option-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 0.72rem;
  color: rgba(255, 255, 255, 0.55);
}

.risk {
  display: flex;
  align-items: center;
  gap: 2px;
}

.no-funds {
  color: #ff8a80;
  display: flex;
  align-items: center;
}

.active-tag {
  color: var(--m-primary);
  display: flex;
  align-items: center;
  font-weight: 600;
}

@media (max-width: 900px) {
  .selector-grid {
    grid-template-columns: 1fr;
  }
}
</style>
