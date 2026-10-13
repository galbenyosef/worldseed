// index-inline-2 90 — math
// Lines 39031-43853 of readable/index-inline-2.pretty.js (statement-aligned).
  Object.assign(GroundView.prototype, {
    // ---------- the index of places, per planet ----------
    setSites() {
      if (this.siteViews)
        for (const v of this.siteViews.values()) this.dropSite(v);
      this.siteViews = new Map();
      this.siteIx = new SiteIndex(this.planet, this.story, this.roadNet);
      this.story.sites = this.siteIx;
      this.siteNear = [];
      this.siteAt = null;
      this.siteStyles = new Map();
      this.sRows = null;
      this.knollAt = null;
      this.knollList = [];
      this._cityList = null;
    },
    // ---------- the knolls the caves near you open in ----------
    // the rise of ground over a cave's mouth (the ground raises it near you; the rock of its face is
    // drawn with the place)
    knollOf(s) {
      const plan = sitePlan(this.story, s),
        m = plan.props.find((p) => p.t === "cavemouth");
      if (!m || !m.Au) return null;
      const F = frameAt(s.dir),
        r = Math.max(m.Au, m.Bw - m.wc);
      const y0 = Math.max(
        -0.2,
        this.ground.height(s.dir[0], s.dir[1], s.dir[2], 1.5, true),
      );
      return {
        id: s.id,
        d: s.dir,
        e: F.e,
        n: F.n,
        cs: Math.cos(m.rot),
        sn: Math.sin(m.rot),
        Au: m.Au,
        Bw: m.Bw,
        wc: m.wc,
        H: m.Hf,
        Uc: m.Uc,
        W: m.w,
        D: CAVE_STUB,
        Lf: CAVE_CLIFF,
        y0,
        r,
        cos: Math.cos((r + 4) / this.R),
      };
    },
    // the caves within a few kilometres raise their knolls; ground already built where one came or
    // went is built again (only near: further off a knoll is too small to see)
    updateKnolls(force = false) {
      if (!this.siteIx || !this.p) return;
      const p = this.p,
        R = this.R;
      if (!force && this.knollAt && arcM(p, this.knollAt, R) < 250) return;
      this.knollAt = p.slice();
      const keep = this.knollList.filter((k) => arcM(p, k.d, R) < 5200);
      const list = keep.slice();
      for (const s of this.siteIx.near(p, 3600, "big")) {
        if (
          (s.kind !== "cave" && s.kind !== "mine") ||
          list.some((k) => k.id === s.id)
        )
          continue;
        const k = this.knollOf(s);
        if (k) list.push(k);
      }
      const changed = list
        .filter((k) => !this.knollList.includes(k))
        .concat(this.knollList.filter((k) => !list.includes(k)));
      if (!changed.length) return;
      this.knollList = list;
      this.ground.setKnolls(list);
      for (const [key, ch] of this.chunks) {
        if (ch.span > 420) continue;
        if (!changed.some((k) => arcM(ch.c, k.d, R) < ch.span * 0.75 + k.r + 4))
          continue;
        this.dropChunk(ch);
        this.chunks.delete(key);
      }
    },
    siteRowsGet() {
      if (this.sRows) return this.sRows;
      this.sRows = Object.fromEntries(
        Object.entries(SITE_COLS).map(([k, c]) => [k, this.row(c)]),
      );
      return this.sRows;
    },
    // the same, as a farm the story has taken looks (no light in it any more)
    lostRows(how) {
      const m = this.sLostRows || (this.sLostRows = {});
      if (m[how]) return m[how];
      const t = lostTint(how);
      m[how] = Object.fromEntries(
        Object.entries(SITE_COLS).map(([k, c]) => [
          k,
          this.row(k === "glow" || k === "flame" ? SITE_COLS.char : t(c)),
        ]),
      );
      return m[how];
    },
    lostKit(st, how) {
      const m = this.lostStyles || (this.lostStyles = new Map());
      let byHow = m.get(st);
      if (!byHow) m.set(st, (byHow = {}));
      if (!byHow[how]) {
        const t = lostTint(how);
        byHow[how] = {
          ...st,
          wall: t(st.wall),
          roof: t(st.roof),
          wood: t(st.wood),
          base: t(st.base),
          upperWall: st.upperWall ? t(st.upperWall) : st.upperWall,
          smoke: false,
        };
      }
      return this.styleKit(byHow[how]);
    },
    // a farm has been lost: build it again as it is now, and it is no refuge any more
    siteLostChanged(id) {
      this.refreshSite(id);
      const s = this.siteIx && this.siteIx.get(id);
      if (s) s._bcn = null;
      this.havenList = null;
      this.sitesDirty = true;
    },
    // a people's building style as rows and a kit style (like a town's)
    styleKit(st) {
      if (this.siteStyles.has(st)) return this.siteStyles.get(st);
      const pat = {
        coral: PAT.PLASTER,
        white: PAT.PLASTER,
        mud: PAT.BRICK,
        sandstone: PAT.STONE,
        plank: PAT.PLANK,
        hide: PAT.HIDE,
        stone: PAT.STONE,
        darkstone: PAT.STONE,
        log: PAT.LOG,
        frame: PAT.PLASTER,
        basalt: PAT.STONE,
      };
      const rpat = {
        thatch: PAT.THATCH,
        tile: PAT.TILE,
        slate: PAT.SLATE,
        shingle: PAT.SLATE,
        turf: PAT.THATCH,
        dome: PAT.NONE,
        hide: PAT.HIDE,
        ember: PAT.TILE,
      };
      const rows = {
        wall: this.row(st.wall),
        roof: this.row(st.roof),
        wood: this.row(st.wood),
        base: this.row(st.base),
        glow: this.row([255, 206, 110]),
        upper: st.upperWall ? this.row(st.upperWall) : null,
      };
      rows.upper = rows.upper || rows.wall;
      // what furnishes a room: bedding, straw, dark wood, clay, iron, fire, a banner in the people's colours
      Object.assign(rows, {
        cloth: this.row([st.wood[0] * 0.3 + 120, 70 + st.wood[1] * 0.2, 58]),
        straw: this.row([206, 176, 92]),
        dark: this.row([78, 56, 40]),
        pot: this.row([172, 104, 70]),
        iron: this.row([70, 70, 80]),
        flame: this.row([255, 170, 70]),
        char: this.row([30, 26, 28]),
        rag: this.row([226, 218, 196]),
        banner: this.row([st.roof[0], st.roof[1], st.roof[2]]),
        // lamp glass by day; a candle's glow is the lamps' colour, only fainter
        glass: this.row([206, 184, 128]),
        candle: this.row([236, 168, 88]),
        // (old planks nailed over a door or a window)
        weathered: this.row([150, 132, 108]),
      });
      const style = {
        wallPat: pat[st.wallKind] ?? PAT.PLANK,
        roofPat: rpat[st.roofMat] ?? PAT.THATCH,
        roof: st.roofKind === "cone" ? "gable" : st.roofKind,
        upper: st.upper,
        stilts: false,
        storeyH: st.storeyH,
        roofPitch: st.pitch,
        overhang: st.overhang,
        smoke: st.smoke,
        upperRow: !!st.upperWall,
        upperPat: st.wallKind === "frame" ? PAT.PLASTER : null,
      };
      const kit = { rows, style };
      this.siteStyles.set(st, kit);
      return kit;
    },

    // ---------- each frame: what is near, built, drawn ----------
    stepSites(dt, nowS) {
      if (!this.siteIx) return;
      const R = this.R,
        p = this.p;
      if (!this.siteAt || arcM(this.siteAt, p, R) > 120 || this.sitesDirty) {
        this.siteAt = p.slice();
        this.sitesDirty = false;
        this.siteNear = this.siteIx
          .near(p, 16000, "big")
          .concat(this.siteIx.near(p, 1500, "small"), this.homesNear(p, 16000));
      }
      // build what has come close (nearest first, a few milliseconds a frame), forget what is far
      const t0 = performance.now(),
        budget = this.journey ? 10 : 5;
      const wantD = (s) =>
        TALL_KINDS.has(s.kind)
          ? 7000
          : SMALL_KINDS.has(s.kind)
            ? 950
            : s.kind === "sign"
              ? 650
              : s.kind === "home"
                ? 1600
                : 3200;
      let todo = null;
      for (const s of this.siteNear) {
        if (this.siteViews.has(s.id)) continue;
        const m = arcM(p, s.dir, R);
        if (m < wantD(s) && (!todo || m < todo.m)) todo = { s, m };
      }
      let guard = 0;
      while (todo && guard++ < 6) {
        this.siteViews.set(todo.s.id, this.buildSite(todo.s));
        if (performance.now() - t0 > budget) break;
        todo = null;
        for (const s of this.siteNear) {
          if (this.siteViews.has(s.id)) continue;
          const m = arcM(p, s.dir, R);
          if (m < wantD(s) && (!todo || m < todo.m)) todo = { s, m };
        }
      }
      for (const [id, v] of this.siteViews)
        if (arcM(p, v.site.dir, R) > wantD(v.site) * 1.35 + 200) {
          this.dropSite(v);
          this.siteViews.delete(id);
        }
      for (const v of this.siteViews.values()) {
        this.placeMatrix(v.mesh, v.site.dir, v.F, v.base);
        if (!v.mesh.parent) this.scene.add(v.mesh);
        for (const m of v.extra) {
          this.placeMatrix(m, v.site.dir, v.F, v.base);
          if (!m.parent) this.scene.add(m);
        }
        if (v.geyser) this.stepGeyser(v, nowS);
        if (v.sails) this.stepSails(v, dt);
        if (v.home && (v.home.field || v.pen) && this.stepFarm)
          this.stepFarm(v, dt, nowS);
        const near = arcM(p, v.site.dir, R) < 1500;
        if (near && v.rtx) this.stepRoutines(v, dt);
        for (const f of v.folk) {
          // a stall's keeper is there while the sun is up
          if (f.info && f.info.keeper)
            f.hidden = this.uniforms.uSun.value.y < -0.06;
          f.mesh.visible = near && !f.gone && !f.hidden;
          if (!near || f.gone || f.hidden) continue;
          if (f.leaving) {
            // off home, and out of sight
            const L = f.leaving;
            L.t += dt;
            f.face = L.dir;
            f.walk = 0.55;
            const sp = 1.2 * dt;
            f.dir = stepOn(
              f.dir,
              frameAt(f.dir),
              Math.sin(L.dir) * sp,
              Math.cos(L.dir) * sp,
              R,
            );
            f.F = frameAt(f.dir);
            f.h = Math.max(
              -0.2,
              this.ground.height(f.dir[0], f.dir[1], f.dir[2], 1),
            );
            f.phase += sp * 3.2;
            if (L.t > 25 && arcM(p, f.dir, R) > 30) f.gone = true;
          } else if (!f.rt) this.updateFolk(f, dt);
          this.placePerson(f, nowS);
        }
      }
      this.stepBeacons();
    },
    // stream in the places around you before you open your eyes
    warmSites() {
      if (!this.siteIx) return;
      this.siteAt = null;
      this.stepSites(0, 0);
      const p = this.p;
      for (const s of this.siteNear)
        if (!this.siteViews.has(s.id) && arcM(p, s.dir, this.R) < 1200)
          this.siteViews.set(s.id, this.buildSite(s));
    },

    // ---------- one place, built ----------
    buildSite(s) {
      const plan = sitePlan(this.story, s);
      const R = this.R,
        G = this.ground,
        F = frameAt(s.dir);
      const base = Math.max(-0.2, G.height(s.dir[0], s.dir[1], s.dir[2], 1.5));
      const hAt = (x, z) => {
        const d = stepOn(s.dir, F, x, -z, R);
        return G.height(d[0], d[1], d[2], 1.5) - base;
      };
      // a farm the story has taken: as it was left, and nobody in it
      const lost =
        s.kind !== "home" && this.siteLost ? this.siteLost(s.id) : null;
      const rows = lost ? this.lostRows(lost.how) : this.siteRowsGet();
      const grass = this.findRows(s.biome).grass;
      const kit = lost
        ? this.lostKit(plan.style, lost.how)
        : this.styleKit(plan.style);
      const mb = new MeshBuf();
      const col = [],
        boxes = [],
        extra = [],
        bBase = [],
        homes = [],
        steps = [];
      const inner = {
        col,
        boxes,
        base,
        rooms: [],
        hearths: [],
        beds: [],
        doors: [],
        lights: [],
        chests: [],
        tops: s.kind === "home" ? [] : null,
        works: s.kind === "home" ? [] : null,
      };
      // buildings sit on the highest ground under them, with a foundation down to the lowest,
      // and steps up to the door wherever the ground falls away in front of it
      const sills = [];
      plan.buildings.forEach((b, i) => {
        const [lo, hi] = footLoHi(b, hAt);
        const bb = {
          ...b,
          base: Math.max(hi, 0.3 - base),
          sink: Math.max(hi, 0.3 - base) - lo,
          ...(lost ? { light: "none", doorLight: null, open: false } : {}),
        };
        bBase[i] = bb.base;
        const ins = this.houseAt(mb, bb, kit, inner);
        homes[i] = this.homeOf(bb, ins);
        if (ins.sill) {
          ins.sill.i = i;
          sills.push(ins.sill);
        }
      });
      const v = {
        site: s,
        plan,
        F,
        base,
        mesh: null,
        extra,
        folk: [],
        col: null,
        boxes,
        steps,
        spots: [],
        bBase,
        reach: (plan.reach || plan.r) + 30,
        rooms: inner.rooms,
        hearths: inner.hearths,
        entries: inner.entries || [],
        lights: lost ? [] : inner.lights,
        tops: inner.tops || [],
        lost,
      };
      for (const pr of plan.props)
        this.propInto(mb, pr, hAt(pr.x, pr.z), {
          rows,
          grass,
          col,
          boxes,
          hAt,
          base,
          extra,
          s,
          v,
        });
      // its fields, painted on the ground near you
      if (this.fieldsOf) v.fields = this.fieldsOf(v);
      // (once everything else stands, so the steps stop short of whatever is in front of a door)
      for (const sl of sills) {
        const way = this.doorSteps(
          mb,
          sl,
          hAt,
          boxes,
          kit.rows,
          base,
          steps,
          col,
        );
        if (way && way.kind === "ladder" && homes[sl.i])
          homes[sl.i].foot = way.foot;
      }
      if (lost) v.lights.length = 0;
      // at home: what you set out, on floors, tables and shelves, and on the walls
      if (s.kind === "home" && s.home)
        (s.home.decor || []).forEach((d, i) => {
          const id = d.s && d.s[0],
            size = showSize(id);
          if (!id) return;
          iconSolidInto(
            mb,
            iconPixels(id, !!d.s[3]),
            size,
            decorFrame([d.x, d.y, d.z], d.b, !!d.f, size, d.r || 0),
            (c2) => this.row(c2),
            { lv: -0.3 },
          );
          v.spots.push({
            kind: "decor",
            i,
            x: d.x,
            z: d.z,
            r: Math.max(0.3, size * 0.55),
            dir: stepOn(s.dir, F, d.x, -d.z, R),
            alt: base + d.y + (d.f ? 0.05 : 0),
          });
        });
      this.syncRamps();
      v.mesh = this.meshOf(mb.finish(), this.solidMat);
      v.col = new Float64Array(col);
      // what you can use here; an inn's beds are inside it once its door is open
      const bedsIn = s.kind === "inn" && inner.beds.length;
      for (const sp of plan.spots) {
        if (bedsIn && sp.kind === "bed") continue;
        const y = hAt(sp.x, sp.z) + sp.y;
        v.spots.push({
          ...sp,
          dir: stepOn(s.dir, F, sp.x, -sp.z, R),
          alt: base + y,
        });
      }
      if (bedsIn)
        for (const b of inner.beds)
          v.spots.push({
            kind: "bed",
            x: b.x,
            z: b.z,
            r: 0.9,
            dir: stepOn(s.dir, F, b.x, -b.z, R),
            alt: base + b.y,
          });
      // at home: your bed and your chest
      if (s.kind === "home") {
        v.home = s.home;
        for (const b of inner.beds)
          v.spots.push({
            kind: "homebed",
            x: b.x,
            z: b.z,
            r: 1.0,
            dir: stepOn(s.dir, F, b.x, -b.z, R),
            alt: base + b.y,
          });
        for (const c of inner.chests)
          v.spots.push({
            kind: "chest",
            x: c.x,
            z: c.z,
            r: 0.7,
            dir: stepOn(s.dir, F, c.x, -c.z, R),
            alt: base + c.y,
          });
        // the hearth to cook at, and whatever the house-wright built in: an oven, a bench and an anvil, a loom
        for (const h of inner.hearths)
          v.spots.push({
            kind: "hearth",
            x: h.x,
            z: h.z,
            r: 0.55,
            dir: stepOn(s.dir, F, h.x, -h.z, R),
            alt: base + h.y,
          });
        for (const w of inner.works || [])
          v.spots.push({
            kind: "work",
            work: w.kind,
            x: w.x,
            z: w.z,
            r: 0.75,
            dir: stepOn(s.dir, F, w.x, -w.z, R),
            alt: base + w.y,
          });
        // the animals in your pen
        if (this.buildPen) this.buildPen(v);
        if (this.buildStable) this.buildStable(v);
      }
      for (const d of inner.doors)
        v.spots.push({
          kind: "door",
          x: d.x,
          z: d.z,
          r: 0.7,
          dir: stepOn(s.dir, F, d.x, -d.z, R),
          alt: base + d.y,
        });
      if (v.towerTop) {
        const T = v.towerTop,
          vw = T.view || [0, 0],
          dn = T.down || [0, T.r * 0.45];
        v.spots.push({
          kind: "view",
          x: vw[0],
          z: vw[1],
          dir: stepOn(s.dir, F, vw[0], -vw[1], R),
          alt: T.alt + 1.2,
          r: 0.9,
          top: true,
        });
        v.spots.push({
          kind: "down",
          x: dn[0],
          z: dn[1],
          dir: stepOn(s.dir, F, dn[0], -dn[1], R),
          alt: T.alt + 0.05,
          r: 0.55,
          top: true,
        });
      }
      // a beast saddled at the inn's rail, for hire
      const rail = plan.props.find((q) => q.t === "rail");
      if (rail && this.tether && !lost) {
        const people = s.owner >= 0 ? this.story.peoples[s.owner] : null;
        const m = this.mountInfo(people, (s.seed ^ 0x88) >>> 0),
          cs = Math.cos(rail.rot),
          sn = Math.sin(rail.rot);
        this.tether(
          v,
          m,
          stepOn(s.dir, F, rail.x - 1.15 * sn, -(rail.z + 1.15 * cs), R),
          Math.atan2(cs, -sn),
        );
        v.mountInfo = m;
      }
      // who lives here (nobody, any more, where the story has been)
      const guests = this.visitors && !lost ? this.visitors(s) : [];
      for (const f of lost ? [] : plan.folk.concat(guests)) {
        const dir = stepOn(s.dir, F, f.x, -f.z, R);
        const person = this.makePerson(f.look, dir);
        person.face = f.face;
        person.wander = f.wander;
        person.home = dir;
        person.target = null;
        person.info = f;
        person.met = f.k >= 90;
        person.siteId = s.id;
        person.host = v;
        person.lamp = f.look && f.look.item === "lantern";
        const fl = this.floorAt(v, dir);
        if (fl != null) person.h = Math.max(person.h, fl);
        person.mesh.visible = false;
        v.folk.push(person);
      }
      // everyone's day here: homes (the tents too), the fields, the fire or the well in the middle
      if (!lost && plan.folk.some((f) => f.job)) {
        for (const t of plan.tents || [])
          homes.push({
            open: false,
            door: [
              t.x + Math.cos(t.rot) * (t.r + 0.6),
              t.z + Math.sin(t.rot) * (t.r + 0.6),
            ],
            doorFace: 0,
            beds: [],
            seats: [],
            spots: {},
          });
        const sq = plan.square,
          square = [];
        if (sq)
          for (let k = 0; k < 6; k++) {
            const a = (k / 6) * Math.PI * 2 + 0.4,
              r = sq.r + 1.1;
            square.push({
              x: sq.x + Math.cos(a) * r,
              z: sq.z + Math.sin(a) * r,
              face: Math.atan2(-Math.cos(a), Math.sin(a)),
              seat: sq.fire,
            });
          }
        this.setRoutines(v, {
          town: false,
          homes,
          r: plan.r,
          square,
          fields: plan.fields || [],
          tavern: plan.buildings.findIndex((b) => b.kind === "inn"),
          hall: -1,
        });
      }
      return v;
    },
    // one house into a mesh, and what it leaves behind: walls to bump into, a room, a hearth,
    // beds, or (if it is locked) a door to knock on. ctx gathers them in the caller's metres.
    houseAt(mb, bb, kit, ctx) {
      // (in the great city: fallen in, a frame going up, a foundation)
      if ((bb.ruin || bb.frame || bb.found) && this.cityHouseInto) {
        this.cityHouseInto(mb, bb, kit, ctx);
        return {
          open: false,
          walls: [],
          furn: [],
          beds: [],
          seats: [],
          spots: {},
          lights: [],
          tops: [],
        };
      }
      const ins = houseInto(
        mb,
        bb,
        {
          ...kit.style,
          stilts: !!bb.stilts,
          roofPitch: bb.round
            ? Math.max(0.6, kit.style.roofPitch)
            : kit.style.roofPitch,
        },
        kit.rows,
      );
      if (ins.open) {
        for (const w of ins.walls) ctx.boxes.push(w);
        for (const f of ins.furn)
          ctx.boxes.push({ ...f, top: ctx.base + f.top });
        if (ins.room) ctx.rooms.push(ins.room);
        if (ins.entry) (ctx.entries || (ctx.entries = [])).push(ins.entry);
        if (ins.hearth) ctx.hearths.push(ins.hearth);
        for (const b of ins.beds) ctx.beds.push(b);
        if (ins.chest && ctx.chests) ctx.chests.push(ins.chest);
        if (ctx.tops && ins.tops) for (const t of ins.tops) ctx.tops.push(t);
        if (ctx.works && ins.work) for (const w of ins.work) ctx.works.push(w);
      } else {
        for (const L of ins.lights) if (L.room) L.drop = true;
        if (bb.round)
          ctx.col.push(
            bb.x,
            bb.z,
            bb.w / 2 + 0.1,
            ctx.base + bb.base - bb.sink,
            1e9,
            1,
          );
        else
          ctx.boxes.push({
            x: bb.x,
            z: bb.z,
            hx: bb.w / 2 + 0.15,
            hz: bb.d / 2 + 0.15,
            cs: Math.cos(bb.rot),
            sn: Math.sin(bb.rot),
          });
        if (ins.door)
          ctx.doors.push(
            bb.empty
              ? { ...ins.door, empty: true, board: !!bb.board }
              : ins.door,
          );
      }
      // lights: the room's own lamps only count while you are in that room
      if (ctx.lights)
        for (const L of ins.lights)
          if (!L.drop)
            ctx.lights.push({ ...L, room: L.room ? ins.room : null });
      return ins;
    },
    // ---------- your houses: places of their own, built from your save ----------
    homeSite(rec) {
      if (rec._s) return rec._s;
      const S = {};
      this.ground.sample(rec.dir[0], rec.dir[1], rec.dir[2], 2, S);
      const s = {
        id: rec.id,
        kind: "home",
        dir: rec.dir,
        seed: hashStr(rec.id) >>> 0,
        owner: rec.owner,
        face: rec.face,
        size: rec.size,
        biome: S.biome,
        T: S.T,
        h: S.h,
        rough: 0,
        coastKm: 99,
        townId: -1,
        townM: 1e9,
        volcanoKm: 1e9,
        home: rec,
      };
      Object.defineProperty(rec, "_s", {
        value: s,
        enumerable: false,
        writable: true,
        configurable: true,
      });
      return s;
    },
    homesNear(p, m) {
      const out = [];
      if (!this.world || !this.world.homes) return out;
      for (const rec of this.world.homes) {
        const d = arcM(p, rec.dir, this.R);
        if (d <= m) out.push(Object.assign(this.homeSite(rec), { m: d }));
      }
      return out;
    },
    // What something built into a house of yours covers (in the place's metres, its top above the place's
    // base): the house is laid out again as it would be, in a throwaway buffer, and the pieces of that one
    // picked out. (So whatever was set out there can be moved before it goes in.)
    workFoot(rec, kind) {
      const s = this.homeSite(rec);
      s._plan = null;
      const plan = sitePlan(this.story, s),
        b = plan.buildings[0];
      if (!b) return [];
      const kit = this.styleKit(plan.style);
      // (standing where the house stands now: on the highest ground under it)
      const v = this.siteViews && this.siteViews.get(rec.id),
        base = v && v.bBase ? v.bBase[0] || 0 : 0;
      const ins = houseInto(
        new MeshBuf(),
        { ...b, base, sink: 0, open: true },
        {
          ...kit.style,
          stilts: false,
          roofPitch: b.round
            ? Math.max(0.6, kit.style.roofPitch)
            : kit.style.roofPitch,
        },
        kit.rows,
      );
      s._plan = null;
      return ins.furn.filter((f) => f.work === kind);
    },
    // what is in a house of yours changed: build it again, now, so you never fall through its floor
    refreshHome(rec) {
      const v = this.siteViews && this.siteViews.get(rec.id);
      if (!v) return;
      this.dropSite(v);
      this.siteViews.set(rec.id, this.buildSite(v.site));
    },
    // a house of yours has gone up or come down (or a stall by it): build it (or not) and clear the ground around it again
    homesChanged(rec) {
      this.sitesDirty = true;
      if (rec && rec._s) rec._s._plan = null;
      if (rec) {
        const v = this.siteViews && this.siteViews.get(rec.id);
        if (v) {
          this.dropSite(v);
          this.siteViews.delete(rec.id);
        }
        for (const ch of this.chunks.values())
          if (ch.D && arcM(ch.c, rec.dir, this.R) < ch.span * 0.75 + 40)
            this.rebuildProps(ch);
      }
    },
    // where you wake at home: on your own bed
    homeWakeSpot(rec) {
      const s = this.homeSite(rec),
        w = sitePlan(this.story, s).wake || { x: 0, z: 0 };
      return stepOn(s.dir, frameAt(s.dir), w.x, -w.z, this.R);
    },
    // what you lie or stand on where you are (a bed, a floor) without being pushed anywhere: for waking up
    floorUnder() {
      let under = -1e9;
      const R = this.R,
        p = this.p,
        gh = this.ground.height(p[0], p[1], p[2], 1);
      const hosts = [];
      if (this.siteViews)
        for (const v of this.siteViews.values())
          if (v.boxes.length && arcM(p, v.site.dir, R) <= v.reach)
            hosts.push(v);
      if (this.towns)
        for (const tw of this.towns.values())
          if (arcM(p, tw.s.dir, R) <= 400) hosts.push(tw);
      const inside = (bx, lx, lz) => {
        const dx = lx - bx.x,
          dz = lz - bx.z,
          u = dx * bx.cs + dz * bx.sn,
          w = -dx * bx.sn + dz * bx.cs;
        return Math.abs(u) <= bx.hx && Math.abs(w) <= bx.hz;
      };
      // a floor first (it holds you up however far above the ground it is), then a bed or a step on it
      let floor = gh;
      for (const h of hosts) {
        const [lx, lz] = this.hostLocal(h, p);
        for (const bx of h.boxes)
          if (bx.lift && inside(bx, lx, lz)) {
            floor = Math.max(floor, bx.top);
            under = Math.max(under, bx.top);
          }
      }
      for (const h of hosts) {
        const [lx, lz] = this.hostLocal(h, p);
        for (const bx of h.boxes) {
          if (bx.top == null || bx.lift || !inside(bx, lx, lz)) continue;
          const t = bx.slope
            ? (() => {
                const dx = lx - bx.x,
                  dz = lz - bx.z,
                  w = -dx * bx.sn + dz * bx.cs;
                return (
                  bx.ya +
                  ((bx.yb - bx.ya) *
                    (Math.max(-bx.hz, Math.min(bx.hz, w)) + bx.hz)) /
                    (2 * bx.hz)
                );
              })()
            : bx.top;
          if (t <= floor + 1.6) under = Math.max(under, t);
        }
      }
      return under;
    },
    // steps from a door down to the ground in front of it, as many as the drop needs and each one an
    // easy step (so you walk up them as you would anywhere), straight out from the door. sill: where
    // houseInto says the doorway's foot is (the caller's metres); hAt: the ground there (from base);
    // out: the steps, for folk to stand on too. Returns how many.
    // The way up to a door that stands above the ground in front of it, as high as it stands: hardly
    // any rise, nothing; a little, a ramp (planks where its people build in wood, else stone); more,
    // steps, as many as the drop needs and each an easy step; a long way up, or a house on stilts, a
    // landing at the door and a rope ladder down from it. Walkable boxes go in boxes (and in out, for
    // folk). Returns { kind, foot: where you come to it from the ground, deck: the landing } or null.
    doorSteps(mb, sill, hAt, boxes, rows, base, out, col = null) {
      if (!sill) return null;
      const TREAD = 0.42,
        MAXR = 0.27,
        MAXN = 12,
        HALF = 0.75;
      // its own frame: x across the door, z out of it (away from the house)
      const ox = -sill.ix,
        oz = -sill.iz,
        ex = oz,
        ez = -ox;
      const at = (s, a) =>
        hAt(sill.x + ox * s + ex * a, sill.z + oz * s + ez * a);
      const hiAt = (s, h = HALF) =>
        Math.max(at(s, -h + 0.1), at(s, 0), at(s, h - 0.1));
      const loAt = (s, h = HALF) => Math.min(at(s, -h), at(s, 0), at(s, h));
      const P = (p) => [
        sill.x + p[0] * ex + p[2] * ox,
        p[1],
        sill.z + p[0] * ez + p[2] * oz,
      ];
      const mid = (m) => [sill.x + ox * m, sill.z + oz * m];
      const push = (bx) => {
        boxes.push(bx);
        if (out) out.push(bx);
      };
      const Y = sill.y,
        drop = Y - hiAt(0.3);
      // how far out they can go before something is in the way (a stall, a lamp, the house across the street)
      // (only what stands within reach of the door can be in the way: in a great city that is a short list)
      const nearB = boxes.filter(
        (b) =>
          !b.walk &&
          Math.abs(b.x - sill.x) < 6.5 + b.hx + b.hz &&
          Math.abs(b.z - sill.z) < 6.5 + b.hx + b.hz,
      );
      const nearC = [];
      if (col)
        for (let i = 0; i < col.length; i += 6)
          if (
            Math.abs(col[i] - sill.x) < 6.5 + col[i + 2] &&
            Math.abs(col[i + 1] - sill.z) < 6.5 + col[i + 2]
          )
            nearC.push(col[i], col[i + 1], col[i + 2]);
      const blocked = (x, z) => {
        for (const b of nearB) {
          const lx = x - b.x,
            lz = z - b.z,
            u = lx * b.cs + lz * b.sn,
            w = -lx * b.sn + lz * b.cs;
          if (Math.abs(u) < b.hx && Math.abs(w) < b.hz) return true;
        }
        for (let i = 0; i < nearC.length; i += 3)
          if (Math.hypot(x - nearC[i], z - nearC[i + 1]) < nearC[i + 2])
            return true;
        return false;
      };
      const clearTo = (max, half = HALF) => {
        for (let s = 0.05; s <= max; s += 0.15)
          for (const a of [-half + 0.05, 0, half - 0.05])
            if (blocked(sill.x + ox * s + ex * a, sill.z + oz * s + ez * a))
              return s - 0.05;
        return max;
      };
      // a box in the door's frame (x across, y up, z out), all six faces
      const pbox = (x0, y0, z0, x1, y1, z1, row, pat) => {
        const Q = (a, b, c, d) =>
          mb.quad(P(a), P(b), P(c), P(d), row, pat, [
            [a[0] + a[2], a[1]],
            [b[0] + b[2], b[1]],
            [c[0] + c[2], c[1]],
            [d[0] + d[2], d[1]],
          ]);
        Q([x0, y1, z1], [x1, y1, z1], [x1, y1, z0], [x0, y1, z0]);
        Q([x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1]);
        Q([x1, y0, z0], [x0, y0, z0], [x0, y1, z0], [x1, y1, z0]);
        Q([x1, y0, z1], [x1, y0, z0], [x1, y1, z0], [x1, y1, z1]);
        Q([x0, y0, z0], [x0, y0, z1], [x0, y1, z1], [x0, y1, z0]);
      };
      // ---- hardly a step up from the ground: nothing ----
      if (!sill.stilts && drop < 0.12) return null;
      // ---- a little: a ramp, from the sill down to where it meets the ground ----
      if (!sill.stilts && drop < 0.5) {
        let run = Math.min(2.2, Math.max(0.7, drop / 0.26));
        const room = clearTo(run + 0.1);
        if (room >= 0.55) {
          run = Math.min(run, room);
          const yE = Math.min(Y - 0.02, hiAt(run)),
            bot = Math.min(loAt(0), loAt(run)) - 0.3;
          const row = sill.wood ? rows.wood : rows.base || rows.wall,
            pat = sill.wood ? PAT.PLANK : PAT.STONE;
          const Q = (a, b, c, d) =>
            mb.quad(P(a), P(b), P(c), P(d), row, pat, [
              [a[0] + a[2], a[1]],
              [b[0] + b[2], b[1]],
              [c[0] + c[2], c[1]],
              [d[0] + d[2], d[1]],
            ]);
          Q([-HALF, yE, run], [HALF, yE, run], [HALF, Y, 0], [-HALF, Y, 0]);
          Q(
            [-HALF, bot, run],
            [HALF, bot, run],
            [HALF, yE, run],
            [-HALF, yE, run],
          );
          Q([HALF, bot, run], [HALF, bot, 0], [HALF, Y, 0], [HALF, yE, run]);
          Q(
            [-HALF, bot, 0],
            [-HALF, bot, run],
            [-HALF, yE, run],
            [-HALF, Y, 0],
          );
          // (planks laid across it, a little proud of it, so it reads as a ramp from a way off)
          if (sill.wood)
            for (let k = 1; k < Math.floor(run / 0.3); k++) {
              const z = k * 0.3,
                y = Y + ((yE - Y) * z) / run + 0.012;
              mb.prism(
                P([-HALF + 0.02, y, z]),
                P([HALF - 0.02, y, z]),
                0.02,
                0.02,
                3,
                rows.dark || rows.wood,
                PAT.NONE,
              );
            }
          const [cx, cz] = mid(run / 2);
          push({
            x: cx,
            z: cz,
            hx: HALF,
            hz: run / 2,
            cs: ex,
            sn: ez,
            top: base + Y,
            ya: base + Y,
            yb: base + yE,
            slope: true,
            walk: true,
            step: true,
          });
          return { kind: "ramp", foot: mid(run + 0.5), deck: null };
        }
      }
      // ---- a long way up, or up on stilts: a landing at the door, a rope ladder down from it ----
      if (sill.stilts || drop > 2.6) {
        const DD = 1.15,
          DW = 0.85,
          LR = 0.75;
        const yG = Math.min(Y - 0.6, hiAt(DD + LR * 0.7, 0.5));
        const wood = rows.wood,
          rope = rows.straw || rows.cloth || wood;
        pbox(-DW, Y - 0.14, 0, DW, Y, DD, wood, PAT.PLANK);
        // posts under its outer corners, and a rail along each side
        for (const sx of [-1, 1]) {
          const lo = at(DD - 0.08, sx * (DW - 0.08)) - 0.3;
          mb.prism(
            P([sx * (DW - 0.08), lo, DD - 0.08]),
            P([sx * (DW - 0.08), Y + 0.9, DD - 0.08]),
            0.06,
            0.055,
            4,
            wood,
            PAT.BARK,
          );
          mb.prism(
            P([sx * (DW - 0.06), Y + 0.88, 0.02]),
            P([sx * (DW - 0.06), Y + 0.88, DD - 0.08]),
            0.035,
            0.035,
            4,
            wood,
            PAT.BARK,
          );
          mb.prism(
            P([sx * (DW - 0.06), Y, 0.02]),
            P([sx * (DW - 0.06), Y + 0.9, 0.02]),
            0.035,
            0.035,
            4,
            wood,
            PAT.BARK,
          );
        }
        // the ladder: two ropes from the landing's edge, pegged at the foot a little out, rungs between
        const zT = DD - 0.02,
          zB = DD + LR - 0.12;
        for (const sx of [-0.27, 0.27]) {
          mb.prism(
            P([sx, Y + 0.06, zT]),
            P([sx, yG + 0.02, zB]),
            0.022,
            0.022,
            4,
            rope,
            PAT.NONE,
          );
          mb.prism(
            P([sx, yG - 0.25, zB + 0.06]),
            P([sx, yG + 0.12, zB + 0.02]),
            0.03,
            0.02,
            4,
            wood,
            PAT.BARK,
          );
        }
        for (let y = yG + 0.28; y < Y - 0.05; y += 0.3) {
          const z = zB + ((zT - zB) * (y - yG)) / (Y - yG);
          mb.prism(
            P([-0.3, y, z]),
            P([0.3, y, z]),
            0.028,
            0.028,
            4,
            wood,
            PAT.BARK,
          );
        }
        // the landing holds you up; the ladder takes you up (slowly) or down
        const [dx, dz] = mid(DD / 2),
          [lx, lz] = mid(DD + LR / 2);
        push({
          x: dx,
          z: dz,
          hx: DW,
          hz: DD / 2,
          cs: ex,
          sn: ez,
          top: base + Y,
          walk: true,
          step: true,
          deck: true,
        });
        // (its rails: nobody walks off its sides)
        for (const sx of [-1, 1]) {
          const [rx, rz] = [
            sill.x + (ox * DD) / 2 + ex * sx * (DW - 0.05),
            sill.z + (oz * DD) / 2 + ez * sx * (DW - 0.05),
          ];
          boxes.push({ x: rx, z: rz, hx: 0.05, hz: DD / 2, cs: ex, sn: ez });
        }
        push({
          x: lx,
          z: lz,
          hx: 0.42,
          hz: LR / 2,
          cs: ex,
          sn: ez,
          top: base + Y,
          ya: base + Y,
          yb: base + yG,
          slope: true,
          ladder: true,
          walk: true,
          step: true,
        });
        // (under the landing you cannot walk through to the door: its sides are a wall from below)
        return {
          kind: "ladder",
          foot: mid(DD + LR + 0.45),
          deck: mid(DD * 0.55),
        };
      }
      // ---- in between: steps ----
      let room = MAXN;
      for (let k = 0; k < MAXN && room === MAXN; k++) {
        const z0 = k * TREAD + 0.05,
          z1 = (k + 1) * TREAD - 0.05;
        for (const s of [z0, (z0 + z1) / 2, z1])
          for (const a of [-HALF + 0.05, 0, HALF - 0.05])
            if (
              room === MAXN &&
              blocked(sill.x + ox * s + ex * a, sill.z + oz * s + ez * a)
            )
              room = k;
      }
      if (room < 1) return null;
      // as few as will do: the risers even, from the sill down to the ground past the last step
      let n = 1;
      for (; n < room; n++)
        if ((Y - hiAt(n * TREAD + 0.2)) / (n + 1) <= MAXR) break;
      // (hemmed in, they are steeper, never more than you can step up)
      const riser = Math.min(
        0.46,
        Math.max(0.1, (Y - hiAt(n * TREAD + 0.2)) / (n + 1)),
      );
      const list = [];
      for (let k = 0; k < n; k++) {
        const z0 = k * TREAD,
          z1 = z0 + TREAD;
        const bot =
          Math.min(
            at(z0, -HALF),
            at(z0, HALF),
            at(z1, -HALF),
            at(z1, HALF),
            at((z0 + z1) / 2, 0),
          ) - 0.35;
        list.push({ z0, z1, top: Y - riser * (k + 1), bot });
      }
      stairInto(
        mb,
        (p) => [
          sill.x + p[0] * ex + p[2] * ox,
          p[1],
          sill.z + p[0] * ez + p[2] * oz,
        ],
        rows,
        list,
        HALF,
      );
      for (const q of list) {
        const m = (q.z0 + q.z1) / 2;
        push({
          x: sill.x + ox * m,
          z: sill.z + oz * m,
          hx: HALF,
          hz: TREAD / 2,
          cs: ex,
          sn: ez,
          top: base + q.top,
          walk: true,
          step: true,
        });
      }
      return { kind: "steps", n, foot: mid(n * TREAD + 0.5), deck: null };
    },
    // the hearth nearest you (in the scene's metres), and whether you are in its room
    hearthNear() {
      let best = null;
      const R = this.R,
        p = this.p,
        eyeY = this.eyeY;
      const look = (list, mesh, dir, F, rooms) => {
        if (!list || !list.length || !mesh || !mesh.parent) return;
        if (arcM(p, dir, R) > 90) return;
        const e = mesh.matrix.elements;
        for (const h of list) {
          const X = e[0] * h.x + e[4] * h.y + e[8] * h.z + e[12],
            Y = e[1] * h.x + e[5] * h.y + e[9] * h.z + e[13],
            Z = e[2] * h.x + e[6] * h.y + e[10] * h.z + e[14];
          const m = Math.hypot(X, Y - eyeY, Z);
          if (m < 8 && (!best || m < best.m)) best = { X, Y, Z, m };
        }
      };
      if (this.siteViews)
        for (const v of this.siteViews.values())
          look(v.hearths, v.mesh, v.site.dir, v.F, v.rooms);
      if (this.towns)
        for (const tw of this.towns.values())
          look(tw.hearths, tw.mesh, tw.s.dir, tw.F, tw.rooms);
      if (best) best.inside = !!this.roomAt();
      return best;
    },
    // the room you are standing in, if any
    roomAt() {
      const R = this.R,
        p = this.p;
      const inRoom = (rooms, c, F, base) => {
        if (!rooms || !rooms.length) return null;
        const d = [p[0] - c[0], p[1] - c[1], p[2] - c[2]];
        const lx = (d[0] * F.e[0] + d[1] * F.e[1] + d[2] * F.e[2]) * R,
          lz = -(d[0] * F.n[0] + d[1] * F.n[1] + d[2] * F.n[2]) * R;
        for (const r of rooms) {
          const u = (lx - r.x) * r.cs + (lz - r.z) * r.sn,
            w = -(lx - r.x) * r.sn + (lz - r.z) * r.cs;
          if (
            Math.abs(u) < r.hx &&
            Math.abs(w) < r.hz &&
            this.eyeY > base + r.y0 &&
            this.eyeY < base + r.y1 + 1
          )
            return r;
        }
        return null;
      };
      if (this.siteViews)
        for (const v of this.siteViews.values()) {
          if (arcM(p, v.site.dir, R) > v.plan.r + 10) continue;
          const r = inRoom(v.rooms, v.site.dir, v.F, v.base);
          if (r) return r;
        }
      if (this.towns)
        for (const tw of this.towns.values()) {
          if (arcM(p, tw.s.dir, R) > 400) continue;
          const r = inRoom(tw.rooms, tw.s.dir, tw.F, tw.base);
          if (r) return r;
        }
      return null;
    },
    // a host's metres (a town's or a place's): where a point on the planet is, x east, z south
    hostLocal(host, d) {
      const c = host.s ? host.s.dir : host.site.dir,
        F = host.F,
        R = this.R;
      const q = [d[0] - c[0], d[1] - c[1], d[2] - c[2]];
      return [
        (q[0] * F.e[0] + q[1] * F.e[1] + q[2] * F.e[2]) * R,
        -(q[0] * F.n[0] + q[1] * F.n[1] + q[2] * F.n[2]) * R,
      ];
    },
    // can someone walk straight from a to b without passing through a wall, a post or a bed?
    folkPathClear(host, a, b) {
      const [ax, az] = this.hostLocal(host, a),
        [bx, bz] = this.hostLocal(host, b);
      const L = Math.hypot(bx - ax, bz - az),
        n = Math.max(2, Math.ceil(L / 0.4)),
        m = 0.35;
      const boxes = host.boxes || [],
        col = host.col || [];
      for (let k = 1; k <= n; k++) {
        const t = k / n,
          x = ax + (bx - ax) * t,
          z = az + (bz - az) * t;
        for (const bx2 of boxes) {
          // (floors and steps are walked on, not round)
          if (bx2.walk) continue;
          const lx = x - bx2.x,
            lz = z - bx2.z,
            u = lx * bx2.cs + lz * bx2.sn,
            w = -lx * bx2.sn + lz * bx2.cs;
          if (Math.abs(u) < bx2.hx + m && Math.abs(w) < bx2.hz + m)
            return false;
        }
        for (let i = 0; i < col.length; i += 6)
          if (Math.hypot(x - col[i], z - col[i + 1]) < col[i + 2] + m)
            return false;
      }
      return true;
    },
    // the floor under a point, if it is inside one of the host's rooms, or the step it is on outside
    // a door (metres above sea)
    floorAt(host, d) {
      const nR = host.rooms ? host.rooms.length : 0,
        nS = host.steps ? host.steps.length : 0;
      if (!nR && !nS) return null;
      const [x, z] = this.hostLocal(host, d);
      for (let i = 0; i < nR; i++) {
        const r = host.rooms[i],
          u = (x - r.x) * r.cs + (z - r.z) * r.sn,
          w = -(x - r.x) * r.sn + (z - r.z) * r.cs;
        if (Math.abs(u) < r.hx + 0.3 && Math.abs(w) < r.hz + 0.3)
          return host.base + r.y0;
      }
      let on = null;
      for (let i = 0; i < nS; i++) {
        const s = host.steps[i],
          u = (x - s.x) * s.cs + (z - s.z) * s.sn,
          w = -(x - s.x) * s.sn + (z - s.z) * s.cs;
        if (!(Math.abs(u) < s.hx && Math.abs(w) < s.hz + 0.02)) continue;
        // (a ramp or a ladder: the height along it)
        const top = s.slope
          ? s.ya +
            ((s.yb - s.ya) * (Math.max(-s.hz, Math.min(s.hz, w)) + s.hz)) /
              (2 * s.hz)
          : s.top;
        if (on == null || top > on) on = top;
      }
      return on;
    },
    // build a place again (someone came or went): now, if you are there (so you never fall through a floor)
    refreshSite(id) {
      const v = this.siteViews && this.siteViews.get(id);
      if (!v) return;
      this.dropSite(v);
      if (arcM(this.p, v.site.dir, this.R) < v.reach)
        this.siteViews.set(id, this.buildSite(v.site));
      else this.siteViews.delete(id);
    },
    dropSite(v) {
      if (this.untether) this.untether(v);
      if (v.pen) this.dropPen(v);
      for (const m of [v.mesh, ...v.extra]) {
        if (m && m.parent) m.parent.remove(m);
        if (m) m.geometry.dispose();
      }
      for (const f of v.folk) {
        this.scene.remove(f.mesh);
        f.mesh.geometry.dispose();
        f.mesh.material.dispose();
      }
      // (the spout's shape is shared by every geyser: only the mesh goes)
      if (v.geyser && v.geyser.mesh.parent)
        v.geyser.mesh.parent.remove(v.geyser.mesh);
    },
    // ---------- a geyser: its spout ----------
    // water and spray going up, a metre tall: scaled to the height of the spout as it goes
    geyserColumn() {
      if (!this.geyserGeo) {
        const mb = new MeshBuf(),
          rows = this.siteRowsGet();
        mb.prism(
          [0, 0, 0],
          [0, 1, 0],
          0.42,
          0.7,
          8,
          rows.spray,
          PAT.SPRAY,
          null,
          0,
          true,
        );
        mb.prism(
          [0, 0.12, 0],
          [0, 1.06, 0],
          0.85,
          1.8,
          9,
          rows.spray,
          PAT.SPRAY,
          null,
          0.5,
          true,
        );
        // and what falls back round its foot
        mb.prism(
          [0, -0.02, 0],
          [0, 0.22, 0],
          2.7,
          1.3,
          10,
          rows.spray,
          PAT.SPRAY,
        );
        this.syncRamps();
        this.geyserGeo = this.meshOf(mb.finish(), this.solidMat).geometry;
      }
      const m = new this.T.Mesh(this.geyserGeo, this.solidMat);
      m.matrixAutoUpdate = false;
      m.frustumCulled = false;
      m.visible = false;
      return m;
    },
    // how high it spouts now (m): every minute or two, for a few seconds, higher than a tower;
    // just before, it heaves and spits
    stepGeyser(v, nowS) {
      const G = v.geyser,
        P = G.period,
        t = ((((nowS / P + G.phase) % 1) + 1) % 1) * P;
      let H = 0;
      if (t < G.dur)
        H =
          G.max *
          Math.min(1, t / 1.3) *
          Math.min(1, (G.dur - t) / 3) *
          (0.9 + 0.1 * Math.sin(t * 9));
      else if (P - t < 2.6) H = 0.6 + 0.7 * Math.abs(Math.sin(t * 6.5));
      G.H = H;
      G.t = t;
      const m = G.mesh;
      if (!m.parent) this.scene.add(m);
      m.visible = H > 0.05;
      if (!m.visible) return;
      const d = stepOn(v.site.dir, v.F, G.x, -G.z, this.R);
      this.placeMatrix(m, d, frameAt(d), v.base + G.y - 0.05);
      m.matrix.multiply(
        (this._gScale || (this._gScale = new this.T.Matrix4())).makeScale(
          1,
          H,
          1,
        ),
      );
    },
    // the geyser nearest you (for its roar, and its scalding): { v, m (to the vent), H (how high it spouts), t (into its round) }
    geyserNear(reach = 400) {
      if (!this.siteViews) return null;
      let best = null;
      for (const v of this.siteViews.values()) {
        if (!v.geyser) continue;
        const m = arcM(
          this.p,
          stepOn(v.site.dir, v.F, v.geyser.x, -v.geyser.z, this.R),
          this.R,
        );
        if (m < reach && (!best || m < best.m))
          best = { v, m, H: v.geyser.H || 0, t: v.geyser.t || 0, G: v.geyser };
      }
      return best;
    },

    // ---------- the pieces places are made of ----------
    // pr: the prop (site metres); y0: the ground under it, relative to the place's base
    propInto(mb, pr, y0, c) {
      const { rows, grass, col, boxes, hAt, base } = c;
      const x = pr.x,
        z = pr.z;
      const cs = Math.cos(pr.rot || 0),
        sn = Math.sin(pr.rot || 0);
      const at = (u, y, w) => [x + u * cs - w * sn, y, z + u * sn + w * cs];
      // a turned, leaning, tapering box: u right, v forward, leaning towards +v
      const obox = (
        u0,
        w0,
        y,
        hw,
        h,
        hd,
        rot,
        lean,
        taper,
        row,
        pat,
        o = null,
      ) => {
        const c2 = Math.cos(rot),
          s2 = Math.sin(rot),
          cl = Math.cos(lean),
          sl = Math.sin(lean);
        const P = (u, yy, w) => {
          const y2 = yy * cl - w * sl,
            w2 = w * cl + yy * sl;
          return [x + u0 + u * c2 - w2 * s2, y + y2, z + w0 + u * s2 + w2 * c2];
        };
        const b = [P(-hw, 0, -hd), P(hw, 0, -hd), P(hw, 0, hd), P(-hw, 0, hd)];
        const t = [
          P(-hw * taper, h, -hd * taper),
          P(hw * taper, h, -hd * taper),
          P(hw * taper, h, hd * taper),
          P(-hw * taper, h, hd * taper),
        ];
        const uvs = (a, bb) => [
          [0, 0],
          [a, 0],
          [a, bb],
          [0, bb],
        ];
        mb.quad(b[3], b[2], t[2], t[3], row, pat, uvs(hw * 2, h), o);
        mb.quad(b[1], b[0], t[0], t[1], row, pat, uvs(hw * 2, h), o);
        mb.quad(b[2], b[1], t[1], t[2], row, pat, uvs(hd * 2, h), o);
        mb.quad(b[0], b[3], t[3], t[0], row, pat, uvs(hd * 2, h), o);
        mb.quad(t[3], t[2], t[1], t[0], row, pat, uvs(hw * 2, hd * 2), o);
        return P;
      };
      const post = (r, top) =>
        col.push(
          x,
          z,
          r,
          base + y0 - 0.2,
          top == null ? 1e9 : base + y0 + top,
          1,
        );
      switch (pr.t) {
        case "cairn": {
          const rnd = mulberry32(pr.seed),
            h = pr.h,
            n = Math.max(4, Math.round(h * 3.6));
          let y = y0 - 0.12;
          const r0 = h * 0.4;
          for (let k = 0; k < n; k++) {
            const t = k / n,
              r = r0 * (1 - t * 0.72),
              th = (h / n) * 1.2;
            lumpInto(
              mb,
              x + (rnd() - 0.5) * 0.1 * r0,
              y,
              z + (rnd() - 0.5) * 0.1 * r0,
              r,
              th * 0.56,
              r * 0.9,
              rows.stone,
              rows.moss,
              pr.seed + k * 7,
              rnd() * 6,
            );
            y += th * 0.86;
          }
          if (pr.pole) {
            mb.prism(
              [x, y - 0.4, z],
              [x, y + 1.7, z],
              0.05,
              0.04,
              4,
              rows.wood,
              PAT.BARK,
            );
            mb.quad(
              [x, y + 1.1, z],
              [x + 0.55, y + 1.05, z + 0.1],
              [x + 0.6, y + 1.6, z + 0.12],
              [x, y + 1.65, z],
              rows.rag,
              PAT.CLOTH,
            );
            mb.quad(
              [x + 0.55, y + 1.05, z + 0.1],
              [x, y + 1.1, z],
              [x, y + 1.65, z],
              [x + 0.6, y + 1.6, z + 0.12],
              rows.rag,
              PAT.CLOTH,
            );
          }
          col.push(x, z, r0 * 0.9, base + y0 - 0.1, base + y0 + h * 0.95, 2);
          break;
        }
        case "slab": {
          const P = obox(
            0,
            0,
            y0 - 0.35,
            pr.w / 2,
            pr.h + 0.35,
            pr.d / 2,
            pr.rot,
            pr.lean || 0,
            0.78,
            rows.old,
            PAT.ROCK,
            { row2: rows.moss },
          );
          if (pr.carved) {
            // marks cut into the face
            const rnd = mulberry32(pr.seed ^ 77);
            for (let k = 0; k < 7; k++) {
              const u = (rnd() - 0.5) * pr.w * 0.6,
                y = 0.9 + rnd() * (pr.h - 1.2),
                gw = 0.06 + rnd() * 0.12,
                gh = 0.08 + rnd() * 0.2,
                f = (pr.d / 2) * (1 - (0.22 * y) / pr.h) + 0.012;
              mb.quad(
                P(u - gw, y, f),
                P(u + gw, y, f),
                P(u + gw, y + gh, f),
                P(u - gw, y + gh, f),
                rows.stoneDark,
                PAT.NONE,
                null,
                { lv: -1.2 },
              );
            }
          }
          if ((pr.lean || 0) < 0.5) post(Math.max(pr.w, pr.d) / 2 + 0.02);
          break;
        }
        case "shrine": {
          // (each people builds them its own way: see placesview.js)
          if (pr.look && pr.look !== "post" && this.shrineInto) {
            this.shrineInto(mb, pr, y0, c, { at, obox, post, x, z, cs, sn });
            break;
          }
          mb.prism(
            at(0, y0 - 0.2, 0),
            at(0, y0 + 1.0, 0),
            0.09,
            0.08,
            4,
            rows.wood,
            PAT.BARK,
          );
          const b0 = at(-0.28, 0, -0.2),
            b1 = at(0.28, 0, 0.2);
          mb.box(
            Math.min(b0[0], b1[0]),
            y0 + 0.95,
            Math.min(b0[2], b1[2]),
            Math.max(b0[0], b1[0]),
            y0 + 1.42,
            Math.max(b0[2], b1[2]),
            rows.stone,
            PAT.STONE,
          );
          const T0 = at(0, y0 + 1.72, -0.34),
            T1 = at(0, y0 + 1.72, 0.34);
          const a0 = at(-0.42, y0 + 1.42, -0.34),
            a1 = at(-0.42, y0 + 1.42, 0.34),
            b2 = at(0.42, y0 + 1.42, -0.34),
            b3 = at(0.42, y0 + 1.42, 0.34);
          mb.quad(a1, a0, T0, T1, rows.woodDark, PAT.SLATE);
          mb.quad(b2, b3, T1, T0, rows.woodDark, PAT.SLATE);
          mb.quad(...mb.under(a1, a0, T0, T1), rows.woodDark, PAT.NONE, null, {
            lv: -1,
          });
          mb.quad(...mb.under(b2, b3, T1, T0), rows.woodDark, PAT.NONE, null, {
            lv: -1,
          });
          mb.prism(
            at(0, y0 + 1.42, 0.3),
            at(0, y0 + 1.5, 0.3),
            0.12,
            0.14,
            6,
            rows.stoneDark,
            PAT.NONE,
            null,
            0,
            true,
          );
          const cq = at(0.14, 0, 0.3);
          mb.box(
            cq[0] - 0.02,
            y0 + 1.42,
            cq[2] - 0.02,
            cq[0] + 0.02,
            y0 + 1.55,
            cq[2] + 0.02,
            rows.glow,
            PAT.GLOW,
            { row2: rows.glow },
          );
          c.v.lights.push({ x: cq[0], y: y0 + 1.6, z: cq[2], kind: "candle" });
          post(0.3);
          break;
        }
        case "firepit": {
          for (let k = 0; k < 9; k++) {
            const a = (k / 9) * Math.PI * 2;
            lumpInto(
              mb,
              x + Math.cos(a) * 0.6,
              y0 - 0.06,
              z + Math.sin(a) * 0.6,
              0.13,
              0.08,
              0.11,
              rows.stone,
              rows.stone,
              hashInt(k, (pr.x * 10) | 0, 5),
              a,
            );
          }
          mb.prism(
            [x, y0 - 0.02, z],
            [x, y0 + 0.02, z],
            0.5,
            0.5,
            8,
            rows.ash,
            PAT.NONE,
            null,
            0,
            true,
          );
          for (let k = 0; k < 4; k++) {
            const a = (k / 4) * Math.PI * 2 + 0.3;
            mb.prism(
              [x + Math.cos(a) * 0.45, y0 + 0.02, z + Math.sin(a) * 0.45],
              [
                x - Math.cos(a) * 0.08,
                y0 + (pr.lit ? 0.3 : 0.08),
                z - Math.sin(a) * 0.08,
              ],
              0.05,
              0.04,
              4,
              pr.lit ? rows.wood : rows.char,
              PAT.BARK,
            );
          }
          if (pr.lit)
            for (let k = 0; k < 4; k++) {
              const a = k * 1.9,
                r = k ? 0.12 : 0;
              mb.cone(
                [x + Math.cos(a) * r, y0 + 0.04, z + Math.sin(a) * r],
                y0 + 0.38 + (k ? 0.14 : 0.32) * (1 - k * 0.15),
                0.14 - k * 0.012,
                5,
                rows.flame,
                PAT.FLAME,
                null,
                0,
                0,
                a,
              );
            }
          post(0.62, 1e5);
          c.v.fireAt = { x, z, y: y0 };
          if (pr.lit) c.v.lights.push({ x, y: y0 + 0.45, z, kind: "fire" });
          break;
        }
        case "log":
          mb.prism(
            at(-0.8, y0 + 0.16, 0),
            at(0.8, y0 + 0.16, 0),
            0.2,
            0.18,
            6,
            rows.wood,
            PAT.BARK,
            null,
            0,
            true,
          );
          break;
        case "workbench": {
          workbenchInto(
            mb,
            (pp) => at(pp[0], y0 + pp[1], pp[2]),
            rows,
            pr.seed || 1,
          );
          boxes.push({
            x,
            z,
            hx: 0.62,
            hz: 0.3,
            cs: Math.cos(pr.rot || 0),
            sn: Math.sin(pr.rot || 0),
          });
          break;
        }
        case "cavemouth": {
          this.caveRockInto(mb, pr, y0, c, at);
          break;
        }
        case "stall": {
          // a market stall; your own starts bare, and what you put out lies on the counter, tops away
          // from whoever comes to look so they see it the right way up
          stallInto(
            mb,
            (pp) => at(pp[0], y0 + pp[1], pp[2]),
            { ...rows, straw: rows.grain, pot: rows.rust },
            [rows.red, rows.blue, rows.cloth][(pr.cloth || 0) % 3],
            !!pr.mine,
          );
          boxes.push({ x, z, hx: 1.0, hz: 0.45, cs, sn });
          const st = pr.mine && c.s.home && c.s.home.stall;
          if (st)
            st.goods.slice(0, 8).forEach((g, k) => {
              const id = g.s && g.s[0];
              if (!id) return;
              const size = Math.min(0.34, showSize(id)),
                P0 = at(
                  -0.66 + (k % 4) * 0.44,
                  y0 + 0.85,
                  k < 4 ? 0.17 : -0.15,
                );
              iconSolidInto(
                mb,
                iconPixels(id, !!g.s[3]),
                size,
                decorFrame(P0, (pr.face || 0) + Math.PI, true, size),
                (c2) => this.row(c2),
              );
            });
          break;
        }
        case "rail": {
          railInto(mb, (pp) => at(pp[0], y0 + pp[1], pp[2]), rows);
          for (const u of [-1.15, 1.15]) {
            const q = at(u, 0, 0);
            col.push(q[0], q[2], 0.14, base + y0 - 0.3, base + y0 + 1.3, 1);
          }
          break;
        }
        case "frame":
          for (let k = 0; k < 4; k++)
            mb.prism(
              at(-0.9 + k * 0.6, y0, -0.6),
              at(-0.7 + k * 0.55, y0 + 1.1 - k * 0.15, 0.4),
              0.035,
              0.03,
              4,
              rows.woodDark,
              PAT.BARK,
            );
          break;
        case "grave": {
          const n = 10;
          for (let j = 0; j < 3; j++)
            for (let k = 0; k < n; k++) {
              const a0 = (k / n) * 6.283,
                a1 = ((k + 1) / n) * 6.283,
                e0 = (j / 3) * 1.57,
                e1 = ((j + 1) / 3) * 1.57;
              const P = (a, e) =>
                at(
                  Math.cos(a) * Math.cos(e) * 0.55,
                  y0 - 0.05 + Math.sin(e) * 0.38,
                  Math.sin(a) * Math.cos(e) * 1.05,
                );
              mb.quad(
                P(a1, e0),
                P(a0, e0),
                P(a0, e1),
                P(a1, e1),
                grass,
                PAT.HIDE,
              );
            }
          if (pr.marker === "stone") {
            const q = at(0, 0, -1.15);
            obox(
              q[0] - x,
              q[2] - z,
              y0 - 0.2,
              0.28,
              1.0,
              0.08,
              pr.rot,
              0.06,
              0.9,
              rows.stone,
              PAT.ROCK,
              { row2: rows.moss },
            );
          } else {
            mb.prism(
              at(0, y0 - 0.2, -1.2),
              at(0, y0 + 0.95, -1.2),
              0.05,
              0.045,
              4,
              rows.woodDark,
              PAT.BARK,
            );
            mb.prism(
              at(-0.28, y0 + 0.68, -1.2),
              at(0.28, y0 + 0.68, -1.2),
              0.035,
              0.035,
              4,
              rows.woodDark,
              PAT.BARK,
            );
          }
          break;
        }
        case "pool": {
          // water sits at the lowest point of its rim, so it never hangs in the air
          const n = 14,
            rim = [];
          let lo = 1e9;
          for (let k = 0; k < n; k++) {
            const a = (k / n) * 6.283,
              h = hAt(x + Math.cos(a) * pr.r, z + Math.sin(a) * pr.r);
            rim.push(h);
            lo = Math.min(lo, h);
          }
          // the water fills the hollow up to the highest ground inside it (a raised basin if need be)
          let top = y0;
          for (let k = 0; k < 8; k++) {
            const a = (k / 8) * 6.283;
            for (const f of [0.45, 0.8])
              top = Math.max(
                top,
                hAt(x + Math.cos(a) * pr.r * f, z + Math.sin(a) * pr.r * f),
              );
          }
          const wy = top + 0.05,
            wrow = pr.hot ? rows.hot : rows.water;
          void lo;
          for (let k = 0; k < n; k++) {
            const a0 = (k / n) * 6.283,
              a1 = ((k + 1) / n) * 6.283;
            mb.tri(
              [x, wy, z],
              [x + Math.cos(a1) * pr.r, wy, z + Math.sin(a1) * pr.r],
              [x + Math.cos(a0) * pr.r, wy, z + Math.sin(a0) * pr.r],
              wrow,
              PAT.POOL,
            );
            // a dark bank down into the water, so the edge reads
            mb.quad(
              [x + Math.cos(a0) * pr.r, wy - 0.4, z + Math.sin(a0) * pr.r],
              [x + Math.cos(a1) * pr.r, wy - 0.4, z + Math.sin(a1) * pr.r],
              [
                x + Math.cos(a1) * (pr.r + 0.25),
                rim[(k + 1) % n] + 0.02,
                z + Math.sin(a1) * (pr.r + 0.25),
              ],
              [
                x + Math.cos(a0) * (pr.r + 0.25),
                rim[k] + 0.02,
                z + Math.sin(a0) * (pr.r + 0.25),
              ],
              pr.hot ? rows.crust : rows.soil,
              PAT.NONE,
              null,
              { lv: -0.5 },
            );
            if (pr.hot)
              mb.quad(
                [
                  x + Math.cos(a0) * (pr.r + 0.25),
                  rim[k] + 0.03,
                  z + Math.sin(a0) * (pr.r + 0.25),
                ],
                [
                  x + Math.cos(a1) * (pr.r + 0.25),
                  rim[(k + 1) % n] + 0.03,
                  z + Math.sin(a1) * (pr.r + 0.25),
                ],
                [
                  x + Math.cos(a1) * (pr.r + 1.1),
                  hAt(
                    x + Math.cos(a1) * (pr.r + 1.1),
                    z + Math.sin(a1) * (pr.r + 1.1),
                  ) + 0.03,
                  z + Math.sin(a1) * (pr.r + 1.1),
                ],
                [
                  x + Math.cos(a0) * (pr.r + 1.1),
                  hAt(
                    x + Math.cos(a0) * (pr.r + 1.1),
                    z + Math.sin(a0) * (pr.r + 1.1),
                  ) + 0.03,
                  z + Math.sin(a0) * (pr.r + 1.1),
                ],
                rows.crust,
                PAT.HIDE,
              );
          }
          const rnd = mulberry32(pr.seed);
          for (let k = 0; k < 9; k++) {
            const a = (k / 9) * 6.283 + rnd(),
              r = pr.r + 0.3 + rnd() * 0.3,
              s2 = 0.16 + rnd() * 0.18;
            lumpInto(
              mb,
              x + Math.cos(a) * r,
              hAt(x + Math.cos(a) * r, z + Math.sin(a) * r) - 0.08,
              z + Math.sin(a) * r,
              s2,
              s2 * 0.6,
              s2,
              rows.stone,
              rows.moss,
              pr.seed + k,
              a,
            );
          }
          if (pr.hot) c.v.pool = { x, z, r: pr.r, y: wy };
          break;
        }
        case "stash": {
          lumpInto(
            mb,
            x,
            y0 - 0.2,
            z,
            0.95,
            0.5,
            0.8,
            rows.stone,
            rows.moss,
            hashInt((x * 10) | 0, (z * 10) | 0, 9),
            pr.rot,
          );
          let y = y0 - 0.05;
          for (let k = 0; k < 3; k++) {
            lumpInto(
              mb,
              x + 1.15,
              y,
              z + 0.1,
              0.2 - k * 0.04,
              0.09,
              0.17 - k * 0.03,
              rows.stoneDark,
              rows.stoneDark,
              hashInt(k, 3, 11),
              k,
            );
            y += 0.15;
          }
          col.push(x, z, 0.85, base + y0 - 0.2, base + y0 + 0.75, 2);
          break;
        }
        case "bones": {
          const L = pr.l,
            n = Math.round(L / 0.9);
          const spineY = (t) => y0 + 1.3 + Math.sin(t * Math.PI) * 0.35;
          for (let k = 0; k < 6; k++) {
            const t0 = k / 6,
              t1 = (k + 1) / 6;
            mb.prism(
              at(-L / 2 + t0 * L, spineY(t0), 0),
              at(-L / 2 + t1 * L, spineY(t1), 0),
              0.11,
              0.1,
              5,
              rows.bone,
              PAT.NONE,
            );
          }
          for (let k = 1; k < n - 1; k++) {
            const t = k / n,
              u = -L / 2 + t * L,
              top = spineY(t),
              w = 1.05 * Math.sin(t * Math.PI) + 0.4;
            for (const sd of [-1, 1]) {
              let prev = at(u, top, 0);
              for (let q = 1; q <= 4; q++) {
                const e = ((q / 4) * Math.PI) / 2,
                  pnt = at(
                    u + q * 0.05,
                    top - (top - y0 + 0.1) * (1 - Math.cos(e)),
                    sd * w * Math.sin(e),
                  );
                mb.prism(prev, pnt, 0.06, 0.05, 4, rows.bone, PAT.NONE);
                prev = pnt;
              }
            }
          }
          const hx = L / 2 + 0.2;
          const h0 = at(hx, y0, -0.3),
            h1 = at(hx + 1.4, y0, 0.3);
          mb.box(
            Math.min(h0[0], h1[0]),
            y0,
            Math.min(h0[2], h1[2]),
            Math.max(h0[0], h1[0]),
            y0 + 0.75,
            Math.max(h0[2], h1[2]),
            rows.bone,
            PAT.NONE,
          );
          break;
        }
        case "sign": {
          mb.prism(
            [x, y0 - 0.3, z],
            [x, y0 + 2.3, z],
            0.07,
            0.06,
            4,
            rows.wood,
            PAT.BARK,
          );
          for (const [hh, a] of [
            [2.0, pr.head],
            [1.65, pr.head + Math.PI],
          ]) {
            const ux = Math.sin(a),
              uz = -Math.cos(a);
            const p0 = [x + ux * 0.05, y0 + hh, z + uz * 0.05],
              p1 = [x + ux * 1.05, y0 + hh, z + uz * 1.05];
            const nx = -uz * 0.04,
              nz = ux * 0.04;
            mb.quad(
              [p0[0] - nx, p0[1] - 0.11, p0[2] - nz],
              [p1[0] - nx, p1[1] - 0.11, p1[2] - nz],
              [p1[0] - nx, p1[1] + 0.11, p1[2] - nz],
              [p0[0] - nx, p0[1] + 0.11, p0[2] - nz],
              rows.wood,
              PAT.PLANK,
            );
            mb.quad(
              [p1[0] + nx, p1[1] - 0.11, p1[2] + nz],
              [p0[0] + nx, p0[1] - 0.11, p0[2] + nz],
              [p0[0] + nx, p0[1] + 0.11, p0[2] + nz],
              [p1[0] + nx, p1[1] + 0.11, p1[2] + nz],
              rows.wood,
              PAT.PLANK,
            );
            mb.tri(
              [p1[0] - nx, p1[1] - 0.11, p1[2] - nz],
              [p1[0] + ux * 0.18, p1[1], p1[2] + uz * 0.18],
              [p1[0] - nx, p1[1] + 0.11, p1[2] - nz],
              rows.wood,
              PAT.NONE,
            );
            mb.tri(
              [p1[0] + nx, p1[1] + 0.11, p1[2] + nz],
              [p1[0] + ux * 0.18, p1[1], p1[2] + uz * 0.18],
              [p1[0] + nx, p1[1] - 0.11, p1[2] + nz],
              rows.wood,
              PAT.NONE,
            );
          }
          post(0.14);
          break;
        }
        case "well": {
          mb.prism(
            [x, y0 - 0.5, z],
            [x, y0 + 0.8, z],
            1.1,
            1.1,
            8,
            rows.stone,
            PAT.STONE,
            null,
            0,
            true,
          );
          mb.prism(
            [x - 0.9, y0 + 0.8, z],
            [x - 0.9, y0 + 2.4, z],
            0.08,
            0.08,
            4,
            rows.wood,
            PAT.BARK,
          );
          mb.prism(
            [x + 0.9, y0 + 0.8, z],
            [x + 0.9, y0 + 2.4, z],
            0.08,
            0.08,
            4,
            rows.wood,
            PAT.BARK,
          );
          mb.cone([x, y0 + 2.3, z], y0 + 3.0, 1.4, 8, rows.woodDark, PAT.SLATE);
          post(1.15);
          break;
        }
        case "woodpile": {
          for (let k = 0; k < 8; k++) {
            const row = k < 4 ? 0 : k < 7 ? 1 : 2,
              i = row === 0 ? k : row === 1 ? k - 4 : 0,
              y = y0 + 0.14 + row * 0.24,
              u = (i - (row === 0 ? 1.5 : row === 1 ? 1 : 0)) * 0.3;
            mb.prism(
              at(u, y, -0.8),
              at(u, y, 0.8),
              0.14,
              0.13,
              6,
              rows.wood,
              PAT.BARK,
              null,
              0,
              true,
            );
          }
          post(0.7, 0.7);
          break;
        }
        case "bench":
          mb.box(
            ...(() => {
              const a = at(-1, 0, -0.2),
                b = at(1, 0, 0.2);
              return [
                Math.min(a[0], b[0]),
                y0 + 0.42,
                Math.min(a[2], b[2]),
                Math.max(a[0], b[0]),
                y0 + 0.5,
                Math.max(a[2], b[2]),
              ];
            })(),
            rows.wood,
            PAT.PLANK,
          );
          break;
        case "innsign": {
          mb.prism(
            at(0, y0 - 0.3, 0),
            at(0, y0 + 2.9, 0),
            0.08,
            0.07,
            4,
            rows.woodDark,
            PAT.BARK,
          );
          mb.prism(
            at(0, y0 + 2.7, 0),
            at(1.05, y0 + 2.7, 0),
            0.05,
            0.05,
            4,
            rows.woodDark,
            PAT.BARK,
          );
          const p0 = at(0.2, y0 + 1.75, 0),
            p1 = at(0.95, y0 + 1.75, 0);
          mb.quad(
            [p0[0], p0[1], p0[2]],
            [p1[0], p1[1], p1[2]],
            [p1[0], p1[1] + 0.8, p1[2]],
            [p0[0], p0[1] + 0.8, p0[2]],
            rows.red,
            PAT.PLANK,
          );
          mb.quad(
            [p1[0], p1[1], p1[2]],
            [p0[0], p0[1], p0[2]],
            [p0[0], p0[1] + 0.8, p0[2]],
            [p1[0], p1[1] + 0.8, p1[2]],
            rows.red,
            PAT.PLANK,
          );
          mb.prism(
            at(0.35, y0 + 2.55, 0),
            at(0.35, y0 + 2.7, 0),
            0.01,
            0.01,
            3,
            rows.woodDark,
            PAT.NONE,
          );
          mb.prism(
            at(0.8, y0 + 2.55, 0),
            at(0.8, y0 + 2.7, 0),
            0.01,
            0.01,
            3,
            rows.woodDark,
            PAT.NONE,
          );
          // and a lantern on the other side of the post, for travellers after dark
          {
            const q = lampInto(
              mb,
              "wall",
              (pp) => at(-pp[2], y0 + pp[1], pp[0]),
              rows,
            );
            c.v.lights.push({ x: q[0], y: q[1], z: q[2], kind: "wall" });
          }
          post(0.15);
          break;
        }
        case "tent": {
          mb.cone(
            [x, y0 - 0.1, z],
            y0 + pr.h,
            pr.r,
            10,
            rows.hide,
            PAT.HIDE,
            null,
            0,
            0,
            pr.rot / 6.283,
          );
          mb.prism(
            [x, y0 + pr.h - 0.2, z],
            [x + 0.1, y0 + pr.h + 0.55, z],
            0.04,
            0.03,
            3,
            rows.wood,
            PAT.BARK,
          );
          const d0 = at(-0.35, y0, pr.r * 0.97),
            d1 = at(0.35, y0, pr.r * 0.97),
            d2 = at(0, y0 + 1.3, pr.r * 0.6);
          mb.tri(d0, d1, d2, rows.char, PAT.NONE);
          col.push(x, z, pr.r * 0.85, base + y0, 1e9, 1);
          break;
        }
        case "kiln": {
          lumpInto(
            mb,
            x,
            y0 - 0.3,
            z,
            2.1,
            0.95,
            2.1,
            rows.char,
            rows.soil,
            hashInt((x * 10) | 0, 7, 3),
          );
          col.push(x, z, 2.0, base + y0 - 0.3, base + y0 + 1.5, 2);
          break;
        }
        case "rack": {
          for (const u of [-1, 1]) {
            mb.prism(
              at(u, y0 - 0.1, -0.5),
              at(u, y0 + 1.7, 0),
              0.04,
              0.035,
              4,
              rows.wood,
              PAT.BARK,
            );
            mb.prism(
              at(u, y0 - 0.1, 0.5),
              at(u, y0 + 1.7, 0),
              0.04,
              0.035,
              4,
              rows.wood,
              PAT.BARK,
            );
          }
          mb.prism(
            at(-1.15, y0 + 1.65, 0),
            at(1.15, y0 + 1.65, 0),
            0.04,
            0.04,
            4,
            rows.wood,
            PAT.BARK,
          );
          for (const u of [-0.5, 0.45]) {
            const a = at(u - 0.35, y0 + 1.6, 0.02),
              b = at(u + 0.35, y0 + 1.6, 0.02),
              c2 = at(u + 0.3, y0 + 0.7, 0.05),
              d = at(u - 0.3, y0 + 0.75, 0.05);
            mb.quad(d, c2, b, a, rows.hide, PAT.HIDE);
            mb.quad(a, b, c2, d, rows.hide, PAT.HIDE);
          }
          break;
        }
        case "field": {
          // (the field itself, its furrows and its crop, is painted on the ground: see farmview's stepFields)
          const rnd = mulberry32(pr.seed);
          if (rnd() < 0.3) {
            // a scarecrow
            const sy = hAt(x, z);
            mb.prism(
              [x, sy - 0.3, z],
              [x, sy + 1.9, z],
              0.04,
              0.04,
              4,
              rows.wood,
              PAT.BARK,
            );
            mb.prism(
              at(-0.6, sy + 1.45, 0),
              at(0.6, sy + 1.45, 0),
              0.03,
              0.03,
              4,
              rows.wood,
              PAT.BARK,
            );
            mb.box(
              x - 0.16,
              sy + 1.0,
              z - 0.1,
              x + 0.16,
              sy + 1.5,
              z + 0.1,
              rows.cloth,
              PAT.CLOTH,
            );
            mb.cone(
              [x, sy + 1.85, z],
              sy + 2.15,
              0.28,
              6,
              rows.grain,
              PAT.THATCH,
            );
          }
          break;
        }
        case "fence": {
          const n = Math.max(2, Math.round(pr.len / 2.4));
          let prev = null;
          for (let k = 0; k <= n; k++) {
            const u = -pr.len / 2 + (k * pr.len) / n;
            if (Math.abs(u) < pr.gap / 2) {
              prev = null;
              continue;
            }
            const g = at(u, 0, 0),
              gy = hAt(g[0], g[2]);
            mb.prism(
              [g[0], gy - 0.2, g[2]],
              [g[0], gy + 1.1, g[2]],
              0.06,
              0.055,
              4,
              rows.wood,
              PAT.BARK,
            );
            col.push(g[0], g[2], 0.12, base + gy - 0.2, base + gy + 1.1, 1);
            if (prev)
              for (const hh of [0.5, 0.95])
                mb.prism(
                  [prev[0], prev[1] + hh, prev[2]],
                  [g[0], gy + hh, g[2]],
                  0.04,
                  0.04,
                  4,
                  rows.wood,
                  PAT.BARK,
                );
            prev = [g[0], gy, g[2]];
          }
          break;
        }
        case "ruinwalls": {
          const rnd = mulberry32(pr.seed),
            T = 0.7;
          const sides = [
            [-pr.w / 2, -pr.d / 2, pr.w / 2, -pr.d / 2],
            [pr.w / 2, -pr.d / 2, pr.w / 2, pr.d / 2],
            [pr.w / 2, pr.d / 2, -pr.w / 2, pr.d / 2],
            [-pr.w / 2, pr.d / 2, -pr.w / 2, -pr.d / 2],
          ];
          sides.forEach(([u0, w0, u1, w1], si) => {
            const len = Math.hypot(u1 - u0, w1 - w0),
              n = Math.max(2, Math.round(len / 2));
            for (let k = 0; k < n; k++) {
              const t0 = k / n,
                t1 = (k + 1) / n;
              if (si === 2 && Math.abs((t0 + t1) / 2 - 0.5) < 0.12) continue; // the doorway
              if (rnd() < 0.18) continue; // fallen away
              const h =
                si === 0 && k === 1 ? pr.tall : 0.35 + rnd() * rnd() * pr.tall;
              const cu = u0 + ((u1 - u0) * (t0 + t1)) / 2,
                cw = w0 + ((w1 - w0) * (t0 + t1)) / 2;
              const along = Math.atan2(w1 - w0, u1 - u0);
              const pc = at(cu, 0, cw),
                gy = hAt(pc[0], pc[2]);
              obox(
                pc[0] - x,
                pc[2] - z,
                gy - 0.4,
                len / n / 2 + 0.02,
                h + 0.4,
                T / 2,
                (pr.rot || 0) + along,
                0,
                0.97,
                rows.old,
                PAT.STONE,
                { row2: rows.moss },
              );
              const ca = Math.cos((pr.rot || 0) + along),
                sa = Math.sin((pr.rot || 0) + along);
              boxes.push({
                x: pc[0],
                z: pc[2],
                hx: len / n / 2 + 0.05,
                hz: T / 2 + 0.05,
                cs: ca,
                sn: sa,
                base: base + gy,
                top: base + gy + h,
              });
            }
          });
          break;
        }
        case "pillar": {
          mb.prism(
            [x, y0 - 0.3, z],
            [x, y0 + pr.h, z],
            pr.r,
            pr.r * 0.92,
            8,
            rows.old,
            PAT.ROCK,
            { row2: rows.moss },
            0,
            true,
          );
          if (pr.h > 3.6)
            mb.box(
              x - pr.r * 1.25,
              y0 + pr.h,
              z - pr.r * 1.25,
              x + pr.r * 1.25,
              y0 + pr.h + 0.35,
              z + pr.r * 1.25,
              rows.old,
              PAT.STONE,
            );
          col.push(
            x,
            z,
            pr.r + 0.02,
            base + y0 - 0.3,
            base + y0 + pr.h,
            pr.h < 0.5 ? 2 : 1,
          );
          break;
        }
        case "block":
          obox(
            0,
            0,
            y0 - 0.15,
            pr.s * 0.7,
            pr.s * 0.6,
            pr.s * 0.45,
            pr.rot,
            0,
            1,
            rows.old,
            PAT.STONE,
            { row2: rows.moss },
          );
          break;
        case "rubble": {
          const rnd = mulberry32(hashInt((x * 10) | 0, (z * 10) | 0, 17));
          for (let k = 0; k < 7; k++) {
            const a = rnd() * 6.28,
              r = rnd() * 0.9;
            lumpInto(
              mb,
              x + Math.cos(a) * r,
              y0 - 0.1,
              z + Math.sin(a) * r,
              0.2 + rnd() * 0.2,
              0.12 + rnd() * 0.1,
              0.18 + rnd() * 0.2,
              rows.stone,
              rows.moss,
              hashInt(k, 99, 1),
              a,
            );
          }
          break;
        }
        case "tower": {
          const n = 14,
            r = pr.r,
            t = 0.75,
            rnd = mulberry32(pr.seed),
            door = 0;
          const tops = [];
          for (let k = 0; k < n; k++)
            tops.push(
              pr.broken
                ? pr.h - rnd() * rnd() * pr.h * 0.45
                : pr.h + (k % 2 ? 0.9 : 0),
            );
          const minTop = Math.min(
            ...tops.map((h, k) => (pr.broken ? h : pr.h)),
          );
          const plat = pr.broken ? Math.max(3, minTop - 0.5) : pr.h - 0.05;
          const P = (a, rr, y) => at(Math.cos(a) * rr, y, Math.sin(a) * rr);
          for (let k = 0; k < n; k++) {
            const a0 = ((k - 0.5) / n) * 6.283 + Math.PI / 2,
              a1 = ((k + 0.5) / n) * 6.283 + Math.PI / 2;
            const h0 = y0 + tops[k],
              h1 = y0 + tops[k];
            const lo = k === door ? y0 + 2.3 : y0 - 0.6;
            mb.quad(
              P(a1, r, lo),
              P(a0, r, lo),
              P(a0, r, h0),
              P(a1, r, h1),
              rows.old,
              PAT.STONE,
              [
                [a1 * r, lo],
                [a0 * r, lo],
                [a0 * r, h0],
                [a1 * r, h1],
              ],
              { row2: rows.moss },
            );
            mb.quad(
              P(a0, r - t, lo),
              P(a1, r - t, lo),
              P(a1, r - t, h1),
              P(a0, r - t, h0),
              rows.oldDark,
              PAT.STONE,
              [
                [a0 * r, lo],
                [a1 * r, lo],
                [a1 * r, h1],
                [a0 * r, h0],
              ],
            );
            mb.quad(
              P(a0, r, h0),
              P(a0, r - t, h0),
              P(a1, r - t, h1),
              P(a1, r, h1),
              rows.old,
              PAT.STONE,
            );
            if (k === door) {
              // the doorway's sides and lintel
              mb.quad(
                P(a0, r - t, y0 - 0.6),
                P(a0, r, y0 - 0.6),
                P(a0, r, y0 + 2.3),
                P(a0, r - t, y0 + 2.3),
                rows.stoneDark,
                PAT.STONE,
              );
              mb.quad(
                P(a1, r, y0 - 0.6),
                P(a1, r - t, y0 - 0.6),
                P(a1, r - t, y0 + 2.3),
                P(a1, r, y0 + 2.3),
                rows.stoneDark,
                PAT.STONE,
              );
              mb.quad(
                P(a1, r - t, y0 + 2.3),
                P(a0, r - t, y0 + 2.3),
                P(a0, r, y0 + 2.3),
                P(a1, r, y0 + 2.3),
                rows.stoneDark,
                PAT.STONE,
              );
            } else if (k % 4 === 2) {
              for (const hy of [y0 + pr.h * 0.35, y0 + pr.h * 0.7]) {
                if (hy + 0.8 > h0 - 0.3) continue;
                const am = (a0 + a1) / 2,
                  da = 0.04;
                mb.quad(
                  P(am - da, r + 0.01, hy),
                  P(am + da, r + 0.01, hy),
                  P(am + da, r + 0.01, hy + 0.8),
                  P(am - da, r + 0.01, hy + 0.8),
                  rows.char,
                  PAT.NONE,
                );
              }
            }
          }
          // the floor at the top, and the dark inside
          for (let k = 0; k < n; k++) {
            const a0 = (k / n) * 6.283,
              a1 = ((k + 1) / n) * 6.283;
            mb.tri(
              at(0, y0 + plat, 0),
              P(a1, r - t + 0.02, y0 + plat),
              P(a0, r - t + 0.02, y0 + plat),
              rows.woodDark,
              PAT.PLANK,
            );
          }
          const hatch = at(0, y0 + plat + 0.01, r * 0.45);
          mb.box(
            hatch[0] - 0.4,
            y0 + plat + 0.005,
            hatch[2] - 0.4,
            hatch[0] + 0.4,
            y0 + plat + 0.03,
            hatch[2] + 0.4,
            rows.char,
            PAT.NONE,
            null,
            ["top"],
          );
          if (!pr.broken) {
            // a fire basket for the night watch
            mb.prism(
              at(0, y0 + plat, 0),
              at(0, y0 + plat + 0.9, 0),
              0.05,
              0.05,
              4,
              rows.woodDark,
              PAT.BARK,
            );
            mb.prism(
              at(0, y0 + plat + 0.9, 0),
              at(0, y0 + plat + 1.2, 0),
              0.25,
              0.35,
              6,
              rows.char,
              PAT.NONE,
            );
            for (let k = 0; k < 3; k++) {
              const a = k * 2.1;
              mb.cone(
                at(Math.cos(a) * 0.1, y0 + plat + 1.15, Math.sin(a) * 0.1),
                y0 + plat + 1.55 + k * 0.08,
                0.13,
                5,
                rows.flame,
                PAT.FLAME,
                null,
                0,
                0,
                a,
              );
            }
          }
          // a flat-topped column you can stand on once up there, and a parapet to keep you there
          col.push(x, z, r + 0.05, base + y0 - 0.6, base + y0 + plat, 3);
          for (let k = 0; k < 16; k++) {
            const a = (k / 16) * 6.283;
            col.push(
              x + Math.cos(a) * (r - 0.3),
              z + Math.sin(a) * (r - 0.3),
              0.3,
              base + y0 + plat - 0.05,
              base + y0 + plat + 1.2,
              1,
            );
          }
          c.v.towerTop = { alt: base + y0 + plat, r: r - t };
          break;
        }
        case "altar":
          obox(
            0,
            0,
            y0 - 0.25,
            0.95,
            0.95,
            0.55,
            pr.rot,
            0,
            0.94,
            rows.old,
            PAT.ROCK,
            { row2: rows.moss },
          );
          col.push(x, z, 0.8, base + y0 - 0.25, base + y0 + 0.7, 2);
          break;
        case "mound": {
          const n = 16,
            J = 5;
          for (let j = 0; j < J; j++)
            for (let k = 0; k < n; k++) {
              const a0 = (k / n) * 6.283,
                a1 = ((k + 1) / n) * 6.283,
                e0 = (j / J) * 1.5708,
                e1 = ((j + 1) / J) * 1.5708;
              const Pt = (a, e) => {
                const u = (Math.cos(a) * Math.cos(e) * pr.w) / 2,
                  w = (Math.sin(a) * Math.cos(e) * pr.l) / 2,
                  g = at(u, 0, w);
                return [
                  g[0],
                  (j === 0 && e === 0 ? hAt(g[0], g[2]) - 0.2 : y0 - 0.3) +
                    Math.sin(e) * pr.h,
                  g[2],
                ];
              };
              mb.quad(
                Pt(a1, e0),
                Pt(a0, e0),
                Pt(a0, e1),
                Pt(a1, e1),
                grass,
                PAT.HIDE,
              );
            }
          col.push(
            x,
            z,
            Math.min(pr.w, pr.l) / 2 + 0.3,
            base + y0 - 0.3,
            base + y0 + pr.h,
            2,
          );
          const q0 = at(0, 0, -pr.l * 0.3),
            q1 = at(0, 0, pr.l * 0.3);
          col.push(
            q0[0],
            q0[2],
            (pr.w / 2) * 0.8,
            base + y0 - 0.3,
            base + y0 + pr.h * 0.8,
            2,
            q1[0],
            q1[2],
            (pr.w / 2) * 0.8,
            base + y0 - 0.3,
            base + y0 + pr.h * 0.8,
            2,
          );
          break;
        }
        case "doorway": {
          for (const u of [-0.95, 0.95])
            obox(
              u * cs,
              u * sn,
              y0 - 0.3,
              0.3,
              pr.h + 0.3,
              0.32,
              pr.rot,
              0,
              0.92,
              rows.stone,
              PAT.ROCK,
              { row2: rows.moss },
            );
          obox(
            0,
            0,
            y0 + pr.h - 0.05,
            1.35,
            0.45,
            0.38,
            pr.rot,
            0,
            1,
            rows.stone,
            PAT.ROCK,
            { row2: rows.moss },
          );
          obox(
            0.2 * sn,
            -0.2 * cs,
            y0 - 0.2,
            0.66,
            pr.h + 0.1,
            0.1,
            pr.rot,
            0,
            1,
            rows.stoneDark,
            PAT.STONE,
          );
          break;
        }
        // ---------- a hermit's things ----------
        case "cauldron": {
          // a pot on three legs over a little fire, something green in it, bubbling
          const a0 = pr.rot || 0;
          for (let k = 0; k < 3; k++) {
            const a = a0 + (k / 3) * 6.283;
            mb.prism(
              [x + Math.cos(a) * 0.66, y0 - 0.1, z + Math.sin(a) * 0.66],
              [x + Math.cos(a) * 0.36, y0 + 0.78, z + Math.sin(a) * 0.36],
              0.035,
              0.03,
              4,
              rows.iron,
              PAT.NONE,
            );
          }
          mb.prism(
            [x, y0 + 0.16, z],
            [x, y0 + 0.32, z],
            0.22,
            0.44,
            10,
            rows.iron,
            PAT.NONE,
          );
          mb.prism(
            [x, y0 + 0.32, z],
            [x, y0 + 0.84, z],
            0.44,
            0.5,
            10,
            rows.iron,
            PAT.NONE,
          );
          for (let k = 0; k < 10; k++) {
            const b0 = (k / 10) * 6.283,
              b1 = ((k + 1) / 10) * 6.283;
            mb.tri(
              [x, y0 + 0.78, z],
              [x + Math.cos(b1) * 0.46, y0 + 0.78, z + Math.sin(b1) * 0.46],
              [x + Math.cos(b0) * 0.46, y0 + 0.78, z + Math.sin(b0) * 0.46],
              rows.brew,
              PAT.FLAME,
            );
          }
          for (let k = 0; k < 3; k++) {
            const a = k * 2.1;
            mb.cone(
              [x + Math.cos(a) * 0.1, y0 + 0.0, z + Math.sin(a) * 0.1],
              y0 + 0.24 + (k ? 0.04 : 0.1),
              0.12,
              5,
              rows.flame,
              PAT.FLAME,
              null,
              0,
              0,
              a,
            );
          }
          c.v.lights.push({ x, y: y0 + 0.3, z, kind: "fire" });
          post(0.62, 0.9);
          break;
        }
        case "chimes": {
          // a pole and a crossbar, and bones and stones on strings that knock together in the wind
          const rnd = mulberry32(pr.seed || 31),
            ca = Math.cos(pr.rot || 0),
            sa = Math.sin(pr.rot || 0);
          mb.prism(
            [x, y0 - 0.2, z],
            [x, y0 + 2.7, z],
            0.05,
            0.045,
            4,
            rows.woodDark,
            PAT.BARK,
          );
          mb.prism(
            [x - ca * 0.75, y0 + 2.5, z - sa * 0.75],
            [x + ca * 0.75, y0 + 2.5, z + sa * 0.75],
            0.03,
            0.03,
            4,
            rows.woodDark,
            PAT.BARK,
          );
          for (let k = 0; k < 5; k++) {
            const u = -0.6 + k * 0.3,
              tx = x + ca * u,
              tz = z + sa * u,
              len = 0.35 + rnd() * 0.45,
              by = y0 + 2.48 - len;
            mb.prism(
              [tx, y0 + 2.48, tz],
              [tx, by, tz],
              0.006,
              0.006,
              3,
              rows.rag,
              PAT.NONE,
            );
            if (k % 2)
              mb.prism(
                [tx, by + 0.02, tz],
                [tx + 0.02, by - 0.3, tz],
                0.03,
                0.022,
                4,
                rows.bone,
                PAT.NONE,
              );
            else
              lumpInto(
                mb,
                tx,
                by - 0.14,
                tz,
                0.07,
                0.08,
                0.06,
                rows.stone,
                rows.stone,
                (pr.seed || 31) + k,
                k,
              );
          }
          post(0.1);
          break;
        }
        case "totem": {
          // stones stacked into somebody, two dark eyes in the top one
          const rnd = mulberry32(pr.seed || 37),
            h = pr.h;
          let y = y0 - 0.1;
          for (let k = 0; k < 3; k++) {
            const r = 0.32 - k * 0.06,
              th = h / 3;
            lumpInto(
              mb,
              x,
              y,
              z,
              r,
              th * 0.55,
              r * 0.9,
              rows.stone,
              rows.moss,
              (pr.seed || 37) + k,
              rnd() * 6,
            );
            y += th * 0.9;
          }
          const ca = Math.cos(pr.rot || 0),
            sa = Math.sin(pr.rot || 0),
            ey = y - (h / 3) * 0.45,
            fr = 0.2;
          for (const sd of [-1, 1]) {
            const ex = x + ca * fr - sa * sd * 0.07,
              ez = z + sa * fr + ca * sd * 0.07;
            mb.box(
              ex - 0.025,
              ey - 0.025,
              ez - 0.025,
              ex + 0.025,
              ey + 0.025,
              ez + 0.025,
              rows.char,
              PAT.NONE,
            );
          }
          post(0.3, h);
          break;
        }
        case "mushring": {
          // a ring of mushrooms, pale by day; by night their spots glow
          const rnd = mulberry32(pr.seed || 41),
            n = 13;
          for (let k = 0; k < n; k++) {
            const a = (k / n) * 6.283 + rnd() * 0.3,
              mx = x + Math.cos(a) * pr.r,
              mz = z + Math.sin(a) * pr.r,
              gy = hAt(mx, mz),
              sh = 0.12 + rnd() * 0.16;
            mb.prism(
              [mx, gy - 0.02, mz],
              [mx, gy + sh, mz],
              0.025,
              0.02,
              4,
              rows.rag,
              PAT.NONE,
            );
            mb.cone(
              [mx, gy + sh - 0.02, mz],
              gy + sh + 0.07 + rnd() * 0.04,
              0.07 + rnd() * 0.05,
              6,
              rows.violet,
              PAT.LAMP,
              { row2: rows.shroom },
            );
          }
          break;
        }
        // ---------- the wonders ----------
        case "crater": {
          // scorched ground in a bowl of earth the star threw up round itself; streaks of burning flung out
          const R0 = pr.r,
            n = 26,
            rnd = mulberry32(pr.seed || 5);
          const G = (a, r, up = 0) => {
            const px = x + Math.cos(a) * r,
              pz = z + Math.sin(a) * r;
            return [px, hAt(px, pz) + up, pz];
          };
          const crest = (a) =>
            0.95 + 0.22 * Math.sin(a * 3 + pr.r) + 0.12 * Math.sin(a * 7 + 1.3);
          const rings = [0.1, 0.45, 0.84];
          for (let k = 0; k < n; k++) {
            const a0 = (k / n) * 6.283,
              a1 = ((k + 1) / n) * 6.283;
            for (let j = 0; j < rings.length - 1; j++)
              mb.quad(
                G(a0, R0 * rings[j + 1], 0.04),
                G(a1, R0 * rings[j + 1], 0.04),
                G(a1, R0 * rings[j], 0.04),
                G(a0, R0 * rings[j], 0.04),
                rows.scorch,
                PAT.HIDE,
              );
            // the ring of earth: up from the scorched floor to a ragged crest, and down again outside
            mb.quad(
              G(a0, R0 * 0.84, 0.04),
              G(a1, R0 * 0.84, 0.04),
              G(a1, R0, crest(a1)),
              G(a0, R0, crest(a0)),
              rows.scorch,
              PAT.HIDE,
              null,
              { lv: -0.25 },
            );
            mb.quad(
              G(a0, R0, crest(a0)),
              G(a1, R0, crest(a1)),
              G(a1, R0 + 1.5, crest(a1) * 0.45),
              G(a0, R0 + 1.5, crest(a0) * 0.45),
              rows.soil,
              PAT.HIDE,
            );
            mb.quad(
              G(a0, R0 + 1.5, crest(a0) * 0.45),
              G(a1, R0 + 1.5, crest(a1) * 0.45),
              G(a1, R0 + 3.8, 0.02),
              G(a0, R0 + 3.8, 0.02),
              rows.soil,
              PAT.HIDE,
            );
          }
          // (low humps, one stepping onto the next, so you walk up over the ring rather than through it)
          for (let k = 0; k < 18; k++) {
            const a = (k / 18) * 6.283,
              qi = G(a, R0 - 1.2),
              qc = G(a, R0),
              qo = G(a, R0 + 1.6);
            col.push(
              qi[0],
              qi[2],
              1.5,
              base + qi[1] - 0.02,
              base + qi[1] + 0.48,
              2,
              qo[0],
              qo[2],
              1.8,
              base + qo[1] - 0.02,
              base + qo[1] + 0.48,
              2,
              qc[0],
              qc[2],
              1.5,
              base + qc[1] + 0.44,
              base + qc[1] + 0.94,
              2,
            );
          }
          // what it flung out as it came down: dark streaks across the ground, fused glass, sparks of its light
          for (let k = 0; k < 13; k++) {
            const a = rnd() * 6.283,
              r0 = R0 + 3.4,
              r1 = R0 + 6 + rnd() * 8,
              w = 0.3 + rnd() * 0.5,
              ca = Math.cos(a),
              sa = Math.sin(a),
              nx = -sa * w,
              nz = ca * w;
            const P = (r, s2) => {
              const px = x + ca * r + nx * s2,
                pz = z + sa * r + nz * s2;
              return [px, hAt(px, pz) + 0.03, pz];
            };
            mb.quad(
              P(r0, -1),
              P(r0, 1),
              P(r1, 0.15),
              P(r1, -0.15),
              rows.scorch,
              PAT.HIDE,
            );
          }
          for (let k = 0; k < 14; k++) {
            const a = rnd() * 6.283,
              r = 3.2 + rnd() * (R0 + 4),
              s2 = 0.14 + rnd() * 0.26,
              q = G(a, r);
            lumpInto(
              mb,
              q[0],
              q[1] - 0.06,
              q[2],
              s2,
              s2 * 0.6,
              s2 * 0.8,
              rows.fused,
              rows.fused,
              (pr.seed || 5) + k,
              a,
            );
          }
          for (let k = 0; k < 8; k++) {
            const a = rnd() * 6.283,
              r = 3 + rnd() * (R0 - 3.5),
              q = G(a, r, 0.02),
              e = rnd() * 6.283;
            mb.prism(
              q,
              [
                q[0] + Math.cos(e) * 0.12,
                q[1] + 0.22 + rnd() * 0.2,
                q[2] + Math.sin(e) * 0.12,
              ],
              0.06,
              0.01,
              4,
              rows.star,
              PAT.FLAME,
            );
          }
          break;
        }
        case "starstone": {
          // black, smooth, heavy; crystals of the star's own light growing out of its cracks
          const s2 = pr.s,
            rnd = mulberry32(pr.seed || 9);
          lumpInto(
            mb,
            x,
            y0 - 0.55 * s2,
            z,
            1.5 * s2,
            0.78 * s2,
            1.15 * s2,
            rows.starRock,
            rows.starRock,
            pr.seed || 9,
            pr.rot || 0,
          );
          lumpInto(
            mb,
            x + 1.1 * s2 * Math.cos(pr.rot || 0),
            y0 - 0.4,
            z + 1.1 * s2 * Math.sin(pr.rot || 0),
            0.6 * s2,
            0.45 * s2,
            0.55 * s2,
            rows.starRock,
            rows.starRock,
            (pr.seed || 9) + 3,
            1.3,
          );
          const cy = y0 + 0.2 * s2;
          for (let k = 0; k < 9; k++) {
            const a = rnd() * 6.283,
              e = 0.25 + rnd() * 1.0,
              dx = Math.cos(a) * Math.cos(e),
              dy = Math.sin(e),
              dz = Math.sin(a) * Math.cos(e);
            const b0 = [
                x + dx * 1.2 * s2 * 0.82,
                cy + dy * 0.9 * s2 * 0.82,
                z + dz * 1.0 * s2 * 0.82,
              ],
              L = (0.45 + rnd() * 0.75) * s2;
            mb.prism(
              b0,
              [b0[0] + dx * L, b0[1] + dy * L, b0[2] + dz * L],
              (0.09 + rnd() * 0.07) * s2,
              0.01,
              5,
              rows.star,
              PAT.FLAME,
            );
          }
          // and a seam of it across the top
          for (let k = 0; k < 4; k++) {
            const a = (pr.rot || 0) + k * 0.5 - 0.7;
            mb.prism(
              [
                x + Math.cos(a) * 0.9 * s2,
                cy + 0.62 * s2,
                z + Math.sin(a) * 0.9 * s2,
              ],
              [
                x + Math.cos(a + 0.5) * 0.85 * s2,
                cy + 0.66 * s2,
                z + Math.sin(a + 0.5) * 0.85 * s2,
              ],
              0.06,
              0.06,
              4,
              rows.star,
              PAT.FLAME,
            );
          }
          col.push(x, z, 1.45 * s2, base + y0 - 0.5, base + y0 + 0.95 * s2, 2);
          break;
        }
        case "felled": {
          // the forest it came down in, laid flat all round: trunks pointing away from where it struck,
          // their roots torn up at the near end
          const rnd = mulberry32(pr.seed || 23);
          for (let k = 0; k < pr.n; k++) {
            const a = ((k + rnd() * 0.8) / pr.n) * 6.283,
              ca = Math.cos(a),
              sa = Math.sin(a);
            const rs = pr.r0 + rnd() * (pr.r1 - pr.r0) * 0.75,
              L = 4.5 + rnd() * 5,
              tr = 0.16 + rnd() * 0.16;
            const p0 = [x + ca * rs, 0, z + sa * rs],
              p1 = [x + ca * (rs + L), 0, z + sa * (rs + L)];
            p0[1] = hAt(p0[0], p0[2]) + tr * 1.6;
            p1[1] = hAt(p1[0], p1[2]) + tr * 0.6;
            mb.prism(
              p0,
              p1,
              tr,
              tr * 0.55,
              5,
              rnd() < 0.5 ? rows.wood : rows.woodDark,
              PAT.BARK,
              null,
              rnd() * 3,
            );
            // the root plate, torn up on end, earth still in it
            lumpInto(
              mb,
              p0[0] - ca * 0.15,
              p0[1] - tr * 2.2,
              p0[2] - sa * 0.15,
              0.22,
              0.55 + tr,
              0.75 + tr * 1.5,
              rows.soil,
              rows.soil,
              (pr.seed || 23) + k,
              a,
            );
            // a broken branch or two, still on it
            for (let q = 0; q < 2; q++) {
              const t = 0.4 + rnd() * 0.5,
                bp = [
                  p0[0] + (p1[0] - p0[0]) * t,
                  p0[1] + (p1[1] - p0[1]) * t,
                  p0[2] + (p1[2] - p0[2]) * t,
                ],
                sd = rnd() < 0.5 ? -1 : 1;
              mb.prism(
                bp,
                [
                  bp[0] - sa * sd * 0.9 + ca * 0.6,
                  bp[1] + 0.25 + rnd() * 0.4,
                  bp[2] + ca * sd * 0.9 + sa * 0.6,
                ],
                tr * 0.4,
                0.02,
                4,
                rows.woodDark,
                PAT.BARK,
              );
            }
          }
          break;
        }
        case "stonetree": {
          // a giant of a tree, dead and turned to stone where it stood: banded trunk, bare stone branches
          const bands = [
            [
              rows.petGrey,
              rows.petRed,
              rows.petGrey,
              rows.petAmber,
              rows.petDark,
            ],
            [
              rows.petRed,
              rows.petGrey,
              rows.petAmber,
              rows.petGrey,
              rows.petRed,
            ],
            [
              rows.petAmber,
              rows.petDark,
              rows.petGrey,
              rows.petRed,
              rows.petGrey,
            ],
          ][pr.tint || 0];
          const rnd = mulberry32(pr.seed || 29),
            H = pr.h,
            r = pr.r;
          const nB = Math.round(H / 1.2);
          for (let k = 0; k < nB; k++) {
            const t0 = k / nB,
              t1 = (k + 1) / nB;
            mb.prism(
              [x, y0 - 0.4 + (H + 0.4) * t0, z],
              [x, y0 - 0.4 + (H + 0.4) * t1, z],
              r * (1 - 0.45 * t0),
              r * (1 - 0.45 * t1),
              8,
              bands[k % bands.length],
              PAT.BARK,
              null,
              t0 * H,
              k === nB - 1,
            );
          }
          // the roots, like buttresses, out over the ground and into it
          const fins = [];
          for (let k = 0; k < 7; k++) {
            const a = (k / 7) * 6.283 + rnd() * 0.5,
              L = r * (2.3 + rnd() * 1.3);
            fins.push(
              rootFinInto(
                mb,
                x,
                z,
                a,
                r,
                L,
                r * (1.2 + rnd() * 0.6),
                r * 0.75,
                hAt,
                bands[k % 2],
                PAT.BARK,
              ),
            );
          }
          this.siteRoots(c, x, z, fins);
          // branches, forking, and broken off short
          const limb = (p0, dir, L, r0, depth, k0) => {
            const p1 = [
              p0[0] + dir[0] * L,
              p0[1] + dir[1] * L,
              p0[2] + dir[2] * L,
            ];
            mb.prism(
              p0,
              p1,
              r0,
              r0 * 0.6,
              6,
              bands[(k0 + depth) % bands.length],
              PAT.BARK,
            );
            if (depth >= 2) return;
            for (let q = 0; q < 2; q++) {
              const a =
                  Math.atan2(dir[2], dir[0]) +
                  (q ? 0.55 : -0.55) +
                  (rnd() - 0.5) * 0.4,
                e =
                  Math.asin(Math.max(-1, Math.min(1, dir[1]))) +
                  0.15 +
                  rnd() * 0.25;
              limb(
                p1,
                [
                  Math.cos(a) * Math.cos(e),
                  Math.sin(e),
                  Math.sin(a) * Math.cos(e),
                ],
                L * (0.55 + rnd() * 0.15),
                r0 * 0.6,
                depth + 1,
                k0 + q,
              );
            }
          };
          for (let k = 0; k < pr.n; k++) {
            const a = (pr.rot || 0) + (k / pr.n) * 6.283 + (rnd() - 0.5) * 0.6,
              e = 0.45 + rnd() * 0.45,
              hy = H * (0.55 + 0.4 * rnd());
            const rr = r * (1 - (0.45 * hy) / H) * 0.8;
            limb(
              [x + Math.cos(a) * rr * 0.5, y0 + hy, z + Math.sin(a) * rr * 0.5],
              [
                Math.cos(a) * Math.cos(e),
                Math.sin(e),
                Math.sin(a) * Math.cos(e),
              ],
              2.6 + rnd() * 2.4,
              r * 0.34,
              0,
              k,
            );
          }
          col.push(x, z, r + 0.04, base + y0 - 0.4, base + y0 + H, 1);
          break;
        }
        case "giantbones": {
          // its own frame: w along the spine (the skull at +w), u across it
          const L = pr.l,
            W = pr.w,
            H = pr.h,
            rnd = mulberry32(pr.seed || 11);
          const gAt = (u, w) => {
            const q = at(u, 0, w);
            return hAt(q[0], q[2]);
          };
          const P = (u, y, w) => at(u, y, w);
          // the spine: vertebrae along the ground
          const nv = Math.round(L / 1.25);
          for (let k = 0; k <= nv; k++) {
            const w = -L / 2 + (k * L) / nv,
              g = gAt(0, w),
              q = P(0, 0, w);
            lumpInto(
              mb,
              q[0],
              g - 0.35,
              q[2],
              0.55,
              0.42,
              0.5,
              rows.bone,
              rows.boneDark,
              (pr.seed || 11) + k,
              w,
            );
            mb.prism(
              P(0, g + 0.3, w),
              P(0, g + 1.0 + 0.3 * Math.sin((k / nv) * Math.PI), w - 0.3),
              0.16,
              0.05,
              4,
              rows.bone,
              PAT.NONE,
            );
          }
          // the ribs: rising out of the ground either side, curving in over the spine, never quite meeting
          const nr = Math.max(5, Math.floor((L - 6) / 1.7));
          for (let k = 0; k < nr; k++) {
            const t = (k + 0.5) / nr,
              w = -L / 2 + 3 + t * (L - 7),
              hk = H * Math.pow(Math.sin(Math.PI * (0.12 + 0.8 * t)), 0.7),
              wk = W * (0.55 + 0.45 * Math.sin(Math.PI * t)) + 0.8;
            for (const sd of [-1, 1]) {
              const broken = rnd() < 0.18,
                g0 = gAt(sd * wk, w);
              const B = (s) => {
                const a = (1 - s) * (1 - s),
                  b = 2 * (1 - s) * s,
                  c2 = s * s;
                return P(
                  sd * (a * wk + b * wk * 1.28 + c2 * wk * 0.3),
                  a * (g0 - 0.6) + b * (g0 + hk * 1.1) + c2 * (g0 + hk * 0.9),
                  w + c2 * 0.7,
                );
              };
              const nS = broken ? 4 : 7;
              for (let q = 0; q < nS; q++)
                mb.prism(
                  B(q / 7),
                  B((q + 1) / 7),
                  0.3 - q * 0.028,
                  0.3 - (q + 1) * 0.028,
                  5,
                  rows.bone,
                  PAT.NONE,
                );
              const f = P(sd * wk, 0, w);
              col.push(f[0], f[2], 0.34, base + g0 - 0.6, 1e9, 1);
            }
          }
          // the skull, at the front end: a vault of bone, holes for eyes, a long jaw full of teeth
          const sw = L / 2 + 2.6,
            g = gAt(0, sw),
            sk = P(0, 0, sw);
          lumpInto(
            mb,
            sk[0],
            g - 0.3,
            sk[2],
            1.7,
            1.2,
            2.5,
            rows.bone,
            rows.boneDark,
            (pr.seed || 11) + 77,
            pr.rot || 0,
          );
          const sn2 = P(0, 0, sw + 2.4);
          lumpInto(
            mb,
            sn2[0],
            g - 0.3,
            sn2[2],
            1.05,
            0.72,
            1.5,
            rows.bone,
            rows.boneDark,
            (pr.seed || 11) + 78,
            pr.rot || 0,
          );
          for (const sd of [-1, 1]) {
            const e = P(sd * 1.32, 0, sw + 1.2);
            lumpInto(
              mb,
              e[0],
              g + 0.82,
              e[2],
              0.46,
              0.34,
              0.5,
              rows.char,
              rows.char,
              (pr.seed || 11) + (sd > 0 ? 80 : 81),
              pr.rot || 0,
            );
            // the jaw, fallen a little apart, and its teeth
            mb.prism(
              P(sd * 1.0, g + 0.15, sw - 0.6),
              P(sd * 0.55, g + 0.1, sw + 4.6),
              0.3,
              0.22,
              5,
              rows.boneDark,
              PAT.NONE,
            );
            for (let q = 0; q < 6; q++) {
              const tw = sw + 1.4 + q * 0.55,
                tp = P(sd * (0.95 - q * 0.07), g + 0.3, tw);
              mb.cone(
                tp,
                g + 0.75 + (q === 1 ? 0.35 : 0),
                0.11,
                4,
                rows.bone,
                PAT.NONE,
              );
            }
            if (pr.horns) {
              const hb = (s) => {
                const a = (1 - s) * (1 - s),
                  b = 2 * (1 - s) * s,
                  c2 = s * s;
                return P(
                  sd * (a * 1.3 + b * 2.9 + c2 * 2.3),
                  g + a * 1.8 + b * 3.6 + c2 * 5.4,
                  sw + a * 0.2 - b * 2.6 - c2 * 4.8,
                );
              };
              for (let q = 0; q < 7; q++)
                mb.prism(
                  hb(q / 7),
                  hb((q + 1) / 7),
                  0.48 - q * 0.062,
                  0.48 - (q + 1) * 0.062,
                  6,
                  rows.boneDark,
                  PAT.BARK,
                );
            }
          }
          col.push(sk[0], sk[2], 2.1, base + g - 0.3, base + g + 2.2, 2);
          col.push(sn2[0], sn2[2], 1.2, base + g - 0.3, base + g + 1.3, 2);
          // great bones lying about, dragged off long ago by whatever ate it
          for (let k = 0; k < 4; k++) {
            const a = rnd() * 6.283,
              r = 6 + rnd() * 8,
              cx = x + Math.cos(a) * r,
              cz = z + Math.sin(a) * r,
              ang = rnd() * 6.283,
              l2 = 2.2 + rnd() * 2.6;
            const e0 = [
                cx - (Math.cos(ang) * l2) / 2,
                0,
                cz - (Math.sin(ang) * l2) / 2,
              ],
              e1 = [
                cx + (Math.cos(ang) * l2) / 2,
                0,
                cz + (Math.sin(ang) * l2) / 2,
              ];
            e0[1] = hAt(e0[0], e0[2]) + 0.12;
            e1[1] = hAt(e1[0], e1[2]) + 0.12;
            mb.prism(e0, e1, 0.2, 0.2, 5, rows.bone, PAT.NONE);
            lumpInto(
              mb,
              e0[0],
              e0[1] - 0.2,
              e0[2],
              0.32,
              0.22,
              0.3,
              rows.bone,
              rows.boneDark,
              (pr.seed || 11) + 90 + k,
              ang,
            );
            lumpInto(
              mb,
              e1[0],
              e1[1] - 0.2,
              e1[2],
              0.32,
              0.22,
              0.3,
              rows.bone,
              rows.boneDark,
              (pr.seed || 11) + 95 + k,
              ang,
            );
          }
          break;
        }
        case "sinter": {
          // a crust of white and yellow stone over the hot ground, in low terraces, rust-red where it runs wet
          const R0 = pr.r,
            n = 24,
            J = 6,
            rnd = mulberry32(pr.seed || 13);
          const wob = [];
          for (let k = 0; k <= n; k++) wob.push(0.85 + 0.25 * rnd());
          wob[n] = wob[0];
          const G = (k, j) => {
            const a = (k / n) * 6.283,
              r = ((R0 * j) / J) * (j === J ? wob[k] : 1),
              px = x + Math.cos(a) * r,
              pz = z + Math.sin(a) * r;
            return [px, hAt(px, pz) + 0.03 + (1 - j / J) * 0.16, pz];
          };
          for (let j = 0; j < J; j++) {
            const row = j < 2 ? rows.orange : j < 4 ? rows.ochre : rows.sinter;
            for (let k = 0; k < n; k++)
              mb.quad(
                G(k, j + 1),
                G(k + 1, j + 1),
                G(k + 1, j),
                G(k, j),
                (j + k) % 5 === 0 && j > 1 ? rows.ochre : row,
                PAT.HIDE,
              );
          }
          break;
        }
        case "vent": {
          // a little mound of crust with a pool boiling in its top
          const r = pr.r,
            sides = 9,
            top = y0 + 0.26;
          mb.prism(
            [x, y0 - 0.15, z],
            [x, top, z],
            r + 0.55,
            r + 0.06,
            sides,
            rows.sinter,
            PAT.HIDE,
          );
          for (let k = 0; k < sides; k++) {
            const a0 = (k / sides) * 6.283,
              a1 = ((k + 1) / sides) * 6.283;
            mb.tri(
              [x, top - 0.02, z],
              [x + Math.cos(a1) * r, top - 0.02, z + Math.sin(a1) * r],
              [x + Math.cos(a0) * r, top - 0.02, z + Math.sin(a0) * r],
              rows.hot,
              PAT.POOL,
            );
          }
          col.push(x, z, r + 0.4, base + y0 - 0.15, base + top, 2);
          break;
        }
        case "geyser": {
          // the big vent: a wide low cone of crust, a pool in its top, and the dark throat it roars out of
          const top = y0 + 0.42,
            sides = 12;
          mb.prism(
            [x, y0 - 0.2, z],
            [x, top, z],
            2.5,
            1.0,
            sides,
            rows.sinter,
            PAT.HIDE,
          );
          for (let k = 0; k < sides; k++) {
            const a0 = (k / sides) * 6.283,
              a1 = ((k + 1) / sides) * 6.283;
            mb.tri(
              [x, top - 0.02, z],
              [x + Math.cos(a1) * 0.98, top - 0.02, z + Math.sin(a1) * 0.98],
              [x + Math.cos(a0) * 0.98, top - 0.02, z + Math.sin(a0) * 0.98],
              rows.hot,
              PAT.POOL,
            );
            mb.tri(
              [x, top - 0.01, z],
              [x + Math.cos(a1) * 0.32, top - 0.01, z + Math.sin(a1) * 0.32],
              [x + Math.cos(a0) * 0.32, top - 0.01, z + Math.sin(a0) * 0.32],
              rows.char,
              PAT.NONE,
            );
          }
          // (low enough to walk onto: which is the danger)
          col.push(x, z, 2.4, base + y0 - 0.05, base + top, 2);
          const pl = (c.v.plan && c.v.plan.geyser) || {
            r: 2.3,
            period: 90,
            dur: 9,
            phase: 0,
          };
          c.v.geyser = {
            x,
            z,
            y: top,
            r: pl.r,
            period: pl.period,
            dur: pl.dur,
            phase: pl.phase,
            max: 17 + (pr.seed % 7),
            H: 0,
            mesh: this.geyserColumn(),
          };
          break;
        }
        case "stonetrunk": {
          // stone in bands, the way stone lies, but in the shape of a tree: its bark, its knots, its roots
          const bands = [
            [
              rows.petGrey,
              rows.petRed,
              rows.petGrey,
              rows.petAmber,
              rows.petDark,
            ],
            [
              rows.petRed,
              rows.petGrey,
              rows.petAmber,
              rows.petGrey,
              rows.petRed,
            ],
            [
              rows.petAmber,
              rows.petDark,
              rows.petGrey,
              rows.petRed,
              rows.petGrey,
            ],
          ][pr.tint || 0];
          const rnd = mulberry32(pr.seed || 17),
            ca = Math.cos(pr.rot || 0),
            sa = Math.sin(pr.rot || 0);
          if (pr.fallen) {
            // lying where it fell, cracked into rounds, half sunk in the ground
            let s0 = -pr.h / 2,
              k = 0;
            while (s0 < pr.h / 2 - 0.4) {
              const s1 = Math.min(pr.h / 2, s0 + 0.9 + rnd() * 1.6);
              const p0 = [x + ca * s0, 0, z + sa * s0],
                p1 = [x + ca * s1, 0, z + sa * s1];
              p0[1] = hAt(p0[0], p0[2]) + pr.r * 0.55;
              p1[1] = hAt(p1[0], p1[2]) + pr.r * 0.55;
              mb.prism(
                p0,
                p1,
                pr.r,
                pr.r * 0.97,
                7,
                bands[k++ % bands.length],
                PAT.BARK,
                null,
                rnd(),
                true,
              );
              const m2 = [
                (p0[0] + p1[0]) / 2,
                (p0[1] + p1[1]) / 2,
                (p0[2] + p1[2]) / 2,
              ];
              col.push(
                m2[0],
                m2[2],
                pr.r * 1.05,
                base + m2[1] - pr.r * 1.2,
                base + m2[1] + pr.r,
                2,
              );
              s0 = s1 + 0.12 + rnd() * 0.25;
            }
            break;
          }
          // standing: broken off ragged at the top
          const lean = pr.lean || 0,
            lx = ca * Math.sin(lean),
            lz = sa * Math.sin(lean);
          const nB = Math.max(2, Math.round(pr.h / 1.1));
          const axis = (t) => [
            x + lx * pr.h * t,
            y0 - 0.4 + (pr.h + 0.4) * t,
            z + lz * pr.h * t,
          ];
          for (let k = 0; k < nB; k++) {
            const t0 = k / nB,
              t1 = (k + 1) / nB;
            mb.prism(
              axis(t0),
              axis(t1),
              pr.r * (1 - 0.2 * t0),
              pr.r * (1 - 0.2 * t1),
              7,
              bands[k % bands.length],
              PAT.BARK,
              null,
              t0 * pr.h,
              k === nB - 1,
            );
          }
          const tip = axis(1),
            top = bands[(nB - 1) % bands.length];
          for (let k = 0; k < 4; k++) {
            const a = (k / 4) * 6.283 + rnd(),
              rr = pr.r * 0.55,
              b0 = [
                tip[0] + Math.cos(a) * rr,
                tip[1] - 0.05,
                tip[2] + Math.sin(a) * rr,
              ];
            mb.prism(
              b0,
              [
                b0[0] + Math.cos(a) * 0.05,
                b0[1] + 0.2 + rnd() * pr.r * 0.9,
                b0[2] + Math.sin(a) * 0.05,
              ],
              pr.r * 0.28,
              0.02,
              4,
              top,
              PAT.BARK,
            );
          }
          // the old giants keep their roots
          if (pr.r > 0.8) {
            const fins = [];
            for (let k = 0; k < 6; k++) {
              const a = (k / 6) * 6.283 + rnd() * 0.5,
                L = pr.r * (2.1 + rnd() * 1.3);
              fins.push(
                rootFinInto(
                  mb,
                  x,
                  z,
                  a,
                  pr.r,
                  L,
                  pr.r * (1.1 + rnd() * 0.5),
                  pr.r * 0.7,
                  hAt,
                  bands[k % 2],
                  PAT.BARK,
                ),
              );
            }
            this.siteRoots(c, x, z, fins);
          }
          col.push(x, z, pr.r + 0.04, base + y0 - 0.4, base + y0 + pr.h, 1);
          break;
        }
        case "bigtree":
          this.bigTreeInto(pr, y0, c);
          break;
        case "ribbons": {
          const cols = [rows.red, rows.gold, rows.blue, rows.rag];
          for (let k = 0; k < 9; k++) {
            const a = (k / 9) * 6.283 + (pr.rot || 0),
              r = 1.4 + (k % 3) * 0.25,
              y = y0 + 2.2 + (k % 4) * 0.35;
            const top = [x + Math.cos(a) * r, y, z + Math.sin(a) * r],
              tx = -Math.sin(a) * 0.06,
              tz = Math.cos(a) * 0.06;
            mb.quad(
              [top[0] - tx, top[1] - 0.7, top[2] - tz],
              [top[0] + tx, top[1] - 0.7, top[2] + tz],
              [top[0] + tx, top[1], top[2] + tz],
              [top[0] - tx, top[1], top[2] - tz],
              cols[k % 4],
              PAT.CLOTH,
            );
            mb.quad(
              [top[0] + tx, top[1] - 0.7, top[2] + tz],
              [top[0] - tx, top[1] - 0.7, top[2] - tz],
              [top[0] - tx, top[1], top[2] - tz],
              [top[0] + tx, top[1], top[2] + tz],
              cols[k % 4],
              PAT.CLOTH,
            );
          }
          break;
        }
        case "blade": {
          const P = obox(
            0,
            0,
            y0 - 0.3,
            0.035,
            pr.h + 0.3,
            0.085,
            pr.rot,
            pr.lean || 0,
            0.7,
            rows.rust,
            PAT.NONE,
          );
          if (pr.shield) {
            const sc2 = P(0, 0.5, 0.2);
            mb.prism(
              [sc2[0], sc2[1] - 0.05, sc2[2]],
              [sc2[0] + 0.06, sc2[1] + 0.05, sc2[2] + 0.1],
              0.38,
              0.38,
              8,
              rows.rust,
              PAT.RINGS,
              null,
              0,
              true,
            );
          }
          const g0 = P(-0.22, pr.h + 0.3 - 0.02, 0),
            g1 = P(0.22, pr.h + 0.3 - 0.02, 0);
          mb.prism(g0, g1, 0.03, 0.03, 4, rows.rust, PAT.NONE);
          mb.prism(
            P(0, pr.h + 0.28, 0),
            P(0, pr.h + 0.5, 0),
            0.03,
            0.03,
            4,
            rows.woodDark,
            PAT.NONE,
          );
          break;
        }
        case "helm":
          mb.cone(
            [x, y0 - 0.02, z],
            y0 + 0.2,
            0.17,
            6,
            rows.rust,
            PAT.NONE,
            null,
            0,
            0,
            pr.rot,
          );
          break;
        case "banner": {
          const tip = at(
            Math.sin(pr.lean) * pr.h * 0.3,
            y0 + pr.h,
            Math.sin(pr.lean) * pr.h * 0.2,
          );
          // (a people's own banner is in their colour)
          const flag =
            pr.people && this.pvKitRows ? this.pvKitRows(c.v).banner : rows.red;
          mb.prism(
            [x, y0 - 0.3, z],
            tip,
            0.05,
            0.04,
            4,
            rows.woodDark,
            PAT.BARK,
          );
          mb.quad(
            [tip[0], tip[1] - 0.2, tip[2]],
            [tip[0] + 0.9, tip[1] - 0.35, tip[2] + 0.1],
            [tip[0] + 0.7, tip[1] - 1.3, tip[2] + 0.2],
            [tip[0] + 0.05, tip[1] - 1.1, tip[2]],
            flag,
            PAT.CLOTH,
          );
          mb.quad(
            [tip[0] + 0.9, tip[1] - 0.35, tip[2] + 0.1],
            [tip[0], tip[1] - 0.2, tip[2]],
            [tip[0] + 0.05, tip[1] - 1.1, tip[2]],
            [tip[0] + 0.7, tip[1] - 1.3, tip[2] + 0.2],
            flag,
            PAT.CLOTH,
          );
          if (pr.people) post(0.1);
          break;
        }
        // the newer places' pieces (placesview.js)
        default:
          if (this.morePropInto)
            this.morePropInto(mb, pr, y0, c, { at, obox, post, x, z, cs, sn });
      }
    },
    // roots like buttresses, for what you bump into (they follow the ground where they are: see groundview's collide)
    siteRoots(c, x, z, fins) {
      let R = 0;
      for (const f of fins) R = Math.max(R, f.reach);
      (c.v.roots || (c.v.roots = [])).push({
        x,
        z,
        s: 1,
        fins,
        R: R + 0.7,
        gx: 0,
        gz: 0,
        sh: 0,
        off: 0,
      });
    },
    // an ancient tree of the land's own kind, many times its usual size
    bigTreeInto(pr, y0, c) {
      const layers = this.flora.table[c.s.biome] || this.flora.table[5] || [];
      const lay = layers.find((l) => l.layer === "tree");
      let spId = -1;
      if (lay)
        for (const e of lay.list) {
          const f = this.flora.species[e.sp].g.form;
          if (f === "broadleaf" || f === "umbrella" || f === "conifer") {
            spId = e.sp;
            break;
          }
        }
      if (spId < 0) return;
      const snow = c.s.T < -2;
      // (drawn rounder than its kind usually is: it is many times the size)
      const proto = this.bigProto
        ? this.bigProto(spId, Math.floor(pr.v * 3), snow)
        : this.proto(spId, Math.floor(pr.v * 3), snow);
      if (!proto) return;
      // the slope it stands on, so its foot follows the ground
      const gE = (c.hAt(pr.x + 1.5, pr.z) - c.hAt(pr.x - 1.5, pr.z)) / 3,
        gS = (c.hAt(pr.x, pr.z + 1.5) - c.hAt(pr.x, pr.z - 1.5)) / 3,
        nl = Math.hypot(gE, 1, gS);
      const entry = {
        proto,
        P: [pr.x, y0 - 0.3, pr.z],
        rot: pr.rot,
        sc: pr.s,
        N: [-gE / nl, 1 / nl, -gS / nl],
        spId,
        snow,
      };
      const mesh = this.mergeSolids([entry]);
      const cards = [];
      this.treeCards(entry, entry.P, cards);
      // an old crown is a thick one: every clump gets neighbours
      const n0 = cards.length / 14,
        rnd = mulberry32(hashInt((pr.x * 100) | 0, (pr.z * 100) | 0, 71));
      let cx = 0,
        cy = 0,
        cz = 0;
      for (let q = 0; q < n0; q++) {
        cx += cards[q * 14];
        cy += cards[q * 14 + 1];
        cz += cards[q * 14 + 2];
      }
      cx /= n0 || 1;
      cy /= n0 || 1;
      cz /= n0 || 1;
      for (let q = 0; q < n0; q++)
        for (let k = 0; k < 4; k++) {
          const c2 = cards.slice(q * 14, q * 14 + 14);
          const dx = c2[0] - cx,
            dz = c2[2] - cz,
            sp = c2[7] * 0.6;
          c2[0] += (rnd() - 0.5) * sp * 2 - dx * 0.25 * rnd();
          c2[1] += (rnd() - 0.6) * sp;
          c2[2] += (rnd() - 0.5) * sp * 2 - dz * 0.25 * rnd();
          c2[7] *= 0.8 + rnd() * 0.3;
          c2[8] *= 0.8 + rnd() * 0.3;
          cards.push(...c2);
        }
      void cy;
      // roots like buttresses where the trunk meets the ground: out over it and down into it, wherever it lies
      const tr = Math.max(0.5, ((proto.trunkR || 0.2) / 1.1) * pr.s),
        mb = new MeshBuf(),
        bark = this.spRow[spId] + 1,
        fins = [];
      for (let k = 0; k < 7; k++) {
        const a = (k / 7) * 6.283 + rnd() * 0.5,
          L = tr * (2.4 + rnd() * 1.4);
        fins.push(
          rootFinInto(
            mb,
            pr.x,
            pr.z,
            a,
            tr,
            L,
            tr * (1.4 + rnd() * 0.8),
            tr * 0.8,
            c.hAt,
            bark,
            PAT.BARK,
          ),
        );
      }
      this.siteRoots(c, pr.x, pr.z, fins);
      this.syncRamps();
      c.extra.push(this.meshOf(mb.finish(), this.solidMat));
      c.extra.push(mesh);
      if (cards.length) c.extra.push(this.makeCards(cards, { mesh }));
      c.col.push(
        pr.x,
        pr.z,
        Math.max(0.6, (proto.trunkR || 0.2) * pr.s),
        c.base + y0 - 0.3,
        1e9,
        1,
      );
    },

    // ---------- far off: smoke by day, lights by night ----------
    makeBeacons() {
      const T = this.T;
      const geo = new T.InstancedBufferGeometry();
      geo.setAttribute(
        "position",
        new T.Float32BufferAttribute(
          [-0.5, 0, 0, 0.5, 0, 0, 0.5, 1, 0, -0.5, 1, 0],
          3,
        ),
      );
      geo.setIndex([0, 1, 2, 0, 2, 3]);
      this.bPos = new Float32Array(BEACON_MAX * 3);
      this.bInfo = new Float32Array(BEACON_MAX * 4);
      geo.setAttribute("iPos", new T.InstancedBufferAttribute(this.bPos, 3));
      geo.setAttribute("iInfo", new T.InstancedBufferAttribute(this.bInfo, 4));
      geo.instanceCount = 0;
      this.beaconU = {
        ...this.uniforms,
        uTanHalf: { value: 0.7 },
        uViewH: { value: 240 },
      };
      const mat = new T.ShaderMaterial({
        uniforms: this.beaconU,
        vertexShader: BEACON_VS,
        fragmentShader: BEACON_FS,
        depthWrite: false,
        side: T.DoubleSide,
      });
      this.beaconMesh = new T.Mesh(geo, mat);
      this.beaconMesh.frustumCulled = false;
      this.beaconMesh.renderOrder = 5;
      this.scene.add(this.beaconMesh);
    },
    // a place's lights and plumes, where they are on the planet (computed once)
    siteBeacons(s) {
      if (s._bcn) return s._bcn;
      const plan = sitePlan(this.story, s);
      const out = [];
      // (no smoke and no lamps where nobody lives any more)
      if (plan.beacons.length && !(this.siteLost && this.siteLost(s.id))) {
        const F = frameAt(s.dir),
          base = Math.max(
            -0.2,
            this.ground.height(s.dir[0], s.dir[1], s.dir[2], 4),
          );
        for (const b of plan.beacons)
          out.push({
            dir: stepOn(s.dir, F, b.x, -b.z, this.R),
            alt: base + (b.b != null ? 0.6 : 0) + b.y,
            kind: b.kind,
            seed: b.keep
              ? 0.999
              : (hashInt(s.seed, out.length, 3) % 1000) / 1000,
          });
      }
      s._bcn = out;
      return out;
    },
    townBeacons(s) {
      if (s._bcn) return s._bcn;
      const plan = townPlan(this.story, s),
        F = frameAt(s.dir),
        st = plan.style;
      const base = Math.max(
        0.3,
        this.ground.height(s.dir[0], s.dir[1], s.dir[2], 4),
      );
      const out = [];
      // (the great city's many windows: only some of them, or they would crowd out every other light)
      const thin = plan.city ? 4 : 1;
      plan.buildings.forEach((b, i) => {
        const cs = Math.cos(b.rot),
          sn = Math.sin(b.rot);
        if (
          b.empty ||
          b.light === "none" ||
          (thin > 1 && i % thin && b.kind === "house")
        )
          return;
        if (b.chimney && i % 2 === 0) {
          const cx = b.w * 0.25,
            h =
              b.floors * st.storeyH + (Math.min(b.w, b.d) / 2) * st.pitch + 1.1;
          out.push({
            dir: stepOn(s.dir, F, b.x + cx * cs, -(b.z + cx * sn), this.R),
            alt: base + h,
            kind: "smoke",
            seed: (i * 0.37) % 1,
          });
        }
        if (i % 3 !== 1) {
          const off = b.d / 2 + 0.15;
          out.push({
            dir: stepOn(s.dir, F, b.x - sn * off, -(b.z + cs * off), this.R),
            alt: base + 1.5 + (i % 2) * st.storeyH,
            kind: "light",
            seed: b.kind === "civic" ? 0.999 : (i * 0.61) % 1,
          });
        }
      });
      if (plan.feature === "fire")
        out.push({
          dir: s.dir.slice(),
          alt: base + 0.6,
          kind: "fire",
          seed: 0.3,
        });
      // its lanterns and braziers, and those on the roads in, seen from a little way off
      plan.lights
        .concat(this.townRoadLamps ? this.townRoadLamps(s) : [])
        .forEach((L, k) => {
          if (L.kind === "fire" || (thin > 1 && L.kind === "post" && k % 2))
            return;
          const d = stepOn(s.dir, F, L.x, -L.z, this.R);
          out.push({
            dir: d,
            alt:
              Math.max(0, this.ground.height(d[0], d[1], d[2], 4)) +
              (L.kind === "brazier" ? 1.4 : 2.25),
            kind: "lantern",
            seed: 0.999,
          });
        });
      s._bcn = out;
      return out;
    },
    stepBeacons() {
      if (!this.beaconMesh) this.makeBeacons();
      const V = this.view,
        R = this.R,
        p = this.p,
        pos = this.bPos,
        info = this.bInfo;
      let n = 0;
      const add = (b, m) => {
        if (n >= BEACON_MAX) return;
        const far = BEACON_FAR[b.kind];
        if (m > far) return;
        if (
          (b.kind === "light" ||
            b.kind === "fire" ||
            b.kind === "star" ||
            b.kind === "lamp") &&
          m < 45
        )
          return;
        // far off, lift it a little: the ground out there is drawn coarser than it is
        const alt = b.alt + m * 0.0028;
        const X = b.dir[0] * (R + alt) - V.O[0],
          Y = b.dir[1] * (R + alt) - V.O[1],
          Z = b.dir[2] * (R + alt) - V.O[2];
        pos[n * 3] = X * V.F.e[0] + Y * V.F.e[1] + Z * V.F.e[2];
        pos[n * 3 + 1] = X * V.F.u[0] + Y * V.F.u[1] + Z * V.F.u[2];
        pos[n * 3 + 2] = -(X * V.F.n[0] + Y * V.F.n[1] + Z * V.F.n[2]);
        info[n * 4] = BEACON_KIND[b.kind];
        info[n * 4 + 1] = b.seed;
        info[n * 4 + 2] = Math.min(1, (far - m) / (far * 0.3));
        info[n * 4 + 3] = 0;
        n++;
      };
      for (const s of this.siteNear)
        for (const b of this.siteBeacons(s)) add(b, arcM(p, b.dir, R));
      for (const s of this.story.settlements) {
        const m = arcM(p, s.dir, R);
        if (m > 16000) continue;
        for (const b of this.townBeacons(s)) add(b, arcM(p, b.dir, R));
      }
      const geo = this.beaconMesh.geometry;
      geo.instanceCount = n;
      geo.attributes.iPos.needsUpdate = true;
      geo.attributes.iInfo.needsUpdate = true;
      this.beaconU.uTanHalf.value = Math.tan((this.camera.fov * Math.PI) / 360);
      this.beaconU.uViewH.value = this.H || 240;
    },

    // ---------- what you can use at a place, for lookTarget ----------
    lookSites(test, off) {
      if (!this.siteViews) return;
      const R = this.R,
        p = this.p;
      if (this.towns)
        for (const tw of this.towns.values()) {
          if (!tw.spots || arcM(p, tw.s.dir, R) > 400) continue;
          for (const sp of tw.spots) {
            if (
              Math.abs(sp.dir[0] - p[0]) * R > 8 ||
              Math.abs(sp.dir[1] - p[1]) * R > 8 ||
              Math.abs(sp.dir[2] - p[2]) * R > 8
            )
              continue;
            const [dx, dy, dz] = off(sp.dir, sp.alt);
            test(dx, dy, dz, sp.r * 0.6, 2.6, {
              kind: "site",
              view: tw,
              spot: sp,
            });
          }
        }
      for (const v of this.siteViews.values()) {
        if (
          Math.abs(v.site.dir[0] - p[0]) * R > v.plan.r + 12 ||
          Math.abs(v.site.dir[1] - p[1]) * R > v.plan.r + 12 ||
          Math.abs(v.site.dir[2] - p[2]) * R > v.plan.r + 12
        )
          continue;
        // by day you talk to your stall's keeper; by night the stall itself is there to see to
        const keeper =
          v.site.kind === "home" &&
          v.folk.some((f) => f.info && f.info.keeper && f.mesh.visible);
        for (const sp of v.spots) {
          if (keeper && sp.kind === "stall") continue;
          const [dx, dy, dz] = off(sp.dir, sp.alt);
          test(
            dx,
            dy,
            dz,
            sp.r * 0.6,
            sp.reach || (sp.kind === "bathe" ? 2.2 + sp.r : 2.6),
            { kind: "site", view: v, spot: sp },
          );
        }
      }
    },
    // standing in a hot pool?
    inPool() {
      if (!this.siteViews) return null;
      for (const v of this.siteViews.values()) {
        if (!v.pool) continue;
        const F = v.F,
          d = [
            this.p[0] - v.site.dir[0],
            this.p[1] - v.site.dir[1],
            this.p[2] - v.site.dir[2],
          ];
        const x = (d[0] * F.e[0] + d[1] * F.e[1] + d[2] * F.e[2]) * this.R,
          z = -(d[0] * F.n[0] + d[1] * F.n[1] + d[2] * F.n[2]) * this.R;
        if (Math.hypot(x - v.pool.x, z - v.pool.z) < v.pool.r) return v;
      }
      return null;
    },
    // for the nearest chunks: the footprint of every building, where not even grass grows
    footprints(chunk) {
      const out = [],
        R = this.R,
        reach = chunk.span * 0.75 + 60;
      const put = (dir, r, rect = null) => {
        const d = [
          dir[0] - chunk.c[0],
          dir[1] - chunk.c[1],
          dir[2] - chunk.c[2],
        ];
        const x =
            (d[0] * chunk.F.e[0] + d[1] * chunk.F.e[1] + d[2] * chunk.F.e[2]) *
            R,
          z =
            -(d[0] * chunk.F.n[0] + d[1] * chunk.F.n[1] + d[2] * chunk.F.n[2]) *
            R;
        if (
          Math.abs(x) < chunk.span * 0.75 + r &&
          Math.abs(z) < chunk.span * 0.75 + r
        )
          out.push(rect ? [x, z, r * r, 1, rect] : [x, z, r * r, 1]);
      };
      for (const s of this.story.settlements) {
        if (arcM(chunk.c, s.dir, R) > reach + 400) continue;
        const plan = s._plan || (s._plan = townPlan(this.story, s)),
          F = frameAt(s.dir);
        for (const b of plan.buildings)
          put(stepOn(s.dir, F, b.x, -b.z, R), Math.hypot(b.w, b.d) / 2 + 0.2);
      }
      if (this.siteIx)
        for (const s of this.siteIx
          .near(chunk.c, reach, "big")
          .concat(this.homesNear(chunk.c, reach))) {
          const plan = sitePlan(this.story, s);
          const floor = plan.props.find(
            (q) => q.t === "crater" || q.t === "sinter",
          );
          if (!plan.buildings.length && !floor) continue;
          const F = frameAt(s.dir);
          for (const b of plan.buildings)
            put(stepOn(s.dir, F, b.x, -b.z, R), Math.hypot(b.w, b.d) / 2 + 0.2);
          // (no grass coming up through the crops, nor anything else: a field is its own ground)
          for (const fp of plan.props)
            if (fp.t === "myfield" || fp.t === "field") {
              const cs = Math.cos(fp.rot || 0),
                sn = Math.sin(fp.rot || 0),
                uW = [
                  F.e[0] * cs - F.n[0] * sn,
                  F.e[1] * cs - F.n[1] * sn,
                  F.e[2] * cs - F.n[2] * sn,
                ];
              const ux =
                  uW[0] * chunk.F.e[0] +
                  uW[1] * chunk.F.e[1] +
                  uW[2] * chunk.F.e[2],
                uz = -(
                  uW[0] * chunk.F.n[0] +
                  uW[1] * chunk.F.n[1] +
                  uW[2] * chunk.F.n[2]
                ),
                L = Math.hypot(ux, uz) || 1;
              put(
                stepOn(s.dir, F, fp.x, -fp.z, R),
                Math.hypot(fp.w, fp.d) / 2,
                [ux / L, uz / L, fp.w / 2, fp.d / 2],
              );
            }
          // (nothing grows on scorched earth, or on the crust round a geyser)
          if (floor)
            put(
              stepOn(s.dir, F, floor.x, -floor.z, R),
              floor.t === "crater" ? floor.r + 1.2 : floor.r * 0.95,
            );
        }
      return out;
    },
    // for building chunks: the ground each place clears, in a chunk's own metres
    // A cave's mouth, where the land rises. The ground raises a knoll over it (see updateKnolls);
    // here, the rock of the knoll's face: layered and broken, stepping out a little over the mouth, a
    // roof of rock over the way in (you can walk over it), stones fallen at the foot of the face, and
    // the dark going in. Prop metres: u across the mouth, w out of it (into the hill is -w).
    caveRockInto(mb, pr, y0, c, at) {
      const { rows, grass, col, hAt, base } = c;
      const s = c.s,
        F = c.v.F,
        R = this.R,
        G = this.ground;
      const W = pr.w,
        Hh = pr.h,
        rnd = mulberry32(pr.seed || 7);
      const k = this.knollOf(s) || {
        Au: 14,
        Bw: 13,
        wc: -4,
        H: Hh + 3,
        Uc: W / 2 + 3.5,
        W,
        D: CAVE_STUB,
        Lf: CAVE_CLIFF,
      };
      const A = k.Uc,
        D = CAVE_STUB,
        Lf = CAVE_CLIFF;
      const gnd = (u, w) => {
        const q = at(u, 0, w);
        return hAt(q[0], q[2]);
      };
      const bare = (u, w) => {
        const q = at(u, 0, w),
          d = stepOn(s.dir, F, q[0], -q[2], R);
        return G.height(d[0], d[1], d[2], 1.5, true) - base;
      };
      // the knoll's top as it would be with no way cut in under it
      const topNN = (u, w) => bare(u, w) + knollProfile(k, u, w);
      const faceW = (u) => knollFace(k, u);
      // where the face meets the ground: out in front of the knoll's cliff, except at the way in
      const nu = (u) =>
        Math.min(1, Math.max(0, (Math.abs(u) - W / 2 - 0.9) / 0.6));
      const footW = (u) => faceW(u) + 0.8 * nu(u),
        topW = (u) => faceW(u) - Lf;
      const ph = [rnd() * 6.28, rnd() * 6.28, rnd() * 6.28];
      // the mouth: a round-shouldered arch on the ground
      const arch = (u) => {
        const t = Math.min(1, Math.abs((2 * u) / W));
        return Hh * Math.pow(1 - Math.pow(t, 2.6), 1 / 2.6);
      };
      const RK = { row2: rows.moss };
      // ---- the face: columns from the ground (or the arch) up to the top of the knoll (the same
      // rock as the ground's own where it is too steep for grass) ----
      const us = [];
      for (let u = -A; u < -W / 2 - 0.7; u += 0.75) us.push(u);
      for (let u = -W / 2 - 0.7; u < W / 2 + 0.7; u += 0.22) us.push(u);
      for (let u = W / 2 + 0.7; u <= A + 1e-6; u += 0.75) us.push(u);
      if (us[us.length - 1] < A) us.push(A);
      const NR = 7;
      // (layers of rock: each juts out a little further or less, never back into the hill)
      const strata = (u, y) =>
        0.22 +
        0.16 * Math.sin((y - y0) * 2.3 + 0.9 * Math.sin(u * 0.37 + ph[0])) +
        0.07 * Math.sin(u * 1.9 + y * 3.1 + ph[1]);
      const FC = us.map((u) => {
        const inMouth = Math.abs(u) < W / 2,
          w0 = inMouth ? faceW(u) : footW(u),
          w1 = topW(u);
        const yb = inMouth ? y0 + arch(u) : gnd(u, w0) - 0.5,
          yt = Math.max(yb + 0.05, topNN(u, w1) + 0.02);
        const out = [];
        for (let r = 0; r <= NR; r++) {
          const f = r / NR,
            kk = Math.sin(Math.PI * f),
            y = yb + (yt - yb) * f;
          const brow = Math.abs(u) < W / 2 + 0.6 ? 0.22 * kk : 0;
          const q = at(u, 0, w0 + (w1 - w0) * f + (strata(u, y) + brow) * kk);
          out.push([q[0], y, q[2]]);
        }
        return out;
      });
      for (let j = 0; j < us.length - 1; j++)
        for (let r = 0; r < NR; r++)
          mb.quad(
            FC[j][r],
            FC[j + 1][r],
            FC[j + 1][r + 1],
            FC[j][r + 1],
            M.ROCK,
            PAT.ROCK,
            null,
            RK,
          );
      // ---- the roof of rock over the way in, level with the knoll round it ----
      // (well past where the ground is cut away under it, and with its edges turned down, so no gap
      // shows between it and the ground round it)
      const UL = W / 2 + 2.6,
        LB = D + 2.9,
        NLu = 14,
        NLw = 8;
      const lid = [];
      for (let i = 0; i <= NLu; i++) {
        const u = -UL + (2 * UL * i) / NLu,
          w1 = topW(u),
          row = [];
        for (let j = 0; j <= NLw; j++) {
          const w = w1 - ((LB + w1) * j) / NLw,
            q = at(u, 0, w);
          row.push([q[0], topNN(u, w) + 0.02, q[2]]);
        }
        lid.push(row);
      }
      for (let i = 0; i < NLu; i++)
        for (let j = 0; j < NLw; j++)
          mb.quad(
            lid[i][j],
            lid[i + 1][j],
            lid[i + 1][j + 1],
            lid[i][j + 1],
            M.ROCK,
            PAT.ROCK,
            null,
            RK,
          );
      const down = (p) => [p[0], p[1] - 0.7, p[2]];
      for (let j = 0; j < NLw; j++)
        for (const i of [0, NLu])
          mb.quad(
            lid[i][j],
            lid[i][j + 1],
            down(lid[i][j + 1]),
            down(lid[i][j]),
            M.ROCK,
            PAT.ROCK,
            null,
            RK,
          );
      for (let i = 0; i < NLu; i++)
        mb.quad(
          lid[i][NLw],
          lid[i + 1][NLw],
          down(lid[i + 1][NLw]),
          down(lid[i][NLw]),
          M.ROCK,
          PAT.ROCK,
          null,
          RK,
        );
      // ---- the way in: the arch carried back into the dark, the floor going on with the ground ----
      const NJ = 5,
        NA = 12;
      const prof = [];
      for (let t = 0; t <= NA; t++) {
        const u = -W / 2 + (W * t) / NA;
        prof.push([u, arch(u)]);
      }
      const stub = (t, j) => {
        const [u, h] = prof[t],
          f = j / NJ,
          wf = faceW(u),
          w = wf - (D + wf) * f,
          sq = 1 - 0.14 * f;
        const q = at(u * sq, 0, w),
          fl = Math.max(y0, gnd(0, w)) + 0.05;
        return [q[0], fl + h * sq, q[2]];
      };
      for (let j = 0; j < NJ; j++) {
        const lv = -0.8 - (2.4 * (j + 0.5)) / NJ;
        for (let t = 0; t < NA; t++)
          mb.quad(
            stub(t + 1, j),
            stub(t, j),
            stub(t, j + 1),
            stub(t + 1, j + 1),
            rows.stoneDark,
            PAT.NONE,
            null,
            { lv },
          );
        const f0 = j / NJ,
          f1 = (j + 1) / NJ,
          w0 = -D * f0,
          w1 = -D * f1,
          h0 = Math.max(y0, gnd(0, w0)) + 0.06,
          h1 = Math.max(y0, gnd(0, w1)) + 0.06;
        const s0 = (W / 2) * (1 - 0.14 * f0),
          s1 = (W / 2) * (1 - 0.14 * f1);
        const a0 = at(-s0, 0, w0),
          b0 = at(s0, 0, w0),
          a1 = at(-s1, 0, w1),
          b1 = at(s1, 0, w1);
        mb.quad(
          [a0[0], h0, a0[2]],
          [b0[0], h0, b0[2]],
          [b1[0], h1, b1[2]],
          [a1[0], h1, a1[2]],
          rows.stoneDark,
          PAT.NONE,
          null,
          { lv: lv - 0.4 },
        );
      }
      {
        const bc = at(0, 0, -D),
          fl = Math.max(y0, gnd(0, -D)) + 0.05;
        for (let t = 0; t < NA; t++)
          mb.tri(
            [bc[0], fl, bc[2]],
            stub(t, NJ),
            stub(t + 1, NJ),
            rows.char,
            PAT.NONE,
            null,
            { lv: -3 },
          );
      }
      // ---- stones fallen from the face ----
      for (let j = 0; j < 11; j++) {
        const side = j % 2 ? 1 : -1,
          u = side * (W / 2 + 0.9 + rnd() * (A * 0.75 - W / 2)),
          w = footW(u) + 0.3 + rnd() * 2.2,
          s2 = 0.3 + rnd() * (j < 4 ? 0.9 : 0.45);
        const q = at(u, 0, w),
          g = gnd(u, w);
        lumpInto(
          mb,
          q[0],
          g - s2 * 0.35,
          q[2],
          s2 * (0.9 + rnd() * 0.4),
          s2 * (0.7 + rnd() * 0.3),
          s2 * (0.9 + rnd() * 0.3),
          j % 3 ? M.ROCK : rows.stoneDark,
          rows.moss,
          Math.floor(rnd() * 1e6),
          rnd() * 6.28,
        );
        if (s2 > 0.55)
          col.push(
            q[0],
            q[2],
            s2 * 0.9,
            base + g - 0.3,
            base + g + s2 * 0.9,
            2,
          );
      }
      // ---- what stops you: the face (not once you are up on the knoll), the sides of the mouth, the dark ----
      for (const u of us) {
        if (Math.abs(u) < W / 2 + 0.25) continue;
        const wb = footW(u),
          g = gnd(u, wb),
          t = topNN(u, topW(u));
        if (t - g < 0.7) continue;
        const q = at(u, 0, wb - 0.25);
        col.push(q[0], q[2], 0.45, base + g - 0.4, base + t - 0.15, 1);
      }
      for (const sd of [-1, 1]) {
        const q = at(sd * (W / 2 + 0.45), 0, -0.25);
        col.push(q[0], q[2], 0.5, base + y0 - 0.4, base + y0 + Hh + 0.6, 1);
      }
      {
        const q = at(0, 0, -D + 0.2);
        col.push(q[0], q[2], W / 2, base + y0 - 0.4, base + y0 + Hh, 1);
      }
      // ---- up on the knoll, the roof over the way in holds you up ----
      const cs = Math.cos(pr.rot || 0),
        sn = Math.sin(pr.rot || 0),
        px = pr.x,
        pz = pr.z;
      (c.v.rocks || (c.v.rocks = [])).push((sx, sz, feet) => {
        const dx = sx - px,
          dz = sz - pz,
          u = dx * cs + dz * sn,
          w = -dx * sn + dz * cs;
        if (Math.abs(u) > UL || w < -LB || w > topW(u)) return null;
        const t = topNN(u, w) + 0.02;
        return feet < t - 1.2 ? null : t;
      });
      c.v.mouth = { x: pr.x, z: pr.z, rot: pr.rot, w: W, h: Hh, y: y0 };
    },
    siteClear(chunk) {
      if (!this.siteIx) return [];
      const out = [];
      const list = this.siteIx
        .near(chunk.c, chunk.span * 0.75 + 60, "all")
        .concat(this.homesNear(chunk.c, chunk.span * 0.75 + 60));
      for (const s of list) {
        const r = sitePlan(this.story, s).r;
        if (s.m > chunk.span * 0.75 + r) continue;
        const d = [
          s.dir[0] - chunk.c[0],
          s.dir[1] - chunk.c[1],
          s.dir[2] - chunk.c[2],
        ];
        out.push([
          (d[0] * chunk.F.e[0] + d[1] * chunk.F.e[1] + d[2] * chunk.F.e[2]) *
            this.R,
          -(d[0] * chunk.F.n[0] + d[1] * chunk.F.n[1] + d[2] * chunk.F.n[2]) *
            this.R,
          r * r,
        ]);
      }
      return out;
    },
  });

  // ---- view/placesview.js ----
  // ============================================================
  // PLACES VIEW — the newer places between towns, on the ground: a windmill
  // whose sails turn with the wind, a fishing hut with its racks and its boat
  // and a jetty out over the water, a lighthouse with its lamp, a mine
  // timbered into a hill with its rails and its heap of spoil, a ferry landing
  // with a bell to call the boat, a watchtower by the road, a holy place of
  // the people's faith, and the wayside shrines as each people builds them.
  // Pieces in a place's metres (x east, y up from its base, z south), like the
  // rest of siteview.js; each one also says what you bump into and stand on.
  // ============================================================

