// index-inline-2 115 — many
// Lines 58507-58661 of readable/index-inline-2.pretty.js (statement-aligned).
  const STORY_KIND = {
    dragon: "ashhound",
    blight: "blighted",
    siege: "soldier",
    sleeper: "drowned",
    sundered: "soldier",
    fading: "frostwolf",
    haunted: "dead",
  };
  // who hunts where (the weights of each kind), and how often anything does
  const HUNT_LAND = {
    [B.FOREST]: { wolf: 0.45, bear: 0.35, boar: 0.2, k: 1 },
    [B.TAIGA]: { wolf: 0.5, bear: 0.35, boar: 0.15, k: 1 },
    [B.WETFOREST]: { bear: 0.35, cat: 0.35, boar: 0.15, croc: 0.15, k: 0.9 },
    [B.JUNGLE]: { cat: 0.55, boar: 0.2, croc: 0.25, k: 0.8 },
    [B.SAVANNA]: { cat: 0.4, hyena: 0.4, lizard: 0.1, croc: 0.1, k: 1 },
    [B.STEPPE]: { wolf: 0.7, cat: 0.15, boar: 0.15, k: 1 },
    [B.DRYFOREST]: { wolf: 0.3, cat: 0.3, boar: 0.2, lizard: 0.2, k: 0.9 },
    [B.DESERT]: { scorpion: 0.4, lizard: 0.25, cat: 0.2, wolf: 0.15, k: 0.5 },
    [B.COLDDESERT]: { wolf: 0.6, cat: 0.4, k: 0.5 },
    [B.TUNDRA]: { wolf: 0.7, bear: 0.3, k: 0.8 },
    [B.ICE]: { bear: 1, k: 0.4 },
    [B.ROCK]: { cat: 0.5, wolf: 0.3, lizard: 0.2, k: 0.6 },
  };
  const LAND_KINDS = [
    "wolf",
    "cat",
    "bear",
    "boar",
    "hyena",
    "lizard",
    "croc",
    "scorpion",
  ];
  // the kind as this land has it: grey wolves in the woods, white ones in the snow, lions on the grass...
  function hunterOf(kind, biome, T) {
    const cold = T < -3 || biome === B.ICE || biome === B.TUNDRA;
    if (kind === "wolf") {
      if (cold)
        return {
          name: "white wolf",
          many: "white wolves",
          col: [216, 214, 206],
          belly: [238, 236, 230],
        };
      if (
        biome === B.DESERT ||
        biome === B.COLDDESERT ||
        biome === B.SAVANNA ||
        biome === B.DRYFOREST
      )
        return {
          name: "sand wolf",
          many: "sand wolves",
          col: [174, 140, 98],
          belly: [214, 192, 156],
        };
      return { name: "grey wolf", many: "grey wolves" };
    }
    if (kind === "cat") {
      if (cold || (biome === B.ROCK && T < 6))
        return {
          name: "snow leopard",
          many: "snow leopards",
          col: [208, 208, 202],
          belly: [234, 234, 230],
          spots: [100, 100, 106],
          spotN: 26,
          spotR: 0.03,
        };
      if (biome === B.JUNGLE || biome === B.WETFOREST || biome === B.DRYFOREST)
        return {
          name: "leopard",
          many: "leopards",
          col: [206, 160, 82],
          belly: [236, 214, 170],
          spots: [66, 48, 28],
          spotN: 30,
          spotR: 0.028,
        };
      if (biome === B.SAVANNA || biome === B.STEPPE)
        return {
          name: "lion",
          many: "lions",
          col: [200, 156, 94],
          belly: [234, 214, 176],
          h: 1.02,
          len: 1.95,
        };
      return {
        name: "mountain lion",
        many: "mountain lions",
        col: [178, 138, 98],
        belly: [222, 200, 170],
      };
    }
    if (kind === "boar")
      return cold
        ? {
            name: "shag boar",
            many: "shag boars",
            col: [70, 62, 58],
            belly: [104, 94, 86],
          }
        : { name: "wild boar", many: "wild boars" };
    if (kind === "hyena") return { name: "hyena", many: "hyenas" };
    if (kind === "lizard") {
      if (biome === B.DESERT)
        return {
          name: "dune lizard",
          many: "dune lizards",
          col: [196, 170, 120],
          belly: [226, 210, 172],
          spots: [150, 120, 80],
          spotN: 22,
          spotR: 0.05,
        };
      if (biome === B.ROCK)
        return {
          name: "rock lizard",
          many: "rock lizards",
          col: [120, 116, 108],
          belly: [170, 164, 150],
          spots: [70, 66, 62],
          spotN: 22,
          spotR: 0.05,
        };
      return { name: "monitor lizard", many: "monitor lizards" };
    }
    if (kind === "croc") return { name: "crocodile", many: "crocodiles" };
    if (kind === "scorpion")
      return { name: "giant scorpion", many: "giant scorpions" };
    if (cold)
      return {
        name: "white bear",
        many: "white bears",
        col: [234, 232, 222],
        belly: [214, 210, 198],
        h: 1.3,
        len: 1.85,
        hp: 120,
        dmg: [16, 24],
      };
    if (biome === B.WETFOREST)
      return {
        name: "black bear",
        many: "black bears",
        col: [46, 40, 38],
        belly: [86, 70, 56],
      };
    return { name: "brown bear", many: "brown bears" };
  }
  // a giant scorpion's body: flat plates on eight legs, two great claws held out in front (they go with
  // the head), and the tail arched up over its back with the sting at the end of it (which strikes over:
  // uTailP). The same parts as a beast's (see grazerProto), so it is hit, and falls, like one.
