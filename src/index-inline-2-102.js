// index-inline-2 102 — rows
// Lines 51635-52422 of readable/index-inline-2.pretty.js (statement-aligned).
  function grazerProto(plan, rows, rnd) {
    const mb = new MeshBuf(true);
    mb.lvBase = 0.35;
    const H = plan.h,
      legH = H * plan.leg,
      bodyH = H * 0.34,
      bodyY = legH,
      len = plan.len;
    const hw =
      H *
      0.16 *
      (plan.wool ? 1.25 : 1) *
      (plan.shell ? 1.2 : 1) *
      (plan.wide || 1);
    const z0 = -len / 2,
      z1 = len / 2,
      fur = plan.wool || plan.fur ? PAT.HIDE : PAT.NONE;
    const O = (bone, pv) => ({ bone, pivot: pv || [0, 0, 0] });
    // a soft shadow on the ground
    mb.quad(
      [-hw * 2, 0.03, z1 + 0.1],
      [hw * 2, 0.03, z1 + 0.1],
      [hw * 2, 0.03, z0 - 0.1],
      [-hw * 2, 0.03, z0 - 0.1],
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
    // body: barrel, a deeper chest at the front, a rump at the back
    mb.box(
      -hw,
      bodyY,
      z0 + 0.06,
      hw,
      bodyY + bodyH,
      z1 - 0.04,
      rows.main,
      fur,
      O(0),
    );
    mb.box(
      -hw * 0.9,
      bodyY - 0.03,
      z0 + 0.12,
      hw * 0.9,
      bodyY + 0.05,
      z1 - 0.12,
      rows.belly,
      PAT.NONE,
      O(0),
    );
    mb.box(
      -hw * 1.04,
      bodyY - 0.04,
      z1 - len * 0.34,
      hw * 1.04,
      bodyY + bodyH * 1.1,
      z1 + 0.02,
      rows.main,
      fur,
      O(0),
    );
    mb.box(
      -hw * 0.98,
      bodyY + 0.02,
      z0,
      hw * 0.98,
      bodyY + bodyH * 0.98,
      z0 + len * 0.26,
      rows.main,
      fur,
      O(0),
    );
    if (plan.ridges)
      for (let k = 0; k < 9; k++) {
        const z = z1 - 0.1 - (k * (len - 0.2)) / 8;
        for (const sx of [-1, 1])
          mb.box(
            sx * hw * 0.45 - 0.03,
            bodyY + bodyH - 0.005,
            z - 0.05,
            sx * hw * 0.45 + 0.03,
            bodyY + bodyH + 0.05,
            z + 0.05,
            rows.spot,
            PAT.NONE,
            O(0),
          );
      }
    if (plan.hump)
      mb.box(
        -hw * 0.7,
        bodyY + bodyH * 0.9,
        -len * 0.18,
        hw * 0.7,
        bodyY + bodyH * 1.55,
        len * 0.16,
        rows.main,
        PAT.NONE,
        O(0),
      );
    // a boar's bristles, standing up along its spine from the neck to the middle of its back
    if (plan.crest)
      mb.box(
        -hw * 0.2,
        bodyY + bodyH - 0.01,
        -len * 0.05,
        hw * 0.2,
        bodyY + bodyH * 1.24,
        z1 - 0.02,
        rows.hoof,
        PAT.HIDE,
        O(0),
      );
    const HN = plan.hunter || null;
    // a bear's hump of muscle over the shoulders
    if (HN && HN.shoulder)
      mb.box(
        -hw * 0.8,
        bodyY + bodyH * 0.8,
        z1 - len * 0.44,
        hw * 0.8,
        bodyY + bodyH * 1.36,
        z1 - len * 0.06,
        rows.main,
        fur,
        O(0),
      );
    if (plan.shell) {
      // a domed shell over the back, in plates, its rim hanging over the flanks
      const cy = bodyY + bodyH * 0.35,
        rx = hw * 1.5,
        ry = bodyH * 1.5,
        zc = -len * 0.06,
        rz = len * 0.5,
        n = 7,
        m = 6;
      const P = (a, b) => {
        const c = Math.cos(b);
        return [
          Math.cos(a) * rx * c,
          cy + Math.sin(a) * ry * c,
          zc + Math.sin(b) * rz,
        ];
      };
      for (let k = 0; k < n; k++)
        for (let j = 0; j < m; j++) {
          const a0 = (k / n) * Math.PI,
            a1 = ((k + 1) / n) * Math.PI,
            b0 = (j / m - 0.5) * Math.PI * 0.92,
            b1 = ((j + 1) / m - 0.5) * Math.PI * 0.92;
          mb.quad(
            P(a0, b0),
            P(a0, b1),
            P(a1, b1),
            P(a1, b0),
            rows.shell,
            PAT.NONE,
            null,
            { ...O(0), lv: (k + j) % 2 ? -0.35 : 0.1 },
          );
        }
    }
    if (plan.spots)
      for (let k = 0; k < (plan.spotN || 10); k++) {
        const r = (plan.spotR || 0.06) * (1 + rnd() * 0.8),
          z = z0 + 0.12 + rnd() * (len - 0.3);
        // on the flanks, and (on a cat) over the back too
        if (plan.spotN && k % 3 === 2) {
          const x = (rnd() - 0.5) * hw * 1.4,
            y = bodyY + bodyH + 0.006;
          mb.quad(
            [x - r, y, z - r],
            [x + r, y, z - r],
            [x + r, y, z + r],
            [x - r, y, z + r],
            rows.spot,
            plan.spotPat || PAT.NONE,
            null,
            O(0),
          );
          continue;
        }
        const s = k % 2 ? 1 : -1,
          x = s * (hw * 1.05 + 0.006),
          y = bodyY + 0.06 + rnd() * bodyH * 0.8;
        mb.quad(
          [x, y - r, z - r],
          [x, y - r, z + r],
          [x, y + r, z + r],
          [x, y + r, z - r],
          rows.spot,
          plan.spotPat || PAT.NONE,
          null,
          O(0),
        );
      }
    // legs: the front pair under the shoulder, the back pair under the haunch
    const lw =
      Math.max(0.045, H * 0.042) *
      (plan.wool ? 1.2 : 1) *
      ((HN && HN.legW) || 1);
    for (const [sx, lz, bone0] of [
      [-1, z1 - 0.15, 2],
      [1, z1 - 0.15, 3],
      [-1, z0 + 0.15, 4],
      [1, z0 + 0.15, 5],
    ]) {
      if (plan.sprawl) {
        // a lizard's legs: out to the side from low on the flank, an elbow, then down to a splayed foot
        // (swinging round the hip, not under it)
        const xo = sx * (hw + lw * 3.2),
          ky = bodyY * 0.95,
          pv = [sx * hw, ky, lz],
          bone = bone0 + 5;
        mb.box(
          Math.min(sx * hw, xo) - 0.005,
          ky - lw * 0.8,
          lz - lw,
          Math.max(sx * hw, xo) + 0.005,
          ky + lw * 0.8,
          lz + lw,
          rows.main,
          PAT.NONE,
          O(bone, pv),
        );
        mb.box(
          xo - lw,
          0.04,
          lz - lw,
          xo + lw,
          ky + lw * 0.6,
          lz + lw,
          rows.main,
          PAT.NONE,
          O(bone, pv),
        );
        mb.box(
          xo - lw * 1.5,
          0,
          lz - lw * 1.2,
          xo + lw * 1.5,
          0.05,
          lz + lw * 2.2,
          rows.hoof,
          PAT.NONE,
          O(bone, pv),
        );
        continue;
      }
      const x = sx * (hw - lw),
        pv = [x, bodyY + 0.06, lz],
        bone = bone0;
      mb.box(
        x - lw,
        0.1,
        lz - lw,
        x + lw,
        bodyY + 0.1,
        lz + lw,
        rows.leg || rows.main,
        PAT.NONE,
        O(bone, pv),
      );
      mb.box(
        x - lw * 1.05,
        0,
        lz - lw * 1.1,
        x + lw * 1.05,
        0.1,
        lz + lw * 1.25,
        rows.hoof,
        PAT.NONE,
        O(bone, pv),
      );
    }
    // neck and head lean forward from the shoulder; the whole of it pivots there to graze
    const nk = H * plan.neck,
      hd = H * plan.head * 0.55;
    const S = [0, bodyY + bodyH * 0.8, z1 - 0.1];
    // (a hunter carries its head low and forward, level with its back)
    const nf = HN ? (HN.neckFwd ?? 0.6) : 0;
    const top = [
      0,
      S[1] + nk * (0.86 - 0.5 * nf),
      z1 + nk * (0.42 + 0.45 * nf),
    ];
    const nb = O(1, S);
    mb.prism(
      S,
      top,
      hw * 0.62 * (plan.neckW || 1),
      hw * 0.42 * (plan.neckW || 1),
      6,
      rows.main,
      fur,
      nb,
    );
    const hx = Math.max(0.06, hd * 0.42),
      y0 = top[1] - hd * 0.2,
      zh = top[2] - hd * 0.1;
    if (HN) {
      // a hunter's head: the skull, a muzzle out in front with a dark nose, eyes looking forward over it
      // (big enough to catch the light from a way off), a ruff of fur behind the jaw on a wolf
      const mw = HN.muzzleW || 0.6,
        sn = HN.snout ?? 0.6;
      mb.box(
        -hx,
        y0 - hd * 0.32,
        zh,
        hx,
        y0 + hd * 0.36,
        zh + hd * 0.95,
        rows.main,
        fur,
        nb,
      );
      mb.box(
        -hx * mw,
        y0 - hd * 0.32,
        zh + hd * 0.95,
        hx * mw,
        y0 + hd * 0.04,
        zh + hd * (0.95 + sn),
        HN.muzzleMain ? rows.main : rows.belly,
        PAT.NONE,
        nb,
      );
      // (a crocodile's teeth, along the line of its jaw)
      if (HN.teeth)
        for (const sx of [-1, 1])
          for (let k = 0; k < 6; k++) {
            const z = zh + hd * (1.05 + (sn * 0.85 * k) / 5);
            mb.box(
              sx * hx * mw - 0.008,
              y0 - hd * 0.2,
              z - 0.012,
              sx * hx * mw + 0.008,
              y0 - hd * 0.08,
              z + 0.012,
              rows.horn,
              PAT.NONE,
              nb,
            );
          }
      // (a boar's tusks, curving up out of the sides of its snout)
      if (plan.tusks)
        for (const sx of [-1, 1])
          mb.prism(
            [sx * hx * mw * 0.85, y0 - hd * 0.22, zh + hd * (0.95 + sn * 0.72)],
            [sx * hx * mw * 1.55, y0 + hd * 0.26, zh + hd * (0.95 + sn * 0.8)],
            0.024,
            0.006,
            4,
            rows.horn,
            PAT.NONE,
            nb,
          );
      mb.box(
        -hx * mw * 0.62,
        y0 - hd * 0.04,
        zh + hd * (0.83 + sn),
        hx * mw * 0.62,
        y0 + hd * 0.08,
        zh + hd * (0.98 + sn),
        rows.hoof,
        PAT.NONE,
        nb,
      );
      if (HN.ruff)
        mb.box(
          -hx * 1.35,
          y0 - hd * 0.52,
          zh - hd * 0.15,
          hx * 1.35,
          y0 + hd * 0.22,
          zh + hd * 0.42,
          rows.main,
          fur,
          nb,
        );
      for (const sx of [-1, 1])
        mb.box(
          sx * hx * 0.55 - hd * 0.12,
          y0 + hd * 0.1,
          zh + hd * 0.9,
          sx * hx * 0.55 + hd * 0.12,
          y0 + hd * 0.3,
          zh + hd * 0.99,
          rows.eye,
          plan.eyePat || PAT.NONE,
          nb,
        );
      for (const sx of [-1, 1]) {
        if (HN.ears === "none") continue;
        if (HN.ears === "round")
          mb.box(
            sx * hx * 0.78 - hd * 0.14,
            y0 + hd * 0.34,
            zh + hd * 0.18,
            sx * hx * 0.78 + hd * 0.14,
            y0 + hd * 0.6,
            zh + hd * 0.4,
            rows.main,
            fur,
            nb,
          );
        else {
          const tall = HN.ears === "tall";
          mb.cone(
            [sx * hx * 0.6, y0 + hd * 0.34, zh + hd * 0.3],
            y0 + hd * (tall ? 1.0 : 0.66),
            hd * (tall ? 0.2 : 0.15),
            4,
            rows.main,
            PAT.NONE,
            nb,
          );
        }
      }
    } else {
      // (a dark face on a sheep: rows.face)
      mb.box(
        -hx,
        y0 - hd * 0.32,
        zh,
        hx,
        y0 + hd * 0.32,
        zh + hd * 1.2,
        rows.face || rows.main,
        PAT.NONE,
        nb,
      );
      mb.box(
        -hx * 0.78,
        y0 - hd * 0.3,
        zh + hd * 1.2,
        hx * 0.78,
        y0 + hd * 0.06,
        zh + hd * 1.55,
        rows.face || rows.belly,
        PAT.NONE,
        nb,
      );
      for (const sx of [-1, 1])
        mb.box(
          sx * hx - 0.012,
          y0 + hd * 0.04,
          zh + hd * 0.5,
          sx * hx + 0.012,
          y0 + hd * 0.18,
          zh + hd * 0.66,
          rows.eye,
          plan.eyePat || PAT.NONE,
          nb,
        );
      // ears: out to the sides on most beasts; pricked and upright on a horse
      if (plan.earsUp)
        for (const sx of [-1, 1])
          mb.cone(
            [sx * hx * 0.62, y0 + hd * 0.3, zh + hd * 0.16],
            y0 + hd * 0.3 + hd * 0.5 * (plan.earLen || 1),
            hd * 0.11 * (plan.earLen ? 1.3 : 1),
            4,
            rows.main,
            PAT.NONE,
            nb,
          );
      else
        for (const sx of [-1, 1])
          mb.tri(
            [sx * hx * 0.7, y0 + hd * 0.3, zh + hd * 0.05],
            [sx * hx * 2.0, y0 + hd * 0.62, zh - hd * 0.18],
            [sx * hx * 0.9, y0 + hd * 0.3, zh + hd * 0.32],
            rows.face || rows.main,
            PAT.NONE,
            null,
            nb,
          );
    }
    if (plan.beard)
      mb.box(
        -hx * 0.3,
        y0 - hd * 0.75,
        zh + hd * 0.9,
        hx * 0.3,
        y0 - hd * 0.3,
        zh + hd * 1.3,
        rows.belly,
        PAT.NONE,
        nb,
      );
    const hy = y0 + hd * 0.3,
      hz = zh + hd * 0.25,
      hr = Math.max(0.03, H * 0.022);
    for (const sx of [-1, 1]) {
      const base = [sx * hx * 0.55, hy, hz];
      if (plan.horns === "antlers") {
        const ak = plan.antler || 1,
          t1 = [
            sx * (hx * 0.55 + hd * 0.85 * ak),
            hy + hd * 1.5 * ak,
            hz - hd * 0.45 * ak,
          ];
        mb.prism(base, t1, hr, hr * 0.6, 4, rows.horn, PAT.NONE, nb);
        for (let k = 1; k <= 3; k++) {
          const f = k / 4,
            q = [
              base[0] + (t1[0] - base[0]) * f,
              base[1] + (t1[1] - base[1]) * f,
              base[2] + (t1[2] - base[2]) * f,
            ];
          mb.prism(
            q,
            [
              q[0] + sx * hd * 0.1 * ak,
              q[1] + hd * 0.5 * ak,
              q[2] + hd * (k === 1 ? 0.45 : 0.2) * ak,
            ],
            hr * 0.6,
            hr * 0.35,
            3,
            rows.horn,
            PAT.NONE,
            nb,
          );
        }
      } else if (plan.horns === "curved") {
        const m = [sx * hx * 2.0, hy + hd * 0.15, hz],
          t = [sx * hx * 2.3, hy + hd * 0.8, hz + hd * 0.3];
        mb.prism(base, m, hr * 1.3, hr, 4, rows.horn, PAT.NONE, nb);
        mb.prism(m, t, hr, hr * 0.3, 4, rows.horn, PAT.NONE, nb);
      } else if (plan.horns === "swept") {
        const m = [sx * hx * 0.9, hy + hd * 0.75, hz - hd * 0.4],
          t = [sx * hx * 1.3, hy + hd * 0.6, hz - hd * 1.2];
        mb.prism(base, m, hr * 1.2, hr * 0.9, 4, rows.horn, PAT.NONE, nb);
        mb.prism(m, t, hr * 0.9, hr * 0.3, 4, rows.horn, PAT.NONE, nb);
      } else if (plan.horns === "straight") {
        mb.prism(
          base,
          [sx * hx * 0.8, hy + hd * 1.7, hz - hd * 0.6],
          hr,
          hr * 0.3,
          4,
          rows.horn,
          PAT.NONE,
          nb,
        );
      } else if (plan.horns === "stubs") {
        mb.prism(
          base,
          [sx * hx * 0.6, hy + hd * 0.45, hz],
          hr * 1.2,
          hr,
          4,
          rows.horn,
          PAT.NONE,
          nb,
        );
      }
      if (plan.tusks && !HN)
        mb.prism(
          [sx * hx * 0.6, y0 - hd * 0.2, zh + hd * 1.3],
          [sx * hx * 0.95, y0 + hd * 0.2, zh + hd * 1.6],
          hr * 0.8,
          hr * 0.3,
          3,
          rows.horn,
          PAT.NONE,
          nb,
        );
    }
    // a tail that swishes (a long full one on a horse)
    const tb = [0, bodyY + bodyH * 0.85, z0];
    if (plan.mane)
      mb.prism(
        tb,
        [0, bodyY - bodyH * 0.55, z0 - 0.16],
        Math.max(0.05, hw * 0.32),
        0.04,
        5,
        rows.mane,
        PAT.HIDE,
        O(6, tb),
      );
    else if (plan.tail) {
      // a hunter's tail: long, held out behind and hanging (a cat's in a curve, a wolf's thick with fur)
      const tl = plan.tail.len * len,
        md = [
          0,
          bodyY + bodyH * 0.6 - tl * plan.tail.drop * 0.4,
          z0 - tl * 0.55,
        ],
        end = [
          0,
          bodyY + bodyH * 0.5 - tl * plan.tail.drop,
          z0 - tl * (plan.tail.curl ? 0.8 : 0.95),
        ];
      mb.prism(
        tb,
        md,
        plan.tail.r,
        plan.tail.r * 0.9,
        5,
        rows.main,
        fur,
        O(6, tb),
      );
      mb.prism(
        md,
        end,
        plan.tail.r * 0.9,
        plan.tail.r * (plan.tail.brush ? 0.75 : 0.5),
        5,
        plan.tail.tip ? rows.belly : rows.main,
        fur,
        O(6, tb),
      );
      if (plan.tail.curl)
        mb.prism(
          end,
          [0, end[1] + tl * 0.12, end[2] - tl * 0.12],
          plan.tail.r * 0.5,
          plan.tail.r * 0.35,
          4,
          rows.main,
          fur,
          O(6, tb),
        );
    } else
      mb.prism(
        tb,
        [0, bodyY + bodyH * 0.05, z0 - 0.1],
        Math.max(0.035, hw * 0.25),
        0.02,
        4,
        rows.main,
        PAT.NONE,
        O(6, tb),
      );
    // a mane down the crest of the neck
    if (plan.mane)
      mb.prism(
        [0, S[1] + hw * 0.5, S[2] - 0.06],
        [0, top[1] + hw * 0.38, top[2] - 0.08],
        0.055,
        0.045,
        4,
        rows.mane,
        PAT.HIDE,
        nb,
      );
    // saddled for riding: a blanket, a seat with a pommel and a cantle, stirrup straps; behind a hump, on top of a shell
    let seat = bodyY + bodyH,
      seatZ = 0;
    if (plan.saddle) {
      const sy = bodyY + bodyH * (plan.shell ? 1.85 : 1.0),
        zc = plan.hump ? -len * 0.3 : -len * 0.02,
        sz0 = zc - len * 0.16,
        sz1 = zc + len * 0.16;
      mb.box(
        -hw * 1.1,
        sy - bodyH * (plan.shell ? 0.15 : 0.5),
        sz0 - 0.05,
        hw * 1.1,
        sy + 0.012,
        sz1 + 0.05,
        rows.blanket,
        PAT.CLOTH,
        O(0),
      );
      mb.box(
        -hw * 0.72,
        sy + 0.01,
        sz0,
        hw * 0.72,
        sy + 0.08,
        sz1,
        rows.saddle,
        PAT.HIDE,
        O(0),
      );
      mb.box(
        -hw * 0.5,
        sy + 0.08,
        sz1 - 0.06,
        hw * 0.5,
        sy + 0.17,
        sz1,
        rows.saddle,
        PAT.NONE,
        O(0),
      );
      mb.box(
        -hw * 0.6,
        sy + 0.08,
        sz0,
        hw * 0.6,
        sy + 0.13,
        sz0 + 0.06,
        rows.saddle,
        PAT.NONE,
        O(0),
      );
      for (const sx of [-1, 1]) {
        mb.box(
          sx * hw * 1.12 - 0.012,
          sy - bodyH * 0.9,
          zc - 0.02,
          sx * hw * 1.12 + 0.012,
          sy,
          zc + 0.02,
          rows.saddle,
          PAT.NONE,
          O(0),
        );
        mb.box(
          sx * hw * 1.12 - 0.05,
          sy - bodyH * 0.95,
          zc - 0.05,
          sx * hw * 1.12 + 0.05,
          sy - bodyH * 0.9,
          zc + 0.05,
          rows.hoof,
          PAT.NONE,
          O(0),
        );
      }
      seat = sy + 0.06;
      seatZ = zc;
    }
    // how far the head must bow for the mouth to reach the grass
    const M = [0, y0 - hd * 0.25, zh + hd * 1.5];
    let graze = 1.2,
      best = 1e9;
    for (let a = 0.2; a < 2.6; a += 0.02) {
      const y =
        S[1] + (M[1] - S[1]) * Math.cos(a) - (M[2] - S[2]) * Math.sin(a);
      const z =
        S[2] + (M[1] - S[1]) * Math.sin(a) + (M[2] - S[2]) * Math.cos(a);
      if (z < S[2] + 0.1) break;
      if (Math.abs(y - 0.08) < best) {
        best = Math.abs(y - 0.08);
        graze = a;
      }
      if (y < 0.08) break;
    }
    // where an arrow (or a blade) finds it: the head and neck (which bow to graze, about S), the chest, the belly, the haunch.
    // [x, y, z, radius, how deadly]
    const bodyR = Math.max(hw * 1.15, bodyH * 0.62),
      midY = bodyY + bodyH * 0.5;
    const parts = {
      S,
      head: [0, y0, zh + hd * 0.7, Math.max(hd * 0.62, 0.12), 2.5],
      neck: [
        0,
        (S[1] + top[1]) / 2,
        (S[2] + top[2]) / 2,
        Math.max(hw * 0.7, 0.1),
        1.6,
      ],
      body: [
        [0, midY, z1 - len * 0.2, bodyR, 1.3],
        [0, midY, 0, bodyR, 1],
        [0, midY, z0 + len * 0.2, bodyR, 0.8],
      ],
    };
    return {
      mb,
      H,
      len,
      hw,
      legH,
      bodyH,
      bodyY,
      graze,
      seat,
      seatZ,
      rad: Math.max(hw * 1.4, len * 0.42),
      parts,
    };
  }
