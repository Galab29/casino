import { defineEventHandler } from 'h3'
import { getDatabase } from '../../utils/db'
import { getCurrentUser } from '../../utils/auth'

/** DELETE /api/bets → borra el historial de la Mesa de Fichas del usuario */
export default defineEventHandler((event) => {
  const user = getCurrentUser(event)
  getDatabase().prepare('DELETE FROM bet_slips WHERE user_id = ?').run(user.id)
  return { success: true }
})
