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
    title: '30 Second Timer - Online Countdown Timer',
    description: 'Free online 30 second timer. Simple and easy-to-use countdown timer for 30 seconds with alarm sound.',
    alternates: {
      canonical: getCanonicalUrl('/30-second-timer', locale),
    },
  };
}

// 这个页面使用相同的倒计时组件，但URL更SEO友好
export default CountdownPage;

