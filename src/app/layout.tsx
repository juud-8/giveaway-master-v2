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
              // Aggressively disable all Vercel tracking when in iframe
              (function() {
                const inIframe = window.location !== window.parent.location;

                // Define non-configurable properties to disable Vercel services
                const disableProps = [
                  '__VERCEL_DISABLED__',
                  '__VERCEL_ANALYTICS_ID',
                  '__VERCEL_ANALYTICS_ID_PROD',
                  '__VERCEL_SPEED_INSIGHTS_DISABLED__'
                ];

                disableProps.forEach(prop => {
                  try {
                    Object.defineProperty(window, prop, {
                      value: inIframe ? true : '',
                      writable: false,
                      configurable: false
                    });
                  } catch(e) {}
                });

                // Block fetch requests to Vercel analytics endpoints when in iframe
                if (inIframe) {
                  const originalFetch = window.fetch;
                  window.fetch = function(...args) {
                    const url = typeof args[0] === 'string' ? args[0] : args[0]?.url;
                    if (url && (url.includes('/whop-experience') || url.includes('/_vercel/') || url.includes('vercel-insights'))) {
                      return Promise.reject(new Error('Blocked by iframe protection'));
                    }
                    return originalFetch.apply(this, args);
                  };
                }
              })();
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
