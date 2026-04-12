import matter from "gray-matter";
import { promises as fs } from "fs";
import path from "path";
import { parse } from "yaml";
import {
  contentTypes,
  locales,
  type ContentItem,
  type ContentMeta,
  type ContentType,
  type Locale,
} from "@/lib/types";

const CONTENT_DIRECTORY = path.join(process.cwd(), "src", "data", "content");

function isContentType(value: unknown): value is ContentType {
  return contentTypes.includes(value as ContentType);
}

function isLocaleValue(value: unknown): value is Locale {
  return locales.includes(value as Locale);
}

function resolveCoverPath(cover: unknown, directoryName: string) {
  if (typeof cover !== "string" || !cover.trim()) {
    return undefined;
  }

  if (
    cover.startsWith("/") ||
    cover.startsWith("http://") ||
    cover.startsWith("https://")
  ) {
    return cover;
  }

  if (cover.startsWith("./")) {
    return `/images/content/${directoryName}/${cover.slice(2)}`;
  }

  return `/images/content/${directoryName}/${cover}`;
}

function parseMetaFile(
  source: string,
  locale: Locale,
  directoryName: string,
): ContentMeta {
  const parsed = parse(source) as Record<string, unknown> | null;

  if (!parsed || typeof parsed !== "object") {
    throw new Error(`Invalid meta file in ${directoryName}.`);
  }

  const title = parsed.title;
  const description = parsed.description;
  const date = parsed.date;
  const type = parsed.type;
  const declaredLocale = parsed.locale;
  const slug = parsed.slug;
  const draft = parsed.draft;

  if (typeof title !== "string" || !title.trim()) {
    throw new Error(`Missing title in ${directoryName}.`);
  }

  if (typeof date !== "string" || !date.trim()) {
    throw new Error(`Missing date in ${directoryName}.`);
  }

  if (!isContentType(type)) {
    throw new Error(`Invalid content type in ${directoryName}.`);
  }

  if (!isLocaleValue(declaredLocale) || declaredLocale !== locale) {
    throw new Error(`Locale mismatch in ${directoryName}.`);
  }

  if (typeof slug !== "string" || !slug.trim()) {
    throw new Error(`Missing slug in ${directoryName}.`);
  }

  return {
    audioUrl: typeof parsed.audioUrl === "string" ? parsed.audioUrl : undefined,
    cover: resolveCoverPath(parsed.cover, directoryName),
    date,
    description:
      typeof description === "string" && description.trim()
        ? description
        : undefined,
    draft: typeof draft === "boolean" ? draft : false,
    linkUrl: typeof parsed.linkUrl === "string" ? parsed.linkUrl : undefined,
    locale,
    slug,
    title,
    type,
    videoUrl: typeof parsed.videoUrl === "string" ? parsed.videoUrl : undefined,
  };
}

async function getContentDirectories() {
  try {
    const entries = await fs.readdir(CONTENT_DIRECTORY, { withFileTypes: true });

    return entries.filter((entry) => entry.isDirectory()).map((entry) => entry.name);
  } catch {
    return [];
  }
}

async function loadMeta(directoryName: string, locale: Locale) {
  try {
    const source = await fs.readFile(
      path.join(CONTENT_DIRECTORY, directoryName, `meta.${locale}.yaml`),
      "utf8",
    );

    return parseMetaFile(source, locale, directoryName);
  } catch {
    return null;
  }
}

export async function getAllContent(locale: Locale): Promise<ContentMeta[]> {
  const directories = await getContentDirectories();
  const entries = await Promise.all(
    directories.map((directoryName) => loadMeta(directoryName, locale)),
  );

  return entries
    .filter((entry): entry is ContentMeta => entry !== null && !entry.draft)
    .sort(
      (left, right) =>
        new Date(`${right.date}T00:00:00Z`).getTime() -
        new Date(`${left.date}T00:00:00Z`).getTime(),
    );
}

export async function getContentBySlug(
  slug: string,
  locale: Locale,
): Promise<ContentItem | null> {
  const directories = await getContentDirectories();

  for (const directoryName of directories) {
    const meta = await loadMeta(directoryName, locale);

    if (!meta || meta.slug !== slug || meta.draft) {
      continue;
    }

    try {
      const source = await fs.readFile(
        path.join(CONTENT_DIRECTORY, directoryName, `content.${locale}.md`),
        "utf8",
      );
      const parsed = matter(source);

      return {
        ...meta,
        content: parsed.content.trim(),
      };
    } catch {
      return null;
    }
  }

  return null;
}

export async function getPublishedContentParams() {
  const params = await Promise.all(
    locales.map(async (lang) => {
      const items = await getAllContent(lang);

      return items.map((item) => ({
        lang,
        slug: item.slug,
      }));
    }),
  );

  return params.flat();
}
