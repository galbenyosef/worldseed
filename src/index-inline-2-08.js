// index-inline-2 08 — math
// Lines 2423-2708 of readable/index-inline-2.pretty.js (statement-aligned).
  function classifyWorld(ocean, meanT, ice) {
    if (meanT < -4 || ice > 0.45) return "Ice world";
    if (ocean > 0.82) return "Ocean world";
    if (ocean < 0.45) return meanT > 18 ? "Desert world" : "Continental world";
    if (meanT > 21) return "Tropical world";
    if (meanT < 6) return "Cold world";
    return "Temperate world";
  }

  // ---- world/weather.js ----
  // ============================================================
  // WEATHER & THE NIGHT SKY — what the sky is doing where you stand. The
  // clouds are the planet's own (the ones the globe shows drifting on the
  // winds), so the storm you saw from orbit is the one that soaks you: rain
  // falls from the thick of them where the climate is wet enough, snow when
  // it is cold, thunder from the thickest in warm wet country. Fog lies in
  // the hollows of a still, damp morning; the air shimmers over hot dry
  // ground at midday. And above it all: the moons (some worlds have none,
  // some three), going round and changing face, now and then crossing the
  // sun; nights of falling stars; lights over the poles of worlds whose
  // cores still burn. Pure: the same place and time always has the same sky.
  // ============================================================

  const WX_DEG = Math.PI / 180;
  // the sun as the sky draws it (its disc: cos 0.99975)
  const SUN_RADIUS = Math.acos(0.99975);

  // ---------- moons ----------
  const MOON_COLS = [
    [0.84, 0.83, 0.8],
    [0.88, 0.76, 0.58],
    [0.72, 0.8, 0.9],
    [0.84, 0.6, 0.5],
    [0.78, 0.84, 0.74],
  ];
  const MOON_WORDS = { 0: "none", 1: "one", 2: "two", 3: "three" };
  function planetMoons(planet) {
    if (planet._moons) return planet._moons;
    const r = new Rng(subSeed(planet.seedKey, "moons"));
    const roll = r.float();
    const n = roll < 0.14 ? 0 : roll < 0.62 ? 1 : roll < 0.86 ? 2 : 3;
    const moons = [];
    for (let k = 0; k < n; k++) {
      const big = k === 0;
      moons.push({
        // how big it looks (radians across its middle), how long it takes to go round (planet days)
        r: (big ? r.range(1.0, 2.3) : r.range(0.45, 1.25)) * WX_DEG,
        period: big ? r.range(7, 34) : r.range(2.5, 70),
        // its path is tipped a little from the equator, and the tip turns slowly round (eclipse seasons)
        incl: r.range(1.4, 5.5) * WX_DEG,
        node0: r.float() * Math.PI * 2,
        nodePeriod: r.range(110, 420) * (r.chance(0.5) ? 1 : -1),
        th0: r.float() * Math.PI * 2,
        col: MOON_COLS[Math.floor(r.float() * MOON_COLS.length)],
        seed: r.int(1, 1e6),
      });
    }
    planet._moons = moons;
    return moons;
  }
  function moonWords(planet) {
    const m = planetMoons(planet);
    if (!m.length) return "None";
    return m.length === 1
      ? m[0].r > 1.6 * WX_DEG
        ? "One, large"
        : "One"
      : `${MOON_WORDS[m.length][0].toUpperCase() + MOON_WORDS[m.length].slice(1)}`;
  }
  const _bw = new Float64Array(9),
    _bt = new Float64Array(9);
  // a direction in the world's frame, as the turning body sees it at time t
  function worldToBodyDir(planet, tDays, v, out = [0, 0, 0]) {
    bodyToWorld(planet, tDays, _bt);
    out[0] = _bt[0] * v[0] + _bt[3] * v[1] + _bt[6] * v[2];
    out[1] = _bt[1] * v[0] + _bt[4] * v[1] + _bt[7] * v[2];
    out[2] = _bt[2] * v[0] + _bt[5] * v[1] + _bt[8] * v[2];
    return out;
  }
  // each moon's direction in the world's frame (the sun is fixed along SUN_WORLD), how much of the
  // face we see lit (0 new .. 1 full), and how much of the sun's disc it covers (0..1)
  function moonsAt(planet, tDays) {
    const moons = planetMoons(planet);
    bodyToWorld(planet, 0, _bw);
    // the moons go round close to the plane the sun lies in (as the world goes round its sun): that
    // plane is the sun's direction and the one at right angles to it and to the spin axis
    const ax = [_bw[1], _bw[4], _bw[7]],
      S = SUN_WORLD;
    let X0 = [
      ax[1] * S[2] - ax[2] * S[1],
      ax[2] * S[0] - ax[0] * S[2],
      ax[0] * S[1] - ax[1] * S[0],
    ];
    const xl = Math.hypot(X0[0], X0[1], X0[2]) || 1;
    X0 = X0.map((v) => v / xl);
    const nrm = [
      S[1] * X0[2] - S[2] * X0[1],
      S[2] * X0[0] - S[0] * X0[2],
      S[0] * X0[1] - S[1] * X0[0],
    ];
    const out = [];
    for (const m of moons) {
      // the line where its path crosses that plane turns slowly round: when it points at the sun, the
      // moon passes in front of it once a month (eclipse seasons)
      const node = m.node0 + (2 * Math.PI * tDays) / m.nodePeriod,
        cn = Math.cos(node),
        sn = Math.sin(node);
      const N = [
        S[0] * cn + X0[0] * sn,
        S[1] * cn + X0[1] * sn,
        S[2] * cn + X0[2] * sn,
      ];
      const M0 = [
        nrm[1] * N[2] - nrm[2] * N[1],
        nrm[2] * N[0] - nrm[0] * N[2],
        nrm[0] * N[1] - nrm[1] * N[0],
      ];
      const ax2 = nrm;
      const ci = Math.cos(m.incl),
        si = Math.sin(m.incl);
      const M = [
        M0[0] * ci + ax2[0] * si,
        M0[1] * ci + ax2[1] * si,
        M0[2] * ci + ax2[2] * si,
      ];
      const th = m.th0 + (2 * Math.PI * tDays) / m.period,
        ct = Math.cos(th),
        st = Math.sin(th);
      const dir = [
        N[0] * ct + M[0] * st,
        N[1] * ct + M[1] * st,
        N[2] * ct + M[2] * st,
      ];
      const cosE =
        dir[0] * SUN_WORLD[0] + dir[1] * SUN_WORLD[1] + dir[2] * SUN_WORLD[2];
      const lit = (1 - cosE) / 2;
      out.push({
        dir,
        r: m.r,
        col: m.col,
        seed: m.seed,
        lit,
        cover: discCover(Math.acos(clamp(cosE, -1, 1)), SUN_RADIUS, m.r),
      });
    }
    return out;
  }
  // how much of a disc of radius a is hidden by one of radius b whose middle is d away (0..1)
  function discCover(d, a, b) {
    if (d >= a + b) return 0;
    if (d <= Math.abs(b - a)) return b >= a ? 1 : (b * b) / (a * a);
    const a2 = a * a,
      b2 = b * b;
    const p =
      a2 * Math.acos(clamp((d * d + a2 - b2) / (2 * d * a), -1, 1)) +
      b2 * Math.acos(clamp((d * d + b2 - a2) / (2 * d * b), -1, 1)) -
      0.5 *
        Math.sqrt(
          Math.max(0, (-d + a + b) * (d + a - b) * (d - a + b) * (d + a + b)),
        );
    return clamp(p / (Math.PI * a2), 0, 1);
  }

  // ---------- falling stars and the lights at the poles ----------
  // tonight's shower of falling stars, if any (0..1), by the planet's own day count
  function meteorNight(planet, dayNum) {
    const h =
      (hashInt(
        dayNum,
        0x5747,
        planet.seedKey.length * 131 + (planet.seedKey.charCodeAt(0) || 7),
      ) >>>
        0) /
      4294967296;
    return h < 0.075 ? 0.55 + (h / 0.075) * 0.45 : 0;
  }
  // the lights over the pole: how strong at this latitude (degrees) tonight (0..1)
  function auroraAt(planet, latDeg, dayNum) {
    const f = planet.body.magneticField,
      a = Math.abs(latDeg);
    const from = f === "Strong" ? 52 : f === "Moderate" ? 61 : 71;
    const k = smoothstep(from, from + 9, a);
    if (k <= 0) return 0;
    const h =
      (hashInt(dayNum, 0xa0a0, planet.seedKey.length * 97 + 3) >>> 0) /
      4294967296;
    return k * (h < 0.3 ? 0 : 0.45 + (0.55 * (h - 0.3)) / 0.7);
  }

  // ---------- the weather where you stand ----------
  // env: { T (°C here), P (mm of rain a year), coastKm, hour (part of the day, 0 = midnight), up (the
  // sun's height, -1..1) }. Back: { cloud (0..1, how overcast), rain (0..1), snow (0..1), storm (0..1),
  // fog (0..1), heat (0..1), wind (m/s), wet (how wet a climate, 0..1) }
  function weatherAt(planet, d, tDays, env, out = {}) {
    const sky = planet.sky,
      L0 = planet.levels[0];
    const fr = sky.flowFrame("cloud", tDays);
    const dens = sky.density(fr, d[0], d[1], d[2]);
    const cover = L0.grid.sample(L0.cover, d[0], d[1], d[2]);
    const nz =
      planet._wxNoise ||
      (planet._wxNoise = makeSimplex3(subSeed(planet.seedKey, "weather")));
    // how overcast: from the edge of the clouds to their middle
    const cloud = smoothstep(1 - cover - 0.05, 1 - cover + 0.22, dens);
    // rain comes out of the thick of them, more often where the climate is wet
    const wet = smoothstep(90, 1100, env.P);
    const core = smoothstep(1 - 0.72 * cover, 1 - 0.72 * cover + 0.08, dens);
    let precip = core * (0.2 + 0.8 * wet) * smoothstep(30, 220, env.P);
    // (and some days the clouds only threaten)
    const day = Math.floor(tDays);
    const mood = nz(d[0] * 9 + day * 1.7, d[1] * 9, d[2] * 9 - day * 0.9);
    precip *= smoothstep(-0.55, -0.1, mood);
    const snow = 1 - smoothstep(-1, 2.2, env.T);
    // thunder: the thickest cloud, in warm wet country, in some cells of it
    const cell = nz(d[0] * 31 + tDays * 2.1, d[1] * 31, d[2] * 31);
    const storm =
      smoothstep(0.45, 0.85, precip) *
      smoothstep(11, 21, env.T) *
      smoothstep(0.05, 0.4, cell) *
      (1 - snow);
    // morning fog in damp still country, some days
    const wd = sky.windAt(d[0], d[1], d[2], true),
      wind = wd.speed;
    const h = env.hour,
      morning = smoothstep(0.13, 0.2, h) * (1 - smoothstep(0.3, 0.4, h));
    const damp = Math.max(
      smoothstep(380, 1300, env.P),
      env.coastKm < 45 ? 0.75 : 0,
    );
    const fogDay = smoothstep(
      0.05,
      0.45,
      nz(d[0] * 5 - day * 2.3, d[1] * 5 + day * 1.1, d[2] * 5),
    );
    const fog = Math.max(
      morning *
        damp *
        fogDay *
        (1 - smoothstep(5, 9, wind)) *
        smoothstep(-8, -2, env.T) *
        (1 - smoothstep(19, 26, env.T)),
      precip * 0.35,
    );
    // heat shimmer over hot dry ground at midday
    const heat =
      smoothstep(24, 33, env.T + 6 * Math.max(0, env.up)) *
      (1 - wet * 0.7) *
      smoothstep(0, 0.3, env.up) *
      (1 - cloud * 0.8);
    out.cloud = cloud;
    out.rain = precip * (1 - snow);
    out.snow = precip * snow;
    out.precip = precip;
    out.storm = storm;
    out.fog = fog;
    out.heat = heat;
    out.wind = wind + storm * 7;
    out.wet = wet;
    // (which way it blows: east and north, m/s)
    const wk = (wind + storm * 7) / Math.max(0.1, wind);
    out.windE = wd.u * wk;
    out.windN = wd.v * wk;
    return out;
  }

  // ---- world/ground.js ----
  // ============================================================
  // GROUND — the planet at walking scale. One height function serves every
  // camera: the probe's close-up maps and the first-person view ask for the
  // same ground at different levels of detail, so they always agree.
  // Coarse truth comes from the 256 grid; below it, seeded fractal detail
  // whose roughness follows the land (flat plains, rugged ranges). On top of
  // that, hills: some country rolls, some lies flat; where it rolls there are
  // rounded rises a few kilometres across and up to a couple of hundred
  // metres high, craggy on top. Hills only ever add height (no new hollow
  // fills with sea), stay low by the shore, and leave the ground flat where
  // people have built a town. Over a cave's mouth the ground rises into a
  // knoll: a cliff over the mouth (the view draws the rock of it), a slope
  // away behind; only near you, and never under the places' own reckoning.
  // ============================================================

  const G_IQPI = 4 / Math.PI;
  const G_LAPSE = 6.5;
  const G_HURST = 0.78;
  const _gcc = [0, 0, 0];

