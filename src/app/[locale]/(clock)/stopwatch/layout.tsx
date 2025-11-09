import { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { setRequestLocale } from "next-intl/server";

/**
 * 生成秒表页面的元数据
 * 包括SEO优化和社交媒体标签
 * @param params - 包含locale参数的对象
 * @returns 返回包含title、description和社交媒体标签的Metadata对象
 */
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
    ? `${webUrl}/stopwatch`
    : `${webUrl}/${locale}/stopwatch`;

  // 获取翻译文本
  const title = t("clock.modes.stopwatch") || "Stopwatch";
  const description = t("metadata.description") || "Free online stopwatch with lap timer. Track time accurately for workouts, sports, and activities.";

  return {
    title: `${title} - Timero`,
    description: description,
    alternates: {
      canonical: pageUrl,
    },
    openGraph: {
      title: `${title} - Timero`,
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
      title: `${title} - Timero`,
      description: description,
      images: [`${webUrl}/og-image.png`],
    },
  };
}

/**
 * 秒表页面的布局组件
 * @param children - 子组件
 * @param params - 包含locale参数的对象
 * @returns 返回布局组件
 */
export default async function StopwatchLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  return <>{children}</>;
}

