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
          <span class="stat-value d-flex align-center">
            <PixelChip :value="m.cost" size="xs" class="mr-1" />{{ m.cost }}
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
  padding: 12px 14px;
  border-radius: 0;
  border: 2px solid var(--m-primary);
  background: #09090e;
  box-shadow: 3px 3px 0 #000;
  color: #fff;
  cursor: pointer;
  transition: transform 0.15s ease, box-shadow 0.15s ease;
  font-family: 'Press Start 2P', monospace;
}

.option-bg {
  position: absolute;
  inset: 0;
  background: var(--m-gradient);
  opacity: 0.4;
  transition: opacity 0.2s ease;
  pointer-events: none;
}

.machine-option > *:not(.option-bg) {
  position: relative;
}

.machine-option:hover:not(:disabled) {
  transform: translate(-2px, -2px);
  box-shadow: 5px 5px 0 #000;
}

.machine-option--active {
  border-color: #fff !important;
  box-shadow: 0 0 0 2px var(--m-primary), 4px 4px 0 #000, 0 0 20px var(--m-glow) !important;
}

.machine-option--active .option-bg {
  opacity: 0.85;
}

.machine-option--disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.option-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 10px;
}

.option-icon {
  width: 38px;
  height: 38px;
  flex-shrink: 0;
  border-radius: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #000;
  border: 2px solid var(--m-primary);
  box-shadow: 2px 2px 0 #000;
}

.option-titles {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.option-name {
  font-family: 'Press Start 2P', monospace;
  font-weight: 700;
  font-size: 0.65rem;
  letter-spacing: 0;
  color: var(--m-primary);
}

.option-sub {
  font-family: 'Press Start 2P', monospace;
  font-size: 0.45rem;
  color: rgba(255, 255, 255, 0.6);
  margin-top: 3px;
  line-height: 1.4;
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
  background: #000;
  border-radius: 0;
  border: 1px solid rgba(255, 255, 255, 0.1);
  padding: 5px 6px;
}

.stat-label {
  font-family: 'Press Start 2P', monospace;
  font-size: 0.4rem;
  letter-spacing: 0;
  text-transform: uppercase;
  color: rgba(255, 255, 255, 0.5);
}

.stat-value {
  font-family: 'Press Start 2P', monospace;
  font-weight: 700;
  font-size: 0.55rem;
  display: flex;
  align-items: center;
  margin-top: 2px;
}

.stat-value--prize {
  color: var(--m-primary);
}

.prob-bar {
  height: 6px;
  border-radius: 0;
  border: 1px solid #000;
  background: rgba(255, 255, 255, 0.1);
  overflow: hidden;
  margin-bottom: 10px;
}

.prob-bar-fill {
  height: 100%;
  border-radius: 0;
  background: var(--m-primary);
}

.option-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-family: 'Press Start 2P', monospace;
  font-size: 0.45rem;
  color: rgba(255, 255, 255, 0.6);
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
  font-weight: 700;
}

@media (max-width: 900px) {
  .selector-grid {
    grid-template-columns: 1fr;
  }
}
</style>
