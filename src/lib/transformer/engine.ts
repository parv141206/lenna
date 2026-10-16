/**
 * Lenna Transformer Processing Engine & Canvas Utilities
 */

import type { EffectDefinition, EffectParamValues } from './types';

/**
 * Loads a File / Blob into an HTMLImageElement
 */
export function loadImageFromFile(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error('Failed to load image from file'));
      img.src = reader.result as string;
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}

/**
 * Loads an image from a URL or data URI
 */
export function loadImageFromUrl(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Failed to load image from url'));
    img.src = url;
  });
}

/**
 * Converts an HTMLImageElement to an ImageData buffer, optionally downscaling
 * while maintaining aspect ratio if maxDimension is provided.
 */
export function imageToImageData(
  img: HTMLImageElement,
  maxDimension = 1200
): ImageData {
  let { naturalWidth: width, naturalHeight: height } = img;
  if (!width || !height) {
    width = img.width || 600;
    height = img.height || 600;
  }

  // Downscale if exceeds maxDimension for silky smooth performance
  if (width > maxDimension || height > maxDimension) {
    if (width > height) {
      height = Math.round((height * maxDimension) / width);
      width = maxDimension;
    } else {
      width = Math.round((width * maxDimension) / height);
      height = maxDimension;
    }
  }

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) throw new Error('Could not get 2D canvas context');

  ctx.drawImage(img, 0, 0, width, height);
  return ctx.getImageData(0, 0, width, height);
}

/**
 * Renders an ImageData onto an existing HTMLCanvasElement.
 */
export function renderImageDataToCanvas(
  imageData: ImageData,
  canvas: HTMLCanvasElement
): void {
  if (canvas.width !== imageData.width || canvas.height !== imageData.height) {
    canvas.width = imageData.width;
    canvas.height = imageData.height;
  }
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.putImageData(imageData, 0, 0);
  }
}

/**
 * Triggers a browser download of the current canvas content.
 */
export function downloadCanvas(
  canvas: HTMLCanvasElement,
  filename = 'lenna-transformed.png',
  format: 'image/png' | 'image/jpeg' = 'image/png',
  quality = 0.95
): void {
  const link = document.createElement('a');
  link.download = filename;
  link.href = canvas.toDataURL(format, quality);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Copies the canvas image data to clipboard.
 */
export async function copyCanvasToClipboard(canvas: HTMLCanvasElement): Promise<void> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error('Failed to create blob from canvas'));
        return;
      }
      navigator.clipboard
        .write([new ClipboardItem({ 'image/png': blob })])
        .then(() => resolve())
        .catch((err: unknown) => reject(err instanceof Error ? err : new Error(String(err))));
    }, 'image/png');
  });
}

/**
 * Applies an effect to an ImageData buffer with performance timing.
 */
export function runEffect(
  effect: EffectDefinition,
  source: ImageData,
  params: EffectParamValues
): { output: ImageData; durationMs: number } {
  const start = performance.now();
  const output = effect.apply(source, params);
  const durationMs = Math.round((performance.now() - start) * 10) / 10;
  return { output, durationMs };
}
