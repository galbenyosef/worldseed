// index-inline-2 61 — pat
// Lines 22758-23047 of readable/index-inline-2.pretty.js (statement-aligned).
  function railInto(mb, T, R) {
    const P = (x, y, z) => T([x, y, z]);
    for (const x of [-1.15, 1.15])
      mb.prism(P(x, -0.15, 0), P(x, 1.08, 0), 0.07, 0.06, 5, R.wood, PAT.BARK);
    mb.prism(
      P(-1.25, 0.96, 0),
      P(1.25, 0.98, 0),
      0.045,
      0.045,
      5,
      R.wood,
      PAT.BARK,
    );
    mb.prism(
      P(-0.2, 0.92, 0.02),
      P(0.05, 0.55, 0.45),
      0.012,
      0.012,
      3,
      R.dark || R.wood,
      PAT.NONE,
    );
  }
  // a smith's forge by a door: a stone hearth with coals glowing on it, an anvil on a stump, a quench tub.
  // T maps a point in its own metres (x along the wall, y up, z out from the wall) into place
  function forgeInto(mb, T, R) {
    const P = (x, y, z) => T([x, y, z]);
    const box = (x0, y0, z0, x1, y1, z1, row, pat, o = null) => {
      mb.quad(
        P(x0, y1, z1),
        P(x1, y1, z1),
        P(x1, y1, z0),
        P(x0, y1, z0),
        row,
        pat,
        [
          [x0, z1],
          [x1, z1],
          [x1, z0],
          [x0, z0],
        ],
        o,
      );
      mb.quad(
        P(x0, y0, z1),
        P(x1, y0, z1),
        P(x1, y1, z1),
        P(x0, y1, z1),
        row,
        pat,
        [
          [x0, y0],
          [x1, y0],
          [x1, y1],
          [x0, y1],
        ],
        o,
      );
      mb.quad(
        P(x1, y0, z0),
        P(x0, y0, z0),
        P(x0, y1, z0),
        P(x1, y1, z0),
        row,
        pat,
        [
          [x0, y0],
          [x1, y0],
          [x1, y1],
          [x0, y1],
        ],
        o,
      );
      mb.quad(
        P(x1, y0, z1),
        P(x1, y0, z0),
        P(x1, y1, z0),
        P(x1, y1, z1),
        row,
        pat,
        [
          [z0, y0],
          [z1, y0],
          [z1, y1],
          [z0, y1],
        ],
        o,
      );
      mb.quad(
        P(x0, y0, z0),
        P(x0, y0, z1),
        P(x0, y1, z1),
        P(x0, y1, z0),
        row,
        pat,
        [
          [z0, y0],
          [z1, y0],
          [z1, y1],
          [z0, y1],
        ],
        o,
      );
    };
    // the hearth, its coals, a hood of stone over it
    box(-0.75, -0.1, -0.4, 0.05, 0.72, 0.38, R.base || R.wall, PAT.STONE);
    box(-0.62, 0.72, -0.28, -0.08, 0.78, 0.26, R.flame || R.glow, PAT.FLAME);
    box(-0.66, 0.72, -0.32, -0.04, 0.75, 0.3, R.char || R.dark, PAT.NONE);
    box(-0.8, 1.55, -0.42, 0.1, 1.75, 0.3, R.base || R.wall, PAT.STONE);
    for (const x of [-0.78, 0.03])
      box(x, 0.72, -0.4, x + 0.06, 1.56, -0.32, R.base || R.wall, PAT.STONE);
    // the anvil on its stump, the tub
    mb.prism(
      P(0.55, -0.1, 0.05),
      P(0.55, 0.42, 0.05),
      0.2,
      0.18,
      7,
      R.dark || R.wood,
      PAT.BARK,
    );
    box(0.38, 0.42, -0.04, 0.74, 0.5, 0.14, R.iron || R.dark, PAT.NONE);
    box(0.43, 0.5, -0.02, 0.69, 0.62, 0.12, R.iron || R.dark, PAT.NONE);
    mb.prism(
      P(0.74, 0.56, 0.05),
      P(0.92, 0.57, 0.05),
      0.05,
      0.012,
      5,
      R.iron || R.dark,
      PAT.NONE,
    );
    mb.prism(
      P(0.95, -0.05, -0.2),
      P(0.95, 0.4, -0.2),
      0.2,
      0.22,
      8,
      R.wood,
      PAT.PLANK,
      null,
      0,
      true,
    );
  }

  const ICO = icosphere();
  // one lumpy stone of a given size, sitting with its base at cy
  function lumpInto(mb, cx, cy, cz, sx, sy, sz, row, row2, seed, spin = 0) {
    const r = mulberry32(seed >>> 0),
      ph = [r() * 10, r() * 10, r() * 10];
    const cs = Math.cos(spin),
      sn = Math.sin(spin);
    const P = ICO.v.map((p) => {
      const k =
        0.84 +
        0.26 *
          Math.sin(p[0] * 3.1 + ph[0]) *
          Math.sin(p[1] * 2.7 + ph[1]) *
          Math.sin(p[2] * 2.9 + ph[2]);
      const x = p[0] * sx * k,
        z = p[2] * sz * k;
      return [
        cx + x * cs - z * sn,
        cy + (p[1] * k + 0.8) * sy,
        cz + x * sn + z * cs,
      ];
    });
    const o = { row2: row2 != null ? row2 : row };
    for (const [a, b, c] of ICO.f)
      mb.tri(P[a], P[c], P[b], row, PAT.ROCK, null, o);
  }
  function rockProto(g, base, rnd, snow) {
    const mb = new MeshBuf();
    const H = g.h;
    const shape = g.shape;
    const rocks = shape === "pile" ? 3 : 1;
    let rad = 0;
    for (let k = 0; k < rocks; k++) {
      const s = rocks === 1 ? 1 : 0.5 + rnd() * 0.35;
      const sx = (shape === "slab" ? 1.5 : shape === "spire" ? 0.42 : 1.1) * s,
        sy = (shape === "slab" ? 0.5 : shape === "spire" ? 1.7 : 0.85) * s,
        sz = (shape === "slab" ? 1.2 : shape === "spire" ? 0.42 : 0.95) * s;
      const ox = rocks === 1 ? 0 : (k - 1) * H * 0.55 + (rnd() - 0.5) * 0.2,
        oz = rocks === 1 ? 0 : (rnd() - 0.5) * H * 0.5;
      const ph = [rnd() * 10, rnd() * 10, rnd() * 10];
      const P = ICO.v.map((p) => {
        const nse =
          0.82 +
          0.3 *
            Math.sin(p[0] * 3.1 + ph[0]) *
            Math.sin(p[1] * 2.7 + ph[1]) *
            Math.sin(p[2] * 2.9 + ph[2]) +
          (rnd() - 0.5) * 0.12;
        return [
          ox + p[0] * sx * nse * H * 0.5,
          (p[1] * sy * nse + sy * 0.55) * H * 0.5,
          oz + p[2] * sz * nse * H * 0.5,
        ];
      });
      const o = { row2: snow ? base + SLOT.SNOW : base + SLOT.STEM };
      for (const [a, b, c] of ICO.f)
        mb.tri(P[a], P[c], P[b], base + SLOT.MAIN, PAT.ROCK, null, o);
      rad = Math.max(rad, Math.abs(ox) + sx * H * 0.5);
    }
    // (on a slope a rock lies along it, all of it)
    return {
      mesh: mb,
      cards: [],
      radius: rad,
      kind: "rock",
      top: H,
      moss: g.moss || 0,
      snow,
      shearH: H * 1.2,
    };
  }

  function cactusProto(g, base, rnd) {
    const mb = new MeshBuf();
    const H = g.h,
      row = base + SLOT.MAIN;
    if (g.shape === "barrel") {
      const r = H * 0.5;
      for (let j = 0; j < 4; j++) {
        const a0 = (j / 4) * Math.PI * 0.5,
          a1 = ((j + 1) / 4) * Math.PI * 0.5;
        mb.prism(
          [0, j ? Math.sin(a0) * H * 0.9 : -0.25, 0],
          [0, Math.sin(a1) * H * 0.9, 0],
          r * Math.cos(a0) + 0.02,
          r * Math.cos(a1) + 0.02,
          10,
          row,
          PAT.RIB,
        );
      }
      return {
        mesh: mb,
        cards: [],
        radius: r,
        kind: "cactus",
        top: H,
        trunkR: r + 0.02,
        shearH: H,
      };
    }
    const r = Math.max(0.12, H * 0.09);
    mb.prism([0, -0.35, 0], [0, H - r, 0], r, r, 8, row, PAT.RIB);
    mb.prism([0, H - r, 0], [0, H, 0], r, r * 0.4, 8, row, PAT.RIB);
    for (let k = 0; k < g.arms; k++) {
      const a = k * 2.4 + rnd(),
        d = [Math.cos(a), 0, Math.sin(a)];
      const ay = H * (0.3 + rnd() * 0.3),
        out = r * 2.6,
        up = H * (0.18 + rnd() * 0.2);
      const p0 = [0, ay, 0],
        p1 = addv(mul(d, out), [0, ay, 0]),
        p2 = addv(p1, [0, up, 0]);
      mb.prism(p0, p1, r * 0.7, r * 0.7, 6, row, PAT.RIB);
      mb.prism(
        addv(p1, [0, -r * 0.6, 0]),
        p2,
        r * 0.72,
        r * 0.72,
        6,
        row,
        PAT.RIB,
      );
      mb.prism(
        p2,
        addv(p2, [0, r * 0.6, 0]),
        r * 0.72,
        r * 0.25,
        6,
        row,
        PAT.RIB,
      );
    }
    return {
      mesh: mb,
      cards: [],
      radius: r * 3,
      kind: "cactus",
      top: H,
      trunkR: r * 1.3,
      shearH: 0.9,
    };
  }

