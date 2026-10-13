// index-inline-2 66 — door
// Lines 25178-26101 of readable/index-inline-2.pretty.js (statement-aligned).
  function interiorInto(
    mb,
    Q,
    box,
    R,
    st,
    b,
    y,
    hh,
    x0,
    x1,
    z0,
    z1,
    door,
    out,
    wallBox,
    furnBox,
    toC,
    T,
  ) {
    const dim = { lv: -0.65 },
      fy = y + 0.16,
      rnd = mulberry32(hashInt(Math.round(b.x * 10), Math.round(b.z * 10), 57));
    const topAt = (cx, cz, hx, hz, top) => {
      const [X, Z] = toC(cx, cz);
      out.tops.push({
        x: X,
        z: Z,
        hx,
        hz,
        cs: Math.cos(b.rot),
        sn: Math.sin(b.rot),
        y: fy + top,
      });
    };
    const furnAt = (cx, cz, hx, hz, top, surf = true) => {
      furnBox(cx, cz, hx, hz, fy + top);
      if (surf && top > 0.05) topAt(cx, cz, hx, hz, top);
    };
    const wood = R.wood,
      dark = R.dark || R.wood,
      cloth = R.cloth || R.wood,
      straw = R.straw || R.roof,
      pot = R.pot || R.base,
      flame = R.flame || R.glow;
    const i = 0.06; // how far the lining stands in from the outer wall
    // the lining: back, left, right, and the front around the doorway
    const lq = (a, bb, c, dd, uvs) =>
      Q(a, bb, c, dd, R.wall, st.wallPat, uvs, dim);
    lq(
      [x0 + i, y, z0 + i],
      [x1 - i, y, z0 + i],
      [x1 - i, y + hh, z0 + i],
      [x0 + i, y + hh, z0 + i],
      [
        [x0, y],
        [x1, y],
        [x1, y + hh],
        [x0, y + hh],
      ],
    );
    lq(
      [x0 + i, y, z1 - i],
      [x0 + i, y, z0 + i],
      [x0 + i, y + hh, z0 + i],
      [x0 + i, y + hh, z1 - i],
      [
        [z1, y],
        [z0, y],
        [z0, y + hh],
        [z1, y + hh],
      ],
    );
    lq(
      [x1 - i, y, z0 + i],
      [x1 - i, y, z1 - i],
      [x1 - i, y + hh, z1 - i],
      [x1 - i, y + hh, z0 + i],
      [
        [z0, y],
        [z1, y],
        [z1, y + hh],
        [z0, y + hh],
      ],
    );
    lq(
      [door.d0, y, z1 - i],
      [x0 + i, y, z1 - i],
      [x0 + i, y + hh, z1 - i],
      [door.d0, y + hh, z1 - i],
      [
        [door.d0, y],
        [x0, y],
        [x0, y + hh],
        [door.d0, y + hh],
      ],
    );
    lq(
      [x1 - i, y, z1 - i],
      [door.d1, y, z1 - i],
      [door.d1, y + hh, z1 - i],
      [x1 - i, y + hh, z1 - i],
      [
        [x1, y],
        [door.d1, y],
        [door.d1, y + hh],
        [x1, y + hh],
      ],
    );
    lq(
      [door.d1, y + door.h, z1 - i],
      [door.d0, y + door.h, z1 - i],
      [door.d0, y + hh, z1 - i],
      [door.d1, y + hh, z1 - i],
      null,
    );
    // the doorway has depth: jambs and a lintel, and the door stands open against the wall
    Q(
      [door.d0, y, z1],
      [door.d0, y, z1 - i],
      [door.d0, y + door.h, z1 - i],
      [door.d0, y + door.h, z1],
      wood,
      PAT.PLANK,
      null,
      { lv: -0.4 },
    );
    Q(
      [door.d1, y, z1 - i],
      [door.d1, y, z1],
      [door.d1, y + door.h, z1],
      [door.d1, y + door.h, z1 - i],
      wood,
      PAT.PLANK,
      null,
      { lv: -0.4 },
    );
    Q(
      [door.d0, y + door.h, z1 - i],
      [door.d1, y + door.h, z1 - i],
      [door.d1, y + door.h, z1],
      [door.d0, y + door.h, z1],
      wood,
      PAT.PLANK,
      null,
      { lv: -0.6 },
    );
    const hx = door.d0,
      hz = z1 - i - 0.04,
      open = 1.35;
    Q(
      [hx, y + 0.02, hz],
      [hx + Math.cos(open) * 1.15, y + 0.02, hz - Math.sin(open) * 1.15],
      [hx + Math.cos(open) * 1.15, y + 2.05, hz - Math.sin(open) * 1.15],
      [hx, y + 2.05, hz],
      wood,
      PAT.DOOR,
      [
        [0, 0],
        [1.1, 0],
        [1.1, 2],
        [0, 2],
      ],
      { row2: dark },
    );
    // floor and ceiling
    Q(
      [x0 + i, fy, z1 - i],
      [x1 - i, fy, z1 - i],
      [x1 - i, fy, z0 + i],
      [x0 + i, fy, z0 + i],
      wood,
      PAT.PLANK,
      [
        [x0, z1],
        [x1, z1],
        [x1, z0],
        [x0, z0],
      ],
      { lv: -0.45 },
    );
    const cy = y + hh - 0.03;
    Q(
      [x0 + i, cy, z0 + i],
      [x1 - i, cy, z0 + i],
      [x1 - i, cy, z1 - i],
      [x0 + i, cy, z1 - i],
      dark,
      PAT.PLANK,
      [
        [x0, z0],
        [x1, z0],
        [x1, z1],
        [x0, z1],
      ],
      { lv: -1.2 },
    );
    for (let k = 1; k <= 3; k++) {
      const bz = z0 + ((z1 - z0) * k) / 4;
      mb.prism(
        T([x0 + i, cy - 0.12, bz]),
        T([x1 - i, cy - 0.12, bz]),
        0.1,
        0.1,
        4,
        dark,
        PAT.BARK,
        { lv: -0.8 },
      );
    }
    // the walls you bump into, with a gap at the door
    const t = 0.12;
    wallBox(0, z0, (x1 - x0) / 2 + t, t);
    wallBox(x0, 0, t, (z1 - z0) / 2 + t);
    wallBox(x1, 0, t, (z1 - z0) / 2 + t);
    wallBox((x0 + door.d0) / 2, z1, (door.d0 - x0) / 2 + t, t);
    wallBox((door.d1 + x1) / 2, z1, (x1 - door.d1) / 2 + t, t);
    out.room = {
      x: b.x,
      z: b.z,
      hx: (x1 - x0) / 2 - 0.1,
      hz: (z1 - z0) / 2 - 0.1,
      cs: Math.cos(b.rot),
      sn: Math.sin(b.rot),
      y0: fy,
      y1: y + hh,
      dx: door.x,
      dh: door.h,
    };
    // where you stand to walk in, and which way is in (the caller's metres, x east, z south)
    {
      const [ex, ez] = toC(door.x, z1 + 1.6);
      out.entry = {
        x: ex,
        z: ez,
        ix: Math.sin(b.rot),
        iz: -Math.cos(b.rot),
        y: fy,
        kind: b.kind || "house",
      };
    }
    // the floor you stand on. Inside the walls it holds you up however you came to be there (walked in,
    // woke up, or the house was built round you); in the doorway, out to the foundation's edge, it is
    // a step up like any other
    furnBox(0, 0, (x1 - x0) / 2 - 0.1, (z1 - z0) / 2 - 0.1, fy, {
      lift: true,
      walk: true,
    });
    furnBox(door.x, z1 - 0.075, (door.d1 - door.d0) / 2, 0.225, fy, {
      walk: true,
    });
    // ---- furniture ----
    const fbox = (ax, az, bx, bz, h0, h1, row, pat, o = dim) =>
      box(
        ax,
        fy + h0,
        az,
        bx,
        fy + h1,
        bz,
        row,
        pat,
        ["front", "back", "left", "right", "top"],
        o,
      );
    // a way the house's own x/z points, as a bearing in the caller's frame (clockwise from north)
    const rcs = Math.cos(b.rot),
      rsn = Math.sin(b.rot);
    const bear = (lx, lz) =>
      Math.atan2(lx * rcs - lz * rsn, -(lx * rsn + lz * rcs));
    const spotAt = (name, cx, cz, flx, flz) => {
      const [X, Z] = toC(cx, cz);
      out.spots[name] = { x: X, z: Z, y: fy, face: bear(flx, flz) };
    };
    const seat = (cx, cz, flx, flz) => {
      const [X, Z] = toC(cx, cz);
      out.seats.push({ x: X, z: Z, y: fy + 0.45, face: bear(flx, flz) });
    };
    const bed = (cx, cz, alongZ) => {
      const hwx = alongZ ? 0.48 : 1.0,
        hwz = alongZ ? 1.0 : 0.48;
      fbox(cx - hwx, cz - hwz, cx + hwx, cz + hwz, 0, 0.32, wood, PAT.PLANK);
      fbox(
        cx - hwx + 0.05,
        cz - hwz + 0.05,
        cx + hwx - 0.05,
        cz + hwz - 0.05,
        0.32,
        0.46,
        straw,
        PAT.THATCH,
      );
      // a blanket over most of it, a pillow at the head
      if (alongZ) {
        fbox(
          cx - hwx + 0.02,
          cz - hwz * 0.2,
          cx + hwx - 0.02,
          cz + hwz - 0.02,
          0.33,
          0.5,
          cloth,
          PAT.CLOTH,
        );
        fbox(
          cx - 0.3,
          cz - hwz + 0.08,
          cx + 0.3,
          cz - hwz + 0.42,
          0.46,
          0.56,
          R.rag || straw,
          PAT.NONE,
        );
      } else {
        fbox(
          cx - hwx * 0.2,
          cz - hwz + 0.02,
          cx + hwx - 0.02,
          cz + hwz - 0.02,
          0.33,
          0.5,
          cloth,
          PAT.CLOTH,
        );
        fbox(
          cx - hwx + 0.08,
          cz - 0.3,
          cx - hwx + 0.42,
          cz + 0.3,
          0.46,
          0.56,
          R.rag || straw,
          PAT.NONE,
        );
      }
      furnAt(cx, cz, hwx, hwz, 0.5);
      const [X, Z] = toC(cx, cz);
      // which way the pillow is, and how long the bed is
      out.beds.push({
        x: X,
        z: Z,
        y: fy + 0.5,
        head: alongZ ? bear(0, -1) : bear(-1, 0),
        len: 2.0,
      });
    };
    const table = (cx, cz, lx, lz) => {
      fbox(cx - lx, cz - lz, cx + lx, cz + lz, 0.7, 0.78, wood, PAT.PLANK, {
        lv: -0.6,
      });
      for (const [sx, sz] of [
        [-1, -1],
        [1, -1],
        [-1, 1],
        [1, 1],
      ])
        mb.prism(
          T([cx + sx * (lx - 0.08), fy, cz + sz * (lz - 0.08)]),
          T([cx + sx * (lx - 0.08), fy + 0.7, cz + sz * (lz - 0.08)]),
          0.04,
          0.04,
          4,
          dark,
          PAT.NONE,
          dim,
        );
      furnAt(cx, cz, lx, lz, 0.78);
    };
    const stool = (cx, cz, flx = 0, flz = 0) => {
      fbox(
        cx - 0.18,
        cz - 0.18,
        cx + 0.18,
        cz + 0.18,
        0,
        0.45,
        wood,
        PAT.PLANK,
      );
      if (flx || flz) seat(cx, cz, flx, flz);
    };
    // a bench; people sit along it facing flz (+1 or -1 along the house's z), two to a bench
    const bench = (cx, cz, lx, flz = 0) => {
      fbox(cx - lx, cz - 0.16, cx + lx, cz + 0.16, 0.38, 0.45, wood, PAT.PLANK);
      fbox(
        cx - lx + 0.05,
        cz - 0.1,
        cx - lx + 0.15,
        cz + 0.1,
        0,
        0.38,
        dark,
        PAT.NONE,
      );
      fbox(
        cx + lx - 0.15,
        cz - 0.1,
        cx + lx - 0.05,
        cz + 0.1,
        0,
        0.38,
        dark,
        PAT.NONE,
      );
      if (flz) for (const u of [-0.5, 0.5]) seat(cx + u * lx, cz, 0, flz);
    };
    const chest = (cx, cz) => {
      fbox(cx - 0.45, cz - 0.27, cx + 0.45, cz + 0.27, 0, 0.5, wood, PAT.PLANK);
      fbox(
        cx - 0.47,
        cz - 0.05,
        cx + 0.47,
        cz + 0.05,
        0.02,
        0.52,
        R.iron || dark,
        PAT.NONE,
      );
      furnAt(cx, cz, 0.45, 0.27, 0.5);
    };
    const barrel = (cx, cz) => {
      mb.prism(
        T([cx, fy, cz]),
        T([cx, fy + 0.85, cz]),
        0.3,
        0.3,
        8,
        wood,
        PAT.PLANK,
        dim,
        0,
        true,
      );
      mb.prism(
        T([cx, fy + 0.2, cz]),
        T([cx, fy + 0.26, cz]),
        0.31,
        0.31,
        8,
        dark,
        PAT.NONE,
        dim,
      );
      furnAt(cx, cz, 0.3, 0.3, 0.85);
    };
    // (bare: nothing on it yet, and both boards are somewhere to set things)
    const shelf = (cx, cz, alongX, bare = false) => {
      const lx = alongX ? 0.8 : 0.18,
        lz = alongX ? 0.18 : 0.8;
      for (const hh2 of [1.0, 1.55])
        fbox(
          cx - lx,
          cz - lz,
          cx + lx,
          cz + lz,
          hh2,
          hh2 + 0.05,
          wood,
          PAT.PLANK,
        );
      // the uprights at its ends
      for (const e of [-1, 1]) {
        const px = alongX ? cx + e * (lx - 0.03) : cx,
          pz = alongX ? cz : cz + e * (lz - 0.03);
        fbox(
          px - 0.03,
          pz - 0.03,
          px + 0.03,
          pz + 0.03,
          0,
          1.6,
          dark,
          PAT.NONE,
        );
      }
      if (bare) {
        topAt(cx, cz, lx - 0.04, lz - 0.02, 1.05);
        topAt(cx, cz, lx - 0.04, lz - 0.02, 1.6);
        return;
      }
      for (let k = 0; k < 4; k++) {
        const u = -0.6 + k * 0.4,
          px = alongX ? cx + u : cx,
          pz = alongX ? cz : cz + u,
          ph = 0.14 + (k % 2) * 0.08;
        mb.prism(
          T([px, fy + 1.05, pz]),
          T([px, fy + 1.05 + ph, pz]),
          0.08,
          0.06,
          6,
          pot,
          PAT.NONE,
          dim,
          0,
          true,
        );
        mb.prism(
          T([px + (alongX ? 0.2 : 0), fy + 1.6, pz + (alongX ? 0 : 0.2)]),
          T([
            px + (alongX ? 0.2 : 0),
            fy + 1.6 + ph * 0.8,
            pz + (alongX ? 0 : 0.2),
          ]),
          0.07,
          0.07,
          6,
          straw,
          PAT.NONE,
          dim,
          0,
          true,
        );
      }
    };
    const rug = (cx, cz, lx, lz) =>
      Q(
        [cx - lx, fy + 0.01, cz + lz],
        [cx + lx, fy + 0.01, cz + lz],
        [cx + lx, fy + 0.01, cz - lz],
        [cx - lx, fy + 0.01, cz - lz],
        cloth,
        PAT.CLOTH,
        [
          [0, 0],
          [lx * 2, 0],
          [lx * 2, lz * 2],
          [0, lz * 2],
        ],
        { lv: -0.5 },
      );
    const hay = (cx, cz, lx, lz, h) => {
      fbox(cx - lx, cz - lz, cx + lx, cz + lz, 0, h, straw, PAT.THATCH, {
        lv: -0.5,
      });
      furnAt(cx, cz, lx, lz, h);
    };
    // the hearth sits under the chimney, its mouth towards the door
    const hearth = (cx, cz) => {
      fbox(
        cx - 0.65,
        cz - 0.55,
        cx + 0.65,
        cz + 0.45,
        0,
        1.15,
        R.base,
        PAT.STONE,
        { lv: -0.6 },
      );
      box(
        cx - 0.35,
        fy + 1.15,
        cz - 0.35,
        cx + 0.35,
        cy,
        cz + 0.35,
        R.base,
        PAT.BRICK,
        ["front", "back", "left", "right"],
        { lv: -0.8 },
      );
      Q(
        [cx - 0.4, fy + 0.05, cz + 0.46],
        [cx + 0.4, fy + 0.05, cz + 0.46],
        [cx + 0.4, fy + 0.72, cz + 0.46],
        [cx - 0.4, fy + 0.72, cz + 0.46],
        R.char || dark,
        PAT.NONE,
        null,
        { lv: -2 },
      );
      // a hearthstone in front of the mouth, and the fire on it
      fbox(
        cx - 0.55,
        cz + 0.45,
        cx + 0.55,
        cz + 0.85,
        0,
        0.06,
        R.base,
        PAT.STONE,
        { lv: -0.5 },
      );
      for (let k = 0; k < 3; k++) {
        const a = k * 2.1;
        mb.cone(
          T([
            cx + Math.cos(a) * 0.12,
            fy + 0.07,
            cz + 0.62 + Math.sin(a) * 0.08,
          ]),
          fy + 0.4 + (k ? 0.1 : 0.24),
          0.13,
          5,
          flame,
          23,
          null,
          0,
          0,
          a,
        );
      }
      furnAt(cx, cz - 0.05, 0.65, 0.5, 1.15, false);
      const [X, Z] = toC(cx, cz + 0.6);
      out.hearth = { x: X, z: Z, y: fy + 0.4 };
      // somewhere to stand and warm your hands
      spotAt("hearth", cx + 0.35, cz + 1.45, -0.2, -1);
    };
    // a lamp of the room: only lights it while you are inside
    const lampAt = (lk, cx, yy, cz) => {
      const q = lampInto(
        mb,
        lk,
        (p) => T([cx + p[0], yy + p[1], cz + p[2]]),
        R,
      );
      out.lights.push({ x: q[0], y: q[1], z: q[2], kind: lk, room: true });
    };
    const W = x1 - x0,
      D = z1 - z0,
      kind = b.kind || "house";
    const chimX = W * 0.25;
    const clearOfDoor = (cx, cz, r) =>
      Math.abs(cx - door.x) > 0.9 + r || cz < z1 - 1.6 - r;
    if (kind === "barn" || kind === "shed") {
      const n = kind === "barn" ? 3 : 1;
      for (let k = 0; k < n; k++)
        hay(x0 + 0.9 + k * 1.5, z0 + 0.8, 0.65, 0.55, 0.8 + (k % 2) * 0.5);
      if (kind === "barn") {
        hay(x1 - 1.2, z0 + 0.9, 0.8, 0.7, 1.4);
        barrel(x1 - 0.5, z1 - 1.0 > door.d1 + 0.6 ? z1 - 0.8 : 0);
      } else {
        barrel(x1 - 0.5, z0 + 0.5);
      }
      for (let k = 0; k < 3; k++) {
        const px = x0 + 1 + k * 0.5;
        mb.prism(
          T([px, fy + 0.1, z0 + i + 0.05]),
          T([px + 0.1, fy + 1.6, z0 + i + 0.08]),
          0.025,
          0.02,
          4,
          dark,
          PAT.NONE,
          dim,
        );
      }
      return;
    }
    if (kind === "inn" || kind === "tavern") {
      // a counter across the back with the keeper behind it and barrels behind them, tables and
      // benches; an inn has beds in the corner, a tavern more tables instead
      const cL = Math.min(3.6, W * 0.35),
        cX = x0 + 0.8 + cL / 2,
        inn = kind === "inn";
      fbox(
        cX - cL / 2,
        z0 + 1.3,
        cX + cL / 2,
        z0 + 1.85,
        0,
        1.05,
        wood,
        PAT.PLANK,
        { lv: -0.5 },
      );
      furnAt(cX, z0 + 1.57, cL / 2, 0.28, 1.05);
      for (let k = 0; k < 3; k++) barrel(x0 + 0.7 + k * 0.75, z0 + 0.45);
      spotAt("keeper", cX + 0.3, z0 + 1.0, 0, 1);
      if (b.chimney) hearth(chimX, 0);
      const right = inn ? x1 - 2.2 : x1 - 0.4;
      const tables = [
        [x0 + 2.2, z1 - 2.2],
        [x0 + 2.2 + 3.2, z1 - 2.2],
      ];
      if (!inn && D > 7)
        tables.push([x0 + 2.2 + 3.2, z0 + 3.6 < z1 - 4 ? z0 + 3.6 : z1 - 4.2]);
      for (const [tx, tz] of tables)
        if (
          clearOfDoor(tx, tz, 1.2) &&
          tx + 1.2 < right &&
          (inn ||
            !b.chimney ||
            Math.abs(tx - chimX) > 1.9 ||
            Math.abs(tz) > 1.6)
        ) {
          table(tx, tz, 0.9, 0.45);
          bench(tx, tz - 0.8, 0.8, 1);
          bench(tx, tz + 0.8, 0.8, -1);
        }
      if (inn) {
        bed(x1 - 0.6, z0 + 1.1, true);
        bed(x1 - 0.6, z0 + 3.4, true);
      } else {
        for (let k = 0; k < 2; k++) barrel(x1 - 0.5, z0 + 0.6 + k * 0.7);
      }
      rug((x0 + x1) / 2, (z0 + z1) / 2 + 0.6, 1.2, 0.7);
      lampAt("hang", x0 + 3.8, cy, z1 - 2.2);
      lampAt("hang", cX, cy, z0 + 1.9);
      return;
    }
    if (kind === "temple") {
      // the altar at the back, candles on it; benches in rows facing it either side of the way up the middle;
      // hangings on the walls, lamps hung from the beams. The priest stands behind the altar.
      fbox(-1.2, z0 + 1.55, 1.2, z0 + 2.35, 0, 1.02, R.base, PAT.STONE, {
        lv: -0.45,
      });
      fbox(
        -1.3,
        z0 + 1.45,
        1.3,
        z0 + 2.45,
        1.02,
        1.1,
        R.cloth || R.wood,
        PAT.CLOTH,
        { lv: -0.4 },
      );
      furnAt(0, z0 + 1.95, 1.3, 0.5, 1.1);
      lampAt("candle", -0.85, fy + 1.1, z0 + 1.95);
      lampAt("candle", 0.85, fy + 1.1, z0 + 1.95);
      spotAt("altar", 0.0, z0 + 0.95, 0, 1);
      for (let r = 0; r < 6; r++) {
        const bz = z0 + 3.6 + r * 1.35;
        if (bz < z1 - 2.2) {
          bench(x0 + W * 0.27, bz, W * 0.18, -1);
          bench(x1 - W * 0.27, bz, W * 0.18, -1);
        }
      }
      for (const bx of [x0 + i + 0.01, x1 - i - 0.01])
        for (const hz of [z0 + 3.2, z0 + 7.5])
          if (hz < z1 - 2)
            Q(
              [bx, fy + 1.0, hz],
              [bx, fy + 1.0, hz + 1.0],
              [bx, fy + 3.2, hz + 1.0],
              [bx, fy + 3.2, hz],
              R.banner || cloth,
              PAT.CLOTH,
              null,
              { lv: -0.4 },
            );
      rug(0, (z0 + z1) / 2 + 1.2, 0.55, Math.min(D * 0.36, 6));
      lampAt("hang", 0, cy, z0 + 3.4);
      lampAt("hang", 0, cy, (z0 + z1) / 2 + 2);
      return;
    }
    if (kind === "civic") {
      // a long table at the back, benches in rows
      // (the great city's palace: the table further out, and a high seat on a dais behind it)
      if (b.palace) {
        fbox(-1.6, z0 + i, 1.6, z0 + 1.7, 0, 0.24, R.base, PAT.STONE, {
          lv: -0.5,
        });
        furnAt(0, z0 + 0.85, 1.6, 0.8, 0.24, false);
        fbox(-0.42, z0 + 0.6, 0.42, z0 + 1.1, 0.24, 0.72, dark, PAT.PLANK);
        fbox(-0.42, z0 + 0.42, 0.42, z0 + 0.6, 0.24, 2.2, dark, PAT.PLANK);
        fbox(
          -0.36,
          z0 + 0.6,
          0.36,
          z0 + 1.08,
          0.72,
          0.78,
          R.banner || cloth,
          PAT.CLOTH,
        );
        Q(
          [-0.8, fy + 1.4, z0 + i + 0.01],
          [0.8, fy + 1.4, z0 + i + 0.01],
          [0.8, fy + 3.4, z0 + i + 0.01],
          [-0.8, fy + 3.4, z0 + i + 0.01],
          R.banner || cloth,
          PAT.CLOTH,
          null,
          { lv: -0.4 },
        );
        table(0, z0 + 2.7, Math.min(2.4, W * 0.25), 0.5);
        spotAt("hall", 0.6, z0 + 3.6, 0, -1);
        for (let r = 0; r < 3; r++) {
          const bz = z0 + 4.4 + r * 1.3;
          if (bz < z1 - 1.2) {
            bench(x0 + W * 0.28, bz, W * 0.18, -1);
            bench(x1 - W * 0.28, bz, W * 0.18, -1);
          }
        }
        for (const bx of [x0 + i + 0.01, x1 - i - 0.01])
          Q(
            [bx, fy + 1.1, z0 + 2.5],
            [bx, fy + 1.1, z0 + 3.3],
            [bx, fy + 2.6, z0 + 3.3],
            [bx, fy + 2.6, z0 + 2.5],
            R.banner || cloth,
            PAT.CLOTH,
            null,
            { lv: -0.4 },
          );
        lampAt("hang", 0, cy, z0 + 2.4);
        lampAt("hang", 0, cy, z1 - 2.2);
        return;
      }
      table(0, z0 + 1.2, Math.min(2.2, W * 0.25), 0.5);
      spotAt("hall", 0.6, z0 + 2.0, 0, -1);
      for (let r = 0; r < 3; r++) {
        const bz = z0 + 2.8 + r * 1.3;
        if (bz < z1 - 1.2) {
          bench(x0 + W * 0.28, bz, W * 0.18, -1);
          bench(x1 - W * 0.28, bz, W * 0.18, -1);
        }
      }
      for (const bx of [x0 + i + 0.01, x1 - i - 0.01]) {
        const s2 = bx < 0 ? 1 : -1;
        Q(
          [bx, fy + 1.1, z0 + 1.5],
          [bx, fy + 1.1, z0 + 2.3],
          [bx, fy + 2.6, z0 + 2.3],
          [bx, fy + 2.6, z0 + 1.5],
          R.banner || cloth,
          PAT.CLOTH,
          null,
          { lv: -0.4 },
        );
        void s2;
      }
      lampAt("hang", 0, cy, z0 + 2.4);
      if (D > 6.5) lampAt("hang", 0, cy, z1 - 2.2);
      return;
    }
    if (kind === "home") {
      // a house of your own: the bed and a chest at the back, the hearth; a house has a table and a
      // shelf too, a hall a long table with benches. Room left over for whatever you bring home.
      const size = b.size || "hut";
      bed(x0 + 0.62, z0 + 1.15, true);
      const ccz = z0 + 2.55 < z1 - 1 ? z0 + 2.55 : z0 + 2.3;
      chest(x0 + 0.62, ccz);
      {
        const [X, Z] = toC(x0 + 0.62, ccz);
        out.chest = { x: X, z: Z, y: fy + 0.5 };
      }
      if (b.chimney) hearth(chimX, 0);
      if (size === "hut") {
        lampAt("candle", x0 + 0.62, fy + 0.5, ccz + 0.1);
        shelf(x1 - i - 0.2, z0 + 1.0, false, true);
      } else {
        const tx = door.x < 0 ? x1 - 1.3 : x0 + 1.9,
          tz = z1 - 1.4;
        if (clearOfDoor(tx, tz, 0.9)) {
          table(tx, tz, 0.6, 0.45);
          stool(tx - 0.85, tz, 1, 0);
          stool(tx + 0.85, tz, -1, 0);
          lampAt("candle", tx + 0.22, fy + 0.78, tz - 0.1);
        }
        shelf(x1 - i - 0.2, z0 + 1.3, false, true);
      }
      if (size === "hall") {
        // a long table down the middle of the back half, benches either side, the people's colours on the wall
        const lx = Math.min(1.8, W * 0.18),
          lz = z0 + 2.9;
        table(-0.6, lz, lx, 0.5);
        bench(-0.6, lz - 0.85, lx - 0.1, 1);
        bench(-0.6, lz + 0.85, lx - 0.1, -1);
        Q(
          [-0.9, fy + 1.2, z0 + i + 0.01],
          [0.3, fy + 1.2, z0 + i + 0.01],
          [0.3, fy + 2.5, z0 + i + 0.01],
          [-0.9, fy + 2.5, z0 + i + 0.01],
          R.banner || cloth,
          PAT.CLOTH,
          null,
          { lv: -0.4 },
        );
        shelf(x1 - i - 0.2, z0 + 3.3, false, true);
        lampAt("hang", -0.6, cy, lz);
      }
      rug(
        (x0 + x1) / 2,
        (z0 + z1) / 2,
        Math.min(1.1, W / 5),
        Math.min(0.8, D / 5),
      );
      // what the house-wright built in: an oven, a bench and an anvil, a loom, against the back wall or the front
      if (b.work && b.work.length) {
        const lay = workLayout(size, false, b.work);
        for (const k of b.work) {
          const sl = lay[k];
          if (sl)
            workAt(
              mb,
              k,
              sl.x,
              sl.wall < 0 ? z0 + i : z1 - i,
              0,
              sl.wall < 0 ? 1 : -1,
              { T, R, fy, ceil: cy - fy, toC, cs: rcs, sn: rsn, out, o: dim },
            );
        }
      }
      return;
    }
    // an ordinary house: a bed at the back, the hearth, a table by the window, a shelf, a chest
    bed(x0 + 0.62, z0 + 1.15, true);
    chest(x0 + 0.62, z0 + 2.55 < z1 - 1 ? z0 + 2.55 : z0 + 2.3);
    if (b.chimney) hearth(chimX, 0);
    const tx = door.x < 0 ? x1 - 1.3 : x0 + 1.9,
      tz = z1 - 1.4;
    if (clearOfDoor(tx, tz, 0.9)) {
      table(tx, tz, 0.6, 0.45);
      stool(tx - 0.85, tz, 1, 0);
      stool(tx + 0.85, tz, -1, 0);
      lampAt("candle", tx + 0.22, fy + 0.78, tz - 0.1);
    }
    shelf(x1 - i - 0.2, z0 + 1.3, false);
    if (rnd() < 0.7 && D > 5.2 && clearOfDoor(x1 - 0.5, z0 + 2.6, 0.3))
      barrel(x1 - 0.5, z0 + 2.6);
    rug(
      (x0 + x1) / 2,
      (z0 + z1) / 2,
      Math.min(1.1, W / 5),
      Math.min(0.8, D / 5),
    );
  }
  // inside a round house: a fire in the middle, bedding round the wall away from the door
