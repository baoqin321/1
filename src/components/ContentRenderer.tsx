import ReactMarkdown from "react-markdown";
import { getCopy } from "@/lib/i18n";
import { markdownClassName, markdownPlugins } from "@/lib/markdown";
import type { ContentItem, Locale } from "@/lib/types";

type ContentRendererProps = {
  item: ContentItem;
  lang: Locale;
};

export default function ContentRenderer({
  item,
  lang,
}: ContentRendererProps) {
  const copy = getCopy(lang);
  const markdown = item.content ? (
    <div className={markdownClassName}>
      <ReactMarkdown remarkPlugins={markdownPlugins}>
        {item.content}
      </ReactMarkdown>
    </div>
  ) : null;

  switch (item.type) {
    case "text":
      return markdown;
    case "video":
      return (
        <div className="space-y-10">
          {item.videoUrl ? (
            <div className="overflow-hidden rounded-[0.9rem] border border-line/80 bg-surface-soft">
              <iframe
                src={item.videoUrl}
                title={item.title}
                className="aspect-video w-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          ) : (
            <p className="text-muted">{copy.missingVideo}</p>
          )}
          {markdown}
        </div>
      );
    case "audio":
      return (
        <div className="space-y-10">
          {item.audioUrl ? (
            <div className="rounded-[0.8rem] border border-line/80 bg-surface-soft px-4 py-4 sm:px-5">
              <audio controls className="w-full">
                <source src={item.audioUrl} />
              </audio>
            </div>
          ) : (
            <p className="text-muted">{copy.missingAudio}</p>
          )}
          {markdown}
        </div>
      );
    case "link":
      return (
        <div className="space-y-10">
          {item.linkUrl ? (
            <a
              href={item.linkUrl}
              target="_blank"
              rel="noreferrer"
              className="block rounded-[0.8rem] border border-line/80 bg-surface-soft px-5 py-5 transition hover:border-line-strong"
            >
              <p className="site-ui text-[0.68rem] uppercase tracking-[0.18em] text-muted">
                {copy.externalLink}
              </p>
              <p className="mt-3 break-all text-lg text-accent">{item.linkUrl}</p>
            </a>
          ) : (
            <p className="text-muted">{copy.missingLink}</p>
          )}
          {markdown}
        </div>
      );
    default:
      return markdown;
  }
}
