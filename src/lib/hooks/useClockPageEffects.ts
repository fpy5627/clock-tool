import { useEffect, useRef, useState } from 'react';

/**
 * useClockPageEffects Hook 的参数接口
 */
export interface UseClockPageEffectsParams {
  /** 是否处于全屏模式 */
  isFullscreen: boolean;
  /** 进入全屏的函数 */
  enterFullscreen: () => Promise<void>;
  /** 是否显示控制按钮 */
  showControls: boolean;
  /** 设置显示控制按钮的函数 */
  setShowControls: (show: boolean) => void;
  /** 是否已挂载（用于日期更新） */
  mounted?: boolean;
  /** 设置已挂载状态的函数 */
  setMounted?: (mounted: boolean) => void;
  /** 当前日期 */
  currentDate: Date;
  /** 设置当前日期的函数 */
  setCurrentDate: (date: Date) => void;
}

/**
 * useClockPageEffects Hook
 * 
 * 提取时钟页面中公共的 useEffect 逻辑，包括：
 * - 全屏自动进入检查（从其他页面跳转过来时）
 * - 鼠标移动和触摸显示控制按钮（仅在全屏模式下自动隐藏）
 * - 日期更新
 * 
 * @param params - Hook 参数
 * @returns 返回控制按钮悬停状态的 ref
 */
export function useClockPageEffects({
  isFullscreen,
  enterFullscreen,
  showControls,
  setShowControls,
  mounted,
  setMounted,
  currentDate,
  setCurrentDate,
}: UseClockPageEffectsParams) {
  const hideControlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isHoveringControls = useRef(false);

  // 检查是否需要自动进入全屏（从其他页面跳转过来时）
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const shouldEnterFullscreen = sessionStorage.getItem('shouldEnterFullscreen') === 'true';
      if (shouldEnterFullscreen) {
        // 清除标记，避免重复进入
        sessionStorage.removeItem('shouldEnterFullscreen');
        
        // 延迟执行以确保页面完全加载
        const timer = setTimeout(async () => {
          await enterFullscreen();
        }, 100);
        
        return () => {
          clearTimeout(timer);
        };
      }
    }
  }, [enterFullscreen]);

  // 鼠标移动和触摸显示控制按钮（仅在全屏模式下自动隐藏）
  useEffect(() => {
    const handleInteraction = () => {
      setShowControls(true);
      
      // 清除之前的定时器
      if (hideControlsTimeoutRef.current) {
        clearTimeout(hideControlsTimeoutRef.current);
      }
      
      // 只在全屏时，1.5秒后隐藏控制按钮
      if (isFullscreen) {
        hideControlsTimeoutRef.current = setTimeout(() => {
          if (!isHoveringControls.current) {
            setShowControls(false);
          }
        }, 1500);
      }
    };

    // 监听鼠标移动事件（桌面端）
    window.addEventListener('mousemove', handleInteraction);
    // 监听触摸事件（移动端）
    window.addEventListener('touchstart', handleInteraction);
    window.addEventListener('touchmove', handleInteraction);
    
    // 初始显示控制按钮
    handleInteraction();

    return () => {
      window.removeEventListener('mousemove', handleInteraction);
      window.removeEventListener('touchstart', handleInteraction);
      window.removeEventListener('touchmove', handleInteraction);
      if (hideControlsTimeoutRef.current) {
        clearTimeout(hideControlsTimeoutRef.current);
      }
    };
  }, [isFullscreen, setShowControls]);

  // 非全屏模式下始终显示控制按钮
  useEffect(() => {
    if (!isFullscreen) {
      setShowControls(true);
      if (hideControlsTimeoutRef.current) {
        clearTimeout(hideControlsTimeoutRef.current);
      }
    }
  }, [isFullscreen, setShowControls]);

  // 标记客户端已挂载
  useEffect(() => {
    if (setMounted) {
      setMounted(true);
    }
  }, [setMounted]);

  // 更新日期时间
  useEffect(() => {
    // 如果提供了 mounted 状态，则等待挂载后再更新
    if (mounted !== undefined && !mounted) {
      return;
    }
    
    // 客户端挂载后立即更新一次时间
    setCurrentDate(new Date());
    
    const dateInterval = setInterval(() => {
      setCurrentDate(new Date());
    }, 1000);

    return () => clearInterval(dateInterval);
  }, [mounted, setCurrentDate]);

  return {
    isHoveringControls,
    hideControlsTimeoutRef,
  };
}

