// index-inline-2 71 — card_fs
// Lines 27300-27622 of readable/index-inline-2.pretty.js (statement-aligned).
  const TERRAIN_FS = `
#include <logdepthbuf_pars_fragment>
${COMMON_FS}
${FIELD_FS}
varying vec3 vN; flat varying float vMat; varying float vShade; varying float vDist; varying vec3 vLocal; varying vec3 vW;
void main() {
  #include <logdepthbuf_fragment>
  float b = bayer4(gl_FragCoord.xy);
  float grain = (hsh(floor(vLocal.xz * 2.5)) - 0.5) * 0.5 * (1.0 - smoothstep(12.0, 55.0, vDist));
  float fk = fireAt(vW);
  vec3 Nn = normalize(vN);
  float row = floor(vMat + 0.5), lvAdd = 0.0;
  vec2 dwx = dFdx(vW.xz), dwy = dFdy(vW.xz);
  if (uFN > 0.5) fieldPaint(vW, dwx, dwy, b, row, lvAdd, Nn);
  // snow lying where it has fallen, on whatever faces the sky, patchy until it is deep
  if (uSnowCover > 0.0 && Nn.y > 0.6 && hsh(floor(vLocal.xz * 1.7)) < uSnowCover * 1.25 - (1.0 - Nn.y)) row = uSnowRow;
  float lv = lightLv(Nn, vShade + grain + lvAdd - uWetGround * 0.4, b) + fk * 2.4;
  vec3 col = fireTint(rampAt(row, lv), fk);
  gl_FragColor = vec4(applyFog(col, vDist, b), 1.0);
}`;

  const WATER_VS = `
#include <common>
#include <logdepthbuf_pars_vertex>
attribute float aDepth;
varying float vDepth; varying float vDist; varying vec3 vW; varying vec3 vLocal;
void main() {
  vec4 wp = modelMatrix * vec4(position, 1.0);
  vW = wp.xyz; vDepth = aDepth; vLocal = position;
  vec4 mv = viewMatrix * wp;
  vDist = length(mv.xyz);
  gl_Position = projectionMatrix * mv;
  #include <logdepthbuf_vertex>
}`;
  const WATER_FS = `
#include <logdepthbuf_pars_fragment>
${COMMON_FS}
varying float vDepth; varying float vDist; varying vec3 vW; varying vec3 vLocal;
void main() {
  #include <logdepthbuf_fragment>
  float b = bayer4(gl_FragCoord.xy);
  float d = vDepth;
  float dp = d < 3.0 ? 4.99 : d < 60.0 ? 4.99 - (d - 3.0) / 57.0 : d < 200.0 ? 4.0 - (d - 60.0) / 140.0 : d < 1500.0 ? 3.0 - (d - 200.0) / 1300.0 : d < 4000.0 ? 2.0 - (d - 1500.0) / 2500.0 : max(0.0, 1.0 - (d - 4000.0) / 2000.0);
  float m = floor(clamp(dp + (b - 0.5) * 0.5 * uDither, 0.0, 4.99));
  vec3 V = normalize(cameraPosition - vW);
  float w = sin(vLocal.x * 0.35 + uTime * 1.3) * 0.5 + sin(vLocal.z * 0.27 - uTime * 1.1) * 0.5;
  vec3 n = normalize(vec3(w * 0.05, 1.0, w * 0.04));
  vec3 H = normalize(V + uSun);
  float spec = pow(max(dot(n, H), 0.0), 90.0) * step(0.0, uSun.y);
  float lv = lightLv(n, spec * 2.5 - 0.3, b);
  vec3 col = rampAt(m, lv);
  if (d < 1.2 && b > 0.35 * uDither) col = rampAt(4.0, lv + 1.0);
  float sparkle = hsh(floor(vLocal.xz * 0.6) + floor(uTime * 3.0));
  if (spec > 0.25 && sparkle > 0.93) col = vec3(1.0, 0.97, 0.85);
  gl_FragColor = vec4(applyFog(col, vDist, b), 1.0);
}`;

  // solid 3D kit pieces: patterns are drawn in the shader, in metres
  const SOLID_VS_BODY = `
varying vec3 vN; varying float vRow; varying float vRow2; varying float vPat; varying float vLv; varying vec2 vUv; varying float vDist; varying vec3 vLocal; varying vec3 vW;
attribute float aRow; attribute float aRow2; attribute vec2 aUv; attribute float aPat; attribute float aLv;
`;
  const SOLID_VS = `
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
  // rings on the water round someone wading or swimming
  const RIPPLE_VS = `
#include <common>
#include <logdepthbuf_pars_vertex>
varying vec2 vP;
void main() {
  vP = position.xz;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  #include <logdepthbuf_vertex>
}`;
  const RIPPLE_FS = `
#include <logdepthbuf_pars_fragment>
uniform float uTime; uniform float uOn; uniform vec3 uCol;
varying vec2 vP;
float rm2(vec2 v) { return 2.0 * abs(v.x - v.y) + v.y; }
float rbayer(vec2 p) { vec2 a = mod(floor(p), 4.0); return (4.0 * rm2(mod(a, 2.0)) + rm2(floor(a * 0.5)) + 0.5) / 16.0; }
void main() {
  #include <logdepthbuf_fragment>
  float d = length(vP), k = 0.0;
  for (int i = 0; i < 3; i++) { float r = 0.35 + fract(uTime * 0.55 + float(i) / 3.0) * 1.3; k = max(k, (1.0 - smoothstep(0.0, 0.06, abs(d - r))) * (1.0 - (r - 0.35) / 1.3)); }
  if (k * uOn < 0.12 + rbayer(gl_FragCoord.xy) * 0.75) discard;
  gl_FragColor = vec4(uCol, 1.0);
}`;
  // people: the same, plus limbs that swing around their joints
  const FOLK_VS = `
#include <common>
#include <logdepthbuf_pars_vertex>
${SOLID_VS_BODY}
attribute float aBone; attribute vec3 aPivot;
uniform float uPhase; uniform float uAmp; uniform float uHeadYaw; uniform float uBreath; uniform float uSit; uniform float uWork; uniform float uTime;
vec3 rotX(vec3 p, vec3 c, float a) { vec3 q = p - c; float s = sin(a), k = cos(a); return c + vec3(q.x, q.y * k - q.z * s, q.y * s + q.z * k); }
vec3 rotY(vec3 p, vec3 c, float a) { vec3 q = p - c; float s = sin(a), k = cos(a); return c + vec3(q.x * k + q.z * s, q.y, -q.x * s + q.z * k); }
void main() {
  vec3 p = position, n = normal;
  float sw = sin(uPhase) * uAmp;
  float a = 0.0;
  // arms swing as they walk, rest on the knees when they sit; at work the right one hammers, pulls or stirs
  if (aBone > 1.5 && aBone < 2.5) a = sw + uBreath * 0.04 - uSit * 0.45;
  else if (aBone > 2.5 && aBone < 3.5) a = -sw - uBreath * 0.04 - uSit * 0.45 - uWork * (0.8 + 0.45 * sin(uTime * 6.3 + uPhase));
  // sitting, the legs come forward at the hip
  else if (aBone > 3.5 && aBone < 4.5) a = -sw * 0.9 - uSit * 1.45;
  else if (aBone > 4.5) a = sw * 0.9 - uSit * 1.45;
  if (a != 0.0) { p = rotX(p, aPivot, a); n = rotX(n, vec3(0.0), a); }
  if (aBone > 0.5 && aBone < 1.5) { p = rotY(p, aPivot, uHeadYaw); n = rotY(n, vec3(0.0), uHeadYaw); }
  p.y += uBreath * 0.006 * step(0.5, p.y);
  vec4 wp = modelMatrix * vec4(p, 1.0);
  vN = normalize(mat3(modelMatrix) * n);
  vRow = aRow; vRow2 = aRow2; vPat = aPat; vLv = aLv; vUv = aUv; vLocal = position; vW = wp.xyz;
  vec4 mv = viewMatrix * wp;
  vDist = length(mv.xyz);
  gl_Position = projectionMatrix * mv;
  #include <logdepthbuf_vertex>
}`;
  const SOLID_FS = `
#include <logdepthbuf_pars_fragment>
${COMMON_FS}
uniform sampler2D uAtlas; uniform float uDark;
varying vec3 vN; varying float vRow; varying float vRow2; varying float vPat; varying float vLv; varying vec2 vUv; varying float vDist; varying vec3 vLocal; varying vec3 vW;
void main() {
  #include <logdepthbuf_fragment>
  float b = bayer4(gl_FragCoord.xy);
  vec3 N = normalize(vN);
  if (!gl_FrontFacing) N = -N;
  int pat = int(vPat + 0.5);
  float bias = vLv, row = vRow;
  vec2 uv = vUv;
  bool glow = false, ink = false;
  if (pat == 1) {                       // bark: grooves along the limb
    float g = fract(uv.x * 3.5 + hsh(vec2(floor(uv.y * 1.5), 3.0)) * 0.35);
    bias += g < 0.22 ? -0.9 : (g > 0.72 ? 0.3 : 0.0);
  } else if (pat == 2 || pat == 3) {    // needles; snow settles on the tops
    float sd = uv.x * 2.2 + uv.y * 2.6, s = fract(sd);
    // near enough, you see between the sprays and under the ragged hem of each tier
    if (vDist < 19.0) {
      bool gap = s < 0.34 && hsh(vec2(floor(sd), floor((uv.x * 1.7 - uv.y * 1.3) * 2.4))) < (uv.y < 0.0 ? 0.62 : 0.48);
      bool hem = uv.y >= 0.0 && uv.y < 0.24 && hsh(vec2(floor(uv.x * 6.5), 7.0)) * 0.26 > uv.y;
      if ((gap || hem) && b >= clamp((vDist - 12.0) / 7.0, 0.0, 1.0)) discard;
    }
    bias += s < 0.3 ? -0.7 : 0.1;
    if (pat == 3 && N.y > 0.2 && hsh(floor(vLocal.xz * 3.0 + vLocal.y)) < 0.82) row = vRow2;
  } else if (pat == 4) {                // planks
    float f = fract(uv.y / 0.28), j = fract(uv.x / 2.2 + floor(uv.y / 0.28) * 0.37);
    bias += (f < 0.14 ? -1.0 : 0.0) + (j < 0.03 ? -0.8 : 0.0);
  } else if (pat == 5) {                // logs
    float f = fract(uv.y / 0.34);
    bias += f < 0.16 ? -1.1 : (f > 0.62 ? 0.45 : 0.0);
  } else if (pat == 6) {                // bricks
    float r = floor(uv.y / 0.22), f = fract(uv.y / 0.22), g = fract(uv.x / 0.45 + r * 0.5);
    bias += (f < 0.16 || g < 0.08) ? -1.0 : (hsh(vec2(floor(uv.x / 0.45 + r * 0.5), r)) - 0.5) * 0.5;
  } else if (pat == 7) {                // stones
    float r = floor(uv.y / 0.42), f = fract(uv.y / 0.42), g = fract(uv.x / 0.62 + r * 0.43);
    bias += (f < 0.12 || g < 0.07) ? -1.1 : (hsh(vec2(floor(uv.x / 0.62 + r * 0.43), r)) - 0.5) * 0.8;
  } else if (pat == 8) {                // plaster between dark timbers
    float bx = fract(uv.x / 1.3), by = fract(uv.y / 2.9), dg = abs(fract(uv.x / 1.3) - fract(uv.y / 1.45));
    if (bx < 0.1 || by < 0.06 || by > 0.95 || dg < 0.06) { row = vRow2; bias -= 0.3; }
    else bias += (hsh(floor(uv * 6.0)) - 0.5) * 0.35;
  } else if (pat == 9) {                // thatch
    float f = fract(uv.y / 0.35);
    bias += (f < 0.14 ? -1.0 : 0.0) + (hsh(vec2(floor(uv.x * 9.0), floor(uv.y / 0.35))) - 0.5) * 0.7;
  } else if (pat == 10) {               // clay tiles
    float f = fract(uv.y / 0.3), g = fract(uv.x / 0.3 + floor(uv.y / 0.3) * 0.5);
    bias += f < 0.18 ? -1.0 : (g < 0.18 ? -0.6 : (g > 0.6 ? 0.35 : 0.0));
  } else if (pat == 11) {               // slate
    float r = floor(uv.y / 0.22), f = fract(uv.y / 0.22), g = fract(uv.x / 0.35 + r * 0.5);
    bias += (f < 0.14 || g < 0.06) ? -0.9 : (hsh(vec2(floor(uv.x / 0.35 + r * 0.5), r)) - 0.5) * 0.4;
  } else if (pat == 12) {               // window: frame and panes, lit at night
    // which window this is rides in its uv: a household's go dark one by one as the night
    // wears on, an inn's or a hall's stay lit, a barn's never light
    float wid = floor(uv.x), typ = floor(wid / 64.0);
    uv.x = fract(uv.x);
    bool frame = uv.x < 0.13 || uv.x > 0.87 || uv.y < 0.1 || uv.y > 0.9 || abs(uv.x - 0.5) < 0.06 || abs(uv.y - 0.55) < 0.05;
    bool lit = uDark > 0.5 && (typ > 0.5 ? typ < 1.5 : hsh(vec2(mod(wid, 64.0), 3.7)) >= uLate * 0.88);
    if (!frame) { if (lit) glow = true; else { bias -= 2.0; } }
  } else if (pat == 13) {               // door
    bias -= 0.5; if (fract(uv.x / 0.22) < 0.14) bias -= 0.7;
  } else if (pat == 14) {               // cactus ribs
    float g = fract(uv.x * 4.0);
    bias += g < 0.25 ? -0.9 : (g > 0.6 ? 0.3 : 0.0);
  } else if (pat == 15) {               // face
    bool eye = uv.y > 0.46 && uv.y < 0.6 && ((uv.x > 0.2 && uv.x < 0.38) || (uv.x > 0.62 && uv.x < 0.8));
    bool mouth = uv.y > 0.2 && uv.y < 0.27 && uv.x > 0.38 && uv.x < 0.62;
    if (eye) ink = true; else if (mouth) bias -= 1.0;
  } else if (pat == 16) {               // rock: moss or snow on the tops
    bias += (hsh(floor(vLocal.xz * 2.0) + floor(vLocal.y * 2.0)) - 0.5) * 0.5;
    if (N.y > 0.55 && hsh(floor(vLocal.xz * 3.0)) < 0.75) row = vRow2;
  } else if (pat == 17) {               // palm frond painted into the atlas
    vec4 t = texture2D(uAtlas, uv);
    if (t.a < 0.5) discard;
    row = vRow + floor(t.g * 255.0 / 40.0 + 0.5);
    bias += floor(t.r * 255.0 / 60.0 + 0.5) - 2.2;
  } else if (pat == 18) {               // cloth folds
    bias += fract(uv.x * 7.0) < 0.2 ? -0.5 : 0.0;
  } else if (pat == 19) {               // soft pixel shadow on the ground
    float r = length(uv);
    // (dithered: thinning out towards its rim; with less dither, an even half-tone with a clean edge)
    if (r > 1.0 || b > mix(0.5 * step(r, 0.92), 0.6 * (1.0 - r * r), uDither)) discard;
    gl_FragColor = vec4(applyFog(rampAt(vRow, 0.0 + uDay), vDist, b), 1.0);
    return;
  } else if (pat == 20) {               // palm trunk rings
    float f = fract(uv.y / 0.33);
    bias += f < 0.25 ? -0.9 : 0.1;
  } else if (pat == 21) {               // hide and fur
    bias += (hsh(floor(uv * 3.0)) - 0.5) * 0.8;
  } else if (pat == 23) {               // flames: flicker, orange to yellow, never dark
    float fl = hsh(floor(vLocal.xz * 9.0 + vLocal.y * 7.0) + floor(uTime * 10.0));
    if (fl < 0.3) discard;
    gl_FragColor = vec4(rampAt(vRow, 2.0 + floor(fl * 3.0 + vLocal.y * 1.5)), 1.0);
    return;
  } else if (pat == 24) {               // still water: slow ripples and glints
    float w = sin(vLocal.x * 2.3 + uTime * 1.6) * sin(vLocal.z * 2.9 - uTime * 1.3);
    bias += w * 0.4 - 0.2;
    if (hsh(floor(vLocal.xz * 4.0) + floor(uTime * 2.0)) > 0.975) bias += 1.4;
  } else if (pat == 25) {               // a lamp's glass, a brazier's coals: alight from dusk to dawn
    // thin dark bars hold the glass (and make a grate of a brazier's coals)
    bool bar = abs(fract(uv.x) - 0.5) < 0.07 || fract(uv.y) > 0.93;
    if (uDark > 0.5 && !bar) glow = true; else bias -= bar ? 1.2 : 0.4;
  } else if (pat == 26) {               // a torch's or a brazier's flames: only lit at night
    if (uDark < 0.5) discard;
    float fl = hsh(floor(vLocal.xz * 9.0 + vLocal.y * 7.0) + floor(uTime * 10.0));
    if (fl < 0.3) discard;
    gl_FragColor = vec4(rampAt(vRow, 2.0 + floor(fl * 3.0 + uv.y * 5.0)), 1.0);
    return;
  } else if (pat == 27) {               // grave wrappings: strips wound round and round, overlapping, stained
    float sd = uv.y * 8.0 + uv.x * 1.7, s = fract(sd), band = floor(sd);
    bias += (s < 0.12 ? -0.5 : 0.0) + (hsh(vec2(band, 2.0)) - 0.5) * 0.45 + (s > 0.8 ? 0.15 : 0.0);
    if (hsh(vec2(floor(uv.x * 2.5), band)) > 0.8) row = vRow2;
  } else if (pat == 28) {               // a dried face between the wrappings: hollow eyes, a dark mouth
    bool band = uv.y > 0.74 || uv.y < 0.14 || ((uv.x < 0.12 || uv.x > 0.88) && fract(uv.y * 5.0) < 0.5);
    bool eye = uv.y > 0.44 && uv.y < 0.6 && ((uv.x > 0.17 && uv.x < 0.4) || (uv.x > 0.6 && uv.x < 0.83));
    if (band) { row = vRow2; bias += fract(uv.y * 9.0 + uv.x * 2.0) < 0.2 ? -0.7 : 0.0; }
    else if (eye) ink = true;
    else if (uv.y > 0.22 && uv.y < 0.3 && uv.x > 0.32 && uv.x < 0.68) bias -= 1.3;
    else bias -= 0.25;
  } else if (pat == 22) {               // spots and lanterns
    if (hsh(floor(vLocal.xz * 5.0 + vLocal.y * 3.0)) < 0.18) { row = vRow2; if (uDark > 0.5) glow = true; }
  } else if (pat == 36) {               // spray: water thrown up, broken and glinting, never still
    float s = hsh(floor(vW.xz * 3.0 + vec2(vW.y * 2.0, -vW.y * 1.4)) + floor(uTime * 14.0));
    if (s < 0.36) discard;
    bias += (s - 0.55) * 1.4 + 0.5;
  }
  vec3 col;
  float fk = fireAt(vW);
  // (snow settles on roofs, rocks and needles; never on a floor under a roof)
  if (uSnowCover > 0.0 && N.y > 0.62 && !glow && (pat == 9 || pat == 10 || pat == 11 || pat == 16 || pat == 2) && hsh(floor(vLocal.xz * 2.3) + floor(vLocal.y * 2.3)) < uSnowCover * 1.2 - (1.0 - N.y)) row = uSnowRow;
  if (glow) col = rampAt(vRow2, 4.0);
  else if (ink) col = rampAt(row, 0.0) * 0.6;
  else col = fireTint(rampAt(row, lightLv(N, bias, b) + fk * 2.4), fk);
  gl_FragColor = vec4(applyFog(col, glow ? vDist * 0.35 : vDist, b), 1.0);
}`;

  // cards: leaf clumps (face the camera), plants and far stand-ins (stand upright)
  const CARD_VS = `
#include <common>
#include <logdepthbuf_pars_vertex>
attribute vec3 iPos; attribute vec4 iUv; attribute vec2 iSize; attribute vec3 iNrm; attribute float iRow; attribute float iAnchor;
uniform float uTime;
varying vec2 vUv; varying float vRow; varying vec3 vNl; varying float vDist; varying vec3 vW; varying float vDroop;
void main() {
  vec4 base = modelViewMatrix * vec4(iPos, 1.0);
  vDroop = iAnchor > 0.55 ? 1.0 : 0.0;
  vW = (modelMatrix * vec4(iPos, 1.0)).xyz;
  vec3 upV, rightV;
  float yoff;
  if (iAnchor > 0.01) {
    upV = vec3(0.0, 1.0, 0.0); rightV = vec3(1.0, 0.0, 0.0);
    yoff = position.y - iAnchor;
  } else {
    upV = normalize((viewMatrix * vec4(mat3(modelMatrix) * vec3(0.0, 1.0, 0.0), 0.0)).xyz);
    vec3 c = cross(upV, normalize(-base.xyz));
    rightV = length(c) > 1e-3 ? normalize(c) : vec3(1.0, 0.0, 0.0);
    yoff = position.y;
  }
  float sway = sin(uTime * 1.3 + iPos.x * 0.37 + iPos.z * 0.23) * (iAnchor > 0.01 ? 0.03 : 0.06 * position.y) * iSize.y;
  vec3 p = base.xyz + rightV * (position.x * iSize.x + sway) + upV * (yoff * iSize.y);
  vUv = vec2(mix(iUv.x, iUv.z, position.x + 0.5), mix(iUv.y, iUv.w, position.y));
  vRow = iRow;
  vNl = normalize(mat3(modelMatrix) * iNrm);
  vDist = length(p);
  gl_Position = projectionMatrix * vec4(p, 1.0);
  #include <logdepthbuf_vertex>
}`;
  const CARD_FS = `
#include <logdepthbuf_pars_fragment>
${COMMON_FS}
uniform sampler2D uAtlas;
varying vec2 vUv; varying float vRow; varying vec3 vNl; varying float vDist; varying vec3 vW; varying float vDroop;
void main() {
  #include <logdepthbuf_fragment>
  vec4 t = texture2D(uAtlas, vUv);
  if (t.a < 0.5) discard;
  float b = bayer4(gl_FragCoord.xy);
  // leaves right in front of your eyes thin out; hanging strands already a few steps away
  float near = vDroop > 0.5 ? 5.0 : 2.6;
  if (vDist < near && b > (vDist - 0.8) / (near - 0.8)) discard;
  // gaps between leaves open up as you come near; far off they fill with the crown's shade
  if (t.b > 0.5 && b >= clamp((vDist - 12.0) / 7.0, 0.0, 1.0)) discard;
  float k = floor(t.r * 255.0 / 60.0 + 0.5), s = floor(t.g * 255.0 / 40.0 + 0.5);
  float row = s > 2.5 && s < 3.5 ? uSnowRow : vRow + s;
  float Ld = dot(vNl, uSun);
  float fk = fireAt(vW);
  float shift = mix(-2.1 + uMoon * 0.45, clamp(Ld * 0.9 * (1.0 - 0.75 * uOvercast) - 0.25 - 0.5 * uOvercast, -1.2, 0.55), uDay) + (b - 0.5) * 0.6 * uDither + fk * 2.2 + uFlash * 2.2;
  vec3 col = fireTint(rampAt(row, k + shift), fk);
  gl_FragColor = vec4(applyFog(col, vDist, b), 1.0);
}`;

  const SKY_VS = `
varying vec2 vNdc;
void main() { vNdc = position.xy; gl_Position = vec4(position.xy, 0.9999, 1.0); }`;
