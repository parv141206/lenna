import type { CategoryInfo, EffectCategory, EffectDefinition, EffectParamValues } from './types';
import { halftoneEffects } from './effects/halftone';
import { ditherEffects } from './effects/dither';
import { printmakingEffects } from './effects/printmaking';
import { glitchEffects } from './effects/glitch';
import { generativeEffects } from './effects/generative';

export const CATEGORIES: CategoryInfo[] = [
  {
    id: 'halftone',
    name: 'Halftone & Screens',
    tag: '01',
    description: 'Newsprint dots, Lichtenstein Ben-Day polka dots, CMYK 4-pass rosettes, spirals and meshes',
  },
  {
    id: 'dither',
    name: 'Dither & Diffusion',
    tag: '02',
    description: 'Bayer ordered index matrices, Floyd-Steinberg, Atkinson zine, Stucki, and blue noise',
  },
  {
    id: 'printmaking',
    name: 'Print & Lithography',
    tag: '03',
    description: 'Risograph spot inks, banknote intaglio crosshatch, stippling, woodcut relief, and cyanotype',
  },
  {
    id: 'glitch',
    name: 'Glitch & Deconstruct',
    tag: '04',
    description: 'Algorithmic pixel sort, lateral chromatic dispersion, CRT scanlines, and digital datamosh',
  },
  {
    id: 'generative',
    name: 'Generative & Moiré',
    tag: '05',
    description: 'ASCII typography matrices, Voronoi cellular diagrams, Turing reaction-diffusion, and Truchet mazes',
  },
];

/**
 * 56 Pure Algorithmic & Artistic Transformations
 */
export const ALL_EFFECTS: EffectDefinition[] = [
  ...halftoneEffects,
  ...ditherEffects,
  ...printmakingEffects,
  ...glitchEffects,
  ...generativeEffects,
];

const EFFECTS_MAP = new Map<string, EffectDefinition>(
  ALL_EFFECTS.map((effect) => [effect.id, effect])
);

export function getAllEffects(): EffectDefinition[] {
  return ALL_EFFECTS;
}

export function getEffectById(id: string): EffectDefinition | undefined {
  return EFFECTS_MAP.get(id);
}

export function getEffectsByCategory(category: EffectCategory | 'all'): EffectDefinition[] {
  if (category === 'all') return ALL_EFFECTS;
  return ALL_EFFECTS.filter((e) => e.category === category);
}

export function searchEffects(query: string, category: EffectCategory | 'all' = 'all'): EffectDefinition[] {
  const q = query.trim().toLowerCase();
  const list = getEffectsByCategory(category);
  if (!q) return list;

  return list.filter((e) => {
    return (
      e.name.toLowerCase().includes(q) ||
      e.description.toLowerCase().includes(q) ||
      e.tags?.some((t) => t.toLowerCase().includes(q))
    );
  });
}

/**
 * Returns the default parameter values object for an effect.
 */
export function getDefaultParamValues(effect: EffectDefinition): EffectParamValues {
  const values: EffectParamValues = {};
  for (const [key, param] of Object.entries(effect.parameters)) {
    values[key] = param.default;
  }
  return values;
}
