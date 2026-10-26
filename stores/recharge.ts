import { defineStore } from 'pinia'
import { ref } from 'vue'
import { redeemCode as apiRedeemCode, fetchTransactions, type RechargeTransaction } from '~/services/recharge.api'
import { apiErrorMessage } from '~/services/http'
import { useWalletStore } from '~/stores/wallet'

export type FeedbackType = 'success' | 'error'

/**
 * Store del Cajero: canje de códigos e historial de recargas.
 * El componente RechargeDialog solo muestra este estado y llama a sus acciones.
 */
export const useRechargeStore = defineStore('recharge', () => {
  const wallet = useWalletStore()

  // ── Canje ─────────────────────────────────
  const isRedeeming = ref(false)
  const feedbackMessage = ref('')
  const feedbackType = ref<FeedbackType>('success')

  // ── Historial ─────────────────────────────
  const transactions = ref<RechargeTransaction[]>([])
  const isLoadingHistory = ref(false)
  const historyError = ref<string | null>(null)

  function clearFeedback() {
    feedbackMessage.value = ''
  }

  /**
   * Envía el código al servidor. Si es válido, actualiza la billetera con el
   * saldo oficial devuelto por el servidor y devuelve el monto acreditado.
   */
  async function redeem(rawCode: string): Promise<number | null> {
    const code = rawCode.trim().toUpperCase()
    if (!code || isRedeeming.value) return null

    isRedeeming.value = true
    feedbackMessage.value = ''
    try {
      const res = await apiRedeemCode(code)
      if (!res?.success) return null

      feedbackType.value = 'success'
      feedbackMessage.value = res.message
      // El servidor ya guardó el saldo: solo actualizamos la copia en memoria
      wallet.setChips(res.newBalance, { sync: false })
      // El historial cambió: se recargará la próxima vez que se abra
      transactions.value = []
      return res.amount
    } catch (e) {
      feedbackType.value = 'error'
      feedbackMessage.value = apiErrorMessage(e, 'Error al canjear el código.')
      return null
    } finally {
      isRedeeming.value = false
    }
  }

  async function loadTransactions() {
    isLoadingHistory.value = true
    try {
      const res = await fetchTransactions()
      transactions.value = res?.transactions ?? []
      historyError.value = null
    } catch (e) {
      historyError.value = apiErrorMessage(e, 'No se pudo cargar el historial.')
      console.error('[recharge] loadTransactions:', e)
    } finally {
      isLoadingHistory.value = false
    }
  }

  return {
    // state
    isRedeeming,
    feedbackMessage,
    feedbackType,
    transactions,
    isLoadingHistory,
    historyError,
    // actions
    redeem,
    loadTransactions,
    clearFeedback,
  }
})
