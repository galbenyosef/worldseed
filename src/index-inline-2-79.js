// index-inline-2 79 — slots
// Lines 32911-33355 of readable/index-inline-2.pretty.js (statement-aligned).
  class Pack {
    constructor() {
      this.slots = []; // stacks: { id, n, wear, worn, mends, tag }
      this.coins = 0; // the purse
      this.body = Object.fromEntries(BODY_SLOTS.map((s) => [s.id, null]));
      this.pouch = []; // (older saves kept things here; they go back in the satchel)
      this.known = new Set(); // recipes you know
      this.unseen = new Set(); // learned but not looked at yet
      this.fresh = []; // learned since the game last asked
      this.version = 0; // bumps on every change, for the UI
    }
    get size() {
      let n = ARMS;
      for (const slot of ["back", "belt"]) {
        const b = this.body[slot];
        if (b && !b.worn && ITEMS[b.id].bag) n += ITEMS[b.id].bag;
      }
      return n;
    }
    changed() {
      this.version++;
    }
    // having something for the first time shows you what it is good for
    learnFrom(id) {
      for (const r of RECIPES)
        if (r.key === id && !this.known.has(r.id)) {
          this.known.add(r.id);
          this.unseen.add(r.id);
          this.fresh.push(r.id);
        }
    }
    learn(rid) {
      if (this.known.has(rid)) return false;
      this.known.add(rid);
      this.unseen.add(rid);
      this.fresh.push(rid);
      this.changed();
      return true;
    }
    // an oven, an anvil or a loom of your own shows you what it is for (an anvil wants charcoal, too)
    learnHome(kind) {
      let n = 0;
      for (const r of RECIPES) if (r.home === kind && this.learn(r.id)) n++;
      if (kind === "forge" && this.learn("charcoal")) n++;
      return n;
    }
    takeFresh() {
      const f = this.fresh;
      this.fresh = [];
      return f;
    }

    // ---- satchel ----
    count(id) {
      if (id === COIN) return this.coins;
      let n = 0;
      for (const s of this.slots) if (s.id === id && !s.worn) n += s.n;
      return n;
    }
    // how many of these would fit
    room(id) {
      if (id === COIN) return 1e9;
      const it = ITEMS[id],
        max = it ? it.stack : 1;
      let n = 0;
      for (const s of this.slots)
        if (s.id === id && !s.worn && s.wear == null) n += max - s.n;
      return n + (this.size - this.slots.length) * max;
    }
    // put things in; returns how many did not fit
    add(id, n = 1, extra = null) {
      if (id === COIN) {
        this.coins += Math.max(0, n);
        this.changed();
        return 0;
      }
      const it = ITEMS[id],
        max = it ? it.stack : 1;
      this.learnFrom(id);
      // a worn thing, or one of a kind (a deed for a particular house), keeps a slot of its own
      if (extra && (extra.wear != null || extra.worn || extra.tag != null)) {
        if (this.slots.length >= this.size) return n;
        const s = { id, n: 1 };
        if (extra.wear != null) s.wear = extra.wear;
        if (extra.worn) s.worn = true;
        if (extra.mends != null) s.mends = extra.mends;
        if (extra.tag != null) s.tag = extra.tag;
        this.slots.push(s);
        this.changed();
        return n - 1;
      }
      for (const s of this.slots) {
        if (!n) break;
        if (
          s.id !== id ||
          s.worn ||
          s.wear != null ||
          s.tag != null ||
          s.n >= max
        )
          continue;
        const k = Math.min(n, max - s.n);
        s.n += k;
        n -= k;
      }
      while (n > 0 && this.slots.length < this.size) {
        const k = Math.min(n, max);
        const s = { id, n: k };
        if (it && it.uses) s.wear = it.uses;
        this.slots.push(s);
        n -= k;
      }
      this.changed();
      return n;
    }
    take(id, n = 1) {
      if (id === COIN) {
        const k = Math.min(n, this.coins);
        this.coins -= k;
        this.changed();
        return k;
      }
      let left = n;
      for (let i = this.slots.length - 1; i >= 0 && left > 0; i--) {
        const s = this.slots[i];
        if (s.id !== id || s.worn) continue;
        const k = Math.min(left, s.n);
        s.n -= k;
        left -= k;
        if (!s.n) this.slots.splice(i, 1);
      }
      this.changed();
      return n - left;
    }
    // take from one particular slot (a deed, say); returns what was taken, as a slot
    takeSlot(i, n = 1) {
      const s = this.slots[i];
      if (!s) return null;
      const k = Math.min(n, s.n),
        out = { ...s, n: k };
      s.n -= k;
      if (!s.n) this.slots.splice(i, 1);
      this.changed();
      return out;
    }
    // a tool or thing you have anywhere on you
    has(what) {
      if (what === COIN) return this.coins > 0;
      const ok = (s) =>
        s &&
        !s.worn &&
        (s.id === what || (ITEMS[s.id] && ITEMS[s.id].tool === what));
      return (
        this.slots.some(ok) ||
        Object.values(this.body).some(ok) ||
        this.pouch.some(ok)
      );
    }

    // ---- body ----
    equip(index) {
      const s = this.slots[index];
      if (!s || s.worn) return null;
      const it = ITEMS[s.id];
      if (!it || !it.slot) return null;
      const one = s.n > 1 ? { ...s, n: 1 } : s;
      if (s.n > 1) s.n--;
      else this.slots.splice(index, 1);
      if (it.burn && one.wear == null) one.wear = it.burn; // a torch starts burning once it is in your hand
      const old = this.body[it.slot];
      this.body[it.slot] = one;
      if (old) this.unequipTo(old);
      this.changed();
      return it.slot;
    }
    unequip(slot) {
      const s = this.body[slot];
      if (!s) return false;
      // a bag can only come off if what it holds still fits
      if (ITEMS[s.id].bag && this.slots.length > this.size - ITEMS[s.id].bag)
        return false;
      if (
        this.slots.length >= this.size &&
        !(ITEMS[s.id].stack > 1 && this.room(s.id) > 0)
      )
        return false;
      this.body[slot] = null;
      this.unequipTo(s);
      this.changed();
      return true;
    }
    unequipTo(s) {
      if (s.wear != null || s.worn) {
        if (this.slots.length < this.size) this.slots.push(s);
        else this.spill = (this.spill || []).concat([s]);
      } else {
        const left = this.add(s.id, s.n);
        if (left)
          this.spill = (this.spill || []).concat([{ id: s.id, n: left }]);
      }
    }
    held(slot = "hand") {
      const s = this.body[slot];
      return s && !s.worn ? s : null;
    }
    // a tool of this kind that still works: the one in your hand, else the best one you carry
    tool(kind) {
      const h = this.held("hand");
      if (h && ITEMS[h.id].tool === kind) return h;
      let best = null;
      for (const s of this.slots)
        if (
          !s.worn &&
          ITEMS[s.id] &&
          ITEMS[s.id].tool === kind &&
          (!best || (s.wear ?? 0) > (best.wear ?? 0))
        )
          best = s;
      return best;
    }
    // use a tool once; when it is spent it stays with you as a keepsake. True when it wore out.
    wearTool(s, by = 1) {
      if (!s || s.wear == null) return false;
      s.wear -= by;
      this.changed();
      if (s.wear > 0) return false;
      s.wear = 0;
      s.worn = true;
      for (const [slot, b] of Object.entries(this.body))
        if (b === s) {
          this.body[slot] = null;
          this.unequipTo(s);
        }
      return true;
    }
    warmth() {
      let w = 0;
      for (const s of Object.values(this.body))
        if (s && ITEMS[s.id] && ITEMS[s.id].warmth) w += ITEMS[s.id].warmth;
      return w;
    }
    // how much of a blow what you wear turns aside
    armour() {
      let a = 0;
      for (const s of Object.values(this.body))
        if (s && !s.worn && ITEMS[s.id] && ITEMS[s.id].armor)
          a += ITEMS[s.id].armor;
      return a;
    }
    // arrows you carry, best first
    arrows() {
      return ["obarrow", "arrow"].find((id) => this.count(id) > 0) || null;
    }
    // wear a held tool down; when it is spent it becomes a keepsake
    wearDown(slot = "hand", by = 1) {
      const s = this.body[slot];
      if (!s || s.wear == null) return false;
      s.wear -= by;
      this.changed();
      if (s.wear > 0) return false;
      s.wear = 0;
      s.worn = true;
      this.body[slot] = null;
      this.unequipTo(s);
      return true;
    }

    // ---- making things ----
    // where you are decides some of it: ctx = { fire, bench }
    state(r, ctx = {}) {
      const missing = [];
      let times = Infinity;
      for (const [id, n] of Object.entries(r.in)) {
        const have = this.count(id);
        if (have < n) missing.push({ id, n: n - have });
        if (!(r.keep && r.keep.includes(id)))
          times = Math.min(times, Math.floor(have / n));
      }
      if (!isFinite(times)) times = 1;
      const lack = r.needs && !this.has(r.needs) ? r.needs : null;
      const away = r.at && !ctx[r.at] ? r.at : null;
      // is there room for what comes out? Using up a whole stack of parts makes room too.
      const [oid, on] = r.out,
        it = ITEMS[oid];
      let fits =
        this.room(oid) >= on ||
        (it.kind === "wear" && it.slot && !this.body[it.slot] && on === 1);
      if (!fits)
        for (const [id, n] of Object.entries(r.in))
          if (!(r.keep && r.keep.includes(id)) && this.count(id) === n) {
            fits = true;
            break;
          }
      return {
        missing,
        lack,
        away,
        full: !fits,
        ready: !missing.length && !lack && !away && fits,
        times,
      };
    }
    // everything you know, ready first
    recipes(ctx = {}) {
      const out = [];
      for (const r of RECIPES)
        if (this.known.has(r.id))
          out.push({ recipe: r, ...this.state(r, ctx) });
      return out.sort(
        (a, b) => b.ready - a.ready || a.missing.length - b.missing.length,
      );
    }
    // what one thing can become: the known recipes that use it
    uses(id, ctx = {}) {
      return RECIPES.filter((r) => this.known.has(r.id) && r.in[id]).map(
        (r) => ({ recipe: r, ...this.state(r, ctx) }),
      );
    }
    make(recipe, ctx = {}) {
      const st = this.state(recipe, ctx);
      if (!st.ready) return null;
      for (const [k, n] of Object.entries(recipe.in))
        if (!(recipe.keep && recipe.keep.includes(k))) this.take(k, n);
      const [id, n] = recipe.out;
      // tools and things to wear go straight on if that part of you is free
      const it = ITEMS[id];
      let where = "satchel";
      if (it.slot && !this.body[it.slot] && n === 1 && it.kind === "wear") {
        this.body[it.slot] = { id, n: 1 };
        where = it.slot;
      } else {
        const left = this.add(id, n);
        if (left) {
          this.spill = (this.spill || []).concat([{ id, n: left }]);
          where = "ground";
        }
      }
      this.changed();
      return { id, n, where };
    }
    // ---- mending worn tools, at a work stone (or at an anvil of your own: anything, as often as it needs) ----
    mendState(s, ctx = {}) {
      if (!s || !ITEMS[s.id] || !ITEMS[s.id].uses) return null;
      const anvil = !!ctx.anvil,
        base = MEND[s.id] || (anvil ? MEND_FORGE[s.id] : null);
      // (worn right out, it can only be made good again at an anvil, for twice the parts)
      const twice = (q) =>
        s.worn
          ? Object.fromEntries(Object.entries(q).map(([id, n]) => [id, n * 2]))
          : q;
      if (!base)
        return MEND_FORGE[s.id] && (s.worn || s.wear < ITEMS[s.id].uses)
          ? {
              need: twice(MEND_FORGE[s.id]),
              left: Infinity,
              worn: true,
              missing: [],
              away: true,
              ready: false,
              forge: true,
            }
          : null;
      if (s.worn && !anvil) return null;
      const need = twice(base);
      const max = ITEMS[s.id].uses,
        left = anvil ? Infinity : (s.mends ?? MENDS),
        wornDown = s.worn || (s.wear ?? max) < max;
      const missing = Object.entries(need)
        .filter(([id, n]) => this.count(id) < n)
        .map(([id, n]) => ({ id, n: n - this.count(id) }));
      const at = anvil || !!ctx.bench;
      return {
        need,
        left,
        worn: wornDown,
        missing,
        away: !at,
        anvil,
        ready: left > 0 && wornDown && !missing.length && at,
      };
    }
    mend(s, ctx = {}) {
      const st = this.mendState(s, ctx);
      if (!st || !st.ready) return false;
      for (const [id, n] of Object.entries(st.need)) this.take(id, n);
      s.wear = ITEMS[s.id].uses;
      if (s.worn) s.worn = false;
      if (!st.anvil) s.mends = st.left - 1;
      this.changed();
      return true;
    }
    // older saves: whatever was left in the pouch goes back in the satchel
    emptyPouch() {
      const spill = [];
      for (const s of this.pouch) {
        const left = this.add(s.id, s.n);
        if (left) spill.push({ id: s.id, n: left });
      }
      this.pouch = [];
      this.changed();
      return spill;
    }
    takeSpill() {
      const s = this.spill || [];
      this.spill = null;
      return s;
    }

    // ---- saving ----
    toJSON() {
      return {
        slots: this.slots.map(slotRow),
        body: Object.fromEntries(
          Object.entries(this.body).map(([k, s]) => [k, slotRow(s)]),
        ),
        known: [...this.known],
        coins: this.coins,
      };
    }
    static fromJSON(o) {
      const p = new Pack();
      const st = slotFrom;
      p.slots = (o.slots || []).map(st).filter(Boolean);
      p.coins = Math.max(0, Math.floor(o.coins || 0));
      // older saves kept old coin in the satchel: into the purse with it
      for (let i = p.slots.length - 1; i >= 0; i--)
        if (p.slots[i].id === COIN) {
          p.coins += p.slots[i].n;
          p.slots.splice(i, 1);
        }
      for (const k of Object.keys(p.body)) p.body[k] = st(o.body && o.body[k]);
      for (const id of o.known || [])
        if (RECIPES.some((r) => r.id === id)) p.known.add(id);
      // what you carry teaches you, even from an old save
      for (const s of p.slots) p.learnFrom(s.id);
      for (const s of Object.values(p.body)) if (s) p.learnFrom(s.id);
      p.unseen.clear();
      p.fresh = [];
      p.pouch = (o.pouch || []).map(st).filter(Boolean);
      p.emptyPouch();
      return p;
    }
  }

  // a stack as a row for saving, and back: [id, n, wear, worn, mends, tag]
