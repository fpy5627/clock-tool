import FAQ from "@/components/blocks/faq";
import { getLandingPage } from "@/services/page";
import { Metadata } from "next";
import { getCanonicalUrl, getHreflangLanguages } from "@/lib/metadata";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  
  const pagePath = '/faq';
  return {
    alternates: {
      canonical: getCanonicalUrl(pagePath, locale),
      languages: getHreflangLanguages(pagePath),
    },
  };
}

export default async function FAQPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const page = await getLandingPage(locale);

  return <>{page.faq && <FAQ section={page.faq} />}</>;
}

