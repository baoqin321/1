import { notFound } from "next/navigation";
import ContactMethods, { type ContactMethod } from "@/components/ContactMethods";
import { getCopy, isLocale, locales } from "@/lib/i18n";
import type { Locale } from "@/lib/types";

export const dynamicParams = false;

export function generateStaticParams() {
  return locales.map((lang) => ({ lang }));
}

type ContactPageProps = {
  params: Promise<{ lang: string }>;
};

const contactItems: Record<Locale, ReadonlyArray<ContactMethod>> = {
  zh: [
    {
      channel: "wechat",
      label: "\u5fae\u4fe1\u53f7",
      value: "wxid_anw9rxa3jx422",
    },
    {
      channel: "qq",
      label: "QQ\u53f7",
      value: "3630154109",
    },
    {
      channel: "email",
      label: "QQ\u90ae\u7bb1",
      value: "3630154109@qq.com",
    },
  ],
  en: [
    {
      channel: "wechat",
      label: "WeChat",
      value: "wxid_anw9rxa3jx422",
    },
    {
      channel: "qq",
      label: "QQ",
      value: "3630154109",
    },
    {
      channel: "email",
      label: "QQ Email",
      value: "3630154109@qq.com",
    },
  ],
};

export default async function ContactPage({ params }: ContactPageProps) {
  const { lang } = await params;

  if (!isLocale(lang)) {
    notFound();
  }

  const locale = lang as Locale;
  const copy = getCopy(locale);

  return (
    <section className="fade-up space-y-7">
      <header className="contact-showcase">
        <p className="eyebrow">{copy.contactEyebrow}</p>
        <h1 className="mt-4 text-[2.65rem] leading-[0.98] font-semibold tracking-[-0.05em] text-ink sm:text-[3.4rem]">
          {copy.contactTitle}
        </h1>
      </header>

      <div className="contact-compact-shell">
        <ContactMethods locale={locale} methods={contactItems[locale]} />
      </div>
    </section>
  );
}
