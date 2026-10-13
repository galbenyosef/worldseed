// index-inline-2 96 — math
// Lines 47911-50055 of readable/index-inline-2.pretty.js (statement-aligned).
  Object.assign(GroundView.prototype, {
    // the colours of the city's stone, iron, wood and cloth (a people's; or old and mossy, for the city that fell)
    cityRows(st, old, rows) {
      const m = this._cityRows || (this._cityRows = new Map()),
        key = (old ? "old:" : "") + st.arch + ":" + st.roof.join(",");
      if (m.has(key)) return m.get(key);
      const c = old ? [150, 146, 140] : CITY_STONE[st.arch] || CITY_STONE.stone;
      const K = {
        cw: this.row(c),
        cwD: this.row(c.map((v) => Math.round(v * 0.8))),
        cwT: this.row(c.map((v) => Math.min(255, Math.round(v * 1.08)))),
        moss: this.row([100, 118, 74]),
        wood: this.row(old ? [84, 70, 58] : st.wood),
        dark: this.row([66, 50, 38]),
        iron: this.row([58, 56, 64]),
        roof: this.row(st.roof),
        banner: this.row(
          st.roof.map((v, i) => Math.round(v * 0.85 + [40, 10, 10][i])),
        ),
        gold: this.row([230, 196, 90]),
        water: this.row([64, 116, 150]),
        glow: this.row([255, 206, 110]),
        flame: this.row([255, 170, 70]),
        glass: this.row([206, 184, 128]),
        plank: this.row([150, 116, 78]),
        rope: this.row([176, 150, 104]),
        leaf: this.row([84, 120, 60]),
        leafDark: this.row([62, 92, 48]),
        bark: this.row([96, 76, 58]),
      };
      if (rows) K.char = rows.char;
      m.set(key, K);
      return K;
    },

    // ---------- the wall, its towers, gatehouses and stairs ----------
    // C: the plan's city; hAt(x, z): the ground (from base) in the city's metres; ctx: { col, boxes, base, old, roofPat }
    cityWallsInto(mb, C, hAt, K, ctx) {
      const { col, boxes, base } = ctx,
        old = !!ctx.old,
        roofPat = ctx.roofPat ?? PAT.TILE;
      const W = C.wall,
        ri = W - C.thick / 2,
        ro = W + C.thick / 2,
        pw = C.gateW / 2,
        TW = C.gateTW;
      const cos = Math.cos,
        sin = Math.sin;
      const P = (a, r, y) => [cos(a) * r, y, sin(a) * r];
      const OUT = (a) => [cos(a), 0, sin(a)],
        IN = (a) => [-cos(a), 0, -sin(a)],
        UP = [0, 1, 0],
        TAN = (a) => [-sin(a), 0, cos(a)];
      const stone = old ? { row2: K.moss } : null;
      const gG = (a) =>
        Math.min(
          hAt(cos(a) * ri, sin(a) * ri),
          hAt(cos(a) * W, sin(a) * W),
          hAt(cos(a) * ro, sin(a) * ro),
        );
      // a box in a frame turned to angle a: u across (along the wall), v out (from radius r0), y up
      const rbox = (
        a,
        r0,
        u0,
        u1,
        v0,
        v1,
        y0,
        y1,
        row,
        pat,
        o = stone,
        faces = "all",
      ) => {
        const ux = -sin(a),
          uz = cos(a),
          vx = cos(a),
          vz = sin(a),
          Q = (u, v, y) => [vx * (r0 + v) + ux * u, y, vz * (r0 + v) + uz * u];
        const f = (n) => faces === "all" || faces.includes(n);
        if (f("out"))
          cvFace(
            mb,
            [Q(u0, v1, y0), Q(u1, v1, y0), Q(u1, v1, y1), Q(u0, v1, y1)],
            [vx, 0, vz],
            row,
            pat,
            o,
          );
        if (f("in"))
          cvFace(
            mb,
            [Q(u0, v0, y0), Q(u1, v0, y0), Q(u1, v0, y1), Q(u0, v0, y1)],
            [-vx, 0, -vz],
            row,
            pat,
            o,
          );
        if (f("right"))
          cvFace(
            mb,
            [Q(u1, v0, y0), Q(u1, v1, y0), Q(u1, v1, y1), Q(u1, v0, y1)],
            [ux, 0, uz],
            row,
            pat,
            o,
          );
        if (f("left"))
          cvFace(
            mb,
            [Q(u0, v0, y0), Q(u0, v1, y0), Q(u0, v1, y1), Q(u0, v0, y1)],
            [-ux, 0, -uz],
            row,
            pat,
            o,
          );
        if (f("top"))
          cvFace(
            mb,
            [Q(u0, v0, y1), Q(u1, v0, y1), Q(u1, v1, y1), Q(u0, v1, y1)],
            UP,
            row,
            pat,
            o,
          );
        return Q;
      };
      const rcol = (a, r0, u0, u1, v0, v1, top = null) => {
        const uc = (u0 + u1) / 2,
          vc = (v0 + v1) / 2,
          x = cos(a) * (r0 + vc) - sin(a) * uc,
          z = sin(a) * (r0 + vc) + cos(a) * uc;
        const bx = {
          x,
          z,
          hx: (u1 - u0) / 2,
          hz: (v1 - v0) / 2,
          cs: -sin(a),
          sn: cos(a),
        };
        if (top != null) bx.top = base + top;
        boxes.push(bx);
      };
      // a hipped roof to a point over a box in the same frame, with a little overhang
      const pyramid = (a, r0, u0, u1, v0, v1, y, h, row, pat) => {
        const Q = (u, v, yy) => [
            cos(a) * (r0 + v) - sin(a) * u,
            yy,
            sin(a) * (r0 + v) + cos(a) * u,
          ],
          o = 0.35;
        const c = [(u0 + u1) / 2, (v0 + v1) / 2],
          apex = Q(c[0], c[1], y + h);
        const cs4 = [
          [u0 - o, v0 - o],
          [u1 + o, v0 - o],
          [u1 + o, v1 + o],
          [u0 - o, v1 + o],
        ].map(([u, v]) => Q(u, v, y - 0.1));
        for (let q = 0; q < 4; q++) {
          const p0 = cs4[q],
            p1 = cs4[(q + 1) % 4],
            n = cvCross(cvSub(p1, p0), cvSub(apex, p0)),
            mid = [(p0[0] + p1[0]) / 2, 0, (p0[2] + p1[2]) / 2],
            cc = Q(c[0], c[1], 0);
          const out = [mid[0] - cc[0], 0, mid[2] - cc[2]];
          if (n[0] * out[0] + n[2] * out[2] >= 0)
            mb.tri(p0, p1, apex, row, pat, [
              [0, 0],
              [Math.hypot(p1[0] - p0[0], p1[2] - p0[2]), 0],
              [Math.hypot(p1[0] - p0[0], p1[2] - p0[2]) / 2, h],
            ]);
          else
            mb.tri(p1, p0, apex, row, pat, [
              [0, 0],
              [Math.hypot(p1[0] - p0[0], p1[2] - p0[2]), 0],
              [Math.hypot(p1[0] - p0[0], p1[2] - p0[2]) / 2, h],
            ]);
        }
      };
      // merlons along a run: every 2.2 m, standing on y; skipping where `skip(a)` says
      const merlons = (a0, a1, r1, y, skip) => {
        const len = Math.abs(a1 - a0) * r1,
          n = Math.max(1, Math.floor(len / 2.2));
        for (let k = 0; k < n; k++) {
          const a = a0 + ((a1 - a0) * (k + 0.5)) / n;
          if (skip && skip(a)) continue;
          rbox(
            a,
            r1 - 0.62,
            -0.55,
            0.55,
            0,
            0.62,
            y,
            y + 0.8,
            K.cw,
            PAT.STONE,
            stone,
            ["out", "in", "left", "right", "top"],
          );
        }
      };
      const halfGate = (pw + TW) / W;
      const towerAt = (a) =>
        C.towers.find(
          (t) => Math.abs(cvWrap(a - t.a)) * ro < C.tower / 2 + 0.15,
        );
      // ---- the stretches between the gatehouses ----
      const n = C.gates.length;
      for (let k = 0; k < n; k++) {
        const A0 = C.gates[k].a + halfGate,
          span0 = cvWrap(C.gates[(k + 1) % n].a - C.gates[k].a),
          span = (span0 < 0 ? span0 + Math.PI * 2 : span0) - 2 * halfGate;
        const m = Math.max(2, Math.round((span * W) / 5.2));
        // the ground along its line, smoothed, and its height there
        const g = [];
        for (let j = 0; j < m; j++) g.push(gG(A0 + (span * (j + 0.5)) / m));
        const gs = g.map(
          (v, j) =>
            (g[Math.max(0, j - 2)] +
              g[Math.max(0, j - 1)] * 2 +
              v * 3 +
              g[Math.min(m - 1, j + 1)] * 2 +
              g[Math.min(m - 1, j + 2)]) /
            9,
        );
        const tops = gs.map(
          (v, j) => v + cityWallH(C, A0 + (span * (j + 0.5)) / m),
        );
        const full = tops.map((t, j) => t - gs[j] >= C.H - 0.3);
        for (let j = 0; j < m; j++) {
          const a0 = A0 + (span * j) / m,
            a1 = A0 + (span * (j + 1)) / m,
            am = (a0 + a1) / 2,
            top = tops[j];
          const foot =
            Math.min(
              hAt(cos(a0) * ri, sin(a0) * ri),
              hAt(cos(a1) * ri, sin(a1) * ri),
              hAt(cos(a0) * ro, sin(a0) * ro),
              hAt(cos(a1) * ro, sin(a1) * ro),
            ) - 0.8;
          const par = full[j] && !(old && hash01(j, k, 71) < 0.3);
          const pTop = par ? top + 0.95 : top;
          // the faces, out and in; the walk on top; the parapet along the outside
          cvFace(
            mb,
            [
              P(a0, ro, foot),
              P(a1, ro, foot),
              P(a1, ro, pTop),
              P(a0, ro, pTop),
            ],
            OUT(am),
            K.cw,
            PAT.STONE,
            stone,
          );
          cvFace(
            mb,
            [P(a0, ri, foot), P(a1, ri, foot), P(a1, ri, top), P(a0, ri, top)],
            IN(am),
            K.cw,
            PAT.STONE,
            stone,
          );
          cvFace(
            mb,
            [
              P(a0, ri, top),
              P(a1, ri, top),
              P(a1, par ? ro - 0.62 : ro, top),
              P(a0, par ? ro - 0.62 : ro, top),
            ],
            UP,
            K.cwT,
            PAT.STONE,
            stone,
          );
          if (par) {
            cvFace(
              mb,
              [
                P(a0, ro - 0.62, top),
                P(a1, ro - 0.62, top),
                P(a1, ro - 0.62, pTop),
                P(a0, ro - 0.62, pTop),
              ],
              IN(am),
              K.cwD,
              PAT.STONE,
              stone,
            );
            cvFace(
              mb,
              [
                P(a0, ro - 0.62, pTop),
                P(a1, ro - 0.62, pTop),
                P(a1, ro, pTop),
                P(a0, ro, pTop),
              ],
              UP,
              K.cw,
              PAT.STONE,
              stone,
            );
            merlons(a0, a1, ro, pTop, towerAt);
          } else if (!full[j]) {
            // unfinished or broken: rough stones lie on top
            const rnd = mulberry32(hashInt(j, k, 909));
            for (let q = 0; q < 2; q++) {
              const a = a0 + (a1 - a0) * rnd(),
                rr = ri + 0.3 + rnd() * (C.thick - 0.6),
                s2 = 0.25 + rnd() * 0.3;
              lumpInto(
                mb,
                cos(a) * rr,
                top - s2 * 0.4,
                sin(a) * rr,
                s2 * 1.3,
                s2 * 0.8,
                s2,
                K.cw,
                old ? K.moss : K.cwD,
                hashInt(j, k, q),
                rnd() * 6,
              );
            }
          }
          // where the next stretch stands lower (or this is the end), the end of this one shows
          const ends = [
            [a0, j === 0 ? -1e9 : tops[j - 1] + (full[j - 1] ? 0.95 : 0), -1],
            [
              a1,
              j === m - 1 ? -1e9 : tops[j + 1] + (full[j + 1] ? 0.95 : 0),
              1,
            ],
          ];
          for (const [ae, other, sd] of ends) {
            const yLo = Math.max(foot, Math.min(pTop, other));
            if (pTop - yLo < 0.05) continue;
            cvFace(
              mb,
              [
                P(ae, ri, yLo),
                P(ae, ro, yLo),
                P(ae, ro, pTop),
                P(ae, ri, pTop),
              ],
              TAN(ae).map((v) => v * sd),
              K.cwD,
              PAT.STONE,
              stone,
            );
          }
          // a wall below, a floor above; the parapet stops you walking off the outside
          rcol(
            am,
            W,
            (-(a1 - a0) / 2) * W - 0.03,
            ((a1 - a0) / 2) * W + 0.03,
            -C.thick / 2,
            C.thick / 2,
            top,
          );
          if (par)
            rcol(
              am,
              W,
              (-(a1 - a0) / 2) * W,
              ((a1 - a0) / 2) * W,
              C.thick / 2 - 0.62,
              C.thick / 2,
              pTop,
            );
        }
      }
      // ---- towers, out from the wall's face ----
      for (const t of C.towers) {
        const a = t.a,
          T = C.tower,
          gT = gG(a),
          r0 = ro - 0.62;
        const broken = t.broken != null,
          low = t.low != null;
        const top = broken
          ? gT + C.H * t.broken + 1.2
          : low
            ? gT + t.low
            : gT + C.H + 3.4;
        const foot =
          Math.min(hAt(cos(a) * (r0 + T), sin(a) * (r0 + T)), gT) - 0.8;
        if (broken) {
          // the top broken off: what is left of each side stands to its own height
          const rnd = mulberry32(hashInt(Math.round(a * 1000), 3, 77));
          for (let q = 0; q < 4; q++) {
            const h = top - rnd() * (top - gT) * 0.5;
            if (q === 0)
              rbox(a, r0, -T / 2, T / 2, T - 0.9, T, foot, h, K.cw, PAT.STONE);
            if (q === 1)
              rbox(a, r0, -T / 2, -T / 2 + 0.9, 0, T, foot, h, K.cw, PAT.STONE);
            if (q === 2)
              rbox(a, r0, T / 2 - 0.9, T / 2, 0, T, foot, h, K.cw, PAT.STONE);
            if (q === 3)
              rbox(
                a,
                r0,
                -T / 2,
                T / 2,
                0,
                0.9,
                foot,
                Math.min(h, top - 2),
                K.cw,
                PAT.STONE,
              );
          }
          for (let q = 0; q < 5; q++) {
            const u = (rnd() - 0.5) * T * 1.6,
              v = T + 0.6 + rnd() * 2.4,
              s2 = 0.35 + rnd() * 0.45,
              x = cos(a) * (r0 + v) - sin(a) * u,
              z = sin(a) * (r0 + v) + cos(a) * u;
            lumpInto(
              mb,
              x,
              hAt(x, z) - s2 * 0.4,
              z,
              s2 * 1.4,
              s2,
              s2 * 1.1,
              K.cw,
              K.moss,
              hashInt(q, Math.round(a * 1000), 5),
              rnd() * 6,
            );
          }
          rcol(a, r0, -T / 2, T / 2, 0, T);
          continue;
        }
        rbox(a, r0, -T / 2, T / 2, 0, T, foot, top, K.cw, PAT.STONE, stone, [
          "out",
          "left",
          "right",
          "top",
          "in",
        ]);
        // arrow slits on its three outer faces, and a door onto the walk
        const Q = (u, v, y) => [
          cos(a) * (r0 + v) - sin(a) * u,
          y,
          sin(a) * (r0 + v) + cos(a) * u,
        ];
        if (!low) {
          for (const y of [gT + 3.2, gT + C.H + 1.2]) {
            cvFace(
              mb,
              [
                Q(-0.14, T + 0.03, y),
                Q(0.14, T + 0.03, y),
                Q(0.14, T + 0.03, y + 1.1),
                Q(-0.14, T + 0.03, y + 1.1),
              ],
              OUT(a),
              K.char || K.iron,
              PAT.NONE,
            );
            for (const sd of [-1, 1])
              cvFace(
                mb,
                [
                  Q(sd * (T / 2 + 0.03), T / 2 - 0.14, y),
                  Q(sd * (T / 2 + 0.03), T / 2 + 0.14, y),
                  Q(sd * (T / 2 + 0.03), T / 2 + 0.14, y + 1.1),
                  Q(sd * (T / 2 + 0.03), T / 2 - 0.14, y + 1.1),
                ],
                TAN(a).map((v) => v * sd),
                K.char || K.iron,
                PAT.NONE,
              );
          }
          // crenels round its top, and a roof over it in the people's own way
          const mt = top;
          for (const [u0, u1, v0, v1] of [
            [-T / 2, T / 2, T - 0.55, T],
            [-T / 2, -T / 2 + 0.55, 0, T],
            [T / 2 - 0.55, T / 2, 0, T],
            [-T / 2, T / 2, 0, 0.55],
          ]) {
            const along = u1 - u0 > v1 - v0,
              L = along ? u1 - u0 : v1 - v0,
              nm = Math.max(2, Math.floor(L / 1.6));
            for (let q = 0; q < nm; q++) {
              if (q % 2) continue;
              const s0 = (along ? u0 : v0) + (L * q) / nm,
                s1 = s0 + L / nm;
              if (along)
                rbox(a, r0, s0, s1, v0, v1, mt, mt + 0.85, K.cw, PAT.STONE);
              else rbox(a, r0, u0, u1, s0, s1, mt, mt + 0.85, K.cw, PAT.STONE);
            }
          }
          if (!old) {
            const c = Q(0, T / 2, 0);
            pyramid(
              a,
              r0,
              -T / 2,
              T / 2,
              0,
              T,
              mt + 0.85,
              T * 0.75,
              K.roof,
              roofPat,
            );
            // a banner on its pole
            if (C.state === "thriving") {
              const pt = mt + 0.85 + T * 0.75;
              mb.prism(
                [c[0], pt - 0.3, c[2]],
                [c[0], pt + 2.2, c[2]],
                0.05,
                0.04,
                4,
                K.wood,
                PAT.BARK,
              );
              const tx = -sin(a) * 1.2,
                tz = cos(a) * 1.2;
              mb.quad(
                [c[0], pt + 2.1, c[2]],
                [c[0] + tx, pt + 1.95, c[2] + tz],
                [c[0] + tx, pt + 1.35, c[2] + tz],
                [c[0], pt + 1.5, c[2]],
                K.banner,
                PAT.CLOTH,
              );
              mb.quad(
                [c[0] + tx, pt + 1.95, c[2] + tz],
                [c[0], pt + 2.1, c[2]],
                [c[0], pt + 1.5, c[2]],
                [c[0] + tx, pt + 1.35, c[2] + tz],
                K.banner,
                PAT.CLOTH,
              );
            }
          }
          // its door from the walk
          const wt = gT + cityWallH(C, a);
          cvFace(
            mb,
            [
              Q(-0.5, -0.02, wt),
              Q(0.5, -0.02, wt),
              Q(0.5, -0.02, wt + 1.95),
              Q(-0.5, -0.02, wt + 1.95),
            ],
            IN(a),
            K.wood,
            PAT.DOOR,
            { row2: K.dark },
          );
        }
        rcol(a, r0, -T / 2, T / 2, 0, T);
      }
      // ---- gatehouses ----
      const vIn = -C.thick / 2 - 2.2,
        vOut = C.thick / 2 + 3.4,
        ys = 3.8;
      for (const gt of C.gates) {
        const a = gt.a,
          gy = gG(a),
          foot = gy - 0.8,
          unf = !!gt.unfinished;
        let top = unf ? gy + C.H * 0.55 : gy + C.H + 1.4;
        const towerTop = unf ? top : gy + C.H + 3.6;
        const Q = (u, v, y) => [
          cos(a) * (W + v) - sin(a) * u,
          y,
          sin(a) * (W + v) + cos(a) * u,
        ];
        const brk = (sd) =>
          gt.broken ? hash01(Math.round(a * 1000), sd + 2, 31) * 0.5 + 0.45 : 1;
        // (broken: the arch stands only if both its towers still stand above it)
        if (gt.broken)
          top = Math.min(
            top,
            gy + (towerTop - gy) * Math.min(brk(-1), brk(1)) - 0.4,
          );
        const fell =
          gt.broken === "fallen" || (gt.broken && top < gy + ys + pw + 0.6);
        for (const sd of [-1, 1]) {
          const u0 = sd > 0 ? pw : -pw - TW,
            u1 = sd > 0 ? pw + TW : -pw,
            tt = gt.broken ? gy + (towerTop - gy) * brk(sd) : towerTop;
          rbox(a, W, u0, u1, vIn, vOut, foot, tt, K.cw, PAT.STONE);
          rcol(a, W, u0, u1, vIn, vOut);
          if (!unf && !gt.broken) {
            // crenels on top, a roof, and slits
            for (const [s0, s1] of [
              [vIn, vIn + 0.9],
              [vOut - 0.9, vOut],
            ])
              for (let q = 0; q < 3; q += 2)
                rbox(
                  a,
                  W,
                  u0 + (q * TW) / 3,
                  u0 + ((q + 1) * TW) / 3,
                  s0,
                  s1,
                  tt,
                  tt + 0.85,
                  K.cw,
                  PAT.STONE,
                );
            if (!old)
              pyramid(
                a,
                W,
                u0,
                u1,
                vIn,
                vOut,
                tt + 0.85,
                TW * 0.95,
                K.roof,
                roofPat,
              );
            for (const y of [gy + 4.6, gy + C.H + 0.8])
              cvFace(
                mb,
                [
                  Q((u0 + u1) / 2 - 0.14, vOut + 0.03, y),
                  Q((u0 + u1) / 2 + 0.14, vOut + 0.03, y),
                  Q((u0 + u1) / 2 + 0.14, vOut + 0.03, y + 1.1),
                  Q((u0 + u1) / 2 - 0.14, vOut + 0.03, y + 1.1),
                ],
                OUT(a),
                K.char || K.iron,
                PAT.NONE,
              );
            // the people's banner hung on its face
            if (C.state === "thriving" && !old) {
              const uc = (u0 + u1) / 2,
                bw = 0.8,
                y1 = gy + C.H + 0.3,
                y0 = y1 - 3.4;
              cvFace(
                mb,
                [
                  Q(uc - bw, vOut + 0.06, y0 + 0.4),
                  Q(uc + bw, vOut + 0.06, y0 + 0.4),
                  Q(uc + bw, vOut + 0.06, y1),
                  Q(uc - bw, vOut + 0.06, y1),
                ],
                OUT(a),
                K.banner,
                PAT.CLOTH,
              );
              cvFace(
                mb,
                [
                  Q(uc - bw, vOut + 0.06, y0 + 0.4),
                  Q(uc, vOut + 0.06, y0 - 0.2),
                  Q(uc, vOut + 0.06, y0 - 0.2),
                  Q(uc + bw, vOut + 0.06, y0 + 0.4),
                ],
                OUT(a),
                K.banner,
                PAT.CLOTH,
              );
            }
          }
        }
        if (unf || fell) {
          // not yet arched over (or fallen in): stones in the way
          if (fell) {
            const rnd = mulberry32(hashInt(Math.round(a * 1000), 9, 1));
            for (let q = 0; q < 7; q++) {
              const u = (rnd() - 0.5) * pw * 2.6,
                v = vIn + rnd() * (vOut - vIn),
                s2 = 0.3 + rnd() * 0.5,
                p = Q(u, v, 0);
              lumpInto(
                mb,
                p[0],
                hAt(p[0], p[2]) - s2 * 0.4,
                p[2],
                s2 * 1.5,
                s2 * 0.9,
                s2 * 1.2,
                K.cw,
                K.moss,
                hashInt(q, 7, Math.round(a * 1000)),
                rnd() * 6,
              );
              if (s2 > 0.6)
                col.push(
                  p[0],
                  p[2],
                  s2 * 1.1,
                  base + hAt(p[0], p[2]) - 0.3,
                  base + hAt(p[0], p[2]) + s2 * 0.9,
                  2,
                );
            }
          }
          continue;
        }
        // the arch over the passage: its faces round the opening, the vault inside, the top
        const NA = 8,
          arc = [];
        for (let q = 0; q <= NA; q++) {
          const f = Math.PI - (q / NA) * Math.PI;
          arc.push([cos(f) * pw, gy + ys + sin(f) * pw]);
        }
        for (const [v, want] of [
          [vOut, OUT(a)],
          [vIn, IN(a)],
        ])
          for (let q = 0; q < NA; q++)
            cvFace(
              mb,
              [
                Q(arc[q][0], v, arc[q][1]),
                Q(arc[q + 1][0], v, arc[q + 1][1]),
                Q(arc[q + 1][0], v, top),
                Q(arc[q][0], v, top),
              ],
              want,
              K.cw,
              PAT.STONE,
              stone,
            );
        for (let q = 0; q < NA; q++) {
          const mid = (arc[q][0] + arc[q + 1][0]) / 2,
            my = (arc[q][1] + arc[q + 1][1]) / 2;
          cvFace(
            mb,
            [
              Q(arc[q][0], vIn, arc[q][1]),
              Q(arc[q + 1][0], vIn, arc[q + 1][1]),
              Q(arc[q + 1][0], vOut, arc[q + 1][1]),
              Q(arc[q][0], vOut, arc[q][1]),
            ],
            [mid * sin(a), gy + ys - my, -mid * cos(a)],
            K.cwD,
            PAT.STONE,
            { lv: -0.5 },
          );
        }
        cvFace(
          mb,
          [
            Q(-pw, vIn, top),
            Q(pw, vIn, top),
            Q(pw, vOut, top),
            Q(-pw, vOut, top),
          ],
          UP,
          K.cwT,
          PAT.STONE,
          stone,
        );
        for (const v0 of [vIn, vOut - 0.9])
          for (let q = 0; q < 3; q += 2)
            rbox(
              a,
              W,
              -pw + (q * pw * 2) / 3,
              -pw + ((q + 1) * pw * 2) / 3,
              v0,
              v0 + 0.9,
              top,
              top + 0.85,
              K.cw,
              PAT.STONE,
            );
        // the doors: two leaves of planks banded with iron, standing open against the passage's sides
        // (in the city that fell, one lies in the passage and the other is gone)
        const leaf = (sd, flat) => {
          const hv = vOut - 1.2,
            u = sd * (pw - 0.14),
            h = ys + 0.5;
          if (flat) {
            const p0 = Q(sd * 0.6, hv - 0.2, gy + 0.06),
              p1 = Q(sd * 0.6 - sd * pw * 0.9, hv - 0.2, gy + 0.06),
              p2 = Q(sd * 0.6 - sd * pw * 0.9, hv - 0.2 - h, gy + 0.12),
              p3 = Q(sd * 0.6, hv - 0.2 - h, gy + 0.12);
            cvFace(mb, [p0, p1, p2, p3], UP, K.wood, PAT.PLANK, { lv: -0.3 });
            return;
          }
          cvFace(
            mb,
            [
              Q(u, hv, gy),
              Q(u, hv - pw * 0.95, gy),
              Q(u, hv - pw * 0.95, gy + h),
              Q(u, hv, gy + h),
            ],
            TAN(a).map((v) => -v * sd),
            K.wood,
            PAT.PLANK,
            { lv: -0.3 },
          );
          for (const y of [0.6, 2.0, 3.6])
            cvFace(
              mb,
              [
                Q(u - sd * 0.02, hv, gy + y),
                Q(u - sd * 0.02, hv - pw * 0.95, gy + y),
                Q(u - sd * 0.02, hv - pw * 0.95, gy + y + 0.16),
                Q(u - sd * 0.02, hv, gy + y + 0.16),
              ],
              TAN(a).map((v) => -v * sd),
              K.iron,
              PAT.NONE,
            );
        };
        if (gt.broken) leaf(1, true);
        else {
          leaf(-1, false);
          leaf(1, false);
        }
      }
      // ---- stairs up to the walk, beside each gate on the inside ----
      C.gates.forEach((gt, k) => {
        if (gt.unfinished || (old && k % 3 === 1)) return;
        // (a landing at its top, against the gatehouse, from which you step out onto the walk)
        const sd = k % 2 ? -1 : 1,
          L = 12.5,
          uL = pw + TW,
          u0 = uL + 1.7,
          rs = ri - 0.98,
          am = gt.a + (sd * (u0 + L / 2)) / rs;
        const aTop = gt.a + (sd * u0) / rs,
          aFoot = gt.a + (sd * (u0 + L)) / rs;
        // (up to wherever the walk stands there)
        const wTop = (() => {
          const j = gG(aTop);
          return j + cityWallH(C, aTop);
        })();
        const yFoot = hAt(cos(aFoot) * rs, sin(aFoot) * rs);
        if (wTop - yFoot < 1) return;
        const nS = Math.max(4, Math.ceil((wTop - yFoot) / 0.3)),
          tread = L / nS;
        const ux = -sin(am),
          uz = cos(am),
          vx = cos(am),
          vz = sin(am),
          cx = vx * rs,
          cz = vz * rs;
        // along the flight: s from its foot (0) to its top (L); across it: w (out towards the wall +)
        const S = (s, w, y) => {
          const t = (L / 2 - s) * sd;
          return [cx + ux * t + vx * w, y, cz + uz * t + vz * w];
        };
        for (let q = 0; q < nS; q++) {
          const s0 = q * tread,
            s1 = s0 + tread,
            yt = yFoot + ((wTop - yFoot) * (q + 1)) / nS,
            sp = S(s0, 0, 0),
            yb = Math.min(yFoot, hAt(sp[0], sp[2])) - 0.4;
          const f = [
            S(s0, -0.95, yb),
            S(s0, 0.95, yb),
            S(s0, 0.95, yt),
            S(s0, -0.95, yt),
          ];
          const back = [
            S(s1, -0.95, yt),
            S(s1, 0.95, yt),
            S(s0, 0.95, yt),
            S(s0, -0.95, yt),
          ];
          cvFace(mb, f, [ux * sd, 0, uz * sd], K.cwD, PAT.STONE, stone);
          cvFace(mb, back, UP, K.cwT, PAT.STONE, stone);
          cvFace(
            mb,
            [
              S(s0, -0.95, yb),
              S(s1, -0.95, yb),
              S(s1, -0.95, yt),
              S(s0, -0.95, yt),
            ],
            [-vx, 0, -vz],
            K.cw,
            PAT.STONE,
            stone,
          );
        }
        // the landing: stone up to the walk, a floor on top
        {
          const al = gt.a + (sd * (uL + 0.85)) / rs,
            Ql = (u, v, y) => [
              cos(al) * (rs + v) - sin(al) * u,
              y,
              sin(al) * (rs + v) + cos(al) * u,
            ];
          const yb0 = Math.min(yFoot, hAt(cos(al) * rs, sin(al) * rs)) - 0.4;
          rbox(
            al,
            rs,
            -0.86,
            0.86,
            -0.95,
            0.98,
            yb0,
            wTop,
            K.cw,
            PAT.STONE,
            stone,
            ["in", "left", "right"],
          );
          cvFace(
            mb,
            [
              Ql(-0.86, -0.95, wTop),
              Ql(0.86, -0.95, wTop),
              Ql(0.86, 0.98, wTop),
              Ql(-0.86, 0.98, wTop),
            ],
            UP,
            K.cwT,
            PAT.STONE,
            stone,
          );
          boxes.push({
            x: cos(al) * (rs + 0.25),
            z: sin(al) * (rs + 0.25),
            hx: 0.9,
            hz: 1.22,
            cs: -sin(al),
            sn: cos(al),
            top: base + wTop,
          });
        }
        // walked up from its foot, the walk at its top
        const bx = {
          x: cx + vx * 0.25,
          z: cz + vz * 0.25,
          hx: 1.22,
          hz: L / 2,
          cs: 1,
          sn: 0,
          slope: true,
          ya: base + yFoot,
          yb: base + wTop,
        };
        // (its own frame: x across the flight, z up it; up it runs towards the gate)
        const zx = -ux * sd,
          zz = -uz * sd;
        bx.cs = zz;
        bx.sn = -zx;
        boxes.push(bx);
      });
    },

    // ---------- the city's other pieces (props) ----------
    cityPropInto(mb, pr, y0, c, h) {
      const { col, boxes, hAt, base } = c,
        old = c.old ?? !!(c.v && c.v.plan && c.v.plan.kind === "deadcity");
      const K =
        c.K ||
        this.cityRows(
          c.v && c.v.plan
            ? c.v.plan.style
            : { arch: "stone", roof: [90, 86, 104], wood: [108, 78, 50] },
          old,
          c.rows,
        );
      const { x, z } = h;
      switch (pr.t) {
        case "fountain": {
          // a round basin with water in it (dry, in a city emptying or fallen), a column in the middle, and
          // on top of it the one who founded the city (in the one that fell, lying in pieces in the basin)
          const R0 = pr.r,
            n = 16,
            rim = 0.62;
          for (let k = 0; k < n; k++) {
            const a0 = (k / n) * Math.PI * 2,
              a1 = ((k + 1) / n) * Math.PI * 2,
              P = (a, r, y) => [x + Math.cos(a) * r, y, z + Math.sin(a) * r];
            cvFace(
              mb,
              [
                P(a0, R0, y0 - 0.3),
                P(a1, R0, y0 - 0.3),
                P(a1, R0, y0 + rim),
                P(a0, R0, y0 + rim),
              ],
              [Math.cos((a0 + a1) / 2), 0, Math.sin((a0 + a1) / 2)],
              K.cw,
              PAT.STONE,
              old ? { row2: K.moss } : null,
            );
            cvFace(
              mb,
              [
                P(a0, R0 - 0.4, y0 - 0.3),
                P(a1, R0 - 0.4, y0 - 0.3),
                P(a1, R0 - 0.4, y0 + rim),
                P(a0, R0 - 0.4, y0 + rim),
              ],
              [-Math.cos((a0 + a1) / 2), 0, -Math.sin((a0 + a1) / 2)],
              K.cwD,
              PAT.STONE,
            );
            cvFace(
              mb,
              [
                P(a0, R0 - 0.4, y0 + rim),
                P(a1, R0 - 0.4, y0 + rim),
                P(a1, R0, y0 + rim),
                P(a0, R0, y0 + rim),
              ],
              [0, 1, 0],
              K.cwT,
              PAT.STONE,
            );
            if (!pr.dry)
              mb.tri(
                [x, y0 + rim - 0.16, z],
                P(a1, R0 - 0.4, y0 + rim - 0.16),
                P(a0, R0 - 0.4, y0 + rim - 0.16),
                K.water,
                PAT.POOL,
              );
            else
              mb.tri(
                [x, y0 + 0.05, z],
                P(a1, R0 - 0.4, y0 + 0.05),
                P(a0, R0 - 0.4, y0 + 0.05),
                K.cwD,
                PAT.STONE,
              );
          }
          // the column, a bowl on it, and spouts of water down into the basin
          mb.prism(
            [x, y0 - 0.2, z],
            [x, y0 + 2.2, z],
            0.5,
            0.42,
            8,
            K.cw,
            PAT.STONE,
            null,
            0,
            true,
          );
          mb.prism(
            [x, y0 + 2.2, z],
            [x, y0 + 2.55, z],
            0.6,
            1.0,
            10,
            K.cw,
            PAT.STONE,
            null,
            0,
            true,
          );
          if (!pr.dry)
            for (let k = 0; k < 4; k++) {
              const a = (k / 4) * Math.PI * 2 + (pr.rot || 0);
              mb.prism(
                [x + Math.cos(a) * 0.95, y0 + 2.5, z + Math.sin(a) * 0.95],
                [x + Math.cos(a) * 1.9, y0 + rim - 0.1, z + Math.sin(a) * 1.9],
                0.06,
                0.09,
                4,
                K.water,
                PAT.SPRAY,
              );
            }
          if (!pr.broken) {
            // the founder: robed, one arm raised over the city
            const sY = y0 + 2.55,
              s = 1.25,
              f = (pr.rot || 0) + Math.PI,
              fx = Math.cos(f),
              fz = Math.sin(f);
            mb.prism(
              [x, sY, z],
              [x, sY + 1.1 * s, z],
              0.36 * s,
              0.24 * s,
              7,
              K.cwT,
              PAT.NONE,
              null,
              0,
              false,
            );
            mb.prism(
              [x, sY + 1.1 * s, z],
              [x, sY + 1.55 * s, z],
              0.24 * s,
              0.22 * s,
              7,
              K.cwT,
              PAT.NONE,
              null,
              0,
              false,
            );
            mb.prism(
              [x, sY + 1.55 * s, z],
              [x, sY + 1.85 * s, z],
              0.15 * s,
              0.12 * s,
              6,
              K.cwT,
              PAT.NONE,
              null,
              0,
              true,
            );
            mb.prism(
              [x - fz * 0.26 * s, sY + 1.45 * s, z + fx * 0.26 * s],
              [
                x - fz * 0.4 * s + fx * 0.2,
                sY + 2.15 * s,
                z + fx * 0.4 * s + fz * 0.2,
              ],
              0.07 * s,
              0.06 * s,
              5,
              K.cwT,
              PAT.NONE,
            );
            mb.prism(
              [x + fz * 0.26 * s, sY + 1.45 * s, z - fx * 0.26 * s],
              [
                x + fz * 0.34 * s + fx * 0.15,
                sY + 0.95 * s,
                z - fx * 0.34 * s + fz * 0.15,
              ],
              0.07 * s,
              0.06 * s,
              5,
              K.cwT,
              PAT.NONE,
            );
          } else {
            const rnd = mulberry32(hashInt(7, 7, 7));
            for (let q = 0; q < 4; q++) {
              const a = rnd() * 6.28,
                r = 1.2 + rnd() * 1.4;
              lumpInto(
                mb,
                x + Math.cos(a) * r,
                y0 + 0.02,
                z + Math.sin(a) * r,
                0.3 + rnd() * 0.25,
                0.22,
                0.25,
                K.cwT,
                K.moss,
                hashInt(q, 9, 3),
                a,
              );
            }
          }
          col.push(x, z, R0 + 0.05, base + y0 - 0.3, base + y0 + rim, 1);
          col.push(x, z, 0.62, base + y0 - 0.3, 1e9, 1);
          return;
        }
        case "stonepile": {
          // squared stone stacked ready for the wall
          const rnd = mulberry32(pr.seed || 3),
            cs = Math.cos(pr.rot || 0),
            sn = Math.sin(pr.rot || 0);
          let k = 0;
          for (let row = 0; row < 3; row++)
            for (let q = 0; q < 3 - row; q++) {
              const u = (q - (2 - row) / 2) * 0.95 + (rnd() - 0.5) * 0.1,
                w = (rnd() - 0.5) * 0.2,
                yb = y0 - 0.05 + row * 0.5;
              const cx = x + u * cs - w * sn,
                cz = z + u * sn + w * cs;
              for (const dw of [-0.3, 0.3]) {
                const bx = cx - dw * sn,
                  bz = cz + dw * cs;
                mb.box(
                  bx - 0.42,
                  yb,
                  bz - 0.27,
                  bx + 0.42,
                  yb + 0.48,
                  bz + 0.27,
                  k++ % 3 ? K.cw : K.cwT,
                  PAT.STONE,
                );
              }
            }
          col.push(x, z, 1.5, base + y0 - 0.2, base + y0 + 1.5, 2);
          return;
        }
        case "crane": {
          // a treadwheel crane: a mast and a jib over the wall, a stone hanging from it, the great wheel at its foot
          const cs = Math.cos(pr.rot || 0),
            sn = Math.sin(pr.rot || 0),
            A = (u, y, w) => [x + u * cs - w * sn, y, z + u * sn + w * cs];
          mb.prism(
            A(0, y0 - 0.3, 0),
            A(0, y0 + 10.5, 0),
            0.18,
            0.14,
            6,
            K.wood,
            PAT.BARK,
          );
          for (const [u, w] of [
            [-1.6, 0],
            [1.6, 0],
            [0, 1.6],
          ])
            mb.prism(
              A(u, y0 - 0.2, w),
              A(0, y0 + 4.5, 0),
              0.08,
              0.07,
              4,
              K.wood,
              PAT.BARK,
            );
          // (the jib reaches out over the wall: the front of the crane looks at it, -w)
          mb.prism(
            A(0, y0 + 9.4, 0.8),
            A(0, y0 + 13.2, -7.2),
            0.12,
            0.08,
            5,
            K.wood,
            PAT.BARK,
          );
          mb.prism(
            A(0, y0 + 10.4, 0),
            A(0, y0 + 13.1, -7.0),
            0.03,
            0.03,
            3,
            K.rope,
            PAT.NONE,
          );
          mb.prism(
            A(0, y0 + 13.0, -7.1),
            A(0, y0 + 9.0, -7.1),
            0.025,
            0.025,
            3,
            K.rope,
            PAT.NONE,
          );
          {
            const p = A(0, y0 + 8.4, -7.1);
            mb.box(
              p[0] - 0.45,
              p[1],
              p[2] - 0.3,
              p[0] + 0.45,
              p[1] + 0.55,
              p[2] + 0.3,
              K.cwT,
              PAT.STONE,
            );
          }
          // the wheel
          const wr = 1.8,
            wc = A(1.6, y0 + wr + 0.1, 0.9);
          for (let k = 0; k < 14; k++) {
            const a0 = (k / 14) * Math.PI * 2,
              a1 = ((k + 1) / 14) * Math.PI * 2;
            for (const dw of [-0.55, 0.55])
              mb.prism(
                [
                  wc[0] + Math.cos(a0) * wr * cs - dw * sn,
                  wc[1] + Math.sin(a0) * wr,
                  wc[2] + Math.cos(a0) * wr * sn + dw * cs,
                ],
                [
                  wc[0] + Math.cos(a1) * wr * cs - dw * sn,
                  wc[1] + Math.sin(a1) * wr,
                  wc[2] + Math.cos(a1) * wr * sn + dw * cs,
                ],
                0.06,
                0.06,
                4,
                K.wood,
                PAT.PLANK,
              );
            if (k % 2 === 0)
              mb.prism(
                [
                  wc[0] + Math.cos(a0) * wr * cs + 0.55 * sn,
                  wc[1] + Math.sin(a0) * wr,
                  wc[2] + Math.cos(a0) * wr * sn - 0.55 * cs,
                ],
                [
                  wc[0] + Math.cos(a0) * wr * cs - 0.55 * sn,
                  wc[1] + Math.sin(a0) * wr,
                  wc[2] + Math.cos(a0) * wr * sn + 0.55 * cs,
                ],
                0.05,
                0.05,
                4,
                K.wood,
                PAT.PLANK,
              );
          }
          col.push(x, z, 0.4, base + y0 - 0.3, 1e9, 1);
          {
            const p = A(1.6, 0, 0.9);
            col.push(p[0], p[2], 1.2, base + y0 - 0.3, base + y0 + 3.8, 1);
          }
          return;
        }
        case "scaffold": {
          // poles and planks up the inside of the wall where it is going up
          const C = c.city || c.v.plan.city,
            W = C.wall,
            ri = W - C.thick / 2,
            a0 = pr.a0,
            a1 = pr.a1,
            len = Math.abs(cvWrap(a1 - a0)) * ri,
            n = Math.max(2, Math.round(len / 3));
          const gAt = (a, r) => hAt(Math.cos(a) * r, Math.sin(a) * r);
          let prev = null;
          for (let k = 0; k <= n; k++) {
            const a = a0 + (cvWrap(a1 - a0) * k) / n,
              g = gAt(a, ri),
              top = g + cityWallH(C, a) + 1.6;
            const pin = [Math.cos(a) * (ri - 1.3), Math.sin(a) * (ri - 1.3)],
              pout = [Math.cos(a) * (ri - 0.15), Math.sin(a) * (ri - 0.15)];
            for (const p of [pin, pout]) {
              mb.prism(
                [p[0], gAt(a, ri - 1) - 0.2, p[1]],
                [p[0], top, p[1]],
                0.06,
                0.05,
                4,
                K.wood,
                PAT.BARK,
              );
              col.push(p[0], p[1], 0.1, base + g - 0.3, base + top, 1);
            }
            // ledgers every two metres, and a narrow walk of planks along the top two
            for (let y = g + 2.4, lv = 0; y < top - 0.5; y += 2.2, lv++) {
              mb.prism(
                [pin[0], y, pin[1]],
                [pout[0], y, pout[1]],
                0.04,
                0.04,
                4,
                K.wood,
                PAT.BARK,
              );
              if (prev && y > top - 4.8) {
                const [qin, qout] = prev,
                  m = (p, q, t) => [
                    p[0] + (q[0] - p[0]) * t,
                    p[1] + (q[1] - p[1]) * t,
                  ],
                  i0 = m(qin, qout, 0.35),
                  i1 = m(pin, pout, 0.35);
                cvFace(
                  mb,
                  [
                    [i0[0], y + 0.06, i0[1]],
                    [qout[0], y + 0.06, qout[1]],
                    [pout[0], y + 0.06, pout[1]],
                    [i1[0], y + 0.06, i1[1]],
                  ],
                  [0, 1, 0],
                  K.plank,
                  PAT.PLANK,
                );
              }
            }
            prev = [pin, pout];
          }
          return;
        }
        case "rubblemound": {
          // what was a house: a low mound of fallen stone, grass growing in it
          const rnd = mulberry32(pr.seed || 5),
            cs = Math.cos(pr.rot || 0),
            sn = Math.sin(pr.rot || 0);
          for (let q = 0; q < 9; q++) {
            const u = (rnd() - 0.5) * pr.w * 0.8,
              w = (rnd() - 0.5) * pr.d * 0.8,
              s2 = 0.45 + rnd() * 0.6,
              px = x + u * cs - w * sn,
              pz = z + u * sn + w * cs;
            lumpInto(
              mb,
              px,
              hAt(px, pz) - s2 * 0.5,
              pz,
              s2 * 1.6,
              s2 * 0.7,
              s2 * 1.3,
              q % 3 ? K.cw : K.cwD,
              K.moss,
              hashInt(q, pr.seed || 5, 3),
              rnd() * 6,
            );
          }
          // and the stub of a wall at one end
          const u0 = -pr.w / 2,
            P = (u, y, w) => [x + u * cs - w * sn, y, z + u * sn + w * cs];
          const hh = 0.6 + rnd() * 1.2;
          cvFace(
            mb,
            [
              P(u0, y0 - 0.3, -pr.d / 2),
              P(u0, y0 - 0.3, (pr.d / 2) * rnd()),
              P(u0, y0 + hh, (pr.d / 2) * 0.5 * rnd()),
              P(u0, y0 + hh, -pr.d / 2),
            ],
            [-cs, 0, -sn],
            K.cw,
            PAT.STONE,
            { row2: K.moss },
          );
          col.push(
            x,
            z,
            Math.min(pr.w, pr.d) / 2,
            base + y0 - 0.3,
            base + y0 + 0.8,
            2,
          );
          return;
        }
        case "ruintower": {
          // one of the palace's towers, broken off
          const cs = Math.cos(pr.rot || 0),
            sn = Math.sin(pr.rot || 0),
            hw = pr.w / 2,
            rnd = mulberry32(pr.seed || 9);
          const P = (u, y, w) => [x + u * cs - w * sn, y, z + u * sn + w * cs];
          const sides = [
            [
              [-hw, -hw],
              [hw, -hw],
              [0, -1],
            ],
            [
              [hw, -hw],
              [hw, hw],
              [1, 0],
            ],
            [
              [hw, hw],
              [-hw, hw],
              [0, 1],
            ],
            [
              [-hw, hw],
              [-hw, -hw],
              [-1, 0],
            ],
          ];
          for (const [[u0, w0], [u1, w1], [nu, nw]] of sides) {
            const h0 = pr.h * (0.5 + rnd() * 0.5),
              h1 = pr.h * (0.5 + rnd() * 0.5);
            const want = [nu * cs - nw * sn, 0, nu * sn + nw * cs];
            cvFace(
              mb,
              [
                P(u0, y0 - 0.4, w0),
                P(u1, y0 - 0.4, w1),
                P(u1, y0 + h1, w1),
                P(u0, y0 + h0, w0),
              ],
              want,
              K.cw,
              PAT.STONE,
              { row2: K.moss },
            );
            cvFace(
              mb,
              [
                P(u0 * 0.82, y0 - 0.4, w0 * 0.82),
                P(u1 * 0.82, y0 - 0.4, w1 * 0.82),
                P(u1 * 0.82, y0 + h1, w1 * 0.82),
                P(u0 * 0.82, y0 + h0, w0 * 0.82),
              ],
              want.map((v) => -v),
              K.cwD,
              PAT.STONE,
            );
            cvFace(
              mb,
              [
                P(u0, y0 + h0, w0),
                P(u1, y0 + h1, w1),
                P(u1 * 0.82, y0 + h1, w1 * 0.82),
                P(u0 * 0.82, y0 + h0, w0 * 0.82),
              ],
              [0, 1, 0],
              K.cw,
              PAT.STONE,
            );
          }
          boxes.push({ x, z, hx: hw, hz: hw, cs, sn });
          return;
        }
        case "coffer": {
          // the treasury's last chest, its lid split, half-buried in what fell on it
          const cs = Math.cos(pr.rot || 0),
            sn = Math.sin(pr.rot || 0),
            P = (u, y, w) => [x + u * cs - w * sn, y, z + u * sn + w * cs];
          const box = (u0, u1, w0, w1, ya, yb, row, pat) => {
            cvFace(
              mb,
              [P(u0, ya, w1), P(u1, ya, w1), P(u1, yb, w1), P(u0, yb, w1)],
              [-sn, 0, cs],
              row,
              pat,
            );
            cvFace(
              mb,
              [P(u0, ya, w0), P(u1, ya, w0), P(u1, yb, w0), P(u0, yb, w0)],
              [sn, 0, -cs],
              row,
              pat,
            );
            cvFace(
              mb,
              [P(u0, ya, w0), P(u0, ya, w1), P(u0, yb, w1), P(u0, yb, w0)],
              [-cs, 0, -sn],
              row,
              pat,
            );
            cvFace(
              mb,
              [P(u1, ya, w0), P(u1, ya, w1), P(u1, yb, w1), P(u1, yb, w0)],
              [cs, 0, sn],
              row,
              pat,
            );
            cvFace(
              mb,
              [P(u0, yb, w0), P(u1, yb, w0), P(u1, yb, w1), P(u0, yb, w1)],
              [0, 1, 0],
              row,
              pat,
            );
          };
          box(-0.7, 0.7, -0.4, 0.4, y0 - 0.1, y0 + 0.6, K.wood, PAT.PLANK);
          box(-0.72, 0.72, -0.05, 0.05, y0 - 0.1, y0 + 0.62, K.iron, PAT.NONE);
          box(-0.75, 0.05, -0.45, 0.4, y0 + 0.62, y0 + 0.74, K.wood, PAT.PLANK);
          lumpInto(
            mb,
            P(0.9, 0, -0.2)[0],
            y0 - 0.2,
            P(0.9, 0, -0.2)[2],
            0.5,
            0.4,
            0.45,
            K.cw,
            K.moss,
            51,
            1,
          );
          boxes.push({
            x,
            z,
            hx: 0.75,
            hz: 0.45,
            cs,
            sn,
            top: base + y0 + 0.74,
          });
          return;
        }
        case "ruintree": {
          // a tree grown up where a street was
          const rnd = mulberry32(pr.seed || 11),
            s = pr.s || 1,
            lean = (rnd() - 0.5) * 0.5,
            la = rnd() * 6.28;
          const tip = [
            x + Math.cos(la) * lean * 2 * s,
            y0 + 4.2 * s,
            z + Math.sin(la) * lean * 2 * s,
          ];
          mb.prism(
            [x, y0 - 0.3, z],
            tip,
            0.28 * s,
            0.14 * s,
            6,
            K.bark,
            PAT.BARK,
          );
          for (let q = 0; q < 6; q++) {
            const a = (q / 6) * 6.28 + rnd(),
              r = (1.0 + rnd() * 1.1) * s,
              yy = tip[1] - 0.6 * s + rnd() * 1.6 * s;
            lumpInto(
              mb,
              tip[0] + Math.cos(a) * r,
              yy,
              tip[2] + Math.sin(a) * r,
              (1.2 + rnd() * 0.6) * s,
              (0.9 + rnd() * 0.4) * s,
              (1.2 + rnd() * 0.6) * s,
              q % 2 ? K.leaf : K.leafDark,
              K.leafDark,
              hashInt(q, pr.seed || 11, 21),
              rnd() * 6,
            );
          }
          lumpInto(
            mb,
            tip[0],
            tip[1] + 0.4 * s,
            tip[2],
            1.5 * s,
            1.1 * s,
            1.5 * s,
            K.leaf,
            K.leafDark,
            (pr.seed || 11) + 99,
            rnd() * 6,
          );
          col.push(x, z, 0.3 * s, base + y0 - 0.3, 1e9, 1);
          return;
        }
        case "citywalls": {
          // the walls of the city that fell
          const C = c.v.plan.city;
          this.cityWallsInto(mb, C, hAt, K, {
            col,
            boxes,
            base,
            old: true,
            lights: c.v.lights,
          });
          return;
        }
      }
    },

    // ---------- a house of the city as it stands: fallen in, a frame of timbers, a foundation ----------
    cityHouseInto(mb, b, kit, ctx) {
      const R = kit.rows,
        st = kit.style,
        rnd = mulberry32(
          hashInt(Math.round(b.x * 10), Math.round(b.z * 10), 404),
        );
      const cs = Math.cos(b.rot),
        sn = Math.sin(b.rot),
        P = (u, y, w) => [b.x + u * cs - w * sn, y, b.z + u * sn + w * cs];
      const y = b.base,
        hw = b.w / 2,
        hd = b.d / 2,
        fh = 0.6 + (b.sink || 0);
      const box = (u0, u1, w0, w1, ya, yb, row, pat, o = null, top = true) => {
        cvFace(
          mb,
          [P(u0, ya, w1), P(u1, ya, w1), P(u1, yb, w1), P(u0, yb, w1)],
          [-sn, 0, cs],
          row,
          pat,
          o,
        );
        cvFace(
          mb,
          [P(u0, ya, w0), P(u1, ya, w0), P(u1, yb, w0), P(u0, yb, w0)],
          [sn, 0, -cs],
          row,
          pat,
          o,
        );
        cvFace(
          mb,
          [P(u0, ya, w0), P(u0, ya, w1), P(u0, yb, w1), P(u0, yb, w0)],
          [-cs, 0, -sn],
          row,
          pat,
          o,
        );
        cvFace(
          mb,
          [P(u1, ya, w0), P(u1, ya, w1), P(u1, yb, w1), P(u1, yb, w0)],
          [cs, 0, sn],
          row,
          pat,
          o,
        );
        if (top)
          cvFace(
            mb,
            [P(u0, yb, w0), P(u1, yb, w0), P(u1, yb, w1), P(u0, yb, w1)],
            [0, 1, 0],
            row,
            pat,
            o,
          );
      };
      const toC = (u, w) => [b.x + u * cs - w * sn, b.z + u * sn + w * cs];
      // the footing: stone, its top level, walkable
      const fx = hw + 0.15,
        fz = hd + 0.15;
      box(-fx, fx, -fz, fz, y - fh, y + 0.15, R.base, PAT.STONE);
      ctx.boxes.push({
        x: b.x,
        z: b.z,
        hx: fx,
        hz: fz,
        cs,
        sn,
        top: ctx.base + y + 0.15,
      });
      if (b.found) {
        // a foundation, its first course of wall started at one corner, a few blocks laid by
        box(-hw, -hw + 0.4, -hd, hd, y + 0.15, y + 0.75, R.wall, st.wallPat);
        box(
          -hw,
          hw * 0.2,
          -hd,
          -hd + 0.4,
          y + 0.15,
          y + 0.75,
          R.wall,
          st.wallPat,
        );
        for (let q = 0; q < 3; q++) {
          const p = P(
            hw * (0.2 + rnd() * 0.6),
            0,
            -hd + 1 + rnd() * (hd * 1.4),
          );
          mb.box(
            p[0] - 0.35,
            y + 0.15,
            p[2] - 0.22,
            p[0] + 0.35,
            y + 0.55,
            p[2] + 0.22,
            R.base,
            PAT.STONE,
          );
        }
        return;
      }
      if (b.frame) {
        // a frame of timbers, as high as it has got: posts, the beams of each floor, rafters once it is up
        const floors = Math.max(1, b.floors),
          H = st.storeyH,
          upTo = floors * H * (b.frameK || 1);
        const post = (u, w, y1) => {
          const p0 = P(u, y + 0.15, w),
            p1 = P(u, y1, w);
          mb.prism(p0, p1, 0.11, 0.1, 4, R.wood, PAT.BARK);
          const [X, Z] = toC(u, w);
          ctx.col.push(X, Z, 0.14, ctx.base + y, ctx.base + y1, 1);
        };
        const nu = Math.max(2, Math.round(b.w / 1.6)),
          nw = Math.max(2, Math.round(b.d / 1.6));
        for (let f = 0; f < floors; f++) {
          const y0 = y + 0.15 + f * H,
            y1 = Math.min(y + 0.15 + (f + 1) * H, y + 0.15 + upTo);
          if (y1 <= y0 + 0.3) break;
          for (let i = 0; i <= nu; i++) {
            const u = -hw + (i * b.w) / nu;
            post(u, -hd, y1);
            post(u, hd, y1);
          }
          for (let i = 1; i < nw; i++) {
            const w = -hd + (i * b.d) / nw;
            post(-hw, w, y1);
            post(hw, w, y1);
          }
          // the beams round the top of this floor (and a floor of joists if there is one above)
          if (y1 >= y0 + H - 0.01) {
            for (const [a0, a1] of [
              [
                [-hw, -hd],
                [hw, -hd],
              ],
              [
                [hw, -hd],
                [hw, hd],
              ],
              [
                [hw, hd],
                [-hw, hd],
              ],
              [
                [-hw, hd],
                [-hw, -hd],
              ],
            ])
              mb.prism(
                P(a0[0], y1, a0[1]),
                P(a1[0], y1, a1[1]),
                0.12,
                0.12,
                4,
                R.wood,
                PAT.BARK,
              );
            if (f < floors - 1)
              for (let i = 0; i <= nw; i++) {
                const w = -hd + (i * b.d) / nw;
                mb.prism(
                  P(-hw, y1 - 0.08, w),
                  P(hw, y1 - 0.08, w),
                  0.07,
                  0.07,
                  4,
                  R.wood,
                  PAT.BARK,
                );
              }
          }
        }
        // (a little cladding gone up on the ground floor)
        if ((b.frameK || 0) > 0.5)
          cvFace(
            mb,
            [
              P(-hw, y + 0.15, -hd - 0.02),
              P(hw * 0.1, y + 0.15, -hd - 0.02),
              P(hw * 0.1, y + 1.4, -hd - 0.02),
              P(-hw, y + 1.4, -hd - 0.02),
            ],
            [sn, 0, -cs],
            R.wall,
            st.wallPat,
          );
        if ((b.frameK || 0) > 0.92) {
          // the rafters, pitched, along the long way
          const yr = y + 0.15 + floors * H,
            ridge = (Math.min(b.w, b.d) / 2) * st.roofPitch,
            along = b.w >= b.d,
            nR = Math.max(3, Math.round((along ? b.w : b.d) / 1.2));
          for (let i = 0; i <= nR; i++) {
            const s = -0.5 + i / nR;
            if (along) {
              const u = s * b.w;
              mb.prism(
                P(u, yr, -hd),
                P(u, yr + ridge, 0),
                0.06,
                0.06,
                4,
                R.wood,
                PAT.BARK,
              );
              mb.prism(
                P(u, yr, hd),
                P(u, yr + ridge, 0),
                0.06,
                0.06,
                4,
                R.wood,
                PAT.BARK,
              );
            } else {
              const w = s * b.d;
              mb.prism(
                P(-hw, yr, w),
                P(0, yr + ridge, w),
                0.06,
                0.06,
                4,
                R.wood,
                PAT.BARK,
              );
              mb.prism(
                P(hw, yr, w),
                P(0, yr + ridge, w),
                0.06,
                0.06,
                4,
                R.wood,
                PAT.BARK,
              );
            }
          }
          mb.prism(
            along ? P(-hw, yr + ridge, 0) : P(0, yr + ridge, -hd),
            along ? P(hw, yr + ridge, 0) : P(0, yr + ridge, hd),
            0.08,
            0.08,
            4,
            R.wood,
            PAT.BARK,
          );
        }
        return;
      }
      // fallen in: the walls broken off at every height, the roof gone into the house, beams leaning
      const T = 0.3,
        segs = [];
      for (const [u0, w0, u1, w1, front] of [
        [-hw, hd, hw, hd, true],
        [hw, hd, hw, -hd, false],
        [hw, -hd, -hw, -hd, false],
        [-hw, -hd, -hw, hd, false],
      ]) {
        const len = Math.hypot(u1 - u0, w1 - w0),
          nP = Math.max(2, Math.round(len / 1.4));
        for (let k = 0; k < nP; k++) {
          const t0 = k / nP,
            t1 = (k + 1) / nP;
          if (front && Math.abs((t0 + t1) / 2 - 0.5) < 0.12) continue;
          if (rnd() < 0.12) continue;
          const hh = 0.4 + rnd() * rnd() * Math.min(b.floors, 2) * st.storeyH;
          segs.push([
            u0 + (u1 - u0) * t0,
            w0 + (w1 - w0) * t0,
            u0 + (u1 - u0) * t1,
            w0 + (w1 - w0) * t1,
            hh,
          ]);
        }
      }
      for (const [a0, c0, a1, c1, hh] of segs) {
        const du = a1 - a0,
          dw = c1 - c0,
          L = Math.hypot(du, dw) || 1,
          nu = ((-dw / L) * T) / 2,
          nw = ((du / L) * T) / 2;
        const pts = [
          [a0 + nu, c0 + nw],
          [a1 + nu, c1 + nw],
          [a1 - nu, c1 - nw],
          [a0 - nu, c0 - nw],
        ];
        const Pp = (q, yy) => P(q[0], yy, q[1]);
        const outN = [nu * cs - nw * sn, 0, nu * sn + nw * cs].map(
          (v) => v / (T / 2),
        );
        cvFace(
          mb,
          [
            Pp(pts[0], y + 0.15),
            Pp(pts[1], y + 0.15),
            Pp(pts[1], y + hh),
            Pp(pts[0], y + hh),
          ],
          outN,
          R.wall,
          st.wallPat,
        );
        cvFace(
          mb,
          [
            Pp(pts[3], y + 0.15),
            Pp(pts[2], y + 0.15),
            Pp(pts[2], y + hh),
            Pp(pts[3], y + hh),
          ],
          outN.map((v) => -v),
          R.wall,
          st.wallPat,
          { lv: -0.5 },
        );
        cvFace(
          mb,
          [
            Pp(pts[0], y + hh),
            Pp(pts[1], y + hh),
            Pp(pts[2], y + hh),
            Pp(pts[3], y + hh),
          ],
          [0, 1, 0],
          R.wall,
          st.wallPat,
        );
        for (const [p, q] of [
          [pts[0], pts[3]],
          [pts[1], pts[2]],
        ])
          cvFace(
            mb,
            [Pp(p, y + 0.15), Pp(q, y + 0.15), Pp(q, y + hh), Pp(p, y + hh)],
            [du * cs - dw * sn, 0, du * sn + dw * cs].map(
              (v) => v * (p === pts[0] ? -1 : 1),
            ),
            R.wall,
            st.wallPat,
          );
        const [X, Z] = toC((a0 + a1) / 2, (c0 + c1) / 2),
          ang = Math.atan2(dw, du) + b.rot;
        ctx.boxes.push({
          x: X,
          z: Z,
          hx: L / 2 + 0.04,
          hz: T / 2 + 0.05,
          cs: Math.cos(ang),
          sn: Math.sin(ang),
          top: ctx.base + y + hh,
        });
      }
      for (let q = 0; q < 3; q++) {
        const u = (rnd() - 0.5) * b.w * 0.6,
          w = (rnd() - 0.5) * b.d * 0.6;
        mb.prism(
          P(u, y + 0.15, w),
          P(
            u + (rnd() - 0.5) * 2,
            y + 1.2 + rnd() * 1.6,
            w + (rnd() - 0.5) * 2,
          ),
          0.09,
          0.08,
          4,
          R.char || R.wood,
          PAT.BARK,
        );
      }
      for (let q = 0; q < 5; q++) {
        const p = P((rnd() - 0.5) * b.w * 0.7, 0, (rnd() - 0.5) * b.d * 0.7),
          s2 = 0.3 + rnd() * 0.35;
        lumpInto(
          mb,
          p[0],
          y + 0.1,
          p[2],
          s2 * 1.4,
          s2 * 0.7,
          s2 * 1.2,
          R.wall,
          R.base,
          hashInt(q, Math.round(b.x * 10), 7),
          rnd() * 6,
        );
      }
    },

    // ---------- the great cities' streets, for the paint on the ground ----------
    // (a chunk near one: a function from its own metres to the distance to the nearest street's edge,
    // negative inside it; null if no city is near)
    cityStreetField(c, F, span) {
      const R = this.R,
        out = [];
      const list = this._cityList || (this._cityList = this.cityList());
      for (const ct of list) {
        if (!ct.dir || arcM(c, ct.dir, R) > span * 0.75 + CITY.out + 60)
          continue;
        const Fc = frameAt(ct.dir),
          d = [c[0] - ct.dir[0], c[1] - ct.dir[1], c[2] - ct.dir[2]];
        const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
        const ox = dot(d, Fc.e) * R,
          oz = -dot(d, Fc.n) * R;
        const xx = dot(F.e, Fc.e),
          xz = -dot(F.e, Fc.n),
          zx = -dot(F.n, Fc.e),
          zz = dot(F.n, Fc.n);
        out.push({ ct, C: ct.C, ox, oz, xx, xz, zx, zz });
      }
      if (!out.length) return null;
      // (inside the walls of one: paved; not yet, in the quarters still going up)
      const inner = (x, z) =>
        out.some((q) => {
          const X = q.ox + x * q.xx + z * q.zx,
            Z = q.oz + x * q.xz + z * q.zz,
            r = Math.hypot(X, Z),
            C = q.C;
          if (r >= C.wall - C.thick / 2) return false;
          return !(
            C.newQ &&
            C.newQ.length &&
            r > C.rings[0] + C.ringW + 1 &&
            C.newQ.includes(citySector(C, Math.atan2(Z, X)))
          );
        });
      const f = (x, z) => {
        let best = 1e9;
        for (const q of out) {
          const X = q.ox + x * q.xx + z * q.zx,
            Z = q.oz + x * q.xz + z * q.zz,
            C = q.C,
            r = Math.hypot(X, Z);
          if (r > C.out + 46) continue;
          let d = r - C.plazaR;
          if (r < C.wall - C.thick / 2)
            for (const Rr of C.rings)
              d = Math.min(d, Math.abs(r - Rr) - C.ringW);
          for (const A of C.ang) {
            const t = X * Math.cos(A) + Z * Math.sin(A);
            if (t < C.plazaR - 2) continue;
            const n = Math.abs(-X * Math.sin(A) + Z * Math.cos(A));
            d = Math.min(d, n - (t > C.out ? 2.2 : C.avW));
          }
          // (the city that fell: its paving broken, the grass through it; so too in a quarter nobody lives in any more)
          if (
            d < 0 &&
            (q.ct.old ||
              (C.emptyQ >= 0 &&
                r > C.plazaR + 6 &&
                citySector(C, Math.atan2(Z, X)) === C.emptyQ)) &&
            hash01(Math.floor(X / 2.2), Math.floor(Z / 2.2), 913) <
              (q.ct.old ? 0.38 : 0.3)
          )
            d = 1;
          best = Math.min(best, d);
        }
        return best;
      };
      f.inner = inner;
      return f;
    },
    // the world's great city (and the one that fell, once the places know where): where, and its plan's measure
    cityList() {
      const L = [],
        st = this.story;
      if (!st.city) return L;
      if (st.city.state !== "fallen") {
        const s = st.settlements.find((t) => t.id === st.city.town);
        if (s) {
          const plan = s._plan || (s._plan = townPlan(st, s));
          L.push({ dir: s.dir, C: plan.city, old: false });
        }
      } else if (this.siteIx && this.siteIx.deadCity) {
        const s = this.siteIx.settle(this.siteIx.deadCity);
        if (s) L.push({ dir: s.dir, C: sitePlan(st, s).city, old: true });
      }
      return L;
    },
  });

  // ---- view/dayview.js ----
  // ============================================================
  // DAY VIEW — what kind of day it is in a town near you, laid over it: the
  // market's stalls and its traders, a wedding before the hall, a bier on the
  // square with the mourners round it, a house on fire with the bucket line
  // from the well, the flags and the fire and the dancers of a feast day, a
  // caravan camped by the road in. Built when you come near on that day and
  // taken down when the day changes; its people are there in its hours.
  // (What kind of day it is: story/townday.js.)
  // ============================================================

