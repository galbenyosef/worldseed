// index-inline-2 105 — math
// Lines 53809-53980 of readable/index-inline-2.pretty.js (statement-aligned).
  const LIGHT = {
    candle: { rad: 5.0, k: 0.8, flick: 0.1 },
    hang: { rad: 9.5, k: 0.95, flick: 0.04 },
    wall: { rad: 7.0, k: 0.75, flick: 0.04 },
    post: { rad: 8.0, k: 0.8, flick: 0.04 },
    torch: { rad: 8.0, k: 0.8, flick: 0.24 },
    stake: { rad: 7.5, k: 0.85, flick: 0.24 },
    brazier: { rad: 8.5, k: 0.85, flick: 0.24 },
    fire: { rad: 10, k: 1.0, flick: 0.22 },
    hand: { rad: 6.5, k: 0.55, flick: 0.05 },
  };
  const LIGHT_REACH = 80;
  const BIG_TOWN = new Set(["capital", "town", "port"]);

  Object.assign(GroundView.prototype, {
    // ---------- the roads into a town: a few lanterns on posts as you come in ----------
    // (only the busy places; in the town's own metres, with the way each lantern's arm points)
    townRoadLamps(s) {
      if (s._roadLamps) return s._roadLamps;
      const out = [];
      const ix = this.siteIx,
        net = this.roadNet;
      if (!ix || !net || !ix.roadCum || !BIG_TOWN.has(s.type))
        return (s._roadLamps = out);
      const R = this.R,
        F = frameAt(s.dir),
        plan = s._plan || (s._plan = townPlan(this.story, s));
      let edge = 30;
      for (const b of plan.buildings)
        edge = Math.max(edge, Math.hypot(b.x, b.z) + Math.max(b.w, b.d) * 0.6);
      // (the great city's start outside its gates)
      if (plan.city) edge = plan.city.out + 6;
      const from = edge + 8,
        to = from + (s.type === "capital" ? 360 : 220),
        every = 46;
      const local = (d) => {
        const q = [d[0] - s.dir[0], d[1] - s.dir[1], d[2] - s.dir[2]];
        return [
          (q[0] * F.e[0] + q[1] * F.e[1] + q[2] * F.e[2]) * R,
          -(q[0] * F.n[0] + q[1] * F.n[1] + q[2] * F.n[2]) * R,
        ];
      };
      net.roads.forEach((rd, ri) => {
        const atA = rd.a === s.id,
          atB = rd.b === s.id;
        if (!atA && !atB) return;
        const cum = ix.roadCum[ri],
          total = cum ? cum[cum.length - 1] : 0;
        if (!total) return;
        let side = ri % 2 ? 1 : -1;
        for (let m = from; m <= to && m < total * 500; m += every) {
          const km = atA ? m / 1000 : total - m / 1000;
          const c = ix.roadPoint(ri, km, 0),
            q = ix.roadPoint(ri, km, side * 3.7);
          if (this.ground.height(q.dir[0], q.dir[1], q.dir[2], 2) < 0.6) {
            side = -side;
            continue;
          }
          const [x, z] = local(q.dir),
            [cx, cz] = local(c.dir),
            L = Math.hypot(cx - x, cz - z) || 1;
          out.push({ kind: "post", x, z, ox: (cx - x) / L, oz: (cz - z) / L });
          side = -side;
        }
      });
      return (s._roadLamps = out);
    },

    // ---------- each frame: the lamps that light things now ----------
    stepLights(dt, nowS) {
      const U = this.uniforms,
        P = U.uLamps.value,
        K = U.uLampK.value;
      // lamps are lit as the sun goes down; their light comes up over a second or two
      const want = U.uDark.value > 0.5 ? 1 : 0;
      this.lampOn =
        this.lampOn == null
          ? want
          : this.lampOn + (want - this.lampOn) * Math.min(1, dt * 0.9);
      const cand = this._lampCand || (this._lampCand = []);
      cand.length = 0;
      if (this.lampOn > 0.005 && !this.journey) {
        if (this.frame % 4 === 0 || this._lampRoom === undefined)
          this._lampRoom = this.roomAt ? this.roomAt() : null;
        const room = this._lampRoom,
          ey = this.eyeY,
          p = this.p,
          R = this.R;
        const take = (mesh, list) => {
          if (!mesh || !mesh.parent || !list || !list.length) return;
          const e = mesh.matrix.elements;
          for (const L of list) {
            // a room's lamps only while you are in it (and a day's own only while it is on)
            if ((L.room && L.room !== room) || L.off) continue;
            const X = e[0] * L.x + e[4] * L.y + e[8] * L.z + e[12],
              Y = e[1] * L.x + e[5] * L.y + e[9] * L.z + e[13],
              Z = e[2] * L.x + e[6] * L.y + e[10] * L.z + e[14];
            const d = Math.hypot(X, Y - ey, Z);
            if (d < LIGHT_REACH) cand.push({ X, Y, Z, d, L });
          }
        };
        // people carrying lanterns: the light swings with them
        const HAND = { x: 0.25, y: 0.66, z: 0.05, kind: "hand" };
        const carried = (folk) => {
          for (const f of folk) {
            if (!f.lamp || !f.mesh.visible || f.gone) continue;
            const e = f.mesh.matrix.elements,
              s = (f.info && f.info.look && f.info.look.h) || 1.7;
            const hx = (HAND.x * s) / 1.7,
              hy = (HAND.y * s) / 1.7;
            const X = e[0] * hx + e[4] * hy + e[8] * HAND.z + e[12],
              Y = e[1] * hx + e[5] * hy + e[9] * HAND.z + e[13],
              Z = e[2] * hx + e[6] * hy + e[10] * HAND.z + e[14];
            const d = Math.hypot(X, Y - ey, Z);
            if (d < LIGHT_REACH)
              cand.push({ X, Y, Z, d, L: HAND, seed: f.seed || 0 });
          }
        };
        for (const tw of this.towns.values()) {
          if (arcM(p, tw.s.dir, R) > 700) continue;
          take(tw.mesh, tw.lights);
          carried(tw.folk);
        }
        if (this.siteViews)
          for (const v of this.siteViews.values()) {
            if (arcM(p, v.site.dir, R) > v.plan.r + LIGHT_REACH + 10) continue;
            take(v.mesh, v.lights);
            carried(v.folk);
          }
        cand.sort((a, b) => a.d - b.d);
      }
      // the nearest dozen; the farthest of them fade out before the next one would take their place
      const n = Math.min(LAMP_N, cand.length),
        far = cand.length > LAMP_N ? cand[LAMP_N].d : LIGHT_REACH;
      for (let i = 0; i < LAMP_N; i++) {
        if (i >= n) {
          P[i].set(0, -1e5, 0, 1);
          K[i] = 0;
          continue;
        }
        const c = cand[i],
          kd = LIGHT[c.L.kind] || LIGHT.post;
        const fade = Math.max(0, Math.min(1, (far - c.d) / (far * 0.3 + 1)));
        const ph = (c.seed || 0) + c.L.x * 3.7 + c.L.z * 2.3;
        const fl =
          1 -
          kd.flick +
          kd.flick *
            (0.5 +
              0.5 *
                Math.sin(nowS * 13.1 + ph) *
                Math.sin(nowS * 7.3 + ph * 1.7));
        P[i].set(c.X, c.Y, c.Z, kd.rad);
        K[i] = kd.k * fl * fade * this.lampOn;
      }
    },
  });

  // ---- view/routines.js ----
  // ============================================================
  // ROUTINES — folk keeping their hours. Each person has a home and a job
  // (see story/routine.js); here they walk where the hour sends them: along
  // the streets and round the edge of the square in a town, straight across
  // a farmyard, in through the door, to a seat at the tavern, behind the
  // counter, into bed. Nobody is drawn walking through a wall: in a town
  // they keep to the streets, and they go in and out by the doors.
  // Far from you nobody walks: they are simply where they should be.
  // ============================================================

  const FOLK_WALK = 1.15; // m/s, about the same as you strolling
  const NEAR_WALK = 95; // closer than this to you, folk walk to where they are going; further, they are just there

