// index-inline-2 51 — math
// Lines 19573-19882 of readable/index-inline-2.pretty.js (statement-aligned).
  class RampTable {
    constructor(max = 4096) {
      this.max = max;
      this.data = new Uint8Array(5 * max * 4);
      this.count = 0;
      this.keys = new Map();
      this.version = 0;
    }
    add(ramp, key) {
      if (key != null && this.keys.has(key)) return this.keys.get(key);
      if (this.count >= this.max) return 0;
      const row = this.count++;
      for (let k = 0; k < 5; k++) {
        const c = ramp[k];
        this.data.set([c[0], c[1], c[2], 255], (row * 5 + k) * 4);
      }
      if (key != null) this.keys.set(key, row);
      this.version++;
      return row;
    }
    // six consecutive rows for a species' slots
    addSpecies(g, key) {
      if (this.keys.has(key)) return this.keys.get(key);
      const rs = speciesRamps(g);
      const base = this.count;
      rs.forEach((r, i) => this.add(r));
      this.keys.set(key, base);
      return base;
    }
  }

  // ---------- canvas ----------
  // pixels hold { R: light level * 60, G: slot * 40, A: 255 }
  function painter(W, H) {
    const px = new Uint8ClampedArray(W * H * 4);
    const set = (x, y, c) => {
      x = Math.round(x);
      y = Math.round(y);
      if (x < 0 || y < 0 || x >= W || y >= H) return;
      const i = (y * W + x) * 4;
      px[i] = c.k * 60;
      px[i + 1] = c.s * 40;
      px[i + 2] = 0;
      px[i + 3] = 255;
    };
    // a gap: see-through up close, filled with its colour when too far away to make out
    const hole = (x, y, c) => {
      x = Math.round(x);
      y = Math.round(y);
      if (x < 0 || y < 0 || x >= W || y >= H) return;
      const i = (y * W + x) * 4;
      px[i] = c.k * 60;
      px[i + 1] = c.s * 40;
      px[i + 2] = 255;
      px[i + 3] = 255;
    };
    const get = (x, y) =>
      x < 0 || y < 0 || x >= W || y >= H ? 0 : px[(y * W + x) * 4 + 3];
    const col = (x, y) => {
      const i = (y * W + x) * 4;
      return { k: Math.round(px[i] / 60), s: Math.round(px[i + 1] / 40) };
    };
    return { px, set, hole, get, col, W, H };
  }
  const SP_BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
  const bay = (x, y) => (SP_BAYER[(y & 3) * 4 + (x & 3)] + 0.5) / 16;
  const h2 = (x, y, s) => (hashInt(x, y, s) >>> 8) / 16777216;

  // soft coloured outline: darker version of whatever it touches
  function outline(P, strength = 0.72, bottomOnly = false, ink = 0) {
    const { W, H } = P;
    const solid = new Uint8Array(W * H);
    for (let i = 0; i < W * H; i++) solid[i] = P.px[i * 4 + 3] ? 1 : 0;
    for (let y = 0; y < H; y++)
      for (let x = 0; x < W; x++) {
        if (solid[y * W + x]) continue;
        const nb = [
          [x + 1, y],
          [x - 1, y],
          [x, y + 1],
          [x, y - 1],
        ];
        for (const [a, b] of nb) {
          if (a < 0 || b < 0 || a >= W || b >= H || !solid[b * W + a]) continue;
          if (bottomOnly && b < y) continue;
          const c = P.col(a, b);
          P.set(x, y, { s: c.s === SLOT.SNOW ? SLOT.MAIN : c.s, k: ink });
          break;
        }
      }
  }

  // thick tapered line (a limb): lit on its left
  function limb(P, x0, y0, x1, y1, w0, w1) {
    const len = Math.hypot(x1 - x0, y1 - y0),
      n = Math.max(2, Math.ceil(len * 1.5));
    for (let s = 0; s <= n; s++) {
      const t = s / n,
        x = x0 + (x1 - x0) * t,
        y = y0 + (y1 - y0) * t,
        w = w0 + (w1 - w0) * t;
      const hw = w / 2;
      for (let dx = -Math.ceil(hw); dx <= Math.ceil(hw); dx++) {
        if (Math.abs(dx) > hw + 0.25) continue;
        const side = w <= 1.2 ? 0 : dx / (hw + 0.01);
        P.set(x + dx, y, WOOD[side < -0.34 ? 3 : side > 0.34 ? 1 : 2]);
      }
    }
  }

  // leaf clusters: many small clumps inside the crown, each lit top-left
  function cluster(x, y, seed, size) {
    const gx = Math.floor(x / size),
      gy = Math.floor(y / size);
    let best = 1e9,
      bx = 0,
      by = 0,
      bh = 0;
    for (let j = -1; j <= 1; j++)
      for (let i = -1; i <= 1; i++) {
        const cx = (gx + i + 0.2 + 0.6 * h2(gx + i, gy + j, seed)) * size,
          cy = (gy + j + 0.2 + 0.6 * h2(gx + i, gy + j, seed + 7)) * size;
        const d = (x - cx) ** 2 + (y - cy) ** 2;
        if (d < best) {
          best = d;
          bx = x - cx;
          by = y - cy;
          bh = h2(gx + i, gy + j, seed + 13);
        }
      }
    return { dx: bx / size, dy: by / size, h: bh };
  }

  // paint the union of leaf clumps
  function foliage(P, clumps, rnd, opt = {}) {
    const { W, H } = P;
    if (!clumps.length) return;
    let x0 = 1e9,
      y0 = 1e9,
      x1 = -1e9,
      y1 = -1e9;
    for (const c of clumps) {
      x0 = Math.min(x0, c.x - c.rx);
      x1 = Math.max(x1, c.x + c.rx);
      y0 = Math.min(y0, c.y - c.ry);
      y1 = Math.max(y1, c.y + c.ry);
    }
    const ccx = (x0 + x1) / 2,
      ccy = (y0 + y1) / 2,
      crx = (x1 - x0) / 2 + 1,
      cry = (y1 - y0) / 2 + 1;
    const seed = (rnd() * 1e6) | 0;
    const fill = opt.fill ?? 0.85,
      size = opt.cluster ?? 3.2,
      crownK = opt.crownK ?? 1;
    for (
      let y = Math.max(0, Math.floor(y0) - 1);
      y <= Math.min(H - 1, Math.ceil(y1) + 1);
      y++
    ) {
      for (
        let x = Math.max(0, Math.floor(x0) - 1);
        x <= Math.min(W - 1, Math.ceil(x1) + 1);
        x++
      ) {
        let inside = false,
          best = 9,
          lx = 0,
          ly = 0;
        for (const c of clumps) {
          const dx = (x - c.x) / c.rx,
            dy = (y - c.y) / c.ry;
          const d = dx * dx + dy * dy;
          const edge =
            1 +
            (h2(x, y, seed + 3) - 0.5) * 0.35 +
            (h2(x >> 1, y >> 1, seed + 5) - 0.5) * 0.4;
          if (d <= edge && d < best) {
            inside = true;
            best = d;
            lx = dx;
            ly = dy;
          }
        }
        if (!inside) continue;
        const cl = cluster(x, y, seed, size);
        // holes: the thin, shaded parts of the crown let the sky through
        if (cl.h > fill + 0.12 && (cl.dx > 0.15 || cl.dy > 0.15) && best > 0.25)
          continue;
        if (best > 0.7 && h2(x, y, seed + 11) > fill + 0.1) continue;
        let l =
          0.42 -
          0.34 * lx -
          0.46 * ly -
          crownK * ((0.3 * (x - ccx)) / crx + (0.4 * (y - ccy)) / cry);
        l += -0.55 * (cl.dx + cl.dy) * 0.6 + (cl.h - 0.5) * 0.3;
        l += (bay(x, y) - 0.5) * 0.22;
        const k = l > 0.8 ? 4 : l > 0.4 ? 3 : l > 0.0 ? 2 : 1;
        let c = LEAF[k];
        if (opt.snow && (k >= 3 || ly < -0.35) && h2(x, y, seed + 17) < 0.8)
          c = SNOWE[k >= 4 ? 4 : 3];
        else if (opt.bloom && k >= 2 && h2(x, y, seed + 19) < opt.bloom.k)
          c = PETAL[k >= 3 ? 3 : 2];
        P.set(x, y, c);
      }
    }
  }

  // ---------- growth: a branching skeleton in abstract units ----------
  function growTree(g, rnd) {
    const segs = [],
      tips = [];
    const trunkLen = g.trunk;
    let x = 0,
      y = 0,
      a = Math.PI / 2 + g.lean * 0.35,
      w = 0.05 + 0.06 * g.width;
    const n = 4;
    for (let i = 0; i < n; i++) {
      const a2 = a + (rnd() - 0.5) * (g.bend || 0) * 0.5;
      const x2 = x + (Math.cos(a2) * trunkLen) / n,
        y2 = y + (Math.sin(a2) * trunkLen) / n;
      segs.push({ x0: x, y0: y, x1: x2, y1: y2, w0: w, w1: w * 0.88, d: 0 });
      x = x2;
      y = y2;
      a = a2;
      w *= 0.88;
    }
    const crown = 1 - trunkLen;
    const rec = (x, y, a, len, w, depth) => {
      if (depth > g.depth) {
        tips.push({ x, y, a, len });
        return;
      }
      const k = g.count + (depth > 1 && rnd() < 0.3 ? 1 : 0);
      for (let i = 0; i < k; i++) {
        const t = k === 1 ? 0 : i / (k - 1) - 0.5;
        let a2 = a + t * 2 * g.spread + (rnd() - 0.5) * 0.4;
        a2 += (Math.PI / 2 - a2) * g.up;
        const l2 = len * (0.75 + rnd() * 0.5);
        const x2 = x + Math.cos(a2) * l2,
          y2 = y + Math.sin(a2) * l2;
        const w2 = Math.max(0.012, w * 0.6);
        segs.push({ x0: x, y0: y, x1: x2, y1: y2, w0: w, w1: w2, d: depth });
        if (depth < g.depth && rnd() < 0.35)
          tips.push({
            x: (x + x2) / 2,
            y: (y + y2) / 2,
            a: a2,
            len: l2 * 0.6,
            mid: true,
          });
        rec(x2, y2, a2, len * g.ratio, w2, depth + 1);
      }
    };
    rec(x, y, a, crown * 0.46, w * 0.85, 1);
    return { segs, tips, crown };
  }

  // fit a grown tree into a canvas H pixels tall (width follows the shape)
  function layoutTree(g, rnd, H, clumpK, flatK = 1, tallK = 1) {
    const { segs, tips, crown } = growTree(g, rnd);
    const r0 = crown * 0.2 * clumpK;
    const clumps = tips.map((t) => ({
      x: t.x,
      y: t.y,
      rx: r0 * (t.mid ? 0.7 : 1) * (0.8 + rnd() * 0.4),
      ry: r0 * flatK * tallK * (t.mid ? 0.7 : 1) * (0.8 + rnd() * 0.4),
    }));
    let top = 0,
      ext = 0;
    for (const s of segs) {
      top = Math.max(top, s.y1);
      ext = Math.max(ext, Math.abs(s.x1), Math.abs(s.x0));
    }
    for (const c of clumps) {
      top = Math.max(top, c.y + c.ry);
      ext = Math.max(ext, Math.abs(c.x) + c.rx);
    }
    const sc = (H - 2) / top;
    const W = Math.max(8, Math.ceil(ext * sc * 2) + 4);
    const X = (x) => W / 2 + x * sc,
      Y = (y) => H - 1 - y * sc;
    return {
      W,
      sc,
      segs: segs.map((s) => ({
        x0: X(s.x0),
        y0: Y(s.y0),
        x1: X(s.x1),
        y1: Y(s.y1),
        w0: Math.max(1, s.w0 * sc),
        w1: Math.max(1, s.w1 * sc),
        d: s.d,
      })),
      clumps: clumps.map((c) => ({
        x: X(c.x),
        y: Y(c.y),
        rx: Math.max(1.5, c.rx * sc),
        ry: Math.max(1.5, c.ry * sc),
      })),
    };
  }

  // ---------- the painters, one per form ----------
  const PX_PER_M = (h) => Math.max(3.4, Math.min(22, 44 / h));
  function spriteHeightPx(g) {
    return Math.round(Math.max(10, Math.min(104, g.h * PX_PER_M(g.h))));
  }

