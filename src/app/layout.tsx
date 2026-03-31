import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "./providers";

export const metadata: Metadata = {
  title: "SheetMaster – Kanban Todo",
  description: "Multi-user Kanban board powered by Google Sheets",
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
      </head>
      <body style={{ fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
