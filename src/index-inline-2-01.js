// index-inline-2 01 — math
// Lines 11-353 of readable/index-inline-2.pretty.js (statement-aligned).
  function hashStr(str) {
    let h1 = 0xdeadbeef,
      h2 = 0x41c6ce57;
    for (let i = 0; i < str.length; i++) {
      const ch = str.charCodeAt(i);
      h1 = Math.imul(h1 ^ ch, 2654435761);
      h2 = Math.imul(h2 ^ ch, 1597334677);
    }
    h1 =
      Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^
      Math.imul(h2 ^ (h2 >>> 13), 3266489909);
    h2 =
      Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^
      Math.imul(h1 ^ (h1 >>> 13), 3266489909);
    return (h1 ^ (h2 >>> 3)) >>> 0;
  }

  // Integer hash for per-cell / per-pixel randomness (no state)
  function hashInt(a, b = 0, c = 0) {
    let h =
      Math.imul(a | 0, 0x27d4eb2d) ^
      Math.imul(b | 0, 0x165667b1) ^
      Math.imul(c | 0, 0x9e3779b1);
    h = Math.imul(h ^ (h >>> 15), 0x85ebca6b);
    h = Math.imul(h ^ (h >>> 13), 0xc2b2ae35);
    return (h ^ (h >>> 16)) >>> 0;
  }
  function hash01(a, b = 0, c = 0) {
    return hashInt(a, b, c) / 4294967296;
  }

  function mulberry32(a) {
    a = a >>> 0;
    return function () {
      a = (a + 0x6d2b79f5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  class Rng {
    constructor(seed) {
      this.f = mulberry32(seed);
    }
    float() {
      return this.f();
    }
    range(a, b) {
      return a + (b - a) * this.f();
    }
    int(a, b) {
      return a + Math.floor((b - a + 1) * this.f());
    }
    pick(arr) {
      return arr[Math.floor(arr.length * this.f()) % arr.length];
    }
    chance(p) {
      return this.f() < p;
    }
    normal() {
      const u = Math.max(1e-9, this.f()),
        v = this.f();
      return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
    }
    // biased toward the middle of [a,b]
    soft(a, b) {
      return a + ((b - a) * (this.f() + this.f() + this.f())) / 3;
    }
    shuffle(arr) {
      for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(this.f() * (i + 1));
        const t = arr[i];
        arr[i] = arr[j];
        arr[j] = t;
      }
      return arr;
    }
  }

  function normalizeSeed(text) {
    return String(text || "")
      .trim()
      .replace(/\s+/g, " ")
      .toLowerCase();
  }
  function subSeed(seedKey, name) {
    return hashStr(seedKey + "::" + name);
  }

  // ---------- names ----------
  const ONSET = [
    "b",
    "br",
    "c",
    "d",
    "dr",
    "f",
    "g",
    "gr",
    "h",
    "j",
    "k",
    "kr",
    "l",
    "m",
    "n",
    "p",
    "r",
    "s",
    "sh",
    "st",
    "t",
    "th",
    "tr",
    "v",
    "z",
    "y",
    "w",
    "",
    "",
    "",
  ];
  const VOWEL = [
    "a",
    "e",
    "i",
    "o",
    "u",
    "a",
    "e",
    "o",
    "i",
    "a",
    "ae",
    "ai",
    "ei",
    "ou",
    "ia",
    "y",
  ];
  const CODA = [
    "",
    "",
    "",
    "n",
    "r",
    "l",
    "s",
    "th",
    "x",
    "m",
    "nd",
    "rn",
    "ll",
    "rt",
    "sh",
  ];
  const MIDCODA = ["n", "r", "l", "s", "m"];
  const ROMAN = ["", "", "", " II", " III", " IV", " V", " VI", " VII", " IX"];

  function makeWord(rng, minSyl = 2, maxSyl = 3) {
    let w = "";
    for (let attempt = 0; attempt < 12; attempt++) {
      const n = rng.chance(0.7) ? minSyl : rng.int(minSyl, maxSyl);
      w = "";
      let simple = false; // after a mid-word coda, keep the next onset to one letter
      for (let i = 0; i < n; i++) {
        let on = rng.pick(ONSET);
        if (simple && on.length > 1) on = on.charAt(0);
        if (i > 0 && on === "" && /[aeiouy]$/.test(w))
          on = rng.pick(["l", "r", "n", "v", "s", "t"]);
        w += on + rng.pick(VOWEL);
        simple = false;
        if (i === n - 1) w += rng.pick(CODA);
        else if (rng.chance(0.2)) {
          w += rng.pick(MIDCODA);
          simple = true;
        }
      }
      w = w.replace(/(.)\1\1+/g, "$1$1");
      if (w.length >= 4 && w.length <= 9) break;
    }
    return w.charAt(0).toUpperCase() + w.slice(1);
  }

  function makePlanetName(rng) {
    return makeWord(rng, 2, 3) + rng.pick(ROMAN);
  }

  function randomSeedName() {
    const r = new Rng((Math.random() * 4294967296) >>> 0);
    return makePlanetName(r);
  }

  // ---- world/noise.js ----
  // ============================================================
  // NOISE — seeded 3D simplex, fBm, ridged multifractal
  // Sampled on the unit sphere, so there are no seams or poles.
  // ============================================================

  const GRAD3 = new Float32Array([
    1, 1, 0, -1, 1, 0, 1, -1, 0, -1, -1, 0, 1, 0, 1, -1, 0, 1, 1, 0, -1, -1, 0,
    -1, 0, 1, 1, 0, -1, 1, 0, 1, -1, 0, -1, -1,
  ]);

  function makeSimplex3(seed) {
    const rnd = mulberry32(seed);
    const p = new Uint8Array(256);
    for (let i = 0; i < 256; i++) p[i] = i;
    for (let i = 255; i > 0; i--) {
      const j = Math.floor(rnd() * (i + 1));
      const t = p[i];
      p[i] = p[j];
      p[j] = t;
    }
    const perm = new Uint8Array(512),
      pm12 = new Uint8Array(512);
    for (let i = 0; i < 512; i++) {
      perm[i] = p[i & 255];
      pm12[i] = perm[i] % 12;
    }
    const F3 = 1 / 3,
      G3 = 1 / 6;

    return function noise3(xin, yin, zin) {
      let n0 = 0,
        n1 = 0,
        n2 = 0,
        n3 = 0;
      const s = (xin + yin + zin) * F3;
      const i = Math.floor(xin + s),
        j = Math.floor(yin + s),
        k = Math.floor(zin + s);
      const t = (i + j + k) * G3;
      const x0 = xin - (i - t),
        y0 = yin - (j - t),
        z0 = zin - (k - t);
      let i1, j1, k1, i2, j2, k2;
      if (x0 >= y0) {
        if (y0 >= z0) {
          i1 = 1;
          j1 = 0;
          k1 = 0;
          i2 = 1;
          j2 = 1;
          k2 = 0;
        } else if (x0 >= z0) {
          i1 = 1;
          j1 = 0;
          k1 = 0;
          i2 = 1;
          j2 = 0;
          k2 = 1;
        } else {
          i1 = 0;
          j1 = 0;
          k1 = 1;
          i2 = 1;
          j2 = 0;
          k2 = 1;
        }
      } else {
        if (y0 < z0) {
          i1 = 0;
          j1 = 0;
          k1 = 1;
          i2 = 0;
          j2 = 1;
          k2 = 1;
        } else if (x0 < z0) {
          i1 = 0;
          j1 = 1;
          k1 = 0;
          i2 = 0;
          j2 = 1;
          k2 = 1;
        } else {
          i1 = 0;
          j1 = 1;
          k1 = 0;
          i2 = 1;
          j2 = 1;
          k2 = 0;
        }
      }
      const x1 = x0 - i1 + G3,
        y1 = y0 - j1 + G3,
        z1 = z0 - k1 + G3;
      const x2 = x0 - i2 + 2 * G3,
        y2 = y0 - j2 + 2 * G3,
        z2 = z0 - k2 + 2 * G3;
      const x3 = x0 - 1 + 3 * G3,
        y3 = y0 - 1 + 3 * G3,
        z3 = z0 - 1 + 3 * G3;
      const ii = i & 255,
        jj = j & 255,
        kk = k & 255;
      let t0 = 0.6 - x0 * x0 - y0 * y0 - z0 * z0;
      if (t0 > 0) {
        const g = pm12[ii + perm[jj + perm[kk]]] * 3;
        t0 *= t0;
        n0 = t0 * t0 * (GRAD3[g] * x0 + GRAD3[g + 1] * y0 + GRAD3[g + 2] * z0);
      }
      let t1 = 0.6 - x1 * x1 - y1 * y1 - z1 * z1;
      if (t1 > 0) {
        const g = pm12[ii + i1 + perm[jj + j1 + perm[kk + k1]]] * 3;
        t1 *= t1;
        n1 = t1 * t1 * (GRAD3[g] * x1 + GRAD3[g + 1] * y1 + GRAD3[g + 2] * z1);
      }
      let t2 = 0.6 - x2 * x2 - y2 * y2 - z2 * z2;
      if (t2 > 0) {
        const g = pm12[ii + i2 + perm[jj + j2 + perm[kk + k2]]] * 3;
        t2 *= t2;
        n2 = t2 * t2 * (GRAD3[g] * x2 + GRAD3[g + 1] * y2 + GRAD3[g + 2] * z2);
      }
      let t3 = 0.6 - x3 * x3 - y3 * y3 - z3 * z3;
      if (t3 > 0) {
        const g = pm12[ii + 1 + perm[jj + 1 + perm[kk + 1]]] * 3;
        t3 *= t3;
        n3 = t3 * t3 * (GRAD3[g] * x3 + GRAD3[g + 1] * y3 + GRAD3[g + 2] * z3);
      }
      return 32 * (n0 + n1 + n2 + n3);
    };
  }

  // Fractal Brownian motion, normalised to roughly [-1, 1]
  function fbm(n, x, y, z, oct, lac = 2.0, gain = 0.5) {
    let sum = 0,
      amp = 1,
      f = 1,
      norm = 0;
    for (let o = 0; o < oct; o++) {
      sum += amp * n(x * f + o * 19.19, y * f - o * 7.31, z * f + o * 3.77);
      norm += amp;
      amp *= gain;
      f *= lac;
    }
    return sum / norm;
  }

  // A slice of an fBm sum (octaves o0..o1-1), not normalised. Lets us compute
  // the smooth low octaves on a coarse grid and only the fine ones at full res.
