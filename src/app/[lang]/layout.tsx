import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import FullscreenToggle from "@/components/FullscreenToggle";
import GlobalHeader from "@/components/GlobalHeader";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { LangProvider } from "@/lib/context";
import { isLocale, locales } from "@/lib/i18n";

export const dynamicParams = false;

export function generateStaticParams() {
  return locales.map((lang) => ({ lang }));
}

type LangLayoutProps = {
  children: ReactNode;
  params: Promise<{ lang: string }>;
};

export default async function LangLayout({
  children,
  params,
}: LangLayoutProps) {
  const { lang } = await params;

  if (!isLocale(lang)) {
    redirect("/zh/about");
  }

  return (
    <LangProvider lang={lang}>
      <div className="page-shell min-h-screen">
        <LanguageSwitcher />
        <FullscreenToggle />
        <div className="mx-auto flex min-h-screen w-full max-w-[78rem] flex-col px-5 pb-14 pt-7 sm:px-8 sm:pb-16 sm:pt-8 lg:px-12">
          <GlobalHeader lang={lang} />
          <main className="flex-1 pt-12 sm:pt-16">{children}</main>
        </div>
      </div>
    </LangProvider>
  );
}
