// index-inline-2 81 — kind
// Lines 33665-33979 of readable/index-inline-2.pretty.js (statement-aligned).
  const NEEDS = {
    farmer: [
      ["log", 3, "The barn roof is falling in and the rain is coming."],
      [
        "stone",
        8,
        "The field wall is down and the animals keep getting into the barley.",
      ],
      ["fiber", 20, "The roof wants new thatch before winter."],
    ],
    farmhand: [
      ["stick", 12, "The fire’s nearly out and I can’t leave the field."],
      ["fiber", 16, "I promised the old one I’d mend the thatch."],
    ],
    innkeeper: [
      ["mushroom", 6, "I promised stew tonight and the pot is empty."],
      ["berries", 10, "Travellers want pie. Travellers always want pie."],
      ["log", 4, "The common room is cold and the guests are complaining."],
    ],
    hunter: [
      ["cord", 4, "My snares are rotten, every one."],
      ["flint", 3, "I need new heads for my spears."],
    ],
    trapper: [["cord", 4, "My snares are rotten, every one."]],
    shepherd: [
      ["fiber", 16, "The fold gate is broken and the wind got in."],
      ["cord", 3, "Something chewed through the tethers."],
    ],
    hermit: [
      ["mushroom", 5, "I am too old to go foraging in the wet."],
      ["berries", 8, "A hermit still likes something sweet."],
    ],
    herbalist: [
      ["herbs", 4, "My stock of herbs is low and there is fever about."],
      [
        "mushroom",
        5,
        "Some mushrooms make medicine. Most make stew. I need both.",
      ],
    ],
    "charcoal-burner": [
      ["log", 6, "The mound wants feeding and my axe arm is sore."],
    ],
    fisher: [["cord", 6, "My nets are more hole than net."]],
    "salt-gatherer": [
      [
        "stick",
        10,
        "Nothing burns out on the flats. I need wood for the fire.",
      ],
    ],
    default: [
      ["stick", 10, "The fire needs feeding and I can’t leave."],
      ["stone", 6, "I need stones to mend a wall."],
    ],
  };
  const THINGS = [
    "a jar of honey",
    "a letter, sealed with wax",
    "a shirt she mended",
    "a pot of salve",
    "a bundle of seed for spring",
    "a carved spoon",
    "a little sack of meal",
    "a lock of hair tied with thread",
  ];
  const OFFERINGS = [
    "a ribbon of red cloth",
    "a little bread",
    "a carved bird",
    "three smooth river stones",
    "a sprig of dried flowers",
    "a clay bead",
  ];
  const HEIRLOOMS = [
    "my father’s knife",
    "my grandmother’s comb",
    "my brother’s flute",
    "our old kettle",
    "my mother’s ring",
    "the family’s luck-stone",
  ];
  // what they give back, by who they are
  const REWARDS = {
    farmer: [
      {
        items: [
          ["wool", 4],
          ["dried", 4],
        ],
      },
      { items: [["basket", 1]] },
      {
        items: [
          ["charm", 1],
          ["dried", 3],
        ],
      },
    ],
    farmhand: [{ items: [["dried", 5]] }, { items: [["charm", 1]] }],
    innkeeper: [
      {
        items: [["pack", 1]],
        line: "A traveller left this and never came back for it. Better on your back than on my wall.",
      },
      {
        items: [
          ["saltcap", 6],
          ["torch", 2],
        ],
      },
    ],
    shepherd: [
      {
        items: [["wool", 7]],
        line: "Wool, the best of this year’s. Find someone who can show you the stitch.",
      },
    ],
    hunter: [
      {
        items: [
          ["resin", 3],
          ["pitchtorch", 2],
        ],
      },
      {
        items: [
          ["charm", 1],
          ["dried", 4],
        ],
      },
    ],
    trapper: [
      {
        items: [
          ["resin", 3],
          ["pitchtorch", 2],
        ],
      },
    ],
    hermit: [
      {
        items: [
          ["poultice", 2],
          ["herbs", 4],
        ],
      },
      {
        items: [["charm", 1]],
        line: "I carved it the winter I stopped talking to people. Take it. I am talking again, it seems.",
      },
    ],
    herbalist: [
      {
        items: [
          ["poultice", 3],
          ["herbs", 3],
        ],
      },
    ],
    "charcoal-burner": [{ items: [["charcoal", 8]] }],
    fisher: [
      {
        items: [
          ["cord", 6],
          ["salt", 3],
        ],
      },
    ],
    "salt-gatherer": [{ items: [["salt", 6]] }],
    default: [
      {
        items: [
          ["charm", 1],
          ["dried", 3],
        ],
      },
      {
        items: [
          ["torch", 2],
          ["dried", 3],
        ],
      },
    ],
  };
  const KIND_W = {
    farm: { lost: 0.3, fetch: 0.35, deliver: 0.2, recover: 0.15 },
    hamlet: { lost: 0.3, deliver: 0.3, offer: 0.2, fetch: 0.2 },
    inn: { deliver: 0.4, fetch: 0.4, lost: 0.2 },
    hut: { offer: 0.35, fetch: 0.35, recover: 0.3 },
    tents: { lost: 0.4, fetch: 0.3, offer: 0.3 },
    mill: { fetch: 0.35, deliver: 0.4, lost: 0.25 },
    fishhut: { lost: 0.35, fetch: 0.35, recover: 0.3 },
  };

  // the tale a place holds, if any (the first person there is the one who asks)
  function taleFor(story, ix, s) {
    if (!SITE_LIVED.has(s.kind) || !KIND_W[s.kind]) return null;
    if (s._tale !== undefined) return s._tale;
    const r = new Rng(hashInt(s.seed, 41, 0x7a1e));
    s._tale = null;
    if (!r.chance(0.55)) return null;
    const w = KIND_W[s.kind];
    let x = r.float(),
      kind = null;
    for (const [k, p] of Object.entries(w)) {
      x -= p;
      if (x <= 0) {
        kind = k;
        break;
      }
    }
    kind = kind || Object.keys(w)[0];
    const plan = sitePlan(story, s);
    const giver = {
      name: folkName(story, s, 0),
      role:
        plan && plan.folk[0]
          ? plan.folk[0].role
          : s.kind === "inn"
            ? "innkeeper"
            : "farmer",
    };
    const t = { id: "T" + s.id, kind, site: s.id, giver };
    const pickNear = (kinds, lo, hi, which = "big") => {
      const list = ix
        .near(s.dir, hi, which)
        .filter((o) => o.id !== s.id && kinds.includes(o.kind) && o.m >= lo);
      return list.length ? list[r.int(0, list.length - 1)] : null;
    };
    if (kind === "lost") {
      const b = pickNear(
        [
          "ruin",
          "tower",
          "circle",
          "barrow",
          "bigtree",
          "hotspring",
          "peak",
          "battlefield",
        ],
        1200,
        9000,
      );
      if (!b) kind = "fetch";
      else {
        const [rel, he, him, his] = r.pick(RELS);
        Object.assign(t, {
          target: b.id,
          rel,
          he,
          him,
          his,
          lost: folkName(story, s, 5),
          why: WHY_GONE[b.kind] || "on some errand",
          days: r.int(2, 5),
        });
      }
    }
    if (kind === "deliver") {
      const b = pickNear(
        ["farm", "hamlet", "hut", "inn", "tents"],
        1500,
        15000,
      );
      if (!b) kind = "fetch";
      else
        Object.assign(t, {
          target: b.id,
          to: folkName(story, b, 0),
          thing: r.pick(THINGS),
        });
    }
    if (kind === "offer") {
      const b =
        pickNear(["shrine", "grave"], 300, 3500, "small") ||
        pickNear(["circle", "bigtree", "barrow"], 800, 9000);
      if (!b) kind = "fetch";
      else {
        const [rel, he, him, his] = r.pick(RELS);
        Object.assign(t, {
          target: b.id,
          thing: r.pick(OFFERINGS),
          rel,
          he,
          him,
          his,
          dead: b.kind === "grave",
        });
      }
    }
    if (kind === "recover") {
      const b = pickNear(
        ["ruin", "tower", "circle", "barrow", "bigtree", "battlefield", "peak"],
        1200,
        8000,
      );
      if (!b) kind = "fetch";
      else Object.assign(t, { target: b.id, thing: r.pick(HEIRLOOMS) });
    }
    if (kind === "fetch") {
      const [item, n, why] = r.pick(NEEDS[giver.role] || NEEDS.default);
      Object.assign(t, { need: [item, n], why });
    }
    t.kind = kind;
    // what they have to give; which of it you get is settled when it is done
    t.rewards = r.shuffle((REWARDS[giver.role] || REWARDS.default).slice());
    t.reward = t.rewards[0];
    s._tale = t;
    return t;
  }

  // ---------- what gets said ----------
  // the asking: pages, the last one with a choice
