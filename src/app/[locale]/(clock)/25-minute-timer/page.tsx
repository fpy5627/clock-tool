import { Metadata } from 'next';
import CountdownPage from '../countdown/page';
import { getCanonicalUrl } from '@/lib/metadata';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  
  return {
    title: '25 Minute Timer - Pomodoro Timer Online',
    description: 'Free online 25 minute timer. Perfect for Pomodoro technique. Simple countdown timer for 25 minutes with alarm sound.',
    alternates: {
      canonical: getCanonicalUrl('/25-minute-timer', locale),
    },
  };
}

// 这个页面使用相同的倒计时组件，但URL更SEO友好（番茄钟专用）
export default CountdownPage;

