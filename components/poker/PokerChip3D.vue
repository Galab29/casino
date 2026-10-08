<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  amount?: number
  size?: 'sm' | 'md' | 'lg'
  stacked?: boolean
  label?: string
}

const props = withDefaults(defineProps<Props>(), {
  amount: 25,
  size: 'md',
  stacked: false,
  label: '',
})

interface ChipTheme {
  primary: string
  secondary: string
  accent: string
  textColor: string
  borderRing: string
}

const theme = computed<ChipTheme>(() => {
  const val = props.amount
  if (val >= 1000) {
    return {
      primary: '#e65100',
      secondary: '#ffd54f',
      accent: '#ffb300',
      textColor: '#fff',
      borderRing: '#ffd54f',
    }
  }
  if (val >= 500) {
    return {
      primary: '#4a148c',
      secondary: '#ba68c8',
      accent: '#ffd54f',
      textColor: '#fff',
      borderRing: '#e1bee7',
    }
  }
  if (val >= 100) {
    return {
      primary: '#1a1a1a',
      secondary: '#e53935',
      accent: '#ffd54f',
      textColor: '#fff',
      borderRing: '#ffd54f',
    }
  }
  if (val >= 50) {
    return {
      primary: '#0d47a1',
      secondary: '#ffffff',
      accent: '#42a5f5',
      textColor: '#fff',
      borderRing: '#bbdefb',
    }
  }
  if (val >= 25) {
    return {
      primary: '#1b5e20',
      secondary: '#ffffff',
      accent: '#66bb6a',
      textColor: '#fff',
      borderRing: '#c8e6c9',
    }
  }
  // Base / small
  return {
    primary: '#455a64',
    secondary: '#ffffff',
    accent: '#90a4ae',
    textColor: '#fff',
    borderRing: '#cfd8dc',
  }
})

// Number of visual layers in stack (up to 3 for performance & crispness)
const stackCount = computed(() => {
  if (!props.stacked) return 1
  if (props.amount >= 200) return 3
  if (props.amount >= 50) return 2
  return 1
})

function formatDisplay(val: number): string {
  if (props.label) return props.label
  if (val >= 1000000) return `${(val / 1000000).toFixed(1)}M`
  if (val >= 10000) return `${(val / 1000).toFixed(0)}k`
  if (val >= 1000) return `${(val / 1000).toFixed(1)}k`
  return `${val}`
}
</script>

<template>
  <div
    class="poker-chip-3d-wrapper"
    :class="[`chip--${size}`, { 'is-stacked': stacked }]"
  >
    <!-- 3D Stack Under-Layers -->
    <template v-if="stackCount > 1">
      <div
        v-for="layer in (stackCount - 1)"
        :key="layer"
        class="chip-disc chip-disc--under"
        :style="{
          '--primary': theme.primary,
          '--secondary': theme.secondary,
          '--accent': theme.accent,
          '--layer-offset': `${layer * -4}px`,
          '--layer-z': 1 + layer,
        }"
      />
    </template>

    <!-- Top / Main 3D Chip Disc -->
    <div
      class="chip-disc chip-disc--top"
      :style="{
        '--primary': theme.primary,
        '--secondary': theme.secondary,
        '--accent': theme.accent,
        '--border-ring': theme.borderRing,
        '--text-color': theme.textColor,
        '--layer-offset': `${stackCount > 1 ? (stackCount - 1) * -4 : 0}px`,
        '--layer-z': 10,
      }"
    >
      <!-- Rim Outer Stripes (6 alternating casino inserts) -->
      <div class="chip-stripes">
        <span class="stripe stripe-1" />
        <span class="stripe stripe-2" />
        <span class="stripe stripe-3" />
        <span class="stripe stripe-4" />
        <span class="stripe stripe-5" />
        <span class="stripe stripe-6" />
      </div>

      <!-- Inner Recessed Metallic Inlay -->
      <div class="chip-inner-core">
        <div class="chip-ring" />
        <span class="chip-val">{{ formatDisplay(amount) }}</span>
      </div>

      <!-- Realistic Top Specular Bevel Highlight -->
      <div class="chip-sheen" />
    </div>
  </div>
</template>

<style scoped>
.poker-chip-3d-wrapper {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  vertical-align: middle;
  perspective: 600px;
  user-select: none;
}

/* Sizes */
.chip--sm {
  width: 28px;
  height: 28px;
}
.chip--md {
  width: 36px;
  height: 36px;
}
.chip--lg {
  width: 46px;
  height: 46px;
}

/* Stacked wrapper adds top margin for the 3D extrusion */
.is-stacked {
  margin-top: 8px;
}

/* Individual 3D Disc */
.chip-disc {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  border-radius: 50%;
  background: radial-gradient(circle at 35% 30%, var(--primary) 0%, #080808 110%);
  transform: translateY(var(--layer-offset, 0)) rotateX(15deg);
  z-index: var(--layer-z, 1);
  box-shadow:
    0 2px 0 rgba(0, 0, 0, 0.9),
    0 4px 6px rgba(0, 0, 0, 0.75),
    0 8px 16px rgba(0, 0, 0, 0.5),
    inset 0 2px 2px rgba(255, 255, 255, 0.35),
    inset 0 -2px 3px rgba(0, 0, 0, 0.85);
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  transition: transform 0.25s ease;
}

.chip-disc--under {
  filter: brightness(0.78);
  pointer-events: none;
}

/* Edge stripes (Casino Clay inserts) */
.chip-stripes {
  position: absolute;
  inset: 0;
  border-radius: 50%;
  pointer-events: none;
}

.stripe {
  position: absolute;
  top: 0;
  left: 50%;
  width: 16%;
  height: 100%;
  margin-left: -8%;
  background: linear-gradient(
    to bottom,
    var(--secondary) 0%,
    var(--secondary) 14%,
    transparent 14%,
    transparent 86%,
    var(--secondary) 86%,
    var(--secondary) 100%
  );
}

.stripe-1 { transform: rotate(0deg); }
.stripe-2 { transform: rotate(60deg); }
.stripe-3 { transform: rotate(120deg); }
.stripe-4 { transform: rotate(180deg); }
.stripe-5 { transform: rotate(240deg); }
.stripe-6 { transform: rotate(300deg); }

/* Center Inlay */
.chip-inner-core {
  position: relative;
  width: 60%;
  height: 60%;
  border-radius: 50%;
  background: radial-gradient(circle at 35% 30%, #202020 0%, #050505 100%);
  border: 1.5px solid var(--border-ring, rgba(255, 215, 0, 0.8));
  box-shadow:
    inset 0 2px 4px rgba(0, 0, 0, 0.9),
    0 1px 2px rgba(255, 255, 255, 0.25);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2;
}

.chip-ring {
  position: absolute;
  inset: 2px;
  border-radius: 50%;
  border: 1px dashed rgba(255, 255, 255, 0.35);
  pointer-events: none;
}

.chip-val {
  font-family: 'Cinzel', serif;
  font-weight: 900;
  color: var(--text-color, #ffd54f);
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.95);
  line-height: 1;
}

.chip--sm .chip-val {
  font-size: 0.58rem;
}
.chip--md .chip-val {
  font-size: 0.74rem;
}
.chip--lg .chip-val {
  font-size: 0.92rem;
}

/* Gloss / Satin Sheen */
.chip-sheen {
  position: absolute;
  inset: 0;
  border-radius: 50%;
  background: linear-gradient(
    135deg,
    rgba(255, 255, 255, 0.45) 0%,
    rgba(255, 255, 255, 0.1) 40%,
    transparent 55%,
    rgba(0, 0, 0, 0.3) 100%
  );
  pointer-events: none;
  z-index: 3;
}
</style>
