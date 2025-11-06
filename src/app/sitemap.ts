import { MetadataRoute } from "next";
import { locales, defaultLocale } from "@/i18n/locale";
import { getPostsByLocale } from "@/models/post";
import { getCanonicalUrl } from "@/lib/metadata";

// 静态路由列表（不包含locale前缀的路径）
const staticRoutes = [
  "", // 首页
  "/countdown",
  "/stopwatch",
  "/alarm",
  "/world-clock",
  "/pricing",
  "/faq",
  "/showcase",
  "/posts",
  "/terms-of-service",
  "/privacy-policy",
];

// Timer页面路由
const timerRoutes = [
  "/1-minute-timer",
  "/2-minute-timer",
  "/3-minute-timer",
  "/5-minute-timer",
  "/10-minute-timer",
  "/15-minute-timer",
  "/20-minute-timer",
  "/25-minute-timer",
  "/30-minute-timer",
  "/30-second-timer",
  "/40-minute-timer",
  "/45-minute-timer",
  "/45-second-timer",
  "/60-second-timer",
  "/60-minute-timer",
  "/90-second-timer",
  "/2-hour-timer",
  "/4-hour-timer",
  "/8-hour-timer",
  "/12-hour-timer",
  "/16-hour-timer",
];

async function getDocsPages(): Promise<Array<{ slug: string[]; locale: string }>> {
  try {
    // 尝试动态导入source，避免构建时错误
    const { source } = await import("@/lib/source");
    const params = source.generateParams("slug", "locale");
    return params;
  } catch (error) {
    // 如果source不可用，返回空数组
    console.warn("Failed to generate docs pages for sitemap:", error);
    return [];
  }
}

async function getBlogPosts(): Promise<Array<{ slug: string; locale: string; updated_at?: Date }>> {
  const posts: Array<{ slug: string; locale: string; updated_at?: Date }> = [];
  
  try {
    for (const locale of locales) {
      const localePosts = await getPostsByLocale(locale, 1, 1000); // 获取所有文章
      if (localePosts) {
        for (const post of localePosts) {
          if (post.slug && post.status === "online") {
            posts.push({
              slug: post.slug,
              locale: post.locale || locale,
              updated_at: (post.updated_at ?? post.created_at) ?? undefined,
            });
          }
        }
      }
    }
  } catch (error) {
    console.warn("Failed to generate blog posts for sitemap:", error);
  }
  
  return posts;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const webUrl = process.env.NEXT_PUBLIC_WEB_URL || "https://timero.ai";
  const now = new Date();
  const sitemapEntries: MetadataRoute.Sitemap = [];

  // 生成静态路由的sitemap条目
  for (const locale of locales) {
    for (const route of staticRoutes) {
      const path = route === "" ? "/" : route;
      const url = getCanonicalUrl(path, locale);
      
      sitemapEntries.push({
        url,
        lastModified: now,
        changeFrequency: route === "" ? "daily" : "weekly",
        priority: route === "" ? 1.0 : 0.8,
      });
    }

    // 生成Timer页面的sitemap条目
    for (const timerRoute of timerRoutes) {
      const url = getCanonicalUrl(timerRoute, locale);
      
      sitemapEntries.push({
        url,
        lastModified: now,
        changeFrequency: "monthly",
        priority: 0.7,
      });
    }
  }

  // 生成博客文章的sitemap条目
  const blogPosts = await getBlogPosts();
  for (const post of blogPosts) {
    const path = `/posts/${post.slug}`;
    const url = getCanonicalUrl(path, post.locale);
    
    sitemapEntries.push({
      url,
      lastModified: post.updated_at || now,
      changeFrequency: "monthly",
      priority: 0.6,
    });
  }

  // 生成文档页面的sitemap条目
  const docsPages = await getDocsPages();
  for (const docPage of docsPages) {
    const slugPath = docPage.slug && docPage.slug.length > 0 
      ? `/${docPage.slug.join("/")}` 
      : "";
    const path = `/docs${slugPath}`;
    const url = getCanonicalUrl(path, docPage.locale || defaultLocale);
    
    sitemapEntries.push({
      url,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.5,
    });
  }

  return sitemapEntries;
}

