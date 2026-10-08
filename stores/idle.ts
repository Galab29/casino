import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { IdleState, AdrenalineState } from '~/types/idle'
import {
  IDLE_STORAGE_KEY,
  CURRENT_IDLE_VERSION,
  IDLE_GENERATORS,
  IDLE_UPGRADES,
  PRESTIGE_UPGRADES,
  IDLE_ACHIEVEMENTS,
  GENERATOR_COST_MULTIPLIER,
  GENERATOR_MILESTONES,
  MILESTONE_MULTIPLIER,
  BASE_CLICK_VALUE,
  PRESTIGE_STAR_BONUS,
  PRESTIGE_DIVISOR,
} from '~/constants/idle'
import { useBlackjackStore } from '~/stores/blackjack'

export const useIdleStore = defineStore(
  'idle',
  () => {
    // ─── Estado reactivo ─────────────────────────────────────────
    const generators = ref<Record<string, number>>({})
    const upgrades = ref<string[]>([])
    const achievements = ref<string[]>([])
    const lifetimeChips = ref<number>(0)
    const runChips = ref<number>(0)
    const stars = ref<number>(0)
    const spentStars = ref<number>(0)
    const prestigeUpgrades = ref<Record<string, number>>({})
    const adrenaline = ref<AdrenalineState>({
      active: false,
      multiplier: 0,
      expiresAt: 0,
    })
    const clicks = ref<number>(0)
    const lastSavedAt = ref<number>(Date.now())
    const fraction = ref<number>(0)
    const version = ref<number>(CURRENT_IDLE_VERSION)

    // ─── Helper de acceso a la billetera ─────────────────────────
    function getWallet() {
      if (typeof window !== 'undefined') {
        const nuxtApp = useNuxtApp()
        if (nuxtApp?.$pinia) {
          return useBlackjackStore(nuxtApp.$pinia)
        }
      }
      return useBlackjackStore()
    }

    // ─── Getters de Mejoras y Efectos ────────────────────────────
    const purchasedUpgradesSet = computed(() => new Set(upgrades.value))

    /**
     * Multiplicadores específicos por generador (por mejoras)
     */
    const generatorUpgradeMultipliers = computed(() => {
      const map: Record<string, number> = {}
      for (const gen of IDLE_GENERATORS) {
        map[gen.id] = 1
      }
      for (const upg of IDLE_UPGRADES) {
        if (purchasedUpgradesSet.value.has(upg.id) && upg.effect.type === 'generatorMult') {
          map[upg.effect.target] = (map[upg.effect.target] || 1) * upg.effect.value
        }
      }
      return map
    })

    /**
     * Multiplicador por hitos de generadores (10, 25, 50, 100, 200 -> x2 c/u)
     */
    function getMilestoneMultiplier(count: number): number {
      let mult = 1
      for (const milestone of GENERATOR_MILESTONES) {
        if (count >= milestone) {
          mult *= MILESTONE_MULTIPLIER
        }
      }
      return mult
    }

    /**
     * Descuento en costo de generadores (mejoras normales + prestigio)
     */
    const generatorCostDiscount = computed(() => {
      let discountRate = 0
      // Prestigio: Negociador (-2% por nivel)
      const negotiatorLevel = prestigeUpgrades.value['prestige_negotiator'] || 0
      discountRate += negotiatorLevel * 0.02

      // Mejoras normales
      for (const upg of IDLE_UPGRADES) {
        if (purchasedUpgradesSet.value.has(upg.id) && upg.effect.type === 'costDiscount') {
          discountRate += upg.effect.value
        }
      }
      // Tope de descuento del 50% para no romper progresión
      return Math.max(0.5, 1 - Math.min(0.5, discountRate))
    })

    /**
     * Multiplicador global (mejoras globales + 1% por logro desbloqueado)
     */
    const globalMultiplier = computed(() => {
      let mult = 1
      for (const upg of IDLE_UPGRADES) {
        if (purchasedUpgradesSet.value.has(upg.id) && upg.effect.type === 'globalMult') {
          mult *= upg.effect.value
        }
      }
      // +1% por cada logro desbloqueado
      mult *= 1 + 0.01 * achievements.value.length
      return mult
    })

    /**
     * Bono permanente por estrellas de prestigio (+2% por estrella)
     */
    const starBonus = computed(() => {
      return (stars.value + spentStars.value) * PRESTIGE_STAR_BONUS
    })

    /**
     * Multiplicador de adrenalina activo
     */
    const adrenalineMultiplier = computed(() => {
      if (!adrenaline.value.active) return 0
      if (Date.now() >= adrenaline.value.expiresAt) return 0
      return adrenaline.value.multiplier
    })

    /**
     * Fichas por segundo por generador individual
     */
    function getGeneratorCps(generatorId: string): number {
      const gen = IDLE_GENERATORS.find((g) => g.id === generatorId)
      if (!gen) return 0
      const count = generators.value[generatorId] || 0
      if (count <= 0) return 0

      const upgMult = generatorUpgradeMultipliers.value[generatorId] || 1
      const milestoneMult = getMilestoneMultiplier(count)
      return gen.baseCps * count * upgMult * milestoneMult
    }

    /**
     * Fichas por segundo (CPS) total
     * cps = Σ produccionGenerador(i) × multGlobal × (1 + bonoEstrellas) × (1 + adrenalina)
     */
    const cps = computed(() => {
      let baseTotal = 0
      for (const gen of IDLE_GENERATORS) {
        baseTotal += getGeneratorCps(gen.id)
      }
      return (
        baseTotal *
        globalMultiplier.value *
        (1 + starBonus.value) *
        (1 + adrenalineMultiplier.value)
      )
    })

    /**
     * Valor del clic ("Propina del Crupier")
     * valorClick = (1 + clickPlano) × clickMult + (cps × (%cps / 100)) × clickMult
     */
    const clickValue = computed(() => {
      let clickFlat = 0
      let clickMult = 1
      let clickCpsPercent = 0

      for (const upg of IDLE_UPGRADES) {
        if (purchasedUpgradesSet.value.has(upg.id)) {
          if (upg.effect.type === 'clickFlat') clickFlat += upg.effect.value
          if (upg.effect.type === 'clickMult') clickMult *= upg.effect.value
          if (upg.effect.type === 'clickCpsPercent') clickCpsPercent += upg.effect.value
        }
      }

      const baseVal = (BASE_CLICK_VALUE + clickFlat) * clickMult
      const cpsContribution = (cps.value * (clickCpsPercent / 100)) * clickMult
      return Math.max(1, Math.floor(baseVal + cpsContribution))
    })

    /**
     * Estrellas de prestigio pendientes
     * estrellasPendientes = floor( sqrt( runChips / 1e7 ) )
     */
    const pendingStars = computed(() => {
      if (runChips.value < PRESTIGE_DIVISOR) return 0
      return Math.floor(Math.sqrt(runChips.value / PRESTIGE_DIVISOR))
    })

    // ─── Funciones de Costos y Compras ───────────────────────────

    /**
     * Costo para comprar una cantidad `qty` de un generador
     */
    function getGeneratorCost(generatorId: string, qty = 1): number {
      const gen = IDLE_GENERATORS.find((g) => g.id === generatorId)
      if (!gen || qty <= 0) return 0
      const owned = generators.value[generatorId] || 0
      const discount = generatorCostDiscount.value

      if (qty === 1) {
        return Math.max(
          1,
          Math.floor(gen.baseCost * Math.pow(GENERATOR_COST_MULTIPLIER, owned) * discount)
        )
      }

      let total = 0
      for (let i = 0; i < qty; i++) {
        total += Math.max(
          1,
          Math.floor(gen.baseCost * Math.pow(GENERATOR_COST_MULTIPLIER, owned + i) * discount)
        )
      }
      return total
    }

    /**
     * Calcula la cantidad máxima que se puede comprar de un generador dado un saldo
     */
    function getMaxBuyable(generatorId: string, availableChips: number): { count: number; totalCost: number } {
      const gen = IDLE_GENERATORS.find((g) => g.id === generatorId)
      if (!gen || availableChips <= 0) return { count: 0, totalCost: 0 }

      const owned = generators.value[generatorId] || 0
      const discount = generatorCostDiscount.value

      let count = 0
      let totalCost = 0

      // Búsqueda lineal eficiente o corte
      while (true) {
        const nextCost = Math.max(
          1,
          Math.floor(gen.baseCost * Math.pow(GENERATOR_COST_MULTIPLIER, owned + count) * discount)
        )
        if (totalCost + nextCost > availableChips) break
        totalCost += nextCost
        count++
        if (count >= 10000) break // Tope de seguridad
      }

      return { count, totalCost }
    }

    /**
     * Revelado del generador en la tienda (>= 50% de su costo base obtenido en esta run o historial)
     */
    function isGeneratorRevealed(generatorId: string): boolean {
      const gen = IDLE_GENERATORS.find((g) => g.id === generatorId)
      if (!gen) return false
      // El primero siempre está visible
      if (gen.id === IDLE_GENERATORS[0].id) return true
      // O si ya se posee al menos 1
      if ((generators.value[generatorId] || 0) > 0) return true
      // O si el capital alcanzado supera el 50% del costo base
      const wallet = getWallet()
      const maxCapital = Math.max(runChips.value, wallet.player.chips)
      return maxCapital >= gen.baseCost * 0.5
    }

    /**
     * Comprueba si una mejora cumple los requisitos para ser visible/comprable
     */
    function isUpgradeAvailable(upgradeId: string): boolean {
      if (purchasedUpgradesSet.value.has(upgradeId)) return false
      const upg = IDLE_UPGRADES.find((u) => u.id === upgradeId)
      if (!upg) return false

      if (!upg.requires) return true

      if (upg.requires.generator && upg.requires.owned) {
        const owned = generators.value[upg.requires.generator] || 0
        if (owned < upg.requires.owned) return false
      }

      if (upg.requires.runChips && runChips.value < upg.requires.runChips) {
        return false
      }

      if (upg.requires.lifetimeChips && lifetimeChips.value < upg.requires.lifetimeChips) {
        return false
      }

      if (upg.requires.upgrade && !purchasedUpgradesSet.value.has(upg.requires.upgrade)) {
        return false
      }

      return true
    }

    // ─── Acciones ────────────────────────────────────────────────

    /**
     * Clic manual ("Propina del Crupier")
     */
    function click(): number {
      const value = clickValue.value
      clicks.value++
      runChips.value += value
      lifetimeChips.value += value

      const wallet = getWallet()
      wallet.creditPassive(value)

      checkAchievements()
      return value
    }

    /**
     * Comprar generador (x1, x10, x100 o cantidad calculada)
     */
    function buyGenerator(generatorId: string, qty = 1): boolean {
      const wallet = getWallet()
      const cost = getGeneratorCost(generatorId, qty)

      if (wallet.player.chips < cost || qty <= 0) return false

      wallet.removeChips(cost)
      generators.value[generatorId] = (generators.value[generatorId] || 0) + qty

      checkAchievements()
      return true
    }

    /**
     * Comprar el máximo posible de un generador
     */
    function buyGeneratorMax(generatorId: string): boolean {
      const wallet = getWallet()
      const { count, totalCost } = getMaxBuyable(generatorId, wallet.player.chips)
      if (count <= 0) return false

      wallet.removeChips(totalCost)
      generators.value[generatorId] = (generators.value[generatorId] || 0) + count

      checkAchievements()
      return true
    }

    /**
     * Comprar mejora
     */
    function buyUpgrade(upgradeId: string): boolean {
      if (!isUpgradeAvailable(upgradeId)) return false
      const upg = IDLE_UPGRADES.find((u) => u.id === upgradeId)
      if (!upg) return false

      const wallet = getWallet()
      if (wallet.player.chips < upg.cost) return false

      wallet.removeChips(upg.cost)
      upgrades.value.push(upgradeId)

      checkAchievements()
      return true
    }

    /**
     * Costo de mejora de prestigio
     */
    function getPrestigeUpgradeCost(prestigeId: string): number {
      const p = PRESTIGE_UPGRADES.find((item) => item.id === prestigeId)
      if (!p) return Infinity
      const level = prestigeUpgrades.value[prestigeId] || 0
      if (level >= p.maxLevel) return Infinity
      return p.baseCost * Math.pow(p.costMult, level)
    }

    /**
     * Comprar mejora de prestigio
     */
    function buyPrestigeUpgrade(prestigeId: string): boolean {
      const cost = getPrestigeUpgradeCost(prestigeId)
      if (stars.value < cost || cost === Infinity) return false

      stars.value -= cost
      spentStars.value += cost
      prestigeUpgrades.value[prestigeId] = (prestigeUpgrades.value[prestigeId] || 0) + 1
      return true
    }

    /**
     * Activar bono de adrenalina
     */
    function setAdrenaline(bonusMultiplier: number, durationSeconds: number) {
      // Modificadores de duración
      let extraDuration = 0
      for (const upg of IDLE_UPGRADES) {
        if (purchasedUpgradesSet.value.has(upg.id) && upg.effect.type === 'adrenalineDuration') {
          extraDuration += upg.effect.value
        }
      }
      const prestigeAdrenalineLevel = prestigeUpgrades.value['prestige_adrenaline_dur'] || 0
      const prestigeDurMult = 1 + prestigeAdrenalineLevel * 0.5

      const totalDurationSec = (durationSeconds + extraDuration) * prestigeDurMult
      const newExpiresAt = Date.now() + totalDurationSec * 1000

      // Los bonos no se acumulan: se toma el mayor y se refresca duración
      if (!adrenaline.value.active || Date.now() >= adrenaline.value.expiresAt) {
        adrenaline.value = {
          active: true,
          multiplier: bonusMultiplier,
          expiresAt: newExpiresAt,
        }
      } else {
        const higherMultiplier = Math.max(adrenaline.value.multiplier, bonusMultiplier)
        adrenaline.value = {
          active: true,
          multiplier: higherMultiplier,
          expiresAt: Math.max(adrenaline.value.expiresAt, newExpiresAt),
        }
      }

      checkAchievements()
    }

    /**
     * Ejecutar prestigio ("Licencia de Casino")
     */
    function claimPrestige(): boolean {
      const starsToEarn = pendingStars.value
      if (starsToEarn < 1) return false

      stars.value += starsToEarn
      runChips.value = 0
      generators.value = {}
      upgrades.value = []
      fraction.value = 0
      adrenaline.value = {
        active: false,
        multiplier: 0,
        expiresAt: 0,
      }

      // Reiniciar capital en billetera con bono de Fondo de Inversión
      const startingChipsLevel = prestigeUpgrades.value['prestige_starting_chips'] || 0
      const initialChips = 1000 + startingChipsLevel * 500
      const wallet = getWallet()
      wallet.setChips(initialChips)

      checkAchievements()
      return true
    }

    /**
     * Vuelca la parte entera acumulada en `fraction` a la billetera principal del casino
     */
    function flushPassiveChips() {
      const wholeChips = Math.floor(fraction.value)
      if (wholeChips > 0) {
        fraction.value -= wholeChips
        runChips.value += wholeChips
        lifetimeChips.value += wholeChips

        const wallet = getWallet()
        wallet.creditPassive(wholeChips)
      }
    }

    /**
     * Bucle de simulación / tick de tiempo
     * dt: segundos transcurridos
     * flush: si es true, vuelca las fichas enteras acumuladas a la billetera
     */
    function tick(dt: number, flush = false) {
      if (dt <= 0) return

      // Actualizar expiración de adrenalina
      if (adrenaline.value.active && Date.now() >= adrenaline.value.expiresAt) {
        adrenaline.value.active = false
        adrenaline.value.multiplier = 0
        adrenaline.value.expiresAt = 0
      }

      const currentCps = cps.value
      if (currentCps > 0) {
        fraction.value += currentCps * dt
        if (flush) {
          flushPassiveChips()
        }
      }

      checkAchievements()
    }

    /**
     * Comprobación y desbloqueo de logros
     */
    function checkAchievements() {
      const unlocked = new Set(achievements.value)
      const wallet = getWallet()

      function unlock(id: string) {
        if (!unlocked.has(id)) {
          achievements.value.push(id)
        }
      }

      if (clicks.value >= 1) unlock('ach_first_click')
      if (clicks.value >= 100) unlock('ach_100_clicks')

      const totalOwned = Object.values(generators.value).reduce((a, b) => a + b, 0)
      if (totalOwned >= 1) unlock('ach_first_generator')
      if (totalOwned >= 50) unlock('ach_50_generators')

      if ((generators.value['slots_classic'] || 0) >= 10) unlock('ach_10_slots')
      if ((generators.value['blackjack_table'] || 0) >= 10) unlock('ach_10_bj')

      const allOwned = IDLE_GENERATORS.every((g) => (generators.value[g.id] || 0) >= 1)
      if (allOwned) unlock('ach_all_generators')

      if (cps.value >= 100) unlock('ach_100_cps')
      if (cps.value >= 10000) unlock('ach_10k_cps')

      if (lifetimeChips.value >= 1_000_000) unlock('ach_1m_chips')
      if (runChips.value >= 10_000_000) unlock('ach_10m_chips')

      if (stars.value + spentStars.value >= 1) unlock('ach_first_prestige')
      if (stars.value + spentStars.value >= 10) unlock('ach_10_stars')

      if (adrenaline.value.active) unlock('ach_adrenaline_active')

      // Integración con estadísticas de los juegos si están disponibles
      if (wallet.winRate !== undefined) {
        // Stats del blackjack store
        const bjStats = wallet.$state?.stats
        if (bjStats?.playerWins >= 1) unlock('ach_bj_win')
        if (bjStats?.totalGames >= 50) unlock('ach_50_rounds')
      }
    }

    /**
     * Exportar partida a string Base64
     */
    function exportSave(): string {
      const data: IdleState = {
        generators: generators.value,
        upgrades: upgrades.value,
        achievements: achievements.value,
        lifetimeChips: lifetimeChips.value,
        runChips: runChips.value,
        stars: stars.value,
        spentStars: spentStars.value,
        prestigeUpgrades: prestigeUpgrades.value,
        adrenaline: adrenaline.value,
        clicks: clicks.value,
        lastSavedAt: Date.now(),
        fraction: fraction.value,
        version: CURRENT_IDLE_VERSION,
      }
      return btoa(JSON.stringify(data))
    }

    /**
     * Importar partida desde string Base64
     */
    function importSave(saveStr: string): boolean {
      try {
        const decoded = atob(saveStr)
        const parsed = JSON.parse(decoded) as IdleState
        if (!parsed || typeof parsed !== 'object') return false

        generators.value = parsed.generators || {}
        upgrades.value = parsed.upgrades || []
        achievements.value = parsed.achievements || []
        lifetimeChips.value = Number(parsed.lifetimeChips) || 0
        runChips.value = Number(parsed.runChips) || 0
        stars.value = Number(parsed.stars) || 0
        spentStars.value = Number(parsed.spentStars) || 0
        prestigeUpgrades.value = parsed.prestigeUpgrades || {}
        adrenaline.value = parsed.adrenaline || { active: false, multiplier: 0, expiresAt: 0 }
        clicks.value = Number(parsed.clicks) || 0
        fraction.value = Number(parsed.fraction) || 0
        lastSavedAt.value = Date.now()
        version.value = CURRENT_IDLE_VERSION

        return true
      } catch (err) {
        console.error('Error al importar guardado:', err)
        return false
      }
    }

    /**
     * Reinicio total de fábrica (hard reset)
     */
    function hardReset() {
      generators.value = {}
      upgrades.value = []
      achievements.value = []
      lifetimeChips.value = 0
      runChips.value = 0
      stars.value = 0
      spentStars.value = 0
      prestigeUpgrades.value = {}
      adrenaline.value = { active: false, multiplier: 0, expiresAt: 0 }
      clicks.value = 0
      lastSavedAt.value = Date.now()
      fraction.value = 0
      version.value = CURRENT_IDLE_VERSION

      const wallet = getWallet()
      wallet.setChips(1000)
    }

    return {
      // Estado
      generators,
      upgrades,
      achievements,
      lifetimeChips,
      runChips,
      stars,
      spentStars,
      prestigeUpgrades,
      adrenaline,
      clicks,
      lastSavedAt,
      fraction,
      version,
      // Getters
      cps,
      clickValue,
      pendingStars,
      generatorCostDiscount,
      globalMultiplier,
      starBonus,
      adrenalineMultiplier,
      // Funciones de consulta
      getGeneratorCps,
      getGeneratorCost,
      getMaxBuyable,
      isGeneratorRevealed,
      isUpgradeAvailable,
      getPrestigeUpgradeCost,
      // Acciones
      click,
      buyGenerator,
      buyGeneratorMax,
      buyUpgrade,
      buyPrestigeUpgrade,
      setAdrenaline,
      claimPrestige,
      flushPassiveChips,
      tick,
      checkAchievements,
      exportSave,
      importSave,
      hardReset,
    }
  },
  {
    persist: {
      key: IDLE_STORAGE_KEY,
    },
  }
)
