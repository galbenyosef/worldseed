// index-inline-2 157 — close
// Lines 72541-72782 of readable/index-inline-2.pretty.js (statement-aligned).
  function dayFolkTalk(p, tw, withDoing) {
    const f = p.info,
      D = tw && tw.dayV;
    if (!D || /^caravan (trader|master)$/.test(f.role) || isTrader(f.role))
      return false;
    const ev = D.ev,
      s = tw.s,
      cast = dayCast(state.story, s, ev),
      who = f.name,
      st = G.world.sites[dayKey(tw)] || {};
    const close = (fn) => ({
      noChronicle: true,
      onClose: (c) => {
        ground.talkTo = null;
        if (fn) fn(c);
      },
    });
    const r = mulberryOf((f.seed || 1) + G.talks.size);
    const pick = (a) => a[Math.floor(r() * a.length)];
    const feastSpot = () => tw.spots.find((q) => q.kind === "ev:feast"),
      bucketSpot = () => tw.spots.find((q) => q.kind === "ev:buckets");
    const a = String(cast.names[0]).split(" ")[0],
      b2 = String(cast.names[1]).split(" ")[0];
    switch (f.tag) {
      case "couple":
        openDialog(
          withDoing([
            {
              who,
              text: pick([
                `"You came! Whoever you are: thank you. Eat, drink. The table is over there."`,
                `"Isn’t it a beautiful day? ${who === cast.names[0] ? b2 : a} says it was going to rain. It didn’t dare."`,
              ]),
            },
          ]),
          close(),
        );
        return true;
      case "guest":
        openDialog(
          withDoing([
            {
              who,
              text: pick([
                `"They have been circling each other since they were children. Everyone knew but them."`,
                `"I give it a year. No, I am joking. Look at them. I give it forever."`,
                '"Try the bread. My sister made the bread. Do not try the stew. I made the stew."',
              ]),
            },
          ]),
          close(),
        );
        return true;
      case "cook": {
        const ch = st.ate
          ? [{ id: "no", label: "Thank you", primary: true }]
          : [
              { id: "eat", label: "Sit and eat", primary: true },
              { id: "no", label: "Not now" },
            ];
        openDialog(
          withDoing([
            {
              who,
              text: st.ate
                ? '"Back for more? There is always more. That is the rule."'
                : '"Sit down, sit down! Today nobody pays, and nobody goes hungry. That is the rule."',
              choices: ch,
            },
          ]),
          close((c) => {
            if (c === "eat") {
              const sp = feastSpot();
              if (sp) setTimeout(() => dayUse(tw, sp), 0);
            }
          }),
        );
        return true;
      }
      case "mourner":
        openDialog(
          withDoing([
            {
              who,
              text: pick([
                `"${a} would have laughed at all of us, standing about with long faces."`,
                `"I knew ${a} all my life. I keep thinking I will see them at the well."`,
                '"Say goodbye, if you like. Everyone may. That is why the bier is out here and not in the hall."',
              ]),
            },
          ]),
          close(),
        );
        return true;
      case "bucket": {
        if (!D.on) {
          openDialog(
            withDoing([
              {
                who,
                text: '"It is out. My arms will not lift a spoon for a week."',
              },
            ]),
            close(),
          );
          return true;
        }
        openDialog(
          withDoing([
            {
              who,
              text: pick([
                '"Don’t just stand there! Take a bucket!"',
                '"Help us! If it gets into the next roof, the whole street goes!"',
              ]),
              choices: [
                { id: "help", label: "Help with the buckets", primary: true },
                { id: "no", label: "Stand back" },
              ],
            },
          ]),
          close((c) => {
            if (c === "help") {
              const sp = bucketSpot();
              if (sp) setTimeout(() => dayUse(tw, sp), 0);
            }
          }),
        );
        return true;
      }
      case "owner":
        openDialog(
          withDoing([
            {
              who,
              text: D.on
                ? '"My house! Everything we have is in there!"'
                : st.out
                  ? '"You were at the buckets. I saw you. I will not forget it."'
                  : '"It is gone. All of it. We will stay with my sister. She will love that."',
            },
          ]),
          close(),
        );
        return true;
      case "dancer": {
        openDialog(
          withDoing([
            {
              who,
              text: pick([
                '"Dance! Nobody is watching. Well. Everybody is watching. Dance anyway!"',
                `"It is the feast of ${cast.faith}! Come round the fire with us!"`,
              ]),
              choices: [
                { id: "dance", label: "Dance", primary: true },
                { id: "no", label: "Not me" },
              ],
            },
          ]),
          close((c) => {
            if (c !== "dance") return;
            setTimeout(() => {
              lidsTo(1, 300, () => {
                ground.t += 1 / DAY_HOURS;
                G.body.rested = Math.max(G.body.rested, 400);
                G.body.breath = 20;
                repGain(s, 1, "feast");
                lidsTo(0, 500, () => {
                  $("eyes").hidden = true;
                });
                gToast(
                  "You dance",
                  "round and round the fire until the stars spin with you",
                  3000,
                );
                saveLife();
              });
              $("eyes").hidden = false;
            }, 0);
          }),
        );
        return true;
      }
      case "musician":
        openDialog(
          withDoing([
            {
              who,
              text: pick([
                '"Any requests? We know the one. We can play it slow or fast."',
                '"My fingers are bleeding and I have never been happier."',
              ]),
            },
          ]),
          close(),
        );
        return true;
      case "farm": {
        if (!farmSells(p)) return false;
        openDialog(
          withDoing([
            {
              who,
              text: pick([
                '"In from the farm with eggs and a few hens. Buying?"',
                /herd/.test(f.role)
                  ? '"Two goats and a sheep, walked all the way in. Somebody buy them before they eat the square."'
                  : '"Grain, turnips, eggs. And a hen or two, if you have somewhere to keep them."',
              ]),
              choices: [
                { id: "trade", label: "Trade", primary: true },
                { id: "no", label: "Not now" },
              ],
            },
          ]),
          close((c) => {
            if (c === "trade") setTimeout(() => openTrade(p), 0);
          }),
        );
        return true;
      }
      case "guard":
        openDialog(
          withDoing([
            {
              who,
              text: pick([
                `"From ${cast.from}, three weeks on the road, and not one of us eaten. Yet."`,
                '"Keep your hands where I can see them. Joking. Mostly."',
              ]),
            },
          ]),
          close(),
        );
        return true;
    }
    return false;
  }
  // ---- the people of the newer places ----
  // the ferry, the mine's foreman, the watch on the road, the priest of a holy place, the lightkeeper: each
  // has something to offer you besides talk. Returns true if they took the conversation.
