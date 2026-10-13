// index-inline-2 78 — items
// Lines 32785-32910 of readable/index-inline-2.pretty.js (statement-aligned).
  const MEND = {
    axe: { blade: 1, cord: 1 },
    knife: { blade: 1 },
    hammer: { stone: 1, cord: 1 },
  };
  const MENDS = 2;
  // at an anvil of your own nearly anything can be mended, as often as it needs, and even a tool worn right
  // out made good again (for twice the parts)
  const MEND_FORGE = {
    obknife: { obblade: 1 },
    obaxe: { obblade: 1, cord: 1 },
    bow: { cord: 1, stick: 1 },
    fishline: { cord: 1, bone: 1 },
    copperknife: { ore: 1, charcoal: 1 },
    copperaxe: { ore: 1, charcoal: 2 },
    copperspear: { ore: 1, charcoal: 1 },
    bronzeknife: { charcoal: 2 },
    bronzesword: { charcoal: 3 },
    starblade: { charcoal: 4 },
  };
  // what townsfolk say when they show you something
  const TEACH = {
    cloak:
      "You’ll freeze in that. Twist the fibre tight and weave it close, and a cloak of it keeps the wind off.",
    dried:
      "Berries rot in a day. Lay them by the fire till they wrinkle and they’ll keep for a week.",
    saltcap:
      "Pack mushrooms in salt, a handful to three, and they’ll keep till spring. Taste better too.",
    woolcloak:
      "Grass keeps the wind off. Wool keeps the cold out. Get a bone needle and I’ll show you the stitch.",
    basket:
      "You carry things in your arms like a child. Weave a basket, sticks for the ribs, grass between. Here, like this.",
    charcoal:
      "Bury a log in the embers and let it smoulder, not burn. What comes out burns twice as hot and weighs nothing.",
    fishline:
      "A line, a hook, and patience. Carve the hook small, from bone, with a barb on it. Then stand still. That is the hard part.",
  };
  // who along the way can show you what
  const ROLE_TEACH = {
    innkeeper: "saltcap",
    shepherd: "woolcloak",
    farmer: "basket",
    farmhand: "basket",
    herbalist: "dried",
    hermit: "cloak",
    hunter: "cloak",
    trapper: "cloak",
    "charcoal-burner": "charcoal",
    fisher: "fishline",
    "net-mender": "fishline",
  };
  const RECIPE = Object.fromEntries(RECIPES.map((r) => [r.id, r]));

  function itemName(id, n = 1, worn = false) {
    const it = ITEMS[id];
    if (!it) return id;
    const nm = n > 1 && it.plural ? it.plural : it.name;
    return worn ? `Worn ${nm.charAt(0).toLowerCase()}${nm.slice(1)}` : nm;
  }
  const lowerName = (id, n = 1) => {
    const s = itemName(id, n);
    return /^[A-Z][a-z]/.test(s) ? s.charAt(0).toLowerCase() + s.slice(1) : s;
  };
  // "3 sticks", "a flint blade", "some cord"
  function countWords(id, n) {
    const it = ITEMS[id];
    // "a piece of raw meat", "2 pairs of leather boots"
    if (it && it.unit)
      return n > 1
        ? `${n} ${it.units || it.unit + "s"} of ${lowerName(id, 1)}`
        : `a ${it.unit} of ${lowerName(id, 1)}`;
    if (n > 1) return `${n} ${lowerName(id, n)}`;
    if (id === "cord" || id === "fiber" || id === "berries" || id === "dried")
      return `some ${lowerName(id)}`;
    return `${/^[aeiou]/i.test(it ? it.name : id) ? "an" : "a"} ${lowerName(id)}`;
  }

  // ---------- what things are worth, in old coin ----------
  // A thing's full worth; a worn tool is worth less, a spent one hardly anything.
  function unitValue(s) {
    const it = s && ITEMS[s.id];
    if (!it || !it.value) return 0;
    if (s.worn) return it.value * 0.1;
    if (s.wear != null && it.uses)
      return it.value * Math.max(0.25, s.wear / it.uses);
    if (s.wear != null && it.burn)
      return it.value * Math.max(0.2, s.wear / it.burn);
    return it.value;
  }
  // what you wear turns aside part of every blow: 20/(20+armour) of it gets through
  const guardOf = (armour) => 20 / (20 + Math.max(0, armour));
  // traders pay half what a thing is worth
  const SELL_RATE = 0.5;
  const sellPrice = (s, n = 1) =>
    Math.floor(unitValue(s) * n * SELL_RATE + 1e-6);
  // money and things carried for someone else are not for sale
  const sellable = (id) =>
    !!(
      ITEMS[id] &&
      ITEMS[id].value &&
      ITEMS[id].kind !== "quest" &&
      ITEMS[id].kind !== "coin"
    );
  // what a bundle costs to buy: its worth, rounded up, never nothing
  // (traders sell at a quarter over what a thing is worth)
  const buyPrice = (id, n = 1) =>
    Math.max(
      1,
      Math.ceil((ITEMS[id] ? ITEMS[id].value || 0 : 0) * n * 1.25 - 1e-6),
    );
  // "1 old coin", "12 old coins"
  const coinWords = (n) => `${n} old coin${n === 1 ? "" : "s"}`;

  // ---- game/pack.js ----
  // ============================================================
  // PACK — everything you carry. The satchel is a row of slots (stacks of the
  // same thing share one); a bag on your back or a pouch on your belt adds
  // slots. Worn and held things live on the body. What you know how to make
  // grows as you find things; making takes what it needs from the satchel.
  // Old coin goes in a purse on your belt, not the satchel: it takes no room,
  // and it stays with you whatever happens.
  // ============================================================

  const ARMS = 6; // what you can carry with nothing but your arms
  const COIN = "oldcoin";

