// index-inline-2 147 — rec
// Lines 69431-69775 of readable/index-inline-2.pretty.js (statement-aligned).
  function raidTake(rec) {
    const out = [],
      rnd = Math.random;
    const st = rec.stall;
    if (st && st.cash > 0) {
      const c = Math.ceil(st.cash / 2);
      st.cash -= c;
      out.push(coinWords(c) + " from the stall");
    }
    if (st && st.goods && st.goods.length && rnd() < 0.7) {
      const i = Math.floor(rnd() * st.goods.length),
        q = slotFrom(st.goods[i].s);
      st.goods.splice(i, 1);
      if (q)
        out.push(
          theWords({ id: q.id, n: q.n, worn: q.worn }).replace(
            /^the /,
            "the ",
          ) + " off the stall",
        );
    }
    const pen = rec.pen;
    if (pen && pen.beasts.length && rnd() < 0.6) {
      const hens = pen.beasts.filter((b) => b.k === "hen");
      if (hens.length && rnd() < 0.7) {
        const n = Math.min(hens.length, 1 + Math.floor(rnd() * 2));
        for (let k = 0; k < n; k++)
          pen.beasts.splice(pen.beasts.indexOf(hens[k]), 1);
        out.push(n > 1 ? `${n} of your hens` : "one of your hens");
      } else {
        const b = pen.beasts[Math.floor(rnd() * pen.beasts.length)];
        pen.beasts.splice(pen.beasts.indexOf(b), 1);
        out.push(
          b.n
            ? `${b.n}, your ${BEASTS[b.k] ? BEASTS[b.k].word : b.k}`
            : `one of your ${BEASTS[b.k] ? BEASTS[b.k].words : "animals"}`,
        );
      }
    }
    if (rec.hives && rec.hives.ready) {
      out.push("the honey");
      rec.hives.ready = 0;
    }
    if (!out.length && rec.chest && rec.chest.length) {
      const can = rec.chest
        .map((c, i) => [c, i])
        .filter(
          ([c]) =>
            ITEMS[c[0]] &&
            ITEMS[c[0]].kind !== "deed" &&
            ITEMS[c[0]].kind !== "quest",
        );
      if (can.length) {
        const [c, i] = can[Math.floor(rnd() * can.length)];
        rec.chest.splice(i, 1);
        out.push(countWords(c[0], c[1]) + " from your chest");
      }
    }
    return out;
  }
  // ---- setting things out at home ----
  function startDecor(i) {
    const s = G.pack.slots[i],
      v = ground.homeHere();
    if (!s) return;
    if (!v) {
      packUI.say("Only in a house of your own.");
      return;
    }
    const rec = v.home,
      capN = HOME_SIZE[rec.size].show;
    G.placing = s.id;
    G.decorPick = { ref: s, id: s.id };
    closePack();
    ground.startGhost("decor", {
      id: s.id,
      worn: !!s.worn,
      full: (rec.decor || []).length >= capN,
    });
    gotNote(
      `Aim at the floor, a table, a shelf or a wall · ${coarse() ? "Turn" : "R"} turns it`,
    );
  }
  function placeDecor(gh) {
    const v = gh.v,
      rec = v && v.home,
      hit = gh.hit;
    if (!rec || !hit || !G.decorPick) return;
    const pk = G.pack;
    let i = pk.slots.indexOf(G.decorPick.ref);
    if (i < 0) i = pk.slots.findIndex((q) => q.id === G.decorPick.id);
    if (i < 0) {
      cancelPlace();
      return;
    }
    const one = pk.takeSlot(i, 1);
    (rec.decor = rec.decor || []).push({
      s: slotRow(one),
      x: +hit.x.toFixed(3),
      y: +hit.y.toFixed(3),
      z: +hit.z.toFixed(3),
      b: +hit.bear.toFixed(4),
      f: hit.flat ? 1 : 0,
      r: hit.flat ? 0 : +gh.rot.toFixed(4),
    });
    cancelPlace();
    ground.refreshHome(rec);
    gotNote(
      hit.flat
        ? `You set down ${countWords(one.id, 1)}`
        : `You hang ${countWords(one.id, 1)} on the wall`,
    );
    saveLife();
  }
  function takeDecor(v, i) {
    const rec = v.home,
      d = rec && rec.decor && rec.decor[i],
      s = d && slotFrom(d.s);
    if (!d) return;
    if (!s) {
      rec.decor.splice(i, 1);
      ground.refreshHome(rec);
      return;
    }
    const left = G.pack.add(s.id, s.n, slotExtra(s));
    if (left === s.n) {
      gotNote("No room to carry it");
      return;
    }
    rec.decor.splice(i, 1);
    ground.refreshHome(rec);
    gotNote(`+ ${countWords(s.id, s.n - left)}`);
    saveLife();
  }
  function teachPages(who, rid) {
    const r = RECIPE[rid],
      [oid] = r.out;
    G.pack.learn(rid);
    G.pack.takeFresh();
    saveLife();
    return [
      { who, text: `"${TEACH[rid]}"` },
      {
        who: null,
        text: `You learn to make ${r.out[1] > 1 ? lowerName(oid, 2) : countWords(oid, 1)}. (It is in your satchel’s Make list now.)`,
      },
    ];
  }
  // ---- tales: someone needs something ----
  const taleDef = (id) => {
    const s = ground.siteIx.get(String(id).slice(1));
    return s ? taleFor(state.story, ground.siteIx, s) : null;
  };
  // the tales you have taken on that end at a place
  function talesAt(kind, siteId) {
    const out = [];
    for (const id of Object.keys(G.tales)) {
      const t = taleDef(id);
      if (t && t.kind === kind && t.target === siteId) out.push(t);
    }
    return out;
  }
  function startTale(t, s, note) {
    G.tales[t.id] = { st: "on", day: dayNum() };
    addNote({ text: note, who: "Asked of you" });
    const give = (id) => {
      const left = G.pack.add(id, 1);
      if (left) ground.addDrop(id, left, frontSpot(0.8));
    };
    if (t.kind === "deliver") {
      give("parcel");
      gotNote(`+ ${t.thing}, to carry`);
    }
    if (t.kind === "offer") {
      give("offering");
      gotNote(`+ ${t.thing}, to leave`);
    }
    if (t.kind === "recover") {
      // it lies at the far place, a little way from the middle
      const B = ground.siteIx.get(t.target);
      if (B && !G.world.drops.some((d) => d.tale === t.id)) {
        const sp = sitePlan(state.story, B).spots[0] || { x: 0, z: 0 };
        const F = frameAt(B.dir),
          out =
            Math.hypot(sp.x, sp.z) > 0.5 ? 1 + 1.4 / Math.hypot(sp.x, sp.z) : 0;
        const x = sp.x * out + (out ? 0 : 2.2),
          z = sp.z * out + (out ? 0 : 1.2);
        ground.addDrop("heirloom", 1, stepOn(B.dir, F, x, -z, ground.R), {
          tale: t.id,
        });
      }
    }
    if (t.kind === "lost") ground.refreshSite(t.target);
    saveLife();
  }
  // things to wear or carry things in: one is enough
  const ownsGear = (id) =>
    (ITEMS[id].bag || ITEMS[id].kind === "wear") &&
    (G.pack.count(id) > 0 ||
      Object.values(G.pack.body).some((b) => b && b.id === id));
  function giveReward(t, rw = pickReward(t, ownsGear)) {
    const got = [];
    for (const [id, n] of rw.items) {
      const left = G.pack.add(id, n);
      if (left) ground.addDrop(id, left, frontSpot(0.8));
      got.push({ id, n });
    }
    dropSpill(G.pack.takeSpill());
    if (G.pack.fresh.length) setTimeout(() => noteFresh(), 1500);
    return `You get ${listWords(got)}.`;
  }
  // the lost one, found out there
  function talkLost(v, p, f) {
    const t = taleDef(f.lostTale),
      ts = t && G.tales[t.id];
    if (!t || !ts) return;
    const hooks = {
      noChronicle: true,
      onClose: () => {
        ground.talkTo = null;
      },
    };
    if (ts.st !== "on") {
      openDialog(
        [{ who: t.lost, text: '"Go on ahead. I’ll be along, slowly."' }],
        hooks,
      );
      return;
    }
    const food = firstFood();
    const pages = lostFound(state.story, ground.siteIx, v.site, t, !!food);
    if (food) {
      G.pack.take(food.id, 1);
      ts.st = "found";
      addNote({
        text: `You found ${t.lost} at ${siteName(state.story, v.site)}, hurt and hungry, and fed ${t.him}. ${t.he === "they" ? "They are" : cap(t.he) + " is"} making for home.`,
        who: "Done",
      });
      hooks.onClose = () => {
        ground.talkTo = null;
        p.leaving = { dir: Math.random() * 6.28, t: 0 };
        ground.refreshSite(t.site);
        saveLife();
      };
    }
    openDialog(pages, hooks);
  }
  // the lost ones where they are: out at the far place, or home again
  function visitorsAt(s) {
    const out = [];
    for (const id of Object.keys(G.tales || {})) {
      const ts = G.tales[id];
      const t = taleDef(id);
      if (!t || t.kind !== "lost") continue;
      const here =
        (ts.st === "on" && t.target === s.id) ||
        (ts.st !== "on" && t.site === s.id);
      if (!here) continue;
      const A = ground.siteIx.get(t.site),
        people = A && A.owner >= 0 ? state.story.peoples[A.owner] : null;
      const at = ts.st === "on" ? [2.6, 1.8] : [3.2, 5.5];
      out.push({
        k: 90,
        x: at[0],
        z: at[1],
        face: 0.5,
        look: lookFromName(people, t.lost, null),
        name: t.lost,
        role: ts.st === "on" ? "lost" : "home again",
        seed: 7,
        wander: false,
        lostTale: ts.st === "on" ? id : null,
      });
    }
    return out;
  }
  // the note, in your own hand
  function showPaper(on) {
    if (on !== G.paper) sfx.play("paper");
    G.paper = on;
    $("gPaper").hidden = !on;
    if (on) {
      const n = G.note;
      $("gSheet").innerHTML =
        n.lines.map((l) => `<p>${esc(l)}</p>`).join("") +
        '<p class="sig">(The handwriting is yours.)</p>' +
        needsHtml() +
        standingHtml();
      $("gMenu").hidden = true;
      G.menu = false;
    }
  }
  $("gPaper").addEventListener("click", () => showPaper(false));
  function showMenu(on) {
    if (G.flute) fluteClose(true);
    if (on !== G.menu) sfx.play(on ? "open" : "close");
    G.menu = on;
    $("gMenu").hidden = !on;
    G.again = false;
    $("mAgainWarn").hidden = true;
    $("mCode").hidden = true;
    $("mLoad").hidden = true;
    G.code = null;
    if (on && G.pack) {
      saveLife();
      saveCode(lifeData())
        .then((c) => {
          G.code = c;
        })
        .catch(() => {
          G.code = null;
        });
    }
    if (on) {
      $("gMenuTitle").textContent = state.planet
        ? G.name
          ? `${G.name} · ${state.planet.seedText}`
          : state.planet.seedText
        : "Resting";
      if (coarse())
        $("mKeys").innerHTML =
          "<dt>Box</dt><dd>walk (edge: run)</dd><dt>▲▲</dt><dd>walk on</dd><dt>Drag</dt><dd>look</dd><dt>Prompt</dt><dd>use, talk, strike</dd><dt>Bag</dt><dd>satchel</dd>";
      $("mResume").focus({ preventScroll: true });
    }
  }
  $("gMenuBtn").addEventListener("click", () => showMenu(!G.menu));
  $("mResume").addEventListener("click", () => showMenu(false));
  // sound on or off (remembered in this browser)
  function soundLabel() {
    $("mSound").textContent = sfx.on ? "Sound: on" : "Sound: off";
    $("mSound").setAttribute("aria-pressed", String(sfx.on));
  }
  function soundToggle() {
    sfx.wake();
    const on = sfx.toggle();
    soundLabel();
    if (on) sfx.play("choose");
    if (G.on) gotNote(on ? "Sound on" : "Sound off");
  }
  $("mSound").addEventListener("click", () => soundToggle());
  soundLabel();
  // how much of the dithered half-tone to draw between shades (remembered in this browser): soft, off, or the full pattern
  function ditherLabel() {
    $("mDither").textContent = `Dithering: ${ditherMode}`;
  }
