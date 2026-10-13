// index-inline-2 151 — ground
// Lines 70757-71090 of readable/index-inline-2.pretty.js (statement-aligned).
  function hermitTalk(v, p) {
    const s = v.site,
      H = hermitOf(state.story, s),
      who = p.info.name,
      st = siteState(s.id),
      first = !st.met;
    st.met = 1;
    const pages = [];
    const say = (t) => pages.push({ who: /^"/.test(t) ? who : null, text: t });
    for (const t of first
      ? HM_QUIRK[H.quirk].hello(H)
      : HM_QUIRK[H.quirk].again(H))
      say(t);
    if (first)
      say(
        '"You’ve come a long way to find nobody. Well: you found somebody. Me."',
      );
    if (!G.pack.has("flute")) {
      for (const t of coarse() ? [FLUTE_GIFT[0], FLUTE_GIFT_TOUCH] : FLUTE_GIFT)
        say(t);
      const left = G.pack.add("boneflute", 1);
      if (left) ground.addDrop("boneflute", left, frontSpot(0.8));
      pages.push({
        who: null,
        text:
          "You have a bone flute." +
          (left ? " (Your hands are full: it is on the ground.)" : ""),
      });
    }
    pages.push({
      who,
      text: first
        ? '"Now. What do you want? Everybody wants something. The crow wants everything."'
        : '"Well? What is it this time?"',
      choices: [
        { id: "learn", label: "Teach me a song", primary: true },
        { id: "draught", label: "Your draughts" },
        { id: "ask", label: "Tell me things" },
        { id: "no", label: "Goodbye" },
      ],
    });
    openDialog(pages, {
      noChronicle: true,
      onClose: (c) => {
        if (c === "learn") hermitSongs(v, p, H);
        else if (c === "draught") hermitDraughts(v, p, H);
        else if (c === "ask") hermitAsk(v, p, H);
        else ground.talkTo = null;
      },
    });
    saveLife();
  }
  function hermitSongs(v, p, H) {
    const who = p.info.name,
      free = !G.songs.size;
    // (the first of the common songs is a gift; morning and the heart never are)
    const opts = H.songs
      .filter((id) => !G.songs.has(id))
      .map((id) => {
        const gift = free && SONG_ORDER.indexOf(id) < 5;
        const pay = gift
          ? []
          : SONG_PRICE[id].find((alt) =>
              alt.every(([i, n]) => G.pack.count(i) >= n),
            );
        return { id, gift, pay: pay || null, can: gift || !!pay };
      });
    if (!opts.length) {
      openDialog(
        [
          {
            who,
            text: '"I’ve nothing left to teach you. Go and find another of us. We’re not hard to find. Well: we are. That’s the point."',
          },
        ],
        {
          noChronicle: true,
          onClose: () => {
            ground.talkTo = null;
          },
        },
      );
      return;
    }
    const lead = opts.some((o) => o.gift)
      ? '"The first one is free. They are all free, really. Don’t tell anyone."'
      : `"Songs aren’t free. Nothing out here is. And I don’t want coin: what would I buy? Rocks? I have rocks."`;
    const choices = opts
      .map((o) => ({
        id: "song:" + o.id,
        label: o.gift
          ? SONGS[o.id].name
          : `${SONGS[o.id].name} (${priceAltWords(SONG_PRICE[o.id])})`,
        primary: o.can,
      }))
      .concat([{ id: "no", label: "Not now" }]);
    const pages = [];
    if (opts.some((o) => o.id === "heart"))
      pages.push({ who, text: HEART_LINES[0] }, { who, text: HEART_LINES[1] });
    pages.push({ who, text: lead, choices });
    openDialog(pages, {
      noChronicle: true,
      onClose: (c) => {
        const o =
          c && String(c).startsWith("song:")
            ? opts.find((q) => "song:" + q.id === c)
            : null;
        if (!o) {
          ground.talkTo = null;
          return;
        }
        if (!o.can) {
          openDialog(
            [
              {
                who,
                text: `"Bring me ${priceAltWords(SONG_PRICE[o.id])}, and the ${SONGS[o.id].name} is yours."`,
              },
            ],
            {
              noChronicle: true,
              onClose: () => {
                ground.talkTo = null;
              },
            },
          );
          return;
        }
        teachSong(v, p, H, o.id, o.pay || []);
      },
    });
  }
  function hermitDraughts(v, p, H) {
    const who = p.info.name,
      coins = G.pack.count("oldcoin");
    const choices = H.draughts
      .map((id) => ({
        id: "buy:" + id,
        label: `${itemName(id)} (${coinWords(buyPrice(id))})`,
        primary: coins >= buyPrice(id),
      }))
      .concat([{ id: "no", label: "Not now" }]);
    const pages = [
      {
        who,
        text: `"Draughts! I brew them in the pot there. What’s in them is my business." ${coins ? 'They eye your purse. "I don’t want coin. The crows do, though. Shiny things."' : '"Coin? You have none. Neither do I. The crows will be disappointed."'}`,
        choices,
      },
    ];
    openDialog(pages, {
      noChronicle: true,
      onClose: (c) => {
        const id =
          c && String(c).startsWith("buy:") ? String(c).slice(4) : null;
        if (!id) {
          ground.talkTo = null;
          return;
        }
        const price = buyPrice(id);
        if (G.pack.count("oldcoin") < price) {
          openDialog(
            [
              {
                who,
                text: `"${coinWords(price)}. For the crows. They’re very particular."`,
              },
            ],
            {
              noChronicle: true,
              onClose: () => {
                ground.talkTo = null;
              },
            },
          );
          return;
        }
        G.pack.take("oldcoin", price);
        const left = G.pack.add(id, 1);
        if (left) ground.addDrop(id, left, frontSpot(0.8));
        sfx.play("coin");
        gotNote(`You get ${countWords(id, 1)}`);
        hermitDraughts(v, p, H);
        saveLife();
      },
    });
  }
  function hermitAsk(v, p, H) {
    const who = p.info.name,
      ix = ground.siteIx,
      arc = state.story.arc,
      heart = arc && (arc.where || arc.lair),
      pages = [];
    if (!H.heart && ix && ix.heartHermit && heart && heart.name) {
      const hs = ix.get(ix.heartHermit.id);
      if (hs) {
        const km = arcM(v.site.dir, hs.dir, ground.R) / 1000,
          way =
            km > 400
              ? `a very long way to the ${bearingWord(v.site.dir, hs.dir)}, across half the world`
              : `to the ${bearingWord(v.site.dir, hs.dir)}, ${km < 34 ? "about a day’s walk" : `${Math.round(km / 28)} days’ walk`}`;
        const HH = hermitOf(state.story, hs);
        pages.push({
          who,
          text: heartRumor(heart.name, `${HH.name} ${HH.title}`, way),
        });
        addNote({
          text: `${who.split(" ")[0]} says the one who knows the Song of the Heart is ${HH.name} ${HH.title}, near ${heart.name}: ${way}.`,
          who: `${who}, a hermit`,
        });
      }
    } else if (H.heart) pages.push({ who, text: HEART_LINES[0] });
    pages.push({ who, text: pickOne(HERMIT_LORE) });
    openDialog(pages, {
      noChronicle: true,
      onClose: () => {
        ground.talkTo = null;
      },
    });
  }

  // ---- the bow: hold to draw, let go to loose ----
  const bowSight = new BowSight($("gBow"));
  $("gShootIcon").src = itemIcon("bow");
  function startDraw(src) {
    if (
      G.draw ||
      !G.on ||
      !G.pack ||
      G.dying ||
      G.sleeping ||
      G.packOpen ||
      G.tradeOpen ||
      G.menu ||
      G.paper ||
      !$("dialog").hidden ||
      ground.journey ||
      ground.ghost
    )
      return false;
    if (!G.pack.tool("bow")) return false;
    if (ground.cave) {
      gotNote("No room to draw a bow down here");
      return false;
    }
    if (!G.pack.arrows()) {
      gotNote("You have no arrows");
      return false;
    }
    if (!ground.bowStart()) return false;
    G.draw = { src };
    sfx.play("draw");
    return true;
  }
  function looseArrow() {
    const d = G.draw;
    G.draw = null;
    if (!d) return;
    const id = G.pack.arrows(),
      bow = G.pack.tool("bow");
    if (!id || !bow) {
      ground.bowCancel();
      return;
    }
    const k = ground.bowLoose(id, ITEMS[id].dmg * blessed().mult);
    if (!k) return;
    sfx.play("loose");
    G.pack.take(id, 1);
    ground.jolt(0.5);
    if (G.pack.wearTool(bow)) {
      setTimeout(() => gotNote("Your bow is worn out. You keep it."), 700);
      dropSpill(G.pack.takeSpill());
    } else if (!G.pack.arrows())
      setTimeout(() => gotNote("That was your last arrow"), 700);
  }
  function cancelDraw() {
    if (G.draw) {
      G.draw = null;
      if (ground) ground.bowCancel();
    }
  }
  $("gShoot").addEventListener("pointerdown", (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (startDraw("touch")) {
      G.drawPtr = e.pointerId;
      try {
        $("gShoot").setPointerCapture(e.pointerId);
      } catch (err) {
        /* fine */
      }
    }
  });
  $("gShoot").addEventListener("pointerup", (e) => {
    if (G.draw && G.draw.src === "touch" && e.pointerId === G.drawPtr)
      looseArrow();
  });
  $("gShoot").addEventListener("pointercancel", () => {
    if (G.draw && G.draw.src === "touch") cancelDraw();
  });
  $("gShoot").addEventListener("contextmenu", (e) => e.preventDefault());

  // ---------- a life: what you carry, your body, what you changed ----------
  const packUI = new PackUI({
    close: () => closePack(),
    act: (k, a) => packAct(k, a),
    describe: (s) => deedWords(s),
  });
  const ember = new Ember($("gEmber"));
  // what a blow looks like: the slash, and where it lands
  const fx = new StrikeFx($("gFx"));
  // how a swing looks, by what you swing: a wide arc, a short quick one, a thrust; in the colour of what it is made of
  function swingLook(id) {
    if (!id) return { kind: "fist", col: [236, 230, 220] };
    const kind = /spear/.test(id)
      ? "thrust"
      : /knife/.test(id)
        ? "small"
        : "wide";
    const col = /^copper/.test(id)
      ? [255, 186, 128]
      : /^bronze/.test(id)
        ? [255, 214, 116]
        : /^ob/.test(id)
          ? [192, 170, 255]
          : /^star/.test(id)
            ? [176, 216, 255]
            : [236, 236, 226];
    return { kind, col };
  }
  function swingFx(id) {
    const L = swingLook(id);
    fx.slash(L.kind, L.col);
  }
  // what flies off what you hit
