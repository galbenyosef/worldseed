// index-inline-2 28 — pages
// Lines 9190-9523 of readable/index-inline-2.pretty.js (statement-aligned).
  function buildBeginning(
    planet,
    story,
    kind,
    info,
    tDays,
    difficulty = "normal",
  ) {
    const L = BEGIN_LINES[kind];
    if (!L || !info || !info.landing)
      return buildOpening(
        planet,
        story,
        info ? info.landing : [0, 1, 0],
        tDays,
        difficulty,
      );
    const d = info.landing.slice(),
      q = planet.query(d[0], d[1], d[2], tDays);
    const rng = new Rng(
      hashInt(
        Math.round(d[0] * 1e5),
        Math.round(d[1] * 1e5),
        Math.round(d[2] * 1e5),
      ) ^ 0xbe61,
    );
    const around = describeAround(planet, story, d),
      town = around.town;
    const where =
      around.within.find((p) => p.kind !== "ocean" && p.kind !== "sea") ||
      around.within[0] ||
      null;
    const sea =
      around.within.find((p) => p.kind === "ocean" || p.kind === "sea") || null;
    const owner =
      info.site && info.site.owner >= 0
        ? story.peoples[info.site.owner]
        : town && town.owner >= 0
          ? story.peoples[town.owner]
          : null;
    const pronoun = rng.pick([
      ["she", "her", "She"],
      ["he", "him", "He"],
      ["they", "them", "They"],
    ]);
    const f0 = (info.folk && info.folk[0]) || null;
    const role =
      kind === "sea"
        ? "fisher"
        : kind === "roof"
          ? f0
            ? f0.role
            : "farmer"
          : owner && owner.roles && owner.roles.includes("herd-singer")
            ? "herd-singer"
            : "herder";
    const traveller = {
      // the one who found you: at the farm, the farmer whose roof it was; at sea and with the herders, one of their own
      name:
        kind === "roof" && f0
          ? f0.name
          : (owner ? owner.lang : story.old).person(rng),
      role,
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
    const whereText =
      kind === "sea"
        ? sea
          ? sea.name
          : where
            ? `the coast of ${where.name}`
            : "the coast"
        : where
          ? where.name
          : q.biomeName.toLowerCase();
    const pages = [];
    pages.push({ who: null, text: L.hit(sky, whereText) });
    pages.push({ who: null, text: rng.pick(L.wake) });
    pages.push({
      who: null,
      text: L.find(
        traveller.name,
        an(traveller.role),
        traveller.role,
        traveller.people,
      ),
    });
    pages.push({ who: traveller.name, text: rng.pick(L.hello) });
    let travel = null;
    if (town) {
      let water = 0;
      const g1 = story.gaz.grid,
        L1 = planet.levels[1];
      for (let k = 1; k < 24; k++) {
        const p = slerp(d, town.dir, k / 24);
        if (!L1.land[g1.locate(p[0], p[1], p[2])]) water++;
      }
      const mode = water > 3 ? "sea" : "land",
        km = around.townKm;
      travel = { mode, days: mode === "sea" ? Math.max(1, km / 120) : km / 28 };
      const dist = kmPhrase(km, mode);
      if (kind === "sea") {
        pages.push({
          who: traveller.name,
          text: `"There’s dry clothes in the hut that were my brother’s, and fish on the fire. The nearest town is ${town.name}, ${dist}, to the ${around.townBearing}."`,
        });
        pages.push({
          who: traveller.name,
          text: rng.pick(LOOK_UP)(around.townBearing),
          look: "up",
        });
      } else if (kind === "roof") {
        pages.push({
          who: traveller.name,
          text: '"Well. You owe us a roof. Bring me six good logs for new beams, and we will call it square. There is an axe by the woodpile. Bring that back too."',
        });
        pages.push({
          who: traveller.name,
          text: `"Do that, and there is supper, and you can sleep in the barn. ${town.name} is ${dist}, to the ${around.townBearing}, when you are done owing us."`,
        });
      } else {
        pages.push({
          who: traveller.name,
          text: `"We are taking the herd to ${town.name}, to sell what we can. ${cap(dist)}, to the ${around.townBearing}. You can walk with us, if you can keep up with goats."`,
        });
        pages.push({
          who: traveller.name,
          text: rng.pick(LOOK_UP)(around.townBearing),
          look: "up",
        });
      }
      pages.push({
        who: traveller.name,
        text: `"In ${town.name} they talk of nothing else: ${story.arc.rumor}. Not your problem. Yet."`,
      });
      if (difficulty === "hard")
        pages.push({
          who: null,
          text: `${traveller.name} gives you ${kind === "sea" ? "dry clothes, a smoked fish" : kind === "herders" ? "a felt cloak, a round of cheese" : "a crust"} and a knife, and points ${around.townBearing}. Your story on ${planet.seedText} starts here, alone.`,
        });
      else if (kind === "roof")
        pages.push({
          who: null,
          text: `Your story on ${planet.seedText} starts here, owing somebody a roof.`,
        });
      else
        pages.push({
          who: null,
          text: `You follow ${traveller.name} towards ${town.name}. Your story on ${planet.seedText} starts here.`,
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
      begin: { kind, site: info.site ? info.site.id : null },
    };
  }

  const TOWN_WORD = {
    capital: "city",
    town: "town",
    port: "harbour town",
    village: "village",
    monastery: "monastery",
    outpost: "outpost",
  };
  // reaching the town: a few lines, and a thread to pull if you want one
  function buildArrival(story, op, days, difficulty) {
    const town = op.town;
    if (!town) return [];
    const rng = new Rng(hashInt(town.id, 77, Math.round(days * 10)));
    const tv = op.traveller;
    const owner = town.owner >= 0 ? story.peoples[town.owner] : null;
    const pages = [];
    const later =
      days < 0.3
        ? ""
        : days < 1.5
          ? "A day later, "
          : `${Math.round(days)} days later, `;
    const what = TOWN_WORD[town.type] || "town";
    pages.push({
      who: null,
      text: `${later}${later ? "the" : "The"} roofs of ${town.name} rise ahead: a ${what} of ${owner ? owner.plural || owner.name : "strangers"}.`,
    });
    const alone = difficulty === "hard";
    const mood = owner ? owner.mood : "welcoming";
    if (!alone)
      pages.push({
        who: tv.name,
        text: rng
          .pick(ARRIVALS[mood] || ARRIVALS.welcoming)
          .replace("{town}", town.name),
      });
    const tale = story.tales.find((t) => t.town === town.id);
    if (tale) {
      const hook = `${tale.giver}, ${an(tale.role)} ${tale.role}, has a strange story to tell: ${tale.title.charAt(0).toLowerCase() + tale.title.slice(1)}.`;
      pages.push(
        alone
          ? { who: null, text: `People here are talking. ${hook}` }
          : {
              who: tv.name,
              text: `"${hook} Ask, if you like that sort of thing."`,
            },
      );
    }
    if (!alone) pages.push({ who: tv.name, text: rng.pick(PARTINGS) });
    return pages;
  }

  // ---------- the note in your fist: what this world needs, roughly where ----------
  const NOTE_NATURE = {
    dragon: "It will come to a fight. Or a bargain, if it can be talked to.",
    blight:
      "No sword will fix this. A cure, or clean fire, carried to the heart of it.",
    siege: "A city has to be saved before its wells run dry.",
    sleeper: "Something has to be kept asleep. Not killed. Kept asleep.",
    dawn: "Not a fight. Fires to light, and people to win over first.",
    sundered: "A war has to end. Nobody will thank you for trying.",
    fading: "Fire from the deep has to be carried back up, somehow.",
    haunted:
      "The dead need laying to rest. Bones, a song, a night without running.",
  };
  const farWord = (km, R) =>
    km < 40
      ? "Close. A day or two on foot."
      : km < 250
        ? "Days away."
        : km < 1500
          ? "Weeks away."
          : km < R * 2.2
            ? "Months away."
            : "The far side of the world.";
  const lcFirst = (t) => t.charAt(0).toLowerCase() + t.slice(1);
  function crossesSea(planet, story, a, b) {
    const g1 = story.gaz.grid,
      L1 = planet.levels[1];
    let water = 0;
    for (let k = 1; k < 16; k++) {
      const p = slerp(a, b, k / 16);
      if (!L1.land[g1.locate(p[0], p[1], p[2])]) water++;
    }
    return water >= 5;
  }
  function buildNote(planet, story, dir) {
    const arc = story.arc,
      where = arc.where;
    const lines = [
      `${arc.title}.`,
      NOTE_NATURE[arc.kind] || "Something here needs doing.",
    ];
    let loc = null;
    if (where && where.dir) {
      const km = angleBetween(dir, where.dir) * planet.body.radiusKm;
      const sea = km > 60 && crossesSea(planet, story, dir, where.dir);
      const way =
        km < 25
          ? "near here"
          : `${bearingWord(dir, where.dir)}${sea ? ", across the sea" : ""}`;
      lines.push(
        `${cap(where.name)}: ${way}. ${farWord(km, planet.body.radiusKm)}`,
      );
      loc = { name: where.name, km, sea };
    }
    const hints = arc.needs.slice(0, 2).map((n) => cap(lcFirst(n.title)) + "?");
    if (hints.length) lines.push(hints.join(" "));
    lines.push("Nobody will make you.");
    return { lines, loc };
  }

  // ---------- townsfolk: a greeting, then something worth knowing ----------
  const TOWN_GREETINGS = {
    welcoming: [
      '"Welcome, stranger. You look like you slept in a ditch."',
      '"A new face! Sit down, eat something."',
    ],
    "wary but honourable": [
      '"Guest-law protects you here. Don’t make me regret it."',
      '"State your business, traveller. Politely."',
    ],
    secretive: [
      '"We don’t get many strangers. We like it that way."',
      '"Keep your voice down. Walls have ears."',
    ],
    proud: [
      '"You stand in {town}. Mind your manners."',
      '"Strangers bow to the old stones here. Just so you know."',
    ],
    hospitable: [
      '"Come in out of the weather, whoever you are."',
      '"You’re shivering. There’s a fire by the well."',
    ],
    bold: [
      '"Ha! Another wanderer. Can you fight? Can you drink?"',
      '"You look lost. Good. Lost people have the best stories."',
    ],
    cautious: [
      '"Stay where I can see you. ...What do you want?"',
      '"You’re not from here. Nobody is from nowhere."',
    ],
    zealous: [
      '"Have you made your offering today, stranger?"',
      '"The faithful are welcome. Are you faithful?"',
    ],
    free: [
      '"No lords here. Say what you like."',
      '"Pull up a crate. Everyone’s equal on the dock."',
    ],
  };
  function distWords(km, sea) {
    if (km < 3) return "just over there";
    if (km < 14) return "a few hours’ walk";
    if (km < 28) return "less than a day’s walk";
    if (sea) return seaWords(km);
    return `${Math.round(km / 28)} days’ walk`;
  }
  // the great city, for the chronicle
