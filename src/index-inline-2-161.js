// index-inline-2 161 — kind
// Lines 73617-73904 of readable/index-inline-2.pretty.js (statement-aligned).
  function checkVisits(ts) {
    if (G.visitAt && ts - G.visitAt < 700) return;
    G.visitAt = ts;
    const g = ground;
    if (!g.siteNear) return;
    for (const s of g.siteNear) {
      if (
        G.visited.has(s.id) ||
        s.kind === "sign" ||
        !SITE_WORD[s.kind] ||
        [
          "cairn",
          "stone",
          "shrine",
          "camp",
          "grave",
          "spring",
          "stash",
          "bones",
        ].includes(s.kind)
      )
        continue;
      const m = arcM(g.p, s.dir, g.R),
        r = (sitePlan(state.story, s).r || 10) + 8;
      if (m > r) continue;
      G.visited.add(s.id);
      G.known.add(s.id);
      if (SITE_WONDER.has(s.kind)) {
        foundWonder(s);
        break;
      }
      gToast(cap(siteName(state.story, s)), SITE_WORD[s.kind], 3000);
      break;
    }
  }
  // one of the wonders of the world, reached: you will not forget it, and nor will anyone you tell
  function foundWonder(s) {
    const name = siteName(state.story, s);
    gToast(cap(name), SITE_WORD[s.kind], 4200);
    sfx.play("wonder");
    addNote({ text: `You found ${name}: ${SITE_WORD[s.kind]}.`, who: "Found" });
    G.deeds = (G.deeds || [])
      .concat([{ text: `found ${name}`, day: dayNum() }])
      .slice(-12);
    const t = townNear(s.dir, 80);
    if (t) repGain(t, 6, "wonder");
  }
  const countWordsN = (n) =>
    ["none", "one", "two", "three", "four", "five", "six"][n] || String(n);
  // ---- what hunts you, put down ----
  // what a raider, a soldier, one of the dead or the drowned or a cinder-hound leaves where it fell
  const HUNT_LOOT = {
    raider: (r) => [
      ["oldcoin", 1 + Math.floor(r() * 4)],
      r() < 0.3 && ["dried", 2],
      r() < 0.18 && ["copperknife", 1],
      r() < 0.15 && ["arrow", 3 + Math.floor(r() * 3)],
    ],
    soldier: (r) => [
      ["oldcoin", 2 + Math.floor(r() * 5)],
      r() < 0.2 && ["copperspear", 1],
      r() < 0.12 && ["copperhelm", 1],
      r() < 0.15 && ["leather", 1],
    ],
    drowned: (r) => [
      r() < 0.7 && ["salt", 1 + Math.floor(r() * 2)],
      r() < 0.25 && ["oldcoin", 1 + Math.floor(r() * 2)],
      r() < 0.1 && ["amulet", 1],
    ],
    dead: (r) => [
      r() < 0.55 && ["oldcoin", 1 + Math.floor(r() * 2)],
      r() < 0.25 && ["bone", 1],
      r() < 0.05 && ["amulet", 1],
    ],
    ashhound: (r) => [
      ["charcoal", 1 + Math.floor(r() * 2)],
      r() < 0.3 && ["obsidian", 1],
    ],
    scorpion: (r) => [r() < 0.8 && ["sting", 1]],
  };
  function huntDown(n) {
    sfx.play("fell");
    // (the watch on the roads pays for it)
    G.bounty = G.bounty || { beasts: 0, men: 0 };
    if (n.kind === "raider" || n.kind === "soldier") G.bounty.men++;
    else G.bounty.beasts++;
    const left = n.left ? `. ${cap(countWordsN(n.left))} left` : "";
    const words =
      {
        ash: `The ${n.name} falls apart into cinders`,
        grey: `The ${n.name} falls, and goes to grey dust`,
        carcass: `The ${n.name} falls`,
      }[n.how] ||
      (n.kind === "dead"
        ? "The dead one falls, and is still"
        : n.kind === "drowned"
          ? "The drowned one falls, and is only weed and water"
          : `The ${n.name} falls`);
    const loot = (
      HUNT_LOOT[n.kind] ? HUNT_LOOT[n.kind](Math.random) : []
    ).filter(Boolean);
    for (const id of n.arrows || []) loot.push([id, 1]);
    // what it had on it lies where it fell
    const F = frameAt(n.dir);
    loot.forEach(([id, k], i) => {
      const a = i * 2.1;
      ground.addDrop(
        id,
        k,
        stepOn(n.dir, F, Math.sin(a) * 0.35, Math.cos(a) * 0.35, ground.R),
        ITEMS[id] && ITEMS[id].uses ? { wear: ITEMS[id].uses } : {},
      );
    });
    gotNote(
      words +
        left +
        (loot.length && (n.kind === "raider" || n.kind === "soldier")
          ? ". Something falls from their belt"
          : ""),
    );
    // the town nearest where it fell is the safer for it
    repGain(
      townNear(n.dir || ground.p, 40),
      ["raider", "soldier", "drowned", "dead"].includes(n.kind) ? 3 : 2,
      "hunt",
    );
  }
  // ---- the story's clock ----
  // how many times it has come round since you fell
  function storyCycles(t) {
    const arc = state.story && state.story.arc;
    if (!arc || !arc.clock || G.t0 == null) return 0;
    const x = (tt) => tt / arc.clock.period + arc.clock.phase;
    return Math.max(0, Math.floor(x(t)) - Math.floor(x(G.t0)));
  }
  const siteLost = (id) =>
    (G.world && G.world.sites[id] && G.world.sites[id].lost) || null;
  const LOST_HOW = {
    dragon: "burnt",
    blight: "grey",
    siege: "burnt",
    sleeper: "drowned",
    dawn: "abandoned",
    sundered: "burnt",
    fading: "frozen",
    haunted: "abandoned",
  };
  // one farm (or hamlet) near you that the story takes: the nearest that is still lived in, not on your doorstep
  function loseAFarm(how) {
    const ix = ground.siteIx;
    if (!ix) return null;
    const lived = (r) =>
      ix
        .near(ground.p, r, "big")
        .filter(
          (q) =>
            (q.kind === "farm" || q.kind === "hamlet") &&
            q.m > 1500 &&
            !siteLost(q.id),
        )
        .sort((a, b) => a.m - b.m);
    // (out where nobody lives there is nothing for it to take)
    let all = lived(40000);
    if (!all.length) all = lived(120000);
    let s =
      how === "drowned"
        ? all.find((q) => Math.abs(ix.envAt(q.dir).coastKm ?? 99) < 3)
        : all[0];
    if (!s && how === "drowned") {
      s = all[0];
      how = "abandoned";
    }
    if (!s) return null;
    siteState(s.id).lost = { how, day: dayNum() };
    ground.siteLostChanged(s.id);
    stallInfoCache.clear();
    return s;
  }
  const kmWords = (m) =>
    m < 1500
      ? "a short walk"
      : m < 9500
        ? `${Math.round(m / 1000)} km`
        : `${Math.round(m / 5000) * 5} km`;
  // it came round: what it did, out there and near you (away: how many times, if you were away on the road for them)
  function storyComesRound(n, away = 1) {
    const arc = state.story.arc;
    if (!arc) return;
    const farm = loseAFarm(LOST_HOW[arc.kind] || "abandoned");
    const where = farm
      ? `${siteName(state.story, farm)}, ${kmWords(farm.m)} ${bearingWord(ground.p, farm.dir)} of here`
      : null;
    const ant = arc.antagonist || "",
      heart = (arc.lair || arc.where || {}).name || "the far country",
      city = (arc.where || {}).name || heart;
    const T = {
      dragon: [
        `${cap(ant)} came down`,
        "for its tithe",
        `Word on the road: ${ant} came down out of ${heart} for its tithe${where ? `, and burned ${where} on the way back` : ""}.`,
      ],
      blight: [
        "The grey spreads",
        "it has taken another valley",
        `The grey has taken another valley${where ? `. It reached ${where}; the people there got out with what they could carry` : ""}.`,
      ],
      siege: [
        `Another assault on ${city}`,
        "the walls hold, for now",
        `${cap(ant)} threw themselves at the walls of ${city} again${where ? `, and their outriders burned ${where}` : ""}.`,
      ],
      sleeper: [
        "The sea boils",
        "everyone by the water dreamed the same dream",
        `The sea boiled again over ${heart}${where ? `. In the night the water came up and took ${where}` : ""}.`,
      ],
      dawn: [
        "Another night of the three fires",
        "and nobody lit them",
        `Another night came when the three fires could have been seen together, and nobody lit them${where ? `. The people of ${where} gave up waiting and left` : ""}.`,
      ],
      sundered: [
        "A new battle season",
        "the war has started again",
        `The fighting over ${heart} has started again${where ? `. War-bands burned ${where}` : ""}.`,
      ],
      fading: [
        "A killing frost",
        "it came in the night",
        `A killing frost came in the night${where ? `. At ${where} the crops are black, and the people have gone` : ""}.`,
      ],
      haunted: [
        "The dead walk again",
        `out of ${heart}`,
        `${cap(ant)} and the dead walked out of ${heart} again${where ? `. At ${where} the lamps ran out of oil before dawn, and nobody lives there now` : ""}.`,
      ],
    }[arc.kind];
    if (!T) return;
    sfx.play("news");
    if (away > 1) {
      gToast(
        T[0],
        `${cap(countWordsN(away))} times, while you were on the road`,
        3800,
      );
      addNote({
        text: `While you were on the road it came round ${countWordsN(away)} times. ${T[2]} It is getting worse.`,
        who: "News",
      });
    } else {
      gToast(T[0], T[1], 3600);
      addNote({
        text: T[2] + (n >= 3 ? " It is getting worse." : ""),
        who: "News",
      });
    }
    // and what people will be saying about it, for a while
    const fn = farm ? siteName(state.story, farm) : null;
    const gossip = {
      dragon: fn
        ? `${ant} came down again, and burned ${fn} on its way home. Fed up with grain, they say. Next time it will want more`
        : `${ant} came down again for its tithe. Every time, it wants more`,
      blight: fn
        ? `the grey has reached ${fn}. That is too close. We will be next, you watch`
        : "the grey has taken another valley. It is closer every time",
      siege: fn
        ? `the horde’s riders burned ${fn}. If ${city} falls, nowhere is safe`
        : `${ant} went at the walls of ${city} again. They will not hold for ever`,
      sleeper: fn
        ? `the sea came up in the night and took ${fn}. Nobody sleeps well any more`
        : "the sea boiled again. I dream about it, every night now",
      dawn: fn
        ? `the people of ${fn} gave up waiting for the Dawn and went away. I do not blame them`
        : "another night of the three fires came and went. Nobody lit them",
      sundered: fn
        ? `war-bands burned ${fn}. Ours or theirs, nobody knows. Nobody cares`
        : "the fighting has started again. My cousin went. He will not come back",
      fading: fn
        ? `the frost took everything at ${fn}. They have gone south, if there is a south any more`
        : "another killing frost. My grandmother says the winters were never like this",
      haunted: fn
        ? `the dead came to ${fn} and the lamps went out. Nobody lives there now. Keep yours lit`
        : "the dead walked again. Keep your lamps lit, and do not open the door",
    }[arc.kind];
    G.news = { n, gossip, day: dayNum() };
    saveLife();
  }
  // ---- the weather on you, and what you notice of it ----
