import { Metadata } from 'next';
import CountdownPage from '../countdown/page';
import { getCanonicalUrl, getTimerTranslationKey } from '@/lib/metadata';
import { getTranslations } from 'next-intl/server';
import { setRequestLocale } from 'next-intl/server';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  setRequestLocale(locale);
  
  const t = await getTranslations();
  const translationKey = getTimerTranslationKey('40-minute-timer');
  
  return {
    title: t(`clock.page_description.timer_pages.${translationKey}.title`),
    description: t(`clock.page_description.timer_pages.${translationKey}.description`),
    alternates: {
      canonical: getCanonicalUrl('/40-minute-timer', locale),
    },
  };
}

// 这个页面使用相同的倒计时组件，但URL更SEO友好
export default CountdownPage;

