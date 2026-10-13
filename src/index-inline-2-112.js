// index-inline-2 112 — math
// Lines 57683-58029 of readable/index-inline-2.pretty.js (statement-aligned).
  const DRAW_T = 0.8; // seconds to draw all the way
  const LOOSE_MIN = 0.22; // let go sooner and you only ease the string back
  const ARROW_FALL = 0.55; // an arrow falls slower than a stone: it flies, a little

  Object.assign(GroundView.prototype, {
    // ---------- drawing ----------
    bowStart() {
      if (this.cave || this.journey || this.drawing || !this.ready || this.wake)
        return false;
      this.drawing = { t: 0 };
      return true;
    },
    bowCancel() {
      this.drawing = null;
    },
    // how far it is drawn, 0..1
    bowDrawn() {
      return this.drawing ? Math.min(1, this.drawing.t / DRAW_T) : 0;
    },
    // let go: an arrow flies, if the bow was drawn far enough. Returns how far it was drawn (0: not loosed).
    bowLoose(id, dmg) {
      const d = this.drawing;
      this.drawing = null;
      if (!d || d.t < LOOSE_MIN || this.cave) return 0;
      const k = Math.min(1, d.t / DRAW_T),
        sp = 20 + 40 * k;
      const h = -this.yaw,
        cp = Math.cos(this.pitch);
      const vx = Math.sin(h) * cp,
        vy = Math.sin(this.pitch),
        vz = -Math.cos(h) * cp;
      const o = this.p.slice();
      (this.arrows = this.arrows || []).push({
        o,
        F: frameAt(o),
        x: vx * 0.45,
        y: this.eyeY - 0.12 + vy * 0.45,
        z: vz * 0.45,
        vx: vx * sp,
        vy: vy * sp,
        vz: vz * sp,
        t: 0,
        id,
        dmg: dmg * (0.4 + 0.6 * k),
        k,
        mesh: null,
      });
      return k;
    },
    clearArrows() {
      for (const ar of this.arrows || [])
        if (ar.mesh) this.scene.remove(ar.mesh);
      this.arrows = [];
      this.drawing = null;
    },

    // ---------- in flight ----------
    stepArrows(dt) {
      const A = this.arrows;
      if (!A || !A.length) return;
      const g = 9.81 * (this.planet.body.gravity || 1) * ARROW_FALL;
      for (let i = A.length - 1; i >= 0; i--) {
        const ar = A[i];
        ar.t += dt;
        const tg = this.arrowTargets(ar);
        const sp = Math.hypot(ar.vx, ar.vy, ar.vz),
          n = Math.max(1, Math.ceil((sp * dt) / 0.3));
        let end = null;
        for (let s = 0; s < n && !end; s++) {
          const h = dt / n,
            x0 = ar.x,
            y0 = ar.y,
            z0 = ar.z;
          ar.vy -= g * h;
          ar.x += ar.vx * h;
          ar.y += ar.vy * h;
          ar.z += ar.vz * h;
          end = this.arrowMeets(ar, x0, y0, z0, tg);
        }
        if (!end && (ar.t > 7 || Math.hypot(ar.x, ar.z) > 450))
          end = { lost: true };
        if (end) {
          if (ar.mesh) this.scene.remove(ar.mesh);
          A.splice(i, 1);
          this.arrowEnd(ar, end);
          continue;
        }
        this.drawArrow(ar);
      }
    },
    // what an arrow could meet this frame, as spheres in its own metres
    arrowTargets(ar) {
      const out = [],
        R = this.R,
        here = stepOn(ar.o, ar.F, ar.x, -ar.z, R);
      if (this.herds)
        for (const hd of this.herds) {
          if (arcM(here, hd.c, R) > 120) continue;
          for (const a of hd.animals)
            if (a.m < 1000)
              out.push({
                kind: "prey",
                hd,
                a,
                parts: this.beastParts(a, hd.pr, a.sc || a.scale, ar.o, ar.F),
              });
        }
      if (this.hostileTargets) this.hostileTargets(ar, here, out);
      return out;
    },
    // the first thing on the stretch it flew this step: something alive, else a trunk or a rock, else the ground
    arrowMeets(ar, x0, y0, z0, targets) {
      const dx = ar.x - x0,
        dy = ar.y - y0,
        dz = ar.z - z0,
        L2 = dx * dx + dy * dy + dz * dz || 1e-9;
      let best = null;
      for (const tg of targets)
        for (const q of tg.parts) {
          const u = Math.max(
            0,
            Math.min(
              1,
              ((q[0] - x0) * dx + (q[1] - y0) * dy + (q[2] - z0) * dz) / L2,
            ),
          );
          const ex = x0 + dx * u - q[0],
            ey = y0 + dy * u - q[1],
            ez = z0 + dz * u - q[2];
          if (ex * ex + ey * ey + ez * ez > q[3] * q[3]) continue;
          // the nearest part along the way; of two at once, the deadlier
          if (
            !best ||
            u < best.u - 1e-3 ||
            (Math.abs(u - best.u) <= 1e-3 && q[4] > best.mult)
          )
            best = { u, tg, mult: q[4], part: q[5] };
        }
      if (best) return { hit: best.tg, mult: best.mult, part: best.part };
      const R = this.R,
        d = stepOn(ar.o, ar.F, ar.x, -ar.z, R);
      // trunks and rocks near it
      for (const ch of this.colChunks) {
        const q0 = d[0] - ch.c[0],
          q1 = d[1] - ch.c[1],
          q2 = d[2] - ch.c[2];
        const lx = (q0 * ch.F.e[0] + q1 * ch.F.e[1] + q2 * ch.F.e[2]) * R,
          lz = -(q0 * ch.F.n[0] + q1 * ch.F.n[1] + q2 * ch.F.n[2]) * R;
        const reach = ch.span * 0.75 + 3;
        if (Math.abs(lx) > reach || Math.abs(lz) > reach) continue;
        const col = ch.col;
        for (let k = 0; k < col.length; k += 6) {
          const ox = lx - col[k],
            oz = lz - col[k + 1],
            r = col[k + 2],
            kind = col[k + 5];
          if (kind === 3 || ox * ox + oz * oz > r * r) continue;
          if (kind === 2) {
            const q = Math.min(1, Math.hypot(ox, oz) / r),
              surf =
                col[k + 3] +
                (col[k + 4] - col[k + 3]) * Math.sqrt(Math.max(0, 1 - q * q));
            if (ar.y < surf) return { rock: true, d };
          } else if (ar.y > col[k + 3] - 0.4 && ar.y < col[k + 4])
            return { trunk: true, d };
        }
      }
      const gh = this.ground.height(d[0], d[1], d[2], 1);
      if (ar.y <= gh || ar.y < -0.6) return { ground: true, d, gh };
      return null;
    },
    // where it ended up, and what it did there
    arrowEnd(ar, end) {
      const rnd = Math.random,
        bear = Math.atan2(ar.vx, -ar.vz),
        fall = Math.atan2(-ar.vy, Math.hypot(ar.vx, ar.vz));
      // (for looking into afterwards)
      this.lastArrow = {
        how: end.hit
          ? end.hit.kind + ":" + end.part
          : end.ground
            ? "ground"
            : end.trunk
              ? "trunk"
              : end.rock
                ? "rock"
                : "lost",
        x: +ar.x.toFixed(2),
        y: +ar.y.toFixed(2),
        z: +ar.z.toFixed(2),
        t: +ar.t.toFixed(2),
      };
      if (end.hit) {
        const tg = end.hit,
          dmg = ar.dmg * end.mult,
          keep = rnd() < 0.75 ? ar.id : null;
        let down = false;
        if (tg.kind === "prey") {
          const res = this.hitPrey(tg.hd, tg.a, dmg, keep);
          if (res) {
            down = !!res.down;
            this.faunaNews = res.down
              ? end.part === "head"
                ? `A clean shot. The ${res.c.name} drops where it stood`
                : `The ${res.c.name} drops`
              : `A hit. The ${res.name} runs, bleeding`;
          }
        } else if (this.hitHostile)
          down = this.hitHostile(tg.h, dmg, 0.25, keep, end.part) === "down";
        // where it went in (for the burst of it, and whatever flies off)
        this.arrowHit = {
          dir: stepOn(ar.o, ar.F, ar.x, -ar.z, this.R),
          alt: ar.y,
          down,
          kind: tg.kind === "prey" ? "prey" : tg.h && tg.h.kind,
        };
        return;
      }
      if (end.lost) return;
      // into the ground (or a trunk, or off a rock): often it can be pulled out again
      const d = end.d,
        gh = end.gh ?? this.ground.height(d[0], d[1], d[2], 1);
      const keep =
        gh > 0 && rnd() < (end.ground ? 0.65 : end.trunk ? 0.5 : 0.3);
      if (keep && this.world)
        this.addDrop(ar.id, 1, d, {
          yaw: bear,
          tilt: end.ground ? Math.max(0.3, Math.min(1.2, fall)) : 0.08,
        });
      // a herd close by hears it go in
      if (this.herds)
        for (const hd of this.herds)
          if (
            hd.state !== "flee" &&
            hd.animals.some((a) => arcM(d, a.dir, this.R) < 18)
          ) {
            hd.said = true;
            this.startleHerd(hd);
          }
    },
    // the arrow as it flies: nose along its way
    drawArrow(ar) {
      if (!ar.mesh) {
        const G = this.arrowGeos || (this.arrowGeos = {});
        if (!G[ar.id]) {
          const mb = new MeshBuf(),
            wood = this.row([200, 168, 112]),
            head = this.row(ar.id === "obarrow" ? [40, 32, 52] : [92, 98, 122]),
            fl = this.row([186, 64, 50]);
          mb.prism(
            [0, 0, 0.36],
            [0, 0, -0.32],
            0.014,
            0.014,
            4,
            wood,
            PAT.NONE,
          );
          mb.prism(
            [0, 0, -0.32],
            [0, 0, -0.42],
            0.03,
            0.003,
            4,
            head,
            PAT.NONE,
          );
          // four flights at the back
          for (const [ax, ay] of [
            [0, 0.045],
            [0.045, 0],
            [0, -0.045],
            [-0.045, 0],
          ])
            mb.quad(
              [0, 0, 0.2],
              [ax, ay, 0.2],
              [ax, ay, 0.36],
              [0, 0, 0.36],
              fl,
              PAT.NONE,
            );
          this.syncRamps();
          G[ar.id] = this.meshOf(mb.finish(), this.solidMat).geometry;
        }
        ar.mesh = new this.T.Mesh(G[ar.id], this.solidMat);
        ar.mesh.matrixAutoUpdate = false;
        ar.mesh.frustumCulled = false;
        this.scene.add(ar.mesh);
      }
      const d = stepOn(ar.o, ar.F, ar.x, -ar.z, this.R);
      this.placeMatrix(ar.mesh, d, frameAt(d), ar.y, Math.atan2(ar.vx, -ar.vz));
      const rot = this.arrowRot || (this.arrowRot = new this.T.Matrix4());
      rot.makeRotationX(Math.atan2(ar.vy, Math.hypot(ar.vx, ar.vz)));
      ar.mesh.matrix.multiply(rot);
    },
  });

  // an arrow stuck in the ground, its feathers back towards whoever loosed it (or lying where it fell)
  function arrowDropInto(mb, dr, rows) {
    const t = dr.tilt ?? 0.6,
      c = Math.cos(t),
      s = Math.sin(t);
    const n = Math.min(3, dr.n || 1);
    for (let k = 0; k < n; k++) {
      const ox = (k - (n - 1) / 2) * 0.09,
        oz = k * 0.05;
      const tip = [ox, -0.12 * s, oz - 0.12 * c],
        tail = [ox, 0.62 * s, oz + 0.62 * c];
      mb.prism(tip, tail, 0.014, 0.014, 4, rows.wood, PAT.NONE);
      const f0 = [ox, 0.46 * s, oz + 0.46 * c];
      for (const [ax, ay] of [
        [0.04, 0],
        [-0.04, 0],
        [0, 0.04],
      ])
        mb.quad(
          f0,
          [f0[0] + ax, f0[1] + ay * c, f0[2] - ay * s],
          [tail[0] + ax, tail[1] + ay * c, tail[2] - ay * s],
          tail,
          rows.feather,
          PAT.NONE,
        );
    }
  }

  // ---- view/hostiles.js ----
  // ============================================================
  // HOSTILES — what hunts out in the wild. Wolves in packs, the great cats
  // alone or in pairs, bears in the woods, white bears on the ice. They come
  // from out of sight, more often by night: they notice you, stalk you and
  // come in at a run. A pack circles and darts in one at a time; a cat comes
  // low and then charges; a bear just comes. Before a bite or a swipe they
  // gather themselves (step back and it falls short). A torch in their faces
  // makes wolves and cats think again, none will come close to a lit fire,
  // and none go near a town, a farm, an inn, a camp or your own house. Hurt
  // badly, most of them run. Killed, they lie where they fell, for their
  // hides and meat. Everything moves on the ground like the herds do.
  // Raiders come off the roads after dark, masked. And each world's story
  // has creatures of its own out in the land: a dragon's ash hounds, beasts
  // gone grey with the blight, a besieging horde's soldiers or a rival
  // people's war-bands, the drowned walking up out of the sea, frost wolves
  // as the world goes cold, the dead walking at night. More of them the
  // nearer the story's heart, and more every time its clock comes round.
  // ============================================================

