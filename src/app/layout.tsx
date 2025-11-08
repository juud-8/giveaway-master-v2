import type { Metadata, Viewport } from 'next';
import '@/styles/globals.css';

export const metadata: Metadata = {
  title: 'Giveaway Master',
  description: 'Manage giveaways for your Whop store',
  manifest: '/manifest.json',
  icons: {
    icon: '/icon.svg',
    apple: '/icon.svg',
  },
};

export const viewport: Viewport = {
  themeColor: '#0f172a',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              // Disable Vercel Speed Insights in Whop iframe
              window.__VERCEL_DISABLED__ = true;
              if (window.location !== window.parent.location) {
                // We're in an iframe - disable all Vercel tracking
                Object.defineProperty(window, '__VERCEL_ANALYTICS_ID', { value: '' });
                Object.defineProperty(window, '__VERCEL_ANALYTICS_ID_PROD', { value: '' });
              }
            `,
          }}
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
