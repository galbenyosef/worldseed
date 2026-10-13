// index-inline-2 99 — room
// Lines 50821-51132 of readable/index-inline-2.pretty.js (statement-aligned).
  void frameAt;

  // ---- view/decor.js ----
  // ============================================================
  // DECOR — setting things out in your own house: on the floor, a table, a
  // shelf or the lid of the chest, or hung on a wall. While you choose, the
  // thing shows see-through where it would go, lying flat or hanging, and
  // turns when you ask it to. Everything is drawn from its own pixel picture,
  // one pixel thick.
  // ============================================================

  Object.assign(GroundView.prototype, {
    // the house of yours you are standing in, if any (its view)
    homeHere() {
      if (!this.siteViews || this.cave) return null;
      for (const v of this.siteViews.values()) {
        if (v.site.kind !== "home" || !v.rooms.length) continue;
        if (arcM(this.p, v.site.dir, this.R) > v.plan.r + 4) continue;
        if (this.inRoomOf(v)) return v;
      }
      return null;
    },
    // the room of a place you are in (a round room: anywhere inside its wall)
    inRoomOf(v) {
      const [lx, lz] = this.hostLocal(v, this.p);
      for (const r of v.rooms) {
        if (this.eyeY < v.base + r.y0 || this.eyeY > v.base + r.y1 + 1)
          continue;
        if (r.ring) {
          if (Math.hypot(lx - r.x, lz - r.z) < r.ring.r - 0.15) return r;
          continue;
        }
        const u = (lx - r.x) * r.cs + (lz - r.z) * r.sn,
          w = -(lx - r.x) * r.sn + (lz - r.z) * r.cs;
        if (Math.abs(u) < r.hx + 0.1 && Math.abs(w) < r.hz + 0.1) return r;
      }
      return null;
    },

    // Where a thing of this size would go if you set it down where you are looking: the nearest of
    // the floor, a flat top (a table, a shelf, the bed, the chest) and the walls (clear of the doorway).
    // In the place's own metres (x east, y up from its base, z south), with which way it faces.
    decorAim(v, size) {
      const room = v && this.inRoomOf(v);
      if (!room) return { ok: false, why: "stand inside your house" };
      const [ex, ez] = this.hostLocal(v, this.p),
        ey = this.eyeY - v.base;
      const hd = -this.yaw,
        cp = Math.cos(this.pitch);
      const dx = Math.sin(hd) * cp,
        dy = Math.sin(this.pitch),
        dz = -Math.cos(hd) * cp;
      const half = size * 0.5,
        REACH = 4.2;
      let best = null,
        far = false,
        built = false;
      // (not on the floor under an oven, a bench or a loom, nor on the wall behind one)
      const underWork = (x, y, z) =>
        v.boxes.some((q) => {
          if (!q.work) return false;
          const lx = x - q.x,
            lz = z - q.z,
            u = lx * q.cs + lz * q.sn,
            w = -lx * q.sn + lz * q.cs;
          return (
            Math.abs(u) < q.hx + 0.12 &&
            Math.abs(w) < q.hz + 0.12 &&
            y + v.base < q.top + 0.2
          );
        });
      const take = (t, hit) => {
        if (t >= REACH) {
          far = true;
          return;
        }
        if (hit.on !== "top" && underWork(hit.x, hit.y, hit.z)) {
          built = true;
          return;
        }
        if (t > 0.2 && (!best || t < best.t)) best = { t, ...hit };
      };
      const inRect = (q, x, z, m) => {
        const lx = x - q.x,
          lz = z - q.z,
          u = lx * q.cs + lz * q.sn,
          w = -lx * q.sn + lz * q.cs;
        return Math.abs(u) <= q.hx - m && Math.abs(w) <= q.hz - m;
      };
      // flat places: the floor, and anything with a top you look down on
      if (dy < -0.02) {
        const t = (room.y0 - ey) / dy,
          x = ex + dx * t,
          z = ez + dz * t;
        const ok = room.ring
          ? Math.hypot(x - room.x, z - room.z) <=
            room.ring.r * Math.cos(Math.PI / room.ring.n) - half * 0.7 - 0.08
          : inRect(room, x, z, half * 0.7 - 0.06);
        if (ok) take(t, { x, y: room.y0, z, flat: true, on: "floor" });
        for (const q of v.tops) {
          if (q.y > ey - 0.05) continue;
          const t2 = (q.y - ey) / dy,
            x2 = ex + dx * t2,
            z2 = ez + dz * t2;
          if (
            inRect(q, x2, z2, Math.min(half * 0.5, Math.min(q.hx, q.hz) * 0.8))
          )
            take(t2, { x: x2, y: q.y, z: z2, flat: true, on: "top" });
        }
      }
      // the walls: hung between the floor and the ceiling, never across the doorway
      const ylo = room.y0 + 0.35 + half * 0.7,
        yhi = room.y1 - 0.15 - half * 0.7;
      if (ylo <= yhi) {
        if (room.ring) {
          const ring = room.ring,
            n = ring.n;
          const L = (a) => {
            const lx = Math.cos(a) * ring.r,
              lz = Math.sin(a) * ring.r;
            return [
              room.x + lx * room.cs - lz * room.sn,
              room.z + lx * room.sn + lz * room.cs,
            ];
          };
          for (let k = 0; k < n; k++) {
            if (k === ring.door) continue;
            const A = L((k / n) * Math.PI * 2),
              B = L(((k + 1) / n) * Math.PI * 2);
            const sx = B[0] - A[0],
              sz = B[1] - A[1],
              den = dx * sz - dz * sx,
              seg = Math.hypot(sx, sz);
            if (Math.abs(den) < 1e-6) continue;
            const qx = A[0] - ex,
              qz = A[1] - ez,
              t = (qx * sz - qz * sx) / den,
              sp = (qx * dz - qz * dx) / den;
            const m = Math.min(0.45, (half * 0.7) / seg + 0.02),
              y = ey + dy * t;
            if (sp < m || sp > 1 - m || y < ylo || y > yhi) continue;
            // into the room: from the middle of that stretch of wall towards the middle of the house
            const mx = room.x - (A[0] + B[0]) / 2,
              mz = room.z - (A[1] + B[1]) / 2;
            take(t, {
              x: ex + dx * t,
              y,
              z: ez + dz * t,
              flat: false,
              b: Math.atan2(mx, -mz),
              on: "wall",
            });
          }
        } else {
          const lx = ex - room.x,
            lz = ez - room.z;
          const u0 = lx * room.cs + lz * room.sn,
            w0 = -lx * room.sn + lz * room.cs;
          const du = dx * room.cs + dz * room.sn,
            dw = -dx * room.sn + dz * room.cs;
          const U = room.hx + 0.04,
            W = room.hz + 0.04;
          for (const [ax, sg] of [
            [0, 1],
            [0, -1],
            [1, 1],
            [1, -1],
          ]) {
            const d = ax ? dw : du;
            if (Math.abs(d) < 1e-6) continue;
            const t = (sg * (ax ? W : U) - (ax ? w0 : u0)) / d,
              u = u0 + du * t,
              w = w0 + dw * t,
              y = ey + dy * t;
            const along = ax ? u : w,
              lim = (ax ? U : W) - half * 0.7 - 0.05;
            if (Math.abs(along) > lim || y < ylo || y > yhi) continue;
            if (
              ax &&
              sg > 0 &&
              room.dx != null &&
              Math.abs(u - room.dx) < 0.62 + half * 0.7
            )
              continue;
            // the way into the room from this wall
            const nx = -sg * (ax ? -room.sn : room.cs),
              nz = -sg * (ax ? room.cs : room.sn);
            take(t, {
              x: ex + dx * t,
              y,
              z: ez + dz * t,
              flat: false,
              b: Math.atan2(nx, -nz),
              on: "wall",
            });
          }
        }
      }
      if (!best)
        return {
          ok: false,
          why: far
            ? "too far. Come closer"
            : built
              ? "not there: something is built there"
              : "look at the floor, a table, a shelf or a wall",
        };
      return { ok: true, ...best };
    },

    // ---------- the see-through thing, while you choose ----------
    startDecorGhost(opts) {
      const g = {
        kind: "decor",
        id: opts.id,
        worn: !!opts.worn,
        full: !!opts.full,
        size: showSize(opts.id),
        rot: 0,
        ok: false,
        why: null,
        hit: null,
        v: this.homeHere(),
        meshes: null,
      };
      g.px = iconPixels(g.id, g.worn);
      this.ghost = g;
      this.decorGhostMeshes(g);
      if (this.pitch > -0.3) this.pitch = -0.3;
      this.stepGhost();
    },
    // two of it: lying flat (it turns with you), and hanging (it turns in the wall)
    decorGhostMeshes(g) {
      if (g.meshes)
        for (const m of Object.values(g.meshes)) {
          this.scene.remove(m);
          m.geometry.dispose();
        }
      const mk = (flat) => {
        const mb = new MeshBuf();
        iconSolidInto(
          mb,
          g.px,
          g.size,
          decorFrame(
            [0, 0, 0],
            flat ? 0 : Math.PI,
            flat,
            g.size,
            flat ? 0 : g.rot,
          ),
          (c) => this.row(c),
        );
        this.syncRamps();
        const m = this.meshOf(mb.finish(), this.ghostMat());
        m.visible = false;
        this.scene.add(m);
        return m;
      };
      g.meshes = { flat: mk(true), wall: mk(false) };
    },
    // R, or the Turn button: an eighth of a turn
    turnGhost() {
      const g = this.ghost;
      if (!g || g.kind !== "decor") return;
      g.rot = (g.rot + Math.PI / 4) % (Math.PI * 2);
      this.decorGhostMeshes(g);
      this.stepGhost();
    },
    stepDecorGhost(g) {
      const v = this.homeHere() || g.v;
      g.v = v;
      const hit =
        v && this.siteViews.get(v.site.id) === v
          ? this.decorAim(v, g.size)
          : { ok: false, why: "stand inside your house" };
      g.hit = hit.ok ? hit : null;
      g.ok = !!hit.ok && !g.full;
      g.why = g.full
        ? "your house is full of things. Take something down first"
        : hit.why || null;
      this.ghostMaterial.uniforms.uBad.value = g.ok ? 0 : 1;
      g.meshes.flat.visible = g.meshes.wall.visible = false;
      if (!hit.ok) return;
      const m = hit.flat ? g.meshes.flat : g.meshes.wall;
      hit.bear = hit.flat ? -this.yaw + g.rot : hit.b;
      const dir = stepOn(v.site.dir, v.F, hit.x, -hit.z, this.R);
      m.visible = true;
      this.placeMatrix(
        m,
        dir,
        frameAt(dir),
        v.base + hit.y,
        hit.flat ? hit.bear : hit.bear - Math.PI,
      );
    },
  });

  // ---- view/fauna.js ----
  // ============================================================
  // FAUNA — life that is not people.
  // Birds: flocks wheeling over the woods and fields by day, gulls along the
  // shore, a bird of prey circling high over open country, small birds on the
  // ground that burst up when you come close. Herds: the land's own beast (the
  // people's white elk, tallbacks, shell-oxen...) built from its name, grazing
  // in open country. They lift their heads when you come near and run when you
  // come nearer. Nothing here can be caught yet, and none of it is saved:
  // animals come and go like the weather.
  // ============================================================

  // ---------- birds: one instanced mesh for all of them ----------
  const BIRD_MAX = 120;
