// index-inline-2 56 — math
// Lines 21182-21502 of readable/index-inline-2.pretty.js (statement-aligned).
  function grow3D(g, rnd) {
    const segs = [],
      tips = [];
    const lean = (g.lean || 0) * 0.3,
      leanAz = rnd() * Math.PI * 2;
    let p = [0, 0, 0],
      d = normv([
        Math.cos(leanAz) * Math.sin(lean),
        Math.cos(lean),
        Math.sin(leanAz) * Math.sin(lean),
      ]);
    let w = 0.016 + 0.02 * (g.width || 0.7);
    const n = 4,
      tl = g.trunk;
    for (let i = 0; i < n; i++) {
      const j = (g.bend || 0) * 0.25;
      d = normv(addv(d, [(rnd() - 0.5) * j, 0, (rnd() - 0.5) * j]));
      const p2 = addv(p, mul(d, tl / n));
      segs.push({ a: p, b: p2, r0: w, r1: w * 0.9, d: 0 });
      p = p2;
      w *= 0.9;
    }
    const crown = 1 - tl;
    const rec = (p, d, len, w, depth, az0) => {
      if (depth > g.depth) {
        tips.push({ p, len });
        return;
      }
      const k = g.count + (depth > 1 && rnd() < 0.3 ? 1 : 0);
      const [u, v] = perp(d);
      for (let i = 0; i < k; i++) {
        const az = az0 + (i / k) * Math.PI * 2 + (rnd() - 0.5) * 0.6;
        const el = g.spread * (0.75 + rnd() * 0.5);
        let d2 = normv(
          addv(
            mul(d, Math.cos(el)),
            mul(addv(mul(u, Math.cos(az)), mul(v, Math.sin(az))), Math.sin(el)),
          ),
        );
        d2 = normv(lerpv(d2, [0, 1, 0], g.up));
        const l2 = len * (0.75 + rnd() * 0.5);
        const p2 = addv(p, mul(d2, l2));
        const w2 = Math.max(0.004, w * 0.6);
        segs.push({ a: p, b: p2, r0: w, r1: w2, d: depth });
        if (depth < g.depth && rnd() < 0.35)
          tips.push({ p: lerpv(p, p2, 0.55), len: l2 * 0.6, mid: true });
        rec(p2, d2, len * g.ratio, w2, depth + 1, az + 2.4);
      }
    };
    rec(p, d, crown * 0.46, w * 0.85, 1, rnd() * 6.28);
    return { segs, tips, crown };
  }

  // cards: leaf clumps / whole sprites placed around a model (x,y,z,size,anchor,normal)
  function clumpCards(tips, crown, g, rnd, flatK) {
    let cx = 0,
      cy = 0,
      cz = 0;
    for (const t of tips) {
      cx += t.p[0];
      cy += t.p[1];
      cz += t.p[2];
    }
    cx /= tips.length || 1;
    cy /= tips.length || 1;
    cz /= tips.length || 1;
    const r0 = crown * 0.2 * (g.clump || 1);
    const cards = [];
    for (const t of tips) {
      const r = r0 * (t.mid ? 0.72 : 1) * (0.8 + rnd() * 0.4);
      const nrm = normv([
        t.p[0] - cx,
        (t.p[1] - cy) * (1 / flatK) + r0 * 0.6,
        t.p[2] - cz,
      ]);
      cards.push({
        x: t.p[0],
        y: t.p[1],
        z: t.p[2],
        s: r * 2.35,
        nx: nrm[0],
        ny: nrm[1],
        nz: nrm[2],
        v: rnd(),
      });
      // fill the crown's interior so it does not look hollow from below
      if (!t.mid && rnd() < 0.35)
        cards.push({
          x: lerpv(t.p, [cx, cy, cz], 0.5)[0],
          y: lerpv(t.p, [cx, cy, cz], 0.5)[1],
          z: lerpv(t.p, [cx, cy, cz], 0.5)[2],
          s: r * 2.1,
          nx: nrm[0] * 0.5,
          ny: 0.6,
          nz: nrm[2] * 0.5,
          v: rnd(),
        });
    }
    return cards;
  }

  // scale everything so the model is g.h metres tall
  function fitHeight(mb, cards, top, h) {
    const k = h / top;
    for (let i = 0; i < mb.p.length; i++) mb.p[i] *= k;
    for (let i = 0; i < mb.uv.length; i++) mb.uv[i] *= k;
    for (const c of cards) {
      c.x *= k;
      c.y *= k;
      c.z *= k;
      c.s *= k;
    }
    return k;
  }

  // a quad turned to face `want`, whatever order its corners came in
  function quadFacing(mb, pts, want, row, pat, uvs = null, o = null) {
    const n = crossv(sub(pts[1], pts[0]), sub(pts[2], pts[0]));
    if (n[0] * want[0] + n[1] * want[1] + n[2] * want[2] < 0) {
      pts = [pts[3], pts[2], pts[1], pts[0]];
      if (uvs) uvs = [uvs[3], uvs[2], uvs[1], uvs[0]];
    }
    mb.quad(pts[0], pts[1], pts[2], pts[3], row, pat, uvs, o);
  }
  // A root from the foot of a trunk out over the ground and down into it: a fin, tall where it leaves the
  // trunk and running out to nothing under the ground, its ridge narrower than its foot (a buttress).
  // (cx, cz): the trunk's middle; a: which way it runs; R0: the trunk's radius there; reach: how far out from the
  // middle it goes; rise: how far up the trunk it starts; w0: how thick it is at the trunk; hAt(x, z): the ground.
  function rootFinInto(
    mb,
    cx,
    cz,
    a,
    R0,
    reach,
    rise,
    w0,
    hAt,
    row,
    pat,
    o = null,
  ) {
    const ux = Math.cos(a),
      uz = Math.sin(a),
      sx = -uz,
      sz = ux,
      N = 6,
      sec = [];
    for (let i = 0; i <= N; i++) {
      const t = i / N,
        r = R0 * 0.5 + (reach - R0 * 0.5) * t,
        x = cx + ux * r,
        z = cz + uz * r,
        gr = hAt(x, z);
      sec.push({
        x,
        z,
        s: r,
        top: gr + 0.05 + rise * Math.pow(1 - t, 1.7) - 0.32 * t * t,
        bot: gr - 0.4 - 0.3 * t,
        w: w0 * (1 - 0.72 * t),
      });
    }
    const P = (q, sd, k, y) => [
      q.x + sx * sd * q.w * k,
      y,
      q.z + sz * sd * q.w * k,
    ];
    for (let i = 0; i < N; i++) {
      const A = sec[i],
        B = sec[i + 1];
      for (const sd of [-1, 1])
        quadFacing(
          mb,
          [
            P(A, sd, 0.5, A.bot),
            P(B, sd, 0.5, B.bot),
            P(B, sd, 0.2, B.top),
            P(A, sd, 0.2, A.top),
          ],
          [sx * sd, 0.3, sz * sd],
          row,
          pat,
          [
            [A.s, A.bot],
            [B.s, B.bot],
            [B.s, B.top],
            [A.s, A.top],
          ],
          o,
        );
      quadFacing(
        mb,
        [
          P(A, -1, 0.2, A.top),
          P(B, -1, 0.2, B.top),
          P(B, 1, 0.2, B.top),
          P(A, 1, 0.2, A.top),
        ],
        [0, 1, 0],
        row,
        pat,
        [
          [A.s, 0],
          [B.s, 0],
          [B.s, A.w * 0.4],
          [A.s, A.w * 0.4],
        ],
        o,
      );
    }
    // (the far end is under the ground, the near end inside the trunk: neither shows)
    // what it is, for what you bump into (see finTop, and groundview's collide)
    return { ux, uz, r0: R0 * 0.5, reach, rise, w0 };
  }
  // a fin's height over the ground, and how wide it is there (half), at d out from the trunk's middle, or null
  // where there is none (f already in metres; s: what it was scaled by, for its little lift and dip)
  function finAt(f, d, s = 1) {
    if (d < f.r0 || d > f.reach) return null;
    const t = (d - f.r0) / (f.reach - f.r0);
    return {
      h: s * (0.05 - 0.32 * t * t) + f.rise * Math.pow(1 - t, 1.7),
      hw: f.w0 * (1 - 0.72 * t) * 0.42,
    };
  }

  // opts: { trunkSides, branchSides } (an ancient tree, many times the size, wants a rounder trunk)
  function treeProto(g, base, rnd, opts = {}) {
    const mb = new MeshBuf();
    // in 3D a crown is fewer, bigger clumps: two levels of branching at most
    const g3 =
      g.depth > 2 ? { ...g, depth: 2, clump: (g.clump || 1) * 1.3 } : g;
    const { segs, tips, crown } = grow3D(g3, rnd);
    const row = base + SLOT.BARK;
    // (each segment closed at its far end: you never look down into a hollow trunk or branch)
    const tS = opts.trunkSides || 6,
      bS = opts.branchSides || 5;
    for (const s of segs) {
      if (s.d >= 3) continue;
      const sides = s.d === 0 ? tS : s.d === 1 ? bS : 3;
      mb.prism(s.a, s.b, s.r0, s.r1, sides, row, PAT.BARK, null, 0, "top");
    }
    const flatK =
      g.shape === "wide"
        ? 0.75
        : g.shape === "flat"
          ? 0.45
          : g.shape === "tall"
            ? 1.3
            : 1;
    const cards =
      g.form === "snag" ? [] : clumpCards(tips, crown, g3, rnd, flatK);
    let top = 0;
    for (const s of segs) top = Math.max(top, s.b[1]);
    for (const c of cards) top = Math.max(top, c.y + c.s * 0.42);
    const k = fitHeight(mb, cards, top, g.h);
    // the trunk goes on down into the ground, a little wider, so its foot never stands off a slope
    const R0 = segs[0].r0 * k;
    mb.prism(
      [0, -0.55 - R0 * 0.6, 0],
      [0, 0.08, 0],
      R0 * 1.12,
      R0,
      tS,
      row,
      PAT.BARK,
      null,
      0,
      false,
    );
    // a jungle giant's buttress roots: fins from up its trunk, out over the ground and down into it
    // (drawn on flat ground here: where it stands, each is laid over the ground it is on: see groundview's mergeSolids)
    let fins = null,
      finFrom = null,
      finTo = null;
    if (g.buttress) {
      const n = 5,
        a0 = rnd() * Math.PI * 2;
      fins = [];
      finFrom = mb.count;
      for (let q = 0; q < n; q++)
        fins.push(
          rootFinInto(
            mb,
            0,
            0,
            a0 + (q / n) * Math.PI * 2 + (rnd() - 0.5) * 0.5,
            R0,
            R0 * (3.0 + rnd() * 1.2),
            R0 * (2.2 + rnd() * 1.4),
            R0 * 0.7,
            () => 0,
            row,
            PAT.BARK,
          ),
        );
      finTo = mb.count;
    }
    // spread of the crown, for the shadow underneath
    let rad = 0;
    for (const c of cards)
      rad = Math.max(rad, Math.hypot(c.x, c.z) + c.s * 0.35);
    // what you bump into: the trunk (its buttress roots are their own, low where they reach the ground: fins)
    const trunkR = R0 * (g.buttress ? 1.15 : 1.1);
    // shearH: on a slope its foot follows the ground, up to this high (see groundview's mergeSolids)
    return {
      mesh: mb,
      cards,
      radius: Math.max(rad, 0.6),
      kind: "tree",
      droop: g.shape === "droop",
      top: g.h,
      scale: k,
      trunkR,
      fins,
      finFrom,
      finTo,
      shearH: Math.max(1.2, R0 * (g.buttress ? 7 : 3.5)),
    };
  }

