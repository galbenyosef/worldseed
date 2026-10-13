// index-inline-2 143 — rec
// Lines 68160-68510 of readable/index-inline-2.pretty.js (statement-aligned).
  function takeDownHome(rec) {
    const Z = HOME_SIZE[rec.size];
    G.sleeping = true;
    $("eyes").hidden = false;
    G.lidK = 0;
    lidsTo(1, 700, () => {
      const i = G.world.homes.findIndex((h) => h.id === rec.id);
      if (i >= 0) G.world.homes.splice(i, 1);
      ground.homesChanged(rec);
      // what was in the chest, set out, or out on the stall, tied up in a bundle at your feet; the takings in your purse
      const rows = (rec.chest || [])
        .concat(
          (rec.decor || []).map((d) => d.s),
          rec.stall ? rec.stall.goods.map((q) => q.s) : [],
        )
        .filter(Boolean);
      if (rec.stall) {
        G.pack.add("oldcoin", rec.stall.cash || 0);
        const l2 = G.pack.add("deedstall", 1);
        if (l2) rows.push(["deedstall", 1, null, 0, null]);
      }
      // the field and the pen are deeds again; what was in the trough comes too; the animals go to a neighbour, who pays half what they cost
      for (const [what, deed] of [
        ["field", "deedfield"],
        ["pen", "deedpen"],
        ["porch", "deedporch"],
      ])
        if (rec[what]) {
          const l3 = G.pack.add(deed, 1);
          if (l3) rows.push([deed, 1, null, 0, null]);
        }
      for (const k of rec.work || [])
        if (WORK_DEED[k]) {
          const l4 = G.pack.add(WORK_DEED[k], 1);
          if (l4) rows.push([WORK_DEED[k], 1, null, 0, null]);
        }
      if (rec.stable && ground.riding && ground.riding.rec === rec)
        ground.getDown("home");
      if (rec.stable) ground.untetherLoose(rec);
      for (const k of Object.keys(OUT_DEED))
        if (rec[k]) {
          const l5 = G.pack.add(OUT_DEED[k], 1);
          if (l5) rows.push([OUT_DEED[k], 1, null, 0, null]);
        }
      if (rec.hives && rec.hives.ready)
        rows.push(["honey", rec.hives.ready, null, 0, null]);
      if (rec.pen) {
        const grain = Math.floor(rec.pen.trough || 0);
        if (grain > 0) rows.push(["grain", grain, null, 0, null]);
        const paid = rec.pen.beasts.reduce(
          (a, b) => a + Math.floor((ITEMS[b.k] ? ITEMS[b.k].value : 0) * 0.5),
          0,
        );
        if (paid) {
          G.pack.add("oldcoin", paid);
          addNote({
            text: `When I took my house down, a neighbour took my animals, and paid me ${coinWords(paid)} for them.`,
            who: "Your home",
          });
        }
      }
      const left = G.pack.add(DEED_OF[rec.size], 1, { tag: rec.owner });
      if (left)
        ground.addDrop(DEED_OF[rec.size], 1, frontSpot(0.8), {
          tag: rec.owner,
        });
      if (rows.length)
        ground.addPlaced("bundle", frontSpot(0.9), Math.random() * 6.28, {
          contents: rows,
        });
      if (G.bed === "home:" + rec.id) G.bed = null;
      const g = ground;
      g.t += Math.max(2, Z.hours / 2) / DAY_HOURS;
      saveLife();
      setTimeout(
        () =>
          lidsTo(0, 1000, () => {
            G.sleeping = false;
            $("eyes").hidden = true;
            gToast(
              "Taken down",
              `your ${Z.word} is a deed again${rows.length ? ". Everything in it is bundled up at your feet" : ", to put down somewhere else"}`,
              3600,
            );
          }),
        600,
      );
    });
  }
  // ---- your stall: a keeper sells what you put out while you are away ----
  const stallInfoCache = new Map();
  // how busy the spot is (a road, a town and how big, farms and inns around), the nearest town, the people of the land
  function stallInfo(rec) {
    let o = stallInfoCache.get(rec);
    if (o) return o;
    const R = ground.R,
      dir = rec.dir,
      ix = ground.siteIx;
    let T = 0.15;
    const road = ix ? ix.roadNear(dir, 2500) : null;
    if (road) T += road.m < 60 ? 1.0 : road.m < 400 ? 0.6 : 0.25;
    let best = null;
    for (const t of state.story.settlements) {
      const km = arcM(dir, t.dir, R) / 1000;
      if (!best || km < best.km) best = { t, km };
    }
    if (best)
      T +=
        ({ capital: 1.5, town: 1.2, port: 1.2, village: 0.8 }[best.t.type] ||
          0.5) *
        (best.km < 2
          ? 1.1
          : best.km < 6
            ? 0.7
            : best.km < 20
              ? 0.35
              : best.km < 60
                ? 0.12
                : 0);
    const lived = ix
      ? ix
          .near(dir, 4000, "big")
          .filter(
            (q) =>
              (q.kind === "hamlet" || q.kind === "inn" || q.kind === "farm") &&
              !siteLost(q.id),
          ).length
      : 0;
    T += Math.min(0.5, lived * 0.12);
    const owner = ix && best ? ix.ownerAt(dir, best.t, best.km * 1000) : -1;
    o = {
      traffic: Math.min(3, T),
      town: best ? best.t : null,
      people: owner >= 0 ? state.story.peoples[owner] : null,
      road: !!road && road.m < 400,
    };
    stallInfoCache.set(rec, o);
    return o;
  }
  // who came by and bought it
  function buyerWho(rec) {
    const { town, people, road } = stallInfo(rec),
      opts = [
        "a traveller who did not stop to haggle",
        "someone who said they would be back for more",
        "two travellers going the other way",
      ];
    if (town)
      opts.push(
        `a woman from ${town.name}`,
        `a man from ${town.name}`,
        `someone on the way to ${town.name}`,
      );
    if (people && people.roles)
      for (const r of people.roles)
        opts.push(
          `${/^[aeiou]/i.test(r) ? "an" : "a"} ${r} of the ${people.plural}`,
        );
    if (road) opts.push("a carter on the road", "a pilgrim on the road");
    // never the same buyer twice running
    const last = lastBuyer.get(rec.id);
    let w = opts[Math.floor(Math.random() * opts.length)];
    for (let k = 0; k < 6 && w === last; k++)
      w = opts[Math.floor(Math.random() * opts.length)];
    lastBuyer.set(rec.id, w);
    return w;
  }
  const lastBuyer = new Map();
  const stallTick = (rec) =>
    rec.stall
      ? stepStall(rec.stall, ground.t, stallInfo(rec).traffic, slotFrom, () =>
          buyerWho(rec),
        )
      : [];
  // "the bronze sword", "the 3 cave crystals", "the worn flint axe"
  const theWords = (e) =>
    e.n > 1
      ? `the ${e.n} ${lowerName(e.id, e.n)}`
      : `the ${e.worn ? "worn " : ""}${lowerName(e.id, 1)}`;
  const keeperOf = (v) =>
    ((v.plan.folk || []).find((f) => f.keeper) || { name: "Your keeper" }).name;
  const keeperIn = () => ground.uniforms.uSun.value.y >= -0.06;
  // now and then: has anything sold? Word reaches you near home, or when you wake
  function stallsCheck(wake = false) {
    for (const rec of G.world.homes || []) {
      const st = rec.stall;
      if (!st) continue;
      const sold = stallTick(rec);
      if (sold.length) {
        st.unread = (st.unread || 0) + sold.length;
        repGain(townNear(rec.dir, 40), sold.length, "stall");
      }
      if (!st.unread) continue;
      const near = arcM(ground.p, rec.dir, ground.R) < 300;
      if (!near && !wake) continue;
      const news = st.ledger.slice(-st.unread);
      gToast(
        near ? "Your stall" : "Word from your stall",
        news.length === 1
          ? `${theWords(news[0]).replace(/^the /, "")} sold, for ${coinWords(news[0].net)}`
          : `${news.length} lots sold · ${coinWords(st.cash)} waiting`,
        3400,
      );
      st.unread = 0;
      saveLife();
      break;
    }
  }
  // talking to whoever keeps it: what sold and who to, and the takings
  function stallTalk(v, p) {
    const rec = v.home,
      st = rec && rec.stall,
      who = p.info.name;
    if (!st) return;
    stallTick(rec);
    const news = st.ledger.slice(st.seen || 0),
      pages = [],
      T = stallInfo(rec).traffic;
    if (news.length) {
      const last = news.slice(-3);
      let text = last
        .map((e, k) =>
          k
            ? `${cap(theWords(e))}, to ${e.who}.`
            : `${cap(theWords(e))} went to ${e.who}.`,
        )
        .join(" ");
      if (news.length > 3)
        text =
          `${news.length - 3} lot${news.length > 4 ? "s" : ""} went before I could tell you. ` +
          text;
      pages.push({ who, text: `"${text}"` });
    } else if (st.goods.length)
      pages.push({
        who,
        text:
          T >= 1.5
            ? '"Nothing yet, and plenty pass. Ask a little less, maybe."'
            : T >= 0.5
              ? '"Nothing yet. Give it time."'
              : '"Nothing yet. Hardly anyone comes out this way. It will be slow."',
      });
    else
      pages.push({
        who,
        text: '"An empty stall sells nothing. What shall I put out?"',
      });
    if (st.cash > 0) {
      const c = st.cash;
      G.pack.add("oldcoin", c);
      st.cash = 0;
      pages.push({
        who: null,
        text: `${who.split(" ")[0]} hands you ${coinWords(c)}, a tenth kept back.`,
      });
    }
    st.seen = st.ledger.length;
    st.unread = 0;
    pages[pages.length - 1].choices = [
      { id: "stall", label: "See to the stall", primary: true },
      { id: "no", label: "Not now" },
    ];
    openDialog(pages, {
      noChronicle: true,
      onClose: (c) => {
        ground.talkTo = null;
        if (c === "stall") openStall(v);
      },
    });
    saveLife();
  }
  function stallCtx(rec, v, log) {
    return {
      mode: "stall",
      title: "Your stall",
      sub: `${keeperOf(v)} keeps it, for a tenth of what it takes. ${trafficWords(stallInfo(rec).traffic)}`,
      stall: rec.stall,
      traffic: stallInfo(rec).traffic,
      cap: STALL_CAP,
      log,
    };
  }
  // the window: what is out, what it asks, what sold; the takings come to you as you open it
  function openStall(v) {
    const rec = v.home;
    if (!rec || !rec.stall || !G.on || G.dying || G.sleeping) return;
    if (G.packOpen) {
      G.packOpen = false;
      packUI.hide();
    }
    stallTick(rec);
    const st = rec.stall;
    let log = "";
    if (st.cash > 0) {
      const c = st.cash;
      G.pack.add("oldcoin", c);
      st.cash = 0;
      log = keeperIn()
        ? `${keeperOf(v).split(" ")[0]} hands you ${coinWords(c)}.`
        : `You take ${coinWords(c)} from the box under the counter.`;
    }
    st.seen = st.ledger.length;
    st.unread = 0;
    G.trade = { mode: "stall", home: rec, v };
    G.tradeOpen = true;
    tradeUI.show(G.pack, stallCtx(rec, v, log));
  }
  function stallAct(kind, i) {
    const T = G.trade,
      rec = T.home,
      st = rec.stall,
      pk = G.pack;
    if (!st) return;
    if (kind === "stock") {
      const s = pk.slots[i];
      if (!s || !sellable(s.id)) return;
      if (st.goods.length >= STALL_CAP) {
        tradeUI.say("The stall is full.");
        return;
      }
      stallTick(rec);
      const one = pk.takeSlot(i, s.n);
      st.goods.push({ s: slotRow(one), lv: "fair" });
      tradeUI.say(
        `You put out ${one.n > 1 ? `${one.n} ${lowerName(one.id, one.n)}` : countWords(one.id, 1)}, at a fair price: ${coinWords(lotPrice(one, "fair"))}.`,
      );
    } else if (kind === "unstock") {
      const g = st.goods[i],
        s = g && slotFrom(g.s);
      if (!s) return;
      const left = pk.add(s.id, s.n, slotExtra(s));
      if (left === s.n) {
        tradeUI.say("No room in your satchel.");
        return;
      }
      if (left) g.s[1] = left;
      else st.goods.splice(i, 1);
      tradeUI.say(`You take back ${countWords(s.id, s.n - left)}.`);
    } else if (kind === "price") {
      const g = st.goods[i],
        s = g && slotFrom(g.s);
      if (!s) return;
      g.lv = nextLevel(g.lv || "fair");
      tradeUI.say(
        `${cap(theWords({ id: s.id, n: s.n, worn: s.worn }))}: ${LEVEL_WORD[g.lv]}, ${coinWords(lotPrice(s, g.lv))}.`,
      );
    }
    ground.refreshHome(rec);
    tradeUI.ctx = stallCtx(rec, T.v, tradeUI.log);
  }
  // the stall deed, at home: the crew puts the stall up by your door, and its keeper comes
