import { ImageResponse } from 'next/og';

export const size = {
  width: 64,
  height: 64,
};
export const contentType = 'image/png';

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#09090b',
          border: '2px solid #27272a',
          color: '#ffffff',
          fontFamily: 'monospace',
          fontSize: 32,
          fontWeight: 900,
          letterSpacing: -2,
        }}
      >
        [L]
      </div>
    ),
    {
      ...size,
    }
  );
}
