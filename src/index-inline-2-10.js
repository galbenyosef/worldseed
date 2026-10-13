// index-inline-2 10 — cells
// Lines 3037-3337 of readable/index-inline-2.pretty.js (statement-aligned).
  function components(g, test, minCells) {
    const seen = new Uint8Array(g.count),
      out = [],
      nb = new Int32Array(8);
    const q = new Int32Array(g.real.length);
    for (let r = 0; r < g.real.length; r++) {
      const s = g.real[r];
      if (seen[s] || !test(s)) continue;
      let head = 0,
        tail = 0;
      seen[s] = 1;
      q[tail++] = s;
      while (head < tail) {
        const i = q[head++];
        nb8(g, i, nb);
        for (let k = 0; k < 8; k++) {
          const j = nb[k];
          if (!seen[j] && test(j)) {
            seen[j] = 1;
            q[tail++] = j;
          }
        }
      }
      if (tail >= minCells) out.push(Array.from(q.subarray(0, tail)));
    }
    return out;
  }

  function buildGazetteer(planet) {
    const L1 = planet.levels[1],
      g = L1.grid,
      sea = planet.dials.seaLevel;
    const L0 = planet.levels[0],
      g0 = L0.grid;
    const T = planet.tectonics;
    const R = planet.body.radiusKm;
    const km2 = R * R;
    const places = [];
    const add = (p) => {
      p.id = places.length;
      places.push(p);
      return p;
    };
    const areaOf = (cells) => cells.reduce((s, i) => s + g.area[i], 0) * km2;
    const land = (i) => L1.elev[i] > sea;

    // --- landmasses: reuse the planet's labelling (level 0); find each heartland
    const hearts = new Map();
    for (let q = 0; q < g0.real.length; q++) {
      const i = g0.real[q];
      const c = L0.comp[i];
      if (c < 0) continue;
      const h = hearts.get(c);
      if (!h || L0.coast[i] > h.km) hearts.set(c, { i, km: L0.coast[i] });
    }
    for (const m of planet.landmasses) {
      if (m.kind === "Islet") continue;
      const h = hearts.get(m.id);
      add({
        kind: m.kind === "Continent" ? "continent" : "island",
        landmass: m.id,
        areaKm2: m.areaKm2,
        dir: gDir(g0, h ? h.i : m.anchor),
        peakDir: gDir(g0, m.anchor),
        peakH: m.peak - sea,
      });
    }

    // --- biome regions (deserts, forests, jungles, plains, ice, tundra)
    const regionAt = new Int32Array(g.count).fill(-1);
    const minCells = {
      desert: 10,
      jungle: 10,
      forest: 12,
      taiga: 12,
      plains: 12,
      icecap: 8,
      tundra: 14,
    };
    for (const kind of Object.keys(minCells)) {
      const comps = components(
        g,
        (i) => land(i) && REGION_OF_BIOME[L1.biome[i]] === kind,
        minCells[kind],
      );
      for (const cells of comps) {
        // representative: the cell deepest inside the region (most same-kind neighbours, then central)
        let best = cells[0],
          bestScore = -1;
        const nb = new Int32Array(8);
        for (const i of cells) {
          nb8(g, i, nb);
          let s = 0;
          for (let k = 0; k < 8; k++)
            if (REGION_OF_BIOME[L1.biome[nb[k]]] === kind) s++;
          s += L1.coast[i] / 5000;
          if (s > bestScore) {
            bestScore = s;
            best = i;
          }
        }
        let hot = 0;
        for (const i of cells) hot += L1.temp[i];
        const p = add({
          kind,
          dir: gDir(g, best),
          areaKm2: areaOf(cells),
          cells,
          meanT: hot / cells.length,
        });
        for (const i of cells) regionAt[i] = p.id;
      }
    }

    // --- mountain ranges: high, rugged land
    const rangeAt = new Int32Array(g.count).fill(-1);
    const high = (i) => land(i) && L1.elev[i] - sea > 1700;
    for (const cells of components(g, high, 3)) {
      let top = cells[0];
      for (const i of cells) if (L1.elev[i] > L1.elev[top]) top = i;
      const tect =
        T.mtn[top] > 600
          ? T.btype[T.own.src[top]] === BT.COLLISION
            ? "collision"
            : "arc"
          : "ancient";
      const p = add({
        kind: "range",
        dir: gDir(g, top),
        areaKm2: areaOf(cells),
        cells,
        peakH: L1.elev[top] - sea,
        origin: tect,
      });
      for (const i of cells) rangeAt[i] = p.id;
    }

    // --- volcanoes above water, hotspot island chains
    for (const v of planet.volcanoes) {
      const h = g0.sample(L0.elev, v.dir[0], v.dir[1], v.dir[2]) - sea;
      if (v.kind === "hotspot") {
        const above = v.chain.filter(
          (d) => g0.sample(L0.elev, d[0], d[1], d[2]) > sea,
        );
        if (above.length >= 2)
          add({
            kind: "isles",
            dir: above[0],
            count: above.length,
            active: v.active,
          });
        if (h > 0)
          add({
            kind: "volcano",
            dir: v.dir,
            h,
            active: v.active,
            origin: "hotspot",
          });
      } else if (h > 0) {
        add({
          kind: "volcano",
          dir: v.dir,
          h,
          active: v.active,
          origin: v.kind,
        });
      }
    }

    // --- sea floor: trenches and spreading ridges
    const deep = (i) => !land(i) && L1.elev[i] - sea < -6800;
    for (const cells of components(g, deep, 2)) {
      let bot = cells[0];
      for (const i of cells) if (L1.elev[i] < L1.elev[bot]) bot = i;
      add({
        kind: "trench",
        dir: gDir(g, bot),
        depth: sea - L1.elev[bot],
        areaKm2: areaOf(cells),
      });
    }
    const isRidge = new Uint8Array(g.count),
      isRift = new Uint8Array(g.count);
    for (const s of T.sources) {
      if (T.btype[s] === BT.RIDGE) isRidge[s] = 1;
      else if (T.btype[s] === BT.RIFT) isRift[s] = 1;
    }
    for (const cells of components(g, (i) => isRidge[i] === 1 && !land(i), 8)) {
      add({
        kind: "ridge",
        dir: gDir(g, cells[cells.length >> 1]),
        lengthKm: cells.length * g.cellKm * 0.7,
      });
    }
    for (const cells of components(g, (i) => isRift[i] === 1, 4)) {
      const mid = cells[cells.length >> 1];
      const flooded = cells.filter((i) => !land(i)).length > cells.length * 0.4;
      add({
        kind: flooded ? "riftsea" : "rift",
        dir: gDir(g, mid),
        lengthKm: cells.length * g.cellKm * 0.7,
      });
    }

    // --- oceans: split the sea into basins around its most open water
    const oceanAt = new Int32Array(g.count).fill(-1);
    const waterComps = components(g, (i) => !land(i), 1).sort(
      (a, b) => b.length - a.length,
    );
    const totalWater = waterComps.reduce((s, c) => s + c.length, 0);
    for (const cells of waterComps) {
      const frac = cells.length / totalWater;
      if (frac < 0.0015) continue; // ponds
      if (frac < 0.03) {
        let far = cells[0];
        for (const i of cells) if (L1.coast[i] < L1.coast[far]) far = i;
        const p = add({
          kind: "sea",
          dir: gDir(g, far),
          areaKm2: areaOf(cells),
          enclosed: true,
        });
        for (const i of cells) oceanAt[i] = p.id;
        continue;
      }
      // big water: pick basin centres far from land, well apart
      const sorted = cells.slice().sort((a, b) => L1.coast[a] - L1.coast[b]); // most negative = farthest offshore
      const centres = [];
      const sep = 3600 / R;
      for (const i of sorted) {
        if (centres.length >= 7) break;
        const d = gDir(g, i);
        if (centres.every((c) => angleBetween(c.dir, d) > sep))
          centres.push({ i, dir: d, cells: [] });
      }
      for (const i of cells) {
        const d = gDir(g, i);
        let best = centres[0],
          bd = 9;
        for (const c of centres) {
          const a = angleBetween(c.dir, d);
          if (a < bd) {
            bd = a;
            best = c;
          }
        }
        best.cells.push(i);
      }
      for (const c of centres) {
        const area = areaOf(c.cells);
        const p = add({
          kind: area > 2.2e7 ? "ocean" : "sea",
          dir: c.dir,
          areaKm2: area,
        });
        for (const i of c.cells) oceanAt[i] = p.id;
      }
    }

    return { places, regionAt, rangeAt, oceanAt, grid: g };
  }

  // what a spot on the surface belongs to, nearest named things first
  function placesAround(gaz, planet, dir, limitKm = 900) {
    const g = gaz.grid,
      i = g.locate(dir[0], dir[1], dir[2]);
    const R = planet.body.radiusKm;
    const within = [];
    const rid = gaz.rangeAt[i],
      reg = gaz.regionAt[i],
      oc = gaz.oceanAt[i];
    if (rid >= 0) within.push(gaz.places[rid]);
    if (reg >= 0) within.push(gaz.places[reg]);
    if (oc >= 0) within.push(gaz.places[oc]);
    const near = [];
    for (const p of gaz.places) {
      if (
        !["volcano", "range", "trench", "isles", "rift", "riftsea"].includes(
          p.kind,
        )
      )
        continue;
      const km = angleBetween(p.dir, dir) * R;
      if (km < limitKm && p.id !== rid) near.push({ place: p, km });
    }
    near.sort((a, b) => a.km - b.km);
    return { within, near };
  }

  // ---- world/flora.js ----
  // ============================================================
  // FLORA — every planet grows its own species. A species is a genome: a
  // handful of numbers (trunk, branching, crown, leaf colour, blossoms...)
  // that a painter turns into pixels. Individuals are the species plus a
  // little jitter, so a forest is never a copy-paste. Gravity makes trees
  // taller or squatter; each planet also leans its greens one way, blooms
  // more or less, and sometimes grows mushroom forests.
  // ============================================================

  // which forms can live where, and how thickly (plants per 100 m²)
