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
              window.__VERCEL_DISABLED__ = true;
              if (window.location !== window.parent.location) {
                window.__VERCEL_ANALYTICS_ID = '';
                window.__VERCEL_ANALYTICS_ID_PROD = '';
              }
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
