/* ══════════════════════════════════════════════════════════════════════════
   Pixel Factory 95 — WebAudio sound engine.
   No samples, no orchestral score: everything is synthesised on the fly with
   plain oscillators/gains, PC-speaker/Sound-Blaster style — short, cheap,
   1996-appropriate. A single shared AudioContext is created lazily on first
   user gesture so the browser autoplay policy never blocks it.
   ═════════════════════════════════════════════════════════════════════════ */

class PixelAudioEngine {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private musicGain: GainNode | null = null;
  sound = true;
  music = true;
  private musicTimer: number | null = null;
  private musicStep = 0;

  private ac(): AudioContext {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      this.master = this.ctx.createGain();
      this.master.gain.value = 0.5;
      this.master.connect(this.ctx.destination);
      this.musicGain = this.ctx.createGain();
      this.musicGain.gain.value = 0.16;
      this.musicGain.connect(this.master);
    }
    if (this.ctx.state === 'suspended') this.ctx.resume().catch(() => {});
    return this.ctx;
  }

  private tone(
    freq: number, start: number, dur: number,
    { type = 'square' as OscillatorType, gain = 0.09, glideTo, dest }: {
      type?: OscillatorType; gain?: number; glideTo?: number; dest?: GainNode;
    } = {},
  ) {
    if (!this.sound) return;
    const ac = this.ac();
    const osc = ac.createOscillator();
    const g = ac.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, start);
    if (glideTo) osc.frequency.exponentialRampToValueAtTime(glideTo, start + dur);
    g.gain.setValueAtTime(0.0001, start);
    g.gain.linearRampToValueAtTime(gain, start + Math.min(0.012, dur * 0.3));
    g.gain.exponentialRampToValueAtTime(0.0001, start + dur);
    osc.connect(g);
    g.connect(dest || this.master!);
    osc.start(start);
    osc.stop(start + dur + 0.02);
  }

  private noiseBurst(start: number, dur: number, gain = 0.06) {
    if (!this.sound) return;
    const ac = this.ac();
    const bufferSize = Math.max(1, Math.floor(ac.sampleRate * dur));
    const buffer = ac.createBuffer(1, bufferSize, ac.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
    const src = ac.createBufferSource();
    src.buffer = buffer;
    const g = ac.createGain();
    g.gain.setValueAtTime(gain, start);
    g.gain.exponentialRampToValueAtTime(0.0001, start + dur);
    src.connect(g); g.connect(this.master!);
    src.start(start); src.stop(start + dur + 0.02);
  }

  click() {
    if (!this.sound) return;
    const t = this.ac().currentTime;
    this.tone(920, t, 0.035, { type: 'square', gain: 0.05 });
  }

  buttonHover() {
    if (!this.sound) return;
    const t = this.ac().currentTime;
    this.tone(560, t, 0.02, { type: 'triangle', gain: 0.02 });
  }

  workerComplete() {
    if (!this.sound) return;
    const t = this.ac().currentTime;
    [[523.25, 0], [659.25, 0.05], [783.99, 0.1]].forEach(([f, d]) =>
      this.tone(f, t + d, 0.14, { type: 'triangle', gain: 0.08 }));
  }

  workerWrong() {
    if (!this.sound) return;
    const t = this.ac().currentTime;
    this.tone(220, t, 0.16, { type: 'sawtooth', gain: 0.07, glideTo: 140 });
  }

  workerMissed() {
    if (!this.sound) return;
    const t = this.ac().currentTime;
    this.tone(180, t, 0.22, { type: 'sawtooth', gain: 0.06, glideTo: 90 });
  }

  diskAccess() {
    if (!this.sound) return;
    const t = this.ac().currentTime;
    for (let i = 0; i < 5; i++) this.noiseBurst(t + i * 0.028, 0.02, 0.035);
  }

  printer() {
    if (!this.sound) return;
    const t = this.ac().currentTime;
    for (let i = 0; i < 6; i++) this.tone(180 + (i % 2) * 60, t + i * 0.05, 0.045, { type: 'square', gain: 0.045 });
  }

  notification() {
    if (!this.sound) return;
    const t = this.ac().currentTime;
    this.tone(784, t, 0.09, { type: 'sine', gain: 0.07 });
    this.tone(1046.5, t + 0.09, 0.14, { type: 'sine', gain: 0.07 });
  }

  errorBeep() {
    if (!this.sound) return;
    const t = this.ac().currentTime;
    this.tone(200, t, 0.09, { type: 'square', gain: 0.08 });
    this.tone(200, t + 0.12, 0.09, { type: 'square', gain: 0.08 });
  }

  combo(step = 5) {
    if (!this.sound) return;
    const t = this.ac().currentTime;
    const base = 440 + Math.min(step, 10) * 40;
    this.tone(base, t, 0.08, { type: 'square', gain: 0.05 });
  }

  overloadAlarm() {
    if (!this.sound) return;
    const t = this.ac().currentTime;
    this.tone(700, t, 0.12, { type: 'sawtooth', gain: 0.06, glideTo: 500 });
    this.tone(700, t + 0.16, 0.12, { type: 'sawtooth', gain: 0.06, glideTo: 500 });
  }

  moduleStartup() {
    if (!this.sound) return;
    const t = this.ac().currentTime;
    this.tone(220, t, 0.12, { type: 'triangle', gain: 0.05, glideTo: 660 });
  }

  powerup() {
    if (!this.sound) return;
    const t = this.ac().currentTime;
    [523.25, 659.25, 783.99, 1046.5].forEach((f, i) =>
      this.tone(f, t + i * 0.045, 0.11, { type: 'square', gain: 0.055 }));
  }

  gameOver() {
    if (!this.sound) return;
    const t = this.ac().currentTime;
    [392, 349.2, 293.7, 220].forEach((f, i) =>
      this.tone(f, t + i * 0.16, 0.22, { type: 'triangle', gain: 0.07 }));
  }

  /* ── light MIDI-inspired background loop ─────────────────────────────── */
  private melody = [523.25, 587.33, 659.25, 523.25, 659.25, 587.33, 493.88, 440.0];

  startMusic() {
    if (this.musicTimer != null) return;
    const step = () => {
      if (this.music) {
        const ac = this.ac();
        const t = ac.currentTime + 0.02;
        const f = this.melody[this.musicStep % this.melody.length];
        this.tone(f, t, 0.32, { type: 'triangle', gain: 0.05, dest: this.musicGain! });
        this.tone(f / 2, t, 0.32, { type: 'sine', gain: 0.03, dest: this.musicGain! });
        this.musicStep++;
      }
      this.musicTimer = window.setTimeout(step, 380);
    };
    step();
  }

  stopMusic() {
    if (this.musicTimer != null) { clearTimeout(this.musicTimer); this.musicTimer = null; }
  }
}

export const audio = new PixelAudioEngine();
