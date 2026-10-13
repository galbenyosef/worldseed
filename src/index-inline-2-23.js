// index-inline-2 23 — planet
// Lines 7766-8151 of readable/index-inline-2.pretty.js (statement-aligned).
  function buildStory(planet, opts = {}) {
    const key = planet.seedKey,
      R = planet.body.radiusKm;
    const r = (name) => new Rng(subSeed(key, "story/" + name));
    const gaz = buildGazetteer(planet);
    const places = gaz.places;
    const byKind = (k) => places.filter((p) => p.kind === k);
    const L1 = planet.levels[1],
      g1 = L1.grid,
      sea = planet.dials.seaLevel;
    const L0 = planet.levels[0],
      g0 = L0.grid;
    const landmassAt = (d) => {
      const i = g0.locate(d[0], d[1], d[2]);
      return L0.land[i] ? L0.comp[g0.canon[i]] : -1;
    };
    const old = new Language(subSeed(key, "lang/old"), "old"); // the tongue of the first people, for seas and deeps

    // ---------- 1. peoples ----------
    const pr = r("peoples");
    const candidates = [];
    const regionKinds = [
      "desert",
      "jungle",
      "forest",
      "taiga",
      "tundra",
      "icecap",
      "plains",
      "range",
    ];
    for (const p of places) {
      if (!regionKinds.includes(p.kind)) continue;
      const lm = landmassAt(p.dir);
      if (lm < 0) continue;
      const arch = REGION_ARCHETYPE[p.kind];
      const weight =
        (p.areaKm2 || 3e5) *
        (arch === "frost" && p.kind === "icecap" ? 0.25 : 1) *
        (arch === "stone" ? 2.2 : 1);
      candidates.push({ arch, lm, region: p, weight });
    }
    for (const v of byKind("volcano")) {
      if (!v.active) continue;
      const lm = landmassAt(v.dir);
      if (lm >= 0)
        candidates.push({ arch: "ash", lm, region: v, weight: 2.5e6 });
    }
    // warm coasts of big landmasses -> reef folk
    for (const c of byKind("continent").concat(byKind("island"))) {
      const t = g1.sample(L1.temp, c.peakDir[0], c.peakDir[1], c.peakDir[2]);
      if (t > 16)
        candidates.push({
          arch: "reef",
          lm: c.landmass,
          region: c,
          weight: (c.areaKm2 || 1e6) * 0.35,
        });
    }
    for (const s of byKind("isles")) {
      const lm = landmassAt(s.dir);
      candidates.push({ arch: "isle", lm, region: s, weight: 2e6 });
    }
    // islands without any other candidates become sailor homelands
    candidates.sort((a, b) => b.weight - a.weight);
    const habitableFrac =
      1 - planet.stats.oceanFrac - planet.stats.iceFrac * 0.8;
    const maxPeoples = Math.max(
      2,
      Math.min(7, Math.round(2 + habitableFrac * 9)),
    );
    const peoples = [];
    const perLand = new Map();
    for (const c of candidates) {
      if (peoples.length >= maxPeoples) break;
      const n = perLand.get(c.lm) || 0;
      if (n >= 3) continue;
      if (peoples.some((p) => p.arch === c.arch)) continue;
      perLand.set(c.lm, n + 1);
      peoples.push({
        arch: c.arch,
        lm: c.lm,
        region: c.region,
        home: c.region.dir,
      });
    }
    if (!peoples.length && candidates.length)
      peoples.push({
        arch: candidates[0].arch,
        lm: candidates[0].lm,
        region: candidates[0].region,
        home: candidates[0].region.dir,
      });
    peoples.forEach((p, i) => {
      const A = ARCHETYPES[p.arch];
      const lr = new Rng(subSeed(key, "people/" + i));
      p.id = i;
      p.lang = new Language(subSeed(key, "lang/" + i), A.style);
      p.word = p.lang.word(lr, 1, 2);
      p.name = fill(lr.pick(PEOPLE_TITLES[p.arch]), { N: p.word });
      p.plural = lr.pick(A.plural);
      p.homes = lr.pick(A.homes);
      p.craft = lr.pick(A.crafts);
      p.faith = lr.pick(A.faiths);
      p.beast = lr.pick(A.beasts);
      p.virtue = lr.pick(A.virtues);
      p.mood = A.mood;
      p.roles = A.roles;
    });
    // rivals: the nearest other people
    for (const p of peoples) {
      let best = null,
        bd = 9;
      for (const q of peoples) {
        if (q === p) continue;
        const a = angleBetween(p.home, q.home);
        if (a < bd) {
          bd = a;
          best = q;
        }
      }
      p.rival = best ? best.id : -1;
    }
    const ownerOf = (d) => {
      if (!peoples.length) return null;
      const lm = landmassAt(d);
      let best = null,
        bd = 9;
      for (const p of peoples) {
        const a = angleBetween(p.home, d) * (p.lm === lm ? 1 : 2.2);
        if (a < bd) {
          bd = a;
          best = p;
        }
      }
      return bd * R < 4200 ? best : null;
    };

    // ---------- 2. names for places ----------
    const nr = r("placenames");
    for (const p of places) {
      const inhabited = !["ocean", "sea", "trench", "ridge"].includes(p.kind);
      const owner = inhabited ? ownerOf(p.dir) : null;
      const lang = owner ? owner.lang : old;
      const word = lang.nameFor(`${key}/place/${p.id}`, 2, 3);
      const forms = PLACE_NAMES[p.kind] || ["{N}"];
      p.name = fill(forms[hashInt(p.id, 7) % forms.length], { N: word });
      p.owner = owner ? owner.id : -1;
      if (p.kind === "range")
        p.peakName = "Mt. " + lang.nameFor(`${key}/peak/${p.id}`, 2, 2);
    }
    // landmasses keep one name everywhere in the app
    for (const p of places) {
      if (p.kind === "continent" || p.kind === "island") {
        const m = planet.landById.get(p.landmass);
        if (m) m.name = p.name.replace(/^the /, "");
      }
    }
    // headline landmarks: tallest peak and deepest point get their gazetteer names
    const hi = planet.stats.highest,
      lo = planet.stats.deepest;
    const nearestOf = (kinds, d, maxKm) => {
      let best = null,
        bd = 9;
      for (const p of places)
        if (kinds.includes(p.kind)) {
          const a = angleBetween(p.dir, d);
          if (a < bd) {
            bd = a;
            best = p;
          }
        }
      return best && bd * R < maxKm ? best : null;
    };
    const hiPlace =
      nearestOf(["volcano"], hi.dir, 120) || nearestOf(["range"], hi.dir, 400);
    if (hiPlace)
      hi.name = hiPlace.kind === "volcano" ? hiPlace.name : hiPlace.peakName;
    const loPlace = nearestOf(["trench"], lo.dir, 500);
    if (loPlace)
      lo.name = loPlace.name.replace(/^the /, "").replace(/ Trench$/, " Deep");

    // ---------- 3. settlements ----------
    const sr = r("settlements");
    const cands = [];
    for (let q = 0; q < g1.real.length; q++) {
      const i = g1.real[q];
      const h = L1.elev[i] - sea;
      if (h <= 0) continue;
      const T = L1.temp[i],
        P = L1.precip[i],
        bio = L1.biome[i];
      if (bio === B.ICE || T < -6) continue;
      const tz = (T - 17) / 13;
      let s =
        Math.exp(-tz * tz) *
        Math.min(1, Math.max(0.12, (P - 120) / 700)) *
        (1 - Math.min(1, Math.max(0, (h - 1800) / 1800)) * 0.75);
      s += 0.35 * Math.exp(-L1.coast[i] / 120);
      if (bio === B.DESERT || bio === B.COLDDESERT) s *= 0.55;
      cands.push({ i, s: s * (0.65 + 0.35 * sr.float()) });
    }
    cands.sort((a, b) => b.s - a.s);
    const landArea = (1 - planet.stats.oceanFrac) * 4 * Math.PI * R * R;
    const target = Math.max(5, Math.min(30, Math.round(landArea / 3.6e6)));
    const minSep = Math.max(220, Math.sqrt(landArea / target) * 0.62) / R;
    const settlements = [];
    for (const c of cands) {
      if (settlements.length >= target) break;
      let d = [g1.dir[c.i * 3], g1.dir[c.i * 3 + 1], g1.dir[c.i * 3 + 2]];
      if (settlements.some((s) => angleBetween(s.dir, d) < minSep)) continue;
      // the coarse grid can put a town's middle out in the water: find dry ground for it close by, or none
      d = dryTownSpot(planet, d);
      if (!d) continue;
      const owner = ownerOf(d);
      const h = L1.elev[c.i] - sea;
      const coastKm = L1.coast[c.i];
      const type =
        h > 1900
          ? sr.chance(0.5)
            ? "monastery"
            : "outpost"
          : coastKm < 90 && sr.chance(0.45)
            ? "port"
            : c.s < 0.45
              ? "village"
              : "town";
      settlements.push({
        id: settlements.length,
        dir: d,
        cell: c.i,
        owner: owner ? owner.id : -1,
        type,
        score: c.s,
        elev: h,
        coastKm,
      });
    }
    // one capital per people: its best-scoring town
    for (const p of peoples) {
      const own = settlements.filter((s) => s.owner === p.id);
      if (!own.length) continue;
      own.sort((a, b) => b.score - a.score);
      own[0].type = "capital";
      p.capital = own[0].id;
    }
    for (const s of settlements) {
      const owner = s.owner >= 0 ? peoples[s.owner] : null;
      const lang = owner ? owner.lang : old;
      const word = lang.nameFor(`${key}/town/${s.id}`, 2, 3);
      const forms = SETTLEMENT_FORMS[s.type];
      s.name = fill(forms[hashInt(s.id, 3) % forms.length], { N: word });
      const pr2 = new Rng(subSeed(key, "pop/" + s.id));
      s.population =
        Math.round(
          {
            capital: pr2.range(40, 160) * 1000,
            town: pr2.range(4, 30) * 1000,
            port: pr2.range(3, 25) * 1000,
            village: pr2.range(150, 2500),
            monastery: pr2.range(30, 300),
            outpost: pr2.range(20, 200),
          }[s.type] / 10,
        ) * 10;
      s.people = owner ? owner.name : "no one in particular";
    }

    // helpers to find things for the story
    const settleOf = (pid) => settlements.filter((s) => s.owner === pid);
    const capitalOf = (p) =>
      p && p.capital !== undefined ? settlements[p.capital] : settlements[0];
    const pick = (rng, arr) =>
      arr.length
        ? arr[Math.floor(rng.float() * arr.length) % arr.length]
        : null;
    const biggest = (kinds) =>
      places
        .filter((p) => kinds.includes(p.kind))
        .sort((a, b) => (b.areaKm2 || 0) - (a.areaKm2 || 0))[0] || null;
    const facts = {
      world: planet.seedText,
      oceanFrac: planet.stats.oceanFrac,
      iceFrac: planet.stats.iceFrac,
      meanT: planet.stats.meanTemp,
      field: planet.body.magneticField,
      heat: planet.body.coreHeat,
      age: planet.body.ageGyr,
      day: planet.body.dayHours,
      volcanoes: byKind("volcano"),
      activeVolcanoes: byKind("volcano").filter((v) => v.active),
      trenches: byKind("trench").sort((a, b) => b.depth - a.depth),
      ranges: byKind("range").sort((a, b) => b.peakH - a.peakH),
      jungle: biggest(["jungle"]),
      forest: biggest(["forest", "taiga"]),
      desert: biggest(["desert"]),
      ice: biggest(["icecap"]),
      ocean: biggest(["ocean", "sea"]),
      isles: byKind("isles"),
      rifts: byKind("rift").concat(byKind("riftsea")),
    };

    // ---------- 4. the main arc ----------
    const ar = r("arc");
    const arc = buildArc(
      ar,
      facts,
      peoples,
      settlements,
      places,
      capitalOf,
      settleOf,
      pick,
      planet,
      old,
      ownerOf,
    );

    // ---------- 4b. the great city ----------
    const city = buildCity(
      r("city"),
      arc,
      peoples,
      settlements,
      planet,
      old,
      key,
      opts.city,
    );

    // ---------- 5. history ----------
    const hr = r("history");
    const history = buildHistory(
      hr,
      facts,
      peoples,
      places,
      settlements,
      arc,
      pick,
    );

    // ---------- 6. side tales ----------
    const tr = r("tales");
    const tales = buildTales(
      tr,
      facts,
      peoples,
      settlements,
      places,
      gaz,
      planet,
      arc,
    );

    const story = {
      gaz,
      places,
      peoples,
      settlements,
      arc,
      history,
      tales,
      old,
      city,
      seedHash: subSeed(planet.seedKey, "towns"),
    };
    story.opening = (dir, tDays, difficulty) =>
      buildOpening(planet, story, dir, tDays, difficulty);
    // the other beginnings: fished out of the sea, through someone's roof, among herders (info: the place it happens at)
    story.beginning = (kind, info, tDays, difficulty) =>
      buildBeginning(planet, story, kind, info, tDays, difficulty);
    story.around = (dir) => describeAround(planet, story, dir);
    story.clock = (tDays) => arcClock(arc, tDays);
    story.landing = (difficulty) => chooseLanding(planet, story, difficulty);
    story.arrival = (op, days, difficulty) =>
      buildArrival(story, op, days, difficulty);
    story.note = (dir) => buildNote(planet, story, dir);
    story.talk = (s, folk, dir) => buildTalk(planet, story, s, folk, dir);
    return story;
  }

  // ---------------------------------------------------------------
  // One great city to a world, walled, and how it stands: thriving, half of it empty, still being built, or
  // fallen long ago (then it is a ruin out in the land, not a town anyone lives in). The story leans the dice:
  // a dragon burned the old capital, the dead walk where the haunted are, the grey sickness empties streets,
  // and a besieged capital is the great city of its world. (force: a state to have, for tests.)
