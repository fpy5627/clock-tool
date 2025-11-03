import { getTranslations } from "next-intl/server";
import Markdown from "@/components/markdown";
import { Metadata } from "next";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations("legal.terms_of_service");
  
  const webUrl = process.env.NEXT_PUBLIC_WEB_URL || "";
  let canonicalUrl = `${webUrl}/terms-of-service`;
  if (locale !== "en") {
    canonicalUrl = `${webUrl}/${locale}/terms-of-service`;
  }
  
  return {
    title: t("title"),
    description: t("description"),
    alternates: {
      canonical: canonicalUrl,
    },
  };
}

export default async function TermsOfServicePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations("legal.terms_of_service");
  const content = t("content");

  return <Markdown content={content} />;
}

