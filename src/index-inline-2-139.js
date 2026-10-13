// index-inline-2 139 — ore
// Lines 66811-67153 of readable/index-inline-2.pretty.js (statement-aligned).
  function rideTo(o, m, keeper) {
    const cost = o.cost ?? rideCost(o.km);
    const paid = payCoins(cost);
    if (!paid) {
      openDialog(
        [
          {
            who: keeper,
            text: `"That is ${cost} old coins to ${o.name}. You have not got it. Old coin, mind; the kind they bury the dead with. A crystal or an amulet will do in place of some."`,
          },
        ],
        { noChronicle: true },
      );
      return;
    }
    gotNote(`- ${listWords(paid)}`);
    sfx.play("coin");
    const days = Math.max(0.1, o.km / m.kmDay);
    let nightN = 0,
      dayN = 0;
    saveLife();
    ground.startJourney(
      o.t,
      days,
      () => {
        G.known.add(o.t.id);
        if (!o.t.type) G.visited.add(o.t.id);
        gToast(
          o.name,
          days >= 1 ? `${dayWords(days)} in the saddle` : "later that day",
          3000,
        );
        setTimeout(() => gotNote(`The ${m.name} turns for home`), 2200);
        saveLife();
      },
      (stop) => {
        if (stop.last) return;
        if (stop.camp)
          gToast(
            days < 1 ? "Night" : `Night ${++nightN}`,
            `camped on the road to ${o.name}`,
            2200,
          );
        else
          gToast(
            days < 1 ? "On the road" : `Day ${++dayN}`,
            `riding to ${o.name}`,
            2200,
          );
      },
      { mount: m, edge: o.edge },
    );
  }
  // ---- the smith: ore (and old coin) into copper you can carry ----
  const FORGE = [
    { id: "starblade", ore: 0, coin: 6, star: 2 },
    { id: "copperknife", ore: 2, coin: 0 },
    { id: "copperspear", ore: 3, coin: 1 },
    { id: "copperaxe", ore: 4, coin: 2 },
    { id: "copperhelm", ore: 3, coin: 1, leather: 1 },
    { id: "copperscale", ore: 6, coin: 3, leather: 2 },
  ];
  function smithTalk(p, withDoing) {
    const who = p.info.name,
      ore = G.pack.count("ore"),
      coin = G.pack.count("oldcoin"),
      leather = G.pack.count("leather"),
      star = G.pack.count("stariron");
    const hooks = {
      noChronicle: true,
      onClose: (choice) => {
        ground.talkTo = null;
        if (choice && String(choice).startsWith("forge:"))
          forgeFor(p, String(choice).slice(6));
      },
    };
    const price = (f) =>
      [
        f.star ? `${f.star} star-iron` : "",
        f.ore ? `${f.ore} ore` : "",
        f.coin ? `${f.coin} old coin${f.coin > 1 ? "s" : ""}` : "",
        f.leather ? `${f.leather} leather` : "",
      ]
        .filter(Boolean)
        .join(", ");
    // star-iron: no smith alive has worked it, and every one of them has wanted to
    const starLine = !star
      ? null
      : star < 2
        ? '"Is that... star-iron? One piece. Bring me another, and six old coins for the charcoal, and I will make you a blade nobody has ever seen."'
        : coin < 6
          ? '"Star-iron! Two pieces of it. That would make a blade like nothing else in the world. But it wants a fire hotter than copper ever did: bring six old coins for the charcoal."'
          : '"And that... is that star-iron? I have heard of it. I never thought to hold it. Two pieces will make a blade like nothing else in the world. Six old coins for the charcoal: it wants a fire hotter than any copper does."';
    if (!ore && !star) {
      openDialog(
        withDoing([
          {
            who,
            text: '"Copper? Not a scrap to spare. Bring me ore from the hills: green-streaked rock, heavy for its size. Then I can make you something worth carrying."',
          },
          {
            who,
            text: `"Caves are the place for it. A knife takes two lumps. A spear, three and a coin. An axe, four and two coins. ${coin ? "Old coin will do. I will not ask where you found it." : "Old coin, mind. The kind they buried people with."}"`,
          },
          {
            who,
            text: '"Bring leather as well and I can make you something to keep the teeth out: a copper helm, or a shirt of copper scales if you have the ore for it."',
          },
        ]),
        hooks,
      );
      return;
    }
    const can = FORGE.filter(
      (f) =>
        ore >= f.ore &&
        coin >= f.coin &&
        leather >= (f.leather || 0) &&
        star >= (f.star || 0),
    );
    if (!can.length) {
      const pages = [];
      if (ore)
        pages.push({
          who,
          text: `"${ore} lump${ore > 1 ? "s" : ""} of ore. Not enough to make anything worth the fire. Two for a knife, at least."`,
        });
      if (starLine) pages.push({ who, text: starLine });
      openDialog(withDoing(pages), hooks);
      return;
    }
    const choices = can
      .map((f, i) => ({
        id: "forge:" + f.id,
        label: `${itemName(f.id)} (${price(f)})`,
        primary: f.star
          ? true
          : i === can.length - 1 && !can.some((q) => q.star),
      }))
      .concat([{ id: "no", label: "Not now" }]);
    const pages = [];
    if (starLine) pages.push({ who, text: starLine });
    pages.push({
      who,
      text: ore
        ? `"Ore! Let me see. ${ore >= 4 ? "Good weight to it." : "Not much, but it will do."} What shall I make you?"`
        : '"What shall I make you?"',
      choices,
    });
    openDialog(withDoing(pages), hooks);
  }
  function forgeFor(p, id) {
    const f = FORGE.find((q) => q.id === id);
    if (
      !f ||
      G.pack.count("ore") < f.ore ||
      G.pack.count("oldcoin") < f.coin ||
      G.pack.count("leather") < (f.leather || 0) ||
      G.pack.count("stariron") < (f.star || 0)
    )
      return;
    if (f.ore) G.pack.take("ore", f.ore);
    if (f.coin) G.pack.take("oldcoin", f.coin);
    if (f.leather) G.pack.take("leather", f.leather);
    if (f.star) G.pack.take("stariron", f.star);
    // the best part of an hour at the forge (star-iron takes the afternoon)
    ground.t += (f.star ? 3 : 0.8) / DAY_HOURS;
    const left = G.pack.add(id, 1);
    if (left) ground.addDrop(id, left, frontSpot(0.8));
    dropSpill(G.pack.takeSpill());
    if (f.star) {
      sfx.play("wonder");
      G.deeds = (G.deeds || [])
        .concat([
          { text: "had a blade forged from a fallen star", day: dayNum() },
        ])
        .slice(-12);
      openDialog(
        [
          {
            who: null,
            text: `${p.info.name} builds the fire up until it roars white, and works the star-iron all afternoon. Every blow rings like a bell. When the blade goes into the tub at last, the water does not hiss: it sings.`,
          },
          {
            who: p.info.name,
            text: '"I have never made anything like it. I never will again. Take it, before I change my mind."',
          },
          {
            who: null,
            text: `You get ${countWords(id, 1)}.${left ? " (Your hands are full; it is on the ground.)" : ""}`,
          },
        ],
        { noChronicle: true },
      );
      if (G.pack.fresh.length) setTimeout(() => noteFresh(), 1500);
      saveLife();
      return;
    }
    openDialog(
      [
        {
          who: null,
          text: `${p.info.name} works the ore in the fire, hammers it, quenches it hissing in the tub, and works it again. It takes the best part of an hour.`,
        },
        {
          who: p.info.name,
          text: `"There. ${itemName(id)}. ${id === "copperspear" ? "Keep the point up." : ITEMS[id].armor ? "Better it takes the knocks than you." : "Mind the edge."}"`,
        },
        {
          who: null,
          text: `You get ${countWords(id, 1)}.${left ? " (Your hands are full; it is on the ground.)" : ""}`,
        },
      ],
      { noChronicle: true },
    );
    if (G.pack.fresh.length) setTimeout(() => noteFresh(), 1500);
    saveLife();
  }
  // ---- buying and selling: traders at their stalls, innkeepers and tavern keepers ----
  const isTrader = (role) =>
    /trader|merchant|seller|pedlar/.test(String(role || "")) ||
    role === "innkeeper" ||
    role === "tavern keeper" ||
    !!ROLE_GOODS[role];
  // what the people of the newer places sell: the miller bread and flour, the fisher fish and a line to catch your own,
  // the miners ore, the lightkeeper oil for a torch
  const ROLE_GOODS = {
    miller: [
      ["bread", 2],
      ["flour", 3],
      ["grain", 6],
    ],
    fisher: [
      ["fish", 3],
      ["smokedfish", 3],
      ["fishline", 1],
      ["salt", 2],
    ],
    "net-mender": [
      ["smokedfish", 2],
      ["fishline", 1],
      ["cord", 5],
    ],
    "mine foreman": [
      ["ore", 2],
      ["crystal", 1],
      ["pitchtorch", 1],
      ["torch", 2],
    ],
    // on market day
    "fruit seller": [
      ["berries", 6],
      ["dried", 4],
      ["mushroom", 4],
    ],
    baker: [
      ["bread", 4],
      ["flour", 2],
    ],
    "cloth seller": [
      ["cloak", 1],
      ["woolcloak", 1],
      ["cord", 6],
      ["sack", 1],
      ["wool", 4],
    ],
    potter: [
      ["salt", 3],
      ["saltcap", 3],
      ["basket", 1],
    ],
    bowyer: [
      ["bow", 1],
      ["arrow", 12],
      ["obarrow", 6],
    ],
    tinker: [
      ["knife", 1],
      ["hammer", 1],
      ["axe", 1],
      ["needle", 2],
      ["torch", 2],
    ],
    herbwife: [
      ["herbs", 4],
      ["poultice", 2],
      ["dr_mend", 1],
    ],
    butcher: [
      ["rawmeat", 3],
      ["roastmeat", 2],
      ["hide", 2],
      ["leather", 1],
    ],
    // a caravan from far away: things nobody here makes (each one's own pick of them)
    "caravan trader": [],
    "caravan master": [],
  };
  // out at the farms and the herders' camps (and on market day, in from them): eggs, grain, turnips to sow,
  // and hens, goats and sheep for a pen of yours (the beasts go straight to the pen, never into your satchel)
  const FARM_GOODS = {
    farmer: [
      ["hen", 1],
      ["goat", 1],
      ["sheep", 1],
      ["grain", 8],
      ["turnip", 4],
      ["egg", 4],
    ],
    farmhand: [
      ["hen", 1],
      ["grain", 6],
      ["turnip", 4],
      ["egg", 3],
    ],
    herder: [
      ["goat", 1],
      ["sheep", 1],
      ["milk", 2],
      ["cheese", 2],
      ["wool", 4],
    ],
    "herd-singer": [
      ["goat", 1],
      ["sheep", 1],
      ["milk", 2],
      ["cheese", 2],
      ["wool", 4],
    ],
    shepherd: [
      ["sheep", 1],
      ["wool", 6],
      ["cheese", 2],
      ["milk", 2],
    ],
  };
  const farmSells = (p) =>
    !!(
      p &&
      p.info &&
      FARM_GOODS[p.info.role] &&
      (p.info.tag === "farm" || (p.host && p.host.site && !p.host.s))
    );
