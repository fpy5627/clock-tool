"use client";

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, RotateCcw, Maximize, Volume2, VolumeX, Settings, X, Timer, Clock, Sun, Moon, Bell, BellOff, Cloud, CloudRain, CloudSnow, CloudDrizzle, Cloudy, AlarmClock, Globe, Menu } from 'lucide-react';
import { NotificationSoundSelector } from '@/components/ui/NotificationSoundSelector';
import { toast } from 'sonner';
import { useTranslations, useLocale } from 'next-intl';
import { useParams, usePathname, useRouter } from 'next/navigation';
import { localeNames } from '@/i18n/locale';
import { useTheme } from 'next-themes';
import { SOUND_OPTIONS, THEME_COLORS } from '@/lib/clock-constants';
import { notifySoundMetaList } from '@/lib/notify-sound';
import { compressAndResizeImage, addToImageHistory, removeFromImageHistory, analyzeImageBrightness, isLightColor } from '@/lib/image-utils';
import { useFullscreen } from '@/lib/hooks/useFullscreen';
import { useBackground } from '@/lib/hooks/useBackground';
import { useWeatherLocation } from '@/lib/hooks/useWeatherLocation';
import { useNotificationSound } from '@/lib/hooks/useNotificationSound';


export default function HomePage() {
  const t = useTranslations('clock');
  const locale = useLocale();
  const params = useParams();
  const router = useRouter();
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  
  // 固定模式为 stopwatch
  const mode = 'stopwatch';
  
  // 秒表相关
  const [stopwatchTime, setStopwatchTime] = useState(0); // 秒表时间（秒）
  
  // 使用自定义Hooks
  const { isFullscreen, toggleFullscreen, setIsFullscreen, enterFullscreen } = useFullscreen();
  const {
    backgroundType,
    backgroundColor,
    backgroundImage,
    imageOverlayOpacity,
    imagePositionX,
    imagePositionY,
    showBackgroundConfirm,
    pendingBackgroundImage,
    applyToAllPages,
    showColorBackgroundConfirm,
    pendingBackgroundColor,
    applyColorToAllPages,
    isSettingFromHistory,
    setBackgroundType,
    setBackgroundColor,
    setBackgroundImage,
    setImageOverlayOpacity,
    setImagePositionX,
    setImagePositionY,
    setShowBackgroundConfirm,
    setPendingBackgroundImage,
    setApplyToAllPages,
    setShowColorBackgroundConfirm,
    setPendingBackgroundColor,
    setApplyColorToAllPages,
    setIsSettingFromHistory,
  } = useBackground({ mode });
  const { weather, userLocation, setWeather, setUserLocation } = useWeatherLocation(locale);
  const { 
    stopNotificationSound, 
    notificationAudioCtxRef, 
    notificationStopTimeoutRef,
    notificationAudioElementRef,
    notificationAudioLoopIntervalRef
  } = useNotificationSound();
  
  // 通用状态
  const [isRunning, setIsRunning] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [showEditModal, setShowEditModal] = useState(false);
  const [customMinutes, setCustomMinutes] = useState(5);
  const [customSeconds, setCustomSeconds] = useState(0);
  const [showControls, setShowControls] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [showCardBorder, setShowCardBorder] = useState(true); // 控制大卡片边框显示（全屏模式下）
  
  // 新增功能状态
  const [selectedSound, setSelectedSound] = useState('night_sky');
  const [soundUsageStats, setSoundUsageStats] = useState<Record<string, number>>({});
  const [stopwatchColor, setStopwatchColor] = useState('blue'); // 秒表颜色
  const [notificationEnabled, setNotificationEnabled] = useState(false);
  const [showSettingsPanel, setShowSettingsPanel] = useState(false);
  const [progressVisible, setProgressVisible] = useState(true);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  
  // 主题颜色设置确认对话框
  const [showThemeColorConfirm, setShowThemeColorConfirm] = useState(false);
  const [pendingThemeColor, setPendingThemeColor] = useState<string | null>(null);
  
  // 上传图片历史记录
  const [uploadedImageHistory, setUploadedImageHistory] = useState<string[]>([]);
  
  // 跟踪用户是否手动设置了主题（用于覆盖自动主题设置）
  const [userManuallySetTheme, setUserManuallySetTheme] = useState(false);
  
  // 显示控制状态
  const [showWeatherIcon, setShowWeatherIcon] = useState(true);
  const [showTemperature, setShowTemperature] = useState(true);
  const [showDate, setShowDate] = useState(true);
  const [showWeekday, setShowWeekday] = useState(true);
  
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const hideControlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isHoveringControls = useRef(false);
  const lastToastRef = useRef<{ id: string; time: number } | null>(null);
  const lastClickRef = useRef<{ action: string; time: number } | null>(null);
  const colorInitializedRef = useRef(false); // 跟踪颜色是否已初始化
  const lastBackgroundColorRef = useRef<string>(''); // 跟踪上一次的背景颜色
  
  // 注意：通知音效控制已在 useNotificationSound hook 中处理

  // 添加上传图片到历史记录（使用工具函数）
  const handleAddToImageHistory = (imageDataUrl: string) => {
    const newHistory = addToImageHistory(imageDataUrl);
    setUploadedImageHistory(newHistory);
  };

  // 从历史记录中移除图片（使用工具函数）
  const handleRemoveFromImageHistory = (imageDataUrl: string) => {
    const newHistory = removeFromImageHistory(imageDataUrl);
    setUploadedImageHistory(newHistory);
  };

  // 注意：背景颜色变化自动切换主题的逻辑已在 useBackground hook 中处理

  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        // 秒表模式
        setStopwatchTime((prev) => prev + 1);
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isRunning, mode, soundEnabled, notificationEnabled]);

  // 注意：全屏监听和状态同步已在 useFullscreen hook 中处理
  
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
  }, [isFullscreen]);

  // 非全屏模式下始终显示控制按钮
  useEffect(() => {
    if (!isFullscreen) {
      setShowControls(true);
      if (hideControlsTimeoutRef.current) {
        clearTimeout(hideControlsTimeoutRef.current);
      }
    }
  }, [isFullscreen]);


  // 更新日期时间
  useEffect(() => {
    const dateInterval = setInterval(() => {
      setCurrentDate(new Date());
    }, 1000);

    return () => clearInterval(dateInterval);
  }, []);

  // 从 localStorage 加载设置
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedTheme = localStorage.getItem('timer-theme');
      const savedSound = localStorage.getItem('timer-sound');
      const savedColor = localStorage.getItem('timer-color');
      const savedNotification = localStorage.getItem('timer-notification');
      const savedProgress = localStorage.getItem('timer-progress');
      const savedShowWeatherIcon = localStorage.getItem('timer-show-weather-icon');
      const savedShowTemperature = localStorage.getItem('timer-show-temperature');
      const savedShowDate = localStorage.getItem('timer-show-date');
      const savedShowWeekday = localStorage.getItem('timer-show-weekday');
      
      // theme 由 next-themes 自动管理，无需手动加载
      if (savedSound) setSelectedSound(savedSound);
      // 加载独立的颜色设置
      const savedStopwatchColor = localStorage.getItem('timer-stopwatch-color');
      
      if (savedStopwatchColor) {
        setStopwatchColor(savedStopwatchColor);
      } else if (savedColor) {
        setStopwatchColor(savedColor); // 向后兼容旧版本
      }
      // 如果没有保存的颜色，使用默认值（在theme ready后会被初始化）
      
      // 注意：背景设置已在 useBackground hook 中自动加载
      
      if (savedNotification) setNotificationEnabled(savedNotification === 'true');
      if (savedProgress !== null) setProgressVisible(savedProgress === 'true');
      if (savedShowWeatherIcon !== null) setShowWeatherIcon(savedShowWeatherIcon === 'true');
      if (savedShowTemperature !== null) setShowTemperature(savedShowTemperature === 'true');
      if (savedShowDate !== null) setShowDate(savedShowDate === 'true');
      if (savedShowWeekday !== null) setShowWeekday(savedShowWeekday === 'true');
      
      // 加载上传图片历史记录
      const savedImageHistory = localStorage.getItem('timer-uploaded-image-history');
      if (savedImageHistory) {
        try {
          const history = JSON.parse(savedImageHistory);
          setUploadedImageHistory(Array.isArray(history) ? history : []);
        } catch (e) {
          console.error('Failed to parse saved image history');
          setUploadedImageHistory([]);
        }
      }
      
    }
  }, []);

  // 保存设置到 localStorage (背景相关设置已在 useBackground hook 中处理)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('timer-sound', selectedSound);
      localStorage.setItem('timer-stopwatch-color', stopwatchColor);
      localStorage.setItem('timer-notification', String(notificationEnabled));
      localStorage.setItem('timer-progress', String(progressVisible));
      localStorage.setItem('timer-show-weather-icon', String(showWeatherIcon));
      localStorage.setItem('timer-show-temperature', String(showTemperature));
      localStorage.setItem('timer-show-date', String(showDate));
      localStorage.setItem('timer-show-weekday', String(showWeekday));
    }
  }, [selectedSound, stopwatchColor, notificationEnabled, progressVisible, showWeatherIcon, showTemperature, showDate, showWeekday]);

  // 注意：背景相关的useEffect逻辑已在 useBackground hook 中处理

  // 注意：模式切换时重新加载背景的逻辑已在 useBackground hook 中处理

  // 初始化颜色：第一次打开时根据主题自动选择
  useEffect(() => {
    if (theme && !colorInitializedRef.current && typeof window !== 'undefined') {
      colorInitializedRef.current = true;
      
      const savedStopwatchColor = localStorage.getItem('timer-stopwatch-color');
      const savedColor = localStorage.getItem('timer-color'); // 旧版本兼容
      
      // 如果没有保存过颜色，根据主题设置默认颜色
      if (!savedStopwatchColor && !savedColor) {
        const defaultColor = theme === 'dark' ? 'white' : 'black';
        setStopwatchColor(defaultColor);
      }
    }
  }, [theme]);

  // 监听主题变化，自动切换被禁用的颜色
  useEffect(() => {
    if (theme && colorInitializedRef.current) {
      // 白天模式禁用白色，夜晚模式禁用黑色
      // 被禁用时：白天模式切换为黑色，夜晚模式切换为白色
      const isStopwatchColorDisabled = 
        (theme === 'light' && stopwatchColor === 'white') || 
        (theme === 'dark' && stopwatchColor === 'black');
      
      if (isStopwatchColorDisabled) {
        setStopwatchColor(theme === 'light' ? 'black' : 'white');
      }
    }
  }, [theme, stopwatchColor]);

  // 保存上次使用的时长（stopwatch模式不需要保存）
  // useEffect removed - not needed for stopwatch mode

  // 请求桌面通知权限
  useEffect(() => {
    if (typeof window !== 'undefined' && notificationEnabled && 'Notification' in window) {
      if (Notification.permission === 'default') {
        Notification.requestPermission();
      }
    }
  }, [notificationEnabled]);

  // 动态计算并设置倒计时宽度
  useEffect(() => {
    const updateTimerWidth = () => {
      // 使用 requestAnimationFrame 确保在渲染完成后测量
      requestAnimationFrame(() => {
        const timerElement = document.getElementById('timer-display');
        if (timerElement) {
          const width = timerElement.offsetWidth;
          document.documentElement.style.setProperty('--timer-width', `${width}px`);
        }
      });
    };

    // 初始设置（延迟一帧确保DOM已渲染）
    updateTimerWidth();

    // 监听窗口大小变化
    window.addEventListener('resize', updateTimerWidth);
    
    // 使用 MutationObserver 监听倒计时数字变化
    const timerElement = document.getElementById('timer-display');
    let observer: MutationObserver | null = null;
    
    if (timerElement) {
      observer = new MutationObserver(updateTimerWidth);
      observer.observe(timerElement, { 
        childList: true, 
        subtree: true, 
        characterData: true 
      });
    }

    return () => {
      window.removeEventListener('resize', updateTimerWidth);
      if (observer) observer.disconnect();
    };
  }, [stopwatchTime, isFullscreen]);

  // 注意：天气和位置数据获取已在 useWeatherLocation hook 中处理

  // 监听weather状态变化，用于调试
  useEffect(() => {
    console.log('Weather state changed:', weather);
  }, [weather]);

  // 全屏模式下鼠标移动检测 - 1.5秒后自动隐藏边框和小卡片
  // Removed - not needed for stopwatch mode

  // 防止重复显示toast的辅助函数
  const showToast = (type: 'success' | 'info', title: string, description: string, id: string) => {
    const now = Date.now();
    
    // 如果在500ms内显示了相同ID的toast，则忽略
    if (lastToastRef.current && lastToastRef.current.id === id && (now - lastToastRef.current.time) < 500) {
      return;
    }
    
    // 先关闭之前的toast（如果存在）
    toast.dismiss(id);
    
    // 更新最后一次toast的记录
    lastToastRef.current = { id, time: now };
    
    // 短暂延迟后显示新toast，确保之前的已关闭
    setTimeout(() => {
      if (type === 'success') {
        toast.success(title, {
          description,
          duration: 2000,
          id,
        });
      } else {
        toast.info(title, {
          description,
          duration: 2000,
          id,
        });
      }
    }, 10);
  };

  // 声音播放函数 - 优先播放实际文件，如果没有则使用Web Audio API生成
  const playNotificationSound = (soundType: string) => {
    try {
      // 先尝试播放实际文件
      const sound = notifySoundMetaList.find(s => s.id === soundType);
      if (sound && sound.path) {
        // 停止所有当前播放的音频（包括所有带有 data-sound-id 的音频元素）
        stopNotificationSound();
        const allAudioElements = document.querySelectorAll('audio[data-sound-id]') as NodeListOf<HTMLAudioElement>;
        allAudioElements.forEach((audio) => {
          audio.pause();
          audio.currentTime = 0;
        });
        
        // 创建新的音频元素并播放
        // 支持外部URL：如果path以http://或https://开头，直接使用；否则添加/前缀
        const audioPath = sound.path.startsWith('http://') || sound.path.startsWith('https://') 
          ? sound.path 
          : `/${sound.path}`;
        const audio = new Audio(audioPath);
        audio.setAttribute('data-sound-id', soundType);
        audio.volume = 0.8;
        audio.play().catch((error) => {
          console.warn('Failed to play sound file:', error);
        });
        return; // 成功播放文件，直接返回
      }
      
      // 如果没有文件路径，使用 WebAudio 合成（保留原有逻辑作为后备）
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      // 若已有在响，先停
      stopNotificationSound();
      const ctx = new AudioContext();
      notificationAudioCtxRef.current = ctx;
      const master = ctx.createGain();
      master.gain.value = 0.8;
      master.connect(ctx.destination);

      const mkBeep = (t: number, freq: number, type: OscillatorType = 'sine', dur = 0.15, gain = 0.7) => {
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        o.type = type;
        o.frequency.setValueAtTime(freq, t);
        g.gain.setValueAtTime(0.0001, t);
        g.gain.exponentialRampToValueAtTime(gain, t + 0.005);
        g.gain.exponentialRampToValueAtTime(0.0001, t + dur + 0.25);
        o.connect(g).connect(master);
        o.start(t);
        o.stop(t + dur + 0.3);
      };

      const total = 10; // 持续播放10秒
      const start = ctx.currentTime;
      
      // 连续响铃（不间断）函数
      const sustain = (freq: number, type: OscillatorType = 'sine', volume: number = 0.25) => {
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        o.type = type;
        o.frequency.setValueAtTime(freq, start);
        g.gain.setValueAtTime(0.001, start);
        g.gain.linearRampToValueAtTime(volume, start + 0.1);
        g.gain.setValueAtTime(volume, start + total - 0.2);
        g.gain.exponentialRampToValueAtTime(0.0001, start + total);
        o.connect(g).connect(master);
        o.start(start);
        o.stop(start + total + 0.05);
      };

      // 多频率合成铃声函数（用于更丰富的声音）
      const playMultiTone = (frequencies: number[], type: OscillatorType = 'sine', volume: number = 0.2) => {
        frequencies.forEach((freq, index) => {
          const delay = index * 0.1;
          const o = ctx.createOscillator();
          const g = ctx.createGain();
          o.type = type;
          o.frequency.setValueAtTime(freq, start + delay);
          g.gain.setValueAtTime(0.001, start + delay);
          g.gain.linearRampToValueAtTime(volume, start + delay + 0.1);
          g.gain.setValueAtTime(volume, start + total - 0.2 - delay);
          g.gain.exponentialRampToValueAtTime(0.0001, start + total - delay);
          o.connect(g).connect(master);
          o.start(start + delay);
          o.stop(start + total + 0.05 - delay);
        });
      };

      // 根据自然铃声生成对应的合成音乐
      switch (soundType) {
        // 平和之声 (Sounds of Peace)
        case 'night_sky': {
          // 夜空：深邃宁静的夜空氛围
          const deep1 = ctx.createOscillator();
          const deep1Gain = ctx.createGain();
          deep1.type = 'sine';
          deep1.frequency.setValueAtTime(165, start); // E3，深邃低音
          deep1Gain.gain.setValueAtTime(0.001, start);
          deep1Gain.gain.linearRampToValueAtTime(0.1, start + 1);
          deep1Gain.gain.setValueAtTime(0.1, start + total - 0.2);
          deep1Gain.gain.exponentialRampToValueAtTime(0.0001, start + total);
          deep1.connect(deep1Gain).connect(master);
          deep1.start(start);
          deep1.stop(start + total + 0.05);
          
          // 轻柔的高音层（模拟星光）
          for (let i = 0; i < 15; i++) {
            const starTime = start + i * 0.6;
            const star = ctx.createOscillator();
            const starGain = ctx.createGain();
            star.type = 'sine';
            star.frequency.setValueAtTime(440 + Math.sin(i) * 100, starTime);
            starGain.gain.setValueAtTime(0.001, starTime);
            starGain.gain.exponentialRampToValueAtTime(0.06, starTime + 0.2);
            starGain.gain.exponentialRampToValueAtTime(0.001, starTime + 0.8);
            star.connect(starGain).connect(master);
            star.start(starTime);
            star.stop(starTime + 1);
          }
          break;
        }
        case 'shining_stars': {
          // 闪耀的星：闪烁星光的温柔音调
          const star1 = ctx.createOscillator();
          const star1Gain = ctx.createGain();
          star1.type = 'sine';
          star1.frequency.setValueAtTime(440, start); // A4，星光音调
          star1Gain.gain.setValueAtTime(0.001, start);
          star1Gain.gain.linearRampToValueAtTime(0.08, start + 0.8);
          star1Gain.gain.setValueAtTime(0.08, start + total - 0.2);
          star1Gain.gain.exponentialRampToValueAtTime(0.0001, start + total);
          star1.connect(star1Gain).connect(master);
          star1.start(start);
          star1.stop(start + total + 0.05);
          
          // 闪烁的星光（高频闪烁）
          for (let i = 0; i < 12; i++) {
            const twinkleTime = start + i * 0.8;
            const twinkle = ctx.createOscillator();
            const twinkleGain = ctx.createGain();
            twinkle.type = 'triangle';
            twinkle.frequency.setValueAtTime(523 + Math.sin(i) * 55, twinkleTime); // C5附近，闪烁
            twinkleGain.gain.setValueAtTime(0.001, twinkleTime);
            twinkleGain.gain.exponentialRampToValueAtTime(0.1, twinkleTime + 0.15);
            twinkleGain.gain.exponentialRampToValueAtTime(0.001, twinkleTime + 0.6);
            twinkle.connect(twinkleGain).connect(master);
            twinkle.start(twinkleTime);
            twinkle.stop(twinkleTime + 0.7);
          }
          break;
        }
        case 'sunrise': {
          // 日出：温暖渐升的日出之光
          const rise1 = ctx.createOscillator();
          const rise1Gain = ctx.createGain();
          rise1.type = 'sine';
          rise1.frequency.setValueAtTime(220, start); // A3，逐渐升起的音调
          rise1Gain.gain.setValueAtTime(0.001, start);
          rise1Gain.gain.linearRampToValueAtTime(0.12, start + 1);
          rise1Gain.gain.setValueAtTime(0.12, start + total - 0.2);
          rise1Gain.gain.exponentialRampToValueAtTime(0.0001, start + total);
          rise1.connect(rise1Gain).connect(master);
          rise1.start(start);
          rise1.stop(start + total + 0.05);
          
          // 频率逐渐上升（模拟日出）
          const rise2 = ctx.createOscillator();
          const rise2Gain = ctx.createGain();
          rise2.type = 'triangle';
          rise2.frequency.setValueAtTime(330, start);
          rise2.frequency.linearRampToValueAtTime(440, start + total); // 逐渐升调
          rise2Gain.gain.setValueAtTime(0.001, start);
          rise2Gain.gain.linearRampToValueAtTime(0.1, start + 1.5);
          rise2Gain.gain.setValueAtTime(0.1, start + total - 0.2);
          rise2Gain.gain.exponentialRampToValueAtTime(0.0001, start + total);
          rise2.connect(rise2Gain).connect(master);
          rise2.start(start);
          rise2.stop(start + total + 0.05);
          
          // 温暖的音符（每2秒一个）
          const warmNotes = [392, 440, 494];
          for (let i = 0; i < 5; i++) {
            const warmTime = start + i * 2;
            const note = warmNotes[i % warmNotes.length];
            const warm = ctx.createOscillator();
            const warmGain = ctx.createGain();
            warm.type = 'sine';
            warm.frequency.setValueAtTime(note, warmTime);
            warmGain.gain.setValueAtTime(0.001, warmTime);
            warmGain.gain.exponentialRampToValueAtTime(0.15, warmTime + 0.2);
            warmGain.gain.exponentialRampToValueAtTime(0.001, warmTime + 1.2);
            warm.connect(warmGain).connect(master);
            warm.start(warmTime);
            warm.stop(warmTime + 1.3);
          }
          break;
        }
        case 'sunset': {
          // 日落：柔和温暖的日落余晖
          const set1 = ctx.createOscillator();
          const set1Gain = ctx.createGain();
          set1.type = 'sine';
          set1.frequency.setValueAtTime(330, start); // E4，温暖的低音
          set1Gain.gain.setValueAtTime(0.001, start);
          set1Gain.gain.linearRampToValueAtTime(0.1, start + 1);
          set1Gain.gain.setValueAtTime(0.1, start + total - 0.2);
          set1Gain.gain.exponentialRampToValueAtTime(0.0001, start + total);
          set1.connect(set1Gain).connect(master);
          set1.start(start);
          set1.stop(start + total + 0.05);
          
          // 频率逐渐下降（模拟日落）
          const set2 = ctx.createOscillator();
          const set2Gain = ctx.createGain();
          set2.type = 'triangle';
          set2.frequency.setValueAtTime(440, start);
          set2.frequency.linearRampToValueAtTime(330, start + total); // 逐渐降调
          set2Gain.gain.setValueAtTime(0.001, start);
          set2Gain.gain.linearRampToValueAtTime(0.08, start + 1.5);
          set2Gain.gain.setValueAtTime(0.08, start + total - 0.2);
          set2Gain.gain.exponentialRampToValueAtTime(0.0001, start + total);
          set2.connect(set2Gain).connect(master);
          set2.start(start);
          set2.stop(start + total + 0.05);
          
          // 柔和的音符（每2.5秒一个）
          const softNotes = [494, 440, 392];
          for (let i = 0; i < 4; i++) {
            const softTime = start + i * 2.5;
            const note = softNotes[i % softNotes.length];
            const soft = ctx.createOscillator();
            const softGain = ctx.createGain();
            soft.type = 'sine';
            soft.frequency.setValueAtTime(note, softTime);
            softGain.gain.setValueAtTime(0.001, softTime);
            softGain.gain.exponentialRampToValueAtTime(0.12, softTime + 0.3);
            softGain.gain.exponentialRampToValueAtTime(0.001, softTime + 1.5);
            soft.connect(softGain).connect(master);
            soft.start(softTime);
            soft.stop(softTime + 1.6);
          }
          break;
        }
        case 'meditation': {
          // 冥思：深度冥想的宁静之音
          const med1 = ctx.createOscillator();
          const med1Gain = ctx.createGain();
          med1.type = 'sine';
          med1.frequency.setValueAtTime(196, start); // G3
          med1Gain.gain.setValueAtTime(0.001, start);
          med1Gain.gain.linearRampToValueAtTime(0.09, start + 0.8);
          med1Gain.gain.setValueAtTime(0.09, start + total - 0.2);
          med1Gain.gain.exponentialRampToValueAtTime(0.0001, start + total);
          med1.connect(med1Gain).connect(master);
          med1.start(start);
          med1.stop(start + total + 0.05);
          
          const med2 = ctx.createOscillator();
          const med2Gain = ctx.createGain();
          med2.type = 'sine';
          med2.frequency.setValueAtTime(294, start); // D4，五度音程
          med2Gain.gain.setValueAtTime(0.001, start);
          med2Gain.gain.linearRampToValueAtTime(0.06, start + 1.2);
          med2Gain.gain.setValueAtTime(0.06, start + total - 0.2);
          med2Gain.gain.exponentialRampToValueAtTime(0.0001, start + total);
          med2.connect(med2Gain).connect(master);
          med2.start(start);
          med2.stop(start + total + 0.05);
          
          // 和谐的冥想钟声（每4秒一次）
          const meditationChimes = [392, 440, 494, 523];
          for (let i = 0; i < 2; i++) {
            const chimeTime = start + i * 4;
            const chimeFreq = meditationChimes[i % meditationChimes.length];
            const chime = ctx.createOscillator();
            const chimeGain = ctx.createGain();
            chime.type = 'triangle';
            chime.frequency.setValueAtTime(chimeFreq, chimeTime);
            chimeGain.gain.setValueAtTime(0.001, chimeTime);
            chimeGain.gain.exponentialRampToValueAtTime(0.15, chimeTime + 0.5);
            chimeGain.gain.exponentialRampToValueAtTime(0.001, chimeTime + 3);
            chime.connect(chimeGain).connect(master);
            chime.start(chimeTime);
            chime.stop(chimeTime + 3.1);
          }
          break;
        }
        case 'distant_serene': {
          // 悠远：悠远深邃的宁静空间
          const distant1 = ctx.createOscillator();
          const distant1Gain = ctx.createGain();
          distant1.type = 'sine';
          distant1.frequency.setValueAtTime(165, start); // E3，深远的低音
          distant1Gain.gain.setValueAtTime(0.001, start);
          distant1Gain.gain.linearRampToValueAtTime(0.08, start + 1.5);
          distant1Gain.gain.setValueAtTime(0.08, start + total - 0.2);
          distant1Gain.gain.exponentialRampToValueAtTime(0.0001, start + total);
          distant1.connect(distant1Gain).connect(master);
          distant1.start(start);
          distant1.stop(start + total + 0.05);
          
          // 悠远的回声效果（延迟的音符）
          const echoNotes = [330, 392, 440];
          for (let i = 0; i < 8; i++) {
            const echoTime = start + i * 1.2;
            const note = echoNotes[i % echoNotes.length];
            const echo = ctx.createOscillator();
            const echoGain = ctx.createGain();
            echo.type = 'sine';
            echo.frequency.setValueAtTime(note, echoTime);
            echoGain.gain.setValueAtTime(0.001, echoTime);
            echoGain.gain.exponentialRampToValueAtTime(0.1, echoTime + 0.3);
            echoGain.gain.exponentialRampToValueAtTime(0.001, echoTime + 1);
            echo.connect(echoGain).connect(master);
            echo.start(echoTime);
            echo.stop(echoTime + 1.1);
          }
          break;
        }
        case 'emerald_lotus_pond': {
          // 翠绿荷塘：翠绿荷塘的清新音韵
          const pond1 = ctx.createOscillator();
          const pond1Gain = ctx.createGain();
          pond1.type = 'sine';
          pond1.frequency.setValueAtTime(220, start); // A3
          pond1Gain.gain.setValueAtTime(0.001, start);
          pond1Gain.gain.linearRampToValueAtTime(0.1, start + 0.8);
          pond1Gain.gain.setValueAtTime(0.1, start + total - 0.2);
          pond1Gain.gain.exponentialRampToValueAtTime(0.0001, start + total);
          pond1.connect(pond1Gain).connect(master);
          pond1.start(start);
          pond1.stop(start + total + 0.05);
          
          // 清新的高音层（模拟水波）
          const pond2 = ctx.createOscillator();
          const pond2Gain = ctx.createGain();
          pond2.type = 'triangle';
          pond2.frequency.setValueAtTime(523, start); // C5，清新高音
          pond2Gain.gain.setValueAtTime(0.001, start);
          pond2Gain.gain.linearRampToValueAtTime(0.08, start + 1);
          pond2Gain.gain.setValueAtTime(0.08, start + total - 0.2);
          pond2Gain.gain.exponentialRampToValueAtTime(0.0001, start + total);
          pond2.connect(pond2Gain).connect(master);
          pond2.start(start);
          pond2.stop(start + total + 0.05);
          
          // 水波般的音符（每1.5秒一个）
          const rippleNotes = [440, 494, 523, 587];
          for (let i = 0; i < 6; i++) {
            const rippleTime = start + i * 1.5;
            const note = rippleNotes[i % rippleNotes.length];
            const ripple = ctx.createOscillator();
            const rippleGain = ctx.createGain();
            ripple.type = 'sine';
            ripple.frequency.setValueAtTime(note, rippleTime);
            rippleGain.gain.setValueAtTime(0.001, rippleTime);
            rippleGain.gain.exponentialRampToValueAtTime(0.12, rippleTime + 0.2);
            rippleGain.gain.exponentialRampToValueAtTime(0.001, rippleTime + 0.8);
            ripple.connect(rippleGain).connect(master);
            ripple.start(rippleTime);
            ripple.stop(rippleTime + 0.9);
          }
          break;
        }
        case 'moonlit_lotus': {
          // 月下荷花：月光下荷花的优雅音色
          const lotus1 = ctx.createOscillator();
          const lotus1Gain = ctx.createGain();
          lotus1.type = 'sine';
          lotus1.frequency.setValueAtTime(294, start); // D4，优雅的低音
          lotus1Gain.gain.setValueAtTime(0.001, start);
          lotus1Gain.gain.linearRampToValueAtTime(0.09, start + 1);
          lotus1Gain.gain.setValueAtTime(0.09, start + total - 0.2);
          lotus1Gain.gain.exponentialRampToValueAtTime(0.0001, start + total);
          lotus1.connect(lotus1Gain).connect(master);
          lotus1.start(start);
          lotus1.stop(start + total + 0.05);
          
          // 月光般的高音层
          const lotus2 = ctx.createOscillator();
          const lotus2Gain = ctx.createGain();
          lotus2.type = 'triangle';
          lotus2.frequency.setValueAtTime(659, start); // E5，月光高音
          lotus2Gain.gain.setValueAtTime(0.001, start);
          lotus2Gain.gain.linearRampToValueAtTime(0.07, start + 1.2);
          lotus2Gain.gain.setValueAtTime(0.07, start + total - 0.2);
          lotus2Gain.gain.exponentialRampToValueAtTime(0.0001, start + total);
          lotus2.connect(lotus2Gain).connect(master);
          lotus2.start(start);
          lotus2.stop(start + total + 0.05);
          
          // 优雅的音符（每2秒一个）
          const elegantNotes = [392, 440, 494, 523];
          for (let i = 0; i < 5; i++) {
            const elegantTime = start + i * 2;
            const note = elegantNotes[i % elegantNotes.length];
            const elegant = ctx.createOscillator();
            const elegantGain = ctx.createGain();
            elegant.type = 'sine';
            elegant.frequency.setValueAtTime(note, elegantTime);
            elegantGain.gain.setValueAtTime(0.001, elegantTime);
            elegantGain.gain.exponentialRampToValueAtTime(0.14, elegantTime + 0.25);
            elegantGain.gain.exponentialRampToValueAtTime(0.001, elegantTime + 1.2);
            elegant.connect(elegantGain).connect(master);
            elegant.start(elegantTime);
            elegant.stop(elegantTime + 1.3);
          }
          break;
        }
        // 自然的生命力 (Natural Vitality) - 12个
        case 'rippling_water': {
          // 水波荡漾：水波轻柔荡漾的自然韵律
          const water1 = ctx.createOscillator();
          const water1Gain = ctx.createGain();
          water1.type = 'sine';
          water1.frequency.setValueAtTime(220, start); // A3
          water1Gain.gain.setValueAtTime(0.001, start);
          water1Gain.gain.linearRampToValueAtTime(0.1, start + 0.5);
          // 波浪式的音量变化（每2秒一个周期）
          for (let i = 0; i < 5; i++) {
            const waveStart = start + i * 2;
            water1Gain.gain.linearRampToValueAtTime(0.12, waveStart + 1);
            water1Gain.gain.linearRampToValueAtTime(0.08, waveStart + 2);
          }
          water1Gain.gain.exponentialRampToValueAtTime(0.0001, start + total);
          water1.connect(water1Gain).connect(master);
          water1.start(start);
          water1.stop(start + total + 0.05);
          
          // 高音层（慢速琶音，模拟水波）
          const waterNotes = [440, 494, 523, 587];
          for (let i = 0; i < 5; i++) {
            waterNotes.forEach((freq, index) => {
              const waterTime = start + i * 2 + index * 0.4;
              const water = ctx.createOscillator();
              const waterGain = ctx.createGain();
              water.type = 'sine';
              water.frequency.setValueAtTime(freq, waterTime);
              waterGain.gain.setValueAtTime(0.001, waterTime);
              waterGain.gain.exponentialRampToValueAtTime(0.1, waterTime + 0.2);
              waterGain.gain.exponentialRampToValueAtTime(0.001, waterTime + 0.8);
              water.connect(waterGain).connect(master);
              water.start(waterTime);
              water.stop(waterTime + 1);
            });
          }
          break;
        }
        case 'faint_light': {
          // 微光：微弱光线的细腻音色
          const light1 = ctx.createOscillator();
          const light1Gain = ctx.createGain();
          light1.type = 'sine';
          light1.frequency.setValueAtTime(440, start); // A4
          light1Gain.gain.setValueAtTime(0.001, start);
          light1Gain.gain.linearRampToValueAtTime(0.06, start + 1);
          light1Gain.gain.setValueAtTime(0.06, start + total - 0.2);
          light1Gain.gain.exponentialRampToValueAtTime(0.0001, start + total);
          light1.connect(light1Gain).connect(master);
          light1.start(start);
          light1.stop(start + total + 0.05);
          
          // 微弱的闪烁（偶尔的高音）
          for (let i = 0; i < 10; i++) {
            const glimmerTime = start + i * 1;
            const glimmer = ctx.createOscillator();
            const glimmerGain = ctx.createGain();
            glimmer.type = 'sine';
            glimmer.frequency.setValueAtTime(523 + Math.sin(i) * 30, glimmerTime); // 微弱变化
            glimmerGain.gain.setValueAtTime(0.001, glimmerTime);
            glimmerGain.gain.exponentialRampToValueAtTime(0.08, glimmerTime + 0.1);
            glimmerGain.gain.exponentialRampToValueAtTime(0.001, glimmerTime + 0.4);
            glimmer.connect(glimmerGain).connect(master);
            glimmer.start(glimmerTime);
            glimmer.stop(glimmerTime + 0.5);
          }
          break;
        }
        case 'bathing_earth': {
          // 沐浴大地：阳光沐浴大地的温暖之声
          const earth1 = ctx.createOscillator();
          const earth1Gain = ctx.createGain();
          earth1.type = 'sine';
          earth1.frequency.setValueAtTime(262, start); // C4，大地的基础音
          earth1Gain.gain.setValueAtTime(0.001, start);
          earth1Gain.gain.linearRampToValueAtTime(0.11, start + 1);
          earth1Gain.gain.setValueAtTime(0.11, start + total - 0.2);
          earth1Gain.gain.exponentialRampToValueAtTime(0.0001, start + total);
          earth1.connect(earth1Gain).connect(master);
          earth1.start(start);
          earth1.stop(start + total + 0.05);
          
          // 温暖的阳光层
          const earth2 = ctx.createOscillator();
          const earth2Gain = ctx.createGain();
          earth2.type = 'triangle';
          earth2.frequency.setValueAtTime(392, start); // G4，温暖音调
          earth2Gain.gain.setValueAtTime(0.001, start);
          earth2Gain.gain.linearRampToValueAtTime(0.09, start + 1.2);
          earth2Gain.gain.setValueAtTime(0.09, start + total - 0.2);
          earth2Gain.gain.exponentialRampToValueAtTime(0.0001, start + total);
          earth2.connect(earth2Gain).connect(master);
          earth2.start(start);
          earth2.stop(start + total + 0.05);
          
          // 温暖的音符（每2秒一个）
          const warmNotes = [330, 392, 440];
          for (let i = 0; i < 5; i++) {
            const warmTime = start + i * 2;
            const note = warmNotes[i % warmNotes.length];
            const warm = ctx.createOscillator();
            const warmGain = ctx.createGain();
            warm.type = 'sine';
            warm.frequency.setValueAtTime(note, warmTime);
            warmGain.gain.setValueAtTime(0.001, warmTime);
            warmGain.gain.exponentialRampToValueAtTime(0.13, warmTime + 0.3);
            warmGain.gain.exponentialRampToValueAtTime(0.001, warmTime + 1.3);
            warm.connect(warmGain).connect(master);
            warm.start(warmTime);
            warm.stop(warmTime + 1.4);
          }
          break;
        }
        case 'jungle_morning': {
          // 丛林晨景：丛林清晨的生机勃勃
          const jungle1 = ctx.createOscillator();
          const jungle1Gain = ctx.createGain();
          jungle1.type = 'sine';
          jungle1.frequency.setValueAtTime(165, start); // E3，丛林低音
          jungle1Gain.gain.setValueAtTime(0.001, start);
          jungle1Gain.gain.linearRampToValueAtTime(0.1, start + 0.8);
          jungle1Gain.gain.setValueAtTime(0.1, start + total - 0.2);
          jungle1Gain.gain.exponentialRampToValueAtTime(0.0001, start + total);
          jungle1.connect(jungle1Gain).connect(master);
          jungle1.start(start);
          jungle1.stop(start + total + 0.05);
          
          // 生机勃勃的高音层
          const jungle2 = ctx.createOscillator();
          const jungle2Gain = ctx.createGain();
          jungle2.type = 'triangle';
          jungle2.frequency.setValueAtTime(494, start); // B4，生机高音
          jungle2Gain.gain.setValueAtTime(0.001, start);
          jungle2Gain.gain.linearRampToValueAtTime(0.09, start + 1);
          jungle2Gain.gain.setValueAtTime(0.09, start + total - 0.2);
          jungle2Gain.gain.exponentialRampToValueAtTime(0.0001, start + total);
          jungle2.connect(jungle2Gain).connect(master);
          jungle2.start(start);
          jungle2.stop(start + total + 0.05);
          
          // 充满生机的音符（每1.5秒一个）
          const vibrantNotes = [330, 392, 440, 494];
          for (let i = 0; i < 6; i++) {
            const vibrantTime = start + i * 1.5;
            const note = vibrantNotes[i % vibrantNotes.length];
            const vibrant = ctx.createOscillator();
            const vibrantGain = ctx.createGain();
            vibrant.type = 'sine';
            vibrant.frequency.setValueAtTime(note, vibrantTime);
            vibrantGain.gain.setValueAtTime(0.001, vibrantTime);
            vibrantGain.gain.exponentialRampToValueAtTime(0.14, vibrantTime + 0.2);
            vibrantGain.gain.exponentialRampToValueAtTime(0.001, vibrantTime + 0.9);
            vibrant.connect(vibrantGain).connect(master);
            vibrant.start(vibrantTime);
            vibrant.stop(vibrantTime + 1);
          }
          break;
        }
        case 'silver_clad': {
          // 银装素裹：银装素裹的纯净音色
          const silver1 = ctx.createOscillator();
          const silver1Gain = ctx.createGain();
          silver1.type = 'sine';
          silver1.frequency.setValueAtTime(220, start); // A3，纯净低音
          silver1Gain.gain.setValueAtTime(0.001, start);
          silver1Gain.gain.linearRampToValueAtTime(0.09, start + 1);
          silver1Gain.gain.setValueAtTime(0.09, start + total - 0.2);
          silver1Gain.gain.exponentialRampToValueAtTime(0.0001, start + total);
          silver1.connect(silver1Gain).connect(master);
          silver1.start(start);
          silver1.stop(start + total + 0.05);
          
          // 纯净的高音层
          const silver2 = ctx.createOscillator();
          const silver2Gain = ctx.createGain();
          silver2.type = 'triangle';
          silver2.frequency.setValueAtTime(523, start); // C5，纯净高音
          silver2Gain.gain.setValueAtTime(0.001, start);
          silver2Gain.gain.linearRampToValueAtTime(0.08, start + 1.2);
          silver2Gain.gain.setValueAtTime(0.08, start + total - 0.2);
          silver2Gain.gain.exponentialRampToValueAtTime(0.0001, start + total);
          silver2.connect(silver2Gain).connect(master);
          silver2.start(start);
          silver2.stop(start + total + 0.05);
          
          // 纯净的音符（每2秒一个）
          const pureNotes = [440, 494, 523];
          for (let i = 0; i < 5; i++) {
            const pureTime = start + i * 2;
            const note = pureNotes[i % pureNotes.length];
            const pure = ctx.createOscillator();
            const pureGain = ctx.createGain();
            pure.type = 'sine';
            pure.frequency.setValueAtTime(note, pureTime);
            pureGain.gain.setValueAtTime(0.001, pureTime);
            pureGain.gain.exponentialRampToValueAtTime(0.12, pureTime + 0.25);
            pureGain.gain.exponentialRampToValueAtTime(0.001, pureTime + 1.2);
            pure.connect(pureGain).connect(master);
            pure.start(pureTime);
            pure.stop(pureTime + 1.3);
          }
          break;
        }
        case 'elegant_tranquil': {
          // 优雅恬静：优雅恬静的自然和谐
          const elegant1 = ctx.createOscillator();
          const elegant1Gain = ctx.createGain();
          elegant1.type = 'sine';
          elegant1.frequency.setValueAtTime(294, start); // D4，优雅低音
          elegant1Gain.gain.setValueAtTime(0.001, start);
          elegant1Gain.gain.linearRampToValueAtTime(0.1, start + 1);
          elegant1Gain.gain.setValueAtTime(0.1, start + total - 0.2);
          elegant1Gain.gain.exponentialRampToValueAtTime(0.0001, start + total);
          elegant1.connect(elegant1Gain).connect(master);
          elegant1.start(start);
          elegant1.stop(start + total + 0.05);
          
          // 恬静的高音层
          const elegant2 = ctx.createOscillator();
          const elegant2Gain = ctx.createGain();
          elegant2.type = 'triangle';
          elegant2.frequency.setValueAtTime(440, start); // A4
          elegant2Gain.gain.setValueAtTime(0.001, start);
          elegant2Gain.gain.linearRampToValueAtTime(0.07, start + 1.5);
          elegant2Gain.gain.setValueAtTime(0.07, start + total - 0.2);
          elegant2Gain.gain.exponentialRampToValueAtTime(0.0001, start + total);
          elegant2.connect(elegant2Gain).connect(master);
          elegant2.start(start);
          elegant2.stop(start + total + 0.05);
          
          // 和谐的音符（每2.5秒一个）
          const harmonyNotes = [392, 440, 494, 523];
          for (let i = 0; i < 4; i++) {
            const harmonyTime = start + i * 2.5;
            const note = harmonyNotes[i % harmonyNotes.length];
            const harmony = ctx.createOscillator();
            const harmonyGain = ctx.createGain();
            harmony.type = 'sine';
            harmony.frequency.setValueAtTime(note, harmonyTime);
            harmonyGain.gain.setValueAtTime(0.001, harmonyTime);
            harmonyGain.gain.exponentialRampToValueAtTime(0.13, harmonyTime + 0.3);
            harmonyGain.gain.exponentialRampToValueAtTime(0.001, harmonyTime + 1.5);
            harmony.connect(harmonyGain).connect(master);
            harmony.start(harmonyTime);
            harmony.stop(harmonyTime + 1.6);
          }
          break;
        }
        case 'midsummer_beach': {
          // 盛夏海边：盛夏海边的清新活力
          const beach1 = ctx.createOscillator();
          const beach1Gain = ctx.createGain();
          beach1.type = 'sine';
          beach1.frequency.setValueAtTime(330, start); // E4，清新低音
          beach1Gain.gain.setValueAtTime(0.001, start);
          beach1Gain.gain.linearRampToValueAtTime(0.11, start + 0.8);
          beach1Gain.gain.setValueAtTime(0.11, start + total - 0.2);
          beach1Gain.gain.exponentialRampToValueAtTime(0.0001, start + total);
          beach1.connect(beach1Gain).connect(master);
          beach1.start(start);
          beach1.stop(start + total + 0.05);
          
          // 活力的高音层
          const beach2 = ctx.createOscillator();
          const beach2Gain = ctx.createGain();
          beach2.type = 'triangle';
          beach2.frequency.setValueAtTime(494, start); // B4，活力高音
          beach2Gain.gain.setValueAtTime(0.001, start);
          beach2Gain.gain.linearRampToValueAtTime(0.1, start + 1);
          beach2Gain.gain.setValueAtTime(0.1, start + total - 0.2);
          beach2Gain.gain.exponentialRampToValueAtTime(0.0001, start + total);
          beach2.connect(beach2Gain).connect(master);
          beach2.start(start);
          beach2.stop(start + total + 0.05);
          
          // 充满活力的音符（每1.2秒一个）
          const energeticNotes = [392, 440, 494, 523];
          for (let i = 0; i < 8; i++) {
            const energeticTime = start + i * 1.2;
            const note = energeticNotes[i % energeticNotes.length];
            const energetic = ctx.createOscillator();
            const energeticGain = ctx.createGain();
            energetic.type = 'sine';
            energetic.frequency.setValueAtTime(note, energeticTime);
            energeticGain.gain.setValueAtTime(0.001, energeticTime);
            energeticGain.gain.exponentialRampToValueAtTime(0.15, energeticTime + 0.15);
            energeticGain.gain.exponentialRampToValueAtTime(0.001, energeticTime + 0.8);
            energetic.connect(energeticGain).connect(master);
            energetic.start(energeticTime);
            energetic.stop(energeticTime + 0.9);
          }
          break;
        }
        case 'midsummer_night': {
          // 仲夏的夜：仲夏夜晚的宁静凉爽
          const night1 = ctx.createOscillator();
          const night1Gain = ctx.createGain();
          night1.type = 'sine';
          night1.frequency.setValueAtTime(196, start); // G3，宁静低音
          night1Gain.gain.setValueAtTime(0.001, start);
          night1Gain.gain.linearRampToValueAtTime(0.08, start + 1);
          night1Gain.gain.setValueAtTime(0.08, start + total - 0.2);
          night1Gain.gain.exponentialRampToValueAtTime(0.0001, start + total);
          night1.connect(night1Gain).connect(master);
          night1.start(start);
          night1.stop(start + total + 0.05);
          
          // 凉爽的高音层
          const night2 = ctx.createOscillator();
          const night2Gain = ctx.createGain();
          night2.type = 'triangle';
          night2.frequency.setValueAtTime(440, start); // A4
          night2Gain.gain.setValueAtTime(0.001, start);
          night2Gain.gain.linearRampToValueAtTime(0.06, start + 1.5);
          night2Gain.gain.setValueAtTime(0.06, start + total - 0.2);
          night2Gain.gain.exponentialRampToValueAtTime(0.0001, start + total);
          night2.connect(night2Gain).connect(master);
          night2.start(start);
          night2.stop(start + total + 0.05);
          
          // 宁静凉爽的音符（每2秒一个）
          const coolNotes = [330, 392, 440];
          for (let i = 0; i < 5; i++) {
            const coolTime = start + i * 2;
            const note = coolNotes[i % coolNotes.length];
            const cool = ctx.createOscillator();
            const coolGain = ctx.createGain();
            cool.type = 'sine';
            cool.frequency.setValueAtTime(note, coolTime);
            coolGain.gain.setValueAtTime(0.001, coolTime);
            coolGain.gain.exponentialRampToValueAtTime(0.11, coolTime + 0.3);
            coolGain.gain.exponentialRampToValueAtTime(0.001, coolTime + 1.2);
            cool.connect(coolGain).connect(master);
            cool.start(coolTime);
            cool.stop(coolTime + 1.3);
          }
          break;
        }
        case 'ice_snow_day': {
          // 冰雪天：冰雪世界的纯净清冷
          const ice1 = ctx.createOscillator();
          const ice1Gain = ctx.createGain();
          ice1.type = 'sine';
          ice1.frequency.setValueAtTime(165, start); // E3，清冷低音
          ice1Gain.gain.setValueAtTime(0.001, start);
          ice1Gain.gain.linearRampToValueAtTime(0.07, start + 1.2);
          ice1Gain.gain.setValueAtTime(0.07, start + total - 0.2);
          ice1Gain.gain.exponentialRampToValueAtTime(0.0001, start + total);
          ice1.connect(ice1Gain).connect(master);
          ice1.start(start);
          ice1.stop(start + total + 0.05);
          
          // 清冷的高音层
          const ice2 = ctx.createOscillator();
          const ice2Gain = ctx.createGain();
          ice2.type = 'triangle';
          ice2.frequency.setValueAtTime(523, start); // C5，清冷高音
          ice2Gain.gain.setValueAtTime(0.001, start);
          ice2Gain.gain.linearRampToValueAtTime(0.06, start + 1.5);
          ice2Gain.gain.setValueAtTime(0.06, start + total - 0.2);
          ice2Gain.gain.exponentialRampToValueAtTime(0.0001, start + total);
          ice2.connect(ice2Gain).connect(master);
          ice2.start(start);
          ice2.stop(start + total + 0.05);
          
          // 清冷的音符（每2.5秒一个）
          const coldNotes = [440, 494, 523];
          for (let i = 0; i < 4; i++) {
            const coldTime = start + i * 2.5;
            const note = coldNotes[i % coldNotes.length];
            const cold = ctx.createOscillator();
            const coldGain = ctx.createGain();
            cold.type = 'sine';
            cold.frequency.setValueAtTime(note, coldTime);
            coldGain.gain.setValueAtTime(0.001, coldTime);
            coldGain.gain.exponentialRampToValueAtTime(0.1, coldTime + 0.4);
            coldGain.gain.exponentialRampToValueAtTime(0.001, coldTime + 1.5);
            cold.connect(coldGain).connect(master);
            cold.start(coldTime);
            cold.stop(coldTime + 1.6);
          }
          break;
        }
        case 'winter_snow_falling': {
          // 冬雪飘落：冬雪飘落的轻柔韵律
          const snow1 = ctx.createOscillator();
          const snow1Gain = ctx.createGain();
          snow1.type = 'sine';
          snow1.frequency.setValueAtTime(220, start); // A3
          snow1Gain.gain.setValueAtTime(0.001, start);
          snow1Gain.gain.linearRampToValueAtTime(0.08, start + 1);
          snow1Gain.gain.setValueAtTime(0.08, start + total - 0.2);
          snow1Gain.gain.exponentialRampToValueAtTime(0.0001, start + total);
          snow1.connect(snow1Gain).connect(master);
          snow1.start(start);
          snow1.stop(start + total + 0.05);
          
          // 雪花般的轻柔音符（缓慢飘落）
          const snowNotes = [392, 440, 494];
          for (let i = 0; i < 8; i++) {
            const snowTime = start + i * 1.2;
            const note = snowNotes[i % snowNotes.length];
            const snow = ctx.createOscillator();
            const snowGain = ctx.createGain();
            snow.type = 'triangle';
            snow.frequency.setValueAtTime(note, snowTime);
            snowGain.gain.setValueAtTime(0.001, snowTime);
            snowGain.gain.exponentialRampToValueAtTime(0.12, snowTime + 0.4);
            snowGain.gain.exponentialRampToValueAtTime(0.001, snowTime + 1.2);
            snow.connect(snowGain).connect(master);
            snow.start(snowTime);
            snow.stop(snowTime + 1.3);
          }
          break;
        }
        case 'primeval_rainforest': {
          // 原始雨林：原始雨林的神秘生机
          const forest1 = ctx.createOscillator();
          const forest1Gain = ctx.createGain();
          forest1.type = 'sine';
          forest1.frequency.setValueAtTime(147, start); // D3，神秘低音
          forest1Gain.gain.setValueAtTime(0.001, start);
          forest1Gain.gain.linearRampToValueAtTime(0.1, start + 1);
          forest1Gain.gain.setValueAtTime(0.1, start + total - 0.2);
          forest1Gain.gain.exponentialRampToValueAtTime(0.0001, start + total);
          forest1.connect(forest1Gain).connect(master);
          forest1.start(start);
          forest1.stop(start + total + 0.05);
          
          // 神秘生机的高音层
          const forest2 = ctx.createOscillator();
          const forest2Gain = ctx.createGain();
          forest2.type = 'sawtooth';
          forest2.frequency.setValueAtTime(440, start); // A4，生机音调
          forest2Gain.gain.setValueAtTime(0.001, start);
          forest2Gain.gain.linearRampToValueAtTime(0.09, start + 1.2);
          forest2Gain.gain.setValueAtTime(0.09, start + total - 0.2);
          forest2Gain.gain.exponentialRampToValueAtTime(0.0001, start + total);
          forest2.connect(forest2Gain).connect(master);
          forest2.start(start);
          forest2.stop(start + total + 0.05);
          
          // 神秘生机的音符（每1.5秒一个）
          const mysteryNotes = [330, 392, 440, 494];
          for (let i = 0; i < 6; i++) {
            const mysteryTime = start + i * 1.5;
            const note = mysteryNotes[i % mysteryNotes.length];
            const mystery = ctx.createOscillator();
            const mysteryGain = ctx.createGain();
            mystery.type = 'sine';
            mystery.frequency.setValueAtTime(note, mysteryTime);
            mysteryGain.gain.setValueAtTime(0.001, mysteryTime);
            mysteryGain.gain.exponentialRampToValueAtTime(0.13, mysteryTime + 0.25);
            mysteryGain.gain.exponentialRampToValueAtTime(0.001, mysteryTime + 1);
            mystery.connect(mysteryGain).connect(master);
            mystery.start(mysteryTime);
            mystery.stop(mysteryTime + 1.1);
          }
          break;
        }
        case 'rain_nourishes_all': {
          // 雨润万物：春雨滋润万物的生机之声
          const rain1 = ctx.createOscillator();
          const rain1Gain = ctx.createGain();
          rain1.type = 'sine';
          rain1.frequency.setValueAtTime(262, start); // C4，雨水的基础音
          rain1Gain.gain.setValueAtTime(0.001, start);
          rain1Gain.gain.linearRampToValueAtTime(0.1, start + 0.8);
          rain1Gain.gain.setValueAtTime(0.1, start + total - 0.2);
          rain1Gain.gain.exponentialRampToValueAtTime(0.0001, start + total);
          rain1.connect(rain1Gain).connect(master);
          rain1.start(start);
          rain1.stop(start + total + 0.05);
          
          // 雨滴般的音符（模拟雨滴）
          const rainNotes = [392, 440, 494, 523];
          for (let i = 0; i < 10; i++) {
            const rainTime = start + i * 1;
            const note = rainNotes[i % rainNotes.length];
            const rain = ctx.createOscillator();
            const rainGain = ctx.createGain();
            rain.type = 'sine';
            rain.frequency.setValueAtTime(note, rainTime);
            rainGain.gain.setValueAtTime(0.001, rainTime);
            rainGain.gain.exponentialRampToValueAtTime(0.12, rainTime + 0.1);
            rainGain.gain.exponentialRampToValueAtTime(0.001, rainTime + 0.5);
            rain.connect(rainGain).connect(master);
            rain.start(rainTime);
            rain.stop(rainTime + 0.6);
          }
          break;
        }
        default: {
          // 默认使用夜空的音效
          const deep1 = ctx.createOscillator();
          const deep1Gain = ctx.createGain();
          deep1.type = 'sine';
          deep1.frequency.setValueAtTime(165, start);
          deep1Gain.gain.setValueAtTime(0.001, start);
          deep1Gain.gain.linearRampToValueAtTime(0.1, start + 1);
          deep1Gain.gain.setValueAtTime(0.1, start + total - 0.2);
          deep1Gain.gain.exponentialRampToValueAtTime(0.0001, start + total);
          deep1.connect(deep1Gain).connect(master);
          deep1.start(start);
          deep1.stop(start + total + 0.05);
          break;
        }
      }

      notificationStopTimeoutRef.current = window.setTimeout(() => {
        stopNotificationSound();
      }, (total + 0.5) * 1000);
    } catch (error) {
      console.error('Error playing sound:', error);
    }
  };

  const showDesktopNotification = (title: string, body: string) => {
    if (typeof window !== 'undefined' && notificationEnabled && 'Notification' in window) {
      if (Notification.permission === 'granted') {
        new Notification(title, {
          body,
          icon: '/favicon.ico',
          badge: '/favicon.ico',
        });
      }
    }
  };

  const toggleTimer = () => {
    setIsRunning(!isRunning);
  };

  const resetTimer = () => {
    setIsRunning(false);
    setStopwatchTime(0);
  };


  /**
   * 导航到指定页面
   * 如果当前处于全屏模式，保存状态到sessionStorage以便在新页面自动进入全屏
   * @param page - 目标页面路径（不包含locale前缀）
   */
  const navigateToPage = (page: string) => {
    const currentLocale = locale || 'en';
    const targetPath = `/${currentLocale}/${page}`;
    if (pathname !== targetPath) {
      // 检查当前是否处于全屏模式
      const isCurrentlyFullscreen = !!(
        document.fullscreenElement || 
        (document as any).webkitFullscreenElement || 
        (document as any).mozFullScreenElement || 
        (document as any).msFullscreenElement
      ) || isFullscreen; // 也检查本地状态（用于模拟全屏）
      
      // 如果处于全屏模式，保存状态到sessionStorage
      if (isCurrentlyFullscreen && typeof window !== 'undefined') {
        sessionStorage.setItem('shouldEnterFullscreen', 'true');
      }
      
      router.push(targetPath);
    }
  };



  // 注意：toggleFullscreen 函数已在 useFullscreen hook 中提供

  const applyCustomTime = () => {
    const totalSeconds = customMinutes * 60 + customSeconds;
    if (totalSeconds > 0) {
      setIsRunning(false);
      // 秒表模式：设置起始时间
      setStopwatchTime(totalSeconds);
    }
    setShowEditModal(false);
  };

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    // 秒表模式始终显示小时:分钟:秒
    if (mode === 'stopwatch' || hours > 0) {
      return {
        hours: String(hours).padStart(2, '0'),
        mins: String(mins).padStart(2, '0'),
        secs: String(secs).padStart(2, '0'),
        hasHours: true
      };
    }
    return {
      hours: null,
      mins: String(mins).padStart(2, '0'),
      secs: String(secs).padStart(2, '0'),
      hasHours: false
    };
  };

  const formatDate = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth() + 1;
    const day = currentDate.getDate();
    const weekdays = [
      t('weekdays.sunday'), 
      t('weekdays.monday'), 
      t('weekdays.tuesday'), 
      t('weekdays.wednesday'), 
      t('weekdays.thursday'), 
      t('weekdays.friday'), 
      t('weekdays.saturday')
    ];
    const weekday = weekdays[currentDate.getDay()];
    
    // 根据语言环境选择日期格式
    const dateStr = locale === 'zh' 
      ? `${year}年${month}月${day}日`
      : `${month}/${day}/${year}`;
    
    return {
      dateStr,
      weekdayStr: weekday
    };
  };


  // 根据天气代码返回图标
  const getWeatherIcon = (code: string) => {
    const iconProps = { 
      className: `w-full h-full ${theme === 'dark' ? 'text-slate-400' : 'text-gray-600'}` 
    };
    
    // wttr.in 天气代码映射
    switch(code) {
      case '113': // Sunny/Clear
        return <Sun {...iconProps} />;
      case '116': // Partly cloudy
        return <Cloudy {...iconProps} />;
      case '119': // Cloudy
      case '122': // Overcast
        return <Cloud {...iconProps} />;
      case '143': // Mist
      case '248': // Fog
      case '260': // Freezing fog
        return <Cloud {...iconProps} />;
      case '176': // Patchy rain possible
      case '263': // Patchy light drizzle
      case '266': // Light drizzle
      case '281': // Freezing drizzle
      case '284': // Heavy freezing drizzle
        return <CloudDrizzle {...iconProps} />;
      case '179': // Patchy snow possible
      case '227': // Blowing snow
      case '323': // Patchy light snow
      case '326': // Light snow
      case '329': // Patchy moderate snow
      case '332': // Moderate snow
      case '335': // Patchy heavy snow
      case '338': // Heavy snow
      case '368': // Light snow showers
      case '371': // Moderate or heavy snow showers
        return <CloudSnow {...iconProps} />;
      case '182': // Patchy sleet possible
      case '185': // Patchy freezing drizzle possible
      case '293': // Patchy light rain
      case '296': // Light rain
      case '299': // Moderate rain at times
      case '302': // Moderate rain
      case '305': // Heavy rain at times
      case '308': // Heavy rain
      case '311': // Light freezing rain
      case '314': // Moderate or heavy freezing rain
      case '317': // Light sleet
      case '320': // Moderate or heavy sleet
      case '350': // Ice pellets
      case '353': // Light rain shower
      case '356': // Moderate or heavy rain shower
      case '359': // Torrential rain shower
      case '362': // Light sleet showers
      case '365': // Moderate or heavy sleet showers
      case '374': // Light showers of ice pellets
      case '377': // Moderate or heavy showers of ice pellets
        return <CloudRain {...iconProps} />;
      default:
        return <Cloud {...iconProps} />;
    }
  };

  // 根据当前模式选择对应的颜色
  const currentColorId = stopwatchColor;
  const themeColor = THEME_COLORS.find(c => c.id === currentColorId) || THEME_COLORS[0];

  return (
    <div
      className={`${isFullscreen ? 'fixed inset-0 z-50 h-screen' : 'min-h-screen'} ${backgroundType === 'default' ? (theme === 'dark' ? 'bg-black' : 'bg-gray-100') : ''} flex flex-col ${isFullscreen ? 'p-0' : 'p-0 sm:p-4'} transition-colors duration-300 relative`}
      style={{ 
        cursor: !showControls ? 'none' : 'default',
        backgroundColor: backgroundType === 'color' ? backgroundColor : undefined,
        backgroundImage: backgroundType === 'image' && backgroundImage ? `url(${backgroundImage})` : undefined,
        backgroundSize: 'cover',
        backgroundPosition: backgroundType === 'image' && backgroundImage ? `${imagePositionX}% ${imagePositionY}%` : 'center',
        backgroundRepeat: 'no-repeat',
      }}
    >
      {/* 图片背景遮罩层 - 提升内容可读性 */}
      {backgroundType === 'image' && backgroundImage && (
        <div 
          className="absolute inset-0 pointer-events-none"
          style={{ 
            backgroundColor: theme === 'dark' ? 'rgba(0, 0, 0, 0.3)' : 'rgba(255, 255, 255, 0.3)',
            zIndex: 0,
          }}
        />
      )}
      
      {/* 内容层 */}
      <div className="relative z-10 flex flex-col flex-1">
      {/* 移动端顶部菜单栏和导航栏 - 只在移动端显示 */}
      {!isFullscreen && (
        <div className={`sm:hidden fixed top-0 left-0 right-0 w-full z-40 ${theme === 'dark' ? 'bg-slate-900/50' : 'bg-white/80'} backdrop-blur-sm`}>
          {/* 顶部菜单栏 - 应用名称和汉堡菜单按钮 */}
          <div className={`flex items-center justify-between px-4 py-3 border-b ${theme === 'dark' ? 'border-slate-700' : 'border-gray-200'}`}>
            <div className="flex items-center gap-2">
              <Clock className={`w-5 h-5 ${theme === 'dark' ? 'text-blue-400' : 'text-blue-500'}`} />
              <span className={`text-lg font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Timero</span>
            </div>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowMobileMenu(!showMobileMenu)}
              className={`p-2 rounded-full transition-all ${
                showMobileMenu
                  ? theme === 'dark'
                    ? 'bg-slate-600 text-white'
                    : 'bg-slate-400 text-white'
                  : theme === 'dark'
                  ? 'text-slate-400 hover:bg-slate-800'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <Menu className="w-5 h-5" />
            </motion.button>
          </div>
          
          {/* 导航栏 - 主要功能按钮 */}
          <div className={`border-b ${theme === 'dark' ? 'border-slate-700' : 'border-gray-200'}`}>
            <div className="flex items-center justify-around py-3 px-2">
            <button
              onClick={() => navigateToPage('stopwatch')}
              className={`flex flex-col items-center gap-1 px-4 py-2 rounded-lg transition-all ${
                mode === 'stopwatch' 
                  ? theme === 'dark'
                    ? 'bg-slate-600 text-white'
                    : 'bg-slate-400 text-white'
                  : theme === 'dark'
                  ? 'text-slate-400 hover:bg-slate-800'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <Clock className="w-5 h-5" />
              <span className="text-xs font-medium">{t('modes.stopwatch')}</span>
            </button>
            {/* 移动端设置按钮 */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowMobileMenu(!showMobileMenu)}
              className={`flex flex-col items-center gap-1 px-4 py-2 rounded-lg transition-all ${
                showMobileMenu
                  ? theme === 'dark'
                    ? 'bg-slate-600 text-white'
                    : 'bg-slate-400 text-white'
                  : theme === 'dark'
                  ? 'text-slate-400 hover:bg-slate-800'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <Settings className="w-5 h-5" />
              <span className="text-xs font-medium">{t('buttons.menu')}</span>
            </motion.button>
            </div>
          </div>
          
          {/* 移动端折叠菜单 */}
          <AnimatePresence>
            {showMobileMenu && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
                className={`border-t ${theme === 'dark' ? 'border-slate-700/50' : 'border-gray-200/50'}`}
              >
                <div className="grid grid-cols-2 gap-3 p-4">
                  {/* 桌面通知开关 */}
                  <motion.button
                    whileHover={{ scale: 1.03, y: -2 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => setNotificationEnabled(!notificationEnabled)}
                    className={`flex flex-col items-center justify-center gap-2 p-4 rounded-xl transition-all duration-200 ${
                      notificationEnabled
                        ? 'bg-gradient-to-br from-cyan-400 to-cyan-500 text-white shadow-lg shadow-cyan-400/30'
                        : theme === 'dark'
                        ? 'bg-slate-800/80 text-slate-300 hover:bg-slate-700/80 border border-slate-700/50'
                        : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200 shadow-sm'
                    }`}
                  >
                    <div className={`p-2 rounded-lg ${notificationEnabled ? 'bg-white/20' : theme === 'dark' ? 'bg-slate-700/50' : 'bg-gray-100'}`}>
                      {notificationEnabled ? (
                        <Bell className="w-5 h-5" />
                      ) : (
                        <BellOff className="w-5 h-5" />
                      )}
                    </div>
                    <span className="text-xs font-semibold text-center leading-tight">
                      {notificationEnabled ? '通知开' : '通知关'}
                    </span>
                  </motion.button>
                  
                  {/* 声音开关 */}
                  <motion.button
                    whileHover={{ scale: 1.03, y: -2 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => setSoundEnabled(!soundEnabled)}
                    className={`flex flex-col items-center justify-center gap-2 p-4 rounded-xl transition-all duration-200 ${
                      soundEnabled
                        ? 'bg-gradient-to-br from-green-500 to-green-600 text-white shadow-lg shadow-green-500/30' 
                        : theme === 'dark'
                        ? 'bg-slate-800/80 text-slate-300 hover:bg-slate-700/80 border border-slate-700/50'
                        : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200 shadow-sm'
                    }`}
                  >
                    <div className={`p-2 rounded-lg ${soundEnabled ? 'bg-white/20' : theme === 'dark' ? 'bg-slate-700/50' : 'bg-gray-100'}`}>
                      {soundEnabled ? (
                        <Volume2 className="w-5 h-5" />
                      ) : (
                        <VolumeX className="w-5 h-5" />
                      )}
                    </div>
                    <span className="text-xs font-semibold text-center leading-tight">
                      {soundEnabled ? '声音开' : '声音关'}
                    </span>
                  </motion.button>
                  
                  {/* 设置面板 */}
                  <motion.button
                    whileHover={{ scale: 1.03, y: -2 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => setShowSettingsPanel(!showSettingsPanel)}
                    className={`flex flex-col items-center justify-center gap-2 p-4 rounded-xl transition-all duration-200 ${
                      showSettingsPanel
                        ? 'bg-gradient-to-br from-purple-500 to-purple-600 text-white shadow-lg shadow-purple-500/30' 
                        : theme === 'dark'
                        ? 'bg-slate-800/80 text-slate-300 hover:bg-slate-700/80 border border-slate-700/50'
                        : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200 shadow-sm'
                    }`}
                  >
                    <div className={`p-2 rounded-lg ${showSettingsPanel ? 'bg-white/20' : theme === 'dark' ? 'bg-slate-700/50' : 'bg-gray-100'}`}>
                      <Settings className="w-5 h-5" />
                    </div>
                    <span className="text-xs font-semibold text-center leading-tight">
                      {t('buttons.settings')}
                    </span>
                  </motion.button>
                  
                  {/* 白天/夜晚模式切换 */}
                  <motion.button
                    whileHover={{ scale: 1.03, y: -2 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                    className={`flex flex-col items-center justify-center gap-2 p-4 rounded-xl transition-all duration-200 ${
                      theme === 'dark'
                        ? 'bg-gradient-to-br from-amber-500 to-orange-500 text-white shadow-lg shadow-amber-500/30'
                        : 'bg-gradient-to-br from-blue-400 to-indigo-500 text-white shadow-lg shadow-blue-400/30'
                    }`}
                  >
                    <div className={`p-2 rounded-lg ${theme === 'dark' ? 'bg-white/20' : 'bg-white/20'}`}>
                      {theme === 'dark' ? (
                        <Sun className="w-5 h-5" />
                      ) : (
                        <Moon className="w-5 h-5" />
                      )}
                    </div>
                    <span className="text-xs font-semibold text-center leading-tight">
                      {theme === 'dark' ? '白天模式' : '夜晚模式'}
                    </span>
                  </motion.button>
                  
                  {/* 全屏模式 */}
                  <motion.button
                    whileHover={{ scale: 1.03, y: -2 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={toggleFullscreen}
                    className={`flex flex-col items-center justify-center gap-2 p-4 rounded-xl transition-all duration-200 ${
                      theme === 'dark'
                        ? 'bg-slate-800/80 text-slate-300 hover:bg-slate-700/80 border border-slate-700/50'
                        : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200 shadow-sm'
                    }`}
                  >
                    <div className={`p-2 rounded-lg ${theme === 'dark' ? 'bg-slate-700/50' : 'bg-gray-100'}`}>
                      <Maximize className="w-5 h-5" />
                    </div>
                    <span className="text-xs font-semibold text-center leading-tight">
                      {t('tooltips.fullscreen')}
                    </span>
                  </motion.button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* 主计时器区域 */}
      <div className="flex-1 flex items-center justify-center relative w-full sm:pt-0 pt-[120px]">
        {/* 顶部工具栏 - 只在非全屏显示 */}
        <AnimatePresence>
          {!isFullscreen && showControls && (
            <>
              {/* 左上角：模式切换 - 移动端隐藏 */}
              <motion.div 
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className="hidden sm:flex fixed top-20 sm:top-24 left-2 sm:left-4 gap-0.5 sm:gap-2 flex-wrap max-w-[50%] sm:max-w-none z-40"
                onMouseEnter={() => { isHoveringControls.current = true; }}
                onMouseLeave={() => { isHoveringControls.current = false; }}
              >
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => navigateToPage('countdown')}
                  className={`p-1.5 sm:p-2.5 rounded-md sm:rounded-lg transition-colors ${
                    // Note: In stopwatch mode, mode is fixed to 'stopwatch', so timer check is never true
                    false // Always false in stopwatch mode
                      ? 'bg-blue-500 text-white' 
                      : theme === 'dark'
                      ? 'bg-white/10 hover:bg-white/20 text-white/60'
                      : 'bg-gray-800/80 hover:bg-gray-700 text-gray-300'
                  }`}
                  title={t('modes.timer')}
                >
                  <Timer className="w-4 h-4 sm:w-6 sm:h-6" />
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => navigateToPage('stopwatch')}
                  className={`p-1.5 sm:p-2.5 rounded-md sm:rounded-lg transition-colors ${
                    mode === 'stopwatch' 
                      ? 'bg-blue-500 text-white' 
                      : theme === 'dark'
                      ? 'bg-white/10 hover:bg-white/20 text-white/60'
                      : 'bg-gray-800/80 hover:bg-gray-700 text-gray-300'
                  }`}
                  title={t('modes.stopwatch')}
                >
                  <Clock className="w-4 h-4 sm:w-6 sm:h-6" />
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => navigateToPage('alarm')}
                  className={`p-1.5 sm:p-2.5 rounded-md sm:rounded-lg transition-colors ${
                    // Note: In stopwatch mode, mode is fixed to 'stopwatch', so alarm check is never true
                    false // Always false in stopwatch mode
                      ? 'bg-blue-500 text-white' 
                      : theme === 'dark'
                      ? 'bg-white/10 hover:bg-white/20 text-white/60'
                      : 'bg-gray-800/80 hover:bg-gray-700 text-gray-300'
                  }`}
                  title={t('modes.alarm')}
                >
                  <AlarmClock className="w-4 h-4 sm:w-6 sm:h-6" />
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => navigateToPage('world-clock')}
                  className={`p-1.5 sm:p-2.5 rounded-md sm:rounded-lg transition-colors ${
                    // Note: In stopwatch mode, mode is fixed to 'stopwatch', so worldclock check is never true
                    false // Always false in stopwatch mode
                      ? 'bg-blue-500 text-white' 
                      : theme === 'dark'
                      ? 'bg-white/10 hover:bg-white/20 text-white/60'
                      : 'bg-gray-800/80 hover:bg-gray-700 text-gray-300'
                  }`}
                  title={t('modes.worldclock')}
                >
                  <Globe className="w-4 h-4 sm:w-6 sm:h-6" />
                </motion.button>
              </motion.div>

              {/* 右上角：功能按钮 - 移动端隐藏 */}
              <motion.div 
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className="hidden sm:flex fixed top-20 sm:top-24 right-2 sm:right-4 gap-0.5 sm:gap-2 z-40"
                onMouseEnter={() => { isHoveringControls.current = true; }}
                onMouseLeave={() => { isHoveringControls.current = false; }}
              >
                {/* 移动端隐藏通知按钮 */}
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setNotificationEnabled(!notificationEnabled)}
                  className={`hidden sm:flex p-1 sm:p-2.5 ${theme === 'dark' ? 'bg-white/10 hover:bg-white/20' : 'bg-black/10 hover:bg-black/20'} rounded-md sm:rounded-lg transition-colors`}
                  title={notificationEnabled ? t('tooltips.close_notification') : t('tooltips.open_notification')}
                >
                  {notificationEnabled ? (
                    <Bell className={`w-3.5 h-3.5 sm:w-6 sm:h-6 ${theme === 'dark' ? 'text-white' : 'text-black'}`} />
                  ) : (
                    <BellOff className={`w-3.5 h-3.5 sm:w-6 sm:h-6 ${theme === 'dark' ? 'text-white' : 'text-black'}`} />
                  )}
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setSoundEnabled(!soundEnabled)}
                  className={`p-1 sm:p-2.5 ${theme === 'dark' ? 'bg-white/10 hover:bg-white/20' : 'bg-black/10 hover:bg-black/20'} rounded-md sm:rounded-lg transition-colors`}
                  title={soundEnabled ? t('tooltips.close_sound') : t('tooltips.open_sound')}
                >
                  {soundEnabled ? (
                    <Volume2 className={`w-3.5 h-3.5 sm:w-6 sm:h-6 ${theme === 'dark' ? 'text-white' : 'text-black'}`} />
                  ) : (
                    <VolumeX className={`w-3.5 h-3.5 sm:w-6 sm:h-6 ${theme === 'dark' ? 'text-white' : 'text-black'}`} />
                  )}
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    // 使用 next-themes 的 setTheme
                    const newTheme = theme === 'dark' ? 'light' : 'dark';
                    console.log('手动切换主题:', theme, '->', newTheme);
                    
                    // 如果切换到夜晚模式，重置所有功能页面到默认状态
                    if (newTheme === 'dark') {
                      console.log('切换到夜晚模式，重置所有功能页面到默认状态');
                      const allModes = ['stopwatch'];
                      
                      // 清除所有功能页面的自定义背景图片
                      allModes.forEach(modeKey => {
                        localStorage.removeItem(`timer-background-image-${modeKey}`);
                        localStorage.removeItem(`timer-manual-theme-${modeKey}`);
                        console.log(`Clearing custom settings for ${modeKey} page`);
                      });
                      
                      // 清除通用背景图片设置
                      localStorage.removeItem('timer-background-image');
                      
                      // 重置背景类型为默认
                      setBackgroundType('default');
                      setBackgroundImage('');
                      setApplyToAllPages(true);
                      
                      // 清除手动主题设置标志
                      setUserManuallySetTheme(false);
                      
                      toast.success(t('settings_panel.reset_all_pages'));
                    } else {
                      // 切换到白天模式，保持现有逻辑
                      // 标记用户手动设置了主题
                      setUserManuallySetTheme(true);
                      localStorage.setItem(`timer-manual-theme-${mode}`, newTheme);
                      
                      // 检查当前页面是否有专用背景图片
                      const currentModeBackgroundImage = localStorage.getItem(`timer-background-image-${mode}`);
                      const generalBackgroundImage = localStorage.getItem('timer-background-image');
                      
                      // 如果当前页面有专用背景图片，需要确保其他页面保持正确的默认背景
                      if (currentModeBackgroundImage && !generalBackgroundImage) {
                        console.log('当前页面有专用背景图片，确保其他页面保持默认背景');
                        const allModes = ['stopwatch'];
                        
                        // 为其他页面设置与当前主题匹配的默认背景
                        allModes.forEach(modeKey => {
                          if (modeKey !== mode) {
                            const defaultBackgroundColor = newTheme === 'light' ? '#f8fafc' : '#1e293b';
                            localStorage.setItem(`timer-background-color-${modeKey}`, defaultBackgroundColor);
                            console.log(`Setting default background for ${modeKey} page:`, defaultBackgroundColor);
                          }
                        });
                      }
                    }
                    
                    setTheme(newTheme);
                  }}
                  className={`p-1 sm:p-2.5 ${theme === 'dark' ? 'bg-white/10 hover:bg-white/20' : 'bg-black/10 hover:bg-black/20'} rounded-md sm:rounded-lg transition-colors`}
                  title={theme === 'dark' ? t('tooltips.switch_to_light') : t('tooltips.switch_to_dark')}
                >
                  {theme === 'dark' ? (
                    <Sun className="w-3.5 h-3.5 sm:w-6 sm:h-6 text-white" />
                  ) : (
                    <Moon className="w-3.5 h-3.5 sm:w-6 sm:h-6 text-black" />
                  )}
                </motion.button>
                {/* 移动端隐藏设置面板按钮 */}
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowSettingsPanel(!showSettingsPanel)}
                  className={`hidden sm:flex p-1 sm:p-2 ${theme === 'dark' ? 'bg-white/10 hover:bg-white/20' : 'bg-black/10 hover:bg-black/20'} rounded-md sm:rounded-lg transition-colors ${showSettingsPanel ? 'ring-2 ring-blue-500' : ''}`}
                  title={t('buttons.settings')}
                >
                  <Settings className={`w-3.5 h-3.5 sm:w-6 sm:h-6 ${theme === 'dark' ? 'text-white' : 'text-black'}`} />
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={toggleFullscreen}
                  className={`p-1 sm:p-2 ${theme === 'dark' ? 'bg-white/10 hover:bg-white/20' : 'bg-black/10 hover:bg-black/20'} rounded-md sm:rounded-lg transition-colors`}
                  title={t('tooltips.fullscreen')}
                >
                  <Maximize className={`w-3.5 h-3.5 sm:w-6 sm:h-6 ${theme === 'dark' ? 'text-white' : 'text-black'}`} />
                </motion.button>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* 全屏模式下的浮动工具栏 */}
        <AnimatePresence>
          {isFullscreen && showControls && (
            <>
              {/* 左上角：模式切换 - 全屏模式移动端优化 */}
              <motion.div 
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className="fixed top-1 sm:top-6 left-1 sm:left-6 flex gap-0.5 sm:gap-3 z-50 flex-wrap max-w-[70%] sm:max-w-none"
                onMouseEnter={() => { isHoveringControls.current = true; }}
                onMouseLeave={() => { isHoveringControls.current = false; }}
              >
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => navigateToPage('stopwatch')}
                  className={`p-1.5 sm:p-4 rounded-md sm:rounded-xl transition-all backdrop-blur-md shadow-2xl ${
                    mode === 'stopwatch' 
                      ? 'bg-blue-500 text-white shadow-blue-500/50' 
                      : 'bg-black/40 hover:bg-black/60 text-white border border-white/20'
                  }`}
                  title={t('modes.stopwatch')}
                >
                  <Clock className="w-4 h-4 sm:w-7 sm:h-7" />
                </motion.button>
              </motion.div>

              {/* 右上角：功能按钮 - 全屏模式移动端优化 */}
              <motion.div 
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className="fixed top-1 sm:top-6 right-1 sm:right-6 flex gap-0.5 sm:gap-3 z-50"
                onMouseEnter={() => { isHoveringControls.current = true; }}
                onMouseLeave={() => { isHoveringControls.current = false; }}
              >
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setSoundEnabled(!soundEnabled)}
                  className="p-1.5 sm:p-4 bg-black/40 hover:bg-black/60 backdrop-blur-md rounded-md sm:rounded-xl transition-all shadow-2xl border border-white/20"
                  title={soundEnabled ? t('tooltips.close_sound') : t('tooltips.open_sound')}
                >
                  {soundEnabled ? (
                    <Volume2 className="w-4 h-4 sm:w-7 sm:h-7 text-white" />
                  ) : (
                    <VolumeX className="w-4 h-4 sm:w-7 sm:h-7 text-white" />
                  )}
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={toggleFullscreen}
                  className="p-1.5 sm:p-4 bg-black/40 hover:bg-black/60 backdrop-blur-md rounded-md sm:rounded-xl transition-all shadow-2xl border border-white/20"
                  title={t('tooltips.exit_fullscreen')}
                >
                  <X className="w-4 h-4 sm:w-7 sm:h-7 text-white" />
                </motion.button>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className={`w-full flex flex-col items-center ${!isFullscreen ? 'justify-center -mt-12 sm:mt-0' : 'justify-between flex-1 h-full'}`}
        >
          {/* 日期和天气显示 - 非全屏时显示 */}
          {!isFullscreen && (
            <div className="w-full flex justify-center mb-4 sm:mb-6 md:mb-8">
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="inline-flex items-center justify-between"
                style={{
                  width: 'var(--timer-width, auto)',
                  minWidth: '300px',
                  maxWidth: '90vw'
                }}
              >
                {/* 左侧：天气图标和温度 */}
                <div className="flex items-center gap-1 sm:gap-1.5">
                  {weather && (showWeatherIcon || showTemperature) ? (
                    <>
                      {showWeatherIcon && weather.icon && (
                        <div className="w-4 h-4 sm:w-5 sm:h-5 md:w-5 md:h-5">
                          {getWeatherIcon(weather.icon)}
                        </div>
                      )}
                      {showTemperature && weather.temp !== undefined && (
                        <span className={`text-sm sm:text-base md:text-lg font-medium ${theme === 'dark' ? 'text-slate-300' : 'text-gray-700'}`}>
                          {weather.temp}°C
                        </span>
                      )}
                    </>
                  ) : (
                    <span className="w-4 h-4 sm:w-5 sm:h-5"></span>
                  )}
                </div>
                
                {/* 右侧：日期 */}
                <div className={`flex items-center gap-1 text-sm sm:text-base md:text-lg font-normal ${theme === 'dark' ? 'text-slate-400' : 'text-gray-600'}`}
                  style={{
                    letterSpacing: '0.05em',
                  }}
                >
                  {(() => {
                    const { dateStr, weekdayStr } = formatDate();
                    return (
                      <>
                        {showDate && <span>{dateStr}</span>}
                        {showDate && showWeekday && <span>&nbsp;</span>}
                        {showWeekday && <span>{weekdayStr}</span>}
    </>
  );
                  })()}
                </div>
              </motion.div>
            </div>
          )}

          {/* Time Display */}
          <div 
            className={`text-center w-full flex flex-col sm:flex-row items-center justify-center px-2 sm:px-4 ${
              isFullscreen ? 'flex-1 min-h-0' : 'min-h-[25vh] sm:min-h-[50vh]'
            }`} 
            style={isFullscreen ? { maxHeight: '100%', overflow: 'hidden' } : { marginTop: '-1rem', marginBottom: '0.5rem' }}
          >
            <div 
              id="timer-display"
              className={`${
                (() => {
                  const time = formatTime(stopwatchTime);
                  // 根据是否有小时调整字体大小
                  if (isFullscreen) {
                    return time.hasHours 
                      ? 'text-[5rem] sm:text-[10rem] md:text-[14rem] lg:text-[17rem] xl:text-[20rem] 2xl:text-[24rem]'
                      : 'text-[8rem] sm:text-[16rem] md:text-[20rem] lg:text-[24rem] xl:text-[28rem] 2xl:text-[32rem]';
                  } else {
                    return time.hasHours
                      ? 'text-[4rem] xs:text-[5.5rem] sm:text-[7.5rem] md:text-[9.5rem] lg:text-[11.5rem] xl:text-[13.5rem]'
                      : 'text-[6rem] xs:text-[8rem] sm:text-[10rem] md:text-[13rem] lg:text-[15rem] xl:text-[17rem]';
                  }
                })()
              } leading-none flex items-center justify-center whitespace-nowrap mx-auto`}
              style={{
                fontFamily: '"Rajdhani", sans-serif',
                fontWeight: '580',
                letterSpacing: '0.05em',
                WebkitFontSmoothing: 'antialiased',
                MozOsxFontSmoothing: 'grayscale',
              }}
            >
              {(() => {
                const time = formatTime(stopwatchTime);
                
                // 检查是否使用渐变色
                const hasGradient = themeColor.gradient && true;
                
                // 计算当前应该使用的颜色
                const currentColor = themeColor.color;
                
                // 数字的样式
                const getNumberStyle = (): React.CSSProperties => {
                  if (hasGradient) {
                    return {
                      backgroundImage: themeColor.gradient,
                      backgroundClip: 'text',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      color: 'transparent',
                    };
                  }
                  return { color: currentColor };
                };
                
                const numberStyle = getNumberStyle();
                
                return (
                  <>
                    {time.hasHours && (
                      <>
                        <span style={numberStyle}>{time.hours}</span>
                        <span className="inline-flex flex-col justify-center gap-[0.2em] mx-[0.15em]">
                          <span className="w-[0.15em] h-[0.15em] rounded-sm" style={{ backgroundColor: hasGradient ? themeColor.color : currentColor }}></span>
                          <span className="w-[0.15em] h-[0.15em] rounded-sm" style={{ backgroundColor: hasGradient ? themeColor.color : currentColor }}></span>
                        </span>
                      </>
                    )}
                    <span style={numberStyle}>{time.mins}</span>
                    <span className="inline-flex flex-col justify-center gap-[0.2em] mx-[0.15em]">
                      <span className="w-[0.15em] h-[0.15em] rounded-sm" style={{ backgroundColor: hasGradient ? themeColor.color : currentColor }}></span>
                      <span className="w-[0.15em] h-[0.15em] rounded-sm" style={{ backgroundColor: hasGradient ? themeColor.color : currentColor }}></span>
                    </span>
                    <span style={numberStyle}>{time.secs}</span>
                  </>
                );
              })()}
            </div>
          </div>
              
          {/* 闹钟列表已删除 - stopwatch模式不需要 */}
          {/* 世界时间已删除 - stopwatch模式不需要 */}
          {/* 进度条已删除 - stopwatch模式不需要 */}

          {/* Control Buttons */}
          <AnimatePresence>
            {showControls && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                transition={{ duration: 0.3 }}
                className={`flex flex-wrap justify-center gap-2 sm:gap-3 md:gap-4 relative z-10 ${
                  isFullscreen 
                    ? 'px-2 pb-8 sm:pb-12 md:pb-16 lg:pb-20 w-full' 
                    : 'mt-6 sm:mt-8 md:mt-12'
                }`}
                style={isFullscreen ? {
                  marginTop: 'auto'
                } : {
                  marginTop: '-1rem'
                }}
                onMouseEnter={() => { isHoveringControls.current = true; }}
                onMouseLeave={() => { isHoveringControls.current = false; }}
              >
                {(
                  <>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={toggleTimer}
                      disabled={false}
                      className={`flex items-center gap-1 sm:gap-2 ${
                        isFullscreen 
                          ? 'px-4 py-2 sm:px-8 sm:py-4 md:px-10 md:py-5 lg:px-12 lg:py-6 text-sm sm:text-lg md:text-xl' 
                          : 'px-4 py-2 sm:px-6 sm:py-3 md:px-8 md:py-4 text-sm sm:text-base'
                      } rounded-[10px] font-semibold text-white shadow-lg transition-all ${
                        false
                          ? 'bg-slate-700 cursor-not-allowed'
                          : isRunning
                          ? 'bg-orange-500 hover:bg-orange-600'
                          : 'bg-blue-500 hover:bg-blue-600'
                      }`}
                    >
                      {isRunning ? (
                        <>
                          <Pause className={
                            isFullscreen 
                              ? 'w-4 h-4 sm:w-6 sm:h-6 md:w-7 md:h-7' 
                              : 'w-4 h-4 sm:w-5 sm:h-5'
                          } />
                          <span>{t('buttons.pause')}</span>
                        </>
                      ) : (
                        <>
                          <Play className={
                            isFullscreen 
                              ? 'w-4 h-4 sm:w-6 sm:h-6 md:w-7 md:h-7' 
                              : 'w-4 h-4 sm:w-5 sm:h-5'
                          } />
                          <span>{t('buttons.start')}</span>
                        </>
                      )}
                    </motion.button>

                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={resetTimer}
                      className={`flex items-center gap-1 sm:gap-2 ${
                        isFullscreen 
                          ? 'px-4 py-2 sm:px-8 sm:py-4 md:px-10 md:py-5 lg:px-12 lg:py-6 text-sm sm:text-lg md:text-xl' 
                          : 'px-4 py-2 sm:px-6 sm:py-3 md:px-8 md:py-4 text-sm sm:text-base'
                      } bg-slate-700 hover:bg-slate-600 text-white rounded-[8px] font-semibold shadow-lg transition-all`}
                    >
                      <RotateCcw className={
                        isFullscreen 
                          ? 'w-4 h-4 sm:w-6 sm:h-6 md:w-7 md:h-7' 
                          : 'w-4 h-4 sm:w-5 sm:h-5'
                      } />
                      <span>{t('buttons.reset')}</span>
                    </motion.button>

                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => {
                        const currentSeconds = stopwatchTime;
                        setCustomMinutes(Math.floor(currentSeconds / 60));
                        setCustomSeconds(currentSeconds % 60);
                        setShowEditModal(true);
                      }}
                      className={`flex items-center gap-1 sm:gap-2 ${
                        isFullscreen 
                          ? 'px-4 py-2 sm:px-8 sm:py-4 md:px-10 md:py-5 lg:px-12 lg:py-6 text-sm sm:text-lg md:text-xl' 
                          : 'px-4 py-2 sm:px-6 sm:py-3 md:px-8 md:py-4 text-sm sm:text-base'
                      } ${theme === 'dark' ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-indigo-500 hover:bg-indigo-600'} text-white rounded-[8px] font-semibold shadow-lg transition-all`}
                    >
                      <Settings className={
                        isFullscreen 
                          ? 'w-4 h-4 sm:w-6 sm:h-6 md:w-7 md:h-7' 
                          : 'w-4 h-4 sm:w-5 sm:h-5'
                      } />
                      <span>{t('buttons.settings')}</span>
                    </motion.button>
                  </>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* 预设时间快捷按钮已删除 - stopwatch模式不需要 */}
        </motion.div>
      </div>

      {/* 编辑时间模态框 */}
      <AnimatePresence>
        {showEditModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
            onClick={() => setShowEditModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className={`${theme === 'dark' ? 'bg-slate-900 border-slate-700' : 'bg-white border-gray-200'} border rounded-2xl shadow-2xl p-8 max-w-md w-full`}
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className={`text-2xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                  {t('modals.set_stopwatch')}
                </h2>
                <button
                  onClick={() => setShowEditModal(false)}
                  className={`p-2 ${theme === 'dark' ? 'hover:bg-slate-800' : 'hover:bg-gray-100'} rounded-lg transition-colors`}
                >
                  <X className={`w-5 h-5 ${theme === 'dark' ? 'text-slate-400' : 'text-gray-600'}`} />
                </button>
              </div>

              <div className="space-y-4 mb-6">
                <div>
                  <label className={`block text-sm font-medium ${theme === 'dark' ? 'text-slate-300' : 'text-gray-700'} mb-2`}>
                    {t('modals.minutes')}
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="999"
                    value={customMinutes}
                    onChange={(e) => setCustomMinutes(Math.max(0, parseInt(e.target.value) || 0))}
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      theme === 'dark' 
                        ? 'bg-slate-800 border-slate-700 text-white' 
                        : 'bg-white border-gray-300 text-gray-900'
                    }`}
                    style={{ 
                      WebkitTextFillColor: theme === 'dark' ? '#ffffff' : '#111827'
                    }}
                  />
                </div>

                <div>
                  <label className={`block text-sm font-medium ${theme === 'dark' ? 'text-slate-300' : 'text-gray-700'} mb-2`}>
                    {t('modals.seconds')}
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="59"
                    value={customSeconds}
                    onChange={(e) => setCustomSeconds(Math.min(59, Math.max(0, parseInt(e.target.value) || 0)))}
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      theme === 'dark' 
                        ? 'bg-slate-800 border-slate-700 text-white' 
                        : 'bg-white border-gray-300 text-gray-900'
                    }`}
                    style={{ 
                      WebkitTextFillColor: theme === 'dark' ? '#ffffff' : '#111827'
                    }}
                  />
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowEditModal(false)}
                  className={`flex-1 px-6 py-3 ${theme === 'dark' ? 'bg-slate-800 hover:bg-slate-700' : 'bg-gray-200 hover:bg-gray-300'} ${theme === 'dark' ? 'text-white' : 'text-gray-900'} rounded-lg font-semibold transition-colors`}
                >
                  {t('buttons.cancel')}
                </button>
                <button
                  onClick={applyCustomTime}
                  className="flex-1 px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-semibold transition-colors"
                >
                  {t('buttons.confirm')}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 添加闹钟模态框已删除 - stopwatch模式不需要 */}

      {/* 闹钟响铃模态框已删除 - stopwatch模式不需要 */}

      {/* 设置面板 */}
      <AnimatePresence>
        {showSettingsPanel && !isFullscreen && (
          <motion.div
            initial={{ opacity: 0, x: 300 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 300 }}
            transition={{ type: "spring", damping: 20 }}
            className="fixed right-4 top-20 bottom-4 z-40 w-80 flex flex-col"
          >
            <div className={`${theme === 'dark' ? 'bg-slate-900 border-slate-700' : 'bg-white border-gray-200'} border rounded-2xl shadow-2xl flex flex-col max-h-full overflow-hidden`}>
              {/* 固定头部 */}
              <div className="flex-shrink-0 flex justify-between items-center p-6 pb-4 border-b" style={{ borderColor: theme === 'dark' ? '#334155' : '#e5e7eb' }}>
                <h3 className={`text-xl font-bold ${theme === 'dark' ? 'text-white' : 'text-black'}`}>{t('settings_panel.title')}</h3>
                <button
                  onClick={() => setShowSettingsPanel(false)}
                  className={`p-2 ${theme === 'dark' ? 'hover:bg-slate-800' : 'hover:bg-gray-100'} rounded-lg transition-colors`}
                >
                  <X className={`w-5 h-5 ${theme === 'dark' ? 'text-slate-400' : 'text-gray-600'}`} />
                </button>
              </div>

              {/* 可滚动内容区域 */}
              <div className="flex-1 overflow-y-auto overflow-x-hidden p-6 pt-4 settings-scrollbar" style={{
                scrollbarWidth: 'thin',
                scrollbarColor: theme === 'dark' ? '#475569 #1e293b' : '#d1d5db #f1f5f9'
              }}>
              {/* 主题颜色选择 */}
              <div className="mb-6">
                <label className={`block text-sm font-medium ${theme === 'dark' ? 'text-slate-300' : 'text-gray-700'} mb-3`}>
                  {t('settings_panel.theme_color')}
                  {false && (
                    <span className={`ml-2 text-xs ${theme === 'dark' ? 'text-slate-400' : 'text-gray-500'}`}>
                      {t('settings_panel.large_small_card_different')}
                    </span>
                  )}
                </label>
                
                {/* 默认选项 */}
                <div className="mb-4">
                  {(() => {
                    // 根据当前主题确定默认颜色：白天模式为黑色，夜晚模式为白色
                    const defaultColor = theme === 'dark' ? 'white' : 'black';
                    const currentColor = stopwatchColor;
                    const isDefault = currentColor === defaultColor;
                    
                    return (
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          // 根据当前主题设置对应的默认颜色：白天模式为黑色，夜晚模式为白色
                          const defaultColorToSet = theme === 'dark' ? 'white' : 'black';
                          // 弹出确认对话框
                          setPendingThemeColor(defaultColorToSet);
                          setShowThemeColorConfirm(true);
                        }}
                        className={`w-full py-2 px-4 rounded-lg transition-all relative border-2 flex items-center justify-center gap-2 ${
                          theme === 'dark' ? 'border-slate-600' : 'border-gray-300'
                        } ${
                          isDefault
                            ? theme === 'dark'
                              ? 'bg-slate-700/50 border-slate-500 ring-2 ring-offset-2 ring-slate-500'
                              : 'bg-gray-100 border-gray-400 ring-2 ring-offset-2 ring-gray-400'
                            : theme === 'dark'
                            ? 'bg-slate-800 hover:bg-slate-700'
                            : 'bg-white hover:bg-gray-50'
                        }`}
                      >
                        <div 
                          className="w-6 h-6 rounded border-2 flex items-center justify-center"
                          style={{
                            backgroundColor: defaultColor === 'white' ? '#ffffff' : '#000000',
                            borderColor: theme === 'dark' ? '#475569' : '#cbd5e1'
                          }}
                        />
                        <span className={`text-sm font-medium ${
                          isDefault
                            ? theme === 'dark' ? 'text-white' : 'text-black'
                            : theme === 'dark' ? 'text-slate-300' : 'text-gray-700'
                        }`}>
                          {t('settings_panel.default')}
                        </span>
                        {isDefault && (
                          <div className={`absolute -top-1 -right-1 w-4 h-4 rounded-full border-2 border-white flex items-center justify-center ${
                            theme === 'dark' ? 'bg-white' : 'bg-black'
                          }`}>
                            <span className={`text-[10px] ${theme === 'dark' ? 'text-black' : 'text-white'}`}>✓</span>
                          </div>
                        )}
                      </button>
                    );
                  })()}
                </div>
                
                {/* 深色系 */}
                <p className={`text-xs mb-2 font-semibold ${theme === 'dark' ? 'text-slate-300' : 'text-gray-700'}`}>{t('settings_panel.dark_colors')}</p>
                <div className="grid grid-cols-7 gap-2 mb-4">
                  {THEME_COLORS.filter(c => ['blue', 'purple', 'green', 'red', 'magenta', 'indigo', 'teal', 'black'].includes(c.id)).map((color) => {
                    // 白天模式禁用白色，夜晚模式禁用黑色
                    const isDisabled = (theme === 'light' && color.id === 'white') || (theme === 'dark' && color.id === 'black');
                    // 根据当前模式判断是否选中
                    const isSelectedPrimary = stopwatchColor === color.id;
                    // 世界时间模式下，检查小卡片是否使用此颜色
                    const isSelectedSecondary = false;
                    
                    return (
                    <button
                      key={color.id}
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          if (!isDisabled) {
                            // 弹出确认对话框
                            setPendingThemeColor(color.id);
                            setShowThemeColorConfirm(true);
                          }
                        }}
                        disabled={isDisabled}
                        className={`w-10 h-10 rounded-sm transition-all relative border-2 ${
                          theme === 'dark' ? 'border-slate-600' : 'border-gray-300'
                        } ${
                          isDisabled 
                            ? 'opacity-30 cursor-not-allowed' 
                            : isSelectedPrimary 
                            ? 'ring-2 ring-offset-2 ring-blue-500 scale-110' 
                            : 'hover:scale-105'
                        }`}
                        style={{ 
                          background: color.gradient || color.color,
                        }}
                        title={isDisabled ? (theme === 'light' ? t('settings_panel.light_mode_unavailable') : t('settings_panel.dark_mode_unavailable')) : t(`colors.${color.key}`)}
                      >
                        {/* 小卡片颜色指示器 */}
                        {isSelectedSecondary && (
                          <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white" 
                            title={t('settings_panel.small_card_color')}
                          />
                        )}
                      </button>
                    );
                  })}
                </div>
                
                {/* 浅色系 */}
                <p className={`text-xs mb-2 font-semibold ${theme === 'dark' ? 'text-slate-300' : 'text-gray-700'}`}>{t('settings_panel.light_colors')}</p>
                <div className="grid grid-cols-7 gap-2 mb-4">
                  {THEME_COLORS.filter(c => ['cyan', 'orange', 'pink', 'yellow', 'lime', 'white'].includes(c.id)).map((color) => {
                    // 白天模式禁用白色，夜晚模式禁用黑色
                    const isDisabled = (theme === 'light' && color.id === 'white') || (theme === 'dark' && color.id === 'black');
                    // 根据当前模式判断是否选中
                    const isSelectedPrimary = stopwatchColor === color.id;
                    // 世界时间模式下，检查小卡片是否使用此颜色
                    const isSelectedSecondary = false;
                    
                    return (
                      <button
                        key={color.id}
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          if (!isDisabled) {
                            // 弹出确认对话框
                            setPendingThemeColor(color.id);
                            setShowThemeColorConfirm(true);
                          }
                        }}
                        disabled={isDisabled}
                        className={`w-10 h-10 rounded-sm transition-all relative border-2 ${
                          theme === 'dark' ? 'border-slate-600' : 'border-gray-300'
                        } ${
                          isDisabled 
                            ? 'opacity-30 cursor-not-allowed' 
                            : isSelectedPrimary 
                            ? 'ring-2 ring-offset-2 ring-blue-500 scale-110' 
                            : 'hover:scale-105'
                        }`}
                        style={{ 
                          background: color.gradient || color.color,
                        }}
                        title={isDisabled ? (theme === 'light' ? t('settings_panel.light_mode_unavailable') : t('settings_panel.dark_mode_unavailable')) : t(`colors.${color.key}`)}
                      >
                        {/* 小卡片颜色指示器 */}
                        {isSelectedSecondary && (
                          <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white" 
                            title={t('settings_panel.small_card_color')}
                          />
                        )}
                      </button>
                    );
                  })}
                </div>
                
                {/* 渐变色系 */}
                <p className={`text-xs mb-2 font-semibold ${theme === 'dark' ? 'text-slate-300' : 'text-gray-700'}`}>{t('settings_panel.gradient_colors')}</p>
                <div className="grid grid-cols-6 gap-2">
                  {THEME_COLORS.filter(c => ['sunset', 'ocean', 'forest', 'aurora', 'fire', 'candy'].includes(c.id)).map((color) => {
                    // 白天模式禁用白色，夜晚模式禁用黑色
                    const isDisabled = (theme === 'light' && color.id === 'white') || (theme === 'dark' && color.id === 'black');
                    // 根据当前模式判断是否选中
                    const isSelectedPrimary = stopwatchColor === color.id;
                    // 世界时间模式下，检查小卡片是否使用此颜色
                    const isSelectedSecondary = false;
                    
                    return (
                      <button
                        key={color.id}
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          if (!isDisabled) {
                            // 弹出确认对话框
                            setPendingThemeColor(color.id);
                            setShowThemeColorConfirm(true);
                          }
                        }}
                        disabled={isDisabled}
                        className={`w-10 h-10 rounded-sm transition-all relative border-2 ${
                          theme === 'dark' ? 'border-slate-600' : 'border-gray-300'
                        } ${
                          isDisabled 
                            ? 'opacity-30 cursor-not-allowed' 
                            : isSelectedPrimary 
                            ? 'ring-2 ring-offset-2 ring-blue-500 scale-110' 
                            : 'hover:scale-105'
                        }`}
                        style={{ 
                          background: color.gradient || color.color,
                        }}
                        title={isDisabled ? (theme === 'light' ? t('settings_panel.light_mode_unavailable') : t('settings_panel.dark_mode_unavailable')) : t(`colors.${color.key}`)}
                      >
                        {/* 小卡片颜色指示器 */}
                        {isSelectedSecondary && (
                          <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white" 
                            title={t('settings_panel.small_card_color')}
                          />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 提示音选择 */}
              <NotificationSoundSelector
                selectedSound={selectedSound}
                setSelectedSound={setSelectedSound}
                soundOptions={SOUND_OPTIONS}
                soundUsageStats={soundUsageStats}
                setSoundUsageStats={setSoundUsageStats}
                theme={theme}
                locale={locale}
                t={t}
                playNotificationSound={playNotificationSound}
              />

              {/* 背景自定义 */}
              <div className="mb-6">
                <label className={`block text-sm font-medium ${theme === 'dark' ? 'text-slate-300' : 'text-gray-700'} mb-3`}>
                  {t('settings_panel.background_customization')}
                </label>
                
                {/* 背景类型选择 */}
                <div className="flex gap-2 mb-4">
                  <button
                    onClick={() => setBackgroundType('default')}
                    className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all ${
                      backgroundType === 'default'
                        ? theme === 'dark'
                          ? 'bg-blue-600 text-white'
                          : 'bg-blue-500 text-white'
                        : theme === 'dark'
                          ? 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {t('settings_panel.default')}
                  </button>
                  <button
                    onClick={() => setBackgroundType('color')}
                    className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all ${
                      backgroundType === 'color'
                        ? theme === 'dark'
                          ? 'bg-blue-600 text-white'
                          : 'bg-blue-500 text-white'
                        : theme === 'dark'
                          ? 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {t('settings_panel.color')}
                  </button>
                  <button
                    onClick={() => setBackgroundType('image')}
                    className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all ${
                      backgroundType === 'image'
                        ? theme === 'dark'
                          ? 'bg-blue-600 text-white'
                          : 'bg-blue-500 text-white'
                        : theme === 'dark'
                          ? 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {t('settings_panel.image')}
                  </button>
                </div>

                {/* 背景色选择 */}
                {backgroundType === 'color' && (
                  <div>
                    {/* 当前背景状态和应用选项 */}
                    {backgroundColor && (
                      <div className="mb-4 p-3 rounded-lg border border-gray-300 dark:border-slate-600">
                        <div className="flex items-center gap-2 mb-2">
                          <div 
                            className="w-6 h-6 rounded border border-gray-300"
                            style={{ backgroundColor: backgroundColor }}
                          />
                          <span className={`text-sm font-medium ${theme === 'dark' ? 'text-slate-300' : 'text-gray-700'}`}>
                            {t('settings_panel.current_background_color')}
                          </span>
                        </div>
                        <p className={`text-xs mb-3 ${theme === 'dark' ? 'text-slate-400' : 'text-gray-600'}`}>
                          {applyColorToAllPages ? t('settings_panel.color_applied_all') : t('settings_panel.color_applied_current', { pageName: t(`modes.${mode}`) })}
                        </p>
                        <div className="flex gap-2">
                          <button
                            onClick={() => {
                              setApplyColorToAllPages(true);
                              // 立即保存到localStorage
                              localStorage.setItem('timer-background-color', backgroundColor);
                              toast.success(t('settings_panel.background_applied_all'));
                            }}
                            className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all ${
                              applyColorToAllPages 
                                ? theme === 'dark'
                                  ? 'bg-blue-600 text-white'
                                  : 'bg-blue-500 text-white'
                                : theme === 'dark'
                                  ? 'bg-green-600 hover:bg-green-700 text-white'
                                  : 'bg-green-500 hover:bg-green-600 text-white'
                            }`}
                          >
                            {applyColorToAllPages ? t('settings_panel.apply_to_all_pages') : t('settings_panel.apply_to_all_pages')}
                          </button>
                          <button
                            onClick={() => {
                              setApplyColorToAllPages(false);
                              // 保存到当前模式的localStorage
                              localStorage.setItem(`timer-background-color-${mode}`, backgroundColor);
                              
                              // 清除其他功能页面的背景设置
                              const allModes = ['stopwatch'];
                              allModes.forEach(modeKey => {
                                if (modeKey !== mode) {
                                  localStorage.removeItem(`timer-background-color-${modeKey}`);
                                }
                              });
                              
                              // 清除通用背景设置
                              localStorage.removeItem('timer-background-color');
                              
                              // 根据背景类型设置主题和其他页面的默认背景
                              const isLightBackground = isLightColor(backgroundColor);
                              setTimeout(() => {
                                if (isLightBackground) {
                                  // 浅色背景：设置为白天模式，其他页面使用浅色默认背景
                                  if (theme !== 'light') setTheme('light');
                                  // 为其他页面设置浅色默认背景
                                  allModes.forEach(modeKey => {
                                    if (modeKey !== mode) {
                                      localStorage.setItem(`timer-background-color-${modeKey}`, '#f8fafc'); // 浅色默认背景
                                    }
                                  });
                                } else {
                                  // 深色背景：设置为夜间模式，其他页面使用深色默认背景
                                  if (theme !== 'dark') setTheme('dark');
                                  // 为其他页面设置深色默认背景
                                  allModes.forEach(modeKey => {
                                    if (modeKey !== mode) {
                                      localStorage.setItem(`timer-background-color-${modeKey}`, '#1e293b'); // 深色默认背景
                                    }
                                  });
                                }
                              }, 0);
                              
                              const pageName = t(`modes.${mode}`);
                              const themeText = isLightBackground ? t('settings_panel.light_mode') : t('settings_panel.dark_mode');
                              toast.success(t('settings_panel.background_applied_to_current_page', { pageName, themeText }));
                            }}
                            className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all ${
                              !applyColorToAllPages 
                                ? theme === 'dark'
                                  ? 'bg-blue-600 text-white'
                                  : 'bg-blue-500 text-white'
                                : theme === 'dark'
                                  ? 'bg-slate-700 hover:bg-slate-600 text-white'
                                  : 'bg-gray-200 hover:bg-gray-300 text-gray-900'
                            }`}
                          >
                            {!applyColorToAllPages ? t('settings_panel.apply_to_current_page') : t('settings_panel.apply_to_current_page')}
                          </button>
                        </div>
                      </div>
                    )}
                    {/* 深色系背景 */}
                    <p className={`text-xs mb-2 font-semibold ${theme === 'dark' ? 'text-slate-300' : 'text-gray-700'}`}>{t('settings_panel.dark_colors')}</p>
                    <div className="grid grid-cols-6 gap-2 mb-4">
                      {[
                        '#1e293b', '#0f172a', '#1e1b4b', '#1f2937', '#18181b',
                        '#164e63', '#1e40af', '#6b21a8', '#831843', '#991b1b',
                        '#713f12', '#065f46', '#134e4a', '#0c4a6e', '#581c87'
                      ].map((color) => (
                        <button
                          key={color}
                          onClick={() => {
                            setPendingBackgroundColor(color);
                            setShowColorBackgroundConfirm(true);
                          }}
                          className={`aspect-square h-10 rounded-sm transition-all border-2 ${
                            theme === 'dark' ? 'border-slate-600' : 'border-gray-300'
                          } ${
                            backgroundColor === color ? 'ring-2 ring-offset-2 ring-blue-500 scale-110' : 'hover:scale-105'
                          }`}
                          style={{ backgroundColor: color }}
                          title={color}
                        />
                      ))}
                    </div>
                    
                    {/* 浅色系背景 */}
                    <p className={`text-xs mb-2 font-semibold ${theme === 'dark' ? 'text-slate-300' : 'text-gray-700'}`}>{t('settings_panel.light_colors')}</p>
                    <div className="grid grid-cols-6 gap-2 mb-4">
                      {[
                        '#f8fafc', '#f1f5f9', '#e0e7ff', '#dbeafe', '#e0f2fe',
                        '#cffafe', '#d1fae5', '#dcfce7', '#fef9c3', '#fef3c7',
                        '#ffe4e6', '#fce7f3', '#f3e8ff', '#fae8ff', '#fdf4ff'
                      ].map((color) => (
                        <button
                          key={color}
                          onClick={() => {
                            setPendingBackgroundColor(color);
                            setShowColorBackgroundConfirm(true);
                          }}
                          className={`aspect-square h-10 rounded-sm transition-all border-2 ${
                            theme === 'dark' ? 'border-slate-600' : 'border-gray-300'
                          } ${
                            backgroundColor === color ? 'ring-2 ring-offset-2 ring-blue-500 scale-110' : 'hover:scale-105'
                          }`}
                          style={{ backgroundColor: color }}
                          title={color}
                        />
                      ))}
                    </div>
                    
                    {/* 自定义颜色输入 */}
                    <p className={`text-xs mb-2 font-semibold ${theme === 'dark' ? 'text-slate-300' : 'text-gray-700'}`}>{t('settings_panel.custom_color')}</p>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={backgroundColor}
                        onChange={(e) => {
                          setPendingBackgroundColor(e.target.value);
                          setShowColorBackgroundConfirm(true);
                        }}
                        className="w-12 h-10 rounded-lg cursor-pointer"
                      />
                      <input
                        type="text"
                        value={backgroundColor}
                        onChange={(e) => {
                          setPendingBackgroundColor(e.target.value);
                          setShowColorBackgroundConfirm(true);
                        }}
                        className={`flex-1 px-3 py-2 rounded-lg text-sm ${
                          theme === 'dark'
                            ? 'bg-slate-800 border-slate-700 text-white'
                            : 'bg-gray-50 border-gray-300 text-gray-900'
                        } border`}
                        placeholder="#1e293b"
                      />
                    </div>
                  </div>
                )}

                {/* 图片上传 */}
                {backgroundType === 'image' && (
                  <div>
                    {/* 当前背景状态和应用选项 */}
                    {backgroundImage && (
                      <div className="mb-4 p-3 rounded-lg border border-gray-300 dark:border-slate-600">
                        <div className="flex items-center gap-2 mb-2">
                          <img
                            src={backgroundImage}
                            alt="Current background"
                            className="w-6 h-6 rounded border border-gray-300 object-cover"
                          />
                          <span className={`text-sm font-medium ${theme === 'dark' ? 'text-slate-300' : 'text-gray-700'}`}>
                            当前背景图片
                          </span>
                        </div>
                        <p className={`text-xs mb-3 ${theme === 'dark' ? 'text-slate-400' : 'text-gray-600'}`}>
                          {applyToAllPages ? t('settings_panel.color_applied_all') : t('settings_panel.color_applied_current', { pageName: t(`modes.${mode}`) })}
                        </p>
                        <div className="flex gap-2">
                          <button
                            onClick={async () => {
                              setApplyToAllPages(true);
                              // 立即保存到localStorage
                              localStorage.setItem('timer-background-image', backgroundImage);
                              
                              // 分析图片亮度并自动设置主题
                              const isLightImage = await analyzeImageBrightness(backgroundImage);
                              setTimeout(() => {
                                if (isLightImage) {
                                  // 浅色图片：设置为白天模式
                                  if (theme !== 'light') setTheme('light');
                                } else {
                                  // 深色图片：设置为夜间模式
                                  if (theme !== 'dark') setTheme('dark');
                                }
                              }, 0);
                              
                              toast.success(t('settings_panel.background_applied_all'));
                            }}
                            className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all ${
                              applyToAllPages 
                                ? theme === 'dark'
                                  ? 'bg-blue-600 text-white'
                                  : 'bg-blue-500 text-white'
                                : theme === 'dark'
                                  ? 'bg-green-600 hover:bg-green-700 text-white'
                                  : 'bg-green-500 hover:bg-green-600 text-white'
                            }`}
                          >
                            {applyToAllPages ? t('settings_panel.apply_to_all_pages') : t('settings_panel.apply_to_all_pages')}
                          </button>
                          <button
                            onClick={async () => {
                              setApplyToAllPages(false);
                              // 保存到当前模式的localStorage
                              localStorage.setItem(`timer-background-image-${mode}`, backgroundImage);
                              
                              // 清除其他功能页面的背景设置
                              const allModes = ['stopwatch'];
                              allModes.forEach(modeKey => {
                                if (modeKey !== mode) {
                                  localStorage.removeItem(`timer-background-image-${modeKey}`);
                                }
                              });
                              
                              // 清除通用背景设置
                              localStorage.removeItem('timer-background-image');
                              
                              // 根据图片亮度设置主题和其他页面的默认背景
                              const isLightImage = await analyzeImageBrightness(backgroundImage);
                              setTimeout(() => {
                                if (isLightImage) {
                                  // 浅色图片：设置为白天模式，其他页面使用浅色默认背景
                                  if (theme !== 'light') setTheme('light');
                                  // 为其他页面设置浅色默认背景
                                  allModes.forEach(modeKey => {
                                    if (modeKey !== mode) {
                                      localStorage.setItem(`timer-background-color-${modeKey}`, '#f8fafc'); // 浅色默认背景
                                    }
                                  });
                                } else {
                                  // 深色图片：设置为夜间模式，其他页面使用深色默认背景
                                  if (theme !== 'dark') setTheme('dark');
                                  // 为其他页面设置深色默认背景
                                  allModes.forEach(modeKey => {
                                    if (modeKey !== mode) {
                                      localStorage.setItem(`timer-background-color-${modeKey}`, '#1e293b'); // 深色默认背景
                                    }
                                  });
                                }
                              }, 0);
                              
                              const pageName = t(`modes.${mode}`);
                              const themeText = isLightImage ? t('settings_panel.light_mode') : t('settings_panel.dark_mode');
                              toast.success(t('settings_panel.background_applied_to_current_page', { pageName, themeText }));
                            }}
                            className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all ${
                              !applyToAllPages 
                                ? theme === 'dark'
                                  ? 'bg-blue-600 text-white'
                                  : 'bg-blue-500 text-white'
                                : theme === 'dark'
                                  ? 'bg-slate-700 hover:bg-slate-600 text-white'
                                  : 'bg-gray-200 hover:bg-gray-300 text-gray-900'
                            }`}
                          >
                            {!applyToAllPages ? t('settings_panel.apply_to_current_page') : t('settings_panel.apply_to_current_page')}
                          </button>
                        </div>
                      </div>
                    )}
                    <p className={`text-xs mb-2 ${theme === 'dark' ? 'text-slate-400' : 'text-gray-600'}`}>{t('settings_panel.upload_image')}</p>
                    
                    {/* 上传图片历史记录 */}
                    {uploadedImageHistory.length > 0 && (
                      <div className="mb-4">
                        <p className={`text-xs mb-2 font-semibold ${theme === 'dark' ? 'text-slate-300' : 'text-gray-700'}`}>
                          {t('settings_panel.image_history')}
                        </p>
                        <div className="grid grid-cols-3 gap-2">
                          {uploadedImageHistory.map((imageUrl, index) => (
                            <div key={index} className="relative group">
                              <img
                                src={imageUrl}
                                alt={`历史图片 ${index + 1}`}
                                className="w-full h-16 object-cover rounded-lg cursor-pointer hover:opacity-80 transition-opacity"
                                onClick={() => {
                                  setPendingBackgroundImage(imageUrl);
                                  setShowBackgroundConfirm(true);
                                }}
                                title="点击使用此图片"
                              />
                              {/* 快速应用按钮 */}
                              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                                <div className="flex flex-col gap-1">
                                  <button
                                    onClick={async (e) => {
                                      e.stopPropagation();
                                      
                                      // 完全独立的历史图片设置逻辑 - 应用到所有页面
                                      const allModes = ['stopwatch'];
                                      
                                      // 1. 清除所有特定模式的背景设置
                                      allModes.forEach(modeKey => {
                                        localStorage.removeItem(`timer-background-image-${modeKey}`);
                                      });
                                      
                                      // 2. 保存到通用localStorage
                                      localStorage.setItem('timer-background-image', imageUrl);
                                      
                                      // 3. 强制设置状态
                                      setBackgroundImage(imageUrl);
                                      setApplyToAllPages(true);
                                      
                                      // 4. 根据图片亮度设置主题
                                      const isLightImage = await analyzeImageBrightness(imageUrl);
                                      
                                      if (isLightImage) {
                                        // 浅色图片：设置为白天模式
                                        if (theme !== 'light') setTheme('light');
                                      } else {
                                        // 深色图片：设置为夜间模式
                                        if (theme !== 'dark') setTheme('dark');
                                      }
                                      
                                      toast.success(t('settings_panel.history_image_applied_all'));
                                    }}
                                    className="px-2 py-1 bg-blue-500 hover:bg-blue-600 text-white text-xs rounded transition-colors"
                                    title={t('settings_panel.apply_to_all_pages')}
                                  >
                                    {t('settings_panel.apply_to_all_pages')}
                                  </button>
                                  <button
                                    onClick={async (e) => {
                                      e.stopPropagation();
                                      
                                      // 完全独立的历史图片设置逻辑，不依赖任何状态检测
                                      const allModes = ['stopwatch'];
                                      
                                      // 1. 清除所有其他页面的背景设置
                                      allModes.forEach(modeKey => {
                                        if (modeKey !== mode) {
                                          localStorage.removeItem(`timer-background-image-${modeKey}`);
                                        }
                                      });
                                      
                                      // 2. 清除通用背景设置
                                      localStorage.removeItem('timer-background-image');
                                      
                                      // 3. 保存到当前模式的localStorage
                                      localStorage.setItem(`timer-background-image-${mode}`, imageUrl);
                                      
                                      // 4. 强制设置状态，不依赖任何检测逻辑
                                      setBackgroundImage(imageUrl);
                                      setApplyToAllPages(false);
                                      
                                      // 5. 根据图片亮度设置主题和其他页面的默认背景
                                      const isLightImage = await analyzeImageBrightness(imageUrl);
                                      
                                      // 添加调试信息
                                      console.log('Image brightness analysis result:', isLightImage ? 'Light image' : 'Dark image');
                                      console.log('Current theme:', theme);
                                      
                                      // 检查用户是否手动设置了主题
                                      const userManualTheme = localStorage.getItem(`timer-manual-theme-${mode}`);
                                      const hasUserManualTheme = userManualTheme !== null;
                                      
                                      if (hasUserManualTheme) {
                                        console.log('用户已手动设置主题，跳过自动主题设置');
                                        // 用户手动设置了主题，不自动设置主题，但仍设置其他页面的默认背景
                                        if (isLightImage) {
                                          // 为其他页面设置浅色默认背景
                                          allModes.forEach(modeKey => {
                                            if (modeKey !== mode) {
                                              localStorage.setItem(`timer-background-color-${modeKey}`, '#f8fafc'); // 浅色默认背景
                                            }
                                          });
                                        } else {
                                          // 为其他页面设置深色默认背景
                                          allModes.forEach(modeKey => {
                                            if (modeKey !== mode) {
                                              localStorage.setItem(`timer-background-color-${modeKey}`, '#1e293b'); // 深色默认背景
                                            }
                                          });
                                        }
                                      } else {
                                        // 用户没有手动设置主题，自动设置主题
                                        if (isLightImage) {
                                          // 浅色图片：设置为白天模式，其他页面使用浅色默认背景
                                          console.log('Setting theme to light mode');
                                          if (theme !== 'light') setTheme('light');
                                          // 为其他页面设置浅色默认背景
                                          allModes.forEach(modeKey => {
                                            if (modeKey !== mode) {
                                              localStorage.setItem(`timer-background-color-${modeKey}`, '#f8fafc'); // 浅色默认背景
                                            }
                                          });
                                        } else {
                                          // 深色图片：设置为夜间模式，其他页面使用深色默认背景
                                          console.log('Setting theme to dark mode');
                                          if (theme !== 'dark') setTheme('dark');
                                          // 为其他页面设置深色默认背景
                                          allModes.forEach(modeKey => {
                                            if (modeKey !== mode) {
                                              localStorage.setItem(`timer-background-color-${modeKey}`, '#1e293b'); // 深色默认背景
                                            }
                                          });
                                        }
                                      }
                                      
                                      const pageName = t('modes.stopwatch');
                                      const themeText = isLightImage ? t('settings_panel.light_mode') : t('settings_panel.dark_mode');
                                      toast.success(t('settings_panel.history_image_applied_current', { pageName, themeText }));
                                    }}
                                    className="px-2 py-1 bg-green-500 hover:bg-green-600 text-white text-xs rounded transition-colors"
                                    title={t('settings_panel.apply_to_current_page')}
                                  >
                                    {t('settings_panel.apply_to_current_page')}
                                  </button>
                                </div>
                              </div>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleRemoveFromImageHistory(imageUrl);
                                }}
                                className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full text-xs hover:bg-red-600 transition-colors opacity-0 group-hover:opacity-100"
                                title="删除此图片"
                              >
                                ×
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    <div className="space-y-3">
                      {!backgroundImage ? (
                        <div 
                          onClick={() => {
                            const input = document.getElementById('background-image-upload') as HTMLInputElement;
                            input?.click();
                          }}
                          className={`relative w-full border-2 border-dashed rounded-lg p-8 cursor-pointer transition-all ${
                            theme === 'dark' 
                              ? 'border-slate-600 hover:border-slate-500 bg-slate-800/30 hover:bg-slate-800/50' 
                              : 'border-gray-300 hover:border-gray-400 bg-gray-50 hover:bg-gray-100'
                          }`}
                        >
                          <div className="flex flex-col items-center justify-center gap-2">
                            <div className={`p-3 rounded-full ${
                              theme === 'dark' ? 'bg-slate-700' : 'bg-gray-200'
                            }`}>
                              <svg 
                                className={`w-6 h-6 ${theme === 'dark' ? 'text-slate-400' : 'text-gray-500'}`} 
                                fill="none" 
                                stroke="currentColor" 
                                viewBox="0 0 24 24"
                              >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                            </div>
                            <div className="text-center">
                              <p className={`text-sm font-medium ${
                                theme === 'dark' ? 'text-slate-300' : 'text-gray-700'
                              }`}>
                                {t('settings_panel.click_to_select_image')}
                              </p>
                              <p className={`text-xs mt-1 ${
                                theme === 'dark' ? 'text-slate-500' : 'text-gray-500'
                              }`}>
                                {t('settings_panel.supported_formats')}
                              </p>
                            </div>
                          </div>
                          <input
                            id="background-image-upload"
                            type="file"
                            accept="image/*"
                            onChange={async (e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                try {
                                  // 压缩和缩放图片
                                  const compressedImageUrl = await compressAndResizeImage(file);
                                  
                                  // 添加到历史记录
                                  handleAddToImageHistory(compressedImageUrl);
                                  
                                  // 保存待确认的图片并显示确认对话框
                                  setPendingBackgroundImage(compressedImageUrl);
                                  setShowBackgroundConfirm(true);
                                } catch (error) {
                                  console.error('Image processing failed:', error);
                                  toast.error(t('settings_panel.image_processing_failed'));
                                }
                              }
                            }}
                            className="hidden"
                          />
                        </div>
                      ) : (
                        <div className="space-y-3">
                          <div className="relative">
                            <img
                              src={backgroundImage}
                              alt="Background preview"
                              className="w-full h-32 object-cover rounded-lg"
                            />
                            <div className="absolute top-2 right-2 flex gap-2">
                              <button
                                onClick={() => {
                                  const input = document.getElementById('background-image-upload') as HTMLInputElement;
                                  input?.click();
                                }}
                                className={`p-1.5 rounded-full ${
                                  theme === 'dark' ? 'bg-slate-900/80 text-white' : 'bg-white/80 text-gray-900'
                                } hover:scale-110 transition-all`}
                                title={t('settings_panel.change_image')}
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                              </button>
                              <button
                                onClick={() => setBackgroundImage('')}
                                className={`p-1.5 rounded-full ${
                                  theme === 'dark' ? 'bg-slate-900/80 text-white' : 'bg-white/80 text-gray-900'
                                } hover:scale-110 transition-all`}
                                title="删除图片"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                          
                          {/* 图片位置调整 */}
                          <div className={`p-3 rounded-lg ${
                            theme === 'dark' ? 'bg-slate-800/50' : 'bg-gray-100'
                          }`}>
                            <p className={`text-xs font-medium mb-3 ${
                              theme === 'dark' ? 'text-slate-300' : 'text-gray-700'
                            }`}>
                              {t('settings_panel.image_position')}
                            </p>
                            
                            {/* 水平位置 */}
                            <div className="mb-3">
                              <div className="flex items-center justify-between mb-1">
                                <label className={`text-xs ${
                                  theme === 'dark' ? 'text-slate-400' : 'text-gray-600'
                                }`}>
                                  {t('settings_panel.horizontal')}
                                </label>
                                <span className={`text-xs ${
                                  theme === 'dark' ? 'text-slate-400' : 'text-gray-600'
                                }`}>
                                  {imagePositionX}%
                                </span>
                              </div>
                              <input
                                type="range"
                                min="0"
                                max="100"
                                value={imagePositionX}
                                onChange={(e) => setImagePositionX(Number(e.target.value))}
                                className="w-full h-2 rounded-lg appearance-none cursor-pointer"
                                style={{
                                  background: `linear-gradient(to right, ${theme === 'dark' ? '#3b82f6' : '#2563eb'} 0%, ${theme === 'dark' ? '#3b82f6' : '#2563eb'} ${imagePositionX}%, ${theme === 'dark' ? '#334155' : '#d1d5db'} ${imagePositionX}%, ${theme === 'dark' ? '#334155' : '#d1d5db'} 100%)`
                                }}
                              />
                            </div>
                            
                            {/* 垂直位置 */}
                            <div className="mb-3">
                              <div className="flex items-center justify-between mb-1">
                                <label className={`text-xs ${
                                  theme === 'dark' ? 'text-slate-400' : 'text-gray-600'
                                }`}>
                                  {t('settings_panel.vertical')}
                                </label>
                                <span className={`text-xs ${
                                  theme === 'dark' ? 'text-slate-400' : 'text-gray-600'
                                }`}>
                                  {imagePositionY}%
                                </span>
                              </div>
                              <input
                                type="range"
                                min="0"
                                max="100"
                                value={imagePositionY}
                                onChange={(e) => setImagePositionY(Number(e.target.value))}
                                className="w-full h-2 rounded-lg appearance-none cursor-pointer"
                                style={{
                                  background: `linear-gradient(to right, ${theme === 'dark' ? '#3b82f6' : '#2563eb'} 0%, ${theme === 'dark' ? '#3b82f6' : '#2563eb'} ${imagePositionY}%, ${theme === 'dark' ? '#334155' : '#d1d5db'} ${imagePositionY}%, ${theme === 'dark' ? '#334155' : '#d1d5db'} 100%)`
                                }}
                              />
                            </div>
                            
                            {/* 重置按钮 */}
                            <button
                              onClick={() => {
                                setImagePositionX(50);
                                setImagePositionY(50);
                              }}
                              className={`w-full py-2 px-3 rounded-lg text-xs font-medium transition-all ${
                                theme === 'dark'
                                  ? 'bg-slate-700 hover:bg-slate-600 text-slate-300'
                                  : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                              }`}
                            >
                              重置到居中
                            </button>
                          </div>
                          <input
                            id="background-image-upload"
                            type="file"
                            accept="image/*"
                            onChange={async (e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                try {
                                  // 压缩和缩放图片
                                  const compressedImageUrl = await compressAndResizeImage(file);
                                  
                                  // 添加到历史记录
                                  handleAddToImageHistory(compressedImageUrl);
                                  
                                  // 保存待确认的图片并显示确认对话框
                                  setPendingBackgroundImage(compressedImageUrl);
                                  setShowBackgroundConfirm(true);
                                } catch (error) {
                                  console.error('Image processing failed:', error);
                                  toast.error(t('settings_panel.image_processing_failed'));
                                }
                              }
                            }}
                            className="hidden"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* 显示控制开关组 */}
              <div className="space-y-4">
                {/* 进度环开关 */}
                <div className="flex items-center justify-between">
                  <label className={`text-sm font-medium ${theme === 'dark' ? 'text-slate-300' : 'text-gray-700'}`}>
                    {t('settings_panel.show_progress')}
                  </label>
                  <button
                    onClick={() => setProgressVisible(!progressVisible)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      progressVisible ? 'bg-blue-500' : theme === 'dark' ? 'bg-slate-700' : 'bg-gray-300'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        progressVisible ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>

                {/* 天气图标开关 */}
                <div className="flex items-center justify-between">
                  <label className={`text-sm font-medium ${theme === 'dark' ? 'text-slate-300' : 'text-gray-700'}`}>
                    {t('settings_panel.show_weather_icon')}
                  </label>
                  <button
                    onClick={() => setShowWeatherIcon(!showWeatherIcon)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      showWeatherIcon ? 'bg-blue-500' : theme === 'dark' ? 'bg-slate-700' : 'bg-gray-300'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        showWeatherIcon ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>

                {/* 气温开关 */}
                <div className="flex items-center justify-between">
                  <label className={`text-sm font-medium ${theme === 'dark' ? 'text-slate-300' : 'text-gray-700'}`}>
                    {t('settings_panel.show_temperature')}
                  </label>
                  <button
                    onClick={() => setShowTemperature(!showTemperature)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      showTemperature ? 'bg-blue-500' : theme === 'dark' ? 'bg-slate-700' : 'bg-gray-300'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        showTemperature ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>

                {/* 日期开关 */}
                <div className="flex items-center justify-between">
                  <label className={`text-sm font-medium ${theme === 'dark' ? 'text-slate-300' : 'text-gray-700'}`}>
                    {t('settings_panel.show_date')}
                  </label>
                  <button
                    onClick={() => setShowDate(!showDate)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      showDate ? 'bg-blue-500' : theme === 'dark' ? 'bg-slate-700' : 'bg-gray-300'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        showDate ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>

                {/* 周几开关 */}
                <div className="flex items-center justify-between">
                  <label className={`text-sm font-medium ${theme === 'dark' ? 'text-slate-300' : 'text-gray-700'}`}>
                    {t('settings_panel.show_weekday')}
                  </label>
                  <button
                    onClick={() => setShowWeekday(!showWeekday)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      showWeekday ? 'bg-blue-500' : theme === 'dark' ? 'bg-slate-700' : 'bg-gray-300'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        showWeekday ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* 时区选择模态框已删除 - stopwatch模式不需要 */}

      {/* 倒计时结束弹窗已删除 - stopwatch模式不需要 */}
      </div>

      {/* 世界时间颜色修改确认对话框已删除 - stopwatch模式不需要 */}

      {/* 背景应用确认对话框 */}
      <AnimatePresence>
        {showBackgroundConfirm && pendingBackgroundImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[60] p-4"
            onClick={() => {
              setShowBackgroundConfirm(false);
              setPendingBackgroundImage('');
            }}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className={`w-full max-w-md rounded-2xl shadow-2xl p-6 ${
                theme === 'dark' ? 'bg-slate-800 border border-slate-700' : 'bg-white border border-gray-200'
              }`}
            >
              <h3 className={`text-xl font-bold mb-4 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                应用背景图片
              </h3>
              
              {/* 图片预览 */}
              <div className={`mb-6 p-4 rounded-lg ${theme === 'dark' ? 'bg-slate-900' : 'bg-gray-50'}`}>
                <img
                  src={pendingBackgroundImage}
                  alt="Background preview"
                  className="w-full h-32 object-cover rounded-lg mb-3"
                />
                <p className={`text-sm ${theme === 'dark' ? 'text-slate-400' : 'text-gray-600'}`}>
                  选择应用范围：
                </p>
              </div>
              
              {/* 选项说明 */}
              <div className={`mb-6 p-4 rounded-lg ${theme === 'dark' ? 'bg-blue-500/10' : 'bg-blue-50'}`}>
                <div className="flex items-start gap-2 mb-3">
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
                    theme === 'dark' ? 'bg-blue-500' : 'bg-blue-600'
                  }`}>
                    <span className="text-white text-xs font-bold">1</span>
                  </div>
                  <div className="flex-1">
                    <p className={`text-sm font-medium ${theme === 'dark' ? 'text-blue-300' : 'text-blue-700'}`}>
                      所有页面
                    </p>
                    <p className={`text-xs mt-1 ${theme === 'dark' ? 'text-blue-400/70' : 'text-blue-600/70'}`}>
                      计时器、秒表、闹钟、世界时间都使用此背景
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
                    theme === 'dark' ? 'bg-slate-600' : 'bg-gray-400'
                  }`}>
                    <span className="text-white text-xs font-bold">2</span>
                  </div>
                  <div className="flex-1">
                    <p className={`text-sm font-medium ${theme === 'dark' ? 'text-slate-300' : 'text-gray-700'}`}>
                      仅当前页面
                    </p>
                    <p className={`text-xs mt-1 ${theme === 'dark' ? 'text-slate-400' : 'text-gray-600'}`}>
                      只在秒表页面使用此背景
                    </p>
                  </div>
                </div>
              </div>
              
              {/* 按钮 */}
              <div className="space-y-3">
                <button
                  onClick={async () => {
                    // 应用到所有页面
                    console.log('User selected "Apply to all pages"');
                    setApplyToAllPages(true);
                    setBackgroundImage(pendingBackgroundImage);
                    
                    // 保存到localStorage
                    localStorage.setItem('timer-background-image', pendingBackgroundImage);
                    
                    // 分析图片亮度并自动设置主题
                    const isLight = await analyzeImageBrightness(pendingBackgroundImage);
                    setTimeout(() => {
                      if (isLight) {
                        if (theme !== 'light') setTheme('light');
                      } else {
                        if (theme !== 'dark') setTheme('dark');
                      }
                    }, 0);
                    
                    setShowBackgroundConfirm(false);
                    setPendingBackgroundImage('');
                    toast.success(t('settings_panel.background_applied_all'));
                  }}
                  className={`w-full py-3 px-4 rounded-lg font-medium transition-all ${
                    theme === 'dark'
                      ? 'bg-blue-600 hover:bg-blue-700 text-white'
                      : 'bg-blue-500 hover:bg-blue-600 text-white'
                  }`}
                >
                  {t('settings_panel.apply_to_all')}
                </button>
                <button
                  onClick={async () => {
                    // 仅应用到当前页面
                    console.log('User selected "Apply to current page only"');
                    setApplyToAllPages(false);
                    setBackgroundImage(pendingBackgroundImage);
                    
                    // 清除其他功能页面的背景设置
                    const allModes = ['stopwatch'];
                    allModes.forEach(modeKey => {
                      if (modeKey !== mode) {
                        localStorage.removeItem(`timer-background-image-${modeKey}`);
                      }
                    });
                    
                    // 清除通用背景设置
                    localStorage.removeItem('timer-background-image');
                    
                    // 分析图片亮度并自动设置主题和其他页面的默认背景
                    const isLight = await analyzeImageBrightness(pendingBackgroundImage);
                    setTimeout(() => {
                      if (isLight) {
                        // 浅色图片：设置为白天模式，其他页面使用浅色默认背景
                        if (theme !== 'light') setTheme('light');
                        // 为其他页面设置浅色默认背景
                        allModes.forEach(modeKey => {
                          if (modeKey !== mode) {
                            localStorage.setItem(`timer-background-color-${modeKey}`, '#f8fafc'); // 浅色默认背景
                          }
                        });
                      } else {
                        // 深色图片：设置为夜间模式，其他页面使用深色默认背景
                        if (theme !== 'dark') setTheme('dark');
                        // 为其他页面设置深色默认背景
                        allModes.forEach(modeKey => {
                          if (modeKey !== mode) {
                            localStorage.setItem(`timer-background-color-${modeKey}`, '#1e293b'); // 深色默认背景
                          }
                        });
                      }
                    }, 0);
                    
                    setShowBackgroundConfirm(false);
                    setPendingBackgroundImage('');
                    const pageName = t(`modes.${mode}`);
                    toast.success(t('settings_panel.background_applied_to_page', { pageName }));
                  }}
                  className={`w-full py-3 px-4 rounded-lg font-medium transition-all ${
                    theme === 'dark'
                      ? 'bg-slate-700 hover:bg-slate-600 text-white'
                      : 'bg-gray-200 hover:bg-gray-300 text-gray-900'
                  }`}
                >
                  {t('settings_panel.apply_to_current')}
                </button>
                <button
                  onClick={() => {
                    setShowBackgroundConfirm(false);
                    setPendingBackgroundImage('');
                  }}
                  className={`w-full py-2.5 px-4 rounded-lg font-medium transition-all ${
                    theme === 'dark'
                      ? 'bg-slate-900 hover:bg-slate-800 text-slate-400 border border-slate-700'
                      : 'bg-gray-100 hover:bg-gray-200 text-gray-600 border border-gray-300'
                  }`}
                >
                  {t('settings_panel.cancel')}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 纯色背景应用确认对话框 */}
      <AnimatePresence>
        {showColorBackgroundConfirm && pendingBackgroundColor && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[60] p-4"
            onClick={() => {
              setShowColorBackgroundConfirm(false);
              setPendingBackgroundColor('');
            }}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className={`w-full max-w-md rounded-2xl shadow-2xl p-6 ${
                theme === 'dark' ? 'bg-slate-800 border border-slate-700' : 'bg-white border border-gray-200'
              }`}
            >
              <h3 className={`text-xl font-bold mb-4 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                {t('settings_panel.apply_solid_color_background')}
              </h3>
              
              {/* 颜色预览 */}
              <div className={`mb-6 p-4 rounded-lg ${theme === 'dark' ? 'bg-slate-900' : 'bg-gray-50'}`}>
                <div 
                  className="w-full h-20 rounded-lg mb-3 border-2 border-gray-300"
                  style={{ backgroundColor: pendingBackgroundColor }}
                />
                <p className={`text-sm ${theme === 'dark' ? 'text-slate-400' : 'text-gray-600'}`}>
                  {t('settings_panel.select_application_scope')}
                </p>
              </div>
              
              {/* 选项说明 */}
              <div className={`mb-6 p-4 rounded-lg ${theme === 'dark' ? 'bg-blue-500/10' : 'bg-blue-50'}`}>
                <div className="flex items-start gap-2 mb-3">
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
                    theme === 'dark' ? 'bg-blue-500' : 'bg-blue-600'
                  }`}>
                    <span className="text-white text-xs font-bold">1</span>
                  </div>
                  <div className="flex-1">
                    <p className={`text-sm font-medium ${theme === 'dark' ? 'text-blue-300' : 'text-blue-700'}`}>
                      {t('settings_panel.all_functional_pages')}
                    </p>
                    <p className={`text-xs mt-1 ${theme === 'dark' ? 'text-blue-400/70' : 'text-blue-600/70'}`}>
                      {t('settings_panel.all_pages_use_this_background')}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
                    theme === 'dark' ? 'bg-slate-600' : 'bg-gray-400'
                  }`}>
                    <span className="text-white text-xs font-bold">2</span>
                  </div>
                  <div className="flex-1">
                    <p className={`text-sm font-medium ${theme === 'dark' ? 'text-slate-300' : 'text-gray-700'}`}>
                      {t('settings_panel.current_functional_page_only')}
                    </p>
                    <p className={`text-xs mt-1 ${theme === 'dark' ? 'text-slate-400' : 'text-gray-600'}`}>
                      {t('settings_panel.only_this_page_uses_this_background', { pageName: t(`modes.${mode}`) })}
                    </p>
                  </div>
                </div>
              </div>

              {/* 按钮组 */}
              <div className="space-y-3">
                <button
                  onClick={async () => {
                    // 应用到所有功能页面
                    console.log('用户选择了"应用到所有功能页面"');
                    setApplyColorToAllPages(true);
                    setBackgroundColor(pendingBackgroundColor);
                    
                    // 分析颜色亮度并自动设置主题
                    const isLight = isLightColor(pendingBackgroundColor);
                    setTimeout(() => {
                      if (isLight) {
                        if (theme !== 'light') setTheme('light');
                      } else {
                        if (theme !== 'dark') setTheme('dark');
                      }
                    }, 0);
                    
                    setShowColorBackgroundConfirm(false);
                    setPendingBackgroundColor('');
                    toast.success(t('settings_panel.background_applied_all'));
                  }}
                  className={`w-full py-3 px-4 rounded-lg font-medium transition-all ${
                    theme === 'dark'
                      ? 'bg-blue-600 hover:bg-blue-700 text-white'
                      : 'bg-blue-500 hover:bg-blue-600 text-white'
                  }`}
                >
                  {t('settings_panel.apply_to_all')}
                </button>
                <button
                  onClick={async () => {
                    // 仅应用到当前功能页面
                    console.log('用户选择了"仅应用到当前功能页面"');
                    setApplyColorToAllPages(false);
                    setBackgroundColor(pendingBackgroundColor);
                    
                    // 清除其他功能页面的背景设置
                    const allModes = ['stopwatch'];
                    allModes.forEach(modeKey => {
                      if (modeKey !== mode) {
                        localStorage.removeItem(`timer-background-color-${modeKey}`);
                      }
                    });
                    
                    // 清除通用背景设置
                    localStorage.removeItem('timer-background-color');
                    
                    // 分析颜色亮度并自动设置主题和其他页面的默认背景
                    const isLight = isLightColor(pendingBackgroundColor);
                    setTimeout(() => {
                      if (isLight) {
                        // 浅色背景：设置为白天模式，其他页面使用浅色默认背景
                        if (theme !== 'light') setTheme('light');
                        // 为其他页面设置浅色默认背景
                        allModes.forEach(modeKey => {
                          if (modeKey !== mode) {
                            localStorage.setItem(`timer-background-color-${modeKey}`, '#f8fafc'); // 浅色默认背景
                          }
                        });
                      } else {
                        // 深色背景：设置为夜间模式，其他页面使用深色默认背景
                        if (theme !== 'dark') setTheme('dark');
                        // 为其他页面设置深色默认背景
                        allModes.forEach(modeKey => {
                          if (modeKey !== mode) {
                            localStorage.setItem(`timer-background-color-${modeKey}`, '#1e293b'); // 深色默认背景
                          }
                        });
                      }
                    }, 0);
                    
                    setShowColorBackgroundConfirm(false);
                    setPendingBackgroundColor('');
                    const pageName = t(`modes.${mode}`);
                    toast.success(t('settings_panel.background_applied_to_page', { pageName }));
                  }}
                  className={`w-full py-3 px-4 rounded-lg font-medium transition-all ${
                    theme === 'dark'
                      ? 'bg-slate-700 hover:bg-slate-600 text-white'
                      : 'bg-gray-200 hover:bg-gray-300 text-gray-900'
                  }`}
                >
                  {t('settings_panel.apply_to_current')}
                </button>
                <button
                  onClick={() => {
                    setShowColorBackgroundConfirm(false);
                    setPendingBackgroundColor('');
                  }}
                  className={`w-full py-2.5 px-4 rounded-lg font-medium transition-all ${
                    theme === 'dark'
                      ? 'bg-slate-900 hover:bg-slate-800 text-slate-400 border border-slate-700'
                      : 'bg-gray-100 hover:bg-gray-200 text-gray-600 border border-gray-300'
                  }`}
                >
                  {t('settings_panel.cancel')}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 主题颜色设置确认对话框 */}
      <AnimatePresence>
        {showThemeColorConfirm && pendingThemeColor && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[9999] p-4"
            onClick={() => {
              setShowThemeColorConfirm(false);
              setPendingThemeColor(null);
            }}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className={`w-full max-w-md rounded-2xl shadow-2xl p-6 ${
                theme === 'dark' ? 'bg-slate-800 border border-slate-700' : 'bg-white border border-gray-200'
              }`}
            >
              <h3 className={`text-xl font-bold mb-4 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                {t('settings_panel.theme_color_confirm_title', { default: '设置主题颜色' })}
              </h3>
              
              {/* 颜色预览 */}
              <div className={`mb-6 p-4 rounded-lg ${theme === 'dark' ? 'bg-slate-900' : 'bg-gray-50'}`}>
                <p className={`text-sm mb-3 ${theme === 'dark' ? 'text-slate-400' : 'text-gray-600'}`}>
                  {t('settings_panel.color_preview', { default: '预览新颜色：' })}
                </p>
                <div 
                  className="text-5xl font-bold text-center mb-2"
                  style={{
                    fontFamily: '"Rajdhani", sans-serif',
                    color: (() => {
                      const previewColor = THEME_COLORS.find(c => c.id === pendingThemeColor);
                      if (!previewColor) {
                        const defaultColor = theme === 'dark' ? 'white' : 'black';
                        return defaultColor === 'white' ? '#ffffff' : '#000000';
                      }
                      return previewColor.gradient ? previewColor.color : previewColor.color;
                    })(),
                  }}
                >
                  {currentDate.getHours().toString().padStart(2, '0')}:{currentDate.getMinutes().toString().padStart(2, '0')}:{currentDate.getSeconds().toString().padStart(2, '0')}
                </div>
                <p className={`text-xs text-center ${theme === 'dark' ? 'text-slate-500' : 'text-gray-500'}`}>
                  {(() => {
                    if (pendingThemeColor === 'white' || pendingThemeColor === 'black') {
                      return t('settings_panel.default');
                    }
                    const color = THEME_COLORS.find(c => c.id === pendingThemeColor);
                    return color?.key ? t(`colors.${color.key}`) : '';
                  })()}
                </p>
              </div>
              
              <p className={`text-base mb-6 ${theme === 'dark' ? 'text-slate-300' : 'text-gray-700'}`}>
                {t('settings_panel.theme_color_confirm_message', { default: '请选择应用范围：' })}
              </p>
              <div className="flex flex-col gap-3">
                <div className="flex gap-3">
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      // 应用到所有页面
                      if (pendingThemeColor) {
                        // 应用到所有功能页面
                        setStopwatchColor(pendingThemeColor);
                      }
                      setShowThemeColorConfirm(false);
                      setPendingThemeColor(null);
                    }}
                    className={`flex-1 py-3 px-4 rounded-lg font-medium transition-all ${
                      theme === 'dark'
                        ? 'bg-blue-600 hover:bg-blue-700 text-white'
                        : 'bg-blue-500 hover:bg-blue-600 text-white'
                    }`}
                  >
                    {t('settings_panel.apply_to_all_pages', { default: '应用到所有页面' })}
                  </button>
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      // 仅应用到当前页面
                      if (pendingThemeColor) {
                        setStopwatchColor(pendingThemeColor);
                      }
                      setShowThemeColorConfirm(false);
                      setPendingThemeColor(null);
                    }}
                    className={`flex-1 py-3 px-4 rounded-lg font-medium transition-all ${
                      theme === 'dark'
                        ? 'bg-slate-700 hover:bg-slate-600 text-white'
                        : 'bg-gray-200 hover:bg-gray-300 text-gray-900'
                    }`}
                  >
                    {t('settings_panel.apply_to_current_page', { default: '仅当前页面' })}
                  </button>
                </div>
                <button
                  onClick={() => {
                    setShowThemeColorConfirm(false);
                    setPendingThemeColor(null);
                  }}
                  className={`w-full py-2.5 px-4 rounded-lg font-medium transition-all ${
                    theme === 'dark'
                      ? 'bg-slate-900 hover:bg-slate-800 text-slate-400 border border-slate-700'
                      : 'bg-gray-100 hover:bg-gray-200 text-gray-600 border border-gray-300'
                  }`}
                >
                  {t('settings_panel.cancel')}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
