// index-inline-2 92 — pat
// Lines 43890-45742 of readable/index-inline-2.pretty.js (statement-aligned).
  Object.assign(GroundView.prototype, {
    pvRowsGet() {
      if (this.pvRows && this.pvRowsFor === this.ramps) return this.pvRows;
      this.pvRowsFor = this.ramps;
      this.pvRows = Object.fromEntries(
        Object.entries(PV_COLS).map(([k, c]) => [k, this.row(c)]),
      );
      return this.pvRows;
    },
    // a place's people's colours (their roofs, their banners)
    pvKitRows(v) {
      return this.styleKit(v.plan.style).rows;
    },

    // the pieces of the newer places (called from propInto for what it does not know)
    morePropInto(mb, pr, y0, c, h) {
      const { rows, col, boxes, hAt, base } = c,
        R2 = this.pvRowsGet();
      const { at, obox, post, x, z, cs, sn } = h;
      switch (pr.t) {
        // ---------- your field and your pen (view/farmview.js) ----------
        case "myfield":
        case "mypen":
          this.farmPropInto(mb, pr, y0, c, h);
          break;
        case "mywell":
        case "myhives":
        case "mystable":
        case "palisade":
          this.yardPropInto(mb, pr, y0, c, h);
          break;
        // ---------- the great city's pieces (view/cityview.js) ----------
        case "fountain":
        case "stonepile":
        case "crane":
        case "scaffold":
        case "rubblemound":
        case "ruintower":
        case "coffer":
        case "ruintree":
        case "citywalls":
          this.cityPropInto(mb, pr, y0, c, h);
          break;
        // ---------- a windmill ----------
        case "windmill": {
          const n = 12,
            H = pr.h,
            r0 = pr.r0,
            r1 = r0 * 0.66;
          const body = pr.stone ? R2.whitewash : R2.millWood,
            pat = pr.stone ? PAT.PLASTER : PAT.PLANK;
          const radAt = (y) =>
            r0 +
            (r1 - r0) * Math.max(0, Math.min(1, (y - (y0 - 0.6)) / (H + 0.6)));
          mb.prism(at(0, y0 - 0.6, 0), at(0, y0 + H, 0), r0, r1, n, body, pat);
          // a stone footing, a door at the front, windows up the sides
          mb.prism(
            at(0, y0 - 0.6, 0),
            at(0, y0 + 0.5, 0),
            r0 + 0.12,
            r0 + 0.08,
            n,
            rows.stone,
            PAT.STONE,
          );
          const dr = radAt(y0 + 1) + 0.04;
          mb.quad(
            at(-0.55, y0 + 0.1, dr),
            at(0.55, y0 + 0.1, dr),
            at(0.55, y0 + 2.1, dr - 0.06),
            at(-0.55, y0 + 2.1, dr - 0.06),
            rows.woodDark,
            PAT.DOOR,
          );
          for (const [a, yy] of [
            [Math.PI / 2, 0.45],
            [-Math.PI / 2, 0.62],
            [Math.PI, 0.5],
            [0.4, 0.78],
          ]) {
            const yw = y0 + H * yy,
              rr = radAt(yw) + 0.03,
              ca = Math.sin(a),
              sa = Math.cos(a);
            const P = (u, yv) => at(ca * rr + sa * u, yv, sa * rr - ca * u);
            mb.quad(
              P(-0.32, yw),
              P(0.32, yw),
              P(0.32, yw + 0.7),
              P(-0.32, yw + 0.7),
              rows.char,
              PAT.NONE,
            );
          }
          // the cap, and the axle out of the front of it
          mb.cone(
            at(0, y0 + H - 0.05, 0),
            y0 + H + r1 * 1.35,
            r1 * 1.2,
            n,
            rows.woodDark,
            PAT.SLATE,
            null,
            0.12,
          );
          mb.prism(
            at(0, y0 + H - 0.35, r1 * 0.5),
            at(0, y0 + H - 0.35, r1 + SAIL_HUB),
            0.16,
            0.14,
            6,
            rows.woodDark,
            PAT.BARK,
            null,
            0,
            true,
          );
          col.push(x, z, r0 + 0.1, base + y0 - 0.6, base + y0 + H + 1, 1);
          // the sails: their own mesh, turning about the axle
          const L = Math.min(7.5, H * 0.66),
            sm = new MeshBuf();
          for (let k = 0; k < 4; k++) {
            const a = (k * Math.PI) / 2 + 0.3,
              dx = Math.cos(a),
              dy = Math.sin(a),
              px = -dy,
              py = dx;
            sm.prism(
              [0, 0, 0.05],
              [dx * L, dy * L, 0.05],
              0.07,
              0.05,
              4,
              rows.woodDark,
              PAT.BARK,
            );
            const A = (s, o) => [dx * s * L + px * o, dy * s * L + py * o, 0];
            sm.quad(
              A(0.22, 0.06),
              A(1, 0.06),
              A(1, 1.05),
              A(0.22, 0.92),
              R2.sailcloth,
              PAT.CLOTH,
            );
            sm.quad(
              A(1, 0.06),
              A(0.22, 0.06),
              A(0.22, 0.92),
              A(1, 1.05),
              R2.sailcloth,
              PAT.CLOTH,
            );
            // the lattice the cloth is laced to
            for (let q = 0; q <= 5; q++) {
              const s = 0.22 + (q / 5) * 0.78;
              sm.prism(
                [...A(s, 0)].map((v2, i) => (i === 2 ? 0.08 : v2)),
                [...A(s, 1.0 + 0.1 * (q / 5))].map((v2, i) =>
                  i === 2 ? 0.08 : v2,
                ),
                0.025,
                0.025,
                3,
                rows.wood,
                PAT.NONE,
              );
            }
            sm.prism(
              [...A(0.22, 1.0)].map((v2, i) => (i === 2 ? 0.08 : v2)),
              [...A(1, 1.1)].map((v2, i) => (i === 2 ? 0.08 : v2)),
              0.03,
              0.03,
              3,
              rows.wood,
              PAT.NONE,
            );
          }
          sm.box(
            -0.24,
            -0.24,
            -0.05,
            0.24,
            0.24,
            0.25,
            rows.woodDark,
            PAT.NONE,
          );
          this.syncRamps();
          const mesh = this.meshOf(sm.finish(), this.solidMat);
          mesh.matrixAutoUpdate = false;
          mesh.frustumCulled = false;
          c.extra.push(mesh);
          const hub = at(0, y0 + H - 0.35, r1 + SAIL_HUB);
          c.v.sails = {
            mesh,
            hub,
            rot: pr.rot || 0,
            ang: ((pr.seed || 1) % 628) / 100,
            spin: 0.4,
          };
          break;
        }
        case "sacks": {
          const rnd = mulberry32(hashInt((x * 10) | 0, (z * 10) | 0, 23));
          for (let k = 0; k < 5; k++) {
            const a = k * 1.3 + rnd(),
              r = k ? 0.42 : 0,
              yy = k === 4 ? 0.42 : 0;
            lumpInto(
              mb,
              x + Math.cos(a) * r,
              y0 - 0.05 + yy,
              z + Math.sin(a) * r,
              0.3,
              0.32,
              0.26,
              R2.sailcloth,
              rows.cloth,
              hashInt(k, 5, 61),
              a,
            );
          }
          col.push(x, z, 0.7, base + y0 - 0.1, base + y0 + 0.75, 2);
          break;
        }
        case "cart": {
          const L = 2.0,
            W = 1.15,
            wr = 0.5,
            by = y0 + wr + 0.08;
          obox(
            0,
            0,
            by,
            W / 2,
            0.42,
            L / 2,
            pr.rot,
            0,
            1,
            rows.wood,
            PAT.PLANK,
          );
          for (const su of [-1, 1]) {
            mb.prism(
              at(su * (W / 2 + 0.02), y0 + wr, 0.1),
              at(su * (W / 2 + 0.16), y0 + wr, 0.1),
              wr,
              wr,
              10,
              rows.woodDark,
              PAT.NONE,
              null,
              0,
              true,
            );
            mb.prism(
              at(su * 0.4, by + 0.1, L / 2),
              at(su * 0.32, y0 + 0.22, L / 2 + 1.5),
              0.04,
              0.04,
              4,
              rows.woodDark,
              PAT.BARK,
            );
          }
          const rnd = mulberry32(hashInt((x * 10) | 0, (z * 10) | 0, 29));
          if (pr.load === "sacks")
            for (let k = 0; k < 3; k++)
              lumpInto(
                mb,
                ...(() => {
                  const q = at((k - 1) * 0.34, 0, (rnd() - 0.5) * 0.6);
                  return [q[0], by + 0.4, q[2]];
                })(),
                0.24,
                0.24,
                0.2,
                R2.sailcloth,
                rows.cloth,
                hashInt(k, 7, 31),
                k,
              );
          if (pr.load === "ore")
            for (let k = 0; k < 6; k++)
              lumpInto(
                mb,
                ...(() => {
                  const q = at((rnd() - 0.5) * 0.7, 0, (rnd() - 0.5) * 1.3);
                  return [q[0], by + 0.32 + rnd() * 0.1, q[2]];
                })(),
                0.2,
                0.15,
                0.18,
                k % 2 ? R2.ore : rows.rust,
                rows.stone,
                hashInt(k, 9, 37),
                k,
              );
          boxes.push({ x, z, hx: W / 2 + 0.22, hz: L / 2 + 0.15, cs, sn });
          break;
        }
        // ---------- by the sea ----------
        case "fishrack": {
          for (const u of [-1.2, 1.2])
            for (const w of [-0.5, 0.5])
              mb.prism(
                at(u, y0 - 0.1, w),
                at(u, y0 + 1.75, 0),
                0.04,
                0.035,
                4,
                rows.wood,
                PAT.BARK,
              );
          mb.prism(
            at(-1.35, y0 + 1.7, 0),
            at(1.35, y0 + 1.7, 0),
            0.04,
            0.04,
            4,
            rows.wood,
            PAT.BARK,
          );
          for (let k = 0; k < 7; k++) {
            const u = -0.95 + k * 0.32,
              top = y0 + 1.66,
              len = 0.38 + (k % 3) * 0.06;
            const a = at(u - 0.06, top - len * 0.3, 0.01),
              b = at(u, top, 0.01),
              c2 = at(u + 0.06, top - len * 0.3, 0.01),
              d = at(u, top - len, 0.01);
            mb.quad(d, c2, b, a, k % 2 ? R2.fish : R2.fishDark, PAT.NONE);
            mb.quad(a, b, c2, d, k % 2 ? R2.fish : R2.fishDark, PAT.NONE);
          }
          boxes.push({ x, z, hx: 1.3, hz: 0.55, cs, sn });
          break;
        }
        case "nets": {
          const us = [-1.7, 0, 1.7];
          for (const u of us) {
            mb.prism(
              at(u, y0 - 0.2, 0),
              at(u, y0 + 2.0, 0),
              0.05,
              0.045,
              4,
              rows.woodDark,
              PAT.BARK,
            );
            const q = at(u, 0, 0);
            col.push(q[0], q[2], 0.1, base + y0 - 0.2, base + y0 + 2, 1);
          }
          for (let k = 0; k < 2; k++) {
            const u0 = us[k],
              u1 = us[k + 1],
              N = 6;
            for (let j = 0; j < N; j++) {
              const t0 = j / N,
                t1 = (j + 1) / N,
                sag = (t) => Math.sin(t * Math.PI) * 0.45;
              const ua = u0 + (u1 - u0) * t0,
                ub = u0 + (u1 - u0) * t1;
              const A = at(ua, y0 + 1.9 - sag(t0) * 0.4, 0.02),
                B2 = at(ub, y0 + 1.9 - sag(t1) * 0.4, 0.02),
                C = at(ub, y0 + 0.55 - sag(t1), 0.08),
                D = at(ua, y0 + 0.55 - sag(t0), 0.08);
              mb.quad(D, C, B2, A, R2.net, PAT.CLOTH, null, { lv: -0.2 });
              mb.quad(A, B2, C, D, R2.net, PAT.CLOTH, null, { lv: -0.2 });
            }
          }
          break;
        }
        case "boat":
          this.boatInto(mb, pr, y0, c, h);
          break;
        case "jetty": {
          // planks on posts from the shore out over the water, at a height above the sea that suits both ends
          // (the prop is the jetty's middle; it runs from the shore at -len/2 out to +len/2)
          const L = pr.len,
            W = pr.w || 1.8,
            sea = -base;
          const s0 = at(0, 0, -L / 2),
            g0 = hAt(s0[0], s0[2]);
          const deck = Math.max(g0 + 0.32, sea + 0.95);
          obox(
            0,
            0,
            deck - 0.14,
            W / 2,
            0.14,
            L / 2,
            pr.rot,
            0,
            1,
            rows.wood,
            PAT.PLANK,
            null,
          );
          const nP = Math.max(2, Math.round(L / 2.6));
          for (let k = 0; k <= nP; k++)
            for (const su of [-1, 1]) {
              const w = -L / 2 + (k * L) / nP,
                q = at(su * (W / 2 - 0.05), 0, w),
                gy = hAt(q[0], q[2]);
              mb.prism(
                [q[0], Math.min(gy, sea) - 0.6, q[2]],
                [q[0], deck + 0.05, q[2]],
                0.09,
                0.08,
                5,
                rows.woodDark,
                PAT.BARK,
              );
              col.push(
                q[0],
                q[2],
                0.1,
                base + Math.min(gy, sea) - 0.6,
                base + deck - 0.05,
                1,
              );
            }
          // a bollard or two at the end, for the ropes
          for (const su of [-0.6, 0.6]) {
            const q = at(su, 0, L / 2 - 0.4);
            mb.prism(
              [q[0], deck, q[2]],
              [q[0], deck + 0.45, q[2]],
              0.1,
              0.09,
              6,
              rows.woodDark,
              PAT.NONE,
              null,
              0,
              true,
            );
          }
          boxes.push({
            x,
            z,
            hx: W / 2,
            hz: L / 2,
            cs,
            sn,
            top: base + deck,
            lift: true,
            walk: true,
          });
          break;
        }
        case "bell": {
          mb.prism(
            at(0, y0 - 0.3, 0),
            at(0, y0 + 2.2, 0),
            0.07,
            0.06,
            4,
            rows.woodDark,
            PAT.BARK,
          );
          mb.prism(
            at(0, y0 + 2.1, 0),
            at(0, y0 + 2.1, 0.55),
            0.04,
            0.04,
            4,
            rows.woodDark,
            PAT.BARK,
          );
          mb.prism(
            at(0, y0 + 2.08, 0.5),
            at(0, y0 + 1.72, 0.5),
            0.05,
            0.16,
            8,
            R2.bronze,
            PAT.NONE,
            null,
            0,
            true,
          );
          post(0.12);
          c.v.lights.push(
            (() => {
              const q = at(0, y0 + 2.3, 0.1);
              return { x: q[0], y: q[1], z: q[2], kind: "hang" };
            })(),
          );
          break;
        }
        case "lighthouse":
          this.lighthouseInto(mb, pr, y0, c, h);
          break;
        // ---------- under the hills ----------
        case "minedoor": {
          // two posts and a lintel at the way in, braced; a second frame a little way inside
          const W = pr.w,
            Hh = pr.h;
          for (const d of [0.25, -1.4]) {
            for (const su of [-1, 1])
              obox(
                ...(() => {
                  const q = at(su * (W / 2 - 0.1), 0, d);
                  return [q[0] - x, q[2] - z];
                })(),
                y0 - 0.3,
                0.13,
                Hh + 0.3,
                0.13,
                pr.rot,
                0,
                1,
                R2.timber,
                PAT.BARK,
              );
            const q = at(0, 0, d);
            obox(
              q[0] - x,
              q[2] - z,
              y0 + Hh - 0.05,
              W / 2 + 0.2,
              0.26,
              0.15,
              pr.rot,
              0,
              1,
              R2.timber,
              PAT.BARK,
            );
          }
          for (const su of [-1, 1]) {
            const q = at(su * (W / 2 - 0.1), 0, 0.25);
            col.push(q[0], q[2], 0.15, base + y0 - 0.3, base + y0 + Hh, 1);
          }
          break;
        }
        case "rails": {
          const L = pr.len;
          for (const su of [-0.42, 0.42]) {
            let prev = null;
            for (let k = 0; k <= 6; k++) {
              const w = -L / 2 + (k * L) / 6,
                q = at(su, 0, w),
                gy = hAt(q[0], q[2]) + 0.12;
              const p2 = [q[0], gy, q[2]];
              if (prev) mb.prism(prev, p2, 0.035, 0.035, 4, R2.rail, PAT.NONE);
              prev = p2;
            }
          }
          for (let k = 0; k <= 8; k++) {
            const w = -L / 2 + (k * L) / 8,
              a = at(-0.62, 0, w),
              b = at(0.62, 0, w),
              gy = hAt(a[0], a[2]) + 0.04;
            mb.prism(
              [a[0], gy, a[2]],
              [b[0], gy, b[2]],
              0.06,
              0.06,
              4,
              R2.timber,
              PAT.BARK,
            );
          }
          break;
        }
        case "spoil": {
          const rnd = mulberry32(pr.seed || 1);
          lumpInto(
            mb,
            x,
            y0 - 0.5,
            z,
            pr.r,
            pr.r * 0.55,
            pr.r * 0.85,
            R2.spoil,
            rows.stoneDark,
            pr.seed || 1,
            rnd() * 6,
          );
          for (let k = 0; k < 8; k++) {
            const a = rnd() * 6.28,
              r = pr.r * (0.8 + rnd() * 0.5);
            lumpInto(
              mb,
              x + Math.cos(a) * r,
              hAt(x + Math.cos(a) * r, z + Math.sin(a) * r) - 0.08,
              z + Math.sin(a) * r,
              0.18 + rnd() * 0.2,
              0.12 + rnd() * 0.12,
              0.16 + rnd() * 0.2,
              rnd() < 0.3 ? R2.ore : R2.spoil,
              rows.stone,
              hashInt(k, 41, pr.seed || 1),
              a,
            );
          }
          col.push(
            x,
            z,
            pr.r * 0.8,
            base + y0 - 0.5,
            base + y0 + pr.r * 0.5,
            2,
          );
          break;
        }
        // ---------- on the road ----------
        case "watchtower":
          this.watchtowerInto(mb, pr, y0, c, h);
          break;
        // ---------- holy ground ----------
        case "temple":
          this.templeInto(mb, pr, y0, c, h);
          break;
        case "idol":
          this.idolInto(mb, pr, y0, c, h);
          break;
        case "brazier": {
          for (let k = 0; k < 3; k++) {
            const a = (k / 3) * 6.283;
            mb.prism(
              [x + Math.cos(a) * 0.4, y0 - 0.1, z + Math.sin(a) * 0.4],
              [x + Math.cos(a) * 0.22, y0 + 0.85, z + Math.sin(a) * 0.22],
              0.035,
              0.03,
              4,
              R2.iron,
              PAT.NONE,
            );
          }
          mb.prism(
            [x, y0 + 0.8, z],
            [x, y0 + 1.05, z],
            0.22,
            0.42,
            8,
            R2.iron,
            PAT.NONE,
            null,
            0,
            true,
          );
          for (let k = 0; k < 4; k++) {
            const a = k * 1.7,
              r = k ? 0.13 : 0;
            mb.cone(
              [x + Math.cos(a) * r, y0 + 1.0, z + Math.sin(a) * r],
              y0 + 1.45 + (k ? 0 : 0.2),
              0.15,
              5,
              rows.flame,
              PAT.FLAME,
              null,
              0,
              0,
              a,
            );
          }
          post(0.45);
          c.v.lights.push({ x, y: y0 + 1.3, z, kind: "brazier" });
          break;
        }
      }
    },

    // ---------- a boat: a hull of planks, pointed at both ends, a seat or two (a ferry: wide, with a mast) ----------
    boatInto(mb, pr, y0, c, h) {
      const { rows, boxes, base } = c,
        R2 = this.pvRowsGet(),
        { at, x, z, cs, sn } = h;
      const L = pr.len,
        W = pr.big ? 2.3 : 1.35,
        D = pr.big ? 0.8 : 0.55;
      const sea = -base,
        yb = pr.afloat ? Math.max(y0 - 0.2, sea - D * 0.4) : y0 + 0.04;
      const N = 10,
        secs = [];
      for (let i = 0; i <= N; i++) {
        const t = i / N,
          w = -L / 2 + t * L,
          f = Math.pow(Math.max(0, Math.sin(Math.PI * t)), 0.62);
        const hw = (W / 2) * Math.max(0.04, f),
          hb = hw * 0.5,
          g = D + 0.2 * Math.pow(2 * t - 1, 2);
        secs.push({
          GL: at(-hw, yb + g, w),
          BL: at(-hb, yb, w),
          BR: at(hb, yb, w),
          GR: at(hw, yb + g, w),
          IL: at(-hw + 0.06, yb + g, w),
          IR: at(hw - 0.06, yb + g, w),
        });
      }
      const paint = pr.big ? R2.hullPaint : R2.hull;
      for (let i = 0; i < N; i++) {
        const a = secs[i],
          b = secs[i + 1];
        mb.quad(a.BL, b.BL, b.GL, a.GL, R2.hull, PAT.PLANK);
        mb.quad(b.BR, a.BR, a.GR, b.GR, R2.hull, PAT.PLANK);
        mb.quad(a.BR, b.BR, b.BL, a.BL, R2.hullDark, PAT.PLANK, null, {
          lv: -0.4,
        });
        // a painted strake along the top
        mb.quad(a.GL, b.GL, b.IL, a.IL, paint, PAT.NONE);
        mb.quad(b.GR, a.GR, a.IR, b.IR, paint, PAT.NONE);
      }
      // seats across it
      for (const t of pr.big ? [0.3, 0.5, 0.7] : [0.35, 0.65]) {
        const w = -L / 2 + t * L,
          f = Math.pow(Math.sin(Math.PI * t), 0.62),
          hw = (W / 2) * f - 0.08;
        const q0 = at(-hw, yb + D * 0.62, w - 0.14),
          q1 = at(hw, yb + D * 0.62, w + 0.14);
        mb.box(
          Math.min(q0[0], q1[0]),
          yb + D * 0.55,
          Math.min(q0[2], q1[2]),
          Math.max(q0[0], q1[0]),
          yb + D * 0.65,
          Math.max(q0[2], q1[2]),
          rows.wood,
          PAT.PLANK,
        );
      }
      if (pr.big) {
        // a stubby mast with its sail furled, and a steering oar over the stern
        mb.prism(
          at(0, yb + 0.3, L * 0.12),
          at(0, yb + 4.2, L * 0.12),
          0.08,
          0.06,
          6,
          rows.woodDark,
          PAT.BARK,
        );
        mb.prism(
          at(-0.05, yb + 3.4, L * 0.12 - 0.3),
          at(-0.05, yb + 3.4, L * 0.12 + 1.8),
          0.13,
          0.1,
          6,
          R2.sailcloth,
          PAT.CLOTH,
          null,
          0,
          true,
        );
        mb.prism(
          at(0.3, yb + D + 0.6, -L / 2 - 0.2),
          at(0.45, yb - 0.3, -L / 2 - 0.9),
          0.04,
          0.05,
          4,
          rows.woodDark,
          PAT.BARK,
        );
      } else {
        // oars shipped along the seats
        for (const su of [-0.25, 0.25])
          mb.prism(
            at(su, yb + D * 0.7, -L * 0.35),
            at(su * 1.3, yb + D * 0.72, L * 0.4),
            0.03,
            0.03,
            4,
            rows.wood,
            PAT.NONE,
          );
      }
      boxes.push({ x, z, hx: W / 2 + 0.05, hz: L / 2 - 0.2, cs, sn });
    },

    // ---------- a lighthouse ----------
    lighthouseInto(mb, pr, y0, c, h) {
      const { rows, col, base } = c,
        R2 = this.pvRowsGet(),
        { at, x, z } = h;
      const n = 14,
        r = pr.r,
        H = pr.h,
        top = r * 0.72;
      const band = this.row(pr.band || [176, 52, 44]);
      const radAt = (t) => r + (top - r) * t;
      // the tower, white, tapering, banded
      const bands = [0.22, 0.5, 0.78];
      let prevT = 0;
      const seg = (t0, t1, row) =>
        mb.prism(
          at(0, y0 - 0.6 + (H + 0.6) * t0, 0),
          at(0, y0 - 0.6 + (H + 0.6) * t1, 0),
          radAt(t0),
          radAt(t1),
          n,
          row,
          row === band ? PAT.NONE : PAT.PLASTER,
        );
      for (const b of bands) {
        seg(prevT, b, R2.lightBody);
        seg(b, b + 0.08, band);
        prevT = b + 0.08;
      }
      seg(prevT, 1, R2.lightBody);
      // the door (turned inland), small windows up the stair
      const dr = radAt(0.08) + 0.04;
      mb.quad(
        at(-0.5, y0, dr),
        at(0.5, y0, dr),
        at(0.5, y0 + 2.05, dr - 0.03),
        at(-0.5, y0 + 2.05, dr - 0.03),
        rows.woodDark,
        PAT.DOOR,
      );
      for (const t of [0.35, 0.62, 0.86]) {
        const a = t * 9,
          yw = y0 - 0.6 + (H + 0.6) * t,
          rr = radAt(t) + 0.03,
          ca = Math.sin(a),
          sa = Math.cos(a);
        const P = (u, yv) => at(ca * rr + sa * u, yv, sa * rr - ca * u);
        mb.quad(
          P(-0.22, yw),
          P(0.22, yw),
          P(0.22, yw + 0.55),
          P(-0.22, yw + 0.55),
          rows.char,
          PAT.NONE,
        );
      }
      // the gallery: a floor out past the wall, a rail round it
      const gr = top + 0.75,
        gy = y0 + H;
      mb.prism(
        at(0, gy - 0.25, 0),
        at(0, gy, 0),
        top + 0.2,
        gr,
        n,
        R2.iron,
        PAT.NONE,
        null,
        0,
        true,
      );
      for (let k = 0; k < 16; k++) {
        const a0 = (k / 16) * 6.283,
          a1 = ((k + 1) / 16) * 6.283;
        const p0 = at(
            Math.cos(a0) * (gr - 0.06),
            gy,
            Math.sin(a0) * (gr - 0.06),
          ),
          p1 = at(Math.cos(a1) * (gr - 0.06), gy, Math.sin(a1) * (gr - 0.06));
        mb.prism(
          p0,
          [p0[0], gy + 1.0, p0[2]],
          0.025,
          0.025,
          3,
          R2.iron,
          PAT.NONE,
        );
        mb.prism(
          [p0[0], gy + 1.0, p0[2]],
          [p1[0], gy + 1.0, p1[2]],
          0.03,
          0.03,
          3,
          R2.iron,
          PAT.NONE,
        );
        mb.prism(
          [p0[0], gy + 0.5, p0[2]],
          [p1[0], gy + 0.5, p1[2]],
          0.02,
          0.02,
          3,
          R2.iron,
          PAT.NONE,
        );
      }
      // the lamp room: glass all round, the lamp burning inside it, a domed roof and a vane
      const lr = top * 0.78,
        lh = 1.9;
      mb.prism(
        at(0, gy, 0),
        at(0, gy + 0.45, 0),
        lr,
        lr,
        10,
        R2.iron,
        PAT.NONE,
      );
      mb.prism(
        at(0, gy + 0.45, 0),
        at(0, gy + lh, 0),
        lr,
        lr,
        10,
        R2.glass,
        PAT.LAMP,
        { row2: R2.lampGlow },
      );
      mb.cone(
        at(0, gy + lh, 0),
        gy + lh + lr * 1.1,
        lr * 1.15,
        10,
        band,
        PAT.NONE,
        null,
        0.05,
      );
      mb.prism(
        at(0, gy + lh + lr * 1.05, 0),
        at(0, gy + lh + lr * 1.05 + 0.7, 0),
        0.03,
        0.02,
        3,
        R2.iron,
        PAT.NONE,
      );
      mb.box(
        x - 0.32,
        gy + 0.6,
        z - 0.32,
        x + 0.32,
        gy + 1.35,
        z + 0.32,
        R2.lampGlow,
        PAT.GLOW,
        { row2: R2.lampGlow },
      );
      c.v.lights.push({ x, y: gy + 1.0, z, kind: "fire" });
      // you stand on the gallery; the lamp room and the rail keep you on it
      col.push(x, z, gr, base + y0 - 0.6, base + gy, 3);
      col.push(x, z, lr + 0.05, base + gy, base + gy + lh + 0.5, 1);
      // (the rail's posts close enough together that nobody slips between them)
      for (let k = 0; k < 32; k++) {
        const a = (k / 32) * 6.283,
          q = at(Math.cos(a) * (gr + 0.12), 0, Math.sin(a) * (gr + 0.12));
        col.push(q[0], q[2], 0.28, base + gy - 0.05, base + gy + 1.1, 1);
      }
      // (up there: you come out of the hatch on the landward side and look out over the sea)
      const land = at(0, 0, (lr + gr) / 2 + 0.05),
        sea = at(0, 0, -((lr + gr) / 2 + 0.05)),
        hatch = at(0.7, 0, (lr + gr) / 2 + 0.05);
      c.v.towerTop = {
        alt: base + gy,
        r: gr,
        land: [land[0], land[2]],
        view: [sea[0], sea[2]],
        down: [hatch[0], hatch[2]],
      };
    },

    // ---------- a watchtower of timber ----------
    watchtowerInto(mb, pr, y0, c, h) {
      const { rows, col, base } = c,
        R2 = this.pvRowsGet(),
        { at, x, z } = h;
      const H = pr.h,
        w0 = 1.55,
        w1 = 1.2,
        ph = H;
      // four legs, leaning in; braces across them
      const leg = (su, sw, yy) =>
        at(
          su * (w0 + (w1 - w0) * (yy / ph)),
          y0 + yy,
          sw * (w0 + (w1 - w0) * (yy / ph)),
        );
      for (const su of [-1, 1])
        for (const sw of [-1, 1]) {
          mb.prism(
            leg(su, sw, -0.4),
            leg(su, sw, ph + 2.15),
            0.11,
            0.09,
            4,
            R2.timber,
            PAT.BARK,
          );
          const q = leg(su, sw, 0);
          col.push(q[0], q[2], 0.14, base + y0 - 0.4, base + y0 + ph, 1);
        }
      for (const yy of [ph * 0.3, ph * 0.65])
        for (const [a, b] of [
          [
            [-1, -1],
            [1, -1],
          ],
          [
            [1, -1],
            [1, 1],
          ],
          [
            [1, 1],
            [-1, 1],
          ],
          [
            [-1, 1],
            [-1, -1],
          ],
        ]) {
          mb.prism(
            leg(a[0], a[1], yy),
            leg(b[0], b[1], yy + ph * 0.18),
            0.05,
            0.05,
            4,
            R2.timber,
            PAT.BARK,
          );
        }
      // the platform, a rail round it, a little roof over it
      const P0 = at(-w1 - 0.25, 0, -w1 - 0.25),
        P1 = at(w1 + 0.25, 0, w1 + 0.25);
      mb.box(
        Math.min(P0[0], P1[0]),
        y0 + ph - 0.18,
        Math.min(P0[2], P1[2]),
        Math.max(P0[0], P1[0]),
        y0 + ph,
        Math.max(P0[2], P1[2]),
        rows.wood,
        PAT.PLANK,
      );
      for (const [a, b] of [
        [
          [-1, -1],
          [1, -1],
        ],
        [
          [1, -1],
          [1, 1],
        ],
        [
          [1, 1],
          [-1, 1],
        ],
        [
          [-1, 1],
          [-1, -1],
        ],
      ]) {
        const A = at(a[0] * (w1 + 0.2), y0 + ph + 0.95, a[1] * (w1 + 0.2)),
          B2 = at(b[0] * (w1 + 0.2), y0 + ph + 0.95, b[1] * (w1 + 0.2));
        mb.prism(A, B2, 0.045, 0.045, 4, R2.timber, PAT.BARK);
      }
      mb.cone(
        at(0, y0 + ph + 2.1, 0),
        y0 + ph + 3.0,
        (w1 + 0.5) * 1.42,
        4,
        rows.woodDark,
        PAT.THATCH,
        null,
        0.15,
        0,
        0.125,
      );
      // a ladder up the front
      const l0 = at(-0.3, y0 - 0.1, w0 + 0.35),
        l1 = at(-0.3, y0 + ph, w1 + 0.12),
        l2 = at(0.3, y0 - 0.1, w0 + 0.35),
        l3 = at(0.3, y0 + ph, w1 + 0.12);
      mb.prism(l0, l1, 0.035, 0.035, 4, rows.wood, PAT.NONE);
      mb.prism(l2, l3, 0.035, 0.035, 4, rows.wood, PAT.NONE);
      for (let k = 1; k < Math.floor(ph / 0.4); k++) {
        const t = (k * 0.4) / ph,
          a = [
            l0[0] + (l1[0] - l0[0]) * t,
            l0[1] + (l1[1] - l0[1]) * t,
            l0[2] + (l1[2] - l0[2]) * t,
          ],
          b = [
            l2[0] + (l3[0] - l2[0]) * t,
            l2[1] + (l3[1] - l2[1]) * t,
            l2[2] + (l3[2] - l2[2]) * t,
          ];
        mb.prism(a, b, 0.025, 0.025, 3, rows.wood, PAT.NONE);
      }
      // a fire basket in the corner for the night watch
      const fb = at(w1 - 0.35, 0, -w1 + 0.35);
      mb.prism(
        [fb[0], y0 + ph, fb[2]],
        [fb[0], y0 + ph + 0.8, fb[2]],
        0.04,
        0.04,
        4,
        R2.iron,
        PAT.NONE,
      );
      mb.prism(
        [fb[0], y0 + ph + 0.8, fb[2]],
        [fb[0], y0 + ph + 1.05, fb[2]],
        0.18,
        0.28,
        6,
        R2.iron,
        PAT.NONE,
      );
      for (let k = 0; k < 3; k++) {
        const a = k * 2.1;
        mb.cone(
          [
            fb[0] + Math.cos(a) * 0.08,
            y0 + ph + 1.02,
            fb[2] + Math.sin(a) * 0.08,
          ],
          y0 + ph + 1.4 + k * 0.06,
          0.1,
          5,
          rows.flame,
          PAT.FLAME,
          null,
          0,
          0,
          a,
        );
      }
      c.v.lights.push({
        x: fb[0],
        y: y0 + ph + 1.2,
        z: fb[2],
        kind: "brazier",
      });
      // you stand on the platform; the rail keeps you there
      col.push(x, z, w1 + 0.2, base + y0 + ph - 1.0, base + y0 + ph, 3);
      for (let k = 0; k < 32; k++) {
        const a = (k / 32) * 6.283,
          rr =
            (w1 + 0.45) /
            Math.max(Math.abs(Math.cos(a)), Math.abs(Math.sin(a))),
          q = at(Math.cos(a) * rr, 0, Math.sin(a) * rr);
        col.push(
          q[0],
          q[2],
          0.26,
          base + y0 + ph - 0.05,
          base + y0 + ph + 1.1,
          1,
        );
      }
      const land = at(-0.3, 0, 0.3),
        view = at(0, 0, -0.5),
        down = at(0, 0, w1 - 0.25);
      c.v.towerTop = {
        alt: base + y0 + ph,
        r: w1,
        land: [land[0], land[2]],
        view: [view[0], view[2]],
        down: [down[0], down[2]],
      };
    },

    // ---------- a holy place: a roof on pillars over the figure of what the people worship ----------
    templeInto(mb, pr, y0, c, h) {
      const { col, base, boxes } = c,
        { at, x, z, cs, sn } = h,
        K = this.pvKitRows(c.v);
      const W = pr.w,
        D = pr.d,
        ph = 3.1,
        arch = pr.arch;
      const stoneArch = ["stone", "salt", "ash", "frost"].includes(arch);
      const pil = stoneArch ? K.base : K.wood,
        pat = stoneArch ? PAT.STONE : PAT.BARK;
      // a raised floor of stone level with the highest of the ground under it, a step up to it at the front
      let lo = 1e9,
        hi = -1e9;
      for (const [u, w] of [
        [-1, -1],
        [1, -1],
        [1, 1],
        [-1, 1],
        [0, 0],
      ]) {
        const q = at(u * (W / 2 + 0.4), 0, w * (D / 2 + 0.4)),
          g = c.hAt(q[0], q[2]);
        lo = Math.min(lo, g);
        hi = Math.max(hi, g);
      }
      const fl = hi + 0.32;
      c.v.templeFloor = fl;
      y0 = fl - 0.32;
      const F0 = at(-W / 2 - 0.4, 0, -D / 2 - 0.4),
        F1 = at(W / 2 + 0.4, 0, D / 2 + 0.4);
      mb.box(
        Math.min(F0[0], F1[0]),
        lo - 0.4,
        Math.min(F0[2], F1[2]),
        Math.max(F0[0], F1[0]),
        fl,
        Math.max(F0[2], F1[2]),
        K.base,
        PAT.STONE,
      );
      const S0 = at(-W / 2 + 0.6, 0, D / 2 + 0.4),
        S1 = at(W / 2 - 0.6, 0, D / 2 + 0.85);
      const sg = c.hAt(
        ...(() => {
          const q = at(0, 0, D / 2 + 0.65);
          return [q[0], q[2]];
        })(),
      );
      mb.box(
        Math.min(S0[0], S1[0]),
        Math.min(sg, lo) - 0.3,
        Math.min(S0[2], S1[2]),
        Math.max(S0[0], S1[0]),
        Math.max(sg + 0.05, (sg + fl) / 2),
        Math.max(S0[2], S1[2]),
        K.base,
        PAT.STONE,
      );
      boxes.push({
        x,
        z,
        hx: W / 2 + 0.4,
        hz: D / 2 + 0.4,
        cs,
        sn,
        top: base + fl,
      });
      // pillars at the corners and along the sides, the back closed by a wall
      const nW = 3;
      for (let k = 0; k <= nW; k++)
        for (const sw of [-1, 1]) {
          const u = -W / 2 + (k * W) / nW,
            q = at(u, 0, (sw * D) / 2);
          if (sw < 0 && k > 0 && k < nW) continue;
          mb.prism(
            [q[0], y0 + 0.3, q[2]],
            [q[0], y0 + 0.32 + ph, q[2]],
            0.2,
            0.17,
            8,
            pil,
            pat,
          );
          col.push(q[0], q[2], 0.22, base + y0, base + y0 + ph, 1);
        }
      const Bk0 = at(-W / 2, 0, -D / 2 - 0.1),
        Bk1 = at(W / 2, 0, -D / 2 + 0.15);
      mb.box(
        Math.min(Bk0[0], Bk1[0]),
        y0 + 0.3,
        Math.min(Bk0[2], Bk1[2]),
        Math.max(Bk0[0], Bk1[0]),
        y0 + 0.32 + ph,
        Math.max(Bk0[2], Bk1[2]),
        stoneArch ? K.wall : K.wood,
        stoneArch ? PAT.STONE : PAT.PLANK,
      );
      boxes.push({
        x: (Bk0[0] + Bk1[0]) / 2,
        z: (Bk0[2] + Bk1[2]) / 2,
        hx: W / 2,
        hz: 0.14,
        cs,
        sn,
      });
      // the roof: a beam all round, then a steep roof in the people's colour, a finial at its peak
      const T0 = at(-W / 2 - 0.3, 0, -D / 2 - 0.3),
        T1 = at(W / 2 + 0.3, 0, D / 2 + 0.3);
      mb.box(
        Math.min(T0[0], T1[0]),
        y0 + 0.3 + ph,
        Math.min(T0[2], T1[2]),
        Math.max(T0[0], T1[0]),
        y0 + 0.62 + ph,
        Math.max(T0[2], T1[2]),
        K.wood,
        PAT.PLANK,
      );
      const ry = y0 + 0.62 + ph,
        rh = Math.min(W, D) * 0.55;
      const c0 = at(-W / 2 - 0.6, ry, -D / 2 - 0.6),
        c1 = at(W / 2 + 0.6, ry, -D / 2 - 0.6),
        c2 = at(W / 2 + 0.6, ry, D / 2 + 0.6),
        c3 = at(-W / 2 - 0.6, ry, D / 2 + 0.6);
      const r0 = at(-W * 0.2, ry + rh, 0),
        r1 = at(W * 0.2, ry + rh, 0);
      mb.quad(c3, c2, r1, r0, K.roof, PAT.TILE);
      mb.quad(c1, c0, r0, r1, K.roof, PAT.TILE);
      mb.tri(c0, c3, r0, K.roof, PAT.TILE);
      mb.tri(c2, c1, r1, K.roof, PAT.TILE);
      for (const q of [r0, r1])
        mb.cone(
          [q[0], q[1] - 0.05, q[2]],
          q[1] + 0.7,
          0.12,
          5,
          this.pvRowsGet().gilt,
          PAT.NONE,
        );
      // a bowl for offerings before the figure, and banners either side of the way in
      const bw = at(0, 0, 0.5);
      mb.prism(
        [bw[0], y0 + 0.32, bw[2]],
        [bw[0], y0 + 0.95, bw[2]],
        0.12,
        0.1,
        6,
        K.base,
        PAT.STONE,
      );
      mb.prism(
        [bw[0], y0 + 0.95, bw[2]],
        [bw[0], y0 + 1.12, bw[2]],
        0.2,
        0.34,
        8,
        this.pvRowsGet().bronze,
        PAT.NONE,
        null,
        0,
        true,
      );
      for (const su of [-1, 1]) {
        const q = at(su * (W / 2 + 0.7), 0, D / 2 + 0.9);
        mb.prism(
          [q[0], y0 - 0.3, q[2]],
          [q[0], y0 + 3.6, q[2]],
          0.05,
          0.04,
          4,
          K.wood,
          PAT.BARK,
        );
        const t2 = at(su * (W / 2 + 0.7), y0 + 3.4, D / 2 + 0.9),
          t3 = at(su * (W / 2 + 0.7) + su * 0.02, y0 + 1.6, D / 2 + 0.95);
        mb.quad(
          [t2[0] - 0.3 * cs, t2[1], t2[2] - 0.3 * sn],
          [t2[0] + 0.3 * cs, t2[1], t2[2] + 0.3 * sn],
          [t3[0] + 0.3 * cs, t3[1], t3[2] + 0.3 * sn],
          [t3[0] - 0.3 * cs, t3[1], t3[2] - 0.3 * sn],
          K.banner,
          PAT.CLOTH,
        );
        mb.quad(
          [t2[0] + 0.3 * cs, t2[1], t2[2] + 0.3 * sn],
          [t2[0] - 0.3 * cs, t2[1], t2[2] - 0.3 * sn],
          [t3[0] - 0.3 * cs, t3[1], t3[2] - 0.3 * sn],
          [t3[0] + 0.3 * cs, t3[1], t3[2] + 0.3 * sn],
          K.banner,
          PAT.CLOTH,
        );
        col.push(q[0], q[2], 0.08, base + y0 - 0.3, base + y0 + 3.6, 1);
      }
      // candles on the floor, lit
      for (const su of [-1, 1]) {
        const q = at(su * 0.8, 0, 0.6);
        mb.box(
          q[0] - 0.03,
          y0 + 0.32,
          q[2] - 0.03,
          q[0] + 0.03,
          y0 + 0.5,
          q[2] + 0.03,
          this.pvRowsGet().lampGlow,
          PAT.GLOW,
          { row2: this.pvRowsGet().lampGlow },
        );
        c.v.lights.push({ x: q[0], y: y0 + 0.6, z: q[2], kind: "candle" });
      }
    },
    // the figure of what they worship, on a plinth: a shape for each favour it gives
    idolInto(mb, pr, y0, c, h) {
      const { col, base } = c,
        R2 = this.pvRowsGet(),
        { at, x, z } = h,
        K = this.pvKitRows(c.v);
      const H = pr.h,
        shape = IDOL[pr.bless] || "eye";
      // (on the floor of the holy place it stands in)
      const yb = c.v.templeFloor ?? y0 + 0.32;
      mb.box(
        ...(() => {
          const a = at(-0.55, 0, -0.45),
            b = at(0.55, 0, 0.45);
          return [
            Math.min(a[0], b[0]),
            yb,
            Math.min(a[2], b[2]),
            Math.max(a[0], b[0]),
            yb + 0.55,
            Math.max(a[2], b[2]),
          ];
        })(),
        K.base,
        PAT.STONE,
      );
      const fy = yb + 0.55,
        body = ["mountain", "hearthfaith"].includes(pr.bless)
          ? K.base
          : R2.gilt,
        bpat = PAT.NONE;
      // a robed figure: a long body narrowing up to the shoulders, a head
      mb.prism(at(0, fy, 0), at(0, fy + H * 0.62, 0), 0.36, 0.2, 8, body, bpat);
      mb.prism(
        at(0, fy + H * 0.62, 0),
        at(0, fy + H * 0.8, 0),
        0.17,
        0.14,
        8,
        body,
        bpat,
        null,
        0,
        true,
      );
      const hy = fy + H * 0.8;
      switch (shape) {
        case "shell":
          for (let k = 0; k < 7; k++) {
            const a = -1.2 + k * 0.4,
              tip = at(Math.sin(a) * 0.55, hy + 0.1 + Math.cos(a) * 0.5, -0.08);
            mb.prism(
              at(0, hy + 0.05, -0.05),
              tip,
              0.06,
              0.02,
              3,
              R2.shell,
              PAT.NONE,
            );
          }
          break;
        case "eye": {
          const e0 = at(0, hy + 0.35, 0.06);
          mb.prism(
            [e0[0], e0[1], e0[2]],
            at(0, hy + 0.35, 0.16),
            0.32,
            0.3,
            12,
            R2.gilt,
            PAT.NONE,
            null,
            0,
            true,
          );
          const e1 = at(0, hy + 0.35, 0.17);
          mb.prism(
            [e1[0], e1[1], e1[2]],
            at(0, hy + 0.35, 0.2),
            0.1,
            0.1,
            8,
            K.roof,
            PAT.NONE,
            null,
            0,
            true,
          );
          break;
        }
        case "bowl": {
          const q = at(0, hy + 0.2, 0.3);
          mb.prism(
            [q[0], q[1], q[2]],
            [q[0], q[1] + 0.2, q[2]],
            0.12,
            0.3,
            8,
            R2.bronze,
            PAT.NONE,
            null,
            0,
            true,
          );
          for (const su of [-1, 1])
            mb.prism(
              at(su * 0.2, fy + H * 0.6, 0.05),
              at(su * 0.25, hy + 0.2, 0.28),
              0.05,
              0.05,
              4,
              body,
              bpat,
            );
          break;
        }
        case "face":
          mb.box(
            ...(() => {
              const a = at(-0.32, 0, -0.25),
                b = at(0.32, 0, 0.25);
              return [
                Math.min(a[0], b[0]),
                hy,
                Math.min(a[2], b[2]),
                Math.max(a[0], b[0]),
                hy + 0.7,
                Math.max(a[2], b[2]),
              ];
            })(),
            K.base,
            PAT.STONE,
          );
          break;
        case "flame":
          for (let k = 0; k < 4; k++) {
            const a = k * 1.6,
              r = k ? 0.1 : 0;
            mb.cone(
              at(Math.cos(a) * r, hy + 0.05, Math.sin(a) * r),
              hy + 0.65 + (k ? 0 : 0.25),
              0.16,
              5,
              c.rows.flame,
              PAT.FLAME,
              null,
              0,
              0,
              a,
            );
          }
          c.v.lights.push(
            (() => {
              const q = at(0, hy + 0.5, 0);
              return { x: q[0], y: q[1], z: q[2], kind: "brazier" };
            })(),
          );
          break;
        case "wings":
          for (const su of [-1, 1]) {
            const s0 = at(su * 0.12, fy + H * 0.7, -0.05),
              s1 = at(su * 0.95, fy + H * 1.05, -0.2),
              s2 = at(su * 0.7, fy + H * 0.35, -0.15);
            mb.tri(s0, s1, s2, R2.gilt, PAT.NONE);
            mb.tri(s0, s2, s1, R2.gilt, PAT.NONE);
          }
          break;
        case "horns":
          for (const su of [-1, 1]) {
            const b0 = at(su * 0.12, hy + 0.22, 0),
              m = at(su * 0.45, hy + 0.55, -0.05),
              t = at(su * 0.38, hy + 0.95, 0.05);
            mb.prism(b0, m, 0.06, 0.05, 4, R2.shell, PAT.NONE);
            mb.prism(m, t, 0.05, 0.015, 4, R2.shell, PAT.NONE);
          }
          break;
      }
      if (shape !== "face" && shape !== "flame")
        mb.prism(
          at(0, hy, 0),
          at(0, hy + 0.3, 0),
          0.15,
          0.13,
          8,
          body,
          bpat,
          null,
          0,
          true,
        );
      col.push(x, z, 0.6, base + yb, base + fy + H, 1);
    },
    // ---------- a wayside shrine, in its people's way (the plain post-and-box one is in siteview.js) ----------
    shrineInto(mb, pr, y0, c, h) {
      const { rows, base } = c,
        R2 = this.pvRowsGet(),
        { at, obox, post, x, z } = h;
      const rnd = mulberry32(pr.seed || 7);
      const candle = (u, y, w) => {
        const q = at(u, 0, w);
        mb.box(
          q[0] - 0.025,
          y,
          q[2] - 0.025,
          q[0] + 0.025,
          y + 0.13,
          q[2] + 0.025,
          rows.glow,
          PAT.GLOW,
          { row2: rows.glow },
        );
        c.v.lights.push({ x: q[0], y: y + 0.18, z: q[2], kind: "candle" });
      };
      switch (pr.look) {
        case "stele": {
          // a standing stone with a niche cut in it, a candle in the niche
          const P = obox(
            0,
            0,
            y0 - 0.3,
            0.5,
            2.0,
            0.22,
            pr.rot,
            0,
            0.82,
            rows.old,
            PAT.ROCK,
            { row2: rows.moss },
          );
          mb.quad(
            P(-0.2, 0.95, 0.205),
            P(0.2, 0.95, 0.205),
            P(0.2, 1.45, 0.205),
            P(-0.2, 1.45, 0.205),
            rows.char,
            PAT.NONE,
            null,
            { lv: -1 },
          );
          for (let k = 0; k < 5; k++) {
            const u = (rnd() - 0.5) * 0.6,
              y = 1.6 + rnd() * 0.5;
            mb.quad(
              P(u - 0.05, y, 0.19),
              P(u + 0.05, y, 0.19),
              P(u + 0.05, y + 0.12, 0.19),
              P(u - 0.05, y + 0.12, 0.19),
              rows.stoneDark,
              PAT.NONE,
              null,
              { lv: -1.1 },
            );
          }
          const q = P(0, 0.95, 0.12);
          mb.box(
            q[0] - 0.03,
            q[1],
            q[2] - 0.03,
            q[0] + 0.03,
            q[1] + 0.13,
            q[2] + 0.03,
            rows.glow,
            PAT.GLOW,
            { row2: rows.glow },
          );
          c.v.lights.push({ x: q[0], y: q[1] + 0.18, z: q[2], kind: "candle" });
          post(0.45);
          break;
        }
        case "pole": {
          // a tall pole hung with ribbons, horns at the top, a flat stone at its foot for the offerings
          mb.prism(
            at(0, y0 - 0.3, 0),
            at(0, y0 + 2.7, 0),
            0.07,
            0.05,
            5,
            rows.woodDark,
            PAT.BARK,
          );
          for (const su of [-1, 1]) {
            const m = at(su * 0.25, y0 + 2.75, 0),
              t = at(su * 0.42, y0 + 3.15, 0.08);
            mb.prism(
              at(0, y0 + 2.6, 0),
              m,
              0.045,
              0.035,
              4,
              R2.shell,
              PAT.NONE,
            );
            mb.prism(m, t, 0.035, 0.012, 4, R2.shell, PAT.NONE);
          }
          const cols = [rows.red, rows.blue, rows.gold, rows.rag];
          for (let k = 0; k < 6; k++) {
            const a = k * 1.05 + rnd(),
              y = y0 + 1.8 + rnd() * 0.7,
              t0 = at(Math.cos(a) * 0.06, y, Math.sin(a) * 0.06),
              t1 = at(Math.cos(a) * 0.35, y - 0.9, Math.sin(a) * 0.35 + 0.1);
            mb.quad(
              t0,
              [t0[0] + 0.05, t0[1], t0[2]],
              [t1[0] + 0.05, t1[1], t1[2]],
              t1,
              cols[k % 4],
              PAT.CLOTH,
            );
            mb.quad(
              [t0[0] + 0.05, t0[1], t0[2]],
              t0,
              t1,
              [t1[0] + 0.05, t1[1], t1[2]],
              cols[k % 4],
              PAT.CLOTH,
            );
          }
          lumpInto(
            mb,
            ...(() => {
              const q = at(0, 0, 0.45);
              return [q[0], y0 - 0.15, q[2]];
            })(),
            0.4,
            0.25,
            0.32,
            rows.stone,
            rows.moss,
            pr.seed || 3,
            0.4,
          );
          candle(-0.1, y0 + 0.1, 0.45);
          post(0.15);
          break;
        }
        case "bowl": {
          // a bowl of fire on a block of black stone, never let go out
          obox(
            0,
            0,
            y0 - 0.3,
            0.42,
            1.0,
            0.42,
            pr.rot,
            0,
            0.9,
            rows.char,
            PAT.ROCK,
          );
          mb.prism(
            [x, y0 + 0.7, z],
            [x, y0 + 0.92, z],
            0.3,
            0.42,
            8,
            R2.iron,
            PAT.NONE,
            null,
            0,
            true,
          );
          for (let k = 0; k < 4; k++) {
            const a = k * 1.6,
              r = k ? 0.12 : 0;
            mb.cone(
              [x + Math.cos(a) * r, y0 + 0.9, z + Math.sin(a) * r],
              y0 + 1.4 + (k ? 0 : 0.2),
              0.15,
              5,
              rows.flame,
              PAT.FLAME,
              null,
              0,
              0,
              a,
            );
          }
          c.v.lights.push({ x, y: y0 + 1.2, z, kind: "brazier" });
          post(0.45);
          break;
        }
        case "shell": {
          // a frame of driftwood hung with shells, a bowl of sea water under it
          for (const su of [-1, 1])
            mb.prism(
              at(su * 0.55, y0 - 0.3, 0),
              at(su * 0.42, y0 + 1.9, 0),
              0.06,
              0.05,
              4,
              R2.hull,
              PAT.BARK,
            );
          mb.prism(
            at(-0.7, y0 + 1.85, 0),
            at(0.7, y0 + 1.95, 0),
            0.06,
            0.06,
            4,
            R2.hull,
            PAT.BARK,
          );
          for (let k = 0; k < 7; k++) {
            const u = -0.45 + k * 0.15,
              y = y0 + 1.75 - (k % 3) * 0.22;
            const q = at(u, y, 0);
            mb.prism(
              [q[0], y0 + 1.85, q[2]],
              [q[0], y, q[2]],
              0.008,
              0.008,
              3,
              rows.rag,
              PAT.NONE,
            );
            mb.cone(
              [q[0], y - 0.12, q[2]],
              y + 0.02,
              0.07,
              5,
              k % 2 ? R2.shell : R2.coral,
              PAT.NONE,
            );
          }
          const b = at(0, 0, 0.1);
          mb.prism(
            [b[0], y0 - 0.1, b[2]],
            [b[0], y0 + 0.4, b[2]],
            0.35,
            0.42,
            8,
            rows.stone,
            PAT.STONE,
            null,
            0,
            true,
          );
          mb.prism(
            [b[0], y0 + 0.36, b[2]],
            [b[0], y0 + 0.4, b[2]],
            0.33,
            0.33,
            8,
            rows.water,
            PAT.POOL,
            null,
            0,
            true,
          );
          candle(0.5, y0 + 0.4, 0.3);
          post(0.45);
          break;
        }
      }
      void base;
    },

    // ---------- each frame: the sails turn with the wind ----------
    stepSails(v, dt) {
      const S = v.sails;
      const wind = this.wx ? this.wx.wind || 3 : 3;
      const want = Math.min(1.6, 0.18 + wind * 0.11);
      S.spin += (want - S.spin) * Math.min(1, dt * 0.5);
      S.ang = (S.ang + S.spin * dt) % (Math.PI * 2);
      const T = this.T,
        M =
          this._sailM ||
          (this._sailM = [new T.Matrix4(), new T.Matrix4(), new T.Matrix4()]);
      M[0].makeTranslation(S.hub[0], S.hub[1], S.hub[2]);
      M[1].makeRotationY(-S.rot);
      M[0].multiply(M[1]);
      M[2].makeRotationZ(S.ang);
      M[0].multiply(M[2]);
      S.mesh.matrix.multiply(M[0]);
      S.mesh.matrixWorldNeedsUpdate = true;
    },
  });
