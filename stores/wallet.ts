import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { fetchMe, syncChips, type UserProfile } from '~/services/wallet.api'
import { apiErrorMessage, debounce } from '~/services/http'

/**
 * Store de Billetera (saldo único del casino).
 *
 * - El servidor (tabla `users.chips`) es la fuente de la verdad.
 * - Esta Store guarda una copia temporal en memoria pedida al servidor
 *   (`fetchWallet`) y le reenvía cada cambio (`setChips` → sync con debounce).
 * - Todos los juegos y componentes leen el saldo desde aquí.
 */
export const useWalletStore = defineStore('wallet', () => {
  // ── Estado ────────────────────────────────
  const user = ref<UserProfile | null>(null)
  const chips = ref<number>(0)
  const isLoaded = ref(false)
  const isLoading = ref(false)
  const isSyncing = ref(false)
  const error = ref<string | null>(null)

  // Diálogo global del cajero
  const isRechargeOpen = ref(false)

  // ── Computed ──────────────────────────────
  const username = computed(() => user.value?.username ?? '')
  const isAdmin = computed(() => user.value?.role === 'admin')
  const chipsFormatted = computed(() => chips.value.toLocaleString())

  // ── Servidor → Store ──────────────────────
  async function fetchWallet() {
    if (isLoading.value) return
    isLoading.value = true
    try {
      const res = await fetchMe()
      user.value = res.user
      chips.value = Math.max(0, Math.floor(res.user.chips ?? 0))
      error.value = null
    } catch (e) {
      error.value = apiErrorMessage(e, 'No se pudo cargar tu saldo.')
      console.warn('[wallet] fetchWallet:', e)
    } finally {
      isLoading.value = false
      isLoaded.value = true
    }
  }

  // ── Store → Servidor ──────────────────────
  const pushChips = debounce(async () => {
    isSyncing.value = true
    try {
      await syncChips(chips.value)
      error.value = null
    } catch (e) {
      error.value = apiErrorMessage(e, 'No se pudo guardar tu saldo.')
      console.warn('[wallet] syncChips:', e)
    } finally {
      isSyncing.value = false
    }
  }, 400)

  /**
   * Cambia el saldo en memoria y lo guarda en el servidor.
   * Usa `{ sync: false }` cuando el servidor ya tiene el valor (p. ej. tras un canje).
   */
  function setChips(value: number, opts: { sync?: boolean } = {}) {
    chips.value = Math.max(0, Math.floor(value))
    if (opts.sync !== false) pushChips()
  }

  function addChips(amount: number) {
    setChips(chips.value + Math.floor(amount))
  }

  function removeChips(amount: number) {
    setChips(chips.value - Math.floor(amount))
  }

  // ── Cajero ────────────────────────────────
  function openRecharge() {
    isRechargeOpen.value = true
  }

  function closeRecharge() {
    isRechargeOpen.value = false
  }

  /** Ya no se regalan fichas: sin saldo se abre el cajero de recarga */
  function refillChips() {
    openRecharge()
  }

  return {
    // state
    user,
    chips,
    isLoaded,
    isLoading,
    isSyncing,
    error,
    isRechargeOpen,
    // computed
    username,
    isAdmin,
    chipsFormatted,
    // actions
    fetchWallet,
    setChips,
    addChips,
    removeChips,
    openRecharge,
    closeRecharge,
    refillChips,
  }
})
