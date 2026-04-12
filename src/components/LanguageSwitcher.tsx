"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLang } from "@/lib/context";
import { getCopy } from "@/lib/i18n";
import type { Locale } from "@/lib/types";

function getAlternateLanguage(lang: Locale): Locale {
  return lang === "zh" ? "en" : "zh";
}

export default function LanguageSwitcher() {
  const pathname = usePathname();
  const lang = useLang();
  const alternateLang = getAlternateLanguage(lang);
  const copy = getCopy(lang);

  const currentPath = pathname ?? `/${lang}/about`;
  const alternatePath = currentPath.replace(
    /^\/(zh|en)(?=\/|$)/,
    `/${alternateLang}`,
  );

  return (
    <div className="fixed right-4 top-4 z-50 sm:right-8 sm:top-6">
      <div className="site-ui flex items-center gap-1 rounded-[0.85rem] border border-line/90 bg-[rgba(9,13,18,0.82)] p-1 text-[0.68rem] uppercase tracking-[0.16em] text-white backdrop-blur-md">
        <span className="sr-only">{copy.switchLanguage}</span>
        <Link
          href={lang === "zh" ? currentPath : alternatePath}
          className={`rounded-[0.65rem] px-3 py-1.5 transition ${
            lang === "zh"
              ? "bg-[rgba(255,255,255,0.16)] text-white"
              : "text-white hover:text-white"
          }`}
        >
          {"\u4E2D"}
        </Link>
        <Link
          href={lang === "en" ? currentPath : alternatePath}
          className={`rounded-[0.65rem] px-3 py-1.5 transition ${
            lang === "en"
              ? "bg-[rgba(255,255,255,0.16)] text-white"
              : "text-white hover:text-white"
          }`}
        >
          EN
        </Link>
      </div>
    </div>
  );
}
