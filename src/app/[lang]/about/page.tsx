import { notFound } from "next/navigation";
import AboutIdentityCards from "@/components/AboutIdentityCards";
import AboutRightCards from "@/components/AboutRightCards";
import AnimatedProfilePortrait from "@/components/AnimatedProfilePortrait";
import FavoritePeopleFan from "@/components/FavoritePeopleFan";
import ImpactBooksShelf from "@/components/ImpactBooksShelf";
import { isLocale, locales } from "@/lib/i18n";
import type { Locale } from "@/lib/types";

export const dynamicParams = false;

export function generateStaticParams() {
  return locales.map((lang) => ({ lang }));
}

type AboutPageProps = {
  params: Promise<{ lang: string }>;
};

export default async function AboutPage({ params }: AboutPageProps) {
  const { lang } = await params;

  if (!isLocale(lang)) {
    notFound();
  }

  const locale = lang as Locale;

  return (
    <section className="fade-up -mt-10 space-y-9 pt-0 sm:-mt-14 sm:space-y-11 sm:pt-0 lg:-mt-16">
      <div className="mx-auto w-full max-w-[74rem]">
        <div className="flex flex-col gap-6 lg:relative lg:min-h-[27rem] lg:gap-0">
          <div className="order-1 mx-auto w-full max-w-[16.2rem] sm:max-w-[18rem]">
            <div className="profile-frame-shell rounded-[0.95rem] p-[0.62rem]">
              <div className="profile-frame-inner rounded-[0.72rem]">
                <AnimatedProfilePortrait />
              </div>
            </div>
          </div>

          <div className="order-2 lg:absolute lg:left-0 lg:top-0 lg:w-full lg:max-w-[22.5rem]">
            <AboutIdentityCards />
          </div>

          <div className="order-3 lg:absolute lg:right-0 lg:top-0 lg:w-full lg:max-w-[25rem]">
            <AboutRightCards />
          </div>
        </div>
      </div>

      <div className="-mt-[1.4cm]">
        <FavoritePeopleFan />
      </div>

      <div className="about-section-divider-wrap" aria-hidden="true">
        <div className="about-section-divider" />
      </div>

      <ImpactBooksShelf lang={locale} />
    </section>
  );
}
