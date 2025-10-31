import { Metadata } from 'next';
import CountdownPage from '../countdown/page';

export const metadata: Metadata = {
  title: '8 Hour Timer - Online Countdown Timer',
  description: 'Free online 8 hour timer. Simple and easy-to-use countdown timer for 8 hours with alarm sound.',
};

// 这个页面使用相同的倒计时组件，但URL更SEO友好
export default CountdownPage;

