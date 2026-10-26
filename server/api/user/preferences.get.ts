import { defineEventHandler } from 'h3'
import { getDatabase } from '../../utils/db'
import { getCurrentUser } from '../../utils/auth'
import { DEFAULT_PREFERENCES } from '../../utils/preferences'

/** GET /api/user/preferences → preferencias del usuario (con valores por defecto) */
export default defineEventHandler((event) => {
  const user = getCurrentUser(event)
  const rows = getDatabase()
    .prepare('SELECT key, value FROM user_preferences WHERE user_id = ?')
    .all(user.id) as { key: string; value: string }[]

  const preferences: Record<string, string> = { ...DEFAULT_PREFERENCES }
  for (const row of rows) {
    if (row.key in DEFAULT_PREFERENCES) preferences[row.key] = row.value
  }

  return { success: true, preferences }
})
