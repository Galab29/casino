import {
  IDLE_GENERATORS,
  IDLE_UPGRADES,
  GENERATOR_COST_MULTIPLIER,
  GENERATOR_MILESTONES,
  MILESTONE_MULTIPLIER,
  PRESTIGE_DIVISOR,
} from '../constants/idle.ts'

console.log('─── SIMULADOR DE BALANCE IDLE (Royal Casino Tycoon) ───\n')

function simulateRun(strategy = 'efficient', initialChips = 1000) {
  let chips = initialChips
  let runChips = 0
  let timeSeconds = 0
  const dt = 1 // simulación en pasos de 1 segundo

  const generators = {}
  for (const g of IDLE_GENERATORS) {
    generators[g.id] = 0
  }
  const purchasedUpgrades = new Set()

  function getCostDiscount() {
    let discount = 0
    for (const upg of IDLE_UPGRADES) {
      if (purchasedUpgrades.has(upg.id) && upg.effect.type === 'costDiscount') {
        discount += upg.effect.value
      }
    }
    return Math.max(0.5, 1 - discount)
  }

  function getGeneratorCost(id) {
    const gen = IDLE_GENERATORS.find((g) => g.id === id)
    const owned = generators[id] || 0
    return Math.max(1, Math.floor(gen.baseCost * Math.pow(GENERATOR_COST_MULTIPLIER, owned) * getCostDiscount()))
  }

  function getCps() {
    let total = 0
    for (const gen of IDLE_GENERATORS) {
      const owned = generators[gen.id] || 0
      if (owned <= 0) continue

      let upgMult = 1
      for (const upg of IDLE_UPGRADES) {
        if (purchasedUpgrades.has(upg.id) && upg.effect.type === 'generatorMult' && upg.effect.target === gen.id) {
          upgMult *= upg.effect.value
        }
      }

      let milestoneMult = 1
      for (const m of GENERATOR_MILESTONES) {
        if (owned >= m) milestoneMult *= MILESTONE_MULTIPLIER
      }

      total += gen.baseCps * owned * upgMult * milestoneMult
    }

    let globalMult = 1
    for (const upg of IDLE_UPGRADES) {
      if (purchasedUpgrades.has(upg.id) && upg.effect.type === 'globalMult') {
        globalMult *= upg.effect.value
      }
    }

    return total * globalMult
  }

  const milestonesReached = {}
  const targetMilestones = [
    { key: 'first_generator', label: '1er Generador (Tragamonedas)', test: () => Object.values(generators).some((v) => v > 0) },
    { key: 'blackjack', label: 'Mesa de Blackjack', test: () => (generators['blackjack_table'] || 0) >= 1 },
    { key: 'baccarat', label: 'Mesa de Baccarat', test: () => (generators['baccarat_table'] || 0) >= 1 },
    { key: 'ruleta', label: 'Ruleta Europea', test: () => (generators['ruleta_table'] || 0) >= 1 },
    { key: 'poker', label: 'Sala de Póker', test: () => (generators['poker_room'] || 0) >= 1 },
    { key: 'dados', label: 'Mesa de Dados', test: () => (generators['dados_table'] || 0) >= 1 },
    { key: 'vip', label: 'Salón VIP', test: () => (generators['vip_lounge'] || 0) >= 1 },
    { key: 'royal_tower', label: 'Torre Royal', test: () => (generators['royal_tower'] || 0) >= 1 },
    { key: 'first_star', label: '1ª Estrella (10M runChips)', test: () => runChips >= PRESTIGE_DIVISOR },
  ]

  const maxSimTime = 3600 * 12 // máx 12 horas simuladas

  while (timeSeconds < maxSimTime) {
    const currentCps = getCps()
    const earned = currentCps * dt
    chips += earned
    runChips += earned
    timeSeconds += dt

    // Comprobar hitos
    for (const m of targetMilestones) {
      if (!milestonesReached[m.key] && m.test()) {
        milestonesReached[m.key] = timeSeconds
        const mins = (timeSeconds / 60).toFixed(1)
        console.log(`[HITO ALCANZADO] ${m.label}: ${timeSeconds}s (${mins} min) | CPS actual: ${currentCps.toFixed(1)}`)
      }
    }

    if (milestonesReached['royal_tower'] && milestonesReached['first_star']) {
      break
    }

    // Estrategia de compra codiciosa / ROI:
    // Buscar la mejor inversión entre generadores desbloqueados y mejoras disponibles
    let bestOption = null
    let bestPayback = Infinity

    // Evaluar mejoras disponibles
    for (const upg of IDLE_UPGRADES) {
      if (purchasedUpgrades.has(upg.id)) continue
      if (chips >= upg.cost) {
        // Requisitos
        if (upg.requires) {
          if (upg.requires.generator && (generators[upg.requires.generator] || 0) < (upg.requires.owned || 0)) continue
        }
        // Comprar mejoras directas
        chips -= upg.cost
        purchasedUpgrades.add(upg.id)
      }
    }

    // Evaluar compra de generadores
    for (const gen of IDLE_GENERATORS) {
      const cost = getGeneratorCost(gen.id)
      if (chips >= cost) {
        // Estimar incremento de CPS
        generators[gen.id]++
        const newCps = getCps()
        generators[gen.id]--
        const deltaCps = Math.max(0.01, newCps - currentCps)
        const payback = cost / deltaCps

        if (payback < bestPayback) {
          bestPayback = payback
          bestOption = gen.id
        }
      }
    }

    if (bestOption) {
      const cost = getGeneratorCost(bestOption)
      if (chips >= cost) {
        chips -= cost
        generators[bestOption]++
      }
    }
  }

  console.log('\n─── RESUMEN DE LA SIMULACIÓN ───')
  console.log(`Tiempo total: ${(timeSeconds / 60).toFixed(1)} min (${(timeSeconds / 3600).toFixed(2)} h)`)
  console.log(`Fichas en la run: ${Math.floor(runChips).toLocaleString()}`)
  console.log(`CPS final: ${getCps().toFixed(1)}`)
  console.log('Generadores poseídos:')
  for (const gen of IDLE_GENERATORS) {
    console.log(` - ${gen.name}: ${generators[gen.id] || 0}`)
  }
}

simulateRun()
