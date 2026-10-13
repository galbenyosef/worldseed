// index-inline-2 21 — key
// Lines 7230-7569 of readable/index-inline-2.pretty.js (statement-aligned).
  const PLACE_NAMES = {
    continent: ["{N}", "{N}", "the {N} Lands"],
    island: ["{N}", "{N} Isle", "the Isle of {N}"],
    range: [
      "the {N} Mountains",
      "the {N} Range",
      "the Spine of {N}",
      "the {N} Teeth",
    ],
    volcano: ["Mt. {N}", "{N}'s Throat", "the {N} Caldera", "Mt. {N}"],
    isles: ["the {N} Isles", "the {N} Chain", "the Stepping Stones of {N}"],
    trench: ["the {N} Trench", "the {N} Deep", "the Throat of {N}"],
    ridge: ["the {N} Ridge", "the {N} Rise"],
    rift: ["the {N} Rift", "the {N} Rift"],
    riftsea: ["the {N} Sea", "the Gulf of {N}"],
    desert: [
      "the {N} Waste",
      "the {N} Sands",
      "the {N} Desert",
      "the Salt of {N}",
    ],
    jungle: ["the {N} Jungle", "the {N} Green", "the Deep Green of {N}"],
    forest: ["the {N} Wood", "the {N} Forest", "the {N} Weald"],
    taiga: ["the {N} Pines", "the {N} Taiga", "the Black Wood of {N}"],
    plains: ["the {N} Plains", "the {N} Steppe", "the {N} Grass"],
    icecap: ["the {N} Ice", "the {N} Glacier", "the White of {N}"],
    tundra: ["the {N} Barrens", "the {N} Tundra"],
    ocean: ["the {N} Ocean", "the {N} Ocean", "the Sea of {N}"],
    sea: ["the {N} Sea", "the {N} Gulf", "the Bay of {N}"],
    peak: ["Mt. {N}", "the {N} Peak"],
  };

  const SETTLEMENT_FORMS = {
    capital: ["{N}", "{N}", "{N}", "High {N}"],
    town: ["{N}", "{N}", "{N} Hollow", "{N} Crossing"],
    port: ["Port {N}", "{N} Harbour", "{N}", "{N}"],
    village: ["{N}", "{N} Well", "Little {N}", "{N} Fold"],
    monastery: ["the Monastery of {N}", "the {N} Stair", "the Cloister of {N}"],
    outpost: ["{N} Watch", "Fort {N}", "{N} Post"],
  };

  // Main-arc antagonists and titles
  const DRAGON_EPITHETS = [
    "the Ember-Eater",
    "Who Eats Kings",
    "the Seventh Flame",
    "Old Cinderwing",
    "the Ash Crown",
    "the Patient Fire",
  ];
  const BLIGHTS = [
    "the Grey Bloom",
    "the Weeping Rot",
    "the Hollow Moss",
    "the Pale Web",
    "the Quiet Mould",
  ];
  const HORDES = [
    {
      name: "the Ashen Fleet",
      from: "sea",
      how: "black-sailed ships that come out of the fog",
    },
    {
      name: "the Glass Horde",
      from: "desert",
      how: "riders in mirrored armour who come out of the sun",
    },
    {
      name: "the Riders of the Pale Lights",
      from: "ice",
      how: "white riders who come when the sky-lights burn",
    },
    {
      name: "the Star-Ships",
      from: "sky",
      how: "silver ships that fall from the sky and do not burn",
    },
    {
      name: "the Hollow Legion",
      from: "rift",
      how: "soldiers in rusted masks who climb out of the rift at night",
    },
  ];
  const SLEEPERS = [
    "the One Below",
    "the Drowned King",
    "the Mother of Tides",
    "the Sleeper Under the Ice",
    "the Coiled God",
  ];
  const GHOSTS = [
    "the Pale Regent",
    "the Unburied Host",
    "the Lantern King",
    "the Weeping Queen",
  ];

  const RELICS = {
    weapon: [
      "the Frostglass Spear",
      "the Blade of Nine Tides",
      "the Star-Iron Bow",
      "the Obsidian Crown-Breaker",
      "the Singing Harpoon",
    ],
    bell: [
      "the Bell of Low Water",
      "the Silver Bell",
      "the Bell of the First Tide",
      "the Choir Bell",
    ],
    seed: [
      "the Last Clean Seed",
      "the Seed of the First Tree",
      "the Amber Seed",
    ],
    ember: ["the Heart-Ember", "the First Flame", "the Coal That Remembers"],
    stone: ["the Oath-Stone", "the Treaty Tablet", "the Split Crown"],
    bones: [
      "the bones of the last king",
      "the Queen’s skull",
      "the Founder’s hand",
    ],
    map: ["the Lava Road map", "the Tunnel Charts", "the Star Road chart"],
  };

  const ELDER_TITLES = [
    "the Rememberer",
    "the Eldest",
    "the Keeper of Names",
    "the Blind Archivist",
    "the Last Singer",
  ];
  const RITE_WHEN = [
    { key: "clearNight", text: "on a cloudless night" },
    { key: "noon", text: "when the sun stands at noon" },
    { key: "dawn", text: "at the first light of dawn" },
    { key: "storm", text: "in the heart of a storm" },
    { key: "dusk", text: "as the sun goes down" },
  ];

  // Side tales: small local stories. `where` picks a fitting settlement.
  const TALES = [
    {
      key: "caravan",
      where: "desert",
      title: "The Missing Caravan",
      text: "{giver}, {role} of {town}, is waiting for a caravan that left for {other} {n} days ago. It should have crossed {region} in three.",
      hint: "Its last camp fire was seen near {near}.",
    },
    {
      key: "lighthouse",
      where: "port",
      title: "The Lamp That Went Dark",
      text: "The great lamp above {town} went dark {n} nights ago. {giver}, the {role}, heard singing from the tower the night before.",
      hint: "Nobody who climbs the tower comes down before morning.",
    },
    {
      key: "stones",
      where: "mountain",
      title: "The Humming Stones",
      text: "Near {town} the standing stones hum at dawn, and the goats will not graze there. {giver}, {a} {role}, wants to know why before the herd starves.",
      hint: "The humming is loudest when the wind comes from {bearing}.",
    },
    {
      key: "beast",
      where: "forest",
      title: "Something in {region}",
      text: "Something takes the animals of {town} at night and leaves no tracks. {giver}, the {role}, has lost {n} already.",
      hint: "The old folk say it only hunts when the clouds cover the sky.",
    },
    {
      key: "bell",
      where: "coast",
      title: "The Bell Under the Water",
      text: "The fishers of {town} hear a bell ringing under the sea at low tide. {giver}, {a} {role}, swears it is the bell of a village that sank {n} years ago.",
      hint: "It rings loudest when the sea is flat calm.",
    },
    {
      key: "star",
      where: "any",
      title: "The Wrong Star",
      text: "A new star has appeared over {town}, and {giver}, {a} {role}, says it moves against the others. Some say it is a ship. Some say it is you.",
      hint: "It is brightest just before dawn.",
    },
    {
      key: "glass",
      where: "desert",
      title: "The Glass Rain",
      text: "Glass beads fell like hail on {town} {n} days ago, each one warm and humming. {giver}, {a} {role}, has collected a jar of them.",
      hint: "They came from the direction of {near}.",
    },
    {
      key: "frozen",
      where: "cold",
      title: "The Frozen Messenger",
      text: "Herders near {town} found a messenger frozen in the ice, still holding a sealed letter. {giver}, {a} {role}, cannot read the seal.",
      hint: "The seal belongs to {people2}.",
    },
    {
      key: "feud",
      where: "any",
      title: "The Feud of Two Wells",
      text: "Two families of {town} have not spoken for {n} years, since a wedding went wrong. Now the well between their houses has run dry, and {giver}, {a} {role}, is afraid of what comes next.",
      hint: "Each family blames a gift the other brought from {other}.",
    },
    {
      key: "hermit",
      where: "mountain",
      title: "The Hermit’s Riddle",
      text: "A hermit above {town} answers one question for anyone who climbs to the cave, but only after they answer one of his. {giver}, {a} {role}, has climbed {n} times and failed every time.",
      hint: "The last riddle was about {near}.",
    },
    {
      key: "plague",
      where: "jungle",
      title: "The Sleeping Sickness",
      text: "In {town} people fall asleep in the middle of a sentence and wake days later speaking of {region}. {giver}, {a} {role}, thinks it is something in the water.",
      hint: "The sleepers all drank from the same spring.",
    },
    {
      key: "smoke",
      where: "volcano",
      title: "Signal Smoke",
      text: 'Coloured smoke rises from {near} at dusk, the old signal for "come home". {giver}, {a} {role} of {town}, says no one has used it in {n} years.',
      hint: "Someone climbed the mountain recently: the ash on the path is fresh.",
    },
  ];

  // Opening: the traveller who finds you
  const WAKE_SENSES = {
    desert: [
      "The sand under you is still warm.",
      "Your lips are cracked and the light hurts.",
      "A glass scorpion watches you from a rock, then decides you are not food.",
    ],
    cold: [
      "Frost has grown on your eyelashes.",
      "Your breath hangs in the air like smoke.",
      "The snow around you has melted into a crater the shape of you.",
    ],
    forest: [
      "Leaves are still falling where you broke through the branches.",
      "Something small is sniffing your foot.",
      "The forest is very quiet, the way it goes quiet around a hunter.",
    ],
    jungle: [
      "Everything drips.",
      "A frog the size of your hand sits on your chest, deciding.",
      "The air is so wet it feels like breathing soup.",
    ],
    plains: [
      "The grass is taller than you when you sit up.",
      "Far away, a herd moves like a cloud shadow.",
      "The wind never stops here.",
    ],
    mountain: [
      "The air is thin and your head pounds.",
      "Loose stones still rattle down the slope where you landed.",
      "Below you the clouds lie like a second ground.",
    ],
    coast: [
      "Waves wash over your feet.",
      "Gulls are arguing about you.",
      "You taste salt, and blood.",
    ],
    water: [
      "You come up choking, clinging to driftwood.",
      "The water is deep and dark below your feet.",
      "Rain beats the sea flat around you.",
    ],
    any: [
      "Your whole body aches.",
      "You have nothing: no clothes, no name, no idea.",
      "A crater of scorched ground smokes around you.",
    ],
  };
  const FIND_LINES = [
    "{name}, {a} {role} of {people}, saw a light fall out of the sky and came to see what it was.",
    "{name}, {a} {role} of {people}, was the only one brave enough to follow the falling star.",
    "A figure stands over you: {name}, {a} {role} of {people}. {They} had been watching the sky.",
    "{name}, {a} {role} of {people}, pokes you with a stick until you move.",
  ];
  const GREETINGS = {
    welcoming: [
      '"Easy. You fell a long way. Here, drink this."',
      '"You\u2019re alive! The sky doesn\u2019t give many gifts. Here, take my cloak."',
    ],
    "wary but honourable": [
      '"Guest-law says I must give you water, whatever you are. So. Water."',
      '"You came out of the sky. That is either very good or very bad."',
    ],
    secretive: [
      '"Don\u2019t tell anyone I found you. Put this on."',
      '"Quiet. Someone else will have seen that light. Can you walk?"',
    ],
    proud: [
      '"On your feet. Nobody lies in the dirt in front of me."',
      '"A sky-fallen. My grandmother told of such things. Get up."',
    ],
    hospitable: [
      '"Nobody is turned away from a fire. Come and get warm."',
      '"You\u2019ll freeze like that. Here, take these furs."',
    ],
    bold: [
      '"Ha! I\u2019ve never seen anyone fall from the sky and live!"',
      '"You fell like a spear. Can you ride?"',
    ],
    cautious: [
      '"Stay back until I know what you are. ...Fine. Take this blanket."',
      '"Things that fall from the sky are usually bad luck. You don\u2019t look like bad luck."',
    ],
    zealous: [
      '"The Heart has sent you. Or cursed you. We will find out."',
      '"Fire from the sky. It is a sign. Everything is a sign."',
    ],
    free: [
      '"Fell off the Star Road, did you? Happens. Come on."',
      '"Nobody owns the sea and nobody owns the sky. Welcome, sky-swimmer."',
    ],
  };
  // Origin myths, one per people type. {faith} {plural} and a real place fill them in.
  const MYTHS = {
    reef: "{Faith} sang the first {plural} out of the foam on the shores of {place}.",
    salt: "{Faith} dropped the world into the fire to harden it. {Place} is the part that never cooled, and the {plural} are the ones who learned to live there.",
    canopy:
      "The first {plural} fell from {faith} like ripe fruit, into {place}.",
    stone:
      "The first {plural} climbed down from {place}, where {faith} had carved them out of the living rock.",
    frost:
      "The world was born frozen. {Faith} breathed on {place} until it thawed, and the {plural} were the first thing to grow.",
    grass:
      "{Faith} ran across {place}, and every footprint became a herd. The {plural} followed the herds and never stopped.",
    wood: "{Faith} planted {place} before there was light, and the first {plural} woke among its roots.",
    ash: "{Faith} burst out of {place} and cooled into the first {plural}.",
    isle: "{Faith} scattered {place} across the sea like seeds, and the {plural} sailed out to find every one.",
    ocean:
      "In the beginning there was only {ocean}. {Faith} raised {place} from the water so the {plural} would have somewhere to stand.",
  };
