// index-inline-2 154 — kind
// Lines 71767-72082 of readable/index-inline-2.pretty.js (statement-aligned).
  function currentTarget() {
    // (with a line in the water, the water is all you are looking at)
    if (G.fishing && !ground.cave) return { kind: "water" };
    const np = ground.nearestPerson(3.5, 55);
    const tg = ground.lookTarget();
    // someone you are more or less looking at, unless what is right under your eye is nearer
    // (beside someone, the work stone in front of you is still the work stone)
    if (np && (!tg || (np.ang < 24 && np.m <= tg.d + 0.6)))
      return { kind: "person", np };
    // your own beast, waiting where you left it; up on it, nothing else to hand: get down
    if (!tg && !ground.riding) {
      const rec = ground.looseNear ? ground.looseNear() : null;
      if (rec) return { kind: "mount", rec };
    }
    if (!tg && ground.riding) return { kind: "dismount" };
    // nothing to hand, on top of a hill: you can see a long way from here
    if (!tg && G.summit && !ground.cave) return { kind: "summit" };
    // nothing to hand, at the water's edge with a line: you could fish
    if (
      !tg &&
      !ground.cave &&
      (G.fishing || (G.pack && G.pack.tool("fishing") && waterAhead()))
    )
      return { kind: "water" };
    return tg;
  }
  // standing on a high point: the ground falls away all round you, and you are well up above the land below
  function summitCheck(ts) {
    if (G.summitAt && ts - G.summitAt < 900) return;
    G.summitAt = ts;
    const g = ground,
      P = state.planet,
      p = g.p;
    G.summit = false;
    if (g.cave || g.journey || !P) return;
    const S = {};
    P.ground.sample(p[0], p[1], p[2], 4, S);
    if (S.h < 15 || S.h - Math.max(0, S.base) < 30) return;
    // (most of the ground round about falls away, and none of it rises above you: a ridge's top will do)
    // (close by nothing rises above you; further off, the ground has fallen well away nearly all round)
    const F = frameAt(p);
    let lower = 0;
    for (let k = 0; k < 8; k++) {
      const a = (k / 8) * Math.PI * 2,
        sa = Math.sin(a),
        ca = Math.cos(a);
      const at = (m) => {
        const q = stepOn(p, F, sa * m, ca * m, g.R);
        return P.ground.height(q[0], q[1], q[2], 4);
      };
      if (at(60) > S.h + 2 || at(200) > S.h + 4) return;
      if (at(400) < S.h - 15) lower++;
    }
    G.summit = lower >= 5;
  }
  function targetVerb(tg) {
    switch (tg.kind) {
      case "person": {
        const p = tg.np.person;
        if (p.act === "sleep")
          return p.met
            ? `${p.info.name} is asleep`
            : `The ${p.info.role} is asleep`;
        return p === ground.npc
          ? `Talk to ${G.op.traveller.name}`
          : p.met
            ? `Talk to ${p.info.name}`
            : `Talk to the ${p.info.role}`;
      }
      case "find":
        return FINDS[tg.find.kind].verb;
      case "drop":
        return tg.drop.worn
          ? `Pick up the ${itemName(tg.drop.item, 1, true).toLowerCase()}`
          : `Pick up ${countWords(tg.drop.item, tg.drop.n)}`;
      case "tree":
        return G.pack.tool("axe") ? "Chop" : null;
      case "rock":
        return G.pack.tool("hammer") ? "Break it up" : null;
      case "placed": {
        const pl = tg.placed;
        if (pl.kind === "campfire")
          return (pl.fuel || 0) > 0 ? "Use the fire" : "Tend the fire";
        if (pl.kind === "workstone") return "Use the work stone";
        if (pl.kind === "bedroll") return "Sleep";
        if (pl.kind === "bundle") return "Take your things back";
        if (pl.kind === "wreck") return "Look at what came down with you";
        return null;
      }
      case "site":
        return siteVerb(tg.view, tg.spot);
      case "cave":
        return caveVerb(tg.spot);
      case "foe":
        return tg.hostile
          ? `Strike the ${tg.foe.name}`
          : `Strike ${tg.foe.tier === "common" ? "the restless dead" : tg.foe.name.split(",")[0]}`;
      case "carcass":
        return `Butcher the ${tg.carcass.name}`;
      case "summit":
        return "Look around";
      case "mount":
        return `Ride ${tg.rec.stable.name}`;
      case "dismount":
        return "Get down";
      case "water":
        return G.fishing
          ? G.fishing.bite
            ? "Pull it in!"
            : "Fishing…"
          : "Fish";
    }
    return null;
  }
  // ---- the places between towns ----
  const dayNum = () => Math.max(1, Math.floor(ground.t - (G.t0 || 0)) + 1);
  function addNote(n) {
    if (!n || !n.text) return;
    if (G.notes.some((x) => x.text === n.text)) return;
    G.notes.push({ text: n.text, who: n.who || "", day: dayNum() });
    if (G.notes.length > 160) G.notes.splice(0, G.notes.length - 160);
  }
  const siteState = (id) => (G.world.sites[id] = G.world.sites[id] || {});
  function siteVerb(v, sp) {
    if (sp.ev) return dayVerb(v, sp);
    if (sp.kind === "door") return "Knock";
    if (sp.kind === "homebed") return "Sleep in your bed";
    if (sp.kind === "chest") return "Open your chest";
    if (sp.kind === "hearth") return "Cook at the hearth";
    if (sp.kind === "mywell") return "Draw water";
    if (sp.kind === "myhives") return hivesVerb(v);
    if (sp.kind === "mystable") {
      const st = v.home && v.home.stable;
      return !st ? null : st.out ? `${st.name} is out` : `Ride ${st.name}`;
    }
    if (sp.kind === "work")
      return (
        { oven: "Bake", forge: "Work at the bench", loom: "Weave" }[sp.work] ||
        null
      );
    if (sp.kind === "stall") return "See to your stall";
    if (sp.kind === "myfield") return fieldVerb(v);
    if (sp.kind === "trough") return troughVerb(v);
    if (sp.kind === "coop") return coopVerb(v);
    if (sp.kind === "beast") return beastVerb(v, sp);
    if (sp.kind === "decor") {
      const d = v.home && v.home.decor && v.home.decor[sp.i],
        q = d && slotFrom(d.s);
      return q
        ? `Pick up ${theWords({ id: q.id, n: q.n, worn: q.worn })}`
        : null;
    }
    if (sp.kind === "stable")
      return v.mountInfo ? `Hire the ${v.mountInfo.name}` : null;
    const st = siteState(v.site.id);
    switch (sp.kind) {
      case "stone":
        return v.plan.carved ? "Read the carvings" : "Look at the stone";
      case "carving":
        return "Read the carving";
      case "altar":
        return "Look at the altar stone";
      case "barrow":
        return "Look at the door";
      case "grave":
        return "Read the grave marker";
      case "sign":
        return "Read the signpost";
      case "innsign":
        return "Read the sign";
      case "cairn":
        return st.added ? "Look at the cairn" : "Add a stone to the cairn";
      case "shrine":
        return "Leave an offering";
      case "spring":
        return "Drink";
      case "bathe":
        return "Bathe";
      case "camp":
        return st.searched ? "Light a fire here" : "Search the old camp";
      case "stash":
        return st.searched ? null : "Look under the boulder";
      case "rubble":
        return st.searched ? null : "Search the rubble";
      case "cityrubble":
        return st["r" + sp.n] ? null : "Search the rubble";
      case "treasury":
        return st.taken ? null : "Search the strongroom";
      case "citystone":
        return "Read the stone";
      case "bones":
        return "Look at the bones";
      case "bigtree":
        return "Touch the old tree";
      case "field":
        return "Look at the old battlefield";
      case "blade":
        return st["b" + sp.n] ? null : "Take a rusted blade";
      case "bed":
        return "Take a bed for the night";
      case "climb":
        return v.site.kind === "lighthouse"
          ? "Climb the lighthouse"
          : v.site.kind === "watch"
            ? "Climb the watchtower"
            : "Climb the tower";
      case "mill":
        return "Look into the mill";
      case "bell":
        return "Ring the bell";
      case "view":
        return "Look around";
      case "down":
        return "Climb down";
      case "cave":
        return v.site.kind === "mine" ? "Go into the mine" : "Go into the cave";
    }
    return null;
  }
  // ---- underground ----
  // ---- fighting the dead ----
  // what you fight with: the weapon in your hand, else the best one you carry; else your fists
  function weaponNow() {
    const pk = G.pack;
    if (!pk) return null;
    const h = pk.held("hand");
    if (h && ITEMS[h.id] && ITEMS[h.id].dmg) return h;
    let best = null;
    for (const s of pk.slots)
      if (
        !s.worn &&
        ITEMS[s.id] &&
        ITEMS[s.id].dmg &&
        (!best || ITEMS[s.id].dmg > ITEMS[best.id].dmg)
      )
        best = s;
    return best;
  }
  const weaponReach = (w) => (w ? ITEMS[w.id].reach || 2.2 : 1.9);
  // the blow lands (or falls on nothing, if it moved)
  function strikeFoe() {
    const g = ground,
      w = weaponNow(),
      it = w ? ITEMS[w.id] : null;
    const bs = blessed(),
      fury = bs.multOnce > 1;
    const base = it ? it.dmg : 4,
      dmg = Math.max(
        1,
        Math.round(base * (0.85 + Math.random() * 0.3) * bs.mult * bs.multOnce),
      ),
      knock = (it && it.knock ? it.knock : 0.3) * (fury ? 2 : 1);
    const wear = () => {
      if (w && G.pack.wearTool(w)) {
        setTimeout(
          () =>
            gotNote(
              `Your ${itemName(w.id).toLowerCase()} is worn out. You keep it.`,
            ),
          900,
        );
        dropSpill(G.pack.takeSpill());
      }
    };
    // out in the wilds: something that hunts
    if (!g.cave) {
      const ho = g.hostileAt ? g.hostileAt(weaponReach(w)) : null;
      if (!ho) return;
      const hh = ho.h,
        at = g.screenAt(
          hh.dir,
          Math.max(-0.4, hh.alt) +
            (hh.pr && hh.pr.bodyY ? hh.pr.bodyY : 0.6) *
              (hh.sc || hh.scale || 1),
        );
      const res = g.hitHostile(hh, dmg, knock);
      if (!res) return;
      sfx.play("hit");
      if (fury) {
        endBless("fury");
        g.hitStopFor(0.1);
      }
      fx.hit(at ? at.x : 0.5, at ? Math.min(0.9, at.y) : 0.55, {
        big: res === "down" || fury,
        spark: fury ? SPARK.fury : SPARK[hh.kind],
      });
      g.hitStopFor(res === "down" ? 0.12 : 0.07);
      g.jolt(0.9);
      wear();
      return;
    }
    const fo = g.foeAt ? g.foeAt(weaponReach(w)) : null;
    if (!fo) return;
    const f = fo.f;
    const res = g.hitFoe(f, dmg, knock);
    if (!res) return;
    sfx.play("hit");
    if (fury) endBless("fury");
    fx.hit(0.5 + (Math.random() - 0.5) * 0.06, 0.5 + Math.random() * 0.08, {
      big: res === "down",
      spark: SPARK.dead,
    });
    g.hitStopFor(res === "down" ? 0.12 : 0.07);
    g.jolt(0.9);
    g.lastFoe = f;
    g.lastFoeAt = performance.now() / 1000;
    wear();
    if (res === "down") foeDown(f);
  }
  // ---- what a kill gives: meat, a hide or two, a bone, and any arrows still in it ----
  const CARCASS_LOOT = {
    tiny: [1, 0],
    small: [2, 1],
    medium: [3, 1],
    big: [5, 2],
  };
