// index-inline-2 110 — math
// Lines 56694-56772 of readable/index-inline-2.pretty.js (statement-aligned).
  const MUMMY_VS = `
#include <common>
#include <logdepthbuf_pars_vertex>
${SOLID_VS_BODY}
attribute float aBone; attribute vec3 aPivot;
uniform float uArmL; uniform float uArmR; uniform float uLegL; uniform float uLegR; uniform float uHeadP; uniform float uHeadY;
vec3 rotX(vec3 p, vec3 c, float a) { vec3 q = p - c; float s = sin(a), k = cos(a); return c + vec3(q.x, q.y * k - q.z * s, q.y * s + q.z * k); }
vec3 rotY(vec3 p, vec3 c, float a) { vec3 q = p - c; float s = sin(a), k = cos(a); return c + vec3(q.x * k + q.z * s, q.y, -q.x * s + q.z * k); }
void main() {
  vec3 p = position, n = normal;
  float a = 0.0;
  if (aBone > 1.5 && aBone < 2.5) a = uArmL;
  else if (aBone > 2.5 && aBone < 3.5) a = uArmR;
  else if (aBone > 3.5 && aBone < 4.5) a = uLegL;
  else if (aBone > 4.5) a = uLegR;
  if (a != 0.0) { p = rotX(p, aPivot, a); n = rotX(n, vec3(0.0), a); }
  if (aBone > 0.5 && aBone < 1.5) { p = rotX(p, aPivot, uHeadP); n = rotX(n, vec3(0.0), uHeadP); p = rotY(p, aPivot, uHeadY); n = rotY(n, vec3(0.0), uHeadY); }
  vec4 wp = modelMatrix * vec4(p, 1.0);
  vN = normalize(mat3(modelMatrix) * n);
  vRow = aRow; vRow2 = aRow2; vPat = aPat; vLv = aLv; vUv = aUv; vLocal = position; vW = wp.xyz;
  vec4 mv = viewMatrix * wp;
  vDist = length(mv.xyz);
  gl_Position = projectionMatrix * mv;
  #include <logdepthbuf_vertex>
}`;

  // how strong each kind of dead is
  const FOE_KIND = {
    common: {
      hp: 26,
      dmg: [7, 11],
      speed: 1.15,
      reach: 1.35,
      wind: 0.75,
      rest: 1.0,
      h: [1.55, 1.72],
      eyes: [1.0, 0.62, 0.3],
    },
    champion: {
      hp: 54,
      dmg: [10, 15],
      speed: 1.35,
      reach: 1.4,
      wind: 0.7,
      rest: 0.9,
      h: [1.66, 1.82],
      eyes: [0.45, 0.8, 1.0],
    },
    lord: {
      hp: 210,
      dmg: [18, 26],
      speed: 1.45,
      reach: 1.9,
      wind: 1.0,
      rest: 1.05,
      h: [1.96, 2.04],
      eyes: [1.0, 0.82, 0.3],
    },
  };
  // what makes a champion more than common
  const FOE_AFFIX = {
    swift: { speed: 2.35, wind: 0.55, hp: 0.9 },
    stone: { speed: 0.85, wind: 0.95, hp: 1.7, unshaken: true },
    fireless: { fearless: true, hp: 1.0, eyes: [1.0, 0.45, 0.2] },
  };
  const RISE_T = 1.5,
    STEP_T = 0.6,
    FALL_T = 0.9,
    CRUMBLE_T = 1.3;
  const ease = (t) => {
    t = Math.max(0, Math.min(1, t));
    return t * t * (3 - 2 * t);
  };
  const foeTurn = (a, b, max) => {
    let d = Math.atan2(Math.sin(b - a), Math.cos(b - a));
    d = Math.max(-max, Math.min(max, d));
    return a + d;
  };

