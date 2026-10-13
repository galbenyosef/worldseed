// index-inline-2 35 — buildings
// Lines 11519-12692 of readable/index-inline-2.pretty.js (statement-aligned).
  function cityPlan(story, s) {
    const great = s.great || "thriving",
      fallen = great === "fallen",
      S = CITY_STATE[great] || CITY_STATE.thriving;
    const key = cityKey(s);
    const rng = new Rng(hashInt(key, 9001, story.seedHash || 1));
    const people = !fallen && s.owner >= 0 ? story.peoples[s.owner] : null;
    // (the city that fell was built in stone by people nobody remembers)
    const st = fallen
      ? peopleStyle(story, { id: -77, arch: "stone" })
      : peopleStyle(story, people);
    const lang = townLang(story, people);
    const ang = cityAngles(story, s);
    const C = {
      state: great,
      ang,
      plazaR: CITY.plaza,
      rings: CITY.rings.slice(),
      wall: CITY.wall,
      thick: CITY.thick,
      H: CITY.H,
      avW: CITY.avW,
      ringW: CITY.ringW,
      gateW: CITY.gateW,
      gateTW: CITY.gateTW,
      tower: CITY.tower,
      out: CITY.out,
      fountain: CITY.fountain,
    };
    const cos = Math.cos,
      sin = Math.sin;
    const buildings = [],
      props = [],
      lights = [],
      folk = [];
    const fits = (b, gap = 0.5) =>
      !cityOnStreet(C, b, 0.4) &&
      buildings.every((o) => !cityOverlap(o, b, gap));
    const front = (fx, fz) => Math.atan2(-fx, fz);
    // ---- the quarters: between each avenue and the next, each with a name ----
    const crafts = rng.shuffle(QUARTER_CRAFT.slice()),
      plains = rng.shuffle(QUARTER_PLAIN.slice());
    C.quarters = ang.map((a, k) => {
      const mid = a + wrapA(ang[(k + 1) % ang.length] - a) / 2;
      const name =
        k === 0
          ? "the Palace Quarter"
          : k === 3
            ? "the Temple Quarter"
            : rng.chance(0.6)
              ? `the ${crafts[k]}’ Quarter`
              : rng.chance(0.5)
                ? `the ${plains[k]} Quarter`
                : `${lang.word ? lang.word(rng, 2, 2) : plains[k]} Quarter`;
      return { k, mid, name };
    });
    // half-empty: one quarter all but abandoned; being built: two side by side still going up
    C.emptyQ = great === "halfempty" ? rng.pick([1, 2, 4, 5]) : -1;
    if (C.emptyQ >= 0) C.quarters[C.emptyQ].empty = true;
    C.newQ =
      great === "building"
        ? (() => {
            const k = rng.pick([1, 4]);
            return [k, k + 1];
          })()
        : [];
    for (const k of C.newQ) C.quarters[k].rising = true;
    // ---- on the square: the palace (its towers behind it), and the temple facing it ----
    {
      const a = C.quarters[0].mid,
        ux = cos(a),
        uz = sin(a),
        w = 16,
        d = 14,
        r = C.plazaR + 3 + d / 2;
      buildings.push({
        x: ux * r,
        z: uz * r,
        w,
        d,
        rot: front(-ux, -uz),
        floors: 3,
        tower: false,
        round: false,
        chimney: false,
        kind: "civic",
        roof: "hip",
        palace: true,
        q: 0,
      });
      for (const sd of [-1, 1]) {
        const rr = r + d / 2 + 2.7,
          tx = -uz * sd * 6.4,
          tz = ux * sd * 6.4;
        // (their doors at the back, onto the ring street: the palace's own front faces the square)
        buildings.push({
          x: ux * rr + tx,
          z: uz * rr + tz,
          w: 5.2,
          d: 5.2,
          rot: front(ux, uz),
          floors: 5,
          tower: true,
          round: false,
          chimney: false,
          kind: "civic",
          roof: "pyramid",
          palaceTower: true,
          q: 0,
        });
      }
    }
    {
      // (its bell tower behind it)
      const a = C.quarters[3].mid,
        ux = cos(a),
        uz = sin(a),
        w = 12,
        d = 19,
        r = C.plazaR + 3 + d / 2;
      buildings.push({
        x: ux * r,
        z: uz * r,
        w,
        d,
        rot: front(-ux, -uz),
        floors: 2,
        tower: false,
        round: false,
        chimney: false,
        kind: "temple",
        roof: "gable",
        q: 3,
      });
      const rt = r + d / 2 + 2.6;
      buildings.push({
        x: ux * rt,
        z: uz * rt,
        w: 4.8,
        d: 4.8,
        rot: front(ux, uz),
        floors: 5,
        tower: true,
        round: false,
        chimney: false,
        kind: "civic",
        roof: "pyramid",
        templeTower: true,
        q: 3,
      });
    }
    // ---- houses: along both sides of every avenue, then round both sides of the inner ring and the
    // inside of the outer one (beyond it, the open ground under the wall where the stairs go up) ----
    const [f0, f1] = st.floors,
      fMax = Math.max(2, f1 + (f1 < 3 ? 1 : 0));
    const house = (x, z, w, d, fx, fz, street, q) => {
      const round = !fallen && rng.chance(st.round * 0.25) && w < 8;
      const floors = round
        ? 1
        : Math.min(
            fMax,
            Math.max(f0, 1) +
              (rng.chance(0.75) ? 1 : 0) +
              (rng.chance(0.3) ? 1 : 0),
          );
      return {
        x,
        z,
        w: round ? Math.min(w, d + 1) : w,
        d: round ? Math.min(w, d + 1) : d,
        rot: front(fx, fz),
        floors,
        round,
        tower: false,
        chimney: rng.chance(Math.max(0.35, st.chimney)),
        kind: "house",
        roof: null,
        street,
        q,
      };
    };
    const gapNext = () =>
      rng.chance(0.18) ? 2.4 + rng.float() * 1.6 : 0.5 + rng.float() * 0.9;
    ang.forEach((A, k) => {
      const ux = cos(A),
        uz = sin(A),
        nx = -uz,
        nz = ux;
      for (const sd of [-1, 1]) {
        const q = sd > 0 ? k : (k + ang.length - 1) % ang.length;
        let t = C.plazaR + 2.4;
        while (t < C.rings[1] - C.ringW - 4) {
          const w = 6.2 + rng.float() * 3.6,
            d = 5.8 + rng.float() * 2.4,
            tc = t + w / 2;
          const ring = C.rings.find(
            (R) =>
              tc + w / 2 > R - C.ringW - 1.2 && tc - w / 2 < R + C.ringW + 1.2,
          );
          if (ring) {
            t = ring + C.ringW + 1.4;
            continue;
          }
          const off = C.avW + YARD + d / 2;
          const b = house(
            ux * tc + nx * sd * off,
            uz * tc + nz * sd * off,
            w,
            d,
            -nx * sd,
            -nz * sd,
            { av: k, t: tc, side: sd },
            q,
          );
          if (fits(b)) buildings.push(b);
          t += w + gapNext();
        }
      }
    });
    const ringLots = (j, sd) => {
      const R = C.rings[j];
      ang.forEach((A, k) => {
        const span = wrapA(ang[(k + 1) % ang.length] - A),
          sp = span < 0 ? span + Math.PI * 2 : span;
        let s0 = null;
        for (let guard = 0; guard < 60; guard++) {
          const w = 6.2 + rng.float() * 3.4,
            d = 5.8 + rng.float() * 2.4;
          const rc = R + sd * (C.ringW + YARD + d / 2),
            rIn = rc - d / 2;
          if (s0 == null) s0 = (C.avW + 1.6) / rIn;
          const am = s0 + w / 2 / rIn;
          if (am + w / 2 / rIn > sp - (C.avW + 1.6) / rIn) break;
          const a = A + am,
            cx = cos(a),
            cz = sin(a);
          const b = house(
            cx * rc,
            cz * rc,
            w,
            d,
            -sd * cx,
            -sd * cz,
            { ring: j, a: wrapA(a), side: sd },
            k,
          );
          if (fits(b)) buildings.push(b);
          s0 = am + (w / 2 + gapNext()) / rIn;
        }
      });
    };
    ringLots(0, -1);
    ringLots(0, 1);
    ringLots(1, -1);
    // which quarter, and how far out
    const qOf = (b) =>
      b.q != null ? b.q : citySector(C, Math.atan2(b.z, b.x));
    for (const b of buildings) b.q = qOf(b);
    // ---- how each stands: lived in, shut up and empty, fallen in, still going up ----
    buildings.forEach((b, i) => {
      const h = hash01(key + i * 7, 31, 5),
        out = Math.hypot(b.x, b.z) > C.rings[0] + 2;
      if (fallen) {
        b.ruin = true;
        b.empty = true;
        return;
      }
      if (b.kind !== "house") return;
      if (great === "halfempty") {
        if (b.q === C.emptyQ) {
          b.empty = true;
          if (h < 0.4) b.ruin = true;
          else b.board = true;
        } else if (h < S.empty) {
          b.empty = true;
          b.board = h < S.empty * 0.55;
        }
      } else if (great === "building" && out) {
        const rising = C.newQ.includes(b.q);
        if (rising ? h < 0.5 : h < 0.12) {
          b.frame = true;
          b.empty = true;
          b.frameK = 0.35 + hash01(i, key, 9) * 0.65;
        } else if (rising && h < 0.8) {
          b.found = true;
          b.empty = true;
        }
      }
    });
    // (a few still live on in the empty quarter: they will not leave)
    const holdouts = [];
    if (C.emptyQ >= 0) {
      const inQ = buildings
        .map((b, i) => i)
        .filter(
          (i) =>
            buildings[i].q === C.emptyQ &&
            buildings[i].kind === "house" &&
            !buildings[i].round,
        );
      for (const i of inQ
        .slice(0, 40)
        .filter((_, k) => k % 5 === 2)
        .slice(0, 3)) {
        const b = buildings[i];
        b.empty = false;
        b.ruin = false;
        b.board = false;
        holdouts.push(i);
      }
    }
    const lived = (i) => {
      const b = buildings[i];
      return b.kind === "house" && !b.empty;
    };
    // ---- the wall: towers between the gates; unfinished stretches; breaches ----
    C.gates = ang.map((a, k) => ({ a, k }));
    C.towers = [];
    ang.forEach((A, k) => {
      const span = wrapA(ang[(k + 1) % ang.length] - A),
        sp = span < 0 ? span + Math.PI * 2 : span;
      for (const f of [1 / 3, 2 / 3]) C.towers.push({ a: A + sp * f, k });
    });
    if (great === "building") {
      // the new quarters' stretch of wall is still going up: from full height at one end down to a course or two
      // (round the first of the two quarters it comes down from full height; round the second it is a course or
      // two of stone, until the old wall again at its far end)
      const spanOf = (k) => {
        const sp = wrapA(ang[(k + 1) % ang.length] - ang[k]);
        return sp < 0 ? sp + Math.PI * 2 : sp;
      };
      const [qa, qb] = C.newQ,
        Aa = ang[qa],
        Ab = ang[qb],
        sa = spanOf(qa),
        sb = spanOf(qb);
      C.works = [
        { a0: Aa + sa * 0.12, a1: Aa + sa, h0: C.H, h1: 2.6 },
        { a0: Ab, a1: Ab + sb * 0.78, h0: 2.6, h1: 1.2 },
        { a0: Ab + sb * 0.78, a1: Ab + sb, h0: 1.2, h1: C.H },
      ];
      // (and the towers and the gate there not yet raised)
      for (const t of C.towers)
        if (C.newQ.includes(t.k)) t.low = cityWallH(C, t.a) + 1.2;
      C.gates.forEach((g) => {
        if (
          C.newQ.includes(g.k) &&
          C.newQ.includes((g.k + ang.length - 1) % ang.length)
        )
          g.unfinished = true;
      });
    }
    if (fallen) {
      C.breaches = [];
      ang.forEach((A, k) => {
        const span = wrapA(ang[(k + 1) % ang.length] - A),
          sp = span < 0 ? span + Math.PI * 2 : span;
        const n = rng.int(0, 2);
        for (let j = 0; j < n; j++)
          C.breaches.push({
            a: A + sp * (0.15 + 0.7 * rng.float()),
            half: 3 + rng.float() * 8,
            low: 0.6 + rng.float() * 1.6,
          });
      });
      for (const t of C.towers) t.broken = 0.25 + rng.float() * 0.6;
      C.gates.forEach((g) => {
        g.broken = rng.chance(0.35) ? "fallen" : "open";
      });
    }
    // ---- the square: a fountain, and the market's own stalls at its edge (not before the palace or the temple) ----
    const feature = "fountain";
    props.push({
      t: "fountain",
      x: 0,
      z: 0,
      rot: ang[0],
      r: C.fountain,
      dry: fallen || great === "halfempty",
      statue: great !== "halfempty",
      broken: fallen,
    });
    const stalls = [];
    {
      const qs = [1, 2, 4, 5],
        per = Math.ceil(S.stalls / qs.length);
      let n = 0;
      for (const qk of qs)
        for (let j = 0; j < per && n < S.stalls; j++, n++) {
          const a =
              C.quarters[qk].mid + (per > 1 ? (j - (per - 1) / 2) * 0.32 : 0),
            r = C.plazaR - 3.2;
          const x = cos(a) * r,
            z = sin(a) * r,
            fx = -cos(a),
            fz = -sin(a);
          const st2 = {
            x,
            z,
            rot: front(fx, fz),
            face: Math.atan2(fx, -fz),
            cloth: n % 3,
            stand: [x - fx * 0.95, z - fz * 0.95],
          };
          stalls.push(st2);
          props.push({ t: "stall", x, z, rot: st2.rot, cloth: st2.cloth });
        }
    }
    // ---- the people ----
    const houses = buildings.map((b, i) => i).filter(lived);
    const inner = houses.filter(
      (i) => Math.hypot(buildings[i].x, buildings[i].z) < C.rings[0],
    );
    const byMid = (list) =>
      list
        .slice()
        .sort(
          (p, q) =>
            Math.hypot(buildings[p].x, buildings[p].z) -
            Math.hypot(buildings[q].x, buildings[q].z),
        );
    const toTown = (b, lx, lz) => [
      b.x + lx * cos(b.rot) - lz * sin(b.rot),
      b.z + lx * sin(b.rot) + lz * cos(b.rot),
    ];
    const frontFace = (b) => Math.atan2(-sin(b.rot), -cos(b.rot));
    const doorX = (b) => {
      if (b.round) return 0;
      const nwF = Math.max(1, Math.floor(b.w / 2.4));
      return -b.w / 2 + ((Math.floor(nwF / 2) + 0.5) * b.w) / nwF;
    };
    const frontZ = (b) => (b.round ? b.w / 2 : b.d / 2);
    // taverns: the two roomiest houses on the avenues near the square
    const taverns = [];
    if (!fallen) {
      const cand = byMid(
        houses.filter((i) => {
          const b = buildings[i];
          return (
            b.street &&
            b.street.av != null &&
            !b.round &&
            b.w >= 7.4 &&
            b.d >= 6
          );
        }),
      )
        .slice(0, 14)
        .sort(
          (p, q) =>
            buildings[q].w * buildings[q].d - buildings[p].w * buildings[p].d,
        );
      for (const i of cand) {
        if (taverns.length >= (great === "halfempty" ? 1 : 2)) break;
        if (
          taverns.some((t) => buildings[t].street.av === buildings[i].street.av)
        )
          continue;
        Object.assign(buildings[i], {
          kind: "tavern",
          open: true,
          chimney: true,
        });
        taverns.push(i);
      }
    }
    const tavern = taverns.length ? taverns[0] : -1;
    const tavernNames = taverns.map((ti, n) => {
      const rn = new Rng(hashInt(key, 71 + n * 13, 4421)),
        adj = rn.pick(TAVERN_ADJ),
        noun = rn.pick(TAVERN_NOUN);
      return adj === "Three" || adj === "Seven"
        ? `The ${adj} ${noun}s`
        : `The ${adj} ${noun}`;
    });
    const tavernName = tavernNames[0] || null;
    const tavernOf = (home) => {
      if (!taverns.length || home == null || home < 0) return tavern;
      const b = buildings[home];
      return taverns
        .slice()
        .sort(
          (p, q) =>
            Math.hypot(buildings[p].x - b.x, buildings[p].z - b.z) -
            Math.hypot(buildings[q].x - b.x, buildings[q].z - b.z),
        )[0];
    };
    const tnFor = (home) => {
      const t = tavernOf(home);
      return t >= 0 ? tavernNames[taverns.indexOf(t)] : null;
    };
    const benchAt = new Map();
    const bench = (hi, side0 = null) => {
      if (benchAt.has(hi)) return benchAt.get(hi);
      const b = buildings[hi],
        side = side0 ?? (hash01(key, hi, 41) < 0.5 ? -1 : 1),
        lx = doorX(b) + side * (b.round ? 2.0 : 1.75);
      const [bx, bz] = toTown(b, lx, frontZ(b) + 0.5),
        [wx, wz] = toTown(b, lx, frontZ(b) + 1.3);
      const w = { kind: "bench", x: wx, z: wz, face: frontFace(b) + Math.PI };
      benchAt.set(hi, w);
      props.push({
        t: "workbench",
        x: bx,
        z: bz,
        rot: b.rot,
        seed: hashInt(key, hi, 17),
      });
      return w;
    };
    if (!fallen && houses.length) {
      const roles = people && people.roles ? people.roles : PLAIN_ROLES;
      let outs = 0,
        si = 0;
      for (let i = 0; i < S.folk; i++) {
        const seed = hashInt(key, i, 313),
          r2 = new Rng(seed);
        const home =
          i === 0
            ? byMid(inner.length ? inner : houses)[0]
            : houses[(i * 7 + 3) % houses.length];
        const role = i === 0 ? "steward" : r2.pick(roles);
        const hb = buildings[home];
        const f = {
          x: hb.x - sin(hb.rot) * (hb.d / 2 + 1.4),
          z: hb.z + cos(hb.rot) * (hb.d / 2 + 1.4),
          face: r2.float() * Math.PI * 2,
          look: folkLook(people, r2, i === 0 ? "elder" : null),
          wander: false,
          name: lang.person(r2),
          role,
          seed,
          home,
        };
        let job = i === 0 ? "hall" : jobOf(role);
        if (job === "field") job = "out";
        if (job === "out" && ++outs > Math.max(1, S.folk / 4)) job = "craft";
        if (job === "market" && !stalls.length) job = "craft";
        if (job === "tavern" && tavern < 0) job = "idle";
        f.job = job;
        if (job === "market") {
          const st2 = stalls[si++ % stalls.length];
          f.work = {
            kind: "stall",
            x: st2.stand[0],
            z: st2.stand[1],
            face: st2.face,
          };
        } else if (job === "craft") f.work = bench(home);
        else if (job === "well") {
          const a = hash01(seed, 3, 5) * Math.PI * 2,
            r = C.fountain + 0.9;
          f.work = {
            kind: "well",
            x: cos(a) * r,
            z: sin(a) * r,
            face: Math.atan2(-cos(a), sin(a)),
          };
        } else if (job === "hall") f.work = { kind: "hall" };
        folk.push(f);
      }
    }
    // the keepers of the taverns live in them; the signs over their doors; a rail with a beast for hire at the first
    taverns.forEach((ti, n) => {
      const b = buildings[ti],
        side = hash01(key, 7 + n, 13) < 0.5 ? -1 : 1;
      const [sx, sz] = toTown(b, doorX(b) + side * 1.45, frontZ(b) + 0.06);
      props.push({
        t: "tavernsign",
        x: sx,
        z: sz,
        rot: b.rot,
        floorUp: 0,
        b: ti,
      });
      if (n === 0) {
        const [rx, rz] = toTown(b, doorX(b) - side * 2.9, frontZ(b) + 2.3);
        props.push({ t: "rail", x: rx, z: rz, rot: b.rot });
      }
      const rk = new Rng(hashInt(key, 61 + n, 919));
      folk.push({
        x: b.x,
        z: b.z,
        face: 0,
        look: folkLook(people, rk),
        wander: true,
        name: lang.person(rk),
        role: "tavern keeper",
        seed: hashInt(key, 601 + n, 313),
        job: "tavern",
        home: ti,
        tavernName: tavernNames[n],
      });
    });
    // ---- after dark: lanterns down the avenues and round the rings, braziers at the palace's door and the temple's ----
    if (!fallen) {
      buildings.forEach((b, i) => {
        b.light = b.empty
          ? "none"
          : b.kind === "civic" || b.kind === "tavern" || b.kind === "temple"
            ? "lit"
            : "home";
        if (b.palace || b.kind === "tavern" || b.kind === "temple")
          b.doorLight = "torches";
        else if (
          !b.empty &&
          b.kind === "house" &&
          hash01(key * 3 + i, 23, 9) < 0.14 * S.lamp
        )
          b.doorLight = "lantern";
      });
      const clearOf = (x, z, r) =>
        buildings.every(
          (b) => Math.hypot(b.x - x, b.z - z) > Math.max(b.w, b.d) * 0.62 + r,
        );
      const lampOK = (x, z) => {
        if (S.lamp >= 1) return true;
        const q = citySector(C, Math.atan2(z, x));
        return (
          q !== C.emptyQ &&
          hash01(Math.round(x * 3), Math.round(z * 3), 61) < S.lamp + 0.2
        );
      };
      ang.forEach((A, k) => {
        const ux = cos(A),
          uz = sin(A);
        let side = k % 2 ? 1 : -1;
        for (let t = C.plazaR + 3; t < C.wall - 6; t += 16) {
          const nx = -uz * side,
            nz = ux * side,
            x = ux * t + nx * (C.avW - 0.5),
            z = uz * t + nz * (C.avW - 0.5);
          if (C.rings.some((R) => Math.abs(t - R) < C.ringW + 1.5)) {
            side = -side;
            continue;
          }
          if (clearOf(x, z, 0.8) && lampOK(x, z))
            lights.push({ kind: "post", x, z, ox: -nx, oz: -nz });
          side = -side;
        }
      });
      C.rings.forEach((R, j) => {
        const n = Math.round((R * Math.PI * 2) / 24);
        for (let q = 0; q < n; q++) {
          const a = (q / n) * Math.PI * 2 + 0.13 * j,
            ca = cos(a),
            sa = sin(a),
            rr = R - C.ringW + 0.5;
          if (ang.some((A) => Math.abs(wrapA(a - A)) * R < C.avW + 3)) continue;
          const x = ca * rr,
            z = sa * rr;
          if (clearOf(x, z, 0.8) && lampOK(x, z))
            lights.push({ kind: "post", x, z, ox: ca, oz: sa });
        }
      });
      for (const b of buildings)
        if (b.palace || b.kind === "temple") {
          const cs = cos(b.rot),
            sn = sin(b.rot),
            dx = doorX(b);
          for (const side of [-1, 1]) {
            const lx = dx + side * 2.2,
              lz = b.d / 2 + 1.8;
            lights.push({
              kind: "brazier",
              x: b.x + lx * cs - lz * sn,
              z: b.z + lx * sn + lz * cs,
            });
          }
        }
      // the square's own lanterns, round its edge between the stalls
      for (let q = 0; q < 12; q++) {
        const a = (q / 12) * Math.PI * 2 + 0.26,
          r = C.plazaR - 0.9,
          x = cos(a) * r,
          z = sin(a) * r;
        if (
          ang.some((A) => Math.abs(wrapA(a - A)) * r < C.avW + 1.5) ||
          stalls.some((t) => Math.hypot(t.x - x, t.z - z) < 2.4)
        )
          continue;
        if (clearOf(x, z, 0.6))
          lights.push({ kind: "post", x, z, ox: -cos(a), oz: -sin(a) });
      }
    }
    // ---- the gates: braziers either side of each, and the guard on it (in the city that fell, nobody) ----
    if (!fallen) {
      const vOut = C.thick / 2 + 3.4,
        pw = C.gateW / 2;
      C.gates.forEach((g, k) => {
        if (g.unfinished) return;
        const a = g.a,
          rx = cos(a),
          rz = sin(a),
          tx = -sin(a),
          tz = cos(a),
          at = (u, v) => [
            rx * (C.wall + v) + tx * u,
            rz * (C.wall + v) + tz * u,
          ];
        const emptyGate =
          C.emptyQ >= 0 &&
          (k === C.emptyQ || k === (C.emptyQ + 1) % ang.length);
        if (S.lamp >= 0.7 || !emptyGate)
          for (const sd of [-1, 1]) {
            const [x, z] = at(sd * (pw + 1.1), vOut + 1.4);
            lights.push({ kind: "brazier", x, z });
          }
        const nG = great === "thriving" ? 2 : emptyGate ? 0 : 1;
        for (let q = 0; q < nG; q++) {
          const sd = q ? 1 : -1,
            [x, z] = at(sd * (pw - 0.75), vOut + 0.7),
            rg = new Rng(hashInt(key, 701 + k * 3 + q, 919));
          const look = folkLook(people, rg, "guard");
          if (q === 0) look.item = "lantern";
          folk.push({
            x,
            z,
            face: Math.atan2(rx, -rz),
            look,
            wander: false,
            name: lang.person(rg),
            role: "gate guard",
            seed: hashInt(key, 701 + k * 3 + q, 313),
            gate: k,
          });
        }
      });
    }
    // ---- smiths: two forges, by the doors of houses on the inner ring ----
    if (!fallen && houses.length >= 6) {
      const ringIn = byMid(
        houses.filter(
          (i) =>
            buildings[i].street &&
            buildings[i].street.ring === 0 &&
            !benchAt.has(i) &&
            !buildings[i].round,
        ),
      );
      for (
        let n = 0;
        n < (great === "halfempty" ? 1 : 2) && ringIn.length;
        n++
      ) {
        const sh =
            ringIn[
              Math.min(
                ringIn.length - 1,
                n * Math.floor(ringIn.length / 2) + (key % 3),
              )
            ],
          b = buildings[sh];
        ringIn.splice(ringIn.indexOf(sh), 1);
        const side = hash01(key, sh, 41) < 0.5 ? -1 : 1,
          lx = doorX(b) + side * 2.05;
        const [fx, fz] = toTown(b, lx, frontZ(b) + 0.75),
          [wx, wz] = toTown(b, lx, frontZ(b) + 1.75);
        props.push({
          t: "forge",
          x: fx,
          z: fz,
          rot: b.rot,
          seed: hashInt(key, 33 + n, 17),
        });
        lights.push({
          kind: "brazier",
          x: fx - cos(b.rot) * 0.2,
          z: fz - sin(b.rot) * 0.2,
        });
        benchAt.set(sh, null);
        const rk = new Rng(hashInt(key, 63 + n * 5, 919));
        folk.push({
          x: wx,
          z: wz,
          face: 0,
          look: folkLook(people, rk),
          wander: true,
          name: lang.person(rk),
          role: "smith",
          seed: hashInt(key, 603 + n, 313),
          job: "craft",
          home: sh,
          work: { kind: "forge", x: wx, z: wz, face: frontFace(b) + Math.PI },
          tavernName: tnFor(sh),
        });
      }
    }
    // ---- the night watch: lanterns round the rings and down the avenues ----
    for (let w = 0; w < S.watch && houses.length; w++) {
      const rw = new Rng(hashInt(key, 77 + w, 919)),
        route = [];
      const R = w === 1 ? C.rings[1] : C.rings[0],
        dir = w % 2 ? -1 : 1,
        k0 = (w * 2) % ang.length;
      for (let q = 0; q < ang.length; q++) {
        const k = (k0 + dir * q + ang.length * 4) % ang.length,
          A = ang[k];
        // out along an avenue now and then, and back
        if (q % 2 === 0 && w !== 1)
          route.push(
            [cos(A) * (C.plazaR - 1), sin(A) * (C.plazaR - 1)],
            [cos(A) * R, sin(A) * R],
          );
        const kn = (k + dir + ang.length) % ang.length,
          span = wrapA(ang[kn] - A),
          steps = Math.max(2, Math.ceil((Math.abs(span) * R) / 12));
        for (let j = 0; j <= steps; j++) {
          const a = A + (span * j) / steps;
          route.push([cos(a) * R, sin(a) * R]);
        }
      }
      const look = folkLook(people, rw);
      look.item = "lantern";
      folk.push({
        x: route[0][0],
        z: route[0][1],
        face: 0,
        look,
        wander: true,
        name: lang.person(rw),
        role: "night watch",
        seed: hashInt(key, 501 + w, 313),
        route,
        job: "watch",
        home: houses[(w * 5 + 1) % houses.length],
      });
    }
    // ---- a trader of the people at a stall, and a house-wright ----
    const arch = people ? people.arch : "isle";
    if (!fallen && stalls.length) {
      const used = folk.filter((f) => f.job === "market").length,
        st2 = stalls[used % stalls.length];
      const rt = new Rng(hashInt(key, 65, 919));
      folk.push({
        x: st2.stand[0],
        z: st2.stand[1],
        face: st2.face,
        look: folkLook(people, rt),
        wander: false,
        name: lang.person(rt),
        role: TRADER[arch] || "trader",
        seed: hashInt(key, 605, 313),
        job: "market",
        home: houses.length ? houses[(key * 3 + 2) % houses.length] : -1,
        work: {
          kind: "stall",
          x: st2.stand[0],
          z: st2.stand[1],
          face: st2.face,
        },
        tavernName,
      });
    }
    if (!fallen && houses.length >= 6) {
      const busy = new Set(folk.map((f) => f.home));
      const near = byMid(
        houses.filter(
          (i) => !benchAt.has(i) && !busy.has(i) && !buildings[i].round,
        ),
      );
      const wi = near.length
        ? near[Math.min(near.length - 1, 2 + (key % 3))]
        : null;
      if (wi != null) {
        const b = buildings[wi],
          side = hash01(key, wi, 43) < 0.5 ? -1 : 1,
          lx = doorX(b) + side * 1.9;
        const [bx, bz] = toTown(b, lx, frontZ(b) + 0.5),
          [wx, wz] = toTown(b, lx, frontZ(b) + 1.3);
        props.push({
          t: "wrightbench",
          x: bx,
          z: bz,
          rot: b.rot,
          seed: hashInt(key, wi, 19),
        });
        const [tx, tz] = toTown(b, doorX(b) - side * 2.3, frontZ(b) + 1.0);
        props.push({
          t: "lumber",
          x: tx,
          z: tz,
          rot: b.rot,
          seed: hashInt(key, 67, 5),
        });
        const [sx, sz] = toTown(b, lx + side * 1.15, frontZ(b) + 1.5);
        props.push({ t: "housesign", x: sx, z: sz, rot: b.rot });
        benchAt.set(wi, null);
        const rw = new Rng(hashInt(key, 66, 919));
        folk.push({
          x: wx,
          z: wz,
          face: 0,
          look: folkLook(people, rw),
          wander: true,
          name: lang.person(rw),
          role: "house-wright",
          seed: hashInt(key, 607, 313),
          job: "craft",
          home: wi,
          work: { kind: "bench", x: wx, z: wz, face: frontFace(b) + Math.PI },
          tavernName: tnFor(wi),
        });
      }
    }
    // ---- a priest at the temple ----
    const temple = buildings.findIndex((b) => b.kind === "temple");
    if (!fallen && temple >= 0 && houses.length) {
      const rp = new Rng(hashInt(key, 68, 919)),
        hm = byMid(houses)[3 % houses.length];
      folk.push({
        x: buildings[temple].x,
        z: buildings[temple].z,
        face: 0,
        look: folkLook(people, rp, "priest"),
        wander: false,
        name: lang.person(rp),
        role: "priest",
        seed: hashInt(key, 608, 313),
        job: "hall",
        home: hm,
        work: { kind: "temple" },
        tavernName: tnFor(hm),
      });
    }
    // ---- half-empty: the ones who stayed in the empty quarter ----
    holdouts.forEach((hi, n) => {
      const r2 = new Rng(hashInt(key, 81 + n, 919)),
        b = buildings[hi];
      const role = ["holdout", "last weaver of the quarter", "old lamplighter"][
        n % 3
      ];
      folk.push({
        x: b.x,
        z: b.z,
        face: 0,
        look: folkLook(people, r2, n === 0 ? "elder" : null),
        wander: false,
        name: lang.person(r2),
        role,
        seed: hashInt(key, 611 + n, 313),
        job: n === 2 ? "idle" : "craft",
        home: hi,
        work: n === 2 ? null : bench(hi),
        holdout: true,
        tavernName: tnFor(hi),
      });
    });
    // ---- being built: scaffolds by the frames and the wall, a crane, stone stacked ready, the builders at work ----
    if (great === "building") {
      const frames = buildings
        .map((b, i) => i)
        .filter((i) => buildings[i].frame)
        .slice(0, 40);
      let wk = 0;
      const worker = (role, x, z, face, home) => {
        const r2 = new Rng(hashInt(key, 91 + wk, 919)),
          look = folkLook(people, r2);
        look.item =
          role === "mason" ? "none" : look.item === "bow" ? "none" : look.item;
        look.pack = false;
        folk.push({
          x,
          z,
          face,
          look,
          wander: false,
          name: lang.person(r2),
          role,
          seed: hashInt(key, 621 + wk++, 313),
          job: "craft",
          home,
          work: { kind: "bench", x, z, face },
          tavernName: tnFor(home),
        });
      };
      frames
        .filter((_, n) => n % 4 === 0)
        .slice(0, 4)
        .forEach((fi) => {
          const b = buildings[fi],
            [wx, wz] = toTown(b, -b.w / 2 - 0.9, 0.4);
          worker(
            "carpenter",
            wx,
            wz,
            Math.atan2(b.x - wx, -(b.z - wz)),
            houses[(fi * 3) % houses.length],
          );
        });
      for (const w of C.works.slice(0, 2)) {
        // the masons stand on the inside of the wall where it is going up
        const am = w.a0 + wrapA(w.a1 - w.a0) * 0.62,
          rr = C.wall - C.thick / 2 - 1.2;
        for (const da of [-0.012, 0.03]) {
          const a = am + da,
            x = cos(a) * rr,
            z = sin(a) * rr;
          worker(
            "mason",
            x,
            z,
            Math.atan2(cos(a), -sin(a)),
            houses[(wk * 11) % houses.length],
          );
        }
        const ac = am + 0.06,
          rc = C.wall - C.thick / 2 - 3.4;
        props.push({
          t: "crane",
          x: cos(ac) * rc,
          z: sin(ac) * rc,
          rot: front(-cos(ac), -sin(ac)),
        });
        for (const da of [-0.05, 0.1]) {
          const a = am + da,
            rs = C.rings[1] + C.ringW + 2.2;
          props.push({
            t: "stonepile",
            x: cos(a) * rs,
            z: sin(a) * rs,
            rot: a,
            seed: hashInt(key, Math.round(a * 1000), 3),
          });
        }
        props.push({
          t: "scaffold",
          a0: w.a0 + wrapA(w.a1 - w.a0) * 0.35,
          a1: w.a0 + wrapA(w.a1 - w.a0) * 0.85,
          x: 0,
          z: 0,
        });
        {
          const a = am - 0.05,
            rs = C.rings[1] + C.ringW + 2.0;
          worker(
            "labourer",
            cos(a) * rs,
            sin(a) * rs,
            Math.atan2(cos(a), -sin(a)),
            houses[(wk * 13) % houses.length],
          );
        }
      }
      // stone and timber by the foundations
      buildings.forEach((b, i) => {
        if (b.found && hash01(i, key, 77) < 0.4) {
          const [x, z] = toTown(b, b.w / 2 + 1.4, b.d / 2 + 0.2);
          props.push({
            t: "stonepile",
            x,
            z,
            rot: b.rot,
            seed: hashInt(key, i, 33),
          });
        }
      });
    }
    // ---- the people the story sends you to, and anyone whose trouble the city talks about ----
    if (!fallen && houses.length) {
      const busy = new Set(folk.map((f) => f.home).filter((h) => h != null));
      const near = byMid(houses.filter((i) => !benchAt.has(i)));
      const want = questGiversIn(story, s.id)
        .map((q) => ({
          name: q.giver.name,
          role: q.giver.role,
          seed: q.giver.seed,
          quest: q.i,
        }))
        .concat(
          (story.tales || [])
            .filter((t) => t.town === s.id)
            .map((t, k) => ({
              name: t.giver,
              role: t.role,
              seed: hashInt(s.id, 951 + k, 77),
              tale: t.key,
            })),
        );
      let k = 0;
      for (const w of want) {
        const free2 = near.filter((i) => !busy.has(i)),
          hi = free2.length
            ? free2[Math.min(free2.length - 1, k)]
            : near.length
              ? near[k % near.length]
              : null;
        k++;
        if (hi == null) continue;
        busy.add(hi);
        const b = buildings[hi],
          side = hash01(key, hi, 47) < 0.5 ? -1 : 1;
        const [wx, wz] = toTown(
          b,
          doorX(b) + side * (b.round ? 1.6 : 1.4),
          frontZ(b) + 1.2,
        );
        const rq = new Rng(w.seed >>> 0);
        const look = folkLook(
          people,
          rq,
          w.role === "elder" || w.role === "keeper of the halls"
            ? "elder"
            : null,
        );
        folk.push({
          x: wx,
          z: wz,
          face: frontFace(b),
          look,
          wander: false,
          name: w.name,
          role: w.role,
          seed: w.seed,
          home: hi,
          tavernName: tnFor(hi),
          quest: w.quest ?? null,
          tale: w.tale || null,
        });
      }
    }
    const words = {
      empty: C.emptyQ >= 0 ? C.quarters[C.emptyQ].name : null,
      newq: C.newQ.length ? C.quarters[C.newQ[0]].name : null,
    };
    for (const f of folk) {
      if (f.tavernName === undefined) f.tavernName = tnFor(f.home);
      f.tavI = tavernOf(f.home);
      const hb = f.home != null && f.home >= 0 ? buildings[f.home] : null;
      f.cityWords = {
        ...words,
        quarter: C.quarters[hb && hb.q != null ? hb.q : 0].name,
      };
    }
    // ---- whose doors open ----
    buildings.forEach((b, i) => {
      if (b.kind === "civic") {
        b.open = !b.tower;
        return;
      }
      if (b.kind === "tavern" || b.kind === "temple") {
        b.open = true;
        return;
      }
      b.open =
        !b.empty &&
        !b.ruin &&
        !b.frame &&
        !b.found &&
        hash01(key * 131 + i, 77, 3) < S.open;
    });
    // (everyone who works at a bench or keeps the city lives in a house that opens; the rest may knock)
    C.palace = 0;
    C.temple = temple;
    C.taverns = taverns;
    C.name = s.name;
    return {
      style: st,
      buildings,
      plazaR: C.plazaR,
      feature,
      folk,
      lights,
      props,
      tavern,
      tavernName,
      tavernNames,
      stalls,
      streets: { a0: ang[0], n: ang.length },
      city: C,
    };
  }

  // a building's street: where its people step out to (the street's nearest point) in the city's metres
