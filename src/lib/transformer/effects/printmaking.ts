import type { EffectDefinition } from '../types';
import {
  clamp,
  createImageBuffer,
  hexToRgb,
  lerp,
  rgbToLuminance,
} from '../matrix';

export const printmakingEffects: EffectDefinition[] = [
  // 23. Risograph Soy Ink Duplicator
  {
    id: 'risograph-spot-print',
    name: 'Risograph Soy-Ink Duplicator',
    category: 'printmaking',
    description: 'Japanese duplicator screen print: semi-opaque spot soy inks overlapping on uncoated paper with misregistration drift.',
    tags: ['risograph', 'zine', 'spot-color', 'printmaking', 'analog'],
    parameters: {
      ink1: { id: 'ink1', name: 'First Spot Ink (e.g. Fluorescent Pink)', type: 'color', default: '#ff1493' },
      ink2: { id: 'ink2', name: 'Second Spot Ink (e.g. Electric Teal)', type: 'color', default: '#00ced1' },
      paperColor: { id: 'paperColor', name: 'Uncoated Paper Stock', type: 'color', default: '#faf7f2' },
      misregistrationX: { id: 'misregistrationX', name: 'Drum Shift X (px)', type: 'range', min: -15, max: 15, step: 1, default: 4 },
      misregistrationY: { id: 'misregistrationY', name: 'Drum Shift Y (px)', type: 'range', min: -15, max: 15, step: 1, default: -3 },
      density: { id: 'density', name: 'Ink Load Density', type: 'range', min: 0.6, max: 1.8, step: 0.05, default: 1.2 },
    },
    apply: (source, { ink1 = '#ff1493', ink2 = '#00ced1', paperColor = '#faf7f2', misregistrationX = 4, misregistrationY = -3, density = 1.2 }) => {
      const { width, height } = source;
      const output = createImageBuffer(width, height);
      const src = source.data;
      const dst = output.data;

      const c1 = hexToRgb(ink1);
      const c2 = hexToRgb(ink2);
      const paper = hexToRgb(paperColor);

      for (let y = 0; y < height; y++) {
        const sy2 = clamp(y + misregistrationY, 0, height - 1);
        for (let x = 0; x < width; x++) {
          const sx2 = clamp(x + misregistrationX, 0, width - 1);

          const idx1 = (y * width + x) * 4;
          const idx2 = (sy2 * width + sx2) * 4;

          const r1 = src[idx1]!;
          const g2 = src[idx2 + 1]!;
          const b2 = src[idx2 + 2]!;

          const plate1 = clamp((1 - r1 / 255) * density, 0, 1);
          const plate2 = clamp((1 - (g2 * 0.5 + b2 * 0.5) / 255) * density, 0, 1);

          // Subtractive ink layering over paper
          const outR = paper.r * (1 - plate1 * (1 - c1.r / 255)) * (1 - plate2 * (1 - c2.r / 255));
          const outG = paper.g * (1 - plate1 * (1 - c1.g / 255)) * (1 - plate2 * (1 - c2.g / 255));
          const outB = paper.b * (1 - plate1 * (1 - c1.b / 255)) * (1 - plate2 * (1 - c2.b / 255));

          const dIdx = idx1;
          dst[dIdx] = clamp(Math.round(outR));
          dst[dIdx + 1] = clamp(Math.round(outG));
          dst[dIdx + 2] = clamp(Math.round(outB));
          dst[dIdx + 3] = 255;
        }
      }
      return output;
    },
  },

  // 24. Banknote Intaglio Crosshatch
  {
    id: 'banknote-crosshatch',
    name: 'Banknote Intaglio Crosshatch',
    category: 'printmaking',
    description: 'Steel-plate intaglio currency engraving: multi-angle intersecting hatch lines modulated by luminance bands.',
    tags: ['crosshatch', 'intaglio', 'banknote', 'engraving', 'currency'],
    parameters: {
      spacing: { id: 'spacing', name: 'Hatch Pitch (px)', type: 'range', min: 4, max: 14, step: 1, default: 6 },
      inkColor: { id: 'inkColor', name: 'Engraving Ink', type: 'color', default: '#1a202c' },
      paperColor: { id: 'paperColor', name: 'Banknote Paper', type: 'color', default: '#f4f1ea' },
      multiColor: { id: 'multiColor', name: 'Sample Image Color For Lines', type: 'boolean', default: false },
    },
    apply: (source, { spacing = 6, inkColor = '#1a202c', paperColor = '#f4f1ea', multiColor = false }) => {
      const { width, height } = source;
      const output = createImageBuffer(width, height);
      const src = source.data;
      const dst = output.data;

      const ink = hexToRgb(inkColor);
      const paper = hexToRgb(paperColor);

      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const sIdx = (y * width + x) * 4;
          const lum = rgbToLuminance(src[sIdx]!, src[sIdx + 1]!, src[sIdx + 2]!) / 255;
          const dIdx = (y * width + x) * 4;

          let isInk = false;
          if (lum < 0.85 && (x + y) % spacing === 0) isInk = true;
          if (lum < 0.65 && (x - y + 10000) % spacing === 0) isInk = true;
          if (lum < 0.45 && y % spacing === 0) isInk = true;
          if (lum < 0.25 && x % spacing === 0) isInk = true;

          if (isInk) {
            if (multiColor) {
              dst[dIdx] = src[sIdx]!;
              dst[dIdx + 1] = src[sIdx + 1]!;
              dst[dIdx + 2] = src[sIdx + 2]!;
            } else {
              dst[dIdx] = ink.r;
              dst[dIdx + 1] = ink.g;
              dst[dIdx + 2] = ink.b;
            }
          } else {
            dst[dIdx] = paper.r;
            dst[dIdx + 1] = paper.g;
            dst[dIdx + 2] = paper.b;
          }
          dst[dIdx + 3] = 255;
        }
      }
      return output;
    },
  },

  // 25. Pointillist Ink Stippling
  {
    id: 'stippling-ink',
    name: 'Pointillist Ink Stippling',
    category: 'printmaking',
    description: 'Fine technical pen stippling: stochastic dot distribution density responding to darkness.',
    tags: ['stippling', 'pen', 'ink', 'pointillism', 'sketch'],
    parameters: {
      density: { id: 'density', name: 'Stipple Density', type: 'range', min: 0.5, max: 2.5, step: 0.1, default: 1.3 },
      dotScale: { id: 'dotScale', name: 'Pen Nib Width (px)', type: 'range', min: 1, max: 3, step: 0.5, default: 1 },
      penColor: { id: 'penColor', name: 'Pen Ink Color', type: 'color', default: '#111827' },
      paperColor: { id: 'paperColor', name: 'Paper Stock Color', type: 'color', default: '#fdfbf7' },
      sampleColor: { id: 'sampleColor', name: 'Colored Ink Dots', type: 'boolean', default: false },
    },
    apply: (source, { density = 1.3, dotScale = 1, penColor = '#111827', paperColor = '#fdfbf7', sampleColor = false }) => {
      const { width, height } = source;
      const output = createImageBuffer(width, height);
      const src = source.data;
      const dst = output.data;

      const pen = hexToRgb(penColor);
      const paper = hexToRgb(paperColor);

      for (let i = 0; i < dst.length; i += 4) {
        dst[i] = paper.r;
        dst[i + 1] = paper.g;
        dst[i + 2] = paper.b;
        dst[i + 3] = 255;
      }

      const radius = Math.floor(dotScale);

      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const sIdx = (y * width + x) * 4;
          const lum = rgbToLuminance(src[sIdx]!, src[sIdx + 1]!, src[sIdx + 2]!) / 255;
          const prob = Math.pow(1 - lum, 1.8) * density * 0.45;

          const rand = Math.abs((Math.sin(x * 127.1 + y * 311.7) * 43758.5453) % 1);

          if (rand < prob) {
            const dotR = sampleColor ? src[sIdx]! : pen.r;
            const dotG = sampleColor ? src[sIdx + 1]! : pen.g;
            const dotB = sampleColor ? src[sIdx + 2]! : pen.b;

            for (let dy = -radius; dy <= radius; dy++) {
              for (let dx = -radius; dx <= radius; dx++) {
                const px = clamp(x + dx, 0, width - 1);
                const py = clamp(y + dy, 0, height - 1);
                const pIdx = (py * width + px) * 4;
                dst[pIdx] = dotR;
                dst[pIdx + 1] = dotG;
                dst[pIdx + 2] = dotB;
              }
            }
          }
        }
      }
      return output;
    },
  },

  // 26. Woodcut Relief Carving
  {
    id: 'woodcut-relief',
    name: 'Woodcut Relief Block Print',
    category: 'printmaking',
    description: 'Traditional woodblock printing: sharp relief chisel gouges following high-contrast tonal boundaries.',
    tags: ['woodcut', 'relief', 'block-print', 'woodblock', 'printmaking'],
    parameters: {
      chiselStroke: { id: 'chiselStroke', name: 'Gouge Stroke Length', type: 'range', min: 2, max: 12, step: 1, default: 6 },
      threshold: { id: 'threshold', name: 'Relief Threshold', type: 'range', min: 50, max: 200, step: 5, default: 115 },
      colorMode: {
        id: 'colorMode',
        name: 'Color Mode',
        type: 'select',
        options: [
          { label: 'Original Wood Ink Toning', value: 'color' },
          { label: 'Japanese Sumi Ink (Black/White)', value: 'sumi' },
          { label: 'Vermilion Red Block', value: 'red' },
        ],
        default: 'color',
      },
    },
    apply: (source, { chiselStroke = 6, threshold = 115, colorMode = 'color' }) => {
      const { width, height } = source;
      const output = createImageBuffer(width, height);
      const src = source.data;
      const dst = output.data;

      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const sIdx = (y * width + x) * 4;
          const lum = rgbToLuminance(src[sIdx]!, src[sIdx + 1]!, src[sIdx + 2]!);

          // Wood fiber grain modulation
          const fiber = Math.sin(y * 0.8 + Math.sin(x * 0.1) * 3) * (chiselStroke * 3);
          const isCarved = lum + fiber > threshold;

          const dIdx = (y * width + x) * 4;
          if (isCarved) {
            dst[dIdx] = 250;
            dst[dIdx + 1] = 248;
            dst[dIdx + 2] = 240;
          } else {
            if (colorMode === 'color') {
              dst[dIdx] = src[sIdx]!;
              dst[dIdx + 1] = src[sIdx + 1]!;
              dst[dIdx + 2] = src[sIdx + 2]!;
            } else if (colorMode === 'red') {
              dst[dIdx] = 180;
              dst[dIdx + 1] = 20;
              dst[dIdx + 2] = 20;
            } else {
              dst[dIdx] = 20;
              dst[dIdx + 1] = 20;
              dst[dIdx + 2] = 25;
            }
          }
          dst[dIdx + 3] = 255;
        }
      }
      return output;
    },
  },

  // 27. Mezzotint Copperplate Grain
  {
    id: 'mezzotint-grain',
    name: 'Mezzotint Copperplate Grain',
    category: 'printmaking',
    description: '17th-century copperplate rocker texture: velvety deep blacks scraped and burnished into radiant highlights.',
    tags: ['mezzotint', 'copperplate', 'intaglio', 'printmaking', 'rocker'],
    parameters: {
      burrDensity: { id: 'burrDensity', name: 'Rocker Burr Density', type: 'range', min: 2, max: 10, step: 1, default: 4 },
      contrast: { id: 'contrast', name: 'Burnish Contrast', type: 'range', min: 0.8, max: 2.2, step: 0.1, default: 1.3 },
      colorTint: { id: 'colorTint', name: 'Color Plate Mode', type: 'boolean', default: false },
    },
    apply: (source, { burrDensity = 4, contrast = 1.3, colorTint = false }) => {
      const { width, height } = source;
      const output = createImageBuffer(width, height);
      const src = source.data;
      const dst = output.data;

      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const sIdx = (y * width + x) * 4;
          const lum = rgbToLuminance(src[sIdx]!, src[sIdx + 1]!, src[sIdx + 2]!) / 255;

          // Cross-hatched rocker burr texture
          const n1 = Math.sin(x * 1.5 + y * 1.5) * 40;
          const n2 = Math.cos(x * 1.5 - y * 1.5) * 40;
          const burr = ((n1 + n2) / 80) * (burrDensity * 12);

          let v = ((lum - 0.5) * contrast + 0.5) * 255 + burr;
          v = clamp(v);

          const dIdx = (y * width + x) * 4;
          if (colorTint) {
            dst[dIdx] = clamp(src[sIdx]! * (v / 255));
            dst[dIdx + 1] = clamp(src[sIdx + 1]! * (v / 255));
            dst[dIdx + 2] = clamp(src[sIdx + 2]! * (v / 255));
          } else {
            dst[dIdx] = v;
            dst[dIdx + 1] = v;
            dst[dIdx + 2] = v;
          }
          dst[dIdx + 3] = 255;
        }
      }
      return output;
    },
  },

  // 28. Cyanotype Chemical Sun Print
  {
    id: 'cyanotype-chemical',
    name: 'Cyanotype Chemical Sun Print',
    category: 'printmaking',
    description: '1840s sun exposure on ferric ammonium citrate and potassium ferricyanide: rich Prussian blues and paper washes.',
    tags: ['cyanotype', 'blueprint', 'chemical', 'prussian-blue', 'sun-print'],
    parameters: {
      intensity: { id: 'intensity', name: 'Prussian Blue Saturation', type: 'range', min: 0.6, max: 1.6, step: 0.05, default: 1.15 },
      washWarmth: { id: 'washWarmth', name: 'Paper Oxidation Tint', type: 'range', min: 0, max: 1, step: 0.05, default: 0.3 },
    },
    apply: (source, { intensity = 1.15, washWarmth = 0.3 }) => {
      const output = createImageBuffer(source.width, source.height);
      const src = source.data;
      const dst = output.data;
      const len = src.length;

      const pBlue = { r: 0, g: 30 * intensity, b: 85 * intensity };
      const paper = {
        r: lerp(225, 248, washWarmth),
        g: lerp(240, 245, washWarmth),
        b: lerp(248, 220, washWarmth),
      };

      for (let i = 0; i < len; i += 4) {
        const lum = rgbToLuminance(src[i]!, src[i + 1]!, src[i + 2]!) / 255;
        const exp = Math.pow(lum, 1.3);

        dst[i] = clamp(Math.round(lerp(pBlue.r, paper.r, exp)));
        dst[i + 1] = clamp(Math.round(lerp(pBlue.g, paper.g, exp)));
        dst[i + 2] = clamp(Math.round(lerp(pBlue.b, paper.b, exp)));
        dst[i + 3] = 255;
      }
      return output;
    },
  },

  // 29. Silkscreen Poster Stencil
  {
    id: 'silkscreen-stencil',
    name: 'Silkscreen Poster Stencil',
    category: 'printmaking',
    description: 'Bold flat screenprinting stencils: quantizes tonal regions into discrete graphic enamel color planes.',
    tags: ['silkscreen', 'screenprint', 'stencil', 'poster', 'graphic'],
    parameters: {
      colorPlates: { id: 'colorPlates', name: 'Number of Inks per Channel', type: 'range', min: 2, max: 6, step: 1, default: 3 },
      inkVibrance: { id: 'inkVibrance', name: 'Enamel Pigment Boost', type: 'range', min: 1, max: 2.2, step: 0.1, default: 1.4 },
    },
    apply: (source, { colorPlates = 3, inkVibrance = 1.4 }) => {
      const output = createImageBuffer(source.width, source.height);
      const src = source.data;
      const dst = output.data;
      const len = src.length;

      const step = 255 / (colorPlates - 1);

      for (let i = 0; i < len; i += 4) {
        let r = src[i]!;
        let g = src[i + 1]!;
        let b = src[i + 2]!;

        const lum = rgbToLuminance(r, g, b);
        r = lum + (r - lum) * inkVibrance;
        g = lum + (g - lum) * inkVibrance;
        b = lum + (b - lum) * inkVibrance;

        dst[i] = clamp(Math.round(Math.round(r / step) * step));
        dst[i + 1] = clamp(Math.round(Math.round(g / step) * step));
        dst[i + 2] = clamp(Math.round(Math.round(b / step) * step));
        dst[i + 3] = 255;
      }
      return output;
    },
  },

  // 30. Linocut Block Printmaking
  {
    id: 'linocut-block',
    name: 'Linocut Carved Block Print',
    category: 'printmaking',
    description: 'Chiseled linoleum gouges with ink edge-bleed simulation.',
    tags: ['linocut', 'linoleum', 'block', 'carving', 'printmaking'],
    parameters: {
      gougeDepth: { id: 'gougeDepth', name: 'Gouge Angle Depth', type: 'range', min: 1, max: 8, step: 1, default: 4 },
      inkColor: { id: 'inkColor', name: 'Block Ink Color', type: 'color', default: '#18181b' },
      paperColor: { id: 'paperColor', name: 'Washi Paper Color', type: 'color', default: '#faf5ea' },
    },
    apply: (source, { gougeDepth = 4, inkColor = '#18181b', paperColor = '#faf5ea' }) => {
      const { width, height } = source;
      const output = createImageBuffer(width, height);
      const src = source.data;
      const dst = output.data;

      const ink = hexToRgb(inkColor);
      const paper = hexToRgb(paperColor);

      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const sIdx = (y * width + x) * 4;
          const lum = rgbToLuminance(src[sIdx]!, src[sIdx + 1]!, src[sIdx + 2]!);

          // Angled carving cut ripples
          const cut = Math.sin((x + y) * 0.4) * (gougeDepth * 4);
          const isCarved = lum + cut > 120;

          const dIdx = (y * width + x) * 4;
          if (isCarved) {
            dst[dIdx] = paper.r;
            dst[dIdx + 1] = paper.g;
            dst[dIdx + 2] = paper.b;
          } else {
            dst[dIdx] = ink.r;
            dst[dIdx + 1] = ink.g;
            dst[dIdx + 2] = ink.b;
          }
          dst[dIdx + 3] = 255;
        }
      }
      return output;
    },
  },

  // 31. Lithographic Stone Grain
  {
    id: 'litho-limestone',
    name: 'Lithographic Limestone Grain',
    category: 'printmaking',
    description: 'Tusche crayon on Bavarian limestone: microscopic granular tooth of limestone slabs.',
    tags: ['lithography', 'stone', 'crayon', 'tusche', 'printmaking'],
    parameters: {
      graininess: { id: 'graininess', name: 'Stone Grain Roughness', type: 'range', min: 10, max: 60, step: 2, default: 28 },
      colorMode: { id: 'colorMode', name: 'Full Color Tusche', type: 'boolean', default: true },
    },
    apply: (source, { graininess = 28, colorMode = true }) => {
      const { width, height } = source;
      const output = createImageBuffer(width, height);
      const src = source.data;
      const dst = output.data;

      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const idx = (y * width + x) * 4;
          const seed = Math.sin(x * 91.3 + y * 37.7) * 43758.5453;
          const noise = ((seed - Math.floor(seed)) - 0.5) * 2 * graininess;

          if (colorMode) {
            dst[idx] = clamp(src[idx]! + noise);
            dst[idx + 1] = clamp(src[idx + 1]! + noise);
            dst[idx + 2] = clamp(src[idx + 2]! + noise);
          } else {
            const lum = clamp(rgbToLuminance(src[idx]!, src[idx + 1]!, src[idx + 2]!) + noise);
            dst[idx] = lum;
            dst[idx + 1] = lum;
            dst[idx + 2] = lum;
          }
          dst[idx + 3] = 255;
        }
      }
      return output;
    },
  },

  // 32. Thermal Receipt Paper Print
  {
    id: 'thermal-receipt',
    name: 'Thermal Receipt Paper Print',
    category: 'printmaking',
    description: 'Point-of-sale thermal head burnout: dithered microdot heating on heat-sensitive chemically treated receipt paper.',
    tags: ['thermal', 'receipt', 'pos', 'dither', 'paper'],
    parameters: {
      dotDensity: { id: 'dotDensity', name: 'Heat Intensity', type: 'range', min: 0.8, max: 2.0, step: 0.1, default: 1.2 },
      fadeBurn: { id: 'fadeBurn', name: 'Thermal Fade Bleed', type: 'range', min: 0, max: 40, step: 2, default: 12 },
    },
    apply: (source, { dotDensity = 1.2, fadeBurn = 12 }) => {
      const { width, height } = source;
      const output = createImageBuffer(width, height);
      const src = source.data;
      const dst = output.data;

      for (let y = 0; y < height; y++) {
        // Horizontal receipt feed lines
        const isFeedLine = y % 200 === 0;

        for (let x = 0; x < width; x++) {
          const idx = (y * width + x) * 4;
          const lum = rgbToLuminance(src[idx]!, src[idx + 1]!, src[idx + 2]!);
          const burnThreshold = (1 - (lum / 255) * dotDensity) * 255;

          const rand = Math.abs((Math.sin(x * 12.98 + y * 78.23) * 43758.5) % 1) * 255;
          const isBurned = rand < burnThreshold;

          if (isFeedLine) {
            dst[idx] = 180;
            dst[idx + 1] = 180;
            dst[idx + 2] = 180;
          } else if (isBurned) {
            // Dark purple/charcoal thermal burn
            dst[idx] = 25 + fadeBurn;
            dst[idx + 1] = 20 + fadeBurn;
            dst[idx + 2] = 35 + fadeBurn;
          } else {
            // Off-white thermal roll
            dst[idx] = 245;
            dst[idx + 1] = 245;
            dst[idx + 2] = 242;
          }
          dst[idx + 3] = 255;
        }
      }
      return output;
    },
  },
];
