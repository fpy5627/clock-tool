'use client';

import { useEffect, useRef } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import NProgress from 'nprogress';

// 配置 NProgress
NProgress.configure({
  showSpinner: false,
  trickleSpeed: 200,
  minimum: 0.08,
  easing: 'ease',
  speed: 500,
});

export function ProgressBar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const prevPathnameRef = useRef<string | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // 如果是首次加载，不显示进度条
    if (prevPathnameRef.current === null) {
      prevPathnameRef.current = pathname;
      return;
    }

    // 如果路径发生变化，启动进度条
    if (prevPathnameRef.current !== pathname) {
      // 清除之前的定时器
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }

      NProgress.start();
      prevPathnameRef.current = pathname;

      // 使用 requestAnimationFrame 确保在下一个渲染周期完成进度条
      // 给页面一些时间来渲染新内容
      const rafId1 = requestAnimationFrame(() => {
        const rafId2 = requestAnimationFrame(() => {
          timerRef.current = setTimeout(() => {
            NProgress.done();
          }, 200);
        });
      });

      return () => {
        cancelAnimationFrame(rafId1);
        if (timerRef.current) {
          clearTimeout(timerRef.current);
        }
        NProgress.done();
      };
    }
  }, [pathname, searchParams]);

  // 组件卸载时清理
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
      NProgress.done();
    };
  }, []);

  return null;
}

