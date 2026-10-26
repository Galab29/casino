/** API de Preferencias del usuario */

export type DeckStyle = 'pixel' | 'classic'

export interface UserPreferences {
  deckStyle: DeckStyle
}

export function fetchPreferences() {
  return $fetch<{ success: boolean; preferences: UserPreferences }>('/api/user/preferences')
}

export function updatePreferences(changes: Partial<UserPreferences>) {
  return $fetch<{ success: boolean; preferences: UserPreferences }>('/api/user/preferences', {
    method: 'PUT',
    body: changes,
  })
}
