const SUFFIXES = [
  '',
  'K',
  'M',
  'B',
  'T',
  'Qa',
  'Qi',
  'Sx',
  'Sp',
  'Oc',
  'No',
  'Dc',
]

/**
 * Formatea un número grande a notación compacta legible (ej: 1.25K, 3.40M, 12.50B)
 */
export function formatNumber(value: number, decimals = 2): string {
  if (value === null || value === undefined || isNaN(value)) return '0'
  if (!isFinite(value)) return '∞'

  const sign = value < 0 ? '-' : ''
  const abs = Math.abs(value)

  if (abs === 0) return '0'

  if (abs < 1000) {
    // Si tiene decimales y es menor a 10 (ej: 0.1 CPS)
    if (abs < 10 && abs % 1 !== 0) {
      return `${sign}${abs.toFixed(decimals).replace(/\.?0+$/, '')}`
    }
    // Si tiene decimales pero es menor a 1000
    if (abs % 1 !== 0) {
      return `${sign}${abs.toFixed(decimals).replace(/\.?0+$/, '')}`
    }
    return `${sign}${Math.floor(abs).toLocaleString('es-ES')}`
  }

  const tier = Math.min(
    Math.floor(Math.log10(abs) / 3),
    SUFFIXES.length - 1
  )

  const scale = Math.pow(10, tier * 3)
  const scaled = abs / scale
  const formatted = scaled.toFixed(decimals).replace(/\.?0+$/, '')

  return `${sign}${formatted} ${SUFFIXES[tier]}`
}

/**
 * Formatea fichas para visualización en billeteras o contadores.
 * Muestra el número completo con separadores hasta 1,000,000 y luego formato compacto.
 */
export function formatChips(chips: number): string {
  const floorVal = Math.floor(chips)
  if (floorVal < 1_000_000) {
    return floorVal.toLocaleString('es-ES')
  }
  return formatNumber(floorVal, 2)
}

/**
 * Formatea duración en segundos a formato de tiempo legible (ej: 1h 23m, 45s)
 */
export function formatTime(seconds: number): string {
  if (!seconds || seconds <= 0) return '0s'
  const totalSecs = Math.floor(seconds)

  if (totalSecs < 60) {
    return `${totalSecs}s`
  }

  const mins = Math.floor(totalSecs / 60)
  const secs = totalSecs % 60

  if (mins < 60) {
    return secs > 0 ? `${mins}m ${secs}s` : `${mins}m`
  }

  const hours = Math.floor(mins / 60)
  const remMins = mins % 60

  if (hours < 24) {
    return remMins > 0 ? `${hours}h ${remMins}m` : `${hours}h`
  }

  const days = Math.floor(hours / 24)
  const remHours = hours % 24
  return remHours > 0 ? `${days}d ${remHours}h` : `${days}d`
}
