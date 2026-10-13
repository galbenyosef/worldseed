// index-inline-2 22 — math
// Lines 7570-7765 of readable/index-inline-2.pretty.js (statement-aligned).
  const ROUTE_HINTS = {
    sea: [
      '"You’ll need a boat for that. I know a fisher who owes me."',
      '"It’s across the water. We row at dawn."',
    ],
    mountains: [
      '"We go round the mountains, not over. The passes kill people."',
      '"There’s a pass through {range}. Stay close to me."',
    ],
    desert: [
      '"We cross {region}. Drink only when I say."',
      '"The {region} is not wide here, but it is hungry."',
    ],
    forest: [
      '"Stay on the path through {region}. Whatever you hear."',
      '"{region} is thick; we go slow."',
    ],
    easy: ['"Easy walking. Try to keep up."', '"Just follow me."'],
  };

  // What the traveller says when you reach the town together, by the mood of their people.
  const ARRIVALS = {
    welcoming: [
      '"{town}. Warm beds, loud people. You\u2019ll like it."',
      '"Here we are. {town}. Nobody will ask where you fell from. Well. Everybody will."',
    ],
    "wary but honourable": [
      '"{town}. Keep your hands where they can see them and you will be fed."',
      '"{town}. Guest-law holds here. Do not be the one who breaks it."',
    ],
    secretive: [
      '"{town}. Say you came by the river road. Say nothing about the sky."',
      '"{town}. Smile, but not too much. They notice."',
    ],
    proud: [
      '"{town}. Stand up straight. They judge you by your first step."',
      '"{town}. My people built every stone of it. Try not to scratch anything."',
    ],
    hospitable: [
      '"{town}. There will be soup. There is always soup."',
      '"{town}. Find the biggest fire and sit by it. Someone will feed you."',
    ],
    bold: [
      '"{town}! First round is yours, sky-fallen. Oh. You have no money. Mine, then."',
      '"{town}. Loudest town on the coast. You\u2019ll fit in."',
    ],
    cautious: [
      '"{town}. Wait here while I tell them you are harmless. You are harmless?"',
      '"{town}. Walk slowly. Speak softly. It works."',
    ],
    zealous: [
      '"{town}. The priests will want to look at you. Let them."',
      '"{town}. Bow at the shrine. Everyone is watching who bows."',
    ],
    free: [
      '"{town}. Nobody owns it and everybody argues about it. Welcome."',
      '"{town}. Pay no taxes, owe no lords. Mind the dogs."',
    ],
  };
  const PARTINGS = [
    '"This is where I leave you. Walk well, sky-fallen."',
    '"My road goes on. Yours starts here. Don\u2019t waste it."',
    '"If you remember who you are, come and tell me. I\u2019m curious."',
  ];

  // ---- story/story.js ----
  // ============================================================
  // STORY — grows a world's peoples, towns, history, one main arc and a
  // few side tales out of its real geography. Deterministic per seed:
  // the same planet always tells the same story. Nothing here changes
  // the physical planet; the story only reads it.
  // ============================================================

  const REGION_ARCHETYPE = {
    desert: "salt",
    jungle: "canopy",
    forest: "wood",
    taiga: "frost",
    tundra: "frost",
    icecap: "frost",
    plains: "grass",
    range: "stone",
  };

  // ---------- tiny text helpers ----------
  function fill(t, v) {
    return t.replace(/\{(\w+)\}/g, (m, k) => (v[k] !== undefined ? v[k] : m));
  }
  const an = (w) => (/^[aeiou]/i.test(w) ? "an" : "a");
  const listJoin = (a) =>
    a.length < 2
      ? a[0] || ""
      : a.slice(0, -1).join(", ") + " and " + a[a.length - 1];
  const nfs = (n) => Math.round(n).toLocaleString("en-US");
  const COMPASS8 = [
    "north",
    "north-east",
    "east",
    "south-east",
    "south",
    "south-west",
    "west",
    "north-west",
  ];

  // how long by boat, in words: nobody on shore knows the captains' routes to the day, so they don't pretend to
  function seaWords(km) {
    const d = km / 120;
    return d < 1.5
      ? "a day by boat"
      : d < 4.5
        ? "a few days by boat"
        : d < 10
          ? "a week or so by boat"
          : "a long voyage, weeks at sea";
  }
  function bearingWord(a, b) {
    const cl = Math.hypot(a[0], a[2]) || 1e-6;
    const east = [a[2] / cl, 0, -a[0] / cl];
    const north = [(-a[1] * a[0]) / cl, cl, (-a[1] * a[2]) / cl];
    const d = a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
    const t = [b[0] - a[0] * d, b[1] - a[1] * d, b[2] - a[2] * d];
    const deg =
      ((Math.atan2(
        t[0] * east[0] + t[1] * east[1] + t[2] * east[2],
        t[0] * north[0] + t[1] * north[1] + t[2] * north[2],
      ) *
        180) /
        Math.PI +
        360) %
      360;
    return COMPASS8[Math.round(deg / 45) % 8];
  }

  function slerp(a, b, t) {
    const om = angleBetween(a, b);
    if (om < 1e-6) return a.slice();
    const s = Math.sin(om),
      k0 = Math.sin((1 - t) * om) / s,
      k1 = Math.sin(t * om) / s;
    return [
      a[0] * k0 + b[0] * k1,
      a[1] * k0 + b[1] * k1,
      a[2] * k0 + b[2] * k1,
    ];
  }

  // ---------------------------------------------------------------
  // Somewhere near d with dry land under the middle of a town and all round it (a town is a few
  // hundred metres across): the place itself if it will do, else the nearest that will, within a few km.
  function dryTownSpot(planet, d) {
    const Rm = planet.body.radiusKm * 1000,
      G = planet.ground;
    if (!G || !G.height) return d;
    let ex = d[2],
      ez = -d[0],
      L = Math.hypot(ex, ez);
    if (L < 1e-9) {
      ex = 1;
      ez = 0;
      L = 1;
    }
    ex /= L;
    ez /= L;
    const n = [d[1] * ez, d[2] * ex - d[0] * ez, -d[1] * ex];
    const at = (x, z) => {
      const q = [
        d[0] + (ex * x + n[0] * z) / Rm,
        d[1] + (n[1] * z) / Rm,
        d[2] + (ez * x + n[2] * z) / Rm,
      ];
      const l = Math.hypot(q[0], q[1], q[2]);
      return [q[0] / l, q[1] / l, q[2] / l];
    };
    const h = (x, z) => {
      const q = at(x, z);
      return G.height(q[0], q[1], q[2], 2, true);
    };
    const dry = (x, z) => {
      if (h(x, z) < 2.5) return false;
      for (const r of [70, 150])
        for (let k = 0; k < 10; k++) {
          const a = (k / 10) * Math.PI * 2 + r;
          if (h(x + Math.cos(a) * r, z + Math.sin(a) * r) < 0.6) return false;
        }
      return true;
    };
    for (let k = 0; k < 600; k++) {
      const a = k * 2.39996,
        m = k ? 220 * Math.sqrt(k) : 0;
      if (dry(Math.cos(a) * m, Math.sin(a) * m))
        return at(Math.cos(a) * m, Math.sin(a) * m);
    }
    return null;
  }

