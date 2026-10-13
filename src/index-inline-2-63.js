// index-inline-2 63 — pat
// Lines 23206-23896 of readable/index-inline-2.pretty.js (statement-aligned).
  function personProto(look, rows) {
    const mb = new MeshBuf(true);
    mb.lvBase = 0.55; // people stay readable in shade
    const h = look.h,
      bw = look.build === "broad" ? 1.18 : look.build === "slim" ? 0.88 : 1;
    const hipY = h * 0.47,
      shY = h * 0.77,
      headY = h * 0.8;
    const tw = h * 0.125 * bw,
      td = h * 0.07;
    const R = rows;
    const B = (bone, pivot) => ({ bone, pivot });
    // legs + boots
    for (const s of [-1, 1]) {
      const x = s * h * 0.055 * bw,
        bone = s < 0 ? 4 : 5,
        pv = [x, hipY, 0];
      mb.box(
        x - h * 0.04,
        h * 0.05,
        -h * 0.04,
        x + h * 0.04,
        hipY,
        h * 0.04,
        R.under,
        PAT.CLOTH,
        B(bone, pv),
      );
      mb.box(
        x - h * 0.045,
        0,
        -h * 0.05,
        x + h * 0.045,
        h * 0.07,
        h * 0.065,
        R.leather,
        PAT.NONE,
        B(bone, pv),
      );
    }
    // torso and belt
    mb.box(
      -tw,
      hipY - h * 0.02,
      -td,
      tw,
      shY,
      td,
      R.main,
      PAT.CLOTH,
      B(0, [0, 0, 0]),
    );
    mb.box(
      -tw - 0.005,
      hipY + h * 0.02,
      -td - 0.005,
      tw + 0.005,
      hipY + h * 0.055,
      td + 0.005,
      R.leather,
      PAT.NONE,
      B(0, [0, 0, 0]),
    );
    // skirts: robe to the ankles, coat to the shins, tunic to the knees
    const skirt =
      look.top === "robe"
        ? h * 0.05
        : look.top === "coat"
          ? h * 0.18
          : look.top === "cloak" || look.top === "tunic" || look.top === "wrap"
            ? h * 0.3
            : hipY;
    if (skirt < hipY) {
      const flare = look.top === "robe" ? 1.35 : 1.15;
      const y1 = hipY + h * 0.02,
        y0 = skirt,
        n = 8;
      for (let k = 0; k < n; k++) {
        const a0 = (k / n) * 6.283 + 0.39,
          a1 = ((k + 1) / n) * 6.283 + 0.39;
        const rx0 = tw * 1.08,
          rz0 = td * 1.25,
          rx1 = tw * flare * 1.1,
          rz1 = td * flare * 1.5;
        const P = (a, rx, rz, y) => [Math.cos(a) * rx, y, Math.sin(a) * rz];
        mb.quad(
          P(a0, rx1, rz1, y0),
          P(a1, rx1, rz1, y0),
          P(a1, rx0, rz0, y1),
          P(a0, rx0, rz0, y1),
          look.top === "wrap" ? R.trim : R.main,
          PAT.CLOTH,
          [
            [a0, 0],
            [a1, 0],
            [a1, 1],
            [a0, 1],
          ],
          B(0, [0, 0, 0]),
        );
      }
      // a band of trim at the hem
      for (let k = 0; k < n; k++) {
        const a0 = (k / n) * 6.283 + 0.39,
          a1 = ((k + 1) / n) * 6.283 + 0.39,
          rx = tw * flare * 1.12,
          rz = td * flare * 1.52;
        mb.quad(
          [Math.cos(a0) * rx, y0, Math.sin(a0) * rz],
          [Math.cos(a1) * rx, y0, Math.sin(a1) * rz],
          [Math.cos(a1) * rx, y0 + h * 0.035, Math.sin(a1) * rz],
          [Math.cos(a0) * rx, y0 + h * 0.035, Math.sin(a0) * rz],
          R.trim,
          PAT.NONE,
          null,
          B(0, [0, 0, 0]),
        );
      }
    }
    // arms (sleeves or bare) with hands
    for (const s of [-1, 1]) {
      const x = s * (tw + h * 0.035),
        bone = s < 0 ? 2 : 3,
        pv = [x, shY - h * 0.02, 0];
      const bare = look.top === "wrap";
      mb.box(
        x - h * 0.033,
        shY - h * 0.3,
        -h * 0.035,
        x + h * 0.033,
        shY,
        h * 0.035,
        bare ? R.skin : R.main,
        PAT.CLOTH,
        B(bone, pv),
      );
      mb.box(
        x - h * 0.03,
        shY - h * 0.35,
        -h * 0.03,
        x + h * 0.03,
        shY - h * 0.3,
        h * 0.03,
        R.skin,
        PAT.NONE,
        B(bone, pv),
      );
    }
    // head: the face is on +z
    const hs = h * 0.062,
      pvH = [0, headY, 0];
    mb.box(
      -h * 0.025,
      shY,
      -h * 0.025,
      h * 0.025,
      headY + 0.01,
      h * 0.025,
      R.skin,
      PAT.NONE,
      B(1, pvH),
    );
    mb.box(
      -hs,
      headY,
      -hs,
      hs,
      headY + h * 0.13,
      hs,
      R.skin,
      PAT.NONE,
      B(1, pvH),
      ["back", "left", "right", "top", "bottom"],
    );
    mb.quad(
      [-hs, headY, hs],
      [hs, headY, hs],
      [hs, headY + h * 0.13, hs],
      [-hs, headY + h * 0.13, hs],
      R.skin,
      PAT.FACE,
      [
        [0, 0],
        [1, 0],
        [1, 1],
        [0, 1],
      ],
      B(1, pvH),
    );
    const hy1 = headY + h * 0.13;
    // hair
    if (look.hair.style !== "bald" && look.hat !== "hood") {
      mb.box(
        -hs - 0.01,
        hy1 - h * 0.03,
        -hs - 0.01,
        hs + 0.01,
        hy1 + 0.02,
        hs * 0.55,
        R.hair,
        PAT.NONE,
        B(1, pvH),
      );
      if (look.hair.style === "long")
        mb.box(
          -hs - 0.01,
          shY - h * 0.02,
          -hs - 0.02,
          hs + 0.01,
          hy1,
          -hs * 0.35,
          R.hair,
          PAT.NONE,
          B(1, pvH),
        );
      if (look.hair.style === "tied")
        mb.box(
          -0.035,
          hy1 - 0.02,
          -hs - 0.08,
          0.035,
          hy1 + 0.05,
          -hs - 0.005,
          R.hair,
          PAT.NONE,
          B(1, pvH),
        );
      if (look.hair.style === "braid")
        mb.box(
          -0.025,
          shY - h * 0.12,
          -hs - 0.05,
          0.025,
          hy1 - 0.02,
          -hs - 0.005,
          R.hair,
          PAT.NONE,
          B(1, pvH),
        );
    }
    if (look.beard)
      mb.box(
        -hs * 0.8,
        headY - 0.03,
        hs - 0.02,
        hs * 0.8,
        headY + h * 0.035,
        hs + 0.035,
        R.hair,
        PAT.NONE,
        B(1, pvH),
      );
    if (look.mask)
      mb.box(
        -hs * 0.9,
        headY + h * 0.035,
        hs,
        hs * 0.9,
        headY + h * 0.1,
        hs + 0.02,
        R.trim,
        PAT.NONE,
        B(1, pvH),
      );
    // hats and hoods
    if (look.hat === "hood") {
      mb.box(
        -hs - 0.03,
        headY - 0.02,
        -hs - 0.04,
        hs + 0.03,
        hy1 + 0.04,
        hs - 0.03,
        R.main,
        PAT.CLOTH,
        B(1, pvH),
        ["back", "left", "right", "top"],
      );
      mb.box(
        -hs - 0.03,
        hy1 - 0.02,
        hs - 0.04,
        hs + 0.03,
        hy1 + 0.04,
        hs + 0.02,
        R.main,
        PAT.CLOTH,
        B(1, pvH),
        ["front", "top", "bottom"],
      );
    } else if (look.hat === "wide") {
      const r = h * 0.17,
        y = hy1 + 0.005,
        n = 10;
      for (let k = 0; k < n; k++) {
        const a0 = (k / n) * 6.283,
          a1 = ((k + 1) / n) * 6.283;
        mb.tri(
          [0, y, 0],
          [Math.cos(a1) * r, y - 0.02, Math.sin(a1) * r],
          [Math.cos(a0) * r, y - 0.02, Math.sin(a0) * r],
          R.trim,
          PAT.THATCH,
          null,
          B(1, pvH),
        );
        mb.tri(
          [0, y - 0.01, 0],
          [Math.cos(a0) * r, y - 0.03, Math.sin(a0) * r],
          [Math.cos(a1) * r, y - 0.03, Math.sin(a1) * r],
          R.trim,
          PAT.NONE,
          null,
          { ...B(1, pvH), lv: -1 },
        );
      }
      mb.cone(
        [0, y, 0],
        y + h * 0.08,
        hs * 1.05,
        8,
        R.trim,
        PAT.THATCH,
        B(1, pvH),
      );
    } else if (look.hat === "cap")
      mb.box(
        -hs - 0.01,
        hy1 - 0.01,
        -hs - 0.01,
        hs + 0.01,
        hy1 + h * 0.035,
        hs + 0.01,
        R.trim,
        PAT.CLOTH,
        B(1, pvH),
      );
    else if (look.hat === "helm") {
      // a metal cap down over the brow and the back of the neck, a bar down over the nose
      mb.box(
        -hs - 0.02,
        hy1 - h * 0.05,
        -hs - 0.025,
        hs + 0.02,
        hy1 + h * 0.04,
        hs + 0.02,
        R.metal,
        PAT.NONE,
        B(1, pvH),
      );
      mb.box(
        -hs - 0.022,
        headY + h * 0.01,
        -hs - 0.026,
        hs + 0.022,
        hy1 - h * 0.045,
        -hs * 0.2,
        R.metal,
        PAT.NONE,
        B(1, pvH),
      );
      mb.box(
        -0.012,
        headY + h * 0.05,
        hs + 0.012,
        0.012,
        hy1 - h * 0.045,
        hs + 0.03,
        R.metal,
        PAT.NONE,
        B(1, pvH),
      );
      if (look.crest)
        mb.box(
          -0.015,
          hy1 + h * 0.035,
          -hs,
          0.015,
          hy1 + h * 0.08,
          hs * 0.9,
          R.trim,
          PAT.NONE,
          B(1, pvH),
        );
    } else if (look.hat === "fur")
      mb.box(
        -hs - 0.03,
        hy1 - h * 0.035,
        -hs - 0.03,
        hs + 0.03,
        hy1 + h * 0.05,
        hs + 0.03,
        R.trim,
        PAT.HIDE,
        B(1, pvH),
      );
    else if (look.hat === "peak") {
      // a hermit's hat: a floppy brim and a tall point, leaning back a little
      const r = h * 0.12,
        y = hy1 - 0.01,
        n = 10;
      for (let k = 0; k < n; k++) {
        const a0 = (k / n) * 6.283,
          a1 = ((k + 1) / n) * 6.283;
        mb.tri(
          [0, y, 0],
          [Math.cos(a1) * r, y - 0.03, Math.sin(a1) * r],
          [Math.cos(a0) * r, y - 0.03, Math.sin(a0) * r],
          R.main,
          PAT.CLOTH,
          null,
          B(1, pvH),
        );
        mb.tri(
          [0, y - 0.01, 0],
          [Math.cos(a0) * r, y - 0.04, Math.sin(a0) * r],
          [Math.cos(a1) * r, y - 0.04, Math.sin(a1) * r],
          R.main,
          PAT.NONE,
          null,
          { ...B(1, pvH), lv: -1 },
        );
      }
      mb.prism(
        [0, y, 0],
        [0, y + h * 0.13, -h * 0.02],
        hs * 1.08,
        hs * 0.55,
        8,
        R.main,
        PAT.CLOTH,
        B(1, pvH),
      );
      mb.prism(
        [0, y + h * 0.13, -h * 0.02],
        [0, y + h * 0.24, -h * 0.07],
        hs * 0.55,
        0.004,
        6,
        R.main,
        PAT.CLOTH,
        B(1, pvH),
      );
    } else if (look.hat === "band")
      mb.box(
        -hs - 0.008,
        hy1 - h * 0.04,
        -hs - 0.008,
        hs + 0.008,
        hy1 - h * 0.015,
        hs + 0.008,
        R.trim,
        PAT.NONE,
        B(1, pvH),
      );
    // cloak: a panel down the back
    if (look.top === "cloak" || look.cloak) {
      const y0 = h * 0.12,
        y1 = shY + 0.02;
      mb.quad(
        [tw * 1.5, y0, -td - 0.06],
        [-tw * 1.5, y0, -td - 0.06],
        [-tw * 1.15, y1, -td - 0.02],
        [tw * 1.15, y1, -td - 0.02],
        R.main,
        PAT.CLOTH,
        [
          [0, 0],
          [1, 0],
          [1, 1],
          [0, 1],
        ],
        B(0, [0, 0, 0]),
      );
      mb.quad(
        [tw * 1.15, y1, -td - 0.02],
        [-tw * 1.15, y1, -td - 0.02],
        [-tw * 1.1, y1, td * 0.4],
        [tw * 1.1, y1, td * 0.4],
        R.trim,
        PAT.NONE,
        null,
        B(0, [0, 0, 0]),
      );
    }
    // things they carry
    if (look.pack)
      mb.box(
        -tw * 0.8,
        hipY + h * 0.05,
        -td - h * 0.09,
        tw * 0.8,
        shY - h * 0.02,
        -td,
        R.leather,
        PAT.HIDE,
        B(0, [0, 0, 0]),
      );
    const handR = [tw + h * 0.035, shY - h * 0.33, 0],
      pvR = [tw + h * 0.035, shY - h * 0.02, 0];
    if (look.item === "staff" || look.item === "spear") {
      mb.box(
        handR[0] - 0.018,
        0.02,
        handR[2] + 0.03,
        handR[0] + 0.018,
        h * 1.05,
        handR[2] + 0.066,
        R.wood,
        PAT.BARK,
        B(3, pvR),
      );
      if (look.item === "spear")
        mb.box(
          handR[0] - 0.025,
          h * 1.05,
          handR[2] + 0.025,
          handR[0] + 0.025,
          h * 1.15,
          handR[2] + 0.07,
          R.metal,
          PAT.NONE,
          B(3, pvR),
        );
      else
        mb.box(
          handR[0] - 0.035,
          h * 1.02,
          handR[2] + 0.015,
          handR[0] + 0.035,
          h * 1.07,
          handR[2] + 0.085,
          R.trim,
          PAT.NONE,
          B(3, pvR),
        );
    } else if (look.item === "lantern") {
      mb.box(
        handR[0] - 0.05,
        handR[1] - 0.16,
        0.0,
        handR[0] + 0.05,
        handR[1] - 0.04,
        0.1,
        R.metal,
        PAT.LAMP,
        { ...B(3, pvR), row2: R.glow },
      );
      mb.box(
        handR[0] - 0.06,
        handR[1] - 0.04,
        -0.01,
        handR[0] + 0.06,
        handR[1] - 0.01,
        0.11,
        R.metal,
        PAT.NONE,
        B(3, pvR),
      );
    } else if (look.item === "blade") {
      // a short blade, held point forward and down
      mb.box(
        handR[0] - 0.02,
        handR[1] - 0.03,
        -0.02,
        handR[0] + 0.02,
        handR[1] + 0.05,
        0.03,
        R.leather,
        PAT.NONE,
        B(3, pvR),
      );
      mb.box(
        handR[0] - 0.05,
        handR[1] - 0.04,
        0.02,
        handR[0] + 0.05,
        handR[1] - 0.01,
        0.05,
        R.metal,
        PAT.NONE,
        B(3, pvR),
      );
      mb.prism(
        [handR[0], handR[1] - 0.03, 0.04],
        [handR[0], handR[1] - 0.3, 0.52],
        0.024,
        0.006,
        4,
        R.metal,
        PAT.NONE,
        B(3, pvR),
      );
    } else if (look.item === "axe" || look.item === "club") {
      // a haft in the fist, its head out in front
      const top = [handR[0], handR[1] - 0.12, 0.5];
      mb.prism(
        [handR[0], handR[1] + 0.06, -0.06],
        top,
        0.022,
        look.item === "club" ? 0.05 : 0.02,
        5,
        R.wood,
        PAT.BARK,
        B(3, pvR),
      );
      if (look.item === "axe")
        mb.box(
          handR[0] - 0.012,
          top[1] - 0.12,
          top[2] - 0.12,
          handR[0] + 0.012,
          top[1] + 0.03,
          top[2] - 0.01,
          R.metal,
          PAT.NONE,
          B(3, pvR),
        );
    } else if (look.item === "bow") {
      for (let k = 0; k < 4; k++) {
        const a0 = -0.9 + k * 0.45,
          a1 = a0 + 0.45;
        mb.prism(
          [
            Math.sin(a0) * 0.1 - 0.05,
            hipY + Math.cos(a0) * 0.0 + (a0 + 0.9) * 0.45,
            -td - 0.05,
          ],
          [Math.sin(a1) * 0.1 - 0.05, hipY + (a1 + 0.9) * 0.45, -td - 0.05],
          0.015,
          0.015,
          3,
          R.wood,
          PAT.NONE,
          B(0, [0, 0, 0]),
        );
      }
    }
    // a shield on the left forearm, held out in front, its face forward
    if (look.shield) {
      const x = -(tw + h * 0.03),
        y = shY - h * 0.26,
        z = h * 0.075,
        pvL = [-(tw + h * 0.035), shY - h * 0.02, 0];
      if (look.shield === "round") {
        const n = 10,
          r = h * 0.16;
        for (let k = 0; k < n; k++) {
          const a0 = (k / n) * 6.283,
            a1 = ((k + 1) / n) * 6.283;
          mb.tri(
            [x, y, z],
            [x + Math.sin(a0) * r, y + Math.cos(a0) * r, z],
            [x + Math.sin(a1) * r, y + Math.cos(a1) * r, z],
            k % 2 ? R.trim : R.wood,
            PAT.NONE,
            null,
            B(2, pvL),
          );
        }
        mb.box(
          x - 0.03,
          y - 0.03,
          z,
          x + 0.03,
          y + 0.03,
          z + 0.025,
          R.metal,
          PAT.NONE,
          B(2, pvL),
        );
      } else
        mb.box(
          x - h * 0.1,
          y - h * 0.17,
          z,
          x + h * 0.1,
          y + h * 0.15,
          z + 0.03,
          R.trim,
          PAT.PLANK,
          B(2, pvL),
        );
    }
    return { mesh: mb, h };
  }

  // ---------- the dead ----------
  // Someone wrapped for burial long ago: strips of cloth wound round and round, the dried face
  // showing dark between them, the arms bound to the sides. Built like a person, on the same
  // bones, so that one day it could move like one. rows: wrap, wrapDark, dry.
