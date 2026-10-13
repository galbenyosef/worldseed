// index-inline-2 17 — math
// Lines 5682-6405 of readable/index-inline-2.pretty.js (statement-aligned).
  function cavePlan(seed, opts = {}) {
    const rnd = mulberry32((seed ^ 0xca7e) >>> 0);
    const R = (a, b) => a + rnd() * (b - a);
    const big = rnd();
    // ---- the worms: a main passage and its branches, as points with a radius and a floor ----
    const pts = [];
    const rooms = [];
    const worm = (x, z, ang, len, r0, y0, slope, tag) => {
      const out = [];
      let a = ang,
        y = y0,
        turn = 0;
      for (let t = 0; t < len; t += 0.7) {
        // (a mine is dug straight, where it can be)
        turn += (rnd() - 0.5) * (opts.mine ? 0.045 : 0.12);
        turn *= 0.9;
        // keep going into the hill: a passage that turns back towards the outside is bent away again
        if (Math.cos(a) < 0.35) turn -= Math.sin(a) * 0.04;
        if (z > -9 && t > 2) turn -= Math.sin(a) * 0.05;
        a += turn;
        x += Math.sin(a) * 0.7;
        z -= Math.cos(a) * 0.7;
        y -= slope * 0.7 * (0.5 + rnd());
        // wide enough to walk everywhere, narrower and wider by turns
        const r = Math.max(
          1.05,
          r0 *
            (0.8 + 0.4 * Math.sin(t * 0.21 + (seed % 7))) *
            (0.9 + rnd() * 0.2),
        );
        const p = { x, z, r, y, tag, t };
        pts.push(p);
        out.push(p);
      }
      return out;
    };
    const room = (x, z, r, y, kind) => {
      const rm = {
        x,
        z,
        r: opts.mine ? Math.min(r, R(3.4, 4.6)) : r,
        y,
        kind,
        h: opts.mine ? R(3.2, 4.2) : R(4.5, 7.5) + r * 0.35,
      };
      rooms.push(rm);
      return rm;
    };
    // the main passage: in from the mouth, then wherever it goes (mostly further in)
    const mainLen = 45 + big * 70;
    const main = worm(
      0,
      -0.5,
      (rnd() - 0.5) * 0.4,
      mainLen,
      R(1.5, 1.9),
      0,
      R(0.03, 0.08),
      "main",
    );
    // chambers along it
    const nRooms = 2 + Math.floor(big * 3);
    for (let k = 0; k < nRooms; k++) {
      const p =
        main[
          Math.min(
            main.length - 1,
            Math.floor((0.25 + (0.75 * (k + 1)) / nRooms) * main.length) - 1,
          )
        ];
      room(
        p.x,
        p.z,
        R(4.5, 7.5) + big * 2.5,
        p.y,
        k === nRooms - 1 ? "deep" : "hall",
      );
    }
    // side passages from the main one, each ending in a small chamber
    const nBranch = 1 + Math.floor(rnd() * (2 + big * 2));
    for (let k = 0; k < nBranch; k++) {
      const p = main[Math.floor(R(0.2, 0.85) * main.length)];
      const side = rnd() < 0.5 ? -1 : 1;
      // the branch leaves at a good angle from the main passage's way
      const j = main.indexOf(p),
        q = main[Math.min(main.length - 1, j + 2)];
      const ang = Math.atan2(q.x - p.x, -(q.z - p.z)) + side * R(0.9, 1.6);
      const b = worm(
        p.x,
        p.z,
        ang,
        R(14, 34),
        R(1.1, 1.5),
        p.y,
        R(-0.02, 0.06),
        "branch",
      );
      const e = b[b.length - 1];
      room(e.x, e.z, R(3, 5), e.y, "nook");
    }
    // ---- carve the grid ----
    let x0 = 1e9,
      x1 = -1e9,
      z0 = 1e9,
      z1 = -1e9;
    for (const p of pts) {
      x0 = Math.min(x0, p.x - p.r);
      x1 = Math.max(x1, p.x + p.r);
      z0 = Math.min(z0, p.z - p.r);
      z1 = Math.max(z1, p.z + p.r);
    }
    for (const r of rooms) {
      x0 = Math.min(x0, r.x - r.r);
      x1 = Math.max(x1, r.x + r.r);
      z0 = Math.min(z0, r.z - r.r);
      z1 = Math.max(z1, r.z + r.r);
    }
    const ox = Math.floor(x0) - 3,
      oz = Math.floor(z0) - 3;
    const W = Math.ceil(x1) - ox + 4,
      H = Math.ceil(Math.max(z1, 1)) - oz + 4;
    const N = W * H;
    const carved = new Uint8Array(N),
      fl = new Float32Array(N).fill(1e9),
      ch = new Float32Array(N),
      zone = new Int16Array(N).fill(-1);
    const cellAt = (x, z) => {
      const i = Math.floor(x - ox),
        j = Math.floor(z - oz);
      return i < 0 || j < 0 || i >= W || j >= H ? -1 : j * W + i;
    };
    const dig = (cx, cz, r, y, h, zn) => {
      for (let j = Math.floor(cz - r - oz); j <= Math.ceil(cz + r - oz); j++)
        for (
          let i = Math.floor(cx - r - ox);
          i <= Math.ceil(cx + r - ox);
          i++
        ) {
          if (i < 1 || j < 1 || i >= W - 1 || j >= H - 1) continue;
          const x = i + ox + 0.5,
            z = j + oz + 0.5,
            d = Math.hypot(x - cx, z - cz);
          if (d > r) continue;
          // the face of the hill: only the mouth opens through it, and nothing is dug beyond it
          if (z > 0.6 || (z > -1.2 && Math.abs(x) > 2.3)) continue;
          const k = j * W + i;
          if (!carved[k] || y < fl[k]) fl[k] = y;
          ch[k] = Math.max(ch[k], h);
          if (zn >= 0 && (zone[k] < 0 || d < r * 0.7)) zone[k] = zn;
          carved[k] = 1;
        }
    };
    for (const p of pts) dig(p.x, p.z, p.r, p.y, 2.7 + p.r * 0.35, -1);
    rooms.forEach((rm, n) => {
      // chambers are not round: two or three overlapping lobes
      dig(rm.x, rm.z, rm.r, rm.y, rm.h, n);
      for (let k = 0; k < 2; k++) {
        const a = rnd() * 6.28,
          d = rm.r * 0.55;
        dig(
          rm.x + Math.cos(a) * d,
          rm.z + Math.sin(a) * d,
          rm.r * R(0.5, 0.75),
          rm.y + R(-0.3, 0.4),
          rm.h * 0.8,
          n,
        );
      }
    });
    // the mouth: a straight short way out to z = 0, open to the outside
    for (let z = -3; z <= 0.5; z += 0.5) dig(0, z, 1.7, 0, 3.0, -1);
    // distance from each carved cell to the nearest wall (for domed ceilings and where things stand)
    const dist = new Float32Array(N).fill(0);
    {
      const q = [];
      for (let k = 0; k < N; k++) {
        if (!carved[k]) {
          dist[k] = 0;
          continue;
        }
        const i = k % W,
          j = (k / W) | 0;
        const edge =
          !carved[k - 1] || !carved[k + 1] || !carved[k - W] || !carved[k + W];
        dist[k] = edge ? 0.5 : 1e9;
        if (edge) q.push(k);
      }
      for (let h = 0; h < q.length; h++) {
        const k = q[h];
        for (const nb of [k - 1, k + 1, k - W, k + W]) {
          if (nb < 0 || nb >= N || !carved[nb]) continue;
          if (dist[nb] > dist[k] + 1) {
            dist[nb] = dist[k] + 1;
            q.push(nb);
          }
        }
      }
    }
    // ---- heights at the grid's corners: floors with a little roughness, ceilings that dome ----
    const VW = W + 1,
      VH = H + 1;
    const vf = new Float32Array(VW * VH),
      vc = new Float32Array(VW * VH),
      vjx = new Float32Array(VW * VH),
      vjz = new Float32Array(VW * VH);
    const noise = (x, z, s) => {
      const a = Math.sin(x * 12.9898 + z * 78.233 + s) * 43758.5453;
      return a - Math.floor(a);
    };
    for (let j = 0; j < VH; j++)
      for (let i = 0; i < VW; i++) {
        let f = 0,
          c = 0,
          n = 0,
          wall = false,
          d = 0;
        for (const [di, dj] of [
          [-1, -1],
          [0, -1],
          [-1, 0],
          [0, 0],
        ]) {
          const ii = i + di,
            jj = j + dj;
          if (ii < 0 || jj < 0 || ii >= W || jj >= H) {
            wall = true;
            continue;
          }
          const k = jj * W + ii;
          if (!carved[k]) {
            wall = true;
            continue;
          }
          f += fl[k];
          c += ch[k];
          d += dist[k];
          n++;
        }
        const v = j * VW + i,
          x = i + ox,
          z = j + oz;
        if (!n) {
          vf[v] = 0;
          vc[v] = 0;
          continue;
        }
        f /= n;
        c /= n;
        d /= n;
        // floors rise a little towards the walls; ceilings come down to meet them (the rock as it is
        // drawn rounds both off, and roughens them)
        const bowl = wall ? 0.22 : Math.max(0, 0.16 - d * 0.05);
        vf[v] = f + bowl + (noise(x, z, seed) - 0.5) * 0.12;
        const dome = Math.min(1, (d + (wall ? 0 : 0.5)) / 3.2);
        vc[v] =
          f +
          c * (0.45 + 0.55 * Math.sqrt(dome)) +
          (noise(x, z, seed + 7) - 0.5) * 0.16;
        if (wall) vc[v] = Math.max(vc[v], vf[v] + 1.2);
      }
    // ---- the walls: the cells' staircase smoothed into slopes and curves, then roughened ----
    // a corner of the grid is on the wall when rock and hollow both touch it; the wall's edges join them
    const nbr = new Array(VW * VH).fill(null);
    const link = (a, b) => {
      (nbr[a] = nbr[a] || []).push(b);
      (nbr[b] = nbr[b] || []).push(a);
    };
    const cv = (i, j) =>
      i >= 0 && j >= 0 && i < W && j < H && carved[j * W + i] ? 1 : 0;
    const edges = [];
    for (let j = 0; j <= H; j++)
      for (let i = 0; i <= W; i++) {
        // the edge from corner (i, j) to (i + 1, j) has cells (i, j - 1) and (i, j) either side; (i, j)-(i, j + 1) has (i - 1, j) and (i, j)
        if (i < W && cv(i, j - 1) !== cv(i, j)) {
          link(j * VW + i, j * VW + i + 1);
          edges.push(j * VW + i, j * VW + i + 1);
        }
        if (j < H && cv(i - 1, j) !== cv(i, j)) {
          link(j * VW + i, (j + 1) * VW + i);
          edges.push(j * VW + i, (j + 1) * VW + i);
        }
      }
    const sx = new Float32Array(VW * VH),
      sz = new Float32Array(VW * VH);
    for (let j = 0; j < VH; j++)
      for (let i = 0; i < VW; i++) {
        sx[j * VW + i] = i + ox;
        sz[j * VW + i] = j + oz;
      }
    for (let it = 0; it < 3; it++) {
      const nx = sx.slice(),
        nz = sz.slice();
      for (let v = 0; v < nbr.length; v++) {
        const n = nbr[v];
        if (!n || n.length !== 2) continue;
        nx[v] = sx[v] * 0.5 + (sx[n[0]] + sx[n[1]]) * 0.25;
        nz[v] = sz[v] * 0.5 + (sz[n[0]] + sz[n[1]]) * 0.25;
      }
      sx.set(nx);
      sz.set(nz);
    }
    for (let j = 0; j < VH; j++)
      for (let i = 0; i < VW; i++) {
        const v = j * VW + i;
        if (!nbr[v]) continue;
        const x = i + ox,
          z = j + oz;
        let jx = sx[v] - x + (noise(x, z, seed + 11) - 0.5) * 0.16,
          jz = sz[v] - z + (noise(x, z, seed + 13) - 0.5) * 0.16;
        // never so far that a wall of rock between two passages could close up or turn inside out
        const m = Math.hypot(jx, jz);
        if (m > 0.36) {
          jx *= 0.36 / m;
          jz *= 0.36 / m;
        }
        vjx[v] = jx;
        vjz[v] = jz;
      }
    // the wall's edges by row, for telling inside the hollow from inside the rock (count the walls crossed going east)
    const rowEdges = Array.from({ length: H }, () => []);
    for (let k = 0; k < edges.length; k += 2) {
      const a = edges[k],
        b = edges[k + 1];
      const za = Math.floor(a / VW) + oz + vjz[a],
        zb = Math.floor(b / VW) + oz + vjz[b];
      for (
        let j = Math.max(0, Math.floor(Math.min(za, zb) - oz));
        j <= Math.min(H - 1, Math.floor(Math.max(za, zb) - oz));
        j++
      )
        rowEdges[j].push(k);
    }
    // the wall's edges by cell, to find the ones near a point quickly
    const egrid = new Array(N).fill(null);
    for (let k = 0; k < edges.length; k += 2)
      for (const v of [edges[k], edges[k + 1]]) {
        const i0 = v % VW,
          j0 = (v / VW) | 0;
        for (let dj = -2; dj <= 1; dj++)
          for (let di = -2; di <= 1; di++) {
            const i = i0 + di,
              j = j0 + dj;
            if (i < 0 || j < 0 || i >= W || j >= H) continue;
            const c = j * W + i,
              L = egrid[c] || (egrid[c] = []);
            if (L[L.length - 1] !== k) L.push(k);
          }
      }
    // ---- what is down there ----
    const things = [];
    const cellsOfZone = (n) => {
      const out = [];
      for (let k = 0; k < N; k++)
        if (carved[k] && zone[k] === n && dist[k] >= 1.5) out.push(k);
      return out;
    };
    const centre = (k) => ({
      x: (k % W) + ox + 0.5,
      z: ((k / W) | 0) + oz + 0.5,
    });
    const pickCell = (list) =>
      list.length ? list[Math.floor(rnd() * list.length)] : -1;
    const used = new Set();
    // the way through: nothing that stands in your way may stand on it
    const nearRoute = (x, z, m) => {
      for (const p of pts)
        if (
          Math.abs(p.x - x) < m &&
          Math.abs(p.z - z) < m &&
          Math.hypot(p.x - x, p.z - z) < m
        )
          return true;
      return false;
    };
    const place = (list, minD = 2, clear = 0) => {
      for (let t = 0; t < 12; t++) {
        const k = pickCell(list);
        if (k < 0) return null;
        const c = centre(k);
        if ([...used].some((u) => Math.hypot(u.x - c.x, u.z - c.z) < minD))
          continue;
        if (clear && nearRoute(c.x, c.z, clear)) continue;
        const u = { ...c, k };
        used.add(u);
        return u;
      }
      return null;
    };
    const kinds = rooms.map((r) => r.kind);
    rooms.forEach((rm, n) => {
      // (not in a mine: what grows down there takes longer than anyone has been digging)
      if (opts.mine) return;
      const cells = cellsOfZone(n);
      // stone growing from the floor and hanging from the roof
      const nS = Math.floor(cells.length / 22) + 2;
      for (let k = 0; k < nS; k++) {
        const c = place(cells, 1.6, 1.85);
        if (c)
          things.push({
            t: rnd() < 0.18 && rm.h > 5 ? "column" : "stalagmite",
            x: c.x,
            z: c.z,
            s: R(0.5, 1.3),
            seed: Math.floor(rnd() * 1e6),
          });
      }
      for (let k = 0; k < nS; k++) {
        const c = place(cells, 1.2);
        if (c)
          things.push({
            t: "stalactite",
            x: c.x,
            z: c.z,
            s: R(0.4, 1.2),
            seed: Math.floor(rnd() * 1e6),
          });
      }
    });
    // a pool in one of the chambers, its water at the lowest of its floor
    const hall = rooms.findIndex((r) => r.kind === "hall");
    if (hall >= 0 && rnd() < 0.75) {
      const rm = rooms[hall],
        px = rm.x + R(-1, 1) * rm.r * 0.3,
        pz = rm.z + R(-1, 1) * rm.r * 0.3,
        pr = R(1.6, 2.8);
      for (let j = 0; j < VH; j++)
        for (let i = 0; i < VW; i++) {
          const x = i + ox,
            z = j + oz,
            d = Math.hypot(x - px, z - pz);
          if (d < pr) {
            const v = j * VW + i;
            vf[v] -= 0.7 * (1 - (d / pr) ** 2);
          }
        }
      things.push({ t: "pool", x: px, z: pz, r: pr * 0.85, y: rm.y - 0.12 });
    }
    // the deepest chamber: crystals (or ore in the walls, or both)
    const deep = rooms.findIndex((r) => r.kind === "deep");
    if (deep >= 0) {
      const cells = cellsOfZone(deep);
      const nC = 2 + Math.floor(rnd() * 3);
      for (let k = 0; k < nC; k++) {
        const c = place(cells, 2.5, 1.3);
        if (c)
          things.push({
            t: "crystals",
            x: c.x,
            z: c.z,
            n: 3 + Math.floor(rnd() * 5),
            seed: Math.floor(rnd() * 1e6),
            id: "c" + k,
          });
      }
    }
    // ore showing in the walls of a passage or a nook (a mine is dug for it)
    const nOre = opts.mine
      ? 6 + Math.floor(rnd() * 4)
      : 1 + Math.floor(rnd() * 3);
    for (let k = 0; k < nOre; k++) {
      // a wall cell next to a carved one, somewhere along the way
      for (let t = 0; t < 40; t++) {
        const p = pts[Math.floor(R(0.15, 1) * pts.length)];
        const a = rnd() * 6.28,
          x = p.x + Math.cos(a) * (p.r + 0.6),
          z = p.z + Math.sin(a) * (p.r + 0.6),
          c = cellAt(x, z);
        if (c < 0 || carved[c]) continue;
        // step back to the open cell beside it: that is where you stand to break it out
        const sx = p.x + Math.cos(a) * Math.max(0.3, p.r - 0.8),
          sz = p.z + Math.sin(a) * Math.max(0.3, p.r - 0.8);
        things.push({ t: "ore", x, z, sx, sz, face: a, id: "o" + k });
        break;
      }
    }
    // pale mushrooms where it is damp, in the nooks
    rooms.forEach((rm, n) => {
      if (rm.kind !== "nook" || rnd() < 0.4 || opts.mine) return;
      const c = place(cellsOfZone(n), 1);
      if (c)
        things.push({
          t: "mushrooms",
          x: c.x,
          z: c.z,
          id: "m" + n,
          seed: Math.floor(rnd() * 1e6),
        });
    });
    // the first chamber: someone camped here once
    const first = rooms.findIndex((r) => r.kind === "hall");
    if (first >= 0 && rnd() < 0.6) {
      const c = place(cellsOfZone(first), 2.5);
      if (c)
        things.push({
          t: "oldcamp",
          x: c.x,
          z: c.z,
          id: "camp",
          seed: Math.floor(rnd() * 1e6),
        });
    }
    // paintings on a wall
    if (rnd() < 0.7 && !opts.mine) {
      const n = Math.max(0, kinds.lastIndexOf("hall"));
      const rm = rooms[n];
      for (let t = 0; t < 30; t++) {
        const a = rnd() * 6.28,
          x = rm.x + Math.cos(a) * rm.r * 0.95,
          z = rm.z + Math.sin(a) * rm.r * 0.95,
          c = cellAt(x, z);
        if (c >= 0 && carved[c] && dist[c] <= 1.5) {
          things.push({
            t: "painting",
            x,
            z,
            face: a + Math.PI,
            id: "paint",
            seed: Math.floor(rnd() * 1e6),
          });
          break;
        }
      }
    }
    // bones of something that came in and did not leave
    if (rnd() < 0.5 && !opts.mine) {
      const nook = rooms.findIndex((r) => r.kind === "nook");
      if (nook >= 0) {
        const c = place(cellsOfZone(nook), 1.5);
        if (c)
          things.push({
            t: "bones",
            x: c.x,
            z: c.z,
            l: R(2.2, 3.6),
            rot: rnd() * 6.28,
            id: "bones",
          });
      }
    }
    // the dead: in some caves, a chamber where they were laid on shelves of stone long ago. Most were
    // common folk; some tombs hold a band of champions wrapped in blue; a few were made for a lord,
    // who lies on a bier in the middle with the grave goods at their feet
    if (opts.tomb ?? rnd() < 0.4) {
      const n = deep >= 0 ? deep : rooms.length - 1,
        rm = rooms[n];
      const tr = rnd(),
        tier =
          opts.tier || (tr < 0.16 ? "lord" : tr < 0.44 ? "champions" : "plain");
      // the way in, seen from the middle of the chamber
      let ex = 0,
        ez = 1;
      for (let k = main.length - 1; k >= 0; k--) {
        const p = main[k],
          d = Math.hypot(p.x - rm.x, p.z - rm.z);
        if (d > rm.r * 0.75) {
          ex = (p.x - rm.x) / d;
          ez = (p.z - rm.z) / d;
          break;
        }
      }
      const nD = 4 + Math.floor(rnd() * 4);
      const affix = ["swift", "stone", "fireless"][Math.floor(rnd() * 3)];
      const nChamp = tier === "champions" ? 2 + Math.floor(rnd() * 2) : 0;
      const clearOfBier = (x, z) =>
        tier !== "lord" || Math.hypot(x - rm.x, z - rm.z) > 2.6;
      let placed = 0;
      for (let k = 0; k < nD; k++) {
        for (let t = 0; t < 20; t++) {
          const a = (k / nD) * 6.28 + rnd() * 0.5 + t * 0.21,
            x = rm.x + Math.cos(a) * (rm.r - 0.9),
            z = rm.z + Math.sin(a) * (rm.r - 0.9),
            c = cellAt(x, z);
          if (
            c >= 0 &&
            carved[c] &&
            clearOfBier(x, z) &&
            !nearRoute(x, z, 2.0) &&
            !things.some(
              (o) => o.t === "dead" && Math.hypot(o.x - x, o.z - z) < 2.4,
            )
          ) {
            const champ = placed < nChamp;
            things.push({
              t: "dead",
              x,
              z,
              face: a + Math.PI,
              id: "d" + k,
              seed: Math.floor(rnd() * 1e6),
              tier: champ ? "champion" : "common",
              affix: champ ? affix : null,
            });
            placed++;
            break;
          }
        }
      }
      if (tier === "lord") {
        // the bier lies along the way in, the lord's feet towards it, the gifts at their feet
        things.push({
          t: "lord",
          x: rm.x,
          z: rm.z,
          face: Math.atan2(ez, ex),
          id: "lord",
          seed: Math.floor(rnd() * 1e6),
          tier: "lord",
        });
        things.push({
          t: "gravegoods",
          x: rm.x + ex * 2.1,
          z: rm.z + ez * 2.1,
          id: "goods",
        });
      } else things.push({ t: "gravegoods", x: rm.x, z: rm.z, id: "goods" });
      rm.kind = "tomb";
      rm.tier = tier;
    }
    // a mine: the roof held up with timbers along the ways, lamps hung from them, rails in the main way out to
    // a cart in the first gallery
    if (opts.mine) {
      const along = (list, every, f) => {
        let next = 1.5;
        for (let k = 1; k < list.length - 1; k++) {
          const p = list[k];
          if (p.t < next) continue;
          next = p.t + every;
          const q = list[k + 1],
            a = Math.atan2(q.x - p.x, -(q.z - p.z));
          f(p, a, k);
        }
      };
      const lines = [pts.filter((p) => p.tag === "main")];
      let cur = null;
      for (const p of pts) {
        if (p.tag !== "branch") {
          cur = null;
          continue;
        }
        if (!cur || p.t < cur[cur.length - 1].t) lines.push((cur = []));
        cur.push(p);
      }
      let nLamp = 0,
        nT = 0;
      for (const L of lines)
        along(L, 3.6, (p, a) => {
          if (
            rooms.some((rm) => Math.hypot(rm.x - p.x, rm.z - p.z) < rm.r * 0.9)
          )
            return;
          things.push({
            t: "timber",
            x: p.x,
            z: p.z,
            a,
            r: Math.max(0.9, p.r - 0.22),
            id: null,
            seed: Math.floor(rnd() * 1e6),
          });
          // a lamp on every third timber
          if (nT++ % 3 === 1)
            things.push({
              t: "lamp",
              x: p.x,
              z: p.z,
              a,
              r: Math.max(0.9, p.r - 0.22),
              lit: true,
              id: "lamp" + nLamp++,
            });
        });
      const g = rooms.findIndex((r) => r.kind === "hall");
      if (g >= 0) {
        const rm = rooms[g],
          main = lines[0],
          end = main.findIndex(
            (p) => Math.hypot(p.x - rm.x, p.z - rm.z) < rm.r * 0.6,
          );
        things.push({
          t: "rails",
          pts: main
            .slice(0, end > 0 ? end + 1 : Math.min(main.length, 40))
            .map((p) => [p.x, p.z]),
        });
        const c = place(cellsOfZone(g), 1.5);
        if (c)
          things.push({
            t: "cart",
            x: c.x,
            z: c.z,
            a: rnd() * 6.28,
            seed: Math.floor(rnd() * 1e6),
          });
      }
    }
    return {
      seed,
      ox,
      oz,
      W,
      H,
      VW,
      VH,
      carved,
      fl,
      ch,
      dist,
      zone,
      vf,
      vc,
      vjx,
      vjz,
      edges,
      egrid,
      rowEdges,
      rooms,
      things,
      cellAt,
      mine: !!opts.mine,
    };
  }

  // the floor's (or the roof's) height over a point (cave metres): bilinear over the corners of its
  // cell; where the smoothed walls have let the hollow spill into a cell of rock, over the nearest dug one
