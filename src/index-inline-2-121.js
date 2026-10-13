// index-inline-2 121 — dir
// Lines 61102-61550 of readable/index-inline-2.pretty.js (statement-aligned).
  Object.assign(GroundView.prototype, {
    mountInfo(people, seed) {
      return mountFor(people, seed);
    },
    // the beast itself: a four-legged body with a saddle on, moving on the herds' bones
    mountMesh(m) {
      const T = this.T,
        P = m.plan,
        r = (c) => this.row(c);
      const rows = {
        main: r(P.col),
        belly: r(P.belly),
        hoof: r([46, 38, 34]),
        horn: r(P.horn || [60, 50, 44]),
        eye: r([22, 18, 18]),
        shell: r(P.shell || P.col),
        spot: r(P.spots || P.col),
        shadow: this.shadowRow,
        mane: r(P.mane || P.col),
        saddle: r([96, 60, 38]),
        blanket: r(m.blanket || [150, 58, 46]),
      };
      const pr = grazerProto(P, rows, mulberry32((m.seed || 1) >>> 0));
      const d = pr.mb.finish();
      this.syncRamps();
      const geo = new T.BufferGeometry();
      for (const [k, a, n] of [
        ["position", d.p, 3],
        ["normal", d.n, 3],
        ["aRow", d.r, 1],
        ["aRow2", d.r2, 1],
        ["aUv", d.uv, 2],
        ["aPat", d.t, 1],
        ["aLv", d.lv, 1],
        ["aBone", d.b, 1],
        ["aPivot", d.pv, 3],
      ])
        geo.setAttribute(k, new T.BufferAttribute(a, n));
      geo.computeBoundingSphere();
      const U = {
        ...this.uniforms,
        uPhase: { value: 0 },
        uAmp: { value: 0 },
        uHeadPitch: { value: 0 },
        uHeadYaw: { value: 0 },
        uTail: { value: 0 },
        uBob: { value: 0 },
        uFadeIn: { value: 1 },
      };
      const mesh = new T.Mesh(
        geo,
        new T.ShaderMaterial({
          uniforms: U,
          vertexShader: ANIMAL_VS,
          fragmentShader: ANIMAL_FS,
          side: T.DoubleSide,
        }),
      );
      mesh.matrixAutoUpdate = false;
      mesh.frustumCulled = false;
      this.scene.add(mesh);
      // where you sit: the saddle's height, and your eyes above it
      return { mesh, U, pr, eye: pr.seat + 0.88, phase: 0 };
    },
    dropMountMesh(mm) {
      if (!mm) return;
      this.scene.remove(mm.mesh);
      mm.mesh.geometry.dispose();
      mm.mesh.material.dispose();
    },

    // ---------- tied up at an inn's or a tavern's rail, waiting to be hired ----------
    tether(host, m, dir, face) {
      this.tethered = this.tethered || [];
      const mm = this.mountMesh(m);
      this.tethered.push({
        host,
        m,
        mm,
        dir,
        F: frameAt(dir),
        h: this.ground.height(dir[0], dir[1], dir[2], 1),
        face,
        t: Math.random() * 6,
        look: 0,
        lookTo: 0,
        pitch: 0.3,
        tail: Math.random() * 5,
      });
    },
    untether(host) {
      if (!this.tethered) return;
      for (const t of this.tethered)
        if (t.host === host) this.dropMountMesh(t.mm);
      this.tethered = this.tethered.filter((t) => t.host !== host);
    },
    stepTethered(dt, nowS) {
      if (!this.tethered) return;
      const R = this.R;
      for (const t of this.tethered) {
        const near = arcM(this.p, t.dir, R) < 600;
        t.mm.mesh.visible = near;
        if (!near) continue;
        // it stands, shifts, looks about, crops at the grass now and then, swishes its tail
        t.t -= dt;
        if (t.t <= 0) {
          t.t = 2 + Math.random() * 5;
          t.lookTo = (Math.random() - 0.5) * 0.9;
          t.pitchTo =
            Math.random() < 0.35
              ? t.mm.pr.graze * 0.85
              : 0.15 + Math.random() * 0.2;
        }
        t.look += (t.lookTo - t.look) * Math.min(1, dt * 2);
        t.pitch += ((t.pitchTo ?? 0.3) - t.pitch) * Math.min(1, dt * 1.5);
        t.tail -= dt;
        const U = t.mm.U;
        U.uHeadYaw.value = t.look;
        U.uHeadPitch.value = t.pitch;
        U.uAmp.value = 0;
        U.uBob.value = 0;
        U.uTail.value = t.tail < 0 ? Math.sin(nowS * 9) * 0.4 : 0;
        if (t.tail < -1.1) t.tail = 2 + Math.random() * 6;
        this.placeMatrix(
          t.mm.mesh,
          t.dir,
          t.F,
          Math.max(-0.4, t.h),
          t.face + Math.PI,
        );
      }
    },

    // ---------- the ride ----------
    rideBegin(J) {
      J.mm = this.mountMesh(J.mount);
      J.mm.U.uFadeIn.value = 1;
    },
    // each frame of a journey on horseback: under you on the road, tethered by the fire at night, beside you at the end
    rideStep(dt, nowS) {
      const J = this.journey,
        R = this.R;
      if (J && J.mm) {
        const st = J.stops[Math.max(0, J.i)],
          mm = J.mm,
          U = mm.U,
          h = -this.yaw;
        // (it is not under you yet while you leave the inn)
        mm.mesh.visible = J.i >= 0;
        if (J.i < 0) {
          /* still at the rail */
        } else if (!st.camp && !st.last) {
          // riding: you sit on it, it trots on under you
          const F = frameAt(this.p);
          const dir = stepOn(
            this.p,
            F,
            Math.sin(h) * mm.pr.seatZ * -1,
            Math.cos(h) * mm.pr.seatZ * -1,
            R,
          );
          const g = this.ground.height(dir[0], dir[1], dir[2], 1);
          U.uPhase.value = mm.phase;
          U.uAmp.value = 0.5;
          U.uBob.value = mm.pr.H * 0.035;
          U.uHeadPitch.value = 0.05 + Math.sin(mm.phase * 2) * 0.05;
          U.uHeadYaw.value = 0;
          U.uTail.value = Math.sin(nowS * 3.1) * 0.15;
          this.placeMatrix(
            mm.mesh,
            dir,
            frameAt(dir),
            Math.max(-0.4, g),
            h + Math.PI,
          );
        } else if (st.camp) {
          // hobbled by the fire for the night, head down
          if (!J.campAt || J.campAt.i !== J.i) {
            const F = frameAt(this.p),
              a = h + 0.55;
            J.campAt = {
              i: J.i,
              dir: stepOn(this.p, F, Math.sin(a) * 4.6, Math.cos(a) * 4.6, R),
              face: h + 1.4,
            };
          }
          const c = J.campAt,
            g = this.ground.height(c.dir[0], c.dir[1], c.dir[2], 1);
          U.uAmp.value = 0;
          U.uBob.value = 0;
          U.uHeadPitch.value = mm.pr.graze * 0.7;
          U.uHeadYaw.value = Math.sin(nowS * 0.3) * 0.2;
          U.uTail.value = Math.sin(nowS * 5) * 0.2;
          this.placeMatrix(
            mm.mesh,
            c.dir,
            frameAt(c.dir),
            Math.max(-0.4, g),
            c.face + Math.PI,
          );
        } else {
          // there: you are down, and it stands beside you
          if (!J.endAt) {
            const F = frameAt(this.p),
              a = h + 0.75;
            J.endAt = {
              dir: stepOn(this.p, F, Math.sin(a) * 2.6, Math.cos(a) * 2.6, R),
              face: h,
            };
          }
          const c = J.endAt,
            g = this.ground.height(c.dir[0], c.dir[1], c.dir[2], 1);
          U.uAmp.value = 0;
          U.uBob.value = 0;
          U.uHeadPitch.value = 0.3;
          U.uHeadYaw.value = -0.4;
          this.placeMatrix(
            mm.mesh,
            c.dir,
            frameAt(c.dir),
            Math.max(-0.4, g),
            c.face + Math.PI,
          );
        }
      }
      // after the ride: it waits a moment, then turns for home and trots off out of sight
      const A = this.rideAfter;
      if (A) {
        A.t += dt;
        const U = A.mm.U;
        if (A.t > 1.6) {
          A.face +=
            Math.atan2(Math.sin(A.home - A.face), Math.cos(A.home - A.face)) *
            Math.min(1, dt * 2.5);
          const sp = Math.min(1, (A.t - 1.6) / 1.5) * 3.2 * dt;
          A.dir = stepOn(
            A.dir,
            frameAt(A.dir),
            Math.sin(A.face) * sp,
            Math.cos(A.face) * sp,
            R,
          );
          A.mm.phase += (sp * 2.4) / A.mm.pr.H;
          U.uPhase.value = A.mm.phase;
          U.uAmp.value = 0.5;
          U.uHeadPitch.value = 0.1;
          U.uFadeIn.value = Math.max(0, 1 - (A.t - 5) / 2.5);
        }
        const g = this.ground.height(A.dir[0], A.dir[1], A.dir[2], 1);
        this.placeMatrix(
          A.mm.mesh,
          A.dir,
          frameAt(A.dir),
          Math.max(-0.4, g),
          A.face + Math.PI,
        );
        if (A.t > 7.5 || arcM(this.p, A.dir, R) > 200) {
          this.dropMountMesh(A.mm);
          this.rideAfter = null;
        }
      }
    },
    // ---------- a beast of your own: in its stable, under you, or waiting where you got down ----------
    // (rec: the house it lives at; rec.stable.out: null at home, 'riding', or { dir, face } where it waits)
    ownMount(rec) {
      const st = rec && rec.stable;
      if (!st) return null;
      const people = rec.owner >= 0 ? this.story.peoples[rec.owner] : null;
      return this.mountInfo(people, st.seed || 1);
    },
    // get up on it, from its stable or from where it waits: you sit where it stood, facing the way it faced
    mountUp(rec) {
      const st = rec && rec.stable;
      if (!st || this.riding || this.journey || this.cave || this.wake)
        return false;
      let dir = null,
        face = 0;
      if (st.out && typeof st.out === "object") {
        dir = st.out.dir;
        face = st.out.face;
        this.untetherLoose(rec);
      } else {
        const v = this.siteViews && this.siteViews.get(rec.id),
          t = v && (this.tethered || []).find((q) => q.host === v);
        if (!t) return false;
        dir = t.dir;
        face = t.face;
      }
      const m = this.ownMount(rec),
        mm = this.mountMesh(m);
      mm.U.uFadeIn.value = 1;
      st.out = "riding";
      if (this.siteViews && this.siteViews.get(rec.id)) this.refreshHome(rec);
      this.riding = { rec, m, mm, speed: 0, from: dir.slice() };
      this.p = dir.slice();
      this.yaw = -face;
      this.pitch = 0;
      this.vy = 0;
      this.eyeY =
        Math.max(-0.4, this.ground.height(dir[0], dir[1], dir[2], 1)) + mm.eye;
      return true;
    },
    // get down: it stands where you sat, and you beside it (at home, by its stable, it goes back in)
    getDown(how = "wait") {
      const Rd = this.riding;
      if (!Rd) return;
      const R = this.R,
        rec = Rd.rec,
        h = -this.yaw,
        F = frameAt(this.p),
        at = this.p.slice();
      this.dropMountMesh(Rd.mm);
      this.riding = null;
      const home = this.siteViews && this.siteViews.get(rec.id),
        S = home && home.stableAt;
      const nearStable =
        S && arcM(at, stepOn(home.site.dir, home.F, S.x, -S.z, R), R) < 18;
      if (how === "home" || nearStable) {
        rec.stable.out = null;
        if (home) this.refreshHome(rec);
      } else {
        rec.stable.out = { dir: at, face: h };
        this.tetherLoose(rec);
      }
      if (how === "stay") return;
      // (down on its left)
      const side = h - Math.PI / 2;
      this.p = stepOn(at, F, Math.sin(side) * 1.15, Math.cos(side) * 1.15, R);
      this.vy = 0;
      this.eyeY =
        Math.max(-0.4, this.ground.height(this.p[0], this.p[1], this.p[2], 1)) +
        1.7;
    },
    // waiting where you left it, head down, cropping at whatever grows there
    tetherLoose(rec) {
      this.untetherLoose(rec);
      const o = rec.stable && rec.stable.out;
      if (!o || typeof o !== "object" || !this.tether) return;
      this.tether({ looseOf: rec.id }, this.ownMount(rec), o.dir, o.face);
    },
    untetherLoose(rec) {
      if (!this.tethered) return;
      const t = this.tethered.find((q) => q.host && q.host.looseOf === rec.id);
      if (t) this.untether(t.host);
    },
    // your beast waiting nearby, if you are looking its way
    looseNear(maxM = 3.2) {
      if (!this.tethered || this.riding) return null;
      const R = this.R;
      for (const t of this.tethered) {
        if (!t.host || !t.host.looseOf) continue;
        const m = arcM(this.p, t.dir, R);
        if (m > maxM) continue;
        const want = bearingTo(this.p, t.dir),
          d = Math.atan2(Math.sin(want + this.yaw), Math.cos(want + this.yaw));
        if (Math.abs(d) > 0.8 && m > 1.4) continue;
        const rec = (this.world.homes || []).find(
          (h) => h.id === t.host.looseOf,
        );
        if (rec) return rec;
      }
      return null;
    },
    // now and then: a beast left too far behind finds its own way home; one left waiting shows where it waits
    syncLoose() {
      if (!this.world) return;
      const R = this.R;
      for (const rec of this.world.homes || []) {
        const o = rec.stable && rec.stable.out;
        if (o === "riding" && (!this.riding || this.riding.rec !== rec)) {
          rec.stable.out = null;
          this.refreshHome(rec);
          continue;
        }
        if (!o || typeof o !== "object") continue;
        if (arcM(this.p, o.dir, R) > 900) {
          this.untetherLoose(rec);
          rec.stable.out = null;
          this.refreshHome(rec);
          continue;
        }
        if (
          !(this.tethered || []).some(
            (q) => q.host && q.host.looseOf === rec.id,
          )
        )
          this.tetherLoose(rec);
      }
    },
    // each frame in the saddle: it moves under you, its legs going as fast as you are
    rideFree(dt, nowS) {
      const Rd = this.riding;
      if (!Rd) return;
      const R = this.R,
        mm = Rd.mm,
        U = mm.U,
        h = -this.yaw;
      const F = frameAt(this.p);
      const dir = stepOn(
        this.p,
        F,
        Math.sin(h) * mm.pr.seatZ * -1,
        Math.cos(h) * mm.pr.seatZ * -1,
        R,
      );
      const g = this.ground.height(dir[0], dir[1], dir[2], 1);
      const sp = Rd.speed || 0,
        k = Math.min(1, sp / 13);
      mm.phase += (sp * dt * 2.2) / Math.max(0.8, mm.pr.H);
      U.uPhase.value = mm.phase;
      U.uAmp.value = sp > 0.3 ? 0.3 + 0.35 * k : 0;
      U.uBob.value = sp > 0.3 ? mm.pr.H * (0.02 + 0.03 * k) : 0;
      U.uHeadPitch.value =
        sp > 0.3 ? 0.05 + Math.sin(mm.phase * 2) * 0.05 : 0.15;
      U.uHeadYaw.value = 0;
      U.uTail.value = Math.sin(nowS * 3.1) * (0.1 + 0.2 * k);
      this.placeMatrix(
        mm.mesh,
        dir,
        frameAt(dir),
        Math.max(-0.4, g),
        h + Math.PI,
      );
    },
    // the journey is over: what was under you goes home
    rideEnd(J) {
      if (!J.mm) return;
      if (this.rideAfter) this.dropMountMesh(this.rideAfter.mm);
      const c = J.endAt || { dir: this.p.slice(), face: -this.yaw };
      this.rideAfter = {
        mm: J.mm,
        dir: c.dir,
        face: c.face,
        home: c.face + Math.PI,
        t: 0,
      };
      J.mm = null;
    },
  });

  // ---- ui/ember.js ----
  // ============================================================
  // EMBER — the spark the observer left in you, kept in a small glass locket:
  // the only gauge you get. The flame's size is your health, its colour your
  // warmth (gold to blue), the coals in the bottom of the glass how fed you are,
  // the sparks circling inside the rim your breath. It shows while something
  // is changing or wrong, and fades away when you are fine.
  // ============================================================

