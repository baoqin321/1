import Image from "next/image";
import Link from "next/link";
import { formatDisplayDate, getTypeLabel } from "@/lib/i18n";
import type { ContentMeta, Locale } from "@/lib/types";

type ContentCardProps = {
  item: ContentMeta;
  lang: Locale;
};

export default function ContentCard({ item, lang }: ContentCardProps) {
  return (
    <Link
      href={`/${lang}/content/${item.slug}`}
      className="group glass-panel flex h-full flex-col gap-5 rounded-[0.95rem] p-5 transition duration-200 hover:border-line-strong hover:bg-[rgba(17,24,31,0.88)] sm:p-6"
    >
      {item.cover ? (
        <div className="relative aspect-[4/3] overflow-hidden rounded-[0.72rem] border border-line/80 bg-surface-soft">
          <Image
            src={item.cover}
            alt={item.title}
            fill
            sizes="(max-width: 1024px) 100vw, 50vw"
            className="object-cover transition duration-500 group-hover:scale-[1.02]"
          />
        </div>
      ) : null}

      <div className={`space-y-4 ${item.cover ? "" : "border-t border-line/70 pt-5"}`}>
        <div className="site-ui flex flex-wrap items-center gap-2 text-[0.68rem] uppercase tracking-[0.18em] text-muted">
          <span>{getTypeLabel(item.type, lang)}</span>
          <span aria-hidden="true">/</span>
          <span>{formatDisplayDate(item.date, lang)}</span>
        </div>

        <div className="space-y-3">
          <h2 className="text-[1.58rem] leading-tight font-semibold tracking-[-0.03em] text-ink transition group-hover:text-[rgba(238,243,249,0.92)]">
            {item.title}
          </h2>
          {item.description ? (
            <p className="text-[0.95rem] leading-8 text-muted">
              {item.description}
            </p>
          ) : null}
        </div>
      </div>
    </Link>
  );
}
