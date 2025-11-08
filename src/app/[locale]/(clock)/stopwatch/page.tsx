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
import { compressAndResizeImage, analyzeImageBrightness, isLightColor } from '@/lib/image-utils';
import { useFullscreen } from '@/lib/hooks/useFullscreen';
import { useBackground } from '@/lib/hooks/useBackground';
import { useWeatherLocation } from '@/lib/hooks/useWeatherLocation';
import { useNotificationSound } from '@/lib/hooks/useNotificationSound';
import { useClockPageHandlers } from '@/lib/hooks/useClockPageHandlers';
import ClockControlButtons from '@/components/ui/ClockControlButtons';
import ClockSettingsPanel from '@/components/ui/ClockSettingsPanel';
import VerticalSidebar from '@/components/blocks/navigation/VerticalSidebar';
import WeatherDateDisplay from '@/components/ui/WeatherDateDisplay';
import BackgroundConfirmDialog from '@/components/ui/BackgroundConfirmDialog';
import ThemeColorConfirmDialog from '@/components/ui/ThemeColorConfirmDialog';


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
  
  // 跟踪用户是否手动设置了主题（用于覆盖自动主题设置）
  const [userManuallySetTheme, setUserManuallySetTheme] = useState(false);
  
  const {
    uploadedImageHistory,
    setUploadedImageHistory,
    handleAddToImageHistory,
    handleRemoveFromImageHistory,
    handleThemeToggle,
  } = useClockPageHandlers({
    mode: 'stopwatch',
    setBackgroundType,
    setBackgroundImage,
    setApplyToAllPages,
    setUserManuallySetTheme,
  });
  
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
        // 停止所有当前播放的音频
        stopNotificationSound();
        
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
      
      // 如果没有找到音效配置或没有文件路径，记录警告
      console.warn(`Sound not found or no path available for: ${soundType}`);
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
              onClick={() => navigateToPage('countdown')}
              className={`flex flex-col items-center gap-1 px-4 py-2 rounded-lg transition-all ${
                // Note: In stopwatch mode, mode is fixed to 'stopwatch', so timer check is never true
                false // Always false in stopwatch mode
                  ? theme === 'dark'
                    ? 'bg-slate-600 text-white'
                    : 'bg-slate-400 text-white'
                  : theme === 'dark'
                  ? 'text-slate-400 hover:bg-slate-800'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <Timer className="w-5 h-5" />
              <span className="text-xs font-medium">{t('modes.timer')}</span>
            </button>
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
            <button
              onClick={() => navigateToPage('alarm')}
              className={`flex flex-col items-center gap-1 px-4 py-2 rounded-lg transition-all ${
                // Note: In stopwatch mode, mode is fixed to 'stopwatch', so alarm check is never true
                false // Always false in stopwatch mode
                  ? theme === 'dark'
                    ? 'bg-slate-600 text-white'
                    : 'bg-slate-400 text-white'
                  : theme === 'dark'
                  ? 'text-slate-400 hover:bg-slate-800'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <AlarmClock className="w-5 h-5" />
              <span className="text-xs font-medium">{t('modes.alarm')}</span>
            </button>
            <button
              onClick={() => navigateToPage('world-clock')}
              className={`flex flex-col items-center gap-1 px-4 py-2 rounded-lg transition-all ${
                // Note: In stopwatch mode, mode is fixed to 'stopwatch', so worldclock check is never true
                false // Always false in stopwatch mode
                  ? theme === 'dark'
                    ? 'bg-slate-600 text-white'
                    : 'bg-slate-400 text-white'
                  : theme === 'dark'
                  ? 'text-slate-400 hover:bg-slate-800'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <Globe className="w-5 h-5" />
              <span className="text-xs font-medium">{t('modes.worldclock')}</span>
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
                    onClick={handleThemeToggle}
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

              {/* 右上角：功能按钮 - 使用公共组件 */}
              <ClockControlButtons
                theme={theme}
                notificationEnabled={notificationEnabled}
                onNotificationToggle={() => setNotificationEnabled(!notificationEnabled)}
                soundEnabled={soundEnabled}
                onSoundToggle={() => setSoundEnabled(!soundEnabled)}
                onThemeToggle={handleThemeToggle}
                showSettingsPanel={showSettingsPanel}
                onSettingsToggle={() => setShowSettingsPanel(!showSettingsPanel)}
                onFullscreenToggle={toggleFullscreen}
                isFullscreen={isFullscreen}
                t={t}
                showControls={showControls}
                onMouseEnter={() => { isHoveringControls.current = true; }}
                onMouseLeave={() => { isHoveringControls.current = false; }}
                hideNotificationOnMobile={true}
              />
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

              {/* 右上角：功能按钮 - 全屏模式使用公共组件 */}
              <ClockControlButtons
                theme={theme}
                notificationEnabled={notificationEnabled}
                onNotificationToggle={() => setNotificationEnabled(!notificationEnabled)}
                soundEnabled={soundEnabled}
                onSoundToggle={() => setSoundEnabled(!soundEnabled)}
                onThemeToggle={handleThemeToggle}
                showSettingsPanel={showSettingsPanel}
                onSettingsToggle={() => setShowSettingsPanel(!showSettingsPanel)}
                onFullscreenToggle={toggleFullscreen}
                isFullscreen={isFullscreen}
                t={t}
                showControls={showControls}
                onMouseEnter={() => { isHoveringControls.current = true; }}
                onMouseLeave={() => { isHoveringControls.current = false; }}
                hideNotificationOnMobile={true}
              />
            </>
          )}
        </AnimatePresence>

        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className={`w-full flex flex-col items-center ${!isFullscreen ? 'justify-center -mt-12 sm:mt-0' : 'justify-between flex-1 h-full'}`}
        >
          {/* 日期和天气显示 - 非全屏时显示 */}
          <WeatherDateDisplay
            weather={weather}
            theme={theme}
            showWeatherIcon={showWeatherIcon}
            showTemperature={showTemperature}
            showDate={showDate}
            showWeekday={showWeekday}
            currentDate={currentDate}
            locale={locale}
            t={t}
            isFullscreen={isFullscreen}
            className="mb-4 sm:mb-6 md:mb-8"
          />

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

      {/* 设置面板 - 使用公共组件 */}
      <ClockSettingsPanel
        showSettingsPanel={showSettingsPanel}
        isFullscreen={isFullscreen}
        onClose={() => setShowSettingsPanel(false)}
        theme={theme}
        t={t}
        mode={mode}
      >
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
      </ClockSettingsPanel>
      
      {/* 时区选择模态框已删除 - stopwatch模式不需要 */}

      {/* 倒计时结束弹窗已删除 - stopwatch模式不需要 */}
      </div>

      {/* 世界时间颜色修改确认对话框已删除 - stopwatch模式不需要 */}

      {/* 背景应用确认对话框 */}
      <BackgroundConfirmDialog
        show={showBackgroundConfirm && !!pendingBackgroundImage}
        pendingBackgroundImage={pendingBackgroundImage}
        theme={theme}
        t={t}
        mode={mode}
        onClose={() => {
          setShowBackgroundConfirm(false);
          setPendingBackgroundImage('');
        }}
        setBackgroundImage={setBackgroundImage}
        setBackgroundColor={setBackgroundColor}
        setApplyToAllPages={setApplyToAllPages}
        setApplyColorToAllPages={setApplyColorToAllPages}
        setTheme={setTheme}
      />

      {/* 纯色背景应用确认对话框 */}
      <BackgroundConfirmDialog
        show={showColorBackgroundConfirm && !!pendingBackgroundColor}
        pendingBackgroundColor={pendingBackgroundColor}
        theme={theme}
        t={t}
        mode={mode}
        onClose={() => {
          setShowColorBackgroundConfirm(false);
          setPendingBackgroundColor('');
        }}
        setBackgroundImage={setBackgroundImage}
        setBackgroundColor={setBackgroundColor}
        setApplyToAllPages={setApplyToAllPages}
        setApplyColorToAllPages={setApplyColorToAllPages}
        setTheme={setTheme}
      />

      {/* 主题颜色设置确认对话框 */}
      <ThemeColorConfirmDialog
        show={showThemeColorConfirm}
        pendingThemeColor={pendingThemeColor}
        theme={theme}
        t={t}
        mode={mode}
        onClose={() => {
          setShowThemeColorConfirm(false);
          setPendingThemeColor(null);
        }}
        onConfirm={(colorId) => {
          setStopwatchColor(colorId);
          // 触发自定义事件，通知其他页面更新颜色
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('color-change'));
          }
        }}
      />
    </div>
  )
}
