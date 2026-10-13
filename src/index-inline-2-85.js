// index-inline-2 85 — line
// Lines 34755-36693 of readable/index-inline-2.pretty.js (statement-aligned).
  const DRAW = {
    stick: ({ line, set, P }) => {
      line(3, 13, 13, 3, 2, (k) => (k < 0 ? P.wood[3] : P.wood[1]));
      line(8, 8, 11, 9, 1, P.wood[2]);
      set(12, 9, P.grass[2]);
    },
    log: ({ poly, ell, line, P }) => {
      poly(
        [
          [2, 6],
          [12, 5],
          [12, 11],
          [2, 12],
        ],
        (x, y) =>
          y < 7
            ? P.bark[3]
            : y > 10
              ? P.bark[0]
              : (x + y) % 5 === 0
                ? P.bark[1]
                : P.bark[2],
      );
      ell(12, 8, 2.4, 3.2, (dx, dy) =>
        dx * dx + dy * dy < 0.25
          ? P.wood[1]
          : dx * dx + dy * dy < 0.55
            ? P.wood[3]
            : P.wood[2],
      );
      line(4, 9, 9, 9, 1, P.bark[1]);
    },
    stone: ({ ell, lit, P }) => ell(8, 9, 5.5, 4.5, lit(P.stone)),
    flint: ({ poly, line, P }) => {
      poly(
        [
          [3, 10],
          [7, 4],
          [13, 6],
          [12, 12],
          [6, 13],
        ],
        (x, y) =>
          x + y < 14 ? P.flint[3] : x > y + 1 ? P.flint[2] : P.flint[1],
      );
      line(4, 10, 7, 5, 1, P.flint[4]);
      line(8, 9, 12, 11, 1, P.flint[0]);
    },
    fiber: ({ line, P }) => {
      for (let k = 0; k < 6; k++)
        line(
          4 + k * 1.6,
          14,
          6 + k * 0.8,
          2 + (k % 2) * 2,
          1,
          P.grass[k % 2 ? 2 : 3],
        );
      line(4, 9, 12, 9, 1, P.cord[2]);
    },
    cord: ({ ell, line, P }) => {
      ell(8, 8, 6, 5, (dx, dy) => {
        const d = dx * dx + dy * dy;
        return d > 0.55 ? P.cord[dx < 0 ? 3 : 1] : d > 0.2 ? null : P.cord[2];
      });
      ell(8, 8, 3.4, 2.8, (dx, dy) =>
        dx * dx + dy * dy > 0.45 ? P.cord[dy < 0 ? 3 : 1] : null,
      );
      line(12, 11, 14, 14, 1, P.cord[2]);
    },
    plank: ({ poly, line, P }) => {
      poly(
        [
          [2, 9],
          [12, 3],
          [14, 6],
          [4, 12],
        ],
        (x, y) => (y + x * 0.6 < 11 ? P.wood[3] : P.wood[2]),
      );
      line(5, 9, 11, 5, 1, P.wood[1]);
    },
    blade: ({ poly, line, P }) => {
      poly(
        [
          [4, 13],
          [12, 3],
          [11, 9],
        ],
        (x, y) => (x < 9 ? P.flint[3] : P.flint[2]),
      );
      line(4, 12, 11, 4, 1, P.flint[4]);
    },
    knife: ({ line, poly, P }) => {
      line(3, 13, 7, 9, 2, (k) => (k < 0 ? P.wood[3] : P.wood[1]));
      poly(
        [
          [6, 9],
          [13, 2],
          [12, 7],
          [8, 11],
        ],
        (x) => (x < 10 ? P.flint[3] : P.flint[2]),
      );
      line(7, 9, 12, 3, 1, P.flint[4]);
      line(6, 10, 8, 8, 1, P.cord[2]);
    },
    axe: ({ line, poly, P }) => {
      line(3, 14, 11, 4, 2, (k) => (k < 0 ? P.wood[3] : P.wood[1]));
      poly(
        [
          [8, 2],
          [13, 1],
          [15, 6],
          [11, 7],
        ],
        (x, y) => (x + y < 13 ? P.flint[3] : P.flint[2]),
      );
      line(13, 1, 15, 6, 1, P.flint[4]);
      line(9, 5, 11, 6, 1, P.cord[2]);
    },
    hammer: ({ line, poly, P }) => {
      line(3, 14, 10, 5, 2, (k) => (k < 0 ? P.wood[3] : P.wood[1]));
      poly(
        [
          [6, 3],
          [11, 1],
          [14, 6],
          [9, 8],
        ],
        (x, y) => (x + y < 12 ? P.stone[3] : x > 10 ? P.stone[1] : P.stone[2]),
      );
      line(9, 6, 11, 5, 1, P.cord[2]);
    },
    torch: ({ line, ell, P }) => {
      line(8, 15, 8, 7, 2, (k) => (k < 0 ? P.wood[3] : P.wood[1]));
      line(7, 8, 9, 8, 1, P.cord[2]);
      ell(
        8,
        4.5,
        2.6,
        3.6,
        (dx, dy) =>
          P.flame[
            Math.max(0, Math.min(3, Math.round(2.4 - dy * 1.6 - Math.abs(dx))))
          ],
      );
    },
    berries: ({ ell, poly, lit, P }) => {
      poly(
        [
          [9, 2],
          [13, 3],
          [10, 6],
        ],
        P.grass[2],
      );
      for (const [x, y] of [
        [6, 8],
        [9, 7],
        [11, 10],
        [7, 11],
        [4, 11],
      ])
        ell(x, y, 2, 2, lit(P.berry));
    },
    dried: ({ ell, set, lit, P }) => {
      for (const [x, y] of [
        [6, 7],
        [10, 8],
        [8, 11],
        [4, 11],
        [12, 12],
      ])
        ell(x, y, 1.8, 1.6, lit(P.dried));
      set(9, 11, P.dried[0]);
    },
    mushroom: ({ ell, poly, set, P }) => {
      poly(
        [
          [6, 8],
          [10, 8],
          [10, 14],
          [6, 14],
        ],
        (x) => (x < 8 ? P.cap[3] : [200, 186, 160]),
      );
      ell(8, 8, 6.5, 4.5, (dx, dy) =>
        dy > 0.35 ? null : P.cap[dy < -0.5 ? 2 : dx > 0.4 ? 0 : 1],
      );
      for (const [x, y] of [
        [5, 6],
        [9, 5],
        [11, 7],
      ])
        set(x, y, P.cap[3]);
    },
    roasted: ({ ell, line, P }) => {
      line(2, 14, 14, 2, 1, P.wood[2]);
      ell(
        8,
        8,
        4.5,
        3.5,
        (dx, dy) => P.roast[Math.max(0, Math.min(3, Math.round(2 - dx - dy)))],
      );
    },
    cpouch: ({ poly, line, P }) => {
      poly(
        [
          [4, 6],
          [12, 6],
          [13, 13],
          [3, 13],
        ],
        (x, y) => (y < 8 ? P.hide[3] : x > 10 ? P.hide[1] : P.hide[2]),
      );
      line(4, 8, 12, 8, 1, P.hide[0]);
      line(6, 6, 8, 3, 1, P.cord[2]);
      line(8, 3, 10, 6, 1, P.cord[2]);
    },
    sack: ({ ell, line, poly, P }) => {
      ell(8, 10, 6, 5, (dx, dy) =>
        (Math.round((dx + 1) * 6) + Math.round((dy + 1) * 5)) % 2
          ? P.grass[2]
          : P.grass[1],
      );
      poly(
        [
          [6, 2],
          [10, 2],
          [9, 6],
          [7, 6],
        ],
        P.grass[3],
      );
      line(6, 6, 10, 6, 1, P.cord[2]);
    },
    cloak: ({ poly, line, P }) => {
      poly(
        [
          [6, 2],
          [10, 2],
          [14, 14],
          [2, 14],
        ],
        (x, y) =>
          (x + y) % 3 === 0 ? P.grass[1] : x < 8 ? P.grass[3] : P.grass[2],
      );
      line(6, 3, 10, 3, 1, P.cord[2]);
    },
    campfire: ({ ell, line, P }) => {
      for (const [x, y] of [
        [3, 12],
        [6, 13],
        [10, 13],
        [13, 12],
        [8, 14],
      ])
        ell(x, y, 1.6, 1.2, P.stone[2]);
      line(4, 12, 12, 9, 1, P.wood[2]);
      line(12, 12, 4, 9, 1, P.wood[1]);
      ell(
        8,
        7,
        3,
        4.5,
        (dx, dy) =>
          P.flame[
            Math.max(0, Math.min(3, Math.round(2.4 - dy * 1.6 - Math.abs(dx))))
          ],
      );
    },
    leanto: ({ poly, line, P }) => {
      poly(
        [
          [2, 13],
          [12, 4],
          [14, 13],
        ],
        (x, y) =>
          (x + y) % 4 === 0 ? P.grass[1] : y < 8 ? P.grass[3] : P.grass[2],
      );
      line(12, 4, 12, 14, 1, P.wood[1]);
      line(3, 13, 12, 5, 1, P.wood[2]);
    },
    workstone: ({ poly, ell, line, P }) => {
      for (const [x, y] of [
        [4, 12],
        [12, 12],
        [8, 13],
      ])
        ell(x, y, 2.4, 1.6, P.stone[1]);
      poly(
        [
          [1, 7],
          [14, 6],
          [15, 10],
          [2, 11],
        ],
        (x, y) => (y < 8 ? P.stone[3] : P.stone[2]),
      );
      line(3, 8, 12, 7, 1, P.stone[3]);
      line(9, 5, 12, 2, 1, P.flint[3]);
    },
    note: ({ poly, line }) => {
      const paper = [233, 220, 192],
        shade = [200, 184, 150],
        ink = [90, 64, 44];
      poly(
        [
          [3, 3],
          [13, 2],
          [14, 13],
          [4, 14],
        ],
        (x, y) => (x > 8 ? shade : paper),
      );
      line(9, 2, 9, 14, 1, [170, 150, 118]);
      line(5, 6, 8, 6, 1, ink);
      line(5, 9, 8, 8, 1, ink);
      line(10, 6, 12, 6, 1, ink);
    },
    oldblade: ({ line, poly, set, P }) => {
      poly(
        [
          [5, 11],
          [13, 2],
          [14, 3],
          [6, 12],
        ],
        (x, y) =>
          (x * 7 + y * 3) % 5 === 0
            ? P.rust[0]
            : x + y < 15
              ? P.rust[3]
              : P.rust[2],
      );
      line(3, 9, 8, 14, 2, P.rust[1]);
      line(2, 14, 4, 12, 2, P.wood[1]);
      set(10, 6, P.rust[0]);
      set(12, 4, P.rust[1]);
    },
    herbs: ({ line, poly, set, P }) => {
      line(8, 15, 8, 6, 1, P.grass[1]);
      poly(
        [
          [8, 7],
          [3, 4],
          [4, 9],
        ],
        P.grass[3],
      );
      poly(
        [
          [8, 10],
          [13, 6],
          [12, 11],
        ],
        P.grass[2],
      );
      poly(
        [
          [8, 12],
          [4, 11],
          [6, 14],
        ],
        P.grass[2],
      );
      for (const [x, y] of [
        [8, 4],
        [7, 5],
        [9, 5],
      ])
        set(x, y, [236, 226, 150]);
      set(8, 5, [250, 246, 200]);
    },
    resin: ({ ell, set, P }) => {
      ell(
        8,
        10,
        4.5,
        4.2,
        (dx, dy) =>
          P.amber[
            Math.max(0, Math.min(3, Math.round(2 - dx * 1.2 - dy * 1.4)))
          ],
      );
      ell(8, 5.5, 2, 2.2, (dx, dy) => P.amber[dy < 0 ? 3 : 2]);
      set(6, 8, P.amber[3]);
      set(6, 9, [255, 250, 210]);
    },
    obsidian: ({ poly, line, P }) => {
      poly(
        [
          [3, 11],
          [6, 3],
          [13, 5],
          [12, 12],
          [7, 13],
        ],
        (x, y) => (x + y < 13 ? P.obs[3] : x > y ? P.obs[2] : P.obs[1]),
      );
      line(5, 10, 7, 4, 1, P.obs[4]);
      line(9, 11, 12, 7, 1, P.obs[0]);
    },
    salt: ({ ell, set, P }) => {
      ell(8, 11, 6, 3.5, (dx, dy) => P.wool[dy < -0.2 ? 3 : dx > 0.4 ? 1 : 2]);
      for (const [x, y] of [
        [5, 8],
        [8, 7],
        [11, 8],
        [7, 9],
        [10, 10],
      ]) {
        set(x, y, P.wool[3]);
        set(x, y - 1, [255, 255, 255]);
      }
    },
    wool: ({ ell, P }) => {
      for (const [x, y, r] of [
        [6, 9, 3.4],
        [10, 8, 3.6],
        [8, 11, 3.4],
        [8, 6, 2.6],
      ])
        ell(
          x,
          y,
          r,
          r * 0.9,
          (dx, dy) =>
            P.wool[Math.max(0, Math.min(3, Math.round(2.2 - dx - dy * 1.3)))],
        );
    },
    sting: ({ line, ell, P }) => {
      // the swollen bulb, the barb hooked down out of it, and a stub of the tail
      line(2, 13, 5, 10.5, 2, P.amber[1]);
      ell(
        7.5,
        8.5,
        3.6,
        2.8,
        (dx, dy) => P.amber[dx + dy < -0.5 ? 3 : dx + dy < 0.4 ? 2 : 1],
      );
      line(10.5, 7, 13, 5, 2, P.rust[2]);
      line(13, 5, 13.5, 8, 1, P.rust[1]);
      line(13.5, 8, 12.5, 10, 1, P.red[0]);
    },
    bone: ({ line, ell, P }) => {
      line(4, 12, 12, 4, 2, (k) => (k < 0 ? P.bone[3] : P.bone[1]));
      for (const [x, y] of [
        [3, 12],
        [4, 13],
        [12, 3],
        [13, 4],
      ])
        ell(x, y, 1.7, 1.7, (dx, dy) => P.bone[dx + dy < 0 ? 3 : 2]);
    },
    charcoal: ({ ell, set, P }) => {
      for (const [x, y, r] of [
        [5, 10, 3],
        [10, 10, 3.2],
        [8, 7, 2.6],
      ])
        ell(x, y, r, r * 0.8, (dx, dy) => P.obs[dx + dy < -0.3 ? 3 : 1]);
      set(9, 9, P.flame[2]);
    },
    poultice: ({ ell, line, P }) => {
      ell(
        8,
        9,
        5.5,
        4.5,
        (dx, dy) => P.grass[Math.max(0, Math.min(3, Math.round(2 - dx - dy)))],
      );
      line(3, 9, 13, 9, 1, P.cord[2]);
      line(8, 4, 8, 14, 1, P.cord[1]);
    },
    pitchtorch: ({ line, ell, P }) => {
      line(8, 15, 8, 7, 2, (k) => (k < 0 ? P.wood[3] : P.wood[1]));
      line(7, 8, 9, 8, 2, P.amber[1]);
      ell(
        8,
        4.5,
        3,
        3.8,
        (dx, dy) =>
          P.flame[
            Math.max(0, Math.min(3, Math.round(2.6 - dy * 1.6 - Math.abs(dx))))
          ],
      );
    },
    obblade: ({ poly, line, P }) => {
      poly(
        [
          [4, 13],
          [12, 3],
          [11, 9],
        ],
        (x) => (x < 9 ? P.obs[3] : P.obs[2]),
      );
      line(4, 12, 11, 4, 1, P.obs[4]);
    },
    obknife: ({ line, poly, P }) => {
      line(3, 13, 7, 9, 2, (k) => (k < 0 ? P.wood[3] : P.wood[1]));
      poly(
        [
          [6, 9],
          [13, 2],
          [12, 7],
          [8, 11],
        ],
        (x) => (x < 10 ? P.obs[3] : P.obs[2]),
      );
      line(7, 9, 12, 3, 1, P.obs[4]);
      line(6, 10, 8, 8, 1, P.cord[2]);
    },
    obaxe: ({ line, poly, P }) => {
      line(3, 14, 11, 4, 2, (k) => (k < 0 ? P.wood[3] : P.wood[1]));
      poly(
        [
          [8, 2],
          [13, 1],
          [15, 6],
          [11, 7],
        ],
        (x, y) => (x + y < 13 ? P.obs[3] : P.obs[2]),
      );
      line(13, 1, 15, 6, 1, P.obs[4]);
      line(9, 5, 11, 6, 1, P.cord[2]);
    },
    saltcap: ({ ell, poly, set, P }) => {
      poly(
        [
          [6, 9],
          [10, 9],
          [10, 14],
          [6, 14],
        ],
        (x) => (x < 8 ? P.cap[3] : [200, 186, 160]),
      );
      ell(8, 9, 6, 4, (dx, dy) =>
        dy > 0.35 ? null : P.cap[dy < -0.5 ? 2 : 1],
      );
      for (const [x, y] of [
        [5, 7],
        [8, 6],
        [11, 8],
        [7, 8],
        [10, 7],
      ])
        set(x, y, P.wool[3]);
    },
    needle: ({ line, set, P }) => {
      line(3, 13, 13, 3, 1, (k, t) => P.bone[t < 0.8 ? 3 : 2]);
      set(12, 4, P.ink);
      line(11, 3, 13, 5, 1, P.bone[1]);
    },
    woolcloak: ({ poly, line, P }) => {
      poly(
        [
          [6, 2],
          [10, 2],
          [14, 14],
          [2, 14],
        ],
        (x, y) =>
          (x + y) % 4 === 0 ? P.wool[1] : x < 8 ? P.wool[3] : P.wool[2],
      );
      line(6, 3, 10, 3, 1, P.leather[2]);
    },
    basket: ({ poly, line, P }) => {
      poly(
        [
          [3, 6],
          [13, 6],
          [12, 14],
          [4, 14],
        ],
        (x, y) => ((x + y) % 2 ? P.cord[2] : P.cord[1]),
      );
      line(3, 6, 13, 6, 1, P.cord[3]);
      line(5, 6, 7, 2, 1, P.wood[2]);
      line(7, 2, 9, 2, 1, P.wood[2]);
      line(9, 2, 11, 6, 1, P.wood[2]);
    },
    pack: ({ poly, line, P }) => {
      poly(
        [
          [4, 4],
          [12, 4],
          [13, 14],
          [3, 14],
        ],
        (x, y) => (y < 7 ? P.leather[3] : x > 10 ? P.leather[1] : P.leather[2]),
      );
      line(4, 7, 12, 7, 1, P.leather[0]);
      poly(
        [
          [6, 9],
          [10, 9],
          [10, 12],
          [6, 12],
        ],
        P.leather[1],
      );
      line(8, 4, 8, 7, 1, P.gold[2]);
    },
    parcel: ({ poly, line, P }) => {
      poly(
        [
          [3, 5],
          [13, 5],
          [13, 13],
          [3, 13],
        ],
        (x, y) => (y < 7 ? P.wool[3] : x > 10 ? P.wool[1] : P.wool[2]),
      );
      line(3, 9, 13, 9, 1, P.cord[1]);
      line(8, 5, 8, 13, 1, P.cord[1]);
      line(7, 4, 9, 4, 1, P.cord[2]);
    },
    offering: ({ poly, line, ell, P }) => {
      ell(
        8,
        10,
        4,
        3.4,
        (dx, dy) => P.red[Math.max(0, Math.min(3, Math.round(2 - dx - dy)))],
      );
      line(8, 7, 5, 2, 1, P.red[3]);
      line(8, 7, 11, 3, 1, P.red[2]);
    },
    heirloom: ({ ell, set, P }) => {
      ell(8, 9, 5, 5, (dx, dy) => {
        const d = dx * dx + dy * dy;
        return d > 0.4 ? P.gold[dx + dy < 0 ? 3 : 1] : null;
      });
      ell(8, 4, 2, 2, (dx, dy) => P.red[dy < 0 ? 3 : 2]);
      set(7, 3, [255, 220, 220]);
    },
    charm: ({ ell, line, set, P }) => {
      ell(8, 6, 2.6, 2.6, (dx, dy) => P.wood[dx + dy < 0 ? 3 : 2]);
      ell(8, 11, 3.4, 3.6, (dx, dy) => P.wood[dx + dy < 0 ? 3 : 1]);
      line(8, 1, 8, 3, 1, P.cord[2]);
      set(7, 6, P.ink);
      set(9, 6, P.ink);
    },
    copperknife: ({ line, poly, P }) => {
      line(3, 13, 7, 9, 2, (k) => (k < 0 ? P.wood[3] : P.wood[1]));
      poly(
        [
          [6, 9],
          [13, 2],
          [12, 7],
          [8, 11],
        ],
        (x) => (x < 10 ? P.amber[3] : P.amber[2]),
      );
      line(7, 9, 12, 3, 1, [255, 230, 170]);
      line(6, 10, 8, 8, 1, P.leather[2]);
    },
    copperaxe: ({ line, poly, P }) => {
      line(3, 14, 11, 4, 2, (k) => (k < 0 ? P.wood[3] : P.wood[1]));
      poly(
        [
          [8, 1],
          [13, 0],
          [15, 6],
          [11, 8],
        ],
        (x, y) => (x + y < 13 ? P.amber[3] : P.amber[1]),
      );
      line(13, 0, 15, 6, 1, [255, 230, 170]);
      line(9, 5, 11, 6, 1, P.leather[2]);
    },
    copperspear: ({ line, poly, P }) => {
      line(2, 15, 11, 6, 1, (k, t) => P.wood[t < 0.5 ? 2 : 3]);
      line(3, 15, 11, 7, 1, P.wood[1]);
      poly(
        [
          [10, 6],
          [14, 1],
          [12, 7],
          [11, 7],
        ],
        (x) => (x < 12 ? P.amber[3] : P.amber[2]),
      );
      line(10, 7, 11, 8, 1, P.leather[2]);
    },
    bronzeknife: ({ line, poly, P }) => {
      line(3, 13, 7, 9, 2, (k) => (k < 0 ? P.leather[3] : P.leather[1]));
      poly(
        [
          [6, 9],
          [13, 2],
          [12, 7],
          [8, 11],
        ],
        (x, y) =>
          (x + y) % 5 === 0 ? P.copper[2] : x < 10 ? P.gold[3] : P.gold[1],
      );
      line(7, 9, 12, 3, 1, P.gold[3]);
    },
    bronzesword: ({ line, poly, set, P }) => {
      poly(
        [
          [5, 10],
          [13, 1],
          [15, 3],
          [6, 11],
        ],
        (x, y) =>
          (x * 3 + y) % 7 === 0
            ? P.copper[2]
            : x + y < 15
              ? P.gold[3]
              : P.gold[1],
      );
      line(3, 10, 7, 14, 2, P.gold[0]);
      line(2, 14, 5, 11, 2, P.leather[1]);
      set(14, 2, [255, 248, 210]);
    },
    // from the wonders: star-iron and what a smith makes of it, a giant's tooth, a piece of a stone tree
    stariron: ({ ell, line, set, P }) => {
      ell(
        8,
        9,
        6,
        5,
        (dx, dy) =>
          P.obs[Math.max(0, Math.min(3, Math.round(1.7 - dx - dy * 1.1)))],
      );
      line(4, 8, 7, 10, 1, P.star[3]);
      line(7, 10, 11, 8, 1, P.star[2]);
      line(9, 6, 11, 8, 1, P.star[3]);
      set(10, 7, P.star[4]);
      set(6, 9, P.star[4]);
    },
    starblade: ({ line, poly, set, P }) => {
      poly(
        [
          [5, 10],
          [13, 1],
          [15, 3],
          [6, 11],
        ],
        (x, y) => (x + y < 15 ? P.star[3] : P.obs[3]),
      );
      line(6, 10, 14, 2, 1, P.star[4]);
      line(3, 10, 7, 14, 2, P.obs[1]);
      line(2, 14, 5, 11, 2, P.leather[1]);
      set(14, 2, [255, 255, 255]);
      set(4, 12, P.star[2]);
    },
    gianttooth: ({ poly, line, P }) => {
      poly(
        [
          [3, 14],
          [4, 10],
          [7, 6],
          [13, 2],
          [9, 8],
          [7, 11],
          [7, 14],
        ],
        (x, y) => (x + y < 14 ? P.bone[3] : P.bone[1]),
      );
      line(5, 11, 11, 4, 1, P.bone[2]);
      line(3, 14, 7, 14, 1, P.amber[1]);
      line(4, 13, 6, 13, 1, P.amber[2]);
    },
    stonewood: ({ poly, ell, line, P }) => {
      poly(
        [
          [2, 8],
          [11, 4],
          [14, 9],
          [5, 13],
        ],
        (x, y) =>
          (x + y * 2) % 5 === 0 ? P.rust[1] : y < 8 ? P.rust[3] : P.stone[2],
      );
      ell(12, 7, 2.2, 2.8, (dx, dy) => {
        const d = dx * dx + dy * dy;
        return d < 0.2 ? P.amber[1] : d < 0.55 ? P.amber[3] : P.rust[2];
      });
      line(4, 10, 10, 7, 1, P.stone[1]);
    },
    // the bone flute: yellow-white bone, five dark holes
    boneflute: ({ line, set, P }) => {
      line(3, 13, 13, 3, 3, (k) =>
        k < -0.5 ? P.bone[3] : k > 0.5 ? P.bone[1] : P.bone[2],
      );
      for (let k = 0; k < 5; k++) set(6 + k * 1.5, 10 - k * 1.5, P.ink);
      line(12, 2, 14, 4, 2, P.bone[0]);
      line(2, 12, 4, 14, 2, P.bone[0]);
    },
    // the hermits' draughts: a little stoppered bottle, each its own colour
    dr_road: (o) =>
      bottleIcon(o, [
        [40, 120, 40],
        [90, 190, 70],
        [160, 236, 120],
      ]),
    dr_bull: (o) =>
      bottleIcon(o, [
        [110, 20, 24],
        [184, 44, 40],
        [236, 110, 90],
      ]),
    dr_mend: (o) =>
      bottleIcon(o, [
        [30, 110, 96],
        [70, 190, 160],
        [170, 240, 220],
      ]),
    dr_owl: (o) =>
      bottleIcon(o, [
        [24, 20, 56],
        [56, 44, 120],
        [190, 180, 255],
      ]),
    dr_hearth: (o) =>
      bottleIcon(o, [
        [130, 60, 10],
        [214, 128, 30],
        [255, 210, 110],
      ]),
    dr_fish: (o) =>
      bottleIcon(o, [
        [30, 64, 110],
        [70, 130, 190],
        [170, 214, 250],
      ]),
    dr_hare: (o) =>
      bottleIcon(o, [
        [130, 120, 30],
        [214, 200, 70],
        [255, 246, 160],
      ]),
    // what is on you now: a small mark for each blessing
    bl_road: ({ line, P }) => {
      for (const x of [3, 8]) {
        line(x, 4, x + 4, 8, 2, P.grass[3]);
        line(x + 4, 8, x, 12, 2, P.grass[2]);
      }
    },
    bl_stone: ({ ell, lit, P }) => ell(8, 9, 6, 5, lit(P.stone)),
    bl_fury: ({ ell, P }) => {
      ell(
        8,
        10,
        4.5,
        4.5,
        (dx, dy) =>
          P.red[
            Math.max(0, Math.min(3, Math.round(2.6 - dy * 1.5 - Math.abs(dx))))
          ],
      );
      ell(
        8,
        5,
        2.4,
        3.4,
        (dx, dy) =>
          P.flame[
            Math.max(0, Math.min(3, Math.round(2.4 - dy * 1.6 - Math.abs(dx))))
          ],
      );
    },
    bl_embers: ({ ell }) =>
      ell(
        8,
        8,
        4.5,
        6,
        (dx, dy) =>
          [
            [122, 36, 16],
            [212, 88, 30],
            [244, 154, 56],
            [255, 224, 126],
          ][
            Math.max(0, Math.min(3, Math.round(2.4 - dy * 1.6 - Math.abs(dx))))
          ],
      ),
    bl_mending: ({ poly, line, P }) => {
      poly(
        [
          [8, 2],
          [13, 7],
          [8, 14],
          [3, 7],
        ],
        (x, y) => (x < 8 ? [140, 240, 200] : [70, 190, 160]),
      );
      line(8, 4, 8, 13, 1, [30, 110, 96]);
    },
    bl_strength: ({ ell, line, P }) => {
      ell(8, 9, 4.6, 4.2, (dx, dy) => P.red[dx + dy < 0 ? 3 : 1]);
      line(3, 6, 1, 2, 2, P.bone[2]);
      line(13, 6, 15, 2, 2, P.bone[2]);
    },
    bl_nighteyes: ({ ell, set }) => {
      ell(8, 8, 6.5, 3.6, (dx, dy) =>
        dx * dx + dy * dy < 0.3 ? [24, 20, 56] : [190, 180, 255],
      );
      set(7, 7, [255, 255, 255]);
    },
    bl_breath: ({ ell }) => {
      for (const [x, y, r] of [
        [5, 10, 3],
        [11, 7, 2.4],
        [8, 3.5, 1.6],
      ])
        ell(x, y, r, r, (dx, dy) =>
          dx + dy < -0.6 ? [230, 246, 255] : [96, 176, 236],
        );
    },
    bl_leaping: ({ poly, P }) =>
      poly(
        [
          [8, 1],
          [14, 8],
          [10, 8],
          [10, 14],
          [6, 14],
          [6, 8],
          [2, 8],
        ],
        (x, y) => (x < 8 ? [255, 246, 160] : [214, 200, 70]),
      ),
    bl_starlit: ({ poly }) =>
      poly(
        [
          [8, 1],
          [10, 6],
          [15, 6],
          [11, 9],
          [13, 15],
          [8, 11],
          [3, 15],
          [5, 9],
          [1, 6],
          [6, 6],
        ],
        (x, y) => (x + y < 14 ? [230, 244, 255] : [150, 196, 255]),
      ),
    bl_remembered: ({ poly, P }) =>
      poly(
        [
          [5, 15],
          [6, 3],
          [9, 1],
          [11, 4],
          [11, 15],
        ],
        (x) => (x < 8 ? P.stone[3] : P.stone[1]),
      ),
    bl_rooted: ({ ell, line, P }) => {
      line(8, 15, 8, 8, 2, P.wood[2]);
      ell(8, 6, 5.5, 4.6, (dx, dy) => P.grass[dx + dy < 0 ? 3 : 1]);
      line(8, 14, 4, 15, 1, P.wood[1]);
      line(8, 14, 12, 15, 1, P.wood[1]);
    },
    cityseal: ({ ell, line, set, P }) => {
      line(8, 2, 8, 7, 3, P.amber[1]);
      ell(8, 2.5, 2.2, 1.6, (dx, dy) => P.amber[dy < 0 ? 3 : 2]);
      ell(
        8,
        11,
        5.6,
        3.8,
        (dx, dy) => P.amber[dx + dy < -0.4 ? 3 : dx + dy > 0.6 ? 1 : 2],
      );
      for (const [x, y] of [
        [6, 11],
        [8, 10],
        [10, 11],
        [8, 12],
      ])
        set(x, y, P.amber[0]);
    },
    crown: ({ poly, set, P }) => {
      poly(
        [
          [2, 12],
          [2, 6],
          [5, 9],
          [8, 4],
          [11, 9],
          [14, 6],
          [14, 12],
        ],
        (x, y) =>
          y > 10 ? P.amber[1] : (x + y) % 6 === 0 ? P.copper[2] : P.amber[3],
      );
      for (const [x, y] of [
        [5, 11],
        [8, 11],
        [11, 11],
      ])
        set(x, y, P.copper[3]);
    },
    crystal: ({ poly, line, P }) => {
      poly(
        [
          [4, 14],
          [2, 8],
          [4, 5],
          [6, 8],
          [7, 14],
        ],
        (x) => (x < 4 ? P.ice[3] : P.ice[2]),
      );
      poly(
        [
          [7, 14],
          [7, 5],
          [9, 1],
          [11, 5],
          [11, 14],
        ],
        (x) => (x < 9 ? P.ice[3] : P.ice[1]),
      );
      poly(
        [
          [11, 14],
          [12, 9],
          [14, 8],
          [15, 14],
        ],
        (x) => (x < 13 ? P.ice[2] : P.ice[1]),
      );
      line(8, 5, 8, 12, 1, P.ice[3]);
      line(9, 3, 9, 4, 1, [255, 255, 255]);
    },
    ore: ({ ell, set, P }) => {
      ell(8, 9, 6, 5, (dx, dy, x, y) =>
        (x * 3 + y * 5) % 7 === 0
          ? P.copper[2]
          : (x + y * 2) % 9 === 0
            ? P.rust[3]
            : P.stone[Math.max(0, Math.min(3, Math.round(1.8 - dx - dy)))],
      );
      for (const [x, y] of [
        [5, 7],
        [6, 8],
        [10, 10],
        [11, 9],
        [9, 6],
      ])
        set(x, y, P.copper[3]);
    },
    cavecap: ({ ell, poly, set, P }) => {
      poly(
        [
          [7, 8],
          [9, 8],
          [9, 14],
          [7, 14],
        ],
        (x) => (x < 8 ? P.wool[3] : P.wool[1]),
      );
      ell(8, 8, 5.5, 3.6, (dx, dy) =>
        dy > 0.35 ? null : P.wool[dy < -0.5 ? 3 : dx > 0.4 ? 1 : 2],
      );
      poly(
        [
          [3, 12],
          [4, 12],
          [4, 15],
          [3, 15],
        ],
        P.wool[2],
      );
      ell(3.5, 12, 2.4, 1.6, (dx, dy) =>
        dy > 0.3 ? null : P.wool[dy < -0.3 ? 3 : 2],
      );
      set(12, 13, P.wool[2]);
    },
    oldcoin: ({ ell, set, P }) => {
      ell(6, 10, 4, 3.2, (dx, dy) => P.gold[dx + dy < -0.2 ? 3 : 1]);
      ell(10, 7, 4, 3.2, (dx, dy) => {
        const d = dx * dx + dy * dy;
        return d > 0.55 ? P.gold[dx + dy < 0 ? 3 : 0] : P.gold[2];
      });
      set(10, 7, P.gold[0]);
      set(9, 6, P.gold[0]);
      set(11, 8, P.gold[1]);
    },
    amulet: ({ ell, line, set, P }) => {
      line(4, 2, 8, 8, 1, P.hide[2]);
      line(12, 2, 8, 8, 1, P.hide[2]);
      ell(
        8,
        11,
        3.6,
        3.8,
        (dx, dy) => P.copper[dx + dy < -0.3 ? 3 : dx + dy > 0.6 ? 0 : 1],
      );
      set(8, 11, P.red[2]);
      set(8, 10, P.red[3]);
      set(7, 11, P.red[1]);
      set(9, 11, P.red[1]);
    },
    // the hunt
    grain: ({ line, ell, P }) => {
      for (let k = 0; k < 3; k++) {
        const x = 5 + k * 3;
        line(x, 14, x + 1, 6, 1, P.grass[1]);
        for (let j = 0; j < 4; j++)
          ell(
            x + 1 + (j % 2 ? 0.8 : -0.6),
            3 + j * 1.6,
            1,
            1.1,
            P.amber[j % 2 ? 2 : 3],
          );
      }
    },
    flour: ({ poly, ell, set, P }) => {
      poly(
        [
          [3, 6],
          [13, 6],
          [14, 14],
          [2, 14],
        ],
        (x, y) => (x < 6 ? P.wool[3] : y > 12 ? P.wool[0] : P.wool[2]),
      );
      ell(8, 6, 5, 1.6, (dx, dy) => (dy < 0 ? [250, 248, 244] : P.wool[1]));
      poly(
        [
          [6, 3],
          [10, 3],
          [9, 6],
          [7, 6],
        ],
        P.cord[2],
      );
      set(8, 10, P.wool[1]);
      set(9, 11, P.wool[1]);
    },
    bread: ({ ell, line, P }) => {
      ell(
        8,
        9.5,
        6.5,
        4.5,
        (dx, dy) =>
          P.roast[
            Math.max(0, Math.min(3, Math.round(2.6 - dx * 0.8 - dy * 1.6)))
          ],
      );
      line(5, 8, 7, 10, 1, P.amber[3]);
      line(8, 7, 10, 9, 1, P.amber[3]);
      line(11, 7, 12, 9, 1, P.amber[3]);
    },
    fish: ({ poly, ell, set, P }) => {
      poly(
        [
          [2, 8],
          [9, 4],
          [13, 8],
          [9, 12],
        ],
        (x, y) => (y < 7 ? P.ice[3] : y > 9 ? P.stone[1] : P.ice[2]),
      );
      poly(
        [
          [12, 8],
          [15, 5],
          [15, 11],
        ],
        P.ice[1],
      );
      set(5, 7, P.ink);
      set(9, 8, P.ice[1]);
      void ell;
    },
    roastfish: ({ poly, line, set, P }) => {
      poly(
        [
          [2, 8],
          [9, 4],
          [13, 8],
          [9, 12],
        ],
        (x, y) => (y < 7 ? P.roast[3] : y > 9 ? P.roast[0] : P.roast[2]),
      );
      poly(
        [
          [12, 8],
          [15, 5],
          [15, 11],
        ],
        P.roast[1],
      );
      line(6, 6, 6, 10, 1, P.roast[0]);
      line(9, 5, 9, 11, 1, P.roast[0]);
      set(4, 7, P.ink);
    },
    smokedfish: ({ poly, line, set, P }) => {
      poly(
        [
          [2, 9],
          [9, 5],
          [13, 9],
          [9, 12],
        ],
        (x, y) => (y < 8 ? P.amber[1] : y > 10 ? P.roast[0] : P.roast[1]),
      );
      poly(
        [
          [12, 9],
          [15, 6],
          [15, 12],
        ],
        P.roast[0],
      );
      line(8, 2, 8, 6, 1, P.cord[2]);
      set(5, 8, P.ink);
    },
    fishline: ({ ell, line, P }) => {
      line(3, 3, 12, 3, 2, P.wood[2]);
      line(12, 3, 12, 11, 1, P.cord[3]);
      ell(12, 12.5, 1.6, 1.6, (dx, dy) =>
        dy < 0.2 && dx < 0.3 ? null : P.bone[2],
      );
      line(10.5, 12, 10.5, 10.5, 1, P.bone[3]);
    },
    // from a field and a pen of your own
    turnip: ({ ell, line, poly, P }) => {
      line(8, 7, 5, 2, 1, P.grass[2]);
      line(8, 7, 8, 1, 1, P.grass[1]);
      line(8, 7, 11, 2, 1, P.grass[2]);
      poly(
        [
          [3, 2],
          [6, 1],
          [6, 4],
        ],
        P.grass[2],
      );
      poly(
        [
          [10, 1],
          [13, 2],
          [10, 4],
        ],
        P.grass[3],
      );
      ell(8, 10.5, 4.6, 4, (dx, dy) =>
        dy < -0.25
          ? [150, 70, 120]
          : dx + dy > 0.7
            ? [196, 188, 176]
            : [240, 234, 222],
      );
      line(8, 14, 8, 15, 1, [196, 188, 176]);
    },
    egg: ({ ell }) => {
      ell(
        8,
        9,
        4.2,
        5.4,
        (dx, dy) =>
          [
            [248, 236, 212],
            [234, 214, 182],
            [212, 186, 150],
            [178, 148, 110],
          ][Math.max(0, Math.min(3, Math.round(1.1 + dx * 0.9 + dy * 1.1)))],
      );
    },
    roastegg: ({ ell, line, P }) => {
      ell(
        8,
        9,
        4.2,
        5.4,
        (dx, dy) =>
          P.roast[
            Math.max(0, Math.min(3, Math.round(2.6 - dx * 0.9 - dy * 1.1)))
          ],
      );
      line(5, 8, 7, 10, 1, P.roast[0]);
      line(7, 10, 9, 8, 1, P.roast[0]);
      line(9, 8, 11, 10, 1, P.roast[0]);
    },
    milk: ({ ell, poly, line, P }) => {
      poly(
        [
          [5, 5],
          [11, 5],
          [13, 13],
          [3, 13],
        ],
        (x) => (x < 6 ? P.rust[3] : x > 10 ? P.rust[1] : P.rust[2]),
      );
      ell(8, 5, 3.2, 1.3, [250, 248, 242]);
      line(12, 6, 14, 9, 1, P.rust[1]);
      line(14, 9, 12, 11, 1, P.rust[1]);
    },
    cheese: ({ ell, poly, set, P }) => {
      poly(
        [
          [2, 8],
          [14, 8],
          [14, 12],
          [2, 12],
        ],
        (x) => (x < 5 ? P.amber[3] : x > 11 ? P.amber[1] : P.amber[2]),
      );
      ell(8, 12, 6, 2, (dx, dy) => (dy > 0 ? P.amber[1] : null));
      ell(8, 8, 6, 2.4, P.gold[3]);
      set(6, 8, P.gold[2]);
      set(10, 7, P.gold[2]);
      set(9, 9, P.gold[2]);
    },
    porridge: ({ ell, poly, line, P }) => {
      poly(
        [
          [2, 9],
          [14, 9],
          [12, 14],
          [4, 14],
        ],
        (x, y) => (y > 12 ? P.wood[1] : P.wood[2]),
      );
      ell(8, 9, 6, 2, [236, 222, 190]);
      line(6, 6, 7, 3, 1, [214, 214, 222]);
      line(10, 6, 9, 3, 1, [214, 214, 222]);
    },
    stew: ({ ell, poly, set, P }) => {
      poly(
        [
          [2, 9],
          [14, 9],
          [12, 14],
          [4, 14],
        ],
        (x, y) => (y > 12 ? P.wood[0] : P.wood[1]),
      );
      ell(8, 9, 6, 2, P.roast[2]);
      set(6, 9, [240, 234, 222]);
      set(9, 8, [150, 70, 120]);
      set(10, 9, P.red[1]);
      set(7, 8, P.red[2]);
      set(11, 8, [240, 234, 222]);
    },
    hen: ({ ell, poly, line, set, P }) => {
      poly(
        [
          [1, 3],
          [5, 8],
          [2, 9],
        ],
        P.roast[1],
      );
      ell(
        7.5,
        9,
        5,
        3.6,
        (dx, dy) =>
          P.roast[
            Math.max(0, Math.min(3, Math.round(2.6 - dx * 0.6 - dy * 1.2)))
          ],
      );
      ell(12, 5, 2.1, 2.1, P.roast[3]);
      set(11, 2, P.red[2]);
      set(12, 2, P.red[2]);
      set(12, 3, P.red[3]);
      set(13, 7, P.red[2]);
      set(14, 5, P.gold[2]);
      set(15, 5, P.gold[2]);
      set(12, 4, P.ink);
      line(7, 12, 7, 15, 1, P.gold[2]);
      line(9, 12, 9, 15, 1, P.gold[2]);
    },
    goat: ({ poly, line, ell, set, P }) => {
      ell(7, 8, 5, 3, (dx, dy) => P.wool[dy > 0.3 ? 1 : 2]);
      for (const x of [4, 6, 9, 11]) line(x, 10, x, 14, 1, P.wool[1]);
      poly(
        [
          [10, 7],
          [13, 3],
          [15, 5],
          [13, 8],
        ],
        P.wool[2],
      );
      line(13, 3, 11, 1, 1, P.hide[0]);
      line(14, 3, 13, 1, 1, P.hide[0]);
      line(15, 6, 15, 8, 1, P.wool[0]);
      set(14, 4, P.ink);
      set(2, 6, P.wool[2]);
    },
    sheep: ({ ell, line, set, P }) => {
      for (const [x, y, r] of [
        [5, 8, 3.2],
        [8, 7, 3.4],
        [10, 8.5, 3],
        [7, 10, 3],
      ])
        ell(
          x,
          y,
          r,
          r * 0.85,
          (dx, dy) =>
            P.wool[
              Math.max(0, Math.min(3, Math.round(2.4 - dx * 0.5 - dy * 1.2)))
            ],
        );
      ell(13, 7, 2, 2.2, [58, 50, 46]);
      set(14, 6, [236, 236, 236]);
      for (const x of [5, 7, 10, 12]) line(x, 11, x, 14, 1, [58, 50, 46]);
    },
    deedfield: ({ poly, line, ell, set, P }) => {
      const hide = [
        [236, 220, 186],
        [214, 194, 154],
        [178, 156, 116],
      ];
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
      for (let k = 0; k < 3; k++)
        line(
          5 + k,
          9 - k * 0.5,
          9 + k,
          6.5 - k * 0.5,
          1,
          k % 2 ? P.grass[2] : P.amber[2],
        );
      line(8, 12, 9, 5, 1, P.cord[1]);
      ell(
        10.5,
        11,
        2.2,
        2.2,
        (dx, dy) => P.grass[dx + dy < -0.3 ? 3 : dx + dy > 0.5 ? 0 : 2],
      );
      set(10, 10, P.grass[3]);
    },
    deedpen: ({ poly, line, ell, set, P }) => {
      const hide = [
        [236, 220, 186],
        [214, 194, 154],
        [178, 156, 116],
      ];
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
      for (const x of [5, 7, 9, 11])
        line(x, 9 - (x - 5) * 0.55, x, 7 - (x - 5) * 0.55, 1, P.wood[1]);
      line(5, 8, 11, 4.7, 1, P.wood[2]);
      line(8, 12, 9, 5, 1, P.cord[1]);
      ell(
        10.5,
        11,
        2.2,
        2.2,
        (dx, dy) => P.roast[dx + dy < -0.3 ? 3 : dx + dy > 0.5 ? 0 : 2],
      );
      set(10, 10, P.red[2]);
    },
    rawmeat: ({ ell, set, P }) => {
      ell(
        8,
        9,
        6,
        4.6,
        (dx, dy) =>
          P.red[
            Math.max(0, Math.min(3, Math.round(2.2 - dx * 1.1 - dy * 1.2)))
          ],
      );
      ell(9.5, 8, 2.4, 1.6, (dx, dy) =>
        dx * dx + dy * dy < 0.6 ? [238, 220, 206] : null,
      );
      set(4, 10, P.red[0]);
      set(12, 11, P.red[0]);
    },
    roastmeat: ({ ell, line, set, P }) => {
      line(3, 14, 13, 4, 1, P.bone[2]);
      ell(
        8,
        9,
        5.5,
        4.2,
        (dx, dy) =>
          P.roast[Math.max(0, Math.min(3, Math.round(2.2 - dx - dy * 1.2)))],
      );
      set(6, 7, P.roast[3]);
      set(10, 10, P.roast[0]);
    },
    hide: ({ poly, set, P }) => {
      poly(
        [
          [2, 5],
          [5, 3],
          [11, 3],
          [14, 5],
          [13, 9],
          [14, 13],
          [10, 12],
          [6, 12],
          [2, 13],
          [3, 9],
        ],
        (x, y) =>
          (x * 3 + y * 5) % 7 === 0 ? P.hide[1] : y < 6 ? P.hide[3] : P.hide[2],
      );
      set(8, 7, P.hide[1]);
      set(6, 9, P.hide[1]);
    },
    leather: ({ poly, line, P }) => {
      poly(
        [
          [2, 6],
          [13, 4],
          [14, 11],
          [3, 13],
        ],
        (x, y) => (y + x * 0.2 < 8 ? P.leather[3] : P.leather[2]),
      );
      line(3, 9, 13, 7, 1, P.leather[1]);
      line(5, 12, 7, 5, 1, P.leather[1]);
    },
    bow: ({ line, set, P }) => {
      for (let k = 0; k <= 12; k++) {
        const t = k / 12,
          a = -1.1 + t * 2.2,
          x = 4 + Math.cos(a) * 9,
          y = 8 + Math.sin(a) * 7;
        set(x - 4, y, k % 6 === 0 ? P.leather[2] : P.wood[t < 0.5 ? 3 : 2]);
        set(x - 3, y, P.wood[1]);
      }
      line(5, 2, 5, 14, 1, [230, 226, 210]);
    },
    arrow: ({ line, poly, P }) => {
      line(3, 13, 12, 4, 1, (k, t) => P.wood[t < 0.5 ? 2 : 3]);
      poly(
        [
          [11, 3],
          [14, 2],
          [13, 5],
        ],
        P.flint[3],
      );
      line(2, 12, 4, 14, 1, P.grass[3]);
      line(3, 11, 5, 13, 1, P.grass[2]);
    },
    obarrow: ({ line, poly, P }) => {
      line(3, 13, 12, 4, 1, (k, t) => P.wood[t < 0.5 ? 2 : 3]);
      poly(
        [
          [11, 3],
          [14, 2],
          [13, 5],
        ],
        P.obs[3],
      );
      line(2, 12, 4, 14, 1, P.red[2]);
      line(3, 11, 5, 13, 1, P.red[3]);
    },
    // to wear against blows
    leathercap: ({ ell, line, P }) => {
      ell(8, 9, 5.6, 4.6, (dx, dy) =>
        dy > 0.45
          ? null
          : P.leather[Math.max(0, Math.min(3, Math.round(2.3 - dx - dy)))],
      );
      line(3, 10, 13, 10, 1, P.leather[1]);
      line(8, 5, 8, 9, 1, P.leather[1]);
    },
    jerkin: ({ poly, line, P }) => {
      poly(
        [
          [3, 3],
          [6, 2],
          [8, 4],
          [10, 2],
          [13, 3],
          [13, 14],
          [3, 14],
        ],
        (x, y) => (x < 7 ? P.leather[3] : P.leather[2]),
      );
      line(8, 5, 8, 14, 1, P.leather[0]);
      for (const y of [7, 10, 13]) line(4, y, 12, y, 1, P.leather[1]);
    },
    boots: ({ poly, P }) => {
      poly(
        [
          [2, 4],
          [6, 4],
          [6, 11],
          [8, 13],
          [2, 13],
        ],
        (x, y) => (y > 11 ? P.leather[0] : x < 4 ? P.leather[3] : P.leather[2]),
      );
      poly(
        [
          [9, 3],
          [13, 3],
          [13, 10],
          [15, 12],
          [9, 12],
        ],
        (x, y) =>
          y > 10 ? P.leather[0] : x < 11 ? P.leather[3] : P.leather[2],
      );
    },
    copperhelm: ({ ell, line, P }) => {
      ell(8, 9, 5.8, 5, (dx, dy) =>
        dy > 0.5
          ? null
          : P.amber[Math.max(0, Math.min(3, Math.round(2.4 - dx - dy)))],
      );
      line(3, 11, 13, 11, 1, P.leather[1]);
      line(8, 4, 8, 11, 1, P.amber[1]);
    },
    copperscale: ({ poly, set, P }) => {
      poly(
        [
          [3, 3],
          [6, 2],
          [8, 4],
          [10, 2],
          [13, 3],
          [13, 14],
          [3, 14],
        ],
        (x, y) =>
          (x + (y % 2) * 1) % 2 ? P.amber[2] : y % 2 ? P.amber[3] : P.amber[1],
      );
      for (let y = 5; y < 14; y += 2)
        for (let x = 4; x < 13; x += 2) set(x, y, P.copper[2]);
    },
    bronzehelm: ({ ell, poly, line, P }) => {
      ell(8, 9, 5.6, 5, (dx, dy) =>
        dy > 0.5
          ? null
          : P.gold[Math.max(0, Math.min(3, Math.round(2.4 - dx - dy)))],
      );
      poly(
        [
          [6, 1],
          [10, 1],
          [11, 5],
          [5, 5],
        ],
        (x) => (x < 8 ? P.red[3] : P.red[2]),
      );
      line(4, 10, 6, 13, 1, P.gold[1]);
      line(12, 10, 10, 13, 1, P.gold[1]);
    },
    // a house-wright's deed: a strip of hide rolled up, tied, with a seal and a little house mark
    deedhut: (o) => deedIcon(o, o.P.red, 1),
    deedhouse: (o) => deedIcon(o, o.P.copper, 2),
    deedhall: (o) => deedIcon(o, o.P.gold, 3),
    // building on: a porch, a house made bigger
    deedporch: (o) => deedIcon(o, o.P.leather, 1),
    deedtohouse: (o) => deedIcon(o, o.P.copper, 2),
    deedtohall: (o) => deedIcon(o, o.P.gold, 3),
    // a stall deed: a little striped awning over a counter, on the deed's roll
    deedstall: ({ poly, line, ell, set, P }) => {
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
      poly(
        [
          [3, 3],
          [13, 3],
          [14, 6],
          [2, 6],
        ],
        (x) => (Math.floor(x / 2) % 2 ? P.red[2] : hide[0]),
      );
      line(3, 6, 3, 10, 1, P.wood[1]);
      line(13, 6, 13, 9, 1, P.wood[1]);
      poly(
        [
          [3, 8],
          [13, 8],
          [13, 10],
          [3, 10],
        ],
        (x, y) => (y < 9 ? P.wood[3] : P.wood[2]),
      );
      ell(10.5, 12, 2, 2, (dx, dy) => P.copper[dx + dy < -0.3 ? 3 : 1]);
      set(10, 12, P.copper[3]);
    },
    // built into a house of yours: an oven, a bench and an anvil, a loom (a deed with what it is drawn on it)
    deedoven: (o) => workDeedIcon(o, "oven"),
    deedforge: (o) => workDeedIcon(o, "forge"),
    deedloom: (o) => workDeedIcon(o, "loom"),
    deedwell: (o) => workDeedIcon(o, "well"),
    deedhives: (o) => workDeedIcon(o, "hives"),
    deedstable: (o) => workDeedIcon(o, "stable"),
    deedpalisade: (o) => workDeedIcon(o, "palisade"),
    // from the hives
    honey: ({ poly, set, P }) => {
      // a comb: hexagon cells, gold, a drip off the bottom
      poly(
        [
          [4, 3],
          [12, 3],
          [14, 8],
          [12, 13],
          [4, 13],
          [2, 8],
        ],
        (x, y) =>
          (x + (y % 2 ? 1 : 0)) % 3 === 0 || y % 3 === 0
            ? P.amber[1]
            : x + y < 13
              ? P.gold[3]
              : P.amber[2],
      );
      set(9, 14, P.amber[2]);
      set(9, 15, P.gold[2]);
    },
    honeycake: ({ ell, poly, line, P }) => {
      ell(8, 10.5, 6.2, 3.6, (dx, dy) =>
        dy > 0.35
          ? P.roast[1]
          : P.roast[Math.max(1, Math.min(3, Math.round(2.6 - dx * 0.6 - dy)))],
      );
      poly(
        [
          [4, 8],
          [12, 8],
          [11, 10],
          [5, 10],
        ],
        P.gold[2],
      );
      line(6, 10, 6, 12, 1, P.gold[3]);
      line(10, 10, 10, 11, 1, P.gold[3]);
    },
    // from the oven
    berrypie: ({ ell, line, set, P }) => {
      ell(8, 10, 6.6, 4, (dx, dy) =>
        dy > 0.4
          ? P.roast[1]
          : P.amber[
              Math.max(1, Math.min(3, Math.round(2.4 - dx * 0.7 - dy * 0.9)))
            ],
      );
      line(3, 11, 13, 11, 1, P.roast[2]);
      for (const [x, y] of [
        [6, 8],
        [8, 9],
        [10, 8],
        [7, 10],
        [11, 10],
        [9, 7],
      ])
        set(x, y, P.berry[(x + y) % 2 ? 2 : 1]);
      line(5, 9, 11, 9, 1, (k, t) => (t > 0.3 && t < 0.7 ? P.amber[3] : null));
    },
    meatpie: ({ ell, line, set, P }) => {
      ell(8, 10, 6.6, 4.2, (dx, dy) =>
        dy > 0.4
          ? P.roast[0]
          : P.roast[
              Math.max(1, Math.min(3, Math.round(2.6 - dx * 0.7 - dy * 0.9)))
            ],
      );
      line(3, 11, 13, 11, 1, P.roast[1]);
      line(6, 8, 10, 8, 1, P.amber[3]);
      line(8, 7, 8, 9, 1, P.amber[3]);
      set(8, 8, P.roast[0]);
      set(5, 10, P.amber[2]);
      set(11, 10, P.amber[2]);
    },
    waybread: ({ ell, set, P }) => {
      for (const [cx, cy] of [
        [8, 12],
        [8, 9],
        [8, 6],
      ])
        ell(cx, cy, 5.5, 2.4, (dx, dy) =>
          dy > 0.2 ? P.roast[1] : P.amber[dx < 0 ? 2 : 1],
        );
      for (const [x, y] of [
        [6, 5],
        [9, 6],
        [11, 5],
        [7, 8],
      ])
        set(x, y, P.wool[3]);
    },
    // from the loom
    cloth: ({ poly, line, P }) => {
      for (let k = 0; k < 3; k++) {
        const y = 4 + k * 3;
        poly(
          [
            [2, y + 1],
            [13, y],
            [14, y + 3],
            [3, y + 4],
          ],
          (x, yy) => (yy <= y + 1 ? P.wool[3] : x < 5 ? P.wool[2] : P.wool[1]),
        );
      }
      line(3, 14, 14, 13, 1, P.wool[0]);
      line(14, 4, 14, 13, 1, P.wool[0]);
    },
    quilted: ({ poly, line, P }) => {
      // stitched through in diamonds
      poly(
        [
          [3, 3],
          [6, 2],
          [8, 4],
          [10, 2],
          [13, 3],
          [13, 14],
          [3, 14],
        ],
        (x, y) =>
          (x + y) % 3 === 0 || (x - y + 30) % 3 === 0
            ? P.wool[1]
            : x < 7
              ? P.wool[3]
              : P.wool[2],
      );
      line(8, 5, 8, 14, 1, P.wool[0]);
    },
    woolcap: ({ ell, line, set, P }) => {
      ell(8, 9.5, 5.6, 4.6, (dx, dy) =>
        dy > 0.45
          ? null
          : P.wool[Math.max(0, Math.min(3, Math.round(2.3 - dx - dy)))],
      );
      line(3, 10, 13, 10, 2, P.wool[1]);
      set(8, 4, P.wool[3]);
      set(8, 3, P.wool[2]);
    },
    banner: ({ poly, line, P }) => {
      line(2, 2, 14, 2, 1, P.wood[2]);
      poly(
        [
          [3, 3],
          [13, 3],
          [13, 13],
          [8, 11],
          [3, 13],
        ],
        (x, y) =>
          [P.red[2], P.wool[3], P.amber[2], P.wool[3], P.copper[2]][
            Math.floor((y - 3) / 2) % 5
          ],
      );
      line(3, 3, 3, 13, 1, P.wool[1]);
    },
    // the purse on your belt
    purse: ({ ell, poly, line, set, P }) => {
      ell(
        8,
        10,
        5.5,
        4.6,
        (dx, dy) =>
          P.leather[
            Math.max(0, Math.min(3, Math.round(2.2 - dx * 1.1 - dy * 1.3)))
          ],
      );
      poly(
        [
          [5, 4],
          [11, 4],
          [10, 7],
          [6, 7],
        ],
        (x) => (x < 8 ? P.leather[3] : P.leather[2]),
      );
      line(5, 7, 11, 7, 1, P.cord[1]);
      line(8, 7, 9, 9, 1, P.cord[2]);
      ell(12.5, 12.5, 2.2, 1.8, (dx, dy) => P.gold[dx + dy < 0 ? 3 : 1]);
      set(12, 12, P.gold[0]);
    },
    bedroll: ({ ell, poly, line, P }) => {
      poly(
        [
          [2, 10],
          [11, 10],
          [11, 14],
          [2, 14],
        ],
        (x, y) => (y === 12 ? P.grass[1] : P.grass[2]),
      );
      ell(12, 10, 3, 3.6, (dx, dy) =>
        dx * dx + dy * dy < 0.3 ? P.grass[1] : P.grass[3],
      );
      line(12, 6, 12, 14, 1, P.cord[2]);
    },
  };

