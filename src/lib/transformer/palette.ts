export interface ColorPalette {
  id: string;
  name: string;
  tag: string;
  colors: string[];
}

export const PRESET_PALETTES: ColorPalette[] = [
  {
    id: 'risograph',
    name: 'Risograph Spot Inks',
    tag: 'RISO',
    colors: ['#ff48b0', '#0078bf', '#ffe800', '#111111', '#f4ede4', '#3c24ab'],
  },
  {
    id: 'cyberpunk',
    name: 'Cyberpunk Neon Matrix',
    tag: 'CYBR',
    colors: ['#00ff66', '#ff0055', '#00e5ff', '#ffe600', '#0a0a0c', '#bd00ff'],
  },
  {
    id: 'swiss',
    name: 'Swiss International Contrast',
    tag: 'HELV',
    colors: ['#e60000', '#000000', '#ffffff', '#555555', '#cccccc'],
  },
  {
    id: 'bauhaus',
    name: 'Bauhaus Primary Grid',
    tag: 'BAUH',
    colors: ['#d1231b', '#1b4f9b', '#ffd100', '#1a1a1a', '#f5f3e9'],
  },
  {
    id: 'cmyk',
    name: 'CMYK Litho Press',
    tag: 'CMYK',
    colors: ['#00a4e4', '#e4007f', '#ffe600', '#231f20', '#f8f8f8'],
  },
  {
    id: 'monokai',
    name: 'Monokai Terminal Code',
    tag: 'CODE',
    colors: ['#a6e22e', '#f92672', '#66d9ef', '#fd971f', '#272822', '#e6db74'],
  },
  {
    id: 'acid',
    name: 'Acid Rave Graphics',
    tag: 'ACID',
    colors: ['#ccff00', '#ff007f', '#7928ca', '#00dfd8', '#050505'],
  },
  {
    id: 'editorial',
    name: 'Editorial Sepia Copper',
    tag: 'SEPI',
    colors: ['#2b1d0c', '#875027', '#d49b5c', '#ede0d4', '#fdf8f5'],
  },
];

export const DEFAULT_PALETTE = PRESET_PALETTES[0]!;
