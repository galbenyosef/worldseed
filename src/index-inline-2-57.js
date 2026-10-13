// index-inline-2 57 — math
// Lines 21503-21749 of readable/index-inline-2.pretty.js (statement-aligned).
  function coniferProto(g, base, rnd, snow) {
    const mb = new MeshBuf();
    const H = g.h,
      trunkTop = H * 0.6,
      r0 = H / 70;
    const lean = [
      (rnd() - 0.5) * g.lean * H * 0.1,
      0,
      (rnd() - 0.5) * g.lean * H * 0.1,
    ];
    mb.prism(
      [0, -0.55 - r0 * 0.6, 0],
      addv([0, trunkTop, 0], lean),
      r0 * 1.05,
      r0 * 0.5,
      6,
      base + SLOT.BARK,
      PAT.BARK,
    );
    const y0 = H * g.trunk,
      tiers = g.tiers;
    const pat = snow ? PAT.NEEDLE_SNOW : PAT.NEEDLE;
    const o = { row2: base + SLOT.SNOW };
    for (let i = 0; i < tiers; i++) {
      const t0 = i / tiers,
        t1 = (i + 1) / tiers;
      const yb = y0 + (H - y0) * t0 * 0.97,
        yt = Math.min(H, y0 + (H - y0) * (t1 + 0.55 / tiers));
      const tt = 1 - t0; // 1 at the bottom
      let w;
      if (g.shape === "round") w = Math.sqrt(tt) * (1 - 0.35 * tt) * 1.1;
      else if (g.shape === "spire") w = Math.pow(tt, 1.1) * 0.82;
      else w = tt;
      const r = Math.max(
        0.25,
        w * H * g.girth * (g.shape === "layered" ? 0.55 : 0.5),
      );
      const c = lerpv([0, 0, 0], lean, yb / trunkTop);
      mb.cone(
        [c[0], yb, c[2]],
        yt,
        r,
        8,
        base + SLOT.MAIN,
        pat,
        o,
        g.droop * r * 0.35,
        (yt - yb) * 0.3,
        rnd(),
      );
    }
    return {
      mesh: mb,
      cards: [],
      radius: H * g.girth * 0.5,
      kind: "conifer",
      top: H,
      trunkR: r0 * 1.2,
      shearH: Math.max(1.2, r0 * 4),
    };
  }

  function palmProto(g, base, rnd, frondUv) {
    const mb = new MeshBuf();
    const H = g.h,
      top = H * 0.82;
    const az = rnd() * Math.PI * 2,
      bend = g.bend * H * 0.16;
    const tp = (t) => [
      Math.cos(az) * bend * Math.sin((t * Math.PI) / 2) * t,
      t * top,
      Math.sin(az) * bend * Math.sin((t * Math.PI) / 2) * t,
    ];
    const n = 7;
    let v0 = 0;
    mb.prism(
      [0, -0.6, 0],
      tp(0),
      (H / 45) * 1.08,
      H / 45,
      5,
      base + SLOT.BARK,
      PAT.RINGS,
      null,
      0,
      false,
    );
    for (let i = 0; i < n; i++)
      v0 += mb.prism(
        tp(i / n),
        tp((i + 1) / n),
        (H / 45) * (1 - (i / n) * 0.3),
        (H / 45) * (1 - ((i + 1) / n) * 0.3),
        5,
        base + SLOT.BARK,
        PAT.RINGS,
        null,
        v0,
        "top",
      );
    const T = tp(1);
    if (g.fruit)
      for (let k = 0; k < 4; k++) {
        const a = (k / 4) * 6.28;
        mb.box(
          T[0] + Math.cos(a) * 0.25 - 0.12,
          T[1] - 0.55,
          T[2] + Math.sin(a) * 0.25 - 0.12,
          T[0] + Math.cos(a) * 0.25 + 0.12,
          T[1] - 0.3,
          T[2] + Math.sin(a) * 0.25 + 0.12,
          base + SLOT.ACCENT,
        );
      }
    const L = H * g.frond * 0.95;
    const [u0, v0f, u1, v1f] = frondUv;
    for (let i = 0; i < g.fronds; i++) {
      const a = (i / g.fronds) * Math.PI * 2 + rnd() * 0.4;
      const dir = [Math.cos(a), 0, Math.sin(a)],
        side = [-Math.sin(a), 0, Math.cos(a)];
      const len = L * (0.85 + rnd() * 0.3),
        lift = 0.45 + rnd() * 0.25;
      const segs = 6;
      let prevL = null,
        prevR = null,
        prevT = 0;
      for (let s = 0; s <= segs; s++) {
        const t = s / segs;
        const spine = addv(
          T,
          addv(mul(dir, len * t * 0.95), [
            0,
            len * (lift * t - (0.35 + 0.75 * g.droop) * t * t),
            0,
          ]),
        );
        const w =
          len *
            0.17 *
            Math.sin(Math.min(1, t * 1.2 + 0.08) * Math.PI) *
            (1 - t * 0.3) +
          0.05;
        const Lp = addv(spine, addv(mul(side, w), [0, -w * 0.45, 0])),
          Rp = addv(spine, addv(mul(side, -w), [0, -w * 0.45, 0]));
        if (prevL) {
          const ua = u0 + (u1 - u0) * prevT,
            ub = u0 + (u1 - u0) * t,
            vm = (v0f + v1f) / 2;
          const spineP = addv(
            T,
            addv(mul(dir, len * prevT * 0.95), [
              0,
              len * (lift * prevT - (0.35 + 0.75 * g.droop) * prevT * prevT),
              0,
            ]),
          );
          mb.quad(spineP, spine, Lp, prevL, base, PAT.FROND, [
            [ua, vm],
            [ub, vm],
            [ub, v1f],
            [ua, v1f],
          ]);
          mb.quad(prevR, Rp, spine, spineP, base, PAT.FROND, [
            [ua, v0f],
            [ub, v0f],
            [ub, vm],
            [ua, vm],
          ]);
        }
        prevL = Lp;
        prevR = Rp;
        prevT = t;
      }
    }
    return {
      mesh: mb,
      cards: [],
      radius: L * 0.8,
      kind: "palm",
      top: H,
      trunkR: (H / 45) * 1.1,
      shearH: 1.2,
    };
  }

  // a lumpy, faceted rock: a subdivided icosahedron pushed around by noise
  function icosphere() {
    const t = (1 + Math.sqrt(5)) / 2;
    let v = [
      [-1, t, 0],
      [1, t, 0],
      [-1, -t, 0],
      [1, -t, 0],
      [0, -1, t],
      [0, 1, t],
      [0, -1, -t],
      [0, 1, -t],
      [t, 0, -1],
      [t, 0, 1],
      [-t, 0, -1],
      [-t, 0, 1],
    ].map(normv);
    let f = [
      [0, 11, 5],
      [0, 5, 1],
      [0, 1, 7],
      [0, 7, 10],
      [0, 10, 11],
      [1, 5, 9],
      [5, 11, 4],
      [11, 10, 2],
      [10, 7, 6],
      [7, 1, 8],
      [3, 9, 4],
      [3, 4, 2],
      [3, 2, 6],
      [3, 6, 8],
      [3, 8, 9],
      [4, 9, 5],
      [2, 4, 11],
      [6, 2, 10],
      [8, 6, 7],
      [9, 8, 1],
    ];
    const mid = new Map();
    const m = (a, b) => {
      const k = a < b ? a * 64 + b : b * 64 + a;
      if (!mid.has(k)) {
        mid.set(k, v.length);
        v.push(normv(lerpv(v[a], v[b], 0.5)));
      }
      return mid.get(k);
    };
    const f2 = [];
    for (const [a, b, c] of f) {
      const ab = m(a, b),
        bc = m(b, c),
        ca = m(c, a);
      f2.push([a, ab, ca], [b, bc, ab], [c, ca, bc], [ab, bc, ca]);
    }
    return { v, f: f2 };
  }
  // ---------- lights ----------
  // A light fixture, built in its own frame and handed to the caller through T (fixture
  // metres to the caller's: x along, y up, z out from the wall or the way the arm points).
  // Glass and coals (LAMP) glow from dusk; flames on torches and braziers (NIGHTFLAME) are
  // lit only then. Returns where its light comes from, in the caller's metres.
