/**
 * Generate canonical URL for a given path and locale
 * @param path - The path without locale prefix (e.g., '/countdown', '/posts/my-slug')
 * @param locale - The locale string (e.g., 'en', 'zh')
 * @returns The canonical URL
 */
export function getCanonicalUrl(path: string, locale: string): string {
  const webUrl = process.env.NEXT_PUBLIC_WEB_URL || "";
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  
  if (locale === "en") {
    return `${webUrl}${cleanPath}`;
  }
  
  return `${webUrl}/${locale}${cleanPath}`;
}

