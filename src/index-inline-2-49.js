// index-inline-2 49 — math
// Lines 18205-19251 of readable/index-inline-2.pretty.js (statement-aligned).
  class GlobeRenderer {
    constructor() {
      this.style = "classic";
      this.yaw = 0;
      this.pitch = 0;
      this.W = 0;
      this.H = 0;
      this.P = 1;
      this.planet = null;
      this.cells = null;
      this.showClouds = true;
      this.showWind = false;
      this.showGrid = false;
      this.showPlates = false;
      this.marker = null;
      this._M = new Float64Array(9);
      this._bw = new Float64Array(9);
      this.particles = null;
      this._lastT = null;
    }

    setPlanet(p) {
      this.planet = p;
      this.cells = null;
      this.particles = null;
      this._lastT = null;
    }
    setStyle(s) {
      if (STYLES[s] && s !== this.style) {
        this.style = s;
        this.cells = null;
        this.layoutKey = null;
      }
    }

    // choose art resolution for the stage; returns canvas size in art pixels
    layout(cssW, cssH, dpr = 1) {
      const st = STYLES[this.style];
      const minCss = Math.max(80, Math.min(cssW, cssH));
      let P = (minCss * 0.84) / st.diameter;
      const Pdev = Math.max(1, Math.round(P * dpr));
      P = Pdev / dpr;
      const W = Math.max(32, Math.floor(cssW / P)),
        H = Math.max(32, Math.floor(cssH / P));
      let D = Math.floor(Math.min(W, H) * 0.84);
      D -= D & 1;
      const key = [W, H, D, this.style].join("x");
      this.P = P;
      if (key === this.layoutKey) return { W, H, P };
      this.layoutKey = key;
      this.W = W;
      this.H = H;
      this.D = D;
      this.cx = Math.floor(W / 2);
      this.cy = Math.floor(H / 2);
      this.R = D / 2;
      this.buf = new Uint32Array(W * H);
      this.image = null;
      // per-pixel scratch
      this.pMat = new Uint8Array(W * H);
      this.pLv = new Float32Array(W * H);
      this.pCloud = new Uint8Array(W * H);
      this.pDens = new Float32Array(W * H);
      this.pLand = new Uint8Array(W * H);
      this.pBand = new Int16Array(W * H);
      this.pCell = new Int32Array(W * H);
      this.pLs = new Float32Array(W * H);
      this.precomputeGeometry();
      this.buildStars();
      this.cells = null;
      return { W, H, P };
    }

    precomputeGeometry() {
      const { W, H, cx, cy, R } = this;
      const disk = [],
        rim = [];
      for (let y = 0; y < H; y++) {
        for (let x = 0; x < W; x++) {
          const nx = (x + 0.5 - cx) / R,
            ny = -(y + 0.5 - cy) / R;
          const r2 = nx * nx + ny * ny;
          const r = Math.sqrt(r2);
          if (r2 < 1) disk.push(x, y, nx, ny, Math.sqrt(1 - r2), (1 - r) * R);
          else if ((r - 1) * R < 4.5)
            rim.push(x, y, nx / r, ny / r, (r - 1) * R);
        }
      }
      const n = disk.length / 6;
      this.nDisk = n;
      this.dIdx = new Int32Array(n);
      this.dN = new Float32Array(n * 3);
      this.dBayer = new Float32Array(n);
      this.dEdge = new Float32Array(n);
      for (let k = 0; k < n; k++) {
        const x = disk[k * 6],
          y = disk[k * 6 + 1];
        this.dIdx[k] = y * W + x;
        this.dN[k * 3] = disk[k * 6 + 2];
        this.dN[k * 3 + 1] = disk[k * 6 + 3];
        this.dN[k * 3 + 2] = disk[k * 6 + 4];
        this.dBayer[k] = (BAYER4[(x & 3) + 4 * (y & 3)] + 0.5) / 16 - 0.5;
        this.dEdge[k] = disk[k * 6 + 5];
      }
      const m = rim.length / 5;
      this.nRim = m;
      this.rIdx = new Int32Array(m);
      this.rDir = new Float32Array(m * 2);
      this.rDist = new Float32Array(m);
      this.rBayer = new Float32Array(m);
      for (let k = 0; k < m; k++) {
        const x = rim[k * 5],
          y = rim[k * 5 + 1];
        this.rIdx[k] = y * W + x;
        this.rDir[k * 2] = rim[k * 5 + 2];
        this.rDir[k * 2 + 1] = rim[k * 5 + 3];
        this.rDist[k] = rim[k * 5 + 4];
        this.rBayer[k] = (BAYER4[(x & 3) + 4 * (y & 3)] + 0.5) / 16 - 0.5;
      }
      this.diskMask = new Uint8Array(W * H);
      for (let k = 0; k < n; k++) this.diskMask[this.dIdx[k]] = 1;
    }

    buildStars() {
      const { W, H } = this;
      const atmo = ATMO[(this.planet && this.planet.body.atmo) || "blue"];
      const bg = packHex(atmo.space);
      this.bgColor = bg;
      this.bg = new Uint32Array(W * H).fill(bg);
      const rnd = mulberry32(1234567 + W * 31 + H);
      const stars = [];
      const count = Math.floor(W * H * 0.0045);
      const cols = ["#3a3f66", "#6b6f99", "#b9bde0", "#fff4d8", "#cfe0ff"];
      for (let i = 0; i < count; i++) {
        const x = Math.floor(rnd() * W),
          y = Math.floor(rnd() * H);
        const b = rnd();
        const lvl = b < 0.55 ? 0 : b < 0.82 ? 1 : b < 0.95 ? 2 : 3;
        stars.push({ x, y, lvl, tw: rnd() < 0.18, ph: rnd() * 10 });
        this.bg[y * W + x] = packHex(cols[lvl]);
        if (
          lvl === 3 &&
          rnd() < 0.5 &&
          x > 0 &&
          y > 0 &&
          x < W - 1 &&
          y < H - 1
        ) {
          const c = packHex(cols[1]);
          this.bg[y * W + x - 1] = c;
          this.bg[y * W + x + 1] = c;
          this.bg[(y - 1) * W + x] = c;
          this.bg[(y + 1) * W + x] = c;
        }
      }
      this.stars = stars;
      this.starCols = cols.map(packHex);
      // atmosphere colours
      this.atmo = {
        lit: hexToRgb(atmo.lit),
        mid: hexToRgb(atmo.mid),
        dim: hexToRgb(atmo.dim),
      };
      this.atmoPk = {
        lit: packHex(atmo.lit),
        mid: packHex(atmo.mid),
        dim: packHex(atmo.dim),
      };
    }

    // choose the planet level whose cell size matches the art pixel size
    levelIndex() {
      const p = this.planet,
        D = this.D;
      let best = 0,
        bestErr = 1e9;
      p.levels.forEach((L, i) => {
        const err = Math.abs(Math.log2(L.N / (D * 0.95)));
        if (err < bestErr) {
          bestErr = err;
          best = i;
        }
      });
      return best;
    }

    // per-cell render materials for the current style (rebuilt when dials move)
    buildCells() {
      const p = this.planet;
      const li = this.levelIndex();
      const L = p.levels[li],
        g = L.grid,
        n = g.count,
        sea = p.dials.seaLevel;
      const mat = new Uint8Array(n),
        prm = new Float32Array(n);
      const atlas = this.style === "atlas";
      if (atlas && !this.atlas) this.atlas = buildAtlas();
      const A = this.atlas;
      for (let i = 0; i < n; i++) {
        const h = L.elev[i] - sea,
          bio = L.biome[i],
          land = h > 0;
        if (atlas) {
          let band;
          if (bio === B.ICE || bio === B.SEAICE) band = A.iceBand;
          else if (!land) {
            band = 0;
            while (band < A.waterCount - 1 && h > A.bands[band].to) band++;
          } else {
            band = A.waterCount;
            while (band < A.iceBand - 1 && h > A.bands[band].to) band++;
          }
          mat[i] = band;
          prm[i] = 0;
        } else if (!land) {
          mat[i] = 255;
          prm[i] = depthParam(-h);
        } else {
          mat[i] = 254; // land: biome picked per pixel with dithered thresholds
          prm[i] = 0.5 * smoothstep(200, 3500, h) - 0.12 + 0.35 * L.tex[i];
        }
      }
      // beaches: warm low coasts next to open water (a 1-cell sandy rim)
      if (!atlas && STYLES[this.style].beaches) {
        const S = g.S,
          c = g.canon;
        for (let q = 0; q < g.real.length; q++) {
          const i = g.real[q];
          if (!(L.elev[i] - sea > 0) || L.elev[i] - sea > 70) continue;
          const bio = L.biome[i];
          if (
            bio === B.ICE ||
            bio === B.ROCK ||
            bio === B.TUNDRA ||
            bio === B.TAIGA ||
            L.temp[i] < 12
          )
            continue;
          const nb = [c[i + 1], c[i - 1], c[i + S], c[i - S]];
          let water = 0;
          for (const j of nb)
            if (!(L.elev[j] - sea > 0) && L.biome[j] !== B.SEAICE) water++;
          if (water > 0 && hash01(i, 99) < 0.75) mat[i] = M.SAND;
        }
      }
      g.fillApron(prm);
      const cm = g.canon;
      for (let i = 0; i < n; i++) if (cm[i] !== i) mat[i] = mat[cm[i]];
      this.cells = { li, L, g, mat, prm, rev: p.revision, style: this.style };
      this.ramps = atlas ? A.ramp : buildRamps(this.style);
      if (atlas) {
        this.atlasLine = {
          land: packHex(ATLAS_LINE_LAND),
          sea: packHex(ATLAS_LINE_SEA),
          coast: packHex(ATLAS_COAST),
          grid: packHex(ATLAS_GRID),
        };
      }
    }

    // camera: world -> view = Rx(pitch) · Ry(yaw)
    viewMatrix(out = new Float64Array(9)) {
      const cy = Math.cos(this.yaw),
        sy = Math.sin(this.yaw),
        cp = Math.cos(this.pitch),
        sp = Math.sin(this.pitch);
      // Ry(yaw) = [cy 0 sy; 0 1 0; -sy 0 cy]; Rx(p) = [1 0 0; 0 cp -sp; 0 sp cp]
      out[0] = cy;
      out[1] = 0;
      out[2] = sy;
      out[3] = sp * sy;
      out[4] = cp;
      out[5] = -sp * cy;
      out[6] = -cp * sy;
      out[7] = sp;
      out[8] = cp * cy;
      return out;
    }

    // body -> view for planet time t
    bodyToView(tDays, out = this._M) {
      const V = this.viewMatrix(this._V || (this._V = new Float64Array(9)));
      const Bw = bodyToWorld(this.planet, tDays, this._bw);
      for (let r = 0; r < 3; r++)
        for (let c = 0; c < 3; c++) {
          out[r * 3 + c] =
            V[r * 3] * Bw[c] +
            V[r * 3 + 1] * Bw[3 + c] +
            V[r * 3 + 2] * Bw[6 + c];
        }
      return out;
    }

    sunView() {
      const V = this.viewMatrix(this._V2 || (this._V2 = new Float64Array(9)));
      const s = SUN_WORLD;
      return [
        V[0] * s[0] + V[1] * s[1] + V[2] * s[2],
        V[3] * s[0] + V[4] * s[1] + V[5] * s[2],
        V[6] * s[0] + V[7] * s[1] + V[8] * s[2],
      ];
    }

    // canvas art-pixel -> body direction (or null off the globe)
    pick(px, py, tDays) {
      const nx = (px - this.cx) / this.R,
        ny = -(py - this.cy) / this.R;
      const r2 = nx * nx + ny * ny;
      if (r2 >= 1) return null;
      const nz = Math.sqrt(1 - r2);
      const Mv = this.bodyToView(tDays, new Float64Array(9));
      // body = M^T · n
      return [
        Mv[0] * nx + Mv[3] * ny + Mv[6] * nz,
        Mv[1] * nx + Mv[4] * ny + Mv[7] * nz,
        Mv[2] * nx + Mv[5] * ny + Mv[8] * nz,
      ];
    }

    project(b, tDays) {
      const Mv = this.bodyToView(tDays, new Float64Array(9));
      const vx = Mv[0] * b[0] + Mv[1] * b[1] + Mv[2] * b[2];
      const vy = Mv[3] * b[0] + Mv[4] * b[1] + Mv[5] * b[2];
      const vz = Mv[6] * b[0] + Mv[7] * b[1] + Mv[8] * b[2];
      return {
        x: this.cx + vx * this.R,
        y: this.cy - vy * this.R,
        front: vz > 0,
      };
    }

    // world-space position of a body direction at time t
    worldPos(b, tDays) {
      const Bw = bodyToWorld(this.planet, tDays, new Float64Array(9));
      return [
        Bw[0] * b[0] + Bw[1] * b[1] + Bw[2] * b[2],
        Bw[3] * b[0] + Bw[4] * b[1] + Bw[5] * b[2],
        Bw[6] * b[0] + Bw[7] * b[1] + Bw[8] * b[2],
      ];
    }

    // how far ahead (in days, < 1) until a place faces a camera at yaw/pitch
    faceTime(b, t0, yaw, pitch) {
      const sy = this.yaw,
        sp = this.pitch;
      this.yaw = yaw;
      this.pitch = pitch;
      const Mv = new Float64Array(9);
      let best = 0,
        bestZ = -2;
      for (let k = 0; k < 720; k++) {
        const dt = k / 720;
        this.bodyToView(t0 + dt, Mv);
        const vz = Mv[6] * b[0] + Mv[7] * b[1] + Mv[8] * b[2];
        if (vz > bestZ) {
          bestZ = vz;
          best = dt;
        }
      }
      this.yaw = sy;
      this.pitch = sp;
      return best;
    }

    // turn the camera so a body direction faces the viewer at time t
    lookAt(b, tDays) {
      const Bw = bodyToWorld(this.planet, tDays, new Float64Array(9));
      const wx = Bw[0] * b[0] + Bw[1] * b[1] + Bw[2] * b[2];
      const wy = Bw[3] * b[0] + Bw[4] * b[1] + Bw[5] * b[2];
      const wz = Bw[6] * b[0] + Bw[7] * b[1] + Bw[8] * b[2];
      // want Rx(pitch)·Ry(yaw)·w = (0,0,1)
      const yaw = Math.atan2(-wx, wz);
      const h = Math.hypot(wx, wz);
      const pitch = Math.atan2(wy, h);
      return { yaw, pitch };
    }

    // ---------------------------------------------------------
    render(tDays, realSec) {
      const p = this.planet;
      if (!p || !this.buf) return;
      if (
        !this.cells ||
        this.cells.rev !== p.revision ||
        this.cells.style !== this.style
      )
        this.buildCells();
      const st = STYLES[this.style];
      const { W, buf, nDisk, dIdx, dN, dBayer, dEdge } = this;
      const { g, mat: cMat, prm: cPrm, L } = this.cells;
      const grad = L.grad;
      const ramps = this.ramps;
      const atlas = this.style === "atlas";
      buf.set(this.bg);
      this.twinkle(realSec);

      const Mv = this.bodyToView(tDays);
      const sunV = this.sunView();
      // sun in body space: M^T · sunV
      const sbx = Mv[0] * sunV[0] + Mv[3] * sunV[1] + Mv[6] * sunV[2];
      const sby = Mv[1] * sunV[0] + Mv[4] * sunV[1] + Mv[7] * sunV[2];
      const sbz = Mv[2] * sunV[0] + Mv[5] * sunV[1] + Mv[8] * sunV[2];
      // half vector for specular (viewer at +z)
      let hx = sunV[0],
        hy = sunV[1],
        hz = sunV[2] + 1;
      const hl = Math.hypot(hx, hy, hz);
      hx /= hl;
      hy /= hl;
      hz /= hl;

      const R_m = p.body.radiusKm * 1000;
      const reliefK = (st.relief * 13) / R_m;
      // (the player may want less of the half-tone: ditherK, 0..1)
      const dither = st.dither * (this.ditherK ?? 1);
      const showClouds = this.showClouds && (st.clouds || this.forceClouds);
      const sky = p.sky;
      const fr = showClouds ? sky.flowFrame("cloud", tDays) : null;
      const cover = L.cover;
      const sparkT = Math.floor(tDays * 160);
      const pMat = this.pMat,
        pLv = this.pLv,
        pCloud = this.pCloud,
        pLand = this.pLand,
        pCell = this.pCell,
        pLs = this.pLs,
        pDens = this.pDens;

      // ---- pass 1: sample the planet under every pixel ----
      const temp = L.temp,
        precip = L.precip,
        elev = L.elev,
        sea = p.dials.seaLevel;
      const tAmp = st.tAmp,
        pAmp = st.pAmp,
        wDither = st.waterDither * (this.ditherK ?? 1);
      const specPow = 22;
      for (let k = 0; k < nDisk; k++) {
        const nx = dN[k * 3],
          ny = dN[k * 3 + 1],
          nz = dN[k * 3 + 2];
        const bx = Mv[0] * nx + Mv[3] * ny + Mv[6] * nz;
        const by = Mv[1] * nx + Mv[4] * ny + Mv[7] * nz;
        const bz = Mv[2] * nx + Mv[5] * ny + Mv[8] * nz;
        const cell = g.locate(bx, by, bz);
        const pi = dIdx[k];
        pCell[pi] = cell;
        const Ls = nx * sunV[0] + ny * sunV[1] + nz * sunV[2];
        pLs[pi] = Ls;
        let m = cMat[cell];
        const bay = dBayer[k];
        let lv;
        if (atlas) {
          const land = m >= this.atlas.waterCount;
          pLand[pi] = land ? 1 : 0;
          const rel = land
            ? -reliefK *
              (grad[cell * 3] * sbx +
                grad[cell * 3 + 1] * sby +
                grad[cell * 3 + 2] * sbz)
            : 0;
          // atlas: soft global light, strong relief
          lv = 2.3 + (Ls - 0.3) * 0.8 + rel * 1.6;
          pMat[pi] = m;
        } else {
          const T = temp[cell] + bay * tAmp;
          if (m === 255) {
            pLand[pi] = 0;
            const depth = sea - elev[cell];
            if (T < -3) {
              m = M.SEAICE;
              lv = 1.1 + Ls * 3.3 + bay * dither;
            } else if (depth < 90 && T > 23) {
              m = M.REEF;
              lv = 1.0 + Ls * 3.3 + bay * dither;
            } else {
              // open water: dithered depth bands + sun glint
              const dp = cPrm[cell] + bay * wDither;
              m = M.ABYSS + (dp < 0 ? 0 : dp >= 4.999 ? 4 : dp | 0);
              let L2 = Ls;
              const nh = nx * hx + ny * hy + nz * hz;
              lv = 1.0 + L2 * 3.3 + bay * dither;
              if (nh > 0.6 && Ls > 0) {
                const spec = Math.pow(nh, specPow);
                const s2 = spec + bay * 0.3;
                if (s2 > 0.74) {
                  m = M.GLINT;
                } else if (s2 > 0.46) {
                  m = M.SHALLOW;
                  lv += 0.8;
                } else if (s2 > 0.2 && m < M.SLOPE) {
                  m = M.SLOPE;
                }
                if (spec > 0.1 && hash01(cell, sparkT) < 0.09 * spec)
                  m = M.GLINT;
              }
            }
          } else {
            pLand[pi] = 1;
            if (m === 254) {
              const P = precip[cell] * (1 + bay * pAmp);
              m = BIOME_MAT[classify(T, P, elev[cell] - sea, true, 0)];
            }
            const rel =
              -reliefK *
              (grad[cell * 3] * sbx +
                grad[cell * 3 + 1] * sby +
                grad[cell * 3 + 2] * sbz);
            lv =
              1.0 +
              (Ls + (Ls > -0.1 ? rel : 0)) * 3.3 +
              cPrm[cell] +
              bay * dither;
          }
          pMat[pi] = m;
        }
        pLv[pi] = lv;

        // clouds
        if (showClouds) {
          const d = sky.density(fr, bx, by, bz);
          const cv = cover[cell];
          const th = 1 - cv;
          pCloud[pi] = d > th + 0.06 ? 2 : d > th ? 1 : 0;
          pDens[pi] = d - th;
        } else pCloud[pi] = 0;
      }

      // ---- pass 2: resolve colours with screen-space neighbours ----
      const sdx = sunV[0] >= 0 ? 1 : -1,
        sdy = sunV[1] >= 0 ? -1 : 1; // screen step toward sun
      const toSun = sdy * W + sdx,
        away = -toSun;
      const shadowOff = 2 * away;
      const cloudBase = M.CLOUD * 5;
      const showGrid = this.showGrid;
      let gridStep = 0;
      if (showGrid) gridStep = (30 * Math.PI) / 180;
      const atl = this.atlasLine;
      for (let k = 0; k < nDisk; k++) {
        const pi = dIdx[k];
        const cl = pCloud[pi];
        const Ls = pLs[pi];
        let col;
        if (
          !atlas &&
          (cl === 2 ||
            (cl === 1 && Ls > 0.02 && (((pi % W) + ((pi / W) | 0)) & 1) === 0))
        ) {
          // cloud pixel
          let lv = 1.0 + Ls * 3.0 + dBayer[k] * dither * 0.8;
          if (cl === 2) {
            const e = (pDens[pi] - 0.1) * 7;
            lv += e < -0.6 ? -0.6 : e > 0.7 ? 0.7 : e;
          }
          if (cl === 2 && Ls > 0.08) {
            if (pCloud[pi + toSun] === 0)
              lv += 1.0; // sunlit rim
            else if (pCloud[pi + away] === 0 || pCloud[pi + away + away] === 0)
              lv -= 1.0; // underside
          } else lv -= 0.7;
          const l = lv < 0 ? 0 : lv > 4 ? 4 : lv | 0;
          col = ramps[cloudBase + l];
        } else {
          let lv = pLv[pi];
          const m = pMat[pi];
          if (!atlas && pCloud[pi + shadowOff] === 2 && Ls > 0) lv -= 1;
          if (atlas) {
            const l = lv < 1 ? 1 : lv > 3 ? 3 : lv | 0;
            col = ramps[m * 5 + l];
            // contour lines and coastlines between neighbouring pixels
            const mr = pMat[pi + 1],
              md = pMat[pi + W];
            const landHere = pLand[pi];
            if (this.diskMask[pi + 1] && this.diskMask[pi + W]) {
              if (landHere !== pLand[pi + 1] || landHere !== pLand[pi + W])
                col = atl.coast;
              else if (m !== mr || m !== md)
                col = landHere ? atl.land : atl.sea;
            }
            if (cl) {
              const t = cl === 2 ? 0.55 : 0.28;
              const r = col & 255,
                g2 = (col >> 8) & 255,
                b = (col >> 16) & 255;
              col = pack(
                (r + (255 - r) * t) | 0,
                (g2 + (255 - g2) * t) | 0,
                (b + (255 - b) * t) | 0,
              );
            }
          } else {
            const l = lv < 0 ? 0 : lv > 4 ? 4 : lv | 0;
            col = ramps[m * 5 + l];
            if (st.foam && pLand[pi] === 0 && m <= M.SHALLOW && Ls > -0.05) {
              if (
                pLand[pi + 1] |
                pLand[pi - 1] |
                pLand[pi + W] |
                pLand[pi - W]
              ) {
                col = ramps[M.SHALLOW * 5 + (l < 4 ? l + 1 : 4)];
              }
            }
          }
        }
        buf[pi] = col;
      }

      if (showGrid) this.drawGraticule(Mv);
      if (this.showPlates) this.drawPlates();
      this.drawVolcanoGlow(tDays, realSec, Mv);
      this.drawAtmosphere(sunV, st);
      if (this.showWind) this.drawWind(tDays, Mv);
      if (this.marker) this.drawMarker(tDays, realSec);
      if (this.fall) this.drawFall(tDays, realSec);
    }

    // ---------- travel: hyperspace between worlds ----------
    renderWarp(realSec, k) {
      const { W, H, buf } = this;
      if (!buf) return;
      buf.fill(this.bgColor);
      if (!this.warpStars) {
        const rnd = mulberry32(4242);
        this.warpStars = Array.from({ length: 260 }, () => ({
          x: rnd() * 2 - 1,
          y: rnd() * 2 - 1,
          z: rnd(),
        }));
        this.warpCols = ["#3a3f66", "#6b7bc4", "#b9c8ff", "#ffffff"].map(
          packHex,
        );
      }
      const dt = Math.min(
        0.05,
        Math.max(0, realSec - (this._warpT ?? realSec)),
      );
      this._warpT = realSec;
      const speed = 0.08 + 1.6 * k;
      const cx = W / 2,
        cy = H / 2,
        sc = Math.min(W, H) * 0.42;
      for (const s of this.warpStars) {
        s.z -= speed * dt;
        if (s.z <= 0.04) {
          s.x = Math.random() * 2 - 1;
          s.y = Math.random() * 2 - 1;
          s.z = 1;
        }
        const hx = cx + (s.x / s.z) * sc,
          hy = cy + (s.y / s.z) * sc;
        const tz = Math.min(1.2, s.z + 0.02 + 0.22 * k);
        const tx = cx + (s.x / tz) * sc,
          ty = cy + (s.y / tz) * sc;
        const b = s.z < 0.25 ? 3 : s.z < 0.5 ? 2 : s.z < 0.8 ? 1 : 0;
        this.line(
          tx,
          ty,
          hx,
          hy,
          this.warpCols[Math.max(0, b - 1)],
          this.warpCols[b],
        );
      }
    }

    // pixel line; the head pixel gets its own colour
    line(x0, y0, x1, y1, col, head) {
      const { W, H, buf } = this;
      x0 |= 0;
      y0 |= 0;
      x1 |= 0;
      y1 |= 0;
      const dx = Math.abs(x1 - x0),
        dy = -Math.abs(y1 - y0),
        sx = x0 < x1 ? 1 : -1,
        sy = y0 < y1 ? 1 : -1;
      let err = dx + dy,
        n = 0;
      for (;;) {
        if (x0 >= 0 && y0 >= 0 && x0 < W && y0 < H) buf[y0 * W + x0] = col;
        if ((x0 === x1 && y0 === y1) || n++ > 400) break;
        const e2 = 2 * err;
        if (e2 >= dy) {
          err += dy;
          x0 += sx;
        }
        if (e2 <= dx) {
          err += dx;
          y0 += sy;
        }
      }
      if (x1 >= 0 && y1 >= 0 && x1 < W && y1 < H) buf[y1 * W + x1] = head;
    }

    // ---------- embark: you fall like a star ----------
    drawFall(tDays, realSec) {
      const f = this.fall;
      if (!f) return;
      const k = (realSec - f.t0) / f.dur;
      const pr = this.project(f.dir, tDays);
      const ex = pr.x,
        ey = pr.y;
      const sx = ex - this.R * 1.1,
        sy = ey - this.R * 1.25;
      const hot = packHex("#fff6d6"),
        warm = packHex("#ffd257"),
        red = packHex("#ff7a3c");
      if (k < 1) {
        const e = k * k;
        const hx = sx + (ex - sx) * e,
          hy = sy + (ey - sy) * e;
        const tail = Math.max(0, e - 0.18);
        this.line(
          sx + (ex - sx) * tail,
          sy + (ey - sy) * tail,
          hx,
          hy,
          red,
          hot,
        );
        const t2 = Math.max(0, e - 0.07);
        this.line(sx + (ex - sx) * t2, sy + (ey - sy) * t2, hx, hy, warm, hot);
      } else if (k < 1.5 && pr.front) {
        // impact: a ring of light that spreads and fades
        const rr = (k - 1) * 2 * 7 + 1;
        for (let a = 0; a < 24; a++) {
          const px = Math.round(ex + Math.cos((a / 24) * 6.283) * rr),
            py = Math.round(ey + Math.sin((a / 24) * 6.283) * rr);
          if (
            px >= 0 &&
            py >= 0 &&
            px < this.W &&
            py < this.H &&
            this.diskMask[py * this.W + px]
          )
            this.buf[py * this.W + px] = k < 1.25 ? hot : warm;
        }
        const c = Math.floor(ey) * this.W + Math.floor(ex);
        if (this.diskMask[c]) this.buf[c] = hot;
      }
    }

    // plate boundaries, coloured by what they do
    drawPlates() {
      const { nDisk, dIdx, buf, pCell, pLs } = this;
      const codes = this.cells.L.pbound;
      if (!codes) return;
      const cols =
        this._plateCols ||
        (this._plateCols = [
          0,
          packHex("#ff5a3c"),
          packHex("#ffa03c"),
          packHex("#ffa03c"),
          packHex("#5ce1ff"),
          packHex("#c38cff"),
          packHex("#ffe066"),
        ]);
      const dim =
        this._plateDim ||
        (this._plateDim = [
          0,
          packHex("#8a2f22"),
          packHex("#8a5522"),
          packHex("#8a5522"),
          packHex("#2c7b8c"),
          packHex("#6a4a8c"),
          packHex("#8a7a34"),
        ]);
      for (let k = 0; k < nDisk; k++) {
        const pi = dIdx[k],
          c = codes[pCell[pi]];
        if (c) buf[pi] = pLs[pi] > -0.05 ? cols[c] : dim[c];
      }
    }

    // active volcanoes glow on the night side
    drawVolcanoGlow(tDays, realSec, Mv) {
      const vs = this.planet.volcanoes;
      if (!vs) return;
      const hot = packHex("#ffb347"),
        core = packHex("#ff5a2a");
      const sunV = this.sunView();
      for (let i = 0; i < vs.length; i++) {
        const v = vs[i];
        if (!v.active) continue;
        const b = v.dir;
        const vx = Mv[0] * b[0] + Mv[1] * b[1] + Mv[2] * b[2];
        const vy = Mv[3] * b[0] + Mv[4] * b[1] + Mv[5] * b[2];
        const vz = Mv[6] * b[0] + Mv[7] * b[1] + Mv[8] * b[2];
        if (vz < 0.08) continue;
        const Ls = vx * sunV[0] + vy * sunV[1] + vz * sunV[2];
        if (Ls > -0.04) continue;
        const x = Math.floor(this.cx + vx * this.R),
          y = Math.floor(this.cy - vy * this.R);
        const pi = y * this.W + x;
        if (!this.diskMask[pi]) continue;
        const flick = Math.sin(realSec * 5.3 + i * 1.7) > -0.2;
        this.buf[pi] = flick ? hot : core;
        if (v.kind === "hotspot" && flick && this.diskMask[pi + this.W])
          this.buf[pi + this.W] = core;
      }
    }

    // latitude/longitude lines every 30 degrees (atlas)
    drawGraticule(Mv) {
      const { nDisk, dIdx, dN, buf } = this;
      const step = Math.PI / 6;
      const pxAng = 1 / this.R;
      for (let k = 0; k < nDisk; k++) {
        const nx = dN[k * 3],
          ny = dN[k * 3 + 1],
          nz = dN[k * 3 + 2];
        if (nz < 0.12) continue;
        const bx = Mv[0] * nx + Mv[3] * ny + Mv[6] * nz;
        const by = Mv[1] * nx + Mv[4] * ny + Mv[7] * nz;
        const bz = Mv[2] * nx + Mv[5] * ny + Mv[8] * nz;
        const lat = Math.asin(by),
          lon = Math.atan2(bx, bz);
        const w = (pxAng * 0.55) / nz;
        const dl = Math.abs(lat - Math.round(lat / step) * step);
        const cl = Math.cos(lat);
        const dn = Math.abs(lon - Math.round(lon / step) * step) * cl;
        if (dl < w || (dn < w && Math.abs(lat) < 1.4)) {
          const pi = dIdx[k];
          if ((pi & 1) === 0) {
            const c = buf[pi];
            const r = c & 255,
              g2 = (c >> 8) & 255,
              b = (c >> 16) & 255;
            buf[pi] = pack(
              (r + (255 - r) * 0.38) | 0,
              (g2 + (250 - g2) * 0.38) | 0,
              (b + (235 - b) * 0.38) | 0,
            );
          }
        }
      }
    }

    drawAtmosphere(sunV, st) {
      const { buf, nDisk, dIdx, dN, dEdge, dBayer } = this;
      const lit = this.atmo.lit,
        mid = this.atmo.mid;
      const sx = sunV[0],
        sy = sunV[1];
      const sl = Math.hypot(sx, sy) || 1;
      // inner haze on the lit limb
      if (st.haze !== "none") {
        for (let k = 0; k < nDisk; k++) {
          const e = dEdge[k];
          if (e > 3.2) continue;
          const nx = dN[k * 3],
            ny = dN[k * 3 + 1],
            nz = dN[k * 3 + 2];
          const Ls = nx * sunV[0] + ny * sunV[1] + nz * sunV[2];
          const litK = smoothstep(-0.25, 0.35, Ls);
          if (litK <= 0) continue;
          const a = (1 - e / 3.2) * litK;
          if (a < 0.04) continue;
          const pi = dIdx[k];
          if (st.haze === "dither") {
            if (e < 1.1 && a > 0.55 + dBayer[k] * 0.6)
              buf[pi] = this.atmoPk.mid;
          } else {
            const t = Math.min(0.75, a * 0.85);
            const c = buf[pi];
            const r = c & 255,
              g2 = (c >> 8) & 255,
              b = (c >> 16) & 255;
            const tc = e < 1.3 ? lit : mid;
            buf[pi] = pack(
              Math.round(r + (tc[0] - r) * t),
              Math.round(g2 + (tc[1] - g2) * t),
              Math.round(b + (tc[2] - b) * t),
            );
          }
        }
      }
      // outer glow ring
      const { nRim, rIdx, rDir, rDist, rBayer } = this;
      for (let k = 0; k < nRim; k++) {
        const dx = rDir[k * 2],
          dy = rDir[k * 2 + 1],
          d = rDist[k];
        const facing = (dx * sx + dy * sy) / sl; // -1..1 toward sun on screen
        const litK = smoothstep(-0.55, 0.6, facing * 0.8 + sunV[2] * 0.4);
        if (litK < 0.06) continue;
        const width = (0.2 + 0.8 * litK) * st.rim;
        if (d > width) continue;
        const a = 1 - d / width;
        const pi = rIdx[k];
        if (st.haze === "none") {
          if (d < 1 && litK > 0.1) buf[pi] = this.atmoPk.dim;
          continue;
        }
        if (a > 0.62 + rBayer[k] * 0.5)
          buf[pi] = litK > 0.55 ? this.atmoPk.lit : this.atmoPk.mid;
        else if (a > 0.25 + rBayer[k] * 0.5) buf[pi] = this.atmoPk.dim;
      }
    }

    twinkle(realSec) {
      const { W, buf, stars, starCols, diskMask } = this;
      for (const s of stars) {
        if (!s.tw) continue;
        const v = Math.sin(realSec * 1.7 + s.ph * 6.28);
        const lvl = Math.max(
          0,
          Math.min(4, s.lvl + (v > 0.6 ? 1 : v < -0.6 ? -1 : 0)),
        );
        const pi = s.y * W + s.x;
        if (!diskMask[pi]) buf[pi] = starCols[lvl];
      }
    }

    drawMarker(tDays, realSec) {
      const pr = this.project(this.marker, tDays);
      if (!pr.front) return;
      const x = Math.floor(pr.x),
        y = Math.floor(pr.y);
      const on = Math.floor(realSec * 2.2) % 2 === 0;
      const hi = packHex("#ffd257"),
        lo = packHex("#1a1026"),
        pale = packHex("#fff3c4");
      const r = this.D > 120 ? 4 : 3;
      const set = (px, py, c) => {
        if (px >= 0 && py >= 0 && px < this.W && py < this.H)
          this.buf[py * this.W + px] = c;
      };
      const pts = [];
      for (const sx of [-1, 1])
        for (const sy of [-1, 1]) {
          pts.push(
            [sx * r, sy * r],
            [sx * (r - 1), sy * r],
            [sx * r, sy * (r - 1)],
          );
        }
      for (const [dx, dy] of pts) set(x + dx + 1, y + dy + 1, lo);
      for (const [dx, dy] of pts) set(x + dx, y + dy, on ? hi : pale);
      set(x + 1, y + 1, lo);
      set(x, y, on ? hi : pale);
    }

    // wind: tracer particles advected through the planet's own wind field
    drawWind(tDays, Mv) {
      const p = this.planet,
        sky = p.sky;
      const NP = Math.round(this.nDisk / 28) + 80;
      if (!this.particles || this.particles.n !== NP) {
        const rnd = mulberry32(99);
        const arr = new Float32Array(NP * 5);
        for (let i = 0; i < NP; i++) this.respawn(arr, i, rnd, true);
        this.particles = {
          n: NP,
          arr,
          rnd,
          hist: new Int32Array(NP * 6).fill(-1),
        };
      }
      const P = this.particles,
        arr = P.arr,
        hist = P.hist;
      let dt = this._lastT === null ? 0 : tDays - this._lastT;
      if (dt < 0 || dt > 0.05) dt = 0;
      this._lastT = tDays;
      const R = p.body.radiusKm * 1000;
      const k = ((p.body.dayHours * 3600) / R) * 40; // visual speed-up
      const cols = [packHex("#f4f7ff"), packHex("#b8c8ee"), packHex("#7d8fc4")];
      const { W, H, buf } = this;
      for (let i = 0; i < P.n; i++) {
        let x = arr[i * 5],
          y = arr[i * 5 + 1],
          z = arr[i * 5 + 2];
        if (dt > 0) {
          const w = sky.windAt(x, y, z);
          const cl = Math.max(0.05, Math.sqrt(1 - y * y));
          // east = (z, 0, -x)/cl ; north = (-y x/cl, cl, -y z/cl)
          const ex = z / cl,
            ez = -x / cl;
          const nx = (-y * x) / cl,
            ny = cl,
            nz = (-y * z) / cl;
          const s = k * dt;
          x += (w.u * ex + w.v * nx) * s;
          y += w.v * ny * s;
          z += (w.u * ez + w.v * nz) * s;
          const l = Math.hypot(x, y, z);
          x /= l;
          y /= l;
          z /= l;
          arr[i * 5] = x;
          arr[i * 5 + 1] = y;
          arr[i * 5 + 2] = z;
          arr[i * 5 + 3] += dt;
          if (arr[i * 5 + 3] > arr[i * 5 + 4]) {
            this.respawn(arr, i, P.rnd, false);
            for (let h = 0; h < 6; h++) hist[i * 6 + h] = -1;
            continue;
          }
        }
        const vx = Mv[0] * x + Mv[1] * y + Mv[2] * z;
        const vy = Mv[3] * x + Mv[4] * y + Mv[5] * z;
        const vz = Mv[6] * x + Mv[7] * y + Mv[8] * z;
        if (vz < 0.05) {
          for (let h = 0; h < 6; h++) hist[i * 6 + h] = -1;
          continue;
        }
        const px = Math.floor(this.cx + vx * this.R),
          py = Math.floor(this.cy - vy * this.R);
        if (px < 0 || py < 0 || px >= W || py >= H) continue;
        const pi = py * W + px;
        if (dt > 0 && hist[i * 6] !== pi) {
          for (let h = 5; h > 0; h--) hist[i * 6 + h] = hist[i * 6 + h - 1];
          hist[i * 6] = pi;
        }
        if (hist[i * 6] < 0) hist[i * 6] = pi;
        for (let h = 2; h >= 0; h--) {
          const q = hist[i * 6 + h];
          if (q >= 0 && this.diskMask[q]) buf[q] = cols[h];
        }
      }
    }

    respawn(arr, i, rnd, initial) {
      const u = rnd() * 2 - 1,
        th = rnd() * Math.PI * 2,
        r = Math.sqrt(1 - u * u);
      arr[i * 5] = r * Math.sin(th);
      arr[i * 5 + 1] = u;
      arr[i * 5 + 2] = r * Math.cos(th);
      arr[i * 5 + 4] = 0.06 + rnd() * 0.12;
      arr[i * 5 + 3] = initial ? rnd() * arr[i * 5 + 4] : 0;
    }
  }

  // ---- view/probe.js ----
  // ============================================================
  // SURFACE PROBE — a close-up camera. Samples the same planet below
  // grid resolution: coarse truth from the grid, fine detail from seeded
  // noise that respects it. (The descent in milestone 6 grows from this.)
  // ============================================================

