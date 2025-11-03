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
    title: '20 Minute Timer - Online Countdown Timer',
    description: 'Free online 20 minute timer. Simple and easy-to-use countdown timer for 20 minutes with alarm sound.',
    alternates: {
      canonical: getCanonicalUrl('/20-minute-timer', locale),
    },
  };
}

// 这个页面使用相同的倒计时组件，但URL更SEO友好
export default CountdownPage;

