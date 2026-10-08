// ─── Generadores ─────────────────────────────────────────────
export interface IdleGenerator {
  id: string
  name: string
  description: string
  baseCost: number
  baseCps: number
  icon: string
  color: string
  gameRoute?: string
}

// ─── Mejoras ────────────────────────────────────────────────
export type UpgradeEffect =
  | { type: 'generatorMult'; target: string; value: number }
  | { type: 'globalMult'; value: number }
  | { type: 'clickMult'; value: number }
  | { type: 'clickFlat'; value: number }
  | { type: 'clickCpsPercent'; value: number }
  | { type: 'adrenalineDuration'; value: number }
  | { type: 'costDiscount'; value: number }

export interface UpgradeRequirements {
  generator?: string
  owned?: number
  lifetimeChips?: number
  runChips?: number
  upgrade?: string
}

export interface IdleUpgrade {
  id: string
  name: string
  description: string
  cost: number
  requires?: UpgradeRequirements
  effect: UpgradeEffect
}

// ─── Prestigio ──────────────────────────────────────────────
export type PrestigeEffectType =
  | 'startingChips'
  | 'offlineMaxHours'
  | 'autoBuy'
  | 'adrenalineDurationMult'
  | 'generatorDiscount'

export interface PrestigeUpgradeEffect {
  type: PrestigeEffectType
  valuePerLevel: number
}

export interface PrestigeUpgrade {
  id: string
  name: string
  description: string
  maxLevel: number
  baseCost: number
  costMult: number
  effect: PrestigeUpgradeEffect
}

// ─── Logros ─────────────────────────────────────────────────
export interface IdleAchievement {
  id: string
  name: string
  description: string
  icon: string
  category: 'idle' | 'blackjack' | 'poker' | 'ruleta' | 'slots' | 'baccarat' | 'general'
}

// ─── Adrenalina ─────────────────────────────────────────────
export interface AdrenalineState {
  active: boolean
  multiplier: number // e.g. 0.25 para +25%
  expiresAt: number  // timestamp Date.now()
}

// ─── Estado Idle ────────────────────────────────────────────
export interface IdleState {
  generators: Record<string, number>
  upgrades: string[]
  achievements: string[]
  lifetimeChips: number
  runChips: number
  stars: number
  spentStars: number
  prestigeUpgrades: Record<string, number>
  adrenaline: AdrenalineState
  clicks: number
  lastSavedAt: number
  fraction: number
  version: number
}
