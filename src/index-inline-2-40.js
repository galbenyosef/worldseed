// index-inline-2 40 — story
// Lines 14025-14330 of readable/index-inline-2.pretty.js (statement-aligned).
  const INN_ADJ = [
    "Red",
    "Old",
    "Sleeping",
    "Crooked",
    "Laughing",
    "Tarred",
    "Lost",
    "Hungry",
    "Silver",
    "Lame",
    "Blind",
    "Singing",
    "Drowned",
    "Patient",
    "Last",
    "Honest",
    "Three",
    "Seven",
  ];
  const INN_NOUN = [
    "Lamp",
    "Kettle",
    "Goat",
    "Boot",
    "Crow",
    "Anchor",
    "Wheel",
    "Bell",
    "Stag",
    "Hound",
    "Ox",
    "Stone",
    "Star",
    "Key",
    "Cup",
    "Wolf",
    "Candle",
    "Pilgrim",
  ];
  const INN_MANY = { Ox: "Oxen", Wolf: "Wolves", Key: "Keys", Cup: "Cups" };
  const HAMLET_END = [
    "Fold",
    "Stead",
    "Cross",
    "End",
    "Green",
    "Hollow",
    "Well",
    "Garth",
    "Hythe",
    "Ford",
  ];
  function wsPeople(story, s) {
    return s.owner >= 0 ? story.peoples[s.owner] : null;
  }
  function wsLang(story, s, old) {
    const p = wsPeople(story, s);
    return old || !p ? story.old : p.lang;
  }
  function wsWord(story, s, k, old = false, syl = 2) {
    return wsLang(story, s, old).word(
      new Rng(hashInt(s.seed, k, 0xa11)),
      syl,
      syl,
    );
  }
  // the name of the k-th person who lives at a place (stable)
  function folkName(story, s, k) {
    return wsLang(story, s, false).person(new Rng(hashInt(s.seed, k, 313)));
  }
  const firstName = (n) => String(n).split(" ")[0];

  // what a place is called, and how you would say it in a sentence ("Hollin’s farm", "the ruins of Ushket")
  function siteName(story, s) {
    if (s._name) return s._name;
    const r = new Rng(hashInt(s.seed, 9, 0x4e));
    const p = wsPeople(story, s);
    let n;
    switch (s.kind) {
      case "farm":
        n = `${firstName(folkName(story, s, 0))}’s farm`;
        break;
      case "hamlet":
        n = `${wsWord(story, s, 1)} ${r.pick(HAMLET_END)}`;
        break;
      case "inn": {
        const adj = r.pick(INN_ADJ);
        let noun =
          p && r.chance(0.35) ? wsTitle(beastOne(p.beast)) : r.pick(INN_NOUN);
        if (adj === "Three" || adj === "Seven")
          noun =
            INN_MANY[noun] || (/(s|x)$/.test(noun) ? noun + "es" : noun + "s");
        n = `the ${adj} ${noun}`;
        break;
      }
      case "hut":
        n = `${firstName(folkName(story, s, 0))}’s hut`;
        break;
      case "tents":
        n = `the camp of ${firstName(folkName(story, s, 0))}’s kin`;
        break;
      case "ruin":
        n = `the ruins of ${wsWord(story, s, 1, true)}`;
        break;
      case "tower":
        n = r.chance(0.5)
          ? `${wsWord(story, s, 1, true)} Tower`
          : `the tower on ${wsWord(story, s, 1, true)} Hill`;
        break;
      case "circle":
        n = r.chance(0.5)
          ? `the ${wsWord(story, s, 1, true)} Stones`
          : `the Ring of ${wsWord(story, s, 1, true)}`;
        break;
      case "barrow":
        n = `${wsWord(story, s, 1, true)}’s Barrow`;
        break;
      case "hotspring":
        n = `the ${wsWord(story, s, 1)} springs`;
        break;
      case "bigtree":
        n = r.chance(0.6)
          ? `Old ${wsWord(story, s, 1)}`
          : `the ${wsWord(story, s, 1)} Tree`;
        break;
      case "battlefield":
        n = `the field of ${wsWord(story, s, 1, true)}`;
        break;
      case "peak":
        n = r.chance(0.5)
          ? `${wsWord(story, s, 1)} Top`
          : `the cairn on ${wsWord(story, s, 1)}`;
        break;
      case "cave":
        n = r.pick([
          `the cave of ${wsWord(story, s, 1, true)}`,
          `${wsWord(story, s, 1, true)} Hole`,
          `the ${wsWord(story, s, 1)} Deeps`,
          `the Hollow under ${wsWord(story, s, 1, true)}`,
        ]);
        break;
      case "skystone": {
        const w = wsWord(story, s, 1, true);
        n = r.chance(0.5) ? `the fallen star of ${w}` : `${w}’s Star`;
        break;
      }
      case "giantbones":
        n = `the bones of ${wsWord(story, s, 1, true)}`;
        break;
      case "geysers":
        n = `the ${wsWord(story, s, 1)} geysers`;
        break;
      case "stonegrove":
        n = `the stone forest of ${wsWord(story, s, 1, true)}`;
        break;
      case "hermit":
        n = `${hermitOf(story, s).name}’s tower`;
        break;
      case "deadcity":
        n =
          (story.city && story.city.name) ||
          `the city of ${wsWord(story, s, 1, true)}`;
        break;
      case "grave":
        n = `the grave of ${folkName(story, s, 7)}`;
        break;
      case "mill":
        n = r.chance(0.5)
          ? `${firstName(folkName(story, s, 0))}’s mill`
          : `the mill at ${wsWord(story, s, 1)}`;
        break;
      case "fishhut":
        n = `${firstName(folkName(story, s, 0))}’s fishing hut`;
        break;
      case "lighthouse": {
        const w = wsWord(story, s, 1);
        n = r.chance(0.5) ? `the light on ${w} Head` : `the ${w} light`;
        break;
      }
      case "mine":
        n = r.chance(0.5)
          ? `the ${wsWord(story, s, 1)} mine`
          : `the mine at ${wsWord(story, s, 1)}`;
        break;
      case "ferry":
        n = `the ferry at ${wsWord(story, s, 1)}`;
        break;
      case "watch":
        n = `the watch post at ${wsWord(story, s, 1)}`;
        break;
      case "temple":
        n = `the shrine of ${p ? p.faith : "the old gods"} at ${wsWord(story, s, 1)}`;
        break;
      case "home":
        n = `your ${(HOME_SIZE[s.size] || HOME_SIZE.hut).word}`;
        break;
      default:
        n = `${wsAn(SMALL_WORD[s.kind] || s.kind)} ${SMALL_WORD[s.kind] || s.kind}`;
    }
    s._name = n;
    return n;
  }
  const SMALL_WORD = {
    cairn: "cairn",
    stone: "standing stone",
    shrine: "wayside shrine",
    camp: "old camp",
    grave: "grave",
    spring: "spring",
    stash: "hidden stash",
    bones: "heap of old bones",
    sign: "signpost",
  };
  // what kind of place it is, in a word or two
  const SITE_WORD = {
    farm: "farm",
    hamlet: "hamlet",
    inn: "inn",
    hut: "hut",
    tents: "camp",
    ruin: "ruin",
    tower: "tower",
    circle: "ring of stones",
    barrow: "barrow",
    hotspring: "hot spring",
    bigtree: "ancient tree",
    battlefield: "old battlefield",
    peak: "cairn on a peak",
    cave: "cave",
    home: "your home",
    ...SMALL_WORD,
    skystone: "a fallen star",
    giantbones: "bones of something vast",
    geysers: "geysers",
    stonegrove: "a forest of stone",
    hermit: "a hermit’s tower",
    mill: "windmill",
    fishhut: "fishing hut",
    lighthouse: "lighthouse",
    mine: "mine",
    ferry: "ferry landing",
    watch: "watch post",
    temple: "holy place",
    deadcity: "a great city, fallen",
  };
  // how each people builds a wayside shrine
  const SHRINE_LOOK = {
    reef: "shell",
    isle: "shell",
    salt: "stele",
    stone: "stele",
    frost: "stele",
    grass: "pole",
    wood: "pole",
    canopy: "pole",
    ash: "bowl",
  };
  // which of the gods' favours each faith gives: the sea's, the watchful ones', the green's, the stone's,
  // the flame's, the wind's, the hunt's (see game/magic.js)
  const FAITH_BLESS = {
    "the Tide Mother": "tide",
    "the Drowned Choir": "tide",
    "the Moon Under the Water": "watched",
    "the Unblinking Eye": "watched",
    "the Nine Wells": "wells",
    "the Glass Saint": "hearthfaith",
    "the Green Dream": "wells",
    "the Mother Rot": "wells",
    "the Hundred-Eyed Tree": "watched",
    "the Sleeping Mountain": "mountain",
    "the Ancestors in the Stone": "mountain",
    "the Iron Father": "hunt",
    "the Pale Lights": "watched",
    "the Long Night": "hearthfaith",
    "the White Wolf Mother": "hunt",
    "the Wind That Walks": "wind",
    "the Sky Father": "wind",
    "the Thunder Bird": "hunt",
    "the Old Trees": "wells",
    "the Horned One": "hunt",
    "the Quiet Green": "wells",
    "the Burning Heart": "hearthfaith",
    "the Mountain That Speaks": "mountain",
    "the Ember Saint": "hearthfaith",
    "the Deep": "tide",
    "the Star Road": "wind",
    "the Whale Father": "tide",
  };
  function faithBless(faith) {
    return FAITH_BLESS[faith] || "wells";
  }
  // what each favour is asked for with, in the people's own words
  const FAITH_ASK = {
    tide: "that the water hold you up and give you back",
    watched: "to be watched over in the dark",
    wells: "for the healing the green gives",
    mountain: "that the stone stand with you",
    hearthfaith: "for a fire that does not go out",
    wind: "for the wind at your back",
    hunt: "that your aim be true",
  };

  // ---------- the look of a place ----------
  // Layouts are in metres around the place's centre: x east, z south. Props stand on the
  // ground where they are; buildings sit on their lowest corner like a town's.
