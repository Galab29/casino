import { defineEventHandler, readBody } from 'h3'
import { getDatabase } from '../../utils/db'
import { getCurrentUser } from '../../utils/auth'
import { DEFAULT_PREFERENCES, sanitizePreferences } from '../../utils/preferences'

/** PUT /api/user/preferences  body: { deckStyle?: 'pixel' | 'classic' } */
export default defineEventHandler(async (event) => {
  const user = getCurrentUser(event)
  const updates = sanitizePreferences(await readBody(event))
  const db = getDatabase()
  const now = Math.floor(Date.now() / 1000)

  const upsert = db.prepare(`
    INSERT INTO user_preferences (user_id, key, value, updated_at)
    VALUES (?, ?, ?, ?)
    ON CONFLICT(user_id, key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at
  `)
  for (const [key, value] of Object.entries(updates)) {
    upsert.run(user.id, key, value, now)
  }

  const rows = db
    .prepare('SELECT key, value FROM user_preferences WHERE user_id = ?')
    .all(user.id) as { key: string; value: string }[]
  const preferences: Record<string, string> = { ...DEFAULT_PREFERENCES }
  for (const row of rows) {
    if (row.key in DEFAULT_PREFERENCES) preferences[row.key] = row.value
  }

  return { success: true, preferences }
})
