"use client";

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, RotateCcw, Maximize, Volume2, VolumeX, Settings, X, Timer, Clock, Sun, Moon, Cloud, CloudRain, CloudSnow, CloudDrizzle, Cloudy, AlarmClock, Plus, Trash2, Globe, MapPin, Search, Languages, Menu, Bell, BellOff } from 'lucide-react';
import { NotificationSoundSelector } from '@/components/ui/NotificationSoundSelector';
import { toast } from 'sonner';
import { useTranslations, useLocale } from 'next-intl';
import { useParams, usePathname, useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { localeNames } from '@/i18n/locale';
import { useTheme } from 'next-themes';
import NProgress from 'nprogress';
import LocaleToggle from '@/components/locale/toggle';
import { SOUND_OPTIONS, THEME_COLORS } from '@/lib/clock-constants';
import { notifySoundMetaList } from '@/lib/notify-sound';
import { compressAndResizeImage, analyzeImageBrightness, isLightColor } from '@/lib/image-utils';
import { useFullscreen } from '@/lib/hooks/useFullscreen';
import { useBackground } from '@/lib/hooks/useBackground';
import { useWeatherLocation } from '@/lib/hooks/useWeatherLocation';
import { useNotificationSound } from '@/lib/hooks/useNotificationSound';
import { useClockPageHandlers } from '@/lib/hooks/useClockPageHandlers';
import ClockToolbar from '@/components/ui/ClockToolbar';
import WeatherDateDisplay from '@/components/ui/WeatherDateDisplay';
import BackgroundConfirmDialog from '@/components/ui/BackgroundConfirmDialog';
import ThemeColorConfirmDialog from '@/components/ui/ThemeColorConfirmDialog';
import TimeDisplay from '@/components/ui/TimeDisplay';
import TimerControlButtons from '@/components/ui/TimerControlButtons';
import { useClockPageEffects } from '@/lib/hooks/useClockPageEffects';

// 配置 NProgress
NProgress.configure({ 
  showSpinner: true,
  speed: 300,
  minimum: 0.3,
});

// 预设时间选项
const PRESET_TIMES = [
  { key: '10s', seconds: 10, path: '10-second-timer' },
  { key: '20s', seconds: 20, path: '20-second-timer' },
  { key: '30s', seconds: 30, path: '30-second-timer' },
  { key: '45s', seconds: 45, path: '45-second-timer' },
  { key: '60s', seconds: 60, path: '60-second-timer' },
  { key: '90s', seconds: 90, path: '90-second-timer' },
  { key: '1min', seconds: 60, path: '1-minute-timer' },
  { key: '2min', seconds: 120, path: '2-minute-timer' },
  { key: '3min', seconds: 180, path: '3-minute-timer' },
  { key: '5min', seconds: 300, path: '5-minute-timer' },
  { key: '10min', seconds: 600, path: '10-minute-timer' },
  { key: '15min', seconds: 900, path: '15-minute-timer' },
  { key: '20min', seconds: 1200, path: '20-minute-timer' },
  { key: '25min', seconds: 1500, path: '25-minute-timer' },
  { key: '30min', seconds: 1800, path: '30-minute-timer' },
  { key: '40min', seconds: 2400, path: '40-minute-timer' },
  { key: '45min', seconds: 2700, path: '45-minute-timer' },
  { key: '60min', seconds: 3600, path: '60-minute-timer' },
  { key: '1hour', seconds: 3600, path: '1-hour-timer' },
  { key: '2hour', seconds: 7200, path: '2-hour-timer' },
  { key: '4hour', seconds: 14400, path: '4-hour-timer' },
  { key: '8hour', seconds: 28800, path: '8-hour-timer' },
  { key: '12hour', seconds: 43200, path: '12-hour-timer' },
  { key: '16hour', seconds: 57600, path: '16-hour-timer' },
];

/**
 * 格式化时间为可读格式
 * 将秒数转换为可读的时间格式，如 "1 Minute", "5 Minutes", "1 Hour", "2 Hours 30 Minutes" 等
 * 
 * @param seconds - 总秒数
 * @param locale - 语言环境
 * @returns 格式化后的时间字符串
 */
function formatTimeForDescription(seconds: number, locale: string): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  
  const parts: string[] = [];
  
  if (hours > 0) {
    if (locale === 'zh') {
      parts.push(`${hours}小时`);
    } else {
      parts.push(`${hours} ${hours === 1 ? 'Hour' : 'Hours'}`);
    }
  }
  
  if (minutes > 0) {
    if (locale === 'zh') {
      parts.push(`${minutes}分钟`);
    } else {
      parts.push(`${minutes} ${minutes === 1 ? 'Minute' : 'Minutes'}`);
    }
  }
  
  if (secs > 0 && hours === 0 && minutes === 0) {
    if (locale === 'zh') {
      parts.push(`${secs}秒`);
    } else {
      parts.push(`${secs} ${secs === 1 ? 'Second' : 'Seconds'}`);
    }
  }
  
  if (parts.length === 0) {
    return locale === 'zh' ? '1分钟' : '1 Minute';
  }
  
  return parts.join(' ');
}

export default function HomePage() {
  const t = useTranslations('clock');
  const locale = useLocale();
  const params = useParams();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { theme, setTheme } = useTheme();
  
  // 固定模式为 timer
  const mode = 'timer' as const;
  
  // 从URL路径或参数读取预设时间
  const getInitialTime = () => {
    // 先检查URL参数
    const presetFromUrl = searchParams.get('preset');
    if (presetFromUrl) {
      return parseInt(presetFromUrl);
    }
    
    // 检查URL路径来确定预设时间（使用endsWith确保精确匹配，加上斜杠避免部分匹配）
    const pathMatch = PRESET_TIMES.find(preset => pathname.endsWith(`/${preset.path}`));
    if (pathMatch) {
      return pathMatch.seconds;
    }
    
    // 默认5分钟
    return 300;
  };
  
  const initialPresetTime = getInitialTime();
  
  // 倒计时相关
  const [timeLeft, setTimeLeft] = useState(initialPresetTime);
  const [initialTime, setInitialTime] = useState(initialPresetTime);
  
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
    mode: 'timer',
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
  const [mounted, setMounted] = useState(false); // 标记客户端是否已挂载
  const [showCardBorder, setShowCardBorder] = useState(true); // 控制大卡片边框显示（全屏模式下）
  
  // 新增功能状态
  const [selectedSound, setSelectedSound] = useState('night_sky');
  const [soundUsageStats, setSoundUsageStats] = useState<Record<string, number>>({});
  const [timerColor, setTimerColor] = useState('blue'); // 倒计时颜色
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
  
  // 选中的城市（用于大卡片显示，不保存到localStorage，刷新后恢复为IP定位）
  const [selectedCity, setSelectedCity] = useState<{
    city: string;
    timezone: string;
    country: string;
    weatherCode: string;
    temp: number;
  } | null>(null);
  
  // 倒计时结束弹窗
  const [showTimerEndModal, setShowTimerEndModal] = useState(false);
  const [timerOvertime, setTimerOvertime] = useState(0); // 超时计时（秒）
  
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastToastRef = useRef<{ id: string; time: number } | null>(null);
  const lastClickRef = useRef<{ action: string; time: number } | null>(null);
  const overtimeIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const colorInitializedRef = useRef(false); // 跟踪颜色是否已初始化
  const lastBackgroundColorRef = useRef<string>(''); // 跟踪上一次的背景颜色

  // 使用公共的useEffect逻辑
  const { isHoveringControls } = useClockPageEffects({
    isFullscreen,
    enterFullscreen,
    showControls,
    setShowControls,
    mounted,
    setMounted,
    currentDate,
    setCurrentDate,
  });

  // 注意：通知音效控制已在 useNotificationSound hook 中处理

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
        // 保存音频元素引用，以便后续停止
        notificationAudioElementRef.current = audio;
        // 监听音频播放结束事件，清理引用
        audio.addEventListener('ended', () => {
          notificationAudioElementRef.current = null;
        });
        audio.play().catch((error) => {
          console.warn('Failed to play sound file:', error);
          notificationAudioElementRef.current = null;
        });
        return; // 成功播放文件，直接返回
      }
      
      // 如果没有找到音效配置或没有文件路径，记录警告
      console.warn(`Sound not found or no path available for: ${soundType}`);
    } catch (error) {
      console.error('Error playing sound:', error);
    }
  };


  // 监听路径变化，更新计时器初始时间
  useEffect(() => {
    // 计算新的预设时间
    let newTime = 300; // 默认5分钟
    
    // 先检查URL参数
    const presetFromUrl = searchParams.get('preset');
    if (presetFromUrl) {
      newTime = parseInt(presetFromUrl);
    } else {
      // 检查URL路径来确定预设时间（使用endsWith确保精确匹配，加上斜杠避免部分匹配）
      const pathMatch = PRESET_TIMES.find(preset => pathname.endsWith(`/${preset.path}`));
      if (pathMatch) {
        newTime = pathMatch.seconds;
      }
    }
    
    // 只在路径实际改变时更新（不检查 initialTime，避免覆盖用户手动设置的值）
    if (!isRunning) {
      setInitialTime(newTime);
      setTimeLeft(newTime);
    }
    
    // 完成进度条加载
    NProgress.done();
  }, [pathname, searchParams]);

  // 注意：背景颜色变化自动切换主题的逻辑已在 useBackground hook 中处理

  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        // Note: In timer mode, mode is fixed to 'timer', so timer check is always true
        // 倒计时模式
        setTimeLeft((prev) => {
          if (prev <= 1) {
            // 立即清除定时器，防止重复执行
            if (intervalRef.current) {
              clearInterval(intervalRef.current);
              intervalRef.current = null;
            }
            setIsRunning(false);
            if (soundEnabled) {
              playTimerNotificationSound();
            }
            // 桌面通知
            showDesktopNotification(t('notifications.timer_end'), t('notifications.timer_end_desc'));
            
            // 显示倒计时结束弹窗，并开始超时计时
            setShowTimerEndModal(true);
            setTimerOvertime(0);
            
            // 开始超时计时器
            if (!overtimeIntervalRef.current) {
              overtimeIntervalRef.current = setInterval(() => {
                setTimerOvertime((prev) => prev + 1);
              }, 1000);
            }
            
            return 0;
          }
          return prev - 1;
        });
        // Note: In timer mode, mode is fixed to 'timer', so stopwatch else branch is never executed
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

  // 从 localStorage 加载设置
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedTheme = localStorage.getItem('timer-theme');
      const savedSound = localStorage.getItem('timer-sound');
      const savedColor = localStorage.getItem('timer-color');
      const savedTime = localStorage.getItem('timer-last-time');
      const savedNotification = localStorage.getItem('timer-notification');
      const savedProgress = localStorage.getItem('timer-progress');
      const savedShowWeatherIcon = localStorage.getItem('timer-show-weather-icon');
      const savedShowTemperature = localStorage.getItem('timer-show-temperature');
      const savedShowDate = localStorage.getItem('timer-show-date');
      const savedShowWeekday = localStorage.getItem('timer-show-weekday');
      
      // theme 由 next-themes 自动管理，无需手动加载
      if (savedSound) setSelectedSound(savedSound);
      
      // 加载声音使用统计
      const savedSoundUsageStats = localStorage.getItem('timer-sound-usage-stats');
      if (savedSoundUsageStats) {
        try {
          setSoundUsageStats(JSON.parse(savedSoundUsageStats));
        } catch (e) {
          console.error('Failed to parse saved sound usage stats');
        }
      }
      
      // 加载独立的颜色设置
      const savedTimerColor = localStorage.getItem('timer-timer-color');
      
      // 如果有保存的颜色，使用保存的颜色
      if (savedTimerColor) {
        setTimerColor(savedTimerColor);
      } else if (savedColor) {
        setTimerColor(savedColor); // 向后兼容旧版本
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
      
      // 不再从localStorage加载时间，始终使用默认的5分钟
      // if (savedTime) {
      //   const time = parseInt(savedTime);
      //   setTimeLeft(time);
      //   setInitialTime(time);
      // }
    }
  }, []);

  // 保存设置到 localStorage (背景相关设置已在 useBackground hook 中处理)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('timer-sound', selectedSound);
      localStorage.setItem('timer-sound-usage-stats', JSON.stringify(soundUsageStats));
      localStorage.setItem('timer-timer-color', timerColor);
      localStorage.setItem('timer-notification', String(notificationEnabled));
      localStorage.setItem('timer-progress', String(progressVisible));
      localStorage.setItem('timer-show-weather-icon', String(showWeatherIcon));
      localStorage.setItem('timer-show-temperature', String(showTemperature));
      localStorage.setItem('timer-show-date', String(showDate));
      localStorage.setItem('timer-show-weekday', String(showWeekday));
    }
  }, [selectedSound, soundUsageStats, timerColor, notificationEnabled, progressVisible, showWeatherIcon, showTemperature, showDate, showWeekday]);

  // 注意：背景相关的useEffect逻辑已在 useBackground hook 中处理

  // 初始化颜色：第一次打开时根据主题自动选择
  useEffect(() => {
    if (theme && !colorInitializedRef.current && typeof window !== 'undefined') {
      colorInitializedRef.current = true;
      
      const savedTimerColor = localStorage.getItem('timer-timer-color');
      const savedColor = localStorage.getItem('timer-color'); // 旧版本兼容
      
      // 如果没有保存过颜色，根据主题设置默认颜色
      if (!savedTimerColor && !savedColor) {
        const defaultColor = theme === 'dark' ? 'white' : 'black';
        setTimerColor(defaultColor);
      }
    }
  }, [theme]);

  // 监听主题变化，自动切换被禁用的颜色
  useEffect(() => {
    if (theme && colorInitializedRef.current) {
      // 白天模式禁用白色，夜晚模式禁用黑色
      // 被禁用时：白天模式切换为黑色，夜晚模式切换为白色
      const isTimerColorDisabled = 
        (theme === 'light' && timerColor === 'white') || 
        (theme === 'dark' && timerColor === 'black');
      
      if (isTimerColorDisabled) {
        setTimerColor(theme === 'light' ? 'black' : 'white');
      }
    }
  }, [theme, timerColor]);

  // 保存上次使用的时长
  useEffect(() => {
    if (typeof window !== 'undefined' && mode === 'timer' && initialTime > 0) {
      localStorage.setItem('timer-last-time', String(initialTime));
    }
  }, [initialTime, mode]);

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
  }, [timeLeft, mode, isFullscreen]);

  // 注意：天气和位置数据获取已在 useWeatherLocation hook 中处理

  // 全屏模式下鼠标移动检测 - 1.5秒后自动隐藏边框和小卡片
  useEffect(() => {
    let hideTimer: NodeJS.Timeout;
    
    const handleMouseMove = () => {
      setShowCardBorder(true);
      clearTimeout(hideTimer);
      
      // 1.5秒后自动隐藏边框
      hideTimer = setTimeout(() => {
        setShowCardBorder(false);
      }, 1500);
    };
    
    // 只在世界时钟模式且全屏模式下启用
    // Note: In timer mode, mode is fixed to 'timer', so worldclock check is never true
    if (false && isFullscreen) { // Always false in timer mode
      window.addEventListener('mousemove', handleMouseMove);
      
      // 初始化：1.5秒后隐藏
      hideTimer = setTimeout(() => {
        setShowCardBorder(false);
      }, 1500);
      
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        clearTimeout(hideTimer);
      };
    } else {
      // 非全屏模式时始终显示边框
      setShowCardBorder(true);
    }
  }, [mode, isFullscreen]);


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

  // 播放提示音
  const playTimerNotificationSound = () => {
    if (soundEnabled) {
      playNotificationSound(selectedSound);
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
    if (mode === 'timer' && timeLeft === 0) return;
    setIsRunning(!isRunning);
    // 停止提示音
    stopNotificationSound();
    // 关闭倒计时结束模态框（如果正在显示）
    if (showTimerEndModal) {
      setShowTimerEndModal(false);
      setTimerOvertime(0);
      // 清除超时计时器
      if (overtimeIntervalRef.current) {
        clearInterval(overtimeIntervalRef.current);
        overtimeIntervalRef.current = null;
      }
    }
  };

  const resetTimer = () => {
    setIsRunning(false);
    // Note: In timer mode, mode is fixed to 'timer', so timer check is always true
    setTimeLeft(initialTime);
    // 停止提示音
    stopNotificationSound();
    // 关闭倒计时结束模态框（如果正在显示）
    if (showTimerEndModal) {
      setShowTimerEndModal(false);
      setTimerOvertime(0);
      // 清除超时计时器
      if (overtimeIntervalRef.current) {
        clearInterval(overtimeIntervalRef.current);
        overtimeIntervalRef.current = null;
      }
    }
  };

  const closeTimerEndModal = () => {
    setShowTimerEndModal(false);
    setTimerOvertime(0);
    // 停止正在响的提示音
    stopNotificationSound();
    // 清除超时计时器
    if (overtimeIntervalRef.current) {
      clearInterval(overtimeIntervalRef.current);
      overtimeIntervalRef.current = null;
    }
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

  const setPresetTime = (seconds: number) => {
    setIsRunning(false);
    setInitialTime(seconds);
    setTimeLeft(seconds);
    // 关闭倒计时结束模态框（如果正在显示）
    if (showTimerEndModal) {
      setShowTimerEndModal(false);
      setTimerOvertime(0);
      // 清除超时计时器
      if (overtimeIntervalRef.current) {
        clearInterval(overtimeIntervalRef.current);
        overtimeIntervalRef.current = null;
      }
    }
    // 停止提示音
    stopNotificationSound();
  };

  // 注意：toggleFullscreen 函数已在 useFullscreen hook 中提供

  const applyCustomTime = () => {
    const totalSeconds = customMinutes * 60 + customSeconds;
    // Note: In timer mode, mode is fixed to 'timer', so stopwatch check is never true
    if (totalSeconds > 0) {
      setIsRunning(false);
      // In timer mode, always set timer time
      setInitialTime(totalSeconds);
      setTimeLeft(totalSeconds);
      setShowEditModal(false);
    }
  };



  // 根据当前模式选择对应的颜色
  // Note: In timer mode, mode is fixed to 'timer', so always use timerColor
  const currentColorId = timerColor;
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
                mode === 'timer' 
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
                // Note: In timer mode, mode is fixed to 'timer', so stopwatch check is never true
                false // Always false in timer mode
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
                // Note: In timer mode, mode is fixed to 'timer', so alarm check is never true
                false // Always false in timer mode
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
                // Note: In timer mode, mode is fixed to 'timer', so worldclock check is never true
                false // Always false in timer mode
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
        {/* H1 标题 - SEO优化 */}
        {(() => {
          // 根据路径找到对应的预设时间
          const pathMatch = PRESET_TIMES.find(preset => pathname.endsWith(`/${preset.path}`));
          const h1Text = pathMatch 
            ? t(`presets.${pathMatch.key}`) 
            : `${t('modes.timer')} - Countdown Timer`;
          return <h1 className="sr-only">{h1Text}</h1>;
        })()}
        {/* 工具栏 - 使用公共组件 */}
        <ClockToolbar
          mode={mode}
          isFullscreen={isFullscreen}
          showControls={showControls}
          theme={theme}
          notificationEnabled={notificationEnabled}
          onNotificationToggle={() => setNotificationEnabled(!notificationEnabled)}
          soundEnabled={soundEnabled}
          onSoundToggle={() => setSoundEnabled(!soundEnabled)}
          onThemeToggle={handleThemeToggle}
          showSettingsPanel={showSettingsPanel}
          onSettingsToggle={() => setShowSettingsPanel(!showSettingsPanel)}
          onFullscreenToggle={toggleFullscreen}
          t={t}
          onMouseEnter={() => { isHoveringControls.current = true; }}
          onMouseLeave={() => { isHoveringControls.current = false; }}
          hideNotificationOnMobile={true}
        />

        {/* Note: In timer mode, mode is fixed to 'timer', so stopwatch check is never true */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className={`w-full flex flex-col items-center ${!isFullscreen ? 'pt-4 sm:pt-0 sm:mt-20 md:mt-24 lg:mt-28' : 'justify-between flex-1 h-full'}`}
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
            className="mt-8 mb-1 sm:mt-0 sm:mb-6 md:mb-8"
          />

          {/* H2 标题 - 倒计时显示 */}
          <h2 className="sr-only">Remaining Time</h2>
          {/* Time Display - 使用公共组件 */}
          <TimeDisplay
            seconds={timeLeft}
            mode="timer"
            isFullscreen={isFullscreen}
            themeColor={themeColor}
            useGradient={timeLeft > 60}
            customColor={
              timeLeft === 0 
                ? '#22c55e'
                : timeLeft < 60 
                ? '#ef4444'
                : undefined
            }
            timeUpText={timeLeft === 0 ? t('timer.time_up') : undefined}
            showTimeUpText={timeLeft === 0}
            className={isFullscreen ? '' : 'mt-8 sm:-mt-8 md:-mt-8 lg:-mt-8'}
          />

          {/* 进度条 - 仅非全屏模式显示 */}
          {mode === 'timer' && progressVisible && !isFullscreen && timeLeft > 0 && initialTime > 0 && (
            <div className="w-full flex justify-center mt-4 sm:-mt-4 md:-mt-4 lg:-mt-4">
              <motion.div 
                initial={{ opacity: 0, scaleX: 0 }}
                animate={{ opacity: 1, scaleX: 1 }}
                className="inline-block"
                style={{
                  width: 'var(--timer-width, auto)',
                  minWidth: '300px',
                  maxWidth: '90vw'
                }}
              >
                {/* 百分比显示 */}
                <div className="flex justify-between items-center mb-2 px-2">
                  <span className={`text-sm sm:text-base font-medium ${theme === 'dark' ? 'text-slate-400' : 'text-gray-600'}`}>
                    {t('timer.progress')}
                  </span>
                  <span className={`text-sm sm:text-base font-bold ${theme === 'dark' ? 'text-white' : 'text-black'}`}>
                    {Math.round((timeLeft / initialTime) * 100)}%
                  </span>
                </div>
                {/* 进度条背景 */}
                <div className={`w-full ${isFullscreen ? 'h-3 sm:h-4 md:h-5' : 'h-2 sm:h-3'} ${theme === 'dark' ? 'bg-slate-800' : 'bg-gray-300'} rounded-[2px] overflow-hidden`}>
                  {/* 进度条填充 */}
                  <motion.div
                    className="h-full rounded-[2px]"
                    style={{ 
                      background: timeLeft < 60 
                        ? '#ef4444'
                        : (themeColor.gradient || themeColor.color),
                      width: `${(timeLeft / initialTime) * 100}%`,
                      transition: 'width 1s linear, background 0.3s ease'
                    }}
                  />
                </div>
              </motion.div>
            </div>
          )}

          {/* Control Buttons - 使用公共组件 */}
          <TimerControlButtons
            isRunning={isRunning}
            disabled={mode === 'timer' && timeLeft === 0}
            onToggle={toggleTimer}
            onReset={resetTimer}
            onSettings={() => {
              const currentSeconds = timeLeft;
              setCustomMinutes(Math.floor(currentSeconds / 60));
              setCustomSeconds(currentSeconds % 60);
              setShowEditModal(true);
            }}
            isFullscreen={isFullscreen}
            showControls={showControls}
            t={t}
            onMouseEnter={() => { isHoveringControls.current = true; }}
            onMouseLeave={() => { isHoveringControls.current = false; }}
            className={mode === 'timer' ? 'mt-10 sm:mt-8 md:mt-12' : 'mt-6 sm:mt-8 md:mt-12'}
          />

          {/* 预设时间快捷按钮 - 仅倒计时模式显示 */}
          <AnimatePresence>
            {!isFullscreen && mode === 'timer' && showControls && (
              <div 
                className="mt-10 sm:mt-8 md:mt-12 w-full flex justify-center"
                onMouseEnter={() => { isHoveringControls.current = true; }}
                onMouseLeave={() => { isHoveringControls.current = false; }}
              >
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 20 }}
                  transition={{ duration: 0.3 }}
                  className="inline-block space-y-6"
                  style={{
                    width: 'var(--timer-width, auto)',
                    minWidth: '300px',
                    maxWidth: '90vw'
                  }}
                >
                  <p className={`text-xs sm:text-sm ${theme === 'dark' ? 'text-slate-400' : 'text-gray-600'} mb-3 sm:mb-4 text-center font-medium`}>{t('timer.quick_settings')}</p>
                  
                  {/* 秒级计时器 */}
                  <div>
                    <h3 className={`text-xs mb-2 font-semibold ${theme === 'dark' ? 'text-slate-400' : 'text-gray-600'}`}>
                      {t('timer.second_timers')}
                    </h3>
                    <div className="grid grid-cols-3 gap-2">
                      {PRESET_TIMES.filter(preset => preset.seconds < 120 && preset.key.endsWith('s')).map((preset) => {
                        const isSelected = pathname.endsWith(`/${preset.path}`);
                        return (
                        <Link
                          key={preset.seconds}
                          href={`/${locale}/${preset.path}`}
                          className="block"
                          onClick={(e) => {
                            // 如果当前按钮已选中，阻止导航以避免不必要的页面重新加载
                            if (isSelected) {
                              e.preventDefault();
                              e.stopPropagation();
                              return;
                            }
                            NProgress.start();
                          }}
                        >
                          <motion.div
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            className={`px-3 py-2 rounded-[8px] text-xs font-medium transition-all text-center cursor-pointer backdrop-blur-sm ${
                              isSelected
                                ? theme === 'dark'
                                  ? 'bg-slate-600 text-white shadow-md'
                                  : 'bg-slate-400 text-white shadow-md'
                                : theme === 'dark'
                                ? 'bg-slate-700/80 text-slate-200 hover:bg-slate-600/80 border border-slate-600/50'
                                : 'bg-white/80 text-slate-700 hover:bg-gray-50/80 border border-slate-200/50 shadow-sm'
                            }`}
                          >
                            {t(`presets.${preset.key}`)}
                          </motion.div>
                        </Link>
                      )})}
                    </div>
                  </div>

                  {/* 分钟级计时器 */}
                  <div>
                    <p className={`text-xs mb-2 ${theme === 'dark' ? 'text-slate-400' : 'text-gray-600'}`}>
                      {t('timer.minute_timers')}
                    </p>
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                      {PRESET_TIMES.filter(preset => preset.seconds < 7200 && preset.key.endsWith('min')).map((preset) => {
                        // 检查是否有任何预设路径匹配当前路径
                        const hasPathMatch = PRESET_TIMES.some(p => pathname.endsWith(`/${p.path}`));
                        // 如果路径匹配，则选中匹配的按钮；否则，如果初始时间是5分钟（300秒），默认选中5分钟按钮
                        const isSelected = pathname.endsWith(`/${preset.path}`) || (!hasPathMatch && preset.seconds === 300 && initialPresetTime === 300);
                        return (
                        <Link
                          key={preset.seconds}
                          href={`/${locale}/${preset.path}`}
                          className="block"
                          onClick={(e) => {
                            // 如果当前按钮已选中，阻止导航以避免不必要的页面重新加载
                            if (isSelected) {
                              e.preventDefault();
                              e.stopPropagation();
                              return;
                            }
                            NProgress.start();
                          }}
                        >
                          <motion.div
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            className={`px-3 py-2 rounded-[8px] text-xs font-medium transition-all text-center cursor-pointer backdrop-blur-sm ${
                              isSelected
                                ? theme === 'dark'
                                  ? 'bg-slate-600 text-white shadow-md'
                                  : 'bg-slate-400 text-white shadow-md'
                                : theme === 'dark'
                                ? 'bg-slate-700/80 text-slate-200 hover:bg-slate-600/80 border border-slate-600/50'
                                : 'bg-white/80 text-slate-700 hover:bg-gray-50/80 border border-slate-200/50 shadow-sm'
                            }`}
                          >
                            {preset.seconds === 3600 ? t('presets.60min') : t(`presets.${preset.key}`)}
                          </motion.div>
                        </Link>
                      )})}
                    </div>
                  </div>

                  {/* 小时级计时器 */}
                  <div>
                    <h3 className={`text-xs mb-2 font-semibold ${theme === 'dark' ? 'text-slate-400' : 'text-gray-600'}`}>
                      {t('timer.hour_timers')}
                    </h3>
                    <div className="grid grid-cols-2 gap-2">
                      {PRESET_TIMES.filter(preset => preset.key.endsWith('hour')).map((preset) => {
                        const isSelected = pathname.endsWith(`/${preset.path}`);
                        return (
                        <Link
                          key={preset.key}
                          href={`/${locale}/${preset.path}`}
                          className="block"
                          onClick={(e) => {
                            // 如果当前按钮已选中，阻止导航以避免不必要的页面重新加载
                            if (isSelected) {
                              e.preventDefault();
                              e.stopPropagation();
                              return;
                            }
                            NProgress.start();
                          }}
                        >
                          <motion.div
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            className={`px-3 py-2 rounded-[8px] text-xs font-medium transition-all text-center cursor-pointer backdrop-blur-sm ${
                              isSelected
                                ? theme === 'dark'
                                  ? 'bg-slate-600 text-white shadow-md'
                                  : 'bg-slate-400 text-white shadow-md'
                                : theme === 'dark'
                                ? 'bg-slate-700/80 text-slate-200 hover:bg-slate-600/80 border border-slate-600/50'
                                : 'bg-white/80 text-slate-700 hover:bg-gray-50/80 border border-slate-200/50 shadow-sm'
                            }`}
                          >
                            {t(`presets.${preset.key}`)}
                          </motion.div>
                        </Link>
                      )})}
                    </div>
                  </div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>
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
                  {mode === 'timer' ? t('modals.custom_timer') : t('modals.set_stopwatch')}
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


      {/* 设置面板 */}
      <AnimatePresence>
        {showSettingsPanel && !isFullscreen && (
          <motion.div
            initial={{ opacity: 0, x: 300 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 300 }}
            transition={{ type: "spring", damping: 20 }}
            className="fixed right-4 top-20 bottom-4 z-[60] w-80 flex flex-col"
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
                  {/* Note: In timer mode, mode is fixed to 'timer', so worldclock check is never true */}
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
                    // Note: In timer mode, mode is fixed to 'timer', so we only use timerColor
                    const currentColor = timerColor;
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
                    // Note: In timer mode, mode is fixed to 'timer', so we only use timerColor
                    const isSelectedPrimary = timerColor === color.id;
                    // 世界时间模式下，检查小卡片是否使用此颜色
                    // Note: In timer mode, mode is fixed to 'timer', so worldclock check is never true
                    const isSelectedSecondary = false; // Always false in timer mode
                    
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
                    // Note: In timer mode, mode is fixed to 'timer', so we only use timerColor
                    const isSelectedPrimary = timerColor === color.id;
                    // 世界时间模式下，检查小卡片是否使用此颜色
                    // Note: In timer mode, mode is fixed to 'timer', so worldclock check is never true
                    const isSelectedSecondary = false; // Always false in timer mode
                    
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
                    // Note: In timer mode, mode is fixed to 'timer', so we only use timerColor
                    const isSelectedPrimary = timerColor === color.id;
                    // 世界时间模式下，检查小卡片是否使用此颜色
                    // Note: In timer mode, mode is fixed to 'timer', so worldclock check is never true
                    const isSelectedSecondary = false; // Always false in timer mode
                    
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
                              const allModes = ['timer', 'stopwatch', 'alarm', 'worldclock'];
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
                              const allModes = ['timer', 'stopwatch', 'alarm', 'worldclock'];
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
                                      const allModes = ['timer', 'stopwatch', 'alarm', 'worldclock'];
                                      
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
                                      const allModes = ['timer', 'stopwatch', 'alarm', 'worldclock'];
                                      
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
                                      
                                      const pageName = mode === 'timer' ? t('modes.timer') : mode === 'stopwatch' ? t('modes.stopwatch') : mode === 'alarm' ? t('modes.alarm') : t('modes.worldclock');
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
      
      {/* 倒计时结束弹窗 */}
      <AnimatePresence>
        {showTimerEndModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-3 xs:p-4 sm:p-6 md:p-8 pt-20 xs:pt-24 sm:pt-20 bg-black/70 backdrop-blur-lg"
            onClick={closeTimerEndModal}
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0, y: 30 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.8, opacity: 0, y: 30 }}
              transition={{ type: 'spring', damping: 20, stiffness: 200 }}
              onClick={(e) => e.stopPropagation()}
              className={`relative w-full max-w-[85vw] xs:max-w-md sm:max-w-lg md:max-w-xl rounded-2xl xs:rounded-3xl shadow-2xl overflow-hidden ${
                theme === 'dark' 
                  ? 'bg-slate-900' 
                  : 'bg-white'
              }`}
            >
              {/* 顶部装饰条 */}
              <div className="absolute top-0 left-0 right-0 h-1.5 xs:h-2 bg-gradient-to-r from-green-400 via-emerald-500 to-teal-400"></div>
              
              {/* 关闭按钮 */}
              <button
                onClick={closeTimerEndModal}
                className={`absolute top-2 right-2 xs:top-3 xs:right-3 sm:top-4 sm:right-4 p-1.5 xs:p-2 rounded-full transition-all z-10 ${
                  theme === 'dark'
                    ? 'bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white'
                    : 'bg-gray-100 hover:bg-gray-200 text-gray-500 hover:text-gray-700'
                } shadow-lg`}
              >
                <X className="w-4 h-4 xs:w-5 xs:h-5" />
              </button>

              <div className="p-4 xs:p-5 sm:p-6 md:p-8">
                {/* 顶部图标和标题 */}
                <div className="text-center mb-4 xs:mb-5 sm:mb-6">
                  <motion.div
                    animate={{
                      scale: [1, 1.05, 1],
                      rotate: [0, 3, -3, 0],
                    }}
                    transition={{
                      duration: 3,
                      repeat: Infinity,
                      ease: 'easeInOut',
                    }}
                    className="inline-flex items-center justify-center w-16 h-16 xs:w-20 xs:h-20 sm:w-24 sm:h-24 rounded-full bg-gradient-to-br from-green-400 via-emerald-500 to-teal-500 shadow-xl xs:shadow-2xl shadow-green-500/40 mb-3 xs:mb-4"
                  >
                    <motion.div
                      animate={{
                        scale: [1, 1.15, 1],
                      }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: 'easeInOut',
                      }}
                    >
                      <Clock className="w-8 h-8 xs:w-10 xs:h-10 sm:w-12 sm:h-12 text-white" strokeWidth={2.5} />
                    </motion.div>
                  </motion.div>
                  
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                  >
                    <h2 className={`text-xl xs:text-2xl sm:text-3xl md:text-4xl font-bold mb-2 xs:mb-3 px-2 ${
                      theme === 'dark' ? 'text-white' : 'text-gray-900'
                    }`}>
                      {(() => {
                        const hours = Math.floor(initialTime / 3600);
                        const mins = Math.floor((initialTime % 3600) / 60);
                        const secs = initialTime % 60;
                        
                        if (hours > 0) {
                          if (mins > 0) {
                            return `${hours} ${t('modals.hours')} ${mins} ${t('modals.minutes')}`;
                          }
                          return `${hours} ${t('modals.hours')}`;
                        } else if (mins > 0) {
                          if (secs > 0) {
                            return `${mins} ${t('modals.minutes')} ${secs} ${t('modals.seconds')}`;
                          }
                          return `${mins} ${t('modals.minutes')}`;
                        } else {
                          return `${secs} ${t('modals.seconds')}`;
                        }
                      })()}
                    </h2>
                    <p className={`text-xs xs:text-sm sm:text-base ${
                      theme === 'dark' ? 'text-slate-400' : 'text-gray-600'
                    }`}>
                      {t('modals.timer_completed')}
                    </p>
                  </motion.div>
                </div>

                {/* 超时计时器 - 大卡片 */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.2 }}
                  className={`relative text-center p-4 xs:p-5 sm:p-6 rounded-xl xs:rounded-2xl overflow-hidden mb-4 xs:mb-5 sm:mb-6 ${
                    theme === 'dark' 
                      ? 'bg-gradient-to-br from-red-500/20 to-orange-500/20 border border-red-500/30' 
                      : 'bg-gradient-to-br from-red-50 to-orange-50 border border-red-200'
                  }`}
                >
                  {/* 背景装饰 */}
                  <div className="absolute inset-0 overflow-hidden">
                    <motion.div
                      animate={{
                        rotate: [0, 360],
                      }}
                      transition={{
                        duration: 20,
                        repeat: Infinity,
                        ease: 'linear',
                      }}
                      className="absolute -top-1/2 -left-1/2 w-full h-full bg-gradient-to-br from-red-500/10 via-transparent to-orange-500/10"
                    ></motion.div>
                  </div>
                  
                  <div className="relative">
                    <p className={`text-xs xs:text-sm font-bold uppercase tracking-wider mb-2 xs:mb-3 ${
                      theme === 'dark' ? 'text-red-400' : 'text-red-600'
                    }`}>
                      {t('modals.overtime')}
                    </p>
                    <motion.div 
                      className={`text-3xl xs:text-4xl sm:text-5xl md:text-6xl font-black ${
                        theme === 'dark' ? 'text-red-400' : 'text-red-500'
                      }`}
                      style={{
                        fontFamily: '"Rajdhani", sans-serif',
                        fontWeight: '900',
                        letterSpacing: '-0.02em',
                        textShadow: theme === 'dark' 
                          ? '0 0 20px rgba(248, 113, 113, 0.3), 0 0 40px rgba(248, 113, 113, 0.2)'
                          : '0 0 20px rgba(239, 68, 68, 0.2), 0 0 40px rgba(239, 68, 68, 0.1)',
                      }}
                      animate={{
                        scale: [1, 1.02, 1],
                      }}
                      transition={{
                        duration: 1.5,
                        repeat: Infinity,
                        ease: 'easeInOut',
                      }}
                    >
                      {(() => {
                        const hours = Math.floor(timerOvertime / 3600);
                        const mins = Math.floor((timerOvertime % 3600) / 60);
                        const secs = timerOvertime % 60;
                        
                        if (hours > 0) {
                          return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
                        } else {
                          return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
                        }
                      })()}
                    </motion.div>
                  </div>
                </motion.div>

                {/* 确认按钮 */}
                <motion.button
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={closeTimerEndModal}
                  className={`w-full py-3 xs:py-3.5 sm:py-4 px-4 xs:px-6 rounded-xl font-bold text-sm xs:text-base sm:text-lg transition-all shadow-lg xs:shadow-xl hover:shadow-2xl ${
                    theme === 'dark'
                      ? 'bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white'
                      : 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white'
                  }`}
                >
                  {t('modals.got_it')}
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

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
          // Note: In timer mode, we only have timerColor
          setTimerColor(colorId);
        }}
      />
      
      {/* 功能说明 */}
      {!isFullscreen && (() => {
        const timeText = formatTimeForDescription(initialTime, locale);
        const description = t('page_description.countdown.description_template', { time: timeText });
        
        return (
          <div className={`w-full max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-12 ${theme === 'dark' ? 'text-slate-300' : 'text-gray-700'}`}>
            <div className="space-y-4">
              <h2 className={`text-xl sm:text-2xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                {t('page_description.countdown.title')}
              </h2>
              <p className="text-sm sm:text-base leading-relaxed">
                {description}
              </p>
              <ul className="list-disc list-inside space-y-2 text-sm sm:text-base">
                {t.raw('page_description.countdown.features').map((feature: string, index: number) => (
                  <li key={index}>{feature}</li>
                ))}
              </ul>
            </div>
          </div>
        );
      })()}
      </div>
    </div>
  );
}
