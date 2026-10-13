// index-inline-2 101 — plan
// Lines 51477-51634 of readable/index-inline-2.pretty.js (statement-aligned).
  const SMALL = {
    hare: {
      name: "hares",
      plan: {
        h: 0.26,
        len: 0.36,
        leg: 0.42,
        neck: 0.25,
        head: 0.72,
        horns: "none",
        earsUp: true,
        earLen: 2.4,
        col: [150, 122, 88],
        belly: [222, 208, 182],
        horn: [60, 50, 40],
        run: 9,
        herd: [2, 4],
        small: true,
      },
    },
    marmot: {
      name: "marmots",
      plan: {
        h: 0.3,
        len: 0.46,
        leg: 0.3,
        neck: 0.22,
        head: 0.62,
        horns: "none",
        fur: true,
        col: [146, 114, 78],
        belly: [196, 172, 136],
        horn: [50, 40, 34],
        run: 6,
        herd: [2, 4],
        small: true,
      },
    },
    tortoise: {
      name: "tortoises",
      plan: {
        h: 0.24,
        len: 0.44,
        leg: 0.32,
        neck: 0.3,
        head: 0.5,
        horns: "none",
        col: [128, 116, 84],
        belly: [168, 156, 112],
        horn: [60, 50, 40],
        shell: [112, 96, 64],
        run: 0.45,
        amble: 0.18,
        herd: [1, 2],
        small: true,
      },
    },
    fox: {
      name: "foxes",
      plan: {
        h: 0.4,
        len: 0.62,
        leg: 0.5,
        neck: 0.3,
        head: 0.52,
        horns: "none",
        fur: true,
        eyePat: PAT.EYES,
        col: [192, 104, 50],
        belly: [238, 228, 212],
        horn: [40, 30, 26],
        tail: { len: 0.6, r: 0.055, drop: 0.35, brush: true, tip: true },
        hunter: { snout: 0.85, muzzleW: 0.42, ears: "tall", neckFwd: 0.55 },
        run: 10,
        herd: [1, 1],
        small: true,
      },
    },
  };
  const SMALL_LAND = {
    [B.STEPPE]: { hare: 0.7, fox: 0.2, marmot: 0.1 },
    [B.SAVANNA]: { hare: 0.7, tortoise: 0.3 },
    [B.DRYFOREST]: { hare: 0.5, fox: 0.3, tortoise: 0.2 },
    [B.DESERT]: { hare: 0.7, tortoise: 0.3 },
    [B.COLDDESERT]: { hare: 0.5, fox: 0.2, marmot: 0.3 },
    [B.TUNDRA]: { hare: 0.5, fox: 0.3, marmot: 0.2 },
    [B.TAIGA]: { fox: 0.6, hare: 0.4 },
    [B.FOREST]: { fox: 0.5, hare: 0.5 },
    [B.WETFOREST]: { fox: 0.5, hare: 0.5 },
    [B.ROCK]: { hare: 0.4, marmot: 0.6 },
    [B.JUNGLE]: { tortoise: 1 },
  };
  function smallFor(biome, T, want = null) {
    const land = SMALL_LAND[biome];
    if (!land) return null;
    let r = Math.random() * Object.values(land).reduce((a, b) => a + b, 0),
      kind = "hare";
    for (const k in land)
      if ((r -= land[k]) <= 0) {
        kind = k;
        break;
      }
    if (want && SMALL[want]) kind = want;
    const S = SMALL[kind],
      cold = T < -2 || biome === B.TUNDRA,
      sandy =
        biome === B.DESERT || biome === B.COLDDESERT || biome === B.SAVANNA;
    const plan = { ...S.plan };
    if (cold) {
      plan.col = [232, 232, 226];
      plan.belly = [244, 244, 240];
    } else if (sandy && kind === "hare") {
      plan.col = [196, 164, 116];
      plan.belly = [236, 222, 196];
      plan.earLen = 3.1;
    }
    if (cold && (kind === "marmot" || kind === "tortoise")) {
      plan.col = S.plan.col;
      plan.belly = S.plan.belly;
    }
    const name =
      cold && (kind === "fox" || kind === "hare")
        ? kind === "fox"
          ? "white foxes"
          : "white hares"
        : sandy && kind === "hare"
          ? "desert hares"
          : S.name;
    return { name, plan, own: false };
  }
  const WOODED = new Set([B.FOREST, B.WETFOREST, B.TAIGA, B.JUNGLE]);

  // what grazes here: the people's own beast if it is a grazer, or the land's
  function grazerFor(beast, biome) {
    const name = String(beast || "").toLowerCase();
    const g = GRAZERS.find((q) => q.re.test(name));
    if (g) {
      const plan = { ...g.plan };
      if (/as big as|the size of|as tall as/.test(name)) {
        plan.h *= 1.5;
        plan.len *= 1.4;
        plan.run *= 1.1;
      }
      if (/antlered/.test(name)) plan.horns = "antlers";
      if (/horned/.test(name) && plan.horns === "none") plan.horns = "curved";
      return {
        name: name.replace(/ (the size of|as big as|as tall as) .*$/, ""),
        plan,
        own: true,
      };
    }
    const k = LAND_GRAZER[biome];
    return k
      ? { name: LAND_PLAN[k].name, plan: LAND_PLAN[k].plan, own: false }
      : null;
  }

  // a four-legged body; bones: 1 neck and head (pivot at the shoulder), 2-5 legs, 6 tail
