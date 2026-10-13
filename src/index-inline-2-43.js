// index-inline-2 43 — push
// Lines 16105-16295 of readable/index-inline-2.pretty.js (statement-aligned).
  function siteTalk(ctx) {
    const { story, ix, site: s, folk: f, talks, here, known } = ctx;
    const people = wsPeople(story, s);
    const r = new Rng(hashInt(f.seed || 1, talks + 1, 0x7a1));
    const who = f.name;
    const V = wsVars(story, s, people);
    const pages = [],
      notes = [],
      learned = [];
    const mood = people ? people.mood : "welcoming";
    if (!talks)
      pages.push({
        who,
        text: fill(r.pick(WILD_GREET[mood] || WILD_GREET.welcoming), V),
      });
    // somewhere worth going: nearby, not yet known to you, preferably a wonder
    const told = () => {
      const cands = ix
        .near(s.dir, 24000, "big")
        .filter((o) => o.id !== s.id && o.kind !== "sign");
      let best = null;
      for (const o of cands) {
        const km = o.m / 1000;
        let sc =
          (known.has(o.id) ? 0 : 2.2) +
          ({
            ruin: 1,
            tower: 1,
            circle: 1.1,
            barrow: 0.9,
            hotspring: 1.3,
            bigtree: 1.1,
            battlefield: 0.8,
            peak: 1,
            cave: 1.2,
            inn: 0.8,
            farm: 0.4,
            hamlet: 0.7,
            hut: 0.3,
            tents: 0.5,
            skystone: 2,
            giantbones: 2,
            geysers: 1.9,
            stonegrove: 1.8,
            hermit: 2.4,
            mill: 0.6,
            fishhut: 0.5,
            lighthouse: 1.2,
            mine: 1.1,
            ferry: 1,
            watch: 0.7,
            temple: 1.2,
          }[o.kind] || 0) -
          km / 12 +
          r.float() * 0.9;
        if (!best || sc > best.sc) best = { o, sc };
      }
      return best ? best.o : null;
    };
    const tellWay = (o) => {
      const w = wayWords(ix, s.dir, o, story);
      pages.push({ who, text: `"${w.text}"` });
      notes.push({
        text: w.short,
        who: `${who}, ${f.role}, at ${siteName(story, s)}`,
      });
      learned.push(o.id);
    };
    const topics = [];
    if (!talks) topics.push("way");
    else
      topics.push(
        ...r.shuffle(["way", "lore", "rumor", "role", "town", "way"]),
      );
    const topic = topics[0];
    if (topic === "way") {
      const o = told();
      if (o) {
        const lore = LOCAL_LORE[o.kind];
        tellWay(o);
        if (lore && r.chance(0.6))
          pages.push({
            who,
            text: fill(r.pick(lore), {
              ...V,
              Name: cap(siteName(story, o)),
              name: siteName(story, o),
            }),
          });
      } else
        pages.push({
          who,
          text: '"There’s nothing out there but more of out there."',
        });
    } else if (topic === "lore") {
      const o = ix
        .near(s.dir, 16000, "big")
        .find(
          (q) => q.id !== s.id && LOCAL_LORE[q.kind] && !SITE_LIVED.has(q.kind),
        );
      if (o) {
        pages.push({
          who,
          text: fill(r.pick(LOCAL_LORE[o.kind]), {
            ...V,
            Name: cap(siteName(story, o)),
            name: siteName(story, o),
          }),
        });
        if (!known.has(o.id)) tellWay(o);
      } else
        pages.push({
          who,
          text: fill(r.pick(ROLE_LINES[f.role] || ROLE_LINES.farmer), V),
        });
    } else if (topic === "rumor") {
      const tale = story.tales.length
        ? story.tales[r.int(0, story.tales.length - 1)]
        : null;
      if (tale && r.chance(0.5))
        pages.push({
          who,
          text: `"A walker came through from ${story.settlements[tale.town].name}. ${tale.giver}, ${wsAn(tale.role)} ${tale.role} there, has a strange story going round: ${wsLc(tale.title)}."`,
        });
      else
        pages.push({
          who,
          text: `"${/^the prophecy/.test(story.arc.rumor) ? cap(story.arc.rumor) : "They say " + story.arc.rumor}."`,
        });
    } else if (topic === "town") {
      let best = null;
      for (const t of story.settlements) {
        const km = (wsAng(s.dir, t.dir) * ix.R) / 1000;
        if (!best || km < best.km) best = { t, km };
      }
      if (best) {
        const road = ix.roadNear(s.dir, 3000);
        const txt = `${best.t.name}? ${best.km < 34 ? cap(wsDist(best.km)) : `${Math.max(1, Math.round(best.km / 28))} days’ walk`}, to the ${bearingWord(s.dir, best.t.dir)}.${road ? " The road will take you most of the way." : ""}`;
        pages.push({ who, text: `"${txt}"` });
        notes.push({
          text: txt,
          who: `${who}, ${f.role}, at ${siteName(story, s)}`,
        });
      }
    } else
      pages.push({
        who,
        text: fill(r.pick(ROLE_LINES[f.role] || ROLE_LINES.farmer), V),
      });
    return { pages, notes, known: learned };
  }

  // ---------- things to read and use ----------
  const ARC_IMAGE = {
    dragon:
      "A winged shape above a burning city. Someone has scratched out the city’s name.",
    blight:
      "A tree carved leaf by leaf. Half of its leaves have been chiselled away, carefully, one at a time.",
    siege:
      "Walls, and outside the walls a crowd of little marks like ants. Inside, a single well.",
    sleeper:
      "Waves, and under the waves an eye. Closed. Three bells hang above it.",
    dawn: "Three fires on three hills, and between them a small figure looking up at the sky.",
    sundered: "Two hands clasped. Someone has cut a deep line between them.",
    fading: "A sun with its rays broken off one by one. Only three are left.",
    haunted:
      "A line of figures with lamps, walking away from a battle. None of them have faces.",
  };
  const FELL_IMAGE =
    "A figure falling from the sky with its arms spread wide, trailing fire. Someone has cut a ring around it, and beside the ring, a tally: ";
  const EPITAPH = {
    any: [
      "{Role} of the {plural}. Loved, and missed.",
      "Walked here from {far} and did not walk back.",
      "She kept the fire.",
      "He kept the road.",
      "Taken by {beast}.",
      "Laughed at everything. Even this.",
      "Sleep, and do not dream.",
    ],
    dragon: ["Chosen by lot. Went without being carried."],
    blight: ["Forgot her own name. We did not."],
    siege: ["Fell on the walls."],
    sleeper: ["Drowned, dreaming."],
    dawn: ["Waited for the Dawn. Wait a little longer."],
    sundered: ["Died in the war. Nobody remembers why."],
    fading: ["The frost took him in the eleventh month."],
    haunted: ["Buried deep. Stay down."],
  };
  // ctx: { story, planet, ix, site, spot, state (this place's record), here, day, has: (id, n) => bool }
  // Returns { title, sub, pages, effect }
