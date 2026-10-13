// index-inline-2 164 — math
// Lines 74563-74845 of readable/index-inline-2.pretty.js (statement-aligned).
  function lifeStep(dt, ts, hours, inp) {
    const g = ground,
      b = G.body,
      ev = g.events || {};
    if (G.gotUntil && ts > G.gotUntil) {
      $("gGot").hidden = true;
      G.gotUntil = 0;
    }
    if (G.dying || G.glimpse) {
      ember.draw(b, ts / 1000, dt, true);
      return;
    }
    g.setHeld(heldId("hand"), heldId("off"));
    // something small at your legs, below the bottom of your view: you look down at it (unless you are looking round yourself)
    if (!G.look && !g.cave && g.hostileAt) {
      const ho = g.hostileAt(2.8),
        h = ho && ho.h;
      if (h && h.gr && h.gr.body === "beast") {
        const ang = -Math.atan2(
          g.eyeY - (Math.max(h.alt || 0, -0.4) + 0.45),
          Math.max(0.5, ho.d),
        );
        if (g.pitch - ang > 0.5)
          g.pitch = Math.max(ang + 0.45, g.pitch - dt * 1.8);
      }
    }
    if (G.hit && performance.now() >= G.hit.at) landHit();
    // hold E to keep chopping
    if (
      G.keys.has("KeyE") &&
      !G.draw &&
      !G.hit &&
      g.swingT < 0 &&
      G.target &&
      (G.target.kind === "tree" ||
        G.target.kind === "rock" ||
        G.target.kind === "foe")
    )
      interact();
    if (G.draw && (g.cave || g.journey || !G.pack.tool("bow"))) cancelDraw();
    // how dangerous the wilds are: not at all on your first day; after that by how hard a fall you chose
    if (!G.threatAt || ts - G.threatAt > 3000) {
      G.threatAt = ts;
      const dk = G.diff === "easy" ? 0.5 : G.diff === "hard" ? 1.5 : 1,
        arc = state.story.arc,
        lv = storyCycles(g.t);
      const heart = arc && (arc.lair || arc.where);
      // (and it comes on gently: half on the second day, three quarters on the third)
      const dn = dayNum(),
        ramp = dn <= 1 ? 0 : dn === 2 ? 0.45 : dn === 3 ? 0.75 : 1;
      g.threat = {
        k: dk * ramp,
        dmg: G.diff === "easy" ? 0.75 : G.diff === "hard" ? 1.25 : 1,
        level: Math.min(6, lv),
        arc: arc
          ? { kind: arc.kind, antagonist: arc.antagonist, rival: arc.rival }
          : null,
        heart: heart && heart.dir ? heart.dir : null,
      };
      // the story's clock has come round again since you last looked: what it did (one at a time;
      // after a long way, all of it at once, as news waiting for you at the end of it)
      if (G.cycles == null) G.cycles = lv;
      else if (lv > G.cycles && !G.dying && !G.sleeping && !g.journey) {
        const away = lv - G.cycles;
        G.cycles = away > 1 ? lv : G.cycles + 1;
        storyComesRound(G.cycles, away > 1 ? away : 1);
      }
    }
    // something has seen you; something you hit went down
    if (g.huntAlarm) {
      gToast(g.huntAlarm.title, g.huntAlarm.sub, 2600);
      g.huntAlarm = null;
      sfx.play("alarm");
    }
    // an arrow went in: a burst where it struck
    if (g.arrowHit) {
      const ah = g.arrowHit,
        at = g.screenAt(ah.dir, ah.alt);
      g.arrowHit = null;
      if (at) {
        fx.hit(at.x, at.y, { big: ah.down, spark: SPARK[ah.kind] });
        sfx.play("hit");
      }
    }
    if (g.huntNews && g.huntNews.length) {
      const list = g.huntNews;
      g.huntNews = [];
      for (const n of list) huntDown(n);
    }
    // how far your blows reach with what you fight with; a red edge when something hits you
    g.weaponReach = weaponReach(weaponNow());
    if (ev.hurt) {
      G.hurtAt = ts;
      sfx.play("hurt");
    }
    autoWatch(dt, ev);
    const hk = G.hurtAt ? Math.max(0, 1 - (ts - G.hurtAt) / 650) : 0;
    $("gHurt").style.opacity = (Math.ceil(hk * 4) / 4).toFixed(2);
    if (ev.cry)
      gToast(
        ev.cry.name.split(",")[0] + " cries out",
        "the sound roots you to the spot",
        2200,
      );
    if (ev.wading) b.wet = Math.max(b.wet, 0.35);
    if (ev.stir)
      gToast(
        "Something stirs",
        "you have stayed among the dead too long",
        2800,
      );
    if (!g.ready || g.journey || G.sleeping || inp.speed === 0) {
      if (!g.ready || g.journey) quietWeather();
      ember.draw(b, ts / 1000, dt);
      return;
    }
    // the air where you stand: its climate, colder at night
    if (!G.airAt || ts - G.airAt > 1000) {
      const S = {};
      state.planet.ground.sample(g.p[0], g.p[1], g.p[2], 8, S);
      G.airT = S.T;
      G.airAt = ts;
    }
    const sun = g.uniforms.uSun.value.y;
    const sh = g.shelterAt();
    // (cloud keeps the sun off you, rain and snow and a hard wind chill you)
    const wx = g.wx && !g.cave ? g.wx : null;
    const chill = wx
      ? wx.cloud * 3 * Math.max(0, Math.min(1, sun * 2.5)) +
        wx.rain * 2.5 +
        wx.snow * 1.5 +
        (sh.shelter ? 0 : Math.max(0, wx.wind - 7) * 0.35)
      : 0;
    const airC = g.cave
      ? Math.max(3, Math.min(15, G.airT))
      : G.airT + 5 * Math.max(-1, Math.min(1, sun * 2.5)) - 1 - chill;
    if (wx) weatherStep(wx, sh, dt, ts);
    else quietWeather();
    if (g.inPool()) sh.fireC = Math.max(sh.fireC, 22);
    checkVisits(ts);
    townCheck(ts);
    summitCheck(ts);
    const scald = geyserStep(dt, ts);
    // what is on you: mending, drying out, seeing in the dark; the marks for it, top left
    const bs = blessed();
    if (bs.heal) b.hp = Math.min(100, b.hp + bs.heal * dt);
    if (bs.dry) b.wet = 0;
    const see = g.uniforms.uSee;
    if (see)
      see.value += ((bs.see ? 1 : 0) - see.value) * Math.min(1, dt * 1.5);
    renderBless(false);
    vigilStep(dt, ts);
    if (G.fishing) fishStep(dt, ts);
    if (g.faunaNews) {
      gotNote(g.faunaNews);
      g.faunaNews = null;
    }
    const dead = b.step(dt, hours, {
      airC,
      clothesC: G.pack.warmth(),
      fireC: Math.max(sh.fireC, bs.fireC),
      shelter: sh.shelter,
      running: ev.running,
      swimming: ev.swimming,
      jumped: ev.jumped,
      impact: (ev.impact || 0) + scald,
      blows: ev.blows,
      guard: guardOf(G.pack.armour() + bs.armour),
      now: ts,
      tireless: bs.tireless,
      deepBreath: bs.breath,
      regen: bs.regen,
    });
    // fires burn down, a torch burns out
    for (const pl of G.world.placed)
      if (pl.kind === "campfire" && pl.fuel > 0)
        pl.fuel = Math.max(0, pl.fuel - hours);
    const torch = G.pack.body.off;
    if (
      torch &&
      ITEMS[torch.id] &&
      ITEMS[torch.id].tool === "torch" &&
      !torch.worn
    ) {
      torch.wear = (torch.wear ?? ITEMS[torch.id].burn) - hours;
      if (torch.wear <= 0) {
        G.pack.body.off = null;
        G.pack.changed();
        gotNote("Your torch burns out");
      }
    }
    ember.draw(b, ts / 1000, dt);
    fxFrame(dt);
    if (dead) die();
    else if (ts - (G.lastSave || 0) > 15000) saveLife();
    if (!dead && (!G.stallAt || ts - G.stallAt > 8000)) {
      G.stallAt = ts;
      stallsCheck();
      farmCheck();
      raidCheck();
    }
  }

  // ---------- main loop ----------
  // one frame on the ground: what you do, the world moving on, your body, what is on the screen
  // (skip: the world moves on but is not drawn, for running time on in a test)
  function groundFrame(dt, ts, skip = false) {
    if (!ground.ready) ground.warmStep(ground.canvas.hidden || skip ? 30 : 12);
    if (G.eyes === 1 && ground.ready) openEyes();
    const t0 = ground.t,
      inp = groundInput(dt);
    if (skip) inp.skipRender = true;
    stepLook();
    ground.update(dt, ts, inp);
    if (G.body) lifeStep(dt, ts, Math.max(0, ground.t - t0) * DAY_HOURS, inp);
    if (!$("ghud").hidden) groundHud(ts);
  }
  function tick(ts) {
    requestAnimationFrame(tick);
    const dt = Math.min(0.1, Math.max(0, (ts - (state.lastTs || ts)) / 1000));
    state.lastTs = ts;
    if (G.on && ground) {
      if (G.glimpse) {
        stepGlimpse(ts);
        return;
      }
      groundFrame(dt, ts);
      return;
    }
    if (!image) return;
    if (state.warp) {
      const k = Math.min(1, (ts - state.warp.t0) / 500);
      renderer.renderWarp(ts / 1000, k);
      ctx.putImageData(image, 0, 0);
      return;
    }
    if (state.speed) state.t += (dt * state.speed) / SECONDS_PER_DAY;
    let moving = !!state.speed || !!state.drag || !!renderer.fall;
    if (state.anim) {
      const a = state.anim,
        k = Math.min(1, (performance.now() - a.t0) / a.dur);
      const e = k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
      a.e = e;
      renderer.yaw = a.from.yaw + (a.to.yaw - a.from.yaw) * e;
      renderer.pitch = a.from.pitch + (a.to.pitch - a.from.pitch) * e;
      if (k >= 1) {
        state.t += a.tOff;
        state.anim = null;
        if (a.then) a.then();
      }
      moving = true;
    } else if (
      !state.drag &&
      (Math.abs(state.vel.yaw) > 1e-4 || Math.abs(state.vel.pitch) > 1e-4)
    ) {
      renderer.yaw += state.vel.yaw;
      renderer.pitch = Math.max(
        -1.35,
        Math.min(1.35, renderer.pitch + state.vel.pitch),
      );
      state.vel.yaw *= 0.9;
      state.vel.pitch *= 0.9;
      moving = true;
    }
    if (!state.planet) return;
    const interval = moving ? 1000 / 30 : 1000 / 6;
    if (ts - state.lastRender < interval) return;
    state.lastRender = ts;
    renderer.render(curT(), ts / 1000);
    ctx.putImageData(image, 0, 0);
    if (ts - state.lastHud > 250) {
      state.lastHud = ts;
      $("hudTime").innerHTML =
        `Day <b>${curT().toFixed(2)}</b>${state.speed ? "" : " · paused"}`;
    }
    if (ts - state.lastSlow > 1000) {
      state.lastSlow = ts;
      updateProbeReadout();
      updateClock();
    }
  }

  // ---------- boot ----------
