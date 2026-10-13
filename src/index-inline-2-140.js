// index-inline-2 140 — host
// Lines 67154-67488 of readable/index-inline-2.pretty.js (statement-aligned).
  const CARAVAN_GOODS = [
    ["crystal", 1],
    ["obsidian", 3],
    ["salt", 4],
    ["wool", 6],
    ["resin", 3],
    ["ore", 3],
    ["dr_road", 1],
    ["dr_owl", 1],
    ["dr_hearth", 1],
    ["copperknife", 1],
    ["copperhelm", 1],
    ["pack", 1],
    ["woolcloak", 1],
    ["obarrow", 8],
    ["smokedfish", 4],
    ["jerkin", 1],
  ];
  const isStallTrader = (role) =>
    /trader|merchant|seller|pedlar/.test(String(role || ""));
  // who comes to the square on market day (and only then)
  const MARKET_DAY_ROLES = new Set([
    "fruit seller",
    "baker",
    "cloth seller",
    "potter",
    "bowyer",
    "tinker",
    "herbwife",
    "butcher",
  ]);
  // what they sell: a stall a bit of everything (and what its people are known for); an inn or a tavern food and light
  const STALL_GOODS = [
    ["torch", 1],
    ["pitchtorch", 1],
    ["cord", 5],
    ["dried", 4],
    ["saltcap", 3],
    ["poultice", 1],
    ["needle", 1],
    ["bedroll", 1],
    ["sack", 1],
    ["basket", 1],
    ["woolcloak", 1],
    ["bow", 1],
    ["arrow", 10],
    ["leather", 2],
  ];
  const ARCH_GOODS = {
    reef: [["salt", 3]],
    salt: [["salt", 4]],
    canopy: [
      ["herbs", 4],
      ["resin", 3],
    ],
    stone: [["ore", 2]],
    frost: [["wool", 6]],
    grass: [["wool", 6]],
    wood: [
      ["resin", 3],
      ["charcoal", 4],
    ],
    ash: [["obsidian", 2]],
    isle: [["salt", 3]],
  };
  const INN_GOODS = [
    ["roasted", 2],
    ["roastmeat", 1],
    ["dried", 4],
    ["saltcap", 3],
    ["torch", 1],
    ["pitchtorch", 1],
  ];
  const hostOwner = (host) =>
    host && host.s ? host.s.owner : host && host.site ? host.site.owner : -1;
  const hostPeople = (host) => {
    const o = hostOwner(host);
    return o >= 0 ? state.story.peoples[o] : null;
  };
  const firstWord = (n) => String(n || "").split(" ")[0];
  // the town a trader trades for (an innkeeper out on the road answers to nobody), and what it thinks of you
  const traderTown = (p) => (p.host && p.host.s ? p.host.s : null);
  const traderK = (p) => {
    const t = traderTown(p);
    return t ? standingK(t.id) : 0;
  };
  function stockFor(p) {
    const people = hostPeople(p.host),
      k = traderK(p);
    let list =
      (farmSells(p) && FARM_GOODS[p.info.role]) ||
      ROLE_GOODS[p.info.role] ||
      (isStallTrader(p.info.role)
        ? STALL_GOODS.concat((people && ARCH_GOODS[people.arch]) || [])
        : INN_GOODS);
    if (/^caravan/.test(p.info.role)) {
      const r = mulberryOf(p.info.seed || 1);
      list = CARAVAN_GOODS.map((g) => ({ g, k: r() }))
        .sort((a, b) => a.k - b.k)
        .slice(0, 6)
        .map((o) => o.g);
    }
    return list.map(([id, n]) => ({ id, n, price: buyAt(id, n, k) }));
  }
  function traderTalk(p, withDoing) {
    const f = p.info,
      who = f.name,
      market = MARKET_DAY_ROLES.has(f.role),
      stall = isStallTrader(f.role) && !market,
      own = !!ROLE_GOODS[f.role] && !market;
    const greet = /^caravan/.test(f.role)
      ? [
          '"Come and look! All the way from where we come from, and none of it made here."',
          '"You will not see these again until we come back. If we come back. Buy now."',
        ]
      : market
        ? [
            '"Come and see! Only on market day, only from me."',
            '"Best on the square, and I will tell you so to your face."',
            '"Have a look. Touching is free. Breaking is not."',
          ]
        : own
          ? [
              '"What can I do for you? I sell what I make, and I buy what I can use."',
              '"Come in, come in. Buying, or selling?"',
            ]
          : stall
            ? [
                '"Buying? Selling? I take anything worth a coin, and I pay fair: half what it is worth. Ask anyone."',
                '"Come and look. And if you have something to sell, I will look at that too."',
                '"Everything here came a long way. So did you, by the look of you. What have you got?"',
              ]
            : [
                '"Something to eat for the road? Or something to sell? I buy what I can use, and a few things I can’t."',
                '"Hungry? Or here to sell? Either way, sit down first."',
              ];
    const town = traderTown(p),
      k = traderK(p);
    let g =
      greet[Math.floor(hash01(f.seed || 1, G.talks.size, 3) * greet.length)];
    if (k > 0 && G.name) g = g.replace(/^"/, `"${G.name}! `);
    // a friend of the town eats at the tavern on the house, once a day
    const lead = [];
    if (
      !stall &&
      !market &&
      !own &&
      town &&
      k >= 2 &&
      !G.talks.get(`meal:${town.id}:${dayNum()}`)
    ) {
      G.talks.set(`meal:${town.id}:${dayNum()}`, 1);
      G.body.food = Math.min(100, G.body.food + 45);
      lead.push(
        {
          who,
          text: `"${G.name || "You"}! Sit down and eat first. No, put your purse away. It is on the house."`,
        },
        {
          who: null,
          text: "You eat well, for once, and nobody will take a coin for it.",
        },
      );
    }
    // a town's tavern keeper knows who is going where: the beast at the rail, the caravans, the ships
    const travel =
      !stall && !market && !own && p.host && p.host.s && p.host.mountInfo;
    // and has beds upstairs, for the night
    const bed =
      !stall && !market && town && /tavern keeper|innkeeper/.test(f.role);
    const choices = [{ id: "trade", label: "Trade", primary: true }].concat(
      travel ? [{ id: "travel", label: "Ask about travel" }] : [],
      bed
        ? [
            {
              id: "bed",
              label:
                k >= 2
                  ? "A bed for the night"
                  : `A bed for the night (${coinWords(TAVERN_BED)})`,
            },
          ]
        : [],
      [
        { id: "chat", label: "Just talk" },
        { id: "no", label: "Not now" },
      ],
    );
    openDialog(withDoing(lead.concat([{ who, text: g, choices }])), {
      noChronicle: true,
      onClose: (c) => {
        ground.talkTo = null;
        if (c === "trade") openTrade(p);
        else if (c === "travel") setTimeout(() => hireMount(p.host), 0);
        else if (c === "bed") setTimeout(() => tavernBed(p, town), 0);
        else if (c === "chat")
          setTimeout(() => talk({ chat: true, np: G.talkNp }), 0);
      },
    });
  }
  // a bed upstairs at a town's tavern: for the night, for a couple of coins (for a friend of the town, nothing)
  const TAVERN_BED = 2;
  function tavernBed(p, town) {
    const who = p.info.name,
      price = traderK(p) >= 2 ? 0 : TAVERN_BED,
      done = {
        noChronicle: true,
        onClose: () => {
          ground.talkTo = null;
        },
      };
    if (ground.uniforms.uSun.value.y > 0.3) {
      openDialog(
        [
          {
            who,
            text: '"The beds are for the night. Come back when it starts getting dark."',
          },
        ],
        done,
      );
      return;
    }
    if (price && G.pack.count("oldcoin") < price) {
      openDialog(
        [
          {
            who,
            text: `"${cap(coinWords(price))} for a bed. Come back when you have it."`,
          },
        ],
        done,
      );
      return;
    }
    if (price) {
      G.pack.take("oldcoin", price);
      sfx.play("coin");
    }
    openDialog(
      [
        {
          who,
          text: price
            ? '"Up the stairs, the one at the end. Mind the step, everybody falls up it."'
            : '"For you? Nothing. Up the stairs, the one at the end."',
        },
      ],
      {
        noChronicle: true,
        onClose: () => {
          ground.talkTo = null;
          sleep({
            id: "town:" + town.id,
            tavern: { town, name: p.info.tavernName || "the tavern" },
          });
        },
      },
    );
  }
  const tradeUI = new TradeUI({
    close: () => closeTrade(),
    act: (k, a) => tradeAct(k, a),
  });
  function openTrade(p) {
    if (!G.on || G.dying || G.sleeping || ground.journey) return;
    if (ground.ghost) cancelPlace();
    if (G.packOpen) {
      G.packOpen = false;
      packUI.hide();
    }
    const f = p.info,
      k = traderK(p),
      sell = (s, n) => sellAt(s, n, k);
    G.trade = {
      mode: "trade",
      p,
      stock: stockFor(p),
      town: traderTown(p),
      sell,
    };
    G.tradeOpen = true;
    const half =
      ["half", "a little over half", "well over half", "nearly three quarters"][
        k
      ] +
      " of what it is worth" +
      (k ? ", for a friend of the town" : "");
    const sells =
      (farmSells(p) &&
        {
          farmer:
            "Sells eggs, grain and turnips to sow, and hens, goats and sheep for a pen of yours",
          farmhand:
            "Sells eggs, grain and turnips to sow, and hens for a pen of yours",
          herder:
            "Sells goats and sheep for a pen of yours, and milk, cheese and wool",
          "herd-singer":
            "Sells goats and sheep for a pen of yours, and milk, cheese and wool",
          shepherd: "Sells sheep for a pen of yours, and wool and cheese",
        }[f.role]) ||
      {
        miller: "Sells bread and flour",
        fisher: "Sells fish, and a line to catch your own",
        "net-mender": "Sells fish and lines",
        "mine foreman": "Sells ore from the mine, and light to dig by",
        baker: "Sells bread and flour",
        butcher: "Sells meat and hides",
        tinker: "Sells tools",
        bowyer: "Sells bows and arrows",
        potter: "Sells salt and baskets",
        herbwife: "Sells herbs and draughts",
        "fruit seller": "Sells fruit and mushrooms",
        "cloth seller": "Sells cloth, cord and cloaks",
      }[f.role] ||
      "Sells food and light for the road";
    tradeUI.show(G.pack, {
      mode: "trade",
      title: `${f.name}, ${f.role}`,
      sub: isStallTrader(f.role)
        ? `Buys anything worth a coin, for ${half}.`
        : `${sells}, and buys what you bring, for ${half}.`,
      stock: G.trade.stock,
      stockLabel: `${firstWord(f.name)} sells`,
      sell,
    });
  }
  function closeTrade() {
    if (!G.tradeOpen) return;
    G.tradeOpen = false;
    G.trade = null;
    tradeUI.hide();
    ground.talkTo = null;
    saveLife();
  }
