# PLAN DE IMPLEMENTACIÓN — "Royal Casino Tycoon" (juego incremental)

> **Para el agente (Antigravity):** este documento es tu especificación. Trabaja **fase por fase**, en orden. Al terminar cada fase: ejecuta `npm run build`, verifica los criterios de aceptación, haz un commit (`feat(idle): fase N – …`) y **detente a pedirme aprobación** antes de pasar a la siguiente. No avances varias fases de golpe. Todo el texto de la interfaz debe estar en **español**.

---

## 0. Contexto del proyecto existente (léelo antes de tocar código)

**Stack:** Nuxt 3 (`ssr: false`), Vue 3 Composition API (`<script setup lang="ts">`), Pinia (+ `pinia-plugin-persistedstate` ya instalado), Vuetify 3 (auto-import), `@mdi/font`.

**Estructura relevante**

```
pages/        index.vue (lobby), blackjack.vue, poker.vue, ruleta.vue, tragamonedas.vue, baccarat.vue
stores/       blackjack.ts, poker.ts, ruleta.ts, slots.ts, baccarat.ts, dados.ts
components/   blackjack/ poker/ ruleta/ tragamonedas/ baccarat/ common/
composables/  useSoundEngine.ts, useConfetti.ts
constants/    slotMachines.ts, ruleta.ts, poker.ts, baccarat.ts, dados.ts
types/        un archivo por juego
plugins/      pinia.ts, vuetify.ts
scratch/      sim_poker.mjs, test_poker.mjs   (scripts de simulación en Node: patrón a imitar)
```

**Hechos críticos del código actual**

1. **La billetera vive dentro del store de Blackjack.** Todos los juegos (slots, dados, etc.) leen/escriben fichas con `useBlackjackStore().player.chips`. Persistencia manual en `localStorage` con las claves `blackjack_player_chips_v1` y `blackjack_game_stats_v1`.
2. El store de blackjack tiene métodos de billetera (`setChips`, uno que suma, uno que resta, `refillChips`) alrededor de las líneas ~183-199, y un `watch` que auto-guarda las fichas (~L167-175). **Verifica los nombres exactos antes de usarlos.**
3. `saveStats()` escribe **dos** claves en localStorage cada vez que se llama. **No debe llamarse en cada tick del juego idle** (ver Fase 1).
4. Las fichas son **enteros** (`Math.floor`). La producción pasiva es fraccionaria, así que hay que acumular el residuo aparte.
5. Hay rescates de bancarrota que ponen `chips = 1000` cuando llegan a 0 (blackjack ~L291 y ~L532, y `refillChips`). Con un juego incremental esto puede romper la progresión: ver Fase 3.
6. `pages/index.vue` instancia stores con `useBlackjackStore(nuxtApp.$pinia)` porque el plugin `pinia.ts` crea Pinia a mano. Cualquier código que corra **fuera de `setup`** (p. ej. el bucle del juego) debe obtener Pinia vía `useNuxtApp().$pinia`.
7. **Dados** (`stores/dados.ts`, `constants/dados.ts`, `types/dados.ts`) está a medias: no existe `pages/dados.vue` y en el lobby aparece como `available: false`. Es trabajo en curso del usuario.
8. El zip incluye artefactos de build (`.nuxt/`, `.output/`). **No edites ni versiones esas carpetas**; confirma que están en `.gitignore`.

---

## 1. Visión del juego

Convertir el casino en un **tycoon incremental**: el jugador empieza con una tragamonedas vieja y construye un imperio de casinos.

- **Moneda única:** las fichas (la billetera existente).
- **Bucle principal (idle):** comprar generadores → producir fichas/segundo → comprar mejoras → escalar.
- **Bucle activo (lo que ya existe):** los 5 juegos del casino se **conservan jugables** como minijuegos de alto riesgo/recompensa que dan un **bonus temporal ("Adrenalina")** a la producción pasiva. Así el trabajo ya hecho no se tira, sino que se vuelve la capa "activa" del juego.
- **Metajuego:** prestigio ("Licencia de Casino") que reinicia la partida a cambio de **Estrellas** permanentes.

**Principio rector:** *no se modifica la matemática (RNG, probabilidades, pagos) de ningún juego existente.* El juego idle se monta encima.

---

## 2. Arquitectura propuesta

**Archivos nuevos** (mismo estilo de carpetas que ya existe):

```
types/idle.ts                 interfaces: Generator, Upgrade, Achievement, IdleState, PrestigeUpgrade
constants/idle.ts             tablas de datos (generadores, mejoras, logros, prestigio) – 100 % data-driven
utils/formatNumber.ts         1.23K / M / B / T / Qa … + formato de tiempo (1h 23m)
stores/idle.ts                estado y reglas del juego incremental
composables/useIdleLoop.ts    bucle de tiempo (tick), offline y guardado
composables/useCasinoBridge.ts  puente: los juegos reportan rondas al sistema idle
components/idle/              GeneratorRow, UpgradeCard, PrestigePanel, AchievementGrid,
                              ClickButton, StatsPanel, OfflineDialog, SettingsDialog, ProductionBar
pages/index.vue               NUEVO hub tycoon (la pantalla principal)
pages/casino.vue              el lobby actual movido aquí (sin cambiar su diseño)
scratch/sim_idle.mjs          simulador de balance (Node, sin dependencias)
```

**Persistencia del estado idle:** el store `idle` usa `persist` de `pinia-plugin-persistedstate` con clave **`casino_idle_v1`** e incluye `version` y un `migrate()` para cambios futuros. **No renombrar ni borrar** las claves existentes de los juegos.

**Navegación:** `/` = hub tycoon, `/casino` = piso de juegos (lobby actual). Revisar todos los botones "volver" de `pages/*.vue` (`to="/"`) y decidir si deben apuntar a `/casino`. Agregar una barra de navegación común (Vuetify `v-bottom-navigation` en móvil / `v-tabs` en escritorio): **Gerencia · Casino · Mejoras · Prestigio · Logros**.

---

## 3. Diseño de la economía (valores iniciales, deben calibrarse con el simulador)

### 3.1 Generadores (costo × 1.15^poseídos)

| # | Generador | Costo base | Fichas/s base |
|---|-----------|-----------:|--------------:|
| 1 | Tragamonedas Clásica | 15 | 0.1 |
| 2 | Mesa de Blackjack | 100 | 1 |
| 3 | Mesa de Baccarat | 1,100 | 8 |
| 4 | Ruleta Europea | 12,000 | 47 |
| 5 | Sala de Póker | 130,000 | 260 |
| 6 | Mesa de Dados | 1,400,000 | 1,400 |
| 7 | Salón VIP | 20,000,000 | 7,800 |
| 8 | Torre Royal | 330,000,000 | 44,000 |

- Botones de compra **x1 / x10 / x100 / Máx**; mostrar costo total y fichas/s que aportaría.
- Un generador se **revela** cuando el jugador tiene ≥ 50 % de su costo (los siguientes aparecen en silueta "???").

### 3.2 Fórmulas

```
produccionGenerador(i) = base_i × poseídos_i × multGenerador_i × multHitos_i
cps = Σ produccionGenerador(i) × multGlobal × (1 + bonoEstrellas) × (1 + adrenalina)
multGlobal      = Π (mejoras globales) × (1 + 0.01 × logrosDesbloqueados)
bonoEstrellas   = 0.02 × estrellas
valorClick      = (1 + clickPlano) × clickMult × (1 + 0.01 × %cps_por_click)
```

- **Hitos automáticos:** al llegar a 10 / 25 / 50 / 100 / 200 poseídos de un generador, ese generador ×2 (sin costo, solo se muestra la barra de progreso al siguiente hito).
- **Click ("Propina del Crupier"):** botón grande en el hub, +1 ficha base, con animación flotante `+N`.

### 3.3 Mejoras (data-driven en `constants/idle.ts`)

Interfaz sugerida:

```ts
interface Upgrade {
  id: string; name: string; description: string; cost: number
  requires?: { generator?: string; owned?: number; lifetimeChips?: number; upgrade?: string }
  effect:
    | { type: 'generatorMult'; target: string; value: number }
    | { type: 'globalMult'; value: number }
    | { type: 'clickMult'; value: number }
    | { type: 'clickFlat'; value: number }
    | { type: 'clickCpsPercent'; value: number }
    | { type: 'adrenalineDuration'; value: number }
    | { type: 'costDiscount'; value: number }
}
```

Crear ~30-40 mejoras: 3-4 por generador (×2, ×2, ×3…), 6 de click, 6 globales, 3 de sinergia con los juegos (ver 3.4). Costos ≈ 10× el costo base del generador para la primera, y escalando.

### 3.4 Puente con los juegos del casino ("Adrenalina")

Crear `composables/useCasinoBridge.ts` con una función `reportRound({ game, bet, payout, tag? })` que cada juego llama **una vez al resolver una ronda** (sin tocar su RNG ni sus pagos). Regla:

| Resultado | Bonus a la producción | Duración |
|-----------|----------------------:|---------:|
| Perder | +10 % | 15 s |
| Ganar | +25 % | 30 s |
| Gran premio (blackjack natural, pleno en ruleta, jackpot en slots, escalera real…) | +50 % | 60 s |

- Los bonos **no se acumulan**: se toma el mayor y se refresca la duración (opcionalmente tope ×2 con mejoras).
- Mostrar un indicador "⚡ Adrenalina +25 % (24 s)" en el hub y en la cabecera de cada juego.
- **Desbloqueos por juego:** el generador de cada juego se desbloquea al jugar al menos 1 ronda en ese juego **o** al llegar a cierto capital (lo que ocurra primero). *(Esto es opcional; confirmar conmigo antes de implementarlo.)*
- Puntos de enganche: ubicar en cada store (`stores/blackjack.ts`, `poker.ts`, `ruleta.ts`, `slots.ts`, `baccarat.ts`) la función donde se pagan los resultados y agregar **una sola línea** que llame a `reportRound`.

### 3.5 Prestigio — "Licencia de Casino"

- Disponible cuando `estrellasPendientes ≥ 1`.
- `estrellasPendientes = floor( sqrt( fichasGanadasEnEstaRun / 1e7 ) )`
- Al prestigiar: se **reinician** fichas (vuelven al capital inicial), generadores, mejoras normales y adrenalina. Se **conservan** estrellas, mejoras de prestigio, logros, estadísticas históricas y todas las estadísticas de los juegos.
- Cada estrella: **+2 % a toda la producción**.
- Confirmación en dos pasos con vista previa ("Ganarás N estrellas → +X % permanente").
- **Tienda de prestigio** (se compra con estrellas):

| Mejora | Niveles | Efecto por nivel |
|--------|--------:|------------------|
| Fondo de Inversión | 5 | +500 fichas iniciales tras prestigiar |
| Sueño Ligero | 5 | +2 h al tope de progreso offline |
| Gerente Automático | 1 | compra automáticamente el generador más barato cada 5 s |
| Adrenalina Duradera | 3 | +50 % duración de la adrenalina |
| Negociador | 5 | −2 % costo de todos los generadores |

### 3.6 Logros

~20 logros (`constants/idle.ts`), cada uno da +1 % global. Ejemplos: primera compra, 100 clics, 1 M fichas, 25 mesas de blackjack, primer prestigio, ganar un jackpot, 21 natural, pleno en ruleta, 50 rondas jugadas en total, etc. Varios deben **leerse de las estadísticas existentes** de los stores de juego (no duplicar contadores).

---

## 4. Fases de implementación

### Fase 0 — Línea base (no modificar lógica)
- `npm install`, `npm run dev`, `npm run build`. Anotar errores/advertencias previos (en especial si el trabajo en curso de Dados rompe algo).
- Confirmar `.gitignore` (`.nuxt`, `.output`, `node_modules`). Si no hay repositorio git: `git init` y commit "baseline".
- Crear rama `feat/idle`.
- **Aceptación:** el proyecto compila y los 5 juegos funcionan exactamente igual que antes.

### Fase 1 — Núcleo de economía (sin UI nueva)
1. `types/idle.ts`, `constants/idle.ts` (generadores + mejoras + logros + prestigio, solo datos), `utils/formatNumber.ts`.
2. `stores/idle.ts`: estado (`generators` poseídos, `upgrades` comprados, `lifetimeChips`, `runChips`, `stars`, `prestigeUpgrades`, `adrenaline`, `clicks`, `lastSavedAt`, `fraction`, `version`) + getters (`cps`, `clickValue`, costos, `canAfford`) + acciones (`buyGenerator(id, qty)`, `buyUpgrade`, `click`, `tick(dt)`).
3. La billetera sigue siendo la de `useBlackjackStore`. Agregar ahí un método pequeño **`creditPassive(amount)`** que sume fichas **sin llamar a `saveStats()`** (el `watch` existente ya persiste las fichas).
4. `composables/useIdleLoop.ts`: bucle con `setInterval` de 100 ms basado en **delta de `Date.now()`** (no en contar ticks, para tolerar pestañas en segundo plano). Acumula en `fraction`, y **cada 250 ms** vuelca a la billetera solo la parte entera. Se inicia **una sola vez** (en `app.vue` con `onMounted`, o plugin `.client.ts`) para que la producción siga corriendo mientras el jugador está en cualquier juego.
5. Guardado del estado idle: autoguardado cada 10 s, al cambiar de pestaña (`visibilitychange`) y en `beforeunload`.
6. `scratch/sim_idle.mjs`: simulador que importa las mismas tablas y reproduce una estrategia "compra siempre lo más rentable" para validar tiempos (ver Fase 7).
- **Aceptación:** con un botón temporal de depuración se compra un generador y las fichas del casino suben solas; el valor persiste al recargar; `localStorage` no se escribe más de ~4 veces/seg.

### Fase 2 — Hub tycoon (`pages/index.vue`)
1. Mover el lobby actual a `pages/casino.vue` (idéntico) y actualizar los enlaces de regreso.
2. Nuevo hub: cabecera con **fichas** y **fichas/s**, botón grande de click, lista de generadores (con x1/x10/x100/Máx), pestaña de mejoras (las disponibles primero, tarjetas con costo y efecto), y barra de adrenalina.
3. Diseño coherente con el lobby actual (oscuro, dorado/ámbar, gradientes por juego). Reutilizar el icono y color de cada juego para su generador.
4. Los números grandes siempre pasan por `formatNumber`.
5. Responsive: móvil primero (una columna, navegación inferior).
- **Aceptación:** se puede jugar el ciclo idle completo hasta comprar los 8 generadores sin errores de consola.

### Fase 3 — Integración con los juegos
1. Implementar `useCasinoBridge.reportRound` y engancharlo en los 5 juegos (una línea cada uno).
2. Indicador de adrenalina en cada página de juego.
3. **Rescates de bancarrota:** revisar los `chips = 1000` automáticos y `refillChips`. Regla: el rescate no debe superar **60 s de producción** (`max(1000, cps × 60)`), y el botón "+1,000 fichas gratis" del lobby ya no debe dar ventaja sobre la progresión (sustituirlo o limitarlo).
4. Apuestas máximas en los juegos: confirmar que siguen funcionando con saldos grandes (formato de números, inputs, chips de apuesta).
- **Aceptación:** jugar una ronda en cada juego activa la adrenalina correcta; ninguna probabilidad ni pago cambió (comparar con `scratch/sim_poker.mjs` y revisión de diff: no debe haber cambios en funciones de RNG/pagos).

### Fase 4 — Prestigio
- Panel de prestigio con vista previa, confirmación en dos pasos, tienda de estrellas, `useConfetti` al prestigiar.
- Función de reinicio **atómica** (todo o nada) y probada: tras prestigiar, las claves de estadísticas de los juegos siguen intactas.
- **Aceptación:** primer prestigio posible en el rango objetivo (ver Fase 7); tras prestigiar la producción inicial es visiblemente mayor.

### Fase 5 — Offline, guardado y ajustes
1. Al cargar: `dt = now − lastSavedAt` (limitar a ≥ 0 por cambios de reloj) con tope base de **4 h** (+2 h por nivel de "Sueño Ligero") y eficiencia del 50 %.
2. `OfflineDialog`: "Mientras no estabas ganaste X fichas (Y tiempo)".
3. Ajustes: **exportar/importar guardado** (JSON en base64), reinicio total con doble confirmación, interruptor de sonido (reutilizar `useSoundEngine`).
- **Aceptación:** cerrar la pestaña, esperar, reabrir → ganancias offline correctas y con tope.

### Fase 6 — Logros, estadísticas y pulido
- Cuadrícula de logros, panel de estadísticas (tiempo jugado, clics, fichas históricas, estrellas, ganancias de juegos), números flotantes, sonidos de compra/prestigio con `useSoundEngine`, animaciones de generador comprado.

### Fase 7 — Balance y QA
Ejecutar `node scratch/sim_idle.mjs` y ajustar `constants/idle.ts` hasta cumplir estos **tiempos objetivo** (jugador que compra de forma eficiente):

| Hito | Objetivo |
|------|----------|
| 1er generador | < 10 s |
| Mesa de Blackjack | ~1 min |
| Ruleta Europea | ~10-15 min |
| 1ª estrella disponible (≈ 10 M fichas en la run) | 60-90 min |
| 2ª run hasta la 1ª estrella | −30 % respecto a la 1ª |
| Torre Royal | ~3-5 h de la primera run |

Lista de pruebas manuales: compra x1/x10/x100/Máx · progreso offline · prestigio · exportar/importar · recargar a mitad de adrenalina · saldo muy grande en cada juego · móvil (≈ 380 px) · consola sin errores · `npm run build` limpio.

### Fase opcional — Terminar Dados
Solo si lo apruebo: crear `pages/dados.vue` con los componentes de craps, activar la tarjeta en el lobby (`available: true`, `route: '/dados'`) y conectar `reportRound`.

---

## 5. Reglas y restricciones (importante)

- **No modificar** RNG, probabilidades, tablas de pago ni lógica de reglas de ningún juego.
- **No renombrar ni borrar** claves existentes de `localStorage` (`blackjack_player_chips_v1`, `blackjack_game_stats_v1`, `slots_machine_stats_v1`, etc.). Un jugador que ya tenga fichas guardadas debe conservarlas.
- Mantener TypeScript tipado (sin `any` salvo justificación), `<script setup lang="ts">`, componentes Vuetify y las convenciones de nombres/carpetas actuales.
- Todo balance en `constants/idle.ts`; **cero números mágicos** en componentes o stores.
- Sin dependencias nuevas salvo necesidad justificada. Los números se manejan como `number` (seguros hasta ~1e15); el diseño del prestigio mantiene las cifras por debajo de ese rango. Si se detecta que una run lo supera, proponer `break_infinity.js` antes de adoptarlo.
- Cada fase termina con build limpio y commit propio. Si encuentras una decisión ambigua (p. ej. los desbloqueos por juego), **pregunta antes de implementar**.

## 6. Definición de "terminado"

1. El ciclo generador → mejora → prestigio funciona de principio a fin y persiste entre sesiones.
2. Los 5 juegos siguen intactos y alimentan la adrenalina.
3. Progreso offline, exportar/importar guardado y reinicio funcionan.
4. Los tiempos de la Fase 7 se cumplen según el simulador.
5. `npm run build` sin errores y sin errores en consola en las rutas `/`, `/casino` y los 5 juegos.

---

## Prompt inicial sugerido para pegar en Antigravity

> Lee completo `PLAN_JUEGO_INCREMENTAL.md` en la raíz del proyecto. Es la especificación para convertir esta app de casino (Nuxt 3 + Vuetify + Pinia) en un juego incremental. Empieza por la **Fase 0** y la **Fase 1**, genera tu *Implementation Plan* y lista de tareas, y espera mi aprobación antes de pasar a la siguiente fase. No modifiques la lógica de los juegos existentes ni las claves actuales de localStorage.
