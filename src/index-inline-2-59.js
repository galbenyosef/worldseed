// index-inline-2 59 — pat
// Lines 22087-22409 of readable/index-inline-2.pretty.js (statement-aligned).
  function stallInto(mb, T, R, cloth, bare = false) {
    const P = (x, y, z) => T([x, y, z]);
    const box = (x0, y0, z0, x1, y1, z1, row, pat, o) => {
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
          [-x1, y0],
          [-x0, y0],
          [-x0, y1],
          [-x1, y1],
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
          [-z1, y0],
          [-z0, y0],
          [-z0, y1],
          [-z1, y1],
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
    };
    box(-0.95, 0, -0.4, 0.95, 0.85, 0.4, R.wood, PAT.PLANK);
    for (const [x, z] of [
      [-0.95, -0.42],
      [0.95, -0.42],
      [-0.95, 0.42],
      [0.95, 0.42],
    ])
      mb.prism(
        P(x, -0.2, z),
        P(x, z < 0 ? 2.25 : 2.0, z),
        0.04,
        0.035,
        4,
        R.wood,
        PAT.BARK,
      );
    // the awning, sloping down to the front
    mb.quad(
      P(-1.1, 2.0, 0.6),
      P(1.1, 2.0, 0.6),
      P(1.1, 2.3, -0.6),
      P(-1.1, 2.3, -0.6),
      cloth,
      PAT.CLOTH,
      [
        [0, 0],
        [2.2, 0],
        [2.2, 1.3],
        [0, 1.3],
      ],
    );
    mb.quad(
      ...mb.under(
        P(-1.1, 2.0, 0.6),
        P(1.1, 2.0, 0.6),
        P(1.1, 2.3, -0.6),
        P(-1.1, 2.3, -0.6),
      ),
      cloth,
      PAT.CLOTH,
      [
        [0, 0],
        [2.2, 0],
        [2.2, 1.3],
        [0, 1.3],
      ],
      { lv: -0.6 },
    );
    for (let k = 0; k < 5; k++) {
      const x = -1.1 + k * 0.55;
      mb.tri(
        P(x, 2.0, 0.6),
        P(x + 0.55, 2.0, 0.6),
        P(x + 0.275, 1.82, 0.62),
        cloth,
        PAT.CLOTH,
      );
    }
    // goods: baskets, a pot, a few bundles
    const goods = [
      R.straw || R.wood,
      R.pot || R.base,
      R.cloth || R.wood,
      R.straw || R.wood,
    ];
    for (let k = 0; k < (bare ? 0 : 4); k++) {
      const x = -0.7 + k * 0.47;
      mb.prism(
        P(x, 0.85, 0.05),
        P(x, 0.85 + 0.14 + (k % 2) * 0.08, 0.05),
        0.17,
        0.14,
        6,
        goods[k],
        k % 2 ? PAT.NONE : PAT.THATCH,
        null,
        0,
        true,
      );
    }
    box(-1.4, 0, -0.25, -1.05, 0.4, 0.25, R.wood, PAT.PLANK);
  }
  // A sign hung out over a door on an iron arm: a painted board on two chains. The frame's
  // origin is on the wall at the foot of the house (x along the wall, y up, z out of it).
  function hangSignInto(mb, T, R, paint) {
    const P = (x, y, z) => T([x, y, z]);
    mb.prism(
      P(0, 3.05, 0),
      P(0, 3.05, 1.0),
      0.03,
      0.03,
      4,
      R.iron || R.dark || R.wood,
      PAT.NONE,
    );
    mb.prism(
      P(0, 2.7, 0),
      P(0, 3.05, 0.45),
      0.02,
      0.02,
      3,
      R.iron || R.dark || R.wood,
      PAT.NONE,
    );
    for (const z of [0.3, 0.85])
      mb.prism(
        P(0, 3.05, z),
        P(0, 2.82, z),
        0.008,
        0.008,
        3,
        R.iron || R.dark || R.wood,
        PAT.NONE,
      );
    const q = (a, b, c, d) =>
      mb.quad(a, b, c, d, paint, PAT.PLANK, [
        [0, 0],
        [0.7, 0],
        [0.7, 0.55],
        [0, 0.55],
      ]);
    q(
      P(0.02, 2.27, 0.22),
      P(0.02, 2.27, 0.93),
      P(0.02, 2.82, 0.93),
      P(0.02, 2.82, 0.22),
    );
    q(
      P(-0.02, 2.27, 0.93),
      P(-0.02, 2.27, 0.22),
      P(-0.02, 2.82, 0.22),
      P(-0.02, 2.82, 0.93),
    );
  }
  // A workbench by a door: a heavy board on legs, things on it, a stool before it
  function workbenchInto(mb, T, R, seed) {
    const P = (x, y, z) => T([x, y, z]);
    const rnd = mulberry32(seed >>> 0);
    const top = (x0, z0, x1, z1, y0, y1, row, pat) => {
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
      );
    };
    top(-0.6, -0.28, 0.6, 0.28, 0.72, 0.82, R.wood, PAT.PLANK);
    for (const [x, z] of [
      [-0.52, -0.2],
      [0.52, -0.2],
      [-0.52, 0.2],
      [0.52, 0.2],
    ])
      mb.prism(
        P(x, -0.1, z),
        P(x, 0.74, z),
        0.045,
        0.04,
        4,
        R.dark || R.wood,
        PAT.NONE,
      );
    // whatever is being made: a few pieces on the board
    for (let k = 0; k < 3; k++) {
      const x = -0.4 + k * 0.38 + (rnd() - 0.5) * 0.1,
        w = 0.08 + rnd() * 0.1;
      top(
        x - w,
        -0.12,
        x + w,
        0.12,
        0.82,
        0.86 + rnd() * 0.08,
        k === 1 ? R.iron || R.dark || R.wood : R.straw || R.wood,
        PAT.NONE,
      );
    }
  }

  // A house-wright's bench: a board on trestles with a little model house on it, a mallet beside it
