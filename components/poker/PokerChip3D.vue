<script setup lang="ts">
import { computed } from 'vue'
import { getPixelChipImage } from '~/utils/pixelChips'

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

const chipSrc = computed(() => getPixelChipImage(props.amount))

const stackCount = computed(() => {
  if (!props.stacked) return 1
  if (props.amount >= 200) return 3
  if (props.amount >= 50) return 2
  return 1
})
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
          '--layer-offset': `${layer * -3}px`,
          '--layer-z': 1 + layer,
        }"
      />
    </template>

    <!-- Top / Main 8-Bit Pixel Chip -->
    <div
      class="chip-disc chip-disc--top"
      :style="{
        '--layer-offset': `${stackCount > 1 ? (stackCount - 1) * -3 : 0}px`,
        '--layer-z': 10,
      }"
    >
      <img
        :src="chipSrc"
        :alt="`Ficha ${amount}`"
        class="chip-pixel-img"
        draggable="false"
      />
    </div>
  </div>
</template>

<style scoped>
.poker-chip-3d-wrapper {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  user-select: none;
  cursor: pointer;
  transition: transform 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  vertical-align: middle;
}

.chip--sm {
  width: 28px;
  height: 28px;
}

.chip--md {
  width: 44px;
  height: 44px;
}

.chip--lg {
  width: 58px;
  height: 58px;
}

.chip-disc {
  position: absolute;
  width: 100%;
  height: 100%;
  border-radius: 50%;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #14141a;
  box-shadow:
    0 3px 0 0 #000,
    0 4px 10px rgba(0, 0, 0, 0.7);
  transform: translateY(var(--layer-offset, 0px));
  z-index: var(--layer-z, 10);
  transition: transform 0.2s ease;
}

.chip-disc--under {
  background: #0d0d12;
  border: 1.5px solid #000;
  box-shadow: 0 2px 0 0 #000;
}

.chip-pixel-img {
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

.poker-chip-3d-wrapper:hover {
  transform: translateY(-3px) scale(1.08);
}
</style>
