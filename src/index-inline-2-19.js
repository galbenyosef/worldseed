// index-inline-2 19 — math
// Lines 6549-6886 of readable/index-inline-2.pretty.js (statement-aligned).
  function caveSurface(P, S = 0.42) {
    const n3 = makeSimplex3((P.seed ^ 0x3c0a7) >>> 0);
    // ZC: from here out the passage runs straight; ZP: the day closes it. AW, AC: how far the walls
    // and the roof are drawn back into the rock at most; KF: how round the foot of a wall is
    const ZC = 0.2,
      ZP = CAVE_DAY_Z,
      AW = 0.34,
      AC = 0.45,
      KF = 0.8;
    // (a wall stays as it is walked where something is painted on it or shows through it)
    const calm = P.things
      .filter((t) => t.t === "painting" || t.t === "ore")
      .map((t) => [t.t === "ore" ? t.sx : t.x, t.t === "ore" ? t.sz : t.z]);
    const calmK = (x, z) => {
      let m = 1;
      for (const [px, pz] of calm) {
        const d = Math.hypot(x - px, z - pz);
        if (d < 2.6) m = Math.min(m, Math.max(0, (d - 1.3) / 1.3));
      }
      return m;
    };
    // the 2D part, for a column: signed distance to the wall as walked (+ in the hollow), floor, roof
    const column = (x, z, out) => {
      const zz = Math.min(z, ZC);
      if (P.cellAt(x, zz) < 0) {
        out.d = -3;
        return out;
      }
      const w = Math.min(3, caveWallDist(P, x, zz));
      out.d = caveInside(P, x, zz) ? w : -w;
      out.f = caveFloor(P, x, zz);
      out.c = caveCeil(P, x, zz);
      out.k = Math.max(0.3, Math.min(1.5, 0.48 * (out.c - out.f)));
      out.m = calm.length ? calmK(x, z) : 1;
      return out;
    };
    const wallN = (x, y, z) =>
      0.5 +
      0.36 * n3(x * 0.45, y * 0.62, z * 0.45) +
      0.14 * n3(x * 1.35 + 5.1, y * 1.35, z * 1.35 - 2.7);
    const roofN = (x, y, z) =>
      0.5 +
      0.36 * n3(x * 0.33 + 9.2, y * 0.25, z * 0.33) +
      0.14 * n3(x * 1.1, y * 0.9 - 4.4, z * 1.1);
    // at the mouth, beyond where you can walk (you are out by then), a rim of rock round an arch
    // about the shape of the one outside, and the day through it
    const MW = Math.max(
        1.45,
        Math.min(1.9, ((P.mouth && P.mouth.w) || 3.6) / 2 - 0.1),
      ),
      MH = Math.max(2.3, Math.min(2.75, ((P.mouth && P.mouth.h) || 3.0) - 0.4)),
      MF = caveFloor(P, 0, 0.2);
    const rimF = (x, y, z) => {
      const t = Math.min(1, Math.abs(x) / MW),
        ya = MF + MH * Math.pow(1 - Math.pow(t, 2.2), 1 / 2.2);
      return Math.max(Math.min(MW - Math.abs(x), ya - y), (0.5 - z) * 4);
    };
    const fieldOf = (q, x, y, z, exact) => {
      const nw = q.m * (0.06 + AW * (exact ? wallN(x, y, z) : 0.5)),
        nc = 0.04 + AC * (exact ? roofN(x, y, z) : 0.5);
      const F = smin(smin(q.d + nw, y - q.f, KF), q.c + nc - y, q.k);
      return z > 0.3 ? Math.min(F, rimF(x, y, z)) : F;
    };
    // anywhere: what is there (for setting things down on the rock as it is drawn)
    const q0 = { d: 0, f: 0, c: 0, k: 1, m: 1 };
    const field = (x, y, z) => {
      column(x, z, q0);
      return q0.d <= -2.5 ? -1 : Math.min(fieldOf(q0, x, y, z, true), ZP - z);
    };
    // ---- the lattice ----
    const x0 = P.ox,
      z0 = P.oz,
      NX = Math.floor(P.W / S) + 1,
      NZ = Math.floor(P.H / S) + 1;
    let yLo = 1e9,
      yHi = -1e9;
    for (let k = 0; k < P.W * P.H; k++)
      if (P.carved[k]) {
        yLo = Math.min(yLo, P.fl[k]);
        yHi = Math.max(yHi, P.fl[k] + P.ch[k]);
      }
    yLo -= 1.6;
    yHi += AC + 1.6;
    const NY = Math.ceil((yHi - yLo) / S) + 1,
      NXY = NX * NY;
    const cols = new Array(NX * NZ);
    for (let k = 0; k < NZ; k++)
      for (let i = 0; i < NX; i++) {
        const q = column(x0 + i * S, z0 + k * S, {
          d: 0,
          f: 0,
          c: 0,
          k: 1,
          m: 1,
        });
        cols[k * NX + i] = q.d < -1.2 ? null : q;
      }
    let V = new Float32Array(NXY * NZ).fill(-1),
      cap = new Uint8Array(NXY * NZ);
    for (let k = 0; k < NZ; k++)
      for (let i = 0; i < NX; i++) {
        const q = cols[k * NX + i];
        if (!q) continue;
        const x = x0 + i * S,
          z = z0 + k * S;
        const ja = Math.max(0, Math.floor((q.f - 2.2 * S - 0.4 - yLo) / S)),
          jb = Math.min(
            NY - 1,
            Math.ceil((q.c + AC + 2.2 * S + 0.4 - yLo) / S),
          );
        for (let j = ja; j <= jb; j++) {
          const y = yLo + j * S;
          // far from the face the noise cannot change which side of it you are on
          let F = fieldOf(q, x, y, z, false);
          if (Math.abs(F) < 0.8) F = fieldOf(q, x, y, z, true);
          const o = k * NXY + j * NX + i;
          if (z > ZP && F > 0) cap[o] = 1;
          V[o] = Math.max(-1, Math.min(1.5, Math.min(F, ZP - z)));
        }
      }
    // ---- a vertex in each cell the face passes through ----
    const CX = NX - 1,
      CY = NY - 1,
      CXY = CX * CY;
    let vid = new Int32Array(CXY * (NZ - 1)).fill(-1);
    const pos = [];
    const OFF = [
      [0, 0, 0],
      [1, 0, 0],
      [0, 1, 0],
      [1, 1, 0],
      [0, 0, 1],
      [1, 0, 1],
      [0, 1, 1],
      [1, 1, 1],
    ];
    const EDGES = [
      [0, 1],
      [2, 3],
      [4, 5],
      [6, 7],
      [0, 2],
      [1, 3],
      [4, 6],
      [5, 7],
      [0, 4],
      [1, 5],
      [2, 6],
      [3, 7],
    ];
    const cv = new Float32Array(8);
    for (let k = 0; k < NZ - 1; k++)
      for (let i = 0; i < NX - 1; i++) {
        if (
          !cols[k * NX + i] &&
          !cols[k * NX + i + 1] &&
          !cols[(k + 1) * NX + i] &&
          !cols[(k + 1) * NX + i + 1]
        )
          continue;
        for (let j = 0; j < NY - 1; j++) {
          let mask = 0;
          for (let c = 0; c < 8; c++) {
            const o = OFF[c];
            const v = V[(k + o[2]) * NXY + (j + o[1]) * NX + i + o[0]];
            cv[c] = v;
            if (v > 0) mask |= 1 << c;
          }
          if (mask === 0 || mask === 255) continue;
          let sx = 0,
            sy = 0,
            sz = 0,
            n = 0;
          for (const [a, b] of EDGES) {
            if (cv[a] > 0 === cv[b] > 0) continue;
            const t = cv[a] / (cv[a] - cv[b]),
              A = OFF[a],
              B = OFF[b];
            sx += A[0] + (B[0] - A[0]) * t;
            sy += A[1] + (B[1] - A[1]) * t;
            sz += A[2] + (B[2] - A[2]) * t;
            n++;
          }
          vid[k * CXY + j * CX + i] = pos.length / 3;
          pos.push(
            x0 + (i + sx / n) * S,
            yLo + (j + sy / n) * S,
            z0 + (k + sz / n) * S,
          );
        }
      }
    // ---- a quad across each edge the face cuts, turned to face the air ----
    const nv = pos.length / 3,
      nrm = new Float32Array(nv * 3),
      idx = [],
      day = [];
    const cell = (i, j, k) => vid[k * CXY + j * CX + i];
    const quad = (a, b, c, d, ax, sgn, isDay) => {
      if (a < 0 || b < 0 || c < 0 || d < 0) return;
      const P3 = (v) => [pos[v * 3], pos[v * 3 + 1], pos[v * 3 + 2]];
      const A = P3(a),
        B = P3(b),
        C = P3(c),
        D = P3(d);
      const e1 = [C[0] - A[0], C[1] - A[1], C[2] - A[2]],
        e2 = [D[0] - B[0], D[1] - B[1], D[2] - B[2]];
      let nx = e1[1] * e2[2] - e1[2] * e2[1],
        ny = e1[2] * e2[0] - e1[0] * e2[2],
        nz = e1[0] * e2[1] - e1[1] * e2[0];
      // (wound so its front faces the air: the axis it crosses, the way the air lies)
      const along = ax === 0 ? nx : ax === 1 ? ny : nz;
      let q = [a, b, c, d];
      if (along * sgn < 0) {
        q = [a, d, c, b];
        nx = -nx;
        ny = -ny;
        nz = -nz;
      }
      if (isDay) {
        day.push(P3(q[0]), P3(q[1]), P3(q[2]), P3(q[3]));
        return;
      }
      for (const v of q) {
        nrm[v * 3] += nx;
        nrm[v * 3 + 1] += ny;
        nrm[v * 3 + 2] += nz;
      }
      idx.push(q[0], q[1], q[2], q[0], q[2], q[3]);
    };
    for (let k = 1; k < NZ - 1; k++)
      for (let i = 1; i < NX - 1; i++) {
        if (
          !cols[k * NX + i] &&
          !cols[k * NX + i + 1] &&
          !cols[(k + 1) * NX + i]
        )
          continue;
        for (let j = 1; j < NY - 1; j++) {
          const o = k * NXY + j * NX + i,
            a = V[o] > 0;
          // the air on the near end faces back along the axis; on the far end, forwards
          if (a !== V[o + 1] > 0)
            quad(
              cell(i, j - 1, k - 1),
              cell(i, j, k - 1),
              cell(i, j, k),
              cell(i, j - 1, k),
              0,
              a ? -1 : 1,
              false,
            );
          if (a !== V[o + NX] > 0)
            quad(
              cell(i - 1, j, k - 1),
              cell(i, j, k - 1),
              cell(i, j, k),
              cell(i - 1, j, k),
              1,
              a ? -1 : 1,
              false,
            );
          if (a !== V[o + NXY] > 0)
            quad(
              cell(i - 1, j - 1, k),
              cell(i, j - 1, k),
              cell(i, j, k),
              cell(i - 1, j, k),
              2,
              a ? -1 : 1,
              a && cap[o + NXY] === 1,
            );
        }
      }
    for (let v = 0; v < nv; v++) {
      const L = Math.hypot(nrm[v * 3], nrm[v * 3 + 1], nrm[v * 3 + 2]) || 1;
      nrm[v * 3] /= L;
      nrm[v * 3 + 1] /= L;
      nrm[v * 3 + 2] /= L;
    }
    // darker in the folds: how much air there is a little way out from the rock (the field, read
    // back off the lattice), against how much there would be in the open
    const Vat = (x, y, z) => {
      const fx = (x - x0) / S,
        fy = (y - yLo) / S,
        fz = (z - z0) / S,
        i = Math.floor(fx),
        j = Math.floor(fy),
        k = Math.floor(fz);
      if (i < 0 || j < 0 || k < 0 || i >= NX - 1 || j >= NY - 1 || k >= NZ - 1)
        return -1;
      const tx = fx - i,
        ty = fy - j,
        tz = fz - k,
        o = k * NXY + j * NX + i;
      const a = V[o] + (V[o + 1] - V[o]) * tx,
        b = V[o + NX] + (V[o + NX + 1] - V[o + NX]) * tx;
      const c = V[o + NXY] + (V[o + NXY + 1] - V[o + NXY]) * tx,
        d = V[o + NXY + NX] + (V[o + NXY + NX + 1] - V[o + NXY + NX]) * tx;
      return (a + (b - a) * ty) * (1 - tz) + (c + (d - c) * ty) * tz;
    };
    const ao = new Float32Array(nv);
    for (let v = 0; v < nv; v++) {
      const px = pos[v * 3],
        py = pos[v * 3 + 1],
        pz = pos[v * 3 + 2],
        nx = nrm[v * 3],
        ny = nrm[v * 3 + 1],
        nz = nrm[v * 3 + 2];
      const a = Vat(px + nx * 0.7, py + ny * 0.7, pz + nz * 0.7) / 0.7,
        b = Vat(px + nx * 1.6, py + ny * 1.6, pz + nz * 1.6) / 1.6;
      ao[v] = -0.9 * (1 - Math.max(0, Math.min(1, Math.min(a, b) * 1.15)));
    }
    // (the lattice is not kept: what is handed back only reads the field afresh)
    V = cap = vid = null;
    // the floor as it is drawn, at or a little above the floor as it is walked
    const floorAt = (x, z) => {
      let y = caveFloor(P, x, z);
      for (let t = 0; t < 14 && field(x, y + 0.04, z) <= 0; t++) y += 0.06;
      return y;
    };
    return {
      pos: new Float32Array(pos),
      nrm,
      ao,
      idx: nv > 65535 ? new Uint32Array(idx) : new Uint16Array(idx),
      day,
      field,
      floorAt,
    };
  }

  // ---- story/lang.js ----
  // ============================================================
  // LANGUAGES — every people names its world in its own sound.
  // A style is a pool of sounds; each people draws its own subset plus a
  // few signature endings, so two desert tribes still sound like cousins.
  // ============================================================

