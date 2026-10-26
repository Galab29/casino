/** API del Panel de Administración */

export type CodeStatus = 'active' | 'redeemed' | 'disabled' | 'expired'

export interface AdminStats {
  totalCodes: number
  activeCodes: number
  activeChips: number
  redeemedCodes: number
  redeemedChips: number
  disabledCodes: number
  totalUsers: number
  totalUserChips: number
}

export interface RechargeCode {
  id: number
  code: string
  amount: number
  status: CodeStatus
  createdAt: number
  expiresAt: number | null
  redeemedAt: number | null
  createdBy: string
  redeemedBy: string | null
}

export interface GenerateCodesPayload {
  amount: number
  count: number
  expiresInHours: number | null
}

interface SessionUser {
  id: string
  username: string
  role: 'player' | 'admin'
}

export function fetchSession() {
  return $fetch<{ success: boolean; user: SessionUser }>('/api/auth/me')
}

export function login(username: string, password: string) {
  return $fetch<{ success: boolean; user: SessionUser }>('/api/auth/login', {
    method: 'POST',
    body: { username, password },
  })
}

export function logout() {
  return $fetch('/api/auth/logout', { method: 'POST' })
}

export function fetchAdminStats() {
  return $fetch<{ success: boolean; stats: AdminStats }>('/api/admin/stats')
}

export function fetchCodes(filters: { status?: string; search?: string }) {
  return $fetch<{ success: boolean; codes: RechargeCode[] }>('/api/admin/codes', {
    query: {
      status: filters.status || undefined,
      search: filters.search || undefined,
    },
  })
}

export function generateCodes(payload: GenerateCodesPayload) {
  return $fetch<{ success: boolean; message: string; codes: RechargeCode[] }>('/api/admin/codes', {
    method: 'POST',
    body: payload,
  })
}

export function updateCodeStatus(id: number, status: 'active' | 'disabled') {
  return $fetch<{ success: boolean; message: string }>(`/api/admin/codes/${id}/status`, {
    method: 'PATCH',
    body: { status },
  })
}
