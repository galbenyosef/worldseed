// index-inline-2 134 — the
// Lines 65092-65520 of readable/index-inline-2.pretty.js (statement-aligned).
  function talk(opts = {}) {
    if (
      !G.on ||
      G.menu ||
      G.paper ||
      G.tradeOpen ||
      !$("dialog").hidden ||
      ground.journey
    )
      return;
    // (whoever the prompt named, if it named someone)
    const np =
      opts.np ||
      (G.target && G.target.kind === "person" && G.target.np) ||
      ground.nearestPerson(4, 60);
    if (!np) return;
    G.talkNp = np;
    const p = np.person,
      op = G.op;
    // asleep: let them be
    if (p.act === "sleep") {
      gToast("Asleep", asleepLine());
      return;
    }
    ground.talkTo = p;
    // what they are doing just now colours the first thing they say
    const doing = doingLine({ ...p, dayFracAtTalk: ground.dayFrac });
    // in a town that knows you, whoever it is says your name first thing (unless they already do)
    const named = (pages) => {
      if (!np.town || !G.name || !p.info || standingK(np.town.s.id) === 0)
        return pages;
      const i = pages.findIndex(
        (pg) => pg.who === p.info.name && /^"/.test(pg.text),
      );
      if (i < 0 || pages.slice(0, i + 1).some((pg) => pg.text.includes(G.name)))
        return pages;
      const out = pages.slice();
      out[i] = { ...out[i], text: out[i].text.replace(/^"/, `"${G.name}! `) };
      return out;
    };
    const withDoing = (pages) => {
      const pg = named(pages);
      return doing && p.info && p.info.name
        ? [{ who: p.info.name, text: doing }].concat(pg)
        : pg;
    };
    let pages = [],
      hooks = {
        noChronicle: true,
        onClose: (choice) => {
          ground.talkTo = null;
          if (choice === "follow") follow();
          if (choice === "trade") openTrade(p);
        },
      };
    if (p === ground.npc) {
      const name = op.traveller.name;
      if (!G.arrived && op.town) {
        const h = ground.hud(),
          km = h.townM / 1000;
        const way =
          km < 1.5
            ? "right there"
            : `${distPhrase(km, op.travel && op.travel.mode === "sea")}, to the ${bearingWord(ground.p, op.town.dir)}`;
        const onRoad =
          km > 3 &&
          !(op.travel && op.travel.mode === "sea") &&
          ground.routeFor(op.town).road;
        pages.push({
          who: name,
          text: `"${op.town.name}? ${cap(way)}.${onRoad ? " Find the road and it takes you there." : ""}"`,
        });
        if (G.diff === "hard")
          pages.push({
            who: name,
            text: '"I told you. I am not going that way. But I will wish you luck, for free."',
          });
        else
          pages.push({
            who: name,
            text: '"Say the word and we go. I know the way."',
            choices: [
              { id: "follow", label: "Let’s go", primary: true },
              { id: "stay", label: "Not yet" },
            ],
          });
      } else
        pages.push({
          who: name,
          text: '"Go on. The world won’t wait for you."',
        });
    } else if (np.site) {
      const v = np.site,
        s = v.site,
        f = p.info,
        key = s.id + ":" + f.k;
      p.met = true;
      if (f.lostTale) {
        talkLost(v, p, f);
        return;
      }
      if (s.kind === "home") {
        if (f.keeper) stallTalk(v, p);
        else ground.talkTo = null;
        return;
      }
      if (s.kind === "hermit") {
        hermitTalk(v, p);
        return;
      }
      if (
        G.begin &&
        G.begin.kind === "roof" &&
        G.begin.site === s.id &&
        f.k === 0 &&
        G.begin.st === "owe"
      ) {
        roofTalk(v, p, withDoing);
        return;
      }
      const n = G.talks.get(key) || 0;
      G.talks.set(key, n + 1);
      const ix = ground.siteIx,
        story = state.story;
      // something carried here for this person?
      const dl =
        f.k === 0
          ? talesAt("deliver", s.id).find((t) => G.tales[t.id].st === "on")
          : null;
      if (dl && G.pack.count("parcel") > 0) {
        G.pack.take("parcel", 1);
        G.tales[dl.id].st = "done";
        sfx.play("nice");
        repGain(townNear(s.dir, 60), 6, "tale");
        pages = deliverThanks(story, ix, dl);
        pages.push({ who: null, text: giveReward(dl) });
        addNote({
          text: `You took ${dl.thing} to ${dl.to} at ${siteName(story, s)}, from ${dl.giver.name}.`,
          who: "Done",
        });
        openDialog(pages, hooks);
        saveLife();
        return;
      }
      // this person's own tale
      const t = f.k === 0 ? taleFor(story, ix, s) : null;
      const ts = t ? G.tales[t.id] : null;
      if (t && !ts) {
        const res = siteTalk({
          story,
          planet: state.planet,
          ix,
          site: s,
          folk: f,
          talks: n,
          here: ground.p,
          known: G.known,
        });
        const off = taleOffer(story, ix, s, t);
        pages = (n ? [] : res.pages.slice(0, 1)).concat(off.pages);
        // (someone who sells things will still sell you them, trouble or no trouble)
        if (isTrader(f.role) || farmSells(p)) {
          const lp = pages[pages.length - 1];
          if (lp && lp.choices)
            lp.choices = lp.choices.concat([
              { id: "trade", label: "Just trade" },
            ]);
        }
        hooks.onClose = (choice) => {
          ground.talkTo = null;
          if (choice === "accept") startTale(t, s, off.note);
          else if (choice === "trade") openTrade(p);
        };
        openDialog(pages, hooks);
        return;
      }
      if (t && ts.st !== "done") {
        const done =
          t.kind === "fetch"
            ? G.pack.count(t.need[0]) >= t.need[1]
            : t.kind === "lost"
              ? ts.st === "found"
              : t.kind === "offer"
                ? ts.st === "left"
                : t.kind === "recover"
                  ? ts.got && G.pack.count("heirloom") > 0
                  : false;
        if (!done) {
          const rem = taleRemind(story, ix, s, t);
          if (isTrader(f.role) || farmSells(p))
            rem.push({
              who: f.name,
              text: '"Anything else, while you are here?"',
              choices: [
                { id: "trade", label: "Trade", primary: true },
                { id: "no", label: "Not now" },
              ],
            });
          openDialog(rem, hooks);
          return;
        }
        if (t.kind === "fetch") G.pack.take(t.need[0], t.need[1]);
        if (t.kind === "recover") G.pack.take("heirloom", 1);
        ts.st = "done";
        sfx.play("nice");
        repGain(townNear(s.dir, 60), 6, "tale");
        const rw = pickReward(t, ownsGear);
        pages = taleThanks(story, ix, s, t, rw);
        pages.push({ who: null, text: giveReward(t, rw) });
        addNote({
          text: `${t.giver.name} at ${siteName(story, s)} thanked you.`,
          who: "Done",
        });
        if (t.kind === "lost") ground.refreshSite(s.id);
        openDialog(pages, hooks);
        saveLife();
        return;
      }
      // the ferry, the mine, the watch, the holy places, the light: their own business with you
      if (!opts.chat && serviceTalk(v, p, f, n, withDoing)) return;
      const res = siteTalk({
        story,
        planet: state.planet,
        ix,
        site: s,
        folk: f,
        talks: n,
        here: ground.p,
        known: G.known,
      });
      pages = withDoing(res.pages);
      for (const nt of res.notes) addNote(nt);
      for (const id of res.known) G.known.add(id);
      if (res.notes.length && !G.notedOnce) {
        G.notedOnce = true;
        pages.push({
          who: null,
          text: "You keep what you were told. (It is in your satchel, under Notes.)",
        });
      }
      // folk along the way can show you what they know how to make
      const rid = ROLE_TEACH[f.role];
      if (n >= 1 && rid && RECIPE[rid] && !G.pack.known.has(rid) && TEACH[rid])
        pages.push(...teachPages(f.name, rid));
      // an innkeeper buys and sells too
      if (isTrader(f.role))
        pages.push({
          who: f.name,
          text: `"${n ? "Anything else?" : "And if you have anything to sell, I buy. Half what it is worth, and fair."}"`,
          choices: [
            { id: "trade", label: "Trade", primary: true },
            { id: "no", label: "Not now" },
          ],
        });
      else if (farmSells(p))
        pages.push({
          who: f.name,
          text: /herd/.test(f.role)
            ? `"${n ? "A goat? A sheep? We have more than the grass will feed." : "If you have a pen of your own, we can spare a goat or a sheep. More than the grass will feed, this year."}"`
            : `"${n ? "Anything from the farm?" : "Anything from the farm? Eggs, grain, turnips to put in the ground. And if you have a pen, hens, and a goat I would not miss."}"`,
          choices: [
            { id: "trade", label: "Trade", primary: true },
            { id: "no", label: "Not now" },
          ],
        });
    } else {
      p.met = true;
      // the ones who keep one of the world's needs, and the ones with a trouble of their own
      if (p.info && p.info.quest != null) {
        questGiverTalk(p, np.town.s, withDoing);
        return;
      }
      if (p.info && p.info.tale) {
        taleGiverTalk(p, np.town.s, withDoing);
        return;
      }
      if (
        p.info &&
        p.info.day &&
        !opts.chat &&
        dayFolkTalk(p, np.town, withDoing)
      )
        return;
      if (p.info && p.info.role === "smith") {
        smithTalk(p, withDoing);
        return;
      }
      if (p.info && p.info.role === "house-wright") {
        wrightTalk(p, withDoing);
        return;
      }
      if (p.info && isTrader(p.info.role) && !opts.chat) {
        traderTalk(p, withDoing);
        return;
      }
      // once a town knows you, they say hello like it
      const said = state.story.talk(np.town.s, p.info, ground.p),
        hello = helloFor(np.town.s, p.info.name || "");
      if (hello && said.length) said[0] = { who: said[0].who, text: hello };
      // what kind of day it is: everybody has something to say about it, once
      const dv = np.town.dayV;
      if (
        dv &&
        dv.on &&
        !G.talks.get(`dayline:${np.town.s.id}:${dv.ev.day}:${p.info.name}`)
      ) {
        G.talks.set(`dayline:${np.town.s.id}:${dv.ev.day}:${p.info.name}`, 1);
        const line = dayLine(
          state.story,
          np.town.s,
          dv.ev,
          dv.ev.kind === "fire",
          Math.random,
        );
        if (line)
          said.splice(Math.min(1, said.length), 0, {
            who: p.info.name,
            text: line,
          });
      }
      pages = withDoing(said);
      // the latest news of the story, while it is fresh (a few days), once from each of them
      if (
        G.news &&
        G.news.gossip &&
        dayNum() - G.news.day <= 4 &&
        !G.talks.get(`news:${G.news.n}:${p.info.name}`)
      ) {
        G.talks.set(`news:${G.news.n}:${p.info.name}`, 1);
        pages.push({
          who: p.info.name,
          text: `"Have you heard? ${cap(G.news.gossip)}."`,
        });
      }
      // and word of what you did (to your face, if they know you; otherwise as news of somebody else)
      if (
        G.deedNews &&
        dayNum() - G.deedNews.day <= 6 &&
        !G.talks.get(`deed:${G.deedNews.n}:${p.info.name}`)
      ) {
        G.talks.set(`deed:${G.deedNews.n}:${p.info.name}`, 1);
        pages.push({
          who: p.info.name,
          text:
            standingK(np.town.s.id) > 0
              ? `"They say you ${G.deedNews.text}. Is it true? ...I knew it."`
              : `"Have you heard? Somebody ${G.name ? `called ${G.name}` : "nobody knows"} ${G.deedNews.text}. Fell out of the sky, they say."`,
        });
      }
      // what the note in your fist asks for: each new face you ask tells you who knows about the next of them you have not heard of
      const told = needRumor(p, np.town.s, pages);
      // the first time you talk to anyone in a town: who buys, and who builds
      const tipKey = "tip:" + np.town.s.id;
      if (told) {
        /* enough for one conversation */
      } else if (!G.talks.get(tipKey) && np.town.plan) {
        const tr = np.town.plan.folk.find((f) => isStallTrader(f.role)),
          wr = np.town.plan.folk.find((f) => f.role === "house-wright");
        const bits = [];
        if (tr)
          bits.push(
            `If you have things to sell, ${tr.name} at the stall on the square buys anything worth a coin.`,
          );
        if (wr)
          bits.push(
            `And ${wr.name} builds houses, if you ever want a roof of your own. Look for the sign with a house on it.`,
          );
        if (bits.length) {
          G.talks.set(tipKey, 1);
          pages.push({
            who: p.info.name,
            text: `"${bits.join(" ").replace(/^And /, "")}"`,
          });
        }
      } else if (!G.talks.get("wild:" + np.town.s.id)) {
        // the next time: what hunts out there, and how to keep it off
        const S = {};
        state.planet.ground.sample(
          np.town.s.dir[0],
          np.town.s.dir[1],
          np.town.s.dir[2],
          6,
          S,
        );
        const what = huntersHere(S.biome, S.T);
        if (what) {
          G.talks.set("wild:" + np.town.s.id, 1);
          pages.push({
            who: p.info.name,
            text: `"Mind yourself out past the fields, after dark most of all. There are ${what} out there. They will not come into town, or near a farm or an inn, and none of them likes a fire. Keep one going if you sleep out, and keep something sharp to hand."`,
          });
        }
      } else if (!G.talks.get("hermit:" + np.town.s.id)) {
        // the time after: the odd one who lives out past everything, if there is one within a few days
        G.talks.set("hermit:" + np.town.s.id, 1);
        const hm = hermitNear(np.town.s);
        if (hm) {
          const km = hm.m / 1000,
            way = `${km < 34 ? "about a day’s walk" : `${Math.round(km / 28)} days’ walk`} to the ${bearingWord(np.town.s.dir, hm.dir)}`;
          const HH = hermitOf(state.story, hm);
          pages.push({
            who: p.info.name,
            text: `"There’s an odd one lives out past everything, ${way}. ${HH.name}, they call themselves. Purple smoke, some days, out of a crooked tower. Nobody goes. Well: somebody fell out of the sky, so maybe you will. They say ${HH.name} knows songs that do things."`,
          });
          addNote({
            text: `${HH.name}, a hermit, lives ${way} of ${np.town.s.name}, in a crooked tower. Look for purple smoke.`,
            who: `${p.info.name}, in ${np.town.s.name}`,
          });
          G.known.add(hm.id);
        }
      }
      // townsfolk show you something the land alone won't teach
      if (!told && !p.taught && G.pack) {
        const r =
          Object.values(RECIPE).find(
            (x) => x.teach === true && !G.pack.known.has(x.id),
          ) ||
          Object.values(RECIPE).find(
            (x) => x.teach && TEACH[x.id] && !G.pack.known.has(x.id),
          );
        if (r) {
          p.taught = true;
          pages.push(...teachPages(p.info.name, r.id));
        }
      }
    }
    openDialog(pages, hooks);
  }
  // the roof you came through: six logs for new beams, and you are square
