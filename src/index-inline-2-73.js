// index-inline-2 73 — math
// Lines 27896-31238 of readable/index-inline-2.pretty.js (statement-aligned).
  class GroundView {
    constructor(stage, after) {
      this.T = window.THREE;
      this.canvas = document.createElement("canvas");
      this.canvas.className = "ground-canvas";
      this.canvas.hidden = true;
      this.canvas.setAttribute("aria-label", "First-person view of the planet");
      after.after(this.canvas);
      this.active = false;
      this.yaw = 0;
      this.pitch = 0;
      this.chunks = new Map();
      this.colChunks = new Set(); // chunks holding things you can bump into
      this.swingT = -1;
      this.joltT = -1;
      this.frame = 0;
      this.vy = 0;
    }

    // ---------- setup ----------
    initGL() {
      if (this.renderer) return;
      const T = this.T;
      this.renderer = new T.WebGLRenderer({
        canvas: this.canvas,
        antialias: false,
        logarithmicDepthBuffer: true,
        powerPreference: "high-performance",
      });
      this.renderer.setPixelRatio(1);
      this.scene = new T.Scene();
      this.camera = new T.PerspectiveCamera(72, 16 / 9, 0.1, 2.5e6);
      this.camera.rotation.order = "YXZ";
      this.rampTex = new T.DataTexture(
        new Uint8Array(5 * RAMP_ROWS * 4),
        5,
        RAMP_ROWS,
        T.RGBAFormat,
      );
      this.rampTex.magFilter = this.rampTex.minFilter = T.NearestFilter;
      this.atlasTex = new T.DataTexture(new Uint8Array(4), 1, 1, T.RGBAFormat);
      this.cloudData = new Uint8Array(64 * 64);
      this.cloudTex = new T.DataTexture(this.cloudData, 64, 64, T.RedFormat);
      this.cloudTex.magFilter = this.cloudTex.minFilter = T.LinearFilter;
      this.cloudTex.needsUpdate = true;
      const U = (this.uniforms = {
        uRamp: { value: this.rampTex },
        uRows: { value: RAMP_ROWS },
        uSun: { value: new T.Vector3(0, 1, 0) },
        uDay: { value: 1 },
        uTime: { value: 0 },
        uDark: { value: 0 },
        uFog: { value: new T.Vector3() },
        uFogRange: { value: new T.Vector2(2000, 40000) },
        uAtlas: { value: this.atlasTex },
        uSnowRow: { value: 0 },
        uFire: { value: new T.Vector4(0, -1e5, 0, 0) },
        uLamps: {
          value: Array.from(
            { length: LAMP_N },
            () => new T.Vector4(0, -1e5, 0, 1),
          ),
        },
        uLampK: { value: new Float32Array(LAMP_N) },
        uLate: { value: 0 },
        uSee: { value: 0 },
        uDither: { value: 1 },
        uOvercast: { value: 0 },
        uFlash: { value: 0 },
        uMoon: { value: 0 },
        uSnowCover: { value: 0 },
        uWetGround: { value: 0 },
        // the fields near you, painted on the ground (see farmview's stepFields)
        uFA: { value: Array.from({ length: FIELD_N }, () => new T.Vector4()) },
        uFB: { value: Array.from({ length: FIELD_N }, () => new T.Vector4()) },
        uFS: { value: new Float32Array(FIELD_N) },
        uFN: { value: 0 },
        uFRow: { value: new Float32Array(13) },
      });
      this.terrainMat = new T.ShaderMaterial({
        uniforms: U,
        vertexShader: TERRAIN_VS,
        fragmentShader: TERRAIN_FS,
      });
      this.waterMat = new T.ShaderMaterial({
        uniforms: U,
        vertexShader: WATER_VS,
        fragmentShader: WATER_FS,
      });
      this.solidMat = new T.ShaderMaterial({
        uniforms: U,
        vertexShader: SOLID_VS,
        fragmentShader: SOLID_FS,
        side: T.DoubleSide,
      });
      this.cardMat = new T.ShaderMaterial({
        uniforms: U,
        vertexShader: CARD_VS,
        fragmentShader: CARD_FS,
        side: T.DoubleSide,
      });
      this.skyU = {
        uTanHalf: { value: new T.Vector2(1, 1) },
        uCamRot: { value: new T.Matrix3() },
        uSun: U.uSun,
        uStarRot: { value: new T.Matrix3() },
        uPole: { value: new T.Vector3(0, 1, 0) },
        uLookUp: { value: 0 },
        uQuad: { value: [0, 1, 2, 3].map(() => new T.Vector3()) },
        uGlyphPx: { value: 2 },
        uDayZen: { value: new T.Vector3() },
        uDayHor: { value: new T.Vector3() },
        uNightZen: { value: new T.Vector3() },
        uNightHor: { value: new T.Vector3() },
        uDusk: { value: new T.Vector3() },
        uDay: U.uDay,
        uCamY: { value: 0 },
        uCloud: { value: this.cloudTex },
        uCloudC: { value: new T.Vector3(0, 0, 160000) },
        uCloudH: { value: 2200 },
        uTime: U.uTime,
        // the weather and the night sky (see weatherview)
        uOvercast: { value: 0 },
        uSkyFog: { value: 0 },
        uMoonLit: { value: 0 },
        uDither: U.uDither,
        uFogCol: U.uFog,
        uFlash: U.uFlash,
        uHeat: { value: 0 },
        uMeteor: { value: 0 },
        uAurora: { value: 0 },
        uAuroraDir: { value: new T.Vector3(0, 0, -1) },
        uMoonN: { value: 0 },
        uMoons: { value: [0, 1, 2].map(() => new T.Vector4(0, -1, 0, 0.01)) },
        uMoonCols: { value: [0, 1, 2].map(() => new T.Vector4(1, 1, 1, 0)) },
        uEclipse: { value: 0 },
        uBolt: { value: new T.Vector4(0, 0, 9, 0) },
      };
      this.sky = new T.Mesh(
        new T.PlaneGeometry(2, 2),
        new T.ShaderMaterial({
          uniforms: this.skyU,
          vertexShader: SKY_VS,
          fragmentShader: SKY_FS,
          depthTest: false,
          depthWrite: false,
        }),
      );
      this.sky.frustumCulled = false;
      this.sky.renderOrder = -10;
      this.scene.add(this.sky);
      // a pixel dissolve to black and back, for the gaps in a journey
      this.fadeU = { uFade: { value: 0 } };
      this.fadeMesh = new T.Mesh(
        new T.PlaneGeometry(2, 2),
        new T.ShaderMaterial({
          uniforms: this.fadeU,
          depthTest: false,
          depthWrite: false,
          vertexShader:
            "void main() { gl_Position = vec4(position.xy, 0.0, 1.0); }",
          fragmentShader: `uniform float uFade;
        float m2(vec2 v) { return 2.0 * abs(v.x - v.y) + v.y; }
        float bayer4(vec2 p) { vec2 a = mod(floor(p), 4.0); return (4.0 * m2(mod(a, 2.0)) + m2(floor(a * 0.5)) + 0.5) / 16.0; }
        void main() { if (bayer4(gl_FragCoord.xy) >= uFade) discard; gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0); }`,
        }),
      );
      this.fadeMesh.frustumCulled = false;
      this.fadeMesh.renderOrder = 1000;
      this.fadeMesh.visible = false;
      this.scene.add(this.fadeMesh);
      this.index = this.makeIndex();
    }

    makeIndex() {
      const n1 = CN + 1,
        idx = [];
      const v = (i, j) => j * n1 + i;
      for (let j = 0; j < CN; j++)
        for (let i = 0; i < CN; i++) {
          const a = v(i, j),
            b = v(i + 1, j),
            c = v(i, j + 1),
            d = v(i + 1, j + 1);
          // counter-clockwise seen from above (s × t points out of the planet)
          if ((i + j) & 1) idx.push(a, b, c, b, d, c);
          else idx.push(a, d, c, a, b, d);
        }
      const base = n1 * n1,
        edge = [];
      for (let i = 0; i < CN; i++) edge.push(v(i, 0));
      for (let j = 0; j < CN; j++) edge.push(v(CN, j));
      for (let i = CN; i > 0; i--) edge.push(v(i, CN));
      for (let j = CN; j > 0; j--) edge.push(v(0, j));
      for (let k = 0; k < edge.length; k++) {
        const a = edge[k],
          b = edge[(k + 1) % edge.length],
          a2 = base + k,
          b2 = base + ((k + 1) % edge.length);
        idx.push(a, a2, b, b, a2, b2, a, b, a2, b, b2, a2);
      }
      this.edge = edge;
      return idx;
    }

    resize(cssW, cssH, dpr = 1) {
      if (!this.renderer) return;
      const P =
        Math.max(2, Math.round((Math.min(cssW, cssH) / 230) * dpr)) / dpr;
      const W = Math.max(64, Math.floor(cssW / P)),
        H = Math.max(48, Math.floor(cssH / P));
      this.renderer.setSize(W, H, false);
      this.canvas.style.width = W * P + "px";
      this.canvas.style.height = H * P + "px";
      this.canvas.style.left = Math.round((cssW - W * P) / 2) + "px";
      this.canvas.style.top = Math.round((cssH - H * P) / 2) + "px";
      this.camera.aspect = W / H;
      this.camera.updateProjectionMatrix();
      this.W = W;
      this.H = H;
      this.P = P;
    }

    // ---------- a planet's palette, species and parts ----------
    setPlanet(planet, story) {
      this.initGL();
      if (this.planet === planet) return;
      const T = this.T;
      this.planet = planet;
      this.story = story;
      this.ground = planet.ground;
      this.R = planet.body.radiusKm * 1000;
      this.maxL = Math.min(
        20,
        Math.max(8, Math.round(Math.log2((this.R * Math.PI) / 2 / (CN * 1.2)))),
      );
      for (const c of this.chunks.values()) this.dropChunk(c);
      this.chunks.clear();
      this.colChunks.clear();
      if (this.towns) for (const tw of this.towns.values()) this.dropTown(tw);
      this.towns = new Map();
      this.dayClears = [];
      if (this.npc) {
        this.scene.remove(this.npc.mesh);
        this.npc.mesh.geometry.dispose();
        this.npc = null;
      }
      // ramps: terrain materials first (row = material id), then snow, then every species
      const rt = (this.ramps = new RampTable(RAMP_ROWS));
      for (let m = 0; m < M.COUNT; m++) rt.add(CLASSIC[m].map(hexToRgb));
      this.snowRow = rt.add(SNOW, "snow");
      this.shadowRow = rt.add(rampFrom([40, 52, 60]), "shadow");
      this.roadRow = rt.add(
        ["#231b16", "#5a4735", "#86694b", "#a4865f", "#c1a478"].map(hexToRgb),
        "road",
      );
      // (the great city's streets are paved)
      this.paveRow = rt.add(
        ["#2c2928", "#57514d", "#7e766e", "#a1978a", "#c2b8a8"].map(hexToRgb),
        "pave",
      );
      const tr = performance.now();
      this.roadNet = buildRoads(planet, story);
      story.roads = this.roadNet;
      this.roadsMs = performance.now() - tr;
      this.setSites();
      if (this.setFauna) this.setFauna();
      if (this.setHostiles) this.setHostiles();
      if (this.clearArrows) this.clearArrows();
      this.flora = buildFlora(planet);
      this.spRow = this.flora.species.map((sp) =>
        rt.addSpecies(sp.g, "sp" + sp.id),
      );
      const t0 = performance.now();
      this.atlas = buildFloraAtlas(this.flora);
      this.atlasMs = performance.now() - t0;
      if (this.atlasTex) this.atlasTex.dispose();
      this.atlasTex = new T.DataTexture(
        this.atlas.data,
        this.atlas.width,
        this.atlas.height,
        T.RGBAFormat,
      );
      this.atlasTex.magFilter = this.atlasTex.minFilter = T.NearestFilter;
      this.atlasTex.needsUpdate = true;
      this.uniforms.uAtlas.value = this.atlasTex;
      this.uniforms.uSnowRow.value = this.snowRow;
      this.protos = new Map();
      this.rampVersion = -1;
      this.syncRamps();
      const atmo = ATMO[planet.body.atmo] || ATMO.blue;
      this.skyCols = {
        dayZen: mix3(v3(atmo.mid), [0.12, 0.2, 0.55], 0.25),
        dayHor: mix3(v3(atmo.lit), [0.92, 0.95, 1], 0.45),
        nightZen: [0.012, 0.012, 0.04],
        nightHor: mix3(v3(atmo.dim), [0.02, 0.02, 0.06], 0.72),
        dusk: [0.98, 0.52, 0.3],
      };
    }
    syncRamps() {
      if (this.rampVersion === this.ramps.version) return;
      this.rampTex.image.data.set(this.ramps.data);
      this.rampTex.needsUpdate = true;
      this.rampVersion = this.ramps.version;
    }
    row(color, key) {
      return this.ramps.add(rampFrom(color), key || "c" + color.join(","));
    }

    // one 3D prototype per species variant (built the first time it is needed)
    proto(spId, v, snow) {
      const key = spId * 8 + v * 2 + (snow ? 1 : 0);
      let p = this.protos.get(key);
      if (p !== undefined) return p;
      const sp = this.flora.species[spId],
        g = sp.g,
        base = this.spRow[spId];
      const rnd = mulberry32(hashInt(spId, v, 311));
      switch (g.form) {
        case "broadleaf":
        case "umbrella":
        case "snag":
          p = treeProto(g, base, rnd);
          break;
        case "conifer":
          p = coniferProto(g, base, rnd, snow);
          break;
        case "palm": {
          const fr = this.atlas.bySp[spId].frond;
          const e = fr.length ? this.atlas.entries[fr[0]] : null;
          p = e ? palmProto(g, base, rnd, [e.u0, e.v0, e.u1, e.v1]) : null;
          break;
        }
        case "stone":
          p = rockProto(g, base, rnd, snow);
          break;
        case "succulent":
          p =
            g.shape === "column" || g.shape === "barrel"
              ? cactusProto(g, base, rnd)
              : null;
          break;
        case "cap":
          p = g.giant || g.h > 1.2 ? capProto(g, base, rnd) : null;
          break;
        case "shrub":
          p = shrubProto(g, base, rnd);
          break;
        default:
          p = null; // grass, flowers, ferns, reeds: cards
      }
      if (p) {
        p.data = p.mesh.finish();
        p.sp = spId;
        // what stops you: trunks and stems are posts; rocks are domes you can climb onto
        const d = p.data;
        let foot = 0,
          topY = 0;
        for (let v = 0; v < d.count; v++) {
          const y = d.p[v * 3 + 1];
          topY = Math.max(topY, y);
          if (y < 1.4)
            foot = Math.max(foot, Math.hypot(d.p[v * 3], d.p[v * 3 + 2]));
        }
        p.topY = topY;
        if (p.kind === "rock") {
          p.solid = 2;
          p.footR = foot * 0.92;
        } else if (p.trunkR) {
          p.solid = 1;
          p.footR = Math.max(0.06, p.trunkR);
        } else p.solid = 0;
      }
      this.protos.set(key, p);
      return p;
    }

    // the same tree drawn rounder, for an ancient one many times the size (its own roots are drawn with it)
    bigProto(spId, v, snow) {
      const key = "big:" + spId + ":" + v + ":" + (snow ? 1 : 0);
      if (this.protos.has(key)) return this.protos.get(key);
      const sp = this.flora.species[spId],
        g = sp.g;
      if (g.form !== "broadleaf" && g.form !== "umbrella")
        return this.proto(spId, v, snow);
      const p = treeProto(
        { ...g, buttress: false },
        this.spRow[spId],
        mulberry32(hashInt(spId, v, 311)),
        { trunkSides: 12, branchSides: 8 },
      );
      p.data = p.mesh.finish();
      p.sp = spId;
      p.solid = 0;
      p.topY = p.top;
      this.protos.set(key, p);
      return p;
    }

    // ---------- entering ----------
    enter(landing, tDays, opts = {}) {
      this.initGL();
      if (this.cave) this.exitCave(true);
      this.p = norm3(landing);
      this.t = tDays;
      // (the caves near here raise their knolls before any ground is built)
      if (this.updateKnolls) this.updateKnolls(true);
      this.cloudAt = -1e9;
      this.cloudCenter = null;
      this.town = opts.town || null;
      const towards = this.town ? bearingTo(this.p, this.town.dir) : 0;
      this.yaw = -towards;
      this.pitch = 0;
      const F = frameAt(this.p);
      if (this.npc) {
        this.scene.remove(this.npc.mesh);
        this.npc.mesh.geometry.dispose();
        this.npc = null;
      }
      if (opts.traveller) {
        const tv = opts.traveller;
        const people = tv.owner >= 0 ? this.story.peoples[tv.owner] : null;
        const look = lookFromName(people, tv.name, "traveller");
        const pos = stepOn(
          this.p,
          F,
          Math.sin(towards) * 3.2,
          Math.cos(towards) * 3.2,
          this.R,
        );
        this.npc = this.makePerson(look, pos);
        this.npc.name = tv.name;
        this.faceToward(this.npc, this.p);
      }
      this.wake = opts.wake ? { t0: -1 } : null;
      this.eyeY =
        Math.max(0, this.ground.height(this.p[0], this.p[1], this.p[2], 1)) +
        (opts.wake ? 0.35 : EYE);
      this.vy = 0;
      this.active = true;
      this.journey = null;
      this.fade = 0;
      if (this.fire) this.fire.visible = false;
      this.ready = false;
    }
    // stream in the ground around you before showing it; true when done
    warmStep(ms) {
      const t0 = performance.now();
      if (this.updateKnolls) this.updateKnolls();
      this.view = this.makeView();
      for (let pass = 0; pass < 40 && performance.now() - t0 < ms; pass++) {
        const { want } = this.selectChunks();
        if (!want.length) {
          this.warmSites();
          this.ready = true;
          return true;
        }
        want.sort((a, b) => a.pri - b.pri);
        for (const w of want) {
          if (performance.now() - t0 > ms) break;
          const k = this.key(w.f, w.L, w.i, w.j);
          if (!this.chunks.has(k)) this.buildChunk(k, w.f, w.L, w.i, w.j);
        }
      }
      return false;
    }
    show() {
      this.canvas.hidden = false;
      if (this.wake) this.wake.t0 = performance.now();
    }
    leave() {
      this.active = false;
      this.canvas.hidden = true;
    }

    key(f, L, i, j) {
      return ((f * 32 + L) * 1048576 + i) * 1048576 + j;
    }

    // ---------- chunks ----------
    chunkGeom(f, L, i, j) {
      const size = 2 / (1 << L),
        s0 = -1 + i * size,
        t0 = -1 + j * size;
      const c = dirFromST(f, s0 + size / 2, t0 + size / 2, [0, 0, 0]);
      return { c, s0, t0, size, span: (this.R * (Math.PI / 2)) / (1 << L) };
    }

    buildChunk(key, f, L, i, j) {
      const T = this.T,
        G = this.ground,
        R = this.R;
      const { c, s0, t0, size, span } = this.chunkGeom(f, L, i, j);
      const F = frameAt(c);
      const n1 = CN + 1,
        MM = CN + 3;
      const lod = span / CN;
      const px = new Float64Array(MM * MM * 3);
      const hs = new Float32Array(MM * MM);
      const shade = new Float32Array(n1 * n1),
        temps = new Float32Array(n1 * n1);
      const bio = new Uint8Array(n1 * n1),
        hill = new Float32Array(n1 * n1);
      const d = [0, 0, 0],
        S = {};
      let minH = 1e9,
        maxH = -1e9;
      for (let jj = 0; jj < MM; jj++) {
        for (let ii = 0; ii < MM; ii++) {
          dirFromST(
            f,
            s0 + ((ii - 1) * size) / CN,
            t0 + ((jj - 1) * size) / CN,
            d,
          );
          const inner = ii >= 1 && jj >= 1 && ii <= CN + 1 && jj <= CN + 1;
          let h;
          if (inner) {
            G.sample(d[0], d[1], d[2], lod, S);
            h = S.h;
            const k = (jj - 1) * n1 + (ii - 1);
            bio[k] = S.biome;
            temps[k] = S.T;
            hill[k] = S.hill || 0;
            shade[k] =
              S.patch * 0.28 +
              (hash01(ii + i * CN, jj + j * CN, f * 97 + L) - 0.5) * 0.18;
            if (h < minH) minH = h;
            if (h > maxH) maxH = h;
          } else h = G.height(d[0], d[1], d[2], lod);
          hs[jj * MM + ii] = h;
          const r = R + h;
          const X = d[0] * r - c[0] * R,
            Y = d[1] * r - c[1] * R,
            Z = d[2] * r - c[2] * R;
          const o = (jj * MM + ii) * 3;
          px[o] = X * F.e[0] + Y * F.e[1] + Z * F.e[2];
          px[o + 1] = X * F.u[0] + Y * F.u[1] + Z * F.u[2];
          px[o + 2] = -(X * F.n[0] + Y * F.n[1] + Z * F.n[2]);
        }
      }
      const nv = n1 * n1 + this.edge.length;
      const pos = new Float32Array(nv * 3),
        nrm = new Float32Array(nv * 3),
        aMat = new Float32Array(nv),
        aShade = new Float32Array(nv);
      const road = maxH > 0 ? this.roadField(c, F, span) : null;
      const roadW = Math.max(2.1, lod * 0.55);
      for (let jj = 0; jj < n1; jj++)
        for (let ii = 0; ii < n1; ii++) {
          const a = ((jj + 1) * MM + ii + 1) * 3;
          const l = ((jj + 1) * MM + ii) * 3,
            r = ((jj + 1) * MM + ii + 2) * 3,
            dn = (jj * MM + ii + 1) * 3,
            up = ((jj + 2) * MM + ii + 1) * 3;
          const ax = px[r] - px[l],
            ay = px[r + 1] - px[l + 1],
            az = px[r + 2] - px[l + 2];
          const bx = px[up] - px[dn],
            by = px[up + 1] - px[dn + 1],
            bz = px[up + 2] - px[dn + 2];
          let nx = ay * bz - az * by,
            ny = az * bx - ax * bz,
            nz = ax * by - ay * bx;
          const nl = Math.hypot(nx, ny, nz) || 1;
          nx /= nl;
          ny /= nl;
          nz /= nl;
          dirFromST(f, s0 + (ii * size) / CN, t0 + (jj * size) / CN, d);
          const ux = dot3(d, F.e),
            uy = dot3(d, F.u),
            uz = -dot3(d, F.n);
          if (nx * ux + ny * uy + nz * uz < 0) {
            nx = -nx;
            ny = -ny;
            nz = -nz;
          }
          const cosSlope = nx * ux + ny * uy + nz * uz;
          const k = jj * n1 + ii;
          pos[k * 3] = px[a];
          pos[k * 3 + 1] = px[a + 1];
          pos[k * 3 + 2] = px[a + 2];
          nrm[k * 3] = nx;
          nrm[k * 3 + 1] = ny;
          nrm[k * 3 + 2] = nz;
          const h = hs[(jj + 1) * MM + ii + 1];
          let m = GBIOME[bio[k]] ?? M.STEPPE;
          let sh = shade[k];
          if (h > 0) {
            if (cosSlope < 0.78 && m !== M.ICE) m = M.ROCK;
            else if (h < 2.2 && temps[k] > 6 && m !== M.ICE && lod < 200)
              m = M.SAND;
            if (road) {
              const dd = road(px[a], px[a + 2]);
              if (dd < roadW) {
                m =
                  road.pave && road.pave(px[a], px[a + 2])
                    ? this.paveRow
                    : this.roadRow;
                sh += dd < roadW * 0.45 ? 0.12 : -0.1;
              }
            }
          } else m = h > -40 ? M.SAND : M.ROCK;
          aMat[k] = m;
          aShade[k] = sh;
        }
      const drop = Math.min(600, Math.max(2, span * 0.025));
      for (let q = 0; q < this.edge.length; q++) {
        const src = this.edge[q],
          k = n1 * n1 + q;
        const ii = src % n1,
          jj = (src - ii) / n1;
        dirFromST(f, s0 + (ii * size) / CN, t0 + (jj * size) / CN, d);
        pos[k * 3] = pos[src * 3] - dot3(d, F.e) * drop;
        pos[k * 3 + 1] = pos[src * 3 + 1] - dot3(d, F.u) * drop;
        pos[k * 3 + 2] = pos[src * 3 + 2] + dot3(d, F.n) * drop;
        nrm[k * 3] = nrm[src * 3];
        nrm[k * 3 + 1] = nrm[src * 3 + 1];
        nrm[k * 3 + 2] = nrm[src * 3 + 2];
        aMat[k] = aMat[src];
        aShade[k] = aShade[src];
      }
      const geo = new T.BufferGeometry();
      geo.setAttribute("position", new T.BufferAttribute(pos, 3));
      geo.setAttribute("normal", new T.BufferAttribute(nrm, 3));
      geo.setAttribute("aMat", new T.BufferAttribute(aMat, 1));
      geo.setAttribute("aShade", new T.BufferAttribute(aShade, 1));
      geo.setIndex(this.index);
      geo.computeBoundingSphere();
      const mesh = new T.Mesh(geo, this.terrainMat);
      mesh.matrixAutoUpdate = false;
      const chunk = {
        key,
        f,
        L,
        i,
        j,
        c,
        F,
        span,
        mesh,
        water: null,
        solids: null,
        cards: null,
        minH,
        maxH,
        used: this.frame,
      };
      if (minH < 0)
        chunk.water = this.buildWater(f, c, F, s0, t0, size, hs, MM);
      if (maxH > 0 && this.maxL - L <= 3) {
        const D = { pos, nrm, bio, temps, hs, MM, n1, road, roadW, hill };
        if (L === this.maxL) chunk.D = D; // kept so what you change can be rebuilt
        this.buildProps(chunk, D);
      }
      this.chunks.set(key, chunk);
      return chunk;
    }

    // distance (m) from a point in a chunk's own metres to the nearest road, or null if none is near
    roadField(c, F, span) {
      if (span > 3000) return null;
      // (and the great city's streets, close up: as wide as they are, whatever the ground's detail)
      const cw = Math.max(2.1, (span / CN) * 0.55),
        city =
          span <= 160 && this.cityStreetField
            ? this.cityStreetField(c, F, span)
            : null;
      const cityOnly = city ? (x, z) => city(x, z) + cw : null;
      const pave = city ? (x, z) => city(x, z) < 0.2 && city.inner(x, z) : null;
      if (cityOnly) cityOnly.pave = pave;
      if (!this.roadNet) return cityOnly;
      const segs = roadSegsNear(this.roadNet, c, (span / 1000) * 0.75 + 0.25);
      if (!segs.length) return cityOnly;
      const R = this.R;
      const loc = (v) => {
        const d = [v[0] - c[0], v[1] - c[1], v[2] - c[2]];
        return [dot3(d, F.e) * R, -dot3(d, F.n) * R];
      };
      const L = segs.map((sg) => {
        const A = loc(sg.a),
          Bp = loc(sg.b),
          dx = Bp[0] - A[0],
          dz = Bp[1] - A[1],
          len = Math.hypot(dx, dz) || 1;
        return {
          A,
          dx: dx / len,
          dz: dz / len,
          len,
          along: sg.along * 1000,
          seed: sg.road * 1.37,
          rd: this.roadNet.roads[sg.road],
        };
      });
      const fn = (x, z) => {
        let best = 1e9;
        for (const sg of L) {
          const rx = x - sg.A[0],
            rz = z - sg.A[1];
          const t = rx * sg.dx + rz * sg.dz;
          if (t < -40 || t > sg.len + 40) continue;
          const tc = Math.max(0, Math.min(sg.len, t));
          const side =
            -rx * sg.dz + rz * sg.dx - roadBend(sg.rd, sg.along + tc, sg.seed);
          const d = Math.hypot(side, t - tc);
          if (d < best) best = d;
        }
        return city ? Math.min(best, city(x, z) + cw) : best;
      };
      fn.pave = pave;
      return fn;
    }

    buildWater(f, c, F, s0, t0, size, hs, MM) {
      const T = this.T,
        R = this.R,
        n1 = CN + 1;
      const pos = new Float32Array(n1 * n1 * 3),
        dep = new Float32Array(n1 * n1);
      const d = [0, 0, 0];
      for (let jj = 0; jj < n1; jj++)
        for (let ii = 0; ii < n1; ii++) {
          dirFromST(f, s0 + (ii * size) / CN, t0 + (jj * size) / CN, d);
          const X = (d[0] - c[0]) * R,
            Y = (d[1] - c[1]) * R,
            Z = (d[2] - c[2]) * R;
          const k = jj * n1 + ii;
          pos[k * 3] = X * F.e[0] + Y * F.e[1] + Z * F.e[2];
          pos[k * 3 + 1] = X * F.u[0] + Y * F.u[1] + Z * F.u[2];
          pos[k * 3 + 2] = -(X * F.n[0] + Y * F.n[1] + Z * F.n[2]);
          dep[k] = Math.max(0, -hs[(jj + 1) * MM + ii + 1]);
        }
      const geo = new T.BufferGeometry();
      geo.setAttribute("position", new T.BufferAttribute(pos, 3));
      geo.setAttribute("aDepth", new T.BufferAttribute(dep, 1));
      geo.setIndex(this.index.slice(0, CN * CN * 6));
      geo.computeBoundingSphere();
      const mesh = new T.Mesh(geo, this.waterMat);
      mesh.matrixAutoUpdate = false;
      return mesh;
    }

    // ---------- plants and rocks: 3D near you, painted stand-ins further out ----------
    buildProps(chunk, D) {
      const lvl = this.maxL - chunk.L;
      const near = lvl === 0,
        cover = lvl === 0;
      const flora = this.flora,
        span = chunk.span,
        n1 = D.n1;
      const solids = [],
        cards = [],
        col = [],
        colKind = [],
        colSid = [],
        roots = [];
      const gone = this.world ? this.world.gone : null;
      let nSolid = 0;
      if (near) chunk.solidInfo = new Map();
      // towns clear the ground around them (in this chunk's own metres)
      const clear = [];
      for (const s of this.story.settlements) {
        const m = arcM(chunk.c, s.dir, this.R);
        const rad = townRadius(s);
        if (m > span + rad) continue;
        const d = [
          s.dir[0] - chunk.c[0],
          s.dir[1] - chunk.c[1],
          s.dir[2] - chunk.c[2],
        ];
        clear.push([
          dot3(d, chunk.F.e) * this.R,
          -dot3(d, chunk.F.n) * this.R,
          rad * rad,
        ]);
      }
      if (lvl <= 3) for (const q of this.siteClear(chunk)) clear.push(q);
      if (lvl <= 3 && this.dayClears && this.dayClears.length)
        for (const q of this.dayClearOf(chunk)) clear.push(q);
      if (lvl === 0) for (const q of this.footprints(chunk)) clear.push(q);
      const area = span * span;
      if (lvl > 3) return;
      const kinds = near
        ? ["tree", "shrub", "rare", "cover"]
        : lvl === 1
          ? ["tree", "shrub", "rare"]
          : ["tree"];
      const thin = lvl <= 1 ? 1 : lvl === 2 ? 0.6 : 0.3;
      const at = (fx, fy) => {
        const ii = Math.min(CN - 1, fx | 0),
          jj = Math.min(CN - 1, fy | 0),
          u = fx - ii,
          v = fy - jj;
        const k = jj * n1 + ii;
        const P = [0, 1, 2].map(
          (o) =>
            (D.pos[k * 3 + o] * (1 - u) + D.pos[(k + 1) * 3 + o] * u) *
              (1 - v) +
            (D.pos[(k + n1) * 3 + o] * (1 - u) +
              D.pos[(k + n1 + 1) * 3 + o] * u) *
              v,
        );
        const kn = Math.round(fy) * n1 + Math.round(fx);
        return {
          P,
          k: kn,
          h: D.hs[(Math.round(fy) + 1) * D.MM + Math.round(fx) + 1],
          N: [D.nrm[kn * 3], D.nrm[kn * 3 + 1], D.nrm[kn * 3 + 2]],
        };
      };
      // the ground near a point (fx, fy) of this chunk, as a height in its own metres at (x, z): what roots lie over.
      // It is the ground's own mesh, cut into triangles the way it is drawn (see makeIndex); past this chunk's edge,
      // the next one's, from the ground itself at the corners of its cells (the same grid, carried on).
      const R = this.R,
        G = this.ground,
        lod = span / CN,
        cF = chunk.F,
        gm = this.chunkGeom(chunk.f, chunk.L, chunk.i, chunk.j),
        dd = [0, 0, 0],
        past = new Map();
      const cornerY = (ii, jj) => {
        if (ii >= 0 && jj >= 0 && ii <= CN && jj <= CN)
          return D.pos[(jj * n1 + ii) * 3 + 1];
        const key = ii * 4096 + jj;
        let y = past.get(key);
        if (y == null) {
          dirFromST(
            chunk.f,
            gm.s0 + (ii * gm.size) / CN,
            gm.t0 + (jj * gm.size) / CN,
            dd,
          );
          const h = G.height(dd[0], dd[1], dd[2], lod);
          y =
            (R + h) * (dd[0] * cF.u[0] + dd[1] * cF.u[1] + dd[2] * cF.u[2]) - R;
          past.set(key, y);
        }
        return y;
      };
      const meshY = (gx, gy) => {
        const ii = Math.floor(gx),
          jj = Math.floor(gy),
          u = gx - ii,
          v = gy - jj;
        const ha = cornerY(ii, jj),
          hb = cornerY(ii + 1, jj),
          hc = cornerY(ii, jj + 1),
          hd = cornerY(ii + 1, jj + 1);
        if ((ii + jj) & 1)
          return u + v <= 1
            ? ha + (hb - ha) * u + (hc - ha) * v
            : hd + (hc - hd) * (1 - u) + (hb - hd) * (1 - v);
        return u >= v
          ? ha + (hb - ha) * u + (hd - hb) * v
          : ha + (hc - ha) * v + (hd - hc) * u;
      };
      const groundNear = (fx, fy) => {
        const P0 = at(fx, fy).P,
          Pa = at(fx + 0.5, fy).P,
          Pb = at(fx, fy + 0.5).P;
        const ax = (Pa[0] - P0[0]) * 2,
          az = (Pa[2] - P0[2]) * 2,
          bx = (Pb[0] - P0[0]) * 2,
          bz = (Pb[2] - P0[2]) * 2,
          det = ax * bz - az * bx;
        return (x, z) => {
          const dx = x - P0[0],
            dz = z - P0[2];
          return meshY(
            fx + (dx * bz - dz * bx) / det,
            fy + (ax * dz - az * dx) / det,
          );
        };
      };
      // Every level scatters the same plants: each is born in one of the finest cells, with that
      // cell's own dice, so walking closer only changes how a tree is drawn, never whether it is there.
      const m = 1 << lvl,
        cellSpan = (this.R * (Math.PI / 2)) / (1 << this.maxL),
        cellArea = cellSpan * cellSpan;
      for (let cb = 0; cb < m; cb++)
        for (let ca = 0; ca < m; ca++) {
          const ci = chunk.i * m + ca,
            cj = chunk.j * m + cb,
            cellKey = this.key(chunk.f, this.maxL, ci, cj);
          const rnd = mulberry32(hashInt(ci, cj, chunk.f * 64 + this.maxL));
          for (let kk = 0; kk < kinds.length; kk++) {
            const kind = kinds[kk];
            const n = Math.round(
              (MAXD[kind] / 100) * cellArea * DENSITY * (0.9 + rnd() * 0.2),
            );
            for (let q = 0; q < n; q++) {
              const fx0 = rnd() * CN,
                fy0 = rnd() * CN,
                pick = rnd(),
                acc = rnd(),
                rot = rnd() * Math.PI * 2,
                sc = 0.78 + rnd() * 0.44,
                vr = rnd();
              // further out, fewer of them: the same subset every time
              if (
                thin < 1 &&
                hash01(ci * 131 + q, cj * 71 + kk, chunk.f * 7 + 3) >= thin
              )
                continue;
              const fx = ((ca + fx0 / CN) * CN) / m,
                fy = ((cb + fy0 / CN) * CN) / m;
              const sid = cellKey + ":" + kk + "." + q;
              const s = at(fx, fy);
              if (s.h < 0.25) continue;
              if (
                clear.length &&
                clear.some(
                  (q) =>
                    (kind !== "cover" || q[3]) && inClear(q, s.P[0], s.P[2]),
                )
              )
                continue;
              if (
                D.road &&
                D.road(s.P[0], s.P[2]) <
                  D.roadW +
                    (kind === "cover" ? 0.3 : kind === "tree" ? 3.5 : 1.5)
              )
                continue;
              const b = D.bio[s.k],
                Tc = D.temps[s.k];
              // high up a hill the trees thin out, and its top is bare (you can see from there)
              if (
                kind === "tree" &&
                D.hill &&
                D.hill[s.k] > 0.45 &&
                hash01(ci * 13 + q, cj * 29 + kk, 4242) <
                  (D.hill[s.k] - 0.45) * 3.2
              )
                continue;
              let spId = -1;
              // the shore: palms where it is hot, reeds where it is wet
              if (s.h < 3.5 && Tc > 21 && WARM_WET.has(b) && kind === "tree") {
                if (acc < 0.25) spId = flora.shore.palm;
                else continue;
              } else if (
                s.h < 1.4 &&
                kind === "cover" &&
                WARM_WET.has(b) &&
                acc < 0.35
              )
                spId = flora.shore.reed;
              else {
                const layers = flora.table[b];
                if (!layers) continue;
                const layer = layers.find((l) => l.layer === kind);
                if (!layer || acc > layer.density / MAXD[kind]) continue;
                let tot = 0;
                for (const e of layer.list) tot += e.w;
                let x = pick * tot;
                spId = layer.list[0].sp;
                for (const e of layer.list) {
                  x -= e.w;
                  if (x <= 0) {
                    spId = e.sp;
                    break;
                  }
                }
              }
              const sp = flora.species[spId];
              if (!sp) continue;
              const up = s.N[1];
              if (
                up < 0.8 &&
                (sp.form === "broadleaf" ||
                  sp.form === "umbrella" ||
                  sp.form === "palm")
              )
                continue;
              if (up < 0.65 && sp.form !== "stone" && sp.form !== "grass")
                continue;
              const snow = Tc < -2;
              const P = [s.P[0], s.P[1] - 0.12, s.P[2]];
              const proto = near
                ? this.proto(spId, Math.floor(vr * 3), snow)
                : null;
              if (!near && gone && gone.has(sid)) continue; // felled or broken: gone from afar too
              if (proto) {
                const oldSid = chunk.key + ":" + nSolid++; // how the first saves named things
                if (gone && (gone.has(sid) || gone.has(oldSid))) {
                  // felled: a stump is left; broken rocks leave nothing
                  if (proto.trunkR) {
                    const st = this.stumpProto(proto, spId, sc);
                    solids.push({ proto: st, P, rot, sc: 1, N: s.N });
                    col.push(
                      P[0],
                      P[2],
                      st.footR,
                      P[1] + 0.12,
                      P[1] + 0.12 + st.topY,
                      2,
                    );
                    colKind.push("stump");
                    colSid.push(null);
                  }
                  continue;
                }
                const entry = { proto, P, rot, sc, N: s.N, spId, snow };
                if (proto.fins) entry.gnd = groundNear(fx, fy);
                solids.push(entry);
                if (proto.solid) chunk.solidInfo.set(sid, entry);
                // x, z, radius, base, top, kind (1 post, 2 dome)
                if (
                  proto.solid &&
                  proto.footR * sc > 0.05 &&
                  !(proto.solid === 2 && proto.topY * sc < 0.12)
                ) {
                  col.push(
                    P[0],
                    P[2],
                    proto.footR * sc,
                    P[1] + 0.12,
                    P[1] + proto.topY * sc,
                    proto.solid,
                  );
                  colKind.push(proto.kind);
                  colSid.push(sid);
                }
                // a jungle giant's buttress roots, turned and grown the way it was
                if (proto.fins)
                  roots.push(this.rootSet(proto, P[0], P[2], rot, sc, -0.12));
                this.treeCards(entry, P, cards);
              } else {
                // a painted stand-in (or a small plant that is always a card)
                if (
                  !near &&
                  (sp.form === "grass" ||
                    sp.form === "flower" ||
                    sp.form === "fern" ||
                    sp.form === "reed")
                )
                  continue;
                const bs = this.atlas.bySp[spId];
                const list =
                  snow && bs.wholeSnow.length ? bs.wholeSnow : bs.whole;
                if (!list.length) continue;
                const e =
                  this.atlas.entries[list[Math.floor(vr * list.length)]];
                const hgt = sp.g.h * sc,
                  wid = (hgt * e.w) / e.h;
                const flip = rot > Math.PI;
                cards.push(
                  P[0],
                  P[1],
                  P[2],
                  flip ? e.u1 : e.u0,
                  e.v0,
                  flip ? e.u0 : e.u1,
                  e.v1,
                  wid,
                  hgt,
                  0,
                  1,
                  0,
                  this.spRow[spId],
                  0,
                );
              }
            }
          }
        }
      if (solids.length) chunk.solids = this.mergeSolids(solids);
      if (cards.length) chunk.cards = this.makeCards(cards, chunk);
      if (col.length) {
        chunk.col = new Float64Array(col);
        chunk.colKind = colKind;
        chunk.colSid = colSid;
        this.colChunks.add(chunk);
      }
      chunk.roots = roots.length ? roots : null;
      if (near && chunk.D) this.buildFinds(chunk, D, at, clear);
    }

    // A trunk's buttress roots, for what you bump into: where (x, z) it stands, each fin turned by rot and grown by
    // sc, in metres (see kits' finAt), each laid over the ground it is on (off: how far its own foot is under the
    // ground). R: as far out as any of them reaches.
    rootSet(proto, x, z, rot, sc, off) {
      const cs = Math.cos(rot),
        sn = Math.sin(rot);
      const fins = proto.fins.map((f) => ({
        ux: f.ux * cs - f.uz * sn,
        uz: f.ux * sn + f.uz * cs,
        r0: f.r0 * sc,
        reach: f.reach * sc,
        rise: f.rise * sc,
        w0: f.w0 * sc,
      }));
      let R = 0;
      for (const f of fins) R = Math.max(R, f.reach);
      return { x, z, s: sc, fins, R: R + 0.7, off };
    }

    // the leaf clumps of one tree, as card data (positions relative to P)
    treeCards(entry, P, cards) {
      const { proto, rot, sc, spId, snow } = entry;
      const bs = this.atlas.bySp[spId];
      if (!bs || !proto.cards.length) return;
      const clumps = snow && bs.clumpSnow.length ? bs.clumpSnow : bs.clump;
      if (!clumps.length) return;
      const cs = Math.cos(rot),
        sn = Math.sin(rot),
        row = this.spRow[spId];
      // (a low bush's clumps follow a slope the way its stems do)
      const [gx, gz, sh] = solidShear(entry, sc);
      for (const c of proto.cards) {
        const e = this.atlas.entries[clumps[Math.floor(c.v * clumps.length)]];
        const x = c.x * cs - c.z * sn,
          z = c.x * sn + c.z * cs;
        const flip = c.v > 0.5;
        const hgt = c.s * sc * (e.h / e.w);
        const t = sh > 0 ? Math.min(1, Math.max(0, (c.y * sc) / sh)) : 1,
          dy = sh > 0 ? (gx * x + gz * z) * sc * (1 - t * t * (3 - 2 * t)) : 0;
        cards.push(
          P[0] + x * sc,
          P[1] + c.y * sc + dy,
          P[2] + z * sc,
          flip ? e.u1 : e.u0,
          e.v0,
          flip ? e.u0 : e.u1,
          e.v1,
          c.s * sc,
          hgt,
          c.nx * cs - c.nz * sn,
          c.ny,
          c.nx * sn + c.nz * cs,
          row,
          proto.droop ? 1 - (0.5 * e.w) / e.h : 0.5,
        );
      }
    }
    // what is left of a felled tree
    stumpProto(proto, spId, sc) {
      const r = Math.max(0.08, Math.round((proto.trunkR * sc) / 0.03) * 0.03);
      const key = "stump:" + spId + ":" + r;
      if (!this.protos.has(key)) {
        const mb = new MeshBuf(),
          row = this.spRow[spId] + 1,
          wood = this.row([196, 160, 110]);
        mb.prism([0, -0.12, 0], [0, 0.42, 0], r * 1.08, r, 7, row, PAT.BARK);
        mb.cone([0, 0.42, 0], 0.46, r * 0.98, 7, wood, PAT.NONE, { lv: 0.4 });
        const st = {
          mesh: mb,
          cards: [],
          radius: r * 1.2,
          kind: "stump",
          top: 0.46,
          footR: r * 1.05,
          topY: 0.46,
        };
        st.data = mb.finish();
        this.protos.set(key, st);
      }
      return this.protos.get(key);
    }

    mergeSolids(list) {
      const T = this.T;
      let nv = 0;
      for (const s of list) nv += s.proto.data.count + 24;
      const P = new Float32Array(nv * 3),
        N = new Float32Array(nv * 3),
        R = new Float32Array(nv),
        R2 = new Float32Array(nv),
        UV = new Float32Array(nv * 2),
        PT = new Float32Array(nv),
        LV = new Float32Array(nv);
      let o = 0;
      for (const s of list) {
        const d = s.proto.data,
          cs = Math.cos(s.rot),
          sn = Math.sin(s.rot),
          k = s.sc;
        // on a slope its foot follows the ground (the plane through its middle along the ground's normal), less and
        // less up to shearH: a trunk stands straight up out of the slope, a rock lies along it
        const [gx, gz, sh] = solidShear(s, k);
        // (a buttress tree's roots are laid over the ground itself, however it lies)
        const fin0 = s.gnd && s.proto.finFrom != null ? s.proto.finFrom : -1,
          fin1 = fin0 >= 0 ? s.proto.finTo : -1,
          g0 = s.P[1] + 0.12;
        for (let v = 0; v < d.count; v++, o++) {
          const x = d.p[v * 3],
            y = d.p[v * 3 + 1],
            z = d.p[v * 3 + 2];
          const X = (x * cs - z * sn) * k,
            Z = (x * sn + z * cs) * k;
          let Y = y * k;
          if (v >= fin0 && v < fin1) Y += s.gnd(s.P[0] + X, s.P[2] + Z) - g0;
          else if (sh > 0) {
            const t = Y <= 0 ? 0 : Y >= sh ? 1 : Y / sh;
            Y += (gx * X + gz * Z) * (1 - t * t * (3 - 2 * t));
          }
          P[o * 3] = s.P[0] + X;
          P[o * 3 + 1] = s.P[1] + Y;
          P[o * 3 + 2] = s.P[2] + Z;
          const nx = d.n[v * 3],
            nz = d.n[v * 3 + 2];
          N[o * 3] = nx * cs - nz * sn;
          N[o * 3 + 1] = d.n[v * 3 + 1];
          N[o * 3 + 2] = nx * sn + nz * cs;
          const fr = d.t[v] === PAT.FROND;
          R[o] = d.r[v];
          R2[o] = d.r2[v];
          UV[o * 2] = d.uv[v * 2] * (fr ? 1 : k);
          UV[o * 2 + 1] = d.uv[v * 2 + 1] * (fr ? 1 : k);
          PT[o] = d.t[v];
          LV[o] = d.lv[v];
        }
        if (s.noShadow) continue;
        // a dithered shadow under it, tilted to the ground
        const r = s.proto.radius * k * 0.95,
          n = s.N;
        const tx = norm3([1 - n[0] * n[0], -n[0] * n[1], -n[0] * n[2]]),
          tz = norm3([-n[2] * n[0], -n[2] * n[1], 1 - n[2] * n[2]]);
        const cx = s.P[0] + n[0] * 0.16,
          cy = s.P[1] + 0.12 + n[1] * 0.06,
          cz = s.P[2] + n[2] * 0.16;
        for (let q = 0; q < 8; q++) {
          const a0 = (q / 8) * Math.PI * 2,
            a1 = ((q + 1) / 8) * Math.PI * 2;
          const pts = [
            [0, 0],
            [Math.cos(a1), Math.sin(a1)],
            [Math.cos(a0), Math.sin(a0)],
          ];
          for (const [u, w] of pts) {
            P[o * 3] = cx + (tx[0] * u + tz[0] * w) * r;
            P[o * 3 + 1] = cy + (tx[1] * u + tz[1] * w) * r;
            P[o * 3 + 2] = cz + (tx[2] * u + tz[2] * w) * r;
            N[o * 3] = n[0];
            N[o * 3 + 1] = n[1];
            N[o * 3 + 2] = n[2];
            R[o] = this.shadowRow;
            R2[o] = this.shadowRow;
            UV[o * 2] = u;
            UV[o * 2 + 1] = w;
            PT[o] = PAT.SHADOW;
            LV[o] = 0;
            o++;
          }
        }
      }
      const geo = new T.BufferGeometry();
      const cut = (a, k) => a.subarray(0, o * k);
      geo.setAttribute("position", new T.BufferAttribute(cut(P, 3), 3));
      geo.setAttribute("normal", new T.BufferAttribute(cut(N, 3), 3));
      geo.setAttribute("aRow", new T.BufferAttribute(cut(R, 1), 1));
      geo.setAttribute("aRow2", new T.BufferAttribute(cut(R2, 1), 1));
      geo.setAttribute("aUv", new T.BufferAttribute(cut(UV, 2), 2));
      geo.setAttribute("aPat", new T.BufferAttribute(cut(PT, 1), 1));
      geo.setAttribute("aLv", new T.BufferAttribute(cut(LV, 1), 1));
      geo.computeBoundingSphere();
      const mesh = new T.Mesh(geo, this.solidMat);
      mesh.matrixAutoUpdate = false;
      return mesh;
    }

    makeCards(arr, chunk) {
      const T = this.T,
        n = arr.length / 14;
      const geo = new T.InstancedBufferGeometry();
      geo.setAttribute(
        "position",
        new T.Float32BufferAttribute(
          [-0.5, 0, 0, 0.5, 0, 0, 0.5, 1, 0, -0.5, 1, 0],
          3,
        ),
      );
      geo.setIndex([0, 1, 2, 0, 2, 3]);
      const iPos = new Float32Array(n * 3),
        iUv = new Float32Array(n * 4),
        iSize = new Float32Array(n * 2),
        iNrm = new Float32Array(n * 3),
        iRow = new Float32Array(n),
        iAnchor = new Float32Array(n);
      for (let q = 0; q < n; q++) {
        const s = q * 14;
        iPos[q * 3] = arr[s];
        iPos[q * 3 + 1] = arr[s + 1];
        iPos[q * 3 + 2] = arr[s + 2];
        iUv[q * 4] = arr[s + 3];
        iUv[q * 4 + 1] = arr[s + 4];
        iUv[q * 4 + 2] = arr[s + 5];
        iUv[q * 4 + 3] = arr[s + 6];
        iSize[q * 2] = arr[s + 7];
        iSize[q * 2 + 1] = arr[s + 8];
        iNrm[q * 3] = arr[s + 9];
        iNrm[q * 3 + 1] = arr[s + 10];
        iNrm[q * 3 + 2] = arr[s + 11];
        iRow[q] = arr[s + 12];
        iAnchor[q] = arr[s + 13];
      }
      geo.setAttribute("iPos", new T.InstancedBufferAttribute(iPos, 3));
      geo.setAttribute("iUv", new T.InstancedBufferAttribute(iUv, 4));
      geo.setAttribute("iSize", new T.InstancedBufferAttribute(iSize, 2));
      geo.setAttribute("iNrm", new T.InstancedBufferAttribute(iNrm, 3));
      geo.setAttribute("iRow", new T.InstancedBufferAttribute(iRow, 1));
      geo.setAttribute("iAnchor", new T.InstancedBufferAttribute(iAnchor, 1));
      geo.instanceCount = n;
      geo.boundingSphere = chunk.mesh.geometry.boundingSphere.clone();
      geo.boundingSphere.radius += 40;
      const mesh = new T.Mesh(geo, this.cardMat);
      mesh.matrixAutoUpdate = false;
      return mesh;
    }

    dropChunk(c) {
      this.colChunks.delete(c);
      for (const m of [c.mesh, c.water, c.solids, c.cards, c.findMeshObj]) {
        if (!m) continue;
        if (m.parent) m.parent.remove(m);
        m.geometry.dispose();
      }
    }

    // place a frame's contents relative to the viewer (double precision)
    placeMatrix(obj, c, F, extraUp = 0, spin = 0) {
      const V = this.view;
      const cx = c[0] * this.R - V.O[0],
        cy = c[1] * this.R - V.O[1],
        cz = c[2] * this.R - V.O[2];
      let b0 = F.e,
        b2 = [-F.n[0], -F.n[1], -F.n[2]];
      if (spin) {
        const cs = Math.cos(spin),
          sn = Math.sin(spin);
        const e2 = [
          b0[0] * cs + b2[0] * sn,
          b0[1] * cs + b2[1] * sn,
          b0[2] * cs + b2[2] * sn,
        ];
        const s2 = [
          -b0[0] * sn + b2[0] * cs,
          -b0[1] * sn + b2[1] * cs,
          -b0[2] * sn + b2[2] * cs,
        ];
        b0 = e2;
        b2 = s2;
      }
      const b1 = F.u;
      const r = (v) => [dot3(v, V.F.e), dot3(v, V.F.u), -dot3(v, V.F.n)];
      const c0 = r(b0),
        c1 = r(b1),
        c2 = r(b2),
        tt = r([
          cx + b1[0] * extraUp,
          cy + b1[1] * extraUp,
          cz + b1[2] * extraUp,
        ]);
      obj.matrix.set(
        c0[0],
        c1[0],
        c2[0],
        tt[0],
        c0[1],
        c1[1],
        c2[1],
        tt[1],
        c0[2],
        c1[2],
        c2[2],
        tt[2],
        0,
        0,
        0,
        1,
      );
      obj.matrixWorldNeedsUpdate = true;
    }

    selectChunks() {
      const R = this.R,
        p = this.p;
      const camR = R + this.eyeY;
      const horizon = Math.min(
        Math.acos(Math.min(1, R / camR)) + Math.acos(R / (R + 9000)),
        (this.viewM() * 1.1) / R,
      );
      const draw = [],
        want = [];
      const visit = (f, L, i, j) => {
        const ch = this.chunks.get(this.key(f, L, i, j));
        if (!ch) return;
        ch.used = this.frame;
        const ang = Math.acos(Math.max(-1, Math.min(1, dot3(p, ch.c))));
        if (ang - (ch.span / R) * 0.75 > horizon) return;
        const hm = R + (ch.minH + ch.maxH) / 2;
        const dist = Math.max(
          0,
          Math.hypot(
            ch.c[0] * hm - p[0] * camR,
            ch.c[1] * hm - p[1] * camR,
            ch.c[2] * hm - p[2] * camR,
          ) -
            ch.span * 0.71,
        );
        if (L < this.maxL && dist < SPLIT * ch.span) {
          const kids = [
            [2 * i, 2 * j],
            [2 * i + 1, 2 * j],
            [2 * i, 2 * j + 1],
            [2 * i + 1, 2 * j + 1],
          ];
          if (
            kids.every(([a, b]) => this.chunks.has(this.key(f, L + 1, a, b)))
          ) {
            for (const [a, b] of kids) visit(f, L + 1, a, b);
            return;
          }
          for (const [a, b] of kids)
            if (!this.chunks.has(this.key(f, L + 1, a, b)))
              want.push({
                f,
                L: L + 1,
                i: a,
                j: b,
                pri: dist / ch.span - L * 0.05,
              });
        }
        draw.push(ch);
      };
      for (let f = 0; f < 6; f++) {
        if (!this.chunks.has(this.key(f, 0, 0, 0))) {
          want.push({ f, L: 0, i: 0, j: 0, pri: -99 });
          continue;
        }
        visit(f, 0, 0, 0);
      }
      return { draw, want };
    }

    makeView() {
      const F = frameAt(this.p);
      return {
        F,
        O: [this.p[0] * this.R, this.p[1] * this.R, this.p[2] * this.R],
      };
    }

    // ---------- people ----------
    lookRows(look) {
      const r = (c) => this.row(c);
      return {
        skin: r(look.skin),
        hair: r(look.hair.color),
        main: r(look.main),
        trim: r(look.trim),
        under: r(look.under),
        leather: r([96, 64, 44]),
        wood: r([120, 84, 50]),
        metal: r(look.metal || [170, 176, 188]),
        glow: r([255, 214, 120]),
      };
    }
    makePerson(look, dir) {
      const T = this.T;
      const pr = personProto(look, this.lookRows(look));
      const d = pr.mesh.finish();
      this.syncRamps();
      const geo = new T.BufferGeometry();
      geo.setAttribute("position", new T.BufferAttribute(d.p, 3));
      geo.setAttribute("normal", new T.BufferAttribute(d.n, 3));
      geo.setAttribute("aRow", new T.BufferAttribute(d.r, 1));
      geo.setAttribute("aRow2", new T.BufferAttribute(d.r2, 1));
      geo.setAttribute("aUv", new T.BufferAttribute(d.uv, 2));
      geo.setAttribute("aPat", new T.BufferAttribute(d.t, 1));
      geo.setAttribute("aLv", new T.BufferAttribute(d.lv, 1));
      geo.setAttribute("aBone", new T.BufferAttribute(d.b, 1));
      geo.setAttribute("aPivot", new T.BufferAttribute(d.pv, 3));
      geo.computeBoundingSphere();
      const U = {
        ...this.uniforms,
        uPhase: { value: 0 },
        uAmp: { value: 0 },
        uHeadYaw: { value: 0 },
        uBreath: { value: 0 },
        uSit: { value: 0 },
        uWork: { value: 0 },
      };
      const mat = new T.ShaderMaterial({
        uniforms: U,
        vertexShader: FOLK_VS,
        fragmentShader: SOLID_FS,
        side: T.DoubleSide,
      });
      const mesh = new T.Mesh(geo, mat);
      mesh.matrixAutoUpdate = false;
      mesh.frustumCulled = false;
      this.scene.add(mesh);
      const person = {
        mesh,
        U,
        dir,
        F: frameAt(dir),
        face: 0,
        h: 0,
        look,
        phase: Math.random() * 6,
        walk: 0,
        seed: Math.random() * 100,
      };
      person.h = Math.max(-0.2, this.ground.height(dir[0], dir[1], dir[2], 1));
      return person;
    }
    faceToward(person, target) {
      person.face = bearingTo(person.dir, target);
    }
    placePerson(person, nowS) {
      // the model's front (+z) turns to its heading (clockwise from north); sitting lowers it onto
      // the seat; lying, it is laid on its back along the bed, feet at the foot
      const sit = person.sit || 0,
        k = person.look ? person.look.h / 1.7 : 1;
      this.placeMatrix(
        person.mesh,
        person.dir,
        person.F,
        person.h - sit * 0.36 * k + (person.lie ? 0.13 : 0),
        person.face + Math.PI,
      );
      if (person.lie)
        person.mesh.matrix.multiply(
          this._lieM ||
            (this._lieM = new this.T.Matrix4().makeRotationX(-Math.PI / 2)),
        );
      person.U.uBreath.value = Math.sin(
        nowS * (person.lie ? 0.9 : 1.6) + person.seed,
      );
      person.U.uPhase.value = person.phase;
      person.U.uAmp.value = person.walk;
      person.U.uSit.value = sit;
      person.U.uWork.value = person.working || 0;
    }

    // ---------- towns ----------
    buildTown(s) {
      const T = this.T,
        G = this.ground,
        R = this.R;
      const plan = townPlan(this.story, s);
      const st = plan.style;
      const F = frameAt(s.dir);
      const kit = this.styleKit(st),
        rows = kit.rows,
        style = kit.style;
      const mb = new MeshBuf();
      // the ground under each building (its turned footprint), above sea
      const seaAt = (x, z) => {
        const d = localTo(s.dir, F, x, z, R);
        return G.height(d[0], d[1], d[2], 1.5);
      };
      const heights = plan.buildings.map((b) => footLoHi(b, seaAt));
      const base = heights.length ? Math.min(...heights.map((h) => h[0])) : 0;
      const hAt = (x, z) => seaAt(x, z) - base;
      // what you bump into, in the town's own metres: posts and domes like a chunk's, and walls
      const col = [],
        boxes = [],
        steps = [],
        sills = [];
      const inner = {
        col,
        boxes,
        base,
        rooms: [],
        hearths: [],
        beds: [],
        doors: [],
        lights: [],
      };
      const homes = [];
      plan.buildings.forEach((b, i) => {
        const [lo, hi] = heights[i];
        if (hi < 0.3 && !st.stilts) return; // nobody builds on the open sea
        // (in the great city nobody builds on stilts but over water)
        const wet =
          lo < 0.8 ||
          (!plan.city && st.stilts > 0 && hash01(i, s.id, 5) < st.stilts);
        // (a house you can walk into, the tavern and the hall never stand on stilts: up there they are shut, and
        // whoever keeps them is out of reach. Over wet ground they stand on a stone footing, with steps up to the door)
        const keep = b.kind === "tavern" || b.kind === "civic";
        const bb = {
          ...b,
          base: Math.max(hi, 0.3) - base,
          sink: Math.max(hi, 0.3) - lo,
          stilts: wet && st.stilts > 0 && !keep,
        };
        const ins = this.houseAt(mb, bb, kit, inner);
        homes[i] = this.homeOf(bb, ins);
        if (ins.sill) {
          ins.sill.i = i;
          sills.push(ins.sill);
        }
      });
      // the great city: its wall, towers and gates, and its own pieces
      const cityCtx = plan.city
        ? {
            col,
            boxes,
            hAt,
            base,
            city: plan.city,
            K: this.cityRows(st, false, rows),
            old: false,
            v: { lights: inner.lights, plan },
          }
        : null;
      if (plan.city && this.cityWallsInto)
        this.cityWallsInto(mb, plan.city, hAt, cityCtx.K, {
          col,
          boxes,
          base,
          old: false,
          roofPat: style.roofPat,
        });
      // the market's stalls and the benches by crafters' doors
      for (const pr of plan.props || []) {
        const q0 = localTo(s.dir, F, pr.x, pr.z, R),
          y = G.height(q0[0], q0[1], q0[2], 1.5) - base;
        const cs = Math.cos(pr.rot),
          sn = Math.sin(pr.rot),
          T = (pp) => [
            pr.x + pp[0] * cs - pp[2] * sn,
            y + pp[1],
            pr.z + pp[0] * sn + pp[2] * cs,
          ];
        if (pr.t === "stall") {
          stallInto(
            mb,
            T,
            rows,
            [rows.banner, rows.cloth, rows.straw][pr.cloth % 3],
          );
          boxes.push({ x: pr.x, z: pr.z, hx: 1.0, hz: 0.45, cs, sn });
        } else if (pr.t === "workbench") {
          workbenchInto(mb, T, rows, pr.seed);
          boxes.push({ x: pr.x, z: pr.z, hx: 0.62, hz: 0.3, cs, sn });
        } else if (pr.t === "forge") {
          forgeInto(mb, T, rows);
          boxes.push({ x: pr.x, z: pr.z, hx: 1.2, hz: 0.42, cs, sn });
        } else if (pr.t === "rail") {
          railInto(mb, T, rows);
          boxes.push({ x: pr.x, z: pr.z, hx: 1.25, hz: 0.12, cs, sn });
        } else if (pr.t === "wrightbench") {
          wrightBenchInto(mb, T, rows, pr.seed);
          boxes.push({ x: pr.x, z: pr.z, hx: 0.66, hz: 0.32, cs, sn });
        } else if (pr.t === "lumber") {
          lumberInto(mb, T, rows, pr.seed);
          boxes.push({
            x: pr.x,
            z: pr.z,
            hx: 0.95,
            hz: 0.6,
            cs,
            sn,
            top: base + y + 0.62,
          });
        } else if (pr.t === "housesign") {
          houseSignInto(mb, T, rows);
          col.push(pr.x, pr.z, 0.1, base + y - 0.3, 1e9, 1);
        } else if (pr.t === "tavernsign") {
          // hung on the wall: from the tavern's floor, not the ground at the wall's foot
          const ti = pr.b ?? plan.tavern,
            tb = plan.buildings[ti],
            hb = heights[ti];
          const fy = hb ? Math.max(hb[1], 0.3) - base : y;
          hangSignInto(
            mb,
            (pp) => [
              pr.x + pp[0] * cs - pp[2] * sn,
              fy + pp[1],
              pr.z + pp[0] * sn + pp[2] * cs,
            ],
            rows,
            rows.banner,
          );
          void tb;
        } else if (plan.city && this.cityPropInto)
          this.cityPropInto(mb, pr, y, cityCtx, { x: pr.x, z: pr.z, cs, sn });
      }
      // the plaza's heart: a well, a fire or a standing stone
      const fh = G.height(s.dir[0], s.dir[1], s.dir[2], 1.5) - base;
      if (plan.feature === "fountain") {
        /* (the city's: one of its props) */
      } else if (plan.feature === "well")
        col.push(0, 0, 1.15, base + fh, 1e9, 1);
      else if (plan.feature === "fire") col.push(0, 0, 1.3, base + fh, 1e9, 1);
      else if (plan.feature === "tree")
        col.push(0, 0, 2.2, base + fh - 0.3, base + fh + 0.4, 2);
      else col.push(0, 0, 0.6, base + fh, 1e9, 1);
      if (plan.feature === "well") {
        mb.prism(
          [0, fh - 0.5, 0],
          [0, fh + 0.8, 0],
          1.1,
          1.1,
          8,
          rows.base,
          PAT.STONE,
        );
        mb.prism(
          [-0.9, fh + 0.8, 0],
          [-0.9, fh + 2.4, 0],
          0.08,
          0.08,
          4,
          rows.wood,
          PAT.BARK,
        );
        mb.prism(
          [0.9, fh + 0.8, 0],
          [0.9, fh + 2.4, 0],
          0.08,
          0.08,
          4,
          rows.wood,
          PAT.BARK,
        );
        mb.cone([0, fh + 2.3, 0], fh + 3.0, 1.4, 8, rows.roof, style.roofPat);
      } else if (plan.feature === "fire") {
        mb.prism(
          [0, fh - 0.3, 0],
          [0, fh + 0.35, 0],
          1.3,
          1.2,
          8,
          rows.base,
          PAT.STONE,
        );
        mb.cone([0, fh + 0.35, 0], fh + 1.2, 0.6, 6, rows.glow, PAT.GLOW, {
          row2: rows.glow,
        });
      } else if (plan.feature === "tree") {
        mb.prism(
          [0, fh - 0.3, 0],
          [0, fh + 0.4, 0],
          2.2,
          2.2,
          10,
          rows.base,
          PAT.STONE,
        );
      } else if (plan.feature !== "fountain")
        mb.prism(
          [0, fh - 0.5, 0],
          [0.2, fh + 3.2, 0.1],
          0.7,
          0.45,
          5,
          rows.base,
          PAT.STONE,
          null,
          0,
          true,
        );
      // after dark: lanterns at the street side and on the roads in, braziers on the square, the fire
      for (const L of plan.lights.concat(
        this.townRoadLamps ? this.townRoadLamps(s) : [],
      )) {
        if (L.kind === "fire") {
          inner.lights.push({ x: 0, y: fh + 0.7, z: 0, kind: "fire" });
          continue;
        }
        const q0 = localTo(s.dir, F, L.x, L.z, R),
          y = G.height(q0[0], q0[1], q0[2], 1.5) - base;
        // the fixture's frame: z out the way its arm points, x across (right-handed with y up)
        const ox = L.ox ?? 0,
          oz = L.oz ?? 1,
          ex = oz,
          ez = -ox;
        const q = lampInto(
          mb,
          L.kind,
          (pp) => [
            L.x + pp[0] * ex + pp[2] * ox,
            y + pp[1],
            L.z + pp[0] * ez + pp[2] * oz,
          ],
          rows,
        );
        inner.lights.push({ x: q[0], y: q[1], z: q[2], kind: L.kind });
        col.push(
          L.x,
          L.z,
          L.kind === "brazier" ? 0.42 : 0.12,
          base + y - 0.3,
          1e9,
          1,
        );
      }
      // where the ground falls away in front of a door, steps up to it (once everything else stands,
      // so they stop short of whatever is in front of it)
      // (folk go up a ladder from its foot: the way to and from the door goes by it)
      for (const sl of sills) {
        const way = this.doorSteps(mb, sl, hAt, boxes, rows, base, steps, col);
        if (way && way.kind === "ladder" && homes[sl.i])
          homes[sl.i].foot = way.foot;
      }
      this.syncRamps();
      const d = mb.finish();
      const geo = new T.BufferGeometry();
      geo.setAttribute("position", new T.BufferAttribute(d.p, 3));
      geo.setAttribute("normal", new T.BufferAttribute(d.n, 3));
      geo.setAttribute("aRow", new T.BufferAttribute(d.r, 1));
      geo.setAttribute("aRow2", new T.BufferAttribute(d.r2, 1));
      geo.setAttribute("aUv", new T.BufferAttribute(d.uv, 2));
      geo.setAttribute("aPat", new T.BufferAttribute(d.t, 1));
      geo.setAttribute("aLv", new T.BufferAttribute(d.lv, 1));
      geo.computeBoundingSphere();
      const mesh = new T.Mesh(geo, this.solidMat);
      mesh.matrixAutoUpdate = false;
      this.scene.add(mesh);
      const folk = plan.folk.map((f) => {
        const dir = localTo(s.dir, F, f.x, f.z, R);
        const person = this.makePerson(f.look, dir);
        person.face = f.face;
        person.wander = f.wander;
        person.home = dir;
        person.target = null;
        person.info = f;
        person.met = false;
        // the night watch walks a round; anyone with a lantern carries its light
        if (f.route) {
          person.route = f.route.map(([x, z]) => localTo(s.dir, F, x, z, R));
          person.ri = 0;
        }
        person.lamp = f.look.item === "lantern";
        return person;
      });
      const spots = inner.doors.map((d) => ({
        kind: "door",
        x: d.x,
        z: d.z,
        r: 0.7,
        dir: localTo(s.dir, F, d.x, d.z, R),
        alt: base + d.y,
        empty: !!d.empty,
        board: !!d.board,
      }));
      const tw = {
        s,
        mesh,
        F,
        base,
        folk,
        plan,
        col: new Float64Array(col),
        boxes,
        steps,
        rooms: inner.rooms,
        hearths: inner.hearths,
        spots,
        entries: inner.entries || [],
        lights: inner.lights,
      };
      for (const p of folk) p.host = tw;
      // a beast saddled at the tavern's rail, for hire
      const rail = (plan.props || []).find((q) => q.t === "rail");
      if (rail && this.tether) {
        const people = s.owner >= 0 ? this.story.peoples[s.owner] : null;
        const m = this.mountInfo(people, hashInt(s.id, 88, 3)),
          cs = Math.cos(rail.rot),
          sn = Math.sin(rail.rot);
        this.tether(
          tw,
          m,
          localTo(s.dir, F, rail.x - 1.15 * sn, rail.z + 1.15 * cs, R),
          Math.atan2(cs, -sn),
        );
        tw.mountInfo = m;
        const q0 = localTo(s.dir, F, rail.x, rail.z, R);
        spots.push({
          kind: "stable",
          x: rail.x,
          z: rail.z,
          r: 1.3,
          dir: q0,
          alt: G.height(q0[0], q0[1], q0[2], 1.5) + 0.9,
        });
      }
      // everyone's day: the streets, the square, the tavern, homes and work
      {
        const n = plan.streets.n,
          ang = [],
          u = [];
        for (let k = 0; k < n; k++) {
          const a = plan.streets.a0 + (k / n) * Math.PI * 2;
          ang.push(a);
          u.push([Math.cos(a), Math.sin(a)]);
        }
        const feat =
          { well: 1.15, fire: 1.3, tree: 2.2, fountain: CITY.fountain + 0.2 }[
            plan.feature
          ] || 0.6;
        const square = [];
        for (let k = 0; k < (plan.city ? 12 : 7); k++) {
          const a = (k / (plan.city ? 12 : 7)) * Math.PI * 2 + 0.3,
            r = feat + 1.35;
          square.push({
            x: Math.cos(a) * r,
            z: Math.sin(a) * r,
            face: Math.atan2(-Math.cos(a), Math.sin(a)),
          });
        }
        let tEdge = plan.plazaR + 12;
        for (const b of plan.buildings)
          tEdge = Math.max(
            tEdge,
            Math.hypot(b.x, b.z) + Math.max(b.w, b.d) * 0.6 + 12,
          );
        if (plan.city) {
          ang.length = 0;
          u.length = 0;
          for (const a of plan.city.ang) {
            ang.push(a);
            u.push([Math.cos(a), Math.sin(a)]);
          }
          tEdge = plan.city.out + 18;
        }
        this.setRoutines(tw, {
          town: true,
          homes,
          tavern: plan.tavern ?? -1,
          hall:
            plan.buildings[0] && plan.buildings[0].kind === "civic" ? 0 : -1,
          n,
          ang,
          u,
          plazaR: plan.plazaR,
          ring: plan.plazaR - 1.5,
          tEdge,
          feat,
          square,
          city: plan.city || null,
          temple: plan.city ? plan.city.temple : -1,
          streets: plan.city
            ? plan.buildings.map((b) => b.street || null)
            : null,
        });
      }
      return tw;
    }
    dropTown(tw) {
      if (this.dropTownDay) this.dropTownDay(tw);
      if (this.untether) this.untether(tw);
      this.scene.remove(tw.mesh);
      tw.mesh.geometry.dispose();
      for (const p of tw.folk) {
        this.scene.remove(p.mesh);
        p.mesh.geometry.dispose();
        p.mesh.material.dispose();
      }
    }

    // ---------- the loop ----------
    update(dtReal, nowMs, input) {
      if (!this.active) return;
      // underground, the world outside waits
      if (this.cave) return this.updateCave(dtReal, nowMs, input);
      this.frame++;
      if (this.updateKnolls) this.updateKnolls();
      const R = this.R,
        nowS = nowMs / 1000;
      // nights pass a little quicker than days, so the dark is felt but not waited out
      if (!this.journey)
        this.t +=
          (dtReal *
            (input.speed ?? 1) *
            (1 + 0.6 * (1 - this.uniforms.uDay.value))) /
          groundSecondsPerDay(this.planet.body.dayHours);
      // wake-up: lying down, then sitting up
      // (in the saddle of your own beast, your eyes are higher)
      let eyeH = this.riding ? this.riding.mm.eye : EYE,
        wakePitch = null;
      if (this.wake && this.wake.t0 > 0) {
        const k = Math.min(1, (nowMs - this.wake.t0) / 3200);
        const e = k * k * (3 - 2 * k);
        eyeH = 0.35 + (EYE - 0.35) * e;
        wakePitch = 1.2 * (1 - e) + this.pitch * e;
        if (k >= 1) this.wake = null;
      } else if (this.wake) {
        eyeH = 0.35;
        wakePitch = 1.2;
      }
      const F0 = frameAt(this.p),
        p0 = this.p;
      // what the body did this frame, for breath, warmth and bruises
      const ev = (this.events = {
        moving: false,
        running: false,
        swimming: false,
        jumped: false,
        impact: 0,
      });
      if (this.journey) this.stepJourney(dtReal, nowMs);
      else if (!this.wake && input.move && !this.frozen) {
        const { fwd, strafe, run } = input.move;
        const gh0 = this.ground.height(this.p[0], this.p[1], this.p[2], 1);
        const swim0 = gh0 < -0.9,
          wade0 = !swim0 && gh0 < -0.1;
        // wading slows you down (no running through water), swimming more so
        // (a bow drawn, you only creep)
        // (on a ladder you climb, hand over hand: slowly, and no running)
        const climbing = this.onLadder === this.frame - 1;
        // (about a metre a second up or down the rungs, however steep the ladder)
        // (on your own beast: a trot, or run and it gallops; it does the running, not you)
        const riding = this.riding;
        const sp = riding
          ? (run && !wade0
              ? Math.max(11, Math.min(16, (riding.m.plan.run || 12) * 1.15))
              : 6.5) *
            (wade0 ? 0.6 : 1) *
            (input.move.k || 1) *
            dtReal
          : (run && !wade0 && !this.drawing && !climbing ? RUN : WALK) *
            (swim0 ? 0.45 : wade0 ? 0.6 : 1) *
            (this.drawing ? 0.5 : 1) *
            (climbing ? this.ladderK || 0.1 : 1) *
            (input.move.k || 1) *
            dtReal;
        if (riding) riding.speed = 0;
        ev.wading = wade0;
        if (fwd || strafe) {
          const L = Math.max(1, Math.hypot(fwd, strafe));
          const sy = Math.sin(-this.yaw),
            cy = Math.cos(-this.yaw);
          const north = ((fwd * cy - strafe * sy) / L) * sp,
            east = ((fwd * sy + strafe * cy) / L) * sp;
          const was = this.p;
          this.p = stepOn(this.p, F0, east, north, R);
          // (a beast will not swim: at deep water it stops and will not go on)
          if (
            riding &&
            this.ground.height(this.p[0], this.p[1], this.p[2], 1) < -0.55
          )
            this.p = was;
          else if (riding) riding.speed = sp / Math.max(1e-4, dtReal);
          this.bob = (this.bob || 0) + sp * (riding ? 1.1 : 1.9);
          ev.moving = true;
          ev.running = !!run && !swim0 && !wade0 && !riding;
          ev.swimming = swim0;
        } else ev.swimming = swim0;
        if (input.jump && this.onGround && !swim0) {
          this.vy = 4.2 * (input.jumpK || 1);
          this.onGround = false;
          ev.jumped = true;
        }
        this.softFall = (input.jumpK || 1) > 1;
      }
      const under = this.journey
        ? -1e9
        : this.wake
          ? this.floorUnder
            ? this.floorUnder()
            : -1e9
          : this.collide(this.eyeY - eyeH);
      const gTerr = this.ground.height(this.p[0], this.p[1], this.p[2], 1),
        gh = Math.max(gTerr, under);
      const swim = gh < -0.9;
      const floor = swim ? 0.45 : Math.max(gh, -0.9) + eyeH;
      if (this.journey) {
        // the journey places the eye itself
      } else if (this.hover) {
        this.eyeY = this.hover;
        this.vy = 0; // for looking down from above (tests)
      } else if (this.wake) {
        this.eyeY = floor;
      } else {
        const g = 9.81 * (this.planet.body.gravity || 1);
        this.vy -= g * dtReal;
        this.eyeY += this.vy * dtReal;
        // (going down a hillside on foot, or on your beast, you keep to it, however steep, as you would going up it;
        // off a cliff's edge, or off a wall or a roof, you fall)
        if (
          this.onGround &&
          this.vy <= 0 &&
          this.eyeY > floor &&
          !swim &&
          gTerr >= under
        ) {
          const moved = arcM(p0, this.p, R);
          if (moved > 1e-4 && this.eyeY - floor <= moved * 4 + 0.06) {
            this.eyeY = floor;
            this.vy = 0;
          }
        }
        if (this.eyeY <= floor) {
          // a hard landing hurts (landing in water does not)
          // (light on your feet, it takes a longer fall to hurt you)
          const hard = this.softFall ? 13 : 9.5;
          if (this.vy < -hard && !swim) ev.impact = (-this.vy - hard) * 9;
          this.eyeY =
            this.eyeY < floor - 0.6
              ? floor
              : this.eyeY + (floor - this.eyeY) * Math.min(1, dtReal * 18);
          this.eyeY = Math.max(this.eyeY, floor - 0.02);
          this.vy = 0;
          this.onGround = true;
        } else if (this.eyeY > floor + 0.05) this.onGround = false;
      }
      // walked into the dark of a cave's mouth?
      if (!this.journey && !this.wake && !this.riding && this.checkCaveMouth) {
        this.checkCaveMouth();
        if (this.cave) return;
      }
      // a fade (into or out of somewhere) clears by itself when no journey drives it
      if (!this.journey && (this.fade || 0) > 0)
        this.fade = Math.max(0, this.fade - dtReal * 1.6);
      this.view = this.makeView();
      const { draw, want } = this.selectChunks();
      const inScene = new Set();
      for (const ch of draw) {
        this.placeMatrix(ch.mesh, ch.c, ch.F);
        inScene.add(ch.mesh);
        for (const m of [ch.water, ch.solids, ch.cards, ch.findMeshObj])
          if (m) {
            this.placeMatrix(m, ch.c, ch.F);
            inScene.add(m);
          }
      }
      for (const ch of this.chunks.values()) {
        for (const m of [
          ch.mesh,
          ch.water,
          ch.solids,
          ch.cards,
          ch.findMeshObj,
        ]) {
          if (!m) continue;
          const on = inScene.has(m);
          if (on && !m.parent) this.scene.add(m);
          else if (!on && m.parent) this.scene.remove(m);
        }
      }
      if (want.length) {
        want.sort((a, b) => a.pri - b.pri);
        const t0 = performance.now(),
          budget = this.journey ? 14 : 8;
        for (const w of want) {
          if (performance.now() - t0 > budget) break;
          const k = this.key(w.f, w.L, w.i, w.j);
          if (!this.chunks.has(k)) this.buildChunk(k, w.f, w.L, w.i, w.j);
        }
      }
      if (this.frame % 60 === 0) {
        for (const [k, ch] of this.chunks)
          if (ch.L > 0 && this.frame - ch.used > 240) {
            this.dropChunk(ch);
            this.chunks.delete(k);
          }
      }
      // towns near you
      if (this.frame % 15 === 1 || this.townsDirty) {
        this.townsDirty = false;
        for (const s of this.story.settlements) {
          const km = arcM(this.p, s.dir, R) / 1000;
          const have = this.towns.get(s.id);
          if (km < 30 && !have) this.towns.set(s.id, this.buildTown(s));
          else if (km > 40 && have) {
            this.dropTown(have);
            this.towns.delete(s.id);
          }
        }
      }
      for (const tw of this.towns.values()) {
        this.placeMatrix(tw.mesh, tw.s.dir, tw.F, tw.base);
        const near = arcM(this.p, tw.s.dir, R) < 1500;
        // what kind of day it is there (market, a wedding, a fire...), laid over it while you are near
        if (this.stepTownDay && (near || tw.dayV))
          this.stepTownDay(tw, dtReal, nowMs / 1000);
        if (near && tw.rtx) this.stepRoutines(tw, dtReal);
        for (const f of tw.folk) {
          f.mesh.visible = near && !f.hidden;
          if (!near || f.hidden) continue;
          if (!f.rt) this.updateFolk(f, dtReal);
          this.placePerson(f, nowS);
        }
      }
      this.stepSites(dtReal, nowS);
      if (this.stepFields) this.stepFields();
      if (this.stepTethered) this.stepTethered(dtReal, nowS);
      if (this.rideStep) this.rideStep(dtReal, nowS);
      if (this.riding) {
        // (carried off somewhere in a moment, up a tower or into the night: it stays where it stood)
        if (this.rideLastP && arcM(this.rideLastP, this.p, R) > 30) {
          const now = this.p;
          this.p = this.rideLastP;
          this.getDown("stay");
          this.p = now;
        } else if (this.rideFree) this.rideFree(dtReal, nowS);
      }
      this.rideLastP = this.riding ? this.p.slice() : null;
      if (this.syncLoose && this.frame % 30 === 7) this.syncLoose();
      if (this.stepFauna) this.stepFauna(dtReal, nowS);
      if (this.stepShip) this.stepShip(nowS);
      // what hunts, and what you loose at it (both wait while you are in your satchel, a menu or talking)
      // (a blow just landed: what you hit stops dead for a moment)
      if (this.hitStop > 0) this.hitStop -= dtReal;
      const live =
        (input.speed ?? 1) > 0 &&
        !input.hold &&
        !this.journey &&
        !(this.hitStop > 0);
      if (this.drawing && live) this.drawing.t += dtReal;
      if (this.stepHostiles && live) this.stepHostiles(dtReal, nowS);
      if (this.stepArrows && live) this.stepArrows(dtReal);
      if (this.stepLights) this.stepLights(dtReal, nowS);
      if (this.npc) {
        const n = this.npc;
        n.mesh.visible = true;
        if (n.leaving) this.walkAway(n, dtReal);
        if (this.npc === n) this.placePerson(n, nowS);
      }
      if (this.talkTo) {
        this.faceToward(this.talkTo, this.p);
        this.talkTo.walk = 0;
        this.talkTo.target = null;
      }
      const flick = 0.85 + 0.15 * Math.sin(nowS * 13.1) * Math.sin(nowS * 7.3),
        night = 1 - this.uniforms.uDay.value;
      const camp = this.stepPlaced(nowS);
      const hearth =
        this.frame % 4 === 0 || !this.lastHearth
          ? (this.lastHearth = this.hearthNear() || 0)
          : this.lastHearth;
      this.stepFalling(dtReal);
      this.stepGhost();
      if (this.fire && this.fire.visible) {
        this.placeMatrix(this.fire, this.fireDir, this.fireF, this.fireH);
        const e = this.fire.matrix.elements;
        this.uniforms.uFire.value.set(e[12], e[13] + 0.4, e[14], night * flick);
      } else if (this.heldTorch && !(hearth && hearth.inside)) {
        // the torch you carry: light just ahead of you
        const h = -this.yaw;
        this.uniforms.uFire.value.set(
          Math.sin(h) * 0.5 - Math.cos(h) * 0.35,
          this.eyeY + 0.2,
          -Math.cos(h) * 0.5 - Math.sin(h) * 0.35,
          night * flick * 0.85,
        );
      } else if (hearth && (hearth.inside || !camp)) {
        // indoors a hearth is the light, by day a little and by night a lot
        this.uniforms.uFire.value.set(
          hearth.X,
          hearth.Y,
          hearth.Z,
          (hearth.inside ? 0.4 + 0.4 * night : night * 0.8) * flick,
        );
      } else if (camp) {
        const e = camp.mesh.matrix.elements;
        this.uniforms.uFire.value.set(e[12], e[13] + 0.4, e[14], night * flick);
      } else this.uniforms.uFire.value.w = 0;
      // in the water: rings spreading out round you
      this.stepRipple(
        dtReal,
        nowS,
        !this.journey && (swim || gh < -0.1),
        ev.moving,
      );
      const hold = this.stepHeld(dtReal);
      const bob =
        !this.wake && (this.onGround || this.journey)
          ? Math.sin(this.bob || 0) * 0.045
          : 0;
      this.fadeMesh.visible = (this.fade || 0) > 0.001;
      this.fadeU.uFade.value = this.fade || 0;
      this.camera.position.set(
        hold.sway * Math.cos(this.yaw),
        this.eyeY + bob,
        -hold.sway * Math.sin(this.yaw),
      );
      this.camera.rotation.set(
        (wakePitch !== null ? wakePitch : this.pitch) + hold.dip,
        this.yaw,
        0,
      );
      this.camera.updateMatrixWorld();
      if (this.stepWeather) this.stepWeather(dtReal, nowMs);
      this.updateSky(nowMs);
      this.syncRamps();
      if (!input.skipRender) this.renderer.render(this.scene, this.camera);
    }

    // ---------- ripples: wading or swimming, rings spread out on the water round you ----------
    stepRipple(dt, nowS, inWater, moving) {
      const T = this.T;
      if (!this.ripple) {
        if (!inWater) return;
        const geo = new T.PlaneGeometry(3.4, 3.4);
        geo.rotateX(-Math.PI / 2);
        this.rippleU = {
          uTime: { value: 0 },
          uOn: { value: 0 },
          uCol: { value: new T.Vector3(0.8, 0.88, 0.92) },
        };
        this.ripple = new T.Mesh(
          geo,
          new T.ShaderMaterial({
            uniforms: this.rippleU,
            vertexShader: RIPPLE_VS,
            fragmentShader: RIPPLE_FS,
          }),
        );
        this.ripple.matrixAutoUpdate = false;
        this.ripple.frustumCulled = false;
        this.ripple.renderOrder = 2;
        this.scene.add(this.ripple);
      }
      const U = this.rippleU;
      U.uOn.value = Math.max(
        0,
        Math.min(1, U.uOn.value + dt * (inWater ? (moving ? 2.5 : -0.6) : -3)),
      );
      this.ripple.visible = U.uOn.value > 0.01;
      if (!this.ripple.visible) return;
      U.uTime.value = nowS;
      const day = this.uniforms.uDay.value,
        k = 0.3 + 0.7 * day;
      U.uCol.value.set(0.8 * k, 0.88 * k, 0.92 * k);
      this.placeMatrix(this.ripple, this.p, frameAt(this.p), 0.03);
    }

    // ---------- bumping into things ----------
    // Push the walker out of trunks, walls and people; say how high the rock under them is.
    // Posts stop you whatever your height. A dome (a rock) is a low step you walk onto, or a
    // boulder you can only stand on once you are above it (by jumping), else it stops you too.
    collide(feet) {
      // (on your own beast you are wider, and it does not climb ladders)
      const R = this.R,
        RAD = this.riding ? 0.55 : 0.3,
        STEP = 0.5,
        CLIMB = 0.75;
      let under = -1e9;
      const p = (this.p = this.p.slice());
      // push in a frame's own metres (x east, z south), then back onto the sphere
      const shove = (F, mx, mz) => {
        const v = [
          p[0] + (F.e[0] * mx - F.n[0] * mz) / R,
          p[1] + (F.e[1] * mx - F.n[1] * mz) / R,
          p[2] + (F.e[2] * mx - F.n[2] * mz) / R,
        ];
        const L = Math.hypot(v[0], v[1], v[2]);
        p[0] = v[0] / L;
        p[1] = v[1] / L;
        p[2] = v[2] / L;
      };
      const posts = (col, c, F, reach) => {
        const d0 = p[0] - c[0],
          d1 = p[1] - c[1],
          d2 = p[2] - c[2];
        const lx = (d0 * F.e[0] + d1 * F.e[1] + d2 * F.e[2]) * R,
          lz = -(d0 * F.n[0] + d1 * F.n[1] + d2 * F.n[2]) * R;
        if (Math.abs(lx) > reach || Math.abs(lz) > reach) return;
        let mx = 0,
          mz = 0,
          big = 0;
        for (let k = 0; k < col.length; k += 6) {
          const dx = lx + mx - col[k],
            dz = lz + mz - col[k + 1],
            r = col[k + 2];
          const far = r + RAD;
          const d2s = dx * dx + dz * dz;
          if (d2s >= far * far) continue;
          const dist = Math.sqrt(d2s) || 1e-4;
          if (col[k + 5] === 3) {
            // a flat-topped column (a tower): stand on it once you are up there
            const top = col[k + 4];
            if (feet >= top - 0.3) {
              if (dist < r) under = Math.max(under, top);
              continue;
            }
            mx += (dx / dist) * (far - dist);
            mz += (dz / dist) * (far - dist);
          } else if (col[k + 5] === 2) {
            const base = col[k + 3],
              top = col[k + 4],
              tall = top - base;
            const q = Math.min(1, dist / r),
              surf = base + tall * Math.sqrt(Math.max(0, 1 - q * q));
            if (tall <= STEP || feet >= surf - 0.1) {
              if (dist < r) under = Math.max(under, surf);
              continue;
            }
            const out = r * 0.86 + RAD;
            if (dist < out) {
              mx += (dx / dist) * (out - dist);
              mz += (dz / dist) * (out - dist);
            }
          } else {
            if (feet > col[k + 4]) continue;
            mx += (dx / dist) * (far - dist);
            mz += (dz / dist) * (far - dist);
            big = Math.max(big, r);
          }
        }
        // (what you walked into: a trunk or a post, or something as big as a house)
        if (mx || mz) {
          shove(F, mx, mz);
          this.bumpAt = {
            what: big > 0.9 ? "wall" : "post",
            frame: this.frame,
          };
        }
      };
      for (const ch of this.colChunks)
        posts(ch.col, ch.c, ch.F, ch.span * 0.75 + 2);
      // buttress roots: fins out from a trunk, tall against it and down into the ground at their ends. Where one is
      // low you step up onto it and over; where it is tall it stops you (unless you are up on it: then you walk it).
      let gAt = null;
      const roots = (sets, c, F) => {
        const d0 = p[0] - c[0],
          d1 = p[1] - c[1],
          d2 = p[2] - c[2];
        const lx = (d0 * F.e[0] + d1 * F.e[1] + d2 * F.e[2]) * R,
          lz = -(d0 * F.n[0] + d1 * F.n[1] + d2 * F.n[2]) * R;
        let mx = 0,
          mz = 0;
        for (const rs of sets) {
          if (
            Math.abs(lx - rs.x) > rs.R + RAD ||
            Math.abs(lz - rs.z) > rs.R + RAD
          )
            continue;
          for (const f of rs.fins) {
            const dx = lx + mx - rs.x,
              dz = lz + mz - rs.z;
            const fa = finAt(f, dx * f.ux + dz * f.uz, rs.s);
            if (!fa || fa.h < 0.12) continue;
            const ac = -dx * f.uz + dz * f.ux,
              aa = Math.abs(ac);
            if (aa >= fa.hw + RAD) continue;
            // its top here (it lies over the ground). A low one you step up onto; its tall part, against the trunk, is
            // too steep to walk up, though if you come down onto it from above, you stand on it
            if (gAt == null) gAt = this.ground.height(p[0], p[1], p[2], 1);
            const surf = gAt + rs.off + fa.h;
            if (
              feet >= surf - (fa.h > CLIMB ? 0.03 : 0.1) ||
              (fa.h <= CLIMB && surf - feet <= STEP)
            ) {
              if (aa < fa.hw) under = Math.max(under, surf);
              continue;
            }
            const push = (fa.hw + RAD - aa) * (ac < 0 ? -1 : 1);
            mx -= f.uz * push;
            mz += f.ux * push;
          }
        }
        if (mx || mz) {
          shove(F, mx, mz);
          gAt = null;
          this.bumpAt = { what: "post", frame: this.frame };
        }
      };
      for (const ch of this.colChunks)
        if (ch.roots) roots(ch.roots, ch.c, ch.F);
      // walls: boxes turned to face their street; a low wall (with a top) you can climb onto
      const walls = (boxes, c, F) => {
        for (const bx of boxes) {
          const d0 = p[0] - c[0],
            d1 = p[1] - c[1],
            d2 = p[2] - c[2];
          const lx = (d0 * F.e[0] + d1 * F.e[1] + d2 * F.e[2]) * R - bx.x,
            lz = -(d0 * F.n[0] + d1 * F.n[1] + d2 * F.n[2]) * R - bx.z;
          const u = lx * bx.cs + lz * bx.sn,
            w = -lx * bx.sn + lz * bx.cs;
          if (Math.abs(u) > bx.hx + RAD || Math.abs(w) > bx.hz + RAD) continue;
          if (bx.slope) {
            // a ramp or a ladder: the height along it; walked up from its foot, or down from its top
            // (a ladder you can always get onto from below, running at it or not: it slows you as you climb)
            const wc = Math.max(-bx.hz, Math.min(bx.hz, w)),
              surf = bx.ya + ((bx.yb - bx.ya) * (wc + bx.hz)) / (2 * bx.hz);
            const inside = Math.abs(u) <= bx.hx && Math.abs(w) <= bx.hz;
            // (anywhere at a ladder, you slow to a climb before you are on it; on a beast, it is a wall)
            if (bx.ladder && this.riding) {
              const pw = bx.hz + RAD - w;
              if (pw > 0) {
                shove(F, -pw * bx.sn, pw * bx.cs);
                this.bumpAt = { what: "wall", frame: this.frame };
              }
              continue;
            }
            if (bx.ladder) {
              this.onLadder = this.frame;
              this.ladderK = Math.max(
                0.03,
                Math.min(
                  0.4,
                  1.1 / (Math.abs(bx.ya - bx.yb) / (2 * bx.hz)) / WALK,
                ),
              );
            }
            if (
              feet >= surf - 0.12 ||
              surf - feet <= (bx.ladder ? 1.3 : STEP)
            ) {
              if (inside) under = Math.max(under, surf);
              continue;
            }
            // a ladder is gone up from its foot: from anywhere else it puts you back out at its foot
            if (bx.ladder) {
              const pw = bx.hz + RAD - w;
              if (pw > 0) {
                shove(F, -pw * bx.sn, pw * bx.cs);
                this.bumpAt = { what: "wall", frame: this.frame };
              }
              continue;
            }
          } else if (bx.top != null) {
            // a floor inside its walls holds you up however you came to be on it, and never pushes
            if (bx.lift) {
              if (Math.abs(u) <= bx.hx && Math.abs(w) <= bx.hz)
                under = Math.max(under, bx.top);
              continue;
            }
            if (feet >= bx.top - 0.1 || bx.top - feet <= STEP) {
              if (Math.abs(u) <= bx.hx && Math.abs(w) <= bx.hz)
                under = Math.max(under, bx.top);
              continue;
            }
            // (on a ladder, the landing at its top is not a wall to you: you come up over its edge)
            if (
              bx.deck &&
              this.onLadder != null &&
              this.onLadder >= this.frame - 1
            )
              continue;
          }
          const qu = Math.max(-bx.hx, Math.min(bx.hx, u)),
            qw = Math.max(-bx.hz, Math.min(bx.hz, w));
          let pu = 0,
            pw = 0;
          if (qu !== u || qw !== w) {
            const du = u - qu,
              dw = w - qw,
              dist = Math.hypot(du, dw);
            if (dist >= RAD) continue;
            pu = (du / dist) * (RAD - dist);
            pw = (dw / dist) * (RAD - dist);
          } else {
            // inside: out through the nearest wall
            const ou = bx.hx - Math.abs(u) + RAD,
              ow = bx.hz - Math.abs(w) + RAD;
            if (ou < ow) pu = Math.sign(u || 1) * ou;
            else pw = Math.sign(w || 1) * ow;
          }
          shove(F, pu * bx.cs - pw * bx.sn, pu * bx.sn + pw * bx.cs);
          this.bumpAt = { what: "wall", frame: this.frame };
        }
      };
      for (const tw of this.towns.values()) {
        if (arcM(p, tw.s.dir, R) > 400) continue;
        posts(tw.col, tw.s.dir, tw.F, 1e9);
        walls(tw.boxes, tw.s.dir, tw.F);
      }
      // the places between towns
      if (this.siteViews)
        for (const v of this.siteViews.values()) {
          if (arcM(p, v.site.dir, R) > v.reach) continue;
          if (v.col.length) posts(v.col, v.site.dir, v.F, 1e9);
          if (v.roots) roots(v.roots, v.site.dir, v.F);
          if (v.boxes.length) walls(v.boxes, v.site.dir, v.F);
          // rock you can stand on (over a cave's mouth)
          if (v.rocks) {
            const [lx, lz] = this.hostLocal(v, p);
            for (const rk of v.rocks) {
              const t = rk(lx, lz, feet - v.base);
              if (t != null) under = Math.max(under, v.base + t);
            }
          }
        }
      // what you built: a fire you walk around, the posts of a lean-to
      if (this.world)
        for (const pl of this.world.placed) {
          if (
            pl.kind !== "campfire" &&
            pl.kind !== "leanto" &&
            pl.kind !== "workstone"
          )
            continue;
          if (
            Math.abs(pl.dir[0] - p[0]) * R > 6 ||
            Math.abs(pl.dir[1] - p[1]) * R > 6 ||
            Math.abs(pl.dir[2] - p[2]) * R > 6
          )
            continue;
          const F = pl.F || (pl.F = frameAt(pl.dir));
          const cs = Math.cos(pl.yaw),
            sn = Math.sin(pl.yaw);
          const spots =
            pl.kind === "campfire"
              ? [[0, 0, 0.62]]
              : pl.kind === "workstone"
                ? [[0, 0, 0.62]]
                : [
                    [-1.3, 0, 0.12],
                    [1.3, 0, 0.12],
                  ];
          const col = [];
          // local x/z of the model to the frame's own east/south metres
          for (const [x, z, r] of spots)
            col.push(x * cs - z * sn, x * sn + z * cs, r, pl.alt, 1e9, 1);
          posts(col, pl.dir, F, 10);
        }
      // people keep their own space
      const F0 = frameAt(p);
      const person = (n, r = 0.28) => {
        if (!n || !n.mesh.visible) return;
        const d = [n.dir[0] - p[0], n.dir[1] - p[1], n.dir[2] - p[2]];
        const e = dot3(d, F0.e) * R,
          nn = dot3(d, F0.n) * R,
          dist = Math.hypot(e, nn),
          far = RAD + r;
        if (dist >= far || dist < 1e-4) return;
        const q = stepOn(
          p,
          F0,
          (-e / dist) * (far - dist),
          (-nn / dist) * (far - dist),
          R,
        );
        p[0] = q[0];
        p[1] = q[1];
        p[2] = q[2];
      };
      if (this.npc && !this.npc.leaving) person(this.npc);
      for (const tw of this.towns.values()) for (const f of tw.folk) person(f);
      if (this.siteViews)
        for (const v of this.siteViews.values())
          for (const f of v.folk) person(f);
      // and so do the animals, if you ever get that close
      if (this.herds)
        for (const hd of this.herds)
          for (const a of hd.animals)
            if (a.m < 8) person(a, hd.pr.rad * a.scale);
      if (this.hostiles)
        for (const gr of this.hostiles)
          for (const h of gr.members)
            if (h.m < 6 && h.fade > 0.5) person(h, gr.pr.rad * h.scale * 0.85);
      return under;
    }

    frameAtFor(d) {
      return frameAt(d);
    }
    inClearFor(q, x, z) {
      return inClear(q, x, z);
    }
    stepOnFor(p, F, e, n, R) {
      return stepOn(p, F, e, n, R);
    }
    // for tests: the nearest bumpable thing of a kind (tree, conifer, palm, rock, cactus, cap)
    nearestSolid(kind) {
      let best = null;
      for (const ch of this.colChunks)
        for (let k = 0, q = 0; k < ch.col.length; k += 6, q++) {
          if (kind && ch.colKind[q] !== kind) continue;
          const dir = stepOn(ch.c, ch.F, ch.col[k], -ch.col[k + 1], this.R);
          const m = arcM(this.p, dir, this.R);
          if (!best || m < best.m)
            best = {
              dir,
              m,
              r: ch.col[k + 2],
              base: ch.col[k + 3],
              top: ch.col[k + 4],
              kind: ch.colKind[q],
            };
        }
      return best;
    }

    // the traveller goes their own way, and is gone
    dismissTraveller() {
      const n = this.npc;
      if (!n || n.leaving) return;
      n.leaving = {
        dir: bearingTo(this.p, n.dir) + (Math.random() - 0.5) * 1.2,
        t: 0,
      };
    }
    walkAway(n, dt) {
      const L = n.leaving;
      L.t += dt;
      n.face = L.dir;
      const sp = 1.35 * dt;
      n.dir = stepOn(
        n.dir,
        frameAt(n.dir),
        Math.sin(L.dir) * sp,
        Math.cos(L.dir) * sp,
        this.R,
      );
      n.F = frameAt(n.dir);
      n.h = Math.max(-0.2, this.ground.height(n.dir[0], n.dir[1], n.dir[2], 1));
      n.phase += sp * 3.2;
      n.walk = 0.55;
      if (L.t > 40 && arcM(this.p, n.dir, this.R) > 45) {
        this.scene.remove(n.mesh);
        n.mesh.geometry.dispose();
        n.mesh.material.dispose();
        this.npc = null;
      }
    }
    // the person you could talk to: close, and roughly in front of you
    nearestPerson(maxM, maxDeg) {
      if (this.cave) return null;
      const heading = -this.yaw;
      let best = null;
      const consider = (person, town, site = null) => {
        if (
          !person ||
          !person.mesh.visible ||
          (person.leaving && person.leaving.t > 3)
        )
          return;
        const m = arcM(this.p, person.dir, this.R);
        if (m > maxM) return;
        let d = bearingTo(this.p, person.dir) - heading;
        d = Math.atan2(Math.sin(d), Math.cos(d));
        if ((Math.abs(d) * 180) / Math.PI > maxDeg && m > 1.2) return;
        // and only when looking at them, not at the sky or your feet
        const elev = Math.atan2(1.1 - EYE, Math.max(m, 0.3));
        if (Math.abs(this.pitch - elev) > 0.75) return;
        // the one you are looking at, more than the one nearest: in a crowd you talk to whoever is in front of you
        const ang = (Math.abs(d) * 180) / Math.PI,
          score = ang / maxDeg + (m / maxM) * 0.5;
        if (!best || score < best.score)
          best = { person, m, town, site, ang, score };
      };
      consider(this.npc, null);
      for (const tw of this.towns.values())
        for (const f of tw.folk) consider(f, tw);
      if (this.siteViews)
        for (const v of this.siteViews.values())
          for (const f of v.folk) consider(f, null, v);
      return best;
    }
    // folk mill about near home
    updateFolk(f, dt) {
      if (!f.wander || f === this.talkTo) return;
      if (!f.target) {
        f.walk = 0;
        f.wait = (f.wait || 0) - dt;
        if (f.wait > 0) return;
        if (f.route) {
          // the watch walks its round: the edge of the square, out along each street and back
          for (let tries = 0; tries < f.route.length && !f.target; tries++) {
            f.ri = ((f.ri ?? -1) + 1) % f.route.length;
            const q = f.route[f.ri];
            if (!f.host || this.folkPathClear(f.host, f.dir, q)) f.target = q;
          }
          if (!f.target) {
            f.wait = 2;
            return;
          }
        } else {
          // somewhere near home they can walk to without going through a wall
          const F = frameAt(f.home);
          for (let tries = 0; tries < 6 && !f.target; tries++) {
            const a = Math.random() * Math.PI * 2,
              r = 2 + Math.random() * 8;
            const q = stepOn(
              f.home,
              F,
              Math.cos(a) * r,
              Math.sin(a) * r,
              this.R,
            );
            if (!f.host || this.folkPathClear(f.host, f.dir, q)) f.target = q;
          }
          if (!f.target) {
            f.wait = 1.5 + Math.random() * 3;
            return;
          }
        }
      }
      const dist = arcM(f.dir, f.target, this.R);
      if (dist < 0.3) {
        f.target = null;
        f.wait = f.route
          ? Math.random() < 0.15
            ? 2.5 + Math.random() * 3
            : 0.2 + Math.random() * 0.7
          : 2 + Math.random() * 6;
        f.walk = 0;
        return;
      }
      f.face = bearingTo(f.dir, f.target);
      const sp = 1.1 * dt;
      f.dir = stepOn(
        f.dir,
        frameAt(f.dir),
        Math.sin(f.face) * sp,
        Math.cos(f.face) * sp,
        this.R,
      );
      f.F = frameAt(f.dir);
      f.h = Math.max(-0.2, this.ground.height(f.dir[0], f.dir[1], f.dir[2], 1));
      // indoors they stand on the floor, not the ground under it
      if (f.host) {
        const fl = this.floorAt(f.host, f.dir);
        if (fl != null) f.h = Math.max(f.h, fl);
      }
      f.phase += sp * 3.2;
      f.walk = 0.55;
    }

    updateSky(nowMs) {
      const V = this.view,
        F = V.F;
      const s = this.planet.sunInBody(this.t);
      const sun = [dot3(s, F.e), dot3(s, F.u), -dot3(s, F.n)];
      const U = this.uniforms;
      U.uSun.value.set(sun[0], sun[1], sun[2]);
      U.uTime.value = nowMs / 1000;
      // (a moon across the sun: the day goes dark)
      const day = smooth(-0.12, 0.1, sun[1]) * (1 - 0.9 * (this.eclipse || 0));
      U.uDay.value = day;
      U.uDark.value = sun[1] < -0.02 ? 1 : 0;
      // how late it is: 0 in the evening, 1 in the small hours (when nearly everyone is asleep),
      // a little less again before dawn when the early ones get up
      const lt = this.planet.localTime(this.p[0], this.p[1], this.p[2], this.t),
        tt = (((lt.hours / lt.dayHours - 0.79) % 1) + 1) % 1;
      U.uLate.value =
        tt < 0.5
          ? smooth(0.03, 0.3, tt) * (1 - 0.45 * smooth(0.38, 0.47, tt))
          : 0;
      // and for everyone's day: the hour as a part of the day (0 = midnight), and which day it is
      this.dayFrac = lt.hours / lt.dayHours;
      this.dayNum = Math.floor(this.t + 0.5 - this.dayFrac);
      const C = this.skyCols;
      const hor = mix3(C.nightHor, C.dayHor, day);
      const dusk = 1 - smooth(0, 0.3, Math.abs(sun[1] + 0.03));
      const fog0 = mix3(hor, C.dusk, dusk * 0.35);
      const vis = this.viewM();
      // (rain, snow and fog close in, and the air takes their colour)
      const air = this.weatherAir ? this.weatherAir(vis, fog0) : null,
        fog = air ? air.fog : fog0;
      U.uFog.value.set(fog[0], fog[1], fog[2]);
      U.uFogRange.value.set(air ? air.near : vis * 0.06, air ? air.far : vis);
      if (air) this.skyU.uSkyFog.value = air.skyFog;
      const S = this.skyU;
      S.uDayZen.value.set(...C.dayZen);
      S.uDayHor.value.set(...C.dayHor);
      S.uNightZen.value.set(...C.nightZen);
      S.uNightHor.value.set(...C.nightHor);
      S.uDusk.value.set(...C.dusk);
      const th = Math.tan((this.camera.fov * Math.PI) / 360);
      S.uTanHalf.value.set(th * this.camera.aspect, th);
      S.uCamRot.value.setFromMatrix4(this.camera.matrixWorld);
      S.uCamY.value = this.eyeY;
      // stars stay put in the sky of the universe while the planet turns
      const Bw = bodyToWorld(this.planet, this.t);
      const cols = [F.e, F.u, [-F.n[0], -F.n[1], -F.n[2]]].map((v) => [
        Bw[0] * v[0] + Bw[1] * v[1] + Bw[2] * v[2],
        Bw[3] * v[0] + Bw[4] * v[1] + Bw[5] * v[2],
        Bw[6] * v[0] + Bw[7] * v[1] + Bw[8] * v[2],
      ]);
      S.uStarRot.value.set(
        cols[0][0],
        cols[1][0],
        cols[2][0],
        cols[0][1],
        cols[1][1],
        cols[2][1],
        cols[0][2],
        cols[1][2],
        cols[2][2],
      );
      S.uPole.value.set(Bw[1], Bw[4], Bw[7]); // the spin axis never moves among the stars
      const pitch = this.camera.rotation.x;
      S.uLookUp.value = Math.max(0, Math.min(1, (pitch - 0.62) / 0.45));
      if (S.uLookUp.value > 0) {
        // where each quarter's letter hangs on the screen: about 54 degrees up in its quarter
        const EL = 0.95,
          ce = Math.cos(EL),
          se = Math.sin(EL);
        const tx = th * this.camera.aspect,
          W = this.W || 320,
          H = this.H || 240;
        S.uGlyphPx.value = Math.max(1, Math.round(Math.min(W, H) / 110));
        const q = this.quadV || (this.quadV = new this.T.Vector3());
        for (let k = 0; k < 4; k++) {
          const az = (k * Math.PI) / 2;
          q.set(ce * Math.sin(az), se, -ce * Math.cos(az)).transformDirection(
            this.camera.matrixWorldInverse,
          );
          const out = S.uQuad.value[k];
          if (q.z > -0.08) {
            out.z = 0;
            continue;
          }
          const x = ((q.x / -q.z / tx + 1) / 2) * W,
            y = ((q.y / -q.z / th + 1) / 2) * H;
          out.set(
            Math.round(x),
            Math.round(y),
            x > -20 && x < W + 20 && y > -20 && y < H + 20 ? 1 : 0,
          );
        }
      }
      if (Math.abs(this.t - this.cloudAt) > 0.004 || this.cloudMoved())
        this.refreshClouds();
      const cc = this.cloudCenter;
      const d = [cc[0] - this.p[0], cc[1] - this.p[1], cc[2] - this.p[2]];
      S.uCloudC.value.set(
        dot3(d, F.e) * this.R,
        -dot3(d, F.n) * this.R,
        160000,
      );
    }
    viewM() {
      return VIEW_M;
    }
    cloudMoved() {
      return (
        !this.cloudCenter || arcM(this.cloudCenter, this.p, this.R) > 30000
      );
    }
    refreshClouds() {
      const sky = this.planet.sky,
        L1 = this.planet.levels[1];
      const fr = sky.flowFrame("cloud", this.t);
      const F = frameAt(this.p),
        R = this.R,
        span = 160000;
      const d = this.cloudData;
      for (let y = 0; y < 64; y++)
        for (let x = 0; x < 64; x++) {
          const ex = ((x + 0.5) / 64 - 0.5) * span,
            sz = ((y + 0.5) / 64 - 0.5) * span;
          const dir = stepOn(this.p, F, ex, -sz, R);
          const dens = sky.density(fr, dir[0], dir[1], dir[2]);
          const cov = L1.grid.sample(L1.cover, dir[0], dir[1], dir[2]);
          const v = (dens - (1 - cov) - 0.03) * 3;
          d[y * 64 + x] = Math.max(
            0,
            Math.min(255, Math.round((v * 0.5 + 0.5) * 255)),
          );
        }
      this.cloudTex.needsUpdate = true;
      this.cloudAt = this.t;
      this.cloudCenter = this.p.slice();
    }

    // ---------- walking somewhere far: a few moments along the way ----------
    // You see the road in glimpses: walking by day, a fire at night, and then
    // the place you were going. Between them, a pixel dissolve while days pass.
    // the way to a town: join a road that leads there if one passes close, else go straight
    routeFor(dest) {
      const R = this.R,
        start = this.p;
      const straight = angleOf(start, dest.dir) * R;
      let best = null;
      if (this.roadNet)
        for (const rd of this.roadNet.roads) {
          if (rd.a !== dest.id && rd.b !== dest.id) continue;
          const pts = rd.a === dest.id ? rd.pts.slice().reverse() : rd.pts;
          let bi = -1,
            bd = Infinity;
          for (let k = 0; k < pts.length; k++) {
            const d = angleOf(start, pts[k]) * R;
            if (d < bd) {
              bd = d;
              bi = k;
            }
          }
          let rest = 0;
          for (let k = bi; k < pts.length - 1; k++)
            rest += angleOf(pts[k], pts[k + 1]) * R;
          if (
            bd < straight * 0.5 &&
            bd + rest < straight * 1.6 &&
            (!best || bd + rest < best.km)
          )
            best = { pts: [start.slice(), ...pts.slice(bi)], km: bd + rest };
        }
      const pts = best ? best.pts : [start.slice(), Array.from(dest.dir)];
      const cum = [0];
      for (let k = 0; k < pts.length - 1; k++)
        cum.push(cum[k] + angleOf(pts[k], pts[k + 1]) * R);
      return { pts, cum, total: cum[cum.length - 1], road: !!best };
    }
    // a point on a route, and which way the route runs there
    routeAt(rt, m) {
      const { pts, cum } = rt;
      let k = 0;
      while (k < cum.length - 2 && cum[k + 1] < m) k++;
      const seg = Math.max(1e-6, cum[k + 1] - cum[k]),
        t = Math.max(0, Math.min(1, (m - cum[k]) / seg));
      const p = norm3(slerpDir(pts[k], pts[k + 1], t));
      return { p, heading: bearingTo(p, pts[k + 1]) };
    }
    startJourney(dest, days, onDone, onStop, opts = {}) {
      if (this.riding) this.getDown("home");
      // (a long way can bring its own route: along the roads town to town, or over the sea)
      const rt = opts.route || this.routeFor(dest);
      const edge = opts.edge ?? Math.max(30, townRadius(dest) - 12);
      const endM = Math.max(0, rt.total - edge);
      const n = Math.max(1, Math.min(4, Math.round(days * 1.3 + 0.4)));
      const stops = [];
      // (at sea, every glimpse on the way is out on the water: the walk down to the ship and up from it are left out)
      const m0 =
          opts.sea && rt.seaFrom != null ? Math.min(endM, rt.seaFrom) : 0,
        m1 =
          opts.sea && rt.seaTo != null
            ? Math.max(m0, Math.min(endM, rt.seaTo))
            : endM;
      for (let k = 0; k < n; k++) {
        const q = (k + 0.55) / (n + 0.4);
        stops.push({ m: m0 + q * (m1 - m0), day: q });
      }
      stops.push({ m: endM, day: 1, last: true });
      this.journey = {
        rt,
        dest,
        days,
        t0: this.t,
        stops,
        i: -1,
        phase: "out",
        pt: 0,
        onDone,
        onStop,
        mount: opts.mount || null,
        sea: !!opts.sea,
      };
      // nothing follows you on the road
      if (this.clearHostiles) this.clearHostiles();
      this.drawing = null;
      if (opts.mount && this.rideBegin) this.rideBegin(this.journey);
    }
    stepJourney(dt) {
      const J = this.journey,
        FADE = 0.7;
      J.pt += dt;
      if (J.phase === "out") {
        this.fade = Math.min(1, J.pt / FADE);
        this.journeyWalk(dt);
        if (J.pt >= FADE) {
          J.phase = "jump";
          J.pt = 0;
          this.jumpTo(++J.i);
        }
      } else if (J.phase === "jump") {
        this.fade = 1;
        const done = this.warmStep(12);
        if ((done && J.pt > 0.35) || J.pt > 4) {
          J.phase = "in";
          J.pt = 0;
          if (J.onStop) J.onStop(J.stops[J.i], J.i);
        }
      } else if (J.phase === "in") {
        this.fade = 1 - Math.min(1, J.pt / FADE);
        this.journeyWalk(dt);
        if (J.pt >= FADE) {
          J.phase = "show";
          J.pt = 0;
        }
      } else {
        this.fade = 0;
        const st = J.stops[J.i];
        if (st.last) {
          this.journey = null;
          this.pitch = 0;
          if (this.fire) this.fire.visible = false;
          if (J.mm && this.rideEnd) this.rideEnd(J);
          if (J.onDone) J.onDone();
          return;
        }
        this.journeyWalk(dt);
        if (J.pt >= (st.camp ? 3.8 : 3.2)) {
          J.phase = "out";
          J.pt = 0;
        }
      }
    }
    jumpTo(i) {
      const J = this.journey,
        st = J.stops[i];
      let m = st.m,
        at = this.routeAt(J.rt, m);
      // never in the sea: slide along the way to dry land (on board a ship: never on the land, until you are ashore at the end)
      const afloat = J.sea && !st.last,
        wrong = (q) => {
          const gh = this.ground.height(q[0], q[1], q[2], 2);
          return afloat ? gh > -2 : gh < 0.6;
        };
      for (let k = 1; k < 14 && wrong(at.p); k++) {
        m = Math.max(
          0,
          Math.min(
            J.rt.total,
            st.m + (k % 2 ? 1 : -1) * Math.ceil(k / 2) * J.rt.total * 0.015,
          ),
        );
        at = this.routeAt(J.rt, m);
      }
      const p = at.p;
      this.p = p;
      this.t = J.t0 + J.days * st.day;
      const heading = st.last ? bearingTo(p, J.dest.dir) : at.heading;
      this.yaw = -heading;
      this.pitch = st.last ? 0.02 : J.mm && !st.camp ? -0.13 : -0.06;
      J.shipHeading = heading;
      // a night on the road is a night by the fire (at sea the ship sails on through it)
      const sun = this.planet.sunInBody(this.t);
      st.camp = !st.last && !J.sea && dot3(sun, p) < -0.04;
      const F = frameAt(p);
      const n = J.mount ? null : this.npc;
      if (n) {
        n.leaving = null;
        // (at the end of the way they stand off to one side, turned to you, to say goodbye; not at your shoulder)
        const off = st.camp ? 3.3 : st.last ? 3.0 : 2.1,
          side = st.camp ? 0 : st.last ? 0.8 : 0.5;
        n.dir = stepOn(
          p,
          F,
          Math.sin(heading + side) * off,
          Math.cos(heading + side) * off,
          this.R,
        );
        n.F = frameAt(n.dir);
        n.h = Math.max(
          -0.2,
          this.ground.height(n.dir[0], n.dir[1], n.dir[2], 1),
        );
        n.face = st.camp || st.last ? bearingTo(n.dir, p) : heading;
        n.walk = st.camp || st.last ? 0 : 0.55;
      }
      this.placeFire(
        st.camp
          ? stepOn(
              p,
              F,
              Math.sin(heading) * 1.7,
              Math.cos(heading) * 1.7,
              this.R,
            )
          : null,
      );
      this.eyeY = afloat
        ? SHIP_DECK + EYE
        : Math.max(-0.2, this.ground.height(p[0], p[1], p[2], 1)) +
          (st.camp ? 1.05 : J.mm && !st.last ? J.mm.eye : EYE);
      if (st.camp) this.pitch = -0.2;
      if (afloat) this.pitch = -0.1;
      // forget the places left behind
      for (const [k, ch] of this.chunks)
        if (ch.L > 2 && arcM(ch.c, p, this.R) > ch.span * 3 + 20000) {
          this.dropChunk(ch);
          this.chunks.delete(k);
        }
      this.cloudAt = -1e9;
      this.townsDirty = true;
      this.ready = false;
    }
    journeyWalk(dt) {
      const J = this.journey,
        st = J.stops[Math.max(0, J.i)];
      if (!st || st.camp || (J.i < 0 && J.phase !== "out")) return;
      // under sail: the ship carries you on, rising and falling
      if (J.sea && J.i >= 0 && !st.last) {
        const h = J.shipHeading ?? -this.yaw,
          sp = 5.5 * dt;
        this.p = stepOn(
          this.p,
          frameAt(this.p),
          Math.sin(h) * sp,
          Math.cos(h) * sp,
          this.R,
        );
        this.eyeY = SHIP_DECK + EYE + (J.swell || 0);
        this.t += dt * 0.004;
        return;
      }
      // on foot, or at a trot in the saddle, rising and falling with it
      const riding = !!(J.mm && J.i >= 0 && !st.last);
      const heading = -this.yaw,
        sp = (riding ? 3.4 : 1.3) * dt;
      this.p = stepOn(
        this.p,
        frameAt(this.p),
        Math.sin(heading) * sp,
        Math.cos(heading) * sp,
        this.R,
      );
      this.bob = (this.bob || 0) + sp * (riding ? 0 : 1.9);
      if (riding) J.mm.phase += (sp * 2.4) / J.mm.pr.H;
      this.eyeY =
        Math.max(-0.2, this.ground.height(this.p[0], this.p[1], this.p[2], 1)) +
        (riding ? J.mm.eye + Math.abs(Math.sin(J.mm.phase)) * 0.05 : EYE);
      this.t += dt * 0.004;
      const n = J.mount ? null : this.npc;
      if (n && !st.last) {
        n.dir = stepOn(
          n.dir,
          frameAt(n.dir),
          Math.sin(heading) * sp,
          Math.cos(heading) * sp,
          this.R,
        );
        n.F = frameAt(n.dir);
        n.h = Math.max(
          -0.2,
          this.ground.height(n.dir[0], n.dir[1], n.dir[2], 1),
        );
        n.face = heading;
        n.phase += sp * 3.2;
        n.walk = 0.55;
      } else if (n) n.walk = 0;
    }
    // a small fire: a ring of stones, a few logs, flames
    placeFire(dir) {
      const T = this.T;
      if (!this.fire) {
        const mb = new MeshBuf();
        const stone = this.row([120, 114, 120]),
          wood = this.row([110, 76, 48]),
          flame = this.row([255, 170, 70]);
        for (let k = 0; k < 9; k++) {
          const a = (k / 9) * Math.PI * 2;
          mb.box(
            Math.cos(a) * 0.55 - 0.12,
            -0.05,
            Math.sin(a) * 0.55 - 0.1,
            Math.cos(a) * 0.55 + 0.12,
            0.16,
            Math.sin(a) * 0.55 + 0.1,
            stone,
            PAT.ROCK,
          );
        }
        for (let k = 0; k < 3; k++) {
          const a = (k / 3) * Math.PI * 2 + 0.3;
          mb.prism(
            [Math.cos(a) * 0.45, 0.02, Math.sin(a) * 0.45],
            [-Math.cos(a) * 0.1, 0.22, -Math.sin(a) * 0.1],
            0.06,
            0.05,
            4,
            wood,
            PAT.BARK,
          );
        }
        for (let k = 0; k < 4; k++) {
          const a = k * 1.9,
            r = k ? 0.12 : 0;
          mb.cone(
            [Math.cos(a) * r, 0.04, Math.sin(a) * r],
            0.36 + (k ? 0.12 : 0.28) * (1 - k * 0.15),
            0.13 - k * 0.012,
            5,
            flame,
            23,
            null,
            0,
            0,
            a,
          );
        }
        this.syncRamps();
        const d = mb.finish();
        const geo = new T.BufferGeometry();
        for (const [nm, arr, k] of [
          ["position", d.p, 3],
          ["normal", d.n, 3],
          ["aRow", d.r, 1],
          ["aRow2", d.r2, 1],
          ["aUv", d.uv, 2],
          ["aPat", d.t, 1],
          ["aLv", d.lv, 1],
        ])
          geo.setAttribute(nm, new T.BufferAttribute(arr, k));
        geo.computeBoundingSphere();
        this.fire = new T.Mesh(geo, this.solidMat);
        this.fire.matrixAutoUpdate = false;
        this.fire.frustumCulled = false;
        this.scene.add(this.fire);
      }
      this.fire.visible = !!dir;
      if (dir) {
        this.fireDir = dir;
        this.fireF = frameAt(dir);
        this.fireH = this.ground.height(dir[0], dir[1], dir[2], 1);
      }
    }

    // ---------- facts for the HUD ----------
    hud() {
      const R = this.R;
      const heading = ((((-this.yaw * 180) / Math.PI) % 360) + 360) % 360;
      const out = { heading, t: this.t, p: this.p };
      if (this.town) {
        out.townM = arcM(this.p, this.town.dir, R);
        out.townBearing =
          ((bearingTo(this.p, this.town.dir) * 180) / Math.PI + 360) % 360;
      }
      if (this.npc) {
        out.npcM = arcM(this.p, this.npc.dir, R);
        out.npcBearing =
          ((bearingTo(this.p, this.npc.dir) * 180) / Math.PI + 360) % 360;
      }
      return out;
    }
    stats() {
      let tris = 0,
        draws = 0,
        cards = 0;
      this.scene.traverse((o) => {
        if (!o.isMesh || !o.visible || !o.geometry) return;
        draws++;
        const g = o.geometry;
        if (g.isInstancedBufferGeometry) {
          tris += g.instanceCount * 2;
          cards += g.instanceCount;
        } else
          tris += (g.index ? g.index.count : g.attributes.position.count) / 3;
      });
      return {
        chunks: this.chunks.size,
        draws,
        tris: Math.round(tris),
        cards,
        protos: this.protos ? this.protos.size : 0,
        rows: this.ramps ? this.ramps.count : 0,
        atlasMs: Math.round(this.atlasMs || 0),
      };
    }
  }

  // ---- game/items.js ----
  // ============================================================
  // ITEMS — what you can carry, make, eat, wear and put down. You learn what
  // can be made from things as you find them: your first flint shows you what
  // flint is good for. A few things only townsfolk can show you. Small things
  // you make anywhere; tools need a work stone, food and torches a fire.
  // ============================================================

  // where a thing is worn or held
