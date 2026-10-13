// index-inline-2 80 — env
// Lines 33356-33664 of readable/index-inline-2.pretty.js (statement-aligned).
  function slotRow(s) {
    if (!s) return null;
    const a = [s.id, s.n, s.wear ?? null, s.worn ? 1 : 0, s.mends ?? null];
    if (s.tag != null) a.push(s.tag);
    return a;
  }
  function slotFrom(a) {
    if (!a || !ITEMS[a[0]]) return null;
    const s = { id: a[0], n: a[1] };
    if (a[2] != null) s.wear = a[2];
    if (a[3]) s.worn = true;
    if (a[4] != null) s.mends = a[4];
    if (a[5] != null) s.tag = a[5];
    return s;
  }
  // what to hand add() so a stack keeps what makes it itself
  function slotExtra(s) {
    if (!s) return null;
    if (s.wear == null && !s.worn && s.tag == null) return null;
    const e = {};
    if (s.wear != null) e.wear = s.wear;
    if (s.worn) e.worn = true;
    if (s.mends != null) e.mends = s.mends;
    if (s.tag != null) e.tag = s.tag;
    return e;
  }

  // words for a line of things: "3 sticks and some cord"
  function listWords(list) {
    const w = list.map((x) => countWords(x.id, x.n));
    return w.length < 2
      ? w[0] || ""
      : w.slice(0, -1).join(", ") + " and " + w[w.length - 1];
  }

  // ---- game/body.js ----
  // ============================================================
  // BODY — not a survival game, but you have a body. Food and warmth make you
  // stronger rather than keep you alive: fed and warm, you heal and have breath
  // to run; hungry or cold, you don't. Only real freezing hurts. The planet's
  // own climate decides how hard this is: an ice world is a harder start.
  // ============================================================

  class Body {
    constructor() {
      this.hp = 100; // health
      this.breath = 100; // stamina: running, swimming, jumping
      this.warmth = 72; // how warm you are
      this.food = 65; // how fed you are
      this.wet = 0; // soaked through, 0..1
      this.rested = 0; // real seconds of a good night's sleep left
      this.winded = false; // ran out of breath: no running until it comes back
    }
    get hungry() {
      return this.food < 15;
    }
    get cold() {
      return this.warmth < 28;
    }
    get freezing() {
      return this.warmth < 8;
    }
    // the temperature you feel, given the air and what you have around you
    static feltC(env) {
      return (
        env.airC +
        (env.clothesC || 0) +
        (env.fireC || 0) +
        (env.shelter ? 5 : 0) -
        (env.wet || 0) * 9
      );
    }
    // one step: dt real seconds, hours of planet time passing, what you were doing
    step(dt, hours, env) {
      const felt = Body.feltC({ ...env, wet: this.wet });
      const target = Math.max(0, Math.min(100, ((felt + 4) / 24) * 100));
      // you warm up quickly by a fire and cool down slowly
      if (target > this.warmth)
        this.warmth = Math.min(
          target,
          this.warmth + dt * (env.fireC > 3 ? 2.4 : 1.1),
        );
      else this.warmth = Math.max(target, this.warmth - dt * 0.3);
      // a full belly lasts about a day
      this.food = Math.max(
        0,
        this.food - hours * 4.2 * (env.running ? 1.6 : 1),
      );
      // dry out slowly, or quickly by a fire
      if (env.swimming) this.wet = 1;
      else
        this.wet = Math.max(0, this.wet - hours * (env.fireC > 3 ? 3 : 0.35));
      // breath
      let use = 0;
      // (the road's blessing: running takes nothing; a fish's draught: nor does swimming)
      if (env.running && !env.tireless) use += 13;
      if (env.swimming && !env.deepBreath) use += 6;
      if (use) this.breath = Math.max(0, this.breath - use * dt);
      else {
        const k =
          (this.hungry ? 0.5 : 1) *
          (this.cold ? 0.6 : 1) *
          (this.rested > 0 ? 1.35 : 1);
        this.breath = Math.min(100, this.breath + 17 * k * dt);
      }
      if (env.jumped) this.breath = Math.max(0, this.breath - 9);
      if (this.breath <= 0.5) this.winded = true;
      else if (this.winded && this.breath > 30) this.winded = false;
      this.rested = Math.max(0, this.rested - dt);
      // health
      let hurt = 0;
      if (this.freezing) hurt += 0.45 * dt;
      if (env.impact) hurt += env.impact;
      // blows from things that fight you, less what your armour turns aside
      if (env.blows) hurt += env.blows * (env.guard ?? 1);
      if (hurt) {
        this.hp = Math.max(0, this.hp - hurt);
        this.lastHurt = env.now || 0;
      } else if (!this.hungry && !this.cold)
        this.hp = Math.min(
          100,
          this.hp + dt * (this.rested > 0 ? 0.6 : 0.3) * (env.regen || 1),
        );
      return this.hp <= 0;
    }
    eat(food, heal = 0) {
      this.food = Math.min(100, this.food + food);
      if (heal) this.hp = Math.min(100, this.hp + heal);
    }
    // how you are, in words
    words() {
      const w = [];
      if (this.hp < 25) w.push("badly hurt");
      else if (this.hp < 70) w.push("hurt");
      if (this.freezing) w.push("freezing");
      else if (this.cold) w.push("cold");
      else if (this.warmth > 70) w.push("warm");
      if (this.food < 5) w.push("starving");
      else if (this.hungry) w.push("hungry");
      else if (this.food > 75) w.push("well fed");
      if (this.wet > 0.3) w.push("soaked");
      if (this.winded) w.push("out of breath");
      if (this.rested > 0) w.push("rested");
      if (!w.length) return "You feel all right.";
      const s =
        w.length < 2
          ? w[0]
          : w.slice(0, -1).join(", ") + " and " + w[w.length - 1];
      return "You are " + s + ".";
    }
    toJSON() {
      return {
        hp: this.hp,
        breath: this.breath,
        warmth: this.warmth,
        food: this.food,
        wet: this.wet,
        rested: this.rested,
      };
    }
    static fromJSON(o) {
      const b = new Body();
      Object.assign(b, o || {});
      b.winded = false;
      return b;
    }
  }

  // ---- game/save.js ----
  // ============================================================
  // SAVE — the seed rebuilds the whole world, so a save is only what you
  // changed: where you are, what you carry and know, what you took, felled,
  // built and left behind. It lives in this browser, and as a code you can
  // copy somewhere safe and paste into another browser.
  // ============================================================

  const SAVE_KEY = "worldseed:life";
  const CODE_PREFIX = "WS1.";

  function readSave() {
    try {
      const s = localStorage.getItem(SAVE_KEY);
      return s ? JSON.parse(s) : null;
    } catch (e) {
      return null;
    }
  }
  function writeSave(data) {
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify(data));
      return true;
    } catch (e) {
      return false;
    }
  }
  function clearSave() {
    try {
      localStorage.removeItem(SAVE_KEY);
    } catch (e) {
      /* nothing to clear */
    }
  }

  // base64url of bytes, and back
  const b64u = (bytes) => {
    let s = "";
    for (let i = 0; i < bytes.length; i += 0x8000)
      s += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000));
    return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  };
  const unb64u = (s) => {
    const b = atob(
      s.replace(/-/g, "+").replace(/_/g, "/") + "===".slice((s.length + 3) % 4),
    );
    const out = new Uint8Array(b.length);
    for (let i = 0; i < b.length; i++) out[i] = b.charCodeAt(i);
    return out;
  };
  async function pipe(bytes, stream) {
    const res = new Response(new Blob([bytes]).stream().pipeThrough(stream));
    return new Uint8Array(await res.arrayBuffer());
  }
  async function saveCode(data) {
    const raw = new TextEncoder().encode(JSON.stringify(data));
    if (typeof CompressionStream === "function") {
      try {
        return (
          CODE_PREFIX +
          "z" +
          b64u(await pipe(raw, new CompressionStream("deflate-raw")))
        );
      } catch (e) {
        /* fall through to plain */
      }
    }
    return CODE_PREFIX + "p" + b64u(raw);
  }
  async function readCode(code) {
    const s = String(code || "")
      .trim()
      .replace(/\s+/g, "");
    if (!s.startsWith(CODE_PREFIX)) throw new Error("not a save code");
    const kind = s.charAt(CODE_PREFIX.length),
      body = unb64u(s.slice(CODE_PREFIX.length + 1));
    let raw = body;
    if (kind === "z") {
      if (typeof DecompressionStream !== "function")
        throw new Error("this browser cannot open packed codes");
      raw = await pipe(body, new DecompressionStream("deflate-raw"));
    }
    const data = JSON.parse(new TextDecoder().decode(raw));
    if (!data || data.v !== 1 || !data.seed) throw new Error("not a save code");
    return data;
  }

  // ---- game/tales.js ----
  // ============================================================
  // TALES — small stories along the way. Some of the folk at farms, inns,
  // huts and camps have a problem you could help with: someone who went off
  // and did not come back, something they need, something to carry to
  // somebody, something to leave at a grave or a shrine, something lost to
  // fetch home. Who needs what is fixed by the place (its seed); only how far
  // you have got is saved. What they give back is what they have: a basket,
  // wool, a pack, food, a carved charm, a thing they know how to make.
  // ============================================================

  const tlCap = (t) => t.charAt(0).toUpperCase() + t.slice(1);
  const tlAng = (a, b) =>
    Math.atan2(
      Math.hypot(
        a[1] * b[2] - a[2] * b[1],
        a[2] * b[0] - a[0] * b[2],
        a[0] * b[1] - a[1] * b[0],
      ),
      a[0] * b[0] + a[1] * b[1] + a[2] * b[2],
    );
  const RELS = [
    ["brother", "he", "him", "his"],
    ["sister", "she", "her", "her"],
    ["son", "he", "him", "his"],
    ["daughter", "she", "her", "her"],
    ["husband", "he", "him", "his"],
    ["wife", "she", "her", "her"],
    ["father", "he", "him", "his"],
    ["mother", "she", "her", "her"],
    ["friend", "they", "them", "their"],
  ];
  // the first thing they have that you do not: nobody needs two baskets
  function pickReward(t, has) {
    for (const o of t.rewards || [t.reward])
      if (!o.items.some(([id]) => has(id))) return o;
    return {
      items: [
        ["dried", 4],
        ["charm", 1],
      ],
    };
  }
  const WHY_GONE = {
    ruin: "to dig for old things in the rubble",
    tower: "to see if the old tower could be climbed",
    circle: "to ask the stones something. Don’t ask me what",
    barrow: "on a dare, to knock on the barrow door",
    bigtree: "to tie a ribbon on the old tree for luck",
    hotspring: "to soak an old hurt in the hot water",
    peak: "to look at the world from the top",
    battlefield: "to look for a grandfather’s sword among the dead ones",
  };
  // what someone needs, by who they are: [item, how many, why]
