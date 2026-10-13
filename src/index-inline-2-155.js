// index-inline-2 155 — res
// Lines 72083-72407 of readable/index-inline-2.pretty.js (statement-aligned).
  function butcherCarcass(c) {
    const knife = G.pack.tool("knife");
    if (!knife) return;
    const res = ground.butcher(c);
    if (!res) return;
    ground.jolt(0.6);
    const [meat, hides] = CARCASS_LOOT[res.size] || CARCASS_LOOT.medium;
    const loot = [
      ["rawmeat", res.young ? Math.max(1, Math.ceil(meat / 2)) : meat],
      ...(hides ? [["hide", hides]] : []),
      ...(res.size === "tiny" ? [] : [["bone", 1]]),
    ];
    for (const id of res.arrows || []) {
      const l = loot.find((x) => x[0] === id);
      if (l) l[1]++;
      else loot.push([id, 1]);
    }
    const got = [],
      left = [];
    for (const [id, n] of loot) {
      const l = G.pack.add(id, n);
      if (n - l > 0) got.push({ id, n: n - l });
      if (l) {
        left.push(countWords(id, l));
        ground.addDrop(id, l, res.dir);
      }
    }
    if (G.pack.wearTool(knife, 2))
      setTimeout(
        () =>
          gotNote(
            `Your ${itemName(knife.id).toLowerCase()} is worn out. You keep it.`,
          ),
        1600,
      );
    dropSpill(G.pack.takeSpill());
    gotNote(`You butcher the ${res.name}. + ${listWords(got)}`);
    if (left.length)
      setTimeout(
        () => gotNote(`No room for ${left.join(", ")}: it is on the ground`),
        1800,
      );
    if (G.pack.fresh.length) setTimeout(() => noteFresh(), 2400);
    saveLife();
  }
  // what the dead were buried with
  function foeLoot(f) {
    const r = Math.random,
      loot = [];
    if (f.tier === "lord") {
      loot.push(
        ["oldcoin", 10 + Math.floor(r() * 7)],
        ["bronzesword", 1],
        ["crown", 1],
      );
      if (r() < 0.5) loot.push(["bronzehelm", 1]);
    } else if (f.tier === "champion") {
      loot.push(["oldcoin", 3 + Math.floor(r() * 3)]);
      if (r() < 0.4) loot.push(["amulet", 1]);
      if (r() < 0.22) loot.push(["bronzeknife", 1]);
    } else {
      if (r() < 0.55) loot.push(["oldcoin", 1 + Math.floor(r() * 2)]);
      if (r() < 0.25) loot.push(["bone", 1]);
      if (r() < 0.05) loot.push(["amulet", 1]);
    }
    return loot;
  }
  function foeDown(f) {
    sfx.play("fell");
    const C = ground.cave;
    if (!C) return;
    const st = siteState(C.site.id);
    st["k_" + f.id] = 1;
    const got = [],
      lost = [];
    for (const [id, n] of foeLoot(f)) {
      const left = G.pack.add(id, n);
      if (n - left > 0) got.push({ id, n: n - left });
      // what you cannot carry you drag out with you, and leave at the cave's mouth
      if (left) {
        lost.push(countWords(id, left));
        ground.addDrop(
          id,
          left,
          frontSpot(1.2),
          ITEMS[id] && ITEMS[id].uses ? { wear: ITEMS[id].uses } : {},
        );
      }
    }
    dropSpill(G.pack.takeSpill());
    const who = f.tier === "common" ? "The dead one" : f.name.split(",")[0];
    gotNote(
      `${who} falls and crumbles${got.length ? ". + " + listWords(got) : ""}`,
    );
    if (lost.length)
      setTimeout(
        () =>
          gotNote(
            `No room for ${lost.join(", ")}: it waits for you at the cave's mouth`,
          ),
        1900,
      );
    if (f.tier === "lord") {
      gToast(f.name.split(",")[0], "falls, and is still at last", 3000);
      addNote({
        text: `You put ${f.name} back to rest, deep in ${siteName(state.story, C.site)}.`,
        who: "Done",
      });
    } else if (!C.foes.some((o) => o !== f && o.hp > 0 && o.st !== "lie"))
      gToast("Quiet again", "the dead of this tomb are at rest", 2600);
    if (G.pack.fresh.length) setTimeout(() => noteFresh(), 1500);
    saveLife();
  }
  // what has been taken from a cave is kept with the place
  const caveTaken = (sid, tid) =>
    !!(G.world && G.world.sites[sid] && G.world.sites[sid]["t_" + tid]);
  // the cave whose dead keep one of the needs is a tomb, and its dead are champions (whether or not you know it yet)
  const caveOptsFor = (s) =>
    s.kind === "mine"
      ? { mine: true, tomb: false }
      : state.story && relicQuestIn(s, false)
        ? { tomb: true, tier: "champions" }
        : null;
  function onCave(way, s) {
    if (way === "in") {
      const off = G.pack.body.off,
        torch =
          off && !off.worn && ITEMS[off.id] && ITEMS[off.id].tool === "torch";
      G.visited.add(s.id);
      G.known.add(s.id);
      gToast(
        cap(siteName(state.story, s)),
        s.kind === "mine"
          ? "lamps hang from the timbers, going down into the hill"
          : torch
            ? "cold air, and the dark going down"
            : "it is very dark in here. A torch would help",
        3000,
      );
    }
    saveLife();
  }
  function caveVerb(sp) {
    const tool = (t) => !!G.pack.tool(t);
    switch (sp.kind) {
      case "pool":
        return "Drink";
      case "crystals":
        return sp.gone
          ? null
          : tool("hammer") || tool("knife")
            ? "Take some crystals"
            : "Look at the crystals";
      case "ore":
        return sp.gone
          ? null
          : tool("hammer")
            ? "Break out the ore"
            : "Look at the rock";
      case "mushrooms":
        return sp.gone ? null : "Pick the pale mushrooms";
      case "oldcamp":
        return sp.gone ? "Look at the old camp" : "Search the old camp";
      case "painting":
        return "Look at the paintings";
      case "bones":
        return "Look at the bones";
      case "dead":
        return "Look at the dead";
      case "lord":
        return "Look at the one on the bier";
      case "gravegoods":
        return sp.gone
          ? ground.cave && relicQuestIn(ground.cave.site)
            ? "Search where the grave goods were"
            : null
          : "Take the grave goods";
    }
    return null;
  }
  function useCave(tg) {
    const C = ground.cave;
    if (!C) return;
    const s = C.site,
      sp = tg.spot,
      st = siteState(s.id);
    // what one of the needs asks for, buried here with the dead
    const rq = sp.kind === "gravegoods" ? relicQuestIn(s) : null;
    if (rq && sp.gone) {
      questDone(
        rq,
        `took ${needLc(rq.title)} back from the dead in ${siteName(state.story, s)}`,
      );
      addNote({
        text: `${cap(rq.title)}: found in ${siteName(state.story, s)}, under the floor where the grave goods were.`,
        who: "Done",
      });
      const f = relicFound(state.story, rq);
      openDialog(
        [
          {
            who: null,
            text: "You search where the grave goods were, more carefully this time. Where the box stood, a slab of the floor is loose. You lift it.",
          },
          {
            who: null,
            text: f.text.replace(
              /^Among the grave goods, wrapped/,
              "Under it, wrapped",
            ),
          },
          { who: null, text: questCount() },
        ],
        { noChronicle: true },
      );
      saveLife();
      return;
    }
    const res = caveUse({
      story: state.story,
      site: s,
      spot: sp,
      state: st,
      tool: (t) => !!G.pack.tool(t),
      tomb: C.plan.rooms.some((r) => r.kind === "tomb"),
    });
    if (!res) return;
    if (rq && res.pages) {
      questDone(
        rq,
        `took ${needLc(rq.title)} back from the dead in ${siteName(state.story, s)}`,
      );
      addNote({
        text: `${cap(rq.title)}: found among the grave goods in ${siteName(state.story, s)}.`,
        who: "Done",
      });
      const f = relicFound(state.story, rq);
      res.pages = res.pages.slice();
      res.pages.splice(Math.max(1, res.pages.length - 1), 0, {
        who: null,
        text: `${f.text} ${questCount()}`,
      });
    }
    const eff = res.effect || {},
      b = G.body;
    if (eff.set) Object.assign(st, eff.set);
    if (eff.heal) b.hp = Math.min(100, b.hp + eff.heal);
    if (eff.breath) {
      b.breath = Math.max(b.breath, eff.breath);
      b.winded = false;
    }
    if (eff.note) addNote(eff.note);
    if (eff.wear) {
      const t = G.pack.tool(eff.wear);
      if (t && G.pack.wearTool(t))
        setTimeout(
          () =>
            gotNote(
              `Your ${itemName(t.id).toLowerCase()} is worn out. You keep it.`,
            ),
          900,
        );
      dropSpill(G.pack.takeSpill());
      ground.jolt(1);
    }
    if (eff.loot)
      for (const [id, n] of eff.loot) {
        const left = G.pack.add(id, n);
        if (left) ground.addDrop(id, left, frontSpot(0.8));
      }
    if (eff.set) ground.refreshCave();
    const hooks = { noChronicle: true };
    if (eff.rise)
      hooks.onClose = () => {
        const n = ground.riseTomb();
        if (n)
          gToast(
            "The dead are rising",
            n > 1 ? "all around you, one after another" : "behind you",
            2600,
          );
      };
    if (res.pages) {
      const pages = res.pages.slice();
      if (eff.loot)
        pages.splice(eff.rise ? pages.length - 1 : pages.length, 0, {
          who: null,
          text: `You take ${listWords(eff.loot.map(([id, n]) => ({ id, n })))}.`,
        });
      openDialog(pages, hooks);
    } else if (res.title) {
      gToast(res.title, res.sub, 2800);
      if (hooks.onClose) hooks.onClose();
    }
    if (G.pack.fresh.length) setTimeout(() => noteFresh(), 1500);
    saveLife();
  }
  // ---- days in town: a market, a wedding, a funeral, a fire, a feast, a caravan ----
  const mulberryOf = (seed) => {
    let a = seed >>> 0;
    return () => {
      a = (a + 0x6d2b79f5) >>> 0;
      let t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  };
  const dayKey = (tw) => "day:" + tw.s.id + ":" + tw.dayV.ev.day;
  const dayRec = (tw) =>
    (G.world.sites[dayKey(tw)] = G.world.sites[dayKey(tw)] || {});
  function dayVerb(tw, sp) {
    const D = tw.dayV;
    if (!D) return null;
    const st = G.world.sites[dayKey(tw)] || {};
    switch (sp.kind) {
      case "ev:feast":
        return st.ate ? null : "Join the feast";
      case "ev:buckets":
        return D.on ? "Help with the buckets" : null;
      case "ev:bier":
        return st.paid ? null : "Pay your respects";
    }
    return null;
  }
