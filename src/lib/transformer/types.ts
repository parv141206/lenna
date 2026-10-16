export type EffectCategory =
  | 'halftone'
  | 'dither'
  | 'printmaking'
  | 'glitch'
  | 'generative';

export interface CategoryInfo {
  id: EffectCategory;
  name: string;
  tag: string;
  description: string;
}

export type ParamType = 'range' | 'color' | 'select' | 'boolean';

export interface SelectOption {
  label: string;
  value: string | number;
}

export interface EffectParamBase {
  id: string;
  name: string;
  description?: string;
}

export interface RangeParam extends EffectParamBase {
  type: 'range';
  min: number;
  max: number;
  step: number;
  default: number;
  unit?: string;
}

export interface ColorParam extends EffectParamBase {
  type: 'color';
  default: string; // Hex string e.g. '#ff0055'
}

export interface SelectParam extends EffectParamBase {
  type: 'select';
  options: SelectOption[];
  default: string | number;
}

export interface BooleanParam extends EffectParamBase {
  type: 'boolean';
  default: boolean;
}

export type EffectParam = RangeParam | ColorParam | SelectParam | BooleanParam;

export type EffectParamsConfig = Record<string, EffectParam>;

export type EffectParamValue = string | number | boolean;

export type EffectParamValues = Record<string, any>;

export interface EffectDefinition {
  id: string;
  name: string;
  category: EffectCategory;
  description: string;
  tags?: string[];
  parameters: EffectParamsConfig;
  apply: (source: ImageData, params: EffectParamValues) => ImageData;
}
