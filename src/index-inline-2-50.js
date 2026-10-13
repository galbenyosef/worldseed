// index-inline-2 50 — math
// Lines 19252-19572 of readable/index-inline-2.pretty.js (statement-aligned).
  const BAYER4P = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
  const BMAT = {
    [B.ICE]: M.ICE,
    [B.TUNDRA]: M.TUNDRA,
    [B.TAIGA]: M.TAIGA,
    [B.STEPPE]: M.STEPPE,
    [B.FOREST]: M.FOREST,
    [B.WETFOREST]: M.WETFOREST,
    [B.COLDDESERT]: M.COLDDESERT,
    [B.DESERT]: M.DESERT,
    [B.SAVANNA]: M.SAVANNA,
    [B.DRYFOREST]: M.DRYFOREST,
    [B.JUNGLE]: M.JUNGLE,
    [B.ROCK]: M.ROCK,
    [B.SEAICE]: M.SEAICE,
    [B.REEF]: M.REEF,
  };

  const PROBE_ZOOMS = [
    { label: "2,000 km", span: 2000, oct: 2 },
    { label: "500 km", span: 500, oct: 4 },
    { label: "120 km", span: 120, oct: 6 },
  ];

  function renderProbe(planet, dir, zoom, W, H, out) {
    const ramps = buildRamps("classic");
    const R = planet.body.radiusKm;
    const L = Math.hypot(dir[0], dir[1], dir[2]);
    const cx = dir[0] / L,
      cy = dir[1] / L,
      cz = dir[2] / L;
    // local east/north frame
    let ex = cz,
      ey = 0,
      ez = -cx;
    let el = Math.hypot(ex, ey, ez);
    if (el < 1e-6) {
      ex = 1;
      ey = 0;
      ez = 0;
      el = 1;
    }
    ex /= el;
    ey /= el;
    ez /= el;
    const nx = cy * ez - cz * ey,
      ny = cz * ex - cx * ez,
      nz = cx * ey - cy * ex;
    const kmPerPx = zoom.span / W;
    const n = W * H;
    const h = new Float32Array(n),
      bio = new Uint8Array(n);
    const tmpS = {};
    for (let j = 0; j < H; j++) {
      for (let i = 0; i < W; i++) {
        const u = ((i + 0.5 - W / 2) * kmPerPx) / R,
          v = ((H / 2 - j - 0.5) * kmPerPx) / R;
        const s = planet.ground.sample(
          cx + ex * u + nx * v,
          cy + ey * u + ny * v,
          cz + ez * u + nz * v,
          kmPerPx * 600,
          tmpS,
        );
        const k = j * W + i;
        h[k] = s.h;
        // dithered biome edges, same trick as the globe
        const bay = (BAYER4P[(i & 3) + 4 * (j & 3)] + 0.5) / 16 - 0.5;
        const b2 = classify(
          s.T + bay * 2.2,
          s.P * (1 + bay * 0.28),
          s.h,
          s.h > 0,
          -s.h,
        );
        bio[k] =
          s.h > 0
            ? b2
            : b2 === B.SEAICE
              ? B.SEAICE
              : b2 === B.REEF
                ? B.REEF
                : 255;
      }
    }
    // hillshade with the sun in the north-west, exaggerated like a relief map
    const exag = 26 / (kmPerPx * 1000);
    for (let j = 0; j < H; j++) {
      for (let i = 0; i < W; i++) {
        const k = j * W + i;
        const bay = (BAYER4P[(i & 3) + 4 * (j & 3)] + 0.5) / 16 - 0.5;
        const hh = h[k];
        let col;
        if (bio[k] === 255) {
          const d = -hh;
          const dp =
            d < 60
              ? 4.5
              : d < 200
                ? 3.5
                : d < 1500
                  ? 2.5
                  : d < 4000
                    ? 1.5
                    : 0.5;
          const m =
            M.ABYSS + Math.max(0, Math.min(4, Math.floor(dp + bay * 0.6)));
          let coast = false;
          if (i > 0 && h[k - 1] > 0) coast = true;
          else if (i < W - 1 && h[k + 1] > 0) coast = true;
          else if (j > 0 && h[k - W] > 0) coast = true;
          else if (j < H - 1 && h[k + W] > 0) coast = true;
          col = ramps[(coast ? M.SHALLOW : m) * 5 + (coast ? 4 : 2)];
        } else {
          const m = BMAT[bio[k]] ?? M.STEPPE;
          const hl = i > 0 ? h[k - 1] : hh,
            hr = i < W - 1 ? h[k + 1] : hh;
          const hu = j > 0 ? h[k - W] : hh,
            hd = j < H - 1 ? h[k + W] : hh;
          const land = m !== M.SEAICE && m !== M.REEF;
          let shade = land ? (hl - hr + (hu - hd)) * exag : 0;
          shade = shade > 1.6 ? 1.6 : shade < -1.6 ? -1.6 : shade;
          // canopy speckle for forests, a little grain elsewhere
          const forest =
            m === M.FOREST ||
            m === M.WETFOREST ||
            m === M.TAIGA ||
            m === M.JUNGLE ||
            m === M.DRYFOREST;
          const grain =
            (hash01(i * 7 + 3, j * 13 + 1, zoom.span) - 0.5) *
            (forest ? 0.9 : 0.35);
          const lv = Math.max(
            1,
            Math.min(4, Math.floor(2.45 + shade + grain + bay * 0.55)),
          );
          col = ramps[m * 5 + lv];
        }
        out[k] = col;
      }
    }
    // crosshair at the probe centre
    const mx = W >> 1,
      my = H >> 1;
    const c1 = 0xff57d2ff,
      c2 = 0xff26101a;
    for (let d = 2; d <= 4; d++) {
      for (const [px, py] of [
        [mx + d, my],
        [mx - d, my],
        [mx, my + d],
        [mx, my - d],
      ]) {
        if (px >= 0 && py >= 0 && px < W && py < H) out[py * W + px] = c1;
        if (px + 1 < W && py + 1 < H) {
          const q = (py + 1) * W + px + 1;
          if (out[q] !== c1) out[q] = c2;
        }
      }
    }
    return { kmPerPx };
  }

  // ---- view/sprites.js ----
  // ============================================================
  // SPRITES — pixel art drawn by code from genomes, never loaded.
  // Painters write two things per pixel: which colour slot (leaf, bark,
  // petal, snow, accent, stem) and which light level (night..highlight).
  // The GPU turns that into colour with the species' ramps and the real sun,
  // so painted sprites and 3D models share one lighting and one palette.
  // A tree is grown (trunk, branches, leaf clumps), then painted lit from the
  // top-left: leaf clusters, gaps where the crown thins, blossoms, snow and a
  // soft outline. Every species gets a few variants; mirroring doubles them.
  // ============================================================

  // ---------- colour ----------
  function rgb2hsv(c) {
    const r = c[0] / 255,
      g = c[1] / 255,
      b = c[2] / 255;
    const mx = Math.max(r, g, b),
      mn = Math.min(r, g, b),
      d = mx - mn;
    let h = 0;
    if (d > 0)
      h =
        mx === r
          ? ((g - b) / d) % 6
          : mx === g
            ? (b - r) / d + 2
            : (r - g) / d + 4;
    return [h * 60, mx ? d / mx : 0, mx];
  }
  function hsv2rgb(h, s, v) {
    h = ((h % 360) + 360) % 360;
    const c = v * s,
      x = c * (1 - Math.abs(((h / 60) % 2) - 1)),
      m = v - c;
    const [r, g, b] =
      h < 60
        ? [c, x, 0]
        : h < 120
          ? [x, c, 0]
          : h < 180
            ? [0, c, x]
            : h < 240
              ? [0, x, c]
              : h < 300
                ? [x, 0, c]
                : [c, 0, x];
    return [
      Math.round((r + m) * 255),
      Math.round((g + m) * 255),
      Math.round((b + m) * 255),
    ];
  }
  const clamp01 = (v) => Math.max(0, Math.min(1, v));
  function tuneRamp(ramp, dh = 0, ds = 1, dv = 1) {
    return ramp.map((c, i) => {
      const [h, s, v] = rgb2hsv(c);
      return hsv2rgb(h + dh * (i ? 1 : 0.5), clamp01(s * ds), clamp01(v * dv));
    });
  }
  const rampOf = (m) => CLASSIC[M[m] ?? M.FOREST].map(hexToRgb);
  const hexRamp = (a) => a.map(hexToRgb);
  const BARK = {
    brown: hexRamp(["#1c1418", "#3f2a22", "#5e4030", "#7d5a3e", "#9c7652"]),
    grey: hexRamp(["#1a1a20", "#4a4850", "#6d6a70", "#8f8b8e", "#b2aeae"]),
    pale: hexRamp(["#23222a", "#77747a", "#b8b4b0", "#dcd8d0", "#f4f0e8"]),
    red: hexRamp(["#1f1216", "#57281f", "#7e3d2a", "#a0573a", "#c07650"]),
    dark: hexRamp(["#101014", "#26222a", "#3a3440", "#524a52", "#6e6468"]),
  };
  const SNOW = hexRamp(["#1e2649", "#8a9cc4", "#c9d5ea", "#e8eef8", "#ffffff"]);
  const leafRamp = (L) => tuneRamp(rampOf(L.mat), L.hue, L.sat, L.val);
  const mixc = (a, b, t) => [
    a[0] + (b[0] - a[0]) * t,
    a[1] + (b[1] - a[1]) * t,
    a[2] + (b[2] - a[2]) * t,
  ];
  // a 5-step ramp from one colour: shadows lean violet, highlights lean warm
  function rampFrom(c) {
    return [
      mixc(
        c.map((v) => v * 0.2),
        [14, 12, 40],
        0.5,
      ),
      mixc(
        c.map((v) => v * 0.62),
        [40, 30, 80],
        0.22,
      ),
      c.map((v) => v),
      mixc(
        c.map((v) => Math.min(255, v * 1.14)),
        [255, 244, 200],
        0.14,
      ),
      mixc(c, [255, 250, 226], 0.45),
    ].map((x) => x.map((v) => Math.max(0, Math.min(255, Math.round(v)))));
  }

  // ---------- slots: what a painted pixel is made of ----------
  const SLOT = { MAIN: 0, BARK: 1, PETAL: 2, SNOW: 3, ACCENT: 4, STEM: 5 };
  const SLOTS = 6;
  const ENC = [0, 1, 2, 3, 4, 5].map((s) =>
    [0, 1, 2, 3, 4].map((k) => ({ s, k })),
  );
  const [LEAF, WOOD, PETAL, SNOWE, ACC, STEM] = ENC;
  // the colours each slot means for a species (the GPU reads these as ramp rows)
  function speciesRamps(g) {
    const main =
      g.form === "cap"
        ? g.cap.map((c) => c.slice())
        : g.form === "stone"
          ? rampOf(g.tint)
          : leafRamp(g.leaf);
    const bark =
      g.form === "cap"
        ? hexRamp(["#2a2430", "#8f8478", "#cfc3b0", "#e8dfcc", "#faf4e4"])
        : BARK[g.bark] || BARK.brown;
    const petal = rampFrom(
      g.form === "flower"
        ? g.c
        : g.form === "succulent" && g.flowers
          ? g.flowers
          : g.bloom
            ? g.bloom.c
            : [240, 240, 240],
    );
    const accent = rampFrom(
      g.form === "flower"
        ? g.c2
        : g.form === "grass"
          ? [220, 200, 140]
          : g.form === "palm"
            ? [96, 70, 44]
            : g.form === "reed"
              ? [110, 64, 38]
              : g.form === "shrub" && g.berries
                ? g.berries
                : g.form === "cap"
                  ? [250, 246, 236]
                  : g.form === "succulent"
                    ? [240, 236, 210]
                    : [230, 200, 120],
    );
    const stem =
      g.form === "flower"
        ? rampFrom([250, 228, 120])
        : g.form === "stone"
          ? rampOf("WETFOREST")
          : g.form === "reed"
            ? rampOf("STEPPE")
            : tuneRamp(rampOf("FOREST"), 0, 1, 0.9);
    const flowerStem =
      g.form === "flower" ? tuneRamp(rampOf("FOREST"), g.leaf.hue, 1, 1) : null;
    return [flowerStem || main, bark, petal, SNOW, accent, stem];
  }

  // ---------- ramp table: every ramp the ground view uses, one texture row each ----------
