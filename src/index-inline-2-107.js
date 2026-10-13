// index-inline-2 107 — swap
// Lines 54871-55047 of readable/index-inline-2.pretty.js (statement-aligned).
  const CAVE_EYE = 1.7,
    CAVE_WALK = 4.2,
    CAVE_RUN = 7.5;
  // Solid things underground: no sky and no sun; the day at the mouth, the fire you carry (which
  // lights what faces it), and the cave's own patterns: layered rock, gritty floors, ribbed
  // flowstone, crystals that catch the faintest light, foxfire, and the day beyond the mouth.
  const CAVE_FS = (() => {
    let fs = SOLID_FS;
    const swap = (a, b) => {
      if (fs.split(a).length !== 2)
        throw new Error("caveview: SOLID_FS changed shape at " + a);
      fs = fs.replace(a, b);
    };
    swap(
      "void main() {",
      `uniform vec4 uMouth; uniform vec3 uOut; uniform float uGone; uniform float uEyes; uniform vec3 uEyeCol; uniform float uHit;
float caveLv(vec3 N, float bias, float b) {
  vec3 dm = uMouth.xyz - vW; float L = length(dm);
  float a = max(0.0, 1.0 - L / 24.0);
  float m = uMouth.w * a * a * (0.4 + 0.6 * max(0.0, dot(N, dm / max(L, 0.001))));
  return -0.5 + bias * 0.8 + max(N.y, 0.0) * 0.1 + m * 3.4 + (b - 0.5) * 0.7 * uDither;
}
float caveFire(vec3 w, vec3 N) {
  vec3 d = uFire.xyz - w; float L = length(d);
  float a = max(0.0, 1.0 - L / 12.5), lam = max(0.0, dot(N, d / max(L, 0.001)));
  // (close by, bright; a little of it carries to the far side of a chamber)
  float f = 1.25 * uFire.w * a * (0.45 + 0.55 * a) * (0.35 + 0.8 * lam) + 0.45 * uFire.w * max(0.0, 1.0 - L / 24.0) * (0.3 + 0.7 * lam);
  float k = 0.0;
  for (int i = 0; i < ${LAMP_N}; i++) { float q = max(0.0, 1.0 - length(w - uLamps[i].xyz) / uLamps[i].w); k += uLampK[i] * q * q; }
  return min(1.0, f + 0.72 * (1.0 - exp(-1.4 * k)));
}
float h3(vec3 p) { return fract(sin(dot(p, vec3(127.1, 311.7, 74.7))) * 43758.5453); }
float vn3(vec3 p) {
  vec3 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(mix(h3(i), h3(i + vec3(1.0, 0.0, 0.0)), f.x), mix(h3(i + vec3(0.0, 1.0, 0.0)), h3(i + vec3(1.0, 1.0, 0.0)), f.x), f.y),
             mix(mix(h3(i + vec3(0.0, 0.0, 1.0)), h3(i + vec3(1.0, 0.0, 1.0)), f.x), mix(h3(i + vec3(0.0, 1.0, 1.0)), h3(i + vec3(1.0, 1.0, 1.0)), f.x), f.y), f.z);
}
vec3 caveTint(vec3 col, float k) { return mix(col, col * vec3(1.3, 1.02, 0.7) + vec3(0.06, 0.025, 0.0), clamp(k * 1.2, 0.0, 0.7)); }
void main() {`,
    );
    swap(
      "bool glow = false, ink = false;",
      "bool glow = false, ink = false; float selfLv = -9.0;",
    );
    // the dead crumble away; their eyes light when they wake; a blow makes them flash
    swap(
      "float b = bayer4(gl_FragCoord.xy);",
      "float b = bayer4(gl_FragCoord.xy);\n  if (uGone > 0.0 && b < uGone) discard;",
    );
    swap(
      "else if (eye) ink = true;",
      "else if (eye) { if (uEyes > 0.5) { gl_FragColor = vec4(uEyeCol * (0.85 + 0.15 * sin(uTime * 9.0 + vLocal.x * 40.0)), 1.0); return; } ink = true; }",
    );
    swap(
      "gl_FragColor = vec4(applyFog(col, glow ? vDist * 0.35 : vDist, b), 1.0);",
      "col = mix(col, vec3(1.0, 0.92, 0.82), clamp(uHit, 0.0, 1.0) * 0.55);\n  gl_FragColor = vec4(applyFog(col, glow ? vDist * 0.35 : vDist, b), 1.0);",
    );
    swap(
      "  } else if (pat == 22) {",
      `  } else if (pat == 30) {               // cave rock, worn smooth: soft patches, a seam or a crack, grit;
    vec3 q = vLocal;                    // underfoot, gritty, with darker mud in the hollows and a stone here and there
    float n1 = vn3(q * 0.6), n2 = vn3(q * 1.9 + 7.0);
    if (N.y > 0.62) {
      row = vRow2;
      bias += (n1 - 0.5) * 0.8 + (n2 - 0.5) * 0.3;
      float st = hsh(floor(q.xz * 6.0));
      if (st > 0.92) bias += 0.55; else if (st < 0.05) bias -= 0.6;
    } else {
      bias += (n1 - 0.5) * 1.0 + (n2 - 0.5) * 0.35 + (N.y < -0.45 ? -0.2 : 0.0);
      // a seam where the rock was laid down, faint and broken; a crack now and then
      float ly = q.y * 0.8 + n1 * 1.2;
      if (fract(ly) < 0.035 && vn3(q * 0.35 + 3.0) > 0.55) bias -= 0.45;
      if (abs(vn3(q * 1.1 + 21.0) - 0.5) < 0.012 && vn3(q * 0.4 - 5.0) > 0.62) bias -= 0.6;
      if (hsh(floor(q.xz * 12.0) + floor(q.y * 12.0)) > 0.955) bias += 0.4;
    }
  } else if (pat == 31) {               // cave floor: grit and stones, wet mud in the hollows
    vec3 q = vLocal;
    bias += (hsh(floor(q.xz * 2.2)) - 0.5) * 0.5;
    if (hsh(floor(q.xz * 1.1) + 7.0) > 0.62) row = vRow2;
    float st = hsh(floor(q.xz * 6.0));
    if (st > 0.88) bias += 0.7; else if (st < 0.06) bias -= 0.7;
  } else if (pat == 32) {               // flowstone: ribbed and wet, with a glint now and then
    float g = fract(uv.x * 4.0 + hsh(vec2(floor(uv.y * 2.0), 5.0)) * 0.3);
    bias += (g < 0.2 ? -0.6 : (g > 0.7 ? 0.35 : 0.0)) + (hsh(vec2(floor(uv.x * 4.0), floor(uv.y * 5.0))) - 0.5) * 0.3;
    if (hsh(floor(vLocal.xz * 7.0) + floor(vLocal.y * 7.0) + floor(uTime * 0.7)) > 0.985) bias += 1.5;
  } else if (pat == 33) {               // crystal: catches the faintest light, and glints
    bias += 1.2 + (hsh(floor(vLocal.xz * 5.0 + vLocal.y * 9.0)) - 0.5) * 0.8;
    selfLv = 0.6 + hsh(floor(vLocal.xz * 7.0 + vLocal.y * 5.0)) * 0.8;
    if (hsh(floor(vLocal.xz * 9.0 + vLocal.y * 13.0) + floor(uTime * 3.0)) > 0.94) glow = true;
  } else if (pat == 34) {               // foxfire: pale caps that glow a little in the dark
    selfLv = 1.3 + 0.5 * sin(uTime * 1.1 + vLocal.x * 3.0 + vLocal.z * 2.0);
    row = vRow2;
  } else if (pat == 35) {               // the way out: the day (or the night) beyond the mouth, too bright to see much of
    float y = uv.y + (b - 0.5) * 0.06, x = vLocal.x;
    float hor = 0.3 + 0.03 * sin(x * 1.7 + 0.7) + 0.02 * sin(x * 4.3 + 2.0);
    float trees = hor + 0.05 * step(0.5, hsh(vec2(floor(x * 2.5), 4.0))) * (0.6 + 0.4 * hsh(vec2(floor(x * 9.0), 1.0)));
    vec3 sky = mix(uOut, vec3(1.0), 0.35 * uMouth.w);
    vec3 c = y > trees ? sky : y > hor ? mix(uOut, sky, 0.35) * vec3(0.72, 0.8, 0.76) : uOut * vec3(0.62, 0.74, 0.55) * (0.85 + 0.3 * y / hor);
    gl_FragColor = vec4(c, 1.0);
    return;
  } else if (pat == 22) {`,
    );
    swap("float fk = fireAt(vW);", "float fk = caveFire(vW, N);");
    swap(
      "col = fireTint(rampAt(row, lightLv(N, bias, b) + fk * 2.4), fk);",
      "col = caveTint(rampAt(row, max(caveLv(N, bias, b) + fk * 2.4, selfLv)), fk);",
    );
    return fs;
  })();
  const CAVE_VS = `
#include <common>
#include <logdepthbuf_pars_vertex>
${SOLID_VS_BODY}
void main() {
  vec4 wp = modelMatrix * vec4(position, 1.0);
  vN = normalize(mat3(modelMatrix) * normal);
  vRow = aRow; vRow2 = aRow2; vPat = aPat; vLv = aLv; vUv = aUv; vLocal = position; vW = wp.xyz;
  vec4 mv = viewMatrix * wp;
  vDist = length(mv.xyz);
  gl_Position = projectionMatrix * mv;
  #include <logdepthbuf_vertex>
}`;

  // a box turned to lie along u: at(u, y, v) gives the point; five faces (none underneath)
  function oboxInto(mb, at, u0, u1, y0, y1, v0, v1, row, pat, o = null) {
    mb.quad(
      at(u0, y1, v0),
      at(u1, y1, v0),
      at(u1, y1, v1),
      at(u0, y1, v1),
      row,
      pat,
      [
        [0, 0],
        [u1 - u0, 0],
        [u1 - u0, v1 - v0],
        [0, v1 - v0],
      ],
      o,
    );
    for (const [a, b] of [
      [
        [u0, v0],
        [u1, v0],
      ],
      [
        [u1, v0],
        [u1, v1],
      ],
      [
        [u1, v1],
        [u0, v1],
      ],
      [
        [u0, v1],
        [u0, v0],
      ],
    ]) {
      const L = Math.hypot(b[0] - a[0], b[1] - a[1]);
      mb.quad(
        at(a[0], y0, a[1]),
        at(b[0], y0, b[1]),
        at(b[0], y1, b[1]),
        at(a[0], y1, a[1]),
        row,
        pat,
        [
          [0, 0],
          [L, 0],
          [L, y1 - y0],
          [0, y1 - y0],
        ],
        o,
      );
    }
  }

