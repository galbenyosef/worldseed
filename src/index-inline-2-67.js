// index-inline-2 67 — math
// Lines 26102-26395 of readable/index-inline-2.pretty.js (statement-aligned).
  function furnishRound(
    mb,
    T,
    R,
    fy,
    r,
    doorA,
    out,
    toC,
    rot = 0,
    home = false,
    wk = null,
  ) {
    const cs0 = Math.cos(rot),
      sn0 = Math.sin(rot);
    const dim = { lv: -0.9 },
      stone = R.base,
      flame = R.flame || R.glow,
      cloth = R.cloth || R.wood,
      straw = R.straw || R.roof;
    for (let k = 0; k < 8; k++) {
      const a = (k / 8) * 6.283;
      mb.box(
        ...(() => {
          const p = T([Math.cos(a) * 0.5, 0, Math.sin(a) * 0.5]);
          return [
            p[0] - 0.1,
            fy - 0.02,
            p[2] - 0.1,
            p[0] + 0.1,
            fy + 0.14,
            p[2] + 0.1,
          ];
        })(),
        stone,
        PAT.ROCK,
        dim,
      );
    }
    for (let k = 0; k < 3; k++) {
      const a = k * 2.1;
      mb.cone(
        T([Math.cos(a) * 0.1, fy + 0.03, Math.sin(a) * 0.1]),
        fy + 0.34 + (k ? 0.1 : 0.22),
        0.12,
        5,
        flame,
        23,
        null,
        0,
        0,
        a,
      );
    }
    const [hX, hZ] = toC(0, 0);
    out.hearth = { x: hX, z: hZ, y: fy + 0.3 };
    const [fX, fZ] = toC(0, 0);
    out.furn.push({
      x: fX,
      z: fZ,
      hx: 0.55,
      hz: 0.55,
      cs: 1,
      sn: 0,
      top: fy + 0.2,
    });
    // two beds of skins and straw, across from the door (at home, one bed and a chest)
    for (const off of home ? [2.4] : [2.4, 3.9]) {
      const a = doorA + off,
        cx = Math.cos(a) * (r - 0.75),
        cz = Math.sin(a) * (r - 0.75);
      const ta = a + Math.PI / 2,
        ux = Math.cos(ta),
        uz = Math.sin(ta);
      const P = (u, v, h) =>
        T([
          cx + ux * u + Math.cos(a) * v,
          fy + h,
          cz + uz * u + Math.sin(a) * v,
        ]);
      mb.quad(
        P(-0.95, -0.45, 0.12),
        P(0.95, -0.45, 0.12),
        P(0.95, 0.45, 0.12),
        P(-0.95, 0.45, 0.12),
        straw,
        PAT.THATCH,
        null,
        dim,
      );
      mb.quad(
        P(-0.5, -0.46, 0.16),
        P(0.95, -0.46, 0.16),
        P(0.95, 0.46, 0.16),
        P(-0.5, 0.46, 0.16),
        cloth,
        PAT.HIDE,
        null,
        dim,
      );
      const [X, Z] = toC(cx, cz);
      // the head of the bed: one end along the wall
      const hx = ux * cs0 - uz * sn0,
        hz = ux * sn0 + uz * cs0;
      out.beds.push({
        x: X,
        z: Z,
        y: fy + 0.2,
        head: Math.atan2(hx, -hz),
        len: 1.9,
      });
      if (home)
        out.tops.push({
          x: X,
          z: Z,
          hx: 0.9,
          hz: 0.42,
          cs: Math.cos(ta + rot),
          sn: Math.sin(ta + rot),
          y: fy + 0.16,
        });
    }
    // by the fire in the middle
    {
      const a = doorA + Math.PI * 0.5,
        [X, Z] = toC(Math.cos(a) * 1.1, Math.sin(a) * 1.1);
      const dx = -Math.cos(a),
        dz = -Math.sin(a);
      out.spots.hearth = {
        x: X,
        z: Z,
        y: fy,
        face: Math.atan2(dx * cs0 - dz * sn0, -(dx * sn0 + dz * cs0)),
      };
    }
    // the floor you stand on (near enough round, out to the wall: it holds you up however you came to be
    // on it), and a strip of it through the doorway out to the foundation's edge (on the +z side)
    {
      const [X, Z] = toC(0, 0);
      for (const [hx, hz] of [
        [r * 0.7, r * 0.7],
        [r * 0.93, r * 0.36],
        [r * 0.36, r * 0.93],
      ])
        out.furn.push({
          x: X,
          z: Z,
          hx,
          hz,
          cs: cs0,
          sn: sn0,
          top: fy,
          lift: true,
          walk: true,
        });
    }
    {
      const [X, Z] = toC(0, r - 0.075);
      out.furn.push({
        x: X,
        z: Z,
        hx: 0.7,
        hz: 0.225,
        cs: cs0,
        sn: sn0,
        top: fy,
        walk: true,
      });
    }
    if (!home) return;
    // a chest against the wall where a second bed would be
    {
      const a = doorA + 3.9,
        cx = Math.cos(a) * (r - 0.62),
        cz = Math.sin(a) * (r - 0.62),
        ta = a + Math.PI / 2,
        ux = Math.cos(ta),
        uz = Math.sin(ta);
      const P = (u, v, h) =>
        T([
          cx + ux * u + Math.cos(a) * v,
          fy + h,
          cz + uz * u + Math.sin(a) * v,
        ]);
      const wood = R.wood,
        dark = R.dark || R.wood,
        iron = R.iron || dark,
        lit = { lv: -0.35 };
      const side = (u0, v0, u1, v1, row) =>
        mb.quad(
          P(u0, v0, 0),
          P(u1, v1, 0),
          P(u1, v1, 0.5),
          P(u0, v0, 0.5),
          row,
          PAT.PLANK,
          null,
          lit,
        );
      side(-0.45, -0.27, 0.45, -0.27, wood);
      side(0.45, -0.27, 0.45, 0.27, wood);
      side(0.45, 0.27, -0.45, 0.27, wood);
      side(-0.45, 0.27, -0.45, -0.27, wood);
      mb.quad(
        P(-0.45, -0.27, 0.5),
        P(0.45, -0.27, 0.5),
        P(0.45, 0.27, 0.5),
        P(-0.45, 0.27, 0.5),
        wood,
        PAT.PLANK,
        null,
        lit,
      );
      mb.quad(
        P(-0.06, -0.28, 0.02),
        P(0.06, -0.28, 0.02),
        P(0.06, -0.28, 0.52),
        P(-0.06, -0.28, 0.52),
        iron,
        PAT.NONE,
        null,
        lit,
      );
      mb.quad(
        P(-0.06, 0.28, 0.52),
        P(0.06, 0.28, 0.52),
        P(0.06, 0.28, 0.02),
        P(-0.06, 0.28, 0.02),
        iron,
        PAT.NONE,
        null,
        lit,
      );
      mb.quad(
        P(-0.06, -0.28, 0.52),
        P(0.06, -0.28, 0.52),
        P(0.06, 0.28, 0.52),
        P(-0.06, 0.28, 0.52),
        iron,
        PAT.NONE,
        null,
        lit,
      );
      const [X, Z] = toC(cx, cz),
        bu = ta + rot;
      out.furn.push({
        x: X,
        z: Z,
        hx: 0.45,
        hz: 0.27,
        cs: Math.cos(bu),
        sn: Math.sin(bu),
        top: fy + 0.5,
      });
      out.tops.push({
        x: X,
        z: Z,
        hx: 0.43,
        hz: 0.25,
        cs: Math.cos(bu),
        sn: Math.sin(bu),
        y: fy + 0.5,
      });
      out.chest = { x: X, z: Z, y: fy + 0.5 };
    }
    // what the house-wright built in, round the wall, facing the fire
    if (wk) {
      const lay = workLayout(wk.size, true, wk.work),
        rin = (r - 0.05) * Math.cos(Math.PI / 10) - 0.04;
      for (const k of wk.work) {
        const sl = lay[k];
        if (!sl) continue;
        const half = WORK_LEN[k] / 2 + 0.1,
          rb = Math.sqrt(Math.max(0.5, rin * rin - half * half)),
          ca = Math.cos(sl.a),
          sa = Math.sin(sl.a);
        workAt(mb, k, ca * rb, sa * rb, -ca, -sa, {
          T,
          R,
          fy,
          ceil: wk.ceil,
          toC,
          cs: cs0,
          sn: sn0,
          out,
          o: { lv: -0.5 },
        });
      }
    }
  }

  // One built into a room: (cx, cz) the point on the inside of the wall behind its middle and (vx, vz) the way
  // into the room, both in the house's own metres. What it leaves (what to bump into, where things can be set
  // down, where to use it) goes into the house's out, in the caller's metres (C: T, R, fy, ceil, toC, cs, sn, out, o).
