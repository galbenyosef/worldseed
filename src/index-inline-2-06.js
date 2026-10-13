// index-inline-2 06 — idx
// Lines 1467-2072 of readable/index-inline-2.pretty.js (statement-aligned).
  class Planet {
    constructor(seedText) {
      this.seedText = String(seedText || "").trim() || "Terra Nova";
      this.seedKey = normalizeSeed(this.seedText);
      this.dials = { seaLevel: 0, temperature: 0, clouds: 0 };
      this.revision = 0;
    }

    static async create(seedText, onProgress) {
      const p = new Planet(seedText);
      await p.generate(onProgress);
      return p;
    }

    async generate(onProgress = () => {}) {
      const step = async (label, frac) => {
        onProgress(label, frac);
        await new Promise((r) => setTimeout(r, 0));
      };
      const t0 = now();
      await step("Igniting the core", 0.02);
      this.buildBody();
      this.levels = LEVEL_NS.map((N) => ({ N, grid: getGrid(N) }));
      for (const L of this.levels)
        L.grid.cellKm = (2 * Math.PI * this.body.radiusKm) / (4 * L.N);
      await step("Cooling the crust", 0.08);
      await this.buildTerrain(step);
      await step("Stirring the air", 0.72);
      this.sky = new Sky(this);
      await step("Pouring the oceans", 0.8);
      this.derive();
      this.ground = new Ground(this);
      this.timings = { totalMs: Math.round(now() - t0) };
      await step("Ready", 1);
      return this;
    }

    // ---------- body & core ----------
    buildBody() {
      const r = new Rng(subSeed(this.seedKey, "body"));
      const radiusKm = Math.round(r.soft(3600, 9000));
      const density = r.range(4.3, 6.0);
      const coreHeat = r.float();
      const ageGyr = +(0.8 + (1 - coreHeat) * 8.5 * r.range(0.8, 1.1)).toFixed(
        1,
      );
      const dayHours = r.chance(0.1) ? r.range(60, 150) : r.soft(14, 40);
      const tiltDeg = r.chance(0.08) ? r.range(35, 55) : r.soft(3, 32);
      const oceanTarget = r.chance(0.14)
        ? r.range(0.8, 0.9)
        : r.chance(0.12)
          ? r.range(0.32, 0.48)
          : r.soft(0.55, 0.76);
      const meanTemp = r.soft(4, 26);
      const contrast = clamp(
        50 - tiltDeg * 0.4 - oceanTarget * 8 + r.range(-4, 4),
        26,
        58,
      );
      const cloudiness = r.soft(0.45, 0.95);
      const atmo = r.pick(["blue", "blue", "blue", "teal", "violet"]);
      const gravity = (radiusKm / 6371) * (density / 5.51);
      this.body = {
        radiusKm,
        density: +density.toFixed(2),
        gravity: +gravity.toFixed(2),
        dayHours: +dayHours.toFixed(1),
        tiltDeg: +tiltDeg.toFixed(1),
        coreHeat: +coreHeat.toFixed(2),
        ageGyr,
        coreTempK: Math.round(
          3800 + coreHeat * 3200 + (radiusKm - 6000) * 0.25,
        ),
        magneticField:
          coreHeat > 0.66 ? "Strong" : coreHeat > 0.3 ? "Moderate" : "Weak",
        oceanTarget,
        meanTemp,
        contrast,
        cloudiness,
        atmo,
        yearDays: Math.round(r.soft(180, 700)),
      };
      const Teq = meanTemp + 0.23 * contrast; // area-mean of cos^1.1 ≈ 0.77
      this.body.Tpole = Teq - contrast;
      this.body.Teq = Teq;
    }

    // ---------- terrain: continents from noise, shaped by plate tectonics ----------
    async buildTerrain(step) {
      const key = this.seedKey;
      const tr = new Rng(subSeed(key, "terrain"));
      const s = (name) => makeSimplex3(subSeed(key, "terrain/" + name));
      const nWx = s("wx"),
        nWy = s("wy"),
        nWz = s("wz"),
        nC = s("cont"),
        nB = s("belt"),
        nR = s("ridge"),
        nD = s("detail"),
        nP = s("plateau");
      const cf = tr.range(1.05, 1.55);
      const wf = tr.range(0.8, 1.3),
        ws = tr.range(0.28, 0.5);
      const rf = tr.range(2.6, 3.6);
      const heat = this.body.coreHeat;
      const oldRanges = (700 + 1500 * heat) * tr.range(0.8, 1.2); // worn-down ancient belts
      const shelfW = tr.range(0.018, 0.04);

      // Smooth, low-frequency parts on the 128 grid; fine octaves at full resolution.
      const L0 = this.levels[0],
        g = L0.grid,
        count = g.count,
        dir = g.dir;
      const g1 = this.levels[1].grid,
        c1 = g1.count,
        d1 = g1.dir;
      const CONT_OCT = 7,
        CONT_GAIN = 0.53,
        LOW = 5;
      const cNorm = fbmNorm(CONT_OCT, CONT_GAIN);
      const wX = new Float32Array(c1),
        wY = new Float32Array(c1),
        wZ = new Float32Array(c1);
      const lowC = new Float32Array(c1),
        belt1 = new Float32Array(c1),
        plat1 = new Float32Array(c1);
      for (let idx = 0; idx < c1; idx++) {
        const x = d1[idx * 3],
          y = d1[idx * 3 + 1],
          z = d1[idx * 3 + 2];
        const px = x + ws * fbm(nWx, x * wf, y * wf, z * wf, 3);
        const py = y + ws * fbm(nWy, x * wf, y * wf, z * wf, 3);
        const pz = z + ws * fbm(nWz, x * wf, y * wf, z * wf, 3);
        wX[idx] = px;
        wY[idx] = py;
        wZ[idx] = pz;
        lowC[idx] = fbmPart(
          nC,
          px * cf,
          py * cf,
          pz * cf,
          0,
          LOW,
          2.0,
          CONT_GAIN,
        );
        belt1[idx] = fbm(nB, px * 1.25 + 3.1, py * 1.25, pz * 1.25, 3);
        plat1[idx] = nP(px * 1.7, py * 1.7, pz * 1.7);
      }
      await step("Moving the plates", 0.18);

      // plates, boundaries and what they build (on the 128 grid)
      const cont1 = new Float32Array(c1);
      for (let i = 0; i < c1; i++) cont1[i] = lowC[i] / cNorm;
      const T = buildTectonics(this, g1, cont1);
      this.tectonics = T;
      await step("Raising mountains", 0.26);

      const up = (a) => {
        const out = new Float32Array(count);
        upsample(a, g1, out, g);
        return out;
      };
      const PX = up(wX),
        PY = up(wY),
        PZ = up(wZ);
      const cont = up(lowC),
        belt = up(belt1),
        plat = up(plat1);
      const mtn = up(T.mtn),
        add = up(T.add),
        floor = up(T.seaFloor);
      const w3 = [0, 1, 2].map((k) => {
        const a = new Float32Array(c1);
        for (let i = 0; i < c1; i++) a[i] = T.warp[i * 3 + k];
        return up(a);
      });
      const plate0 = new Uint8Array(count);
      const rid = new Float32Array(count),
        det = new Float32Array(count);
      const faceSize = g.FS;
      for (let f = 0; f < 6; f++) {
        const end = (f + 1) * faceSize;
        for (let idx = f * faceSize; idx < end; idx++) {
          const x = dir[idx * 3],
            y = dir[idx * 3 + 1],
            z = dir[idx * 3 + 2];
          const px = PX[idx],
            py = PY[idx],
            pz = PZ[idx];
          cont[idx] =
            (cont[idx] +
              fbmPart(
                nC,
                px * cf,
                py * cf,
                pz * cf,
                LOW,
                CONT_OCT,
                2.0,
                CONT_GAIN,
              )) /
            cNorm;
          plate0[idx] = platePick(
            T.plates,
            x + w3[0][idx],
            y + w3[1][idx],
            z + w3[2][idx],
          );
          rid[idx] =
            belt[idx] > -0.1 || mtn[idx] > 30
              ? ridged(nR, px * rf, py * rf, pz * rf, 5)
              : 0;
          det[idx] = fbm(nD, x * 7, y * 7, z * 7, 4);
        }
        await step("Raising mountains", 0.26 + (0.4 * (f + 1)) / 6);
      }

      // crust = continent noise + plate bias; sea level sits on this datum
      const crust = new Float32Array(count);
      for (let idx = 0; idx < count; idx++)
        crust[idx] = cont[idx] + T.plates[plate0[idx]].bias;
      const tau = weightedPercentile(crust, g, this.body.oceanTarget);

      const elev = new Float32Array(count);
      for (let idx = 0; idx < count; idx++) {
        const x = crust[idx] - tau;
        let h;
        if (x >= 0) {
          const pl = plat[idx] * 0.5 + 0.5;
          const hi = 0.35 + 1.25 * pl * pl;
          h =
            3 +
            70 * smoothstep(0, 0.02, x) +
            1150 * hi * (1 - Math.exp(-x / 0.16));
        } else {
          // continental shelf and slope, down to sea floor whose depth comes from its age
          const d = -x;
          const shelf =
            -4 - 36 * smoothstep(0, 0.012, d) - 160 * smoothstep(0, shelfW, d);
          const deep = floor[idx] + 160 * det[idx];
          h =
            shelf + (deep - shelf) * smoothstep(shelfW * 0.9, shelfW * 3.2, d);
        }
        const r = rid[idx];
        const m =
          smoothstep(0.02, 0.42, belt[idx]) * smoothstep(-0.035, 0.05, x);
        h += oldRanges * m * r * r * 1.25; // ancient ranges, worn low
        const e = mtn[idx];
        if (e > 1) h += e * (0.3 + 0.95 * r); // young ranges and arcs at plate edges
        h += add[idx]; // trenches, rifts, ridge crests
        h += (x >= 0 ? 240 : 60) * det[idx] * smoothstep(-0.02, 0.06, x + 0.02);
        elev[idx] = h;
      }

      // volcanoes: arc and rift peaks plus hotspot chains
      this.volcanoes = pickVolcanoes(this, g1, T, tr);
      addBumps(
        elev,
        g,
        this.volcanoes.flatMap((v) => v.bumps),
      );

      L0.elev = elev; // apron cells were evaluated directly, so gradients stay seamless
      L0.tex = det;
      L0.plate = plate0;
      L0.pbound = plateBoundaryCodes(g, plate0, T, g1);

      // mip levels
      for (let l = 1; l < this.levels.length; l++) {
        const L = this.levels[l],
          A = this.levels[l - 1];
        L.elev = new Float32Array(L.grid.count);
        downsample(A.elev, A.grid, L.elev, L.grid);
        L.tex = new Float32Array(L.grid.count);
        downsample(A.tex, A.grid, L.tex, L.grid);
        L.pbound = poolCodes(A.pbound, A.grid, L.grid);
      }
      for (const L of this.levels) L.grad = gradientField(L.elev, L.grid);

      // keep a small detail generator for close-ups (finer than the grid)
      this.detail = { n1: s("fine1"), n2: s("fine2") };
    }

    // ---------- climate, biomes, stats: re-run when a dial moves ----------
    derive() {
      const sea = this.dials.seaLevel;
      const body = this.body;
      const L0 = this.levels[0],
        g = L0.grid;
      const count = g.count;
      if (!this.climateBase) {
        // static per-cell climate: latitude bands + seeded variation (dial-free).
        // Smooth fields, so they are computed on the 128 grid and upsampled.
        const nT = makeSimplex3(subSeed(this.seedKey, "climate/t"));
        const nP = makeSimplex3(subSeed(this.seedKey, "climate/p"));
        const g1 = this.levels[1].grid,
          c1 = g1.count;
        const tb1 = new Float32Array(c1),
          pb1 = new Float32Array(c1);
        for (let idx = 0; idx < c1; idx++) {
          const x = g1.dir[idx * 3],
            y = g1.dir[idx * 3 + 1],
            z = g1.dir[idx * 3 + 2];
          const cl = Math.sqrt(Math.max(0, 1 - y * y));
          tb1[idx] =
            body.Tpole +
            (body.Teq - body.Tpole) * Math.pow(cl, 1.1) +
            1.5 * fbm(nT, x * 2.2, y * 2.2, z * 2.2, 3);
          pb1[idx] =
            zonalRain(Math.asin(y) * DEG) *
            Math.exp(0.45 * fbm(nP, x * 2.6, y * 2.6, z * 2.6, 4));
        }
        const tb = new Float32Array(count),
          pb = new Float32Array(count);
        upsample(tb1, g1, tb, g);
        upsample(pb1, g1, pb, g);
        this.climateBase = { tb, pb };
      }
      const { tb, pb } = this.climateBase;

      for (const L of this.levels) {
        const n = L.grid.count;
        if (!L.land) {
          L.land = new Uint8Array(n);
          L.temp = new Float32Array(n);
          L.precip = new Float32Array(n);
          L.biome = new Uint8Array(n);
          L.cover = new Float32Array(n);
          L.coast = new Float32Array(n);
        }
        for (let i = 0; i < n; i++) L.land[i] = L.elev[i] > sea ? 1 : 0;
      }

      // distance to coast (km): + inland, - offshore
      coastDistance(L0, g);

      // climate on level 0
      const tOff = this.dials.temperature;
      const cloudK = clamp(body.cloudiness + this.dials.clouds, 0, 1.5);
      const wet = clamp(1 + tOff * 0.008, 0.6, 1.3);
      for (let idx = 0; idx < count; idx++) {
        const hAbove = L0.elev[idx] - sea;
        let T = tb[idx] + tOff,
          P = pb[idx] * wet;
        if (L0.land[idx] === 1) {
          T -= (LAPSE * hAbove) / 1000;
          P *= 0.3 + 0.7 * Math.exp(-L0.coast[idx] / 1400);
          if (hAbove > 700 && hAbove < 3500) P *= 1.12;
        } else {
          T += 0.8; // ocean moderation
        }
        L0.temp[idx] = T;
        L0.precip[idx] = P;
        L0.cover[idx] = clamp(
          (0.08 + 0.62 * smoothstep(150, 2400, P)) * cloudK,
          0,
          0.95,
        );
      }
      for (let l = 1; l < this.levels.length; l++) {
        const A = this.levels[l - 1],
          L = this.levels[l];
        downsample(A.temp, A.grid, L.temp, L.grid);
        downsample(A.precip, A.grid, L.precip, L.grid);
        downsample(A.cover, A.grid, L.cover, L.grid);
        downsample(A.coast, A.grid, L.coast, L.grid);
      }
      for (const L of this.levels) {
        const n = L.grid.count;
        for (let i = 0; i < n; i++) {
          const h = L.elev[i] - sea;
          L.biome[i] = classify(L.temp[i], L.precip[i], h, L.land[i] === 1, -h);
        }
      }
      this.computeStats();
      this.revision++;
    }

    setDials(d) {
      Object.assign(this.dials, d);
      this.derive();
    }

    computeStats() {
      const L0 = this.levels[0],
        g = L0.grid,
        sea = this.dials.seaLevel;
      const R = this.body.radiusKm;
      let oceanA = 0,
        total = 0,
        tSum = 0,
        maxH = -1e9,
        minH = 1e9,
        maxI = 0,
        minI = 0,
        iceA = 0;
      const bA = new Float64Array(BIOMES.length);
      for (let q = 0; q < g.real.length; q++) {
        const idx = g.real[q],
          a = g.area[idx];
        total += a;
        if (!L0.land[idx]) oceanA += a;
        tSum += L0.temp[idx] * a;
        bA[L0.biome[idx]] += a;
        if (L0.biome[idx] === B.ICE || L0.biome[idx] === B.SEAICE) iceA += a;
        const h = L0.elev[idx];
        if (h > maxH) {
          maxH = h;
          maxI = idx;
        }
        if (h < minH) {
          minH = h;
          minI = idx;
        }
      }
      // landmasses
      const comps = labelLand(L0, g);
      const km2 = R * R;
      const masses = comps.list.map((c) => ({ ...c, areaKm2: c.area * km2 }));
      masses.sort((a, b) => b.area - a.area);
      const fullArea = 4 * Math.PI;
      let continents = 0,
        islands = 0;
      for (const m of masses) {
        if (m.area / fullArea > 0.006) continents++;
        else islands++;
        const nr = new Rng(
          subSeed(this.seedKey, "names/land") ^ hashInt(m.anchor),
        );
        m.name = makeWord(nr, 2, 3);
        m.kind =
          m.area / fullArea > 0.006
            ? "Continent"
            : m.area / fullArea > 0.0006
              ? "Island"
              : "Islet";
      }
      this.landmasses = masses;
      this.landById = new Map(masses.map((m) => [m.id, m]));
      const pr = new Rng(subSeed(this.seedKey, "names/peak") ^ maxI);
      const peakName = "Mt. " + makeWord(pr, 2, 3);
      const dr = new Rng(subSeed(this.seedKey, "names/deep") ^ minI);
      const deepName = makeWord(dr, 2, 3) + " Deep";
      const biomeShare = BIOMES.map((b, i) => ({
        id: i,
        name: b.name,
        share: bA[i] / total,
      }))
        .filter((b) => b.share > 0.001)
        .sort((a, b) => b.share - a.share);
      const oceanFrac = oceanA / total;
      const meanT = tSum / total;
      this.stats = {
        oceanFrac,
        meanTemp: meanT,
        iceFrac: iceA / total,
        highest: {
          idx: maxI,
          h: maxH - sea,
          name: peakName,
          dir: dirOf(g, maxI),
        },
        deepest: {
          idx: minI,
          h: minH - sea,
          name: deepName,
          dir: dirOf(g, minI),
        },
        continents,
        islands,
        biomeShare,
        largest: masses[0] || null,
        klass: classifyWorld(oceanFrac, meanT, iceA / total),
      };
    }

    // ---------- queries ----------
    levelFor(N) {
      for (let l = this.levels.length - 1; l >= 0; l--)
        if (this.levels[l].N >= N) return l;
      return 0;
    }

    // everything we know about one spot on the surface
    query(x, y, z, tDays = 0) {
      const L = Math.hypot(x, y, z);
      x /= L;
      y /= L;
      z /= L;
      const L0 = this.levels[0],
        g = L0.grid,
        sea = this.dials.seaLevel;
      const idx = g.locate(x, y, z);
      const elev = g.sample(L0.elev, x, y, z);
      const hAbove = elev - sea;
      const land = hAbove > 0;
      const T = g.sample(L0.temp, x, y, z);
      const P = g.sample(L0.precip, x, y, z);
      const biome = classify(T, P, hAbove, land, -hAbove);
      const { lat, lon } = dirToLatLon(x, y, z);
      const gr = L0.grad;
      const slope =
        Math.hypot(gr[idx * 3], gr[idx * 3 + 1], gr[idx * 3 + 2]) /
        (this.body.radiusKm * 1000);
      const coastKm = g.sample(L0.coast, x, y, z);
      const wind = this.sky.windAt(x, y, z, land);
      const cloud = this.sky.cloudAt(
        x,
        y,
        z,
        tDays,
        g.sample(L0.cover, x, y, z),
      );
      const comp = land ? this.landById.get(this.compOf(idx)) : null;
      const TT = this.tectonics,
        g1 = this.levels[1].grid,
        i1 = g1.locate(x, y, z);
      const src = TT.own.src[i1],
        bt = src >= 0 ? TT.btype[src] : 0;
      const plateId = L0.plate[g.canon[idx]],
        PL = TT.plates[plateId];
      const pv = velocity(PL, [x, y, z]);
      const tect = {
        plate: plateId,
        plateKind: PL.continental ? "continental" : "oceanic",
        boundary: BT_NAMES[bt] || "",
        boundaryKm: src >= 0 ? TT.own.dist[i1] * this.body.radiusKm : null,
        speedCmYr: Math.hypot(pv[0], pv[1], pv[2]) * 7,
      };
      return {
        tectonics: tect,
        lat,
        lon,
        elevation: hAbove,
        land,
        temperature: T,
        precipitation: P,
        biome,
        biomeName: BIOMES[biome].name,
        slope,
        landform: landform(hAbove, slope, coastKm, land),
        coastKm,
        wind,
        cloud,
        landmass: comp
          ? { name: comp.name, kind: comp.kind, areaKm2: comp.areaKm2 }
          : null,
        localTime: this.localTime(x, y, z, tDays),
      };
    }

    compOf(idx) {
      return this.levels[0].comp
        ? this.levels[0].comp[this.levels[0].grid.canon[idx]]
        : -1;
    }

    // Planet time: spin angle and the direction of the star in body space.
    // The star sits fixed in world space; the body turns under it.
    spinAngle(tDays) {
      return 2 * Math.PI * tDays;
    }
    sunInBody(tDays, out = [0, 0, 0]) {
      const w = worldToBody(this, tDays);
      const s = SUN_WORLD;
      out[0] = w[0] * s[0] + w[1] * s[1] + w[2] * s[2];
      out[1] = w[3] * s[0] + w[4] * s[1] + w[5] * s[2];
      out[2] = w[6] * s[0] + w[7] * s[1] + w[8] * s[2];
      return out;
    }
    localTime(x, y, z, tDays) {
      const s = this.sunInBody(tDays);
      const lonSun = Math.atan2(s[0], s[2]);
      const lon = Math.atan2(x, z);
      let h = (lon - lonSun) / (2 * Math.PI); // fraction of a day east of noon
      h = ((h % 1) + 1.5) % 1; // 0 = midnight
      const hours = h * this.body.dayHours;
      const up = x * s[0] + y * s[1] + z * s[2];
      return {
        hours,
        dayHours: this.body.dayHours,
        daylight: up > 0,
        sunAltDeg: Math.asin(clamp(up, -1, 1)) * DEG,
      };
    }

    // Close-up sampling below the grid (kept for callers that think in octaves)
    sampleDetailed(x, y, z, octaves = 5) {
      const lodM = (this.levels[0].grid.cellKm * 1000) / Math.pow(2, octaves);
      const o = this.ground.sample(x, y, z, lodM);
      return { h: o.h, T: o.T, P: o.P, biome: o.biome };
    }

    summary() {
      return {
        seed: this.seedText,
        body: this.body,
        dials: this.dials,
        stats: this.stats,
      };
    }
  }

  // ---------------------------------------------------------------
  // World frame: star fixed along SUN_WORLD; spin axis tilted to the right.
