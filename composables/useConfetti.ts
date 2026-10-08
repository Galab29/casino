/**
 * Confetti & visual effects composable for casino celebrations.
 * Uses canvas overlay for particles — no external dependencies.
 */
export function useConfetti() {
  let canvas: HTMLCanvasElement | null = null
  let ctx2d: CanvasRenderingContext2D | null = null
  let animId: number | null = null

  interface Particle {
    x: number
    y: number
    vx: number
    vy: number
    size: number
    color: string
    rotation: number
    rotationSpeed: number
    opacity: number
    shape: 'rect' | 'circle' | 'diamond'
  }

  function ensureCanvas(): CanvasRenderingContext2D {
    if (!canvas) {
      canvas = document.createElement('canvas')
      canvas.id = 'confetti-canvas'
      canvas.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        pointer-events: none;
        z-index: 9999;
      `
      document.body.appendChild(canvas)
    }
    canvas.width = window.innerWidth
    canvas.height = window.innerHeight
    ctx2d = canvas.getContext('2d')!
    return ctx2d
  }

  function cleanup() {
    if (animId) {
      cancelAnimationFrame(animId)
      animId = null
    }
    if (canvas && canvas.parentNode) {
      canvas.parentNode.removeChild(canvas)
      canvas = null
      ctx2d = null
    }
  }

  /** Gold celebration confetti burst */
  function launchConfetti(duration = 3000) {
    const drawCtx = ensureCanvas()
    const particles: Particle[] = []
    const colors = ['#ffd54f', '#ffab00', '#ff8f00', '#fff176', '#ffffff', '#e0e0e0', '#f44336', '#4caf50']
    const shapes: Particle['shape'][] = ['rect', 'circle', 'diamond']

    // Spawn particles
    for (let i = 0; i < 120; i++) {
      particles.push({
        x: window.innerWidth * 0.5 + (Math.random() - 0.5) * 400,
        y: window.innerHeight * 0.3,
        vx: (Math.random() - 0.5) * 14,
        vy: -Math.random() * 12 - 4,
        size: Math.random() * 8 + 4,
        color: colors[Math.floor(Math.random() * colors.length)],
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: (Math.random() - 0.5) * 0.3,
        opacity: 1,
        shape: shapes[Math.floor(Math.random() * shapes.length)],
      })
    }

    const start = performance.now()

    function animate(time: number) {
      const elapsed = time - start
      if (elapsed > duration || particles.every(p => p.opacity <= 0)) {
        cleanup()
        return
      }

      drawCtx.clearRect(0, 0, canvas!.width, canvas!.height)

      for (const p of particles) {
        p.vy += 0.18 // gravity
        p.vx *= 0.99  // air resistance
        p.x += p.vx
        p.y += p.vy
        p.rotation += p.rotationSpeed

        if (elapsed > duration * 0.6) {
          p.opacity -= 0.02
        }
        if (p.opacity <= 0) continue

        drawCtx.save()
        drawCtx.globalAlpha = Math.max(0, p.opacity)
        drawCtx.translate(p.x, p.y)
        drawCtx.rotate(p.rotation)
        drawCtx.fillStyle = p.color

        if (p.shape === 'rect') {
          drawCtx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2)
        } else if (p.shape === 'circle') {
          drawCtx.beginPath()
          drawCtx.arc(0, 0, p.size / 2, 0, Math.PI * 2)
          drawCtx.fill()
        } else {
          drawCtx.beginPath()
          drawCtx.moveTo(0, -p.size / 2)
          drawCtx.lineTo(p.size / 3, 0)
          drawCtx.lineTo(0, p.size / 2)
          drawCtx.lineTo(-p.size / 3, 0)
          drawCtx.closePath()
          drawCtx.fill()
        }
        drawCtx.restore()
      }

      animId = requestAnimationFrame(animate)
    }

    animId = requestAnimationFrame(animate)
  }

  /** Screen shake effect */
  function screenShake(intensity = 6, duration = 400) {
    const el = document.body
    const startTime = performance.now()

    function shake(time: number) {
      const elapsed = time - startTime
      if (elapsed > duration) {
        el.style.transform = ''
        return
      }
      const decay = 1 - elapsed / duration
      const x = (Math.random() - 0.5) * intensity * decay * 2
      const y = (Math.random() - 0.5) * intensity * decay * 2
      el.style.transform = `translate(${x}px, ${y}px)`
      requestAnimationFrame(shake)
    }

    requestAnimationFrame(shake)
  }

  /** Floating "+chips" text effect */
  function floatingText(text: string, color = '#ffd54f') {
    const el = document.createElement('div')
    el.textContent = text
    el.style.cssText = `
      position: fixed;
      top: 45%;
      left: 50%;
      transform: translateX(-50%);
      font-family: 'Cinzel', serif;
      font-size: 2.5rem;
      font-weight: 900;
      color: ${color};
      text-shadow: 0 2px 20px rgba(255,213,79,0.6), 0 4px 40px rgba(0,0,0,0.4);
      pointer-events: none;
      z-index: 9999;
      animation: floatUp 2s ease-out forwards;
    `

    // Inject animation keyframes if not present
    if (!document.getElementById('float-up-style')) {
      const style = document.createElement('style')
      style.id = 'float-up-style'
      style.textContent = `
        @keyframes floatUp {
          0% { opacity: 1; transform: translateX(-50%) translateY(0) scale(1); }
          60% { opacity: 1; transform: translateX(-50%) translateY(-80px) scale(1.2); }
          100% { opacity: 0; transform: translateX(-50%) translateY(-140px) scale(0.8); }
        }
      `
      document.head.appendChild(style)
    }

    document.body.appendChild(el)
    setTimeout(() => el.remove(), 2100)
  }

  return {
    launchConfetti,
    screenShake,
    floatingText,
    cleanup,
  }
}
