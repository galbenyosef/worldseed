// index-inline-2 94 — math
// Lines 45989-47872 of readable/index-inline-2.pretty.js (statement-aligned).
  Object.assign(GroundView.prototype, {
    // ---------- fields, painted on the ground (see groundview's FIELD_FS) ----------
    // A place's fields, when it is built: where each is, which way its rows run (as a vector on the planet), its size
    fieldsOf(v) {
      const R = this.R,
        F = v.F,
        s = v.site,
        out = [];
      for (const pr of v.plan.props) {
        if (pr.t !== "field" && pr.t !== "myfield") continue;
        const cs = Math.cos(pr.rot || 0),
          sn = Math.sin(pr.rot || 0);
        out.push({
          pr,
          mine: pr.t === "myfield",
          dir: stepOn(s.dir, F, pr.x, -pr.z, R),
          uW: [
            F.e[0] * cs - F.n[0] * sn,
            F.e[1] * cs - F.n[1] * sn,
            F.e[2] * cs - F.n[2] * sn,
          ],
          hw: pr.w / 2,
          hd: pr.d / 2,
          seed: ((pr.seed || 0) % 997) / 10,
        });
      }
      return out;
    },
    // what it grows and how far on: your own field as it stands today; a farm's as it is (gone over if the farm is lost)
    fieldNow(fd, v) {
      if (fd.mine) {
        const rec = v.site.home && v.site.home.field,
          st = fieldState(rec, this.t);
        return [
          rec && rec.crop ? FIELD_CROP[rec.crop] || 1 : 0,
          FIELD_STAGE[st.stage] ?? 0,
        ];
      }
      const c = fd.pr.crop;
      if (c === "grain") return [1, v.lost ? 5 : 4];
      if (c === "green") return [2, v.lost ? 5 : 3];
      return [0, 0];
    },
    // every frame: the nearest of them, where they are from where you stand, to the ground's shader
    stepFields() {
      const U = this.uniforms;
      if (!U || !U.uFN) return;
      if (this.fieldRowsFor !== this.ramps) {
        this.fieldRowsFor = this.ramps;
        FIELD_ROWS.forEach((c, i) => {
          U.uFRow.value[i] = this.row(c);
        });
      }
      const V = this.view,
        R = this.R,
        near = [];
      if (this.siteViews && !this.cave)
        for (const v of this.siteViews.values()) {
          if (
            !v.fields ||
            !v.fields.length ||
            arcM(this.p, v.site.dir, R) > 1000
          )
            continue;
          for (const fd of v.fields) {
            const m = arcM(this.p, fd.dir, R) - Math.hypot(fd.hw, fd.hd);
            if (m < 900) near.push({ fd, v, m });
          }
        }
      near.sort((a, b) => a.m - b.m);
      const n = Math.min(FIELD_N, near.length),
        e = V.F.e,
        nn = V.F.n;
      for (let i = 0; i < n; i++) {
        const { fd, v } = near[i];
        const c = [
          fd.dir[0] * R - V.O[0],
          fd.dir[1] * R - V.O[1],
          fd.dir[2] * R - V.O[2],
        ];
        const ux = fd.uW[0] * e[0] + fd.uW[1] * e[1] + fd.uW[2] * e[2],
          uz = -(fd.uW[0] * nn[0] + fd.uW[1] * nn[1] + fd.uW[2] * nn[2]),
          L = Math.hypot(ux, uz) || 1;
        U.uFA.value[i].set(
          c[0] * e[0] + c[1] * e[1] + c[2] * e[2],
          -(c[0] * nn[0] + c[1] * nn[1] + c[2] * nn[2]),
          ux / L,
          uz / L,
        );
        const [crop, stage] = this.fieldNow(fd, v);
        U.uFB.value[i].set(fd.hw, fd.hd, crop, stage);
        U.uFS.value[i] = fd.seed;
      }
      U.uFN.value = n;
    },

    fvRowsGet() {
      if (this.fvRows && this.fvRowsFor === this.ramps) return this.fvRows;
      this.fvRowsFor = this.ramps;
      this.fvRows = Object.fromEntries(
        Object.entries(FV_COLS).map(([k, c]) => [k, this.row(c)]),
      );
      return this.fvRows;
    },

    // ---------- the field and the pen, into the house's mesh (called from placesview) ----------
    farmPropInto(mb, pr, y0, c, h) {
      const { rows, col, boxes, hAt, base } = c,
        F2 = this.fvRowsGet();
      const { at } = h;
      // a point in the part's own metres, on the ground
      const gy = (u, w) => {
        const q = at(u, 0, w);
        return hAt(q[0], q[2]);
      };
      const W = pr.w,
        D = pr.d;
      // a fence round the edge: posts, rails, a gap for the gate (cross: which edge, and where along it)
      const fence = (hh, step, rails, row, gate) => {
        const corners = [
          [-W / 2, -D / 2],
          [W / 2, -D / 2],
          [W / 2, D / 2],
          [-W / 2, D / 2],
        ];
        const edgeOf = { "w-": 0, "u+": 1, "w+": 2, "u-": 3 };
        for (let e = 0; e < 4; e++) {
          const [u0, w0] = corners[e],
            [u1, w1] = corners[(e + 1) % 4],
            L = Math.hypot(u1 - u0, w1 - w0),
            n = Math.max(2, Math.round(L / step));
          const isGate = edgeOf[gate] === e;
          let prev = null;
          for (let k = 0; k <= n; k++) {
            const t = k / n,
              u = u0 + (u1 - u0) * t,
              w = w0 + (w1 - w0) * t;
            // (the gate: a gap in the middle of its edge)
            if (isGate && Math.abs(t - 0.5) * L < 0.85) {
              prev = null;
              continue;
            }
            const y = gy(u, w),
              p = at(u, y, w);
            mb.prism(
              [p[0], y - 0.2, p[2]],
              [p[0], y + hh, p[2]],
              0.06,
              0.05,
              4,
              row,
              PAT.BARK,
            );
            col.push(p[0], p[2], 0.13, base + y - 0.2, base + y + hh, 1);
            if (prev)
              for (const r of rails)
                mb.prism(
                  [prev[0], prev[1] + r, prev[2]],
                  [p[0], y + r, p[2]],
                  0.035,
                  0.035,
                  4,
                  row,
                  PAT.BARK,
                );
            prev = [p[0], y, p[2]];
          }
          // between the posts nothing gets through either (only the gate)
          if (!isGate) {
            const cu = (u0 + u1) / 2,
              cw = (w0 + w1) / 2,
              q = at(cu, 0, cw),
              along = Math.atan2(w1 - w0, u1 - u0) + (pr.rot || 0);
            boxes.push({
              x: q[0],
              z: q[2],
              hx: L / 2,
              hz: 0.08,
              cs: Math.cos(along),
              sn: Math.sin(along),
            });
          } else {
            // the two lengths either side of the gap
            for (const sgn of [-1, 1]) {
              const a = 0.5 + sgn * 0.5,
                b2 = 0.5 + (sgn * 0.85) / L,
                uA = u0 + (u1 - u0) * a,
                wA = w0 + (w1 - w0) * a,
                uB = u0 + (u1 - u0) * b2,
                wB = w0 + (w1 - w0) * b2;
              const cu = (uA + uB) / 2,
                cw = (wA + wB) / 2,
                len = Math.hypot(uB - uA, wB - wA),
                q = at(cu, 0, cw),
                along = Math.atan2(w1 - w0, u1 - u0) + (pr.rot || 0);
              boxes.push({
                x: q[0],
                z: q[2],
                hx: len / 2,
                hz: 0.08,
                cs: Math.cos(along),
                sn: Math.sin(along),
              });
            }
          }
        }
      };
      if (pr.t === "myfield") {
        const rec = c.s.home && c.s.home.field,
          st = fieldState(rec, this.t),
          crop = rec && rec.crop,
          stage = st.stage;
        c.v.fieldStage = stage + ":" + (crop || "");
        // (the earth turned in ridges, and what grows along them, are painted on the ground: see stepFields)
        // a scarecrow over the grain
        if (crop === "grain" && stage !== "sown") {
          const u = W / 2 - 1.4,
            w = -D / 2 + 1.5,
            y = gy(u, w),
            p = at(u, y, w);
          mb.prism(
            [p[0], y - 0.3, p[2]],
            [p[0], y + 1.9, p[2]],
            0.04,
            0.04,
            4,
            rows.wood,
            PAT.BARK,
          );
          mb.prism(
            at(u - 0.6, y + 1.45, w),
            at(u + 0.6, y + 1.45, w),
            0.03,
            0.03,
            4,
            rows.wood,
            PAT.BARK,
          );
          mb.box(
            p[0] - 0.17,
            y + 1.0,
            p[2] - 0.11,
            p[0] + 0.17,
            y + 1.52,
            p[2] + 0.11,
            F2.coat,
            PAT.CLOTH,
          );
          mb.box(
            p[0] - 0.1,
            y + 1.55,
            p[2] - 0.1,
            p[0] + 0.1,
            y + 1.78,
            p[2] + 0.1,
            F2.sack,
            PAT.CLOTH,
          );
          mb.cone([p[0], y + 1.76, p[2]], y + 2.05, 0.3, 6, F2.hat, PAT.THATCH);
          col.push(p[0], p[2], 0.15, base + y - 0.3, base + y + 1.9, 1);
        }
        fence(0.75, 1.7, [0.32, 0.64], F2.wattle, pr.gate);
        return;
      }
      if (pr.t === "mypen") {
        const rec = c.s.home && c.s.home.pen,
          L = pr.lay;
        if (rec) stepPen(rec, this.t);
        fence(1.1, 1.5, [0.45, 0.9], rows.wood, pr.gate);
        // the gate hurdle, swung open against the fence beside the gap
        {
          const g = L.gate,
            pu = L.pu,
            pw = L.pw,
            u0 = g.u + pu * 0.85,
            w0 = g.w + pw * 0.85,
            u1 = u0 + g.du * 1.5,
            w1 = w0 + g.dw * 1.5;
          const y = gy(u0, w0);
          for (const r of [0.2, 0.55, 0.9])
            mb.prism(
              at(u0, y + r, w0),
              at(u1, gy(u1, w1) + r, w1),
              0.03,
              0.03,
              4,
              F2.plank,
              PAT.PLANK,
            );
          for (const t of [0, 0.5, 1]) {
            const u = u0 + (u1 - u0) * t,
              w = w0 + (w1 - w0) * t;
            mb.prism(
              at(u, gy(u, w) + 0.05, w),
              at(u, gy(u, w) + 1.0, w),
              0.03,
              0.03,
              4,
              F2.plank,
              PAT.PLANK,
            );
          }
        }
        // the shed in the far corner: posts, a roof sloping down to the back, a back wall, straw on the floor
        {
          const S = L.shed,
            a = S.a,
            ca = Math.cos(a),
            sa = Math.sin(a),
            du = S.du,
            dw = S.dw;
          // (in the part's metres: along the shed is (ca, sa), into it, towards the back, is (du, dw))
          const P = (s1, s2) => [
            S.u + ca * s1 + du * s2,
            S.w + sa * s1 + dw * s2,
          ];
          const Ls = 1.35,
            Ds = 0.9,
            hF = 1.9,
            hB = 1.35;
          for (const [s1, s2, hh] of [
            [-Ls, -Ds, hF],
            [Ls, -Ds, hF],
            [-Ls, Ds, hB],
            [Ls, Ds, hB],
          ]) {
            const [u, w] = P(s1, s2),
              y = gy(u, w),
              p = at(u, y, w);
            mb.prism(
              [p[0], y - 0.2, p[2]],
              [p[0], y + hh, p[2]],
              0.06,
              0.06,
              4,
              rows.wood,
              PAT.BARK,
            );
            col.push(p[0], p[2], 0.1, base + y - 0.2, base + y + hh, 1);
          }
          const yC = gy(S.u, S.w),
            roofAt = (s1, s2, hh) => {
              const [u, w] = P(s1, s2);
              return at(u, yC + hh, w);
            };
          const r0 = roofAt(-Ls - 0.2, -Ds - 0.3, hF + 0.05),
            r1 = roofAt(Ls + 0.2, -Ds - 0.3, hF + 0.05),
            r2 = roofAt(Ls + 0.2, Ds + 0.25, hB - 0.05),
            r3 = roofAt(-Ls - 0.2, Ds + 0.25, hB - 0.05);
          mb.quad(r0, r1, r2, r3, rows.roof || F2.straw, PAT.THATCH);
          mb.quad(r3, r2, r1, r0, rows.roof || F2.straw, PAT.THATCH);
          const b0 = roofAt(-Ls, Ds, 0),
            b1 = roofAt(Ls, Ds, 0);
          mb.quad(
            [b0[0], yC - 0.2, b0[2]],
            [b1[0], yC - 0.2, b1[2]],
            [b1[0], yC + hB, b1[2]],
            [b0[0], yC + hB, b0[2]],
            F2.plank,
            PAT.PLANK,
          );
          mb.quad(
            [b1[0], yC - 0.2, b1[2]],
            [b0[0], yC - 0.2, b0[2]],
            [b0[0], yC + hB, b0[2]],
            [b1[0], yC + hB, b1[2]],
            F2.plank,
            PAT.PLANK,
          );
          // straw on the floor of it
          const rndS = mulberry32(pr.seed ^ 0x57a);
          for (let k = 0; k < 7; k++) {
            const [u, w] = P(
              (rndS() - 0.5) * Ls * 1.7,
              (rndS() - 0.3) * Ds * 1.4,
            );
            const y = gy(u, w),
              p = at(u, y, w);
            lumpInto(
              mb,
              p[0],
              y - 0.08,
              p[2],
              0.35,
              0.1,
              0.3,
              F2.straw,
              rows.grain,
              hashInt(k, 3, pr.seed),
              rndS() * 6,
            );
          }
          // the hen house: a box on legs with a pitched lid, a hole for a door, a ramp down to it
          const C = L.coop,
            yH = gy(C.u, C.w),
            hw = 0.42,
            hd = 0.32,
            leg = 0.38,
            ht = 0.42;
          const Q = (s1, s2, yy) => {
            const u = C.u + ca * s1 + du * s2,
              w = C.w + sa * s1 + dw * s2;
            return at(u, yH + yy, w);
          };
          for (const [s1, s2] of [
            [-hw, -hd],
            [hw, -hd],
            [hw, hd],
            [-hw, hd],
          ]) {
            const p = Q(s1 * 0.85, s2 * 0.85, 0);
            mb.prism(
              [p[0], yH - 0.1, p[2]],
              [p[0], yH + leg, p[2]],
              0.035,
              0.035,
              4,
              F2.plankDark,
              PAT.NONE,
            );
          }
          const c8 = [
              Q(-hw, -hd, leg),
              Q(hw, -hd, leg),
              Q(hw, hd, leg),
              Q(-hw, hd, leg),
            ],
            t8 = [
              Q(-hw, -hd, leg + ht),
              Q(hw, -hd, leg + ht),
              Q(hw, hd, leg + ht),
              Q(-hw, hd, leg + ht),
            ];
          for (let k = 0; k < 4; k++) {
            const a0 = c8[k],
              a1 = c8[(k + 1) % 4],
              b0q = t8[k],
              b1q = t8[(k + 1) % 4];
            mb.quad(a1, a0, b0q, b1q, F2.plank, PAT.PLANK);
            mb.quad(a0, a1, b1q, b0q, F2.plank, PAT.PLANK);
          }
          mb.quad(c8[0], c8[1], c8[2], c8[3], F2.plank, PAT.PLANK);
          const ridgeA = Q(-hw - 0.06, 0, leg + ht + 0.24),
            ridgeB = Q(hw + 0.06, 0, leg + ht + 0.24);
          const eF0 = Q(-hw - 0.06, -hd - 0.08, leg + ht - 0.02),
            eF1 = Q(hw + 0.06, -hd - 0.08, leg + ht - 0.02),
            eB0 = Q(-hw - 0.06, hd + 0.08, leg + ht - 0.02),
            eB1 = Q(hw + 0.06, hd + 0.08, leg + ht - 0.02);
          for (const [p0, p1] of [
            [eF0, eF1],
            [eB1, eB0],
          ]) {
            mb.quad(p0, p1, ridgeB, ridgeA, F2.plankDark, PAT.SLATE);
            mb.quad(ridgeA, ridgeB, p1, p0, F2.plankDark, PAT.SLATE);
          }
          // the door hole in its front, and the ramp
          const fd = Q(0, -hd - 0.012, leg + 0.06),
            fd2 = Q(0, -hd - 0.012, leg + 0.26),
            hole = 0.09,
            sideV = [ca * hole, 0, sa * hole];
          void sideV;
          const hl0 = Q(-0.1, -hd - 0.012, leg + 0.06),
            hl1 = Q(0.1, -hd - 0.012, leg + 0.06),
            hl2 = Q(0.1, -hd - 0.012, leg + 0.28),
            hl3 = Q(-0.1, -hd - 0.012, leg + 0.28);
          mb.quad(hl1, hl0, hl3, hl2, rows.char, PAT.NONE);
          mb.quad(hl0, hl1, hl2, hl3, rows.char, PAT.NONE);
          void fd;
          void fd2;
          const rp0 = Q(-0.1, -hd, leg),
            rp1 = Q(0.1, -hd, leg),
            rp2 = Q(0.1, -hd - 0.7, 0.02),
            rp3 = Q(-0.1, -hd - 0.7, 0.02);
          mb.quad(rp0, rp1, rp2, rp3, F2.plank, PAT.PLANK);
          mb.quad(rp3, rp2, rp1, rp0, F2.plank, PAT.PLANK);
          // eggs waiting in the nest, seen through its open side
          const eggs = rec
            ? Math.min(
                6,
                rec.beasts.reduce(
                  (n2, b) => n2 + (b.k === "hen" ? b.ready : 0),
                  0,
                ),
              )
            : 0;
          for (let k = 0; k < eggs; k++) {
            const p = Q(
              -0.24 + (k % 3) * 0.2,
              -0.05 + Math.floor(k / 3) * 0.14,
              leg + 0.04,
            );
            mb.box(
              p[0] - 0.035,
              p[1],
              p[2] - 0.035,
              p[0] + 0.035,
              p[1] + 0.07,
              p[2] + 0.035,
              F2.egg,
              PAT.NONE,
            );
          }
          const cc = at(C.u, 0, C.w),
            along = a + (pr.rot || 0);
          boxes.push({
            x: cc[0],
            z: cc[2],
            hx: hw + 0.05,
            hz: hd + 0.05,
            cs: Math.cos(along),
            sn: Math.sin(along),
          });
        }
        // the trough by the gate: a plank box, grain in it if there is any
        {
          const T = L.trough,
            a = T.a + (pr.rot || 0),
            y = gy(T.u, T.w),
            p = at(T.u, y, T.w),
            ca = Math.cos(a),
            sa = Math.sin(a),
            lx = 0.7,
            lz = 0.22,
            ht = 0.38;
          const Q = (s1, s2, yy) => [
            p[0] + ca * s1 - sa * s2,
            y + yy,
            p[2] + sa * s1 + ca * s2,
          ];
          const lo = [
              Q(-lx, -lz, 0.02),
              Q(lx, -lz, 0.02),
              Q(lx, lz, 0.02),
              Q(-lx, lz, 0.02),
            ],
            hi = [
              Q(-lx, -lz, ht),
              Q(lx, -lz, ht),
              Q(lx, lz, ht),
              Q(-lx, lz, ht),
            ];
          for (let k = 0; k < 4; k++) {
            const a0 = lo[k],
              a1 = lo[(k + 1) % 4],
              b0 = hi[k],
              b1 = hi[(k + 1) % 4];
            mb.quad(a1, a0, b0, b1, F2.plank, PAT.PLANK);
            mb.quad(a0, a1, b1, b0, F2.plank, PAT.PLANK);
          }
          for (const s1 of [-lx + 0.08, lx - 0.08])
            for (const s2 of [-lz, lz]) {
              const q = Q(s1, s2, 0);
              mb.prism(
                [q[0], y - 0.15, q[2]],
                [q[0], y + 0.08, q[2]],
                0.04,
                0.04,
                4,
                F2.plankDark,
                PAT.NONE,
              );
            }
          const fill = rec ? Math.min(1, rec.trough / 20) : 0;
          mb.quad(
            Q(-lx + 0.04, -lz + 0.04, 0.1 + 0.24 * fill),
            Q(lx - 0.04, -lz + 0.04, 0.1 + 0.24 * fill),
            Q(lx - 0.04, lz - 0.04, 0.1 + 0.24 * fill),
            Q(-lx + 0.04, lz - 0.04, 0.1 + 0.24 * fill),
            fill > 0 ? rows.grain : F2.plankDark,
            fill > 0 ? PAT.THATCH : PAT.NONE,
          );
          boxes.push({
            x: p[0],
            z: p[2],
            hx: lx + 0.04,
            hz: lz + 0.04,
            cs: ca,
            sn: sa,
          });
        }
        c.v.penAt = { x: pr.x, z: pr.z, rot: pr.rot || 0, w: W, d: D, lay: L };
      }
    },

    // ---------- round the house: a well, the hives, a stable, a palisade (called from placesview) ----------
    yardPropInto(mb, pr, y0, c, h) {
      const { rows, col, boxes, hAt, base } = c,
        F2 = this.fvRowsGet();
      const { at } = h,
        rot = pr.rot || 0,
        cs = Math.cos(rot),
        sn = Math.sin(rot);
      const gy = (u, w) => {
        const q = at(u, 0, w);
        return hAt(q[0], q[2]);
      };
      // (roofed the way the house is)
      const kit =
        c.v && c.v.plan && c.v.plan.style
          ? this.styleKit(c.v.plan.style)
          : null;
      const stone = rows.stone || rows.wood,
        wood = rows.wood,
        dark = rows.woodDark || rows.wood,
        roof = kit ? kit.rows.roof : rows.roof || F2.straw,
        roofPat = kit ? kit.style.roofPat : PAT.THATCH;
      // a turned block in the part's own metres (u across, w towards the front), standing on y
      const blk = (u0, u1, w0, w1, ya, yb, row, pat, back = true) => {
        const P = (u, yy, w) => at(u, yy, w),
          W = u1 - u0,
          H = yb - ya,
          D = w1 - w0;
        mb.quad(
          P(u0, ya, w1),
          P(u1, ya, w1),
          P(u1, yb, w1),
          P(u0, yb, w1),
          row,
          pat,
          [
            [0, 0],
            [W, 0],
            [W, H],
            [0, H],
          ],
        );
        if (back)
          mb.quad(
            P(u1, ya, w0),
            P(u0, ya, w0),
            P(u0, yb, w0),
            P(u1, yb, w0),
            row,
            pat,
            [
              [0, 0],
              [W, 0],
              [W, H],
              [0, H],
            ],
          );
        mb.quad(
          P(u1, ya, w1),
          P(u1, ya, w0),
          P(u1, yb, w0),
          P(u1, yb, w1),
          row,
          pat,
          [
            [0, 0],
            [D, 0],
            [D, H],
            [0, H],
          ],
        );
        mb.quad(
          P(u0, ya, w0),
          P(u0, ya, w1),
          P(u0, yb, w1),
          P(u0, yb, w0),
          row,
          pat,
          [
            [0, 0],
            [D, 0],
            [D, H],
            [0, H],
          ],
        );
        mb.quad(
          P(u0, yb, w1),
          P(u1, yb, w1),
          P(u1, yb, w0),
          P(u0, yb, w0),
          row,
          pat,
          [
            [0, 0],
            [W, 0],
            [W, D],
            [0, D],
          ],
        );
      };
      // a flat panel both ways, between two points on the ground (a wall of planks, a stretch of palisade)
      const panel = (
        ua,
        wa,
        ya0,
        ya1,
        ub,
        wb,
        yb0,
        yb1,
        row,
        pat,
        uvVert = false,
      ) => {
        const A0 = at(ua, ya0, wa),
          A1 = at(ua, ya1, wa),
          B0 = at(ub, yb0, wb),
          B1 = at(ub, yb1, wb),
          L = Math.hypot(ub - ua, wb - wa),
          H = Math.max(ya1 - ya0, yb1 - yb0);
        const uv = uvVert
          ? [
              [0, 0],
              [0, L],
              [H, L],
              [H, 0],
            ]
          : [
              [0, 0],
              [L, 0],
              [L, H],
              [0, H],
            ];
        mb.quad(A0, B0, B1, A1, row, pat, uv);
        mb.quad(...mb.under(A0, B0, B1, A1), row, pat, uv, { lv: -0.25 });
      };
      if (pr.t === "mywell") {
        // a ring of stone, the water dark down inside it, two posts and a windlass with a bucket on its rope, a little roof
        const r0 = 0.62,
          r1 = 0.48,
          top = y0 + 0.78;
        mb.prism(
          at(0, y0 - 0.45, 0),
          at(0, top, 0),
          r0,
          r0 - 0.02,
          10,
          stone,
          PAT.STONE,
        );
        mb.prism(
          at(0, top, 0),
          at(0, y0 - 0.2, 0),
          r1,
          r1,
          10,
          stone,
          PAT.STONE,
          { lv: -0.6 },
        );
        for (let k = 0; k < 10; k++) {
          const a0 = (k / 10) * Math.PI * 2,
            a1 = ((k + 1) / 10) * Math.PI * 2;
          mb.quad(
            at(Math.cos(a1) * r1, top, Math.sin(a1) * r1),
            at(Math.cos(a0) * r1, top, Math.sin(a0) * r1),
            at(Math.cos(a0) * r0, top, Math.sin(a0) * r0),
            at(Math.cos(a1) * r0, top, Math.sin(a1) * r0),
            stone,
            PAT.STONE,
            null,
            { lv: 0.15 },
          );
        }
        mb.cone(
          at(0, y0 - 0.15, 0),
          y0 - 0.15,
          r1,
          10,
          rows.blue || stone,
          PAT.NONE,
          { lv: -1.4 },
        );
        for (const u of [-0.72, 0.72]) {
          mb.prism(
            at(u, y0 - 0.3, 0),
            at(u, y0 + 2.05, 0),
            0.07,
            0.06,
            4,
            wood,
            PAT.BARK,
          );
          col.push(
            ...(() => {
              const q = at(u, 0, 0);
              return [q[0], q[2], 0.1, base + y0 - 0.3, base + y0 + 2.05, 1];
            })(),
          );
        }
        mb.prism(
          at(-0.8, y0 + 1.5, 0),
          at(0.8, y0 + 1.5, 0),
          0.06,
          0.06,
          6,
          dark,
          PAT.BARK,
          null,
          0,
          true,
        );
        mb.prism(
          at(0.8, y0 + 1.5, 0),
          at(0.8, y0 + 1.5, 0.28),
          0.025,
          0.025,
          4,
          dark,
          PAT.NONE,
        );
        mb.prism(
          at(0.8, y0 + 1.5, 0.28),
          at(0.8, y0 + 1.3, 0.28),
          0.025,
          0.025,
          4,
          dark,
          PAT.NONE,
        );
        mb.prism(
          at(0.1, y0 + 1.47, 0),
          at(0.1, y0 + 1.12, 0),
          0.012,
          0.012,
          3,
          rows.rag || wood,
          PAT.NONE,
        );
        mb.prism(
          at(0.1, y0 + 0.88, 0),
          at(0.1, y0 + 1.12, 0),
          0.13,
          0.15,
          7,
          wood,
          PAT.PLANK,
          null,
          0,
          true,
        );
        // the roof: two boards meeting over the windlass
        for (const s of [-1, 1]) {
          const e = at(-0.95, y0 + 2.0, s * 0.75),
            f = at(0.95, y0 + 2.0, s * 0.75),
            g = at(0.95, y0 + 2.42, 0),
            hh = at(-0.95, y0 + 2.42, 0),
            uv = [
              [0, 0],
              [1.9, 0],
              [1.9, 0.86],
              [0, 0.86],
            ];
          if (s > 0) {
            mb.quad(e, f, g, hh, roof, roofPat, uv);
            mb.quad(...mb.under(e, f, g, hh), roof, roofPat, uv, { lv: -0.5 });
          } else {
            mb.quad(f, e, hh, g, roof, roofPat, uv);
            mb.quad(...mb.under(f, e, hh, g), roof, roofPat, uv, { lv: -0.5 });
          }
        }
        col.push(pr.x, pr.z, r0 + 0.05, base + y0 - 0.45, base + top, 1);
        return;
      }
      if (pr.t === "myhives") {
        // a low bench along the wall, three straw skeps on it, each with a dark door at its foot
        const bt = y0 + 0.42;
        blk(-0.9, 0.9, -0.24, 0.24, bt - 0.06, bt, wood, PAT.PLANK);
        for (const u of [-0.8, 0.8])
          for (const w of [-0.18, 0.18])
            mb.prism(
              at(u, y0 - 0.15, w),
              at(u, bt - 0.06, w),
              0.035,
              0.035,
              4,
              dark,
              PAT.NONE,
            );
        for (const u of [-0.56, 0, 0.56]) {
          mb.prism(
            at(u, bt, 0),
            at(u, bt + 0.2, 0),
            0.25,
            0.24,
            9,
            F2.straw,
            PAT.THATCH,
          );
          mb.prism(
            at(u, bt + 0.2, 0),
            at(u, bt + 0.36, 0),
            0.24,
            0.19,
            9,
            F2.straw,
            PAT.THATCH,
          );
          mb.cone(
            at(u, bt + 0.36, 0),
            bt + 0.52,
            0.19,
            9,
            F2.straw,
            PAT.THATCH,
          );
          mb.quad(
            at(u - 0.05, bt + 0.01, 0.252),
            at(u + 0.05, bt + 0.01, 0.252),
            at(u + 0.05, bt + 0.07, 0.25),
            at(u - 0.05, bt + 0.07, 0.25),
            rows.char || dark,
            PAT.NONE,
          );
        }
        boxes.push({ x: pr.x, z: pr.z, hx: 0.95, hz: 0.3, cs, sn });
        return;
      }
      if (pr.t === "mystable") {
        // a stable open to the front: corner posts, plank walls behind and at the sides, a roof sloping down to the
        // back, a manger with hay along the back wall, a water butt in a corner, straw on the floor
        const W = pr.w,
          D = pr.d,
          hb = 2.25,
          hf = 2.75,
          yc = gy(0, 0),
          hAtW = (w) => hb + ((hf - hb) * (w + D / 2)) / D;
        for (const [u, w] of [
          [-W / 2, -D / 2],
          [W / 2, -D / 2],
          [-W / 2, D / 2],
          [W / 2, D / 2],
        ]) {
          const y = gy(u, w);
          mb.prism(
            at(u, y - 0.3, w),
            at(u, yc + hAtW(w), w),
            0.09,
            0.08,
            4,
            wood,
            PAT.BARK,
          );
          const q = at(u, 0, w);
          col.push(q[0], q[2], 0.12, base + y - 0.3, base + yc + hAtW(w), 1);
        }
        panel(
          -W / 2,
          -D / 2,
          yc - 0.3,
          yc + hb,
          W / 2,
          -D / 2,
          yc - 0.3,
          yc + hb,
          F2.plank,
          PAT.PLANK,
        );
        for (const u of [-W / 2, W / 2])
          panel(
            u,
            -D / 2,
            yc - 0.3,
            yc + hb,
            u,
            D / 2 - 0.05,
            yc - 0.3,
            yc + hf - 0.05,
            F2.plank,
            PAT.PLANK,
          );
        const r0 = at(-W / 2 - 0.25, yc + hf + 0.05, D / 2 + 0.35),
          r1 = at(W / 2 + 0.25, yc + hf + 0.05, D / 2 + 0.35),
          r2 = at(W / 2 + 0.25, yc + hb - 0.1, -D / 2 - 0.35),
          r3 = at(-W / 2 - 0.25, yc + hb - 0.1, -D / 2 - 0.35);
        {
          const uv = [
            [0, 0],
            [W + 0.5, 0],
            [W + 0.5, D + 0.7],
            [0, D + 0.7],
          ];
          mb.quad(r0, r1, r2, r3, roof, roofPat, uv);
          mb.quad(...mb.under(r0, r1, r2, r3), roof, roofPat, uv, { lv: -0.5 });
        }
        // the manger, the hay in it, a rack over it
        blk(
          -1.0,
          1.0,
          -D / 2 + 0.06,
          -D / 2 + 0.5,
          yc + 0.55,
          yc + 0.95,
          F2.plank,
          PAT.PLANK,
        );
        for (const u of [-0.9, 0.9])
          mb.prism(
            at(u, yc - 0.1, -D / 2 + 0.3),
            at(u, yc + 0.6, -D / 2 + 0.3),
            0.04,
            0.04,
            4,
            dark,
            PAT.NONE,
          );
        const rnd = mulberry32(pr.seed || 7);
        for (let k = 0; k < 5; k++) {
          const q = at(-0.8 + k * 0.4, 0, -D / 2 + 0.28);
          lumpInto(
            mb,
            q[0],
            yc + 0.9,
            q[2],
            0.26,
            0.16,
            0.2,
            F2.straw,
            rows.grain || F2.straw,
            hashInt(k, 9, pr.seed || 7),
            rnd() * 6,
          );
        }
        for (let k = 0; k < 9; k++) {
          const u = (rnd() - 0.5) * (W - 0.8),
            w = (rnd() - 0.5) * (D - 0.9),
            q = at(u, 0, w);
          lumpInto(
            mb,
            q[0],
            gy(u, w) - 0.06,
            q[2],
            0.4,
            0.08,
            0.32,
            F2.straw,
            rows.grain || F2.straw,
            hashInt(k, 11, pr.seed || 7),
            rnd() * 6,
          );
        }
        {
          const u = W / 2 - 0.45,
            w = -D / 2 + 0.5,
            y = gy(u, w);
          mb.prism(
            at(u, y - 0.1, w),
            at(u, y + 0.75, w),
            0.28,
            0.28,
            8,
            wood,
            PAT.PLANK,
            null,
            0,
            true,
          );
          mb.cone(
            at(u, y + 0.7, w),
            y + 0.7,
            0.25,
            8,
            rows.blue || wood,
            PAT.NONE,
            { lv: -1.2 },
          );
          const q = at(u, 0, w);
          col.push(q[0], q[2], 0.3, base + y - 0.1, base + y + 0.75, 1);
        }
        // walls to bump into (the front is open)
        const wb = (u0, w0, u1, w1) => {
          const q = at((u0 + u1) / 2, 0, (w0 + w1) / 2),
            along = Math.atan2(w1 - w0, u1 - u0) + rot;
          boxes.push({
            x: q[0],
            z: q[2],
            hx: Math.hypot(u1 - u0, w1 - w0) / 2,
            hz: 0.1,
            cs: Math.cos(along),
            sn: Math.sin(along),
          });
        };
        wb(-W / 2, -D / 2, W / 2, -D / 2);
        wb(-W / 2, -D / 2, -W / 2, D / 2);
        wb(W / 2, -D / 2, W / 2, D / 2);
        {
          const q = at(0, 0, -D / 2 + 0.28);
          boxes.push({ x: q[0], z: q[2], hx: 1.05, hz: 0.26, cs, sn });
        }
        c.v.stableAt = { x: pr.x, z: pr.z, rot, w: W, d: D, y: yc };
        return;
      }
      if (pr.t === "palisade") {
        // sharpened stakes close set all round, following the ground, and a gate in front of the door: two tall posts,
        // a beam over them, and the two halves of the gate standing open
        const Rr = pr.r,
          n = Math.max(24, Math.ceil((Math.PI * 2 * Rr) / 1.25)),
          gateHalf = 1.45 / Rr,
          H = 2.3,
          tip = 0.5;
        const gateA = Math.PI / 2,
          P = (a) => [Math.cos(a) * Rr, Math.sin(a) * Rr];
        const ang = (a) => Math.atan2(Math.sin(a - gateA), Math.cos(a - gateA));
        for (let k = 0; k < n; k++) {
          let a0 = (k / n) * Math.PI * 2,
            a1 = ((k + 1) / n) * Math.PI * 2;
          const d0 = ang(a0),
            d1 = ang(a1);
          if (Math.abs(d0) < gateHalf && Math.abs(d1) < gateHalf) continue;
          if (Math.abs(d0) < gateHalf) a0 = gateA + gateHalf * Math.sign(d1);
          if (Math.abs(d1) < gateHalf) a1 = gateA + gateHalf * Math.sign(d0);
          const [ua, wa] = P(a0),
            [ub, wb2] = P(a1),
            ya = gy(ua, wa),
            yb = gy(ub, wb2);
          // (the face that looks out is the one away from the middle)
          panel(
            ub,
            wb2,
            yb - 0.5,
            yb + H,
            ua,
            wa,
            ya - 0.5,
            ya + H,
            wood,
            PAT.LOG,
            true,
          );
          const m = Math.max(
            2,
            Math.round(Math.hypot(ub - ua, wb2 - wa) / 0.36),
          );
          for (let j = 0; j < m; j++) {
            const t0 = j / m,
              t1 = (j + 1) / m,
              tm = (t0 + t1) / 2;
            const u0 = ua + (ub - ua) * t0,
              w0 = wa + (wb2 - wa) * t0,
              u1 = ua + (ub - ua) * t1,
              w1 = wa + (wb2 - wa) * t1,
              um = ua + (ub - ua) * tm,
              wm = wa + (wb2 - wa) * tm;
            const y0b = ya + (yb - ya) * t0 + H,
              y1b = ya + (yb - ya) * t1 + H,
              ymb = ya + (yb - ya) * tm + H + tip;
            mb.tri(
              at(u1, y1b, w1),
              at(u0, y0b, w0),
              at(um, ymb, wm),
              wood,
              PAT.NONE,
              null,
              { lv: 0.15 },
            );
            mb.tri(
              at(u0, y0b, w0),
              at(u1, y1b, w1),
              at(um, ymb, wm),
              wood,
              PAT.NONE,
              null,
              { lv: -0.2 },
            );
          }
          const q = at((ua + ub) / 2, 0, (wa + wb2) / 2),
            along = Math.atan2(wb2 - wa, ub - ua) + rot;
          boxes.push({
            x: q[0],
            z: q[2],
            hx: Math.hypot(ub - ua, wb2 - wa) / 2 + 0.04,
            hz: 0.16,
            cs: Math.cos(along),
            sn: Math.sin(along),
          });
        }
        // the gateway
        const gp = [P(gateA - gateHalf), P(gateA + gateHalf)];
        for (const [u, w] of gp) {
          const y = gy(u, w);
          mb.prism(
            at(u, y - 0.5, w),
            at(u, y + H + 0.75, w),
            0.16,
            0.14,
            6,
            wood,
            PAT.BARK,
            null,
            0,
            true,
          );
          const q = at(u, 0, w);
          col.push(q[0], q[2], 0.2, base + y - 0.5, base + y + H + 0.75, 1);
        }
        {
          const [ua, wa] = gp[0],
            [ub, wb2] = gp[1],
            yg = Math.max(gy(ua, wa), gy(ub, wb2));
          mb.prism(
            at(ua - 0.15, yg + H + 0.55, wa),
            at(ub + 0.15, yg + H + 0.55, wb2),
            0.11,
            0.11,
            6,
            wood,
            PAT.BARK,
            null,
            0,
            true,
          );
        }
        // the gate's two halves, swung in
        for (const [k, s] of [
          [0, 1],
          [1, -1],
        ]) {
          const [u, w] = gp[k],
            y = gy(u, w),
            len = gateHalf * Rr - 0.05;
          const du =
              Math.cos(gateA + Math.PI) * 0.94 +
              s * Math.cos(gateA - Math.PI / 2) * 0.34,
            dw =
              Math.sin(gateA + Math.PI) * 0.94 +
              s * Math.sin(gateA - Math.PI / 2) * 0.34,
            dl = Math.hypot(du, dw);
          const u2 = u + (du / dl) * len,
            w2 = w + (dw / dl) * len;
          panel(
            u,
            w,
            y + 0.1,
            y + H - 0.2,
            u2,
            w2,
            gy(u2, w2) + 0.1,
            gy(u2, w2) + H - 0.2,
            F2.plank,
            PAT.PLANK,
            true,
          );
          const q = at((u + u2) / 2, 0, (w + w2) / 2),
            along = Math.atan2(w2 - w, u2 - u) + rot;
          boxes.push({
            x: q[0],
            z: q[2],
            hx: len / 2,
            hz: 0.08,
            cs: Math.cos(along),
            sn: Math.sin(along),
          });
        }
        return;
      }
    },
    // when your house is built (or built again): your beast, home in its stable
    buildStable(v) {
      const rec = v.home && v.home.stable,
        S = v.stableAt;
      if (!rec || !S || rec.out || !this.tether) return;
      const people =
        v.site.owner >= 0 ? this.story.peoples[v.site.owner] : null;
      const m = this.mountInfo(people, rec.seed || 1),
        R = this.R,
        cs = Math.cos(S.rot),
        sn = Math.sin(S.rot);
      const bx = S.x - -0.15 * sn,
        bz = S.z + -0.15 * cs;
      this.tether(
        v,
        m,
        stepOn(v.site.dir, v.F, bx, -bz, R),
        Math.atan2(-sn, -cs),
      );
      v.mountInfo = m;
    },

    // ---------- where a field or a pen of yours can go: behind the house or beside it, on dry ground,
    // not too steep, clear of the road, the towns and everyone else's places ----------
    // (o.size: as if the house were that size; o.only: just that slot; o.taken: the slots the others will have)
    yardSpot(rec, what, o = {}) {
      const prefs = o.only ? [o.only] : YARD_PREF[what] || PEN_PREF;
      const taken = o.taken !== undefined ? o.taken : yardTaken(rec, what);
      const s0 = this.homeSite(rec),
        R = this.R,
        F = frameAt(s0.dir),
        size = o.size || rec.size;
      let why = null;
      for (const at of prefs) {
        if (taken.includes(at)) continue;
        const pseudo = {
          ...s0,
          size,
          _plan: null,
          home: { ...rec, size, [what]: { ...(rec[what] || {}), at } },
        };
        const plan = sitePlan(this.story, pseudo),
          pr = plan.props.find((q) => q.t === YARD_PROP[what]);
        if (!pr) continue;
        const cs = Math.cos(pr.rot || 0),
          sn = Math.sin(pr.rot || 0);
        let lo = 1e9,
          hi = -1e9;
        for (const [u, w] of [
          [0, 0],
          [-1, -1],
          [1, -1],
          [1, 1],
          [-1, 1],
          [0, -1],
          [0, 1],
          [-1, 0],
          [1, 0],
        ]) {
          const x = pr.x + ((u * pr.w) / 2) * cs - ((w * pr.d) / 2) * sn,
            z = pr.z + ((u * pr.w) / 2) * sn + ((w * pr.d) / 2) * cs;
          const q = stepOn(s0.dir, F, x, -z, R),
            h = this.ground.height(q[0], q[1], q[2], 1);
          lo = Math.min(lo, h);
          hi = Math.max(hi, h);
        }
        const c = stepOn(s0.dir, F, pr.x, -pr.z, R),
          half = Math.hypot(pr.w, pr.d) / 2;
        if (lo < 0.4) {
          why = why || "it would stand in water";
          continue;
        }
        if (hi - lo > 2.6) {
          why = why || "the ground falls away too steeply";
          continue;
        }
        if (this.siteIx) {
          const road = this.siteIx.roadNear(c, half + 4);
          if (road && road.m < half + 1) {
            why = why || "the road runs too close";
            continue;
          }
          let blocked = null;
          for (const q of this.siteIx
            .near(c, 300, "all")
            .concat(this.homesNear(c, 300))) {
            if (q.id === rec.id) continue;
            const r = sitePlan(this.story, q).r || 8;
            if (arcM(c, q.dir, R) < r + half) {
              blocked = q;
              break;
            }
          }
          if (blocked) {
            why =
              why ||
              (blocked.kind === "home"
                ? "your other house is in the way"
                : `${siteName(this.story, blocked)} is too close`);
            continue;
          }
        }
        let town = null;
        for (const t of this.story.settlements)
          if (arcM(c, t.dir, R) < townRadius(t) + half) {
            town = t;
            break;
          }
        if (town) {
          why = why || `${town.name} is too close`;
          continue;
        }
        return { ok: true, at };
      }
      return {
        ok: false,
        why: `There is no room for a ${what} beside your house: ${why || "nowhere will do"}.`,
      };
    },

    // ---------- can your house be built bigger where it stands? The bigger house on the same spot, and the
    // field and the pen round it still (where they are if they still fit, or wherever else they will) ----------
    growSpot(rec, to) {
      const s0 = this.homeSite(rec),
        pseudo = { ...s0, size: to, _plan: null, home: { ...rec, size: to } };
      const plan = sitePlan(this.story, pseudo),
        b = plan.buildings[0];
      if (!b) return { ok: false, why: "Nothing to build on." };
      const reach = Math.hypot(b.w, b.d) / 2 + 2.5;
      const chk = this.homeSpot(rec.dir, rec.face, b, reach, rec.id);
      if (!chk.ok)
        return {
          ok: false,
          why: `There is no room to build it bigger here: ${chk.why}.`,
        };
      const out = { ok: true };
      // the field first, then the pen, then the stable, each round where the ones before it end up
      const taken = [];
      for (const what of ["field", "pen", "stable"]) {
        if (!rec[what]) continue;
        let y = this.yardSpot(rec, what, {
          size: to,
          only: rec[what].at,
          taken,
        });
        if (!y.ok) y = this.yardSpot(rec, what, { size: to, taken });
        if (!y.ok)
          return {
            ok: false,
            why: `There is no room to build it bigger here: the ${what} would have nowhere to go.`,
          };
        out[what] = y.at;
        taken.push(y.at);
      }
      // (and a palisade round all of it still has to fit)
      if (rec.palisade) {
        const pc = this.palisadeSpot({
          ...rec,
          size: to,
          field: rec.field && { ...rec.field, at: out.field },
          pen: rec.pen && { ...rec.pen, at: out.pen },
          stable: rec.stable && { ...rec.stable, at: out.stable },
        });
        if (!pc.ok)
          return {
            ok: false,
            why: `There is no room to build it bigger here: ${pc.why}`,
          };
      }
      return out;
    },

    // ---------- can a palisade go round a house of yours and all that is by it? (clear of the road, of
    // other places and towns, and out of the water) ----------
    palisadeSpot(rec) {
      const s0 = this.homeSite(rec),
        R = this.R,
        F = frameAt(s0.dir);
      const pseudo = {
        ...s0,
        size: rec.size,
        _plan: null,
        home: { ...rec, palisade: true },
      };
      const plan = sitePlan(this.story, pseudo),
        pr = plan.props.find((q) => q.t === "palisade");
      if (!pr) return { ok: false, why: "there is nothing to put it round." };
      const c = stepOn(s0.dir, F, pr.x, -pr.z, R),
        Rr = pr.r;
      for (let k = 0; k < 16; k++) {
        const a = (k / 16) * Math.PI * 2,
          q = stepOn(
            s0.dir,
            F,
            pr.x + Math.cos(a) * Rr,
            -(pr.z + Math.sin(a) * Rr),
            R,
          );
        if (this.ground.height(q[0], q[1], q[2], 1) < 0.25)
          return { ok: false, why: "it would run into the water." };
      }
      if (this.siteIx) {
        const road = this.siteIx.roadNear(c, Rr + 6);
        if (road && road.m < Rr + 2)
          return {
            ok: false,
            why: "the road runs too close: it would cut across it.",
          };
        for (const q of this.siteIx
          .near(c, 400, "all")
          .concat(this.homesNear(c, 400))) {
          if (q.id === rec.id) continue;
          const r = sitePlan(this.story, q).r || 8;
          if (arcM(c, q.dir, R) < r + Rr)
            return {
              ok: false,
              why:
                q.kind === "home"
                  ? "your other house is in the way."
                  : `${siteName(this.story, q)} is too close.`,
            };
        }
      }
      for (const t of this.story.settlements)
        if (arcM(c, t.dir, R) < townRadius(t) + Rr)
          return { ok: false, why: `${t.name} is too close.` };
      return { ok: true, r: Rr };
    },

    // ---------- the animals in your pen ----------
    // their bodies, one each for every kind and coat (made once a world, kept while its colours stand)
    penGeo(kind, coat, shorn = false) {
      if (this.penGeoFor !== this.ramps) {
        if (this.penGeos)
          for (const g of this.penGeos.values()) g.geo.dispose();
        this.penGeos = new Map();
        this.penGeoFor = this.ramps;
      }
      const key = kind + ":" + coat + (shorn ? ":s" : "");
      if (this.penGeos.has(key)) return this.penGeos.get(key);
      const r = (cl) => this.row(cl);
      let pr;
      if (kind === "hen") {
        const C = HEN_COATS[coat % 4];
        pr = henProto({
          main: r(C[0]),
          tail: r(C[1]),
          comb: r([204, 40, 36]),
          beak: r([226, 176, 70]),
          leg: r([214, 168, 66]),
          eye: r([20, 16, 16]),
          shadow: this.shadowRow,
        });
      } else {
        const P =
          kind === "goat"
            ? goatPlan(GOAT_COATS[coat % 4])
            : sheepPlan(SHEEP_COATS[coat % 4], shorn);
        const rows = {
          main: r(P.col),
          belly: r(P.belly),
          hoof: r([46, 38, 34]),
          horn: r(P.horn),
          eye: r([22, 18, 18]),
          shell: r(P.col),
          spot: r(P.col),
          shadow: this.shadowRow,
        };
        if (P.face) rows.face = r(P.face);
        if (P.legCol) rows.leg = r(P.legCol);
        pr = grazerProto(P, rows, mulberry32(hashInt(coat, kind.length, 5)));
      }
      const d = pr.mb.finish(),
        T = this.T;
      this.syncRamps();
      const geo = new T.BufferGeometry();
      for (const [k2, arr, n] of [
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
        geo.setAttribute(k2, new T.BufferAttribute(arr, n));
      geo.computeBoundingSphere();
      const o = { geo, pr };
      this.penGeos.set(key, o);
      return o;
    },
    // when your house is built (or built again): who is in the pen, where
    buildPen(v) {
      const rec = v.home && v.home.pen,
        P = v.penAt;
      if (!rec || !P) return;
      const T = this.T,
        rnd = Math.random,
        cs = Math.cos(P.rot),
        sn = Math.sin(P.rot);
      const pen = { animals: [], at: 0 };
      rec.beasts.forEach((b, i) => {
        const B = BEASTS[b.k];
        if (!B) return;
        const shorn = b.k === "sheep" && b.ready === 0 && b.acc < 0.5;
        const G = this.penGeo(b.k, b.col || 0, shorn);
        const U = {
          ...this.uniforms,
          uPhase: { value: 0 },
          uAmp: { value: 0 },
          uHeadPitch: { value: G.pr.graze },
          uHeadYaw: { value: 0 },
          uTail: { value: 0 },
          uTailP: { value: 0 },
          uBob: { value: 0 },
          uFadeIn: { value: 1 },
          uHit: { value: 0 },
        };
        const mesh = new T.Mesh(
          G.geo,
          new T.ShaderMaterial({
            uniforms: U,
            vertexShader: ANIMAL_VS,
            fragmentShader: ANIMAL_FS,
            side: T.DoubleSide,
          }),
        );
        mesh.matrixAutoUpdate = false;
        mesh.frustumCulled = false;
        // somewhere in the pen, clear of the others
        let u = 0,
          w = 0;
        for (let k = 0; k < 12; k++) {
          u = (rnd() - 0.5) * (P.w - 1.4);
          w = (rnd() - 0.5) * (P.d - 1.4);
          if (
            this.penFree(P, u, w, b.k) &&
            pen.animals.every((a) => Math.hypot(a.u - u, a.w - w) > 0.9)
          )
            break;
        }
        const a = {
          b,
          i,
          kind: b.k,
          G,
          pr: G.pr,
          mesh,
          U,
          u,
          w,
          face: rnd() * 6.28,
          state: "graze",
          t: rnd() * 4,
          phase: rnd() * 6,
          walk: 0,
          pitch: G.pr.graze,
          hyaw: 0,
          hyawTo: 0,
          tailT: rnd() * 5,
          shorn,
          dir: null,
          h: 0,
        };
        pen.animals.push(a);
        if (b.k !== "hen") {
          a.spot = {
            kind: "beast",
            i,
            r: 0.75,
            reach: 2.4,
            dir: v.site.dir.slice(),
            alt: v.base,
          };
          v.spots.push(a.spot);
        }
      });
      v.pen = pen;
      void cs;
      void sn;
    },
    // can one of them stand here (in the pen's metres)? Not in the shed's corner (hens may), not in the trough
    penFree(P, u, w, kind) {
      if (Math.abs(u) > P.w / 2 - 0.55 || Math.abs(w) > P.d / 2 - 0.55)
        return false;
      const L = P.lay,
        T = L.trough;
      if (Math.hypot(u - T.u, w - T.w) < 0.95) return false;
      if (kind !== "hen") {
        const S = L.shed;
        if (Math.hypot(u - L.coop.u, w - L.coop.w) < 0.75) return false;
        if (
          Math.abs((u - S.u) * Math.cos(S.a) + (w - S.w) * Math.sin(S.a)) <
            1.5 &&
          Math.abs((u - S.u) * S.du + (w - S.w) * S.dw) < 1.0
        )
          return false;
      } else if (Math.hypot(u - L.coop.u, w - L.coop.w) < 0.5) return false;
      return true;
    },
    dropPen(v) {
      if (!v.pen) return;
      for (const a of v.pen.animals) {
        this.scene.remove(a.mesh);
        a.mesh.material.dispose();
      }
      v.pen = null;
    },
    // ---------- each frame, at home ----------
    stepFarm(v, dt, nowS) {
      const R = this.R,
        rec = v.home;
      if (!rec) return;
      const m = arcM(this.p, v.site.dir, R);
      // the field grows while you are away: draw it again when it comes on (looked at now and then)
      if (rec.field) {
        v.fieldCheck = (v.fieldCheck || 0) - dt;
        if (v.fieldCheck <= 0) {
          v.fieldCheck = 2;
          const st = fieldState(rec.field, this.t);
          if (
            v.fieldStage &&
            v.fieldStage !== st.stage + ":" + (rec.field.crop || "")
          ) {
            this.refreshHome(rec);
            return;
          }
        }
      }
      const pen = v.pen,
        P = v.penAt;
      if (!pen || !P) return;
      const show = m < 160;
      const cs = Math.cos(P.rot),
        sn = Math.sin(P.rot),
        F = v.F,
        rnd = Math.random;
      // a sheep that has been sheared (or has grown its fleece back) changes coat
      for (const a of pen.animals) {
        if (a.kind === "sheep") {
          const shorn = a.b.ready === 0 && a.b.acc < 0.5;
          if (shorn !== a.shorn) {
            a.shorn = shorn;
            a.G = this.penGeo("sheep", a.b.col || 0, shorn);
            a.mesh.geometry = a.G.geo;
            a.pr = a.G.pr;
          }
        }
        a.mesh.visible = show;
        if (!a.mesh.parent) this.scene.add(a.mesh);
      }
      if (!show) return;
      const toYou = (() => {
        const d = [
          this.p[0] - v.site.dir[0],
          this.p[1] - v.site.dir[1],
          this.p[2] - v.site.dir[2],
        ];
        const x = (d[0] * F.e[0] + d[1] * F.e[1] + d[2] * F.e[2]) * R,
          z = -(d[0] * F.n[0] + d[1] * F.n[1] + d[2] * F.n[2]) * R;
        return { x, z };
      })();
      for (const a of pen.animals) {
        const pr = a.pr,
          hen = a.kind === "hen";
        a.t -= dt;
        let speed = 0,
          amp = 0,
          pitchTo = pr.graze;
        a.hyawTo = 0;
        // where it is, in the place's metres
        const sx = P.x + a.u * cs - a.w * sn,
          sz = P.z + a.u * sn + a.w * cs;
        const youM = Math.hypot(toYou.x - sx, toYou.z - sz);
        switch (a.state) {
          case "graze":
            if (hen)
              pitchTo =
                Math.sin(nowS * 9 + a.phase) > 0.2 ? pr.graze : pr.graze * 0.3;
            if (a.t <= 0) {
              const r = rnd();
              if (r < (hen ? 0.7 : 0.5)) {
                // a few steps somewhere else in the pen
                let tu = a.u,
                  tw = a.w;
                for (let k = 0; k < 8; k++) {
                  const ang = rnd() * 6.28,
                    s = (hen ? 0.6 : 1) + rnd() * (hen ? 1.6 : 2.4);
                  tu = a.u + Math.cos(ang) * s;
                  tw = a.w + Math.sin(ang) * s;
                  if (this.penFree(P, tu, tw, a.kind)) break;
                  tu = a.u;
                  tw = a.w;
                }
                a.tgt = [tu, tw];
                a.state = "step";
                a.t = 6;
              } else if (r < 0.8) {
                a.state = "look";
                a.t = 1 + rnd() * 2.5;
                a.lookYaw = (rnd() - 0.5) * 1.4;
              } else a.t = 2 + rnd() * 5;
            }
            break;
          case "step": {
            const du = a.tgt[0] - a.u,
              dw = a.tgt[1] - a.w,
              dd = Math.hypot(du, dw);
            if (dd < 0.15 || a.t <= 0) {
              a.state = "graze";
              a.t = (hen ? 1 : 3) + rnd() * (hen ? 3 : 6);
              break;
            }
            // (the way it faces, as a bearing in the place's metres: x east, z south)
            const dx = du * cs - dw * sn,
              dz = du * sn + dw * cs,
              want = Math.atan2(dx, -dz);
            const dA = Math.atan2(
              Math.sin(want - a.face),
              Math.cos(want - a.face),
            );
            a.face += dA * Math.min(1, dt * 3);
            speed = hen ? 0.45 : 0.6;
            amp = hen ? 0.6 : 0.3;
            pitchTo = pr.graze * 0.25;
            break;
          }
          case "look":
            pitchTo = -0.1;
            // they look at you when you are close
            if (youM < 6) {
              const want = Math.atan2(toYou.x - sx, -(toYou.z - sz));
              a.hyawTo = Math.max(
                -0.9,
                Math.min(
                  0.9,
                  Math.atan2(Math.sin(want - a.face), Math.cos(want - a.face)),
                ),
              );
            } else a.hyawTo = a.lookYaw || 0;
            if (a.t <= 0) {
              a.state = "graze";
              a.t = 2 + rnd() * 5;
            }
            break;
        }
        if (speed > 0) {
          const s = speed * dt,
            dx = Math.sin(a.face) * s,
            dz = -Math.cos(a.face) * s;
          const nu = a.u + dx * cs + dz * sn,
            nw = a.w - dx * sn + dz * cs;
          if (this.penFree(P, nu, nw, a.kind)) {
            a.u = nu;
            a.w = nw;
          } else {
            a.state = "graze";
            a.t = 1;
          }
          a.phase += (s * Math.PI * 2) / (pr.legH * (1.2 + 5 * amp));
        }
        a.walk += (amp - a.walk) * Math.min(1, dt * 5);
        a.pitch += (pitchTo - a.pitch) * Math.min(1, dt * (hen ? 9 : 2.5));
        a.hyaw += (a.hyawTo - a.hyaw) * Math.min(1, dt * 3);
      }
      // a little room between them
      const A = pen.animals;
      for (let j = 0; j < A.length; j++)
        for (let k = j + 1; k < A.length; k++) {
          const du = A[k].u - A[j].u,
            dw = A[k].w - A[j].w,
            dd = Math.hypot(du, dw),
            want = (A[j].pr.rad + A[k].pr.rad) * 1.1;
          if (dd >= want || dd < 1e-4) continue;
          const push = ((want - dd) * 0.5) / dd;
          const ju = A[j].u - du * push,
            jw = A[j].w - dw * push,
            ku = A[k].u + du * push,
            kw = A[k].w + dw * push;
          if (this.penFree(P, ju, jw, A[j].kind)) {
            A[j].u = ju;
            A[j].w = jw;
          }
          if (this.penFree(P, ku, kw, A[k].kind)) {
            A[k].u = ku;
            A[k].w = kw;
          }
        }
      for (const a of A) {
        const sx = P.x + a.u * cs - a.w * sn,
          sz = P.z + a.u * sn + a.w * cs;
        a.dir = stepOn(v.site.dir, F, sx, -sz, R);
        a.h = this.ground.height(a.dir[0], a.dir[1], a.dir[2], 1);
        this.placeMatrix(
          a.mesh,
          a.dir,
          frameAt(a.dir),
          Math.max(-0.4, a.h),
          a.face + Math.PI,
        );
        const U = a.U;
        U.uPhase.value = a.phase;
        U.uAmp.value = a.walk;
        U.uHeadPitch.value = a.pitch;
        U.uHeadYaw.value = a.hyaw;
        a.tailT -= dt;
        U.uTail.value = a.tailT < 0 ? Math.sin(nowS * 11 + a.phase) * 0.45 : 0;
        if (a.tailT < -1.2) a.tailT = 2 + rnd() * 7;
        if (a.spot) {
          a.spot.dir = a.dir;
          a.spot.alt = a.h + (a.pr.bodyY || 0.4) + (a.pr.bodyH || 0.3) * 0.6;
          a.spot.x = sx;
          a.spot.z = sz;
        }
      }
    },
  });

  // ---- view/cityview.js ----
  // ============================================================
  // CITY VIEW — the great city's own pieces. Its wall, in stretches from
  // gatehouse to gatehouse, with a walk along the top behind a parapet
  // (stairs go up to it beside each gate), towers standing out from it,
  // gatehouses with a passage through under an arch, and doors that stand
  // open by day; the fountain on the square. As the city stands: scaffolds,
  // a crane and stacked stone where it is still going up; houses boarded up
  // or fallen in where it is emptying; and in the city that fell, broken
  // walls, mounds of what were houses, and trees in the streets.
  // (The plan is story/city.js.)
  // ============================================================

  // the stone of a people's walls
