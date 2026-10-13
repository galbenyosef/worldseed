// index-inline-2 65 — math
// Lines 24121-25177 of readable/index-inline-2.pretty.js (statement-aligned).
  function houseInto(mb, b, st, rows) {
    const { x, z, w, d, rot } = b;
    const cs = Math.cos(rot),
      sn = Math.sin(rot);
    const T = (p) => [
      x + p[0] * cs - p[2] * sn,
      p[1],
      z + p[0] * sn + p[2] * cs,
    ];
    const Q = (a, bb, c, dd, row, pat, uvs, o) =>
      mb.quad(T(a), T(bb), T(c), T(dd), row, pat, uvs, o);
    const Tr = (a, bb, c, row, pat, uvs, o) =>
      mb.tri(T(a), T(bb), T(c), row, pat, uvs, o);
    const R = rows;
    let y = b.base;
    // an open house can be walked into: it tells the caller where its walls, furniture,
    // hearth, beds and room are (in the caller's metres), so they can be bumped into and used
    // (up on stilts too: a rope ladder goes up to the door; see siteview's doorSteps)
    const open = !!b.open && !b.tower;
    // tops: the flat places inside where a thing can be set down (tables, shelves, a chest's lid)
    const out = {
      open,
      walls: [],
      furn: [],
      hearth: null,
      beds: [],
      door: null,
      room: null,
      lights: [],
      seats: [],
      spots: {},
      tops: [],
    };
    // which windows light up at night: a household's go dark one by one as it goes to bed,
    // an inn's or a hall's stay lit, a barn's never are (the kind rides in the window's uv)
    const wtyp = b.light === "lit" ? 1 : b.light === "none" ? 2 : 0,
      wglow = wtyp === 0 && R.candle ? R.candle : R.glow;
    const winUv = (k, inner = false) => {
      const id = (inner ? 2 : wtyp) * 64 + (k % 64);
      return [
        [id, 0],
        [id + 1, 0],
        [id + 1, 1],
        [id, 1],
      ];
    };
    let winK = hashInt(Math.round(x * 10), Math.round(z * 10), 31) % 64;
    const toC = (lx, lz) => [x + lx * cs - lz * sn, z + lx * sn + lz * cs];
    const wallBox = (cx, cz, hx, hz) => {
      const [X, Z] = toC(cx, cz);
      out.walls.push({ x: X, z: Z, hx, hz, cs, sn });
    };
    const furnBox = (cx, cz, hx, hz, top, o = null) => {
      const [X, Z] = toC(cx, cz);
      out.furn.push({ x: X, z: Z, hx, hz, cs, sn, top, ...o });
    };
    // the sill: the foot of the doorway at the foundation's edge, which way is in, and how high the
    // threshold stands (so steps can be built up to it where the ground falls away). Local in-direction (ix, iz).
    // (on stilts, and whether its people build in wood: a ladder, and a ramp of planks rather than of stone)
    // A porch: a deck along the front, posts and a roof over it from the wall, a bench by the door. In the
    // house's own metres: (ox0, oz0) where it meets the wall, (ux, uz) out from it, (ax, az) along it;
    // W wide, PD deep, its deck at deckY, its roof from roofY0 at the wall down to the posts.
    const porchInto = (ox0, oz0, ux, uz, ax, az, W, PD, deckY, roofY0) => {
      const L = (a, yy, o) => [
        ox0 + ax * a + ux * o,
        yy,
        oz0 + az * a + uz * o,
      ];
      const quad = (a, b2, c, d2, row, pat, o) =>
        Q(
          a,
          b2,
          c,
          d2,
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
      const slab = (a0, a1, o0, o1, y0, y1, row, pat) => {
        quad(
          L(a0, y1, o1),
          L(a1, y1, o1),
          L(a1, y1, o0),
          L(a0, y1, o0),
          row,
          pat,
        );
        quad(
          L(a0, y0, o1),
          L(a1, y0, o1),
          L(a1, y1, o1),
          L(a0, y1, o1),
          row,
          pat,
        );
        quad(
          L(a1, y0, o1),
          L(a1, y0, o0),
          L(a1, y1, o0),
          L(a1, y1, o1),
          row,
          pat,
        );
        quad(
          L(a0, y0, o0),
          L(a0, y0, o1),
          L(a0, y1, o1),
          L(a0, y1, o0),
          row,
          pat,
        );
      };
      const yLow = y - fh;
      // the deck, on a skirt of boards down to the ground
      slab(-W / 2, W / 2, 0, PD, deckY - 0.16, deckY, R.wood, PAT.PLANK);
      slab(
        -W / 2 + 0.04,
        W / 2 - 0.04,
        0.02,
        PD - 0.04,
        yLow,
        deckY - 0.16,
        R.wood,
        PAT.PLANK,
      );
      const [cx, cz] = toC(ox0 + (ux * PD) / 2, oz0 + (uz * PD) / 2),
        ang = Math.atan2(az, ax);
      out.furn.push({
        x: cx,
        z: cz,
        hx: W / 2,
        hz: PD / 2,
        cs: Math.cos(ang) * cs - Math.sin(ang) * sn,
        sn: Math.cos(ang) * sn + Math.sin(ang) * cs,
        top: deckY,
        walk: true,
      });
      // posts along its front, the roof on them
      const postTop = deckY + 2.3,
        nP = W > 6 ? 4 : W > 3.5 ? 3 : 2;
      for (let k = 0; k < nP; k++) {
        const a = -W / 2 + 0.12 + (k * (W - 0.24)) / (nP - 1),
          o = PD - 0.12;
        mb.prism(
          T(L(a, deckY, o)),
          T(L(a, postTop, o)),
          0.07,
          0.065,
          4,
          R.wood,
          PAT.BARK,
        );
        const [px, pz] = toC(ox0 + ax * a + ux * o, oz0 + az * a + uz * o);
        out.walls.push({ x: px, z: pz, hx: 0.1, hz: 0.1, cs, sn });
      }
      mb.prism(
        T(L(-W / 2, postTop, PD - 0.12)),
        T(L(W / 2, postTop, PD - 0.12)),
        0.07,
        0.07,
        4,
        R.wood,
        PAT.BARK,
      );
      const r0 = L(-W / 2 - 0.2, roofY0, 0.02),
        r1 = L(W / 2 + 0.2, roofY0, 0.02),
        r2 = L(W / 2 + 0.2, postTop - 0.06, PD + 0.3),
        r3 = L(-W / 2 - 0.2, postTop - 0.06, PD + 0.3);
      quad(r3, r2, r1, r0, R.roof, st.roofPat);
      quad(r0, r1, r2, r3, R.wood, PAT.PLANK, { lv: -0.6 });
      // a bench against the wall, to one side of the door
      const bA = W / 2 - 1.05,
        bO = 0.36;
      slab(
        bA - 0.7,
        bA + 0.7,
        bO - 0.2,
        bO + 0.2,
        deckY + 0.4,
        deckY + 0.47,
        R.wood,
        PAT.PLANK,
      );
      for (const a of [bA - 0.6, bA + 0.6])
        slab(
          a - 0.05,
          a + 0.05,
          bO - 0.15,
          bO + 0.15,
          deckY,
          deckY + 0.4,
          R.dark || R.wood,
          PAT.NONE,
        );
    };
    // boarded up (a house in the great city that nobody lives in any more): planks nailed across, a little out from the wall
    const PK = R.weathered || R.wood;
    const plankF = (cx, yb, w, zz, s, tilt) => {
      const a = [cx - w / 2, yb - tilt, zz + s * 0.07],
        b2 = [cx + w / 2, yb + tilt, zz + s * 0.07],
        c = [cx + w / 2, yb + tilt + 0.17, zz + s * 0.07],
        d2 = [cx - w / 2, yb - tilt + 0.17, zz + s * 0.07];
      if (s > 0) Q(a, b2, c, d2, PK, PAT.NONE);
      else Q(b2, a, d2, c, PK, PAT.NONE);
    };
    const plankS = (xx, yb, w, cz, s, tilt) => {
      const a = [xx + s * 0.07, yb - tilt, cz + (w / 2) * s],
        b2 = [xx + s * 0.07, yb + tilt, cz - (w / 2) * s],
        c = [xx + s * 0.07, yb + tilt + 0.17, cz - (w / 2) * s],
        d2 = [xx + s * 0.07, yb - tilt + 0.17, cz + (w / 2) * s];
      Q(a, b2, c, d2, PK, PAT.NONE);
    };
    const sillAt = (lx, lz, ix, iz, yy) => {
      const [X, Z] = toC(lx, lz);
      out.sill = {
        x: X,
        z: Z,
        ix: ix * cs - iz * sn,
        iz: ix * sn + iz * cs,
        y: yy,
        stilts: !!st.stilts,
        wood:
          st.wallPat === PAT.PLANK ||
          st.wallPat === PAT.LOG ||
          st.wallPat === PAT.HIDE,
      };
    };
    // foundation down into the ground so slopes never show a gap
    const fh = 0.6 + b.sink;
    const fx = w / 2 + 0.15,
      fz = d / 2 + 0.15;
    const box = (x0, y0, z0, x1, y1, z1, row, pat, faces = "all", o = null) => {
      const P = (xx, yy, zz) => [xx, yy, zz];
      const W = x1 - x0,
        H = y1 - y0,
        D = z1 - z0;
      const f = (nm) => faces === "all" || faces.includes(nm);
      if (f("front"))
        Q(
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
      if (f("back"))
        Q(
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
      if (f("right"))
        Q(
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
      if (f("left"))
        Q(
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
      if (f("top"))
        Q(
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
    if (st.stilts) {
      const sh = 1.6 + b.sink;
      for (const sx of [-1, 1])
        for (const sz of [-1, 1])
          mb.prism(
            T([sx * (w / 2 - 0.2), y - b.sink - 0.5, sz * (d / 2 - 0.2)]),
            T([sx * (w / 2 - 0.2), y + sh - b.sink, sz * (d / 2 - 0.2)]),
            0.12,
            0.1,
            4,
            R.wood,
            PAT.BARK,
          );
      y += 1.6;
      box(-fx, y - 0.25, -fz, fx, y, fz, R.wood, PAT.PLANK);
    } else
      box(-fx, y - fh, -fz, fx, y + 0.15, fz, R.base, PAT.STONE, [
        "front",
        "back",
        "left",
        "right",
        "top",
      ]);
    if (b.round) {
      // a round house (yurt or hut): a ring of walls and a cone roof
      const r = w / 2,
        hh = st.storeyH * 0.85,
        n = 10,
        DOOR = 2;
      for (let k = 0; k < n; k++) {
        const a0 = (k / n) * 6.283,
          a1 = ((k + 1) / n) * 6.283;
        const A0 = [Math.cos(a0) * r, y, Math.sin(a0) * r],
          A1 = [Math.cos(a1) * r, y, Math.sin(a1) * r];
        const door = k === DOOR;
        // an open house has a doorway here: the wall stops above head height
        const lo = door && open ? y + 2.0 : y;
        Q(
          [A1[0], lo, A1[2]],
          [A0[0], lo, A0[2]],
          [A0[0], y + hh, A0[2]],
          [A1[0], y + hh, A1[2]],
          R.wall,
          door && !open ? PAT.DOOR : st.wallPat,
          [
            [a1 * r, lo - y],
            [a0 * r, lo - y],
            [a0 * r, hh],
            [a1 * r, hh],
          ],
          door && !open ? { row2: R.wood } : null,
        );
        if (door && !open) {
          const am = (a0 + a1) / 2,
            [X, Z] = toC(Math.cos(am) * (r + 0.6), Math.sin(am) * (r + 0.6));
          out.door = { x: X, z: Z, y: y + 1.0 };
        }
        if (!open) continue;
        // the inside of the wall, dimmer, and a stretch of wall to bump into
        const ri = r - 0.05,
          B0 = [Math.cos(a0) * ri, lo, Math.sin(a0) * ri],
          B1 = [Math.cos(a1) * ri, lo, Math.sin(a1) * ri];
        Q(
          B0,
          B1,
          [B1[0], y + hh, B1[2]],
          [B0[0], y + hh, B0[2]],
          R.wall,
          st.wallPat,
          [
            [a0 * r, lo - y],
            [a1 * r, lo - y],
            [a1 * r, hh],
            [a0 * r, hh],
          ],
          { lv: b.kind === "home" ? -0.6 : -0.9 },
        );
        if (door) continue;
        const am = (a0 + a1) / 2,
          L = 2 * r * Math.sin(Math.PI / n);
        const ca = Math.cos(am + Math.PI / 2),
          sa = Math.sin(am + Math.PI / 2);
        const [X, Z] = toC(Math.cos(am) * r, Math.sin(am) * r);
        out.walls.push({
          x: X,
          z: Z,
          hx: L / 2 + 0.05,
          hz: 0.14,
          cs: ca * cs - sa * sn,
          sn: ca * sn + sa * cs,
        });
      }
      if (open) {
        const am = ((DOOR + 0.5) / n) * 6.283;
        const fy = y + 0.16;
        for (let q = 0; q < n; q++) {
          const b0 = (q / n) * 6.283,
            b1 = ((q + 1) / n) * 6.283;
          Tr(
            [0, fy, 0],
            [Math.cos(b1) * r, fy, Math.sin(b1) * r],
            [Math.cos(b0) * r, fy, Math.sin(b0) * r],
            R.cloth || R.wood,
            PAT.HIDE,
            null,
            { lv: -0.6 },
          );
        }
        furnishRound(
          mb,
          T,
          R,
          fy,
          r,
          am,
          out,
          toC,
          rot,
          b.kind === "home",
          b.kind === "home" && b.work && b.work.length
            ? { work: b.work, size: b.size || "hut", ceil: hh - 0.16 }
            : null,
        );
        // (ring: the inside face of the wall, its sides and which one is the doorway)
        out.room = {
          x,
          z,
          hx: r * 0.7,
          hz: r * 0.7,
          cs,
          sn,
          y0: fy,
          y1: fy + hh,
          ring: { r: r - 0.05, n, door: DOOR },
        };
        {
          const [ex, ez] = toC(
              Math.cos(am) * (r + 1.6),
              Math.sin(am) * (r + 1.6),
            ),
            [ix, iz] = [
              -(Math.cos(am) * cs - Math.sin(am) * sn),
              -(Math.cos(am) * sn + Math.sin(am) * cs),
            ];
          out.entry = { x: ex, z: ez, ix, iz, y: fy, kind: "round" };
        }
      }
      {
        const am = ((DOOR + 0.5) / n) * 6.283,
          fe = d / 2 + 0.15,
          ca = Math.cos(am),
          sa = Math.sin(am),
          dy = y + (open ? 0.16 : 0.15);
        if (b.porch && !st.stilts) {
          const PD = 1.7;
          porchInto(
            ca * (r - 0.1),
            sa * (r - 0.1),
            ca,
            sa,
            -sa,
            ca,
            3.0,
            PD + 0.25,
            dy,
            y + hh - 0.25,
          );
          sillAt(ca * (r + PD + 0.15), sa * (r + PD + 0.15), -ca, -sa, dy);
        } else sillAt(ca * fe, sa * fe, -ca, -sa, dy);
      }
      const ry = y + hh,
        apex = ry + r * st.roofPitch * 0.9;
      for (let k = 0; k < n; k++) {
        const a0 = (k / n) * 6.283,
          a1 = ((k + 1) / n) * 6.283,
          ro = r + 0.35;
        Tr(
          [Math.cos(a1) * ro, ry - 0.2, Math.sin(a1) * ro],
          [Math.cos(a0) * ro, ry - 0.2, Math.sin(a0) * ro],
          [0, apex, 0],
          R.roof,
          st.roofPat,
          [
            [a1 * ro, 0],
            [a0 * ro, 0],
            [((a0 + a1) / 2) * ro, apex - ry],
          ],
        );
      }
      if (st.smoke)
        mb.prism(
          T([0, apex - 0.3, 0]),
          T([0, apex + 0.5, 0]),
          0.12,
          0.1,
          4,
          R.wood,
          PAT.NONE,
        );
      if (b.doorLight) {
        const am = ((DOOR + 0.5) / n) * 6.283,
          ca = Math.cos(am),
          sa = Math.sin(am);
        const px = ca * (r + 1.0) - sa * 1.0,
          pz = sa * (r + 1.0) + ca * 1.0;
        const q = lampInto(
          mb,
          "stake",
          (p) => T([px + p[0], y + p[1], pz + p[2]]),
          R,
        );
        out.lights.push({ x: q[0], y: q[1], z: q[2], kind: "stake" });
      }
      return out;
    }
    let cw = w,
      cd = d;
    const gy = y;
    {
      const nwF = Math.max(1, Math.floor(w / 2.4)),
        dxD = -w / 2 + ((Math.floor(nwF / 2) + 0.5) * w) / nwF,
        dy = y + (open ? 0.16 : 0.15);
      // (a porch along the front: the way up to the door starts at its edge)
      if (b.porch && !st.stilts) {
        const PD = 1.9;
        porchInto(
          0,
          d / 2 + 0.15,
          0,
          1,
          1,
          0,
          w + 0.2,
          PD,
          dy,
          y + st.storeyH - 0.2,
        );
        sillAt(dxD, d / 2 + 0.15 + PD, 0, -1, dy);
      } else sillAt(dxD, d / 2 + 0.15, 0, -1, dy);
    }
    for (let f = 0; f < b.floors; f++) {
      const hh = st.storeyH;
      if (f > 0) {
        if (st.upper === "jetty") {
          cw += 0.5;
          cd += 0.5;
          box(-cw / 2, y - 0.2, -cd / 2, cw / 2, y, cd / 2, R.wood, PAT.PLANK, [
            "front",
            "back",
            "left",
            "right",
          ]);
        } else if (st.upper === "step") {
          cw -= 1.2;
          cd -= 1.2;
        }
      }
      const x0 = -cw / 2,
        x1 = cw / 2,
        z0 = -cd / 2,
        z1 = cd / 2;
      const inside = f === 0 && open;
      const wRow = f > 0 && st.upperRow ? R.upper : R.wall,
        wPat = f > 0 && st.upperPat != null ? st.upperPat : st.wallPat;
      let door = null;
      if (inside) {
        // the doorway is where the door would be: the middle slot of the front
        const nwF = Math.max(1, Math.floor(cw / 2.4)),
          wxD = x0 + ((Math.floor(nwF / 2) + 0.5) * cw) / nwF;
        door = { d0: wxD - 0.6, d1: wxD + 0.6, h: 2.15, x: wxD };
        box(x0, y, z0, x1, y + hh, z1, wRow, wPat, ["back", "left", "right"]);
        const fq = (a0, a1, b0, b1) =>
          Q(
            [a0, b0, z1],
            [a1, b0, z1],
            [a1, b1, z1],
            [a0, b1, z1],
            wRow,
            wPat,
            [
              [a0, b0],
              [a1, b0],
              [a1, b1],
              [a0, b1],
            ],
          );
        fq(x0, door.d0, y, y + hh);
        fq(door.d1, x1, y, y + hh);
        fq(door.d0, door.d1, y + door.h, y + hh);
        interiorInto(
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
        );
      } else
        box(x0, y, z0, x1, y + hh, z1, wRow, wPat, [
          "front",
          "back",
          "left",
          "right",
        ]);
      // flat-roofed styles walk on the floor above: top of this storey
      if (st.upper === "step" && f < b.floors - 1)
        box(x0, y + hh - 0.01, z0, x1, y + hh, z1, R.roof, st.roofPat, ["top"]);
      // windows on every side, a door on the ground floor front
      const winH = 0.9,
        wy = y + hh * 0.45;
      const sides = [
        [z1, 1, cw, "front"],
        [z0, -1, cw, "back"],
      ];
      // (no window behind a loom built against the wall, or where an oven's flue goes up; a bench is low,
      // and stands in the light)
      const lay =
        inside && b.kind === "home" && b.work && b.work.length
          ? workLayout(b.size || "hut", false, b.work)
          : null;
      const WIN_CLEAR = { oven: 0.6, loom: WORK_LEN.loom / 2 + 0.45 };
      const behindWork = (s, wx) =>
        !!lay &&
        b.work.some(
          (k) =>
            lay[k] &&
            WIN_CLEAR[k] &&
            lay[k].wall === s &&
            Math.abs(wx - lay[k].x) < WIN_CLEAR[k],
        );
      for (const [zz, s, span] of sides) {
        const nw = Math.max(1, Math.floor(span / 2.4));
        for (let k = 0; k < nw; k++) {
          const wx = x0 + ((k + 0.5) * span) / nw;
          if (f === 0 && s > 0 && k === Math.floor(nw / 2)) {
            if (!inside) {
              Q(
                [wx - 0.55, y, zz + s * 0.03],
                [wx + 0.55, y, zz + s * 0.03],
                [wx + 0.55, y + 2.0, zz + s * 0.03],
                [wx - 0.55, y + 2.0, zz + s * 0.03],
                R.wood,
                PAT.DOOR,
                s > 0
                  ? [
                      [0, 0],
                      [1.1, 0],
                      [1.1, 2],
                      [0, 2],
                    ]
                  : null,
              );
              if (b.board)
                for (const [yb, t] of [
                  [y + 0.45, 0.06],
                  [y + 1.15, -0.08],
                  [y + 1.6, 0.04],
                ])
                  plankF(wx, yb, 1.5, zz, s, t);
              if (f === 0)
                out.door = {
                  x: toC(wx, zz + 0.7)[0],
                  z: toC(wx, zz + 0.7)[1],
                  y: y + 1.0,
                };
            }
            continue;
          }
          if (f === 0 && behindWork(s, wx)) continue;
          const a = [wx - 0.4, wy, zz + s * 0.03],
            bb = [wx + 0.4, wy, zz + s * 0.03],
            c = [wx + 0.4, wy + winH, zz + s * 0.03],
            dd = [wx - 0.4, wy + winH, zz + s * 0.03];
          const wuv = winUv(winK),
            wIn = winUv(winK++, true);
          if (s > 0) Q(a, bb, c, dd, R.wood, PAT.WINDOW, wuv, { row2: wglow });
          else Q(bb, a, dd, c, R.wood, PAT.WINDOW, wuv, { row2: wglow });
          if (b.board) {
            plankF(wx, wy + 0.12, 1.05, zz, s, 0.05);
            plankF(wx, wy + 0.55, 1.05, zz, s, -0.06);
          }
          // from inside, a window at night is dark: the night is out there
          if (inside) {
            const iz = zz - s * 0.09;
            Q(
              [wx + 0.4, wy, iz],
              [wx - 0.4, wy, iz],
              [wx - 0.4, wy + winH, iz],
              [wx + 0.4, wy + winH, iz],
              R.wood,
              PAT.WINDOW,
              wIn,
              { row2: wglow, lv: -0.5 },
            );
          }
        }
      }
      for (const [xx, s] of [
        [x1, 1],
        [x0, -1],
      ]) {
        const nw = Math.max(0, Math.floor(cd / 3));
        for (let k = 0; k < nw; k++) {
          const wz = z0 + ((k + 0.5) * cd) / nw;
          const a = [xx + s * 0.03, wy, wz + 0.4 * s],
            bb = [xx + s * 0.03, wy, wz - 0.4 * s],
            c = [xx + s * 0.03, wy + winH, wz - 0.4 * s],
            dd = [xx + s * 0.03, wy + winH, wz + 0.4 * s];
          const wuv = winUv(winK),
            wIn = winUv(winK++, true);
          Q(a, bb, c, dd, R.wood, PAT.WINDOW, wuv, { row2: wglow });
          if (b.board) {
            plankS(xx, wy + 0.12, 1.05, wz, s, 0.05);
            plankS(xx, wy + 0.55, 1.05, wz, s, -0.06);
          }
          if (inside) {
            const ix = xx - s * 0.09;
            Q(
              [ix, wy, wz - 0.4 * s],
              [ix, wy, wz + 0.4 * s],
              [ix, wy + winH, wz + 0.4 * s],
              [ix, wy + winH, wz - 0.4 * s],
              R.wood,
              PAT.WINDOW,
              wIn,
              { row2: wglow, lv: -0.5 },
            );
          }
        }
      }
      y += hh;
    }
    // lights by the door: torches either side of it, or a lantern on a bracket
    if (b.doorLight) {
      const nwF = Math.max(1, Math.floor(w / 2.4)),
        dx = -w / 2 + ((Math.floor(nwF / 2) + 0.5) * w) / nwF;
      const put = (kind, ox) => {
        const q = lampInto(
          mb,
          kind,
          (p) => T([dx + ox + p[0], gy + p[1], d / 2 + 0.03 + p[2]]),
          R,
        );
        out.lights.push({ x: q[0], y: q[1], z: q[2], kind });
      };
      if (b.doorLight === "torches") {
        put("torch", -0.95);
        put("torch", 0.95);
      } else put("wall", 0.9);
    }
    // roof
    const ov = st.overhang,
      x0 = -cw / 2 - ov,
      x1 = cw / 2 + ov,
      z0 = -cd / 2 - ov,
      z1 = cd / 2 + ov;
    const ridge = (Math.min(cw, cd) / 2) * st.roofPitch;
    const kind = b.roof || st.roof;
    if (kind === "flat") {
      box(-cw / 2, y, -cd / 2, cw / 2, y + 0.12, cd / 2, R.roof, st.roofPat, [
        "top",
      ]);
      // parapet
      const p = 0.5,
        t = 0.25;
      box(-cw / 2, y, cd / 2 - t, cw / 2, y + p, cd / 2, R.wall, st.wallPat, [
        "front",
        "back",
        "top",
      ]);
      box(-cw / 2, y, -cd / 2, cw / 2, y + p, -cd / 2 + t, R.wall, st.wallPat, [
        "front",
        "back",
        "top",
      ]);
      box(-cw / 2, y, -cd / 2, -cw / 2 + t, y + p, cd / 2, R.wall, st.wallPat, [
        "left",
        "right",
        "top",
      ]);
      box(cw / 2 - t, y, -cd / 2, cw / 2, y + p, cd / 2, R.wall, st.wallPat, [
        "left",
        "right",
        "top",
      ]);
    } else if (kind === "dome") {
      const r = Math.min(cw, cd) / 2,
        n = 10,
        rings = 4;
      box(-cw / 2, y, -cd / 2, cw / 2, y + 0.1, cd / 2, R.roof, st.roofPat, [
        "top",
      ]);
      for (let j = 0; j < rings; j++) {
        const e0 = ((j / rings) * Math.PI) / 2,
          e1 = (((j + 1) / rings) * Math.PI) / 2;
        for (let k = 0; k < n; k++) {
          const a0 = (k / n) * 6.283,
            a1 = ((k + 1) / n) * 6.283;
          const P = (a, e) => [
            Math.cos(a) * Math.cos(e) * r * 0.92,
            y + Math.sin(e) * r * 0.85,
            Math.sin(a) * Math.cos(e) * r * 0.92,
          ];
          Q(
            P(a1, e0),
            P(a0, e0),
            P(a0, e1),
            P(a1, e1),
            R.roof,
            st.roofPat,
            null,
          );
        }
      }
    } else if (kind === "hip" || kind === "pyramid") {
      const rl = kind === "pyramid" ? 0 : Math.max(0, (cw - cd) / 2);
      const top = y + ridge;
      Q(
        [x0, y, z1],
        [x1, y, z1],
        [rl, top, 0],
        [-rl, top, 0],
        R.roof,
        st.roofPat,
        [
          [x0, 0],
          [x1, 0],
          [rl, ridge * 1.3],
          [-rl, ridge * 1.3],
        ],
      );
      Q(
        [x1, y, z0],
        [x0, y, z0],
        [-rl, top, 0],
        [rl, top, 0],
        R.roof,
        st.roofPat,
        [
          [-x1, 0],
          [-x0, 0],
          [rl, ridge * 1.3],
          [-rl, ridge * 1.3],
        ],
      );
      Tr([x1, y, z1], [x1, y, z0], [rl, top, 0], R.roof, st.roofPat, [
        [-z1, 0],
        [-z0, 0],
        [0, ridge * 1.3],
      ]);
      Tr([x0, y, z0], [x0, y, z1], [-rl, top, 0], R.roof, st.roofPat, [
        [z0, 0],
        [z1, 0],
        [0, ridge * 1.3],
      ]);
      Q(
        [x0, y, z0],
        [x1, y, z0],
        [x1, y, z1],
        [x0, y, z1],
        R.roof,
        PAT.NONE,
        null,
        { lv: -1.5 },
      );
    } else {
      // gable along the long side
      const alongX = cw >= cd;
      const top = y + ridge;
      if (alongX) {
        Q(
          [x0, y, z1],
          [x1, y, z1],
          [x1, top, 0],
          [x0, top, 0],
          R.roof,
          st.roofPat,
          [
            [x0, 0],
            [x1, 0],
            [x1, ridge * 1.4],
            [x0, ridge * 1.4],
          ],
        );
        Q(
          [x1, y, z0],
          [x0, y, z0],
          [x0, top, 0],
          [x1, top, 0],
          R.roof,
          st.roofPat,
          [
            [-x1, 0],
            [-x0, 0],
            [-x0, ridge * 1.4],
            [-x1, ridge * 1.4],
          ],
        );
        Tr(
          [cw / 2, y, cd / 2],
          [cw / 2, y, -cd / 2],
          [cw / 2, top - 0.05, 0],
          R.upper || R.wall,
          st.gablePat != null ? st.gablePat : st.wallPat,
          [
            [-cd / 2, y],
            [cd / 2, y],
            [0, top],
          ],
        );
        Tr(
          [-cw / 2, y, -cd / 2],
          [-cw / 2, y, cd / 2],
          [-cw / 2, top - 0.05, 0],
          R.upper || R.wall,
          st.gablePat != null ? st.gablePat : st.wallPat,
          [
            [-cd / 2, y],
            [cd / 2, y],
            [0, top],
          ],
        );
      } else {
        Q(
          [x1, y, z1],
          [x1, y, z0],
          [0, top, z0],
          [0, top, z1],
          R.roof,
          st.roofPat,
          [
            [-z1, 0],
            [-z0, 0],
            [-z0, ridge * 1.4],
            [-z1, ridge * 1.4],
          ],
        );
        Q(
          [x0, y, z0],
          [x0, y, z1],
          [0, top, z1],
          [0, top, z0],
          R.roof,
          st.roofPat,
          [
            [z0, 0],
            [z1, 0],
            [z1, ridge * 1.4],
            [z0, ridge * 1.4],
          ],
        );
        Tr(
          [-cw / 2, y, cd / 2],
          [cw / 2, y, cd / 2],
          [0, top - 0.05, cd / 2],
          R.upper || R.wall,
          st.gablePat != null ? st.gablePat : st.wallPat,
          [
            [-cw / 2, y],
            [cw / 2, y],
            [0, top],
          ],
        );
        Tr(
          [cw / 2, y, -cd / 2],
          [-cw / 2, y, -cd / 2],
          [0, top - 0.05, -cd / 2],
          R.upper || R.wall,
          st.gablePat != null ? st.gablePat : st.wallPat,
          [
            [-cw / 2, y],
            [cw / 2, y],
            [0, top],
          ],
        );
      }
      Q(
        [x0, y, z0],
        [x1, y, z0],
        [x1, y, z1],
        [x0, y, z1],
        R.roof,
        PAT.NONE,
        null,
        { lv: -1.5 },
      );
    }
    if (b.chimney && kind !== "dome") {
      const cx = cw * 0.25,
        cz = 0;
      box(
        cx - 0.35,
        y,
        cz - 0.35,
        cx + 0.35,
        y + ridge + 0.9,
        cz + 0.35,
        R.base,
        PAT.BRICK,
        ["front", "back", "left", "right", "top"],
      );
    }
    if (b.tower) {
      // a spire on top of towers (a hermit's bends over, like an old hat)
      const s = Math.min(cw, cd) / 2,
        y0 = y + (kind === "flat" ? 0.5 : ridge * 0.2),
        y1 = y + ridge + s * 2.2;
      if (b.crooked) {
        const m = T([s * 0.1, y0 + (y1 - y0) * 0.55, 0]),
          tip = T([s * 0.85, y1 + s * 0.1, s * 0.25]);
        mb.prism(T([0, y0, 0]), m, s * 0.7, s * 0.4, 8, R.roof, st.roofPat);
        mb.prism(m, tip, s * 0.4, 0.04, 8, R.roof, st.roofPat);
      } else mb.cone(T([0, y0, 0]), y1, s * 0.7, 8, R.roof, st.roofPat);
    }
    return out;
  }

  // ---------- inside a house ----------
  // The ground floor of an open house: the doorway's frame and an open door, the walls lined
  // on the inside (dimmer than outside), a plank floor, a beamed ceiling, and furniture that
  // depends on what the building is for. Local metres: x across, z from back (z0) to front (z1).
