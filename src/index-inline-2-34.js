// index-inline-2 34 — look
// Lines 11191-11518 of readable/index-inline-2.pretty.js (statement-aligned).
  function folkLook(people, rng, role = null) {
    const arch = people ? people.arch : "isle";
    const F = FOLK[arch] || FOLK.isle;
    const jitter = (c) =>
      c.map((v) =>
        Math.max(0, Math.min(255, Math.round(v * (0.9 + rng.float() * 0.2)))),
      );
    const look = {
      arch,
      h: 1.58 + rng.float() * 0.34,
      build: rng.pick(["slim", "mid", "mid", "broad"]),
      skin: rng.pick(F.skin),
      hair: {
        style: rng.pick(["short", "long", "tied", "braid", "bald", "short"]),
        color: rng.pick(F.hair),
      },
      top: rng.pick(F.tops),
      main: jitter(rng.pick(F.main)),
      trim: rng.pick(F.trim),
      under: jitter(rng.pick(F.under)),
      hat: rng.pick(F.hats),
      item: rng.pick(F.items),
      beard: rng.chance(F.beard || 0.15),
      mask: rng.chance(F.mask || 0),
      pack: rng.chance(F.pack || 0.15),
      cloak: rng.chance(0.2),
    };
    if (role === "elder") {
      look.hair.color = [220, 220, 226];
      look.item = "staff";
      look.top = look.top === "wrap" ? "robe" : look.top;
    }
    if (role === "traveller") {
      look.pack = true;
      if (look.item === "none" || look.item === "bow") look.item = "staff";
      look.cloak = true;
    }
    // a hermit: a long robe, a tall pointed hat, a staff, and the beard or the hair of somebody who stopped counting years
    if (role === "hermit") {
      look.top = "robe";
      look.hat = "peak";
      look.item = "staff";
      look.beard = rng.chance(0.7);
      look.hair = {
        style: "long",
        color: rng.pick([
          [220, 220, 226],
          [196, 196, 204],
          [150, 146, 150],
        ]),
      };
      look.cloak = true;
      look.pack = false;
      look.mask = false;
    }
    // the people of the newer places, dressed for their work
    if (role === "miller") {
      look.top = "tunic";
      look.hat = "cap";
      look.item = "none";
      look.main = [214, 206, 188];
      look.under = [190, 182, 166];
      look.pack = false;
      look.mask = false;
    }
    if (role === "fisher") {
      look.hat = rng.pick(["wide", "cap", "band"]);
      look.item = "none";
      look.pack = false;
      look.mask = false;
      look.cloak = false;
    }
    if (role === "lightkeeper") {
      look.hat = "cap";
      look.item = "lantern";
      look.cloak = true;
      look.pack = false;
      look.mask = false;
    }
    if (role === "foreman" || role === "miner") {
      look.hat = role === "foreman" ? "cap" : rng.pick(["cap", "band"]);
      look.item = role === "foreman" ? "lantern" : "axe";
      look.top = "tunic";
      look.main = look.main.map((v) => Math.round(v * 0.6));
      look.cloak = false;
      look.pack = false;
      look.mask = false;
    }
    if (role === "ferryman") {
      look.hat = "wide";
      look.item = "staff";
      look.cloak = rng.chance(0.5);
      look.pack = false;
      look.mask = false;
    }
    if (role === "guard") {
      look.hat = "helm";
      look.item = "spear";
      look.cloak = rng.chance(0.6);
      look.pack = false;
      look.mask = false;
      look.shield = rng.chance(0.5) ? "round" : null;
    }
    if (role === "priest") {
      look.top = "robe";
      look.hat = rng.pick(["hood", "none", "band"]);
      look.item = "staff";
      look.pack = false;
      look.mask = false;
      look.cloak = false;
    }
    return look;
  }
  function lookFromName(people, name, role) {
    return folkLook(people, new Rng(hashStr(String(name)) ^ 0x7a11), role);
  }

  // ---- story/city.js ----
  // ============================================================
  // THE GREAT CITY — every world has one city greater than all the rest
  // (story/story.js picks which, and how it stands: thriving, half-empty,
  // still being built, or long fallen). A wall you can walk along, with
  // towers and a gatehouse at the end of every avenue; avenues out from a
  // great square with a fountain in it; two ring streets between them;
  // a palace and a temple on the square; quarters, each with a name.
  // Its roads come in through its gates (world/roads.js bends them to).
  // Pure data, in metres round the middle of the square (x east, z south):
  // the view builds it (view/cityview.js).
  // ============================================================

  // the city's measure: the square's radius, the ring streets, the wall's centre line, how thick and how
  // high it stands to its walk, half-widths of the avenues and the ring streets, a gate's passage, a
  // tower's width, and how far out its towers reach
  const CITY = {
    plaza: 24,
    rings: [54, 88],
    wall: 99,
    thick: 3.4,
    H: 8.4,
    avW: 3.4,
    ringW: 2.8,
    gateW: 5.4,
    gateTW: 5.0,
    tower: 6.4,
    out: 108,
    n: 6,
    fountain: 3.4,
  };
  const YARD = 1.3; // from a street's edge to a house's front

  // how many people, how many of the houses open their doors, how many stand empty
  const CITY_STATE = {
    thriving: { folk: 28, open: 0.28, empty: 0, lamp: 1, stalls: 8, watch: 3 },
    halfempty: {
      folk: 13,
      open: 0.24,
      empty: 0.36,
      lamp: 0.45,
      stalls: 3,
      watch: 2,
    },
    building: {
      folk: 18,
      open: 0.26,
      empty: 0,
      lamp: 0.75,
      stalls: 4,
      watch: 2,
    },
    fallen: { folk: 0, open: 0, empty: 1, lamp: 0, stalls: 0, watch: 0 },
  };
  const QUARTER_CRAFT = [
    "Smiths",
    "Weavers",
    "Potters",
    "Tanners",
    "Dyers",
    "Coopers",
    "Bakers",
    "Carvers",
    "Ropers",
    "Glassblowers",
    "Masons",
    "Chandlers",
    "Fullers",
    "Saddlers",
  ];
  const QUARTER_PLAIN = [
    "Old",
    "High",
    "Lantern",
    "Bell",
    "Well",
    "Garden",
    "Gate",
    "Lower",
    "Willow",
    "Ash",
  ];

  // the city's own dice: a town's id, or a place's seed (the city that fell is a place between towns)
  const cityKey = (s) =>
    typeof s.id === "number" ? s.id * 131 + 7 : hashInt(s.seed >>> 0, 77, 5);
  const wrapA = (a) => Math.atan2(Math.sin(a), Math.cos(a));

  // the avenues' bearings (as angles in the city's metres, atan2(z, x)): the same whoever asks, so the
  // roads in can bend to its gates before anything else about the city is laid out
  function cityAngles(story, s) {
    const r = new Rng(hashInt(cityKey(s), 0xc17e, story.seedHash || 1));
    const a0 = r.float() * Math.PI * 2,
      out = [];
    for (let k = 0; k < CITY.n; k++)
      out.push(a0 + (k / CITY.n) * Math.PI * 2 + (r.float() - 0.5) * 0.16);
    return out;
  }
  // which sector (between avenue k and k+1) an angle falls in
  function citySector(C, a) {
    for (let k = 0; k < C.ang.length; k++) {
      const d0 = wrapA(a - C.ang[k]),
        span = wrapA(C.ang[(k + 1) % C.ang.length] - C.ang[k]) || Math.PI * 2;
      const s = span < 0 ? span + Math.PI * 2 : span;
      const t = d0 < 0 ? d0 + Math.PI * 2 : d0;
      if (t <= s) return k;
    }
    return 0;
  }
  // how high the wall stands at angle a (to its walk): full, or less where it is unfinished or broken down
  function cityWallH(C, a) {
    let h = C.H;
    for (const w of C.works || []) {
      const t = wrapA(a - w.a0),
        span = wrapA(w.a1 - w.a0);
      if (t < 0 || t > span) continue;
      const f = t / span;
      // (built up from one end: the courses step down to where the masons are)
      h = Math.min(h, w.h0 + (w.h1 - w.h0) * f);
    }
    for (const b of C.breaches || []) {
      const t = Math.abs(wrapA(a - b.a)) * C.wall;
      if (t > b.half + 4) continue;
      const k = t < b.half ? 0 : (t - b.half) / 4;
      h = Math.min(
        h,
        b.low + (C.H - b.low) * k * k * (0.7 + 0.3 * Math.sin(a * 900)),
      );
    }
    return Math.max(0.6, h);
  }

  // ---------- footprints ----------
  function cityCorners(b, g = 0) {
    const cs = Math.cos(b.rot),
      sn = Math.sin(b.rot),
      hw = b.w / 2 + g,
      hd = b.d / 2 + g;
    return [
      [-hw, -hd],
      [hw, -hd],
      [hw, hd],
      [-hw, hd],
    ].map(([u, w]) => [b.x + u * cs - w * sn, b.z + u * sn + w * cs]);
  }
  function cityOverlap(a, b, g) {
    const ca = cityCorners(a, g / 2),
      cb = cityCorners(b, g / 2);
    for (const r of [a.rot, b.rot])
      for (const [ax, az] of [
        [Math.cos(r), Math.sin(r)],
        [-Math.sin(r), Math.cos(r)],
      ]) {
        let a0 = Infinity,
          a1 = -Infinity,
          b0 = Infinity,
          b1 = -Infinity;
        for (const [x, z] of ca) {
          const p = x * ax + z * az;
          if (p < a0) a0 = p;
          if (p > a1) a1 = p;
        }
        for (const [x, z] of cb) {
          const p = x * ax + z * az;
          if (p < b0) b0 = p;
          if (p > b1) b1 = p;
        }
        if (a1 < b0 || b1 < a0) return false;
      }
    return true;
  }
  // nearest distance from the middle to a segment
  function segR(p, q) {
    const dx = q[0] - p[0],
      dz = q[1] - p[1],
      L2 = dx * dx + dz * dz || 1;
    const t = Math.max(0, Math.min(1, -(p[0] * dx + p[1] * dz) / L2));
    return Math.hypot(p[0] + dx * t, p[1] + dz * t);
  }
  // does a footprint stand in a street, the square, or under the wall?
  function cityOnStreet(C, b, m) {
    const cs = cityCorners(b);
    let rmax = 0,
      rmin = Infinity;
    for (let i = 0; i < 4; i++) {
      rmax = Math.max(rmax, Math.hypot(cs[i][0], cs[i][1]));
      rmin = Math.min(rmin, segR(cs[i], cs[(i + 1) % 4]));
    }
    if (rmin < C.plazaR + m) return true;
    if (rmax > C.wall - C.thick / 2 - 3) return true;
    for (const R of C.rings)
      if (rmax > R - C.ringW - m && rmin < R + C.ringW + m) return true;
    for (const A of C.ang) {
      const ux = Math.cos(A),
        uz = Math.sin(A);
      let n0 = Infinity,
        n1 = -Infinity,
        t1 = -Infinity;
      for (const [x, z] of cs) {
        const n = -x * uz + z * ux,
          t = x * ux + z * uz;
        n0 = Math.min(n0, n);
        n1 = Math.max(n1, n);
        t1 = Math.max(t1, t);
      }
      if (t1 > C.plazaR - 2 && n0 < C.avW + m && n1 > -C.avW - m) return true;
    }
    return false;
  }

  // ---------- the plan ----------
