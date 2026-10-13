// index-inline-2 141 — label
// Lines 67489-67809 of readable/index-inline-2.pretty.js (statement-aligned).
  function tradeAct(kind, i) {
    const T = G.trade,
      pk = G.pack;
    if (!T) return;
    if (T.mode === "trade") {
      if (kind === "buy") {
        const o = T.stock[i];
        if (!o) return;
        if (ITEMS[o.id] && ITEMS[o.id].kind === "beast") {
          buyBeast(o, T);
          tradeUI.render();
          return;
        }
        if (pk.coins < o.price) {
          tradeUI.say(
            `That is ${coinWords(o.price)}. You have ${pk.coins ? coinWords(pk.coins) : "nothing in your purse"}.`,
          );
          return;
        }
        if (pk.room(o.id) < o.n) {
          tradeUI.say("No room for it in your satchel.");
          return;
        }
        pk.take("oldcoin", o.price);
        const left = pk.add(o.id, o.n);
        if (left) ground.addDrop(o.id, left, frontSpot(0.8));
        tradeUI.say(
          `You buy ${countWords(o.id, o.n)} for ${coinWords(o.price)}.`,
        );
        sfx.play("coin");
        repGain(T.town, o.price / 6, "trade");
        if (pk.fresh.length) setTimeout(() => noteFresh(), 600);
      } else if (kind === "sell" || kind === "sellall") {
        const sl = pk.slots[i];
        if (!sl || !sellable(sl.id)) return;
        const n = kind === "sell" ? 1 : sl.n,
          price = T.sell ? T.sell(sl, n) : sellPrice(sl, n);
        if (price < 1) {
          tradeUI.say("Not worth a coin.");
          return;
        }
        const gone = pk.takeSlot(i, n);
        pk.add("oldcoin", price);
        const what =
          gone.n > 1
            ? `${gone.n} ${lowerName(gone.id, gone.n)}`
            : gone.worn
              ? `a ${itemName(gone.id, 1, true).toLowerCase()}`
              : countWords(gone.id, 1);
        tradeUI.say(`You sell ${what} for ${coinWords(price)}.`);
        sfx.play("coin");
        repGain(T.town, price / 3, "trade");
      }
    } else if (T.mode === "chest") chestAct(kind, i);
    else if (T.mode === "stall") stallAct(kind, i);
    tradeUI.render();
  }

  // ---- a house of your own: the house-wright, the deed, the house itself ----
  const WALL_WORD = {
    coral: "coral-stone",
    white: "whitewashed",
    mud: "mud-brick",
    sandstone: "sandstone",
    plank: "plank",
    hide: "hide",
    stone: "stone",
    darkstone: "dark stone",
    log: "log",
    frame: "timber-framed",
    basalt: "basalt",
  };
  const ROOF_WORD = {
    thatch: "thatch",
    tile: "red tiles",
    slate: "slate",
    shingle: "shingles",
    turf: "turf",
    dome: "a dome",
    hide: "hides",
    ember: "dark red tiles",
  };
  // "the way the reef-singers build: coral-stone walls, domed"
  function styleWords(owner) {
    const story = state.story,
      people = owner >= 0 ? story.peoples[owner] : null,
      st = peopleStyle(story, people);
    const who = people
      ? `the way the ${people.plural} build`
      : "the way people build out here";
    const roof =
      st.roofKind === "dome"
        ? "domed"
        : st.roofKind === "flat"
          ? `flat-roofed with ${ROOF_WORD[st.roofMat] || "turf"}`
          : `roofed with ${ROOF_WORD[st.roofMat] || "thatch"}`;
    return `${who}: ${WALL_WORD[st.wallKind] || "plank"} walls, ${roof}${st.round >= 0.5 ? ", the smaller ones round" : ""}`;
  }
  function deedWords(s) {
    if (!s || !SIZE_OF_DEED[s.id]) return "";
    return `Built ${styleWords(s.tag ?? -1)}.`;
  }
  // a house-wright's prices: about the same anywhere, a little more in some towns than others
  const deedPrice = (size, town) =>
    Math.round(
      HOME_SIZE[size].price * (0.92 + hash01(town ? town.id : 1, 5, 11) * 0.16),
    );
  function wrightTalk(p, withDoing) {
    const f = p.info,
      who = f.name,
      town = p.host && p.host.s,
      owner = hostOwner(p.host);
    const price = (k) => deedPrice(k, town);
    const n = G.talks.get("w" + (town ? town.id : 0)) || 0;
    G.talks.set("w" + (town ? town.id : 0), n + 1);
    const homes = (G.world.homes || []).length;
    const choices = HOME_KINDS.map((k, i) => ({
      id: "deed:" + k,
      label: `A ${HOME_SIZE[k].word} · ${coinWords(price(k))}`,
      primary: i === 0 && !homes && G.pack.coins >= price(k),
    })).concat([
      {
        id: "yard",
        label: "For a house you have: round it, into it, bigger",
        primary: !!homes,
      },
      { id: "no", label: "Not now" },
    ]);
    const pages = n
      ? [
          {
            who,
            text: `"Back again. Still wanting a roof of your own? A hut is ${coinWords(price("hut"))}, a house ${coinWords(price("house"))}, a hall ${coinWords(price("hall"))}."`,
            choices,
          },
        ]
      : [
          {
            who,
            text: `"A roof of your own? That I can do. I build ${styleWords(owner)}."`,
          },
          {
            who,
            text: '"Pay me and I give you the deed. Take it wherever you like, out past the edge of town, on dry flat ground and clear of the roads, and put it down. My crew follows the deed. You will not wait long."',
          },
          {
            who,
            text: `"A hut is ${coinWords(price("hut"))}: one room, a hearth, a bed and a chest. A house is ${coinWords(price("house"))}, with room to spare. A hall is ${coinWords(price("hall"))}, and you will want for nothing."`,
          },
          {
            who,
            text: `"And once you have a door of your own: a stall beside it, and someone honest to keep it (whatever you put out sells while you are away); a field dug and fenced behind it, for whatever you want to grow; a pen with a shed and a hen house, for whatever you want to keep. Inside, an oven, a bench and an anvil, a loom."`,
            choices,
          },
        ];
    // building on: a hut of yours into a house, a house into a hall (as you have them), and a porch
    const has = (sz) => (G.world.homes || []).some((h) => h.size === sz);
    const grow = has("hut") ? "tohouse" : has("house") ? "tohall" : null;
    const GROW_WORD = {
      tohouse: "Make your hut a house",
      tohall: "Make your house a hall",
    };
    const YARD_PRICE = {
      stall: STALL_PRICE,
      field: FIELD_PRICE,
      pen: PEN_PRICE,
      porch: PORCH_PRICE,
      tohouse: growPrice("tohouse", town),
      tohall: growPrice("tohall", town),
      ...WORK_PRICE,
      ...OUT_PRICE,
    };
    const outDeeds = () => [
      {
        id: "deed:stall",
        label: `A stall by your door · ${coinWords(STALL_PRICE)}`,
        primary: !!homes && G.pack.coins >= STALL_PRICE,
      },
      {
        id: "deed:porch",
        label: `A porch along the front · ${coinWords(PORCH_PRICE)}`,
      },
      {
        id: "deed:well",
        label: `A well, stone-lined · ${coinWords(OUT_PRICE.well)}`,
      },
      {
        id: "deed:palisade",
        label: `A palisade round it all · ${coinWords(OUT_PRICE.palisade)}`,
      },
      { id: "no", label: "Not now" },
    ];
    const keepDeeds = () => [
      {
        id: "deed:field",
        label: `A field, dug and fenced · ${coinWords(FIELD_PRICE)}`,
        primary: true,
      },
      { id: "deed:pen", label: `A pen for animals · ${coinWords(PEN_PRICE)}` },
      {
        id: "deed:hives",
        label: `Hives, and the bees in them · ${coinWords(OUT_PRICE.hives)}`,
      },
      {
        id: "deed:stable",
        label: `A stable, and a beast to ride · ${coinWords(OUT_PRICE.stable)}`,
      },
      { id: "no", label: "Not now" },
    ];
    // built in: only what one of your houses still has room for
    const fits = (k) =>
      (G.world.homes || []).some(
        (h) =>
          !(h.work || []).includes(k) &&
          workRoom(h.size, homeIsRound(h), h.work || [], k),
      );
    const inDeeds = () =>
      WORK_KINDS.filter(fits)
        .map((k, i) => ({
          id: "deed:" + k,
          label: `${cap(WORK_WORD[k])} · ${coinWords(WORK_PRICE[k])}`,
          primary: i === 0,
        }))
        .concat([{ id: "no", label: "Not now" }]);
    const later = (pg) =>
      setTimeout(() => openDialog(pg, { noChronicle: true, onClose: done }), 0);
    const done = (c) => {
      ground.talkTo = null;
      if (c === "yard") {
        later([
          {
            who,
            text: `"For a house of yours I can put things round it: a stall by the door, a porch, a well, a palisade round the lot. Things to grow and keep: a field, a pen, hives, a stable and a beast for it. Or I can build things into it: an oven, a bench and an anvil, a loom.${grow ? ` Or I can build on: ${grow === "tohouse" ? "your hut into a house" : "your house into a hall"}, where it stands, for ${coinWords(growPrice(grow, town))}. Everything inside stays yours.` : ""}"`,
            choices: [
              { id: "out", label: "Round the house", primary: true },
              { id: "keep", label: "To grow and to keep" },
              { id: "in", label: "Built into it" },
            ].concat(
              grow
                ? [
                    {
                      id: "deed:" + grow,
                      label: `${GROW_WORD[grow]} · ${coinWords(growPrice(grow, town))}`,
                    },
                  ]
                : [],
              [{ id: "no", label: "Not now" }],
            ),
          },
        ]);
        return;
      }
      if (c === "out") {
        later([
          {
            who,
            text: `"A stall is ${coinWords(STALL_PRICE)}. A porch, ${coinWords(PORCH_PRICE)}. A well, ${coinWords(OUT_PRICE.well)}: cold water, and a field by it grows the faster for it. A palisade, ${coinWords(OUT_PRICE.palisade)}: there have been raiders coming off the roads at night, out past the towns. Stakes and a gate, and they go elsewhere."`,
            choices: outDeeds(),
          },
        ]);
        return;
      }
      if (c === "keep") {
        later([
          {
            who,
            text: `"A field is ${coinWords(FIELD_PRICE)}: grow grain in it, or turnips, or herbs. A pen is ${coinWords(PEN_PRICE)}: the farmers sell hens and goats and sheep to keep in it. Hives, ${coinWords(OUT_PRICE.hives)}, and the bees come with them. A stable, ${coinWords(OUT_PRICE.stable)}, with a beast in it to ride, bought from the herders for you."`,
            choices: keepDeeds(),
          },
        ]);
        return;
      }
      if (c === "in") {
        const can = WORK_KINDS.filter(fits);
        const text = `"An oven is ${coinWords(WORK_PRICE.oven)}: bread in it, and pies, and waybread for the road. A bench and an anvil, ${coinWords(WORK_PRICE.forge)}: make your tools there and mend them, and beat copper out of ore, if you bring charcoal for the fire. A loom, ${coinWords(WORK_PRICE.loom)}: your wool into cloth, and the cloth into cloaks. A hut has room for two of them; a house or a hall for all three."`;
        later([
          {
            who,
            text: can.length
              ? text
              : '"Every house of yours has all it has room for. A hut takes two of them, an oven, a bench, a loom; a house or a hall all three. Build on, and there is room for more."',
            choices: can.length ? inDeeds() : null,
          },
        ]);
        return;
      }
      if (c && String(c).startsWith("deed:")) {
        const k = String(c).slice(5);
        buyDeed(who, k, YARD_PRICE[k] ?? price(k), owner);
      }
    };
    openDialog(withDoing(pages), { noChronicle: true, onClose: done });
  }
  // a porch, and building on: the difference between what the house is and what it becomes, and a little for the trouble
  const PORCH_PRICE = 18;
  const growPrice = (k, town) =>
    Math.round(
      (deedPrice(k === "tohouse" ? "house" : "hall", town) -
        deedPrice(k === "tohouse" ? "hut" : "house", town)) *
        1.1,
    );
  // built into a house: an oven, a bench and an anvil, a loom
  const WORK_PRICE = { oven: 24, forge: 38, loom: 18 };
  // round it: a well, hives, a stable with a beast in it, a palisade
  const OUT_PRICE = { well: 20, hives: 16, stable: 70, palisade: 55 };
  const OUT_DEED = {
    well: "deedwell",
    hives: "deedhives",
    stable: "deedstable",
    palisade: "deedpalisade",
  };
  const WORK_DEED = { oven: "deedoven", forge: "deedforge", loom: "deedloom" };
  // is a house of yours round (its people build round)?
  const homeIsRound = (rec) =>
    homeRound(
      rec.size,
      peopleStyle(
        state.story,
        rec.owner >= 0 ? state.story.peoples[rec.owner] : null,
      ),
    );
