// index-inline-2 150 — notes
// Lines 70449-70756 of readable/index-inline-2.pretty.js (statement-aligned).
  function fluteNote(n) {
    const F = G.flute;
    if (!F || F.playing) return;
    F.played.push(n);
    if (F.played.length > 16) F.played.shift();
    F.lastAt = performance.now();
    sfx.play("note", NOTES[n].f);
    if (F.teach) {
      // being taught: each right note goes on; a wrong one starts you over
      const want = SONGS[F.teach.id].notes;
      if (want[F.attempt.length] === n) F.attempt.push(n);
      else F.attempt = want[0] === n ? [n] : [];
      renderFlute();
      if (F.attempt.length === want.length) learnSong();
      return;
    }
    renderFlute();
    const id = songIn(F.played, G.songs || new Set());
    if (id) castSong(id);
  }
  const noteHtml = (n, x, y, cls) =>
    `<span class="nt ${n ? "c" : "a"} ${cls}" style="left:${x}px;top:${y}px">${NOTES[n].glyph}</span>`;
  function renderFlute() {
    const F = G.flute;
    if (!F) return;
    const staff = $("gFluteStaff"),
      W = staff.clientWidth || 380;
    const ghost = F.teach ? SONGS[F.teach.id].notes : null;
    const shown = F.demo || (F.teach ? F.attempt : F.played.slice(-8));
    const slots = Math.max(8, ghost ? ghost.length : 0);
    const x = (i) => Math.round(((i + 0.5) / slots) * W),
      y = (n) => 40 - n * 10;
    const fresh = performance.now() - F.lastAt < 260;
    let h = "";
    if (ghost && !F.demo)
      ghost.forEach((n, i) => {
        if (i >= shown.length) h += noteHtml(n, x(i), y(n), "ghost");
      });
    shown.forEach((n, i) => {
      h += noteHtml(
        n,
        x(i),
        y(n),
        (fresh && i === shown.length - 1 ? "now" : "") +
          (F.sungN && i >= shown.length - F.sungN ? " sung" : ""),
      );
    });
    staff.innerHTML = h;
    $("gFluteTitle").textContent =
      F.title ||
      (F.teach ? `Now you: the ${SONGS[F.teach.id].name}` : "The bone flute");
    const known = SONG_ORDER.filter((id) => G.songs && G.songs.has(id));
    $("gFluteHint").textContent = F.teach
      ? "Play it back, note for note. A wrong note starts it over. Esc to stop."
      : known.length
        ? known
            .map(
              (id) =>
                `${SONGS[id].name.replace(/^Song of (the )?/, "")} ${songGlyphs(id)}`,
            )
            .join(" · ") + (coarse() ? "" : " · R puts it away")
        : coarse()
          ? "No songs yet: a hermit could teach you some."
          : "No songs yet: a hermit could teach you some. 1–5 or Space and the arrows play; R puts it away.";
  }
  // the five buttons (for a mouse or a finger)
  $("gFluteKeys").innerHTML = NOTES.map(
    (nt, i) =>
      `<button type="button" class="${i ? "c" : "a"}" data-n="${i}" aria-label="Note ${i + 1}">${nt.glyph}<small>${nt.key}</small></button>`,
  ).join("");
  $("gFluteKeys").addEventListener("pointerdown", (e) => {
    const b = e.target.closest("button");
    if (!b) return;
    e.preventDefault();
    e.stopPropagation();
    fluteNote(+b.dataset.n);
  });
  $("gFluteClose").addEventListener("click", (e) => {
    e.stopPropagation();
    fluteClose();
  });
  $("gFluteClose").addEventListener("pointerdown", (e) => e.stopPropagation());

  // ---- a song you know, played: it plays back as it should sound, then it takes hold (if it will) ----
  function castSong(id) {
    const F = G.flute,
      S = SONGS[id];
    F.playing = true;
    F.sungN = S.notes.length;
    F.title = S.name;
    renderFlute();
    setTimeout(() => {
      sfx.play(
        "song",
        S.notes.map((n) => NOTES[n].f),
      );
      setTimeout(
        () => {
          if (G.flute === F) fluteClose(true);
          songTakes(id);
        },
        S.notes.length * 340 + 300,
      );
    }, 280);
  }
  function songTakes(id) {
    const S = SONGS[id];
    if (!G.on || G.dying) return false;
    const rest = G.rests && G.rests[id];
    if (rest && rest > ground.t) {
      sfx.play("fizzle");
      gToast(S.name, "it will not take yet: the song needs to rest", 2600);
      return false;
    }
    if (id === "morning") {
      if (!morningSong()) return false;
    } else if (id === "heart") {
      if (!heartSong()) return false;
    } else giveBless(S.bless, true);
    sfx.play("spell");
    G.rests = G.rests || {};
    G.rests[id] = ground.t + (S.rest === "day" ? 1 : S.rest / magicDay());
    if (S.bless) gToast(S.name, BLESS[S.bless].word, 3000);
    saveLife();
    return true;
  }
  // the Song of Morning: the night is over, now (and only if it is night)
  function morningSong() {
    const g = ground;
    if (g.cave) {
      sfx.play("fizzle");
      gToast("Song of Morning", "down here the song cannot find the sky", 2600);
      return false;
    }
    if (g.uniforms.uSun.value.y > 0.04) {
      sfx.play("fizzle");
      gToast(
        "Song of Morning",
        "it is day already: the song has nothing to do",
        2600,
      );
      return false;
    }
    const P = state.planet,
      lt = P.localTime(g.p[0], g.p[1], g.p[2], g.t);
    g.t += ((((lt.dayHours * 0.28 - lt.hours) / lt.dayHours) % 1) + 1) % 1;
    gToast(
      "Song of Morning",
      "the stars go out one by one, and the sky goes grey, then gold",
      3400,
    );
    return true;
  }
  // the Song of the Heart: to where the world's trouble is, on the nearest dry ground to it
  function heartSpot(heart) {
    const R = ground.R,
      F = frameAt(heart.dir),
      G0 = ground.ground;
    for (const r of [
      3500, 6000, 10000, 16000, 25000, 40000, 65000, 100000, 160000, 250000,
      400000,
    ])
      for (let k = 0; k < 24; k++) {
        const a = (k / 24) * Math.PI * 2 + r * 1e-4,
          d = stepOn(heart.dir, F, Math.sin(a) * r, Math.cos(a) * r, R);
        if (G0.height(d[0], d[1], d[2], 2) < 2.5) continue;
        if (
          state.story.settlements.some(
            (t) => arcM(d, t.dir, R) < townRadius(t) + 600,
          )
        )
          continue;
        return { p: d, yaw: -bearingTo(d, heart.dir), km: r / 1000 };
      }
    return null;
  }
  function heartSong() {
    const arc = state.story.arc,
      heart = arc && (arc.where || arc.lair);
    if (ground.cave || !heart || !heart.dir) {
      sfx.play("fizzle");
      gToast(
        "Song of the Heart",
        "down here the song cannot find its way",
        2600,
      );
      return false;
    }
    const spot = heartSpot(heart);
    if (!spot) {
      sfx.play("fizzle");
      gToast(
        "Song of the Heart",
        "there is no dry ground near it to stand on",
        2600,
      );
      return false;
    }
    if (G.vigil) endVigil(false, "gone");
    $("eyes").hidden = false;
    lidsTo(1, 700, () => {
      const g = ground;
      g.p = spot.p.slice();
      g.vy = 0;
      g.eyeY =
        Math.max(0, g.ground.height(spot.p[0], spot.p[1], spot.p[2], 1)) + 1.7;
      g.yaw = spot.yaw;
      g.pitch = 0.04;
      g.ready = false;
      g.townsDirty = true;
      g.sitesDirty = true;
      G.afterWake = {
        title: cap(heart.name),
        sub: "where the world’s trouble is",
        name: false,
      };
      addNote({
        text: `The Song of the Heart took you to ${heart.name}, where the world’s trouble is.`,
        who: "Sung",
      });
      G.eyes = 1;
    });
    return true;
  }
  // ---- learning a song: a hermit plays it, then you play it back to them ----
  function teachSong(v, p, H, id, pay) {
    const who = p.info.name;
    openDialog([{ who, text: pickOne(TEACH_LINES.listen) }], {
      noChronicle: true,
      onClose: () => {
        fluteOpen({ id, hermit: H, who, pay });
        const F = G.flute,
          S = SONGS[id];
        if (!F) return;
        F.playing = true;
        F.demo = [];
        F.title = `${who.split(" ")[0]} plays the ${S.name}`;
        renderFlute();
        S.notes.forEach((n, k) =>
          setTimeout(
            () => {
              if (G.flute !== F) return;
              F.demo.push(n);
              F.lastAt = performance.now();
              sfx.play("note", NOTES[n].f);
              renderFlute();
            },
            450 + k * 470,
          ),
        );
        setTimeout(
          () => {
            if (G.flute !== F) return;
            F.playing = false;
            F.demo = null;
            F.title = null;
            F.attempt = [];
            renderFlute();
            gotNote(pickOne(TEACH_LINES.now).replace(/"/g, ""));
          },
          450 + S.notes.length * 470 + 600,
        );
      },
    });
  }
  function learnSong() {
    const F = G.flute,
      T = F.teach,
      S = SONGS[T.id];
    F.learned = true;
    F.playing = true;
    F.sungN = S.notes.length;
    F.title = `You have it: the ${S.name}`;
    for (const [id, n] of T.pay || []) G.pack.take(id, n);
    G.songs.add(T.id);
    renderFlute();
    sfx.play("learned");
    addNote({
      text: `${T.hermit.name} taught you the ${S.name}: ${songGlyphs(T.id)}.`,
      who: "A song",
    });
    setTimeout(() => {
      if (G.flute === F) fluteClose(true);
      const what = S.bless
        ? `${BLESS[S.bless].word}, for a while`
        : T.id === "morning"
          ? "it ends the night"
          : "it takes you to where the world’s trouble is";
      openDialog(
        [
          { who: T.who, text: pickOne(TEACH_LINES.got) },
          {
            who: null,
            text: `You learned the ${S.name} (${what}). Take out the flute ${coarse() ? "(Play it, in your satchel)" : "with R"} and play it: ${songGlyphs(T.id)}. It is in your notes.`,
          },
        ],
        {
          noChronicle: true,
          onClose: () => {
            ground.talkTo = null;
          },
        },
      );
      saveLife();
    }, 1700);
  }

  // ---- the hermits ----
