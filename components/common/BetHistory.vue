<script setup lang="ts">
export interface BetEntry {
  id: number | string
  cantidad: number
}

defineProps<{ bets: BetEntry[] }>()

function clasificarMonto(cantidad: number): string {
  if (cantidad <= 100) return 'Pocas monedas 🪙'
  if (cantidad <= 500) return 'Monto mediano 💵'
  if (cantidad <= 1000) return 'Monto grande 💰'
  return 'Monto enorme 💎'
}
</script>

<template>
  <section class="casino-board">
    <h2>Historial de Apuestas</h2>
    <p v-if="!bets.length" class="vacio">Aún no hay apuestas.</p>
    <ul v-else>
      <li v-for="apuesta in bets" :key="apuesta.id">
        <span class="monto">${{ apuesta.cantidad.toLocaleString('en-US') }}</span>
        <span class="categoria"> - {{ clasificarMonto(apuesta.cantidad) }}</span>
      </li>
    </ul>
  </section>
</template>

<style scoped>
.casino-board {
  background-color: #1a1a1a;
  color: #fff;
  padding: 20px;
  border: 4px solid #000;
  box-shadow: 6px 6px 0 rgba(0, 0, 0, 0.6);
  font-family: 'Press Start 2P', monospace;
  font-size: 10px;
}
h2 {
  font-size: 12px;
  color: #ffd54f;
  margin: 0 0 14px;
}
ul {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.vacio {
  color: #888;
}
.categoria {
  color: #f1c40f;
  font-weight: bold;
}
</style>
