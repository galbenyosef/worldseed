// index-inline-2 52 — math
// Lines 19883-20222 of readable/index-inline-2.pretty.js (statement-aligned).
  function paintBroadleaf(g, rnd, snow) {
    const H = spriteHeightPx(g);
    const flatK = g.shape === "wide" ? 0.75 : g.shape === "flat" ? 0.42 : 1;
    const tallK = g.shape === "tall" ? 1.35 : 1;
    const T = layoutTree(g, rnd, H, g.clump, flatK, tallK);
    const P = painter(T.W, H);
    for (const s of T.segs) limb(P, s.x0, s.y0, s.x1, s.y1, s.w0, s.w1);
    if (g.buttress) {
      const b = T.segs[0];
      for (let k = 0; k < 5; k++)
        limb(
          P,
          b.x0 + (k - 2) * b.w0 * 0.9,
          H - 1,
          b.x0,
          H - 1 - H * 0.12,
          1.2,
          1,
        );
    }
    foliage(P, T.clumps, rnd, {
      fill: g.fill,
      snow,
      bloom: g.bloom,
      cluster: H > 60 ? 3.8 : 3.1,
    });
    if (g.shape === "droop") {
      // hanging curtains of leaves from the lower half of the crown
      for (const c of T.clumps)
        for (let k = 0; k < 4; k++) {
          const x = c.x + (rnd() - 0.5) * c.rx * 1.8,
            y0 = c.y + c.ry * 0.3,
            len = H * (0.18 + rnd() * 0.25);
          for (let s = 0; s < len; s++) {
            const xx = x + Math.sin(s / 5 + k) * 0.8;
            if (rnd() < 0.85) P.set(xx, y0 + s, LEAF[s / len < 0.4 ? 3 : 2]);
          }
        }
    }
    if (g.vines) {
      for (const c of T.clumps)
        if (rnd() < g.vines) {
          const x = c.x + (rnd() - 0.5) * c.rx,
            len = H * (0.12 + rnd() * 0.25);
          for (let s = 0; s < len; s++)
            if (rnd() < 0.9)
              P.set(
                x + Math.sin(s / 4) * 0.6,
                c.y + c.ry * 0.6 + s,
                LEAF[s % 5 === 0 ? 2 : 1],
              );
        }
    }
    outline(P);
    return P;
  }

  function paintConifer(g, rnd, snow) {
    const H = spriteHeightPx(g);
    const W = Math.max(8, Math.round(H * g.girth * 2 * 1.08) + 4);
    const P = painter(W, H);
    const cx = W / 2 + g.lean * 2;
    const base = Math.round(H * g.trunk),
      top = 1;
    limb(P, cx, H - 1, cx, H - 1 - H * 0.5, Math.max(1, H / 34), 1);
    const tiers = g.tiers,
      bandH = (H - 1 - base - top) / tiers;
    const seed = (rnd() * 1e6) | 0;
    for (let y = top; y < H - base; y++) {
      const t = (y - top) / (H - base - top); // 0 at the tip, 1 at the lowest tier
      const within = ((y - top) % bandH) / bandH; // 0 top of a tier, 1 bottom
      let w;
      if (g.shape === "round") w = Math.sqrt(Math.max(0, t)) * (1 - 0.35 * t);
      else if (g.shape === "spire") w = Math.pow(t, 1.15) * 0.85;
      else w = t;
      const tierK =
        g.shape === "layered" ? 0.45 + 0.55 * within : 0.72 + 0.28 * within;
      const half = Math.max(0.6, w * H * g.girth * tierK);
      for (
        let x = Math.floor(cx - half - 1);
        x <= Math.ceil(cx + half + 1);
        x++
      ) {
        const dx = (x - cx) / (half + 0.01);
        const yy = y + g.droop * dx * dx * bandH * 0.6; // drooping tier edges
        if (Math.abs(dx) > 1 + (h2(x, y, seed) - 0.5) * 0.3) continue;
        if (g.shape === "layered" && within > 0.92 && Math.abs(dx) > 0.2)
          continue;
        let l =
          0.5 -
          0.55 * dx -
          0.9 * (within - 0.5) +
          (h2(x, y, seed + 2) - 0.5) * 0.4 +
          (bay(x, y) - 0.5) * 0.25;
        if ((x + y * 2) % 3 === 0 && within > 0.3) l -= 0.25; // needle strokes
        const k = l > 0.85 ? 4 : l > 0.35 ? 3 : l > -0.1 ? 2 : 1;
        let c = LEAF[k];
        if (snow && within < 0.35 && h2(x, y, seed + 4) < 0.85)
          c = SNOWE[k >= 3 ? 4 : 3];
        P.set(x, Math.round(yy), c);
      }
    }
    outline(P);
    return P;
  }

  function paintPalm(g, rnd) {
    const H = spriteHeightPx(g);
    const L = H * g.frond;
    const W = Math.max(12, Math.round(L * 2.2 + H * g.bend * 0.3) + 6);
    const P = painter(W, H);
    const cx = W / 2,
      trunkTop = Math.round(H * 0.3);
    const side = rnd() < 0.5 ? -1 : 1;
    const tx = (t) =>
      cx + side * g.bend * H * 0.14 * Math.sin((t * Math.PI) / 2) * t;
    // ringed trunk
    for (let y = H - 1; y >= trunkTop; y--) {
      const t = (H - 1 - y) / (H - 1 - trunkTop),
        x = tx(t),
        w = 2.6 - t * 0.9;
      for (let dx = -1; dx <= Math.ceil(w) - 1; dx++)
        P.set(
          x + dx,
          y,
          WOOD[(Math.floor(y / 2) % 2 ? 2 : 3) - (dx > 0 ? 1 : 0)],
        );
    }
    const topX = tx(1),
      topY = trunkTop;
    if (g.fruit)
      for (let k = 0; k < 5; k++)
        P.set(topX - 1 + (k % 3), topY + 2 + (k >> 1), ACC[k % 2 ? 1 : 2]);
    // fronds: back ones first; each arcs up and out, then hangs, with leaflets
    const fr = [];
    for (let i = 0; i < g.fronds; i++)
      fr.push((i / g.fronds) * Math.PI * 2 + rnd() * 0.4);
    fr.sort((a, b) => Math.sin(a) - Math.sin(b));
    for (const phi of fr) {
      const front = Math.sin(phi),
        ex = Math.cos(phi);
      const len = L * (0.85 + rnd() * 0.25);
      const lev = front > 0.3 ? 3 : front > -0.3 ? 2 : 1;
      const n = Math.ceil(len * 1.6);
      for (let s = 1; s <= n; s++) {
        const t = s / n;
        const reach = len * t * (0.35 + 0.65 * Math.abs(ex));
        const x = topX + Math.sign(ex || 1) * reach;
        const rise = len * (0.5 * t - (0.45 + 0.8 * g.droop) * t * t);
        const y =
          topY -
          rise * (0.7 + 0.3 * Math.abs(ex)) +
          (1 - Math.abs(ex)) * len * 0.25 * t;
        P.set(x, y, LEAF[Math.min(4, lev + (t < 0.25 ? 1 : 0))]);
        // leaflets hang from the rib on both sides
        const ll = Math.max(1, (1 - t * 0.7) * H * 0.07 + 1);
        if (s % 2 === 0)
          for (let q = 1; q <= ll; q++) {
            const o = Math.sign(ex || 1) * q * 0.35;
            P.set(
              x + o,
              y + q,
              LEAF[Math.max(1, lev - (q > ll * 0.6 ? 1 : 0))],
            );
            P.set(x - o * 0.6, y + q * 0.9, LEAF[Math.max(1, lev - 1)]);
          }
      }
    }
    // a tuft of young fronds pointing up
    for (let k = -1; k <= 1; k++)
      for (let s = 0; s < H * 0.06; s++)
        P.set(topX + k * (s * 0.5), topY - s, LEAF[3]);
    outline(P);
    return P;
  }

  function paintSnag(g, rnd) {
    const H = spriteHeightPx(g);
    const T = layoutTree(g, rnd, H, 0.4);
    const P = painter(T.W, H);
    for (const s of T.segs) {
      const k = s.d > 0 && rnd() < 0.3 ? 0.5 : 1; // some limbs are broken off halfway
      limb(
        P,
        s.x0,
        s.y0,
        s.x0 + (s.x1 - s.x0) * k,
        s.y0 + (s.y1 - s.y0) * k,
        s.w0,
        s.w1,
      );
    }
    outline(P);
    return P;
  }

  function paintShrub(g, rnd, snow) {
    const H = spriteHeightPx(g);
    const W = Math.round(H * (1.25 + g.flat * 0.5)) + 2;
    const P = painter(W, H);
    const clumps = [];
    for (let i = 0; i < g.clumps; i++) {
      const t = g.clumps === 1 ? 0 : i / (g.clumps - 1) - 0.5;
      const r = H * (0.26 + rnd() * 0.12);
      clumps.push({
        x: W / 2 + t * (W - 2 * r - 2) + (rnd() - 0.5) * 2,
        y: H - 1 - r * g.flat * (0.9 + rnd() * 0.5),
        rx: r,
        ry: r * g.flat,
      });
    }
    clumps.push({
      x: W / 2,
      y: H - 1 - H * 0.55,
      rx: H * 0.3,
      ry: H * 0.3 * g.flat,
    });
    if (g.leaf.mat === "SAVANNA")
      for (let k = 0; k < 7; k++)
        limb(
          P,
          W / 2,
          H - 1,
          W / 2 + (rnd() - 0.5) * W * 0.8,
          H * (0.2 + rnd() * 0.3),
          1,
          1,
        );
    foliage(P, clumps, rnd, {
      fill: g.fill,
      snow,
      bloom: g.bloom,
      cluster: 2.6,
    });
    if (g.berries)
      for (let k = 0; k < 8; k++) {
        const x = (rnd() * W) | 0,
          y = (H * (0.2 + rnd() * 0.6)) | 0;
        if (P.get(x, y)) P.set(x, y, ACC[k % 2 ? 2 : 3]);
      }
    outline(P);
    return P;
  }

  function paintSucculent(g, rnd) {
    const H = spriteHeightPx(g);
    if (g.shape === "rosette") {
      const W = Math.round(H * 1.8) + 2,
        P = painter(W, H);
      const n = 9 + ((rnd() * 5) | 0);
      for (let i = 0; i < n; i++) {
        const a = Math.PI * (0.1 + (0.8 * i) / (n - 1)) + (rnd() - 0.5) * 0.15,
          len = (H * (0.75 + rnd() * 0.3)) / Math.max(0.35, Math.sin(a));
        const L = Math.min(len, W * 0.5);
        for (let s = 0; s < L; s++) {
          const t = s / L,
            w = (1 - t) * 1.6;
          for (let q = -w; q <= w; q += 1)
            P.set(
              W / 2 + Math.cos(a) * s + q * Math.sin(a) * 0.5,
              H - 1 - Math.sin(a) * s,
              LEAF[Math.cos(a) > 0.2 ? 2 : 3],
            );
        }
      }
      outline(P);
      return P;
    }
    const W =
      g.shape === "paddle"
        ? Math.round(H * 1.1) + 2
        : g.shape === "barrel"
          ? Math.round(H * 0.95) + 2
          : Math.round(H * 0.75) + 2;
    const P = painter(W, H);
    const body = (x0, y0, x1, y1, round = 1) => {
      // a ribbed, rounded body lit from the left
      const cx = (x0 + x1) / 2,
        rx = (x1 - x0) / 2,
        cy = (y0 + y1) / 2,
        ry = (y1 - y0) / 2;
      for (let y = Math.floor(y0); y <= Math.ceil(y1); y++)
        for (let x = Math.floor(x0); x <= Math.ceil(x1); x++) {
          const dx = (x - cx) / (rx + 0.01),
            dy = (y - cy) / (ry + 0.01);
          const inside = round
            ? dx * dx + dy * dy <= 1
            : Math.abs(dx) <= 1 &&
              y - y0 >= rx * (1 - Math.sqrt(Math.max(0, 1 - dx * dx)));
          if (!inside) continue;
          const l =
            0.5 -
            0.7 * dx -
            0.3 * dy +
            (g.ribs && (x - Math.floor(x0)) % 3 === 0 ? -0.35 : 0) +
            (bay(x, y) - 0.5) * 0.2;
          P.set(x, y, LEAF[l > 0.8 ? 4 : l > 0.35 ? 3 : l > -0.1 ? 2 : 1]);
        }
    };
    if (g.shape === "barrel") body(1, H * 0.12, W - 2, H - 1);
    else if (g.shape === "paddle") {
      const pads = 3 + ((rnd() * 4) | 0);
      body(W / 2 - H * 0.2, H * 0.45, W / 2 + H * 0.2, H - 1);
      for (let k = 0; k < pads; k++) {
        const x = W * (0.2 + rnd() * 0.6),
          y = H * (0.1 + rnd() * 0.45),
          r = H * (0.12 + rnd() * 0.08);
        body(x - r, y - r * 1.3, x + r, y + r * 1.3);
      }
    } else {
      const cw = Math.max(2.5, W * 0.22);
      body(W / 2 - cw, 0, W / 2 + cw, H - 1, 0);
      for (let k = 0; k < g.arms; k++) {
        const s = k % 2 ? 1 : -1,
          ay = H * (0.35 + rnd() * 0.3),
          ax = W / 2 + s * cw * 2.3,
          top = ay - H * (0.15 + rnd() * 0.2);
        for (let x = Math.min(W / 2, ax); x <= Math.max(W / 2, ax); x++)
          for (let q = 0; q < cw; q++) P.set(x, ay + q, LEAF[2]);
        body(ax - cw * 0.8, top, ax + cw * 0.8, ay + cw, 0);
      }
    }
    if (g.flowers)
      for (let k = 0; k < 5; k++) {
        const x = (W / 2 + (rnd() - 0.5) * W * 0.5) | 0;
        for (let y = 0; y < H; y++)
          if (P.get(x, y)) {
            P.set(x, y - 1, PETAL[3]);
            break;
          }
      }
    for (let k = 0; k < W * H * 0.04; k++) {
      const x = (rnd() * W) | 0,
        y = (rnd() * H) | 0;
      if (P.get(x, y)) P.set(x, y, ACC[3]);
    } // spines
    outline(P);
    return P;
  }

