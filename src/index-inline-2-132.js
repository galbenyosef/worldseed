// index-inline-2 132 — state
// Lines 64586-64801 of readable/index-inline-2.pretty.js (statement-aligned).
  function endDrag(e) {
    if (G.on) {
      groundPointerUp(e);
      return;
    }
    const d = state.drag;
    if (!d) return;
    state.drag = null;
    stage.classList.remove("dragging");
    if (!d.moved && e.type === "pointerup" && state.planet && !state.warp) {
      const r = canvas.getBoundingClientRect();
      const k = r.width / canvas.width;
      const px = (e.clientX - r.left) / k,
        py = (e.clientY - r.top) / k;
      const dir = renderer.pick(px, py, curT());
      if (dir) {
        probeAt(dir);
        selectTab("tabProbe");
      }
    }
    if (reduceMotion) state.vel.yaw = state.vel.pitch = 0;
  }
  stage.addEventListener("pointerup", endDrag);
  stage.addEventListener("pointercancel", endDrag);
  stage.addEventListener("dblclick", (e) => {
    if (G.on || e.target.closest("button, .dialog, .picker")) return;
    const y0 = renderer.yaw;
    state.anim = {
      from: { yaw: y0, pitch: renderer.pitch },
      to: { yaw: y0 + Math.atan2(Math.sin(-y0), Math.cos(-y0)), pitch: 0.2 },
      tOff: 0,
      t0: performance.now(),
      dur: reduceMotion ? 1 : 700,
      e: 0,
    };
  });

  window.addEventListener("keydown", (e) => {
    if (
      e.target &&
      (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA")
    )
      return;
    if (!$("dialog").hidden && e.target === $("dialog")) return;
    if (G.on) {
      groundKey(e, true);
      return;
    }
    if (e.code === "KeyM" && !e.repeat) {
      soundToggle();
      return;
    }
    const step = 0.12;
    if (e.key === "ArrowLeft") {
      renderer.yaw -= step;
    } else if (e.key === "ArrowRight") {
      renderer.yaw += step;
    } else if (e.key === "ArrowUp") {
      renderer.pitch = Math.max(-1.35, renderer.pitch - step);
    } else if (e.key === "ArrowDown") {
      renderer.pitch = Math.min(1.35, renderer.pitch + step);
    } else if (e.key === " " && e.target === document.body) {
      state.speed = state.speed ? 0 : 1;
      setSpeedButtons();
    } else return;
    e.preventDefault();
    state.lastRender = 0;
  });

  // ---------- on the ground: the world is all there is ----------
  // Once you land, the observer is gone: no globe, no panels, no compass.
  // You have a body, a note in your fist, the sky, and whoever you meet.
  let ground = null;
  const G = {
    on: false,
    op: null,
    diff: "normal",
    keys: new Set(),
    look: null,
    stick: null,
    eyes: 0,
    arrived: false,
    menu: false,
    paper: false,
    note: null,
    toastUntil: 0,
    again: false,
    moved: false,
    pack: null,
    body: null,
    world: null,
    bed: null,
    notes: [],
    known: new Set(),
    visited: new Set(),
    talks: new Map(),
    tales: {},
    quests: {},
    vigil: null,
    packOpen: false,
    dying: false,
    sleeping: false,
    glimpse: null,
    target: null,
    chop: null,
    hit: null,
    lastSave: 0,
    afterWake: null,
    gotUntil: 0,
  };
  const coarse = () =>
    typeof matchMedia !== "undefined" &&
    matchMedia("(pointer: coarse)").matches;
  const dayWords = (d) =>
    d < 0.4 ? "a few hours" : d < 1.5 ? "a day" : `${Math.round(d)} days`;
  function distPhrase(km, sea) {
    if (km < 1.5) return "just over there";
    if (km < 6) return "an hour or two on foot";
    if (km < 14) return "a few hours’ walk";
    if (km < 28) return "less than a day’s walk";
    if (sea) return seaWords(km);
    return `${Math.round(km / 28)} days’ walk`;
  }

  // ---- the other beginnings: fished out of the sea, through a roof, among herders ----
  // Now and then the fall ends somewhere other than the open with a stranger standing over you: at a
  // fishing hut, a farm or a herders' camp near where you would have come down (never far from it).
  const BEGIN_SITE = { sea: "fishhut", roof: "farm", herders: "tents" };
  function beginningFor(op, difficulty) {
    const want = op.forceBegin || G.forceBegin || null;
    if ((!want && !op.mayBegin) || want === "road" || !ground || !ground.siteIx)
      return op;
    // each one now and then (a fishing hut on a coast not too far off, a farm close by, a herders' camp somewhere out
    // on the grass), and otherwise the road: a stranger finding you in the open
    let k = want;
    if (!k) {
      const r = G.beginRoll ?? Math.random();
      k =
        difficulty === "hard"
          ? r < 0.4
            ? "herders"
            : null
          : r < 0.2
            ? "sea"
            : r < 0.4
              ? "roof"
              : r < 0.6
                ? "herders"
                : null;
    }
    if (!k || !BEGIN_SITE[k]) return op;
    const reach = want
      ? 400000
      : { sea: 120000, roof: 60000, herders: 250000 }[k];
    const s0 = ground.siteIx
      .near(op.landing, reach, "big")
      .find((q) => q.kind === BEGIN_SITE[k]);
    if (!s0) return op;
    const o = { k, s: s0 };
    const info = beginInfo(o.k, o.s);
    if (!info) return op;
    const op2 = state.story.beginning(o.k, info, op.t0, difficulty);
    op2.t0 = op.t0;
    op2.landDir = op2.landing.slice();
    return op2;
  }
  // where you wake at the place, and who lives there: by the fishers' fire, before the farmhouse door, by the herders' fire
  function beginInfo(kind, s) {
    const plan = sitePlan(state.story, s),
      R = ground.R,
      F = frameAt(s.dir);
    let x = 0,
      z = 0;
    if (kind === "sea") {
      const fire = plan.props.find((q) => q.t === "firepit"),
        boat = plan.props.find((q) => q.t === "boat");
      if (fire) {
        const bx = boat ? boat.x - fire.x : 0,
          bz = boat ? boat.z - fire.z : 1,
          L = Math.hypot(bx, bz) || 1;
        x = fire.x + (bx / L) * 1.9;
        z = fire.z + (bz / L) * 1.9;
      }
    } else if (kind === "roof") {
      const b = plan.buildings[0];
      if (b) {
        const fx = -Math.sin(b.rot),
          fz = Math.cos(b.rot),
          dd = (b.round ? b.w : b.d) / 2 + 2.6;
        x = b.x + fx * dd;
        z = b.z + fz * dd;
      }
    } else {
      const a = (s.seed % 628) / 100;
      x = Math.cos(a) * 2.3;
      z = Math.sin(a) * 2.3;
    }
    let landing = stepOn(s.dir, F, x, -z, R);
    // (never in the water: towards the middle of the place until it is dry)
    for (
      let k = 0;
      k < 6 &&
      ground.ground.height(landing[0], landing[1], landing[2], 1) < 0.3;
      k++
    ) {
      x *= 0.7;
      z *= 0.7;
      landing = stepOn(s.dir, F, x, -z, R);
    }
    return {
      site: s,
      name: siteName(state.story, s),
      folk: plan.folk.map((f) => ({ name: f.name, role: f.role })),
      landing,
    };
  }
