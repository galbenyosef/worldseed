// index-inline-2 46 — kind
// Lines 17156-17488 of readable/index-inline-2.pretty.js (statement-aligned).
  function viewWords(story, ix, here, eyeH, known, from = null) {
    const h0 = ix.height(here) + eyeH;
    const R = ix.R;
    const TALL = {
      farm: 60,
      hamlet: 60,
      inn: 60,
      hut: 40,
      tents: 30,
      tower: 16,
      bigtree: 40,
      hotspring: 30,
      circle: 3,
      ruin: 4,
      peak: 3,
      barrow: 3,
      battlefield: 2,
      skystone: 60,
      giantbones: 9,
      geysers: 24,
      stonegrove: 7,
      hermit: 40,
      mill: 16,
      fishhut: 40,
      lighthouse: 22,
      mine: 30,
      ferry: 30,
      watch: 12,
      temple: 40,
    };
    const P0 = here.map((v) => v * (R + h0));
    const out = [];
    for (const s of ix.near(here, 16000, "big")) {
      if (s.kind === "sign" || s.m < 200) continue;
      const top = (s.h ?? ix.height(s.dir)) + (TALL[s.kind] || 3);
      const P1 = s.dir.map((v) => v * (R + top));
      let seen = true;
      for (let k = 1; k < 20 && seen; k++) {
        const t = k / 20,
          P = [
            P0[0] + (P1[0] - P0[0]) * t,
            P0[1] + (P1[1] - P0[1]) * t,
            P0[2] + (P1[2] - P0[2]) * t,
          ];
        const L = Math.hypot(P[0], P[1], P[2]),
          d = [P[0] / L, P[1] / L, P[2] / L];
        if (L < R + ix.ground.height(d[0], d[1], d[2], 25, true)) seen = false;
      }
      // small things can only be made out close
      if (seen && (TALL[s.kind] || 3) < 5 && s.m > 4000) seen = false;
      if (seen) out.push(s);
    }
    const SEEN = {
      farm: ["smoke from a farm", "smoke from {n} farms"],
      hamlet: ["the roofs of a hamlet", "the roofs of {n} hamlets"],
      inn: ["an inn on the road", "{n} inns along the road"],
      hut: ["smoke from a lonely hut", "smoke from {n} lonely huts"],
      tents: ["a camp of tents", "{n} camps of tents"],
      tower: ["a tower", "{n} towers"],
      bigtree: [
        "a tree taller than all the rest",
        "{n} trees taller than all the rest",
      ],
      hotspring: ["steam rising", "steam rising in {n} places"],
      circle: ["a ring of stones", "{n} rings of stones"],
      ruin: ["grey ruins", "the grey ruins of {n} old places"],
      cave: ["a cave mouth in a hillside", "{n} cave mouths in the hills"],
      peak: ["a cairn on another hilltop", "cairns on {n} other hilltops"],
      barrow: ["a long green mound", "{n} long green mounds"],
      battlefield: [
        "a field where crows gather",
        "{n} fields where crows gather",
      ],
      skystone: [
        "a beam of pale light standing up out of the ground",
        "{n} beams of pale light standing up out of the ground",
      ],
      giantbones: [
        "great white ribs standing out of the ground",
        "great white ribs standing out of the ground in {n} places",
      ],
      geysers: [
        "water and steam spouting from the ground",
        "water and steam spouting from the ground in {n} places",
      ],
      stonegrove: [
        "a stand of grey trees without a leaf on them",
        "{n} stands of grey trees without a leaf on them",
      ],
      hermit: [
        "purple smoke from a lonely tower",
        "purple smoke from {n} lonely towers",
      ],
      mill: ["the sails of a windmill", "the sails of {n} windmills"],
      fishhut: [
        "smoke from a hut down by the water",
        "smoke from {n} huts down by the water",
      ],
      lighthouse: [
        "a lighthouse on the shore",
        "{n} lighthouses along the shore",
      ],
      mine: [
        "smoke from a mine in the hills",
        "smoke from {n} mines in the hills",
      ],
      ferry: ["a landing by the water", "{n} landings by the water"],
      watch: ["a watchtower on the road", "{n} watchtowers on the road"],
      temple: [
        "the smoke of offerings",
        "the smoke of offerings in {n} places",
      ],
    };
    const NUM = ["", "one", "two", "three", "four", "five", "six"];
    const groups = new Map();
    for (const s of out.slice(0, 16)) {
      const bw = bearingWord(here, s.dir);
      if (!groups.has(bw)) groups.set(bw, []);
      groups.get(bw).push(s);
    }
    const lines = [],
      notes = [],
      learned = [];
    for (const [bw, list] of groups) {
      // near ones first, like things of a kind together: "smoke from two farms, and far off a tower"
      // near things first, like with like ("smoke from two farms"), then what is far off
      const band = (items) => {
        const byKind = new Map(),
          parts = [];
        for (const s of items) {
          if (!byKind.has(s.kind)) byKind.set(s.kind, []);
          byKind.get(s.kind).push(s);
          learned.push(s.id);
        }
        for (const [kind, arr] of byKind) {
          const w = SEEN[kind] || [
            SITE_WORD[kind] || kind,
            "{n} " + (SITE_WORD[kind] || kind),
          ];
          const names = arr
            .filter((s) => known.has(s.id))
            .map((s) => siteName(story, s));
          let t =
            arr.length === 1
              ? w[0]
              : w[1].replace("{n}", NUM[arr.length] || String(arr.length));
          if (names.length) t += ` (${names.join(", ")}, you think)`;
          parts.push(t);
        }
        return parts.length < 2
          ? parts[0] || ""
          : parts.slice(0, -1).join(", ") + " and " + parts[parts.length - 1];
      };
      const nearTxt = band(list.filter((s) => s.m <= 8000)),
        farTxt = band(list.filter((s) => s.m > 8000));
      const txt =
        nearTxt && farTxt
          ? `${nearTxt}; and far off, ${farTxt}`
          : nearTxt || `far off, ${farTxt}`;
      lines.push(`To the ${bw}: ${txt}.`);
    }
    if (lines.length)
      notes.push({
        text: lines.join(" "),
        who: from ? `Seen from ${from}` : "Seen from high up",
      });
    return { lines, notes, known: learned };
  }

  // ---- story/townday.js ----
  // ============================================================
  // DAYS IN TOWN — not every day in a town is the same. Every few days it is
  // market day (more often in a big place), and the square fills with stalls
  // and people in from the farms; now and then two people marry in front of
  // the hall, or the town lays one of its own on a bier for everyone to see
  // off; a house catches fire, and everybody runs for buckets; on the feast
  // day of their god every town of a people celebrates at once, with flags
  // over the square and a fire in the middle of it; and a caravan from far
  // away camps by the road in, with things nobody here makes.
  // Pure: the same town on the same day always has the same day. The view
  // lays it out (view/dayview.js); app.js lets you take part.
  // ============================================================

  // every how many days a place holds its market (none in a monastery or an outpost)
  const MARKET_EVERY = { capital: 3, town: 4, port: 4, village: 7 };
  // when each kind of day happens (parts of a day: 0 is midnight)
  const TOWNDAY_HOURS = {
    market: [0.29, 0.72],
    wedding: [0.38, 0.86],
    funeral: [0.33, 0.6],
    fire: [0, 1],
    festival: [0.52, 0.99],
    caravan: [0.27, 0.8],
  };

  // what kind of day it is in a town: null for an ordinary one
  function townDay(story, s, day) {
    const people = s.owner >= 0 ? story.peoples[s.owner] : null;
    const small = s.type === "monastery" || s.type === "outpost";
    // the feast of the people's god: the same day in all their towns (a free town keeps the old gods' feast on a day of its own)
    if (!small) {
      const fr = mulberry32(
        hashInt(
          people ? s.owner + 1 : 1000 + s.id,
          0x7ea5,
          story.seedHash || 1,
        ),
      );
      const every = 17 + Math.floor(fr() * 9),
        off = Math.floor(fr() * every);
      if ((day + off) % every === 0)
        return {
          kind: "festival",
          day,
          seed: hashInt(s.id, day, 0xfe57) >>> 0,
        };
    }
    const me = MARKET_EVERY[s.type] || 0;
    if (me && (day + s.id * 3) % me === 0)
      return { kind: "market", day, seed: hashInt(s.id, day, 0x3a7) >>> 0 };
    const r = mulberry32(
      hashInt(s.id * 7919 + 13, day, 0xda7 ^ (story.seedHash || 1)),
    );
    const roll = r(),
      seed = Math.floor(r() * 4294967295) >>> 0;
    if (small) return roll < 0.05 ? { kind: "funeral", day, seed } : null;
    if (roll < 0.06) return { kind: "wedding", day, seed };
    if (roll < 0.1) return { kind: "funeral", day, seed };
    if (roll < 0.125) return { kind: "fire", day, seed, at: 0.36 + r() * 0.28 };
    if (roll < 0.2 && s.type !== "village")
      return { kind: "caravan", day, seed };
    return null;
  }
  // a day's own people: the couple, the one being buried, whose house is burning, where the caravan is from
  function dayCast(story, s, ev) {
    if (ev._cast) return ev._cast;
    const people = s.owner >= 0 ? story.peoples[s.owner] : null,
      lang = townLang(story, people);
    const r = new Rng(ev.seed);
    const c = {
      names: [lang.person(r), lang.person(r)],
      role:
        people && people.roles
          ? r.pick(people.roles)
          : r.pick(["farmer", "weaver", "potter", "smith", "herder"]),
    };
    if (ev.kind === "funeral")
      c.age = r.pick(["old", "old", "young", "not old"]);
    if (ev.kind === "caravan") {
      const others = story.peoples.filter((p) => p !== people);
      const from = others.length ? r.pick(others) : null;
      c.from = from ? from.name : "the far side of the world";
      c.fromArch = from ? from.arch : "salt";
    }
    if (ev.kind === "festival")
      c.faith = people ? people.faith : "the old gods";
    ev._cast = c;
    return c;
  }
  const tdFirst = (n) => String(n).split(" ")[0];
  // in a few words, for the toast as you come in
  function dayTitle(story, s, ev) {
    const c = dayCast(story, s, ev);
    switch (ev.kind) {
      case "market":
        return "it is market day";
      case "wedding":
        return `${tdFirst(c.names[0])} and ${tdFirst(c.names[1])} are getting married`;
      case "funeral":
        return `the town is burying ${tdFirst(c.names[0])}`;
      case "fire":
        return "a house is on fire!";
      case "festival":
        return `the feast of ${c.faith}`;
      case "caravan":
        return `a caravan from ${c.from} is camped by the road`;
    }
    return "";
  }
  // what someone in town says about the day
  function dayLine(story, s, ev, burning, rng) {
    const c = dayCast(story, s, ev),
      a = tdFirst(c.names[0]),
      b = tdFirst(c.names[1]);
    const L =
      {
        market: [
          '"Market day! Half the valley is here. Mind your purse, and buy something."',
          '"You picked a good day. Everyone brings what they have to the square on market day."',
          '"If you want anything, today is the day. Tomorrow the stalls are all gone again."',
        ],
        wedding: [
          `"${a} and ${b} are getting married today! In front of the hall. Everyone is invited. Even you."`,
          `"Have you heard? ${a} and ${b}. At last. We all thought they never would."`,
          `"There is food at the wedding for anyone who comes. That is the custom. Go on."`,
        ],
        funeral: [
          `"We bury ${a} today. ${c.age === "young" ? "Too young. Much too young." : c.age === "old" ? "Old " + a + ", who remembered everything." : "The " + c.role + "."}"`,
          `"Speak quietly today. ${a} is on the bier in the square, for everyone to say goodbye to."`,
        ],
        fire: burning
          ? [
              `"Fire! ${a}’s house is burning! Grab a bucket, or get out of the way!"`,
              '"The well! Get to the well! It is spreading!"',
            ]
          : [
              `"${a}’s house burned today. Nobody was hurt. That is something."`,
              '"We put it out, in the end. The whole town at the buckets."',
            ],
        festival: [
          `"It is the feast of ${c.faith}! There is food, and there is the fire tonight, and nobody works until tomorrow."`,
          `"Every town of ours keeps the feast of ${c.faith} today. Eat something. Dance, if you have the legs for it."`,
        ],
        caravan: [
          `"A caravan came in this morning from ${c.from}. They have things you have never seen. They want too much for all of it."`,
          `"The caravan from ${c.from} is camped by the road in. Go and look, before they move on."`,
        ],
      }[ev.kind] || [];
    return L.length ? L[Math.floor(rng() * L.length)] : null;
  }

  // ---------- how a day is laid out, in the town's own metres (x east, z south from the middle of the square) ----------
  const MARKET_ROLES = [
    ["fruit seller", "market"],
    ["baker", "market"],
    ["cloth seller", "market"],
    ["potter", "market"],
    ["bowyer", "market"],
    ["tinker", "market"],
    ["herbwife", "market"],
    ["butcher", "market"],
  ];
  // returns { props: [{ t, x, z, rot, ... }], folk: [{ x, z, face, look, name, role, seed, wander, route, day }], spots: [{ kind, x, z, y, r }], lights: [{ kind, x, z, y }], burn: building index }
