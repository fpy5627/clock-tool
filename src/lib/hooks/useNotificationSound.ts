import { useRef, useCallback } from 'react';

/**
 * useNotificationSound Hook
 * 
 * 用于管理通知声音播放的通用逻辑。
 * 提供停止声音播放的功能，避免重复播放。
 * 
 * @returns 返回停止声音播放的函数
 */
export const useNotificationSound = () => {
  /** 音频上下文引用，用于控制当前播放的声音 */
  const notificationAudioCtxRef = useRef<AudioContext | null>(null);
  /** 停止超时引用，用于自动停止声音播放 */
  const notificationStopTimeoutRef = useRef<number | null>(null);

  /**
   * 停止通知声音播放
   * 
   * 清除停止超时并关闭音频上下文，确保当前播放的声音被停止。
   */
  const stopNotificationSound = useCallback(() => {
    if (notificationStopTimeoutRef.current) {
      window.clearTimeout(notificationStopTimeoutRef.current);
      notificationStopTimeoutRef.current = null;
    }
    if (notificationAudioCtxRef.current) {
      try {
        notificationAudioCtxRef.current.close();
      } catch {}
      notificationAudioCtxRef.current = null;
    }
  }, []);

  return {
    /** 停止通知声音的函数 */
    stopNotificationSound,
    /** 音频上下文引用，用于外部控制 */
    notificationAudioCtxRef,
    /** 停止超时引用，用于外部控制 */
    notificationStopTimeoutRef,
  };
};

