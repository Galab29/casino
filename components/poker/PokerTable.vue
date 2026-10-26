<script setup lang="ts">
import { computed } from 'vue'
import { usePokerStore } from '~/stores/poker'
import PlayingCard from '~/components/blackjack/PlayingCard.vue'
import PokerHandBadge from '~/components/poker/PokerHandBadge.vue'
import PokerChip3D from '~/components/poker/PokerChip3D.vue'
import type { Card } from '~/types/blackjack'

const store = usePokerStore()

// Check if a card is in the winning 5-card hand
function isWinningCard(card: Card, isPlayer: boolean): boolean {
  if (store.street !== 'showdown' || !store.roundResult || store.roundResult.byFold) return false
  const winningHand =
    store.roundResult.winner === 'player'
      ? store.roundResult.playerHand
      : store.roundResult.winner === 'dealer'
      ? store.roundResult.dealerHand
      : store.roundResult.playerHand

  if (!winningHand?.bestFiveCards) return false
  return winningHand.bestFiveCards.some(
    (bc) => bc.value === card.value && bc.suit === card.suit,
  )
}
</script>

<template>
  <div class="poker-table-container">
    <div class="poker-table-rim">
      <div class="poker-table-felt">
        <!-- Watermark / Table Logo -->
        <div class="table-watermark">
          <v-icon color="amber" size="36" class="watermark-icon">mdi-cards-playing-spade</v-icon>
          <div class="watermark-text">RETRO POKER ROOM</div>
          <div class="watermark-sub">★ NO LIMIT TEXAS HOLD'EM ★</div>
        </div>

        <!-- ═══ TOP: DEALER ZONE ═══ -->
        <div class="dealer-zone">
          <!-- Dealer Avatar & Info (Retro 1P Arcade Croupier) -->
          <div class="dealer-profile d-flex align-center ga-3">
            <div class="dealer-avatar-wrap">
              <div
                class="dealer-avatar"
                :class="{ 'dealer-avatar--active': store.currentTurn === 'dealer' }"
              >
                <img
                  src="/img/croupier.png"
                  alt="El Croupier"
                  class="dealer-avatar-img"
                />
              </div>
              <div v-if="store.dealerButton === 'dealer'" class="dealer-button-chip dealer-btn-top">
                D
              </div>
            </div>

            <div class="dealer-meta">
              <div class="d-flex align-center ga-2">
                <span class="player-tag-pill player-tag--dealer">1P CROUPIER</span>
                <span v-if="store.currentTurn === 'dealer'" class="turn-indicator turn-indicator--dealer">
                  {{ store.isDealerThinking ? 'Pensando...' : 'Su Turno' }}
                </span>
              </div>
              <div class="dealer-bankroll">
                <v-icon size="14" color="amber">mdi-poker-chip</v-icon>
                <span>{{ store.dealerChips.toLocaleString() }}</span>
                <span class="bankroll-lbl">fichas</span>
              </div>
            </div>

            <!-- Dealer Speech Bubble (Retro Dialogue Box) -->
            <transition name="speech-pop">
              <div v-if="store.dealerSpeech" class="dealer-speech-bubble">
                <span class="speech-quote">«{{ store.dealerSpeech.text }}»</span>
                <div class="speech-pointer" />
              </div>
            </transition>
          </div>

          <!-- Dealer Cards -->
          <div class="dealer-cards-area">
            <div class="cards-hand-row">
              <div
                v-for="(card, idx) in store.dealerCards"
                :key="card.id || idx"
                class="card-slot card-slot--dealer"
                :class="{ 'card-highlight': isWinningCard(card, false) }"
              >
                <PlayingCard
                  :card="card"
                  :face-down="card.hidden"
                  back-color="red"
                />
              </div>
            </div>

            <!-- Dealer Showdown Badge -->
            <div
              v-if="store.street === 'showdown' && store.dealerBestHand && store.dealerCards.every((c) => !c.hidden)"
              class="mt-1"
            >
              <PokerHandBadge
                :hand="store.dealerBestHand"
                :is-winning="store.roundResult?.winner === 'dealer'"
              />
            </div>

            <!-- Dealer Round Bet Spot with 3D Chips -->
            <div v-if="store.dealerRoundBet > 0" class="bet-spot bet-spot--dealer">
              <PokerChip3D :amount="store.dealerRoundBet" size="sm" :stacked="store.dealerRoundBet >= 50" />
              <div class="bet-tag">
                <span class="bet-tag-lbl">Apuesta</span>
                <span class="bet-tag-num">{{ store.dealerRoundBet }}</span>
              </div>
            </div>
            <div v-else-if="store.dealerLastAction" class="action-pill action-pill--dealer">
              {{ store.dealerLastAction }}
            </div>
          </div>
        </div>

        <!-- ═══ CENTER: COMMUNITY BOARD & POT ═══ -->
        <div class="center-board-zone">
          <!-- Street Steps Indicator -->
          <div class="streets-nav">
            <span class="street-pill" :class="{ 'street-pill--active': store.street === 'preflop' }">
              Pre-Flop
            </span>
            <span class="street-arrow">›</span>
            <span class="street-pill" :class="{ 'street-pill--active': store.street === 'flop' }">
              Flop
            </span>
            <span class="street-arrow">›</span>
            <span class="street-pill" :class="{ 'street-pill--active': store.street === 'turn' }">
              Turn
            </span>
            <span class="street-arrow">›</span>
            <span class="street-pill" :class="{ 'street-pill--active': store.street === 'river' }">
              River
            </span>
          </div>

          <!-- The Pot Display with 3D Stacked Chips -->
          <div class="pot-display">
            <PokerChip3D :amount="store.pot || 25" size="md" :stacked="true" />
            <div class="pot-info">
              <div class="pot-label">BOTE TOTAL</div>
              <div class="pot-amount">{{ store.pot.toLocaleString() }}</div>
            </div>
          </div>

          <!-- 5 Community Cards Grid -->
          <div class="community-cards-row">
            <div
              v-for="i in 5"
              :key="i"
              class="community-slot"
              :class="{
                'community-slot--filled': store.communityCards[i - 1],
                'community-slot--winning': store.communityCards[i - 1] && isWinningCard(store.communityCards[i - 1], false)
              }"
            >
              <template v-if="store.communityCards[i - 1]">
                <PlayingCard :card="store.communityCards[i - 1]" />
              </template>
              <template v-else>
                <div class="empty-card-placeholder">
                  <span class="placeholder-label">
                    {{ i <= 3 ? 'FLOP' : i === 4 ? 'TURN' : 'RIVER' }}
                  </span>
                </div>
              </template>
            </div>
          </div>
        </div>

        <!-- Table Action Line / Arcade Felt Separator -->
        <div class="table-action-line">
          <span class="action-line-text">★ TU MANO ★</span>
        </div>

        <!-- ═══ BOTTOM: PLAYER ZONE ═══ -->
        <div class="player-zone">
          <!-- Left Column: Player Hand Strength Badge -->
          <div class="player-side-col player-side-col--left">
            <transition name="fade-badge">
              <div v-if="store.playerBestHand && store.street !== 'idle'" class="player-hand-eval-wrap">
                <PokerHandBadge
                  :hand="store.playerBestHand"
                  label="Tu Mano Actual"
                  :is-winning="store.roundResult?.winner === 'player'"
                />
              </div>
            </transition>
          </div>

          <!-- Center Column: Player Cards Fan & Bet Spot -->
          <div class="player-cards-area">
            <!-- Player Round Bet Spot with 3D Chips -->
            <div v-if="store.playerRoundBet > 0" class="bet-spot bet-spot--player mb-1">
              <PokerChip3D :amount="store.playerRoundBet" size="sm" :stacked="store.playerRoundBet >= 50" />
              <div class="bet-tag">
                <span class="bet-tag-lbl">Apuesta</span>
                <span class="bet-tag-num">{{ store.playerRoundBet }}</span>
              </div>
            </div>
            <div v-else-if="store.playerLastAction" class="action-pill action-pill--player mb-1">
              {{ store.playerLastAction }}
            </div>

            <div class="cards-hand-row cards-hand-row--player">
              <div
                v-for="(card, idx) in store.playerCards"
                :key="card.id || idx"
                class="card-slot card-slot--player"
                :class="{
                  'card-highlight': isWinningCard(card, true),
                  'card-slot--left': idx === 0,
                  'card-slot--right': idx === 1
                }"
              >
                <PlayingCard :card="card" back-color="blue" />
              </div>
            </div>
          </div>

          <!-- Right Column: Player Header/Profile in Table (Retro Arcade 2P Player) -->
          <div class="player-side-col player-side-col--right">
            <div class="player-profile d-flex align-center ga-3">
              <div class="player-avatar-wrap">
                <div
                  class="player-avatar"
                  :class="{ 'player-avatar--active': store.currentTurn === 'player' }"
                >
                  <v-icon color="amber" size="30">mdi-account-star</v-icon>
                </div>
                <div v-if="store.dealerButton === 'player'" class="dealer-button-chip dealer-btn-bot">
                  D
                </div>
              </div>

              <div class="player-meta">
                <div class="d-flex align-center ga-2">
                  <span class="player-tag-pill player-tag--player">2P TÚ</span>
                  <span v-if="store.currentTurn === 'player'" class="turn-indicator turn-indicator--player">
                    ¡Tu Turno!
                  </span>
                </div>
                <div class="player-bankroll">
                  <v-icon size="14" color="amber">mdi-poker-chip</v-icon>
                  <span>{{ store.playerChips.toLocaleString() }}</span>
                  <span class="bankroll-lbl">fichas</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.poker-table-container {
  width: 100%;
  max-width: 980px;
  margin: 0 auto;
  padding: 6px;
}

/* Outer Leather/Mahogany Table Rim */
.poker-table-rim {
  background: radial-gradient(circle at 50% 50%, #2b0b0e 0%, #150507 80%, #080203 100%);
  border: 4px solid #4a151b;
  border-radius: 120px;
  padding: 12px;
  box-shadow:
    0 15px 40px rgba(0, 0, 0, 0.9),
    inset 0 0 25px rgba(0, 0, 0, 0.9),
    0 0 30px rgba(183, 28, 28, 0.2);
  position: relative;
}

/* Inner Velvet Felt */
.poker-table-felt {
  background: radial-gradient(ellipse at 50% 50%, #681720 0%, #460f15 55%, #2a080d 100%);
  border: 2px solid rgba(255, 215, 0, 0.35);
  border-radius: 108px;
  min-height: 560px;
  padding: 16px 24px 20px 24px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  align-items: center;
  position: relative;
  box-shadow: inset 0 0 45px rgba(0, 0, 0, 0.7);
}

/* Table Watermark / Logo */
.table-watermark {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  text-align: center;
  pointer-events: none;
  opacity: 0.12;
  user-select: none;
  z-index: 1;
}

.watermark-text {
  font-family: 'Cinzel', serif;
  font-size: 2.2rem;
  font-weight: 900;
  letter-spacing: 0.18em;
  color: #ffd54f;
}

.watermark-sub {
  font-size: 0.75rem;
  letter-spacing: 0.3em;
  color: #fff;
  margin-top: 2px;
}

/* ═══ Zones ═══ */
.dealer-zone {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  z-index: 2;
}

.center-board-zone {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  z-index: 2;
  margin: 0;
}

/* Table Action Line / Arcade Felt Separator */
.table-action-line {
  width: 76%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 12px auto 10px auto;
  position: relative;
  user-select: none;
  pointer-events: none;
  z-index: 2;
}

.table-action-line::before,
.table-action-line::after {
  content: '';
  flex: 1;
  height: 1px;
  border-bottom: 1.5px dashed rgba(255, 215, 0, 0.28);
}

.action-line-text {
  font-family: 'Press Start 2P', monospace;
  font-size: 0.44rem;
  color: rgba(255, 215, 0, 0.45);
  padding: 0 12px;
  letter-spacing: 0.12em;
}

.player-zone {
  width: 100%;
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: end;
  z-index: 2;
  margin-top: auto;
  padding: 0 6px;
}

.player-side-col {
  display: flex;
  align-items: flex-end;
}

.player-side-col--left {
  justify-content: flex-start;
}

.player-side-col--right {
  justify-content: flex-end;
}

.player-cards-area {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-end;
  padding: 0 8px;
}

/* Dealer / Player Avatars (Estética Arcade Retro) */
.dealer-avatar-wrap,
.player-avatar-wrap {
  position: relative;
}

.dealer-avatar {
  width: 76px;
  height: 76px;
  border-radius: 14px;
  background: radial-gradient(circle at 35% 30%, #2b0b10 0%, #100305 100%);
  border: 3px solid #ffd54f;
  box-shadow:
    0 0 0 2px #0a0305,
    0 0 0 4px rgba(255, 213, 79, 0.4),
    0 8px 20px rgba(0, 0, 0, 0.85);
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  position: relative;
  transition: transform 0.25s ease, box-shadow 0.25s ease;
}

.dealer-avatar--active {
  box-shadow:
    0 0 0 2px #0a0305,
    0 0 0 4px #ef5350,
    0 0 22px rgba(239, 83, 80, 0.7);
  transform: scale(1.05);
  border-color: #ef5350;
}

.dealer-avatar-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center 25%;
  image-rendering: pixelated;
  image-rendering: -webkit-optimize-contrast;
  display: block;
}

.player-avatar {
  width: 64px;
  height: 64px;
  border-radius: 12px;
  background: linear-gradient(135deg, #0d47a1, #1565c0);
  border: 2.5px solid #4fc3f7;
  box-shadow:
    0 0 0 2px #050a14,
    0 0 0 4px rgba(79, 195, 247, 0.4),
    0 6px 16px rgba(0, 0, 0, 0.75);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform 0.25s ease, box-shadow 0.25s ease;
}

.player-avatar--active {
  box-shadow:
    0 0 0 2px #050a14,
    0 0 0 4px #4fc3f7,
    0 0 20px rgba(79, 195, 247, 0.8);
  transform: scale(1.05);
}

.dealer-button-chip {
  position: absolute;
  bottom: -4px;
  right: -4px;
  width: 22px;
  height: 22px;
  background: #ffffff;
  color: #b71c1c;
  border: 2px solid #b71c1c;
  border-radius: 50%;
  font-weight: 900;
  font-size: 0.72rem;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.7);
}

.player-tag-pill {
  font-family: 'Cinzel', serif;
  font-size: 0.72rem;
  font-weight: 900;
  letter-spacing: 0.08em;
  padding: 2px 8px;
  border-radius: 4px;
  text-transform: uppercase;
}

.player-tag--dealer {
  background: rgba(239, 83, 80, 0.25);
  border: 1px solid #ef5350;
  color: #ff8a80;
}

.player-tag--player {
  background: rgba(79, 195, 247, 0.25);
  border: 1px solid #4fc3f7;
  color: #80d8ff;
}

.dealer-bankroll,
.player-bankroll {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 0.82rem;
  font-weight: 700;
  color: #ffd54f;
}

.bankroll-lbl {
  font-size: 0.65rem;
  color: #b0bec5;
  text-transform: uppercase;
}

/* Turn Indicator Pill */
.turn-indicator {
  font-size: 0.68rem;
  font-weight: 800;
  padding: 2px 8px;
  border-radius: 999px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  animation: pulseTurn 1.4s infinite ease-in-out;
}

.turn-indicator--dealer {
  background: rgba(239, 83, 80, 0.3);
  color: #ef5350;
  border: 1px solid #ef5350;
}

.turn-indicator--player {
  background: rgba(79, 195, 247, 0.35);
  color: #4fc3f7;
  border: 1px solid #4fc3f7;
}

@keyframes pulseTurn {
  0%, 100% {
    transform: scale(1);
    opacity: 0.9;
  }
  50% {
    transform: scale(1.06);
    opacity: 1;
  }
}

/* 16-bit Retro Dialogue Box */
.dealer-speech-bubble {
  background: #14141d;
  border: 2px solid var(--pixel-gold);
  border-radius: 4px;
  padding: 6px 14px;
  color: #fff;
  font-family: 'Press Start 2P', monospace !important;
  font-size: 0.55rem;
  line-height: 1.4;
  max-width: 260px;
  box-shadow: 0 4px 0 #000, 0 0 10px rgba(0, 0, 0, 0.5);
  position: relative;
}

.speech-pointer {
  position: absolute;
  top: 50%;
  left: -8px;
  transform: translateY(-50%);
  width: 0;
  height: 0;
  border-top: 6px solid transparent;
  border-bottom: 6px solid transparent;
  border-right: 8px solid var(--pixel-gold);
}

.speech-quote {
  font-style: italic;
}

/* Speech Animation */
.speech-pop-enter-active,
.speech-pop-leave-active {
  transition: all 0.25s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}
.speech-pop-enter-from,
.speech-pop-leave-to {
  opacity: 0;
  transform: translateY(-8px) scale(0.9);
}

/* ═══ Cards Layout ═══ */
.cards-hand-row {
  display: flex;
  gap: 12px;
  align-items: center;
  justify-content: center;
}

.card-slot {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.card-slot--dealer {
  /* tamaño controlado por el wrapper */
}

.card-slot--player {
  cursor: pointer;
}

.card-slot--left {
  transform: rotate(-4deg) translateY(4px);
}
.card-slot--right {
  transform: rotate(4deg) translateY(4px);
}

.card-highlight {
  filter: drop-shadow(0 0 14px #ffd700) drop-shadow(0 0 25px rgba(255, 215, 0, 0.8));
  transform: translateY(-4px) scale(1.04) !important;
  z-index: 5;
}

/* ═══ 3D Bet Spot (Fichas 3D Clásicas + Etiqueta) ═══ */
.bet-spot {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: rgba(15, 6, 9, 0.88);
  border: 1.5px solid rgba(255, 215, 0, 0.45);
  border-radius: 999px;
  padding: 4px 12px 4px 6px;
  box-shadow:
    0 4px 14px rgba(0, 0, 0, 0.85),
    0 0 12px rgba(255, 215, 0, 0.2);
  margin-top: 6px;
  backdrop-filter: blur(6px);
  animation: popBet 0.22s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

@keyframes popBet {
  0% { transform: scale(0.85); opacity: 0; }
  100% { transform: scale(1); opacity: 1; }
}

.bet-tag {
  display: flex;
  flex-direction: column;
  line-height: 1.1;
  text-align: left;
}

.bet-tag-lbl {
  font-family: 'Press Start 2P', monospace;
  font-size: 0.5rem;
  font-weight: 700;
  text-transform: uppercase;
  color: #cfd8dc;
  letter-spacing: 0.04em;
}

.bet-tag-num {
  font-family: 'Press Start 2P', monospace;
  font-size: 0.78rem;
  font-weight: 700;
  color: #ffe600;
  text-shadow: 2px 2px 0 #000;
}

.action-pill {
  display: inline-flex;
  align-items: center;
  background: #111420;
  border: 2px solid #3b82f6;
  box-shadow: 2px 2px 0 #000;
  padding: 4px 10px;
  font-family: 'Press Start 2P', monospace;
  font-size: 0.55rem;
  color: #93c5fd;
  margin-top: 6px;
  text-transform: uppercase;
}

/* ═══ Center Community Board ═══ */
.streets-nav {
  display: flex;
  align-items: center;
  gap: 6px;
  font-family: 'Press Start 2P', monospace;
  font-size: 0.52rem;
  text-transform: uppercase;
}

.street-pill {
  color: rgba(255, 255, 255, 0.4);
  padding: 3px 6px;
  border-radius: 0;
  border: 1px solid transparent;
  transition: all 0.2s ease;
}

.street-pill--active {
  color: #ffe600;
  background: #2a1f00;
  border: 1px solid #ffe600;
  box-shadow: 0 0 8px rgba(255, 230, 0, 0.4);
}

.street-arrow {
  color: rgba(255, 255, 255, 0.3);
}

/* Pot Display */
.pot-display {
  display: flex;
  align-items: center;
  gap: 12px;
  background: #1a080c;
  border: 3px solid #ffe600;
  box-shadow: 0 4px 0 #000, 0 0 16px rgba(255, 230, 0, 0.3);
  padding: 6px 18px;
}

.pot-label {
  font-family: 'Press Start 2P', monospace;
  font-size: 0.55rem;
  color: #ffd54f;
  letter-spacing: 0.08em;
  font-weight: 700;
  line-height: 1;
}

.pot-amount {
  font-family: 'Press Start 2P', monospace;
  font-size: 0.95rem;
  font-weight: 700;
  color: #ffe600;
  text-shadow: 2px 2px 0 #000;
  line-height: 1;
}

.community-cards-row {
  display: flex;
  gap: 8px;
  align-items: center;
  justify-content: center;
}

.community-slot {
  width: 76px;
  height: 110px;
  border-radius: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
  position: relative;
}

.community-slot :deep(.playing-card-wrapper) {
  transform: scale(0.76);
  transform-origin: center center;
  margin: 0;
}

.card-slot--dealer {
  width: 76px;
  height: 110px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.card-slot--dealer :deep(.playing-card-wrapper) {
  transform: scale(0.76);
  transform-origin: center center;
  margin: 0;
}

.card-slot--player {
  width: 86px;
  height: 124px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.card-slot--player :deep(.playing-card-wrapper) {
  transform: scale(0.86);
  transform-origin: center center;
  margin: 0;
}

.community-slot--winning {
  filter: drop-shadow(0 0 12px #ffd700) drop-shadow(0 0 20px rgba(255, 215, 0, 0.7));
  transform: translateY(-4px) scale(0.84) !important;
}

.empty-card-placeholder {
  width: 100%;
  height: 100%;
  border: 2px dashed rgba(255, 215, 0, 0.4);
  border-radius: 0;
  background: rgba(0, 0, 0, 0.35);
  display: flex;
  align-items: center;
  justify-content: center;
}

.placeholder-label {
  font-family: 'Press Start 2P', monospace;
  font-size: 0.5rem;
  font-weight: 700;
  color: rgba(255, 215, 0, 0.45);
  letter-spacing: 0;
}

.player-hand-eval-wrap {
  margin-bottom: 6px;
}

/* ═══ Responsive para Móviles & Pantallas Compactas (Todo Visible) ═══ */
@media (max-width: 768px), (max-height: 800px) {
  .poker-table-rim {
    border-radius: 32px;
    padding: 6px;
  }
  .poker-table-felt {
    border-radius: 26px;
    min-height: auto;
    padding: 10px 6px 14px 6px;
  }
  .community-cards-row {
    gap: 4px;
  }
  .community-slot {
    width: 56px;
    height: 82px;
  }
  .community-slot :deep(.playing-card-wrapper) {
    transform: scale(0.56);
  }
  .card-slot--dealer {
    width: 56px;
    height: 82px;
  }
  .card-slot--dealer :deep(.playing-card-wrapper) {
    transform: scale(0.56);
  }
  .card-slot--player {
    width: 68px;
    height: 98px;
  }
  .card-slot--player :deep(.playing-card-wrapper) {
    transform: scale(0.68);
  }
  .dealer-avatar {
    width: 52px;
    height: 52px;
    border-radius: 8px;
  }
  .pot-display {
    padding: 4px 10px;
    gap: 6px;
  }
  .pot-amount {
    font-size: 0.78rem;
  }
  .table-action-line {
    margin: 8px auto 6px auto;
  }
  .action-line-text {
    font-size: 0.38rem;
    padding: 0 6px;
  }
}

@media (max-width: 380px) {
  .community-slot {
    width: 48px;
    height: 72px;
  }
  .community-slot :deep(.playing-card-wrapper) {
    transform: scale(0.48);
  }
  .card-slot--dealer {
    width: 48px;
    height: 72px;
  }
  .card-slot--dealer :deep(.playing-card-wrapper) {
    transform: scale(0.48);
  }
  .card-slot--player {
    width: 58px;
    height: 84px;
  }
  .card-slot--player :deep(.playing-card-wrapper) {
    transform: scale(0.58);
  }
  .placeholder-label {
    font-size: 0.38rem;
  }
}
</style>
