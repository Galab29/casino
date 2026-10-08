<script setup lang="ts">
interface Props {
  dealerScore: number
  playerScore: number
  chips: number
  currentBet: number
  statusMessage: string
  dealerWins?: number
  playerWins?: number
  draws?: number
  winRate?: number
  streakText?: string
}

withDefaults(defineProps<Props>(), {
  dealerWins: 0,
  playerWins: 0,
  draws: 0,
  winRate: 0,
  streakText: '',
})

const emit = defineEmits<{
  (e: 'reset-stats'): void
}>()
</script>

<template>
  <v-card class="scoreboard pa-4 mb-4" color="rgba(0,0,0,0.55)" rounded="xl" flat>
    <!-- Top: Historic Record Pill Bar -->
    <div class="d-flex align-center justify-space-between mb-3 px-1">
      <div class="d-flex align-center ga-2 flex-wrap">
        <span class="history-title">
          <v-icon size="15" color="amber" class="mr-1">mdi-scoreboard-outline</v-icon>
          HISTORIAL:
        </span>
        <span class="stat-badge stat-badge--player">
          🏆 Jugador: <strong>{{ playerWins }}</strong>
        </span>
        <span class="stat-badge stat-badge--dealer">
          🎩 Dealer: <strong>{{ dealerWins }}</strong>
        </span>
        <span class="stat-badge stat-badge--draw">
          🤝 Empates: <strong>{{ draws }}</strong>
        </span>
        <span class="stat-badge stat-badge--rate">
          📈 Victorias: <strong>{{ winRate }}%</strong>
        </span>
      </div>

      <v-tooltip text="Reiniciar estadísticas históricas" location="top">
        <template #activator="{ props: tooltipProps }">
          <v-btn
            v-bind="tooltipProps"
            icon="mdi-restore"
            size="x-small"
            variant="text"
            color="grey-lighten-1"
            class="reset-stats-btn"
            @click="emit('reset-stats')"
          />
        </template>
      </v-tooltip>
    </div>

    <!-- Streak indicator -->
    <div v-if="streakText" class="streak-bar mb-3 text-center">
      <span class="streak-text">{{ streakText }}</span>
    </div>

    <v-divider class="mb-3" color="rgba(255,255,255,0.1)" />

    <!-- Scores Row -->
    <v-row align="center" justify="space-around" no-gutters>
      <!-- Dealer score -->
      <v-col cols="auto" class="text-center">
        <div class="score-label">DEALER</div>
        <v-avatar color="red-darken-4" size="56" class="score-avatar elevation-4">
          <span class="text-h5 font-weight-bold score-number">{{ dealerScore }}</span>
        </v-avatar>
      </v-col>

      <!-- Status / Message -->
      <v-col cols="auto" class="text-center px-4" style="max-width: 280px">
        <v-chip
          v-if="statusMessage"
          color="amber-darken-2"
          text-color="white"
          variant="elevated"
          size="large"
          class="status-chip"
        >
          {{ statusMessage }}
        </v-chip>
      </v-col>

      <!-- Player score -->
      <v-col cols="auto" class="text-center">
        <div class="score-label score-label--player">JUGADOR</div>
        <v-avatar color="teal-darken-2" size="56" class="score-avatar elevation-4">
          <span class="text-h5 font-weight-bold score-number">{{ playerScore }}</span>
        </v-avatar>
      </v-col>
    </v-row>

    <!-- Chips & bet info bar -->
    <v-divider class="my-3" color="rgba(255,255,255,0.15)" />

    <v-row justify="center" no-gutters class="ga-6">
      <v-col cols="auto" class="d-flex align-center ga-1">
        <v-icon color="amber" size="20" class="chip-icon">mdi-poker-chip</v-icon>
        <span class="info-value" :class="{ 'chips-low': chips < 100 }">{{ chips }}</span>
        <span class="info-label">fichas</span>
      </v-col>
      <v-col cols="auto" class="d-flex align-center ga-1">
        <v-icon color="green-lighten-2" size="20">mdi-cash-multiple</v-icon>
        <span class="info-value">{{ currentBet }}</span>
        <span class="info-label">apuesta</span>
      </v-col>
    </v-row>
  </v-card>
</template>


<style scoped>
.scoreboard {
  backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.08);
}

.score-label {
  font-family: 'Cinzel', serif;
  font-size: 11px;
  letter-spacing: 3px;
  color: rgba(255, 255, 255, 0.6);
  margin-bottom: 6px;
}

.score-label--player {
  color: rgba(128, 203, 196, 0.85);
}

.score-avatar {
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.score-avatar:hover {
  transform: scale(1.15);
  box-shadow: 0 0 20px rgba(255,255,255,0.15);
}

.score-number {
  font-family: 'Cinzel', serif;
}

.status-chip {
  font-weight: 700;
  letter-spacing: 0.5px;
  animation: pulse-glow 2s ease-in-out infinite;
}

@keyframes pulse-glow {
  0%, 100% { box-shadow: 0 0 8px rgba(255, 193, 7, 0.4); }
  50% { box-shadow: 0 0 20px rgba(255, 193, 7, 0.7); }
}

.info-value {
  font-family: 'Cinzel', serif;
  font-weight: 700;
  font-size: 16px;
  color: #fff;
  transition: color 0.3s ease;
}

.chips-low {
  color: #ef5350 !important;
  animation: blink-red 1s ease-in-out infinite;
}

@keyframes blink-red {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

.info-label {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.5);
  text-transform: uppercase;
  letter-spacing: 1px;
}

.chip-icon {
  animation: chip-wobble 3s ease-in-out infinite;
}

@keyframes chip-wobble {
  0%, 100% { transform: rotate(0deg); }
  25% { transform: rotate(-5deg); }
  75% { transform: rotate(5deg); }
}

/* ─── Streak Bar ─── */
.streak-bar {
  background: rgba(255,255,255,0.04);
  border-radius: 8px;
  padding: 4px 12px;
  border: 1px solid rgba(255,255,255,0.06);
}

.streak-text {
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 1px;
  color: #ffe082;
}

/* ─── History & Stat Badges ─── */
.history-title {
  font-family: 'Cinzel', serif;
  font-size: 11px;
  letter-spacing: 2px;
  font-weight: 700;
  color: #ffd54f;
  display: flex;
  align-items: center;
}

.stat-badge {
  font-size: 11px;
  padding: 2px 8px;
  border-radius: 6px;
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: #e0e0e0;
}

.stat-badge--player {
  border-color: rgba(38, 166, 154, 0.4);
  background: rgba(38, 166, 154, 0.12);
  color: #80cbc4;
}

.stat-badge--dealer {
  border-color: rgba(239, 83, 80, 0.4);
  background: rgba(239, 83, 80, 0.12);
  color: #ef9a9a;
}

.stat-badge--draw {
  border-color: rgba(189, 189, 189, 0.3);
  background: rgba(189, 189, 189, 0.1);
  color: #cfd8dc;
}

.stat-badge--rate {
  border-color: rgba(255, 193, 7, 0.4);
  background: rgba(255, 193, 7, 0.12);
  color: #ffe082;
}

.reset-stats-btn {
  opacity: 0.6;
  transition: opacity 0.2s ease, transform 0.3s ease;
}

.reset-stats-btn:hover {
  opacity: 1;
  transform: rotate(-180deg);
}
</style>
