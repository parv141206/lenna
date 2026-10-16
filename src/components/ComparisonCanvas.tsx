'use client';

import React, { useRef, useEffect, useState } from 'react';
import { renderImageDataToCanvas, downloadCanvas, copyCanvasToClipboard } from '../lib/transformer/engine';

interface ComparisonCanvasProps {
  originalImage: ImageData | null;
  transformedImage: ImageData | null;
  durationMs?: number;
  effectName: string;
  onApplyAsBase?: () => void;
}

export const ComparisonCanvas: React.FC<ComparisonCanvasProps> = ({
  originalImage,
  transformedImage,
  durationMs,
  effectName,
  onApplyAsBase,
}) => {
  const [viewMode, setViewMode] = useState<'split' | 'side-by-side' | 'single'>('split');
  const [sliderPos, setSliderPos] = useState(50);
  const [isCopied, setIsCopied] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const isDraggingSlider = useRef(false);

  const singleCanvasRef = useRef<HTMLCanvasElement>(null);
  const beforeCanvasRef = useRef<HTMLCanvasElement>(null);
  const afterCanvasRef = useRef<HTMLCanvasElement>(null);
  const splitBeforeCanvasRef = useRef<HTMLCanvasElement>(null);
  const splitAfterCanvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (transformedImage && singleCanvasRef.current) {
      renderImageDataToCanvas(transformedImage, singleCanvasRef.current);
    }
  }, [transformedImage, viewMode]);

  useEffect(() => {
    if (viewMode === 'side-by-side') {
      if (originalImage && beforeCanvasRef.current) {
        renderImageDataToCanvas(originalImage, beforeCanvasRef.current);
      }
      if (transformedImage && afterCanvasRef.current) {
        renderImageDataToCanvas(transformedImage, afterCanvasRef.current);
      }
    }
  }, [originalImage, transformedImage, viewMode]);

  useEffect(() => {
    if (viewMode === 'split') {
      if (originalImage && splitBeforeCanvasRef.current) {
        renderImageDataToCanvas(originalImage, splitBeforeCanvasRef.current);
      }
      if (transformedImage && splitAfterCanvasRef.current) {
        renderImageDataToCanvas(transformedImage, splitAfterCanvasRef.current);
      }
    }
  }, [originalImage, transformedImage, viewMode]);

  const handleMouseDown = () => {
    isDraggingSlider.current = true;
  };

  useEffect(() => {
    const onMouseUp = () => {
      isDraggingSlider.current = false;
    };
    const onMouseMove = (e: MouseEvent) => {
      if (isDraggingSlider.current && containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        const x = Math.max(0, Math.min(rect.width, e.clientX - rect.left));
        const percent = Math.round((x / rect.width) * 100);
        setSliderPos(percent);
      }
    };

    window.addEventListener('mouseup', onMouseUp);
    window.addEventListener('mousemove', onMouseMove);
    return () => {
      window.removeEventListener('mouseup', onMouseUp);
      window.removeEventListener('mousemove', onMouseMove);
    };
  }, []);

  const handleDownload = (format: 'image/png' | 'image/jpeg') => {
    const canvas = singleCanvasRef.current ?? afterCanvasRef.current ?? splitAfterCanvasRef.current;
    if (!canvas) return;
    const ext = format === 'image/jpeg' ? 'jpg' : 'png';
    const slug = effectName.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    downloadCanvas(canvas, `lenna-${slug}.${ext}`, format);
  };

  const handleCopy = async () => {
    const canvas = singleCanvasRef.current ?? afterCanvasRef.current ?? splitAfterCanvasRef.current;
    if (!canvas) return;
    try {
      await copyCanvasToClipboard(canvas);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch {
      alert('Could not copy image to clipboard.');
    }
  };

  if (!transformedImage) {
    return (
      <div className="flex flex-1 items-center justify-center p-8 font-mono text-xs text-neutral-600 uppercase bg-black">
        Awaiting input frame buffer...
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col font-mono text-xs bg-black">
      {/* Viewport Control Bar */}
      <div className="flex flex-wrap items-center justify-between border-b border-[#262626] bg-[#0a0a0a] px-3 py-1.5 gap-2">
        {/* Mode Toggles */}
        <div className="flex items-center gap-1 text-[10px] uppercase">
          <button
            onClick={() => setViewMode('split')}
            className={`border px-2 py-0.5 transition-colors ${
              viewMode === 'split' ? 'border-white bg-white text-black font-bold' : 'border-[#333] text-neutral-400 hover:border-white hover:text-white'
            }`}
          >
            [SPLIT SLIDER]
          </button>
          <button
            onClick={() => setViewMode('side-by-side')}
            className={`border px-2 py-0.5 transition-colors ${
              viewMode === 'side-by-side' ? 'border-white bg-white text-black font-bold' : 'border-[#333] text-neutral-400 hover:border-white hover:text-white'
            }`}
          >
            [DUAL VIEW]
          </button>
          <button
            onClick={() => setViewMode('single')}
            className={`border px-2 py-0.5 transition-colors ${
              viewMode === 'single' ? 'border-white bg-white text-black font-bold' : 'border-[#333] text-neutral-400 hover:border-white hover:text-white'
            }`}
          >
            [RESULT ONLY]
          </button>
        </div>

        {/* Technical Metric & Export Actions */}
        <div className="flex items-center gap-2 text-[10px] uppercase">
          {durationMs !== undefined && (
            <span className="text-neutral-500 font-mono">
              {"TIME // "}<span className="text-emerald-400">{durationMs}MS</span>
            </span>
          )}

          {onApplyAsBase && (
            <button
              onClick={onApplyAsBase}
              className="border border-[#444] px-2 py-0.5 text-neutral-300 hover:border-amber-400 hover:bg-amber-950/30 hover:text-amber-300"
              title="Chain this transformed image as new base"
            >
              [CHAIN]
            </button>
          )}

          <button
            onClick={handleCopy}
            className="border border-[#444] px-2 py-0.5 text-neutral-300 hover:border-white hover:bg-white hover:text-black"
          >
            {isCopied ? '[COPIED]' : '[COPY]'}
          </button>

          <button
            onClick={() => handleDownload('image/png')}
            className="border border-white bg-white px-2.5 py-0.5 font-bold text-black hover:bg-neutral-200"
          >
            [PNG]
          </button>
          <button
            onClick={() => handleDownload('image/jpeg')}
            className="border border-[#444] px-2 py-0.5 text-neutral-300 hover:border-white hover:bg-white hover:text-black"
          >
            [JPG]
          </button>
        </div>
      </div>

      {/* Main Technical Viewport Area */}
      <div className="relative flex flex-1 items-center justify-center overflow-hidden bg-[#050505] p-2">
        {/* Corner Crosshair Coordinates */}
        <div className="absolute top-2 left-2 text-[9px] text-neutral-700 font-mono pointer-events-none select-none">+ 0,0</div>
        <div className="absolute top-2 right-2 text-[9px] text-neutral-700 font-mono pointer-events-none select-none">+ W,0</div>
        <div className="absolute bottom-2 left-2 text-[9px] text-neutral-700 font-mono pointer-events-none select-none">+ 0,H</div>
        <div className="absolute bottom-2 right-2 text-[9px] text-neutral-700 font-mono pointer-events-none select-none">+ W,H</div>

        {viewMode === 'single' && (
          <div className="flex max-h-full max-w-full items-center justify-center overflow-auto border border-[#222]">
            <canvas ref={singleCanvasRef} className="max-h-[75vh] max-w-full object-contain" />
          </div>
        )}

        {viewMode === 'side-by-side' && (
          <div className="grid w-full h-full grid-cols-1 md:grid-cols-2 gap-2">
            <div className="flex flex-col items-center justify-center border border-[#222] bg-black p-2">
              <span className="mb-1 text-[9px] text-neutral-500 uppercase tracking-widest">{"// ORIGINAL BASE"}</span>
              <canvas ref={beforeCanvasRef} className="max-h-[68vh] max-w-full object-contain" />
            </div>
            <div className="flex flex-col items-center justify-center border border-[#333] bg-black p-2">
              <span className="mb-1 text-[9px] text-white uppercase tracking-widest">{"// "}{effectName}</span>
              <canvas ref={afterCanvasRef} className="max-h-[68vh] max-w-full object-contain" />
            </div>
          </div>
        )}

        {viewMode === 'split' && (
          <div
            ref={containerRef}
            className="relative flex max-h-[75vh] max-w-full cursor-ew-resize select-none items-center justify-center border border-[#262626]"
          >
            <canvas ref={splitAfterCanvasRef} className="max-h-[75vh] max-w-full object-contain" />

            <div
              className="absolute inset-0 overflow-hidden pointer-events-none"
              style={{ width: `${sliderPos}%` }}
            >
              <canvas
                ref={splitBeforeCanvasRef}
                className="max-h-[75vh] max-w-none object-contain"
                style={{
                  width: splitAfterCanvasRef.current?.clientWidth,
                  height: splitAfterCanvasRef.current?.clientHeight,
                }}
              />
            </div>

            {/* Stark 1px Hairline Slider Bar */}
            <div
              onMouseDown={handleMouseDown}
              className="absolute top-0 bottom-0 z-10 w-[1px] bg-white cursor-ew-resize"
              style={{ left: `${sliderPos}%` }}
            >
              <div className="absolute top-1/2 -left-3 -translate-y-1/2 flex h-5 w-6 items-center justify-center border border-white bg-black text-[9px] font-bold text-white uppercase">
                &lt;&gt;
              </div>
            </div>

            {/* Technical Viewport Badges */}
            <div className="pointer-events-none absolute bottom-2 left-2 border border-[#333] bg-black/80 px-1.5 py-0.5 text-[9px] text-neutral-400 uppercase">
              BASE
            </div>
            <div className="pointer-events-none absolute bottom-2 right-2 border border-white bg-black/90 px-1.5 py-0.5 text-[9px] text-white uppercase font-bold">
              {effectName}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
