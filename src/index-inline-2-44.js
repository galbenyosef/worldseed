// index-inline-2 44 — pages
// Lines 16296-16873 of readable/index-inline-2.pretty.js (statement-aligned).
  function siteUse(ctx) {
    const { story, ix, site: s, spot } = ctx;
    const state = ctx.state || {};
    const people = wsPeople(story, s);
    const V = wsVars(story, s, people);
    const r = new Rng(hashInt(s.seed, 5, 0x2ead));
    const plural = people ? people.plural : "old ones";
    const name = siteName(story, s);
    const hist = story.history || [];
    const fragment = (k) => {
      const pick = (k + (s.seed % 7)) % 6;
      if (pick === 0 && hist[0])
        return `The carving tells, in pictures, how ${wsLc(hist[0].text).replace(/\.$/, "")}.`;
      if (pick === 1 && hist[1])
        return `Worn figures, and under them words you can almost read: ${wsLc(hist[1].text)}`;
      if (pick === 2) return ARC_IMAGE[story.arc.kind] || ARC_IMAGE.dawn;
      if (pick === 3 && story.arc.clock) {
        const p = story.arc.clock.period;
        return `A row of ${p} notches, over and over, every ${p}th cut deeper than the rest. Somebody was counting days.`;
      }
      if (pick === 4)
        return (
          FELL_IMAGE + `${3 + (s.seed % 5)} marks. You were not the first.`
        );
      return `Names, dozens of them, cut one under another in the old tongue. The last one is ${story.old.word(new Rng(s.seed), 2, 2)}, and it was never finished.`;
    };
    const note = (text) => ({ text, who: `Read at ${name}` });
    const seen = (text) => ({ text, who: `Seen at ${name}` });
    switch (spot.kind) {
      case "stone": {
        const plan = sitePlan(story, s);
        if (!plan.carved)
          return {
            pages: [
              {
                who: null,
                text: "A standing stone, taller than you, leaning a little. If it was ever carved, the weather has had the words.",
              },
            ],
          };
        const t = fragment(1);
        return {
          pages: [
            {
              who: null,
              text: "The standing stone is carved on the side away from the wind.",
            },
            { who: null, text: t },
          ],
          effect: { note: note(t), lore: s.id },
        };
      }
      case "carving":
      case "altar":
      case "barrow": {
        const lead =
          spot.kind === "carving"
            ? `On the one wall of ${name} still standing, someone carved pictures a long time ago.`
            : spot.kind === "altar"
              ? `The flat stone in the middle of ${name} is worn smooth, as if by hands.`
              : `The door of ${name} is a single slab of stone. It does not move. Above it:`;
        const t = fragment(
          spot.kind === "altar" ? 3 : spot.kind === "barrow" ? 5 : 0,
        );
        // (stand among the old stones and they remember you)
        return {
          pages: [
            { who: null, text: lead },
            { who: null, text: t },
          ],
          effect: {
            note: note(t),
            lore: s.id,
            ...(spot.kind === "altar" ? { bless: "remembered" } : {}),
          },
        };
      }
      case "grave": {
        const kind =
          r.chance(0.35) && EPITAPH[story.arc.kind] ? story.arc.kind : "any";
        const ep = fill(r.pick(EPITAPH[kind]), {
          ...V,
          Role: cap(folkRoleFor(people, r)),
          plural,
        });
        const who = folkName(story, s, 7);
        const t = `${who}. ${ep}`;
        return {
          pages: [
            {
              who: null,
              text: `A low mound, and a marker. Cut into it: “${t}”`,
            },
          ],
          effect: { note: note(`A grave: “${t}”`) },
        };
      }
      case "sign":
      case "innsign": {
        if (spot.kind === "innsign")
          return {
            pages: [
              {
                who: null,
                text: `A painted board hangs from the post: ${wsTitle(name.replace(/^the /, "The "))}. Underneath, smaller: Beds. Fire. Food.`,
              },
            ],
          };
        return {
          pages: [{ who: null, text: signWords(ctx) }],
          effect: { note: note(signWords(ctx)) },
        };
      }
      case "cairn": {
        if (state.added)
          return {
            title: "The cairn",
            sub: "your stone is on it now, with all the others",
          };
        if (!ctx.has("stone", 1))
          return {
            title: "A cairn",
            sub: "travellers add a stone as they pass, for luck. You have none",
          };
        return {
          title: "You add a stone",
          sub: "as travellers do. For luck",
          effect: { take: [["stone", 1]], set: { added: 1 }, rested: 240 },
        };
      }
      case "shrine": {
        const temple = !!spot.temple,
          where = temple ? `${cap(name)}` : `A small shrine to ${V.faith}`;
        if (state.day === ctx.day)
          return {
            title: temple ? cap(name) : "The shrine",
            sub: "you have already left something here today",
          };
        const food = ctx.food();
        const coin = temple && ctx.count && ctx.count("oldcoin") > 0;
        if (!food && !coin)
          return {
            pages: [
              {
                who: null,
                text: `${where}, with a bowl for offerings. ${temple ? "There is a little in it already: a crust, a feather, a coin." : "It is empty."} You have nothing to leave.`,
              },
            ],
          };
        const bless = faithBless(people ? people.faith : null),
          ask = FAITH_ASK[bless];
        const gift = food ? food.words : "an old coin";
        const look = temple
          ? `The figure of ${V.faith} looks down at you, or past you.`
          : "It is quiet here.";
        return {
          pages: [
            {
              who: null,
              text: `${where}. You leave ${gift} in the bowl and ask, as the ${plural} do, ${ask}. ${look} The aches in you ease a little.`,
            },
          ],
          effect: {
            take: [food ? [food.id, 1] : ["oldcoin", 1]],
            set: { day: ctx.day },
            heal: temple ? 35 : 20,
            bless,
            ...(temple ? { rested: 300 } : {}),
          },
        };
      }
      case "mill": {
        const n = ctx.count ? ctx.count("grain") : 0;
        const look =
          "Inside the mill it is all noise and dust: the great stones grinding round, the floor shaking with them, flour in the air like smoke. Everything is white.";
        if (!n)
          return {
            pages: [
              { who: null, text: look },
              {
                who: null,
                text: "Bring grain, and the miller will grind it for you.",
              },
            ],
          };
        const k = Math.min(n, 12);
        return {
          pages: [
            { who: null, text: look },
            {
              who: null,
              text: `The miller tips your grain into the hopper. It comes out the bottom as flour. (${k} grain → ${k} flour.)`,
            },
          ],
          effect: { take: [["grain", k]], loot: [["flour", k]] },
        };
      }
      case "bell":
        return { effect: { bell: true } };
      case "spring": {
        if (state.day === ctx.day)
          return {
            title: "A spring",
            sub: "the water is so cold it hurts your teeth",
            effect: { breath: 100, heal: 4 },
          };
        return {
          pages: [
            {
              who: null,
              text: "The water is so cold it hurts your teeth. Herbs grow thick where it spills over the stones; you pick a handful.",
            },
          ],
          effect: {
            breath: 100,
            heal: 4,
            loot: [["herbs", 2]],
            set: { day: ctx.day },
          },
        };
      }
      case "bathe":
        return {
          pages: [
            {
              who: null,
              text: `You sink into the hot water of ${name}. It smells of eggs and stone. For the first time since you fell, nothing hurts.`,
            },
          ],
          effect: { heal: 45, warm: 100, rested: 900, dry: true },
        };
      case "camp": {
        if (!state.searched) {
          const loot = [
            ["stick", 4],
            r.chance(0.5) ? ["cord", 2] : ["flint", 1],
          ];
          if (r.chance(0.35)) loot.push(["torch", 1]);
          if (r.chance(0.3)) loot.push(["dried", 3]);
          return {
            pages: [
              {
                who: null,
                text: "An old camp: a ring of stones and cold ash. Whoever sat here left in a hurry. Under a flat stone by the fire you find what they left behind.",
              },
            ],
            effect: { loot, set: { searched: 1 }, campfire: true },
          };
        }
        return {
          title: "An old camp",
          sub: "the ring of stones would hold a fire again",
          effect: { campfire: true },
        };
      }
      // ---------- the great city that fell ----------
      case "citystone": {
        const C = story.city || {},
          cn = name,
          arc = story.arc || {};
        const why =
          arc.kind === "dragon"
            ? `Below the names, newer and cut in a hurry: fire came down from the mountain, and there was nowhere in all of ${cn} that it did not reach.`
            : arc.kind === "haunted"
              ? `Below the names, cut deep and shaky: the dead got up in the streets of ${cn}, and the living went out of the gates and did not come back.`
              : arc.kind === "blight"
                ? `Below the names, someone has cut a single leaf, withered, and nothing else.`
                : `Nobody cut what happened to it. Whatever it was, nobody was left to.`;
        const pages = [
          {
            who: null,
            text: `A tall stone at the edge of the square, cut all over in the old tongue. At the top, larger than the rest: ${cn}. Under it, in rows, the names of its streets and its quarters, and how many lived in each. It is a great many.`,
          },
          { who: null, text: why },
        ];
        return {
          pages,
          effect: {
            note: note(`${cap(cn)}: a great city once. ${why}`),
            lore: s.id,
          },
        };
      }
      case "treasury": {
        if (state.taken)
          return {
            title: "The strongroom",
            sub: "empty now. You made sure of it",
          };
        const pages = [
          {
            who: null,
            text: `Behind the palace, under fallen beams: what was the strongroom of ${name}. Its door is gone and its chests were broken open long ago. Long ago, but not carefully.`,
          },
          {
            who: null,
            text: "In the dust under a split chest: old coin, a great deal of it, a thin crown gone green, and a heavy seal cut with the arms of a city that is not there any more.",
          },
        ];
        return {
          pages,
          effect: {
            loot: [
              ["oldcoin", 34 + r.int(0, 24)],
              ["crown", 1],
              ["cityseal", 1],
            ],
            set: { taken: 1 },
            note: seen(
              `The strongroom of ${name}: you took what was left in it.`,
            ),
          },
        };
      }
      case "cityrubble": {
        if (state["r" + spot.n])
          return { title: "The rubble", sub: "you have been through it" };
        const rr = new Rng(hashInt(s.seed, 300 + spot.n, 0x7ab));
        const loot = rr.pick([
          [["oldcoin", 3 + rr.int(0, 5)]],
          [["amulet", 1]],
          [
            ["oldblade", 1],
            ["oldcoin", 2],
          ],
          [["oldcoin", 6 + rr.int(0, 6)]],
          [
            ["stone", 3],
            ["flint", 2],
          ],
          [["crown", 1]],
        ]);
        const text = rr.pick([
          `You turn over what fell into the street. Under it, someone’s last things.`,
          `Stones, mostly. A door, rotted to nothing. And under the door, what somebody hid.`,
          `The rubble of a house in ${name}. Not only rubble.`,
        ]);
        return {
          pages: [{ who: null, text }],
          effect: { loot, set: { ["r" + spot.n]: 1 } },
        };
      }
      case "stash":
      case "rubble": {
        if (state.searched)
          return {
            title: spot.kind === "stash" ? "The hiding place" : "The rubble",
            sub: "there is nothing more here",
          };
        const loot =
          spot.kind === "stash"
            ? [
                r.pick([
                  ["flint", 2],
                  ["cord", 3],
                  ["dried", 4],
                  ["torch", 2],
                ]),
                r.pick([
                  ["stick", 5],
                  ["stone", 3],
                  ["blade", 1],
                ]),
              ]
            : [["stone", 4], r.chance(0.5) ? ["flint", 2] : ["blade", 1]];
        const text =
          spot.kind === "stash"
            ? "Under the boulder, someone has hidden a bundle wrapped in oiled cloth."
            : `You dig through the rubble of ${name}. Mostly stones. Not only stones.`;
        return {
          pages: [{ who: null, text }],
          effect: { loot, set: { searched: 1 } },
        };
      }
      case "bones": {
        const b1 = beastOne(people ? people.beast : "great beast");
        const pages = [
          {
            who: null,
            text: `The bones of ${wsAn(b1)} ${b1}, bleached white. It was bigger than a cart. Something bigger than it did this.`,
          },
        ];
        if (state.taken) return { pages };
        pages.push({
          who: null,
          text: "Some of the smaller bones have come loose. They are dry and hard and light.",
        });
        return { pages, effect: { loot: [["bone", 2]], set: { taken: 1 } } };
      }
      case "bigtree": {
        const pages = [
          {
            who: null,
            text: `${cap(name)}. Its trunk is wider than a house. The ${plural} say ${V.faith} planted it before there was anyone to see.`,
          },
        ];
        const effect = {
          note: note(`${cap(name)}: the ${plural} say ${V.faith} planted it.`),
          bless: "rooted",
        };
        if (!state.resin) {
          pages.push({
            who: null,
            text: "Golden resin weeps from an old split in the bark, thick as honey. You take some.",
          });
          Object.assign(effect, { loot: [["resin", 3]], set: { resin: 1 } });
        }
        return { pages, effect };
      }
      case "field": {
        const t =
          story.arc.kind === "sundered" || story.arc.kind === "haunted"
            ? story.arc.past
            : `Nobody you could ask remembers who fought here, or why. The blades still stand where they fell.`;
        return {
          pages: [
            {
              who: null,
              text: `Rusted blades stand in the grass of ${name}, dozens of them, leaning where the hands let go.`,
            },
            { who: null, text: t },
          ],
          effect: { note: note(t) },
        };
      }
      case "blade": {
        if (state["b" + spot.n]) return null;
        return {
          title: "An old blade",
          sub: "rusted through. You take it anyway, to remember",
          effect: { loot: [["oldblade", 1]], set: { ["b" + spot.n]: 1 } },
        };
      }
      // ---------- the wonders ----------
      case "starstone": {
        const pages = [
          {
            who: null,
            text: "Something fell out of the sky here. It lies where it landed, in a ring of earth it threw up around itself: a stone as big as a cart, black and smooth, as if it melted on the way down. Bright veins run through it, and they glow, faintly, even by day. It is warm. And out of the middle of it a pale light stands straight up into the sky, and does not waver.",
          },
        ];
        if (people)
          pages.push({
            who: null,
            text: `The ${plural} say it is a star that ${V.faith} threw down, and that it is still deciding whether to go back up.`,
          });
        const kept = seen(
          `${cap(name)}: a star that fell. Bright veins run through it, and it is warm.`,
        );
        if (state.taken && ctx.day - state.taken < 30)
          return {
            pages: pages.concat([
              {
                who: null,
                text: "Where you broke the star-iron out, the veins have gone dull. They are brightening again, very slowly.",
              },
            ]),
            effect: { bless: "starlit" },
          };
        if (!ctx.tool || !ctx.tool("hammer"))
          return {
            pages: pages.concat([
              {
                who: null,
                text: "Where a vein runs close to the surface, the stone looks as if it might give. With a hammer you could try.",
              },
            ]),
            effect: { note: kept, bless: "starlit" },
          };
        pages.push({
          who: null,
          text: "You strike it. Most of it will not even chip. But where a bright vein runs close to the surface, two pieces break away, heavier than any stone you have ever held: star-iron. They are still warm. A smith would want to see these.",
        });
        return {
          pages,
          effect: {
            bless: "starlit",
            loot: [["stariron", 2]],
            set: { taken: ctx.day || 1 },
            wear: "hammer",
            note: seen(
              `${cap(name)}: a star that fell. You broke star-iron out of it with a hammer. A smith might know what to do with it.`,
            ),
          },
        };
      }
      case "skull": {
        const plan = sitePlan(story, s);
        const pages = [
          {
            who: null,
            text: `The skull alone is bigger than a house.${plan.horns ? " Two horns sweep back from it, each longer than a tree is tall." : ""} Its eyes are holes you could stand up in. Behind it the ribs stand out of the ground, white as salt, one after another like the frame of a hall nobody finished. Whatever this was, it was the size of a hill when it lay down here, and it never got up.`,
          },
        ];
        pages.push({
          who: null,
          text: people
            ? `The ${plural} say it was the first beast ${V.faith} made, before the world was finished, and that it lay down here to sleep when the world was done. Nobody sleeps near it.`
            : "Nobody living knows what it was. Nothing like it walks the world now. You hope.",
        });
        const kept = seen(
          `${cap(name)}: the bones of something the size of a hill.`,
        );
        if (state.tooth) return { pages, effect: { note: kept } };
        pages.push({
          who: null,
          text: "One of its teeth has worked loose from the jaw. It is as long as your forearm and so heavy you need both hands. You take it.",
        });
        return {
          pages,
          effect: { loot: [["gianttooth", 1]], set: { tooth: 1 }, note: kept },
        };
      }
      case "geyser": {
        const pages = [
          {
            who: null,
            text: `The ground at ${name} is a crust of white and yellow stone, hollow underfoot, and everywhere it steams. Water boils in little pools. Every minute or two the big vent in the middle roars, and throws boiling water higher than a tower.`,
          },
        ];
        const kept = seen(
          `${cap(name)}: boiling water out of the ground. The steam cooks meat. Do not stand on the big vent.`,
        );
        const n = ctx.count ? Math.min(4, ctx.count("rawmeat")) : 0;
        if (n > 0) {
          pages.push({
            who: null,
            text: `You hang ${n > 1 ? "your raw meat" : "the raw meat"} on a stick in the steam at the edge of a vent. In a little while it is cooked through, and smells of eggs and stone.`,
          });
          return {
            pages,
            effect: {
              take: [["rawmeat", n]],
              loot: [["roastmeat", n]],
              note: kept,
            },
          };
        }
        pages.push({
          who: null,
          text: "The steam is hot enough to cook in, if you had anything to cook. And whatever you do, do not stand on the big vent.",
        });
        return { pages, effect: { note: kept } };
      }
      case "stonetree": {
        const pages = [
          {
            who: null,
            text: "Trees, standing and fallen, and all of them stone. Every ring of the wood is still there, every crack in the bark and every knot, turned to stone: red and grey and amber, cold and heavy. Whatever forest grew here, it grew a very long time ago.",
          },
        ];
        pages.push({
          who: null,
          text: people
            ? `The ${plural} say ${V.faith} turned these trees to stone, for some old wrong nobody remembers. They will not cut wood within sight of them.`
            : "Nothing grows here now but grass and wind.",
        });
        const kept = seen(`${cap(name)}: a forest turned to stone, long ago.`);
        if (state.piece) return { pages, effect: { note: kept } };
        pages.push({
          who: null,
          text: "A piece has broken from a fallen trunk, the size of your hand, with the grain of the wood in it like the lines on your palm. You keep it.",
        });
        return {
          pages,
          effect: { loot: [["stonewood", 1]], set: { piece: 1 }, note: kept },
        };
      }
      case "bed":
        return { effect: { sleep: true } };
      case "climb":
        return { effect: { climb: true } };
      case "view":
        return { effect: { view: true } };
    }
    return null;
  }
  // ---------- the dead who rise: what they were called ----------
