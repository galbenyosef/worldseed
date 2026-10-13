// index-inline-2 156 — math
// Lines 72408-72540 of readable/index-inline-2.pretty.js (statement-aligned).
  function dayUse(tw, sp) {
    const D = tw.dayV;
    if (!D) return;
    const ev = D.ev,
      s = tw.s,
      st = dayRec(tw),
      cast = dayCast(state.story, s, ev),
      b = G.body;
    const people = s.owner >= 0 ? state.story.peoples[s.owner] : null,
      plural = people ? people.plural : "townsfolk";
    const first2 = (n) => String(n).split(" ")[0];
    switch (sp.kind) {
      case "ev:feast": {
        if (!D.on) {
          gToast(
            "Not yet",
            ev.kind === "festival"
              ? "the feast begins in the afternoon"
              : "the wedding feast is later",
            2400,
          );
          return;
        }
        if (st.ate) {
          gToast(
            "You have eaten your fill",
            "there is plenty more, but not for you",
            2400,
          );
          return;
        }
        st.ate = 1;
        b.food = Math.min(100, b.food + 55);
        b.rested = Math.max(b.rested, 600);
        b.hp = Math.min(100, b.hp + 10);
        b.warmth = Math.max(b.warmth, 70);
        const pages =
          ev.kind === "wedding"
            ? [
                {
                  who: null,
                  text: `You squeeze onto the end of a bench. Somebody puts bread in front of you, then meat, then something sweet, and a cup that never seems to get any emptier. ${first2(cast.names[0])} and ${first2(cast.names[1])} go from table to table, thanking everyone for coming, even you.`,
                },
              ]
            : [
                {
                  who: null,
                  text: `The feast of ${cast.faith}: everyone eats together, and nobody pays, and nobody asks who you are. There is bread baked in the shape of things, and roast meat, and the ${plural} sing between mouthfuls.`,
                },
              ];
        if (ev.kind === "festival") {
          const bl = faithBless(cast.faith);
          giveBless(bl, true);
          pages.push({
            who: null,
            text: `Before the fire is lit, the oldest of them blesses everyone at the tables in the name of ${cast.faith}, you as well. (${BLESS[bl].name}: ${BLESS[bl].word}, for a day.)`,
          });
        }
        repGain(s, 2, "feast");
        openDialog(pages, { noChronicle: true });
        saveLife();
        return;
      }
      case "ev:buckets": {
        if (!D.on) {
          gToast(
            "The fire is out",
            st.out
              ? "thanks to everyone at the buckets, you among them"
              : "the house is a black shell",
            2600,
          );
          return;
        }
        lidsTo(1, 300, () => {
          ground.t += 1 / DAY_HOURS;
          st.out = 1;
          b.food = Math.max(0, b.food - 6);
          b.wet = Math.max(b.wet, 0.6);
          b.breath = 30;
          const coin = 2 + Math.floor(Math.random() * 3);
          G.pack.add("oldcoin", coin);
          repGain(s, 5, "fire");
          G.deeds = (G.deeds || [])
            .concat([
              { text: `helped put out a fire in ${s.name}`, day: dayNum() },
            ])
            .slice(-12);
          lidsTo(0, 500, () => {
            $("eyes").hidden = true;
          });
          sfx.play("good");
          openDialog(
            [
              {
                who: null,
                text: "You take your place in the line: a bucket into your hands, full and slopping, and out of them again, and the next, and the next, until your arms burn worse than the house. The roof comes in with a roar. Then the flames are lower, and lower, and then there is only steam and black timbers, hissing.",
              },
              {
                who: cast.names[0],
                text: `"You did not have to do that. You do not even live here." ${first2(cast.names[0])} presses ${coinWords(coin)} into your hand and will not take them back. "The house can be built again. That is what neighbours are for. It seems you are one."`,
              },
            ],
            { noChronicle: true },
          );
          saveLife();
        });
        $("eyes").hidden = false;
        return;
      }
      case "ev:bier": {
        if (st.paid) return;
        st.paid = 1;
        repGain(s, 1, "respects");
        const who = cast.names[0],
          what =
            cast.age === "young"
              ? "young, and the town will not get over it soon"
              : cast.age === "old"
                ? "old, and remembered everything, and told it all, twice"
                : `a ${cast.role}, and good at it`;
        const t = `You stand by the bier a while with the ${plural}. ${first2(who)} was ${what}. Somebody you do not know takes your hand, and holds it, and lets it go.`;
        addNote({
          text: `In ${s.name} I saw ${first2(who)} buried: ${what}.`,
          who: "Seen",
        });
        openDialog([{ who: null, text: t }], { noChronicle: true });
        saveLife();
        return;
      }
    }
  }
  // the day's own people: what they say, and what they let you do
