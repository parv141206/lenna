'use client';

import React, { useState, useEffect, useRef } from 'react';
import type { EffectDefinition } from '@/lib/transformer/types';
import { getEffectById, getDefaultParamValues } from '@/lib/transformer/registry';
import {
  type EffectLayer,
  type BlendMode,
  LAYER_TRACK_COLORS,
  evaluateLayerStack,
} from '@/lib/transformer/layers';
import { SAMPLE_IMAGES } from '@/lib/transformer/samples';
import JSZip from 'jszip';

export interface TimelineImageItem {
  id: string;
  name: string;
  original: ImageData;
  thumbnailUrl: string;
  width: number;
  height: number;
}

export function createThumbnailUrl(imageData: ImageData, maxDim = 64): string {
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

const BLEND_MODES: { label: string; value: BlendMode }[] = [
  { label: 'NORMAL', value: 'normal' },
  { label: 'MULTIPLY', value: 'multiply' },
  { label: 'SCREEN', value: 'screen' },
  { label: 'OVERLAY', value: 'overlay' },
  { label: 'HARD LIGHT', value: 'hard-light' },
  { label: 'DARKEN', value: 'darken' },
  { label: 'LIGHTEN', value: 'lighten' },
  { label: 'DIFFERENCE', value: 'difference' },
  { label: 'ADD', value: 'add' },
];

interface DragSpanState {
  layerId: string;
  handle: 'right' | 'left' | 'paint';
  originIdx: number;
  currentIdx: number;
  initialIndices: number[];
}

interface EffectLayerTimelineProps {
  images: TimelineImageItem[];
  activeImageIndex: number;
  onSelectImageIndex: (index: number) => void;
  onUpdateImages: (images: TimelineImageItem[]) => void;

  layers: EffectLayer[];
  activeLayerId: string | null;
  onSelectLayer: (layerId: string) => void;
  onUpdateLayers: (layers: EffectLayer[]) => void;

  currentSelectedEffect: EffectDefinition;
  isProcessing?: boolean;
}

export function EffectLayerTimeline({
  images,
  activeImageIndex,
  onSelectImageIndex,
  onUpdateImages,
  layers,
  activeLayerId,
  onSelectLayer,
  onUpdateLayers,
  currentSelectedEffect,
  isProcessing = false,
}: EffectLayerTimelineProps) {
  const [isExpanded, setIsExpanded] = useState<boolean>(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Multi-selection state for images (Shift / Ctrl / Cmd)
  const [selectedImageIndices, setSelectedImageIndices] = useState<number[]>([activeImageIndex]);
  const [lastAnchorImageIndex, setLastAnchorImageIndex] = useState<number>(activeImageIndex);

  // Multi-selection state for layers (Shift / Ctrl / Cmd)
  const [selectedLayerIds, setSelectedLayerIds] = useState<string[]>(
    activeLayerId ? [activeLayerId] : []
  );
  const [lastAnchorLayerIndex, setLastAnchorLayerIndex] = useState<number>(0);

  // Horizontal drag expansion state for layer span bars
  const [dragSpan, setDragSpan] = useState<DragSpanState | null>(null);

  // Sync activeLayerId with selectedLayerIds
  useEffect(() => {
    if (activeLayerId && !selectedLayerIds.includes(activeLayerId)) {
      setSelectedLayerIds([activeLayerId]);
    }
  }, [activeLayerId, selectedLayerIds]);

  // Window mouseup listener to commit or cancel drag expansion
  useEffect(() => {
    const handleMouseUp = () => {
      if (dragSpan) {
        setDragSpan(null);
      }
    };
    window.addEventListener('mouseup', handleMouseUp);
    return () => window.removeEventListener('mouseup', handleMouseUp);
  }, [dragSpan]);

  // Handle image click with Shift and Ctrl/Cmd multi-selection
  const handleImageClick = (imgIdx: number, e: React.MouseEvent) => {
    if (e.shiftKey) {
      const start = Math.min(lastAnchorImageIndex, imgIdx);
      const end = Math.max(lastAnchorImageIndex, imgIdx);
      const range: number[] = [];
      for (let i = start; i <= end; i++) range.push(i);

      if (e.ctrlKey || e.metaKey) {
        const merged = Array.from(new Set([...selectedImageIndices, ...range])).sort((a, b) => a - b);
        setSelectedImageIndices(merged);
      } else {
        setSelectedImageIndices(range);
      }
      onSelectImageIndex(imgIdx);
    } else if (e.ctrlKey || e.metaKey) {
      const isSelected = selectedImageIndices.includes(imgIdx);
      let updated: number[];
      if (isSelected) {
        updated = selectedImageIndices.length > 1
          ? selectedImageIndices.filter((i) => i !== imgIdx)
          : selectedImageIndices;
      } else {
        updated = [...selectedImageIndices, imgIdx].sort((a, b) => a - b);
      }
      setSelectedImageIndices(updated);
      setLastAnchorImageIndex(imgIdx);
      onSelectImageIndex(imgIdx);
    } else {
      setSelectedImageIndices([imgIdx]);
      setLastAnchorImageIndex(imgIdx);
      onSelectImageIndex(imgIdx);
    }
  };

  // Handle layer click with Shift and Ctrl/Cmd multi-selection
  const handleLayerClick = (layerId: string, layerIdx: number, e: React.MouseEvent) => {
    if (e.shiftKey) {
      const start = Math.min(lastAnchorLayerIndex, layerIdx);
      const end = Math.max(lastAnchorLayerIndex, layerIdx);
      const rangeIds = layers.slice(start, end + 1).map((l) => l.id);
      setSelectedLayerIds(rangeIds);
      onSelectLayer(layerId);
    } else if (e.ctrlKey || e.metaKey) {
      const isSelected = selectedLayerIds.includes(layerId);
      const updated = isSelected
        ? selectedLayerIds.filter((id) => id !== layerId)
        : [...selectedLayerIds, layerId];
      setSelectedLayerIds(updated.length > 0 ? updated : [layerId]);
      setLastAnchorLayerIndex(layerIdx);
      onSelectLayer(layerId);
    } else {
      setSelectedLayerIds([layerId]);
      setLastAnchorLayerIndex(layerIdx);
      onSelectLayer(layerId);
    }
  };

  // Add new layer with current selected effect
  const handleAddLayer = () => {
    const color = LAYER_TRACK_COLORS[layers.length % LAYER_TRACK_COLORS.length]!;
    const newLayer: EffectLayer = {
      id: `layer-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      name: currentSelectedEffect.name,
      effectId: currentSelectedEffect.id,
      enabled: true,
      opacity: 100,
      blendMode: 'normal',
      parameters: getDefaultParamValues(currentSelectedEffect),
      color,
      spanIndices: selectedImageIndices.length > 0
        ? [...selectedImageIndices]
        : images.map((_, idx) => idx),
    };
    const updated = [newLayer, ...layers];
    onUpdateLayers(updated);
    onSelectLayer(newLayer.id);
    setSelectedLayerIds([newLayer.id]);
  };

  // Toggle layer mute
  const handleToggleLayerMute = (layerId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onUpdateLayers(
      layers.map((l) => (l.id === layerId ? { ...l, enabled: !l.enabled } : l))
    );
  };

  // Delete layer (or batch delete multi-selected layers)
  const handleDeleteLayer = (layerId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const idsToDelete = selectedLayerIds.includes(layerId) ? selectedLayerIds : [layerId];
    const updated = layers.filter((l) => !idsToDelete.includes(l.id));
    onUpdateLayers(updated);
    if (updated.length > 0) {
      onSelectLayer(updated[0]!.id);
      setSelectedLayerIds([updated[0]!.id]);
    } else {
      setSelectedLayerIds([]);
    }
  };

  // Move layer order
  const handleMoveLayer = (index: number, direction: -1 | 1, e: React.MouseEvent) => {
    e.stopPropagation();
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= layers.length) return;
    const updated = [...layers];
    const temp = updated[index]!;
    updated[index] = updated[newIndex]!;
    updated[newIndex] = temp;
    onUpdateLayers(updated);
  };

  // Change layer blend mode
  const handleBlendModeChange = (layerId: string, mode: BlendMode) => {
    onUpdateLayers(
      layers.map((l) => (l.id === layerId ? { ...l, blendMode: mode } : l))
    );
  };

  // Change layer opacity
  const handleOpacityChange = (layerId: string, opacity: number) => {
    onUpdateLayers(
      layers.map((l) => (l.id === layerId ? { ...l, opacity } : l))
    );
  };

  // Span all images
  const handleSpanAll = (layerId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onUpdateLayers(
      layers.map((l) =>
        l.id === layerId ? { ...l, spanIndices: images.map((_, idx) => idx) } : l
      )
    );
  };

  // Span to multi-selected images only
  const handleSpanToSelected = (layerId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (selectedImageIndices.length === 0) return;
    onUpdateLayers(
      layers.map((l) =>
        l.id === layerId ? { ...l, spanIndices: [...selectedImageIndices] } : l
      )
    );
  };

  // Horizontal Drag Expansion Handlers
  const handleStartRightDrag = (layer: EffectLayer, imgIdx: number, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setDragSpan({
      layerId: layer.id,
      handle: 'right',
      originIdx: imgIdx,
      currentIdx: imgIdx,
      initialIndices: [...layer.spanIndices],
    });
  };

  const handleStartLeftDrag = (layer: EffectLayer, imgIdx: number, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setDragSpan({
      layerId: layer.id,
      handle: 'left',
      originIdx: imgIdx,
      currentIdx: imgIdx,
      initialIndices: [...layer.spanIndices],
    });
  };

  const handleStartCellPaint = (layer: EffectLayer, imgIdx: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setDragSpan({
      layerId: layer.id,
      handle: 'paint',
      originIdx: imgIdx,
      currentIdx: imgIdx,
      initialIndices: [...layer.spanIndices],
    });

    // Toggle this single cell immediately
    const has = layer.spanIndices.includes(imgIdx);
    const updated = has
      ? layer.spanIndices.filter((i) => i !== imgIdx)
      : [...layer.spanIndices, imgIdx].sort((a, b) => a - b);
    onUpdateLayers(
      layers.map((l) => (l.id === layer.id ? { ...l, spanIndices: updated } : l))
    );
  };

  const handleCellMouseEnter = (layerId: string, targetImgIdx: number) => {
    if (dragSpan?.layerId !== layerId) return;

    const layer = layers.find((l) => l.id === layerId);
    if (!layer) return;

    if (dragSpan.handle === 'right') {
      // Expand / shrink right boundary: from min index of initial span to targetImgIdx
      const minIdx = Math.min(...dragSpan.initialIndices);
      const newIndices: number[] = [];
      const end = Math.max(minIdx, targetImgIdx);
      for (let i = minIdx; i <= end; i++) {
        newIndices.push(i);
      }
      onUpdateLayers(
        layers.map((l) => (l.id === layerId ? { ...l, spanIndices: newIndices } : l))
      );
    } else if (dragSpan.handle === 'left') {
      // Expand / shrink left boundary: from targetImgIdx to max index of initial span
      const maxIdx = Math.max(...dragSpan.initialIndices);
      const newIndices: number[] = [];
      const start = Math.min(maxIdx, targetImgIdx);
      for (let i = start; i <= maxIdx; i++) {
        newIndices.push(i);
      }
      onUpdateLayers(
        layers.map((l) => (l.id === layerId ? { ...l, spanIndices: newIndices } : l))
      );
    } else if (dragSpan.handle === 'paint') {
      // Paint range from originIdx to targetImgIdx
      const start = Math.min(dragSpan.originIdx, targetImgIdx);
      const end = Math.max(dragSpan.originIdx, targetImgIdx);
      const range: number[] = [];
      for (let i = start; i <= end; i++) range.push(i);
      const merged = Array.from(new Set([...layer.spanIndices, ...range])).sort((a, b) => a - b);
      onUpdateLayers(
        layers.map((l) => (l.id === layerId ? { ...l, spanIndices: merged } : l))
      );
    }
  };

  // Multi-file upload
  const handleFilesAdded = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const newItems: TimelineImageItem[] = [];
    let count = 0;

    Array.from(files).forEach((file, index) => {
      const reader = new FileReader();
      reader.onload = (ev) => {
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

          const item: TimelineImageItem = {
            id: `img-${Date.now()}-${index}`,
            name: file.name.replace(/\.[^/.]+$/, ''),
            original: imgData,
            thumbnailUrl: createThumbnailUrl(imgData),
            width: w,
            height: h,
          };
          newItems.push(item);
          count++;

          if (count === files.length) {
            const combined = [...images, ...newItems];
            onUpdateImages(combined);
            // auto-span existing layers over new images
            onUpdateLayers(
              layers.map((l) => ({
                ...l,
                spanIndices: combined.map((_, i) => i),
              }))
            );
          }
        };
        img.src = ev.target?.result as string;
      };
      reader.readAsDataURL(file);
    });

    e.target.value = '';
  };

  // Add 3 preset samples
  const handleAddAllPresets = () => {
    const samples = SAMPLE_IMAGES.map((sample, idx) => {
      const data = sample.generate(640, 640);
      return {
        id: `sample-${Date.now()}-${idx}`,
        name: sample.name,
        original: data,
        thumbnailUrl: createThumbnailUrl(data),
        width: 640,
        height: 640,
      };
    });
    const combined = [...images, ...samples];
    onUpdateImages(combined);
    onUpdateLayers(
      layers.map((l) => ({
        ...l,
        spanIndices: combined.map((_, i) => i),
      }))
    );
  };

  // Delete image (or batch delete selected images)
  const handleDeleteImages = (indicesToDelete: number[], e: React.MouseEvent) => {
    e.stopPropagation();
    if (images.length <= 1) return;
    const updated = images.filter((_, idx) => !indicesToDelete.includes(idx));
    onUpdateImages(updated);
    setSelectedImageIndices([0]);
    onSelectImageIndex(0);
    // Adjust layers' spanIndices to new image array length
    onUpdateLayers(
      layers.map((l) => ({
        ...l,
        spanIndices: l.spanIndices
          .filter((i) => !indicesToDelete.includes(i))
          .map((i) => {
            const shift = indicesToDelete.filter((delIdx) => delIdx < i).length;
            return i - shift;
          }),
      }))
    );
  };

  // Batch Export Composite ZIP
  const handleBatchExportZip = async () => {
    const zip = new JSZip();
    const folder = zip.folder('lenna_aftereffects_export');

    for (let imgIdx = 0; imgIdx < images.length; imgIdx++) {
      const img = images[imgIdx]!;
      const { output } = evaluateLayerStack(img.original, layers, imgIdx);

      const canvas = document.createElement('canvas');
      canvas.width = output.width;
      canvas.height = output.height;
      const ctx = canvas.getContext('2d')!;
      ctx.putImageData(output, 0, 0);

      const dataUrl = canvas.toDataURL('image/png');
      const base64 = dataUrl.split(',')[1]!;
      const cleanName = img.name.replace(/[^a-zA-Z0-9_-]/g, '_');
      const filename = `${String(imgIdx + 1).padStart(2, '0')}_${cleanName}_[${layers.length}_layers].png`;
      folder?.file(filename, base64, { base64: true });
    }

    const blob = await zip.generateAsync({ type: 'blob' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `lenna_composite_${images.length}_images.zip`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col border-t border-[#262626] bg-[#070709] text-white font-mono select-none">
      {/* After Effects Master Header Bar */}
      <div className="flex flex-wrap items-center justify-between border-b border-[#262626] px-3 py-1.5 text-xs bg-[#0b0b0e] gap-2">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="border border-[#333] px-1.5 py-0.5 text-[10px] uppercase font-bold text-neutral-300 hover:border-white hover:text-white"
          >
            {isExpanded ? '▼ HIDE TIMELINE' : '▲ SHOW TIMELINE'}
          </button>
          <span className="font-bold tracking-tight text-white uppercase text-[11px]">
            {"// AFTER EFFECTS COMPOSITION TIMELINE"}
          </span>
          <span className="border border-[#333] px-1 text-[9px] text-amber-300">
            {layers.length} {layers.length === 1 ? 'LAYER' : 'LAYERS'}
          </span>
          <span className="border border-[#333] px-1 text-[9px] text-neutral-400">
            {images.length} {images.length === 1 ? 'IMAGE' : 'IMAGES'}
          </span>
          {selectedImageIndices.length > 1 && (
            <span className="border border-amber-500 bg-amber-950/40 px-1 text-[9px] text-amber-300">
              {selectedImageIndices.length} IMAGES SELECTED (SHIFT/CTRL)
            </span>
          )}
          {isProcessing && (
            <span className="text-[9px] text-amber-400 font-bold animate-pulse">
              [COMPOSITING...]
            </span>
          )}
        </div>

        {/* Global Layer & Batch Actions */}
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
            onClick={handleAddLayer}
            className="border border-white bg-white text-black px-2 py-0.5 text-[10px] uppercase font-bold hover:bg-neutral-200 transition-colors"
            title={`Add new adjustment layer with [${currentSelectedEffect.name}]`}
          >
            {`+ ADD LAYER: [${currentSelectedEffect.name.slice(0, 16)}...]`}
          </button>

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="border border-neutral-700 bg-neutral-900 px-2 py-0.5 text-[10px] text-white uppercase hover:border-white transition-colors"
          >
            + ADD IMAGES
          </button>

          <button
            type="button"
            onClick={handleAddAllPresets}
            className="border border-neutral-800 px-1.5 py-0.5 text-[10px] text-neutral-400 uppercase hover:text-white hover:border-neutral-600 transition-colors"
          >
            + 3 PRESETS
          </button>

          {selectedImageIndices.length > 1 && (
            <button
              type="button"
              onClick={(e) => handleDeleteImages(selectedImageIndices, e)}
              className="border border-red-700 bg-red-950/50 text-red-300 px-1.5 py-0.5 text-[10px] uppercase hover:bg-red-900"
              title="Delete all multi-selected images"
            >
              DEL {selectedImageIndices.length} IMAGES
            </button>
          )}

          <span className="text-neutral-800">|</span>

          <button
            type="button"
            onClick={handleBatchExportZip}
            className="border border-emerald-600 bg-emerald-950/40 text-emerald-300 px-2 py-0.5 text-[10px] uppercase font-bold hover:bg-emerald-900 transition-colors"
            title="Render all layered composites into a ZIP"
          >
            EXPORT COMPOSITE ZIP
          </button>
        </div>
      </div>

      {/* Expanded After Effects Layer Stack + Multi-Image Span Grid */}
      {isExpanded && (
        <div className="grid grid-cols-1 md:grid-cols-12 h-[225px] overflow-hidden bg-black divide-x divide-[#262626]">
          {/* LEFT PANEL: Vertical Layer Stack List (md:col-span-5 lg:col-span-4) */}
          <div className="md:col-span-5 lg:col-span-4 flex flex-col h-full overflow-hidden bg-[#0a0a0c]">
            {/* Layer Stack Header */}
            <div className="flex items-center justify-between border-b border-[#262626] bg-[#0f0f12] px-2 py-1 text-[9px] text-neutral-400 uppercase">
              <span className="w-6 text-center">#</span>
              <span className="flex-1 px-1">EFFECT LAYER (SHIFT/CTRL MULTI-SELECT)</span>
              <span className="w-16 text-center">MODE</span>
              <span className="w-10 text-center">OPAC</span>
              <span className="w-20 text-right">ACTIONS</span>
            </div>

            {/* Vertical Stack List */}
            <div className="flex-1 overflow-y-auto no-scrollbar divide-y divide-[#1c1c20]">
              {layers.length === 0 ? (
                <div className="p-4 text-center text-neutral-600 text-[10px]">
                  NO ACTIVE EFFECT LAYERS.
                  <br />
                  CLICK <strong className="text-white">[+ ADD LAYER]</strong> TO STACK EFFECTS!
                </div>
              ) : (
                layers.map((layer, idx) => {
                  const isActive = layer.id === activeLayerId;
                  const isMultiSelected = selectedLayerIds.includes(layer.id);
                  const effectDef = getEffectById(layer.effectId);

                  return (
                    <div
                      key={layer.id}
                      onClick={(e) => handleLayerClick(layer.id, idx, e)}
                      className={`flex items-center justify-between px-2 py-1 text-[10px] cursor-pointer transition-colors ${
                        isActive
                          ? 'bg-[#181822] text-white border-l-2'
                          : isMultiSelected
                          ? 'bg-[#15151c] text-neutral-200 border-l'
                          : 'bg-[#08080a] text-neutral-300 hover:bg-[#121216]'
                      }`}
                      style={{ borderLeftColor: layer.color }}
                    >
                      {/* Layer Tag / Number */}
                      <div className="flex items-center gap-1 w-6">
                        <span
                          className="h-2 w-2 rounded-none shrink-0"
                          style={{ backgroundColor: layer.color }}
                          title="Layer Color Tag"
                        />
                        <span className="font-bold text-[9px] text-neutral-500">
                          {String(layers.length - idx).padStart(2, '0')}
                        </span>
                      </div>

                      {/* Eye / Mute Toggle + Layer Name */}
                      <div className="flex items-center gap-1.5 flex-1 min-w-0 px-1">
                        <button
                          type="button"
                          onClick={(e) => handleToggleLayerMute(layer.id, e)}
                          className={`text-[10px] px-0.5 hover:text-white ${
                            layer.enabled ? 'text-emerald-400' : 'text-neutral-600 line-through'
                          }`}
                          title={layer.enabled ? 'Mute Layer' : 'Enable Layer'}
                        >
                          {layer.enabled ? '👁' : '—'}
                        </button>
                        <span className="truncate font-semibold text-[10px]" title={effectDef?.name ?? layer.name}>
                          {effectDef?.name ?? layer.name}
                        </span>
                      </div>

                      {/* Blend Mode Dropdown */}
                      <div className="w-16 px-1" onClick={(e) => e.stopPropagation()}>
                        <select
                          value={layer.blendMode}
                          onChange={(e) => handleBlendModeChange(layer.id, e.target.value as BlendMode)}
                          aria-label={`Layer ${layer.name} blend mode`}
                          className="w-full bg-[#141416] border border-[#333] text-[8px] text-neutral-300 uppercase py-0.5 outline-none cursor-pointer"
                        >
                          {BLEND_MODES.map((bm) => (
                            <option key={bm.value} value={bm.value}>
                              {bm.label}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Opacity Value */}
                      <div className="w-10 text-center" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="number"
                          min={0}
                          max={100}
                          value={layer.opacity}
                          onChange={(e) => handleOpacityChange(layer.id, Number(e.target.value))}
                          aria-label={`Layer ${layer.name} opacity`}
                          className="w-8 bg-transparent text-center border-b border-[#333] text-[9px] text-white outline-none"
                        />
                      </div>

                      {/* Layer Actions (Span All / Span Selected / Move Up / Down / Delete) */}
                      <div className="flex items-center justify-end gap-1 w-20" onClick={(e) => e.stopPropagation()}>
                        <button
                          type="button"
                          onClick={(e) => handleSpanAll(layer.id, e)}
                          className="text-[7px] border border-[#333] px-1 text-neutral-400 hover:text-white hover:border-neutral-500"
                          title="Span across all images"
                        >
                          ALL
                        </button>
                        {selectedImageIndices.length > 1 && (
                          <button
                            type="button"
                            onClick={(e) => handleSpanToSelected(layer.id, e)}
                            className="text-[7px] border border-amber-600 text-amber-300 px-1 hover:bg-amber-950"
                            title="Span to multi-selected images"
                          >
                            SEL
                          </button>
                        )}
                        <button
                          type="button"
                          disabled={idx === 0}
                          onClick={(e) => handleMoveLayer(idx, -1, e)}
                          className="text-[8px] text-neutral-500 hover:text-white disabled:opacity-20"
                          title="Move Layer Up"
                        >
                          ▲
                        </button>
                        <button
                          type="button"
                          disabled={idx === layers.length - 1}
                          onClick={(e) => handleMoveLayer(idx, 1, e)}
                          className="text-[8px] text-neutral-500 hover:text-white disabled:opacity-20"
                          title="Move Layer Down"
                        >
                          ▼
                        </button>
                        <button
                          type="button"
                          onClick={(e) => handleDeleteLayer(layer.id, e)}
                          className="text-[9px] text-neutral-500 hover:text-red-400 pl-0.5"
                          title="Delete Layer"
                        >
                          ×
                        </button>
                      </div>
                    </div>
                  );
                })
              )}

              {/* Bottom Raw Base Layer */}
              <div className="flex items-center justify-between px-2 py-1 text-[9px] bg-black text-neutral-500 border-t border-[#1f1f22]">
                <div className="flex items-center gap-1.5">
                  <span className="h-2 w-2 bg-neutral-700" />
                  <span className="font-bold">00</span>
                  <span className="text-neutral-400">RAW BASE IMAGE [LOCKED]</span>
                </div>
                <span>NORMAL 100%</span>
              </div>
            </div>
          </div>

          {/* RIGHT PANEL: Horizontal Multi-Image Tracks & After Effects Drag-Expandable Span Bars */}
          <div className="md:col-span-7 lg:col-span-8 flex flex-col h-full overflow-x-auto no-scrollbar bg-[#050507]">
            {/* Top Multi-Image Column Headers with Shift/Ctrl Multi-Select */}
            <div className="flex border-b border-[#262626] bg-[#09090c] min-w-max">
              {images.map((img, imgIdx) => {
                const isActive = imgIdx === activeImageIndex;
                const isMultiSelected = selectedImageIndices.includes(imgIdx);

                return (
                  <div
                    key={img.id}
                    onClick={(e) => handleImageClick(imgIdx, e)}
                    className={`flex items-center gap-1.5 px-2 py-1 w-[150px] shrink-0 border-r border-[#262626] cursor-pointer transition-colors ${
                      isActive
                        ? 'bg-[#1c1c28] text-white border-b-2 border-b-amber-400'
                        : isMultiSelected
                        ? 'bg-[#151522] text-amber-200 border-b-2 border-b-amber-600'
                        : 'text-neutral-400 hover:bg-[#101014]'
                    }`}
                    title="Click to view image. Shift+Click to range select. Ctrl/Cmd+Click to toggle select."
                  >
                    {/* Mini Thumb */}
                    <div className="h-6 w-6 border border-[#333] shrink-0 bg-black overflow-hidden flex items-center justify-center">
                      {img.thumbnailUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={img.thumbnailUrl} alt={img.name} className="h-full w-full object-cover" />
                      ) : null}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-[9px] text-white">
                          {`IMG_${String(imgIdx + 1).padStart(2, '0')}`}
                        </span>
                        {isMultiSelected && (
                          <span className="text-[7px] text-amber-400 font-bold">●</span>
                        )}
                        {images.length > 1 && (
                          <button
                            type="button"
                            onClick={(e) => handleDeleteImages([imgIdx], e)}
                            className="text-neutral-500 hover:text-red-400 text-[8px]"
                            title="Remove Image"
                          >
                            ×
                          </button>
                        )}
                      </div>
                      <p className="truncate text-[8px] text-neutral-400">{img.name}</p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Matrix of Layer Span Bars with Horizontal Drag Handles */}
            <div className="flex-1 overflow-y-auto no-scrollbar divide-y divide-[#1a1a1f] min-w-max">
              {layers.map((layer) => {
                const isActive = layer.id === activeLayerId;
                const sortedSpans = [...layer.spanIndices].sort((a, b) => a - b);
                const minSpan = sortedSpans.length > 0 ? sortedSpans[0]! : -1;
                const maxSpan = sortedSpans.length > 0 ? sortedSpans[sortedSpans.length - 1]! : -1;

                return (
                  <div
                    key={layer.id}
                    className={`flex h-[26px] items-center ${isActive ? 'bg-[#0f0f15]' : ''}`}
                  >
                    {images.map((_, imgIdx) => {
                      const spansThisImage = layer.spanIndices.includes(imgIdx);
                      const isColActive = imgIdx === activeImageIndex;
                      const isLeftEdge = imgIdx === minSpan;
                      const isRightEdge = imgIdx === maxSpan;

                      return (
                        <div
                          key={imgIdx}
                          onMouseEnter={() => handleCellMouseEnter(layer.id, imgIdx)}
                          className={`w-[150px] h-full shrink-0 border-r border-[#1f1f25] flex items-center justify-center p-0.5 transition-colors ${
                            isColActive ? 'bg-[#ffffff]/5' : ''
                          }`}
                        >
                          {spansThisImage ? (
                            <div
                              className="group relative w-full h-full flex items-center justify-between px-1.5 text-[8px] font-bold uppercase transition-transform select-none"
                              style={{
                                backgroundColor: layer.color,
                                color: '#000000',
                              }}
                              title={`Spanning Image ${imgIdx + 1}. Drag edges ◀ ▶ to expand/shrink across images.`}
                            >
                              {/* Left In-Point Drag Handle */}
                              {isLeftEdge && (
                                <div
                                  onMouseDown={(e) => handleStartLeftDrag(layer, imgIdx, e)}
                                  className="absolute left-0 top-0 bottom-0 w-2.5 bg-black/40 hover:bg-black/70 flex items-center justify-center cursor-ew-resize text-[6px] text-white"
                                  title="Drag left handle to expand/shrink in-point"
                                >
                                  ◀
                                </div>
                              )}

                              <span className="truncate pl-2 pr-1">{layer.blendMode}</span>
                              <span className="pr-2">{layer.opacity}%</span>

                              {/* Right Out-Point Drag Handle */}
                              {isRightEdge && (
                                <div
                                  onMouseDown={(e) => handleStartRightDrag(layer, imgIdx, e)}
                                  className="absolute right-0 top-0 bottom-0 w-2.5 bg-black/40 hover:bg-black/70 flex items-center justify-center cursor-ew-resize text-[6px] text-white"
                                  title="Drag right handle to expand/shrink out-point to next images"
                                >
                                  ▶
                                </div>
                              )}
                            </div>
                          ) : (
                            <div
                              onMouseDown={(e) => handleStartCellPaint(layer, imgIdx, e)}
                              className="w-full h-full border border-dashed border-[#222] flex items-center justify-center text-[7px] text-neutral-600 hover:border-neutral-500 hover:text-neutral-400 cursor-pointer select-none"
                              title={`Click or drag to expand ${layer.name} over Image ${imgIdx + 1}`}
                            >
                              + SPAN
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                );
              })}

              {/* Base Image Locked Span Row */}
              <div className="flex h-[22px] items-center bg-black min-w-max">
                {images.map((_, imgIdx) => (
                  <div
                    key={imgIdx}
                    className="w-[150px] h-full shrink-0 border-r border-[#181820] flex items-center justify-center text-[8px] text-neutral-600"
                  >
                    RAW SOURCE [LOCKED]
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
