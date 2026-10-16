'use client';

import React, { useState, useEffect, useRef } from 'react';
import type { EffectDefinition, EffectParamValues } from '@/lib/transformer/types';
import { runEffect } from '@/lib/transformer/engine';
import { SAMPLE_IMAGES } from '@/lib/transformer/samples';
import JSZip from 'jszip';

export interface BatchItem {
  id: string;
  name: string;
  original: ImageData;
  transformed: ImageData | null;
  originalThumb: string;
  transformedThumb: string | null;
  durationMs?: number;
  selected: boolean;
}

export function createThumbnail(imageData: ImageData, maxDim = 84): string {
  if (typeof document === 'undefined') return '';
  const canvas = document.createElement('canvas');
  const scale = Math.min(maxDim / imageData.width, maxDim / imageData.height, 1);
  canvas.width = Math.max(1, Math.round(imageData.width * scale));
  canvas.height = Math.max(1, Math.round(imageData.height * scale));
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  const temp = document.createElement('canvas');
  temp.width = imageData.width;
  temp.height = imageData.height;
  const tempCtx = temp.getContext('2d');
  if (!tempCtx) return '';
  tempCtx.putImageData(imageData, 0, 0);

  ctx.drawImage(temp, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL('image/jpeg', 0.85);
}

interface BatchTimelinePanelProps {
  items: BatchItem[];
  activeItemId: string | null;
  onSelectItem: (item: BatchItem) => void;
  onUpdateItems: (items: BatchItem[]) => void;
  currentEffect: EffectDefinition;
  currentParams: EffectParamValues;
}

export function BatchTimelinePanel({
  items,
  activeItemId,
  onSelectItem,
  onUpdateItems,
  currentEffect,
  currentParams,
}: BatchTimelinePanelProps) {
  const [isExpanded, setIsExpanded] = useState<boolean>(true);
  const [isBatchProcessing, setIsBatchProcessing] = useState<boolean>(false);
  const [batchProgress, setBatchProgress] = useState<{ current: number; total: number } | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [playFps, setPlayFps] = useState<number>(3);
  const [loopPlayback, setLoopPlayback] = useState<boolean>(true);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const playbackTimerRef = useRef<NodeJS.Timeout | null>(null);

  const selectedCount = items.filter((i) => i.selected).length;

  // Auto-play loop through timeline clips
  useEffect(() => {
    if (!isPlaying || items.length <= 1) {
      if (playbackTimerRef.current) clearInterval(playbackTimerRef.current);
      return;
    }

    const interval = Math.max(100, Math.floor(1000 / playFps));
    playbackTimerRef.current = setInterval(() => {
      const currentIndex = items.findIndex((i) => i.id === activeItemId);
      let nextIndex = currentIndex + 1;
      if (nextIndex >= items.length) {
        if (loopPlayback) {
          nextIndex = 0;
        } else {
          setIsPlaying(false);
          return;
        }
      }
      const nextItem = items[nextIndex];
      if (nextItem) onSelectItem(nextItem);
    }, interval);

    return () => {
      if (playbackTimerRef.current) clearInterval(playbackTimerRef.current);
    };
  }, [isPlaying, items, activeItemId, playFps, loopPlayback, onSelectItem]);

  // Handle multi-file upload
  const handleFilesAdded = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const newItems: BatchItem[] = [];
    let loadedCount = 0;

    Array.from(files).forEach((file, index) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          const maxDim = 800;
          let w = img.width;
          let h = img.height;
          if (w > maxDim || h > maxDim) {
            if (w > h) {
              h = Math.round((h * maxDim) / w);
              w = maxDim;
            } else {
              w = Math.round((w * maxDim) / h);
              h = maxDim;
            }
          }

          const canvas = document.createElement('canvas');
          canvas.width = w;
          canvas.height = h;
          const ctx = canvas.getContext('2d')!;
          ctx.drawImage(img, 0, 0, w, h);
          const imgData = ctx.getImageData(0, 0, w, h);

          const newItem: BatchItem = {
            id: `batch-${Date.now()}-${index}-${Math.random().toString(36).slice(2, 6)}`,
            name: file.name.replace(/\.[^/.]+$/, ''),
            original: imgData,
            transformed: null,
            originalThumb: createThumbnail(imgData),
            transformedThumb: null,
            selected: true,
          };
          newItems.push(newItem);
          loadedCount++;

          if (loadedCount === files.length) {
            const combined = [...items, ...newItems];
            onUpdateItems(combined);
            if (!activeItemId && combined[0]) {
              onSelectItem(combined[0]);
            }
          }
        };
        img.src = event.target?.result as string;
      };
      reader.readAsDataURL(file);
    });

    e.target.value = '';
  };

  // Add all 3 sample images
  const handleAddAllSamples = () => {
    const newItems: BatchItem[] = SAMPLE_IMAGES.map((sample, idx) => {
      const imgData = sample.generate(640, 640);
      return {
        id: `sample-${Date.now()}-${idx}`,
        name: sample.name,
        original: imgData,
        transformed: null,
        originalThumb: createThumbnail(imgData),
        transformedThumb: null,
        selected: true,
      };
    });
    const combined = [...items, ...newItems];
    onUpdateItems(combined);
    if (!activeItemId && combined[0]) {
      onSelectItem(combined[0]);
    }
  };

  // Selection actions
  const handleSelectAll = (select: boolean) => {
    onUpdateItems(items.map((i) => ({ ...i, selected: select })));
  };

  const handleInvertSelection = () => {
    onUpdateItems(items.map((i) => ({ ...i, selected: !i.selected })));
  };

  const handleDeleteSelected = () => {
    const remaining = items.filter((i) => !i.selected);
    onUpdateItems(remaining);
    if (remaining.length > 0) {
      if (!remaining.find((i) => i.id === activeItemId)) {
        onSelectItem(remaining[0]!);
      }
    }
  };

  const handleDeleteItem = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const remaining = items.filter((i) => i.id !== id);
    onUpdateItems(remaining);
    if (activeItemId === id && remaining.length > 0) {
      onSelectItem(remaining[0]!);
    }
  };

  const handleToggleItemSelection = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onUpdateItems(
      items.map((i) => (i.id === id ? { ...i, selected: !i.selected } : i))
    );
  };

  // Batch Processing
  const handleBatchTransform = async () => {
    const targets = items.filter((i) => i.selected);
    if (targets.length === 0) return;

    setIsBatchProcessing(true);
    setBatchProgress({ current: 0, total: targets.length });

    const updated = [...items];

    for (let idx = 0; idx < targets.length; idx++) {
      const target = targets[idx]!;
      setBatchProgress({ current: idx + 1, total: targets.length });

      // Allow UI thread to breathe
      await new Promise((r) => setTimeout(r, 20));

      const { output, durationMs } = runEffect(currentEffect, target.original, currentParams);
      const thumb = createThumbnail(output);

      const targetIndex = updated.findIndex((i) => i.id === target.id);
      if (targetIndex !== -1) {
        updated[targetIndex] = {
          ...target,
          transformed: output,
          transformedThumb: thumb,
          durationMs,
        };
      }
    }

    onUpdateItems(updated);
    setIsBatchProcessing(false);
    setBatchProgress(null);

    // If active item was processed, notify
    const currentActive = updated.find((i) => i.id === activeItemId);
    if (currentActive) {
      onSelectItem(currentActive);
    }
  };

  // Batch Export as ZIP
  const handleBatchExportZip = async () => {
    const targets = items.filter((i) => i.transformed);
    if (targets.length === 0) {
      alert('No transformed images to export. Run batch transform first!');
      return;
    }

    const zip = new JSZip();
    const folder = zip.folder('lenna_batch_export');

    for (let i = 0; i < targets.length; i++) {
      const item = targets[i]!;
      const canvas = document.createElement('canvas');
      canvas.width = item.transformed!.width;
      canvas.height = item.transformed!.height;
      const ctx = canvas.getContext('2d')!;
      ctx.putImageData(item.transformed!, 0, 0);

      const dataUrl = canvas.toDataURL('image/png');
      const base64 = dataUrl.split(',')[1]!;
      const cleanName = item.name.replace(/[^a-zA-Z0-9_-]/g, '_');
      const filename = `${String(i + 1).padStart(2, '0')}_${cleanName}_[${currentEffect.id}].png`;
      folder?.file(filename, base64, { base64: true });
    }

    const blob = await zip.generateAsync({ type: 'blob' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `lenna_batch_${currentEffect.id}_${targets.length}_images.zip`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Step navigation
  const handleStep = (direction: -1 | 1) => {
    const curIndex = items.findIndex((i) => i.id === activeItemId);
    if (curIndex === -1) return;
    const nextIndex = curIndex + direction;
    const item = items[nextIndex];
    if (item) {
      onSelectItem(item);
    }
  };

  const handleJump = (index: number) => {
    const item = items[index];
    if (item) {
      onSelectItem(item);
    }
  };

  return (
    <div className="flex flex-col border-t border-[#262626] bg-[#08080a] text-white font-mono select-none">
      {/* Timeline Master Transport Bar */}
      <div className="flex flex-wrap items-center justify-between border-b border-[#262626] px-3 py-1.5 text-xs bg-[#0d0d0f] gap-2">
        {/* Left: Section Tag & Collapse */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="border border-[#333] px-1.5 py-0.5 text-[10px] uppercase font-bold text-neutral-300 hover:border-white hover:text-white"
          >
            {isExpanded ? '▼ HIDE TIMELINE' : '▲ SHOW TIMELINE'}
          </button>
          <span className="font-bold tracking-tight text-white uppercase text-[11px]">
            {"// BATCH TIMELINE"}
          </span>
          <span className="border border-[#333] px-1 text-[9px] text-neutral-400">
            {items.length} {items.length === 1 ? 'IMAGE' : 'IMAGES'}
          </span>
          {selectedCount > 0 && (
            <span className="bg-neutral-800 px-1 text-[9px] text-amber-300">
              {selectedCount} SELECTED
            </span>
          )}
        </div>

        {/* Center: Adobe Premiere-Style Transport Controls */}
        {isExpanded && items.length > 0 && (
          <div className="flex items-center gap-1 text-[10px] bg-black border border-[#262626] px-1.5 py-0.5">
            <button
              type="button"
              onClick={() => handleJump(0)}
              className="px-1 text-neutral-400 hover:text-white"
              title="First Frame"
            >
              |◀
            </button>
            <button
              type="button"
              onClick={() => handleStep(-1)}
              className="px-1 text-neutral-400 hover:text-white"
              title="Previous Frame"
            >
              ◀
            </button>
            <button
              type="button"
              onClick={() => setIsPlaying(!isPlaying)}
              className={`px-2 py-0.5 font-bold uppercase transition-colors ${
                isPlaying ? 'bg-amber-400 text-black' : 'bg-neutral-800 text-white hover:bg-white hover:text-black'
              }`}
              title="Play/Pause Timeline Sequence"
            >
              {isPlaying ? '■ STOP' : '▶ PLAY'}
            </button>
            <button
              type="button"
              onClick={() => handleStep(1)}
              className="px-1 text-neutral-400 hover:text-white"
              title="Next Frame"
            >
              ▶
            </button>
            <button
              type="button"
              onClick={() => handleJump(items.length - 1)}
              className="px-1 text-neutral-400 hover:text-white"
              title="Last Frame"
            >
              ▶|
            </button>
            <span className="text-neutral-700">|</span>
            <button
              type="button"
              onClick={() => setLoopPlayback(!loopPlayback)}
              className={`px-1 text-[9px] ${loopPlayback ? 'text-emerald-400 font-bold' : 'text-neutral-600'}`}
              title="Toggle Loop"
            >
              LOOP
            </button>
            <select
              value={playFps}
              onChange={(e) => setPlayFps(Number(e.target.value))}
              aria-label="Playback Speed"
              className="bg-transparent text-[9px] text-neutral-400 uppercase outline-none cursor-pointer"
            >
              <option value={1} className="bg-black text-white">1 FPS</option>
              <option value={2} className="bg-black text-white">2 FPS</option>
              <option value={3} className="bg-black text-white">3 FPS</option>
              <option value={5} className="bg-black text-white">5 FPS</option>
              <option value={10} className="bg-black text-white">10 FPS</option>
            </select>
          </div>
        )}

        {/* Right: Batch Actions & Multi-File Add */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*"
            onChange={handleFilesAdded}
            className="hidden"
          />

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="border border-neutral-700 bg-neutral-900 px-2 py-0.5 text-[10px] text-white uppercase hover:border-white transition-colors"
          >
            + ADD IMAGES
          </button>

          <button
            type="button"
            onClick={handleAddAllSamples}
            className="border border-neutral-800 px-1.5 py-0.5 text-[10px] text-neutral-400 uppercase hover:text-white hover:border-neutral-600 transition-colors"
            title="Add all 3 procedural presets"
          >
            + 3 PRESETS
          </button>

          {isExpanded && items.length > 0 && (
            <>
              <span className="text-neutral-800">|</span>
              <button
                type="button"
                onClick={() => handleSelectAll(true)}
                className="text-[9px] text-neutral-400 hover:text-white uppercase"
              >
                ALL
              </button>
              <button
                type="button"
                onClick={() => handleSelectAll(false)}
                className="text-[9px] text-neutral-400 hover:text-white uppercase"
              >
                NONE
              </button>
              <button
                type="button"
                onClick={handleInvertSelection}
                className="text-[9px] text-neutral-400 hover:text-white uppercase"
              >
                INV
              </button>

              {selectedCount > 0 && (
                <button
                  type="button"
                  onClick={handleDeleteSelected}
                  className="text-[9px] text-red-400 hover:text-red-300 uppercase"
                >
                  DEL
                </button>
              )}

              <span className="text-neutral-800">|</span>

              {/* Batch Transform Trigger */}
              <button
                type="button"
                disabled={isBatchProcessing || selectedCount === 0}
                onClick={handleBatchTransform}
                className={`border px-2 py-0.5 text-[10px] uppercase font-bold transition-colors ${
                  isBatchProcessing
                    ? 'border-amber-400 bg-amber-400 text-black'
                    : selectedCount > 0
                    ? 'border-white bg-white text-black hover:bg-neutral-200'
                    : 'border-[#333] text-neutral-600 cursor-not-allowed'
                }`}
              >
                {isBatchProcessing
                  ? `COMPUTING [${batchProgress?.current}/${batchProgress?.total}]`
                  : `⚡ BATCH TRANSFORM (${selectedCount})`}
              </button>

              {/* Batch Export ZIP */}
              <button
                type="button"
                onClick={handleBatchExportZip}
                className="border border-[#444] bg-neutral-900 px-2 py-0.5 text-[10px] text-white uppercase hover:border-emerald-400 hover:text-emerald-400 transition-colors"
                title="Download all transformed images in a ZIP"
              >
                EXPORT ZIP
              </button>
            </>
          )}
        </div>
      </div>

      {/* Expanded Filmstrip / Timeline Track */}
      {isExpanded && (
        <div className="relative flex flex-col h-[145px] overflow-hidden bg-black">
          {/* Timecode / Track Header Ruler */}
          <div className="flex items-center border-b border-[#1f1f22] bg-[#0c0c0e] px-3 py-1 text-[9px] text-neutral-500 uppercase tracking-wider">
            <span className="w-16">TIMELINE</span>
            <div className="flex-1 flex justify-between px-2 text-neutral-600 font-mono text-[8px]">
              {items.map((_, idx) => (
                <span key={idx} className="shrink-0">
                  {`00:00:${String(idx).padStart(2, '0')}:00`}
                </span>
              ))}
            </div>
          </div>

          {/* Filmstrip Clips Container */}
          <div className="flex-1 overflow-x-auto p-2.5 flex items-center gap-2 no-scrollbar">
            {items.length === 0 ? (
              <div className="w-full flex flex-col items-center justify-center text-neutral-600 text-xs py-4">
                <span>TIMELINE QUEUE EMPTY</span>
                <span className="text-[10px] text-neutral-700 mt-1">
                  {"CLICK [+ ADD IMAGES] OR [+ 3 PRESETS] TO INGEST MULTIPLE IMAGES"}
                </span>
              </div>
            ) : (
              items.map((item, index) => {
                const isActive = item.id === activeItemId;
                const hasTransformed = Boolean(item.transformed && item.transformedThumb);
                const displayThumb = item.transformedThumb ?? item.originalThumb;

                return (
                  <div
                    key={item.id}
                    onClick={() => onSelectItem(item)}
                    className={`group relative flex flex-col shrink-0 w-[140px] h-[105px] border cursor-pointer transition-all ${
                      isActive
                        ? 'border-white bg-[#141418] shadow-lg ring-1 ring-white'
                        : 'border-[#262626] bg-[#0a0a0c] hover:border-neutral-500'
                    }`}
                  >
                    {/* Clip Card Top Bar */}
                    <div className="flex items-center justify-between border-b border-[#222] px-1.5 py-0.5 text-[8px] bg-[#060608]">
                      <div className="flex items-center gap-1">
                        <input
                          type="checkbox"
                          checked={item.selected}
                          onChange={(e) => handleToggleItemSelection(item.id, e as any)}
                          onClick={(e) => e.stopPropagation()}
                          className="h-2.5 w-2.5 cursor-pointer accent-white"
                          title="Select for batch"
                        />
                        <span className="font-bold text-neutral-300">
                          {String(index + 1).padStart(2, '0')}
                        </span>
                      </div>
                      <span className="truncate max-w-[70px] text-neutral-400 font-mono">
                        {item.name}
                      </span>
                      <button
                        type="button"
                        onClick={(e) => handleDeleteItem(item.id, e)}
                        className="text-neutral-500 hover:text-red-400 px-0.5"
                        title="Remove from timeline"
                      >
                        ×
                      </button>
                    </div>

                    {/* Clip Thumbnail Area */}
                    <div className="relative flex-1 bg-neutral-950 flex items-center justify-center overflow-hidden">
                      {displayThumb ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={displayThumb}
                          alt={item.name}
                          className="h-full w-full object-contain"
                        />
                      ) : (
                        <span className="text-[8px] text-neutral-600">NO PREVIEW</span>
                      )}

                      {/* Active Indicator Strip */}
                      {isActive && (
                        <div className="absolute top-1 right-1 bg-white text-black text-[7px] font-bold px-1 uppercase">
                          ACTIVE
                        </div>
                      )}

                      {/* FX Status Pill */}
                      <div className="absolute bottom-1 left-1">
                        {hasTransformed ? (
                          <span className="bg-emerald-950 border border-emerald-500 text-emerald-400 text-[7px] px-1 font-bold">
                            FX {item.durationMs ? `${item.durationMs.toFixed(0)}ms` : 'OK'}
                          </span>
                        ) : (
                          <span className="bg-neutral-900 border border-neutral-700 text-neutral-400 text-[7px] px-1">
                            RAW
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Dimensions & Resolution Bar */}
                    <div className="flex items-center justify-between border-t border-[#222] px-1.5 py-0.5 text-[8px] text-neutral-500 bg-[#060608]">
                      <span>{item.original.width}×{item.original.height}</span>
                      <span className="text-[7px] text-neutral-600">
                        {hasTransformed ? 'READY' : 'PENDING'}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
