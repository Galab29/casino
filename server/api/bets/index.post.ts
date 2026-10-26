import { defineEventHandler, readBody, createError } from 'h3'
import { getDatabase } from '../../utils/db'
import { getCurrentUser } from '../../utils/auth'

const MAX_AMOUNT = 999_999_999

/** POST /api/bets  body: { amount } → registra una apuesta de la Mesa de Fichas */
export default defineEventHandler(async (event) => {
  const user = getCurrentUser(event)
  const body = await readBody(event)
  const amount = Math.floor(Number(body?.amount))

  if (!Number.isFinite(amount) || amount <= 0 || amount > MAX_AMOUNT) {
    throw createError({ statusCode: 400, statusMessage: 'Monto de apuesta inválido.' })
  }

  const now = Math.floor(Date.now() / 1000)
  const result = getDatabase()
    .prepare('INSERT INTO bet_slips (user_id, amount, created_at) VALUES (?, ?, ?)')
    .run(user.id, amount, now)

  return {
    success: true,
    bet: { id: Number(result.lastInsertRowid), amount, createdAt: now },
  }
})
