import type { Metadata } from "next";
import { Geist, Geist_Mono, Bebas_Neue, Press_Start_2P } from "next/font/google";
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

const displayFont = Bebas_Neue({
  variable: "--font-display",
  subsets: ["latin"],
  weight: "400",
});

const minecraftFont = Press_Start_2P({
  variable: "--font-minecraft",
  subsets: ["latin"],
  weight: "400",
});

export const metadata: Metadata = {
  title: "Torneios & Rankings - Minecraft Speedrunning BR",
  description: "Acompanhe os maiores vencedores e eventos da comunidade brasileira de Minecraft Speedrunning. Rankings, prizepools e histórico completo de torneios.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${displayFont.variable} ${minecraftFont.variable} antialiased`}
      >
        <SiteShell>{children}</SiteShell>
      </body>
    </html>
  );
}
