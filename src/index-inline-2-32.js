// index-inline-2 32 — math
// Lines 10239-10886 of readable/index-inline-2.pretty.js (statement-aligned).
  function townPlan(story, s, coastSide = null) {
    // (the great city of the world is laid out a city's way: story/city.js)
    if (s.great) return cityPlan(story, s);
    const rng = new Rng(hashInt(s.id * 131 + 7, 9001, story.seedHash || 1));
    const people = s.owner >= 0 ? story.peoples[s.owner] : null;
    const st = peopleStyle(story, people);
    const count = TOWN_SIZE[s.type] || 8;
    const plazaR = 7 + Math.sqrt(count) * 1.6;
    const buildings = [];
    const taken = [];
    const free = (x, z, r) =>
      taken.every((t) => Math.hypot(t.x - x, t.z - z) > t.r + r + 1.2) &&
      Math.hypot(x, z) > plazaR + r;
    const add = (b) => {
      buildings.push(b);
      taken.push({ x: b.x, z: b.z, r: Math.max(b.w, b.d) * 0.62 });
    };
    // the big building on the plaza: hall, temple or tower
    const civic =
      s.type === "monastery" || s.type === "outpost"
        ? "tower"
        : s.type === "capital"
          ? "hall+tower"
          : "hall";
    {
      const a = rng.float() * Math.PI * 2,
        w = civic === "tower" ? 6 : 11 + rng.float() * 4,
        d = civic === "tower" ? 6 : 8 + rng.float() * 2;
      const r = plazaR + Math.max(w, d) * 0.55;
      const x = Math.cos(a) * r,
        z = Math.sin(a) * r;
      add({
        x,
        z,
        w,
        d,
        rot: Math.atan2(x, -z),
        floors: civic === "tower" ? 3 + rng.int(0, 1) : 2,
        tower: civic !== "hall",
        round: false,
        chimney: false,
        kind: "civic",
        roof: civic === "tower" ? "pyramid" : null,
      });
    }
    // streets leave the plaza; houses face them
    const streets = 2 + rng.int(0, count > 12 ? 2 : 1);
    const a0 = rng.float() * Math.PI * 2;
    let guard = 0;
    while (buildings.length < count && guard++ < count * 30) {
      const k = guard % streets;
      const ang = a0 + (k / streets) * Math.PI * 2 + (rng.float() - 0.5) * 0.3;
      const dir = [Math.cos(ang), Math.sin(ang)],
        side = rng.chance(0.5) ? 1 : -1,
        nrm = [-dir[1] * side, dir[0] * side];
      const round = rng.chance(st.round);
      const w = round ? 5.5 + rng.float() * 2.5 : 5.5 + rng.float() * 4.5,
        d = round ? w : 5 + rng.float() * 3;
      const t = plazaR + 4 + rng.float() * (10 + count * 3.2);
      const off = 3.2 + d / 2 + rng.float() * 1.5;
      const x = dir[0] * t + nrm[0] * off,
        z = dir[1] * t + nrm[1] * off;
      const r = Math.max(w, d) * 0.62;
      if (!free(x, z, r)) continue;
      // the front looks back at the street
      const fx = -nrm[0],
        fz = -nrm[1];
      const [f0, f1] = st.floors;
      const floors = round
        ? 1
        : Math.min(
            f1,
            f0 +
              (rng.chance(s.type === "capital" ? 0.6 : 0.3) ? 1 : 0) +
              (rng.chance(s.type === "capital" ? 0.3 : 0.08) ? 1 : 0),
          );
      add({
        x,
        z,
        w,
        d,
        rot: Math.atan2(-fx, fz),
        floors,
        round,
        tower: false,
        chimney: rng.chance(st.chimney),
        kind: "house",
        roof: null,
      });
    }
    // something in the middle of the plaza
    const feature = rng.pick(
      people && people.arch === "salt"
        ? ["well", "well", "stone"]
        : people && people.arch === "frost"
          ? ["fire", "stone"]
          : ["well", "fire", "stone", "tree"],
    );
    // folk: some on the plaza, some at their doors
    const folk = [];
    const nFolk = Math.min(16, 3 + Math.round(count / 2.2));
    for (let i = 0; i < nFolk; i++) {
      const seed = hashInt(s.id, i, 313);
      const r2 = new Rng(seed);
      let x, z;
      if (i < nFolk * 0.6) {
        const a = r2.float() * Math.PI * 2,
          rr = plazaR * (0.35 + r2.float() * 0.55);
        x = Math.cos(a) * rr;
        z = Math.sin(a) * rr;
      } else {
        const b = buildings[r2.int(0, buildings.length - 1)];
        x = b.x - Math.sin(b.rot) * (b.d / 2 + 1.4);
        z = b.z + Math.cos(b.rot) * (b.d / 2 + 1.4);
      }
      const role =
        i === 0
          ? "elder"
          : people && people.roles
            ? r2.pick(people.roles)
            : r2.pick(PLAIN_ROLES);
      const name = townLang(story, people).person(r2);
      folk.push({
        x,
        z,
        face: r2.float() * Math.PI * 2,
        look: folkLook(people, r2, i === 0 ? "elder" : null),
        wander: r2.chance(0.5) && i > 0,
        name,
        role,
        seed,
      });
    }
    // about half the houses open their doors to you, and the hall on the plaza always does
    buildings.forEach((b, i) => {
      b.open =
        b.kind === "civic" ? !b.tower : hash01(s.id * 131 + i, 77, 3) < 0.45;
    });
    // ---- the day's work (its own dice, so nothing above changes) ----
    const props = [];
    const cos = Math.cos,
      sin = Math.sin;
    // a point in a building's own metres (x along its front, z out of it) in the town's
    const toTown = (b, lx, lz) => [
      b.x + lx * cos(b.rot) - lz * sin(b.rot),
      b.z + lx * sin(b.rot) + lz * cos(b.rot),
    ];
    const frontFace = (b) => Math.atan2(-sin(b.rot), -cos(b.rot)); // bearing straight out of the front
    const doorX = (b) => {
      if (b.round) return 0;
      const nwF = Math.max(1, Math.floor(b.w / 2.4));
      return -b.w / 2 + ((Math.floor(nwF / 2) + 0.5) * b.w) / nwF;
    };
    const frontZ = (b) => (b.round ? b.w / 2 : b.d / 2);
    // a tavern: the roomiest house near the square keeps a counter and tables (not in the smallest places)
    let tavern = -1;
    if (count >= 9) {
      const near = buildings
        .map((b, i) => ({ b, i }))
        .filter(
          (q) =>
            q.b.kind === "house" && !q.b.round && q.b.w >= 7 && q.b.d >= 5.5,
        )
        .sort((p, q) => Math.hypot(p.b.x, p.b.z) - Math.hypot(q.b.x, q.b.z))
        .slice(0, 6)
        .sort((p, q) => q.b.w * q.b.d - p.b.w * p.b.d);
      if (near.length) {
        tavern = near[0].i;
        Object.assign(near[0].b, { kind: "tavern", open: true, chimney: true });
      }
    }
    // stalls at the edge of the square, between the streets, facing in
    const stalls = [];
    if (count >= 14) {
      const n = count >= 30 ? 4 : 2;
      for (let k = 0; k < n; k++) {
        const a =
            a0 +
            (((k % streets) + 0.5) / streets) * Math.PI * 2 +
            (k >= streets ? 0.3 : 0),
          r = plazaR - 3.0;
        const x = cos(a) * r,
          z = sin(a) * r,
          fx = -cos(a),
          fz = -sin(a);
        const st2 = {
          x,
          z,
          rot: Math.atan2(-fx, fz),
          face: Math.atan2(fx, -fz),
          cloth: k % 3,
        };
        // the trader stands behind it, facing the square
        st2.stand = [x - fx * 0.95, z - fz * 0.95];
        stalls.push(st2);
        props.push({ t: "stall", x, z, rot: st2.rot, cloth: st2.cloth });
      }
    }
    // everyone lives somewhere, and works at something
    const houses = buildings
      .map((b, i) => i)
      .filter((i) => buildings[i].kind === "house");
    const hallI = buildings[0] && buildings[0].kind === "civic" ? 0 : -1;
    const benchAt = new Map();
    let si = 0;
    let outs = 0;
    folk.forEach((f, i) => {
      f.job = jobOf(f.role);
      if (f.job === "field") f.job = "out";
      // a town by day is not empty: past a third of its people, the rest find work at home
      if (f.job === "out" && ++outs > Math.max(1, folk.length / 3))
        f.job = "craft";
      if (f.job === "market" && !stalls.length) f.job = "craft";
      if (f.job === "tavern" && tavern < 0) f.job = "idle";
      if (!houses.length) {
        f.home = -1;
        return;
      }
      // the elder lives nearest the hall
      if (i === 0 && hallI >= 0) {
        const H = buildings[hallI];
        f.home = houses
          .slice()
          .sort(
            (p, q) =>
              Math.hypot(buildings[p].x - H.x, buildings[p].z - H.z) -
              Math.hypot(buildings[q].x - H.x, buildings[q].z - H.z),
          )[0];
      } else f.home = houses[(i * 7 + 3) % houses.length];
      if (f.job === "market") {
        const st2 = stalls[si++ % stalls.length];
        f.work = {
          kind: "stall",
          x: st2.stand[0],
          z: st2.stand[1],
          face: st2.face,
        };
      } else if (f.job === "craft") {
        // a bench against the front wall, beside the door (one per house)
        const b = buildings[f.home];
        if (!benchAt.has(f.home)) {
          const side = hash01(s.id, f.home, 41) < 0.5 ? -1 : 1,
            lx = doorX(b) + side * (b.round ? 2.0 : 1.75);
          const [bx, bz] = toTown(b, lx, frontZ(b) + 0.5),
            [wx, wz] = toTown(b, lx, frontZ(b) + 1.3);
          benchAt.set(f.home, { x: wx, z: wz, face: frontFace(b) + Math.PI });
          props.push({
            t: "workbench",
            x: bx,
            z: bz,
            rot: b.rot,
            seed: hashInt(s.id, f.home, 17),
          });
        }
        f.work = { kind: "bench", ...benchAt.get(f.home) };
      } else if (f.job === "well") {
        const a = hash01(f.seed, 3, 5) * Math.PI * 2,
          r =
            (feature === "tree"
              ? 2.4
              : feature === "well" || feature === "fire"
                ? 1.5
                : 0.9) + 0.6;
        f.work = {
          kind: "well",
          x: cos(a) * r,
          z: sin(a) * r,
          face: Math.atan2(-cos(a), sin(a)),
        };
      } else if (f.job === "hall") f.work = { kind: "hall" };
    });
    // whoever keeps the tavern lives in it; the tavern has a name, and a sign over the door
    let tavernName = null;
    if (tavern >= 0) {
      const rn = new Rng(hashInt(s.id, 71, 4421));
      const adj = rn.pick(TAVERN_ADJ),
        noun = rn.pick(TAVERN_NOUN);
      tavernName =
        adj === "Three" || adj === "Seven"
          ? `The ${adj} ${noun}s`
          : `The ${adj} ${noun}`;
      const b = buildings[tavern],
        side = hash01(s.id, 7, 13) < 0.5 ? -1 : 1;
      const [sx, sz] = toTown(b, doorX(b) + side * 1.45, frontZ(b) + 0.06);
      props.push({ t: "tavernsign", x: sx, z: sz, rot: b.rot, floorUp: 0 });
      // a rail on the other side of the door, with a beast tied to it, saddled, for hire
      const [rx, rz] = toTown(b, doorX(b) - side * 2.9, frontZ(b) + 2.3);
      props.push({ t: "rail", x: rx, z: rz, rot: b.rot });
      for (const f of folk) f.tavernName = tavernName;
    }
    if (tavern >= 0) {
      const rk = new Rng(hashInt(s.id, 61, 919));
      const name = townLang(story, people).person(rk);
      folk.push({
        x: buildings[tavern].x,
        z: buildings[tavern].z,
        face: 0,
        look: folkLook(people, rk),
        wander: true,
        name,
        role: "tavern keeper",
        seed: hashInt(s.id, 601, 313),
        job: "tavern",
        home: tavern,
        tavernName,
      });
    }
    // ---- after dark: a few lights, more of them (and further out) the bigger the place ----
    // (its own dice, so nothing above changes)
    const lights = [];
    const lampP = count >= 30 ? 0.22 : count >= 14 ? 0.12 : 0.06;
    buildings.forEach((b, i) => {
      // the hall's windows stay lit, with torches at its door; homes go to bed, and a few hang a lantern by the door
      b.light = b.kind === "civic" || b.kind === "tavern" ? "lit" : "home";
      if (b.kind === "civic" || b.kind === "tavern") b.doorLight = "torches";
      else if (hash01(s.id * 131 + i, 23, 9) < lampP) b.doorLight = "lantern";
    });
    const clearOf = (x, z, r) =>
      buildings.every(
        (b) => Math.hypot(b.x - x, b.z - z) > Math.max(b.w, b.d) * 0.62 + r,
      ) && Math.hypot(x, z) > 2.5;
    if (count >= 9) {
      // lanterns on posts at the street side: a village's by the square, a town's down the first stretch, a capital's all the way
      const every = count >= 30 ? 20 : 25,
        reach =
          count >= 30
            ? plazaR + 10 + count * 3.2
            : count >= 14
              ? plazaR + 30
              : plazaR + 3;
      for (let k = 0; k < streets; k++) {
        const ang = a0 + (k / streets) * Math.PI * 2,
          ux = Math.cos(ang),
          uz = Math.sin(ang);
        let side = k % 2 ? 1 : -1;
        for (let t = plazaR + 2.5; t <= reach; t += every) {
          const nx = -uz * side,
            nz = ux * side,
            x = ux * t + nx * 1.9,
            z = uz * t + nz * 1.9;
          if (clearOf(x, z, 0.8))
            lights.push({ kind: "post", x, z, ox: -nx, oz: -nz });
          side = -side;
        }
      }
    }
    const hall = buildings[0];
    if (hall && hall.kind === "civic" && count >= 14) {
      // braziers either side of the hall's door, out on the square
      const nwF = Math.max(1, Math.floor(hall.w / 2.4)),
        dx = -hall.w / 2 + ((Math.floor(nwF / 2) + 0.5) * hall.w) / nwF;
      const cs = Math.cos(hall.rot),
        sn = Math.sin(hall.rot);
      for (const side of [-1, 1]) {
        const lx = dx + side * 1.8,
          lz = hall.d / 2 + 1.6;
        lights.push({
          kind: "brazier",
          x: hall.x + lx * cs - lz * sn,
          z: hall.z + lx * sn + lz * cs,
        });
      }
    }
    if (feature === "fire") lights.push({ kind: "fire", x: 0, z: 0 });
    // a smith: every place has one, with a forge by the door of a house near the middle
    // (its own dice too; the forge glows after dark)
    if (houses.length >= 2) {
      const near = houses
        .slice()
        .sort(
          (p, q) =>
            Math.hypot(buildings[p].x, buildings[p].z) -
            Math.hypot(buildings[q].x, buildings[q].z),
        );
      const sh = near[Math.min(near.length - 1, 1 + (s.id % 3))],
        b = buildings[sh];
      const bside = hash01(s.id, sh, 41) < 0.5 ? -1 : 1,
        side = benchAt.has(sh) ? -bside : bside,
        lx = doorX(b) + side * (b.round ? 2.3 : 2.05);
      const [fx, fz] = toTown(b, lx, frontZ(b) + 0.75),
        [wx, wz] = toTown(b, lx, frontZ(b) + 1.75);
      props.push({
        t: "forge",
        x: fx,
        z: fz,
        rot: b.rot,
        seed: hashInt(s.id, 33, 17),
      });
      lights.push({
        kind: "brazier",
        x: fx - Math.cos(b.rot) * 0.2,
        z: fz - Math.sin(b.rot) * 0.2,
      });
      const rk = new Rng(hashInt(s.id, 63, 919));
      const name = townLang(story, people).person(rk);
      folk.push({
        x: wx,
        z: wz,
        face: 0,
        look: folkLook(people, rk),
        wander: true,
        name,
        role: "smith",
        seed: hashInt(s.id, 603, 313),
        job: "craft",
        home: sh,
        work: { kind: "forge", x: wx, z: wz, face: frontFace(b) + Math.PI },
        tavernName,
      });
    }
    // the night watch: someone with a lantern walking the streets of a town (two in a capital)
    if (count >= 14) {
      for (let w = 0; w < (count >= 30 ? 2 : 1); w++) {
        const rw = new Rng(hashInt(s.id, 77 + w, 919));
        const route = [];
        const out = Math.min(
          count >= 30 ? plazaR + 45 : plazaR + 26,
          plazaR + 10 + count * 3.2,
        );
        const ring = plazaR - 1.5;
        for (let q = 0; q < streets; q++) {
          const k = (q + w * 2) % streets,
            ang = a0 + (k / streets) * Math.PI * 2,
            ux = Math.cos(ang),
            uz = Math.sin(ang);
          route.push(
            [ux * ring, uz * ring],
            [ux * out, uz * out],
            [ux * ring, uz * ring],
          );
          // round the edge of the square to the next street, never across its middle
          const steps = Math.ceil((Math.PI * 2) / streets / 1.0);
          for (let j = 1; j < steps; j++) {
            const b2 = ang + ((j / steps) * Math.PI * 2) / streets;
            route.push([Math.cos(b2) * ring, Math.sin(b2) * ring]);
          }
        }
        const look = folkLook(people, rw);
        look.item = "lantern";
        const name = townLang(story, people).person(rw);
        folk.push({
          x: route[0][0],
          z: route[0][1],
          face: 0,
          look,
          wander: true,
          name,
          role: "night watch",
          seed: hashInt(s.id, 501 + w, 313),
          route,
          job: "watch",
          home: houses.length ? houses[(w * 5 + 1) % houses.length] : -1,
        });
      }
    }
    // ---- buying and selling: a trader at a stall on the square, and a house-wright who builds to order ----
    // (their own dice too)
    const arch = people ? people.arch : "isle";
    if (count >= 9) {
      // a free stall if the square has them; else one of their own at the square's edge
      const used = folk.filter((f) => f.job === "market").length;
      let st2 = stalls.length > used ? stalls[used] : null;
      if (!stalls.length) {
        const a = a0 + (0.5 / streets) * Math.PI * 2,
          r = plazaR - 3.0;
        const x = cos(a) * r,
          z = sin(a) * r,
          fx = -cos(a),
          fz = -sin(a);
        st2 = {
          x,
          z,
          rot: Math.atan2(-fx, fz),
          face: Math.atan2(fx, -fz),
          cloth: s.id % 3,
        };
        st2.stand = [x - fx * 0.95, z - fz * 0.95];
        stalls.push(st2);
        props.push({ t: "stall", x, z, rot: st2.rot, cloth: st2.cloth });
      }
      if (st2) {
        const rt = new Rng(hashInt(s.id, 65, 919));
        const name = townLang(story, people).person(rt);
        folk.push({
          x: st2.stand[0],
          z: st2.stand[1],
          face: st2.face,
          look: folkLook(people, rt),
          wander: false,
          name,
          role: TRADER[arch] || "trader",
          seed: hashInt(s.id, 605, 313),
          job: "market",
          home: houses.length ? houses[(s.id * 3 + 2) % houses.length] : -1,
          work: {
            kind: "stall",
            x: st2.stand[0],
            z: st2.stand[1],
            face: st2.face,
          },
          tavernName,
        });
      }
    }
    if (houses.length >= 3 && count >= 9) {
      // the house-wright works out of a house near the middle: a bench with a little model house on it,
      // timber stacked by the door, and a sign with a house painted on it
      const smithHome = (folk.find((f) => f.role === "smith") || {}).home;
      const near = houses
        .filter((i) => i !== smithHome && !benchAt.has(i))
        .sort(
          (p, q) =>
            Math.hypot(buildings[p].x, buildings[p].z) -
            Math.hypot(buildings[q].x, buildings[q].z),
        );
      const wi = near.length
        ? near[Math.min(near.length - 1, 1 + (s.id % 2))]
        : null;
      if (wi != null) {
        const b = buildings[wi],
          side = hash01(s.id, wi, 43) < 0.5 ? -1 : 1;
        const lx = doorX(b) + side * (b.round ? 2.2 : 1.9);
        const [bx, bz] = toTown(b, lx, frontZ(b) + 0.5),
          [wx, wz] = toTown(b, lx, frontZ(b) + 1.3);
        props.push({
          t: "wrightbench",
          x: bx,
          z: bz,
          rot: b.rot,
          seed: hashInt(s.id, wi, 19),
        });
        const [tx, tz] = toTown(
          b,
          doorX(b) - side * (b.round ? 2.5 : 2.3),
          frontZ(b) + 1.0,
        );
        props.push({
          t: "lumber",
          x: tx,
          z: tz,
          rot: b.rot,
          seed: hashInt(s.id, 67, 5),
        });
        const [sx, sz] = toTown(b, lx + side * 1.15, frontZ(b) + 1.5);
        props.push({ t: "housesign", x: sx, z: sz, rot: b.rot });
        const rw = new Rng(hashInt(s.id, 66, 919));
        const name = townLang(story, people).person(rw);
        folk.push({
          x: wx,
          z: wz,
          face: 0,
          look: folkLook(people, rw),
          wander: true,
          name,
          role: "house-wright",
          seed: hashInt(s.id, 607, 313),
          job: "craft",
          home: wi,
          work: { kind: "bench", x: wx, z: wz, face: frontFace(b) + Math.PI },
          tavernName,
        });
      }
    }
    // ---- the people the story sends you to: whoever keeps one of the world's needs here, and anyone
    // whose trouble the town talks about; each by the door of a house near the middle (their own dice too)
    {
      const busy = new Set(folk.map((f) => f.home).filter((h) => h != null));
      const near = houses
        .filter((i) => !benchAt.has(i))
        .sort(
          (p, q) =>
            Math.hypot(buildings[p].x, buildings[p].z) -
            Math.hypot(buildings[q].x, buildings[q].z),
        );
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
          side = hash01(s.id, hi, 47) < 0.5 ? -1 : 1;
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
          tavernName,
          quest: w.quest ?? null,
          tale: w.tale || null,
        });
      }
    }
    return {
      style: st,
      buildings,
      plazaR,
      feature,
      folk,
      lights,
      props,
      tavern,
      tavernName,
      stalls,
      streets: { a0, n: streets },
    };
  }
  // who keeps the stall on the square, people by people
