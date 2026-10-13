// index-inline-2 09 — math
// Lines 2709-3036 of readable/index-inline-2.pretty.js (statement-aligned).
  class Ground {
    constructor(planet) {
      this.planet = planet;
      const k = planet.seedKey;
      this.nD = makeSimplex3(subSeed(k, "ground/detail"));
      this.nR = makeSimplex3(subSeed(k, "ground/ridge"));
      this.nP = makeSimplex3(subSeed(k, "ground/patch"));
      this.nH = makeSimplex3(subSeed(k, "ground/hills"));
      this.flats = null;
      this.knolls = null;
      this.R = planet.body.radiusKm * 1000;
      this.L0 = planet.levels[0];
      this.g = this.L0.grid;
      this.cellM = this.g.cellKm * 1000;
      this.lam0 = this.cellM * 0.9;
      this.amp0 = Math.pow(this.lam0 / 1000, G_HURST);
      this.ratio = Math.pow(0.5, G_HURST);
      this.c = { elev: 0, temp: 0, precip: 0, rough: 0 };
    }

    // one cube lookup, bilinear for elevation, temperature and rain; roughness from the nearest cell
    coarse(x, y, z) {
      const g = this.g,
        L = this.L0,
        N = g.N,
        S = g.S;
      cubeCoords(x, y, z, _gcc);
      let gx = (Math.atan(_gcc[1]) * G_IQPI + 1) * 0.5 * N - 0.5;
      let gy = (Math.atan(_gcc[2]) * G_IQPI + 1) * 0.5 * N - 0.5;
      if (gx < -1) gx = -1;
      else if (gx > N - 1e-4) gx = N - 1e-4;
      if (gy < -1) gy = -1;
      else if (gy > N - 1e-4) gy = N - 1e-4;
      const i0 = Math.floor(gx),
        j0 = Math.floor(gy),
        fx = gx - i0,
        fy = gy - j0;
      const b = _gcc[0] * g.FS + (j0 + 1) * S + (i0 + 1);
      const w00 = (1 - fx) * (1 - fy),
        w10 = fx * (1 - fy),
        w01 = (1 - fx) * fy,
        w11 = fx * fy;
      const e = L.elev,
        t = L.temp,
        p = L.precip;
      const c = this.c;
      c.elev =
        e[b] * w00 + e[b + 1] * w10 + e[b + S] * w01 + e[b + S + 1] * w11;
      c.temp =
        t[b] * w00 + t[b + 1] * w10 + t[b + S] * w01 + t[b + S + 1] * w11;
      c.precip =
        p[b] * w00 + p[b + 1] * w10 + p[b + S] * w01 + p[b + S + 1] * w11;
      // ruggedness: steep ground or high ground (summits are flat in the grid but rough in life)
      const gr = L.grad;
      const gm = (i) => Math.hypot(gr[i * 3], gr[i * 3 + 1], gr[i * 3 + 2]);
      const slope =
        (gm(b) * w00 +
          gm(b + 1) * w10 +
          gm(b + S) * w01 +
          gm(b + S + 1) * w11) /
        400000;
      const high =
        smoothstep(1300, 4200, c.elev - this.planet.dials.seaLevel) * 0.95;
      c.rough = Math.min(1, Math.max(slope, high));
      return c;
    }

    // fractal detail on top of the coarse height, down to features of about lodM metres
    detail(x, y, z, lodM, base, rough, hv = 0) {
      const sea = this.planet.dials.seaLevel;
      const A1 =
        2 + 10 * smoothstep(0.04, 0.35, rough) + 40 * smoothstep(0.3, 1, rough);
      // near sea level keep it gentle: a crinkled coastline and beaches, not a marsh
      const coastK = 0.3 + 0.7 * smoothstep(0, 160, Math.abs(base - sea));
      // (up a hill the small things get rocky: crags and outcrops near the top)
      const ridgeK = Math.max(smoothstep(0.35, 0.8, rough), hv * 0.75),
        crag = 1 + 2.4 * hv;
      let lam = this.lam0,
        amp = A1 * this.amp0 * coastK,
        h = base;
      const minLam = Math.max(2.2 * lodM, 2.5);
      const nD = this.nD,
        nR = this.nR,
        R = this.R;
      for (let o = 0; o < 22 && lam > minLam; o++) {
        const f = R / lam;
        const X = x * f + o * 31.7,
          Y = y * f - o * 17.3,
          Z = z * f + o * 11.1;
        let v = nD(X, Y, Z);
        if (ridgeK > 0 && lam < 7000) {
          const rr = (1 - Math.abs(nR(X, Y, Z))) * 2 - 1.05;
          v += (rr - v) * ridgeK;
        }
        h += amp * v * (lam < 700 ? crag : 1);
        lam *= 0.5;
        amp *= this.ratio;
      }
      return h;
    }

    // where people have built (towns): the ground stays as it was. list of { d: unit dir, r0, r1 (metres) }
    setFlats(list) {
      this.flats = (list || []).map((f) => ({
        d: f.d,
        r0: f.r0,
        r1: f.r1,
        cos: Math.cos((f.r1 + 50) / this.R),
      }));
    }
    flatK(x, y, z) {
      const F = this.flats;
      if (!F) return 1;
      let k = 1;
      for (let i = 0; i < F.length; i++) {
        const f = F[i],
          dt = x * f.d[0] + y * f.d[1] + z * f.d[2];
        if (dt < f.cos) continue;
        const m = Math.acos(Math.min(1, dt)) * this.R;
        k = Math.min(k, smoothstep(f.r0, f.r1, m));
      }
      return k;
    }
    // the knolls over caves' mouths near you: list of { d, e, n (the mouth's frame), cs, sn (its turn),
    // A, B, H, W, D, Lf, cos } (see knollProfile)
    setKnolls(list) {
      this.knolls = list && list.length ? list : null;
    }
    // the ground over a knoll, given the bare ground there (h): the rise added, and the way in (and a
    // step before it) levelled to the mouth's own height
    knollH(x, y, z, h) {
      for (const k of this.knolls) {
        const dt = x * k.d[0] + y * k.d[1] + z * k.d[2];
        if (dt < k.cos) continue;
        const qx = x - k.d[0],
          qy = y - k.d[1],
          qz = z - k.d[2];
        const sx = (qx * k.e[0] + qy * k.e[1] + qz * k.e[2]) * this.R,
          sz = -(qx * k.n[0] + qy * k.n[1] + qz * k.n[2]) * this.R;
        const u = sx * k.cs + sz * k.sn,
          w = -sx * k.sn + sz * k.cs;
        const v = knollProfile(k, u, w),
          nf = knollNotch(k, u, w);
        return h + v * (1 - nf) + (k.y0 - h) * nf;
      }
      return h;
    }
    // the hills: how high a rise stands here (m), and how far up one this is (0..1, for the crags)
    hills(x, y, z, base, rough, out) {
      out.h = 0;
      out.v = 0;
      const above = base - this.planet.dials.seaLevel;
      if (above < 3) return out;
      // where the country rolls: a slow field, and more of it where the land is rough already
      const fm = this.R / 60000;
      const m = smoothstep(
        -0.5,
        0.4,
        this.nH(x * fm, y * fm, z * fm) + rough * 0.6,
      );
      if (m <= 0) return out;
      const fk = this.flatK(x, y, z);
      if (fk <= 0) return out;
      // the rises: two scales of bump, flat between them
      const f1 = this.R / 4200,
        f2 = this.R / 1700;
      const n =
        this.nH(x * f1 + 51.3, y * f1 - 12.7, z * f1 + 7.9) * 0.7 +
        this.nH(x * f2 - 3.1, y * f2 + 22.2, z * f2 - 9.4) * 0.3;
      // (no ceiling: each rise climbs to a summit of its own, rather than levelling off into a table)
      const t = (n + 0.3) / 0.95;
      if (t <= 0) return out;
      const shore = smoothstep(3, 60, above);
      out.v = Math.min(1, t) * m * fk;
      out.h = t * t * m * (60 + 145 * m) * shore * fk;
      return out;
    }
    // metres above sea level (bare: without the knolls, as the places are reckoned)
    height(x, y, z, lodM, bare = false) {
      const c = this.coarse(x, y, z),
        H = this.hills(
          x,
          y,
          z,
          c.elev,
          c.rough,
          this._hl || (this._hl = { h: 0, v: 0 }),
        );
      const h =
        this.detail(x, y, z, lodM, c.elev, c.rough, H.v) +
        H.h -
        this.planet.dials.seaLevel;
      return this.knolls && !bare ? this.knollH(x, y, z, h) : h;
    }

    // everything a camera needs at one spot (h above sea, climate, biome)
    sample(x, y, z, lodM, out = {}, bare = false) {
      const c = this.coarse(x, y, z);
      const sea = this.planet.dials.seaLevel;
      const H = this.hills(
        x,
        y,
        z,
        c.elev,
        c.rough,
        this._hl || (this._hl = { h: 0, v: 0 }),
      );
      let h = this.detail(x, y, z, lodM, c.elev, c.rough, H.v) + H.h - sea;
      if (this.knolls && !bare) h = this.knollH(x, y, z, h);
      const baseA = c.elev - sea;
      const T =
        c.temp - (G_LAPSE * (Math.max(h, 0) - Math.max(baseA, 0))) / 1000;
      // patchiness: meadows inside forests, groves on grassland
      const pf = this.R / 1400;
      const patch = this.nP(x * pf, y * pf, z * pf);
      const Tj = T + 1.6 * patch,
        Pj = c.precip * (1 + 0.3 * patch);
      out.h = h;
      out.T = T;
      out.P = c.precip;
      out.base = baseA;
      out.rough = c.rough;
      out.patch = patch;
      out.hill = H.v;
      out.biome = classify(Tj, Pj, h, h > 0, -h);
      return out;
    }
  }

  // A knoll over a cave's mouth, in the mouth's own metres (u across it, w out of it; into the hill is
  // -w): a round rise of ground (Au across, Bw deep, H high, its top a little behind the mouth), with a
  // bay cut into its front (Uc either side of the mouth) back to a cliff over the mouth, Lf metres
  // deep. The notch: the way in, D metres back under the cliff and a step out before it, where the
  // ground is levelled to the mouth's own height (y0); the view roofs it over.
  const ksst = (a, b, t) => {
    const k = Math.max(0, Math.min(1, (t - a) / (b - a)));
    return k * k * (3 - 2 * k);
  };
  function knollFace(k, u) {
    return -0.5 * (u / k.Uc) * (u / k.Uc);
  }
  function knollProfile(k, u, w) {
    const du = u / k.Au,
      dw = (w - k.wc) / k.Bw,
      r2 = du * du + dw * dw;
    if (r2 >= 1) return 0;
    const m = k.H * (1 - r2) * (1 - r2),
      bay = 1 - ksst(k.Uc - 3.5, k.Uc, Math.abs(u));
    if (bay <= 0) return m;
    const wf = knollFace(k, u);
    return m * (1 - (w >= wf ? bay : bay * (1 - Math.min(1, (wf - w) / k.Lf))));
  }
  function knollNotch(k, u, w) {
    const a = 1 - Math.min(1, Math.max(0, (Math.abs(u) - k.W / 2 - 0.9) / 0.6));
    if (a <= 0) return 0;
    const b = 1 - Math.min(1, Math.max(0, (-w - k.D - 1.2) / 0.6)),
      c = 1 - Math.min(1, Math.max(0, (w - knollFace(k, u) - 0.6) / 1.6));
    return a * b * c;
  }

  // ---- world/gazetteer.js ----
  // ============================================================
  // GAZETTEER — finds the places worth naming on a planet:
  // continents, islands, mountain ranges, volcanoes, trenches, ridges,
  // rifts, island chains, deserts, forests, jungles, plains, ice, oceans.
  // Pure geography: names are given later by whoever lives there.
  // Works on the 128 grid (about 80 km cells on an Earth-sized world).
  // ============================================================

  const PLACE_KINDS = {
    continent: "Continent",
    island: "Island",
    range: "Mountains",
    peak: "Peak",
    volcano: "Volcano",
    isles: "Islands",
    trench: "Trench",
    ridge: "Undersea ridge",
    rift: "Rift",
    riftsea: "Rift sea",
    desert: "Desert",
    jungle: "Jungle",
    forest: "Forest",
    taiga: "Taiga",
    plains: "Plains",
    icecap: "Ice",
    tundra: "Tundra",
    ocean: "Ocean",
    sea: "Sea",
  };

  const REGION_OF_BIOME = {
    [B.DESERT]: "desert",
    [B.COLDDESERT]: "desert",
    [B.JUNGLE]: "jungle",
    [B.DRYFOREST]: "jungle",
    [B.FOREST]: "forest",
    [B.WETFOREST]: "forest",
    [B.TAIGA]: "taiga",
    [B.STEPPE]: "plains",
    [B.SAVANNA]: "plains",
    [B.ICE]: "icecap",
    [B.TUNDRA]: "tundra",
    [B.ROCK]: "range",
  };

  function nb8(g, i, out) {
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
  function gDir(g, i) {
    return [g.dir[i * 3], g.dir[i * 3 + 1], g.dir[i * 3 + 2]];
  }
  function angleBetween(a, b) {
    const d = a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
    return Math.acos(d > 1 ? 1 : d < -1 ? -1 : d);
  }

  // connected components of cells passing `test`, 8-connected
