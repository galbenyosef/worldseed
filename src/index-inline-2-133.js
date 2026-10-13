// index-inline-2 133 — ground
// Lines 64802-65091 of readable/index-inline-2.pretty.js (statement-aligned).
  function landOn(op, difficulty) {
    if (!ground) ground = new GroundView(stage, canvas);
    ground.setPlanet(state.planet, state.story);
    applyDither();
    op = beginningFor(op, difficulty);
    document.documentElement.classList.add("on-ground");
    stage.classList.add("ground");
    layout();
    const roof = !!(op.begin && op.begin.kind === "roof");
    // (at the farm, it is the family who stand round you: nobody else comes)
    ground.enter(op.landing, curT(), {
      town: op.town,
      traveller: roof ? null : op.traveller,
      wake: true,
    });
    Object.assign(G, {
      on: true,
      op,
      diff: difficulty,
      arrived: false,
      eyes: 0,
      look: null,
      stick: null,
      menu: false,
      paper: false,
      again: false,
      moved: false,
    });
    G.keys.clear();
    G.note = state.story.note(op.landing);
    beginLife(op);
    G.begin = op.begin ? { ...op.begin, st: roof ? "owe" : "met" } : null;
    // what they give you: the fishers smoked fish, the herders cheese (and on your own, a cloak), the farmer an axe to cut the beams with
    if (op.begin) {
      const k = op.begin.kind;
      if (k === "sea") G.pack.add("smokedfish", 2);
      if (k === "herders") {
        G.pack.add("cheese", 2);
        if (difficulty === "hard") G.pack.add("woolcloak", 1);
      }
      if (roof) {
        G.pack.add("axe", 1);
        // what came down with you: straw, broken beams, a pot in pieces, where you woke
        const F0 = frameAt(op.landing);
        ground.addPlaced(
          "wreck",
          stepOn(op.landing, F0, 1.3, 0.4, ground.R),
          Math.random() * 6.28,
        );
      }
    }
    $("eyes").hidden = false;
    $("eyes").classList.add("flash");
    setLids(1);
    setTimeout(() => $("eyes").classList.remove("flash"), 120);
    for (const id of [
      "ghud",
      "embark",
      "picker",
      "gMenu",
      "gPaper",
      "gPrompt",
      "gToast",
    ])
      $(id).hidden = true;
    renderer.fall = null;
    // the story begins in the dark while the ground streams in
    const pages = op.pages.slice();
    pages.splice(2, 0, {
      who: null,
      text: "Your right fist is clenched around a folded note. The handwriting is yours. You don’t remember writing it.",
    });
    const leads = !!op.town && difficulty !== "hard" && !roof;
    if (leads && /^You follow/.test(pages[pages.length - 1].text)) pages.pop();
    const bySea = !!(op.travel && op.travel.mode === "sea"),
      bk = op.begin && op.begin.kind;
    const ask =
      bk === "sea"
        ? `"I take the catch to ${op.town && op.town.name} myself, ${bySea ? "by boat" : "on foot"}, as soon as you can stand. Come with me?"`
        : bk === "herders"
          ? `"We move on at first light. Walk with the herd?"`
          : bySea
            ? `"I’m going back to ${op.town && op.town.name} myself. Come with me?"`
            : `"I’m heading back to ${op.town && op.town.name} myself. Walk with me?"`;
    if (leads)
      pages.push({
        who: op.traveller.name,
        text: ask,
        choices: [
          {
            id: "follow",
            label:
              bk === "herders"
                ? "Walk with the herders"
                : bySea
                  ? "Go with them"
                  : "Walk with them",
            primary: true,
          },
          { id: "stay", label: "Not yet" },
        ],
      });
    // once they have said hello, they ask your name: the first words, the question, then the rest
    const at = Math.min(pages.length, 5),
      lead = pages.slice(0, at),
      rest = pages.slice(at);
    const people =
      op.traveller.owner >= 0 ? state.story.peoples[op.traveller.owner] : null;
    const onPage = (i) => {
      if (i >= 1) G.eyes = Math.max(G.eyes, 1);
    };
    const done = (choice) => {
      G.eyes = Math.max(G.eyes, 1);
      groundFree();
      if (choice === "follow") follow();
      else if (!leads) ground.dismissTraveller();
    };
    askName({
      who: op.traveller.name,
      people,
      seed: hashInt(
        Math.round(op.landing[0] * 1e5),
        Math.round(op.landing[1] * 1e5),
        31,
      ),
      lead,
      onPage,
      then: (line) => {
        saveLife();
        const after = (line ? [line] : []).concat(rest);
        // told to look up, you do (the quarters are written up there), and then down again
        const onPageRest = (i) => {
          onPage(i);
          const pg = after[i];
          if (pg && pg.look === "up") lookAt(1.05, op.town);
          else if (G.lookUp) lookAt(0.02);
        };
        if (after.length)
          openDialog(after, {
            noChronicle: true,
            onPage: onPageRest,
            onClose: (c) => {
              if (G.lookUp) lookAt(0.02);
              done(c);
            },
          });
        else done();
      },
    });
  }
  // the view turned for you, gently: up at the sky, towards a place, and back down
  function lookAt(pitch, town = null) {
    if (!ground) return;
    const y0 = ground.yaw,
      y1 = town && town.dir ? -bearingTo(ground.p, town.dir) : y0;
    G.lookTw = {
      p0: ground.pitch,
      p1: pitch,
      y0,
      y1: y0 + Math.atan2(Math.sin(y1 - y0), Math.cos(y1 - y0)),
      t0: performance.now(),
      ms: 1100,
    };
    G.lookUp = pitch > 0.5;
  }
  function stepLook() {
    const L = G.lookTw;
    if (!L || !ground) return;
    const k = Math.min(1, (performance.now() - L.t0) / L.ms),
      e = k * k * (3 - 2 * k);
    ground.pitch = L.p0 + (L.p1 - L.p0) * e;
    ground.yaw = L.y0 + (L.y1 - L.y0) * e;
    if (k >= 1) G.lookTw = null;
  }
  function setLids(k) {
    // 1 closed, 0 open
    const pct = Math.round((k * 50) / 6) * 6;
    $("lidTop").style.height = pct + "%";
    $("lidBot").style.height = pct + "%";
  }
  // open the eyes once the ground is ready: a slow blink, pixel-stepped
  function openEyes() {
    G.eyes = 2;
    ground.show();
    sfx.play("wake");
    const t0 = performance.now(),
      seq = [
        [0, 1],
        [500, 0.55],
        [800, 0.85],
        [1300, 0.3],
        [1500, 0.5],
        [2200, 0],
      ];
    const step = () => {
      const t = performance.now() - t0;
      let k = 0;
      for (let i = 0; i < seq.length - 1; i++)
        if (t >= seq[i][0] && t < seq[i + 1][0]) {
          const f = (t - seq[i][0]) / (seq[i + 1][0] - seq[i][0]);
          k = seq[i][1] + (seq[i + 1][1] - seq[i][1]) * f;
          break;
        }
      if (reduceMotion || t >= seq[seq.length - 1][0]) {
        setLids(0);
        G.lidK = 0;
        $("eyes").hidden = true;
        if (G.afterWake) {
          const w = G.afterWake;
          G.afterWake = null;
          groundFree();
          if (w.pages) openDialog(w.pages, { noChronicle: true });
          else gToast(w.title, w.sub, 3200);
          if (w.name)
            setTimeout(() => {
              if (G.on && !G.name && $("dialog").hidden)
                askName({
                  who: null,
                  prompt: "Lying there, you try again to remember your name.",
                  then: (line) => {
                    if (line) openDialog([line], { noChronicle: true });
                    saveLife();
                  },
                });
            }, 1800);
        }
        return;
      }
      setLids(k);
      requestAnimationFrame(step);
    };
    step();
  }
  function groundFree() {
    if (!G.on) return;
    $("ghud").hidden = false;
    if (coarse()) $("gStick").hidden = false;
  }
  function gToast(title, sub, ms = 2800) {
    const el = $("gToast");
    el.innerHTML = `${esc(title)}${sub ? `<small>${esc(sub)}</small>` : ""}`;
    el.hidden = false;
    G.toastUntil = performance.now() + ms;
  }
  // walking with the traveller: the days pass while the land goes by
  function follow() {
    const op = G.op;
    if (!op || !op.town || ground.journey || G.arrived) return;
    const km = ground.hud().townM / 1000;
    const days =
      op.travel && op.travel.mode === "sea"
        ? Math.max(0.6, km / 120)
        : Math.max(0.1, km / 28);
    let nightN = 0,
      dayN = 0;
    const herd = !!(op.begin && op.begin.kind === "herders");
    const way =
      op.travel && op.travel.mode === "sea"
        ? `at sea, bound for ${op.town.name}`
        : herd
          ? `with the herd, bound for ${op.town.name}`
          : `on the road to ${op.town.name}`;
    ground.startJourney(
      op.town,
      days,
      () => {
        G.arrived = true;
        gToast(
          op.town.name,
          days >= 1 ? `${dayWords(days)} later` : "later that day",
        );
        const pages = state.story.arrival(op, days, G.diff);
        setTimeout(() => {
          if (!G.on) return;
          if (pages.length)
            openDialog(pages, {
              noChronicle: true,
              onClose: () => ground.dismissTraveller(),
            });
          else ground.dismissTraveller();
        }, 1500);
      },
      (stop) => {
        if (stop.last) return;
        if (stop.camp) gToast(`Night ${++nightN}`, way, 2200);
        else gToast(`Day ${++dayN}`, way, 2200);
      },
    );
  }
  // talking to whoever is in front of you
