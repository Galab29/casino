// Simulation test for the poker store: plays many random hands and checks chip conservation.
import { build } from 'esbuild'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import fs from 'node:fs'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const out = path.join(root, 'scratch', '.poker_sim_bundle.mjs')

const entry = `
import { createPinia, setActivePinia, defineStore } from 'pinia'
import { ref } from 'vue'
export { createPinia, setActivePinia }
export { usePokerStore } from '~/stores/poker'
export { useBlackjackStore } from './blackjack'
`

await build({
  stdin: { contents: entry, resolveDir: path.join(root, 'stores'), loader: 'ts' },
  bundle: true,
  format: 'esm',
  platform: 'node',
  outfile: out,
  logLevel: 'error',
  plugins: [
    {
      name: 'alias',
      setup(b) {
        b.onResolve({ filter: /^~\// }, (a) => {
          const p = path.join(root, a.path.slice(2))
          for (const ext of ['.ts', '/index.ts', '']) if (fs.existsSync(p + ext)) return { path: p + ext }
          return { path: p }
        })
        // Mock the wallet store
        b.onResolve({ filter: /^\.\/blackjack$/ }, () => ({ path: 'mock-wallet', namespace: 'mock' }))
        b.onLoad({ filter: /.*/, namespace: 'mock' }, () => ({
          resolveDir: root,
          loader: 'ts',
          contents: `
            import { defineStore } from 'pinia'
            import { ref } from 'vue'
            export const useBlackjackStore = defineStore('bj', () => {
              const player = ref({ chips: 1000 })
              function addChips(a){ player.value.chips = Math.max(0, player.value.chips + Math.floor(a)) }
              function removeChips(a){ player.value.chips = Math.max(0, player.value.chips - Math.floor(a)) }
              function refillChips(a=1000){ player.value.chips += a }
              return { player, addChips, removeChips, refillChips }
            })`,
        }))
      },
    },
  ],
})

const mod = await import(pathToFileURL(out).href)
const pinia = mod.createPinia()
mod.setActivePinia(pinia)
const store = mod.usePokerStore()
const wallet = mod.useBlackjackStore()

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
// Speed up timers
const realSetTimeout = globalThis.setTimeout
globalThis.setTimeout = (fn, ms, ...args) => realSetTimeout(fn, 0, ...args)

let errors = 0
const HANDS = Number(process.argv[2] || 400)
for (let h = 0; h < HANDS; h++) {
  if (wallet.player.chips < store.bigBlind) wallet.refillChips(Math.floor(Math.random() * 3000) + 100)
  store.setStakes([10, 25, 50, 100][Math.floor(Math.random() * 4)])
  const before = wallet.player.chips + store.dealerChips
  if (!store.startNewHand()) { console.log('could not start'); errors++; continue }
  // dealer refill can change total – recompute after start
  const total = wallet.player.chips + store.dealerChips + store.pot

  let guard = 0
  while (store.street !== 'showdown') {
    if (++guard > 500) { console.error('STUCK hand', h, store.street, store.currentTurn); errors++; break }
    if (store.currentTurn === 'player') {
      const r = Math.random()
      if (r < 0.08) store.playerFold()
      else if (r < 0.2 && store.canRaise) store.playerBetOrRaise(store.maxRaiseAmount)
      else if (r < 0.4 && store.canFullRaise) store.playerBetOrRaise(store.minRaiseAmount + Math.floor(Math.random() * 200))
      else if (store.canCheck) store.playerCheck()
      else store.playerCall()
    }
    await sleep(1)
  }
  await sleep(2)
  const after = wallet.player.chips + store.dealerChips
  if (after !== total) {
    console.error(`CHIP LEAK hand ${h}: before=${total} after=${after}`, store.roundResult?.reason)
    errors++
  }
  if (wallet.player.chips < 0 || store.dealerChips < 0) { console.error('NEGATIVE chips', h); errors++ }
}

fs.unlinkSync(out)
console.log(errors ? `FAILED with ${errors} errors` : `OK: ${HANDS} hands simulated, chips conserved, no stuck hands`)
process.exit(errors ? 1 : 0)
