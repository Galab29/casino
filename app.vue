<script setup lang="ts">
import { onMounted } from 'vue'
import { useIdleLoop } from '~/composables/useIdleLoop'

onMounted(() => {
  const { start } = useIdleLoop()
  start()
})
</script>

<template>
  <NuxtLayout>
    <v-app>
      <NuxtPage />
    </v-app>
  </NuxtLayout>
</template>
