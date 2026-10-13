// index-inline-2 26 — dir
// Lines 8637-8971 of readable/index-inline-2.pretty.js (statement-aligned).
  function arcClock(arc, tDays) {
    if (!arc.clock) return null;
    const { period, phase } = arc.clock;
    const x = tDays / period + phase;
    const inDays = (1 - (x - Math.floor(x))) * period;
    return { label: arc.clock.label, inDays, period };
  }

  // ---------------------------------------------------------------
  function buildHistory(rng, F, peoples, places, settlements, arc, pick) {
    const p0 = peoples[0] || {
      name: "the first people",
      plural: "people",
      faith: "the old gods",
      arch: "isle",
      region: null,
    };
    const p1 = peoples[1] || p0;
    const land = places.find((p) => p.kind === "continent") ||
      places.find((p) => p.kind === "island") || { name: "the land" };
    const home = p0.region && p0.region.name ? p0.region.name : land.name;
    const tmpl = F.oceanFrac > 0.8 ? MYTHS.ocean : MYTHS[p0.arch] || MYTHS.wood;
    const myth = fill(tmpl, {
      Faith: cap(p0.faith),
      faith: p0.faith,
      plural: p0.plural,
      place: home,
      Place: cap(home),
      ocean: (F.ocean && F.ocean.name) || "the sea",
    });
    const wonders = [
      "the Bridge of Salt",
      "the Nine Stairs",
      "the Lamp of the Ocean",
      "the Great Library",
      "the Singing Wall",
      "the Road of Mirrors",
    ];
    const wonder = pick(rng, wonders);
    const site = pick(rng, settlements) || { name: "the old city" };
    const golden =
      peoples.length > 1
        ? `${cap(p0.name)} and ${p1.name} built ${wonder} at ${site.name} and kept the peace for ${nfs(rng.int(200, 900))} years.`
        : `${cap(p0.name)} built ${wonder} at ${site.name}, and for a while nobody went hungry.`;
    return [
      { era: "Before memory", text: myth },
      { era: `${nfs(rng.int(900, 3000))} years ago`, text: golden },
      { era: "Recently", text: arc.past || arc.summary },
    ];
  }

  // ---------------------------------------------------------------
  function buildTales(rng, F, peoples, settlements, places, gaz, planet, arc) {
    if (!settlements.length) return [];
    const L1 = planet.levels[1];
    const bioAt = (s) => L1.biome[s.cell];
    const near = (s, kinds) => {
      let best = null,
        bd = 9;
      for (const p of places)
        if (kinds.includes(p.kind)) {
          const a = angleBetween(p.dir, s.dir);
          if (a < bd) {
            bd = a;
            best = p;
          }
        }
      return best;
    };
    const fits = {
      desert: (s) =>
        bioAt(s) === B.DESERT ||
        bioAt(s) === B.COLDDESERT ||
        bioAt(s) === B.SAVANNA,
      port: (s) => s.type === "port",
      coast: (s) => s.coastKm < 120,
      mountain: (s) => s.elev > 1200 || s.type === "monastery",
      forest: (s) =>
        [B.FOREST, B.WETFOREST, B.TAIGA, B.DRYFOREST].includes(bioAt(s)),
      jungle: (s) => bioAt(s) === B.JUNGLE || bioAt(s) === B.DRYFOREST,
      cold: (s) => L1.temp[s.cell] < 3,
      volcano: (s) => {
        const v = near(s, ["volcano"]);
        return v && angleBetween(v.dir, s.dir) * planet.body.radiusKm < 700;
      },
      any: () => true,
    };
    const pool = TALES.slice();
    const n = Math.min(pool.length, rng.int(2, 4));
    const out = [];
    const used = new Set();
    for (let attempt = 0; attempt < 40 && out.length < n; attempt++) {
      const t = pool[Math.floor(rng.float() * pool.length)];
      if (used.has(t.key)) continue;
      const towns = settlements.filter(fits[t.where]);
      if (!towns.length) continue;
      const town = towns[Math.floor(rng.float() * towns.length)];
      const owner = peoples[town.owner] || peoples[0];
      const other =
        settlements
          .filter((s) => s !== town)
          .sort(
            (a, b) =>
              angleBetween(a.dir, town.dir) - angleBetween(b.dir, town.dir),
          )[0] || town;
      const region = (gaz.regionAt[town.cell] >= 0
        ? places[gaz.regionAt[town.cell]]
        : null) ||
        near(town, [
          "desert",
          "forest",
          "jungle",
          "plains",
          "taiga",
          "tundra",
        ]) || { name: "the wilds" };
      const nearP =
        near(town, ["volcano", "range", "isles", "rift", "riftsea"]) || region;
      const people2 = peoples.find((p) => p !== owner) || owner;
      const lang = owner ? owner.lang : null;
      const giver = lang ? lang.person(rng) : "Old Aru";
      const role = owner ? rng.pick(owner.roles) : "wanderer";
      const vars = {
        giver,
        role,
        a: an(role),
        town: town.name,
        other: other.name,
        region: region.name,
        near: nearP.name,
        n: rng.int(3, 40),
        people2: people2 ? people2.name : "strangers",
        bearing: rng.pick([
          "the north",
          "the sea",
          "the mountains",
          "the east",
        ]),
      };
      used.add(t.key);
      out.push({
        key: t.key,
        title: fill(t.title, vars),
        text: fill(t.text, vars),
        hint: fill(t.hint, vars),
        town: town.id,
        giver,
        role,
      });
    }
    return out;
  }

  // ---------------------------------------------------------------
  function kmPhrase(km, mode) {
    const days = km / 28;
    if (km < 6) return "just over that rise";
    if (km < 14) return "a few hours’ walk";
    if (km < 28) return "about a day’s walk";
    if (mode === "sea") return seaWords(km);
    if (days < 14) return `${Math.round(days)} days’ walk`;
    return `${Math.round(days)} days on foot, less if you find something to ride`;
  }

  function biomeGroup(b) {
    if ([B.DESERT, B.COLDDESERT].includes(b)) return "desert";
    if ([B.ICE, B.TUNDRA, B.TAIGA].includes(b)) return "cold";
    if ([B.FOREST, B.WETFOREST].includes(b)) return "forest";
    if ([B.JUNGLE, B.DRYFOREST].includes(b)) return "jungle";
    if ([B.STEPPE, B.SAVANNA].includes(b)) return "plains";
    if (b === B.ROCK) return "mountain";
    return "any";
  }

  // ---------------------------------------------------------------
  // Where you fall is not your choice. Difficulty decides how far you land
  // from safety, how harsh the ground is, and how far from the story's heart.
  const DIFFICULTIES = {
    easy: {
      label: "Easy",
      townKm: [4, 30],
      danger: [0, 0.3],
      blurb: "Land close to friendly people, in gentle country.",
    },
    normal: {
      label: "Normal",
      townKm: [40, 180],
      danger: [0.15, 0.6],
      blurb: "A long walk to safety through ordinary wilds.",
    },
    hard: {
      label: "Hard",
      townKm: [260, 3000],
      danger: [0.55, 1.2],
      blurb: "Far from anyone, somewhere that wants you dead.",
    },
  };
  const DANGER = {
    [B.STEPPE]: 0.1,
    [B.FOREST]: 0.1,
    [B.SAVANNA]: 0.2,
    [B.DRYFOREST]: 0.25,
    [B.WETFOREST]: 0.25,
    [B.TAIGA]: 0.35,
    [B.JUNGLE]: 0.55,
    [B.TUNDRA]: 0.6,
    [B.COLDDESERT]: 0.65,
    [B.DESERT]: 0.75,
    [B.ROCK]: 0.8,
    [B.ICE]: 0.95,
  };
  function dangerAt(q) {
    let d = DANGER[q.biome] ?? 0.4;
    if (q.elevation > 3000) d += 0.2;
    if (q.temperature < -5 || q.temperature > 29) d += 0.15;
    return d;
  }
  function outside(v, [a, b]) {
    return v < a ? a - v : v > b ? v - b : 0;
  }

  function chooseLanding(planet, story, diff) {
    const D = DIFFICULTIES[diff] || DIFFICULTIES.normal;
    const rng = new Rng(subSeed(planet.seedKey, "landing/" + diff));
    const R = planet.body.radiusKm;
    const lair = story.arc.lair && story.arc.lair.dir;
    const towns = story.settlements;
    const cands = [];
    // near towns for the gentler starts; anywhere on land for the hard one
    const n = diff === "hard" ? 700 : 420;
    for (let k = 0; k < n; k++) {
      let d;
      if (diff !== "hard" && towns.length) {
        const s = towns[Math.floor(rng.float() * towns.length)];
        const ang =
            (D.townKm[0] + rng.float() * (D.townKm[1] - D.townKm[0])) / R,
          th = rng.float() * Math.PI * 2;
        const e1 = [s.dir[2], 0, -s.dir[0]],
          l1 = Math.hypot(e1[0], e1[2]) || 1;
        e1[0] /= l1;
        e1[2] /= l1;
        const e2 = [
          s.dir[1] * e1[2] - s.dir[2] * e1[1],
          s.dir[2] * e1[0] - s.dir[0] * e1[2],
          s.dir[0] * e1[1] - s.dir[1] * e1[0],
        ];
        d = [0, 1, 2].map(
          (i) => s.dir[i] + (e1[i] * Math.cos(th) + e2[i] * Math.sin(th)) * ang,
        );
      } else {
        const u = rng.float() * 2 - 1,
          t = rng.float() * Math.PI * 2,
          r = Math.sqrt(1 - u * u);
        d = [r * Math.cos(t), u, r * Math.sin(t)];
      }
      const L = Math.hypot(d[0], d[1], d[2]);
      d = d.map((v) => v / L);
      const q = planet.query(d[0], d[1], d[2], 0);
      if (!q.land) continue;
      if (diff !== "hard" && q.biome === B.ICE) continue;
      // (and dry where you would stand, close to: the globe's coasts are coarser than the ground's, and a start in
      // the sea is no start; a wet one is only taken if there is nothing else)
      const wet = planet.ground
        ? planet.ground.height(d[0], d[1], d[2], 1) < 1.5
        : false;
      cands.push({ d, q, wet });
    }
    let best = null,
      bestPen = Infinity;
    for (const c of cands) {
      let tKm = Infinity,
        town = null;
      for (const s of towns) {
        const a = angleBetween(s.dir, c.d) * R;
        if (a < tKm) {
          tKm = a;
          town = s;
        }
      }
      const danger = dangerAt(c.q);
      const mood =
        town && town.owner >= 0 ? story.peoples[town.owner].mood : "welcoming";
      let pen =
        (outside(tKm, D.townKm) / (D.townKm[1] - D.townKm[0] + 40)) * 4 +
        outside(danger, D.danger) * 6;
      if (
        diff === "easy" &&
        ["zealous", "secretive", "proud", "wary but honourable"].includes(mood)
      )
        pen += 1.2;
      if (lair) {
        const sk = angleBetween(lair, c.d) * R;
        if (diff === "easy") pen += Math.max(0, sk - 2500) / 2500;
        if (diff === "hard") pen += Math.max(0, 3500 - sk) / 3500;
      }
      pen += rng.float() * 0.25;
      if (c.wet) pen += 100;
      if (pen < bestPen) {
        bestPen = pen;
        best = c.d;
      }
    }
    return best || planet.stats.highest.dir;
  }

  function describeAround(planet, story, dir) {
    const R = planet.body.radiusKm;
    const { within, near } = placesAround(story.gaz, planet, dir);
    let town = null,
      td = 9;
    for (const s of story.settlements) {
      const a = angleBetween(s.dir, dir);
      if (a < td) {
        td = a;
        town = s;
      }
    }
    return {
      within,
      near,
      town,
      townKm: town ? td * R : null,
      townBearing: town ? bearingWord(dir, town.dir) : null,
    };
  }

  // the traveller, on which way is which: look up, it is written on the sky
  const LOOK_UP = [
    (b) =>
      `"${cap(b)}? Look up. It is written on the sky, plain as anything. Did you hit your head on the way down as well?"`,
    (b) =>
      `"Which way is ${b}? Up there, look. The quarters are written across the sky for anyone who looks up. Even someone who just fell out of it."`,
    (b) =>
      `"Lost already? Look up. North, east, south and west, written on the sky. Everybody knows that. Well. Everybody who did not just fall out of it."`,
  ];
