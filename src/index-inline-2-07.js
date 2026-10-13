// index-inline-2 07 — out
// Lines 2073-2422 of readable/index-inline-2.pretty.js (statement-aligned).
  const SUN_WORLD = normalize3([-0.74, 0.3, 0.58]);

  // body -> world rotation for time t: Rtilt · Rspin (row-major 3x3)
  function bodyToWorld(planet, tDays, out = new Float64Array(9)) {
    const th = planet.spinAngle(tDays);
    const e = -planet.body.tiltDeg / DEG;
    const cs = Math.cos(th),
      ss = Math.sin(th),
      ce = Math.cos(e),
      se = Math.sin(e);
    // Rspin about +Y: [cs 0 ss; 0 1 0; -ss 0 cs]
    // Rtilt about +Z: [ce -se 0; se ce 0; 0 0 1]
    out[0] = ce * cs;
    out[1] = -se;
    out[2] = ce * ss;
    out[3] = se * cs;
    out[4] = ce;
    out[5] = se * ss;
    out[6] = -ss;
    out[7] = 0;
    out[8] = cs;
    return out;
  }
  const _w = new Float64Array(9),
    _wt = new Float64Array(9);
  function worldToBody(planet, tDays) {
    bodyToWorld(planet, tDays, _w);
    _wt[0] = _w[0];
    _wt[1] = _w[3];
    _wt[2] = _w[6];
    _wt[3] = _w[1];
    _wt[4] = _w[4];
    _wt[5] = _w[7];
    _wt[6] = _w[2];
    _wt[7] = _w[5];
    _wt[8] = _w[8];
    return _wt;
  }

  // ---------------------------------------------------------------
  // Volcano sites: peaks along arcs and rifts (spaced out), plus each
  // hotspot's chain. Every site becomes one or more Gaussian bumps.
  function pickVolcanoes(planet, g1, T, rng) {
    const R = planet.body.radiusKm,
      heat = planet.body.coreHeat;
    const cands = [];
    for (let q = 0; q < g1.real.length; q++) {
      const i = g1.real[q];
      const v = T.volcanic[i];
      if (v > 0.32)
        cands.push({
          i,
          score: v * (0.6 + (0.4 * ((i * 2654435761) >>> 0)) / 4294967296),
        });
    }
    cands.sort((a, b) => b.score - a.score);
    const minSep = (260 + 200 * (1 - heat)) / R;
    const cap = Math.round(5 + 16 * heat);
    const out = [];
    for (const c of cands) {
      if (out.length >= cap) break;
      const d = [g1.dir[c.i * 3], g1.dir[c.i * 3 + 1], g1.dir[c.i * 3 + 2]];
      if (
        out.some(
          (o) =>
            Math.acos(
              Math.min(1, o.dir[0] * d[0] + o.dir[1] * d[1] + o.dir[2] * d[2]),
            ) < minSep,
        )
      )
        continue;
      const src = T.own.src[c.i];
      const kind = src >= 0 && T.btype[src] === BT.RIFT ? "rift" : "arc";
      const h = (1300 + 1500 * rng.float()) * (0.6 + 0.4 * heat);
      const r = (26 + 16 * rng.float()) / R;
      out.push({
        dir: d,
        kind,
        active: rng.chance(0.35 + 0.5 * heat),
        h,
        bumps: [{ dir: d, h, r }],
      });
    }
    for (const hs of T.hotspots) {
      const bumps = hs.chain.map((c) => ({ dir: c.dir, h: c.h, r: c.r }));
      out.push({
        dir: hs.chain[0].dir,
        kind: "hotspot",
        active: true,
        h: hs.chain[0].h,
        bumps,
        chain: hs.chain.map((c) => c.dir),
      });
    }
    return out;
  }

  function addBumps(elev, g, bumps) {
    if (!bumps.length) return;
    const n = bumps.length;
    const bx = new Float64Array(n),
      by = new Float64Array(n),
      bz = new Float64Array(n),
      bh = new Float64Array(n),
      inv = new Float64Array(n),
      cut = new Float64Array(n);
    bumps.forEach((b, k) => {
      const L = Math.hypot(b.dir[0], b.dir[1], b.dir[2]);
      bx[k] = b.dir[0] / L;
      by[k] = b.dir[1] / L;
      bz[k] = b.dir[2] / L;
      bh[k] = b.h;
      inv[k] = 1 / (b.r * b.r);
      cut[k] = Math.cos(Math.min(1.2, b.r * 3));
    });
    const d = g.dir,
      count = g.count;
    for (let i = 0; i < count; i++) {
      const x = d[i * 3],
        y = d[i * 3 + 1],
        z = d[i * 3 + 2];
      let add = 0;
      for (let k = 0; k < n; k++) {
        const dt = x * bx[k] + y * by[k] + z * bz[k];
        if (dt < cut[k]) continue;
        const a2 = 2 * (1 - dt); // ~ angle^2 for small angles
        add += bh[k] * Math.exp(-a2 * inv[k]);
      }
      if (add) elev[i] += add;
    }
  }

  // per-cell boundary code for overlays: 0 none, else BT type
  function plateBoundaryCodes(g, plate, T, g1) {
    const out = new Uint8Array(g.count),
      S = g.S,
      c = g.canon;
    for (let q = 0; q < g.real.length; q++) {
      const i = g.real[q],
        p = plate[i];
      if (
        plate[c[i + 1]] === p &&
        plate[c[i - 1]] === p &&
        plate[c[i + S]] === p &&
        plate[c[i - S]] === p
      )
        continue;
      const i1 = g1.locate(g.dir[i * 3], g.dir[i * 3 + 1], g.dir[i * 3 + 2]);
      const src = T.own.src[i1];
      out[i] = src >= 0 && T.btype[src] ? T.btype[src] : BT.TRANSFORM;
    }
    for (let i = 0; i < g.count; i++) if (c[i] !== i) out[i] = out[c[i]];
    return out;
  }

  function poolCodes(fine, gF, gC) {
    const out = new Uint8Array(gC.count),
      N = gC.N;
    for (let f = 0; f < 6; f++)
      for (let j = 0; j < N; j++)
        for (let i = 0; i < N; i++) {
          const a = gF.index(f, 2 * i, 2 * j);
          out[gC.index(f, i, j)] =
            fine[a] || fine[a + 1] || fine[a + gF.S] || fine[a + gF.S + 1];
        }
    for (let i = 0; i < gC.count; i++)
      if (gC.canon[i] !== i) out[i] = out[gC.canon[i]];
    return out;
  }

  // ---------------------------------------------------------------
  function now() {
    return typeof performance !== "undefined" ? performance.now() : Date.now();
  }
  function normalize3(v) {
    const L = Math.hypot(v[0], v[1], v[2]);
    return [v[0] / L, v[1] / L, v[2] / L];
  }
  function dirOf(g, idx) {
    return [g.dir[idx * 3], g.dir[idx * 3 + 1], g.dir[idx * 3 + 2]];
  }

  function weightedPercentile(values, g, target) {
    let lo = Infinity,
      hi = -Infinity;
    for (let q = 0; q < g.real.length; q++) {
      const v = values[g.real[q]];
      if (v < lo) lo = v;
      if (v > hi) hi = v;
    }
    const BINS = 4096,
      hist = new Float64Array(BINS);
    const k = (BINS - 1) / (hi - lo);
    let total = 0;
    for (let q = 0; q < g.real.length; q++) {
      const idx = g.real[q];
      hist[((values[idx] - lo) * k) | 0] += g.area[idx];
      total += g.area[idx];
    }
    let acc = 0;
    for (let b = 0; b < BINS; b++) {
      if (acc + hist[b] >= target * total) {
        const f = hist[b] > 0 ? (target * total - acc) / hist[b] : 0;
        return lo + (b + f) / k;
      }
      acc += hist[b];
    }
    return hi;
  }

  // gradient of a scalar field in body space (units per unit-sphere distance)
  function gradientField(field, g) {
    const out = new Float32Array(g.count * 3),
      S = g.S,
      d = g.dir;
    for (let q = 0; q < g.real.length; q++) {
      const i = g.real[q];
      const e = i + 1,
        w = i - 1,
        n = i + S,
        s = i - S;
      const t1x = d[e * 3] - d[w * 3],
        t1y = d[e * 3 + 1] - d[w * 3 + 1],
        t1z = d[e * 3 + 2] - d[w * 3 + 2];
      const t2x = d[n * 3] - d[s * 3],
        t2y = d[n * 3 + 1] - d[s * 3 + 1],
        t2z = d[n * 3 + 2] - d[s * 3 + 2];
      const dh1 = field[e] - field[w],
        dh2 = field[n] - field[s];
      const a11 = t1x * t1x + t1y * t1y + t1z * t1z,
        a22 = t2x * t2x + t2y * t2y + t2z * t2z;
      const a12 = t1x * t2x + t1y * t2y + t1z * t2z;
      const det = a11 * a22 - a12 * a12;
      const a = (dh1 * a22 - dh2 * a12) / det,
        b = (dh2 * a11 - dh1 * a12) / det;
      out[i * 3] = a * t1x + b * t2x;
      out[i * 3 + 1] = a * t1y + b * t2y;
      out[i * 3 + 2] = a * t1z + b * t2z;
    }
    return out;
  }

  function neighbors(g, idx, out) {
    const c = g.canon;
    out[0] = c[idx + 1];
    out[1] = c[idx - 1];
    out[2] = c[idx + g.S];
    out[3] = c[idx - g.S];
    return out;
  }

  // multi-source BFS from the shoreline, in km (+ inland, - offshore)
  function coastDistance(L, g) {
    const n = g.count,
      dist = new Int32Array(n).fill(-1);
    const q = new Int32Array(g.real.length);
    let head = 0,
      tail = 0;
    const nb = [0, 0, 0, 0];
    for (let r = 0; r < g.real.length; r++) {
      const idx = g.real[r];
      neighbors(g, idx, nb);
      const me = L.land[idx];
      if (
        L.land[nb[0]] !== me ||
        L.land[nb[1]] !== me ||
        L.land[nb[2]] !== me ||
        L.land[nb[3]] !== me
      ) {
        dist[idx] = 0;
        q[tail++] = idx;
      }
    }
    while (head < tail) {
      const idx = q[head++];
      neighbors(g, idx, nb);
      const me = L.land[idx],
        dn = dist[idx] + 1;
      for (let k = 0; k < 4; k++) {
        const m = nb[k];
        if (dist[m] < 0 && L.land[m] === me) {
          dist[m] = dn;
          q[tail++] = m;
        }
      }
    }
    const km = g.cellKm;
    for (let r = 0; r < g.real.length; r++) {
      const idx = g.real[r];
      const dd = dist[idx] < 0 ? 9999 : dist[idx];
      L.coast[idx] = (L.land[idx] ? 1 : -1) * (dd + 0.5) * km;
    }
    g.fillApron(L.coast);
  }

  function labelLand(L, g) {
    const comp = L.comp || (L.comp = new Int32Array(g.count));
    comp.fill(-1);
    const q = new Int32Array(g.real.length);
    const nb = [0, 0, 0, 0];
    const list = [];
    let id = 0;
    for (let r = 0; r < g.real.length; r++) {
      const start = g.real[r];
      if (!L.land[start] || comp[start] >= 0) continue;
      let head = 0,
        tail = 0,
        area = 0,
        anchor = start,
        best = -1e9;
      comp[start] = id;
      q[tail++] = start;
      while (head < tail) {
        const idx = q[head++];
        area += g.area[idx];
        if (L.elev[idx] > best) {
          best = L.elev[idx];
          anchor = idx;
        }
        neighbors(g, idx, nb);
        for (let k = 0; k < 4; k++) {
          const m = nb[k];
          if (L.land[m] && comp[m] < 0) {
            comp[m] = id;
            q[tail++] = m;
          }
        }
      }
      list.push({ id, area, anchor, cells: tail, peak: best });
      id++;
    }
    return { list };
  }

  function landform(h, slope, coastKm, land) {
    if (!land) {
      const d = -h;
      if (d < 200) return "Continental shelf";
      if (d < 2800) return "Continental slope";
      if (d > 6500) return "Ocean trench";
      return "Abyssal plain";
    }
    if (h > 4800) return "High peaks";
    if (h > 2600 || (h > 1300 && slope > 0.012)) return "Mountains";
    if (h > 1300) return "Plateau";
    if (h > 500 || slope > 0.008) return "Hills";
    if (coastKm < 80) return "Coastal lowland";
    return "Plains";
  }

