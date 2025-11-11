import "@/app/globals.css";

import Footer from "@/components/blocks/footer";
import Header from "@/components/blocks/header";
import { Metadata } from "next";
import React from "react";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { getLandingPage } from "@/services/page";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations();
  const webUrl = process.env.NEXT_PUBLIC_WEB_URL || "";

  // 构建页面URL
  const pageUrl = locale === "en" 
    ? webUrl
    : `${webUrl}/${locale}`;

  const title = t("metadata.title") || "";
  const description = t("metadata.description") || "";

  return {
    title: {
      template: `%s | ${title}`,
      default: title,
    },
    description: description,
    keywords: t("metadata.keywords") || "",
    alternates: {
      canonical: pageUrl,
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-video-preview": -1,
        "max-image-preview": "large",
        "max-snippet": -1,
      },
    },
    openGraph: {
      title: title,
      description: description,
      url: pageUrl,
      siteName: "Timero",
      locale: locale,
      type: "website",
      images: [
        {
          url: `${webUrl}/og-image.png`,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: title,
      description: description,
      images: [`${webUrl}/og-image.png`],
    },
  };
}

export default async function LegalLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const page = await getLandingPage(locale);

  return (
    <>
      {page.header && <Header header={page.header} />}
      <main className="overflow-x-hidden">
        <div className="text-md max-w-3xl mx-auto leading-loose pt-4 pb-8 px-8 prose prose-slate dark:prose-invert prose-headings:font-semibold prose-a:text-primary hover:prose-a:text-primary/80 prose-strong:text-base-content prose-code:text-base-content prose-code:bg-muted prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded-md">
          {children}
        </div>
      </main>
      {page.footer && <Footer footer={page.footer} />}
    </>
  );
}
