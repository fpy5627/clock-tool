import { useRef, useCallback } from 'react';

/**
 * useNotificationSound Hook
 * 
 * 用于管理通知声音播放的通用逻辑。
 * 提供停止声音播放的功能，避免重复播放。
 * 支持AudioContext和HTMLAudioElement两种播放方式。
 * 
 * @returns 返回停止声音播放的函数和相关引用
 */
export const useNotificationSound = () => {
  /** 音频上下文引用，用于控制当前播放的声音 */
  const notificationAudioCtxRef = useRef<AudioContext | null>(null);
  /** 停止超时引用，用于自动停止声音播放 */
  const notificationStopTimeoutRef = useRef<number | null>(null);
  /** HTML音频元素引用，用于播放音频文件 */
  const notificationAudioElementRef = useRef<HTMLAudioElement | null>(null);
  /** 音频循环间隔引用，用于循环播放 */
  const notificationAudioLoopIntervalRef = useRef<number | null>(null);

  /**
   * 停止通知声音播放
   * 
   * 清除停止超时、关闭音频上下文、停止音频元素播放，
   * 并移除所有带有 data-sound-id 的音频元素。
   */
  const stopNotificationSound = useCallback(() => {
    // 清除停止超时
    if (notificationStopTimeoutRef.current) {
      window.clearTimeout(notificationStopTimeoutRef.current);
      notificationStopTimeoutRef.current = null;
    }
    
    // 清除循环间隔
    if (notificationAudioLoopIntervalRef.current) {
      window.clearInterval(notificationAudioLoopIntervalRef.current);
      notificationAudioLoopIntervalRef.current = null;
    }
    
    // 停止并重置音频元素
    if (notificationAudioElementRef.current) {
      try {
        notificationAudioElementRef.current.pause();
        notificationAudioElementRef.current.currentTime = 0;
        notificationAudioElementRef.current = null;
      } catch {}
    }
    
    // 停止所有带有 data-sound-id 的音频元素
    if (typeof window !== 'undefined') {
      const allAudioElements = document.querySelectorAll('audio[data-sound-id]') as NodeListOf<HTMLAudioElement>;
      allAudioElements.forEach((audio) => {
        audio.pause();
        audio.currentTime = 0;
        audio.remove();
      });
    }
    
    // 关闭音频上下文
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
    /** HTML音频元素引用，用于外部控制 */
    notificationAudioElementRef,
    /** 音频循环间隔引用，用于外部控制 */
    notificationAudioLoopIntervalRef,
  };
};

