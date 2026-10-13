// index-inline-2 88 — math
// Lines 37069-38824 of readable/index-inline-2.pretty.js (statement-aligned).
  Object.assign(GroundView.prototype, {
    // ---------- the record of what changed ----------
    setWorld(w) {
      // (off any beast of the last life's, and none left waiting about)
      if (this.riding) {
        if (this.dropMountMesh) this.dropMountMesh(this.riding.mm);
        this.riding = null;
      }
      if (this.tethered)
        for (const t of this.tethered.filter((q) => q.host && q.host.looseOf))
          this.untether(t.host);
      this.world = w;
      // your houses come from this record now: build them again from it
      if (this.siteViews)
        for (const [id, v] of this.siteViews)
          if (v.site.kind === "home") {
            this.dropSite(v);
            this.siteViews.delete(id);
          }
      this.sitesDirty = true;
      for (const ch of this.chunks.values()) if (ch.D) this.rebuildProps(ch);
      this.placedDirty = true;
      this.dropsDirty = true;
    },
    isTaken(id, kind) {
      const w = this.world;
      if (!w) return false;
      const t = w.taken.get(id);
      return t != null && this.t - t < FINDS[kind].regrow;
    },

    // ---------- finds, per finest chunk ----------
    buildFinds(chunk, D, at, clear) {
      const rnd = mulberry32(
        hashInt(chunk.i * 7 + 3, chunk.j * 13 + 5, chunk.f * 97 + chunk.L + 11),
      );
      const area = (chunk.span * chunk.span) / 100,
        finds = [];
      let idx = 0;
      // how far the nearest fire mountain is, and how high this ground lies
      let volcanoKm = Infinity;
      for (const v of this.siteIx ? this.siteIx.volcanoes : []) {
        const a = v.dir;
        volcanoKm = Math.min(
          volcanoKm,
          (Math.acos(
            Math.max(
              -1,
              Math.min(
                1,
                a[0] * chunk.c[0] + a[1] * chunk.c[1] + a[2] * chunk.c[2],
              ),
            ),
          ) *
            this.R) /
            1000,
        );
      }
      for (const kind of Object.keys(FIND_BASE)) {
        const n = Math.round(FIND_BASE[kind] * area * (0.8 + rnd() * 0.4));
        for (let q = 0; q < n; q++) {
          const fx = rnd() * 32,
            fy = rnd() * 32,
            pick = rnd(),
            rot = rnd() * Math.PI * 2,
            sc = 0.8 + rnd() * 0.45,
            v = rnd();
          const id = chunk.key + ":f" + idx++;
          const s = at(fx, fy);
          if (s.h < 0.35) continue;
          if (clear.length && clear.some((q) => inClear(q, s.P[0], s.P[2])))
            continue;
          if (
            (kind === "bush" || kind === "fiber") &&
            D.road &&
            D.road(s.P[0], s.P[2]) < D.roadW + 0.6
          )
            continue;
          if (
            pick >
            findWeight(kind, D.bio[s.k], D.temps[s.k], s.N[1], {
              volcanoKm,
              h: s.h,
            })
          )
            continue;
          finds.push({
            id,
            kind,
            x: s.P[0],
            y: s.P[1],
            z: s.P[2],
            rot,
            sc,
            v,
            N: s.N,
            bio: D.bio[s.k],
          });
        }
      }
      chunk.finds = finds;
      this.findMesh(chunk);
    },
    // the colours of finds come from the planet: its grass, its shrubs, its caps
    findRows(bio) {
      if (!this.findRowCache) this.findRowCache = new Map();
      if (this.findRowCache.has(bio)) return this.findRowCache.get(bio);
      const layers = this.flora.table[bio] || [];
      const first = (layer, form) => {
        const l = layers.find((x) => x.layer === layer);
        if (!l) return null;
        const e =
          l.list.find((e) => !form || this.flora.species[e.sp].form === form) ||
          l.list[0];
        return e ? e.sp : null;
      };
      const grass = first("cover", "grass"),
        shrub = first("shrub");
      const rows = {
        grass: grass != null ? this.spRow[grass] : this.row([150, 168, 72]),
        leaf: shrub != null ? this.spRow[shrub] : this.row([72, 112, 52]),
        wood: this.row([106, 76, 50]),
        stone: this.row([128, 126, 132]),
        flint: this.row([62, 70, 100]),
        cap: this.row([176, 72, 50]),
        stem: this.row([222, 208, 182]),
        berry: this.row([196, 40, 62]),
        petal: this.row([236, 226, 150]),
        obsidian: this.row([46, 40, 58]),
        salt: this.row([236, 234, 226]),
      };
      this.findRowCache.set(bio, rows);
      return rows;
    },
    // one small model per find, in a chunk's own metres
    findInto(mb, f, taken) {
      const R = this.findRows(f.bio),
        cs = Math.cos(f.rot),
        sn = Math.sin(f.rot);
      // (lying along the ground: on a slope, the slope's plane through where it lies)
      const gx = f.N && f.N[1] > 0.3 ? -f.N[0] / f.N[1] : 0,
        gz = f.N && f.N[1] > 0.3 ? -f.N[2] / f.N[1] : 0;
      const at = (x, y, z) => {
        const X = x * cs - z * sn,
          Z = x * sn + z * cs;
        return [f.x + X, f.y + y + gx * X + gz * Z, f.z + Z];
      };
      switch (f.kind) {
        case "stick": {
          const L = 0.7 * f.sc;
          mb.prism(
            at(-L / 2, 0.03, 0),
            at(L / 2, 0.05, 0.05),
            0.028,
            0.02,
            4,
            R.wood,
            PAT.BARK,
          );
          mb.prism(
            at(-L / 4, 0.04, 0.12),
            at(L / 3, 0.04, -0.1),
            0.02,
            0.015,
            3,
            R.wood,
            PAT.BARK,
          );
          mb.prism(
            at(0.05, 0.05, 0.02),
            at(0.22, 0.06, 0.16),
            0.012,
            0.008,
            3,
            R.wood,
            PAT.BARK,
          );
          break;
        }
        case "stone":
        case "flint": {
          const r = (f.kind === "flint" ? 0.09 : 0.12) * f.sc,
            row = f.kind === "flint" ? R.flint : R.stone;
          const top = at(0, r * 1.25, 0),
            bot = at(0, -r * 0.3, 0);
          const ring = [0, 1, 2, 3, 4].map((k) => {
            const a = (k / 5) * 6.283 + f.v;
            return at(
              Math.cos(a) * r * (0.8 + 0.4 * ((k * 37 + f.v * 10) % 1)),
              r * 0.35,
              Math.sin(a) * r,
            );
          });
          for (let k = 0; k < 5; k++) {
            const a = ring[k],
              b = ring[(k + 1) % 5];
            mb.tri(a, b, top, row, PAT.ROCK);
            mb.tri(b, a, bot, row, PAT.ROCK);
          }
          break;
        }
        case "mushroom": {
          const n = 1 + Math.floor(f.v * 3);
          for (let k = 0; k < n; k++) {
            const ox = k ? Math.cos(k * 2.3) * 0.12 : 0,
              oz = k ? Math.sin(k * 2.3) * 0.12 : 0,
              h = (0.1 + 0.06 * ((k + f.v * 7) % 1)) * f.sc;
            mb.prism(
              at(ox, 0, oz),
              at(ox, h, oz),
              0.018,
              0.015,
              4,
              R.stem,
              PAT.NONE,
            );
            mb.cone(
              at(ox, h - 0.02, oz),
              at(ox, h + 0.05 * f.sc, oz)[1],
              0.06 * f.sc,
              6,
              R.cap,
              PAT.NONE,
              null,
              0.01,
              0.02,
            );
          }
          break;
        }
        case "bush": {
          const H = 0.75 * f.sc;
          for (let k = 0; k < 4; k++) {
            const a = k * 1.9 + f.v,
              r = k ? 0.26 * f.sc : 0,
              c = at(Math.cos(a) * r, H * (k ? 0.45 : 0.62), Math.sin(a) * r),
              s = H * (k ? 0.36 : 0.44);
            const q = [
              [1, 0, 0],
              [-1, 0, 0],
              [0, 1, 0],
              [0, -0.6, 0],
              [0, 0, 1],
              [0, 0, -1],
            ].map((d) => [c[0] + d[0] * s, c[1] + d[1] * s, c[2] + d[2] * s]);
            for (const [i, j, k2] of [
              [0, 2, 4],
              [4, 2, 1],
              [1, 2, 5],
              [5, 2, 0],
              [4, 3, 0],
              [1, 3, 4],
              [5, 3, 1],
              [0, 3, 5],
            ])
              mb.tri(q[i], q[j], q[k2], R.leaf, PAT.NONE, null, { lv: 0.2 });
          }
          if (!taken)
            for (let k = 0; k < 9; k++) {
              const a = k * 2.4 + f.v * 3,
                r = (0.18 + (k % 3) * 0.1) * f.sc,
                y = H * (0.35 + (k % 4) * 0.12);
              const c = at(Math.cos(a) * r, y, Math.sin(a) * r);
              mb.box(
                c[0] - 0.035,
                c[1] - 0.035,
                c[2] - 0.035,
                c[0] + 0.035,
                c[1] + 0.035,
                c[2] + 0.035,
                R.berry,
                PAT.NONE,
              );
            }
          break;
        }
        case "herb": {
          const H = 0.32 * f.sc;
          for (let k = 0; k < 6; k++) {
            const a = (k / 6) * 6.283 + f.v,
              tip = at(
                Math.cos(a) * 0.16,
                H * (0.6 + 0.4 * ((k * 0.61 + f.v) % 1)),
                Math.sin(a) * 0.16,
              );
            const b0 = at(0, 0, 0),
              side = [-Math.sin(a) * 0.05, 0, Math.cos(a) * 0.05];
            mb.tri(
              [b0[0] - side[0], b0[1], b0[2] - side[2]],
              [b0[0] + side[0], b0[1], b0[2] + side[2]],
              tip,
              R.leaf,
              PAT.NONE,
              null,
              { lv: 0.4 },
            );
            if (k % 2 === 0)
              mb.box(
                tip[0] - 0.025,
                tip[1],
                tip[2] - 0.025,
                tip[0] + 0.025,
                tip[1] + 0.05,
                tip[2] + 0.025,
                R.petal,
                PAT.NONE,
              );
          }
          break;
        }
        case "obsidian": {
          const r = 0.1 * f.sc,
            top = at(0, r * 1.6, 0),
            bot = at(0, -r * 0.2, 0);
          const ring = [0, 1, 2, 3].map((k) => {
            const a = (k / 4) * 6.283 + f.v;
            return at(
              Math.cos(a) * r * (0.7 + 0.5 * ((k * 0.37 + f.v) % 1)),
              r * 0.3,
              Math.sin(a) * r * 0.8,
            );
          });
          for (let k = 0; k < 4; k++) {
            const a = ring[k],
              b = ring[(k + 1) % 4];
            mb.tri(a, b, top, R.obsidian, PAT.NONE, null, {
              lv: k % 2 ? 0.8 : -0.3,
            });
            mb.tri(b, a, bot, R.obsidian, PAT.NONE);
          }
          break;
        }
        case "salt": {
          const r = 0.45 * f.sc;
          for (let k = 0; k < 7; k++) {
            const a0 = (k / 7) * 6.283,
              a1 = ((k + 1) / 7) * 6.283,
              r0 = r * (0.7 + 0.3 * ((k * 0.53 + f.v) % 1)),
              r1 = r * (0.7 + 0.3 * ((((k + 1) % 7) * 0.53 + f.v) % 1));
            mb.tri(
              at(0, 0.04, 0),
              at(Math.cos(a1) * r1, 0.02, Math.sin(a1) * r1),
              at(Math.cos(a0) * r0, 0.02, Math.sin(a0) * r0),
              R.salt,
              PAT.HIDE,
              null,
              { lv: 0.6 },
            );
          }
          break;
        }
        case "fiber": {
          const H = 0.7 * f.sc;
          for (let k = 0; k < 7; k++) {
            const a = (k / 7) * 6.283 + f.v,
              lean = 0.12 + (k % 3) * 0.08,
              b0 = at(Math.cos(a) * 0.05, 0, Math.sin(a) * 0.05);
            const tip = at(
              Math.cos(a) * lean * H * 1.6,
              H * (0.75 + 0.25 * ((k * 0.37 + f.v) % 1)),
              Math.sin(a) * lean * H * 1.6,
            );
            const side = [-Math.sin(a) * 0.025, 0, Math.cos(a) * 0.025];
            mb.tri(
              [b0[0] - side[0], b0[1], b0[2] - side[2]],
              [b0[0] + side[0], b0[1], b0[2] + side[2]],
              tip,
              R.grass,
              PAT.NONE,
              null,
              { lv: 0.3 },
            );
          }
          break;
        }
      }
    },
    findMesh(chunk) {
      if (chunk.findMeshObj) {
        if (chunk.findMeshObj.parent)
          chunk.findMeshObj.parent.remove(chunk.findMeshObj);
        chunk.findMeshObj.geometry.dispose();
        chunk.findMeshObj = null;
      }
      const list = chunk.finds || [];
      if (!list.length) return;
      const mb = new MeshBuf();
      for (const f of list) {
        const taken = this.isTaken(f.id, f.kind);
        if (taken && f.kind !== "bush") continue;
        this.findInto(mb, f, taken);
      }
      if (!mb.count) return;
      this.syncRamps();
      chunk.findMeshObj = this.meshOf(mb.finish(), this.solidMat);
    },
    meshOf(d, mat) {
      const T = this.T,
        geo = new T.BufferGeometry();
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
      const mesh = new T.Mesh(geo, mat);
      mesh.matrixAutoUpdate = false;
      return mesh;
    },

    // ---------- what you are looking at ----------
    // The best-aligned thing within reach: a find, a tree or rock, something dropped or built.
    lookTarget() {
      if (!this.world) return null;
      if (this.cave) return this.lookCave();
      const R = this.R,
        p = this.p,
        eye = this.eyeY;
      const h = -this.yaw,
        cp = Math.cos(this.pitch);
      const vx = Math.sin(h) * cp,
        vy = Math.sin(this.pitch),
        vz = -Math.cos(h) * cp; // east, up, south
      let best = null;
      const test = (dx, dy, dz, rad, reach, info) => {
        const d = Math.hypot(dx, dy, dz);
        if (d > reach + rad || d < 1e-3) return;
        const ang = Math.acos(
          Math.max(-1, Math.min(1, (dx * vx + dy * vy + dz * vz) / d)),
        );
        const allow = Math.atan2(rad + 0.32, d) + 0.1;
        if (ang > allow) return;
        const score = ang / allow + d * 0.04;
        if (!best || score < best.score)
          best = Object.assign(info, { score, d });
      };
      const local = (c, F) => {
        const d0 = p[0] - c[0],
          d1 = p[1] - c[1],
          d2 = p[2] - c[2];
        return [
          (d0 * F.e[0] + d1 * F.e[1] + d2 * F.e[2]) * R,
          -(d0 * F.n[0] + d1 * F.n[1] + d2 * F.n[2]) * R,
        ];
      };
      for (const ch of this.chunks.values()) {
        if (ch.L !== this.maxL || (!ch.finds && !ch.col)) continue;
        const [lx, lz] = local(ch.c, ch.F),
          reach = ch.span * 0.75 + 4;
        if (Math.abs(lx) > reach || Math.abs(lz) > reach) continue;
        if (ch.finds)
          for (const f of ch.finds) {
            if (Math.abs(f.x - lx) > 4 || Math.abs(f.z - lz) > 4) continue;
            const taken = this.isTaken(f.id, f.kind);
            if (taken) continue;
            const rad =
              f.kind === "bush"
                ? 0.45
                : f.kind === "fiber" || f.kind === "salt"
                  ? 0.3
                  : f.kind === "herb"
                    ? 0.24
                    : 0.18;
            test(
              f.x - lx,
              f.y +
                (f.kind === "bush"
                  ? 0.4
                  : f.kind === "fiber"
                    ? 0.3
                    : f.kind === "herb"
                      ? 0.15
                      : 0.05) -
                eye,
              f.z - lz,
              rad,
              3.0,
              { kind: "find", chunk: ch, find: f },
            );
          }
        if (ch.col)
          for (let k = 0, q = 0; k < ch.col.length; k += 6, q++) {
            const x = ch.col[k],
              z = ch.col[k + 1];
            if (Math.abs(x - lx) > 5 || Math.abs(z - lz) > 5) continue;
            const r = ch.col[k + 2],
              base = ch.col[k + 3],
              top = ch.col[k + 4],
              rock = ch.colKind[q] === "rock";
            const aimY = rock
              ? base + (top - base) * 0.5
              : Math.min(top, eye - 0.3);
            test(x - lx, aimY - eye, z - lz, rock ? r : Math.max(r, 0.2), 2.3, {
              kind: rock ? "rock" : "tree",
              chunk: ch,
              k,
              q,
              sid: ch.colSid[q],
              r,
            });
          }
      }
      const F0 = frameAt(p);
      const off = (dir, alt) => {
        const d = [dir[0] - p[0], dir[1] - p[1], dir[2] - p[2]];
        return [pdot(d, F0.e) * R, alt - eye, -pdot(d, F0.n) * R];
      };
      for (const dr of this.world.drops) {
        if (
          Math.abs(dr.dir[0] - p[0]) * R > 6 ||
          Math.abs(dr.dir[1] - p[1]) * R > 6 ||
          Math.abs(dr.dir[2] - p[2]) * R > 6
        )
          continue;
        const [dx, dy, dz] = off(dr.dir, (dr.alt ?? 0) + 0.1);
        test(
          dx,
          dy,
          dz,
          dr.item === "log"
            ? 0.6
            : dr.item === "arrow" || dr.item === "obarrow"
              ? 0.32
              : 0.25,
          3.0,
          { kind: "drop", drop: dr },
        );
      }
      // what is left of a beast
      for (const c of this.carcasses || []) {
        if (
          Math.abs(c.dir[0] - p[0]) * R > 8 ||
          Math.abs(c.dir[1] - p[1]) * R > 8 ||
          Math.abs(c.dir[2] - p[2]) * R > 8
        )
          continue;
        const aim = this.carcassAim(c),
          [dx, dy, dz] = off(c.dir, aim.alt);
        test(dx, dy, dz, aim.rad, 2.4, { kind: "carcass", carcass: c });
      }
      // something coming for you
      if (this.hostileAt) {
        const ho = this.hostileAt(this.weaponReach || 2.2);
        if (ho && (!best || ho.d <= best.d + 0.8))
          best = { kind: "foe", foe: ho.h, hostile: true, d: ho.d, score: 0 };
      }
      for (const pl of this.world.placed) {
        if (
          Math.abs(pl.dir[0] - p[0]) * R > 8 ||
          Math.abs(pl.dir[1] - p[1]) * R > 8 ||
          Math.abs(pl.dir[2] - p[2]) * R > 8
        )
          continue;
        const rad =
          {
            campfire: 0.55,
            leanto: 1.1,
            bedroll: 0.7,
            bundle: 0.35,
            workstone: 0.6,
            wreck: 0.9,
          }[pl.kind] || 0.5;
        const [dx, dy, dz] = off(
          pl.dir,
          (pl.alt ?? 0) + (pl.kind === "leanto" ? 0.8 : 0.2),
        );
        test(dx, dy, dz, rad, 2.6, { kind: "placed", placed: pl });
      }
      this.lookSites(test, off);
      return best;
    },

    // ---------- taking finds ----------
    takeFind(tg) {
      const f = tg.find;
      this.world.taken.set(f.id, this.t);
      this.findMesh(tg.chunk);
      const d = FINDS[f.kind],
        k =
          hashInt(Math.floor(this.t * 100), (f.x * 10) | 0, 7) %
          (d.n[1] - d.n[0] + 1);
      return { item: d.item, n: d.n[0] + k };
    },

    // ---------- things lying on the ground ----------
    addDrop(item, n, dir, extra = {}) {
      let alt = Math.max(-0.5, this.ground.height(dir[0], dir[1], dir[2], 1));
      // set down on whatever you stand on there (a floor, a porch, the top of a wall), not under it
      if (this.p && !this.cave && arcM(this.p, dir, this.R) < 4) {
        const feet = this.eyeY - (this.riding ? this.riding.mm.eye : 1.7),
          up = this.surfaceUnder(dir, feet + 0.45);
        if (up > alt + 0.05) {
          alt = up;
          extra = { ...extra, floor: true };
        }
      }
      const dr = {
        id: "d" + Math.floor(Math.random() * 1e9).toString(36),
        item,
        n,
        dir: dir.slice(),
        alt,
        yaw: Math.random() * 6.283,
        ...extra,
      };
      this.world.drops.push(dr);
      this.dropsDirty = true;
      return dr;
    },
    refreshDrop(dr) {
      if (dr.mesh) {
        if (dr.mesh.parent) dr.mesh.parent.remove(dr.mesh);
        dr.mesh.geometry.dispose();
        dr.mesh = null;
      }
    },
    removeDrop(dr) {
      const i = this.world.drops.indexOf(dr);
      if (i >= 0) this.world.drops.splice(i, 1);
      if (dr.mesh) {
        if (dr.mesh.parent) dr.mesh.parent.remove(dr.mesh);
        dr.mesh.geometry.dispose();
        dr.mesh = null;
      }
    },
    // the highest floor, deck or walk-top under a point (in the world) that is no higher than maxY; -1e9 if none
    surfaceUnder(dir, maxY) {
      let best = -1e9;
      const R = this.R,
        hosts = [];
      if (this.siteViews)
        for (const v of this.siteViews.values())
          if (v.boxes.length && arcM(dir, v.site.dir, R) <= v.reach)
            hosts.push(v);
      if (this.towns)
        for (const tw of this.towns.values())
          if (arcM(dir, tw.s.dir, R) <= 400) hosts.push(tw);
      for (const h of hosts) {
        const [lx, lz] = this.hostLocal(h, dir);
        for (const bx of h.boxes) {
          if (bx.top == null || bx.slope || bx.top > maxY || bx.top <= best)
            continue;
          const dx = lx - bx.x,
            dz = lz - bx.z,
            u = dx * bx.cs + dz * bx.sn,
            w = -dx * bx.sn + dz * bx.cs;
          if (Math.abs(u) <= bx.hx && Math.abs(w) <= bx.hz) best = bx.top;
        }
      }
      return best;
    },
    dropMesh(dr) {
      const mb = new MeshBuf(),
        wood = this.row([106, 76, 50]),
        stone = this.row([128, 126, 132]),
        cloth = this.row([150, 128, 96]),
        cord = this.row([184, 151, 94]);
      const cs = Math.cos(dr.yaw),
        sn = Math.sin(dr.yaw),
        at = (x, y, z) => [x * cs - z * sn, y, x * sn + z * cs];
      if (dr.item === "log") {
        const n = Math.min(4, dr.n);
        for (let k = 0; k < n; k++)
          mb.prism(
            at(-0.8, 0.14 + (k > 1 ? 0.22 : 0), (k % 2 ? 0.3 : 0) - 0.15),
            at(0.8, 0.14 + (k > 1 ? 0.22 : 0), (k % 2 ? 0.3 : 0) - 0.15),
            0.13,
            0.12,
            6,
            wood,
            PAT.BARK,
            null,
            0,
            true,
          );
      } else if (dr.item === "stick" || dr.item === "plank") {
        for (let k = 0; k < Math.min(5, dr.n); k++)
          mb.prism(
            at(-0.35, 0.03 + k * 0.02, -0.12 + k * 0.06),
            at(0.35, 0.03 + k * 0.02, -0.08 + k * 0.05),
            0.025,
            0.02,
            4,
            wood,
            PAT.BARK,
          );
      } else if (dr.item === "arrow" || dr.item === "obarrow") {
        arrowDropInto(mb, dr, {
          wood: this.row([200, 168, 112]),
          feather: this.row([186, 64, 50]),
        });
      } else if (dr.item === "stone" || dr.item === "flint") {
        for (let k = 0; k < Math.min(4, dr.n); k++) {
          const a = k * 2.1;
          mb.box(
            Math.cos(a) * 0.12 - 0.07,
            0,
            Math.sin(a) * 0.12 - 0.06,
            Math.cos(a) * 0.12 + 0.07,
            0.11,
            Math.sin(a) * 0.12 + 0.06,
            stone,
            PAT.ROCK,
          );
        }
      } else {
        // anything else waits in a tied bundle
        mb.box(-0.2, 0, -0.16, 0.2, 0.26, 0.16, cloth, PAT.CLOTH);
        mb.cone([0, 0.26, 0], 0.4, 0.1, 5, cloth, PAT.CLOTH);
        mb.box(-0.21, 0.2, -0.03, 0.21, 0.24, 0.03, cord, PAT.NONE);
      }
      // on a slope it lies along the ground (not on a floor: that is level)
      if (!dr.floor) {
        const F = frameAt(dr.dir),
          G = this.ground,
          h = (e, nn) => {
            const q = stepOn(dr.dir, F, e, nn, this.R);
            return G.height(q[0], q[1], q[2], 1);
          };
        const gE = (h(0.6, 0) - h(-0.6, 0)) / 1.2,
          gS = (h(0, -0.6) - h(0, 0.6)) / 1.2;
        for (let i = 0; i < mb.p.length; i += 3)
          mb.p[i + 1] +=
            Math.max(-1, Math.min(1, gE)) * mb.p[i] +
            Math.max(-1, Math.min(1, gS)) * mb.p[i + 2];
      }
      this.syncRamps();
      return this.meshOf(mb.finish(), this.solidMat);
    },

    // ---------- trees and rocks ----------
    rebuildProps(ch) {
      for (const m of [ch.solids, ch.cards])
        if (m) {
          if (m.parent) m.parent.remove(m);
          m.geometry.dispose();
        }
      ch.solids = ch.cards = null;
      ch.col = null;
      ch.colKind = null;
      ch.colSid = null;
      ch.roots = null;
      this.colChunks.delete(ch);
      if (ch.findMeshObj) {
        if (ch.findMeshObj.parent) ch.findMeshObj.parent.remove(ch.findMeshObj);
        ch.findMeshObj.geometry.dispose();
        ch.findMeshObj = null;
      }
      if (ch.D) this.buildProps(ch, ch.D);
    },
    // chop through: the tree falls away from you and leaves logs along where it lies
    fell(tg) {
      const ch = tg.chunk,
        info = ch.solidInfo && ch.solidInfo.get(tg.sid);
      if (!info) return false;
      this.world.gone.add(tg.sid);
      const R = this.R,
        T = this.T;
      const dir = stepOn(ch.c, ch.F, info.P[0], -info.P[2], R);
      const F = frameAt(dir);
      // which way it falls: away from you
      const away = bearingTo(this.p, dir);
      const fx = Math.sin(away),
        fz = -Math.cos(away);
      const mesh = this.mergeSolids([
        { ...info, P: [0, 0, 0], noShadow: true },
      ]);
      const cards = [];
      this.treeCards(info, [0, 0, 0], cards);
      const cardMesh = cards.length ? this.makeCards(cards, { mesh }) : null;
      this.scene.add(mesh);
      if (cardMesh) this.scene.add(cardMesh);
      const height = info.proto.top * info.sc;
      this.falling = this.falling || [];
      const pine =
        this.flora.species[info.spId] &&
        this.flora.species[info.spId].g.form === "conifer";
      this.falling.push({
        mesh,
        cardMesh,
        dir,
        F,
        alt: info.P[1] + 0.12,
        axis: new T.Vector3(fz, 0, -fx),
        t: 0,
        height,
        fx,
        fz,
        rot: new T.Matrix4(),
        pine,
      });
      this.rebuildProps(ch);
      return true;
    },
    breakRock(tg) {
      const ch = tg.chunk,
        info = ch.solidInfo && ch.solidInfo.get(tg.sid);
      if (!info) return null;
      this.world.gone.add(tg.sid);
      const dir = stepOn(ch.c, ch.F, info.P[0], -info.P[2], this.R);
      const size = info.proto.topY * info.sc;
      this.rebuildProps(ch);
      let hsid = 7;
      for (let i = 0; i < tg.sid.length; i++)
        hsid = (hsid * 31 + tg.sid.charCodeAt(i)) >>> 0;
      return {
        dir,
        stones: Math.max(2, Math.min(8, Math.round(size * 5))),
        flint: hsid % 10 < 4 ? 1 + (size > 1 ? 1 : 0) : 0,
      };
    },
    stepFalling(dt) {
      if (!this.falling || !this.falling.length) return;
      for (let i = this.falling.length - 1; i >= 0; i--) {
        const f = this.falling[i];
        f.t += dt;
        const k = Math.min(1, f.t / 1.5),
          ang =
            k * k * 1.5 +
            (k >= 1
              ? Math.sin(Math.min(1, (f.t - 1.5) / 0.4) * Math.PI) * 0.05
              : 0);
        const sink = f.t > 3.2 ? (f.t - 3.2) * 0.8 : 0;
        for (const m of [f.mesh, f.cardMesh]) {
          if (!m) continue;
          this.placeMatrix(m, f.dir, f.F, f.alt - sink);
          f.rot.makeRotationAxis(f.axis, ang);
          m.matrix.multiply(f.rot);
        }
        if (f.t > 4.2) {
          for (const m of [f.mesh, f.cardMesh])
            if (m) {
              this.scene.remove(m);
              m.geometry.dispose();
            }
          this.falling.splice(i, 1);
          // logs along the fallen trunk, sticks where the crown hit
          const logs = Math.max(1, Math.min(5, Math.round(f.height / 3.2)));
          for (let q = 0; q < logs; q++) {
            const m = 1.6 + q * ((f.height * 0.7) / logs);
            this.addDrop(
              "log",
              1,
              stepOn(f.dir, f.F, f.fx * m, -f.fz * m, this.R),
              { yaw: Math.atan2(f.fz, f.fx) },
            );
          }
          const top = f.height * 0.85;
          this.addDrop(
            "stick",
            3 + (logs > 2 ? 2 : 0),
            stepOn(f.dir, f.F, f.fx * top, -f.fz * top, this.R),
          );
          if (f.pine)
            this.addDrop(
              "resin",
              2,
              stepOn(
                f.dir,
                f.F,
                f.fx * 0.9 + f.fz * 0.6,
                -f.fz * 0.9 + f.fx * 0.6,
                this.R,
              ),
            );
          if (this.onFelled) this.onFelled();
        }
      }
    },

    // ---------- things you built ----------
    placedMesh(pl) {
      const mb = new MeshBuf();
      const wood = this.row([106, 76, 50]),
        dark = this.row([84, 60, 40]),
        stone = this.row([122, 116, 122]),
        grass = this.findRows(this.bioAt(pl.dir)).grass;
      const thatch = this.row([168, 150, 88]),
        cloth = this.row([150, 128, 96]),
        cord = this.row([184, 151, 94]);
      if (pl.kind === "campfire") {
        if (!pl.bare)
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
        for (let k = 0; k < 4; k++) {
          const a = (k / 4) * Math.PI * 2 + 0.3;
          mb.prism(
            [Math.cos(a) * 0.45, 0.02, Math.sin(a) * 0.45],
            [-Math.cos(a) * 0.08, 0.3, -Math.sin(a) * 0.08],
            0.05,
            0.04,
            4,
            wood,
            PAT.BARK,
          );
        }
      } else if (pl.kind === "leanto") {
        // two forked posts, a ridge pole, and a roof of sticks and grass sloping to the ground behind
        const W = 1.3,
          Hh = 1.75,
          D = 2.1;
        for (const s of [-1, 1]) {
          mb.prism(
            [s * W, -0.2, 0],
            [s * W, Hh + 0.1, 0],
            0.06,
            0.05,
            5,
            wood,
            PAT.BARK,
          );
          mb.prism(
            [s * W, Hh - 0.05, 0],
            [s * (W + 0.12), Hh + 0.25, 0.05],
            0.03,
            0.02,
            3,
            wood,
            PAT.BARK,
          );
        }
        mb.prism(
          [-W - 0.25, Hh, 0],
          [W + 0.25, Hh, 0],
          0.05,
          0.05,
          5,
          wood,
          PAT.BARK,
        );
        for (let k = 0; k <= 6; k++) {
          const x = -W + k * ((2 * W) / 6);
          mb.prism(
            [x, Hh, 0.02],
            [x * 1.05, 0, D],
            0.035,
            0.03,
            4,
            dark,
            PAT.BARK,
          );
        }
        mb.quad(
          [-W - 0.15, Hh + 0.06, -0.05],
          [W + 0.15, Hh + 0.06, -0.05],
          [W + 0.25, 0.02, D + 0.1],
          [-W - 0.25, 0.02, D + 0.1],
          thatch,
          PAT.THATCH,
          [
            [0, 0],
            [2.8, 0],
            [2.8, 2.8],
            [0, 2.8],
          ],
        );
        mb.quad(
          ...mb.under(
            [-W - 0.15, Hh + 0.06, -0.05],
            [W + 0.15, Hh + 0.06, -0.05],
            [W + 0.25, 0.02, D + 0.1],
            [-W - 0.25, 0.02, D + 0.1],
            0.04,
          ),
          grass,
          PAT.THATCH,
          [
            [0, 0],
            [2.8, 0],
            [2.8, 2.8],
            [0, 2.8],
          ],
          { lv: -0.15 },
        );
      } else if (pl.kind === "workstone") {
        // a flat slab on three stones, a few flakes of flint on top
        for (const [x, z] of [
          [-0.4, -0.25],
          [0.4, -0.2],
          [0, 0.3],
        ])
          mb.box(
            x - 0.16,
            -0.1,
            z - 0.14,
            x + 0.16,
            0.3,
            z + 0.14,
            stone,
            PAT.ROCK,
          );
        mb.box(-0.62, 0.3, -0.45, 0.62, 0.44, 0.45, stone, PAT.ROCK, {
          lv: 0.3,
        });
        const flint = this.row([62, 70, 100]);
        mb.box(0.1, 0.44, -0.1, 0.24, 0.47, 0.02, flint, PAT.ROCK);
        mb.box(-0.3, 0.44, 0.1, -0.2, 0.46, 0.2, flint, PAT.ROCK);
      } else if (pl.kind === "wreck") {
        // what came down through the roof with you: a heap of straw, broken beams, a pot in pieces, tiles
        const rnd = mulberry32(hashStr(pl.id || "w"));
        for (let k = 0; k < 6; k++) {
          const a = rnd() * 6.28,
            r = rnd() * 0.9;
          lumpInto(
            mb,
            Math.cos(a) * r,
            -0.12,
            Math.sin(a) * r,
            0.5 + rnd() * 0.3,
            0.18 + rnd() * 0.12,
            0.45,
            thatch,
            grass,
            hashStr("w" + k),
            rnd() * 6,
          );
        }
        for (let k = 0; k < 4; k++) {
          const a = rnd() * 6.28,
            L = 0.9 + rnd() * 1.1,
            x0 = (rnd() - 0.5) * 1.2,
            z0 = (rnd() - 0.5) * 1.2;
          mb.prism(
            [x0, 0.08, z0],
            [x0 + Math.cos(a) * L, 0.08 + rnd() * 0.5, z0 + Math.sin(a) * L],
            0.07,
            0.06,
            4,
            k % 2 ? dark : wood,
            PAT.BARK,
          );
        }
        const pot = this.row([172, 104, 70]);
        for (let k = 0; k < 5; k++) {
          const a = rnd() * 6.28,
            r = 0.6 + rnd() * 0.5;
          mb.box(
            Math.cos(a) * r - 0.07,
            0,
            Math.sin(a) * r - 0.05,
            Math.cos(a) * r + 0.07,
            0.06 + rnd() * 0.06,
            Math.sin(a) * r + 0.05,
            pot,
            PAT.NONE,
          );
        }
      } else if (pl.kind === "bedroll") {
        mb.box(-0.4, -0.05, -0.95, 0.4, 0.07, 0.75, thatch, PAT.THATCH);
        mb.prism(
          [-0.42, 0.14, 0.82],
          [0.42, 0.14, 0.82],
          0.14,
          0.14,
          7,
          grass,
          PAT.THATCH,
          null,
          0,
          true,
        );
        mb.box(-0.1, 0.02, 0.7, 0.1, 0.3, 0.95, cord, PAT.NONE);
      } else {
        mb.box(-0.28, 0, -0.22, 0.28, 0.34, 0.22, cloth, PAT.CLOTH);
        mb.cone([0, 0.34, 0], 0.55, 0.14, 5, cloth, PAT.CLOTH);
        mb.box(-0.29, 0.26, -0.04, 0.29, 0.31, 0.04, cord, PAT.NONE);
      }
      // on uneven ground its foot follows the ground (not on a floor: that is level). A bedroll or a wreck lies along
      // it; what stands up out of it (a fire's sticks, a work stone's slab, a lean-to's ridge) stays upright and level
      // (not the ghost of one you are still choosing a place for: that has no place yet)
      if (!pl.floor && Number.isFinite(pl.alt)) {
        const F = frameAt(pl.dir),
          G = this.ground,
          cs = Math.cos(pl.yaw || 0),
          sn = Math.sin(pl.yaw || 0),
          memo = new Map();
        const rise = (x, z) => {
          const e = x * cs - z * sn,
            so = x * sn + z * cs,
            key = Math.round(e * 20) * 100003 + Math.round(so * 20);
          let v = memo.get(key);
          if (v == null) {
            const q = stepOn(pl.dir, F, e, -so, this.R);
            v = Math.max(
              -1.2,
              Math.min(1.2, G.height(q[0], q[1], q[2], 1) - pl.alt),
            );
            memo.set(key, v);
          }
          return v;
        };
        const sh =
          { campfire: 0.32, workstone: 0.32, leanto: 1.8, bundle: 0.3 }[
            pl.kind
          ] || 0;
        for (let i = 0; i < mb.p.length; i += 3) {
          const t = sh ? Math.min(1, Math.max(0, mb.p[i + 1] / sh)) : 0;
          if (t < 1)
            mb.p[i + 1] +=
              rise(mb.p[i], mb.p[i + 2]) * (1 - t * t * (3 - 2 * t));
        }
      }
      this.syncRamps();
      const mesh = this.meshOf(mb.finish(), this.solidMat);
      if (pl.kind === "campfire") {
        const fl = new MeshBuf(),
          flame = this.row([255, 170, 70]);
        for (let k = 0; k < 4; k++) {
          const a = k * 1.9,
            r = k ? 0.12 : 0;
          fl.cone(
            [Math.cos(a) * r, 0.04, Math.sin(a) * r],
            0.38 + (k ? 0.14 : 0.32) * (1 - k * 0.15),
            0.14 - k * 0.012,
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
        mesh.userData.flames = this.meshOf(fl.finish(), this.solidMat);
      }
      return mesh;
    },
    bioAt(dir) {
      const S = {};
      this.ground.sample(dir[0], dir[1], dir[2], 4, S);
      return S.biome;
    },
    addPlaced(kind, dir, yaw, extra = {}) {
      let alt = Math.max(-0.3, this.ground.height(dir[0], dir[1], dir[2], 1));
      // put down on whatever you stand on there (a floor, a porch), not under it
      if (this.p && !this.cave && arcM(this.p, dir, this.R) < 4) {
        const feet = this.eyeY - (this.riding ? this.riding.mm.eye : 1.7),
          up = this.surfaceUnder(dir, feet + 0.45);
        if (up > alt + 0.05) {
          alt = up;
          extra = { ...extra, floor: true };
        }
      }
      const pl = {
        id: "p" + Math.floor(Math.random() * 1e9).toString(36),
        kind,
        dir: dir.slice(),
        alt,
        yaw,
        ...extra,
      };
      this.world.placed.push(pl);
      this.placedDirty = true;
      return pl;
    },
    removePlaced(pl) {
      const i = this.world.placed.indexOf(pl);
      if (i >= 0) this.world.placed.splice(i, 1);
      for (const m of [pl.mesh, pl.mesh && pl.mesh.userData.flames])
        if (m) {
          if (m.parent) m.parent.remove(m);
          m.geometry.dispose();
        }
      pl.mesh = null;
    },
    // draw what was dropped and built near you; the nearest lit fire lights the night
    stepPlaced(nowS) {
      if (!this.world) return null;
      const R = this.R,
        p = this.p;
      let fire = null,
        fireM = 1e9;
      for (const pl of this.world.placed) {
        const m = arcM(p, pl.dir, R);
        const near = m < 260;
        // (left inside a house while you were away: on its floor, once the house is there to have one)
        if (
          near &&
          pl.inside &&
          !pl.floor &&
          (!pl.mesh || this.frame % 30 === 0)
        ) {
          const up = this.surfaceUnder(pl.dir, pl.alt + 3);
          if (up > pl.alt + 0.05) {
            pl.alt = up;
            pl.floor = true;
            if (pl.mesh) {
              if (pl.mesh.parent) this.scene.remove(pl.mesh);
              pl.mesh.geometry.dispose();
              pl.mesh = null;
            }
          }
        }
        if (near && !pl.mesh) {
          pl.mesh = this.placedMesh(pl);
          pl.F = frameAt(pl.dir);
        }
        if (!pl.mesh) continue;
        const fl = pl.mesh.userData.flames;
        if (!near) {
          if (pl.mesh.parent) this.scene.remove(pl.mesh);
          if (fl && fl.parent) this.scene.remove(fl);
          continue;
        }
        if (!pl.mesh.parent) this.scene.add(pl.mesh);
        this.placeMatrix(pl.mesh, pl.dir, pl.F, pl.alt, pl.yaw);
        if (fl) {
          const lit = (pl.fuel || 0) > 0;
          if (lit && !fl.parent) this.scene.add(fl);
          else if (!lit && fl.parent) this.scene.remove(fl);
          if (lit) {
            this.placeMatrix(fl, pl.dir, pl.F, pl.alt, pl.yaw);
            if (m < fireM) {
              fireM = m;
              fire = pl;
            }
          }
        }
      }
      for (const dr of this.world.drops) {
        const m = arcM(p, dr.dir, R),
          near = m < 160;
        if (near && !dr.mesh) {
          dr.mesh = this.dropMesh(dr);
          dr.F = frameAt(dr.dir);
        }
        if (!dr.mesh) continue;
        if (!near) {
          if (dr.mesh.parent) this.scene.remove(dr.mesh);
          continue;
        }
        if (!dr.mesh.parent) this.scene.add(dr.mesh);
        // (it is drawn already turned its own way: a log lies along where its tree fell)
        this.placeMatrix(dr.mesh, dr.dir, dr.F, dr.alt);
      }
      return fire;
    },
    // the lit fire and the work stone within reach, for making things; at home, the hearth, and whatever
    // the house-wright built in (an oven is a fire too, and the bench by the anvil a work stone)
    placesNear() {
      let fire = null,
        bench = null,
        oven = null,
        anvil = null,
        loom = null;
      if (!this.world) return { fire, bench, oven, anvil, loom };
      for (const pl of this.world.placed) {
        const m = arcM(this.p, pl.dir, this.R);
        if (
          pl.kind === "campfire" &&
          m < 3.5 &&
          (!fire || (pl.fuel || 0) > (fire.fuel || 0))
        )
          fire = pl;
        if (pl.kind === "workstone" && m < 3) bench = pl;
      }
      const v = this.homeHere ? this.homeHere() : null;
      if (v) {
        let hearth = null;
        for (const sp of v.spots) {
          const m = arcM(this.p, sp.dir, this.R);
          if (sp.kind === "hearth" && m < 3.2)
            hearth = { hearth: true, fuel: 99, kind: "hearth" };
          if (sp.kind !== "work" || m > 2.8) continue;
          if (sp.work === "oven") oven = { oven: true, fuel: 99, kind: "oven" };
          else if (sp.work === "forge") anvil = { anvil: true };
          else if (sp.work === "loom") loom = { loom: true };
        }
        if (!fire || (fire.fuel || 0) <= 0) fire = oven || hearth || fire;
        if (!bench && anvil) bench = { home: true };
      }
      return { fire, bench, oven, anvil, loom };
    },
    // how warm the nearest fire keeps you (°C), and whether a roof is over you
    shelterAt() {
      if (!this.world) return { fireC: 0, shelter: false };
      if (this.cave) return { fireC: 0, shelter: true };
      const R = this.R,
        p = this.p;
      let fireC = 0,
        shelter = false;
      // indoors: a roof and walls, and the hearth if there is one
      if (this.roomAt && this.roomAt()) {
        shelter = true;
        const h = this.lastHearth;
        if (h && h.inside)
          fireC = Math.max(
            fireC,
            24 * Math.max(0.35, Math.min(1, (6 - h.m) / 4)),
          );
      }
      for (const pl of this.world.placed) {
        const m = arcM(p, pl.dir, R);
        if (pl.kind === "campfire" && (pl.fuel || 0) > 0 && m < 7)
          fireC = Math.max(fireC, 26 * Math.max(0, Math.min(1, (7 - m) / 4.5)));
        if (pl.kind === "leanto" && m < 3) {
          // under the roof: behind the posts, within its width
          const F = pl.F || frameAt(pl.dir),
            d = [p[0] - pl.dir[0], p[1] - pl.dir[1], p[2] - pl.dir[2]];
          const x = pdot(d, F.e) * R,
            z = -pdot(d, F.n) * R,
            cs = Math.cos(pl.yaw),
            sn = Math.sin(pl.yaw);
          const u = x * cs + z * sn,
            w = -x * sn + z * cs;
          if (Math.abs(u) < 1.4 && w > -0.2 && w < 2.1) shelter = true;
        }
      }
      return { fireC, shelter };
    },

    // ---------- waking somewhere else ----------
    respawnAt(dir) {
      if (this.riding) this.getDown("home");
      if (this.cave) this.exitCave(true);
      this.p = dir.slice();
      this.vy = 0;
      this.journey = null;
      this.fade = 0;
      this.wake = { t0: -1 };
      this.ready = false;
      this.pitch = 0;
      this.eyeY =
        Math.max(0, this.ground.height(dir[0], dir[1], dir[2], 1)) + 0.35;
      if (this.fire) this.fire.visible = false;
      this.townsDirty = true;
    },
    // in town, in front of a house door: where someone who found you would put you to bed
    townWakeSpot(s) {
      const plan = townPlan(this.story, s),
        F = frameAt(s.dir);
      const b =
        plan.buildings.find((x) => !x.round && x !== plan.buildings[0]) ||
        plan.buildings[0];
      if (!b) return stepOn(s.dir, F, 6, 6, this.R);
      const off = (b.d || 4) / 2 + 2.4;
      const x = b.x - Math.sin(b.rot || 0) * off,
        z = b.z + Math.cos(b.rot || 0) * off;
      return stepOn(s.dir, F, x, -z, this.R);
    },

    // ---------- placing something: a see-through preview in front of you ----------
    startGhost(kind, opts = {}) {
      this.endGhost();
      if (kind === "home") {
        this.startHomeGhost(opts);
        return;
      }
      if (kind === "decor") {
        this.startDecorGhost(opts);
        return;
      }
      const pl = { kind, dir: this.p.slice(), yaw: 0 };
      const mesh = this.placedMesh(pl);
      const fl = mesh.userData.flames;
      if (fl) {
        fl.geometry.dispose();
        mesh.userData.flames = null;
      }
      mesh.material = this.ghostMat();
      this.scene.add(mesh);
      this.ghost = { kind, mesh, ok: true };
      // look down a little so you can see where it goes
      if (this.pitch > -0.3) this.pitch = -0.3;
      this.stepGhost();
    },
    // a whole house, see-through, standing where it would go: its door looks back at you
    startHomeGhost(opts) {
      const pseudo = {
        id: "ghost",
        kind: "home",
        dir: this.p.slice(),
        seed: 1,
        owner: opts.owner ?? -1,
        face: Math.PI,
        size: opts.size || "hut",
      };
      const plan = sitePlan(this.story, pseudo),
        b0 = plan.buildings[0];
      const kit = this.styleKit(plan.style),
        mb = new MeshBuf();
      houseInto(
        mb,
        {
          ...b0,
          x: 0,
          z: 0,
          rot: 0,
          base: 0,
          sink: 0.8,
          open: false,
          doorLight: null,
        },
        {
          ...kit.style,
          stilts: false,
          roofPitch: b0.round
            ? Math.max(0.6, kit.style.roofPitch)
            : kit.style.roofPitch,
        },
        kit.rows,
      );
      this.syncRamps();
      const mesh = this.meshOf(mb.finish(), this.ghostMat());
      this.scene.add(mesh);
      this.ghost = {
        kind: "home",
        mesh,
        ok: false,
        why: null,
        opts,
        b: b0,
        reach: plan.r,
      };
      if (this.pitch > -0.12) this.pitch = -0.12;
      this.stepGhost();
    },
    // can a house of yours stand here? Dry, flat, clear of towns, places and roads.
    homeSpot(dir, face, b, reach, ignore = null) {
      const R = this.R,
        F = frameAt(dir),
        rot = Math.atan2(-Math.sin(face), -Math.cos(face)),
        cs = Math.cos(rot),
        sn = Math.sin(rot);
      let lo = 1e9,
        hi = -1e9;
      for (const u of [-0.5, 0, 0.5])
        for (const v of [-0.5, 0, 0.5]) {
          const lx = u * b.w,
            lz = v * b.d,
            x = lx * cs - lz * sn,
            z = lx * sn + lz * cs;
          const q = stepOn(dir, F, x, -z, R),
            h = this.ground.height(q[0], q[1], q[2], 1);
          lo = Math.min(lo, h);
          hi = Math.max(hi, h);
        }
      const base = Math.max(hi, 0.3);
      if (this.cave) return { ok: false, why: "not down here", base };
      if (lo < 0.5)
        return { ok: false, why: "too wet. It needs dry ground", base };
      // a bigger house can take a little more slope: its door gets a step or two
      if (hi - lo > (b.w > 9 ? 1.0 : b.w > 6 ? 0.85 : 0.75))
        return { ok: false, why: "too steep. It needs flat ground", base };
      for (const s of this.story.settlements)
        if (arcM(dir, s.dir, R) < townRadius(s) + reach)
          return {
            ok: false,
            why: `too close to ${s.name}. The town’s land is spoken for`,
            base,
          };
      if (this.siteIx) {
        for (const s of this.siteIx
          .near(dir, 400, "all")
          .concat(this.homesNear(dir, 400))) {
          if (ignore && s.id === ignore) continue;
          const r = sitePlan(this.story, s).r || 8;
          if (s.m < r + reach + 1)
            return {
              ok: false,
              why:
                s.kind === "home"
                  ? "too close to your other house"
                  : `too close to ${siteName(this.story, s)}`,
              base,
            };
        }
        const road = this.siteIx.roadNear(dir, reach + 4);
        if (road && road.m < reach + 2)
          return { ok: false, why: "on the road. Somewhere beside it", base };
      }
      return { ok: true, why: null, base };
    },
    ghostMat() {
      if (this.ghostMaterial) return this.ghostMaterial;
      const T = this.T;
      this.ghostMaterial = new T.ShaderMaterial({
        uniforms: { ...this.uniforms, uBad: { value: 0 } },
        vertexShader: this.solidMat.vertexShader,
        fragmentShader: this.solidMat.fragmentShader
          .replace(
            "void main() {",
            "uniform float uBad;\nvoid main() {\n  if (mod(floor(gl_FragCoord.x) + floor(gl_FragCoord.y), 2.0) < 1.0) discard;",
          )
          .replace(
            /gl_FragColor = vec4\(applyFog\(col, glow \? vDist \* 0\.35 : vDist, b\), 1\.0\);/,
            "gl_FragColor = vec4(mix(applyFog(col, vDist, b), vec3(0.85, 0.2, 0.15), uBad * 0.6), 1.0);",
          ),
        side: T.DoubleSide,
      });
      return this.ghostMaterial;
    },
    stepGhost() {
      const g = this.ghost;
      if (!g) return;
      if (g.kind === "decor") {
        this.stepDecorGhost(g);
        return;
      }
      if (g.kind === "home") {
        const heading = -this.yaw,
          F = frameAt(this.p),
          dist = g.reach + 0.6;
        const dir = stepOn(
          this.p,
          F,
          Math.sin(heading) * dist,
          Math.cos(heading) * dist,
          this.R,
        );
        const face = heading + Math.PI;
        // the checks are not free: only again once it has moved or turned a little
        if (
          !g.chk ||
          arcM(g.chk.dir, dir, this.R) > 0.35 ||
          Math.abs(
            Math.atan2(
              Math.sin(face - g.chk.face),
              Math.cos(face - g.chk.face),
            ),
          ) > 0.06
        )
          g.chk = { ...this.homeSpot(dir, face, g.b, g.reach), dir, face };
        g.dir = dir;
        g.face = face;
        g.yaw = heading;
        g.ok = g.chk.ok;
        g.why = g.chk.why;
        this.ghostMaterial.uniforms.uBad.value = g.ok ? 0 : 1;
        this.placeMatrix(g.mesh, dir, frameAt(dir), g.chk.base, heading);
        return;
      }
      const heading = -this.yaw,
        F = frameAt(this.p),
        dist = g.kind === "leanto" ? 3.2 : 2.2;
      const dir = stepOn(
        this.p,
        F,
        Math.sin(heading) * dist,
        Math.cos(heading) * dist,
        this.R,
      );
      const alt = this.ground.height(dir[0], dir[1], dir[2], 1);
      // flat enough and not in water
      const F2 = frameAt(dir);
      let lo = alt,
        hi = alt;
      for (const [e, n] of [
        [1, 0],
        [-1, 0],
        [0, 1],
        [0, -1],
      ]) {
        const q = stepOn(dir, F2, e * 0.9, n * 0.9, this.R);
        const h = this.ground.height(q[0], q[1], q[2], 1);
        lo = Math.min(lo, h);
        hi = Math.max(hi, h);
      }
      // nothing standing where it would go (looked at again only once it has moved a little)
      const r = g.kind === "leanto" ? 1.35 : 0.6;
      if (!g.inWay || arcM(g.inWay.dir, dir, this.R) > 0.15)
        g.inWay = { dir, what: this.somethingAt(dir, r) };
      g.ok = alt > 0.2 && hi - lo < 0.7 && !g.inWay.what;
      g.why =
        alt <= 0.2
          ? "too wet"
          : hi - lo >= 0.7
            ? "too steep"
            : g.inWay.what
              ? `${g.inWay.what} is in the way`
              : null;
      // its open side (−z) faces you
      g.dir = dir;
      g.alt = alt;
      g.yaw = heading + Math.PI;
      this.ghostMaterial.uniforms.uBad.value = g.ok ? 0 : 1;
      this.placeMatrix(g.mesh, dir, F2, alt, g.yaw);
    },
    // what stands within r of a spot on the ground, if anything: a tree, a rock, a wall, someone, or
    // something you set down yourself (for putting things down)
    somethingAt(dir, r) {
      const R = this.R;
      const local = (c, F) => {
        const d0 = dir[0] - c[0],
          d1 = dir[1] - c[1],
          d2 = dir[2] - c[2];
        return [
          (d0 * F.e[0] + d1 * F.e[1] + d2 * F.e[2]) * R,
          -(d0 * F.n[0] + d1 * F.n[1] + d2 * F.n[2]) * R,
        ];
      };
      const WHAT = {
        tree: "a tree",
        rock: "a rock",
        stump: "a stump",
        cactus: "a cactus",
        cap: "a great mushroom",
        shrub: "a bush",
      };
      const posts = (col, c, F, kinds) => {
        if (!col || !col.length) return null;
        const [lx, lz] = local(c, F);
        for (let k = 0; k < col.length; k += 6)
          if (
            Math.abs(lx - col[k]) < col[k + 2] + r &&
            Math.abs(lz - col[k + 1]) < col[k + 2] + r &&
            Math.hypot(lx - col[k], lz - col[k + 1]) < col[k + 2] + r
          )
            return (kinds && WHAT[kinds[k / 6]]) || "something";
        return null;
      };
      const walls = (boxes, c, F) => {
        if (!boxes || !boxes.length) return false;
        const [lx, lz] = local(c, F);
        for (const bx of boxes) {
          if (bx.walk) continue;
          const x = lx - bx.x,
            z = lz - bx.z,
            u = x * bx.cs + z * bx.sn,
            w = -x * bx.sn + z * bx.cs;
          if (Math.abs(u) < bx.hx + r && Math.abs(w) < bx.hz + r) return true;
        }
        return false;
      };
      for (const ch of this.colChunks) {
        if (arcM(dir, ch.c, R) > ch.span * 0.75 + 6) continue;
        const w = posts(ch.col, ch.c, ch.F, ch.colKind);
        if (w) return w;
      }
      for (const tw of this.towns ? this.towns.values() : []) {
        if (arcM(dir, tw.s.dir, R) > 400) continue;
        if (posts(tw.col, tw.s.dir, tw.F) || walls(tw.boxes, tw.s.dir, tw.F))
          return "something";
      }
      if (this.siteViews)
        for (const v of this.siteViews.values()) {
          if (arcM(dir, v.site.dir, R) > v.reach) continue;
          if (posts(v.col, v.site.dir, v.F) || walls(v.boxes, v.site.dir, v.F))
            return "something";
        }
      const folk = [this.npc];
      for (const tw of this.towns ? this.towns.values() : [])
        folk.push(...tw.folk);
      if (this.siteViews)
        for (const v of this.siteViews.values()) folk.push(...v.folk);
      for (const f of folk)
        if (f && f.mesh && f.mesh.visible && arcM(dir, f.dir, R) < r + 0.35)
          return "someone";
      if (this.world)
        for (const pl of this.world.placed)
          if (arcM(dir, pl.dir, R) < r + (pl.kind === "leanto" ? 1.35 : 0.6))
            return "something";
      return null;
    },
    endGhost() {
      const g = this.ghost;
      if (!g) return;
      for (const m of g.meshes ? Object.values(g.meshes) : [g.mesh])
        if (m) {
          this.scene.remove(m);
          m.geometry.dispose();
        }
      this.ghost = null;
    },

    // ---------- what is in your hands ----------
    // Nothing is drawn in your hands: a tool is simply something you have. A torch
    // shows only as its light; a blow shows as a swipe and a jolt of the view.
    setHeld(mainId, offId) {
      const lit = (id) => id === "torch" || id === "pitchtorch";
      this.heldTorch = lit(offId) || lit(mainId);
    },
    swing() {
      this.swingT = 0;
    },
    jolt(k = 1) {
      this.joltT = 0;
      this.joltK = k;
    },
    // a blow landing: what you hit stops dead for a moment (it gives the blow its weight)
    hitStopFor(s) {
      this.hitStop = Math.max(this.hitStop || 0, s);
    },
    // where a point is in the view (on the ground at dir, up metres above the sea), as parts of it (0..1); null if behind you
    screenAt(dir, up = 0) {
      const V = this.view,
        R = this.R,
        F = frameAt(dir);
      if (!V) return null;
      const c = [
        dir[0] * R - V.O[0] + F.u[0] * up,
        dir[1] * R - V.O[1] + F.u[1] * up,
        dir[2] * R - V.O[2] + F.u[2] * up,
      ];
      const d3 = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
      const v = (this._sv || (this._sv = new this.T.Vector3())).set(
        d3(c, V.F.e),
        d3(c, V.F.u),
        -d3(c, V.F.n),
      );
      this.camera.updateMatrixWorld();
      v.project(this.camera);
      if (!(v.z < 1 && v.z > -1)) return null;
      return { x: (v.x + 1) / 2, y: (1 - v.y) / 2 };
    },
    // how far the view dips and shakes this frame (radians of pitch, metres of sway)
    stepHeld(dt) {
      let dip = 0,
        sway = 0;
      if (this.swingT >= 0) {
        this.swingT += dt;
        const t = this.swingT / 0.42;
        dip =
          t < 0.45
            ? -0.035 * Math.sin(((t / 0.45) * Math.PI) / 2)
            : -0.035 * (1 - (t - 0.45) / 0.55);
        if (t >= 1) this.swingT = -1;
      }
      if (this.joltT >= 0) {
        this.joltT += dt;
        const t = this.joltT / 0.16;
        sway = Math.sin(t * Math.PI * 3) * 0.012 * (1 - t) * (this.joltK || 1);
        if (t >= 1) this.joltT = -1;
      }
      return { dip, sway };
    },
  });

  // ---- view/siteview.js ----
  // ============================================================
  // SITE VIEW — the places between towns, on the ground. A place near you is
  // built once from its plan: houses in its people's way, fields and fences,
  // stones and ruins, pools and old bones. Its folk walk about, and what you
  // can use there waits for you to look at it. Further off, a place is only
  // its smoke by day and its lights at night, drawn a pixel or two wide so
  // you can see where people live from far away. Hills hide them.
  // ============================================================

  // a cave's way in under its knoll (m), and the knoll's cliff over the mouth (m)
