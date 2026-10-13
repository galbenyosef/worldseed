// index-inline-2 122 — math
// Lines 61551-61776 of readable/index-inline-2.pretty.js (statement-aligned).
  const EW = 44,
    EH = 48;
  const WARM_RAMP = [
    [60, 16, 12],
    [150, 40, 20],
    [224, 96, 32],
    [250, 176, 64],
    [255, 236, 170],
  ];
  const COLD_RAMP = [
    [16, 22, 60],
    [40, 70, 150],
    [80, 150, 220],
    [160, 214, 245],
    [235, 248, 255],
  ];
  const BRASS = [
    [58, 40, 16],
    [104, 76, 30],
    [158, 122, 52],
    [216, 184, 102],
    [246, 226, 160],
  ];
  const eLerp = (a, b, t) => [
    a[0] + (b[0] - a[0]) * t,
    a[1] + (b[1] - a[1]) * t,
    a[2] + (b[2] - a[2]) * t,
  ];
  function eHash(x, y, s) {
    let h = (x * 374761393 + y * 668265263 + s * 1274126177) | 0;
    h = ((h ^ (h >>> 13)) * 1274126177) | 0;
    return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
  }

  class Ember {
    constructor(canvas) {
      this.canvas = canvas;
      canvas.width = EW;
      canvas.height = EH;
      this.ctx = canvas.getContext("2d");
      this.img = this.ctx.createImageData(EW, EH);
      this.alpha = 0;
      this.fineFor = 0;
      this.last = null;
      this.shown = { hp: 100, warmth: 70, food: 60, breath: 100 };
    }
    // should it be on screen: when something is wrong, or has just changed
    wanted(b, dt) {
      const wrong =
        b.hp < 96 || b.breath < 97 || b.cold || b.food < 18 || b.winded;
      const l = this.last;
      const moved =
        l &&
        (Math.abs(l.hp - b.hp) > 0.5 ||
          Math.abs(l.food - b.food) > 2 ||
          Math.abs(l.warmth - b.warmth) > 3);
      this.last = { hp: b.hp, food: b.food, warmth: b.warmth };
      if (wrong || moved) this.fineFor = 0;
      else this.fineFor += dt;
      return this.fineFor < 2.5;
    }
    draw(body, tSec, dt, force = false) {
      const want = force || this.wanted(body, dt);
      this.alpha = Math.max(
        0,
        Math.min(1, this.alpha + (want ? dt * 3 : -dt * 1.2)),
      );
      this.canvas.style.opacity = this.alpha.toFixed(2);
      if (this.alpha <= 0.001) return;
      // ease the shown values so it breathes rather than jumps
      const s = this.shown,
        k = Math.min(1, dt * 4);
      for (const key of ["hp", "warmth", "food", "breath"])
        s[key] += ((body[key] ?? 0) - s[key]) * k;
      const px = this.img.data;
      px.fill(0);
      const put = (x, y, c, a = 255) => {
        x = Math.round(x);
        y = Math.round(y);
        if (x < 0 || y < 0 || x >= EW || y >= EH) return;
        const i = (y * EW + x) * 4;
        px[i] = c[0];
        px[i + 1] = c[1];
        px[i + 2] = c[2];
        px[i + 3] = a;
      };
      const hp = s.hp / 100,
        wm = s.warmth / 100,
        fd = s.food / 100,
        st = s.breath / 100;
      const ramp = [0, 1, 2, 3, 4].map((i) =>
        eLerp(
          COLD_RAMP[i],
          WARM_RAMP[i],
          Math.min(1, Math.max(0, (wm - 0.08) * 1.6)),
        ),
      );
      const cx = 22,
        cy = 27,
        RIN = 15.5,
        ROUT = 19;
      // the loop it hangs from
      for (let y = 1; y < 9; y++)
        for (let x = 17; x < 28; x++) {
          const d = Math.hypot(x + 0.5 - cx, y + 0.5 - 5);
          if (d > 2.2 && d < 4.2) put(x, y, BRASS[y < 5 ? 3 : 1]);
        }
      // glass and rim
      for (let y = 0; y < EH; y++)
        for (let x = 0; x < EW; x++) {
          const dx = x + 0.5 - cx,
            dy = y + 0.5 - cy,
            d = Math.hypot(dx, dy);
          if (d > ROUT) continue;
          if (d > RIN) {
            const lit = -(dx + dy) / (d * 1.414);
            put(
              x,
              y,
              BRASS[
                Math.max(
                  0,
                  Math.min(
                    4,
                    Math.round(2 + lit * 1.6 + (d > ROUT - 1 ? -1 : 0)),
                  ),
                )
              ],
            );
          } else {
            const v = 0.5 + (dy / RIN) * 0.5;
            put(
              x,
              y,
              [
                Math.round(10 + v * 8),
                Math.round(12 + v * 10),
                Math.round(26 + v * 16),
              ],
              235,
            );
          }
        }
      const alive = hp > 0.01,
        base = cy + 10;
      // coals in the bottom of the glass: how fed you are
      const nC = Math.round(fd * 7);
      for (let i = 0; i < 7; i++) {
        const x = cx - 7 + i * 2,
          y = base + 1 + (i % 2),
          lit = i < nC && alive;
        const glow = lit
          ? ramp[2 + ((eHash(i, Math.floor(tSec * 3), 5) * 2) | 0)]
          : [44, 38, 42];
        put(x, y, glow);
        put(x + 1, y, lit ? ramp[2] : [34, 30, 34]);
        put(x, y + 1, lit ? ramp[1] : [26, 22, 26]);
        put(x + 1, y + 1, lit ? ramp[1] : [22, 18, 22]);
      }
      if (alive) {
        // the flame: its size is your health
        const fh = 4 + hp * 17,
          fw = 1.8 + hp * 4;
        for (let y = 0; y < fh; y++) {
          const kk = y / fh,
            wob =
              Math.sin(tSec * 7 + y * 0.5) * kk * 1.2 +
              (body.winded ? Math.sin(tSec * 19) * kk : 0);
          const half =
            fw *
            (1 - kk) *
            (0.55 + 0.45 * Math.sin(Math.min(1, kk * 3) * 1.57));
          for (let x = -Math.ceil(half); x <= Math.ceil(half); x++) {
            const d = Math.abs(x) / (half + 0.01);
            if (d > 1) continue;
            if (hp < 0.35 && eHash(x, y, Math.floor(tSec * 9)) < 0.3 * (1 - hp))
              continue;
            const lvl = Math.max(
              0,
              Math.min(
                4,
                Math.round(
                  4 -
                    d * 2.2 -
                    kk * 2.4 +
                    (eHash(x, y, Math.floor(tSec * 12)) - 0.5),
                ),
              ),
            );
            put(cx + x + wob, base - y, ramp[lvl]);
          }
        }
        // sparks circling inside the rim: your breath
        const n = Math.round(st * 8);
        for (let i = 0; i < n; i++) {
          const a = (i / 8) * 6.283 + tSec * 0.8,
            r = 12.5 + Math.sin(tSec * 2 + i) * 0.8;
          put(cx + Math.cos(a) * r, cy + Math.sin(a) * r, ramp[3]);
        }
      } else if (Math.floor(tSec * 2) % 2) put(cx, base, [90, 40, 30]);
      // a glint on the glass
      for (const [x, y] of [
        [cx - 9, cy - 8],
        [cx - 8, cy - 10],
        [cx - 7, cy - 11],
        [cx - 10, cy - 6],
      ])
        put(x, y, [220, 230, 255], 150);
      this.ctx.putImageData(this.img, 0, 0);
    }
  }

  // ============================================================
  // BOW SIGHT — the bow in your hands while you draw it: the stave just left
  // of where you look, the arrow lying across your fist and pointing at it,
  // the string coming back towards your cheek as you pull. Drawn all the way,
  // the arrowhead catches the light. A little bar shows how far it is drawn.
  // The canvas is centred on the middle of the view: the arrowhead sits there.
  // ============================================================
  const BSZ = 120;
  const BOW_SHADE = [
    [72, 46, 24],
    [124, 84, 46],
    [168, 120, 68],
    [206, 158, 98],
  ];
