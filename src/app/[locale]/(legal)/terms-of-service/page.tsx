import { getTranslations } from "next-intl/server";
import Markdown from "@/components/markdown";
import { Metadata } from "next";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const t = await getTranslations("legal.terms_of_service");
  
  return {
    title: t("title"),
    description: t("description"),
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

