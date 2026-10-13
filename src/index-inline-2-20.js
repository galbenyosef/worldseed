// index-inline-2 20 — rng
// Lines 6887-7229 of readable/index-inline-2.pretty.js (statement-aligned).
  const PHONOLOGY = {
    soft: {
      on: ["l", "m", "n", "s", "v", "th", "y", "h", "r", "f", "sh", "", ""],
      mid: ["l", "n", "r", "s", "v", "th", "m"],
      vo: ["a", "e", "i", "o", "a", "e", "ae", "ia", "ei"],
      co: ["", "", "", "n", "l", "s", "th", "r", "ll"],
      ends: ["a", "ia", "el", "ine", "ara", "ys", "wen", "essa", "ith"],
    },
    harsh: {
      on: [
        "k",
        "g",
        "d",
        "dr",
        "gr",
        "kr",
        "t",
        "b",
        "r",
        "z",
        "h",
        "br",
        "th",
        "v",
      ],
      mid: ["r", "k", "g", "d", "z", "th"],
      vo: ["a", "o", "u", "a", "o", "e", "au", "u", "i"],
      co: ["k", "g", "r", "rk", "rg", "n", "d", "x", "m", "", "nd", "rn"],
      ends: ["ak", "or", "um", "rag", "og", "un", "ar", "dur", "goth", "ek"],
    },
    sibilant: {
      on: ["s", "sh", "z", "zh", "h", "m", "n", "q", "t", "j", "kh", "", ""],
      mid: ["s", "r", "n", "sh", "z", "h", "m"],
      vo: ["a", "i", "a", "u", "ai", "aa", "e", "i"],
      co: ["", "", "s", "sh", "r", "n", "m", "z", "q", "h"],
      ends: ["an", "ir", "esh", "im", "ah", "ur", "is", "aan", "iz"],
    },
    frost: {
      on: [
        "sk",
        "h",
        "v",
        "j",
        "f",
        "fj",
        "hv",
        "s",
        "t",
        "k",
        "r",
        "g",
        "",
        "",
      ],
      mid: ["r", "l", "n", "v", "k", "j", "st"],
      vo: ["e", "i", "a", "o", "y", "ei", "au", "o", "u"],
      co: ["", "n", "nn", "rr", "ld", "k", "t", "s", "nd", "rd", "lf"],
      ends: ["ir", "ald", "ey", "und", "ja", "var", "olf", "ing", "e"],
    },
    old: {
      on: [
        "m",
        "n",
        "th",
        "dh",
        "b",
        "k",
        "y",
        "mh",
        "v",
        "r",
        "l",
        "s",
        "",
        "",
      ],
      mid: ["r", "l", "n", "th", "m", "dh", "v"],
      vo: ["a", "u", "o", "e", "aa", "uu", "ai", "y", "i", "a"],
      co: ["", "l", "th", "r", "n", "m", "rth", "lm", ""],
      ends: ["ar", "un", "eth", "oth", "ai", "ahr", "yl"],
      apostrophe: 0.25,
    },
    bright: {
      on: ["p", "t", "k", "l", "m", "n", "w", "h", "v", "r", "", ""],
      mid: ["k", "l", "m", "n", "p", "t", "w", "h"],
      vo: ["a", "e", "i", "o", "u", "ai", "au", "a", "o"],
      co: ["", "", "", "", "n", "k", "l"],
      ends: ["a", "oa", "ua", "iki", "ano", "ei", "u"],
    },
    ember: {
      on: ["v", "x", "z", "r", "dr", "th", "ch", "k", "vh", "g", ""],
      mid: ["r", "z", "th", "k", "x", "v"],
      vo: ["a", "e", "y", "ae", "u", "o", "a"],
      co: ["x", "r", "th", "l", "n", "", "rx", "kh", "z"],
      ends: ["ax", "yr", "eth", "ul", "arkh", "oz", "ix"],
      apostrophe: 0.2,
    },
  };

  class Language {
    constructor(seed, style) {
      const r = new Rng(seed);
      const S = PHONOLOGY[style] || PHONOLOGY.soft;
      this.style = style;
      const keep = (arr, frac) => {
        const out = arr.filter(() => r.float() < frac);
        return out.length >= 2 ? out : arr.slice(0, 3);
      };
      this.on = keep(S.on, 0.75);
      this.mid = keep(S.mid, 0.8);
      this.vo = keep(S.vo, 0.8);
      this.co = keep(S.co, 0.8);
      this.ends = [r.pick(S.ends), r.pick(S.ends), r.pick(S.ends)];
      this.apostrophe = S.apostrophe || 0;
      this.suffixRate = r.range(0.2, 0.45);
      this.long = r.range(0.15, 0.4);
      this.cache = new Map();
    }

    // a new word; `rng` decides which, so words are stable per caller seed
    word(rng, minSyl = 2, maxSyl = 3) {
      for (let attempt = 0; attempt < 12; attempt++) {
        const n = rng.chance(this.long) ? maxSyl : minSyl;
        const parts = [];
        for (let i = 0; i < n; i++) {
          let on = rng.pick(this.on);
          if (i > 0 && (on === "" || /[^aeiouy]$/.test(parts[i - 1])))
            on = on === "" || on.length > 1 ? rng.pick(this.mid) : on;
          let syl = on + rng.pick(this.vo);
          if (i === n - 1) syl += rng.pick(this.co);
          parts.push(syl);
        }
        let w = parts.join("");
        if (
          n > 1 &&
          this.apostrophe &&
          rng.chance(this.apostrophe) &&
          /^[^aeiouy]/.test(parts[1])
        )
          w = parts[0] + "'" + parts.slice(1).join("");
        if (rng.chance(this.suffixRate))
          w = w.replace(/[aeiouy]+$/, "") + rng.pick(this.ends);
        w = w
          .replace(/([aeiouy])([aeiouy])[aeiouy]+/g, "$1$2")
          .replace(/([^aeiouy'])\1\1+/g, "$1$1")
          .replace(/([^aeiouy']{3})[^aeiouy']+/g, "$1")
          .replace(/''+/g, "'")
          .replace(/^'|'$/g, "");
        const bare = w.replace("'", "");
        if (bare.length >= 3 && bare.length <= 9 && /[aeiouy]/.test(bare))
          return cap(w);
      }
      return cap(rng.pick(this.mid) + rng.pick(this.vo) + rng.pick(this.ends));
    }

    // a stable name for a thing, keyed by an id string
    nameFor(key, minSyl = 2, maxSyl = 3) {
      if (!this.cache.has(key))
        this.cache.set(key, this.word(new Rng(hashKey(key)), minSyl, maxSyl));
      return this.cache.get(key);
    }

    person(rng) {
      const first = this.word(rng, 1 + (rng.chance(0.7) ? 1 : 0), 2);
      return rng.chance(0.55) ? first : `${first} ${this.word(rng, 2, 2)}`;
    }
  }

  function cap(s) {
    return s.charAt(0).toUpperCase() + s.slice(1);
  }
  function hashKey(s) {
    let h = 2166136261;
    for (let i = 0; i < s.length; i++) {
      h ^= s.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return h >>> 0;
  }

  // ---- story/lore.js ----
  // ============================================================
  // LORE — the reusable pieces stories are built from.
  // Peoples, antagonists, relics, rites, side tales and travellers.
  // Everything here is generic; the story engine binds it to real places.
  // ============================================================

  // Peoples: who lives where, how they sound, what they make and fear.
  const ARCHETYPES = {
    reef: {
      style: "soft",
      plural: ["reef-singers", "tide-folk", "shell-wardens"],
      homes: [
        "coral stilt-towns over the shallows",
        "shell towers that sing when the wind is right",
      ],
      crafts: [
        "pearl-glass",
        "songs that calm the surf",
        "purple dye from sea snails",
      ],
      faiths: [
        "the Tide Mother",
        "the Drowned Choir",
        "the Moon Under the Water",
      ],
      beasts: ["lantern rays", "glass eels", "shell-crabs the size of carts"],
      virtues: ["patience", "harmony"],
      mood: "welcoming",
      roles: ["pearl diver", "tide-priest", "net-mender", "song-keeper"],
    },
    salt: {
      style: "sibilant",
      plural: ["salt nomads", "sand-walkers", "mirror clans"],
      homes: [
        "tent-cities that move with the wind",
        "well-towns cut into red rock",
      ],
      crafts: ["sun mirrors", "salt-glass", "maps sung from memory"],
      faiths: ["the Unblinking Eye", "the Nine Wells", "the Glass Saint"],
      beasts: ["shell-oxen", "dune crawlers", "glass scorpions"],
      virtues: ["guest-law", "endurance"],
      mood: "wary but honourable",
      roles: ["caravan scout", "well-keeper", "salt trader", "mirror-reader"],
    },
    canopy: {
      style: "bright",
      plural: ["canopy clans", "branch-folk", "mask-weavers"],
      homes: [
        "villages strung between giant trees",
        "mushroom towers taller than hills",
      ],
      crafts: [
        "living rope",
        "poisons and their cures",
        "masks of lacquered leaf",
      ],
      faiths: ["the Green Dream", "the Mother Rot", "the Hundred-Eyed Tree"],
      beasts: ["veiled frogs", "hook-armed apes", "moth-bats"],
      virtues: ["cunning", "kinship"],
      mood: "secretive",
      roles: ["vine-runner", "mask-carver", "spore-doctor", "hunter"],
    },
    stone: {
      style: "harsh",
      plural: ["stone houses", "cliff-lords", "deep-delvers"],
      homes: [
        "halls carved into the cliffs",
        "stair-cities up the mountain flanks",
      ],
      crafts: [
        "iron and rune-stone",
        "mountain glass",
        "oaths that last a thousand years",
      ],
      faiths: [
        "the Sleeping Mountain",
        "the Ancestors in the Stone",
        "the Iron Father",
      ],
      beasts: ["cliff drakes", "horned goats as big as horses", "stone-moles"],
      virtues: ["honour", "stubbornness"],
      mood: "proud",
      roles: ["rune-cutter", "pass-warden", "ore-seeker", "oath-keeper"],
    },
    frost: {
      style: "frost",
      plural: ["frost hermits", "white herders", "sky-readers"],
      homes: ["snow-houses around hot springs", "longhalls of bone and turf"],
      crafts: [
        "bone carving",
        "reading the lights in the sky",
        "furs that never freeze",
      ],
      faiths: ["the Pale Lights", "the Long Night", "the White Wolf Mother"],
      beasts: ["woolly striders", "ice owls", "white elk"],
      virtues: ["hospitality in winter", "silence"],
      mood: "hospitable",
      roles: ["sky-reader", "herder", "trapper", "hermit"],
    },
    grass: {
      style: "bright",
      plural: ["grass riders", "wind clans", "herd-kings"],
      homes: ["great tent-camps", "earth-mound towns"],
      crafts: ["horn bows", "fast beasts", "songs of lineage"],
      faiths: ["the Wind That Walks", "the Sky Father", "the Thunder Bird"],
      beasts: ["tallbacks", "thunder birds", "grass lions"],
      virtues: ["courage", "freedom"],
      mood: "bold",
      roles: ["outrider", "herd-singer", "bow-maker", "horse-thief"],
    },
    wood: {
      style: "old",
      plural: ["woodwardens", "hollow-folk", "bark-kin"],
      homes: ["villages in hollow trees", "timber towns in the clearings"],
      crafts: ["herb lore", "carved wood", "amber"],
      faiths: ["the Old Trees", "the Horned One", "the Quiet Green"],
      beasts: ["antlered boars", "owl-cats", "river otters as big as men"],
      virtues: ["caution", "memory"],
      mood: "cautious",
      roles: ["woodcutter", "herbalist", "charcoal-burner", "warden"],
    },
    ash: {
      style: "ember",
      plural: ["ash-born", "flame-keepers", "cinder houses"],
      homes: ["temple-towns on black rock", "cities in cooled lava tubes"],
      crafts: ["obsidian blades", "fire-glass", "hot-spring baths"],
      faiths: [
        "the Burning Heart",
        "the Mountain That Speaks",
        "the Ember Saint",
      ],
      beasts: ["ember moths", "lava newts", "ash hounds"],
      virtues: ["zeal", "purity"],
      mood: "zealous",
      roles: ["ember-priest", "obsidian-knapper", "pilgrim", "lava-diver"],
    },
    isle: {
      style: "bright",
      plural: ["wave-riders", "isle-folk", "star-sailors"],
      homes: ["outrigger fleets", "villages on the backs of reefs"],
      crafts: ["star charts", "outrigger boats", "nets"],
      faiths: ["the Deep", "the Star Road", "the Whale Father"],
      beasts: ["whale-serpents", "sea-kites", "drum crabs"],
      virtues: ["freedom", "generosity"],
      mood: "free",
      roles: ["navigator", "fisher", "shell-trader", "smuggler"],
    },
  };

  // how a people is styled by kind of name
  const PEOPLE_TITLES = {
    reef: ["the {N}i", "the {N} tide-folk", "the {N}ai"],
    salt: ["the {N} clans", "the {N}ari", "the tribes of {N}"],
    canopy: ["the {N} clans", "the {N}o", "the people of {N}"],
    stone: ["House {N}", "the {N} houses", "the halls of {N}"],
    frost: ["the {N}folk", "the {N} herders", "the kin of {N}"],
    grass: ["the {N} riders", "the {N} hordes", "the {N}i"],
    wood: ["the {N}en", "the wardens of {N}", "the {N} kin"],
    ash: ["House {N}", "the {N} flame", "the ash-born of {N}"],
    isle: ["the {N}u", "the {N} sailors", "the fleets of {N}"],
  };

