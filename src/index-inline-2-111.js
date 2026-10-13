// index-inline-2 111 — math
// Lines 56773-57682 of readable/index-inline-2.pretty.js (statement-aligned).
  Object.assign(GroundView.prototype, {
    foeRowsGet() {
      if (this.fRows && this.fRowsFor === this.ramps) return this.fRows;
      const r = (c) => this.row(c);
      this.fRowsFor = this.ramps;
      this.fRows = {
        common: {
          wrap: r([170, 152, 118]),
          wrapDark: r([118, 102, 78]),
          dry: r([84, 60, 44]),
          crown: r([200, 150, 72]),
        },
        champion: {
          wrap: r([112, 128, 166]),
          wrapDark: r([70, 82, 118]),
          dry: r([70, 56, 50]),
          crown: r([200, 150, 72]),
        },
        lord: {
          wrap: r([150, 128, 92]),
          wrapDark: r([92, 74, 52]),
          dry: r([76, 52, 38]),
          crown: r([214, 168, 76]),
        },
      };
      return this.fRows;
    },

    // ---------- the dead of this cave: on their shelves, or up and about ----------
    makeFoes() {
      const C = this.cave,
        P = C.plan,
        T = this.T;
      const st = (this.caveState && this.caveState(C.site.id)) || {};
      C.foes = [];
      for (const t of P.things) {
        if (t.t !== "dead" && t.t !== "lord") continue;
        if (st["k_" + t.id]) continue;
        const tier = t.tier || (t.t === "lord" ? "lord" : "common");
        const K = FOE_KIND[tier],
          A = (t.affix && FOE_AFFIX[t.affix]) || {};
        const rnd = mulberry32(((t.seed || 1) ^ 0x7e1d) >>> 0);
        const h = K.h[0] + rnd() * (K.h[1] - K.h[0]);
        const M = mummyProto(h, this.foeRowsGet()[tier], t.seed || 1, {
          crown: tier === "lord",
        });
        const d = M.mesh.finish();
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
        const eyes = A.eyes || K.eyes;
        const U = {
          ...this.caveU,
          uArmL: { value: 0 },
          uArmR: { value: 0 },
          uLegL: { value: 0 },
          uLegR: { value: 0 },
          uHeadP: { value: 0 },
          uHeadY: { value: 0 },
          uGone: { value: 0 },
          uEyes: { value: 0 },
          uEyeCol: { value: new T.Vector3(eyes[0], eyes[1], eyes[2]) },
          uHit: { value: 0 },
        };
        const mat = new T.ShaderMaterial({
          uniforms: U,
          vertexShader: MUMMY_VS,
          fragmentShader: CAVE_FS,
          side: T.DoubleSide,
        });
        const mesh = new T.Mesh(geo, mat);
        mesh.matrixAutoUpdate = false;
        mesh.frustumCulled = false;
        this.caveScene.add(mesh);
        // where they lie: along their shelf (head to one end, feet to the other), or on the lord's bier
        let sx, sz, Ux, Uz, top, foot;
        if (t.t === "lord") {
          sx = t.x;
          sz = t.z;
          Ux = Math.cos(t.face);
          Uz = Math.sin(t.face);
          top = 0.75;
          foot = 1.2;
        } else {
          sx = t.x + Math.cos(t.face + Math.PI) * 0.15;
          sz = t.z + Math.sin(t.face + Math.PI) * 0.15;
          Ux = -Math.sin(t.face);
          Uz = Math.cos(t.face);
          top = 0.55;
          foot = 1.15;
        }
        const fy = caveFloor(P, sx, sz);
        const f = {
          t,
          id: t.id,
          tier,
          affix: t.affix || null,
          name: this.foeName ? this.foeName(C.site, t) : "the dead",
          max: Math.round(K.hp * (A.hp || 1)),
          dmg: K.dmg.map(
            (v) => v * (tier === "champion" && t.affix === "stone" ? 1.15 : 1),
          ),
          speed: A.speed || K.speed,
          reach: K.reach,
          wind: A.wind || K.wind,
          rest: K.rest,
          fearless: !!A.fearless || tier === "lord",
          unshaken: !!A.unshaken || tier === "lord",
          h,
          mesh,
          U,
          shelf: {
            sx,
            sz,
            Ux,
            Uz,
            top,
            foot,
            fy,
            Vx: Ux === 0 && Uz === 0 ? 1 : Uz,
            Vz: -Ux,
          },
          st: "lie",
          t0: 0,
          x: sx,
          z: sz,
          head: Math.atan2(Ux, -Uz),
          phase: rnd() * 6,
          walk: 0,
          poise: 0,
          fearCd: 0,
          cryCd: 4 + rnd() * 4,
          hitT: 0,
          seen: 0,
          rnd,
        };
        f.hp = f.max;
        // risen before, and not put down: they stand where they got down, and wait
        if (st.risen) {
          const g = this.foeStepSpot(f);
          f.x = g[0];
          f.z = g[1];
          f.st = "idle";
          f.head = Math.atan2(-g[0], g[1]);
        }
        C.foes.push(f);
        this.poseFoe(f, 0);
      }
      C.flow = null;
      C.flowAt = -1;
      C.blocked = null;
    },
    // the cells the dead cannot walk through: where shelves, the bier and columns stand
    foeBlocked() {
      const C = this.cave,
        P = C.plan;
      if (C.blocked && C.blockedPosts === C.posts) return C.blocked;
      const b = new Uint8Array(P.W * P.H);
      for (const [px, pz, r] of C.posts) {
        if (r < 0.45) continue;
        for (
          let j = Math.floor(pz - r - P.oz - 1);
          j <= Math.floor(pz + r - P.oz + 1);
          j++
        )
          for (
            let i = Math.floor(px - r - P.ox - 1);
            i <= Math.floor(px + r - P.ox + 1);
            i++
          ) {
            if (i < 0 || j < 0 || i >= P.W || j >= P.H) continue;
            if (Math.hypot(i + P.ox + 0.5 - px, j + P.oz + 0.5 - pz) < r + 0.25)
              b[j * P.W + i] = 1;
          }
      }
      C.blocked = b;
      C.blockedPosts = C.posts;
      C.flowAt = -1;
      return b;
    },
    dropFoes() {
      const C = this.cave;
      if (!C || !C.foes) return;
      for (const f of C.foes) {
        this.caveScene.remove(f.mesh);
        f.mesh.geometry.dispose();
        f.mesh.material.dispose();
      }
      C.foes = [];
    },
    // robbed: the dead get up, one after another
    riseTomb() {
      const C = this.cave;
      if (!C || !C.foes) return 0;
      let n = 0,
        delay = 0.4;
      // nearest first, the lord last
      const order = C.foes
        .filter((f) => f.st === "lie")
        .sort(
          (a, b) =>
            (a.tier === "lord") - (b.tier === "lord") ||
            Math.hypot(a.x - C.x, a.z - C.z) - Math.hypot(b.x - C.x, b.z - C.z),
        );
      for (const f of order) {
        f.st = "wait";
        f.t0 = -delay;
        delay += f.tier === "lord" ? 1.6 : 0.5 + f.rnd() * 0.7;
        n++;
      }
      return n;
    },
    // where one who was lying there stands after getting down: past the foot of the shelf, or in front of it
    foeStepSpot(f) {
      const S = f.shelf,
        P = this.cave.plan;
      const tries = [
        [S.Ux * (S.foot + 0.55), S.Uz * (S.foot + 0.55)],
        [S.Ux * (S.foot + 0.9), S.Uz * (S.foot + 0.9)],
        [S.Vx * 1.0 + S.Ux * 0.6, S.Vz * 1.0 + S.Uz * 0.6],
        [-S.Vx * 1.0 + S.Ux * 0.6, -S.Vz * 1.0 + S.Uz * 0.6],
        [S.Vx * 1.2, S.Vz * 1.2],
        [-S.Vx * 1.2, -S.Vz * 1.2],
        [-S.Ux * (S.foot + 0.6), -S.Uz * (S.foot + 0.6)],
      ];
      for (const [dx, dz] of tries) {
        const x = S.sx + dx,
          z = S.sz + dz;
        if (caveOpen(P, x, z, 0.3) && !this.caveBump(x, z)) return [x, z];
      }
      return [S.sx + S.Ux * (S.foot + 0.55), S.sz + S.Uz * (S.foot + 0.55)];
    },

    // ---------- the way to you, through the cave: steps to go from every dug cell ----------
    foeFlow() {
      const C = this.cave,
        P = C.plan,
        W = P.W,
        H = P.H;
      const k0 = P.cellAt(C.x, C.z);
      if (k0 < 0 || (C.flow && C.flowAt === k0)) return C.flow;
      const flow = C.flow || new Int32Array(W * H);
      flow.fill(-1);
      const q = new Int32Array(W * H),
        bl = this.foeBlocked();
      const open = (k) => P.carved[k] && !bl[k] && flow[k] < 0;
      let h = 0,
        t = 0;
      flow[k0] = 0;
      q[t++] = k0;
      while (h < t) {
        const k = q[h++],
          i = k % W,
          d = flow[k] + 1;
        if (i > 0 && open(k - 1)) {
          flow[k - 1] = d;
          q[t++] = k - 1;
        }
        if (i < W - 1 && open(k + 1)) {
          flow[k + 1] = d;
          q[t++] = k + 1;
        }
        if (k >= W && open(k - W)) {
          flow[k - W] = d;
          q[t++] = k - W;
        }
        if (k < W * (H - 1) && open(k + W)) {
          flow[k + W] = d;
          q[t++] = k + W;
        }
      }
      C.flow = flow;
      C.flowAt = k0;
      return flow;
    },
    // where a foe should head for next: straight at you if it can see you, else down the flow
    foeAim(f) {
      const C = this.cave,
        P = C.plan,
        W = P.W;
      const d = Math.hypot(C.x - f.x, C.z - f.z);
      if (d < 7 && this.caveLine(f.x, f.z, C.x, C.z)) return [C.x, C.z];
      const flow = this.foeFlow(),
        k = P.cellAt(f.x, f.z);
      if (!flow || k < 0 || flow[k] < 0) return [C.x, C.z];
      let best = -1,
        bd = flow[k];
      const i = k % W;
      for (const [di, dj] of [
        [-1, 0],
        [1, 0],
        [0, -1],
        [0, 1],
        [-1, -1],
        [1, -1],
        [-1, 1],
        [1, 1],
      ]) {
        if ((di < 0 && i === 0) || (di > 0 && i === W - 1)) continue;
        const nk = k + di + dj * W;
        if (nk < 0 || nk >= flow.length || flow[nk] < 0) continue;
        // cut a corner only where both cells beside it are dug
        if (di && dj && (flow[k + di] < 0 || flow[k + dj * W] < 0)) continue;
        if (flow[nk] < bd) {
          bd = flow[nk];
          best = nk;
        }
      }
      if (best < 0) return [C.x, C.z];
      return [(best % W) + P.ox + 0.5, Math.floor(best / W) + P.oz + 0.5];
    },
    foeFree(f, x, z) {
      const C = this.cave;
      if (!caveOpen(C.plan, x, z, 0.28) || this.caveBump(x, z, 0.0))
        return false;
      // by day, the dead keep out of the light at the mouth
      if (this.uniforms.uDay.value > 0.3 && z > -5.5 && z > f.z) return false;
      const dn = Math.hypot(x - C.x, z - C.z);
      if (dn < 0.78 && dn < Math.hypot(f.x - C.x, f.z - C.z)) return false;
      for (const o of C.foes)
        if (
          o !== f &&
          o.st !== "lie" &&
          o.st !== "gone" &&
          o.st !== "fall" &&
          Math.hypot(x - o.x, z - o.z) < 0.62 &&
          Math.hypot(f.x - o.x, f.z - o.z) > Math.hypot(x - o.x, z - o.z)
        )
          return false;
      return true;
    },
    foeMove(f, tx, tz, sp, dt) {
      const dx = tx - f.x,
        dz = tz - f.z,
        L = Math.hypot(dx, dz);
      if (L < 1e-3) return 0;
      const step = Math.min(L, sp * dt),
        n = Math.max(1, Math.ceil(step / 0.15));
      let moved = 0;
      for (let k = 0; k < n; k++) {
        const sx = ((dx / L) * step) / n,
          sz = ((dz / L) * step) / n;
        if (this.foeFree(f, f.x + sx, f.z)) {
          f.x += sx;
          moved += Math.abs(sx);
        }
        if (this.foeFree(f, f.x, f.z + sz)) {
          f.z += sz;
          moved += Math.abs(sz);
        }
      }
      return moved;
    },

    // ---------- a frame of the dead ----------
    stepFoes(dt, nowS) {
      const C = this.cave;
      if (!C || !C.foes || !C.foes.length) return;
      const ev = this.events;
      const torch = !!this.heldTorch,
        ph = -this.yaw;
      // stay too long among the sleeping dead and one of them stirs (once a visit)
      const tomb =
        C.tombRoom === undefined
          ? (C.tombRoom = C.plan.rooms.find((r) => r.kind === "tomb") || null)
          : C.tombRoom;
      if (
        tomb &&
        !C.stirred &&
        Math.hypot(C.x - tomb.x, C.z - tomb.z) < tomb.r + 1
      ) {
        C.linger = (C.linger || 0) + dt;
        if (C.linger > 150) {
          const f = C.foes
            .filter((o) => o.st === "lie" && o.tier !== "lord")
            .sort(
              (a, b) =>
                Math.hypot(a.x - C.x, a.z - C.z) -
                Math.hypot(b.x - C.x, b.z - C.z),
            )[0];
          C.stirred = true;
          if (f) {
            f.st = "wait";
            f.t0 = 0;
            ev.stir = f;
          }
        }
      }
      for (const f of C.foes) {
        f.t0 += dt;
        f.poise = Math.max(0, f.poise - dt);
        f.fearCd = Math.max(0, f.fearCd - dt);
        f.cryCd = Math.max(0, f.cryCd - dt);
        f.hitT = Math.max(0, f.hitT - dt);
        const dx = C.x - f.x,
          dz = C.z - f.z,
          dist = Math.hypot(dx, dz);
        const toYou = Math.atan2(dx, -dz),
          off = Math.abs(
            Math.atan2(Math.sin(toYou - f.head), Math.cos(toYou - f.head)),
          );
        // do you face it, close enough for your flame to be in its eyes?
        const youFace =
          Math.abs(
            Math.atan2(
              Math.sin(Math.atan2(-dx, dz) - ph),
              Math.cos(Math.atan2(-dx, dz) - ph),
            ),
          ) < 0.55;
        switch (f.st) {
          case "lie":
            break;
          case "wait":
            if (f.t0 >= 0) {
              f.st = "rise";
              f.t0 = 0;
            }
            break;
          case "rise":
            if (f.t0 >= RISE_T * (f.tier === "lord" ? 1.4 : 1)) {
              f.st = "step";
              f.t0 = 0;
              f.from = [
                f.shelf.sx + (f.shelf.Ux * f.h) / 2,
                f.shelf.sz + (f.shelf.Uz * f.h) / 2,
              ];
              f.to = this.foeStepSpot(f);
            }
            break;
          case "step":
            if (f.t0 >= STEP_T) {
              f.st = "hunt";
              f.t0 = 0;
              f.x = f.to[0];
              f.z = f.to[1];
              f.seen = 1;
            }
            break;
          case "idle":
            // risen, waiting where they got down: they come when they see or hear you
            if (
              dist < 4.5 ||
              (dist < 13 && this.caveLine(f.x, f.z, C.x, C.z))
            ) {
              f.st = "hunt";
              f.t0 = 0;
              f.seen = 1;
            }
            f.head = foeTurn(f.head, toYou, dt * 0.6);
            break;
          case "hunt": {
            // the lord's cry: rooted to the spot by it
            if (
              f.tier === "lord" &&
              f.cryCd <= 0 &&
              dist < 8 &&
              dist > 2.2 &&
              this.caveLine(f.x, f.z, C.x, C.z)
            ) {
              f.st = "cry";
              f.t0 = 0;
              break;
            }
            // a flame in its face: it falters and draws back
            if (
              torch &&
              !f.fearless &&
              f.fearCd <= 0 &&
              dist < 2.6 &&
              youFace
            ) {
              f.st = "fear";
              f.t0 = 0;
              f.fearCd = 3.5 + f.rnd() * 1.5;
              break;
            }
            if (dist < f.reach && off < 0.6) {
              f.st = "wind";
              f.t0 = 0;
              break;
            }
            let [tx, tz] = this.foeAim(f);
            // stuck against something: sidle round it for a moment
            if (f.dodge > 0) {
              f.dodge -= dt;
              const ax = tx - f.x,
                az = tz - f.z,
                L = Math.hypot(ax, az) || 1;
              tx = f.x - (az / L) * f.side * 1.5 + (ax / L) * 0.3;
              tz = f.z + (ax / L) * f.side * 1.5 + (az / L) * 0.3;
            }
            const want = Math.atan2(tx - f.x, -(tz - f.z));
            f.head = foeTurn(
              f.head,
              dist < 3 && !(f.dodge > 0) ? toYou : want,
              dt * 3.2,
            );
            const moved =
              Math.abs(
                Math.atan2(Math.sin(want - f.head), Math.cos(want - f.head)),
              ) < 1.2 && dist > 0.95
                ? this.foeMove(f, tx, tz, f.speed, dt)
                : 0;
            if (dist > f.reach && moved < f.speed * dt * 0.15) {
              f.stuck = (f.stuck || 0) + dt;
              if (f.stuck > 0.6) {
                f.stuck = 0;
                f.side = f.side === 1 ? -1 : 1;
                f.dodge = 0.6 + f.rnd() * 0.5;
              }
            } else f.stuck = 0;
            f.walk = Math.min(1, f.walk + dt * 3) * (moved > 0.002 ? 1 : 0.5);
            f.phase += moved * 3.6;
            break;
          }
          case "wind":
            f.head = foeTurn(f.head, toYou, dt * 2.4);
            if (f.t0 >= f.wind) {
              f.st = "strike";
              f.t0 = 0;
              // does the blow land? only if you are still there
              const off2 = Math.abs(
                Math.atan2(Math.sin(toYou - f.head), Math.cos(toYou - f.head)),
              );
              if (dist <= f.reach + 0.35 && off2 < 0.95) {
                const dmg = Math.round(
                  f.dmg[0] + f.rnd() * (f.dmg[1] - f.dmg[0]),
                );
                ev.blows = (ev.blows || 0) + dmg;
                ev.hurt = (ev.hurt || 0) + dmg;
                ev.hurtBy = f;
                this.jolt(1.6);
                this.lastFoe = f;
                this.lastFoeAt = nowS;
              } else ev.missed = f;
            }
            break;
          case "strike":
            if (f.t0 >= 0.2) {
              f.st = "rest";
              f.t0 = 0;
            }
            break;
          case "rest":
            f.head = foeTurn(f.head, toYou, dt * 1.5);
            if (f.t0 >= f.rest) {
              f.st = "hunt";
              f.t0 = 0;
            }
            break;
          case "stagger": {
            const k = Math.max(0, 1 - f.t0 / 0.35);
            if (f.push)
              this.foeMove(
                f,
                f.x + f.push[0],
                f.z + f.push[1],
                f.push[2] * 3 * k,
                dt,
              );
            if (f.t0 >= 0.4) {
              f.st = "hunt";
              f.t0 = 0;
              f.push = null;
            }
            break;
          }
          case "fear":
            f.head = foeTurn(f.head, toYou, dt * 2);
            this.foeMove(
              f,
              f.x - dx / Math.max(dist, 0.1),
              f.z - dz / Math.max(dist, 0.1),
              0.7,
              dt,
            );
            if (f.t0 >= 0.95) {
              f.st = "hunt";
              f.t0 = 0;
            }
            break;
          case "cry":
            f.head = foeTurn(f.head, toYou, dt * 2);
            if (f.t0 >= 1.15) {
              f.st = "hunt";
              f.t0 = 0;
              f.cryCd = 9 + f.rnd() * 4;
              if (dist < 8.5) {
                ev.cry = f;
                this.rootedUntil = nowS + 1.1;
                this.jolt(2.2);
              }
              // the dead around it quicken
              for (const o of C.foes)
                if (o !== f && (o.st === "hunt" || o.st === "idle")) {
                  o.st = "hunt";
                  o.haste = 4;
                }
            }
            break;
          case "fall":
            if (f.t0 >= FALL_T + CRUMBLE_T) {
              f.st = "gone";
              this.caveScene.remove(f.mesh);
              f.mesh.geometry.dispose();
              f.mesh.material.dispose();
            }
            break;
        }
        if (f.haste > 0) {
          f.baseSpeed = f.baseSpeed || f.speed;
          f.haste -= dt;
          f.speed = f.haste > 0 ? f.baseSpeed * 1.35 : f.baseSpeed;
        }
        if (f.st !== "gone") this.poseFoe(f, nowS);
      }
      C.foes = C.foes.filter((f) => f.st !== "gone");
    },

    // ---------- how a foe looks this frame: where its feet are, how it leans, its joints ----------
    poseFoe(f, nowS) {
      const C = this.cave,
        U = f.U,
        S = f.shelf;
      let fx = f.x,
        fz = f.z,
        fy,
        head = f.head,
        lean = 0;
      let armL = -1.3,
        armR = -1.3,
        legL = 0,
        legR = 0,
        headP = 0.25,
        headY = 0;
      const sway = Math.sin(nowS * 1.7 + f.phase) * 0.06;
      U.uEyes.value = f.st === "lie" || f.st === "wait" ? 0 : 1;
      U.uHit.value = f.hitT > 0 ? f.hitT / 0.16 : 0;
      U.uGone.value = 0;
      switch (f.st) {
        case "lie":
        case "wait":
        case "rise": {
          // stiff as a board, pivoting up on the heels
          const k =
            f.st === "rise"
              ? ease(f.t0 / (RISE_T * (f.tier === "lord" ? 1.4 : 1)))
              : 0;
          fx = S.sx + (S.Ux * f.h) / 2;
          fz = S.sz + (S.Uz * f.h) / 2;
          fy = S.fy + S.top + 0.1 * (1 - k);
          head = Math.atan2(S.Ux, -S.Uz);
          lean = (-Math.PI / 2) * (1 - k);
          armL = armR = 0;
          headP = f.st === "rise" ? -0.15 * Math.sin(k * Math.PI) : 0;
          if (f.st === "rise" && k > 0.7) {
            const a = (k - 0.7) / 0.3;
            armL = armR = -1.3 * a;
            headP = 0.25 * a;
          }
          break;
        }
        case "step": {
          // down off the shelf, a jolt of a step
          const k = ease(f.t0 / STEP_T);
          fx = f.from[0] + (f.to[0] - f.from[0]) * k;
          fz = f.from[1] + (f.to[1] - f.from[1]) * k;
          const y0 = S.fy + S.top,
            y1 = caveFloor(C.plan, f.to[0], f.to[1]);
          fy = y0 + (y1 - y0) * k + Math.sin(k * Math.PI) * 0.12;
          head = Math.atan2(S.Ux, -S.Uz);
          legL = -0.5 * Math.sin(k * Math.PI);
          legR = 0.3 * Math.sin(k * Math.PI);
          break;
        }
        case "fall":
        case "gone": {
          // falling back, then crumbling to nothing
          const k = ease(f.t0 / FALL_T);
          lean = (-Math.PI / 2) * k;
          armL = armR = -1.3 * (1 - k) - 0.4 * k;
          headP = -0.3 * k;
          fy = caveFloor(C.plan, fx, fz) + 0.1 * k;
          U.uGone.value = Math.max(0, (f.t0 - FALL_T) / CRUMBLE_T);
          U.uEyes.value = k < 0.5 ? 1 : 0;
          break;
        }
        default: {
          fy = caveFloor(C.plan, fx, fz);
          const w = f.walk,
            s = Math.sin(f.phase);
          legL = s * 0.45 * w;
          legR = -s * 0.45 * w;
          lean = 0.1 + 0.05 * w;
          headP = 0.28 + sway;
          headY = Math.sin(nowS * 0.9 + f.phase) * 0.18;
          armL = -1.3 + Math.sin(f.phase * 0.5) * 0.08 * w + sway;
          armR = -1.3 - Math.sin(f.phase * 0.5) * 0.08 * w - sway;
          fy += Math.abs(Math.cos(f.phase)) * 0.03 * w;
          if (f.st === "idle") {
            armL = armR = -0.35 + sway;
            lean = 0.04;
            headP = 0.4;
          }
          if (f.st === "wind") {
            const k = ease(f.t0 / f.wind);
            armL = armR = -1.3 - 1.45 * k;
            headP = 0.28 - 0.5 * k;
            lean = 0.1 - 0.16 * k;
          }
          if (f.st === "strike") {
            const k = ease(f.t0 / 0.2);
            armL = armR = -2.75 + 2.2 * k;
            headP = -0.22 + 0.6 * k;
            lean = -0.06 + 0.3 * k;
          }
          if (f.st === "rest") {
            const k = ease(f.t0 / f.rest);
            armL = armR = -0.55 - 0.75 * k;
            lean = 0.24 - 0.14 * k;
          }
          if (f.st === "stagger") {
            lean = -0.28;
            armL = -0.5;
            armR = -0.8;
            headP = -0.2;
          }
          if (f.st === "fear") {
            lean = -0.2;
            armL = armR = -2.0;
            headP = 0.55;
            headY = 0;
          }
          if (f.st === "cry") {
            const k = Math.min(1, f.t0 / 0.4);
            lean = -0.18 * k;
            headP = -0.75 * k + Math.sin(nowS * 40) * 0.04 * k;
            armL = armR = -1.3 + 0.9 * k;
          }
        }
      }
      U.uArmL.value = armL;
      U.uArmR.value = armR;
      U.uLegL.value = legL;
      U.uLegR.value = legR;
      U.uHeadP.value = headP;
      U.uHeadY.value = headY;
      // its frame: forward along its heading, leaning forward (or back, lying, falling) about its feet
      const hx = Math.sin(head),
        hz = -Math.cos(head),
        cl = Math.cos(lean),
        sl = Math.sin(lean);
      const Yx = hx * sl,
        Yy = cl,
        Yz = hz * sl; // up through the body
      const Zx = hx * cl,
        Zy = -sl,
        Zz = hz * cl; // out of its front
      const Xx = Yy * Zz - Yz * Zy,
        Xy = Yz * Zx - Yx * Zz,
        Xz = Yx * Zy - Yy * Zx;
      f.mesh.matrix.set(
        Xx,
        Yx,
        Zx,
        fx - C.x,
        Xy,
        Yy,
        Zy,
        fy,
        Xz,
        Yz,
        Zz,
        fz - C.z,
        0,
        0,
        0,
        1,
      );
      f.mesh.matrixWorldNeedsUpdate = true;
      f.mesh.updateMatrixWorld(true);
    },

    // ---------- you strike one ----------
    // dmg: how hard; knock: how far it is pushed back. Returns 'down' if that finished it.
    hitFoe(f, dmg, knock = 0.3) {
      const C = this.cave;
      if (!C || !f || f.hp <= 0 || f.st === "fall" || f.st === "gone")
        return null;
      f.hp = Math.max(0, f.hp - dmg);
      f.hitT = 0.16;
      f.seen = 1;
      if (f.st === "idle") f.st = "hunt";
      if (f.hp <= 0) {
        f.st = "fall";
        f.t0 = 0;
        f.walk = 0;
        return "down";
      }
      // a heavy enough blow stops it in its tracks, now and then (never the stone-wrapped or a lord)
      // (once it has begun a blow, only a really heavy one stops it: step back instead)
      if (
        !f.unshaken &&
        f.poise <= 0 &&
        (f.st === "wind" ? dmg >= 15 : dmg >= 8)
      ) {
        const dx = f.x - C.x,
          dz = f.z - C.z,
          L = Math.hypot(dx, dz) || 1;
        f.st = "stagger";
        f.t0 = 0;
        f.poise = 1.6;
        f.push = [dx / L, dz / L, knock];
      }
      return "hit";
    },
    // the foe you would hit, if any: alive, up, in front of you, within reach
    foeAt(reach) {
      const C = this.cave;
      if (!C || !C.foes) return null;
      const h = -this.yaw;
      let best = null;
      for (const f of C.foes) {
        if (
          f.hp <= 0 ||
          f.st === "lie" ||
          f.st === "wait" ||
          f.st === "rise" ||
          f.st === "fall" ||
          f.st === "gone"
        )
          continue;
        const dx = f.x - C.x,
          dz = f.z - C.z,
          d = Math.hypot(dx, dz);
        if (d > reach + 0.35) continue;
        const off = Math.abs(
          Math.atan2(
            Math.sin(Math.atan2(dx, -dz) - h),
            Math.cos(Math.atan2(dx, -dz) - h),
          ),
        );
        if (off > Math.atan2(0.45, Math.max(d, 0.3)) + 0.45) continue;
        const score = d + off * 1.5;
        if (!best || score < best.score) best = { f, d, score };
      }
      return best;
    },
    // the one to show the strength of: what you are fighting, or the nearest that is coming for you
    foeShown(nowS) {
      const C = this.cave;
      if (!C || !C.foes) return null;
      if (
        this.lastFoe &&
        this.lastFoe.st !== "gone" &&
        nowS - (this.lastFoeAt || 0) < 4
      )
        return this.lastFoe;
      let best = null;
      for (const f of C.foes) {
        if (f.st === "lie" || f.st === "wait" || f.st === "gone" || f.hp <= 0)
          continue;
        const d = Math.hypot(f.x - C.x, f.z - C.z);
        if (d < 7 && (!best || d < best.d)) best = { f, d };
      }
      return best ? best.f : null;
    },
    // nobody walks through the dead
    foeBlocks(x, z) {
      const C = this.cave;
      if (!C || !C.foes) return false;
      for (const f of C.foes) {
        if (
          f.st === "lie" ||
          f.st === "wait" ||
          f.st === "rise" ||
          f.st === "fall" ||
          f.st === "gone"
        )
          continue;
        if (Math.hypot(x - f.x, z - f.z) < 0.7) return true;
      }
      return false;
    },
  });

  // ---- view/bow.js ----
  // ============================================================
  // BOW — drawing a bow and loosing arrows. Hold to draw (it takes a moment
  // to bend it all the way), let go to loose. The arrow goes where you look
  // and drops as it flies; it stops in the first thing it meets: a beast, a
  // hunter, a trunk, a rock, the ground. Half drawn it flies slow and weak.
  // Arrows that go into the ground can often be pulled out again, and the
  // ones left in a beast come back to you when you butcher it.
  // Flight is worked out in metres from where you stood when you loosed it
  // (x east, y up from sea level, z south): over a bowshot the world is flat.
  // ============================================================

