/** API del Cajero (canje de códigos e historial de recargas) */

export interface RechargeTransaction {
  id: number
  amount: number
  type: string
  description: string
  balanceAfter: number
  createdAt: number
  code?: string
}

export interface RedeemResponse {
  success: boolean
  message: string
  amount: number
  newBalance: number
}

export function redeemCode(code: string) {
  return $fetch<RedeemResponse>('/api/codes/redeem', {
    method: 'POST',
    body: { code },
  })
}

export function fetchTransactions() {
  return $fetch<{ success: boolean; transactions: RechargeTransaction[] }>('/api/user/transactions')
}
