import { useIdleStore } from '~/stores/idle'

let isRunning = false
let loopInterval: ReturnType<typeof setInterval> | null = null
let autoSaveInterval: ReturnType<typeof setInterval> | null = null

export function useIdleLoop() {
  const nuxtApp = useNuxtApp()
  const idleStore = nuxtApp?.$pinia ? useIdleStore(nuxtApp.$pinia) : useIdleStore()

  function onVisibilityChange() {
    if (typeof document !== 'undefined' && document.visibilityState === 'hidden') {
      idleStore.flushPassiveChips()
      idleStore.lastSavedAt = Date.now()
    }
  }

  function onBeforeUnload() {
    idleStore.flushPassiveChips()
    idleStore.lastSavedAt = Date.now()
  }

  function start() {
    if (isRunning || typeof window === 'undefined') return
    isRunning = true

    let lastTick = Date.now()
    let elapsedSinceFlush = 0

    // Bucle principal de simulación a 100 ms (10 ticks/s) basado en delta real de tiempo
    loopInterval = setInterval(() => {
      const now = Date.now()
      const dt = Math.max(0, (now - lastTick) / 1000)
      lastTick = now

      elapsedSinceFlush += dt

      // Cada 250 ms (máx 4 volcados a billetera por segundo) volcamos las fichas enteras
      const shouldFlush = elapsedSinceFlush >= 0.25
      if (shouldFlush) {
        elapsedSinceFlush = 0
      }

      idleStore.tick(dt, shouldFlush)
    }, 100)

    // Autoguardado cada 10 s
    autoSaveInterval = setInterval(() => {
      idleStore.flushPassiveChips()
      idleStore.lastSavedAt = Date.now()
    }, 10000)

    window.addEventListener('visibilitychange', onVisibilityChange)
    window.addEventListener('beforeunload', onBeforeUnload)
  }

  function stop() {
    if (!isRunning || typeof window === 'undefined') return
    isRunning = false

    if (loopInterval) {
      clearInterval(loopInterval)
      loopInterval = null
    }
    if (autoSaveInterval) {
      clearInterval(autoSaveInterval)
      autoSaveInterval = null
    }

    window.removeEventListener('visibilitychange', onVisibilityChange)
    window.removeEventListener('beforeunload', onBeforeUnload)
  }

  return {
    start,
    stop,
    isRunning: () => isRunning,
  }
}
