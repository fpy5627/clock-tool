import { getTranslations } from "next-intl/server";
import Markdown from "@/components/markdown";
import { Metadata } from "next";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations("legal.privacy_policy");
  
  const webUrl = process.env.NEXT_PUBLIC_WEB_URL || "";
  let canonicalUrl = `${webUrl}/privacy-policy`;
  if (locale !== "en") {
    canonicalUrl = `${webUrl}/${locale}/privacy-policy`;
  }
  
  return {
    title: t("title"),
    description: t("description"),
    alternates: {
      canonical: canonicalUrl,
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

