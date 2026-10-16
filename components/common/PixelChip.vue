<script setup lang="ts">
import { computed } from 'vue'
import { getPixelChipImage } from '~/utils/pixelChips'

interface Props {
  value: number | string
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | number
  active?: boolean
  disabled?: boolean
  stacked?: boolean
  showLabel?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  size: 'md',
  active: false,
  disabled: false,
  stacked: false,
  showLabel: false,
})

const chipSrc = computed(() => getPixelChipImage(props.value))

const sizePx = computed(() => {
  if (typeof props.size === 'number') return `${props.size}px`
  switch (props.size) {
    case 'xs': return '24px'
    case 'sm': return '34px'
    case 'md': return '48px'
    case 'lg': return '60px'
    case 'xl': return '74px'
    default: return '48px'
  }
})
</script>

<template>
  <div
    class="pixel-chip-wrapper"
    :class="{
      'pixel-chip--active': active,
      'pixel-chip--disabled': disabled,
      'pixel-chip--stacked': stacked,
    }"
    :style="{ width: sizePx, height: sizePx }"
  >
    <!-- Shadow under-layer for stacked effect -->
    <div v-if="stacked" class="pixel-chip-stack-shadow" />
    <div v-if="stacked" class="pixel-chip-stack-layer" />

    <!-- Main Chip Disc with 8-bit image -->
    <div class="pixel-chip-disc">
      <img
        :src="chipSrc"
        :alt="`Ficha 8-bit ${value}`"
        class="pixel-chip-img"
        loading="lazy"
        draggable="false"
      />
    </div>

    <!-- Optional value label below -->
    <span v-if="showLabel" class="pixel-chip-label">{{ value }}</span>
  </div>
</template>

<style scoped>
.pixel-chip-wrapper {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  user-select: none;
  cursor: pointer;
  transition: transform 0.18s cubic-bezier(0.2, 0, 0, 1), filter 0.18s ease;
  vertical-align: middle;
}

.pixel-chip-wrapper:hover:not(.pixel-chip--disabled) {
  transform: translateY(-5px) scale(1.1);
  filter: drop-shadow(0 6px 14px rgba(255, 215, 0, 0.45));
}

.pixel-chip--active {
  transform: translateY(-6px) scale(1.15) !important;
  filter: drop-shadow(0 0 12px #ffe600) drop-shadow(0 4px 8px #000) !important;
}

.pixel-chip--disabled {
  opacity: 0.35;
  filter: grayscale(0.85);
  cursor: not-allowed;
  pointer-events: none;
}

/* Stacked 3D layers */
.pixel-chip-stack-shadow {
  position: absolute;
  width: 90%;
  height: 90%;
  bottom: -4px;
  background: rgba(0, 0, 0, 0.65);
  border-radius: 50%;
  filter: blur(2px);
  z-index: 1;
}

.pixel-chip-stack-layer {
  position: absolute;
  width: 100%;
  height: 100%;
  bottom: -3px;
  border-radius: 50%;
  background: #0f0f14;
  border: 2px solid #000;
  z-index: 2;
}

.pixel-chip-disc {
  position: relative;
  width: 100%;
  height: 100%;
  border-radius: 50%;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #18181b;
  box-shadow:
    0 3px 0 0 #000,
    0 5px 10px rgba(0, 0, 0, 0.7);
  z-index: 3;
}

.pixel-chip-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transform: scale(1.14);
  image-rendering: pixelated;
  image-rendering: -moz-crisp-edges;
  image-rendering: crisp-edges;
  display: block;
  border-radius: 50%;
}

.pixel-chip-label {
  position: absolute;
  bottom: -16px;
  font-family: 'Press Start 2P', monospace;
  font-size: 0.5rem;
  color: #ffd54f;
  text-shadow: 1px 1px 0 #000;
  white-space: nowrap;
}
</style>
