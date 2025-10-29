import { Metadata } from 'next';
import CountdownPage from '../countdown/page';

export const metadata: Metadata = {
  title: '15 Minute Timer - Online Countdown Timer',
  description: 'Free online 15 minute timer. Simple and easy-to-use countdown timer for 15 minutes with alarm sound.',
};

// 这个页面使用相同的倒计时组件，但URL更SEO友好
export default CountdownPage;

