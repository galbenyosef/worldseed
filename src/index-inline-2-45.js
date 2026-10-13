// index-inline-2 45 — who
// Lines 16874-17155 of readable/index-inline-2.pretty.js (statement-aligned).
  const CHAMP_TITLE = {
    swift: "the Swift",
    stone: "the Stone-Wrapped",
    fireless: "the Fireless",
  };
  const LORD_TITLE = [
    "Lord of the Deeps",
    "the Wrapped King",
    "Queen under the Hill",
    "the Last Warden",
    "the Hollow Prince",
    "Keeper of the Dark",
  ];
  function foeName(story, s, t) {
    if (t.t === "lord" || t.tier === "lord") {
      const r = new Rng(hashInt(s.seed, 91, t.seed || 1));
      return `${cap(story.old.word(r, 2, 3))}, ${r.pick(LORD_TITLE)}`;
    }
    if (t.tier === "champion") {
      const r = new Rng(hashInt(s.seed, 92, t.seed || 1));
      return `${cap(story.old.word(r, 1, 2))} ${CHAMP_TITLE[t.affix] || "the Restless"}`;
    }
    return "the restless dead";
  }
  // ---------- underground: what you find in a cave, and what you can do with it ----------
  // ctx: { story, site, spot (from the cave view: kind, thing, gone), state (the cave's), tool(kind), tomb (has the dead) }
  // Returns { pages | title+sub, effect: { loot, set, wear, note, breath, heal } }.
  const CAMP_NOTES = [
    "Scratched into the rock above the bedroll with the point of a knife: “Came for the crystals. Stayed for the quiet.”",
    "Scratched on the rock in a careful hand: “If you lose your way, follow the cold air. It always knows the way out.”",
    "Scratched on the rock: a tally of days, eleven of them, the last few shaky. Then nothing.",
    "Scratched into the rock, very small: “Torch nearly out. Going back. Not coming back.”",
  ];
  const TOMB_NOTE =
    "Scratched into the rock, deep and hurried: “Leave the dead their things. Do not ask me how I know.”";
  function caveUse(ctx) {
    const { story, site: s, spot } = ctx;
    const t = spot.thing || {},
      id = t.id;
    const people = wsPeople(story, s),
      V = wsVars(story, s, people);
    const plural = people ? people.plural : "old ones";
    const r = new Rng(
      hashInt(
        s.seed,
        41,
        (t.seed || 7) +
          (id ? id.length * 97 + id.charCodeAt(id.length - 1) : 0),
      ),
    );
    const name = siteName(story, s);
    const took = id ? { ["t_" + id]: 1 } : null;
    switch (spot.kind) {
      case "pool":
        return {
          title: "Cave water",
          sub: "so cold it aches. It tastes of stone",
          effect: { breath: 100, heal: 3 },
        };
      case "crystals": {
        if (spot.gone)
          return { title: "Broken stubs", sub: "you took what grew here" };
        const look =
          "Crystals grow out of the floor in a cluster, clear as ice and longer than your hand. Where the light touches them they throw small rainbows across the rock.";
        const tool = ctx.tool("hammer")
          ? "hammer"
          : ctx.tool("knife")
            ? "knife"
            : null;
        if (!tool)
          return {
            pages: [
              { who: null, text: look },
              {
                who: null,
                text: "They are rooted fast. With a hammer, or a knife to work them loose, you could take some.",
              },
            ],
          };
        const n = (t.n || 3) > 5 ? 3 : 2;
        return {
          pages: [
            { who: null, text: look },
            {
              who: null,
              text: `You work ${n === 3 ? "three" : "two"} of them loose with your ${tool}. Each comes away with a small clear note, like a bell a long way off.`,
            },
          ],
          effect: { loot: [["crystal", n]], set: took, wear: tool },
        };
      }
      case "ore": {
        if (spot.gone)
          return {
            title: "Broken rock",
            sub: "the green streaks go deeper than you can follow",
          };
        const look =
          "Green and rust-red streaks run through the wall here. The rock is heavy for its size, and cold.";
        if (!ctx.tool("hammer"))
          return {
            pages: [
              { who: null, text: look },
              { who: null, text: "With a hammer you could break some out." },
            ],
          };
        return {
          pages: [
            { who: null, text: look },
            {
              who: null,
              text: "You break out a few lumps with your hammer. Smiths would know what to do with them.",
            },
          ],
          effect: { loot: [["ore", 3]], set: took, wear: "hammer" },
        };
      }
      case "mushrooms": {
        if (spot.gone)
          return {
            title: "Damp rock",
            sub: "they will grow back, slowly, in the dark",
          };
        return {
          pages: [
            {
              who: null,
              text: "Pale mushrooms grow in the damp, white as candle wax. They have never seen the sun. You pick them; they are cold in your hand.",
            },
          ],
          effect: { loot: [["cavecap", 4]], set: took },
        };
      }
      case "oldcamp": {
        if (spot.gone)
          return { title: "The old camp", sub: "the pack is empty now" };
        const text = ctx.tomb && r.chance(0.6) ? TOMB_NOTE : r.pick(CAMP_NOTES);
        const loot = [["torch", 2], r.chance(0.5) ? ["cord", 2] : ["flint", 1]];
        if (r.chance(0.4)) loot.push(["dried", 2]);
        return {
          pages: [
            {
              who: null,
              text: "Someone camped here once: a ring of stones, old ash, a bedroll gone to rot. A pack leans against the rock with its strap chewed through.",
            },
            { who: null, text },
          ],
          effect: { loot, set: took, note: { text, who: `Found in ${name}` } },
        };
      }
      case "painting": {
        const lead =
          "On the rock, in red earth and white clay: hunters with long spears around a great beast. Handprints all around them, dozens, large and small, as if everyone who ever came here pressed a hand to the wall. Above it all, a white sun.";
        const lore = people
          ? r.pick([
              `The beast is ${V.beast}, or something very like one. The ${plural} still hunt them, and still paint them, though not like this.`,
              `It is old, older than any town you have seen. The ${plural} say ${V.faith} showed the first hunters this cave, so they would have somewhere to keep their stories out of the rain.`,
              `Under the sun someone has painted the same beast again, lying down, with every hunter's hand on it. A thank-you, maybe. ${V.Faith} was thanked like that once.`,
            ])
          : r.pick([
              "Whoever painted this is long gone, and nobody lives near here now to say who they were. Their hands are still on the wall.",
              "The beast has horns like nothing you have seen alive. Either the painter was a liar, or the world was different then.",
              "Under the sun someone has painted the same beast again, lying down, with every hunter’s hand on it. A thank-you, maybe, to something nobody remembers.",
            ]);
        return {
          pages: [
            { who: null, text: lead },
            { who: null, text: lore },
          ],
          effect: {
            note: {
              text: `Paintings in ${name}: ${lore}`,
              who: "Seen underground",
            },
          },
        };
      }
      case "bones": {
        const pages = [
          {
            who: null,
            text: "Bones, long and heavy, picked clean and dry. Something came in here and did not go out again.",
          },
        ];
        if (spot.gone) return { pages };
        pages.push({
          who: null,
          text: "Some of the smaller ones have come loose. You take a few.",
        });
        return { pages, effect: { loot: [["bone", 2]], set: took } };
      }
      case "lord":
        return {
          pages: [
            {
              who: null,
              text: "On the bier in the middle of the chamber lies someone taller than the rest, wrapped in finer cloth gone dark with age. A band of green copper sits on the brow, and the wrapped hands rest on the hilt of a blade.",
            },
            {
              who: null,
              text: `Whoever this was, the others were laid around ${r.chance(0.5) ? "them" : "the bier"} to keep them company. Or to keep them in.`,
            },
          ],
        };
      case "dead":
        return {
          pages: [
            {
              who: null,
              text: r.pick([
                "Someone was laid here long ago, on a shelf of stone, wrapped tight in cloth gone brown and stiff as bark. The arms are bound to the sides. Whoever wrapped them did it with care.",
                "A wrapped body lies on the stone, dry as old leaves. Where the cloth has slipped from the face, the skin is dark and tight over the bones, and the eyes are closed. It looks, almost, as if it were listening.",
                "The dead lie here in their wrappings, one to a shelf. The cloth over this one has been painted once, in red earth, with a sun. The air is very still.",
              ]),
            },
          ],
        };
      case "gravegoods": {
        if (spot.gone)
          return {
            title: "An empty place",
            sub: "where the grave goods were. The dead do not seem to mind. Yet",
          };
        return {
          pages: [
            {
              who: null,
              text: "In the middle of the chamber, where every one of the dead could see it, someone left gifts: pots, still sealed, and a small box bound with green copper.",
            },
            {
              who: null,
              text: "Inside the box: old coins, thin and worn, and an amulet on a cord of braided hair. You take them.",
            },
            {
              who: null,
              text: "As you lift the amulet, somewhere in the dark behind you, something dry creaks. Then something else. Something is sitting up.",
            },
          ],
          effect: {
            loot: [
              ["oldcoin", 5 + r.int(0, 4)],
              ["amulet", 1],
            ],
            set: { ...took, robbed: 1, risen: 1 },
            rise: true,
          },
        };
      }
    }
    return null;
  }
  function folkRoleFor(people, r) {
    return people && people.roles ? r.pick(people.roles) : "wanderer";
  }
  function signWords(ctx) {
    const { story, ix, site: s } = ctx;
    if (s.road == null || !ix.alongRoad)
      return "The signpost has lost its arms.";
    const a = ix.alongRoad(s.road, s.km);
    const head = s.head || 0;
    const way = (b) =>
      bearingWord([0, 0, 1], [Math.sin(b) * 0.01, Math.cos(b) * 0.01, 1]);
    const words = (list, end) => {
      const out = [];
      if (list[0])
        out.push(
          `${wsTitle(siteName(story, list[0].site).replace(/^the /, "The "))}, ${wsDist(list[0].km)}`,
        );
      if (end.town)
        out.push(
          `${end.town.name}, ${end.km < 34 ? wsDist(end.km) : `${Math.round(end.km / 28)} days`}`,
        );
      return out.join("; ");
    };
    const fwd = words(a.ahead, a.endAhead),
      back = words(a.back, a.endBack);
    return `The signpost has two arms. ${cap(way(head))}: ${fwd || "the road goes on"}. ${cap(way(head + Math.PI))}: ${back || "the road goes on"}.`;
  }

  // ---------- looking around from high up ----------
  // What you can see from here: the places with smoke, steam, towers, trees or stones
  // against the sky, in the words you would use. Line of sight over the real ground.
