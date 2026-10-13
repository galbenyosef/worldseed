// index-inline-2 124 — pack
// Lines 61988-62431 of readable/index-inline-2.pretty.js (statement-aligned).
  class PackUI {
    constructor(hooks) {
      this.hooks = hooks; // { act(kind, arg), close() }
      this.sel = null; // selected satchel index
      this.tab = "bag";
      this.ctx = {};
      this.log = "";
      $p("ptBag").addEventListener("click", () => {
        this.tab = "bag";
        this.render();
      });
      $p("ptMake").addEventListener("click", () => {
        this.tab = "make";
        this.render();
      });
      $p("ptBody").addEventListener("click", () => {
        this.tab = "body";
        this.render();
      });
      $p("ptNotes").addEventListener("click", () => {
        this.tab = "notes";
        this.render();
      });
      $p("packClose").addEventListener("click", () => this.hooks.close());
      $p("gPack").addEventListener("click", (e) => {
        if (e.target === $p("gPack")) this.hooks.close();
      });
    }
    get open() {
      return !$p("gPack").hidden;
    }
    // ctx: { fire: the fire you are at, bench: the work stone you are at, and at home an oven, an anvil, a loom; tab }
    show(pack, body, ctx = {}) {
      this.pack = pack;
      this.body = body;
      this.ctx = ctx;
      this.notes = ctx.notes || [];
      this.sel = null;
      this.log = ctx.log || "";
      this.tab = ctx.tab || "bag";
      $p("gPack").hidden = false;
      this.render();
      $p("packClose").focus({ preventScroll: true });
    }
    hide() {
      $p("gPack").hidden = true;
    }
    say(msg) {
      this.log = msg;
      const el = $p("packLog");
      if (el) el.textContent = msg;
    }
    flags() {
      return {
        fire: !!this.ctx.fire,
        bench: !!this.ctx.bench,
        oven: !!this.ctx.oven,
        anvil: !!this.ctx.anvil,
        loom: !!this.ctx.loom,
      };
    }
    slotHtml(s, i) {
      if (!s) return `<span class="pslot empty" aria-hidden="true"></span>`;
      const it = ITEMS[s.id],
        name = itemName(s.id, s.n, s.worn);
      const wear =
        s.wear != null && !s.worn && it.uses
          ? `<span class="wear"><i style="width:${Math.round((100 * s.wear) / it.uses)}%"></i></span>`
          : "";
      const sel = this.sel === i ? " sel" : "";
      return `<button type="button" class="pslot${sel}" data-i="${i}" title="${pEsc(name)}" aria-label="${pEsc(s.n > 1 ? s.n + " " + name : name)}"><img src="${itemIcon(s.id, !!s.worn)}" alt="">${s.n > 1 ? `<span class="n">${s.n}</span>` : ""}${wear}</button>`;
    }
    // one line of what a recipe takes, marking what you are missing
    partsHtml(r) {
      const parts = Object.entries(r.in).map(([id, n]) => {
        const have = this.pack.count(id) >= n;
        const kept = r.keep && r.keep.includes(id) ? " (kept)" : "";
        return `<span class="${have ? "have" : "miss"}">${pEsc(partWords(id, n) + kept)}</span>`;
      });
      // and the tool it takes, always shown (a flint you turn into blades is a fire you cannot light)
      if (r.needs)
        parts.push(
          `<span class="${this.pack.has(r.needs) ? "have" : "miss"}">${pEsc(r.needs === "flint" ? "a flint for the spark (kept)" : `${/^[aeiou]/.test(r.needs) ? "an" : "a"} ${r.needs} (kept)`)}</span>`,
        );
      return parts.join(", ");
    }
    recipeRow(o) {
      const r = o.recipe,
        [oid, on] = r.out;
      const name =
        r.name || (on > 1 ? `${on} ${lowerName(oid, on)}` : itemName(oid));
      let why = "";
      if (o.missing.length) why = "";
      else if (o.lack)
        why =
          o.lack === "flint"
            ? "You need flint on you for a spark."
            : `You need ${countWords(o.lack, 1)} on you.`;
      else if (o.away) why = `Made ${PLACES[o.away]}.`;
      else if (o.full) why = "No room for it. Drop something, or wear a bag.";
      const where =
        r.at && !o.away && !why ? `<em>${pEsc(PLACES[r.at])}</em>` : "";
      const isNew = this.pack.unseen.has(r.id)
        ? '<span class="pnew">New</span>'
        : "";
      const all =
        o.ready && o.times > 1
          ? `<button type="button" class="btn mini" data-makeall="${r.id}">All ${Math.min(o.times, 99)}</button>`
          : "";
      return `<div class="popt"><div class="what"><img src="${itemIcon(oid)}" alt=""><div><span>${pEsc(name)} ${isNew}</span><small class="parts">${this.partsHtml(r)}${where ? " · " + where : ""}</small>${why ? `<small class="why">${pEsc(why)}</small>` : ""}</div></div><span class="pacts">${all}<button type="button" class="btn mini${o.ready ? " primary" : ""}" data-make="${r.id}"${o.ready ? "" : ' aria-disabled="true"'}>Make</button></span></div>`;
    }
    render() {
      const pack = this.pack;
      if (!pack) return;
      for (const [tab, id] of [
        ["bag", "ptBag"],
        ["make", "ptMake"],
        ["body", "ptBody"],
        ["notes", "ptNotes"],
      ])
        $p(id).setAttribute("aria-selected", String(this.tab === tab));
      $p("ptMake").textContent =
        pack.unseen.size && this.tab !== "make" ? "Make •" : "Make";
      $p("pBagView").hidden = this.tab !== "bag";
      $p("pMakeView").hidden = this.tab !== "make";
      $p("pBodyView").hidden = this.tab !== "body";
      $p("pNotesView").hidden = this.tab !== "notes";
      $p("packLog").textContent = this.log;
      this.renderPlace();
      if (this.tab === "body") this.renderBody();
      else if (this.tab === "notes") this.renderNotes();
      else if (this.tab === "make") this.renderMake();
      else this.renderBag();
      this.wire();
    }
    // where you are: a fire to feed, or a work stone; at home the hearth, an oven, a bench and an anvil, a loom
    renderPlace() {
      const f = this.ctx.fire,
        b = this.ctx.bench,
        ov = this.ctx.oven,
        an = this.ctx.anvil,
        lm = this.ctx.loom;
      const el = $p("pPlace");
      el.hidden = !f && !b && !an && !lm;
      if (el.hidden) return;
      let h = "";
      const row = (icon, text) =>
        `<div class="prow"><img src="${itemIcon(icon)}" alt=""><span>${pEsc(text)}</span></div>`;
      if (ov)
        h += row(
          "deedoven",
          "At your oven. It is hot through: bread, pies and waybread bake here, and anything a fire can do, it can.",
        );
      else if (f && f.hearth)
        h += row(
          "campfire",
          "By your own hearth. It never quite goes out: anything that wants a fire can be made here.",
        );
      else if (f) {
        const fuel = f.fuel || 0;
        const burn =
          fuel <= 0
            ? "The fire is out. Add sticks or a log to light it again."
            : fuel < 1
              ? "The fire is burning low."
              : `The fire will burn for about ${Math.round(fuel)} hour${Math.round(fuel) === 1 ? "" : "s"}.`;
        const sticks = this.pack.count("stick"),
          logs = this.pack.count("log");
        h += `<div class="prow"><img src="${itemIcon("campfire")}" alt=""><span>By the fire. ${pEsc(burn)}</span><span class="pacts">${sticks >= 2 ? `<button type="button" class="btn mini" data-fuel="stick">Add 2 sticks</button>` : ""}${logs ? `<button type="button" class="btn mini" data-fuel="log">Add a log</button>` : ""}</span></div>`;
      }
      if (an)
        h += row(
          "deedforge",
          "At your bench and anvil. Tools are made here and mended as often as they need it, even ones worn right out, and with ore and charcoal copper is beaten into shape.",
        );
      else if (b)
        h += `<div class="prow"><img src="${itemIcon("workstone")}" alt=""><span>At your work stone. Tools can be made and mended here.</span></div>`;
      if (lm)
        h += row(
          "deedloom",
          "At your loom. Wool is woven into cloth here, and cloth into cloaks and hangings.",
        );
      el.innerHTML = h;
    }
    renderBag() {
      const pack = this.pack;
      const bags = ["back", "belt"]
        .map((k) => pack.body[k])
        .filter((s) => s && ITEMS[s.id].bag)
        .map((s) => itemName(s.id));
      $p("bagLabel").textContent =
        `${bags.length ? bags.join(" and ") : "Your arms"} · ${pack.slots.length} of ${pack.size}`;
      // the purse: old coin takes no room
      $p("bagPurse").innerHTML =
        `<img src="${itemIcon("purse")}" alt=""><span>${pack.coins ? pEsc(coinWords(pack.coins)) : "Your purse is empty"}</span>`;
      let g = "";
      for (let i = 0; i < pack.size; i++) g += this.slotHtml(pack.slots[i], i);
      $p("bagGrid").innerHTML = g;
      const s = this.sel != null ? pack.slots[this.sel] : null;
      if (!s) {
        $p("bagInfo").innerHTML =
          `<p class="phint">${pack.slots.length ? "Tap something to see what it is and what you can do with it. What you can make is under Make." : `Nothing yet. Look for sticks, stones and tall grass, and ${matchMedia("(pointer: coarse)").matches ? "tap the word that comes up" : "press E"} to pick them up. Each new thing you find teaches you something to make: it is under Make.`}</p>`;
        return;
      }
      const it = ITEMS[s.id];
      const acts = [];
      if (it.kind === "food" && !s.worn) acts.push(["eat", "Eat one"]);
      if (it.kind === "draught") acts.push(["drink", "Drink it"]);
      if (it.tool === "flute") acts.push(["play", "Play it"]);
      if (it.slot && !s.worn)
        acts.push(["equip", it.kind === "tool" ? "Hold" : "Wear"]);
      if (it.kind === "place") acts.push(["place", "Put it down here"]);
      if (it.kind === "deed")
        acts.push(
          it.deed === "stall"
            ? ["stallup", "Set it up by your door"]
            : it.deed === "field"
              ? ["yardup", "Have it dug beside your house"]
              : it.deed === "pen"
                ? ["yardup", "Have it put up beside your house"]
                : it.deed === "porch"
                  ? ["yardup", "Have it built onto your house"]
                  : it.deed === "tohouse" || it.deed === "tohall"
                    ? ["growup", "Have your house built bigger"]
                    : it.deed === "oven" ||
                        it.deed === "forge" ||
                        it.deed === "loom"
                      ? ["workup", "Have it built into your house"]
                      : it.deed === "well" ||
                          it.deed === "hives" ||
                          it.deed === "stable" ||
                          it.deed === "palisade"
                        ? [
                            "yardup",
                            it.deed === "palisade"
                              ? "Have it put up round your house"
                              : "Have it put in by your house",
                          ]
                        : ["place", "Choose where it stands"],
        );
      // at home: set it out somewhere, or hang it on a wall
      if (this.ctx.home && it.kind !== "quest")
        acts.push(["display", "Set it out here"]);
      if (this.ctx.fire && it.fuel) acts.push(["burn", "Onto the fire"]);
      acts.push(["drop", s.n > 1 ? "Drop them" : "Drop it"]);
      let extra = s.worn
        ? MEND[s.id] || MEND_FORGE[s.id]
          ? "Worn right out. At an anvil of your own it could be made good again; or keep it, and one day it could hang on a wall of your own."
          : "Worn past mending. Keep it; one day it could hang on a wall of your own."
        : s.wear != null && it.uses
          ? `${Math.round((100 * s.wear) / it.uses)}% left before it is worn out.`
          : "";
      // how hard it hits, if it comes to that; how much of a blow it turns aside
      if (it.dmg && !s.worn && it.kind !== "ammo")
        extra += ` In a fight it strikes for about ${it.dmg}${it.reach && it.reach > 2.3 ? ", and reaches further than most" : ""}.`;
      if (it.kind === "ammo")
        extra += ` Loosed from a bow at full draw it strikes for about ${it.dmg}.`;
      if (it.armor && !s.worn)
        extra += ` Worn, it turns aside about ${Math.round(100 * (1 - 20 / (20 + it.armor)))}% of a blow on its own.`;
      // whose way a deed's house is built in, and so on
      const more = this.hooks.describe ? this.hooks.describe(s) : "";
      if (more) extra += " " + more;
      // what a trader would give for it
      if (sellable(s.id)) {
        const one = sellPrice(s, 1),
          all = sellPrice(s, s.n);
        extra +=
          all < 1
            ? " Not worth a coin to a trader."
            : s.n > 1
              ? ` A trader would give ${coinWords(all)} for the lot.`
              : ` A trader would give ${coinWords(one)} for it.`;
      }
      // (a worn tool is mended under Make, with everything else you make)
      const ms = pack.mendState(s, this.flags());
      if (ms && ms.worn) extra += " It can be mended: see Make.";
      const h = `<h4>${pEsc(s.n > 1 ? `${s.n} ${lowerName(s.id, s.n)}` : itemName(s.id, 1, s.worn))}</h4><p>${pEsc(it.desc)}${extra ? " " + pEsc(extra) : ""}</p><div class="pacts">${acts.map(([k, l], j) => `<button type="button" class="btn mini${j === 0 ? " primary" : ""}" data-act="${k}">${pEsc(l)}</button>`).join("")}</div>`;
      $p("bagInfo").innerHTML = h;
    }
    // the tools you carry or hold that are worn down, and what mending each takes: [{ s, ms, key }]
    // (key: 's3' for the satchel's fourth place, 'b:hand' for what is in your hand)
    mendable() {
      const pack = this.pack,
        f = this.flags(),
        out = [];
      pack.slots.forEach((s, i) => {
        const ms = pack.mendState(s, f);
        if (ms && ms.worn) out.push({ s, ms, key: "s" + i });
      });
      for (const sl of BODY_SLOTS) {
        const s = pack.body[sl.id],
          ms = s ? pack.mendState(s, f) : null;
        if (ms && ms.worn) out.push({ s, ms, key: "b:" + sl.id, on: sl.id });
      }
      return out;
    }
    mendRow({ s, ms, key, on }) {
      const pack = this.pack;
      const parts = Object.entries(ms.need)
        .map(
          ([id, n]) =>
            `<span class="${pack.count(id) >= n ? "have" : "miss"}">${pEsc(partWords(id, n))}</span>`,
        )
        .join(", ");
      const why = ms.forge
        ? "Mended only at an anvil of your own."
        : ms.left <= 0
          ? "It can’t be mended again, except at an anvil of your own."
          : ms.away
            ? "Mended at a work stone or a bench."
            : "";
      const how = s.worn
        ? "make it good again"
        : ms.left === Infinity
          ? ms.anvil
            ? "mend it at the anvil"
            : "mend it"
          : `mend it (${ms.left} more time${ms.left === 1 ? "" : "s"})`;
      const it = ITEMS[s.id],
        left =
          s.wear != null && !s.worn && it.uses
            ? `, ${Math.round((100 * s.wear) / it.uses)}% left`
            : "";
      const where = on
        ? ` ${{ hand: "in your hand", off: "in your other hand", head: "on your head", body: "round your shoulders", chest: "on your chest", feet: "on your feet", back: "on your back", belt: "on your belt" }[on] || ""}`
        : "";
      return `<div class="popt"><div class="what"><img src="${itemIcon(s.id, !!s.worn)}" alt=""><div><span>${pEsc(itemName(s.id, 1, s.worn) + where + left)}</span><small class="parts">To ${pEsc(how)}: ${parts}</small>${why ? `<small class="why">${pEsc(why)}</small>` : ""}</div></div><span class="pacts"><button type="button" class="btn mini${ms.ready ? " primary" : ""}" data-mend="${key}"${ms.ready ? "" : ' aria-disabled="true"'}>Mend</button></span></div>`;
    }
    renderMake() {
      const pack = this.pack;
      const list = pack.recipes(this.flags());
      let h = "";
      // worn tools first: mending them is making them good again
      const worn = this.mendable();
      if (worn.length)
        h +=
          `<span class="plabel">Mend</span>` +
          worn.map((o) => this.mendRow(o)).join("");
      if (!list.length)
        h += `<p class="phint${worn.length ? " pgap" : ""}">You don’t know how to make anything yet. Pick things up: each new thing you find shows you what it can be made into.</p>`;
      else {
        const ready = list.filter((o) => o.ready),
          place = list.filter(
            (o) => !o.ready && o.away && !o.missing.length && !o.lack,
          ),
          rest = list.filter(
            (o) => !o.ready && !(o.away && !o.missing.length && !o.lack),
          );
        let first = !worn.length;
        const group = (label, rows) => {
          if (!rows.length) return;
          h +=
            `<span class="plabel${first ? "" : " pgap"}">${label}</span>` +
            rows.map((o) => this.recipeRow(o)).join("");
          first = false;
        };
        group("Ready now", ready);
        group("Ready somewhere else", place);
        group("Missing something", rest);
      }
      $p("makeList").innerHTML = h;
      // seen now
      pack.unseen.clear();
    }
    renderBody() {
      const pack = this.pack;
      let h = "";
      for (const sl of BODY_SLOTS) {
        const s = pack.body[sl.id];
        h += `<div class="row"><span class="pslot${s ? "" : " empty"}" aria-hidden="true">${s ? `<img src="${itemIcon(s.id, !!s.worn)}" alt="">` : ""}</span><div><small class="plabel">${pEsc(sl.name)}</small><div>${s ? pEsc(itemName(s.id, 1, s.worn)) : '<span class="dim">Nothing</span>'}</div>${s ? `<button type="button" class="btn mini" data-off="${sl.id}">Take off</button>` : ""}</div></div>`;
      }
      h += `<div class="row"><span class="pslot" aria-hidden="true"><img src="${itemIcon("note")}" alt=""></span><div><small class="plabel">In your fist</small><div>The note</div><button type="button" class="btn mini" data-note="1">Read it</button></div></div>`;
      $p("bodySlots").innerHTML = h;
      const arm = pack.armour();
      $p("bodyWords").textContent =
        (this.body ? this.body.words() : "") +
        (arm
          ? ` What you wear turns aside about ${Math.round(100 * (1 - 20 / (20 + arm)))}% of every blow.`
          : "");
    }
    // what you were told and what you read, newest first: no map, only words
    renderNotes() {
      let h = `<div class="pnote fist"><img src="${itemIcon("note")}" alt=""><span>The note in your fist, in your own hand.</span><button type="button" class="btn mini" data-note="1">Read it</button></div>`;
      const list = this.notes.slice().reverse();
      if (!list.length)
        h += `<p class="phint">Nothing yet. There are no maps here: ask people the way, read what is carved on old stones, and climb something high to look around. What you learn is kept here, in the words you heard it.</p>`;
      for (const n of list)
        h += `<div class="pnote"><p>${pEsc(n.text)}</p><small>${pEsc(n.who || "")}${n.day != null ? ` · day ${n.day}` : ""}</small></div>`;
      $p("notesList").innerHTML = h;
    }
    wire() {
      const box = $p("gPack");
      box.querySelectorAll(".pslot[data-i]").forEach((b) => {
        b.onclick = () => {
          const i = +b.dataset.i;
          if (this.sel === i) {
            this.hooks.act("primary", i);
            return;
          }
          this.sel = i;
          this.render();
        };
      });
      box.querySelectorAll("[data-act]").forEach((b) => {
        b.onclick = () => this.hooks.act(b.dataset.act, this.sel);
      });
      box.querySelectorAll("[data-make]").forEach((b) => {
        b.onclick = () => this.hooks.act("make", RECIPE[b.dataset.make]);
      });
      box.querySelectorAll("[data-makeall]").forEach((b) => {
        b.onclick = () => this.hooks.act("makeall", RECIPE[b.dataset.makeall]);
      });
      // (what to mend: a place in the satchel, or what you wear or hold)
      box.querySelectorAll("[data-mend]").forEach((b) => {
        b.onclick = () => {
          const k = b.dataset.mend;
          this.hooks.act(
            "mend",
            k[0] === "s" ? +k.slice(1) : { bodySlot: k.slice(2) },
          );
        };
      });
      box.querySelectorAll("[data-fuel]").forEach((b) => {
        b.onclick = () => this.hooks.act("fuel", b.dataset.fuel);
      });
      box.querySelectorAll("[data-off]").forEach((b) => {
        b.onclick = () => this.hooks.act("unequip", b.dataset.off);
      });
      box.querySelectorAll("[data-note]").forEach((b) => {
        b.onclick = () => this.hooks.act("note");
      });
    }
  }

  // ---- ui/tradeui.js ----
  // ============================================================
  // TRADE UI — a trader's goods beside your satchel, or your chest at home
  // beside your satchel. Buying takes old coin from your purse; traders pay
  // half what a thing is worth. Anything worth a fair bit asks once more
  // before it goes. At home the chest keeps whatever you put in it, and the
  // stall by your door shows what is out on it, what each lot asks, and what
  // has sold.
  // ============================================================

