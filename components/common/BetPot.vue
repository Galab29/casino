<script setup lang="ts">
/**
 * Montón de fichas apiladas en pixel art con cartel del monto de apuesta.
 * `amount` es el monto; si `allIn` es true se muestra "ALL IN".
 */
const props = withDefaults(defineProps<{
  amount?: number
  allIn?: boolean
  showText?: boolean
  scale?: number
}>(), { amount: 0, allIn: false, showText: true, scale: 4 })

const canvasRef = ref<HTMLCanvasElement | null>(null)

interface ChipStyle { main: string; dark: string; stripe: string; gold: string }

const CHIP_TYPES: Record<string, ChipStyle> = {
  c10: { main: '#008075', dark: '#005951', stripe: '#ffffff', gold: '#f1c40f' },
  c25: { main: '#388e3c', dark: '#246327', stripe: '#ffffff', gold: '#f1c40f' },
  c50: { main: '#1976d2', dark: '#104d8a', stripe: '#ffffff', gold: '#f1c40f' },
  c100: { main: '#5e35b1', dark: '#3f2278', stripe: '#ffffff', gold: '#f1c40f' },
  c250: { main: '#c62828', dark: '#8e1b1b', stripe: '#ffffff', gold: '#f1c40f' },
  c500: { main: '#f39c12', dark: '#b9770e', stripe: '#111111', gold: '#ffeb3b' },
  c1000: { main: '#d81b60', dark: '#880e4f', stripe: '#ffffff', gold: '#f1c40f' },
  c5000: { main: '#00acc1', dark: '#006064', stripe: '#ffffff', gold: '#f1c40f' },
  c10000: { main: '#212121', dark: '#0d0d0d', stripe: '#ffd54f', gold: '#ffd54f' },
  c50000: { main: '#ffd54f', dark: '#ffa000', stripe: '#111111', gold: '#fff59d' },
  allin: { main: '#7f0000', dark: '#4a0000', stripe: '#ffd54f', gold: '#ffd54f' },
}

const PIXEL_FONT: Record<string, string[]> = {
  '$': ['0110', '1111', '1100', '0111', '1111', '0110'],
  ',': ['0000', '0000', '0000', '0000', '0010', '0100'],
  '.': ['0000', '0000', '0000', '0000', '0110', '0110'],
  ' ': ['0000', '0000', '0000', '0000', '0000', '0000'],
  '0': ['0110', '1001', '1001', '1001', '1001', '0110'],
  '1': ['0010', '0110', '0010', '0010', '0010', '0111'],
  '2': ['0110', '1001', '0001', '0110', '1000', '1111'],
  '3': ['1110', '0001', '0110', '0001', '0001', '1110'],
  '4': ['1001', '1001', '1111', '0001', '0001', '0001'],
  '5': ['1111', '1000', '1110', '0001', '0001', '1110'],
  '6': ['0111', '1000', '1110', '1001', '1001', '0110'],
  '7': ['1111', '0001', '0010', '0100', '0100', '0100'],
  '8': ['0110', '1001', '0110', '1001', '1001', '0110'],
  '9': ['0110', '1001', '1001', '0111', '0001', '1110'],
  'A': ['0110', '1001', '1111', '1001', '1001', '1001'],
  'L': ['1000', '1000', '1000', '1000', '1000', '1111'],
  'I': ['1110', '0100', '0100', '0100', '0100', '1110'],
  'N': ['1001', '1101', '1011', '1001', '1001', '1001'],
  'K': ['1001', '1010', '1100', '1010', '1001', '1001'],
}

function drawIsoChip(ctx: CanvasRenderingContext2D, cx: number, cy: number, style: ChipStyle) {
  const rx = 13
  const ry = 6.5
  const thickness = 3

  for (let dy = 0; dy <= thickness; dy++) {
    for (let x = -rx - 1; x <= rx + 1; x++) {
      for (let y = 0; y <= ry + 1; y++) {
        const norm = (x * x) / (rx * rx) + (y * y) / (ry * ry)
        if (norm <= 1.15 && norm > 0.88) {
          ctx.fillStyle = '#000000'
          ctx.fillRect(cx + x, cy + y + dy, 1, 1)
        } else if (norm <= 0.88) {
          const isStripe = Math.abs(x) % 5 <= 1
          ctx.fillStyle = dy === thickness ? '#000000' : (isStripe ? style.stripe : style.dark)
          ctx.fillRect(cx + x, cy + y + dy, 1, 1)
        }
      }
    }
  }

  for (let y = -ry - 1; y <= ry + 1; y++) {
    for (let x = -rx - 1; x <= rx + 1; x++) {
      const dist = Math.sqrt((x * x) / (rx * rx) + (y * y) / (ry * ry))
      const angle = (Math.atan2(y / ry, x / rx) + Math.PI) / (2 * Math.PI)
      const py = Math.round(cy + y)

      if (dist <= 1.06 && dist > 0.92) {
        ctx.fillStyle = '#000000'
        ctx.fillRect(cx + x, py, 1, 1)
      } else if (dist <= 0.92 && dist > 0.66) {
        const t = ((angle + 1 / 16) % 1.0) * 8
        const sub = t - Math.floor(t)
        ctx.fillStyle = sub < 0.36 ? style.stripe : style.main
        ctx.fillRect(cx + x, py, 1, 1)
      } else if (dist <= 0.66 && dist > 0.54) {
        ctx.fillStyle = (x + Math.round(y)) % 2 === 0 ? style.gold : '#000000'
        ctx.fillRect(cx + x, py, 1, 1)
      } else if (dist <= 0.54) {
        ctx.fillStyle = style.main
        ctx.fillRect(cx + x, py, 1, 1)
      }
    }
  }
}

function drawStackColumn(ctx: CanvasRenderingContext2D, baseX: number, baseY: number, chips: string[]) {
  chips.forEach((key, index) => {
    const wobbleX = index % 3 === 1 ? 1 : (index % 4 === 2 ? -1 : 0)
    drawIsoChip(ctx, baseX + wobbleX, baseY - index * 3, CHIP_TYPES[key]!)
  })
}

function drawBetBanner(ctx: CanvasRenderingContext2D, textStr: string, drawText: boolean) {
  const bx = 14, by = 64, bw = 100, bh = 24

  ctx.fillStyle = 'rgba(0, 0, 0, 0.55)'
  ctx.fillRect(bx + 2, by + 3, bw, bh)
  ctx.fillStyle = '#000000'
  ctx.fillRect(bx + 2, by, bw - 4, bh)
  ctx.fillRect(bx, by + 2, bw, bh - 4)
  ctx.fillStyle = '#f39c12'
  ctx.fillRect(bx + 3, by + 1, bw - 6, bh - 2)
  ctx.fillRect(bx + 1, by + 3, bw - 2, bh - 6)
  ctx.fillStyle = '#ffd54f'
  ctx.fillRect(bx + 3, by + 2, bw - 6, 1)
  ctx.fillStyle = '#14181d'
  ctx.fillRect(bx + 4, by + 4, bw - 8, bh - 8)
  ctx.fillStyle = '#0b0d10'
  ctx.fillRect(bx + 4, by + 4, bw - 8, 2)
  ctx.fillStyle = '#ffd54f'
  ctx.fillRect(bx + 5, by + 6, 2, 2)
  ctx.fillRect(bx + bw - 7, by + 6, 2, 2)
  ctx.fillRect(bx + 5, by + bh - 8, 2, 2)
  ctx.fillRect(bx + bw - 7, by + bh - 8, 2, 2)

  if (!drawText) return

  const iconX = bx + 11, iconY = by + 9
  ctx.fillStyle = '#ffd54f'
  ctx.fillRect(iconX + 1, iconY, 4, 6)
  ctx.fillRect(iconX, iconY + 1, 6, 4)
  ctx.fillStyle = '#14181d'
  ctx.fillRect(iconX + 2, iconY + 2, 2, 2)

  const text = textStr.toUpperCase()
  const charW = 4, charH = 6, spacing = 1
  const totalW = text.length * charW + (text.length - 1) * spacing
  const startX = Math.floor(bx + 54 - totalW / 2)
  const startY = by + 9

  for (let i = 0; i < text.length; i++) {
    const grid = PIXEL_FONT[text[i]!] || PIXEL_FONT[' ']!
    const ox = startX + i * (charW + spacing)
    ctx.fillStyle = '#000000'
    for (let r = 0; r < charH; r++)
      for (let c = 0; c < charW; c++)
        if (grid[r]![c] === '1') ctx.fillRect(ox + c + 1, startY + r + 1, 1, 1)
    ctx.fillStyle = text.includes('ALL') ? '#ffd54f' : '#ffffff'
    for (let r = 0; r < charH; r++)
      for (let c = 0; c < charW; c++)
        if (grid[r]![c] === '1') ctx.fillRect(ox + c, startY + r, 1, 1)
  }
}

function render(withText = props.showText) {
  const canvas = canvasRef.value
  const ctx = canvas?.getContext('2d')
  if (!canvas || !ctx) return
  ctx.clearRect(0, 0, canvas.width, canvas.height)

  ctx.fillStyle = 'rgba(0, 0, 0, 0.45)'
  ctx.fillRect(16, 52, 96, 12)

  drawStackColumn(ctx, 34, 44, ['c100', 'c100', 'c100', 'c500', 'c500', 'c1000', 'c1000'])
  drawStackColumn(ctx, 64, 41, ['c500', 'c500', 'c1000', 'c1000', 'c5000', 'c5000', 'c10000', 'c50000', 'allin'])
  drawStackColumn(ctx, 94, 44, ['c25', 'c25', 'c50', 'c50', 'c250', 'c250', 'c500'])
  drawStackColumn(ctx, 48, 52, ['c10', 'c10', 'c25', 'c25', 'c50', 'c100'])
  drawStackColumn(ctx, 80, 52, ['c100', 'c250', 'c250', 'c500', 'c1000'])
  drawIsoChip(ctx, 64, 56, CHIP_TYPES.c500!)

  const label = props.allIn ? 'ALL IN' : '$' + Math.max(0, Math.floor(props.amount)).toLocaleString('en-US')
  drawBetBanner(ctx, label, withText)
}

/** Exporta el sprite como PNG a 4x sin suavizado. */
function download(withText = true) {
  render(withText)
  const src = canvasRef.value
  if (!src) return
  const out = document.createElement('canvas')
  out.width = 512
  out.height = 384
  const octx = out.getContext('2d')!
  octx.imageSmoothingEnabled = false
  octx.drawImage(src, 0, 0, 512, 384)
  const a = document.createElement('a')
  a.download = withText ? 'manojo_fichas_con_monto_8bit.png' : 'manojo_fichas_espacio_vacio_8bit.png'
  a.href = out.toDataURL('image/png')
  a.click()
  render()
}

defineExpose({ download })

onMounted(() => render())
watch(() => [props.amount, props.allIn, props.showText], () => render())
</script>

<template>
  <canvas
    ref="canvasRef"
    class="bet-pot"
    width="128"
    height="96"
    :style="{ width: `${128 * scale}px`, height: `${96 * scale}px` }"
    aria-label="Montón de fichas con el monto de la apuesta"
  />
</template>

<style scoped>
.bet-pot {
  image-rendering: pixelated;
  image-rendering: crisp-edges;
  max-width: 100%;
  height: auto !important;
}
</style>
