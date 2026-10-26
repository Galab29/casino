import { defineStore } from 'pinia'
import { ref } from 'vue'
import * as adminApi from '~/services/admin.api'
import type { AdminStats, RechargeCode, CodeStatus } from '~/services/admin.api'
import { apiErrorMessage, debounce } from '~/services/http'

function emptyStats(): AdminStats {
  return {
    totalCodes: 0,
    activeCodes: 0,
    activeChips: 0,
    redeemedCodes: 0,
    redeemedChips: 0,
    disabledCodes: 0,
    totalUsers: 0,
    totalUserChips: 0,
  }
}

/**
 * Store del Panel de Administración.
 * La página admin.vue solo muestra este estado y dispara sus acciones.
 */
export const useAdminStore = defineStore('admin', () => {
  // ── Sesión ────────────────────────────────
  const isAdmin = ref(false)
  const loginLoading = ref(false)
  const loginError = ref('')

  // ── Dashboard ─────────────────────────────
  const stats = ref<AdminStats>(emptyStats())
  const codes = ref<RechargeCode[]>([])
  const loadingCodes = ref(false)
  const filterStatus = ref<'' | CodeStatus>('')
  const searchQuery = ref('')

  // ── Generación ────────────────────────────
  const generating = ref(false)
  const recentlyCreated = ref<RechargeCode[]>([])

  // ── Notificaciones ────────────────────────
  const toastMessage = ref('')
  let toastTimer: ReturnType<typeof setTimeout> | null = null

  function showToast(msg: string) {
    toastMessage.value = msg
    if (toastTimer) clearTimeout(toastTimer)
    toastTimer = setTimeout(() => {
      toastMessage.value = ''
    }, 2500)
  }

  // ── Sesión ────────────────────────────────
  async function checkSession() {
    try {
      const res = await adminApi.fetchSession()
      isAdmin.value = res?.user?.role === 'admin'
      if (isAdmin.value) await loadDashboard()
    } catch {
      isAdmin.value = false
    }
  }

  async function login(username: string, password: string) {
    loginLoading.value = true
    loginError.value = ''
    try {
      const res = await adminApi.login(username, password)
      if (res?.user?.role === 'admin') {
        isAdmin.value = true
        await loadDashboard()
      } else {
        loginError.value = 'Esta cuenta no tiene permisos de administrador.'
      }
    } catch (e) {
      loginError.value = apiErrorMessage(e, 'Usuario o contraseña incorrectos.')
    } finally {
      loginLoading.value = false
    }
  }

  async function logout() {
    try {
      await adminApi.logout()
    } catch {
      // la sesión se considera cerrada igualmente
    }
    isAdmin.value = false
    stats.value = emptyStats()
    codes.value = []
    recentlyCreated.value = []
  }

  // ── Dashboard ─────────────────────────────
  async function loadDashboard() {
    await Promise.all([fetchStats(), fetchCodes()])
  }

  async function fetchStats() {
    try {
      const res = await adminApi.fetchAdminStats()
      if (res?.stats) stats.value = res.stats
    } catch (e) {
      console.error('[admin] fetchStats:', e)
    }
  }

  async function fetchCodes() {
    loadingCodes.value = true
    try {
      const res = await adminApi.fetchCodes({
        status: filterStatus.value,
        search: searchQuery.value,
      })
      if (res?.codes) codes.value = res.codes
    } catch (e) {
      console.error('[admin] fetchCodes:', e)
    } finally {
      loadingCodes.value = false
    }
  }

  const debouncedFetchCodes = debounce(() => fetchCodes(), 350)

  function setFilter(status: '' | CodeStatus) {
    filterStatus.value = status
    fetchCodes()
  }

  async function generateCodes(payload: adminApi.GenerateCodesPayload) {
    if (generating.value) return
    generating.value = true
    try {
      const res = await adminApi.generateCodes(payload)
      if (res?.success) {
        recentlyCreated.value = res.codes
        showToast(res.message)
        await loadDashboard()
      }
    } catch (e) {
      alert(apiErrorMessage(e, 'Error al generar códigos'))
    } finally {
      generating.value = false
    }
  }

  async function setCodeStatus(code: RechargeCode, newStatus: 'active' | 'disabled') {
    try {
      const res = await adminApi.updateCodeStatus(code.id, newStatus)
      if (res?.success) {
        const target = codes.value.find((c) => c.id === code.id)
        if (target) target.status = newStatus
        showToast(res.message)
        fetchStats()
      }
    } catch (e) {
      alert(apiErrorMessage(e, 'Error al modificar estado'))
    }
  }

  return {
    // state
    isAdmin,
    loginLoading,
    loginError,
    stats,
    codes,
    loadingCodes,
    filterStatus,
    searchQuery,
    generating,
    recentlyCreated,
    toastMessage,
    // actions
    showToast,
    checkSession,
    login,
    logout,
    loadDashboard,
    fetchStats,
    fetchCodes,
    debouncedFetchCodes,
    setFilter,
    generateCodes,
    setCodeStatus,
  }
})
