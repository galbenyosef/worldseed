// index-inline-2 33 — hair
// Lines 10887-11190 of readable/index-inline-2.pretty.js (statement-aligned).
  const TRADER = {
    reef: "pearl trader",
    salt: "salt trader",
    canopy: "spice trader",
    stone: "ore trader",
    frost: "fur trader",
    grass: "hide trader",
    wood: "timber trader",
    ash: "glass trader",
    isle: "shell-trader",
  };

  // what taverns are called
  const TAVERN_ADJ = [
    "Red",
    "Old",
    "Sleeping",
    "Crooked",
    "Laughing",
    "Tarred",
    "Lost",
    "Hungry",
    "Silver",
    "Lame",
    "Blind",
    "Singing",
    "Drowned",
    "Patient",
    "Last",
    "Honest",
    "Three",
    "Seven",
    "Golden",
    "Leaky",
  ];
  const TAVERN_NOUN = [
    "Lamp",
    "Kettle",
    "Goat",
    "Boot",
    "Crow",
    "Anchor",
    "Wheel",
    "Bell",
    "Stag",
    "Hound",
    "Ox",
    "Barrel",
    "Star",
    "Key",
    "Cup",
    "Wolf",
    "Candle",
    "Fiddle",
  ];
  // the work of a town that belongs to nobody in particular
  const PLAIN_ROLES = [
    "trader",
    "smith",
    "weaver",
    "potter",
    "farmer",
    "fisher",
    "herder",
    "wanderer",
  ];

  // ---------- the look of a person ----------
  const FOLK = {
    reef: {
      skin: [
        [196, 146, 104],
        [150, 100, 70],
        [120, 80, 60],
      ],
      hair: [
        [30, 24, 30],
        [60, 40, 40],
        [30, 60, 80],
      ],
      main: [
        [46, 120, 150],
        [60, 150, 160],
        [230, 220, 200],
      ],
      trim: [
        [236, 120, 110],
        [240, 220, 160],
        [110, 200, 210],
      ],
      under: [[200, 190, 170]],
      tops: ["wrap", "wrap", "tunic"],
      hats: ["band", "none", "none"],
      items: ["spear", "none", "staff"],
    },
    salt: {
      skin: [
        [180, 128, 86],
        [150, 104, 70],
        [206, 160, 116],
      ],
      hair: [
        [30, 24, 26],
        [70, 50, 40],
      ],
      main: [
        [226, 206, 170],
        [200, 170, 120],
        [60, 70, 130],
      ],
      trim: [
        [60, 70, 140],
        [180, 90, 50],
        [220, 180, 90],
      ],
      under: [[170, 140, 100]],
      tops: ["robe", "robe", "cloak"],
      hats: ["hood", "hood", "wide"],
      items: ["staff", "staff", "none"],
    },
    canopy: {
      skin: [
        [140, 96, 64],
        [110, 76, 54],
        [170, 120, 84],
      ],
      hair: [
        [24, 20, 24],
        [50, 36, 30],
      ],
      main: [
        [70, 120, 60],
        [120, 90, 50],
        [60, 90, 70],
      ],
      trim: [
        [210, 170, 60],
        [200, 70, 50],
        [230, 220, 180],
      ],
      under: [[90, 70, 50]],
      tops: ["wrap", "tunic"],
      hats: ["band", "none"],
      items: ["bow", "spear", "none"],
      mask: 0.3,
    },
    stone: {
      skin: [
        [206, 170, 140],
        [180, 140, 110],
      ],
      hair: [
        [60, 44, 36],
        [140, 100, 60],
        [170, 160, 150],
      ],
      main: [
        [100, 96, 110],
        [120, 90, 70],
        [80, 84, 96],
      ],
      trim: [
        [196, 70, 56],
        [210, 180, 90],
      ],
      under: [[70, 66, 76]],
      tops: ["coat", "tunic", "cloak"],
      hats: ["cap", "none", "none"],
      items: ["spear", "none", "staff"],
      beard: 0.5,
    },
    frost: {
      skin: [
        [236, 214, 200],
        [220, 190, 176],
      ],
      hair: [
        [230, 226, 220],
        [200, 170, 110],
        [120, 90, 60],
      ],
      main: [
        [222, 226, 236],
        [170, 176, 196],
        [140, 110, 80],
      ],
      trim: [
        [80, 96, 140],
        [200, 200, 210],
        [150, 60, 50],
      ],
      under: [[110, 100, 110]],
      tops: ["coat", "coat", "cloak"],
      hats: ["fur", "hood", "fur"],
      items: ["spear", "staff", "lantern"],
      beard: 0.4,
      pack: 0.4,
    },
    grass: {
      skin: [
        [200, 150, 106],
        [170, 124, 86],
      ],
      hair: [
        [40, 30, 26],
        [90, 60, 40],
      ],
      main: [
        [160, 86, 52],
        [120, 80, 50],
        [180, 140, 80],
      ],
      trim: [
        [224, 190, 90],
        [60, 110, 150],
        [230, 220, 200],
      ],
      under: [[100, 80, 60]],
      tops: ["tunic", "coat", "tunic"],
      hats: ["wide", "cap", "none"],
      items: ["bow", "staff", "spear"],
    },
    wood: {
      skin: [
        [226, 190, 156],
        [196, 150, 116],
        [150, 106, 80],
      ],
      hair: [
        [70, 50, 36],
        [150, 110, 60],
        [40, 32, 30],
        [190, 170, 120],
      ],
      main: [
        [90, 110, 60],
        [110, 80, 54],
        [80, 70, 90],
      ],
      trim: [
        [120, 150, 70],
        [200, 170, 90],
        [160, 60, 50],
      ],
      under: [[80, 64, 50]],
      tops: ["cloak", "tunic", "cloak"],
      hats: ["hood", "none", "cap"],
      items: ["staff", "lantern", "none", "bow"],
      pack: 0.3,
      beard: 0.25,
    },
    ash: {
      skin: [
        [170, 150, 156],
        [140, 120, 130],
        [110, 96, 104],
      ],
      hair: [
        [20, 18, 22],
        [230, 110, 60],
      ],
      main: [
        [48, 42, 50],
        [70, 56, 60],
      ],
      trim: [
        [230, 110, 50],
        [210, 60, 40],
        [240, 200, 90],
      ],
      under: [[40, 36, 44]],
      tops: ["robe", "cloak", "coat"],
      hats: ["hood", "none"],
      items: ["staff", "lantern", "spear"],
      mask: 0.45,
    },
    isle: {
      skin: [
        [210, 164, 120],
        [176, 126, 90],
        [230, 196, 160],
      ],
      hair: [
        [40, 30, 26],
        [110, 80, 50],
        [200, 180, 130],
      ],
      main: [
        [232, 214, 170],
        [110, 170, 210],
        [230, 230, 236],
      ],
      trim: [
        [60, 140, 190],
        [220, 180, 80],
        [200, 90, 70],
      ],
      under: [[200, 190, 170]],
      tops: ["tunic", "wrap"],
      hats: ["wide", "none", "band"],
      items: ["none", "staff", "spear"],
    },
  };

