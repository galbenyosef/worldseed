// index-inline-2 42 — story
// Lines 15790-16104 of readable/index-inline-2.pretty.js (statement-aligned).
  function hutRole(s, people, rng) {
    if (s.coastKm < 4) return "fisher";
    if (s.biome === B.DESERT || s.biome === B.COLDDESERT)
      return rng.chance(0.5) ? "salt-gatherer" : "hermit";
    if (s.biome === B.TUNDRA || s.biome === B.STEPPE || s.rough > 0.35)
      return rng.chance(0.65) ? "shepherd" : "hermit";
    if (
      [B.FOREST, B.WETFOREST, B.TAIGA, B.JUNGLE, B.DRYFOREST].includes(s.biome)
    )
      return rng.pick(
        people && people.arch === "wood"
          ? ["charcoal-burner", "hunter", "herbalist"]
          : ["hunter", "hunter", "hermit", "herbalist"],
      );
    return rng.pick(["hermit", "shepherd", "hunter"]);
  }

  // ---------- words ----------
  const WILD_GREET = {
    welcoming: [
      '"A traveller! Come and sit a while."',
      '"You look like you’ve walked a long way. Sit down before you fall down."',
    ],
    "wary but honourable": [
      '"You’re on our land. Guest-law holds out here too."',
      '"Water is free. The rest we can talk about."',
    ],
    secretive: [
      '"You didn’t see this place. Understand?"',
      '"How did you find us? ...Never mind. Speak quietly."',
    ],
    proud: [
      '"Few come this way. Fewer are welcome. Say your piece."',
      '"This land has been ours for nine generations. Mind where you walk."',
    ],
    hospitable: [
      '"Out here nobody passes a door without stopping. Come in, get warm."',
      '"There’s broth on the fire. Sit."',
    ],
    bold: [
      '"Ha! A walker! Where from, where to?"',
      '"You have the look of somebody going somewhere interesting."',
    ],
    cautious: [
      '"That’s close enough. ...What do you want?"',
      '"Strangers mean trouble, usually. You’re not trouble?"',
    ],
    zealous: [
      '"{Faith} sees you, walker. Do you see {faith}?"',
      '"Have you made an offering on the road today? You should."',
    ],
    free: [
      '"No lords out here. Sit anywhere."',
      '"The road’s free and so is the talk."',
    ],
  };
  const ROLE_LINES = {
    farmer: [
      '"The rain came late this year. Always too early or too late, never when you want it."',
      '"If you see {beast} near the fields, shout. Please."',
      '"My grandmother cleared this land stone by stone. The stones are in the walls now."',
    ],
    farmhand: [
      '"Up before the sun, to bed after it. Don’t let anyone tell you farming is peaceful."',
    ],
    innkeeper: [
      '"Beds upstairs. Don’t mind the snoring; it’s the walls."',
      '"Everyone passes through here eventually. Even the ones who swear they never will."',
      '"If it’s news you want, sit by the fire. The travellers talk more than they drink. Almost."',
    ],
    shepherd: [
      '"The flock knows the weather before I do. Today they say rain."',
      '"Up here you talk to the sheep or you talk to nobody."',
    ],
    hunter: [
      '"Tracks everywhere this week. Something big is moving through."',
      '"Walk quiet in the woods. Things are listening."',
    ],
    trapper: ['"Furs don’t catch themselves. Neither do dinners."'],
    hermit: [
      '"I came out here to be alone. And yet here you are."',
      '"Sit, if you must. Speak, if you must. Then go."',
    ],
    herbalist: [
      '"Half of what grows here will cure you and half will kill you. Learn which half before you taste."',
    ],
    "charcoal-burner": [
      '"Don’t touch the mound. It breathes fire for nine days and it doesn’t like strangers."',
    ],
    "salt-gatherer": [
      '"Salt is worth more than silver where the sea is far away."',
    ],
    fisher: [
      '"The fish went deep this year. Nobody knows why. The old ones say that is a bad sign."',
    ],
    warden: [
      '"I watch the road. Nobody pays me to. Somebody has to."',
      '"From up there I can see smoke a day’s walk off. Most days it’s just farms."',
    ],
    miller: [
      '"The wind turns the stones and the stones turn the grain into bread. All I do is stand in the way."',
      '"When the wind drops I sleep. When it blows at night I don’t. You get used to it. Mostly."',
      '"Everybody needs flour. Nobody likes the miller. Ask my wife."',
    ],
    "net-mender": [
      '"Every hole in a net is a fish you didn’t catch. I mend them all, and still the fish find the holes."',
    ],
    lightkeeper: [
      '"Every night, dusk to dawn, the lamp burns. If it ever goes out, somebody out there drowns. So it doesn’t."',
      '"I’ve counted the ships that came in by my light. I stopped at a thousand. I keep counting anyway."',
      '"The sea’s calm today. That means nothing. The sea lies."',
    ],
    "mine foreman": [
      '"The hill gives up its copper one lump at a time, and it makes you pay for every one."',
      '"Mind the props. The roof stays up because of them, and because it hasn’t decided to come down yet."',
    ],
    miner: [
      '"Down there you can’t tell day from night. Only the lamps, and the sound of the picks."',
      '"My father dug here, and his mother. The hill remembers all of us."',
    ],
    ferryman: [
      '"Over and back, over and back. The water doesn’t care how many times."',
      '"One coin to cross. Two if you’re in a hurry. There’s no faster boat, I just like to be paid for the hurry."',
    ],
    guard: [
      '"Keep to the road and keep your eyes open. What isn’t on the road isn’t our business."',
      '"We watch the road from here to the next post. Two days of it. Nobody else is going to."',
    ],
    priest: [
      '"{Faith} hears you here. Whether {faith} answers is {faith}’s business."',
      '"Leave something in the bowl, and ask. It doesn’t have to be much. It has to be yours."',
    ],
    traveller: [
      '"I’ve walked from {far}. My feet will tell you all about it, if you let them."',
      '"Every inn on this road waters its beer. This one waters it less."',
    ],
    pilgrim: ['"I walk to {holy}. It is a long way. That is the point."'],
  };
  const LOCAL_LORE = {
    ruin: [
      '"{Name}? Old stones. Older than us. My grandmother said people lived there once who could read the sky."',
      '"Nobody builds with stones that big any more. Nobody knows how."',
    ],
    tower: [
      '"{Name} was built to watch for something. Nobody remembers what. Nobody watches any more."',
      '"On clear nights you can see a light at the top of {name}. There’s nobody up there."',
    ],
    circle: [
      '"Don’t sleep inside {name}. People who do wake up remembering things that never happened to them."',
      '"The old ones put those stones up to count the days. My father said they still keep count."',
    ],
    barrow: [
      '"{Name} is a grave for somebody important. Nobody remembers who. Nobody goes in."',
      '"The door of {name} has never been opened. Some say from the outside."',
    ],
    hotspring: [
      '"The water at {name} is hot enough to cook an egg at the middle. Sit at the edge and your aches go away."',
    ],
    bigtree: [
      '"{Name} was old when my great-grandmother was a girl. We tie ribbons on it for luck."',
      '"They say {faith} planted {name} with one hand. Try putting your arms round it."',
    ],
    battlefield: [
      '"Bad ground, {name}. There was a battle there, long ago. The crows still remember."',
      '"Don’t take anything from {name}. Or do. The dead can’t stop you. Probably."',
    ],
    peak: ['"Climb {name} on a clear day and you’ll see half the world."'],
    farm: ['"{Name}? Good people. They’ll give you bread if you ask nicely."'],
    hamlet: [
      '"{Name} is where we go for a wedding or a funeral. Same faces at both."',
    ],
    inn: [
      '"{Name} is the only inn for a day in either direction. The beds are clean. The food is food."',
    ],
    hut: [
      '"Somebody lives out at {name}. Keeps to themselves. Knows things, though."',
    ],
    tents: [
      '"{Name} move with the seasons. They’ll trade, if you have something worth trading."',
    ],
    cave: [
      '"{Name}? Cold air comes up out of it, summer and winter. Children dare each other to go in. Nobody dares far."',
      '"Take a torch if you go into {name}. Take two. The dark in there is hungry."',
      '"My grandmother said the old ones laid their dead in {name}. Leave them be, she said. Leave them be."',
    ],
    skystone: [
      '"A star fell at {name}, in my grandmother’s grandmother’s time. There’s a light stands up out of it still, day and night. Nobody goes close."',
      '"Walk out towards {name} on a dark night and you’ll see it: a light on the ground, the wrong colour for fire."',
    ],
    giantbones: [
      '"{Name}: the bones of something that died before there were people to see it. Children climb on them. Grown-ups don’t."',
      '"There’s a skull at {name} you could live in. Nobody does."',
    ],
    geysers: [
      '"At {name} the ground boils and spits water at the sky. Stand clear when it roars."',
      '"You can cook an egg at {name}. You can cook yourself too, if you stand in the wrong place."',
    ],
    hermit: [
      '"{Name}? Somebody lives out there on their own. Purple smoke, some days. My mother said leave them be. My father said take them bread. I take them bread."',
      '"Out at {name} there’s one who talks to crows. And the crows talk back, people say. I don’t say. I just listen."',
    ],
    stonegrove: [
      '"{Name}: trees, turned to stone. You can count every ring of the wood. Don’t take any home, my father said. I did anyway."',
      '"There’s a forest of stone at {name}. Nobody knows who turned it, or why."',
    ],
    mill: [
      '"{Name} grinds for every farm round about. The bread here is good because the stones there are."',
    ],
    fishhut: [
      '"Out at {name} they’ll sell you a fish for a coin, and tell you a story about it for free."',
    ],
    lighthouse: [
      '"The keeper at {name} hasn’t missed a night in thirty years. Ships come in by that light from days out."',
      '"On a dark night the light at {name} goes round and round. You can see it from the hills."',
    ],
    mine: [
      '"They dig copper at {name}. Hard work and a hard crew. They pay, though, if you can swing a pick."',
      '"{Name} goes deeper every year. One day they’ll dig into something that digs back."',
    ],
    ferry: [
      '"The ferry at {name} will take you over the water for a coin. Ring the bell if the boat’s on the far side."',
    ],
    watch: [
      '"There’s a watch post on the road at {name}. They’ll know what’s about. They pay for pelts of anything that hunts."',
    ],
    temple: [
      '"At {name} you can ask {faith} for help. People do. Some of them get it."',
      '"Go to {name} before a long journey. Everybody here does. It doesn’t hurt."',
    ],
  };
  function wsDist(km) {
    if (km < 0.4) return "just over there";
    if (km < 1.5) return "a short walk";
    if (km < 4) return "under an hour on foot";
    if (km < 9) return "an hour or two on foot";
    if (km < 18) return "half a day’s walk";
    if (km < 34) return "about a day’s walk";
    return `${Math.round(km / 28)} days’ walk`;
  }
  // what you would see first
  const WS_CUE = {
    farm: "You’ll see the chimney smoke.",
    hamlet: "You’ll see the smoke from the chimneys.",
    inn: "On the road; you can’t miss it.",
    hut: "Look for the smoke.",
    tents: "You’ll see their fire at night.",
    ruin: "Grey walls, no roof.",
    tower: "You can see it from any hill.",
    circle: "Big grey stones in a ring.",
    barrow: "A long green mound with a door in it.",
    hotspring: "Follow the steam.",
    bigtree: "It stands over everything else. You can’t miss it.",
    battlefield: "Look for the crows.",
    peak: "The highest hill around, with a cairn on top.",
    skystone:
      "Look for a beam of pale light going up into the sky. At night you can’t miss it.",
    giantbones: "White ribs taller than a house, standing out of the ground.",
    geysers: "Follow the steam. Stand back when the ground roars.",
    stonegrove: "Grey trunks with never a leaf on them.",
    hermit: "Look for purple smoke. Purple. You’ll know it when you see it.",
    mill: "You’ll see the sails turning from a long way off.",
    fishhut: "Down on the shore. Follow the smell of fish.",
    lighthouse: "On the headland. At night you can’t miss it.",
    mine: "In the hillside. Look for the heaps of broken rock.",
    ferry: "Down by the water, where the boat crosses.",
    watch: "On the road. They’ll see you before you see them.",
    temple: "Look for the smoke of the offerings.",
  };
  // where a place is, from here, the way people say it
  function wayWords(ix, from, s, story) {
    const km = (wsAng(from, s.dir) * ix.R) / 1000;
    const here = ix.height(from),
      dh = (s.h ?? ix.height(s.dir)) - here;
    const bw = bearingWord(from, s.dir);
    let where = "";
    if (dh > 90) where = ", up on the high ground";
    else if (dh < -90) where = ", down in the low country";
    else if (s.coastKm < 2) where = ", down by the sea";
    const dist = km < 0.4 ? "just over there" : `${bw} of here, ${wsDist(km)}`;
    const name = siteName(story, s);
    const dd = `${km < 0.4 ? "right here" : `${bw}, ${wsDist(km)}`}${where}`;
    return {
      km,
      text: `${cap(name)}? ${cap(dist)}${where}. ${WS_CUE[s.kind] || ""}`.trim(),
      short: `${cap(name)}: ${dd}.`,
      dirDist: dd,
    };
  }
  function wsVars(story, s, people) {
    const p = people || { faith: "the old gods", beast: "wolves", rival: -1 };
    const faith = p.faith || "the old gods";
    const rival =
      p.rival >= 0 && story.peoples[p.rival]
        ? story.peoples[p.rival].name
        : "the people over the mountains";
    const far = story.settlements.length
      ? story.settlements[s.seed % story.settlements.length].name
      : "the far towns";
    const holy = (story.arc.lair && story.arc.lair.name) || far;
    return {
      Faith: cap(faith),
      faith,
      beast: beastOne(p.beast || "wolves").replace(
        /^/,
        wsAn(beastOne(p.beast || "wolves")) + " ",
      ),
      rival,
      far,
      holy,
    };
  }

  // A person at a place says something: a greeting the first time, then what they know.
  // ctx: { story, planet, ix, site, folk (plan entry), talks (times talked before), here, known (Set of place ids) }
  // Returns { pages, notes: [{ text, who }], known: [ids] }.
