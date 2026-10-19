/**
 * Web Audio API synthesized sounds (no external audio asset dependencies)
 */
class SoundService {
  private ctx: AudioContext | null = null

  constructor() {
    if (typeof window !== 'undefined') {
      const unlockAudio = () => {
        try {
          const ctx = this.getContext()
          if (ctx && ctx.state === 'suspended') {
            ctx.resume().catch(() => {})
          }
        } catch {
          // ignore
        }
        window.removeEventListener('click', unlockAudio)
        window.removeEventListener('touchstart', unlockAudio)
        window.removeEventListener('keydown', unlockAudio)
      }
      window.addEventListener('click', unlockAudio, { passive: true })
      window.addEventListener('touchstart', unlockAudio, { passive: true })
      window.addEventListener('keydown', unlockAudio, { passive: true })
    }
  }

  private getContext(): AudioContext | null {
    if (typeof window === 'undefined') return null
    try {
      if (!this.ctx || this.ctx.state === 'closed') {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext
        if (AudioCtx) {
          this.ctx = new AudioCtx()
        }
      }
      if (this.ctx && this.ctx.state === 'suspended') {
        this.ctx.resume().catch(() => {})
      }
    } catch {
      return null
    }
    return this.ctx
  }

  /**
   * Pleasant ascending harmonic chime for completing a task
   */
  playComplete(): void {
    const ctx = this.getContext()
    if (!ctx) return

    const now = ctx.currentTime
    const notes = [523.25, 659.25, 783.99, 1046.50] // C5, E5, G5, C6 (major arpeggio)
    
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()

      osc.type = 'sine'
      osc.frequency.setValueAtTime(freq, now + idx * 0.06)

      gain.gain.setValueAtTime(0, now + idx * 0.06)
      gain.gain.linearRampToValueAtTime(0.12, now + idx * 0.06 + 0.01)
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.06 + 0.35)

      osc.connect(gain)
      gain.connect(ctx.destination)

      osc.start(now + idx * 0.06)
      osc.stop(now + idx * 0.06 + 0.4)
    })
  }

  /**
   * Crisp double-tone for creating or checking off items
   */
  playSubtaskToggle(): void {
    const ctx = this.getContext()
    if (!ctx) return

    const now = ctx.currentTime
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()

    osc.type = 'triangle'
    osc.frequency.setValueAtTime(880, now)
    osc.frequency.exponentialRampToValueAtTime(1174.66, now + 0.08)

    gain.gain.setValueAtTime(0.08, now)
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15)

    osc.connect(gain)
    gain.connect(ctx.destination)

    osc.start(now)
    osc.stop(now + 0.16)
  }

  /**
   * Rich 3-tone notification alert chime (D5 -> A5 -> D6)
   */
  playReminder(): void {
    const ctx = this.getContext()
    if (!ctx) return

    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {})
    }

    const now = ctx.currentTime
    const tones = [
      { freq: 587.33, offset: 0, dur: 0.35, vol: 0.18 },   // D5
      { freq: 880.00, offset: 0.12, dur: 0.35, vol: 0.20 }, // A5
      { freq: 1174.66, offset: 0.24, dur: 0.60, vol: 0.24 } // D6
    ]

    tones.forEach(({ freq, offset, dur, vol }) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()

      osc.type = 'sine'
      osc.frequency.setValueAtTime(freq, now + offset)

      gain.gain.setValueAtTime(0, now + offset)
      gain.gain.linearRampToValueAtTime(vol, now + offset + 0.015)
      gain.gain.exponentialRampToValueAtTime(0.0001, now + offset + dur)

      osc.connect(gain)
      gain.connect(ctx.destination)

      osc.start(now + offset)
      osc.stop(now + offset + dur + 0.05)
    })
  }
}

export const soundService = new SoundService()
