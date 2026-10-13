// index-inline-2 60 — pat
// Lines 22410-22757 of readable/index-inline-2.pretty.js (statement-aligned).
  function wrightBenchInto(mb, T, R, seed) {
    const P = (x, y, z) => T([x, y, z]);
    const rnd = mulberry32(seed >>> 0);
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
    box(-0.65, 0.72, -0.3, 0.65, 0.8, 0.3, R.wood, PAT.PLANK);
    for (const x of [-0.5, 0.5]) {
      mb.prism(
        P(x, -0.1, -0.22),
        P(x, 0.74, -0.05),
        0.04,
        0.035,
        4,
        R.dark || R.wood,
        PAT.NONE,
      );
      mb.prism(
        P(x, -0.1, 0.22),
        P(x, 0.74, 0.05),
        0.04,
        0.035,
        4,
        R.dark || R.wood,
        PAT.NONE,
      );
    }
    // the model: walls of the people's own colour, a roof over them
    const mx = -0.15,
      mw = 0.24 + rnd() * 0.06,
      md = 0.18,
      mh = 0.16,
      y0 = 0.8;
    box(mx - mw, y0, -md, mx + mw, y0 + mh, md, R.wall || R.wood, PAT.NONE);
    mb.quad(
      P(mx - mw - 0.03, y0 + mh, md + 0.03),
      P(mx + mw + 0.03, y0 + mh, md + 0.03),
      P(mx + mw + 0.03, y0 + mh + 0.13, 0),
      P(mx - mw - 0.03, y0 + mh + 0.13, 0),
      R.roof || R.wood,
      PAT.NONE,
    );
    mb.quad(
      P(mx + mw + 0.03, y0 + mh, -md - 0.03),
      P(mx - mw - 0.03, y0 + mh, -md - 0.03),
      P(mx - mw - 0.03, y0 + mh + 0.13, 0),
      P(mx + mw + 0.03, y0 + mh + 0.13, 0),
      R.roof || R.wood,
      PAT.NONE,
    );
    mb.tri(
      P(mx + mw, y0 + mh, md),
      P(mx + mw, y0 + mh, -md),
      P(mx + mw, y0 + mh + 0.12, 0),
      R.wall || R.wood,
      PAT.NONE,
    );
    mb.tri(
      P(mx - mw, y0 + mh, -md),
      P(mx - mw, y0 + mh, md),
      P(mx - mw, y0 + mh + 0.12, 0),
      R.wall || R.wood,
      PAT.NONE,
    );
    // a mallet and a few pegs
    mb.prism(
      P(0.3, 0.83, -0.1),
      P(0.52, 0.83, 0.05),
      0.015,
      0.015,
      4,
      R.wood,
      PAT.NONE,
    );
    box(0.47, 0.8, -0.02, 0.6, 0.88, 0.1, R.dark || R.wood, PAT.NONE);
    for (let k = 0; k < 3; k++)
      mb.prism(
        P(0.2 + k * 0.06, 0.8, 0.18),
        P(0.2 + k * 0.06, 0.86, 0.2),
        0.012,
        0.01,
        3,
        R.straw || R.wood,
        PAT.NONE,
      );
  }
  // Timber stacked by a house-wright's door: squared beams on sleepers, and a few logs
  function lumberInto(mb, T, R, seed) {
    const P = (x, y, z) => T([x, y, z]);
    const rnd = mulberry32(seed >>> 0);
    for (const x of [-0.6, 0.6])
      mb.prism(
        P(x, 0.05, -0.55),
        P(x, 0.05, 0.55),
        0.07,
        0.07,
        4,
        R.dark || R.wood,
        PAT.NONE,
      );
    for (let layer = 0; layer < 3; layer++) {
      const n = 4 - layer;
      for (let k = 0; k < n; k++) {
        const z = (k - (n - 1) / 2) * 0.22,
          y = 0.17 + layer * 0.15,
          len = 0.85 + rnd() * 0.12;
        mb.prism(
          P(-len, y, z),
          P(len, y, z),
          0.075,
          0.075,
          4,
          R.wood,
          PAT.PLANK,
        );
      }
    }
    // two logs leaning against the stack
    mb.prism(
      P(-0.9, 0.0, 0.62),
      P(-0.55, 0.85, 0.3),
      0.08,
      0.07,
      6,
      R.dark || R.wood,
      PAT.BARK,
    );
    mb.prism(
      P(0.95, 0.0, 0.6),
      P(0.62, 0.78, 0.32),
      0.075,
      0.065,
      6,
      R.dark || R.wood,
      PAT.BARK,
    );
  }
  // A house-wright's sign: a board on a post, with a little house painted on it (both faces)
  function houseSignInto(mb, T, R) {
    const P = (x, y, z) => T([x, y, z]);
    mb.prism(P(0, -0.2, 0), P(0, 2.35, 0), 0.06, 0.05, 4, R.wood, PAT.BARK);
    const paint = R.banner || R.cloth || R.wood,
      ink = R.char || R.dark || R.wood,
      wall = R.rag || R.straw || R.wood;
    for (const sd of [1, -1]) {
      const z = sd * 0.07;
      const q = (a, b, c, d, row) =>
        sd > 0
          ? mb.quad(a, b, c, d, row, PAT.NONE)
          : mb.quad(b, a, d, c, row, PAT.NONE);
      q(
        P(-0.42, 1.55, z),
        P(0.42, 1.55, z),
        P(0.42, 2.12, z),
        P(-0.42, 2.12, z),
        paint,
      );
      // the little house: walls, a door, a roof
      const z2 = z + sd * 0.01;
      q(
        P(-0.2, 1.64, z2),
        P(0.2, 1.64, z2),
        P(0.2, 1.86, z2),
        P(-0.2, 1.86, z2),
        wall,
      );
      q(
        P(-0.05, 1.64, z2 + sd * 0.005),
        P(0.05, 1.64, z2 + sd * 0.005),
        P(0.05, 1.78, z2 + sd * 0.005),
        P(-0.05, 1.78, z2 + sd * 0.005),
        ink,
      );
      const t =
        sd > 0
          ? [P(-0.27, 1.86, z2), P(0.27, 1.86, z2), P(0, 2.06, z2)]
          : [P(0.27, 1.86, z2), P(-0.27, 1.86, z2), P(0, 2.06, z2)];
      mb.tri(t[0], t[1], t[2], ink, PAT.NONE);
    }
    mb.prism(
      P(-0.45, 2.14, 0),
      P(0.45, 2.14, 0),
      0.03,
      0.03,
      4,
      R.dark || R.wood,
      PAT.NONE,
    );
  }
  // Steps up to a door that stands above the ground: stone blocks out from the sill, each a riser
  // lower than the one before, each going down into the ground under it so no gap shows on a slope.
  // Its own metres: x across the doorway, y up, z out from the door. steps: [{ z0, z1, top, bot }].
  function stairInto(mb, T, R, steps, half = 0.75) {
    const P = (x, y, z) => T([x, y, z]),
      row = R.base || R.wall,
      x0 = -half,
      x1 = half;
    for (const s of steps) {
      const { z0, z1, top: y1, bot: y0 } = s;
      mb.quad(
        P(x0, y1, z1),
        P(x1, y1, z1),
        P(x1, y1, z0),
        P(x0, y1, z0),
        row,
        PAT.STONE,
        [
          [x0, z1],
          [x1, z1],
          [x1, z0],
          [x0, z0],
        ],
      );
      mb.quad(
        P(x0, y0, z1),
        P(x1, y0, z1),
        P(x1, y1, z1),
        P(x0, y1, z1),
        row,
        PAT.STONE,
        [
          [x0, y0],
          [x1, y0],
          [x1, y1],
          [x0, y1],
        ],
      );
      mb.quad(
        P(x1, y0, z1),
        P(x1, y0, z0),
        P(x1, y1, z0),
        P(x1, y1, z1),
        row,
        PAT.STONE,
        [
          [z0, y0],
          [z1, y0],
          [z1, y1],
          [z0, y1],
        ],
      );
      mb.quad(
        P(x0, y0, z0),
        P(x0, y0, z1),
        P(x0, y1, z1),
        P(x0, y1, z0),
        row,
        PAT.STONE,
        [
          [z0, y0],
          [z1, y0],
          [z1, y1],
          [z0, y1],
        ],
      );
    }
  }
  // the lowest and highest ground under a building: a 3×3 grid over its turned footprint. hAt(x, z) in the caller's metres
  function footLoHi(b, hAt) {
    const cs = Math.cos(b.rot || 0),
      sn = Math.sin(b.rot || 0);
    let lo = 1e9,
      hi = -1e9;
    for (const dx of [-1, 0, 1])
      for (const dz of [-1, 0, 1]) {
        const u = (dx * b.w) / 2,
          v = (dz * b.d) / 2,
          h = hAt(b.x + u * cs - v * sn, b.z + u * sn + v * cs);
        if (h < lo) lo = h;
        if (h > hi) hi = h;
      }
    return [lo, hi];
  }
  // a hitching rail: two posts and a bar, for a beast to stand tied to (x along the rail)
