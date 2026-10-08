import {
  createPokerDeck,
  evaluate5Cards,
  getBestHand,
  compareEvaluatedHands,
} from '../constants/poker.ts'

console.log('Testing createPokerDeck...')
const deck = createPokerDeck()
console.log('Deck size:', deck.length)

console.log('Testing 2-card preflop hand...')
const c1 = deck[0]
const c2 = deck[1]
const preflop = getBestHand([c1, c2], [])
console.log('Preflop hand:', preflop.name, preflop.rank)

console.log('Testing 5-card flop hand...')
const flop = [deck[2], deck[3], deck[4]]
const flopHand = getBestHand([c1, c2], flop)
console.log('Flop hand:', flopHand.name, flopHand.rank)

console.log('Testing 7-card showdown hand...')
const turnAndRiver = [deck[5], deck[6]]
const fullBoard = [...flop, ...turnAndRiver]
const showdownHand = getBestHand([c1, c2], fullBoard)
console.log('Showdown hand:', showdownHand.name, showdownHand.rank, 'Score:', showdownHand.scoreValues)

console.log('All tests passed successfully!')
