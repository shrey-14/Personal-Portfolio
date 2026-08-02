/** Web Audio API wrapper for Neural Defense. Deliberately separate from the
 *  portfolio shell's own OSContext audio helpers — this module is meant to be
 *  self-contained and embeddable on its own. The AudioContext is created lazily
 *  and must be resumed from a user gesture (unlock()), per browser autoplay
 *  policy. Only a synthesized placeholder beep exists until real sfx/music
 *  assets land in a later milestone. */
export class AudioManager {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private musicGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;
  private muted = false;

  private ensureContext(): AudioContext {
    if (!this.ctx) {
      const AudioContextCtor = window.AudioContext ?? (window as typeof window & {
        webkitAudioContext?: typeof AudioContext;
      }).webkitAudioContext;
      this.ctx = new AudioContextCtor();

      this.masterGain = this.ctx.createGain();
      this.musicGain = this.ctx.createGain();
      this.sfxGain = this.ctx.createGain();
      this.musicGain.connect(this.masterGain);
      this.sfxGain.connect(this.masterGain);
      this.masterGain.connect(this.ctx.destination);
      this.masterGain.gain.value = this.muted ? 0 : 1;
    }
    return this.ctx;
  }

  /** Must be called from within a user gesture handler (click, keydown, …). */
  unlock(): void {
    const ctx = this.ensureContext();
    if (ctx.state === 'suspended') void ctx.resume();
  }

  setMuted(muted: boolean): void {
    this.muted = muted;
    if (this.masterGain) this.masterGain.gain.value = muted ? 0 : 1;
  }

  isMuted(): boolean {
    return this.muted;
  }

  /** Short synthesized square-wave beep — placeholder UI feedback (menu
   *  clicks, etc.) until real sound assets exist. */
  playBeep(frequency = 880, durationSeconds = 0.08, type: OscillatorType = 'square'): void {
    if (this.muted || !this.ctx || this.ctx.state !== 'running') return;
    const ctx = this.ctx;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.value = frequency;
    osc.connect(gain);
    gain.connect(this.sfxGain!);

    const t = ctx.currentTime;
    gain.gain.setValueAtTime(0.06, t);
    gain.gain.linearRampToValueAtTime(0, t + durationSeconds);
    osc.start(t);
    osc.stop(t + durationSeconds + 0.02);
  }

  dispose(): void {
    void this.ctx?.close();
    this.ctx = null;
    this.masterGain = null;
    this.musicGain = null;
    this.sfxGain = null;
  }
}
