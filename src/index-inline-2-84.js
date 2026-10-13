// index-inline-2 84 — math
// Lines 34621-34754 of readable/index-inline-2.pretty.js (statement-aligned).
  function iconCanvas(draw, outline = true) {
    const px = new Uint8ClampedArray(ICON_N * ICON_N * 4);
    const set = (x, y, c) => {
      x = Math.round(x);
      y = Math.round(y);
      if (x < 0 || y < 0 || x >= ICON_N || y >= ICON_N || !c) return;
      const i = (y * ICON_N + x) * 4;
      px[i] = c[0];
      px[i + 1] = c[1];
      px[i + 2] = c[2];
      px[i + 3] = 255;
    };
    const line = (x0, y0, x1, y1, w, col) => {
      const n = Math.max(2, Math.ceil(Math.hypot(x1 - x0, y1 - y0) * 2));
      const nx = -(y1 - y0),
        ny = x1 - x0,
        L = Math.hypot(nx, ny) || 1;
      for (let s = 0; s <= n; s++) {
        const t = s / n,
          x = x0 + (x1 - x0) * t,
          y = y0 + (y1 - y0) * t;
        for (let k = -(w - 1) / 2; k <= (w - 1) / 2 + 1e-6; k += 0.5)
          set(
            x + (nx / L) * k,
            y + (ny / L) * k,
            typeof col === "function" ? col(k, t) : col,
          );
      }
    };
    const ell = (cx, cy, rx, ry, col) => {
      for (let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y++)
        for (let x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x++) {
          const dx = (x + 0.5 - cx) / rx,
            dy = (y + 0.5 - cy) / ry;
          if (dx * dx + dy * dy <= 1)
            set(x, y, typeof col === "function" ? col(dx, dy, x, y) : col);
        }
    };
    const poly = (pts, col) => {
      let x0 = 99,
        y0 = 99,
        x1 = -1,
        y1 = -1;
      for (const [x, y] of pts) {
        x0 = Math.min(x0, x);
        y0 = Math.min(y0, y);
        x1 = Math.max(x1, x);
        y1 = Math.max(y1, y);
      }
      for (let y = Math.floor(y0); y <= Math.ceil(y1); y++)
        for (let x = Math.floor(x0); x <= Math.ceil(x1); x++) {
          const px2 = x + 0.5,
            py = y + 0.5;
          let inside = false;
          for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
            const [xi, yi] = pts[i],
              [xj, yj] = pts[j];
            if (
              yi > py !== yj > py &&
              px2 < ((xj - xi) * (py - yi)) / (yj - yi) + xi
            )
              inside = !inside;
          }
          if (inside) set(x, y, typeof col === "function" ? col(x, y) : col);
        }
    };
    // light from the upper left: pick a shade by position inside a shape
    const lit =
      (ramp, bias = 0) =>
      (dx, dy) =>
        ramp[
          Math.max(
            0,
            Math.min(
              ramp.length - 1,
              Math.round(
                (ramp.length - 1) * (0.55 - 0.35 * dx - 0.45 * dy) + bias,
              ),
            ),
          )
        ];
    draw({ set, line, ell, poly, lit, P: PAL });
    if (!outline) return px;
    // outline everything so it reads on any background
    const solid = new Uint8Array(ICON_N * ICON_N);
    for (let i = 0; i < solid.length; i++) solid[i] = px[i * 4 + 3] ? 1 : 0;
    for (let y = 0; y < ICON_N; y++)
      for (let x = 0; x < ICON_N; x++) {
        if (solid[y * ICON_N + x]) continue;
        if (
          (x > 0 && solid[y * ICON_N + x - 1]) ||
          (x < ICON_N - 1 && solid[y * ICON_N + x + 1]) ||
          (y > 0 && solid[(y - 1) * ICON_N + x]) ||
          (y < ICON_N - 1 && solid[(y + 1) * ICON_N + x])
        )
          set(x, y, PAL.ink);
      }
    return px;
  }

  // a little stoppered bottle with a draught in it: liq is three shades, dark to light
  function bottleIcon({ ell, poly, line, set, P }, liq) {
    const glass = [
      [150, 170, 190],
      [214, 226, 236],
    ];
    ell(8, 10, 5, 4.8, (dx, dy) =>
      dy < -0.25
        ? dx < 0
          ? glass[1]
          : glass[0]
        : liq[dx + dy < -0.2 ? 2 : dx > 0.4 ? 0 : 1],
    );
    poly(
      [
        [6, 2],
        [10, 2],
        [10, 6],
        [6, 6],
      ],
      (x) => (x < 8 ? glass[1] : glass[0]),
    );
    poly(
      [
        [6, 1],
        [10, 1],
        [10, 3],
        [6, 3],
      ],
      (x) => (x < 8 ? P.wood[3] : P.wood[1]),
    );
    set(6, 9, [255, 255, 255]);
    void line;
  }
