// index-inline-2 03 — math
// Lines 705-1042 of readable/index-inline-2.pretty.js (statement-aligned).
  const GRIDS = {};
  // grids depend only on N, so every planet shares them
  function getGrid(N) {
    return GRIDS[N] || (GRIDS[N] = new CubeGrid(N));
  }

  function latLonToDir(latDeg, lonDeg, out = [0, 0, 0]) {
    const la = (latDeg * Math.PI) / 180,
      lo = (lonDeg * Math.PI) / 180;
    out[0] = Math.cos(la) * Math.sin(lo);
    out[1] = Math.sin(la);
    out[2] = Math.cos(la) * Math.cos(lo);
    return out;
  }
  function dirToLatLon(x, y, z) {
    return {
      lat: (Math.asin(Math.max(-1, Math.min(1, y))) * 180) / Math.PI,
      lon: (Math.atan2(x, z) * 180) / Math.PI,
    };
  }

  // ---- world/sky.js ----
  // ============================================================
  // SKY & SEA — the live layer. Pure functions of (place, time):
  // cheap enough to evaluate per pixel, identical for every view,
  // so the storm you saw from orbit is still there when you land.
  // Winds: three-cell circulation (trades, westerlies, polar easterlies).
  // Clouds: a seeded texture advected by those winds with a flow-map
  // crossfade, so they drift and reform without smearing forever.
  // ============================================================

  const LUT = 256;
  const ROTS = 64;

  class Sky {
    constructor(planet) {
      this.planet = planet;
      const key = planet.seedKey;
      this.grid = getGrid(128);
      const g = this.grid,
        n = g.count;
      const nA = makeSimplex3(subSeed(key, "clouds/a"));
      const nW = makeSimplex3(subSeed(key, "clouds/w"));
      const raw = new Float32Array(n);
      for (let i = 0; i < n; i++) {
        const x = g.dir[i * 3],
          y = g.dir[i * 3 + 1],
          z = g.dir[i * 3 + 2];
        // stretch east-west a little: clouds line up with the wind bands
        const wx = fbm(nW, x * 1.6, y * 1.6, z * 1.6, 2) * 0.5;
        const sx = x * 2.6 + wx,
          sy = y * 3.1 + wx,
          sz = z * 2.6 - wx;
        raw[i] = fbm(nA, sx, sy, sz, 4, 2.2, 0.45);
      }
      // histogram-equalise to [0,1] so "cover" means "fraction of sky"
      const order = Array.from(g.real).sort((a, b) => raw[a] - raw[b]);
      const tex = new Float32Array(n);
      for (let r = 0; r < order.length; r++)
        tex[order[r]] = r / (order.length - 1);
      g.fillApron(tex);
      // apron cells were written by fillApron from canonical cells: fine for bilinear
      this.tex = tex;

      this.nU = makeSimplex3(subSeed(key, "wind/u"));
      this.nV = makeSimplex3(subSeed(key, "wind/v"));

      const rr = new Rng(subSeed(key, "clouds/rot"));
      this.rots = [];
      for (let k = 0; k < ROTS; k++) this.rots.push(randomRotation(rr));

      this.cloudCycle = 1.2; // planet days per flow cycle
      this.windBoost = 1.6; // visual exaggeration of drift (the fake part)
      this.seaCycle = 3.0;
      this.seaBoost = 0.8;
      this._frames = { cloud: makeFrame(), sea: makeFrame() };
    }

    // Zonal wind profile (m/s): u east, v north
    zonal(latRad) {
      const a = Math.abs(latRad);
      const s6 = Math.sin(6 * a);
      const U = a < Math.PI / 6 ? 7.5 : a < Math.PI / 3 ? 10.5 : 5.5;
      return { u: -U * s6, v: -Math.sign(latRad) * 0.35 * U * s6 };
    }

    windAt(x, y, z, land = false) {
      const lat = Math.asin(clamp(y, -1, 1));
      const zn = this.zonal(lat);
      let u = zn.u + 2.4 * this.nU(x * 1.8, y * 1.8, z * 1.8);
      let v = zn.v + 1.8 * this.nV(x * 1.8, y * 1.8, z * 1.8);
      if (land) {
        u *= 0.75;
        v *= 0.75;
      }
      const speed = Math.hypot(u, v);
      const fromDeg = ((Math.atan2(-u, -v) * 180) / Math.PI + 360) % 360;
      const a = Math.abs((lat * 180) / Math.PI);
      const band =
        a < 5
          ? "Doldrums"
          : a < 28
            ? "Trade winds"
            : a < 33
              ? "Horse latitudes"
              : a < 58
                ? "Westerlies"
                : a < 63
                  ? "Polar front"
                  : "Polar easterlies";
      return { u, v, speed, fromDeg, band };
    }

    // Per-frame parameters for a flow-mapped layer (shared by all views)
    flowFrame(which, tDays) {
      const fr = this._frames[which];
      const cycle = which === "cloud" ? this.cloudCycle : this.seaCycle;
      const boost = which === "cloud" ? this.windBoost : this.seaBoost;
      const off = which === "cloud" ? 0 : 31;
      const body = this.planet.body;
      const metersPerDay = body.dayHours * 3600;
      const R = body.radiusKm * 1000;
      const ph = tDays / cycle;
      for (let layer = 0; layer < 2; layer++) {
        const p = ph + layer * 0.5;
        const k = Math.floor(p);
        const age = (p - k) * cycle; // days since this layer was reset
        const w = 1 - Math.abs(2 * (p - k) - 1);
        const cs = layer ? fr.cosB : fr.cosA,
          sn = layer ? fr.sinB : fr.sinA;
        for (let i = 0; i < LUT; i++) {
          const y = ((i + 0.5) / LUT) * 2 - 1;
          const lat = Math.asin(y);
          const u = this.zonal(lat).u;
          const cl = Math.max(0.25, Math.cos(lat));
          const theta = (-u * boost * metersPerDay * age) / (R * cl);
          cs[i] = Math.cos(theta);
          sn[i] = Math.sin(theta);
        }
        const rot = this.rots[(((k * 2 + layer) % ROTS) + ROTS + off) % ROTS];
        if (layer) {
          fr.wB = w;
          fr.OB = rot;
        } else {
          fr.wA = w;
          fr.OA = rot;
        }
      }
      fr.norm = 1 / Math.sqrt(fr.wA * fr.wA + fr.wB * fr.wB);
      return fr;
    }

    // Raw density in [0,1] at a body direction for a prepared frame
    density(fr, x, y, z) {
      let li = ((y + 1) * 0.5 * LUT) | 0;
      if (li < 0) li = 0;
      else if (li >= LUT) li = LUT - 1;
      let c = fr.cosA[li],
        s = fr.sinA[li];
      let px = x * c + z * s,
        pz = -x * s + z * c;
      let O = fr.OA;
      const va = this.grid.sample(
        this.tex,
        O[0] * px + O[1] * y + O[2] * pz,
        O[3] * px + O[4] * y + O[5] * pz,
        O[6] * px + O[7] * y + O[8] * pz,
      );
      c = fr.cosB[li];
      s = fr.sinB[li];
      px = x * c + z * s;
      pz = -x * s + z * c;
      O = fr.OB;
      const vb = this.grid.sample(
        this.tex,
        O[0] * px + O[1] * y + O[2] * pz,
        O[3] * px + O[4] * y + O[5] * pz,
        O[6] * px + O[7] * y + O[8] * pz,
      );
      return (fr.wA * va + fr.wB * vb - 0.5) * fr.norm + 0.5;
    }

    // cloud amount 0..1 at a place and time, given local coverage
    cloudAt(x, y, z, tDays, cover) {
      const fr = this.flowFrame("cloud", tDays);
      const d = this.density(fr, x, y, z);
      return smoothstep(1 - cover - 0.04, 1 - cover + 0.1, d);
    }
  }

  function makeFrame() {
    return {
      cosA: new Float32Array(LUT),
      sinA: new Float32Array(LUT),
      cosB: new Float32Array(LUT),
      sinB: new Float32Array(LUT),
      wA: 0.5,
      wB: 0.5,
      OA: null,
      OB: null,
      norm: 1,
    };
  }

  // Random yaw plus a small tilt: keeps the texture's east-west grain
  // roughly lined up with the wind bands while every cycle looks new.
  function randomRotation(r) {
    const yaw = r.float() * 2 * Math.PI,
      tilt = (r.float() - 0.5) * 0.45;
    const cy = Math.cos(yaw),
      sy = Math.sin(yaw),
      ct = Math.cos(tilt),
      st = Math.sin(tilt);
    // Ry(yaw) · Rx(tilt)
    return new Float64Array([
      cy,
      sy * st,
      sy * ct,
      0,
      ct,
      -st,
      -sy,
      cy * st,
      cy * ct,
    ]);
  }

  // ---- world/tectonics.js ----
  // ============================================================
  // TECTONICS — plates, their motion, and what their boundaries build.
  // Plates are warped Voronoi regions on the sphere. Each turns about its
  // own Euler pole; at every boundary the relative motion decides the landform:
  //   collision (continent+continent)  -> wide high ranges
  //   subduction (ocean under X)       -> trench, then a volcanic arc / coastal range
  //   ridge (ocean pulling apart)      -> young, shallow sea floor that deepens with age
  //   rift (continent pulling apart)   -> rift valley, sometimes a new narrow sea
  //   transform (sliding past)         -> faults, small offsets
  // Hotspots stay fixed while plates slide over them, leaving island chains.
  // Everything is computed on the 128 grid; the planet upsamples envelopes.
  // ============================================================

  const BT = {
    NONE: 0,
    COLLISION: 1,
    SUBDUCT: 2,
    OVERRIDE: 3,
    RIDGE: 4,
    RIFT: 5,
    TRANSFORM: 6,
  };
  const BT_NAMES = [
    "",
    "Collision",
    "Subduction",
    "Subduction",
    "Spreading ridge",
    "Rift",
    "Transform fault",
  ];

  // ---------- small binary heap keyed by float ----------
  class Heap {
    constructor(cap) {
      this.k = new Float64Array(cap);
      this.v = new Int32Array(cap);
      this.n = 0;
    }
    push(key, val) {
      if (this.n >= this.k.length) {
        const k2 = new Float64Array(this.k.length * 2);
        k2.set(this.k);
        this.k = k2;
        const v2 = new Int32Array(this.v.length * 2);
        v2.set(this.v);
        this.v = v2;
      }
      let i = this.n++;
      const k = this.k,
        v = this.v;
      while (i > 0) {
        const p = (i - 1) >> 1;
        if (k[p] <= key) break;
        k[i] = k[p];
        v[i] = v[p];
        i = p;
      }
      k[i] = key;
      v[i] = val;
    }
    pop() {
      // returns value; key in this.lastKey
      const k = this.k,
        v = this.v;
      const topV = v[0];
      this.lastKey = k[0];
      const key = k[--this.n],
        val = v[this.n];
      let i = 0;
      for (;;) {
        let c = 2 * i + 1;
        if (c >= this.n) break;
        if (c + 1 < this.n && k[c + 1] < k[c]) c++;
        if (k[c] >= key) break;
        k[i] = k[c];
        v[i] = v[c];
        i = c;
      }
      k[i] = key;
      v[i] = val;
      return topV;
    }
  }

  // 8-neighbourhood through the apron (canonical real cells)
  function neighbors8(g, i, out) {
    const c = g.canon,
      S = g.S;
    out[0] = c[i + 1];
    out[1] = c[i - 1];
    out[2] = c[i + S];
    out[3] = c[i - S];
    out[4] = c[i + S + 1];
    out[5] = c[i + S - 1];
    out[6] = c[i - S + 1];
    out[7] = c[i - S - 1];
    return out;
  }

  function angle(d, a, b) {
    const x =
      d[a * 3] * d[b * 3] +
      d[a * 3 + 1] * d[b * 3 + 1] +
      d[a * 3 + 2] * d[b * 3 + 2];
    return Math.acos(x > 1 ? 1 : x < -1 ? -1 : x);
  }

  // Multi-source nearest-source propagation (vector Dijkstra). `allow(i,j)`
  // decides whether distance may flow from i to j. Returns radians + source cell.
