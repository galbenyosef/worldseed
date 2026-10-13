// index-inline-2 160 — eff
// Lines 73268-73616 of readable/index-inline-2.pretty.js (statement-aligned).
  function useSite(tg) {
    const v = tg.view,
      s = v.site,
      sp = tg.spot;
    if (sp.ev) {
      dayUse(v, sp);
      return;
    }
    if (sp.kind === "door" && v.lost) {
      gToast(
        "Nobody",
        {
          burnt: "the door is charred shut, and the house behind it burnt out",
          grey: "grey dust lies on the step, and nobody answers",
          frozen: "the door is frozen to its frame. Nobody is inside",
          drowned: "the floor inside is mud and weed. Nobody is left",
          abandoned:
            "the house is empty. Whoever lived here took what they could carry",
        }[v.lost.how] || "nobody lives here any more",
        3000,
      );
      return;
    }
    // (in the great city, a house nobody lives in any more)
    if (sp.kind === "door" && sp.empty) {
      const lines = sp.board
        ? [
            "Boarded up, the planks nailed on long ago. Nobody lives here any more.",
            "Nailed shut. Someone chalked a sign on the planks, and the rain has had most of it.",
            "Boarded up. Through a gap you can see an empty room and a chair on its side.",
          ]
        : [
            "Nobody answers. The house is empty, and has been for a while.",
            "The door gives a little, then sticks. Dust inside, and nothing else.",
          ];
      gToast(
        sp.board ? "Boarded up" : "Empty",
        lines[Math.floor(Math.random() * lines.length)],
        3200,
      );
      return;
    }
    if (sp.kind === "door") {
      const night = ground.uniforms.uDark.value > 0.5;
      const lines = night
        ? [
            "Locked. A light moves inside, then goes out. Nobody comes.",
            "Locked. Somebody inside tells you to come back in the morning.",
          ]
        : [
            "Locked. Nobody answers.",
            "Locked. You hear somebody inside holding their breath.",
            "Locked. A dog barks inside, and nobody comes.",
          ];
      gToast(
        "The door is locked",
        lines[Math.floor(Math.random() * lines.length)].replace(
          /^Locked\. /,
          "",
        ),
        2800,
      );
      return;
    }
    if (sp.kind === "down") {
      climbDown(v);
      return;
    }
    if (sp.kind === "stable") {
      hireMount(v);
      return;
    }
    if (sp.kind === "homebed") {
      sleep({ id: "home:" + v.home.id, home: v });
      return;
    }
    if (sp.kind === "chest") {
      openChest(v);
      return;
    }
    if (sp.kind === "hearth" || sp.kind === "work") {
      openPack("make");
      return;
    }
    if (sp.kind === "mywell") {
      drawWater(v);
      return;
    }
    if (sp.kind === "myhives") {
      useHives(v);
      return;
    }
    if (sp.kind === "mystable") {
      const st = v.home && v.home.stable;
      if (st && !st.out) rideOut(v.home);
      return;
    }
    if (sp.kind === "stall") {
      openStall(v);
      return;
    }
    if (sp.kind === "myfield") {
      useField(v);
      return;
    }
    if (sp.kind === "trough") {
      useTrough(v);
      return;
    }
    if (sp.kind === "coop") {
      useCoop(v);
      return;
    }
    if (sp.kind === "beast") {
      useBeast(v, sp);
      return;
    }
    if (sp.kind === "decor") {
      takeDecor(v, sp.i);
      return;
    }
    if (sp.kind === "cave") {
      ground.enterCave(v);
      return;
    }
    const off = talesAt("offer", s.id).find((t) => G.tales[t.id].st === "on");
    if (off && G.pack.count("offering") > 0) {
      G.pack.take("offering", 1);
      G.tales[off.id].st = "left";
      const pages = [
        {
          who: null,
          text: `You leave ${off.thing} at ${siteName(state.story, s)}, as ${off.giver.name} asked. For a moment it is very quiet.`,
        },
      ];
      addNote({
        text: `You left ${off.thing} at ${siteName(state.story, s)} for ${off.giver.name}.`,
        who: "Done",
      });
      openDialog(pages, { noChronicle: true });
      saveLife();
      return;
    }
    const st = siteState(s.id);
    const res = siteUse({
      story: state.story,
      planet: state.planet,
      ix: ground.siteIx,
      site: s,
      spot: sp,
      state: st,
      here: ground.p,
      day: dayNum(),
      has: (id, n) => G.pack.count(id) >= n,
      count: (id) => G.pack.count(id),
      tool: (t) => !!G.pack.tool(t),
      food: firstFood,
    });
    if (!res) return;
    const eff = res.effect || {};
    if (eff.bell) {
      ringBell(v);
      return;
    }
    if (eff.sleep) {
      sleepAtInn(v);
      return;
    }
    if (eff.climb) {
      climbUp(v);
      return;
    }
    if (eff.view) {
      lookAround(v);
      return;
    }
    const b = G.body;
    if (eff.take) for (const [id, n] of eff.take) G.pack.take(id, n);
    if (eff.set) Object.assign(st, eff.set);
    if (eff.heal) b.hp = Math.min(100, b.hp + eff.heal);
    if (eff.breath) {
      b.breath = Math.max(b.breath, eff.breath);
      b.winded = false;
    }
    if (eff.warm) b.warmth = Math.max(b.warmth, eff.warm);
    if (eff.rested) b.rested = Math.max(b.rested, eff.rested);
    if (eff.dry) b.wet = 0;
    if (eff.note) addNote(eff.note);
    if (eff.bless) giveBless(eff.bless, true);
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
      sfx.play("chop");
    }
    const got = [];
    if (eff.loot)
      for (const [id, n] of eff.loot) {
        const left = G.pack.add(id, n);
        if (left) ground.addDrop(id, left, frontSpot(0.8));
        got.push(countWords(id, n));
      }
    if (eff.campfire) {
      if (campFire(v, !!res.pages)) {
        saveLife();
        return;
      }
    }
    if (res.pages) {
      const pages = res.pages.slice();
      if (got.length)
        pages.push({
          who: null,
          text: `You take ${listWords(eff.loot.map(([id, n]) => ({ id, n })))}.`,
        });
      if (eff.bless)
        pages.push({
          who: null,
          text: `Something of this place stays with you. (${BLESS[eff.bless].name}: ${BLESS[eff.bless].word}, for a day.)`,
        });
      openDialog(pages, { noChronicle: true });
    } else if (res.title) gToast(res.title, res.sub, 2800);
    if (G.pack.fresh.length) setTimeout(() => noteFresh(), 1500);
    saveLife();
  }
  // an old fire ring holds a fire again, with three sticks and a spark
  function campFire(v, quiet) {
    const R = ground.R,
      fa = v.fireAt || { x: 0, z: 0 };
    const ring = stepOn(v.site.dir, v.F, fa.x, -fa.z, R);
    const lit = G.world.placed.find(
      (q) => q.kind === "campfire" && arcM(q.dir, ring, R) < 1.5,
    );
    if (quiet && !lit) return false;
    if (lit) {
      if (!quiet) openPack("make");
      return !quiet;
    }
    if (G.pack.count("stick") < 3 || !G.pack.has("flint")) {
      gToast(
        "The old fire ring",
        "with three sticks and flint you could light it again",
        2800,
      );
      return true;
    }
    G.pack.take("stick", 3);
    ground.addPlaced("campfire", ring, 0, { fuel: 3, bare: true });
    gotNote("You lay sticks in the old ring and strike a spark");
    return true;
  }
  function climbUp(v) {
    const T = v.towerTop;
    if (!T) return;
    lidsTo(1, 260, () => {
      ground.p = T.land
        ? stepOn(
            v.site.dir,
            v.F || frameAt(v.site.dir),
            T.land[0],
            -T.land[1],
            ground.R,
          )
        : v.site.dir.slice();
      ground.vy = 0;
      ground.eyeY = T.alt + 1.7;
      ground.onGround = true;
      ground.pitch = -0.05;
      lidsTo(0, 420, () => {
        $("eyes").hidden = true;
      });
      const how =
        v.site.kind === "lighthouse"
          ? "you climb the stair round and round, up past the keeper’s rooms, out on to the gallery"
          : v.site.kind === "watch"
            ? "you climb the ladder to the platform"
            : v.plan.tower && v.plan.tower.manned
              ? "you climb the stair to the top"
              : "you climb the broken stair to the top";
      gToast(cap(siteName(state.story, v.site)), how, 2600);
    });
    $("eyes").hidden = false;
  }
  function climbDown(v) {
    const door = v.spots.find((q) => q.kind === "climb");
    if (!door) return;
    lidsTo(1, 260, () => {
      ground.p = door.dir.slice();
      ground.vy = 0;
      ground.eyeY =
        ground.ground.height(door.dir[0], door.dir[1], door.dir[2], 1) + 1.7;
      lidsTo(0, 420, () => {
        $("eyes").hidden = true;
      });
    });
    $("eyes").hidden = false;
  }
  function lookAround(v) {
    const g = ground,
      eyeH = g.eyeY - Math.max(0, g.ground.height(g.p[0], g.p[1], g.p[2], 1));
    const from = v
      ? ["tower", "lighthouse", "watch"].includes(v.site.kind)
        ? `the top of ${siteName(state.story, v.site)}`
        : siteName(state.story, v.site)
      : null;
    const res = viewWords(state.story, g.siteIx, g.p, eyeH, G.known, from);
    for (const n of res.notes) addNote(n);
    for (const id of res.known) G.known.add(id);
    const pages = [
      {
        who: null,
        text: v
          ? "From up here you can see a long way."
          : "From the top of the hill you can see a long way, all round.",
      },
    ];
    if (!res.lines.length)
      pages.push({
        who: null,
        text: "Nothing but land and sky, all the way to the edge of the world. Nobody lives within sight of here.",
      });
    for (let k = 0; k < res.lines.length; k += 2)
      pages.push({ who: null, text: res.lines.slice(k, k + 2).join(" ") });
    const herds = g.herdWords ? g.herdWords() : [];
    if (herds.length) pages.push({ who: null, text: herds.join(" ") });
    if (res.lines.length)
      pages.push({
        who: null,
        text: "You fix it all in your mind. (It is in your notes.)",
      });
    openDialog(pages, { noChronicle: true });
    saveLife();
  }
  function sleepAtInn(v) {
    if (ground.uniforms.uSun.value.y > 0.3) {
      gToast("Not yet", "the beds are for the night. Come back at dusk", 2600);
      return;
    }
    sleep({ id: "site:" + v.site.id, inn: v });
  }
  // walking into a named place for the first time
