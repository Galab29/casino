import { createError } from 'h3'

/** Valores por defecto de cada preferencia soportada */
export const DEFAULT_PREFERENCES: Record<string, string> = {
  deckStyle: 'pixel',
}

/** Valores permitidos por preferencia */
const ALLOWED_VALUES: Record<string, readonly string[]> = {
  deckStyle: ['pixel', 'classic'],
}

/** Valida un objeto parcial de preferencias y devuelve solo las claves válidas */
export function sanitizePreferences(input: unknown): Record<string, string> {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    throw createError({ statusCode: 400, statusMessage: 'Preferencias inválidas.' })
  }
  const out: Record<string, string> = {}
  for (const [key, raw] of Object.entries(input as Record<string, unknown>)) {
    const allowed = ALLOWED_VALUES[key]
    if (!allowed) continue
    const value = String(raw)
    if (!allowed.includes(value)) {
      throw createError({ statusCode: 400, statusMessage: `Valor inválido para "${key}".` })
    }
    out[key] = value
  }
  return out
}
