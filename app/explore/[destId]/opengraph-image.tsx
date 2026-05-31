import { ImageResponse } from 'next/og';
import { DESTINATIONS } from '@/app/itinerary/data';

// Route segment config
export const runtime = 'edge';
export const alt = 'Explore Spiritual Destinations';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function Image({ params }: { params: { destId: string } }) {
  const destId = params.destId;
  const dest = DESTINATIONS.find(d => d.id === destId);
  const title = dest ? dest.name : 'Spiritual Destinations';
  const state = dest ? dest.state : 'India';

  return new ImageResponse(
    (
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(to bottom right, #020617, #0f172a, #020617)',
          padding: '80px',
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: 60,
            left: 80,
            display: 'flex',
            alignItems: 'center',
          }}
        >
          {/* Logo representation */}
          <div style={{ width: 48, height: 48, background: '#0ea5e9', borderRadius: 12, marginRight: 20 }} />
          <span style={{ fontSize: 40, fontWeight: 900, color: 'white', letterSpacing: '-0.05em' }}>NaviiGo</span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
          <span style={{ color: '#0ea5e9', fontSize: 32, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.2em', marginBottom: 20 }}>
            {state}
          </span>
          <h1 style={{ fontSize: 100, fontWeight: 900, color: 'white', lineHeight: 1.1, margin: 0, letterSpacing: '-0.02em' }}>
            {title}
          </h1>
          <p style={{ fontSize: 40, color: '#94a3b8', marginTop: 40, maxWidth: 800, lineHeight: 1.4 }}>
            Explore the spiritual heritage, beautiful temples, and rich culture of {title}.
          </p>
        </div>

        <div style={{ position: 'absolute', bottom: 60, right: 80, display: 'flex', alignItems: 'center' }}>
          <span style={{ color: '#38bdf8', fontSize: 32, fontWeight: 600 }}>Plan your journey →</span>
        </div>
      </div>
    ),
    { ...size }
  );
}
