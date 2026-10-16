/**
 * Lenna Mathematical & Image Matrix Engine
 * Core matrix operations, spatial convolutions, color space conversions, and image buffer utilities.
 */

export interface RGB {
  r: number;
  g: number;
  b: number;
}

export interface RGBA extends RGB {
  a: number;
}

export interface HSL {
  h: number; // 0..360
  s: number; // 0..1
  l: number; // 0..1
}

export interface CMYK {
  c: number; // 0..1
  m: number; // 0..1
  y: number; // 0..1
  k: number; // 0..1
}

/**
 * Creates an empty ImageData buffer of specified dimensions.
 */
export function createImageBuffer(width: number, height: number): ImageData {
  if (typeof ImageData !== 'undefined') {
    return new ImageData(width, height);
  }
  // Fallback for SSR or non-standard environments
  return {
    width,
    height,
    data: new Uint8ClampedArray(width * height * 4),
    colorSpace: 'srgb',
  } as unknown as ImageData;
}

/**
 * Deep clones an ImageData instance.
 */
export function cloneImageData(source: ImageData): ImageData {
  const dest = createImageBuffer(source.width, source.height);
  dest.data.set(source.data);
  return dest;
}

/**
 * Standard Rec. 709 Luminance calculation
 */
export function rgbToLuminance(r: number, g: number, b: number): number {
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/**
 * Clamps a number to min and max boundaries.
 */
export function clamp(val: number, min = 0, max = 255): number {
  return Math.min(max, Math.max(min, val));
}

/**
 * Linear interpolation between a and b.
 */
export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

/**
 * Parses Hex color code (#fff or #ffffff) to RGB.
 */
export function hexToRgb(hex: string): RGB {
  let c = hex.replace(/^#/, '');
  if (c.length === 3) {
    c = c.split('').map((x) => x + x).join('');
  }
  const num = parseInt(c, 16);
  if (isNaN(num)) return { r: 0, g: 0, b: 0 };
  return {
    r: (num >> 16) & 255,
    g: (num >> 8) & 255,
    b: num & 255,
  };
}

/**
 * Converts RGB [0..255] to Hex string (#rrggbb)
 */
export function rgbToHex(r: number, g: number, b: number): string {
  const toHex = (n: number) => clamp(Math.round(n), 0, 255).toString(16).padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

/**
 * RGB [0..255] to HSL [0..360, 0..1, 0..1]
 */
export function rgbToHsl(r: number, g: number, b: number): HSL {
  const rf = r / 255;
  const gf = g / 255;
  const bf = b / 255;
  const max = Math.max(rf, gf, bf);
  const min = Math.min(rf, gf, bf);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case rf:
        h = (gf - bf) / d + (gf < bf ? 6 : 0);
        break;
      case gf:
        h = (bf - rf) / d + 2;
        break;
      case bf:
        h = (rf - gf) / d + 4;
        break;
    }
    h *= 60;
  }

  return { h, s, l };
}

/**
 * HSL [0..360, 0..1, 0..1] to RGB [0..255]
 */
export function hslToRgb(h: number, s: number, l: number): RGB {
  h = ((h % 360) + 360) % 360;
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;
  let rf = 0, gf = 0, bf = 0;

  if (h < 60) {
    rf = c; gf = x; bf = 0;
  } else if (h < 120) {
    rf = x; gf = c; bf = 0;
  } else if (h < 180) {
    rf = 0; gf = c; bf = x;
  } else if (h < 240) {
    rf = 0; gf = x; bf = c;
  } else if (h < 300) {
    rf = x; gf = 0; bf = c;
  } else {
    rf = c; gf = 0; bf = x;
  }

  return {
    r: Math.round((rf + m) * 255),
    g: Math.round((gf + m) * 255),
    b: Math.round((bf + m) * 255),
  };
}

/**
 * RGB [0..255] to CMYK [0..1]
 */
export function rgbToCmyk(r: number, g: number, b: number): CMYK {
  const rf = r / 255;
  const gf = g / 255;
  const bf = b / 255;
  const k = 1 - Math.max(rf, gf, bf);
  if (k === 1) {
    return { c: 0, m: 0, y: 0, k: 1 };
  }
  const c = (1 - rf - k) / (1 - k);
  const m = (1 - gf - k) / (1 - k);
  const y = (1 - bf - k) / (1 - k);
  return { c, m, y, k };
}

/**
 * CMYK [0..1] to RGB [0..255]
 */
export function cmykToRgb(c: number, m: number, y: number, k: number): RGB {
  const r = 255 * (1 - c) * (1 - k);
  const g = 255 * (1 - m) * (1 - k);
  const b = 255 * (1 - y) * (1 - k);
  return {
    r: clamp(Math.round(r)),
    g: clamp(Math.round(g)),
    b: clamp(Math.round(b)),
  };
}

/**
 * 4x5 Color Matrix Transformation:
 * Multiplies every RGBA pixel vector [R, G, B, A, 1]^T by a 4x5 matrix:
 * [ m00, m01, m02, m03, m04 ] [R]
 * [ m10, m11, m12, m13, m14 ] [G]
 * [ m20, m21, m22, m23, m24 ] [B]
 * [ m30, m31, m32, m33, m34 ] [A]
 *                             [1]
 */
export type ColorMatrix = [
  number, number, number, number, number,
  number, number, number, number, number,
  number, number, number, number, number,
  number, number, number, number, number
];

export const IDENTITY_COLOR_MATRIX: ColorMatrix = [
  1, 0, 0, 0, 0,
  0, 1, 0, 0, 0,
  0, 0, 1, 0, 0,
  0, 0, 0, 1, 0,
];

export function applyColorMatrix(
  source: ImageData,
  matrix: ColorMatrix,
  strength = 1.0
): ImageData {
  const output = createImageBuffer(source.width, source.height);
  const src = source.data;
  const dst = output.data;
  const len = src.length;

  const [
    m00, m01, m02, m03, m04,
    m10, m11, m12, m13, m14,
    m20, m21, m22, m23, m24,
    m30, m31, m32, m33, m34,
  ] = matrix;

  const blend = clamp(strength, 0, 1);
  const invBlend = 1 - blend;

  for (let i = 0; i < len; i += 4) {
    const r = src[i]!;
    const g = src[i + 1]!;
    const b = src[i + 2]!;
    const a = src[i + 3]!;

    const tr = m00 * r + m01 * g + m02 * b + m03 * a + m04;
    const tg = m10 * r + m11 * g + m12 * b + m13 * a + m14;
    const tb = m20 * r + m21 * g + m22 * b + m23 * a + m24;
    const ta = m30 * r + m31 * g + m32 * b + m33 * a + m34;

    dst[i] = clamp(invBlend * r + blend * tr);
    dst[i + 1] = clamp(invBlend * g + blend * tg);
    dst[i + 2] = clamp(invBlend * b + blend * tb);
    dst[i + 3] = clamp(invBlend * a + blend * ta);
  }

  return output;
}

/**
 * 2D Spatial Convolution Kernel
 * Supports NxN odd-sized kernels (3x3, 5x5, 7x7).
 */
export function applyConvolution(
  source: ImageData,
  kernel: number[][],
  divisor?: number,
  bias = 0,
  preserveAlpha = true
): ImageData {
  const { width, height } = source;
  const output = createImageBuffer(width, height);
  const src = source.data;
  const dst = output.data;

  const kSize = kernel.length;
  const half = Math.floor(kSize / 2);

  // Compute divisor if not provided
  let div = divisor;
  if (div === undefined) {
    div = 0;
    for (let r = 0; r < kSize; r++) {
      for (let c = 0; c < kSize; c++) {
        div += kernel[r]![c]!;
      }
    }
    if (div === 0) div = 1;
  }

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let rSum = 0;
      let gSum = 0;
      let bSum = 0;
      let aSum = 0;

      for (let ky = 0; ky < kSize; ky++) {
        const sy = clamp(y + ky - half, 0, height - 1);
        const row = kernel[ky]!;

        for (let kx = 0; kx < kSize; kx++) {
          const sx = clamp(x + kx - half, 0, width - 1);
          const weight = row[kx]!;
          const sIdx = (sy * width + sx) * 4;

          rSum += src[sIdx]! * weight;
          gSum += src[sIdx + 1]! * weight;
          bSum += src[sIdx + 2]! * weight;
          if (!preserveAlpha) {
            aSum += src[sIdx + 3]! * weight;
          }
        }
      }

      const dIdx = (y * width + x) * 4;
      dst[dIdx] = clamp(rSum / div + bias);
      dst[dIdx + 1] = clamp(gSum / div + bias);
      dst[dIdx + 2] = clamp(bSum / div + bias);
      dst[dIdx + 3] = preserveAlpha ? src[dIdx + 3]! : clamp(aSum / div + bias);
    }
  }

  return output;
}

/**
 * Fast 2-pass 1D separable Gaussian Blur (O(radius * N) instead of O(radius^2 * N))
 */
export function applyFastGaussianBlur(source: ImageData, radius: number): ImageData {
  if (radius <= 0) return cloneImageData(source);

  const { width, height } = source;
  const src = source.data;
  const temp = new Uint8ClampedArray(src.length);
  const dst = new Uint8ClampedArray(src.length);

  const r = Math.max(1, Math.round(radius));
  const sigma = radius / 2;
  const kernelSize = 2 * r + 1;
  const kernel = new Float32Array(kernelSize);

  let sum = 0;
  for (let i = -r; i <= r; i++) {
    const val = Math.exp(-(i * i) / (2 * sigma * sigma));
    kernel[i + r] = val;
    sum += val;
  }
  for (let i = 0; i < kernelSize; i++) {
    kernel[i] = (kernel[i] ?? 0) / sum;
  }

  // Pass 1: Horizontal Blur (src -> temp)
  for (let y = 0; y < height; y++) {
    const rowOffset = y * width * 4;
    for (let x = 0; x < width; x++) {
      let rSum = 0, gSum = 0, bSum = 0, aSum = 0;
      for (let k = -r; k <= r; k++) {
        const sx = clamp(x + k, 0, width - 1);
        const w = kernel[k + r]!;
        const idx = rowOffset + sx * 4;
        rSum += src[idx]! * w;
        gSum += src[idx + 1]! * w;
        bSum += src[idx + 2]! * w;
        aSum += src[idx + 3]! * w;
      }
      const dIdx = rowOffset + x * 4;
      temp[dIdx] = rSum;
      temp[dIdx + 1] = gSum;
      temp[dIdx + 2] = bSum;
      temp[dIdx + 3] = aSum;
    }
  }

  // Pass 2: Vertical Blur (temp -> dst)
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let rSum = 0, gSum = 0, bSum = 0, aSum = 0;
      for (let k = -r; k <= r; k++) {
        const sy = clamp(y + k, 0, height - 1);
        const w = kernel[k + r]!;
        const idx = (sy * width + x) * 4;
        rSum += temp[idx]! * w;
        gSum += temp[idx + 1]! * w;
        bSum += temp[idx + 2]! * w;
        aSum += temp[idx + 3]! * w;
      }
      const dIdx = (y * width + x) * 4;
      dst[dIdx] = rSum;
      dst[dIdx + 1] = gSum;
      dst[dIdx + 2] = bSum;
      dst[dIdx + 3] = aSum;
    }
  }

  const out = createImageBuffer(width, height);
  out.data.set(dst);
  return out;
}

/**
 * Bilinear sampling from ImageData with normalized coordinates (u, v in 0..1)
 */
export function sampleBilinear(source: ImageData, u: number, v: number): RGBA {
  const { width, height, data } = source;
  const x = u * (width - 1);
  const y = v * (height - 1);

  const x0 = clamp(Math.floor(x), 0, width - 1);
  const x1 = clamp(x0 + 1, 0, width - 1);
  const y0 = clamp(Math.floor(y), 0, height - 1);
  const y1 = clamp(y0 + 1, 0, height - 1);

  const fx = x - x0;
  const fy = y - y0;

  const idx00 = (y0 * width + x0) * 4;
  const idx10 = (y0 * width + x1) * 4;
  const idx01 = (y1 * width + x0) * 4;
  const idx11 = (y1 * width + x1) * 4;

  const w00 = (1 - fx) * (1 - fy);
  const w10 = fx * (1 - fy);
  const w01 = (1 - fx) * fy;
  const w11 = fx * fy;

  return {
    r: data[idx00]! * w00 + data[idx10]! * w10 + data[idx01]! * w01 + data[idx11]! * w11,
    g: data[idx00 + 1]! * w00 + data[idx10 + 1]! * w10 + data[idx01 + 1]! * w01 + data[idx11 + 1]! * w11,
    b: data[idx00 + 2]! * w00 + data[idx10 + 2]! * w10 + data[idx01 + 2]! * w01 + data[idx11 + 2]! * w11,
    a: data[idx00 + 3]! * w00 + data[idx10 + 3]! * w10 + data[idx01 + 3]! * w01 + data[idx11 + 3]! * w11,
  };
}

/**
 * Fast pseudo-random number generator with deterministic seed.
 */
export function seededRandom(seed: number): () => number {
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}
