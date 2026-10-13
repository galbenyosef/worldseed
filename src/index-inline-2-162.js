// index-inline-2 162 — ground
// Lines 73905-74224 of readable/index-inline-2.pretty.js (statement-aligned).
  function weatherStep(wx, sh, dt, ts) {
    const b = G.body,
      g = ground,
      S = G.wxSaid || (G.wxSaid = {});
    // out from under a roof, rain soaks you through in a minute or two (snow more slowly)
    if (!sh.shelter && !blessed().dry)
      b.wet = Math.min(1, b.wet + dt * (wx.rain * 0.011 + wx.snow * 0.003));
    // the sound of it: rain on everything (quieter indoors), the wind in a gale
    sfx.amb(
      "rain",
      Math.min(1, wx.rain * 1.2 + wx.storm * 0.2) *
        (g.wx.indoors ? 0.06 : 0.16),
      { type: "bandpass", freq: 1500 + wx.rain * 900, q: 0.55, hi: 300 },
    );
    sfx.amb(
      "wind",
      Math.max(0, Math.min(1, (wx.wind - 6) / 10)) *
        (g.wx.indoors ? 0.03 : 0.1),
      { type: "lowpass", freq: 380, q: 0.4, hi: 40, ease: 1.5 },
    );
    // say so when it changes (and not every moment it wavers)
    const now = ts / 1000,
      say = (k, text, gap = 40) => {
        if (now - (S[k] || -1e9) < gap) return;
        S[k] = now;
        gotNote(text);
      };
    const flip = (k, on, off, textOn, textOff) => {
      if (!S["on_" + k] && on) {
        S["on_" + k] = true;
        if (textOn) say(k, textOn);
      } else if (S["on_" + k] && off) {
        S["on_" + k] = false;
        if (textOff) say(k + "x", textOff);
      }
    };
    flip(
      "rain",
      wx.rain > 0.28,
      wx.rain < 0.07,
      wx.rain > 0.65 ? "Rain, coming down hard" : "It starts to rain",
      "The rain stops",
    );
    flip(
      "snow",
      wx.snow > 0.28,
      wx.snow < 0.07,
      "Snow begins to fall",
      "The snow stops",
    );
    flip(
      "fog",
      wx.fog > 0.55,
      wx.fog < 0.2,
      "Fog has come down. You can hardly see",
      "The fog lifts",
    );
    const sunUp = g.uniforms.uSun.value.y,
      dayN = g.dayNum || 0;
    if (wx.heat > 0.55 && S.heatDay !== dayN) {
      S.heatDay = dayN;
      say("heat", "The heat comes up off the ground in waves", 5);
    }
    // the sky at night: falling stars, the lights at the pole, a full moon; by day, the sun going dark
    const sk = g.skyU;
    if (sunUp < -0.1 && wx.cloud < 0.4) {
      if (sk.uMeteor.value > 0.3 && S.starNight !== dayN) {
        S.starNight = dayN;
        say("stars", "Falling stars tonight, one after another", 5);
      } else if (sk.uAurora.value > 0.3 && S.auroraNight !== dayN) {
        S.auroraNight = dayN;
        say(
          "aurora",
          "Lights hang in the sky towards the pole, green and violet",
          5,
        );
      } else if (g.uniforms.uMoon.value > 0.9 && S.moonNight !== dayN) {
        S.moonNight = dayN;
        say("moon", "The moon is full tonight", 5);
      }
    }
    if (
      (g.eclipse || 0) > 0.6 &&
      sunUp > 0 &&
      (!S.eclipseAt || now - S.eclipseAt > 600)
    ) {
      S.eclipseAt = now;
      sfx.play("news");
      gToast("The sun goes dark", "a moon has crossed in front of it", 4200);
    }
  }
  const quietWeather = () => {
    sfx.amb("rain", 0);
    sfx.amb("wind", 0);
  };
  function onThunder(delay, near) {
    const S = G.wxSaid || (G.wxSaid = {}),
      now = performance.now() / 1000;
    if (ground.cave || ground.journey) return;
    sfx.play("thunder", { near, at: delay });
    if (near > 0.55 && now - (S.thunder || -1e9) > 90) {
      S.thunder = now;
      setTimeout(() => {
        if (G.on && !G.sleeping) gotNote("Thunder, close by");
      }, delay * 1000);
    }
  }
  function gotNote(text) {
    const el = $("gGot");
    el.textContent = text;
    el.hidden = false;
    G.gotUntil = performance.now() + 1700;
  }
  function interact() {
    if (
      !G.on ||
      G.menu ||
      G.paper ||
      G.packOpen ||
      G.tradeOpen ||
      G.dying ||
      G.sleeping ||
      !$("dialog").hidden ||
      ground.journey
    )
      return;
    if (ground.ghost) {
      confirmPlace();
      return;
    }
    const tg = G.target || currentTarget();
    if (!tg) return;
    switch (tg.kind) {
      case "person":
        talk({ np: tg.np });
        return;
      case "find": {
        const d = FINDS[tg.find.kind];
        if (G.pack.room(d.item) < 1) {
          gotNote("No room to carry more");
          return;
        }
        const got = ground.takeFind(tg);
        const knife = tg.find.kind === "fiber" ? G.pack.tool("knife") : null;
        const n = got.n * (knife ? (ITEMS[knife.id].power ? 3 : 2) : 1),
          left = G.pack.add(got.item, n);
        if (knife && G.pack.wearTool(knife))
          gotNote("Your flint knife is worn out. You keep it.");
        else gotNote(`+ ${countWords(got.item, n - left)}`);
        sfx.play("pickup");
        dropSpill(G.pack.takeSpill());
        if (G.pack.fresh.length) setTimeout(() => noteFresh(), 1300);
        return;
      }
      case "drop": {
        const dr = tg.drop,
          extra = slotExtra(dr);
        if (dr.tale && G.tales[dr.tale]) G.tales[dr.tale].got = true;
        const left = G.pack.add(dr.item, dr.n, extra);
        if (left === dr.n) {
          gotNote("No room to carry it");
          return;
        }
        gotNote(`+ ${countWords(dr.item, dr.n - left)}`);
        sfx.play(dr.item === "oldcoin" ? "coin" : "pickup");
        if (left) {
          dr.n = left;
          ground.refreshDrop(dr);
        } else ground.removeDrop(dr);
        if (G.pack.fresh.length) setTimeout(() => noteFresh(), 1300);
        return;
      }
      case "tree":
      case "rock": {
        if (
          !G.pack.tool(tg.kind === "tree" ? "axe" : "hammer") ||
          ground.swingT >= 0 ||
          G.hit
        )
          return;
        ground.swing();
        swingFx(G.pack.tool(tg.kind === "tree" ? "axe" : "hammer").id);
        sfx.play("swing");
        G.hit = { tg, at: performance.now() + 190 };
        return;
      }
      case "placed": {
        const pl = tg.placed;
        if (pl.kind === "campfire" || pl.kind === "workstone") openPack("make");
        else if (pl.kind === "bedroll") sleep(pl);
        else if (pl.kind === "bundle") takeBundle(pl);
        else if (pl.kind === "wreck")
          gToast(
            "Straw, beams, a pot in pieces",
            G.begin && G.begin.st === "owe"
              ? "and a hole in a roof. Six logs would mend it"
              : "what is left of the roof you came through",
            3000,
          );
        return;
      }
      case "site":
        useSite(tg);
        return;
      case "cave":
        useCave(tg);
        return;
      case "summit":
        lookAround(null);
        return;
      case "mount":
        rideOut(tg.rec);
        return;
      case "dismount":
        ground.getDown();
        sfx.play("hoof");
        saveLife();
        return;
      case "water":
        fishAct();
        return;
      case "foe": {
        if (ground.swingT >= 0 || G.hit) return;
        ground.swing();
        {
          const w = weaponNow();
          swingFx(w && w.id);
        }
        sfx.play("swing");
        G.hit = { tg, at: performance.now() + 170 };
        return;
      }
      case "carcass": {
        if (!G.pack.tool("knife")) {
          gotNote("You need a knife to butcher it");
          return;
        }
        if (ground.swingT >= 0 || G.hit) return;
        ground.swing();
        swingFx(G.pack.tool("knife").id);
        sfx.play("swing");
        G.hit = { tg, at: performance.now() + 220 };
        return;
      }
    }
  }
  // a blow lands a moment into the swing
  function landHit() {
    const h = G.hit;
    G.hit = null;
    if (h.tg.kind === "foe") {
      strikeFoe();
      return;
    }
    if (h.tg.kind === "carcass") {
      butcherCarcass(h.tg.carcass);
      return;
    }
    const tg = h.tg,
      tool = tg.kind === "tree" ? "axe" : "hammer";
    const st = G.pack.tool(tool);
    if (!st) return;
    sfx.play("chop");
    fx.chips(
      0.5 + (Math.random() - 0.5) * 0.04,
      0.56,
      tool === "axe" ? SPARK.wood : SPARK.stone,
    );
    ground.hitStopFor(0.05);
    ground.jolt(tg.kind === "rock" ? 1.3 : 1);
    if (!G.chop || G.chop.sid !== tg.sid) G.chop = { sid: tg.sid, hits: 0 };
    G.chop.hits++;
    const need = Math.max(
      1,
      Math.ceil(
        (tg.kind === "tree"
          ? Math.max(3, Math.ceil(tg.r * 16))
          : Math.max(2, Math.ceil(tg.r * 4))) / (ITEMS[st.id].power || 1),
      ),
    );
    if (G.pack.wearTool(st)) {
      gotNote(
        `Your ${itemName(st.id).toLowerCase()} is worn out. You keep it.`,
      );
      dropSpill(G.pack.takeSpill());
    }
    if (G.chop.hits < need) return;
    G.chop = null;
    if (tg.kind === "tree") ground.fell(tg);
    else {
      const res = ground.breakRock(tg);
      if (res) {
        ground.addDrop("stone", res.stones, res.dir);
        if (res.flint)
          ground.addDrop(
            "flint",
            res.flint,
            stepOn(res.dir, frameAt(res.dir), 0.45, 0.3, ground.R),
          );
      }
    }
    saveLife();
  }
  function takeBundle(pl) {
    const left = [];
    for (const row of pl.contents || []) {
      const s = slotFrom(row);
      if (!s) continue;
      const l = G.pack.add(s.id, s.n, slotExtra(s));
      if (l) left.push(slotRow({ ...s, n: l }));
    }
    if (left.length) {
      pl.contents = left;
      gotNote("You take what you can carry");
    } else {
      ground.removePlaced(pl);
      gotNote("You have your things back");
    }
    saveLife();
  }
