// index-inline-2 93 — rows
// Lines 45743-45988 of readable/index-inline-2.pretty.js (statement-aligned).
  void frameAt;
  void stepOn;
  void arcM;

  // ---- view/farmview.js ----
  // ============================================================
  // FARM VIEW — your field and your pen, on the ground beside your house. The
  // field: furrowed earth inside a wattle fence, then rows of seedlings, then
  // green, then the crop ripe (gold grain with a scarecrow over it, turnips
  // showing white and purple at the root, herbs in flower), or gone over. The
  // pen: a fence with a gate, a shed in the far corner with the hen house in
  // it, a trough by the gate (with grain in it, if you put some there), and
  // the animals: hens pecking about, goats and sheep wandering and grazing,
  // each of them yours. (What grows and what they give: game/farm.js.)
  // ============================================================

  const FV_COLS = {
    soilDark: [84, 64, 46],
    leaf: [62, 118, 56],
    leafDark: [44, 92, 46],
    bulb: [236, 228, 214],
    bulbTop: [150, 70, 120],
    flower: [240, 236, 220],
    flower2: [226, 196, 82],
    over: [150, 126, 82],
    overLeaf: [150, 150, 70],
    wattle: [124, 98, 68],
    straw: [212, 184, 104],
    plank: [130, 98, 66],
    plankDark: [92, 70, 50],
    egg: [232, 214, 186],
    sack: [196, 176, 138],
    hat: [176, 146, 84],
    coat: [110, 84, 64],
  };
  // the coats each of them can have (main, belly or tail, horn): hens brown, white, black, speckled; goats; sheep
  const HEN_COATS = [
    [
      [156, 98, 52],
      [92, 56, 34],
    ],
    [
      [236, 232, 220],
      [212, 206, 194],
    ],
    [
      [48, 44, 48],
      [34, 70, 60],
    ],
    [
      [156, 152, 146],
      [108, 104, 100],
    ],
  ];
  const GOAT_COATS = [
    [
      [232, 228, 218],
      [244, 240, 232],
    ],
    [
      [150, 104, 70],
      [206, 176, 140],
    ],
    [
      [64, 56, 52],
      [110, 100, 92],
    ],
    [
      [198, 172, 132],
      [232, 214, 184],
    ],
  ];
  const SHEEP_COATS = [
    [
      [236, 232, 218],
      [218, 212, 198],
    ],
    [
      [226, 214, 188],
      [208, 196, 172],
    ],
    [
      [170, 166, 160],
      [150, 146, 140],
    ],
    [
      [72, 64, 62],
      [60, 54, 52],
    ],
  ];
  const goatPlan = (c) => ({
    h: 0.8,
    len: 0.92,
    leg: 0.5,
    neck: 0.36,
    head: 0.36,
    horns: "swept",
    beard: true,
    col: c[0],
    belly: c[1],
    horn: [96, 84, 70],
    run: 4,
    herd: [1, 1],
  });
  const sheepPlan = (c, shorn) => ({
    h: 0.82,
    len: 0.98,
    leg: shorn ? 0.44 : 0.38,
    neck: 0.24,
    head: 0.4,
    horns: "none",
    wool: !shorn,
    wide: shorn ? 0.95 : 1.32,
    col: shorn ? [214, 204, 186] : c[0],
    belly: shorn ? [200, 190, 172] : c[1],
    face: [58, 50, 46],
    legCol: [58, 50, 46],
    horn: [60, 50, 44],
    run: 4,
    herd: [1, 1],
  });

  // A hen: a plump body, a tail up behind, a neck and head that bob to peck (bone 1), two legs (bones 2, 3)
  function henProto(rows) {
    const mb = new MeshBuf(true);
    mb.lvBase = 0.35;
    const O = (bone, pv) => ({ bone, pivot: pv || [0, 0, 0] });
    mb.quad(
      [-0.14, 0.02, 0.17],
      [0.14, 0.02, 0.17],
      [0.14, 0.02, -0.17],
      [-0.14, 0.02, -0.17],
      rows.shadow,
      PAT.SHADOW,
      [
        [-1, -1],
        [1, -1],
        [1, 1],
        [-1, 1],
      ],
      O(0),
    );
    mb.box(-0.09, 0.14, -0.13, 0.09, 0.3, 0.11, rows.main, PAT.HIDE, O(0));
    mb.box(-0.105, 0.17, -0.1, 0.105, 0.27, 0.05, rows.main, PAT.HIDE, O(0));
    mb.box(-0.05, 0.22, -0.2, 0.05, 0.4, -0.11, rows.tail, PAT.NONE, O(0));
    const S = [0, 0.27, 0.08],
      nb = O(1, S);
    mb.box(-0.042, 0.26, 0.05, 0.042, 0.39, 0.13, rows.main, PAT.NONE, nb);
    mb.box(-0.05, 0.36, 0.07, 0.05, 0.45, 0.17, rows.main, PAT.NONE, nb);
    mb.box(-0.013, 0.45, 0.08, 0.013, 0.5, 0.16, rows.comb, PAT.NONE, nb);
    mb.box(-0.016, 0.34, 0.14, 0.016, 0.38, 0.18, rows.comb, PAT.NONE, nb);
    mb.box(-0.018, 0.395, 0.17, 0.018, 0.42, 0.225, rows.beak, PAT.NONE, nb);
    for (const sx of [-1, 1])
      mb.box(
        sx * 0.051 - 0.006,
        0.41,
        0.12,
        sx * 0.051 + 0.006,
        0.43,
        0.145,
        rows.eye,
        PAT.NONE,
        nb,
      );
    for (const [sx, bone] of [
      [-1, 2],
      [1, 3],
    ]) {
      const pv = [sx * 0.04, 0.15, 0];
      mb.box(
        sx * 0.04 - 0.012,
        0.02,
        -0.012,
        sx * 0.04 + 0.012,
        0.15,
        0.012,
        rows.leg,
        PAT.NONE,
        O(bone, pv),
      );
      mb.box(
        sx * 0.04 - 0.03,
        0,
        -0.02,
        sx * 0.04 + 0.03,
        0.02,
        0.05,
        rows.leg,
        PAT.NONE,
        O(bone, pv),
      );
    }
    // how far the head bows for the beak to reach the ground
    const M = [0, 0.405, 0.225];
    let graze = 1.2,
      best = 1e9;
    for (let a = 0.2; a < 2.6; a += 0.02) {
      const y =
        S[1] + (M[1] - S[1]) * Math.cos(a) - (M[2] - S[2]) * Math.sin(a);
      if (Math.abs(y - 0.03) < best) {
        best = Math.abs(y - 0.03);
        graze = a;
      }
      if (y < 0.03) break;
    }
    return {
      mb,
      H: 0.45,
      len: 0.36,
      hw: 0.1,
      legH: 0.15,
      bodyH: 0.16,
      bodyY: 0.14,
      graze,
      rad: 0.16,
    };
  }

  // a field's colours, in the order the ground's shader takes them (uFRow): the earth, fresh-turned, seedlings,
  // leaves (two greens), grain and its heads, gone over (stalks, leaves), a turnip's root and its top, flowers
  const FIELD_ROWS = [
    [98, 76, 56],
    [76, 58, 42],
    [112, 164, 68],
    [86, 142, 62],
    [62, 114, 52],
    [214, 184, 96],
    [168, 128, 58],
    [150, 126, 82],
    [150, 150, 70],
    [236, 228, 214],
    [150, 70, 120],
    [240, 236, 220],
    [226, 196, 82],
  ];
  // what a field's shader is told it grows (crop), and how far on (stage)
  const FIELD_CROP = { grain: 1, green: 2, turnip: 3, herbs: 4 };
  const FIELD_STAGE = {
    bare: 0,
    sown: 1,
    sprout: 2,
    green: 3,
    ripe: 4,
    over: 5,
  };

