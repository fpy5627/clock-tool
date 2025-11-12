import { MetadataRoute } from "next";

/**
 * 生成 robots.txt 文件
 * 
 * 此函数返回标准的 robots.txt 配置，允许所有搜索引擎抓取所有页面。
 * 使用 Next.js MetadataRoute 确保生成符合标准的 robots.txt 文件。
 * 
 * @returns {MetadataRoute.Robots} robots.txt 配置对象
 */
export default function robots(): MetadataRoute.Robots {
  // Ensure we never use localhost in robots.txt
  let webUrl = process.env.NEXT_PUBLIC_WEB_URL || "https://clock.toolina.com";
  if (webUrl.includes("localhost") || webUrl.includes("127.0.0.1")) {
    webUrl = "https://clock.toolina.com";
  }

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
      },
    ],
    sitemap: `${webUrl}/sitemap.xml`,
  };
}

