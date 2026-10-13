// index-inline-2 127 — note
// Lines 63025-63259 of readable/index-inline-2.pretty.js (statement-aligned).
  const SOUNDS = {
    // the dialog: the next page, a choice made
    page: (s) => s.tone(NOTE.A5, 0.04, { duty: 0.125, gain: 0.25 }),
    choose: (s) => {
      s.tone(NOTE.E5, 0.05, { duty: 0.25, gain: 0.35 });
      s.tone(NOTE.A5, 0.07, { duty: 0.25, gain: 0.35, at: 0.055 });
    },
    // picking something up: a chirp up
    pickup: (s) => {
      s.tone(NOTE.C5, 0.05, { duty: 0.25, gain: 0.4 });
      s.tone(NOTE.G5, 0.08, { duty: 0.25, gain: 0.4, at: 0.05 });
    },
    // coin changing hands: two bright rings
    coin: (s) => {
      s.tone(NOTE.B5, 0.06, { duty: 0.5, gain: 0.3 });
      s.tone(NOTE.E6, 0.16, { duty: 0.5, gain: 0.3, at: 0.06, hold: 0.2 });
    },
    // the satchel, the menu, the note: a soft click open, a lower one shut
    open: (s) =>
      s.tone(NOTE.G5, 0.035, { duty: 0.125, gain: 0.25, to: NOTE.C6 }),
    paper: (s) => s.hiss(0.14, { cut: 7000, cutTo: 2500, gain: 0.16 }),
    close: (s) =>
      s.tone(NOTE.C5, 0.035, { duty: 0.125, gain: 0.22, to: NOTE.G4 }),
    // a swing through the air, a blow that lands, wood and stone
    swing: (s) => s.hiss(0.09, { cut: 2600, cutTo: 700, gain: 0.22 }),
    hit: (s) => {
      s.hiss(0.08, { cut: 1400, cutTo: 300, gain: 0.55 });
      s.tone(140, 0.08, { duty: 0.5, gain: 0.45, to: 70 });
    },
    // hooves: a beast of yours, as you get up or down
    hoof: (s) => {
      for (const [at, f] of [
        [0, 190],
        [0.11, 160],
        [0.24, 175],
      ]) {
        s.tone(f, 0.05, { duty: 0.5, gain: 0.28, to: f * 0.6, at });
        s.hiss(0.03, { cut: 900, cutTo: 300, gain: 0.2, at });
      }
    },
    chop: (s) => {
      s.hiss(0.06, { cut: 2200, cutTo: 500, gain: 0.45 });
      s.tone(220, 0.05, { duty: 0.25, gain: 0.3, to: 150 });
    },
    // something hit you
    hurt: (s) => {
      s.tone(330, 0.16, { duty: 0.5, gain: 0.45, to: 110 });
      s.hiss(0.12, { cut: 900, gain: 0.3 });
    },
    // something you were fighting went down
    fell: (s) =>
      s.tune(
        [
          [NOTE.E5, 0.07],
          [NOTE.C5, 0.07],
          [NOTE.A4, 0.14],
        ],
        { duty: 0.5, gain: 0.32 },
      ),
    // the bow: drawn, loosed
    draw: (s) =>
      s.tone(180, 0.32, { duty: 0.125, gain: 0.16, to: 260, hold: 0.8 }),
    loose: (s) => {
      s.hiss(0.18, { cut: 5200, cutTo: 900, gain: 0.3 });
      s.tone(520, 0.05, { duty: 0.125, gain: 0.2, to: 300 });
    },
    // making something
    make: (s) => {
      s.hiss(0.05, { cut: 3000, gain: 0.3 });
      s.tune(
        [
          [NOTE.C5, 0.06],
          [NOTE.E5, 0.06],
          [NOTE.G5, 0.1],
        ],
        { duty: 0.25, gain: 0.3, at: 0.06 },
      );
    },
    eat: (s) => {
      s.tone(260, 0.06, { duty: 0.5, gain: 0.3, to: 200 });
      s.tone(240, 0.07, { duty: 0.5, gain: 0.3, to: 180, at: 0.11 });
    },
    // good news: a need met, a town that knows you better
    good: (s) =>
      s.tune(
        [
          [NOTE.C5, 0.09],
          [NOTE.E5, 0.09],
          [NOTE.G5, 0.09],
          [NOTE.C6, 0.26],
        ],
        { duty: 0.25, gain: 0.42 },
      ),
    // a small good thing: a tale done, a deal struck
    nice: (s) =>
      s.tune(
        [
          [NOTE.G5, 0.07],
          [NOTE.C6, 0.16],
        ],
        { duty: 0.25, gain: 0.36 },
      ),
    // danger: something has seen you, or bad news from far off
    alarm: (s) =>
      s.tune(
        [
          [NOTE.E4, 0.12],
          [0, 0.04],
          [NOTE.E4, 0.12],
          [semi(NOTE.E4, -1), 0.22],
        ],
        { duty: 0.5, gain: 0.4 },
      ),
    news: (s) =>
      s.tune(
        [
          [NOTE.A4, 0.16],
          [NOTE.F4, 0.16],
          [NOTE.D4, 0.32],
        ],
        { duty: 0.125, gain: 0.38 },
      ),
    // a toast with no weight to it (a place reached, a new day)
    chime: (s) =>
      s.tone(NOTE.E6, 0.12, { duty: 0.125, gain: 0.18, hold: 0.15 }),
    // somewhere nobody forgets: a wonder of the world, found
    wonder: (s) => {
      s.tune(
        [
          [NOTE.E5, 0.1],
          [NOTE.B5, 0.1],
          [NOTE.E6, 0.1],
          [NOTE.B5, 0.1],
          [NOTE.G6, 0.42],
        ],
        { duty: 0.125, gain: 0.34 },
      );
      s.tune(
        [
          [0, 0.2],
          [NOTE.E4, 0.2],
          [NOTE.B4, 0.42],
        ],
        { duty: 0.5, gain: 0.2 },
      );
    },
    // the flute: one note (arg: its pitch), or a whole song played back (arg: the pitches)
    note: (s, f) => s.flute(f),
    song: (s, fs) => s.song(fs),
    // a song takes hold: a run of bright notes going up, like light catching
    spell: (s) =>
      s.tune(
        [
          [NOTE.D5, 0.06],
          [NOTE.F5, 0.06],
          [NOTE.A5, 0.06],
          [NOTE.C6, 0.06],
          [NOTE.E6, 0.06],
          [NOTE.G6, 0.22],
        ],
        { duty: 0.125, gain: 0.3 },
      ),
    // a song learned for good
    learned: (s) => {
      s.tune(
        [
          [NOTE.A4, 0.12],
          [NOTE.C5, 0.12],
          [NOTE.E5, 0.12],
          [NOTE.A5, 0.36],
        ],
        { duty: 0.25, gain: 0.36 },
      );
      s.tune(
        [
          [0, 0.48],
          [NOTE.E6, 0.1],
          [NOTE.A5, 0.3],
        ],
        { duty: 0.125, gain: 0.22 },
      );
    },
    // a song that will not take yet: two dull notes
    fizzle: (s) => {
      s.tone(NOTE.D4, 0.12, { duty: 0.5, gain: 0.25 });
      s.tone(semi(NOTE.D4, -1), 0.2, {
        duty: 0.5,
        gain: 0.25,
        at: 0.13,
        to: semi(NOTE.D4, -3),
      });
    },
    // a draught, drunk
    drink: (s) => {
      s.tone(220, 0.08, { duty: 0.5, gain: 0.28, to: 330 });
      s.tone(260, 0.08, { duty: 0.5, gain: 0.28, to: 380, at: 0.12 });
      s.tone(300, 0.14, { duty: 0.25, gain: 0.24, to: 520, at: 0.24 });
    },
    // the ground roars and throws boiling water at the sky
    roar: (s) => {
      s.hiss(2.4, { cut: 700, cutTo: 2400, gain: 0.32 });
      s.tone(70, 1.4, { duty: 0.5, gain: 0.22, to: 52, hold: 0.6 });
    },
    // thunder (arg: how near, and how long after the flash)
    thunder: (s, a) => s.thunder(a.near, a.at),
    // falling, and waking again
    fall: (s) =>
      s.tone(NOTE.A5, 1.1, { duty: 0.5, gain: 0.32, to: 60, hold: 0.1 }),
    wake: (s) =>
      s.tune(
        [
          [NOTE.C4, 0.12],
          [NOTE.G4, 0.12],
          [NOTE.C5, 0.3],
        ],
        { duty: 0.125, gain: 0.3 },
      ),
  };

  // ---- ui/strikefx.js ----
  // ============================================================
  // STRIKE FX — what a blow looks like. The slash of whatever you swing: a
  // wide arc for an axe, a club or a blade, a quick short one for a knife or
  // your fists, a straight thrust for a spear, in the colour of what it is
  // made of, its leading edge bright and its tail breaking up as it fades.
  // Where a blow lands, a burst of light on the thing you hit and a spray of
  // sparks (or embers, or dust, or grey ash: whatever it is made of), and a
  // ring when the blow is the last one. An axe in a tree or a hammer on a rock
  // throws chips. Drawn on a canvas as many pixels across as the world under
  // it, so its pixels are the world's pixels.
  // ============================================================
  const FX_BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
  const fxEase = (t) => 1 - (1 - t) * (1 - t);
  const FX_TAU = Math.PI * 2;

