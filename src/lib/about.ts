import matter from "gray-matter";
import { promises as fs } from "fs";
import path from "path";
import type { AboutData, AboutMetadata, Locale, SocialLink } from "@/lib/types";

const ABOUT_DIRECTORY = path.join(process.cwd(), "src", "data", "about");

const fallbackMetadata: AboutMetadata = {
  email: "hello@baoqin.blog",
  socials: [],
};

function sanitizeSocialLink(value: unknown): SocialLink | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const link = value as Record<string, unknown>;

  if (
    typeof link.name !== "string" ||
    typeof link.url !== "string" ||
    typeof link.icon !== "string"
  ) {
    return null;
  }

  return {
    icon: link.icon,
    name: link.name,
    url: link.url,
  };
}

export async function getAboutContent(locale: Locale) {
  try {
    const file = await fs.readFile(
      path.join(ABOUT_DIRECTORY, `ABOUT.${locale}.md`),
      "utf8",
    );

    return matter(file).content.trim();
  } catch {
    return null;
  }
}

export async function getAboutMetadata(): Promise<AboutMetadata> {
  try {
    const file = await fs.readFile(
      path.join(ABOUT_DIRECTORY, "metadata.json"),
      "utf8",
    );
    const parsed = JSON.parse(file) as Partial<AboutMetadata>;
    const socials = Array.isArray(parsed.socials)
      ? parsed.socials
          .map((social) => sanitizeSocialLink(social))
          .filter((social): social is SocialLink => social !== null)
      : [];

    return {
      email:
        typeof parsed.email === "string" && parsed.email.trim()
          ? parsed.email
          : fallbackMetadata.email,
      socials,
    };
  } catch {
    return fallbackMetadata;
  }
}

export async function getAboutData(locale: Locale): Promise<AboutData | null> {
  const [content, metadata] = await Promise.all([
    getAboutContent(locale),
    getAboutMetadata(),
  ]);

  if (!content) {
    return null;
  }

  return {
    content,
    locale,
    metadata,
  };
}
