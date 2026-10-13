// index-inline-2 95 — pts
// Lines 47873-47910 of readable/index-inline-2.pretty.js (statement-aligned).
  const CITY_STONE = {
    reef: [214, 206, 190],
    salt: [206, 178, 130],
    canopy: [152, 144, 126],
    stone: [150, 144, 152],
    frost: [178, 182, 194],
    grass: [194, 158, 112],
    wood: [162, 154, 142],
    ash: [88, 80, 86],
    isle: [224, 218, 202],
  };
  const cvWrap = (a) => Math.atan2(Math.sin(a), Math.cos(a));
  const cvSub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
  const cvCross = (a, b) => [
    a[1] * b[2] - a[2] * b[1],
    a[2] * b[0] - a[0] * b[2],
    a[0] * b[1] - a[1] * b[0],
  ];
  // a quad turned to face `want` (whatever order its corners came in), its pattern laid out in metres on it
  function cvFace(mb, pts, want, row, pat, o = null) {
    let n = cvCross(cvSub(pts[1], pts[0]), cvSub(pts[2], pts[0]));
    if (n[0] * want[0] + n[1] * want[1] + n[2] * want[2] < 0) {
      pts = [pts[3], pts[2], pts[1], pts[0]];
      n = [-n[0], -n[1], -n[2]];
    }
    const L = Math.hypot(n[0], n[1], n[2]) || 1,
      ny = n[1] / L;
    let uvs;
    if (Math.abs(ny) > 0.7) uvs = pts.map((p) => [p[0], p[2]]);
    else {
      const tx = -n[2],
        tz = n[0],
        tl = Math.hypot(tx, tz) || 1;
      uvs = pts.map((p) => [(p[0] * tx + p[2] * tz) / tl, p[1]]);
    }
    mb.quad(pts[0], pts[1], pts[2], pts[3], row, pat, uvs, o);
  }

