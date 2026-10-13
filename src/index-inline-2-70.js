// index-inline-2 70 — gbiome
// Lines 26965-27299 of readable/index-inline-2.pretty.js (statement-aligned).
  function iconSolidInto(mb, px, size, T, rowOf, o = null) {
    const N = 16,
      s = size / N,
      h = s / 2;
    const on = (i, j) =>
      i >= 0 && j >= 0 && i < N && j < N && px[(j * N + i) * 4 + 3] > 0;
    const key = (i, j) => {
      const k = (j * N + i) * 4;
      return (px[k] << 16) | (px[k + 1] << 8) | px[k + 2];
    };
    const rows = new Map();
    const row = (i, j) => {
      const c = key(i, j);
      if (!rows.has(c))
        rows.set(c, rowOf([(c >> 16) & 255, (c >> 8) & 255, c & 255]));
      return rows.get(c);
    };
    const X = (i) => (i - N / 2) * s,
      Y = (j) => (N / 2 - j) * s;
    const edge = o ? { ...o, lv: (o.lv || 0) - 0.25 } : { lv: -0.25 };
    for (let j = 0; j < N; j++) {
      const yb = Y(j + 1),
        yt = Y(j);
      // the faces, front and back, in runs of one colour
      for (let i = 0; i < N;) {
        if (!on(i, j)) {
          i++;
          continue;
        }
        const c = key(i, j);
        let e = i + 1;
        while (e < N && on(e, j) && key(e, j) === c) e++;
        const r = row(i, j),
          x0 = X(i),
          x1 = X(e);
        mb.quad(
          T([x0, yb, h]),
          T([x1, yb, h]),
          T([x1, yt, h]),
          T([x0, yt, h]),
          r,
          PAT.NONE,
          null,
          o,
        );
        mb.quad(
          T([x1, yb, -h]),
          T([x0, yb, -h]),
          T([x0, yt, -h]),
          T([x1, yt, -h]),
          r,
          PAT.NONE,
          null,
          o,
        );
        i = e;
      }
      // the edges, wherever a pixel has no neighbour
      for (let i = 0; i < N; i++) {
        if (!on(i, j)) continue;
        const r = row(i, j),
          x0 = X(i),
          x1 = X(i + 1);
        if (!on(i - 1, j))
          mb.quad(
            T([x0, yb, -h]),
            T([x0, yb, h]),
            T([x0, yt, h]),
            T([x0, yt, -h]),
            r,
            PAT.NONE,
            null,
            edge,
          );
        if (!on(i + 1, j))
          mb.quad(
            T([x1, yb, h]),
            T([x1, yb, -h]),
            T([x1, yt, -h]),
            T([x1, yt, h]),
            r,
            PAT.NONE,
            null,
            edge,
          );
        if (!on(i, j - 1))
          mb.quad(
            T([x0, yt, h]),
            T([x1, yt, h]),
            T([x1, yt, -h]),
            T([x0, yt, -h]),
            r,
            PAT.NONE,
            null,
            edge,
          );
        if (!on(i, j + 1))
          mb.quad(
            T([x0, yb, -h]),
            T([x1, yb, -h]),
            T([x1, yb, h]),
            T([x0, yb, h]),
            r,
            PAT.NONE,
            null,
            edge,
          );
      }
    }
  }
  // Where a thing set down sits, as a map from its picture's metres to the caller's (x east, y up,
  // z south). Lying flat (on a floor, a table, a shelf): its picture's top points along bearing b.
  // Hung on a wall: its face looks along bearing b (into the room), turned in the wall by spin.
  function decorFrame(P0, b, flat, size, spin = 0) {
    const t = size / 16,
      off = t / 2 + 0.012;
    const sb = Math.sin(b),
      cb = Math.cos(b),
      cs = Math.cos(spin),
      sn = Math.sin(spin);
    if (flat) {
      // forward (the picture's top) along b, right of that, up out of the surface
      const F = [sb, 0, -cb],
        Rt = [cb, 0, sb];
      return (p) => {
        const x = p[0] * cs - p[1] * sn,
          y = p[0] * sn + p[1] * cs,
          z = p[2] + off;
        return [
          P0[0] + Rt[0] * x + F[0] * y,
          P0[1] + z,
          P0[2] + Rt[2] * x + F[2] * y,
        ];
      };
    }
    // n: out of the wall into the room; right: as you face the wall
    const n = [sb, 0, -cb],
      Rt = [-cb, 0, -sb];
    return (p) => {
      const x = p[0] * cs - p[1] * sn,
        y = p[0] * sn + p[1] * cs,
        z = p[2] + off;
      return [
        P0[0] + Rt[0] * x + n[0] * z,
        P0[1] + y,
        P0[2] + Rt[2] * x + n[2] * z,
      ];
    };
  }

  // ---- view/groundview.js ----
  // ============================================================
  // GROUND VIEW — first person on the planet.
  // Terrain is a cube-sphere quadtree of chunks: the same six faces as the
  // globe's grid, subdivided around you down to about a metre. Each chunk
  // keeps its own frame and is placed relative to you in double precision,
  // so you can walk (or travel) anywhere without jitter.
  // Near you the planet's own species stand as 3D models built from kits;
  // further out they become painted stand-ins, then just the colour of the
  // land. Towns are built from their people's traditions, folk from parts.
  // Drawn at low resolution: one palette, dithered light and fog, under the
  // planet's real sun, stars and clouds.
  // ============================================================

  const CN = 32; // quads per chunk side
  // detail: phones and small screens draw less
  const LOW =
    typeof matchMedia !== "undefined" &&
    (matchMedia("(pointer: coarse)").matches ||
      Math.min(screen.width, screen.height) < 700);
  const SPLIT = LOW ? 0.95 : 1.15; // split when closer than this many chunk widths
  const VIEW_M = LOW ? 32000 : 50000; // how far the air lets you see
  const DENSITY = LOW ? 0.6 : 1;
  const EYE = 1.7;
  const SHIP_DECK = 1.5; // how high a ship's deck stands above the sea
  // On the ground a local hour of daylight passes in three real minutes (a 24-hour day takes
  // about an hour), held between 45 and 110 minutes so short-day worlds still have evenings and
  // long-day worlds do not keep you in the dark for hours.
  const groundSecondsPerDay = (dayHours) =>
    Math.max(2700, Math.min(6600, dayHours * 180));
  const WALK = 4.2,
    RUN = 10;
  const RAMP_ROWS = 2048;

  // render materials for ground cells (rows 0..M.COUNT-1 of the ramp table)
  const GBIOME = [];
  GBIOME[B.OCEAN] = M.SAND;
  GBIOME[B.SHELF] = M.SAND;
  GBIOME[B.REEF] = M.SAND;
  GBIOME[B.SEAICE] = M.SEAICE;
  GBIOME[B.ICE] = M.ICE;
  GBIOME[B.TUNDRA] = M.TUNDRA;
  GBIOME[B.TAIGA] = M.TAIGA;
  GBIOME[B.STEPPE] = M.STEPPE;
  GBIOME[B.FOREST] = M.FOREST;
  GBIOME[B.WETFOREST] = M.WETFOREST;
  GBIOME[B.COLDDESERT] = M.COLDDESERT;
  GBIOME[B.DESERT] = M.DESERT;
  GBIOME[B.SAVANNA] = M.SAVANNA;
  GBIOME[B.DRYFOREST] = M.DRYFOREST;
  GBIOME[B.JUNGLE] = M.JUNGLE;
  GBIOME[B.ROCK] = M.ROCK;
  const WARM_WET = new Set([
    B.JUNGLE,
    B.DRYFOREST,
    B.SAVANNA,
    B.WETFOREST,
    B.FOREST,
  ]);
  const MAXD = { tree: 3.2, shrub: 2.0, cover: 14, rare: 0.7 };

  const v3 = (hex) => {
    const c = hexToRgb(hex);
    return [c[0] / 255, c[1] / 255, c[2] / 255];
  };
  const mix3 = (a, b, t) => [
    a[0] + (b[0] - a[0]) * t,
    a[1] + (b[1] - a[1]) * t,
    a[2] + (b[2] - a[2]) * t,
  ];
  const smooth = (a, b, x) => {
    const t = Math.max(0, Math.min(1, (x - a) / (b - a)));
    return t * t * (3 - 2 * t);
  };

  // ---------- shader pieces ----------
  // how many lamps near you light the world at once (the rest only glow)
  const LAMP_N = 12;
  const COMMON_FS = `
uniform sampler2D uRamp; uniform float uRows; uniform vec3 uSun; uniform float uDay; uniform float uTime;
uniform vec3 uFog; uniform vec2 uFogRange; uniform vec4 uFire;
uniform vec4 uLamps[${LAMP_N}]; uniform float uLampK[${LAMP_N}]; uniform float uLate; uniform float uSee;
// how much light and fog are dithered between their steps (1 the full pattern, 0 none: clean bands)
uniform float uDither;
// the weather: how overcast, a lightning flash, moonlight, snow lying, the ground wet
uniform float uOvercast; uniform float uFlash; uniform float uMoon; uniform float uSnowCover; uniform float uWetGround; uniform float uSnowRow;
float m2(vec2 v) { return 2.0 * abs(v.x - v.y) + v.y; }
// firelight at a point: your fire or torch or the hearth, and the lamps near you (one warm colour)
float fireAt(vec3 w) {
  float f = uFire.w * max(0.0, 1.0 - length(w - uFire.xyz) / 7.5), k = 0.0;
  for (int i = 0; i < ${LAMP_N}; i++) { float q = max(0.0, 1.0 - length(w - uLamps[i].xyz) / uLamps[i].w); k += uLampK[i] * q * q; }
  // lamps warm a place, and many together still do not burn it white
  return min(1.0, f + 0.72 * (1.0 - exp(-1.4 * k)));
}
vec3 fireTint(vec3 col, float k) { return mix(col, col * vec3(1.35, 1.0, 0.62) + vec3(0.08, 0.03, 0.0), clamp(k * 1.4, 0.0, 0.85)); }
float bayer4(vec2 p) { vec2 a = mod(floor(p), 4.0); return (4.0 * m2(mod(a, 2.0)) + m2(floor(a * 0.5)) + 0.5) / 16.0; }
float hsh(vec2 p) { return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }
vec3 rampAt(float row, float lv) { return texture2D(uRamp, vec2((clamp(floor(lv), 0.0, 4.0) + 0.5) / 5.0, (row + 0.5) / uRows)).rgb; }
float lightLv(vec3 N, float bias, float b) {
  // (under cloud the light comes from all over the sky: flatter, and dimmer)
  float Ld = dot(N, uSun) * (1.0 - 0.75 * uOvercast);
  float dayLv = max(1.5 + Ld * 1.8 + bias - 0.55 * uOvercast, 1.1 + bias * 0.5 + 0.25 * N.y - 0.4 * uOvercast);
  // (an owl's draught: the night is only grey; a full moon lights the way)
  float nightLv = 0.62 + uSee * 0.85 + uMoon * 0.42 + bias * 0.6 + max(N.y, 0.0) * 0.3;
  return mix(nightLv, dayLv, uDay) + (b - 0.5) * 0.7 * uDither + uFlash * 2.6;
}
vec3 applyFog(vec3 col, float dist, float b) {
  float f = clamp((dist - uFogRange.x) / (uFogRange.y - uFogRange.x), 0.0, 1.0);
  f = f * f * (3.0 - 2.0 * f);
  return mix(col, uFog, floor(f * 6.0 + 0.5 + (b - 0.5) * uDither) / 6.0);
}
`;

  const TERRAIN_VS = `
#include <common>
#include <logdepthbuf_pars_vertex>
attribute float aMat; attribute float aShade;
varying vec3 vN; flat varying float vMat; varying float vShade; varying float vDist; varying vec3 vLocal; varying vec3 vW;
void main() {
  vec4 wp = modelMatrix * vec4(position, 1.0);
  vN = normalize(mat3(modelMatrix) * normal);
  vMat = aMat; vShade = aShade; vLocal = position; vW = wp.xyz;
  vec4 mv = viewMatrix * wp;
  vDist = length(mv.xyz);
  gl_Position = projectionMatrix * mv;
  #include <logdepthbuf_vertex>
}`;
  // Fields are painted on the ground, not built (see farmview's stepFields): furrowed earth, a ridge every 0.9 m
  // along the field (its sides lit as the sun falls on them), and what grows along the ridges. Close to, each plant
  // with its little shadow; further off, as much of the earth as they cover, dithered; further still, only the
  // field's colour. A field: uFA (its middle, x and z where you stand, and which way its rows run), uFB (half its
  // length and width, its crop and how far on it is), uFS (its own dice). uFRow: the colours (see FIELD_ROWS).
  const FIELD_N = 12;
  const FIELD_FS = `
uniform vec4 uFA[${FIELD_N}]; uniform vec4 uFB[${FIELD_N}]; uniform float uFS[${FIELD_N}]; uniform float uFN; uniform float uFRow[13];
void fieldPaint(vec3 w, vec2 dx, vec2 dy, float b, inout float row, inout float lvAdd, inout vec3 N) {
  for (int i = 0; i < ${FIELD_N}; i++) {
    if (float(i) >= uFN) break;
    vec4 A = uFA[i], B = uFB[i];
    vec2 uA = A.zw, wA = vec2(-A.w, A.z), d = w.xz - A.xy;
    float u = dot(d, uA), v = dot(d, wA);
    if (abs(u) > B.x || abs(v) > B.y) continue;
    float crop = B.z, stage = B.w, seed = uFS[i];
    // (how many metres a pixel spans, along the rows and across them)
    float pu = abs(dot(dx, uA)) + abs(dot(dy, uA)), pv = abs(dot(dx, wA)) + abs(dot(dy, wA));
    float f = (v + B.y) / 0.9, jw = floor(f), t = fract(f) - 0.5;
    float rowK = 1.0 - smoothstep(0.2, 0.45, pv / 0.9);
    float s2 = sin(6.2832 * t), c2 = cos(6.2832 * t);
    N = normalize(N + vec3(wA.x, 0.0, wA.y) * s2 * 0.8 * rowK);
    lvAdd += rowK * (0.22 * c2 - 0.06);
    row = stage > 0.5 && stage < 1.5 ? uFRow[1] : uFRow[0];
    float edge = min(B.x - abs(u), B.y - abs(v));
    if (crop < 0.5 || stage < 1.5 || edge < 0.35) return;
    // a plant every S along each ridge (seedlings further apart)
    float S = stage < 2.5 ? 0.4 : 0.3;
    float uu = (u + B.x) / S, fu = fract(uu) - 0.5;
    vec2 cell = vec2(floor(uu), jw) + vec2(seed, seed * 0.37);
    float h1 = hsh(cell), h2 = hsh(cell + 17.31);
    vec2 dp = vec2((fu - (h1 - 0.5) * 0.3) * S, (t - (h2 - 0.5) * 0.12) * 0.9);
    float R = stage < 2.5 ? 0.06 : 0.16, cov = stage < 2.5 ? 0.12 : 0.62;
    // (ripe grain: the rows close up; gone over, it lies along them)
    if (crop > 0.5 && crop < 1.5 && stage > 3.5 && stage < 4.5) { R = 0.21; cov = 0.85; }
    if (stage > 4.5) { dp.x *= 0.55; R = 0.17; cov = 0.5; }
    float r = length(dp) / R;
    bool close = 1.0 - smoothstep(0.045, 0.11, max(pu, pv)) > b;
    float inP = close ? step(r, 1.0) : step(bayer4(gl_FragCoord.xy + vec2(2.0, 1.0)), cov);
    if (inP > 0.5) {
      float main = uFRow[2], acc = -1.0;
      if (stage > 4.5) main = crop > 2.5 && crop < 3.5 ? uFRow[8] : uFRow[7];
      else if (stage > 2.5 && crop < 1.5) { main = stage < 3.5 ? uFRow[2] : uFRow[5]; if (stage > 3.5 && hsh(floor(w.xz * 9.0) + seed) < 0.3) acc = uFRow[6]; }
      else if (stage > 2.5 && crop < 3.5) { main = h1 < 0.5 ? uFRow[3] : uFRow[4]; if (crop > 2.5 && stage > 3.5 && close && r < 0.45) acc = r < 0.24 ? uFRow[10] : uFRow[9]; }
      else if (stage > 3.5 && close && hsh(floor(w.xz * 11.0) + seed) < 0.2) acc = h2 < 0.5 ? uFRow[11] : uFRow[12];
      row = acc >= 0.0 ? acc : main;
      // it stands up off the earth: lit on top and on its sunward side
      if (close) N = normalize(N + vec3(uA.x * dp.x + wA.x * dp.y, 0.0, uA.y * dp.x + wA.y * dp.y) / R * 0.7);
      lvAdd += 0.25;
    } else if (close && uDay > 0.2) {
      // and throws a little shadow on the earth, away from the sun
      vec2 sun = vec2(dot(uSun.xz, uA), dot(uSun.xz, wA));
      float L = length(sun);
      if (L > 0.05 && length(dp + sun / L * R * 0.9) < R * 0.95) lvAdd -= 0.6 * uDay;
    }
    return;
  }
}`;
