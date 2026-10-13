// index-inline-2 119 — pts
// Lines 60615-61059 of readable/index-inline-2.pretty.js (statement-aligned).
  Object.assign(GroundView.prototype, {
    // ---------- by road ----------
    // every town the roads reach from this one, the way there (towns in order) and how far
    townsByRoad(fromId) {
      const net = this.roadNet;
      if (!net) return [];
      const memo = this.roadMemo || (this.roadMemo = new Map());
      if (memo.has(fromId)) return memo.get(fromId);
      const R = this.R / 1000,
        adj = new Map();
      for (const rd of net.roads) {
        let km = 0;
        for (let k = 0; k < rd.pts.length - 1; k++)
          km += angleOf(rd.pts[k], rd.pts[k + 1]) * R;
        for (const [a, b] of [
          [rd.a, rd.b],
          [rd.b, rd.a],
        ]) {
          if (!adj.has(a)) adj.set(a, []);
          adj.get(a).push({ to: b, km, rd });
        }
      }
      // the shortest way to each, by road
      const dist = new Map([[fromId, 0]]),
        prev = new Map(),
        open = [fromId];
      while (open.length) {
        open.sort((x, y) => dist.get(x) - dist.get(y));
        const u = open.shift();
        for (const e of adj.get(u) || []) {
          const d = dist.get(u) + e.km;
          if (!dist.has(e.to) || d < dist.get(e.to)) {
            dist.set(e.to, d);
            prev.set(e.to, { from: u, rd: e.rd });
            if (!open.includes(e.to)) open.push(e.to);
          }
        }
      }
      const out = [];
      for (const [id, km] of dist)
        if (id !== fromId) out.push({ id, km, prev });
      out.sort((a, b) => a.km - b.km);
      memo.set(fromId, out);
      return out;
    },
    // the way along the roads from one town to another, as one line of points
    roadRoute(fromId, toId) {
      const list = this.townsByRoad(fromId),
        hit = list.find((o) => o.id === toId);
      if (!hit) return null;
      const legs = [];
      for (let id = toId; id !== fromId;) {
        const p = hit.prev.get(id);
        if (!p) return null;
        legs.unshift({ from: p.from, to: id, rd: p.rd });
        id = p.from;
      }
      const pts = [];
      for (const L of legs) {
        const seg = L.rd.a === L.from ? L.rd.pts : L.rd.pts.slice().reverse();
        for (const q of seg)
          if (!pts.length || angleOf(pts[pts.length - 1], q) > 1e-7)
            pts.push(q);
      }
      return this.routeOf([this.p.slice(), ...pts]);
    },
    routeOf(pts) {
      const R = this.R,
        cum = [0];
      for (let k = 0; k < pts.length - 1; k++)
        cum.push(cum[k] + angleOf(pts[k], pts[k + 1]) * R);
      return { pts, cum, total: cum[cum.length - 1], road: true };
    },

    // ---------- by sea ----------
    // the nearest open water to a place on the coast, a ring of cells at a time (-1: none that near)
    harbourCell(d, rings = 6) {
      const L0 = this.planet.levels[0],
        g = L0.grid,
        land = L0.land;
      const c0 = g.canon[g.locate(d[0], d[1], d[2])];
      if (!land[c0]) return c0;
      const nb = new Int32Array(8),
        seen = new Set([c0]);
      let ring = [c0];
      for (let step = 0; step < rings; step++) {
        const next = [];
        for (const c of ring) {
          neighbors8(g, c, nb);
          for (const j of nb) {
            if (j < 0 || seen.has(j)) continue;
            seen.add(j);
            if (!land[j]) return j;
            next.push(j);
          }
        }
        ring = next;
      }
      return -1;
    },
    // which body of water each sea cell belongs to (the oceans, an inland sea, a lake), worked out once
    seaComp() {
      if (this._seaComp) return this._seaComp;
      const L0 = this.planet.levels[0],
        g = L0.grid,
        land = L0.land,
        n = g.count;
      const comp = new Int32Array(n).fill(-1),
        q = new Int32Array(n),
        nb = new Int32Array(8);
      let id = 0;
      for (let r = 0; r < g.real.length; r++) {
        const s = g.real[r];
        if (land[s] || comp[s] >= 0) continue;
        let head = 0,
          tail = 0;
        comp[s] = id;
        q[tail++] = s;
        while (head < tail) {
          const c = q[head++];
          neighbors8(g, c, nb);
          for (const j of nb)
            if (j >= 0 && !land[j] && comp[j] < 0) {
              comp[j] = id;
              q[tail++] = j;
            }
        }
        id++;
      }
      this._seaComp = comp;
      return comp;
    },
    // are two places on the same land (a town on the shore may stand in a cell the coarse map calls sea: look next door)
    landOf(d) {
      const L0 = this.planet.levels[0],
        g = L0.grid,
        land = L0.land;
      const c = g.canon[g.locate(d[0], d[1], d[2])];
      if (land[c]) return this.planet.compOf(c);
      const nb = new Int32Array(8);
      neighbors8(g, c, nb);
      for (const j of nb) if (j >= 0 && land[j]) return this.planet.compOf(j);
      return -1;
    },
    sameLand(a, b) {
      const x = this.landOf(a);
      return x >= 0 && x === this.landOf(b);
    },
    // can a ship be had here (a port, or a town with the sea close by)? which water it would sail on
    harbourOf(town) {
      const memo = this.harbourMemo || (this.harbourMemo = new Map());
      if (memo.has(town.id)) return memo.get(town.id);
      const c =
        town.type === "port" || (town.coastKm ?? 999) < 40
          ? this.harbourCell(town.dir, town.type === "port" ? 2 : 1)
          : -1;
      const out = c >= 0 ? { cell: c, sea: this.seaComp()[c] } : null;
      memo.set(town.id, out);
      return out;
    },
    // every town a ship from this one could reach, nearest first (the way round the land is guessed at
    // here: the true one is found when you sail)
    townsBySea(from) {
      const h = this.harbourOf(from);
      if (!h) return [];
      const out = [];
      for (const t of this.story.settlements) {
        if (t === from) continue;
        const o = this.harbourOf(t);
        if (!o || o.sea !== h.sea) continue;
        out.push({
          t,
          km: ((angleOf(from.dir, t.dir) * this.R) / 1000) * 1.25,
        });
      }
      return out.sort((a, b) => a.km - b.km);
    },
    // A way over the water from near one point to near another, round the land (null if there is none).
    seaRoute(a, b) {
      const L0 = this.planet.levels[0],
        g = L0.grid,
        land = L0.land,
        dir = g.dir,
        R = this.R;
      const nb = new Int32Array(8);
      const s0 = this.harbourCell(a),
        s1 = this.harbourCell(b);
      if (s0 < 0 || s1 < 0) return null;
      const ang = (i, j) => {
        const x =
          dir[i * 3] * dir[j * 3] +
          dir[i * 3 + 1] * dir[j * 3 + 1] +
          dir[i * 3 + 2] * dir[j * 3 + 2];
        return Math.acos(x > 1 ? 1 : x < -1 ? -1 : x);
      };
      const cost = new Map([[s0, 0]]),
        came = new Map(),
        heap = new Heap(4096);
      heap.push(ang(s0, s1), s0);
      let found = false,
        pops = 0;
      while (heap.n && pops < 600000) {
        const i = heap.pop();
        pops++;
        if (i === s1) {
          found = true;
          break;
        }
        const ci = cost.get(i);
        neighbors8(g, i, nb);
        for (const j of nb) {
          if (j < 0 || land[j]) continue;
          // keep a little off the shore where there is room
          const c = ci + ang(i, j);
          if (!cost.has(j) || c < cost.get(j)) {
            cost.set(j, c);
            came.set(j, i);
            heap.push(c + ang(j, s1), j);
          }
        }
      }
      if (!found) return null;
      const cells = [];
      for (let i = s1; i !== undefined; i = came.get(i)) {
        cells.push(i);
        if (i === s0) break;
      }
      cells.reverse();
      // every few cells a point (always the last), then the true ends
      const pts = [a.slice()];
      for (let k = 0; k < cells.length; k += 2)
        pts.push([
          dir[cells[k] * 3],
          dir[cells[k] * 3 + 1],
          dir[cells[k] * 3 + 2],
        ]);
      const lastC = cells[cells.length - 1],
        lastP = [dir[lastC * 3], dir[lastC * 3 + 1], dir[lastC * 3 + 2]];
      if (angleOf(pts[pts.length - 1], lastP) > 1e-6) pts.push(lastP);
      pts.push(b.slice());
      const rt = this.routeOf(pts);
      // where the water begins and ends along it (out to the ship, and ashore again, are on land)
      rt.seaFrom = rt.cum[1];
      rt.seaTo = rt.cum[pts.length - 2];
      return { pts, km: rt.total / 1000, rt };
    },

    // ---------- the ship ----------
    // a single-masted ship, seen from her stern: the deck runs away from you to the bow
    shipBuild() {
      if (this.ship) return this.ship;
      const mb = new MeshBuf(),
        r = (c) => this.row(c);
      const wood = r([118, 82, 50]),
        dark = r([74, 52, 34]),
        deck = r([156, 120, 78]),
        sail = r([226, 214, 186]),
        rope = r([184, 150, 96]),
        iron = r([62, 60, 66]),
        glow = r([255, 206, 110]);
      const D = SHIP_DECK,
        L0 = -9.5,
        L1 = 2.2,
        W = 1.7;
      // the hull: sides that come in to a point at the bow, a transom at the stern
      const side = (s) => {
        const x = (z) =>
          s * W * (z < -6 ? Math.max(0.05, (z - L0) / (-6 - L0)) : 1);
        for (let k = 0; k < 12; k++) {
          const z0 = L1 - ((L1 - L0) * k) / 12,
            z1 = L1 - ((L1 - L0) * (k + 1)) / 12;
          mb.quad(
            [x(z0), D + 0.55, z0],
            [x(z1), D + 0.55, z1],
            [x(z1) * 0.8, -0.4, z1],
            [x(z0) * 0.8, -0.4, z0],
            s < 0 ? wood : dark,
            PAT.PLANK,
          );
        }
      };
      side(-1);
      side(1);
      mb.quad(
        [-W, D + 0.55, L1],
        [W, D + 0.55, L1],
        [W * 0.8, -0.4, L1],
        [-W * 0.8, -0.4, L1],
        dark,
        PAT.PLANK,
      );
      // the deck, and a rail along each side
      for (let k = 0; k < 12; k++) {
        const z0 = L1 - ((L1 - L0) * k) / 12,
          z1 = L1 - ((L1 - L0) * (k + 1)) / 12,
          w0 = W * (z0 < -6 ? Math.max(0.05, (z0 - L0) / (-6 - L0)) : 1),
          w1 = W * (z1 < -6 ? Math.max(0.05, (z1 - L0) / (-6 - L0)) : 1);
        mb.quad(
          [-w0, D, z0],
          [w0, D, z0],
          [w1, D, z1],
          [-w1, D, z1],
          deck,
          PAT.PLANK,
          [
            [0, z0],
            [2 * w0, z0],
            [2 * w1, z1],
            [0, z1],
          ],
        );
      }
      for (const s of [-1, 1])
        for (let k = 0; k <= 8; k++) {
          const z = L1 - 0.2 - k * 1.05;
          const w = W * (z < -6 ? Math.max(0.05, (z - L0) / (-6 - L0)) : 1);
          mb.box(
            s * w - 0.05,
            D,
            z - 0.05,
            s * w + 0.05,
            D + 0.95,
            z + 0.05,
            wood,
            PAT.NONE,
          );
        }
      // the mast, the yard and a square sail, full of wind
      mb.prism([0, D, -3.2], [0, D + 9.5, -3.2], 0.14, 0.1, 6, wood, PAT.BARK);
      mb.prism(
        [-3.1, D + 8.4, -3.2],
        [3.1, D + 8.4, -3.2],
        0.07,
        0.07,
        5,
        wood,
        PAT.BARK,
      );
      const sailAt = (u, v) => [
        u * 3.0,
        D + 2.4 + v * 6.0,
        -3.0 - Math.sin((Math.PI * (u + 1)) / 2) * Math.sin(Math.PI * v) * 0.9,
      ];
      for (let i = 0; i < 6; i++)
        for (let j = 0; j < 4; j++) {
          const u0 = -1 + i / 3,
            u1 = -1 + (i + 1) / 3,
            v0 = j / 4,
            v1 = (j + 1) / 4;
          mb.quad(
            sailAt(u0, v0),
            sailAt(u1, v0),
            sailAt(u1, v1),
            sailAt(u0, v1),
            sail,
            PAT.CLOTH,
            null,
            { lv: 0.3 },
          );
        }
      for (const s of [-1, 1]) {
        mb.prism(
          [s * W, D + 0.6, -3.0],
          [s * 2.9, D + 8.3, -3.2],
          0.02,
          0.02,
          3,
          rope,
          PAT.NONE,
        );
        mb.prism(
          [0, D + 9.3, -3.2],
          [0, D + 0.8, L0 + 0.5],
          0.02,
          0.02,
          3,
          rope,
          PAT.NONE,
        );
      }
      // a lantern at the stern, lit from dusk
      mb.box(
        -0.12,
        D + 1.1,
        L1 - 0.45,
        0.12,
        D + 1.4,
        L1 - 0.2,
        iron,
        PAT.LAMP,
        { row2: glow },
      );
      mb.prism(
        [0, D, L1 - 0.32],
        [0, D + 1.1, L1 - 0.32],
        0.035,
        0.035,
        4,
        wood,
        PAT.NONE,
      );
      this.syncRamps();
      this.ship = this.meshOf(mb.finish(), this.solidMat);
      this.ship.visible = false;
      this.scene.add(this.ship);
      return this.ship;
    },
    // on board: the ship under you, along your way, riding the swell
    stepShip(nowS) {
      const J = this.journey;
      const st = J && J.stops[Math.max(0, J.i)];
      const on = !!(J && J.sea && J.i >= 0 && st && !st.last);
      if (!on) {
        if (this.ship) this.ship.visible = false;
        return;
      }
      const ship = this.shipBuild();
      ship.visible = true;
      const h = J.shipHeading ?? -this.yaw;
      this.placeMatrix(ship, this.p, frameAt(this.p), 0, h);
      const roll = Math.sin(nowS * 0.9) * 0.035,
        pitch = Math.sin(nowS * 0.63 + 1) * 0.02;
      const M =
        this.shipM ||
        (this.shipM = [new this.T.Matrix4(), new this.T.Matrix4()]);
      M[0].makeRotationZ(roll);
      M[1].makeRotationX(pitch);
      M[0].multiply(M[1]);
      ship.matrix.multiply(M[0]);
      J.swell = Math.sin(nowS * 0.63 + 1) * 0.12;
    },
  });

  // ---- view/mounts.js ----
  // ============================================================
  // MOUNTS — riding from town to town. Inns and taverns keep a beast saddled
  // at a rail by the door: a horse, or whatever the people of the land ride
  // (tallbacks, shell-oxen, woolly striders, white elk, horned goats as big as
  // horses). Hire it and the journey goes by in a few scenes from the saddle:
  // the beast's neck and ears bobbing ahead of you at a trot, nights by a fire
  // with it tethered close, and at the end it stands while you get down, then
  // turns and finds its own way home.
  // ============================================================

  // a horse, in the four-legged beast's own terms; its coat from a short list
