// index-inline-2 25 — arc
// Lines 8223-8636 of readable/index-inline-2.pretty.js (statement-aligned).
  function buildArc(
    rng,
    F,
    peoples,
    settlements,
    places,
    capitalOf,
    settleOf,
    pick,
    planet,
    old,
    ownerOf,
  ) {
    const stub = {
      id: 0,
      name: "the last survivors",
      plural: "survivors",
      faith: "the old gods",
      lang: null,
      rival: -1,
      arch: "isle",
      roles: ["wanderer"],
      mood: "welcoming",
    };
    const P = (i) => peoples[i % Math.max(1, peoples.length)] || stub;
    const options = [];
    const W = (key, w) => {
      if (w > 0) options.push({ key, w });
    };
    W("dragon", F.activeVolcanoes.length ? 3 : F.ranges.length ? 1.2 : 0);
    W("blight", F.jungle || F.forest ? 2 : 0);
    W("siege", peoples.length >= 2 && settlements.length >= 3 ? 1.8 : 0);
    W(
      "sleeper",
      F.trenches.length && F.trenches[0].depth > 7800 ? 2.2 : F.ice ? 0.8 : 0,
    );
    W("dawn", F.field === "Strong" ? 2 : 0.9);
    W("sundered", peoples.length >= 2 ? 1.4 : 0);
    W("fading", F.field === "Weak" ? 2.4 : F.heat < 0.25 ? 1.5 : 0.3);
    W("haunted", F.ice || F.desert ? 1.1 : 0.4);
    let tot = options.reduce((s, o) => s + o.w, 0),
      x = rng.float() * tot,
      kind = options[0].key;
    for (const o of options) {
      x -= o.w;
      if (x <= 0) {
        kind = o.key;
        break;
      }
    }
    // the people at the centre of the story live nearest to where it happens
    const focus = {
      dragon: F.activeVolcanoes[0] || F.volcanoes[0] || F.ranges[0],
      blight: F.jungle || F.forest,
      sleeper: F.trenches[0] || F.ice,
      sundered: F.ranges[0] || F.desert || F.forest,
      fading: F.activeVolcanoes[0] || F.volcanoes[0] || F.ranges[0],
      haunted: F.ice || F.desert || F.ranges[0],
    }[kind];
    const withCapital = peoples.filter((p) => p.capital !== undefined);
    let people0 =
      (focus && ownerOf(focus.dir)) ||
      (kind === "siege" && withCapital.length
        ? withCapital[rng.int(0, withCapital.length - 1)]
        : null) ||
      P(rng.int(0, Math.max(0, peoples.length - 1)));
    const rival = peoples[people0.rival] || P(people0.id + 1);
    const other = peoples.find((p) => p !== people0 && p !== rival) || rival;
    const cap0 = capitalOf(people0) ||
      settlements[0] || { name: "the old city" };
    const elderName = people0.lang ? people0.lang.person(rng) : "Old Aru";

    const years = (a, b) => nfs(rng.int(a, b));
    const when = pick(rng, RITE_WHEN);
    const highPlace = F.ranges[0] || F.activeVolcanoes[0] || null;
    const peakName = highPlace
      ? highPlace.peakName || highPlace.name
      : "the highest peak";
    const arc = { kind, needs: [] };
    const needWeapon = (where, keeper) => ({
      title: pick(rng, RELICS.weapon),
      text: `hidden in ${where.name}. ${cap(keeper.name)} know the way.`,
      at: where,
      qk: "relic",
      role: "old soldier",
    });
    const capOf = (p) => (p && capitalOf(p)) || cap0;

    if (kind === "dragon") {
      const lair = F.activeVolcanoes[0] || F.volcanoes[0] || F.ranges[0];
      const dname =
        (people0.lang ? people0.lang.word(rng, 2, 2) : "Vharakh") +
        " " +
        pick(rng, DRAGON_EPITHETS);
      const period = rng.int(6, 18);
      arc.title = `${F.world} lives under a dragon`;
      arc.antagonist = dname;
      arc.lair = lair;
      arc.summary = `${dname} woke inside ${lair.name} ${years(40, 300)} years ago. Every ${period} days it comes down from the mountain to take its tithe from ${people0.name}: grain, iron, and one person chosen by lot. They pay, and hate themselves for paying.`;
      const relicPlace = F.ice ||
        F.desert ||
        F.forest || { name: "the far north" };
      arc.needs = [
        needWeapon(relicPlace, other),
        {
          title: `The dragon’s true name`,
          text: `${elderName} ${pick(rng, ELDER_TITLES)} of ${cap0.name} remembers it, but has sworn never to say it aloud.`,
          at: cap0,
          qk: "price",
          role: "elder",
          giver: elderName,
        },
        {
          title: `A way into ${lair.name}`,
          text: `the old lava roads run under the mountain. ${cap(rival.name)} mapped them once, and sold the map.`,
          at: capOf(rival),
          qk: "price",
          role: "map-seller",
        },
      ];
      arc.clock = {
        period,
        label: "The dragon comes down again",
        phase: rng.float(),
      };
      arc.rumor = `a dragon sleeps in ${lair.name}, and it is nearly tithe day`;
      arc.past = `${dname} woke inside ${lair.name} and burned the old capital, ${old.nameFor(planet.seedKey + "/oldcity", 2, 2)}, to glass.`;
    } else if (kind === "blight") {
      const src = F.jungle || F.forest;
      const name = pick(rng, BLIGHTS);
      const rate = rng.int(2, 9);
      arc.title = `${F.world} is going grey`;
      arc.antagonist = name;
      arc.lair = src;
      arc.summary = `Something is wrong in ${src.name}. The trees turn grey and soft as bread, and ${people0.name} who breathe the spores forget their own names. ${cap(name)} spreads about ${rate} km a day.`;
      const clean = F.isles[0] ||
        places.find((p) => p.kind === "island") ||
        F.ice || { name: "a far island" };
      const fire = F.activeVolcanoes[0] ||
        F.volcanoes[0] ||
        F.desert || { name: "the burning south" };
      arc.needs = [
        {
          title: pick(rng, RELICS.seed),
          text: `from a tree that still grows on ${clean.name}, where the spores have never reached.`,
          at: clean,
          qk: "relic",
          role: "gardener",
        },
        {
          title: "Clean fire",
          text: `carried from ${fire.name} in a clay lamp that must never go out on the way.`,
          at: fire,
          qk: "vigil",
          role: "fire-keeper",
        },
        {
          title: `The rain-song of ${rival.name}`,
          text: `${rival.name} lost it when their last singer died. Parts of it are carved in ${cap0.name}.`,
          at: cap0,
          qk: "price",
          role: "singer",
        },
      ];
      arc.clock = {
        period: rng.int(3, 8),
        label: "The grey takes another valley",
        phase: rng.float(),
      };
      arc.rumor = `the forests are going grey in ${src.name}, and no one who goes in comes back themselves`;
      arc.past = `${years(3, 40)} years ago a single tree turned grey at the heart of ${src.name}. Nobody cut it down in time.`;
    } else if (kind === "siege") {
      const horde = pick(
        rng,
        HORDES.filter((h) => h.from !== "desert" || F.desert)
          .filter((h) => h.from !== "ice" || F.ice)
          .filter((h) => h.from !== "rift" || F.rifts.length),
      );
      const target = capitalOf(people0) || settlements[0];
      const hold = rng.int(20, 80);
      arc.title = `${target.name} is under siege`;
      arc.antagonist = horde.name;
      arc.lair = null;
      arc.where = target;
      arc.summary = `${target.name}, greatest city of ${people0.name}, is surrounded by ${horde.name}: ${horde.how}. The walls will hold for another ${hold} days, if the wells do.`;
      const rivalTown = settleOf(rival.id)[0] || cap0;
      arc.needs = [
        {
          title: pick(rng, RELICS.map),
          text: `shows the old tunnels under ${target.name}. The last copy is in ${rivalTown.name}.`,
          at: rivalTown,
          qk: "price",
          role: "archivist",
        },
        {
          title: `The help of ${other.name}`,
          text: `they will march only if someone brings back the ${pick(rng, ["banner", "drum", "prince", "bones"])} they lost to ${rival.name}.`,
          at: rivalTown,
          qk: "relic",
          role: "old soldier",
        },
        {
          title: `What ${horde.name} fear`,
          text: `a prisoner in ${target.name} knows, and will trade the secret for freedom.`,
          at: target,
          qk: "price",
          role: "jailer",
        },
      ];
      arc.clock = {
        period: rng.int(4, 10),
        label: "The next assault on the walls",
        phase: rng.float(),
      };
      arc.rumor = `${target.name} is under siege by ${horde.name}`;
      arc.past = `${cap(horde.name)} came without warning: ${horde.how}.`;
    } else if (kind === "sleeper") {
      const deep = F.trenches[0] || F.ice;
      const name = pick(rng, SLEEPERS);
      const period = rng.int(5, 15);
      arc.title = `Something is waking under ${F.world}`;
      arc.antagonist = name;
      arc.lair = deep;
      const depthTxt = deep.depth ? `, ${nfs(deep.depth)} m down,` : "";
      arc.summary = `${name} sleeps in ${deep.name}${depthTxt} and it is turning over in its sleep. Every ${period} days the sea above it boils, and everyone who lives near the water dreams the same dream.`;
      const isle =
          F.isles[0] || places.find((p) => p.kind === "island") || cap0,
        stoneP = peoples.find((p) => p.arch === "stone") || rival;
      arc.needs = [
        {
          title: pick(rng, RELICS.bell),
          text: `sunk off ${isle.name}; divers of ${people0.name} know where.`,
          at: isle,
          qk: "price",
          role: "diver",
        },
        {
          title: "The words of binding",
          text: `carved in the halls of ${stoneP.name}, in a language nobody speaks any more.`,
          at: capOf(stoneP),
          qk: "price",
          role: "keeper of the halls",
        },
        {
          title: `A silent night on ${peakName}`,
          text: `someone must stand on the summit ${when.text} and listen until the sea goes quiet.`,
          at: highPlace || cap0,
          qk: "vigil",
          role: "watcher",
        },
      ];
      arc.clock = { period, label: "The sea boils again", phase: rng.float() };
      arc.rumor = `something under the sea is waking, and the fish have all swum away`;
      arc.past = `The first ${people0.plural} put ${name} to sleep and sank three bells to keep it there. One of the bells has cracked.`;
    } else if (kind === "dawn") {
      const three = [
        F.ranges[0],
        F.activeVolcanoes[0] || F.volcanoes[0],
        F.isles[0] || F.desert || F.ice,
        F.forest,
        F.jungle,
      ]
        .filter(Boolean)
        .slice(0, 3);
      while (three.length < 3)
        three.push({ name: pick(rng, settlements).name });
      const period = rng.int(9, 30);
      arc.title = `${F.world} is waiting for its Dawn`;
      arc.antagonist = null;
      arc.lair = three[0];
      arc.summary = `${cap(people0.faith)} promised that ${F.world} would wake when three fires burn at once, and someone who fell from the sky stands on ${peakName} to see them. ${cap(people0.name)} have waited ${years(300, 3000)} years. Many have stopped believing.`;
      arc.needs = three.map((pl, k) => {
        const pk = peoples[k % Math.max(1, peoples.length)] || people0;
        return {
          title: `The fire at ${pl.name}`,
          text: `${cap(pk.name)} must agree to light it, and they have their own price.`,
          at: pl.dir ? pl : capOf(pk),
          qk: "price",
          role: "fire-keeper",
          people: pk.id,
        };
      });
      arc.clock = {
        period,
        label: "The next night the three fires could be seen together",
        phase: rng.float(),
      };
      arc.rumor = `the prophecy says someone will fall from the sky before the Dawn. People will look at you strangely`;
      arc.past = `A child of ${people0.name} spoke the prophecy of the Dawn, then never spoke again.`;
    } else if (kind === "sundered") {
      const prize = F.ranges[0] || F.desert || F.forest || places[0];
      const yrs = rng.int(12, 140);
      arc.title = `${F.world} is at war with itself`;
      arc.antagonist = `${rival.name} and ${people0.name}`;
      arc.lair = prize;
      arc.summary = `${cap(people0.name)} and ${rival.name} have fought over ${prize.name} for ${yrs} years. Nobody remembers who struck first; everybody remembers who died.`;
      arc.needs = [
        {
          title: pick(rng, RELICS.stone),
          text: `proves an old peace. It was last seen in the ruins near ${prize.name}.`,
          at: prize,
          qk: "relic",
          role: "old soldier",
        },
        {
          title: `A neutral voice`,
          text: `${cap(other.name)} could host the talks, but only if someone earns their trust.`,
          at: capOf(other),
          qk: "price",
          role: "elder",
        },
        {
          title: "The lost heir",
          text: `taken from ${cap0.name} as a child and raised by the enemy, without knowing it.`,
          at: capOf(rival),
          qk: "price",
          role: "heir",
        },
      ];
      arc.clock = {
        period: rng.int(5, 12),
        label: "The next battle season",
        phase: rng.float(),
      };
      arc.rumor = `the war over ${prize.name} is going badly for everyone`;
      arc.past = `The war over ${prize.name} started ${yrs} years ago, at a wedding.`;
    } else if (kind === "fading") {
      const why =
        F.field === "Weak"
          ? "the sky-shield is failing: the lights in the sky come further south each year, and crops die where they dance"
          : "the heart of the world is cooling: the hot springs are dying, and the winters get longer";
      const ember =
        F.activeVolcanoes[0] || F.volcanoes[0] || F.ranges[0] || places[0];
      arc.title = `${F.world} is going cold`;
      arc.antagonist = null;
      arc.lair = ember;
      arc.summary = `${cap(people0.name)} say ${why}. The old songs claim it happened once before, and that someone rekindled the world.`;
      const forgeP =
          peoples.find((p) => p.arch === "stone" || p.arch === "ash") || rival,
        stair = F.rifts[0] || F.ranges[0] || ember;
      arc.needs = [
        {
          title: pick(rng, RELICS.ember),
          text: `still glows in the deepest vent of ${ember.name}.`,
          at: ember,
          qk: "relic",
          role: "fire-keeper",
        },
        {
          title: "The Deep Stair",
          text: `a way down towards the core, somewhere in ${stair.name}.`,
          at: stair,
          qk: "relic",
          role: "miner",
        },
        {
          title: `The great forge of ${forgeP.name}`,
          text: "cold for a hundred years. Its smiths want payment in stories, not coin.",
          at: capOf(forgeP),
          qk: "price",
          role: "forge-master",
        },
      ];
      arc.clock = {
        period: rng.int(20, 60),
        label: "The next killing frost",
        phase: rng.float(),
      };
      arc.rumor = `the world is going cold, and some are already leaving`;
      arc.past = `The first killing frost came ${years(20, 200)} years ago. Every winter since has been longer.`;
    } else {
      const where = F.ice || F.desert || F.ranges[0] || places[0];
      const name = pick(rng, GHOSTS);
      arc.title = `The dead walk on ${F.world}`;
      arc.antagonist = name;
      arc.lair = where;
      arc.summary = `Since the battle at ${where.name} ${years(80, 900)} years ago, ${name} and the dead who followed come out whenever the nights are long. ${cap(people0.name)} burn lamps until dawn.`;
      arc.needs = [
        {
          title: pick(rng, RELICS.bones),
          text: `must be buried in ${cap0.name}, where they were stolen from.`,
          at: where,
          qk: "relic",
          role: "gravedigger",
        },
        {
          title: "The dirge",
          text: `sung only by ${rival.name}, who will not sing it for their enemies.`,
          at: capOf(rival),
          qk: "price",
          role: "singer",
        },
        {
          title: `A night vigil at ${where.name}`,
          text: `someone must keep watch ${when.text}, without running.`,
          at: where,
          qk: "vigil",
          role: "watcher",
        },
      ];
      arc.clock = {
        period: rng.int(6, 14),
        label: "The dead walk again",
        phase: rng.float(),
      };
      arc.rumor = `the dead are walking out of ${where.name} again`;
      arc.past = `${name} fell in battle at ${where.name} and was never buried.`;
    }
    arc.people = people0.id;
    arc.rival = rival.id;
    arc.where = arc.where || arc.lair;
    return arc;
  }

