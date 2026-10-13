// index-inline-2 54 — math
// Lines 20528-20874 of readable/index-inline-2.pretty.js (statement-aligned).
  function paintClump(g, seed, snow = false) {
    const rnd = mulberry32(seed >>> 0);
    const droop = g.shape === "droop";
    const shrub = g.form === "shrub";
    const S = shrub ? 22 : 30,
      W = S,
      H = droop ? Math.round(S * 1.6) : S;
    const P = painter(W, H);
    const flat = g.shape === "flat" ? 0.7 : 1;
    const cl = [];
    const n = 3 + ((rnd() * 3) | 0);
    for (let i = 0; i < n; i++) {
      const a = rnd() * Math.PI * 2,
        r = rnd() * S * 0.18;
      cl.push({
        x: W / 2 + Math.cos(a) * r,
        y: S / 2 + Math.sin(a) * r * 0.8,
        rx: S * (0.24 + rnd() * 0.1),
        ry: S * (0.22 + rnd() * 0.1) * flat,
      });
    }
    cl.push({
      x: W / 2,
      y: S / 2,
      rx: S * 0.36,
      ry: S * 0.34 * (g.shape === "flat" ? 0.72 : 1),
    });
    // weeping crowns hang in tassels of leaves, not strings
    if (droop)
      for (let k = 0; k < 4; k++) {
        const x = W * (0.2 + (0.6 * (k + rnd() * 0.6)) / 4),
          len = (H - S * 0.62) * (0.55 + rnd() * 0.4);
        cl.push({
          x,
          y: S * 0.62 + len / 2,
          rx: S * (0.07 + rnd() * 0.04),
          ry: len / 2,
        });
      }
    const sd = (rnd() * 1e6) | 0;
    const where = (x, y) => {
      let d = 9,
        lx = 0,
        ly = 0;
      for (const c of cl) {
        const dx = (x - c.x) / c.rx,
          dy = (y - c.y) / c.ry,
          e = dx * dx + dy * dy;
        if (e < d) {
          d = e;
          lx = dx;
          ly = dy;
        }
      }
      return { d, lx, ly };
    };
    const edge = (x, y) =>
      1 +
      (h2(x | 0, y | 0, sd + 3) - 0.5) * 0.3 +
      (h2(x >> 1, y >> 1, sd + 5) - 0.5) * 0.35;
    // lit from the upper left, darker inside the crown
    const light = (x, y, w) =>
      0.42 -
      0.34 * w.lx -
      0.46 * w.ly -
      0.6 * ((0.3 * (x - W / 2)) / (S / 2) + (0.4 * (y - S / 2)) / (S / 2));
    const lev = (l) => (l > 0.8 ? 4 : l > 0.4 ? 3 : l > 0.0 ? 2 : 1);
    // 1. the shaded depth of the crown, only ever seen from afar
    for (let y = 0; y < H; y++)
      for (let x = 0; x < W; x++) {
        const w = where(x + 0.5, y + 0.5);
        if (w.d > edge(x, y) * 0.9) continue;
        P.hole(x, y, LEAF[Math.max(0, lev(light(x + 0.5, y + 0.5, w)) - 2)]);
      }
    // 2. single leaves on a jittered grid, painted dark to light so the lit ones sit on top
    const step = shrub ? 2.7 : 3.2;
    const keep = 0.72 + 0.22 * Math.min(1, g.fill ?? 0.85);
    const leaves = [];
    for (let gy = -1; gy <= Math.ceil(H / step); gy++)
      for (let gx = -1; gx <= Math.ceil(W / step); gx++) {
        const cx = (gx + 0.15 + 0.7 * h2(gx, gy, sd + 21)) * step,
          cy = (gy + 0.15 + 0.7 * h2(gx, gy, sd + 22)) * step;
        const w = where(cx, cy);
        if (w.d > edge(cx, cy) || h2(gx, gy, sd + 23) > keep) continue;
        leaves.push({
          cx,
          cy,
          l: light(cx, cy, w) + (h2(gx, gy, sd + 24) - 0.5) * 0.45,
          a: h2(gx, gy, sd + 25) * Math.PI,
          rx: step * (0.52 + 0.2 * h2(gx, gy, sd + 26)),
          ry: step * (0.36 + 0.14 * h2(gx, gy, sd + 27)),
          bloom: g.bloom && h2(gx, gy, sd + 19) < g.bloom.k,
        });
      }
    leaves.sort((p, q) => p.l - q.l);
    for (const f of leaves) {
      const k0 = lev(f.l),
        cs = Math.cos(f.a),
        sn = Math.sin(f.a),
        R = Math.ceil(Math.max(f.rx, f.ry)) + 1;
      for (let y = Math.floor(f.cy - R); y <= f.cy + R; y++)
        for (let x = Math.floor(f.cx - R); x <= f.cx + R; x++) {
          const dx = x + 0.5 - f.cx,
            dy = y + 0.5 - f.cy;
          const u = (dx * cs + dy * sn) / f.rx,
            v = (-dx * sn + dy * cs) / f.ry;
          if (u * u + v * v > 1) continue;
          // each leaf catches light on its upper edge and is shaded beneath
          const k = Math.max(
            1,
            Math.min(4, k0 + (dy < -0.45 ? 1 : dy > 0.65 ? -1 : 0)),
          );
          let c = LEAF[k];
          if (snow && (k >= 3 || dy < -0.5) && h2(x, y, sd + 17) < 0.8)
            c = SNOWE[k >= 4 ? 4 : 3];
          else if (f.bloom && k >= 2) c = PETAL[k >= 3 ? 3 : 2];
          P.set(x, y, c);
        }
    }
    return P;
  }
  // A frond seen from above: a rib with leaflets, used on 3D ribbons
  function paintFrond(g, seed) {
    const rnd = mulberry32(seed >>> 0);
    const W = 40,
      H = 14,
      P = painter(W, H);
    for (let x = 0; x < W; x++) {
      const t = x / (W - 1),
        half =
          (H / 2 - 1) *
          Math.sin(Math.min(1, t * 1.25) * Math.PI) *
          (1 - t * 0.35);
      P.set(x, H / 2, WOOD[3]);
      if (x % 2 === 0)
        for (let q = 1; q <= half; q++) {
          const drop = q * 0.25;
          P.set(x + drop, H / 2 - q, LEAF[q < half * 0.5 ? 3 : 2]);
          P.set(x + drop, H / 2 + q, LEAF[q < half * 0.5 ? 2 : 1]);
        }
    }
    if (rnd() < 2) outline(P, 0.6);
    return P;
  }

  // ---------- atlas: sprites for far trees, cards for grass, parts for 3D ----------
  const VARIANTS = {
    broadleaf: 3,
    conifer: 3,
    palm: 2,
    umbrella: 2,
    snag: 2,
    shrub: 3,
    succulent: 2,
    fern: 2,
    grass: 3,
    flower: 2,
    reed: 2,
    cap: 2,
    stone: 3,
  };
  const SNOWY = new Set(["conifer", "broadleaf", "shrub", "stone"]);
  const CLUMPY = new Set(["broadleaf", "umbrella", "shrub"]);

  function buildFloraAtlas(flora) {
    const sheets = [];
    const push = (sp, kind, snow, P) => sheets.push({ sp, kind, snow, P });
    for (const sp of flora.species) {
      const nv = VARIANTS[sp.form] || 2;
      for (let v = 0; v < nv; v++)
        push(sp.id, "whole", false, paintPlant(sp.g, hashInt(sp.id, v, 71)));
      const snowy = sp.cold && SNOWY.has(sp.form);
      if (snowy)
        for (let v = 0; v < 2; v++)
          push(
            sp.id,
            "whole",
            true,
            paintPlant(sp.g, hashInt(sp.id, v, 71), true),
          );
      if (CLUMPY.has(sp.form)) {
        for (let v = 0; v < 3; v++)
          push(sp.id, "clump", false, paintClump(sp.g, hashInt(sp.id, v, 91)));
        if (snowy)
          for (let v = 0; v < 2; v++)
            push(
              sp.id,
              "clump",
              true,
              paintClump(sp.g, hashInt(sp.id, v, 91), true),
            );
      }
      if (sp.form === "palm")
        push(sp.id, "frond", false, paintFrond(sp.g, hashInt(sp.id, 5, 93)));
    }
    // tallest first, then shelves left to right
    const order = sheets
      .map((s, i) => i)
      .sort((a, b) => sheets[b].P.H - sheets[a].P.H);
    const AW = 1024;
    let x = 0,
      y = 0,
      shelf = 0;
    const place = new Array(sheets.length);
    for (const i of order) {
      const P = sheets[i].P;
      if (x + P.W + 2 > AW) {
        x = 0;
        y += shelf + 2;
        shelf = 0;
      }
      place[i] = [x + 1, y + 1];
      x += P.W + 2;
      shelf = Math.max(shelf, P.H);
    }
    const AH = y + shelf + 2;
    const data = new Uint8Array(AW * AH * 4);
    const entries = [];
    const bySp = flora.species.map(() => ({
      whole: [],
      wholeSnow: [],
      clump: [],
      clumpSnow: [],
      frond: [],
    }));
    sheets.forEach((s, i) => {
      const P = s.P,
        [ox, oy] = place[i];
      // written bottom-up so texture v runs upwards
      for (let yy = 0; yy < P.H; yy++)
        data.set(
          P.px.subarray(yy * P.W * 4, (yy + 1) * P.W * 4),
          ((AH - 1 - (oy + yy)) * AW + ox) * 4,
        );
      const e = {
        sp: s.sp,
        kind: s.kind,
        snow: s.snow,
        w: P.W,
        h: P.H,
        u0: ox / AW,
        u1: (ox + P.W) / AW,
        v0: (AH - (oy + P.H)) / AH,
        v1: (AH - oy) / AH,
      };
      bySp[s.sp][s.kind + (s.snow ? "Snow" : "")].push(entries.length);
      entries.push(e);
    });
    return { data, width: AW, height: AH, entries, bySp };
  }

  // preview helper: turn slot/level pixels into colours with a species' ramps
  function colorize(px, ramps, light = 0) {
    const out = new Uint8ClampedArray(px.length);
    for (let i = 0; i < px.length; i += 4) {
      if (!px[i + 3]) continue;
      const k = Math.max(0, Math.min(4, Math.round(px[i] / 60) + light)),
        s = Math.round(px[i + 1] / 40);
      const c = ramps[s][k];
      out[i] = c[0];
      out[i + 1] = c[1];
      out[i + 2] = c[2];
      out[i + 3] = 255;
    }
    return out;
  }

  // ---- view/kits.js ----
  // ============================================================
  // KITS — 3D models assembled from parts, driven by genomes.
  // A tree is a trunk and branches with real volume plus a crown of leaf
  // clumps hung in 3D; a pine is stacked tiers; a palm has arched fronds;
  // rocks, cacti and mushrooms are solid shapes. People are body parts plus
  // clothes, hats and things they carry; houses are floors stacked on floors
  // under a roof. Everything is flat-shaded and lit by palette ramps, so it
  // sits in the same pixel world as the ground.
  // ============================================================

  // surface patterns the shader knows how to draw
  const PAT = {
    NONE: 0,
    BARK: 1,
    NEEDLE: 2,
    NEEDLE_SNOW: 3,
    PLANK: 4,
    LOG: 5,
    BRICK: 6,
    STONE: 7,
    PLASTER: 8,
    THATCH: 9,
    TILE: 10,
    SLATE: 11,
    WINDOW: 12,
    DOOR: 13,
    RIB: 14,
    FACE: 15,
    ROCK: 16,
    FROND: 17,
    CLOTH: 18,
    SHADOW: 19,
    RINGS: 20,
    HIDE: 21,
    GLOW: 22,
    FLAME: 23,
    POOL: 24,
    LAMP: 25,
    NIGHTFLAME: 26,
    WRAP: 27,
    DEADFACE: 28,
    EYES: 29,
    // underground only (the cave's own shader draws these)
    CAVEROCK: 30,
    CAVEFLOOR: 31,
    FLOWSTONE: 32,
    CRYSTAL: 33,
    FOXFIRE: 34,
    DAYLIGHT: 35,
    // water thrown at the sky: broken up and glinting, never still
    SPRAY: 36,
  };

  // ---------- tiny vector helpers ----------
  const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
  const addv = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
  const mul = (a, k) => [a[0] * k, a[1] * k, a[2] * k];
  const crossv = (a, b) => [
    a[1] * b[2] - a[2] * b[1],
    a[2] * b[0] - a[0] * b[2],
    a[0] * b[1] - a[1] * b[0],
  ];
  const lenv = (a) => Math.hypot(a[0], a[1], a[2]);
  const normv = (a) => {
    const l = lenv(a) || 1;
    return [a[0] / l, a[1] / l, a[2] / l];
  };
  const lerpv = (a, b, t) => [
    a[0] + (b[0] - a[0]) * t,
    a[1] + (b[1] - a[1]) * t,
    a[2] + (b[2] - a[2]) * t,
  ];
  function perp(d) {
    const a = Math.abs(d[1]) < 0.9 ? [0, 1, 0] : [1, 0, 0];
    const u = normv(crossv(d, a));
    return [u, crossv(d, u)];
  }

  // ---------- a growable mesh of flat-shaded triangles ----------
