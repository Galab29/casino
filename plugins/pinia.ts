import { createPinia, setActivePinia } from 'pinia'
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate'

export default defineNuxtPlugin((nuxtApp) => {
  const pinia = createPinia()
  pinia.use(piniaPluginPersistedstate)
  nuxtApp.vueApp.use(pinia)
  setActivePinia(pinia)
  return {
    provide: {
      pinia
    }
  }
})