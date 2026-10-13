// index-inline-2 53 — rnd
// Lines 20223-20527 of readable/index-inline-2.pretty.js (statement-aligned).
  function paintFern(g, rnd) {
    const H = spriteHeightPx(g);
    const W = Math.round(H * 2) + 2,
      P = painter(W, H);
    for (let i = 0; i < g.fronds; i++) {
      const a = Math.PI * (0.12 + (0.76 * (i + rnd() * 0.5)) / g.fronds);
      const len = H * (0.9 + rnd() * 0.4);
      const n = Math.ceil(len * 1.3);
      for (let s = 0; s <= n; s++) {
        const t = s / n;
        const x = W / 2 + Math.cos(a) * len * t,
          y = H - 1 - Math.sin(a) * len * t * (1 - g.curl * t * 0.8);
        const lv = Math.cos(a) < -0.2 ? 3 : 2;
        P.set(x, y, LEAF[lv]);
        if (s % 2 === 0) {
          const ll = (1 - t) * 3 + 0.5;
          for (let q = 1; q <= ll; q++) {
            P.set(x - q * 0.4, y - q * 0.6, LEAF[Math.min(4, lv + 1)]);
            P.set(x + q * 0.5, y + q * 0.4, LEAF[lv - 1]);
          }
        }
      }
    }
    outline(P, 0.6, true);
    return P;
  }

  function paintGrass(g, rnd) {
    const H = spriteHeightPx(g);
    const W = Math.round(H * 1.5) + 2,
      P = painter(W, H);
    for (let k = 0; k < g.blades; k++) {
      const x0 = W * 0.18 + (W * 0.64 * (k + rnd())) / g.blades,
        h = H * (0.45 + rnd() * 0.55);
      const lean = ((x0 - W / 2) / W) * 1.2 + (rnd() - 0.5) * 0.5;
      for (let s = 0; s < h; s++) {
        const t = s / h,
          x = x0 + lean * s + g.bend * lean * t * t * h * 0.6;
        P.set(x, H - 1 - s, LEAF[t > 0.75 ? 4 : t > 0.4 ? 3 : 2]);
      }
      if (g.seeds && rnd() < 0.5) {
        const x = x0 + lean * h + g.bend * lean * h * 0.6;
        P.set(x, H - 1 - h, ACC[4]);
        P.set(x, H - h, ACC[2]);
      }
    }
    return P; // grass stays outline-free so it melts into the ground
  }

  function paintFlower(g, rnd) {
    const H = spriteHeightPx(g);
    const W = Math.round(H * 1.4) + 4,
      P = painter(W, H);
    for (let k = 0; k < g.stems; k++) {
      const x0 = W * 0.2 + (W * 0.6 * (k + rnd())) / g.stems,
        h = H * (0.5 + rnd() * 0.45),
        lean = (rnd() - 0.5) * 0.4;
      for (let s = 0; s < h; s++)
        P.set(x0 + lean * s, H - 1 - s, LEAF[s < 2 ? 1 : 2]);
      if (rnd() < 0.7) {
        P.set(x0 - 1, H - 2, LEAF[3]);
        P.set(x0 + 1, H - 3, LEAF[3]);
      }
      const x = Math.round(x0 + lean * h),
        y = Math.round(H - 1 - h);
      const C = k % 3 === 2 ? ACC : PETAL,
        dk = C[1],
        c = C[2],
        hi = C[4],
        mid = STEM[3];
      switch (g.head) {
        case "dot":
          P.set(x, y, c);
          P.set(x + 1, y, dk);
          P.set(x, y - 1, hi);
          break;
        case "cross":
          P.set(x, y, mid);
          P.set(x - 1, y, c);
          P.set(x + 1, y, dk);
          P.set(x, y - 1, hi);
          P.set(x, y + 1, dk);
          break;
        case "star":
          for (const [a, b] of [
            [0, -1],
            [-1, 0],
            [1, 0],
            [-1, 1],
            [1, 1],
          ])
            P.set(x + a, y + b, c);
          P.set(x, y, mid);
          P.set(x, y - 1, hi);
          break;
        case "bell":
          P.set(x + 1, y, LEAF[2]);
          P.set(x + 1, y + 1, c);
          P.set(x + 2, y + 1, dk);
          P.set(x + 1, y + 2, c);
          P.set(x + 2, y + 2, dk);
          P.set(x + 1, y + 3, hi);
          break;
        default:
          P.set(x - 1, y - 1, c);
          P.set(x + 1, y - 1, dk);
          P.set(x - 1, y, c);
          P.set(x, y, hi);
          P.set(x + 1, y, dk);
          P.set(x, y + 1, c);
          break;
      }
    }
    return P;
  }

  function paintReed(g, rnd) {
    const H = spriteHeightPx(g);
    const W = Math.round(H * 0.8) + 2,
      P = painter(W, H);
    for (let k = 0; k < g.blades; k++) {
      const x0 = W * 0.2 + (W * 0.6 * (k + rnd())) / g.blades,
        h = H * (0.55 + rnd() * 0.45),
        sway = (rnd() - 0.5) * 2;
      for (let s = 0; s < h; s++) {
        const t = s / h;
        P.set(
          x0 + sway * t * t * 3,
          H - 1 - s,
          (k % 2 ? STEM : LEAF)[t > 0.7 ? 3 : 2],
        );
      }
      if (g.heads && k % 3 === 0) {
        const x = x0 + sway * 3,
          y = H - 1 - h * 0.85;
        for (let q = 0; q < 4; q++) {
          P.set(x, y + q, ACC[2]);
          P.set(x + 1, y + q, ACC[1]);
        }
      }
    }
    outline(P, 0.5, true);
    return P;
  }

  function paintCap(g, rnd) {
    const H = spriteHeightPx(g);
    const W = Math.round(H * (g.giant ? 1.0 : 1.5)) + 2,
      P = painter(W, H);
    const n = g.cluster;
    for (let k = 0; k < n; k++) {
      const s = n === 1 ? 1 : 0.55 + rnd() * 0.45;
      const cx = n === 1 ? W / 2 : W * (0.25 + (0.5 * (k + rnd() * 0.5)) / n),
        h = (H - 1) * s;
      const capR = W * (g.giant ? 0.46 : 0.26) * s,
        capH =
          h * (g.shape === "flat" ? 0.18 : g.shape === "cone" ? 0.5 : 0.36);
      const sw = Math.max(1, capR * (g.giant ? 0.3 : 0.35));
      for (let y = H - 1; y > H - 1 - h + capH * 0.6; y--)
        for (let x = Math.floor(cx - sw); x <= Math.ceil(cx + sw); x++) {
          const d = (x - cx) / sw;
          P.set(x, y, WOOD[d < -0.4 ? 4 : d > 0.4 ? 2 : 3]);
        }
      const cy = H - 1 - h + capH;
      for (let y = Math.floor(cy - capH); y <= Math.ceil(cy); y++)
        for (let x = Math.floor(cx - capR); x <= Math.ceil(cx + capR); x++) {
          const dx = (x - cx) / capR,
            dy = (cy - y) / capH;
          let inside;
          if (g.shape === "cone") inside = dy >= 0 && dy <= 1 - Math.abs(dx);
          else if (g.shape === "bell")
            inside =
              dy >= 0 &&
              dx * dx + dy * dy <= 1 &&
              !(dy < 0.15 && Math.abs(dx) < 0.75);
          else inside = dy >= 0 && dx * dx + dy * dy <= 1;
          if (!inside) continue;
          const l =
            0.55 - 0.6 * dx + 0.5 * (dy - 0.5) + (bay(x, y) - 0.5) * 0.25;
          let c = LEAF[l > 0.85 ? 4 : l > 0.4 ? 3 : l > 0 ? 2 : 1];
          if (g.spots && h2(x >> 1, y >> 1, k + 5) < 0.12 && dy > 0.2)
            c = ACC[3];
          P.set(x, y, c);
        }
      for (
        let x = Math.floor(cx - capR * 0.85);
        x <= Math.ceil(cx + capR * 0.85);
        x++
      )
        P.set(x, cy + 1, LEAF[0]); // gills
    }
    outline(P);
    return P;
  }

  function paintStone(g, rnd, snow) {
    const H = spriteHeightPx(g);
    const tall = g.shape === "spire";
    const W = tall
      ? Math.round(H * 0.6) + 2
      : Math.round(
          H * (g.shape === "slab" ? 2.2 : g.shape === "pile" ? 1.9 : 1.45),
        ) + 2;
    const P = painter(W, H);
    const rocks = g.shape === "pile" ? 3 : 1;
    for (let k = 0; k < rocks; k++) {
      const s = rocks === 1 ? 1 : 0.55 + rnd() * 0.3;
      const rx = (W / 2 - 1) * s,
        ry = (H - 1) * (tall ? 1 : g.shape === "slab" ? 0.55 : 0.85) * s;
      const cx =
          rocks === 1
            ? W / 2
            : W * (0.3 + (0.4 * k) / (rocks - 1)) + (rnd() - 0.5) * 2,
        by = H - 1;
      const fac = [];
      for (let f = 0; f < 6; f++)
        fac.push({
          x: cx + (rnd() - 0.5) * rx * 1.4,
          y: by - rnd() * ry,
          nx: (rnd() - 0.5) * 1.2,
          ny: -rnd(),
        });
      const nv = 9,
        verts = [];
      for (let v = 0; v < nv; v++) verts.push(0.8 + rnd() * 0.3);
      for (let y = Math.floor(by - ry); y <= by; y++)
        for (let x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x++) {
          const dx = (x - cx) / rx,
            dy = (by - y) / ry;
          const a = Math.atan2(dy, dx),
            rr = Math.hypot(dx, dy);
          const vi = (((a / Math.PI + 1) / 2) * nv) % nv,
            v0 = Math.floor(vi),
            fr = vi - v0;
          const lim = verts[v0] * (1 - fr) + verts[(v0 + 1) % nv] * fr;
          if (dy < 0 || rr > (tall ? 1.3 : lim)) continue;
          if (tall && Math.abs(dx) > 0.75 + 0.2 * Math.sin(dy * 9 + k))
            continue;
          let bf = 0,
            bd = 1e9;
          for (let f = 0; f < fac.length; f++) {
            const d = (x - fac[f].x) ** 2 + (y - fac[f].y) ** 2;
            if (d < bd) {
              bd = d;
              bf = f;
            }
          }
          const F = fac[bf];
          let l =
            0.35 -
            0.55 * F.nx -
            0.36 * F.ny -
            0.4 * dx +
            0.35 * dy +
            (bay(x, y) - 0.5) * 0.2;
          if (tall && y % 5 === 0) l -= 0.3; // strata
          const lv = l > 0.8 ? 4 : l > 0.35 ? 3 : l > -0.05 ? 2 : 1;
          let c = LEAF[lv];
          if (g.moss && dy > 0.45 && h2(x, y, 3) < g.moss * (dy - 0.3))
            c = STEM[l > 0.3 ? 3 : 2];
          if (snow && dy > 0.55 && h2(x, y, 9) < 0.9)
            c = SNOWE[l > 0.3 ? 4 : 3];
          P.set(x, y, c);
        }
    }
    outline(P);
    return P;
  }

  function paintPlant(g, seed, snow = false) {
    const rnd = mulberry32(seed >>> 0);
    switch (g.form) {
      case "broadleaf":
      case "umbrella":
        return paintBroadleaf(g, rnd, snow);
      case "conifer":
        return paintConifer(g, rnd, snow);
      case "palm":
        return paintPalm(g, rnd);
      case "snag":
        return paintSnag(g, rnd);
      case "shrub":
        return paintShrub(g, rnd, snow);
      case "succulent":
        return paintSucculent(g, rnd);
      case "fern":
        return paintFern(g, rnd);
      case "grass":
        return paintGrass(g, rnd);
      case "flower":
        return paintFlower(g, rnd);
      case "reed":
        return paintReed(g, rnd);
      case "cap":
        return paintCap(g, rnd);
      default:
        return paintStone(g, rnd, snow);
    }
  }

  // ---------- parts for the 3D trees: leaf clumps and palm fronds ----------
  // A clump is a ball of leaf clusters; the GPU adds the sun on top.
  // A clump of leaves for a 3D crown: separate leaves with gaps between them, so up close you
  // see branches, other clumps and sky through a tree. The gaps are marked as holes: far away,
  // where a gap would be smaller than a pixel, they fill in with the crown's shaded depth.
