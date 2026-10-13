// index-inline-2 138 — who
// Lines 66499-66810 of readable/index-inline-2.pretty.js (statement-aligned).
  function askName(o) {
    const ask = o.who
      ? {
          who: o.who,
          text: NAME_ASK[
            Math.floor(hash01(o.seed || 1, 7, 3) * NAME_ASK.length)
          ],
        }
      : { who: null, text: o.prompt || "A name. You must have had one." };
    const pages = (o.lead || []).concat([
      {
        ...ask,
        input: {
          placeholder: "Your name",
          ok: o.who ? "Tell them" : "That was it",
        },
        choices: [
          { id: "forgot", label: o.who ? "I don’t remember" : "Nothing comes" },
        ],
      },
    ]);
    openDialog(pages, {
      noChronicle: true,
      onPage: o.onPage,
      onClose: (c) => {
        const v = c === "input" ? cleanName(dlgInputValue()) : "";
        if (v) {
          G.name = v;
          o.then(
            o.who
              ? { who: o.who, text: `"${v}. Good. I am ${o.who}."` }
              : { who: null, text: `${v}. Yes. That was it.` },
          );
          return;
        }
        if (!o.who) {
          o.then(null);
          return;
        }
        // nobody should go about without a name: they give you one
        const offer = offerName(o.people, o.seed || 1);
        openDialog(
          [
            {
              who: o.who,
              text: `"Then you need one. ${offer.where} we would call you ${offer.name}. It means ${offer.means}. Or call yourself what you like."`,
              input: {
                placeholder: "A name",
                value: offer.name,
                ok: "So be it",
              },
            },
          ],
          {
            noChronicle: true,
            onClose: (c2) => {
              const v2 = c2 === "input" ? cleanName(dlgInputValue()) : "";
              G.name = v2 || offer.name;
              if (G.name === offer.name)
                addNote({
                  text: `${o.who} gave you a name: ${offer.name}. It means ${offer.means.replace(/\. Or .*$/, "")}.`,
                  who: o.who,
                });
              o.then({
                who: o.who,
                text:
                  G.name === offer.name
                    ? `"${G.name} it is. I am ${o.who}."`
                    : `"${G.name}, then. I am ${o.who}."`,
              });
            },
          },
        );
      },
    });
  }

  // ---------- standing: what a town, and the world, thinks of you ----------
  // Earned by what you do for a place: trade there, keep the wilds round it safe, help its people, live close by,
  // sell to it from your stall, and above all do what the world needs (word of that goes everywhere).
  const STANDING = [
    { at: 0, id: "stranger", word: "nobody knows you here yet", up: null },
    {
      at: 10,
      id: "known",
      word: "they know you here",
      up: "they know your name here now",
    },
    {
      at: 30,
      id: "friend",
      word: "a friend of the town",
      up: "you are a friend of the town now",
    },
    {
      at: 70,
      id: "honoured",
      word: "honoured here",
      up: "the town honours you",
    },
  ];
  // at most this much of each kind in a day (trade, the wilds, your stall); the rest come as they come
  const REP_CAP = { trade: 10, hunt: 15, stall: 6 };
  const REP_WHY = {
    wonder: "for the wonders you have found out there",
    trade: "for the trade you bring",
    hunt: "for keeping the wilds round it safe",
    tale: "for helping its people",
    home: "for living close by",
    stall: "for what your stall sells them",
    need: "for what you did for the world",
    feast: "for sitting down to eat with them",
    fire: "for your place in the bucket line",
    respects: "for standing with them at the bier",
  };
  const fameBonus = () => questsDone() * 8;
  const repPoints = (townId) =>
    (G.rep && G.rep[townId] ? G.rep[townId].n : 0) + fameBonus();
  function standingK(townId) {
    const n = repPoints(townId);
    let k = 0;
    STANDING.forEach((x, i) => {
      if (n >= x.at) k = i;
    });
    return k;
  }
  // the town a place answers to, as far as word goes: the nearest within reach
  function townNear(dir, km = 40) {
    let best = null;
    for (const s of state.story.settlements) {
      const m = arcM(dir, s.dir, ground.R);
      if (m < km * 1000 && (!best || m < best.m)) best = { s, m };
    }
    return best ? best.s : null;
  }
  function repGain(town, n, kind) {
    if (!town || !(n > 0) || !G.rep) return;
    const r = G.rep[town.id] || (G.rep[town.id] = { n: 0 });
    if (REP_CAP[kind]) {
      const d = dayNum();
      if (!r.day || r.day.d !== d) r.day = { d, k: {} };
      n = Math.min(n, REP_CAP[kind] - (r.day.k[kind] || 0));
      if (n <= 0) return;
      r.day.k[kind] = (r.day.k[kind] || 0) + n;
    }
    const before = standingK(town.id);
    r.n += n;
    const after = standingK(town.id);
    if (after > before) {
      const st = STANDING[after];
      setTimeout(() => {
        if (G.on) {
          gToast(town.name, st.up, 3400);
          sfx.play("good");
        }
      }, 900);
      addNote({
        text: `${town.name}: ${st.up}, ${REP_WHY[kind] || "for what you have done"}.`,
        who: "Standing",
      });
    }
  }
  // what they say first, once they know you
  const KNOWN_HELLO = [
    (n) => `"${n}! Back again?"`,
    (n) => `"Ah, ${n}. I heard you were about."`,
    (n) => `"${n}, isn’t it? People talk about you."`,
  ];
  const FRIEND_HELLO = [
    (n) => `"${n}! Sit down, sit down. You look half dead."`,
    (n) => `"There you are, ${n}. Everyone has been asking after you."`,
    (n) => `"${n}, my friend. What do you need?"`,
  ];
  function helloFor(town, who) {
    const k = standingK(town.id);
    if (k === 0) return null;
    const n = G.name || "you",
      i = Math.floor(hash01(who.length, dayNum(), town.id) * 3);
    if (k >= 3) {
      const d = G.deeds && G.deeds.length ? G.deeds[G.deeds.length - 1] : null;
      return `"${G.name || "You"}! You honour us.${d ? ` They are still talking about how you ${d.text}.` : ""}"`;
    }
    return (k === 2 ? FRIEND_HELLO : KNOWN_HELLO)[i](n);
  }
  // a need met: word of it goes out, and the town that kept it does not forget
  function questDone(q, deed) {
    const was = questsDone();
    questMark(q, "done");
    if (questsDone() === was) return;
    sfx.play("good");
    repGain(q.town, 25, "need");
    if (deed) {
      G.deeds = (G.deeds || [])
        .concat([{ text: deed, day: dayNum() }])
        .slice(-12);
      G.deedNews = {
        text: deed,
        day: dayNum(),
        n: (G.deedNews ? G.deedNews.n : 0) + 1,
      };
    }
    if (questsDone() === 2)
      setTimeout(() => {
        if (G.on)
          gToast(
            "Word travels",
            "people know your name in towns you have never seen",
            3600,
          );
      }, 4000);
  }
  // prices by standing: a friend gets more for what they sell, and pays less
  const SELL_AT = [0.5, 0.55, 0.6, 0.7],
    BUY_AT = [1, 0.95, 0.9, 0.8],
    RIDE_AT = [1, 1, 0.75, 0.5];
  const sellAt = (s, n, k) => Math.floor(unitValue(s) * n * SELL_AT[k] + 1e-6);
  const buyAt = (id, n, k) =>
    Math.max(
      1,
      Math.ceil(
        (ITEMS[id] ? ITEMS[id].value || 0 : 0) * n * 1.25 * BUY_AT[k] - 1e-6,
      ),
    );
  // walking into a town: what it thinks of you, if anything
  function townCheck(ts) {
    if (G.townAt && ts - G.townAt < 1000) return;
    G.townAt = ts;
    const g = ground;
    let inT = null;
    for (const s of state.story.settlements)
      if (arcM(g.p, s.dir, g.R) < townRadius(s) + 40) {
        inT = s;
        break;
      }
    if ((inT && inT.id) === (G.inTown && G.inTown.id)) return;
    G.inTown = inT;
    if (!inT) return;
    // the great city, the first time you come to it
    if (inT.great && !G.visited.has("city:" + inT.id)) {
      G.visited.add("city:" + inT.id);
      const sub =
        {
          thriving: "the greatest city in the world",
          halfempty: "the greatest city in the world, half of it empty",
          building: "the greatest city in the world, still being built",
        }[inT.great] || "a great city";
      gToast(inT.name, sub, 4200);
      sfx.play("wonder");
      addNote({ text: `You came to ${inT.name}, ${sub}.`, who: "Found" });
      return;
    }
    const k = standingK(inT.id);
    const ev = townDay(state.story, inT, g.dayNum ?? 0),
      tw = g.towns.get(inT.id);
    if (ev && tw && tw.dayV && tw.dayV.on) {
      gToast(inT.name, cap(dayTitle(state.story, inT, ev)), 3400);
      sfx.play(
        ev.kind === "fire" ? "alarm" : ev.kind === "funeral" ? "news" : "nice",
      );
      return;
    }
    if (k > 0)
      gToast(inT.name, (G.name ? `${G.name}: ` : "") + STANDING[k].word, 3000);
  }
  // on the note: where they know you
  function standingHtml() {
    const rows = state.story.settlements
      .map((s) => ({ s, k: standingK(s.id), n: repPoints(s.id) }))
      .filter((o) => o.k > 0 && (G.rep[o.s.id] || questsDone() >= 2))
      .sort((a, b) => b.n - a.n);
    const local = rows.filter((o) => G.rep[o.s.id]).slice(0, 5);
    const everywhere = questsDone() >= 2;
    if (!local.length && !everywhere && !G.name) return "";
    const words = {
      known: "they know me",
      friend: "a friend",
      honoured: "honoured",
    };
    const list = local
      .map((o) => `${esc(o.s.name)} (${words[STANDING[o.k].id]})`)
      .join(", ");
    return `<div class="pencil"><p class="hd">Where they know me:</p><p class="need"><span>${list || (everywhere ? "" : "Nowhere yet.")}${everywhere ? `${list ? ". " : ""}And word of me goes everywhere now.` : ""}</span></p>${G.name ? `<p class="sig">— ${esc(G.name)}</p>` : ""}</div>`;
  }

  // the needs, written in under the note as you go: crossed out when done
  function needsHtml() {
    const qs = questsOf();
    if (!qs.length) return "";
    const rows = qs.map((q) => {
      const st = questSt(q),
        pl =
          st === "met" && (q.kind === "relic" || q.kind === "vigil")
            ? questPlace(q)
            : null;
      let sub;
      if (st === "done") sub = "Done.";
      else if (!st) sub = "Who knows about it? Ask in the towns.";
      else if (st === "heard") sub = `Ask ${q.giver.name}, in ${q.town.name}.`;
      else if (q.kind === "price")
        sub = `${q.giver.name} in ${q.town.name} wants ${q.price === "stories" ? "twelve true things I have learned on the road" : priceWords(q.price)}.`;
      else if (q.kind === "relic")
        sub = pl
          ? `With the dead in ${pl.name}, near ${q.town.name}.`
          : `${q.giver.name} in ${q.town.name} has it.`;
      else
        sub = `A night’s watch at ${pl ? pl.name : "the place"}, near ${q.town.name}, dusk to dawn.`;
      // (crossed out says it is done)
      return `<p class="need${st === "done" ? " done" : ""}"><span>${esc(cap(q.title))}</span>${st === "done" ? "" : `<small>${esc(sub)}</small>`}</p>`;
    });
    const n = questsDone();
    return `<div class="pencil"><p class="hd">${n >= 3 ? "All three. Now:" : "Since then, in pencil:"}</p>${rows.join("")}${n >= 3 ? `<p class="need"><span>${esc(questCount().replace(/^That is all three of the things your note asks for\. /, ""))}</span></p>` : ""}</div>`;
  }
