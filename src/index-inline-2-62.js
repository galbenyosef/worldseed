// index-inline-2 62 — math
// Lines 23048-23205 of readable/index-inline-2.pretty.js (statement-aligned).
  function capProto(g, base, rnd) {
    const mb = new MeshBuf();
    const H = g.h;
    const capR = H * (g.shape === "flat" ? 0.55 : 0.42),
      capH = H * (g.shape === "flat" ? 0.14 : g.shape === "cone" ? 0.42 : 0.3);
    const stemR = capR * 0.28;
    mb.prism(
      [0, -0.3, 0],
      [0, H - capH * 0.6, 0],
      stemR * 1.1,
      stemR,
      6,
      base + SLOT.BARK,
      PAT.NONE,
    );
    const y0 = H - capH;
    const rings =
      g.shape === "cone"
        ? [
            [1, 0],
            [0.02, 1],
          ]
        : g.shape === "bell"
          ? [
              [1.05, -0.15],
              [0.95, 0.35],
              [0.7, 0.75],
              [0.02, 1],
            ]
          : [
              [1, 0],
              [0.88, 0.45],
              [0.55, 0.85],
              [0.02, 1],
            ];
    const S = 9;
    for (let j = 0; j < rings.length - 1; j++) {
      const [ra, ha] = rings[j],
        [rb, hb] = rings[j + 1];
      for (let k = 0; k < S; k++) {
        const a0 = (k / S) * 6.283,
          a1 = ((k + 1) / S) * 6.283;
        const A0 = [
            Math.cos(a0) * ra * capR,
            y0 + ha * capH,
            Math.sin(a0) * ra * capR,
          ],
          A1 = [
            Math.cos(a1) * ra * capR,
            y0 + ha * capH,
            Math.sin(a1) * ra * capR,
          ];
        const B0 = [
            Math.cos(a0) * rb * capR,
            y0 + hb * capH,
            Math.sin(a0) * rb * capR,
          ],
          B1 = [
            Math.cos(a1) * rb * capR,
            y0 + hb * capH,
            Math.sin(a1) * rb * capR,
          ];
        mb.quad(
          A1,
          A0,
          B0,
          B1,
          base + SLOT.MAIN,
          g.spots ? PAT.GLOW : PAT.NONE,
          [
            [a1 * capR, ha * capH],
            [a0 * capR, ha * capH],
            [a0 * capR, hb * capH],
            [a1 * capR, hb * capH],
          ],
          { row2: base + SLOT.ACCENT },
        );
      }
    }
    // gills: a dark disc under the cap
    for (let k = 0; k < S; k++) {
      const a0 = (k / S) * 6.283,
        a1 = ((k + 1) / S) * 6.283;
      mb.tri(
        [0, y0 + capH * 0.2, 0],
        [
          Math.cos(a1) * capR * rings[0][0],
          y0 + rings[0][1] * capH,
          Math.sin(a1) * capR * rings[0][0],
        ],
        [
          Math.cos(a0) * capR * rings[0][0],
          y0 + rings[0][1] * capH,
          Math.sin(a0) * capR * rings[0][0],
        ],
        base + SLOT.MAIN,
        PAT.NONE,
        null,
        { lv: -1.6 },
      );
    }
    return {
      mesh: mb,
      cards: [],
      radius: capR,
      kind: "cap",
      top: H,
      trunkR: stemR * 1.2,
      shearH: 0.4,
    };
  }

  function shrubProto(g, base, rnd) {
    const mb = new MeshBuf();
    const H = g.h,
      cards = [];
    const n = (g.clumps || 4) + 1;
    for (let i = 0; i < n; i++) {
      const a = rnd() * Math.PI * 2,
        d = rnd() * H * 0.55;
      const s = H * (0.7 + rnd() * 0.35);
      const y = H * (0.28 + rnd() * 0.35) * (g.flat || 0.8);
      cards.push({
        x: Math.cos(a) * d,
        y: Math.max(y, s * 0.3),
        z: Math.sin(a) * d,
        s,
        nx: Math.cos(a) * 0.5,
        ny: 0.8,
        nz: Math.sin(a) * 0.5,
        v: rnd(),
      });
    }
    if (g.leaf && g.leaf.mat === "SAVANNA")
      for (let k = 0; k < 5; k++) {
        const a = rnd() * 6.28;
        mb.prism(
          [0, 0, 0],
          [Math.cos(a) * H * 0.5, H * 0.7, Math.sin(a) * H * 0.5],
          H * 0.02,
          H * 0.01,
          3,
          base + SLOT.BARK,
          PAT.BARK,
        );
      }
    return {
      mesh: mb,
      cards,
      radius: H * 0.8,
      kind: "shrub",
      top: H,
      shearH: H,
    };
  }

  // ---------- people ----------
  // bones: 0 body, 1 head, 2 left arm, 3 right arm, 4 left leg, 5 right leg
