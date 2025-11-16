import { getTranslations } from "next-intl/server";
import Markdown from "@/components/markdown";
import { Metadata } from "next";
import { getCanonicalUrl, getHreflangLanguages } from "@/lib/metadata";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations("legal.privacy_policy");
  
  const pagePath = "/privacy-policy";
  const canonicalUrl = getCanonicalUrl(pagePath, locale);
  const languages = getHreflangLanguages(pagePath);
  
  return {
    title: t("title"),
    description: t("description"),
    alternates: {
      canonical: canonicalUrl,
      languages: languages,
    },
  };
}

export default async function PrivacyPolicyPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations("legal.privacy_policy");
  const content = t("content");

  return <Markdown content={content} />;
}

