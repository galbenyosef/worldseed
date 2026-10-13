// index-inline-2 39 — pen
// Lines 13674-14024 of readable/index-inline-2.pretty.js (statement-aligned).
  const BEASTS = {
    hen: {
      gives: "egg",
      every: 1,
      n: 1,
      hold: 4,
      eats: 0.25,
      word: "hen",
      words: "hens",
      max: 8,
    },
    goat: {
      gives: "milk",
      every: 1,
      n: 1,
      hold: 2,
      eats: 0.5,
      word: "goat",
      words: "goats",
      max: 3,
    },
    sheep: {
      gives: "wool",
      every: 4,
      n: 3,
      hold: 1,
      eats: 0.5,
      word: "sheep",
      words: "sheep",
      max: 3,
    },
  };
  const BEAST_OF = { hen: "hen", goat: "goat", sheep: "sheep" };
  const TROUGH_CAP = 40;
  // names the seller gives them (hens go without)
  const BEAST_NAMES = [
    "Bramble",
    "Clover",
    "Nettle",
    "Patch",
    "Moss",
    "Thistle",
    "Burdock",
    "Sorrel",
    "Pebble",
    "Dandelion",
    "Smudge",
    "Biscuit",
    "Tansy",
    "Old Mag",
    "Button",
    "Hazel",
    "Dot",
    "Fern",
    "Crumb",
    "Nutmeg",
  ];

  // ---------- where things go round a house ----------
  // In the house's own metres: x across it, z from the back wall to the door (+z is the front).
  // The stall stands out front to one side (side: -1 or 1). Three places for the field and the pen:
  // behind the house, and to either side of it. sx across, sz front to back; gate: which edge opens.
  function yardSlots(w, d, side) {
    const gap = 2.2;
    return {
      // (behind, it opens towards the stall's side, the way round the house you are likeliest to come)
      back: (sx, sz) => ({
        cx: 0,
        cz: -(d / 2 + gap + sz / 2),
        sx,
        sz,
        gate: side > 0 ? "u+" : "u-",
      }),
      far: (sx, sz) => ({
        cx: -side * (w / 2 + gap + sz / 2),
        cz: 0.4,
        sx: sz,
        sz: sx,
        gate: "w+",
      }),
      near: (sx, sz) => ({
        cx: side * (w / 2 + gap + sz / 2),
        cz: 0.4,
        sx: sz,
        sz: sx,
        gate: "w+",
      }),
    };
  }
  // the field is dug behind the house if it can be, the pen beside it, away from the stall; a stable for a
  // beast of your own goes up beside the house on the stall's side if it can (it opens to the front)
  const FIELD_SIZE = [10, 8],
    PEN_SIZE = [9, 7],
    STABLE_SIZE = [4.4, 3.8];
  const FIELD_PREF = ["back", "far", "near"],
    PEN_PREF = ["far", "back", "near"],
    STABLE_PREF = ["near", "far", "back"];
  const YARD_PREF = { field: FIELD_PREF, pen: PEN_PREF, stable: STABLE_PREF };
  const YARD_PROP = { field: "myfield", pen: "mypen", stable: "mystable" };
  function yardPart(w, d, side, what, at) {
    const S = yardSlots(w, d, side),
      [sx, sz] =
        what === "field"
          ? FIELD_SIZE
          : what === "stable"
            ? STABLE_SIZE
            : PEN_SIZE;
    return S[at] ? S[at](sx, sz) : null;
  }
  // which slots round a house the field, the pen and the stable have taken (but the one asked about)
  const yardTaken = (rec, but = null) =>
    ["field", "pen", "stable"]
      .filter((k) => k !== but && rec[k] && rec[k].at)
      .map((k) => rec[k].at);

  // ---------- the field ----------
  function newField(at) {
    return { at, crop: null, sown: 0 };
  }
  // how it stands at time now (days): bare, sown, coming up, green, ripe, gone over
  // (watered from a well of yours, it grows a third as fast again; it keeps ripe just as long)
  function fieldState(f, now) {
    if (!f || !f.crop || !CROPS[f.crop])
      return { stage: "bare", k: 0, left: 0 };
    const C = CROPS[f.crop],
      wet = f.wet ? 1.3 : 1,
      age = Math.max(0, now - f.sown) * wet,
      k = age / C.days,
      left = (C.days - age) / wet;
    if (k < 0.2) return { stage: "sown", k, left };
    if (k < 0.55) return { stage: "sprout", k, left };
    if (k < 1) return { stage: "green", k, left };
    const ripeFor = Math.max(0, now - f.sown) - C.days / wet;
    if (ripeFor < C.keep)
      return { stage: "ripe", k: 1, left: 0, over: C.keep - ripeFor };
    return { stage: "over", k: 1, left: 0 };
  }
  // what you get for it: all of it ripe, half if it went over (the birds and the rain had the rest)
  function harvest(f, now, rnd = Math.random) {
    const st = fieldState(f, now),
      C = CROPS[f.crop];
    if (!C || (st.stage !== "ripe" && st.stage !== "over")) return null;
    const n = C.yield[0] + Math.floor(rnd() * (C.yield[1] - C.yield[0] + 1));
    return {
      id: C.seed,
      n: st.stage === "over" ? Math.max(1, Math.round(n * 0.45)) : n,
      over: st.stage === "over",
    };
  }
  // "ripe in about two days", "ripe tomorrow"
  function ripeWords(left) {
    if (left <= 0) return "ripe now";
    if (left < 0.7) return "ripe later today";
    if (left < 1.5) return "ripe tomorrow, or near enough";
    return `ripe in about ${["", "one", "two", "three", "four", "five"][Math.min(5, Math.round(left))]} days`;
  }

  // ---------- the pen ----------
  function newPen(at, now) {
    return { at, beasts: [], trough: 0, t: now };
  }
  function beastName(pen, kind, rnd = Math.random) {
    if (kind === "hen") return null;
    const used = new Set(pen.beasts.map((b) => b.n));
    const free = BEAST_NAMES.filter((n) => !used.has(n));
    return (free.length ? free : BEAST_NAMES)[
      Math.floor(rnd() * (free.length || BEAST_NAMES.length))
    ];
  }
  // a new one in the pen (col: which coat it has, for the view)
  function addBeast(pen, kind, now, rnd = Math.random) {
    const b = {
      k: kind,
      n: beastName(pen, kind, rnd),
      t0: now,
      acc: 0,
      ready: 0,
      col: Math.floor(rnd() * 4),
    };
    pen.beasts.push(b);
    return b;
  }
  const penCount = (pen, kind) =>
    pen ? pen.beasts.filter((b) => b.k === kind).length : 0;
  // Time passes in the pen since it was last looked at: they eat from the trough (fed, they give at
  // the full rate; not, at half: they forage for themselves), and what they give piles up to a point.
  function stepPen(pen, now) {
    const days = Math.max(0, Math.min(30, now - (pen.t ?? now)));
    pen.t = now;
    if (!days || !pen.beasts.length) return;
    const need =
      pen.beasts.reduce((a, b) => a + (BEASTS[b.k] ? BEASTS[b.k].eats : 0), 0) *
      days;
    const eaten = Math.min(pen.trough, need);
    pen.trough = Math.max(0, +(pen.trough - eaten).toFixed(3));
    const rate = 0.5 + 0.5 * (need > 0 ? eaten / need : 1);
    for (const b of pen.beasts) {
      const B = BEASTS[b.k];
      if (!B) continue;
      b.acc += (days * rate) / B.every;
      while (b.acc >= 1 && b.ready < B.hold) {
        b.ready++;
        b.acc -= 1;
      }
      if (b.ready >= B.hold) b.acc = Math.min(b.acc, 0.99);
      b.acc = +b.acc.toFixed(4);
    }
  }
  // what is waiting to be collected, by what it is: { egg: 3, milk: 1, wool: 3 }
  function penReady(pen) {
    const out = {};
    for (const b of (pen && pen.beasts) || []) {
      const B = BEASTS[b.k];
      if (B && b.ready) out[B.gives] = (out[B.gives] || 0) + b.ready * B.n;
    }
    return out;
  }
  // ---------- the hives ----------
  // Three straw skeps on a bench behind the house. Between them they fill about a comb of honey a day
  // (half as much again while something is in flower in the field), and up to six wait to be taken.
  const HIVE_HOLD = 6;
  function newHives(now) {
    return { t: now, acc: 0, ready: 0 };
  }
  function stepHives(h, now, bloom = false) {
    const days = Math.max(0, Math.min(30, now - (h.t ?? now)));
    h.t = now;
    if (!days) return;
    h.acc += days * (bloom ? 1.5 : 1);
    while (h.acc >= 1 && h.ready < HIVE_HOLD) {
      h.ready++;
      h.acc -= 1;
    }
    if (h.ready >= HIVE_HOLD) h.acc = Math.min(h.acc, 0.99);
    h.acc = +h.acc.toFixed(4);
  }
  // ---------- a beast of your own, to ride ----------
  const MOUNT_NAMES = [
    "Ash",
    "Flint",
    "Rowan",
    "Sorrel",
    "Blaze",
    "Willow",
    "Storm",
    "Hazel",
    "Brindle",
    "Juniper",
    "Pepper",
    "Gale",
    "Bracken",
    "Cinder",
    "Wren",
    "Thistle",
    "Morrow",
    "Kestrel",
  ];
  const mountName = (seed) =>
    MOUNT_NAMES[Math.abs(seed | 0) % MOUNT_NAMES.length];
  // how full the trough is, in words
  function troughWords(pen) {
    const t = pen ? pen.trough : 0,
      per = pen
        ? pen.beasts.reduce(
            (a, b) => a + (BEASTS[b.k] ? BEASTS[b.k].eats : 0),
            0,
          )
        : 0;
    if (t <= 0.01) return "The trough is empty.";
    if (!per) return "There is grain in the trough, and nothing to eat it.";
    const d = t / per;
    return d < 1
      ? "There is a little grain left in the trough, not a day’s worth."
      : d < 2.5
        ? "There is grain in the trough for a day or two."
        : `There is grain in the trough for ${d < 6 ? "a few days" : d < 12 ? "a week or so" : "a long while"}.`;
  }
  // How the pen is laid out, in its own metres (u across the house, w front to back), from which edge
  // its gate is in: the gate in the middle of that edge, the trough just inside it to one side, a shed
  // in the far corner with the hen house in it. (du, dw): the way in through the gate.
  function penLayout(Y) {
    const g =
      Y.gate === "u+"
        ? { u: Y.sx / 2, w: 0, du: -1, dw: 0 }
        : Y.gate === "u-"
          ? { u: -Y.sx / 2, w: 0, du: 1, dw: 0 }
          : { u: 0, w: Y.sz / 2, du: 0, dw: -1 };
    // along the gate's edge, and how deep the pen is through it
    const pu = g.dw,
      pw = -g.du,
      depth = g.du ? Y.sx : Y.sz,
      span = g.du ? Y.sz : Y.sx;
    const along = Math.atan2(pw, pu);
    const trough = {
      u: g.u + g.du * 0.9 + pu * 1.9,
      w: g.w + g.dw * 0.9 + pw * 1.9,
      a: along,
    };
    const back = {
      u: g.u + g.du * (depth - 1.1),
      w: g.w + g.dw * (depth - 1.1),
    };
    const shed = {
      u: back.u - pu * (span / 2 - 1.5),
      w: back.w - pw * (span / 2 - 1.5),
      a: along,
      du: g.du,
      dw: g.dw,
    };
    const coop = { u: shed.u - pu * 0.55, w: shed.w - pw * 0.55 };
    return { gate: g, trough, shed, coop, pu, pw };
  }

  // ---- story/wayside.js ----
  // ============================================================
  // WAYSIDE — what the places between towns look like, who lives there and
  // what they say. A farm is a house in its people's tradition, a barn,
  // fields and a fence; an inn is a big house facing the road, with a sign; a
  // ruin is broken walls and a carving; a ring of stones is a ring of stones.
  // There are no maps: folk give directions in words, tell what they know of
  // the land and its past, and pass the rumours on. Carvings, graves and
  // signposts have words of their own. Pure data: the view builds it.
  // ============================================================

  const wsAn = (w) => (/^[aeiou]/i.test(w) ? "an" : "a");
  const wsLc = (t) => t.charAt(0).toLowerCase() + t.slice(1);
  const wsTitle = (t) =>
    t.replace(/(^|[\s-])([a-z])/g, (m, a, b) => a + b.toUpperCase());
  const wsAng = (a, b) =>
    Math.atan2(
      Math.hypot(
        a[1] * b[2] - a[2] * b[1],
        a[2] * b[0] - a[0] * b[2],
        a[0] * b[1] - a[1] * b[0],
      ),
      a[0] * b[0] + a[1] * b[1] + a[2] * b[2],
    );
  // a building's turn so that its front door looks along a bearing (clockwise from north)
  const frontRot = (face) => Math.atan2(-Math.sin(face), -Math.cos(face));
  // the one of a beast: "shell-oxen" -> "shell-ox", "horned goats as big as horses" -> "horned goat"
  function beastOne(b) {
    const w = String(b).replace(/ (the size of|as big as|as tall as).*$/, "");
    return w
      .replace(/oxen$/, "ox")
      .replace(/([lr])ves$/, "$1f")
      .replace(/ies$/, "y")
      .replace(/(ch|sh|x)es$/, "$1")
      .replace(/s$/, "");
  }

  // ---------- names ----------
