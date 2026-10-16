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
import { ShowcaseGrid } from '@/components/ShowcaseGrid';

const ALL_EFFECT_LIST = getAllEffects();

export default function HomePage() {
  const allEffects = ALL_EFFECT_LIST;

  // View state: 'exhibition' (Showcase Grid) vs 'studio' (Compositing Workstation)
  const [currentView, setCurrentView] = useState<'exhibition' | 'studio'>('exhibition');

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

  // Initial URL check: if ?view=studio or #studio, launch directly into studio
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const searchParams = new URLSearchParams(window.location.search);
      if (searchParams.get('view') === 'studio' || window.location.hash === '#studio') {
        setCurrentView('studio');
      }
    }
  }, []);

  // Initial setup: Load 5 preset images & initial 2-layer composition stack
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

    const allIndices = initialImages.map((_, i) => i);
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
        spanIndices: allIndices,
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
        spanIndices: allIndices,
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

  // Launch Studio Workstation with optional preset image and effect selected
  const handleLaunchStudio = (sampleId?: string, effectId?: string) => {
    if (sampleId) {
      const existingIdx = images.findIndex(
        (img) => img.id.includes(sampleId) || img.name.toLowerCase().includes(sampleId.replace('-', ' '))
      );
      if (existingIdx !== -1) {
        setActiveImageIndex(existingIdx);
      } else {
        const sample = SAMPLE_IMAGES.find((s) => s.id === sampleId);
        if (sample) {
          const data = sample.generate(640, 640);
          const newItem: TimelineImageItem = {
            id: `sample-${sample.id}-${Date.now()}`,
            name: sample.name,
            original: data,
            thumbnailUrl: createThumbnailUrl(data),
            width: 640,
            height: 640,
          };
          const newIdx = images.length;
          setImages((prev) => [...prev, newItem]);
          setActiveImageIndex(newIdx);
          setLayers((prev) =>
            prev.map((l) => ({
              ...l,
              spanIndices: [...l.spanIndices, newIdx],
            }))
          );
        }
      }
    }

    if (effectId) {
      const effect = getEffectById(effectId);
      if (effect) {
        if (layers.length > 0 && activeLayerId) {
          setLayers((prev) =>
            prev.map((l) =>
              l.id === activeLayerId
                ? {
                    ...l,
                    name: effect.name,
                    effectId: effect.id,
                    parameters: getDefaultParamValues(effect),
                  }
                : l
            )
          );
        } else {
          const newLayer: EffectLayer = {
            id: `layer-${Date.now()}`,
            name: effect.name,
            effectId: effect.id,
            enabled: true,
            opacity: 100,
            blendMode: 'normal',
            parameters: getDefaultParamValues(effect),
            color: LAYER_TRACK_COLORS[0]!,
            spanIndices: images.map((_, i) => i),
          };
          setLayers([newLayer]);
          setActiveLayerId(newLayer.id);
        }
      }
    }

    setCurrentView('studio');
    if (typeof window !== 'undefined') {
      window.history.replaceState(null, '', '?view=studio');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleSwitchToExhibition = () => {
    setCurrentView('exhibition');
    if (typeof window !== 'undefined') {
      window.history.replaceState(null, '', '/');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Handle selecting an effect from the algorithm catalog
  const handleSelectEffect = (effect: EffectDefinition) => {
    if (!activeLayer) {
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
      {/* Edge-to-Edge Technical Grid Header (Swiss International Style) */}
      <header className="grid grid-cols-1 md:grid-cols-12 border-b border-[#262626] bg-black text-xs uppercase sticky top-0 z-50">
        {/* Logo Cell */}
        <div className="md:col-span-3 flex items-center justify-between border-b md:border-b-0 md:border-r border-[#262626] px-4 py-2.5">
          <div className="flex items-center gap-2">
            <span className="text-sm font-black tracking-tight text-white">[Lenna]</span>
            <span className="text-[10px] text-neutral-500">
              {currentView === 'exhibition' ? '// EDITORIAL LAB' : '// COMPOSITING LAB'}
            </span>
          </div>

          {/* Quick View Navigation Switcher */}
          <div className="flex items-center gap-1">
            <button
              onClick={handleSwitchToExhibition}
              className={`px-2 py-0.5 text-[10px] font-bold border transition ${
                currentView === 'exhibition'
                  ? 'bg-white text-black border-white'
                  : 'bg-black text-neutral-400 border-[#333] hover:border-neutral-400 hover:text-white'
              }`}
            >
              [GRID]
            </button>
            <button
              onClick={() => handleLaunchStudio()}
              className={`px-2 py-0.5 text-[10px] font-bold border transition ${
                currentView === 'studio'
                  ? 'bg-white text-black border-white'
                  : 'bg-black text-neutral-400 border-[#333] hover:border-neutral-400 hover:text-white'
              }`}
            >
              [STUDIO]
            </button>
          </div>
        </div>

        {/* System Meta & Navigation Cell */}
        <div className="md:col-span-5 flex items-center border-b md:border-b-0 md:border-r border-[#262626] px-4 py-2 text-[11px] text-neutral-400 gap-3 overflow-x-auto no-scrollbar">
          <span>ALGORITHMS: <strong className="text-white">56</strong></span>
          <span className="text-neutral-700">|</span>
          <span>PRESETS: <strong className="text-white">5 HDR</strong></span>
          <span className="text-neutral-700">|</span>
          {currentView === 'studio' ? (
            <span>STACK: <strong className="text-white">{layers.length} LAYERS</strong></span>
          ) : (
            <span>STYLE: <strong className="text-white">XV.LABIENAL.ES GRID</strong></span>
          )}
        </div>

        {/* Top Right Action Cell */}
        <div className="md:col-span-4 flex items-center justify-end bg-[#070709] px-3 py-1.5">
          {currentView === 'studio' ? (
            <PaletteManager
              currentPalette={currentPalette}
              onSelectPalette={setCurrentPalette}
              onUpdateColors={handleUpdatePaletteColors}
              isProcessing={isProcessing}
            />
          ) : (
            <button
              onClick={() => handleLaunchStudio()}
              className="border border-white bg-white px-3 py-1 text-[11px] font-bold text-black uppercase tracking-wider transition hover:bg-black hover:text-white"
            >
              LAUNCH STUDIO WORKSTATION →
            </button>
          )}
        </div>
      </header>

      {/* ========================================================================= */}
      {/* 1. EXHIBITION HOME PAGE VIEW (ASymmetric visible grids of various sizes) */}
      {/* ========================================================================= */}
      {currentView === 'exhibition' && (
        <main className="flex-1 flex flex-col">
          {/* Brutalist Editorial Marquee Header Banner */}
          <div className="grid grid-cols-1 lg:grid-cols-12 border-b border-[#262626] bg-black">
            <div className="lg:col-span-8 p-6 sm:p-8 lg:p-10 border-b lg:border-b-0 lg:border-r border-[#262626] flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <span className="bg-white text-black font-bold text-[10px] px-2 py-0.5 tracking-wider uppercase">
                    EDITORIAL MATRIX LAB
                  </span>
                  <span className="text-[10px] text-neutral-500 uppercase tracking-widest">
                    {"// SWISS TECHNICAL GRID"}
                  </span>
                </div>
                <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black uppercase tracking-tighter text-white leading-none">
                  [Lenna]
                </h1>
                <p className="mt-3 text-sm sm:text-base text-neutral-300 font-mono max-w-2xl leading-relaxed">
                  Algorithmic image transformation tool and editorial matrix lab. Transform photographs and optical targets through over 56 pure mathematical kernels, stochastic halftones, risograph inks, and After Effects compositing.
                </p>
              </div>

              <div className="mt-6 pt-4 border-t border-[#1e1e1e] flex flex-wrap items-center gap-4 text-xs text-neutral-400">
                <div>
                  <span className="text-neutral-600 block text-[9px]">ENGINE</span>
                  <strong className="text-white">PURE CLIENT CANVAS</strong>
                </div>
                <div className="h-6 w-[1px] bg-[#262626]" />
                <div>
                  <span className="text-neutral-600 block text-[9px]">PERFORMANCE</span>
                  <strong className="text-white">&lt; 4MS PER FRAME</strong>
                </div>
                <div className="h-6 w-[1px] bg-[#262626]" />
                <div>
                  <span className="text-neutral-600 block text-[9px]">DEPENDENCIES</span>
                  <strong className="text-white">ZERO WASM / ZERO SERVER</strong>
                </div>
              </div>
            </div>

            {/* Quick Action & Spec Column */}
            <div className="lg:col-span-4 p-6 sm:p-8 bg-[#08080a] flex flex-col justify-between">
              <div>
                <span className="text-[10px] text-neutral-500 uppercase tracking-wider block mb-2">
                  CURATED HDR OPTICAL PRESETS
                </span>
                <div className="flex flex-col gap-2 font-mono text-xs">
                  {SAMPLE_IMAGES.map((sample, idx) => (
                    <button
                      key={sample.id}
                      onClick={() => handleLaunchStudio(sample.id)}
                      className="group flex items-center justify-between border border-[#262626] bg-black p-2 text-left hover:border-white transition"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-neutral-600 group-hover:text-amber-400 font-bold">
                          {`[0${idx + 1}]`}
                        </span>
                        <span className="text-white truncate font-medium">{sample.name}</span>
                      </div>
                      <span className="text-[10px] text-neutral-500 group-hover:text-white">↗</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="mt-6">
                <button
                  onClick={() => handleLaunchStudio()}
                  className="w-full border border-white bg-white text-black py-3 text-xs font-black uppercase tracking-wider hover:bg-black hover:text-white transition flex items-center justify-center gap-2"
                >
                  <span>ENTER STUDIO WORKSTATION</span>
                  <span>→</span>
                </button>
              </div>
            </div>
          </div>

          {/* Asymmetric Exhibition Mosaic Gallery (Grids of Various Sizes) */}
          <ShowcaseGrid onLaunchStudio={handleLaunchStudio} />
        </main>
      )}

      {/* ========================================================================= */}
      {/* 2. COMPOSITING STUDIO WORKSTATION VIEW (After Effects Layer Stack)       */}
      {/* ========================================================================= */}
      {currentView === 'studio' && (
        <div className="flex-1 flex flex-col">
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
        </div>
      )}

      {/* Flush Technical Grid Footer (Swiss International Style) */}
      <footer className="grid grid-cols-1 md:grid-cols-12 text-[10px] text-neutral-600 uppercase bg-black border-t border-[#262626]">
        <div className="md:col-span-4 border-b md:border-b-0 md:border-r border-[#262626] px-4 py-2 flex items-center justify-between">
          <span>{"[LENNA] EDITORIAL MATRIX LAB"}</span>
          <span className="text-neutral-400">[L]</span>
        </div>
        <div className="md:col-span-4 border-b md:border-b-0 md:border-r border-[#262626] px-4 py-2 text-center">
          {"STYLE REFERENCE // SWISS INTERNATIONAL TECHNICAL GRID & XV.LABIENAL.ES"}
        </div>
        <div className="md:col-span-4 px-4 py-2 flex items-center justify-between">
          <span>{"56 ALGORITHMS ACTIVE"}</span>
          <span>{"LOCAL TIME // "}{new Date().toISOString().slice(0, 10)} UTC</span>
        </div>
      </footer>
    </div>
  );
}
