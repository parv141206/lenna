/**
 * Built-in Editorial Sample Image Generators for Lenna
 * Generates high-dynamic-range classical sculptures, brutalist architecture,
 * botanical macro flora, cyberpunk nightscapes, and optical calibration targets.
 */

export interface SampleImage {
  id: string;
  name: string;
  category?: string;
  description: string;
  generate: (width?: number, height?: number) => ImageData;
}

export const SAMPLE_IMAGES: SampleImage[] = [
  // 1. Classical Sculpture (Chiaroscuro Marble Bust)
  {
    id: 'classical-sculpture',
    name: 'Classical Chiaroscuro Bust',
    category: 'editorial',
    description: 'High dynamic range Roman marble sculpture with directional studio key light, deep shadows, and draped folds',
    generate: (w = 640, h = 640) => {
      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d')!;

      // Background: Deep architectural dark stone with subtle top-left spotlight
      const bgGrad = ctx.createRadialGradient(w * 0.35, h * 0.25, 20, w * 0.5, h * 0.5, w * 0.7);
      bgGrad.addColorStop(0, '#26262a');
      bgGrad.addColorStop(0.5, '#131316');
      bgGrad.addColorStop(1, '#08080a');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, w, h);

      // Fine stone background texture
      const bgImg = ctx.getImageData(0, 0, w, h);
      const bgData = bgImg.data;
      for (let i = 0; i < bgData.length; i += 4) {
        const noise = (Math.random() - 0.5) * 8;
        bgData[i] = Math.max(0, Math.min(255, bgData[i]! + noise));
        bgData[i + 1] = Math.max(0, Math.min(255, bgData[i + 1]! + noise));
        bgData[i + 2] = Math.max(0, Math.min(255, bgData[i + 2]! + noise));
      }
      ctx.putImageData(bgImg, 0, 0);

      // Rim light glow behind head
      const rimLight = ctx.createRadialGradient(w * 0.45, h * 0.32, w * 0.15, w * 0.45, h * 0.32, w * 0.38);
      rimLight.addColorStop(0, 'rgba(210, 215, 225, 0.15)');
      rimLight.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = rimLight;
      ctx.fillRect(0, 0, w, h);

      // Pedestal Base
      const pedGrad = ctx.createLinearGradient(w * 0.25, 0, w * 0.75, 0);
      pedGrad.addColorStop(0, '#1c1c20');
      pedGrad.addColorStop(0.3, '#585862');
      pedGrad.addColorStop(0.7, '#8e8e9c');
      pedGrad.addColorStop(1, '#1e1e22');
      ctx.fillStyle = pedGrad;

      // Base plinth
      ctx.beginPath();
      ctx.moveTo(w * 0.3, h * 0.88);
      ctx.lineTo(w * 0.7, h * 0.88);
      ctx.lineTo(w * 0.75, h * 0.98);
      ctx.lineTo(w * 0.25, h * 0.98);
      ctx.closePath();
      ctx.fill();

      // Draped Toga / Shoulders & Torso
      ctx.save();
      const torsoGrad = ctx.createLinearGradient(w * 0.15, h * 0.55, w * 0.85, h * 0.85);
      torsoGrad.addColorStop(0, '#505058');
      torsoGrad.addColorStop(0.35, '#c8c8d2');
      torsoGrad.addColorStop(0.65, '#787884');
      torsoGrad.addColorStop(1, '#18181c');
      ctx.fillStyle = torsoGrad;

      // Body silhouette
      ctx.beginPath();
      ctx.moveTo(w * 0.2, h * 0.88);
      ctx.bezierCurveTo(w * 0.18, h * 0.72, w * 0.28, h * 0.62, w * 0.38, h * 0.6);
      ctx.lineTo(w * 0.62, h * 0.6);
      ctx.bezierCurveTo(w * 0.72, h * 0.62, w * 0.82, h * 0.72, w * 0.8, h * 0.88);
      ctx.closePath();
      ctx.fill();

      // Draping folds across chest (classical carved marble folds)
      const folds = [
        { sx: 0.38, sy: 0.6, ex: 0.72, ey: 0.82, cx1: 0.45, cy1: 0.72, cx2: 0.58, cy2: 0.8 },
        { sx: 0.34, sy: 0.64, ex: 0.65, ey: 0.86, cx1: 0.4, cy1: 0.76, cx2: 0.52, cy2: 0.84 },
        { sx: 0.3, sy: 0.68, ex: 0.55, ey: 0.88, cx1: 0.36, cy1: 0.8, cx2: 0.44, cy2: 0.87 },
        { sx: 0.42, sy: 0.62, ex: 0.78, ey: 0.78, cx1: 0.52, cy1: 0.7, cx2: 0.68, cy2: 0.76 },
      ];

      for (const f of folds) {
        ctx.beginPath();
        ctx.moveTo(w * f.sx, h * f.sy);
        ctx.bezierCurveTo(w * f.cx1, h * f.cy1, w * f.cx2, h * f.cy2, w * f.ex, h * f.ey);
        ctx.strokeStyle = '#1a1a20';
        ctx.lineWidth = 9;
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(w * f.sx, h * f.sy - 2);
        ctx.bezierCurveTo(w * f.cx1, h * f.cy1 - 2, w * f.cx2, h * f.cy2 - 2, w * f.ex, h * f.ey - 2);
        ctx.strokeStyle = '#e2e2ec';
        ctx.lineWidth = 4;
        ctx.stroke();
      }

      // Neck with muscular tone & shadows
      const neckGrad = ctx.createLinearGradient(w * 0.4, 0, w * 0.62, 0);
      neckGrad.addColorStop(0, '#2b2b32');
      neckGrad.addColorStop(0.3, '#b4b4c0');
      neckGrad.addColorStop(0.65, '#e4e4ee');
      neckGrad.addColorStop(0.85, '#686874');
      neckGrad.addColorStop(1, '#202026');
      ctx.fillStyle = neckGrad;
      ctx.beginPath();
      ctx.moveTo(w * 0.44, h * 0.46);
      ctx.lineTo(w * 0.43, h * 0.63);
      ctx.lineTo(w * 0.57, h * 0.63);
      ctx.lineTo(w * 0.56, h * 0.46);
      ctx.closePath();
      ctx.fill();

      // Sternocleidomastoid shadow line
      ctx.strokeStyle = 'rgba(30, 30, 36, 0.7)';
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.moveTo(w * 0.46, h * 0.48);
      ctx.lineTo(w * 0.51, h * 0.62);
      ctx.stroke();

      // Head & Facial Structure
      // Outer head shadow
      ctx.fillStyle = '#1e1e24';
      ctx.beginPath();
      ctx.ellipse(w * 0.5, h * 0.38, w * 0.16, w * 0.21, 0, 0, Math.PI * 2);
      ctx.fill();

      // Lit facial plane
      const faceGrad = ctx.createRadialGradient(
        w * 0.46,
        h * 0.33,
        15,
        w * 0.48,
        h * 0.37,
        w * 0.19
      );
      faceGrad.addColorStop(0, '#ffffff'); // Key light highlight on cheek & brow
      faceGrad.addColorStop(0.4, '#e0e0ea');
      faceGrad.addColorStop(0.7, '#8c8c98');
      faceGrad.addColorStop(0.9, '#3c3c44');
      faceGrad.addColorStop(1, '#18181e');
      ctx.fillStyle = faceGrad;
      ctx.beginPath();
      ctx.ellipse(w * 0.5, h * 0.38, w * 0.145, w * 0.2, 0, 0, Math.PI * 2);
      ctx.fill();

      // Classical sculpted hair curls
      const curls = [
        { x: 0.5, y: 0.18, r: 0.08 },
        { x: 0.42, y: 0.2, r: 0.07 },
        { x: 0.58, y: 0.2, r: 0.07 },
        { x: 0.36, y: 0.25, r: 0.065 },
        { x: 0.64, y: 0.25, r: 0.065 },
        { x: 0.33, y: 0.32, r: 0.06 },
        { x: 0.67, y: 0.32, r: 0.06 },
        { x: 0.35, y: 0.4, r: 0.05 },
        { x: 0.65, y: 0.4, r: 0.05 },
        { x: 0.46, y: 0.23, r: 0.05 },
        { x: 0.54, y: 0.23, r: 0.05 },
      ];

      for (const c of curls) {
        const curlGrad = ctx.createRadialGradient(
          w * (c.x - 0.02),
          h * (c.y - 0.02),
          2,
          w * c.x,
          h * c.y,
          w * c.r
        );
        curlGrad.addColorStop(0, '#ffffff');
        curlGrad.addColorStop(0.4, '#b8b8c4');
        curlGrad.addColorStop(0.8, '#3c3c46');
        curlGrad.addColorStop(1, '#121216');
        ctx.fillStyle = curlGrad;
        ctx.beginPath();
        ctx.arc(w * c.x, h * c.y, w * c.r, 0, Math.PI * 2);
        ctx.fill();

        // Curl spiral grove
        ctx.strokeStyle = '#18181e';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.arc(w * c.x, h * c.y, w * c.r * 0.55, 0.4, Math.PI * 1.6);
        ctx.stroke();
      }

      // Sculpted Eyebrow ridges
      ctx.strokeStyle = '#32323a';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(w * 0.41, h * 0.34);
      ctx.quadraticCurveTo(w * 0.45, h * 0.33, w * 0.485, h * 0.345);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(w * 0.515, h * 0.345);
      ctx.quadraticCurveTo(w * 0.55, h * 0.33, w * 0.59, h * 0.34);
      ctx.stroke();

      // Deep carved classical eyes (Greek/Roman blank marble irises)
      // Left eye
      ctx.fillStyle = '#222228';
      ctx.beginPath();
      ctx.ellipse(w * 0.45, h * 0.37, 10, 5.5, -0.05, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#dedee6';
      ctx.beginPath();
      ctx.ellipse(w * 0.45, h * 0.37, 8, 4, -0.05, 0, Math.PI * 2);
      ctx.fill();

      // Right eye (in shadow plane)
      ctx.fillStyle = '#141418';
      ctx.beginPath();
      ctx.ellipse(w * 0.55, h * 0.37, 9.5, 5, 0.05, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#8e8e98';
      ctx.beginPath();
      ctx.ellipse(w * 0.55, h * 0.37, 7, 3.5, 0.05, 0, Math.PI * 2);
      ctx.fill();

      // Sculpted Roman Nose with sharp bridge and cast shadow
      const noseGrad = ctx.createLinearGradient(w * 0.48, 0, w * 0.53, 0);
      noseGrad.addColorStop(0, '#ffffff');
      noseGrad.addColorStop(0.6, '#b4b4c2');
      noseGrad.addColorStop(1, '#202026');
      ctx.fillStyle = noseGrad;
      ctx.beginPath();
      ctx.moveTo(w * 0.495, h * 0.34);
      ctx.lineTo(w * 0.485, h * 0.44);
      ctx.lineTo(w * 0.525, h * 0.44);
      ctx.lineTo(w * 0.51, h * 0.34);
      ctx.closePath();
      ctx.fill();

      // Nose cast shadow on right cheek
      ctx.fillStyle = 'rgba(20, 20, 26, 0.75)';
      ctx.beginPath();
      ctx.moveTo(w * 0.505, h * 0.37);
      ctx.lineTo(w * 0.54, h * 0.45);
      ctx.lineTo(w * 0.505, h * 0.45);
      ctx.closePath();
      ctx.fill();

      // Lips (subtle classical arch with philtrum)
      ctx.fillStyle = '#3a3a44';
      ctx.beginPath();
      ctx.ellipse(w * 0.5, h * 0.485, 14, 5, 0, 0, Math.PI * 2);
      ctx.fill();
      // Upper lip highlight
      ctx.fillStyle = '#dedee8';
      ctx.beginPath();
      ctx.ellipse(w * 0.49, h * 0.478, 9, 2.5, 0, 0, Math.PI * 2);
      ctx.fill();
      // Mouth separator shadow
      ctx.strokeStyle = '#101014';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(w * 0.46, h * 0.485);
      ctx.lineTo(w * 0.54, h * 0.485);
      ctx.stroke();

      // Chin cleft & highlight
      const chinGrad = ctx.createRadialGradient(w * 0.49, h * 0.52, 2, w * 0.5, h * 0.53, 16);
      chinGrad.addColorStop(0, '#ffffff');
      chinGrad.addColorStop(0.5, '#90909c');
      chinGrad.addColorStop(1, '#26262e');
      ctx.fillStyle = chinGrad;
      ctx.beginPath();
      ctx.arc(w * 0.5, h * 0.53, 14, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();

      // Editorial Monospace Plate Label
      ctx.font = '700 13px monospace';
      ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
      ctx.fillText('[01 // MARBLE CHIAROSCURO BUST]', 24, 36);
      ctx.font = '400 10px monospace';
      ctx.fillStyle = 'rgba(255, 255, 255, 0.25)';
      ctx.fillText('HIGH-DYNAMIC-RANGE SPECULAR SURFACE', 24, 52);

      return ctx.getImageData(0, 0, w, h);
    },
  },

  // 2. Brutalist Monolith (Architectural Perspective)
  {
    id: 'brutalist-monolith',
    name: 'Brutalist Concrete Monolith',
    category: 'editorial',
    description: 'Monumental poured-concrete angular architecture with dramatic sky gradient, mullion grid, and perspective shadows',
    generate: (w = 640, h = 640) => {
      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d')!;

      // Dramatic sky: High-contrast atmospheric transition
      const skyGrad = ctx.createLinearGradient(0, 0, 0, h);
      skyGrad.addColorStop(0, '#0a0d14');
      skyGrad.addColorStop(0.4, '#1b2333');
      skyGrad.addColorStop(0.7, '#435570');
      skyGrad.addColorStop(1, '#8ea1b8');
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, w, h);

      // Low sun glare behind building
      const sun = ctx.createRadialGradient(w * 0.75, h * 0.4, 20, w * 0.75, h * 0.4, w * 0.55);
      sun.addColorStop(0, 'rgba(255, 245, 230, 0.5)');
      sun.addColorStop(0.5, 'rgba(240, 200, 160, 0.15)');
      sun.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = sun;
      ctx.fillRect(0, 0, w, h);

      // Distant secondary brutalist tower
      ctx.fillStyle = '#222938';
      ctx.beginPath();
      ctx.moveTo(w * 0.65, h * 0.8);
      ctx.lineTo(w * 0.78, h * 0.35);
      ctx.lineTo(w * 0.95, h * 0.42);
      ctx.lineTo(w * 0.95, h * 0.85);
      ctx.closePath();
      ctx.fill();

      // Main Monumental Tower Facet 1 (Lit Concrete Facade)
      const litFacade = ctx.createLinearGradient(w * 0.15, h * 0.2, w * 0.55, h * 0.95);
      litFacade.addColorStop(0, '#f0f0ea');
      litFacade.addColorStop(0.4, '#c8c8c0');
      litFacade.addColorStop(1, '#7c7c78');
      ctx.fillStyle = litFacade;

      ctx.beginPath();
      ctx.moveTo(w * 0.1, h * 0.98); // bottom left
      ctx.lineTo(w * 0.32, h * 0.08); // apex
      ctx.lineTo(w * 0.62, h * 0.18); // center crease top
      ctx.lineTo(w * 0.52, h * 0.98); // center crease bottom
      ctx.closePath();
      ctx.fill();

      // Main Monumental Tower Facet 2 (Shadowed Diagonal Cantilever Facade)
      const shadowFacade = ctx.createLinearGradient(w * 0.52, h * 0.18, w * 0.9, h * 0.95);
      shadowFacade.addColorStop(0, '#3a3a40');
      shadowFacade.addColorStop(0.5, '#1e1e24');
      shadowFacade.addColorStop(1, '#0e0e12');
      ctx.fillStyle = shadowFacade;

      ctx.beginPath();
      ctx.moveTo(w * 0.62, h * 0.18);
      ctx.lineTo(w * 0.92, h * 0.38);
      ctx.lineTo(w * 0.78, h * 0.98);
      ctx.lineTo(w * 0.52, h * 0.98);
      ctx.closePath();
      ctx.fill();

      // Horizontal Floor Slabs & Mullion Louvers on Lit Facade
      const floors = 18;
      for (let i = 1; i < floors; i++) {
        const t = i / floors;
        const ly1 = h * 0.98 - t * (h * 0.98 - h * 0.1);
        const ly2 = h * 0.98 - t * (h * 0.98 - h * 0.18);
        const lx1 = w * 0.1 + t * (w * 0.32 - w * 0.1);
        const lx2 = w * 0.52 + t * (w * 0.62 - w * 0.52);

        // Deep recessed window band
        ctx.fillStyle = '#181c22';
        ctx.beginPath();
        ctx.moveTo(lx1, ly1);
        ctx.lineTo(lx2, ly2);
        ctx.lineTo(lx2, ly2 + 8 * (1 - t * 0.5));
        ctx.lineTo(lx1, ly1 + 8 * (1 - t * 0.5));
        ctx.closePath();
        ctx.fill();

        // Concrete mullion fins
        const fins = 8;
        for (let j = 0; j < fins; j++) {
          const ft = j / fins;
          const fx = lx1 + ft * (lx2 - lx1);
          const fy = ly1 + ft * (ly2 - ly1);
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.moveTo(fx, fy);
          ctx.lineTo(fx, fy + 7);
          ctx.stroke();
        }
      }

      // Concrete Expansion Joint Grids on Shadow Facade
      for (let i = 1; i < 12; i++) {
        const t = i / 12;
        const sy1 = h * 0.18 + t * (h * 0.98 - h * 0.18);
        const sy2 = h * 0.38 + t * (h * 0.98 - h * 0.38);
        const sx1 = w * 0.62 + t * (w * 0.52 - w * 0.62);
        const sx2 = w * 0.92 + t * (w * 0.78 - w * 0.92);

        ctx.strokeStyle = '#121216';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(sx1, sy1);
        ctx.lineTo(sx2, sy2);
        ctx.stroke();

        ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(sx1, sy1 + 1);
        ctx.lineTo(sx2, sy2 + 1);
        ctx.stroke();
      }

      // Brutalist Foreground Cantilever Beam
      ctx.fillStyle = '#111216';
      ctx.beginPath();
      ctx.moveTo(0, h * 0.78);
      ctx.lineTo(w * 0.42, h * 0.85);
      ctx.lineTo(w * 0.38, h * 0.98);
      ctx.lineTo(0, h * 0.98);
      ctx.closePath();
      ctx.fill();

      // Sharp diagonal rim highlight on center building edge
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(w * 0.62, h * 0.18);
      ctx.lineTo(w * 0.52, h * 0.98);
      ctx.stroke();

      // Monospace technical typography overlay
      ctx.font = '700 13px monospace';
      ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
      ctx.fillText('[02 // MONOLITHIC BRUTALISM]', 24, 36);
      ctx.font = '400 10px monospace';
      ctx.fillStyle = 'rgba(255, 255, 255, 0.25)';
      ctx.fillText('HIGH-CONTRAST CONCRETE TEXTURE & SKY RAMP', 24, 52);

      return ctx.getImageData(0, 0, w, h);
    },
  },

  // 3. Botanical Macro Flora (Japanese Camellia / Peony)
  {
    id: 'botanical-bloom',
    name: 'Botanical Flora Macro',
    category: 'editorial',
    description: 'Macro floral photograph with layered petals, velvety gradients from ruby to blush, and stamen cluster',
    generate: (w = 640, h = 640) => {
      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d')!;

      // Background: Deep dark forest green with ambient vignette
      const bgGrad = ctx.createRadialGradient(w * 0.5, h * 0.5, 50, w * 0.5, h * 0.5, w * 0.65);
      bgGrad.addColorStop(0, '#0d1a14');
      bgGrad.addColorStop(0.6, '#08100c');
      bgGrad.addColorStop(1, '#030504');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, w, h);

      // Deep emerald foliage leaves in background
      const leaves = [
        { cx: 0.18, cy: 0.22, r: 0.24, rot: 0.6, col: '#1b382b' },
        { cx: 0.82, cy: 0.2, r: 0.26, rot: -0.5, col: '#142c22' },
        { cx: 0.15, cy: 0.78, r: 0.28, rot: -0.7, col: '#1f4233' },
        { cx: 0.85, cy: 0.75, r: 0.25, rot: 0.8, col: '#163126' },
      ];

      for (const l of leaves) {
        ctx.save();
        ctx.translate(w * l.cx, h * l.cy);
        ctx.rotate(l.rot);
        ctx.fillStyle = l.col;
        ctx.beginPath();
        ctx.ellipse(0, 0, w * l.r, h * (l.r * 0.45), 0, 0, Math.PI * 2);
        ctx.fill();

        // Leaf main vein
        ctx.strokeStyle = '#2b5a45';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(-w * l.r * 0.9, 0);
        ctx.lineTo(w * l.r * 0.9, 0);
        ctx.stroke();
        ctx.restore();
      }

      // Flower Center & Petals
      const cx = w * 0.5;
      const cy = h * 0.52;

      // Outer Petal Layer (Deep Carmine & Magenta)
      const outerPetals = 12;
      for (let i = 0; i < outerPetals; i++) {
        const angle = (i * 2 * Math.PI) / outerPetals;
        const px = cx + Math.cos(angle) * (w * 0.22);
        const py = cy + Math.sin(angle) * (h * 0.22);

        const petalGrad = ctx.createRadialGradient(px, py, 10, px, py, w * 0.22);
        petalGrad.addColorStop(0, '#f43f5e');
        petalGrad.addColorStop(0.5, '#be123c');
        petalGrad.addColorStop(0.85, '#881337');
        petalGrad.addColorStop(1, '#4c0519');
        ctx.fillStyle = petalGrad;

        ctx.save();
        ctx.translate(px, py);
        ctx.rotate(angle + Math.PI / 2);
        ctx.beginPath();
        ctx.ellipse(0, 0, w * 0.14, h * 0.22, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      // Middle Petal Layer (Vibrant Rose & Coral Pink)
      const midPetals = 10;
      for (let i = 0; i < midPetals; i++) {
        const angle = (i * 2 * Math.PI) / midPetals + 0.3;
        const px = cx + Math.cos(angle) * (w * 0.14);
        const py = cy + Math.sin(angle) * (h * 0.14);

        const midGrad = ctx.createRadialGradient(px, py, 5, px, py, w * 0.16);
        midGrad.addColorStop(0, '#fda4af');
        midGrad.addColorStop(0.4, '#fb7185');
        midGrad.addColorStop(0.8, '#e11d48');
        midGrad.addColorStop(1, '#9f1239');
        ctx.fillStyle = midGrad;

        ctx.save();
        ctx.translate(px, py);
        ctx.rotate(angle + Math.PI / 2);
        ctx.beginPath();
        ctx.ellipse(0, 0, w * 0.11, h * 0.16, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      // Inner Petal Layer (Luminous Blush & Delicate Frills)
      const innerPetals = 8;
      for (let i = 0; i < innerPetals; i++) {
        const angle = (i * 2 * Math.PI) / innerPetals + 0.6;
        const px = cx + Math.cos(angle) * (w * 0.07);
        const py = cy + Math.sin(angle) * (h * 0.07);

        const inGrad = ctx.createRadialGradient(px, py, 2, px, py, w * 0.1);
        inGrad.addColorStop(0, '#fff1f2');
        inGrad.addColorStop(0.5, '#fecdd3');
        inGrad.addColorStop(1, '#f43f5e');
        ctx.fillStyle = inGrad;

        ctx.save();
        ctx.translate(px, py);
        ctx.rotate(angle + Math.PI / 2);
        ctx.beginPath();
        ctx.ellipse(0, 0, w * 0.07, h * 0.1, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      // Core Stamen & Anthers (High-frequency golden cluster)
      const stamenCount = 42;
      for (let i = 0; i < stamenCount; i++) {
        const r = (Math.random() * 0.06 + 0.01) * w;
        const a = Math.random() * Math.PI * 2;
        const sx = cx + Math.cos(a) * r;
        const sy = cy + Math.sin(a) * r;

        // Filament
        ctx.strokeStyle = '#fef08a';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(sx, sy);
        ctx.stroke();

        // Golden Anther Head
        ctx.fillStyle = '#eab308';
        ctx.beginPath();
        ctx.arc(sx, sy, 3.5, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#fef9c3';
        ctx.beginPath();
        ctx.arc(sx - 0.8, sy - 0.8, 1.2, 0, Math.PI * 2);
        ctx.fill();
      }

      // Water droplets with refraction and specular highlights
      const drops = [
        { x: 0.38, y: 0.36, r: 7 },
        { x: 0.62, y: 0.42, r: 9 },
        { x: 0.44, y: 0.68, r: 6 },
        { x: 0.58, y: 0.65, r: 8 },
      ];

      for (const d of drops) {
        const dx = w * d.x;
        const dy = h * d.y;
        ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
        ctx.beginPath();
        ctx.ellipse(dx + 2, dy + 3, d.r, d.r * 0.7, 0.2, 0, Math.PI * 2);
        ctx.fill();

        const dropGrad = ctx.createRadialGradient(dx - 1, dy - 1, 1, dx, dy, d.r);
        dropGrad.addColorStop(0, 'rgba(255, 255, 255, 0.85)');
        dropGrad.addColorStop(0.5, 'rgba(255, 200, 210, 0.3)');
        dropGrad.addColorStop(1, 'rgba(150, 0, 40, 0.6)');
        ctx.fillStyle = dropGrad;
        ctx.beginPath();
        ctx.arc(dx, dy, d.r, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(dx - d.r * 0.35, dy - d.r * 0.35, d.r * 0.25, 0, Math.PI * 2);
        ctx.fill();
      }

      // Editorial Monospace Plate Label
      ctx.font = '700 13px monospace';
      ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
      ctx.fillText('[03 // BOTANICAL FLORA MACRO]', 24, 36);
      ctx.font = '400 10px monospace';
      ctx.fillStyle = 'rgba(255, 255, 255, 0.25)';
      ctx.fillText('MULTI-LAYER VELVET PETALS & GOLDEN STAMEN', 24, 52);

      return ctx.getImageData(0, 0, w, h);
    },
  },

  // 4. Cyberpunk Neon Nightscape
  {
    id: 'cyberpunk-city',
    name: 'Cyberpunk Neon Metropolis',
    category: 'glitch',
    description: 'High-contrast nocturnal skyline with electric cyan grids, magenta neon, and rain reflections',
    generate: (w = 640, h = 640) => {
      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d')!;

      // Night sky
      const sky = ctx.createLinearGradient(0, 0, 0, h * 0.7);
      sky.addColorStop(0, '#04040a');
      sky.addColorStop(0.5, '#0d0520');
      sky.addColorStop(1, '#2e0854');
      ctx.fillStyle = sky;
      ctx.fillRect(0, 0, w, h);

      // Huge synthwave sun
      const sun = ctx.createRadialGradient(w * 0.5, h * 0.45, 10, w * 0.5, h * 0.45, w * 0.28);
      sun.addColorStop(0, '#fef08a');
      sun.addColorStop(0.3, '#f43f5e');
      sun.addColorStop(0.7, '#c026d3');
      sun.addColorStop(1, 'rgba(192, 38, 211, 0)');
      ctx.fillStyle = sun;
      ctx.beginPath();
      ctx.arc(w * 0.5, h * 0.45, w * 0.25, 0, Math.PI * 2);
      ctx.fill();

      // Sun stripes
      ctx.fillStyle = '#0d0520';
      for (let y = h * 0.4; y < h * 0.7; y += 12) {
        ctx.fillRect(w * 0.2, y, w * 0.6, (y - h * 0.4) * 0.15);
      }

      // City silhouettes with high-density window matrices
      const buildings = [
        { x: 0.04, w: 0.13, h: 0.48, color: '#00f0ff' },
        { x: 0.17, w: 0.15, h: 0.58, color: '#ff007f' },
        { x: 0.33, w: 0.11, h: 0.42, color: '#39ff14' },
        { x: 0.45, w: 0.16, h: 0.64, color: '#ffb703' },
        { x: 0.62, w: 0.13, h: 0.5, color: '#00f0ff' },
        { x: 0.76, w: 0.19, h: 0.54, color: '#ff007f' },
      ];

      for (const b of buildings) {
        const bx = b.x * w;
        const bw = b.w * w;
        const bh = b.h * h;
        const by = h * 0.7 - bh;

        ctx.fillStyle = '#08080c';
        ctx.fillRect(bx, by, bw, bh);

        // Neon outline
        ctx.strokeStyle = b.color;
        ctx.lineWidth = 2;
        ctx.strokeRect(bx, by, bw, bh);

        // Window grid
        ctx.fillStyle = b.color;
        for (let wy = by + 16; wy < h * 0.7 - 20; wy += 18) {
          for (let wx = bx + 8; wx < bx + bw - 8; wx += 12) {
            if (Math.random() > 0.42) {
              ctx.fillRect(wx, wy, 6, 8);
            }
          }
        }
      }

      // Reflective grid ground
      const ground = ctx.createLinearGradient(0, h * 0.7, 0, h);
      ground.addColorStop(0, '#09090b');
      ground.addColorStop(1, '#150a2e');
      ctx.fillStyle = ground;
      ctx.fillRect(0, h * 0.7, w, h * 0.3);

      // Perspective grid lines
      ctx.strokeStyle = 'rgba(6, 182, 212, 0.65)';
      ctx.lineWidth = 1.5;
      for (let x = -w * 0.5; x <= w * 1.5; x += w * 0.1) {
        ctx.beginPath();
        ctx.moveTo(w * 0.5, h * 0.7);
        ctx.lineTo(x, h);
        ctx.stroke();
      }
      for (let gy = h * 0.7; gy < h; gy += 15) {
        const factor = (gy - h * 0.7) / (h * 0.3);
        const yPos = h * 0.7 + factor * factor * (h * 0.3);
        ctx.beginPath();
        ctx.moveTo(0, yPos);
        ctx.lineTo(w, yPos);
        ctx.stroke();
      }

      // Editorial Monospace Plate Label
      ctx.font = '700 13px monospace';
      ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
      ctx.fillText('[04 // CYBERPUNK NEON METROPOLIS]', 24, 36);
      ctx.font = '400 10px monospace';
      ctx.fillStyle = 'rgba(255, 255, 255, 0.25)';
      ctx.fillText('HIGH-CHROMA SPECULAR POINTS & PERSPECTIVE GRID', 24, 52);

      return ctx.getImageData(0, 0, w, h);
    },
  },

  // 5. Optical Calibration & SMPTE Matrix Target
  {
    id: 'calibration-target',
    name: 'SMPTE & Optical Calibration Target',
    description: 'Color bars, radial resolution wheels, gradient steps, and high-frequency matrix ramps',
    generate: (w = 640, h = 640) => {
      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d')!;

      // Background
      ctx.fillStyle = '#18181b';
      ctx.fillRect(0, 0, w, h);

      // Top half: SMPTE Color Bars
      const bars = [
        '#ffffff', // White
        '#ffff00', // Yellow
        '#00ffff', // Cyan
        '#00ff00', // Green
        '#ff00ff', // Magenta
        '#ff0000', // Red
        '#0000ff', // Blue
        '#000000', // Black
      ];
      const barW = w / bars.length;
      for (let i = 0; i < bars.length; i++) {
        ctx.fillStyle = bars[i]!;
        ctx.fillRect(i * barW, 0, barW, h * 0.35);
      }

      // Middle: Continuous gradient ramp and 16-step luminance staircase
      const grad = ctx.createLinearGradient(0, 0, w, 0);
      grad.addColorStop(0, '#000000');
      grad.addColorStop(1, '#ffffff');
      ctx.fillStyle = grad;
      ctx.fillRect(0, h * 0.35, w, h * 0.1);

      // 16-step staircase
      const steps = 16;
      const stepW = w / steps;
      for (let i = 0; i < steps; i++) {
        const v = Math.round((i / (steps - 1)) * 255);
        ctx.fillStyle = `rgb(${v}, ${v}, ${v})`;
        ctx.fillRect(i * stepW, h * 0.45, stepW, h * 0.1);
      }

      // Bottom Left: Radial Siemens Star for sharpness / edge resolution
      const cx = w * 0.25;
      const cy = h * 0.75;
      const radius = h * 0.18;
      const spokes = 36;
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#000000';
      for (let i = 0; i < spokes; i += 2) {
        const a1 = (i * 2 * Math.PI) / spokes;
        const a2 = ((i + 1) * 2 * Math.PI) / spokes;
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.arc(cx, cy, radius, a1, a2);
        ctx.closePath();
        ctx.fill();
      }

      // Bottom Right: High-frequency alternating checkerboard / dot matrix
      const rx = w * 0.55;
      const ry = h * 0.6;
      const rw = w * 0.4;
      const rh = h * 0.35;
      ctx.fillStyle = '#27272a';
      ctx.fillRect(rx, ry, rw, rh);

      const gridSize = 8;
      ctx.fillStyle = '#f43f5e';
      for (let gy = ry; gy < ry + rh; gy += gridSize * 2) {
        for (let gx = rx; gx < rx + rw; gx += gridSize * 2) {
          ctx.fillRect(gx, gy, gridSize, gridSize);
          ctx.fillRect(gx + gridSize, gy + gridSize, gridSize, gridSize);
        }
      }

      // Editorial Monospace Plate Label
      ctx.font = '700 13px monospace';
      ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
      ctx.fillText('[05 // SMPTE & OPTICAL CALIBRATION]', 24, 36);
      ctx.font = '400 10px monospace';
      ctx.fillStyle = 'rgba(255, 255, 255, 0.25)';
      ctx.fillText('COLOR BARS // SIEMENS STAR // 16-STEP STAIRCASE', 24, 52);

      return ctx.getImageData(0, 0, w, h);
    },
  },
];
