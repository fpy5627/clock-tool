import { Metadata } from 'next';
import CountdownPage from '../countdown/page';

export const metadata: Metadata = {
  title: '25 Minute Timer - Pomodoro Timer Online',
  description: 'Free online 25 minute timer. Perfect for Pomodoro technique. Simple countdown timer for 25 minutes with alarm sound.',
};

// 这个页面使用相同的倒计时组件，但URL更SEO友好（番茄钟专用）
export default CountdownPage;

