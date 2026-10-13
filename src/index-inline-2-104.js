// index-inline-2 104 — rnd
// Lines 52496-53808 of readable/index-inline-2.pretty.js (statement-aligned).
  Object.assign(GroundView.prototype, {
    // ---------- a new planet: no animals yet ----------
    setFauna() {
      if (this.birdMesh) {
        this.scene.remove(this.birdMesh);
        this.birdMesh.geometry.dispose();
        this.birdMesh.material.dispose();
        this.birdMesh = null;
      }
      if (this.herds) for (const hd of this.herds) this.dropHerd(hd);
      this.herds = [];
      const dead = this.carcasses || [];
      this.carcasses = [];
      for (const c of dead) this.dropCarcass(c);
      this.birds = null;
      this.faunaAt = 0;
      this.faunaFresh = true;
      this.faunaNews = null;
    },
    stepFauna(dt, nowS) {
      if (!this.planet || !this.herds) return;
      if (!this.birds) this.makeBirds();
      // every few seconds: is there as much life about as this land should have?
      this.faunaAt -= dt;
      if (this.faunaAt <= 0 && !this.journey) {
        this.faunaAt = 2 + Math.random() * 2;
        this.faunaCensus();
        this.faunaFresh = false;
      }
      this.stepBirds(dt, nowS);
      this.stepHerds(dt, nowS);
      this.stepCarcasses(dt);
    },
    faunaCensus() {
      const p = this.p,
        rnd = Math.random,
        day = this.uniforms.uDay.value;
      const env = this.siteIx
        ? this.siteIx.envAt(p)
        : this.ground.sample(p[0], p[1], p[2], 8, {});
      const Bd = this.birds;
      const wooded = WOODED.has(env.biome),
        open = OPEN_LAND.has(env.biome);
      const harsh =
        env.biome === B.ICE ||
        env.h > 3400 ||
        (env.biome === B.DESERT && env.P < 140);
      const coast =
        env.h < 60 &&
        Math.abs(env.coastKm ?? 99) < 60 &&
        this.waterNear(p, 280);
      // flocks by day; little birds on open ground; now and then a bird of prey
      const wantFlocks = day < 0.3 || harsh ? 0 : wooded || coast ? 2 : 1;
      if (Bd.flocks.length < wantFlocks) this.spawnFlock(wooded, coast);
      const wantGround = day < 0.3 || harsh || wooded || env.h < 0.5 ? 0 : 1;
      if (Bd.ground.length < wantGround) this.spawnGroundBirds();
      if (
        !Bd.raptor &&
        (open || env.biome === B.ROCK) &&
        day > 0.4 &&
        !harsh &&
        rnd() < 0.35
      )
        this.spawnRaptor();
      // vultures over dry open country, circling something that has died; bats about the trees at dusk
      const dryOpen =
        env.biome === B.SAVANNA ||
        env.biome === B.DESERT ||
        env.biome === B.STEPPE ||
        env.biome === B.DRYFOREST;
      if (!Bd.vultures && dryOpen && day > 0.5 && !harsh && rnd() < 0.1)
        this.spawnVultures();
      if (
        !Bd.bats &&
        (wooded || env.biome === B.DRYFOREST || env.biome === B.ROCK) &&
        day < 0.45 &&
        (env.T ?? 10) > 4 &&
        rnd() < 0.3
      )
        this.spawnBats();
      // herds of the land's beast
      const land = HERD_LAND[env.biome] || 0;
      const want = land >= 0.9 ? 2 : land > 0 ? 1 : 0,
        big = this.herds.filter((h) => !h.small).length;
      if (big < want && rnd() < Math.max(0.35, land)) this.spawnHerd(env);
      // and the small things about, closer in (not by night, not by the sea's edge)
      const small = this.herds.filter((h) => h.small).length;
      if (
        SMALL_LAND[env.biome] &&
        small < (OPEN_LAND.has(env.biome) ? 2 : 1) &&
        day > 0.2 &&
        rnd() < 0.5
      )
        this.spawnHerd(env, { small: true });
    },
    waterNear(p, m) {
      const F = frameAt(p);
      for (let k = 0; k < 8; k++) {
        const a = (k / 8) * Math.PI * 2,
          q = stepOn(p, F, Math.sin(a) * m, Math.cos(a) * m, this.R);
        if (this.ground.height(q[0], q[1], q[2], 30) < 0) return true;
      }
      return false;
    },
    // a point at a bearing (clockwise from north) and distance from you
    faunaSpot(a, m) {
      return stepOn(
        this.p,
        frameAt(this.p),
        Math.sin(a) * m,
        Math.cos(a) * m,
        this.R,
      );
    },

    // ---------- birds ----------
    makeBirds() {
      const T = this.T;
      const geo = birdGeometry(T);
      this.birdPos = new Float32Array(BIRD_MAX * 3);
      this.birdInfo = new Float32Array(BIRD_MAX * 4);
      this.birdYaw = new Float32Array(BIRD_MAX * 4);
      geo.setAttribute("iPos", new T.InstancedBufferAttribute(this.birdPos, 3));
      geo.setAttribute(
        "iInfo",
        new T.InstancedBufferAttribute(this.birdInfo, 4),
      );
      geo.setAttribute("iYaw", new T.InstancedBufferAttribute(this.birdYaw, 4));
      for (const k of ["iPos", "iInfo", "iYaw"])
        geo.attributes[k].setUsage(T.DynamicDrawUsage);
      geo.instanceCount = 0;
      this.birdU = {
        ...this.uniforms,
        uTanHalf: { value: 0.7 },
        uViewH: { value: 240 },
      };
      const mat = new T.ShaderMaterial({
        uniforms: this.birdU,
        vertexShader: BIRD_VS,
        fragmentShader: BIRD_FS,
        side: T.DoubleSide,
      });
      this.birdMesh = new T.Mesh(geo, mat);
      this.birdMesh.frustumCulled = false;
      this.scene.add(this.birdMesh);
      const r = (c) => this.row(c);
      // a planet's birds: dark ones, brown ones, grey ones, gulls, and one colour of its own
      const acc = mulberry32(hashStr(this.planet.seedKey + "/birds"));
      const hue = [
        [64, 104, 168],
        [168, 64, 52],
        [70, 132, 84],
        [200, 162, 64],
        [120, 80, 150],
      ][Math.floor(acc() * 5)];
      this.birdRows = {
        dark: r([46, 42, 52]),
        brown: r([128, 98, 70]),
        grey: r([118, 120, 130]),
        gull: r([236, 236, 242]),
        raptor: r([96, 70, 50]),
        bright: r(hue),
        vulture: r([62, 52, 48]),
        bat: r([44, 36, 40]),
      };
      this.birds = {
        flocks: [],
        ground: [],
        raptor: null,
        vultures: null,
        bats: null,
      };
    },
    spawnFlock(wooded, coast) {
      const rnd = Math.random;
      const c = this.faunaSpot(rnd() * 6.28, 120 + rnd() * 150);
      const gh = this.ground.height(c[0], c[1], c[2], 30);
      const gull = coast && rnd() < 0.75;
      if (gh < 0 && !gull) return;
      const R2 = this.birdRows;
      const row = gull
        ? R2.gull
        : rnd() < 0.2
          ? R2.bright
          : wooded
            ? R2.dark
            : rnd() < 0.5
              ? R2.brown
              : R2.grey;
      const n = gull ? 3 + Math.floor(rnd() * 5) : 7 + Math.floor(rnd() * 9);
      const spin = rnd() < 0.5 ? -1 : 1;
      const fl = {
        lit: gull ? 1.6 : row === R2.bright ? 0.7 : 0,
        c,
        alt: Math.max(0, gh) + 26 + rnd() * 34,
        ve: 0,
        vn: 0,
        tve: 0,
        tvn: 0,
        turn: 0,
        t: rnd() * 100,
        row,
        gull,
        scale: gull ? 1.7 : 0.8 + rnd() * 0.3,
        life: 70 + rnd() * 110,
        birds: [],
      };
      for (let k = 0; k < n; k++) {
        // a flock loops together; gulls each go their own way
        const w = (0.3 + rnd() * 0.35) * (gull ? (rnd() < 0.5 ? -1 : 1) : spin);
        fl.birds.push({
          p1: rnd() * 6.28,
          p3: rnd() * 6.28,
          w,
          w2: 0.4 + rnd() * 0.4,
          r: gull ? 10 + rnd() * 16 : 3 + rnd() * 7,
          ph: rnd() * 6.28,
          glide: rnd() * 3 - 1,
        });
      }
      this.birds.flocks.push(fl);
    },
    spawnGroundBirds() {
      const rnd = Math.random,
        R = this.R;
      const c = this.faunaSpot(rnd() * 6.28, 25 + rnd() * 45);
      if (this.ground.height(c[0], c[1], c[2], 1) < 0.5) return;
      const F = frameAt(c),
        rows = this.birdRows;
      const g = {
        c,
        F,
        flee: -1,
        row: rnd() < 0.5 ? rows.brown : rows.grey,
        birds: [],
      };
      const n = 3 + Math.floor(rnd() * 5);
      for (let k = 0; k < n; k++) {
        const x = (rnd() - 0.5) * 5,
          z = (rnd() - 0.5) * 5,
          d = stepOn(c, F, x, -z, R);
        g.birds.push({
          x,
          z,
          y: this.ground.height(d[0], d[1], d[2], 1) + 0.04,
          yaw: rnd() * 6.28,
          hop: rnd() * 2,
          ph: rnd() * 6.28,
          vx: 0,
          vy: 0,
          vz: 0,
        });
      }
      this.birds.ground.push(g);
    },
    spawnRaptor() {
      const rnd = Math.random;
      const c = this.faunaSpot(rnd() * 6.28, 60 + rnd() * 160);
      const gh = Math.max(0, this.ground.height(c[0], c[1], c[2], 30));
      this.birds.raptor = {
        c,
        alt: gh + 75 + rnd() * 60,
        rad: 30 + rnd() * 35,
        ang: rnd() * 6.28,
        w: (0.1 + rnd() * 0.06) * (rnd() < 0.5 ? -1 : 1),
        life: 100 + rnd() * 140,
        de: (rnd() - 0.5) * 1.6,
        dn: (rnd() - 0.5) * 1.6,
      };
    },
    spawnVultures() {
      const rnd = Math.random;
      const c = this.faunaSpot(rnd() * 6.28, 90 + rnd() * 200);
      const gh = Math.max(0, this.ground.height(c[0], c[1], c[2], 30));
      const n = 3 + Math.floor(rnd() * 4),
        w = (0.12 + rnd() * 0.05) * (rnd() < 0.5 ? -1 : 1);
      const v = { c, life: 80 + rnd() * 120, fade: 0, birds: [] };
      for (let k = 0; k < n; k++)
        v.birds.push({
          alt: gh + 45 + rnd() * 60,
          rad: 16 + rnd() * 30,
          ang: rnd() * 6.28,
          w: w * (0.8 + rnd() * 0.4),
        });
      this.birds.vultures = v;
    },
    spawnBats() {
      const rnd = Math.random;
      const c = this.faunaSpot(rnd() * 6.28, 18 + rnd() * 30);
      const gh = this.ground.height(c[0], c[1], c[2], 2);
      if (gh < 0.5) return;
      const n = 4 + Math.floor(rnd() * 6),
        bt = {
          c,
          gh,
          life: 50 + rnd() * 70,
          fade: 0,
          ve: 0,
          vn: 0,
          turn: 0,
          hT: 0,
          birds: [],
        };
      for (let k = 0; k < n; k++)
        bt.birds.push({
          x: (rnd() - 0.5) * 8,
          y: 4 + rnd() * 7,
          z: (rnd() - 0.5) * 8,
          vx: 0,
          vy: 0,
          vz: 0,
          ph: rnd() * 6.28,
          jit: 0,
        });
      this.birds.bats = bt;
    },
    stepBirds(dt, nowS) {
      const Bd = this.birds,
        R = this.R,
        p = this.p,
        V = this.view;
      const day = this.uniforms.uDay.value,
        rnd = Math.random,
        ev = this.events || {};
      // where things are in the scene's metres (x east, y up, z south, from sea level under you)
      const scene = (d, alt) => {
        const X = d[0] * (R + alt) - V.O[0],
          Y = d[1] * (R + alt) - V.O[1],
          Z = d[2] * (R + alt) - V.O[2];
        return [
          X * V.F.e[0] + Y * V.F.e[1] + Z * V.F.e[2],
          X * V.F.u[0] + Y * V.F.u[1] + Z * V.F.u[2],
          -(X * V.F.n[0] + Y * V.F.n[1] + Z * V.F.n[2]),
        ];
      };
      const pos = this.birdPos,
        info = this.birdInfo,
        yaw = this.birdYaw;
      let n = 0;
      const put = (
        x,
        y,
        z,
        hd,
        scale,
        ph,
        mode,
        row,
        minPx,
        lit = 0,
        fade = 1,
      ) => {
        if (n >= BIRD_MAX || fade <= 0) return;
        pos[n * 3] = x;
        pos[n * 3 + 1] = y;
        pos[n * 3 + 2] = z;
        yaw[n * 4] = hd;
        yaw[n * 4 + 1] = minPx;
        yaw[n * 4 + 2] = lit;
        yaw[n * 4 + 3] = fade;
        info[n * 4] = scale;
        info[n * 4 + 1] = ph;
        info[n * 4 + 2] = mode;
        info[n * 4 + 3] = row;
        n++;
      };
      // flocks: a centre that wheels about the sky, each bird looping round it
      for (let i = Bd.flocks.length - 1; i >= 0; i--) {
        const fl = Bd.flocks[i];
        fl.t += dt;
        fl.life -= dt;
        fl.turn -= dt;
        const m = arcM(p, fl.c, R),
          leaving = day < 0.25 || fl.life < 0;
        fl.fade = leaving
          ? (fl.fade ?? 1) - dt / 4
          : Math.min(1, (fl.fade ?? 0) + dt / 3);
        if (fl.turn <= 0) {
          fl.turn = 4 + rnd() * 5;
          const sp = fl.gull ? 4 + rnd() * 4 : 6 + rnd() * 6;
          let a = rnd() * 6.28;
          // wandering too far: come back round towards you; leaving: away
          if (m > 230 && !leaving) a = bearingTo(fl.c, p) + (rnd() - 0.5);
          if (leaving) a = bearingTo(p, fl.c) + (rnd() - 0.5) * 0.6;
          fl.tve = Math.sin(a) * sp;
          fl.tvn = Math.cos(a) * sp;
        }
        const k = Math.min(1, dt * 0.45);
        fl.ve += (fl.tve - fl.ve) * k;
        fl.vn += (fl.tvn - fl.vn) * k;
        fl.c = stepOn(fl.c, frameAt(fl.c), fl.ve * dt, fl.vn * dt, R);
        if (leaving) fl.alt += dt * 4;
        else if (
          fl.floor == null ||
          Math.floor(fl.t * 2) !== Math.floor((fl.t - dt) * 2)
        )
          fl.floor =
            Math.max(0, this.ground.height(fl.c[0], fl.c[1], fl.c[2], 30)) + 24;
        if (fl.floor != null && fl.alt < fl.floor)
          fl.alt += (fl.floor - fl.alt) * Math.min(1, dt * 1.5);
        if (m > 900 || (leaving && fl.fade <= 0)) {
          Bd.flocks.splice(i, 1);
          continue;
        }
        const c = scene(fl.c, fl.alt);
        for (const b of fl.birds) {
          const ang = fl.t * b.w + b.p1;
          const x = c[0] + Math.cos(ang) * b.r,
            z = c[2] + Math.sin(ang) * b.r * 0.8,
            y = c[1] + Math.sin(fl.t * b.w2 + b.p3) * 2.2;
          // which way it flies: the flock's drift plus its own loop
          const vx = fl.ve - Math.sin(ang) * b.r * b.w,
            vz = -fl.vn + Math.cos(ang) * b.r * 0.8 * b.w;
          b.glide -= dt;
          if (b.glide < -(fl.gull ? 1 : 3) - rnd() * 3)
            b.glide = (fl.gull ? 3 : 1) + rnd() * 2;
          const gliding = b.glide > 0;
          if (!gliding) b.ph += dt * (fl.gull ? 9 : 16);
          put(
            x,
            y,
            z,
            Math.atan2(vx, -vz),
            fl.scale,
            b.ph,
            gliding ? 1 : 0,
            fl.row,
            fl.gull ? 6 : 5,
            fl.lit,
            fl.fade,
          );
        }
      }
      // little birds on the ground: hop and peck, burst up when you come close
      for (let i = Bd.ground.length - 1; i >= 0; i--) {
        const g = Bd.ground[i];
        const m = arcM(p, g.c, R);
        if (g.flee < 0 && (m < 7 || (m < 15 && ev.running))) {
          g.flee = 0;
          const away = bearingTo(p, g.c);
          for (const b of g.birds) {
            const a = away + (rnd() - 0.5) * 1.6,
              sp = 6 + rnd() * 3;
            b.vx = Math.sin(a) * sp;
            b.vz = -Math.cos(a) * sp;
            b.vy = 2.5 + rnd() * 2;
            b.yaw = a;
          }
        }
        if (g.flee >= 0) g.flee += dt;
        g.in = Math.min(1, (g.in || 0) + dt / 2);
        g.fade = g.in - (g.flee > 9 ? (g.flee - 9) / 4 : 0);
        if (m > 160 || g.flee > 13 || day < 0.25) {
          Bd.ground.splice(i, 1);
          continue;
        }
        const c = scene(g.c, 0);
        for (const b of g.birds) {
          if (g.flee >= 0) {
            b.x += b.vx * dt;
            b.z += b.vz * dt;
            b.y += b.vy * dt;
            b.vy = Math.max(0.3, b.vy - dt * 0.6);
            b.ph += dt * 18;
          } else {
            b.hop -= dt;
            if (b.hop <= 0) {
              b.hop = 0.5 + rnd() * 2.2;
              const a = rnd() * 6.28;
              b.x += Math.sin(a) * 0.25;
              b.z -= Math.cos(a) * 0.25;
              b.yaw = a;
              const d = stepOn(g.c, g.F, b.x, -b.z, R);
              b.y = this.ground.height(d[0], d[1], d[2], 1) + 0.04;
            }
          }
          put(
            c[0] + b.x,
            c[1] + b.y,
            c[2] + b.z,
            b.yaw,
            0.6,
            b.ph,
            g.flee >= 0 ? 0 : 2,
            g.row,
            3,
            0,
            g.fade,
          );
        }
      }
      // the bird of prey: slow wide circles, wings held out
      const rp = Bd.raptor;
      if (rp) {
        rp.ang += rp.w * dt;
        rp.life -= dt;
        rp.c = stepOn(rp.c, frameAt(rp.c), rp.de * dt, rp.dn * dt, R);
        const going = rp.life < 0 || day < 0.3;
        rp.fade = going
          ? (rp.fade ?? 1) - dt / 4
          : Math.min(1, (rp.fade ?? 0) + dt / 4);
        if ((going && rp.fade <= 0) || arcM(p, rp.c, R) > 900) Bd.raptor = null;
        else {
          const c = scene(rp.c, rp.alt);
          const vx = -Math.sin(rp.ang) * rp.rad * rp.w + rp.de,
            vz = Math.cos(rp.ang) * rp.rad * rp.w - rp.dn;
          put(
            c[0] + Math.cos(rp.ang) * rp.rad,
            c[1] + Math.sin(rp.ang * 0.5) * 4,
            c[2] + Math.sin(rp.ang) * rp.rad,
            Math.atan2(vx, -vz),
            3,
            nowS,
            1,
            this.birdRows.raptor,
            8,
            0,
            rp.fade,
          );
        }
      }
      // vultures: wide slow circles over one place, one above another, wings held out
      const vu = Bd.vultures;
      if (vu) {
        vu.life -= dt;
        const going = vu.life < 0 || day < 0.35;
        vu.fade = going ? vu.fade - dt / 5 : Math.min(1, vu.fade + dt / 5);
        if ((going && vu.fade <= 0) || arcM(p, vu.c, R) > 1000)
          Bd.vultures = null;
        else {
          const c = scene(vu.c, 0);
          for (const b of vu.birds) {
            b.ang += b.w * dt;
            const vx = -Math.sin(b.ang) * b.w,
              vz = Math.cos(b.ang) * b.w;
            put(
              c[0] + Math.cos(b.ang) * b.rad,
              c[1] + b.alt + Math.sin(b.ang * 0.7) * 3,
              c[2] + Math.sin(b.ang) * b.rad,
              Math.atan2(vx, -vz),
              3.4,
              nowS,
              1,
              this.birdRows.vulture,
              7,
              0,
              vu.fade,
            );
          }
        }
      }
      // bats: small and quick, jinking every way at once about the trees
      const bt = Bd.bats;
      if (bt) {
        bt.life -= dt;
        bt.turn -= dt;
        bt.hT -= dt;
        const going = bt.life < 0 || day > 0.55;
        bt.fade = going ? bt.fade - dt / 3 : Math.min(1, bt.fade + dt / 2);
        if (bt.turn <= 0) {
          bt.turn = 3 + rnd() * 4;
          const a = rnd() * 6.28,
            sp = 1 + rnd() * 2.5;
          bt.ve = Math.sin(a) * sp;
          bt.vn = Math.cos(a) * sp;
        }
        bt.c = stepOn(bt.c, frameAt(bt.c), bt.ve * dt, bt.vn * dt, R);
        if (bt.hT <= 0) {
          bt.hT = 1;
          bt.gh = Math.max(0, this.ground.height(bt.c[0], bt.c[1], bt.c[2], 2));
        }
        if ((going && bt.fade <= 0) || arcM(p, bt.c, R) > 300) Bd.bats = null;
        else {
          const c = scene(bt.c, bt.gh);
          for (const b of bt.birds) {
            b.jit -= dt;
            if (b.jit <= 0) {
              b.jit = 0.15 + rnd() * 0.35;
              b.vx = (rnd() - 0.5) * 14 - b.x * 0.5;
              b.vy = (rnd() - 0.5) * 5 + (8 - b.y) * 0.6;
              b.vz = (rnd() - 0.5) * 14 - b.z * 0.5;
            }
            b.x += b.vx * dt;
            b.y = Math.max(2.5, b.y + b.vy * dt);
            b.z += b.vz * dt;
            b.ph += dt * 26;
            put(
              c[0] + b.x,
              c[1] + b.y,
              c[2] + b.z,
              Math.atan2(b.vx, -b.vz),
              0.75,
              b.ph,
              0,
              this.birdRows.bat,
              4,
              0,
              bt.fade,
            );
          }
        }
      }
      const geo = this.birdMesh.geometry;
      geo.instanceCount = n;
      geo.attributes.iPos.needsUpdate = true;
      geo.attributes.iInfo.needsUpdate = true;
      geo.attributes.iYaw.needsUpdate = true;
      this.birdU.uTanHalf.value = Math.tan((this.camera.fov * Math.PI) / 360);
      this.birdU.uViewH.value = this.H || 240;
    },

    // ---------- herds ----------
    spawnHerd(env, force = null) {
      const T = this.T,
        R = this.R,
        rnd = Math.random;
      const people = env.owner >= 0 ? this.story.peoples[env.owner] : null;
      // somewhere out of sight, unless you have only just arrived
      const facing = -this.yaw;
      let c = null;
      const S = {};
      const smallOne = !!(force && force.small);
      for (let k = 0; k < 6 && !c; k++) {
        const a =
          rnd() < 0.5 ? rnd() * 6.28 : facing + Math.PI + (rnd() - 0.5) * 2.6;
        const q = this.faunaSpot(
          a,
          smallOne ? 45 + rnd() * 50 : 200 + rnd() * 220,
        );
        this.ground.sample(q[0], q[1], q[2], 2, S);
        if (
          S.h < 1.5 ||
          !(smallOne ? SMALL_LAND[S.biome] : HERD_LAND[S.biome] > 0)
        )
          continue;
        const F = frameAt(q);
        let steep = false;
        for (const [e, nn] of [
          [10, 0],
          [-10, 0],
          [0, 10],
          [0, -10],
        ]) {
          const d = stepOn(q, F, e, nn, R);
          if (Math.abs(this.ground.height(d[0], d[1], d[2], 2) - S.h) > 4.5)
            steep = true;
        }
        if (steep) continue;
        let busy = false;
        for (const tw of this.towns.values())
          if (arcM(q, tw.s.dir, R) < 600) busy = true;
        if (this.siteNear)
          for (const s of this.siteNear)
            if (arcM(q, s.dir, R) < 140) busy = true;
        if (!busy) c = q;
      }
      if (!c) return;
      const gz = smallOne
        ? smallFor(S.biome, S.T, force.kind)
        : force
          ? grazerFor(force.beast, force.biome)
          : grazerFor(people && people.beast, S.biome);
      if (!gz) return;
      const P = gz.plan,
        r = (col) => this.row(col);
      const rows = {
        main: r(P.col),
        belly: r(P.belly),
        hoof: r([46, 38, 34]),
        horn: r(P.horn),
        eye: r([22, 18, 18]),
        shell: r(P.shell || P.col),
        spot: r(P.spots || P.col),
        shadow: this.shadowRow,
      };
      const pr = grazerProto(P, rows, mulberry32(hashStr(gz.name)));
      const d = pr.mb.finish();
      this.syncRamps();
      const geo = new T.BufferGeometry();
      geo.setAttribute("position", new T.BufferAttribute(d.p, 3));
      geo.setAttribute("normal", new T.BufferAttribute(d.n, 3));
      geo.setAttribute("aRow", new T.BufferAttribute(d.r, 1));
      geo.setAttribute("aRow2", new T.BufferAttribute(d.r2, 1));
      geo.setAttribute("aUv", new T.BufferAttribute(d.uv, 2));
      geo.setAttribute("aPat", new T.BufferAttribute(d.t, 1));
      geo.setAttribute("aLv", new T.BufferAttribute(d.lv, 1));
      geo.setAttribute("aBone", new T.BufferAttribute(d.b, 1));
      geo.setAttribute("aPivot", new T.BufferAttribute(d.pv, 3));
      geo.computeBoundingSphere();
      const F = frameAt(c);
      const hd = {
        fade: this.faunaFresh ? 1 : 0,
        c,
        F,
        name: gz.name,
        own: gz.own,
        geo,
        pr,
        plan: P,
        animals: [],
        state: "calm",
        t: 0,
        t0: 1,
        said: smallOne,
        drift: 10 + rnd() * 20,
        de: 0,
        dn: 0,
        small: smallOne,
      };
      const n = P.herd[0] + Math.floor(rnd() * (P.herd[1] - P.herd[0] + 1));
      for (let k = 0; k < n; k++) {
        const young = k >= 2 && rnd() < 0.28;
        const x = (rnd() - 0.5) * 26,
          z = (rnd() - 0.5) * 26,
          dir = stepOn(c, F, x, -z, R);
        const U = {
          ...this.uniforms,
          uPhase: { value: 0 },
          uAmp: { value: 0 },
          uHeadPitch: { value: pr.graze },
          uHeadYaw: { value: 0 },
          uTail: { value: 0 },
          uBob: { value: 0 },
          uFadeIn: { value: 0 },
          uHit: { value: 0 },
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
        hd.animals.push({
          dir,
          F: frameAt(dir),
          h: this.ground.height(dir[0], dir[1], dir[2], 1),
          hAt: dir,
          face: rnd() * 6.28,
          mesh,
          U,
          young,
          scale: young ? 0.55 + rnd() * 0.1 : 0.88 + rnd() * 0.2,
          state: "graze",
          t: rnd() * 6,
          phase: rnd() * 6,
          walk: 0,
          pitch: pr.graze,
          hyaw: 0,
          hyawTo: 0,
          tailT: rnd() * 6,
          run: P.run * (0.9 + rnd() * 0.2),
          off: (rnd() - 0.5) * 0.5,
          m: 1e9,
          x: 0,
          z: 0,
          tgt: null,
          hp: Math.round((10 + P.h * 14) * (young ? 0.6 : 1)),
          hitT: 0,
        });
        hd.animals[hd.animals.length - 1].max =
          hd.animals[hd.animals.length - 1].hp;
      }
      this.herds.push(hd);
    },
    dropHerd(hd) {
      for (const a of hd.animals) {
        this.scene.remove(a.mesh);
        a.mesh.material.dispose();
      }
      hd.gone = true;
      // (a carcass of theirs may still be lying there, on the same body)
      if (!(this.carcasses || []).some((c) => c.geo === hd.geo))
        hd.geo.dispose();
    },
    // something frightened them: away from you, all together
    startleHerd(hd, longer = false) {
      const rnd = Math.random;
      hd.state = "flee";
      hd.t = (longer ? 10 : 6) + rnd() * 3;
      hd.t0 = hd.t;
      hd.dirFlee = bearingTo(this.p, hd.c);
      for (const a of hd.animals) a.state = "run";
      if (!hd.said) {
        hd.said = true;
        this.faunaNews = `The ${hd.name} startle and run`;
      }
    },
    // a point in a herd's own metres (x east, z south)
    herdLocal(hd, d) {
      const q = [d[0] - hd.c[0], d[1] - hd.c[1], d[2] - hd.c[2]];
      return [
        (q[0] * hd.F.e[0] + q[1] * hd.F.e[1] + q[2] * hd.F.e[2]) * this.R,
        -(q[0] * hd.F.n[0] + q[1] * hd.F.n[1] + q[2] * hd.F.n[2]) * this.R,
      ];
    },
    stepHerds(dt, nowS) {
      const R = this.R,
        p = this.p,
        ev = this.events || {},
        rnd = Math.random;
      const tanHalf = Math.tan((this.camera.fov * Math.PI) / 360),
        Hpx = this.H || 240;
      for (let i = this.herds.length - 1; i >= 0; i--) {
        const hd = this.herds[i],
          pr = hd.pr;
        let near = Infinity,
          mx = 0,
          mz = 0;
        for (const a of hd.animals) {
          a.m = arcM(p, a.dir, R);
          near = Math.min(near, a.m);
          const [x, z] = this.herdLocal(hd, a.dir);
          a.x = x;
          a.z = z;
          mx += x;
          mz += z;
        }
        // they come into sight slowly, and go out of it the same way
        hd.fade =
          near > (hd.small ? 180 : 900)
            ? (hd.fade ?? 1) - dt / 2
            : Math.min(1, (hd.fade ?? 0) + dt / 2.5);
        if (
          near > (hd.small ? 260 : 1300) ||
          (near > (hd.small ? 180 : 900) && hd.fade <= 0)
        ) {
          this.dropHerd(hd);
          this.herds.splice(i, 1);
          continue;
        }
        // the herd's middle follows its animals
        mx /= hd.animals.length;
        mz /= hd.animals.length;
        if (Math.hypot(mx, mz) > 4) {
          hd.c = stepOn(hd.c, hd.F, mx, -mz, R);
          hd.F = frameAt(hd.c);
          for (const a of hd.animals) {
            const [x, z] = this.herdLocal(hd, a.dir);
            a.x = x;
            a.z = z;
          }
        }
        // you: noticed, then fled from (sooner if you come running)
        const alertM = this.tame ? 0 : ev.running ? 80 : 45,
          fleeM = (ev.running ? 42 : 22) * (hd.small ? 0.7 : 1);
        if (hd.state !== "flee" && near < fleeM && !this.journey && !this.tame)
          this.startleHerd(hd);
        else if (hd.state === "calm" && near < alertM) hd.state = "alert";
        else if (hd.state === "alert" && near > alertM * 1.3) hd.state = "calm";
        if (hd.state === "flee") {
          hd.t -= dt;
          // run round water and cliffs, not into them
          hd.look = (hd.look || 0) - dt;
          if (hd.look <= 0) {
            hd.look = 0.3;
            const lead = hd.animals[0];
            const ok = (b) => {
              const q = stepOn(
                  lead.dir,
                  lead.F,
                  Math.sin(b) * 9,
                  Math.cos(b) * 9,
                  R,
                ),
                h = this.ground.height(q[0], q[1], q[2], 2);
              return h > 0.4 && Math.abs(h - lead.h) < 5;
            };
            if (!ok(hd.dirFlee))
              for (const turn of [0.6, -0.6, 1.2, -1.2, 1.9, -1.9, 2.6, -2.6])
                if (ok(hd.dirFlee + turn)) {
                  hd.dirFlee += turn;
                  break;
                }
          }
          if (hd.t <= 0) {
            hd.state = "calm";
            for (const a of hd.animals) {
              a.state = "look";
              a.t = 1 + rnd() * 3;
            }
          }
        } else {
          // a calm herd drifts slowly across its grazing
          hd.drift -= dt;
          if (hd.drift <= 0) {
            hd.drift = 15 + rnd() * 25;
            const b = rnd() * 6.28;
            hd.de = Math.sin(b) * 8;
            hd.dn = Math.cos(b) * 8;
          }
        }
        const toYou = bearingTo(hd.c, p);
        // one hurt by an arrow bleeds as it goes, and falls when it can go no further
        let fell = null;
        for (const a of hd.animals) {
          this.stepAnimal(hd, a, dt, toYou);
          if (a.bleed && (a.hp -= a.bleed * dt) <= 0)
            (fell = fell || []).push(a);
        }
        if (fell)
          for (const a of fell) {
            const c = this.killPrey(hd, a);
            if (c) {
              const m = arcM(p, c.dir, R);
              this.faunaNews =
                m > 30
                  ? `The wounded ${c.name} falls, ${Math.round(m / 10) * 10} m to the ${bearingWord(p, c.dir)}`
                  : `The ${c.name} falls`;
            }
          }
        if (hd.gone) continue;
        // keep a little room between them
        const A = hd.animals;
        for (let j = 0; j < A.length; j++)
          for (let k = j + 1; k < A.length; k++) {
            const dx = A[k].x - A[j].x,
              dz = A[k].z - A[j].z,
              dd = Math.hypot(dx, dz),
              want = pr.rad * (A[j].scale + A[k].scale) * 1.1;
            if (dd >= want || dd < 1e-4) continue;
            const push = ((want - dd) * 0.5) / dd;
            A[j].x -= dx * push;
            A[j].z -= dz * push;
            A[k].x += dx * push;
            A[k].z += dz * push;
            A[j].moved = A[k].moved = true;
          }
        for (const a of A) {
          if (a.moved) {
            a.dir = stepOn(hd.c, hd.F, a.x, -a.z, R);
            a.F = frameAt(a.dir);
            a.moved = false;
          }
          // the ground under it, when it has moved far enough to matter
          if (arcM(a.dir, a.hAt, R) > 0.25) {
            a.h = this.ground.height(a.dir[0], a.dir[1], a.dir[2], 1);
            a.hAt = a.dir;
          }
          a.mesh.visible = a.m < 1000;
          if (!a.mesh.visible) continue;
          this.placeMatrix(
            a.mesh,
            a.dir,
            a.F,
            Math.max(-0.4, a.h),
            a.face + Math.PI,
          );
          // far off, a herd is a few dots on the grass rather than nothing at all
          const mpp = (2 * tanHalf * a.m) / Hpx;
          let k = Math.max(1, (3 * mpp) / (pr.len * a.scale));
          if (a.m > 450) k = 1 + (k - 1) * Math.max(0, 1 - (a.m - 450) / 400);
          const sc = a.scale * k,
            e = a.mesh.matrix.elements;
          a.sc = sc;
          for (const j of [0, 1, 2, 4, 5, 6, 8, 9, 10]) e[j] *= sc;
          const U = a.U;
          a.hitT = Math.max(0, (a.hitT || 0) - dt);
          U.uHit.value = a.hitT > 0 ? a.hitT / 0.2 : 0;
          U.uFadeIn.value = hd.fade;
          U.uPhase.value = a.phase;
          U.uAmp.value = a.walk;
          U.uHeadPitch.value = a.pitch;
          U.uHeadYaw.value = a.hyaw;
          U.uBob.value = a.walk > 0.45 ? (a.walk - 0.45) * pr.H * 0.12 : 0;
          a.tailT -= dt;
          U.uTail.value =
            a.tailT < 0 ? Math.sin(nowS * 11 + a.off * 9) * 0.45 : 0;
          if (a.tailT < -1.2) a.tailT = 2 + rnd() * 7;
        }
      }
    },
    // one animal's moment: grazing, stepping on, looking up, or running
    stepAnimal(hd, a, dt, toYou) {
      const rnd = Math.random,
        pr = hd.pr;
      a.t -= dt;
      let speed = 0,
        amp = 0,
        pitchTo = pr.graze;
      a.hyawTo = 0;
      if (hd.state === "flee") {
        // run together, heads up, away from you; slow to a trot as it ends
        const k = hd.t / hd.t0;
        a.face = turnTo(a.face, hd.dirFlee + a.off, dt * 3);
        speed =
          a.run *
          Math.min(1, (hd.t0 - hd.t) * 2 + 0.3) *
          (k < 0.25 ? 0.35 + k * 2.6 : 1) *
          (a.bleed ? 0.75 : 1);
        amp = speed > 5 ? 0.75 : 0.4;
        pitchTo = -0.25;
      } else {
        if (hd.state === "alert" && a.state === "graze" && rnd() < dt * 1.5) {
          a.state = "look";
          a.t = 2 + rnd() * 3;
        }
        switch (a.state) {
          case "run":
            a.state = "graze";
            a.t = 2;
            break;
          case "graze":
            if (a.t <= 0) {
              const r = rnd();
              if (r < 0.55) {
                // a step or two to new grass, keeping near the others (the young near the first of them)
                let tx, tz;
                const mom = a.young ? hd.animals[0] : null;
                if (mom) {
                  tx = mom.x + (rnd() - 0.5) * 4;
                  tz = mom.z + (rnd() - 0.5) * 4;
                } else if (Math.hypot(a.x, a.z) > 14) {
                  tx = a.x * 0.6 + (rnd() - 0.5) * 6;
                  tz = a.z * 0.6 + (rnd() - 0.5) * 6;
                } else {
                  const b = a.face + (rnd() - 0.5) * 1.6,
                    s = 1 + rnd() * 3;
                  tx = a.x + Math.sin(b) * s;
                  tz = a.z - Math.cos(b) * s;
                }
                tx += hd.de * 0.3;
                tz -= hd.dn * 0.3;
                // not into water: back towards the others instead, and the herd turns about
                const q = stepOn(hd.c, hd.F, tx, -tz, this.R);
                if (this.ground.height(q[0], q[1], q[2], 2) < 0.5) {
                  tx = a.x * 0.3;
                  tz = a.z * 0.3;
                  hd.de = -hd.de;
                  hd.dn = -hd.dn;
                }
                a.tgt = [tx, tz];
                a.state = "step";
                a.t = 8;
              } else if (r < 0.8) {
                a.state = "look";
                a.t = 1.5 + rnd() * 2.5;
                a.lookYaw = (rnd() - 0.5) * 1.4;
              } else a.t = 3 + rnd() * 6;
            }
            break;
          case "step": {
            const dx = a.tgt[0] - a.x,
              dz = a.tgt[1] - a.z,
              dd = Math.hypot(dx, dz);
            if (dd < 0.3 || a.t <= 0) {
              a.state = "graze";
              a.t = 3 + rnd() * 7;
              break;
            }
            a.face = turnTo(a.face, Math.atan2(dx, -dz), dt * 2.5);
            speed = 0.75 * (a.young ? 1.2 : 1) * (hd.plan.amble || 1);
            amp = 0.3;
            pitchTo = pr.graze * 0.3;
            break;
          }
          case "look":
            pitchTo = -0.12;
            // when you are near, they look at you
            if (hd.state === "alert") {
              const rel = Math.atan2(
                Math.sin(toYou - a.face),
                Math.cos(toYou - a.face),
              );
              a.hyawTo = Math.max(-0.9, Math.min(0.9, rel));
            } else a.hyawTo = a.lookYaw || 0;
            if (a.t <= 0) {
              if (hd.state === "alert" && rnd() < 0.6) a.t = 1 + rnd() * 2;
              else {
                a.state = "graze";
                a.t = 2 + rnd() * 6;
              }
            }
            break;
        }
      }
      if (speed > 0) {
        const s = speed * dt * a.scale ** 0.3;
        a.x += Math.sin(a.face) * s;
        a.z -= Math.cos(a.face) * s;
        a.moved = true;
        a.phase += (s * Math.PI * 2) / (pr.legH * a.scale * (1.2 + 5 * amp));
      }
      a.walk += (amp - a.walk) * Math.min(1, dt * 5);
      a.pitch +=
        (pitchTo - a.pitch) * Math.min(1, dt * (hd.state === "flee" ? 6 : 2.5));
      a.hyaw += (a.hyawTo - a.hyaw) * Math.min(1, dt * 3);
    },
    // ---------- hunting ----------
    // A beast's parts (see grazerProto) in the metres of a frame at o: x east, y up from sea level, z south.
    // b: { dir, h, face, pitch }; sc: its size as drawn; lift and lunge move it up and forward.
    beastParts(b, pr, sc, o, F, lift = 0, lunge = 0) {
      const R = this.R,
        d0 = b.dir[0] - o[0],
        d1 = b.dir[1] - o[1],
        d2 = b.dir[2] - o[2];
      const bx = (d0 * F.e[0] + d1 * F.e[1] + d2 * F.e[2]) * R,
        bz = -(d0 * F.n[0] + d1 * F.n[1] + d2 * F.n[2]) * R;
      const cf = Math.cos(b.face),
        sf = Math.sin(b.face),
        P = pr.parts,
        S = P.S,
        a = b.pitch ?? pr.graze,
        ca = Math.cos(a),
        sa = Math.sin(a);
      const out = [];
      const put = (q, name, turn) => {
        let y = q[1],
          z = q[2];
        // the head and neck bow about the shoulder, as the shader bows them
        if (turn) {
          const qy = y - S[1],
            qz = z - S[2];
          y = S[1] + qy * ca - qz * sa;
          z = S[2] + qy * sa + qz * ca;
        }
        z += lunge;
        // its own x is east −cos f, north sin f; its own z (forward) is east sin f, north cos f
        const east = sc * (-q[0] * cf + z * sf),
          north = sc * (q[0] * sf + z * cf);
        out.push([
          bx + east,
          b.h + lift + sc * y,
          bz - north,
          q[3] * sc,
          q[4],
          name,
        ]);
      };
      put(P.head, "head", true);
      put(P.neck, "neck", true);
      for (const q of P.body) put(q, "body", false);
      return out;
    },
    // An arrow (or a blow) finds one of a herd. Hurt badly enough it falls where it is; hurt less, it
    // runs with the others, bleeding, and falls further on. stuck: the arrow left in it, to find again.
    hitPrey(hd, a, dmg, stuck = null) {
      if (!hd || !a || a.hp <= 0 || !hd.animals.includes(a)) return null;
      a.hp -= dmg;
      a.hitT = 0.2;
      if (stuck) (a.arrows = a.arrows || []).push(stuck);
      if (a.hp <= 0) return { down: true, c: this.killPrey(hd, a) };
      a.bleed = Math.max(a.bleed || 0, 1.4);
      hd.said = true;
      if (hd.state !== "flee") this.startleHerd(hd, true);
      return { down: false, name: singularOf(hd.name) };
    },
    killPrey(hd, a) {
      const i = hd.animals.indexOf(a);
      if (i < 0) return null;
      hd.animals.splice(i, 1);
      const h = hd.plan.h * a.scale;
      const c = this.addCarcass({
        dir: a.dir,
        F: a.F,
        h: a.h,
        face: a.face,
        pitch0: a.pitch,
        mesh: a.mesh,
        U: a.U,
        geo: hd.geo,
        owner: hd,
        pr: hd.pr,
        sc: a.scale,
        name: singularOf(hd.name),
        size:
          h >= 1.5 ? "big" : h >= 1.05 ? "medium" : h >= 0.5 ? "small" : "tiny",
        young: !!a.young,
        arrows: a.arrows || [],
        kind: "prey",
      });
      if (!hd.animals.length) {
        const j = this.herds.indexOf(hd);
        if (j >= 0) this.herds.splice(j, 1);
        hd.gone = true;
      } else {
        hd.said = true;
        if (hd.state !== "flee") this.startleHerd(hd, true);
      }
      return c;
    },
    // ---------- what is left of a beast: lying on its side until you butcher it, or leave it ----------
    addCarcass(o) {
      const c = {
        id: "c" + Math.floor(Math.random() * 1e9).toString(36),
        t: 0,
        life: 0,
        roll: Math.random() < 0.5 ? 1 : -1,
        ...o,
      };
      const U = c.U;
      U.uAmp.value = 0;
      U.uBob.value = 0;
      U.uTail.value = 0;
      U.uHeadYaw.value = 0;
      U.uHit.value = 0.6;
      U.uFadeIn.value = 1;
      if (U.uEyes) U.uEyes.value = 0;
      c.mesh.visible = true;
      (this.carcasses = this.carcasses || []).push(c);
      return c;
    },
    dropCarcass(c) {
      this.scene.remove(c.mesh);
      c.mesh.material.dispose();
      // the body it shares with its herd (or pack) goes when nothing uses it any more
      if (
        c.owner &&
        c.owner.gone &&
        !(this.carcasses || []).some((o) => o !== c && o.geo === c.geo)
      )
        c.geo.dispose();
    },
    stepCarcasses(dt) {
      const L = this.carcasses;
      if (!L || !L.length) return;
      const T = this.T,
        M = this.carcM || (this.carcM = [new T.Matrix4(), new T.Matrix4()]);
      for (let i = L.length - 1; i >= 0; i--) {
        const c = L[i];
        c.t += dt;
        c.life += dt;
        const m = arcM(this.p, c.dir, this.R);
        // left lying long enough, or far enough behind you, and something else has it
        if (m > 600 || c.life > 1800) {
          L.splice(i, 1);
          this.dropCarcass(c);
          continue;
        }
        c.mesh.visible = m < 450;
        if (!c.mesh.visible) continue;
        const k = easeK(c.t / 0.7),
          pr = c.pr,
          yc = pr.bodyY + pr.bodyH * 0.5,
          lo = yc - pr.hw * 1.05;
        this.placeMatrix(
          c.mesh,
          c.dir,
          c.F,
          Math.max(-0.4, c.h),
          c.face + Math.PI,
        );
        // its size, then rolled onto its side about the middle of its body and let down onto the ground
        M[0].makeScale(c.sc, c.sc, c.sc);
        c.mesh.matrix.multiply(M[0]);
        M[0].makeTranslation(0, yc - lo * k, 0);
        M[1].makeRotationZ((c.roll * k * Math.PI) / 2);
        M[0].multiply(M[1]);
        M[1].makeTranslation(0, -yc, 0);
        M[0].multiply(M[1]);
        c.mesh.matrix.multiply(M[0]);
        const p0 = c.pitch0 ?? 0;
        c.U.uHeadPitch.value = p0 + (0.3 - p0) * k;
        c.U.uHit.value = Math.max(0, c.U.uHit.value - dt * 3);
      }
    },
    // for the prompt: where a carcass's body lies, and how big it is
    carcassAim(c) {
      return {
        alt: c.h + c.pr.hw * 1.05 * c.sc,
        rad: Math.max(0.45, c.pr.len * c.sc * 0.42),
      };
    },
    butcher(c) {
      const i = (this.carcasses || []).indexOf(c);
      if (i < 0) return null;
      this.carcasses.splice(i, 1);
      this.dropCarcass(c);
      return c;
    },
    // for looking around from high up: the herds you can see
    herdWords() {
      if (!this.herds) return [];
      // like with like: "two herds of antelope are grazing"
      const groups = new Map();
      for (const hd of this.herds) {
        const m = arcM(this.p, hd.c, this.R);
        if (m > 1400 || hd.small) continue;
        const key = [
          bearingWord(this.p, hd.c),
          m < 250 ? "close by" : "down on the land",
          hd.name,
          hd.state === "flee" ? "running" : "grazing",
        ].join("|");
        groups.set(key, (groups.get(key) || 0) + 1);
      }
      const out = [];
      for (const [key, n] of groups) {
        const [way, how, name, doing] = key.split("|");
        out.push(
          `To the ${way}, ${how}, ${n > 1 ? `${["", "", "two", "three"][n] || n} herds of ${name} are` : `a herd of ${name} is`} ${doing}.`,
        );
      }
      return out;
    },
  });

  // ---- view/lights.js ----
  // ============================================================
  // LIGHTS — the lamps that light the world around them after dark.
  // Every place keeps a list of its lights (lanterns, torches, braziers, fires,
  // the lamps inside its rooms) in its own metres. Each frame the dozen nearest
  // that are lit are handed to the shaders, which add their warm light to the
  // ground, walls and people around them; the farthest of those fade, so no
  // pool of light pops in or out. All of one colour: firelight.
  // ============================================================

  // how far each kind of light reaches (m), how strong it is, how much it flickers
