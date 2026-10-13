// index-inline-2 82 — story
// Lines 33980-34302 of readable/index-inline-2.pretty.js (statement-aligned).
  function taleOffer(story, ix, s, t) {
    const g = t.giver.name,
      B = t.target ? ix.get(t.target) : null;
    const way = B ? wayWords(ix, s.dir, B, story) : null;
    const where = B ? siteName(story, B) : "";
    const pages = [];
    if (t.kind === "lost") {
      pages.push({
        who: g,
        text: `"My ${t.rel}, ${t.lost}, went up to ${where} ${t.days} days ago, ${t.why}. ${tlCap(t.he)} should have been back the next morning."`,
      });
      pages.push({
        who: g,
        text: `"${way.text} I can’t leave the ${s.kind === "inn" ? "inn" : "animals"}. Would you look for ${t.him}?"`,
      });
    } else if (t.kind === "fetch") {
      pages.push({
        who: g,
        text: `"${t.why} I need ${countWords(t.need[0], t.need[1])}, and I haven’t the hands for it. Could you bring them?"`,
      });
    } else if (t.kind === "deliver") {
      pages.push({
        who: g,
        text: `"Are you going anywhere near ${where}? Would you take ${t.thing} to ${t.to} there?"`,
      });
      pages.push({
        who: g,
        text: `"${way.text} ${t.to} will be glad of it. Tell them it’s from ${g.split(" ")[0]}."`,
      });
    } else if (t.kind === "offer") {
      const grave = B && B.kind === "grave";
      pages.push({
        who: g,
        text: grave
          ? `"My ${t.rel} is buried out at ${where}. I promised I’d leave ${t.thing} on ${t.his} grave this year, and my legs won’t take me."`
          : `"I made a promise to leave ${t.thing} at ${where}, for my ${t.rel}. I can’t make the walk any more."`,
      });
      pages.push({
        who: g,
        text: `"${way.text} Would you leave it there for me?"`,
      });
    } else if (t.kind === "recover") {
      pages.push({
        who: g,
        text: `"There’s ${t.thing} lying out at ${where}. It was dropped there, running from something, and nobody’s been brave enough to go back for it."`,
      });
      pages.push({
        who: g,
        text: `"${way.text} Bring it back and I’ll make it worth the walk."`,
      });
    }
    pages[pages.length - 1].choices = [
      { id: "accept", label: "I’ll do it", primary: true },
      { id: "decline", label: "Not now" },
    ];
    const dd = way ? ` (${way.dirDist} from ${siteName(story, s)})` : "";
    const note =
      t.kind === "lost"
        ? `${g} at ${siteName(story, s)} asked you to look for ${t.his} ${t.rel}, ${t.lost}, at ${where}${dd}.`
        : t.kind === "fetch"
          ? `${g} at ${siteName(story, s)} needs ${countWords(t.need[0], t.need[1])}.`
          : t.kind === "deliver"
            ? `Take ${t.thing} from ${g} to ${t.to} at ${where}${dd}.`
            : t.kind === "offer"
              ? `Leave ${t.thing} at ${where} for ${g} of ${siteName(story, s)}${dd}.`
              : `Bring ${t.thing.replace(/^my /, `${g.split(" ")[0]}’s `).replace(/^our /, `${g.split(" ")[0]}’s `)} back from ${where} to ${siteName(story, s)}${dd}.`;
    return { pages, note };
  }
  // reminders while it is not done
  function taleRemind(story, ix, s, t) {
    const g = t.giver.name,
      B = t.target ? ix.get(t.target) : null,
      where = B ? siteName(story, B) : "";
    const lines = {
      lost: `"Any sign of ${t.him}? ${where}, ${B ? wayWords(ix, s.dir, B, story).short.replace(/^[^:]*: /, "") : ""}"`,
      fetch: `"Still need ${countWords(t.need[0], t.need[1])}, if you come by any."`,
      deliver: `"${t.to} at ${where}. Don’t forget, will you?"`,
      offer: `"Did you go to ${where} yet? No hurry. The dead are patient."`,
      recover: `"Did you find it? At ${where}. Don’t let anything scare you off."`,
    };
    return [{ who: g, text: lines[t.kind] }];
  }
  // the lost one, found
  function lostFound(story, ix, s, t, hasFood) {
    const A = ix.get(t.site),
      from = A ? siteName(story, A) : "home";
    if (!hasFood)
      return [
        {
          who: t.lost,
          text: `"You came from ${from}? ${t.giver.name.split(" ")[0]} sent you? Oh, thank everything."`,
        },
        {
          who: t.lost,
          text: '"I turned my ankle on the stones and I haven’t eaten in days. I can’t walk like this. Have you got anything to eat? Anything at all?"',
        },
      ];
    return [
      {
        who: t.lost,
        text: `"You came from ${from}? ${t.giver.name.split(" ")[0]} sent you? Oh, thank everything."`,
      },
      {
        who: null,
        text: "You give them something to eat. They eat it in three bites, and some colour comes back into their face.",
      },
      {
        who: t.lost,
        text: `"I can walk now, slowly. Go ahead and tell ${t.giver.name.split(" ")[0]} I’m coming. And thank you."`,
      },
    ];
  }
  // coming back with it done
  function taleThanks(story, ix, s, t, rw = t.reward) {
    const g = t.giver.name,
      pages = [];
    if (t.kind === "lost")
      pages.push({
        who: g,
        text: `"You found ${t.him}! ${tlCap(t.he)} came limping in, starving and sorry for ${t.him}self. I don’t know how to thank you. Well. I know one way."`,
      });
    else if (t.kind === "fetch")
      pages.push({
        who: g,
        text: `"${tlCap(countWords(t.need[0], t.need[1]))}! You’re a better neighbour than my neighbours."`,
      });
    else if (t.kind === "offer")
      pages.push({
        who: g,
        text: '"You left it there? Then the promise is kept. That weighs more than you’d think."',
      });
    else if (t.kind === "recover")
      pages.push({
        who: g,
        text: `"${tlCap(t.thing)}! I never thought I’d hold it again."`,
      });
    if (rw.line) pages.push({ who: g, text: `"${rw.line}"` });
    else
      pages.push({
        who: g,
        text: '"Here. It isn’t much, but it’s what I have, and I want you to have it."',
      });
    return pages;
  }
  // the one you carried it to
  function deliverThanks(story, ix, t) {
    return [
      {
        who: t.to,
        text: `"From ${t.giver.name.split(" ")[0]}? ${tlCap(t.thing)}! And carried all this way by a stranger."`,
      },
      {
        who: t.to,
        text: '"Wait, wait. You can’t walk off with nothing. Here."',
      },
    ];
  }
  // the one who asked: a place's lost person, when they are out there or home again
  function lostLook(story, s, t) {
    return { name: t.lost, seed: hashInt(s.seed, 55, 5) };
  }
  function tlDist(a, b, R) {
    return tlAng(a, b) * R;
  }

  // ---- game/quests.js ----
  // ============================================================
  // QUESTS — what this world needs, made into things you can do. Each of the
  // story's three needs is kept by somebody in a town: the town nearest to
  // where the need lies. Some know where a relic was buried, and with whom
  // (the dead keep it); some will give what is needed, or tell it, or do
  // it, for a price; some ask you to keep a vigil through a night at a place
  // near their town, whatever comes. Who and where is fixed by the world's
  // seed; only how far you have got is kept in your save.
  // ============================================================

  const qCap = (t) => t.charAt(0).toUpperCase() + t.slice(1);
  const qLow = (t) => t.charAt(0).toLowerCase() + t.slice(1);
  const qAn = (w) => (/^[aeiou]/i.test(w) ? "an" : "a");
  const qAng = (a, b) =>
    Math.atan2(
      Math.hypot(
        a[1] * b[2] - a[2] * b[1],
        a[2] * b[0] - a[0] * b[2],
        a[0] * b[1] - a[1] * b[0],
      ),
      a[0] * b[0] + a[1] * b[1] + a[2] * b[2],
    );
  // a price as words: "6 salt and 12 old coins"
  function priceWords(price) {
    if (price === "stories")
      return "twelve true things you have learned on the road";
    const w = price.map(([id, n]) => countWords(id, n));
    return w.length > 1
      ? `${w.slice(0, -1).join(", ")} and ${w[w.length - 1]}`
      : w[0];
  }
  // what a keeper asks, by what they are; a fire-keeper by what their people have
  const PRICE_BY_ROLE = {
    elder: [
      ["amulet", 1],
      ["oldcoin", 15],
    ],
    "map-seller": [["oldcoin", 30]],
    archivist: [["oldcoin", 25]],
    jailer: [["oldcoin", 30]],
    diver: [
      ["oldcoin", 15],
      ["dried", 6],
    ],
    singer: [
      ["leather", 2],
      ["oldcoin", 10],
    ],
    "keeper of the halls": [
      ["ore", 5],
      ["oldcoin", 10],
    ],
    heir: [["amulet", 1]],
    "forge-master": "stories",
  };
  const PRICE_BY_ARCH = {
    reef: [
      ["salt", 6],
      ["oldcoin", 12],
    ],
    salt: [
      ["salt", 8],
      ["oldcoin", 10],
    ],
    canopy: [
      ["herbs", 6],
      ["resin", 4],
    ],
    stone: [
      ["ore", 6],
      ["oldcoin", 10],
    ],
    frost: [
      ["hide", 4],
      ["oldcoin", 10],
    ],
    grass: [
      ["leather", 3],
      ["hide", 2],
    ],
    wood: [
      ["charcoal", 8],
      ["oldcoin", 10],
    ],
    ash: [
      ["obsidian", 4],
      ["oldcoin", 10],
    ],
    isle: [
      ["dried", 8],
      ["cord", 10],
    ],
  };

  // The three needs as quests: the town each is kept in, who keeps it, and what they will ask.
  function storyQuests(story) {
    if (story._quests) return story._quests;
    const arc = story.arc,
      S = story.settlements;
    story._quests = (arc.needs || []).map((n, i) => {
      const rng = new Rng(hashInt(story.seedHash ?? 1, 307 + i, 0x9e57));
      const at = n.at && n.at.dir ? n.at : null;
      // the town nearest where it lies (the town itself, if it lies in one)
      let town = at && at.type && S.includes(at) ? at : null;
      if (!town) {
        let best = null;
        for (const s of S) {
          const a = at ? qAng(s.dir, at.dir) : s.id;
          if (!best || a < best.a) best = { s, a };
        }
        town = best ? best.s : null;
      }
      const people = town && town.owner >= 0 ? story.peoples[town.owner] : null;
      const role = n.role || "elder";
      const name =
        n.giver ||
        (
          (people && people.lang) ||
          story.old || { person: () => "Aru" }
        ).person(rng);
      let price = null;
      if ((n.qk || "price") === "price")
        price =
          role === "fire-keeper"
            ? PRICE_BY_ARCH[people ? people.arch : "isle"] || PRICE_BY_ARCH.isle
            : PRICE_BY_ROLE[role] ||
              PRICE_BY_ARCH[people ? people.arch : "isle"] ||
              PRICE_BY_ARCH.isle;
      return {
        i,
        id: "Q" + i,
        title: n.title,
        text: n.text,
        kind: n.qk || "price",
        role,
        at,
        town,
        price,
        giver: { name, role, seed: hashInt(town ? town.id : 0, 900 + i, 77) },
        placeName: at ? at.name : town ? town.name : "the far country",
      };
    });
    return story._quests;
  }
  // the keepers who live in a town (for its plan: where they stand, how they look)
  function questGiversIn(story, townId) {
    return storyQuests(story).filter((q) => q.town && q.town.id === townId);
  }

  // ---------- what gets said ----------
  // what someone anywhere might tell you of one of the needs, and where to go for it
  function questRumor(story, q, way, here = false) {
    const g = q.giver;
    return `"${qCap(q.title)}? There is ${qAn(g.role)} ${g.role} ${here ? "here" : `in ${q.town.name}`}, ${g.name}, who knows about that. ${way}"`;
  }
  // the keeper, the first time and after. st: what you have done so far ('heard', 'met', 'done');
  // ctx: { has(price) → bool, place: { name, way } (the cave or the place of the vigil), notes: n }
