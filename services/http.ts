/**
 * Capa API (cliente) — utilidades comunes.
 *
 * Flujo de datos del proyecto:
 *   Componente/Página  →  Store (Pinia)  →  services/*.api.ts ($fetch)  →  server/api/*  →  SQLite
 *
 * Los componentes NUNCA llaman a $fetch directamente: siempre piden a una Store,
 * y la Store usa estas funciones para hablar con el servidor.
 */

/** Extrae un mensaje legible de un error de $fetch / h3 */
export function apiErrorMessage(err: unknown, fallback = 'Error de conexión con el servidor.'): string {
  const e = err as any
  return e?.data?.statusMessage || e?.statusMessage || e?.data?.message || fallback
}

/** Crea una función que agrupa varias llamadas seguidas en una sola (debounce) */
export function debounce<A extends unknown[]>(fn: (...args: A) => void, ms: number) {
  let timer: ReturnType<typeof setTimeout> | null = null
  const debounced = (...args: A) => {
    if (timer) clearTimeout(timer)
    timer = setTimeout(() => {
      timer = null
      fn(...args)
    }, ms)
  }
  /** Ejecuta inmediatamente lo pendiente (útil antes de cerrar/limpiar) */
  debounced.flush = (...args: A) => {
    if (timer) clearTimeout(timer)
    timer = null
    fn(...args)
  }
  return debounced
}
