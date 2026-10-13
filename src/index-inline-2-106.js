// index-inline-2 106 — math
// Lines 53981-54870 of readable/index-inline-2.pretty.js (statement-aligned).
  Object.assign(GroundView.prototype, {
    // ---------- once, when a town or a place is built ----------
    // homes: per building index, what houseAt gave back plus its door outside
    setRoutines(host, X) {
      host.rtx = X;
      X.seats = new Map();
      X.beds = new Map();
      X.has = {
        tavern: X.tavern >= 0 && !!X.homes[X.tavern],
        square: !!(X.square && X.square.length),
      };
      for (const f of host.folk) {
        const info = f.info;
        if (!info || !info.job || info.lostTale || info.k >= 90) continue;
        f.rt = routineOf(info.seed >>> 0, info.job);
        f.homeI = info.home ?? -1;
        f.workP = info.work || null;
        f.wander = false;
      }
      this.stepRoutines(host, 0, true);
    },

    // where a building's people come out (outside its door)
    doorOf(X, i) {
      const h = X.homes[i];
      return h ? h.door : null;
    },
    // what a built house means to the people of a place: its door, and if it is open its way in,
    // where to stand inside, its seats and its beds (in the caller's metres)
    homeOf(b, ins) {
      const cs = Math.cos(b.rot),
        sn = Math.sin(b.rot);
      let dx = 0;
      if (!b.round) {
        const nwF = Math.max(1, Math.floor(b.w / 2.4));
        dx = -b.w / 2 + ((Math.floor(nwF / 2) + 0.5) * b.w) / nwF;
      }
      const fz = (b.round ? b.w / 2 : b.d / 2) + 1.3;
      const h = {
        open: !!ins.open,
        door: [b.x + dx * cs - fz * sn, b.z + dx * sn + fz * cs],
        doorFace: Math.atan2(-sn, -cs),
        beds: ins.beds || [],
        seats: ins.seats || [],
        spots: ins.spots || {},
      };
      if (ins.open && ins.entry) {
        const e = ins.entry;
        h.entry = [e.x, e.z];
        h.door = h.entry;
        h.inside = [e.x + e.ix * 2.7, e.z + e.iz * 2.7];
        h.inFace = Math.atan2(e.ix, -e.iz);
      } else h.open = false;
      return h;
    },

    // ---------- each frame ----------
    stepRoutines(host, dt, snap = false) {
      const X = host.rtx;
      if (!X) return;
      const fday = this.dayFrac ?? 0.5,
        day = this.dayNum ?? 0;
      for (const f of host.folk) {
        if (!f.rt || f.leaving || f.gone) continue;
        if (f === this.talkTo) {
          f.walk = 0;
          continue;
        }
        f.rtAt = (f.rtAt ?? 0) - dt;
        if (f.rtAt <= 0 || snap) {
          f.rtAt = 0.8 + Math.random() * 0.8;
          const act = activityAt(f.rt, fday, day, X.has);
          if (act !== f.act || snap) this.beginActivity(host, f, act, snap);
        }
        this.moveRoutine(host, f, dt);
      }
    },

    // ---------- what an activity means here: where to go, and how to be there ----------
    // returns { x, z, inB, pose: stand|sit|lie|work|hide, face, seat, bed, y }
    placeFor(host, f, act) {
      const X = host.rtx,
        home = X.homes[f.homeI];
      const free = (map, key) => !map.has(key) || map.get(key) === f;
      const standIn = (i, spot, k = 0) => {
        // somewhere to stand in a building: its spot, shuffled a little per person so nobody stacks
        const h = X.homes[i];
        const a = ((f.rt.seed % 997) / 997 + k * 0.37) * Math.PI * 2,
          r = 0.55;
        const s = spot || { x: h.inside[0], z: h.inside[1], face: h.inFace };
        return {
          x: s.x + Math.cos(a) * r,
          z: s.z + Math.sin(a) * r,
          inB: i,
          pose: "stand",
          face: s.face + (Math.random() - 0.5) * 0.8,
        };
      };
      const hideAt = (i) => {
        const h = X.homes[i];
        return h
          ? { x: h.door[0], z: h.door[1], inB: -1, pose: "hide", into: i }
          : this.edgeFor(host, f);
      };
      switch (act) {
        case "sleep": {
          if (!home) return this.edgeFor(host, f);
          if (home.open && home.beds.length) {
            for (let k = 0; k < home.beds.length; k++) {
              const key = f.homeI + ":" + k;
              if (free(X.beds, key)) {
                X.beds.set(key, f);
                const b = home.beds[k];
                return {
                  x: b.x,
                  z: b.z,
                  inB: f.homeI,
                  pose: "lie",
                  bed: b,
                  bedKey: key,
                };
              }
            }
          }
          return hideAt(f.homeI);
        }
        case "home":
          if (!home) return this.squareFor(host, f);
          if (home.open) {
            // a stool by the table if there is one free, else by the hearth
            for (let k = 0; k < home.seats.length; k++) {
              const key = f.homeI + ":" + k;
              if (free(X.seats, key)) {
                X.seats.set(key, f);
                const s = home.seats[k];
                return {
                  x: s.x,
                  z: s.z,
                  inB: f.homeI,
                  pose: "sit",
                  face: s.face,
                  seatKey: key,
                };
              }
            }
            return standIn(f.homeI, home.spots.hearth || home.spots.table);
          }
          return hideAt(f.homeI);
        case "tavern": {
          // (in the great city, the tavern nearest home)
          const ti =
            f.info &&
            f.info.tavI != null &&
            f.info.tavI >= 0 &&
            X.homes[f.info.tavI]
              ? f.info.tavI
              : X.tavern;
          const t = X.homes[ti];
          if (!t) return this.squareFor(host, f);
          for (let k = 0; k < t.seats.length; k++) {
            const key = ti + ":" + k;
            if (free(X.seats, key)) {
              X.seats.set(key, f);
              const s = t.seats[k];
              return {
                x: s.x,
                z: s.z,
                inB: ti,
                pose: "sit",
                face: s.face,
                seatKey: key,
              };
            }
          }
          // the benches are full: stand at the counter, shoulder to shoulder in rows (not in each other)
          const kp = t.spots.keeper;
          if (kp) {
            const fx = Math.sin(kp.face),
              fz = -Math.cos(kp.face),
              sx = Math.cos(kp.face),
              sz = Math.sin(kp.face);
            for (let k = 0; k < 9; k++) {
              const key = ti + ":stand" + k;
              if (!free(X.seats, key)) continue;
              X.seats.set(key, f);
              const row = Math.floor(k / 3),
                col = [0, -1, 1][k % 3],
                out = 1.45 + row * 0.8;
              return {
                x: kp.x + fx * out + sx * col * 0.8,
                z: kp.z + fz * out + sz * col * 0.8,
                inB: ti,
                pose: "stand",
                face: kp.face + Math.PI - col * 0.25,
                seatKey: key,
              };
            }
            return {
              ...standIn(ti, {
                x: kp.x + fx * 1.45,
                z: kp.z + fz * 1.45,
                face: kp.face + Math.PI,
              }),
              inB: ti,
            };
          }
          return standIn(ti, null);
        }
        case "work": {
          const w = f.workP;
          if (f.rt.job === "tavern") {
            const t = X.homes[f.homeI];
            if (t && t.open && t.spots.keeper)
              return {
                x: t.spots.keeper.x,
                z: t.spots.keeper.z,
                inB: f.homeI,
                pose: "stand",
                face: t.spots.keeper.face,
              };
            return hideAt(f.homeI);
          }
          if (f.rt.job === "field" && X.fields && X.fields.length)
            return this.fieldSpot(host, f);
          // (the priest of the great city's temple, at its altar)
          if (w && w.kind === "temple") {
            const H = X.homes[X.temple];
            if (H && H.open && H.spots.altar)
              return standIn(X.temple, H.spots.altar, 0);
            if (H)
              return {
                x: H.door[0],
                z: H.door[1],
                inB: -1,
                pose: "stand",
                face: H.doorFace,
              };
            return this.squareFor(host, f);
          }
          if (w && w.kind === "hall") {
            const H = X.homes[X.hall];
            if (H && H.open && H.spots.hall)
              return standIn(X.hall, H.spots.hall, f.rt.seed % 3);
            if (H)
              return {
                x: H.door[0],
                z: H.door[1],
                inB: -1,
                pose: "stand",
                face: H.doorFace,
              };
            return this.squareFor(host, f);
          }
          if (w && w.x != null)
            return {
              x: w.x,
              z: w.z,
              inB: -1,
              pose: w.kind === "bench" || w.kind === "forge" ? "work" : "stand",
              face: w.face,
            };
          return this.squareFor(host, f);
        }
        case "away":
          return this.edgeFor(host, f);
        case "square":
          return this.squareFor(host, f);
        case "wander":
          return this.wanderSpot(host, f);
        case "watch":
          return { watch: true };
      }
      return this.squareFor(host, f);
    },
    // out of the place: along the home street past the last house (a town), or off into the land
    edgeFor(host, f) {
      const X = host.rtx;
      if (X.city) {
        // out through the gate nearest home
        const h = X.homes[f.homeI],
          p = h ? h.door : [1, 0],
          th = Math.atan2(p[1], p[0]);
        let kk = f.rt.seed % X.n,
          bd = 9;
        X.city.ang.forEach((A, k) => {
          const d = Math.abs(Math.atan2(Math.sin(th - A), Math.cos(th - A)));
          if (d < bd) {
            bd = d;
            kk = k;
          }
        });
        return {
          x: X.u[kk][0] * X.tEdge,
          z: X.u[kk][1] * X.tEdge,
          inB: -1,
          pose: "hide",
        };
      }
      if (X.town) {
        const h = X.homes[f.homeI],
          k = h ? this.streetOf(X, h.door) : f.rt.seed % X.n;
        const kk = k < 0 ? f.rt.seed % X.n : k;
        return {
          x: X.u[kk][0] * X.tEdge,
          z: X.u[kk][1] * X.tEdge,
          inB: -1,
          pose: "hide",
        };
      }
      const a = ((f.rt.seed % 360) * Math.PI) / 180,
        r = (X.r || 12) + 26;
      return { x: Math.cos(a) * r, z: Math.sin(a) * r, inB: -1, pose: "hide" };
    },
    squareFor(host, f) {
      const X = host.rtx;
      if (!X.square || !X.square.length) return this.wanderSpot(host, f);
      const s = X.square[f.rt.seed % X.square.length];
      return {
        x: s.x + (Math.random() - 0.5) * 0.6,
        z: s.z + (Math.random() - 0.5) * 0.6,
        inB: -1,
        pose: s.seat ? "sit" : "stand",
        face: s.face,
      };
    },
    wanderSpot(host, f) {
      const X = host.rtx;
      if (X.town) {
        // somewhere on the square, clear of what stands in its middle and of the stalls
        const a = Math.random() * Math.PI * 2,
          r =
            X.feat + 1.5 + Math.random() * Math.max(0.5, X.plazaR - X.feat - 5);
        return {
          x: Math.cos(a) * r,
          z: Math.sin(a) * r,
          inB: -1,
          pose: "stand",
          face: Math.random() * 6.28,
          wander: true,
        };
      }
      if (X.square && X.square.length && Math.random() < 0.6)
        return { ...this.squareFor(host, f), wander: true };
      const a = Math.random() * Math.PI * 2,
        r = 3 + Math.random() * 6;
      return {
        x: Math.cos(a) * r,
        z: Math.sin(a) * r,
        inB: -1,
        pose: "stand",
        face: Math.random() * 6.28,
        wander: true,
      };
    },
    fieldSpot(host, f) {
      const X = host.rtx,
        fl =
          X.fields[
            (f.rt.seed + (f.fieldN = (f.fieldN || 0) + 1)) % X.fields.length
          ];
      const u = (Math.random() - 0.5) * fl.w * 0.8,
        v = (Math.random() - 0.5) * fl.d * 0.8,
        cs = Math.cos(fl.rot),
        sn = Math.sin(fl.rot);
      return {
        x: fl.x + u * cs - v * sn,
        z: fl.z + u * sn + v * cs,
        inB: -1,
        pose: "work",
        face: Math.random() * 6.28,
        field: true,
      };
    },

    // ---------- a new activity: let go of the old one, find the way to the new ----------
    beginActivity(host, f, act, snap) {
      const X = host.rtx;
      // give back a seat or a bed
      if (f.seatKey) {
        if (X.seats.get(f.seatKey) === f) X.seats.delete(f.seatKey);
        f.seatKey = null;
      }
      if (f.bedKey) {
        if (X.beds.get(f.bedKey) === f) X.beds.delete(f.bedKey);
        f.bedKey = null;
      }
      f.act = act;
      // where they really are now (walking the watch's round moves them by other means)
      if (f.dir && !f.hidden) {
        const q = this.hostLocal(host, f.dir);
        f.lx = q[0];
        f.lz = q[1];
      }
      const tgt = this.placeFor(host, f, act);
      f.tgt = tgt;
      if (tgt.seatKey) f.seatKey = tgt.seatKey;
      if (tgt.bedKey) f.bedKey = tgt.bedKey;
      if (tgt.watch) {
        this.unpose(f);
        f.wander = true;
        f.path = null;
        if (!f.mesh.visible)
          this.appearAt(host, f, this.doorOf(X, f.homeI) || [0, 0]);
        return;
      }
      f.wander = false;
      const far = snap || !f.dir || arcM(this.p, f.dir, this.R) > NEAR_WALK;
      if (far || f.lx == null) {
        this.unpose(f);
        this.settle(host, f, tgt);
        return;
      }
      // from where they are (or the door of where they were hidden) along the way
      let from = [f.lx, f.lz],
        fromB = f.inB ?? -1,
        foot0 = null;
      if (f.hidden) {
        let src =
          f.hidIn != null && X.homes[f.hidIn]
            ? X.homes[f.hidIn].door
            : f.hidAt || from;
        // (out of a house up on stilts: down its ladder first)
        if (f.hidIn != null && X.homes[f.hidIn] && X.homes[f.hidIn].foot)
          foot0 = X.homes[f.hidIn].foot;
        // coming back from out of the place: from far enough off that you do not see them appear
        if (f.hidIn == null && src) {
          const L = Math.hypot(src[0], src[1]) || 1,
            c = host.s ? host.s.dir : host.site.dir;
          for (
            let k = 0;
            k < 4 &&
            arcM(this.p, stepOn(c, host.F, src[0], -src[1], this.R), this.R) <
              40;
            k++
          )
            src = [src[0] + (src[0] / L) * 20, src[1] + (src[1] / L) * 20];
        }
        this.appearAt(host, f, src);
        from = src;
        fromB = -1;
      }
      this.unpose(f);
      f.path = foot0
        ? [foot0].concat(this.pathBetween(host, foot0, -1, tgt))
        : this.pathBetween(host, from, fromB, tgt);
    },
    unpose(f) {
      f.sit = 0;
      f.lie = false;
      f.working = 0;
    },
    appearAt(host, f, p) {
      f.hidden = false;
      f.hidIn = null;
      f.hidAt = null;
      f.lx = p[0];
      f.lz = p[1];
      f.inB = -1;
      this.folkTo(host, f);
      f.mesh.visible = true;
    },
    // straight there, in the pose
    settle(host, f, tgt) {
      f.path = null;
      f.lx = tgt.x;
      f.lz = tgt.z;
      f.inB = tgt.inB ?? -1;
      this.arrive(host, f);
    },
    arrive(host, f) {
      const tgt = f.tgt;
      f.walk = 0;
      f.path = null;
      if (!tgt) return;
      if (tgt.pose === "hide") {
        // off out of the place: not in front of your eyes, though; on a little further if you are close
        if (tgt.into == null && arcM(this.p, f.dir, this.R) < 32) {
          const L = Math.hypot(tgt.x, tgt.z) || 1;
          tgt.x += (tgt.x / L) * 25;
          tgt.z += (tgt.z / L) * 25;
          f.path = [[tgt.x, tgt.z]];
          return;
        }
        f.hidden = true;
        f.hidIn = tgt.into ?? null;
        f.hidAt = [tgt.x, tgt.z];
        f.mesh.visible = false;
        f.lx = tgt.x;
        f.lz = tgt.z;
        this.folkTo(host, f);
        return;
      }
      f.hidden = false;
      f.mesh.visible = true;
      if (tgt.face != null) f.face = tgt.face;
      if (tgt.pose === "sit") f.sit = 1;
      else if (tgt.pose === "work") f.working = 1;
      else if (tgt.pose === "lie") {
        // feet at the foot of the bed, head on the pillow
        const b = tgt.bed,
          hx = Math.sin(b.head),
          hz = -Math.cos(b.head),
          back = (b.len || 2) / 2 - 0.12;
        f.lx = b.x - hx * back;
        f.lz = b.z - hz * back;
        f.lie = true;
        f.face = b.head + Math.PI;
      }
      this.folkTo(host, f);
      if (tgt.pose === "lie") f.h = host.base + tgt.bed.y;
      if (tgt.wander) f.wanderWait = 3 + Math.random() * 7;
      if (tgt.field) f.wanderWait = 8 + Math.random() * 14;
    },
    // put the person where their host-local position says (and on the floor if indoors)
    folkTo(host, f) {
      const c = host.s ? host.s.dir : host.site.dir;
      f.dir = stepOn(c, host.F, f.lx, -f.lz, this.R);
      f.F = frameAt(f.dir);
      const G = this.ground,
        gh = Math.max(-0.2, G.height(f.dir[0], f.dir[1], f.dir[2], 1));
      const fl = this.floorAt(host, f.dir);
      f.h = fl != null ? Math.max(gh, fl) : gh;
    },

    // ---------- the way from a to b ----------
    pathBetween(host, from, fromB, tgt) {
      const X = host.rtx,
        pts = [];
      // out through the door of the building you are in (and down its ladder, if it is up on stilts)
      if (fromB >= 0 && X.homes[fromB] && X.homes[fromB].open) {
        const h = X.homes[fromB];
        pts.push(h.inside, h.entry);
        from = h.entry;
        if (h.foot && fromB !== tgt.inB) {
          pts.push(h.foot);
          from = h.foot;
        }
      }
      const intoB = tgt.inB >= 0 ? tgt.inB : tgt.into != null ? -2 : -1;
      const H = tgt.inB >= 0 ? X.homes[tgt.inB] : null,
        shut = tgt.into != null ? X.homes[tgt.into] : null;
      // (into one up on stilts: by the foot of its ladder, then up it)
      const via = (H && H.foot) || (shut && shut.foot) || null;
      const end = via || (H ? H.entry : [tgt.x, tgt.z]);
      if (!(fromB >= 0 && fromB === tgt.inB)) {
        pts.push(...this.wayOut(host, from, end));
        if (via && H) pts.push(H.entry);
      }
      if (H && !(fromB === tgt.inB)) pts.push(H.inside);
      pts.push([tgt.x, tgt.z]);
      void intoB;
      return pts;
    },
    // along the streets (a town) or straight across (anywhere else), avoiding what is in the way
    wayOut(host, a, b) {
      const X = host.rtx;
      if (!X.town) {
        if (this.folkClearLocal(host, a, b)) return [b];
        // round the obstacle: try a point to either side
        const mx = (a[0] + b[0]) / 2,
          mz = (a[1] + b[1]) / 2,
          dx = b[0] - a[0],
          dz = b[1] - a[1],
          L = Math.hypot(dx, dz) || 1;
        for (const s of [4, -4, 8, -8]) {
          const m = [mx - (dz / L) * s, mz + (dx / L) * s];
          if (
            this.folkClearLocal(host, a, m) &&
            this.folkClearLocal(host, m, b)
          )
            return [m, b];
        }
        return [b];
      }
      if (X.city) return this.cityWay(X, a, b);
      const kA = this.streetOf(X, a),
        kB = this.streetOf(X, b),
        out = [];
      const proj = (p, k) => {
        const u = X.u[k],
          t = Math.max(X.ring, p[0] * u[0] + p[1] * u[1]);
        return [u[0] * t, u[1] * t];
      };
      if (kA >= 0) out.push(proj(a, kA));
      if (kA >= 0 && kA === kB) {
        out.push(proj(b, kB), b);
        return out;
      }
      // round the edge of the square, never across its middle
      const angA = kA >= 0 ? X.ang[kA] : Math.atan2(a[1], a[0]),
        angB = kB >= 0 ? X.ang[kB] : Math.atan2(b[1], b[0]);
      out.push([Math.cos(angA) * X.ring, Math.sin(angA) * X.ring]);
      let dA = angB - angA;
      dA = Math.atan2(Math.sin(dA), Math.cos(dA));
      const steps = Math.ceil(Math.abs(dA) / 0.7);
      for (let j = 1; j <= steps; j++) {
        const t = angA + (dA * j) / steps;
        out.push([Math.cos(t) * X.ring, Math.sin(t) * X.ring]);
      }
      if (kB >= 0) out.push(proj(b, kB));
      out.push(b);
      return out;
    },
    // which street a point (in the town's metres) is on, or -1 on the square
    streetOf(X, p) {
      const r = Math.hypot(p[0], p[1]);
      if (r < X.plazaR + 0.5) return -1;
      const a = Math.atan2(p[1], p[0]);
      let best = 0,
        bd = 9;
      for (let k = 0; k < X.n; k++) {
        let d = a - X.ang[k];
        d = Math.abs(Math.atan2(Math.sin(d), Math.cos(d)));
        if (d < bd) {
          bd = d;
          best = k;
        }
      }
      return best;
    },
    // ---------- the great city: its avenues and its ring streets ----------
    // (levels out along an avenue: the edge of the square, the inner ring, the outer ring, outside its gate)
    cityLevels(X) {
      const C = X.city;
      return (
        X._cL ||
        (X._cL = [
          C.plazaR - 1.5,
          C.rings[0],
          C.rings[1],
          C.wall + C.thick / 2 + 6.5,
        ])
      );
    },
    // where a point (the city's metres) joins the streets: { av, t } along an avenue, { ring, a } round a ring
    cityLoc(X, p) {
      const C = X.city,
        L = this.cityLevels(X),
        r = Math.hypot(p[0], p[1]),
        th = Math.atan2(p[1], p[0]);
      if (r < C.plazaR + 4) return { ring: 0, a: th };
      let best = null;
      C.ang.forEach((A, k) => {
        const t = p[0] * Math.cos(A) + p[1] * Math.sin(A);
        if (t < C.plazaR - 2) return;
        const d = Math.abs(-p[0] * Math.sin(A) + p[1] * Math.cos(A));
        if (!best || d < best.d) best = { d, av: k, t: Math.max(L[0], t) };
      });
      if (r < C.wall)
        for (const j of [1, 2]) {
          const d = Math.abs(r - L[j]);
          if (!best || d < best.d) best = { d, ring: j, a: th };
        }
      return best || { ring: 0, a: th };
    },
    cityPt(X, loc) {
      const L = this.cityLevels(X);
      if (loc.av != null) {
        const A = X.city.ang[loc.av];
        return [Math.cos(A) * loc.t, Math.sin(A) * loc.t];
      }
      return [Math.cos(loc.a) * L[loc.ring], Math.sin(loc.a) * L[loc.ring]];
    },
    // round ring j from angle a0 to a1 (the short way), the points after a0
    cityArc(X, j, a0, a1) {
      const R = this.cityLevels(X)[j],
        d = Math.atan2(Math.sin(a1 - a0), Math.cos(a1 - a0)),
        n = Math.max(1, Math.ceil(Math.abs(d) / 0.12)),
        out = [];
      for (let q = 1; q <= n; q++) {
        const a = a0 + (d * q) / n;
        out.push([Math.cos(a) * R, Math.sin(a) * R]);
      }
      return out;
    },
    // the street corners (avenue k at level j, id k*4+j) a place on the streets joins, and what it costs to get there
    cityLinks(X, loc) {
      const C = X.city,
        L = this.cityLevels(X),
        n = C.ang.length,
        pos = (a) => (a < 0 ? a + Math.PI * 2 : a);
      if (loc.av != null) {
        const k = loc.av,
          t = loc.t;
        if (t >= L[3]) return [{ id: k * 4 + 3, cost: t - L[3] }];
        let j = 0;
        while (j < 2 && t > L[j + 1]) j++;
        return [
          { id: k * 4 + j, cost: Math.max(0, t - L[j]) },
          { id: k * 4 + j + 1, cost: Math.max(0, L[j + 1] - t) },
        ];
      }
      const j = loc.ring,
        k = citySector(C, loc.a),
        k1 = (k + 1) % n;
      return [
        {
          id: k * 4 + j,
          cost:
            L[j] *
            pos(
              Math.atan2(
                Math.sin(loc.a - C.ang[k]),
                Math.cos(loc.a - C.ang[k]),
              ),
            ),
        },
        {
          id: k1 * 4 + j,
          cost:
            L[j] *
            pos(
              Math.atan2(
                Math.sin(C.ang[k1] - loc.a),
                Math.cos(C.ang[k1] - loc.a),
              ),
            ),
        },
      ];
    },
    cityWay(X, a, b) {
      const C = X.city,
        L = this.cityLevels(X),
        n = C.ang.length;
      const la = this.cityLoc(X, a),
        lb = this.cityLoc(X, b),
        pa = this.cityPt(X, la),
        pb = this.cityPt(X, lb);
      const nodePt = (id) => {
        const k = Math.floor(id / 4),
          j = id % 4,
          A = C.ang[k];
        return [Math.cos(A) * L[j], Math.sin(A) * L[j]];
      };
      // the same stretch of the same street: straight along it
      const A = this.cityLinks(X, la),
        B = this.cityLinks(X, lb);
      const same = A.length === B.length && A.every((l, i) => l.id === B[i].id);
      if (same)
        return la.ring != null
          ? [pa, ...this.cityArc(X, la.ring, la.a, lb.a), b]
          : [pa, pb, b];
      // otherwise from corner to corner, the shortest way
      const N = n * 4,
        dist = new Array(N).fill(Infinity),
        prev = new Array(N).fill(-1),
        done = new Array(N).fill(false);
      for (const l of A)
        if (l.cost < dist[l.id]) {
          dist[l.id] = l.cost;
          prev[l.id] = -1;
        }
      const nbrs = (id) => {
        const k = Math.floor(id / 4),
          j = id % 4,
          out = [];
        if (j > 0) out.push([id - 1, L[j] - L[j - 1]]);
        if (j < 3) out.push([id + 1, L[j + 1] - L[j]]);
        if (j < 3)
          for (const dk of [-1, 1]) {
            const k2 = (k + dk + n) % n,
              d = Math.abs(
                Math.atan2(
                  Math.sin(C.ang[k2] - C.ang[k]),
                  Math.cos(C.ang[k2] - C.ang[k]),
                ),
              );
            out.push([k2 * 4 + j, L[j] * d]);
          }
        return out;
      };
      for (;;) {
        let u = -1;
        for (let i = 0; i < N; i++)
          if (!done[i] && dist[i] < Infinity && (u < 0 || dist[i] < dist[u]))
            u = i;
        if (u < 0) break;
        done[u] = true;
        for (const [v, w] of nbrs(u))
          if (dist[u] + w < dist[v]) {
            dist[v] = dist[u] + w;
            prev[v] = u;
          }
      }
      let end = null;
      for (const l of B)
        if (
          dist[l.id] < Infinity &&
          (!end || dist[l.id] + l.cost < dist[end.id] + end.cost)
        )
          end = l;
      if (!end) return [pa, pb, b];
      const ids = [];
      for (let id = end.id; id >= 0; id = prev[id]) ids.unshift(id);
      const out = [pa];
      // from where you join the streets to the first corner (round the ring, if that is where you are)
      let cur = la.ring != null ? { j: la.ring, a: la.a } : null;
      for (let i = 0; i < ids.length; i++) {
        const id = ids[i],
          k = Math.floor(id / 4),
          j = id % 4;
        if (cur && cur.j === j)
          out.push(...this.cityArc(X, j, cur.a, C.ang[k]));
        else out.push(nodePt(id));
        cur = { j, a: C.ang[k] };
        // (the next corner round the same ring: along it)
        const nx = ids[i + 1];
        if (nx != null && nx % 4 !== j) cur = null;
      }
      if (lb.ring != null && ids.length && ids[ids.length - 1] % 4 === lb.ring)
        out.push(
          ...this.cityArc(
            X,
            lb.ring,
            C.ang[Math.floor(ids[ids.length - 1] / 4)],
            lb.a,
          ),
        );
      else out.push(pb);
      out.push(b);
      return out;
    },
    folkClearLocal(host, a, b) {
      const c = host.s ? host.s.dir : host.site.dir;
      return this.folkPathClear(
        host,
        stepOn(c, host.F, a[0], -a[1], this.R),
        stepOn(c, host.F, b[0], -b[1], this.R),
      );
    },

    // ---------- walking ----------
    moveRoutine(host, f, dt) {
      if (f.act === "watch" && f.wander) {
        if (f.route) this.updateFolk(f, dt);
        return;
      }
      if (f.hidden) return;
      if (f.path && f.path.length) {
        const [tx, tz] = f.path[0];
        const dx = tx - f.lx,
          dz = tz - f.lz,
          d = Math.hypot(dx, dz);
        if (d < 0.2) {
          f.path.shift();
          if (!f.path.length) this.arrive(host, f);
          return;
        }
        const step = Math.min(d, FOLK_WALK * dt);
        f.lx += (dx / d) * step;
        f.lz += (dz / d) * step;
        f.face = Math.atan2(dx, -dz);
        f.walk = 0.55;
        f.phase += step * 3.2;
        this.folkTo(host, f);
        return;
      }
      // wandering, or working along a field: on to the next spot now and then
      if (f.wanderWait != null) {
        f.wanderWait -= dt;
        if (f.wanderWait <= 0) {
          f.wanderWait = null;
          const tgt =
            f.act === "work" && f.rt.job === "field"
              ? this.fieldSpot(host, f)
              : f.act === "wander"
                ? this.wanderSpot(host, f)
                : null;
          if (tgt) {
            this.unpose(f);
            f.tgt = tgt;
            f.path = this.wayOut(host, [f.lx, f.lz], [tgt.x, tgt.z]);
          }
        }
      }
    },
  });

  // ---- view/caveview.js ----
  // ============================================================
  // CAVEVIEW — going underground. Walk into a cave's mouth and the world
  // outside goes; the cave is built from its plan (story-free rock: floors,
  // walls and domed roofs, and what is down there) and lit by nothing but
  // what you bring, the grey of the day at the mouth behind you, a little of
  // what your eyes make of the dark, and the few things down there that
  // glow by themselves. You walk it the way you walk outside; walk back out
  // of the mouth and the world comes back.
  // Cave metres: x across the mouth, y up, z out of the mouth (in is -z).
  // ============================================================

