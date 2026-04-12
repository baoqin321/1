export const locales = ["zh", "en"] as const;
export type Locale = (typeof locales)[number];

export const contentTypes = ["text", "video", "audio", "link"] as const;
export type ContentType = (typeof contentTypes)[number];

export interface ContentMeta {
  title: string;
  description?: string;
  date: string;
  type: ContentType;
  locale: Locale;
  slug: string;
  draft: boolean;
  cover?: string;
  videoUrl?: string;
  audioUrl?: string;
  linkUrl?: string;
}

export interface ContentItem extends ContentMeta {
  content: string;
}

export interface SocialLink {
  name: string;
  url: string;
  icon: string;
}

export interface AboutMetadata {
  email: string;
  socials: SocialLink[];
}

export interface AboutData {
  content: string;
  locale: Locale;
  metadata: AboutMetadata;
}
