import { defineEventHandler } from 'h3'
import { getDatabase } from '../../utils/db'
import { getCurrentUser } from '../../utils/auth'

/** GET /api/bets → últimas apuestas de la Mesa de Fichas del usuario */
export default defineEventHandler((event) => {
  const user = getCurrentUser(event)
  const rows = getDatabase()
    .prepare('SELECT id, amount, created_at FROM bet_slips WHERE user_id = ? ORDER BY id DESC LIMIT 50')
    .all(user.id) as { id: number; amount: number; created_at: number }[]

  return {
    success: true,
    bets: rows.map((r) => ({ id: r.id, amount: r.amount, createdAt: r.created_at })),
  }
})
