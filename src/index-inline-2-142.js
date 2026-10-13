// index-inline-2 142 — size
// Lines 67810-68159 of readable/index-inline-2.pretty.js (statement-aligned).
  function buyDeed(who, size, price, owner) {
    const pk = G.pack,
      work = !!WORK_DEED[size],
      word = OUT_DEED[size]
        ? size
        : size === "stall" ||
            size === "field" ||
            size === "pen" ||
            size === "porch"
          ? size
          : size === "tohouse" || size === "tohall"
            ? "deed to build on"
            : work
              ? ITEMS[WORK_DEED[size]].name.replace(/ deed$/, "").toLowerCase()
              : HOME_SIZE[size].word;
    if (pk.coins < price) {
      openDialog(
        [
          {
            who,
            text: `"${work ? cap(WORK_WORD[size]) : `A ${word}`} is ${coinWords(price)}. You have ${pk.coins ? coinWords(pk.coins) : "nothing in your purse"}. Old coin, mind. Sell what you find to a trader, and come back."`,
          },
        ],
        { noChronicle: true },
      );
      return;
    }
    if (pk.slots.length >= pk.size) {
      openDialog(
        [
          {
            who,
            text: '"Your hands are full. Make room for it first. I won’t have a deed of mine dropped in the mud."',
          },
        ],
        { noChronicle: true },
      );
      return;
    }
    pk.take("oldcoin", price);
    if (OUT_DEED[size]) {
      pk.add(OUT_DEED[size], 1);
      const say = {
        well: '"My crew will dig till they find water, line it with stone, and put a roof over it. Sweet water, and cold."',
        hives:
          '"Three good skeps, and the bees in them. Leave them be and they leave you be. When you take the honey, take a torch: smoke makes them dozy."',
        stable:
          '"A dry stable, a manger and a water butt, and a beast for it from the herders: sound in the wind, and used to a saddle. Ride it where you like. It knows its way home."',
        palisade:
          '"Stakes as thick as your leg, sharpened, close set, round the house and everything by it, and a gate. Nobody comes over that in the dark."',
      }[size];
      openDialog(
        [
          {
            who: null,
            text: `${who} counts the coins and scratches the marks into a deed.`,
          },
          { who, text: say },
          {
            who: null,
            text: `You have ${countWords(OUT_DEED[size], 1)}. (At home, pick it in your satchel.)`,
          },
        ],
        { noChronicle: true },
      );
      saveLife();
      return;
    }
    if (work) {
      pk.add(WORK_DEED[size], 1);
      const say = {
        oven: '"A good clay oven on a stone base, and a peel to go with it. Get it hot and keep it hot, and you will never buy bread again."',
        forge:
          '"A bench that will take a beating, and an anvil on a stump beside it. Charcoal for the fire, and ore if you want copper. The rest you will find out, or a smith will tell you."',
        loom: '"An upright loom, warp weights and all, and a stool to sit at it. Wool goes in at the top and cloth comes out at the bottom, if you have the patience."',
      }[size];
      openDialog(
        [
          {
            who: null,
            text: `${who} counts the coins and scratches the marks into a deed.`,
          },
          { who, text: say },
          {
            who: null,
            text: `You have ${countWords(WORK_DEED[size], 1)}. (At home, pick it in your satchel and have it built in.)`,
          },
        ],
        { noChronicle: true },
      );
      saveLife();
      return;
    }
    if (size === "porch" || size === "tohouse" || size === "tohall") {
      pk.add(
        { porch: "deedporch", tohouse: "deedtohouse", tohall: "deedtohall" }[
          size
        ],
        1,
      );
      openDialog(
        [
          {
            who: null,
            text: `${who} counts the coins and scratches the marks into a deed.`,
          },
          {
            who,
            text:
              size === "porch"
                ? '"A deck along the front, a roof over it, a bench by the door. You will wonder how you ever did without it."'
                : `"My crew will take the roof off, put the walls out and the roof back on, and you will hardly know we were there. Everything inside stays yours: what you have set out goes into the chest while we work."`,
          },
          {
            who: null,
            text: `You have ${size === "porch" ? "a porch deed" : "a deed to build on"}. (At home, pick it in your satchel.)`,
          },
        ],
        { noChronicle: true },
      );
      saveLife();
      return;
    }
    if (size === "field" || size === "pen") {
      pk.add(size === "field" ? "deedfield" : "deedpen", 1);
      openDialog(
        [
          {
            who: null,
            text: `${who} counts the coins and scratches the marks of a ${word} into a deed.`,
          },
          {
            who,
            text:
              size === "field"
                ? '"My crew will dig it and fence it, wherever there is room beside your house. The rest is up to you and the weather."'
                : '"A good fence, a shed, a hen house, a trough. What you put in it is your own business. Feed them and they feed you."',
          },
          {
            who: null,
            text: `You have a ${word} deed. (At home, pick it in your satchel and have it put in beside your house.)`,
          },
        ],
        { noChronicle: true },
      );
      saveLife();
      return;
    }
    if (size === "stall") {
      pk.add("deedstall", 1);
      openDialog(
        [
          {
            who: null,
            text: `${who} counts the coins, scratches the marks of a stall and a name into a deed, and seals it.`,
          },
          {
            who,
            text: '"Show that at your door and they will come. The keeper takes a tenth, and is worth it."',
          },
          {
            who: null,
            text: "You have a stall deed. (At home, pick it in your satchel and set it up by your door.)",
          },
        ],
        { noChronicle: true },
      );
      saveLife();
      return;
    }
    pk.add(DEED_OF[size], 1, { tag: owner });
    openDialog(
      [
        {
          who: null,
          text: `${who} counts the coins twice, cuts the marks of a ${word} into the deed, and presses a seal into it.`,
        },
        { who, text: '"There. Somewhere with a view, if you take my advice."' },
        {
          who: null,
          text: `You have a ${word} deed. (Pick it in your satchel and choose where it stands. The door faces you.)`,
        },
      ],
      { noChronicle: true },
    );
    saveLife();
  }
  // putting the deed down: the crew comes, and the house goes up while you wait
  function placeHome(gh) {
    const sl = G.placingSlot;
    const i = sl
      ? G.pack.slots.findIndex(
          (s) => s.id === sl.id && (s.tag ?? null) === (sl.tag ?? null),
        )
      : -1;
    if (i < 0) {
      cancelPlace();
      return;
    }
    const size = SIZE_OF_DEED[sl.id],
      Z = HOME_SIZE[size];
    G.pack.takeSlot(i, 1);
    const rec = newHome(
      "h" + Math.floor(Math.random() * 2e9).toString(36),
      size,
      sl.tag ?? -1,
      gh.dir,
      gh.face,
      dayNum(),
    );
    ground.endGhost();
    G.placing = null;
    G.placingSlot = null;
    $("gPlace").hidden = true;
    $("gPlaceWhy").hidden = true;
    G.sleeping = true;
    $("eyes").hidden = false;
    G.lidK = 0;
    lidsTo(1, 700, () => {
      G.world.homes.push(rec);
      ground.homesChanged(rec);
      G.visited.add(rec.id);
      G.known.add(rec.id);
      const g = ground;
      g.t += Z.hours / DAY_HOURS;
      G.body.food = Math.max(
        Math.min(G.body.food, 20),
        G.body.food - Z.hours * 1.2,
      );
      const first = G.world.homes.length === 1;
      if (first || !G.bed) G.bed = "home:" + rec.id;
      addNote({
        text: `You had a ${Z.word} built, ${styleWords(rec.owner)}.`,
        who: "Your home",
      });
      {
        const tw = townNear(rec.dir, 30),
          r = tw && (G.rep[tw.id] || (G.rep[tw.id] = { n: 0 }));
        if (tw && !r.home) {
          r.home = rec.id;
          repGain(tw, 12, "home");
        }
      }
      saveLife();
      setTimeout(
        () =>
          lidsTo(0, 1100, () => {
            G.sleeping = false;
            $("eyes").hidden = true;
            gToast(
              `Your ${Z.word}`,
              `the crew put it up in ${Z.hours} hours. It is yours`,
              3600,
            );
            if (first)
              setTimeout(
                () => gotNote("You will wake here now, wherever you fall"),
                3800,
              );
          }),
        700,
      );
    });
  }
  // the chest at home
  function openChest(v) {
    const rec = v.home;
    if (!rec || !G.on || G.dying || G.sleeping) return;
    if (G.packOpen) {
      G.packOpen = false;
      packUI.hide();
    }
    const Z = HOME_SIZE[rec.size];
    G.trade = {
      mode: "chest",
      home: rec,
      v,
      chest: (rec.chest || []).map(slotFrom).filter(Boolean),
    };
    G.tradeOpen = true;
    tradeUI.show(G.pack, {
      mode: "chest",
      title: "Your chest",
      sub: `in your ${Z.word}`,
      chest: G.trade.chest,
      cap: Z.cap,
      house: {
        deedId: DEED_OF[rec.size],
        words: `Your ${Z.word}, built ${styleWords(rec.owner)}.`,
      },
    });
  }
  function chestAct(kind, i) {
    const T = G.trade,
      pk = G.pack,
      rec = T.home,
      ch = T.chest,
      cap2 = HOME_SIZE[rec.size].cap;
    if (kind === "take") {
      const c = ch[i];
      if (!c) return;
      const left = pk.add(c.id, c.n, slotExtra(c));
      if (left === c.n) {
        tradeUI.say("No room in your satchel.");
        return;
      }
      tradeUI.say(`You take ${countWords(c.id, c.n - left)}.`);
      if (left) c.n = left;
      else ch.splice(i, 1);
    } else if (kind === "put") {
      const s = pk.slots[i];
      if (!s || ITEMS[s.id].kind === "quest") return;
      const plain = s.wear == null && !s.worn && s.tag == null,
        max = ITEMS[s.id].stack;
      let n = s.n;
      if (plain)
        for (const c of ch) {
          if (!n) break;
          if (
            c.id === s.id &&
            c.wear == null &&
            !c.worn &&
            c.tag == null &&
            c.n < max
          ) {
            const k = Math.min(n, max - c.n);
            c.n += k;
            n -= k;
          }
        }
      while (n > 0 && ch.length < cap2) {
        const k = plain ? Math.min(n, max) : n;
        ch.push({ ...s, n: k });
        n -= k;
      }
      const put = s.n - n;
      if (!put) {
        tradeUI.say("The chest is full.");
        return;
      }
      pk.takeSlot(i, put);
      tradeUI.say(`You put ${countWords(s.id, put)} in the chest.`);
    } else if (kind === "takedown") {
      rec.chest = ch.map(slotRow);
      closeTrade();
      takeDownHome(rec);
      return;
    }
    rec.chest = ch.map(slotRow);
  }
