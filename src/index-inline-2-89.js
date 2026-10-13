// index-inline-2 89 — brew
// Lines 38825-39030 of readable/index-inline-2.pretty.js (statement-aligned).
  const CAVE_STUB = 3.2,
    CAVE_CLIFF = 1.6;

  const TALL_KINDS = new Set([
    "tower",
    "bigtree",
    "peak",
    "lighthouse",
    "mill",
    "deadcity",
  ]);
  // a farm the story has taken: burnt, gone grey, frozen, drowned, or just left
  const LOST_TINT = {
    burnt: [[38, 34, 36], 0.78],
    grey: [[156, 156, 150], 0.7],
    frozen: [[214, 226, 238], 0.55],
    drowned: [[50, 68, 66], 0.55],
    abandoned: [[104, 98, 92], 0.45],
  };
  const lostTint = (how) => {
    const [to, k] = LOST_TINT[how] || LOST_TINT.abandoned;
    return (c) => c.map((v, i) => Math.round(v * (1 - k) + to[i] * k));
  };
  // the colours things in places between towns are made of
  const SITE_COLS = {
    stone: [132, 128, 136],
    stoneDark: [96, 92, 102],
    moss: [100, 118, 74],
    wood: [108, 78, 50],
    woodDark: [80, 58, 40],
    rust: [126, 74, 50],
    bone: [226, 218, 196],
    cloth: [150, 128, 96],
    hide: [170, 136, 96],
    soil: [98, 76, 56],
    grain: [206, 176, 92],
    green: [98, 140, 58],
    water: [60, 108, 140],
    hot: [88, 170, 164],
    crust: [230, 224, 194],
    ash: [62, 58, 60],
    glow: [255, 206, 110],
    flame: [255, 170, 70],
    red: [160, 52, 44],
    gold: [230, 196, 90],
    blue: [70, 110, 190],
    char: [48, 44, 46],
    rag: [196, 188, 170],
    old: [158, 152, 146],
    oldDark: [118, 112, 110],
    iron: [62, 60, 68],
    glass: [206, 184, 128],
    // the wonders: scorched earth and a star's black rock and its light; old ivory; boiled crust; stone wood
    scorch: [64, 54, 48],
    starRock: [46, 42, 58],
    fused: [78, 74, 92],
    star: [150, 196, 255],
    boneDark: [196, 182, 150],
    sinter: [230, 222, 192],
    ochre: [208, 156, 76],
    orange: [196, 112, 58],
    spray: [234, 242, 248],
    petRed: [150, 86, 80],
    petAmber: [184, 138, 106],
    petGrey: [136, 130, 140],
    petDark: [94, 86, 98],
    // a hermit's things: what bubbles in the pot, and mushrooms that glow
    brew: [118, 226, 96],
    violet: [120, 70, 170],
    shroom: [196, 150, 255],
  };
  const SMALL_KINDS = new Set([
    "cairn",
    "stone",
    "shrine",
    "camp",
    "grave",
    "spring",
    "stash",
    "bones",
  ]);
  // how far each kind of light or plume carries (m)
  const BEACON_FAR = {
    smoke: 12000,
    steam: 9000,
    light: 14000,
    fire: 15000,
    lantern: 1800,
    candle: 1300,
    star: 16000,
    pillar: 16000,
    mage: 13000,
    brew: 160,
    lamp: 17000,
  };
  const BEACON_KIND = {
    smoke: 0,
    steam: 1,
    light: 2,
    fire: 3,
    lantern: 4,
    candle: 4,
    star: 5,
    pillar: 6,
    mage: 7,
    brew: 8,
    lamp: 9,
  };
  const BEACON_MAX = 420;

  const BEACON_VS = `
#include <common>
#include <logdepthbuf_pars_vertex>
attribute vec3 iPos; attribute vec4 iInfo;
uniform float uTanHalf; uniform float uViewH;
varying vec2 vUv; varying float vKind; varying float vSeed; varying float vDist; varying float vFade; varying float vPx;
void main() {
  vec4 base = viewMatrix * vec4(iPos, 1.0);
  float d = max(1.0, -base.z);
  float mpp = 2.0 * uTanHalf * d / uViewH;   // metres per pixel out there
  float kind = iInfo.x;
  vec2 size;
  if (kind > 8.5) size = vec2(max(1.6, 4.5 * mpp));   // a lighthouse's lamp
  else if (kind > 7.5) size = vec2(max(0.8, 3.0 * mpp), max(2.6, 8.0 * mpp));   // a little wisp off a pot
  else if (kind > 6.5 || kind < 0.5) size = vec2(max(16.0, 5.0 * mpp), max(46.0, 17.0 * mpp));
  else if (kind > 5.5) size = vec2(max(2.4, 3.2 * mpp), max(110.0, 46.0 * mpp));
  else if (kind < 1.5) size = vec2(max(7.0, 5.0 * mpp), max(20.0, 12.0 * mpp));
  else if (kind < 2.5) size = vec2(max(0.6, 2.0 * mpp));
  else if (kind < 3.5) size = vec2(max(1.0, 2.8 * mpp));
  else if (kind > 4.5) size = vec2(max(1.4, 3.2 * mpp));
  else size = vec2(max(0.14, 1.4 * mpp));
  vec3 upV = normalize((viewMatrix * vec4(0.0, 1.0, 0.0, 0.0)).xyz);
  vec3 c = cross(upV, normalize(-base.xyz));
  vec3 rightV = length(c) > 1e-4 ? normalize(c) : vec3(1.0, 0.0, 0.0);
  float lift = kind < 1.5 || (kind > 5.5 && kind < 8.5) ? 0.0 : 0.5;  // (plumes and beams stand on their spot; lights hang about it)
  vec3 p = base.xyz + rightV * position.x * size.x + upV * (position.y - lift) * size.y;
  vUv = position.xy; vKind = kind; vSeed = iInfo.y; vFade = iInfo.z; vDist = length(p); vPx = size.x / mpp;
  gl_Position = projectionMatrix * vec4(p, 1.0);
  #include <logdepthbuf_vertex>
}`;
  const BEACON_FS = `
#include <logdepthbuf_pars_fragment>
${COMMON_FS}
uniform float uDark;
varying vec2 vUv; varying float vKind; varying float vSeed; varying float vDist; varying float vFade; varying float vPx;
void main() {
  #include <logdepthbuf_fragment>
  float b = bayer4(gl_FragCoord.xy);
  vec3 col;
  if (vKind > 5.5 && vKind < 6.5) {
    // a pale beam standing up out of the ground where a star fell: brightest low down, thinning to
    // nothing, slow bands of light climbing it; there by day, plainer by night
    float y = vUv.y, d = abs(vUv.x) * 2.0 / (0.6 - 0.38 * y);
    float band = 0.72 + 0.28 * sin(y * 22.0 - uTime * 1.7 + vSeed * 6.0);
    float dens = clamp(1.0 - d, 0.0, 1.0) * pow(1.0 - y, 1.3) * band * vFade * (0.6 + 0.4 * (1.0 - uDay));
    if (dens < b * 0.85 + 0.06) discard;
    col = mix(vec3(0.58, 0.76, 1.0), vec3(0.93, 0.97, 1.0), clamp(1.0 - d * 1.4, 0.0, 1.0));
    col = mix(col, uFog, clamp(vDist / uFogRange.y, 0.0, 1.0) * 0.35);
  } else if (vKind < 1.5 || (vKind > 6.5 && vKind < 8.5)) {
    // a plume: a thin thread out of the chimney that billows as it rises, drifts
    // off with the wind and thins to nothing; puffs roll upwards through it
    // (out of a hermit's tower it comes purple; off a hermit's pot, a wisp of green)
    float brew = step(7.5, vKind);
    float mage = step(6.5, vKind) * (1.0 - brew);
    float steam = step(0.5, vKind) * (1.0 - mage);
    float y = vUv.y;
    float side = vSeed > 0.5 ? 1.0 : -1.0;
    float c = side * 0.3 * pow(y, 1.6) + sin(y * 5.0 - uTime * 0.6 + vSeed * 7.0) * 0.035 * y;
    float r = 0.035 + 0.3 * pow(y, 0.8);
    float d = abs(vUv.x - c) / r;
    vec2 q = vec2(vUv.x * 5.0, y * 9.0 - uTime * (steam > 0.5 ? 0.5 : 0.35) + vSeed * 13.0);
    vec2 i = floor(q), f = fract(q); f = f * f * (3.0 - 2.0 * f);
    float n = mix(mix(hsh(i), hsh(i + vec2(1.0, 0.0)), f.x), mix(hsh(i + vec2(0.0, 1.0)), hsh(i + vec2(1.0, 1.0)), f.x), f.y);
    float dens = clamp(1.0 - d * d, 0.0, 1.0) * pow(1.0 - y, 1.2) * (0.45 + 0.9 * n) * vFade;
    // steam is wisps, not a column
    if (steam > 0.5) dens *= clamp(n * 1.6 - 0.35, 0.0, 1.0) * 0.8;
    // far off, only a few pixels wide: a soft column is all that can be seen
    float farK = clamp((10.0 - vPx) / 6.0, 0.0, 1.0);
    float cf = side * 0.22 * y * y + sin(y * 6.5 - uTime * 0.9 + vSeed * 5.0) * 0.1 * y;
    dens = mix(dens, clamp(1.0 - abs(vUv.x - cf) / (0.14 + 0.2 * y), 0.0, 1.0) * pow(1.0 - y, 0.75) * (0.8 + 0.35 * n) * vFade, farK);
    float vis = mix(smoothstep(0.12, 0.55, uDay), 0.3 + 0.7 * uDay, steam);
    if (dens * 1.5 * vis < b * 0.85 + 0.08) discard;
    vec3 sm = mix(mix(mix(vec3(0.66, 0.66, 0.68), vec3(0.94, 0.95, 0.97), steam), vec3(0.66, 0.46, 0.92), mage), vec3(0.7, 0.92, 0.56), brew);
    sm *= 0.82 + 0.3 * n;
    sm = mix(sm * 0.4, sm, uDay);
    col = applyFog(sm, vDist * 0.8, b);
  } else {
    // a light: only once it gets dark; one or two pixels, cutting through the haze
    if (uDark < 0.5 && uDay > 0.3) discard;
    // a household's window goes dark when it goes to bed (an inn's or a hall's never does)
    if (vKind > 1.5 && vKind < 2.5 && vSeed < uLate * 0.8) discard;
    vec2 q = vUv - vec2(0.0, 0.5);
    if (vPx > 3.0 && length(q) > 0.5) discard;

    float fl = vKind > 2.5 && vKind < 3.5 ? 0.78 + 0.22 * sin(uTime * 11.0 + vSeed * 9.0) : 1.0;
    col = (vKind > 2.5 && vKind < 3.5 ? vec3(1.0, 0.6, 0.24) : vec3(1.0, 0.8, 0.44)) * fl;
    // a fallen star: cold blue, breathing slowly, the wrong colour for any fire
    if (vKind > 4.5 && vKind < 8.5) col = vec3(0.68, 0.84, 1.0) * (0.82 + 0.18 * sin(uTime * 1.3 + vSeed * 6.0));
    // a lighthouse: its lamp turning, a flash every few seconds as the beam comes round to you
    if (vKind > 8.5) { float fl2 = pow(max(0.0, cos(uTime * 0.85 + vSeed * 6.0)), 10.0); col = vec3(1.0, 0.93, 0.72) * (0.45 + 0.75 * fl2); if (vPx > 3.0 && length(q) > 0.25 + 0.25 * fl2) discard; }
    col = mix(col, uFog, clamp(vDist / uFogRange.y, 0.0, 1.0) * 0.55);
    if (vFade < b) discard;
  }
  gl_FragColor = vec4(col, 1.0);
}`;

