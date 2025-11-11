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

/**
 * Convert timer route path to translation key
 * @param path - The timer route path (e.g., '10-second-timer', '25-minute-timer')
 * @returns The translation key (e.g., '10_second_timer', '25_minute_timer')
 */
export function getTimerTranslationKey(path: string): string {
  // Remove leading slash if present
  const cleanPath = path.replace(/^\//, '');
  // Replace hyphens with underscores
  return cleanPath.replace(/-/g, '_');
}

