// index-inline-2 18 — math
// Lines 6406-6548 of readable/index-inline-2.pretty.js (statement-aligned).
  function caveLerp(P, arr, x, z, out) {
    const fx = x - P.ox,
      fz = z - P.oz;
    let i = Math.floor(fx),
      j = Math.floor(fz);
    if (i < 0 || j < 0 || i >= P.W || j >= P.H) return out;
    if (!P.carved[j * P.W + i]) {
      let best = -1,
        bd = 9;
      for (let dj = -1; dj <= 1; dj++)
        for (let di = -1; di <= 1; di++) {
          const ii = i + di,
            jj = j + dj;
          if (
            ii < 0 ||
            jj < 0 ||
            ii >= P.W ||
            jj >= P.H ||
            !P.carved[jj * P.W + ii]
          )
            continue;
          const d = Math.hypot(ii + 0.5 - fx, jj + 0.5 - fz);
          if (d < bd) {
            bd = d;
            best = jj * P.W + ii;
          }
        }
      if (best < 0) return out;
      i = best % P.W;
      j = (best / P.W) | 0;
    }
    const tx = Math.max(0, Math.min(1, fx - i)),
      tz = Math.max(0, Math.min(1, fz - j)),
      v = j * P.VW + i;
    const a = arr[v],
      b = arr[v + 1],
      c = arr[v + P.VW],
      d = arr[v + P.VW + 1];
    return (a * (1 - tx) + b * tx) * (1 - tz) + (c * (1 - tx) + d * tx) * tz;
  }
  function caveFloor(P, x, z) {
    return caveLerp(P, P.vf, x, z, 0);
  }
  function caveCeil(P, x, z) {
    return caveLerp(P, P.vc, x, z, 3);
  }
  // where a ray along the floor first meets the wall as it is drawn: { x, z, d, tx, tz } (tx, tz along the wall)
  function caveWallHit(P, x, z, dx, dz, maxD = 12) {
    const L = Math.hypot(dx, dz) || 1;
    dx /= L;
    dz /= L;
    let best = null;
    const px = (v) => (v % P.VW) + P.ox + P.vjx[v],
      pz = (v) => Math.floor(v / P.VW) + P.oz + P.vjz[v];
    for (let k = 0; k < P.edges.length; k += 2) {
      const a = P.edges[k],
        b = P.edges[k + 1],
        ax = px(a),
        az = pz(a),
        bx = px(b),
        bz = pz(b);
      if (
        Math.min(ax, bx) > x + maxD ||
        Math.max(ax, bx) < x - maxD ||
        Math.min(az, bz) > z + maxD ||
        Math.max(az, bz) < z - maxD
      )
        continue;
      const ex = bx - ax,
        ez = bz - az,
        den = dx * ez - dz * ex;
      if (Math.abs(den) < 1e-9) continue;
      const t = ((ax - x) * ez - (az - z) * ex) / den,
        u = ((ax - x) * dz - (az - z) * dx) / den;
      if (t < 0 || t > maxD || u < 0 || u > 1) continue;
      if (!best || t < best.d) {
        const el = Math.hypot(ex, ez) || 1;
        best = { x: x + dx * t, z: z + dz * t, d: t, tx: ex / el, tz: ez / el };
      }
    }
    return best;
  }
  // room to stand (or at least stoop) under the roof here?
  function caveHead(P, x, z) {
    return caveCeil(P, x, z) - caveFloor(P, x, z);
  }
  // how far a point is from the wall as it is drawn (only walls within a metre or two are looked at)
  function caveWallDist(P, x, z) {
    const c = P.cellAt(x, z);
    if (c < 0) return 0;
    const list = P.egrid[c];
    if (!list) return 9;
    let best = 9;
    for (const k of list) {
      const a = P.edges[k],
        b = P.edges[k + 1];
      const ax = (a % P.VW) + P.ox + P.vjx[a],
        az = Math.floor(a / P.VW) + P.oz + P.vjz[a];
      const bx = (b % P.VW) + P.ox + P.vjx[b],
        bz = Math.floor(b / P.VW) + P.oz + P.vjz[b];
      const ex = bx - ax,
        ez = bz - az,
        L2 = ex * ex + ez * ez || 1;
      const t = Math.max(0, Math.min(1, ((x - ax) * ex + (z - az) * ez) / L2));
      best = Math.min(best, Math.hypot(x - ax - ex * t, z - az - ez * t));
    }
    return best;
  }
  // inside the hollow as it is drawn? (going east from here, an odd number of walls are crossed)
  function caveInside(P, x, z) {
    const j = Math.floor(z - P.oz);
    if (j < 0 || j >= P.H) return false;
    let n = 0;
    for (const k of P.rowEdges[j]) {
      const a = P.edges[k],
        b = P.edges[k + 1];
      const az = Math.floor(a / P.VW) + P.oz + P.vjz[a],
        bz = Math.floor(b / P.VW) + P.oz + P.vjz[b];
      if (az > z === bz > z) continue;
      const ax = (a % P.VW) + P.ox + P.vjx[a],
        bx = (b % P.VW) + P.ox + P.vjx[b];
      if (ax + ((z - az) * (bx - ax)) / (bz - az) > x) n++;
    }
    return (n & 1) === 1;
  }
  // can you stand here: inside the hollow, and at least r from the wall?
  function caveOpen(P, x, z, r = 0.3) {
    return caveWallDist(P, x, z) >= r && caveInside(P, x, z);
  }

  // ---- the rock as it is drawn ----
  // One smooth skin round the hollow, from a field that is positive in the air and negative in the
  // rock: the walls as they are walked (drawn a little further back in places, never nearer), the
  // floor, and the roof, blended into one another so that a passage is round rather than square,
  // roughened by a slow noise, and closed at the mouth by the day outside. Where the field crosses
  // zero is the face of the rock: a vertex in every cell of a lattice it passes through, a quad
  // across every edge of the lattice it cuts (surface nets), smooth normals from the quads round a
  // vertex. The quads that close the mouth come back on their own (the day is drawn on them).
  const CAVE_DAY_Z = 0.95;
  const smin = (a, b, k) => {
    const h = Math.max(k - Math.abs(a - b), 0) / k;
    return Math.min(a, b) - h * h * k * 0.25;
  };
