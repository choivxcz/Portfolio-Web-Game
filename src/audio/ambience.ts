/**
 * Water sounds, synthesized in the browser (no audio files): a deep roar for the
 * waterfall, slow lapping for the lake and stream, and a bright trickle for the
 * fountains. Each layer is filtered noise; its loudness follows how close the
 * explorer is to that kind of water (set every few frames with `setLevels`).
 */

type Layer = { gain: GainNode };

/** Seconds of looping noise. Brown noise is deep and soft; white is bright. */
function noiseBuffer(ctx: BaseAudioContext, seconds: number, kind: "white" | "brown") {
  const len = Math.floor(ctx.sampleRate * seconds);
  const buf = ctx.createBuffer(2, len, ctx.sampleRate);
  for (let c = 0; c < 2; c++) {
    const d = buf.getChannelData(c);
    let last = 0;
    for (let i = 0; i < len; i++) {
      const w = Math.random() * 2 - 1;
      if (kind === "white") d[i] = w * 0.5;
      else {
        last = (last + 0.02 * w) / 1.02;
        d[i] = last * 3.5;
      }
    }
    // fade the loop seam so it never clicks
    const f = Math.min(2048, len >> 4);
    for (let i = 0; i < f; i++) {
      const k = i / f;
      d[i] *= k;
      d[len - 1 - i] *= k;
    }
  }
  return buf;
}

class Ambience {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private fall: Layer | null = null;
  private lake: Layer | null = null;
  private fountain: Layer | null = null;
  private enabled = true;
  private volume = 0.5;

  /** Call from a user gesture (browsers only allow sound after one). */
  start() {
    if (!this.ctx) {
      const Ctx = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!Ctx) return;
      this.ctx = new Ctx();
      this.master = this.ctx.createGain();
      this.master.gain.value = 0;
      this.master.connect(this.ctx.destination);
      this.build();
    }
    if (this.ctx.state !== "running" && !document.hidden) void this.ctx.resume().catch(() => undefined);
    this.fadeMaster(this.enabled ? this.volume : 0, 1.5);
  }

  set(enabled: boolean, volume: number) {
    this.enabled = enabled;
    this.volume = volume;
    this.fadeMaster(enabled ? volume : 0, 0.6);
  }

  setHidden(hidden: boolean) {
    if (!this.ctx) return;
    if (hidden) void this.ctx.suspend();
    else if (this.enabled) void this.ctx.resume();
  }

  /** 0..1 closeness to the waterfall, the lake or stream, and the nearest fountain. */
  setLevels(fall: number, lake: number, fountain: number) {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    this.fall?.gain.gain.setTargetAtTime(fall * 0.9, now, 0.35);
    this.lake?.gain.gain.setTargetAtTime(lake * 1.0, now, 0.5);
    this.fountain?.gain.gain.setTargetAtTime(fountain * 0.4, now, 0.3);
  }

  private build() {
    const ctx = this.ctx!;
    const out = this.master!;
    const brown = noiseBuffer(ctx, 6, "brown");
    const white = noiseBuffer(ctx, 5, "white");
    const loop = (buf: AudioBuffer, offset = 0) => {
      const s = ctx.createBufferSource();
      s.buffer = buf;
      s.loop = true;
      s.start(0, offset);
      return s;
    };
    const layer = (): Layer => {
      const gain = ctx.createGain();
      gain.gain.value = 0;
      gain.connect(out);
      return { gain };
    };

    // waterfall: a deep body plus a hissing top, with a slow surge
    this.fall = layer();
    const body = ctx.createBiquadFilter();
    body.type = "lowpass";
    body.frequency.value = 700;
    loop(brown).connect(body).connect(this.fall.gain);
    const hiss = ctx.createBiquadFilter();
    hiss.type = "bandpass";
    hiss.frequency.value = 1900;
    hiss.Q.value = 0.5;
    const hissGain = ctx.createGain();
    hissGain.gain.value = 0.35;
    loop(white, 1.3).connect(hiss).connect(hissGain).connect(this.fall.gain);
    const surge = ctx.createOscillator();
    surge.frequency.value = 0.11;
    const surgeDepth = ctx.createGain();
    surgeDepth.gain.value = 0.12;
    surge.connect(surgeDepth).connect(this.fall.gain.gain);
    surge.start();

    // lake and stream: soft lapping, swelling and ebbing like small waves
    this.lake = layer();
    const lap = ctx.createBiquadFilter();
    lap.type = "bandpass";
    lap.frequency.value = 520;
    lap.Q.value = 0.7;
    const lapAmp = ctx.createGain();
    lapAmp.gain.value = 0.9;
    loop(brown, 2.7).connect(lap).connect(lapAmp).connect(this.lake.gain);
    // small waves breaking on the shore: a brighter wash that rises and falls with them
    const wash = ctx.createBiquadFilter();
    wash.type = "bandpass";
    wash.frequency.value = 1400;
    wash.Q.value = 0.8;
    const washAmp = ctx.createGain();
    washAmp.gain.value = 0.25;
    loop(white, 0.9).connect(wash).connect(washAmp).connect(this.lake.gain);
    const swell = ctx.createOscillator();
    swell.frequency.value = 0.18;
    const swellDepth = ctx.createGain();
    swellDepth.gain.value = 0.22;
    swell.connect(swellDepth).connect(washAmp.gain);
    swell.start();
    for (const [hz, depth] of [
      [0.23, 0.3],
      [0.41, 0.18],
    ]) {
      const o = ctx.createOscillator();
      o.frequency.value = hz;
      const g = ctx.createGain();
      g.gain.value = depth;
      o.connect(g).connect(lapAmp.gain);
      o.start();
    }

    // fountain: a bright, fluttering trickle
    this.fountain = layer();
    const trickle = ctx.createBiquadFilter();
    trickle.type = "bandpass";
    trickle.frequency.value = 2800;
    trickle.Q.value = 1.1;
    const flutter = ctx.createGain();
    flutter.gain.value = 0.6;
    loop(white, 3.1).connect(trickle).connect(flutter).connect(this.fountain.gain);
    const f1 = ctx.createOscillator();
    f1.frequency.value = 6.5;
    const f1d = ctx.createGain();
    f1d.gain.value = 0.25;
    f1.connect(f1d).connect(flutter.gain);
    f1.start();
  }

  private fadeMaster(v: number, seconds: number) {
    if (!this.ctx || !this.master) return;
    const now = this.ctx.currentTime;
    const g = this.master.gain;
    g.cancelScheduledValues(now);
    g.setValueAtTime(g.value, now);
    g.linearRampToValueAtTime(v, now + seconds);
  }
}

export const ambience = new Ambience();
