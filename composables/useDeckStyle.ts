import { computed } from 'vue'
import { usePreferencesStore } from '~/stores/preferences'
import type { DeckStyle } from '~/services/preferences.api'

export type { DeckStyle }

/**
 * Estilo global de baraja compartido por Blackjack, Baccarat y Poker.
 * - 'pixel'   → baraja 8-Bit Traditional generada en canvas (utils/pixelDeck.ts)
 * - 'classic' → imágenes PNG realistas de /public/cards
 * La preferencia se guarda en el servidor a través de `usePreferencesStore`.
 */
export function useDeckStyle() {
  const store = usePreferencesStore()

  const style = computed(() => store.deckStyle)
  const isPixel = computed(() => store.isPixel)

  function setStyle(next: DeckStyle) {
    store.setDeckStyle(next)
  }

  function toggle() {
    setStyle(isPixel.value ? 'classic' : 'pixel')
  }

  return { style, isPixel, setStyle, toggle }
}
