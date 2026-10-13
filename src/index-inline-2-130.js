// index-inline-2 130 — state
// Lines 63930-64252 of readable/index-inline-2.pretty.js (statement-aligned).
  function updatePlanetCard() {
    const p = state.planet,
      b = p.body,
      s = p.stats,
      st = state.story,
      T = p.tectonics;
    $("pTitle").textContent = p.seedText;
    $("pClass").textContent = s.klass;
    const active = p.volcanoes.filter((v) => v.active).length;
    const rows = [
      ["Radius", `${nf(b.radiusKm)} km`],
      ["Gravity", `${b.gravity.toFixed(2)} g`],
      ["Day", `${b.dayHours.toFixed(1)} h`],
      ["Year", `${nf(b.yearDays)} days`],
      ["Axial tilt", `${b.tiltDeg.toFixed(1)}°`],
      ["Oceans", `${(s.oceanFrac * 100).toFixed(1)}%`],
      ["Mean temp", `${s.meanTemp.toFixed(1)} °C`],
      ["Ice cover", `${(s.iceFrac * 100).toFixed(1)}%`],
      ["Core", `${nf(b.coreTempK)} K`],
      ["Magnetic field", b.magneticField],
      ["Moons", moonWords(p)],
      ["Age", `${b.ageGyr.toFixed(1)} bn years`],
      [
        "Plates",
        `${T.K} (${T.plates.filter((q) => q.continental).length} continental)`,
      ],
      ["Volcanoes", `${p.volcanoes.length} (${active} active)`],
      ["Peoples", `${st.peoples.length} · ${st.settlements.length} towns`],
      ["Land", `${s.continents} continents, ${nf(s.islands)} islands`],
    ];
    $("pStats").innerHTML = rows
      .map(([k, v]) => `<div><dt>${k}</dt><dd>${esc(v)}</dd></div>`)
      .join("");
    const L = s.largest;
    const marks = [
      ["Highest point", `${s.highest.name} · ${nf(s.highest.h)} m`, "hi"],
      ["Deepest point", `${s.deepest.name} · ${nf(-s.deepest.h)} m deep`, "lo"],
    ];
    if (L)
      marks.push([
        "Largest landmass",
        `${L.name} · ${(L.areaKm2 / 1e6).toFixed(1)} M km²`,
        "land",
      ]);
    $("pMarks").innerHTML = marks
      .map(
        ([k, v, id]) =>
          `<li><span><span class="k">${k}</span><span class="v">${esc(v)}</span></span><button class="btn mini" type="button" data-go="${id}">Show</button></li>`,
      )
      .join("");
    const top = s.biomeShare.filter((x) => x.share > 0.004);
    $("pBar").innerHTML = top
      .map(
        (x) =>
          `<i style="width:${(x.share * 100).toFixed(2)}%;background:${BIOME_SWATCH[x.id]}" title="${esc(x.name)}"></i>`,
      )
      .join("");
    $("pLegend").innerHTML = top
      .slice(0, 7)
      .map(
        (x) =>
          `<li><span class="sw" style="background:${BIOME_SWATCH[x.id]}"></span><span>${esc(x.name)}</span><span>${(x.share * 100).toFixed(1)}%</span></li>`,
      )
      .join("");
  }

  $("pMarks").addEventListener("click", (e) => {
    const btn = e.target.closest("[data-go]");
    if (!btn || !state.planet) return;
    const s = state.planet.stats;
    let dir;
    if (btn.dataset.go === "hi") dir = s.highest.dir;
    else if (btn.dataset.go === "lo") dir = s.deepest.dir;
    else if (s.largest) {
      const g = state.planet.levels[0].grid;
      const a = s.largest.anchor;
      dir = [g.dir[a * 3], g.dir[a * 3 + 1], g.dir[a * 3 + 2]];
    }
    if (dir) {
      focusOn(dir, true);
      selectTab("tabProbe");
    }
  });

  // ---------- chronicle ----------
  function renderChronicle() {
    const st = state.story;
    if (!st) return;
    const a = st.arc;
    const needs = a.needs
      .map(
        (n) =>
          `<li><div><b>${esc(capf(n.title))}</b><span>${esc(capf(n.text))}</span></div></li>`,
      )
      .join("");
    const peoples = st.peoples
      .map((p) => {
        const capTown =
          p.capital !== undefined ? st.settlements[p.capital] : null;
        return `<li><span class="nm">${esc(capf(p.name))}</span><span class="ln">${esc(capf(p.plural))} living in ${esc(p.homes)}. They follow ${esc(p.faith)}, prize ${esc(p.virtue)}, and are known for ${esc(p.craft)}.</span>${capTown ? `<span class="ln">Capital: ${esc(capTown.name)} (${nf(capTown.population)} souls)</span>` : ""}</li>`;
      })
      .join("");
    const tales = st.tales
      .map(
        (t) =>
          `<li><span class="nm">${esc(t.title)}</span><span class="ln">${esc(t.text)}</span><span class="hint">${esc(t.hint)}</span></li>`,
      )
      .join("");
    const hist = st.history
      .map(
        (h) =>
          `<li><span class="era">${esc(h.era)}</span><span>${esc(h.text)}</span></li>`,
      )
      .join("");
    $("chronicle").innerHTML = `
    <div style="display:grid;gap:12px">
      <h2 class="sub" style="margin:0">The main story</h2>
      <p class="arc-title">${esc(a.title)}</p>
      <p class="arc-sum">${esc(a.summary)}</p>
      <p class="sub">What it would take</p>
      <ul class="needs">${needs}</ul>
      <div class="clock" id="arcClock"></div>
      <p class="note">None of this is required. The world goes on either way.</p>
      <p class="sub">Peoples</p>
      <ul class="people">${peoples || '<li><span class="ln">Nobody lives here.</span></li>'}</ul>
      ${cityChronicle(st) ? `<p class="sub">The great city</p><p class="arc-sum">${esc(cityChronicle(st))}</p>` : ""}
      <p class="sub">Side tales</p>
      <ul class="tales">${tales || '<li><span class="ln">Nothing much happens here.</span></li>'}</ul>
      <p class="sub">History</p>
      <ul class="history">${hist}</ul>
    </div>`;
    updateClock();
  }
  function updateClock() {
    const el = $("arcClock");
    if (!el || !state.story) return;
    const c = arcClock(state.story.arc, curT());
    if (!c) {
      el.innerHTML = "";
      return;
    }
    const frac = 1 - c.inDays / c.period;
    el.innerHTML = `<span>${esc(c.label)} in ${days(c.inDays)} (every ${c.period} days)</span><div class="meter" aria-hidden="true"><i style="width:${(frac * 100).toFixed(1)}%"></i></div>`;
  }

  // Bring a place into view: the planet spins it round to face the camera on
  // the sunlit side (planet time jumps ahead by less than one day).
  function focusOn(dir, animate, then) {
    probeAt(dir);
    animate = animate && !reduceMotion;
    const dur = animate ? 1100 : 0;
    const tEnd = state.t + ((dur / 1000) * state.speed) / SECONDS_PER_DAY;
    let pitch = 0.2;
    let dt = renderer.faceTime(dir, tEnd, 0, pitch);
    const w = renderer.worldPos(dir, tEnd + dt);
    pitch = Math.max(
      -0.6,
      Math.min(0.65, Math.atan2(w[1], Math.hypot(w[0], w[2]))),
    );
    dt = renderer.faceTime(dir, tEnd, 0, pitch);
    if (!animate) {
      state.t += dt;
      renderer.yaw = 0;
      renderer.pitch = pitch;
      state.anim = null;
      if (then) then();
    } else {
      const y0 = renderer.yaw;
      const toYaw = y0 + Math.atan2(Math.sin(-y0), Math.cos(-y0));
      state.anim = {
        from: { yaw: y0, pitch: renderer.pitch },
        to: { yaw: toYaw, pitch },
        tOff: dt,
        t0: performance.now(),
        dur,
        e: 0,
        then,
      };
    }
    state.vel.yaw = state.vel.pitch = 0;
  }
  // planet time as currently shown (includes an in-flight spin-to-target)
  function curT() {
    return state.t + (state.anim ? state.anim.tOff * state.anim.e : 0);
  }

  // ---------- tabs ----------
  const TABS = ["tabPlanet", "tabProbe", "tabChron"];
  function selectTab(id, focus = false) {
    for (const t of TABS) {
      const on = t === id;
      $(t).setAttribute("aria-selected", String(on));
      $(t).tabIndex = on ? 0 : -1;
      $($(t).getAttribute("aria-controls")).hidden = !on;
    }
    if (focus) $(id).focus();
    if (id === "tabProbe") sizeProbeCanvas();
  }
  for (const t of TABS) {
    $(t).addEventListener("click", () => selectTab(t));
    $(t).addEventListener("keydown", (e) => {
      const i = TABS.indexOf(t);
      if (e.key === "ArrowRight") {
        selectTab(TABS[(i + 1) % TABS.length], true);
        e.preventDefault();
      }
      if (e.key === "ArrowLeft") {
        selectTab(TABS[(i + TABS.length - 1) % TABS.length], true);
        e.preventDefault();
      }
    });
  }

  // ---------- probe ----------
  function probeAt(dir) {
    const L = Math.hypot(dir[0], dir[1], dir[2]);
    state.probeDir = [dir[0] / L, dir[1] / L, dir[2] / L];
    renderer.marker = state.probeDir;
    drawProbeMap();
    updateProbeReadout();
  }

  const probeCtx = $("probe").getContext("2d");
  const probeImg = probeCtx.createImageData(
    $("probe").width,
    $("probe").height,
  );
  const probeBuf = new Uint32Array(probeImg.data.buffer);
  function drawProbeMap() {
    if (!state.probeDir || !state.planet) return;
    const z = PROBE_ZOOMS[state.zoom];
    const pc = $("probe");
    const { kmPerPx } = renderProbe(
      state.planet,
      state.probeDir,
      z,
      pc.width,
      pc.height,
      probeBuf,
    );
    probeCtx.putImageData(probeImg, 0, 0);
    $("probeScale").textContent =
      `1 pixel ≈ ${kmPerPx < 2 ? kmPerPx.toFixed(1) : nf(kmPerPx)} km`;
  }

  function updateProbeReadout() {
    const p = state.planet,
      d = state.probeDir,
      st = state.story;
    if (!p || !d) return;
    const q = p.query(d[0], d[1], d[2], curT());
    $("probeCoords").textContent = latlon(q.lat, q.lon);
    const terrain = q.land
      ? `${q.landform} · ${nf(q.elevation)} m`
      : `${q.landform} · ${nf(-q.elevation)} m deep`;
    const coast = q.land
      ? `${nf(Math.abs(q.coastKm))} km inland`
      : `${nf(Math.abs(q.coastKm))} km offshore`;
    const sky =
      q.cloud > 0.66
        ? "Overcast"
        : q.cloud > 0.2
          ? "Broken cloud"
          : q.cloud > 0.02
            ? "A few clouds"
            : "Clear";
    const lt = q.localTime,
      tc = q.tectonics;
    const rows = [];
    if (st) {
      const around = st.around(d);
      const names = around.within.map((x) => x.name);
      if (q.landmass) names.push(q.landmass.name);
      if (names.length) rows.push(["Where", esc(capf(names.join(", ")))]);
      if (around.town)
        rows.push([
          "Nearest town",
          `${esc(around.town.name)} · ${nf(around.townKm)} km ${around.townBearing}`,
        ]);
    }
    rows.push(
      [
        "Biome",
        `<span class="sw" style="display:inline-block;vertical-align:-1px;margin-right:6px;background:${BIOME_SWATCH[q.biome]}"></span>${esc(q.biomeName)}`,
      ],
      ["Terrain", esc(terrain)],
      ["Coast", esc(coast)],
      [
        "Ground",
        esc(
          `${capf(tc.plateKind)} plate moving ${tc.speedCmYr.toFixed(1)} cm a year${tc.boundaryKm !== null ? ` · ${nf(tc.boundaryKm)} km from a ${tc.boundary.toLowerCase()}` : ""}`,
        ),
      ],
      [
        "Climate",
        `${q.temperature.toFixed(1)} °C mean · ${nf(q.precipitation)} mm rain a year`,
      ],
      [
        "Wind",
        `${esc(q.wind.band)} from the ${compass(q.wind.fromDeg)} · ${q.wind.speed.toFixed(0)} m/s`,
      ],
      ["Sky now", sky],
      [
        "Local time",
        `${clock(lt.hours)} of a ${lt.dayHours.toFixed(1)} h day · ${lt.daylight ? `sun ${Math.round(lt.sunAltDeg)}° up` : "night"}`,
      ],
    );
    $("probeData").innerHTML = rows
      .map(([k, v]) => `<div><dt>${k}</dt><dd>${v}</dd></div>`)
      .join("");
  }

  $("z0").parentElement.addEventListener("click", (e) => {
    const b = e.target.closest("[data-zoom]");
    if (!b) return;
    state.zoom = +b.dataset.zoom;
    for (const x of b.parentElement.children)
      x.setAttribute("aria-pressed", String(x === b));
    drawProbeMap();
  });

  // ---------- embark: fall from the sky, meet someone ----------
  // You don't choose where you land; the difficulty does.
