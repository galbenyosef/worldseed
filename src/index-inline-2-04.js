// index-inline-2 04 — math
// Lines 1043-1389 of readable/index-inline-2.pretty.js (statement-aligned).
  function nearestSource(g, sources, allow) {
    const n = g.count,
      dist = new Float32Array(n).fill(1e9),
      src = new Int32Array(n).fill(-1);
    const heap = new Heap(sources.length * 4 + 1024);
    for (const s of sources) {
      dist[s] = 0;
      src[s] = s;
      heap.push(0, s);
    }
    const nb = new Int32Array(8),
      d = g.dir;
    while (heap.n) {
      const i = heap.pop();
      if (heap.lastKey > dist[i]) continue;
      const s = src[i];
      neighbors8(g, i, nb);
      for (let k = 0; k < 8; k++) {
        const j = nb[k];
        if (allow && !allow(i, j)) continue;
        const dj = angle(d, j, s);
        if (dj < dist[j] - 1e-7) {
          dist[j] = dj;
          src[j] = s;
          heap.push(dj, j);
        }
      }
    }
    g.fillApron(dist);
    for (let i = 0; i < n; i++) if (g.canon[i] !== i) src[i] = src[g.canon[i]];
    return { dist, src };
  }

  function gauss(v) {
    return Math.exp(-v * v);
  }
  function cross(a, b) {
    return [
      a[1] * b[2] - a[2] * b[1],
      a[2] * b[0] - a[0] * b[2],
      a[0] * b[1] - a[1] * b[0],
    ];
  }
  function norm(v) {
    const L = Math.hypot(v[0], v[1], v[2]) || 1;
    return [v[0] / L, v[1] / L, v[2] / L];
  }
  function randDir(r) {
    const u = r.float() * 2 - 1,
      t = r.float() * Math.PI * 2,
      s = Math.sqrt(1 - u * u);
    return [s * Math.cos(t), u, s * Math.sin(t)];
  }
  // rotate v about unit axis e by angle a (Rodrigues)
  function rotateAbout(v, e, a) {
    const c = Math.cos(a),
      s = Math.sin(a),
      d = v[0] * e[0] + v[1] * e[1] + v[2] * e[2];
    const cr = cross(e, v);
    return [
      v[0] * c + cr[0] * s + e[0] * d * (1 - c),
      v[1] * c + cr[1] * s + e[1] * d * (1 - c),
      v[2] * c + cr[2] * s + e[2] * d * (1 - c),
    ];
  }

  // ---------------------------------------------------------------
  // Build the plate layout and the tectonic envelopes on grid g1 (N=128).
  // cont1: continent noise (normalised) on g1; returns everything the
  // terrain composer and later the gazetteer/story need.
  function buildTectonics(planet, g1, cont1) {
    const key = planet.seedKey;
    const r = new Rng(subSeed(key, "tectonics"));
    const heat = planet.body.coreHeat;
    const R = planet.body.radiusKm;
    const count = g1.count,
      dir = g1.dir;

    // ---- plates ----
    const K = clamp(Math.round(5 + 13 * heat + r.range(-2, 2)), 4, 20);
    const minSep = 0.85 * Math.sqrt((4 * Math.PI) / K) * 0.55;
    const plates = [];
    let guard = 0;
    while (plates.length < K && guard++ < 4000) {
      const s = randDir(r);
      if (
        plates.every(
          (p) =>
            Math.acos(
              clamp(
                p.seed[0] * s[0] + p.seed[1] * s[1] + p.seed[2] * s[2],
                -1,
                1,
              ),
            ) > minSep,
        )
      ) {
        plates.push({ id: plates.length, seed: s, w: r.range(0, 0.32) });
      }
    }
    const speedScale = 0.45 + 0.9 * heat;
    let continentalCount = 0;
    for (const p of plates) {
      p.pole = randDir(r);
      p.omega = r.range(0.35, 1.0) * speedScale * (r.chance(0.5) ? 1 : -1);
      p.continental = r.chance(0.42);
      if (p.continental) continentalCount++;
      p.bias = p.continental ? r.range(0.07, 0.15) : -r.range(0.06, 0.13);
      p.age = r.float(); // older oceanic plates are denser and sink first
      p.area = 0;
    }
    if (!continentalCount && plates.length) {
      plates[0].continental = true;
      plates[0].bias = 0.12;
    }

    // warp field so boundaries wander like real ones
    const nw1 = makeSimplex3(subSeed(key, "plates/w1")),
      nw2 = makeSimplex3(subSeed(key, "plates/w2")),
      nw3 = makeSimplex3(subSeed(key, "plates/w3"));
    const warpAmp = 0.32;
    const warp = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const x = dir[i * 3],
        y = dir[i * 3 + 1],
        z = dir[i * 3 + 2];
      warp[i * 3] = warpAmp * fbm(nw1, x * 1.6, y * 1.6, z * 1.6, 3);
      warp[i * 3 + 1] = warpAmp * fbm(nw2, x * 1.6, y * 1.6, z * 1.6, 3);
      warp[i * 3 + 2] = warpAmp * fbm(nw3, x * 1.6, y * 1.6, z * 1.6, 3);
    }
    const plate = new Uint8Array(count);
    for (let i = 0; i < count; i++)
      plate[i] = platePick(
        plates,
        dir[i * 3] + warp[i * 3],
        dir[i * 3 + 1] + warp[i * 3 + 1],
        dir[i * 3 + 2] + warp[i * 3 + 2],
      );
    for (let q = 0; q < g1.real.length; q++) {
      const i = g1.real[q];
      plates[plate[i]].area += g1.area[i];
    }

    // crust: continent noise pushed up on continental plates, down on oceanic ones
    const crust = new Float32Array(count);
    for (let i = 0; i < count; i++) crust[i] = cont1[i] + plates[plate[i]].bias;
    const tau = percentile(crust, g1, planet.body.oceanTarget);
    const isCont = (i) => crust[i] > tau;

    // ---- boundaries ----
    const btype = new Uint8Array(count),
      bstr = new Float32Array(count),
      bother = new Int16Array(count).fill(-1);
    const sources = [];
    const nb = new Int32Array(8);
    const vmax = speedScale;
    for (let q = 0; q < g1.real.length; q++) {
      const i = g1.real[q],
        pa = plate[i];
      neighbors8(g1, i, nb);
      let best = -1,
        bestScore = -1,
        bestClose = 0,
        bestRel = 0;
      for (let k = 0; k < 4; k++) {
        const j = nb[k],
          pb = plate[j];
        if (pb === pa) continue;
        const di = [dir[i * 3], dir[i * 3 + 1], dir[i * 3 + 2]];
        const dj = [dir[j * 3], dir[j * 3 + 1], dir[j * 3 + 2]];
        const dot = di[0] * dj[0] + di[1] * dj[1] + di[2] * dj[2];
        const n = norm([
          dj[0] - di[0] * dot,
          dj[1] - di[1] * dot,
          dj[2] - di[2] * dot,
        ]);
        const vA = velocity(plates[pa], di),
          vB = velocity(plates[pb], di);
        const rel = [vA[0] - vB[0], vA[1] - vB[1], vA[2] - vB[2]];
        const close = rel[0] * n[0] + rel[1] * n[1] + rel[2] * n[2];
        const relLen = Math.hypot(rel[0], rel[1], rel[2]);
        const score = Math.abs(close) + 0.3 * relLen;
        if (score > bestScore) {
          bestScore = score;
          best = j;
          bestClose = close;
          bestRel = relLen;
        }
      }
      if (best < 0) continue;
      const pb = plate[best];
      const mine = isCont(i),
        theirs = isCont(best);
      let t;
      if (bestClose > 0.3 * bestRel) {
        if (mine && theirs) t = BT.COLLISION;
        else if (!mine && theirs) t = BT.SUBDUCT;
        else if (mine && !theirs) t = BT.OVERRIDE;
        else t = plates[pa].age > plates[pb].age ? BT.SUBDUCT : BT.OVERRIDE;
      } else if (bestClose < -0.3 * bestRel) {
        t =
          mine && theirs
            ? BT.RIFT
            : !mine && !theirs
              ? BT.RIDGE
              : mine
                ? BT.RIFT
                : BT.RIDGE;
      } else t = BT.TRANSFORM;
      btype[i] = t;
      bstr[i] = clamp(
        (t === BT.TRANSFORM ? bestRel * 0.5 : Math.abs(bestClose)) / vmax,
        0,
        1.4,
      );
      bother[i] = pb;
      sources.push(i);
    }

    // distance from each cell to its own plate's nearest boundary
    const own = nearestSource(g1, sources, (i, j) => plate[i] === plate[j]);
    // distance to the nearest spreading ridge, across any sea floor (sea-floor age)
    const ridgeSrc = sources.filter((i) => btype[i] === BT.RIDGE);
    const ridge = ridgeSrc.length ? nearestSource(g1, ridgeSrc, null) : null;

    // ---- envelopes (metres) ----
    const mtn = new Float32Array(count); // range height before ridged detail
    const add = new Float32Array(count); // smooth additions: trenches, rifts, rises
    const seaFloor = new Float32Array(count); // oceanic depth from sea-floor age
    const volcanic = new Float32Array(count); // 0..1 where arcs/rifts feed volcanoes
    const H = planet.body;
    const young = 0.35 + 0.65 * heat; // erosion: old worlds are worn down
    const colH = (2600 + 5200 * heat) * r.range(0.85, 1.15);
    const arcH = (2000 + 3000 * heat) * r.range(0.85, 1.15);
    const trenchD = 2800 + 3600 * heat;
    for (let i = 0; i < count; i++) {
      const s = own.src[i];
      // sea floor: young and shallow at ridges, old and deep far away
      const dr = ridge ? ridge.dist[i] * R : 9000;
      seaFloor[i] = -2500 - 3000 * Math.sqrt(clamp(dr / 3200, 0, 1));
      if (s < 0) continue;
      const d = own.dist[i] * R; // km
      const t = btype[s],
        k = Math.min(1, bstr[s]);
      if (!t) continue;
      if (t === BT.COLLISION) {
        const w = 260 + 260 * k;
        mtn[i] =
          colH *
          (0.35 + 0.65 * k) *
          (Math.exp(-(d / w) * (d / w)) * 0.8 +
            0.25 * Math.exp(-d / (w * 2.2))) *
          young;
      } else if (t === BT.OVERRIDE) {
        const c = 150 + 60 * k,
          w = 110 + 50 * k;
        const cont = isCont(i);
        const g = Math.exp(-((d - c) / w) * ((d - c) / w));
        mtn[i] = arcH * (0.4 + 0.6 * k) * g * (cont ? 1 : 1.25) * young;
        if (!cont) add[i] += 1400 * g * (0.5 + 0.5 * k); // island arcs need to climb out of deep water
        volcanic[i] = Math.max(volcanic[i], g * (0.4 + 0.6 * k));
        add[i] -= 400 * gauss((d - c - 2.2 * w) / 150) * k; // back-arc basin
      } else if (t === BT.SUBDUCT) {
        add[i] -= trenchD * (0.35 + 0.65 * k) * Math.exp(-(d / 70) * (d / 70));
        add[i] += 350 * k * gauss((d - 190) / 70); // outer rise
      } else if (t === BT.RIDGE) {
        add[i] += 700 * (0.4 + 0.6 * k) * Math.exp(-d / 90); // crest; the rest is sea-floor age
        add[i] -= 350 * (1 - k) * Math.exp(-(d / 18) * (d / 18)); // slow ridges have an axial valley
      } else if (t === BT.RIFT) {
        add[i] -= (900 + 1800 * k) * gauss(d / (45 + 30 * k));
        add[i] += 700 * k * gauss((d - 130) / 70); // rift shoulders
        volcanic[i] = Math.max(volcanic[i], 0.5 * k * gauss(d / 80));
      } else if (t === BT.TRANSFORM) {
        add[i] += 260 * k * Math.sin(d / 12) * Math.exp(-d / 40);
      }
    }

    // ---- hotspots: fixed in the mantle, the plate slides over them ----
    const hotspots = [];
    const nh = Math.round(1 + 5 * heat + r.range(0, 2));
    for (let h = 0; h < nh; h++) {
      const hd = randDir(r);
      const pi = platePick(plates, hd[0], hd[1], hd[2]);
      const p = plates[pi];
      const chain = [];
      const steps = r.int(5, 11),
        stepAng = r.range(0.045, 0.08) * Math.sign(p.omega || 1);
      for (let k = 0; k < steps; k++) {
        // crust that sat over the hotspot k steps ago has since moved downstream
        const pos = rotateAbout(hd, p.pole, stepAng * k);
        chain.push({
          dir: pos,
          h: (3600 + 2400 * heat) * Math.exp(-k / 3.2),
          r: (70 + 30 * Math.exp(-k / 2)) / R,
          age: k,
        });
      }
      hotspots.push({ dir: hd, plate: pi, chain });
    }

    return {
      plates,
      K,
      plate,
      crust,
      tau,
      btype,
      bstr,
      bother,
      own,
      ridge,
      sources,
      mtn,
      add,
      seaFloor,
      volcanic,
      hotspots,
      warp,
      colH,
      arcH,
    };
  }

  function velocity(p, d) {
    const c = cross(p.pole, d);
    return [c[0] * p.omega, c[1] * p.omega, c[2] * p.omega];
  }

  function platePick(plates, x, y, z) {
    const L = Math.hypot(x, y, z) || 1;
    x /= L;
    y /= L;
    z /= L;
    let best = 0,
      bestD = 1e9;
    for (let k = 0; k < plates.length; k++) {
      const s = plates[k].seed;
      const dt = s[0] * x + s[1] * y + s[2] * z;
      const d = Math.acos(dt > 1 ? 1 : dt < -1 ? -1 : dt) - plates[k].w;
      if (d < bestD) {
        bestD = d;
        best = k;
      }
    }
    return best;
  }

