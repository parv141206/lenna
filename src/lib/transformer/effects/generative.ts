import type { EffectDefinition } from '../types';
import {
  clamp,
  createImageBuffer,
  hexToRgb,
  rgbToLuminance,
} from '../matrix';

const ASCII_RAMP = ' .\'`^",:;Il!i><~+_-?][}{1)(|\\/tfjrxnuvczXYUJCLQ0OZmwqpdbkhao*#MW&8%B@$';

export const generativeEffects: EffectDefinition[] = [
  // 45. ASCII Typography Matrix
  {
    id: 'ascii-typography-matrix',
    name: 'ASCII Typography Matrix',
    category: 'generative',
    description: 'Typographic character density matrix: converts image into live typography rendered in terminal monospaced glyphs.',
    tags: ['ascii', 'typography', 'terminal', 'matrix', 'code'],
    parameters: {
      cellSize: { id: 'cellSize', name: 'Character Cell Size (px)', type: 'range', min: 6, max: 20, step: 2, default: 10 },
      colorMode: {
        id: 'colorMode',
        name: 'Color Mode',
        type: 'select',
        options: [
          { label: 'Full RGB Color Characters', value: 'color' },
          { label: 'Hacker Terminal Green (#00ff66)', value: 'green' },
          { label: 'Amber CRT Phosphor (#ffb000)', value: 'amber' },
          { label: 'Monochrome White on Black', value: 'mono' },
        ],
        default: 'color',
      },
      invert: { id: 'invert', name: 'Invert Character Density', type: 'boolean', default: false },
    },
    apply: (source, { cellSize = 10, colorMode = 'color', invert = false }) => {
      const { width, height } = source;
      const src = source.data;

      const ramp = invert ? ASCII_RAMP.split('').reverse().join('') : ASCII_RAMP;
      const rampLen = ramp.length;

      // Check if browser 2D canvas is available
      let canvas: HTMLCanvasElement | null = null;
      let ctx: CanvasRenderingContext2D | null = null;
      if (typeof document !== 'undefined') {
        canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        ctx = canvas.getContext('2d');
      }

      if (ctx) {
        ctx.fillStyle = '#0a0a0c';
        ctx.fillRect(0, 0, width, height);

        ctx.font = `bold ${cellSize}px monospace`;
        ctx.textBaseline = 'top';
        ctx.textAlign = 'center';

        for (let y = 0; y < height; y += cellSize) {
          for (let x = 0; x < width; x += cellSize) {
            let rSum = 0, gSum = 0, bSum = 0, count = 0;

            for (let cy = 0; cy < cellSize && y + cy < height; cy++) {
              for (let cx = 0; cx < cellSize && x + cx < width; cx++) {
                const idx = ((y + cy) * width + (x + cx)) * 4;
                rSum += src[idx]!;
                gSum += src[idx + 1]!;
                bSum += src[idx + 2]!;
                count++;
              }
            }

            if (count === 0) continue;
            const avgR = rSum / count;
            const avgG = gSum / count;
            const avgB = bSum / count;
            const lum = rgbToLuminance(avgR, avgG, avgB) / 255;

            const charIdx = Math.min(rampLen - 1, Math.floor(lum * rampLen));
            const char = ramp[charIdx]!;

            if (colorMode === 'color') {
              ctx.fillStyle = `rgb(${Math.round(avgR)}, ${Math.round(avgG)}, ${Math.round(avgB)})`;
            } else if (colorMode === 'green') {
              ctx.fillStyle = `rgb(0, ${Math.round(200 + lum * 55)}, 80)`;
            } else if (colorMode === 'amber') {
              ctx.fillStyle = `rgb(255, ${Math.round(150 + lum * 50)}, 0)`;
            } else {
              const v = Math.round(lum * 255);
              ctx.fillStyle = `rgb(${v}, ${v}, ${v})`;
            }

            ctx.fillText(char, x + cellSize / 2, y);
          }
        }

        return ctx.getImageData(0, 0, width, height);
      }

      // Safe fallback for SSR / headless / worker environments
      const output = createImageBuffer(width, height);
      const dst = output.data;
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const sIdx = (y * width + x) * 4;
          const lum = rgbToLuminance(src[sIdx]!, src[sIdx + 1]!, src[sIdx + 2]!) / 255;
          const charDensity = Math.floor(lum * 8);
          const inPattern = (x % 2 === 0 && y % 2 === 0) || charDensity > 4;

          if (inPattern) {
            if (colorMode === 'color') {
              dst[sIdx] = src[sIdx]!;
              dst[sIdx + 1] = src[sIdx + 1]!;
              dst[sIdx + 2] = src[sIdx + 2]!;
            } else if (colorMode === 'green') {
              dst[sIdx] = 0;
              dst[sIdx + 1] = 230;
              dst[sIdx + 2] = 80;
            } else if (colorMode === 'amber') {
              dst[sIdx] = 255;
              dst[sIdx + 1] = 160;
              dst[sIdx + 2] = 0;
            } else {
              const v = Math.round(lum * 255);
              dst[sIdx] = v;
              dst[sIdx + 1] = v;
              dst[sIdx + 2] = v;
            }
          } else {
            dst[sIdx] = 10;
            dst[sIdx + 1] = 10;
            dst[sIdx + 2] = 12;
          }
          dst[sIdx + 3] = 255;
        }
      }
      return output;
    },
  },

  // 46. Voronoi Stained Glass Mosaic
  {
    id: 'voronoi-cellular-mosaic',
    name: 'Voronoi Stained Glass Mosaic',
    category: 'generative',
    description: 'Cellular space partitioning: divides plane into organic polygon crystal cells with lead solder borders and full color.',
    tags: ['voronoi', 'mosaic', 'cellular', 'glass', 'geometry'],
    parameters: {
      cellCount: { id: 'cellCount', name: 'Seed Cell Density', type: 'range', min: 80, max: 700, step: 20, default: 320 },
      borderWidth: { id: 'borderWidth', name: 'Leaded Solder Border (px)', type: 'range', min: 0, max: 3, step: 1, default: 1 },
      jitter: { id: 'jitter', name: 'Point Jitter', type: 'range', min: 0.2, max: 1.0, step: 0.1, default: 0.8 },
    },
    apply: (source, { cellCount = 320, borderWidth = 1, jitter = 0.8 }) => {
      const { width, height } = source;
      const src = source.data;
      const output = createImageBuffer(width, height);
      const dst = output.data;

      const seeds: { x: number; y: number; r: number; g: number; b: number }[] = [];
      const numSeeds = Math.round(cellCount);
      const cols = Math.max(1, Math.round(Math.sqrt((width / height) * numSeeds)));
      const rows = Math.max(1, Math.round(numSeeds / cols));
      const stepX = width / cols;
      const stepY = height / rows;

      for (let ry = 0; ry < rows; ry++) {
        for (let rx = 0; rx < cols; rx++) {
          const idx = ry * cols + rx;
          const r1 = (((Math.sin(idx * 7919.13) * 43758.5453) % 1) + 1) % 1 - 0.5;
          const r2 = (((Math.cos(idx * 6271.79) * 28618.392) % 1) + 1) % 1 - 0.5;

          const sx = clamp(Math.floor((rx + 0.5 + r1 * jitter) * stepX), 0, width - 1);
          const sy = clamp(Math.floor((ry + 0.5 + r2 * jitter) * stepY), 0, height - 1);
          const sIdx = (sy * width + sx) * 4;

          seeds.push({
            x: sx,
            y: sy,
            r: src[sIdx]!,
            g: src[sIdx + 1]!,
            b: src[sIdx + 2]!,
          });
        }
      }

      const binSize = 64;
      const binsX = Math.ceil(width / binSize);
      const binsY = Math.ceil(height / binSize);
      const bins: number[][][] = Array.from({ length: binsY }, () =>
        Array.from({ length: binsX }, () => [])
      );

      for (let i = 0; i < seeds.length; i++) {
        const s = seeds[i]!;
        const bx = clamp(Math.floor(s.x / binSize), 0, binsX - 1);
        const by = clamp(Math.floor(s.y / binSize), 0, binsY - 1);
        bins[by]![bx]!.push(i);
      }

      for (let y = 0; y < height; y++) {
        const by = Math.floor(y / binSize);
        for (let x = 0; x < width; x++) {
          const bx = Math.floor(x / binSize);

          let minDist1 = Infinity;
          let minDist2 = Infinity;
          let bestSeed = seeds[0]!;

          for (let dy = -1; dy <= 1; dy++) {
            const nby = by + dy;
            if (nby < 0 || nby >= binsY) continue;
            for (let dx = -1; dx <= 1; dx++) {
              const nbx = bx + dx;
              if (nbx < 0 || nbx >= binsX) continue;
              const bin = bins[nby]![nbx]!;
              for (const idx of bin) {
                const s = seeds[idx]!;
                const d = (x - s.x) * (x - s.x) + (y - s.y) * (y - s.y);
                if (d < minDist1) {
                  minDist2 = minDist1;
                  minDist1 = d;
                  bestSeed = s;
                } else if (d < minDist2) {
                  minDist2 = d;
                }
              }
            }
          }

          const dIdx = (y * width + x) * 4;
          const isBorder = borderWidth > 0 && Math.sqrt(minDist2) - Math.sqrt(minDist1) < borderWidth;

          if (isBorder) {
            dst[dIdx] = 18;
            dst[dIdx + 1] = 18;
            dst[dIdx + 2] = 20;
          } else {
            dst[dIdx] = bestSeed.r;
            dst[dIdx + 1] = bestSeed.g;
            dst[dIdx + 2] = bestSeed.b;
          }
          dst[dIdx + 3] = 255;
        }
      }
      return output;
    },
  },

  // 47. Moiré Pattern Wave Interference
  {
    id: 'moire-wave-interference',
    name: 'Moiré Pattern Wave Interference',
    category: 'generative',
    description: 'Mathematical wave interference: overlays two angled fine-mesh gratings whose interaction produces hypnotic kinetic ripples.',
    tags: ['moire', 'interference', 'wave', 'generative', 'optical'],
    parameters: {
      gridFrequency: { id: 'gridFrequency', name: 'Interference Frequency', type: 'range', min: 2, max: 14, step: 1, default: 5 },
      angleOffset: { id: 'angleOffset', name: 'Angular Beat (deg)', type: 'range', min: 1, max: 30, step: 1, default: 8 },
      colorMode: { id: 'colorMode', name: 'Sample Image Colors', type: 'boolean', default: true },
    },
    apply: (source, { gridFrequency = 5, angleOffset = 8, colorMode = true }) => {
      const { width, height } = source;
      const output = createImageBuffer(width, height);
      const src = source.data;
      const dst = output.data;

      const a2 = (angleOffset * Math.PI) / 180;
      const cos2 = Math.cos(a2);
      const sin2 = Math.sin(a2);

      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const sIdx = (y * width + x) * 4;
          const lum = rgbToLuminance(src[sIdx]!, src[sIdx + 1]!, src[sIdx + 2]!) / 255;

          // Grating 1
          const g1 = Math.sin((x / gridFrequency) * Math.PI * 2);
          // Grating 2 angled
          const rotX2 = x * cos2 - y * sin2;
          const g2 = Math.sin((rotX2 / gridFrequency) * Math.PI * 2);

          // Combined interference modulated by image brightness
          const interference = (g1 * g2 + 1) / 2;
          const beat = interference * (1 - lum);

          const dIdx = (y * width + x) * 4;
          if (colorMode) {
            dst[dIdx] = clamp(Math.round(src[sIdx]! * (1 - beat * 0.7)));
            dst[dIdx + 1] = clamp(Math.round(src[sIdx + 1]! * (1 - beat * 0.7)));
            dst[dIdx + 2] = clamp(Math.round(src[sIdx + 2]! * (1 - beat * 0.7)));
          } else {
            const v = clamp(Math.round((1 - beat) * 255));
            dst[dIdx] = v; dst[dIdx + 1] = v; dst[dIdx + 2] = v;
          }
          dst[dIdx + 3] = 255;
        }
      }
      return output;
    },
  },

  // 48. Square Mosaic Pixelate
  {
    id: 'square-mosaic-pixelate',
    name: 'Square Pixelate Mosaic',
    category: 'generative',
    description: 'Pixel reduction grid with customizable tile dimensions and technical grid gap boundaries.',
    tags: ['pixelate', 'mosaic', 'tiles', 'blocks', 'grid'],
    parameters: {
      tileSize: { id: 'tileSize', name: 'Tile Dimension (px)', type: 'range', min: 4, max: 48, step: 2, default: 12 },
      gridGaps: { id: 'gridGaps', name: 'Visible Technical Grid Gaps', type: 'boolean', default: true },
    },
    apply: (source, { tileSize = 12, gridGaps = true }) => {
      const { width, height } = source;
      const output = createImageBuffer(width, height);
      const src = source.data;
      const dst = output.data;
      const t = Math.max(2, Math.round(tileSize));

      for (let y = 0; y < height; y += t) {
        for (let x = 0; x < width; x += t) {
          let rSum = 0, gSum = 0, bSum = 0, count = 0;
          for (let dy = 0; dy < t && y + dy < height; dy++) {
            for (let dx = 0; dx < t && x + dx < width; dx++) {
              const idx = ((y + dy) * width + (x + dx)) * 4;
              rSum += src[idx]!;
              gSum += src[idx + 1]!;
              bSum += src[idx + 2]!;
              count++;
            }
          }

          const avgR = Math.round(rSum / count);
          const avgG = Math.round(gSum / count);
          const avgB = Math.round(bSum / count);

          for (let dy = 0; dy < t && y + dy < height; dy++) {
            for (let dx = 0; dx < t && x + dx < width; dx++) {
              const dIdx = ((y + dy) * width + (x + dx)) * 4;
              if (gridGaps && (dx === 0 || dy === 0)) {
                dst[dIdx] = clamp(avgR * 0.4);
                dst[dIdx + 1] = clamp(avgG * 0.4);
                dst[dIdx + 2] = clamp(avgB * 0.4);
              } else {
                dst[dIdx] = avgR;
                dst[dIdx + 1] = avgG;
                dst[dIdx + 2] = avgB;
              }
              dst[dIdx + 3] = 255;
            }
          }
        }
      }
      return output;
    },
  },

  // 49. Hexagonal Prism Mosaic
  {
    id: 'hex-prism-mosaic',
    name: 'Hexagonal Prism Mosaic',
    category: 'generative',
    description: 'Tessellated interlocking hexagonal prism tiles sampled from local color centroids.',
    tags: ['hex', 'prism', 'mosaic', 'tessellation'],
    parameters: {
      hexRadius: { id: 'hexRadius', name: 'Hexagon Radius (px)', type: 'range', min: 6, max: 36, step: 2, default: 14 },
    },
    apply: (source, { hexRadius = 14 }) => {
      const { width, height } = source;
      const output = createImageBuffer(width, height);
      const src = source.data;
      const dst = output.data;

      const r = Math.max(4, Math.round(hexRadius));
      const wStep = r * Math.sqrt(3);
      const hStep = r * 1.5;

      for (let y = 0; y < height; y++) {
        const row = Math.floor(y / hStep);
        const isOffset = row % 2 !== 0;
        const xOffset = isOffset ? wStep / 2 : 0;

        for (let x = 0; x < width; x++) {
          const col = Math.floor((x - xOffset) / wStep);
          const cx = clamp(Math.round(col * wStep + xOffset + wStep / 2), 0, width - 1);
          const cy = clamp(Math.round(row * hStep + r), 0, height - 1);

          const sIdx = (cy * width + cx) * 4;
          const dIdx = (y * width + x) * 4;

          dst[dIdx] = src[sIdx]!;
          dst[dIdx + 1] = src[sIdx + 1]!;
          dst[dIdx + 2] = src[sIdx + 2]!;
          dst[dIdx + 3] = 255;
        }
      }
      return output;
    },
  },

  // 50. Triangular Low-Poly Mesh
  {
    id: 'triangular-lowpoly',
    name: 'Triangular Low-Poly Mesh',
    category: 'generative',
    description: 'Alternating diagonal triangular tessellation: converts image into faceted low-poly crystal geometry.',
    tags: ['triangle', 'low-poly', 'polygon', 'mesh', 'geometry'],
    parameters: {
      gridSize: { id: 'gridSize', name: 'Triangle Base (px)', type: 'range', min: 8, max: 36, step: 2, default: 16 },
    },
    apply: (source, { gridSize = 16 }) => {
      const { width, height } = source;
      const output = createImageBuffer(width, height);
      const src = source.data;
      const dst = output.data;
      const s = Math.max(4, Math.round(gridSize));

      for (let y = 0; y < height; y += s) {
        for (let x = 0; x < width; x += s) {
          // Upper triangle centroid: (x + s/3, y + s/3)
          const ux = clamp(Math.round(x + s * 0.33), 0, width - 1);
          const uy = clamp(Math.round(y + s * 0.33), 0, height - 1);
          const uIdx = (uy * width + ux) * 4;

          // Lower triangle centroid: (x + 2s/3, y + 2s/3)
          const lx = clamp(Math.round(x + s * 0.67), 0, width - 1);
          const ly = clamp(Math.round(y + s * 0.67), 0, height - 1);
          const lIdx = (ly * width + lx) * 4;

          for (let dy = 0; dy < s && y + dy < height; dy++) {
            for (let dx = 0; dx < s && x + dx < width; dx++) {
              const dIdx = ((y + dy) * width + (x + dx)) * 4;
              const isUpper = dx + dy < s;
              const refIdx = isUpper ? uIdx : lIdx;

              dst[dIdx] = src[refIdx]!;
              dst[dIdx + 1] = src[refIdx + 1]!;
              dst[dIdx + 2] = src[refIdx + 2]!;
              dst[dIdx + 3] = 255;
            }
          }
        }
      }
      return output;
    },
  },

  // 51. Reaction-Diffusion Turing Pattern
  {
    id: 'reaction-diffusion-turing',
    name: 'Reaction-Diffusion Turing Morphogenesis',
    category: 'generative',
    description: 'Alan Turing morphogen reaction-diffusion: generates organic leopard, zebra, and labyrinthine skin patterns driven by image tones.',
    tags: ['turing', 'reaction-diffusion', 'morphogenesis', 'biology', 'pattern'],
    parameters: {
      scale: { id: 'scale', name: 'Wave Scale', type: 'range', min: 2, max: 12, step: 1, default: 5 },
      sharpness: { id: 'sharpness', name: 'Pattern Sharpness', type: 'range', min: 1, max: 4, step: 0.2, default: 2.2 },
      colorMode: { id: 'colorMode', name: 'Full Color Bands', type: 'boolean', default: true },
    },
    apply: (source, { scale = 5, sharpness = 2.2, colorMode = true }) => {
      const { width, height } = source;
      const output = createImageBuffer(width, height);
      const src = source.data;
      const dst = output.data;

      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const sIdx = (y * width + x) * 4;
          const lum = rgbToLuminance(src[sIdx]!, src[sIdx + 1]!, src[sIdx + 2]!) / 255;

          // Multi-frequency directional waves simulating Gray-Scott reaction
          const w1 = Math.sin((x / scale) * 1.2 + lum * 4);
          const w2 = Math.cos((y / scale) * 1.2 + lum * 4);
          const w3 = Math.sin(((x + y) / (scale * 1.4)) + lum * 3);

          const field = (w1 + w2 + w3) / 3;
          const band = clamp(Math.pow((field + 1) / 2, sharpness));

          const dIdx = (y * width + x) * 4;
          if (colorMode) {
            dst[dIdx] = clamp(Math.round(src[sIdx]! * band));
            dst[dIdx + 1] = clamp(Math.round(src[sIdx + 1]! * band));
            dst[dIdx + 2] = clamp(Math.round(src[sIdx + 2]! * band));
          } else {
            const v = Math.round(band * 255);
            dst[dIdx] = v; dst[dIdx + 1] = v; dst[dIdx + 2] = v;
          }
          dst[dIdx + 3] = 255;
        }
      }
      return output;
    },
  },

  // 52. Truchet Tile Labyrinth
  {
    id: 'truchet-tile-maze',
    name: 'Truchet Tile Generative Labyrinth',
    category: 'generative',
    description: 'Sébastien Truchet mathematical tiling: connects quarter-circle arc ribbons based on local brightness to generate infinite mazes.',
    tags: ['truchet', 'maze', 'labyrinth', 'math', 'generative'],
    parameters: {
      tileSize: { id: 'tileSize', name: 'Tile Dimension (px)', type: 'range', min: 8, max: 32, step: 2, default: 14 },
      lineWidth: { id: 'lineWidth', name: 'Ribbon Width (px)', type: 'range', min: 1, max: 5, step: 0.5, default: 2.5 },
      colorMode: { id: 'colorMode', name: 'Full Color Ribbons', type: 'boolean', default: true },
    },
    apply: (source, { tileSize = 14, lineWidth = 2.5, colorMode = true }) => {
      const { width, height } = source;
      const output = createImageBuffer(width, height);
      const src = source.data;
      const dst = output.data;
      const t = Math.max(6, Math.round(tileSize));
      const halfLine = lineWidth / 2;

      for (let y = 0; y < height; y++) {
        const ty = Math.floor(y / t) * t;
        const py = y - ty;

        for (let x = 0; x < width; x++) {
          const tx = Math.floor(x / t) * t;
          const px = x - tx;

          const cx = clamp(tx + t / 2, 0, width - 1);
          const cy = clamp(ty + t / 2, 0, height - 1);
          const sIdx = (cy * width + cx) * 4;
          const lum = rgbToLuminance(src[sIdx]!, src[sIdx + 1]!, src[sIdx + 2]!) / 255;

          // Tile orientation determined by luminance parity
          const orientation = Math.floor(lum * 4) % 2 === 0;

          let dist1: number, dist2: number;
          if (orientation) {
            // Arcs from top-left (0,0) and bottom-right (t,t)
            dist1 = Math.hypot(px, py);
            dist2 = Math.hypot(px - t, py - t);
          } else {
            // Arcs from top-right (t,0) and bottom-left (0,t)
            dist1 = Math.hypot(px - t, py);
            dist2 = Math.hypot(px, py - t);
          }

          const targetR = t / 2;
          const onRibbon = Math.abs(dist1 - targetR) <= halfLine || Math.abs(dist2 - targetR) <= halfLine;

          const dIdx = (y * width + x) * 4;
          if (onRibbon) {
            if (colorMode) {
              dst[dIdx] = src[sIdx]!;
              dst[dIdx + 1] = src[sIdx + 1]!;
              dst[dIdx + 2] = src[sIdx + 2]!;
            } else {
              dst[dIdx] = 20; dst[dIdx + 1] = 20; dst[dIdx + 2] = 25;
            }
          } else {
            dst[dIdx] = 250; dst[dIdx + 1] = 250; dst[dIdx + 2] = 250;
          }
          dst[dIdx + 3] = 255;
        }
      }
      return output;
    },
  },

  // 53. Concentric Polar Radar Sweep
  {
    id: 'polar-radar-scan',
    name: 'Concentric Polar Radar Sweep',
    category: 'generative',
    description: 'Polar coordinate transformation: remaps Cartesian coordinates into sweeping radial radar sectors.',
    tags: ['polar', 'radar', 'sweep', 'concentric', 'math'],
    parameters: {
      rings: { id: 'rings', name: 'Radial Ring Steps', type: 'range', min: 10, max: 60, step: 2, default: 24 },
      spokes: { id: 'spokes', name: 'Angular Spokes', type: 'range', min: 12, max: 72, step: 4, default: 36 },
    },
    apply: (source, { rings = 24, spokes = 36 }) => {
      const { width, height } = source;
      const output = createImageBuffer(width, height);
      const src = source.data;
      const dst = output.data;

      const midX = width / 2;
      const midY = height / 2;
      const maxR = Math.hypot(midX, midY);

      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const dx = x - midX;
          const dy = y - midY;
          const r = Math.hypot(dx, dy);
          const theta = Math.atan2(dy, dx) + Math.PI;

          // Quantize r and theta into discrete polar sectors
          const rQuant = Math.floor((r / maxR) * rings);
          const rCenter = ((rQuant + 0.5) / rings) * maxR;

          const thetaQuant = Math.floor((theta / (2 * Math.PI)) * spokes);
          const thetaCenter = ((thetaQuant + 0.5) / spokes) * (2 * Math.PI) - Math.PI;

          const sx = clamp(Math.round(midX + rCenter * Math.cos(thetaCenter)), 0, width - 1);
          const sy = clamp(Math.round(midY + rCenter * Math.sin(thetaCenter)), 0, height - 1);

          const sIdx = (sy * width + sx) * 4;
          const dIdx = (y * width + x) * 4;

          dst[dIdx] = src[sIdx]!;
          dst[dIdx + 1] = src[sIdx + 1]!;
          dst[dIdx + 2] = src[sIdx + 2]!;
          dst[dIdx + 3] = 255;
        }
      }
      return output;
    },
  },

  // 54. Frosted Glass Dispersion Jitter
  {
    id: 'frosted-refraction-scatter',
    name: 'Frosted Glass Refraction Jitter',
    category: 'generative',
    description: 'Architectural frosted glass: stochastic micro-facet refractive displacement scattering light paths.',
    tags: ['frosted', 'refraction', 'jitter', 'dispersion', 'glass'],
    parameters: {
      dispersion: { id: 'dispersion', name: 'Jitter Radius (px)', type: 'range', min: 2, max: 25, step: 1, default: 8 },
    },
    apply: (source, { dispersion = 8 }) => {
      const { width, height } = source;
      const output = createImageBuffer(width, height);
      const src = source.data;
      const dst = output.data;

      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const seedX = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453;
          const seedY = Math.cos(x * 63.7264 + y * 10.873) * 28618.392;
          const jx = (seedX - Math.floor(seedX) - 0.5) * 2 * dispersion;
          const jy = (seedY - Math.floor(seedY) - 0.5) * 2 * dispersion;

          const sx = clamp(Math.round(x + jx), 0, width - 1);
          const sy = clamp(Math.round(y + jy), 0, height - 1);

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

  // 55. Kuwahara Fine Art Oil Matrix
  {
    id: 'kuwahara-oil-matrix',
    name: 'Kuwahara Fine Art Oil Matrix',
    category: 'generative',
    description: 'Edge-preserving variance smoothing: analyzes 4 quadrants around each pixel to create rich painterly oil brushstrokes.',
    tags: ['kuwahara', 'painterly', 'oil', 'brush', 'fine-art'],
    parameters: {
      radius: { id: 'radius', name: 'Brush Radius', type: 'range', min: 2, max: 7, step: 1, default: 3 },
    },
    apply: (source, { radius = 3 }) => {
      const { width, height } = source;
      const output = createImageBuffer(width, height);
      const src = source.data;
      const dst = output.data;
      const r = Math.max(1, Math.round(radius));

      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const quadrants = [
            { x0: x - r, x1: x, y0: y - r, y1: y },
            { x0: x, x1: x + r, y0: y - r, y1: y },
            { x0: x - r, x1: x, y0: y, y1: y + r },
            { x0: x, x1: x + r, y0: y, y1: y + r },
          ];

          let minVar = Infinity;
          let bestR = 0, bestG = 0, bestB = 0;

          for (const q of quadrants) {
            let count = 0;
            let sumR = 0, sumG = 0, sumB = 0;
            let sumSqR = 0, sumSqG = 0, sumSqB = 0;

            for (let qy = q.y0; qy <= q.y1; qy++) {
              const sy = clamp(qy, 0, height - 1);
              for (let qx = q.x0; qx <= q.x1; qx++) {
                const sx = clamp(qx, 0, width - 1);
                const idx = (sy * width + sx) * 4;

                const cr = src[idx]!;
                const cg = src[idx + 1]!;
                const cb = src[idx + 2]!;

                sumR += cr; sumG += cg; sumB += cb;
                sumSqR += cr * cr; sumSqG += cg * cg; sumSqB += cb * cb;
                count++;
              }
            }

            const mR = sumR / count;
            const mG = sumG / count;
            const mB = sumB / count;

            const varR = sumSqR / count - mR * mR;
            const varG = sumSqG / count - mG * mG;
            const varB = sumSqB / count - mB * mB;
            const totalVar = varR + varG + varB;

            if (totalVar < minVar) {
              minVar = totalVar;
              bestR = mR; bestG = mG; bestB = mB;
            }
          }

          const dIdx = (y * width + x) * 4;
          dst[dIdx] = clamp(Math.round(bestR));
          dst[dIdx + 1] = clamp(Math.round(bestG));
          dst[dIdx + 2] = clamp(Math.round(bestB));
          dst[dIdx + 3] = src[dIdx + 3]!;
        }
      }
      return output;
    },
  },

  // 56. Cyber Neon Edge Luminescence
  {
    id: 'neon-edge-luminescence',
    name: 'Cyber Neon Contour Luminescence',
    category: 'generative',
    description: 'Sobel gradient edge detection illuminated with vibrant neon glowing filaments on dark technical base.',
    tags: ['neon', 'contour', 'edges', 'sobel', 'cyberpunk'],
    parameters: {
      neonColor: { id: 'neonColor', name: 'Filament Color', type: 'color', default: '#00ffff' },
      edgeBoost: { id: 'edgeBoost', name: 'Voltage Intensity', type: 'range', min: 1, max: 4, step: 0.2, default: 2.2 },
    },
    apply: (source, { neonColor = '#00ffff', edgeBoost = 2.2 }) => {
      const { width, height } = source;
      const output = createImageBuffer(width, height);
      const src = source.data;
      const dst = output.data;

      const kx = [[-1, 0, 1], [-2, 0, 2], [-1, 0, 1]];
      const ky = [[-1, -2, -1], [0, 0, 0], [1, 2, 1]];
      const nRgb = hexToRgb(neonColor);

      for (let y = 1; y < height - 1; y++) {
        for (let x = 1; x < width - 1; x++) {
          let gx = 0, gy = 0;
          for (let r = -1; r <= 1; r++) {
            for (let c = -1; c <= 1; c++) {
              const idx = ((y + r) * width + (x + c)) * 4;
              const lum = rgbToLuminance(src[idx]!, src[idx + 1]!, src[idx + 2]!);
              gx += lum * kx[r + 1]![c + 1]!;
              gy += lum * ky[r + 1]![c + 1]!;
            }
          }
          const mag = clamp(Math.sqrt(gx * gx + gy * gy) * edgeBoost) / 255;
          const dIdx = (y * width + x) * 4;

          dst[dIdx] = clamp(Math.round(nRgb.r * mag));
          dst[dIdx + 1] = clamp(Math.round(nRgb.g * mag));
          dst[dIdx + 2] = clamp(Math.round(nRgb.b * mag));
          dst[dIdx + 3] = 255;
        }
      }
      return output;
    },
  },
];
