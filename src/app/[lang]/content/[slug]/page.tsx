import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import ContentRenderer from "@/components/ContentRenderer";
import { getContentBySlug, getPublishedContentParams } from "@/lib/content";
import { formatDisplayDate, getCopy, getTypeLabel, isLocale } from "@/lib/i18n";
import type { Locale } from "@/lib/types";

export const dynamicParams = false;

export async function generateStaticParams() {
  return getPublishedContentParams();
}

type ContentDetailPageProps = {
  params: Promise<{ lang: string; slug: string }>;
};

export default async function ContentDetailPage({
  params,
}: ContentDetailPageProps) {
  const { lang, slug } = await params;

  if (!isLocale(lang)) {
    notFound();
  }

  const locale = lang as Locale;
  const copy = getCopy(locale);
  const item = await getContentBySlug(slug, locale);

  if (!item) {
    notFound();
  }

  return (
    <article className="fade-up mx-auto max-w-[48rem] space-y-10">
      <Link
        href={`/${locale}/content`}
        className="site-ui inline-flex border-b border-transparent pb-1 text-[0.76rem] uppercase tracking-[0.16em] text-muted transition hover:border-line hover:text-ink"
      >
        {copy.backToContent}
      </Link>

      <header className="border-b border-line/80 pb-8">
        <div className="site-ui flex flex-wrap items-center gap-2 text-[0.72rem] uppercase tracking-[0.18em] text-muted">
          <span>{getTypeLabel(item.type, locale)}</span>
          <span aria-hidden="true">/</span>
          <span>{formatDisplayDate(item.date, locale)}</span>
        </div>
        <h1 className="mt-5 text-[2.5rem] leading-[0.98] font-semibold tracking-[-0.05em] text-ink sm:text-[3.4rem]">
          {item.title}
        </h1>
        {item.description ? (
          <p className="mt-5 max-w-[38rem] text-[0.98rem] leading-8 text-muted sm:text-[1.05rem]">
            {item.description}
          </p>
        ) : null}
      </header>

      {item.cover ? (
        <div className="overflow-hidden rounded-[0.95rem] border border-line/80 bg-surface">
          <div className="relative aspect-[16/10]">
            <Image
              src={item.cover}
              alt={item.title}
              fill
              priority
              sizes="(max-width: 1024px) 100vw, 768px"
              className="object-cover"
            />
          </div>
        </div>
      ) : null}

      <div>
        <ContentRenderer item={item} lang={locale} />
      </div>
    </article>
  );
}
