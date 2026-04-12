"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { getCopy } from "@/lib/i18n";
import type { Locale } from "@/lib/types";

type GlobalHeaderProps = {
  lang: Locale;
};

export default function GlobalHeader({ lang }: GlobalHeaderProps) {
  const pathname = usePathname();
  const copy = getCopy(lang);
  const currentSection = pathname?.split("/").filter(Boolean)[1] ?? "about";

  const navItems = [
    { href: `/${lang}/about`, key: "about", label: copy.aboutNav },
    { href: `/${lang}/content`, key: "content", label: copy.contentNav },
    { href: `/${lang}/products`, key: "products", label: copy.productsNav },
    { href: `/${lang}/contact`, key: "contact", label: copy.contactLabel },
  ] as const;

  return (
    <header className="h-0">
      <div className="relative">
        <Link
          href={`/${lang}/about`}
          aria-label={copy.brandName}
          className="site-ui fixed left-3 top-4 z-50 inline-flex items-center gap-3 px-0 py-0 text-ink sm:left-4 sm:top-6 lg:left-5"
        >
          <span className="relative h-11 w-11 shrink-0 overflow-hidden">
            <Image
              src="/images/brand/baoqin-brain-logo.png"
              alt={copy.brandLogoAlt}
              fill
              priority
              sizes="44px"
              className="object-cover object-center"
            />
          </span>
          <span className="text-[1.08rem] font-semibold tracking-[0.08em] text-ink">
            {copy.brandName}
          </span>
        </Link>

        <nav className="site-ui fixed left-3 top-[5.75rem] z-40 flex w-fit flex-col gap-3 text-[0.9rem] font-black uppercase tracking-[0.05em] sm:left-4 sm:top-[7rem] lg:left-5 lg:top-[7rem]">
          {navItems.map((item) => {
            const isActive = currentSection === item.key;

            return (
              <Link
                key={item.key}
                href={item.href}
                data-active={isActive}
                className={`site-nav-pill inline-flex min-w-[5.75rem] items-center justify-center rounded-full border px-5 py-2.5 text-center text-white ${
                  isActive
                    ? "border-black bg-black"
                    : "border-black/80 bg-black hover:border-black hover:bg-black"
                }`}
              >
                <span className="site-nav-pill-label relative z-10">
                  {item.label}
                </span>
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
