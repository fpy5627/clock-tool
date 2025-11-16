"use client";

import { GoogleAnalytics as NextGoogleAnalytics } from "@next/third-parties/google";
import { useEffect, useState } from "react";

export default function GoogleAnalytics() {
  const [shouldLoad, setShouldLoad] = useState(false);

  useEffect(() => {
    // 延迟加载：等待用户交互或页面完全加载后
    let timer: NodeJS.Timeout;
    
    // 监听用户交互事件
    const handleInteraction = () => {
      setShouldLoad(true);
      if (timer) clearTimeout(timer);
    };

    // 监听首次用户交互
    const events = ['click', 'scroll', 'keydown', 'touchstart'];
    events.forEach(event => {
      window.addEventListener(event, handleInteraction, { once: true, passive: true });
    });

    // 备用：如果用户没有交互，在页面加载后3秒加载
    timer = setTimeout(() => {
      setShouldLoad(true);
    }, 3000);

    return () => {
      if (timer) clearTimeout(timer);
      events.forEach(event => {
        window.removeEventListener(event, handleInteraction);
      });
    };
  }, []);

  if (process.env.NODE_ENV !== "production") {
    return null;
  }

  const analyticsId = process.env.NEXT_PUBLIC_GOOGLE_ANALYTICS_ID;
  if (!analyticsId || !shouldLoad) {
    return null;
  }

  return <NextGoogleAnalytics gaId={analyticsId} />;
}
