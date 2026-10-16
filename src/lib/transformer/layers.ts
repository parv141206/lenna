import type { EffectParamValues } from './types';
import { runEffect } from './engine';
import { getEffectById } from './registry';
import { clamp, createImageBuffer } from './matrix';

export type BlendMode =
  | 'normal'
  | 'multiply'
  | 'screen'
  | 'overlay'
  | 'darken'
  | 'lighten'
  | 'difference'
  | 'add'
  | 'hard-light';

export interface EffectLayer {
  id: string;
  name: string;
  effectId: string;
  enabled: boolean;
  opacity: number; // 0 to 100
  blendMode: BlendMode;
  parameters: EffectParamValues;
  color: string; // AE-style layer track tag color
  spanIndices: number[]; // indices of images this effect spans over
}

export const LAYER_TRACK_COLORS = [
  '#f87171', // red
  '#fb923c', // orange
  '#facc15', // yellow
  '#4ade80', // green
  '#38bdf8', // cyan
  '#818cf8', // indigo
  '#c084fc', // purple
  '#f472b6', // pink
];

/**
 * Blend top pixel onto bottom pixel with opacity and Photoshop/After Effects blend mode
 */
export function blendPixel(
  baseR: number,
  baseG: number,
  baseB: number,
  topR: number,
  topG: number,
  topB: number,
  mode: BlendMode,
  opacity: number // 0 to 1
): [number, number, number] {
  let r = topR;
  let g = topG;
  let b = topB;

  switch (mode) {
    case 'normal':
      r = topR;
      g = topG;
      b = topB;
      break;

    case 'multiply':
      r = (baseR * topR) / 255;
      g = (baseG * topG) / 255;
      b = (baseB * topB) / 255;
      break;

    case 'screen':
      r = 255 - ((255 - baseR) * (255 - topR)) / 255;
      g = 255 - ((255 - baseG) * (255 - topG)) / 255;
      b = 255 - ((255 - baseB) * (255 - topB)) / 255;
      break;

    case 'overlay':
      r = baseR < 128 ? (2 * baseR * topR) / 255 : 255 - (2 * (255 - baseR) * (255 - topR)) / 255;
      g = baseG < 128 ? (2 * baseG * topG) / 255 : 255 - (2 * (255 - baseG) * (255 - topG)) / 255;
      b = baseB < 128 ? (2 * baseB * topB) / 255 : 255 - (2 * (255 - baseB) * (255 - topB)) / 255;
      break;

    case 'hard-light':
      r = topR < 128 ? (2 * baseR * topR) / 255 : 255 - (2 * (255 - baseR) * (255 - topR)) / 255;
      g = topG < 128 ? (2 * baseG * topG) / 255 : 255 - (2 * (255 - baseG) * (255 - topG)) / 255;
      b = topB < 128 ? (2 * baseB * topB) / 255 : 255 - (2 * (255 - baseB) * (255 - topB)) / 255;
      break;

    case 'darken':
      r = Math.min(baseR, topR);
      g = Math.min(baseG, topG);
      b = Math.min(baseB, topB);
      break;

    case 'lighten':
      r = Math.max(baseR, topR);
      g = Math.max(baseG, topG);
      b = Math.max(baseB, topB);
      break;

    case 'difference':
      r = Math.abs(baseR - topR);
      g = Math.abs(baseG - topG);
      b = Math.abs(baseB - topB);
      break;

    case 'add':
      r = Math.min(255, baseR + topR);
      g = Math.min(255, baseG + topG);
      b = Math.min(255, baseB + topB);
      break;
  }

  // Linear interpolation with opacity
  const outR = clamp(Math.round(baseR * (1 - opacity) + r * opacity), 0, 255);
  const outG = clamp(Math.round(baseG * (1 - opacity) + g * opacity), 0, 255);
  const outB = clamp(Math.round(baseB * (1 - opacity) + b * opacity), 0, 255);

  return [outR, outG, outB];
}

/**
 * Composite a single layer output buffer over an accumulated base buffer (zero-allocation inlined)
 */
export function compositeBuffers(
  base: ImageData,
  top: ImageData,
  mode: BlendMode,
  opacityPercent: number
): ImageData {
  const { width, height } = base;
  const output = createImageBuffer(width, height);
  const b = base.data;
  const t = top.data;
  const dst = output.data;
  const op = clamp(opacityPercent / 100, 0, 1);
  const invOp = 1 - op;

  if (mode === 'normal' && op === 1) {
    dst.set(t);
    return output;
  }

  const len = dst.length;
  for (let i = 0; i < len; i += 4) {
    const bR = b[i]!;
    const bG = b[i + 1]!;
    const bB = b[i + 2]!;

    const tR = t[i]!;
    const tG = t[i + 1]!;
    const tB = t[i + 2]!;

    let r = tR;
    let g = tG;
    let bl = tB;

    switch (mode) {
      case 'normal':
        break;
      case 'multiply':
        r = (bR * tR) / 255;
        g = (bG * tG) / 255;
        bl = (bB * tB) / 255;
        break;
      case 'screen':
        r = 255 - ((255 - bR) * (255 - tR)) / 255;
        g = 255 - ((255 - bG) * (255 - tG)) / 255;
        bl = 255 - ((255 - bB) * (255 - tB)) / 255;
        break;
      case 'overlay':
        r = bR < 128 ? (2 * bR * tR) / 255 : 255 - (2 * (255 - bR) * (255 - tR)) / 255;
        g = bG < 128 ? (2 * bG * tG) / 255 : 255 - (2 * (255 - bG) * (255 - tG)) / 255;
        bl = bB < 128 ? (2 * bB * tB) / 255 : 255 - (2 * (255 - bB) * (255 - tB)) / 255;
        break;
      case 'hard-light':
        r = tR < 128 ? (2 * bR * tR) / 255 : 255 - (2 * (255 - bR) * (255 - tR)) / 255;
        g = tG < 128 ? (2 * bG * tG) / 255 : 255 - (2 * (255 - bG) * (255 - tG)) / 255;
        bl = tB < 128 ? (2 * bB * tB) / 255 : 255 - (2 * (255 - bB) * (255 - tB)) / 255;
        break;
      case 'darken':
        r = bR < tR ? bR : tR;
        g = bG < tG ? bG : tG;
        bl = bB < tB ? bB : tB;
        break;
      case 'lighten':
        r = bR > tR ? bR : tR;
        g = bG > tG ? bG : tG;
        bl = bB > tB ? bB : tB;
        break;
      case 'difference':
        r = bR > tR ? bR - tR : tR - bR;
        g = bG > tG ? bG - tG : tG - bG;
        bl = bB > tB ? bB - tB : tB - bB;
        break;
      case 'add': {
        const sumR = bR + tR;
        const sumG = bG + tG;
        const sumB = bB + tB;
        r = sumR > 255 ? 255 : sumR;
        g = sumG > 255 ? 255 : sumG;
        bl = sumB > 255 ? 255 : sumB;
        break;
      }
    }

    dst[i] = (bR * invOp + r * op) | 0;
    dst[i + 1] = (bG * invOp + g * op) | 0;
    dst[i + 2] = (bB * invOp + bl * op) | 0;
    dst[i + 3] = 255;
  }

  return output;
}

/**
 * Evaluates a stack of effect layers (from bottom to top) on a base image
 */
export function evaluateLayerStack(
  baseImage: ImageData,
  layers: EffectLayer[],
  imageIndex: number
): { output: ImageData; totalDurationMs: number } {
  let currentBuffer = baseImage;
  let totalDurationMs = 0;

  // Evaluate enabled layers that span over this image index
  for (const layer of layers) {
    if (!layer.enabled) continue;
    if (!layer.spanIndices.includes(imageIndex)) continue;

    const effectDef = getEffectById(layer.effectId);
    if (!effectDef) continue;

    // Run layer effect
    const { output: layerOutput, durationMs } = runEffect(
      effectDef,
      currentBuffer,
      layer.parameters
    );
    totalDurationMs += durationMs;

    // Blend into accumulated stack
    currentBuffer = compositeBuffers(
      currentBuffer,
      layerOutput,
      layer.blendMode,
      layer.opacity
    );
  }

  return { output: currentBuffer, totalDurationMs };
}
