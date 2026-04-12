import { redirect } from "next/navigation";
import { isLocale, locales } from "@/lib/i18n";

export const dynamicParams = false;

export function generateStaticParams() {
  return locales.map((lang) => ({ lang }));
}

type LangPageProps = {
  params: Promise<{ lang: string }>;
};

export default async function LangRootPage({ params }: LangPageProps) {
  const { lang } = await params;

  if (!isLocale(lang)) {
    redirect("/zh/about");
  }

  redirect(`/${lang}/about`);
}
