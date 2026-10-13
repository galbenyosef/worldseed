// index-inline-2 128 — math
// Lines 63260-63586 of readable/index-inline-2.pretty.js (statement-aligned).
  class StrikeFx {
    constructor(canvas) {
      this.canvas = canvas;
      this.ctx = canvas.getContext("2d");
      this.W = 0;
      this.H = 0;
      this.img = null;
      this.list = [];
      this.side = 1;
      this.shown = false;
      this.count = { slash: 0, hit: 0, chips: 0 }; // (for the tests)
    }
    size(W, H) {
      W = Math.max(64, Math.round(W));
      H = Math.max(48, Math.round(H));
      if (W === this.W && H === this.H) return;
      this.W = W;
      this.H = H;
      this.canvas.width = W;
      this.canvas.height = H;
      this.img = this.ctx.createImageData(W, H);
    }
    // a swing. kind: 'wide' | 'small' | 'fist' | 'thrust'; col: the colour of what you swing
    slash(kind = "wide", col = [255, 246, 214]) {
      this.side = -this.side;
      this.count.slash++;
      this.list.push({
        type: "slash",
        kind,
        col,
        t: 0,
        dur: kind === "thrust" ? 0.2 : kind === "wide" ? 0.27 : 0.18,
        side: this.side,
        tilt: (Math.random() - 0.5) * 0.45,
      });
    }
    // a blow landing at (x, y), as parts of the view (0..1); big: the last blow; spark: the colours of what flies off
    hit(x, y, o = {}) {
      this.count.hit++;
      const big = !!o.big,
        n = big ? 16 : 9,
        sp = [];
      const cols = o.spark || [
        [255, 250, 230],
        [255, 226, 140],
      ];
      for (let k = 0; k < n; k++) {
        const a = -Math.PI / 2 + (Math.random() - 0.5) * Math.PI * 1.7,
          v = (0.35 + Math.random() * 0.6) * (big ? 1.3 : 1);
        sp.push({
          x: 0,
          y: 0,
          vx: Math.cos(a) * v,
          vy: Math.sin(a) * v,
          life: 0.22 + Math.random() * (big ? 0.35 : 0.2),
          c: cols[k % cols.length],
          s: Math.random() < 0.3 ? 2 : 1,
        });
      }
      this.list.push({
        type: "hit",
        x,
        y,
        big,
        t: 0,
        dur: big ? 0.6 : 0.42,
        sp,
        ray: o.ray || [255, 236, 170],
        grav: o.grav ?? 1.4,
      });
    }
    // chips off a tree or a rock (or dust off anything): heavier bits, falling
    chips(x, y, cols, n = 16) {
      this.count.chips++;
      const sp = [];
      for (let k = 0; k < n; k++) {
        const a = -Math.PI / 2 + (Math.random() - 0.5) * Math.PI * 1.5,
          v = 0.35 + Math.random() * 0.55;
        sp.push({
          x: 0,
          y: 0,
          vx: Math.cos(a) * v,
          vy: Math.sin(a) * v - 0.2,
          life: 0.4 + Math.random() * 0.3,
          c: cols[k % cols.length],
          s: 2 + (Math.random() < 0.5 ? 1 : 0) + (Math.random() < 0.2 ? 1 : 0),
        });
      }
      this.list.push({
        type: "chips",
        x,
        y,
        t: 0,
        dur: 0.75,
        sp,
        grav: 2.6,
        puff: true,
      });
    }
    active() {
      return this.list.length > 0;
    }
    draw(dt) {
      if (this.hold) dt = 0; // (held still, to look at)
      if (!this.list.length) {
        if (this.shown) {
          this.canvas.style.opacity = "0";
          this.shown = false;
        }
        return;
      }
      if (!this.img) return;
      const px = this.img.data,
        W = this.W,
        H = this.H;
      px.fill(0);
      const put = (x, y, c, a = 255) => {
        x |= 0;
        y |= 0;
        if (x < 0 || y < 0 || x >= W || y >= H) return;
        const i = (y * W + x) * 4;
        if (px[i + 3] > a) return;
        px[i] = c[0];
        px[i + 1] = c[1];
        px[i + 2] = c[2];
        px[i + 3] = a;
      };
      for (let i = this.list.length - 1; i >= 0; i--) {
        const e = this.list[i];
        e.t += dt;
        if (e.t >= e.dur) {
          this.list.splice(i, 1);
          continue;
        }
        if (e.type === "slash") this.drawSlash(e, put);
        else this.drawBurst(e, put, dt);
      }
      this.ctx.putImageData(this.img, 0, 0);
      if (!this.shown) {
        this.canvas.style.opacity = "1";
        this.shown = true;
      }
    }
    drawSlash(e, put) {
      const W = this.W,
        H = this.H,
        p = e.t / e.dur;
      const white = [255, 255, 250],
        col = e.col;
      if (e.kind === "thrust") {
        // straight in from low beside you to where you look: a narrow wedge, its point bright
        const x0 = W * (0.5 + e.side * 0.14),
          y0 = H * 1.05,
          x1 = W * 0.5,
          y1 = H * 0.47;
        const head = fxEase(Math.min(1, p * 1.8)),
          tail = Math.max(0, head - 0.55 * (1 - Math.max(0, p - 0.5) / 0.5));
        const dx = x1 - x0,
          dy = y1 - y0,
          L = Math.hypot(dx, dy),
          nx = -dy / L,
          ny = dx / L;
        for (let s = tail; s <= head; s += 0.5 / L) {
          const k = (s - tail) / Math.max(1e-3, head - tail),
            cx = x0 + dx * s,
            cy = y0 + dy * s,
            w = 1 + (1 - k) * H * 0.018 + k * 1.5;
          for (let o = -w; o <= w; o += 0.7) {
            const x = cx + nx * o,
              y = cy + ny * o,
              core = Math.abs(o) < w * 0.45;
            if (
              k <
              ((FX_BAYER[((y | 0) & 3) * 4 + ((x | 0) & 3)] + 0.5) / 16) * 0.7
            )
              continue;
            put(x, y, core ? white : col, core ? 245 : 200);
          }
        }
        // speed lines alongside it
        for (const off of [-1, 1])
          for (
            let s = Math.max(tail, head - 0.35);
            s <= head - 0.05;
            s += 0.8 / L
          ) {
            const x = x0 + dx * s + nx * off * H * 0.05,
              y = y0 + dy * s + ny * off * H * 0.05;
            if (((x | 0) + (y | 0)) & 1) put(x, y, col, 150);
          }
        return;
      }
      // an arc across the view: a wide one for heavy swings, a small quick one for a knife or a fist
      const small = e.kind !== "wide";
      const r = H * (small ? 0.26 : 0.5),
        cx = W * 0.5 + e.side * W * 0.03,
        cy = H * (small ? 0.74 : 0.95);
      const span = small ? 1.6 : 2.1,
        mid = -Math.PI / 2 + e.tilt;
      const a0 = mid - (e.side * span) / 2,
        a1 = mid + (e.side * span) / 2;
      const head = a0 + (a1 - a0) * fxEase(Math.min(1, p * 1.7));
      const trail = (small ? 1.0 : 1.35) * (1 - Math.max(0, p - 0.5) / 0.5);
      const thick = H * (small ? 0.024 : 0.042);
      // only the box round the arc
      const xa = Math.max(0, Math.floor(cx - r - thick - 2)),
        xb = Math.min(W - 1, Math.ceil(cx + r + thick + 2));
      const ya = Math.max(0, Math.floor(cy - r - thick - 2)),
        yb = Math.min(H - 1, Math.ceil(cy + thick + 2));
      for (let y = ya; y <= yb; y++)
        for (let x = xa; x <= xb; x++) {
          const dx = x + 0.5 - cx,
            dy = y + 0.5 - cy,
            d = Math.hypot(dx, dy);
          if (Math.abs(d - r) > thick + 1) continue;
          let behind = (Math.atan2(dy, dx) - head) * -e.side;
          behind = ((behind % FX_TAU) + FX_TAU) % FX_TAU;
          if (behind > trail) continue;
          const k = 1 - behind / trail,
            w = 0.8 + thick * k;
          const off = Math.abs(d - r);
          if (off > w) continue;
          if (k < ((FX_BAYER[(y & 3) * 4 + (x & 3)] + 0.5) / 16) * 0.9)
            continue;
          const core = off < w * 0.42;
          put(x, y, core ? white : col, core ? 250 : Math.round(150 + 80 * k));
        }
    }
    drawBurst(e, put, dt) {
      const W = this.W,
        H = this.H,
        cx = e.x * W,
        cy = e.y * H;
      if (e.type === "hit" || e.puff) {
        // the flash: rays out from where it landed, quick, then gone (a small one where an axe bites)
        const fl = e.t / (e.puff ? 0.1 : 0.16);
        if (fl < 1) {
          const R =
              H *
              (e.big ? 0.12 : e.puff ? 0.04 : 0.075) *
              (0.35 + 0.65 * fxEase(Math.min(1, fl * 2))),
            fade = fl < 0.5 ? 1 : 1 - (fl - 0.5) / 0.5;
          const ray = (ax, ay, len, wid) => {
            for (let s = 0; s <= len; s += 0.6) {
              const k = 1 - s / len,
                w = Math.max(0, wid * k);
              for (let o = -w; o <= w; o += 0.6) {
                const x = cx + ax * s - ay * o,
                  y = cy + ay * s + ax * o;
                if (
                  k * fade <
                  ((FX_BAYER[((y | 0) & 3) * 4 + ((x | 0) & 3)] + 0.5) / 16) *
                    0.6
                )
                  continue;
                put(
                  x,
                  y,
                  Math.abs(o) < w * 0.5
                    ? [255, 255, 255]
                    : e.ray || [255, 236, 170],
                  240,
                );
              }
            }
          };
          for (const [ax, ay] of [
            [1, 0],
            [-1, 0],
            [0, 1],
            [0, -1],
          ])
            ray(ax, ay, R, 1.6);
          for (const [ax, ay] of [
            [0.71, 0.71],
            [-0.71, 0.71],
            [0.71, -0.71],
            [-0.71, -0.71],
          ])
            ray(ax, ay, R * 0.55, 1.0);
          for (let y = -2; y <= 2; y++)
            for (let x = -2; x <= 2; x++)
              if (x * x + y * y <= 4) put(cx + x, cy + y, [255, 255, 255], 255);
        }
        // the last blow: a ring going out
        if (e.big) {
          const rp = Math.min(1, e.t / 0.32),
            rr = H * 0.17 * fxEase(rp);
          if (rp < 1)
            for (let a = 0; a < FX_TAU; a += 0.6 / Math.max(4, rr)) {
              const x = cx + Math.cos(a) * rr,
                y = cy + Math.sin(a) * rr;
              if (
                1 - rp <
                (FX_BAYER[((y | 0) & 3) * 4 + ((x | 0) & 3)] + 0.5) / 16
              )
                continue;
              put(x, y, e.ray, 220);
            }
        }
      }
      // sparks, embers, dust or chips, flying out and falling
      for (const s of e.sp) {
        if (e.t > s.life) continue;
        s.vy += e.grav * dt;
        s.x += s.vx * dt;
        s.y += s.vy * dt;
        const x = cx + s.x * H,
          y = cy + s.y * H;
        for (let a = 0; a < s.s; a++)
          for (let b = 0; b < s.s; b++) put(x + a, y + b, s.c, 255);
      }
    }
  }

  // ---- ui/app.js ----
  // ============================================================
  // APP — the observer's console: travel between worlds, watch them turn,
  // probe the ground, read the chronicle, and embark.
  // ============================================================

  const SECONDS_PER_DAY = 60; // at 1x, one planet day passes per minute
  const DEFAULT_SEED = "Oru";
  // The first world you see is one of these, a different one each time you come (never the one you were shown last):
  // worlds checked to give a kind start, temperate and peopled, where you come down in mild green country, and
  // where nothing went wrong on landing, walking about, in the nearest town or at the places round it. A shared
  // link, or a life you have going, opens its own world instead; New world, or a name of your own, goes anywhere.
