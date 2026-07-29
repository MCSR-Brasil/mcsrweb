import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { SiteShell } from "../components/site-shell";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "MCSR Brasil",
  description: "Site da comunidade brasileira de speedrun de Minecraft",
  openGraph: {
    title: "MCSR Brasil",
    description: "Site da comunidade brasileira de speedrun de Minecraft",
    siteName: "MCSR Brasil",
    locale: "pt_BR",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "MCSR Brasil",
    description: "Site da comunidade brasileira de speedrun de Minecraft",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${geistSans.variable} ${geistMono.variable} bg-background text-foreground antialiased`}
      >
        <SiteShell>{children}</SiteShell>
      </body>
    </html>
  );
}
