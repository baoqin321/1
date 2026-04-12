import { locales, type ContentType, type Locale } from "@/lib/types";

const copy = {
  zh: {
    brandName: "\u5B9D\u52E4",
    brandLogoAlt: "\u5B9D\u52E4 logo",
    siteName: "\u5B9D\u52E4\u7684\u535A\u5BA2",
    siteTag: "",
    siteIntro:
      "\u4E00\u4E2A\u957F\u671F\u66F4\u65B0\u7684\u4E2A\u4EBA\u7A7A\u95F4\uFF0C\u7528\u6765\u8868\u8FBE\u89C1\u89E3\uFF0C\u5206\u4EAB\u4E00\u5207\u81EA\u8BA4\u4E3A\u6709\u4EF7\u503C\u7684\u4FE1\u606F\uFF0C\u4EE5\u53CA\u6211\u81EA\u5DF1\u7684\u4E00\u4E9B\u4F5C\u54C1\u3002",
    aboutNav: "\u5173\u4E8E\u6211",
    contentNav: "\u5185\u5BB9",
    productsNav: "\u4EA7\u54C1",
    switchLanguage: "\u5207\u6362\u8BED\u8A00",
    aboutEyebrow: "About",
    aboutTitle: "\u5173\u4E8E\u6211",
    aboutLead:
      "\u8FD9\u91CC\u4FDD\u7559\u4E00\u4EFD\u7A33\u5B9A\u7684\u4E2A\u4EBA\u4ECB\u7ECD\uFF0C\u4E5F\u653E\u4E00\u4E9B\u6301\u7EED\u5173\u5FC3\u7684\u65B9\u5411\u548C\u5DE5\u4F5C\u7EBF\u7D22\u3002",
    profileAlt: "\u5B9D\u52E4\u7684\u5934\u50CF",
    contactLabel: "\u8054\u7CFB\u6211",
    contactEyebrow: "Contact",
    contactTitle: "\u8054\u7CFB\u6211",
    contactLead:
      "\u5FAE\u4FE1\u3001QQ \u548C QQ \u90AE\u7BB1\u90FD\u653E\u5728\u8FD9\u91CC\uff0c\u6709\u4E8B\u60C5\u53EF\u4EE5\u76F4\u63A5\u8054\u7CFB\u6211\u3002",
    contentEyebrow: "Archive",
    contentTitle: "\u6211\u7684\u5185\u5BB9",
    contentLead:
      "\u8FD9\u91CC\u6536\u5F55\u6587\u7AE0\u3001\u89C6\u9891\u3001\u97F3\u9891\u4E0E\u94FE\u63A5\uFF0C\u6309\u65F6\u95F4\u6574\u7406\uFF0C\u50CF\u4E00\u4EFD\u6301\u7EED\u751F\u957F\u7684\u76EE\u5F55\u3002",
    emptyContent: "\u5F53\u524D\u8FD8\u6CA1\u6709\u516C\u5F00\u5185\u5BB9\u3002",
    backToContent: "\u8FD4\u56DE\u76EE\u5F55",
    productsEyebrow: "Products",
    productsTitle: "\u4EA7\u54C1",
    productsLead:
      "\u8FD9\u91CC\u4F1A\u6574\u7406\u6211\u6B63\u5728\u505A\u3001\u5DF2\u7ECF\u53D1\u5E03\u6216\u8005\u4ECD\u5728\u957F\u671F\u7EF4\u62A4\u7684\u4EA7\u54C1\u3002",
    emptyProducts: "\u4EA7\u54C1\u9875\u6B63\u5728\u6574\u7406\u4E2D\u3002",
    externalLink: "\u5916\u90E8\u94FE\u63A5",
    missingVideo:
      "\u5F53\u524D\u6761\u76EE\u6CA1\u6709\u53EF\u5C55\u793A\u7684\u89C6\u9891\u5730\u5740\u3002",
    missingAudio:
      "\u5F53\u524D\u6761\u76EE\u6CA1\u6709\u53EF\u64AD\u653E\u7684\u97F3\u9891\u5730\u5740\u3002",
    missingLink:
      "\u5F53\u524D\u6761\u76EE\u6CA1\u6709\u5916\u90E8\u94FE\u63A5\u3002",
  },
  en: {
    brandName: "\u5B9D\u52E4",
    brandLogoAlt: "Baoqin logo",
    siteName: "Baoqin",
    siteTag: "Independent Notes",
    siteIntro:
      "A quiet personal space for writing, projects, and observations that can stay useful over time.",
    aboutNav: "About",
    contentNav: "Content",
    productsNav: "Products",
    switchLanguage: "Switch language",
    aboutEyebrow: "About",
    aboutTitle: "About",
    aboutLead:
      "This page keeps a steady introduction and a few themes I expect to keep returning to.",
    profileAlt: "Portrait of Baoqin",
    contactLabel: "Contact",
    contactEyebrow: "Contact",
    contactTitle: "Contact",
    contactLead:
      "WeChat, QQ, and email are collected here for direct contact.",
    contentEyebrow: "Archive",
    contentTitle: "Content",
    contentLead:
      "Essays, audio notes, videos, and curated links are managed as local files and listed in reverse chronological order.",
    emptyContent: "There is no published content yet.",
    backToContent: "Back to archive",
    productsEyebrow: "Products",
    productsTitle: "Products",
    productsLead:
      "This section will collect the products I am building, shipping, or maintaining over time.",
    emptyProducts: "Products are being organized.",
    externalLink: "External link",
    missingVideo: "No video URL is attached to this item.",
    missingAudio: "No audio URL is attached to this item.",
    missingLink: "No outbound URL is attached to this item.",
  },
} as const;

const typeLabels: Record<Locale, Record<ContentType, string>> = {
  zh: {
    text: "\u6587\u7AE0",
    video: "\u89C6\u9891",
    audio: "\u97F3\u9891",
    link: "\u94FE\u63A5",
  },
  en: {
    text: "Text",
    video: "Video",
    audio: "Audio",
    link: "Link",
  },
};

export { locales };

export function isLocale(value: string): value is Locale {
  return locales.includes(value as Locale);
}

export function getCopy(locale: Locale) {
  return copy[locale];
}

export function getTypeLabel(type: ContentType, locale: Locale) {
  return typeLabels[locale][type];
}

export function formatDisplayDate(date: string, locale: Locale) {
  const formatter = new Intl.DateTimeFormat(locale === "zh" ? "zh-CN" : "en-US", {
    day: "numeric",
    month: "long",
    timeZone: "UTC",
    year: "numeric",
  });

  return formatter.format(new Date(`${date}T00:00:00Z`));
}
