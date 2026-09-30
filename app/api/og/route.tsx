import { ImageResponse } from '@vercel/og';

export const runtime = 'nodejs';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    const name = searchParams.get('name') || 'FolioForge AI';
    const title = searchParams.get('title') || 'Privacy-First AI Portfolio Studio';
    const template = searchParams.get('template') || 'Modern';

    return new ImageResponse(
      (
        <div
          style={{
            height: '100%',
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            backgroundColor: '#08090b',
            backgroundImage:
              'radial-gradient(circle at 85% 15%, rgba(249, 115, 22, 0.25), transparent 50%), radial-gradient(circle at 15% 85%, rgba(124, 111, 240, 0.2), transparent 50%)',
            padding: '60px 80px',
            fontFamily: 'sans-serif',
            color: '#f3f4f2',
          }}
        >
          {/* Header Bar */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div
              style={{
                width: '48px',
                height: '48px',
                borderRadius: '14px',
                background: 'linear-gradient(155deg, #fdba74, #f97316)',
                color: '#1a0d02',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 'bold',
                fontSize: '24px',
              }}
            >
              F
            </div>
            <div style={{ fontSize: '24px', fontWeight: 'bold', letterSpacing: '-0.02em' }}>
              FolioForge <span style={{ fontSize: '14px', opacity: 0.6, marginLeft: '8px' }}>V2 • AI PORTFOLIO STUDIO</span>
            </div>
          </div>

          {/* Main Title & Subtitle */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxWidth: '900px' }}>
            <div
              style={{
                fontSize: '64px',
                fontWeight: 'bold',
                letterSpacing: '-0.03em',
                lineHeight: 1.1,
                color: '#ffffff',
              }}
            >
              {name}
            </div>
            <div style={{ fontSize: '32px', color: '#f97316', fontWeight: '600' }}>
              {title}
            </div>
            <div style={{ fontSize: '20px', color: '#8b8d94', marginTop: '8px' }}>
              Built with FolioForge • {template} Layout Template • Zero Database Needed
            </div>
          </div>

          {/* Footer Badges */}
          <div style={{ display: 'flex', gap: '16px' }}>
            <div
              style={{
                padding: '10px 20px',
                borderRadius: '99px',
                backgroundColor: 'rgba(255, 255, 255, 0.08)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                fontSize: '16px',
                color: '#ddd',
              }}
            >
              ⚡ AI Auto-Detection Engine
            </div>
            <div
              style={{
                padding: '10px 20px',
                borderRadius: '99px',
                backgroundColor: 'rgba(249, 115, 22, 0.15)',
                border: '1px solid rgba(249, 115, 22, 0.4)',
                fontSize: '16px',
                color: '#f97316',
              }}
            >
              🚀 Ready for Vercel Deploy
            </div>
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
      }
    );
  } catch {
    return new Response('Failed to generate OpenGraph image', { status: 500 });
  }
}
