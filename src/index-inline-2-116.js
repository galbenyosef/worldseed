// index-inline-2 116 — bodyy
// Lines 58662-58994 of readable/index-inline-2.pretty.js (statement-aligned).
  function scorpionProto(plan, rows) {
    const mb = new MeshBuf(true);
    mb.lvBase = 0.35;
    const s = plan.len / 1.7,
      bodyY = 0.2 * s,
      bodyH = 0.15 * s,
      hw = 0.26 * s;
    const z0 = -0.48 * s,
      z1 = 0.3 * s,
      zf = z1 + 0.26 * s;
    const O = (bone, pv) => ({ bone, pivot: pv || [0, 0, 0] });
    mb.quad(
      [-hw * 2.8, 0.03, zf + 0.75 * s],
      [hw * 2.8, 0.03, zf + 0.75 * s],
      [hw * 2.8, 0.03, z0 - 0.3 * s],
      [-hw * 2.8, 0.03, z0 - 0.3 * s],
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
    // the plates of the back, widest in the middle, banded light and dark; the belly under them
    const nSeg = 6;
    for (let k = 0; k < nSeg; k++) {
      const za = z0 + ((z1 - z0) * k) / nSeg,
        zb = z0 + ((z1 - z0) * (k + 1)) / nSeg + 0.015 * s,
        m = Math.sin((Math.PI * (k + 0.5)) / nSeg),
        w = hw * (0.7 + 0.3 * m);
      mb.box(
        -w,
        bodyY,
        za,
        w,
        bodyY + bodyH * (0.8 + 0.2 * m),
        zb,
        rows.main,
        PAT.NONE,
        { ...O(0), lv: k % 2 ? -0.3 : 0.1 },
      );
    }
    mb.box(
      -hw * 0.8,
      bodyY - 0.03 * s,
      z0 + 0.04 * s,
      hw * 0.8,
      bodyY + 0.01,
      zf - 0.04 * s,
      rows.belly,
      PAT.NONE,
      O(0),
    );
    // the head-plate, eyes on top of it (two in the middle, small ones at the front corners)
    mb.box(
      -hw * 0.82,
      bodyY - 0.01 * s,
      z1,
      hw * 0.82,
      bodyY + bodyH * 0.85,
      zf,
      rows.main,
      PAT.NONE,
      { ...O(0), lv: 0.15 },
    );
    for (const sx of [-1, 1]) {
      mb.box(
        sx * 0.045 * s - 0.022 * s,
        bodyY + bodyH * 0.85,
        z1 + 0.1 * s,
        sx * 0.045 * s + 0.022 * s,
        bodyY + bodyH * 0.85 + 0.03 * s,
        z1 + 0.15 * s,
        rows.eye,
        plan.eyePat || PAT.NONE,
        O(0),
      );
      mb.box(
        sx * hw * 0.62 - 0.018 * s,
        bodyY + bodyH * 0.7,
        zf - 0.05 * s,
        sx * hw * 0.62 + 0.018 * s,
        bodyY + bodyH * 0.7 + 0.025 * s,
        zf - 0.01 * s,
        rows.eye,
        plan.eyePat || PAT.NONE,
        O(0),
      );
    }
    // eight legs, fanned out (the front ones reaching forward, the back ones back), each up to a knee
    // above the back and down to the ground; they swing round their hips in fours
    const lr = 0.03 * s;
    for (let j = 0; j < 4; j++)
      for (const sx of [-1, 1]) {
        const lz = z1 - 0.04 * s - j * 0.19 * s,
          hip = [sx * hw * 0.85, bodyY + bodyH * 0.35, lz];
        const th = (1.5 - j) * 0.36,
          dx = sx * Math.cos(th),
          dz = Math.sin(th),
          reach = (0.52 + 0.04 * j) * s;
        const knee = [
            hip[0] + dx * 0.22 * s,
            bodyY + bodyH + 0.1 * s,
            lz + dz * 0.22 * s,
          ],
          foot = [hip[0] + dx * reach, 0.01, lz + dz * reach];
        const lo = O((j % 2 ? 9 : 7) + (sx > 0 ? 1 : 0), hip);
        mb.prism(hip, knee, lr * 1.2, lr, 4, rows.main, PAT.NONE, lo);
        mb.prism(knee, foot, lr, lr * 0.45, 4, rows.main, PAT.NONE, {
          ...lo,
          lv: -0.15,
        });
      }
    // the claws: an arm out from each side of the head, bent forward at the elbow, a great pincer on the end
    const S = [0, bodyY + bodyH * 0.5, zf - 0.02 * s],
      nb = O(1, S);
    for (const sx of [-1, 1]) {
      const a0 = [sx * hw * 0.55, bodyY + bodyH * 0.45, zf - 0.04 * s],
        el = [sx * hw * 1.5, bodyY + bodyH * 0.9, zf + 0.16 * s],
        wr = [sx * hw * 1.15, bodyY + bodyH * 1.1, zf + 0.42 * s];
      mb.prism(a0, el, 0.036 * s, 0.03 * s, 5, rows.main, PAT.NONE, nb);
      mb.prism(el, wr, 0.03 * s, 0.045 * s, 5, rows.main, PAT.NONE, nb);
      const hand = [sx * hw * 1.02, bodyY + bodyH * 1.15, zf + 0.64 * s];
      mb.prism(wr, hand, 0.075 * s, 0.062 * s, 6, rows.main, PAT.NONE, {
        ...nb,
        lv: 0.12,
      });
      mb.prism(
        hand,
        [sx * hw * 0.8, bodyY + bodyH * 1.35, zf + 0.84 * s],
        0.032 * s,
        0.008 * s,
        4,
        rows.horn,
        PAT.NONE,
        nb,
      );
      mb.prism(
        hand,
        [sx * hw * 1.14, bodyY + bodyH * 0.95, zf + 0.82 * s],
        0.028 * s,
        0.008 * s,
        4,
        rows.horn,
        PAT.NONE,
        nb,
      );
    }
    // the tail: back from the body, up, and over, in six joints, then the bulb of the sting with its barb
    // hooked down out of it
    const tb = [0, bodyY + bodyH * 0.7, z0 + 0.02 * s],
      tO = O(6, tb),
      tr = 0.3 * s,
      C = [0, tb[1] + tr, tb[2]];
    const sweep = (230 * Math.PI) / 180,
      nT = 6;
    let prev = tb;
    for (let k = 1; k <= nT; k++) {
      const ph = -Math.PI / 2 - (k / nT) * sweep,
        q = [0, C[1] + tr * Math.sin(ph), C[2] + tr * Math.cos(ph)];
      mb.prism(
        prev,
        q,
        0.068 * s * (1 - 0.07 * k),
        0.06 * s * (1 - 0.07 * k),
        5,
        rows.main,
        PAT.NONE,
        { ...tO, lv: k % 2 ? 0.1 : -0.2 },
      );
      prev = q;
    }
    const phE = -Math.PI / 2 - sweep,
      dv = [0, -Math.cos(phE), Math.sin(phE)];
    const bulb = [0, prev[1] + dv[1] * 0.12 * s, prev[2] + dv[2] * 0.12 * s],
      b2 = [0, bulb[1] - 0.04 * s, bulb[2] + 0.04 * s];
    mb.prism(prev, bulb, 0.05 * s, 0.075 * s, 6, rows.belly, PAT.NONE, tO);
    mb.prism(bulb, b2, 0.075 * s, 0.035 * s, 6, rows.belly, PAT.NONE, tO);
    mb.prism(
      b2,
      [0, b2[1] - 0.12 * s, b2[2] + 0.025 * s],
      0.024 * s,
      0.004 * s,
      4,
      rows.horn,
      PAT.NONE,
      tO,
    );
    // where an arrow (or a blade) finds it: the face, the claws, the back, the tail
    const midY = bodyY + bodyH * 0.5,
      len = zf + 0.84 * s - (C[2] - tr);
    const parts = {
      S,
      head: [0, bodyY + bodyH * 0.6, zf - 0.12 * s, 0.14 * s, 2.5],
      neck: [0, bodyY + bodyH * 1.1, zf + 0.4 * s, 0.17 * s, 0.9],
      body: [
        [0, midY, z1 - 0.12 * s, hw * 1.05, 1.3],
        [0, midY, (z0 + z1) / 2, hw * 1.1, 1],
        [0, C[1], C[2] - tr * 0.6, 0.13 * s, 0.7],
        [0, C[1] + tr, C[2] + tr * 0.2, 0.1 * s, 1.2],
      ],
    };
    return {
      mb,
      H: plan.h * s,
      len,
      hw,
      legH: bodyY,
      bodyH,
      bodyY,
      graze: 0.4,
      seat: bodyY + bodyH,
      seatZ: 0,
      rad: Math.max(hw * 2, len * 0.36),
      parts,
    };
  }
  // what hunts around a place, in words: "grey wolves and brown bears" (for townsfolk to warn you of)
  function huntersHere(biome, T) {
    const land = HUNT_LAND[biome];
    if (!land) return null;
    const kinds = LAND_KINDS.filter((k) => land[k] >= 0.2 && k !== "croc")
      .sort((a, b) => land[b] - land[a])
      .slice(0, 3);
    if (!kinds.length) return null;
    const names = kinds.map((k) => hunterOf(k, biome, T).many);
    return names.length > 1
      ? `${names.slice(0, -1).join(", ")} and ${names[names.length - 1]}`
      : names[0];
  }
  // the looks of a horde's soldiers, by what the tales say of them
  const HORDE_LOOK = [
    {
      re: /Ashen/,
      main: [58, 56, 60],
      trim: [128, 126, 130],
      under: [44, 42, 46],
      hat: "helm",
      item: "blade",
      shield: "round",
      metal: [96, 96, 104],
    },
    {
      re: /Glass/,
      main: [196, 206, 216],
      trim: [232, 238, 244],
      under: [120, 128, 140],
      hat: "helm",
      item: "spear",
      shield: "tall",
      metal: [226, 232, 240],
      crest: true,
    },
    {
      re: /Pale/,
      main: [226, 228, 234],
      trim: [150, 190, 222],
      under: [196, 200, 210],
      hat: "hood",
      item: "spear",
      cloak: true,
      metal: [190, 200, 214],
    },
    {
      re: /Star/,
      main: [176, 184, 198],
      trim: [90, 122, 172],
      under: [130, 138, 150],
      hat: "helm",
      item: "spear",
      metal: [200, 208, 222],
    },
    {
      re: /Hollow|Legion/,
      main: [92, 74, 62],
      trim: [142, 82, 54],
      under: [70, 58, 50],
      hat: "helm",
      item: "spear",
      shield: "tall",
      metal: [122, 84, 62],
    },
  ];
  // where an arrow (or a blow) finds someone standing: the head, the neck, the chest, the belly, the legs
  function manParts(h) {
    const hipY = h * 0.47,
      shY = h * 0.77,
      headY = h * 0.8,
      tw = h * 0.125;
    return {
      S: [0, 0, 0],
      head: [0, headY + h * 0.065, 0, h * 0.085, 2.5],
      neck: [0, shY - 0.02, 0, h * 0.06, 1.5],
      body: [
        [0, shY - h * 0.12, 0, tw * 1.05, 1.2],
        [0, hipY + h * 0.08, 0, tw * 1.05, 1],
        [0, hipY * 0.55, 0, h * 0.09, 0.7],
      ],
    };
  }
  const HAVEN_SITE = 140;
  const NUM_WORD = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven"];
  const hTurn = (a, b, max) => {
    let d = Math.atan2(Math.sin(b - a), Math.cos(b - a));
    d = Math.max(-max, Math.min(max, d));
    return a + d;
  };
  const hEase = (t) => {
    t = Math.max(0, Math.min(1, t));
    return t * t * (3 - 2 * t);
  };

  // their eyes catch the light at night (a dead or a drowned face's eyes burn)
  const EYES_GLSL = `
  if (uEyes > 0.5) {
    int ep = int(vPat + 0.5);
    if (ep == 29) { gl_FragColor = vec4(uEyeCol, 1.0); return; }
    if (ep == 28 && vUv.y > 0.44 && vUv.y < 0.6 && ((vUv.x > 0.17 && vUv.x < 0.4) || (vUv.x > 0.6 && vUv.x < 0.83))) { gl_FragColor = vec4(uEyeCol, 1.0); return; }
    if (ep == 15 && vUv.y > 0.46 && vUv.y < 0.6 && ((vUv.x > 0.2 && vUv.x < 0.38) || (vUv.x > 0.62 && vUv.x < 0.8))) { gl_FragColor = vec4(uEyeCol, 1.0); return; }
  }`;
  const HOSTILE_FS = (() => {
    const at = "if (b >= uFadeIn) discard;";
    if (ANIMAL_FS.split(at).length !== 2)
      throw new Error("hostiles: ANIMAL_FS changed shape");
    return ANIMAL_FS.replace(
      "uniform float uFadeIn;",
      "uniform float uEyes; uniform vec3 uEyeCol; uniform float uFadeIn;",
    ).replace(at, at + EYES_GLSL);
  })();

