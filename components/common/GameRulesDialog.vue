<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  game: 'blackjack' | 'tragamonedas' | 'ruleta' | 'baccarat' | 'poker' | 'dados'
}

const props = defineProps<Props>()
const modelValue = defineModel<boolean>({ default: false })

const gameInfo = computed(() => {
  switch (props.game) {
    case 'blackjack':
      return {
        title: 'Reglas del Blackjack Royale',
        subtitle: 'El clásico juego de 21 contra el Dealer',
        icon: 'mdi-cards',
        color: '#43a047',
      }
    case 'tragamonedas':
      return {
        title: 'Reglas de Tragamonedas',
        subtitle: '3 máquinas: Fruit Classic, Golden Deluxe y Royal Jackpot',
        icon: 'mdi-slot-machine',
        color: '#ffb74d',
      }
    case 'ruleta':
      return {
        title: 'Reglas de la Ruleta Europea',
        subtitle: '37 casillas, apuestas interiores, exteriores y pagos de hasta 35:1',
        icon: 'mdi-circle-slice-6',
        color: '#ffd54f',
      }
    case 'baccarat':
      return {
        title: 'Reglas del Baccarat (Punto Banco)',
        subtitle: 'El juego favorito de los grandes apostadores: Jugador, Banco o Empate',
        icon: 'mdi-cards-diamond',
        color: '#4fc3f7',
      }
    case 'poker':
      return {
        title: 'Reglas de Texas Hold\'em Poker',
        subtitle: 'No Limit Heads-Up contra el Croupier de la Casa',
        icon: 'mdi-cards-playing-spade',
        color: '#ef5350',
      }
    case 'dados':
      return {
        title: 'Reglas de Dados (Craps Royale)',
        subtitle: 'Lanza los dados de casino, establece el Punto y gana en el paño',
        icon: 'mdi-dice-multiple',
        color: '#66bb6a',
      }
  }
})
</script>

<template>
  <v-dialog v-model="modelValue" max-width="640" scrollable>
    <v-card class="rules-dialog-card pa-4" rounded="xl">
      <!-- Encabezado con Icono y Título -->
      <v-card-title class="d-flex align-center justify-space-between pb-2">
        <div class="d-flex align-center ga-3">
          <div class="rules-icon-wrap" :style="{ '--icon-color': gameInfo.color }">
            <v-icon :color="gameInfo.color" size="28">{{ gameInfo.icon }}</v-icon>
          </div>
          <div>
            <h2 class="rules-title">{{ gameInfo.title }}</h2>
            <div class="rules-subtitle">{{ gameInfo.subtitle }}</div>
          </div>
        </div>
        <v-btn icon="mdi-close" variant="text" size="small" @click="modelValue = false" />
      </v-card-title>

      <v-divider class="my-2 border-opacity-25" />

      <!-- Contenido Específico de cada Juego -->
      <v-card-text class="rules-body pa-3">
        <!-- ═══ REGLAS DE BLACKJACK ═══ -->
        <div v-if="game === 'blackjack'" class="d-flex flex-column ga-3">
          <section class="rule-block">
            <div class="rule-heading d-flex align-center ga-2">
              <v-icon color="amber" size="18">mdi-target</v-icon>
              <span>Objetivo del Juego</span>
            </div>
            <p class="rule-text">
              Consigue una mano que sume más puntos que la del Dealer, <strong>sin pasarte de 21</strong>.
              Si tu puntuación supera 21, te pasas ("Bust") y pierdes inmediatamente la apuesta.
            </p>
          </section>

          <section class="rule-block">
            <div class="rule-heading d-flex align-center ga-2">
              <v-icon color="amber" size="18">mdi-numeric</v-icon>
              <span>Valores de las Cartas</span>
            </div>
            <ul class="rule-list">
              <li><strong>2 al 10</strong>: Valen su valor numérico facial.</li>
              <li><strong>Figuras (J, Q, K)</strong>: Valen <strong>10 puntos</strong> cada una.</li>
              <li><strong>As (A)</strong>: Vale <strong>11 u 1 punto</strong>, adaptándose automáticamente a tu mayor ventaja.</li>
            </ul>
          </section>

          <section class="rule-block">
            <div class="rule-heading d-flex align-center ga-2">
              <v-icon color="amber" size="18">mdi-gesture-tap</v-icon>
              <span>Acciones Disponibles</span>
            </div>
            <ul class="rule-list">
              <li><strong>Pedir (Hit)</strong>: Solicita una carta adicional para aumentar tu puntuación.</li>
              <li><strong>Plantarse (Stand)</strong>: Te quedas con tu puntuación actual y pasas el turno al Dealer.</li>
              <li><strong>Doblar (Double Down)</strong>: Duplica tu apuesta tras recibir las dos primeras cartas y recibes exactamente <strong>una sola carta</strong> adicional.</li>
            </ul>
          </section>

          <section class="rule-block">
            <div class="rule-heading d-flex align-center ga-2">
              <v-icon color="amber" size="18">mdi-cash-multiple</v-icon>
              <span>Pagos y Reglas de la Casa</span>
            </div>
            <ul class="rule-list">
              <li><strong>Blackjack Natural</strong> (As + carta de 10 con las 2 primeras): Paga <strong>3 a 2</strong> (1.5x ganancia neta).</li>
              <li><strong>Victoria Estándar</strong>: Paga <strong>1 a 1</strong>.</li>
              <li><strong>Empate (Push)</strong>: Si igualas el puntaje del Dealer, recuperas tu apuesta íntegra.</li>
              <li><strong>Regla del Dealer</strong>: El Dealer está obligado a pedir carta con 16 o menos y debe plantarse con 17 o más.</li>
            </ul>
          </section>
        </div>

        <!-- ═══ REGLAS DE TRAGAMONEDAS ═══ -->
        <div v-else-if="game === 'tragamonedas'" class="d-flex flex-column ga-3">
          <section class="rule-block">
            <div class="rule-heading d-flex align-center ga-2">
              <v-icon color="amber" size="18">mdi-target</v-icon>
              <span>Mecánica de Juego</span>
            </div>
            <p class="rule-text">
              Selecciona tu máquina de tragamonedas favorita y haz girar los 3 rodillos.
              El objetivo es alinear <strong>3 símbolos idénticos</strong> en la línea central de pago.
            </p>
          </section>

          <section class="rule-block">
            <div class="rule-heading d-flex align-center ga-2">
              <v-icon color="amber" size="18">mdi-layers-outline</v-icon>
              <span>Las 3 Máquinas y sus Niveles</span>
            </div>
            <ul class="rule-list">
              <li><strong>Fruit Classic (10 fichas)</strong>: Volatilidad baja. Alta probabilidad de ganar premios frecuentes. Ideal para mantener saldo.</li>
              <li><strong>Golden Deluxe (50 fichas)</strong>: Volatilidad media. Premios balanceados y multiplicadores atractivos.</li>
              <li><strong>Royal Jackpot (200 fichas)</strong>: Volatilidad alta. Menor probabilidad, pero con multiplicadores épicos y el Jackpot Real más grande del casino.</li>
            </ul>
          </section>

          <section class="rule-block">
            <div class="rule-heading d-flex align-center ga-2">
              <v-icon color="amber" size="18">mdi-star-circle</v-icon>
              <span>Símbolos y Premios</span>
            </div>
            <p class="rule-text">
              Los símbolos de menor a mayor valor son: <em>Cereza, Limón, Naranja, Ciruela, Uva, Sandía, Campana, Bar, Siete de la Suerte y Diamante Real (Jackpot)</em>.
              Consulta la tabla de pagos desplegable en cada máquina para ver los multiplicadores exactos.
            </p>
          </section>
        </div>

        <!-- ═══ REGLAS DE RULETA ═══ -->
        <div v-else-if="game === 'ruleta'" class="d-flex flex-column ga-3">
          <section class="rule-block">
            <div class="rule-heading d-flex align-center ga-2">
              <v-icon color="amber" size="18">mdi-target</v-icon>
              <span>Objetivo de la Ruleta Europea</span>
            </div>
            <p class="rule-text">
              Predice en cuál de las <strong>37 casillas</strong> (números del 0 al 36) se detendrá la bola de marfil tras girar en la rueda.
            </p>
          </section>

          <section class="rule-block">
            <div class="rule-heading d-flex align-center ga-2">
              <v-icon color="amber" size="18">mdi-numeric-1-box</v-icon>
              <span>Apuestas Interiores (Alto Pago)</span>
            </div>
            <ul class="rule-list">
              <li><strong>Pleno (Número individual 0-36)</strong>: Paga <strong>35 a 1</strong> (retorno total de 36 veces tu apuesta).</li>
            </ul>
          </section>

          <section class="rule-block">
            <div class="rule-heading d-flex align-center ga-2">
              <v-icon color="amber" size="18">mdi-view-column</v-icon>
              <span>Apuestas Exteriores (Mayor Probabilidad)</span>
            </div>
            <ul class="rule-list">
              <li><strong>Docenas (1ª, 2ª o 3ª 12)</strong>: Cubren 12 números y pagan <strong>2 a 1</strong>.</li>
              <li><strong>Columnas (Col 1, Col 2 o Col 3)</strong>: Cubren 12 números de la fila y pagan <strong>2 a 1</strong>.</li>
              <li><strong>Rojo o Negro</strong>: Paga <strong>1 a 1</strong> (cubre 18 números).</li>
              <li><strong>Par o Impar</strong>: Paga <strong>1 a 1</strong> (cubre 18 números).</li>
              <li><strong>Falta (1-18) o Pasa (19-36)</strong>: Paga <strong>1 a 1</strong>.</li>
            </ul>
          </section>

          <section class="rule-block">
            <div class="rule-heading d-flex align-center ga-2">
              <v-icon color="amber" size="18">mdi-alert-decagram</v-icon>
              <span>La Casilla del Cero (0 Verde)</span>
            </div>
            <p class="rule-text">
              El <strong>0 es verde</strong> y representa la ventaja de la casa europea (2.7%).
              Si sale 0, las apuestas exteriores (rojo, negro, par, impar, docenas, columnas) pierden; únicamente ganan los plenos apostados directamente al 0.
            </p>
          </section>
        </div>

        <!-- ═══ REGLAS DE BACCARAT ═══ -->
        <div v-else-if="game === 'baccarat'" class="d-flex flex-column ga-3">
          <section class="rule-block">
            <div class="rule-heading d-flex align-center ga-2">
              <v-icon color="amber" size="18">mdi-target</v-icon>
              <span>Objetivo del Baccarat (Punto Banco)</span>
            </div>
            <p class="rule-text">
              Apuesta a cuál de las dos manos sumará un valor <strong>más cercano a 9</strong>: el <strong>Jugador (Punto)</strong>, el <strong>Banco (Banco)</strong>, o si terminarán en <strong>Empate</strong>.
            </p>
          </section>

          <section class="rule-block">
            <div class="rule-heading d-flex align-center ga-2">
              <v-icon color="amber" size="18">mdi-calculator</v-icon>
              <span>Conteo de Puntos (Módulo 10)</span>
            </div>
            <ul class="rule-list">
              <li><strong>As (A)</strong>: Vale <strong>1 punto</strong>.</li>
              <li><strong>2 al 9</strong>: Valen su valor facial.</li>
              <li><strong>10, J, Q, K</strong>: Valen <strong>0 puntos</strong> (Baccarat).</li>
              <li><strong>Regla de las decenas</strong>: Se suman las cartas y solo cuenta el último dígito. Por ejemplo: 7 + 8 = 15 &rarr; Puntuación de <strong>5</strong>. Un 4 + 6 = 10 &rarr; Puntuación de <strong>0</strong>.</li>
            </ul>
          </section>

          <section class="rule-block">
            <div class="rule-heading d-flex align-center ga-2">
              <v-icon color="amber" size="18">mdi-crown</v-icon>
              <span>Los "Naturales" y Tercera Carta</span>
            </div>
            <ul class="rule-list">
              <li><strong>Natural (8 o 9)</strong>: Si el Jugador o el Banco obtienen un total de 8 o 9 con sus 2 primeras cartas, la ronda finaliza de inmediato.</li>
              <li><strong>Tercera Carta del Jugador</strong>: Si el total es <strong>0 a 5</strong>, el Jugador recibe automáticamente una 3ª carta; si es <strong>6 o 7</strong>, se planta.</li>
              <li><strong>Tercera Carta del Banco</strong>: Se determina automáticamente siguiendo el reglamento oficial de Punto Banco en función de la 3ª carta recibida por el Jugador.</li>
            </ul>
          </section>

          <section class="rule-block">
            <div class="rule-heading d-flex align-center ga-2">
              <v-icon color="amber" size="18">mdi-cash-multiple</v-icon>
              <span>Apuestas y Pagos</span>
            </div>
            <ul class="rule-list">
              <li><strong>Apuesta al Jugador</strong>: Paga <strong>1 a 1</strong>.</li>
              <li><strong>Apuesta al Banco</strong>: Paga <strong>0.95 a 1</strong> (1:1 con un 5% de comisión por tener la mejor ventaja matemática).</li>
              <li><strong>Apuesta al Empate</strong>: Paga <strong>8 a 1</strong>. Si hay empate y apostaste a Jugador o Banco, tu apuesta se reembolsa íntegra (Push).</li>
              <li><strong>Apuestas a Pareja (Jugador o Banco)</strong>: Pagan <strong>11 a 1</strong> si las 2 primeras cartas de esa mano forman un par del mismo valor.</li>
            </ul>
          </section>
        </div>

        <!-- ═══ REGLAS DE TEXAS HOLD'EM POKER ═══ -->
        <div v-else-if="game === 'poker'" class="d-flex flex-column ga-3">
          <section class="rule-block">
            <div class="rule-heading d-flex align-center ga-2">
              <v-icon color="amber" size="18">mdi-target</v-icon>
              <span>Objetivo del Texas Hold'em</span>
            </div>
            <p class="rule-text">
              Forma la <strong>mejor combinación posible de 5 cartas</strong> utilizando cualquiera de tus 2 cartas privadas (hole cards) y las 5 cartas comunitarias del centro de la mesa, o haz que el Croupier se retire (Fold) mediante apuestas y faroles.
            </p>
          </section>

          <section class="rule-block">
            <div class="rule-heading d-flex align-center ga-2">
              <v-icon color="amber" size="18">mdi-layers-outline</v-icon>
              <span>Estructura de las 4 Rondas (Calles)</span>
            </div>
            <ul class="rule-list">
              <li><strong>Pre-Flop</strong>: Se reparten 2 cartas boca abajo a cada uno. Se pagan las Ciegas (Small Blind y Big Blind). Ronda inicial de apuestas.</li>
              <li><strong>El Flop</strong>: Se descubren las <strong>3 primeras cartas comunitarias</strong> boca arriba en la mesa. Segunda ronda de apuestas.</li>
              <li><strong>El Turn</strong>: Se destapa la <strong>4ª carta comunitaria</strong>. Tercera ronda de apuestas.</li>
              <li><strong>El River</strong>: Se revela la <strong>5ª y última carta comunitaria</strong>. Ronda final de apuestas.</li>
              <li><strong>Showdown</strong>: Si ambos jugadores siguen activos, se muestran las cartas y el bote se lo lleva quien tenga la jugada de mayor rango.</li>
            </ul>
          </section>

          <section class="rule-block">
            <div class="rule-heading d-flex align-center ga-2">
              <v-icon color="amber" size="18">mdi-gesture-tap</v-icon>
              <span>Acciones Disponibles</span>
            </div>
            <ul class="rule-list">
              <li><strong>Pasar (Check)</strong>: Cedes el turno sin añadir fichas al bote (solo posible si nadie ha apostado antes en esa ronda).</li>
              <li><strong>Igualar (Call)</strong>: Igualas la apuesta más alta realizada por el rival para mantenerte en la mano.</li>
              <li><strong>Apostar / Subir (Bet / Raise)</strong>: Incrementas la apuesta exigida, obligando al rival a pagar más o retirarse.</li>
              <li><strong>Retirarse (Fold)</strong>: Abandonas la mano inmediatamente perdiendo las fichas apostadas hasta el momento.</li>
              <li><strong>All-In</strong>: Apuestas todas las fichas que te quedan en el centro de la mesa.</li>
            </ul>
          </section>

          <section class="rule-block">
            <div class="rule-heading d-flex align-center ga-2">
              <v-icon color="amber" size="18">mdi-trophy-variant</v-icon>
              <span>Jerarquía Oficial de Manos (De Mayor a Menor)</span>
            </div>
            <ul class="rule-list">
              <li><strong>1. Escalera Real</strong>: A, K, Q, J, 10 del mismo palo (Invencible).</li>
              <li><strong>2. Escalera de Color</strong>: 5 cartas consecutivas del mismo palo (ej: 9-8-7-6-5 de picas).</li>
              <li><strong>3. Póker</strong>: 4 cartas con el mismo valor (ej: cuatro Ases).</li>
              <li><strong>4. Full House</strong>: Trío + Pareja combinados (ej: tres Reyes y dos Dieces).</li>
              <li><strong>5. Color (Flush)</strong>: 5 cartas cualesquiera del mismo palo.</li>
              <li><strong>6. Escalera (Straight)</strong>: 5 cartas en orden consecutivo de palos mixtos (ej: 5-6-7-8-9).</li>
              <li><strong>7. Trío</strong>: 3 cartas del mismo valor.</li>
              <li><strong>8. Doble Pareja</strong>: Dos parejas diferentes (ej: dos Damas y dos Sietes).</li>
              <li><strong>9. Pareja</strong>: Dos cartas del mismo valor.</li>
              <li><strong>10. Carta Alta</strong>: Sin ninguna combinación; desempata la carta más alta (Kicker).</li>
            </ul>
          </section>
        </div>

        <!-- ═══════════════════ DADOS (CRAPS) ═══════════════════ -->
        <div v-else-if="props.game === 'dados'" class="d-flex flex-column ga-3">
          <!-- Objetivo General -->
          <section class="rule-block">
            <div class="rule-heading d-flex align-center ga-2">
              <v-icon color="green-lighten-1" size="18">mdi-bullseye-arrow</v-icon>
              <span>Mecánica de Craps: Tirada de Salida y Fase de Punto</span>
            </div>
            <p class="rule-text">
              Craps es el juego más electrizante del casino. Dos dados de 6 caras se lanzan en cada tirada. El juego opera en dos fases dinámicas gobernadas por el disco (Puck):
            </p>
            <ul class="rule-list mt-2">
              <li><strong>1. Tirada de Salida (Come Out Roll - Disco en OFF)</strong>: Es la tirada inicial de la ronda.</li>
              <li><strong>2. Natural (7 u 11)</strong>: ¡La Línea de Pase (Pass Line) gana de inmediato (1:1)! Don't Pass pierde.</li>
              <li><strong>3. Craps (2, 3 o 12)</strong>: ¡Pass Line pierde de inmediato! Don't Pass gana con 2 y 3 (1:1), y empata (Push) con el 12 (Bar 12).</li>
              <li><strong>4. Establecer el Punto (4, 5, 6, 8, 9 o 10)</strong>: Ese número se convierte en el <strong>PUNTO</strong>. El disco pasa a <strong>ON</strong> y se coloca sobre dicho número.</li>
              <li><strong>5. Fase de Punto (Disco en ON)</strong>: El tirador sigue lanzando. Si repite el número del Punto antes de que salga un 7, ¡Pass Line GANA! Si sale un 7 antes del Punto ("Seven Out"), ¡Pass Line pierde y Don't Pass gana!</li>
            </ul>
          </section>

          <!-- Tipos de Apuestas -->
          <section class="rule-block">
            <div class="rule-heading d-flex align-center ga-2">
              <v-icon color="amber" size="18">mdi-poker-chip</v-icon>
              <span>Apuestas Principales y Pagos</span>
            </div>
            <ul class="rule-list">
              <li><strong>Línea de Pase (Pass Line - 1:1)</strong>: Se coloca en la salida. Gana con 7 u 11, pierde con Craps (2, 3, 12). Con punto establecido, gana si el punto se repite antes del 7.</li>
              <li><strong>Barra de No Pase (Don't Pass - 1:1)</strong>: Apuesta inversa. Gana con 2 o 3, push con 12. En fase de punto, gana si sale el 7 antes que el punto.</li>
              <li><strong>El Campo (Field - 1 Tirada)</strong>: Gana si la siguiente tirada es 2, 3, 4, 9, 10, 11 o 12. El <strong>2 paga Doble (2:1)</strong>, el <strong>12 paga Triple (3:1)</strong> y los demás pagan 1:1. Pierde con 5, 6, 7 y 8.</li>
              <li><strong>Apuestas de Sitio (Place Bets)</strong>: Apuesta a números específicos (4, 5, 6, 8, 9, 10) a que saldrán antes de un 7. 4 y 10 pagan 9:5 (1.8x), 5 y 9 pagan 7:5 (1.4x), 6 y 8 pagan 7:6 (1.17x).</li>
              <li><strong>Bajo 7 / Alto 7 (1:1)</strong>: Gana si la suma es del 2 al 6 (Bajo) o del 8 al 12 (Alto). Pierde si sale 7.</li>
            </ul>
          </section>

          <!-- Proposiciones y Hardways -->
          <section class="rule-block">
            <div class="rule-heading d-flex align-center ga-2">
              <v-icon color="amber" size="18">mdi-fire</v-icon>
              <span>Hardways y Proposiciones de Alto Pago</span>
            </div>
            <ul class="rule-list">
              <li><strong>Snake Eyes (Ojos de Serpiente - 1 y 1)</strong>: ¡Paga <strong>30 a 1</strong>! Apuesta de 1 tirada.</li>
              <li><strong>Boxcars (Vagones - 6 y 6)</strong>: ¡Paga <strong>30 a 1</strong>! Apuesta de 1 tirada.</li>
              <li><strong>Ace-Deuce (3) & Yo-Eleven (11)</strong>: Pagan <strong>15 a 1</strong> cada una.</li>
              <li><strong>Any Craps (2, 3 o 12)</strong>: Paga <strong>7 a 1</strong> si sale cualquier craps en el tiro.</li>
              <li><strong>Any 7 (Cualquier 7)</strong>: Paga <strong>4 a 1</strong> si la tirada suma 7.</li>
              <li><strong>Hardways (Pares Difíciles: 2-2, 3-3, 4-4, 5-5)</strong>: Ganan si salen dobles idénticos antes de salir fácil o antes de un 7. Hard 6 y 8 pagan 9:1; Hard 4 y 10 pagan 7:1.</li>
            </ul>
          </section>
        </div>
      </v-card-text>

      <v-divider class="my-2 border-opacity-25" />

      <!-- Botón de Cierre -->
      <v-card-actions class="d-flex justify-end pt-1">
        <v-btn
          color="amber-darken-2"
          variant="elevated"
          rounded="pill"
          size="small"
          class="px-6"
          @click="modelValue = false"
        >
          ¡Entendido!
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<style scoped>
.rules-dialog-card {
  background: #0c1017 !important;
  border: 3px solid #ffd54f !important;
  border-radius: 0 !important;
  box-shadow: 6px 6px 0 #000;
  color: #fff;
}

.rules-icon-wrap {
  width: 40px;
  height: 40px;
  border-radius: 0;
  background: #000;
  border: 2px solid var(--icon-color);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 2px 2px 0 #000;
}

.rules-title {
  font-family: 'Press Start 2P', monospace;
  font-size: 0.72rem;
  font-weight: 700;
  color: #ffd54f;
  line-height: 1.3;
}

.rules-subtitle {
  font-family: 'Press Start 2P', monospace;
  font-size: 0.45rem;
  color: rgba(255, 255, 255, 0.6);
  margin-top: 3px;
}

.rules-body {
  max-height: 60vh;
}

.rule-block {
  background: #111827;
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 0;
  padding: 10px 12px;
}

.rule-heading {
  font-family: 'Press Start 2P', monospace;
  font-size: 0.55rem;
  font-weight: 700;
  color: #ffd54f;
  margin-bottom: 6px;
}

.rule-text {
  font-family: 'Press Start 2P', monospace;
  font-size: 0.48rem;
  line-height: 1.65;
  color: rgba(255, 255, 255, 0.85);
  margin: 0;
}

.rule-list {
  padding-left: 16px;
  margin: 0;
  font-family: 'Press Start 2P', monospace;
  font-size: 0.46rem;
  line-height: 1.65;
  color: rgba(255, 255, 255, 0.85);
}

.rule-list li {
  margin-bottom: 6px;
}

.rule-list li:last-child {
  margin-bottom: 0;
}
</style>
