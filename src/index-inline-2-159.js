// index-inline-2 159 — ground
// Lines 73076-73267 of readable/index-inline-2.pretty.js (statement-aligned).
  function mineShift(v, f) {
    const b = G.body,
      who = f.name,
      done = {
        noChronicle: true,
        onClose: () => {
          ground.talkTo = null;
        },
      };
    if (ground.uniforms.uDark.value > 0.5) {
      openDialog(
        [{ who, text: '"The day shift is done. Come back in the morning."' }],
        done,
      );
      return;
    }
    if (b.hp < 30 || b.food < 15) {
      openDialog(
        [
          {
            who,
            text: '"Not like that. You would drop where you stand. Eat something, and come back."',
          },
        ],
        done,
      );
      return;
    }
    const hammer = G.pack.tool("hammer");
    lidsTo(1, 300, () => {
      ground.t += 5 / DAY_HOURS;
      b.food = Math.max(0, b.food - 24);
      b.breath = 40;
      b.wet = 0;
      const coin = 2 + (hammer ? 1 : 0) + (Math.random() < 0.4 ? 1 : 0),
        ore = 1 + (hammer ? 1 : 0) + (Math.random() < 0.25 ? 1 : 0);
      G.pack.add("oldcoin", coin);
      const left = G.pack.add("ore", ore);
      if (left) ground.addDrop("ore", left, frontSpot(0.8));
      if (hammer && G.pack.wearTool(hammer))
        setTimeout(() => gotNote("Your hammer is worn out. You keep it."), 900);
      dropSpill(G.pack.takeSpill());
      const crystal = Math.random() < 0.12;
      if (crystal) {
        const l2 = G.pack.add("crystal", 1);
        if (l2) ground.addDrop("crystal", 1, frontSpot(0.8));
      }
      lidsTo(0, 500, () => {
        $("eyes").hidden = true;
      });
      sfx.play("coin");
      openDialog(
        [
          {
            who: null,
            text: `Five hours in the dark, by lamplight, breaking rock and hauling it out to the light in baskets. ${hammer ? "Your own hammer earns you a bigger share." : "They lend you a pick. It does not like you."}`,
          },
          {
            who,
            text: `"Not bad, for somebody who fell out of the sky. Here: ${coinWords(coin)}, and ${countWords("ore", ore)}${crystal ? ", and you can keep the crystal you found. Do not tell the others" : ""}."`,
          },
        ],
        done,
      );
      repGain(townNear(v.site.dir, 80), 1, "work");
      saveLife();
    });
    $("eyes").hidden = false;
  }
  // a bell on a post at a ferry landing: it carries over the water, and the ferryman comes (by day)
  function ringBell(v) {
    sfx.play("chime");
    setTimeout(() => sfx.play("chime"), 380);
    const fm = v.folk.find((q) => q.info && q.info.role === "ferryman");
    if (ground.uniforms.uDark.value > 0.5) {
      gToast(
        "The bell rings out over the water",
        "nobody comes until morning",
        2800,
      );
      return;
    }
    gToast(
      "The bell rings out over the water",
      fm && fm.mesh.visible
        ? `${fm.info.name} is right here`
        : "somebody is coming down to the boat",
      2800,
    );
  }
  // ---- fishing ----
  // water just in front of you, and you on its edge
  function waterAhead() {
    const g = ground,
      R = g.R,
      p = g.p,
      F = frameAt(p),
      h = -g.yaw;
    const gh = g.ground.height(p[0], p[1], p[2], 1);
    if (gh < -1.1) return false;
    // (shallow at your feet is fine; a little way out it must be water)
    const at = (m) => {
      const q = stepOn(p, F, Math.sin(h) * m, Math.cos(h) * m, R);
      return g.ground.height(q[0], q[1], q[2], 1);
    };
    if (at(2.5) > 0.25 || at(5.5) > -0.3) return false;
    return g.pitch < 0.35;
  }
  function fishAct() {
    const F = G.fishing;
    if (F && F.bite) {
      landFish();
      return;
    }
    if (F) return;
    const line = G.pack.tool("fishing");
    if (!line) return;
    G.fishing = {
      t: 0,
      wait: 4 + Math.random() * 9,
      p: ground.p.slice(),
      yaw: ground.yaw,
      bite: 0,
    };
    gotNote("You cast your line out over the water");
    sfx.play("swing");
  }
  // waiting: keep still, and watch the line; when it bites, pull (E) before it gets away
  function fishStep(dt, ts) {
    const F = G.fishing,
      g = ground;
    if (!F) return;
    if (
      arcM(F.p, g.p, g.R) > 0.7 ||
      Math.abs(Math.atan2(Math.sin(g.yaw - F.yaw), Math.cos(g.yaw - F.yaw))) >
        0.9 ||
      g.cave ||
      g.journey
    ) {
      G.fishing = null;
      gotNote("You reel your line in");
      return;
    }
    F.t += dt;
    if (!F.bite && F.t >= F.wait) {
      F.bite = F.t;
      sfx.play("alarm");
      gToast("A bite!", "pull it in (E), quick", 1600);
    } else if (F.bite && F.t - F.bite > 2.2) {
      G.fishing = null;
      gToast("It got away", "the line goes slack", 2000);
    }
    void ts;
  }
  function landFish() {
    const line = G.pack.tool("fishing");
    G.fishing = null;
    if (!line) return;
    // the bigger ones in deeper, colder water, now and then
    const got = Math.random() < 0.82;
    if (G.pack.wearTool(line))
      setTimeout(
        () => gotNote("Your fishing line is worn through. You keep the hook."),
        900,
      );
    if (!got) {
      gToast("Gone", "it slips the hook at the last moment", 2000);
      return;
    }
    const n = Math.random() < 0.15 ? 2 : 1,
      left = G.pack.add("fish", n);
    if (left) ground.addDrop("fish", left, frontSpot(0.6));
    sfx.play("pickup");
    gToast(n > 1 ? "Two fish!" : "A fish!", "flapping on the line", 2000);
    dropSpill(G.pack.takeSpill());
    if (G.pack.fresh.length) setTimeout(() => noteFresh(), 1300);
  }
  function firstFood() {
    for (const id of [
      "berries",
      "mushroom",
      "cavecap",
      "dried",
      "roasted",
      "grain",
      "fish",
      "bread",
      "smokedfish",
    ])
      if (G.pack.count(id) > 0) return { id, words: countWords(id, 1) };
    return null;
  }
