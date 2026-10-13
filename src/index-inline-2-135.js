// index-inline-2 135 — math
// Lines 65521-65843 of readable/index-inline-2.pretty.js (statement-aligned).
  function roofTalk(v, p, withDoing) {
    const f = p.info,
      who = f.name,
      B = G.begin,
      n = G.pack.count("log");
    const close = {
      noChronicle: true,
      onClose: () => {
        ground.talkTo = null;
      },
    };
    if (n < 6) {
      const r = Math.random();
      openDialog(
        withDoing([
          {
            who,
            text: n
              ? `"${n === 1 ? "One log" : `${n} logs`}. Six, I said. The roof will not mend itself."`
              : r < 0.5
                ? '"Six logs. The trees are that way. So is the axe."'
                : '"The children have been staring at the hole all day. Six logs, sky-fallen. Good straight ones."',
          },
        ]),
        close,
      );
      return;
    }
    G.pack.take("log", 6);
    B.st = "done";
    G.body.food = Math.min(100, G.body.food + 50);
    G.body.rested = Math.max(G.body.rested, 300);
    const left = G.pack.add("bread", 2);
    if (left) ground.addDrop("bread", left, frontSpot(0.8));
    repGain(townNear(v.site.dir, 80), 4, "tale");
    for (const pl of (G.world.placed || []).filter((q) => q.kind === "wreck"))
      ground.removePlaced(pl);
    addNote({
      text: `I paid ${firstWord(who)}’s family back for their roof: six logs for new beams.`,
      who: "Done",
    });
    sfx.play("nice");
    openDialog(
      withDoing([
        {
          who,
          text: '"Six good logs. Well. That is a roof, near enough." A slow nod, and something that might be a smile. "Come in. Supper."',
        },
        {
          who: null,
          text: "They feed you at their own table: bread and soup and questions, more questions than you have answers to. The children want to know what the sky is like from up there. You tell them it is cold, and that the roofs all look the same.",
        },
        {
          who,
          text: `"We are square. Keep the axe; I have another. And if you are ever passing this way, the barn is yours for a night.${G.op && G.op.town ? ` ${G.op.town.name} is to the ${bearingWord(ground.p, G.op.town.dir)}, when you want it.` : ""}"`,
        },
      ]),
      close,
    );
    saveLife();
  }
  // the nearest hermit to a town, within a few days' walk (worked out once a town, it takes a moment)
  function hermitNear(t) {
    G.hermitOf = G.hermitOf || new Map();
    if (G.hermitOf.has(t.id)) return G.hermitOf.get(t.id);
    const ix = ground.siteIx,
      hm = ix
        ? ix.near(t.dir, 110000, "big").find((q) => q.kind === "hermit") || null
        : null;
    G.hermitOf.set(t.id, hm);
    return hm;
  }
  // ---- a beast to ride to another town, hired at an inn's or a tavern's rail ----
  // what you have that will pay for it: old coin, or a crystal or an amulet in place of some
  function payWorth() {
    return (
      G.pack.count("oldcoin") +
      G.pack.count("crystal") * 3 +
      G.pack.count("amulet") * 4
    );
  }
  function payCoins(n) {
    if (payWorth() < n) return null;
    const paid = [];
    const c = Math.min(n, G.pack.count("oldcoin"));
    if (c) {
      G.pack.take("oldcoin", c);
      paid.push({ id: "oldcoin", n: c });
      n -= c;
    }
    for (const [id, worth] of [
      ["crystal", 3],
      ["amulet", 4],
    ]) {
      while (n > 0 && G.pack.count(id) > 0) {
        G.pack.take(id, 1);
        n -= worth;
        const q = paid.find((p) => p.id === id);
        if (q) q.n++;
        else paid.push({ id, n: 1 });
      }
    }
    return paid;
  }
  const rideCost = (km) => Math.max(2, Math.round(km / 50));
  function hireMount(v) {
    const m = v.mountInfo;
    if (!m) return;
    const story = state.story,
      here = v.site ? v.site.dir : v.s.dir,
      from = v.s || null,
      R = ground.R;
    const keeper = v.site
      ? folkName(story, v.site, 0)
      : ((v.plan.folk || []).find((f) => f.role === "tavern keeper") || {})
          .name || "The keeper";
    const where = v.site
      ? siteName(story, v.site)
      : v.plan.tavernName || "the tavern";
    // the riders' line: hamlets and inns within a few days' ride (the nearest few, and one or two further on),
    // and the nearest town, however far that is
    const near = ground.siteIx
      .near(here, 150000, "big")
      .filter(
        (q) =>
          (q.kind === "hamlet" || q.kind === "inn") &&
          q.m > 3000 &&
          (!v.site || q.id !== v.site.id),
      );
    const pick = near.slice(0, 2);
    for (const lo of [20000, 60000]) {
      const q = near.find((o) => o.m > lo && !pick.includes(o));
      if (q) pick.push(q);
    }
    const dests = pick.map((q) => ({
      t: q,
      km: q.m / 1000,
      name: cap(siteName(story, q)),
      kind: q.kind === "inn" ? "an inn" : "a hamlet",
      edge: (sitePlan(story, q).r || 20) + 12,
    }));
    // (a friend of the town rides cheaper)
    const K = from ? RIDE_AT[standingK(from.id)] : 1;
    let town = null;
    // (on the same land: nobody rides over the sea; and from a town, no more than ten days in the saddle, when
    // there are caravans and ships for further)
    for (const t of story.settlements) {
      if (t === from) continue;
      const km = arcM(here, t.dir, R) / 1000;
      if (
        km > 2 &&
        (!town || km < town.km) &&
        (km < 60 ||
          (ground.sameLand(here, t.dir) && (!from || km / m.kmDay <= 10)))
      )
        town = {
          t,
          km,
          name: t.name,
          kind:
            t.type === "capital"
              ? "a capital"
              : t.type === "port"
                ? "a port"
                : "a town",
          edge: null,
        };
    }
    if (town) dests.push(town);
    dests.sort((a, b) => a.km - b.km);
    // from a town, further: with the caravans along the roads, or by ship from the coast
    const farRoad = from ? farByRoad(from) : [],
      farSea = from ? farBySea(from) : [];
    const hooks = {
      noChronicle: true,
      onClose: (choice) => {
        const c = String(choice || "");
        if (c.startsWith("ride:")) {
          const o = dests[+c.slice(5)];
          if (o) rideTo(o, m, keeper);
        } else if (c === "far:road" || c === "far:sea")
          setTimeout(() => farMenu(v, c.slice(4), keeper), 0);
      },
    };
    if (!dests.length && !farRoad.length && !farSea.length) {
      openDialog(
        [
          {
            who: keeper,
            text: `"Ride? There is nowhere near enough from here. The ${m.name} would not thank me."`,
          },
        ],
        hooks,
      );
      return;
    }
    const a = /^[aeiou]/.test(m.name) ? "an" : "a";
    const time = (km) => {
      const d = km / m.kmDay;
      return d < 0.25 ? "a few hours" : d < 0.6 ? "half a day" : dayWords(d);
    };
    for (const o of dests) o.cost = Math.max(1, Math.round(rideCost(o.km) * K));
    const choices = dests.map((o, i) => ({
      id: "ride:" + i,
      label: `${o.name} (${o.kind}): ${time(o.km)}, ${o.cost} old coins`,
    }));
    if (farRoad.length)
      choices.push({ id: "far:road", label: "Further, with a caravan…" });
    if (farSea.length)
      choices.push({
        id: "far:sea",
        label:
          from.type === "port"
            ? "By ship…"
            : "By boat, along the coast and over the sea…",
      });
    choices.push({ id: "no", label: "Not now" });
    const worth = payWorth();
    const further =
      farRoad.length || farSea.length
        ? ` Further than that, ${farRoad.length ? "the caravans go from here along the roads" : ""}${farRoad.length && farSea.length ? ", and " : ""}${farSea.length ? (from.type === "port" ? "there are ships" : "the boats go out") : ""}.`
        : "";
    openDialog(
      [
        {
          who: keeper,
          text: `"${cap(a)} ${m.name} from ${where}? It knows the roads, and it knows its way home after.${further} Where to?"${worth ? "" : " (You have no old coin, nor anything to pay with in its place.)"}`,
          choices,
        },
      ],
      hooks,
    );
  }
  // ---- further: with a caravan along the roads, or by ship ----
  // every town a caravan goes to from here (not the ones just down the road, nor the ones months away round
  // the shores of some great bay: no caravan sets out for those)
  function farByRoad(from) {
    return ground
      .townsByRoad(from.id)
      .filter((o) => o.km > 35 && farDays("road", o.km, false) <= 60)
      .map((o) => ({ t: state.story.settlements[o.id], km: o.km }))
      .filter((o) => o.t);
  }
  function farBySea(from) {
    return ground.townsBySea(from);
  }
  const farCost = (mode, km, K = 1) =>
    Math.max(
      1,
      Math.round(
        (mode === "sea"
          ? Math.max(4, Math.round(km / 200))
          : Math.max(3, Math.round(km / 150))) * K,
      ),
    );
  const farDays = (mode, km, work) =>
    Math.max(0.5, km / (mode === "sea" ? (work ? 200 : 300) : work ? 55 : 110));
  const townKind = (t) =>
    t.type === "capital"
      ? "a capital"
      : t.type === "port"
        ? "a port"
        : t.type === "village"
          ? "a village"
          : t.type === "monastery"
            ? "a monastery"
            : t.type === "outpost"
              ? "an outpost"
              : "a town";
  function farMenu(v, mode, keeper) {
    const from = v.s,
      list = mode === "sea" ? farBySea(from) : farByRoad(from);
    if (!list.length) return;
    // where the needs you know of are kept come first (or, over the sea, the port nearest one inland), then the nearest
    const tagged = new Map();
    for (const q of questsOf()) {
      const st = questSt(q);
      if (!st || st === "done" || !q.town) continue;
      if (list.some((o) => o.t.id === q.town.id)) {
        if (!tagged.has(q.town.id))
          tagged.set(q.town.id, `where ${q.giver.name} is`);
        continue;
      }
      if (mode === "sea") {
        const pt = portFor(q.town);
        if (pt && list.some((o) => o.t.id === pt.id) && !tagged.has(pt.id))
          tagged.set(pt.id, `the port for ${q.town.name}`);
      }
    }
    const pick = list.filter((o) => tagged.has(o.t.id));
    for (const o of list) {
      if (pick.length >= 7) break;
      if (!pick.includes(o)) pick.push(o);
    }
    const K = RIDE_AT[standingK(from.id)];
    const choices = pick
      .map((o, i) => {
        const d = farDays(mode, o.km, false),
          tag = tagged.get(o.t.id);
        o.cost = farCost(mode, o.km, K);
        return {
          id: "go:" + i,
          label: `${o.t.name} (${townKind(o.t)}${tag ? `, ${tag}` : ""}): ${dayWords(d)}, ${o.cost} old coins`,
        };
      })
      .concat([{ id: "no", label: "Not now" }]);
    const text =
      mode === "sea"
        ? from.type === "port"
          ? '"There are ships in, and the captains take anyone who pays. They go round the land, never over it, so the way is longer than it looks. Where to?"'
          : '"The boats go out along the coast, and the bigger ones go further, over the sea, if you pay. Where to?"'
        : '"The caravans go out from the square at first light, along the roads, and change beasts at every town on the way. It is the fastest there is. Where to?"';
    openDialog([{ who: keeper, text, choices }], {
      noChronicle: true,
      onClose: (c) => {
        const s = String(c || "");
        if (s.startsWith("go:")) {
          const o = pick[+s.slice(3)];
          if (o) setTimeout(() => goFar(mode, from, o, keeper, v.mountInfo), 0);
        }
      },
    });
  }
