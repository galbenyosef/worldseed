// index-inline-2 148 — down
// Lines 69776-70104 of readable/index-inline-2.pretty.js (statement-aligned).
  function ditherNext() {
    ditherMode =
      { soft: "off", off: "full", full: "soft" }[ditherMode] || "soft";
    try {
      localStorage.setItem(DITHER_KEY, ditherMode);
    } catch (e) {
      /* not remembered, then */
    }
    applyDither();
    ditherLabel();
    if (G.on) gotNote(`Dithering: ${ditherMode}`);
  }
  $("mDither").addEventListener("click", () => ditherNext());
  ditherLabel();
  $("mNote").addEventListener("click", () => showPaper(true));
  $("mAgain").addEventListener("click", () => {
    if (!G.again) {
      G.again = true;
      $("mAgainWarn").hidden = false;
      return;
    }
    clearSave();
    leaveGround();
  });
  $("mCopy").addEventListener("click", () => {
    const box = $("mCode");
    if (!G.code) {
      box.hidden = false;
      box.value = "One moment…";
      saveCode(lifeData()).then((c) => {
        G.code = c;
        box.value = c;
        box.select();
      });
      return;
    }
    box.hidden = false;
    box.value = G.code;
    $("mLoad").hidden = true;
    const done = () => {
      $("mSaved").textContent = "Save code copied. Keep it somewhere safe.";
    };
    try {
      navigator.clipboard.writeText(G.code).then(done, () => {
        box.select();
        $("mSaved").textContent =
          "Copy the code above and keep it somewhere safe.";
      });
    } catch (e) {
      box.select();
    }
  });
  $("mPaste").addEventListener("click", () => {
    const box = $("mCode");
    box.hidden = false;
    box.value = "";
    box.placeholder = "Paste a save code here";
    $("mLoad").hidden = false;
    box.focus();
  });
  $("mLoad").addEventListener("click", async () => {
    try {
      const data = await readCode($("mCode").value);
      writeSave(data);
      showMenu(false);
      await continueLife(data);
    } catch (e) {
      $("mSaved").textContent =
        "That code didn’t work. Check it was copied whole.";
    }
  });
  $("gPrompt").addEventListener("click", () => interact());
  // leaving is only ever beginning again: back among the stars, this life over
  function leaveGround(quiet = false) {
    if (!G.on) return;
    quietWeather();
    closeDialog();
    if (G.packOpen) {
      G.packOpen = false;
      packUI.hide();
    }
    if (G.tradeOpen) {
      G.tradeOpen = false;
      G.trade = null;
      tradeUI.hide();
    }
    ground.endGhost();
    $("gPlace").hidden = true;
    $("gPlaceWhy").hidden = true;
    endGlimpse();
    G.vigil = null;
    ground.vigil = null;
    G.auto = false;
    const p = ground.p,
      t = ground.t;
    ground.leave();
    G.on = false;
    G.keys.clear();
    G.menu = false;
    G.paper = false;
    G.dying = false;
    G.sleeping = false;
    stage.classList.remove("ground");
    document.documentElement.classList.remove("on-ground");
    for (const id of ["ghud", "eyes", "gStick", "gMenu", "gPaper"])
      $(id).hidden = true;
    $("gFade").classList.remove("on");
    state.t = t;
    layout();
    if (quiet) return;
    focusOn(p, false);
    $("embark").hidden = false;
    showContinue();
    state.lastRender = 0;
  }
  // looking around: drag anywhere; on touch the left box walks
  function groundPointerDown(e) {
    if (
      e.target.closest(
        ".gmenu, .paper, .gmenubtn, .gprompt, .gpack, .gbag, .gplace, .gshoot, .gflute",
      )
    )
      return;
    const st = $("gStick");
    if (!st.hidden && e.target.closest("#gStick")) {
      const b = st.getBoundingClientRect();
      G.stick = {
        id: e.pointerId,
        cx: b.left + b.width / 2,
        cy: b.top + b.height / 2,
        r: b.width / 2,
        x: 0,
        y: 0,
      };
      stage.setPointerCapture(e.pointerId);
      moveStick(e);
      return;
    }
    G.look = { id: e.pointerId, x: e.clientX, y: e.clientY };
    stage.setPointerCapture(e.pointerId);
    stage.classList.add("dragging");
  }
  function moveStick(e) {
    const s = G.stick;
    let dx = (e.clientX - s.cx) / s.r,
      dy = (e.clientY - s.cy) / s.r;
    const L = Math.hypot(dx, dy);
    if (L > 1) {
      dx /= L;
      dy /= L;
    }
    s.x = dx;
    s.y = dy;
    $("gStick").firstElementChild.style.transform =
      `translate(${Math.round(dx * s.r * 0.6)}px, ${Math.round(dy * s.r * 0.6)}px)`;
  }
  function groundPointerMove(e) {
    if (G.stick && e.pointerId === G.stick.id) {
      moveStick(e);
      return;
    }
    const l = G.look;
    if (!l || e.pointerId !== l.id) return;
    const k = coarse() ? 0.006 : 0.0042;
    ground.yaw -= (e.clientX - l.x) * k;
    ground.pitch = Math.max(
      -1.35,
      Math.min(1.45, ground.pitch - (e.clientY - l.y) * k),
    );
    l.x = e.clientX;
    l.y = e.clientY;
  }
  function groundPointerUp(e) {
    if (G.stick && e.pointerId === G.stick.id) {
      G.stick = null;
      $("gStick").firstElementChild.style.transform = "";
      return;
    }
    if (G.look && e.pointerId === G.look.id) {
      G.look = null;
      stage.classList.remove("dragging");
    }
  }
  const MOVE_KEYS = new Set([
    "KeyW",
    "KeyA",
    "KeyS",
    "KeyD",
    "ArrowUp",
    "ArrowDown",
    "ArrowLeft",
    "ArrowRight",
    "ShiftLeft",
    "ShiftRight",
    "Space",
  ]);
  function groundKey(e, down) {
    const c = e.code;
    if (G.dying || G.sleeping) {
      if (MOVE_KEYS.has(c) || c === "Tab") e.preventDefault();
      return;
    }
    // the flute out: the note keys play, R (or Esc) puts it away, and nothing else moves you
    if (G.flute) {
      if (down && (c === "Escape" || c === "KeyR" || c === "KeyT")) {
        e.preventDefault();
        if (!e.repeat) fluteClose();
        return;
      }
      const n = NOTE_OF_KEY[c];
      if (n != null) {
        e.preventDefault();
        if (down && !e.repeat) fluteNote(n);
        fluteKeyLook(n, down);
        return;
      }
      if (MOVE_KEYS.has(c) || c === "Tab") e.preventDefault();
      return;
    }
    if (
      down &&
      (c === "KeyR" || c === "KeyT") &&
      !e.repeat &&
      !ground.ghost &&
      G.pack &&
      G.pack.has("flute") &&
      $("dialog").hidden &&
      !G.menu &&
      !G.paper &&
      !G.packOpen &&
      !G.tradeOpen
    ) {
      e.preventDefault();
      fluteOpen();
      return;
    }
    if (down && c === "Escape") {
      e.preventDefault();
      if (G.tradeOpen) closeTrade();
      else if (G.packOpen) closePack();
      else if (ground.ghost) cancelPlace();
      else if (G.paper) showPaper(false);
      else showMenu(!G.menu);
      return;
    }
    if (down && (c === "KeyI" || c === "Tab") && !e.repeat) {
      e.preventDefault();
      if (!$("dialog").hidden || G.menu || G.paper || G.tradeOpen) return;
      if (G.packOpen) closePack();
      else openPack();
      return;
    }
    if (G.packOpen || G.tradeOpen) return;
    if (down && c === "KeyN" && !e.repeat) {
      e.preventDefault();
      if (!$("dialog").hidden) return;
      showPaper(!G.paper);
      return;
    }
    if (down && c === "KeyM" && !e.repeat) {
      e.preventDefault();
      soundToggle();
      return;
    }
    if (down && c === "KeyQ" && !e.repeat) {
      e.preventDefault();
      autoWalk(!G.auto);
      return;
    }
    if (
      down &&
      G.auto &&
      (c === "KeyW" || c === "KeyS" || c === "ArrowUp" || c === "ArrowDown")
    )
      autoWalk(false, true);
    if (c === "KeyF") {
      e.preventDefault();
      if (down) {
        if (!e.repeat) startDraw("F");
      } else if (G.draw && G.draw.src === "F") looseArrow();
      return;
    }
    if (c === "KeyE") {
      e.preventDefault();
      if (down) {
        if (!e.repeat) {
          G.keys.add("KeyE");
          // a bow in your hand and nothing in front of you: E draws it too
          if (
            !G.target &&
            !ground.ghost &&
            heldId("hand") === "bow" &&
            G.pack.arrows() &&
            !ground.cave
          )
            startDraw("E");
          else interact();
        }
      } else {
        G.keys.delete("KeyE");
        if (G.draw && G.draw.src === "E") looseArrow();
      }
      return;
    }
    // R turns what you are setting out
    if (c === "KeyR" && ground.ghost && ground.ghost.kind === "decor") {
      e.preventDefault();
      if (down && !e.repeat) ground.turnGhost();
      return;
    }
    if (!MOVE_KEYS.has(c)) return;
    e.preventDefault();
    if (down) {
      G.keys.add(c);
      if (!G.moved && c !== "ShiftLeft" && c !== "ShiftRight") G.moved = true;
    } else G.keys.delete(c);
  }
  window.addEventListener("keyup", (e) => {
    if (
      e.target &&
      (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA")
    )
      return;
    if (G.on) groundKey(e, false);
  });
  window.addEventListener("blur", () => {
    G.keys.clear();
    cancelDraw();
  });
