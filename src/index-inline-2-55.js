// index-inline-2 55 — row
// Lines 20875-21181 of readable/index-inline-2.pretty.js (statement-aligned).
  class MeshBuf {
    constructor(bones = false) {
      this.p = [];
      this.n = [];
      this.r = [];
      this.r2 = [];
      this.uv = [];
      this.t = [];
      this.lv = [];
      this.bones = bones;
      this.b = [];
      this.pv = [];
      this.lvBase = 0;
    }
    get count() {
      return this.p.length / 3;
    }
    tri(a, b, c, row, pat = 0, uvs = null, o = null) {
      const n = normv(crossv(sub(b, a), sub(c, a)));
      const vs = [a, b, c];
      for (let i = 0; i < 3; i++) {
        const v = vs[i];
        this.p.push(v[0], v[1], v[2]);
        this.n.push(n[0], n[1], n[2]);
        this.r.push(row);
        this.r2.push(o && o.row2 != null ? o.row2 : row);
        this.t.push(pat);
        this.lv.push(this.lvBase + (o && o.lv ? o.lv : 0));
        const uv = uvs ? uvs[i] : [0, 0];
        this.uv.push(uv[0], uv[1]);
        if (this.bones) {
          this.b.push(o && o.bone ? o.bone : 0);
          const pv = o && o.pivot ? o.pivot : [0, 0, 0];
          this.pv.push(pv[0], pv[1], pv[2]);
        }
      }
    }
    quad(a, b, c, d, row, pat = 0, uvs = null, o = null) {
      this.tri(a, b, c, row, pat, uvs && [uvs[0], uvs[1], uvs[2]], o);
      this.tri(a, c, d, row, pat, uvs && [uvs[0], uvs[2], uvs[3]], o);
    }
    // a face's other side, a hair behind it, to draw in its own colour (two faces drawn in one place flicker
    // between them): the four corners of quad(a, b, c, d), as quad(b, a, d, c) facing the other way. A roof's or
    // an awning's other side is always the one under it; a wall's, the side its corners turn away from.
    under(a, b, c, d, gap = 0.025) {
      let n = normv(crossv(sub(b, a), sub(c, a)));
      if (Math.abs(n[1]) > 0.2 && n[1] < 0) n = [-n[0], -n[1], -n[2]];
      const s = (p) => [
        p[0] - n[0] * gap,
        p[1] - n[1] * gap,
        p[2] - n[2] * gap,
      ];
      return [s(b), s(a), s(d), s(c)];
    }
    // axis-aligned box from (x0,y0,z0) to (x1,y1,z1); uv in metres; row may differ per face
    box(
      x0,
      y0,
      z0,
      x1,
      y1,
      z1,
      row,
      pat = 0,
      o = null,
      faces = "all",
      rowTop = null,
    ) {
      const P = (x, y, z) => [x, y, z];
      const W = x1 - x0,
        H = y1 - y0,
        D = z1 - z0;
      const f = (name) => faces === "all" || faces.includes(name);
      if (f("front"))
        this.quad(
          P(x0, y0, z1),
          P(x1, y0, z1),
          P(x1, y1, z1),
          P(x0, y1, z1),
          row,
          pat,
          [
            [0, 0],
            [W, 0],
            [W, H],
            [0, H],
          ],
          o,
        );
      if (f("back"))
        this.quad(
          P(x1, y0, z0),
          P(x0, y0, z0),
          P(x0, y1, z0),
          P(x1, y1, z0),
          row,
          pat,
          [
            [0, 0],
            [W, 0],
            [W, H],
            [0, H],
          ],
          o,
        );
      if (f("right"))
        this.quad(
          P(x1, y0, z1),
          P(x1, y0, z0),
          P(x1, y1, z0),
          P(x1, y1, z1),
          row,
          pat,
          [
            [0, 0],
            [D, 0],
            [D, H],
            [0, H],
          ],
          o,
        );
      if (f("left"))
        this.quad(
          P(x0, y0, z0),
          P(x0, y0, z1),
          P(x0, y1, z1),
          P(x0, y1, z0),
          row,
          pat,
          [
            [0, 0],
            [D, 0],
            [D, H],
            [0, H],
          ],
          o,
        );
      if (f("top"))
        this.quad(
          P(x0, y1, z1),
          P(x1, y1, z1),
          P(x1, y1, z0),
          P(x0, y1, z0),
          rowTop != null ? rowTop : row,
          pat,
          [
            [0, 0],
            [W, 0],
            [W, D],
            [0, D],
          ],
          o,
        );
      if (f("bottom"))
        this.quad(
          P(x0, y0, z0),
          P(x1, y0, z0),
          P(x1, y0, z1),
          P(x0, y0, z1),
          row,
          pat,
          [
            [0, 0],
            [W, 0],
            [W, D],
            [0, D],
          ],
          o,
        );
    }
    // tapered prism between two points (branches, trunks, legs of stilts). Its ends are closed, so it is
    // never a hollow tube seen end on: caps true or 'both' (the default), 'top' (the p1 end only), 'bottom'
    // (the p0 end only), or false (open: a bowl's rim, say)
    prism(
      p0,
      p1,
      r0,
      r1,
      sides,
      row,
      pat = 0,
      o = null,
      v0 = 0,
      caps = "both",
    ) {
      const d = normv(sub(p1, p0)),
        [u, w] = perp(d),
        L = lenv(sub(p1, p0));
      const ring = (p, r, k) => {
        const a = (k / sides) * Math.PI * 2;
        return addv(p, addv(mul(u, Math.cos(a) * r), mul(w, Math.sin(a) * r)));
      };
      const circ = (Math.PI * 2 * (r0 + r1)) / 2;
      const A = [],
        Bs = [];
      for (let k = 0; k <= sides; k++) {
        A.push(ring(p0, r0, k));
        Bs.push(ring(p1, r1, k));
      }
      for (let k = 0; k < sides; k++) {
        const ua = (k / sides) * circ,
          ub = ((k + 1) / sides) * circ;
        this.quad(
          A[k],
          A[k + 1],
          Bs[k + 1],
          Bs[k],
          row,
          pat,
          [
            [ua, v0],
            [ub, v0],
            [ub, v0 + L],
            [ua, v0 + L],
          ],
          o,
        );
      }
      // the ends: a fan across each (facing out along the prism)
      const top = caps === true || caps === "both" || caps === "top",
        bot = caps === true || caps === "both" || caps === "bottom";
      if (top && r1 > 1e-4)
        for (let k = 1; k < sides - 1; k++)
          this.tri(Bs[0], Bs[k], Bs[k + 1], row, pat, null, o);
      if (bot && r0 > 1e-4)
        for (let k = 1; k < sides - 1; k++)
          this.tri(A[0], A[k + 1], A[k], row, pat, null, o);
      return L;
    }
    // cone: apex above a ring (its edge can droop); optional underside
    cone(
      base,
      apexY,
      r,
      sides,
      row,
      pat = 0,
      o = null,
      droop = 0,
      under = 0,
      spin = 0,
    ) {
      const apex = [base[0], apexY, base[2]];
      const ring = [];
      for (let k = 0; k <= sides; k++) {
        const a = (k / sides + spin) * Math.PI * 2;
        ring.push([
          base[0] + Math.cos(a) * r,
          base[1] - droop,
          base[2] + Math.sin(a) * r,
        ]);
      }
      const h = apexY - base[1];
      for (let k = 0; k < sides; k++)
        this.tri(
          ring[k + 1],
          ring[k],
          apex,
          row,
          pat,
          [
            [((k + 1) / sides) * r * 6, 0],
            [(k / sides) * r * 6, 0],
            [((k + 0.5) / sides) * r * 6, h],
          ],
          o,
        );
      if (under > 0) {
        const inner = [base[0], base[1] + under, base[2]];
        // the underside's uv runs below zero, so patterns can tell it from the outside
        for (let k = 0; k < sides; k++)
          this.tri(
            ring[k],
            ring[k + 1],
            inner,
            row,
            pat,
            [
              [(k / sides) * r * 6, -1],
              [((k + 1) / sides) * r * 6, -1],
              [((k + 0.5) / sides) * r * 6, -1 - r],
            ],
            o ? { ...o, lv: (o.lv || 0) - 0.25 } : { lv: -0.25 },
          );
      }
    }
    finish() {
      const out = {
        count: this.count,
        p: new Float32Array(this.p),
        n: new Float32Array(this.n),
        r: new Float32Array(this.r),
        r2: new Float32Array(this.r2),
        uv: new Float32Array(this.uv),
        t: new Float32Array(this.t),
        lv: new Float32Array(this.lv),
      };
      if (this.bones) {
        out.b = new Float32Array(this.b);
        out.pv = new Float32Array(this.pv);
      }
      return out;
    }
  }

  // ---------- trees ----------
  // grow a 3D skeleton in units where the tree is about 1 tall
