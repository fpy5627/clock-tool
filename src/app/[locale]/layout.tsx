import {
  getMessages,
  getTranslations,
  setRequestLocale,
} from "next-intl/server";
import { AppContextProvider } from "@/contexts/app";
import { Metadata } from "next";
import { NextAuthSessionProvider } from "@/auth/session";
import { NextIntlClientProvider } from "next-intl";
import { ThemeProvider } from "@/providers/theme";
import { Toaster } from "sonner";
import { StructuredData } from "@/components/structured-data";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { getCanonicalUrl, getHreflangLanguages } from "@/lib/metadata";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations();
  const webUrl = process.env.NEXT_PUBLIC_WEB_URL || "https://clock.toolina.com";

  // 构建页面URL（首页）
  const pagePath = "";
  const pageUrl = getCanonicalUrl(pagePath, locale);
  const languages = getHreflangLanguages(pagePath);

  // 使用根页面的 SEO 信息
  const title = t("metadata.title");
  const description = t("metadata.description");

  return {
    title: {
      template: `%s`,
      default: title,
    },
    description: description,
    keywords: t("metadata.keywords") || "",
    alternates: {
      canonical: pageUrl,
      languages: languages,
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

export default async function LocaleLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}>) {
  const { locale } = await params;
  setRequestLocale(locale);

  const messages = await getMessages();
  const webUrl = process.env.NEXT_PUBLIC_WEB_URL || "https://clock.toolina.com";

  return (
    <NextIntlClientProvider messages={messages}>
      <NextAuthSessionProvider>
        <AppContextProvider>
          <ThemeProvider>
            <ProgressBar />
            <StructuredData locale={locale} webUrl={webUrl} />
            {children}
            <Toaster 
              richColors 
              position="top-center" 
              expand={true}
              offset="80px"
              toastOptions={{
                style: {
                  fontSize: '16px',
                  padding: '16px 24px',
                  minWidth: '320px',
                },
                className: 'toast-custom',
              }}
            />
          </ThemeProvider>
        </AppContextProvider>
      </NextAuthSessionProvider>
    </NextIntlClientProvider>
  );
}
