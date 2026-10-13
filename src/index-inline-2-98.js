// index-inline-2 98 — math
// Lines 50076-50820 of readable/index-inline-2.pretty.js (statement-aligned).
  Object.assign(GroundView.prototype, {
    dvRowsGet() {
      if (this.dvRows && this.dvRowsFor === this.ramps) return this.dvRows;
      this.dvRowsFor = this.ramps;
      this.dvRows = Object.fromEntries(
        Object.entries(DV_COLS).map(([k, c]) => [k, this.row(c)]),
      );
      return this.dvRows;
    },
    // ---------- each frame, for a town near you ----------
    stepTownDay(tw, dt, nowS) {
      const day = this.dayNum ?? 0;
      if (tw.dayFor !== day) {
        this.dropTownDay(tw);
        tw.dayFor = day;
        const ev = townDay(this.story, tw.s, day);
        if (ev) this.buildTownDay(tw, ev);
      }
      const D = tw.dayV;
      if (!D) return;
      const f = this.dayFrac ?? 0.5,
        [h0, h1] = TOWNDAY_HOURS[D.ev.kind];
      let on = f >= h0 && f <= h1,
        fire = false,
        about = null;
      if (D.ev.kind === "fire") {
        const st = this.dayState(tw.s.id, day),
          end = D.ev.at + 0.17;
        fire = f >= D.ev.at && f < end && !st.out;
        on = fire;
        // (once it is out they stand about a while, getting their breath back, before going home)
        about = f >= D.ev.at && f < end + 0.05;
        D.char.visible = f >= D.ev.at;
        // smoke over the roof while it burns
        if (D.smoke) {
          const has = (tw.s._bcn || []).includes(D.smoke);
          if (fire && !has && tw.s._bcn) tw.s._bcn.push(D.smoke);
          else if (!fire && has)
            tw.s._bcn.splice(tw.s._bcn.indexOf(D.smoke), 1);
        }
      }
      if (D.ev.kind === "festival") fire = on;
      for (const p of D.folk) p.hidden = !(about ?? on);
      D.hot.visible = fire;
      D.on = on;
      for (const m of [D.mesh, D.hot, D.char])
        this.placeMatrix(m, tw.s.dir, tw.F, tw.base);
      // the lights of the day (the fire's, the feast's lanterns), only while it is on
      for (const L of D.lights) L.off = !on;
    },
    // what you did about it today (the fire put out, the feast eaten): kept with the world
    dayState(townId, day) {
      const k = "day:" + townId + ":" + day,
        w = this.world && this.world.sites;
      return (w && w[k]) || {};
    },
    buildTownDay(tw, ev) {
      const T = this.T,
        s = tw.s,
        R = this.R,
        G = this.ground,
        F = tw.F,
        base = tw.base;
      const P = dayPlan(this.story, s, ev, townRadius(s)),
        plan = tw.plan;
      const kit = this.styleKit(plan.style),
        rows = kit.rows,
        R2 = this.dvRowsGet();
      const mb = new MeshBuf(),
        hot = new MeshBuf(),
        char = new MeshBuf();
      const hAt = (x, z) => {
        const d = dvLocal(s.dir, F, x, z, R);
        return G.height(d[0], d[1], d[2], 1.5) - base;
      };
      const boxes = [],
        col = [],
        lights = [],
        spots = [];
      for (const pr of P.props) {
        const y = hAt(pr.x, pr.z),
          cs = Math.cos(pr.rot || 0),
          sn = Math.sin(pr.rot || 0);
        const at = (u, yy, w) => [
          pr.x + u * cs - w * sn,
          yy,
          pr.z + u * sn + w * cs,
        ];
        const Tf = (pp) => [
          pr.x + pp[0] * cs - pp[2] * sn,
          y + pp[1],
          pr.z + pp[0] * sn + pp[2] * cs,
        ];
        switch (pr.t) {
          case "stall":
            stallInto(
              mb,
              Tf,
              rows,
              [rows.banner, rows.cloth, rows.straw][pr.cloth % 3],
            );
            boxes.push({ x: pr.x, z: pr.z, hx: 1.0, hz: 0.45, cs, sn });
            break;
          case "arch": {
            // two posts wound with green, an arch of it over the top, flowers in it
            for (const su of [-1, 1])
              mb.prism(
                at(su * 1.3, y - 0.2, 0),
                at(su * 1.3, y + 2.3, 0),
                0.07,
                0.06,
                5,
                R2.garland,
                PAT.HIDE,
              );
            let prev = at(-1.3, y + 2.3, 0);
            for (let k = 1; k <= 8; k++) {
              const a = Math.PI - (k / 8) * Math.PI,
                q = at(Math.cos(a) * 1.3, y + 2.3 + Math.sin(a) * 0.9, 0);
              mb.prism(prev, q, 0.11, 0.11, 5, R2.garland, PAT.HIDE);
              prev = q;
            }
            const rnd = mulberry32(
              hashInt((pr.x * 10) | 0, (pr.z * 10) | 0, 3),
            );
            for (let k = 0; k < 14; k++) {
              const a = rnd() * Math.PI,
                rr = 1.3 + (rnd() - 0.5) * 0.1,
                q = at(
                  Math.cos(a) * rr,
                  y + 2.3 + Math.sin(a) * 0.9 * (rr / 1.3),
                  0.08,
                );
              mb.box(
                q[0] - 0.06,
                q[1] - 0.06,
                q[2] - 0.06,
                q[0] + 0.06,
                q[1] + 0.06,
                q[2] + 0.06,
                k % 2 ? R2.petal : R2.petal2,
                PAT.NONE,
              );
            }
            for (const su of [-1, 1]) {
              const q = at(su * 1.3, 0, 0);
              col.push(q[0], q[2], 0.1, base + y - 0.2, base + y + 2.3, 1);
            }
            break;
          }
          case "feasttable": {
            // a long table on trestles with benches either side, loaves and bowls along it
            const q0 = at(-1.6, 0, -0.45),
              q1 = at(1.6, 0, 0.45);
            mb.box(
              Math.min(q0[0], q1[0]),
              y + 0.72,
              Math.min(q0[2], q1[2]),
              Math.max(q0[0], q1[0]),
              y + 0.8,
              Math.max(q0[2], q1[2]),
              rows.wood,
              PAT.PLANK,
            );
            for (const u of [-1.3, 1.3])
              for (const w of [-0.3, 0.3])
                mb.prism(
                  at(u, y - 0.1, w),
                  at(u, y + 0.74, w),
                  0.05,
                  0.05,
                  4,
                  rows.dark || rows.wood,
                  PAT.NONE,
                );
            for (const w of [-0.95, 0.95]) {
              const b0 = at(-1.5, 0, w - 0.14),
                b1 = at(1.5, 0, w + 0.14);
              mb.box(
                Math.min(b0[0], b1[0]),
                y + 0.42,
                Math.min(b0[2], b1[2]),
                Math.max(b0[0], b1[0]),
                y + 0.48,
                Math.max(b0[2], b1[2]),
                rows.wood,
                PAT.PLANK,
              );
            }
            const rnd = mulberry32(
              hashInt((pr.x * 10) | 0, (pr.z * 10) | 0, 9),
            );
            for (let k = 0; k < 7; k++) {
              const q = at(-1.35 + k * 0.45, y + 0.8, (rnd() - 0.5) * 0.4);
              if (k % 2)
                lumpInto(
                  mb,
                  q[0],
                  q[1],
                  q[2],
                  0.13,
                  0.08,
                  0.1,
                  R2.bread,
                  R2.food,
                  hashInt(k, 3, 7),
                  rnd() * 6,
                );
              else
                mb.prism(
                  [q[0], q[1], q[2]],
                  [q[0], q[1] + 0.1, q[2]],
                  0.08,
                  0.13,
                  7,
                  rows.pot || R2.food,
                  PAT.NONE,
                  null,
                  0,
                  true,
                );
            }
            boxes.push({ x: pr.x, z: pr.z, hx: 1.65, hz: 1.1, cs, sn });
            break;
          }
          case "bier": {
            // a platform of planks on trestles, someone on it wrapped in white, flowers laid on them
            const q0 = at(-0.55, 0, -1.1),
              q1 = at(0.55, 0, 1.1);
            mb.box(
              Math.min(q0[0], q1[0]),
              y + 0.75,
              Math.min(q0[2], q1[2]),
              Math.max(q0[0], q1[0]),
              y + 0.85,
              Math.max(q0[2], q1[2]),
              rows.wood,
              PAT.PLANK,
            );
            for (const u of [-0.45, 0.45])
              for (const w of [-0.95, 0.95])
                mb.prism(
                  at(u, y - 0.1, w),
                  at(u, y + 0.78, w),
                  0.05,
                  0.05,
                  4,
                  rows.wood,
                  PAT.NONE,
                );
            mb.prism(
              at(0, y + 0.98, -0.85),
              at(0, y + 0.98, 0.85),
              0.2,
              0.15,
              8,
              R2.wrap,
              PAT.CLOTH,
              null,
              0,
              true,
            );
            mb.prism(
              at(0, y + 1.0, 0.85),
              at(0, y + 1.0, 1.0),
              0.15,
              0.1,
              8,
              R2.wrap,
              PAT.CLOTH,
              null,
              0,
              true,
            );
            const rnd = mulberry32(
              hashInt((pr.x * 10) | 0, (pr.z * 10) | 0, 5),
            );
            for (let k = 0; k < 9; k++) {
              const q = at((rnd() - 0.5) * 0.4, y + 1.16, (rnd() - 0.5) * 1.4);
              mb.box(
                q[0] - 0.05,
                q[1] - 0.03,
                q[2] - 0.05,
                q[0] + 0.05,
                q[1] + 0.03,
                q[2] + 0.05,
                k % 3 ? R2.petal : R2.petal2,
                PAT.NONE,
              );
            }
            boxes.push({ x: pr.x, z: pr.z, hx: 0.6, hz: 1.15, cs, sn });
            break;
          }
          case "candlestand": {
            mb.prism(
              [pr.x, y - 0.1, pr.z],
              [pr.x, y + 1.12, pr.z],
              0.03,
              0.03,
              4,
              R2.woodDark,
              PAT.NONE,
            );
            mb.box(
              pr.x - 0.04,
              y + 1.1,
              pr.z - 0.04,
              pr.x + 0.04,
              y + 1.28,
              pr.z + 0.04,
              R2.glow,
              PAT.GLOW,
              { row2: R2.glow },
            );
            break;
          }
          case "blaze": {
            // flames along the roof of a burning house (only while it burns), and the roof black where it burned
            const b = plan.buildings[pr.i],
              st = plan.style;
            const seaAt = (x, z) => {
              const d = dvLocal(s.dir, F, x, z, R);
              return G.height(d[0], d[1], d[2], 1.5);
            };
            const [, hi] = footLoHi(b, seaAt);
            const bb = Math.max(hi, 0.3) - base,
              eaves = bb + b.floors * st.storeyH,
              ridge = (Math.min(b.w, b.d) / 2) * st.pitch;
            const rnd = mulberry32(hashInt(pr.i, s.id, 29));
            for (let k = 0; k < 14; k++) {
              const u = (rnd() - 0.5) * b.w * 0.85,
                w = (rnd() - 0.5) * b.d * 0.6,
                ry = eaves + ridge * (1 - Math.abs(w) / (b.d / 2)) - 0.1;
              const q = at(u, 0, w);
              hot.cone(
                [q[0], ry, q[2]],
                ry + 1.0 + rnd() * 1.6,
                0.35 + rnd() * 0.3,
                5,
                rows.flame,
                PAT.FLAME,
                null,
                0,
                0,
                rnd(),
              );
            }
            // (out of the windows too)
            for (const su of [-1, 1]) {
              const q = at(su * b.w * 0.25, 0, b.d / 2 + 0.05);
              hot.cone(
                [q[0], bb + st.storeyH * 0.45, q[2]],
                bb + st.storeyH * 0.45 + 1.3,
                0.3,
                5,
                rows.flame,
                PAT.FLAME,
                null,
                0,
                0,
                su,
              );
            }
            lights.push({ x: pr.x, y: eaves + ridge, z: pr.z, kind: "fire" });
            for (let k = 0; k < 10; k++) {
              const u = (rnd() - 0.5) * b.w * 0.9,
                w = (rnd() - 0.2) * b.d * 0.45,
                ry = eaves + ridge * (1 - Math.abs(w) / (b.d / 2)) + 0.06,
                q = at(u, 0, w);
              const sz = 0.5 + rnd() * 0.8;
              char.box(
                q[0] - sz,
                ry - 0.05,
                q[2] - sz * 0.6,
                q[0] + sz,
                ry + 0.06,
                q[2] + sz * 0.6,
                R2.char,
                PAT.NONE,
              );
            }
            break;
          }
          case "flagpole":
            mb.prism(
              [pr.x, y - 0.3, pr.z],
              [pr.x, y + 4.0, pr.z],
              0.06,
              0.05,
              4,
              rows.wood,
              PAT.BARK,
            );
            col.push(pr.x, pr.z, 0.1, base + y - 0.3, base + y + 4, 1);
            break;
          case "bunting": {
            // a line sagging from one pole to another, little flags hung all along it in the town's colours
            const y1 = hAt(pr.x1, pr.z1),
              L = Math.hypot(pr.x1 - pr.x, pr.z1 - pr.z),
              n = Math.max(4, Math.round(L / 0.7));
            const cols = [
              rows.banner,
              R2.cloth,
              R2.cloth3,
              R2.cloth4,
              R2.cloth2,
            ];
            let prev = null;
            for (let k = 0; k <= n; k++) {
              const t = k / n,
                x = pr.x + (pr.x1 - pr.x) * t,
                z = pr.z + (pr.z1 - pr.z) * t,
                yy =
                  y +
                  (y1 - y) * t +
                  3.9 -
                  Math.sin(t * Math.PI) * Math.min(1.4, L * 0.08);
              const p2 = [x, yy, z];
              if (prev) {
                mb.prism(prev, p2, 0.012, 0.012, 3, rows.wood, PAT.NONE);
                const c = cols[(k + pr.seed) % cols.length],
                  m = [
                    (prev[0] + x) / 2,
                    (prev[1] + yy) / 2 - 0.4,
                    (prev[2] + z) / 2,
                  ];
                mb.tri(prev, p2, m, c, PAT.CLOTH);
                mb.tri(p2, prev, m, c, PAT.CLOTH);
              }
              prev = p2;
            }
            break;
          }
          case "bonfire": {
            for (let k = 0; k < 9; k++) {
              const a = (k / 9) * 6.283;
              mb.prism(
                [pr.x + Math.cos(a) * 1.3, y - 0.1, pr.z + Math.sin(a) * 1.3],
                [pr.x + Math.cos(a) * 0.15, y + 1.7, pr.z + Math.sin(a) * 0.15],
                0.1,
                0.07,
                4,
                rows.wood,
                PAT.BARK,
              );
            }
            for (let k = 0; k < 7; k++) {
              const a = k * 0.9,
                r = k ? 0.45 : 0;
              hot.cone(
                [pr.x + Math.cos(a) * r, y + 0.1, pr.z + Math.sin(a) * r],
                y + 1.8 + (k ? 0.2 : 1.1),
                0.45,
                6,
                rows.flame,
                PAT.FLAME,
                null,
                0,
                0,
                a,
              );
            }
            col.push(pr.x, pr.z, 1.4, base + y - 0.1, 1e9, 1);
            break;
          }
          case "cart": {
            const Lc = 2.0,
              W = 1.15,
              wr = 0.5,
              by = y + wr + 0.08;
            const c0 = at(-W / 2, 0, -Lc / 2),
              c1 = at(W / 2, 0, Lc / 2);
            void c0;
            void c1;
            for (let k = 0; k < 4; k++) {
              const a = [
                  [-W / 2, -Lc / 2],
                  [W / 2, -Lc / 2],
                  [W / 2, Lc / 2],
                  [-W / 2, Lc / 2],
                ],
                p0 = a[k],
                p1 = a[(k + 1) % 4];
              mb.quad(
                at(p1[0], by, p1[1]),
                at(p0[0], by, p0[1]),
                at(p0[0], by + 0.45, p0[1]),
                at(p1[0], by + 0.45, p1[1]),
                rows.wood,
                PAT.PLANK,
              );
            }
            mb.quad(
              at(-W / 2, by, -Lc / 2),
              at(-W / 2, by, Lc / 2),
              at(W / 2, by, Lc / 2),
              at(W / 2, by, -Lc / 2),
              rows.wood,
              PAT.PLANK,
            );
            for (const su of [-1, 1]) {
              mb.prism(
                at(su * (W / 2 + 0.02), y + wr, 0.1),
                at(su * (W / 2 + 0.16), y + wr, 0.1),
                wr,
                wr,
                10,
                R2.woodDark,
                PAT.NONE,
                null,
                0,
                true,
              );
              mb.prism(
                at(su * 0.4, by + 0.1, Lc / 2),
                at(su * 0.32, y + 0.22, Lc / 2 + 1.5),
                0.04,
                0.04,
                4,
                R2.woodDark,
                PAT.BARK,
              );
            }
            const rnd = mulberry32(
              hashInt((pr.x * 10) | 0, (pr.z * 10) | 0, 31),
            );
            for (let k = 0; k < 4; k++) {
              const q = at((rnd() - 0.5) * 0.6, 0, (rnd() - 0.5) * 1.2);
              lumpInto(
                mb,
                q[0],
                by + 0.42,
                q[2],
                0.25,
                0.25,
                0.2,
                k % 2 ? R2.hide : R2.wrap,
                R2.food,
                hashInt(k, 11, 3),
                k,
              );
            }
            boxes.push({
              x: pr.x,
              z: pr.z,
              hx: W / 2 + 0.22,
              hz: Lc / 2 + 0.15,
              cs,
              sn,
            });
            break;
          }
          case "tent": {
            mb.cone(
              [pr.x, y - 0.1, pr.z],
              y + pr.h,
              pr.r,
              10,
              R2.hide,
              PAT.HIDE,
              null,
              0,
              0,
              (pr.rot || 0) / 6.283,
            );
            const d0 = at(-0.35, y, pr.r * 0.97),
              d1 = at(0.35, y, pr.r * 0.97),
              d2 = at(0, y + 1.3, pr.r * 0.6);
            mb.tri(d0, d1, d2, R2.char, PAT.NONE);
            col.push(pr.x, pr.z, pr.r * 0.85, base + y, 1e9, 1);
            break;
          }
          case "firepit": {
            for (let k = 0; k < 9; k++) {
              const a = (k / 9) * Math.PI * 2;
              lumpInto(
                mb,
                pr.x + Math.cos(a) * 0.6,
                y - 0.06,
                pr.z + Math.sin(a) * 0.6,
                0.13,
                0.08,
                0.11,
                R2.stone,
                R2.stone,
                hashInt(k, 5, 5),
                a,
              );
            }
            for (let k = 0; k < 4; k++) {
              const a = k * 1.9,
                r = k ? 0.12 : 0;
              hot.cone(
                [pr.x + Math.cos(a) * r, y + 0.04, pr.z + Math.sin(a) * r],
                y + 0.4 + (k ? 0.14 : 0.32),
                0.14,
                5,
                rows.flame,
                PAT.FLAME,
                null,
                0,
                0,
                a,
              );
            }
            col.push(pr.x, pr.z, 0.62, base + y - 0.1, 1e9, 1);
            break;
          }
        }
      }
      for (const L of P.lights) {
        const y = hAt(L.x, L.z) + (L.y || 1);
        lights.push({ x: L.x, y, z: L.z, kind: L.kind });
      }
      for (const sp of P.spots) {
        const y = hAt(sp.x, sp.z) + sp.y;
        spots.push({
          ...sp,
          dir: dvLocal(s.dir, F, sp.x, sp.z, R),
          alt: base + y,
          ev: true,
        });
      }
      this.syncRamps();
      const D = {
        ev,
        plan: P,
        folk: [],
        lights,
        spots,
        boxes,
        col,
        smoke: null,
      };
      D.mesh = this.meshOf(mb.finish(), this.solidMat);
      D.hot = this.meshOf(hot.finish(), this.solidMat);
      D.char = this.meshOf(char.finish(), this.solidMat);
      for (const m of [D.mesh, D.hot, D.char]) {
        m.matrixAutoUpdate = false;
        m.frustumCulled = false;
        this.scene.add(m);
      }
      D.char.visible = false;
      D.hot.visible = false;
      // its people, among the town's own
      for (const f of P.folk) {
        const dir = dvLocal(s.dir, F, f.x, f.z, R),
          person = this.makePerson(f.look, dir);
        person.face = f.face;
        person.wander = f.wander;
        person.home = dir;
        person.target = null;
        person.info = f;
        person.met = false;
        person.host = tw;
        if (f.route) {
          person.route = f.route.map(([x, z]) => dvLocal(s.dir, F, x, z, R));
          person.ri = 0;
        }
        person.lamp = f.look.item === "lantern";
        person.hidden = true;
        D.folk.push(person);
        tw.folk.push(person);
      }
      // what you bump into, what you can use, what lights up
      tw.boxes.push(...boxes);
      if (col.length) {
        tw.col0 = tw.col0 || tw.col;
        const merged = new Float64Array(tw.col0.length + col.length);
        merged.set(tw.col0);
        merged.set(col, tw.col0.length);
        tw.col = merged;
      }
      tw.spots.push(...spots);
      tw.lights.push(...lights);
      if (P.smoke) {
        const sd = dvLocal(s.dir, F, P.smoke.x, P.smoke.z, R);
        D.smoke = { dir: sd, alt: base + P.smoke.y, kind: "smoke", seed: 0.5 };
      }
      // a caravan's camp out past the houses: no trees standing through its tent and carts while it is here
      if (P.at) {
        D.clear = { dir: dvLocal(s.dir, F, P.at.x, P.at.z, R), r: 13 };
        this.dayClearSet(D.clear, true);
      }
      tw.dayV = D;
    },
    // the ground a day keeps clear of trees (in a chunk's own metres, for buildProps)
    dayClearOf(chunk) {
      const out = [],
        R = this.R;
      for (const c of this.dayClears || []) {
        if (arcM(chunk.c, c.dir, R) > chunk.span * 0.75 + c.r) continue;
        const d = [
          c.dir[0] - chunk.c[0],
          c.dir[1] - chunk.c[1],
          c.dir[2] - chunk.c[2],
        ];
        out.push([
          (d[0] * chunk.F.e[0] + d[1] * chunk.F.e[1] + d[2] * chunk.F.e[2]) * R,
          -(d[0] * chunk.F.n[0] + d[1] * chunk.F.n[1] + d[2] * chunk.F.n[2]) *
            R,
          c.r * c.r,
        ]);
      }
      return out;
    },
    dayClearSet(c, on) {
      const L = this.dayClears || (this.dayClears = []),
        i = L.indexOf(c);
      if (on && i < 0) L.push(c);
      else if (!on && i >= 0) L.splice(i, 1);
      else return;
      for (const ch of this.chunks.values())
        if (ch.D && arcM(ch.c, c.dir, this.R) < ch.span * 0.75 + c.r + 10)
          this.rebuildProps(ch);
    },
    dropTownDay(tw) {
      const D = tw.dayV;
      if (!D) return;
      for (const m of [D.mesh, D.hot, D.char]) {
        this.scene.remove(m);
        m.geometry.dispose();
      }
      for (const p of D.folk) {
        this.scene.remove(p.mesh);
        p.mesh.geometry.dispose();
        p.mesh.material.dispose();
        const i = tw.folk.indexOf(p);
        if (i >= 0) tw.folk.splice(i, 1);
      }
      tw.boxes = tw.boxes.filter((b) => !D.boxes.includes(b));
      if (tw.col0) {
        tw.col = tw.col0;
        tw.col0 = null;
      }
      tw.spots = tw.spots.filter((sp) => !D.spots.includes(sp));
      tw.lights = tw.lights.filter((L) => !D.lights.includes(L));
      if (D.smoke && tw.s._bcn) {
        const i = tw.s._bcn.indexOf(D.smoke);
        if (i >= 0) tw.s._bcn.splice(i, 1);
      }
      if (D.clear) this.dayClearSet(D.clear, false);
      tw.dayV = null;
    },
  });
