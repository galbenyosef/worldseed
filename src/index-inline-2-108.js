// index-inline-2 108 — math
// Lines 55048-56334 of readable/index-inline-2.pretty.js (statement-aligned).
  Object.assign(GroundView.prototype, {
    caveRowsGet() {
      if (this.cRows && this.cRowsFor === this.ramps) return this.cRows;
      const r = (c) => this.row(c);
      this.cRowsFor = this.ramps;
      this.cRows = {
        wall: r([94, 88, 92]),
        floor: r([82, 74, 68]),
        mud: r([62, 54, 48]),
        ceil: r([76, 72, 78]),
        stone: r([120, 114, 110]),
        wet: r([92, 98, 104]),
        flow: r([178, 156, 126]),
        flowDark: r([138, 116, 92]),
        crystal: r([176, 214, 236]),
        crystalHi: r([236, 250, 255]),
        ore: r([158, 92, 54]),
        oreDark: r([92, 70, 60]),
        cap: r([228, 222, 204]),
        stem: r([200, 192, 170]),
        fox: r([168, 232, 206]),
        wrap: r([170, 152, 118]),
        wrapDark: r([118, 102, 78]),
        dry: r([84, 60, 44]),
        bone: r([226, 218, 196]),
        ochre: r([176, 72, 44]),
        white: r([222, 214, 196]),
        char: r([30, 26, 28]),
        water: r([40, 74, 94]),
        hide: r([150, 116, 80]),
        pot: r([160, 98, 64]),
        copper: r([92, 150, 120]),
        wood: r([96, 70, 48]),
        timber: r([124, 92, 60]),
        lampGlow: r([255, 226, 150]),
        iron: r([70, 70, 80]),
        rail: r([96, 92, 94]),
      };
      return this.cRows;
    },

    // ---------- the cave's rock: one smooth skin round the hollow (built once a visit) ----------
    buildCaveRock(P) {
      const T = this.T,
        R = this.caveRowsGet();
      const s = P.surf || (P.surf = caveSurface(P));
      const nv = s.pos.length / 3;
      const geo = new T.BufferGeometry();
      const one = (v) => new T.BufferAttribute(new Float32Array(nv).fill(v), 1);
      geo.setAttribute("position", new T.BufferAttribute(s.pos, 3));
      geo.setAttribute("normal", new T.BufferAttribute(s.nrm, 3));
      geo.setAttribute("aRow", one(R.wall));
      geo.setAttribute("aRow2", one(R.floor));
      geo.setAttribute(
        "aUv",
        new T.BufferAttribute(new Float32Array(nv * 2), 2),
      );
      geo.setAttribute("aPat", one(PAT.CAVEROCK));
      geo.setAttribute("aLv", new T.BufferAttribute(s.ao, 1));
      geo.setIndex(new T.BufferAttribute(s.idx, 1));
      geo.computeBoundingSphere();
      this.syncRamps();
      const mesh = new T.Mesh(geo, this.caveMatGet());
      mesh.frustumCulled = false;
      return mesh;
    },
    caveMatGet() {
      const T = this.T;
      if (!this.caveMat) {
        this.caveU = {
          ...this.uniforms,
          uMouth: { value: new T.Vector4(0, 0, 0, 0) },
          uOut: { value: new T.Vector3(0.5, 0.6, 0.7) },
        };
        this.caveMat = new T.ShaderMaterial({
          uniforms: this.caveU,
          vertexShader: CAVE_VS,
          fragmentShader: CAVE_FS,
          side: T.DoubleSide,
        });
      }
      return this.caveMat;
    },

    // ---------- what is down there, and the day at the mouth, as one mesh ----------
    buildCaveMesh(P, taken) {
      const T = this.T,
        R = this.caveRowsGet(),
        mb = new MeshBuf();
      P.lamps = [];
      const s = P.surf || (P.surf = caveSurface(P));
      const crnd = mulberry32((P.seed ^ 0x51ab) >>> 0);
      // the day beyond the mouth, on the quads that close it
      if (s.day.length) {
        let y0 = 1e9,
          y1 = -1e9;
        for (const p of s.day) {
          y0 = Math.min(y0, p[1]);
          y1 = Math.max(y1, p[1]);
        }
        const uv = (p) => [p[0], (p[1] - y0) / Math.max(1, y1 - y0)];
        for (let k = 0; k < s.day.length; k += 4) {
          const q = s.day.slice(k, k + 4);
          mb.quad(q[0], q[1], q[2], q[3], R.wall, PAT.DAYLIGHT, q.map(uv));
        }
      }
      // stones fallen at the foot of the walls, on the floor as it is drawn
      for (let j = 0; j < P.H; j++)
        for (let i = 0; i < P.W; i++) {
          if (!P.carved[j * P.W + i] || P.dist[j * P.W + i] > 0.5) continue;
          const cx = i + P.ox + 0.5,
            cz = j + P.oz + 0.5;
          if (cz >= -1 || crnd() >= 0.09) continue;
          const a = crnd() * 6.28,
            sz = 0.14 + crnd() * 0.24,
            x = cx + Math.cos(a) * 0.25,
            z = cz + Math.sin(a) * 0.25;
          lumpInto(
            mb,
            x,
            s.floorAt(x, z) - sz * 0.2,
            z,
            sz,
            sz * 0.7,
            sz * 0.9,
            R.stone,
            R.stone,
            Math.floor(crnd() * 1e6),
            a,
          );
        }
      const posts = [];
      const fl = (x, z) => caveFloor(P, x, z),
        cl = (x, z) => caveCeil(P, x, z);
      const spots = [];
      for (const t of P.things) {
        const rnd = mulberry32((t.seed || 1) >>> 0),
          x = t.x,
          z = t.z;
        const gone = t.id && taken(t.id);
        switch (t.t) {
          case "stalagmite": {
            const f = fl(x, z),
              h = 0.5 + 1.4 * t.s;
            mb.cone(
              [x, f - 0.1, z],
              f + h,
              0.2 + 0.26 * t.s,
              7,
              R.flow,
              PAT.FLOWSTONE,
              { row2: R.flowDark },
              0,
              0,
              rnd(),
            );
            posts.push([x, z, 0.18 + 0.2 * t.s]);
            break;
          }
          case "column": {
            const f = fl(x, z),
              c = cl(x, z),
              r0 = 0.35 + 0.3 * t.s;
            mb.prism(
              [x, f - 0.1, z],
              [x, c + 0.6, z],
              r0,
              r0 * 0.85,
              8,
              R.flow,
              PAT.FLOWSTONE,
              { row2: R.flowDark },
            );
            mb.cone(
              [x, f - 0.05, z],
              f + 0.9,
              r0 * 1.8,
              8,
              R.flow,
              PAT.FLOWSTONE,
              { row2: R.flowDark },
            );
            mb.prism(
              [x, c - 1.0, z],
              [x, c + 0.6, z],
              r0 * 0.9,
              r0 * 1.9,
              8,
              R.flow,
              PAT.FLOWSTONE,
              { row2: R.flowDark },
            );
            posts.push([x, z, r0 + 0.1]);
            break;
          }
          case "stalactite": {
            const c = cl(x, z);
            mb.prism(
              [x, c + 0.55, z],
              [x, c - 0.45 - 1.0 * t.s, z],
              0.14 + 0.16 * t.s,
              0.015,
              6,
              R.flow,
              PAT.FLOWSTONE,
              { row2: R.flowDark },
            );
            break;
          }
          case "pool": {
            const y = fl(x, z) + 0.42,
              n = 14;
            for (let k = 0; k < n; k++) {
              const a0 = (k / n) * 6.283,
                a1 = ((k + 1) / n) * 6.283;
              mb.tri(
                [x, y, z],
                [x + Math.cos(a1) * t.r, y, z + Math.sin(a1) * t.r],
                [x + Math.cos(a0) * t.r, y, z + Math.sin(a0) * t.r],
                R.water,
                PAT.POOL,
              );
            }
            spots.push({
              kind: "pool",
              x,
              z,
              y: y + 0.1,
              r: t.r * 0.7,
              thing: t,
            });
            break;
          }
          case "crystals": {
            if (!gone) {
              const f = fl(x, z);
              for (let k = 0; k < t.n; k++) {
                const a = rnd() * 6.28,
                  lean = 0.2 + rnd() * 0.7,
                  L = 0.35 + rnd() * 0.75,
                  r0 = 0.05 + rnd() * 0.07;
                const bx = x + Math.cos(a) * 0.18 * rnd(),
                  bz = z + Math.sin(a) * 0.18 * rnd();
                mb.prism(
                  [bx, f - 0.05, bz],
                  [
                    bx + Math.cos(a) * Math.sin(lean) * L,
                    f + Math.cos(lean) * L,
                    bz + Math.sin(a) * Math.sin(lean) * L,
                  ],
                  r0,
                  0.01,
                  5,
                  R.crystal,
                  PAT.CRYSTAL,
                  { row2: R.crystalHi },
                  0,
                  false,
                );
              }
              posts.push([x, z, 0.35]);
            }
            spots.push({
              kind: "crystals",
              x,
              z,
              y: fl(x, z) + 0.45,
              r: 0.5,
              thing: t,
              gone,
            });
            break;
          }
          case "ore": {
            // lumps of it standing out of the wall, as the wall is drawn
            const f = fl(t.sx, t.sz),
              ux = Math.cos(t.face),
              uz = Math.sin(t.face);
            const hit = caveWallHit(P, t.sx, t.sz, ux, uz, 4) || {
              x: t.sx + ux * 0.8,
              z: t.sz + uz * 0.8,
              tx: -uz,
              tz: ux,
            };
            if (!gone)
              for (let k = 0; k < 7; k++) {
                const h = 0.6 + rnd() * 1.1,
                  sp = (rnd() - 0.5) * 1.1;
                lumpInto(
                  mb,
                  hit.x + ux * 0.06 + hit.tx * sp,
                  f + h,
                  hit.z + uz * 0.06 + hit.tz * sp,
                  0.16,
                  0.12,
                  0.16,
                  k % 2 ? R.ore : R.oreDark,
                  R.copper,
                  Math.floor(rnd() * 1e6),
                  rnd() * 6,
                );
              }
            spots.push({
              kind: "ore",
              x: hit.x - ux * 0.5,
              z: hit.z - uz * 0.5,
              y: f + 1.1,
              r: 0.6,
              thing: t,
              gone,
            });
            break;
          }
          case "mushrooms": {
            const f = fl(x, z);
            if (!gone)
              for (let k = 0; k < 9; k++) {
                const a = rnd() * 6.28,
                  d = rnd() * 0.55,
                  mx = x + Math.cos(a) * d,
                  mz = z + Math.sin(a) * d,
                  h = 0.06 + rnd() * 0.12,
                  r0 = 0.04 + rnd() * 0.06;
                mb.prism(
                  [mx, f - 0.02, mz],
                  [mx, f + h, mz],
                  0.015,
                  0.012,
                  4,
                  R.stem,
                  PAT.FOXFIRE,
                  { row2: R.stem },
                );
                mb.cone(
                  [mx, f + h - 0.01, mz],
                  f + h + r0 * 0.7,
                  r0,
                  6,
                  R.cap,
                  PAT.FOXFIRE,
                  { row2: R.fox },
                );
              }
            spots.push({
              kind: "mushrooms",
              x,
              z,
              y: f + 0.15,
              r: 0.45,
              thing: t,
              gone,
            });
            break;
          }
          case "oldcamp": {
            const f = fl(x, z);
            for (let k = 0; k < 8; k++) {
              const a = (k / 8) * 6.28;
              lumpInto(
                mb,
                x + Math.cos(a) * 0.5,
                f - 0.04,
                z + Math.sin(a) * 0.5,
                0.12,
                0.08,
                0.1,
                R.stone,
                R.stone,
                k + 3,
                a,
              );
            }
            mb.prism(
              [x, f - 0.02, z],
              [x, f + 0.02, z],
              0.4,
              0.4,
              8,
              R.char,
              PAT.NONE,
              null,
              0,
              true,
            );
            // a rotted bedroll and a pack someone left
            const bx = x + 1.3,
              bz = z + 0.3;
            mb.box(
              bx - 0.4,
              f,
              bz - 0.95,
              bx + 0.4,
              f + 0.12,
              bz + 0.95,
              R.hide,
              PAT.HIDE,
              { lv: -0.3 },
            );
            if (!gone)
              mb.box(
                x - 1.2,
                f,
                z - 0.2,
                x - 0.8,
                f + 0.45,
                z + 0.2,
                R.hide,
                PAT.HIDE,
              );
            spots.push({
              kind: "oldcamp",
              x: x - 0.4,
              z,
              y: f + 0.4,
              r: 0.7,
              thing: t,
              gone,
            });
            break;
          }
          case "painting": {
            // the wall behind, as it is drawn, and on it: hunters, a great beast, handprints, a sun.
            // Every mark is laid on the rock where it is, so the picture follows the wall's curve.
            const a = t.face + Math.PI,
              ux = Math.cos(a),
              uz = Math.sin(a);
            const hit = caveWallHit(P, x - ux * 1.5, z - uz * 1.5, ux, uz, 8);
            if (!hit) break;
            const tx = hit.tx,
              tz = hit.tz,
              f = fl(hit.x - ux * 0.3, hit.z - uz * 0.3);
            const mark = (u, h, w, hh, row = R.ochre) => {
              const h2 = caveWallHit(
                P,
                hit.x + tx * u - ux * 1.2,
                hit.z + tz * u - uz * 1.2,
                ux,
                uz,
                3,
              );
              if (!h2) return;
              const cx = h2.x - ux * 0.05,
                cz = h2.z - uz * 0.05,
                ex = h2.tx,
                ez = h2.tz;
              mb.quad(
                [cx - ex * w, f + h, cz - ez * w],
                [cx + ex * w, f + h, cz + ez * w],
                [cx + ex * w, f + h + hh, cz + ez * w],
                [cx - ex * w, f + h + hh, cz - ez * w],
                row,
                PAT.NONE,
                null,
                { lv: -0.2 },
              );
            };
            // handprints
            for (let k = 0; k < 9; k++)
              mark(
                -1.0 + rnd() * 2.0,
                1.45 + rnd() * 0.75,
                0.05,
                0.1,
                rnd() < 0.3 ? R.white : R.ochre,
              );
            // a beast: body, legs, head, horns
            mark(0.15, 1.15, 0.36, 0.18);
            for (const u of [-0.12, 0.0, 0.3, 0.42]) mark(u, 0.93, 0.02, 0.22);
            mark(0.58, 1.27, 0.09, 0.1);
            mark(0.64, 1.38, 0.015, 0.08, R.white);
            // the hunters, with spears
            for (let k = 0; k < 3; k++) {
              const u = -0.85 + k * 0.24;
              mark(u, 1.02, 0.022, 0.26);
              mark(u, 1.29, 0.04, 0.05);
              mark(u + 0.08, 1.18, 0.1, 0.012);
            }
            // a sun
            mark(-0.45, 1.95, 0.08, 0.14, R.white);
            spots.push({
              kind: "painting",
              x: hit.x - ux * 0.7,
              z: hit.z - uz * 0.7,
              y: f + 1.35,
              r: 1.0,
              thing: t,
            });
            break;
          }
          case "bones": {
            const f = fl(x, z),
              L = t.l,
              ca = Math.cos(t.rot),
              sa = Math.sin(t.rot);
            const at = (u, y, v) => [
              x + u * ca - v * sa,
              f + y,
              z + u * sa + v * ca,
            ];
            mb.prism(
              at(-L / 2, 0.15, 0),
              at(L / 2, 0.2, 0),
              0.06,
              0.05,
              5,
              R.bone,
              PAT.NONE,
            );
            for (let k = 1; k < 6; k++) {
              const u = -L / 2 + (k * L) / 7;
              for (const sd of [-1, 1])
                mb.prism(
                  at(u, 0.18, 0),
                  at(u + 0.05, 0.05, sd * 0.32),
                  0.03,
                  0.025,
                  4,
                  R.bone,
                  PAT.NONE,
                );
            }
            const q = at(L / 2 + 0.25, 0.12, 0);
            mb.box(
              q[0] - 0.16,
              f,
              q[2] - 0.12,
              q[0] + 0.16,
              f + 0.24,
              q[2] + 0.12,
              R.bone,
              PAT.NONE,
            );
            spots.push({
              kind: "bones",
              x,
              z,
              y: f + 0.3,
              r: 0.9,
              thing: t,
              gone,
            });
            break;
          }
          case "dead": {
            // a shelf of stone along the wall, and on it someone wrapped for burial, laid on their back
            const f = fl(x, z),
              fa = t.face,
              Ux = -Math.sin(fa),
              Uz = Math.cos(fa),
              Vx = Math.cos(fa),
              Vz = Math.sin(fa);
            const sx = x + Math.cos(fa + Math.PI) * 0.15,
              sz = z + Math.sin(fa + Math.PI) * 0.15,
              top = 0.55;
            const at = (u, y, v) => [
              sx + u * Ux + v * Vx,
              f + y,
              sz + u * Uz + v * Vz,
            ];
            oboxInto(
              mb,
              at,
              -1.15,
              1.15,
              -0.15,
              top,
              -0.45,
              0.45,
              R.stone,
              PAT.STONE,
              { lv: -0.25 },
            );
            posts.push(
              [sx + Ux * 0.6, sz + Uz * 0.6, 0.55],
              [sx - Ux * 0.6, sz - Uz * 0.6, 0.55],
            );
            spots.push({
              kind: "dead",
              x: sx,
              z: sz,
              y: f + top + 0.2,
              r: 0.8,
              thing: t,
            });
            break;
          }
          case "lord": {
            // a bier in the middle of the chamber, with a step round it, carved along its sides
            const f = fl(x, z),
              ax = Math.cos(t.face),
              az = Math.sin(t.face),
              bx = -az,
              bz = ax;
            const at = (u, y, v) => [
              x + u * ax + v * bx,
              f + y,
              z + u * az + v * bz,
            ];
            oboxInto(
              mb,
              at,
              -1.45,
              1.45,
              -0.15,
              0.22,
              -0.8,
              0.8,
              R.stone,
              PAT.STONE,
              { lv: -0.2 },
            );
            oboxInto(
              mb,
              at,
              -1.2,
              1.2,
              0.2,
              0.75,
              -0.55,
              0.55,
              R.stone,
              PAT.STONE,
              { lv: -0.1 },
            );
            for (let k = 0; k < 5; k++) {
              const u = -0.9 + k * 0.45;
              for (const sd of [-1, 1]) {
                const q = at(u, 0.48, sd * 0.56);
                mb.quad(
                  [q[0] - ax * 0.12, q[1] - 0.1, q[2] - az * 0.12],
                  [q[0] + ax * 0.12, q[1] - 0.1, q[2] + az * 0.12],
                  [q[0] + ax * 0.12, q[1] + 0.1, q[2] + az * 0.12],
                  [q[0] - ax * 0.12, q[1] - 0.1 + 0.2, q[2] - az * 0.12],
                  R.ochre,
                  PAT.NONE,
                  null,
                  { lv: -0.5 },
                );
              }
            }
            posts.push(
              [x + ax * 0.7, z + az * 0.7, 0.62],
              [x - ax * 0.7, z - az * 0.7, 0.62],
            );
            spots.push({ kind: "lord", x, z, y: f + 0.95, r: 1.0, thing: t });
            break;
          }
          // ---- a mine's own: timbers holding the roof up, lamps on them, rails, a cart ----
          case "timber": {
            const px = Math.cos(t.a),
              pz = Math.sin(t.a),
              w = t.r;
            let top = 1e9;
            for (const su of [-1, 1]) {
              const qx = x + px * su * w,
                qz = z + pz * su * w,
                f = fl(qx, qz),
                c = cl(qx, qz);
              top = Math.min(top, c);
              mb.prism(
                [qx, f - 0.1, qz],
                [qx, c + 0.3, qz],
                0.11,
                0.1,
                4,
                R.timber,
                PAT.BARK,
              );
              posts.push([qx, qz, 0.14]);
            }
            const cy = Math.min(top, fl(x, z) + 2.4) - 0.1;
            mb.prism(
              [x - px * (w + 0.15), cy, z - pz * (w + 0.15)],
              [x + px * (w + 0.15), cy, z + pz * (w + 0.15)],
              0.13,
              0.13,
              4,
              R.timber,
              PAT.BARK,
            );
            break;
          }
          case "lamp": {
            const px = Math.cos(t.a),
              pz = Math.sin(t.a),
              qx = x + px * (t.r - 0.12),
              qz = z + pz * (t.r - 0.12),
              f = fl(qx, qz),
              y = Math.min(cl(qx, qz) - 0.5, f + 2.0);
            mb.prism(
              [qx, y + 0.3, qz],
              [qx, y + 0.55, qz],
              0.012,
              0.012,
              3,
              R.iron,
              PAT.NONE,
            );
            mb.box(
              qx - 0.1,
              y,
              qz - 0.1,
              qx + 0.1,
              y + 0.28,
              qz + 0.1,
              R.lampGlow,
              PAT.GLOW,
              { row2: R.lampGlow },
            );
            mb.box(
              qx - 0.12,
              y + 0.28,
              qz - 0.12,
              qx + 0.12,
              y + 0.32,
              qz + 0.12,
              R.iron,
              PAT.NONE,
            );
            (P.lamps || (P.lamps = [])).push([qx, y + 0.1, qz]);
            break;
          }
          case "rails": {
            const L = t.pts;
            for (let k = 0; k < L.length - 1; k++) {
              const [ax, az] = L[k],
                [bx, bz] = L[k + 1],
                dx = bx - ax,
                dz = bz - az,
                d = Math.hypot(dx, dz) || 1,
                nx = -dz / d,
                nz = dx / d;
              for (const su of [-0.42, 0.42])
                mb.prism(
                  [ax + nx * su, fl(ax, az) + 0.1, az + nz * su],
                  [bx + nx * su, fl(bx, bz) + 0.1, bz + nz * su],
                  0.03,
                  0.03,
                  4,
                  R.rail,
                  PAT.NONE,
                );
              if (k % 1 === 0)
                mb.prism(
                  [ax - nx * 0.6, fl(ax, az) + 0.04, az - nz * 0.6],
                  [ax + nx * 0.6, fl(ax, az) + 0.04, az + nz * 0.6],
                  0.05,
                  0.05,
                  4,
                  R.timber,
                  PAT.BARK,
                );
            }
            break;
          }
          case "cart": {
            const f = fl(x, z),
              ca = Math.cos(t.a),
              sa = Math.sin(t.a);
            const P2 = (u, y, w) => [
              x + u * ca - w * sa,
              y,
              z + u * sa + w * ca,
            ];
            const c4 = [
              P2(-0.55, 0, -0.8),
              P2(0.55, 0, -0.8),
              P2(0.55, 0, 0.8),
              P2(-0.55, 0, 0.8),
            ];
            for (let k = 0; k < 4; k++) {
              const a = c4[k],
                b = c4[(k + 1) % 4];
              mb.quad(
                [a[0], f + 0.3, a[2]],
                [b[0], f + 0.3, b[2]],
                [b[0], f + 0.95, b[2]],
                [a[0], f + 0.95, a[2]],
                R.wood,
                PAT.PLANK,
              );
            }
            mb.quad(
              [c4[0][0], f + 0.3, c4[0][2]],
              [c4[3][0], f + 0.3, c4[3][2]],
              [c4[2][0], f + 0.3, c4[2][2]],
              [c4[1][0], f + 0.3, c4[1][2]],
              R.wood,
              PAT.PLANK,
            );
            for (const [u, w] of [
              [-0.6, -0.5],
              [0.6, -0.5],
              [-0.6, 0.5],
              [0.6, 0.5],
            ]) {
              const q = P2(u, f + 0.22, w);
              mb.prism(
                [q[0] - ca * 0.05, q[1], q[2] - sa * 0.05],
                [q[0] + ca * 0.05, q[1], q[2] + sa * 0.05],
                0.2,
                0.2,
                8,
                R.iron,
                PAT.NONE,
                null,
                0,
                true,
              );
            }
            const r2 = mulberry32((t.seed || 3) >>> 0);
            for (let k = 0; k < 5; k++)
              lumpInto(
                mb,
                x + (r2() - 0.5) * 0.6,
                f + 0.85,
                z + (r2() - 0.5) * 0.9,
                0.17,
                0.13,
                0.16,
                k % 2 ? R.ore : R.oreDark,
                R.copper,
                Math.floor(r2() * 1e6),
                r2() * 6,
              );
            posts.push([x, z, 0.85]);
            break;
          }
          case "gravegoods": {
            const f = fl(x, z);
            if (!gone) {
              for (let k = 0; k < 4; k++) {
                const a = k * 1.7,
                  px = x + Math.cos(a) * 0.4,
                  pz = z + Math.sin(a) * 0.4,
                  h = 0.25 + (k % 2) * 0.12;
                mb.prism(
                  [px, f, pz],
                  [px, f + h, pz],
                  0.1,
                  0.07,
                  7,
                  R.pot,
                  PAT.NONE,
                  null,
                  0,
                  true,
                );
              }
              mb.box(
                x - 0.25,
                f,
                z - 0.18,
                x + 0.25,
                f + 0.28,
                z + 0.18,
                R.wood,
                PAT.PLANK,
              );
              mb.box(
                x - 0.26,
                f + 0.2,
                z - 0.19,
                x + 0.26,
                f + 0.23,
                z + 0.19,
                R.copper,
                PAT.NONE,
              );
            }
            spots.push({
              kind: "gravegoods",
              x,
              z,
              y: f + 0.3,
              r: 0.6,
              thing: t,
              gone,
            });
            break;
          }
        }
      }
      // the way out
      spots.push({ kind: "mouth", x: 0, z: -0.5, y: 1.2, r: 1.6 });
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
      const mesh = new T.Mesh(geo, this.caveMatGet());
      mesh.frustumCulled = false;
      return { mesh, posts, spots };
    },

    // ---------- in and out ----------
    enterCave(v) {
      if (this.cave || !v || !v.mouth) return;
      const T = this.T,
        s = v.site;
      // (a cave the story has a use for is laid out for it: the dead keep what was buried with them)
      const P = cavePlan(
        s.seed >>> 0,
        (this.caveOpts && this.caveOpts(s)) || {},
      );
      // (the way out is drawn about the shape of the mouth you came in by)
      P.mouth = { w: v.mouth.w, h: v.mouth.h };
      const taken = (id) => !!(this.caveTaken && this.caveTaken(s.id, id));
      const built = this.buildCaveMesh(P, taken),
        rock = this.buildCaveRock(P);
      if (!this.caveScene) {
        this.caveScene = new T.Scene();
        this.caveFade = new T.Mesh(
          new T.PlaneGeometry(2, 2),
          this.fadeMesh.material,
        );
        this.caveFade.frustumCulled = false;
        this.caveFade.renderOrder = 1000;
        this.caveScene.add(this.caveFade);
      }
      this.caveScene.add(built.mesh);
      this.caveScene.add(rock);
      // which way you were going, relative to the way in
      const inward = (s.face ?? 0) + Math.PI,
        rel = -this.yaw - inward;
      this.cave = {
        site: s,
        view: v,
        plan: P,
        mesh: built.mesh,
        rock,
        posts: built.posts,
        spots: built.spots,
        x: 0,
        z: -0.9,
        vy: 0,
        inward,
      };
      this.cave.y = caveFloor(P, 0, -0.9);
      this.cave.eyeY = this.cave.y + CAVE_EYE;
      this.yaw = -rel;
      this.fade = 1;
      this.rootedUntil = 0;
      this.lastFoe = null;
      // what hunted you outside loses your scent in here; an arrow still in the air comes down where it will
      if (this.clearHostiles) this.clearHostiles();
      if (this.clearArrows) this.clearArrows();
      if (this.makeFoes) this.makeFoes();
      if (this.onCave) this.onCave("in", s);
    },
    // build the cave again (something was taken)
    refreshCave() {
      const C = this.cave;
      if (!C) return;
      this.caveScene.remove(C.mesh);
      C.mesh.geometry.dispose();
      const built = this.buildCaveMesh(
        C.plan,
        (id) => !!(this.caveTaken && this.caveTaken(C.site.id, id)),
      );
      C.mesh = built.mesh;
      C.posts = built.posts;
      C.spots = built.spots;
      this.caveScene.add(C.mesh);
    },
    exitCave(now = false) {
      const C = this.cave;
      if (!C) return;
      if (this.dropFoes) this.dropFoes();
      this.cave = null;
      this.caveScene.remove(C.mesh);
      C.mesh.geometry.dispose();
      this.caveScene.remove(C.rock);
      C.rock.geometry.dispose();
      if (now) return;
      // out of the mouth, facing out the way you came walking
      const v = C.view,
        m = v.mouth,
        s = C.site,
        F = v.F || frameAt(s.dir);
      const cs = Math.cos(m.rot),
        sn = Math.sin(m.rot),
        w = 2.0;
      const x = m.x - w * sn,
        z = m.z + w * cs;
      this.p = stepOn(s.dir, F, x, -z, this.R);
      this.vy = 0;
      this.onGround = true;
      this.eyeY =
        Math.max(0, this.ground.height(this.p[0], this.p[1], this.p[2], 1)) +
        CAVE_EYE;
      this.yaw = -(C.inward + -this.yaw);
      this.fade = 1;
      this.townsDirty = true;
      if (this.onCave) this.onCave("out", s);
    },
    // walking into the dark of a cave's mouth takes you in
    checkCaveMouth() {
      if (!this.siteViews || this.journey || this.cave) return;
      const p = this.p,
        R = this.R;
      for (const v of this.siteViews.values()) {
        if (!v.mouth || arcM(p, v.site.dir, R) > 14) continue;
        const [x, z] = this.hostLocal(v, p),
          m = v.mouth,
          cs = Math.cos(m.rot),
          sn = Math.sin(m.rot);
        const dx = x - m.x,
          dz = z - m.z,
          u = dx * cs + dz * sn,
          w = -dx * sn + dz * cs;
        if (Math.abs(u) < m.w / 2 - 0.3 && w < 0.4 && w > -1.6) {
          this.enterCave(v);
          return;
        }
      }
    },

    // ---------- a frame underground ----------
    updateCave(dtReal, nowMs, input) {
      const C = this.cave,
        P = C.plan,
        U = this.uniforms;
      this.frame++;
      const nowS = nowMs / 1000;
      // time goes on outside
      this.t +=
        (dtReal * (input.speed ?? 1) * (1 + 0.6 * (1 - U.uDay.value))) /
        groundSecondsPerDay(this.planet.body.dayHours);
      const ev = (this.events = {
        moving: false,
        running: false,
        swimming: false,
        jumped: false,
        impact: 0,
      });
      // rooted to the spot by a dead lord's cry
      const rooted = (this.rootedUntil || 0) > nowS;
      if (!this.wake && input.move && !this.frozen && !rooted) {
        const { fwd, strafe, run } = input.move;
        if (fwd || strafe) {
          const L = Math.max(1, Math.hypot(fwd, strafe)),
            sp = (run ? CAVE_RUN : CAVE_WALK) * dtReal;
          const sy = Math.sin(-this.yaw),
            cy = Math.cos(-this.yaw);
          const north = ((fwd * cy - strafe * sy) / L) * sp,
            east = ((fwd * sy + strafe * cy) / L) * sp;
          // slide along the rock: x then z, each only if there is room, in short steps so no wall is ever jumped
          const n = Math.max(1, Math.ceil(Math.hypot(east, north) / 0.2));
          for (let k = 0; k < n; k++) {
            const nx = C.x + east / n,
              nz = C.z - north / n;
            if (this.caveStand(nx, C.z)) C.x = nx;
            if (this.caveStand(C.x, nz)) C.z = nz;
          }
          this.bob = (this.bob || 0) + sp * 1.9;
          ev.moving = true;
          ev.running = !!run;
        }
        if (input.jump && this.onGround) {
          this.vy = 3.8;
          this.onGround = false;
          ev.jumped = true;
        }
      }
      // out of the mouth: back into the world
      if (C.z > 0.35 && Math.abs(C.x) < 2.4) {
        this.exitCave();
        return;
      }
      // on the floor, under the roof (stooping where it comes down low)
      const fl = caveFloor(P, C.x, C.z),
        roof = Math.max(fl + 0.9, caveCeil(P, C.x, C.z) - 0.3);
      const floor = Math.min(fl + CAVE_EYE, roof);
      const g = 9.81 * (this.planet.body.gravity || 1);
      this.vy -= g * dtReal;
      C.eyeY += this.vy * dtReal;
      if (C.eyeY > roof) {
        C.eyeY = roof;
        this.vy = Math.min(0, this.vy);
      }
      if (C.eyeY <= floor) {
        if (this.vy < -9.5) ev.impact = (-this.vy - 9.5) * 9;
        C.eyeY =
          C.eyeY < floor - 0.6
            ? floor
            : C.eyeY + (floor - C.eyeY) * Math.min(1, dtReal * 18);
        C.eyeY = Math.max(C.eyeY, floor - 0.02);
        this.vy = 0;
        this.onGround = true;
      } else if (C.eyeY > floor + 0.05) this.onGround = false;
      // the sky still turns outside: the day at the mouth follows it
      this.updateDayOnly(nowMs);
      // the dead, if any are up
      // (while you are in your satchel or a menu, the dead wait too)
      if (this.hitStop > 0) this.hitStop -= dtReal;
      if (
        this.stepFoes &&
        (input.speed ?? 1) > 0 &&
        !input.hold &&
        !(this.hitStop > 0)
      )
        this.stepFoes(dtReal, nowS);
      // the cave around you; the light you carry, the day at the mouth behind you, your eyes in the dark
      C.mesh.position.set(-C.x, 0, -C.z);
      C.rock.position.set(-C.x, 0, -C.z);
      C.mesh.updateMatrixWorld();
      C.rock.updateMatrixWorld();
      const flick = 0.85 + 0.15 * Math.sin(nowS * 13.1) * Math.sin(nowS * 7.3);
      if (this.heldTorch) {
        const h = -this.yaw;
        U.uFire.value.set(
          Math.sin(h) * 0.5 - Math.cos(h) * 0.35,
          C.eyeY + 0.2,
          -Math.cos(h) * 0.5 - Math.sin(h) * 0.35,
          flick * 0.95,
        );
      } else U.uFire.value.w = 0;
      const L = U.uLamps.value,
        K = U.uLampK.value;
      for (let i = 0; i < L.length; i++) {
        L[i].set(0, -1e5, 0, 1);
        K[i] = 0;
      }
      // even with nothing to see by, your eyes find a little of the rock close to you
      if (!this.heldTorch) {
        L[0].set(0, C.eyeY - 0.4, 0, 3.6);
        K[0] = 0.22;
      }
      // a mine's lamps, the nearest of them, flickering
      if (P.lamps && P.lamps.length) {
        const near = P.lamps
          .map((q) => ({ q, d: Math.hypot(q[0] - C.x, q[2] - C.z) }))
          .sort((a, b) => a.d - b.d);
        for (let i = 0; i < Math.min(near.length, L.length - 1); i++) {
          const q = near[i].q;
          L[i + 1].set(q[0] - C.x, q[1], q[2] - C.z, 7.5);
          K[i + 1] = 0.8 * (0.88 + 0.12 * Math.sin(nowS * 9.3 + i * 2.1));
        }
      }
      const day = U.uDay.value,
        sc = this.skyCols;
      this.caveU.uMouth.value.set(
        -C.x,
        caveFloor(P, 0, 0.3) + 1.5,
        0.8 - C.z,
        day * 0.9,
      );
      const hor = sc
        ? [0, 1, 2].map(
            (k) => sc.nightHor[k] + (sc.dayHor[k] - sc.nightHor[k]) * day,
          )
        : [0.6, 0.7, 0.8];
      this.caveU.uOut.value.set(hor[0], hor[1], hor[2]);
      // the dark closes in: near with nothing to see by, further with a flame
      U.uFog.value.set(0.004, 0.003, 0.005);
      U.uFogRange.value.set(
        this.heldTorch || P.mine ? 6 : 2.5,
        this.heldTorch || P.mine ? 30 : 15,
      );
      U.uDark.value = 1;
      const hold = this.stepHeld(dtReal);
      const bob = this.onGround ? Math.sin(this.bob || 0) * 0.045 : 0;
      this.eyeY = C.eyeY;
      if (this.fade > 0) this.fade = Math.max(0, this.fade - dtReal * 1.6);
      this.caveFade.visible = this.fade > 0.001;
      this.fadeU.uFade.value = this.fade;
      this.camera.position.set(
        hold.sway * Math.cos(this.yaw),
        C.eyeY + bob,
        -hold.sway * Math.sin(this.yaw),
      );
      this.camera.rotation.set(this.pitch + hold.dip, this.yaw, 0);
      this.camera.updateMatrixWorld();
      this.syncRamps();
      if (!input.skipRender) {
        this.renderer.setClearColor(0x000000, 1);
        this.renderer.render(this.caveScene, this.camera);
      }
    },
    // the hour and the light outside, without drawing the sky (underground it still matters how late it is)
    updateDayOnly(nowMs) {
      const U = this.uniforms,
        F = frameAt(this.p);
      const s = this.planet.sunInBody(this.t);
      const up = s[0] * F.u[0] + s[1] * F.u[1] + s[2] * F.u[2];
      const k = Math.max(0, Math.min(1, (up + 0.12) / 0.22));
      U.uDay.value = k * k * (3 - 2 * k);
      U.uTime.value = nowMs / 1000;
      const lt = this.planet.localTime(this.p[0], this.p[1], this.p[2], this.t);
      this.dayFrac = lt.hours / lt.dayHours;
      this.dayNum = Math.floor(this.t + 0.5 - this.dayFrac);
    },
    // which way you face, in the world outside's terms (for saving)
    surfaceYaw() {
      return this.cave ? -(this.cave.inward + -this.yaw) : this.yaw;
    },
    // could you stand here? (inside the rock's hollow, under enough roof, clear of what stands on the floor)
    caveStand(x, z, r = 0.3) {
      const P = this.cave.plan;
      return (
        caveOpen(P, x, z, r) &&
        caveHead(P, x, z) > 1.3 &&
        !this.caveBump(x, z) &&
        !(this.foeBlocks && this.foeBlocks(x, z))
      );
    },
    // nothing but open air between two points along the floor? (no wall, nothing standing in the way)
    caveLine(ax, az, bx, bz) {
      const P = this.cave.plan,
        L = Math.hypot(bx - ax, bz - az),
        n = Math.max(1, Math.ceil(L / 0.2));
      for (let k = 1; k < n; k++) {
        const x = ax + ((bx - ax) * k) / n,
          z = az + ((bz - az) * k) / n;
        if (!caveOpen(P, x, z, 0.05)) return false;
        for (const [px, pz, r] of this.cave.posts)
          if (Math.hypot(x - px, z - pz) < r * 0.8) return false;
      }
      return true;
    },
    caveBump(x, z) {
      for (const [px, pz, r] of this.cave.posts)
        if (Math.hypot(x - px, z - pz) < r + 0.3) return true;
      return false;
    },
    // what you are looking at underground (for the prompt and for using it)
    lookCave() {
      const C = this.cave;
      const h = -this.yaw,
        cp = Math.cos(this.pitch);
      const vx = Math.sin(h) * cp,
        vy = Math.sin(this.pitch),
        vz = -Math.cos(h) * cp;
      if (this.foeAt) {
        const fo = this.foeAt(this.weaponReach || 2.2);
        if (fo) return { kind: "foe", foe: fo.f, d: fo.d, score: 0 };
      }
      let best = null;
      const lying = new Set(
        (C.foes || []).filter((f) => f.st === "lie").map((f) => f.id),
      );
      for (const sp of C.spots) {
        if (sp.kind === "mouth") continue;
        if (
          (sp.kind === "dead" || sp.kind === "lord") &&
          !lying.has(sp.thing.id)
        )
          continue;
        const dx = sp.x - C.x,
          dy = sp.y - C.eyeY,
          dz = sp.z - C.z,
          d = Math.hypot(dx, dy, dz);
        if (d > 2.6 + sp.r || d < 1e-3) continue;
        const ang = Math.acos(
            Math.max(-1, Math.min(1, (dx * vx + dy * vy + dz * vz) / d)),
          ),
          allow = Math.atan2(sp.r + 0.3, d) + 0.1;
        if (ang > allow) continue;
        const score = ang / allow + d * 0.04;
        if (!best || score < best.score)
          best = { kind: "cave", spot: sp, d, score };
      }
      return best;
    },
  });

  // ---- view/weatherview.js ----
  // ============================================================
  // WEATHERVIEW — the weather where you stand, and the night sky, drawn.
  // What the sky is doing comes from weather.js (the planet's own clouds,
  // the climate, the hour), looked up every so often and eased into, so a
  // shower comes on and passes rather than switching. Rain is a few
  // thousand streaks falling round you (on the wind), snow a drift of
  // flakes, both kept off you under a roof; lightning lights everything
  // for a moment and the thunder follows as far behind as the bolt was far
  // off; snow lies and the ground darkens wet, and both go again. Above:
  // the moons where they really are, a shadow crossing the sun when one
  // passes in front of it, falling stars, the lights over the pole.
  // ============================================================

