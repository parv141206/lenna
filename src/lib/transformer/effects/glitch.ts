import type { EffectDefinition } from '../types';
import {
  clamp,
  createImageBuffer,
  rgbToLuminance,
} from '../matrix';

export const glitchEffects: EffectDefinition[] = [
  // 33. Algorithmic Pixel Sort
  {
    id: 'algorithmic-pixel-sort',
    name: 'Algorithmic Pixel Sort',
    category: 'glitch',
    description: 'Interval-based scanline sorting: isolates contiguous pixel spans within luminance bounds and sorts them into cascading streaks.',
    tags: ['pixel-sort', 'glitch', 'data-moshing', 'cyber', 'generative'],
    parameters: {
      thresholdLow: { id: 'thresholdLow', name: 'Luminance Cutoff Min', type: 'range', min: 10, max: 140, step: 5, default: 50 },
      thresholdHigh: { id: 'thresholdHigh', name: 'Luminance Cutoff Max', type: 'range', min: 130, max: 250, step: 5, default: 215 },
      direction: {
        id: 'direction',
        name: 'Sort Axis',
        type: 'select',
        options: [
          { label: 'Horizontal Left-to-Right', value: 'horizontal' },
          { label: 'Vertical Top-to-Bottom', value: 'vertical' },
        ],
        default: 'horizontal',
      },
    },
    apply: (source, { thresholdLow = 50, thresholdHigh = 215, direction = 'horizontal' }) => {
      const { width, height } = source;
      const output = createImageBuffer(width, height);
      output.data.set(source.data);
      const data = output.data;

      if (direction === 'horizontal') {
        for (let y = 0; y < height; y++) {
          let spanStart = -1;
          for (let x = 0; x < width; x++) {
            const idx = (y * width + x) * 4;
            const lum = rgbToLuminance(data[idx]!, data[idx + 1]!, data[idx + 2]!);
            const inRange = lum >= thresholdLow && lum <= thresholdHigh;

            if (inRange && spanStart === -1) {
              spanStart = x;
            } else if (!inRange && spanStart !== -1) {
              sortSpanH(data, width, y, spanStart, x - 1);
              spanStart = -1;
            }
          }
          if (spanStart !== -1) {
            sortSpanH(data, width, y, spanStart, width - 1);
          }
        }
      } else {
        for (let x = 0; x < width; x++) {
          let spanStart = -1;
          for (let y = 0; y < height; y++) {
            const idx = (y * width + x) * 4;
            const lum = rgbToLuminance(data[idx]!, data[idx + 1]!, data[idx + 2]!);
            const inRange = lum >= thresholdLow && lum <= thresholdHigh;

            if (inRange && spanStart === -1) {
              spanStart = y;
            } else if (!inRange && spanStart !== -1) {
              sortSpanV(data, width, x, spanStart, y - 1);
              spanStart = -1;
            }
          }
          if (spanStart !== -1) {
            sortSpanV(data, width, x, spanStart, height - 1);
          }
        }
      }
      return output;
    },
  },

  // 34. Lateral Chromatic Aberration
  {
    id: 'lateral-chromatic-dispersion',
    name: 'Lateral Chromatic Aberration',
    category: 'glitch',
    description: 'Optical lens dispersion: spectral separation of red and cyan/blue channels toward boundaries.',
    tags: ['chromatic', 'aberration', 'dispersion', 'lens', 'glitch'],
    parameters: {
      offset: { id: 'offset', name: 'Channel Shift (px)', type: 'range', min: 2, max: 40, step: 1, default: 14 },
      mode: {
        id: 'mode',
        name: 'Shift Geometry',
        type: 'select',
        options: [
          { label: 'Radial (Edge Dispersion)', value: 'radial' },
          { label: 'Horizontal Anamorphic', value: 'horizontal' },
          { label: '45° Diagonal Split', value: 'diagonal' },
        ],
        default: 'radial',
      },
    },
    apply: (source, { offset = 14, mode = 'radial' }) => {
      const { width, height } = source;
      const output = createImageBuffer(width, height);
      const src = source.data;
      const dst = output.data;

      const midX = width / 2;
      const midY = height / 2;
      const maxDist = Math.hypot(midX, midY);

      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          let rx: number, ry: number, bx: number, by: number;

          if (mode === 'radial') {
            const dx = (x - midX) / maxDist;
            const dy = (y - midY) / maxDist;
            rx = clamp(Math.round(x + dx * offset), 0, width - 1);
            ry = clamp(Math.round(y + dy * offset), 0, height - 1);
            bx = clamp(Math.round(x - dx * offset), 0, width - 1);
            by = clamp(Math.round(y - dy * offset), 0, height - 1);
          } else if (mode === 'horizontal') {
            rx = clamp(Math.round(x + offset), 0, width - 1);
            ry = y;
            bx = clamp(Math.round(x - offset), 0, width - 1);
            by = y;
          } else {
            rx = clamp(Math.round(x + offset), 0, width - 1);
            ry = clamp(Math.round(y + offset), 0, height - 1);
            bx = clamp(Math.round(x - offset), 0, width - 1);
            by = clamp(Math.round(y - offset), 0, height - 1);
          }

          const rIdx = (ry * width + rx) * 4;
          const gIdx = (y * width + x) * 4;
          const bIdx = (by * width + bx) * 4;

          const dIdx = (y * width + x) * 4;
          dst[dIdx] = src[rIdx]!;
          dst[dIdx + 1] = src[gIdx + 1]!;
          dst[dIdx + 2] = src[bIdx + 2]!;
          dst[dIdx + 3] = src[gIdx + 3]!;
        }
      }
      return output;
    },
  },

  // 35. CRT Aperture Grille & Scanlines
  {
    id: 'crt-aperture-phosphor',
    name: 'CRT Aperture Grille & Phosphors',
    category: 'glitch',
    description: 'Trinitron-style aperture grille: RGB vertical phosphor stripes and dark horizontal scanline raster.',
    tags: ['crt', 'scanlines', 'phosphor', 'trinitron', 'arcade', 'retro'],
    parameters: {
      scanlineDarkness: { id: 'scanlineDarkness', name: 'Scanline Darkness', type: 'range', min: 0.1, max: 0.8, step: 0.05, default: 0.4 },
      scanlineSpacing: { id: 'scanlineSpacing', name: 'Scanline Spacing', type: 'range', min: 2, max: 6, step: 1, default: 3 },
      phosphorBoost: { id: 'phosphorBoost', name: 'Phosphor Bloom', type: 'range', min: 1.0, max: 1.8, step: 0.05, default: 1.3 },
    },
    apply: (source, { scanlineDarkness = 0.4, scanlineSpacing = 3, phosphorBoost = 1.3 }) => {
      const { width, height } = source;
      const output = createImageBuffer(width, height);
      const src = source.data;
      const dst = output.data;

      for (let y = 0; y < height; y++) {
        const isScanline = y % scanlineSpacing === 0;
        const lineMult = isScanline ? 1 - scanlineDarkness : 1;

        for (let x = 0; x < width; x++) {
          const idx = (y * width + x) * 4;
          const subpixel = x % 3;

          let r = src[idx]! * lineMult;
          let g = src[idx + 1]! * lineMult;
          let b = src[idx + 2]! * lineMult;

          if (subpixel === 0) {
            r *= phosphorBoost; g *= 0.8; b *= 0.8;
          } else if (subpixel === 1) {
            r *= 0.8; g *= phosphorBoost; b *= 0.8;
          } else {
            r *= 0.8; g *= 0.8; b *= phosphorBoost;
          }

          dst[idx] = clamp(Math.round(r));
          dst[idx + 1] = clamp(Math.round(g));
          dst[idx + 2] = clamp(Math.round(b));
          dst[idx + 3] = 255;
        }
      }
      return output;
    },
  },

  // 36. VHS Analog Tape Tracking Drift
  {
    id: 'vhs-tape-tracking',
    name: 'VHS Analog Tape Tracking Glitch',
    category: 'glitch',
    description: 'Magnetic videotape phase error: horizontal tracking jitter, color phase delay, and static noise band.',
    tags: ['vhs', 'tape', 'tracking', 'analog', 'glitch'],
    parameters: {
      jitterAmount: { id: 'jitterAmount', name: 'Horizontal Jitter', type: 'range', min: 2, max: 30, step: 1, default: 12 },
      trackingBarPos: { id: 'trackingBarPos', name: 'Tracking Bar Y Position', type: 'range', min: 0.1, max: 0.9, step: 0.05, default: 0.7 },
    },
    apply: (source, { jitterAmount = 12, trackingBarPos = 0.7 }) => {
      const { width, height } = source;
      const output = createImageBuffer(width, height);
      const src = source.data;
      const dst = output.data;

      const barY = Math.floor(height * trackingBarPos);
      const barH = Math.floor(height * 0.08);

      for (let y = 0; y < height; y++) {
        let lineOffset = 0;
        let isBar = false;

        if (y >= barY && y <= barY + barH) {
          isBar = true;
          lineOffset = Math.round(Math.sin(y * 0.4) * jitterAmount * 2.5);
        } else if (Math.random() < 0.06) {
          lineOffset = Math.round((Math.random() - 0.5) * jitterAmount);
        }

        for (let x = 0; x < width; x++) {
          const sx = clamp(x + lineOffset, 0, width - 1);
          const sIdx = (y * width + sx) * 4;
          const dIdx = (y * width + x) * 4;

          if (isBar && Math.random() < 0.4) {
            const noise = Math.round(Math.random() * 255);
            dst[dIdx] = noise; dst[dIdx + 1] = noise; dst[dIdx + 2] = noise;
          } else {
            const chromaX = clamp(sx - 3, 0, width - 1);
            const cIdx = (y * width + chromaX) * 4;
            dst[dIdx] = src[sIdx]!;
            dst[dIdx + 1] = src[sIdx + 1]!;
            dst[dIdx + 2] = src[cIdx + 2]!;
          }
          dst[dIdx + 3] = src[sIdx + 3]!;
        }
      }
      return output;
    },
  },

  // 37. Digital Data Moshing / Byte Stretch
  {
    id: 'digital-data-mosh',
    name: 'Digital Data Moshing / Byte Stretch',
    category: 'glitch',
    description: 'Codec decompression error: horizontally streaks and repeats macroblocks across the frame buffer.',
    tags: ['mosh', 'datamosh', 'compression', 'codec', 'glitch'],
    parameters: {
      blockSize: { id: 'blockSize', name: 'Macroblock Height', type: 'range', min: 4, max: 32, step: 2, default: 12 },
      streakChance: { id: 'streakChance', name: 'Streak Probability', type: 'range', min: 0.1, max: 0.8, step: 0.05, default: 0.35 },
    },
    apply: (source, { blockSize = 12, streakChance = 0.35 }) => {
      const { width, height } = source;
      const output = createImageBuffer(width, height);
      output.data.set(source.data);
      const dst = output.data;

      for (let y = 0; y < height; y += blockSize) {
        if (Math.random() < streakChance) {
          const sampleX = Math.floor(Math.random() * (width - 40));
          const sampleLength = Math.floor(Math.random() * (width - sampleX));

          for (let dy = 0; dy < blockSize && y + dy < height; dy++) {
            const rowIdx = (y + dy) * width * 4;
            const refIdx = rowIdx + sampleX * 4;
            const r = dst[refIdx]!;
            const g = dst[refIdx + 1]!;
            const b = dst[refIdx + 2]!;

            for (let x = sampleX; x < sampleX + sampleLength && x < width; x++) {
              const idx = rowIdx + x * 4;
              dst[idx] = r;
              dst[idx + 1] = g;
              dst[idx + 2] = b;
            }
          }
        }
      }
      return output;
    },
  },

  // 38. Slit-Scan Rolling Shutter Warp
  {
    id: 'slit-scan-shutter',
    name: 'Slit-Scan Rolling Shutter Warp',
    category: 'glitch',
    description: 'Time-slit distortion: phase-shifts horizontal line sampling in a sinusoidal progressive wave.',
    tags: ['slit-scan', 'warp', 'rolling-shutter', 'distortion'],
    parameters: {
      amplitude: { id: 'amplitude', name: 'Wave Displacement Amplitude (px)', type: 'range', min: 4, max: 60, step: 2, default: 24 },
      frequency: { id: 'frequency', name: 'Wave Frequency', type: 'range', min: 1, max: 10, step: 0.5, default: 3 },
    },
    apply: (source, { amplitude = 24, frequency = 3 }) => {
      const { width, height } = source;
      const output = createImageBuffer(width, height);
      const src = source.data;
      const dst = output.data;

      for (let y = 0; y < height; y++) {
        const offset = Math.round(Math.sin((y / height) * Math.PI * 2 * frequency) * amplitude);
        for (let x = 0; x < width; x++) {
          const sx = clamp(x + offset, 0, width - 1);
          const sIdx = (y * width + sx) * 4;
          const dIdx = (y * width + x) * 4;

          dst[dIdx] = src[sIdx]!;
          dst[dIdx + 1] = src[sIdx + 1]!;
          dst[dIdx + 2] = src[sIdx + 2]!;
          dst[dIdx + 3] = src[sIdx + 3]!;
        }
      }
      return output;
    },
  },

  // 39. RGB 3-Axis Plane Disconnect
  {
    id: 'rgb-channel-disconnect',
    name: 'RGB 3-Axis Independent Plane Shift',
    category: 'glitch',
    description: 'Complete deconstruction of color space: user independently positions Red, Green, and Blue planes along X and Y axes.',
    tags: ['rgb', 'disconnect', 'planes', 'chromatic', 'glitch'],
    parameters: {
      redShiftX: { id: 'redShiftX', name: 'Red X Offset', type: 'range', min: -30, max: 30, step: 1, default: 12 },
      redShiftY: { id: 'redShiftY', name: 'Red Y Offset', type: 'range', min: -30, max: 30, step: 1, default: 0 },
      blueShiftX: { id: 'blueShiftX', name: 'Blue X Offset', type: 'range', min: -30, max: 30, step: 1, default: -12 },
      blueShiftY: { id: 'blueShiftY', name: 'Blue Y Offset', type: 'range', min: -30, max: 30, step: 1, default: 6 },
    },
    apply: (source, { redShiftX = 12, redShiftY = 0, blueShiftX = -12, blueShiftY = 6 }) => {
      const { width, height } = source;
      const output = createImageBuffer(width, height);
      const src = source.data;
      const dst = output.data;

      for (let y = 0; y < height; y++) {
        const ry = clamp(y + redShiftY, 0, height - 1);
        const by = clamp(y + blueShiftY, 0, height - 1);

        for (let x = 0; x < width; x++) {
          const rx = clamp(x + redShiftX, 0, width - 1);
          const bx = clamp(x + blueShiftX, 0, width - 1);

          const rIdx = (ry * width + rx) * 4;
          const gIdx = (y * width + x) * 4;
          const bIdx = (by * width + bx) * 4;

          const dIdx = (y * width + x) * 4;
          dst[dIdx] = src[rIdx]!;
          dst[dIdx + 1] = src[gIdx + 1]!;
          dst[dIdx + 2] = src[bIdx + 2]!;
          dst[dIdx + 3] = src[gIdx + 3]!;
        }
      }
      return output;
    },
  },

  // 40. Scanline Slice Jump Glitch
  {
    id: 'scanline-jump-glitch',
    name: 'Scanline Slice Jump Glitch',
    category: 'glitch',
    description: 'Digital signal sync loss: random horizontal slices jump sideways with chromatic tear.',
    tags: ['slice', 'jump', 'tear', 'glitch', 'digital'],
    parameters: {
      sliceCount: { id: 'sliceCount', name: 'Number of Slices', type: 'range', min: 2, max: 20, step: 1, default: 8 },
      maxDisplacement: { id: 'maxDisplacement', name: 'Maximum Slice Offset (px)', type: 'range', min: 10, max: 80, step: 5, default: 35 },
    },
    apply: (source, { sliceCount = 8, maxDisplacement = 35 }) => {
      const { width, height } = source;
      const output = createImageBuffer(width, height);
      output.data.set(source.data);
      const dst = output.data;
      const src = source.data;

      // Deterministic slices
      for (let s = 0; s < sliceCount; s++) {
        const sliceY = Math.floor((Math.sin(s * 93.1) * 0.5 + 0.5) * height);
        const sliceH = Math.floor((Math.cos(s * 41.7) * 0.5 + 0.5) * 30) + 4;
        const shift = Math.round((Math.sin(s * 17.3) * maxDisplacement));

        for (let y = sliceY; y < sliceY + sliceH && y < height; y++) {
          for (let x = 0; x < width; x++) {
            const sx = clamp(x + shift, 0, width - 1);
            const sIdx = (y * width + sx) * 4;
            const dIdx = (y * width + x) * 4;

            // Introduce slight chromatic fringing at slice jump
            const rx = clamp(sx + 4, 0, width - 1);
            dst[dIdx] = src[(y * width + rx) * 4]!;
            dst[dIdx + 1] = src[sIdx + 1]!;
            dst[dIdx + 2] = src[sIdx + 2]!;
          }
        }
      }
      return output;
    },
  },

  // 41. Triad Shadow Mask Matrix
  {
    id: 'triad-shadow-mask',
    name: 'Arcade Delta Triad Shadow Mask',
    category: 'glitch',
    description: 'Early arcade monitor delta shadow mask: triangular RGB phosphor dot triads with pitch adjustment.',
    tags: ['shadow-mask', 'arcade', 'crt', 'delta', 'phosphor'],
    parameters: {
      dotPitch: { id: 'dotPitch', name: 'Phosphor Dot Pitch', type: 'range', min: 3, max: 8, step: 1, default: 4 },
      dotIntensity: { id: 'dotIntensity', name: 'Phosphor Brightness', type: 'range', min: 1.0, max: 2.0, step: 0.1, default: 1.3 },
    },
    apply: (source, { dotPitch = 4, dotIntensity = 1.3 }) => {
      const { width, height } = source;
      const output = createImageBuffer(width, height);
      const src = source.data;
      const dst = output.data;

      for (let y = 0; y < height; y++) {
        const isOddRow = Math.floor(y / dotPitch) % 2 !== 0;
        const xOffset = isOddRow ? Math.floor(dotPitch * 1.5) : 0;

        for (let x = 0; x < width; x++) {
          const triadX = (x + xOffset) % (dotPitch * 3);
          const colorSub = Math.floor(triadX / dotPitch);

          const idx = (y * width + x) * 4;
          let r = src[idx]!;
          let g = src[idx + 1]!;
          let b = src[idx + 2]!;

          if (colorSub === 0) {
            r = clamp(r * dotIntensity); g = clamp(g * 0.2); b = clamp(b * 0.2);
          } else if (colorSub === 1) {
            r = clamp(r * 0.2); g = clamp(g * dotIntensity); b = clamp(b * 0.2);
          } else {
            r = clamp(r * 0.2); g = clamp(g * 0.2); b = clamp(b * dotIntensity);
          }

          dst[idx] = r;
          dst[idx + 1] = g;
          dst[idx + 2] = b;
          dst[idx + 3] = 255;
        }
      }
      return output;
    },
  },

  // 42. Barrel Spherical Coordinate Warp
  {
    id: 'barrel-spherical-warp',
    name: 'Barrel & Fish-Eye Spherical Warp',
    category: 'glitch',
    description: 'Curvilinear radial coordinate warp simulating optical wide-angle glass or bubble displays.',
    tags: ['fisheye', 'barrel', 'warp', 'spherical', 'lens'],
    parameters: {
      power: { id: 'power', name: 'Curvature Power', type: 'range', min: -0.8, max: 1.5, step: 0.05, default: 0.65 },
    },
    apply: (source, { power = 0.65 }) => {
      const { width, height } = source;
      const output = createImageBuffer(width, height);
      const src = source.data;
      const dst = output.data;

      const midX = width / 2;
      const midY = height / 2;
      const maxR = Math.hypot(midX, midY);

      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const nx = (x - midX) / maxR;
          const ny = (y - midY) / maxR;
          const r = Math.hypot(nx, ny);

          const factor = power > 0 ? 1 + power * r * r : 1 / (1 - power * r * r);

          const sx = clamp(Math.round(midX + nx * factor * maxR), 0, width - 1);
          const sy = clamp(Math.round(midY + ny * factor * maxR), 0, height - 1);

          const sIdx = (sy * width + sx) * 4;
          const dIdx = (y * width + x) * 4;

          dst[dIdx] = src[sIdx]!;
          dst[dIdx + 1] = src[sIdx + 1]!;
          dst[dIdx + 2] = src[sIdx + 2]!;
          dst[dIdx + 3] = src[sIdx + 3]!;
        }
      }
      return output;
    },
  },

  // 43. Optical Kaleidoscope Prism
  {
    id: 'kaleidoscope-mirror',
    name: 'Optical Kaleidoscope Mirror Prism',
    category: 'glitch',
    description: 'Rotational symmetry mirror wedge system: partitions plane into reflecting angular sectors.',
    tags: ['kaleidoscope', 'symmetry', 'radial', 'prism', 'geometric'],
    parameters: {
      facets: { id: 'facets', name: 'Mirror Facets', type: 'range', min: 4, max: 24, step: 2, default: 8 },
      rotation: { id: 'rotation', name: 'Prism Rotation (deg)', type: 'range', min: 0, max: 360, step: 5, default: 0 },
    },
    apply: (source, { facets = 8, rotation = 0 }) => {
      const { width, height } = source;
      const output = createImageBuffer(width, height);
      const src = source.data;
      const dst = output.data;

      const midX = width / 2;
      const midY = height / 2;
      const sectorAngle = (2 * Math.PI) / facets;
      const rotOffset = (rotation * Math.PI) / 180;

      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const dx = x - midX;
          const dy = y - midY;
          const r = Math.hypot(dx, dy);
          const theta = (Math.atan2(dy, dx) - rotOffset + 4 * Math.PI) % (2 * Math.PI);

          let sector = theta % sectorAngle;
          if (Math.floor(theta / sectorAngle) % 2 === 1) {
            sector = sectorAngle - sector;
          }

          const targetAngle = sector + rotOffset;
          const sx = clamp(Math.round(midX + r * Math.cos(targetAngle)), 0, width - 1);
          const sy = clamp(Math.round(midY + r * Math.sin(targetAngle)), 0, height - 1);

          const sIdx = (sy * width + sx) * 4;
          const dIdx = (y * width + x) * 4;

          dst[dIdx] = src[sIdx]!;
          dst[dIdx + 1] = src[sIdx + 1]!;
          dst[dIdx + 2] = src[sIdx + 2]!;
          dst[dIdx + 3] = src[sIdx + 3]!;
        }
      }
      return output;
    },
  },

  // 44. Bitplane & XOR Mathematical Artifacting
  {
    id: 'bit-interleave-xor',
    name: 'Bitplane & XOR Mathematical Artifacting',
    category: 'glitch',
    description: 'Hardware bitwise processing: performs boolean XOR operations across color byte bitplanes for geometric digital fractals.',
    tags: ['xor', 'bitplane', 'binary', 'glitch', 'digital', 'math'],
    parameters: {
      xorMask: { id: 'xorMask', name: 'XOR Bitmask Value', type: 'range', min: 16, max: 240, step: 16, default: 64 },
      channelSelect: {
        id: 'channelSelect',
        name: 'Target Bitplanes',
        type: 'select',
        options: [
          { label: 'All RGB Channels', value: 'all' },
          { label: 'Red Channel Only', value: 'red' },
          { label: 'Blue Channel Only', value: 'blue' },
        ],
        default: 'all',
      },
    },
    apply: (source, { xorMask = 64, channelSelect = 'all' }) => {
      const output = createImageBuffer(source.width, source.height);
      const src = source.data;
      const dst = output.data;
      const len = src.length;
      const mask = Math.round(xorMask);

      for (let i = 0; i < len; i += 4) {
        let r = src[i]!;
        let g = src[i + 1]!;
        let b = src[i + 2]!;

        if (channelSelect === 'all') {
          r ^= mask; g ^= mask; b ^= mask;
        } else if (channelSelect === 'red') {
          r ^= mask;
        } else {
          b ^= mask;
        }

        dst[i] = r;
        dst[i + 1] = g;
        dst[i + 2] = b;
        dst[i + 3] = src[i + 3]!;
      }
      return output;
    },
  },
];

function sortSpanH(data: Uint8ClampedArray, width: number, y: number, x0: number, x1: number) {
  const span: { r: number; g: number; b: number; a: number; lum: number }[] = [];
  for (let x = x0; x <= x1; x++) {
    const idx = (y * width + x) * 4;
    span.push({
      r: data[idx]!,
      g: data[idx + 1]!,
      b: data[idx + 2]!,
      a: data[idx + 3]!,
      lum: rgbToLuminance(data[idx]!, data[idx + 1]!, data[idx + 2]!),
    });
  }

  span.sort((a, b) => a.lum - b.lum);

  for (let i = 0; i < span.length; i++) {
    const p = span[i]!;
    const idx = (y * width + x0 + i) * 4;
    data[idx] = p.r;
    data[idx + 1] = p.g;
    data[idx + 2] = p.b;
    data[idx + 3] = p.a;
  }
}

function sortSpanV(data: Uint8ClampedArray, width: number, x: number, y0: number, y1: number) {
  const span: { r: number; g: number; b: number; a: number; lum: number }[] = [];
  for (let y = y0; y <= y1; y++) {
    const idx = (y * width + x) * 4;
    span.push({
      r: data[idx]!,
      g: data[idx + 1]!,
      b: data[idx + 2]!,
      a: data[idx + 3]!,
      lum: rgbToLuminance(data[idx]!, data[idx + 1]!, data[idx + 2]!),
    });
  }

  span.sort((a, b) => a.lum - b.lum);

  for (let i = 0; i < span.length; i++) {
    const p = span[i]!;
    const idx = ((y0 + i) * width + x) * 4;
    data[idx] = p.r;
    data[idx + 1] = p.g;
    data[idx + 2] = p.b;
    data[idx + 3] = p.a;
  }
}
