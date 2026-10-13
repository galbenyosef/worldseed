// index-inline-2 103 — math
// Lines 52423-52495 of readable/index-inline-2.pretty.js (statement-aligned).
  const ANIMAL_VS = `
#include <common>
#include <logdepthbuf_pars_vertex>
${SOLID_VS_BODY}
attribute float aBone; attribute vec3 aPivot;
uniform float uPhase; uniform float uAmp; uniform float uHeadPitch; uniform float uHeadYaw; uniform float uTail; uniform float uTailP; uniform float uBob;
vec3 rotX(vec3 p, vec3 c, float a) { vec3 q = p - c; float s = sin(a), k = cos(a); return c + vec3(q.x, q.y * k - q.z * s, q.y * s + q.z * k); }
vec3 rotY(vec3 p, vec3 c, float a) { vec3 q = p - c; float s = sin(a), k = cos(a); return c + vec3(q.x * k + q.z * s, q.y, -q.x * s + q.z * k); }
void main() {
  vec3 p = position, n = normal;
  float sw = sin(uPhase) * uAmp, sw2 = sin(uPhase + 0.9) * uAmp;
  // the legs swing in diagonal pairs (a sprawling leg, a lizard's or a scorpion's, round its hip: 7..10)
  float a = 0.0, yw = 0.0;
  if (aBone > 1.5 && aBone < 2.5) a = sw;
  else if (aBone > 2.5 && aBone < 3.5) a = -sw;
  else if (aBone > 3.5 && aBone < 4.5) a = -sw2;
  else if (aBone > 4.5 && aBone < 5.5) a = sw2;
  else if (aBone > 6.5 && aBone < 8.5) yw = -sw * 0.7;
  else if (aBone > 8.5 && aBone < 10.5) yw = sw2 * 0.7;
  if (a != 0.0) { p = rotX(p, aPivot, a); n = rotX(n, vec3(0.0), a); }
  if (yw != 0.0) { p = rotY(p, aPivot, yw); n = rotY(n, vec3(0.0), yw); }
  if (aBone > 0.5 && aBone < 1.5) {
    p = rotX(p, aPivot, uHeadPitch); n = rotX(n, vec3(0.0), uHeadPitch);
    p = rotY(p, aPivot, uHeadYaw); n = rotY(n, vec3(0.0), uHeadYaw);
  }
  if (aBone > 5.5 && aBone < 6.5) { p = rotX(p, aPivot, uTailP); n = rotX(n, vec3(0.0), uTailP); p = rotY(p, aPivot, uTail); n = rotY(n, vec3(0.0), uTail); }
  if (position.y > 0.2) p.y += (0.5 + 0.5 * sin(uPhase * 2.0)) * uBob;
  vec4 wp = modelMatrix * vec4(p, 1.0);
  vN = normalize(mat3(modelMatrix) * n);
  vRow = aRow; vRow2 = aRow2; vPat = aPat; vLv = aLv; vUv = aUv; vLocal = position; vW = wp.xyz;
  vec4 mv = viewMatrix * wp;
  vDist = length(mv.xyz);
  gl_Position = projectionMatrix * mv;
  #include <logdepthbuf_vertex>
}`;
  // the same as everything solid, but able to fade in and out (dithered), for coming and going
  const ANIMAL_FS = (() => {
    const head =
      "void main() {\n  #include <logdepthbuf_fragment>\n  float b = bayer4(gl_FragCoord.xy);";
    const tail =
      "gl_FragColor = vec4(applyFog(col, glow ? vDist * 0.35 : vDist, b), 1.0);";
    if (!SOLID_FS.includes(head) || SOLID_FS.split(tail).length !== 2)
      throw new Error("fauna: SOLID_FS changed shape");
    // (a blow makes it flash pale for a moment)
    return SOLID_FS.replace(
      head,
      "uniform float uFadeIn; uniform float uHit;\n" +
        head +
        "\n  if (b >= uFadeIn) discard;",
    ).replace(
      tail,
      "col = mix(col, vec3(1.0, 0.9, 0.84), clamp(uHit, 0.0, 1.0) * 0.5);\n  " +
        tail,
    );
  })();
  const turnTo = (a, b, k) => {
    const d = Math.atan2(Math.sin(b - a), Math.cos(b - a));
    return a + d * Math.min(1, k);
  };
  const easeK = (t) => {
    t = Math.max(0, Math.min(1, t));
    return t * t * (3 - 2 * t);
  };
  // one of a herd: "wild goats" → "wild goat", "shell-oxen" → "shell-ox"; deer and elk stay as they are
  function singularOf(name) {
    const n = String(name || "beast");
    if (/oxen$/.test(n)) return n.replace(/oxen$/, "ox");
    if (/ies$/.test(n)) return n.replace(/ies$/, "y");
    if (/(x|ch|sh)es$/.test(n)) return n.slice(0, -2);
    if (/[^s]s$/.test(n)) return n.slice(0, -1);
    return n;
  }

