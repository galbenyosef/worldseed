// index-inline-2 109 — math
// Lines 56335-56693 of readable/index-inline-2.pretty.js (statement-aligned).
  const WX_LOW =
    typeof matchMedia !== "undefined" &&
    (matchMedia("(pointer: coarse)").matches ||
      Math.min(screen.width, screen.height) < 700);
  const WX_KEYS = [
    "cloud",
    "rain",
    "snow",
    "precip",
    "storm",
    "fog",
    "heat",
    "wind",
    "windE",
    "windN",
  ];
  const DROP_VS = `
#include <common>
#include <logdepthbuf_pars_vertex>
uniform float uTime; uniform float uAmt; uniform float uEye; uniform float uShelter; uniform vec2 uOff; uniform vec2 uWind; uniform float uSnowy;
attribute vec4 aSeed; attribute float aEnd;
varying float vOn;
void main() {
  // rain: a box of streaks 28 m across round you, falling 9-11 m/s; snow: flakes drifting down, swaying
  float BX = mix(28.0, 22.0, uSnowy), BY = mix(18.0, 12.0, uSnowy);
  float sp = mix(8.5 + aSeed.w * 2.5, 0.8 + aSeed.w * 0.7, uSnowy);
  vec2 sway = uSnowy * vec2(sin(uTime * 0.9 + aSeed.y * 31.0), cos(uTime * 0.7 + aSeed.x * 27.0)) * 0.4;
  vec2 xz = (fract(aSeed.xz + (uWind * uTime * mix(1.0, 0.6, uSnowy) - uOff) / BX) - 0.5) * BX + sway;
  float y = fract(aSeed.y - uTime * sp / BY) * BY - BY * 0.3;
  vec3 p = vec3(xz.x, uEye + y, xz.y);
  // (a raindrop seen for a twentieth of a second is a streak along its fall)
  p -= vec3(uWind.x, -sp, uWind.y) * 0.075 * aEnd * (1.0 - uSnowy);
  vOn = step(aSeed.w, uAmt) * step(uShelter, length(xz));
  vec4 mv = viewMatrix * vec4(p, 1.0);
  gl_Position = projectionMatrix * mv;
  gl_PointSize = clamp(14.0 / max(0.5, -mv.z), 1.0, 2.6);
  if (vOn < 0.5) gl_Position = vec4(2.0, 2.0, 2.0, 1.0);
  #include <logdepthbuf_vertex>
}`;
  const DROP_FS = `
#include <logdepthbuf_pars_fragment>
uniform float uLight; uniform float uFlash; uniform float uSnowy;
varying float vOn;
float m2(vec2 v) { return 2.0 * abs(v.x - v.y) + v.y; }
float bayer4(vec2 p) { vec2 a = mod(floor(p), 4.0); return (4.0 * m2(mod(a, 2.0)) + m2(floor(a * 0.5)) + 0.5) / 16.0; }
void main() {
  #include <logdepthbuf_fragment>
  if (vOn < 0.5 || (uSnowy < 0.5 && bayer4(gl_FragCoord.xy) > 0.78)) discard;
  vec3 c = uSnowy > 0.5 ? vec3(0.95, 0.96, 1.0) : vec3(0.62, 0.68, 0.78);
  gl_FragColor = vec4(c * (0.28 + 0.72 * uLight) + uFlash * 0.5, 1.0);
}`;

  Object.assign(GroundView.prototype, {
    // ---------- the falling stuff: built once, moved in the shader ----------
    makeDrops(snowy) {
      const T = this.T,
        n = snowy ? (WX_LOW ? 800 : 1500) : WX_LOW ? 1300 : 2600,
        per = snowy ? 1 : 2;
      const geo = new T.BufferGeometry();
      const seed = new Float32Array(n * per * 4),
        end = new Float32Array(n * per);
      let r = 0x2545f491;
      const rnd = () => {
        r ^= r << 13;
        r ^= r >>> 17;
        r ^= r << 5;
        return (r >>> 0) / 4294967296;
      };
      for (let i = 0; i < n; i++) {
        const s = [rnd(), rnd(), rnd(), rnd()];
        for (let k = 0; k < per; k++) {
          seed.set(s, (i * per + k) * 4);
          end[i * per + k] = k;
        }
      }
      geo.setAttribute(
        "position",
        new T.BufferAttribute(new Float32Array(n * per * 3), 3),
      );
      geo.setAttribute("aSeed", new T.BufferAttribute(seed, 4));
      geo.setAttribute("aEnd", new T.BufferAttribute(end, 1));
      const U = {
        uTime: { value: 0 },
        uAmt: { value: 0 },
        uEye: { value: 0 },
        uShelter: { value: 0 },
        uOff: { value: new T.Vector2() },
        uWind: { value: new T.Vector2() },
        uSnowy: { value: snowy ? 1 : 0 },
        uLight: { value: 1 },
        uFlash: this.uniforms.uFlash,
      };
      const mat = new T.ShaderMaterial({
        uniforms: U,
        vertexShader: DROP_VS,
        fragmentShader: DROP_FS,
        depthWrite: false,
      });
      const obj = snowy ? new T.Points(geo, mat) : new T.LineSegments(geo, mat);
      obj.frustumCulled = false;
      obj.renderOrder = 5;
      obj.visible = false;
      this.scene.add(obj);
      return obj;
    },

    // ---------- each frame, before the sky: what the weather is doing, and drawing it ----------
    stepWeather(dt, nowMs) {
      const P = this.planet,
        U = this.uniforms,
        S = this.skyU,
        V = this.view;
      if (!P || !V) return;
      const W =
        this.wx ||
        (this.wx = {
          at: -1e9,
          tgt: null,
          T: 10,
          snowCover: 0,
          wetGround: 0,
          off: [0, 0],
          prev: null,
          flashT: 9,
          boltT: 9,
        });
      const forced = this.wxForce || null;
      // what the sky is doing here, looked up now and then (it changes slowly)
      if (!this.journey && (nowMs - W.at > 700 || !W.tgt || forced)) {
        W.at = nowMs;
        const p = this.p,
          S2 = this._wxS || (this._wxS = {});
        this.ground.sample(p[0], p[1], p[2], 30, S2);
        const L0 = P.levels[0],
          coastKm = L0.grid.sample(L0.coast, p[0], p[1], p[2]);
        const lt = P.localTime(p[0], p[1], p[2], this.t),
          s = P.sunInBody(this.t);
        W.tgt = weatherAt(
          P,
          p,
          this.t,
          {
            T: S2.T,
            P: S2.P,
            coastKm,
            hour: lt.hours / lt.dayHours,
            up: s[0] * p[0] + s[1] * p[1] + s[2] * p[2],
          },
          W.tgt || {},
        );
        if (forced) Object.assign(W.tgt, forced);
        W.T = S2.T;
        // somewhere else altogether (a journey, a fall): the ground is as the weather has left it
        if (W.lastP && arcM(W.lastP, p, this.R) > 15000) {
          W.snowCover = W.tgt.snow * 0.6;
          W.wetGround = W.tgt.rain * 0.6;
          for (const k of WX_KEYS) W[k] = W.tgt[k];
        }
        W.lastP = p.slice();
        if (W.cloud == null) for (const k of WX_KEYS) W[k] = W.tgt[k];
      }
      // ease towards it: a shower comes on over half a minute and goes the same way
      const ease = 1 - Math.exp(-dt / (forced ? 0.3 : 8));
      for (const k of WX_KEYS) W[k] += ((W.tgt[k] || 0) - W[k]) * ease;
      // snow lies while it falls and goes when it is warm; the ground wets and dries
      W.snowCover = Math.max(
        0,
        Math.min(
          1,
          W.snowCover +
            dt *
              (W.snow * 0.006 -
                (W.T > 1.5 ? 0.0015 * Math.min(4, W.T - 1) : 0)),
        ),
      );
      W.wetGround = Math.max(
        0,
        Math.min(
          1,
          W.wetGround + dt * (W.rain > 0.1 ? W.rain * 0.012 : -0.0016),
        ),
      );
      const precip = W.journeyHide ? 0 : W.precip;
      U.uOvercast.value = Math.min(
        1,
        W.cloud * (0.55 + 0.45 * Math.min(1, precip * 1.6 + W.storm)),
      );
      S.uOvercast.value = U.uOvercast.value;
      U.uSnowCover.value = W.snowCover;
      U.uWetGround.value = W.wetGround;
      S.uHeat.value = W.heat;
      // where you have walked since, so the rain stays put in the air as you go through it
      const F = V.F;
      if (W.prev) {
        const d = [
          this.p[0] - W.prev[0],
          this.p[1] - W.prev[1],
          this.p[2] - W.prev[2],
        ];
        const e = (d[0] * F.e[0] + d[1] * F.e[1] + d[2] * F.e[2]) * this.R,
          n = (d[0] * F.n[0] + d[1] * F.n[1] + d[2] * F.n[2]) * this.R;
        if (Math.abs(e) < 50 && Math.abs(n) < 50) {
          W.off[0] = (W.off[0] + e) % 2800;
          W.off[1] = (W.off[1] - n) % 2800;
        }
      }
      W.prev = this.p.slice();
      // under a roof: none falls on you (the room's size), under a lean-to a little way round you
      if (!W.shAt || nowMs - W.shAt > 500) {
        W.shAt = nowMs;
        const room = this.roomAt ? this.roomAt() : null,
          sh = this.shelterAt ? this.shelterAt() : null;
        W.shelter = room
          ? Math.hypot(room.hx || 3, room.hz || 3) + 0.4
          : sh && sh.shelter
            ? 1.7
            : 0;
        W.indoors = !!room;
      }
      const nowS = nowMs / 1000,
        rain = this.journey ? 0 : W.rain,
        snow = this.journey ? 0 : W.snow;
      for (const [key, amt, snowy] of [
        ["rainObj", rain, false],
        ["snowObj", snow, true],
      ]) {
        if (amt < 0.02 && !this[key]) continue;
        const o = this[key] || (this[key] = this.makeDrops(snowy));
        o.visible = amt >= 0.02;
        if (!o.visible) continue;
        const u = o.material.uniforms;
        u.uTime.value = nowS;
        u.uAmt.value = Math.min(1, amt * 1.15);
        u.uEye.value = this.eyeY;
        u.uShelter.value = W.shelter;
        u.uOff.value.set(W.off[0], W.off[1]);
        u.uWind.value.set(W.windE * 0.3, -W.windN * 0.3);
        u.uLight.value = Math.max(U.uDay.value, 0.2 + 0.5 * U.uMoon.value);
      }
      // thunder and lightning: a bolt now and then, nearer in a bad storm; the flash at once, the
      // thunder as many seconds later as it was a third of a kilometre away
      W.flashT += dt;
      W.boltT += dt;
      if (
        !this.journey &&
        W.storm > 0.2 &&
        Math.random() < dt * W.storm * 0.13
      ) {
        const far = Math.random() ** (1.4 - W.storm * 0.6),
          az = Math.random() * Math.PI * 2;
        W.flashT = 0;
        W.boltT = 0;
        W.flashK = 0.65 - far * 0.45;
        S.uBolt.value.set(az, far, 0, 1);
        if (this.onThunder) this.onThunder(0.4 + far * 7, 1 - far * 0.7);
      }
      U.uFlash.value =
        W.flashT < 0.5
          ? (W.flashK || 0.5) *
            Math.max(0, 1 - W.flashT / 0.5) *
            (W.flashT < 0.06 || (W.flashT > 0.12 && W.flashT < 0.18) ? 1 : 0.35)
          : 0;
      S.uBolt.value.z = W.boltT;
      // the moons where they are, how full, and whether one is crossing the sun
      const moons = moonsAt(P, this.t),
        up = (v) => [
          v[0] * F.e[0] + v[1] * F.e[1] + v[2] * F.e[2],
          v[0] * F.u[0] + v[1] * F.u[1] + v[2] * F.u[2],
          -(v[0] * F.n[0] + v[1] * F.n[1] + v[2] * F.n[2]),
        ];
      let moonLight = 0,
        ecl = 0;
      const sunUp = U.uSun.value.y;
      S.uMoonN.value = moons.length;
      moons.forEach((m, k) => {
        const b = worldToBodyDir(P, this.t, m.dir),
          l = up(b);
        S.uMoons.value[k].set(l[0], l[1], l[2], m.r);
        S.uMoonCols.value[k].set(
          m.col[0],
          m.col[1],
          m.col[2],
          (m.seed % 97) * 0.37,
        );
        if (l[1] > 0)
          moonLight = Math.max(
            moonLight,
            m.lit * Math.min(1, l[1] * 4) * (m.r > 0.02 ? 1 : 0.7),
          );
        if (sunUp > -0.05) ecl = Math.max(ecl, m.cover);
      });
      this.eclipse = ecl;
      S.uEclipse.value = ecl;
      U.uMoon.value = moonLight * (1 - W.cloud * 0.8);
      S.uMoonLit.value = moonLight;
      // falling stars on a clear night (a night of them now and then); the lights at the pole
      const clear = 1 - Math.min(1, W.cloud * 1.3);
      const dayNum = this.dayNum || 0;
      S.uMeteor.value =
        clear *
        (0.03 +
          0.75 *
            (forced && forced.meteor != null
              ? forced.meteor
              : meteorNight(P, dayNum)));
      const lat =
        (Math.asin(Math.max(-1, Math.min(1, this.p[1]))) * 180) / Math.PI;
      S.uAurora.value =
        clear *
        (forced && forced.aurora != null
          ? forced.aurora
          : auroraAt(P, lat, dayNum));
      if (S.uAurora.value > 0) {
        // which way the pole is, along the ground
        const pole = up([0, lat >= 0 ? 1 : -1, 0]);
        S.uAuroraDir.value.set(pole[0], 0, pole[2]);
      }
    },
    // how far you can see and the colour of the air, as the weather has it (called from updateSky)
    weatherAir(vis, fog) {
      const W = this.wx;
      if (!W) return { near: vis * 0.06, far: vis, fog, skyFog: 0 };
      const k = Math.min(
        1,
        Math.max(W.fog, W.rain * 0.6 + W.storm * 0.2, W.snow * 0.85) +
          W.heat * 0.25,
      );
      const far = Math.max(110, vis * Math.exp(-5.8 * k));
      const day = this.uniforms.uDay.value;
      const grey = [0.66 * day + 0.05, 0.68 * day + 0.05, 0.72 * day + 0.07];
      const mixK = Math.min(1, k * 0.9 + W.cloud * 0.3);
      let col = [0, 1, 2].map((i) => fog[i] + (grey[i] - fog[i]) * mixK);
      if (W.heat > 0)
        col = col.map((c, i) => c + ([0.92, 0.82, 0.62][i] - c) * W.heat * 0.3);
      return {
        near: far * 0.06,
        far,
        fog: col,
        skyFog:
          Math.max(0, Math.min(1, (k - 0.35) / 0.55)) * (W.fog > 0.3 ? 1 : 0.6),
      };
    },
  });

  // ---- view/foes.js ----
  // ============================================================
  // FOES — the dead in the tombs. They lie on their shelves, wrapped, for as
  // long as nobody robs them. Take their grave goods and they sit up one by
  // one, stiff as boards, step down and come for you, slow and patient, arms
  // out. Most are common dead; some tombs hold champions wrapped in blue (swift,
  // stone-wrapped or fireless); a few were made for a lord, who is slow to rise
  // and terrible when up. They wind up before they strike (step back and the
  // blow falls short), a torch in your face makes most of them falter, and by
  // day they will not come into the light at the cave's mouth. Kill them and
  // they fall back and crumble, leaving what they were buried with.
  // Everything here is in cave metres (x across the mouth, y up, z out).
  // ============================================================

  // the dead's bodies move like the living's, on the same bones, but every joint's angle comes from here
