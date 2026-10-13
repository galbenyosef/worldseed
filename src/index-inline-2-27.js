// index-inline-2 27 — owner
// Lines 8972-9189 of readable/index-inline-2.pretty.js (statement-aligned).
  function buildOpening(planet, story, dir, tDays, difficulty = "normal") {
    const L = Math.hypot(dir[0], dir[1], dir[2]);
    const d = [dir[0] / L, dir[1] / L, dir[2] / L];
    const q = planet.query(d[0], d[1], d[2], tDays);
    const rng = new Rng(
      hashInt(
        Math.round(d[0] * 1e5),
        Math.round(d[1] * 1e5),
        Math.round(d[2] * 1e5),
      ) ^ 0x51ab,
    );
    const R = planet.body.radiusKm;
    const around = describeAround(planet, story, d);
    const town = around.town;
    const where =
      around.within.find((p) => p.kind !== "ocean" && p.kind !== "sea") ||
      around.within[0] ||
      null;
    const group = !q.land
      ? "water"
      : q.coastKm < 25
        ? "coast"
        : q.landform === "Mountains" || q.landform === "High peaks"
          ? "mountain"
          : biomeGroup(q.biome);
    let owner =
      town && town.owner >= 0 ? story.peoples[town.owner] : story.peoples[0];
    let nearHome = null,
      nh = 9;
    for (const p of story.peoples) {
      const a = angleBetween(p.home, d);
      if (a < nh) {
        nh = a;
        nearHome = p;
      }
    }
    if (nearHome && nh * R < 1500) owner = nearHome;
    const pronoun = rng.pick([
      ["she", "her", "She"],
      ["he", "him", "He"],
      ["they", "them", "They"],
    ]);
    const traveller = {
      name: owner ? owner.lang.person(rng) : "Aru",
      role: owner ? rng.pick(owner.roles) : "wanderer",
      people: owner ? owner.name : "no people you know",
      owner: owner && owner.id != null ? owner.id : -1,
      pronoun,
    };
    const sky = q.localTime.daylight
      ? q.cloud > 0.5
        ? "a grey, heavy sky"
        : q.localTime.sunAltDeg > 50
          ? "the noon glare"
          : "a pale afternoon sky"
      : q.cloud > 0.5
        ? "a starless, cloudy night"
        : "a clear night full of stars";
    const whereText = where ? where.name : q.biomeName.toLowerCase();
    const pages = [];
    let travel = null;
    pages.push({
      who: null,
      text: `You fall out of ${sky}, burning like a star, and hit ${q.land ? `the ground of ${whereText}` : `the water of ${whereText}`} hard enough to wake everything for a mile.`,
    });
    const sense = rng.pick(WAKE_SENSES[group] || WAKE_SENSES.any);
    pages.push({
      who: null,
      text: `You wake ${q.land ? "naked" : "naked and freezing"}, with no name you can remember. ${sense}`,
    });
    pages.push({
      who: null,
      text: fill(rng.pick(FIND_LINES), {
        name: traveller.name,
        a: an(traveller.role),
        role: traveller.role,
        people: traveller.people,
        They: pronoun[2],
      }),
    });
    pages.push({
      who: traveller.name,
      text: rng.pick(
        GREETINGS[owner ? owner.mood : "welcoming"] || GREETINGS.welcoming,
      ),
    });
    if (town) {
      // look along the way for water, mountains, deserts
      let water = 0,
        maxH = -1e9,
        crossRegion = null;
      const g1 = story.gaz.grid,
        L1 = planet.levels[1];
      for (let k = 1; k < 24; k++) {
        const p = slerp(d, town.dir, k / 24);
        const i = g1.locate(p[0], p[1], p[2]);
        if (!L1.land[i]) water++;
        maxH = Math.max(maxH, L1.elev[i] - planet.dials.seaLevel);
        const reg = story.gaz.regionAt[i];
        if (reg >= 0 && !crossRegion) crossRegion = story.places[reg];
      }
      const mode = water > 3 ? "sea" : "land";
      const km = around.townKm;
      travel = { mode, days: mode === "sea" ? Math.max(1, km / 120) : km / 28 };
      const dist = kmPhrase(km, mode);
      pages.push({
        who: traveller.name,
        text: `"The nearest safe place is ${town.name}. ${cap(dist)}, to the ${around.townBearing}."`,
      });
      // (and in case you have forgotten which way that is: the quarters are written on the sky, if you look up)
      pages.push({
        who: traveller.name,
        text: rng.pick(LOOK_UP)(around.townBearing),
        look: "up",
      });
      let hintKey = "easy";
      if (mode === "sea") hintKey = "sea";
      else if (maxH > 2600) hintKey = "mountains";
      else if (crossRegion && crossRegion.kind === "desert") hintKey = "desert";
      else if (
        crossRegion &&
        ["forest", "jungle", "taiga"].includes(crossRegion.kind)
      )
        hintKey = "forest";
      const range = story.places.find(
        (p) =>
          p.kind === "range" &&
          angleBetween(p.dir, slerp(d, town.dir, 0.5)) * R < 900,
      );
      const hint = fill(rng.pick(ROUTE_HINTS[hintKey]), {
        range: range ? range.name : "the mountains",
        region: crossRegion ? crossRegion.name : "the wilds",
      });
      pages.push({
        who: traveller.name,
        text: hint.replace(/^"(\w)/, (m, c) => '"' + c.toUpperCase()),
      });
      pages.push({
        who: traveller.name,
        text: `"In ${town.name} they talk of nothing else: ${story.arc.rumor}. Not your problem. Yet."`,
      });
      if (difficulty === "hard") {
        pages.push({
          who: null,
          text: `${traveller.name} gives you a waterskin and a knife, and points ${around.townBearing}. ${pronoun[2]} will not come with you. Your story on ${planet.seedText} starts here, alone.`,
        });
      } else {
        pages.push({
          who: null,
          text: `You follow ${traveller.name} towards ${town.name}. Your story on ${planet.seedText} starts here.`,
        });
      }
    } else {
      pages.push({
        who: traveller.name,
        text: '"There is nowhere safe near here. Nobody lives on this world but me, and I am not sure about me."',
      });
    }
    return {
      pages,
      traveller,
      town,
      townKm: around.townKm,
      bearing: around.townBearing,
      landing: d,
      q,
      travel,
    };
  }

  // ---------- the other beginnings ----------
  // Not every fall ends in the open with a stranger standing over you. Fishers pull you out of the
  // sea in their net and you wake by their fire on the beach; you come down through a farmhouse roof
  // and owe the family a roof; a herd scatters from you, and the herders take you in at their camp
  // and walk you to town with the beasts. info: { site, name (of the place), folk: [{ name, role }],
  // landing (where you wake) }. Returns an opening like buildOpening's, and begin: { kind, site }.
  const BEGIN_LINES = {
    sea: {
      hit: (sky, where) =>
        `You fall out of ${sky}, burning like a star, and hit the sea off ${where} hard enough to wake every fish for a mile.`,
      wake: [
        "The water closes over you, black and cold. Then something closes round you: a net. You are hauled up over the side of a boat, coughing, and then there is nothing at all.",
      ],
      find: (n, a, role, people) =>
        `You wake on the beach by a fire, naked under a scratchy blanket, with no name you can remember and half the sea still in you. ${n}, ${a} ${role} of ${people}, is crouched beside you, looking at you the way you would look at a fish with legs.`,
      hello: [
        '"Biggest catch of my life, and the ugliest. You fell out of the sky. I saw you. Everybody saw you."',
        '"Don’t try to sit up yet. You came up in the net with the mackerel, and you were still steaming."',
        '"I have pulled all sorts out of that water. Never one that thanked me. Go on. Try."',
      ],
    },
    roof: {
      hit: (sky, where) =>
        `You fall out of ${sky}, burning like a star, straight through the roof of a farmhouse in ${where}. Roof, beams, a shelf of pots and you come down on the kitchen floor together.`,
      wake: [
        "You wake on a heap of straw in the yard, naked, with no name you can remember. A whole family is standing round you, and two children who think you are the best thing that has ever happened.",
      ],
      find: (n, a, role, people) =>
        `${n}, the ${role}, ${people === "no people you know" ? "whose house it was" : `one of ${people}, whose house it was`}, looks up at the hole in the roof, and back down at you.`,
      hello: [
        '"You came through my roof." A long breath. "Through. My. Roof."',
        '"Of all the roofs in the world." A long breath. "Mine."',
      ],
    },
    herders: {
      hit: (sky, where) =>
        `You fall out of ${sky}, burning like a star, and hit the ground of ${where} hard enough to scatter a herd for a mile.`,
      wake: [
        "You wake naked by a fire, under a hide that smells of goat, with no name you can remember. Tents round you, beasts beyond them, and weathered faces watching you over the flames.",
      ],
      find: (n, a, role, people) =>
        `${n}, ${a} ${role} of ${people}, squats down by you and pokes the fire.`,
      hello: [
        '"The herd ran from you for half a day. We followed the smoke back, and there you were, still smoking."',
        '"Lie still. The goats think you are a god, or a wolf. We have not decided either."',
      ],
    },
  };
