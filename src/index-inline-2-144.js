// index-inline-2 144 — rec
// Lines 68511-68769 of readable/index-inline-2.pretty.js (statement-aligned).
  function setUpStall(i) {
    const pk = G.pack,
      R = ground.R;
    let best = null;
    for (const rec of G.world.homes || []) {
      if (rec.stall) continue;
      const m = arcM(ground.p, rec.dir, R);
      if (m < 40 && (!best || m < best.m)) best = { rec, m };
    }
    if (!best) {
      const homes = G.world.homes || [];
      packUI.say(
        !homes.length
          ? "It stands by the door of a house of your own. You have none yet."
          : homes.every((h) => h.stall)
            ? "Every house of yours has a stall already."
            : "It goes up by the door of a house of yours. Go home first.",
      );
      return;
    }
    const rec = best.rec;
    pk.takeSlot(i, 1);
    closePack();
    G.sleeping = true;
    $("eyes").hidden = false;
    G.lidK = 0;
    lidsTo(1, 600, () => {
      rec.stall = newStall(ground.t, dayNum());
      ground.homesChanged(rec);
      const g = ground;
      g.t += 2 / DAY_HOURS;
      rec.stall.t = g.t;
      const keeper = folkName(state.story, ground.homeSite(rec), 0);
      addNote({
        text: `A stall stands by your door now. ${keeper} keeps it, for a tenth of what it takes. ${trafficWords(stallInfo(rec).traffic)}`,
        who: "Your home",
      });
      saveLife();
      setTimeout(
        () =>
          lidsTo(0, 900, () => {
            G.sleeping = false;
            $("eyes").hidden = true;
            gToast("Your stall", `${keeper} will keep it, by day`, 3200);
          }),
        500,
      );
    });
  }
  // the field or the pen deed (a porch, a well, hives, a stable, a palisade), at home: the crew digs it, puts it up, builds it on
  const YARD_DONE = {
    field: {
      hours: 3,
      title: "Your field",
      toast: "dug and fenced in {h} hours. Sow it with what you have",
      note: "The house-wright’s crew dug and fenced a field beside your house. Sow it with grain, turnips or healing herbs; it comes up in a few days.",
    },
    pen: {
      hours: 4,
      title: "Your pen",
      toast: "put up in {h} hours, ready for whatever you keep in it",
      note: "The house-wright’s crew put up a pen beside your house, with a shed, a hen house and a trough. Farmers sell hens, goats and sheep to keep in it.",
    },
    porch: {
      hours: 3,
      title: "Your porch",
      toast: "built in {h} hours, a bench by the door",
      note: "The house-wright’s crew built a porch along the front of your house, with a bench by the door.",
    },
    well: {
      hours: 5,
      title: "Your well",
      toast: "dug and lined in {h} hours. The water is cold and sweet",
      note: "The house-wright’s crew dug a well by your house and lined it with stone. The water is cold and sweet, and a field beside it grows the faster for the watering.",
    },
    hives: {
      hours: 1,
      title: "Your hives",
      toast: "on their bench behind the house, the bees settling in",
      note: "Three straw hives stand on a bench behind your house now. Between them the bees fill about a comb of honey a day. Take it with a torch in your hand.",
    },
    stable: {
      hours: 5,
      title: "Your stable",
      toast: "{name} is in it: your own {beast}",
      note: "The house-wright’s crew put up a stable beside your house, and brought a {beast} from the herders to go in it: {name}. Ride it where you like. Get down and it waits for you; go far from it and it finds its own way home.",
    },
    palisade: {
      hours: 6,
      title: "Your palisade",
      toast: "stakes all round and a gate, in {h} hours",
      note: "A palisade stands round your house and everything by it now, with a gate in front of the door. Raiders off the roads will find nothing they can get at.",
    },
  };
  function setUpYard(i, what) {
    const pk = G.pack,
      R = ground.R,
      word = what === "hives" ? "hives" : what;
    let best = null;
    for (const rec of G.world.homes || []) {
      if (rec[what]) continue;
      const m = arcM(ground.p, rec.dir, R);
      if (m < 40 && (!best || m < best.m)) best = { rec, m };
    }
    if (!best) {
      const homes = G.world.homes || [];
      packUI.say(
        !homes.length
          ? "It goes by a house of your own. You have none yet."
          : homes.every((h) => h[what])
            ? `Every house of yours has ${what === "hives" ? "hives" : `a ${word}`} already.`
            : "It goes by a house of yours. Go home first.",
      );
      return;
    }
    const rec = best.rec,
      at =
        what === "field" || what === "pen" || what === "stable"
          ? ground.yardSpot(rec, what)
          : what === "palisade"
            ? ground.palisadeSpot(rec)
            : { ok: true };
    if (!at.ok) {
      packUI.say(
        what === "palisade"
          ? `There is no room for a palisade round your house: ${at.why}`
          : at.why,
      );
      return;
    }
    pk.takeSlot(i, 1);
    closePack();
    G.sleeping = true;
    $("eyes").hidden = false;
    G.lidK = 0;
    lidsTo(1, 600, () => {
      const g = ground,
        D = YARD_DONE[what],
        hours = D.hours;
      g.t += hours / DAY_HOURS;
      let beast = null,
        name = null;
      if (what === "field") rec.field = newField(at.at);
      else if (what === "pen") rec.pen = newPen(at.at, g.t);
      else if (what === "hives") rec.hives = newHives(g.t);
      else if (what === "stable") {
        const seed = (Math.random() * 2 ** 31) >>> 0;
        rec.stable = { at: at.at, seed, name: mountName(seed), out: null };
        name = rec.stable.name;
        beast = (g.ownMount(rec) || { name: "horse" }).name;
      } else rec[what] = true;
      // (a field with a well by it is watered)
      if (rec.field && rec.well) rec.field.wet = true;
      g.homesChanged(rec);
      const fill = (t) =>
        t
          .replace("{h}", hours)
          .replace("{name}", name || "")
          .replace("{beast}", beast || "");
      addNote({ text: fill(D.note), who: "Your home" });
      saveLife();
      setTimeout(
        () =>
          lidsTo(0, 900, () => {
            G.sleeping = false;
            $("eyes").hidden = true;
            gToast(D.title, fill(D.toast), 3400);
          }),
        500,
      );
    });
  }
  // building on: your hut made a house, your house a hall, where it stands (what was set out goes into the chest)
  function setUpGrow(i, to) {
    const from = to === "house" ? "hut" : "house",
      pk = G.pack,
      R = ground.R;
    let best = null;
    for (const rec of G.world.homes || []) {
      if (rec.size !== from) continue;
      const m = arcM(ground.p, rec.dir, R);
      if (m < 40 && (!best || m < best.m)) best = { rec, m };
    }
    if (!best) {
      const homes = G.world.homes || [];
      packUI.say(
        !homes.some((h) => h.size === from)
          ? `It builds a ${from} of yours into a ${to}. You have no ${from}.`
          : `It is built onto a ${from} of yours. Go home first.`,
      );
      return;
    }
    const rec = best.rec,
      chk = ground.growSpot(rec, to);
    if (!chk.ok) {
      packUI.say(chk.why);
      return;
    }
    pk.takeSlot(i, 1);
    closePack();
    G.sleeping = true;
    $("eyes").hidden = false;
    G.lidK = 0;
    lidsTo(1, 700, () => {
      const g = ground,
        Z = HOME_SIZE[to],
        hours = Math.round(Z.hours * 0.6);
      g.t += hours / DAY_HOURS;
      // what was set out, into the chest while they work (and what will not go in, bundled by the door)
      const chest = (rec.chest || []).map(slotFrom).filter(Boolean),
        over = [];
      for (const d of rec.decor || []) {
        const q = slotFrom(d.s);
        if (!q) continue;
        if (chest.length < Z.cap) chest.push(q);
        else over.push(d.s);
      }
      rec.chest = chest.map(slotRow);
      rec.decor = [];
      rec.size = to;
      if (chk.field && rec.field) rec.field.at = chk.field;
      if (chk.pen && rec.pen) rec.pen.at = chk.pen;
      if (chk.stable && rec.stable) rec.stable.at = chk.stable;
      rec._s = null;
      g.homesChanged(rec);
      if (over.length)
        g.addPlaced(
          "bundle",
          g.homeWakeSpot ? g.homeWakeSpot(rec) : frontSpot(0.9),
          Math.random() * 6.28,
          { contents: over, inside: !!g.homeWakeSpot },
        );
      addNote({
        text: `The house-wright’s crew made your ${from} into a ${to}, where it stood.`,
        who: "Your home",
      });
      saveLife();
      setTimeout(
        () =>
          lidsTo(0, 1000, () => {
            G.sleeping = false;
            $("eyes").hidden = true;
            gToast(
              `Your ${to}`,
              `built on in ${hours} hours. What you had set out is in the chest${over.length ? ", and the rest bundled up inside" : ""}`,
              3800,
            );
          }),
        600,
      );
    });
  }
  // built in: an oven, a bench and an anvil, a loom, against a wall of the nearest house of yours with room
  // for it (whatever was set out where it goes, into the chest; what will not go in, bundled up inside)
  const WORK_TITLE = {
    oven: "Your oven",
    forge: "Your bench and anvil",
    loom: "Your loom",
  };
