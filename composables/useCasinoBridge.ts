import { useIdleStore } from '~/stores/idle'

export interface RoundReport {
  game: 'blackjack' | 'poker' | 'ruleta' | 'slots' | 'baccarat' | 'dados'
  bet: number
  payout: number
  isJackpot?: boolean
  tag?: string
}

export function useCasinoBridge() {
  /**
   * Reporta la resolución de una ronda de casino para otorgar Adrenalina
   * sin modificar el RNG ni las matemáticas del juego existente.
   */
  function reportRound(report: RoundReport) {
    try {
      // Comprobación de seguridad para scripts de simulación en Node.js puro
      if (typeof useNuxtApp !== 'function') return

      const nuxtApp = useNuxtApp()
      const idleStore = nuxtApp?.$pinia ? useIdleStore(nuxtApp.$pinia) : useIdleStore()
      if (!idleStore) return

      const { bet, payout, isJackpot } = report

      let multiplier = 0.10
      let durationSeconds = 15

      if (isJackpot) {
        // Gran premio (Blackjack natural, pleno ruleta, jackpot slots, escalera real, etc.)
        multiplier = 0.50
        durationSeconds = 60
      } else if (payout > bet) {
        // Victoria normal
        multiplier = 0.25
        durationSeconds = 30
      } else {
        // Derrota o empate (igual despierta adrenalina competitiva)
        multiplier = 0.10
        durationSeconds = 15
      }

      idleStore.setAdrenaline(multiplier, durationSeconds)
    } catch (err) {
      // Entorno sin contexto Pinia/Nuxt (ej. simulación en consola)
    }
  }

  return {
    reportRound,
  }
}
