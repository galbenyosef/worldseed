// index-inline-2 149 — ground
// Lines 70105-70448 of readable/index-inline-2.pretty.js (statement-aligned).
  function groundInput(dt) {
    const k = G.keys;
    const busy =
      !$("dialog").hidden ||
      G.menu ||
      G.paper ||
      G.packOpen ||
      G.tradeOpen ||
      G.dying ||
      G.sleeping ||
      !!G.flute;
    if (busy && G.draw) cancelDraw();
    let fwd = 0,
      strafe = 0;
    if (busy && G.auto) autoWalk(false, true);
    if (!busy) {
      fwd =
        (k.has("KeyW") || k.has("ArrowUp") ? 1 : 0) -
        (k.has("KeyS") || k.has("ArrowDown") ? 1 : 0);
      if (G.auto) fwd = 1;
      strafe = (k.has("KeyD") ? 1 : 0) - (k.has("KeyA") ? 1 : 0);
      // (walking on, a trunk or a rock in the way: a step to one side, and on)
      if (G.auto && G.autoSide) {
        strafe += G.autoSide.dir;
        G.autoSide.t -= dt;
        if (G.autoSide.t <= 0) G.autoSide = null;
      }
      const turn = (k.has("ArrowRight") ? 1 : 0) - (k.has("ArrowLeft") ? 1 : 0);
      if (turn) ground.yaw -= turn * dt * 1.9;
      if (G.stick) {
        fwd -= G.stick.y;
        strafe += G.stick.x;
      }
    }
    // out of breath: no running until it comes back
    const run =
      (k.has("ShiftLeft") ||
        k.has("ShiftRight") ||
        (G.stick && Math.hypot(G.stick.x, G.stick.y) > 0.95)) &&
      !(G.body && G.body.winded);
    // (in a conversation the wild waits too; on a vigil the night goes by faster, as long nights do when you are waiting)
    // (what is on you: the road makes you quicker, a hare's draught lighter on your feet)
    const bs = G.bless ? blessed() : null;
    return {
      move: { fwd, strafe, run: run && !G.draw, k: bs ? bs.speed : 1 },
      jump:
        !busy && !G.draw && k.has("Space") && !(G.body && G.body.breath < 8),
      jumpK: bs ? bs.leap : 1,
      speed:
        G.menu || G.paper || G.packOpen || G.tradeOpen ? 0 : G.vigil ? 4 : 1,
      hold: !$("dialog").hidden,
    };
  }
  // the only things on screen: what you could do with what is in front of you,
  // a hint at first, a title now and then, and the ember when it matters
  function groundHud(ts) {
    const idle =
      $("dialog").hidden &&
      !G.menu &&
      !G.paper &&
      !G.packOpen &&
      !G.tradeOpen &&
      !ground.journey &&
      !G.dying &&
      !G.sleeping;
    let label = null;
    G.target = null;
    const home = ground.ghost && ground.ghost.kind === "home";
    const okWord = () => {
      const gh = ground.ghost;
      return home
        ? "Build it here"
        : gh.kind === "decor"
          ? gh.hit && !gh.hit.flat
            ? "Hang it here"
            : "Set it here"
          : "Put it here";
    };
    // (with the flute out, your hands are busy: nothing to do but play)
    if (idle && !G.flute && ground.ghost)
      label = ground.ghost.ok
        ? okWord()
        : `Not here: ${ground.ghost.why || "too steep or too wet"}`;
    else if (idle && !G.flute) {
      const tg = currentTarget();
      if (tg) {
        label = targetVerb(tg);
        if (label) G.target = tg;
      }
    }
    const fo = !idle
      ? null
      : ground.cave
        ? ground.foeShown
          ? ground.foeShown(ts / 1000)
          : null
        : ground.hostileShown
          ? ground.hostileShown(ts / 1000)
          : null;
    $("gFoe").hidden = !fo;
    if (fo && fo.gr) {
      // something out in the wilds: what it is, what it is part of, and how many are left with it
      const left = fo.gr.members.length,
        gr = fo.gr;
      $("gFoe").className =
        "gfoe " +
        (gr.body === "man"
          ? "man"
          : gr.body === "dead"
            ? "common"
            : fo.K.heavy
              ? "bigbeast"
              : "beast");
      $("gFoeName").textContent = cap(fo.name);
      $("gFoeBar").style.width =
        Math.max(0, Math.round((fo.hp / fo.max) * 100)) + "%";
      $("gFoeKind").textContent =
        fo.st === "flee"
          ? "Running"
          : gr.label
            ? gr.label + (left > 1 ? ` · ${left} of them` : "")
            : left > 1
              ? `Pack · ${left} of them`
              : "";
    } else if (fo) {
      $("gFoe").className = "gfoe " + fo.tier;
      $("gFoeName").textContent =
        fo.tier === "common" ? "The restless dead" : fo.name;
      $("gFoeBar").style.width =
        Math.max(0, Math.round((fo.hp / fo.max) * 100)) + "%";
      $("gFoeKind").textContent =
        fo.tier === "lord"
          ? "Rare · tomb lord"
          : fo.tier === "champion"
            ? `Champion · ${fo.affix === "stone" ? "stone-wrapped" : fo.affix}`
            : "";
    }
    // the bow: drawn, it shows in your hands; on a touch screen a button to draw it with
    const drawn = G.draw ? ground.bowDrawn() : 0;
    bowSight.draw(drawn, !!G.pack && G.pack.arrows() === "obarrow", ts / 1000);
    const bowOn =
      idle &&
      !G.flute &&
      coarse() &&
      !ground.ghost &&
      !ground.cave &&
      !!G.pack &&
      !!G.pack.tool("bow") &&
      !!G.pack.arrows();
    $("gShoot").hidden = !(bowOn || G.draw);
    if (!$("gShoot").hidden) {
      $("gShoot").classList.toggle("on", !!G.draw);
      const n = String(G.pack.count("arrow") + G.pack.count("obarrow"));
      if ($("gShootN").textContent !== n) $("gShootN").textContent = n;
    }
    const placingTouch = idle && !!ground.ghost && coarse();
    $("gPrompt").hidden = !label || placingTouch;
    if (label) {
      $("gPromptText").textContent = label;
      $("gPrompt").firstElementChild.hidden = coarse();
    }
    $("gPlace").hidden = !placingTouch;
    if (placingTouch)
      $("placeOk").textContent = ground.ghost.ok ? okWord() : "Not here";
    $("placeTurn").hidden = !(placingTouch && ground.ghost.kind === "decor");
    $("gPlaceWhy").hidden = !(placingTouch && !ground.ghost.ok);
    if (placingTouch && !ground.ghost.ok)
      $("gPlaceWhy").textContent = cap(
        ground.ghost.why || "too steep or too wet",
      );
    $("gBagBtn").hidden = !idle && !G.packOpen;
    if (coarse()) {
      $("gStick").hidden = !idle;
      $("gAuto").hidden = !idle;
    }
    if (G.toastUntil && ts > G.toastUntil) {
      $("gToast").hidden = true;
      G.toastUntil = 0;
    }
  }

  // ---- walking on: forward without holding a key, steering by where you look ----
  function autoWalk(on, quiet = false) {
    on = !!on && G.on && !G.dying && !G.sleeping && !ground.journey;
    if (on === !!G.auto) return;
    G.auto = on;
    G.autoChk = on ? { p: ground.p.slice(), t: 0, tries: 0 } : null;
    G.autoSide = null;
    $("gAuto").classList.toggle("on", on);
    $("gAuto").setAttribute("aria-pressed", String(on));
    if (!quiet) gotNote(on ? "Walking on (Q, or W or S, to stop)" : "You stop");
  }
  // stuck against something, in the water, or hurt: you stop (after a second and a half of
  // walking that got you nowhere, counted in the world's own time, however slow the frames come)
  function autoWatch(dt, ev) {
    if (!G.auto) return;
    if (ev && (ev.swimming || ev.hurt)) {
      autoWalk(false, true);
      gotNote(ev.hurt ? "You stop" : "You stop at the water");
      return;
    }
    const C = G.autoChk;
    if (!C) return;
    C.t += Math.min(0.1, dt || 0);
    if (C.t < 1.6) return;
    const moved = arcM(C.p, ground.p, ground.R);
    if (moved < 0.6) {
      // first a step or two round it, one side then the other (not round a wall: you stop at once)
      const wall =
        ground.bumpAt &&
        ground.bumpAt.what === "wall" &&
        ground.frame - ground.bumpAt.frame < 20;
      if (C.tries < 4 && !wall) {
        G.autoSide = { dir: C.tries % 2 ? -1 : 1, t: 0.7 + C.tries * 0.35 };
        G.autoChk = {
          p: ground.p.slice(),
          t: 0,
          tries: C.tries + 1,
          side: true,
        };
        return;
      }
      autoWalk(false, true);
      gotNote("You stop: something is in the way");
      return;
    }
    // (only a stretch walked freely, not a step aside along a wall, counts as having got past it)
    G.autoChk = {
      p: ground.p.slice(),
      t: 0,
      tries: moved > 2.5 && !C.side ? 0 : C.tries,
    };
  }
  $("gAuto").addEventListener("click", (e) => {
    e.stopPropagation();
    autoWalk(!G.auto);
  });
  $("gAuto").addEventListener("pointerdown", (e) => e.stopPropagation());

  // ---- magic: blessings, the bone flute and its songs, the hermits ----
  const magicDay = () => groundSecondsPerDay(state.planet.body.dayHours);
  const pickOne = (list) => list[Math.floor(Math.random() * list.length)];
  // what is on you now, and all of it added up
  function blessNow() {
    const t = ground.t,
      out = [];
    for (const [id, until] of Object.entries(G.bless || {}))
      if (until > t && BLESS[id]) out.push(id);
    return out;
  }
  function blessed() {
    return blessSum(G.bless ? blessNow() : []);
  }
  function giveBless(id, quiet = false) {
    const b = BLESS[id];
    if (!b) return;
    G.bless = G.bless || {};
    G.bless[id] = Math.max(
      G.bless[id] || 0,
      ground.t + blessDays(id, magicDay()),
    );
    if (b.dry && G.body) G.body.wet = 0;
    if (!quiet) gotNote(`${b.name}: ${b.word}`);
    renderBless(true);
  }
  function endBless(id) {
    if (G.bless && G.bless[id]) {
      delete G.bless[id];
      renderBless(true);
    }
  }
  // the marks for what is on you (top left), each with a bar for how long it has left
  function renderBless(force) {
    const el = $("gBless"),
      now = G.on && !G.dying ? blessNow() : [];
    const tk = performance.now();
    if (!force && G.blessKey === now.join(",") && tk - (G.blessAt || 0) < 700)
      return;
    G.blessAt = tk;
    G.blessKey = now.join(",");
    el.innerHTML = now
      .map((id) => {
        const left = Math.max(
            0,
            Math.min(1, (G.bless[id] - ground.t) / blessDays(id, magicDay())),
          ),
          c = BLESS_COL[id] || [255, 210, 87];
        return `<div class="bl" style="--c: rgb(${c.join(",")})"><img src="${itemIcon("bl_" + id)}" alt=""><i><b style="width:${Math.max(6, Math.round(left * 100))}%"></b></i></div>`;
      })
      .join("");
  }
  // what a hermit asks for, in words: "two cave crystals, or four lumps of resin"
  const priceAltWords = (alts) =>
    alts
      .map((alt) => listWords(alt.map(([id, n]) => ({ id, n }))))
      .join(", or ");
  const songGlyphs = (id) =>
    SONGS[id].notes.map((n) => NOTES[n].glyph).join(" ");

  // ---- the flute: out of the satchel (R), five notes, a staff of what you just played ----
  function fluteOpen(teach = null) {
    if (G.flute) return true;
    if (!teach && !(G.pack && G.pack.has("flute"))) return false;
    // (not on the road with a caravan, on a ship, asleep or worse)
    if (!G.on || ground.journey || G.dying || G.sleeping || G.glimpse)
      return false;
    if (G.auto) autoWalk(false, true);
    cancelDraw();
    G.keys.clear();
    G.flute = {
      played: [],
      teach,
      attempt: [],
      demo: null,
      playing: false,
      title: null,
      sungN: 0,
      lastAt: 0,
    };
    $("gFlute").hidden = false;
    $("gPrompt").hidden = true;
    sfx.play("open");
    renderFlute();
    return true;
  }
  function fluteClose(quiet = false) {
    const F = G.flute;
    if (!F) return;
    G.flute = null;
    $("gFlute").hidden = true;
    if (!quiet) sfx.play("close");
    // (put down halfway through being taught: they will wait)
    if (F.teach && !F.learned && !quiet)
      openDialog([{ who: F.teach.who, text: TEACH_LINES.quit[0] }], {
        noChronicle: true,
        onClose: () => {
          ground.talkTo = null;
        },
      });
  }
  function fluteKeyLook(n, down) {
    const b = $("gFluteKeys").children[n];
    if (b) b.classList.toggle("down", !!down);
  }
