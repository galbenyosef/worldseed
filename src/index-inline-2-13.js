// index-inline-2 13 — math
// Lines 3870-4220 of readable/index-inline-2.pretty.js (statement-aligned).
  function buildRoads(planet, story) {
    const L0 = planet.levels[0],
      g = L0.grid,
      R = planet.body.radiusKm;
    const sea = planet.dials.seaLevel;
    const comp = (cell) => (L0.comp ? L0.comp[cell] : 0);
    const nb8 = new Int32Array(8);
    const towns = story.settlements.map((s) => {
      let cell = g.canon[g.locate(s.dir[0], s.dir[1], s.dir[2])];
      // a harbour's own cell may read as sea at this scale: step ashore
      if (!L0.land[cell]) {
        neighbors8(g, cell, nb8);
        for (const j of nb8)
          if (L0.land[j]) {
            cell = j;
            break;
          }
      }
      return { s, cell };
    });
    // who should be connected: per landmass, a spanning tree plus shortcuts
    const byLand = new Map();
    for (const t of towns) {
      const c = comp(t.cell);
      if (c < 0) continue;
      if (!byLand.has(c)) byLand.set(c, []);
      byLand.get(c).push(t);
    }
    const pairs = [];
    for (const list of byLand.values()) {
      if (list.length < 2) continue;
      const km = (a, b) => rdAngle(a.s.dir, b.s.dir) * R;
      const inTree = new Set([0]);
      const edges = [];
      while (inTree.size < list.length) {
        let best = null;
        for (const i of inTree)
          for (let j = 0; j < list.length; j++) {
            if (inTree.has(j)) continue;
            const d = km(list[i], list[j]);
            if (!best || d < best.d) best = { i, j, d };
          }
        inTree.add(best.j);
        edges.push(best);
      }
      // shortcuts: each town also links to its nearest neighbour it is not yet tied to
      const linked = (i, j) =>
        edges.some((e) => (e.i === i && e.j === j) || (e.i === j && e.j === i));
      for (let i = 0; i < list.length; i++) {
        let best = null;
        for (let j = 0; j < list.length; j++)
          if (j !== i && !linked(i, j)) {
            const d = km(list[i], list[j]);
            if (!best || d < best.d) best = { i, j, d };
          }
        if (best && best.d < 260) edges.push(best);
      }
      for (const e of edges)
        if (e.d < MAX_KM) pairs.push({ a: list[e.i], b: list[e.j], d: e.d });
    }
    pairs.sort((x, y) => x.d - y.d);
    // route each road across the land (A*), preferring ground roads already cross
    const onRoad = new Uint8Array(g.count);
    const cost = new Float64Array(g.count),
      came = new Int32Array(g.count);
    const nb = new Int32Array(8),
      dir = g.dir;
    const cellKm = g.cellKm;
    const stepCost = (i, j) => {
      const x =
        dir[i * 3] * dir[j * 3] +
        dir[i * 3 + 1] * dir[j * 3 + 1] +
        dir[i * 3 + 2] * dir[j * 3 + 2];
      const km = Math.acos(x > 1 ? 1 : x) * R;
      const h0 = L0.elev[i] - sea,
        h1 = L0.elev[j] - sea;
      const slope = Math.abs(h1 - h0) / (km * 1000 + 1);
      const high = Math.max(0, Math.max(h0, h1) - 1800) / 900;
      let k = 1 + slope * 60 + high;
      if (onRoad[j]) k *= 0.55;
      return km * k;
    };
    const roads = [];
    for (const pr of pairs) {
      const start = pr.a.cell,
        goal = pr.b.cell,
        land = comp(start);
      const gx = dir[goal * 3],
        gy = dir[goal * 3 + 1],
        gz = dir[goal * 3 + 2];
      const h = (i) => {
        const x = dir[i * 3] * gx + dir[i * 3 + 1] * gy + dir[i * 3 + 2] * gz;
        return Math.acos(x > 1 ? 1 : x) * R * 0.55;
      };
      cost.fill(Infinity);
      came.fill(-1);
      const heap = new Heap(4096);
      cost[start] = 0;
      heap.push(h(start), start);
      let found = false,
        pops = 0;
      while (heap.n && pops < 400000) {
        const i = heap.pop();
        pops++;
        if (i === goal) {
          found = true;
          break;
        }
        neighbors8(g, i, nb);
        for (let k = 0; k < 8; k++) {
          const j = nb[k];
          if (!L0.land[j] || comp(j) !== land) continue;
          const c = cost[i] + stepCost(i, j);
          if (c < cost[j]) {
            cost[j] = c;
            came[j] = i;
            heap.push(c + h(j), j);
          }
        }
      }
      if (!found) continue;
      const cells = [];
      for (let i = goal; i >= 0; i = came[i]) {
        cells.push(i);
        if (i === start) break;
      }
      cells.reverse();
      for (const c of cells) onRoad[c] = 1;
      // cell centres, with the true town ends
      let pts = cells.map((c) => [dir[c * 3], dir[c * 3 + 1], dir[c * 3 + 2]]);
      pts[0] = Array.from(pr.a.s.dir);
      pts[pts.length - 1] = Array.from(pr.b.s.dir);
      if (pts.length === 1) pts.push(Array.from(pr.b.s.dir));
      roads.push({ a: pr.a.s.id, b: pr.b.s.id, raw: pts });
    }
    // smooth the grid path, then add bends of a few kilometres
    const nz = makeSimplex3(subSeed(planet.seedKey, "roads"));
    const cs =
      story.city && story.city.state !== "fallen"
        ? story.settlements.find((t) => t.id === story.city.town)
        : null;
    const city = cs ? { s: cs, ang: cityAngles(story, cs) } : null;
    for (const rd of roads) {
      let p = rd.raw.map((v) => rdNorm(v));
      for (let it = 0; it < 2 && p.length > 2; it++) {
        const q = [p[0]];
        for (let k = 0; k < p.length - 1; k++) {
          q.push(rdSlerp(p[k], p[k + 1], 0.25), rdSlerp(p[k], p[k + 1], 0.75));
        }
        q.push(p[p.length - 1]);
        p = q;
      }
      // resample at an even spacing, pushing each point sideways by a gentle noise
      const out = [p[0]];
      let along = 0,
        total = 0;
      for (let k = 0; k < p.length - 1; k++)
        total += rdAngle(p[k], p[k + 1]) * R;
      for (let k = 0; k < p.length - 1; k++) {
        const segKm = rdAngle(p[k], p[k + 1]) * R;
        const n = Math.max(1, Math.round(segKm / STEP_KM));
        for (let q = 1; q <= n; q++) {
          const t = q / n,
            v = rdSlerp(p[k], p[k + 1], t);
          along += segKm / n;
          const last = k === p.length - 2 && q === n;
          if (!last) {
            // sideways: perpendicular to the way on the sphere
            const f = rdSlerp(p[k], p[k + 1], Math.min(1, t + 0.01));
            const fw = rdNorm([f[0] - v[0], f[1] - v[1], f[2] - v[2]]);
            const side = rdNorm([
              v[1] * fw[2] - v[2] * fw[1],
              v[2] * fw[0] - v[0] * fw[2],
              v[0] * fw[1] - v[1] * fw[0],
            ]);
            const ends = Math.max(
              0,
              Math.min(1, along / 6, (total - along) / 6),
            );
            const off =
              ((nz(along / 14, rd.a * 7.1, rd.b * 3.3) * 1.6 +
                nz(along / 4.5, rd.b, rd.a) * 0.45) *
                ends) /
              R;
            const w = rdNorm([
              v[0] + side[0] * off,
              v[1] + side[1] * off,
              v[2] + side[2] * off,
            ]);
            // do not wander into the sea
            const idx = g.locate(w[0], w[1], w[2]);
            out.push(L0.land[idx] ? w : v);
          } else out.push(v);
        }
      }
      rd.pts = out;
      // into the great city through one of its gates: the last stretch straight in along an avenue
      if (city && (rd.a === city.s.id || rd.b === city.s.id))
        cityGate(rd, city, R);
      let len = 0;
      for (let k = 0; k < out.length - 1; k++)
        len += rdAngle(out[k], out[k + 1]) * R;
      rd.km = len;
      delete rd.raw;
    }
    // segments, bucketed by latitude and longitude for quick lookups
    const segs = [];
    roads.forEach((rd, ri) => {
      let along = 0;
      for (let k = 0; k < rd.pts.length - 1; k++) {
        const a = rd.pts[k],
          b = rd.pts[k + 1],
          km = rdAngle(a, b) * R;
        const m = rdNorm([a[0] + b[0], a[1] + b[1], a[2] + b[2]]);
        segs.push({ a, b, m, halfKm: km / 2, along, road: ri });
        along += km;
      }
    });
    const bins = new Map();
    for (const sg of segs) {
      const k = binKey(sg.m);
      if (!bins.has(k)) bins.set(k, []);
      bins.get(k).push(sg);
    }
    return { roads, segs, bins, R };
  }
  // A road's end at the great city: which gate it comes in by (the avenue nearest the way it was
  // heading), and a point a way out along that avenue, so it runs straight in through the gate; and no
  // small bends near that end (see roadBend). R in km.
  function cityGate(rd, city, R) {
    const c = city.s.dir,
      atA = rd.a === city.s.id,
      p = rd.pts,
      next = atA ? p[1] : p[p.length - 2];
    let ex = c[2],
      ez = -c[0];
    const L = Math.hypot(ex, ez) || 1;
    ex /= L;
    ez /= L;
    const e = [ex, 0, ez],
      n = [
        c[1] * e[2] - c[2] * e[1],
        c[2] * e[0] - c[0] * e[2],
        c[0] * e[1] - c[1] * e[0],
      ];
    const q = [next[0] - c[0], next[1] - c[1], next[2] - c[2]];
    const lx = rdDot(q, e),
      lz = -rdDot(q, n),
      th = Math.atan2(lz, lx);
    let k = 0,
      bd = 9;
    city.ang.forEach((a, i) => {
      const d = Math.abs(Math.atan2(Math.sin(th - a), Math.cos(th - a)));
      if (d < bd) {
        bd = d;
        k = i;
      }
    });
    const out = 0.26,
      x = Math.cos(city.ang[k]) * out,
      z = Math.sin(city.ang[k]) * out;
    const g = rdNorm([
      c[0] + (e[0] * x - n[0] * z) / R,
      c[1] + (e[1] * x - n[1] * z) / R,
      c[2] + (e[2] * x - n[2] * z) / R,
    ]);
    if (atA) {
      p.splice(1, 0, g);
      rd.gateA = k;
      rd.calmA = 320;
    } else {
      p.splice(p.length - 1, 0, g);
      rd.gateB = k;
      rd.calmB = 320;
    }
  }
  // the small bends at walking scale, calmed near an end that comes into the great city
  const calmK = (m, calm) => {
    const t = (m - calm) / 260;
    return t <= 0 ? 0 : t >= 1 ? 1 : t * t * (3 - 2 * t);
  };
  function roadBend(rd, alongM, seed) {
    let k = 1;
    if (rd && rd.calmA) k = Math.min(k, calmK(alongM, rd.calmA));
    if (rd && rd.calmB) k = Math.min(k, calmK(rd.km * 1000 - alongM, rd.calmB));
    return k > 0 ? fineBend(alongM, seed) * k : 0;
  }
  const BIN = Math.PI / 180; // one degree
  const latOf = (d) => Math.asin(Math.max(-1, Math.min(1, d[1])));
  const lonOf = (d) => Math.atan2(d[0], d[2]);
  function binKey(d) {
    return (
      Math.floor((latOf(d) + Math.PI / 2) / BIN) * 1000 +
      Math.floor((lonOf(d) + Math.PI) / BIN)
    );
  }

  // the segments within reach of a place (km)
  function roadSegsNear(net, dir, km) {
    const out = [];
    const lat = latOf(dir),
      lon = lonOf(dir);
    const reach = (km + 4) / net.R;
    const la0 = Math.floor((lat - reach + Math.PI / 2) / BIN),
      la1 = Math.floor((lat + reach + Math.PI / 2) / BIN);
    const cl = Math.max(0.02, Math.cos(Math.abs(lat) + reach));
    const nLon = Math.min(360, Math.ceil(reach / cl / BIN) + 1);
    const lo = Math.floor((lon + Math.PI) / BIN);
    for (let a = la0; a <= la1; a++)
      for (let b = lo - nLon; b <= lo + nLon; b++) {
        const list = net.bins.get(a * 1000 + (((b % 360) + 360) % 360));
        if (!list) continue;
        for (const s of list)
          if (rdAngle(dir, s.m) * net.R < km + s.halfKm) out.push(s);
      }
    return out;
  }

  // small bends at walking scale, as a sideways offset along a road (metres)
  const wig = (x, s) =>
    Math.sin(x * 1.7 + s) * 0.55 +
    Math.sin(x * 0.63 + s * 2.1) * 0.9 +
    Math.sin(x * 3.9 + s * 0.7) * 0.2;
  function fineBend(alongM, seed) {
    return wig(alongM / 90, seed) * 7;
  }

  // ---- world/sites.js ----
  // ============================================================
  // SITES — the places between towns. The land is cut into cells on the same
  // cube-sphere as the ground. Small cells (about 900 m) may each hold a small
  // thing: a cairn, a standing stone, a wayside shrine, an old camp, a grave, a
  // spring, a hidden stash, old bones. Big cells (about 5.5 km) may each hold a
  // place worth walking to: a farm, a hamlet, a hut, a camp of tents, a ruin, a
  // tower, a ring of stones, a barrow, a hot spring, an ancient tree, an old
  // battlefield, a cairn on a peak. Along the roads: inns about a day apart,
  // and signposts. What a cell holds follows from the ground there, so a place
  // always makes sense where it stands. Deterministic per seed; generated
  // only around you, and remembered.
  // ============================================================

  const SITE_QPI = Math.PI / 4;
  const SMALL_M = 900,
    BIG_M = 5500; // target cell sizes, metres
  const P_SMALL = 0.6,
    P_BIG = 0.74; // how often a cell holds something
  const INN_KM = 24,
    SIGN_KM = 7; // along the roads
  const WATCH_KM = 52; // a watch post on the road, about two days apart
  const _scc = [0, 0, 0];

