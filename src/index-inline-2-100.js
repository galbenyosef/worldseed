// index-inline-2 100 — tri
// Lines 51133-51476 of readable/index-inline-2.pretty.js (statement-aligned).
  const BIRD_VS = `
#include <common>
#include <logdepthbuf_pars_vertex>
attribute float aWing; attribute float aFar; attribute vec3 iPos; attribute vec4 iInfo; attribute vec4 iYaw;
uniform float uTanHalf; uniform float uViewH;
varying float vRow; varying float vDist; varying float vWing; varying float vLit; varying float vFade;
void main() {
  vec3 p = position;
  vLit = iYaw.z; vFade = iYaw.w;
  float mode = iInfo.z, ph = iInfo.y;
  vec4 vb = viewMatrix * vec4(iPos, 1.0);
  float mpp = 2.0 * uTanHalf * max(1.0, -vb.z) / uViewH;
  float px = iInfo.x * 0.48 / mpp;
  // far off and flying, a bird is a little pixel V that flaps (a few pixels across, never less);
  // near, or on the ground, it is a bird
  bool far = px < 7.0 && mode < 1.5;
  vRow = iInfo.w; vWing = aWing;
  if ((aFar > 0.5) != far) { gl_Position = vec4(0.0, 0.0, 2.0, 1.0); vDist = 0.0; return; }
  vec4 mv;
  if (far) {
    float hs = max(px, iYaw.y) * 0.5, lift = mode < 0.5 ? sin(ph) * 0.85 : 0.3;
    float x = p.x * p.y * hs, y = p.y * lift * hs + p.z * 0.62;
    mv = vb + vec4(x * mpp, y * mpp, 0.0, 0.0);
  } else {
    // flapping, gliding with the wings held a little up, or folded on the ground
    float th = mode < 0.5 ? sin(ph) * 0.9 : mode < 1.5 ? 0.14 + 0.05 * sin(ph * 0.3) : 0.0;
    if (aWing > 0.5) {
      if (mode > 1.5) p.x *= 0.3;
      float a = p.x < 0.0 ? -th : th;
      p = vec3(p.x * cos(a) - p.y * sin(a), p.x * sin(a) + p.y * cos(a), p.z);
    }
    p *= iInfo.x;
    float sh = sin(iYaw.x), ch = cos(iYaw.x);
    vec3 f = vec3(sh, 0.0, -ch), r = vec3(ch, 0.0, sh);
    mv = viewMatrix * vec4(iPos + r * p.x + vec3(0.0, p.y, 0.0) + f * p.z, 1.0);
  }
  vDist = length(mv.xyz);
  gl_Position = projectionMatrix * mv;
  #include <logdepthbuf_vertex>
}`;
  const BIRD_FS = `
#include <logdepthbuf_pars_fragment>
${COMMON_FS}
varying float vRow; varying float vDist; varying float vWing; varying float vLit; varying float vFade;
void main() {
  #include <logdepthbuf_fragment>
  float b = bayer4(gl_FragCoord.xy);
  if (b >= vFade) discard;
  float lv = mix(0.55, 1.85, uDay) + vLit * uDay - vWing * 0.35 + (b - 0.5) * 0.5 * uDither;
  gl_FragColor = vec4(applyFog(rampAt(vRow, lv), vDist, b), 1.0);
}`;
  // a bird about half a metre across: diamond body, two wings, a fan of tail; +z is forward
  function birdGeometry(T) {
    const P = [],
      W = [];
    const tri = (a, b, c, w) => {
      P.push(...a, ...b, ...c);
      W.push(w, w, w);
    };
    const nose = [0, 0.012, 0.13],
      tail = [0, 0.012, -0.11],
      L = [-0.04, 0, 0],
      Rr = [0.04, 0, 0],
      top = [0, 0.04, 0.01],
      bot = [0, -0.03, 0];
    tri(nose, L, top, 0);
    tri(nose, top, Rr, 0);
    tri(nose, bot, L, 0);
    tri(nose, Rr, bot, 0);
    tri(tail, top, L, 0);
    tri(tail, Rr, top, 0);
    tri(tail, L, bot, 0);
    tri(tail, bot, Rr, 0);
    for (const s of [-1, 1]) {
      const a = [s * 0.03, 0.012, 0.05],
        b = [s * 0.03, 0.012, -0.04],
        c = [s * 0.24, 0.0, -0.06],
        d = [s * 0.2, 0.0, 0.012];
      tri(a, b, c, 1);
      tri(a, c, d, 1);
    }
    tri([0, 0.012, -0.09], [-0.05, 0.006, -0.2], [0.05, 0.006, -0.2], 0);
    // the far V: per wing (side, along 0..1, edge -1..1), laid out in pixels by the shader
    const n3 = W.length;
    for (const s of [-1, 1]) {
      tri([s, 0, -1], [s, 1, -1], [s, 1, 1], 1);
      tri([s, 0, -1], [s, 1, 1], [s, 0, 1], 1);
    }
    const F = W.map((w, i) => (i < n3 ? 0 : 1));
    const geo = new T.InstancedBufferGeometry();
    geo.setAttribute("position", new T.Float32BufferAttribute(P, 3));
    geo.setAttribute("aWing", new T.Float32BufferAttribute(W, 1));
    geo.setAttribute("aFar", new T.Float32BufferAttribute(F, 1));
    return geo;
  }

  // ---------- the beasts of the land ----------
  // A grazer's body from what the people call their beast. Beasts that do not
  // graze (frogs, eels, moths, lions) give way to the land's own deer or goats.
  // h: height, about to the top of the back; leg, neck, head: parts of h
  const GRAZERS = [
    {
      re: /white elk/,
      plan: {
        h: 1.6,
        len: 1.6,
        leg: 0.58,
        neck: 0.42,
        head: 0.4,
        horns: "antlers",
        antler: 1.7,
        col: [222, 220, 210],
        belly: [240, 238, 230],
        horn: [196, 186, 160],
        run: 12,
        herd: [4, 8],
      },
    },
    {
      re: /shell/,
      plan: {
        h: 1.35,
        len: 1.95,
        leg: 0.4,
        neck: 0.22,
        head: 0.46,
        horns: "curved",
        col: [150, 116, 82],
        belly: [186, 156, 120],
        horn: [220, 210, 186],
        shell: [110, 100, 92],
        run: 7,
        herd: [3, 6],
      },
    },
    {
      re: /goat|ibex/,
      plan: {
        h: 1.0,
        len: 1.1,
        leg: 0.5,
        neck: 0.36,
        head: 0.36,
        horns: "swept",
        col: [190, 180, 164],
        belly: [222, 216, 204],
        horn: [96, 84, 70],
        beard: true,
        run: 9,
        herd: [4, 9],
      },
    },
    {
      re: /tallback/,
      plan: {
        h: 2.3,
        len: 1.7,
        leg: 0.6,
        neck: 0.42,
        head: 0.36,
        horns: "stubs",
        col: [200, 156, 96],
        belly: [234, 212, 168],
        horn: [120, 92, 64],
        spots: [140, 92, 50],
        hump: true,
        run: 10,
        herd: [3, 6],
      },
    },
    {
      re: /strider/,
      plan: {
        h: 1.9,
        len: 1.6,
        leg: 0.62,
        neck: 0.4,
        head: 0.36,
        horns: "none",
        col: [146, 122, 98],
        belly: [186, 164, 136],
        horn: [90, 80, 70],
        wool: true,
        run: 9,
        herd: [3, 7],
      },
    },
    {
      re: /boar|hog/,
      plan: {
        h: 0.95,
        len: 1.35,
        leg: 0.38,
        neck: 0.12,
        head: 0.44,
        horns: "none",
        tusks: true,
        col: [84, 66, 54],
        belly: [112, 92, 76],
        horn: [226, 216, 190],
        wool: true,
        run: 8,
        herd: [4, 8],
      },
    },
    {
      re: /elk|deer|stag/,
      plan: {
        h: 1.45,
        len: 1.5,
        leg: 0.58,
        neck: 0.42,
        head: 0.4,
        horns: "antlers",
        antler: 1.4,
        col: [150, 112, 74],
        belly: [208, 188, 158],
        horn: [200, 186, 156],
        run: 12,
        herd: [4, 9],
      },
    },
    {
      re: /\box|oxen|bison|buffalo/,
      plan: {
        h: 1.45,
        len: 2.0,
        leg: 0.42,
        neck: 0.22,
        head: 0.48,
        horns: "curved",
        col: [92, 66, 46],
        belly: [128, 98, 72],
        horn: [220, 210, 186],
        wool: true,
        run: 8,
        herd: [4, 9],
      },
    },
  ];
  const LAND_GRAZER = {
    [B.STEPPE]: "antelope",
    [B.SAVANNA]: "antelope",
    [B.DESERT]: "antelope",
    [B.DRYFOREST]: "antelope",
    [B.TUNDRA]: "reindeer",
    [B.TAIGA]: "reindeer",
    [B.COLDDESERT]: "goat",
    [B.ROCK]: "goat",
    [B.FOREST]: "deer",
    [B.WETFOREST]: "deer",
    [B.JUNGLE]: "deer",
  };
  const LAND_PLAN = {
    antelope: {
      name: "antelope",
      plan: {
        h: 1.05,
        len: 1.25,
        leg: 0.62,
        neck: 0.42,
        head: 0.36,
        horns: "straight",
        col: [194, 148, 94],
        belly: [238, 226, 200],
        horn: [60, 50, 44],
        run: 13,
        herd: [5, 10],
      },
    },
    reindeer: {
      name: "reindeer",
      plan: {
        h: 1.2,
        len: 1.4,
        leg: 0.55,
        neck: 0.4,
        head: 0.4,
        horns: "antlers",
        antler: 1.4,
        col: [138, 124, 108],
        belly: [214, 206, 192],
        horn: [190, 176, 150],
        run: 11,
        herd: [5, 10],
      },
    },
    goat: {
      name: "wild goats",
      plan: {
        h: 0.95,
        len: 1.05,
        leg: 0.5,
        neck: 0.36,
        head: 0.36,
        horns: "swept",
        col: [170, 160, 146],
        belly: [212, 206, 194],
        horn: [96, 84, 70],
        beard: true,
        run: 9,
        herd: [4, 8],
      },
    },
    deer: {
      name: "deer",
      plan: {
        h: 1.15,
        len: 1.3,
        leg: 0.6,
        neck: 0.44,
        head: 0.38,
        horns: "antlers",
        col: [156, 106, 66],
        belly: [220, 200, 170],
        horn: [190, 172, 140],
        run: 12,
        herd: [3, 7],
      },
    },
  };
  // where herds graze, and how likely
  const HERD_LAND = {
    [B.STEPPE]: 1,
    [B.SAVANNA]: 1,
    [B.TUNDRA]: 0.9,
    [B.COLDDESERT]: 0.5,
    [B.DESERT]: 0.25,
    [B.DRYFOREST]: 0.6,
    [B.ROCK]: 0.5,
    [B.FOREST]: 0.25,
    [B.WETFOREST]: 0.15,
    [B.TAIGA]: 0.25,
    [B.JUNGLE]: 0.1,
  };
  const OPEN_LAND = new Set([
    B.STEPPE,
    B.SAVANNA,
    B.TUNDRA,
    B.COLDDESERT,
    B.DESERT,
    B.DRYFOREST,
  ]);
  // small things about: hares in the grass, foxes at the edge of the woods (white where it snows)
