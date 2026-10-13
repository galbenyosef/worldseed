// index-inline-2 68 — res
// Lines 26396-26456 of readable/index-inline-2.pretty.js (statement-aligned).
  function workAt(mb, kind, cx, cz, vx, vz, C) {
    const ux = vz,
      uz = -vx;
    const L = (x, z) => [cx + ux * x + vx * z, cz + uz * x + vz * z];
    const res = workInto(
      mb,
      kind,
      (p) => {
        const [lx, lz] = L(p[0], p[2]);
        return C.T([lx, C.fy + p[1], lz]);
      },
      C.R,
      C.o,
      C.ceil,
    );
    const bcs = ux * C.cs - uz * C.sn,
      bsn = ux * C.sn + uz * C.cs;
    const at = (x0, x1, z0, z1) => {
      const [mx, mz] = L((x0 + x1) / 2, (z0 + z1) / 2);
      return C.toC(mx, mz);
    };
    for (const [x0, x1, z0, z1, top] of res.boxes) {
      const [X, Z] = at(x0, x1, z0, z1);
      C.out.furn.push({
        x: X,
        z: Z,
        hx: (x1 - x0) / 2,
        hz: (z1 - z0) / 2,
        cs: bcs,
        sn: bsn,
        top: C.fy + top,
        work: kind,
      });
    }
    for (const [x0, x1, z0, z1, top] of res.tops) {
      const [X, Z] = at(x0, x1, z0, z1);
      C.out.tops.push({
        x: X,
        z: Z,
        hx: (x1 - x0) / 2,
        hz: (z1 - z0) / 2,
        cs: bcs,
        sn: bsn,
        y: C.fy + top,
      });
    }
    if (res.spot) {
      const [lx, lz] = L(res.spot[0], res.spot[2]),
        [X, Z] = C.toC(lx, lz);
      (C.out.work || (C.out.work = [])).push({
        kind,
        x: X,
        z: Z,
        y: C.fy + res.spot[1],
      });
    }
  }
  // ---------- a workroom at home: an oven, a bench and an anvil, a loom ----------
  // Each stands against a wall. Its own metres: x along the wall, y up from the floor, z out from the
  // wall into the room. T maps a point of that into place. Gives back what can be bumped into and what
  // things can be set down on (boxes, tops: [x0, x1, z0, z1, top]) and where to look to use it (spot).
