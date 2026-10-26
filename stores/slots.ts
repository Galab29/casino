import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type {
  MachineStats,
  MachineTier,
  PayoutRule,
  SlotMachineConfig,
  SlotStatus,
  SpinHistoryEntry,
  SpinOutcome,
  WinLevel,
} from '~/types/slots'
import { SLOT_MACHINES } from '~/constants/slotMachines'
import { useWalletStore } from '~/stores/wallet'
import { createStatsPersistence } from '~/services/stats.api'

// ─── Constantes ──────────────────────────────────────────────
const LEGACY_STATS_STORAGE_KEY = 'slots_machine_stats_v1'
const HISTORY_LIMIT = 12

function emptyStats(): MachineStats {
  return { spins: 0, wins: 0, totalBet: 0, totalWon: 0, biggestWin: 0 }
}

function emptyStatsRecord(): Record<MachineTier, MachineStats> {
  return { bronze: emptyStats(), gold: emptyStats(), royal: emptyStats() }
}

// ─── Lógica pura (RNG) ───────────────────────────────────────

/**
 * Selecciona la regla ganadora usando una ruleta ponderada.
 * Se genera un número r ∈ [0, 1) y se recorre la tabla acumulando
 * probabilidades. Si r cae fuera de todas → la tirada pierde (null).
 */
function pickWinningRule(machine: SlotMachineConfig): PayoutRule | null {
  const r = Math.random()
  let accumulated = 0
  for (const rule of machine.paytable) {
    accumulated += rule.probability
    if (r < accumulated) return rule
  }
  return null
}

function randomSymbolId(machine: SlotMachineConfig): string {
  const i = Math.floor(Math.random() * machine.symbols.length)
  return machine.symbols[i].id
}

/** Combinación aleatoria que NUNCA forma tres iguales */
function randomLosingReels(machine: SlotMachineConfig): [string, string, string] {
  let a: string, b: string, c: string
  do {
    a = randomSymbolId(machine)
    b = randomSymbolId(machine)
    c = randomSymbolId(machine)
  } while (a === b && b === c)
  return [a, b, c]
}

function getWinLevel(machine: SlotMachineConfig, rule: PayoutRule): WinLevel {
  const topRule = machine.paytable[machine.paytable.length - 1]
  if (rule.symbolId === topRule.symbolId) return 'jackpot'
  if (rule.multiplier >= 10) return 'big'
  return 'small'
}

// ─── Store ───────────────────────────────────────────────────

export const useSlotsStore = defineStore('slots', () => {
  // ── Billetera centralizada (Servidor) ──
  const wallet = useWalletStore()
  const chips = computed(() => wallet.chips)

  function setChips(value: number) {
    wallet.setChips(value)
  }

  // ── Máquinas ──
  const machines = SLOT_MACHINES
  const selectedId = ref<MachineTier>('bronze')
  const machine = computed<SlotMachineConfig>(
    () => machines.find((m) => m.id === selectedId.value) ?? machines[0],
  )
  const minCost = Math.min(...machines.map((m) => m.cost))

  // ── Estado de juego ──
  const status = ref<SlotStatus>('idle')
  const reels = ref<[string, string, string]>(randomLosingReels(machines[0]))
  const spinId = ref<number>(0) // Se incrementa en cada tirada → dispara la animación
  const pendingOutcome = ref<SpinOutcome | null>(null)
  const lastOutcome = ref<SpinOutcome | null>(null)

  // ── Estadísticas ──
  const stats = ref<Record<MachineTier, MachineStats>>(emptyStatsRecord())
  const history = ref<SpinHistoryEntry[]>([])
  let historyCounter = 0

  // ── Persistencia con el Servidor ──
  const persistence = createStatsPersistence<Record<MachineTier, MachineStats>>({
    game: 'slots',
    legacyKey: LEGACY_STATS_STORAGE_KEY,
    getState: () => stats.value,
    applyState: (raw) => {
      const base = emptyStatsRecord()
      for (const tier of Object.keys(base) as MachineTier[]) {
        const s = raw?.[tier] ?? {}
        base[tier] = {
          spins: Number(s.spins) || 0,
          wins: Number(s.wins) || 0,
          totalBet: Number(s.totalBet) || 0,
          totalWon: Number(s.totalWon) || 0,
          biggestWin: Number(s.biggestWin) || 0,
        }
      }
      stats.value = base
    },
  })

  function loadStats() {
    return persistence.load()
  }

  function saveStats() {
    persistence.save()
  }

  function resetStats() {
    stats.value = emptyStatsRecord()
    history.value = []
    persistence.reset()
  }

  loadStats()

  // ── Computed ──
  const isSpinning = computed(() => status.value === 'spinning')
  const canAfford = computed(() => chips.value >= machine.value.cost)
  const canSpin = computed(() => !isSpinning.value && canAfford.value)
  const isBroke = computed(() => !isSpinning.value && chips.value < minCost)
  const currentStats = computed(() => stats.value[selectedId.value])

  const sessionNet = computed(() => {
    return Object.values(stats.value).reduce((acc, s) => acc + s.totalWon - s.totalBet, 0)
  })

  // ── Acciones ──

  function selectMachine(id: MachineTier) {
    if (isSpinning.value || id === selectedId.value) return
    selectedId.value = id
    status.value = 'idle'
    lastOutcome.value = null
    reels.value = randomLosingReels(machine.value)
  }

  /**
   * Inicia una tirada:
   * 1. Cobra el costo de la máquina.
   * 2. Decide el resultado ANTES de animar (como las máquinas reales).
   * 3. Cambia el estado a 'spinning' e incrementa spinId para que la vista anime.
   * El premio se acredita después, en resolveSpin(), cuando los rodillos se detienen.
   */
  function spin(): SpinOutcome | null {
    if (!canSpin.value) return null
    const m = machine.value

    setChips(chips.value - m.cost)

    const rule = pickWinningRule(m)
    const outcome: SpinOutcome = rule
      ? {
          reels: [rule.symbolId, rule.symbolId, rule.symbolId],
          winningSymbolId: rule.symbolId,
          multiplier: rule.multiplier,
          payout: rule.multiplier * m.cost,
          winLevel: getWinLevel(m, rule),
        }
      : {
          reels: randomLosingReels(m),
          winningSymbolId: null,
          multiplier: 0,
          payout: 0,
          winLevel: 'none',
        }

    reels.value = outcome.reels
    pendingOutcome.value = outcome
    lastOutcome.value = null
    status.value = 'spinning'
    spinId.value++
    return outcome
  }

  /** Se llama cuando los 3 rodillos terminaron de girar */
  function resolveSpin() {
    const outcome = pendingOutcome.value
    if (!outcome || status.value !== 'spinning') return
    const m = machine.value

    if (outcome.payout > 0) {
      setChips(chips.value + outcome.payout)
    }

    const s = stats.value[m.id]
    s.spins++
    s.totalBet += m.cost
    if (outcome.payout > 0) {
      s.wins++
      s.totalWon += outcome.payout
      s.biggestWin = Math.max(s.biggestWin, outcome.payout)
    }

    history.value.unshift({
      id: ++historyCounter,
      machineId: m.id,
      reels: outcome.reels,
      cost: m.cost,
      payout: outcome.payout,
    })
    if (history.value.length > HISTORY_LIMIT) history.value.splice(HISTORY_LIMIT)

    lastOutcome.value = outcome
    pendingOutcome.value = null
    status.value = 'result'
    saveStats()
  }

  function refillChips() {
    wallet.openRecharge()
  }

  return {
    // state
    machines,
    selectedId,
    status,
    reels,
    spinId,
    lastOutcome,
    stats,
    history,
    // computed
    chips,
    machine,
    isSpinning,
    canAfford,
    canSpin,
    isBroke,
    currentStats,
    sessionNet,
    // actions
    selectMachine,
    spin,
    resolveSpin,
    refillChips,
    resetStats,
  }
})
