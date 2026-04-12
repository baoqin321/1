import { notFound } from "next/navigation";
import { getCopy, isLocale, locales } from "@/lib/i18n";

export const dynamicParams = false;

export function generateStaticParams() {
  return locales.map((lang) => ({ lang }));
}

type ContentIndexPageProps = {
  params: Promise<{ lang: string }>;
};

export default async function ContentIndexPage({
  params,
}: ContentIndexPageProps) {
  const { lang } = await params;

  if (!isLocale(lang)) {
    notFound();
  }

  const copy = getCopy(lang);

  return (
    <section className="fade-up space-y-5">
      <h1 className="text-[2.65rem] leading-[0.98] font-semibold tracking-[-0.05em] text-ink sm:text-[3.4rem]">
        {copy.contentTitle}
      </h1>
      <p className="max-w-[34rem] text-[0.98rem] leading-8 text-muted sm:text-[1.04rem]">
        这里将持续更新本人认为有价值的内容
      </p>
    </section>
  );
}
