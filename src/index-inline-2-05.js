// index-inline-2 05 — key
// Lines 1390-1466 of readable/index-inline-2.pretty.js (statement-aligned).
  function percentile(values, g, target) {
    const arr = [];
    for (let q = 0; q < g.real.length; q++) arr.push(values[g.real[q]]);
    arr.sort((a, b) => a - b);
    return arr[
      Math.min(arr.length - 1, Math.max(0, Math.floor(target * arr.length)))
    ];
  }

  // ---- world/planet.js ----
  // ============================================================
  // PLANET — the entity. Holds the truth; every view is a camera.
  //   frozen : body, core, terrain (built once from the seed)
  //   slow   : climate, biomes (re-derived when a dial moves)
  //   live   : wind, clouds, sea shimmer (pure functions of time, see sky.js)
  // ============================================================

  const BIOMES = [
    { key: "ocean", name: "Open ocean", water: true },
    { key: "shelf", name: "Shallow sea", water: true },
    { key: "reef", name: "Coral reef", water: true },
    { key: "seaice", name: "Sea ice", water: true },
    { key: "ice", name: "Ice sheet" },
    { key: "tundra", name: "Tundra" },
    { key: "taiga", name: "Boreal forest" },
    { key: "steppe", name: "Grassland" },
    { key: "forest", name: "Temperate forest" },
    { key: "wetforest", name: "Temperate rainforest" },
    { key: "colddesert", name: "Cold desert" },
    { key: "desert", name: "Hot desert" },
    { key: "savanna", name: "Savanna" },
    { key: "dryforest", name: "Tropical dry forest" },
    { key: "jungle", name: "Tropical rainforest" },
    { key: "rock", name: "Bare mountains" },
  ];
  const B = {};
  BIOMES.forEach((b, i) => {
    B[b.key.toUpperCase()] = i;
  });

  const LEVEL_NS = [256, 128, 64, 32];

  const LAPSE = 6.5; // °C per km
  const DEG = 180 / Math.PI;

  function zonalRain(latDeg) {
    const a = Math.abs(latDeg);
    const itcz = 2300 * Math.exp(-(latDeg * latDeg) / 242);
    const storm = 1050 * Math.exp(-((a - 50) * (a - 50)) / 338);
    const base = 90 + 260 * Math.cos(latDeg / DEG);
    return (
      (itcz + storm + base) * (1 - 0.7 * Math.exp(-((a - 24) * (a - 24)) / 98))
    );
  }

  function classify(T, P, hAbove, isLand, depth) {
    if (!isLand) {
      if (T < -3) return B.SEAICE;
      if (depth < 200) return T > 23 && depth < 90 ? B.REEF : B.SHELF;
      return B.OCEAN;
    }
    if (T < -9) return B.ICE;
    if (hAbove > 2300 && T < 4) return B.ROCK;
    if (T < -3) return B.TUNDRA;
    if (T < 4) return P < 260 ? B.TUNDRA : B.TAIGA;
    if (T < 19) {
      if (P < 250) return B.COLDDESERT;
      if (P < 560) return B.STEPPE;
      if (P < 1350) return B.FOREST;
      return B.WETFOREST;
    }
    if (P < 300) return B.DESERT;
    if (P < 900) return B.SAVANNA;
    if (P < 1700) return B.DRYFOREST;
    return B.JUNGLE;
  }

