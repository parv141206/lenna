import { ImageResponse } from 'next/og';

export const size = {
  width: 1200,
  height: 630,
};
export const contentType = 'image/png';

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          backgroundColor: '#09090b',
          color: '#ffffff',
          padding: '60px 70px',
          border: '12px solid #27272a',
          fontFamily: 'monospace',
        }}
      >
        {/* Top Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div
              style={{
                width: '64px',
                height: '64px',
                backgroundColor: '#ffffff',
                color: '#000000',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '38px',
                fontWeight: 900,
              }}
            >
              [L]
            </div>
            <span style={{ fontSize: '36px', fontWeight: 900, letterSpacing: '-1px' }}>
              [Lenna]
            </span>
          </div>
          <span style={{ fontSize: '18px', color: '#a1a1aa', border: '1px solid #3f3f46', padding: '6px 14px' }}>
            {"// EDITORIAL MATRIX LAB"}
          </span>
        </div>

        {/* Center Headline */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div
            style={{
              fontSize: '56px',
              fontWeight: 900,
              lineHeight: 1.1,
              letterSpacing: '-2px',
              maxWidth: '960px',
            }}
          >
            Algorithmic Image Transformer & After Effects Multi-Layer Web Suite
          </div>
          <div style={{ fontSize: '22px', color: '#a1a1aa', maxWidth: '850px' }}>
            56 Pure Mathematical Transformations · Halftone Screens · Bayer Dither · Risograph Inks · Analog Glitches · Zero-Latency Client-Side Canvas 2D
          </div>
        </div>

        {/* Footer Meta Grid */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderTop: '2px solid #27272a',
            paddingTop: '24px',
            fontSize: '16px',
            color: '#71717a',
          }}
        >
          <span>56 ALGORITHMS // ZERO SERVER DEPENDENCY</span>
          <span>AFTER EFFECTS COMPOSITING TIMELINE</span>
          <span style={{ color: '#ffffff', fontWeight: 700 }}>OPEN SOURCE & PRIVATE</span>
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
