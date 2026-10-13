// index-inline-2 158 — label
// Lines 72783-73075 of readable/index-inline-2.pretty.js (statement-aligned).
  function serviceTalk(v, p, f, n, withDoing) {
    const s = v.site,
      who = f.name,
      story = state.story,
      ix = ground.siteIx;
    const close = (fn) => ({
      noChronicle: true,
      onClose: (c) => {
        ground.talkTo = null;
        if (c === "chat")
          setTimeout(() => talk({ chat: true, np: G.talkNp }), 0);
        else if (fn) fn(c);
      },
    });
    const pick = (arr) =>
      arr[Math.floor(hash01(f.seed || 1, n, 77) * arr.length)];
    switch (f.role) {
      case "ferryman": {
        if (!s.other) return false;
        if (ground.uniforms.uDark.value > 0.5) {
          openDialog(
            withDoing([
              {
                who,
                text: '"Not in the dark. Nobody crosses in the dark. First light, and I will take you over."',
              },
            ]),
            close(),
          );
          return true;
        }
        const km = s.km || 3,
          hours = Math.max(0.5, km / 6),
          far = bearingWord(s.dir, s.other);
        const fare = 1,
          time =
            hours < 0.8
              ? "Less than an hour"
              : hours < 1.5
                ? "About an hour"
                : `${Math.round(hours)} hours`;
        const lead = n
          ? '"Back again? Over the water?"'
          : pick([
              '"Over the water? That is what I am for."',
              '"Crossing? The water is kind today. Mostly."',
            ]);
        openDialog(
          withDoing([
            {
              who,
              text: `${lead.replace(/"$/, "")} ${cap(far)}, ${km < 2 ? "not far" : `${Math.round(km)} kilometres or so`}. ${time} in the boat. One old coin."`,
              choices: [
                {
                  id: "cross",
                  label: `Cross over (${coinWords(fare)})`,
                  primary: true,
                },
                { id: "chat", label: "Just talk" },
                { id: "no", label: "Not now" },
              ],
            },
          ]),
          close((c) => {
            if (c === "cross")
              setTimeout(() => crossFerry(v, f, fare, hours), 0);
          }),
        );
        return true;
      }
      case "mine foreman": {
        const lead = n
          ? '"Back for another shift? The hill is still here."'
          : '"Looking for work? We can always use another back. Half a day with a pick, and I pay in coin and a share of what comes out."';
        openDialog(
          withDoing([
            {
              who,
              text: lead,
              choices: [
                {
                  id: "work",
                  label: "Work a shift (half a day)",
                  primary: true,
                },
                { id: "trade", label: "Buy ore" },
                { id: "chat", label: "Just talk" },
                { id: "no", label: "Not now" },
              ],
            },
          ]),
          close((c) => {
            if (c === "work") setTimeout(() => mineShift(v, f), 0);
            else if (c === "trade") setTimeout(() => openTrade(p), 0);
          }),
        );
        return true;
      }
      case "guard": {
        const pages = [];
        if (!n)
          pages.push({
            who,
            text: pick([
              '"Halt! ...No, go on. You don’t look like trouble. Not much."',
              '"Who goes there? A walker. Fine. Keep to the road, and keep your eyes open."',
            ]),
          });
        // what is about, on this stretch of the road
        const env = ix.envAt(s.dir),
          what = huntersHere(env.biome, env.T);
        const th = ground.threat || {},
          lv = th.level || 0;
        const news = [];
        if (what)
          news.push(`There are ${what} off the road, more of them after dark.`);
        if (lv >= 2 && story.arc && story.arc.rumor)
          news.push(
            `And worse. They say ${story.arc.rumor.replace(/^the prophecy/, "the prophecy")}.`,
          );
        else if (lv >= 1)
          news.push(
            "There have been raiders on the road at night. Not many. Enough.",
          );
        if (news.length) pages.push({ who, text: `"${news.join(" ")}"` });
        // the bounty: a coin a beast, two for a raider or a soldier, for anything put down since last time
        const B2 = G.bounty || { beasts: 0, men: 0 },
          pay = B2.beasts + 2 * B2.men;
        if (pay > 0) {
          const what2 = [
            B2.beasts ? `${B2.beasts} of the beasts` : "",
            B2.men ? `${B2.men} of the raiders` : "",
          ]
            .filter(Boolean)
            .join(" and ");
          pages.push({
            who,
            text: `"You put down ${what2} since we last saw you? The watch pays for that. ${cap(coinWords(pay))}. Keep it up."`,
          });
          G.pack.add("oldcoin", pay);
          G.bounty = { beasts: 0, men: 0 };
          sfx.play("coin");
          repGain(townNear(s.dir, 80), 2, "hunt");
        } else
          pages.push({
            who,
            text: '"The watch pays for anything put down along this road: a coin for a beast that hunts, two for a raider. Tell us when you have."',
          });
        openDialog(withDoing(pages), close());
        saveLife();
        return true;
      }
      case "priest": {
        const people = s.owner >= 0 ? story.peoples[s.owner] : null,
          faith = people ? people.faith : "the old gods",
          bless = faithBless(faith);
        const st = siteState(s.id),
          today = st.day === dayNum();
        const lead = n
          ? `"${cap(faith)} sees you again. That is a good sign. Usually."`
          : `"Welcome. This is a house of ${faith}. Everyone who comes is welcome here, even those who come with nothing."`;
        const pages = [{ who, text: lead }];
        if (!n && people)
          pages.push({
            who,
            text: `"The ${people.plural} have asked ${faith} for help since before there were roads. Leave something in the bowl, anything that is yours, and ask. ${cap(faith)} does not always answer. But sometimes."`,
          });
        const choices = today
          ? [
              { id: "chat", label: "Just talk" },
              { id: "no", label: "Goodbye", primary: true },
            ]
          : [
              { id: "offer", label: "Leave an offering", primary: true },
              { id: "chat", label: "Just talk" },
              { id: "no", label: "Not now" },
            ];
        pages.push({
          who,
          text: today
            ? '"You have made your offering today. Go well."'
            : `"Will you leave something, and ask ${faith} ${BLESS[bless] ? "for " + BLESS[bless].word : "for help"}?"`,
          choices,
        });
        openDialog(
          withDoing(pages),
          close((c) => {
            if (c === "offer") {
              const sp = v.spots.find((q) => q.kind === "shrine");
              if (sp)
                setTimeout(
                  () => useSite({ kind: "site", view: v, spot: sp }),
                  0,
                );
            }
          }),
        );
        return true;
      }
      case "lightkeeper": {
        const lead = n
          ? pick([
              '"The sea’s quiet today. That means nothing."',
              '"Come to see the lamp again? Go on up."',
            ])
          : '"A visitor! Nobody comes out here but the gulls. Go up and see the lamp, if you like. Mind the stair: there are a hundred and twelve steps, and the hundred and thirteenth is the sea."';
        openDialog(
          withDoing([
            {
              who,
              text: lead,
              choices: [
                { id: "up", label: "Climb up to the lamp", primary: true },
                { id: "chat", label: "Just talk" },
                { id: "no", label: "Not now" },
              ],
            },
          ]),
          close((c) => {
            if (c === "up") setTimeout(() => climbUp(v), 0);
          }),
        );
        return true;
      }
    }
    return false;
  }
  // over the water on the ferry, to the landing on the far side
  function crossFerry(v, f, fare, hours) {
    const s = v.site,
      who = f.name;
    if (G.pack.count("oldcoin") < fare) {
      openDialog(
        [
          {
            who,
            text: '"One old coin. I do not row for love, and I do not row for nothing either."',
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
    G.pack.take("oldcoin", fare);
    sfx.play("coin");
    gotNote(`- ${coinWords(fare)}`);
    const R = ground.R,
      F = frameAt(s.dir),
      Fo = frameAt(s.other);
    const a = stepOn(s.dir, F, Math.sin(s.face) * 26, Math.cos(s.face) * 26, R),
      b = stepOn(
        s.other,
        Fo,
        Math.sin(s.otherFace ?? 0) * 26,
        Math.cos(s.otherFace ?? 0) * 26,
        R,
      );
    const pts = [ground.p.slice(), a, b, s.other.slice()],
      cum = [0];
    for (let k = 0; k < pts.length - 1; k++)
      cum.push(cum[k] + arcM(pts[k], pts[k + 1], R));
    const rt = {
      pts,
      cum,
      total: cum[cum.length - 1],
      seaFrom: cum[1],
      seaTo: cum[2],
    };
    saveLife();
    ground.startJourney(
      { dir: s.other, name: "the far shore" },
      hours / 24,
      () => {
        gToast("The far shore", "the ferry turns for home", 2800);
        G.known.add(
          "fb" === s.id.slice(0, 2)
            ? "fa" + s.id.slice(2)
            : "fb" + s.id.slice(2),
        );
        saveLife();
      },
      (stop) => {
        if (!stop.last) gToast("On the water", `${who} at the oar`, 2200);
      },
      { route: rt, edge: 3, sea: true },
    );
  }
  // half a day in the mine: coin and a share of the ore, and you come up hungry
