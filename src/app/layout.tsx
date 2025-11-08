import type { Metadata } from "next";
import "@/styles/globals.css";

export const metadata: Metadata = {
  title: "Giveaway Master",
  description: "Manage and track your giveaways",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              // Completely disable all Vercel services
              window.__VERCEL_DISABLED__ = true;
              window.__VERCEL_ANALYTICS_ID = '';
              window.__VERCEL_ANALYTICS_ID_PROD = '';
              window.va = undefined;
              window.vupdate = undefined;

              // Disable speed insights
              window.__VERCEL_SPEED_INSIGHTS__ = false;
              window.si = undefined;

              // Prevent WebSocket connections to Vercel
              if (window.location !== window.parent.location) {
                // Running in iframe - block all external analytics
                const originalWebSocket = window.WebSocket;
                window.WebSocket = function(url, protocols) {
                  // Block Vercel WebSocket connections
                  if (typeof url === 'string' && url.includes('vercel')) {
                    console.log('[Blocked] Vercel WebSocket connection prevented in iframe');
                    return {
                      close: function() {},
                      send: function() {},
                      addEventListener: function() {},
                      removeEventListener: function() {},
                      readyState: 3, // CLOSED
                    };
                  }
                  return new originalWebSocket(url, protocols);
                };
              }

              // Override fetch to block Vercel analytics
              const originalFetch = window.fetch;
              window.fetch = function(...args) {
                const url = args[0];
                if (typeof url === 'string' && (
                  url.includes('vercel-analytics') ||
                  url.includes('vitals.vercel') ||
                  url.includes('/_vercel/')
                )) {
                  console.log('[Blocked] Vercel analytics request prevented');
                  return Promise.resolve(new Response('{}', { status: 200 }));
                }
                return originalFetch.apply(this, args);
              };
            `,
          }}
        />
      </head>
      <body className="bg-slate-950 text-white">
        {children}
      </body>
    </html>
  );
}
