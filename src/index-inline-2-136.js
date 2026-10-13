// index-inline-2 136 — dir
// Lines 65844-66165 of readable/index-inline-2.pretty.js (statement-aligned).
  function goFar(mode, from, o, keeper, m) {
    let route = null,
      km = o.km;
    if (mode === "sea") {
      const sr = ground.seaRoute(from.dir, o.t.dir);
      if (!sr) {
        openDialog(
          [
            {
              who: keeper,
              text: `"Nobody sails to ${o.t.name} from here. The way round the land is too long, or there is none."`,
            },
          ],
          { noChronicle: true },
        );
        return;
      }
      route = sr.rt;
      km = sr.km;
    } else {
      route = ground.roadRoute(from.id, o.t.id);
      if (!route) return;
      km = route.total / 1000;
    }
    const cost = o.cost ?? farCost(mode, o.km);
    if (payWorth() >= cost) {
      const paid = payCoins(cost);
      gotNote(`- ${listWords(paid)}`);
      sfx.play("coin");
      setOff(mode, o.t, km, route, false, m);
      return;
    }
    const sea = mode === "sea";
    openDialog(
      [
        {
          who: keeper,
          text: `"That is ${cost} old coins to ${o.t.name}, and you have not got it. ${sea ? "But the captains are always short of hands. Work your passage and you go for nothing. It is slower, and it is hard." : "But the caravans always want guards. Walk with them and keep watch at night, and you go for nothing. It is slower, and you walk."}"`,
          choices: [
            {
              id: "work",
              label: sea ? "Work your passage" : "Go as a guard",
              primary: true,
            },
            { id: "no", label: "Not now" },
          ],
        },
      ],
      {
        noChronicle: true,
        onClose: (c) => {
          if (c === "work") setOff(mode, o.t, km, route, true, m);
        },
      },
    );
  }
  function setOff(mode, dest, km, route, work, m) {
    const sea = mode === "sea",
      days = farDays(mode, km, work);
    saveLife();
    ground.startJourney(
      dest,
      days,
      () => {
        G.known.add(dest.id);
        gToast(
          dest.name,
          `${dayWords(days)} ${sea ? "at sea" : "on the road"}`,
          3200,
        );
        if (work) {
          const b = G.body;
          b.food = Math.min(b.food, 32);
          b.breath = Math.min(b.breath, 45);
          b.rested = 0;
          setTimeout(
            () =>
              gotNote(
                sea
                  ? "You worked your passage. You are worn out, and hungry"
                  : "You walked it, and kept watch half of every night. You are worn out",
              ),
            2600,
          );
        }
        saveLife();
      },
      (st) => {
        if (st.last) return;
        const d = Math.max(1, Math.round(st.day * days));
        if (sea) gToast(`Day ${d}`, `at sea, bound for ${dest.name}`, 2200);
        else
          gToast(
            st.camp ? `Night ${d}` : `Day ${d}`,
            st.camp
              ? `camped with the caravan, on the road to ${dest.name}`
              : `${work ? "walking" : "riding"} with the caravan to ${dest.name}`,
            2200,
          );
      },
      { route, sea, mount: !sea && !work ? m : null },
    );
  }

  // ---------- the three needs: who keeps each, where, and how far you have got ----------
  const needLc = (t) => t.charAt(0).toLowerCase() + t.slice(1);
  const needAn = (w) => (/^[aeiou]/i.test(w) ? "an" : "a");
  const questsOf = () => (state.story ? storyQuests(state.story) : []);
  const questSt = (q) => (G.quests[q.id] && G.quests[q.id].st) || null;
  const QUEST_RANK = { heard: 1, met: 2, done: 3 };
  function questMark(q, st) {
    const cur = G.quests[q.id] || (G.quests[q.id] = {});
    if (!cur.st || QUEST_RANK[st] > QUEST_RANK[cur.st]) cur.st = st;
    return cur;
  }
  const questsDone = () =>
    questsOf().filter((q) => questSt(q) === "done").length;
  function questCount() {
    const n = questsDone();
    if (n >= 3) {
      const w =
        state.story.arc && (state.story.arc.where || state.story.arc.lair);
      return `That is all three of the things your note asks for. What is left is ${w && w.name ? w.name : "the far country"} itself.`;
    }
    return n === 1
      ? "That is one of the three things your note asks for."
      : "That is two of the three.";
  }
  // a town with a harbour, or the nearest one with a harbour the roads go to from it
  function portFor(t) {
    if (ground.harbourOf(t)) return t;
    for (const o of ground.townsByRoad(t.id)) {
      const u = state.story.settlements[o.id];
      if (u && ground.harbourOf(u)) return u;
    }
    return null;
  }
  // how to get from one town to another, as somebody there would tell you
  function wayToTown(from, to) {
    if (from.id === to.id)
      return "They live here, by their door near the square.";
    const b = bearingWord(from.dir, to.dir);
    const road = ground.townsByRoad(from.id).find((o) => o.id === to.id);
    const pa = portFor(from),
      pb = portFor(to),
      ha = pa && ground.harbourOf(pa),
      hb = pb && ground.harbourOf(pb);
    const bySea = ha && hb && ha.sea === hb.sea;
    // by the road, unless it goes so far round that a ship is quicker
    const seaDays = bySea
      ? farDays("sea", (arcM(pa.dir, pb.dir, ground.R) / 1000) * 1.25, false) +
        (pa.id === from.id ? 0 : 2) +
        (pb.id === to.id ? 0 : 2)
      : Infinity;
    if (road && (road.km < 28 || farDays("road", road.km, false) <= seaDays))
      return road.km < 28
        ? `${to.name} is less than a day’s walk to the ${b}, along the road.`
        : `${to.name} is ${Math.round(road.km)} km to the ${b} by the road. The caravans that go from here will take you, if you ask at the tavern.`;
    if (bySea) {
      const go =
        pa.id === from.id
          ? "Ships go from here: ask at the tavern"
          : `Take the road to ${pa.name}, and a ship from there`;
      return `${to.name} is ${b} of here, over the sea. ${go}${pb.id === to.id ? "" : `, to ${pb.name}, and then the road inland`}.`;
    }
    return `${to.name} is a long way to the ${b}, and I do not know how anybody gets there. On foot, I suppose.`;
  }
  // where a need is to be met: the cave whose dead keep a relic; the place a vigil is kept (by the keeper's town)
  const VIGIL_KINDS = {
    haunted: ["barrow", "battlefield", "ruin", "circle"],
    sleeper: ["peak", "tower", "circle", "ruin"],
    blight: ["circle", "bigtree", "ruin", "hotspring"],
  };
  const VIGIL_SMALL = {
    haunted: ["grave", "bones"],
    sleeper: ["cairn", "stone"],
    blight: ["shrine", "camp"],
  };
  function placeWay(T, d) {
    const km = arcM(T.dir, d, ground.R) / 1000,
      b = bearingWord(T.dir, d);
    return km < 2
      ? "It is just outside the town."
      : km < 6
        ? `It is an hour or two’s walk to the ${b}.`
        : km < 28
          ? `It is ${Math.round(km)} km to the ${b}, less than a day’s walk.`
          : `It is ${Math.round(km)} km to the ${b}, a few days’ walk.`;
  }
  function questPlace(q) {
    const memo =
      state.story._questPlaces || (state.story._questPlaces = new Map());
    if (memo.has(q.id)) return memo.get(q.id);
    if (q.kind !== "relic" && q.kind !== "vigil") return null;
    // (once you have been told where, it is kept with what you know)
    const told = G.quests[q.id] && G.quests[q.id].pl;
    if (told && told.id && told.dir) {
      memo.set(q.id, told);
      return told;
    }
    if (!q.town || !ground || !ground.siteIx) return null;
    const ix = ground.siteIx,
      T = q.town,
      R = ground.R,
      story = state.story;
    let s = null;
    if (q.kind === "relic") {
      const c = ix
        .near(T.dir, 60000, "big")
        .filter((x) => x.kind === "cave")
        .map((x) => ({ x, m: arcM(T.dir, x.dir, R) }))
        .sort((a, b) => a.m - b.m)[0];
      s = c ? c.x : null;
    } else {
      // somewhere nobody lives close by (no wall or farm to hide behind), and the nearer the better
      const kind = story.arc && story.arc.kind,
        want = VIGIL_KINDS[kind] || ["ruin", "circle", "tower", "barrow"];
      const clear = (x) =>
        !story.settlements.some(
          (t) => arcM(t.dir, x.dir, R) < townRadius(t) + 600,
        ) && !ix.near(x.dir, 450, "all").some((y) => SITE_LIVED.has(y.kind));
      const rank = (list, kinds) =>
        list
          .filter((x) => kinds.includes(x.kind))
          .map((x) => ({
            x,
            k: arcM(T.dir, x.dir, R) + kinds.indexOf(x.kind) * 4000,
          }))
          .sort((a, b) => a.k - b.k)
          .map((o) => o.x);
      for (const x of rank(ix.near(T.dir, 25000, "big"), want))
        if (clear(x)) {
          s = x;
          break;
        }
      if (!s)
        for (const x of rank(
          ix.near(T.dir, 9000, "small"),
          VIGIL_SMALL[kind] || ["cairn", "stone", "shrine"],
        ))
          if (clear(x)) {
            s = x;
            break;
          }
      if (!s)
        for (const x of rank(ix.near(T.dir, 25000, "big"), [
          "ruin",
          "circle",
          "tower",
          "barrow",
          "peak",
          "bigtree",
          "battlefield",
        ]))
          if (clear(x)) {
            s = x;
            break;
          }
    }
    const out = s
      ? {
          id: s.id,
          dir: s.dir.slice(),
          kind: s.kind,
          name: siteName(story, s),
          way: placeWay(T, s.dir),
        }
      : null;
    memo.set(q.id, out);
    return out;
  }
  // the relic of a need, if it lies in this cave (only the needs kept near enough are looked at)
  function relicQuestIn(site, open = true) {
    for (const q of questsOf()) {
      if (q.kind !== "relic" || !q.town || (open && questSt(q) === "done"))
        continue;
      if (arcM(q.town.dir, site.dir, ground.R) > 61000) continue;
      const pl = questPlace(q);
      if (pl && pl.id === site.id) return q;
    }
    return null;
  }
  function hasPrice(price) {
    if (price === "stories") return G.notes.length >= 12;
    return (
      Array.isArray(price) && price.every(([id, n]) => G.pack.count(id) >= n)
    );
  }
  // somebody in a town who knows who keeps one of the needs you have not heard of
  function needRumor(p, town, pages) {
    if (!p.info || !p.info.name) return false;
    const key = `qr:${town.id}:${p.info.name}`;
    if (G.talks.get(key)) return false;
    const q = questsOf().find((x) => x.town && !questSt(x));
    if (!q) return false;
    G.talks.set(key, 1);
    questMark(q, "heard");
    const way = wayToTown(town, q.town),
      here = q.town.id === town.id;
    pages.push({
      who: null,
      text: `You ask about the note in your fist: ${needLc(q.title)}.`,
    });
    pages.push({
      who: p.info.name,
      text: questRumor(state.story, q, way, here),
    });
    addNote({
      text: `${q.giver.name}, ${needAn(q.giver.role)} ${q.giver.role} in ${q.town.name}, knows about ${needLc(q.title)}. ${here ? "" : way}`.trim(),
      who: p.info.name,
    });
    if (!G.notedOnce) {
      G.notedOnce = true;
      pages.push({
        who: null,
        text: "You keep what you were told. (It is in your satchel, under Notes, and on the note itself.)",
      });
    }
    saveLife();
    return true;
  }
  // the keeper of a need
