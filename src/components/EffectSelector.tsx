'use client';

import React, { useState, useMemo } from 'react';
import type { EffectCategory, EffectDefinition } from '../lib/transformer/types';
import { CATEGORIES, getAllEffects } from '../lib/transformer/registry';

interface EffectSelectorProps {
  selectedEffectId: string;
  onSelectEffect: (effect: EffectDefinition) => void;
}

export const EffectSelector: React.FC<EffectSelectorProps> = ({
  selectedEffectId,
  onSelectEffect,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<EffectCategory | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const allEffects = useMemo(() => getAllEffects(), []);

  const filteredEffects = useMemo(() => {
    let list = allEffects;
    if (selectedCategory !== 'all') {
      list = list.filter((e) => e.category === selectedCategory);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (e) =>
          e.name.toLowerCase().includes(q) ||
          e.description.toLowerCase().includes(q) ||
          e.tags?.some((t) => t.toLowerCase().includes(q))
      );
    }
    return list;
  }, [allEffects, selectedCategory, searchQuery]);

  return (
    <div className="flex h-full flex-col font-mono text-xs bg-black select-none">
      {/* Catalog Title Header */}
      <div className="flex items-center justify-between border-b border-[#262626] px-3 py-2 bg-[#0a0a0a]">
        <span className="font-bold tracking-tight text-white uppercase">{"// ALGORITHMS"}</span>
        <span className="text-[11px] text-neutral-400">
          [{filteredEffects.length}/{allEffects.length}]
        </span>
      </div>

      {/* Monospaced Search Input */}
      <div className="border-b border-[#262626] p-0">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="SEARCH MATRIX ALGORITHMS..."
          className="w-full bg-black px-3 py-2 text-[11px] text-white placeholder-neutral-600 outline-none uppercase"
        />
      </div>

      {/* Category Grid Tabs */}
      <div className="grid grid-cols-2 border-b border-[#262626] text-[10px] uppercase">
        <button
          onClick={() => setSelectedCategory('all')}
          className={`border-b border-r border-[#262626] px-2 py-1.5 text-left transition-colors ${
            selectedCategory === 'all'
              ? 'bg-white text-black font-bold'
              : 'text-neutral-400 hover:bg-[#111] hover:text-white'
          }`}
        >
          [00] ALL EFFECTS ({allEffects.length})
        </button>
        {CATEGORIES.map((cat, idx) => {
          const count = allEffects.filter((e) => e.category === cat.id).length;
          const isActive = selectedCategory === cat.id;
          const isRight = idx % 2 === 0;
          return (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`border-b border-[#262626] ${
                isRight ? 'border-r' : ''
              } px-2 py-1.5 text-left truncate transition-colors ${
                isActive
                  ? 'bg-white text-black font-bold'
                  : 'text-neutral-400 hover:bg-[#111] hover:text-white'
              }`}
            >
              [{cat.tag}] {cat.name} ({count})
            </button>
          );
        })}
      </div>

      {/* Effects Table / List */}
      <div className="flex-1 overflow-y-auto divide-y divide-[#1e1e1e]">
        {filteredEffects.length === 0 ? (
          <div className="px-4 py-8 text-center text-[11px] text-neutral-500 uppercase">
            No transformations found
          </div>
        ) : (
          filteredEffects.map((effect, index) => {
            const isSelected = effect.id === selectedEffectId;
            const indexStr = (index + 1).toString().padStart(2, '0');
            return (
              <div
                key={effect.id}
                onClick={() => onSelectEffect(effect)}
                className={`cursor-pointer px-3 py-2 transition-colors ${
                  isSelected
                    ? 'bg-white text-black font-bold'
                    : 'text-neutral-300 hover:bg-[#111] hover:text-white'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 truncate">
                    <span className={isSelected ? 'text-black' : 'text-neutral-600'}>
                      {indexStr}
                    </span>
                    <span className="truncate uppercase text-[11px]">
                      {effect.name}
                    </span>
                  </div>
                  <span
                    className={`text-[9px] uppercase px-1 py-0.2 shrink-0 ${
                      isSelected
                        ? 'border border-black text-black'
                        : 'border border-[#333] text-neutral-500'
                    }`}
                  >
                    {effect.category.slice(0, 5)}
                  </span>
                </div>
                <p
                  className={`mt-1 line-clamp-1 text-[10px] leading-tight ${
                    isSelected ? 'text-neutral-800' : 'text-neutral-500'
                  }`}
                >
                  {effect.description}
                </p>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
