'use client';

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { SAMPLE_IMAGES } from '@/lib/transformer/samples';
import { getAllEffects, getEffectById, getDefaultParamValues } from '@/lib/transformer/registry';
import type { EffectDefinition, EffectParamValues } from '@/lib/transformer/types';
import { cloneImageData } from '@/lib/transformer/matrix';
import { DEFAULT_PALETTE, type ColorPalette } from '@/lib/transformer/palette';
import {
  type EffectLayer,
  LAYER_TRACK_COLORS,
  evaluateLayerStack,
} from '@/lib/transformer/layers';
import { ImageUploader } from '@/components/ImageUploader';
import { EffectSelector } from '@/components/EffectSelector';
import { EffectControls } from '@/components/EffectControls';
import { ComparisonCanvas } from '@/components/ComparisonCanvas';
import { PaletteManager } from '@/components/PaletteManager';
import {
  EffectLayerTimeline,
  type TimelineImageItem,
  createThumbnailUrl,
} from '@/components/EffectLayerTimeline';

const ALL_EFFECT_LIST = getAllEffects();

export default function HomePage() {
  const allEffects = ALL_EFFECT_LIST;

  // Multi-Image Project Queue
  const [images, setImages] = useState<TimelineImageItem[]>([]);
  const [activeImageIndex, setActiveImageIndex] = useState<number>(0);

  // After Effects Multi-Layer Effect Stack
  const [layers, setLayers] = useState<EffectLayer[]>([]);
  const [activeLayerId, setActiveLayerId] = useState<string | null>(null);

  // Render & processing state
  const [transformedImage, setTransformedImage] = useState<ImageData | null>(null);
  const [renderDuration, setRenderDuration] = useState<number>(0);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  // Global Project Color Palette (editorial consistency across images)
  const [currentPalette, setCurrentPalette] = useState<ColorPalette>(DEFAULT_PALETTE);

  // Initial setup: Load 3 preset images & initial 2-layer composition stack
  useEffect(() => {
    const initialImages: TimelineImageItem[] = SAMPLE_IMAGES.map((sample, idx) => {
      const data = sample.generate(640, 640);
      return {
        id: `init-sample-${idx}`,
        name: sample.name,
        original: data,
        thumbnailUrl: createThumbnailUrl(data),
        width: 640,
        height: 640,
      };
    });

    const fmEffect = getEffectById('stochastic-fm-screen') ?? ALL_EFFECT_LIST[0]!;
    const chromEffect = getEffectById('lateral-chromatic-dispersion') ?? ALL_EFFECT_LIST[1]!;

    const initialLayers: EffectLayer[] = [
      {
        id: 'layer-01-fm',
        name: fmEffect.name,
        effectId: fmEffect.id,
        enabled: true,
        opacity: 100,
        blendMode: 'normal',
        parameters: getDefaultParamValues(fmEffect),
        color: LAYER_TRACK_COLORS[1]!, // orange
        spanIndices: [0, 1, 2],
      },
      {
        id: 'layer-02-chrom',
        name: chromEffect.name,
        effectId: chromEffect.id,
        enabled: true,
        opacity: 75,
        blendMode: 'screen',
        parameters: getDefaultParamValues(chromEffect),
        color: LAYER_TRACK_COLORS[4]!, // cyan
        spanIndices: [0, 1, 2],
      },
    ];

    setImages(initialImages);
    setActiveImageIndex(0);
    setLayers(initialLayers);
    setActiveLayerId(initialLayers[0]!.id);
  }, []);

  // Currently active image
  const activeImage = images[activeImageIndex] ?? null;

  // Currently active layer
  const activeLayer = useMemo(() => {
    return layers.find((l) => l.id === activeLayerId) ?? layers[0] ?? null;
  }, [layers, activeLayerId]);

  // Selected effect definition for the active layer
  const activeEffectDef = useMemo(() => {
    if (!activeLayer) return allEffects[0]!;
    return getEffectById(activeLayer.effectId) ?? allEffects[0]!;
  }, [activeLayer, allEffects]);

  // Active parameter values for the active layer
  const activeParamValues = useMemo(() => {
    if (!activeLayer) return getDefaultParamValues(activeEffectDef);
    return activeLayer.parameters;
  }, [activeLayer, activeEffectDef]);

  const rafIdRef = useRef<number | null>(null);
  const pendingCompositeRef = useRef<{
    img: TimelineImageItem;
    layers: EffectLayer[];
    index: number;
  } | null>(null);

  // High-performance RAF-scheduled composite evaluation on active image
  const scheduleComposite = useCallback(
    (currentImg: TimelineImageItem | null, currentLayers: EffectLayer[], imgIndex: number) => {
      if (!currentImg) return;
      pendingCompositeRef.current = {
        img: currentImg,
        layers: currentLayers,
        index: imgIndex,
      };

      if (rafIdRef.current !== null) {
        // Already a frame scheduled, the latest pending arguments will be evaluated on next frame
        return;
      }

      setIsProcessing(true);
      rafIdRef.current = requestAnimationFrame(() => {
        rafIdRef.current = null;
        const pending = pendingCompositeRef.current;
        if (!pending) {
          setIsProcessing(false);
          return;
        }

        try {
          const { output, totalDurationMs } = evaluateLayerStack(
            pending.img.original,
            pending.layers,
            pending.index
          );
          setTransformedImage(output);
          setRenderDuration(totalDurationMs);
        } catch (err) {
          console.error('Compositing error:', err);
        } finally {
          setIsProcessing(false);
        }
      });
    },
    []
  );

  // Clean up RAF on unmount
  useEffect(() => {
    return () => {
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current);
      }
    };
  }, []);

  // Trigger composite evaluation whenever images, layers, or active image changes
  useEffect(() => {
    if (activeImage && layers.length >= 0) {
      scheduleComposite(activeImage, layers, activeImageIndex);
    }
  }, [activeImage, layers, activeImageIndex, scheduleComposite]);

  // Handle selecting an effect from the algorithm catalog
  const handleSelectEffect = (effect: EffectDefinition) => {
    if (!activeLayer) {
      // Add layer if none exists
      const newLayer: EffectLayer = {
        id: `layer-${Date.now()}`,
        name: effect.name,
        effectId: effect.id,
        enabled: true,
        opacity: 100,
        blendMode: 'normal',
        parameters: getDefaultParamValues(effect),
        color: LAYER_TRACK_COLORS[layers.length % LAYER_TRACK_COLORS.length]!,
        spanIndices: images.map((_, i) => i),
      };
      setLayers([newLayer]);
      setActiveLayerId(newLayer.id);
      return;
    }

    // Update active layer's effect and reset its params
    setLayers((prev) =>
      prev.map((l) =>
        l.id === activeLayer.id
          ? {
              ...l,
              name: effect.name,
              effectId: effect.id,
              parameters: getDefaultParamValues(effect),
            }
          : l
      )
    );
  };

  // Handle parameter changes for active layer
  const handleParamChange = (paramId: string, value: any) => {
    if (!activeLayer) return;
    setLayers((prev) =>
      prev.map((l) =>
        l.id === activeLayer.id
          ? {
              ...l,
              parameters: {
                ...l.parameters,
                [paramId]: value,
              },
            }
          : l
      )
    );
  };

  // Reset active layer params
  const handleResetParams = () => {
    if (!activeLayer) return;
    setLayers((prev) =>
      prev.map((l) =>
        l.id === activeLayer.id
          ? {
              ...l,
              parameters: getDefaultParamValues(activeEffectDef),
            }
          : l
      )
    );
  };

  // Randomize active layer params
  const handleRandomizeParams = () => {
    if (!activeLayer) return;
    const randomVals: EffectParamValues = {};
    for (const [key, param] of Object.entries(activeEffectDef.parameters)) {
      if (param.type === 'range') {
        const span = param.max - param.min;
        const steps = Math.floor(span / param.step);
        const randStep = Math.floor(Math.random() * (steps + 1));
        const val = param.min + randStep * param.step;
        randomVals[key] = Math.round(val * 100) / 100;
      } else if (param.type === 'boolean') {
        randomVals[key] = Math.random() > 0.5;
      } else if (param.type === 'color') {
        if (currentPalette.colors.length > 0 && Math.random() > 0.3) {
          const randPalColor =
            currentPalette.colors[Math.floor(Math.random() * currentPalette.colors.length)]!;
          randomVals[key] = randPalColor;
        } else {
          const randColor =
            '#' +
            Math.floor(Math.random() * 16777215)
              .toString(16)
              .padStart(6, '0');
          randomVals[key] = randColor;
        }
      } else if (param.type === 'select') {
        const opts = param.options;
        const randOpt = opts[Math.floor(Math.random() * opts.length)]!;
        randomVals[key] = randOpt.value;
      }
    }
    setLayers((prev) =>
      prev.map((l) =>
        l.id === activeLayer.id ? { ...l, parameters: randomVals } : l
      )
    );
  };

  // Image Upload handler: adds to images and selects it
  const handleImageLoaded = (imageData: ImageData, name: string) => {
    const newItem: TimelineImageItem = {
      id: `img-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      name,
      original: imageData,
      thumbnailUrl: createThumbnailUrl(imageData),
      width: imageData.width,
      height: imageData.height,
    };
    const newIndex = images.length;
    setImages((prev) => [...prev, newItem]);
    setActiveImageIndex(newIndex);
    // Span existing layers to include new image
    setLayers((prev) =>
      prev.map((l) => ({
        ...l,
        spanIndices: [...l.spanIndices, newIndex],
      }))
    );
  };

  const handleApplyAsBase = () => {
    if (transformedImage && activeImage) {
      const cloned = cloneImageData(transformedImage);
      const thumb = createThumbnailUrl(cloned);
      setImages((prev) =>
        prev.map((img, idx) =>
          idx === activeImageIndex
            ? { ...img, original: cloned, thumbnailUrl: thumb }
            : img
        )
      );
    }
  };

  // Palette handlers
  const handleUpdatePaletteColors = (colors: string[]) => {
    setCurrentPalette((prev) => ({
      ...prev,
      colors,
    }));
  };

  const handleAddToPalette = (color: string) => {
    if (!currentPalette.colors.includes(color.toLowerCase())) {
      setCurrentPalette((prev) => ({
        ...prev,
        colors: [...prev.colors, color.toLowerCase()],
      }));
    }
  };

  return (
    <div className="min-h-screen bg-black text-white font-mono flex flex-col select-none">
      {/* Edge-to-Edge Technical Grid Header */}
      <header className="grid grid-cols-1 md:grid-cols-12 border-b border-[#262626] bg-black text-xs uppercase">
        {/* Logo Cell */}
        <div className="md:col-span-3 flex items-center border-b md:border-b-0 md:border-r border-[#262626] px-4 py-2.5">
          <span className="text-sm font-black tracking-tight text-white">[Lenna]</span>
          <span className="ml-2 text-[10px] text-neutral-500">{"// COMPOSITING LAB"}</span>
        </div>

        {/* System Meta Cell */}
        <div className="md:col-span-4 flex items-center border-b md:border-b-0 md:border-r border-[#262626] px-4 py-2 text-[11px] text-neutral-400 gap-3 overflow-x-auto no-scrollbar">
          <span>ALGORITHMS: <strong className="text-white">56</strong></span>
          <span className="text-neutral-700">|</span>
          <span>STACK: <strong className="text-white">{layers.length} LAYERS</strong></span>
          <span className="text-neutral-700">|</span>
          <span>ESTHETIC: <strong className="text-white">AFTER EFFECTS TIMELINE</strong></span>
        </div>

        {/* Color Palette Station Cell (replaces old wasted SYS_STATUS) */}
        <div className="md:col-span-5 flex items-center bg-[#070709]">
          <PaletteManager
            currentPalette={currentPalette}
            onSelectPalette={setCurrentPalette}
            onUpdateColors={handleUpdatePaletteColors}
            isProcessing={isProcessing}
          />
        </div>
      </header>

      {/* Flush Image Uploader & Presets Row */}
      <ImageUploader
        onImageLoaded={handleImageLoaded}
        currentImageName={activeImage?.name ?? 'No Image'}
        imageDimensions={
          activeImage
            ? { width: activeImage.width, height: activeImage.height }
            : undefined
        }
      />

      {/* 3-Column Flush Workstation Grid (Zero padding, zero margin, full hairlines) */}
      <main className="flex-1 grid grid-cols-1 lg:grid-cols-12 min-h-0 border-b border-[#262626]">
        {/* Col 1: Algorithm Catalog (lg:col-span-4 xl:col-span-3) */}
        <div className="lg:col-span-4 xl:col-span-3 border-b lg:border-b-0 lg:border-r border-[#262626] flex flex-col h-[360px] lg:h-[calc(100vh-340px)] overflow-hidden">
          <EffectSelector
            selectedEffectId={activeEffectDef.id}
            onSelectEffect={handleSelectEffect}
          />
        </div>

        {/* Col 2: Parameter Controls for Active Layer (lg:col-span-3 xl:col-span-3) */}
        <div className="lg:col-span-3 xl:col-span-3 border-b lg:border-b-0 lg:border-r border-[#262626] flex flex-col h-[340px] lg:h-[calc(100vh-340px)] overflow-hidden">
          <div className="border-b border-[#262626] bg-[#0c0c10] px-3 py-1.5 text-[10px] flex items-center justify-between">
            <span className="text-neutral-400 uppercase font-bold">
              {"ACTIVE LAYER // "}{activeLayer?.name ?? 'NONE'}
            </span>
            {activeLayer && (
              <span
                className="px-1.5 py-0.2 text-[8px] font-bold text-black uppercase"
                style={{ backgroundColor: activeLayer.color }}
              >
                {activeLayer.blendMode}
              </span>
            )}
          </div>
          <div className="flex-1 min-h-0 overflow-hidden">
            <EffectControls
              effect={activeEffectDef}
              values={activeParamValues}
              onChange={handleParamChange}
              onReset={handleResetParams}
              onRandomize={handleRandomizeParams}
              palette={currentPalette.colors}
              onAddToPalette={handleAddToPalette}
            />
          </div>
        </div>

        {/* Col 3: Comparison Viewport & Layer Composite (lg:col-span-5 xl:col-span-6) */}
        <div className="lg:col-span-5 xl:col-span-6 flex flex-col h-[440px] lg:h-[calc(100vh-340px)] overflow-hidden">
          {/* Active Composite Banner */}
          <div className="flex items-center justify-between border-b border-[#262626] bg-[#0d0d0d] px-4 py-2 text-xs">
            <div className="flex items-center gap-2 truncate">
              <span className="font-bold text-white uppercase text-[12px] truncate">
                {`COMPOSITE // ${activeImage?.name ?? 'SOURCE'} [${layers.length} LAYERS]`}
              </span>
              <span className="border border-[#444] px-1 text-[9px] uppercase text-amber-400">
                MULTI-PASS
              </span>
            </div>
            <div className="text-[10px] text-neutral-500 uppercase">
              {activeImage ? `${activeImage.width}×${activeImage.height}` : ''}
            </div>
          </div>

          {/* Canvas Viewport */}
          <div className="flex-1 min-h-0">
            <ComparisonCanvas
              originalImage={activeImage?.original ?? null}
              transformedImage={transformedImage}
              durationMs={renderDuration}
              effectName={`${activeImage?.name ?? 'Composite'} (${layers.length} Layers)`}
              onApplyAsBase={handleApplyAsBase}
            />
          </div>
        </div>
      </main>

      {/* Adobe After Effects Style Multi-Layer & Multi-Image Timeline Panel */}
      <EffectLayerTimeline
        images={images}
        activeImageIndex={activeImageIndex}
        onSelectImageIndex={setActiveImageIndex}
        onUpdateImages={setImages}
        layers={layers}
        activeLayerId={activeLayerId}
        onSelectLayer={setActiveLayerId}
        onUpdateLayers={setLayers}
        currentSelectedEffect={activeEffectDef}
        isProcessing={isProcessing}
      />

      {/* Flush Technical Grid Footer */}
      <footer className="grid grid-cols-1 md:grid-cols-12 text-[10px] text-neutral-600 uppercase bg-black">
        <div className="md:col-span-4 border-b md:border-b-0 md:border-r border-[#262626] px-4 py-1.5">
          {"[LENNA] AFTER EFFECTS LAYER COMPOSITING ENGINE"}
        </div>
        <div className="md:col-span-4 border-b md:border-b-0 md:border-r border-[#262626] px-4 py-1.5 text-center">
          {"STYLE REFERENCE // SWISS INTERNATIONAL TECHNICAL GRID"}
        </div>
        <div className="md:col-span-4 px-4 py-1.5 text-right">
          {"LOCAL TIME // "}{new Date().toISOString().slice(0, 10)} UTC
        </div>
      </footer>
    </div>
  );
}
