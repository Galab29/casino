import { defineEventHandler, getRouterParam } from 'h3'
import { getDatabase } from '../../utils/db'
import { getCurrentUser } from '../../utils/auth'
import { assertGameKey } from '../../utils/gameStats'

/** DELETE /api/stats/:game → reinicia las estadísticas del juego */
export default defineEventHandler((event) => {
  const user = getCurrentUser(event)
  const game = assertGameKey(getRouterParam(event, 'game'))

  getDatabase()
    .prepare('DELETE FROM game_stats WHERE user_id = ? AND game = ?')
    .run(user.id, game)

  return { success: true, game }
})
