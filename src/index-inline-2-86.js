// index-inline-2 86 — line
// Lines 36694-36954 of readable/index-inline-2.pretty.js (statement-aligned).
  function deedIcon({ poly, line, ell, set, P }, seal, marks) {
    const hide = [
      [236, 220, 186],
      [214, 194, 154],
      [178, 156, 116],
    ];
    // the roll, lying across, with its curled ends
    poly(
      [
        [2, 9],
        [12, 3],
        [14, 6],
        [4, 12],
      ],
      (x, y) => (y + x * 0.6 < 10 ? hide[0] : hide[1]),
    );
    ell(3, 10.5, 1.8, 1.8, (dx, dy) => hide[dx + dy < 0 ? 1 : 2]);
    ell(13, 4.5, 1.8, 1.8, (dx, dy) => hide[dx + dy < 0 ? 0 : 2]);
    // a little house drawn on it
    line(6, 9, 8, 7, 1, [90, 64, 44]);
    line(8, 7, 10, 7, 1, [90, 64, 44]);
    for (let k = 0; k < marks; k++) set(7 + k, 6 - k * 0, [120, 84, 54]);
    // the cord and the seal
    line(8, 12, 9, 5, 1, P.cord[1]);
    ell(
      9.5,
      10.5,
      2.4,
      2.4,
      (dx, dy) => seal[dx + dy < -0.3 ? 3 : dx + dy > 0.5 ? 0 : 2],
    );
    set(9, 10, seal[3]);
  }

  // a deed for something built into a house: the roll, and on it an oven's dome, an anvil, or a loom's frame
  function workDeedIcon({ poly, line, ell, set, P }, kind) {
    const hide = [
      [236, 220, 186],
      [214, 194, 154],
      [178, 156, 116],
    ];
    poly(
      [
        [2, 11],
        [12, 6],
        [14, 9],
        [4, 14],
      ],
      (x, y) => (y + x * 0.6 < 13 ? hide[0] : hide[1]),
    );
    ell(3, 12.5, 1.6, 1.6, (dx, dy) => hide[dx + dy < 0 ? 1 : 2]);
    ell(13, 7.5, 1.6, 1.6, (dx, dy) => hide[dx + dy < 0 ? 0 : 2]);
    if (kind === "oven") {
      poly(
        [
          [3, 7],
          [11, 7],
          [11, 9],
          [3, 9],
        ],
        (x) => (x < 6 ? P.stone[3] : P.stone[2]),
      );
      ell(7, 7, 3.6, 4, (dx, dy) =>
        dy > 0
          ? null
          : P.rust[Math.max(1, Math.min(3, Math.round(2.4 - dx - dy)))],
      );
      ell(7, 6.6, 1.2, 1.3, (dx, dy) => (dy > 0.3 ? null : P.flame[2]));
      line(9, 3, 9, 1, 1, P.rust[1]);
    } else if (kind === "forge") {
      poly(
        [
          [3, 3],
          [12, 3],
          [11, 5],
          [4, 5],
        ],
        (x) => (x < 6 ? P.stone[3] : P.stone[2]),
      );
      poly(
        [
          [6, 5],
          [9, 5],
          [9, 7],
          [6, 7],
        ],
        P.stone[1],
      );
      poly(
        [
          [4, 7],
          [11, 7],
          [11, 9],
          [4, 9],
        ],
        (x) => (x < 7 ? P.stone[2] : P.stone[1]),
      );
      line(12, 3, 14, 3, 1, P.stone[2]);
    } else if (kind === "well") {
      poly(
        [
          [3, 6],
          [11, 6],
          [11, 10],
          [3, 10],
        ],
        (x) => (x < 6 ? P.stone[3] : P.stone[2]),
      );
      line(4, 6, 4, 2, 1, P.wood[2]);
      line(10, 6, 10, 2, 1, P.wood[2]);
      poly(
        [
          [2, 3],
          [12, 3],
          [7, 0],
        ],
        P.rust[2],
      );
      line(7, 3, 7, 5, 1, P.cord[2]);
    } else if (kind === "hives") {
      line(2, 9, 12, 9, 1, P.wood[1]);
      for (const x of [4, 9])
        ell(x, 7, 2.4, 3, (dx, dy) =>
          dy > 0.6
            ? null
            : Math.round((dy + 1) * 3) % 2
              ? P.amber[2]
              : P.gold[3],
        );
      set(4, 8, P.ink);
      set(9, 8, P.ink);
      set(12, 3, P.ink);
      set(13, 2, P.gold[3]);
    } else if (kind === "stable") {
      poly(
        [
          [2, 4],
          [12, 2],
          [12, 4],
          [2, 6],
        ],
        P.rust[2],
      );
      line(3, 6, 3, 10, 1, P.wood[1]);
      line(11, 4, 11, 10, 1, P.wood[1]);
      ell(7, 8, 2.6, 1.6, P.roast[2]);
      line(9, 7, 10, 5, 1, P.roast[2]);
      line(6, 9, 6, 10, 1, P.roast[1]);
      line(8, 9, 8, 10, 1, P.roast[1]);
    } else if (kind === "palisade") {
      for (let x = 2; x <= 12; x += 2) {
        line(x, 10, x, 3, 1, P.wood[x % 4 ? 2 : 1]);
        set(x, 2, P.wood[3]);
      }
      poly(
        [
          [6, 5],
          [8, 5],
          [8, 10],
          [6, 10],
        ],
        P.ink,
      );
    } else {
      line(3, 9, 4, 1, 1, P.wood[2]);
      line(11, 9, 10, 1, 1, P.wood[2]);
      line(3, 2, 11, 2, 1, P.wood[1]);
      poly(
        [
          [4, 3],
          [10, 3],
          [10, 5],
          [4, 5],
        ],
        (x) => (x % 2 ? P.red[2] : P.wool[3]),
      );
      for (let x = 5; x <= 9; x++) line(x, 5, x, 8, 1, P.wool[2]);
    }
    line(8, 14, 9, 7, 1, P.cord[1]);
    ell(
      10.5,
      12,
      2.1,
      2.1,
      (dx, dy) => P.copper[dx + dy < -0.3 ? 3 : dx + dy > 0.5 ? 0 : 2],
    );
    set(10, 11, P.copper[3]);
  }

  const iconCache = new Map();
  const pixCache = new Map();
  // an item's picture as bare pixels (no outline), for drawing it as a thing set down in the world
  function iconPixels(id, worn = false) {
    const key = id + (worn ? ":w" : "");
    if (pixCache.has(key)) return pixCache.get(key);
    const px = iconCanvas(DRAW[id] || DRAW.stone, false);
    if (worn) greyOut(px);
    pixCache.set(key, px);
    return px;
  }
  // worn things fade and lose their colour
  function greyOut(px) {
    for (let i = 0; i < px.length; i += 4) {
      if (!px[i + 3]) continue;
      const g = (px[i] + px[i + 1] + px[i + 2]) / 3;
      px[i] = px[i] * 0.35 + g * 0.65;
      px[i + 1] = px[i + 1] * 0.35 + g * 0.65;
      px[i + 2] = px[i + 2] * 0.35 + g * 0.65;
    }
  }
  // a data: URL for an item's icon (worn things fade and crack)
  function itemIcon(id, worn = false) {
    const key = id + (worn ? ":w" : "");
    if (iconCache.has(key)) return iconCache.get(key);
    const draw = DRAW[id] || DRAW.stone;
    const px = iconCanvas(draw);
    if (worn) greyOut(px);
    let url = "";
    try {
      const c = document.createElement("canvas");
      c.width = c.height = ICON_N;
      const ctx = c.getContext("2d");
      const img = ctx.createImageData(ICON_N, ICON_N);
      img.data.set(px);
      ctx.putImageData(img, 0, 0);
      url = c.toDataURL("image/png");
    } catch (e) {
      url = "";
    }
    iconCache.set(key, url);
    return url;
  }

  // ---- view/play.js ----
  // ============================================================
  // PLAY — the parts of the ground you can change. Things to pick up (sticks,
  // stones, flint, mushrooms, berries, tall grass), trees that fall when you
  // chop them, rocks that break, things you drop and things you build. What
  // changed is kept in one small record (taken, gone, drops, placed) so the
  // seed and that record together are the whole world.
  // ============================================================

  // how likely each find is, by biome (0..1 of a base density per 100 m²)
  const FIND_BASE = {
    stick: 0.55,
    stone: 0.3,
    flint: 0.08,
    mushroom: 0.2,
    bush: 0.09,
    fiber: 0.45,
    herb: 0.05,
    obsidian: 0.07,
    salt: 0.06,
  };
  const FOREST_LIKE = () => [
    B.FOREST,
    B.WETFOREST,
    B.TAIGA,
    B.JUNGLE,
    B.DRYFOREST,
  ];
