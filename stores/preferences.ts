import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { fetchPreferences, updatePreferences, type DeckStyle } from '~/services/preferences.api'

const LEGACY_DECK_KEY = 'royal-casino:deck-style'

/**
 * Store de Preferencias del usuario (guardadas en el servidor).
 * Actualmente: estilo de baraja compartido por Blackjack, Baccarat y Poker.
 */
export const usePreferencesStore = defineStore('preferences', () => {
  const deckStyle = ref<DeckStyle>('pixel')
  const isLoaded = ref(false)
  const isSaving = ref(false)

  const isPixel = computed(() => deckStyle.value === 'pixel')

  async function fetchAll() {
    try {
      const res = await fetchPreferences()
      deckStyle.value = res.preferences.deckStyle

      // Migración única desde localStorage (versión anterior)
      if (import.meta.client) {
        const legacy = localStorage.getItem(LEGACY_DECK_KEY)
        if (legacy === 'pixel' || legacy === 'classic') {
          localStorage.removeItem(LEGACY_DECK_KEY)
          if (legacy !== deckStyle.value) await setDeckStyle(legacy)
        }
      }
    } catch (e) {
      console.warn('[preferences] fetchAll:', e)
    } finally {
      isLoaded.value = true
    }
  }

  /** Cambio optimista: se aplica al instante y se guarda en el servidor */
  async function setDeckStyle(next: DeckStyle) {
    const previous = deckStyle.value
    deckStyle.value = next
    isSaving.value = true
    try {
      const res = await updatePreferences({ deckStyle: next })
      deckStyle.value = res.preferences.deckStyle
    } catch (e) {
      deckStyle.value = previous
      console.warn('[preferences] setDeckStyle:', e)
    } finally {
      isSaving.value = false
    }
  }

  return { deckStyle, isPixel, isLoaded, isSaving, fetchAll, setDeckStyle }
})
