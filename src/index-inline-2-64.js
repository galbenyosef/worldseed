// index-inline-2 64 — src
// Lines 23897-24120 of readable/index-inline-2.pretty.js (statement-aligned).
  function mummyProto(h, rows, seed, opts = {}) {
    const mb = new MeshBuf(true);
    mb.lvBase = 0.15;
    const rnd = mulberry32(seed >>> 0),
      R = rows;
    const hipY = h * 0.47,
      shY = h * 0.77,
      headY = h * 0.8;
    const tw = h * 0.088;
    const B = (bone, pivot) => ({ bone, pivot, row2: R.wrapDark });
    // legs, wound tight down to the feet; the feet stand up out of the wrappings
    for (const s of [-1, 1]) {
      const x = s * h * 0.042,
        bone = s < 0 ? 4 : 5,
        pv = [x, hipY, 0];
      mb.prism(
        [x, h * 0.04, 0],
        [x, hipY + h * 0.02, 0],
        h * 0.03,
        h * 0.044,
        6,
        R.wrap,
        PAT.WRAP,
        B(bone, pv),
      );
      mb.box(
        x - h * 0.03,
        0,
        -h * 0.035,
        x + h * 0.03,
        h * 0.05,
        h * 0.07,
        R.wrapDark,
        PAT.WRAP,
        B(bone, pv),
      );
    }
    // the body: a bundle, a little wider at the chest
    mb.prism(
      [0, hipY - h * 0.04, 0],
      [0, shY - h * 0.01, 0],
      tw * 0.95,
      tw * 1.08,
      8,
      R.wrap,
      PAT.WRAP,
      B(0, [0, 0, 0]),
      0,
      true,
    );
    mb.prism(
      [0, shY - h * 0.075, 0],
      [0, shY + h * 0.005, 0],
      tw * 1.18,
      tw * 0.9,
      8,
      R.wrapDark,
      PAT.WRAP,
      B(0, [0, 0, 0]),
    );
    // arms, bound to the sides; the wrapping has come away from the fingers
    for (const s of [-1, 1]) {
      const x = s * (tw + h * 0.03),
        bone = s < 0 ? 2 : 3,
        pv = [x, shY - h * 0.02, 0];
      mb.prism(
        [x, shY - h * 0.01, 0],
        [x, shY - h * 0.33, 0],
        h * 0.03,
        h * 0.025,
        6,
        R.wrap,
        PAT.WRAP,
        B(bone, pv),
      );
      mb.box(
        x - h * 0.02,
        shY - h * 0.375,
        -h * 0.022,
        x + h * 0.02,
        shY - h * 0.33,
        h * 0.022,
        R.dry,
        PAT.NONE,
        B(bone, pv),
      );
    }
    // the head, wound like the rest, the dried face showing through
    const hr = h * 0.06,
      pvH = [0, headY, 0],
      hy1 = headY + h * 0.125;
    mb.prism(
      [0, shY - h * 0.01, 0],
      [0, headY + 0.01, 0],
      h * 0.026,
      h * 0.024,
      6,
      R.wrap,
      PAT.WRAP,
      B(1, pvH),
    );
    mb.prism(
      [0, headY - h * 0.005, 0],
      [0, hy1, 0],
      hr * 0.92,
      hr * 0.86,
      8,
      R.wrap,
      PAT.WRAP,
      B(1, pvH),
      0,
      true,
    );
    mb.cone(
      [0, hy1 - 0.002, 0],
      hy1 + hr * 0.42,
      hr * 0.86,
      8,
      R.wrap,
      PAT.WRAP,
      B(1, pvH),
    );
    const fz = hr * 0.93,
      fw = hr * 0.62;
    mb.quad(
      [-fw, headY + h * 0.012, fz],
      [fw, headY + h * 0.012, fz],
      [fw, hy1 - h * 0.018, fz],
      [-fw, hy1 - h * 0.018, fz],
      R.dry,
      PAT.DEADFACE,
      [
        [0, 0],
        [1, 0],
        [1, 1],
        [0, 1],
      ],
      { bone: 1, pivot: pvH, row2: R.wrap },
    );
    // a loose strip or two
    for (let k = 0; k < 2; k++) {
      const a = (rnd() - 0.5) * 1.6,
        y = hipY + rnd() * (shY - hipY - 0.12),
        L = 0.12 + rnd() * 0.2;
      const x = Math.sin(a) * tw,
        z = Math.cos(a) * tw;
      mb.box(
        x - 0.022,
        y - L,
        z,
        x + 0.022,
        y,
        z + 0.012,
        R.wrapDark,
        PAT.CLOTH,
        B(0, [0, 0, 0]),
      );
    }
    // a lord: a band of beaten copper on the brow, points standing up from it, and a collar
    if (opts.crown) {
      const y0 = hy1 - h * 0.035,
        y1 = hy1 + h * 0.005,
        n = 8;
      mb.prism(
        [0, y0, 0],
        [0, y1, 0],
        hr * 0.95,
        hr * 0.97,
        n,
        R.crown,
        PAT.NONE,
        B(1, pvH),
      );
      for (let k = 0; k < n; k += 2) {
        const a = ((k + 0.5) / n) * Math.PI * 2,
          x = Math.cos(a) * hr * 0.94,
          z = Math.sin(a) * hr * 0.94;
        mb.cone(
          [x, y1 - 0.005, z],
          y1 + h * 0.035,
          0.018,
          4,
          R.crown,
          PAT.NONE,
          B(1, pvH),
        );
      }
      mb.prism(
        [0, shY - h * 0.02, 0],
        [0, shY + h * 0.012, 0],
        tw * 1.22,
        tw * 0.75,
        8,
        R.crown,
        PAT.NONE,
        B(0, [0, 0, 0]),
      );
    }
    return { mesh: mb, h };
  }
  // copy a built piece into another buffer, moved into place: f maps a point, fn a direction
  function appendInto(mb, src, f, fn) {
    for (let i = 0; i < src.p.length; i += 3) {
      const q = f(src.p[i], src.p[i + 1], src.p[i + 2]),
        n = fn(src.n[i], src.n[i + 1], src.n[i + 2]);
      mb.p.push(q[0], q[1], q[2]);
      mb.n.push(n[0], n[1], n[2]);
    }
    for (let i = 0; i < src.r.length; i++) {
      mb.r.push(src.r[i]);
      mb.r2.push(src.r2[i]);
      mb.t.push(src.t[i]);
      mb.lv.push(src.lv[i]);
      mb.uv.push(src.uv[i * 2], src.uv[i * 2 + 1]);
    }
    if (mb.bones)
      for (let i = 0; i < src.r.length; i++) {
        mb.b.push(src.bones ? src.b[i] : 0);
        mb.pv.push(0, 0, 0);
      }
  }

  // ---------- houses ----------
  // one building: storeys stacked, each can overhang or step in; a roof on top
