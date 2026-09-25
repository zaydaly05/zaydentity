import type { Metadata, Viewport } from 'next';
import './globals.css';

const favicon =
  'data:image/svg+xml,' +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">' +
      '<rect width="64" height="64" rx="16" fill="#f97316"/>' +
      '<text x="32" y="43" font-family="Arial, sans-serif" font-size="30" font-weight="700" fill="#1a0d02" text-anchor="middle">F</text>' +
      '</svg>'
  );

export const metadata: Metadata = {
  title: 'FolioForge — AI Portfolio Studio',
  description: 'Turn a CV into a structured, customizable portfolio and deploy it to Vercel — no database, no account.',
  icons: { icon: favicon },
  openGraph: {
    title: 'FolioForge — AI Portfolio Studio',
    description: 'Turn a CV into a structured, customizable portfolio and deploy it to Vercel — no database, no account.',
    type: 'website',
  },
};

export const viewport: Viewport = {
  themeColor: '#08090b',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
