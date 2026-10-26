import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { fetchBets, createBet, clearBets, type BetSlip } from '~/services/bets.api'
import { apiErrorMessage } from '~/services/http'
import { useWalletStore } from '~/stores/wallet'

/**
 * Store de la Mesa de Fichas (/apuestas).
 * El monto en edición es estado local de la Store; el historial vive en el servidor
 * y cada apuesta realizada descuenta del saldo central en el servidor.
 */
export const useApuestasStore = defineStore('apuestas', () => {
  const wallet = useWalletStore()

  // ── Saldo reactivo del servidor ───────────
  const chips = computed(() => wallet.chips)

  // ── Estado de la mesa ─────────────────────
  const amount = ref(0)
  const allIn = ref(false)

  // ── Historial (servidor) ──────────────────
  const bets = ref<BetSlip[]>([])
  const isLoading = ref(false)
  const isSaving = ref(false)
  const error = ref<string | null>(null)

  /** Formato que espera el componente BetHistory */
  const historyEntries = computed(() => bets.value.map((b) => ({ id: b.id, cantidad: b.amount })))

  // ── Acciones de la mesa ───────────────────
  function addAmount(value: number) {
    allIn.value = false
    amount.value += value
    error.value = null
  }

  function setAmount(value: number) {
    allIn.value = false
    amount.value = Math.max(0, Math.floor(value) || 0)
    error.value = null
  }

  function setAllIn() {
    if (wallet.chips <= 0) {
      wallet.openRecharge()
      return
    }
    allIn.value = true
    amount.value = wallet.chips
    error.value = null
  }

  function clearAmount() {
    allIn.value = false
    amount.value = 0
    error.value = null
  }

  // ── Servidor ──────────────────────────────
  async function loadHistory() {
    isLoading.value = true
    try {
      const res = await fetchBets()
      bets.value = res.bets
      error.value = null
    } catch (e) {
      error.value = apiErrorMessage(e, 'No se pudo cargar el historial.')
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Realiza la apuesta:
   * 1. Valida que el jugador tenga fichas suficientes.
   * 2. Descuenta el monto del saldo central (servidor).
   * 3. Registra el ticket de apuesta en el servidor.
   */
  async function placeBet(): Promise<boolean> {
    const betAmount = allIn.value ? wallet.chips : amount.value
    if (betAmount <= 0 || isSaving.value) return false

    // Validar saldo suficiente
    if (betAmount > wallet.chips) {
      error.value = 'Saldo insuficiente para realizar esta apuesta.'
      wallet.openRecharge()
      return false
    }

    isSaving.value = true
    error.value = null

    // Restar fichas inmediatamente de la billetera (se sincroniza con el server)
    wallet.removeChips(betAmount)

    try {
      const res = await createBet(betAmount)
      bets.value.unshift(res.bet)
      clearAmount()
      return true
    } catch (e) {
      // Revertir fichas en caso de fallo de red/servidor
      wallet.addChips(betAmount)
      error.value = apiErrorMessage(e, 'No se pudo registrar la apuesta.')
      return false
    } finally {
      isSaving.value = false
    }
  }

  async function clearHistory() {
    try {
      await clearBets()
      bets.value = []
    } catch (e) {
      error.value = apiErrorMessage(e, 'No se pudo borrar el historial.')
    }
  }

  return {
    chips,
    amount,
    allIn,
    bets,
    isLoading,
    isSaving,
    error,
    historyEntries,
    addAmount,
    setAmount,
    setAllIn,
    clearAmount,
    loadHistory,
    placeBet,
    clearHistory,
    openRecharge: wallet.openRecharge,
  }
})
