/** API de Estadísticas por juego + helper de persistencia para las Stores */
import { ref } from 'vue'
import { debounce } from './http'

export type GameKey = 'blackjack' | 'baccarat' | 'ruleta' | 'dados' | 'poker' | 'slots'

export function fetchGameStats<T = Record<string, unknown>>(game: GameKey) {
  return $fetch<{ success: boolean; game: GameKey; stats: T | null; updatedAt: number | null }>(
    `/api/stats/${game}`,
  )
}

export function saveGameStats<T>(game: GameKey, stats: T) {
  return $fetch<{ success: boolean; game: GameKey; stats: T }>(`/api/stats/${game}`, {
    method: 'PUT',
    body: { stats },
  })
}

export function resetGameStats(game: GameKey) {
  return $fetch<{ success: boolean }>(`/api/stats/${game}`, { method: 'DELETE' })
}

interface PersistenceOptions<T> {
  /** Juego cuyo registro se guarda en el servidor */
  game: GameKey
  /** Devuelve el estado actual a guardar */
  getState: () => T
  /** Aplica en la Store los datos recibidos del servidor (debe normalizar) */
  applyState: (raw: any) => void
  /** Clave antigua de localStorage para migrar datos existentes una única vez */
  legacyKey?: string
  /** Espera antes de enviar al servidor (agrupa guardados seguidos) */
  debounceMs?: number
}

/**
 * Conecta las estadísticas de una Store con el servidor.
 *
 * - `load()`  : la Store pide los datos al servidor y los guarda en memoria.
 * - `save()`  : envía los datos al servidor (con debounce).
 * - `reset()` : borra los datos del servidor.
 *
 * Si el servidor aún no tiene datos pero existen en localStorage (versión
 * anterior de la app), se suben al servidor y se elimina la copia local.
 */
export function createStatsPersistence<T>(opts: PersistenceOptions<T>) {
  const isLoaded = ref(false)
  const isLoading = ref(false)
  const isSaving = ref(false)
  const error = ref<string | null>(null)

  // Si el jugador juega antes de que termine la carga, no pisamos sus datos nuevos.
  let dirty = false

  async function push() {
    isSaving.value = true
    try {
      await saveGameStats(opts.game, opts.getState())
      error.value = null
    } catch (e) {
      error.value = 'No se pudieron guardar las estadísticas en el servidor.'
      console.warn(`[stats:${opts.game}]`, e)
    } finally {
      isSaving.value = false
    }
  }

  const debouncedPush = debounce(push, opts.debounceMs ?? 600)

  function readLegacy(): unknown | null {
    if (!opts.legacyKey || !import.meta.client) return null
    try {
      const raw = localStorage.getItem(opts.legacyKey)
      return raw ? JSON.parse(raw) : null
    } catch {
      return null
    }
  }

  async function load() {
    if (!import.meta.client || isLoading.value) return
    isLoading.value = true
    try {
      const res = await fetchGameStats(opts.game)
      if (dirty) return // ya hay cambios locales más recientes; se enviarán al servidor

      if (res.stats) {
        opts.applyState(res.stats)
      } else {
        const legacy = readLegacy()
        if (legacy) {
          opts.applyState(legacy)
          await push()
        }
      }
      if (opts.legacyKey) localStorage.removeItem(opts.legacyKey)
      error.value = null
    } catch (e) {
      error.value = 'No se pudieron cargar las estadísticas del servidor.'
      console.warn(`[stats:${opts.game}]`, e)
    } finally {
      isLoading.value = false
      isLoaded.value = true
    }
  }

  function save() {
    if (!import.meta.client) return
    dirty = true
    debouncedPush()
  }

  async function reset() {
    if (!import.meta.client) return
    dirty = true
    try {
      await resetGameStats(opts.game)
    } catch (e) {
      console.warn(`[stats:${opts.game}]`, e)
    }
  }

  return { load, save, reset, isLoaded, isLoading, isSaving, error }
}
