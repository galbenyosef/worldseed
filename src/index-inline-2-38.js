// index-inline-2 38 — len
// Lines 13331-13673 of readable/index-inline-2.pretty.js (statement-aligned).
  const TEACH_LINES = {
    listen: [
      '"Listen. Watch my fingers. Don’t watch my face, it puts people off."',
      '"Listen. All the way to the end this time."',
      '"Listen. It’s not a hard one. It just thinks it is."',
    ],
    now: [
      '"Now you."',
      '"Your turn. Don’t rush it."',
      '"Now you. From the beginning."',
    ],
    got: [
      '"There. It’s yours now. Don’t play it at funerals."',
      '"That’s it! That’s it exactly. Well. Near enough to work."',
      '"Good. It knows you now. Songs are like dogs: once they know you, they come when you call."',
    ],
    quit: [
      '"Come back when your fingers are ready. The song will wait. Songs are patient. More patient than me."',
    ],
  };
  // the rarest of all: what the one who knows it says about it
  const HEART_LINES = [
    '"The Song of the Heart takes you to where the world’s trouble is. The middle of it. Where it all comes from. Nobody sensible wants to go there, which is why it costs what it costs."',
    '"For that one I want a piece of three wonders: star-iron from a stone that fell, a tooth from the bones of something vast, a piece of a tree that turned to stone. Bring me all three and it’s yours."',
  ];
  // what the others say about the one who knows the way
  const heartRumor = (heartName, who, way) =>
    `"There’s one of us who knows the Song of the Heart. ${who}. Lives out ${way}, near ${heartName}, where nobody sane goes. Odder than me. Much odder."`;
  // asked about the world
  const HERMIT_LORE = [
    '"I came out here to be alone. Then the crow came. Then the stones. Now you. It’s getting crowded."',
    '"People say magic is fire out of your fingers. It isn’t. It’s a tune you can’t get out of your head, and the world can’t either."',
    '"The draughts? Herbs, mostly. And patience. And one thing I won’t tell you."',
    '"Every place that matters gives you something if you stand in it long enough. A stone that fell. An old tree. A ring of stones. Go and stand in them."',
  ];

  // ---- game/homes.js ----
  // ============================================================
  // HOMES — a house of your own. A house-wright in any town sells deeds to a
  // hut, a house or a hall, built the way their people build. Put the deed
  // down where you want it (dry, flat, clear of towns, places and roads) and
  // the wright's crew puts the house up while you wait. Inside: a bed to sleep
  // and wake in, a chest that keeps whatever you leave in it, and a hearth;
  // the rest of the room is yours to fill. Pure data: the view builds it.
  // ============================================================

  // how big each kind is (metres), how much the chest holds, how long it takes to build (hours)
  const HOME_SIZE = {
    hut: {
      w: 5.0,
      d: 4.4,
      floors: 1,
      cap: 10,
      show: 12,
      hours: 5,
      word: "hut",
      price: 36,
    },
    house: {
      w: 7.6,
      d: 6.0,
      floors: 2,
      cap: 20,
      show: 24,
      hours: 10,
      word: "house",
      price: 110,
    },
    hall: {
      w: 11.2,
      d: 8.0,
      floors: 2,
      cap: 32,
      show: 40,
      hours: 20,
      word: "hall",
      price: 260,
    },
  };
  const STALL_PRICE = 30;
  const HOME_KINDS = ["hut", "house", "hall"];
  const DEED_OF = { hut: "deedhut", house: "deedhouse", hall: "deedhall" };
  const SIZE_OF_DEED = { deedhut: "hut", deedhouse: "house", deedhall: "hall" };

  // a people that builds round builds its huts and houses round (never its halls)
  const homeRound = (size, style) =>
    size !== "hall" && !!style && style.round >= 0.5;
  // a round house is a little wider than a square one is long
  const homeDims = (size, style) => {
    const Z = HOME_SIZE[size] || HOME_SIZE.hut;
    if (homeRound(size, style))
      return { w: Z.w + 0.8, d: Z.w + 0.8, round: true };
    return { w: Z.w, d: Z.d, round: false };
  };
  // how far from its middle a house reaches, with room to walk round it
  const homeReach = (size, style) => {
    const D = homeDims(size, style);
    return Math.hypot(D.w, D.d) / 2 + 2.5;
  };

  // Where the bed is, in the house's own metres (x across, z from the back wall to the front door).
  // The view furnishes the room from this, and you wake on it.
  function homeBed(w, d, round) {
    if (round) {
      // a round house's door is on its +z side; the bed is round the wall to one side of it
      const r = w / 2,
        a = Math.PI / 2 + 2.4;
      return { x: Math.cos(a) * (r - 0.75), z: Math.sin(a) * (r - 0.75) };
    }
    return { x: -w / 2 + 0.62, z: -d / 2 + 1.15 };
  }

  // the record of a house you own, as kept in your save
  function newHome(id, size, owner, dir, face, day) {
    return { id, size, owner, dir: dir.slice(), face, chest: [], day };
  }

  // ---------- workrooms: an oven, a bench and an anvil, a loom ----------
  // The house-wright builds them into a house of yours, each against a wall. A hut has room for two of
  // them; a house or a hall for all three. Where they go, in the house's own metres (x across it, z from
  // the back wall to the door): against the back wall or the front, x along it, len the most it can take
  // there; a round house's go round its wall, at an angle a (x = cos a, z = sin a; the door is at a = π/2).
  const WORK_KINDS = ["oven", "forge", "loom"];
  const WORK_LEN = { oven: 1.3, forge: 2.1, loom: 1.6 };
  const WORK_WORD = {
    oven: "an oven",
    forge: "a bench and an anvil",
    loom: "a loom",
  };
  const WORK_SLOTS = {
    hut: [
      { id: "back", wall: -1, x: -0.55, len: 1.65 },
      { id: "front", wall: 1, x: -1.35, len: 2.15 },
    ],
    house: [
      { id: "back", wall: -1, x: -1.6, len: 2.0 },
      { id: "back2", wall: -1, x: 1.2, len: 1.8 },
      { id: "front", wall: 1, x: 2.45, len: 2.3 },
    ],
    hall: [
      { id: "back", wall: -1, x: -3.2, len: 2.2 },
      { id: "back2", wall: -1, x: 2.75, len: 2.4 },
      { id: "front", wall: 1, x: 4.1, len: 2.2 },
    ],
  };
  const WORK_RSLOTS = {
    hut: [
      { id: "left", a: 2.8, len: 2.2 },
      { id: "right", a: 0.35, len: 2.2 },
    ],
    house: [
      { id: "left", a: 2.8, len: 2.4 },
      { id: "right", a: 0.35, len: 2.4 },
      { id: "back", a: 4.8, len: 2.0 },
    ],
  };
  // (the oven and the loom would rather be against the back wall, out of the way; the bench by the door, in the light)
  const WORK_PREF = {
    oven: ["back", "back2", "left", "right", "front"],
    loom: ["back2", "back", "right", "left", "front"],
    forge: ["front", "left", "right", "back2", "back"],
  };
  // which goes where, in the order you had them built: kind → slot, or null where there is no room for it
  function workLayout(size, round, kinds) {
    const slots = (round ? WORK_RSLOTS : WORK_SLOTS)[size] || [];
    const used = new Set(),
      out = {};
    for (const k of kinds || []) {
      if (!WORK_LEN[k]) continue;
      const s = WORK_PREF[k]
        .map((id) => slots.find((q) => q.id === id))
        .find((q) => q && !used.has(q.id) && q.len >= WORK_LEN[k]);
      out[k] = s || null;
      if (s) used.add(s.id);
    }
    return out;
  }
  // is there room in a house of this size for one more?
  const workRoom = (size, round, kinds, k) =>
    !!workLayout(size, round, (kinds || []).concat([k]))[k];

  // How big a thing looks set down (metres across its picture). Tools are drawn corner to corner,
  // so a spear 1.25 across is near enough 1.7 long.
  const SHOW_SIZE = {
    log: 0.9,
    plank: 0.8,
    stick: 0.55,
    stone: 0.2,
    flint: 0.16,
    fiber: 0.45,
    cord: 0.22,
    blade: 0.14,
    berries: 0.18,
    dried: 0.16,
    mushroom: 0.16,
    roasted: 0.22,
    cavecap: 0.16,
    herbs: 0.3,
    saltcap: 0.2,
    poultice: 0.18,
    knife: 0.3,
    obknife: 0.3,
    copperknife: 0.32,
    bronzeknife: 0.34,
    axe: 0.55,
    obaxe: 0.55,
    copperaxe: 0.58,
    hammer: 0.45,
    copperspear: 1.25,
    bronzesword: 0.85,
    torch: 0.42,
    pitchtorch: 0.42,
    needle: 0.14,
    cpouch: 0.3,
    sack: 0.6,
    basket: 0.6,
    pack: 0.65,
    cloak: 0.95,
    woolcloak: 0.95,
    bedroll: 0.8,
    campfire: 0.6,
    leanto: 0.9,
    workstone: 0.6,
    resin: 0.16,
    obsidian: 0.2,
    salt: 0.24,
    wool: 0.3,
    bone: 0.32,
    charcoal: 0.2,
    sting: 0.22,
    grain: 0.26,
    flour: 0.34,
    bread: 0.28,
    fish: 0.3,
    roastfish: 0.3,
    smokedfish: 0.3,
    fishline: 0.4,
    turnip: 0.2,
    egg: 0.12,
    roastegg: 0.12,
    milk: 0.3,
    cheese: 0.22,
    porridge: 0.26,
    stew: 0.26,
    deedfield: 0.34,
    deedpen: 0.34,
    crystal: 0.26,
    ore: 0.22,
    obblade: 0.14,
    oldblade: 0.7,
    amulet: 0.22,
    crown: 0.3,
    charm: 0.16,
    stariron: 0.22,
    starblade: 0.9,
    gianttooth: 0.42,
    stonewood: 0.26,
    boneflute: 0.42,
    dr_road: 0.2,
    dr_bull: 0.2,
    dr_mend: 0.2,
    dr_owl: 0.2,
    dr_hearth: 0.2,
    dr_fish: 0.2,
    dr_hare: 0.2,
    deedhut: 0.34,
    deedhouse: 0.34,
    deedhall: 0.34,
    deedstall: 0.34,
    deedporch: 0.34,
    deedtohouse: 0.34,
    deedtohall: 0.34,
    deedoven: 0.34,
    deedforge: 0.34,
    deedloom: 0.34,
    deedwell: 0.34,
    deedhives: 0.34,
    deedstable: 0.34,
    deedpalisade: 0.34,
    honey: 0.22,
    honeycake: 0.22,
    cloth: 0.34,
    berrypie: 0.26,
    meatpie: 0.26,
    waybread: 0.2,
    quilted: 0.8,
    woolcap: 0.3,
    banner: 0.9,
  };
  // (a little bigger than life: the world is drawn in big pixels, and small things would vanish)
  const showSize = (id) => Math.max(0.22, (SHOW_SIZE[id] || 0.3) * 1.2);

  // ---- game/farm.js ----
  // ============================================================
  // FARM — a field behind your house and a pen beside it. The house-wright
  // digs and fences the field, and puts up the pen with a hen house and a
  // trough. Sow the field with what you have (grain, turnips, healing herbs)
  // and it comes up over a few days, green, then ripe; reap it before it goes
  // over. Farmers sell hens, goats and sheep for the pen: hens lay, goats give
  // milk, sheep grow a fleece to shear. They forage for themselves, but with
  // grain in the trough they give twice as much.
  // Pure data and arithmetic: the view draws it, app.js lets you work it.
  // ============================================================

  const FIELD_PRICE = 20;
  const PEN_PRICE = 26;

  // what you can sow: what it takes, how long it is in the ground (days), what comes up, how long it keeps ripe
  const CROPS = {
    grain: {
      seed: "grain",
      sow: 5,
      days: 4,
      yield: [16, 22],
      word: "grain",
      reap: "Reap the grain",
      tool: "knife",
      keep: 5,
    },
    turnip: {
      seed: "turnip",
      sow: 2,
      days: 3,
      yield: [9, 13],
      word: "turnips",
      reap: "Lift the turnips",
      tool: null,
      keep: 6,
    },
    herbs: {
      seed: "herbs",
      sow: 3,
      days: 2,
      yield: [7, 10],
      word: "healing herbs",
      reap: "Pick the herbs",
      tool: null,
      keep: 3,
    },
  };
  const CROP_KINDS = ["grain", "turnip", "herbs"];

  // what lives in the pen: what it gives and how often (days), how much can wait to be collected, what it eats a day
