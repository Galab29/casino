import { createError } from 'h3'

/** Juegos que pueden guardar estadísticas en el servidor */
export const GAME_KEYS = ['blackjack', 'baccarat', 'ruleta', 'dados', 'poker', 'slots'] as const
export type GameKey = (typeof GAME_KEYS)[number]

const MAX_PAYLOAD_BYTES = 8 * 1024
const MAX_DEPTH = 3

export function assertGameKey(value: unknown): GameKey {
  const game = String(value || '')
  if (!(GAME_KEYS as readonly string[]).includes(game)) {
    throw createError({ statusCode: 400, statusMessage: `Juego desconocido: "${game}"` })
  }
  return game as GameKey
}

/**
 * Sanea un objeto de estadísticas recibido del cliente.
 * Solo se aceptan objetos planos cuyos valores sean números finitos (o
 * sub-objetos con la misma regla, hasta MAX_DEPTH niveles). Cualquier otro
 * valor (strings, arrays, funciones…) se descarta.
 */
export function sanitizeStats(input: unknown, depth = 0): Record<string, unknown> {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    throw createError({ statusCode: 400, statusMessage: 'Las estadísticas deben ser un objeto.' })
  }
  if (depth > MAX_DEPTH) {
    throw createError({ statusCode: 400, statusMessage: 'Estadísticas demasiado anidadas.' })
  }

  const out: Record<string, unknown> = {}
  for (const [key, val] of Object.entries(input as Record<string, unknown>)) {
    if (key.length > 40) continue
    if (typeof val === 'number' && Number.isFinite(val)) {
      out[key] = Math.max(0, Math.floor(val))
    } else if (val && typeof val === 'object' && !Array.isArray(val)) {
      out[key] = sanitizeStats(val, depth + 1)
    }
  }

  if (depth === 0 && JSON.stringify(out).length > MAX_PAYLOAD_BYTES) {
    throw createError({ statusCode: 413, statusMessage: 'Estadísticas demasiado grandes.' })
  }
  return out
}
