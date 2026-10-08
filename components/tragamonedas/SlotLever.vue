<script setup lang="ts">
import { ref } from 'vue'

interface Props {
  disabled?: boolean
  accent?: string
}

const props = withDefaults(defineProps<Props>(), {
  disabled: false,
  accent: '#ff1744',
})

const emit = defineEmits<{
  (e: 'pull'): void
}>()

const pulling = ref(false)

function pull() {
  if (props.disabled || pulling.value) return
  pulling.value = true
  emit('pull')
  setTimeout(() => (pulling.value = false), 650)
}
</script>

<template>
  <button
    id="slot-lever"
    type="button"
    class="lever"
    :class="{ 'lever--pulling': pulling, 'lever--disabled': disabled }"
    :style="{ '--accent': accent }"
    :aria-disabled="disabled"
    title="Tirar de la palanca"
    @click="pull"
  >
    <span class="lever-track" />
    <span class="lever-arm">
      <span class="lever-ball" />
    </span>
    <span class="lever-base" />
  </button>
</template>

<style scoped>
.lever {
  position: relative;
  width: 46px;
  height: 230px;
  background: none;
  border: none;
  padding: 0;
  cursor: pointer;
  display: flex;
  justify-content: center;
}

.lever--disabled {
  cursor: not-allowed;
  opacity: 0.55;
}

.lever-track {
  position: absolute;
  bottom: 18px;
  width: 10px;
  height: 170px;
  border-radius: 6px;
  background: linear-gradient(90deg, #111, #333, #111);
  box-shadow: inset 0 0 6px rgba(0, 0, 0, 0.8);
}

.lever-arm {
  position: absolute;
  bottom: 30px;
  width: 8px;
  height: 160px;
  border-radius: 4px;
  background: linear-gradient(90deg, #8a8a8a, #f5f5f5 45%, #9e9e9e);
  box-shadow: 0 0 6px rgba(0, 0, 0, 0.5);
}

.lever-ball {
  position: absolute;
  top: -20px;
  left: 50%;
  transform: translateX(-50%);
  width: 38px;
  height: 38px;
  border-radius: 50%;
  background: radial-gradient(circle at 32% 30%, #fff 0%, var(--accent) 28%, #3a0010 100%);
  box-shadow:
    0 6px 14px rgba(0, 0, 0, 0.55),
    0 0 18px var(--accent);
  transition: box-shadow 0.3s ease;
}

.lever:not(.lever--disabled):hover .lever-ball {
  box-shadow:
    0 6px 14px rgba(0, 0, 0, 0.55),
    0 0 30px var(--accent);
}

.lever-base {
  position: absolute;
  bottom: 0;
  width: 46px;
  height: 36px;
  border-radius: 10px;
  background: linear-gradient(180deg, #5a5a5a, #1e1e1e);
  border: 1px solid rgba(255, 255, 255, 0.15);
  box-shadow: 0 6px 12px rgba(0, 0, 0, 0.6);
}

.lever--pulling .lever-arm {
  animation: lever-pull 0.65s cubic-bezier(0.3, 0.8, 0.4, 1);
}

@keyframes lever-pull {
  0% { height: 160px; }
  35% { height: 24px; }
  55% { height: 24px; }
  100% { height: 160px; }
}
</style>
