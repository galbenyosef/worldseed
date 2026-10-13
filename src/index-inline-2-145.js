// index-inline-2 145 — rec
// Lines 68770-69118 of readable/index-inline-2.pretty.js (statement-aligned).
  function setUpWork(i, kind) {
    const pk = G.pack,
      R = ground.R;
    let best = null,
      full = null;
    for (const rec of G.world.homes || []) {
      const m = arcM(ground.p, rec.dir, R);
      if (m > 40 || (rec.work || []).includes(kind)) continue;
      if (!workRoom(rec.size, homeIsRound(rec), rec.work || [], kind)) {
        full = full || rec;
        continue;
      }
      if (!best || m < best.m) best = { rec, m };
    }
    if (!best) {
      const homes = G.world.homes || [];
      packUI.say(
        !homes.length
          ? "It is built into a house of your own. You have none yet."
          : full
            ? `There is no room for it in your ${HOME_SIZE[full.size].word}. A hut takes two such things at most: have it built bigger.`
            : homes.every((h) => (h.work || []).includes(kind))
              ? `Every house of yours has ${WORK_WORD[kind]} already.`
              : "It is built into a house of yours. Go home first.",
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
      const g = ground,
        hours = { oven: 4, forge: 3, loom: 2 }[kind] || 3;
      g.t += hours / DAY_HOURS;
      rec.work = (rec.work || []).concat([kind]);
      // what stood where it goes
      const foot = g.workFoot ? g.workFoot(rec, kind) : [];
      const inWay = (d) =>
        foot.some((q) => {
          const lx = d.x - q.x,
            lz = d.z - q.z,
            u = lx * q.cs + lz * q.sn,
            w = -lx * q.sn + lz * q.cs;
          return (
            Math.abs(u) < q.hx + 0.2 &&
            Math.abs(w) < q.hz + 0.2 &&
            d.y < q.top + 0.25
          );
        });
      const Z = HOME_SIZE[rec.size],
        chest = (rec.chest || []).map(slotFrom).filter(Boolean),
        over = [],
        keep = [];
      let moved = 0;
      for (const d of rec.decor || []) {
        if (!inWay(d)) {
          keep.push(d);
          continue;
        }
        const q = slotFrom(d.s);
        moved++;
        if (!q) continue;
        if (chest.length < Z.cap) chest.push(q);
        else over.push(d.s);
      }
      if (moved) {
        rec.chest = chest.map(slotRow);
        rec.decor = keep;
      }
      g.homesChanged(rec);
      if (over.length)
        g.addPlaced(
          "bundle",
          g.homeWakeSpot ? g.homeWakeSpot(rec) : frontSpot(0.9),
          Math.random() * 6.28,
          { contents: over, inside: !!g.homeWakeSpot },
        );
      const learned = G.pack.learnHome(kind);
      addNote({
        text: {
          oven: "The house-wright’s crew built an oven into your house. Bread bakes in it, and pies, and waybread for the road; anything a fire can do, it can.",
          forge:
            "The house-wright’s crew built a bench and an anvil into your house. Tools are made and mended there, as often as they need it; with ore and charcoal, copper is beaten into shape on the anvil.",
          loom: "The house-wright’s crew built a loom into your house. Wool is woven into cloth on it, and the cloth into cloaks and hangings.",
        }[kind],
        who: "Your home",
      });
      saveLife();
      setTimeout(
        () =>
          lidsTo(0, 900, () => {
            G.sleeping = false;
            $("eyes").hidden = true;
            gToast(
              WORK_TITLE[kind],
              `built in ${hours} hours${moved ? ". What stood in the way is in the chest" : ""}`,
              3400,
            );
            if (learned) setTimeout(() => noteFresh(), 3600);
          }),
        500,
      );
    });
  }
  // ---- your field and your pen ----
  const sowable = () =>
    CROP_KINDS.filter((k) => G.pack.count(CROPS[k].seed) >= CROPS[k].sow);
  const CROP_SAY = {
    grain: "the grain",
    turnip: "the turnips",
    herbs: "the herbs",
  };
  function fieldVerb(v) {
    const f = v.home && v.home.field;
    if (!f) return null;
    const st = fieldState(f, ground.t);
    if (st.stage === "bare")
      return sowable().length ? "Sow the field" : "Look at the field";
    if (st.stage === "ripe" || st.stage === "over") return CROPS[f.crop].reap;
    return "Look at the field";
  }
  function useField(v) {
    const rec = v.home,
      f = rec && rec.field;
    if (!f) return;
    const st = fieldState(f, ground.t),
      C = CROPS[f.crop];
    if (st.stage === "bare") {
      const can = sowable();
      if (!can.length) {
        openDialog(
          [
            {
              who: null,
              text: "The earth is turned and waiting. Sow it with grain (five handfuls), turnips (two, cut up for the seed in them), or healing herbs (three, roots and all). Farmers sell grain and turnips; herbs grow wild by water.",
            },
          ],
          { noChronicle: true },
        );
        return;
      }
      if (can.length === 1) {
        sowField(v, can[0]);
        return;
      }
      openDialog(
        [
          {
            who: null,
            text: "What will you sow?",
            choices: can
              .map((k, i) => ({
                id: "sow:" + k,
                label: `${cap(CROPS[k].word)} (${countWords(CROPS[k].seed, CROPS[k].sow)})`,
                primary: i === 0,
              }))
              .concat([{ id: "no", label: "Not now" }]),
          },
        ],
        {
          noChronicle: true,
          onClose: (c) => {
            if (c && String(c).startsWith("sow:"))
              sowField(v, String(c).slice(4));
          },
        },
      );
      return;
    }
    if (st.stage === "ripe" || st.stage === "over") {
      reapField(v);
      return;
    }
    const how = {
      sown: `sown, and nothing to see yet but earth. ${cap(ripeWords(st.left))}`,
      sprout: `coming up in rows of green, ${ripeWords(st.left)}`,
      green: `standing green, ${ripeWords(st.left)}`,
    }[st.stage];
    gToast(`Your ${C.word}`, how, 3000);
  }
  function sowField(v, k) {
    const rec = v.home,
      f = rec.field,
      C = CROPS[k];
    if (!f || G.pack.count(C.seed) < C.sow) return;
    G.pack.take(C.seed, C.sow);
    G.sleeping = true;
    $("eyes").hidden = false;
    G.lidK = 0;
    lidsTo(1, 400, () => {
      ground.t += 1 / DAY_HOURS;
      f.crop = k;
      f.sown = ground.t;
      ground.refreshHome(rec);
      saveLife();
      setTimeout(
        () =>
          lidsTo(0, 700, () => {
            G.sleeping = false;
            $("eyes").hidden = true;
            gToast(
              "Sown",
              `${C.word}, row by row. ${cap(ripeWords(C.days))}`,
              3200,
            );
          }),
        300,
      );
    });
  }
  function reapField(v) {
    const rec = v.home,
      f = rec.field,
      C = CROPS[f.crop];
    if (C.tool && !G.pack.tool(C.tool)) {
      gToast("You need a knife", `to cut ${CROP_SAY[f.crop]}`, 2600);
      return;
    }
    const got = harvest(f, ground.t);
    if (!got) return;
    G.sleeping = true;
    $("eyes").hidden = false;
    G.lidK = 0;
    lidsTo(1, 400, () => {
      ground.t += 1.5 / DAY_HOURS;
      const left = G.pack.add(got.id, got.n);
      if (left) ground.addDrop(got.id, left, frontSpot(0.8));
      if (C.tool) {
        const t = G.pack.tool(C.tool);
        if (t && G.pack.wearTool(t))
          setTimeout(
            () =>
              gotNote(
                `Your ${itemName(t.id).toLowerCase()} is worn out. You keep it.`,
              ),
            900,
          );
        dropSpill(G.pack.takeSpill());
      }
      f.crop = null;
      f.sown = 0;
      f.reaped = (f.reaped || 0) + 1;
      if (f.reaped === 1)
        addNote({
          text: `I brought in my first ${C.word} from my own field.`,
          who: "Your home",
        });
      ground.refreshHome(rec);
      sfx.play("nice");
      saveLife();
      setTimeout(
        () =>
          lidsTo(0, 700, () => {
            G.sleeping = false;
            $("eyes").hidden = true;
            gToast(
              got.over ? "What is left of it" : "Brought in",
              `${countWords(got.id, got.n)}${got.over ? ". It had gone over: the birds had the rest" : ""}`,
              3200,
            );
            if (G.pack.fresh.length) setTimeout(() => noteFresh(), 1200);
          }),
        300,
      );
    });
  }
  function troughVerb(v) {
    const pen = v.home && v.home.pen;
    if (!pen) return null;
    return G.pack.count("grain") > 0 && pen.trough < TROUGH_CAP - 0.5
      ? "Put grain in the trough"
      : "Look at the trough";
  }
  function useTrough(v) {
    const rec = v.home,
      pen = rec && rec.pen;
    if (!pen) return;
    stepPen(pen, ground.t);
    const have = G.pack.count("grain"),
      n = Math.min(10, have, Math.floor(TROUGH_CAP - pen.trough));
    if (n <= 0) {
      gToast(
        "The trough",
        `${troughWords(pen)}${pen.trough < 1 ? " Grain in it, and they give twice as much." : ""}`.replace(
          /\.$/,
          "",
        ),
        3000,
      );
      return;
    }
    G.pack.take("grain", n);
    pen.trough += n;
    ground.refreshHome(rec);
    saveLife();
    gToast(
      "Into the trough",
      `${countWords("grain", n)}. ${troughWords(pen)}`,
      3000,
    );
  }
  function coopVerb(v) {
    const pen = v.home && v.home.pen;
    if (!pen) return null;
    stepPen(pen, ground.t);
    const n = penReady(pen).egg || 0;
    return n ? `Take the eggs (${n})` : "Look in the hen house";
  }
  function useCoop(v) {
    const rec = v.home,
      pen = rec && rec.pen;
    if (!pen) return;
    stepPen(pen, ground.t);
    const hens = pen.beasts.filter((b) => b.k === "hen"),
      n = hens.reduce((a, b) => a + b.ready, 0);
    if (!hens.length) {
      gToast("The hen house", "empty. A farmer will sell you hens", 2800);
      return;
    }
    if (!n) {
      gToast(
        "The hen house",
        `no eggs yet. ${hens.length > 1 ? "They" : "She"} will lay by morning${pen.trough < 0.5 ? ", and more with grain in the trough" : ""}`,
        3000,
      );
      return;
    }
    const left = G.pack.add("egg", n);
    if (left) ground.addDrop("egg", left, frontSpot(0.7));
    for (const b of hens) b.ready = 0;
    ground.refreshHome(rec);
    sfx.play("nice");
    saveLife();
    gToast("From the hen house", `${countWords("egg", n)}, still warm`, 2800);
    if (G.pack.fresh.length) setTimeout(() => noteFresh(), 1200);
  }
  function beastVerb(v, sp) {
    const pen = v.home && v.home.pen,
      b = pen && pen.beasts[sp.i];
    if (!b) return null;
    stepPen(pen, ground.t);
    const name = b.n || `the ${BEASTS[b.k].word}`;
    if (b.k === "goat" && b.ready) return `Milk ${name}`;
    if (b.k === "sheep" && b.ready) return `Shear ${name}`;
    return `Look at ${name}`;
  }
