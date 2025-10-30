import { Metadata } from 'next';
import CountdownPage from '../countdown/page';

export const metadata: Metadata = {
  title: '40 Minute Timer - Online Countdown Timer',
  description: 'Free online 40 minute timer. Simple and easy-to-use countdown timer for 40 minutes with alarm sound.',
};

// 这个页面使用相同的倒计时组件，但URL更SEO友好
export default CountdownPage;

