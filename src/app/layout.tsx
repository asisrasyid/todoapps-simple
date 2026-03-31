import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "./providers";

export const metadata: Metadata = {
  title: "SheetMaster – Kanban Todo",
  description: "Multi-user Kanban board powered by Google Sheets",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "SheetMaster",
  },
  formatDetection: { telephone: false },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){var t=localStorage.getItem('theme');var root=document.documentElement;if(t==='light'){root.classList.remove('dark');root.classList.add('light')}else if(t==='system'){var d=window.matchMedia('(prefers-color-scheme: dark)').matches;root.classList.toggle('dark',d);root.classList.toggle('light',!d)}})()`,
          }}
        />
        <link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="SheetMaster" />
        <meta name="theme-color" content="#7c3aed" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32.png" />
        <link rel="icon" type="image/svg+xml" href="/icons/icon.svg" />
      </head>
      <body style={{ fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
