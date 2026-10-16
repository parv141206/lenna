<div align="center">

```
  ██       ███████ ███    ██ ███    ██  █████  
  ██       ██      ████   ██ ████   ██ ██   ██ 
  ██       █████   ██ ██  ██ ██ ██  ██ ███████ 
  ██       ██      ██  ██ ██ ██  ██ ██ ██   ██ 
  ███████  ███████ ██   ████ ██   ████ ██   ██ 
```

# [Lenna]

### Algorithmic Image Transformer & Editorial Matrix Lab

[![Next.js 15](https://img.shields.io/badge/Next.js-15.5-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![React 19](https://img.shields.io/badge/React-19.0-black?style=flat-square&logo=react)](https://react.dev/)
[![Bun](https://img.shields.io/badge/Bun-1.3-black?style=flat-square&logo=bun)](https://bun.sh/)
[![Tailwind CSS v4](https://img.shields.io/badge/TailwindCSS-v4.0-black?style=flat-square&logo=tailwindcss)](https://tailwindcss.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-white?style=flat-square)](LICENSE)

*A zero-dependency, pure mathematical client-side image processing workstation with 56 artistic transformations, full custom duotone/monochrome palettes, and an Adobe After Effects style multi-layer composition timeline.*

[**Live Demo**](https://lenna.art) · [**Features**](#core-features) · [**Transformations**](#56-pure-algorithmic-transformations) · [**Deployment**](#deploying-to-vercel)

---

</div>

## ✦ Aesthetic & Design Philosophy

`[Lenna]` is engineered with a **Swiss International & Brutalist technical grid** inspired by early Vercel design systems and [`xv.labienal.es`](https://xv.labienal.es/):
- **Zero-Gap Hairline Grid**: Edge-to-edge flush 1px borders (`#262626`), zero margin gaps, 0px border-radius, and uppercase monospace metadata.
- **Client-Side Privacy**: 100% of spatial convolutions, matrix multiplications, and dithering calculations execute directly on your machine inside HTML5 Canvas 2D buffers. Zero images are ever uploaded to a server.
- **60+ FPS Hardware-Scheduled Realtime Engine**: Powered by `requestAnimationFrame` frame scheduling and zero-allocation inlined blend mathematics.

---

## ✦ Core Features

### 1. After Effects Multi-Layer Composition Timeline
- **Vertical Layer Stacking**: Stack multiple transformations on top of each other (e.g. `Raw Base` $\rightarrow$ `FM Stochastic Screen` $\rightarrow$ `Chromatic Dispersion` $\rightarrow$ `Pixel Sort`).
- **Photoshop / After Effects Blend Modes**: `NORMAL`, `MULTIPLY`, `SCREEN`, `OVERLAY`, `HARD LIGHT`, `DARKEN`, `LIGHTEN`, `DIFFERENCE`, and `ADD`.
- **Opacity Controls**: Real-time layer blending from `0%` to `100%`.
- **Horizontal Drag-to-Expand Layer Spans**: Drag the in/out handles (`◀` `▶`) across image columns to expand or contract layer coverage over next images.
- **Shift & Ctrl Multi-Selection**: Range-select (`Shift + Click`) and toggle-select (`Ctrl/Cmd + Click`) images and layers for batch deletion and batch span assignment.
- **Batch ZIP Export**: Render all layered compositions across your entire image queue into high-resolution PNGs bundled in a `.zip` file via `JSZip`.

### 2. Custom Color Palette Station
- **Preset Editorial Palettes**: Curated color collections including `[RISO] Risograph Spot Inks`, `[CYBR] Cyberpunk Neon`, `[HELV] Swiss Contrast`, `[BAUH] Bauhaus Primary`, `[CMYK] Litho Press`, `[CODE] Monokai`, `[ACID] Acid Rave`, and `[SEPI] Editorial Sepia`.
- **Custom Palette Creation**: Add custom colors via native color wheel or hex input `#HEX`, delete swatches, or one-click copy hex codes.
- **1-Click Parameter Quick-Pick**: Clickable swatches appear directly beneath effect color parameters for effortless aesthetic unity across batch workflows.
- **Custom Dual-Shade Modes**: Full control over both dark/ink shades and light/paper shades in screening and dither modes.

---

## ✦ 56 Pure Algorithmic Transformations

| Category | Count | Transformations |
| :--- | :---: | :--- |
| **01. Halftone & Screens** | 12 | **Newsprint Screen**, **Lichtenstein Polka Dots**, **CMYK 4-Pass Rosette**, **Hexagonal Honeycomb**, **Concentric Ripple Dots**, **Logarithmic Spiral Dots**, **Linear Line Raster**, **Diamond Rhombus Screen**, **Cross-Mesh Screen**, **Chromatic Halftone Drift**, **Negative Punch Inverted**, **FM Stochastic Screen**. |
| **02. Dither & Diffusion** | 10 | **Bayer 4×4 Ordered Matrix**, **Bayer 8×8 Fine Matrix**, **Floyd-Steinberg Error Diffusion**, **Atkinson Zine Dither**, **Jarvis-Judice-Ninke**, **Stucki High-Fidelity**, **Sierra-3**, **Burkes Fast Diffusion**, **Color Bayer Halftone**, **Blue Noise Dispersion**. |
| **03. Print & Lithography** | 10 | **Risograph 2-Color Spot Inks**, **Banknote Intaglio Crosshatch**, **Pointillist Stippling Ink**, **Woodcut Relief**, **Mezzotint Copperplate Grain**, **Cyanotype Sun Print**, **Silkscreen Stencil**, **Linocut Block**, **Lithographic Limestone**, **Thermal Receipt Printer**. |
| **04. Glitch & Deconstruct** | 12 | **Algorithmic Pixel Sort** (Luminance, Saturation, Hue), **Lateral Chromatic Dispersion**, **CRT Aperture Phosphor Grille**, **VHS Tracking Jitter**, **Digital Data Mosh**, **Slit-Scan Shutter**, **RGB 3-Axis Channel Disconnect**, **Scanline Jump Glitch**, **Triad Shadow Mask**, **Spherical Barrel Warp**, **Kaleidoscope Mirror**, **Bitplane XOR Interleave**. |
| **05. Generative & Moiré** | 12 | **ASCII Typography Matrix**, **Voronoi Stained Glass Mosaic**, **Moiré Pattern Wave Interference**, **Square Mosaic Pixelate**, **Hexagonal Prisms**, **Low-Poly Triangular Mesh**, **Turing Reaction-Diffusion**, **Truchet Tile Labyrinth**, **Polar Radar Sweep**, **Frosted Glass Scatter**, **Kuwahara Oil Painting**, **Cyber Neon Contours**. |

---

## ✦ Getting Started

### Prerequisites
- [Bun](https://bun.sh/) 1.1+ (or Node.js 18.17+)

### Installation
```bash
# Clone the repository
git clone https://github.com/your-username/lenna.git
cd lenna

# Install dependencies using Bun
bun install

# Start the Turbopack development server
bun dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Typecheck & Linter Verification
```bash
# Run ESLint and TypeScript compilation checks
bun run check
```

### Production Build
```bash
# Build static, production-optimized bundle
bun run build
```

---

## ✦ Deploying to Vercel

`[Lenna]` is optimized for **zero-configuration, instant deployment on Vercel**:

1. Push your repository to GitHub.
2. Go to [Vercel](https://vercel.com/new) and import the repository.
3. Framework Preset: **Next.js**
4. Root Directory: `./`
5. Click **Deploy**.

Vercel will automatically build the static pages, dynamic OpenGraph social cards, web manifest, sitemap, and robots.txt.

---

## ✦ Project Structure

```
lenna/
├── public/
│   ├── favicon.svg          # Brutalist [L] vector favicon
│   ├── icon.svg             # 512x512 Master square app logo [L]
│   └── favicon.ico          # Legacy ICO favicon
├── src/
│   ├── app/
│   │   ├── layout.tsx       # Root layout with SEO metadata & JSON-LD
│   │   ├── page.tsx         # Main workstation & After Effects layout
│   │   ├── icon.tsx         # Dynamic Next.js PNG icon generator
│   │   ├── apple-icon.tsx   # Dynamic Apple Touch PNG icon generator
│   │   ├── opengraph-image.tsx # Dynamic 1200x630 OG social card
│   │   ├── robots.ts        # Dynamic robots.txt
│   │   ├── sitemap.ts       # Dynamic sitemap.xml
│   │   └── manifest.ts      # Web App Manifest
│   ├── components/
│   │   ├── ComparisonCanvas.tsx     # Viewport with split slider & zoom
│   │   ├── EffectControls.tsx       # Realtime RAF parameter controls
│   │   ├── EffectLayerTimeline.tsx  # After Effects composition timeline
│   │   ├── EffectSelector.tsx       # 56 algorithm catalog & search
│   │   ├── ImageUploader.tsx        # Drag-and-drop & preset toolbar
│   │   └── PaletteManager.tsx       # Custom color palette station
│   ├── lib/
│   │   └── transformer/
│   │       ├── effects/             # 56 pure artistic effects
│   │       ├── engine.ts            # Canvas2D loader & runner
│   │       ├── layers.ts            # Multi-layer blend modes & compositor
│   │       ├── matrix.ts            # Spatial convolutions & color math
│   │       ├── palette.ts           # Curated editorial palettes
│   │       ├── registry.ts          # Effect catalog index & search
│   │       ├── samples.ts           # Procedural calibration targets
│   │       └── types.ts             # TypeScript parameter schemas
│   └── styles/
│       └── globals.css      # Brutalist hairline grid & sliders
└── package.json
```

---

## ✦ License

Open source under the [MIT License](LICENSE).
