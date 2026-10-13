// index-inline-2 69 — pat
// Lines 26457-26964 of readable/index-inline-2.pretty.js (statement-aligned).
  function workInto(mb, kind, T, R, o = null, ceil = 2.6) {
    const P = (x, y, z) => T([x, y, z]);
    const lv = (k) => ({ ...(o || {}), lv: ((o && o.lv) || 0) + k });
    // a block: its face to the room, its ends and its top (and its back, if it stands out from the wall)
    const box = (x0, y0, z0, x1, y1, z1, row, pat, back = false, oo = o) => {
      const W = x1 - x0,
        H = y1 - y0,
        D = z1 - z0;
      mb.quad(
        P(x0, y0, z1),
        P(x1, y0, z1),
        P(x1, y1, z1),
        P(x0, y1, z1),
        row,
        pat,
        [
          [0, 0],
          [W, 0],
          [W, H],
          [0, H],
        ],
        oo,
      );
      if (back)
        mb.quad(
          P(x1, y0, z0),
          P(x0, y0, z0),
          P(x0, y1, z0),
          P(x1, y1, z0),
          row,
          pat,
          [
            [0, 0],
            [W, 0],
            [W, H],
            [0, H],
          ],
          oo,
        );
      mb.quad(
        P(x1, y0, z1),
        P(x1, y0, z0),
        P(x1, y1, z0),
        P(x1, y1, z1),
        row,
        pat,
        [
          [0, 0],
          [D, 0],
          [D, H],
          [0, H],
        ],
        oo,
      );
      mb.quad(
        P(x0, y0, z0),
        P(x0, y0, z1),
        P(x0, y1, z1),
        P(x0, y1, z0),
        row,
        pat,
        [
          [0, 0],
          [D, 0],
          [D, H],
          [0, H],
        ],
        oo,
      );
      mb.quad(
        P(x0, y1, z1),
        P(x1, y1, z1),
        P(x1, y1, z0),
        P(x0, y1, z0),
        row,
        pat,
        [
          [0, 0],
          [W, 0],
          [W, D],
          [0, D],
        ],
        oo,
      );
    };
    const rod = (
      a,
      b,
      r0,
      r1,
      row,
      pat = PAT.NONE,
      n = 5,
      caps = false,
      oo = o,
    ) => mb.prism(P(...a), P(...b), r0, r1, n, row, pat, oo, 0, caps);
    const wood = R.wood,
      dark = R.dark || R.wood,
      iron = R.iron || dark,
      clay = R.pot || R.base,
      stone = R.base || R.wall,
      char = R.char || dark;
    const flame = R.flame || R.glow,
      wool = R.rag || R.straw || wood,
      cloth = R.cloth || wood,
      band = R.banner || cloth,
      straw = R.straw || wood;
    const out = { boxes: [], tops: [], spot: null };
    if (kind === "oven") {
      // a stone base with the wood kept under it, a clay dome on top with its mouth to the room and the
      // embers showing in it, a flue up to the ceiling, and the peel leaning by it
      const L = 0.62,
        D = 1.04,
        ph = 0.62,
        cz = 0.53,
        rr = 0.5,
        dh = 0.5;
      box(-L, 0, 0.02, L, ph, D, stone, PAT.STONE);
      mb.quad(
        P(-0.42, 0.07, D + 0.006),
        P(0.42, 0.07, D + 0.006),
        P(0.42, 0.44, D + 0.006),
        P(-0.42, 0.44, D + 0.006),
        char,
        PAT.NONE,
        null,
        lv(-0.6),
      );
      for (const [x, y] of [
        [-0.25, 0.15],
        [0, 0.15],
        [0.25, 0.15],
        [-0.13, 0.3],
        [0.13, 0.3],
      ])
        rod(
          [x, y, D - 0.32],
          [x, y, D + 0.03],
          0.075,
          0.075,
          wood,
          PAT.BARK,
          6,
          true,
        );
      const n = 10,
        rings = 4,
        dp = (a, e) => [
          Math.cos(a) * Math.cos(e) * rr,
          ph + Math.sin(e) * dh,
          cz + Math.sin(a) * Math.cos(e) * rr,
        ];
      for (let j = 0; j < rings; j++) {
        const e0 = ((j / rings) * Math.PI) / 2,
          e1 = (((j + 1) / rings) * Math.PI) / 2;
        for (let k = 0; k < n; k++) {
          const a0 = (k / n) * Math.PI * 2,
            a1 = ((k + 1) / n) * Math.PI * 2;
          mb.quad(
            P(...dp(a1, e0)),
            P(...dp(a0, e0)),
            P(...dp(a0, e1)),
            P(...dp(a1, e1)),
            clay,
            PAT.PLASTER,
            null,
            o,
          );
        }
      }
      // the mouth, arched, following the dome back as it rises; the embers on its sill
      mb.quad(
        P(-0.2, ph + 0.01, cz + rr + 0.01),
        P(0.2, ph + 0.01, cz + rr + 0.01),
        P(0.2, ph + 0.24, cz + rr - 0.055),
        P(-0.2, ph + 0.24, cz + rr - 0.055),
        char,
        PAT.NONE,
        null,
        lv(-1),
      );
      mb.tri(
        P(-0.2, ph + 0.24, cz + rr - 0.055),
        P(0.2, ph + 0.24, cz + rr - 0.055),
        P(0, ph + 0.35, cz + rr - 0.13),
        char,
        PAT.NONE,
        null,
        lv(-1),
      );
      box(
        -0.17,
        ph,
        cz + rr - 0.02,
        0.17,
        ph + 0.045,
        cz + rr + 0.03,
        flame,
        PAT.FLAME,
        false,
        null,
      );
      rod(
        [0, ph + dh * 0.7, cz - 0.2],
        [0, ceil, cz - 0.28],
        0.1,
        0.09,
        clay,
        PAT.NONE,
        6,
      );
      // the peel: a long-handled board for getting the bread in and out
      box(0.68, 0, 0.4, 0.92, 0.3, 0.44, wood, PAT.PLANK, true);
      rod(
        [0.8, 0.28, 0.42],
        [0.76, 1.55, 0.06],
        0.022,
        0.02,
        wood,
        PAT.NONE,
        4,
      );
      out.boxes.push([-L, L, 0, D, ph + dh]);
      out.spot = [0, ph + 0.18, cz + rr];
    } else if (kind === "forge") {
      // a heavy bench, its board scarred, a few things on it and under it; an anvil on a stump at its end
      const x0 = -1.02,
        x1 = 0.22,
        z0 = 0.02,
        z1 = 0.64,
        top = 0.86;
      box(x0, top - 0.08, z0, x1, top, z1, wood, PAT.PLANK, true);
      for (const [x, z] of [
        [x0 + 0.07, z0 + 0.07],
        [x1 - 0.07, z0 + 0.07],
        [x0 + 0.07, z1 - 0.07],
        [x1 - 0.07, z1 - 0.07],
      ])
        rod([x, 0, z], [x, top - 0.08, z], 0.05, 0.045, dark, PAT.NONE, 4);
      box(
        x0 + 0.06,
        0.2,
        z0 + 0.08,
        x1 - 0.06,
        0.24,
        z1 - 0.08,
        wood,
        PAT.PLANK,
        true,
      );
      rod(
        [-0.88, 0.31, 0.24],
        [-0.4, 0.31, 0.3],
        0.07,
        0.07,
        wood,
        PAT.BARK,
        6,
        true,
      );
      rod(
        [-0.86, 0.31, 0.42],
        [-0.42, 0.31, 0.44],
        0.065,
        0.065,
        wood,
        PAT.BARK,
        6,
        true,
      );
      // on the board: a haft half shaped, a mallet, a knife, a few shavings
      rod(
        [-0.78, top + 0.03, 0.3],
        [-0.36, top + 0.03, 0.36],
        0.03,
        0.025,
        straw,
        PAT.NONE,
        5,
      );
      rod(
        [-0.2, top + 0.02, 0.18],
        [0.02, top + 0.02, 0.34],
        0.016,
        0.016,
        wood,
        PAT.NONE,
        4,
      );
      box(-0.27, top, 0.12, -0.15, top + 0.09, 0.24, dark, PAT.NONE, true);
      rod(
        [0.04, top + 0.012, 0.46],
        [0.17, top + 0.012, 0.52],
        0.012,
        0.01,
        iron,
        PAT.NONE,
        3,
      );
      for (let k = 0; k < 4; k++)
        box(
          -0.6 + k * 0.09,
          top,
          0.44 + (k % 2) * 0.05,
          -0.56 + k * 0.09,
          top + 0.012,
          0.47 + (k % 2) * 0.05,
          straw,
          PAT.NONE,
        );
      // the stump and the anvil on it (its horn towards the room's end), a hammer resting across it
      const ax = 0.64,
        az = 0.4;
      rod([ax, 0, az], [ax, 0.5, az], 0.24, 0.22, dark, PAT.BARK, 7, true);
      box(
        ax - 0.17,
        0.5,
        az - 0.09,
        ax + 0.17,
        0.57,
        az + 0.09,
        iron,
        PAT.NONE,
        true,
      );
      box(
        ax - 0.11,
        0.57,
        az - 0.06,
        ax + 0.11,
        0.63,
        az + 0.06,
        iron,
        PAT.NONE,
        true,
      );
      box(
        ax - 0.21,
        0.63,
        az - 0.1,
        ax + 0.19,
        0.73,
        az + 0.1,
        iron,
        PAT.NONE,
        true,
      );
      rod(
        [ax + 0.19, 0.69, az],
        [ax + 0.38, 0.7, az],
        0.05,
        0.01,
        iron,
        PAT.NONE,
        5,
      );
      rod(
        [ax - 0.12, 0.76, az - 0.05],
        [ax + 0.08, 0.76, az + 0.12],
        0.015,
        0.015,
        wood,
        PAT.NONE,
        4,
      );
      box(
        ax - 0.17,
        0.73,
        az - 0.1,
        ax - 0.08,
        0.79,
        az - 0.01,
        iron,
        PAT.NONE,
        true,
      );
      out.boxes.push(
        [x0, x1, 0, z1, top],
        [ax - 0.26, ax + 0.26, az - 0.26, az + 0.26, 0.74],
      );
      out.tops.push([x0 + 0.04, x1 - 0.04, z0 + 0.04, z1 - 0.04, top]);
      out.spot = [-0.15, top + 0.05, z1 - 0.05];
    } else if (kind === "loom") {
      // an upright loom leaning on the wall: the cloth woven so far wound on the beam at the top, the warp
      // hanging down from it to a row of clay weights, the heddle rod across; a stool and a basket of wool
      const H = 2.06,
        zb = 0.56,
        zt = 0.1,
        zAt = (y) => zb + ((zt - zb) * y) / H;
      for (const x of [-0.72, 0.72])
        rod([x, 0, zb], [x, H, zt], 0.05, 0.045, wood, PAT.BARK, 5);
      rod(
        [-0.8, H - 0.1, zAt(H - 0.1) + 0.03],
        [0.8, H - 0.1, zAt(H - 0.1) + 0.03],
        0.065,
        0.065,
        dark,
        PAT.BARK,
        6,
        true,
      );
      const cl = (x0, x1, y0, y1, row, pat, k = 0.035) =>
        mb.quad(
          P(x0, y0, zAt(y0) + k),
          P(x1, y0, zAt(y0) + k),
          P(x1, y1, zAt(y1) + k),
          P(x0, y1, zAt(y1) + k),
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
      cl(-0.64, 0.64, 1.32, H - 0.14, cloth, PAT.CLOTH);
      for (const [y0, y1] of [
        [1.44, 1.5],
        [1.68, 1.76],
      ])
        cl(-0.64, 0.64, y0, y1, band, PAT.NONE, 0.04);
      rod(
        [-0.67, 1.32, zAt(1.32) + 0.05],
        [0.67, 1.32, zAt(1.32) + 0.05],
        0.018,
        0.018,
        dark,
        PAT.NONE,
        4,
      );
      // the warp: threads from the cloth down to the weights
      for (let k = 0; k < 14; k++) {
        const x = -0.6 + (k * 1.2) / 13;
        cl(x - 0.009, x + 0.009, 0.44, 1.32, wool, PAT.NONE, 0.03);
      }
      rod(
        [-0.78, 1.0, zAt(1.0) + 0.11],
        [0.78, 1.0, zAt(1.0) + 0.11],
        0.024,
        0.024,
        wood,
        PAT.NONE,
        5,
      );
      rod(
        [-0.76, 0.74, zAt(0.74) - 0.02],
        [0.76, 0.74, zAt(0.74) - 0.02],
        0.03,
        0.03,
        wood,
        PAT.NONE,
        5,
      );
      for (let k = 0; k < 7; k++) {
        const x = -0.54 + k * 0.18,
          z = zAt(0.38) + 0.03;
        rod([x, 0.31, z], [x, 0.44, z], 0.055, 0.045, clay, PAT.NONE, 6, true);
      }
      // the stool, three-legged
      box(-0.2, 0.38, 0.95, 0.2, 0.44, 1.25, wood, PAT.PLANK, true);
      for (const [x, z] of [
        [-0.14, 1.0],
        [0.14, 1.0],
        [0, 1.21],
      ])
        rod([x, 0, z], [x, 0.38, z], 0.025, 0.025, dark, PAT.NONE, 4);
      // the basket of wool, beside it
      rod(
        [-0.58, 0, 1.02],
        [-0.58, 0.26, 1.02],
        0.17,
        0.2,
        straw,
        PAT.THATCH,
        8,
      );
      for (const [x, z, h] of [
        [-0.64, 0.98, 0.3],
        [-0.52, 1.07, 0.29],
        [-0.56, 0.95, 0.33],
      ])
        rod(
          [x, h - 0.07, z],
          [x, h + 0.04, z],
          0.075,
          0.045,
          wool,
          PAT.NONE,
          6,
          true,
        );
      out.boxes.push(
        [-0.8, 0.8, 0, zb + 0.06, H],
        [-0.22, 0.22, 0.93, 1.27, 0.44],
        [-0.79, -0.37, 0.8, 1.24, 0.34],
      );
      out.spot = [0, 1.15, zAt(1.15) + 0.1];
    }
    return out;
  }

  // ---------- a thing set down: its pixel picture, one pixel thick ----------
  // The way old games drew what lay about: the item's 16×16 picture pressed out to a slab one pixel
  // deep, so anything you carry can stand on a shelf or hang on a wall and look like itself.
  // px: its pixels (RGBA, 16×16, no outline); size: metres across; T maps the picture's own metres
  // (x right, y up, z out of its face, centred) into place; rowOf turns a colour into a ramp row.
