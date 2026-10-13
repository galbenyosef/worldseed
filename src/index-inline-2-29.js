// index-inline-2 29 — story
// Lines 9524-9845 of readable/index-inline-2.pretty.js (statement-aligned).
  function cityChronicle(story) {
    const C = story.city;
    if (!C) return null;
    const s =
        C.state !== "fallen"
          ? story.settlements.find((o) => o.id === C.town)
          : null,
      p = s && s.owner >= 0 ? story.peoples[s.owner] : null;
    const of = p ? `, the capital of ${p.name},` : "";
    switch (C.state) {
      case "thriving":
        return `${C.name}${of} is the greatest city in the world: a wall with a gatehouse at the end of each of its six avenues, a palace and a temple on its great square, six quarters and more people than anyone has counted. Its gates stand open, and it is thriving.`;
      case "halfempty":
        return `${C.name}${of} was the greatest city in the world, and it is still the largest. But half its houses stand empty now, and one whole quarter has been left to the weeds. The ones who stayed do not say why the others went.`;
      case "building":
        return `${C.name}${of} means to be the greatest city in the world, and is not finished yet. Two new quarters are going up inside a wall that is still being raised round them; the masons have been at it for years.`;
      case "fallen":
        return `${C.name} was the greatest city in the world, long ago. Its walls still stand, broken, with trees growing in its streets. Nobody lives there now. After dark, they say, something does.`;
    }
    return null;
  }
  // the great city, as people talk about it: from anywhere else, and inside it
  const CITY_TALK = {
    thriving: {
      far: [
        '"{City}? {Dist} to the {dir}. The greatest city in the world. Walls you could walk along all morning, and a gate at the end of every avenue."',
        '"Everyone goes to {City} once. Most come back. Some stay, and you never hear from them again: too busy."',
        '"In {City} there is a fountain in the middle of the square with the founder standing on top of it, and somebody is selling something on every corner. {Dist} to the {dir}."',
      ],
      in: [
        '"Welcome to {City}. Biggest place in the world, and it knows it."',
        '"I live in {quarter}. Born there. Never needed to go anywhere else."',
        '"Go up on the walls, if you have the legs. You can see half the world from up there. The stairs are by the gates."',
        '"Six gates, six avenues, two rings of streets. Get lost in {City} and you will find the square again sooner or later. Everybody does."',
      ],
    },
    halfempty: {
      far: [
        '"{City}? There is room there now, if you want it. Half the houses stand empty. {Dist} to the {dir}."',
        '"My cousin went to {City}. She says you can walk a whole street there and not see a soul. It was not like that when we were young."',
      ],
      in: [
        '"Don’t go down into {empty} after dark. Nobody lives there any more. Nobody we know."',
        '"It was full when I was small. Every house. Now look at it."',
        '"The ones who left say they will come back. They won’t."',
        '"I live in {quarter}. Half the street is boarded up. The other half talks about it."',
      ],
    },
    building: {
      far: [
        '"They are still building {City}, {dist} to the {dir}. Every year a new street, and the wall going round it. Work for anyone with two hands."',
        '"{City}! When it is finished it will be the greatest place in the world, they say. They have been saying it for a while."',
      ],
      in: [
        '"Mind the carts. Everything in {City} is either being built or being carried somewhere to be built."',
        '"They are raising the wall round {newq} now. When it is done, they say, nothing will get in."',
        '"Half my street is scaffolding. The other half is dust."',
        '"I live in {quarter}. Finished last year. Well. Mostly finished."',
      ],
    },
    fallen: {
      far: [
        '"{City}? Nobody goes there. It is {dist} to the {dir}, if you must. The walls are still standing, mostly. Nothing else is."',
        '"There was a great city once, {City}, {dist} to the {dir}. What lives there now comes out after dark."',
        '"My grandmother said the dead of {City} still walk its streets at night. She never went to see. Don’t you either."',
      ],
    },
  };
  // what the great city's own people say, by what they do there
  const CITY_ROLE_TALK = {
    "gate guard": {
      thriving: [
        '"Keep your blade in its sheath inside the walls, and we will get along."',
        '"The gates stand open from first light to last. We stand here the rest of the time too."',
        '"Through you go. Mind the carts."',
      ],
      halfempty: [
        '"Not many come in by this gate now. More go out."',
        '"We keep the gate. Somebody should. Even if there is less behind it every year."',
      ],
      building: [
        '"Through you go. Mind the stone carts, they do not stop for anyone."',
        '"When the new wall is done we will have twice the gates and half the sleep."',
      ],
    },
    holdout: [
      '"Everyone else left {empty}. I didn’t. Somebody has to stay, or it is not a quarter, just a lot of houses."',
      '"They boarded up my neighbours’ doors. I talk to them anyway. The doors, I mean."',
    ],
    "last weaver of the quarter": [
      '"Forty looms in this street once. Now there is mine. You can hear it all the way to the wall, at night."',
    ],
    "old lamplighter": [
      '"I still light the lamps in {empty}. Every one that is left. Nobody walks under them. I light them anyway."',
    ],
    mason: [
      '"Every stone in that wall somebody carried. Most of them, me."',
      '"Lay it true and it stands a thousand years. Lay it wrong and it stands until I am out of sight."',
    ],
    carpenter: [
      '"Frame goes up first. Then the walls. Then the roof. Then the arguing."',
      '"Oak for the posts, ash for the pegs, and patience for everything else."',
    ],
    labourer: [
      '"Stone. Carry. Stone. Carry. Ask me anything else and I will have forgotten it before you finish."',
    ],
    steward: [
      '"The city keeps its own counsel, and I keep the city’s. Mostly I keep its accounts."',
      '"Six quarters, and each one thinks it is the city. They are all wrong. The city is the square."',
    ],
    priest: [
      '"The temple door is never shut. Come in out of the noise, if you need to."',
      '"So many people, so close together. You would think they would pray more. They pray louder."',
    ],
  };
  function buildTalk(planet, story, s, folk, dir) {
    const rng = new Rng(hashInt(s.id, folk.seed || 1, 991));
    const owner = s.owner >= 0 ? story.peoples[s.owner] : null;
    const mood = owner ? owner.mood : "welcoming";
    const who = folk.name || "Stranger";
    const pages = [
      {
        who,
        text: rng
          .pick(TOWN_GREETINGS[mood] || TOWN_GREETINGS.welcoming)
          .replace("{town}", s.name),
      },
    ];
    const R = planet.body.radiusKm;
    const others = story.settlements
      .filter((o) => o !== s)
      .map((o) => ({ o, km: angleBetween(s.dir, o.dir) * R }))
      .sort((a, b) => a.km - b.km);
    const tale = story.tales.find((t) => t.town === s.id && t.giver !== who);
    const topics = ["rumor", "directions"];
    if (tale) topics.push("tale", "tale");
    if (story.arc.where && story.arc.where.dir) topics.push("where");
    // the great city: in it, what its people say; anywhere else, now and then, word of it
    const C = story.city,
      inCity = !!s.great && C;
    if (C && !inCity) topics.push("city");
    const cityWords = (t) => {
      const R2 = planet.body.radiusKm,
        there =
          C.state === "fallen"
            ? C.dir
            : (story.settlements.find((o) => o.id === C.town) || {}).dir;
      const km = there ? angleBetween(s.dir, there) * R2 : 0,
        sea = there && km > 60 && crossesSea(planet, story, s.dir, there);
      const dist = there ? distWords(km, sea) : "a long way",
        w = folk.cityWords || {};
      return t
        .replace(/\{City\}/g, C.name)
        .replace("{Dist}", cap(dist))
        .replace("{dist}", dist)
        .replace("{dir}", there ? bearingWord(s.dir, there) : "somewhere")
        .replace("{quarter}", w.quarter || "the old quarter")
        .replace(/\{empty\}/g, w.empty || "the empty quarter")
        .replace("{newq}", w.newq || "the new quarter");
    };
    if (inCity) {
      const RT = CITY_ROLE_TALK[folk.role],
        lines = RT ? (Array.isArray(RT) ? RT : RT[C.state] || null) : null;
      if (lines && rng.chance(0.85)) {
        pages.push({ who, text: cityWords(rng.pick(lines)) });
        return pages;
      }
      const T = CITY_TALK[C.state];
      if (T && T.in && rng.chance(0.5)) {
        pages.push({ who, text: cityWords(rng.pick(T.in)) });
        return pages;
      }
    }
    const topic = rng.pick(topics);
    if (topic === "city")
      pages.push({ who, text: cityWords(rng.pick(CITY_TALK[C.state].far)) });
    else if (topic === "tale")
      pages.push({
        who,
        text: `"${tale.giver}, ${an(tale.role)} ${tale.role}, has a strange story: ${lcFirst(tale.title)}. Ask them about it."`,
      });
    else if (topic === "directions" && others.length) {
      const { o, km } = others[Math.min(others.length - 1, rng.int(0, 1))];
      const sea = km > 60 && crossesSea(planet, story, s.dir, o.dir);
      const road =
        story.roads &&
        story.roads.roads.some(
          (r) =>
            (r.a === s.id && r.b === o.id) || (r.a === o.id && r.b === s.id),
        );
      pages.push({
        who,
        text: `"${o.name}? ${cap(distWords(km, sea))}, to the ${bearingWord(s.dir, o.dir)}.${road ? " The road goes all the way." : sea ? "" : " There\u2019s no road. Mind yourself."}"`,
      });
    } else if (topic === "where") {
      const w = story.arc.where,
        km = angleBetween(s.dir, w.dir) * R;
      pages.push({
        who,
        text: `"${cap(w.name)}? That’s ${km < 30 ? "close. Too close" : `${bearingWord(s.dir, w.dir)} of here, ${distWords(km, crossesSea(planet, story, s.dir, w.dir))}`}. Why would you want to go there?"`,
      });
    } else
      pages.push({
        who,
        text: `"${/^the prophecy/.test(story.arc.rumor) ? cap(story.arc.rumor) : "They say " + story.arc.rumor}."`,
      });
    return pages;
  }

  // ---- story/routine.js ----
  // ============================================================
  // ROUTINE — how folk spend their days. Everyone has a home and a job,
  // and the hour decides what they are doing: asleep, at home in the
  // morning, at work (at a stall, a bench by the door, the hall, the well,
  // out in the fields or beyond the town), a break at midday, and in the
  // evening the tavern, the square or home again. Times are fractions of
  // the day (0 = midnight), so they hold on planets with any length of day.
  // Each person keeps their own hours, a little early or late, and decides
  // day by day where to spend the evening. Pure data: the view walks them there.
  // ============================================================

  // what kind of work a role is, from its words (order matters: the first match wins)
  const JOBS = [
    [/watch/, "watch"],
    [/innkeeper|tavern|barkeep|brewer/, "tavern"],
    [/well/, "well"],
    [
      /woodcutter|herd|burner|gatherer|scout|runner|warden|hunter|trapper|outrider|diver|seeker|fisher|navigator/,
      "out",
    ],
    [/farmer|farmhand/, "field"],
    [/trader|merchant|seller|pedlar/, "market"],
    [
      /smith|carver|cutter|knapper|maker|mender|weaver|potter|herbalist|doctor|tanner|cooper|knitter/,
      "craft",
    ],
    [/priest|reader|keeper|singer|song|elder|sage|oath|teller/, "hall"],
  ];
  function jobOf(role) {
    const r = String(role || "").toLowerCase();
    for (const [re, job] of JOBS) if (re.test(r)) return job;
    return "idle";
  }

  // a person's own hours, from their seed
  function routineOf(seed, job) {
    const r = mulberry32((seed ^ 0x5eed1) >>> 0);
    const j = (a) => (r() - 0.5) * a;
    return {
      job,
      wake: 0.255 + j(0.04), // about six in the morning
      work: 0.33 + j(0.035), // about eight
      lunch: 0.5 + j(0.02),
      back: 0.545 + j(0.02),
      off: 0.715 + j(0.05), // about five in the afternoon
      bed: 0.885 + j(0.05), // about nine at night
      likesTavern: r(),
      owl: r() < 0.22, // stays up late at the tavern
      seed,
    };
  }

  // what they are doing at time f (0..1, 0 = midnight) on day `day`, given what their place has
  // (has.tavern, has.square, has.work). Returns an activity name.
  //   sleep · home · work · away · lunch-home · tavern · square · watch · wander
  function activityAt(rt, f, day, has = {}) {
    const dr = mulberry32(hashInt(rt.seed, day, 77))();
    const tavern = has.tavern && dr < 0.25 + rt.likesTavern * 0.55;
    const late = rt.owl && tavern ? 0.06 : 0;
    switch (rt.job) {
      case "watch":
        // the night watch walks from dusk to dawn and sleeps by day
        if (f >= 0.77 || f < 0.26) return "watch";
        if (f < 0.32 || (f >= 0.4 && f < 0.66)) return "sleep";
        return f < 0.4 ? "home" : has.tavern && dr < 0.5 ? "tavern" : "home";
      case "tavern":
        // the keeper opens late in the morning and is the last one up
        if (f >= 0.97 || f < 0.27) return "sleep";
        if (f < 0.4) return "home";
        return "work";
    }
    const bed = rt.bed + late;
    if (f >= bed || f < rt.wake) return "sleep";
    if (f < rt.work) return "home";
    const work =
      rt.job === "idle" ? "wander" : rt.job === "out" ? "away" : "work";
    if (f < rt.lunch) return work;
    if (f < rt.back)
      return rt.job === "out"
        ? "away"
        : dr < 0.45
          ? "home"
          : has.tavern && dr < 0.7
            ? "tavern"
            : has.square
              ? "square"
              : "home";
    if (f < rt.off) return work;
    // the evening: the tavern, the square, or home
    if (tavern) return "tavern";
    if (has.square && dr > 0.62 && f < rt.bed - 0.04) return "square";
    return "home";
  }

  // the time of day for the clock words in talk
  function partOfDay(f) {
    return f < 0.23
      ? "night"
      : f < 0.33
        ? "morning"
        : f < 0.5
          ? "day"
          : f < 0.55
            ? "midday"
            : f < 0.72
              ? "afternoon"
              : f < 0.86
                ? "evening"
                : "night";
  }

  // ---------- what they say about what they are doing ----------
