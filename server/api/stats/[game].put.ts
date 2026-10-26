import { defineEventHandler, getRouterParam, readBody } from 'h3'
import { getDatabase } from '../../utils/db'
import { getCurrentUser } from '../../utils/auth'
import { assertGameKey, sanitizeStats } from '../../utils/gameStats'

/** PUT /api/stats/:game  body: { stats } → guarda (upsert) las estadísticas del juego */
export default defineEventHandler(async (event) => {
  const user = getCurrentUser(event)
  const game = assertGameKey(getRouterParam(event, 'game'))
  const body = await readBody(event)
  const stats = sanitizeStats(body?.stats)
  const now = Math.floor(Date.now() / 1000)

  getDatabase()
    .prepare(`
      INSERT INTO game_stats (user_id, game, data, updated_at)
      VALUES (?, ?, ?, ?)
      ON CONFLICT(user_id, game) DO UPDATE SET data = excluded.data, updated_at = excluded.updated_at
    `)
    .run(user.id, game, JSON.stringify(stats), now)

  return { success: true, game, stats, updatedAt: now }
})
