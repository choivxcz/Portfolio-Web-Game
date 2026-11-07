/**
 * An original pastoral theme ("Valley Breeze"), synthesized in the browser: a flute
 * melody over harp arpeggios, soft strings and a plucked bass, in a gentle 3/4.
 * It is rendered once with an OfflineAudioContext, its reverb tail folded back onto
 * the start so the loop is seamless, then played on repeat. No audio files needed.
 */
const BPM = 84;
const BEAT = 60 / BPM;
const BAR = BEAT * 3;
const RATE = 32000;
const TAIL = 3.5; // seconds of reverb rendered past the end, folded onto the start

const hz = (m: number) => 440 * Math.pow(2, (m - 69) / 12);

/* Notes as MIDI numbers (60 = middle C). D major. */
const [Cs4, D4, E4, Fs4, G4, A4, B4, Cs5, D5, E5, Fs5, G5, A5, B5, Cs6, D6] = [61, 62, 64, 66, 67, 69, 71, 73, 74, 76, 78, 79, 81, 83, 85, 86];
const R = 0; // rest

/** Chords: bass note and the upper chord tones (one chord per bar, or two half-bar chords). */
type Chord = { bass: number; tones: number[] };
const D: Chord = { bass: 38, tones: [D4, Fs4, A4] };
const AoverCs: Chord = { bass: 37, tones: [Cs4, E4, A4] };
const Bm: Chord = { bass: 35, tones: [D4, Fs4, B4] };
const G: Chord = { bass: 43, tones: [D4, G4, B4] };
const DoverFs: Chord = { bass: 42, tones: [D4, Fs4, A4] };
const Em: Chord = { bass: 40, tones: [E4, G4, B4] };
const A: Chord = { bass: 45, tones: [Cs4, E4, A4] };
const Fsm: Chord = { bass: 42, tones: [Cs4, Fs4, A4] };

type Bar = { chords: Chord[]; melody: [number, number][] }; // melody: [note, beats]

const SONG: Bar[] = [
  // A — the theme
  { chords: [D], melody: [[A4, 1], [D5, 1], [Fs5, 1]] },
  { chords: [AoverCs], melody: [[E5, 2], [Cs5, 1]] },
  { chords: [Bm], melody: [[D5, 1], [Fs5, 1], [B5, 1]] },
  { chords: [G], melody: [[A5, 2], [G5, 1]] },
  { chords: [DoverFs], melody: [[Fs5, 1.5], [E5, 0.5], [D5, 1]] },
  { chords: [Em], melody: [[E5, 1], [G5, 1], [B4, 1]] },
  { chords: [A], melody: [[E5, 1.5], [Cs5, 0.5], [E5, 1]] },
  { chords: [D], melody: [[D5, 3]] },
  // A' — the answer
  { chords: [D], melody: [[A4, 1], [D5, 1], [Fs5, 1]] },
  { chords: [AoverCs], melody: [[E5, 2], [A5, 1]] },
  { chords: [Bm], melody: [[Fs5, 1], [D5, 1], [B4, 1]] },
  { chords: [Fsm], melody: [[Cs5, 2], [A4, 1]] },
  { chords: [G], melody: [[B4, 1], [D5, 1], [G5, 1]] },
  { chords: [DoverFs], melody: [[Fs5, 1.5], [A5, 0.5], [Fs5, 1]] },
  { chords: [Em, A], melody: [[E5, 1], [G5, 0.5], [Fs5, 0.5], [E5, 1]] },
  { chords: [D], melody: [[D5, 2], [R, 1]] },
  // B — over the hills
  { chords: [G], melody: [[B5, 1.5], [A5, 0.5], [G5, 1]] },
  { chords: [A], melody: [[A5, 1], [E5, 1], [Cs5, 1]] },
  { chords: [Fsm], melody: [[Fs5, 1.5], [E5, 0.5], [Cs5, 1]] },
  { chords: [Bm], melody: [[D5, 2], [Fs5, 1]] },
  { chords: [Em], melody: [[G5, 1.5], [Fs5, 0.5], [E5, 1]] },
  { chords: [A], melody: [[Cs5, 1], [E5, 1], [A5, 1]] },
  { chords: [DoverFs, G], melody: [[Fs5, 1], [A5, 1], [B5, 1]] },
  { chords: [A], melody: [[A5, 2], [E5, 1]] },
  // A'' — the theme, an octave brighter, then home
  { chords: [D], melody: [[Fs5, 1], [A5, 1], [D6, 1]] },
  { chords: [AoverCs], melody: [[Cs6, 2], [A5, 1]] },
  { chords: [Bm], melody: [[B5, 1], [Fs5, 1], [D5, 1]] },
  { chords: [G], melody: [[G5, 1.5], [A5, 0.5], [B5, 1]] },
  { chords: [Em], melody: [[G5, 1], [E5, 1], [B4, 1]] },
  { chords: [A], melody: [[Cs5, 1.5], [E5, 0.5], [A5, 1]] },
  { chords: [D], melody: [[Fs5, 2], [E5, 1]] },
  { chords: [D], melody: [[D5, 3]] },
];

const LOOP = SONG.length * BAR;

/** A stereo hall reverb impulse: decaying noise, a little darker toward the end. */
function impulse(ctx: BaseAudioContext, seconds: number) {
  const n = Math.floor(ctx.sampleRate * seconds);
  const buf = ctx.createBuffer(2, n, ctx.sampleRate);
  for (let ch = 0; ch < 2; ch++) {
    const d = buf.getChannelData(ch);
    let lp = 0;
    for (let i = 0; i < n; i++) {
      const t = i / n;
      lp += (Math.random() * 2 - 1 - lp) * (0.9 - 0.75 * t);
      d[i] = lp * Math.pow(1 - t, 2.6);
    }
  }
  return buf;
}

export function renderSong(): Promise<AudioBuffer> {
  const ctx = new OfflineAudioContext(2, Math.ceil((LOOP + TAIL) * RATE), RATE);
  const master = ctx.createGain();
  master.gain.value = 0.9;
  const comp = ctx.createDynamicsCompressor();
  comp.threshold.value = -16;
  comp.ratio.value = 3;
  master.connect(comp).connect(ctx.destination);
  const reverb = ctx.createConvolver();
  reverb.buffer = impulse(ctx, 2.8);
  const wet = ctx.createGain();
  wet.gain.value = 0.42;
  reverb.connect(wet).connect(master);

  /** A shared channel per instrument: optional filter, pan, and a reverb send (few nodes = fast render). */
  const bus = (pan: number, send: number, lowpass?: number) => {
    const input = ctx.createGain();
    let head: AudioNode = input;
    if (lowpass) {
      const lp = ctx.createBiquadFilter();
      lp.type = "lowpass";
      lp.frequency.value = lowpass;
      lp.Q.value = 0.4;
      input.connect(lp);
      head = lp;
    }
    const p = ctx.createStereoPanner();
    p.pan.value = pan;
    head.connect(p).connect(master);
    const s = ctx.createGain();
    s.gain.value = send;
    head.connect(s).connect(reverb);
    return input;
  };
  const fluteBus = bus(0.08, 0.55, 3200);
  const harpBus = [bus(-0.15, 0.6), bus(0.3, 0.6)];
  const stringBus = bus(-0.25, 0.8, 1100);
  const bassBus = bus(0, 0.25, 600);

  const noise = ctx.createBuffer(1, Math.floor(RATE * 0.2), RATE);
  const nd = noise.getChannelData(0);
  for (let i = 0; i < nd.length; i++) nd[i] = Math.random() * 2 - 1;

  /** Flute: soft sine + a touch of triangle, breathy attack, vibrato that blooms on long notes. */
  const flute = (m: number, t: number, dur: number) => {
    const f = hz(m);
    const end = t + dur + 0.12;
    const env = ctx.createGain();
    env.gain.setValueAtTime(0, t);
    env.gain.linearRampToValueAtTime(0.19, t + 0.07);
    env.gain.setValueAtTime(0.17, t + Math.max(0.08, dur - 0.12));
    env.gain.linearRampToValueAtTime(0, t + dur + 0.1);
    env.connect(fluteBus);
    const vib = ctx.createOscillator();
    vib.frequency.value = 5.2;
    const depth = ctx.createGain();
    depth.gain.setValueAtTime(0, t);
    depth.gain.linearRampToValueAtTime(f * 0.004, t + Math.min(0.5, dur));
    vib.connect(depth);
    vib.start(t);
    vib.stop(end);
    for (const [type, mult, g] of [["sine", 1, 1], ["triangle", 2, 0.12]] as const) {
      const o = ctx.createOscillator();
      o.type = type;
      o.frequency.value = f * mult;
      depth.connect(o.frequency);
      if (mult === 1) {
        o.connect(env);
        o.onended = () => env.disconnect();
      }
      else {
        const og = ctx.createGain();
        og.gain.value = g;
        o.connect(og).connect(env);
      }
      o.start(t);
      o.stop(end);
    }
    const breath = ctx.createBufferSource();
    breath.buffer = noise;
    const bp = ctx.createBiquadFilter();
    bp.type = "bandpass";
    bp.frequency.value = f * 2;
    bp.Q.value = 1.2;
    const bg = ctx.createGain();
    bg.gain.setValueAtTime(0.05, t);
    bg.gain.exponentialRampToValueAtTime(0.001, t + 0.12);
    breath.connect(bp).connect(bg).connect(env);
    breath.start(t);
    breath.stop(t + 0.15);
  };

  /** Harp: a bright pluck that rings and fades (the octave partial fades first). */
  const harp = (m: number, t: number, vel: number, side: number) => {
    const f = hz(m);
    const env = ctx.createGain();
    env.gain.setValueAtTime(0, t);
    env.gain.linearRampToValueAtTime(0.11 * vel, t + 0.004);
    env.gain.exponentialRampToValueAtTime(0.0008, t + 1.8);
    env.connect(harpBus[side]);
    const o = ctx.createOscillator();
    o.frequency.value = f;
    o.connect(env);
    const o2 = ctx.createOscillator();
    o2.frequency.value = f * 2;
    const g2 = ctx.createGain();
    g2.gain.setValueAtTime(0.3, t);
    g2.gain.exponentialRampToValueAtTime(0.01, t + 0.35);
    o2.connect(g2).connect(env);
    o.start(t);
    o2.start(t);
    o.stop(t + 1.85);
    o2.stop(t + 0.4);
    o.onended = () => env.disconnect();
  };

  /** Strings: detuned saws, swelling in and out (filtered on their shared channel). */
  const strings = (m: number, t: number, dur: number) => {
    const env = ctx.createGain();
    env.gain.setValueAtTime(0, t);
    env.gain.linearRampToValueAtTime(0.022, t + 0.5);
    env.gain.setValueAtTime(0.022, t + dur - 0.2);
    env.gain.linearRampToValueAtTime(0, t + dur + 0.6);
    env.connect(stringBus);
    for (const cents of [-7, 6]) {
      const o = ctx.createOscillator();
      o.type = "sawtooth";
      o.frequency.value = hz(m);
      o.detune.value = cents;
      o.connect(env);
      o.start(t);
      o.stop(t + dur + 0.65);
      o.onended = () => env.disconnect();
    }
  };

  /** Bass: a round, plucked cello-like note. */
  const bass = (m: number, t: number) => {
    const env = ctx.createGain();
    env.gain.setValueAtTime(0, t);
    env.gain.linearRampToValueAtTime(0.2, t + 0.01);
    env.gain.exponentialRampToValueAtTime(0.001, t + BAR * 0.95);
    env.connect(bassBus);
    const o = ctx.createOscillator();
    o.type = "triangle";
    o.frequency.value = hz(m);
    o.connect(env);
    o.start(t);
    o.stop(t + BAR);
    o.onended = () => env.disconnect();
  };

  const scheduleBar = (b: number) => {
    const bar = SONG[b];
    const t0 = b * BAR;
    // melody
    let t = t0;
    for (const [m, beats] of bar.melody) {
      if (m) flute(m, t, beats * BEAT * 0.94);
      t += beats * BEAT;
    }
    // harmony: each chord covers the bar or half of it
    const span = BAR / bar.chords.length;
    bar.chords.forEach((c, ci) => {
      const ts = t0 + ci * span;
      bass(c.bass, ts);
      for (const m of c.tones) strings(m, ts, span);
      // harp: rising eighth notes through the chord, an octave above the strings
      const [x, y, z] = c.tones;
      const pattern = [x - 12, y - 12, z - 12, x, y, z, x + 12, z];
      const steps = Math.round(span / (BEAT / 2));
      for (let s = 0; s < steps; s++) {
        const m = pattern[s % pattern.length];
        harp(m, ts + s * (BEAT / 2), s === 0 ? 1 : 0.62, s % 2);
      }
    });
  };
  // Create each bar's notes just before it plays: nodes waiting for a far-off start
  // still cost processing time, so building the whole song up front renders far slower.
  scheduleBar(0);
  for (let b = 1; b < SONG.length; b++) {
    void ctx.suspend(b * BAR - 0.4).then(() => {
      scheduleBar(b);
      void ctx.resume();
    });
  }

  return ctx.startRendering().then((rendered) => {
    // fold the reverb tail back onto the start: a seamless loop
    const loopLen = Math.round(LOOP * RATE);
    const buf = new AudioBuffer({ numberOfChannels: 2, length: loopLen, sampleRate: RATE });
    for (let ch = 0; ch < 2; ch++) {
      const src = rendered.getChannelData(ch);
      const dst = buf.getChannelData(ch);
      dst.set(src.subarray(0, loopLen));
      for (let i = loopLen; i < src.length; i++) dst[i - loopLen] += src[i];
    }
    return buf;
  });
}

/** Background music player: starts on the first user gesture, follows the volume setting. */
class Music {
  private ctx: AudioContext | null = null;
  private gain: GainNode | null = null;
  private source: AudioBufferSourceNode | null = null;
  private loading: Promise<void> | null = null;
  private volume = 0.5;
  private enabled = false;
  private song: Promise<AudioBuffer> | null = null;

  /** Render the song ahead of time (no gesture needed), so it is ready when sound is allowed. */
  prepare() {
    if (!this.song) this.song = renderSong();
    return this.song;
  }

  /** Call from a user gesture (browsers only allow sound after one). */
  start() {
    // create/unlock the audio context on every gesture, even while muted, so that
    // turning the music on later works on browsers that need a gesture (Safari)
    if (!this.ctx) {
      const Ctx = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!Ctx) return;
      this.ctx = new Ctx();
      this.gain = this.ctx.createGain();
      this.gain.gain.value = 0;
      this.gain.connect(this.ctx.destination);
    }
    if (this.ctx.state === "suspended" && !document.hidden) void this.ctx.resume();
    if (!this.enabled) return;
    if (!this.source && !this.loading) {
      this.loading = this.prepare()
        .then((buf) => {
          if (!this.ctx || !this.gain) return;
          const s = this.ctx.createBufferSource();
          s.buffer = buf;
          s.loop = true;
          s.connect(this.gain);
          s.start();
          this.source = s;
          this.fadeTo(this.enabled ? this.volume : 0, 3);
        })
        .catch(() => {
          this.song = null; // try again on the next gesture
        })
        .finally(() => {
          this.loading = null;
        });
    } else {
      this.fadeTo(this.volume, 1.2);
    }
  }

  set(enabled: boolean, volume: number) {
    this.volume = volume;
    const was = this.enabled;
    this.enabled = enabled;
    if (!this.ctx) return;
    if (enabled && !was) this.start();
    else this.fadeTo(enabled ? volume : 0, enabled ? 0.3 : 0.8);
  }

  /** Pause while the tab is hidden; resume when it comes back. */
  setHidden(hidden: boolean) {
    if (!this.ctx) return;
    if (hidden) void this.ctx.suspend();
    else if (this.enabled) void this.ctx.resume();
  }

  private fadeTo(v: number, seconds: number) {
    if (!this.ctx || !this.gain) return;
    const now = this.ctx.currentTime;
    const g = this.gain.gain;
    g.cancelScheduledValues(now);
    g.setValueAtTime(g.value, now);
    g.linearRampToValueAtTime(v, now + seconds);
  }
}

export const music = new Music();
