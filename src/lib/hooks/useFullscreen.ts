import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * useFullscreen Hook
 * 
 * 管理全屏状态和全屏切换功能
 * 支持浏览器原生全屏API和模拟全屏模式
 * 
 * @returns 返回全屏状态和控制函数
 */
export const useFullscreen = () => {
  /** 全屏状态 */
  const [isFullscreen, setIsFullscreen] = useState(false);
  /** 用于跟踪是否正在处理全屏切换 */
  const isTogglingRef = useRef(false);

  /**
   * 处理全屏状态变化
   * 监听浏览器的全屏事件，同步本地状态
   */
  useEffect(() => {
    const handleFullscreenChange = () => {
      const isFullscreenActive = !!(
        document.fullscreenElement ||
        (document as any).webkitFullscreenElement ||
        (document as any).mozFullScreenElement ||
        (document as any).msFullscreenElement
      );
      setIsFullscreen(isFullscreenActive);

      // 如果退出全屏，移除body类名
      if (!isFullscreenActive && typeof window !== 'undefined') {
        document.body.classList.remove('fullscreen-active');
      }
    };

    // 监听各种全屏事件
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('mozfullscreenchange', handleFullscreenChange);
    document.addEventListener('MSFullscreenChange', handleFullscreenChange);

    // 初始化检查
    handleFullscreenChange();

    // 清理函数
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
      document.removeEventListener('MSFullscreenChange', handleFullscreenChange);
    };
  }, []);

  /**
   * 同步 isFullscreen 状态到 body 类名（用于隐藏 Header 和 Footer）
   */
  useEffect(() => {
    if (isFullscreen) {
      document.body.classList.add('fullscreen-active');
    } else {
      document.body.classList.remove('fullscreen-active');
    }
  }, [isFullscreen]);

  /**
   * 进入全屏
   * 
   * 尝试使用浏览器原生全屏API，如果失败则使用模拟全屏
   */
  const enterFullscreen = useCallback(async () => {
    if (isTogglingRef.current) return;
    isTogglingRef.current = true;

    try {
      const element = document.documentElement;
      if (element.requestFullscreen) {
        await element.requestFullscreen();
        setIsFullscreen(true);
      } else if ((element as any).webkitRequestFullscreen) {
        await (element as any).webkitRequestFullscreen();
        setIsFullscreen(true);
      } else if ((element as any).mozRequestFullScreen) {
        await (element as any).mozRequestFullScreen();
        setIsFullscreen(true);
      } else if ((element as any).msRequestFullscreen) {
        await (element as any).msRequestFullscreen();
        setIsFullscreen(true);
      } else {
        // 如果不支持全屏API，使用模拟全屏
        setIsFullscreen(true);
      }
    } catch (error) {
      console.error('Failed to enter fullscreen:', error);
      // 即使失败也尝试使用模拟全屏
      setIsFullscreen(true);
    } finally {
      isTogglingRef.current = false;
    }
  }, []);

  /**
   * 退出全屏
   * 
   * 尝试使用浏览器原生全屏API退出，如果失败则直接更新状态
   */
  const exitFullscreen = useCallback(async () => {
    if (isTogglingRef.current) return;
    isTogglingRef.current = true;

    try {
      if (document.exitFullscreen) {
        await document.exitFullscreen();
      } else if ((document as any).webkitExitFullscreen) {
        await (document as any).webkitExitFullscreen();
      } else if ((document as any).mozCancelFullScreen) {
        await (document as any).mozCancelFullScreen();
      } else if ((document as any).msExitFullscreen) {
        await (document as any).msExitFullscreen();
      }
      setIsFullscreen(false);
    } catch (error) {
      console.error('Failed to exit fullscreen:', error);
      setIsFullscreen(false);
    } finally {
      isTogglingRef.current = false;
    }
  }, []);

  /**
   * 切换全屏状态
   */
  const toggleFullscreen = useCallback(async () => {
    if (isFullscreen) {
      await exitFullscreen();
    } else {
      await enterFullscreen();
    }
  }, [isFullscreen, enterFullscreen, exitFullscreen]);

  return {
    /** 当前全屏状态 */
    isFullscreen,
    /** 进入全屏 */
    enterFullscreen,
    /** 退出全屏 */
    exitFullscreen,
    /** 切换全屏状态 */
    toggleFullscreen,
    /** 设置全屏状态（用于外部控制） */
    setIsFullscreen,
  };
};

