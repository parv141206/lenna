'use client';

import React, { useState } from 'react';
import { PRESET_PALETTES, type ColorPalette } from '@/lib/transformer/palette';

interface PaletteManagerProps {
  currentPalette: ColorPalette;
  onSelectPalette: (palette: ColorPalette) => void;
  onUpdateColors: (colors: string[]) => void;
  isProcessing?: boolean;
}

export function PaletteManager({
  currentPalette,
  onSelectPalette,
  onUpdateColors,
  isProcessing = false,
}: PaletteManagerProps) {
  const [newColor, setNewColor] = useState<string>('#ffffff');
  const [showAddInput, setShowAddInput] = useState<boolean>(false);

  const handlePresetChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const found = PRESET_PALETTES.find((p) => p.id === e.target.value);
    if (found) {
      onSelectPalette(found);
    }
  };

  const handleAddColor = () => {
    if (!currentPalette.colors.includes(newColor.toLowerCase())) {
      const updated = [...currentPalette.colors, newColor.toLowerCase()];
      onUpdateColors(updated);
    }
    setShowAddInput(false);
  };

  const handleRemoveColor = (indexToRemove: number) => {
    if (currentPalette.colors.length <= 2) return; // Keep at least 2 colors
    const updated = currentPalette.colors.filter((_, idx) => idx !== indexToRemove);
    onUpdateColors(updated);
  };

  return (
    <div className="flex items-center justify-between w-full h-full px-3 py-1.5 text-[11px] font-mono select-none overflow-x-auto no-scrollbar gap-2">
      {/* Palette Selector */}
      <div className="flex items-center gap-1.5 shrink-0">
        <span className="text-[10px] text-neutral-500 uppercase">PALETTE</span>
        <select
          value={currentPalette.id}
          onChange={handlePresetChange}
          aria-label="Color Palette Presets"
          className="border border-[#333] bg-[#0c0c0e] px-1.5 py-0.5 text-[10px] text-white uppercase outline-none focus:border-white cursor-pointer hover:border-neutral-500"
        >
          {PRESET_PALETTES.map((p) => (
            <option key={p.id} value={p.id}>
              {`[${p.tag}] ${p.name.toUpperCase()}`}
            </option>
          ))}
        </select>
      </div>

      {/* Swatches Strip */}
      <div className="flex items-center gap-1 shrink-0">
        {currentPalette.colors.map((color, idx) => (
          <div
            key={`${color}-${idx}`}
            className="group relative flex items-center justify-center"
            title={`${color} (Click [x] to remove)`}
          >
            <div
              className="h-4 w-4 border border-[#444] transition-transform hover:scale-110 cursor-pointer"
              style={{ backgroundColor: color }}
              onClick={() => {
                if (typeof navigator !== 'undefined' && navigator.clipboard) {
                  void navigator.clipboard.writeText(color).catch((err) => {
                    console.debug('Clipboard write failed:', err);
                  });
                }
              }}
            />
            {currentPalette.colors.length > 2 && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleRemoveColor(idx);
                }}
                className="absolute -top-1.5 -right-1.5 hidden group-hover:flex h-3 w-3 items-center justify-center bg-black text-[8px] text-neutral-400 hover:text-white border border-[#444]"
                title="Remove color"
              >
                ×
              </button>
            )}
          </div>
        ))}

        {/* Add Color Button & Input */}
        {showAddInput ? (
          <div className="flex items-center gap-1 border border-[#333] bg-[#0c0c0e] px-1 py-0.5">
            <input
              type="color"
              value={newColor}
              onChange={(e) => setNewColor(e.target.value)}
              className="h-3.5 w-3.5 cursor-pointer border-0 bg-transparent p-0"
              title="Pick color"
              aria-label="Pick color"
            />
            <span className="text-[9px] uppercase text-neutral-400">{newColor}</span>
            <button
              type="button"
              onClick={handleAddColor}
              className="border border-[#444] px-1 py-0 text-[8px] uppercase text-white hover:bg-white hover:text-black"
            >
              ADD
            </button>
            <button
              type="button"
              onClick={() => setShowAddInput(false)}
              className="text-[9px] text-neutral-500 hover:text-white px-0.5"
            >
              ×
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setShowAddInput(true)}
            className="h-4 px-1 border border-dashed border-[#444] text-[9px] text-neutral-400 hover:border-white hover:text-white flex items-center justify-center transition-colors"
            title="Add color to palette"
          >
            +
          </button>
        )}
      </div>

      {/* Mini Activity Indicator */}
      <div className="flex items-center gap-1.5 shrink-0 pl-1 border-l border-[#262626]">
        <span
          className={`h-1.5 w-1.5 ${
            isProcessing ? 'animate-ping bg-amber-400' : 'bg-emerald-400'
          }`}
        />
        <span className="text-[9px] text-neutral-500">
          {isProcessing ? 'CALC' : 'READY'}
        </span>
      </div>
    </div>
  );
}
