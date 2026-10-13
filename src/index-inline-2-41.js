// index-inline-2 41 — rng
// Lines 14331-15789 of readable/index-inline-2.pretty.js (statement-aligned).
  function sitePlan(story, s) {
    if (s._plan) return s._plan;
    // (the great city that fell is laid out a city's way)
    if (s.kind === "deadcity") return (s._plan = deadCityPlan(story, s));
    const rng = new Rng(hashInt(s.seed, 1, 0x51e));
    const people = wsPeople(story, s);
    const st = peopleStyle(story, people);
    const P = {
      kind: s.kind,
      r: SITE_CLEAR[s.kind] || 8,
      style: st,
      buildings: [],
      props: [],
      folk: [],
      spots: [],
      beacons: [],
    };
    const face = s.face ?? rng.float() * Math.PI * 2;
    // lay things out relative to the front: u to the right, v forwards
    const fx = Math.sin(face),
      fz = -Math.cos(face),
      rx = -fz,
      rz = fx;
    const at = (u, v) => [rx * u + fx * v, rz * u + fz * v];
    const house = (u, v, w, d, floors, turn = 0, extra = {}) => {
      const [x, z] = at(u, v);
      const b = {
        x,
        z,
        w,
        d,
        rot: frontRot(face + turn),
        floors,
        round: false,
        tower: false,
        chimney: false,
        kind: "house",
        roof: null,
        ...extra,
      };
      P.buildings.push(b);
      return b;
    };
    const prop = (t, u, v, o = {}) => {
      const [x, z] = at(u, v);
      const p = { t, x, z, ...o };
      P.props.push(p);
      return p;
    };
    const spot = (kind, u, v, y, r, o = {}) => {
      const [x, z] = at(u, v);
      P.spots.push({ kind, x, z, y, r, ...o });
    };
    const beacon = (kind, u, v, y, o = {}) => {
      const [x, z] = at(u, v);
      P.beacons.push({ kind, x, z, y, ...o });
    };
    const person = (k, u, v, role, o = {}) => {
      const [x, z] = at(u, v);
      const r2 = new Rng(hashInt(s.seed, k, 313));
      const name = folkName(story, s, k);
      r2.float();
      r2.float();
      const f = {
        k,
        x,
        z,
        face: o.face ?? face + Math.PI + (r2.float() - 0.5),
        look: folkLook(people, r2, o.lookRole || null),
        name,
        role,
        seed: hashInt(s.seed, k, 991),
        wander: o.wander ?? r2.chance(0.5),
      };
      // (where they work by day, standing; or, keeping watch, where they always are)
      if (o.post) {
        const [px, pz] = at(o.post[0], o.post[1]);
        f.post = { kind: "stand", x: px, z: pz, face: o.post[2] };
      }
      if (o.fixed) f.fixed = true;
      P.folk.push(f);
    };
    // where a house's chimney smokes: its top, in the site's metres (y above the house's base)
    const chimneyTop = (b) => {
      const ridge = (Math.min(b.w, b.d) / 2) * st.pitch;
      const cs = Math.cos(b.rot),
        sn = Math.sin(b.rot),
        cx = b.w * 0.25;
      return {
        x: b.x + cx * cs,
        z: b.z + cx * sn,
        y: b.floors * st.storeyH + ridge + 1.1,
      };
    };
    const smokeFrom = (b, kind = "smoke") => {
      const c = chimneyTop(b);
      P.beacons.push({
        kind,
        x: c.x,
        z: c.z,
        y: c.y,
        b: P.buildings.indexOf(b),
      });
    };
    const lightAt = (b) => {
      const cs = Math.cos(b.rot),
        sn = Math.sin(b.rot),
        off = b.d / 2 + 0.15;
      P.beacons.push({
        kind: "light",
        x: b.x - sn * off,
        z: b.z + cs * off,
        y: 1.5,
        b: P.buildings.indexOf(b),
      });
    };
    const round = rng.chance(st.round);
    const fieldRow = () => rng.pick(["grain", "grain", "green", "furrow"]);
    switch (s.kind) {
      // ---------- where people live ----------
      case "farm": {
        const w = 7 + rng.float() * 2.2,
          d = 5.4 + rng.float() * 1.2;
        const h = round
          ? house(0, 0, 6.5 + rng.float() * 1.5, 0, 1, 0, { round: true })
          : house(0, 0, w, d, st.floors[0] + (rng.chance(0.35) ? 1 : 0), 0, {
              chimney: true,
            });
        if (h.round) h.d = h.w;
        const side = rng.chance(0.5) ? 1 : -1;
        const barn = house(
          side * (11 + rng.float() * 2),
          -1 - rng.float() * 3,
          8 + rng.float() * 2,
          6 + rng.float(),
          1,
          (-side * Math.PI) / 2,
          { kind: "barn" },
        );
        if (h.round) smokeFrom(h, "smoke");
        else smokeFrom(h);
        lightAt(h);
        prop(
          rng.chance(0.5) ? "well" : "woodpile",
          -side * (4.5 + rng.float()),
          7 + rng.float() * 2,
          { rot: rng.float() * 6.28 },
        );
        const nF = 2 + rng.int(0, 2);
        const slots = [
          [-16, -17],
          [6, -19],
          [-side * 24, -3],
          [side * 25, 8],
          [-4, 26],
        ];
        for (let k = 0; k < nF; k++) {
          const [u, v] = slots[k];
          prop("field", u, v, {
            w: 12 + rng.float() * 7,
            d: 10 + rng.float() * 6,
            rot: frontRot(face) + (rng.chance(0.3) ? Math.PI / 2 : 0),
            crop: fieldRow(),
            seed: rng.int(0, 1e6),
          });
        }
        // a fence along the front of the yard
        prop("fence", 0, 12 + rng.float() * 2, {
          len: 18 + rng.float() * 8,
          rot: frontRot(face),
          gap: 3,
        });
        person(0, rng.float() * 4 - 2, 5 + rng.float() * 2, "farmer", {
          wander: true,
        });
        if (rng.chance(0.6))
          person(
            1,
            slots[0][0] + 2,
            slots[0][1] + 1,
            rng.chance(0.5) ? "farmhand" : "farmer",
            { wander: true },
          );
        break;
      }
      case "hamlet": {
        const n = 3 + rng.int(0, 2),
          ring = 10 + rng.float() * 3;
        const a0 = rng.float() * 6.28;
        for (let k = 0; k < n; k++) {
          const a = a0 + (k / n) * Math.PI * 2 + (rng.float() - 0.5) * 0.4;
          const u = Math.cos(a) * ring,
            v = Math.sin(a) * ring;
          // the door looks at the green
          const [x, z] = at(u, v),
            toC = Math.atan2(-x, z);
          const rr = rng.chance(st.round);
          const b = {
            x,
            z,
            w: rr ? 6 : 6 + rng.float() * 3,
            d: rr ? 6 : 5 + rng.float() * 1.5,
            rot: frontRot(Math.atan2(-x, z)),
            floors: rr ? 1 : st.floors[0] + (rng.chance(0.25) ? 1 : 0),
            round: rr,
            tower: false,
            chimney: !rr && rng.chance(0.75),
            kind: "house",
            roof: null,
          };
          void toC;
          P.buildings.push(b);
          if (b.chimney && rng.chance(0.7)) smokeFrom(b);
          if (rng.chance(0.7)) lightAt(b);
        }
        prop(rng.chance(0.5) ? "well" : "firepit", 0, 0, {
          lit: true,
          rot: rng.float() * 6.28,
        });
        // a rail between the first two houses, a beast tied at it for hire (the riders' line stops here)
        {
          const a = a0 + Math.PI / n,
            u = Math.cos(a) * 6.6,
            v = Math.sin(a) * 6.6,
            [x, z] = at(u, v);
          prop("rail", u, v, { rot: Math.atan2(z, x) + Math.PI / 2 });
          spot("stable", u, v, 0.9, 1.3);
        }
        for (let k = 0; k < 3; k++) {
          const a = a0 + ((k + 0.5) / 3) * Math.PI * 2;
          prop("field", Math.cos(a) * 30, Math.sin(a) * 30, {
            w: 14 + rng.float() * 6,
            d: 10 + rng.float() * 5,
            rot: a,
            crop: fieldRow(),
            seed: rng.int(0, 1e6),
          });
        }
        const roles = people && people.roles ? people.roles : ["farmer"];
        for (let k = 0; k < 2 + rng.int(0, 2); k++) {
          const a = rng.float() * 6.28,
            r = 2.5 + rng.float() * 5;
          person(
            k,
            Math.cos(a) * r,
            Math.sin(a) * r,
            k === 0 ? "farmer" : rng.chance(0.5) ? "farmer" : rng.pick(roles),
            { wander: k > 0 },
          );
        }
        break;
      }
      case "inn": {
        const w = 11 + rng.float() * 2,
          d = 7.5 + rng.float() * 1;
        const inn = house(
          0,
          0,
          w,
          d,
          Math.max(2, st.floors[1] > 2 ? 2 : st.floors[1]),
          0,
          { chimney: true, kind: "inn" },
        );
        smokeFrom(inn);
        lightAt(inn);
        P.beacons.push({
          kind: "light",
          ...(() => {
            const [x, z] = at(-w * 0.3, d / 2 + 0.15);
            return { x, z };
          })(),
          y: 4.4,
          b: 0,
        });
        const side = rng.chance(0.5) ? 1 : -1;
        house(side * (w / 2 + 5), -1.5, 5.5, 4.5, 1, (-side * Math.PI) / 2, {
          kind: "shed",
        });
        prop("innsign", -side * (w / 2 - 1), d / 2 + 4.5, {
          rot: frontRot(face),
        });
        beacon("lantern", -side * (w / 2 - 1) + 0.9, d / 2 + 4.5, 2.2);
        prop("bench", side * 2.2, d / 2 + 1.6, { rot: frontRot(face) });
        // a rail by the shed, and a beast tied to it, saddled, for hire
        prop("rail", side * (w / 2 + 4.6), d / 2 + 2.6, {
          rot: frontRot(face),
        });
        spot("stable", side * (w / 2 + 4.6), d / 2 + 2.6, 0.9, 1.3);
        prop("firepit", side * 5.5, d / 2 + 6, { lit: true });
        beacon("fire", side * 5.5, d / 2 + 6, 0.5);
        spot("bed", 0, d / 2 + 0.9, 1.1, 1.3);
        spot("innsign", -side * (w / 2 - 1), d / 2 + 4.5, 1.8, 0.7);
        // the innkeeper keeps the counter, inside
        const cL = Math.min(3.6, w * 0.35);
        person(0, w / 2 - 0.8 - cL / 2, -d / 2 + 2.15, "innkeeper", {
          wander: false,
          face,
        });
        person(1, side * 4.3, d / 2 + 7.2, "traveller", {
          lookRole: "traveller",
          wander: false,
        });
        if (rng.chance(0.6))
          person(
            2,
            side * 6.8,
            d / 2 + 5.1,
            rng.chance(0.5) ? "traveller" : "pilgrim",
            { lookRole: "traveller", wander: false },
          );
        break;
      }
      case "hut": {
        const role = hutRole(s, people, rng);
        P.role = role;
        const h = round
          ? house(0, 0, 5, 5, 1, 0, { round: true })
          : house(0, 0, 4.8 + rng.float(), 4 + rng.float() * 0.6, 1, 0, {
              chimney: true,
            });
        if (h.round) h.d = h.w;
        if (!h.round) smokeFrom(h);
        else
          P.beacons.push({
            kind: "smoke",
            x: h.x,
            z: h.z,
            y: 3.2 + (h.w / 2) * st.pitch,
            b: 0,
          });
        lightAt(h);
        if (role === "charcoal-burner") {
          prop("kiln", 7, 3, {});
          beacon("smoke", 7, 3, 2.4);
        } else
          prop(
            role === "hunter" || role === "trapper" ? "rack" : "woodpile",
            4.2,
            1,
            { rot: frontRot(face) },
          );
        prop("firepit", -1, 5, { lit: true });
        person(0, 0.5, 4.2, role, { wander: true });
        break;
      }
      case "tents": {
        const n = 3 + rng.int(0, 2),
          ring = 6.5 + rng.float() * 1.5;
        for (let k = 0; k < n; k++) {
          const a = (k / n) * 6.28 + rng.float() * 0.5;
          prop("tent", Math.cos(a) * ring, Math.sin(a) * ring, {
            r: 2 + rng.float() * 0.8,
            h: 3 + rng.float() * 0.9,
            rot: a,
          });
        }
        prop("firepit", 0, 0, { lit: true });
        beacon("fire", 0, 0, 0.5);
        const roles = people && people.roles ? people.roles : ["herder"];
        for (let k = 0; k < 2 + rng.int(0, 2); k++) {
          const a = rng.float() * 6.28;
          person(k, Math.cos(a) * 2.6, Math.sin(a) * 2.6, rng.pick(roles), {
            wander: false,
            face: Math.atan2(-Math.cos(a), Math.sin(a)),
          });
        }
        break;
      }
      // ---------- the newer places: a mill, by the sea, under the hills, on the road, holy ground ----------
      case "mill": {
        // a windmill: a round tower narrowing to a cap, its sails turning out over the front of it; the
        // miller's house beside it, sacks by the mill door, a cart; grain in the fields round about
        const H = 9 + rng.float() * 2.5,
          r0 = 3 + rng.float() * 0.4;
        const stone = [
          "stone",
          "darkstone",
          "sandstone",
          "basalt",
          "mud",
          "coral",
          "white",
        ].includes(st.wallKind);
        prop("windmill", 0, 0, {
          h: H,
          r0,
          rot: frontRot(face),
          seed: rng.int(0, 1e6),
          stone,
        });
        P.mill = { h: H, r0 };
        const side = rng.chance(0.5) ? 1 : -1;
        const hs = house(
          side * (r0 + 7.5),
          -2.5,
          6.2 + rng.float(),
          5 + rng.float() * 0.8,
          1,
          (-side * Math.PI) / 2,
          { chimney: true },
        );
        smokeFrom(hs);
        lightAt(hs);
        prop("sacks", -side * 2, r0 + 1.3, { rot: rng.float() * 6.28 });
        prop("cart", side * 3.6, r0 + 4.8, {
          rot: frontRot(face) + 0.6 * side,
          load: "sacks",
        });
        for (let k = 0; k < 2; k++)
          prop(
            "field",
            (k ? -1 : 1) * (18 + rng.float() * 4),
            -15 - rng.float() * 6,
            {
              w: 14 + rng.float() * 6,
              d: 10 + rng.float() * 5,
              rot: frontRot(face),
              crop: "grain",
              seed: rng.int(0, 1e6),
            },
          );
        spot("mill", 0, r0 + 0.75, 1.2, 1.2);
        person(0, side * 1.9, r0 + 2.4, "miller", {
          wander: false,
          face,
          lookRole: "miller",
          post: [side * 1.9, r0 + 2.4, face],
        });
        if (rng.chance(0.55))
          person(1, -side * 3.2, r0 + 3.2, "farmhand", { wander: true });
        P.r = Math.max(P.r, r0 + 6);
        break;
      }
      case "fishhut": {
        // a hut above the beach, its door to the water; fish drying on a rack, nets hung on poles, a boat
        // drawn up on the shore, a jetty out over the water, a fire to smoke the catch
        const h = round
          ? house(0, -1.5, 5, 5, 1, 0, { round: true })
          : house(0, -1.5, 5 + rng.float(), 4.2 + rng.float() * 0.6, 1, 0, {
              chimney: true,
            });
        if (h.round) h.d = h.w;
        if (!h.round) smokeFrom(h);
        else
          P.beacons.push({
            kind: "smoke",
            x: h.x,
            z: h.z,
            y: 3.2 + (h.w / 2) * st.pitch,
            b: 0,
          });
        lightAt(h);
        prop("fishrack", -4.4, 2.8, { rot: frontRot(face) + 0.2 });
        prop("nets", 4.6, 3.2, { rot: frontRot(face) - 0.3 });
        prop("firepit", -1.2, 5, { lit: true });
        beacon("fire", -1.2, 5, 0.5);
        prop("boat", 3.6, 9.6, { rot: frontRot(face) + 0.35, len: 4.4 });
        prop("jetty", -2.8, 17, { len: 18, w: 1.6, rot: frontRot(face) });
        person(0, -3.4, 4.4, "fisher", {
          wander: false,
          lookRole: "fisher",
          post: [-3.3, 4.2, face + Math.PI * 0.7],
        });
        if (rng.chance(0.6))
          person(1, 4.2, 5.2, "net-mender", {
            wander: false,
            lookRole: "fisher",
            post: [4.1, 5.0, face - 0.7],
          });
        break;
      }
      case "lighthouse": {
        // a tall white tower on the headland, banded red, a gallery round its top and the lamp room over it,
        // its door turned away from the sea; the keeper's cottage in its lee
        const r = 2.5 + rng.float() * 0.3,
          H = 14 + rng.float() * 5;
        prop("lighthouse", 0, 0, {
          r,
          h: H,
          rot: frontRot(face + Math.PI),
          seed: rng.int(0, 1e6),
          band: rng.pick([
            [176, 52, 44],
            [176, 52, 44],
            [40, 44, 56],
            [196, 150, 60],
          ]),
        });
        P.tower = { r, H, manned: true, light: true };
        spot("climb", 0, -(r + 0.9), 1.1, 1.1);
        beacon("lamp", 0, 0, H + 1.6, { keep: true });
        const side = rng.chance(0.5) ? 1 : -1;
        const ck = house(side * (r + 5.5), -(r + 4.5), 5.6, 4.6, 1, Math.PI, {
          chimney: true,
        });
        smokeFrom(ck);
        lightAt(ck);
        person(0, side * 1.6, -(r + 2.2), "lightkeeper", {
          wander: false,
          face: face + Math.PI,
          lookRole: "lightkeeper",
          post: [side * 1.6, -(r + 2.2), face + Math.PI],
        });
        P.r = Math.max(P.r, r + 11);
        break;
      }
      case "mine": {
        // a way into the hillside, timbered against the fall, a heap of broken rock beside it, rails out of the
        // dark to a cart; the miners' hut, and a lantern by the way in
        const m = prop("cavemouth", 0, 0, {
          rot: frontRot(face),
          w: 2.7 + rng.float() * 0.5,
          h: 2.5 + rng.float() * 0.4,
          seed: rng.int(0, 1e6),
          mine: true,
        });
        m.Au = 10 + rng.float() * 5;
        m.Bw = 10 + rng.float() * 4;
        m.wc = -m.Bw * (0.25 + rng.float() * 0.15);
        m.Hf = m.h + 2.2 + rng.float() * 1.5;
        m.Uc = m.w / 2 + 2.4 + rng.float() * 1.4;
        prop("minedoor", 0, 0.12, { rot: frontRot(face), w: m.w, h: m.h });
        const side = rng.chance(0.5) ? 1 : -1;
        prop("rails", 0, 4.2, { len: 8.6, rot: frontRot(face) });
        prop("cart", 0, 7.6, { rot: frontRot(face), load: "ore" });
        prop("spoil", side * (m.Uc + 4.2), 4.5, {
          r: 3 + rng.float(),
          seed: rng.int(0, 1e6),
        });
        const hut = house(
          -side * (m.Uc + 6.5),
          9,
          5.6,
          4.6,
          1,
          (side * Math.PI) / 2,
          { chimney: true },
        );
        smokeFrom(hut);
        lightAt(hut);
        beacon("lantern", side * (m.w / 2 + 0.75), 0.9, 2.3);
        spot("cave", 0, 0.6, 1.4, 1.6);
        person(0, side * 2.5, 5.6, "mine foreman", {
          wander: false,
          face,
          lookRole: "foreman",
          post: [side * 2.5, 5.6, face],
        });
        person(1, -side * 1.9, 9.5, "miner", {
          wander: true,
          lookRole: "miner",
        });
        if (rng.chance(0.6))
          person(2, side * 4.2, 10.5, "miner", {
            wander: true,
            lookRole: "miner",
          });
        P.r = Math.max(P.r, m.Uc + 3, 15);
        break;
      }
      case "ferry": {
        // a landing: a jetty out into the water, the ferry tied up at the end of it, a bell on a post to call
        // it with, the ferryman's hut
        prop("jetty", 0, 16, { len: 20, w: 2, rot: frontRot(face) });
        prop("boat", 2.1, 22.5, {
          rot: frontRot(face),
          len: 6.4,
          afloat: true,
          big: true,
        });
        prop("bell", -1.7, 5.2, { rot: frontRot(face) });
        beacon("lantern", -1.7, 5.2, 2.3);
        const side = rng.chance(0.5) ? 1 : -1;
        const hh = house(side * 7.5, -2.5, 5, 4.2, 1, 0, { chimney: true });
        smokeFrom(hh);
        lightAt(hh);
        spot("bell", -1.7, 5.2, 1.7, 0.8);
        person(0, 1.3, 5.4, "ferryman", {
          wander: false,
          face: face + Math.PI,
          lookRole: "ferryman",
          post: [1.3, 5.4, face + Math.PI],
        });
        P.r = Math.max(P.r, 12);
        break;
      }
      case "watch": {
        // a watchtower of timber beside the road, a fire basket up on its platform; the people's banner, a hut
        // for the watch, a fire by the road, and the guards (who are always there: it is a watch)
        const H = 7.5 + rng.float() * 2;
        prop("watchtower", -3.4, -1.6, {
          h: H,
          rot: frontRot(face),
          seed: rng.int(0, 1e6),
        });
        P.tower = { r: 1.7, H, manned: true, wood: true };
        spot("climb", -3.4, -1.6 + 2.15, 1.1, 1.0);
        const hut = house(4.8, -2.6, 5.2, 4.2, 1, 0, { chimney: true });
        smokeFrom(hut);
        lightAt(hut);
        prop("firepit", 0.6, 3.6, { lit: true });
        beacon("fire", 0.6, 3.6, 0.5);
        prop("banner", -0.9, 6.3, {
          h: 3.6,
          lean: 0,
          rot: frontRot(face),
          people: true,
        });
        person(0, 1.8, 6.5, "guard", {
          wander: false,
          face,
          lookRole: "guard",
          fixed: true,
        });
        person(1, 2.3, 2.5, "guard", {
          wander: false,
          face: face + 2.4,
          lookRole: "guard",
          fixed: true,
        });
        break;
      }
      case "temple": {
        // a holy place of the people's faith: a roof on pillars over the figure of what they worship, a
        // fire before it, a bowl for offerings; a priest, and now and then someone come a long way to pray
        const arch = people ? people.arch : null,
          bless = faithBless(people ? people.faith : null);
        P.faith = people ? people.faith : "the old gods";
        P.bless = bless;
        prop("temple", 0, -1, {
          w: 6.4 + rng.float(),
          d: 5.4 + rng.float() * 0.8,
          rot: frontRot(face),
          arch,
          seed: rng.int(0, 1e6),
        });
        prop("idol", 0, -1.6, {
          rot: frontRot(face),
          bless,
          arch,
          h: 2.2 + rng.float() * 0.5,
          seed: rng.int(0, 1e6),
        });
        prop("brazier", 0, 2.4, { rot: frontRot(face) });
        beacon("fire", 0, 2.4, 1.1);
        spot("shrine", 0, 1.2, 1.0, 1.0, { temple: true });
        const side = rng.chance(0.5) ? 1 : -1;
        const hh = house(side * 9, -2, 5.2, 4.4, 1, (-side * Math.PI) / 2, {
          chimney: true,
        });
        smokeFrom(hh);
        lightAt(hh);
        person(0, side * 2.6, 2.6, "priest", {
          wander: false,
          face,
          lookRole: "priest",
          post: [side * 2.6, 2.6, face + side * 0.6],
        });
        if (rng.chance(0.5))
          person(1, -side * 1.6, 4.6, "pilgrim", {
            lookRole: "traveller",
            wander: false,
            face: face + Math.PI,
          });
        P.r = Math.max(P.r, 12);
        break;
      }
      // ---------- a house of your own ----------
      case "home": {
        const D = homeDims(s.size, st),
          Z = HOME_SIZE[s.size] || HOME_SIZE.hut;
        const floors =
          s.size === "hut" || D.round
            ? 1
            : Math.max(1, Math.min(Z.floors, st.floors[1]));
        const porch = !!(s.home && s.home.porch);
        // (and whatever the house-wright built in: an oven, a bench and an anvil, a loom)
        const work =
          s.home && Array.isArray(s.home.work) ? s.home.work.slice() : null;
        const b = house(0, 0, D.w, D.d, floors, 0, {
          round: D.round,
          chimney: !D.round,
          kind: "home",
          size: s.size,
          porch,
          work,
        });
        P.r = Math.hypot(D.w, D.d + (porch ? 4 : 0)) / 2 + 2.5;
        // where you wake: in your own bed
        const bd = homeBed(D.w, D.d, D.round),
          cs = Math.cos(b.rot),
          sn = Math.sin(b.rot);
        const toSite = (lx, lz) => [
          b.x + lx * cs - lz * sn,
          b.z + lx * sn + lz * cs,
        ];
        P.wake = {
          x: b.x + bd.x * cs - bd.z * sn,
          z: b.z + bd.x * sn + bd.z * cs,
        };
        // (the stall goes out front on the side away from the door; the field and the pen round the back and the other side)
        const front = (D.round ? D.w / 2 : D.d / 2) + (porch ? 1.95 : 0);
        let doorLx = 0;
        if (!D.round) {
          const nwF = Math.max(1, Math.floor(D.w / 2.4));
          doorLx = -D.w / 2 + ((Math.floor(nwF / 2) + 0.5) * D.w) / nwF;
        }
        const side = doorLx > 0.3 ? -1 : 1;
        if (s.home && s.home.stall) {
          // a stall out front, to one side of the door and facing the same way, its keeper behind it
          const lx = side * Math.max(1.6, D.w / 2 - 1.1),
            lz = front + 2.7;
          const [sx, sz] = toSite(lx, lz),
            [kx, kz] = toSite(lx, lz - 0.95),
            [cx, cz] = toSite(lx, lz + 1.0);
          P.props.push({
            t: "stall",
            x: sx,
            z: sz,
            rot: b.rot,
            face,
            cloth: s.seed % 3,
            mine: true,
          });
          P.spots.push({ kind: "stall", x: cx, z: cz, y: 1.0, r: 1.2 });
          const r2 = new Rng(hashInt(s.seed, 0, 313));
          r2.float();
          r2.float();
          P.folk.push({
            k: 0,
            x: kx,
            z: kz,
            face,
            look: folkLook(people, r2, null),
            name: folkName(story, s, 0),
            role: "stall keeper",
            seed: hashInt(s.seed, 0, 991),
            wander: false,
            keeper: true,
          });
          P.r = Math.max(P.r, Math.hypot(sx, sz) + 1.6);
        }
        // a field dug and fenced behind the house, a pen for animals beside it (view/placesview.js draws them;
        // the field's crop and the animals come from your save)
        const yard = (what, rec) => {
          const Y = yardPart(D.w, D.round ? D.w : D.d, side, what, rec.at);
          if (!Y) return;
          const [x, z] = toSite(Y.cx, Y.cz),
            loc = (u, w) => toSite(Y.cx + u, Y.cz + w);
          const pr = {
            t: YARD_PROP[what],
            x,
            z,
            rot: b.rot,
            w: Y.sx,
            d: Y.sz,
            gate: Y.gate,
            seed: hashInt(
              s.seed,
              what === "field" ? 41 : what === "pen" ? 43 : 49,
              7,
            ),
            at: rec.at,
          };
          if (what === "stable") {
            // (open to the front; your beast stands in it looking out, when it is home)
            const [hx, hz] = loc(0, Y.sz / 2 - 0.55);
            P.spots.push({ kind: "mystable", x: hx, z: hz, y: 1.35, r: 1.1 });
          } else if (what === "field") {
            // (you can see to it from any side)
            for (const [u, w] of [
              [0, Y.sz / 2 + 0.4],
              [0, -Y.sz / 2 - 0.4],
              [Y.sx / 2 + 0.4, 0],
              [-Y.sx / 2 - 0.4, 0],
            ]) {
              const [qx, qz] = loc(u, w);
              P.spots.push({ kind: "myfield", x: qx, z: qz, y: 0.5, r: 1.8 });
            }
          } else {
            const L = penLayout(Y);
            pr.lay = L;
            const [tx, tz] = loc(L.trough.u, L.trough.w),
              [cx, cz] = loc(L.coop.u, L.coop.w);
            P.spots.push({ kind: "trough", x: tx, z: tz, y: 0.45, r: 1.0 });
            P.spots.push({ kind: "coop", x: cx, z: cz, y: 0.7, r: 0.8 });
          }
          P.props.push(pr);
          P.r = Math.max(
            P.r,
            Math.hypot(Math.abs(Y.cx) + Y.sx / 2, Math.abs(Y.cz) + Y.sz / 2) +
              2.5,
          );
        };
        if (s.home && s.home.field) yard("field", s.home.field);
        if (s.home && s.home.pen) yard("pen", s.home.pen);
        if (s.home && s.home.stable) yard("stable", s.home.stable);
        // a well by the front corner away from the stall; hives on a bench by the back corner on its side
        if (s.home && s.home.well) {
          const [x, z] = toSite(-side * (D.w / 2 + 1.15), D.d / 2 - 0.75);
          P.props.push({
            t: "mywell",
            x,
            z,
            rot: b.rot,
            seed: hashInt(s.seed, 51, 7),
          });
          P.spots.push({ kind: "mywell", x, z, y: 0.95, r: 0.95 });
          P.r = Math.max(P.r, Math.hypot(D.w / 2 + 2, D.d / 2) + 2);
        }
        if (s.home && s.home.hives) {
          const [x, z] = toSite(side * (D.w / 2 + 0.9), -(D.d / 2 + 1.1));
          P.props.push({
            t: "myhives",
            x,
            z,
            rot: b.rot,
            seed: hashInt(s.seed, 47, 7),
          });
          P.spots.push({ kind: "myhives", x, z, y: 0.75, r: 1.0 });
          P.r = Math.max(P.r, Math.hypot(D.w / 2 + 1.9, D.d / 2 + 1.5) + 2);
        }
        // last, a palisade round all of it, its gate in front of the door
        if (s.home && s.home.palisade) {
          const ringR = P.r + 0.4;
          P.props.push({
            t: "palisade",
            x: b.x,
            z: b.z,
            rot: b.rot,
            r: ringR,
            seed: hashInt(s.seed, 53, 7),
          });
          P.r = ringR + 1.5;
        }
        break;
      }
      // ---------- under the hills ----------
      case "cave": {
        // the mouth at the foot of a face of rock, the rock running back into the hill behind it
        const m = prop("cavemouth", 0, 0, {
          rot: frontRot(face),
          w: 3.2 + rng.float() * 1.4,
          h: 2.7 + rng.float() * 0.8,
          seed: rng.int(0, 1e6),
        });
        // (the knoll: Au across and Bw deep, its top wc behind the mouth, Hf high; a bay Uc either side)
        m.Au = 11 + rng.float() * 6;
        m.Bw = 11 + rng.float() * 5;
        m.wc = -m.Bw * (0.25 + rng.float() * 0.15);
        m.Hf = m.h + 2.4 + rng.float() * 1.8;
        m.Uc = m.w / 2 + 2.6 + rng.float() * 1.8;
        spot("cave", 0, 0.6, 1.4, 1.6);
        // (nothing grows on the face of it or in the bay before it)
        P.r = Math.max(P.r, m.Uc + 3);
        break;
      }
      // ---------- what is left of the past ----------
      case "ruin": {
        const W = 10 + rng.float() * 6,
          D = 8 + rng.float() * 4,
          rot = frontRot(face);
        prop("ruinwalls", 0, 0, {
          w: W,
          d: D,
          rot,
          seed: rng.int(0, 1e6),
          tall: 2.6 + rng.float() * 1.6,
        });
        const nP = rng.int(1, 4);
        for (let k = 0; k < nP; k++)
          prop("pillar", (k - (nP - 1) / 2) * 3.2, D / 2 + 3.5, {
            h: 1 + rng.float() * 4.2,
            r: 0.42,
          });
        for (let k = 0; k < 4; k++) {
          const a = rng.float() * 6.28,
            r = W * 0.6 + rng.float() * 4;
          prop("block", Math.cos(a) * r, Math.sin(a) * r, {
            s: 0.5 + rng.float() * 0.5,
            rot: rng.float() * 6.28,
          });
        }
        spot("carving", -W / 4, -D / 2 + 0.55, 1.4, 0.9);
        spot("rubble", W / 2 + 1.5, 1, 0.5, 1.2);
        prop("rubble", W / 2 + 1.5, 1, {});
        if (s.owner >= 0 && rng.chance(0.14)) {
          P.hermit = true;
          prop("firepit", 0, 0, { lit: true });
          beacon("fire", 0, 0, 0.5);
          person(0, 1.5, 0.8, "hermit", { wander: false });
        }
        break;
      }
      case "tower": {
        const r = 2.8 + rng.float() * 0.6,
          manned = (s.roadM != null && s.roadM < 3000) || s.townM < 60e3;
        // above the trees where there are trees
        const wood = [
          B.FOREST,
          B.WETFOREST,
          B.TAIGA,
          B.JUNGLE,
          B.DRYFOREST,
        ].includes(s.biome);
        const H =
          (manned ? 13 + rng.float() * 4 : 10 + rng.float() * 9) +
          (wood ? 9 : 0);
        P.tower = { r, H, manned };
        prop("tower", 0, 0, {
          r,
          h: H,
          broken: !manned,
          rot: frontRot(face),
          seed: rng.int(0, 1e6),
        });
        spot("climb", 0, r + 0.9, 1.1, 1.1);
        if (manned) {
          beacon("fire", 0, 0, H + 0.6);
          person(0, 1.6, r + 2.2, "warden", { wander: false, face });
        }
        break;
      }
      case "circle": {
        const n = 7 + rng.int(0, 6),
          rad = 6 + rng.float() * 3;
        for (let k = 0; k < n; k++) {
          const a = (k / n) * 6.28 + rng.float() * 0.15;
          const fallen = rng.chance(0.18);
          prop("slab", Math.cos(a) * rad, Math.sin(a) * rad, {
            w: 0.9 + rng.float() * 0.4,
            d: 0.5 + rng.float() * 0.2,
            h: 1.8 + rng.float() * 1.6,
            rot: a + Math.PI / 2,
            lean: fallen ? 1.45 : (rng.float() - 0.5) * 0.12,
            seed: rng.int(0, 1e6),
          });
        }
        prop("altar", 0, 0, { rot: rng.float() * 6.28 });
        spot("altar", 0, 0, 0.8, 1.3);
        if (s.owner >= 0 && rng.chance(0.12))
          person(0, 2.4, 1.2, "pilgrim", {
            lookRole: "traveller",
            wander: false,
          });
        break;
      }
      case "barrow": {
        const L = 12 + rng.float() * 4,
          Wd = 7 + rng.float() * 2,
          Hh = 2.6 + rng.float() * 0.8;
        prop("mound", 0, 0, { l: L, w: Wd, h: Hh, rot: frontRot(face) });
        prop("doorway", 0, L / 2 - 0.4, { rot: frontRot(face), h: 2.1 });
        spot("barrow", 0, L / 2 + 0.6, 1.1, 1.1);
        if (rng.chance(0.5))
          prop("slab", 2.8, L / 2 + 3, {
            w: 0.8,
            d: 0.45,
            h: 2.2 + rng.float(),
            rot: frontRot(face),
            lean: 0.05,
            seed: rng.int(0, 1e6),
          });
        break;
      }
      case "hotspring": {
        const n = 2 + rng.int(0, 2);
        let big = null;
        for (let k = 0; k < n; k++) {
          const a = rng.float() * 6.28,
            r = k ? 3.5 + rng.float() * 3 : 0,
            rr = k ? 1.4 + rng.float() * 1.2 : 2.6 + rng.float() * 0.8;
          const p = prop("pool", Math.cos(a) * r, Math.sin(a) * r, {
            r: rr,
            hot: true,
            seed: rng.int(0, 1e6),
          });
          beacon("steam", Math.cos(a) * r, Math.sin(a) * r, 0.3);
          if (!big) big = p;
        }
        P.pool = big;
        P.spots.push({ kind: "bathe", x: big.x, z: big.z, y: 0.3, r: big.r });
        break;
      }
      case "bigtree": {
        prop("bigtree", 0, 0, {
          s: 3.6 + rng.float() * 1.2,
          rot: rng.float() * 6.28,
          v: rng.float(),
        });
        if (rng.chance(0.55))
          prop("ribbons", 0, 0, { rot: rng.float() * 6.28 });
        spot("bigtree", 0, 0, 1.2, 1.4, { trunk: true });
        break;
      }
      case "battlefield": {
        for (let k = 0; k < 22 + rng.int(0, 10); k++) {
          const a = rng.float() * 6.28,
            r = Math.sqrt(rng.float()) * 20;
          prop("blade", Math.cos(a) * r, Math.sin(a) * r, {
            rot: rng.float() * 6.28,
            lean: (rng.float() - 0.5) * 0.7,
            h: 1.0 + rng.float() * 0.5,
            shield: rng.chance(0.25),
          });
        }
        for (let k = 0; k < 4 + rng.int(0, 3); k++) {
          const a = rng.float() * 6.28,
            r = 6 + rng.float() * 14;
          prop("cairn", Math.cos(a) * r, Math.sin(a) * r, {
            h: 1.2 + rng.float() * 0.7,
            seed: rng.int(0, 1e6),
          });
        }
        for (let k = 0; k < 5; k++) {
          const a = rng.float() * 6.28,
            r = rng.float() * 16;
          prop("helm", Math.cos(a) * r, Math.sin(a) * r, {
            rot: rng.float() * 6.28,
          });
        }
        prop("banner", 1.5, -2, {
          h: 3.6,
          lean: 0.25,
          rot: rng.float() * 6.28,
        });
        spot("field", 1.5, -2, 1.4, 1.4);
        for (let k = 0; k < 2; k++) {
          const a = rng.float() * 6.28,
            r = 4 + rng.float() * 8;
          const [u, v] = [Math.cos(a) * r, Math.sin(a) * r];
          prop("blade", u, v, {
            rot: rng.float() * 6.28,
            lean: 0.2,
            h: 0.95,
            keep: k,
          });
          spot("blade", u, v, 0.6, 0.6, { n: k });
        }
        break;
      }
      case "peak": {
        prop("cairn", 0, 0, {
          h: 2.4 + rng.float() * 0.8,
          seed: rng.int(0, 1e6),
          pole: true,
        });
        spot("view", 0, 0, 1.2, 1.6);
        break;
      }
      // ---------- somebody odd, on their own ----------
      case "hermit": {
        const H = hermitOf(story, s);
        // a crooked tower, narrow and tall, a spire on it; purple smoke out of the top
        const b = house(
          0,
          0,
          4.2 + rng.float() * 0.8,
          4.2 + rng.float() * 0.6,
          2 + rng.int(0, 1),
          0,
          { tower: true, kind: "house", crooked: true },
        );
        P.beacons.push({
          kind: "mage",
          x: b.x,
          z: b.z,
          y: b.floors * st.storeyH + 2.6,
          b: 0,
        });
        lightAt(b);
        prop("cauldron", 2.4, 4.4, { rot: rng.float() * 6.28 });
        beacon("brew", 2.4, 4.4, 0.75);
        prop("chimes", -2.9, 3.4, {
          rot: rng.float() * 6.28,
          seed: rng.int(0, 1e6),
        });
        for (let k = 0; k < 5; k++) {
          const a = -0.5 + k * 0.42 + rng.float() * 0.2;
          prop("totem", Math.sin(a) * 9, Math.cos(a) * 9, {
            h: 1.1 + rng.float() * 0.9,
            rot: rng.float() * 6.28,
            seed: rng.int(0, 1e6),
          });
        }
        prop("mushring", -5.5 + rng.float(), -3.5 + rng.float(), {
          r: 1.8 + rng.float() * 0.8,
          seed: rng.int(0, 1e6),
        });
        // the hermit, by the cauldron
        const [hx, hz] = at(1.1, 5.2);
        const r2 = new Rng(hashInt(s.seed, 0, 313));
        const look = folkLook(people, r2, "hermit");
        look.main = H.robe;
        P.folk.push({
          k: 0,
          x: hx,
          z: hz,
          face: face + Math.PI * 0.85,
          look,
          name: hermitFull(H),
          role: "hermit",
          seed: hashInt(s.seed, 0, 991),
          wander: false,
        });
        P.hermit = H;
        break;
      }
      // ---------- the wonders ----------
      case "skystone": {
        // a star that fell: the ring of earth it threw up, scorched ground, and the stone, still glowing
        const R0 = 8 + rng.float() * 2.5;
        prop("crater", 0, 0, { r: R0, seed: rng.int(0, 1e6) });
        prop("starstone", 0, 0, {
          s: 1.6 + rng.float() * 0.4,
          rot: rng.float() * 6.28,
          seed: rng.int(0, 1e6),
        });
        // where it came down among trees, it laid the forest flat all round, every trunk pointing away
        if (
          [
            B.FOREST,
            B.WETFOREST,
            B.TAIGA,
            B.JUNGLE,
            B.DRYFOREST,
            B.SAVANNA,
          ].includes(s.biome)
        )
          prop("felled", 0, 0, {
            r0: R0 + 3.6,
            r1: R0 + 16,
            n: 30,
            seed: rng.int(0, 1e6),
          });
        spot("starstone", 0, 0, 1.3, 2.6, { reach: 4.2 });
        // a pale beam stands up out of it into the sky, by day and by night; by night it glows the wrong colour for any fire
        beacon("pillar", 0, 0, 0.6);
        beacon("star", 0, 0, 2.2);
        break;
      }
      case "giantbones": {
        // something vast lay down here and never got up: its ribs stand out of the ground like
        // the frame of a hall, its skull at the front end
        const L = 20 + rng.float() * 8;
        P.horns = rng.chance(0.7);
        prop("giantbones", 0, 0, {
          l: L,
          w: 3.2 + rng.float() * 0.8,
          h: 6 + rng.float() * 3,
          rot: frontRot(face),
          seed: rng.int(0, 1e6),
          horns: P.horns,
        });
        spot("skull", 0, L / 2 + 2.6, 1.6, 2.4, { reach: 4 });
        break;
      }
      case "geysers": {
        // a crust of white and yellow stone, pools boiling on it, and the big vent that throws
        // boiling water at the sky every minute or two
        prop("sinter", 0, 0, {
          r: 13 + rng.float() * 3,
          seed: rng.int(0, 1e6),
        });
        const n = 3 + rng.int(0, 2);
        for (let k = 0; k < n; k++) {
          const a = (k / n) * 6.28 + rng.float() * 0.8,
            r = 6 + rng.float() * 4;
          prop("vent", Math.cos(a) * r, Math.sin(a) * r, {
            r: 0.55 + rng.float() * 0.55,
            seed: rng.int(0, 1e6),
          });
          beacon("steam", Math.cos(a) * r, Math.sin(a) * r, 0.5);
        }
        prop("geyser", 0, 0, { r: 1.5, seed: rng.int(0, 1e6) });
        beacon("steam", 0, 0, 0.8);
        P.geyser = {
          x: 0,
          z: 0,
          r: 2.3,
          period: 45 + rng.float() * 35,
          dur: 9,
          phase: rng.float(),
        };
        spot("geyser", 0, 3.1, 0.8, 1.3);
        break;
      }
      case "stonegrove": {
        // a forest, long ago, turned to stone: trunks standing and fallen, red and grey and amber
        const n = 10 + rng.int(0, 6);
        // in the middle, one that was a giant: still standing, branches and all, every one of them stone
        prop("stonetree", 0, 0, {
          h: 10 + rng.float() * 3,
          r: 1.25 + rng.float() * 0.3,
          n: 5 + rng.int(0, 2),
          rot: rng.float() * 6.28,
          tint: rng.int(0, 2),
          seed: rng.int(0, 1e6),
        });
        for (let k = 1; k < n; k++) {
          const a = rng.float() * 6.28,
            r = 4.2 + Math.sqrt(rng.float()) * 10;
          const fallen = rng.chance(0.35);
          prop("stonetrunk", Math.cos(a) * r, Math.sin(a) * r, {
            h: fallen ? 4 + rng.float() * 6 : 1.4 + rng.float() * 4.5,
            r: 0.32 + rng.float() * 0.4,
            fallen,
            rot: rng.float() * 6.28,
            lean: fallen ? 0 : (rng.float() - 0.5) * 0.22,
            tint: rng.int(0, 2),
            seed: rng.int(0, 1e6),
          });
        }
        spot("stonetree", 0, 0, 1.3, 1.8, { reach: 3.2 });
        break;
      }
      // ---------- small things ----------
      case "cairn":
        prop("cairn", 0, 0, {
          h: 1.2 + rng.float() * 0.9,
          seed: rng.int(0, 1e6),
        });
        spot("cairn", 0, 0, 0.7, 1.1);
        break;
      case "stone": {
        P.carved = rng.chance(0.5);
        prop("slab", 0, 0, {
          w: 1 + rng.float() * 0.4,
          d: 0.5 + rng.float() * 0.25,
          h: 2.5 + rng.float() * 1.8,
          rot: rng.float() * 6.28,
          lean: (rng.float() - 0.5) * 0.14,
          seed: rng.int(0, 1e6),
          carved: P.carved,
        });
        spot("stone", 0, 0, 1.4, 0.9);
        break;
      }
      case "shrine": {
        // in its people's way: a post and a box, a stone with a niche, a pole of ribbons and horns, a bowl of fire
        const arch = people ? people.arch : null,
          look = SHRINE_LOOK[arch] || "post";
        prop("shrine", 0, 0, {
          rot: frontRot(face),
          look,
          arch,
          seed: rng.int(0, 1e6),
        });
        spot("shrine", 0, 0.35, 1.0, 0.6);
        if (look === "bowl") beacon("fire", 0, 0, 1.1);
        else beacon("candle", 0, 0.3, look === "stele" ? 0.95 : 1.05);
        break;
      }
      case "camp": {
        prop("firepit", 0, 0, { lit: false });
        prop("log", 1.6, 0.4, { rot: 1.3 + rng.float() * 0.4 });
        if (rng.chance(0.5)) prop("log", -0.6, 1.7, { rot: rng.float() * 0.4 });
        if (rng.chance(0.45))
          prop("frame", -1.5, -1.7, { rot: rng.float() * 6.28 });
        spot("camp", 0, 0, 0.3, 1.0);
        break;
      }
      case "grave":
        prop("grave", 0, 0, {
          rot: rng.float() * 6.28,
          marker: rng.chance(0.55) ? "stone" : "post",
        });
        spot("grave", 0, 0, 0.5, 1.1);
        break;
      case "spring": {
        const r = 1 + rng.float() * 0.6;
        prop("pool", 0, 0, { r, hot: false, seed: rng.int(0, 1e6) });
        spot("spring", 0, 0, 0.1, r);
        break;
      }
      case "stash":
        prop("stash", 0, 0, { rot: rng.float() * 6.28 });
        spot("stash", 0, 0, 0.4, 0.8);
        break;
      case "bones":
        prop("bones", 0, 0, {
          l: 6 + rng.float() * 4,
          rot: rng.float() * 6.28,
        });
        spot("bones", 0, 0, 1.0, 2.2);
        break;
      case "sign":
        prop("sign", 0, 0, { head: s.head || 0 });
        spot("sign", 0, 0, 1.6, 0.6);
        break;
    }
    // ---- everyone's day here: a home, a job, somewhere to work ----
    if (SITE_LIVED.has(s.kind) && P.folk.length) {
      const homeIdx = P.buildings
        .map((b, i) => i)
        .filter(
          (i) =>
            P.buildings[i].kind === "house" || P.buildings[i].kind === "inn",
        );
      const mid = P.props.find((p) => p.t === "firepit" || p.t === "well");
      P.square = mid
        ? {
            x: mid.x,
            z: mid.z,
            r: mid.t === "well" ? 1.15 : 0.7,
            fire: mid.t === "firepit",
          }
        : null;
      P.fields = P.props.filter((p) => p.t === "field");
      P.tents = P.props.filter((p) => p.t === "tent");
      const workProp = P.props.find(
        (p) => p.t === "kiln" || p.t === "rack" || p.t === "woodpile",
      );
      const inn = P.buildings.findIndex((b) => b.kind === "inn");
      const benches = new Map();
      P.folk.forEach((f, i) => {
        // (a guard on watch keeps no hours: always at their post)
        if (f.fixed) return;
        let job = jobOf(f.role);
        if (s.kind === "hut" || s.kind === "tents")
          job = workProp && i === 0 ? "craft" : "idle";
        else if (job === "out" && P.fields.length) job = "field";
        if (job === "field" && !P.fields.length) job = "idle";
        if (job === "tavern" && inn < 0) job = "idle";
        if (
          job === "market" ||
          job === "hall" ||
          job === "well" ||
          job === "watch"
        )
          job = "craft";
        f.job = job;
        // an inn's people live at the inn; nomads in the tents; others in the nearest house
        if (inn >= 0) f.home = inn;
        else if (P.tents.length)
          f.home = P.buildings.length + (i % P.tents.length);
        else
          f.home = homeIdx.length
            ? homeIdx
                .slice()
                .sort(
                  (p, q) =>
                    Math.hypot(P.buildings[p].x - f.x, P.buildings[p].z - f.z) -
                    Math.hypot(P.buildings[q].x - f.x, P.buildings[q].z - f.z),
                )[0]
            : -1;
        // where they work by day: their own post
        if (f.post) {
          f.job = "craft";
          f.work = f.post;
          return;
        }
        if (job === "craft") {
          if (workProp) {
            // beside the kiln, the rack or the woodpile, facing it
            const a = Math.atan2(workProp.z, workProp.x) + 0.9,
              wx = workProp.x + Math.cos(a) * 1.5,
              wz = workProp.z + Math.sin(a) * 1.5;
            f.work = {
              kind: "bench",
              x: wx,
              z: wz,
              face: Math.atan2(workProp.x - wx, -(workProp.z - wz)),
            };
          } else if (f.home >= 0 && f.home < P.buildings.length) {
            // a bench against the front of the house, beside the door
            const b = P.buildings[f.home];
            if (!benches.has(f.home)) {
              const cs = Math.cos(b.rot),
                sn = Math.sin(b.rot),
                fzz = b.round ? b.w / 2 : b.d / 2;
              let dx = 0;
              if (!b.round) {
                const nwF = Math.max(1, Math.floor(b.w / 2.4));
                dx = -b.w / 2 + ((Math.floor(nwF / 2) + 0.5) * b.w) / nwF;
              }
              const lx =
                dx + (hash01(s.seed % 100003, f.home, 41) < 0.5 ? -1.75 : 1.75);
              const bx = b.x + lx * cs - (fzz + 0.5) * sn,
                bz = b.z + lx * sn + (fzz + 0.5) * cs,
                wx = b.x + lx * cs - (fzz + 1.3) * sn,
                wz = b.z + lx * sn + (fzz + 1.3) * cs;
              P.props.push({
                t: "workbench",
                x: bx,
                z: bz,
                rot: b.rot,
                seed: hashInt(s.seed % 100003, f.home, 17),
              });
              benches.set(f.home, {
                kind: "bench",
                x: wx,
                z: wz,
                face: Math.atan2(sn, cs),
              });
            }
            f.work = benches.get(f.home);
          } else f.job = "idle";
        }
      });
    }
    // which doors open: an inn's and a hut's always, most farmhouses and barns, some houses
    P.buildings.forEach((b, i) => {
      // (a hermit's windows burn all night: they keep odd hours)
      if (s.kind === "hermit") {
        b.open = false;
        b.light = "lit";
        return;
      }
      const pOpen =
        b.kind === "inn" || b.kind === "home" || s.kind === "hut"
          ? 1
          : b.kind === "barn"
            ? 0.85
            : b.kind === "shed"
              ? 0.5
              : s.kind === "farm"
                ? 0.7
                : [
                      "fishhut",
                      "ferry",
                      "watch",
                      "lighthouse",
                      "mine",
                      "temple",
                      "mill",
                    ].includes(s.kind)
                  ? 0.8
                  : 0.5;
      b.open = hash01(s.seed % 100003, i, 77) < pOpen;
      // your own house: nobody lights its windows while you are out, but a lantern hangs by the door
      if (b.kind === "home") {
        b.light = "none";
        if (b.size !== "hut" && !b.round) b.doorLight = "lantern";
        return;
      }
      // lights at night: an inn keeps its windows lit and torches at its door; a household's
      // windows go dark as it goes to bed, and some farmhouses hang a lantern by the door
      b.light =
        b.kind === "inn"
          ? "lit"
          : b.kind === "barn" || b.kind === "shed"
            ? "none"
            : "home";
      if (b.kind === "inn") b.doorLight = "torches";
      else if (
        b.kind === "house" &&
        (s.kind === "farm" || s.kind === "hamlet") &&
        hash01(s.seed % 100003, i, 91) < 0.35
      )
        b.doorLight = "lantern";
    });
    // the inn is lit all night, so its lights stay on far off too
    if (s.kind === "inn")
      for (const bc of P.beacons) if (bc.kind === "light") bc.keep = true;
    s._plan = P;
    return P;
  }
