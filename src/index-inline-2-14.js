// index-inline-2 14 — math
// Lines 4221-4373 of readable/index-inline-2.pretty.js (statement-aligned).
  const siteDot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
  const siteNorm = (v) => {
    const L = Math.hypot(v[0], v[1], v[2]) || 1;
    return [v[0] / L, v[1] / L, v[2] / L];
  };
  const siteAng = (a, b) =>
    Math.atan2(
      Math.hypot(
        a[1] * b[2] - a[2] * b[1],
        a[2] * b[0] - a[0] * b[2],
        a[0] * b[1] - a[1] * b[0],
      ),
      siteDot(a, b),
    );
  function siteDir(f, s, t) {
    const o = [0, 0, 0];
    faceToCube(f, Math.tan(s * SITE_QPI), Math.tan(t * SITE_QPI), o);
    return siteNorm(o);
  }
  // east and north at a point (the same frame the ground uses)
  function siteFrame(d) {
    let ex = d[2],
      ez = -d[0],
      L = Math.hypot(ex, ez);
    if (L < 1e-9) {
      ex = 1;
      ez = 0;
      L = 1;
    }
    const e = [ex / L, 0, ez / L];
    return {
      u: d,
      e,
      n: [
        d[1] * e[2] - d[2] * e[1],
        d[2] * e[0] - d[0] * e[2],
        d[0] * e[1] - d[1] * e[0],
      ],
    };
  }
  function siteStep(p, F, eastM, northM, R) {
    return siteNorm([
      p[0] + (F.e[0] * eastM + F.n[0] * northM) / R,
      p[1] + (F.e[1] * eastM + F.n[1] * northM) / R,
      p[2] + (F.e[2] * eastM + F.n[2] * northM) / R,
    ]);
  }
  // radians clockwise from north, from p towards q
  function siteBearing(p, q) {
    const F = siteFrame(p),
      d = siteDot(p, q);
    const t = [q[0] - p[0] * d, q[1] - p[1] * d, q[2] - p[2] * d];
    return Math.atan2(siteDot(t, F.e), siteDot(t, F.n));
  }

  // how far a place clears the ground around it (m): no trees grow through a house
  const SITE_CLEAR = {
    cairn: 2.6,
    stone: 2.2,
    shrine: 3,
    camp: 5,
    grave: 3,
    spring: 4.5,
    stash: 2.4,
    bones: 6,
    sign: 1.6,
    farm: 40,
    hamlet: 46,
    inn: 30,
    hut: 13,
    tents: 16,
    ruin: 22,
    tower: 15,
    circle: 15,
    barrow: 13,
    hotspring: 15,
    bigtree: 12,
    battlefield: 26,
    peak: 5,
    cave: 8,
    skystone: 28,
    giantbones: 24,
    geysers: 21,
    stonegrove: 19,
    hermit: 18,
    mill: 22,
    fishhut: 18,
    lighthouse: 24,
    mine: 15,
    ferry: 14,
    watch: 13,
    temple: 17,
    // the great city that fell: its walls, and a little beyond them
    deadcity: 116,
  };
  // who lives there
  const SITE_LIVED = new Set([
    "farm",
    "hamlet",
    "inn",
    "hut",
    "tents",
    "mill",
    "fishhut",
    "lighthouse",
    "mine",
    "ferry",
    "watch",
    "temple",
  ]);
  // the rare ones, worth a long walk: a star that fell, the bones of something vast, ground that
  // throws boiling water at the sky, a forest turned to stone
  const SITE_WONDER = new Set([
    "skystone",
    "giantbones",
    "geysers",
    "stonegrove",
    "deadcity",
  ]);
  const FORESTS = new Set([
    B.FOREST,
    B.WETFOREST,
    B.TAIGA,
    B.JUNGLE,
    B.DRYFOREST,
  ]);
  const OPEN = new Set([B.STEPPE, B.SAVANNA, B.TUNDRA, B.COLDDESERT, B.DESERT]);
  const FERTILE = {
    [B.STEPPE]: 1,
    [B.FOREST]: 1,
    [B.WETFOREST]: 0.8,
    [B.SAVANNA]: 0.9,
    [B.DRYFOREST]: 0.8,
    [B.TAIGA]: 0.45,
    [B.JUNGLE]: 0.45,
    [B.TUNDRA]: 0.12,
    [B.COLDDESERT]: 0.1,
    [B.DESERT]: 0.08,
  };

  function sitePick(rnd, w) {
    let tot = 0;
    for (const k in w) if (w[k] > 0) tot += w[k];
    if (tot <= 0) return null;
    let x = rnd() * tot;
    for (const k in w) {
      if (w[k] <= 0) continue;
      x -= w[k];
      if (x <= 0) return k;
    }
    return null;
  }

