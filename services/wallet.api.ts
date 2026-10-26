/** API de Billetera / Sesión del jugador */

export interface UserProfile {
  id: string
  username: string
  chips: number
  role: 'player' | 'admin'
}

export function fetchMe() {
  return $fetch<{ success: boolean; user: UserProfile }>('/api/auth/me')
}

export function syncChips(chips: number) {
  return $fetch<{ success: boolean; chips: number }>('/api/user/sync-chips', {
    method: 'POST',
    body: { chips },
  })
}
