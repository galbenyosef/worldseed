// index-inline-2 83 — hex
// Lines 34303-34620 of readable/index-inline-2.pretty.js (statement-aligned).
  function questTalk(story, q, st, ctx) {
    const g = q.giver.name,
      pages = [],
      arc = story.arc;
    const say = (text) => pages.push({ who: g, text: `"${text}"` });
    if (st === "done") {
      say(DONE_AGAIN[q.kind] || "You have it. Go, and use it well.");
      return { pages };
    }
    const first = st !== "met";
    if (q.kind === "relic") {
      if (!ctx.place) {
        // nowhere near to have been buried: they have it themselves, for what it cost them
        say(
          `${qCap(q.title)}? I have it. My family has kept it since before the trouble. Take it: what good is it doing in a chest?`,
        );
        return { pages, done: true };
      }
      if (first)
        say(
          `${qCap(q.title)}? ${RELIC_WHO[q.role] || "It was buried long ago"}, in ${ctx.place.name}. ${ctx.place.way}`,
        );
      say(
        first
          ? "The dead keep it. Nobody who went in for it has come out with it. Take a light, and something sharp."
          : `Still in ${ctx.place.name}, as far as I know. The dead do not give things back.`,
      );
      return { pages, met: true };
    }
    if (q.kind === "vigil") {
      const where = ctx.place ? ctx.place.name : q.placeName;
      if (first)
        say(
          VIGIL_ASK[arc.kind]
            ? VIGIL_ASK[arc.kind](q, where)
            : `${qCap(q.title)}. Someone must keep watch at ${where}, from nightfall until dawn, without running.`,
        );
      say(
        `${ctx.place ? ctx.place.way + " " : ""}Go when the sun is going down. Stand your ground there until it comes up again, whatever comes out of the dark. Light a fire, if you like. It will not keep everything off.`,
      );
      return { pages, met: true };
    }
    // a price
    const words = priceWords(q.price),
      offer = PRICE_ASK[q.role]
        ? PRICE_ASK[q.role](q, words, story)
        : `${qCap(q.title)}. It can be had, for ${words}.`;
    if (first) say(offer);
    if (ctx.has(q.price)) {
      pages.push({
        who: g,
        text: `"${first ? "Well?" : `You have ${q.price === "stories" ? "stories to tell" : words}?`} Then we can do this now."`,
        choices: [
          {
            id: "questpay",
            label:
              q.price === "stories" ? "Tell your stories" : `Give ${words}`,
            primary: true,
          },
          { id: "no", label: "Not yet" },
        ],
      });
    } else
      say(
        first
          ? `Come back when you have ${q.price === "stories" ? "them" : "it"}. I will still be here.`
          : `Not yet, then. ${qCap(words)}. I will still be here.`,
      );
    return { pages, met: true };
  }
  // paid, told, given: what you come away with
  function questPaid(story, q) {
    const g = q.giver.name,
      arc = story.arc;
    const t = PAID[q.role] ? PAID[q.role](q, story) : `${g} keeps the bargain.`;
    return [{ who: null, text: t }];
  }
  // the relic, found among the grave goods
  function relicFound(story, q) {
    return {
      who: null,
      text: `Among the grave goods, wrapped in rotten cloth: ${qLow(q.title)}. You know it the moment you touch it.`,
    };
  }
  // the vigil: kept, or broken
  function vigilKept(story, q, where) {
    const arc = story.arc,
      ant = arc.antagonist || "it";
    const w =
      {
        sleeper: `The sun comes up over ${where}. Somewhere below you, far off, the sea has gone quiet. You listened all night, and you heard it stop.`,
        haunted: `Dawn. The dead go back into the dark they came from, one by one, and do not look at you. You kept the watch at ${where}, and you did not run.`,
        blight: `Dawn. The fire at ${where} burned clean all night, and nothing grey came near it that you did not drive off. You light a clay lamp from it, and the flame in it is clean.`,
      }[arc.kind] ||
      `Dawn comes up over ${where}. You kept the vigil through the whole night, and nobody can say you ran.`;
    return w;
  }

  const RELIC_WHO = {
    "old soldier":
      "It went into the ground with the last of the ones who carried it, a long time ago",
    gardener:
      "They buried it with the old gardener who kept it, sealed in a jar, so the grey would never get at it",
    "fire-keeper":
      "It was carried down into the deep places long ago, and left with the dead who went down with it",
    miner:
      "The stair goes down from the deepest room under the hill, past the old tombs",
    gravedigger: "They lie with the dead who stole them, in the old tombs",
  };
  const DONE_AGAIN = {
    relic:
      "You found it? Then you have done what nobody else could. Go on, then.",
    price: "We have done our part. Do yours.",
    vigil: "You kept the watch. People are talking about it already.",
  };
  const VIGIL_ASK = {
    sleeper: (q, where) =>
      `${qCap(q.title)}. Someone must stand up there, at ${where}, from sunset, and listen until the sea goes quiet. Nobody who tried has lasted the night.`,
    haunted: (q, where) =>
      `${qCap(q.title)}. Someone must keep watch at ${where} from nightfall to dawn, and not run, when they come. Everyone runs.`,
    blight: (q, where) =>
      `Clean fire. A fire must burn at ${where} from nightfall to dawn, and someone must keep the grey off it the whole night. In the morning it will be clean, and you can carry it.`,
  };
  const PRICE_ASK = {
    elder: (q, w) =>
      `${qCap(q.title)}? Who told you I knew that? ...I swore never to say it. The ancestors can let me off the oath, if someone brings them a gift out of the old graves: ${w}.`,
    "map-seller": (q, w) =>
      `The old roads under the mountain? My grandfather bought that map from them, and it has been in a chest ever since. ${qCap(w)}, and it is yours.`,
    archivist: (q, w) =>
      `The last copy, yes. It is not for sale. ...For ${w} it could be lent, and not come back.`,
    jailer: (q, w) =>
      `The prisoner? Keeps talking about how it all ends. For ${w}, I might forget to lock a door one night.`,
    diver: (q, w) =>
      `The bell? I know the water it lies under. I will go down for it, if you make it worth the cold: ${w}.`,
    singer: (q, w) =>
      `It is not sung for strangers. ...But I will sing it once, slowly, so you can carry it, for ${w}. A singer has to eat.`,
    "keeper of the halls": (q, w) =>
      `I am the last who reads the old letters in the halls. I will read them to you, word by word, until you have them by heart. For ${w}.`,
    "fire-keeper": (q, w) =>
      `We will light our fire when the night comes, if you want it lit. Our price is ${w}. We have given enough for nothing.`,
    heir: (q, w) =>
      `Me? Taken from where? ...My mother said I came with an amulet, and that it was lost in the old graves. Bring me one like it, and I will believe you.`,
    "forge-master": (q, w) =>
      `The great forge has been cold a hundred years. We do not light it for coin. Tell us ${w}, and we will see.`,
  };
  const PAID = {
    elder: (q) =>
      `${q.giver.name} takes the gift, and holds it a long time. Then leans close and says the name, very quietly, once. You will not forget it.`,
    "map-seller": (q) =>
      `${q.giver.name} brings out a square of old hide, folded small. The roads under the mountain are drawn on it in soot, every one of them.`,
    archivist: (q) =>
      `${q.giver.name} unrolls it for you on the table and rolls it up again. The tunnels are there, every one.`,
    jailer: (q) =>
      `That night a door is left open. The prisoner finds you in the dark, and tells you, before running: what the horde fears more than anything.`,
    diver: (q) =>
      `${q.giver.name} goes down three times. The third time she comes up with it, green and cold, and it rings once in the air.`,
    singer: (q) =>
      `${q.giver.name} sings it, low and slow, again and again, until you can sing it back. By the end you could not forget it if you tried.`,
    "keeper of the halls": (q) =>
      `Days in the cold halls, word by word, until you have the words of binding by heart.`,
    "fire-keeper": (q) =>
      `${q.giver.name} takes it and nods. "When the night comes, our fire will burn." You believe it.`,
    heir: (q) =>
      `${q.giver.name} turns the amulet over and over, and goes very quiet. "Then it is true," they say at last. "Then I will come, when it is time."`,
    "forge-master": (q) =>
      `You tell them. It takes all evening. When you finish, the forge-master gets up without a word and goes to rake out the old forge.`,
  };

  // ---- game/stall.js ----
  // ============================================================
  // STALL — a market stall by your door, and someone to keep it. Put things
  // out on it and they sell while you are away, to whoever passes: the more
  // people come by (a road, a town close by, farms and inns around), the
  // sooner. Ask a fair price, or ask less to sell quicker, or more and wait.
  // The keeper takes a tenth of every sale and keeps the rest for you.
  // Pure data and arithmetic: the app decides who passes, and when.
  // ============================================================

  const STALL_CAP = 8;
  // how much you ask, against what a thing is worth, and how much quicker or slower it goes
  const PRICE_LEVELS = ["cheap", "fair", "dear"];
  const PRICE_K = { cheap: 0.75, fair: 1, dear: 1.4 };
  const SPEED_K = { cheap: 1.8, fair: 1, dear: 0.4 };
  const LEVEL_WORD = { cheap: "cheap", fair: "fair price", dear: "dear" };
  // asking more, then less, then fair again
  const nextLevel = (lv) =>
    PRICE_LEVELS[(PRICE_LEVELS.indexOf(lv) + 1) % PRICE_LEVELS.length];

  function newStall(t, day) {
    return { t, since: day, goods: [], cash: 0, ledger: [], seen: 0 };
  }

  // what a lot on the stall asks: its worth (less for wear), times the price you set
  function lotPrice(slot, level = "fair") {
    return Math.max(
      1,
      Math.round(unitValue(slot) * slot.n * (PRICE_K[level] || 1)),
    );
  }
  // what the keeper keeps of a sale: a tenth, in whole coins
  const keeperCut = (price) => Math.floor(price / 10);
  // how many times a day, on average, someone wants a lot (cheap things go quicker than dear ones)
  function saleRate(price, traffic, level = "fair") {
    return (
      ((Math.max(0, traffic) * 2.4) / (1 + price / 30)) * (SPEED_K[level] || 1)
    );
  }
  // "should go within a day", "a few days, likely"...
  function waitWords(rate) {
    const d = rate > 0 ? 1 / rate : Infinity;
    return d < 1
      ? "should go within a day"
      : d < 3
        ? "a few days, likely"
        : d < 8
          ? "maybe a week"
          : d < 20
            ? "a long wait"
            : "hardly anyone comes for it";
  }
  // how busy a spot is, in words
  function trafficWords(traffic) {
    return traffic >= 2
      ? "Plenty of people pass this way. Things will sell."
      : traffic >= 1
        ? "A fair few pass by."
        : traffic >= 0.5
          ? "Not many come this way, but some do."
          : "Hardly anyone passes out here. It will be slow.";
  }

  // Time passes at the stall: since it was last looked at, each lot may have sold.
  // goods: [{ s: [id, n, wear, worn, mends, tag], lv }]. Returns what sold.
  // slotOf turns a saved row back into a stack; who() says who bought it.
  function stepStall(st, now, traffic, slotOf, who, rnd = Math.random) {
    const days = Math.max(0, Math.min(30, now - (st.t ?? now)));
    st.t = now;
    if (!days || !st.goods.length) return [];
    const sold = [];
    for (let i = st.goods.length - 1; i >= 0; i--) {
      const g = st.goods[i],
        s = slotOf(g.s);
      if (!s || !ITEMS[s.id]) {
        st.goods.splice(i, 1);
        continue;
      }
      const price = lotPrice(s, g.lv),
        rate = saleRate(price, traffic, g.lv);
      const p = 1 - Math.exp(-rate * days);
      if (!(rnd() < p)) continue;
      // when, within the time that passed: the first sale of a steady trickle
      const u = rnd(),
        dt = rate > 0 ? -Math.log(1 - u * p) / rate : days;
      const net = price - keeperCut(price);
      st.goods.splice(i, 1);
      st.cash += net;
      sold.push({
        id: s.id,
        n: s.n,
        worn: !!s.worn,
        price,
        net,
        t: +(now - days + dt).toFixed(3),
        who: who(s),
      });
    }
    sold.sort((a, b) => a.t - b.t);
    for (const e of sold) st.ledger.push(e);
    st.sold = (st.sold || 0) + sold.length;
    st.earned = (st.earned || 0) + sold.reduce((a, e) => a + e.net, 0);
    // the oldest go first: keep the last two dozen
    if (st.ledger.length > 24) {
      const k = st.ledger.length - 24;
      st.ledger.splice(0, k);
      st.seen = Math.max(0, (st.seen || 0) - k);
    }
    return sold;
  }

  // ---- view/icons.js ----
  // ============================================================
  // ICONS — a small pixel picture for every thing you can carry, painted
  // from a handful of shapes at 16×16 and outlined so it reads on any panel.
  // ============================================================

  const ICON_N = 16;
  const hex = (h) => [
    parseInt(h.slice(1, 3), 16),
    parseInt(h.slice(3, 5), 16),
    parseInt(h.slice(5, 7), 16),
  ];
  const PAL = {
    wood: ["#3a2416", "#5e3d24", "#86603a", "#b08756"].map(hex),
    bark: ["#2e2016", "#4a3524", "#6a5036", "#8c7050"].map(hex),
    stone: ["#3c3d48", "#62646f", "#8c8e9a", "#bfc1cb"].map(hex),
    flint: ["#1b2030", "#2f3850", "#4f5d86", "#93a3d0", "#eef2ff"].map(hex),
    grass: ["#2a4418", "#467028", "#72a036", "#b2d25a"].map(hex),
    cord: ["#5c4428", "#8a6c40", "#b8975e", "#e0c88c"].map(hex),
    berry: ["#3e0c18", "#7a1a2a", "#b82e44", "#ee7a8c"].map(hex),
    dried: ["#2c0e16", "#4c1a26", "#6e2a38", "#945060"].map(hex),
    cap: ["#4e160e", "#8e2c1c", "#c84a34", "#f2e6cc"].map(hex),
    roast: ["#2e1a10", "#5a3420", "#86502e", "#b0784a"].map(hex),
    flame: ["#7a2410", "#d4581e", "#f49a38", "#ffe07e"].map(hex),
    hide: ["#3a281c", "#5a4030", "#7c5c44", "#a0805e"].map(hex),
    rust: ["#3a1c12", "#6a3420", "#98522e", "#c07a4a"].map(hex),
    amber: ["#5a2e08", "#a0580e", "#e09a24", "#ffd86a"].map(hex),
    obs: ["#0e0a14", "#241c30", "#3e3450", "#7a6e98", "#e6e0ff"].map(hex),
    wool: ["#8a8070", "#c2b8a4", "#e4dccb", "#fbf6ea"].map(hex),
    bone: ["#8e8674", "#c4bca6", "#e6dfcc", "#fffaf0"].map(hex),
    leather: ["#3a2212", "#62391c", "#8c5a30", "#b88250"].map(hex),
    gold: ["#6a4a10", "#b08420", "#e6c048", "#fff0a0"].map(hex),
    red: ["#4a0e10", "#8e1e22", "#c83a36", "#f07a6a"].map(hex),
    ice: ["#2a4a66", "#5a8cb0", "#a8d4ee", "#f2fcff"].map(hex),
    copper: ["#1e4a3a", "#2e7a5e", "#4eb08a", "#9ae8c4"].map(hex),
    star: ["#10204a", "#2c5aa8", "#74a8f0", "#c4e2ff", "#ffffff"].map(hex),
    ink: hex("#120c1c"),
  };

