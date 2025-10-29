import { Metadata } from 'next';
import CountdownPage from '../countdown/page';

export const metadata: Metadata = {
  title: '1 Minute Timer - Online Countdown Timer',
  description: 'Free online 1 minute timer. Simple and easy-to-use countdown timer for 1 minute with alarm sound.',
};

// 这个页面使用相同的倒计时组件，但URL更SEO友好
export default CountdownPage;

