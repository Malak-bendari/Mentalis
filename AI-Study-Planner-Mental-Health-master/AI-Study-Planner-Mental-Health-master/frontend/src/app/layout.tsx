import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { I18nProvider } from "@/components/i18n-provider";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["500", "700"],
  variable: "--font-poppins",
});

import { HideableNavbar } from "@/components/layout/hideable-navbar";

export const metadata: Metadata = {
  title: "Mentalis - AI-Powered Academic Planner",
  description: "Mental health-aware academic planning with AI support",
};



export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <Script
          id="mentalis-theme-init"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{
            __html: `(()=>{try{const saved=localStorage.getItem("mentalis-theme");const dark=saved?saved==="dark":window.matchMedia("(prefers-color-scheme: dark)").matches;document.documentElement.classList.toggle("dark",dark);document.documentElement.style.colorScheme=dark?"dark":"light"}catch{}})();`,
          }}
        />
      </head>
      <body
        className={`${poppins.variable} antialiased min-h-screen font-sans`}
      >
        <I18nProvider>
          <div className="relative flex min-h-screen flex-col">
            <HideableNavbar />
            <main className="flex-1">{children}</main>
          </div>
          <Toaster />
        </I18nProvider>
      </body>
    </html>
  );
}
