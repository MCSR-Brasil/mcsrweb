"use client";

import { useEffect, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { TopNav } from "./top-nav";

export function SiteShell({
  children,
  backdrop,
}: {
  children: ReactNode;
  backdrop?: ReactNode;
}) {
  const pathname = usePathname();
  const isOverlay = pathname?.startsWith("/overlay") ?? false;

  useEffect(() => {
    if (!isOverlay) return;
    const { body, documentElement } = document;
    const prevBodyBg = body.style.background;
    const prevHtmlBg = documentElement.style.background;
    body.style.background = "transparent";
    documentElement.style.background = "transparent";
    return () => {
      body.style.background = prevBodyBg;
      documentElement.style.background = prevHtmlBg;
    };
  }, [isOverlay]);

  if (isOverlay) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-zinc-50 to-zinc-100 dark:from-zinc-950 dark:via-zinc-950 dark:to-zinc-900">
      <div className="relative min-h-screen overflow-hidden">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-emerald-500/15 via-transparent to-transparent" />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,_var(--tw-gradient-stops))] from-cyan-500/10 via-transparent to-transparent" />
        <div className="pointer-events-none absolute inset-0 opacity-30 [background-image:linear-gradient(to_right,rgba(0,0,0,0.04)_1px,transparent_1px),linear-gradient(to_bottom,rgba(0,0,0,0.04)_1px,transparent_1px)] [background-size:32px_32px] dark:opacity-10" />

        {backdrop}

        <TopNav />

        <main className="relative z-10 mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          {children}
        </main>
      </div>
    </div>
  );
}
