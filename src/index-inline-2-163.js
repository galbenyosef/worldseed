// index-inline-2 163 — ground
// Lines 74225-74562 of readable/index-inline-2.pretty.js (statement-aligned).
  function confirmPlace() {
    const gh = ground.ghost;
    if (!gh || (!gh.dir && gh.kind !== "decor")) return;
    if (!gh.ok) {
      gotNote(`Not here: ${gh.why || "too steep or too wet"}`);
      return;
    }
    if (gh.kind === "home") {
      placeHome(gh);
      return;
    }
    if (gh.kind === "decor") {
      placeDecor(gh);
      return;
    }
    const id = G.placing;
    if (!id || G.pack.count(id) < 1) {
      cancelPlace();
      return;
    }
    G.pack.take(id, 1);
    const pl = ground.addPlaced(
      gh.kind,
      gh.dir,
      gh.yaw,
      gh.kind === "campfire" ? { fuel: 4 } : {},
    );
    if (gh.kind === "bedroll") G.bed = pl.id;
    ground.endGhost();
    G.placing = null;
    $("gPlace").hidden = true;
    gotNote(
      gh.kind === "campfire"
        ? "You strike a spark. It catches."
        : gh.kind === "bedroll"
          ? "Somewhere to sleep, and to wake"
          : "Done",
    );
    saveLife();
  }
  function cancelPlace() {
    ground.endGhost();
    G.placing = null;
    G.placingSlot = null;
    G.decorPick = null;
    $("gPlace").hidden = true;
    $("gPlaceWhy").hidden = true;
  }
  const heldId = (slot) => {
    const s = G.pack && G.pack.body[slot];
    return s && !s.worn ? s.id : null;
  };

  // ---- sleep: close your eyes, and it is morning ----
  function lidsTo(k, ms, done) {
    const k0 = G.lidK || 0,
      t0 = performance.now();
    const step = () => {
      const f = Math.min(1, (performance.now() - t0) / ms);
      G.lidK = k0 + (k - k0) * f;
      setLids(G.lidK);
      if (f < 1) requestAnimationFrame(step);
      else if (done) done();
    };
    step();
  }
  function sleep(pl) {
    if (G.flute) fluteClose(true);
    if (G.vigil) {
      gToast(
        "Not tonight",
        "you are keeping watch. Sleep, and the vigil is broken",
        2600,
      );
      return;
    }
    // (a bed under a roof can be had from dusk; out in the open, sleep comes when it is dark)
    if (
      ground.uniforms.uSun.value.y >
      (pl.inn || pl.tavern || pl.home ? 0.3 : 0.08)
    ) {
      gToast("Not yet", "sleep comes when it gets dark", 2400);
      return;
    }
    if (!pl.tavern && ground.huntedNow && ground.huntedNow()) {
      gToast("Not now", "not with something hunting you out there", 2400);
      return;
    }
    cancelDraw();
    if (ground.riding) ground.getDown();
    G.sleeping = true;
    G.bed = pl.id;
    $("eyes").hidden = false;
    G.lidK = 0;
    lidsTo(1, 900, () => {
      const P = state.planet,
        g = ground,
        lt = P.localTime(g.p[0], g.p[1], g.p[2], g.t);
      // (until first light, whatever the length of the planet's day: then hours of a 24-hour day)
      const frac = (((0.265 - lt.hours / lt.dayHours) % 1) + 1) % 1,
        hours = frac * DAY_HOURS;
      // whatever was about in the night has gone by morning
      if (g.clearHostiles) g.clearHostiles();
      const sh = g.shelterAt();
      const fire = G.world.placed.find(
        (f) =>
          f.kind === "campfire" &&
          (f.fuel || 0) >= hours * 0.5 &&
          arcM(g.p, f.dir, g.R) < 7,
      );
      const warm = !!fire || sh.shelter || !!pl.inn || !!pl.home || !!pl.tavern;
      g.t += frac;
      for (const f of G.world.placed)
        if (f.kind === "campfire" && f.fuel > 0)
          f.fuel = Math.max(0, f.fuel - hours);
      const b = G.body;
      b.food = Math.max(0, b.food - hours * 2.2);
      b.breath = 100;
      b.winded = false;
      b.hp = Math.min(100, b.hp + (warm ? 40 : 12));
      if (warm) {
        b.rested = 900;
        b.warmth = Math.max(b.warmth, 62);
      } else {
        b.rested = 0;
        b.warmth = Math.min(b.warmth, 35);
      }
      saveLife();
      setTimeout(
        () =>
          lidsTo(0, 1300, () => {
            G.sleeping = false;
            $("eyes").hidden = true;
            gToast(
              "Morning",
              pl.home
                ? "you slept well, in your own bed"
                : pl.inn
                  ? `you slept well at ${siteName(state.story, pl.inn.site)}`
                  : pl.tavern
                    ? `you slept well at ${pl.tavern.name}, in ${pl.tavern.town.name}`
                    : warm
                      ? "you slept well"
                      : "a cold night, and not much sleep",
              2800,
            );
            setTimeout(() => {
              if (G.on && !G.sleeping) stallsCheck(true);
            }, 3200);
          }),
        500,
      );
    });
  }

  // ---- dying: the ember goes out; the observer's view; "Not yet." ----
  function die() {
    if (G.flute) fluteClose(true);
    if (G.dying) return;
    G.dying = true;
    sfx.play("fall");
    autoWalk(false, true);
    if (G.vigil) endVigil(false, "quiet");
    if (G.packOpen) {
      G.packOpen = false;
      packUI.hide();
    }
    if (G.tradeOpen) {
      G.tradeOpen = false;
      G.trade = null;
      tradeUI.hide();
    }
    cancelPlace();
    showMenu(false);
    showPaper(false);
    closeDialog();
    const where = ground.p.slice();
    G.diedIn = ground.cave ? ground.cave.site : null;
    // your things stay where you fell; what you wear comes with you
    const contents = G.pack.slots.map(slotRow);
    G.pack.slots = [];
    G.pack.changed();
    if (contents.length)
      ground.addPlaced("bundle", where, Math.random() * 6.28, { contents });
    $("gFade").classList.add("on");
    setTimeout(() => startGlimpse(where), 1300);
  }
  function startGlimpse(where) {
    if (!G.on) return;
    state.t = ground.t;
    ground.canvas.hidden = true;
    $("ghud").hidden = true;
    focusOn(where, false);
    stage.classList.add("glimpse");
    G.glimpse = { t0: performance.now() };
    const spark = document.createElement("div");
    spark.className = "gspark";
    spark.id = "gSpark";
    const words = document.createElement("div");
    words.className = "gnotyet";
    words.id = "gNotYet";
    words.textContent = G.name ? `Not yet, ${G.name}.` : "Not yet.";
    words.style.opacity = "0";
    stage.append(spark, words);
    state.lastRender = 0;
    $("gFade").classList.remove("on");
  }
  function stepGlimpse(ts) {
    const k = (performance.now() - G.glimpse.t0) / 1000;
    renderer.render(curT(), ts / 1000);
    ctx.putImageData(image, 0, 0);
    const r = stage.getBoundingClientRect(),
      f = Math.min(1, k / 2.2);
    const sp = $("gSpark");
    if (sp) {
      sp.style.left = Math.round(r.width / 2 - 3) + "px";
      sp.style.top = Math.round(-24 + (r.height / 2 + 24) * f * f) + "px";
      sp.style.opacity = k > 2.3 ? "0" : "1";
    }
    const w = $("gNotYet");
    if (w) w.style.opacity = k > 0.7 ? "1" : "0";
    if (k > 2.9) $("gFade").classList.add("on");
    if (k > 3.8) respawn();
  }
  function endGlimpse() {
    G.glimpse = null;
    stage.classList.remove("glimpse");
    for (const id of ["gSpark", "gNotYet"]) {
      const el = $(id);
      if (el) el.remove();
    }
  }
  function respawn() {
    endGlimpse();
    const g = ground;
    if (g.clearHostiles) g.clearHostiles();
    // (a while to get your bearings and your things back before anything comes again)
    g.huntCool = Math.max(g.huntCool || 0, 240);
    if (g.clearArrows) g.clearArrows();
    G.draw = null;
    const bed =
      G.bed &&
      G.world.placed.find((p) => p.id === G.bed && p.kind === "bedroll");
    const inn =
      !bed && G.bed && String(G.bed).startsWith("site:")
        ? g.siteIx.get(String(G.bed).slice(5))
        : null;
    const home =
      !bed && !inn && G.bed && String(G.bed).startsWith("home:")
        ? (G.world.homes || []).find((h) => "home:" + h.id === G.bed)
        : null;
    const tavernTown =
      !bed && !inn && !home && G.bed && String(G.bed).startsWith("town:")
        ? state.story.settlements[+String(G.bed).slice(5)]
        : null;
    let spot, text;
    if (home) {
      spot = g.homeWakeSpot(home);
      text = `You wake in your own bed, in your own ${HOME_SIZE[home.size].word}, with a gasp, as if someone had pulled you back up out of deep water. Your things are still where you fell.`;
    } else if (inn) {
      const b = sitePlan(state.story, inn).spots.find(
        (q) => q.kind === "bed",
      ) || { x: 0, z: 6 };
      spot = stepOn(inn.dir, frameAt(inn.dir), b.x, -(b.z + 1.2), g.R);
      text = `You wake in a bed at ${siteName(state.story, inn)}, gasping. Someone carried you in, the innkeeper says, and would not give a name. Your things are still where you fell.`;
    } else if (bed) {
      spot = bed.dir;
      text =
        "You wake on your bedroll with a gasp, as if someone had pulled you back up out of deep water. Your things are still where you fell.";
    } else if (tavernTown) {
      spot = g.townWakeSpot(tavernTown);
      text = `You wake in your bed at the tavern in ${tavernTown.name}, gasping. Someone carried you in, and nobody will say who. Your things are still where you fell.`;
    } else {
      let best = null;
      for (const s of state.story.settlements) {
        const m = arcM(g.p, s.dir, g.R);
        if (!best || m < best.m) best = { s, m };
      }
      spot = g.townWakeSpot(best.s);
      text = `You wake in a bed in ${best.s.name}, sore and alive. Someone found you and carried you here. Your things are still where you fell.`;
    }
    if (G.diedIn) {
      const nm = siteName(state.story, G.diedIn);
      text = text.includes("Your things are still where you fell.")
        ? text.replace(
            "Your things are still where you fell.",
            `Your things are at the mouth of ${nm}, where they found you.`,
          )
        : text + ` They found you at the mouth of ${nm}.`;
      G.diedIn = null;
    }
    g.respawnAt(spot);
    // at home you wake facing into the room
    if (home) g.yaw = -bearingTo(spot, home.dir);
    const b = G.body;
    b.hp = 60;
    b.breath = 100;
    b.warmth = Math.max(b.warmth, 60);
    b.food = Math.max(b.food, 30);
    b.wet = 0;
    b.winded = false;
    // whatever was on you did not come back with you
    G.bless = {};
    renderBless(true);
    $("eyes").hidden = false;
    setLids(1);
    G.afterWake = { pages: [{ who: null, text }] };
    G.eyes = 1;
    G.dying = false;
    setTimeout(() => $("gFade").classList.remove("on"), 250);
    saveLife();
  }

  // ---- between frames: breath, warmth, food, fires and torches ----
  // a geyser near you: it roars when it goes, and it scalds whoever stands on its vent (armour is no help)
  function geyserStep(dt, ts) {
    const gy = ground.geyserNear ? ground.geyserNear(450) : null;
    if (!gy) {
      G.geyserT = null;
      return 0;
    }
    // (a new round has begun: it goes)
    if (G.geyserT != null && gy.t < G.geyserT - 1) sfx.play("roar");
    G.geyserT = gy.t;
    if (gy.H < 2.5 || gy.m > gy.G.r || ground.journey) return 0;
    G.hurtAt = ts;
    G.body.wet = 1;
    if (!G.scaldAt || ts - G.scaldAt > 6000) {
      G.scaldAt = ts;
      gToast(
        "Scalded",
        "boiling water comes up out of the ground all round you",
        2600,
      );
      sfx.play("hurt");
    }
    return 8 * dt;
  }
