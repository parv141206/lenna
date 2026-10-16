import type { EffectDefinition } from '../types';
import {
  clamp,
  createImageBuffer,
  hexToRgb,
  lerp,
  rgbToCmyk,
  rgbToLuminance,
} from '../matrix';

export const halftoneEffects: EffectDefinition[] = [
  // 1. Newsprint Halftone Screen
  {
    id: 'newsprint-halftone',
    name: 'Newsprint Halftone Screen',
    category: 'halftone',
    description: 'Analog angled print screen: transforms continuous tone into a grid of variable-diameter dots with full color or custom ink.',
    tags: ['halftone', 'newsprint', 'screen', 'dots', 'print'],
    parameters: {
      dotSpacing: { id: 'dotSpacing', name: 'Screen Pitch (Dot Spacing)', type: 'range', min: 4, max: 24, step: 1, default: 8 },
      angle: { id: 'angle', name: 'Screen Angle (deg)', type: 'range', min: 0, max: 90, step: 5, default: 45 },
      colorMode: {
        id: 'colorMode',
        name: 'Color Mode',
        type: 'select',
        options: [
          { label: 'Full Color Dots', value: 'color' },
          { label: 'Custom Spot Ink', value: 'custom' },
          { label: 'Monochrome Black Ink', value: 'mono' },
        ],
        default: 'color',
      },
      inkColor: { id: 'inkColor', name: 'Spot Ink Color (Custom Mode)', type: 'color', default: '#0f172a' },
      paperColor: { id: 'paperColor', name: 'Paper Stock Color', type: 'color', default: '#f8fafc' },
      contrast: { id: 'contrast', name: 'Tonal Contrast', type: 'range', min: 0.5, max: 2.2, step: 0.1, default: 1.2 },
    },
    apply: (source, { dotSpacing = 8, angle = 45, colorMode = 'color', inkColor = '#0f172a', paperColor = '#f8fafc', contrast = 1.2 }) => {
      const { width, height } = source;
      const output = createImageBuffer(width, height);
      const src = source.data;
      const dst = output.data;

      const ink = hexToRgb(inkColor);
      const paper = hexToRgb(paperColor);

      const rad = (angle * Math.PI) / 180;
      const cosA = Math.cos(rad);
      const sinA = Math.sin(rad);
      const maxRadius = (dotSpacing * Math.SQRT2) / 2;

      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const rotX = x * cosA - y * sinA;
          const rotY = x * sinA + y * cosA;

          const cellX = Math.floor(rotX / dotSpacing) * dotSpacing + dotSpacing / 2;
          const cellY = Math.floor(rotY / dotSpacing) * dotSpacing + dotSpacing / 2;

          const origCenterX = clamp(Math.round(cellX * cosA + cellY * sinA), 0, width - 1);
          const origCenterY = clamp(Math.round(-cellX * sinA + cellY * cosA), 0, height - 1);

          const sampleIdx = (origCenterY * width + origCenterX) * 4;
          const lum = rgbToLuminance(src[sampleIdx]!, src[sampleIdx + 1]!, src[sampleIdx + 2]!) / 255;

          let darkness = 1 - lum;
          darkness = clamp((darkness - 0.5) * contrast + 0.5, 0, 1);
          const targetRadius = darkness * maxRadius;

          const dist = Math.hypot(rotX - cellX, rotY - cellY);
          const alpha = clamp(1 - (dist - targetRadius), 0, 1);

          const dIdx = (y * width + x) * 4;
          if (colorMode === 'color') {
            const r = src[sampleIdx]!;
            const g = src[sampleIdx + 1]!;
            const b = src[sampleIdx + 2]!;
            dst[dIdx] = Math.round(lerp(paper.r, r, alpha));
            dst[dIdx + 1] = Math.round(lerp(paper.g, g, alpha));
            dst[dIdx + 2] = Math.round(lerp(paper.b, b, alpha));
          } else if (colorMode === 'custom') {
            dst[dIdx] = Math.round(lerp(paper.r, ink.r, alpha));
            dst[dIdx + 1] = Math.round(lerp(paper.g, ink.g, alpha));
            dst[dIdx + 2] = Math.round(lerp(paper.b, ink.b, alpha));
          } else {
            dst[dIdx] = Math.round(lerp(255, 10, alpha));
            dst[dIdx + 1] = Math.round(lerp(255, 10, alpha));
            dst[dIdx + 2] = Math.round(lerp(255, 10, alpha));
          }
          dst[dIdx + 3] = 255;
        }
      }
      return output;
    },
  },

  // 2. Roy Lichtenstein Comic Polka Dots
  {
    id: 'comic-polka',
    name: 'Roy Lichtenstein Ben-Day Polka Dots',
    category: 'halftone',
    description: '1960s pop art comic book Ben-Day dots: bold vibrant colored polka dots with optional ink ring outlines.',
    tags: ['polka-dots', 'pop-art', 'benday', 'comic', 'lichtenstein'],
    parameters: {
      spacing: { id: 'spacing', name: 'Dot Spacing (Grid Size)', type: 'range', min: 6, max: 36, step: 2, default: 12 },
      dotScale: { id: 'dotScale', name: 'Dot Radius Scale', type: 'range', min: 0.2, max: 1.0, step: 0.05, default: 0.7 },
      backgroundColor: { id: 'backgroundColor', name: 'Background Canvas', type: 'color', default: '#ffffff' },
      outline: { id: 'outline', name: 'Black Outline Rings', type: 'boolean', default: false },
      variableSize: { id: 'variableSize', name: 'Modulate Size by Darkness', type: 'boolean', default: false },
    },
    apply: (source, { spacing = 12, dotScale = 0.7, backgroundColor = '#ffffff', outline = false, variableSize = false }) => {
      const { width, height } = source;
      const output = createImageBuffer(width, height);
      const src = source.data;
      const dst = output.data;

      const bg = hexToRgb(backgroundColor);
      const half = spacing / 2;
      const baseRadius = half * dotScale;

      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const cellX = Math.floor(x / spacing) * spacing + half;
          const cellY = Math.floor(y / spacing) * spacing + half;

          const cx = clamp(Math.round(cellX), 0, width - 1);
          const cy = clamp(Math.round(cellY), 0, height - 1);
          const sampleIdx = (cy * width + cx) * 4;

          const lum = rgbToLuminance(src[sampleIdx]!, src[sampleIdx + 1]!, src[sampleIdx + 2]!) / 255;
          const maxR = variableSize ? baseRadius * (1 - lum * 0.7) : baseRadius;

          const dist = Math.hypot(x - cellX, y - cellY);
          const dIdx = (y * width + x) * 4;

          if (dist <= maxR) {
            if (outline && dist >= maxR - 1.2) {
              dst[dIdx] = 15;
              dst[dIdx + 1] = 15;
              dst[dIdx + 2] = 15;
            } else {
              dst[dIdx] = src[sampleIdx]!;
              dst[dIdx + 1] = src[sampleIdx + 1]!;
              dst[dIdx + 2] = src[sampleIdx + 2]!;
            }
          } else {
            dst[dIdx] = bg.r;
            dst[dIdx + 1] = bg.g;
            dst[dIdx + 2] = bg.b;
          }
          dst[dIdx + 3] = 255;
        }
      }
      return output;
    },
  },

  // 3. CMYK 4-Pass Process Rosette
  {
    id: 'cmyk-rosette',
    name: 'CMYK 4-Pass Process Rosette',
    category: 'halftone',
    description: 'Offset printing separation using classic angled screens (C 15°, M 75°, Y 0°, K 45°) to generate genuine rosette moiré patterns.',
    tags: ['cmyk', 'rosette', 'offset', 'print', 'press', 'moire'],
    parameters: {
      screenFrequency: { id: 'screenFrequency', name: 'Screen Pitch (Dot Spacing)', type: 'range', min: 4, max: 18, step: 1, default: 7 },
      inkDensity: { id: 'inkDensity', name: 'Ink Load Multiplier', type: 'range', min: 0.6, max: 1.8, step: 0.05, default: 1.15 },
      paperTint: { id: 'paperTint', name: 'Paper Stock Tint', type: 'color', default: '#ffffff' },
    },
    apply: (source, { screenFrequency = 7, inkDensity = 1.15, paperTint = '#ffffff' }) => {
      const { width, height } = source;
      const output = createImageBuffer(width, height);
      const src = source.data;
      const dst = output.data;

      const angles = {
        c: (15 * Math.PI) / 180,
        m: (75 * Math.PI) / 180,
        y: (0 * Math.PI) / 180,
        k: (45 * Math.PI) / 180,
      };

      const maxR = (screenFrequency * Math.SQRT2) / 2;
      const paper = hexToRgb(paperTint);

      const evalPlate = (x: number, y: number, angleRad: number, plateVal: number) => {
        const cosA = Math.cos(angleRad);
        const sinA = Math.sin(angleRad);
        const rotX = x * cosA - y * sinA;
        const rotY = x * sinA + y * cosA;

        const cellX = Math.floor(rotX / screenFrequency) * screenFrequency + screenFrequency / 2;
        const cellY = Math.floor(rotY / screenFrequency) * screenFrequency + screenFrequency / 2;

        const dist = Math.hypot(rotX - cellX, rotY - cellY);
        const targetR = clamp(plateVal * inkDensity, 0, 1) * maxR;

        return clamp(1 - (dist - targetR), 0, 1);
      };

      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const idx = (y * width + x) * 4;
          const cmyk = rgbToCmyk(src[idx]!, src[idx + 1]!, src[idx + 2]!);

          const dotC = evalPlate(x, y, angles.c, cmyk.c);
          const dotM = evalPlate(x, y, angles.m, cmyk.m);
          const dotY = evalPlate(x, y, angles.y, cmyk.y);
          const dotK = evalPlate(x, y, angles.k, cmyk.k);

          const r = paper.r * (1 - dotC) * (1 - dotK);
          const g = paper.g * (1 - dotM) * (1 - dotK);
          const b = paper.b * (1 - dotY) * (1 - dotK);

          dst[idx] = clamp(Math.round(r));
          dst[idx + 1] = clamp(Math.round(g));
          dst[idx + 2] = clamp(Math.round(b));
          dst[idx + 3] = 255;
        }
      }
      return output;
    },
  },

  // 4. Hexagonal Honeycomb Dot Screen
  {
    id: 'honeycomb-hex-dots',
    name: 'Hexagonal Honeycomb Dot Screen',
    category: 'halftone',
    description: 'Dense triangular-packed hexagonal dot lattice with color preservation or dual-tone graphic ink.',
    tags: ['hexagonal', 'honeycomb', 'dots', 'packing', 'pattern'],
    parameters: {
      spacing: { id: 'spacing', name: 'Hex Spacing (px)', type: 'range', min: 6, max: 28, step: 2, default: 12 },
      colorMode: {
        id: 'colorMode',
        name: 'Color Mode',
        type: 'select',
        options: [
          { label: 'Full RGB Color Dots', value: 'color' },
          { label: 'Electric Cyan & Deep Black', value: 'cyan' },
          { label: 'Fluorescent Orange & Cream', value: 'orange' },
          { label: 'Monochrome Black Ink', value: 'mono' },
        ],
        default: 'color',
      },
    },
    apply: (source, { spacing = 12, colorMode = 'color' }) => {
      const { width, height } = source;
      const output = createImageBuffer(width, height);
      const src = source.data;
      const dst = output.data;

      const rowH = (spacing * Math.sqrt(3)) / 2;
      const maxR = spacing * 0.48;

      for (let y = 0; y < height; y++) {
        const row = Math.floor(y / rowH);
        const isOdd = row % 2 !== 0;
        const xOffset = isOdd ? spacing / 2 : 0;
        const cy = row * rowH + rowH / 2;

        for (let x = 0; x < width; x++) {
          const col = Math.floor((x - xOffset) / spacing);
          const cx = col * spacing + xOffset + spacing / 2;

          const sx = clamp(Math.round(cx), 0, width - 1);
          const sy = clamp(Math.round(cy), 0, height - 1);
          const sIdx = (sy * width + sx) * 4;

          const lum = rgbToLuminance(src[sIdx]!, src[sIdx + 1]!, src[sIdx + 2]!) / 255;
          const targetR = (1 - lum) * maxR;

          const dist = Math.hypot(x - cx, y - cy);
          const dIdx = (y * width + x) * 4;

          if (dist <= targetR) {
            if (colorMode === 'color') {
              dst[dIdx] = src[sIdx]!;
              dst[dIdx + 1] = src[sIdx + 1]!;
              dst[dIdx + 2] = src[sIdx + 2]!;
            } else if (colorMode === 'cyan') {
              dst[dIdx] = 0;
              dst[dIdx + 1] = 230;
              dst[dIdx + 2] = 255;
            } else if (colorMode === 'orange') {
              dst[dIdx] = 255;
              dst[dIdx + 1] = 90;
              dst[dIdx + 2] = 20;
            } else {
              dst[dIdx] = 15;
              dst[dIdx + 1] = 15;
              dst[dIdx + 2] = 15;
            }
          } else {
            dst[dIdx] = 248;
            dst[dIdx + 1] = 248;
            dst[dIdx + 2] = 248;
          }
          dst[dIdx + 3] = 255;
        }
      }
      return output;
    },
  },

  // 5. Concentric Circular Wave Screen
  {
    id: 'concentric-circular-dots',
    name: 'Concentric Circular Wave Screen',
    category: 'halftone',
    description: 'Radial wave dot screening: modulates dot scale along circular concentric ripples radiating from center.',
    tags: ['circular', 'ripple', 'radial', 'wave', 'dots'],
    parameters: {
      ringFrequency: { id: 'ringFrequency', name: 'Ring Spacing (px)', type: 'range', min: 4, max: 24, step: 1, default: 8 },
      angularDensity: { id: 'angularDensity', name: 'Angular Steps', type: 'range', min: 20, max: 120, step: 5, default: 60 },
      preserveColor: { id: 'preserveColor', name: 'Full Color Dots', type: 'boolean', default: true },
    },
    apply: (source, { ringFrequency = 8, angularDensity = 60, preserveColor = true }) => {
      const { width, height } = source;
      const output = createImageBuffer(width, height);
      const src = source.data;
      const dst = output.data;

      const midX = width / 2;
      const midY = height / 2;

      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const dx = x - midX;
          const dy = y - midY;
          const dist = Math.hypot(dx, dy);
          const theta = Math.atan2(dy, dx) + Math.PI;

          const ringIndex = Math.floor(dist / ringFrequency);
          const ringCenter = ringIndex * ringFrequency + ringFrequency / 2;

          const angleStep = (2 * Math.PI) / angularDensity;
          const angleIndex = Math.floor(theta / angleStep);
          const angleCenter = angleIndex * angleStep + angleStep / 2;

          const sampleX = clamp(Math.round(midX + ringCenter * Math.cos(angleCenter)), 0, width - 1);
          const sampleY = clamp(Math.round(midY + ringCenter * Math.sin(angleCenter)), 0, height - 1);
          const sIdx = (sampleY * width + sampleX) * 4;

          const lum = rgbToLuminance(src[sIdx]!, src[sIdx + 1]!, src[sIdx + 2]!) / 255;
          const cellDist = Math.hypot(dist - ringCenter, (theta - angleCenter) * ringCenter);
          const maxR = (ringFrequency / 2) * (1 - lum);

          const dIdx = (y * width + x) * 4;
          if (cellDist <= maxR) {
            if (preserveColor) {
              dst[dIdx] = src[sIdx]!;
              dst[dIdx + 1] = src[sIdx + 1]!;
              dst[dIdx + 2] = src[sIdx + 2]!;
            } else {
              dst[dIdx] = 15;
              dst[dIdx + 1] = 15;
              dst[dIdx + 2] = 20;
            }
          } else {
            dst[dIdx] = 250;
            dst[dIdx + 1] = 250;
            dst[dIdx + 2] = 250;
          }
          dst[dIdx + 3] = 255;
        }
      }
      return output;
    },
  },

  // 6. Logarithmic Spiral Dot Matrix
  {
    id: 'spiral-dots',
    name: 'Logarithmic Golden Spiral Dots',
    category: 'halftone',
    description: 'Golden ratio spiral coordinate mapping: expands dots along an Archimedean / logarithmic phyllotaxis spiral.',
    tags: ['spiral', 'golden-ratio', 'phyllotaxis', 'generative', 'dots'],
    parameters: {
      spiralTightness: { id: 'spiralTightness', name: 'Spiral Spacing (a)', type: 'range', min: 2, max: 12, step: 0.5, default: 5 },
      angleStep: { id: 'angleStep', name: 'Angular Pitch (deg)', type: 'range', min: 10, max: 137.5, step: 2.5, default: 45 },
      preserveColor: { id: 'preserveColor', name: 'Sample Image Color', type: 'boolean', default: true },
    },
    apply: (source, { spiralTightness = 5, angleStep = 45, preserveColor = true }) => {
      const { width, height } = source;
      const output = createImageBuffer(width, height);
      const src = source.data;
      const dst = output.data;

      // Fill paper white
      for (let i = 0; i < dst.length; i += 4) {
        dst[i] = 250;
        dst[i + 1] = 250;
        dst[i + 2] = 250;
        dst[i + 3] = 255;
      }

      const midX = width / 2;
      const midY = height / 2;
      const maxR = Math.hypot(midX, midY);
      const radStep = (angleStep * Math.PI) / 180;

      let r = 0;
      let theta = 0;

      while (r < maxR) {
        theta += radStep;
        r = spiralTightness * Math.sqrt(theta * 10);

        const px = Math.round(midX + r * Math.cos(theta));
        const py = Math.round(midY + r * Math.sin(theta));

        if (px >= 0 && px < width && py >= 0 && py < height) {
          const sIdx = (py * width + px) * 4;
          const lum = rgbToLuminance(src[sIdx]!, src[sIdx + 1]!, src[sIdx + 2]!) / 255;
          const dotRadius = Math.max(1, Math.round((1 - lum) * (spiralTightness * 1.4)));

          for (let dy = -dotRadius; dy <= dotRadius; dy++) {
            for (let dx = -dotRadius; dx <= dotRadius; dx++) {
              if (dx * dx + dy * dy <= dotRadius * dotRadius) {
                const tx = clamp(px + dx, 0, width - 1);
                const ty = clamp(py + dy, 0, height - 1);
                const dIdx = (ty * width + tx) * 4;

                if (preserveColor) {
                  dst[dIdx] = src[sIdx]!;
                  dst[dIdx + 1] = src[sIdx + 1]!;
                  dst[dIdx + 2] = src[sIdx + 2]!;
                } else {
                  dst[dIdx] = 18;
                  dst[dIdx + 1] = 18;
                  dst[dIdx + 2] = 22;
                }
              }
            }
          }
        }
      }

      return output;
    },
  },

  // 7. Linear Line Raster Screen
  {
    id: 'linear-line-screen',
    name: 'Variable-Width Line Raster Screen',
    category: 'halftone',
    description: 'Continuous engraving line raster: modulates stroke thickness proportionally to shadow density.',
    tags: ['line-screen', 'engraving', 'raster', 'print', 'linework'],
    parameters: {
      lineSpacing: { id: 'lineSpacing', name: 'Line Pitch (px)', type: 'range', min: 4, max: 20, step: 1, default: 8 },
      angle: { id: 'angle', name: 'Screen Angle (deg)', type: 'range', min: 0, max: 90, step: 5, default: 0 },
      colorMode: {
        id: 'colorMode',
        name: 'Color Mode',
        type: 'select',
        options: [
          { label: 'Full Color Lines', value: 'color' },
          { label: 'Custom Palette (Ink & Paper Shades)', value: 'mono' },
        ],
        default: 'mono',
      },
      inkColor: { id: 'inkColor', name: 'Dark / Ink Shade', type: 'color', default: '#101014' },
      paperColor: { id: 'paperColor', name: 'Light / Paper Shade', type: 'color', default: '#fafaf9' },
    },
    apply: (source, { lineSpacing = 8, angle = 0, colorMode = 'mono', inkColor = '#101014', paperColor = '#fafaf9' }) => {
      const { width, height } = source;
      const output = createImageBuffer(width, height);
      const src = source.data;
      const dst = output.data;

      const pRgb = hexToRgb(paperColor);
      const iRgb = hexToRgb(inkColor);

      const rad = (angle * Math.PI) / 180;
      const cosA = Math.cos(rad);
      const sinA = Math.sin(rad);

      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const rotY = x * sinA + y * cosA;
          const posInCell = ((rotY % lineSpacing) + lineSpacing) % lineSpacing;
          const centerDist = Math.abs(posInCell - lineSpacing / 2);

          const sIdx = (y * width + x) * 4;
          const lum = rgbToLuminance(src[sIdx]!, src[sIdx + 1]!, src[sIdx + 2]!) / 255;
          const strokeWidth = (1 - lum) * (lineSpacing / 2);

          const dIdx = (y * width + x) * 4;
          if (centerDist <= strokeWidth) {
            if (colorMode === 'color') {
              dst[dIdx] = src[sIdx]!;
              dst[dIdx + 1] = src[sIdx + 1]!;
              dst[dIdx + 2] = src[sIdx + 2]!;
            } else {
              dst[dIdx] = iRgb.r;
              dst[dIdx + 1] = iRgb.g;
              dst[dIdx + 2] = iRgb.b;
            }
          } else {
            dst[dIdx] = pRgb.r;
            dst[dIdx + 1] = pRgb.g;
            dst[dIdx + 2] = pRgb.b;
          }
          dst[dIdx + 3] = 255;
        }
      }
      return output;
    },
  },

  // 8. Diamond Rhombus Screen
  {
    id: 'diamond-rhombus-screen',
    name: 'Diamond Rhombus Halftone Screen',
    category: 'halftone',
    description: 'Rhombic 45-degree diamond screen where squares expand diagonally as tones deepen.',
    tags: ['diamond', 'rhombus', 'geometry', 'halftone', 'screen'],
    parameters: {
      gridSize: { id: 'gridSize', name: 'Diamond Grid Pitch', type: 'range', min: 6, max: 24, step: 2, default: 10 },
      colorMode: {
        id: 'colorMode',
        name: 'Color Mode',
        type: 'select',
        options: [
          { label: 'Full Color Diamonds', value: 'color' },
          { label: 'Custom Palette (Ink & Paper Shades)', value: 'mono' },
        ],
        default: 'mono',
      },
      inkColor: { id: 'inkColor', name: 'Dark / Ink Shade', type: 'color', default: '#141416' },
      paperColor: { id: 'paperColor', name: 'Light / Paper Shade', type: 'color', default: '#fafafa' },
    },
    apply: (source, { gridSize = 10, colorMode = 'mono', inkColor = '#141416', paperColor = '#fafafa' }) => {
      const { width, height } = source;
      const output = createImageBuffer(width, height);
      const src = source.data;
      const dst = output.data;

      const pRgb = hexToRgb(paperColor);
      const iRgb = hexToRgb(inkColor);
      const half = gridSize / 2;

      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const cx = Math.floor(x / gridSize) * gridSize + half;
          const cy = Math.floor(y / gridSize) * gridSize + half;

          const sx = clamp(cx, 0, width - 1);
          const sy = clamp(cy, 0, height - 1);
          const sIdx = (sy * width + sx) * 4;

          const lum = rgbToLuminance(src[sIdx]!, src[sIdx + 1]!, src[sIdx + 2]!) / 255;
          const manhattan = Math.abs(x - cx) + Math.abs(y - cy);
          const maxDist = (1 - lum) * gridSize;

          const dIdx = (y * width + x) * 4;
          if (manhattan <= maxDist) {
            if (colorMode === 'color') {
              dst[dIdx] = src[sIdx]!;
              dst[dIdx + 1] = src[sIdx + 1]!;
              dst[dIdx + 2] = src[sIdx + 2]!;
            } else {
              dst[dIdx] = iRgb.r;
              dst[dIdx + 1] = iRgb.g;
              dst[dIdx + 2] = iRgb.b;
            }
          } else {
            dst[dIdx] = pRgb.r;
            dst[dIdx + 1] = pRgb.g;
            dst[dIdx + 2] = pRgb.b;
          }
          dst[dIdx + 3] = 255;
        }
      }
      return output;
    },
  },

  // 9. Cross-Mesh Screen Matrix
  {
    id: 'cross-mesh-screen',
    name: 'Cross-Mesh Screen Matrix',
    category: 'halftone',
    description: 'Fine optical textile mesh screen: perpendicular grid bars whose intersecting widths respond to local density.',
    tags: ['mesh', 'grid', 'cross', 'halftone', 'fabric'],
    parameters: {
      pitch: { id: 'pitch', name: 'Mesh Pitch (px)', type: 'range', min: 4, max: 16, step: 1, default: 6 },
      invert: { id: 'invert', name: 'Invert (Dark Background)', type: 'boolean', default: false },
    },
    apply: (source, { pitch = 6, invert = false }) => {
      const { width, height } = source;
      const output = createImageBuffer(width, height);
      const src = source.data;
      const dst = output.data;

      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const sIdx = (y * width + x) * 4;
          const lum = rgbToLuminance(src[sIdx]!, src[sIdx + 1]!, src[sIdx + 2]!) / 255;

          const dx = Math.abs((x % pitch) - pitch / 2);
          const dy = Math.abs((y % pitch) - pitch / 2);
          const stroke = (1 - lum) * (pitch / 2);

          const isLine = dx <= stroke || dy <= stroke;
          const dIdx = (y * width + x) * 4;

          if (isLine !== invert) {
            dst[dIdx] = src[sIdx]!;
            dst[dIdx + 1] = src[sIdx + 1]!;
            dst[dIdx + 2] = src[sIdx + 2]!;
          } else {
            dst[dIdx] = invert ? 10 : 250;
            dst[dIdx + 1] = invert ? 10 : 250;
            dst[dIdx + 2] = invert ? 10 : 250;
          }
          dst[dIdx + 3] = 255;
        }
      }
      return output;
    },
  },

  // 10. Chromatic Misaligned Halftone Dots
  {
    id: 'chromatic-halftone-drift',
    name: 'Chromatic Misaligned Halftone Plates',
    category: 'halftone',
    description: 'Independent physical RGB print screen translation: red, green, and blue dots drift off-registration.',
    tags: ['chromatic', 'misalignment', 'halftone', 'drift', 'rgb-split'],
    parameters: {
      screenFrequency: { id: 'screenFrequency', name: 'Dot Spacing (px)', type: 'range', min: 6, max: 20, step: 1, default: 10 },
      driftAmount: { id: 'driftAmount', name: 'Plate Drift (px)', type: 'range', min: 2, max: 20, step: 1, default: 6 },
    },
    apply: (source, { screenFrequency = 10, driftAmount = 6 }) => {
      const { width, height } = source;
      const output = createImageBuffer(width, height);
      const src = source.data;
      const dst = output.data;

      const evalDot = (x: number, y: number, shiftX: number, shiftY: number, channelOffset: number) => {
        const sx = clamp(x + shiftX, 0, width - 1);
        const sy = clamp(y + shiftY, 0, height - 1);

        const cellX = Math.floor(sx / screenFrequency) * screenFrequency + screenFrequency / 2;
        const cellY = Math.floor(sy / screenFrequency) * screenFrequency + screenFrequency / 2;

        const cx = clamp(Math.round(cellX), 0, width - 1);
        const cy = clamp(Math.round(cellY), 0, height - 1);
        const sIdx = (cy * width + cx) * 4 + channelOffset;

        const val = src[sIdx]! / 255;
        const dist = Math.hypot(sx - cellX, sy - cellY);
        const targetR = (1 - val) * (screenFrequency * 0.48);

        return dist <= targetR ? 0 : 255;
      };

      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const r = evalDot(x, y, driftAmount, 0, 0);
          const g = evalDot(x, y, 0, driftAmount, 1);
          const b = evalDot(x, y, -driftAmount, -driftAmount, 2);

          const dIdx = (y * width + x) * 4;
          dst[dIdx] = r;
          dst[dIdx + 1] = g;
          dst[dIdx + 2] = b;
          dst[dIdx + 3] = 255;
        }
      }
      return output;
    },
  },

  // 11. Negative Punch-Hole Halftone
  {
    id: 'negative-punch-halftone',
    name: 'Negative Punch-Hole Inverted Halftone',
    category: 'halftone',
    description: 'Inverted screen: circular punch holes reveal bright paper from a solid deep colored ink background.',
    tags: ['negative', 'punch', 'stencil', 'halftone', 'inverted'],
    parameters: {
      spacing: { id: 'spacing', name: 'Hole Grid Pitch', type: 'range', min: 6, max: 24, step: 2, default: 10 },
      fillColor: { id: 'fillColor', name: 'Solid Surface Color', type: 'color', default: '#09090b' },
      holeColor: { id: 'holeColor', name: 'Punch Hole Color', type: 'color', default: '#00ffff' },
    },
    apply: (source, { spacing = 10, fillColor = '#09090b', holeColor = '#00ffff' }) => {
      const { width, height } = source;
      const output = createImageBuffer(width, height);
      const src = source.data;
      const dst = output.data;

      const fRgb = hexToRgb(fillColor);
      const hRgb = hexToRgb(holeColor);
      const half = spacing / 2;

      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const cx = Math.floor(x / spacing) * spacing + half;
          const cy = Math.floor(y / spacing) * spacing + half;

          const sx = clamp(cx, 0, width - 1);
          const sy = clamp(cy, 0, height - 1);
          const sIdx = (sy * width + sx) * 4;

          const lum = rgbToLuminance(src[sIdx]!, src[sIdx + 1]!, src[sIdx + 2]!) / 255;
          const targetR = lum * half * 0.95;

          const dist = Math.hypot(x - cx, y - cy);
          const dIdx = (y * width + x) * 4;

          if (dist <= targetR) {
            dst[dIdx] = hRgb.r;
            dst[dIdx + 1] = hRgb.g;
            dst[dIdx + 2] = hRgb.b;
          } else {
            dst[dIdx] = fRgb.r;
            dst[dIdx + 1] = fRgb.g;
            dst[dIdx + 2] = fRgb.b;
          }
          dst[dIdx + 3] = 255;
        }
      }
      return output;
    },
  },

  // 12. FM Stochastic Frequency-Modulated Halftone
  {
    id: 'stochastic-fm-screen',
    name: 'FM Stochastic Frequency-Modulated Screen',
    category: 'halftone',
    description: 'High-end fine-art giclée screening: replaces rigid periodic dot grids with pseudorandom frequency-modulated microdots.',
    tags: ['stochastic', 'fm', 'giclee', 'fineart', 'dots', 'screening'],
    parameters: {
      density: { id: 'density', name: 'Microdot Density', type: 'range', min: 0.5, max: 2.5, step: 0.1, default: 1.2 },
      colorMode: {
        id: 'colorMode',
        name: 'Color Mode',
        type: 'select',
        options: [
          { label: 'Full Color Microdots', value: 'color' },
          { label: 'Custom Palette (Ink & Paper Shades)', value: 'mono' },
        ],
        default: 'mono',
      },
      inkColor: { id: 'inkColor', name: 'Dark / Ink Shade', type: 'color', default: '#121216' },
      paperColor: { id: 'paperColor', name: 'Light / Paper Shade', type: 'color', default: '#fcfcfc' },
    },
    apply: (source, { density = 1.2, colorMode = 'mono', inkColor = '#121216', paperColor = '#fcfcfc' }) => {
      const { width, height } = source;
      const output = createImageBuffer(width, height);
      const src = source.data;
      const dst = output.data;

      const pRgb = hexToRgb(paperColor);
      const iRgb = hexToRgb(inkColor);

      // Fill paper base
      for (let i = 0; i < dst.length; i += 4) {
        dst[i] = pRgb.r;
        dst[i + 1] = pRgb.g;
        dst[i + 2] = pRgb.b;
        dst[i + 3] = 255;
      }

      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const sIdx = (y * width + x) * 4;
          const lum = rgbToLuminance(src[sIdx]!, src[sIdx + 1]!, src[sIdx + 2]!) / 255;
          const prob = Math.pow(1 - lum, 1.4) * density * 0.45;

          const rand = Math.abs((Math.sin(x * 12.9898 + y * 78.233) * 43758.5453) % 1);

          if (rand < prob) {
            const dIdx = (y * width + x) * 4;
            if (colorMode === 'color') {
              dst[dIdx] = src[sIdx]!;
              dst[dIdx + 1] = src[sIdx + 1]!;
              dst[dIdx + 2] = src[sIdx + 2]!;
            } else {
              dst[dIdx] = iRgb.r;
              dst[dIdx + 1] = iRgb.g;
              dst[dIdx + 2] = iRgb.b;
            }
          }
        }
      }
      return output;
    },
  },
];
