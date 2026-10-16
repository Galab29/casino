/**
 * ============================================================================
 * MOTOR DE RENDERIZADO PIXEL ART "8-BIT TRADITIONAL" (78 x 110 PÍXELES)
 * ============================================================================
 * Módulo independiente del framework. Las funciones de dibujo sólo necesitan
 * un contexto con `fillStyle` + `fillRect`, así que pueden probarse sin DOM.
 * Las utilidades de alto nivel (data URLs, spritesheet) sí requieren `document`.
 */

export const CARD_W = 78
export const CARD_H = 110

export type PixelSuit = 'S' | 'H' | 'D' | 'C'
export type PixelRank = 'A' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | 'J' | 'Q' | 'K'
export type PixelBackTheme = 'navy' | 'red' | 'blue' | 'black' | 'green'

export type PixelCardSpec =
  | { type: 'STANDARD'; rank: PixelRank; suit: PixelSuit }
  | { type: 'JOKER'; color: 'red' | 'black' }
  | { type: 'BACK'; theme?: PixelBackTheme }

/** Mínimo necesario de CanvasRenderingContext2D para dibujar. */
export interface PixelCtx {
  fillStyle: string | CanvasGradient | CanvasPattern
  fillRect(x: number, y: number, w: number, h: number): void
}

type Sprite = readonly string[]

// Paleta de colores exacta de la baraja 8-Bit Traditional
export const PALETTE: Record<string, string> = {
  W: '#FFFFFF', // Blanco puro de la carta
  K: '#1A1A1A', // Negro 8-bit
  R: '#E52521', // Rojo intenso tradicional
  Y: '#FBC02D', // Dorado / Amarillo de borde y coronas
  B: '#283593', // Azul real para túnicas y detalles
  S: '#FFE0B2', // Tono de piel pixel art
  G: '#B0BEC5', // Gris acero para espadas y alabardas
}

// Fuente Píxel 3x5 para textos pequeños ("8-BIT TRADITIONAL", "MADE IN U.S.A.", etc.)
const TINY_FONT: Record<string, Sprite> = {
  A: ['010', '101', '111', '101', '101'],
  B: ['110', '101', '110', '101', '110'],
  C: ['011', '100', '100', '100', '011'],
  D: ['110', '101', '101', '101', '110'],
  E: ['111', '100', '110', '100', '111'],
  F: ['111', '100', '110', '100', '100'],
  G: ['011', '100', '101', '101', '011'],
  H: ['101', '101', '111', '101', '101'],
  I: ['111', '010', '010', '010', '111'],
  J: ['001', '001', '001', '101', '010'],
  K: ['101', '101', '110', '101', '101'],
  L: ['100', '100', '100', '100', '111'],
  M: ['101', '111', '101', '101', '101'],
  N: ['111', '101', '101', '101', '101'],
  O: ['010', '101', '101', '101', '010'],
  P: ['110', '101', '110', '100', '100'],
  Q: ['010', '101', '101', '110', '011'],
  R: ['110', '101', '110', '101', '101'],
  S: ['011', '100', '010', '001', '110'],
  T: ['111', '010', '010', '010', '010'],
  U: ['101', '101', '101', '101', '111'],
  V: ['101', '101', '101', '101', '010'],
  W: ['101', '101', '101', '111', '101'],
  X: ['101', '101', '010', '101', '101'],
  Y: ['101', '101', '010', '010', '010'],
  Z: ['111', '001', '010', '100', '111'],
  0: ['111', '101', '101', '101', '111'],
  1: ['010', '110', '010', '010', '111'],
  2: ['110', '001', '010', '100', '111'],
  3: ['110', '001', '010', '001', '110'],
  4: ['101', '101', '111', '001', '001'],
  5: ['111', '100', '110', '001', '110'],
  6: ['011', '100', '110', '101', '010'],
  7: ['111', '001', '010', '010', '010'],
  8: ['111', '101', '111', '101', '111'],
  9: ['010', '101', '011', '001', '110'],
  '-': ['000', '000', '111', '000', '000'],
  '.': ['000', '000', '000', '000', '010'],
  '*': ['000', '101', '010', '101', '000'],
  ' ': ['000', '000', '000', '000', '000'],
}

// Índices de esquina (5x9 px; el "10" mide 6x9 para que el 1 y el 0 no se fusionen)
export const RANK_SPRITES: Record<PixelRank, Sprite> = {
  A: ['.KKK.', 'K...K', 'K...K', 'K...K', 'KKKKK', 'K...K', 'K...K', 'K...K', 'K...K'],
  2: ['.KKK.', 'K...K', '....K', '...K.', '..K..', '.K...', 'K....', 'K...K', 'KKKKK'],
  3: ['KKKK.', '....K', '....K', '....K', '.KKK.', '....K', '....K', '....K', 'KKKK.'],
  4: ['K...K', 'K...K', 'K...K', 'K...K', 'KKKKK', '....K', '....K', '....K', '....K'],
  5: ['KKKKK', 'K....', 'K....', 'KKKK.', '....K', '....K', '....K', 'K...K', '.KKK.'],
  6: ['.KKK.', 'K...K', 'K....', 'KKKK.', 'K...K', 'K...K', 'K...K', 'K...K', '.KKK.'],
  7: ['KKKKK', 'K...K', '....K', '...K.', '...K.', '..K..', '..K..', '..K..', '..K..'],
  8: ['.KKK.', 'K...K', 'K...K', 'K...K', '.KKK.', 'K...K', 'K...K', 'K...K', '.KKK.'],
  9: ['.KKK.', 'K...K', 'K...K', 'K...K', '.KKKK', '....K', '....K', 'K...K', '.KKK.'],
  10: ['.K.KKK', 'KK.K.K', '.K.K.K', '.K.K.K', '.K.K.K', '.K.K.K', '.K.K.K', '.K.K.K', '.K.KKK'],
  J: ['..KKK', '...K.', '...K.', '...K.', '...K.', '...K.', 'K..K.', 'K..K.', '.KK..'],
  Q: ['.KKK.', 'K...K', 'K...K', 'K...K', 'K...K', 'K.K.K', 'K..KK', '.KKK.', '....K'],
  K: ['K...K', 'K..K.', 'K.K..', 'KK...', 'KK...', 'K.K..', 'K..K.', 'K...K', 'K...K'],
}

/**
 * Siluetas de los palos ('#' = relleno). El borde dorado característico se
 * genera automáticamente, garantizando un contorno uniforme en todos los palos.
 */
const SMALL_PIP_MASKS: Record<PixelSuit, Sprite> = {
  S: ['..#..', '.###.', '#####', '#####', '..#..', '.###.'],
  H: ['##.##', '#####', '#####', '.###.', '..#..'],
  D: ['..#..', '.###.', '#####', '#####', '.###.', '..#..'],
  C: ['.###.', '.###.', '#####', '#####', '..#..', '.###.'],
}

const LARGE_PIP_MASKS: Record<PixelSuit, Sprite> = {
  S: [
    '.....#.....',
    '....###....',
    '...#####...',
    '..#######..',
    '.#########.',
    '###########',
    '###########',
    '###########',
    '###########',
    '.###.#.###.',
    '.....#.....',
    '....###....',
    '...#####...',
  ],
  H: [
    '.###...###.',
    '#####.#####',
    '###########',
    '###########',
    '###########',
    '.#########.',
    '..#######..',
    '...#####...',
    '....###....',
    '.....#.....',
  ],
  D: [
    '....#....',
    '...###...',
    '...###...',
    '..#####..',
    '..#####..',
    '.#######.',
    '#########',
    '.#######.',
    '..#####..',
    '..#####..',
    '...###...',
    '...###...',
    '....#....',
  ],
  C: [
    '....###....',
    '...#####...',
    '...#####...',
    '...#####...',
    '.###.#.###.',
    '###########',
    '###########',
    '###########',
    '.###.#.###.',
    '.....#.....',
    '....###....',
    '...#####...',
  ],
}

const SUIT_FILL: Record<PixelSuit, string> = { S: 'K', C: 'K', H: 'R', D: 'R' }

/** Centra la máscara en una caja WxH y le añade un contorno dorado de 1 px (4-vecindad). */
function buildOutlinedPip(mask: Sprite, fill: string, boxW: number, boxH: number): string[] {
  const offX = Math.floor((boxW - mask[0].length) / 2)
  const offY = Math.floor((boxH - mask.length) / 2)
  const W = boxW + 2
  const H = boxH + 2
  const solid = Array.from({ length: H }, () => Array<boolean>(W).fill(false))
  mask.forEach((row, r) => {
    for (let c = 0; c < row.length; c++) {
      if (row[c] === '#') solid[r + offY + 1][c + offX + 1] = true
    }
  })
  const isSolid = (x: number, y: number) => y >= 0 && y < H && x >= 0 && x < W && solid[y][x]
  const out: string[] = []
  for (let y = 0; y < H; y++) {
    let line = ''
    for (let x = 0; x < W; x++) {
      if (solid[y][x]) line += fill
      else if (isSolid(x - 1, y) || isSolid(x + 1, y) || isSolid(x, y - 1) || isSolid(x, y + 1)) line += 'Y'
      else line += '.'
    }
    out.push(line)
  }
  return out
}

const SUITS: PixelSuit[] = ['S', 'H', 'D', 'C']

// Palos pequeños para las esquinas (7x8 px) y grandes para el interior (13x15 px)
export const SMALL_PIPS = Object.fromEntries(
  SUITS.map(s => [s, buildOutlinedPip(SMALL_PIP_MASKS[s], SUIT_FILL[s], 5, 6)]),
) as Record<PixelSuit, string[]>

export const LARGE_PIPS = Object.fromEntries(
  SUITS.map(s => [s, buildOutlinedPip(LARGE_PIP_MASKS[s], SUIT_FILL[s], 11, 13)]),
) as Record<PixelSuit, string[]>

// Ilustración especial del As de Picas con ojos, boca y brazos saludando (35x27 píxeles)
export const ACE_OF_SPADES_ART: Sprite = [
  '.................K.................',
  '................KKK................',
  '...............KKKKK...............',
  '..............KKKKKKK..............',
  '.............KKKKKKKKK.............',
  '............KKKKKWKKKKK............',
  '...........KKKKKKWKKKKKK...........',
  '..........KKKKKKKWKKKKKKK..........',
  '...K.K...KKKKKKKKWKKKKKKKK.........',
  '...KKK..KKKKKKKKKWKKKKKKKKK........',
  '...KKK.KKKKKWWWKKWKKWWWKKKKK.......',
  '....K..KKKKKWKWKKWKKWKWKKKKK.......',
  '....KKKKKKK.KWK..W..KWK.KKKKKKK....',
  '.......KKKK.WWW..W..WWW.KKKK..K....',
  '.......KKKKKKKKKKKKKKKKKKKKK..K....',
  '.......KKKKKRRRRRRRRRRRKKKKK.KKK...',
  '.......KKKKKRWWWWWWWWWRKKKKK.K.K...',
  '........KKKKRRRRRRRRRRRKKKK........',
  '.........KKKKKKKKKKKKKKKKK.........',
  '..........KKKKKKKWKKKKKKK..........',
  '...........KKKK..W..KKKK...........',
  '................KWK................',
  '................KKK................',
  '................KKK................',
  '...............KKKKK...............',
  '..............KKKKKKK..............',
  '.............KKKKKKKKK.............',
]

/**
 * Dibuja una matriz de texto como píxeles. flipX + flipY = rotación de 180°.
 */
export function drawSprite(
  ctx: PixelCtx,
  sprite: Sprite,
  startX: number,
  startY: number,
  colorOverride: string | null = null,
  flipX = false,
  flipY = false,
) {
  const h = sprite.length
  const w = sprite[0].length
  for (let r = 0; r < h; r++) {
    const rowStr = sprite[r]
    for (let c = 0; c < w; c++) {
      const ch = rowStr[c]
      if (!ch || ch === '.' || ch === ' ') continue
      const color = colorOverride && ch === 'K' ? colorOverride : PALETTE[ch]
      if (!color) continue
      const px = flipX ? startX + w - 1 - c : startX + c
      const py = flipY ? startY + h - 1 - r : startY + r
      ctx.fillStyle = color
      ctx.fillRect(px, py, 1, 1)
    }
  }
}

/** Ancho en píxeles de un texto en la fuente 3x5. */
export function tinyTextWidth(text: string) {
  return text.length * 4 - 1
}

/**
 * Dibuja texto pixelado diminuto (3x5) centrado en X.
 * `rotate180` lo dibuja invertido (para la esquina inferior de las cartas).
 */
export function drawTinyText(
  ctx: PixelCtx,
  text: string,
  centerX: number,
  startY: number,
  color: string,
  rotate180 = false,
) {
  const chars = text.toUpperCase().split('')
  const totalW = tinyTextWidth(text)
  const x0 = Math.round(centerX - totalW / 2)
  ctx.fillStyle = color
  chars.forEach((ch, i) => {
    const glyph = TINY_FONT[ch] || TINY_FONT[' ']
    for (let r = 0; r < 5; r++) {
      for (let c = 0; c < 3; c++) {
        if (glyph[r][c] !== '1') continue
        const dx = i * 4 + c
        const px = rotate180 ? x0 + totalW - 1 - dx : x0 + dx
        const py = rotate180 ? startY + 4 - r : startY + r
        ctx.fillRect(px, py, 1, 1)
      }
    }
  })
}

/** Rellena un triángulo pixel a pixel (prueba del centro de cada píxel). */
function fillTriangle(
  ctx: PixelCtx,
  a: [number, number],
  b: [number, number],
  c: [number, number],
  color: string,
) {
  const minX = Math.floor(Math.min(a[0], b[0], c[0]))
  const maxX = Math.ceil(Math.max(a[0], b[0], c[0]))
  const minY = Math.floor(Math.min(a[1], b[1], c[1]))
  const maxY = Math.ceil(Math.max(a[1], b[1], c[1]))
  const edge = (p: [number, number], q: [number, number], x: number, y: number) =>
    (q[0] - p[0]) * (y - p[1]) - (q[1] - p[1]) * (x - p[0])
  ctx.fillStyle = color
  for (let y = minY; y <= maxY; y++) {
    for (let x = minX; x <= maxX; x++) {
      const px = x + 0.5
      const py = y + 0.5
      const e1 = edge(a, b, px, py)
      const e2 = edge(b, c, px, py)
      const e3 = edge(c, a, px, py)
      const hasNeg = e1 < 0 || e2 < 0 || e3 < 0
      const hasPos = e1 > 0 || e2 > 0 || e3 > 0
      if (!(hasNeg && hasPos)) ctx.fillRect(x, y, 1, 1)
    }
  }
}

/**
 * Colores de túnica por palo, para que cada figura tenga identidad propia.
 */
const COURT_COLORS: Record<PixelSuit, { stripeA: string; stripeB: string; fill: string }> = {
  S: { stripeA: 'R', stripeB: 'Y', fill: 'B' },
  H: { stripeA: 'B', stripeB: 'Y', fill: 'R' },
  D: { stripeA: 'Y', stripeB: 'B', fill: 'R' },
  C: { stripeA: 'Y', stripeB: 'R', fill: 'B' },
}

/**
 * Genera la mitad superior de las figuras de la corte (J, Q, K) de 48x39 píxeles
 * y luego se refleja en 180 grados para lograr el efecto espejo clásico de póker.
 */
function buildCourtTopHalf(rank: 'J' | 'Q' | 'K', suit: PixelSuit): string[] {
  const W = 48
  const H = 39
  const grid = Array.from({ length: H }, () => Array<string>(W).fill('W'))

  const setPx = (x: number, y: number, col: string) => {
    if (x >= 0 && x < W && y >= 0 && y < H) grid[y][x] = col
  }
  const fillRect = (x: number, y: number, w: number, h: number, col: string) => {
    for (let j = y; j < y + h; j++) {
      for (let i = x; i < x + w; i++) setPx(i, j, col)
    }
  }

  // 1. Palo grande en la esquina superior izquierda dentro del recuadro
  //    (x: 0..12; antes empezaba en x = 2 y chocaba con los rulos en x = 12..14)
  const pip = LARGE_PIPS[suit]
  for (let r = 0; r < pip.length; r++) {
    for (let c = 0; c < pip[0].length; c++) {
      if (pip[r][c] !== '.') setPx(c, 1 + r, pip[r][c])
    }
  }

  // 2. Corona o Sombrero Real (x: 14..35, y: 1..7), simétrico respecto a x = 24.5
  if (rank === 'K') {
    // Banda de la corona con joyas
    fillRect(15, 4, 20, 3, 'Y')
    fillRect(14, 4, 1, 4, 'K')
    fillRect(35, 4, 1, 4, 'K')
    fillRect(15, 7, 20, 1, 'K')
    for (const x of [17, 21, 28, 32]) setPx(x, 5, 'R')
    fillRect(24, 5, 2, 1, 'B')
    // Picos de la corona (el central más alto) rematados con rubíes
    for (const [x, top] of [[15, 2], [19, 2], [24, 1], [29, 2], [33, 2]] as const) {
      fillRect(x, top, 2, 4 - top, 'Y')
      fillRect(x, top - 1, 2, 1, 'R')
    }
  } else if (rank === 'Q') {
    // Tiara redondeada de Reina
    fillRect(17, 5, 16, 2, 'Y')
    fillRect(17, 7, 16, 1, 'K')
    fillRect(18, 3, 14, 2, 'Y')
    fillRect(20, 2, 10, 1, 'Y')
    fillRect(24, 1, 2, 1, 'R')
    for (const x of [19, 23, 26, 30]) setPx(x, 5, 'R')
    setPx(16, 5, 'K'); setPx(16, 6, 'K'); setPx(33, 5, 'K'); setPx(33, 6, 'K')
  } else {
    // Boina / Gorro rojo y dorado de Jota
    fillRect(15, 1, 20, 5, 'R')
    fillRect(15, 0, 20, 1, 'K')
    fillRect(15, 6, 20, 1, 'Y')
    fillRect(15, 7, 20, 1, 'K')
    for (const x of [17, 21, 27, 31]) fillRect(x, 2, 2, 3, 'W')
  }

  // 3. Cabello y rulos clásicos (y: 8..17)
  const hairColor = rank === 'J' ? 'Y' : 'W'
  for (let y = 8; y <= 17; y++) {
    fillRect(13, y, 5, 1, hairColor)
    setPx(12, y, 'K')
    setPx(18, y, 'K')
    if (y % 2 === 0) { setPx(14, y, 'K'); setPx(16, y, 'K') }
    fillRect(32, y, 5, 1, hairColor)
    setPx(31, y, 'K')
    setPx(37, y, 'K')
    if (y % 2 === 0) { setPx(33, y, 'K'); setPx(35, y, 'K') }
  }

  // 4. Rostro pixelado (x: 19..30, y: 8..18)
  fillRect(19, 8, 12, 10, 'S')
  fillRect(19, 18, 12, 1, 'K') // Mentón
  // Ojos: ambas pupilas miran hacia el mismo lado (antes quedaban bizcos)
  fillRect(21, 10, 2, 3, 'W')
  fillRect(22, 11, 1, 2, 'B')
  fillRect(26, 10, 2, 3, 'W')
  fillRect(27, 11, 1, 2, 'B')
  // Cejas
  fillRect(21, 9, 2, 1, 'K')
  fillRect(26, 9, 2, 1, 'K')
  // Nariz
  setPx(24, 12, 'K')
  setPx(24, 13, 'K')
  setPx(23, 13, 'K')

  // Bigote y barba para el Rey, labios para J y Q
  if (rank === 'K') {
    fillRect(21, 15, 8, 1, 'K')
    setPx(20, 14, 'K'); setPx(29, 14, 'K')
    fillRect(19, 17, 12, 2, 'W')
    for (let x = 19; x < 31; x += 2) setPx(x, 17, 'K')
  } else if (rank === 'Q') {
    fillRect(23, 15, 3, 1, 'R')
    setPx(24, 16, 'R')
  } else {
    fillRect(22, 15, 5, 1, 'K')
  }

  // 5. Túnica real con hombros inclinados y contorno completo (y: 19..38)
  const colors = COURT_COLORS[suit]
  for (let y = 19; y < H; y++) {
    const left = Math.max(5, 9 - (y - 19))
    const right = 49 - left
    for (let x = left; x <= right; x++) {
      if (x === left || x === right || y === 19) {
        setPx(x, y, 'K')
        continue
      }
      // Pechera central dorada con botones
      const dist2 = Math.abs(2 * x - 49) // distancia al eje x = 24.5, en medios píxeles
      if (dist2 <= 7) {
        setPx(x, y, dist2 === 7 ? 'K' : y % 3 === 0 ? 'R' : 'Y')
      } else if ((x + y) % 7 === 0 || (x - y + 42) % 7 === 0) {
        setPx(x, y, 'K')
      } else if ((x + y) % 7 < 3) {
        setPx(x, y, colors.stripeA)
      } else if ((x - y + 42) % 7 < 3) {
        setPx(x, y, colors.stripeB)
      } else {
        setPx(x, y, (x + y) % 2 === 0 ? colors.fill : 'W')
      }
    }
  }

  // 6. Atributos según el rango (Espada para K, Cetro y Rosa para Q, Alabarda para J)
  if (rank === 'K') {
    fillRect(41, 3, 4, 24, 'K')
    fillRect(42, 4, 2, 22, 'W')
    setPx(43, 4, 'G')
    fillRect(39, 25, 8, 3, 'K')
    fillRect(40, 26, 6, 1, 'Y')
    fillRect(40, 28, 5, 4, 'S')
    fillRect(39, 28, 1, 4, 'K')
    fillRect(45, 28, 1, 4, 'K')
  } else if (rank === 'Q') {
    fillRect(41, 10, 2, 25, 'Y')
    fillRect(39, 7, 6, 5, 'R')
    setPx(41, 9, 'Y'); setPx(42, 9, 'Y')
    fillRect(39, 27, 5, 4, 'S')
  } else {
    // Asta de la alabarda
    for (let y = 4; y < H; y++) {
      setPx(43, y, 'K')
      setPx(44, y, y % 2 === 0 ? 'Y' : 'K')
      setPx(45, y, 'Y')
      setPx(46, y, 'K')
    }
    // Punta de lanza
    fillRect(44, 1, 2, 1, 'K')
    fillRect(44, 2, 2, 2, 'G')
    setPx(43, 3, 'K'); setPx(46, 3, 'K')
    // Hoja de hacha
    fillRect(39, 4, 4, 6, 'K')
    fillRect(40, 5, 3, 4, 'G')
    // Mano en el pecho
    fillRect(25, 26, 6, 5, 'S')
    fillRect(24, 25, 8, 1, 'K')
    fillRect(24, 31, 8, 1, 'K')
  }

  return grid.map(row => row.join(''))
}

// Pre-calculamos los artes de las 12 cartas de la corte
const COURT_SPRITES: Record<string, string[]> = {}
for (const suit of SUITS) {
  for (const rank of ['J', 'Q', 'K'] as const) {
    COURT_SPRITES[`${rank}_${suit}`] = buildCourtTopHalf(rank, suit)
  }
}

/**
 * Posiciones de los palos en cartas numéricas (2 al 10): [x, y, invertido].
 * Columnas: Izquierda = 18, Centro = 33, Derecha = 47 (18 y 47 son simétricas).
 * Las filas inferiores son el espejo exacto de las superiores: y' = 110 - 15 - y.
 */
export const NUMBER_PIP_LAYOUTS: Record<string, [number, number, boolean][]> = {
  2: [[33, 14, false], [33, 81, true]],
  3: [[33, 14, false], [33, 47, false], [33, 81, true]],
  4: [[18, 14, false], [47, 14, false], [18, 81, true], [47, 81, true]],
  5: [[18, 14, false], [47, 14, false], [33, 47, false], [18, 81, true], [47, 81, true]],
  6: [
    [18, 14, false], [47, 14, false],
    [18, 47, false], [47, 47, false],
    [18, 81, true], [47, 81, true],
  ],
  7: [
    [18, 14, false], [47, 14, false],
    [18, 47, false], [47, 47, false],
    [33, 64, false], // Como el 7 de diamantes de la imagen de referencia
    [18, 81, true], [47, 81, true],
  ],
  8: [
    [18, 14, false], [47, 14, false],
    [33, 30, false],
    [18, 47, false], [47, 47, false],
    [33, 65, true],
    [18, 81, true], [47, 81, true],
  ],
  9: [
    [18, 12, false], [47, 12, false],
    [18, 35, false], [47, 35, false],
    [33, 47, false],
    [18, 60, true], [47, 60, true],
    [18, 83, true], [47, 83, true],
  ],
  10: [
    [18, 12, false], [47, 12, false],
    [33, 24, false],
    [18, 35, false], [47, 35, false],
    [18, 60, true], [47, 60, true],
    [33, 71, true],
    [18, 83, true], [47, 83, true],
  ],
}

// Corner index geometry (top-left; bottom-right is the 180° mirror)
const PIP_X = 4
const RANK_Y = 6
const PIP_Y = 17

/**
 * Renderiza cualquier carta de la baraja en un contexto de 78x110 píxeles
 */
export function renderPixelCard(ctx: PixelCtx, card: PixelCardSpec) {
  ctx.fillStyle = PALETTE.W
  ctx.fillRect(0, 0, CARD_W, CARD_H)

  if (card.type === 'BACK') {
    drawCardBack(ctx, card.theme ?? 'navy')
    return
  }
  if (card.type === 'JOKER') {
    drawJokerCard(ctx, card.color === 'red')
    return
  }

  const isRed = card.suit === 'H' || card.suit === 'D'
  const rankColor = isRed ? PALETTE.R : PALETTE.K

  // Índices: el número se centra sobre el palo pequeño según su ancho real
  const rankSprite = RANK_SPRITES[card.rank]
  const smallPip = SMALL_PIPS[card.suit]
  const pipW = smallPip[0].length
  const pipH = smallPip.length
  const rankW = rankSprite[0].length
  const rankH = rankSprite.length
  const rankX = PIP_X + Math.floor((pipW - rankW) / 2)

  drawSprite(ctx, rankSprite, rankX, RANK_Y, rankColor)
  drawSprite(ctx, smallPip, PIP_X, PIP_Y)
  drawSprite(ctx, rankSprite, CARD_W - rankX - rankW, CARD_H - RANK_Y - rankH, rankColor, true, true)
  drawSprite(ctx, smallPip, CARD_W - PIP_X - pipW, CARD_H - PIP_Y - pipH, null, true, true)

  if (card.rank === 'A') {
    if (card.suit === 'S') {
      // As de Picas. Los textos anchos van fuera de la franja vertical de los índices
      drawTinyText(ctx, '8-BIT TRADITIONAL', CARD_W / 2, 27, PALETTE.B)
      drawTinyText(ctx, 'SOS', CARD_W / 2, 33, PALETTE.K)
      drawSprite(ctx, ACE_OF_SPADES_ART, Math.floor((CARD_W - ACE_OF_SPADES_ART[0].length) / 2), 39)
      drawTinyText(ctx, 'THE U.S. PLAYING', CARD_W / 2, 70, PALETTE.K)
      drawTinyText(ctx, 'MADE IN U.S.A.', CARD_W / 2, 77, PALETTE.K)
    } else {
      // Ases de Corazones, Diamantes y Tréboles con icono central doble tamaño
      const bigPip = LARGE_PIPS[card.suit]
      const startX = Math.floor((CARD_W - bigPip[0].length * 2) / 2)
      const startY = Math.floor((CARD_H - bigPip.length * 2) / 2)
      for (let r = 0; r < bigPip.length; r++) {
        for (let c = 0; c < bigPip[0].length; c++) {
          const ch = bigPip[r][c]
          if (ch === '.') continue
          ctx.fillStyle = PALETTE[ch]
          ctx.fillRect(startX + c * 2, startY + r * 2, 2, 2)
        }
      }
    }
  } else if (card.rank === 'J' || card.rank === 'Q' || card.rank === 'K') {
    // Marco interior negro (x: 14..63, y: 15..94)
    ctx.fillStyle = PALETTE.K
    ctx.fillRect(14, 15, 50, 80)
    ctx.fillStyle = PALETTE.W
    ctx.fillRect(15, 16, 48, 78)

    const halfSprite = COURT_SPRITES[`${card.rank}_${card.suit}`]
    drawSprite(ctx, halfSprite, 15, 16)
    drawSprite(ctx, halfSprite, 15, 55, null, true, true)

    // Línea divisoria de 2 px: tapa la última fila de ambas mitades por igual
    ctx.fillStyle = PALETTE.K
    ctx.fillRect(15, 54, 48, 2)
  } else {
    const coords = NUMBER_PIP_LAYOUTS[card.rank] || []
    const largePip = LARGE_PIPS[card.suit]
    for (const [x, y, flipped] of coords) {
      drawSprite(ctx, largePip, x, y, null, flipped, flipped)
    }
  }
}

/** Colores del reverso por tema (compatibles con el selector de dorso de Blackjack). */
export const BACK_THEMES: Record<PixelBackTheme, { base: string; a: string; b: string; label: string }> = {
  navy: { base: '#283593', a: '#E52521', b: '#FFFFFF', label: 'Azul Real' },
  red: { base: '#B71C1C', a: '#FBC02D', b: '#FFCDD2', label: 'Rojo Rubí' },
  blue: { base: '#1565C0', a: '#FBC02D', b: '#BBDEFB', label: 'Azul Cielo' },
  black: { base: '#1A1A1A', a: '#E52521', b: '#FBC02D', label: 'Negro Casino' },
  green: { base: '#1B5E20', a: '#FBC02D', b: '#C8E6C9', label: 'Verde Mesa' },
}

/**
 * Dibuja el reverso con patrón clásico de entramado 8-bit
 */
function drawCardBack(ctx: PixelCtx, theme: PixelBackTheme) {
  const t = BACK_THEMES[theme] ?? BACK_THEMES.navy
  ctx.fillStyle = PALETTE.K
  ctx.fillRect(4, 4, CARD_W - 8, CARD_H - 8)
  ctx.fillStyle = PALETTE.Y
  ctx.fillRect(6, 6, CARD_W - 12, CARD_H - 12)
  ctx.fillStyle = t.base
  ctx.fillRect(8, 8, CARD_W - 16, CARD_H - 16)

  for (let y = 10; y < CARD_H - 10; y++) {
    for (let x = 10; x < CARD_W - 10; x++) {
      if ((x + y) % 4 === 0) {
        ctx.fillStyle = t.a
        ctx.fillRect(x, y, 1, 1)
      } else if ((x - y + 100) % 4 === 0) {
        ctx.fillStyle = t.b
        ctx.fillRect(x, y, 1, 1)
      }
    }
  }

  // Medallón central con una Pica 8-bit
  ctx.fillStyle = PALETTE.K
  ctx.fillRect(23, 37, 32, 36)
  ctx.fillStyle = PALETTE.Y
  ctx.fillRect(25, 39, 28, 32)
  ctx.fillStyle = PALETTE.W
  ctx.fillRect(27, 41, 24, 28)

  const spade = LARGE_PIPS.S
  drawSprite(ctx, spade, Math.floor((CARD_W - spade[0].length) / 2), Math.floor((CARD_H - spade.length) / 2))
}

/** Cascabel dorado de 5x5 con contorno negro. */
function drawBell(ctx: PixelCtx, cx: number, cy: number) {
  ctx.fillStyle = PALETTE.K
  ctx.fillRect(cx - 1, cy - 2, 3, 5)
  ctx.fillRect(cx - 2, cy - 1, 5, 3)
  ctx.fillStyle = PALETTE.Y
  ctx.fillRect(cx - 1, cy - 1, 3, 3)
  ctx.fillStyle = PALETTE.W
  ctx.fillRect(cx - 1, cy - 1, 1, 1)
}

/**
 * Dibuja la carta Joker con gorro de bufón de tres puntas
 */
function drawJokerCard(ctx: PixelCtx, isRed: boolean) {
  const mainColor = isRed ? PALETTE.R : PALETTE.B
  const altColor = isRed ? PALETTE.B : PALETTE.R

  // "JOKER" vertical; en la esquina inferior va rotado 180° como un índice real
  const word = 'JOKER'
  for (let i = 0; i < word.length; i++) {
    drawTinyText(ctx, word[i], 7, 7 + i * 6, mainColor)
    drawTinyText(ctx, word[i], CARD_W - 8, CARD_H - 12 - i * 6, mainColor, true)
  }

  // Marco interior
  ctx.fillStyle = PALETTE.K
  ctx.fillRect(14, 15, 50, 80)
  ctx.fillStyle = PALETTE.W
  ctx.fillRect(15, 16, 48, 78)

  // Gorro de bufón: tres puntas simétricas respecto a x = 39
  fillTriangle(ctx, [26, 38], [39, 38], [19, 24], mainColor)
  fillTriangle(ctx, [39, 38], [52, 38], [59, 24], altColor)
  fillTriangle(ctx, [31, 38], [47, 38], [39, 19], PALETTE.Y)
  // Banda del gorro
  ctx.fillStyle = PALETTE.K
  ctx.fillRect(26, 36, 26, 3)
  ctx.fillStyle = PALETTE.Y
  ctx.fillRect(27, 37, 24, 1)
  drawBell(ctx, 19, 24)
  drawBell(ctx, 59, 24)
  drawBell(ctx, 39, 19)

  // Cara del bufón (x: 28..49, y: 39..58)
  ctx.fillStyle = PALETTE.K
  ctx.fillRect(28, 39, 22, 21)
  ctx.fillStyle = PALETTE.S
  ctx.fillRect(29, 39, 20, 20)
  // Ojos con brillo
  ctx.fillStyle = PALETTE.K
  ctx.fillRect(32, 43, 3, 4)
  ctx.fillRect(43, 43, 3, 4)
  ctx.fillStyle = PALETTE.W
  ctx.fillRect(33, 44, 1, 1)
  ctx.fillRect(44, 44, 1, 1)
  // Mejillas
  ctx.fillStyle = PALETTE.R
  ctx.fillRect(30, 48, 2, 2)
  ctx.fillRect(46, 48, 2, 2)
  // Nariz
  ctx.fillRect(38, 47, 2, 2)
  // Sonrisa pícara
  ctx.fillRect(32, 51, 14, 4)
  ctx.fillStyle = PALETTE.W
  ctx.fillRect(34, 52, 10, 2)
  ctx.fillStyle = PALETTE.R
  ctx.fillRect(31, 50, 1, 2)
  ctx.fillRect(46, 50, 1, 2)

  // Gorguera en zigzag
  ctx.fillStyle = PALETTE.K
  ctx.fillRect(22, 60, 34, 1)
  for (let i = 0; i < 6; i++) {
    const x = 23 + i * 5.5
    fillTriangle(ctx, [x, 61], [x + 5.5, 61], [x + 2.75, 68], i % 2 === 0 ? mainColor : PALETTE.Y)
  }

  drawTinyText(ctx, '8-BIT JOKER', CARD_W / 2, 76, PALETTE.K)
  drawTinyText(ctx, '* * *', CARD_W / 2, 84, mainColor)
}

/* ============================================================================
 * UTILIDADES DE ALTO NIVEL (requieren DOM)
 * ========================================================================== */

/** Convierte una carta de las mesas (hearts/'A'…) al formato del renderizador. */
export function toPixelSpec(card: { suit: string; value: string }): PixelCardSpec {
  const suitMap: Record<string, PixelSuit> = { spades: 'S', hearts: 'H', diamonds: 'D', clubs: 'C' }
  return {
    type: 'STANDARD',
    suit: suitMap[card.suit] ?? 'S',
    rank: (card.value in RANK_SPRITES ? card.value : 'A') as PixelRank,
  }
}

export function pixelSpecKey(spec: PixelCardSpec): string {
  if (spec.type === 'STANDARD') return `${spec.rank}_${spec.suit}`
  if (spec.type === 'JOKER') return `JOKER_${spec.color.toUpperCase()}`
  return `BACK_${(spec.theme ?? 'navy').toUpperCase()}`
}

/** Dibuja la carta en un canvas nuevo, escalada con vecino más cercano. */
export function renderPixelCardCanvas(spec: PixelCardSpec, scale = 1): HTMLCanvasElement {
  const base = document.createElement('canvas')
  base.width = CARD_W
  base.height = CARD_H
  renderPixelCard(base.getContext('2d')!, spec)
  if (scale === 1) return base

  const out = document.createElement('canvas')
  out.width = CARD_W * scale
  out.height = CARD_H * scale
  const ctx = out.getContext('2d')!
  ctx.imageSmoothingEnabled = false
  ctx.drawImage(base, 0, 0, out.width, out.height)
  return out
}

const urlCache = new Map<string, string>()

/**
 * Data URL (PNG) cacheada de una carta. Por defecto se genera a 4x para que el
 * navegador la reduzca con suavizado y se vea nítida a cualquier tamaño.
 */
export function getPixelCardUrl(spec: PixelCardSpec, scale = 4): string {
  const key = `${pixelSpecKey(spec)}@${scale}`
  let url = urlCache.get(key)
  if (!url) {
    url = renderPixelCardCanvas(spec, scale).toDataURL('image/png')
    urlCache.set(key, url)
  }
  return url
}

/** Spritesheet de N columnas con todas las cartas indicadas. */
export function buildPixelSpritesheet(specs: PixelCardSpec[], cols = 13, scale = 3): HTMLCanvasElement {
  const rows = Math.ceil(specs.length / cols)
  const sheet = document.createElement('canvas')
  sheet.width = cols * CARD_W * scale
  sheet.height = rows * CARD_H * scale
  const ctx = sheet.getContext('2d')!
  ctx.imageSmoothingEnabled = false
  specs.forEach((spec, idx) => {
    const tile = renderPixelCardCanvas(spec, 1)
    ctx.drawImage(
      tile,
      (idx % cols) * CARD_W * scale,
      Math.floor(idx / cols) * CARD_H * scale,
      CARD_W * scale,
      CARD_H * scale,
    )
  })
  return sheet
}

export function downloadCanvas(canvas: HTMLCanvasElement, filename: string) {
  const link = document.createElement('a')
  link.download = filename
  link.href = canvas.toDataURL('image/png')
  link.click()
}
