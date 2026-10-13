// index-inline-2 36 — math
// Lines 12693-12989 of readable/index-inline-2.pretty.js (statement-aligned).
  function cityStreetPoint(C, b) {
    const s = b.street;
    if (!s) return null;
    if (s.av != null) {
      const A = C.ang[s.av];
      return [Math.cos(A) * s.t, Math.sin(A) * s.t];
    }
    const R = C.rings[s.ring];
    return [Math.cos(s.a) * R, Math.sin(s.a) * R];
  }

  // ---------- the city that fell: a place between towns, ruins in its broken walls ----------
  // (its plan as the places' views take it: buildings none, everything a prop; spots to search)
  function deadCityPlan(story, s) {
    const plan = cityPlan(story, {
      ...s,
      great: "fallen",
      owner: -1,
      name: (story.city && story.city.name) || s.name,
    });
    const C = plan.city,
      rng = new Rng(hashInt(s.seed >>> 0, 0xdeadc, 7));
    const props = [],
      spots = [];
    // houses: walls broken off at every height, some down to a mound of stones, some to a few blocks
    plan.buildings.forEach((b, i) => {
      if (b.palaceTower) {
        props.push({
          t: "ruintower",
          x: b.x,
          z: b.z,
          rot: b.rot,
          w: b.w,
          h: 6 + rng.float() * 7,
          seed: rng.int(0, 1e6),
        });
        return;
      }
      const big = b.palace || b.kind === "temple";
      const roll = big ? 0 : rng.float();
      if (roll < 0.5)
        props.push({
          t: "ruinwalls",
          x: b.x,
          z: b.z,
          w: b.w,
          d: b.d,
          rot: b.rot,
          seed: rng.int(0, 1e6),
          tall: big ? 5.5 + rng.float() * 2 : 1.6 + rng.float() * 3.6,
        });
      else if (roll < 0.82)
        props.push({
          t: "rubblemound",
          x: b.x,
          z: b.z,
          w: b.w,
          d: b.d,
          rot: b.rot,
          seed: rng.int(0, 1e6),
        });
      else
        for (let k = 0; k < 3; k++)
          props.push({
            t: "block",
            x: b.x + (rng.float() - 0.5) * b.w * 0.7,
            z: b.z + (rng.float() - 0.5) * b.d * 0.7,
            s: 0.5 + rng.float() * 0.5,
            rot: rng.float() * 6.28,
          });
    });
    // the palace: a colonnade before it, some columns standing; the treasury at the back of it
    const pal = plan.buildings[0];
    {
      const cs = Math.cos(pal.rot),
        sn = Math.sin(pal.rot);
      for (let k = 0; k < 6; k++) {
        const u = -pal.w / 2 + 1.2 + (k * (pal.w - 2.4)) / 5,
          w = pal.d / 2 + 2.2,
          x = pal.x + u * cs - w * sn,
          z = pal.z + u * sn + w * cs;
        props.push({
          t: "pillar",
          x,
          z,
          h: rng.chance(0.4) ? 5.6 : 0.6 + rng.float() * 3.5,
          r: 0.48,
        });
      }
      const u = 0,
        w = -pal.d / 2 + 2.2,
        tx = pal.x + u * cs - w * sn,
        tz = pal.z + u * sn + w * cs;
      props.push({ t: "coffer", x: tx, z: tz, rot: pal.rot });
      spots.push({ kind: "treasury", x: tx, z: tz, y: 0.8, r: 1.3 });
    }
    // the temple's altar, still there
    const tem = plan.buildings.find((b) => b.kind === "temple");
    if (tem) {
      const cs = Math.cos(tem.rot),
        sn = Math.sin(tem.rot),
        w = -tem.d / 2 + 2.6,
        x = tem.x - w * sn,
        z = tem.z + w * cs;
      props.push({ t: "altar", x, z, rot: tem.rot });
      spots.push({ kind: "altar", x, z, y: 0.9, r: 1.3 });
    }
    // the square: the fountain dry and cracked, the founder fallen off the top of it; a stone with the city's name
    for (const p of plan.props) if (p.t === "fountain") props.push(p);
    {
      const a = C.quarters[2].mid,
        r = C.plazaR - 5,
        x = Math.cos(a) * r,
        z = Math.sin(a) * r;
      props.push({
        t: "slab",
        x,
        z,
        w: 1.5,
        d: 0.5,
        h: 2.4,
        rot: Math.atan2(-Math.cos(a), Math.sin(a)) + Math.PI / 2,
        lean: 0.08,
        carved: true,
        seed: rng.int(0, 1e6),
      });
      spots.push({ kind: "citystone", x, z, y: 1.2, r: 1.2 });
    }
    // rubble to search, here and there in the streets
    const lots = plan.buildings.filter(
      (b) => !b.palace && !b.palaceTower && b.kind !== "temple",
    );
    for (let n = 0; n < 8 && lots.length; n++) {
      const b = lots[(n * 37 + (s.seed % 17)) % lots.length],
        cs = Math.cos(b.rot),
        sn = Math.sin(b.rot),
        w = b.d / 2 + 0.9,
        x = b.x - w * sn,
        z = b.z + w * cs;
      props.push({ t: "rubble", x, z });
      spots.push({ kind: "cityrubble", n, x, z, y: 0.5, r: 1.2 });
    }
    // and trees grown up in the courts and the streets
    for (let n = 0; n < 34; n++) {
      const a = rng.float() * Math.PI * 2,
        r = C.plazaR + 4 + rng.float() * (C.rings[1] - C.plazaR);
      const x = Math.cos(a) * r,
        z = Math.sin(a) * r;
      if (
        plan.buildings.some(
          (b) => Math.hypot(b.x - x, b.z - z) < Math.max(b.w, b.d) * 0.55 + 1.2,
        )
      )
        continue;
      props.push({
        t: "ruintree",
        x,
        z,
        s: 0.8 + rng.float() * 0.7,
        seed: rng.int(0, 1e6),
      });
    }
    props.push({ t: "citywalls", x: 0, z: 0 });
    return {
      kind: "deadcity",
      r: C.out + 8,
      reach: C.out + 8,
      style: plan.style,
      buildings: [],
      props,
      folk: [],
      spots,
      beacons: [],
      city: C,
      plazaR: C.plazaR,
    };
  }

  // ---- game/magic.js ----
  // ============================================================
  // MAGIC — not fireballs: things that make you more, for a while. Songs on a
  // flute carved from a giant's bone, five notes and the tunes the hermits
  // teach (play one you know and it takes hold of you); draughts in little
  // stoppered bottles; and blessings that places give the ones who come to
  // them. All of it wears off. Pure data and arithmetic; the app plays it.
  // ============================================================

  // the flute's five notes, low to high (D F A C D), and the keys that play them: 1 to 5,
  // or Space and the arrows the way a handheld's buttons would
  const NOTES = [
    { f: 293.66, key: "1", glyph: "A", alt: "Space" },
    { f: 349.23, key: "2", glyph: "▼", alt: "↓" },
    { f: 440.0, key: "3", glyph: "▶", alt: "→" },
    { f: 523.25, key: "4", glyph: "◀", alt: "←" },
    { f: 587.33, key: "5", glyph: "▲", alt: "↑" },
  ];
  const NOTE_OF_KEY = {
    Digit1: 0,
    Numpad1: 0,
    Space: 0,
    Digit2: 1,
    Numpad2: 1,
    ArrowDown: 1,
    Digit3: 2,
    Numpad3: 2,
    ArrowRight: 2,
    Digit4: 3,
    Numpad4: 3,
    ArrowLeft: 3,
    Digit5: 4,
    Numpad5: 4,
    ArrowUp: 4,
  };

  // The songs. rest: seconds before it takes hold again ('day': once a day).
  const SONGS = {
    road: {
      name: "Song of the Road",
      notes: [0, 2, 3, 0, 2, 3],
      rest: 300,
      bless: "road",
      says: "Your feet go light under you. The road wants walking.",
    },
    stone: {
      name: "Song of Stone",
      notes: [1, 1, 0, 1, 1, 0],
      rest: 240,
      bless: "stone",
      says: "Something settles in your bones, heavy and calm. Whatever hits you now will hit stone.",
    },
    fury: {
      name: "Song of Fury",
      notes: [4, 4, 2, 4, 4, 2],
      rest: 90,
      bless: "fury",
      says: "Your blood runs hot. The next blow you strike will land like three.",
    },
    embers: {
      name: "Song of Embers",
      notes: [2, 1, 0, 2, 1, 0],
      rest: 600,
      bless: "embers",
      says: "Warmth goes through you like a hearth fire, and your clothes steam dry.",
    },
    mending: {
      name: "Song of Mending",
      notes: [0, 1, 2, 3, 2, 1, 0],
      rest: 300,
      bless: "mending",
      says: "The tune goes on in you after the flute stops, and your hurts begin to close.",
    },
    morning: {
      name: "Song of Morning",
      notes: [3, 1, 4, 3, 1, 4],
      rest: "day",
      says: "The stars go out one by one. The sky goes grey, then gold.",
    },
    heart: {
      name: "Song of the Heart",
      notes: [4, 2, 0, 4, 2, 0, 1, 2],
      rest: "day",
      says: "The world folds up small around the tune, and opens again somewhere else.",
    },
  };
  // the order they are written down in, the common ones first
  const SONG_ORDER = [
    "road",
    "stone",
    "fury",
    "embers",
    "mending",
    "morning",
    "heart",
  ];
  // what a hermit asks for teaching one: any one of these (each a list of [thing, how many])
  const SONG_PRICE = {
    road: [[["crystal", 2]], [["resin", 4]], [["obsidian", 2]]],
    stone: [[["stonewood", 1]], [["ore", 3]], [["crystal", 2]]],
    fury: [[["gianttooth", 1]], [["amulet", 1]], [["oldblade", 2]]],
    embers: [[["obsidian", 2]], [["charcoal", 6]], [["resin", 4]]],
    mending: [[["herbs", 8]], [["crystal", 2]], [["amulet", 1]]],
    morning: [[["stariron", 1]], [["crown", 1]], [["crystal", 4]]],
    // the hardest of all: a piece of three wonders
    heart: [
      [
        ["stariron", 1],
        ["gianttooth", 1],
        ["stonewood", 1],
      ],
    ],
  };

  // What takes hold of you, and for how long (seconds of walking about; 'day': a day and a night).
  // speed: how much quicker you go; tireless: running takes no breath; armour: added to what you wear;
  // mult: your blows (once: only the next one); fireC: warmth, as if by a fire; heal: health a second;
  // regen: how much faster you heal of yourself; see: you see in the dark; breath: swimming does not tire
  // you; leap: you jump higher and fall softly.
