// index-inline-2 12 — range
// Lines 3537-3869 of readable/index-inline-2.pretty.js (statement-aligned).
  function makeGenome(form, variant, r, style, hab) {
    const g = { form, variant };
    const [h0, h1] = FORM_H[form];
    const tallK =
      form === "grass" ||
      form === "flower" ||
      form === "cap" ||
      form === "stone"
        ? 1
        : style.tall;
    g.h = r.range(h0, h1) * tallK;
    g.leaf = {
      mat: hab.mat,
      hue: style.hue + r.range(-10, 10),
      sat: r.range(0.9, 1.15),
      val: r.range(0.92, 1.08),
    };
    g.bark = r.pick(BARKS);
    g.bloom = r.chance(style.bloom * 0.35)
      ? { c: r.pick(style.petals), k: r.range(0.04, 0.16) }
      : null;
    switch (form) {
      case "broadleaf": {
        g.shape =
          variant || r.pick(["round", "round", "tall", "wide", "droop"]);
        g.trunk = r.range(0.28, 0.5);
        g.width = r.range(0.5, 1);
        g.lean = r.range(-0.35, 0.35) + style.twist;
        g.bend = r.range(0, 0.6);
        g.depth = r.int(2, 3);
        g.count = r.int(2, 4);
        g.spread = r.range(0.45, 0.95);
        g.ratio = r.range(0.55, 0.75);
        g.up =
          g.shape === "tall"
            ? r.range(0.55, 0.8)
            : g.shape === "wide"
              ? r.range(0.05, 0.25)
              : r.range(0.25, 0.5);
        g.clump = r.range(0.75, 1.25) * (g.shape === "wide" ? 1.1 : 1);
        g.fill = r.range(0.62, 0.95);
        if (g.shape === "droop") {
          g.up = r.range(0.2, 0.4);
          g.fill = r.range(0.7, 0.9);
        }
        if (g.shape === "flat") {
          g.up = r.range(0.0, 0.15);
          g.spread = r.range(0.9, 1.3);
          g.clump = r.range(0.8, 1.1);
        }
        if (r.chance(style.autumn)) g.leaf.hue += r.pick([-40, -60, 30]);
        break;
      }
      case "conifer": {
        g.shape = r.pick(["cone", "cone", "spire", "layered", "round"]);
        g.trunk = r.range(0.06, 0.2);
        g.width = r.range(0.35, 0.6);
        g.lean = r.range(-0.08, 0.08);
        g.tiers = r.int(4, 9);
        g.girth =
          g.shape === "spire" ? r.range(0.22, 0.3) : r.range(0.32, 0.46);
        g.droop = r.range(0.1, 0.7);
        g.leaf.hue += r.range(-6, 10);
        g.leaf.val *= r.range(0.9, 1.02);
        g.leaf.mat =
          hab.mat === "FOREST" ||
          hab.mat === "WETFOREST" ||
          hab.mat === "ROCK" ||
          hab.mat === "TUNDRA"
            ? "TAIGA"
            : hab.mat;
        break;
      }
      case "palm": {
        g.trunk = 0.82;
        g.bend = r.range(0.2, 1);
        g.fronds = r.int(6, 10);
        g.frond = r.range(0.34, 0.5);
        g.droop = r.range(0.4, 1);
        g.fruit = r.chance(0.6);
        g.leaf.mat = hab.mat === "JUNGLE" ? "JUNGLE" : "DRYFOREST";
        g.bark = r.pick(["pale", "brown", "grey"]);
        break;
      }
      case "umbrella": {
        g.shape = "flat";
        g.trunk = r.range(0.55, 0.75);
        g.width = r.range(0.7, 1);
        g.lean = r.range(-0.2, 0.2);
        g.depth = 2;
        g.count = r.int(3, 5);
        g.spread = r.range(1.0, 1.4);
        g.ratio = r.range(0.45, 0.6);
        g.up = r.range(0.05, 0.2);
        g.clump = r.range(0.8, 1.1);
        g.fill = r.range(0.7, 0.95);
        g.vines = hab.mat === "JUNGLE" ? r.range(0.1, 0.35) : 0;
        g.buttress = hab.mat === "JUNGLE" && r.chance(0.7);
        break;
      }
      case "snag": {
        g.trunk = r.range(0.35, 0.55);
        g.width = r.range(0.5, 0.9);
        g.lean = r.range(-0.4, 0.4);
        g.bend = r.range(0.2, 0.9);
        g.depth = r.int(2, 3);
        g.count = r.int(2, 3);
        g.spread = r.range(0.5, 1.0);
        g.ratio = r.range(0.5, 0.7);
        g.up = r.range(0.1, 0.5);
        g.bark = r.pick(["grey", "pale", "dark"]);
        break;
      }
      case "shrub": {
        g.clumps = r.int(3, 6);
        g.flat = r.range(0.55, 0.95);
        g.fill = r.range(0.7, 0.95);
        g.berries = r.chance(0.35)
          ? r.pick([
              [210, 40, 60],
              [90, 60, 200],
              [250, 140, 40],
              [240, 240, 240],
            ])
          : null;
        if (
          hab.mat === "DESERT" ||
          hab.mat === "COLDDESERT" ||
          hab.mat === "SAVANNA"
        ) {
          g.leaf.mat = "SAVANNA";
          g.fill = r.range(0.45, 0.7);
        }
        break;
      }
      case "succulent": {
        g.shape = r.pick(["column", "column", "barrel", "paddle", "rosette"]);
        g.arms = r.int(0, 4);
        g.ribs = r.chance(0.7);
        g.flowers = r.chance(0.5) ? r.pick(style.petals) : null;
        if (g.shape === "barrel" || g.shape === "rosette")
          g.h = r.range(0.4, 1.3);
        if (g.shape === "paddle") g.h = r.range(0.8, 2);
        g.leaf.mat = "DRYFOREST";
        break;
      }
      case "fern": {
        g.fronds = r.int(5, 9);
        g.curl = r.range(0.2, 0.9);
        g.leaf.mat =
          hab.mat === "JUNGLE"
            ? "JUNGLE"
            : hab.mat === "TAIGA"
              ? "TAIGA"
              : "FOREST";
        break;
      }
      case "grass": {
        g.blades = r.int(5, 12);
        g.bend = r.range(0.1, 0.8);
        g.seeds = r.chance(0.45);
        g.leaf.mat =
          hab.mat === "SAVANNA" ||
          hab.mat === "DESERT" ||
          hab.mat === "COLDDESERT"
            ? "SAVANNA"
            : hab.mat === "TUNDRA" || hab.mat === "ROCK"
              ? "TUNDRA"
              : "STEPPE";
        break;
      }
      case "flower": {
        g.stems = r.int(3, 7);
        g.head = r.pick(["dot", "cross", "star", "bell", "cup"]);
        g.c = r.pick(style.petals);
        g.c2 = r.pick(style.petals);
        g.leaf.mat = "FOREST";
        break;
      }
      case "reed": {
        g.blades = r.int(6, 11);
        g.heads = r.chance(0.7);
        g.leaf.mat = "SAVANNA";
        break;
      }
      case "cap": {
        const giant = style.giantCaps && r.chance(0.7);
        if (giant) g.h = r.range(6, 18) * style.tall;
        g.giant = giant;
        g.shape = r.pick(["dome", "flat", "cone", "bell"]);
        g.cap = CAPS[r.int(0, CAPS.length - 1)];
        g.spots = r.chance(0.45);
        g.cluster = giant ? 1 : r.int(1, 4);
        break;
      }
      case "stone": {
        g.shape = r.pick(["boulder", "boulder", "slab", "pile"]);
        g.moss =
          hab.mat === "WETFOREST" || hab.mat === "FOREST" || hab.mat === "TAIGA"
            ? r.range(0.2, 0.7)
            : 0;
        g.tint =
          hab.mat === "DESERT"
            ? "DESERT"
            : hab.mat === "COLDDESERT"
              ? "COLDDESERT"
              : "ROCK";
        if (hab.mat === "DESERT" && r.chance(0.4)) {
          g.shape = "spire";
          g.h = r.range(2, 6);
        }
        break;
      }
    }
    return g;
  }

  function buildFlora(planet) {
    const r = new Rng(subSeed(planet.seedKey, "flora"));
    const gravity = planet.body.gravity || 1;
    const style = {
      tall: clampN(1 / Math.sqrt(gravity), 0.75, 1.45),
      hue: r.range(-12, 12),
      bloom: r.soft(0.15, 0.95),
      autumn: r.chance(0.3) ? r.range(0.2, 0.6) : 0.05,
      twist: r.range(-0.15, 0.15),
      lush: r.range(0.8, 1.2),
      giantCaps: r.chance(0.12),
      petals: [],
    };
    style.petals = r.shuffle(PETALS.slice()).slice(0, 3);
    const species = [];
    const table = {};
    for (const key of Object.keys(HABITAT)) {
      const b = +key,
        hab = HABITAT[key];
      const br = new Rng(subSeed(planet.seedKey, "flora/" + key));
      const layers = [];
      const add = (layer, forms, density) => {
        if (!forms.length || density <= 0) return;
        const list = [];
        forms.forEach((f, slot) => {
          let [form, variant] = f.split("|");
          if (form === "broadleaf" && variant === "conifer") {
            form = br.chance(0.5) ? "conifer" : "broadleaf";
            variant = undefined;
          }
          const g = makeGenome(form, variant, br, style, hab);
          const sp = {
            id: species.length,
            form,
            g,
            biome: b,
            layer,
            cold: !!hab.cold,
          };
          species.push(sp);
          list.push({ sp: sp.id, w: slot === 0 ? 3 : slot === 1 ? 2 : 1 });
        });
        layers.push({ layer, density: density * style.lush, list });
      };
      add("tree", hab.trees, hab.tree);
      add("shrub", hab.shrubs, hab.shrub);
      add("cover", hab.covers, hab.cover);
      add(
        "rare",
        hab.rare,
        style.giantCaps && hab.rare.includes("cap") ? 0.6 : 0.12,
      );
      table[b] = layers;
    }
    // the shore: palms where it is hot, reeds where it is wet
    const shore = new Rng(subSeed(planet.seedKey, "flora/shore"));
    const palm = makeGenome("palm", undefined, shore, style, HABITAT[B.JUNGLE]);
    const reed = makeGenome("reed", undefined, shore, style, HABITAT[B.FOREST]);
    const sPalm = {
      id: species.length,
      form: "palm",
      g: palm,
      biome: -1,
      layer: "tree",
    };
    species.push(sPalm);
    const sReed = {
      id: species.length,
      form: "reed",
      g: reed,
      biome: -1,
      layer: "cover",
    };
    species.push(sReed);
    return { style, species, table, shore: { palm: sPalm.id, reed: sReed.id } };
  }

  // ---- world/roads.js ----
  // ============================================================
  // ROADS — the ways people walk between their towns. On every landmass
  // with more than one town: a spanning tree of roads plus a few shortcuts,
  // each routed across the land around steep ground, high passes and the
  // sea, sharing trunks where they can, and winding at every scale: bends
  // of kilometres from the route, tens of metres from the ground itself.
  // ============================================================

  const MAX_KM = 9000; // longer than this and nobody builds a road
  const STEP_KM = 3.5; // spacing of the road's control points

  const rdDot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
  const rdNorm = (v) => {
    const L = Math.hypot(v[0], v[1], v[2]) || 1;
    return [v[0] / L, v[1] / L, v[2] / L];
  };
  const rdAngle = (a, b) =>
    Math.atan2(
      Math.hypot(
        a[1] * b[2] - a[2] * b[1],
        a[2] * b[0] - a[0] * b[2],
        a[0] * b[1] - a[1] * b[0],
      ),
      rdDot(a, b),
    );
  function rdSlerp(a, b, t) {
    const om = rdAngle(a, b);
    if (om < 1e-9) return a.slice();
    const s = Math.sin(om),
      k0 = Math.sin((1 - t) * om) / s,
      k1 = Math.sin(t * om) / s;
    return rdNorm([
      a[0] * k0 + b[0] * k1,
      a[1] * k0 + b[1] * k1,
      a[2] * k0 + b[2] * k1,
    ]);
  }

