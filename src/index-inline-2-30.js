// index-inline-2 30 — doing
// Lines 9846-10161 of readable/index-inline-2.pretty.js (statement-aligned).
  const DOING = {
    stall: [
      '"Fresh this morning! ... Just looking? Look, then."',
      '"Everything you see is for sale. Except the stall. And me."',
      '"Buy something or stand aside, friend. You are blocking my best customer."',
    ],
    forge: [
      '"Mind the sparks."',
      '"Copper is soft, but it holds an edge if you treat it right. Like people."',
      '"Bring me ore and I will make you something. Bring me old coin as well and I will not ask where you found it."',
    ],
    bench: [
      '"Mind the shavings."',
      '"Can\u2019t stop. If I stop, it never gets finished."',
      '"Hand me that. No, the other one. Never mind."',
      '"My hands know this work better than I do."',
    ],
    hall: [
      '"Speak softly in here."',
      '"The hall is open to everyone. Mostly to arguments."',
    ],
    well: [
      '"Water is free. Advice about water costs extra."',
      '"Deep and sweet, this well. Don\u2019t drop anything in."',
    ],
    keeper: [
      '"What will it be? We have the brown, and the other brown."',
      '"Sit anywhere. Not there. That is his seat."',
      '"Hungry? The pot has been on since morning."',
    ],
    field: [
      '"Rain, sun, rain, sun. Never in the right order."',
      '"These rows won\u2019t weed themselves."',
      '"Back aches. Crop grows. That is the bargain."',
    ],
    tavern: [
      '"Sit down, stranger! Nobody drinks alone in here."',
      '"Another one? Go on, then."',
      '"You missed the song. Don\u2019t worry, we\u2019ll sing it again. Worse."',
      '"Work\u2019s done. Tomorrow\u2019s a long way off."',
    ],
    square: [
      '"Fine evening. Too fine to sit indoors."',
      '"We come out when the work is done. Just to see who else did."',
    ],
    home: [
      '"This is my home, you know."',
      '"Shut the door behind you, you are letting the warm out."',
      '"Don\u2019t mind the mess."',
    ],
    morning: [
      '"Up already? So are we, worse luck."',
      '"A bite to eat, then off to work."',
    ],
    wander: [
      '"Just walking. Thinking. Mostly walking."',
      '"Nowhere to be today. It is wonderful and I hate it."',
    ],
    watch: [
      '"Late to be out, stranger. Keep to the lit streets."',
      '"All quiet. Keep it that way."',
    ],
    asleep: [
      "They are fast asleep.",
      "Asleep, and snoring softly.",
      "Asleep. Best let them be.",
    ],
  };
  // a line for whatever someone is doing now (null if nothing in particular)
  function doingLine(f, rnd = Math.random) {
    const pick = (arr) => arr[Math.floor(rnd() * arr.length)];
    const job = f.rt ? f.rt.job : null,
      w = f.workP;
    switch (f.act) {
      case "work":
        if (job === "tavern") {
          const tn = f.info && f.info.tavernName;
          return tn && rnd() < 0.5
            ? `"Welcome to ${tn}. Sit, sit. What will it be?"`
            : pick(DOING.keeper);
        }
        if (job === "field") return pick(DOING.field);
        if (w && DOING[w.kind]) return pick(DOING[w.kind]);
        return null;
      case "tavern": {
        const tn = f.info && f.info.tavernName;
        return tn && rnd() < 0.3
          ? `"Best tavern in town, ${tn}. Only tavern in town, but still."`
          : pick(DOING.tavern);
      }
      case "square":
        return pick(DOING.square);
      case "home":
        return f.dayFracAtTalk != null && f.dayFracAtTalk < 0.4
          ? pick(DOING.morning)
          : pick(DOING.home);
      case "wander":
        return rnd() < 0.5 ? pick(DOING.wander) : null;
      case "watch":
        return pick(DOING.watch);
    }
    return null;
  }
  function asleepLine(rnd = Math.random) {
    return DOING.asleep[Math.floor(rnd() * DOING.asleep.length)];
  }

  // ---- story/towns.js ----
  // ============================================================
  // TOWNS & FOLK — what a settlement looks like on the ground and who
  // stands in it. Each people has a way of building (walls, roofs, how
  // floors stack, stilts, round houses) coloured by what grows around them;
  // each town lays out a plaza, streets and houses from its own seed; each
  // person is a look assembled from parts. Pure data: the view builds it.
  // ============================================================

  // building traditions per people; the land adjusts them
  const TRADITION = {
    reef: {
      walls: ["coral", "white"],
      roofs: ["dome", "flat", "hip"],
      upper: "step",
      stilts: 0.55,
      floors: [1, 2],
      pitch: 0.55,
      overhang: 0.25,
      round: 0.25,
    },
    salt: {
      walls: ["mud", "mud", "sandstone"],
      roofs: ["flat", "flat", "dome"],
      upper: "step",
      stilts: 0,
      floors: [1, 3],
      pitch: 0.4,
      overhang: 0.05,
      round: 0.1,
    },
    canopy: {
      walls: ["plank", "hide"],
      roofs: ["cone", "gable"],
      upper: "same",
      stilts: 0.8,
      floors: [1, 1],
      pitch: 1.25,
      overhang: 0.7,
      round: 0.5,
    },
    stone: {
      walls: ["stone", "stone", "darkstone"],
      roofs: ["gable", "hip"],
      upper: "same",
      stilts: 0,
      floors: [1, 3],
      pitch: 0.85,
      overhang: 0.3,
      round: 0,
      chimney: 0.6,
    },
    frost: {
      walls: ["log"],
      roofs: ["gable"],
      upper: "same",
      stilts: 0,
      floors: [1, 2],
      pitch: 1.15,
      overhang: 0.45,
      round: 0.15,
      chimney: 0.9,
    },
    grass: {
      walls: ["hide", "hide", "plank"],
      roofs: ["cone"],
      upper: "same",
      stilts: 0,
      floors: [1, 1],
      pitch: 0.75,
      overhang: 0.25,
      round: 0.85,
      smoke: true,
    },
    wood: {
      walls: ["frame", "frame", "plank"],
      roofs: ["gable", "gable", "hip"],
      upper: "jetty",
      stilts: 0,
      floors: [1, 3],
      pitch: 1.0,
      overhang: 0.45,
      round: 0,
      chimney: 0.5,
    },
    ash: {
      walls: ["basalt"],
      roofs: ["flat", "hip"],
      upper: "step",
      stilts: 0,
      floors: [1, 2],
      pitch: 0.5,
      overhang: 0.1,
      round: 0,
    },
    isle: {
      walls: ["white", "plank"],
      roofs: ["hip", "gable"],
      upper: "same",
      stilts: 0.3,
      floors: [1, 2],
      pitch: 0.6,
      overhang: 0.55,
      round: 0.1,
    },
  };
  // colours of materials: a few choices each, picked per people
  const WALLS = {
    coral: [
      [232, 214, 196],
      [236, 190, 176],
      [214, 222, 226],
    ],
    white: [
      [236, 230, 214],
      [240, 232, 206],
      [222, 228, 236],
    ],
    mud: [
      [196, 154, 100],
      [178, 112, 80],
      [206, 170, 116],
    ],
    sandstone: [
      [204, 172, 122],
      [190, 150, 104],
    ],
    plank: [
      [168, 120, 74],
      [138, 100, 64],
      [196, 166, 120],
      [120, 84, 58],
    ],
    hide: [
      [184, 150, 106],
      [150, 112, 76],
      [206, 186, 150],
    ],
    stone: [
      [140, 132, 144],
      [156, 148, 136],
      [120, 116, 124],
    ],
    darkstone: [
      [92, 86, 96],
      [104, 96, 90],
    ],
    log: [
      [138, 96, 60],
      [112, 78, 52],
      [160, 116, 74],
    ],
    frame: [
      [232, 222, 200],
      [226, 214, 180],
      [236, 228, 214],
    ],
    basalt: [
      [62, 54, 62],
      [74, 64, 66],
      [54, 50, 60],
    ],
  };
  const ROOFS = {
    thatch: [
      [200, 168, 96],
      [180, 148, 80],
      [214, 186, 110],
    ],
    tile: [
      [176, 80, 42],
      [160, 70, 46],
      [190, 104, 60],
    ],
    slate: [
      [74, 68, 88],
      [90, 86, 104],
      [66, 72, 84],
    ],
    shingle: [
      [106, 74, 50],
      [90, 64, 46],
      [124, 90, 60],
    ],
    turf: [
      [92, 122, 58],
      [104, 128, 64],
    ],
    dome: [
      [236, 232, 222],
      [120, 176, 214],
      [214, 180, 110],
    ],
    hide: [
      [170, 136, 96],
      [140, 104, 70],
    ],
    ember: [
      [176, 64, 42],
      [60, 52, 60],
    ],
  };
  const WOODS = [
    [120, 80, 44],
    [90, 62, 40],
    [150, 104, 60],
    [70, 50, 38],
  ];

