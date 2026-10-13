// index-inline-2 47 — math
// Lines 17489-17972 of readable/index-inline-2.pretty.js (statement-aligned).
  function dayPlan(story, s, ev, clearR = 1e9) {
    const plan = townPlan(story, s),
      people = s.owner >= 0 ? story.peoples[s.owner] : null,
      lang = townLang(story, people);
    const r = new Rng(hashInt(ev.seed, 77, 0xd47));
    const P = {
      props: [],
      folk: [],
      spots: [],
      lights: [],
      burn: -1,
      smoke: null,
    };
    const R0 = plan.plazaR,
      a0 = plan.streets.a0,
      nS = plan.streets.n;
    const c = dayCast(story, s, ev);
    // away from where the streets leave the square, and from the middle
    const offStreet = (a) => {
      let m = 9;
      for (let k = 0; k < nS; k++) {
        const d = Math.atan2(
          Math.sin(a - (a0 + (k / nS) * Math.PI * 2)),
          Math.cos(a - (a0 + (k / nS) * Math.PI * 2)),
        );
        m = Math.min(m, Math.abs(d));
      }
      return m;
    };
    let pk = 0;
    const person = (x, z, face, role, o = {}) => {
      const seed = hashInt(ev.seed, 400 + pk++, 313) >>> 0,
        r2 = new Rng(seed);
      const look =
        o.look ||
        folkLook(
          o.people === undefined ? people : o.people,
          r2,
          o.lookRole || null,
        );
      if (o.dress) Object.assign(look, o.dress(look, r2));
      P.folk.push({
        x,
        z,
        face,
        look,
        name:
          o.name ||
          (o.people === null
            ? "Aru"
            : townLang(
                story,
                o.people === undefined ? people : o.people,
              ).person(r2)),
        role,
        seed,
        wander: !!o.wander,
        route: o.route || null,
        day: ev.kind,
        tag: o.tag || null,
      });
    };
    const hall =
      plan.buildings[0] && plan.buildings[0].kind === "civic"
        ? plan.buildings[0]
        : null;
    // in front of the hall's door (or the far side of the square from the first street)
    const front = () => {
      if (hall) {
        const fx = -Math.sin(hall.rot),
          fz = Math.cos(hall.rot),
          d = hall.d / 2 + 4.5;
        return {
          x: hall.x + fx * d,
          z: hall.z + fz * d,
          face: Math.atan2(-fx, fz) + Math.PI,
          fx,
          fz,
        };
      }
      const a = a0 + Math.PI / nS;
      return {
        x: Math.cos(a) * R0 * 0.55,
        z: Math.sin(a) * R0 * 0.55,
        face: Math.atan2(Math.cos(a), Math.sin(a)),
        fx: -Math.cos(a),
        fz: -Math.sin(a),
      };
    };
    const ring = (rr, n, phase = 0) => {
      const out = [];
      for (let k = 0; k < 40 && out.length < n; k++) {
        const a = phase + (k / 40) * Math.PI * 2 * 3.1;
        if (offStreet(a) > 0.32) out.push(a);
      }
      return out.slice(0, n);
    };
    switch (ev.kind) {
      case "market": {
        // stalls in a ring inside the square's own, a trader behind each, people from the farms about them
        const n = Math.min(8, 3 + Math.floor(R0 / 3)),
          rr = Math.max(4.5, R0 * 0.62);
        const roles = r.shuffle(MARKET_ROLES.slice());
        ring(rr, n, r.float() * 6.28).forEach((a, k) => {
          const x = Math.cos(a) * rr,
            z = Math.sin(a) * rr,
            fx = -Math.cos(a),
            fz = -Math.sin(a);
          P.props.push({
            t: "stall",
            x,
            z,
            rot: Math.atan2(-fx, fz),
            cloth: k % 3,
          });
          person(
            x - fx * 0.95,
            z - fz * 0.95,
            Math.atan2(fx, -fz),
            roles[k % roles.length][0],
          );
        });
        // (in from the farms with eggs and grain, a hen or two, a goat)
        for (let k = 0; k < 5; k++) {
          const a = r.float() * 6.28,
            d = rr * (0.4 + r.float() * 0.9);
          person(
            Math.cos(a) * d,
            Math.sin(a) * d,
            r.float() * 6.28,
            r.pick(["farmer", "farmhand", "herder"]),
            { wander: true, tag: "farm" },
          );
        }
        break;
      }
      case "wedding": {
        // an arch of green before the hall, the couple under it, the guests in a crowd before them, a table of food
        const F = front();
        P.props.push({ t: "arch", x: F.x, z: F.z, rot: F.face });
        const sx = Math.cos(F.face),
          sz = Math.sin(F.face);
        const bright = (look) => ({
          main: r.pick([
            [236, 230, 214],
            [214, 72, 64],
            [232, 196, 90],
            [120, 170, 220],
          ]),
          trim: [240, 210, 110],
          hat: "band",
          item: "none",
          pack: false,
          mask: false,
          cloak: false,
        });
        person(
          F.x - sx * 0.55,
          F.z - sz * 0.55,
          F.face + Math.PI,
          "bride or groom",
          { name: c.names[0], dress: bright, tag: "couple" },
        );
        person(
          F.x + sx * 0.55,
          F.z + sz * 0.55,
          F.face + Math.PI,
          "bride or groom",
          { name: c.names[1], dress: bright, tag: "couple" },
        );
        for (let k = 0; k < 9; k++) {
          const row = Math.floor(k / 3),
            col = (k % 3) - 1,
            d = 3 + row * 1.3;
          person(
            F.x - F.fx * d + sx * col * 1.3 + (r.float() - 0.5) * 0.4,
            F.z - F.fz * d + sz * col * 1.3 + (r.float() - 0.5) * 0.4,
            F.face,
            "wedding guest",
            { tag: "guest" },
          );
        }
        const tx = F.x - F.fx * 4 + sx * 6,
          tz = F.z - F.fz * 4 + sz * 6;
        P.props.push({
          t: "feasttable",
          x: tx,
          z: tz,
          rot: F.face + Math.PI / 2,
        });
        P.spots.push({ kind: "ev:feast", x: tx, z: tz, y: 1.0, r: 1.4 });
        person(
          tx + sx * 0.0 - F.fx * 1.4,
          tz - F.fz * 1.4,
          F.face + Math.PI,
          "cook",
          { tag: "cook" },
        );
        break;
      }
      case "funeral": {
        // a bier before the hall with the dead on it, wrapped, with flowers; mourners round it, candles at its corners
        const F = front();
        P.props.push({
          t: "bier",
          x: F.x - F.fx * 1.5,
          z: F.z - F.fz * 1.5,
          rot: F.face,
        });
        P.spots.push({
          kind: "ev:bier",
          x: F.x - F.fx * 1.5,
          z: F.z - F.fz * 1.5,
          y: 1.0,
          r: 1.3,
        });
        const dark = () => ({
          main: [46, 44, 50],
          under: [36, 34, 40],
          trim: [90, 86, 96],
          hat: r.pick(["hood", "none"]),
          item: "none",
          pack: false,
          cloak: true,
        });
        for (let k = 0; k < 8; k++) {
          const a = (k / 8) * Math.PI * 2 + 0.2,
            d = 2.6 + (k % 2) * 0.9,
            x = F.x - F.fx * 1.5 + Math.cos(a) * d,
            z = F.z - F.fz * 1.5 + Math.sin(a) * d;
          person(
            x,
            z,
            Math.atan2(F.x - F.fx * 1.5 - x, -(F.z - F.fz * 1.5 - z)),
            "mourner",
            { dress: dark, tag: "mourner" },
          );
        }
        for (const [u, w] of [
          [-0.9, -1.4],
          [0.9, -1.4],
          [-0.9, 1.4],
          [0.9, 1.4],
        ]) {
          const cx =
              F.x -
              F.fx * 1.5 +
              u * Math.cos(F.face) -
              w * Math.sin(F.face) * 0.6,
            cz =
              F.z -
              F.fz * 1.5 +
              u * Math.sin(F.face) +
              w * Math.cos(F.face) * 0.6;
          P.props.push({ t: "candlestand", x: cx, z: cz, rot: 0 });
          P.lights.push({ kind: "candle", x: cx, z: cz, y: 1.3 });
        }
        break;
      }
      case "fire": {
        // a house burning: flames out of its roof, a line of people passing buckets from the well to it
        // (in the great city, a house somebody lives in, near the square)
        const houses = plan.buildings
          .map((b, i) => ({ b, i }))
          .filter(
            (q) =>
              q.b.kind === "house" &&
              !q.b.round &&
              !q.b.empty &&
              (!plan.city || Math.hypot(q.b.x, q.b.z) < plan.city.rings[0]),
          );
        if (!houses.length) break;
        const h = houses[Math.floor(r.float() * houses.length)];
        P.burn = h.i;
        const b = h.b;
        P.props.push({
          t: "blaze",
          x: b.x,
          z: b.z,
          rot: b.rot,
          w: b.w,
          d: b.d,
          floors: b.floors,
          i: h.i,
        });
        // from the middle of the square to the house's front, a line of people passing buckets
        const fx = -Math.sin(b.rot),
          fz = Math.cos(b.rot),
          dz = (b.round ? b.w : b.d) / 2 + 2.2;
        const ex = b.x + fx * dz,
          ez = b.z + fz * dz,
          L = Math.hypot(ex, ez),
          n = Math.max(3, Math.min(8, Math.round(L / 2.2)));
        for (let k = 0; k < n; k++) {
          const t = (k + 0.5) / n,
            x = ex * t + (k % 2 ? 0.5 : -0.5) * (-ez / L),
            z = ez * t + (k % 2 ? 0.5 : -0.5) * (ex / L);
          person(
            x,
            z,
            Math.atan2(ex, -ez) + (k % 2 ? Math.PI / 2 : -Math.PI / 2),
            "bucket carrier",
            {
              tag: "bucket",
              dress: () => ({ item: "none", pack: false, cloak: false }),
            },
          );
        }
        person(
          ex + fz * 2.5,
          ez - fx * 2.5,
          Math.atan2(b.x - ex, -(b.z - ez)),
          "householder",
          { name: c.names[0], tag: "owner" },
        );
        P.spots.push({
          kind: "ev:buckets",
          x: ex * 0.92,
          z: ez * 0.92,
          y: 1.0,
          r: 1.5,
        });
        P.smoke = { x: b.x, z: b.z, y: b.floors * 3 + 3 };
        break;
      }
      case "festival": {
        // flags strung over the square from poles at its edge, a fire in the middle of it, people dancing round,
        // musicians, and a table of food for everyone
        const poles = ring(R0 - 1.2, 6, r.float() * 6.28).map((a) => [
          Math.cos(a) * (R0 - 1.2),
          Math.sin(a) * (R0 - 1.2),
        ]);
        poles.forEach(([x, z]) =>
          P.props.push({ t: "flagpole", x, z, rot: 0 }),
        );
        for (let k = 0; k < poles.length; k++) {
          const [x0, z0] = poles[k],
            [x1, z1] = poles[(k + 2) % poles.length];
          P.props.push({ t: "bunting", x: x0, z: z0, x1, z1, rot: 0, seed: k });
        }
        // (far enough from the middle of the square that the dancers' ring clears what stands there)
        const featR = { well: 1.15, fire: 1.3, tree: 2.2 }[plan.feature] || 0.6,
          rd = 2.6;
        const fa = a0 + Math.PI / nS + 0.4,
          fr = Math.max(featR + rd + 1.0, Math.min(R0 * 0.55, R0 - rd - 0.8)),
          bx = Math.cos(fa) * fr,
          bz = Math.sin(fa) * fr;
        P.props.push({ t: "bonfire", x: bx, z: bz, rot: 0 });
        P.lights.push({ kind: "fire", x: bx, z: bz, y: 1.0 });
        for (let k = 0; k < 8; k++) {
          const route = [];
          for (let q = 0; q < 16; q++) {
            const a = (k / 8 + q / 16) * Math.PI * 2;
            route.push([bx + Math.cos(a) * rd, bz + Math.sin(a) * rd]);
          }
          person(route[0][0], route[0][1], 0, "dancer", {
            route,
            wander: true,
            tag: "dancer",
          });
        }
        const ma = fa + 1.2;
        for (let k = 0; k < 2; k++)
          person(
            Math.cos(ma) * (fr + 4) + k * 0.9,
            Math.sin(ma) * (fr + 4),
            Math.atan2(
              bx - Math.cos(ma) * (fr + 4),
              -(bz - Math.sin(ma) * (fr + 4)),
            ),
            "musician",
            { tag: "musician", dress: () => ({ item: "staff" }) },
          );
        const ta = fa - 1.4,
          tx = Math.cos(ta) * (fr + 3.5),
          tz = Math.sin(ta) * (fr + 3.5);
        P.props.push({ t: "feasttable", x: tx, z: tz, rot: ta });
        P.spots.push({ kind: "ev:feast", x: tx, z: tz, y: 1.0, r: 1.4 });
        person(
          tx + Math.cos(ta) * 1.4,
          tz + Math.sin(ta) * 1.4,
          Math.atan2(-Math.cos(ta), Math.sin(ta)),
          "cook",
          { tag: "cook" },
        );
        // lanterns hung along the flags, lit after dark
        for (const [x, z] of poles)
          P.lights.push({ kind: "hang", x, z, y: 3.6 });
        break;
      }
      case "caravan": {
        // camped where the first street leaves town, past the last house: carts, a tent, the caravan's people
        let far = R0 + 6;
        for (const b of plan.buildings)
          far = Math.max(far, Math.hypot(b.x, b.z) + Math.max(b.w, b.d) * 0.7);
        // (outside the great city's walls, beside the road out of a gate)
        if (plan.city) far = plan.city.out + 6;
        // (inside the ground the town keeps clear of trees, if there is room past the houses)
        const a = plan.city
            ? plan.city.ang[ev.seed % nS]
            : a0 + (nS > 1 ? (Math.PI * 2) / nS : 0) * (ev.seed % nS),
          d = Math.max(far + 3, Math.min(far + 9, clearR - 9)),
          ux = Math.cos(a),
          uz = Math.sin(a),
          nx = -uz,
          nz = ux;
        const side = plan.city ? 12 : 0,
          cx = ux * d + nx * side,
          cz = uz * d + nz * side,
          face = Math.atan2(-ux, uz);
        const fromP = story.peoples.find((p) => p.name === c.from) || null;
        P.props.push({
          t: "cart",
          x: cx + nx * 5,
          z: cz + nz * 5,
          rot: Math.atan2(ux, -uz) + 0.4,
          load: "sacks",
        });
        P.props.push({
          t: "cart",
          x: cx - nx * 5.5,
          z: cz - nz * 5.5,
          rot: Math.atan2(ux, -uz) - 0.3,
          load: "sacks",
        });
        P.props.push({
          t: "tent",
          x: cx + ux * 5,
          z: cz + uz * 5,
          r: 2.4,
          h: 3.2,
          rot: a,
        });
        P.props.push({
          t: "firepit",
          x: cx + ux * 1.5,
          z: cz + uz * 1.5,
          lit: true,
        });
        P.lights.push({
          kind: "fire",
          x: cx + ux * 1.5,
          z: cz + uz * 1.5,
          y: 0.5,
        });
        person(cx - ux * 1.2, cz - uz * 1.2, face + Math.PI, "caravan master", {
          people: fromP,
          tag: "master",
        });
        person(
          cx + nx * 3.4 - ux * 0.8,
          cz + nz * 3.4 - uz * 0.8,
          face + Math.PI + 0.4,
          "caravan trader",
          { people: fromP, tag: "trader" },
        );
        person(
          cx - nx * 3.6 - ux * 0.6,
          cz - nz * 3.6 - uz * 0.6,
          face + Math.PI - 0.4,
          "caravan trader",
          { people: fromP, tag: "trader" },
        );
        person(
          cx + ux * 3.5 + nx * 1.2,
          cz + uz * 3.5 + nz * 1.2,
          face,
          "caravan guard",
          { people: fromP, tag: "guard", lookRole: "guard" },
        );
        P.at = { x: cx, z: cz };
        break;
      }
    }
    return P;
  }

  // ---- view/palettes.js ----
  // ============================================================
  // PALETTES — hand-picked 5-step ramps: night, shadow, base, lit, highlight.
  // Shadows lean blue-violet, highlights lean warm: classic hue shifting.
  // ============================================================

  // Render materials (per cell, per style)
