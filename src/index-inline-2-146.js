// index-inline-2 146 — rec
// Lines 69119-69430 of readable/index-inline-2.pretty.js (statement-aligned).
  function useBeast(v, sp) {
    const rec = v.home,
      pen = rec && rec.pen,
      b = pen && pen.beasts[sp.i];
    if (!b) return;
    stepPen(pen, ground.t);
    const B = BEASTS[b.k],
      name = b.n || `The ${B.word}`;
    if (b.k === "goat" && b.ready) {
      const n = b.ready * B.n,
        left = G.pack.add("milk", n);
      if (left) ground.addDrop("milk", left, frontSpot(0.7));
      b.ready = 0;
      sfx.play("nice");
      saveLife();
      gToast(`${name} gives`, countWords("milk", n), 2600);
      if (G.pack.fresh.length) setTimeout(() => noteFresh(), 1200);
      return;
    }
    if (b.k === "sheep" && b.ready) {
      if (!G.pack.tool("knife")) {
        gToast("You need a knife", `to shear ${name}`, 2600);
        return;
      }
      const n = b.ready * B.n,
        left = G.pack.add("wool", n);
      if (left) ground.addDrop("wool", left, frontSpot(0.7));
      b.ready = 0;
      b.acc = Math.min(b.acc, 0.2);
      sfx.play("nice");
      saveLife();
      gToast(
        `You shear ${name}`,
        `${countWords("wool", n)}. ${name} looks smaller, and cross about it`,
        3000,
      );
      if (G.pack.fresh.length) setTimeout(() => noteFresh(), 1200);
      return;
    }
    const r = Math.random(),
      hungry = pen.trough < 0.5;
    const lines =
      b.k === "goat"
        ? [
            `${name} butts your hand, looking for something to eat.`,
            `${name} chews your sleeve, thinking about it.`,
            `${name} looks at you with its yellow eyes and says nothing at all.`,
          ]
        : b.k === "sheep"
          ? [
              `${name}'s fleece is coming back. In a day or two.`,
              `${name} leans against your legs, warm and heavy.`,
              `${name} looks at you, and at the grass, and goes back to the grass.`,
            ]
          : [`${name} pecks at your boot.`];
    gToast(
      b.n || cap(B.word),
      lines[Math.floor(r * lines.length)] +
        (hungry && r < 0.5
          ? " They would give more with grain in the trough."
          : ""),
      3200,
    );
  }
  // buying one for your pen: the seller brings it round
  function buyBeast(o, T) {
    const pk = G.pack,
      kind = ITEMS[o.id].beast,
      B = BEASTS[kind];
    const pens = (G.world.homes || [])
      .filter((h) => h.pen)
      .map((h) => ({ h, m: arcM(ground.p, h.dir, ground.R) }))
      .sort((a, b) => a.m - b.m);
    if (!pens.length) {
      tradeUI.say(
        `Where would you keep ${kind === "sheep" ? "a sheep" : `a ${B.word}`}? (A house-wright puts up pens beside houses.)`,
      );
      return;
    }
    const at = pens.find((q) => penCount(q.h.pen, kind) < B.max);
    if (!at) {
      tradeUI.say(`Your pen has all the ${B.words} it can take.`);
      return;
    }
    if (pk.coins < o.price) {
      tradeUI.say(
        `That is ${coinWords(o.price)}. You have ${pk.coins ? coinWords(pk.coins) : "nothing in your purse"}.`,
      );
      return;
    }
    pk.take("oldcoin", o.price);
    stepPen(at.h.pen, ground.t);
    const b = addBeast(at.h.pen, kind, ground.t);
    sfx.play("coin");
    repGain(T.town, o.price / 6, "trade");
    tradeUI.say(
      `You buy ${b.n ? `a ${B.word} called ${b.n}` : `a ${B.word}`} for ${coinWords(o.price)}. ${at.m > 300 ? `${b.n || "She"} will be in your pen when you get home.` : "Someone walks her round to your pen."}`,
    );
    if (penCount(at.h.pen, kind) === 1)
      addNote({
        text: `I bought ${b.n ? `a ${B.word}, ${b.n},` : `a ${B.word}`} for my pen.`,
        who: "Your home",
      });
    ground.refreshHome(at.h);
    saveLife();
  }
  // coming home: what is waiting (once each time you come back)
  function farmCheck() {
    for (const rec of G.world.homes || []) {
      if (!rec.field && !rec.pen && !rec.hives) continue;
      const m = arcM(ground.p, rec.dir, ground.R);
      if (m > 200) {
        rec._farmSaid = false;
        continue;
      }
      if (m > 45 || rec._farmSaid) continue;
      rec._farmSaid = true;
      const bits = [];
      if (rec.pen) {
        stepPen(rec.pen, ground.t);
        const r = penReady(rec.pen);
        if (r.egg) bits.push(countWords("egg", r.egg));
        if (r.milk) bits.push("milk to take");
        if (r.wool) bits.push("a fleece to shear");
      }
      if (rec.field) {
        const st = fieldState(rec.field, ground.t);
        if (st.stage === "ripe") bits.push(`${CROP_SAY[rec.field.crop]} ripe`);
        else if (st.stage === "over")
          bits.push(`${CROP_SAY[rec.field.crop]} going over`);
      }
      if (rec.hives) {
        stepHives(rec.hives, ground.t, fieldBloom(rec));
        if (rec.hives.ready >= 3) bits.push("honey in the hives");
      }
      if (bits.length) {
        gToast(
          "At home",
          cap(
            bits.length < 2
              ? bits[0]
              : bits.slice(0, -1).join(", ") + " and " + bits[bits.length - 1],
          ),
          3200,
        );
        break;
      }
    }
  }
  // ---- the well, the hives, your beast ----
  // a cold drink from your own well: your breath back, rested a little (and a little mended, once a day)
  function drawWater(v) {
    const b = G.body,
      rec = v.home,
      day = dayNum();
    b.breath = 100;
    b.winded = false;
    b.rested = Math.max(b.rested, Math.min(100, b.rested + 12));
    const mend = rec.wellDay !== day;
    if (mend) {
      b.hp = Math.min(100, b.hp + 6);
      rec.wellDay = day;
    }
    sfx.play("drink");
    gToast(
      "Your well",
      mend ? "cold and sweet. You drink your fill" : "cold and sweet, as ever",
      2400,
    );
    saveLife();
  }
  const fieldBloom = (rec) => {
    if (!rec.field || !rec.field.crop) return false;
    const st = fieldState(rec.field, ground.t).stage;
    return st === "green" || st === "ripe";
  };
  function hivesVerb(v) {
    const h = v.home && v.home.hives;
    if (!h) return null;
    stepHives(h, ground.t, fieldBloom(v.home));
    return h.ready ? "Take the honey" : "Look at the hives";
  }
  function useHives(v) {
    const rec = v.home,
      h = rec && rec.hives;
    if (!h) return;
    stepHives(h, ground.t, fieldBloom(rec));
    if (!h.ready) {
      gToast(
        "Your hives",
        h.acc > 0.6
          ? "busy, and heavy. Honey tomorrow, or near enough"
          : "busy. The bees come and go; nothing to take yet",
        2800,
      );
      return;
    }
    // (smoke them first: a torch in your hand, and they are too dozy to mind)
    const off = G.pack.held("off"),
      smoke = !!(off && ITEMS[off.id] && ITEMS[off.id].tool === "torch");
    const n = h.ready,
      left = G.pack.add("honey", n);
    if (left === n) {
      gotNote("No room to carry it");
      return;
    }
    h.ready = left;
    sfx.play("pickup");
    if (smoke)
      gToast(
        "Honey",
        `${countWords("honey", n - left)}, taken in the smoke. The bees hardly notice`,
        3000,
      );
    else {
      G.body.hp = Math.max(1, G.body.hp - 7);
      ground.jolt && ground.jolt(0.7);
      gToast(
        "Honey, and stings",
        `${countWords("honey", n - left)}. The bees let you know what they think of it. A torch would have smoked them`,
        3600,
      );
    }
    if (G.pack.fresh.length) setTimeout(() => noteFresh(), 1500);
    ground.refreshHome(rec);
    saveLife();
  }
  // up on your own beast, from its stable or from where it waits
  function rideOut(rec) {
    if (!rec || !rec.stable || ground.riding) return;
    if (G.packOpen) closePack();
    if (!ground.mountUp(rec)) return;
    sfx.play("hoof");
    if (!G.rodeOnce) {
      G.rodeOnce = true;
      setTimeout(
        () =>
          gotNote(
            `Shift to gallop · ${coarse() ? "tap with nothing in front of you" : "E with nothing in front of you"} to get down`,
          ),
        600,
      );
    }
    saveLife();
  }
  // ---- raiders, at night, at a house of yours you are away from (with no palisade round it) ----
  // Every night you are not there, near a road, as the land grows dangerous: now and then they come, and take what
  // they can carry off: the stall's takings and a lot from it, a hen or two, a goat, the honey, something from the chest.
  function raidCheck() {
    const g = ground,
      th = g.threat || {},
      night = Math.floor(g.t);
    for (const rec of G.world.homes || []) {
      const m = arcM(g.p, rec.dir, g.R);
      if (rec.raidN == null || m < 300) rec.raidN = night;
      let rolls = 0;
      while (rec.raidN < night && rolls < 6) {
        rec.raidN++;
        rolls++;
        const pk = Math.min(0.3, (0.05 + 0.03 * (th.level || 0)) * (th.k || 0));
        if (!(pk > 0) || Math.random() >= pk) continue;
        const road = g.siteIx ? g.siteIx.roadNear(rec.dir, 1500) : null;
        if (!road) continue;
        // (and they will try a palisade only now and then: word of it gets round)
        if (rec.palisade) {
          if (rec.raidN - (rec.heldN ?? -99) >= 5) {
            rec.heldN = rec.raidN;
            rec.raidNews = { held: true };
          }
          continue;
        }
        const took = raidTake(rec);
        if (took.length) {
          rec.raidNews = {
            took: ((rec.raidNews && rec.raidNews.took) || [])
              .concat(took)
              .slice(-6),
          };
        }
      }
      if (rec.raidNews && m < 60 && !G.sleeping) {
        const N = rec.raidNews;
        rec.raidNews = null;
        if (N.held) {
          gToast(
            "Your palisade",
            "raiders came to the gate in the night, and went away again",
            3800,
          );
          addNote({
            text: "Raiders came to my gate in the night while I was away. The palisade held, and they went off down the road.",
            who: "Your home",
          });
        } else {
          const w =
            N.took.length < 2
              ? N.took[0]
              : N.took.slice(0, -1).join(", ") +
                " and " +
                N.took[N.took.length - 1];
          gToast("Raiders came", `while you were away. They took ${w}`, 4200);
          addNote({
            text: `While I was away, raiders came off the road in the night and took ${w}. A palisade would keep them out.`,
            who: "Your home",
          });
          sfx.play("alarm");
        }
        ground.refreshHome(rec);
        saveLife();
      }
    }
  }
