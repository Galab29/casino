import { computed } from 'vue'

export type DeckStyle = 'pixel' | 'classic'

const STORAGE_KEY = 'royal-casino:deck-style'

function readStoredStyle(): DeckStyle {
  if (import.meta.client) {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored === 'pixel' || stored === 'classic') return stored
  }
  return 'pixel'
}

/**
 * Estilo global de baraja compartido por Blackjack, Baccarat y Poker.
 * - 'pixel'   → baraja 8-Bit Traditional generada en canvas (utils/pixelDeck.ts)
 * - 'classic' → imágenes PNG realistas de /public/cards
 * La preferencia se guarda en localStorage.
 */
export function useDeckStyle() {
  const style = useState<DeckStyle>('deck-style', readStoredStyle)

  const isPixel = computed(() => style.value === 'pixel')

  function setStyle(next: DeckStyle) {
    style.value = next
    if (import.meta.client) localStorage.setItem(STORAGE_KEY, next)
  }

  function toggle() {
    setStyle(isPixel.value ? 'classic' : 'pixel')
  }

  return { style, isPixel, setStyle, toggle }
}
