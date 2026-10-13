// index-inline-2 48 — biome_mat
// Lines 17973-18204 of readable/index-inline-2.pretty.js (statement-aligned).
  const M = {
    ABYSS: 0,
    DEEP: 1,
    SLOPE: 2,
    SHELF: 3,
    SHALLOW: 4,
    REEF: 5,
    SEAICE: 6,
    ICE: 7,
    TUNDRA: 8,
    TAIGA: 9,
    STEPPE: 10,
    FOREST: 11,
    WETFOREST: 12,
    COLDDESERT: 13,
    DESERT: 14,
    SAVANNA: 15,
    DRYFOREST: 16,
    JUNGLE: 17,
    ROCK: 18,
    CLOUD: 19,
    SAND: 20,
    GLINT: 21,
    COUNT: 22,
  };

  const CLASSIC = {
    [M.ABYSS]: ["#0a0f2c", "#111a46", "#182863", "#1f3479", "#27428f"],
    [M.DEEP]: ["#0b1231", "#13204f", "#1b3170", "#22408b", "#2c51a2"],
    [M.SLOPE]: ["#0c1636", "#15295a", "#1f4284", "#2956a0", "#356cb8"],
    [M.SHELF]: ["#0e1c3d", "#193767", "#255a98", "#3175b3", "#4491c9"],
    [M.SHALLOW]: ["#0f2143", "#1d4677", "#2d74a9", "#3f93c2", "#5cb0d3"],
    [M.REEF]: ["#102746", "#1c5b7f", "#2c93ad", "#46b4c0", "#7ad3cf"],
    [M.SEAICE]: ["#1b2748", "#61789f", "#a9bdd8", "#d4e1f0", "#f1f6fb"],
    [M.ICE]: ["#1e2649", "#7f92bb", "#c3d0e6", "#e4ecf7", "#ffffff"],
    [M.TUNDRA]: ["#181e2c", "#4b5751", "#768063", "#959c77", "#b1b18d"],
    [M.TAIGA]: ["#0f1b23", "#1e3a39", "#2b5645", "#396d50", "#4c865a"],
    [M.STEPPE]: ["#1a2126", "#5a7438", "#879c47", "#a6b556", "#c3cb6d"],
    [M.FOREST]: ["#111e22", "#274f2e", "#387534", "#4b943c", "#67ad48"],
    [M.WETFOREST]: ["#0d1b1f", "#1d4631", "#29653b", "#378143", "#4c9a4d"],
    [M.COLDDESERT]: ["#1e1f28", "#766b5b", "#9f9076", "#bcac8b", "#d3c5a4"],
    [M.DESERT]: ["#241e22", "#a26f47", "#d19b5a", "#e5b872", "#f3d493"],
    [M.SAVANNA]: ["#211f24", "#86763a", "#b39e4a", "#c9b55a", "#ddcb75"],
    [M.DRYFOREST]: ["#131e1c", "#47672b", "#6b8a33", "#84a43b", "#a1bc4e"],
    [M.JUNGLE]: ["#0b191a", "#15452b", "#1e6733", "#288239", "#3c9c45"],
    [M.ROCK]: ["#1b1923", "#574c50", "#7c716d", "#9a9087", "#bab1a5"],
    [M.CLOUD]: ["#283050", "#95a1c0", "#d3daee", "#f0f3fb", "#ffffff"],
    [M.SAND]: ["#221f26", "#9d8a5e", "#d2bd82", "#e6d59d", "#f6ebbe"],
    [M.GLINT]: ["#fff6d6", "#fff6d6", "#fff6d6", "#fffbe9", "#ffffff"],
  };

  // Atlas: hypsometric bands. Water bands then land bands (metres).
  const ATLAS_WATER = [
    // deepest first
    { to: -5000, c: "#2a5f9a" },
    { to: -4000, c: "#326fab" },
    { to: -3000, c: "#3d81bd" },
    { to: -2000, c: "#4c95cb" },
    { to: -1000, c: "#62a9d7" },
    { to: -200, c: "#80bfe2" },
    { to: 0, c: "#a4d5ec" },
  ];
  const ATLAS_LAND = [
    { to: 100, c: "#5f9e57" },
    { to: 300, c: "#86b764" },
    { to: 600, c: "#b4cd7c" },
    { to: 1000, c: "#dcd88f" },
    { to: 1500, c: "#e2c37f" },
    { to: 2000, c: "#cfa168" },
    { to: 3000, c: "#b27f52" },
    { to: 4000, c: "#946349" },
    { to: 5500, c: "#9d8c86" },
    { to: 1e9, c: "#f2f0ee" },
  ];
  const ATLAS_ICE = "#eef4f8";
  const ATLAS_LINE_LAND = "#5a3f27";
  const ATLAS_LINE_SEA = "#2c5a8c";
  const ATLAS_COAST = "#1d2f55";
  const ATLAS_GRID = "#f7f1dc";

  const ATMO = {
    blue: { lit: "#8cc4ff", mid: "#4f86e0", dim: "#28418f", space: "#06060f" },
    teal: { lit: "#8ff0e0", mid: "#3fb4b0", dim: "#1d5c6e", space: "#050b0f" },
    violet: {
      lit: "#d0a8ff",
      mid: "#8a64da",
      dim: "#40307e",
      space: "#08060f",
    },
  };

  // ---------- colour utils ----------
  function hexToRgb(h) {
    const n = parseInt(h.slice(1), 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  }
  // pack as little-endian ABGR for Uint32 ImageData views
  function pack(r, g, b) {
    return (0xff000000 | (b << 16) | (g << 8) | r) >>> 0;
  }
  function packHex(h) {
    const [r, g, b] = hexToRgb(h);
    return pack(r, g, b);
  }
  function mixHex(a, b, t) {
    const A = hexToRgb(a),
      B = hexToRgb(b);
    return (
      "#" +
      [0, 1, 2]
        .map((i) =>
          Math.round(A[i] + (B[i] - A[i]) * t)
            .toString(16)
            .padStart(2, "0"),
        )
        .join("")
    );
  }
  function shadeHex(h, k) {
    return k >= 0 ? mixHex(h, "#fff8e0", k) : mixHex(h, "#101030", -k);
  }

  function buildRamps(style) {
    const table = new Uint32Array(M.COUNT * 5);
    const src = CLASSIC;
    for (let m = 0; m < M.COUNT; m++) {
      const r = src[m];
      for (let l = 0; l < 5; l++) table[m * 5 + l] = packHex(r[l]);
    }
    return table;
  }

  // Atlas ramps: each band gets [shade, base, lit] + a contour line colour
  function buildAtlas() {
    const bands = [
      ...ATLAS_WATER.map((b) => ({ ...b, water: true })),
      ...ATLAS_LAND.map((b) => ({ ...b, water: false })),
    ];
    bands.push({ to: 0, c: ATLAS_ICE, water: false, ice: true });
    const ramp = new Uint32Array(bands.length * 5);
    bands.forEach((b, i) => {
      const cols = [
        shadeHex(b.c, -0.55),
        shadeHex(b.c, -0.16),
        b.c,
        shadeHex(b.c, 0.14),
        shadeHex(b.c, 0.3),
      ];
      cols.forEach((c, l) => {
        ramp[i * 5 + l] = packHex(c);
      });
    });
    return {
      bands,
      ramp,
      waterCount: ATLAS_WATER.length,
      iceBand: bands.length - 1,
    };
  }

  // ---- view/globe.js ----
  // ============================================================
  // GLOBE RENDERER — a camera on the planet entity, drawn in pure pixels.
  // Per-pixel sphere geometry is precomputed once per size; each frame
  // only rotates normals into body space and looks up planet cells.
  // ============================================================

  const BAYER4 = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];

  const STYLES = {
    classic: {
      label: "Classic",
      diameter: 156,
      rim: 2.1,
      dither: 0.5,
      waterDither: 0.45,
      tAmp: 2.1,
      pAmp: 0.26,
      relief: 2.0,
      clouds: true,
      haze: "blend",
      foam: true,
      beaches: true,
    },
    atlas: {
      label: "Atlas",
      diameter: 228,
      rim: 1,
      dither: 0,
      waterDither: 0,
      tAmp: 0,
      pAmp: 0,
      relief: 1.6,
      clouds: false,
      haze: "none",
      foam: false,
      beaches: false,
    },
  };

  const BIOME_MAT = [];
  BIOME_MAT[B.OCEAN] = 255;
  BIOME_MAT[B.SHELF] = 255;
  BIOME_MAT[B.REEF] = M.REEF;
  BIOME_MAT[B.SEAICE] = M.SEAICE;
  BIOME_MAT[B.ICE] = M.ICE;
  BIOME_MAT[B.TUNDRA] = M.TUNDRA;
  BIOME_MAT[B.TAIGA] = M.TAIGA;
  BIOME_MAT[B.STEPPE] = M.STEPPE;
  BIOME_MAT[B.FOREST] = M.FOREST;
  BIOME_MAT[B.WETFOREST] = M.WETFOREST;
  BIOME_MAT[B.COLDDESERT] = M.COLDDESERT;
  BIOME_MAT[B.DESERT] = M.DESERT;
  BIOME_MAT[B.SAVANNA] = M.SAVANNA;
  BIOME_MAT[B.DRYFOREST] = M.DRYFOREST;
  BIOME_MAT[B.JUNGLE] = M.JUNGLE;
  BIOME_MAT[B.ROCK] = M.ROCK;

  const DEPTH_KNOTS = [0, 60, 200, 1500, 4000, 6000];
  const DEPTH_VALS = [4.99, 4.0, 3.0, 2.0, 1.0, 0.0];
  function depthParam(d) {
    if (d <= 0) return 4.99;
    for (let i = 1; i < DEPTH_KNOTS.length; i++) {
      if (d < DEPTH_KNOTS[i]) {
        const t =
          (d - DEPTH_KNOTS[i - 1]) / (DEPTH_KNOTS[i] - DEPTH_KNOTS[i - 1]);
        return DEPTH_VALS[i - 1] + (DEPTH_VALS[i] - DEPTH_VALS[i - 1]) * t;
      }
    }
    return 0;
  }

