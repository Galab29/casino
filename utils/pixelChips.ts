/**
 * Mapeo y utilidades para las fichas de apuestas 8-Bit de /public/fichas/
 */

export const PIXEL_CHIP_VALUES = [10, 25, 50, 100, 250, 500] as const

export function getPixelChipImage(val: number | string): string {
  if (val === 'all-in' || val === 'allin' || val === 'ALL IN' || val === 'allIn') {
    return '/fichas/allIncoins.jpg'
  }
  const n = typeof val === 'string' ? parseInt(val, 10) : val

  if (n >= 50000) return '/fichas/50kcoins.jpg'
  if (n >= 10000) return '/fichas/10kcoins.jpg'
  if (n >= 5000) return '/fichas/5kcoins.jpg'
  if (n >= 1000) return '/fichas/1kcoins.jpg'
  if (n >= 500) return '/fichas/500coins.jpg'
  if (n >= 250) return '/fichas/250coins.jpg'
  if (n >= 100) return '/fichas/100coins.jpg'
  if (n >= 50) return '/fichas/50coins.jpg'
  if (n >= 25) return '/fichas/25coins.jpg'
  return '/fichas/10coins.jpg'
}
