/**
 * Casino Sound Engine — Web Audio API synthesized sounds
 * Produces realistic card, chip, and result sounds without any external files.
 */
export function useSoundEngine() {
  let ctx: AudioContext | null = null

  function getCtx(): AudioContext {
    if (!ctx || ctx.state === 'closed') {
      ctx = new AudioContext()
    }
    if (ctx.state === 'suspended') {
      ctx.resume()
    }
    return ctx
  }

  // ─── Utility ──────────────────────────────────────────────

  /** White-noise buffer */
  function noiseBuffer(duration: number, sampleRate: number): AudioBuffer {
    const ac = getCtx()
    const buf = ac.createBuffer(1, sampleRate * duration, sampleRate)
    const data = buf.getChannelData(0)
    for (let i = 0; i < data.length; i++) {
      data[i] = Math.random() * 2 - 1
    }
    return buf
  }

  // ─── Card Sounds ──────────────────────────────────────────

  /** Realistic card-flick / deal sound */
  function playCardDeal() {
    const ac = getCtx()
    const now = ac.currentTime

    // Percussive noise burst (the "snap")
    const noiseSrc = ac.createBufferSource()
    noiseSrc.buffer = noiseBuffer(0.08, ac.sampleRate)

    const bandpass = ac.createBiquadFilter()
    bandpass.type = 'bandpass'
    bandpass.frequency.value = 3200
    bandpass.Q.value = 1.4

    const noiseGain = ac.createGain()
    noiseGain.gain.setValueAtTime(0.35, now)
    noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.07)

    noiseSrc.connect(bandpass).connect(noiseGain).connect(ac.destination)
    noiseSrc.start(now)
    noiseSrc.stop(now + 0.08)

    // Tonal "thwip" (the card body vibration)
    const osc = ac.createOscillator()
    osc.type = 'triangle'
    osc.frequency.setValueAtTime(1800 + Math.random() * 600, now)
    osc.frequency.exponentialRampToValueAtTime(800, now + 0.04)

    const oscGain = ac.createGain()
    oscGain.gain.setValueAtTime(0.15, now)
    oscGain.gain.exponentialRampToValueAtTime(0.001, now + 0.05)

    osc.connect(oscGain).connect(ac.destination)
    osc.start(now)
    osc.stop(now + 0.06)
  }

  /** Card flip / reveal sound */
  function playCardFlip() {
    const ac = getCtx()
    const now = ac.currentTime

    const noiseSrc = ac.createBufferSource()
    noiseSrc.buffer = noiseBuffer(0.12, ac.sampleRate)

    const hp = ac.createBiquadFilter()
    hp.type = 'highpass'
    hp.frequency.value = 2000

    const gain = ac.createGain()
    gain.gain.setValueAtTime(0.2, now)
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1)

    noiseSrc.connect(hp).connect(gain).connect(ac.destination)
    noiseSrc.start(now)
    noiseSrc.stop(now + 0.12)

    // Secondary lower pop
    const osc = ac.createOscillator()
    osc.type = 'sine'
    osc.frequency.setValueAtTime(600, now + 0.02)
    osc.frequency.exponentialRampToValueAtTime(200, now + 0.08)

    const oscG = ac.createGain()
    oscG.gain.setValueAtTime(0.1, now + 0.02)
    oscG.gain.exponentialRampToValueAtTime(0.001, now + 0.09)

    osc.connect(oscG).connect(ac.destination)
    osc.start(now + 0.02)
    osc.stop(now + 0.1)
  }

  /** Card slide across felt */
  function playCardSlide() {
    const ac = getCtx()
    const now = ac.currentTime

    const noiseSrc = ac.createBufferSource()
    noiseSrc.buffer = noiseBuffer(0.18, ac.sampleRate)

    const lp = ac.createBiquadFilter()
    lp.type = 'lowpass'
    lp.frequency.setValueAtTime(1200, now)
    lp.frequency.linearRampToValueAtTime(600, now + 0.15)

    const gain = ac.createGain()
    gain.gain.setValueAtTime(0.12, now)
    gain.gain.linearRampToValueAtTime(0.2, now + 0.04)
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.16)

    noiseSrc.connect(lp).connect(gain).connect(ac.destination)
    noiseSrc.start(now)
    noiseSrc.stop(now + 0.18)
  }

  // ─── Chip Sounds ──────────────────────────────────────────

  /** Chip click / place bet sound */
  function playChipClick() {
    const ac = getCtx()
    const now = ac.currentTime

    // Metallic ping
    const osc = ac.createOscillator()
    osc.type = 'sine'
    osc.frequency.setValueAtTime(4200 + Math.random() * 800, now)
    osc.frequency.exponentialRampToValueAtTime(2400, now + 0.06)

    const gain = ac.createGain()
    gain.gain.setValueAtTime(0.18, now)
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1)

    osc.connect(gain).connect(ac.destination)
    osc.start(now)
    osc.stop(now + 0.12)

    // Ceramic click noise
    const noiseSrc = ac.createBufferSource()
    noiseSrc.buffer = noiseBuffer(0.04, ac.sampleRate)

    const bp = ac.createBiquadFilter()
    bp.type = 'bandpass'
    bp.frequency.value = 5000
    bp.Q.value = 3

    const nGain = ac.createGain()
    nGain.gain.setValueAtTime(0.12, now)
    nGain.gain.exponentialRampToValueAtTime(0.001, now + 0.04)

    noiseSrc.connect(bp).connect(nGain).connect(ac.destination)
    noiseSrc.start(now)
    noiseSrc.stop(now + 0.05)
  }

  /** Stack of chips collected / won */
  function playChipStack() {
    const ac = getCtx()
    const now = ac.currentTime

    for (let i = 0; i < 5; i++) {
      const delay = i * 0.06
      const osc = ac.createOscillator()
      osc.type = 'sine'
      osc.frequency.setValueAtTime(3800 + i * 200 + Math.random() * 300, now + delay)
      osc.frequency.exponentialRampToValueAtTime(2000, now + delay + 0.07)

      const gain = ac.createGain()
      gain.gain.setValueAtTime(0.1, now + delay)
      gain.gain.exponentialRampToValueAtTime(0.001, now + delay + 0.09)

      osc.connect(gain).connect(ac.destination)
      osc.start(now + delay)
      osc.stop(now + delay + 0.1)
    }
  }

  // ─── Shuffle Sound ────────────────────────────────────────

  function playShuffle() {
    const ac = getCtx()
    const now = ac.currentTime

    for (let i = 0; i < 8; i++) {
      const delay = i * 0.04 + Math.random() * 0.02
      const noiseSrc = ac.createBufferSource()
      noiseSrc.buffer = noiseBuffer(0.06, ac.sampleRate)

      const bp = ac.createBiquadFilter()
      bp.type = 'bandpass'
      bp.frequency.value = 2500 + Math.random() * 1500
      bp.Q.value = 1.2

      const gain = ac.createGain()
      gain.gain.setValueAtTime(0.12, now + delay)
      gain.gain.exponentialRampToValueAtTime(0.001, now + delay + 0.05)

      noiseSrc.connect(bp).connect(gain).connect(ac.destination)
      noiseSrc.start(now + delay)
      noiseSrc.stop(now + delay + 0.06)
    }
  }

  // ─── Result Sounds ────────────────────────────────────────

  /** Victory / win fanfare */
  function playWin() {
    const ac = getCtx()
    const now = ac.currentTime

    // Ascending major arpeggio: C5 → E5 → G5 → C6
    const notes = [523.25, 659.25, 783.99, 1046.50]

    notes.forEach((freq, i) => {
      const delay = i * 0.12
      const osc = ac.createOscillator()
      osc.type = 'sine'
      osc.frequency.setValueAtTime(freq, now + delay)

      const gain = ac.createGain()
      gain.gain.setValueAtTime(0, now + delay)
      gain.gain.linearRampToValueAtTime(0.2, now + delay + 0.03)
      gain.gain.exponentialRampToValueAtTime(0.001, now + delay + 0.35)

      osc.connect(gain).connect(ac.destination)
      osc.start(now + delay)
      osc.stop(now + delay + 0.4)
    })

    // Shimmer overlay
    const shimmer = ac.createBufferSource()
    shimmer.buffer = noiseBuffer(0.6, ac.sampleRate)
    const hp = ac.createBiquadFilter()
    hp.type = 'highpass'
    hp.frequency.value = 6000
    const sGain = ac.createGain()
    sGain.gain.setValueAtTime(0.04, now + 0.1)
    sGain.gain.exponentialRampToValueAtTime(0.001, now + 0.6)
    shimmer.connect(hp).connect(sGain).connect(ac.destination)
    shimmer.start(now + 0.1)
    shimmer.stop(now + 0.65)
  }

  /** Blackjack special win */
  function playBlackjack() {
    const ac = getCtx()
    const now = ac.currentTime

    // Epic ascending: C5 → E5 → G5 → B5 → C6 (with vibrato on final note)
    const notes = [523.25, 659.25, 783.99, 987.77, 1046.50]

    notes.forEach((freq, i) => {
      const delay = i * 0.1
      const osc = ac.createOscillator()
      osc.type = i < 4 ? 'sine' : 'triangle'
      osc.frequency.setValueAtTime(freq, now + delay)

      if (i === 4) {
        // Vibrato on final note
        const lfo = ac.createOscillator()
        lfo.frequency.value = 6
        const lfoGain = ac.createGain()
        lfoGain.gain.value = 8
        lfo.connect(lfoGain).connect(osc.frequency)
        lfo.start(now + delay)
        lfo.stop(now + delay + 0.8)
      }

      const gain = ac.createGain()
      gain.gain.setValueAtTime(0, now + delay)
      gain.gain.linearRampToValueAtTime(i === 4 ? 0.25 : 0.18, now + delay + 0.03)
      gain.gain.exponentialRampToValueAtTime(0.001, now + delay + (i === 4 ? 0.7 : 0.3))

      osc.connect(gain).connect(ac.destination)
      osc.start(now + delay)
      osc.stop(now + delay + (i === 4 ? 0.75 : 0.35))
    })

    // Chip cascade
    setTimeout(() => playChipStack(), 250)
  }

  /** Bust / loss sound */
  function playBust() {
    const ac = getCtx()
    const now = ac.currentTime

    // Descending "wah wah" (minor seconds descending)
    const notes = [293.66, 277.18, 261.63]

    notes.forEach((freq, i) => {
      const delay = i * 0.25
      const osc = ac.createOscillator()
      osc.type = 'triangle'
      osc.frequency.setValueAtTime(freq, now + delay)

      const gain = ac.createGain()
      gain.gain.setValueAtTime(0, now + delay)
      gain.gain.linearRampToValueAtTime(0.2, now + delay + 0.04)
      gain.gain.exponentialRampToValueAtTime(0.001, now + delay + 0.4)

      osc.connect(gain).connect(ac.destination)
      osc.start(now + delay)
      osc.stop(now + delay + 0.45)
    })

    // Low thud
    const thud = ac.createOscillator()
    thud.type = 'sine'
    thud.frequency.setValueAtTime(80, now + 0.7)
    thud.frequency.exponentialRampToValueAtTime(30, now + 0.95)
    const thudG = ac.createGain()
    thudG.gain.setValueAtTime(0.25, now + 0.7)
    thudG.gain.exponentialRampToValueAtTime(0.001, now + 0.95)
    thud.connect(thudG).connect(ac.destination)
    thud.start(now + 0.7)
    thud.stop(now + 1.0)
  }

  /** Draw / push sound */
  function playDraw() {
    const ac = getCtx()
    const now = ac.currentTime

    // Two notes, same pitch — "even"
    for (let i = 0; i < 2; i++) {
      const delay = i * 0.2
      const osc = ac.createOscillator()
      osc.type = 'sine'
      osc.frequency.setValueAtTime(440, now + delay)

      const gain = ac.createGain()
      gain.gain.setValueAtTime(0, now + delay)
      gain.gain.linearRampToValueAtTime(0.15, now + delay + 0.03)
      gain.gain.exponentialRampToValueAtTime(0.001, now + delay + 0.25)

      osc.connect(gain).connect(ac.destination)
      osc.start(now + delay)
      osc.stop(now + delay + 0.3)
    }
  }

  /** Button press feedback */
  function playButtonClick() {
    const ac = getCtx()
    const now = ac.currentTime

    const osc = ac.createOscillator()
    osc.type = 'sine'
    osc.frequency.setValueAtTime(800, now)
    osc.frequency.exponentialRampToValueAtTime(600, now + 0.04)

    const gain = ac.createGain()
    gain.gain.setValueAtTime(0.08, now)
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05)

    osc.connect(gain).connect(ac.destination)
    osc.start(now)
    osc.stop(now + 0.06)
  }

  /** Place bet confirmation sound */
  function playBetPlace() {
    const ac = getCtx()
    const now = ac.currentTime

    // Multiple chips hitting felt
    for (let i = 0; i < 3; i++) {
      const delay = i * 0.08
      const osc = ac.createOscillator()
      osc.type = 'sine'
      osc.frequency.setValueAtTime(3500 + i * 400, now + delay)
      osc.frequency.exponentialRampToValueAtTime(1800, now + delay + 0.06)

      const gain = ac.createGain()
      gain.gain.setValueAtTime(0.12, now + delay)
      gain.gain.exponentialRampToValueAtTime(0.001, now + delay + 0.08)

      osc.connect(gain).connect(ac.destination)
      osc.start(now + delay)
      osc.stop(now + delay + 0.1)
    }

    // Soft thud on felt
    const thud = ac.createOscillator()
    thud.type = 'sine'
    thud.frequency.setValueAtTime(120, now + 0.2)
    thud.frequency.exponentialRampToValueAtTime(50, now + 0.35)
    const tG = ac.createGain()
    tG.gain.setValueAtTime(0.1, now + 0.2)
    tG.gain.exponentialRampToValueAtTime(0.001, now + 0.35)
    thud.connect(tG).connect(ac.destination)
    thud.start(now + 0.2)
    thud.stop(now + 0.4)
  }

  // ─── Slot Machine Sounds ──────────────────────────────────

  /** Short mechanical tick while reels spin */
  function playReelTick() {
    const ac = getCtx()
    const now = ac.currentTime

    const osc = ac.createOscillator()
    osc.type = 'square'
    osc.frequency.setValueAtTime(1400 + Math.random() * 200, now)

    const gain = ac.createGain()
    gain.gain.setValueAtTime(0.025, now)
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.025)

    osc.connect(gain).connect(ac.destination)
    osc.start(now)
    osc.stop(now + 0.03)
  }

  /** Heavy "clunk" when a reel stops */
  function playReelStop() {
    const ac = getCtx()
    const now = ac.currentTime

    const osc = ac.createOscillator()
    osc.type = 'sine'
    osc.frequency.setValueAtTime(220, now)
    osc.frequency.exponentialRampToValueAtTime(60, now + 0.12)

    const gain = ac.createGain()
    gain.gain.setValueAtTime(0.3, now)
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15)

    osc.connect(gain).connect(ac.destination)
    osc.start(now)
    osc.stop(now + 0.16)

    const noiseSrc = ac.createBufferSource()
    noiseSrc.buffer = noiseBuffer(0.05, ac.sampleRate)
    const bp = ac.createBiquadFilter()
    bp.type = 'bandpass'
    bp.frequency.value = 1800
    bp.Q.value = 2
    const nGain = ac.createGain()
    nGain.gain.setValueAtTime(0.15, now)
    nGain.gain.exponentialRampToValueAtTime(0.001, now + 0.05)
    noiseSrc.connect(bp).connect(nGain).connect(ac.destination)
    noiseSrc.start(now)
    noiseSrc.stop(now + 0.06)
  }

  /** Lever ratchet pull */
  function playLeverPull() {
    const ac = getCtx()
    const now = ac.currentTime

    for (let i = 0; i < 6; i++) {
      const delay = i * 0.035
      const noiseSrc = ac.createBufferSource()
      noiseSrc.buffer = noiseBuffer(0.03, ac.sampleRate)
      const bp = ac.createBiquadFilter()
      bp.type = 'bandpass'
      bp.frequency.value = 2200 - i * 150
      bp.Q.value = 4
      const gain = ac.createGain()
      gain.gain.setValueAtTime(0.18, now + delay)
      gain.gain.exponentialRampToValueAtTime(0.001, now + delay + 0.03)
      noiseSrc.connect(bp).connect(gain).connect(ac.destination)
      noiseSrc.start(now + delay)
      noiseSrc.stop(now + delay + 0.035)
    }

    // Spring release
    const osc = ac.createOscillator()
    osc.type = 'triangle'
    osc.frequency.setValueAtTime(180, now + 0.25)
    osc.frequency.exponentialRampToValueAtTime(420, now + 0.4)
    const g = ac.createGain()
    g.gain.setValueAtTime(0.08, now + 0.25)
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.42)
    osc.connect(g).connect(ac.destination)
    osc.start(now + 0.25)
    osc.stop(now + 0.45)
  }

  /** Coins falling into the tray */
  function playCoinCascade(count = 8) {
    const ac = getCtx()
    const now = ac.currentTime

    for (let i = 0; i < count; i++) {
      const delay = i * 0.07 + Math.random() * 0.03
      const freq = 2600 + Math.random() * 1600

      const osc = ac.createOscillator()
      osc.type = 'sine'
      osc.frequency.setValueAtTime(freq, now + delay)

      const osc2 = ac.createOscillator()
      osc2.type = 'sine'
      osc2.frequency.setValueAtTime(freq * 1.5, now + delay)

      const gain = ac.createGain()
      gain.gain.setValueAtTime(0.09, now + delay)
      gain.gain.exponentialRampToValueAtTime(0.001, now + delay + 0.18)

      osc.connect(gain)
      osc2.connect(gain)
      gain.connect(ac.destination)
      osc.start(now + delay)
      osc2.start(now + delay)
      osc.stop(now + delay + 0.2)
      osc2.stop(now + delay + 0.2)
    }
  }

  /** Jackpot fanfare */
  function playJackpot() {
    const ac = getCtx()
    const now = ac.currentTime

    // C major fanfare twice, ending high
    const melody = [523.25, 659.25, 783.99, 1046.5, 783.99, 1046.5, 1318.51, 1567.98]
    melody.forEach((freq, i) => {
      const delay = i * 0.13
      const long = i === melody.length - 1
      const osc = ac.createOscillator()
      osc.type = 'square'
      osc.frequency.setValueAtTime(freq, now + delay)

      const lp = ac.createBiquadFilter()
      lp.type = 'lowpass'
      lp.frequency.value = 3000

      const gain = ac.createGain()
      gain.gain.setValueAtTime(0, now + delay)
      gain.gain.linearRampToValueAtTime(0.09, now + delay + 0.02)
      gain.gain.exponentialRampToValueAtTime(0.001, now + delay + (long ? 1.2 : 0.22))

      osc.connect(lp).connect(gain).connect(ac.destination)
      osc.start(now + delay)
      osc.stop(now + delay + (long ? 1.25 : 0.25))
    })

    setTimeout(() => playCoinCascade(24), 600)
  }

  // ─── Roulette Sounds ──────────────────────────────────────

  /** Low bearing rumble while the roulette wheel spins */
  function playWheelSpin() {
    const ac = getCtx()
    const now = ac.currentTime

    const noise = ac.createBufferSource()
    noise.buffer = noiseBuffer(3.8, ac.sampleRate)

    const lp = ac.createBiquadFilter()
    lp.type = 'lowpass'
    lp.frequency.setValueAtTime(320, now)
    lp.frequency.exponentialRampToValueAtTime(120, now + 3.5)

    const gain = ac.createGain()
    gain.gain.setValueAtTime(0.08, now)
    gain.gain.linearRampToValueAtTime(0.12, now + 0.5)
    gain.gain.exponentialRampToValueAtTime(0.001, now + 3.7)

    noise.connect(lp).connect(gain).connect(ac.destination)
    noise.start(now)
    noise.stop(now + 3.8)
  }

  /** Whirring sound of the ball rolling along the track */
  function playBallRoll() {
    const ac = getCtx()
    const now = ac.currentTime

    const noise = ac.createBufferSource()
    noise.buffer = noiseBuffer(3.0, ac.sampleRate)

    const bp = ac.createBiquadFilter()
    bp.type = 'bandpass'
    bp.frequency.setValueAtTime(4000, now)
    bp.frequency.exponentialRampToValueAtTime(1600, now + 2.7)
    bp.Q.value = 4.0

    const gain = ac.createGain()
    gain.gain.setValueAtTime(0.05, now)
    gain.gain.linearRampToValueAtTime(0.09, now + 0.3)
    gain.gain.exponentialRampToValueAtTime(0.001, now + 2.9)

    noise.connect(bp).connect(gain).connect(ac.destination)
    noise.start(now)
    noise.stop(now + 3.0)
  }

  /** Sharp click when the ball bounces on the pocket frets */
  function playBallBounce() {
    const ac = getCtx()
    const now = ac.currentTime

    const osc = ac.createOscillator()
    osc.type = 'sine'
    osc.frequency.setValueAtTime(2600 + Math.random() * 800, now)
    osc.frequency.exponentialRampToValueAtTime(1200, now + 0.04)

    const gain = ac.createGain()
    gain.gain.setValueAtTime(0.18, now)
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05)

    osc.connect(gain).connect(ac.destination)
    osc.start(now)
    osc.stop(now + 0.06)

    const noise = ac.createBufferSource()
    noise.buffer = noiseBuffer(0.03, ac.sampleRate)
    const bp = ac.createBiquadFilter()
    bp.type = 'bandpass'
    bp.frequency.value = 3200
    bp.Q.value = 3
    const nGain = ac.createGain()
    nGain.gain.setValueAtTime(0.1, now)
    nGain.gain.exponentialRampToValueAtTime(0.001, now + 0.03)
    noise.connect(bp).connect(nGain).connect(ac.destination)
    noise.start(now)
    noise.stop(now + 0.035)
  }

  /** Solid settling sound when the ball lands in a pocket */
  function playBallPocket() {
    const ac = getCtx()
    const now = ac.currentTime

    for (let i = 0; i < 2; i++) {
      const delay = i * 0.065
      const osc = ac.createOscillator()
      osc.type = 'triangle'
      osc.frequency.setValueAtTime(420 - i * 80, now + delay)
      osc.frequency.exponentialRampToValueAtTime(110, now + delay + 0.07)

      const gain = ac.createGain()
      gain.gain.setValueAtTime(0.2 - i * 0.07, now + delay)
      gain.gain.exponentialRampToValueAtTime(0.001, now + delay + 0.08)

      osc.connect(gain).connect(ac.destination)
      osc.start(now + delay)
      osc.stop(now + delay + 0.09)
    }
  }

  // ─── Dice (Craps) Sounds ────────────────────────────────────

  /** Rhythmic acrylic dice shake inside the cup / hand */
  function playDiceShake() {
    const ac = getCtx()
    const now = ac.currentTime

    for (let i = 0; i < 4; i++) {
      const delay = i * 0.055 + (Math.random() * 0.02)
      // Acrylic rattle click
      const osc = ac.createOscillator()
      osc.type = 'triangle'
      osc.frequency.setValueAtTime(1400 + Math.random() * 800, now + delay)
      osc.frequency.exponentialRampToValueAtTime(400, now + delay + 0.03)

      const gain = ac.createGain()
      gain.gain.setValueAtTime(0.18, now + delay)
      gain.gain.exponentialRampToValueAtTime(0.001, now + delay + 0.035)

      osc.connect(gain).connect(ac.destination)
      osc.start(now + delay)
      osc.stop(now + delay + 0.04)

      // Little noise burst for the impact
      const nSrc = ac.createBufferSource()
      nSrc.buffer = noiseBuffer(0.02, ac.sampleRate)
      const bp = ac.createBiquadFilter()
      bp.type = 'bandpass'
      bp.frequency.value = 2800 + Math.random() * 600
      bp.Q.value = 3.5
      const nGain = ac.createGain()
      nGain.gain.setValueAtTime(0.12, now + delay)
      nGain.gain.exponentialRampToValueAtTime(0.001, now + delay + 0.02)
      nSrc.connect(bp).connect(nGain).connect(ac.destination)
      nSrc.start(now + delay)
      nSrc.stop(now + delay + 0.025)
    }
  }

  /** Realistic tumbling clatter of two dice bouncing across the felt table */
  function playDiceRoll() {
    const ac = getCtx()
    const now = ac.currentTime

    // Series of 6 micro-impacts simulating bouncing and settling
    const bounces = [0.0, 0.08, 0.17, 0.28, 0.40, 0.52]
    bounces.forEach((delay, idx) => {
      const vol = Math.max(0.04, 0.28 - idx * 0.04)
      const freq = 1100 + Math.random() * 500 - idx * 80

      const osc = ac.createOscillator()
      osc.type = 'triangle'
      osc.frequency.setValueAtTime(freq, now + delay)
      osc.frequency.exponentialRampToValueAtTime(220, now + delay + 0.045)

      const gain = ac.createGain()
      gain.gain.setValueAtTime(vol, now + delay)
      gain.gain.exponentialRampToValueAtTime(0.001, now + delay + 0.05)

      osc.connect(gain).connect(ac.destination)
      osc.start(now + delay)
      osc.stop(now + delay + 0.055)

      // Felt thud
      const thud = ac.createOscillator()
      thud.type = 'sine'
      thud.frequency.setValueAtTime(180 - idx * 10, now + delay)
      thud.frequency.exponentialRampToValueAtTime(50, now + delay + 0.06)

      const thudGain = ac.createGain()
      thudGain.gain.setValueAtTime(vol * 0.9, now + delay)
      thudGain.gain.exponentialRampToValueAtTime(0.001, now + delay + 0.06)

      thud.connect(thudGain).connect(ac.destination)
      thud.start(now + delay)
      thud.stop(now + delay + 0.065)
    })
  }

  /** Seven-out dramatic descending sting */
  function playSevenOut() {
    const ac = getCtx()
    const now = ac.currentTime

    const freqs = [380, 330, 260]
    freqs.forEach((f, i) => {
      const osc = ac.createOscillator()
      osc.type = 'sawtooth'
      osc.frequency.setValueAtTime(f, now + i * 0.12)

      const filter = ac.createBiquadFilter()
      filter.type = 'lowpass'
      filter.frequency.setValueAtTime(800, now + i * 0.12)
      filter.frequency.exponentialRampToValueAtTime(250, now + i * 0.12 + 0.2)

      const gain = ac.createGain()
      gain.gain.setValueAtTime(0.16, now + i * 0.12)
      gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.12 + 0.22)

      osc.connect(filter).connect(gain).connect(ac.destination)
      osc.start(now + i * 0.12)
      osc.stop(now + i * 0.12 + 0.24)
    })
  }

  return {
    playCardDeal,
    playCardFlip,
    playCardSlide,
    playChipClick,
    playChipStack,
    playShuffle,
    playWin,
    playBlackjack,
    playBust,
    playDraw,
    playButtonClick,
    playBetPlace,
    playReelTick,
    playReelStop,
    playLeverPull,
    playCoinCascade,
    playJackpot,
    playWheelSpin,
    playBallRoll,
    playBallBounce,
    playBallPocket,
    playDiceShake,
    playDiceRoll,
    playSevenOut,
  }
}

