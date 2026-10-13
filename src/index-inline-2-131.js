// index-inline-2 131 — dlg
// Lines 64253-64585 of readable/index-inline-2.pretty.js (statement-aligned).
  function embark(difficulty) {
    if (!state.story || state.embarking) return;
    closeDialog();
    $("picker").hidden = true;
    const target = state.story.landing(difficulty);
    state.embarking = { dir: target, difficulty };
    $("embark").hidden = true;
    focusOn(target, true, () => {
      const now = performance.now() / 1000;
      renderer.fall = {
        dir: state.probeDir,
        t0: now,
        dur: reduceMotion ? 0.01 : 0.9,
      };
      setTimeout(
        () => {
          if (!state.embarking) return;
          const t0 = curT(),
            landDir = state.probeDir.slice();
          const op = state.story.opening(landDir, t0, difficulty);
          op.t0 = t0;
          op.landDir = landDir;
          // (a real fall from the sky can end at a fishing hut, a farm or a herders' camp: see beginningFor)
          op.mayBegin = true;
          state.embarking = null;
          if (canGround()) landOn(op, difficulty);
          else openDialog([{ text: NO_GROUND }, ...op.pages]);
        },
        reduceMotion ? 50 : 1400,
      );
    });
  }
  $("embark").addEventListener("click", () => {
    closeDialog();
    $("embark").hidden = true;
    $("continue").hidden = true;
    const sv = readSave();
    $("pickerWarn").hidden = !sv;
    if (sv)
      $("pickerWarn").textContent =
        `This starts a new life. Your saved life on ${sv.seed} will end.`;
    $("picker").hidden = false;
    $("picker")
      .querySelector('[data-diff="normal"]')
      .focus({ preventScroll: true });
  });
  $("picker").addEventListener("click", (e) => {
    const b = e.target.closest("[data-diff]");
    if (b) embark(b.dataset.diff);
  });
  $("picker").addEventListener("pointerdown", (e) => e.stopPropagation());
  $("picker").addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      $("picker").hidden = true;
      $("embark").hidden = false;
    }
  });
  $("pickerCancel").addEventListener("click", () => {
    $("picker").hidden = true;
    $("embark").hidden = false;
    showContinue();
  });

  // little sounds, made on the spot (a browser lets a page make them only after the first click or key)
  // On the ground a day is reckoned in 24 hours, however long the planet takes to turn: hunger,
  // drying out, fires and torches burning down, work and sleep keep the same pace on every world
  // (a planet with a 100-hour day has long days, not a body that needs feeding four times a day).
  const DAY_HOURS = 24;
  const sfx = new Sound();
  window.addEventListener("pointerdown", () => sfx.wake(), true);
  window.addEventListener("keydown", () => sfx.wake(), true);
  const dlg = { pages: [], i: 0, shown: 0, timer: null, hooks: null };
  function openDialog(pages, hooks = null) {
    if (G.flute) fluteClose(true);
    dlg.pages = pages;
    dlg.i = 0;
    dlg.hooks = hooks;
    $("dialog").hidden = false;
    $("dlgChron").hidden = !!(hooks && hooks.noChronicle);
    $("dialog").focus({ preventScroll: true });
    showPage();
  }
  function closeDialog(choice) {
    clearInterval(dlg.timer);
    const wasOpen = !$("dialog").hidden;
    $("dialog").hidden = true;
    renderer.fall = null;
    const h = dlg.hooks;
    dlg.hooks = null;
    if (h && h.onClose && wasOpen)
      h.onClose(typeof choice === "string" ? choice : undefined);
    if (state.story && !state.warp && $("picker").hidden && !G.on)
      $("embark").hidden = false;
  }
  function showPage() {
    const pg = dlg.pages[dlg.i];
    const last = dlg.i === dlg.pages.length - 1;
    $("dlgWho").hidden = !pg.who;
    $("dlgWho").textContent = pg.who || "";
    const el = $("dlgText");
    el.className = "text" + (pg.who ? "" : " narration");
    $("dlgPage").textContent = `${dlg.i + 1} / ${dlg.pages.length}`;
    if (dlg.hooks && dlg.hooks.onPage) dlg.hooks.onPage(dlg.i);
    $("dlgMore").hidden = true;
    $("dlgEnd").hidden = true;
    $("dlgChoices").hidden = true;
    $("dlgInputRow").hidden = true;
    clearInterval(dlg.timer);
    const voice = sfx.voiceOf(pg.who);
    if (reduceMotion) {
      el.textContent = pg.text;
      finishPage(last);
      sfx.blip(voice);
      return;
    }
    dlg.shown = 0;
    el.textContent = "";
    // it ticks as it types, in the speaker's own voice
    dlg.timer = setInterval(() => {
      const from = dlg.shown;
      dlg.shown += 2;
      el.textContent = pg.text.slice(0, dlg.shown);
      if (/[A-Za-z0-9\u00C0-\u024F]/.test(pg.text.slice(from, dlg.shown)))
        sfx.blip(voice);
      if (dlg.shown >= pg.text.length) finishPage(last);
    }, 28);
  }
  function finishPage(last) {
    clearInterval(dlg.timer);
    const pg = dlg.pages[dlg.i];
    $("dlgText").textContent = pg.text;
    dlg.shown = Infinity;
    $("dlgMore").hidden = last;
    // a page can ask you to say something in your own words (your name): a field, and a button to say it
    const inp = last && pg.input;
    const ch =
      last && (pg.choices || inp)
        ? inp
          ? [{ id: "input", label: inp.ok || "Say it", primary: true }].concat(
              pg.choices || [],
            )
          : pg.choices
        : null;
    $("dlgEnd").hidden = !last || !!ch;
    const box = $("dlgChoices");
    box.hidden = !ch;
    if (ch) {
      box.innerHTML = ch
        .map(
          (c) =>
            `<button class="btn mini${c.primary ? " primary" : ""}" type="button" data-choice="${esc(c.id)}">${esc(c.label)}</button>`,
        )
        .join("");
      const first = box.querySelector(".primary") || box.firstElementChild;
      if (first && !inp) first.focus({ preventScroll: true });
    }
    $("dlgInputRow").hidden = !inp;
    if (inp) {
      const f = $("dlgInput");
      f.placeholder = inp.placeholder || "";
      f.value = inp.value || "";
      setTimeout(() => {
        if (!$("dlgInputRow").hidden) f.focus({ preventScroll: true });
      }, 30);
    }
  }
  const dlgInputValue = () => $("dlgInput").value;
  $("dlgInput").addEventListener("keydown", (e) => {
    // typing is typing: Enter says it, Escape lets it be; nothing else reaches the dialog or the game
    e.stopPropagation();
    if (e.key === "Enter") {
      e.preventDefault();
      sfx.play("choose");
      closeDialog("input");
    } else if (e.key === "Escape") {
      e.preventDefault();
      closeDialog();
    }
  });
  $("dlgInput").addEventListener("click", (e) => e.stopPropagation());
  $("dlgChoices").addEventListener("click", (e) => {
    const b = e.target.closest("[data-choice]");
    if (b) {
      sfx.play("choose");
      closeDialog(b.dataset.choice);
    }
  });
  function advanceDialog() {
    if ($("dialog").hidden) return;
    const last = dlg.i === dlg.pages.length - 1;
    if (dlg.shown !== Infinity) {
      finishPage(last);
      return;
    }
    if (!last) {
      dlg.i++;
      sfx.play("page");
      showPage();
    }
  }
  $("dialog").addEventListener("click", (e) => {
    if (!e.target.closest("button")) advanceDialog();
  });
  $("dialog").addEventListener("pointerdown", (e) => e.stopPropagation());
  $("dialog").addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      e.stopPropagation();
      advanceDialog();
    }
    if (e.key === "Escape") closeDialog();
  });
  $("dlgClose").addEventListener("click", () => closeDialog());
  $("dlgChron").addEventListener("click", () => {
    closeDialog();
    selectTab("tabChron");
  });

  // ---------- controls ----------
  function pressOne(groupEl, btn) {
    for (const x of groupEl.children)
      x.setAttribute("aria-pressed", String(x === btn));
  }
  $("spd0").parentElement.addEventListener("click", (e) => {
    const b = e.target.closest("[data-speed]");
    if (!b) return;
    state.speed = +b.dataset.speed;
    pressOne(b.parentElement, b);
  });
  function setSpeedButtons() {
    for (const x of $("spd0").parentElement.children)
      x.setAttribute("aria-pressed", String(+x.dataset.speed === state.speed));
  }
  $("stClassic").parentElement.addEventListener("click", (e) => {
    const b = e.target.closest("[data-style]");
    if (!b) return;
    state.style = b.dataset.style;
    renderer.setStyle(state.style);
    pressOne(b.parentElement, b);
    layout();
  });
  $("lyClouds").parentElement.addEventListener("click", (e) => {
    const b = e.target.closest("[data-layer]");
    if (!b) return;
    const on = b.getAttribute("aria-pressed") !== "true";
    b.setAttribute("aria-pressed", String(on));
    if (b.dataset.layer === "clouds") renderer.showClouds = on;
    if (b.dataset.layer === "wind") renderer.showWind = on;
    if (b.dataset.layer === "plates") renderer.showPlates = on;
    if (b.dataset.layer === "grid") renderer.showGrid = on;
    state.lastRender = 0;
  });

  $("seedForm").addEventListener("submit", (e) => {
    e.preventDefault();
    $("seedGo").hidden = true;
    travelTo($("seed").value);
  });
  // a name typed that is not the world you are looking at: Go (or Enter) takes you there; Escape puts it back
  function seedGoShow() {
    const v = $("seed").value.trim();
    $("seedGo").hidden = !v || !!(state.planet && v === state.planet.seedText);
  }
  $("seed").addEventListener("input", seedGoShow);
  $("seed").addEventListener("keydown", (e) => {
    if (e.key === "Escape" && state.planet) {
      $("seed").value = state.planet.seedText;
      seedGoShow();
      $("seed").blur();
    }
  });
  $("travel").addEventListener("click", () => travelTo(randomSeedName()));
  $("copySeed").addEventListener("click", () => {
    const text = $("seed").value;
    const fallback = () => {
      $("seed").focus();
      $("seed").select();
      toast("Name selected");
    };
    try {
      navigator.clipboard
        .writeText(text)
        .then(() => toast("Name copied"), fallback);
    } catch (e) {
      fallback();
    }
  });

  // ---------- pointer: drag to turn, tap to probe ----------
  stage.addEventListener("pointerdown", (e) => {
    if (e.target.closest("button, .dialog, .picker")) return;
    if (G.on) {
      groundPointerDown(e);
      return;
    }
    stage.setPointerCapture(e.pointerId);
    state.drag = {
      x: e.clientX,
      y: e.clientY,
      sx: e.clientX,
      sy: e.clientY,
      moved: false,
      t: performance.now(),
    };
    state.anim = null;
    state.vel.yaw = state.vel.pitch = 0;
  });
  stage.addEventListener("pointermove", (e) => {
    if (G.on) {
      groundPointerMove(e);
      return;
    }
    const d = state.drag;
    if (!d) return;
    const dx = e.clientX - d.x,
      dy = e.clientY - d.y;
    if (!d.moved && Math.hypot(e.clientX - d.sx, e.clientY - d.sy) > 5) {
      d.moved = true;
      stage.classList.add("dragging");
    }
    if (!d.moved) return;
    const rad = renderer.R * renderer.P;
    const now2 = performance.now(),
      dt = Math.max(1, now2 - d.t);
    renderer.yaw += dx / rad;
    renderer.pitch = Math.max(-1.35, Math.min(1.35, renderer.pitch + dy / rad));
    state.vel.yaw = (dx / rad / dt) * 16;
    state.vel.pitch = (dy / rad / dt) * 16;
    d.x = e.clientX;
    d.y = e.clientY;
    d.t = now2;
    state.lastRender = 0;
  });
