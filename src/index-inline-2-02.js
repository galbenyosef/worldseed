// index-inline-2 02 — out
// Lines 354-704 of readable/index-inline-2.pretty.js (statement-aligned).
  function fbmPart(n, x, y, z, o0, o1, lac = 2.0, gain = 0.5) {
    let sum = 0,
      amp = Math.pow(gain, o0),
      f = Math.pow(lac, o0);
    for (let o = o0; o < o1; o++) {
      sum += amp * n(x * f + o * 19.19, y * f - o * 7.31, z * f + o * 3.77);
      amp *= gain;
      f *= lac;
    }
    return sum;
  }
  function fbmNorm(oct, gain = 0.5) {
    let norm = 0,
      amp = 1;
    for (let o = 0; o < oct; o++) {
      norm += amp;
      amp *= gain;
    }
    return norm;
  }

  // Ridged multifractal: sharp crests, soft valleys. Returns ~[0, 1]
  function ridged(n, x, y, z, oct, lac = 2.1, gain = 0.55) {
    let sum = 0,
      amp = 1,
      f = 1,
      w = 1,
      norm = 0;
    for (let o = 0; o < oct; o++) {
      let v =
        1 - Math.abs(n(x * f + o * 11.7, y * f + o * 5.3, z * f - o * 9.1));
      v *= v;
      v *= w;
      w = Math.min(1, Math.max(0, v * 1.6));
      sum += v * amp;
      norm += amp;
      amp *= gain;
      f *= lac;
    }
    return sum / norm;
  }

  function smoothstep(a, b, x) {
    const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
    return t * t * (3 - 2 * t);
  }
  function clamp(x, a, b) {
    return x < a ? a : x > b ? b : x;
  }
  function lerp(a, b, t) {
    return a + (b - a) * t;
  }

  // ---- world/cube.js ----
  // ============================================================
  // CUBE-SPHERE GRID
  // Six square faces pushed out onto the sphere (equi-angular warp keeps
  // cells close to equal size). Each face carries a 1-cell apron copied
  // from its neighbours, so filters and bilinear sampling never see a seam.
  // Levels halve N, like a quadtree: 256 → 128 → 64 → 32.
  // Body space: +Y is the north pole, longitude 0 faces +Z.
  // ============================================================

  const QPI = Math.PI / 4;
  const IQPI = 4 / Math.PI;

  // cube-face coordinates (a, b) in [-1,1] -> point on the cube surface
  function faceToCube(f, a, b, out) {
    switch (f) {
      case 0:
        out[0] = 1;
        out[1] = b;
        out[2] = -a;
        break; // +X
      case 1:
        out[0] = -1;
        out[1] = b;
        out[2] = a;
        break; // -X
      case 2:
        out[0] = a;
        out[1] = 1;
        out[2] = -b;
        break; // +Y (north)
      case 3:
        out[0] = a;
        out[1] = -1;
        out[2] = b;
        break; // -Y (south)
      case 4:
        out[0] = a;
        out[1] = b;
        out[2] = 1;
        break; // +Z
      default:
        out[0] = -a;
        out[1] = b;
        out[2] = -1;
        break; // -Z
    }
    return out;
  }

  // direction -> face and cube coords (a,b); writes into out = [f, a, b]
  function cubeCoords(x, y, z, out) {
    const ax = x < 0 ? -x : x,
      ay = y < 0 ? -y : y,
      az = z < 0 ? -z : z;
    if (ax >= ay && ax >= az) {
      if (x > 0) {
        out[0] = 0;
        out[1] = -z / x;
        out[2] = y / x;
      } else {
        out[0] = 1;
        out[1] = -z / x;
        out[2] = -y / x;
      }
    } else if (ay >= az) {
      if (y > 0) {
        out[0] = 2;
        out[1] = x / y;
        out[2] = -z / y;
      } else {
        out[0] = 3;
        out[1] = -x / y;
        out[2] = -z / y;
      }
    } else {
      if (z > 0) {
        out[0] = 4;
        out[1] = x / z;
        out[2] = y / z;
      } else {
        out[0] = 5;
        out[1] = x / z;
        out[2] = -y / z;
      }
    }
    return out;
  }

  const _cc = [0, 0, 0];
  const _p = [0, 0, 0];

  class CubeGrid {
    constructor(N) {
      this.N = N;
      const S = (this.S = N + 2);
      this.FS = S * S;
      this.count = 6 * this.FS;
      this.dir = new Float32Array(this.count * 3);
      this.canon = new Int32Array(this.count);
      this.area = new Float32Array(this.count);
      this.real = new Int32Array(6 * N * N);
      this.cellKm = 0; // set by planet
      let r = 0;
      for (let f = 0; f < 6; f++) {
        for (let j = -1; j <= N; j++) {
          const b = Math.tan((((j + 0.5) / N) * 2 - 1) * QPI);
          for (let i = -1; i <= N; i++) {
            const a = Math.tan((((i + 0.5) / N) * 2 - 1) * QPI);
            faceToCube(f, a, b, _p);
            const L = Math.hypot(_p[0], _p[1], _p[2]);
            const idx = this.index(f, i, j);
            this.dir[idx * 3] = _p[0] / L;
            this.dir[idx * 3 + 1] = _p[1] / L;
            this.dir[idx * 3 + 2] = _p[2] / L;
            if (i >= 0 && j >= 0 && i < N && j < N) this.real[r++] = idx;
          }
        }
      }
      // apron -> canonical real cell
      for (let idx = 0; idx < this.count; idx++) this.canon[idx] = idx;
      for (let f = 0; f < 6; f++) {
        for (let j = -1; j <= N; j++) {
          for (let i = -1; i <= N; i++) {
            if (i >= 0 && j >= 0 && i < N && j < N) continue;
            const idx = this.index(f, i, j);
            this.canon[idx] = this.locate(
              this.dir[idx * 3],
              this.dir[idx * 3 + 1],
              this.dir[idx * 3 + 2],
            );
          }
        }
      }
      // solid angle per real cell
      const c = [
        [0, 0, 0],
        [0, 0, 0],
        [0, 0, 0],
        [0, 0, 0],
      ];
      let total = 0;
      for (let f = 0; f < 6; f++) {
        for (let j = 0; j < N; j++) {
          for (let i = 0; i < N; i++) {
            for (let k = 0; k < 4; k++) {
              const ci = i + (k & 1),
                cj = j + (k >> 1);
              faceToCube(
                f,
                Math.tan(((ci / N) * 2 - 1) * QPI),
                Math.tan(((cj / N) * 2 - 1) * QPI),
                _p,
              );
              const L = Math.hypot(_p[0], _p[1], _p[2]);
              c[k][0] = _p[0] / L;
              c[k][1] = _p[1] / L;
              c[k][2] = _p[2] / L;
            }
            const A = triArea(c[0], c[1], c[3]) + triArea(c[0], c[3], c[2]);
            this.area[this.index(f, i, j)] = A;
            total += A;
          }
        }
      }
      const k = (4 * Math.PI) / total;
      for (let q = 0; q < this.real.length; q++) this.area[this.real[q]] *= k;
    }

    index(f, i, j) {
      return f * this.FS + (j + 1) * this.S + (i + 1);
    }

    // nearest real cell for a direction (need not be normalised)
    locate(x, y, z) {
      cubeCoords(x, y, z, _cc);
      const N = this.N;
      let i = Math.floor((Math.atan(_cc[1]) * IQPI + 1) * 0.5 * N);
      let j = Math.floor((Math.atan(_cc[2]) * IQPI + 1) * 0.5 * N);
      if (i < 0) i = 0;
      else if (i >= N) i = N - 1;
      if (j < 0) j = 0;
      else if (j >= N) j = N - 1;
      return _cc[0] * this.FS + (j + 1) * this.S + (i + 1);
    }

    // bilinear sample of a field with a valid apron
    sample(field, x, y, z) {
      cubeCoords(x, y, z, _cc);
      const N = this.N,
        S = this.S;
      let gx = (Math.atan(_cc[1]) * IQPI + 1) * 0.5 * N - 0.5;
      let gy = (Math.atan(_cc[2]) * IQPI + 1) * 0.5 * N - 0.5;
      if (gx < -1) gx = -1;
      else if (gx > N - 1e-4) gx = N - 1e-4;
      if (gy < -1) gy = -1;
      else if (gy > N - 1e-4) gy = N - 1e-4;
      const i0 = Math.floor(gx),
        j0 = Math.floor(gy);
      const fx = gx - i0,
        fy = gy - j0;
      const base = _cc[0] * this.FS + (j0 + 1) * S + (i0 + 1);
      const a = field[base],
        b = field[base + 1],
        c = field[base + S],
        d = field[base + S + 1];
      return (a + (b - a) * fx) * (1 - fy) + (c + (d - c) * fx) * fy;
    }

    fillApron(field) {
      const N = this.N;
      for (let f = 0; f < 6; f++) {
        for (let j = -1; j <= N; j++) {
          for (let i = -1; i <= N; i++) {
            if (i >= 0 && j >= 0 && i < N && j < N) continue;
            const idx = this.index(f, i, j);
            field[idx] = field[this.canon[idx]];
          }
        }
      }
    }
  }

  function triArea(a, b, c) {
    const ux = b[0] - a[0],
      uy = b[1] - a[1],
      uz = b[2] - a[2];
    const vx = c[0] - a[0],
      vy = c[1] - a[1],
      vz = c[2] - a[2];
    const cx = uy * vz - uz * vy,
      cy = uz * vx - ux * vz,
      cz = ux * vy - uy * vx;
    return 0.5 * Math.hypot(cx, cy, cz);
  }

  // Average a finer field (grid N) into a coarser grid (N/2)
  function downsample(fine, gF, coarse, gC) {
    const N = gC.N;
    for (let f = 0; f < 6; f++) {
      for (let j = 0; j < N; j++) {
        for (let i = 0; i < N; i++) {
          const a = gF.index(f, 2 * i, 2 * j);
          coarse[gC.index(f, i, j)] =
            0.25 *
            (fine[a] + fine[a + 1] + fine[a + gF.S] + fine[a + gF.S + 1]);
        }
      }
    }
    gC.fillApron(coarse);
  }

  // Bilinear upsample from grid N/2 (valid apron) to grid N, apron included.
  // Both grids share one face parameterisation, so the weights are fixed.
  function upsample(coarse, gC, fine, gF) {
    const N = gF.N,
      S = gF.S,
      Sc = gC.S;
    for (let f = 0; f < 6; f++) {
      for (let j = -1; j <= N; j++) {
        const gy = j / 2 - 0.25,
          j0 = Math.floor(gy),
          fy = gy - j0;
        for (let i = -1; i <= N; i++) {
          const gx = i / 2 - 0.25,
            i0 = Math.floor(gx),
            fx = gx - i0;
          const b = f * gC.FS + (j0 + 1) * Sc + (i0 + 1);
          const a00 = coarse[b],
            a10 = coarse[b + 1],
            a01 = coarse[b + Sc],
            a11 = coarse[b + Sc + 1];
          fine[f * gF.FS + (j + 1) * S + (i + 1)] =
            (a00 + (a10 - a00) * fx) * (1 - fy) + (a01 + (a11 - a01) * fx) * fy;
        }
      }
    }
  }

  // Max-pool (keeps peaks visible at coarse levels)
  function downsampleMax(fine, gF, coarse, gC) {
    const N = gC.N;
    for (let f = 0; f < 6; f++) {
      for (let j = 0; j < N; j++) {
        for (let i = 0; i < N; i++) {
          const a = gF.index(f, 2 * i, 2 * j);
          coarse[gC.index(f, i, j)] = Math.max(
            fine[a],
            fine[a + 1],
            fine[a + gF.S],
            fine[a + gF.S + 1],
          );
        }
      }
    }
    gC.fillApron(coarse);
  }

