import { notFound } from "next/navigation";
import { getCopy, isLocale, locales } from "@/lib/i18n";
import type { Locale } from "@/lib/types";

export const dynamicParams = false;

export function generateStaticParams() {
  return locales.map((lang) => ({ lang }));
}

type ProductsPageProps = {
  params: Promise<{ lang: string }>;
};

export default async function ProductsPage({ params }: ProductsPageProps) {
  const { lang } = await params;

  if (!isLocale(lang)) {
    notFound();
  }

  const locale = lang as Locale;
  const copy = getCopy(locale);

  return (
    <section className="fade-up space-y-12">
      <header className="max-w-[40rem]">
        <p className="eyebrow">{copy.productsEyebrow}</p>
        <h1 className="mt-4 text-[2.65rem] leading-[0.98] font-semibold tracking-[-0.05em] text-ink sm:text-[3.4rem]">
          {copy.productsTitle}
        </h1>
        <p className="mt-5 text-[0.98rem] leading-8 text-muted sm:text-[1.04rem]">
          {copy.productsLead}
        </p>
      </header>

      <div className="glass-panel rounded-[0.95rem] px-6 py-8 text-muted">
        {copy.emptyProducts}
      </div>
    </section>
  );
}
