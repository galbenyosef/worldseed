// index-inline-2 15 — env
// Lines 4374-5679 of readable/index-inline-2.pretty.js (statement-aligned).
  class SiteIndex {
    constructor(planet, story, roads) {
      this.planet = planet;
      this.story = story;
      this.roads = roads;
      this.ground = planet.ground;
      this.R = planet.body.radiusKm * 1000;
      this.salt = subSeed(planet.seedKey, "sites");
      const q = (this.R * Math.PI) / 2;
      this.Ls = Math.max(4, Math.round(Math.log2(q / SMALL_M)));
      this.Lb = Math.max(3, Math.round(Math.log2(q / BIG_M)));
      this.spanS = q / 2 ** this.Ls;
      this.spanB = q / 2 ** this.Lb;
      // cells come in powers of two: hold the number of places per km² steady whatever their size
      this.pS = Math.min(0.95, P_SMALL * (this.spanS / SMALL_M) ** 2);
      this.pB = Math.min(0.95, P_BIG * (this.spanB / BIG_M) ** 2);
      this.cells = new Map();
      this.byId = new Map();
      this.ferries = new Map();
      this.volcanoes = story.places.filter((p) => p.kind === "volcano");
      this.L0 = planet.levels[0];
      this.buildRoadSites();
      this.buildHeartHermit();
      this.buildDeadCity();
    }

    // ---------- cells ----------
    cellOf(d, L) {
      cubeCoords(d[0], d[1], d[2], _scc);
      const n = 2 ** L,
        f = _scc[0];
      const s = Math.atan(_scc[1]) / SITE_QPI,
        t = Math.atan(_scc[2]) / SITE_QPI;
      return {
        f,
        i: Math.min(n - 1, Math.max(0, Math.floor(((s + 1) / 2) * n))),
        j: Math.min(n - 1, Math.max(0, Math.floor(((t + 1) / 2) * n))),
        L,
      };
    }
    // every cell that could hold something within radiusM (sampled, so face seams just work)
    cellsNear(d, radiusM, L, span) {
      const F = siteFrame(d),
        step = span * 0.5,
        k = Math.ceil((radiusM + span) / step);
      const out = new Map();
      for (let a = -k; a <= k; a++)
        for (let b = -k; b <= k; b++) {
          if (Math.hypot(a, b) * step > radiusM + span * 1.5) continue;
          const c = this.cellOf(
            a || b ? siteStep(d, F, a * step, b * step, this.R) : d,
            L,
          );
          out.set(c.f + ":" + c.i + ":" + c.j, c);
        }
      return [...out.values()];
    }
    cellSites(c, big) {
      const key = (big ? "b" : "s") + c.f + "." + c.i + "." + c.j;
      let list = this.cells.get(key);
      if (list) return list;
      list = big ? this.makeBig(c, key) : this.makeSmall(c, key);
      // (nothing else stands inside the walls of the city that fell, nor right under them)
      if (this.deadCity)
        list = list.filter(
          (q) => siteAng(q.dir, this.deadCity.dir) * this.R > (big ? 180 : 128),
        );
      if (big) {
        const r = this.roadBins.get(key);
        if (r) list = list.concat(r.map((x) => this.settle(x)).filter(Boolean));
      }
      // a ferry's landings: this side or the far side of the water, whichever cell it starts from
      if (big) list = list.concat(this.ferriesIn(c, key));
      this.cells.set(key, list);
      for (const s of list) this.byId.set(s.id, s);
      // forget cells far behind you (they come back the same)
      if (this.cells.size > 9000) {
        let n = 0;
        for (const [k, l] of this.cells) {
          if (n++ > 3000) break;
          this.cells.delete(k);
          for (const s of l) if (!s.keep) this.byId.delete(s.id);
        }
      }
      return list;
    }
    // places within radiusM of d, nearest first; each carries .m, its distance
    near(d, radiusM, which = "all") {
      const out = [],
        seen = new Set();
      const add = (s) => {
        if (seen.has(s.id)) return;
        seen.add(s.id);
        const m = siteAng(d, s.dir) * this.R;
        if (m <= radiusM) out.push(Object.assign(s, { m }));
      };
      if (which !== "small")
        for (const c of this.cellsNear(d, radiusM + 1500, this.Lb, this.spanB))
          for (const s of this.cellSites(c, true)) add(s);
      if (which !== "big")
        for (const c of this.cellsNear(d, radiusM + 150, this.Ls, this.spanS))
          for (const s of this.cellSites(c, false)) add(s);
      return out.sort((a, b) => a.m - b.m);
    }
    get(id) {
      if (this.byId.has(id)) {
        const s = this.byId.get(id);
        return s.pending || s.dead ? this.settle(s) : s;
      }
      // rebuild it from its cell
      const m = /^([sb])(\d)\.(\d+)\.(\d+)$/.exec(id);
      if (m) {
        this.cellSites({ f: +m[2], i: +m[3], j: +m[4] }, m[1] === "b");
        return this.byId.get(id) || null;
      }
      // a ferry landing: from the cell its crossing starts in
      const fm = /^f[ab](\d)\.(\d+)\.(\d+)$/.exec(id);
      if (fm) {
        const fe = this.ferryOf({
          f: +fm[1],
          i: +fm[2],
          j: +fm[3],
          L: this.Lb,
        });
        if (fe) {
          const q = this.cellOf(id[1] === "a" ? fe.a : fe.b, this.Lb);
          this.cellSites(q, true);
        }
        return this.byId.get(id) || null;
      }
      return null;
    }

    // ---------- what the ground is like at a spot ----------
    // (the bare ground: the knolls the view raises over caves are not reckoned with here)
    height(d) {
      return this.ground.height(d[0], d[1], d[2], 2, true);
    }
    envAt(d) {
      const S = {};
      this.ground.sample(d[0], d[1], d[2], 2, S, true);
      const F = siteFrame(d);
      let slope = 0;
      for (const [e, n] of [
        [9, 0],
        [-9, 0],
        [0, 9],
        [0, -9],
      ]) {
        const q = siteStep(d, F, e, n, this.R);
        slope = Math.max(slope, Math.abs(this.height(q) - S.h) / 9);
      }
      let town = null,
        tm = Infinity;
      for (const s of this.story.settlements) {
        const m = siteAng(d, s.dir) * this.R;
        if (m < tm) {
          tm = m;
          town = s;
        }
      }
      let vk = Infinity;
      for (const v of this.volcanoes)
        vk = Math.min(vk, (siteAng(d, v.dir) * this.R) / 1000);
      const coastKm = this.L0.grid.sample(this.L0.coast, d[0], d[1], d[2]);
      return {
        h: S.h,
        T: S.T,
        P: S.P,
        biome: S.biome,
        rough: S.rough,
        slope,
        town,
        townM: tm,
        volcanoKm: vk,
        coastKm,
        owner: this.ownerAt(d, town, tm),
      };
    }
    ownerAt(d, town, tm) {
      if (town && town.owner >= 0 && tm < 1300e3) return town.owner;
      let best = -1,
        bd = Infinity;
      for (const p of this.story.peoples) {
        const m = siteAng(d, p.home) * this.R;
        if (m < bd) {
          bd = m;
          best = p.id;
        }
      }
      return bd < 1500e3 ? best : -1;
    }
    // the nearest road's centre line (with its small bends) within maxM
    roadNear(d, maxM) {
      if (!this.roads) return null;
      const segs = roadSegsNear(this.roads, d, maxM / 1000);
      if (!segs.length) return null;
      const F = siteFrame(d),
        R = this.R;
      const loc = (v) => {
        const q = [v[0] - d[0], v[1] - d[1], v[2] - d[2]];
        return [siteDot(q, F.e) * R, -siteDot(q, F.n) * R];
      };
      let best = null;
      for (const sg of segs) {
        const A = loc(sg.a),
          Bq = loc(sg.b),
          dx = Bq[0] - A[0],
          dz = Bq[1] - A[1],
          len = Math.hypot(dx, dz) || 1,
          ux = dx / len,
          uz = dz / len;
        const t = -A[0] * ux - A[1] * uz,
          tc = Math.max(0, Math.min(len, t));
        const along = sg.along * 1000 + tc,
          bend = roadBend(this.roads.roads[sg.road], along, sg.road * 1.37);
        const cx = A[0] + ux * tc - uz * bend,
          cz = A[1] + uz * tc + ux * bend;
        const m = Math.hypot(cx, cz);
        if (m <= maxM && (!best || m < best.m))
          best = { m, cx, cz, ux, uz, along, road: sg.road, F };
      }
      return best;
    }
    // the steepest spot of hillside within rM of d (steep, not a cliff), and which way is downhill
    hillside(d, rM) {
      const F = siteFrame(d),
        R = this.R;
      let best = null;
      for (let k = 0; k < 30; k++) {
        const a = k * 2.399,
          m = rM * Math.sqrt((k + 0.5) / 30);
        const q = siteStep(d, F, Math.cos(a) * m, Math.sin(a) * m, R);
        if (this.height(q) < 3) continue;
        const Fq = siteFrame(q),
          e = 7;
        const hE = this.height(siteStep(q, Fq, e, 0, R)),
          hW = this.height(siteStep(q, Fq, -e, 0, R)),
          hN = this.height(siteStep(q, Fq, 0, e, R)),
          hS = this.height(siteStep(q, Fq, 0, -e, R));
        const gx = (hE - hW) / (2 * e),
          gn = (hN - hS) / (2 * e),
          sl = Math.hypot(gx, gn);
        if (sl > 0.2 && sl < 1.7 && (!best || sl > best.s))
          best = { p: q, s: sl, face: Math.atan2(-gx, -gn) };
      }
      return best;
    }
    // a local rise: walk uphill from d in shrinking steps
    climb(d, step, iters) {
      const R = this.R;
      let p = d,
        h = this.height(d);
      for (let s = step; s >= step / 8; s /= 2) {
        for (let it = 0; it < iters; it++) {
          const F = siteFrame(p);
          let bp = null,
            bh = h;
          for (let k = 0; k < 8; k++) {
            const a = (k / 8) * Math.PI * 2,
              q = siteStep(p, F, Math.cos(a) * s, Math.sin(a) * s, R),
              hq = this.height(q);
            if (hq > bh + 0.2) {
              bh = hq;
              bp = q;
            }
          }
          if (!bp) break;
          p = bp;
          h = bh;
        }
      }
      return { p, h };
    }
    // how far a spot stands above the ground around it (m)
    prominence(d, h, rM) {
      const F = siteFrame(d);
      let top = -Infinity;
      for (let k = 0; k < 8; k++) {
        const a = (k / 8) * Math.PI * 2;
        top = Math.max(
          top,
          this.height(
            siteStep(d, F, Math.cos(a) * rM, Math.sin(a) * rM, this.R),
          ),
        );
      }
      return h - top;
    }
    // flat and dry enough to build on, within r metres
    flat(d, r, maxDh) {
      const F = siteFrame(d);
      let lo = Infinity,
        hi = -Infinity;
      for (let k = 0; k < 9; k++) {
        const q = k
          ? siteStep(
              d,
              F,
              Math.cos(k * 0.785) * r,
              Math.sin(k * 0.785) * r,
              this.R,
            )
          : d;
        const h = this.height(q);
        lo = Math.min(lo, h);
        hi = Math.max(hi, h);
      }
      return lo > 1.2 && hi - lo < maxDh;
    }
    site(id, kind, d, env, extra = {}) {
      return {
        id,
        kind,
        dir: d,
        seed: (hashStr(id) ^ this.salt) >>> 0,
        owner: env.owner,
        biome: env.biome,
        T: env.T,
        h: env.h,
        rough: env.rough,
        coastKm: env.coastKm,
        townId: env.town ? env.town.id : -1,
        townM: env.townM,
        volcanoKm: env.volcanoKm,
        ...extra,
      };
    }

    // ---------- a small cell: one small thing, or nothing ----------
    makeSmall(c, key) {
      const rnd = mulberry32(
        hashInt(c.f * 7919 + c.i, c.j, this.salt ^ 0x5a17),
      );
      if (rnd() > this.pS) return [];
      const n = 2 ** this.Ls,
        size = 2 / n;
      let d = siteDir(
        c.f,
        -1 + (c.i + 0.1 + rnd() * 0.8) * size,
        -1 + (c.j + 0.1 + rnd() * 0.8) * size,
      );
      const r1 = rnd(),
        r2 = rnd();
      let env = this.envAt(d);
      if (env.h < 1.5 || env.townM < 420) return [];
      const road = this.roadNear(d, 260);
      const cold = env.T < 3,
        open = OPEN.has(env.biome),
        forest = FORESTS.has(env.biome),
        people = env.owner >= 0 || env.townM < 300e3;
      const steep = env.slope > 0.55;
      const hill =
        !steep &&
        env.rough > 0.08 &&
        r2 < 0.7 &&
        this.prominence(d, env.h, 90) > 3;
      const w = {
        cairn: 0.5 + env.rough * 2.4 + (hill ? 2.5 : 0) + (cold ? 0.7 : 0),
        stone: steep ? 0.4 : open ? 1.1 : 0.7,
        shrine: steep ? 0 : road ? 3.2 : people ? 0.3 : 0,
        camp: steep ? 0 : forest ? 0.8 : open ? 0.6 : 0.3,
        grave: steep ? 0 : (people ? 0.5 : 0.2) + (road ? 0.5 : 0),
        spring:
          steep || env.T < 1 || env.biome === B.DESERT
            ? 0
            : env.P > 600
              ? 0.9
              : env.P > 320
                ? 0.35
                : 0,
        stash: 0.35,
        bones: steep ? 0 : open ? 0.7 : 0.12,
      };
      if (env.biome === B.ICE) {
        w.shrine = w.camp = w.grave = w.spring = 0;
        w.bones *= 0.3;
      }
      const kind = sitePick(() => r1, w);
      if (!kind) return [];
      // shrines stand at the roadside; everything else keeps off the road
      if (kind === "shrine" && road) {
        const side = hashInt(c.i, c.j, 3) & 1 ? 1 : -1,
          off = 5.2 * side;
        d = siteStep(
          d,
          road.F,
          road.cx - road.uz * off,
          -(road.cz + road.ux * off),
          this.R,
        );
        env = this.envAt(d);
        if (env.h < 1.2) return [];
        return [
          this.site(key, kind, d, env, {
            road: road.road,
            face: Math.atan2(road.uz * side, road.ux * side),
          }),
        ];
      }
      if (road && road.m < 14) return [];
      if (kind === "cairn" && hill) {
        const top = this.climb(d, 30, 4);
        d = top.p;
        env = this.envAt(d);
      }
      return [this.site(key, kind, d, env)];
    }

    // ---------- a big cell: somewhere worth walking to, or nothing ----------
    // (what a cell always held, it still holds: the newer places only stand where there was nothing)
    makeBig(c, key) {
      const old = this.makeBigFirst(c, key);
      return old.length ? old : this.makeBigNew(c, key);
    }
    // the newer places, on dice of their own: by the sea a fishing hut above the beach or a lighthouse on
    // a headland; where the grain grows a windmill; in the hills a mine; and holy places of the people's faith
    makeBigNew(c, key) {
      const rnd = mulberry32(
        hashInt(c.f * 52711 + c.i, c.j, this.salt ^ 0x9e17),
      );
      const n = 2 ** this.Lb,
        size = 2 / n;
      const s0 = -1 + c.i * size,
        t0 = -1 + c.j * size;
      const at = () =>
        siteDir(
          c.f,
          s0 + (0.12 + rnd() * 0.76) * size,
          t0 + (0.12 + rnd() * 0.76) * size,
        );
      const inCell = (d) => {
        const q = this.cellOf(d, this.Lb);
        return q.f === c.f && q.i === c.i && q.j === c.j;
      };
      if (rnd() > 0.82) return [];
      let d = at(),
        env = this.envAt(d);
      for (
        let tries = 0;
        tries < 4 && (env.h < 2 || env.townM < 2500);
        tries++
      ) {
        d = at();
        env = this.envAt(d);
      }
      if (env.h < 2 || env.townM < 2500) return [];
      const people = env.owner >= 0 || env.townM < 300e3;
      if (!people || env.biome === B.ICE) return [];
      const road = this.roadNear(d, 3000),
        onRoad = road ? 1 : 0;
      const nearTown = env.townM < 90e3 ? 1 : env.townM < 260e3 ? 0.45 : 0.15;
      const fert = FERTILE[env.biome] || 0;
      const habitable =
        env.T > -4 && env.T < 32 && env.h < 2800 && env.biome !== B.ROCK;
      const shore = this.shoreOf(c, rnd);
      const head = shore ? this.headlandNear(shore) : null;
      const w = {
        fishhut: shore && shore.h < 7 && env.T > -10 ? 3 : 0,
        lighthouse: head ? 1.4 + 0.6 * nearTown : 0,
        mill:
          habitable && fert >= 0.4 && env.biome !== B.JUNGLE
            ? fert * (0.9 * nearTown + 0.9 * onRoad + 0.2)
            : 0,
        mine:
          env.rough > 0.16 && env.h > 15
            ? 0.4 + env.rough * 1.4 + (env.biome === B.ROCK ? 0.4 : 0)
            : 0,
        temple: env.T > -14 ? 0.3 + 0.5 * onRoad + 0.25 * nearTown : 0,
      };
      let kind = sitePick(rnd, w);
      if (!kind) return [];
      // by the sea: a hut above the beach, looking out over the water; a lighthouse on the headland
      if (kind === "fishhut" || kind === "lighthouse") {
        const q = kind === "fishhut" ? shore : head;
        if (!q || !inCell(q.p)) return [];
        const e2 = this.envAt(q.p);
        if (
          e2.h < 0.6 ||
          e2.townM < 2500 ||
          (kind === "fishhut" && !this.flat(q.p, 5, 2.6))
        )
          return [];
        return [
          this.site(key, kind, q.p, e2, {
            face: q.face,
            ...(road ? { roadM: road.m } : {}),
          }),
        ];
      }
      // a mine goes into the steepest bit of hillside, like a cave, with a level place before it
      if (kind === "mine") {
        const hs = this.hillside(d, 900);
        if (!hs || !inCell(hs.p)) return [];
        const e2 = this.envAt(hs.p);
        if (e2.h < 4 || e2.townM < 2500) return [];
        return [
          this.site(key, "mine", hs.p, e2, {
            face: hs.face,
            ...(road ? { roadM: road.m } : {}),
          }),
        ];
      }
      // a mill or a holy place on flat ground, off the road
      const need = { mill: [14, 3.5], temple: [12, 3] }[kind];
      let ok = this.flat(d, need[0], need[1]);
      for (let tries = 0; !ok && tries < 6; tries++) {
        const q = at();
        const e = this.envAt(q);
        if (e.h > 2 && e.townM > 2500 && this.flat(q, need[0], need[1])) {
          d = q;
          env = e;
          ok = true;
        }
      }
      if (!ok) return [];
      const keep = (SITE_CLEAR[kind] || 10) + 12,
        rd = this.roadNear(d, keep);
      if (rd) {
        const L = rd.m > 0.5 ? rd.m : 1,
          ax = rd.m > 0.5 ? -rd.cx / L : -rd.uz,
          az = rd.m > 0.5 ? -rd.cz / L : rd.ux;
        d = siteStep(d, rd.F, rd.cx + ax * keep, -(rd.cz + az * keep), this.R);
        env = this.envAt(d);
        if (env.h < 2 || this.roadNear(d, keep - 4)) return [];
      }
      // (a holy place, and a mill, look towards the road if there is one near)
      const r2 = this.roadNear(d, 400);
      const face =
        r2 && r2.m > 1
          ? Math.atan2(r2.cx / r2.m, -r2.cz / r2.m)
          : rnd() * Math.PI * 2;
      return [
        this.site(key, kind, d, env, {
          face,
          ...(road ? { roadM: road.m } : {}),
        }),
      ];
    }
    makeBigFirst(c, key) {
      const rnd = mulberry32(
        hashInt(c.f * 104729 + c.i, c.j, this.salt ^ 0xb16),
      );
      const n = 2 ** this.Lb,
        size = 2 / n;
      const s0 = -1 + c.i * size,
        t0 = -1 + c.j * size;
      const at = () =>
        siteDir(
          c.f,
          s0 + (0.12 + rnd() * 0.76) * size,
          t0 + (0.12 + rnd() * 0.76) * size,
        );
      const inCell = (d) => {
        const q = this.cellOf(d, this.Lb);
        return q.f === c.f && q.i === c.i && q.j === c.j;
      };
      const occupied = rnd() < this.pB;
      const r1 = rnd();
      let d = at();
      let env = this.envAt(d);
      // the high point of the cell, if it stands proud of the land around it
      if (env.h > 30 && env.rough > 0.22 && r1 < 0.8) {
        const top = this.climb(d, 400, 6);
        if (
          inCell(top.p) &&
          top.h > 40 &&
          this.prominence(top.p, top.h, 1400) > 55
        ) {
          const e2 = this.envAt(top.p);
          if (e2.townM > 3000) return [this.site(key, "peak", top.p, e2)];
        }
      }
      if (!occupied) return [];
      // a few tries at somewhere dry, away from towns
      for (
        let tries = 0;
        tries < 4 && (env.h < 2 || env.townM < 2500);
        tries++
      ) {
        d = at();
        env = this.envAt(d);
      }
      if (env.h < 2 || env.townM < 2500) return [];
      const road = this.roadNear(d, 3000);
      const people = env.owner >= 0 || env.townM < 300e3;
      const habitable =
        people &&
        env.T > -4 &&
        env.T < 32 &&
        env.h < 2800 &&
        env.biome !== B.ICE &&
        env.biome !== B.ROCK;
      const fert = FERTILE[env.biome] || 0;
      const nearTown = env.townM < 90e3 ? 1 : env.townM < 260e3 ? 0.45 : 0.15;
      const onRoad = road ? 1 : 0;
      const forest = FORESTS.has(env.biome),
        open = OPEN.has(env.biome);
      const w = {
        farm: habitable ? fert * (2.4 * nearTown + 1.3 * onRoad + 0.15) : 0,
        hamlet: habitable ? fert * (0.9 * nearTown + 0.7 * onRoad) : 0,
        hut: people && env.biome !== B.ICE ? 0.75 : 0,
        tents: people && open ? 0.6 : 0,
        ruin: env.biome === B.ICE ? 0.4 : 1.0,
        tower: 0.35 + env.rough * 1.0,
        circle:
          open || env.biome === B.TAIGA || env.biome === B.FOREST ? 0.7 : 0.2,
        barrow:
          env.biome === B.STEPPE ||
          env.biome === B.FOREST ||
          env.biome === B.TUNDRA ||
          env.biome === B.TAIGA
            ? 0.5
            : 0.1,
        hotspring:
          env.volcanoKm < 150
            ? 1.3
            : env.volcanoKm < 350
              ? 0.5
              : env.rough > 0.4
                ? 0.12
                : 0.02,
        bigtree:
          forest && env.T > -6 ? 0.55 : env.biome === B.SAVANNA ? 0.25 : 0,
        battlefield: 0.3 + (this.warNear(d) ? 1.1 : 0),
        // a cave wants a hillside to open in: the rougher the land, the likelier
        cave:
          env.h > 6 && env.biome !== B.ICE
            ? 0.95 + env.rough * 1.2 + (env.biome === B.ROCK ? 0.5 : 0)
            : 0,
      };
      if (env.biome === B.ICE) w.hotspring *= 0.5;
      // the wonders: rare, each where it makes sense, and on dice of their own (so where there is
      // no wonder, what stands there is what always stood there)
      const wonders = {
        skystone: env.biome === B.ICE ? 0.06 : 0.1,
        giantbones: open ? 0.15 : env.biome === B.ICE ? 0.03 : 0.05,
        geysers:
          env.volcanoKm < 200
            ? 0.55
            : env.volcanoKm < 450
              ? 0.14
              : env.rough > 0.45
                ? 0.04
                : 0.008,
        stonegrove:
          env.biome === B.DESERT || env.biome === B.COLDDESERT
            ? 0.22
            : open
              ? 0.1
              : env.biome === B.ICE
                ? 0
                : 0.025,
      };
      let wsum = 0;
      for (const k in wonders) wsum += wonders[k];
      const rw = mulberry32(hashInt(c.f * 31 + c.i, c.j, this.salt ^ 0x3a7));
      const rk = mulberry32(hashInt(c.i, c.j, c.f + 77));
      let kind = rw() < wsum * 0.12 ? sitePick(rw, wonders) : sitePick(rk, w);
      // and as far from everything as it gets, now and then, somebody odd lives on their own
      const rh = mulberry32(hashInt(c.f * 53 + c.i, c.j, this.salt ^ 0x4e3));
      if (
        env.townM > 50e3 &&
        env.T > -12 &&
        rh() < 0.009 &&
        !this.roadNear(d, 8000)
      )
        kind = "hermit";
      if (!kind) return [];
      // a cave opens in the steepest bit of hillside near here, looking down the slope; where the land
      // is flat, in an outcrop of rock standing out of it
      if (kind === "cave") {
        const hs = this.hillside(d, 900);
        if (hs && inCell(hs.p)) {
          const e2 = this.envAt(hs.p);
          if (e2.h >= 3 && e2.townM >= 1500)
            return [
              this.site(key, "cave", hs.p, e2, {
                face: hs.face,
                ...(road ? { roadM: road.m } : {}),
              }),
            ];
        }
        if (env.h < 3 || env.slope > 0.6) return [];
        return [
          this.site(key, "cave", d, env, {
            face: rk() * Math.PI * 2,
            ...(road ? { roadM: road.m } : {}),
          }),
        ];
      }
      // build on flat ground; towers look for a rise
      const need = {
        hermit: [8, 2.5],
        farm: [26, 5],
        hamlet: [30, 6],
        hut: [9, 2.2],
        tents: [12, 2.5],
        ruin: [13, 4],
        circle: [11, 2.2],
        barrow: [9, 3],
        hotspring: [10, 2.5],
        bigtree: [6, 2.5],
        battlefield: [22, 5],
        skystone: [12, 3.5],
        giantbones: [18, 5],
        geysers: [14, 3.5],
        stonegrove: [14, 4.5],
      }[kind];
      if (kind === "tower") {
        const top = this.climb(d, 160, 5);
        if (inCell(top.p)) {
          d = top.p;
          env = this.envAt(d);
        }
      } else if (need) {
        let ok = this.flat(d, need[0], need[1]);
        for (let tries = 0; !ok && tries < 6; tries++) {
          const q = at();
          const e = this.envAt(q);
          if (e.h > 2 && e.townM > 2500 && this.flat(q, need[0], need[1])) {
            d = q;
            env = e;
            ok = true;
          }
        }
        // too steep to build on: now and then a watchtower stands there instead
        if (!ok) {
          kind = env.h > 2 && env.slope < 0.9 && rk() < 0.3 ? "tower" : null;
          if (!kind) return [];
        }
      }
      if (env.h < 2) return [];
      // keep houses and stones off the road itself: step back from it
      const keep = (SITE_CLEAR[kind] || 10) + 12;
      const rd = this.roadNear(d, keep);
      if (rd) {
        const L = rd.m > 0.5 ? rd.m : 1,
          ax = rd.m > 0.5 ? -rd.cx / L : -rd.uz,
          az = rd.m > 0.5 ? -rd.cz / L : rd.ux;
        const x = rd.cx + ax * keep,
          z = rd.cz + az * keep;
        d = siteStep(d, rd.F, x, -z, this.R);
        env = this.envAt(d);
        if (env.h < 2 || this.roadNear(d, keep - 4)) return [];
      }
      return [this.site(key, kind, d, env, road ? { roadM: road.m } : {})];
    }
    // did the story's war (or its dead) happen near here?
    warNear(d) {
      const arc = this.story.arc;
      if (
        !arc ||
        !["sundered", "siege", "haunted"].includes(arc.kind) ||
        !arc.where ||
        !arc.where.dir
      )
        return false;
      return siteAng(d, arc.where.dir) * this.R < 900e3;
    }

    // ---------- along the roads: inns about a day apart, signposts between ----------
    // Where they go along each road is decided up front (cheap); exactly where each one
    // stands, and what the ground is like there, only when you first come near it.
    buildRoadSites() {
      this.roadBins = new Map();
      this.roadList = [];
      this.roadCum = [];
      const net = this.roads;
      if (!net) return;
      const R = this.R;
      net.roads.forEach((rd, ri) => {
        const cum = [0];
        for (let k = 0; k < rd.pts.length - 1; k++)
          cum.push(cum[k] + (siteAng(rd.pts[k], rd.pts[k + 1]) * R) / 1000);
        this.roadCum[ri] = cum;
        const total = cum[cum.length - 1];
        const rnd = mulberry32(hashInt(ri, 911, this.salt));
        const inns = [];
        for (
          let km = INN_KM * (0.55 + rnd() * 0.4);
          km < total - 8;
          km += INN_KM * (0.8 + rnd() * 0.4)
        ) {
          const s = {
            id: "i" + ri + "." + inns.length,
            kind: "inn",
            road: ri,
            km,
            side: rnd() < 0.5 ? -1 : 1,
            pending: true,
          };
          s.dir = this.roadPoint(ri, km, 0).dir;
          inns.push(s);
          this.binRoadSite(s);
        }
        rd.inns = inns;
        // a watch post on the road, a couple of days apart (never by an inn, nor close to a town)
        let wk = 0;
        for (
          let km = WATCH_KM * (0.6 + rnd() * 0.3);
          km < total - 10;
          km += WATCH_KM * (0.85 + rnd() * 0.3)
        ) {
          if (km < 8 || inns.some((s) => Math.abs(s.km - km) < 4)) continue;
          const s = {
            id: "w" + ri + "." + wk++,
            kind: "watch",
            road: ri,
            km,
            side: rnd() < 0.5 ? -1 : 1,
            pending: true,
          };
          s.dir = this.roadPoint(ri, km, 0).dir;
          this.binRoadSite(s);
        }
        let k = 0;
        for (
          let km = SIGN_KM * (0.4 + rnd() * 0.5);
          km < total - 2;
          km += SIGN_KM * (0.75 + rnd() * 0.5), k++
        ) {
          if (inns.some((s) => Math.abs(s.km - km) < 1.5)) continue;
          const s = {
            id: "p" + ri + "." + k,
            kind: "sign",
            road: ri,
            km,
            side: rnd() < 0.5 ? -1 : 1,
            pending: true,
          };
          s.dir = this.roadPoint(ri, km, 0).dir;
          this.binRoadSite(s);
        }
      });
    }
    binRoadSite(s) {
      const c = this.cellOf(s.dir, this.Lb),
        key = "b" + c.f + "." + c.i + "." + c.j;
      if (!this.roadBins.has(key)) this.roadBins.set(key, []);
      this.roadBins.get(key).push(s);
      s.keep = true;
      this.byId.set(s.id, s);
      this.roadList.push(s);
    }
    // a point on a road's centre line pushed sideways by `side` metres, and which way the road runs there
    roadPoint(ri, km, side) {
      const rd = this.roads.roads[ri],
        cum = this.roadCum[ri],
        R = this.R;
      let lo = 0,
        hi = cum.length - 2;
      while (lo < hi) {
        const mid = (lo + hi + 1) >> 1;
        if (cum[mid] <= km) lo = mid;
        else hi = mid - 1;
      }
      const k = lo,
        segKm = Math.max(1e-6, cum[k + 1] - cum[k]),
        t = Math.max(0, Math.min(1, (km - cum[k]) / segKm));
      const a = rd.pts[k],
        b = rd.pts[k + 1],
        om = siteAng(a, b);
      let v = a.slice();
      if (om > 1e-9) {
        const sn = Math.sin(om),
          k0 = Math.sin((1 - t) * om) / sn,
          k1 = Math.sin(t * om) / sn;
        v = siteNorm([
          a[0] * k0 + b[0] * k1,
          a[1] * k0 + b[1] * k1,
          a[2] * k0 + b[2] * k1,
        ]);
      }
      const F = siteFrame(v),
        head = siteBearing(v, b);
      const ux = Math.sin(head),
        uz = -Math.cos(head); // along the road, east and south
      const off = roadBend(rd, km * 1000, ri * 1.37) + side;
      return { dir: siteStep(v, F, -uz * off, -ux * off, R), head };
    }
    // the one hermit who knows the way to the heart of the world's trouble: somewhere a day or
    // two from it, on dry land, well away from any town (for the sea's trouble, the nearest shore)
    buildHeartHermit() {
      const arc = this.story.arc,
        heart = arc && (arc.where || arc.lair);
      if (!heart || !heart.dir) return;
      const rnd = mulberry32(this.salt ^ 0x4ea7),
        R = this.R,
        F = siteFrame(heart.dir);
      const far = (d, m) =>
        !this.story.settlements.some((t) => siteAng(d, t.dir) * R < m);
      for (let k = 0; k < 600; k++) {
        const reach = 25e3 + Math.min(1, k / 300) * 380e3,
          a = rnd() * Math.PI * 2,
          m = reach * (0.6 + rnd() * 0.4);
        const d = siteStep(heart.dir, F, Math.cos(a) * m, Math.sin(a) * m, R);
        if (this.height(d) < 4 || !far(d, 12e3) || !this.flat(d, 8, 3))
          continue;
        const s = {
          id: "hh",
          kind: "hermit",
          heart: true,
          pending: true,
          dir: d,
          keep: true,
        };
        const c = this.cellOf(d, this.Lb),
          key = "b" + c.f + "." + c.i + "." + c.j;
        if (!this.roadBins.has(key)) this.roadBins.set(key, []);
        this.roadBins.get(key).push(s);
        this.byId.set(s.id, s);
        this.heartHermit = s;
        return;
      }
    }
    // the great city that fell, if this world's did: out in the land, well away from every town, on ground
    // wide and level enough for its walls (by what laid it waste, if the story knows: the dragon's mountain,
    // the old battlefield; else in the middle of somebody's lands)
    buildDeadCity() {
      const C = this.story.city;
      if (!C || C.state !== "fallen") return;
      const rnd = mulberry32(this.salt ^ 0xdc17),
        R = this.R;
      const caps = this.story.settlements.filter((t) => t.type === "capital");
      const anchor = C.near || (caps[0] || this.story.settlements[0] || {}).dir;
      if (!anchor) return;
      const F = siteFrame(anchor);
      const far = (d, m) =>
        !this.story.settlements.some((t) => siteAng(d, t.dir) * R < m);
      for (let k = 0; k < 1500; k++) {
        const reach = 16e3 + Math.min(1, k / 700) * 260e3,
          a = rnd() * Math.PI * 2,
          m = reach * (0.45 + rnd() * 0.55);
        const d = siteStep(anchor, F, Math.cos(a) * m, Math.sin(a) * m, R);
        if (this.height(d) < 5 || !far(d, 12e3) || !this.flat(d, 60, 14))
          continue;
        // (all of it on dry land, not too steep anywhere round the walls)
        const Fd = siteFrame(d);
        let lo = Infinity,
          hi = -Infinity;
        for (let j = 0; j < 16; j++) {
          const q = siteStep(
              d,
              Fd,
              Math.cos(j * 0.3927) * 108,
              Math.sin(j * 0.3927) * 108,
              R,
            ),
            h = this.height(q);
          lo = Math.min(lo, h);
          hi = Math.max(hi, h);
        }
        if (lo < 2.5 || hi - lo > 26) continue;
        if (this.roadNear(d, 400)) continue;
        const s = {
          id: "gc",
          kind: "deadcity",
          pending: true,
          dir: d,
          keep: true,
        };
        const c = this.cellOf(d, this.Lb),
          key = "b" + c.f + "." + c.i + "." + c.j;
        if (!this.roadBins.has(key)) this.roadBins.set(key, []);
        this.roadBins.get(key).push(s);
        this.byId.set(s.id, s);
        this.deadCity = s;
        C.dir = d;
        return;
      }
    }
    // settle a road site on the ground the first time it is needed; null if it cannot stand
    settle(s) {
      if (!s.pending) return s.dead ? null : s;
      s.pending = false;
      if (s.kind === "hermit") {
        Object.assign(s, this.site(s.id, "hermit", s.dir, this.envAt(s.dir)), {
          heart: true,
          keep: true,
        });
        return s;
      }
      if (s.kind === "deadcity") {
        Object.assign(
          s,
          this.site(s.id, "deadcity", s.dir, this.envAt(s.dir)),
          { keep: true, great: "fallen", name: this.story.city.name },
        );
        return s;
      }
      const near = (d, m) =>
        this.story.settlements.some((t) => siteAng(d, t.dir) * this.R < m);
      let q = null;
      if (s.kind === "inn" || s.kind === "watch") {
        const off = s.kind === "inn" ? 17 : 10.5,
          tries =
            s.kind === "inn"
              ? [
                  [0, s.side],
                  [0, -s.side],
                  [0.6, s.side],
                  [-0.6, s.side],
                  [1.2, -s.side],
                ]
              : [
                  [0, s.side],
                  [0, -s.side],
                  [0.3, s.side],
                  [-0.3, -s.side],
                  [0.6, s.side],
                  [-0.6, -s.side],
                ];
        for (const [dk, sd] of tries) {
          const c = this.roadPoint(s.road, s.km + dk, sd * off);
          if (near(c.dir, 6000)) break;
          if (
            this.flat(
              c.dir,
              s.kind === "inn" ? 10 : 6,
              s.kind === "inn" ? 2.4 : 2.6,
            )
          ) {
            q = { ...c, km: s.km + dk, side: sd };
            break;
          }
        }
        if (!q) {
          s.dead = true;
          return null;
        }
        // the front door looks back at the road
        s.face = q.head + (q.side > 0 ? -Math.PI / 2 : Math.PI / 2);
      } else {
        q = this.roadPoint(s.road, s.km, s.side * 3.4);
        if (near(q.dir, 2500) || this.height(q.dir) < 1) {
          s.dead = true;
          return null;
        }
        s.head = q.head;
      }
      s.km = q.km ?? s.km;
      s.dir = q.dir;
      const env = this.envAt(s.dir);
      Object.assign(s, this.site(s.id, s.kind, s.dir, env), {
        road: s.road,
        km: s.km,
        face: s.face,
        head: s.head,
        keep: true,
      });
      return s;
    }
    // ---------- by the sea ----------
    // the water's edge in a big cell, if the sea comes into it: { p (dry ground a few steps up from the
    // water), face (towards the water), h }. A coarse look first, then along the line from dry to wet.
    shoreOf(c, rnd) {
      const n = 2 ** this.Lb,
        size = 2 / n,
        s0 = -1 + c.i * size,
        t0 = -1 + c.j * size;
      const G = [];
      for (let a = 0; a < 4; a++)
        for (let b = 0; b < 4; b++) {
          const d = siteDir(
            c.f,
            s0 + ((a + 0.5) / 4) * size,
            t0 + ((b + 0.5) / 4) * size,
          );
          G.push({ d, h: this.height(d) });
        }
      const wet = G.filter((q) => q.h < -0.8),
        dry = G.filter((q) => q.h > 1);
      if (!wet.length || !dry.length) return null;
      const a = dry[Math.floor(rnd() * dry.length)];
      let w = wet[0],
        wm = Infinity;
      for (const q of wet) {
        const m = siteAng(a.d, q.d);
        if (m < wm) {
          wm = m;
          w = q;
        }
      }
      const edge = this.waterline(a.d, w.d);
      if (!edge) return null;
      return this.landing(edge, 13);
    }
    // where the land meets the water between a dry point and a wet one
    waterline(dry, wet) {
      let lo = dry,
        hi = wet;
      for (let k = 0; k < 16; k++) {
        const mid = siteNorm([lo[0] + hi[0], lo[1] + hi[1], lo[2] + hi[2]]);
        if (this.height(mid) > 0) lo = mid;
        else hi = mid;
      }
      return siteAng(lo, hi) * this.R < 30 ? lo : null;
    }
    // which way the water lies from a point (a ring of samples), and a spot `up` metres inland from it
    landing(edge, up) {
      const R = this.R;
      let F = siteFrame(edge),
        ex = 0,
        ez = 0,
        nWet = 0;
      for (let k = 0; k < 16; k++) {
        const a = (k / 16) * Math.PI * 2,
          q = siteStep(edge, F, Math.sin(a) * 26, Math.cos(a) * 26, R);
        if (this.height(q) < -0.2) {
          ex += Math.sin(a);
          ez += Math.cos(a);
          nWet++;
        }
      }
      if (!nWet || nWet > 12) return null;
      const face = Math.atan2(ex, ez);
      const p = siteStep(
          edge,
          F,
          -Math.sin(face) * up,
          -Math.cos(face) * up,
          R,
        ),
        h = this.height(p);
      if (h < 0.5) return null;
      return {
        p,
        face: siteBearing(
          p,
          siteStep(edge, F, Math.sin(face) * 30, Math.cos(face) * 30, R),
        ),
        h,
        edge,
      };
    }
    // a headland near the shore: the highest ground within a couple of hundred metres of the water, with the
    // sea on more than one side of it
    headlandNear(sh) {
      const R = this.R,
        F = siteFrame(sh.edge),
        back = sh.face + Math.PI;
      let best = null;
      for (let k = 0; k < 14; k++) {
        const a = back + ((k % 7) - 3) * 0.32,
          m = k < 7 ? 70 : 150;
        const q = siteStep(sh.edge, F, Math.sin(a) * m, Math.cos(a) * m, R),
          h = this.height(q);
        if (h > 5 && h < 80 && (!best || h > best.h)) best = { p: q, h };
      }
      if (!best || best.h < 8) return null;
      const Fq = siteFrame(best.p);
      let wet = 0,
        ex = 0,
        ez = 0;
      for (let k = 0; k < 12; k++) {
        const a = (k / 12) * Math.PI * 2,
          q = siteStep(best.p, Fq, Math.sin(a) * 320, Math.cos(a) * 320, R);
        if (this.height(q) < -0.5) {
          wet++;
          ex += Math.sin(a);
          ez += Math.cos(a);
        }
      }
      if (wet < 4 || wet > 10 || !this.flat(best.p, 5, 3.2)) return null;
      return { p: best.p, face: Math.atan2(ex, ez), h: best.h };
    }
    // a ferry from this cell, if its shore looks across water at land again a short way off (a strait, a
    // sound, a wide bay): { a, b (the landings), faceA, faceB, km }. Pure: the same from either side.
    ferryOf(c) {
      const key = c.f + "." + c.i + "." + c.j;
      if (this.ferries.has(key)) return this.ferries.get(key);
      let out = null;
      const rnd = mulberry32(
        hashInt(c.f * 7307 + c.i, c.j, this.salt ^ 0xfe77),
      );
      if (rnd() < 0.42) {
        const sh = this.shoreOf(c, rnd);
        const env = sh ? this.envAt(sh.p) : null;
        if (
          sh &&
          env &&
          (env.owner >= 0 || env.townM < 300e3) &&
          env.townM > 3000 &&
          env.biome !== B.ICE &&
          this.flat(sh.p, 5, 2.6)
        ) {
          const R = this.R,
            F = siteFrame(sh.edge);
          let best = null;
          for (let k = 0; k < 9; k++) {
            const a = sh.face + (k - 4) * 0.22,
              sa = Math.sin(a),
              ca = Math.cos(a);
            let wetN = 0,
              landAt = -1;
            for (let j = 1; j <= 52; j++) {
              const m = j * 220,
                h = this.height(siteStep(sh.edge, F, sa * m, ca * m, R));
              if (h < -0.6) wetN++;
              else if (h > 0.8 && j > 3) {
                landAt = m;
                break;
              }
            }
            if (landAt < 1400 || wetN < (landAt / 220) * 0.8) continue;
            if (!best || landAt < best.m) best = { a, m: landAt };
          }
          if (best) {
            const far = siteStep(
                sh.edge,
                F,
                Math.sin(best.a) * best.m,
                Math.cos(best.a) * best.m,
                R,
              ),
              wetP = siteStep(
                sh.edge,
                F,
                Math.sin(best.a) * (best.m - 220),
                Math.cos(best.a) * (best.m - 220),
                R,
              );
            const e2 = this.waterline(far, wetP),
              lb = e2 ? this.landing(e2, 13) : null;
            if (lb && this.flat(lb.p, 5, 2.6) && this.envAt(lb.p).townM > 3000)
              out = {
                a: sh.p,
                b: lb.p,
                faceA: sh.face,
                faceB: lb.face,
                km: (siteAng(sh.p, lb.p) * R) / 1000,
                key,
              };
          }
        }
      }
      this.ferries.set(key, out);
      return out;
    }
    // the ferry landings in a big cell: from crossings that start here or within reach of here
    ferriesIn(c, key) {
      const n = 2 ** this.Lb,
        size = 2 / n,
        mid = siteDir(c.f, -1 + (c.i + 0.5) * size, -1 + (c.j + 0.5) * size);
      const out = [];
      for (const q of this.cellsNear(mid, 12500, this.Lb, this.spanB)) {
        const fe = this.ferryOf(q);
        if (!fe) continue;
        for (const end of ["a", "b"]) {
          const d = end === "a" ? fe.a : fe.b,
            cq = this.cellOf(d, this.Lb);
          if ("b" + cq.f + "." + cq.i + "." + cq.j !== key) continue;
          const id = "f" + end + fe.key,
            env = this.envAt(d);
          out.push(
            this.site(id, "ferry", d, env, {
              face: end === "a" ? fe.faceA : fe.faceB,
              other: end === "a" ? fe.b : fe.a,
              otherFace: end === "a" ? fe.faceB : fe.faceA,
              km: fe.km,
              end,
              keep: true,
            }),
          );
        }
      }
      return out;
    }
    // what lies along a road from a point, both ways: inns and the towns at its ends
    alongRoad(ri, km) {
      const rd = this.roads.roads[ri],
        R = this.R;
      let total = 0;
      for (let k = 0; k < rd.pts.length - 1; k++)
        total += (siteAng(rd.pts[k], rd.pts[k + 1]) * R) / 1000;
      const ahead = [],
        back = [];
      for (const s of rd.inns || [])
        (s.km > km ? ahead : back).push({ site: s, km: Math.abs(s.km - km) });
      const ta = this.story.settlements[rd.b],
        tb = this.story.settlements[rd.a];
      ahead.sort((a, b) => a.km - b.km);
      back.sort((a, b) => a.km - b.km);
      return {
        ahead,
        back,
        endAhead: { town: ta, km: total - km },
        endBack: { town: tb, km },
      };
    }
  }

  // ---- world/caves.js ----
  // ============================================================
  // CAVES — what is inside a hill. From a cave's seed: a passage that winds
  // down from the mouth, chambers along it, side passages that end in a
  // chamber of their own, sometimes a loop; floors that slope and dip into
  // pools, ceilings that dome over the chambers and close down over the
  // passages; and what is down there: stalagmites and columns, crystals,
  // ore in the walls, pale mushrooms, bones, an old camp, paintings on the
  // walls, and in some caves the dead, laid in niches long ago.
  // Pure data, on a grid of one-metre cells; the view builds and lights it.
  // Cave metres: x across the mouth, y up, z out of the mouth (the cave runs to -z).
  // ============================================================

