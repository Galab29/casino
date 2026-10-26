import { useWalletStore } from '~/stores/wallet'
import { usePreferencesStore } from '~/stores/preferences'

/**
 * Arranque de sesión (solo cliente).
 * Antes de montar la app, las Stores piden al servidor los datos del jugador
 * (saldo y preferencias). Así los componentes siempre reciben datos reales
 * y nunca muestran un saldo provisional.
 *
 * Se ejecuta después de plugins/pinia.ts (orden alfabético).
 */
export default defineNuxtPlugin(async (nuxtApp) => {
  const pinia = nuxtApp.$pinia as any
  const wallet = useWalletStore(pinia)
  const preferences = usePreferencesStore(pinia)

  await Promise.all([wallet.fetchWallet(), preferences.fetchAll()])
})
