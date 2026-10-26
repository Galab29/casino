import { defineEventHandler, getRouterParam } from 'h3'
import { getDatabase } from '../../utils/db'
import { getCurrentUser } from '../../utils/auth'
import { assertGameKey } from '../../utils/gameStats'

/** GET /api/stats/:game → estadísticas guardadas del usuario para ese juego */
export default defineEventHandler((event) => {
  const user = getCurrentUser(event)
  const game = assertGameKey(getRouterParam(event, 'game'))

  const row = getDatabase()
    .prepare('SELECT data, updated_at FROM game_stats WHERE user_id = ? AND game = ?')
    .get(user.id, game) as { data: string; updated_at: number } | undefined

  let stats: Record<string, unknown> | null = null
  if (row) {
    try {
      stats = JSON.parse(row.data)
    } catch {
      stats = null
    }
  }

  return {
    success: true,
    game,
    stats,
    updatedAt: row?.updated_at ?? null,
  }
})
