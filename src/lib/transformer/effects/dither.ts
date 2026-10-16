import type { EffectDefinition } from '../types';
import {
  clamp,
  createImageBuffer,
  rgbToLuminance,
  hexToRgb,
} from '../matrix';

const BAYER_4X4 = [
  [0, 8, 2, 10],
  [12, 4, 14, 6],
  [3, 11, 1, 9],
  [15, 7, 13, 5],
].map((row) => row.map((v) => (v / 16) * 255));

const BAYER_8X8 = [
  [0, 32, 8, 40, 2, 34, 10, 42],
  [48, 16, 56, 24, 50, 18, 58, 26],
  [12, 44, 4, 36, 14, 46, 6, 38],
  [60, 28, 52, 20, 62, 30, 54, 22],
  [3, 35, 11, 43, 1, 33, 9, 41],
  [51, 19, 59, 27, 49, 17, 57, 25],
  [15, 47, 7, 39, 13, 45, 5, 37],
  [63, 31, 55, 23, 61, 29, 53, 21],
].map((row) => row.map((v) => (v / 64) * 255));

export const ditherEffects: EffectDefinition[] = [
  // 13. Bayer 4×4 Ordered Matrix Dither
  {
    id: 'bayer-4x4',
    name: 'Bayer 4×4 Ordered Matrix Dither',
    category: 'dither',
    description: 'Hardware ordered thresholding matrix: creates the signature crosshatch pixel texture of vintage computers.',
    tags: ['bayer', 'dither', 'ordered', 'matrix', 'retro'],
    parameters: {
      scale: { id: 'scale', name: 'Pixel Scale Block', type: 'range', min: 1, max: 6, step: 1, default: 2 },
      colorMode: {
        id: 'colorMode',
        name: 'Color Palette Mode',
        type: 'select',
        options: [
          { label: 'Full RGB Color Dither', value: 'color' },
          { label: 'Custom Palette (Dark & Light Shades)', value: 'mono' },
          { label: 'Cyber Neon (Cyan/Magenta)', value: 'cyber' },
          { label: '1989 Olive LCD (Game Boy)', value: 'olive' },
        ],
        default: 'mono',
      },
      darkColor: { id: 'darkColor', name: 'Dark Shade Color', type: 'color', default: '#0d0d10' },
      lightColor: { id: 'lightColor', name: 'Light Shade Color', type: 'color', default: '#ffffff' },
    },
    apply: (source, { scale = 2, colorMode = 'mono', darkColor = '#0d0d10', lightColor = '#ffffff' }) => {
      const { width, height } = source;
      const output = createImageBuffer(width, height);
      const src = source.data;
      const dst = output.data;
      const s = Math.max(1, Math.round(scale));
      const dRgb = hexToRgb(darkColor);
      const lRgb = hexToRgb(lightColor);

      for (let y = 0; y < height; y++) {
        const matY = Math.floor(y / s) % 4;
        for (let x = 0; x < width; x++) {
          const matX = Math.floor(x / s) % 4;
          const thresh = BAYER_4X4[matY]![matX]!;

          const idx = (y * width + x) * 4;

          if (colorMode === 'color') {
            dst[idx] = src[idx]! > thresh ? 255 : 0;
            dst[idx + 1] = src[idx + 1]! > thresh ? 255 : 0;
            dst[idx + 2] = src[idx + 2]! > thresh ? 255 : 0;
          } else if (colorMode === 'cyber') {
            const lum = rgbToLuminance(src[idx]!, src[idx + 1]!, src[idx + 2]!);
            if (lum > thresh) {
              dst[idx] = 0; dst[idx + 1] = 255; dst[idx + 2] = 230; // Cyan
            } else {
              dst[idx] = 255; dst[idx + 1] = 0; dst[idx + 2] = 128; // Magenta
            }
          } else if (colorMode === 'olive') {
            const lum = rgbToLuminance(src[idx]!, src[idx + 1]!, src[idx + 2]!);
            if (lum > thresh) {
              dst[idx] = 155; dst[idx + 1] = 188; dst[idx + 2] = 15;
            } else {
              dst[idx] = 15; dst[idx + 1] = 56; dst[idx + 2] = 15;
            }
          } else {
            const lum = rgbToLuminance(src[idx]!, src[idx + 1]!, src[idx + 2]!);
            if (lum > thresh) {
              dst[idx] = lRgb.r; dst[idx + 1] = lRgb.g; dst[idx + 2] = lRgb.b;
            } else {
              dst[idx] = dRgb.r; dst[idx + 1] = dRgb.g; dst[idx + 2] = dRgb.b;
            }
          }
          dst[idx + 3] = 255;
        }
      }
      return output;
    },
  },

  // 14. Bayer 8×8 Fine-Grain Matrix
  {
    id: 'bayer-8x8',
    name: 'Bayer 8×8 Fine-Grain Matrix',
    category: 'dither',
    description: 'High-density 64-level spatial ordered matrix producing ultra-fine crosshatch gradation.',
    tags: ['bayer', 'fine-grain', 'ordered', 'matrix', 'dither'],
    parameters: {
      scale: { id: 'scale', name: 'Pixel Pitch', type: 'range', min: 1, max: 4, step: 1, default: 1 },
      colorMode: {
        id: 'colorMode',
        name: 'Color Mode',
        type: 'select',
        options: [
          { label: 'Full RGB Color Dither', value: 'color' },
          { label: 'Custom Palette (Dark & Light Shades)', value: 'mono' },
          { label: 'Prussian Blue Ink', value: 'blue' },
        ],
        default: 'mono',
      },
      darkColor: { id: 'darkColor', name: 'Dark Shade Color', type: 'color', default: '#0c0c10' },
      lightColor: { id: 'lightColor', name: 'Light Shade Color', type: 'color', default: '#ffffff' },
    },
    apply: (source, { scale = 1, colorMode = 'mono', darkColor = '#0c0c10', lightColor = '#ffffff' }) => {
      const { width, height } = source;
      const output = createImageBuffer(width, height);
      const src = source.data;
      const dst = output.data;
      const s = Math.max(1, Math.round(scale));
      const dRgb = hexToRgb(darkColor);
      const lRgb = hexToRgb(lightColor);

      for (let y = 0; y < height; y++) {
        const matY = Math.floor(y / s) % 8;
        for (let x = 0; x < width; x++) {
          const matX = Math.floor(x / s) % 8;
          const thresh = BAYER_8X8[matY]![matX]!;
          const idx = (y * width + x) * 4;

          if (colorMode === 'color') {
            dst[idx] = src[idx]! > thresh ? 255 : 0;
            dst[idx + 1] = src[idx + 1]! > thresh ? 255 : 0;
            dst[idx + 2] = src[idx + 2]! > thresh ? 255 : 0;
          } else if (colorMode === 'blue') {
            const lum = rgbToLuminance(src[idx]!, src[idx + 1]!, src[idx + 2]!);
            if (lum > thresh) {
              dst[idx] = 235; dst[idx + 1] = 245; dst[idx + 2] = 255;
            } else {
              dst[idx] = 10; dst[idx + 1] = 25; dst[idx + 2] = 60;
            }
          } else {
            const lum = rgbToLuminance(src[idx]!, src[idx + 1]!, src[idx + 2]!);
            if (lum > thresh) {
              dst[idx] = lRgb.r; dst[idx + 1] = lRgb.g; dst[idx + 2] = lRgb.b;
            } else {
              dst[idx] = dRgb.r; dst[idx + 1] = dRgb.g; dst[idx + 2] = dRgb.b;
            }
          }
          dst[idx + 3] = 255;
        }
      }
      return output;
    },
  },

  // 15. Floyd-Steinberg Error Diffusion
  {
    id: 'floyd-steinberg',
    name: 'Floyd-Steinberg Error Diffusion',
    category: 'dither',
    description: 'Gold-standard error diffusion: propagates quantization error forward (7/16, 3/16, 5/16, 1/16) in full color or mono.',
    tags: ['floyd-steinberg', 'error-diffusion', 'dither', 'classic'],
    parameters: {
      paletteLevels: { id: 'paletteLevels', name: 'Color Palette Levels', type: 'range', min: 2, max: 8, step: 1, default: 2 },
      colorMode: { id: 'colorMode', name: 'Full RGB Color Dither', type: 'boolean', default: true },
    },
    apply: (source, { paletteLevels = 2, colorMode = true }) => {
      const { width, height } = source;
      const output = createImageBuffer(width, height);
      const src = source.data;
      const dst = output.data;

      const buffer = new Float32Array(width * height * 4);
      for (let i = 0; i < src.length; i++) buffer[i] = src[i]!;

      const step = 255 / (paletteLevels - 1);
      const quantize = (val: number) => clamp(Math.round(val / step) * step);

      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const idx = (y * width + x) * 4;

          if (!colorMode) {
            const lum = rgbToLuminance(buffer[idx]!, buffer[idx + 1]!, buffer[idx + 2]!);
            const q = quantize(lum);
            const err = lum - q;

            dst[idx] = q; dst[idx + 1] = q; dst[idx + 2] = q; dst[idx + 3] = 255;

            const spread = (cx: number, cy: number, f: number) => {
              if (cx >= 0 && cx < width && cy >= 0 && cy < height) {
                const n = (cy * width + cx) * 4;
                buffer[n] = (buffer[n] ?? 0) + err * f;
                buffer[n + 1] = (buffer[n + 1] ?? 0) + err * f;
                buffer[n + 2] = (buffer[n + 2] ?? 0) + err * f;
              }
            };
            spread(x + 1, y, 7 / 16);
            spread(x - 1, y + 1, 3 / 16);
            spread(x, y + 1, 5 / 16);
            spread(x + 1, y + 1, 1 / 16);
          } else {
            for (let c = 0; c < 3; c++) {
              const val = buffer[idx + c]!;
              const q = quantize(val);
              const err = val - q;
              dst[idx + c] = q;

              const spread = (cx: number, cy: number, f: number) => {
                if (cx >= 0 && cx < width && cy >= 0 && cy < height) {
                  const p = (cy * width + cx) * 4 + c;
                  buffer[p] = (buffer[p] ?? 0) + err * f;
                }
              };
              spread(x + 1, y, 7 / 16);
              spread(x - 1, y + 1, 3 / 16);
              spread(x, y + 1, 5 / 16);
              spread(x + 1, y + 1, 1 / 16);
            }
            dst[idx + 3] = 255;
          }
        }
      }
      return output;
    },
  },

  // 16. Bill Atkinson Indie Zine Dither
  {
    id: 'atkinson-zine',
    name: 'Bill Atkinson Indie Zine Dither',
    category: 'dither',
    description: 'Original Macintosh MacPaint algorithm: diffuses 3/4 (75%) error across 6 neighbors for punchy zine aesthetics.',
    tags: ['atkinson', 'macintosh', 'zine', 'punk', '1bit'],
    parameters: {
      threshold: { id: 'threshold', name: 'Binarize Threshold', type: 'range', min: 80, max: 180, step: 5, default: 128 },
      colorMode: {
        id: 'colorMode',
        name: 'Color Mode',
        type: 'select',
        options: [
          { label: 'Full RGB Color Atkinson', value: 'color' },
          { label: 'Punk Zine (Black on Cream)', value: 'zine' },
          { label: 'Acid Green on Black', value: 'acid' },
        ],
        default: 'color',
      },
    },
    apply: (source, { threshold = 128, colorMode = 'color' }) => {
      const { width, height } = source;
      const output = createImageBuffer(width, height);
      const src = source.data;
      const dst = output.data;

      if (colorMode === 'color') {
        const buffer = new Float32Array(width * height * 3);
        for (let i = 0; i < width * height; i++) {
          buffer[i * 3] = src[i * 4]!;
          buffer[i * 3 + 1] = src[i * 4 + 1]!;
          buffer[i * 3 + 2] = src[i * 4 + 2]!;
        }

        for (let y = 0; y < height; y++) {
          for (let x = 0; x < width; x++) {
            const idx = (y * width + x) * 3;
            for (let c = 0; c < 3; c++) {
              const oldV = buffer[idx + c]!;
              const newV = oldV > threshold ? 255 : 0;
              const err = (oldV - newV) / 8;
              dst[(y * width + x) * 4 + c] = newV;

              const add = (nx: number, ny: number) => {
                if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
                  const b = (ny * width + nx) * 3 + c;
                  buffer[b] = (buffer[b] ?? 0) + err;
                }
              };
              add(x + 1, y); add(x + 2, y);
              add(x - 1, y + 1); add(x, y + 1); add(x + 1, y + 1);
              add(x, y + 2);
            }
            dst[(y * width + x) * 4 + 3] = 255;
          }
        }
      } else {
        const buffer = new Float32Array(width * height);
        for (let i = 0; i < width * height; i++) {
          buffer[i] = rgbToLuminance(src[i * 4]!, src[i * 4 + 1]!, src[i * 4 + 2]!);
        }

        for (let y = 0; y < height; y++) {
          for (let x = 0; x < width; x++) {
            const idx = y * width + x;
            const oldV = buffer[idx]!;
            const newV = oldV > threshold ? 255 : 0;
            const err = (oldV - newV) / 8;

            const dIdx = idx * 4;
            if (colorMode === 'acid') {
              dst[dIdx] = 0;
              dst[dIdx + 1] = newV === 255 ? 255 : 0;
              dst[dIdx + 2] = newV === 255 ? 70 : 0;
            } else {
              // Zine cream
              if (newV === 255) {
                dst[dIdx] = 252; dst[dIdx + 1] = 250; dst[dIdx + 2] = 242;
              } else {
                dst[dIdx] = 20; dst[dIdx + 1] = 20; dst[dIdx + 2] = 25;
              }
            }
            dst[dIdx + 3] = 255;

            const add = (nx: number, ny: number) => {
              if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
                const b = ny * width + nx;
                buffer[b] = (buffer[b] ?? 0) + err;
              }
            };
            add(x + 1, y); add(x + 2, y);
            add(x - 1, y + 1); add(x, y + 1); add(x + 1, y + 1);
            add(x, y + 2);
          }
        }
      }
      return output;
    },
  },

  // 17. Jarvis, Judice & Ninke Dither
  {
    id: 'jarvis-dither',
    name: 'Jarvis-Judice-Ninke 12-Neighbor Diffusion',
    category: 'dither',
    description: 'Extends error propagation across 12 neighborhood cells (/48 divisor) for exceptionally smooth tonal transitions.',
    tags: ['jarvis', 'error-diffusion', 'smooth', 'dither'],
    parameters: {
      colorMode: { id: 'colorMode', name: 'RGB Color Mode', type: 'boolean', default: true },
    },
    apply: (source, { colorMode = true }) => {
      return runGenericErrorDiffusion(source, [
        { dx: 1, dy: 0, weight: 7 / 48 },
        { dx: 2, dy: 0, weight: 5 / 48 },
        { dx: -2, dy: 1, weight: 3 / 48 },
        { dx: -1, dy: 1, weight: 5 / 48 },
        { dx: 0, dy: 1, weight: 7 / 48 },
        { dx: 1, dy: 1, weight: 5 / 48 },
        { dx: 2, dy: 1, weight: 3 / 48 },
        { dx: -2, dy: 2, weight: 1 / 48 },
        { dx: -1, dy: 2, weight: 3 / 48 },
        { dx: 0, dy: 2, weight: 5 / 48 },
        { dx: 1, dy: 2, weight: 3 / 48 },
        { dx: 2, dy: 2, weight: 1 / 48 },
      ], colorMode);
    },
  },

  // 18. Stucki Error Diffusion
  {
    id: 'stucki-dither',
    name: 'Stucki High-Contrast Diffusion',
    category: 'dither',
    description: 'Crisp 12-neighbor error matrix (/42 divisor) optimized for photographic print clarity.',
    tags: ['stucki', 'print', 'contrast', 'dither'],
    parameters: {
      colorMode: { id: 'colorMode', name: 'RGB Color Mode', type: 'boolean', default: true },
    },
    apply: (source, { colorMode = true }) => {
      return runGenericErrorDiffusion(source, [
        { dx: 1, dy: 0, weight: 8 / 42 },
        { dx: 2, dy: 0, weight: 4 / 42 },
        { dx: -2, dy: 1, weight: 2 / 42 },
        { dx: -1, dy: 1, weight: 4 / 42 },
        { dx: 0, dy: 1, weight: 8 / 42 },
        { dx: 1, dy: 1, weight: 4 / 42 },
        { dx: 2, dy: 1, weight: 2 / 42 },
        { dx: -2, dy: 2, weight: 1 / 42 },
        { dx: -1, dy: 2, weight: 2 / 42 },
        { dx: 0, dy: 2, weight: 4 / 42 },
        { dx: 1, dy: 2, weight: 2 / 42 },
        { dx: 2, dy: 2, weight: 1 / 42 },
      ], colorMode);
    },
  },

  // 19. Sierra-3 Error Diffusion
  {
    id: 'sierra-dither',
    name: 'Sierra-3 Organic Diffusion',
    category: 'dither',
    description: 'Three-row error diffusion filter with soft non-directional stippling patterns.',
    tags: ['sierra', 'error-diffusion', 'organic', 'dither'],
    parameters: {
      colorMode: { id: 'colorMode', name: 'RGB Color Mode', type: 'boolean', default: true },
    },
    apply: (source, { colorMode = true }) => {
      return runGenericErrorDiffusion(source, [
        { dx: 1, dy: 0, weight: 5 / 32 },
        { dx: 2, dy: 0, weight: 3 / 32 },
        { dx: -2, dy: 1, weight: 2 / 32 },
        { dx: -1, dy: 1, weight: 4 / 32 },
        { dx: 0, dy: 1, weight: 5 / 32 },
        { dx: 1, dy: 1, weight: 4 / 32 },
        { dx: 2, dy: 1, weight: 2 / 32 },
        { dx: -1, dy: 2, weight: 2 / 32 },
        { dx: 0, dy: 2, weight: 3 / 32 },
        { dx: 1, dy: 2, weight: 2 / 32 },
      ], colorMode);
    },
  },

  // 20. Burkes Fast Dither
  {
    id: 'burkes-dither',
    name: 'Burkes Linear Matrix Dither',
    category: 'dither',
    description: 'Two-row error distribution (/32 divisor) yielding rapid processing and high-frequency textural stability.',
    tags: ['burkes', 'matrix', 'diffusion', 'dither'],
    parameters: {
      colorMode: { id: 'colorMode', name: 'RGB Color Mode', type: 'boolean', default: true },
    },
    apply: (source, { colorMode = true }) => {
      return runGenericErrorDiffusion(source, [
        { dx: 1, dy: 0, weight: 8 / 32 },
        { dx: 2, dy: 0, weight: 4 / 32 },
        { dx: -2, dy: 1, weight: 2 / 32 },
        { dx: -1, dy: 1, weight: 4 / 32 },
        { dx: 0, dy: 1, weight: 8 / 32 },
        { dx: 1, dy: 1, weight: 4 / 32 },
        { dx: 2, dy: 1, weight: 2 / 32 },
      ], colorMode);
    },
  },

  // 21. Color Halftone Bayer Dither
  {
    id: 'color-halftone-bayer',
    name: 'Color Halftone Bayer Dither',
    category: 'dither',
    description: 'Channels independently dithered via Bayer thresholding to emulate 8-color vintage display hardware.',
    tags: ['bayer', 'color-dither', 'retro', '8color', 'matrix'],
    parameters: {
      pixelSize: { id: 'pixelSize', name: 'Pixel Block Size', type: 'range', min: 1, max: 6, step: 1, default: 2 },
    },
    apply: (source, { pixelSize = 2 }) => {
      const { width, height } = source;
      const output = createImageBuffer(width, height);
      const src = source.data;
      const dst = output.data;
      const s = Math.max(1, Math.round(pixelSize));

      for (let y = 0; y < height; y++) {
        const matY = Math.floor(y / s) % 4;
        for (let x = 0; x < width; x++) {
          const matX = Math.floor(x / s) % 4;
          const thresh = BAYER_4X4[matY]![matX]!;

          const idx = (y * width + x) * 4;
          dst[idx] = src[idx]! > thresh ? 255 : 0;
          dst[idx + 1] = src[idx + 1]! > thresh ? 255 : 0;
          dst[idx + 2] = src[idx + 2]! > thresh ? 255 : 0;
          dst[idx + 3] = 255;
        }
      }
      return output;
    },
  },

  // 22. Blue Noise Clustered Dither
  {
    id: 'blue-noise-dither',
    name: 'Blue Noise Clustered Dither',
    category: 'dither',
    description: 'Stochastic blue-noise thresholding: eliminates regular periodic grid lines while maintaining even dot dispersion.',
    tags: ['blue-noise', 'stochastic', 'dither', 'organic', 'pattern'],
    parameters: {
      spread: { id: 'spread', name: 'Noise Contrast Spread', type: 'range', min: 0.5, max: 2.0, step: 0.1, default: 1.1 },
      colorMode: { id: 'colorMode', name: 'RGB Color Mode', type: 'boolean', default: true },
    },
    apply: (source, { spread = 1.1, colorMode = true }) => {
      const { width, height } = source;
      const output = createImageBuffer(width, height);
      const src = source.data;
      const dst = output.data;

      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          // Void-and-cluster blue noise simulation
          const seed = (Math.sin(x * 12.9898 + y * 78.233) * 43758.5453) % 1;
          const noise = Math.abs(seed) * 255;
          const thresh = (noise - 128) * spread + 128;

          const idx = (y * width + x) * 4;
          if (colorMode) {
            dst[idx] = src[idx]! > thresh ? 255 : 0;
            dst[idx + 1] = src[idx + 1]! > thresh ? 255 : 0;
            dst[idx + 2] = src[idx + 2]! > thresh ? 255 : 0;
          } else {
            const lum = rgbToLuminance(src[idx]!, src[idx + 1]!, src[idx + 2]!);
            const bit = lum > thresh ? 255 : 0;
            dst[idx] = bit; dst[idx + 1] = bit; dst[idx + 2] = bit;
          }
          dst[idx + 3] = 255;
        }
      }
      return output;
    },
  },
];

interface KernelNeighbor {
  dx: number;
  dy: number;
  weight: number;
}

function runGenericErrorDiffusion(
  source: ImageData,
  kernel: KernelNeighbor[],
  colorMode: boolean
): ImageData {
  const { width, height } = source;
  const output = createImageBuffer(width, height);
  const src = source.data;
  const dst = output.data;

  const buffer = new Float32Array(width * height * 4);
  for (let i = 0; i < src.length; i++) buffer[i] = src[i]!;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;

      if (!colorMode) {
        const lum = rgbToLuminance(buffer[idx]!, buffer[idx + 1]!, buffer[idx + 2]!);
        const q = lum > 128 ? 255 : 0;
        const err = lum - q;

        dst[idx] = q; dst[idx + 1] = q; dst[idx + 2] = q; dst[idx + 3] = 255;

        for (const k of kernel) {
          const nx = x + k.dx;
          const ny = y + k.dy;
          if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
            const nIdx = (ny * width + nx) * 4;
            buffer[nIdx] = (buffer[nIdx] ?? 0) + err * k.weight;
            buffer[nIdx + 1] = (buffer[nIdx + 1] ?? 0) + err * k.weight;
            buffer[nIdx + 2] = (buffer[nIdx + 2] ?? 0) + err * k.weight;
          }
        }
      } else {
        for (let c = 0; c < 3; c++) {
          const val = buffer[idx + c]!;
          const q = val > 128 ? 255 : 0;
          const err = val - q;
          dst[idx + c] = q;

          for (const k of kernel) {
            const nx = x + k.dx;
            const ny = y + k.dy;
            if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
              const nIdx = (ny * width + nx) * 4 + c;
              buffer[nIdx] = (buffer[nIdx] ?? 0) + err * k.weight;
            }
          }
        }
        dst[idx + 3] = 255;
      }
    }
  }
  return output;
}
