// index-inline-2 58 — pat
// Lines 21750-22086 of readable/index-inline-2.pretty.js (statement-aligned).
  function lampInto(mb, kind, T, R) {
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
          [0, 0],
          [1, 0],
          [1, 1],
          [0, 1],
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
          [0, 0],
          [1, 0],
          [1, 1],
          [0, 1],
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
          [0, 0],
          [1, 0],
          [1, 1],
          [0, 1],
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
          [0, 0],
          [1, 0],
          [1, 1],
          [0, 1],
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
          [0, 0],
          [1, 0],
          [1, 1],
          [0, 1],
        ],
        o,
      );
      mb.quad(
        P(x0, y0, z0),
        P(x1, y0, z0),
        P(x1, y0, z1),
        P(x0, y0, z1),
        row,
        pat,
        [
          [0, 0],
          [1, 0],
          [1, 1],
          [0, 1],
        ],
        o,
      );
    };
    const iron = R.iron || R.dark || R.wood,
      glass = R.glass || R.glow,
      glow = { row2: R.glow };
    // a lantern: a dark frame, glass all round, a little pointed roof and a ring
    const lantern = (cx, cy, cz, k = 1) => {
      const w = 0.1 * k,
        h = 0.15 * k;
      box(
        cx - w - 0.02,
        cy - h - 0.035,
        cz - w - 0.02,
        cx + w + 0.02,
        cy - h,
        cz + w + 0.02,
        iron,
        PAT.NONE,
      );
      box(
        cx - w,
        cy - h,
        cz - w,
        cx + w,
        cy + h,
        cz + w,
        glass,
        PAT.LAMP,
        glow,
      );
      for (const [sx, sz] of [
        [-1, -1],
        [1, -1],
        [-1, 1],
        [1, 1],
      ])
        box(
          cx + sx * w - 0.012,
          cy - h,
          cz + sz * w - 0.012,
          cx + sx * w + 0.012,
          cy + h,
          cz + sz * w + 0.012,
          iron,
          PAT.NONE,
        );
      const t = cy + h,
        a = w + 0.035,
        ap = P(cx, t + 0.11 * k, cz);
      mb.tri(P(cx - a, t, cz + a), P(cx + a, t, cz + a), ap, iron, PAT.NONE);
      mb.tri(P(cx + a, t, cz + a), P(cx + a, t, cz - a), ap, iron, PAT.NONE);
      mb.tri(P(cx + a, t, cz - a), P(cx - a, t, cz - a), ap, iron, PAT.NONE);
      mb.tri(P(cx - a, t, cz - a), P(cx - a, t, cz + a), ap, iron, PAT.NONE);
    };
    // flames that burn only at night, on a torch head or a brazier
    const flames = (cx, cy, cz, r, h, n = 3) => {
      for (let k = 0; k < n; k++) {
        const a = k * 2.1 + 0.4,
          rr = k ? r * 0.45 : 0,
          q = P(cx + Math.cos(a) * rr, cy, cz + Math.sin(a) * rr);
        mb.cone(
          q,
          q[1] + h * (k ? 0.65 : 1),
          r * (k ? 0.7 : 1),
          5,
          R.flame || R.glow,
          PAT.NIGHTFLAME,
          null,
          0,
          0,
          a,
        );
      }
    };
    switch (kind) {
      case "post": {
        // a lantern hung from the arm of a post, out over the way
        mb.prism(P(0, -0.3, 0), P(0, 2.8, 0), 0.075, 0.06, 4, R.wood, PAT.BARK);
        mb.prism(
          P(0, 2.66, -0.05),
          P(0, 2.66, 0.52),
          0.035,
          0.03,
          4,
          iron,
          PAT.NONE,
        );
        mb.prism(
          P(0, 2.66, 0.47),
          P(0, 2.5, 0.47),
          0.012,
          0.012,
          3,
          iron,
          PAT.NONE,
        );
        lantern(0, 2.3, 0.47);
        return P(0, 2.25, 0.47);
      }
      case "wall": {
        // a lantern on an iron bracket beside a door
        mb.prism(P(0, 2.5, 0), P(0, 2.5, 0.44), 0.03, 0.025, 4, iron, PAT.NONE);
        mb.prism(P(0, 2.35, 0), P(0, 2.5, 0.2), 0.02, 0.02, 3, iron, PAT.NONE);
        mb.prism(
          P(0, 2.5, 0.4),
          P(0, 2.38, 0.4),
          0.01,
          0.01,
          3,
          iron,
          PAT.NONE,
        );
        lantern(0, 2.2, 0.4, 0.9);
        return P(0, 2.15, 0.45);
      }
      case "torch": {
        // a torch in an iron ring on the wall, leaning out
        mb.prism(
          P(0, 1.95, 0),
          P(0, 1.95, 0.2),
          0.025,
          0.02,
          4,
          iron,
          PAT.NONE,
        );
        mb.prism(
          P(0, 1.7, 0.12),
          P(0, 2.36, 0.3),
          0.032,
          0.042,
          4,
          R.wood,
          PAT.BARK,
        );
        mb.prism(
          P(0, 2.28, 0.28),
          P(0, 2.4, 0.31),
          0.058,
          0.052,
          5,
          R.char || iron,
          PAT.NONE,
          null,
          0,
          true,
        );
        flames(0, 2.4, 0.31, 0.1, 0.3);
        return P(0, 2.5, 0.42);
      }
      case "stake": {
        // a torch on a pole stood in the ground
        mb.prism(
          P(0, -0.25, 0),
          P(0, 1.85, 0),
          0.04,
          0.035,
          4,
          R.wood,
          PAT.BARK,
        );
        mb.prism(
          P(0, 1.78, 0),
          P(0, 1.92, 0),
          0.062,
          0.056,
          5,
          R.char || iron,
          PAT.NONE,
          null,
          0,
          true,
        );
        flames(0, 1.92, 0, 0.11, 0.32);
        return P(0, 2.05, 0);
      }
      case "brazier": {
        // an iron bowl on three legs, full of coals; flames at night
        for (let k = 0; k < 3; k++) {
          const a = (k / 3) * Math.PI * 2 + 0.5;
          mb.prism(
            P(Math.cos(a) * 0.34, -0.05, Math.sin(a) * 0.34),
            P(Math.cos(a) * 0.22, 0.86, Math.sin(a) * 0.22),
            0.03,
            0.025,
            4,
            iron,
            PAT.NONE,
          );
        }
        mb.prism(
          P(0, 0.82, 0),
          P(0, 1.1, 0),
          0.22,
          0.36,
          8,
          iron,
          PAT.NONE,
          null,
          0,
          false,
        );
        mb.prism(
          P(0, 1.04, 0),
          P(0, 1.08, 0),
          0.33,
          0.33,
          8,
          glass,
          PAT.LAMP,
          glow,
          0,
          true,
        );
        flames(0, 1.08, 0, 0.15, 0.45, 4);
        return P(0, 1.45, 0);
      }
      case "hang": {
        // an oil lamp on a chain from the ceiling (the frame's origin is on the ceiling)
        mb.prism(P(0, 0, 0), P(0, -0.42, 0), 0.012, 0.012, 3, iron, PAT.NONE);
        lantern(0, -0.6, 0, 0.85);
        return P(0, -0.66, 0);
      }
      case "candle": {
        // a candle on a table (origin on the table top)
        box(
          -0.03,
          0,
          -0.03,
          0.03,
          0.13,
          0.03,
          R.rag || R.glass || iron,
          PAT.NONE,
        );
        box(-0.012, 0.13, -0.012, 0.012, 0.18, 0.012, glass, PAT.LAMP, glow);
        return P(0, 0.22, 0);
      }
    }
    return P(0, 2, 0);
  }

  // ---------- places of work ----------
  // A market stall: a counter with goods on it, four poles and a cloth awning. T maps the stall's
  // own metres (x along it, y up, z out of its front, towards the buyer) to the caller's.
