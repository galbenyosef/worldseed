// index-inline-2 126 — gain
// Lines 62741-63024 of readable/index-inline-2.pretty.js (statement-aligned).
  class Sound {
    constructor() {
      this.ctx = null;
      this.master = null;
      this.waves = null;
      this.noiseBuf = null;
      this.vol = 0.16;
      this.on = true;
      try {
        const v = localStorage.getItem(SND_KEY);
        if (v === "off") this.on = false;
      } catch (e) {
        /* no storage: sound on */
      }
      this.lastBlip = 0;
      this.count = 0; // how many sounds were asked for (the tests listen with this)
      this.log = [];
    }
    // the first click or key: make the sound chip (or wake it up again)
    wake() {
      try {
        if (!this.ctx) {
          const AC = window.AudioContext || window.webkitAudioContext;
          if (!AC) return;
          this.ctx = new AC();
          this.master = this.ctx.createGain();
          this.master.gain.value = this.on ? this.vol : 0;
          this.master.connect(this.ctx.destination);
          this.waves = {};
          // pulse waves at 12.5%, 25% and 50% duty, as a handheld's sound chip makes them
          for (const duty of [0.125, 0.25, 0.5]) {
            const N = 32,
              re = new Float32Array(N),
              im = new Float32Array(N);
            for (let k = 1; k < N; k++)
              im[k] = (2 / (k * Math.PI)) * Math.sin(k * Math.PI * duty);
            this.waves[duty] = this.ctx.createPeriodicWave(re, im);
          }
          // a second of white noise, for hiss, thuds and the rush of an arrow
          const len = this.ctx.sampleRate;
          this.noiseBuf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
          const d = this.noiseBuf.getChannelData(0);
          for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
        }
        if (this.ctx.state === "suspended") this.ctx.resume();
      } catch (e) {
        this.ctx = null;
      }
    }
    setOn(on) {
      this.on = !!on;
      try {
        localStorage.setItem(SND_KEY, this.on ? "on" : "off");
      } catch (e) {
        /* not remembered, then */
      }
      if (this.master)
        this.master.gain.setTargetAtTime(
          this.on ? this.vol : 0,
          this.ctx.currentTime,
          0.02,
        );
    }
    toggle() {
      this.setOn(!this.on);
      return this.on;
    }
    ready() {
      return !!(this.ctx && this.on && this.ctx.state === "running");
    }
    // one note: a pulse wave with a quick rise and a fall, sliding from f to f2 if asked
    tone(f, dur, o = {}) {
      if (!this.ready()) return;
      const c = this.ctx,
        t = c.currentTime + (o.at || 0);
      const osc = c.createOscillator(),
        g = c.createGain();
      osc.setPeriodicWave(this.waves[o.duty || 0.5]);
      osc.frequency.setValueAtTime(f, t);
      if (o.to)
        osc.frequency.exponentialRampToValueAtTime(Math.max(20, o.to), t + dur);
      const peak = o.gain ?? 0.6;
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(peak, t + 0.004);
      g.gain.setValueAtTime(peak, t + Math.max(0.005, dur * (o.hold ?? 0.35)));
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      osc.connect(g);
      g.connect(this.master);
      osc.start(t);
      osc.stop(t + dur + 0.02);
    }
    // a burst of noise, bright or dull (a low-pass over it)
    hiss(dur, o = {}) {
      if (!this.ready()) return;
      const c = this.ctx,
        t = c.currentTime + (o.at || 0);
      const src = c.createBufferSource(),
        g = c.createGain(),
        lp = c.createBiquadFilter();
      src.buffer = this.noiseBuf;
      lp.type = "lowpass";
      lp.frequency.setValueAtTime(o.cut || 4000, t);
      if (o.cutTo) lp.frequency.exponentialRampToValueAtTime(o.cutTo, t + dur);
      const peak = o.gain ?? 0.5;
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(peak, t + 0.003);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      src.connect(lp);
      lp.connect(g);
      g.connect(this.master);
      src.start(t, Math.random() * 0.5);
      src.stop(t + dur + 0.02);
    }
    // a sound that goes on (rain, wind): a loop of noise through its own filters, eased up and down to
    // the level asked for (0 lets it fade out and stop)
    amb(key, level, o = {}) {
      if (!this.ctx || !this.noiseBuf) return;
      const c = this.ctx,
        A = this.ambs || (this.ambs = {});
      let a = A[key];
      if (!a && level <= 0.001) return;
      if (!a) {
        const src = c.createBufferSource(),
          g = c.createGain(),
          f1 = c.createBiquadFilter(),
          f2 = c.createBiquadFilter();
        src.buffer = this.noiseBuf;
        src.loop = true;
        f1.type = o.type || "bandpass";
        f1.frequency.value = o.freq || 1800;
        f1.Q.value = o.q || 0.7;
        f2.type = "highpass";
        f2.frequency.value = o.hi || 60;
        g.gain.value = 0.0001;
        src.connect(f1);
        f1.connect(f2);
        f2.connect(g);
        g.connect(this.master);
        src.start();
        a = A[key] = { src, g, f1, level: 0 };
      }
      const target = this.on ? Math.max(0.0001, level) : 0.0001;
      a.g.gain.setTargetAtTime(target, c.currentTime, o.ease || 0.8);
      if (o.freq) a.f1.frequency.setTargetAtTime(o.freq, c.currentTime, 0.5);
      a.level = level;
      if (level <= 0.001) {
        clearTimeout(a.stop);
        a.stop = setTimeout(() => {
          if (A[key] === a && a.level <= 0.001) {
            try {
              a.src.stop();
            } catch (e) {
              /* gone */
            }
            delete A[key];
          }
        }, 4000);
      }
    }
    // thunder: a crack if it was close, then a long low roll
    thunder(near, at = 0) {
      if (!this.ready()) return;
      if (near > 0.6)
        this.hiss(0.16, { cut: 5000, cutTo: 900, gain: 0.5 * near, at });
      this.hiss(2.2 + (1 - near) * 1.6, {
        cut: 260 + near * 300,
        cutTo: 70,
        gain: 0.25 + 0.45 * near,
        at: at + (near > 0.6 ? 0.08 : 0),
      });
      this.hiss(1.4, {
        cut: 140,
        cutTo: 50,
        gain: 0.3 * near + 0.1,
        at: at + 0.5 + Math.random() * 0.5,
      });
    }
    // the bone flute: a soft, breathy note with a slow waver in it, the way an old console's flute
    // sounded (a sine with a little of its octave, a puff of breath at the start)
    flute(f, dur = 0.42, o = {}) {
      if (!this.ready()) return;
      const c = this.ctx,
        t = c.currentTime + (o.at || 0);
      const a = c.createOscillator(),
        b = c.createOscillator(),
        lfo = c.createOscillator(),
        lg = c.createGain(),
        g = c.createGain(),
        gb = c.createGain();
      a.type = "sine";
      b.type = "triangle";
      a.frequency.setValueAtTime(f, t);
      b.frequency.setValueAtTime(f * 2, t);
      lfo.frequency.setValueAtTime(5.4, t);
      lg.gain.setValueAtTime(0, t);
      lg.gain.linearRampToValueAtTime(f * 0.007, t + 0.18);
      lfo.connect(lg);
      lg.connect(a.frequency);
      lg.connect(b.frequency);
      gb.gain.value = 0.1;
      const peak = o.gain ?? 0.55;
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(peak, t + 0.045);
      g.gain.setValueAtTime(peak * 0.85, t + Math.max(0.06, dur - 0.12));
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      a.connect(g);
      b.connect(gb);
      gb.connect(g);
      g.connect(this.master);
      for (const o2 of [a, b, lfo]) {
        o2.start(t);
        o2.stop(t + dur + 0.03);
      }
      this.hiss(0.07, { cut: 3400, cutTo: 1100, gain: 0.07, at: o.at || 0 });
    }
    // a song you know, played back the way it should sound: the tune on the flute, and a quiet line under it
    song(freqs, o = {}) {
      const step = o.step || 0.34;
      freqs.forEach((f, k) => {
        this.flute(f, step * 1.15, { at: k * step, gain: 0.5 });
        this.tone(f / 2, step * 0.9, {
          duty: 0.5,
          gain: 0.12,
          at: k * step,
          hold: 0.7,
        });
      });
      return freqs.length * step;
    }
    // a few notes one after another: [[freq, dur], ...]
    tune(notes, o = {}) {
      let at = o.at || 0;
      for (const [f, d] of notes) {
        if (f)
          this.tone(f, d * 0.92, {
            duty: o.duty || 0.25,
            gain: o.gain ?? 0.45,
            at,
            hold: 0.6,
          });
        at += d;
      }
    }
    play(name, arg) {
      this.count++;
      this.log.push(name);
      if (this.log.length > 60) this.log.shift();
      const fx = SOUNDS[name];
      if (fx && this.ready()) {
        try {
          fx(this, arg);
        } catch (e) {
          /* a sound is never worth an error */
        }
      }
    }
    // text typing out: a tick every few letters, in the speaker's own voice (narration lower and softer)
    blip(voice) {
      const now = performance.now();
      if (now - this.lastBlip < 52) return;
      this.lastBlip = now;
      this.count++;
      if (!this.ready()) return;
      const f = voice ? voice : 330;
      this.tone(semi(f, Math.floor(Math.random() * 3) - 1), 0.034, {
        duty: voice ? 0.25 : 0.125,
        gain: voice ? 0.32 : 0.22,
        hold: 0.25,
      });
    }
    // each speaker's pitch, from their name: high and low voices, never the same two for the same name
    voiceOf(name) {
      if (!name) return 0;
      let h = 2166136261;
      for (let i = 0; i < name.length; i++) {
        h ^= name.charCodeAt(i);
        h = Math.imul(h, 16777619);
      }
      const steps = [0, 2, 4, 5, 7, 9, 11, 12, 14, 16];
      return semi(392, steps[(h >>> 0) % steps.length]);
    }
  }

  // the sounds, by name
