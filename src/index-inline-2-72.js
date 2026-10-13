// index-inline-2 72 — math
// Lines 27623-27895 of readable/index-inline-2.pretty.js (statement-aligned).
  const SKY_FS = `
uniform vec2 uTanHalf; uniform mat3 uCamRot; uniform vec3 uSun; uniform mat3 uStarRot; uniform vec3 uPole; uniform float uLookUp;
uniform vec3 uQuad[4]; uniform float uGlyphPx;
uniform vec3 uDayZen, uDayHor, uNightZen, uNightHor, uDusk;
uniform float uCamY; uniform sampler2D uCloud; uniform vec3 uCloudC; uniform float uCloudH; uniform float uTime; uniform float uDay;
uniform float uOvercast; uniform float uSkyFog; uniform vec3 uFogCol; uniform float uFlash; uniform float uHeat; uniform float uMeteor; uniform float uAurora; uniform vec3 uAuroraDir; uniform float uMoonLit; uniform float uDither;
uniform int uMoonN; uniform vec4 uMoons[3]; uniform vec4 uMoonCols[3]; uniform float uEclipse; uniform vec4 uBolt;
varying vec2 vNdc;
float m2(vec2 v) { return 2.0 * abs(v.x - v.y) + v.y; }
float bayer4(vec2 p) { vec2 a = mod(floor(p), 4.0); return (4.0 * m2(mod(a, 2.0)) + m2(floor(a * 0.5)) + 0.5) / 16.0; }
float hash3(vec3 p) { p = fract(p * 0.3183099 + 0.1); p *= 17.0; return fract(p.x * p.y * p.z * (p.x + p.y + p.z)); }
float vnoise(vec2 p) { vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
  float a = hash3(vec3(i, 1.7)), b2 = hash3(vec3(i + vec2(1, 0), 1.7)), c = hash3(vec3(i + vec2(0, 1), 1.7)), d = hash3(vec3(i + vec2(1, 1), 1.7));
  return mix(mix(a, b2, f.x), mix(c, d, f.x), f.y); }
float fbm2(vec2 p) { float s = 0.0, a = 0.5; for (int i = 0; i < 4; i++) { s += a * vnoise(p); p *= 2.03; a *= 0.5; } return s; }
// 5x7 letters for the four quarters: N, E, S, W (row 0 on top, bit 4 on the left)
int glyphRow(int g, int r) {
  if (g == 0) { int a[7] = int[7](17, 25, 21, 19, 17, 17, 17); return a[r]; }
  if (g == 1) { int a[7] = int[7](31, 16, 16, 30, 16, 16, 31); return a[r]; }
  if (g == 2) { int a[7] = int[7](15, 16, 16, 14, 1, 1, 30); return a[r]; }
  int a[7] = int[7](17, 17, 17, 21, 21, 27, 17); return a[r];
}
float quarters(vec2 fc) {
  // the sky's quarters, written faintly high up in each quarter; you only see them looking up.
  // Each letter hangs where its quarter is but stands upright to the eye, so it always reads.
  for (int g = 0; g < 4; g++) {
    vec3 q = uQuad[g];
    if (q.z < 0.5) continue;
    vec2 r = (fc - q.xy) / uGlyphPx;
    float u = floor(r.x + 2.5), v = floor(3.5 - r.y);
    if (u < 0.0 || u >= 5.0 || v < 0.0 || v >= 7.0) continue;
    int row = glyphRow(g, int(v));
    if (((row >> (4 - int(u))) & 1) == 1) return 1.0;
  }
  return 0.0;
}
void main() {
  float b = bayer4(gl_FragCoord.xy);
  vec3 d = normalize(uCamRot * normalize(vec3(vNdc.x * uTanHalf.x, vNdc.y * uTanHalf.y, -1.0)));
  float sunAlt = uSun.y;
  float day = uDay;
  float h = max(d.y, 0.0);
  vec3 zen = mix(uNightZen, uDayZen, day), hor = mix(uNightHor, uDayHor, day);
  vec3 col = mix(hor, zen, pow(h, 0.5));
  float dusk = 1.0 - smoothstep(0.0, 0.3, abs(sunAlt + 0.03));
  vec2 dh = normalize(d.xz + 1e-5), sh = normalize(uSun.xz + 1e-5);
  float toward = max(dot(dh, sh), 0.0);
  col = mix(col, uDusk, dusk * (0.25 + 0.75 * pow(toward, 3.0)) * (1.0 - smoothstep(0.0, 0.4, h)) * 0.9);
  if (d.y < 0.0) col = hor * 0.8;
  float cs = dot(d, uSun);
  if (cs > 0.99975) col = vec3(1.0, 0.97, 0.86);
  else col += vec3(1.0, 0.8, 0.55) * pow(max(cs, 0.0), 220.0) * 0.5 * (0.3 + day);
  // the sun hidden behind a moon: a ring of pale fire round the dark
  if (uEclipse > 0.55 && cs > 0.9986 && cs <= 0.99975) col = mix(col, vec3(0.92, 0.94, 1.0), (uEclipse - 0.55) * 2.2 * smoothstep(0.9986, 0.9997, cs) * (0.65 + 0.35 * hash3(floor(d * 300.0))));
  if (day < 0.95 && d.y > -0.02) {
    vec3 sd = uStarRot * d;
    float s = hash3(floor(sd * 230.0));
    if (s > 0.9955) col = mix(col, vec3(0.85, 0.88, 1.0) * (0.55 + 0.45 * fract(s * 91.0)), 1.0 - day);
    // the pole star holds still while the sky turns around it; a dim red one marks the south
    float pn = dot(sd, uPole);
    if (abs(pn) > 0.9997) {
      vec3 t1 = normalize(cross(uPole, vec3(0.0, 0.0, 1.0))), t2 = cross(uPole, t1);
      float x = abs(dot(sd, t1)), y = abs(dot(sd, t2));
      bool core = x < 0.0042 && y < 0.0042, arm = (x < 0.0021 && y < 0.017) || (y < 0.0021 && x < 0.017);
      if (pn > 0.0 && (core || arm)) col = mix(col, core ? vec3(0.95, 0.98, 1.0) : vec3(0.6, 0.7, 0.95), 1.0 - day);
      if (pn < 0.0 && core) col = mix(col, vec3(1.0, 0.6, 0.48), (1.0 - day) * 0.9);
    }
  }
  // the moons: each a ball lit from the sun's side (so it waxes and wanes), with its own markings;
  // faint by day; dark against the sun when one crosses it
  for (int k = 0; k < 3; k++) {
    if (k >= uMoonN) break;
    vec4 m = uMoons[k];
    float c = dot(d, m.xyz);
    if (c < cos(m.w) || m.y < -0.08) continue;
    vec3 q = (d - m.xyz * c) / sin(m.w);
    vec3 n = q - m.xyz * sqrt(max(0.0, 1.0 - dot(q, q)));
    vec3 t1 = normalize(cross(m.xyz, vec3(0.0, 1.0, 0.0001))), t2 = cross(m.xyz, t1);
    float mark = fbm2(vec2(dot(q, t1), dot(q, t2)) * 2.6 + uMoonCols[k].w);
    vec3 mc = uMoonCols[k].rgb * (0.62 + 0.5 * mark);
    float lit = dot(n, uSun);
    if (lit > 0.0) col = mix(col, mc, 0.45 + 0.55 * (1.0 - day));
    else col = mix(col, vec3(0.02, 0.02, 0.04), 0.95 * max(1.0 - day, uEclipse));
  }
  // falling stars: now and then on any clear night, one after another on a night of them
  if (uMeteor > 0.0 && day < 0.6 && d.y > 0.04) {
    for (int k = 0; k < 4; k++) {
      float slot = floor(uTime / 0.9) - float(k);
      if (hash3(vec3(slot, 3.1, 7.7)) > uMeteor) continue;
      float t0 = slot * 0.9 + hash3(vec3(slot, 1.3, 2.2)) * 0.9, f = (uTime - t0) / (0.35 + hash3(vec3(slot, 5.5, 1.1)) * 0.6);
      if (f < 0.0 || f > 1.0) continue;
      float az = hash3(vec3(slot, 9.1, 4.4)) * 6.2832, el = 0.4 + hash3(vec3(slot, 2.7, 8.8)) * 0.75, dirA = hash3(vec3(slot, 6.6, 3.3)) * 6.2832;
      vec3 a = vec3(cos(el) * sin(az), sin(el), -cos(el) * cos(az));
      vec3 u1 = normalize(cross(a, vec3(0.0, 1.0, 0.0))), u2 = cross(u1, a), v = u1 * cos(dirA) + u2 * sin(dirA);
      vec3 head = normalize(a + v * 0.3 * f), tail = normalize(a + v * 0.3 * max(0.0, f - 0.35)), hd = head - tail;
      float sg = clamp(dot(d - tail, hd) / max(dot(hd, hd), 1e-7), 0.0, 1.0);
      if (length(d - (tail + hd * sg)) < 0.0032) col = mix(col, vec3(1.0, 0.96, 0.86), clamp(sg * 1.3 * (1.0 - f * 0.5), 0.0, 1.0) * (1.0 - day));
    }
  }
  // the lights over the pole: curtains, green below and violet above, waving slowly
  if (uAurora > 0.0 && day < 0.5 && d.y > 0.02) {
    vec2 dh2 = normalize(d.xz + 1e-5);
    float toward2 = dot(dh2, normalize(uAuroraDir.xz + 1e-5)), azA = atan(dh2.x, dh2.y);
    float n1 = vnoise(vec2(azA * 3.0 + uTime * 0.05, 2.0)), n2 = vnoise(vec2(azA * 9.0 - uTime * 0.11, 5.0));
    float lo = 0.06 + 0.14 * n1, hi = lo + 0.22 + 0.22 * n2;
    float band = smoothstep(lo, lo + 0.05, d.y) * (1.0 - smoothstep(lo + 0.08, hi, d.y));
    float rays = 0.55 + 0.45 * sin(azA * 70.0 + n2 * 7.0 + uTime * 0.5);
    float a2 = band * rays * smoothstep(-0.35, 0.45, toward2) * uAurora * (1.0 - day * 2.0);
    col = mix(col, mix(vec3(0.3, 0.95, 0.55), vec3(0.7, 0.4, 0.95), smoothstep(lo + 0.06, hi, d.y)), clamp(a2, 0.0, 0.8));
  }
  if (d.y > 0.015) {
    float t = (uCloudH - uCamY) / d.y;
    if (t > 0.0 && t < 90000.0) {
      vec2 p = d.xz * t;
      vec2 uv = (p - uCloudC.xy) / uCloudC.z + 0.5;
      float dens = texture2D(uCloud, uv).r * 2.0 - 1.0;
      dens += (fbm2(p / 2200.0 + uTime * 0.02) - 0.5) * 0.45;
      float a = smoothstep(0.0, 0.14, dens) * (1.0 - smoothstep(35000.0, 90000.0, t));
      // (a cloud's thin edge is dithered; with less dither it is cut cleaner)
      if (a > mix(0.5, b, uDither)) {
        // (by night a cloud is dark against the stars, a little silvered when a moon is up; it brightens with the day)
        vec3 cc = mix(vec3(0.07, 0.08, 0.13) + vec3(0.1, 0.1, 0.13) * uMoonLit, vec3(0.95, 0.96, 1.0), smoothstep(0.0, 0.6, day));
        cc = mix(cc, uDusk, dusk * 0.45);
        cc *= 0.82 + 0.18 * smoothstep(0.0, 0.3, dens);
        col = mix(col, cc, 0.92);
      }
    }
  }
  // under a lid of cloud the sky is grey, a little lighter where the sun is behind it
  if (uOvercast > 0.0 && d.y > -0.08) {
    vec3 oc = mix(uNightHor * 0.5, vec3(0.6, 0.62, 0.66), day) * (1.0 + 0.25 * day * pow(max(cs, 0.0), 6.0));
    oc *= 0.84 + 0.16 * vnoise(d.xz / max(d.y, 0.06) * 1.4 + uTime * 0.025);
    col = mix(col, oc, uOvercast * 0.88 * smoothstep(-0.08, 0.1, d.y));
  }
  // lightning: the bolt itself for a moment, and the whole sky lit
  if (uBolt.w > 0.0 && uBolt.z < 0.3 && d.y > -0.03) {
    float top = 0.34 - uBolt.y * 0.22;
    if (d.y < top) {
      float az2 = atan(d.x, -d.z);
      float jag = (hash3(vec3(floor(d.y * 45.0), uBolt.x * 13.0, 1.0)) - 0.5) * 0.018 + (hash3(vec3(floor(d.y * 8.0), uBolt.x * 7.0, 2.0)) - 0.5) * 0.06;
      float da = abs(mod(az2 - uBolt.x - jag + 3.14159, 6.28318) - 3.14159);
      if (da < 0.004 + 0.004 * (1.0 - uBolt.y)) col = mix(col, vec3(0.95, 0.93, 1.0), uBolt.w * (1.0 - uBolt.z / 0.3));
    }
  }
  col += uFlash * vec3(0.55, 0.56, 0.68) * smoothstep(-0.1, 0.35, d.y);
  // fog: the sky goes the colour of it; over hot ground, the far line shivers
  col = mix(col, uFogCol, uSkyFog * smoothstep(-0.2, 0.0, d.y + 0.15));
  if (uHeat > 0.0 && abs(d.y) < 0.05) col = mix(col, uFogCol * 1.08, uHeat * 0.55 * (1.0 - abs(d.y) / 0.05) * (0.5 + 0.5 * sin(d.x * 160.0 + uTime * 5.0) * sin(d.z * 140.0 - uTime * 4.3)));
  // the quarters sit above the weather, so a cloudy sky never hides the way
  if (uLookUp > 0.0 && d.y > 0.3 && quarters(gl_FragCoord.xy) > 0.5 && b < uLookUp) {
    float lum = dot(col, vec3(0.3, 0.55, 0.15));
    col = mix(col, lum > 0.5 ? vec3(0.16, 0.14, 0.34) : vec3(1.0, 0.9, 0.62), 0.6);
  }
  col = floor(col * 28.0 + 0.5 + (b - 0.5) * (0.35 + 0.65 * uDither)) / 28.0;
  gl_FragColor = vec4(col, 1.0);
}`;

  const TOWN_R = {
    capital: 30,
    town: 18,
    port: 14,
    village: 9,
    monastery: 5,
    outpost: 4,
  };
  function townRadius(s) {
    if (s.great) return CITY.out + 32;
    const n = TOWN_R[s.type] || 8;
    return 7 + Math.sqrt(n) * 1.6 + 24 + n * 3.2;
  }

  // ground a place clears (in a chunk's own metres): [x, z, r², strict] is a circle; with a fifth [ux, uz, hw, hd] it is
  // a rectangle inside that circle, its length along (ux, uz) (a field)
  function inClear(q, x, z) {
    const dx = x - q[0],
      dz = z - q[1];
    if (dx * dx + dz * dz >= q[2]) return false;
    const r = q[4];
    if (!r) return true;
    return (
      Math.abs(dx * r[0] + dz * r[1]) < r[2] &&
      Math.abs(-dx * r[1] + dz * r[0]) < r[3]
    );
  }

  // how a solid's foot follows a slope: the ground's fall east and south (per metre), and how high up it follows
  // (the plane through its middle along the ground's normal; see mergeSolids)
  function solidShear(s, k) {
    const n = s.N,
      sh = ((s.proto && s.proto.shearH) || 0) * k;
    if (!n || !(sh > 0) || n[1] < 0.3) return [0, 0, 0];
    return [-n[0] / n[1], -n[2] / n[1], sh];
  }

  // ---------------------------------------------------------------
  function frameAt(d) {
    let ex = d[2],
      ez = -d[0],
      L = Math.hypot(ex, ez);
    if (L < 1e-9) {
      ex = 1;
      ez = 0;
      L = 1;
    }
    ex /= L;
    ez /= L;
    const e = [ex, 0, ez];
    const n = [
      d[1] * e[2] - d[2] * e[1],
      d[2] * e[0] - d[0] * e[2],
      d[0] * e[1] - d[1] * e[0],
    ];
    return { u: d, e, n };
  }
  const dot3 = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
  const norm3 = (v) => {
    const L = Math.hypot(v[0], v[1], v[2]);
    return [v[0] / L, v[1] / L, v[2] / L];
  };
  function dirFromST(f, s, t, out) {
    faceToCube(
      f,
      Math.tan((s * Math.PI) / 4),
      Math.tan((t * Math.PI) / 4),
      out,
    );
    const L = Math.hypot(out[0], out[1], out[2]);
    out[0] /= L;
    out[1] /= L;
    out[2] /= L;
    return out;
  }
  // move along the sphere: metres east and north
  function stepOn(p, F, eastM, northM, R) {
    return norm3([
      p[0] + (F.e[0] * eastM + F.n[0] * northM) / R,
      p[1] + (F.e[1] * eastM + F.n[1] * northM) / R,
      p[2] + (F.e[2] * eastM + F.n[2] * northM) / R,
    ]);
  }
  // a point given in a frame's local metres (x east, z south)
  const localTo = (d, F, x, z, R) => stepOn(d, F, x, -z, R);
  function bearingTo(p, q) {
    const F = frameAt(p);
    const d = dot3(p, q);
    const t = [q[0] - p[0] * d, q[1] - p[1] * d, q[2] - p[2] * d];
    return Math.atan2(dot3(t, F.e), dot3(t, F.n)); // radians clockwise from north
  }
  function slerpDir(a, b, t) {
    const om = Math.acos(Math.max(-1, Math.min(1, dot3(a, b))));
    if (om < 1e-9) return a.slice();
    const s = Math.sin(om),
      k0 = Math.sin((1 - t) * om) / s,
      k1 = Math.sin(t * om) / s;
    return [
      a[0] * k0 + b[0] * k1,
      a[1] * k0 + b[1] * k1,
      a[2] * k0 + b[2] * k1,
    ];
  }
  // angle between two directions, accurate down to centimetres even for float32 inputs
  const angleOf = (a, b) =>
    Math.atan2(
      Math.hypot(
        a[1] * b[2] - a[2] * b[1],
        a[2] * b[0] - a[0] * b[2],
        a[0] * b[1] - a[1] * b[0],
      ),
      dot3(a, b),
    );
  const arcM = (a, b, R) => angleOf(a, b) * R;

  // ---------------------------------------------------------------
