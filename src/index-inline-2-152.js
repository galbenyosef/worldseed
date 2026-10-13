// index-inline-2 152 — ground
// Lines 71091-71441 of readable/index-inline-2.pretty.js (statement-aligned).
  const SPARK = {
    ashhound: [
      [255, 170, 60],
      [255, 110, 40],
      [255, 220, 120],
    ],
    blighted: [
      [204, 208, 192],
      [160, 166, 150],
    ],
    dead: [
      [214, 206, 186],
      [170, 160, 140],
    ],
    drowned: [
      [184, 232, 222],
      [120, 200, 190],
    ],
    wood: [
      [150, 104, 60],
      [196, 150, 96],
      [110, 76, 44],
    ],
    stone: [
      [150, 150, 156],
      [200, 200, 204],
      [112, 112, 120],
    ],
    fury: [
      [255, 90, 60],
      [255, 200, 120],
      [255, 255, 230],
    ],
  };
  // the effects layer sits exactly over the world's pixels
  function fxFrame(dt) {
    const g = ground,
      cs = g.canvas.style,
      st = fx.canvas.style;
    fx.size(g.W || 320, g.H || 240);
    if (
      st.width !== cs.width ||
      st.height !== cs.height ||
      st.left !== cs.left ||
      st.top !== cs.top
    ) {
      st.width = cs.width;
      st.height = cs.height;
      st.left = cs.left;
      st.top = cs.top;
    }
    fx.draw(dt);
  }
  $("gBagIcon").src = itemIcon("sack");
  $("gBagBtn").addEventListener("click", () => {
    if (G.packOpen) closePack();
    else openPack();
  });
  $("placeOk").addEventListener("click", () => confirmPlace());
  $("placeNo").addEventListener("click", () => cancelPlace());
  $("placeTurn").addEventListener("click", () => ground.turnGhost());

  function newWorld() {
    return {
      taken: new Map(),
      gone: new Set(),
      drops: [],
      placed: [],
      sites: {},
      homes: [],
    };
  }
  function worldJSON(w) {
    const strip = (o) => {
      const c = {};
      for (const [k, v] of Object.entries(o))
        if (k !== "mesh" && k !== "F" && k[0] !== "_") c[k] = v;
      return c;
    };
    return {
      taken: [...w.taken],
      gone: [...w.gone],
      drops: w.drops.map(strip),
      placed: w.placed.map(strip),
      sites: w.sites || {},
      homes: (w.homes || []).map(strip),
    };
  }
  function worldFrom(o) {
    return {
      taken: new Map((o && o.taken) || []),
      gone: new Set((o && o.gone) || []),
      drops: (o && o.drops) || [],
      placed: (o && o.placed) || [],
      sites: (o && o.sites) || {},
      homes: (o && o.homes) || [],
    };
  }
  function beginLife(op) {
    G.pack = new Pack();
    G.body = new Body();
    G.world = newWorld();
    G.bed = null;
    G.notes = [];
    G.known = new Set();
    G.visited = new Set();
    G.talks = new Map();
    G.tales = {};
    G.quests = {};
    G.name = null;
    G.rep = {};
    G.deeds = [];
    G.deedNews = null;
    G.inTown = null;
    G.lookTw = null;
    G.lookUp = false;
    G.songs = new Set();
    G.bless = {};
    G.rests = {};
    G.bounty = null;
    G.fishing = null;
    G.t0 = op.t0 ?? curT();
    G.landDir = op.landDir || op.landing;
    G.dying = false;
    G.sleeping = false;
    G.chop = null;
    G.hit = null;
    G.afterWake = null;
    ground.setWorld(G.world);
    ground.setHeld(null, null);
    ground.visitors = visitorsAt;
    ground.caveTaken = caveTaken;
    ground.onCave = onCave;
    ground.caveState = siteState;
    ground.foeName = (site, t) => foeName(state.story, site, t);
    ground.siteLost = siteLost;
    ground.caveOpts = caveOptsFor;
    ground.onThunder = onThunder;
    G.vigil = null;
    ground.vigil = null;
    G.vigilAsk = null;
    G.cycles = null;
    G.news = null;
    G.wxSaid = {};
    G.lastSave = performance.now();
  }
  function lifeData() {
    const g = ground;
    return {
      v: 1,
      seed: state.planet.seedText,
      diff: G.diff,
      t0: G.t0,
      landDir: G.landDir,
      t: g.t,
      p: g.p.slice(),
      yaw: g.surfaceYaw ? g.surfaceYaw() : g.yaw,
      pitch: g.pitch,
      arrived: G.arrived,
      travellerGone: !g.npc || !!g.npc.leaving,
      body: G.body.toJSON(),
      pack: G.pack.toJSON(),
      world: worldJSON(G.world),
      bed: G.bed,
      notes: G.notes.slice(-160),
      known: [...G.known],
      visited: [...G.visited],
      talks: [...G.talks],
      tales: G.tales,
      quests: G.quests,
      name: G.name || null,
      rep: G.rep || {},
      deeds: G.deeds || [],
      deedNews: G.deedNews || null,
      cycles: G.cycles,
      news: G.news || null,
      songs: [...(G.songs || [])],
      bless: G.bless || {},
      rests: G.rests || {},
      bounty: G.bounty || null,
      begin: G.begin || null,
      savedAt: Date.now(),
    };
  }
  function saveLife() {
    if (
      !G.on ||
      !G.pack ||
      G.dying ||
      G.glimpse ||
      !ground ||
      ground.journey ||
      !ground.ready
    )
      return;
    writeSave(lifeData());
    G.lastSave = performance.now();
  }
  window.addEventListener("pagehide", () => saveLife());
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) saveLife();
  });

  // pick a saved life up again: the world from its seed, then everything you changed
  async function continueLife(sv) {
    if (G.on) leaveGround(true);
    if (!state.planet || state.planet.seedText !== sv.seed)
      await travelTo(sv.seed);
    if (!state.planet || state.planet.seedText !== sv.seed) return;
    if (!canGround()) {
      openDialog([{ text: NO_GROUND }]);
      return;
    }
    if (!ground) ground = new GroundView(stage, canvas);
    ground.setPlanet(state.planet, state.story);
    applyDither();
    // (a life that began at a fishing hut, a farm or a herders' camp: that beginning again, for its town and its people)
    const bsite =
        sv.begin && sv.begin.site && ground.siteIx
          ? ground.siteIx.get(sv.begin.site)
          : null,
      binfo = bsite ? beginInfo(sv.begin.kind, bsite) : null;
    const op = binfo
      ? state.story.beginning(sv.begin.kind, binfo, sv.t0, sv.diff)
      : state.story.opening(sv.landDir, sv.t0, sv.diff);
    op.t0 = sv.t0;
    op.landDir = sv.landDir;
    document.documentElement.classList.add("on-ground");
    stage.classList.add("ground");
    layout();
    const keepTraveller =
      !sv.travellerGone &&
      !sv.arrived &&
      sv.diff !== "hard" &&
      !(sv.begin && sv.begin.kind === "roof");
    ground.enter(sv.p, sv.t, {
      town: op.town,
      traveller: keepTraveller ? op.traveller : null,
      wake: true,
    });
    ground.yaw = sv.yaw || 0;
    Object.assign(G, {
      on: true,
      op,
      diff: sv.diff,
      arrived: !!sv.arrived,
      eyes: 0,
      look: null,
      stick: null,
      menu: false,
      paper: false,
      again: false,
      moved: true,
    });
    G.keys.clear();
    G.note = state.story.note(op.landing);
    G.pack = Pack.fromJSON(sv.pack || {});
    G.body = Body.fromJSON(sv.body);
    G.world = worldFrom(sv.world);
    G.bed = sv.bed || null;
    // (what an oven, an anvil or a loom of yours is for, even what was learned to make on one since)
    for (const h of G.world.homes || [])
      for (const k of h.work || []) G.pack.learnHome(k);
    G.pack.fresh = [];
    G.notes = Array.isArray(sv.notes) ? sv.notes : [];
    G.known = new Set(sv.known || []);
    G.visited = new Set(sv.visited || []);
    G.talks = new Map(sv.talks || []);
    G.tales = sv.tales || {};
    G.quests = sv.quests && typeof sv.quests === "object" ? sv.quests : {};
    G.name = sv.name ? cleanName(sv.name) || null : null;
    G.rep = sv.rep && typeof sv.rep === "object" ? sv.rep : {};
    G.deeds = Array.isArray(sv.deeds) ? sv.deeds : [];
    G.deedNews = sv.deedNews || null;
    G.inTown = null;
    G.songs = new Set(
      Array.isArray(sv.songs) ? sv.songs.filter((id) => SONGS[id]) : [],
    );
    G.bless = sv.bless && typeof sv.bless === "object" ? sv.bless : {};
    G.rests = sv.rests && typeof sv.rests === "object" ? sv.rests : {};
    G.bounty = sv.bounty && typeof sv.bounty === "object" ? sv.bounty : null;
    G.fishing = null;
    G.begin = sv.begin && typeof sv.begin === "object" ? sv.begin : null;
    G.t0 = sv.t0;
    G.landDir = sv.landDir;
    G.dying = false;
    G.sleeping = false;
    G.chop = null;
    G.hit = null;
    ground.setWorld(G.world);
    ground.visitors = visitorsAt;
    ground.caveTaken = caveTaken;
    ground.onCave = onCave;
    ground.caveState = siteState;
    ground.foeName = (site, t) => foeName(state.story, site, t);
    ground.siteLost = siteLost;
    ground.caveOpts = caveOptsFor;
    ground.onThunder = onThunder;
    G.vigil = null;
    ground.vigil = null;
    G.vigilAsk = null;
    G.cycles = sv.cycles ?? null;
    G.news = sv.news || null;
    G.wxSaid = {};
    // what the story has taken shows as it is now
    for (const [id, st] of Object.entries(G.world.sites || {}))
      if (st && st.lost) ground.siteLostChanged(id);
    for (const id of [
      "ghud",
      "embark",
      "continue",
      "picker",
      "gMenu",
      "gPaper",
      "gPrompt",
      "gToast",
      "gPack",
    ])
      $(id).hidden = true;
    renderer.fall = null;
    $("eyes").hidden = false;
    setLids(1);
    G.afterWake = {
      title: G.name
        ? `${G.name}, on ${state.planet.seedText}`
        : state.planet.seedText,
      sub: "you pick up where you left off",
      name: !G.name,
    };
    G.eyes = 1;
    G.lastSave = performance.now();
  }
  function showContinue() {
    const sv = readSave(),
      b = $("continue");
    if (!sv || G.on || !state.story) {
      b.hidden = true;
      return;
    }
    b.hidden = false;
    b.textContent = sv.name
      ? `Continue as ${sv.name} on ${sv.seed}`
      : `Continue on ${sv.seed}`;
  }
  $("continue").addEventListener("click", () => {
    const sv = readSave();
    if (sv) continueLife(sv);
  });

  // ---- the satchel ----
  // opened anywhere it knows the fire and work stone within reach; opened at one, it starts on Make
