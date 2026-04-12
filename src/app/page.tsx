"use client";

import { useEffect } from "react";

export default function Home() {
  useEffect(() => {
    window.location.replace("zh/about/");
  }, []);

  return (
    <main className="flex min-h-screen items-center justify-center bg-canvas px-6 text-center text-sm uppercase tracking-[0.28em] text-white/60">
      <a href="zh/about/" className="transition hover:text-white">
        Enter Baoqin&apos;s blog
      </a>
    </main>
  );
}
