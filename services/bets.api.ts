/** API de la Mesa de Fichas (/apuestas) */

export interface BetSlip {
  id: number
  amount: number
  createdAt: number
}

export function fetchBets() {
  return $fetch<{ success: boolean; bets: BetSlip[] }>('/api/bets')
}

export function createBet(amount: number) {
  return $fetch<{ success: boolean; bet: BetSlip }>('/api/bets', {
    method: 'POST',
    body: { amount },
  })
}

export function clearBets() {
  return $fetch<{ success: boolean }>('/api/bets', { method: 'DELETE' })
}
