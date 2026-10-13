// index-inline-2 153 — arg
// Lines 71442-71766 of readable/index-inline-2.pretty.js (statement-aligned).
  function openPack(tab = "bag") {
    if (G.flute) fluteClose(true);
    if (
      !G.on ||
      !G.pack ||
      G.dying ||
      G.sleeping ||
      G.tradeOpen ||
      ground.journey ||
      !$("dialog").hidden
    )
      return;
    if (ground.ghost) cancelPlace();
    G.packOpen = true;
    sfx.play("open");
    const near = ground.placesNear();
    packUI.show(G.pack, G.body, {
      fire: near.fire,
      bench: near.bench,
      oven: near.oven,
      anvil: near.anvil,
      loom: near.loom,
      tab,
      notes: G.notes,
      home: !!ground.homeHere(),
    });
  }
  // names of newly learned things, for a short note: "cord and a campfire"
  function freshWords(ids) {
    const names = ids.map((id) => {
      const r = RECIPE[id],
        [oid, on] = r.out;
      return r.name ? r.name.toLowerCase() : lowerName(oid, on > 1 ? 2 : 1);
    });
    return names.length < 3
      ? names.join(" and ")
      : `${names.slice(0, 2).join(", ")} and ${names.length - 2} more`;
  }
  function noteFresh(where = "hud") {
    const f = G.pack.takeFresh();
    if (!f.length) return "";
    const w = `New to make: ${freshWords(f)}`;
    if (where === "hud") gotNote(w);
    return w;
  }
  function closePack() {
    if (!G.packOpen) return;
    G.packOpen = false;
    sfx.play("close");
    packUI.hide();
    saveLife();
  }
  function frontSpot(m) {
    const h = -ground.yaw,
      F = frameAt(ground.p);
    return stepOn(ground.p, F, Math.sin(h) * m, Math.cos(h) * m, ground.R);
  }
  function dropSpill(list) {
    for (const s of list || [])
      ground.addDrop(s.id, s.n, frontSpot(0.9), slotExtra(s) || {});
  }
  const SLOT_WORDS = {
    hand: "in your hand",
    off: "in your other hand",
    head: "on your head",
    body: "around your shoulders",
    chest: "on your chest",
    feet: "on your feet",
    back: "on your back",
    belt: "on your belt",
  };
  function packAct(kind, arg) {
    const pk = G.pack,
      ui = packUI;
    // (a place in the satchel; or, to mend it, something you wear or hold)
    const s =
      typeof arg === "number"
        ? pk.slots[arg]
        : arg && arg.bodySlot
          ? pk.body[arg.bodySlot]
          : null;
    switch (kind) {
      case "primary": {
        if (!s) return;
        const it = ITEMS[s.id];
        const k = s.worn
          ? null
          : it.kind === "food"
            ? "eat"
            : it.kind === "draught"
              ? "drink"
              : it.tool === "flute"
                ? "play"
                : it.slot
                  ? "equip"
                  : it.kind === "place"
                    ? "place"
                    : it.kind === "deed"
                      ? it.deed === "stall"
                        ? "stallup"
                        : it.deed === "field" ||
                            it.deed === "pen" ||
                            it.deed === "porch" ||
                            OUT_DEED[it.deed]
                          ? "yardup"
                          : it.deed === "tohouse" || it.deed === "tohall"
                            ? "growup"
                            : it.deed === "oven" ||
                                it.deed === "forge" ||
                                it.deed === "loom"
                              ? "workup"
                              : "place"
                      : null;
        if (k) packAct(k, arg);
        return;
      }
      case "eat": {
        if (!s) return;
        const it = ITEMS[s.id];
        G.body.eat(it.food || 0, it.heal || 0);
        sfx.play("eat");
        pk.take(s.id, 1);
        if (!pk.slots[arg] || pk.slots[arg].id !== s.id) ui.sel = null;
        // raw meat sits badly, now and then
        const bad = it.raw && Math.random() < 0.3;
        if (bad) G.body.hp = Math.max(1, G.body.hp - 4);
        ui.say(
          `You eat ${countWords(s.id, 1)}.` +
            (bad ? " It sits badly. Cooked would have been better." : ""),
        );
        break;
      }
      case "drink": {
        if (!s) return;
        const it = ITEMS[s.id];
        pk.take(s.id, 1);
        if (!pk.slots[arg] || pk.slots[arg].id !== s.id) ui.sel = null;
        giveBless(it.bless, true);
        sfx.play("drink");
        ui.say(
          `You drink ${countWords(s.id, 1).replace(/^a /, "the ")}. ${BLESS[it.bless].name}: ${BLESS[it.bless].word}.`,
        );
        saveLife();
        break;
      }
      case "play":
        if (ground.journey) {
          ui.say(
            "Not on the road. Play it when you have both feet on the ground.",
          );
          break;
        }
        closePack();
        fluteOpen();
        return;
      case "equip": {
        if (!s) return;
        const slot = pk.equip(arg);
        ui.sel = null;
        if (slot) ui.say(`${itemName(s.id)}, ${SLOT_WORDS[slot]}.`);
        dropSpill(pk.takeSpill());
        break;
      }
      case "unequip":
        if (!pk.unequip(arg)) ui.say("There’s no room for it in your satchel.");
        dropSpill(pk.takeSpill());
        break;
      case "drop": {
        if (!s) return;
        if (ground.cave) {
          ui.say("Not down here. You would never find it again in the dark.");
          break;
        }
        pk.slots.splice(arg, 1);
        pk.changed();
        ground.addDrop(s.id, s.n, frontSpot(1.1), slotExtra(s) || {});
        ui.sel = null;
        ui.say(`You put down ${countWords(s.id, s.n)}.`);
        break;
      }
      case "stallup":
        if (s) setUpStall(arg);
        return;
      case "yardup":
        if (s) setUpYard(arg, ITEMS[s.id].deed);
        return;
      case "growup":
        if (s)
          setUpGrow(arg, ITEMS[s.id].deed === "tohouse" ? "house" : "hall");
        return;
      case "workup":
        if (s) setUpWork(arg, ITEMS[s.id].deed);
        return;
      case "display":
        if (s) startDecor(arg);
        return;
      case "place": {
        if (!s) return;
        if (ground.cave) {
          ui.say("Not down here. Wait till you are out under the sky.");
          break;
        }
        G.placing = s.id;
        closePack();
        if (ITEMS[s.id].kind === "deed") {
          G.placingSlot = { id: s.id, tag: s.tag ?? null };
          ground.startGhost("home", {
            size: SIZE_OF_DEED[s.id],
            owner: s.tag ?? -1,
          });
          gotNote("Walk to where it should stand. Its door faces you.");
          return;
        }
        ground.startGhost(ITEMS[s.id].place);
        return;
      }
      case "make": {
        const ctx = ui.flags();
        const res = pk.make(arg, ctx);
        if (!res) {
          const o = pk.state(arg, ctx);
          if (o.missing.length)
            ui.say(`You need ${listWords(o.missing)} more.`);
          else if (o.lack)
            ui.say(
              o.lack === "flint"
                ? "You need flint on you to strike a spark."
                : `You need ${countWords(o.lack, 1)} on you for this.`,
            );
          else if (o.away)
            ui.say(
              o.away === "bench"
                ? "That is made at a work stone. Make one from four stones and set it down."
                : o.away === "fire"
                  ? "That is made by a fire."
                  : `That is made ${PLACES[o.away]}.`,
            );
          else if (o.full)
            ui.say("There’s no room for it. Drop something, or wear a bag.");
          break;
        }
        const what = countWords(res.id, res.n);
        sfx.play("make");
        const fresh = noteFresh("log");
        ui.say(
          `You make ${what}` +
            (SLOT_WORDS[res.where]
              ? `, ${SLOT_WORDS[res.where]}.`
              : res.where === "ground"
                ? ", but it won’t fit, so it goes on the ground."
                : ".") +
            (fresh ? ` ${fresh}.` : ""),
        );
        dropSpill(pk.takeSpill());
        saveLife();
        break;
      }
      case "makeall": {
        const ctx = ui.flags();
        let n = 0,
          last = null;
        while (n < 99) {
          const res = pk.make(arg, ctx);
          if (!res) break;
          last = res;
          n++;
          dropSpill(pk.takeSpill());
        }
        const fresh = noteFresh("log");
        if (last) sfx.play("make");
        if (last)
          ui.say(
            `You make ${countWords(last.id, last.n * n)}.` +
              (fresh ? ` ${fresh}.` : ""),
          );
        saveLife();
        break;
      }
      case "mend": {
        if (!s) return;
        const wasWorn = !!s.worn;
        if (pk.mend(s, ui.flags())) {
          ui.say(
            wasWorn
              ? `You make the ${lowerName(s.id)} good again at your anvil. It is as good as new.`
              : `You mend the ${lowerName(s.id)}. It is as good as new.`,
          );
          sfx.play("make");
        } else ui.say("It can’t be mended here.");
        saveLife();
        break;
      }
      case "fuel":
      case "burn": {
        const f = ui.ctx.fire;
        if (!f) return;
        const id = kind === "burn" ? s && s.id : arg,
          n = id === "stick" && kind === "fuel" ? 2 : 1;
        if (!id || !ITEMS[id].fuel || pk.count(id) < n) return;
        pk.take(id, n);
        // (a hearth or an oven of your own is kept going: whatever you put on it just burns)
        if (f.hearth || f.oven) {
          ui.sel = null;
          ui.say("The fire takes it.");
          break;
        }
        const was = f.fuel || 0;
        f.fuel = Math.min(24, was + ITEMS[id].fuel * n);
        ui.sel = null;
        ui.say(
          was > 0
            ? "The fire takes it."
            : "You strike a spark into it. It catches.",
        );
        break;
      }
      case "note":
        closePack();
        showPaper(true);
        return;
    }
    ui.render();
  }

  // ---- doing things: what is in front of you and what you can do with it ----
