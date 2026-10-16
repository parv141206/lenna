/**
 * Built-in Sample Image Generators for Lenna
 * Generates editorial portraits, cyberpunk nightscapes, and optical test targets.
 */

export interface SampleImage {
  id: string;
  name: string;
  category?: string;
  description: string;
  generate: (width?: number, height?: number) => ImageData;
}

export const SAMPLE_IMAGES: SampleImage[] = [
  // 1. Editorial Portrait
  {
    id: 'editorial-portrait',
    name: 'Editorial Fashion Portrait',
    description: 'Studio portrait with rich skin tones, warm hair highlights, and studio lighting',
    generate: (w = 640, h = 640) => {
      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d')!;

      // Background studio gradient
      const bg = ctx.createLinearGradient(0, 0, w, h);
      bg.addColorStop(0, '#2d1b4e');
      bg.addColorStop(0.5, '#5c2d6e');
      bg.addColorStop(1, '#1a0d2e');
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, w, h);

      // Studio rim light
      const rim = ctx.createRadialGradient(w * 0.75, h * 0.25, 10, w * 0.75, h * 0.25, w * 0.6);
      rim.addColorStop(0, 'rgba(255, 180, 140, 0.6)');
      rim.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = rim;
      ctx.fillRect(0, 0, w, h);

      // Shoulders & Body
      ctx.fillStyle = '#1c1917';
      ctx.beginPath();
      ctx.ellipse(w * 0.5, h * 0.95, w * 0.45, h * 0.35, 0, 0, Math.PI * 2);
      ctx.fill();

      // Neck
      const neckGrad = ctx.createLinearGradient(w * 0.4, h * 0.55, w * 0.6, h * 0.55);
      neckGrad.addColorStop(0, '#be7b5c');
      neckGrad.addColorStop(0.5, '#e5a383');
      neckGrad.addColorStop(1, '#d48d6a');
      ctx.fillStyle = neckGrad;
      ctx.fillRect(w * 0.43, h * 0.55, w * 0.14, h * 0.25);

      // Face
      const faceGrad = ctx.createRadialGradient(w * 0.48, h * 0.42, 20, w * 0.5, h * 0.45, w * 0.22);
      faceGrad.addColorStop(0, '#fcd5b5');
      faceGrad.addColorStop(0.6, '#e8a584');
      faceGrad.addColorStop(1, '#be7b5c');
      ctx.fillStyle = faceGrad;
      ctx.beginPath();
      ctx.ellipse(w * 0.5, h * 0.45, w * 0.18, h * 0.22, 0, 0, Math.PI * 2);
      ctx.fill();

      // Hair
      const hairGrad = ctx.createLinearGradient(w * 0.3, h * 0.2, w * 0.7, h * 0.6);
      hairGrad.addColorStop(0, '#3e1f17');
      hairGrad.addColorStop(0.5, '#78350f');
      hairGrad.addColorStop(1, '#b45309');
      ctx.fillStyle = hairGrad;
      ctx.beginPath();
      ctx.ellipse(w * 0.5, h * 0.32, w * 0.24, h * 0.16, 0, 0, Math.PI * 2);
      ctx.fill();

      // Flowing hair strands
      ctx.beginPath();
      ctx.ellipse(w * 0.3, h * 0.48, w * 0.1, h * 0.22, 0.2, 0, Math.PI * 2);
      ctx.ellipse(w * 0.7, h * 0.48, w * 0.1, h * 0.22, -0.2, 0, Math.PI * 2);
      ctx.fill();

      // Fedora / Hat
      ctx.fillStyle = '#831843';
      ctx.beginPath();
      ctx.ellipse(w * 0.5, h * 0.26, w * 0.32, h * 0.08, -0.05, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#9d174d';
      ctx.beginPath();
      ctx.ellipse(w * 0.5, h * 0.22, w * 0.2, h * 0.1, -0.05, 0, Math.PI * 2);
      ctx.fill();

      // Feather on hat
      ctx.strokeStyle = '#f43f5e';
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.moveTo(w * 0.6, h * 0.24);
      ctx.quadraticCurveTo(w * 0.78, h * 0.12, w * 0.85, h * 0.18);
      ctx.stroke();

      // Eyes & Brows
      ctx.fillStyle = '#1e1b4b';
      // Left eye
      ctx.beginPath();
      ctx.ellipse(w * 0.44, h * 0.42, 10, 6, -0.1, 0, Math.PI * 2);
      ctx.fill();
      // Right eye
      ctx.beginPath();
      ctx.ellipse(w * 0.56, h * 0.42, 10, 6, 0.1, 0, Math.PI * 2);
      ctx.fill();

      // Eye irises
      ctx.fillStyle = '#0284c7';
      ctx.beginPath();
      ctx.arc(w * 0.44, h * 0.42, 4, 0, Math.PI * 2);
      ctx.arc(w * 0.56, h * 0.42, 4, 0, Math.PI * 2);
      ctx.fill();

      // Eyebrows
      ctx.strokeStyle = '#451a03';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(w * 0.4, h * 0.39);
      ctx.quadraticCurveTo(w * 0.44, h * 0.38, w * 0.48, h * 0.39);
      ctx.moveTo(w * 0.52, h * 0.39);
      ctx.quadraticCurveTo(w * 0.56, h * 0.38, w * 0.6, h * 0.39);
      ctx.stroke();

      // Lips
      ctx.fillStyle = '#be123c';
      ctx.beginPath();
      ctx.ellipse(w * 0.5, h * 0.52, 16, 7, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#fda4af';
      ctx.beginPath();
      ctx.ellipse(w * 0.5, h * 0.51, 6, 2, 0, 0, Math.PI * 2);
      ctx.fill();

      // Cheek blush
      ctx.fillStyle = 'rgba(244, 63, 94, 0.25)';
      ctx.beginPath();
      ctx.arc(w * 0.41, h * 0.47, 24, 0, Math.PI * 2);
      ctx.arc(w * 0.59, h * 0.47, 24, 0, Math.PI * 2);
      ctx.fill();

      // Lenna Title Badge watermark
      ctx.font = 'bold 22px monospace';
      ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.fillText('[Lenna]', 24, 40);

      return ctx.getImageData(0, 0, w, h);
    },
  },

  // 2. Cyberpunk Neon Nightscape
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
      sky.addColorStop(0, '#050510');
      sky.addColorStop(0.5, '#12072b');
      sky.addColorStop(1, '#3b0764');
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
      ctx.fillStyle = '#12072b';
      for (let y = h * 0.4; y < h * 0.7; y += 12) {
        ctx.fillRect(w * 0.2, y, w * 0.6, (y - h * 0.4) * 0.15);
      }

      // City silhouettes
      const buildings = [
        { x: 0.05, w: 0.12, h: 0.45 },
        { x: 0.18, w: 0.14, h: 0.55 },
        { x: 0.33, w: 0.1, h: 0.4 },
        { x: 0.45, w: 0.15, h: 0.6 },
        { x: 0.62, w: 0.12, h: 0.48 },
        { x: 0.76, w: 0.18, h: 0.52 },
      ];

      for (const b of buildings) {
        const bx = b.x * w;
        const bw = b.w * w;
        const bh = b.h * h;
        const by = h * 0.7 - bh;

        ctx.fillStyle = '#09090b';
        ctx.fillRect(bx, by, bw, bh);

        // Neon outline
        ctx.strokeStyle = '#06b6d4';
        ctx.lineWidth = 2;
        ctx.strokeRect(bx, by, bw, bh);

        // Windows
        ctx.fillStyle = '#f43f5e';
        for (let wy = by + 15; wy < h * 0.7 - 20; wy += 18) {
          for (let wx = bx + 8; wx < bx + bw - 8; wx += 12) {
            if (Math.random() > 0.4) {
              ctx.fillRect(wx, wy, 6, 8);
            }
          }
        }
      }

      // Reflective grid ground
      const ground = ctx.createLinearGradient(0, h * 0.7, 0, h);
      ground.addColorStop(0, '#09090b');
      ground.addColorStop(1, '#1e1b4b');
      ctx.fillStyle = ground;
      ctx.fillRect(0, h * 0.7, w, h * 0.3);

      // Perspective grid lines
      ctx.strokeStyle = 'rgba(6, 182, 212, 0.6)';
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

      return ctx.getImageData(0, 0, w, h);
    },
  },

  // 3. Optical Calibration & Matrix Target
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

      return ctx.getImageData(0, 0, w, h);
    },
  },
];
