// index-inline-2 37 — secs
// Lines 12990-13330 of readable/index-inline-2.pretty.js (statement-aligned).
  const BLESS = {
    road: {
      name: "The road",
      secs: 180,
      speed: 1.4,
      tireless: true,
      word: "quick and tireless",
    },
    stone: { name: "Stone", secs: 120, armour: 10, word: "hard to hurt" },
    fury: {
      name: "Fury",
      secs: 45,
      mult: 3,
      once: true,
      word: "your next blow lands like three",
    },
    embers: {
      name: "Embers",
      secs: 600,
      fireC: 16,
      dry: true,
      word: "warm through",
    },
    mending: { name: "Mending", secs: 24, heal: 2.4, word: "mending" },
    strength: { name: "Strength", secs: 240, mult: 1.5, word: "strong" },
    nighteyes: {
      name: "Owl eyes",
      secs: 360,
      see: 1,
      word: "seeing in the dark",
    },
    breath: {
      name: "Deep breath",
      secs: 240,
      breath: true,
      word: "never out of breath in the water",
    },
    leaping: {
      name: "Leaping",
      secs: 180,
      leap: 1.35,
      word: "light on your feet",
    },
    // from places
    starlit: {
      name: "Starlit",
      secs: "day",
      mult: 1.25,
      word: "your blows land bright",
    },
    remembered: {
      name: "Remembered",
      secs: "day",
      armour: 5,
      word: "the old stones remember you",
    },
    rooted: {
      name: "Rooted",
      secs: "day",
      regen: 3,
      word: "healing as an old tree heals",
    },
    // from the holy places and wayside shrines of the peoples' faiths: a day of their god's favour
    tide: {
      name: "The tide",
      secs: "day",
      breath: true,
      regen: 1.4,
      word: "the water holds you up",
    },
    watched: {
      name: "Watched over",
      secs: "day",
      see: 0.5,
      word: "the dark is thinner around you",
    },
    wells: {
      name: "The green",
      secs: "day",
      regen: 2.2,
      word: "healing as the green heals",
    },
    mountain: {
      name: "The mountain",
      secs: "day",
      armour: 4,
      word: "the stone stands with you",
    },
    hearthfaith: {
      name: "The flame",
      secs: "day",
      fireC: 8,
      word: "warm whatever the weather",
    },
    wind: {
      name: "The wind",
      secs: "day",
      speed: 1.15,
      word: "the wind at your back",
    },
    hunt: {
      name: "The hunt",
      secs: "day",
      mult: 1.2,
      word: "your blows strike true",
    },
  };
  // the colour each one shows in (for its little mark, and the edge of your sight)
  const BLESS_COL = {
    road: [126, 214, 120],
    stone: [176, 176, 196],
    fury: [236, 84, 64],
    embers: [255, 168, 72],
    mending: [120, 226, 196],
    strength: [214, 112, 76],
    nighteyes: [150, 140, 255],
    breath: [96, 176, 236],
    leaping: [236, 226, 110],
    starlit: [176, 216, 255],
    remembered: [196, 186, 160],
    rooted: [140, 196, 90],
    tide: [90, 190, 210],
    watched: [196, 176, 255],
    wells: [120, 210, 120],
    mountain: [170, 160, 150],
    hearthfaith: [255, 140, 70],
    wind: [200, 230, 255],
    hunt: [220, 120, 90],
  };

  // the songs in what was just played: the longest one that the last notes make, if any
  function songIn(played, known) {
    let best = null;
    for (const id of known) {
      const s = SONGS[id];
      if (!s || played.length < s.notes.length) continue;
      const tail = played.slice(-s.notes.length);
      if (
        tail.every((n, i) => n === s.notes[i]) &&
        (!best || s.notes.length > SONGS[best].notes.length)
      )
        best = id;
    }
    return best;
  }
  // how long a blessing lasts, in days of the world (secs: seconds of walking about at a day's pace)
  function blessDays(id, secPerDay) {
    const b = BLESS[id];
    if (!b) return 0;
    return b.secs === "day" ? 1 : b.secs / secPerDay;
  }
  // all that is on you now, added up: { speed, tireless, armour, mult, multOnce, fireC, heal, regen, see, breath, leap }
  function blessSum(active) {
    const o = {
      speed: 1,
      tireless: false,
      armour: 0,
      mult: 1,
      multOnce: 1,
      fireC: 0,
      heal: 0,
      regen: 1,
      see: 0,
      breath: false,
      leap: 1,
      dry: false,
    };
    for (const id of active) {
      const b = BLESS[id];
      if (!b) continue;
      if (b.speed) o.speed = Math.max(o.speed, b.speed);
      if (b.tireless) o.tireless = true;
      if (b.armour) o.armour += b.armour;
      if (b.mult && b.once) o.multOnce = Math.max(o.multOnce, b.mult);
      else if (b.mult) o.mult *= b.mult;
      if (b.fireC) o.fireC = Math.max(o.fireC, b.fireC);
      if (b.heal) o.heal += b.heal;
      if (b.regen) o.regen = Math.max(o.regen, b.regen);
      if (b.see) o.see = Math.max(o.see, b.see);
      if (b.breath) o.breath = true;
      if (b.leap) o.leap = Math.max(o.leap, b.leap);
      if (b.dry) o.dry = true;
    }
    return o;
  }

  // ---- story/hermits.js ----
  // ============================================================
  // HERMITS — the odd ones who live as far from everything as the world goes:
  // a crooked tower or a hut nobody built twice, purple smoke out of the top
  // of it, and somebody in a pointed hat who has been talking to a crow for
  // thirty years and is glad of the change. They know songs worth knowing and
  // they brew draughts, and they want rare things, not coin: what would they
  // buy, out there? Each is their own sort of strange. One of them, somewhere
  // near the heart of the world's trouble, knows the way there.
  // ============================================================

  const HM_TITLE = [
    "the Odd",
    "the Grey",
    "the Patient",
    "Who Waits",
    "the Unbothered",
    "of the Crows",
    "the Forgetful",
    "the Twice-Born",
    "Under the Hat",
    "the Last",
  ];
  const HM_CROW = [
    "Brannock",
    "Little Ash",
    "Moth",
    "the Bishop",
    "Kettle",
    "Grimble",
    "Saint Nobody",
    "Pip",
  ];
  // their sort of strange: how they say hello, what they say after, and what they do when nobody is talking to them
  const HM_QUIRK = {
    crow: {
      hello: (h) => [
        `"Don’t mind ${h.crow}." A crow on the roof looks at you as if you owe it money. "He thinks you’re a thief. He thinks everybody’s a thief. He’s usually right."`,
      ],
      again: (h) => [
        `"${h.crow} says you’re back. ${h.crow} says a great deal, mostly about you."`,
      ],
    },
    day: {
      hello: () => [
        '"Is it still the same day? Good. I’ve been trying to keep it that way for years. Days get away from you out here if you don’t hold on to them."',
      ],
      again: () => ['"Same day as last time. I held on to it for you."'],
    },
    stones: {
      hello: () => [
        'Stones lie in rows round the door, hundreds of them, each with a name scratched on it. "Mind Edda. And that one. That’s also Edda. They don’t mind. Don’t step on any of the Eddas."',
      ],
      again: () => [
        '"Edda missed you. So did Edda. The other Edda is still cross with you, but she’s cross with everybody."',
      ],
    },
    backwards: {
      hello: () => [
        '"Goodbye! Goodbye, and safe travels." A pause. "No. Wait. Hello. I always get those two the wrong way round. It’s been a long time since I needed either."',
      ],
      again: () => [
        '"Goodbye again! Hello, I mean. You know what I mean. You’re the only one who does."',
      ],
    },
    hums: {
      hello: () => [
        'They are humming, and they keep humming while they look you up and down. "Everything has a tune. The kettle’s is the best. The wind’s is the saddest. Yours..." They listen. "We can work on yours."',
      ],
      again: () => [
        '"Ah: your tune. I’d know it anywhere. It’s got better. A little."',
      ],
    },
    expected: {
      hello: () => [
        '"You’re late." They do not get up. "Ninety years late, but who’s counting. I am. I’m counting. Sit down, you’ll put the fire out standing there."',
      ],
      again: () => ['"Late again. It’s a gift. Don’t lose it."'],
    },
    moon: {
      hello: () => [
        '"Have you seen the moon about? It owes me a favour. I lent it a song, a long time ago, and it never gave it back. You can’t trust anything that changes its face every night."',
      ],
      again: () => ['"Any word from the moon? No? Typical."'],
    },
    beard: {
      hello: () => [
        '"Don’t mind the beard. It’s older than I am, and wiser, and it doesn’t like strangers." They stroke it. "It says you can stay."',
      ],
      again: () => [
        '"The beard remembers you. That’s a compliment. It forgets most people on purpose."',
      ],
    },
  };
  const HM_QUIRKS = Object.keys(HM_QUIRK);
  const HM_COLS = [
    [92, 54, 140],
    [40, 96, 112],
    [128, 40, 64],
    [60, 60, 70],
    [150, 112, 40],
    [44, 92, 60],
  ];

  // who lives at a hermit's place: their name, their sort of strange, their crow, what they know and brew
  function hermitOf(story, s) {
    if (s._hermit) return s._hermit;
    const r = new Rng(hashInt(s.seed, 61, 0x3e7));
    const name = story.old.person(r).split(" ")[0];
    const quirk = r.pick(HM_QUIRKS);
    // two of the common songs, now and then a third; the one near the heart knows the way there
    const common = r.shuffle(SONG_ORDER.slice(0, 5));
    const songs = common.slice(0, 2);
    if (r.chance(0.35)) songs.push("morning");
    if (s.heart) songs.push("heart");
    const draughts = r
      .shuffle([
        "dr_road",
        "dr_bull",
        "dr_mend",
        "dr_owl",
        "dr_hearth",
        "dr_fish",
        "dr_hare",
      ])
      .slice(0, 3);
    const h = {
      name,
      title: r.pick(HM_TITLE),
      quirk,
      crow: r.pick(HM_CROW),
      songs,
      draughts,
      heart: !!s.heart,
      robe: r.pick(HM_COLS),
    };
    Object.defineProperty(s, "_hermit", {
      value: h,
      enumerable: false,
      writable: true,
      configurable: true,
    });
    return h;
  }
  const hermitFull = (h) => `${h.name} ${h.title}`;

  // the flute, given to whoever comes without one
  const FLUTE_GIFT = [
    '"No flute? Everybody ought to have a flute." They rummage in a heap by the door and come up with one, yellow-white and smooth with handling. "There. I carved it out of a leg-bone of something very large that wasn’t using it any more. Five holes, five notes. That’s all music is, if you listen right."',
    '"Take it out and play it whenever you like (R): the keys one to five, or Space and the arrows, are the notes. Play a song you know and it does what it does. Play one you don’t, and it’s just music. That’s allowed too."',
  ];
  // (the same, for someone with a screen to tap instead of keys)
  const FLUTE_GIFT_TOUCH =
    '"Take it out of your satchel and play it whenever you like: five holes, five buttons. Play a song you know and it does what it does. Play one you don’t, and it’s just music. That’s allowed too."';
  // what they say when asked to teach, as they play, as you try, as you get it
