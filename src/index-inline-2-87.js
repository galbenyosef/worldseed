// index-inline-2 87 — item
// Lines 36955-37068 of readable/index-inline-2.pretty.js (statement-aligned).
  function findWeight(kind, b, T, up, ctx = {}) {
    const forest = FOREST_LIKE().includes(b);
    switch (kind) {
      case "herb":
        return T < 0
          ? 0
          : b === B.STEPPE || b === B.WETFOREST
            ? 0.9
            : b === B.FOREST || b === B.SAVANNA
              ? 0.6
              : b === B.TAIGA || b === B.TUNDRA
                ? 0.3
                : b === B.DRYFOREST
                  ? 0.3
                  : 0;
      case "obsidian":
        return ctx.volcanoKm < 60 ? 1 : ctx.volcanoKm < 180 ? 0.45 : 0;
      case "salt":
        return (b === B.DESERT || b === B.COLDDESERT) && ctx.h < 600
          ? 0.7
          : ctx.h < 2.4 && T > 4
            ? 0.35
            : 0;
      case "stick":
        return forest
          ? 1
          : b === B.SAVANNA
            ? 0.3
            : b === B.STEPPE
              ? 0.08
              : b === B.TUNDRA
                ? 0.05
                : 0;
      case "stone":
        return b === B.ICE
          ? 0.1
          : b === B.ROCK || up < 0.9
            ? 1
            : b === B.DESERT || b === B.COLDDESERT
              ? 0.8
              : 0.55;
      case "flint":
        return b === B.ICE ? 0.1 : 0.6;
      case "mushroom":
        return T < 1
          ? 0
          : b === B.WETFOREST
            ? 1
            : b === B.FOREST
              ? 0.8
              : b === B.JUNGLE
                ? 0.7
                : b === B.TAIGA
                  ? 0.6
                  : b === B.DRYFOREST
                    ? 0.2
                    : 0;
      case "bush":
        return T < 2
          ? 0
          : b === B.DRYFOREST
            ? 0.8
            : b === B.FOREST
              ? 0.7
              : b === B.WETFOREST || b === B.TAIGA
                ? 0.55
                : b === B.SAVANNA || b === B.JUNGLE
                  ? 0.5
                  : b === B.STEPPE
                    ? 0.2
                    : 0;
      case "fiber":
        return b === B.STEPPE || b === B.SAVANNA
          ? 1
          : b === B.DRYFOREST
            ? 0.8
            : b === B.FOREST
              ? 0.7
              : b === B.WETFOREST
                ? 0.6
                : b === B.TAIGA
                  ? 0.5
                  : b === B.TUNDRA || b === B.JUNGLE
                    ? 0.4
                    : b === B.DESERT
                      ? 0.08
                      : 0;
    }
    return 0;
  }
  // what each find gives, and how long before the land grows it again (days)
  const FINDS = {
    stick: { item: "stick", n: [1, 3], verb: "Pick up sticks", regrow: 4 },
    stone: { item: "stone", n: [1, 2], verb: "Pick up a stone", regrow: 8 },
    flint: { item: "flint", n: [1, 1], verb: "Pick up flint", regrow: 12 },
    mushroom: {
      item: "mushroom",
      n: [1, 2],
      verb: "Pick mushrooms",
      regrow: 3,
    },
    bush: { item: "berries", n: [3, 5], verb: "Pick berries", regrow: 2 },
    fiber: { item: "fiber", n: [2, 3], verb: "Pull grass", regrow: 3 },
    herb: { item: "herbs", n: [1, 3], verb: "Pick herbs", regrow: 4 },
    obsidian: {
      item: "obsidian",
      n: [1, 2],
      verb: "Pick up obsidian",
      regrow: 30,
    },
    salt: { item: "salt", n: [1, 3], verb: "Scrape up salt", regrow: 6 },
  };
  const pdot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];

