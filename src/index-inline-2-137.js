// index-inline-2 137 — who
// Lines 66166-66498 of readable/index-inline-2.pretty.js (statement-aligned).
  function questGiverTalk(p, town, withDoing) {
    const story = state.story,
      q = questsOf()[p.info.quest];
    if (!q) return;
    const st = questSt(q);
    const place = st === "done" ? null : questPlace(q);
    const res = questTalk(story, q, st, { has: hasPrice, place });
    const pages = withDoing(res.pages.slice());
    if (res.done) {
      questDone(
        q,
        `got ${needLc(q.title)} from ${q.giver.name} of ${q.town.name}`,
      );
      pages.push({ who: null, text: questCount() });
      addNote({
        text: `${cap(q.title)}: ${q.giver.name} in ${q.town.name} gave it to you.`,
        who: "Done",
      });
    } else if (res.met && st !== "met") {
      const rec = questMark(q, "met");
      if (place)
        rec.pl = {
          id: place.id,
          dir: place.dir,
          kind: place.kind,
          name: place.name,
          way: place.way,
        };
      const what =
        q.kind === "relic"
          ? `It lies with the dead in ${place.name}. ${place.way}`
          : q.kind === "vigil"
            ? `Keep watch at ${place ? place.name : "the place"}, from nightfall to dawn, without running. ${place ? place.way : ""}`
            : `${q.giver.name} wants ${q.price === "stories" ? "twelve true things you have learned on the road" : priceWords(q.price)} for it.`;
      addNote({
        text: `${cap(q.title)}: ${what}`.trim(),
        who: `${q.giver.name}, ${town.name}`,
      });
    }
    openDialog(pages, {
      noChronicle: true,
      onClose: (c) => {
        ground.talkTo = null;
        if (c === "questpay") payQuest(q);
      },
    });
    saveLife();
  }
  function payQuest(q) {
    if (questSt(q) === "done" || !hasPrice(q.price)) return;
    if (q.price !== "stories") {
      for (const [id, n] of q.price) G.pack.take(id, n);
      gotNote(`- ${listWords(q.price.map(([id, n]) => ({ id, n })))}`);
    }
    questDone(
      q,
      `struck a bargain with ${q.giver.name} of ${q.town.name} for ${needLc(q.title)}`,
    );
    const pages = questPaid(state.story, q);
    pages.push({ who: null, text: questCount() });
    addNote({
      text: `${cap(q.title)}: ${q.giver.name} in ${q.town.name} kept the bargain.`,
      who: "Done",
    });
    openDialog(pages, { noChronicle: true });
    saveLife();
  }
  // one with a trouble of their own (a town's tale): what it is, and what they know
  function taleGiverTalk(p, town, withDoing) {
    const t = (state.story.tales || []).find(
      (x) => x.key === p.info.tale && x.town === town.id,
    );
    if (!t) {
      openDialog(withDoing([{ who: p.info.name, text: '"Not now."' }]), {
        noChronicle: true,
        onClose: () => {
          ground.talkTo = null;
        },
      });
      return;
    }
    const key = "tale:" + t.key,
      n = G.talks.get(key) || 0;
    G.talks.set(key, n + 1);
    const pages = n
      ? [
          {
            who: p.info.name,
            text: `"${t.hint} That is all anybody knows. Make of it what you like."`,
          },
        ]
      : [
          {
            who: p.info.name,
            text: `"You have heard, then. ${cap(t.title)}."`,
          },
          { who: null, text: t.text },
          { who: p.info.name, text: `"${t.hint}"` },
        ];
    if (!n)
      addNote({
        text: `${cap(t.title)}: ${t.text} ${t.hint}`,
        who: `${p.info.name}, ${town.name}`,
      });
    openDialog(withDoing(pages), {
      noChronicle: true,
      onClose: () => {
        ground.talkTo = null;
      },
    });
  }
  // ---- a vigil: from nightfall to dawn at the place, whatever comes ----
  function vigilStep(dt, ts) {
    const g = ground,
      V = G.vigil;
    if (!V) {
      if (G.vigilAt && ts - G.vigilAt < 1000) return;
      G.vigilAt = ts;
      if (
        g.cave ||
        !$("dialog").hidden ||
        G.menu ||
        G.paper ||
        G.packOpen ||
        G.tradeOpen ||
        G.dying
      )
        return;
      for (const q of questsOf()) {
        if (
          q.kind !== "vigil" ||
          questSt(q) !== "met" ||
          !q.town ||
          arcM(g.p, q.town.dir, g.R) > 40000
        )
          continue;
        const pl = questPlace(q);
        if (!pl) continue;
        const m = arcM(g.p, pl.dir, g.R);
        if (m > 80) {
          if (G.vigilAsk && G.vigilAsk.q === q.id) G.vigilAsk = null;
          continue;
        }
        if (m > 40) continue;
        const sunY = g.uniforms.uSun.value.y,
          f = g.dayFrac ?? 0.5;
        const evening = sunY < 0.12 && (f > 0.55 || f < 0.12),
          fire = !!g.fireNear(g.p, 14);
        const key = `${q.id}:${g.dayNum}:${evening ? 1 : 0}:${fire ? 1 : 0}`;
        if (G.vigilAsk && G.vigilAsk.key === key) return;
        G.vigilAsk = { q: q.id, key };
        offerVigil(q, pl, evening, fire);
        return;
      }
      return;
    }
    // keeping it
    if (g.cave || g.journey) {
      endVigil(false, "gone");
      return;
    }
    const m = arcM(g.p, V.pl.dir, g.R);
    if (m > 60) {
      V.away += dt;
      if (!V.warned) {
        V.warned = true;
        gToast("Do not run", `the vigil is kept at ${V.pl.name}`, 2400);
      }
      if (V.away > 6) {
        endVigil(false, "ran");
        return;
      }
    } else {
      V.away = 0;
      V.warned = false;
    }
    const sunY = g.uniforms.uSun.value.y,
      f = g.dayFrac ?? 0.5,
      hrs = (g.t - V.t0) * DAY_HOURS;
    const morning = sunY > 0.02 && f > 0.15 && f < 0.6;
    if (V.waves > 0 && (morning || hrs > 14)) {
      if (!V.dawn) {
        V.dawn = true;
        gToast("Dawn", "the light comes up. Hold on", 2600);
      }
      if (g.vigilLeft() === 0) endVigil(true);
      return;
    }
    V.next -= dt;
    if (V.next <= 0) {
      V.next = 55 + Math.random() * 25;
      if (g.vigilLeft() < 8) {
        const n = Math.min(
          6,
          2 +
            Math.floor(V.waves / 2) +
            (G.diff === "hard" ? 1 : 0) -
            (G.diff === "easy" && V.waves < 2 ? 1 : 0),
        );
        if (g.vigilWave(V.pl.dir, Math.max(1, n))) V.waves++;
        else V.next = 5;
      }
    }
  }
  function offerVigil(q, pl, evening, fire) {
    const place = cap(pl.name);
    if (!evening) {
      gToast(
        place,
        `where ${q.giver.name} asked you to keep watch. Come back as the sun goes down`,
        3400,
      );
      return;
    }
    const blight = state.story.arc && state.story.arc.kind === "blight";
    if (blight && !fire) {
      openDialog(
        [
          {
            who: null,
            text: `This is the place. The fire has to burn here, from nightfall to dawn. Light one first: three sticks and a flint will do, set down close by. Then keep it, and keep the grey off it.`,
          },
        ],
        { noChronicle: true },
      );
      return;
    }
    openDialog(
      [
        {
          who: null,
          text: `The sun is going down over ${pl.name}. This is where ${q.giver.name} asked you to keep the watch.`,
        },
        {
          who: null,
          text: "Will you stand here until dawn, whatever comes out of the dark?",
          choices: [
            { id: "vigil", label: "Keep the vigil", primary: true },
            { id: "no", label: "Not tonight" },
          ],
        },
      ],
      {
        noChronicle: true,
        onClose: (c) => {
          if (c === "vigil") beginVigil(q, pl);
        },
      },
    );
  }
  function beginVigil(q, pl) {
    if (G.vigil || !G.on) return;
    G.vigil = {
      q: q.id,
      pl,
      t0: ground.t,
      next: 9,
      waves: 0,
      away: 0,
      warned: false,
      dawn: false,
    };
    ground.vigil = G.vigil;
    gToast("The vigil", `stand your ground at ${pl.name} until dawn`, 3400);
  }
  function endVigil(kept, why) {
    const V = G.vigil;
    G.vigil = null;
    if (ground) ground.vigil = null;
    if (!V) return;
    const q = questsOf().find((x) => x.id === V.q);
    if (!kept || !q) {
      if (why !== "quiet")
        gToast(
          why === "ran" ? "You ran" : "The vigil is broken",
          "come back another night, and try again",
          3200,
        );
      return;
    }
    questDone(q, `kept the vigil at ${V.pl.name} from nightfall to dawn`);
    addNote({
      text: `${cap(q.title)}: you kept the vigil at ${V.pl.name}, from nightfall to dawn.`,
      who: "Done",
    });
    openDialog(
      [
        { who: null, text: vigilKept(state.story, q, V.pl.name) },
        { who: null, text: questCount() },
      ],
      { noChronicle: true },
    );
    saveLife();
  }
  // ---------- your name ----------
  // You wake with no name you can remember. Whoever finds you asks, sooner or later: say one, or let them give you one
  // in their own tongue. After that, the people who know you use it.
  const NAME_ASK = [
    '"I never asked. Have you got a name?"',
    '"What do I call you? You have a name, at least?"',
    '"Have you a name? Everybody has a name."',
  ];
  const NAME_MEANS = [
    "“the one the sky dropped”",
    "“fell with the stars”",
    "“found in the morning”",
    "“came down burning”",
    "“the sky’s gift”. Or “the sky’s mistake”. We will see which",
  ];
  const cleanName = (v) => {
    const s = String(v || "")
      .replace(/[^\p{L}\p{M}' -]/gu, "")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 24);
    return s ? s.charAt(0).toUpperCase() + s.slice(1) : "";
  };
  // what you are called, in a sentence (or what they call you when you have no name yet)
  const nameOr = (alt = "stranger") => G.name || alt;
  // the name they would give you, in their own tongue, and what it means
  function offerName(people, seed) {
    const lang = (people && people.lang) || state.story.old;
    const rng = new Rng(hashInt(seed >>> 0, 4401, 17));
    const name = lang ? lang.word(rng, 2, 2) : "Ka’run";
    return {
      name,
      means: NAME_MEANS[Math.floor(rng.float() * NAME_MEANS.length)],
      where: people
        ? `Among the ${people.plural || people.name}`
        : "Where I come from",
    };
  }
  // ask: { who (the one asking, or nobody: you try to remember), people, seed, lead (pages before), onPage, then(line) }
