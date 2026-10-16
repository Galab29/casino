import type { H3Event } from 'h3'
import { getCookie, setCookie, deleteCookie, createError } from 'h3'
import { randomBytes, createHmac } from 'node:crypto'
import { getDatabase } from './db'

const COOKIE_NAME = 'casino_session'
const SECRET_KEY = process.env.SESSION_SECRET || 'royal_casino_secret_jwt_key_2026_retro_8bit'

export interface UserSession {
  userId: string
  role: 'player' | 'admin'
  username: string
}

export interface UserRecord {
  id: string
  username: string
  chips: number
  role: 'player' | 'admin'
  created_at: string
  last_active_at: string
}

function signToken(payload: string): string {
  const hmac = createHmac('sha256', SECRET_KEY).update(payload).digest('hex')
  return `${Buffer.from(payload).toString('base64url')}.${hmac}`
}

function verifyToken(token: string): string | null {
  try {
    const [b64, hmac] = token.split('.')
    if (!b64 || !hmac) return null
    const payload = Buffer.from(b64, 'base64url').toString('utf-8')
    const expectedHmac = createHmac('sha256', SECRET_KEY).update(payload).digest('hex')
    if (hmac !== expectedHmac) return null
    return payload
  } catch {
    return null
  }
}

/** Obtiene el usuario actual de la sesión o crea un perfil de jugador persistente */
export function getCurrentUser(event: H3Event): UserRecord {
  const db = getDatabase()
  const rawCookie = getCookie(event, COOKIE_NAME)

  if (rawCookie) {
    const userId = verifyToken(rawCookie)
    if (userId) {
      const user = db.prepare('SELECT id, username, chips, role, created_at, last_active_at FROM users WHERE id = ?').get(userId) as UserRecord | undefined
      if (user) {
        // Actualizar último acceso
        const now = new Date().toISOString()
        db.prepare('UPDATE users SET last_active_at = ? WHERE id = ?').run(now, user.id)
        return user
      }
    }
  }

  // Si no hay sesión válida, crear un usuario jugador persistente
  const newId = `usr_${randomBytes(8).toString('hex')}`
  const username = `Jugador_${newId.slice(-4)}`
  const now = new Date().toISOString()

  db.prepare(`
    INSERT INTO users (id, username, chips, role, created_at, last_active_at)
    VALUES (?, ?, ?, 'player', ?, ?)
  `).run(newId, username, 1000, now, now)

  const token = signToken(newId)
  setCookie(event, COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 30, // 30 días
    path: '/',
  })

  return {
    id: newId,
    username,
    chips: 1000,
    role: 'player',
    created_at: now,
    last_active_at: now,
  }
}

/** Exige que la petición provenga de un usuario con rol de Administrador */
export function requireAdmin(event: H3Event): UserRecord {
  const user = getCurrentUser(event)
  if (user.role !== 'admin') {
    throw createError({
      statusCode: 403,
      statusMessage: 'Acceso denegado: se requieren permisos de administrador.',
    })
  }
  return user
}

/** Inicia sesión formal para un usuario o administrador */
export function setUserSession(event: H3Event, userId: string) {
  const token = signToken(userId)
  setCookie(event, COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 30,
    path: '/',
  })
}

/** Cierra la sesión activa */
export function clearUserSession(event: H3Event) {
  deleteCookie(event, COOKIE_NAME, { path: '/' })
}
