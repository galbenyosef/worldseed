// index-inline-2 117 — math
// Lines 58995-60612 of readable/index-inline-2.pretty.js (statement-aligned).
  Object.assign(GroundView.prototype, {
    setHostiles() {
      this.clearHostiles();
      this.huntAt = 6;
      this.huntCool = 0;
    },
    clearHostiles() {
      for (const gr of this.hostiles || []) this.dropHunters(gr);
      this.hostiles = [];
      const F = this.fallen || [];
      this.fallen = [];
      for (const f of F) this.dropFallen(f);
    },
    dropHunters(gr) {
      for (const h of gr.members) {
        this.scene.remove(h.mesh);
        h.mesh.material.dispose();
        if (h.geo) h.geo.dispose();
      }
      gr.members = [];
      gr.gone = true;
      if (gr.geo && !this.geoInUse(gr.geo)) gr.geo.dispose();
    },
    // one leaving the hunt (out of sight, or gone)
    dropHunter(gr, h) {
      this.scene.remove(h.mesh);
      h.mesh.material.dispose();
      if (h.geo) h.geo.dispose();
    },
    // is a body still drawn by something: a carcass, one falling, one of a group?
    geoInUse(geo) {
      return (
        (this.carcasses || []).some((c) => c.geo === geo) ||
        (this.fallen || []).some((f) => f.geo === geo || f.shared === geo) ||
        (this.hostiles || []).some((g) => g.geo === geo && g.members.length)
      );
    },

    // ---------- safe places: towns, farms, inns, camps, your own house ----------
    // (the ones near you, looked up again when you have moved on a way; a farm that has been lost is no refuge)
    havensNear() {
      const R = this.R,
        p = this.p;
      if (
        this.havenList &&
        this.havenFrom &&
        arcM(this.havenFrom, p, R) < 250 &&
        !this.sitesDirty &&
        this.havenFor === this.siteNear
      )
        return this.havenList;
      const L = [];
      for (const tw of this.towns.values())
        if (arcM(p, tw.s.dir, R) < 6000)
          L.push({ dir: tw.s.dir, r: townRadius(tw.s) + 250 });
      if (this.siteNear)
        for (const s of this.siteNear)
          if (
            (SITE_LIVED.has(s.kind) ||
              s.kind === "home" ||
              s.kind === "hermit") &&
            !(this.siteLost && this.siteLost(s.id)) &&
            arcM(p, s.dir, R) < 2500
          )
            L.push({ dir: s.dir, r: HAVEN_SITE });
      this.havenList = L;
      this.havenFrom = p.slice();
      this.havenFor = this.siteNear;
      return L;
    },
    havenAt(d, margin = 0) {
      const R = this.R;
      for (const hv of this.havensNear())
        if (arcM(d, hv.dir, R) < hv.r + margin) return true;
      return false;
    },
    // a lit fire close to d
    fireNear(d, m) {
      if (!this.world) return null;
      for (const pl of this.world.placed)
        if (
          pl.kind === "campfire" &&
          (pl.fuel || 0) > 0 &&
          arcM(d, pl.dir, this.R) < m
        )
          return pl;
      return null;
    },

    // ---------- now and then, something comes ----------
    huntCensus(dt) {
      this.huntAt = (this.huntAt ?? 6) - dt;
      if (this.huntAt > 0) return;
      this.huntAt = 12;
      // (in the city that fell, after dark, its own dead walk its streets: whatever else is abroad, they come)
      if (this.deadCityCensus && this.deadCityCensus()) return;
      const th = this.threat;
      // (on a night of vigil, what comes, comes for the vigil)
      if (
        !th ||
        !(th.k > 0) ||
        this.cave ||
        this.journey ||
        this.tame ||
        this.wake ||
        this.vigil ||
        !this.siteIx
      )
        return;
      this.huntCool = Math.max(0, (this.huntCool || 0) - 12);
      const env = this.siteIx.envAt(this.p);
      if (env.h < 0.5 || this.havenAt(this.p, 80)) return;
      const night = this.uniforms.uDark.value > 0.5,
        lv = th.level || 0;
      const active = this.hostiles.filter((g) => g.mode === "hunt").length;
      if (
        active >= (night && (th.k >= 1.4 || lv >= 3) ? 2 : 1) ||
        this.huntCool > 0
      )
        return;
      const pick = this.huntPick(env, night, lv);
      if (!pick) return;
      if (
        Math.random() <
        (night ? 0.16 : 0.05) * pick.k * th.k * (1 + 0.15 * lv)
      )
        this.spawnHunters(env, pick.land, night, pick.kind, pick);
    },
    // the city that fell: by day quiet (nothing comes there, not even the land's own hunters); after dark, its
    // dead get up out of the rubble a group at a time. True while you are inside its walls.
    deadCityCensus() {
      const dc = this.siteIx && this.siteIx.deadCity;
      if (
        !dc ||
        !dc.dir ||
        this.cave ||
        this.journey ||
        this.wake ||
        this.vigil ||
        this.tame
      )
        return false;
      if (arcM(this.p, dc.dir, this.R) > CITY.out + 30) return false;
      if (this.uniforms.uDark.value <= 0.5) return true;
      if (
        this.hostiles.some(
          (g) => g.cityDead && g.members.length && g.mode === "hunt",
        )
      )
        return true;
      this.cityDeadCool = Math.max(0, (this.cityDeadCool || 0) - 12);
      if (this.cityDeadCool > 0 || Math.random() > 0.6) return true;
      const env = this.siteIx.envAt(this.p);
      const gr = this.spawnHunters(env, null, true, "dead", {
        at: dc.dir,
        n: 3 + Math.floor(Math.random() * 3),
        census: true,
      });
      if (gr) {
        gr.cityDead = true;
        gr.label = `The dead of ${(this.story.city && this.story.city.name) || "the city"}`;
        this.cityDeadCool = 48;
      }
      return true;
    },
    // what comes: the story's own creatures (more the nearer its heart, and every time its clock comes round),
    // raiders near the roads after dark, or the land's own hunters
    huntPick(env, night, lv) {
      const th = this.threat || {},
        rnd = Math.random,
        arc = th.arc;
      const sk = arc ? STORY_KIND[arc.kind] : null;
      if (
        sk &&
        (!HUNTER[sk].night || night) &&
        (sk !== "drowned" || Math.abs(env.coastKm ?? 99) < 4)
      ) {
        const km = th.heart ? arcM(this.p, th.heart, this.R) / 1000 : 1e9;
        const share = Math.min(
          0.9,
          Math.min(0.6, 0.15 + 0.1 * lv) * (1 + 2 * Math.max(0, 1 - km / 1500)),
        );
        if (rnd() < share) return { kind: sk, story: true, k: 1, land: null };
      }
      if (night && this.siteIx.roadNear(this.p, 500) && rnd() < 0.35)
        return { kind: "raider", k: 1, land: null };
      const land = HUNT_LAND[env.biome];
      return land ? { kind: null, k: land.k, land } : null;
    },
    spawnHunters(env, land, night, force = null, pick = {}) {
      const T = this.T,
        R = this.R,
        rnd = Math.random;
      let kind = force;
      if (!kind && land) {
        const wet = land.croc && this.waterNear && this.waterNear(this.p, 120);
        const kinds = LAND_KINDS.filter(
          (k) =>
            land[k] && (k !== "croc" || wet) && (!HUNTER[k].night || night),
        );
        let r = rnd() * kinds.reduce((a, k) => a + land[k], 0);
        for (const k of kinds)
          if ((r -= land[k]) <= 0) {
            kind = k;
            break;
          }
      }
      kind = kind || "wolf";
      const K = HUNTER[kind];
      if (!K) return null;
      // from behind you, out of sight (on a vigil: out of the dark all round the place you keep)
      let c = null;
      const facing = -this.yaw,
        base = pick.at || this.p;
      if (K.water)
        for (let k = 0; k < 24 && !c; k++) {
          const a = rnd() * Math.PI * 2,
            m = 25 + rnd() * 55,
            q = stepOn(
              base,
              frameAt(base),
              Math.sin(a) * m,
              Math.cos(a) * m,
              R,
            );
          const gh = this.ground.height(q[0], q[1], q[2], 2);
          if (
            gh > 0.15 &&
            gh < 2.5 &&
            this.waterNear(q, 14) &&
            !this.havenAt(q)
          )
            c = q;
        }
      if (K.water && !c) return null;
      if (K.guard && !pick.at)
        for (let k = 0; k < 12 && !c; k++) {
          const a = facing + (rnd() - 0.5) * 2.4,
            m = 28 + rnd() * 18,
            q = stepOn(
              base,
              frameAt(base),
              Math.sin(a) * m,
              Math.cos(a) * m,
              R,
            );
          if (this.ground.height(q[0], q[1], q[2], 2) > 0.6 && !this.havenAt(q))
            c = q;
        }
      for (let k = 0; k < 12 && !c; k++) {
        const a = pick.at
          ? rnd() * Math.PI * 2
          : facing + Math.PI + (rnd() - 0.5) * 2.6;
        const m = pick.at
          ? 55 + rnd() * 25
          : force && !pick.story && pick.kind !== "raider" && !pick.census
            ? 45 + rnd() * 15
            : 85 + rnd() * 60;
        const q = stepOn(
          base,
          frameAt(base),
          Math.sin(a) * m,
          Math.cos(a) * m,
          R,
        );
        if (this.ground.height(q[0], q[1], q[2], 2) < 0.6 || this.havenAt(q))
          continue;
        c = q;
      }
      if (!c) return null;
      const th = this.threat || { k: 1, dmg: 1 },
        lv = th.level || 0;
      const span = night ? K.nightPack : K.pack;
      let n = span[0] + Math.floor(rnd() * (span[1] - span[0] + 1));
      if ((kind === "wolf" || kind === "frostwolf") && th.k >= 1.4) n++;
      if (kind === "wolf" && th.k <= 0.6) n = Math.max(2, n - 1);
      if (STORY_KIND[th.arc && th.arc.kind] === kind) n += Math.floor(lv / 2);
      if (pick.n) n = pick.n;
      n = Math.min(n, 7);
      const gr = {
        id: "h" + Math.floor(rnd() * 1e9).toString(36),
        kind,
        K,
        body: K.body,
        members: [],
        mode: "hunt",
        seen: false,
        fireT: 0,
        spin: (rnd() < 0.5 ? -1 : 1) * (0.12 + rnd() * 0.1),
        start: n,
        night: night || !!K.night,
        dmgK: th.dmg || 1,
        geo: null,
        pr: null,
        story: !!pick.story,
        vigil: !!pick.vigil,
      };
      this.huntNames(gr, env);
      // the bodies: a beast's is shared by the pack; people and the dead each have their own
      if (gr.body === "beast") {
        const P = this.hunterPlan(kind, K, env);
        const r = (col) => this.row(col);
        const rows = {
          main: r(P.col),
          belly: r(P.belly),
          hoof: r([40, 34, 32]),
          horn: r(P.horn),
          eye: r([24, 20, 18]),
          shell: r(P.col),
          spot: r(P.spots || P.col),
          shadow: this.shadowRow,
        };
        gr.pr =
          K.shape === "scorpion"
            ? scorpionProto(P, rows)
            : grazerProto(P, rows, mulberry32(hashStr(gr.name)));
        gr.plan = P;
        gr.geo = this.boneGeo(gr.pr.mb.finish());
      }
      const F = frameAt(c),
        seed0 = hashStr(gr.id);
      for (let k = 0; k < n; k++) {
        const dir = k
          ? stepOn(c, F, (rnd() - 0.5) * 9, (rnd() - 0.5) * 9, R)
          : c;
        let geo = gr.geo,
          pr = gr.pr,
          vs = ANIMAL_VS,
          own = null,
          height = 1;
        if (gr.body !== "beast") {
          const rng = new Rng((seed0 + k * 7919) >>> 0);
          if (gr.body === "dead") {
            height = 1.58 + rng.float() * 0.22;
            const M = mummyProto(
              height,
              this.deadRows(),
              (seed0 + k) >>> 0,
              {},
            );
            own = this.boneGeo(M.mesh.finish());
          } else {
            const look = this.manLook(kind, gr, rng, env);
            height = look.h;
            const M = personProto(look, this.lookRows(look));
            own = this.boneGeo(M.mesh.finish());
          }
          geo = own;
          pr = {
            parts: manParts(height),
            rad: 0.34,
            legH: height * 0.47,
            len: height,
            H: height,
            bodyY: height * 0.47,
            bodyH: height * 0.3,
            hw: 0.2,
          };
          if (!gr.pr) gr.pr = pr;
          vs = MUMMY_VS;
        }
        const U = {
          ...this.uniforms,
          uFadeIn: { value: 0 },
          uHit: { value: 0 },
          uEyes: { value: 0 },
          uEyeCol: { value: new T.Vector3(K.eyes[0], K.eyes[1], K.eyes[2]) },
        };
        if (gr.body === "beast")
          Object.assign(U, {
            uPhase: { value: 0 },
            uAmp: { value: 0 },
            uHeadPitch: { value: 0.2 },
            uHeadYaw: { value: 0 },
            uTail: { value: 0 },
            uTailP: { value: 0 },
            uBob: { value: 0 },
          });
        else
          Object.assign(U, {
            uArmL: { value: 0 },
            uArmR: { value: 0 },
            uLegL: { value: 0 },
            uLegR: { value: 0 },
            uHeadP: { value: 0 },
            uHeadY: { value: 0 },
          });
        const mesh = new T.Mesh(
          geo,
          new T.ShaderMaterial({
            uniforms: U,
            vertexShader: vs,
            fragmentShader: HOSTILE_FS,
            side: T.DoubleSide,
          }),
        );
        mesh.matrixAutoUpdate = false;
        mesh.frustumCulled = false;
        this.scene.add(mesh);
        const hp = Math.round((gr.hp || K.hp) * (0.9 + rnd() * 0.2));
        gr.members.push({
          gr,
          kind,
          K,
          dir,
          F: frameAt(dir),
          alt: this.ground.height(dir[0], dir[1], dir[2], 1),
          face: bearingTo(dir, this.p) + (rnd() - 0.5),
          mesh,
          U,
          geo: own,
          pr,
          hp,
          max: hp,
          dmg: (gr.dmg || K.dmg).map((x) => x * gr.dmgK),
          scale: gr.body === "beast" ? 0.92 + rnd() * 0.16 : 1,
          st: "roam",
          t0: 0,
          phase: rnd() * 6,
          walk: 0,
          pitch: 0.2,
          hyaw: 0,
          lunge: 0,
          crouch: 0,
          lean: 0,
          hitT: 0,
          poise: 0,
          fearCd: 0,
          cool: 1 + rnd() * 2,
          slot: (k / n) * Math.PI * 2 + rnd() * 0.4,
          fade: 0,
          m: 1e9,
          arrows: [],
          name: gr.name,
          home: dir.slice(),
        });
      }
      this.hostiles.push(gr);
      return gr;
    },
    boneGeo(d) {
      const T = this.T,
        geo = new T.BufferGeometry();
      for (const [nm, arr, n] of [
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
        geo.setAttribute(nm, new T.BufferAttribute(arr, n));
      geo.computeBoundingSphere();
      this.syncRamps();
      return geo;
    },
    // a beast's body as this land (or this story) has it
    hunterPlan(kind, K, env) {
      if (kind === "blighted") {
        const people = env.owner >= 0 ? this.story.peoples[env.owner] : null;
        const gz =
          grazerFor(people && people.beast, env.biome) ||
          grazerFor(null, B.FOREST);
        const grey = (c, k) => c.map((v) => Math.round(v * (1 - k) + 150 * k));
        return {
          ...gz.plan,
          col: grey(gz.plan.col, 0.75),
          belly: grey(gz.plan.belly, 0.6),
          spots: [184, 192, 160],
          spotN: 20,
          spotR: 0.05,
          eyePat: PAT.EYES,
          wool: true,
        };
      }
      const v = LAND_KINDS.includes(kind)
        ? hunterOf(kind, env.biome, env.T)
        : {};
      return {
        ...K.plan,
        ...(v.col ? { col: v.col } : {}),
        ...(v.belly ? { belly: v.belly } : {}),
        ...(v.spots ? { spots: v.spots, spotN: v.spotN, spotR: v.spotR } : {}),
        h: v.h || K.plan.h,
        len: v.len || K.plan.len,
      };
    },
    // what to call them: one, many, and what they are part of
    huntNames(gr, env) {
      const kind = gr.kind,
        arc = (this.threat && this.threat.arc) || {};
      let one,
        many,
        label = null,
        alarm = null;
      if (LAND_KINDS.includes(kind)) {
        const v = hunterOf(kind, env.biome, env.T);
        one = v.name;
        many = v.many;
        if (v.hp) gr.hp = v.hp;
        if (v.dmg) gr.dmg = v.dmg;
      } else if (kind === "frostwolf") {
        one = "frost wolf";
        many = "frost wolves";
        label = "The cold";
      } else if (kind === "ashhound") {
        one = "ash hound";
        many = "ash hounds";
        label = arc.antagonist
          ? `${arc.antagonist}’s brood`
          : "The dragon’s brood";
      } else if (kind === "blighted") {
        const people = env.owner >= 0 ? this.story.peoples[env.owner] : null,
          gz = grazerFor(people && people.beast, env.biome) || { name: "deer" };
        one = `grey ${singularOf(gz.name)}`;
        many = `grey ${gz.name}`;
        label = arc.antagonist
          ? `${arc.antagonist.replace(/^the /, "The ")}`
          : "The grey";
      } else if (kind === "raider") {
        one = "raider";
        many = "raiders";
        label = "Raiders";
      } else if (kind === "soldier") {
        if (arc.kind === "sundered") {
          const rival = this.story.peoples[arc.rival] || null;
          one = "warrior";
          many = rival ? `warriors of ${rival.name}` : "warriors";
          label = rival
            ? `${rival.name.replace(/^the /, "The ")} at war`
            : "A war-band";
          gr.people = rival;
        } else {
          // (riders are riders: "Three Riders of the Pale Lights", not soldiers of them)
          const hn = arc.antagonist || "",
            riders = /^the Riders\b/i.test(hn);
          one = riders ? "rider" : "soldier";
          many = riders
            ? hn.replace(/^the /, "")
            : hn
              ? `soldiers of ${hn}`
              : "soldiers";
          label = hn ? hn.replace(/^the /, "The ") : "Soldiers";
          gr.horde = hn;
        }
      } else if (kind === "drowned") {
        one = "drowned one";
        many = "drowned";
        label = "The drowned";
        alarm = "The drowned are walking";
      } else if (kind === "dead") {
        one = "restless dead";
        many = "dead";
        label = arc.antagonist ? `The dead of ${arc.antagonist}` : "The dead";
        alarm = "The dead are walking";
      }
      gr.name = one;
      gr.many = many;
      gr.label = label;
      gr.alarm = alarm;
    },
    // a person who means you harm: a raider masked and hooded, a soldier in the horde's colours, a warrior of a people at war, one of the drowned
    manLook(kind, gr, rng, env) {
      const people =
        gr.people || (env.owner >= 0 ? this.story.peoples[env.owner] : null);
      const look = folkLook(people, rng);
      look.pack = false;
      look.beard = look.beard && rng.chance(0.5);
      if (kind === "raider") {
        Object.assign(look, {
          mask: true,
          hat: rng.pick(["hood", "hood", "band"]),
          top: rng.pick(["tunic", "coat", "wrap"]),
          cloak: rng.chance(0.4),
          item: rng.pick(["blade", "axe", "club", "spear"]),
          shield: rng.chance(0.3) ? "round" : null,
        });
        const dk = (c) => c.map((v) => Math.round(v * 0.55 + 20));
        look.main = dk(look.main);
        look.under = dk(look.under);
        look.trim = rng.pick([
          [120, 44, 40],
          [64, 60, 66],
          [96, 80, 60],
        ]);
      } else if (kind === "soldier" && gr.horde) {
        const H = HORDE_LOOK.find((q) => q.re.test(gr.horde)) || HORDE_LOOK[4];
        Object.assign(look, {
          mask: true,
          hat: H.hat,
          item: H.item,
          shield: H.shield || null,
          cloak: !!H.cloak,
          crest: !!H.crest,
          main: H.main,
          trim: H.trim,
          under: H.under,
          top: "tunic",
          metal: H.metal,
        });
      } else if (kind === "soldier") {
        Object.assign(look, {
          hat: "helm",
          item: rng.pick(["spear", "spear", "blade", "axe"]),
          shield: rng.pick(["round", "tall"]),
          mask: false,
          top: look.top === "robe" ? "tunic" : look.top,
          crest: rng.chance(0.2),
        });
      } else if (kind === "drowned") {
        Object.assign(look, {
          skin: [124, 158, 148],
          hair: { style: "long", color: [36, 72, 54] },
          top: "wrap",
          main: [72, 94, 88],
          trim: [52, 98, 70],
          under: [84, 100, 96],
          hat: "none",
          item: "none",
          mask: false,
          cloak: false,
          beard: false,
          shield: null,
        });
      }
      return look;
    },
    // the haunted world's dead: grave-cloth gone grey, as if walked in for a long time
    deadRows() {
      if (this.dRows && this.dRowsFor === this.ramps) return this.dRows;
      const r = (c) => this.row(c);
      this.dRowsFor = this.ramps;
      this.dRows = {
        wrap: r([166, 172, 180]),
        wrapDark: r([108, 114, 128]),
        dry: r([72, 64, 70]),
        crown: r([200, 150, 72]),
      };
      return this.dRows;
    },

    // ---------- a frame of the hunt ----------
    stepHostiles(dt, nowS) {
      if (!this.hostiles) return;
      this.huntCensus(dt);
      this.stepFallen(dt);
      if (!this.hostiles.length) return;
      const R = this.R,
        p = this.p,
        ev = this.events || {},
        rnd = Math.random;
      const night = this.uniforms.uDark.value > 0.5,
        day = this.uniforms.uDay.value;
      const safe = this.havenAt(p),
        fire = this.fireNear(p, 5.5),
        ph = -this.yaw;
      const torch = !!this.heldTorch;
      for (let gi = this.hostiles.length - 1; gi >= 0; gi--) {
        const gr = this.hostiles[gi],
          K = gr.K;
        // you are somewhere safe, or it is morning and they walk by night: they give it up
        gr.dayT = gr.night && day > 0.7 ? (gr.dayT || 0) + dt : 0;
        if (
          gr.mode === "hunt" &&
          (safe ||
            (gr.dayT > 4 &&
              !gr.members.some(
                (h) =>
                  h.st === "charge" || h.st === "wind" || h.st === "strike",
              )))
        ) {
          gr.mode = "leave";
          gr.why = safe ? "safe" : "morning";
        }
        // sat by a fire: what keeps away from fire waits at its edge a while, then goes
        // (every beast but the dragon's cinder-hounds; people come on regardless, but not the drowned or the dead)
        // On a night of vigil they do not go: they wait at the edge of the light a while, then come on through it.
        const shy0 = !K.fireproof && (gr.body !== "man" || K.fears),
          shy = shy0 && !(gr.vigil && gr.fireT > 14);
        if (fire && shy0 && gr.mode === "hunt") {
          gr.fireT += dt;
          if (gr.fireT > 25 && !gr.vigil) {
            gr.mode = "leave";
            gr.why = "fire";
          }
        } else gr.fireT = Math.max(0, gr.fireT - dt);
        if (gr.mode === "leave")
          for (const h of gr.members)
            if (h.st !== "flee" && h.st !== "leave") {
              h.st = "leave";
              h.t0 = 0;
            }
        // the pack's turn: one goes in at a time (two when they are bold)
        // (one shared record for the whole group this frame, so a second one cannot go in on the same turn)
        const cx = {
          night,
          fire: shy ? fire : null,
          torch,
          ph,
          ev,
          rnd,
          attackers: gr.members.filter(
            (h) => h.st === "charge" || h.st === "wind" || h.st === "strike",
          ).length,
        };
        for (const h of gr.members) this.stepHunter(h, gr, dt, nowS, cx);
        // a pack that has lost most of its number runs (the dead, the drowned and the cinder-hounds never do)
        if (
          gr.mode === "hunt" &&
          K.flee > 0 &&
          gr.start > 1 &&
          gr.members.length <= gr.start / 2 &&
          gr.members.length
        ) {
          gr.mode = "flee";
          for (const h of gr.members) {
            h.st = "flee";
            h.t0 = 0;
          }
        }
        // keep a little room between them
        const A = gr.members;
        for (let j = 0; j < A.length; j++)
          for (let k = j + 1; k < A.length; k++) {
            const a = A[j],
              b = A[k],
              d = arcM(a.dir, b.dir, R),
              want = (a.pr.rad + b.pr.rad) * 1.05;
            if (d >= want || d < 1e-4) continue;
            const away = bearingTo(a.dir, b.dir),
              push = (want - d) * 0.5;
            b.dir = stepOn(
              b.dir,
              frameAt(b.dir),
              Math.sin(away) * push,
              Math.cos(away) * push,
              R,
            );
            b.F = frameAt(b.dir);
            a.dir = stepOn(
              a.dir,
              frameAt(a.dir),
              -Math.sin(away) * push,
              -Math.cos(away) * push,
              R,
            );
            a.F = frameAt(a.dir);
          }
        // gone out of sight, or too far behind to matter
        for (let i = A.length - 1; i >= 0; i--) {
          const h = A[i];
          if (
            ((h.st === "leave" || h.st === "flee") &&
              h.m > 110 &&
              h.fade <= 0) ||
            h.m > 650 ||
            (h.m > 330 && h.st === "roam")
          ) {
            this.dropHunter(gr, h);
            A.splice(i, 1);
          }
        }
        if (!A.length) {
          this.hostiles.splice(gi, 1);
          this.dropHunters(gr);
          this.huntCool = night ? 60 : 150;
          continue;
        }
        for (const h of A) {
          if (gr.body === "beast") this.poseHunter(h, gr, dt, nowS, night);
          else this.poseMan(h, gr, dt, nowS, night);
        }
      }
    },
    // one hunter's moment
    stepHunter(h, gr, dt, nowS, cx) {
      const R = this.R,
        p = this.p,
        K = gr.K,
        rnd = cx.rnd;
      h.t0 += dt;
      h.hitT = Math.max(0, h.hitT - dt);
      h.poise = Math.max(0, h.poise - dt);
      h.fearCd = Math.max(0, h.fearCd - dt);
      h.cool = Math.max(0, h.cool - dt);
      h.m = arcM(p, h.dir, R);
      const toYou = bearingTo(h.dir, p),
        away = toYou + Math.PI,
        m = h.m;
      const off = Math.abs(
        Math.atan2(Math.sin(toYou - h.face), Math.cos(toYou - h.face)),
      );
      // do you face it, close enough for a flame to be in its eyes?
      const youFace =
        Math.abs(
          Math.atan2(
            Math.sin(bearingTo(p, h.dir) - cx.ph),
            Math.cos(bearingTo(p, h.dir) - cx.ph),
          ),
        ) < 0.6;
      let speed = 0,
        amp = 0,
        pitchTo = 0.15,
        head = toYou,
        crouch = 0,
        lunge = 0;
      // a lit fire by you: what fears fire comes no nearer its light; already too close, it backs away from it
      const fireM = cx.fire ? arcM(h.dir, cx.fire.dir, R) : 1e9,
        fireBlock = fireM < 10;
      if (
        fireM < 8.5 &&
        (h.st === "stalk" ||
          h.st === "circle" ||
          h.st === "charge" ||
          h.st === "rest" ||
          h.st === "back")
      ) {
        h.st = "fear";
        h.t0 = 0;
        h.fromFire = bearingTo(cx.fire.dir, h.dir);
      }
      // a flame held at it, close: what fears fire backs off
      if (
        cx.torch &&
        K.fears &&
        !K.heavy &&
        h.fearCd <= 0 &&
        m < 4.2 &&
        youFace &&
        (h.st === "charge" ||
          h.st === "wind" ||
          h.st === "circle" ||
          h.st === "stalk")
      ) {
        h.st = "fear";
        h.t0 = 0;
        h.fearCd = 4 + rnd() * 2;
        h.fromFire = null;
      }
      const circler = !!K.circles,
        slow = !!K.slow;
      // (one that keeps to its own ground goes back to it once you are away from there)
      if (
        K.tether &&
        h.home &&
        (h.st === "charge" || h.st === "stalk" || h.st === "rest") &&
        arcM(h.dir, h.home, R) > K.tether &&
        m > K.reach + 2
      ) {
        h.st = "leave";
        h.t0 = 0;
      }
      switch (h.st) {
        case "roam":
          if (K.guard || K.water) {
            // one that keeps to its own ground: rooting about there (or lying in the shallows), until you come too close
            const hm = h.home ? arcM(h.dir, h.home, R) : 0;
            head =
              hm > 6
                ? bearingTo(h.dir, h.home)
                : h.face + Math.sin(nowS * 0.5 + h.slot * 2) * 0.8;
            speed = K.water
              ? hm > 6
                ? K.trot
                : 0
              : K.trot * 0.25 * (0.5 + 0.5 * Math.sin(nowS * 0.7 + h.slot));
            amp = speed > 0 ? 0.3 : 0;
            pitchTo = K.water ? 0.15 : 0.7;
            if (m < K.nose * (cx.night ? 1.25 : 1)) {
              h.st = "notice";
              h.t0 = 0;
              this.huntNoticed(gr, h);
            } else if (h.t0 > 75) {
              h.st = "leave";
              h.t0 = 0;
            }
            break;
          }
          // on your trail, not yet near enough to know you are there
          head = toYou + Math.sin(nowS * 0.3 + h.slot) * 0.5;
          speed = K.trot * 0.8;
          amp = 0.4;
          pitchTo = 0.45;
          if (m < K.nose * (cx.night ? 1.25 : 1) || h.t0 > 40) {
            h.st = "notice";
            h.t0 = 0;
            this.huntNoticed(gr, h);
          }
          break;
        case "notice":
          // heads up: it has seen you (a boar paws the ground and comes straight in)
          pitchTo = K.guard ? 0.35 + Math.sin(nowS * 9) * 0.12 : -0.2;
          h.face = hTurn(h.face, toYou, dt * 3);
          if (h.t0 > 1.0 + (h.slot % 1) * 0.6) {
            h.st = K.guard ? "charge" : "stalk";
            h.t0 = 0;
          }
          break;
        case "stalk": {
          // closer, steady, low (a cat very low, and slow; the dead and the drowned just keep coming)
          const near = K.stalker ? 15 : circler ? 12 : slow ? 3 : 10;
          speed = K.stalker ? 1.7 : K.trot;
          amp = K.stalker ? 0.3 : 0.45;
          pitchTo = 0.5;
          crouch = K.stalker ? 0.16 : 0.04;
          if (fireBlock) {
            speed = 0;
            amp = 0;
          }
          if (m < near && !fireBlock) {
            h.st = circler ? "circle" : "charge";
            h.t0 = 0;
          }
          break;
        }
        case "circle": {
          // round you at a distance, each at its own place in the ring, waiting their turn
          gr.ang = (gr.ang || 0) + gr.spin * dt;
          const ring = cx.fire ? 12 : 7.5,
            a = h.slot + gr.ang,
            F = frameAt(p);
          const spot = stepOn(p, F, Math.sin(a) * ring, Math.cos(a) * ring, R);
          const dd = arcM(h.dir, spot, R);
          head = dd > 0.8 ? bearingTo(h.dir, spot) : toYou;
          speed = dd > 0.8 ? Math.min(K.run * 0.7, 1.5 + dd * 1.2) : 0;
          amp = speed > 4 ? 0.7 : speed > 0 ? 0.4 : 0;
          pitchTo = 0.35;
          if (speed === 0) h.face = hTurn(h.face, toYou, dt * 3);
          if (
            !fireBlock &&
            h.cool <= 0 &&
            cx.attackers < (gr.dmgK > 1.1 ? 2 : 1) &&
            m < 12
          ) {
            h.st = "charge";
            h.t0 = 0;
            cx.attackers++;
          }
          break;
        }
        case "charge":
          // in at a run (it pulls up within reach of you, rather than running on through)
          speed = Math.min(
            K.run * Math.min(1, 0.4 + h.t0 * 1.6),
            Math.max(0, (m - K.reach * 0.85) / Math.max(dt, 1e-3)),
          );
          amp = slow ? 0.5 : 0.8;
          pitchTo = 0.28;
          head = toYou;
          if (fireBlock) {
            h.st = circler ? "circle" : "stalk";
            h.t0 = 0;
            break;
          }
          if (m < K.reach + 0.15 && off < 0.7) {
            h.st = "wind";
            h.t0 = 0;
            speed = 0;
            break;
          }
          // a cat will not chase far: if you got away it goes back to stalking
          if (K.stalker && h.t0 > 4 && m > 16) {
            h.st = "stalk";
            h.t0 = 0;
          }
          if (circler && h.t0 > 6) {
            h.st = "back";
            h.t0 = 0;
          }
          break;
        case "wind":
          // gathering itself: low, weight back (a weapon raised)
          h.face = hTurn(h.face, toYou, dt * 4);
          head = h.face;
          pitchTo = 0.45;
          crouch = 0.08 * Math.min(1, h.t0 / K.wind);
          lunge = -0.12 * Math.min(1, h.t0 / K.wind);
          if (h.t0 >= K.wind) {
            h.st = "strike";
            h.t0 = 0;
            const off2 = Math.abs(
              Math.atan2(Math.sin(toYou - h.face), Math.cos(toYou - h.face)),
            );
            if (m <= K.reach + 0.45 && off2 < 0.95 && !this.journey) {
              const dmg = Math.round(h.dmg[0] + rnd() * (h.dmg[1] - h.dmg[0]));
              cx.ev.blows = (cx.ev.blows || 0) + dmg;
              cx.ev.hurt = (cx.ev.hurt || 0) + dmg;
              cx.ev.hurtBy = h;
              this.jolt(K.heavy ? 2.2 : 1.5);
              this.lastFoe = h;
              this.lastFoeAt = nowS;
            } else cx.ev.missed = h;
          }
          break;
        case "strike": {
          // the bite, the swipe, the blow
          const k = h.t0 / 0.24;
          lunge =
            Math.sin(Math.min(1, k) * Math.PI) *
            (gr.body === "beast" ? 0.55 : 0.3);
          pitchTo = 0.1;
          head = h.face;
          if (h.t0 >= 0.24) {
            h.cool = 2.2 + rnd() * 2.4;
            h.st = circler ? "back" : "rest";
            h.t0 = 0;
          }
          break;
        }
        case "back":
          // a wolf springs away again, back to the ring
          head = away;
          speed = K.run * 0.75;
          amp = 0.7;
          pitchTo = 0.3;
          if (m > 6.5 || h.t0 > 1.6) {
            h.st = "circle";
            h.t0 = 0;
          }
          break;
        case "rest":
          h.face = hTurn(h.face, toYou, dt * 2);
          head = h.face;
          pitchTo = 0.3;
          if (h.t0 >= K.rest) {
            h.st = m < K.reach + 0.3 ? "wind" : "charge";
            h.t0 = 0;
          }
          break;
        case "stagger": {
          const k = Math.max(0, 1 - h.t0 / 0.35);
          head = h.face;
          pitchTo = -0.1;
          if (h.push != null) this.hunterMove(h, h.push, 3.2 * k, dt, false);
          if (h.t0 >= 0.4) {
            h.st = circler ? "back" : "charge";
            h.t0 = 0;
            h.push = null;
          }
          break;
        }
        case "fear":
          // backing off from the flame (a torch in its face, or a fire), head low, then round again
          h.face = hTurn(h.face, toYou, dt * 3);
          head = h.face;
          this.hunterMove(
            h,
            h.fromFire ?? away,
            h.fromFire != null ? 3 : 1.8,
            dt,
            false,
          );
          pitchTo = 0.55;
          crouch = 0.06;
          amp = 0.3;
          if (h.t0 > 1.1 && !(h.fromFire != null && fireM < 9.5)) {
            h.st = circler ? "circle" : "stalk";
            h.t0 = 0;
            h.fromFire = null;
          }
          break;
        case "flee":
          head = away;
          speed = K.run;
          amp = 0.8;
          pitchTo = 0.1;
          break;
        case "leave":
          head = away + Math.sin(nowS * 0.2 + h.slot) * 0.3;
          speed = K.trot;
          amp = 0.45;
          pitchTo = 0.3;
          break;
      }
      // the way it goes: turned towards, then moved along (round water and cliffs)
      if (speed > 0) {
        h.face = hTurn(h.face, head, dt * (speed > 5 ? 5 : 3));
        const moved = this.hunterMove(h, h.face, speed, dt, true);
        h.phase +=
          (moved * Math.PI * 2) / (h.pr.legH * h.scale * (1.2 + 5 * amp));
      }
      h.walk += (amp - h.walk) * Math.min(1, dt * 6);
      h.pitch += (pitchTo - h.pitch) * Math.min(1, dt * 6);
      h.crouch += (crouch - h.crouch) * Math.min(1, dt * 8);
      h.lunge += (lunge - h.lunge) * Math.min(1, dt * 16);
      // they come into sight slowly, and fade out of it going away
      const going = (h.st === "leave" || h.st === "flee") && h.m > 70;
      h.fade = going
        ? Math.max(0, h.fade - dt / 2)
        : Math.min(1, h.fade + dt / 1.5);
    },
    // move a hunter along a bearing; it will not walk into water (the drowned wade), up a cliff, or into a safe place
    hunterMove(h, b, speed, dt, steer) {
      const R = this.R,
        s = speed * dt,
        wet = h.kind === "drowned" ? -1.2 : h.kind === "croc" ? -1.6 : 0.2;
      if (s <= 0) return 0;
      const ok = (bb) => {
        const q = stepOn(
          h.dir,
          frameAt(h.dir),
          Math.sin(bb) * Math.max(s, 1.2),
          Math.cos(bb) * Math.max(s, 1.2),
          R,
        );
        const gh = this.ground.height(q[0], q[1], q[2], 2);
        return (
          gh > wet &&
          gh - h.alt < 1.6 &&
          (h.st === "leave" || h.st === "flee" || !this.havenAt(q, -40))
        );
      };
      let bb = b;
      if (!ok(bb)) {
        if (!steer) return 0;
        let found = false;
        for (const t of [0.6, -0.6, 1.2, -1.2, 1.9, -1.9])
          if (ok(b + t)) {
            bb = b + t;
            found = true;
            break;
          }
        if (!found) return 0;
      }
      h.dir = stepOn(
        h.dir,
        frameAt(h.dir),
        Math.sin(bb) * s,
        Math.cos(bb) * s,
        R,
      );
      h.F = frameAt(h.dir);
      h.alt = this.ground.height(h.dir[0], h.dir[1], h.dir[2], 1);
      return s;
    },
    // the first one to see you says so (what, and from where)
    huntNoticed(gr, h) {
      if (gr.seen) return;
      gr.seen = true;
      const way = bearingWord(this.p, h.dir),
        n = gr.members.length;
      const what =
        gr.alarm ||
        (n > 1 ? `${NUM_WORD[n] || "Some"} ${gr.many}` : `A ${gr.name}`);
      this.huntAlarm = {
        title: what,
        sub: `to the ${way}, and coming your way`,
        kind: gr.kind,
      };
    },
    // where it is, how it stands, its legs and head
    poseHunter(h, gr, dt, nowS, night) {
      const pr = gr.pr,
        U = h.U;
      this.placeMatrix(
        h.mesh,
        h.dir,
        h.F,
        Math.max(-0.4, h.alt) - h.crouch * h.scale,
        h.face + Math.PI,
      );
      const mpp =
        (2 * Math.tan((this.camera.fov * Math.PI) / 360) * h.m) /
        (this.H || 240);
      const sc = h.scale * Math.max(1, (3 * mpp) / (pr.len * h.scale)),
        e = h.mesh.matrix.elements;
      h.sc = sc;
      if (h.lunge) {
        const L = h.lunge * sc;
        e[12] += e[8] * L;
        e[13] += e[9] * L;
        e[14] += e[10] * L;
      }
      for (const j of [0, 1, 2, 4, 5, 6, 8, 9, 10]) e[j] *= sc;
      h.mesh.visible = h.m < 1000;
      U.uFadeIn.value = h.fade;
      U.uPhase.value = h.phase;
      U.uAmp.value = h.walk;
      U.uHeadPitch.value = h.pitch;
      U.uHeadYaw.value = h.hyaw;
      U.uBob.value = h.walk > 0.45 ? (h.walk - 0.45) * pr.H * 0.14 : 0;
      U.uHit.value = h.hitT > 0 ? h.hitT / 0.18 : 0;
      U.uEyes.value = night || gr.K.glow ? 1 : 0;
      // a tail held low and still when it means it; swinging when it waits
      U.uTail.value =
        h.st === "circle" || h.st === "stalk"
          ? Math.sin(nowS * 4 + h.slot * 3) * 0.3
          : 0;
      // (a scorpion's sting: drawn back as it gathers itself, then over its back and down into you)
      if (gr.K.shape === "scorpion") {
        const want =
          h.st === "wind"
            ? -0.35 * Math.min(1, h.t0 / gr.K.wind)
            : h.st === "strike"
              ? -0.35 +
                1.35 * Math.sin(Math.min(1, h.t0 / 0.24) * Math.PI * 0.5)
              : h.st === "stalk" || h.st === "notice"
                ? Math.sin(nowS * 2.2 + h.slot) * 0.08
                : 0;
        U.uTailP.value +=
          (want - U.uTailP.value) *
          Math.min(1, dt * (h.st === "strike" ? 30 : 6));
        U.uTail.value *= 0.4;
      }
    },
    // someone on two legs: where they stand, how they lean, their arms, legs and head
    poseMan(h, gr, dt, nowS, night) {
      const U = h.U,
        dead = gr.body === "dead",
        w = h.walk,
        s = Math.sin(h.phase),
        K = gr.K;
      let armL,
        armR,
        legL = s * 0.5 * w,
        legR = -s * 0.5 * w,
        headP = 0.05,
        headY = 0,
        lean = 0.04 + 0.08 * w;
      if (dead) {
        armL = -1.3 + Math.sin(h.phase * 0.5) * 0.08 * w;
        armR = -1.3 - Math.sin(h.phase * 0.5) * 0.08 * w;
        headP = 0.28;
        legL *= 0.8;
        legR *= 0.8;
      } else {
        armL = -s * 0.4 * w - (gr.kind === "drowned" ? 0.6 : 0.15);
        armR = s * 0.4 * w - 0.35;
      }
      switch (h.st) {
        case "notice":
          headP = -0.1;
          headY = Math.sin(nowS * 2 + h.slot) * 0.2;
          break;
        case "wind": {
          const k = hEase(h.t0 / K.wind);
          armR = armR + (-2.7 - armR) * k;
          armL = dead ? -2.6 * k - 1.3 * (1 - k) : armL + (-0.9 - armL) * k;
          lean = 0.04 - 0.1 * k;
          headP = 0.05 - 0.2 * k;
          break;
        }
        case "strike": {
          const k = hEase(h.t0 / 0.24);
          armR = -2.7 + 2.2 * k;
          if (dead) armL = -2.7 + 2.2 * k;
          lean = -0.06 + 0.3 * k;
          headP = -0.1 + 0.3 * k;
          break;
        }
        case "rest":
          armR = -0.6;
          armL = dead ? -1.0 : -0.5;
          lean = 0.12;
          break;
        case "stagger":
          lean = -0.28;
          armL = -0.5;
          armR = -0.8;
          headP = -0.2;
          break;
        case "fear":
          lean = -0.2;
          armL = armR = -2.0;
          headP = 0.5;
          break;
      }
      h.lean = lean;
      U.uArmL.value = armL;
      U.uArmR.value = armR;
      U.uLegL.value = legL;
      U.uLegR.value = legR;
      U.uHeadP.value = headP;
      U.uHeadY.value = headY;
      this.placeMatrix(
        h.mesh,
        h.dir,
        h.F,
        Math.max(-0.4, h.alt) + Math.abs(Math.cos(h.phase)) * 0.03 * w,
        h.face + Math.PI,
      );
      const mpp =
        (2 * Math.tan((this.camera.fov * Math.PI) / 360) * h.m) /
        (this.H || 240);
      const sc = Math.max(1, (3 * mpp) / h.pr.H);
      h.sc = sc;
      const M =
        this.leanM ||
        (this.leanM = [new this.T.Matrix4(), new this.T.Matrix4()]);
      M[0].makeRotationX(lean);
      M[1].makeScale(sc, sc, sc);
      M[1].multiply(M[0]);
      if (h.lunge) {
        const e = h.mesh.matrix.elements,
          L = h.lunge;
        e[12] += e[8] * L;
        e[13] += e[9] * L;
        e[14] += e[10] * L;
      }
      h.mesh.matrix.multiply(M[1]);
      h.mesh.visible = h.m < 1000;
      U.uFadeIn.value = h.fade;
      U.uHit.value = h.hitT > 0 ? h.hitT / 0.18 : 0;
      U.uEyes.value = (night || dead) && K.glow ? 1 : 0;
    },

    // ---------- you against them ----------
    // the one you would hit with a blow: alive, in front of you, within reach
    hostileAt(reach) {
      if (!this.hostiles || this.cave) return null;
      const R = this.R,
        p = this.p,
        hd = -this.yaw;
      let best = null;
      for (const gr of this.hostiles)
        for (const h of gr.members) {
          if (h.hp <= 0 || h.fade < 0.3) continue;
          const d = arcM(p, h.dir, R) - h.pr.rad * h.scale * 0.6;
          if (d > reach + 0.35) continue;
          const b = bearingTo(p, h.dir),
            off = Math.abs(Math.atan2(Math.sin(b - hd), Math.cos(b - hd)));
          if (off > Math.atan2(0.6, Math.max(d, 0.3)) + 0.5) continue;
          const score = d + off * 1.5;
          if (!best || score < best.score)
            best = { h, d: Math.max(0, d), score };
        }
      return best;
    },
    // a blow, or an arrow, finds one. Returns 'down' if that killed it
    hitHostile(h, dmg, knock = 0.3, stuck = null, part = null) {
      if (!h || h.hp <= 0 || !h.gr || !h.gr.members.includes(h)) return null;
      const gr = h.gr,
        K = gr.K;
      h.hp = Math.max(0, h.hp - dmg);
      h.hitT = 0.18;
      if (stuck) h.arrows.push(stuck);
      this.lastFoe = h;
      this.lastFoeAt = performance.now() / 1000;
      // hurt, they all know where you are
      if (gr.mode === "hunt")
        for (const o of gr.members)
          if (o.st === "roam" || o.st === "notice" || o.st === "stalk") {
            o.st = K.circles && o !== h ? "circle" : "charge";
            o.t0 = 0;
            this.huntNoticed(gr, o);
          }
      if (h.hp <= 0) {
        this.killHunter(h);
        return "down";
      }
      if (K.flee > 0 && h.hp < h.max * K.flee && Math.random() < 0.6) {
        h.st = "flee";
        h.t0 = 0;
        return "hit";
      }
      if (h.poise <= 0 && (K.heavy ? dmg >= 18 : dmg >= 8) && h.st !== "flee") {
        h.st = "stagger";
        h.t0 = 0;
        h.poise = 1.4;
        h.push = bearingTo(this.p, h.dir);
        h.knock = knock;
      } else if (
        h.st === "roam" ||
        h.st === "notice" ||
        h.st === "stalk" ||
        h.st === "circle"
      ) {
        h.st = "charge";
        h.t0 = 0;
      }
      return "hit";
    },
    // down: a beast to butcher, or one that falls, or crumbles, and is gone
    killHunter(h) {
      const gr = h.gr,
        i = gr.members.indexOf(h),
        K = gr.K;
      if (i < 0) return null;
      gr.members.splice(i, 1);
      h.U.uFadeIn.value = 1;
      let c = null;
      if (K.dies === "carcass")
        c = this.addCarcass({
          dir: h.dir,
          F: h.F,
          h: h.alt,
          face: h.face,
          pitch0: h.pitch,
          mesh: h.mesh,
          U: h.U,
          geo: gr.geo,
          owner: gr,
          pr: gr.pr,
          sc: h.scale,
          name: gr.name,
          size: K.size,
          young: false,
          arrows: h.arrows,
          kind: "hunter",
          beast: gr.kind,
        });
      else
        (this.fallen = this.fallen || []).push({
          mesh: h.mesh,
          U: h.U,
          geo: h.geo,
          shared: h.geo ? null : gr.geo,
          owner: gr,
          body: gr.body,
          dir: h.dir,
          F: h.F,
          alt: h.alt,
          face: h.face,
          sc: h.sc || h.scale,
          pr: h.pr,
          lean: h.lean || 0,
          t: 0,
          roll: Math.random() < 0.5 ? 1 : -1,
          how: K.dies,
        });
      (this.huntNews = this.huntNews || []).push({
        name: gr.name,
        kind: gr.kind,
        left: gr.members.length,
        dir: h.dir.slice(),
        how: K.dies,
        arrows: K.dies === "carcass" ? [] : h.arrows.slice(),
        story: gr.story,
      });
      if (!gr.members.length) {
        const j = this.hostiles.indexOf(gr);
        if (j >= 0) this.hostiles.splice(j, 1);
        gr.gone = true;
        this.huntCool = this.uniforms.uDark.value > 0.5 ? 60 : 150;
      }
      return c;
    },
    // those that do not stay: they fall (or roll over) and fade to nothing, or crumble to ash or grey dust
    stepFallen(dt) {
      const L = this.fallen;
      if (!L || !L.length) return;
      const T = this.T,
        M = this.fallM || (this.fallM = [new T.Matrix4(), new T.Matrix4()]);
      for (let i = L.length - 1; i >= 0; i--) {
        const f = L[i];
        f.t += dt;
        if (f.t > 2.6) {
          L.splice(i, 1);
          this.dropFallen(f);
          continue;
        }
        const k = hEase(f.t / 0.75);
        this.placeMatrix(
          f.mesh,
          f.dir,
          f.F,
          Math.max(-0.4, f.alt),
          f.face + Math.PI,
        );
        if (f.body === "beast") {
          const pr = f.pr,
            yc = pr.bodyY + pr.bodyH * 0.5,
            lo = yc - pr.hw * 1.05;
          M[0].makeScale(f.sc, f.sc, f.sc);
          f.mesh.matrix.multiply(M[0]);
          M[0].makeTranslation(0, yc - lo * k, 0);
          M[1].makeRotationZ((f.roll * k * Math.PI) / 2);
          M[0].multiply(M[1]);
          M[1].makeTranslation(0, -yc, 0);
          M[0].multiply(M[1]);
          f.mesh.matrix.multiply(M[0]);
          f.U.uAmp.value = 0;
        } else {
          // over backwards, arms falling
          M[0].makeScale(f.sc, f.sc, f.sc);
          M[1].makeRotationX(f.lean + (-Math.PI / 2 - f.lean) * k);
          M[0].multiply(M[1]);
          M[1].makeTranslation(0, 0.12 * k, 0);
          M[1].multiply(M[0]);
          f.mesh.matrix.multiply(M[1]);
          f.U.uArmL.value = f.U.uArmR.value = -0.4 - 0.6 * (1 - k);
          f.U.uLegL.value = f.U.uLegR.value = 0;
          f.U.uHeadP.value = -0.3 * k;
        }
        f.mesh.matrixWorldNeedsUpdate = true;
        f.U.uHit.value = Math.max(0, 0.6 - f.t);
        f.U.uEyes.value = f.t < 0.5 ? f.U.uEyes.value : 0;
        // then it goes
        f.U.uFadeIn.value = 1 - hEase((f.t - 1.0) / 1.5);
      }
    },
    dropFallen(f) {
      this.scene.remove(f.mesh);
      f.mesh.material.dispose();
      if (f.geo) f.geo.dispose();
      else if (
        f.shared &&
        f.owner &&
        f.owner.gone &&
        !this.geoInUse(f.shared)
      ) {
        const g = f.shared;
        f.shared = null;
        if (!this.geoInUse(g)) g.dispose();
      }
    },
    // what an arrow could meet (see bow.js)
    hostileTargets(ar, here, out) {
      for (const gr of this.hostiles || [])
        for (const h of gr.members) {
          if (h.hp <= 0 || arcM(here, h.dir, this.R) > 120) continue;
          const beast = gr.body === "beast";
          out.push({
            kind: "hostile",
            h,
            parts: this.beastParts(
              {
                dir: h.dir,
                h: Math.max(-0.4, h.alt) - h.crouch * h.scale,
                face: h.face,
                pitch: beast ? h.pitch : 0,
              },
              h.pr,
              h.sc || h.scale,
              ar.o,
              ar.F,
              0,
              beast ? h.lunge / (h.sc || h.scale) : h.lunge,
            ),
          });
        }
    },
    // the one to show the strength of: what you are fighting, or the nearest coming for you
    hostileShown(nowS) {
      if (!this.hostiles || !this.hostiles.length) return null;
      const lf = this.lastFoe;
      if (
        lf &&
        lf.gr &&
        lf.hp > 0 &&
        lf.gr.members.includes(lf) &&
        nowS - (this.lastFoeAt || 0) < 4
      )
        return lf;
      let best = null;
      for (const gr of this.hostiles)
        for (const h of gr.members) {
          if (
            h.hp <= 0 ||
            h.st === "leave" ||
            h.st === "flee" ||
            h.st === "roam"
          )
            continue;
          if (h.m < 16 && (!best || h.m < best.m)) best = h;
        }
      return best;
    },
    // is anything hunting you now? (you cannot sleep with wolves about)
    huntedNow() {
      return (this.hostiles || []).some(
        (gr) =>
          gr.mode === "hunt" &&
          gr.members.some((h) => h.m < 150 && h.st !== "roam"),
      );
    },
    // ---------- a night of vigil ----------
    // what the story sends against a vigil: its own creatures (out of the dark all round the place), n of them;
    // where it has none of its own, the hunters of the land
    vigilWave(at, n) {
      if (!this.hostiles || !this.siteIx) return null;
      const th = this.threat || {},
        arc = th.arc,
        env = this.siteIx.envAt(at);
      let kind = arc ? STORY_KIND[arc.kind] : null;
      if (!kind) {
        const land = HUNT_LAND[env.biome];
        kind =
          land && land.bear > 0.5
            ? "bear"
            : land && land.cat > 0.5
              ? "cat"
              : "wolf";
      }
      const gr = this.spawnHunters(env, null, true, kind, {
        story: true,
        at,
        n,
        vigil: true,
      });
      if (gr) for (const h of gr.members) h.t0 = 30 + Math.random() * 6;
      return gr;
    },
    // how many of a vigil's creatures are still out there, coming
    vigilLeft() {
      let n = 0;
      for (const gr of this.hostiles || [])
        if (gr.vigil && gr.mode === "hunt")
          for (const h of gr.members)
            if (h.hp > 0 && h.st !== "leave" && h.st !== "flee") n++;
      return n;
    },
  });

  // ---- view/travel.js ----
  // ============================================================
  // TRAVEL — the long ways round a world. By road: a caravan to any town the
  // roads reach, changing beasts at every town on the way. By sea: a ship
  // from any port (or a fishing boat from any town on the coast) to any
  // other, sailing round the land, never over it. On board, you stand at
  // the stern with the deck rising and falling under you, the sail full
  // ahead, a lantern lit at night. Pure routing here, and the ship itself;
  // the journey (stops, days, nights) is the ground view's.
  // ============================================================

