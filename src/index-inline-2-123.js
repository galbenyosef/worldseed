// index-inline-2 123 — bsz
// Lines 61777-61987 of readable/index-inline-2.pretty.js (statement-aligned).
  class BowSight {
    constructor(canvas) {
      this.canvas = canvas;
      canvas.width = BSZ;
      canvas.height = BSZ;
      this.ctx = canvas.getContext("2d");
      this.img = this.ctx.createImageData(BSZ, BSZ);
      this.shown = false;
    }
    hide() {
      if (this.shown) {
        this.canvas.style.opacity = "0";
        this.shown = false;
      }
    }
    // k: how far drawn (0..1); obsidian: a black head; nowS: for the glint
    draw(k, obsidian, nowS) {
      if (!(k > 0)) {
        this.hide();
        return;
      }
      const px = this.img.data;
      px.fill(0);
      const put = (x, y, c, a = 255) => {
        x = Math.round(x);
        y = Math.round(y);
        if (x < 0 || y < 0 || x >= BSZ || y >= BSZ) return;
        const i = (y * BSZ + x) * 4;
        px[i] = c[0];
        px[i + 1] = c[1];
        px[i + 2] = c[2];
        px[i + 3] = a;
      };
      const line = (x0, y0, x1, y1, c, w = 1) => {
        const n = Math.max(
          1,
          Math.ceil(Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0))),
        );
        for (let s = 0; s <= n; s++) {
          const x = x0 + ((x1 - x0) * s) / n,
            y = y0 + ((y1 - y0) * s) / n;
          for (let a = 0; a < w; a++)
            for (let b = 0; b < w; b++)
              put(x + a - (w >> 1), y + b - (w >> 1), c);
        }
      };
      const e = k * k * (3 - 2 * k);
      const T = [60, 60],
        N = [68 + 36 * e, 68 + 26 * e];
      const U = [50 - 3 * e, 6 + 2 * e],
        L = [50 - 3 * e, 114 - 2 * e],
        G = [55, 63];
      // the stave: two curves meeting at the grip, thick in the middle, thin at the tips
      const limb = (A, C, B, from) => {
        for (let s = 0; s <= 60; s++) {
          const t = s / 60,
            x =
              (1 - t) * (1 - t) * A[0] + 2 * (1 - t) * t * C[0] + t * t * B[0],
            y =
              (1 - t) * (1 - t) * A[1] + 2 * (1 - t) * t * C[1] + t * t * B[1];
          const nearGrip = from ? 1 - t : t,
            w = nearGrip > 0.7 ? 1 : nearGrip > 0.3 ? 2 : 3;
          for (let a = 0; a < w; a++)
            put(x + a - 1, y, BOW_SHADE[Math.min(3, a + (w === 1 ? 1 : 0))]);
        }
      };
      limb(U, [58 + 2 * e, 30], G, false);
      limb(G, [58 + 2 * e, 94], L, true);
      // the string, back to your fingers
      line(U[0], U[1], N[0], N[1], [230, 224, 202]);
      line(L[0], L[1], N[0], N[1], [230, 224, 202]);
      // the grip, wrapped, and your fist round it: the backs of the fingers, the thumb over the top where the arrow lies
      for (let y = 55; y <= 77; y++)
        for (let x = 53; x <= 57; x++)
          put(x, y, y & 1 ? [96, 60, 40] : [72, 44, 30]);
      const SK = [
        [150, 102, 76],
        [196, 150, 112],
        [222, 180, 140],
        [240, 206, 168],
      ];
      for (let y = 61; y <= 74; y++) {
        const x0 = y === 61 || y === 74 ? 50 : 49,
          x1 = y === 74 ? 56 : 58;
        for (let x = x0; x <= x1; x++) {
          const finger = y === 64 || y === 67 || y === 70,
            rim = x === x0 || y === 74,
            knuckle =
              x <= x0 + 1 && (y === 62 || y === 65 || y === 68 || y === 71);
          put(
            x,
            y,
            finger || rim
              ? SK[0]
              : knuckle
                ? SK[3]
                : x < x0 + 3
                  ? SK[2]
                  : SK[1],
          );
        }
      }
      for (let y = 59; y <= 61; y++)
        for (let x = 55; x <= 59; x++)
          put(x, y, y === 59 ? SK[2] : x === 59 ? SK[0] : SK[1]);
      // the arrow: shaft, flights, head
      const ux = T[0] - N[0],
        uy = T[1] - N[1],
        ul = Math.hypot(ux, uy),
        u = [ux / ul, uy / ul],
        v = [-u[1], u[0]];
      line(N[0], N[1], T[0], T[1], [196, 164, 110], 2);
      line(N[0] + v[0], N[1] + v[1], T[0] + v[0], T[1] + v[1], [228, 200, 146]);
      for (let s = 2; s <= 10; s++) {
        const x = N[0] + u[0] * s,
          y = N[1] + u[1] * s,
          f = s < 6 ? 3 : 2;
        for (let a = 2; a <= f; a++) {
          put(x + v[0] * a, y + v[1] * a, [190, 66, 52]);
          put(x - v[0] * a, y - v[1] * a, [238, 232, 220]);
        }
      }
      // the head, a chipped point, sitting where you look
      const head = obsidian
        ? [
            [30, 24, 40],
            [86, 72, 112],
          ]
        : [
            [84, 90, 116],
            [168, 176, 204],
          ];
      for (let a = -3; a <= 4; a += 0.5)
        for (let b = -3; b <= 3; b += 0.5) {
          if (Math.abs(b) > (4 - a) * 0.45) continue;
          put(
            T[0] + u[0] * a + v[0] * b,
            T[1] + u[1] * a + v[1] * b,
            b < -0.4 ? head[1] : head[0],
          );
        }
      // all the way back: the head catches the light now and then
      if (k >= 1 && nowS % 0.7 < 0.16) {
        put(T[0] + u[0] * 3, T[1] + u[1] * 3, [255, 250, 220]);
        put(T[0] + u[0] * 2, T[1] + u[1] * 2, [255, 236, 170]);
      }
      // a dark edge round all of it, so it reads against anything
      const OUT = [16, 10, 26];
      const solid = (x, y) =>
        x >= 0 &&
        y >= 0 &&
        x < BSZ &&
        y < BSZ &&
        px[(y * BSZ + x) * 4 + 3] === 255;
      const edges = [];
      for (let y = 0; y < BSZ; y++)
        for (let x = 0; x < BSZ; x++)
          if (
            !px[(y * BSZ + x) * 4 + 3] &&
            (solid(x - 1, y) ||
              solid(x + 1, y) ||
              solid(x, y - 1) ||
              solid(x, y + 1))
          )
            edges.push(x, y);
      for (let i = 0; i < edges.length; i += 2)
        put(edges[i], edges[i + 1], OUT, 200);
      // how far: a bar low on the left
      for (let x = 13; x <= 42; x++)
        for (let y = 103; y <= 107; y++) {
          const rim = x === 13 || x === 42 || y === 103 || y === 107,
            fill = x - 14 < Math.round(28 * k);
          put(
            x,
            y,
            rim
              ? OUT
              : fill
                ? k >= 1
                  ? [255, 236, 150]
                  : [255, 210, 87]
                : [34, 30, 70],
            rim ? 230 : fill ? 255 : 190,
          );
        }
      this.ctx.putImageData(this.img, 0, 0);
      if (!this.shown) {
        this.canvas.style.opacity = "1";
        this.shown = true;
      }
    }
  }

  // ---- ui/packui.js ----
  // ============================================================
  // PACK UI — the satchel, what you can make, and your body, opened with I
  // (or the bag button). The satchel only holds things: tap one to see what it
  // is and what you can do with it. Making is the Make tab: everything you know
  // how to make, ready things first, and the tools you can mend. At a fire or a
  // work stone, more is possible.
  // ============================================================

  const pEsc = (s) =>
    String(s).replace(
      /[&<>"]/g,
      (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c],
    );
  const $p = (id) => document.getElementById(id);
  // "2 sticks", "a flint blade", "some cord", as parts of a recipe
  const partWords = (id, n) => countWords(id, n);

