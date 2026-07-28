import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import localFont from "next/font/local";
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

const minecraftFont = localFont({
  src: "../public/fonts/minercraftory/Minercraftory.ttf",
  variable: "--font-minecraft",
  display: "swap",
  weight: "400",
});

const minecraftiaFont = localFont({
  src: "../public/fonts/minecraftia/Minecraftia-Regular.ttf",
  variable: "--font-minecraft-body",
  display: "swap",
  weight: "400",
});

export const metadata: Metadata = {
  title: "Minecraft Speedrunning BR",
  description: "MCSR Brasil, vamo querer",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${minecraftFont.variable} ${minecraftiaFont.variable} bg-background text-foreground antialiased`}
      >
        <SiteShell>{children}</SiteShell>
      </body>
    </html>
  );
}
