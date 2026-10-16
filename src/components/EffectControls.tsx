'use client';

import React, { useState, useEffect, useRef } from 'react';
import type { EffectDefinition, EffectParamValues, RangeParam, ColorParam } from '../lib/transformer/types';

interface RangeFieldProps {
  paramKey: string;
  param: RangeParam;
  value: number;
  onChange: (paramId: string, val: number) => void;
}

function RangeFieldItem({ paramKey, param, value, onChange }: RangeFieldProps) {
  const [localVal, setLocalVal] = useState<number>(value);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    setLocalVal(value);
  }, [value]);

  const handleSliderInput = (newVal: number) => {
    setLocalVal(newVal);
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
    }
    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = null;
      onChange(paramKey, newVal);
    });
  };

  useEffect(() => {
    return () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, []);

  return (
    <div className="p-3 space-y-1.5 border-b border-[#1e1e1e]">
      <div className="flex items-center justify-between text-[11px]">
        <span className="text-neutral-300 uppercase">{param.name}</span>
        <span className="text-white font-bold font-mono">
          {localVal} {param.unit ?? ''}
        </span>
      </div>
      <input
        type="range"
        min={param.min}
        max={param.max}
        step={param.step}
        value={localVal}
        onInput={(e) => handleSliderInput(parseFloat((e.target as HTMLInputElement).value))}
        onChange={(e) => onChange(paramKey, parseFloat(e.target.value))}
        className="w-full cursor-pointer"
        aria-label={param.name}
      />
      {param.description && (
        <p className="text-[9px] text-neutral-500 uppercase">{param.description}</p>
      )}
    </div>
  );
}

interface ColorFieldProps {
  paramKey: string;
  param: ColorParam;
  value: string;
  onChange: (paramId: string, val: string) => void;
  palette?: string[];
  onAddToPalette?: (color: string) => void;
}

function ColorFieldItem({
  paramKey,
  param,
  value,
  onChange,
  palette,
  onAddToPalette,
}: ColorFieldProps) {
  const [localColor, setLocalColor] = useState<string>(value);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    setLocalColor(value);
  }, [value]);

  const handleColorInput = (newVal: string) => {
    setLocalColor(newVal);
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
    }
    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = null;
      onChange(paramKey, newVal);
    });
  };

  const handleImmediateColor = (newVal: string) => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    setLocalColor(newVal);
    onChange(paramKey, newVal);
  };

  useEffect(() => {
    return () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, []);

  const safeHex = localColor.startsWith('#') && localColor.length === 7 ? localColor : '#000000';

  return (
    <div className="p-3 space-y-2 text-[11px] border-b border-[#1e1e1e]">
      <div className="flex items-center justify-between">
        <span className="text-neutral-300 uppercase">{param.name}</span>
        <div className="flex items-center gap-1.5">
          {/* Quick Editable Hex input */}
          <input
            type="text"
            value={localColor.toUpperCase()}
            onChange={(e) => {
              const val = e.target.value;
              setLocalColor(val);
              if (/^#[0-9A-Fa-f]{6}$/.test(val)) {
                handleImmediateColor(val);
              }
            }}
            className="w-16 font-mono text-[10px] bg-[#0c0c0e] border border-[#333] px-1 py-0.5 text-center text-neutral-300 focus:border-white outline-none"
            maxLength={7}
            aria-label={`${param.name} hex code`}
          />
          {/* High-speed Realtime Native Color Picker */}
          <input
            type="color"
            value={safeHex}
            onInput={(e) => handleColorInput((e.target as HTMLInputElement).value)}
            onChange={(e) => handleImmediateColor(e.target.value)}
            className="h-5 w-6 cursor-pointer border border-[#444] bg-transparent p-0"
            aria-label={param.name}
          />
        </div>
      </div>

      {/* Active Palette Quick-Pick Swatches */}
      {palette && palette.length > 0 && (
        <div className="flex items-center gap-1 pt-0.5 flex-wrap">
          <span className="text-[8px] text-neutral-500 uppercase mr-1">PALETTE:</span>
          {palette.map((color, pIdx) => {
            const isActive = localColor.toLowerCase() === color.toLowerCase();
            return (
              <button
                key={`${color}-${pIdx}`}
                type="button"
                onClick={() => handleImmediateColor(color)}
                title={`Apply palette swatch: ${color}`}
                className={`h-3.5 w-3.5 border transition-transform hover:scale-110 cursor-pointer ${
                  isActive ? 'border-white scale-110 ring-1 ring-white' : 'border-[#444]'
                }`}
                style={{ backgroundColor: color }}
              />
            );
          })}
          {onAddToPalette && !palette.includes(localColor.toLowerCase()) && (
            <button
              type="button"
              onClick={() => onAddToPalette(localColor)}
              title="Add current color to active palette"
              className="border border-[#333] px-1 py-0 text-[8px] uppercase text-neutral-400 hover:border-white hover:text-white"
            >
              +PIN
            </button>
          )}
        </div>
      )}
    </div>
  );
}

interface EffectControlsProps {
  effect: EffectDefinition;
  values: EffectParamValues;
  onChange: (paramId: string, value: any) => void;
  onReset: () => void;
  onRandomize: () => void;
  palette?: string[];
  onAddToPalette?: (color: string) => void;
}

export const EffectControls: React.FC<EffectControlsProps> = ({
  effect,
  values,
  onChange,
  onReset,
  onRandomize,
  palette,
  onAddToPalette,
}) => {
  const paramEntries = Object.entries(effect.parameters);

  return (
    <div className="flex h-full flex-col font-mono text-xs bg-black">
      {/* Parameter Header Bar */}
      <div className="flex items-center justify-between border-b border-[#262626] px-3 py-2 bg-[#0a0a0a]">
        <span className="font-bold tracking-tight text-white uppercase">
          {"// PARAMS ("}{paramEntries.length}{")"}
        </span>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={onRandomize}
            className="border border-[#333] px-2 py-0.5 text-[10px] uppercase text-neutral-300 hover:border-white hover:text-white transition-colors"
          >
            RANDOM
          </button>
          <button
            type="button"
            onClick={onReset}
            className="border border-[#333] px-2 py-0.5 text-[10px] uppercase text-neutral-300 hover:border-white hover:text-white transition-colors"
          >
            RESET
          </button>
        </div>
      </div>

      {/* Parameter Rows */}
      <div className="flex-1 overflow-y-auto divide-y divide-[#1e1e1e]">
        {paramEntries.length === 0 ? (
          <div className="p-4 text-center text-[10px] text-neutral-600 uppercase">
            Constant kernel. No parameters.
          </div>
        ) : (
          paramEntries.map(([key, param]) => {
            const val = values[key] ?? param.default;

            switch (param.type) {
              case 'range': {
                const numVal = typeof val === 'number' ? val : Number(val);
                return (
                  <RangeFieldItem
                    key={key}
                    paramKey={key}
                    param={param}
                    value={numVal}
                    onChange={onChange}
                  />
                );
              }

              case 'color': {
                return (
                  <ColorFieldItem
                    key={key}
                    paramKey={key}
                    param={param}
                    value={String(val)}
                    onChange={onChange}
                    palette={palette}
                    onAddToPalette={onAddToPalette}
                  />
                );
              }

              case 'select': {
                const sp = param;
                const selVal = typeof val === 'boolean' ? String(val) : val;
                return (
                  <div key={key} className="p-3 space-y-1 text-[11px] border-b border-[#1e1e1e]">
                    <span className="text-neutral-300 uppercase">{sp.name}</span>
                    <select
                      value={selVal}
                      onChange={(e) => onChange(key, e.target.value)}
                      aria-label={sp.name}
                      className="w-full border border-[#333] bg-[#0d0d0d] px-2 py-1 text-[11px] text-white uppercase outline-none focus:border-white cursor-pointer"
                    >
                      {sp.options.map((opt) => (
                        <option key={String(opt.value)} value={opt.value}>
                          {opt.label.toUpperCase()}
                        </option>
                      ))}
                    </select>
                  </div>
                );
              }

              case 'boolean': {
                const bp = param;
                const boolVal = Boolean(val);
                return (
                  <div key={key} className="flex items-center justify-between p-3 text-[11px] border-b border-[#1e1e1e]">
                    <span className="text-neutral-300 uppercase">{bp.name}</span>
                    <button
                      type="button"
                      onClick={() => onChange(key, !boolVal)}
                      className={`border px-2.5 py-0.5 text-[10px] uppercase font-bold transition-colors ${
                        boolVal ? 'border-white bg-white text-black' : 'border-[#333] bg-black text-neutral-500'
                      }`}
                    >
                      {boolVal ? 'TRUE' : 'FALSE'}
                    </button>
                  </div>
                );
              }

              default:
                return null;
            }
          })
        )}
      </div>
    </div>
  );
};
