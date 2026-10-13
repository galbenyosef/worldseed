// index-inline-2 129 — state
// Lines 63587-63929 of readable/index-inline-2.pretty.js (statement-aligned).
  const FIRST_WORLDS = [
    "Beisnom VII",
    "Branim",
    "Briatorn",
    "Brilwiart IX",
    "Broumis VI",
    "Buta IX",
    "Cilyfish",
    "Drekert VI",
    "Drusocoux",
    "Dysastell II",
    "Enaex",
    "Gainim IV",
    "Gifill II",
    "Goniaviam III",
    "Habepox V",
    "Hitar VI",
    "Iansart IV",
    "Ivaishoun IV",
    "Kraila",
    "Krigren II",
    "Kylkell",
    "Kyyi II",
    "Leinses VII",
    "Liawiar V",
    "Lugom V",
    "Mabreko VII",
    "Naijort",
    "Nostu",
    "Siatheind IX",
    "Staemkeil VI",
    "Sylam",
    "Tatex IX",
    "Theishe VI",
    "Thilny V",
    "Thoshull",
    "Truzas II",
    "Uryth III",
    "Usom IX",
    "Vesele III",
    "Vibroll VI",
    "Voubreim IX",
    "Vuhis IV",
    "Zadem V",
    "Zolartosh V",
  ];
  function firstWorld() {
    let last = null;
    try {
      last = localStorage.getItem("worldseed:first");
    } catch (e) {
      /* none */
    }
    const pool = FIRST_WORLDS.filter((n) => n !== last);
    const pick = pool.length
      ? pool[Math.floor(Math.random() * pool.length)]
      : DEFAULT_SEED;
    try {
      localStorage.setItem("worldseed:first", pick);
    } catch (e) {
      /* none */
    }
    return pick;
  }
  // Can this browser show the ground in 3D (it needs WebGL 2)? Asked once.
  let groundOk = null;
  function canGround() {
    if (groundOk != null) return groundOk;
    try {
      const gl = window.THREE
        ? document.createElement("canvas").getContext("webgl2")
        : null;
      groundOk = !!gl;
      if (gl) {
        const x = gl.getExtension("WEBGL_lose_context");
        if (x) x.loseContext();
      }
    } catch (e) {
      groundOk = false;
    }
    return groundOk;
  }
  const NO_GROUND =
    "This browser cannot show the ground in 3D (it needs WebGL 2), so the story is told in words. The globe still turns.";
  const WARP_MIN_MS = 1100;
  const $ = (id) => document.getElementById(id);

  const BIOME_SWATCH = BIOMES.map((b, i) => {
    const m = {
      [B.OCEAN]: M.DEEP,
      [B.SHELF]: M.SHELF,
      [B.REEF]: M.REEF,
      [B.SEAICE]: M.SEAICE,
      [B.ICE]: M.ICE,
      [B.TUNDRA]: M.TUNDRA,
      [B.TAIGA]: M.TAIGA,
      [B.STEPPE]: M.STEPPE,
      [B.FOREST]: M.FOREST,
      [B.WETFOREST]: M.WETFOREST,
      [B.COLDDESERT]: M.COLDDESERT,
      [B.DESERT]: M.DESERT,
      [B.SAVANNA]: M.SAVANNA,
      [B.DRYFOREST]: M.DRYFOREST,
      [B.JUNGLE]: M.JUNGLE,
      [B.ROCK]: M.ROCK,
    }[i];
    return CLASSIC[m][3];
  });

  const state = {
    planet: null,
    story: null,
    t: 0.08,
    speed: 1,
    style: "classic",
    probeDir: null,
    zoom: 1,
    gen: 0,
    drag: null,
    vel: { yaw: 0, pitch: 0 },
    anim: null,
    warp: null,
    arriveAt: 0,
    embarking: null,
    lastTs: 0,
    lastRender: 0,
    lastHud: 0,
    lastSlow: 0,
  };
  const reduceMotion =
    typeof matchMedia !== "undefined" &&
    matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduceMotion) state.speed = 0;

  const renderer = new GlobeRenderer();
  renderer.pitch = 0.2;
  // dithering: how much of the half-tone pattern is drawn between shades, on the ground and on the globe
  const DITHER = { full: 1, soft: 0.4, off: 0 },
    DITHER_KEY = "worldseed:dither";
  let ditherMode = "soft";
  try {
    const v = localStorage.getItem(DITHER_KEY);
    if (v && v in DITHER) ditherMode = v;
  } catch (e) {
    /* not remembered: soft */
  }
  function applyDither() {
    const k = DITHER[ditherMode];
    renderer.ditherK = k;
    if (ground && ground.uniforms && ground.uniforms.uDither)
      ground.uniforms.uDither.value = k;
  }
  renderer.ditherK = DITHER[ditherMode];
  const stage = $("stage"),
    canvas = $("globe"),
    ctx = canvas.getContext("2d");
  let image = null;

  // ---------- formatting ----------
  const nf = (n, d = 0) =>
    Number(n).toLocaleString("en-US", {
      minimumFractionDigits: d,
      maximumFractionDigits: d,
    });
  const COMPASS = [
    "N",
    "NNE",
    "NE",
    "ENE",
    "E",
    "ESE",
    "SE",
    "SSE",
    "S",
    "SSW",
    "SW",
    "WSW",
    "W",
    "WNW",
    "NW",
    "NNW",
  ];
  const compass = (deg) =>
    COMPASS[Math.round((((deg % 360) + 360) % 360) / 22.5) % 16];
  const latlon = (lat, lon) =>
    `${Math.abs(lat).toFixed(1)}° ${lat >= 0 ? "N" : "S"} · ${Math.abs(lon).toFixed(1)}° ${lon >= 0 ? "E" : "W"}`;
  const clock = (h) => {
    const hh = Math.floor(h),
      mm = Math.floor((h - hh) * 60);
    return `${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}`;
  };
  const esc = (s) =>
    String(s).replace(
      /[&<>"]/g,
      (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c],
    );
  const capf = (s) => s.charAt(0).toUpperCase() + s.slice(1);
  const days = (d) =>
    d < 1 ? `${Math.max(1, Math.round(d * 24))} hours` : `${d.toFixed(1)} days`;

  function toast(msg) {
    const el = $("toast");
    el.textContent = msg;
    el.hidden = false;
    clearTimeout(toast._t);
    toast._t = setTimeout(() => {
      el.hidden = true;
    }, 1600);
  }

  // ---------- layout ----------
  function layout() {
    const r = stage.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    const { W, H, P } = renderer.layout(r.width, r.height, dpr);
    if (canvas.width !== W || canvas.height !== H) {
      canvas.width = W;
      canvas.height = H;
    }
    canvas.style.width = W * P + "px";
    canvas.style.height = H * P + "px";
    canvas.style.left = Math.round((r.width - W * P) / 2) + "px";
    canvas.style.top = Math.round((r.height - H * P) / 2) + "px";
    image = new ImageData(new Uint8ClampedArray(renderer.buf.buffer), W, H);
    state.lastRender = 0;
    if (ground) ground.resize(r.width, r.height, dpr);
    sizeProbeCanvas();
  }
  function sizeProbeCanvas() {
    const pc = $("probe");
    const w = pc.parentElement.getBoundingClientRect().width - 4;
    if (w <= 0) return;
    const k = Math.max(1, Math.floor(w / pc.width));
    pc.style.width = pc.width * k + "px";
    pc.style.height = pc.height * k + "px";
  }
  new ResizeObserver(() => layout()).observe(stage);

  // ---------- travel ----------
  function seedToHash(s) {
    return s
      .trim()
      .replace(/\s+/g, "_")
      .replace(/[^A-Za-z0-9._~-]/g, "");
  }
  function hashToSeed() {
    try {
      const h = decodeURIComponent((location.hash || "").slice(1));
      return h ? h.replace(/_/g, " ") : "";
    } catch (e) {
      return "";
    }
  }
  const nextFrame = () => new Promise((r) => setTimeout(r, 0));

  async function travelTo(seedText, first = false) {
    if (G.on) leaveGround(true);
    const gen = ++state.gen;
    const seed = String(seedText || "").trim() || DEFAULT_SEED;
    $("seed").value = seed;
    $("seedGo").hidden = true;
    closeDialog();
    $("picker").hidden = true;
    state.embarking = null;
    renderer.fall = null;
    const started = performance.now();
    if (!first && !reduceMotion) state.warp = { t0: started };
    $("loading").hidden = false;
    $("embark").hidden = true;
    const onProgress = (label, frac) => {
      if (gen !== state.gen) return;
      $("loadLabel").textContent = label;
      $("loadBar").style.width = Math.round(frac * 92) + "%";
    };
    onProgress(
      first
        ? "Igniting the core"
        : `Leaving ${state.planet ? state.planet.seedText : "orbit"}`,
      0.01,
    );
    const planet = await Planet.create(seed, onProgress);
    if (gen !== state.gen) return;
    onProgress("Writing the histories", 0.95);
    await nextFrame();
    // (a test can ask for a great city in a particular state)
    const story = buildStory(planet, {
      city:
        typeof window !== "undefined" && window.__cityForce
          ? window.__cityForce
          : null,
    });
    // where people built their towns the ground lies flat (the hills keep their distance)
    planet.ground.setFlats(
      story.settlements.map((t) => ({
        d: t.dir,
        r0: townRadius(t) + 150,
        r1: townRadius(t) + 900,
      })),
    );
    if (gen !== state.gen) return;
    while (state.warp && performance.now() - started < WARP_MIN_MS) {
      await new Promise((r) => setTimeout(r, 30));
      if (gen !== state.gen) return;
    }
    state.planet = planet;
    state.story = story;
    window.worldseed.planet = planet;
    window.worldseed.story = story;
    renderer.setPlanet(planet);
    renderer.buildStars();
    $("loading").hidden = true;
    $("embark").hidden = false;
    showContinue();
    try {
      history.replaceState(null, "", "#" + seedToHash(seed));
    } catch (e) {
      /* not allowed in some frames */
    }
    updatePlanetCard();
    renderChronicle();
    // arrive looking at the heart of the story
    const lair =
      story.arc.lair && story.arc.lair.dir
        ? story.arc.lair.dir
        : planet.stats.highest.dir;
    focusOn(lair, false);
    if (state.warp) {
      state.warp = null;
      arrivalZoom();
    }
    state.lastRender = 0;
  }

  function arrivalZoom() {
    if (reduceMotion) return;
    canvas.style.transition = "none";
    canvas.style.transform = "scale(0.08)";
    canvas.getBoundingClientRect();
    canvas.style.transition = "transform 650ms cubic-bezier(.2,.9,.3,1)";
    canvas.style.transform = "scale(1)";
  }

  // ---------- planet card ----------
