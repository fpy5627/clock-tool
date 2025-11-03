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
    title: '12 Hour Timer - Online Countdown Timer',
    description: 'Free online 12 hour timer. Simple and easy-to-use countdown timer for 12 hours with alarm sound.',
    alternates: {
      canonical: getCanonicalUrl('/12-hour-timer', locale),
    },
  };
}

// 这个页面使用相同的倒计时组件，但URL更SEO友好
export default CountdownPage;

