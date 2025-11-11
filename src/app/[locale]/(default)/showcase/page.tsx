import Showcase from "@/components/blocks/showcase";
import { getShowcasePage } from "@/services/page";
import { Metadata } from "next";
import { getCanonicalUrl, getHreflangLanguages } from "@/lib/metadata";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  
  const pagePath = '/showcase';
  return {
    alternates: {
      canonical: getCanonicalUrl(pagePath, locale),
      languages: getHreflangLanguages(pagePath),
    },
  };
}

export default async function ShowcasePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const page = await getShowcasePage(locale);

  return <>{page.showcase && <Showcase section={page.showcase} />}</>;
}
