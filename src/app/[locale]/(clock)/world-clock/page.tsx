"use client";

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, RotateCcw, Maximize, Volume2, VolumeX, Settings, X, Timer, Clock, Sun, Moon, Bell, BellOff, Cloud, CloudRain, CloudSnow, CloudDrizzle, Cloudy, AlarmClock, Plus, Trash2, Globe, MapPin, Search, Languages, Menu } from 'lucide-react';
import { NotificationSoundSelector } from '@/components/ui/NotificationSoundSelector';
import { toast } from 'sonner';
import { useTranslations, useLocale } from 'next-intl';
import { useParams, usePathname, useRouter } from 'next/navigation';
import { localeNames } from '@/i18n/locale';
import { useTheme } from 'next-themes';
import { SOUND_OPTIONS, THEME_COLORS, WORLD_CITIES, MORE_TIMEZONES, PRESET_TIMES } from '@/lib/clock-constants';
import { notifySoundMetaList } from '@/lib/notify-sound';
import { compressAndResizeImage, analyzeImageBrightness, isLightColor } from '@/lib/image-utils';
import { getWeatherIcon } from '@/lib/weather-utils';
import { useFullscreen } from '@/lib/hooks/useFullscreen';
import { useBackground } from '@/lib/hooks/useBackground';
import { useWeatherLocation } from '@/lib/hooks/useWeatherLocation';
import { useNotificationSound } from '@/lib/hooks/useNotificationSound';
import { useClockPageHandlers } from '@/lib/hooks/useClockPageHandlers';
import ClockToolbar from '@/components/ui/ClockToolbar';
import ClockSettingsPanel from '@/components/ui/ClockSettingsPanel';
import WeatherDateDisplay from '@/components/ui/WeatherDateDisplay';
import BackgroundConfirmDialog from '@/components/ui/BackgroundConfirmDialog';
import ThemeColorConfirmDialog from '@/components/ui/ThemeColorConfirmDialog';
import { useClockPageEffects } from '@/lib/hooks/useClockPageEffects';

// 注意：WORLD_CITIES 和 MORE_TIMEZONES 已在 @/lib/clock-constants 中定义

// 闹钟类型定义
interface Alarm {
  id: string;
  hour: number;
  minute: number;
  enabled: boolean;
  repeat: 'once' | 'daily' | 'weekdays' | 'weekends';
  label?: string;
}

export default function HomePage() {
  const t = useTranslations('clock');
  const locale = useLocale();
  const params = useParams();
  const router = useRouter();
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  
  // 固定模式为 worldclock
  type Mode = 'timer' | 'stopwatch' | 'alarm' | 'worldclock';
  const mode = 'worldclock' as Mode;
  
  // 倒计时相关
  const [timeLeft, setTimeLeft] = useState(1800); // Default 30 minutes
  const [initialTime, setInitialTime] = useState(1800);
  
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
    mode,
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
  // 使用惰性初始化，避免服务器端和客户端时间不一致导致的水合错误
  const [currentDate, setCurrentDate] = useState(() => {
    // 服务器端和客户端都返回当前时间，但会在客户端挂载后立即同步
    return new Date();
  });
  const [mounted, setMounted] = useState(false); // 标记客户端是否已挂载
  const [showCardBorder, setShowCardBorder] = useState(true); // 控制大卡片边框显示（全屏模式下）
  
  // 新增功能状态
  const [selectedSound, setSelectedSound] = useState('night_sky');
  const [soundUsageStats, setSoundUsageStats] = useState<Record<string, number>>({});
  const [timerColor, setTimerColor] = useState('blue'); // 倒计时颜色
  const [stopwatchColor, setStopwatchColor] = useState('blue'); // 秒表颜色
  const [worldClockColor, setWorldClockColor] = useState('blue'); // 世界时间大卡片颜色
  const [worldClockSmallCardColor, setWorldClockSmallCardColor] = useState('blue'); // 世界时间小卡片颜色
  const [notificationEnabled, setNotificationEnabled] = useState(false);
  const [showSettingsPanel, setShowSettingsPanel] = useState(false);
  const [progressVisible, setProgressVisible] = useState(true);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  
  // 世界时间颜色修改确认对话框
  const [showWorldClockColorConfirm, setShowWorldClockColorConfirm] = useState(false);
  const [pendingWorldClockColor, setPendingWorldClockColor] = useState<string | null>(null);
  
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
  
  // 自定义添加的城市列表
  const [customCities, setCustomCities] = useState<Array<{
    name: string;
    timezone: string;
    country: string;
  }>>([]);
  
  // 时区选择模态框
  const [showTimezoneModal, setShowTimezoneModal] = useState(false);
  const [timezoneSearch, setTimezoneSearch] = useState('');
  const [inputMode, setInputMode] = useState<'search' | 'manual'>('search'); // 搜索模式或手动输入模式
  
  // 手动输入的状态
  const [manualCityName, setManualCityName] = useState('');
  const [manualCountryName, setManualCountryName] = useState('');
  const [manualTimezone, setManualTimezone] = useState('');
  
  // 闹钟相关
  const [alarms, setAlarms] = useState<Alarm[]>([]);
  const [showAddAlarm, setShowAddAlarm] = useState(false);
  const [editingAlarmId, setEditingAlarmId] = useState<string | null>(null);
  const [newAlarmHour, setNewAlarmHour] = useState(7);
  const [newAlarmMinute, setNewAlarmMinute] = useState(0);
  const [newAlarmRepeat, setNewAlarmRepeat] = useState<'once' | 'daily' | 'weekdays' | 'weekends'>('daily');
  const [newAlarmLabel, setNewAlarmLabel] = useState('');
  const [ringingAlarmId, setRingingAlarmId] = useState<string | null>(null);
  const [ringingAlarm, setRingingAlarm] = useState<Alarm | null>(null);
  const [expandedAlarmId, setExpandedAlarmId] = useState<string | null>(null);
  const [currentRingingDuration, setCurrentRingingDuration] = useState<number>(0);
  const [lastAddedAlarmId, setLastAddedAlarmId] = useState<string | null>(null);
  
  // 倒计时结束弹窗
  const [showTimerEndModal, setShowTimerEndModal] = useState(false);
  const [timerOvertime, setTimerOvertime] = useState(0); // 超时计时（秒）
  
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const alarmCheckIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastToastRef = useRef<{ id: string; time: number } | null>(null);
  const lastClickRef = useRef<{ action: string; time: number } | null>(null);
  const currentRingingAlarmRef = useRef<string | null>(null);
  const alarmRingStartTimeRef = useRef<number | null>(null);
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
  }, [isRunning, soundEnabled, notificationEnabled]);

  // 注意：全屏监听和状态同步已在 useFullscreen hook 中处理

  // 当切换离开世界时间模式时，重置选中的城市
  useEffect(() => {
    if (mode !== 'worldclock') {
      setSelectedCity(null);
    }
  }, [mode]);

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
      const savedAlarms = localStorage.getItem('timer-alarms');
      
      // theme 由 next-themes 自动管理，无需手动加载
      if (savedSound) setSelectedSound(savedSound);
      // 加载独立的颜色设置
      const savedTimerColor = localStorage.getItem('timer-timer-color');
      const savedStopwatchColor = localStorage.getItem('timer-stopwatch-color');
      const savedWorldClockColor = localStorage.getItem('timer-worldclock-color');
      const savedWorldClockSmallCardColor = localStorage.getItem('timer-worldclock-smallcard-color');
      
      // 如果有保存的颜色，使用保存的颜色
      if (savedTimerColor) {
        setTimerColor(savedTimerColor);
      } else if (savedColor) {
        setTimerColor(savedColor); // 向后兼容旧版本
      }
      // 如果没有保存的颜色，使用默认值（在theme ready后会被初始化）
      
      if (savedStopwatchColor) {
        setStopwatchColor(savedStopwatchColor);
      } else if (savedColor) {
        setStopwatchColor(savedColor); // 向后兼容旧版本
      }
      // 如果没有保存的颜色，使用默认值（在theme ready后会被初始化）
      
      if (savedWorldClockColor) {
        setWorldClockColor(savedWorldClockColor);
      } else if (savedColor) {
        setWorldClockColor(savedColor); // 向后兼容旧版本
      }
      // 如果没有保存的颜色，使用默认值（在theme ready后会被初始化）
      
      if (savedWorldClockSmallCardColor) {
        setWorldClockSmallCardColor(savedWorldClockSmallCardColor);
      } else if (savedWorldClockColor) {
        setWorldClockSmallCardColor(savedWorldClockColor); // 如果没有小卡片颜色，使用大卡片颜色
      } else if (savedColor) {
        setWorldClockSmallCardColor(savedColor); // 向后兼容旧版本
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
      
      if (savedAlarms) {
        try {
          setAlarms(JSON.parse(savedAlarms));
        } catch (e) {
          console.error('Failed to parse saved alarms');
        }
      }
      
      if (savedTime) {
        const time = parseInt(savedTime);
        setTimeLeft(time);
        setInitialTime(time);
      }
    }
  }, []);

  // 保存设置到 localStorage (背景相关设置已在 useBackground hook 中处理)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('timer-sound', selectedSound);
      localStorage.setItem('timer-timer-color', timerColor);
      localStorage.setItem('timer-stopwatch-color', stopwatchColor);
      localStorage.setItem('timer-worldclock-color', worldClockColor);
      localStorage.setItem('timer-worldclock-smallcard-color', worldClockSmallCardColor);
      localStorage.setItem('timer-notification', String(notificationEnabled));
      localStorage.setItem('timer-progress', String(progressVisible));
      localStorage.setItem('timer-show-weather-icon', String(showWeatherIcon));
      localStorage.setItem('timer-show-temperature', String(showTemperature));
      localStorage.setItem('timer-show-date', String(showDate));
      localStorage.setItem('timer-show-weekday', String(showWeekday));
    }
  }, [selectedSound, timerColor, stopwatchColor, worldClockColor, worldClockSmallCardColor, notificationEnabled, progressVisible, showWeatherIcon, showTemperature, showDate, showWeekday]);

  // 注意：背景相关的useEffect逻辑已在 useBackground hook 中处理

  // 初始化颜色：第一次打开时根据主题自动选择
  useEffect(() => {
    if (theme && !colorInitializedRef.current && typeof window !== 'undefined') {
      colorInitializedRef.current = true;
      
      const savedTimerColor = localStorage.getItem('timer-timer-color');
      const savedStopwatchColor = localStorage.getItem('timer-stopwatch-color');
      const savedWorldClockColor = localStorage.getItem('timer-worldclock-color');
      const savedWorldClockSmallCardColor = localStorage.getItem('timer-worldclock-smallcard-color');
      const savedColor = localStorage.getItem('timer-color'); // 旧版本兼容
      
      // 如果没有保存过颜色，根据主题设置默认颜色
      if (!savedTimerColor && !savedColor) {
        const defaultColor = theme === 'dark' ? 'white' : 'black';
        setTimerColor(defaultColor);
      }
      
      if (!savedStopwatchColor && !savedColor) {
        const defaultColor = theme === 'dark' ? 'white' : 'black';
        setStopwatchColor(defaultColor);
      }
      
      if (!savedWorldClockColor && !savedColor) {
        const defaultColor = theme === 'dark' ? 'white' : 'black';
        setWorldClockColor(defaultColor);
      }
      
      if (!savedWorldClockSmallCardColor && !savedWorldClockColor && !savedColor) {
        const defaultColor = theme === 'dark' ? 'white' : 'black';
        setWorldClockSmallCardColor(defaultColor);
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
      
      const isStopwatchColorDisabled = 
        (theme === 'light' && stopwatchColor === 'white') || 
        (theme === 'dark' && stopwatchColor === 'black');
      
      const isWorldClockColorDisabled = 
        (theme === 'light' && worldClockColor === 'white') || 
        (theme === 'dark' && worldClockColor === 'black');
      
      const isWorldClockSmallCardColorDisabled = 
        (theme === 'light' && worldClockSmallCardColor === 'white') || 
        (theme === 'dark' && worldClockSmallCardColor === 'black');
      
      if (isTimerColorDisabled) {
        setTimerColor(theme === 'light' ? 'black' : 'white');
      }
      
      if (isStopwatchColorDisabled) {
        setStopwatchColor(theme === 'light' ? 'black' : 'white');
      }
      
      if (isWorldClockColorDisabled) {
        setWorldClockColor(theme === 'light' ? 'black' : 'white');
      }
      
      if (isWorldClockSmallCardColorDisabled) {
        setWorldClockSmallCardColor(theme === 'light' ? 'black' : 'white');
      }
    }
  }, [theme, timerColor, stopwatchColor, worldClockColor, worldClockSmallCardColor]);

  /**
   * 重新加载颜色设置
   * 从localStorage读取最新的颜色值并更新状态
   */
  const reloadColors = () => {
    if (typeof window === 'undefined') return;
    
    const savedTimerColor = localStorage.getItem('timer-timer-color');
    const savedStopwatchColor = localStorage.getItem('timer-stopwatch-color');
    const savedWorldClockColor = localStorage.getItem('timer-worldclock-color');
    const savedWorldClockSmallCardColor = localStorage.getItem('timer-worldclock-smallcard-color');
    
    if (savedTimerColor) {
      setTimerColor(savedTimerColor);
    }
    if (savedStopwatchColor) {
      setStopwatchColor(savedStopwatchColor);
    }
    if (savedWorldClockColor) {
      setWorldClockColor(savedWorldClockColor);
    }
    if (savedWorldClockSmallCardColor) {
      setWorldClockSmallCardColor(savedWorldClockSmallCardColor);
    }
  };

  // 监听localStorage变化，当其他页面设置颜色时自动更新
  useEffect(() => {
    if (typeof window === 'undefined') return;

    /**
     * 处理localStorage变化事件（跨标签页）
     * 当其他标签页设置了颜色时，自动更新当前页面的颜色状态
     */
    const handleStorageChange = (e: StorageEvent) => {
      // 只处理颜色相关的键变化
      if (e.key === 'timer-timer-color' || 
          e.key === 'timer-stopwatch-color' || 
          e.key === 'timer-alarm-color' || 
          e.key === 'timer-worldclock-color' || 
          e.key === 'timer-worldclock-smallcard-color') {
        reloadColors();
      }
    };

    /**
     * 处理自定义事件（同标签页内）
     * 当其他页面设置了颜色时，通过自定义事件通知当前页面
     */
    const handleColorChange = () => {
      reloadColors();
    };

    /**
     * 处理页面可见性变化
     * 当页面重新可见时，重新加载颜色
     */
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        reloadColors();
      }
    };

    /**
     * 处理页面焦点变化
     * 当页面获得焦点时，重新加载颜色
     */
    const handleFocus = () => {
      reloadColors();
    };

    // 添加事件监听器
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('color-change', handleColorChange);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);

    // 清理函数：移除事件监听器
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('color-change', handleColorChange);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, []);

  // 保存上次使用的时长
  useEffect(() => {
    // Note: This is a world-clock page, so timer mode is not applicable
    // Keeping this useEffect for potential future use
  }, [initialTime]);

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
  }, [timeLeft, stopwatchTime, mode, isFullscreen]);

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
    if (mode === 'worldclock' && isFullscreen) {
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

  // 检查闹钟
  useEffect(() => {
    alarmCheckIntervalRef.current = setInterval(() => {
      const now = new Date();
      const currentHour = now.getHours();
      const currentMinute = now.getMinutes();
      
      alarms.forEach(alarm => {
        if (shouldAlarmRing(alarm, now)) {
          // 只在闹钟还没有开始响铃时才设置（使用ref避免闭包问题）
          if (currentRingingAlarmRef.current !== alarm.id) {
            const startTime = Date.now();
            
            currentRingingAlarmRef.current = alarm.id;
            alarmRingStartTimeRef.current = startTime; // 使用ref记录开始响铃的时间
            setRingingAlarmId(alarm.id);
            setRingingAlarm(alarm); // 保存完整的闹钟对象
            playNotificationSound(selectedSound);
            showDesktopNotification(t('notifications.alarm_title'), alarm.label || `${String(alarm.hour).padStart(2, '0')}:${String(alarm.minute).padStart(2, '0')}`);
            
            // 如果是单次闹钟，响铃后删除
            if (alarm.repeat === 'once') {
              setTimeout(() => {
                deleteAlarm(alarm.id);
              }, 1000);
            }
          }
        } else if (alarm.repeat === 'once' && alarm.enabled) {
          // 自动关闭过期的单次闹钟
          const alarmTimeInMinutes = alarm.hour * 60 + alarm.minute;
          const currentTimeInMinutes = currentHour * 60 + currentMinute;
          
          // 如果当前时间已经超过闹钟时间，自动关闭闹钟
          if (currentTimeInMinutes > alarmTimeInMinutes) {
            toggleAlarm(alarm.id);
          }
        }
      });
    }, 1000);

    return () => {
      if (alarmCheckIntervalRef.current) {
        clearInterval(alarmCheckIntervalRef.current);
      }
    };
  }, [alarms]);

  // 更新响铃时长显示
  useEffect(() => {
    let durationInterval: NodeJS.Timeout | null = null;
    
    if (ringingAlarmId && alarmRingStartTimeRef.current) {
      // 立即更新一次
      setCurrentRingingDuration(Math.floor((Date.now() - alarmRingStartTimeRef.current) / 1000));
      
      // 每秒更新一次
      durationInterval = setInterval(() => {
        if (alarmRingStartTimeRef.current) {
          const duration = Math.floor((Date.now() - alarmRingStartTimeRef.current) / 1000);
          setCurrentRingingDuration(duration);
        }
      }, 1000);
    } else {
      setCurrentRingingDuration(0);
    }
    
    return () => {
      if (durationInterval) {
        clearInterval(durationInterval);
      }
    };
  }, [ringingAlarmId]);

  // 自动滚动到最后添加的闹钟
  useEffect(() => {
    // Note: This is a world-clock page, so alarm mode is not applicable
    // Keeping this useEffect for potential future use
    if (lastAddedAlarmId) {
      // 延迟一下，确保DOM已经渲染
      setTimeout(() => {
        const element = document.getElementById(`alarm-${lastAddedAlarmId}`);
        if (element) {
          element.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'center'
          });
          // 清除标记
          setTimeout(() => {
            setLastAddedAlarmId(null);
          }, 1000);
        }
      }, 100);
    }
  }, [lastAddedAlarmId, alarms]);

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
    // World clock mode doesn't use timer functionality
    setIsRunning(!isRunning);
  };

  const resetTimer = () => {
    setIsRunning(false);
    // World clock mode doesn't use timer/stopwatch reset functionality
    setStopwatchTime(0);
  };

  const closeTimerEndModal = () => {
    setShowTimerEndModal(false);
    setTimerOvertime(0);
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
  };

  // 闹钟相关函数
  const addAlarm = () => {
    if (editingAlarmId) {
      // 编辑模式
      const updatedAlarms = alarms.map(alarm =>
        alarm.id === editingAlarmId
          ? {
              ...alarm,
              hour: newAlarmHour,
              minute: newAlarmMinute,
              repeat: newAlarmRepeat,
              label: newAlarmLabel,
            }
          : alarm
      );
      setAlarms(updatedAlarms);
      setLastAddedAlarmId(editingAlarmId); // 编辑后也滚动到该位置
      if (typeof window !== 'undefined') {
        localStorage.setItem('timer-alarms', JSON.stringify(updatedAlarms));
      }
    } else {
      // 添加模式
      const newAlarm: Alarm = {
        id: Date.now().toString(),
        hour: newAlarmHour,
        minute: newAlarmMinute,
        enabled: true,
        repeat: newAlarmRepeat,
        label: newAlarmLabel,
      };
      const updatedAlarms = [...alarms, newAlarm];
      setAlarms(updatedAlarms);
      setLastAddedAlarmId(newAlarm.id); // 设置最后添加的闹钟ID
      if (typeof window !== 'undefined') {
        localStorage.setItem('timer-alarms', JSON.stringify(updatedAlarms));
      }
    }
    setShowAddAlarm(false);
    setEditingAlarmId(null);
    setNewAlarmLabel('');
    setNewAlarmHour(7);
    setNewAlarmMinute(0);
    setNewAlarmRepeat('daily');
  };

  const editAlarm = (alarm: Alarm) => {
    setEditingAlarmId(alarm.id);
    setNewAlarmHour(alarm.hour);
    setNewAlarmMinute(alarm.minute);
    setNewAlarmRepeat(alarm.repeat);
    setNewAlarmLabel(alarm.label || '');
    setShowAddAlarm(true);
  };

  const deleteAlarm = (id: string) => {
    const updatedAlarms = alarms.filter(alarm => alarm.id !== id);
    setAlarms(updatedAlarms);
    // 保存到 localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem('timer-alarms', JSON.stringify(updatedAlarms));
    }
  };

  const toggleAlarm = (id: string) => {
    const updatedAlarms = alarms.map(alarm =>
      alarm.id === id ? { ...alarm, enabled: !alarm.enabled } : alarm
    );
    setAlarms(updatedAlarms);
    // 保存到 localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem('timer-alarms', JSON.stringify(updatedAlarms));
    }
  };

  const stopAlarmRinging = () => {
    // 计算响铃时长
    if (alarmRingStartTimeRef.current) {
      const duration = Math.floor((Date.now() - alarmRingStartTimeRef.current) / 1000);
      const minutes = Math.floor(duration / 60);
      const seconds = duration % 60;
      
      const durationText = minutes > 0 ? `${minutes}分${seconds}秒` : `${seconds}秒`;
      
      showToast(
        'info',
        t('notifications.alarm_closed'),
        t('notifications.ring_duration', { duration: durationText }),
        `alarm-stop-${Date.now()}`
      );
    }
    
    currentRingingAlarmRef.current = null;
    alarmRingStartTimeRef.current = null;
    setRingingAlarmId(null);
    setRingingAlarm(null);
    setCurrentRingingDuration(0);
  };

  const snoozeAlarm = () => {
    if (!ringingAlarmId) return;
    
    // 计算响铃时长
    if (alarmRingStartTimeRef.current) {
      const duration = Math.floor((Date.now() - alarmRingStartTimeRef.current) / 1000);
      const minutes = Math.floor(duration / 60);
      const seconds = duration % 60;
      
      const durationText = minutes > 0 ? `${minutes}分${seconds}秒` : `${seconds}秒`;
      
      showToast(
        'success',
        t('notifications.alarm_snooze'),
        t('notifications.snooze_desc', { duration: durationText }),
        `alarm-snooze-${Date.now()}`
      );
    }
    
    // 关闭当前响铃
    currentRingingAlarmRef.current = null;
    alarmRingStartTimeRef.current = null;
    setRingingAlarmId(null);
    setRingingAlarm(null);
    setCurrentRingingDuration(0);
    
    // 创建一个5分钟后的临时闹钟
    const now = new Date();
    const snoozeTime = new Date(now.getTime() + 5 * 60 * 1000);
    const snoozeAlarmItem: Alarm = {
      id: `snooze-${Date.now()}`,
      hour: snoozeTime.getHours(),
      minute: snoozeTime.getMinutes(),
      enabled: true,
      repeat: 'once',
      label: t('alarm.snooze_label'),
    };
    
    const updatedAlarms = [...alarms, snoozeAlarmItem];
    setAlarms(updatedAlarms);
    // 不设置 lastAddedAlarmId，避免自动滚动和切换界面
    
    // 保存到 localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem('timer-alarms', JSON.stringify(updatedAlarms));
    }
  };

  const shouldAlarmRing = (alarm: Alarm, now: Date): boolean => {
    if (!alarm.enabled) return false;

    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    const currentSecond = now.getSeconds();
    const currentDay = now.getDay(); // 0 = Sunday, 6 = Saturday

    // 只在整点秒数触发（避免重复触发）
    if (currentSecond !== 0) return false;

    // 检查时间是否匹配
    if (currentHour !== alarm.hour || currentMinute !== alarm.minute) return false;

    // 检查重复设置
    if (alarm.repeat === 'once') {
      return true;
    } else if (alarm.repeat === 'daily') {
      return true;
    } else if (alarm.repeat === 'weekdays') {
      return currentDay >= 1 && currentDay <= 5; // Monday to Friday
    } else if (alarm.repeat === 'weekends') {
      return currentDay === 0 || currentDay === 6; // Sunday or Saturday
    }

    return false;
  };

  // 注意：toggleFullscreen 函数已在 useFullscreen hook 中提供

  const applyCustomTime = () => {
    const totalSeconds = customMinutes * 60 + customSeconds;
    if (totalSeconds > 0) {
      setIsRunning(false);
      // World clock mode doesn't use timer/stopwatch functionality
      setStopwatchTime(totalSeconds);
      setShowEditModal(false);
    }
  };

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    // Always show hours if hours > 0
    if (hours > 0) {
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

  // 格式化响铃时长
  const formatRingingDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    
    const duration = minutes > 0 ? `${minutes}分${secs}秒` : `${secs}秒`;
    return t('alarm.ringing', { duration });
  };

  // 根据当前模式选择对应的颜色
  const currentColorId = worldClockColor;
  const themeColor = THEME_COLORS.find(c => c.id === currentColorId) || THEME_COLORS[0];

  return (
    <div 
      className={`${isFullscreen ? 'fixed inset-0 z-50' : 'min-h-screen'} ${
        backgroundType === 'default' 
          ? (mounted && theme === 'dark' ? 'bg-black' : 'bg-gray-100') 
          : ''
      } flex flex-col ${isFullscreen ? 'p-0' : 'p-0 sm:p-4'} transition-colors duration-300 relative`}
      suppressHydrationWarning
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
                false // Always false in worldclock mode
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
                false // Always false in worldclock mode
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
                false // Always false in worldclock mode
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
                mode === 'worldclock' 
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
                className={`border-t ${!mounted ? 'border-gray-200/50' : theme === 'dark' ? 'border-slate-700/50' : 'border-gray-200/50'}`}
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
      <div className="flex-1 flex items-center justify-center relative sm:pt-0 pt-[120px]">
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

        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className={`w-full flex flex-col items-center ${!isFullscreen ? 'justify-center' : 'pt-12 sm:pt-20'}`}
        >
          {/* 日期和天气显示 - 非全屏时显示 */}
          {false && (
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
          )}

          {/* Time Display or Alarm List or World Clock */}
          {false ? (
            <div className={`text-center w-full flex items-center justify-center px-2 sm:px-4 ${
              isFullscreen ? 'flex-1' : ''
            }`}>
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
                } leading-none flex items-center justify-center whitespace-nowrap`}
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
                  const hasGradient = themeColor.gradient && false;
                  
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
              {false && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`font-semibold mt-4 sm:mt-6 md:mt-8 text-green-500 ${
                    isFullscreen 
                      ? 'text-3xl sm:text-4xl md:text-5xl' 
                      : 'text-2xl sm:text-3xl'
                  }`}
                >
                  时间到
                </motion.div>
              )}
            </div>
          ) : false ? (
            /* 闹钟模式 */
            <>
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
                className="mb-4 sm:mb-6 md:mb-8 px-4"
              />
              
              {/* 闹钟列表 */}
            <div className="w-full flex justify-center px-4 overflow-x-hidden no-horizontal-scroll">
              <div 
                className="w-full overflow-x-hidden no-horizontal-scroll"
                style={{
                  width: '100%',
                  minWidth: '300px',
                  maxWidth: 'min(var(--timer-width, 672px), 90vw)'
                }}
              >
                {/* 闹钟列表 */}
                <div className="space-y-3 mb-4 max-h-[calc(100vh-500px)] min-h-[200px] overflow-y-auto overflow-x-hidden scrollbar-thin no-horizontal-scroll">
                {alarms.length === 0 ? (
                  <div className={`text-center py-12 rounded-lg ${
                    theme === 'dark' 
                      ? 'bg-slate-800/80 text-gray-300 backdrop-blur-sm' 
                      : 'bg-white/80 text-gray-600 backdrop-blur-sm shadow-sm'
                  }`}>
                    {t('alarm.no_alarms')}
                  </div>
                ) : (
                  // 按时间排序闹钟列表
                  [...alarms].sort((a, b) => {
                    // 先按小时排序，再按分钟排序
                    if (a.hour !== b.hour) {
                      return a.hour - b.hour;
                    }
                    return a.minute - b.minute;
                  }).map((alarm) => (
                    <motion.div
                      key={alarm.id}
                      id={`alarm-${alarm.id}`}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ 
                        opacity: 1, 
                        y: 0,
                        scale: lastAddedAlarmId === alarm.id ? [1, 1.02, 1] : 1
                      }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{
                        scale: { duration: 0.5, times: [0, 0.5, 1] }
                      }}
                      className={`py-6 px-4 rounded-[8px] flex items-start justify-between ${
                        theme === 'dark' 
                          ? 'bg-slate-800/90 hover:bg-slate-700/90 backdrop-blur-sm' 
                          : 'bg-white/90 hover:bg-gray-50/90 backdrop-blur-sm shadow-sm'
                      } transition-all ${alarm.id === ringingAlarmId ? 'ring-2 ring-red-500 animate-pulse' : ''} ${
                        lastAddedAlarmId === alarm.id ? 'ring-2 ring-blue-400' : ''
                      }`}
                      style={{ 
                        width: '100%', 
                        maxWidth: '100%', 
                        boxSizing: 'border-box',
                        overflow: expandedAlarmId === alarm.id ? 'visible' : 'hidden'
                      }}
                    >
                      <div 
                        className="flex items-start gap-4" 
                        style={{ 
                          flex: '1 1 0', 
                          minWidth: 0
                        }}
                      >
                        {/* 开关 */}
                        <button
                          onClick={() => toggleAlarm(alarm.id)}
                          className={`w-12 h-7 rounded-full transition-colors flex-shrink-0 mt-1.5 ${
                            alarm.enabled 
                              ? 'bg-blue-500' 
                              : theme === 'dark' ? 'bg-gray-600' : 'bg-gray-300'
                          } relative`}
                        >
                          <span
                            className={`absolute top-1 ${alarm.enabled ? 'right-1' : 'left-1'} w-5 h-5 bg-white rounded-full transition-all`}
                          />
                        </button>

                        {/* 时间和重复类型 */}
                        <div 
                          className="flex flex-col gap-2" 
                          style={{ 
                            flex: '1 1 0', 
                            minWidth: 0
                          }}
                        >
                          <div 
                            className="flex items-center gap-3 cursor-pointer" 
                            onClick={() => editAlarm(alarm)}
                          >
                            <div className={`text-3xl font-bold flex-shrink-0 ${theme === 'dark' ? 'text-white hover:text-blue-400' : 'text-gray-900 hover:text-blue-600'} transition-colors`}>
                              {String(alarm.hour).padStart(2, '0')}:{String(alarm.minute).padStart(2, '0')}
                            </div>
                            <div 
                              className="flex items-center min-w-0 gap-2"
                            >
                              {/* 重复类型 - 不换行 */}
                              <span className={`text-sm flex-shrink-0 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                                {alarm.repeat === 'once' ? t('alarm.repeat_once') :
                                 alarm.repeat === 'daily' ? t('alarm.repeat_daily') :
                                 alarm.repeat === 'weekdays' ? t('alarm.repeat_weekdays') :
                                 t('alarm.repeat_weekends')}
                              </span>
                              
                              {/* 标签 - 可点击展开 */}
                              {alarm.label && (
                                <>
                                  <span className={`flex-shrink-0 ${theme === 'dark' ? 'text-gray-600' : 'text-gray-400'}`}>|</span>
                                  <span 
                                    className={`text-sm cursor-pointer ${theme === 'dark' ? 'text-gray-400 hover:text-gray-300' : 'text-gray-600 hover:text-gray-700'} transition-colors ${
                                      expandedAlarmId === alarm.id ? '' : 'truncate'
                                    }`}
                                    style={expandedAlarmId === alarm.id ? {
                                      whiteSpace: 'normal',
                                      wordBreak: 'break-word',
                                      overflowWrap: 'break-word'
                                    } : {}}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setExpandedAlarmId(expandedAlarmId === alarm.id ? null : alarm.id);
                                    }}
                                    title={expandedAlarmId === alarm.id ? t('alarm.click_collapse') : t('alarm.click_expand')}
                                  >
                                    {alarm.label}
                                  </span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* 删除按钮 */}
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => deleteAlarm(alarm.id)}
                        className={`p-2 rounded-lg transition-colors flex-shrink-0 mt-1 ${
                          theme === 'dark' 
                            ? 'hover:bg-red-500/20 text-red-400' 
                            : 'hover:bg-red-500/20 text-red-600'
                        }`}
                      >
                        <Trash2 className="w-5 h-5" />
                      </motion.button>
                    </motion.div>
                  ))
                )}
              </div>

              {/* 添加闹钟按钮 */}
              {!isFullscreen && (
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    const now = new Date();
                    setNewAlarmHour(now.getHours());
                    setNewAlarmMinute(now.getMinutes());
                    setNewAlarmRepeat('daily');
                    setNewAlarmLabel('');
                    setEditingAlarmId(null);
                    setShowAddAlarm(true);
                  }}
                  className={`w-full p-4 mb-4 rounded-[8px] flex items-center justify-center gap-2 transition-colors backdrop-blur-sm ${
                    theme === 'dark' 
                      ? 'bg-blue-500/80 hover:bg-blue-600/80 text-white shadow-lg' 
                      : 'bg-blue-500/80 hover:bg-blue-600/80 text-white shadow-lg'
                  }`}
                >
                  <Plus className="w-5 h-5" />
                    <span className="font-medium">{t('buttons.add_alarm')}</span>
                </motion.button>
              )}

              {/* 快捷设置按钮 - 仅在闹钟模式下显示 */}
              {!isFullscreen && (
              <div className="mt-8">
                <p className={`text-xs sm:text-sm mb-3 sm:mb-4 text-center font-medium ${
                  theme === 'dark' ? 'text-slate-300' : 'text-gray-700'
                }`}>
                  {t('alarm.quick_add')}
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { key: '1min', seconds: 60 },
                    { key: '3min', seconds: 180 },
                    { key: '5min', seconds: 300 },
                    { key: '15min', seconds: 900 },
                    { key: '30min', seconds: 1800 },
                    { key: '1hour', seconds: 3600 },
                  ].map((preset) => (
                    <motion.button
                      key={preset.seconds}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => {
                        // 防抖：检查是否在500ms内点击了相同的按钮
                        const actionKey = `preset-${preset.seconds}`;
                        const now = Date.now();
                        if (lastClickRef.current && lastClickRef.current.action === actionKey && (now - lastClickRef.current.time) < 500) {
                          return;
                        }
                        lastClickRef.current = { action: actionKey, time: now };
                        
                        // 计算当前时间加上指定秒数后的时间
                        const currentTime = new Date();
                        const futureTime = new Date(currentTime.getTime() + preset.seconds * 1000);
                        const hour = futureTime.getHours();
                        const minute = futureTime.getMinutes();
                        
                        // 检查是否已存在相同时间的闹钟
                        const existingAlarm = alarms.find(
                          alarm => alarm.hour === hour && alarm.minute === minute && alarm.repeat === 'once'
                        );
                        
                        if (existingAlarm) {
                          // 如果已存在，显示提示信息并滚动到该闹钟
                          setLastAddedAlarmId(existingAlarm.id);
                          const timeStr = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
                          showToast(
                            'info',
                            t('notifications.alarm_exists'),
                            t('notifications.alarm_exists_desc', { time: timeStr }),
                            `alarm-exists-${hour}-${minute}`
                          );
                          return;
                        }
                        
                        // 创建新闹钟
                        const newAlarm: Alarm = {
                          id: Date.now().toString(),
                          hour: hour,
                          minute: minute,
                          enabled: true,
                          repeat: 'once',
                          label: t(`presets.${preset.key}`),
                        };
                        
                        const updatedAlarms = [...alarms, newAlarm];
                        setAlarms(updatedAlarms);
                        setLastAddedAlarmId(newAlarm.id); // 设置最后添加的闹钟ID
                        
                        // 保存到 localStorage
                        if (typeof window !== 'undefined') {
                          localStorage.setItem('timer-alarms', JSON.stringify(updatedAlarms));
                        }
                        
                        // 显示成功提示
                        const timeStr = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
                        showToast(
                          'success',
                          t('notifications.alarm_success', { preset: t(`presets.${preset.key}`) }),
                          t('notifications.alarm_success_desc', { time: timeStr }),
                          `alarm-success-${hour}-${minute}`
                        );
                      }}
                      className={`px-4 py-3 rounded-[8px] text-sm font-medium transition-all backdrop-blur-sm ${
                        theme === 'dark'
                          ? 'bg-slate-700/80 text-slate-200 hover:bg-slate-600/80 border border-slate-600/50'
                          : 'bg-white/80 text-slate-700 hover:bg-gray-50/80 border border-slate-200/50 shadow-sm'
                      }`}
                    >
                      {t(`presets.${preset.key}`)}
                    </motion.button>
                  ))}
                </div>
              </div>
              )}
              </div>
            </div>
            </>
          ) : mode === 'worldclock' ? (
            /* 世界时间 */
            <div className="w-full overflow-x-hidden mt-4 sm:mt-6 md:mt-8 lg:mt-12" style={{ paddingLeft: 'clamp(8px, 2vw, 32px)', paddingRight: 'clamp(8px, 2vw, 32px)' }}>
              {/* H1 标题 - SEO优化 */}
              <h1 className="sr-only">{t('modes.worldclock')} - {t('worldclock.local_time')}</h1>
              <div className="w-full flex flex-col items-center">
                {/* 用户当前时间卡片 */}
                {(selectedCity || userLocation) && (() => {
                  // 优先显示选中的城市，否则显示IP定位的城市
                  const displayCity = selectedCity || userLocation;
                  if (!displayCity) return null;
                  
                  return (
                    <motion.div
                      key={selectedCity ? 'selected' : 'user-location'} // 添加 key 以触发重新渲染动画
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3 }}
                      className={`py-4 sm:py-6 md:py-8 lg:py-10 xl:py-12 px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 rounded-2xl sm:rounded-3xl ${
                        showCardBorder 
                          ? (theme === 'dark' 
                              ? 'bg-slate-800/50 border border-slate-700 shadow-2xl' 
                              : 'bg-white border border-gray-200 shadow-2xl')
                          : 'bg-transparent border-0 shadow-none'
                      }`}
                style={{
                  width: '100%',
                  minWidth: '280px',
                        maxWidth: 'min(1400px, 95vw)',
                        marginBottom: 'clamp(16px, 3vw, 48px)',
                        transition: 'all 0.3s ease-in-out',
                        maxHeight: 'calc(100vh - clamp(80px, 15vh, 200px))',
                        overflow: 'visible',
                        display: 'flex',
                        flexDirection: 'column'
                      }}
                    >
                      <div className="w-full flex-1 flex flex-col justify-between min-h-0 overflow-visible">
                        {/* 顶部：城市和白天/黑夜图标 */}
                        <div className="flex items-center justify-between mb-2 sm:mb-3 md:mb-4 lg:mb-5 flex-shrink-0 overflow-visible">
                          <h2 className={`text-lg sm:text-xl md:text-2xl lg:text-3xl xl:text-4xl font-bold flex-1 mr-2 leading-normal ${
                            !mounted ? 'text-gray-900' : theme === 'dark' ? 'text-white' : 'text-gray-900'
                          }`}>
                            {displayCity.city} | {displayCity.country}
                          </h2>
                          {(() => {
                            // 使用 currentDate 状态而不是 new Date()，避免水合错误
                            const now = currentDate;
                            const userTime = new Date(now.toLocaleString('en-US', { timeZone: displayCity.timezone }));
                            const hours = userTime.getHours();
                            const isNight = hours < 6 || hours >= 18;
                            
                            return isNight ? (
                              <Moon className={`w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8 lg:w-10 lg:h-10 xl:w-12 xl:h-12 flex-shrink-0 ${!mounted ? 'text-slate-500' : theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`} />
                            ) : (
                              <Sun className={`w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8 lg:w-10 lg:h-10 xl:w-12 xl:h-12 flex-shrink-0 ${!mounted ? 'text-yellow-600' : theme === 'dark' ? 'text-yellow-500' : 'text-yellow-600'}`} />
                            );
                          })()}
                        </div>
                        
                        {/* 分隔线 */}
                        <div className={`border-t mb-2 sm:mb-3 md:mb-4 lg:mb-5 flex-shrink-0 ${!mounted ? 'border-gray-300' : theme === 'dark' ? 'border-slate-700' : 'border-gray-300'}`}></div>
                        
                        {/* 大时间显示 */}
                        {(() => {
                          // 使用 currentDate 状态而不是 new Date()，避免水合错误
                          const now = currentDate;
                          const userTime = new Date(now.toLocaleString('en-US', { timeZone: displayCity.timezone }));
                          const hours = String(userTime.getHours()).padStart(2, '0');
                          const minutes = String(userTime.getMinutes()).padStart(2, '0');
                          const seconds = String(userTime.getSeconds()).padStart(2, '0');
                          
                          const worldClockThemeColor = THEME_COLORS.find(c => c.id === worldClockColor) || THEME_COLORS[0];
                          
                          return (
                        <div 
                          className="font-bold text-center mb-2 sm:mb-3 md:mb-4 lg:mb-5 flex-shrink-0"
                          style={{
                            fontFamily: '"Rajdhani", sans-serif',
                            fontWeight: '700',
                            letterSpacing: '0.02em',
                            color: worldClockThemeColor.gradient ? undefined : worldClockThemeColor.color,
                            fontSize: 'clamp(2.5rem, 8vw, 11rem)',
                            lineHeight: '1.1'
                          }}
                          suppressHydrationWarning
                        >
                          {(() => {
                            
                            // 定义数字样式函数
                            const getNumberStyle = () => {
                              if (worldClockThemeColor.gradient) {
                                return {
                                  backgroundImage: worldClockThemeColor.gradient,
                                  backgroundClip: 'text',
                                  WebkitBackgroundClip: 'text',
                                  WebkitTextFillColor: 'transparent',
                                  color: 'transparent',
                                  display: 'inline-block',
                                };
                              } else {
                                return {
                                  color: worldClockThemeColor.color,
                                };
                              }
                            };
                            
                            // 冒号颜色
                            const separatorColor = worldClockThemeColor.gradient 
                              ? worldClockThemeColor.color 
                              : 'currentColor';
                            
                            return (
                              <span className="flex items-center justify-center gap-[0.08em]">
                                <span style={getNumberStyle()}>{hours}</span>
                                <span className="inline-flex flex-col justify-center gap-[0.15em]">
                                  <span className="w-[0.12em] h-[0.12em] rounded-full" style={{ backgroundColor: separatorColor }}></span>
                                  <span className="w-[0.12em] h-[0.12em] rounded-full" style={{ backgroundColor: separatorColor }}></span>
                                </span>
                                <span style={getNumberStyle()}>{minutes}</span>
                                <span className="inline-flex flex-col justify-center gap-[0.15em]">
                                  <span className="w-[0.12em] h-[0.12em] rounded-full" style={{ backgroundColor: separatorColor }}></span>
                                  <span className="w-[0.12em] h-[0.12em] rounded-full" style={{ backgroundColor: separatorColor }}></span>
                                </span>
                                <span className="text-[0.5em]" style={getNumberStyle()}>{seconds}</span>
                              </span>
                            );
                          })()}
                        </div>
                          );
                        })()}
                        
                        {/* 日期显示 */}
                        <div className={`flex items-center justify-center gap-2 sm:gap-3 md:gap-4 lg:gap-6 font-medium mb-2 sm:mb-3 md:mb-4 lg:mb-5 flex-shrink-0 ${
                          theme === 'dark' ? 'text-slate-300' : 'text-gray-700'
                        }`}
                        style={{
                          fontSize: 'clamp(0.875rem, 2vw, 1.875rem)'
                        }}>
                          {(() => {
                            // 使用 currentDate 状态而不是 new Date()，避免水合错误
                            const now = currentDate;
                            const userTime = new Date(now.toLocaleString('en-US', { timeZone: displayCity.timezone }));
                            const year = userTime.getFullYear();
                            const month = userTime.getMonth() + 1;
                            const day = userTime.getDate();
                            const weekdays = [
                              t('weekdays.sunday'), 
                              t('weekdays.monday'), 
                              t('weekdays.tuesday'), 
                              t('weekdays.wednesday'), 
                              t('weekdays.thursday'), 
                              t('weekdays.friday'), 
                              t('weekdays.saturday')
                            ];
                            const weekday = weekdays[userTime.getDay()];
                            return (
                              <>
                                <span>
                                  {locale === 'zh' 
                                    ? `${year}年${month}月${day}日`
                                    : `${month}/${day}/${year}`
                                  }
                                </span>
                                <span>{weekday}</span>
                              </>
                            );
                          })()}
                        </div>
                        
                        {/* 底部：温度和定位信息 */}
                        <div className="flex items-center justify-between flex-shrink-0">
                          {(() => {
                            // 优先使用 selectedCity 的天气，否则使用 weather 状态
                            const displayWeather = selectedCity 
                              ? { temp: selectedCity.temp, icon: selectedCity.weatherCode }
                              : weather;
                            
                            return displayWeather ? (
                              <div className="flex items-center gap-1.5 sm:gap-2 md:gap-3">
                                <div className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 lg:w-7 lg:h-7 xl:w-8 xl:h-8 flex-shrink-0">
                                  {getWeatherIcon(displayWeather.icon, theme || 'dark', mounted)}
                                </div>
                                <span className={`font-semibold ${
                                  theme === 'dark' ? 'text-white' : 'text-gray-900'
                                }`}
                                style={{
                                  fontSize: 'clamp(0.875rem, 2vw, 1.875rem)'
                                }}>
                                  {displayWeather.temp}°C
                                </span>
                              </div>
                            ) : null;
                          })()}
                          <div className="flex items-center gap-1 sm:gap-1.5 md:gap-2">
                            <MapPin className={`flex-shrink-0 ${
                              theme === 'dark' ? 'text-slate-400' : 'text-gray-600'
                            }`}
                            style={{
                              width: 'clamp(0.875rem, 1.5vw, 1.25rem)',
                              height: 'clamp(0.875rem, 1.5vw, 1.25rem)'
                            }} />
                            <span className={`font-normal ${
                              theme === 'dark' ? 'text-slate-400' : 'text-gray-600'
                            }`}
                            style={{
                              fontSize: 'clamp(0.75rem, 1.5vw, 1.125rem)'
                            }}>
                              {displayCity.city}
                            </span>
                          </div>
                        </div>
                        
                      </div>
                    </motion.div>
                  );
                })()}
                
                {/* 小卡片网格 - 可自动隐藏 */}
                <AnimatePresence>
                  {showCardBorder && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 20 }}
                      transition={{ duration: 0.3 }}
                      className="w-full flex justify-center"
                    >
                      {/* H2 标题 - 世界城市时间列表 */}
                      <h2 className="sr-only">{t('worldclock.more')} - {t('worldclock.add_timezone')}</h2>
                      <div 
                        className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 mb-8"
                        style={{
                          width: '100%',
                          minWidth: '280px',
                          maxWidth: 'min(1400px, 95vw)',
                          gap: '16px',
                          padding: '0 8px'
                        }}
                      >
                  {WORLD_CITIES.map((city) => {
                    // 使用 currentDate 状态而不是 new Date()，避免水合错误
                    const now = currentDate;
                    const cityTime = new Date(now.toLocaleString('en-US', { timeZone: city.timezone }));
                    const hours = cityTime.getHours();
                    const minutes = cityTime.getMinutes();
                    const seconds = cityTime.getSeconds();
                    
                    // 获取日期
                    const year = cityTime.getFullYear();
                    const month = cityTime.getMonth() + 1;
                    const day = cityTime.getDate();
                    const weekdays = [
                      t('weekdays.sunday'), 
                      t('weekdays.monday'), 
                      t('weekdays.tuesday'), 
                      t('weekdays.wednesday'), 
                      t('weekdays.thursday'), 
                      t('weekdays.friday'), 
                      t('weekdays.saturday')
                    ];
                    const weekday = weekdays[cityTime.getDay()];
                    
                    // 计算与本地时间的时差
                    const localOffset = -now.getTimezoneOffset() / 60;
                    const timeDiff = city.offset - localOffset;
                    const diffText = timeDiff === 0 ? t('worldclock.local_time') : 
                                   timeDiff > 0 ? t('worldclock.time_diff', { diff: `+${timeDiff}` }) : 
                                   t('worldclock.time_diff', { diff: timeDiff });
                    
                    // 判断是白天还是夜晚
                    const isNight = hours < 6 || hours >= 18;
                    
                    return (
                      <motion.div
                        key={city.key}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        onClick={() => {
                          setSelectedCity({
                            city: t(`cities.${city.key}`),
                            timezone: city.timezone,
                            country: t(`countries.${city.countryKey}`),
                            weatherCode: city.weatherCode,
                            temp: city.temp
                          });
                        }}
                        className={`p-3 sm:p-4 rounded-xl transition-all cursor-pointer ${
                          !mounted
                            ? 'bg-white border border-gray-200 hover:bg-gray-50'
                            : theme === 'dark' 
                            ? 'bg-slate-800/50 border border-slate-700 hover:bg-slate-800/70' 
                            : 'bg-white border border-gray-200 hover:bg-gray-50'
                        } shadow-lg hover:shadow-xl`}
                      >
                        <div className="flex items-center justify-between mb-3">
                          <h3 className={`text-base sm:text-lg font-bold ${!mounted ? 'text-gray-600' : theme === 'dark' ? 'text-slate-400' : 'text-gray-600'}`}>
                            {t(`cities.${city.key}`)} | {t(`countries.${city.countryKey}`)}
                          </h3>
                          {isNight ? (
                            <Moon className={`w-5 h-5 ${!mounted ? 'text-slate-500' : theme === 'dark' ? 'text-slate-500' : 'text-slate-500'}`} />
                          ) : (
                            <Sun className={`w-5 h-5 ${!mounted ? 'text-yellow-600/80' : theme === 'dark' ? 'text-yellow-600/70' : 'text-yellow-600/80'}`} />
                          )}
                        </div>
                        
                        {/* 分隔线 */}
                        <div className={`border-t mb-3 ${!mounted ? 'border-gray-300' : theme === 'dark' ? 'border-slate-700' : 'border-gray-300'}`}></div>
                        
                        <div 
                          className={`text-3xl sm:text-4xl font-bold mb-4 text-center`}
                          style={{
                            fontFamily: '"Rajdhani", sans-serif',
                            letterSpacing: '0.05em',
                            color: (() => {
                              const smallCardThemeColor = THEME_COLORS.find(c => c.id === worldClockSmallCardColor) || THEME_COLORS[0];
                              return smallCardThemeColor.gradient ? smallCardThemeColor.color : smallCardThemeColor.color;
                            })(),
                          }}
                          suppressHydrationWarning
                        >
                          {String(hours).padStart(2, '0')}:{String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
                        </div>
                        
                        <div className={`text-sm sm:text-base font-medium mb-4 text-center ${theme === 'dark' ? 'text-slate-500' : 'text-gray-500'}`}>
                          {locale === 'zh' 
 ? `${year}年${month}月${day}日 ${weekday}`
 : `${month}/${day}/${year} ${weekday}`
}
                        </div>
                        
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-1">
                            <div className="w-5 h-5">
                            {getWeatherIcon(city.weatherCode, theme || 'dark', mounted)}
                            </div>
                            <span className={`text-base sm:text-lg font-semibold ${theme === 'dark' ? 'text-slate-400' : 'text-gray-600'}`}>
                              {city.temp}°C
                            </span>
                          </div>
                          <div className={`text-sm ${theme === 'dark' ? 'text-slate-500' : 'text-gray-500'}`}>
                          {diffText}
                        </div>
                        </div>
                      </motion.div>
                    );
                  })}
                  
                  {/* 自定义添加的城市卡片 */}
                  {customCities.map((customCity, index) => {
                    // 使用 currentDate 状态而不是 new Date()，避免水合错误
                    const now = currentDate;
                    const cityTime = new Date(now.toLocaleString('en-US', { timeZone: customCity.timezone }));
                    const hours = cityTime.getHours();
                    const minutes = cityTime.getMinutes();
                    const seconds = cityTime.getSeconds();
                    
                    // 获取日期
                    const year = cityTime.getFullYear();
                    const month = cityTime.getMonth() + 1;
                    const day = cityTime.getDate();
                    const weekdays = [
                      t('weekdays.sunday'), 
                      t('weekdays.monday'), 
                      t('weekdays.tuesday'), 
                      t('weekdays.wednesday'), 
                      t('weekdays.thursday'), 
                      t('weekdays.friday'), 
                      t('weekdays.saturday')
                    ];
                    const weekday = weekdays[cityTime.getDay()];
                    
                    // 计算与本地时间的时差
                    const localOffset = -now.getTimezoneOffset() / 60;
                    const cityOffset = cityTime.getTimezoneOffset() / -60;
                    const timeDiff = cityOffset - localOffset;
                    const diffText = timeDiff === 0 ? t('worldclock.local_time') : 
                                   timeDiff > 0 ? t('worldclock.time_diff', { diff: `+${timeDiff}` }) : 
                                   t('worldclock.time_diff', { diff: timeDiff });
                    
                    // 判断是白天还是夜晚
                    const isNight = hours < 6 || hours >= 18;
                    
                    return (
                      <motion.div
                        key={`custom-${index}`}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        onClick={() => {
                          setSelectedCity({
                            city: customCity.name,
                            timezone: customCity.timezone,
                            country: customCity.country,
                            weatherCode: '116',
                            temp: 20
                          });
                        }}
                        className={`p-3 sm:p-4 rounded-xl transition-all cursor-pointer relative ${
                          !mounted
                            ? 'bg-white border border-gray-200 hover:bg-gray-50'
                            : theme === 'dark' 
                            ? 'bg-slate-800/50 border border-slate-700 hover:bg-slate-800/70' 
                            : 'bg-white border border-gray-200 hover:bg-gray-50'
                        } shadow-lg hover:shadow-xl`}
                      >
                        {/* 删除按钮 */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setCustomCities(customCities.filter((_, i) => i !== index));
                          }}
                          className={`absolute top-2 right-2 p-1 rounded-full transition-colors ${
                            !mounted
                              ? 'hover:bg-red-100 text-red-600'
                              : theme === 'dark'
                              ? 'hover:bg-red-900/30 text-red-400'
                              : 'hover:bg-red-100 text-red-600'
                          }`}
                        >
                          <X className="w-4 h-4" />
                        </button>
                        
                        <div className="flex items-center justify-between mb-3 pr-6">
                          <h3 className={`text-base sm:text-lg font-bold ${!mounted ? 'text-gray-600' : theme === 'dark' ? 'text-slate-400' : 'text-gray-600'}`}>
                            {customCity.name} | {customCity.country}
                          </h3>
                          {isNight ? (
                            <Moon className={`w-5 h-5 ${!mounted ? 'text-slate-500' : theme === 'dark' ? 'text-slate-500' : 'text-slate-500'}`} />
                          ) : (
                            <Sun className={`w-5 h-5 ${!mounted ? 'text-yellow-600/80' : theme === 'dark' ? 'text-yellow-600/70' : 'text-yellow-600/80'}`} />
                          )}
                        </div>
                        
                        {/* 分隔线 */}
                        <div className={`border-t mb-3 ${!mounted ? 'border-gray-300' : theme === 'dark' ? 'border-slate-700' : 'border-gray-300'}`}></div>
                        
                        <div 
                          className={`text-3xl sm:text-4xl font-bold mb-4 text-center`}
                          style={{
                            fontFamily: '"Rajdhani", sans-serif',
                            letterSpacing: '0.05em',
                            color: (() => {
                              const smallCardThemeColor = THEME_COLORS.find(c => c.id === worldClockSmallCardColor) || THEME_COLORS[0];
                              return smallCardThemeColor.gradient ? smallCardThemeColor.color : smallCardThemeColor.color;
                            })(),
                          }}
                          suppressHydrationWarning
                        >
                          {String(hours).padStart(2, '0')}:{String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
                        </div>
                        
                        <div className={`text-sm sm:text-base font-medium mb-4 text-center ${theme === 'dark' ? 'text-slate-500' : 'text-gray-500'}`}>
                          {locale === 'zh' 
  ? `${year}年${month}月${day}日 ${weekday}`
  : `${month}/${day}/${year} ${weekday}`
}
                        </div>
                        
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-1">
                            <div className="w-5 h-5">
                              <Cloud className={`w-5 h-5 ${theme === 'dark' ? 'text-slate-400' : 'text-gray-500'}`} />
                            </div>
                            <span className={`text-base sm:text-lg font-semibold ${theme === 'dark' ? 'text-slate-400' : 'text-gray-600'}`}>
                              --°C
                            </span>
                          </div>
                          <div className={`text-sm ${theme === 'dark' ? 'text-slate-500' : 'text-gray-500'}`}>
                          {diffText}
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                  
                  {/* "更多"按钮卡片 */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    onClick={() => setShowTimezoneModal(true)}
                    className={`p-4 sm:p-6 rounded-xl transition-all cursor-pointer flex flex-col items-center justify-center min-h-[180px] sm:min-h-[200px] ${
                      theme === 'dark' 
                        ? 'bg-slate-800/30 border-2 border-dashed border-slate-600 hover:bg-slate-800/50 hover:border-slate-500' 
                        : 'bg-gray-50 border-2 border-dashed border-gray-300 hover:bg-gray-100 hover:border-gray-400'
                    }`}
                  >
                    <Plus className={`w-12 h-12 mb-3 ${theme === 'dark' ? 'text-slate-500' : 'text-gray-400'}`} />
                    <span className={`text-lg font-medium ${theme === 'dark' ? 'text-slate-400' : 'text-gray-600'}`}>
                      {t('worldclock.more')}
                    </span>
                  </motion.div>
                </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          ) : null}

          {/* 进度条 - 仅非全屏模式显示 */}
          {false && progressVisible && !isFullscreen && timeLeft > 0 && initialTime > 0 && (
            <div className="w-full flex justify-center mt-6 sm:mt-8 md:mt-10">
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

          {/* Control Buttons */}
          <AnimatePresence>
            {showControls && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                transition={{ duration: 0.3 }}
                className={`flex flex-wrap justify-center gap-2 sm:gap-3 md:gap-4 ${
                  isFullscreen 
                    ? 'mt-4 sm:mt-12 md:mt-16 lg:mt-20 px-2' 
                    : 'mt-6 sm:mt-8 md:mt-12'
                }`}
                onMouseEnter={() => { isHoveringControls.current = true; }}
                onMouseLeave={() => { isHoveringControls.current = false; }}
              >
                {false && (
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

          {/* 预设时间快捷按钮 - 仅倒计时模式显示 */}
          <AnimatePresence>
            {!isFullscreen && false && showControls && (
              <div 
                className="mt-6 sm:mt-8 md:mt-12 w-full flex justify-center"
                onMouseEnter={() => { isHoveringControls.current = true; }}
                onMouseLeave={() => { isHoveringControls.current = false; }}
              >
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 20 }}
                  transition={{ duration: 0.3 }}
                  className="inline-block"
                  style={{
                    width: 'var(--timer-width, auto)',
                    minWidth: '300px',
                    maxWidth: '90vw'
                  }}
                >
                  <p className={`text-xs sm:text-sm ${theme === 'dark' ? 'text-slate-400' : 'text-gray-600'} mb-3 sm:mb-4 text-center`}>{t('timer.quick_settings')}</p>
                  <div className="grid grid-cols-3 gap-1.5 sm:gap-2 md:gap-3">
                    {PRESET_TIMES.map((preset) => (
                      <motion.button
                        key={preset.seconds}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setPresetTime(preset.seconds)}
                        className={`px-2 py-1.5 sm:px-3 sm:py-2 md:px-4 md:py-2.5 rounded-[8px] text-xs sm:text-sm font-medium transition-all ${
                          initialTime === preset.seconds
                            ? theme === 'dark'
                              ? 'bg-slate-600 text-white shadow-md'
                              : 'bg-slate-400 text-white shadow-md'
                            : theme === 'dark'
                            ? 'bg-slate-700/20 text-slate-300 hover:bg-slate-600/30 border border-slate-600/10'
                            : 'bg-gray-50/50 text-slate-600 hover:bg-slate-100/80 border border-slate-200/30'
                        }`}
                      >
                        {t(`presets.${preset.key}`)}
                      </motion.button>
                    ))}
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

      {/* 添加闹钟模态框 */}
      <AnimatePresence>
        {showAddAlarm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
            onClick={() => {
              setShowAddAlarm(false);
              setEditingAlarmId(null);
              setNewAlarmLabel('');
              setNewAlarmHour(7);
              setNewAlarmMinute(0);
              setNewAlarmRepeat('daily');
            }}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className={`${theme === 'dark' ? 'bg-slate-900 border-slate-700' : 'bg-white border-gray-200'} border rounded-[8px] shadow-2xl p-8 max-w-md w-full`}
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className={`text-2xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                  {editingAlarmId ? t('alarm.edit_alarm') : t('alarm.add_alarm')}
                </h2>
                <button
                  onClick={() => {
                    setShowAddAlarm(false);
                    setEditingAlarmId(null);
                    setNewAlarmLabel('');
                    setNewAlarmHour(7);
                    setNewAlarmMinute(0);
                    setNewAlarmRepeat('daily');
                  }}
                  className={`p-2 ${theme === 'dark' ? 'hover:bg-slate-800' : 'hover:bg-gray-100'} rounded-[8px] transition-colors`}
                >
                  <X className={`w-5 h-5 ${theme === 'dark' ? 'text-slate-400' : 'text-gray-600'}`} />
                </button>
              </div>

              <div className="space-y-4 mb-6">
                {/* 时间选择 */}
                <div className="flex gap-2">
                  <div className="flex-1">
                    <label className={`block text-sm font-medium ${theme === 'dark' ? 'text-slate-300' : 'text-gray-700'} mb-2`}>
                      {t('alarm.hour')}
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="23"
                      value={String(newAlarmHour).padStart(2, '0')}
                      onChange={(e) => {
                        let value = parseInt(e.target.value) || 0;
                        if (value < 0) value = 0;
                        if (value > 23) value = 23;
                        setNewAlarmHour(value);
                      }}
                      className={`w-full px-4 py-2 border rounded-[8px] focus:ring-2 focus:ring-blue-500 focus:border-transparent no-spinner ${
                        theme === 'dark' 
                          ? 'bg-slate-800 border-slate-700 text-white' 
                          : 'bg-white border-gray-300 text-gray-900'
                      }`}
                      style={{ 
                        fontSize: '16px',
                        fontWeight: '500'
                      }}
                    />
                  </div>

                  <div className="flex-1">
                    <label className={`block text-sm font-medium ${theme === 'dark' ? 'text-slate-300' : 'text-gray-700'} mb-2`}>
                      {t('alarm.minute')}
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="59"
                      value={String(newAlarmMinute).padStart(2, '0')}
                      onChange={(e) => {
                        let value = parseInt(e.target.value) || 0;
                        if (value < 0) value = 0;
                        if (value > 59) value = 59;
                        setNewAlarmMinute(value);
                      }}
                      className={`w-full px-4 py-2 border rounded-[8px] focus:ring-2 focus:ring-blue-500 focus:border-transparent no-spinner ${
                        theme === 'dark' 
                          ? 'bg-slate-800 border-slate-700 text-white' 
                          : 'bg-white border-gray-300 text-gray-900'
                      }`}
                      style={{ 
                        fontSize: '16px',
                        fontWeight: '500'
                      }}
                    />
                  </div>
                </div>

                {/* 标签 */}
                <div>
                  <label className={`block text-sm font-medium ${theme === 'dark' ? 'text-slate-300' : 'text-gray-700'} mb-2`}>
                    {t('alarm.label')}
                  </label>
                  <input
                    type="text"
                    value={newAlarmLabel}
                    onChange={(e) => setNewAlarmLabel(e.target.value)}
                    placeholder={t('alarm.label_placeholder')}
                    className={`w-full px-4 py-2 border rounded-[8px] focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      theme === 'dark' 
                        ? 'bg-slate-800 border-slate-700 text-white placeholder:text-slate-400' 
                        : 'bg-white border-gray-300 text-gray-900 placeholder:text-gray-500'
                    }`}
                    style={{ 
                      fontSize: '16px',
                      fontWeight: '500'
                    }}
                  />
                </div>

                {/* 重复设置 */}
                <div>
                  <label className={`block text-sm font-medium ${theme === 'dark' ? 'text-slate-300' : 'text-gray-700'} mb-2`}>
                    {t('alarm.repeat')}
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { value: 'once', key: 'repeat_once' },
                      { value: 'daily', key: 'repeat_daily' },
                      { value: 'weekdays', key: 'repeat_weekdays' },
                      { value: 'weekends', key: 'repeat_weekends' },
                    ].map((option) => (
                      <button
                        key={option.value}
                        onClick={() => setNewAlarmRepeat(option.value as any)}
                        className={`px-4 py-2 rounded-[8px] transition-colors ${
                          newAlarmRepeat === option.value
                            ? 'bg-[#669EF8] text-white'
                            : theme === 'dark'
                            ? 'bg-slate-800/40 text-slate-400 hover:bg-slate-800/60'
                            : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                        }`}
                        style={{
                          fontSize: '16px',
                          fontWeight: '500'
                        }}
                      >
                        {t(`alarm.${option.key}`)}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setShowAddAlarm(false);
                    setEditingAlarmId(null);
                    setNewAlarmLabel('');
                    setNewAlarmHour(7);
                    setNewAlarmMinute(0);
                    setNewAlarmRepeat('daily');
                  }}
                  className={`flex-1 px-6 py-3 ${theme === 'dark' ? 'bg-slate-800 hover:bg-slate-700' : 'bg-gray-200 hover:bg-gray-300'} ${theme === 'dark' ? 'text-white' : 'text-gray-900'} rounded-[8px] transition-colors`}
                  style={{
                    fontSize: '16px',
                    fontWeight: '500'
                  }}
                >
                  {t('buttons.cancel')}
                </button>
                <button
                  onClick={addAlarm}
                  className="flex-1 px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-[8px] transition-colors"
                  style={{
                    fontSize: '16px',
                    fontWeight: '500'
                  }}
                >
                  {t('buttons.confirm')}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 闹钟响铃模态框 */}
      <AnimatePresence>
        {ringingAlarmId && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-6 sm:p-8 md:p-12 lg:p-16"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-gradient-to-br from-orange-500 to-red-500 rounded-[8px] shadow-2xl p-8 sm:p-10 md:p-12 w-full max-w-[90vw] sm:max-w-lg md:max-w-xl lg:max-w-2xl aspect-square flex flex-col items-center justify-center relative overflow-hidden"
            >
              {/* 右上角关闭按钮 */}
              <button
                onClick={stopAlarmRinging}
                className="absolute top-3 right-3 sm:top-4 sm:right-4 p-1.5 sm:p-2 hover:bg-white/20 rounded-full transition-colors"
              >
                <X className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </button>

              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ repeat: Infinity, duration: 1 }}
                className="mb-6 sm:mb-8 md:mb-12"
              >
                <AlarmClock className="w-24 h-24 sm:w-32 sm:h-32 md:w-40 md:h-40 text-white mx-auto" />
              </motion.div>

              <div className="text-4xl sm:text-5xl md:text-6xl font-bold text-white mb-4 sm:mb-5 md:mb-6">
                {ringingAlarm 
                  ? `${String(ringingAlarm.hour).padStart(2, '0')}:${String(ringingAlarm.minute).padStart(2, '0')}`
                  : '00:00'}
              </div>
              
              {/* 闹钟标签 */}
              <div 
                className="text-lg sm:text-xl md:text-2xl text-white/90 w-full px-4 sm:px-5 md:px-6 text-center break-words overflow-hidden mb-3"
                style={{ 
                  wordWrap: 'break-word', 
                  overflowWrap: 'break-word'
                }}
              >
                {ringingAlarm?.label || t('alarm.time_now')}
              </div>

              {/* 响铃时长 */}
              <div className="text-base sm:text-lg md:text-xl text-white/80 mb-6 sm:mb-8 md:mb-12 text-center font-medium">
                {formatRingingDuration(currentRingingDuration)}
              </div>
              
              <button
                onClick={snoozeAlarm}
                className="w-full py-3 sm:py-3.5 md:py-4 bg-white text-red-500 rounded-[12px] font-black text-lg sm:text-xl hover:bg-white hover:shadow-2xl transition-all duration-300 hover:scale-105"
                style={{ letterSpacing: '0.1em', fontWeight: '950' }}
              >
                {t('alarm.snooze_button')}
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

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
                  {mode === 'worldclock' && worldClockColor !== worldClockSmallCardColor && (
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
                    const currentColor = worldClockColor;
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
                    const isSelectedPrimary = worldClockColor === color.id;
                    // 世界时间模式下，检查小卡片是否使用此颜色
                    const isSelectedSecondary = mode === 'worldclock' && worldClockSmallCardColor === color.id && worldClockColor !== worldClockSmallCardColor;
                    
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
                    const isSelectedPrimary = worldClockColor === color.id;
                    // 世界时间模式下，检查小卡片是否使用此颜色
                    const isSelectedSecondary = mode === 'worldclock' && worldClockSmallCardColor === color.id && worldClockColor !== worldClockSmallCardColor;
                    
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
                    const isSelectedPrimary = worldClockColor === color.id;
                    // 世界时间模式下，检查小卡片是否使用此颜色
                    const isSelectedSecondary = mode === 'worldclock' && worldClockSmallCardColor === color.id && worldClockColor !== worldClockSmallCardColor;
                    
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
                                      
                                      const pageName = t('modes.worldclock');
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
      
      {/* 时区选择模态框 */}
      <AnimatePresence>
        {showTimezoneModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => setShowTimezoneModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className={`w-full max-w-2xl max-h-[90vh] sm:max-h-[80vh] rounded-t-2xl sm:rounded-2xl overflow-hidden mx-0 sm:mx-4 ${
                theme === 'dark' ? 'bg-slate-800' : 'bg-white'
              } fixed sm:relative bottom-0 sm:bottom-auto`}
            >
              {/* 模态框头部 */}
              <div className={`flex items-center justify-between p-6 border-b ${
                theme === 'dark' ? 'border-slate-700' : 'border-gray-200'
              }`}>
                <h2 className={`text-2xl font-bold ${
                  theme === 'dark' ? 'text-white' : 'text-gray-900'
                }`}>
                  {t('worldclock.add_timezone')}
                </h2>
                <button
                  onClick={() => {
                    setShowTimezoneModal(false);
                    setInputMode('search');
                    setTimezoneSearch('');
                    setManualCityName('');
                    setManualCountryName('');
                    setManualTimezone('');
                  }}
                  className={`p-2 rounded-lg transition-colors ${
                    theme === 'dark'
                      ? 'hover:bg-slate-700 text-slate-400'
                      : 'hover:bg-gray-100 text-gray-600'
                  }`}
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              
              {/* 模式切换按钮 - 移动端优化 */}
              <div className={`flex gap-2 p-3 sm:p-4 border-b ${
                theme === 'dark' ? 'border-slate-700' : 'border-gray-200'
              }`}>
                <button
                  onClick={() => setInputMode('search')}
                  className={`flex-1 py-2.5 sm:py-2 px-3 sm:px-4 rounded-lg font-medium text-sm sm:text-base transition-all ${
                    inputMode === 'search'
                      ? (theme === 'dark'
                          ? 'bg-blue-600 text-white'
                          : 'bg-blue-500 text-white')
                      : (theme === 'dark'
                          ? 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200')
                  }`}
                >
                  <Search className="w-4 h-4 inline-block mr-2" />
                  {t('worldclock.search_mode')}
                </button>
                <button
                  onClick={() => setInputMode('manual')}
                  className={`flex-1 py-2.5 sm:py-2 px-3 sm:px-4 rounded-lg font-medium text-sm sm:text-base transition-all ${
                    inputMode === 'manual'
                      ? (theme === 'dark'
                          ? 'bg-blue-600 text-white'
                          : 'bg-blue-500 text-white')
                      : (theme === 'dark'
                          ? 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200')
                  }`}
                >
                  <Plus className="w-4 h-4 inline-block mr-2" />
                  {t('worldclock.manual_mode')}
                </button>
              </div>
              
              {inputMode === 'search' ? (
                <>
                  {/* 搜索框 - 移动端优化 */}
                  <div className={`p-4 sm:p-6 border-b ${theme === 'dark' ? 'border-slate-700' : 'border-gray-200'}`}>
                <div className="relative">
                  <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 ${
                    theme === 'dark' ? 'text-slate-400' : 'text-gray-400'
                  }`} />
                  <input
                    type="text"
                    value={timezoneSearch}
                    onChange={(e) => setTimezoneSearch(e.target.value)}
                    placeholder={t('worldclock.search_placeholder')}
                    className={`w-full pl-10 pr-4 py-3.5 sm:py-3 text-base rounded-lg border ${
                      theme === 'dark'
                        ? 'bg-slate-700 border-slate-600 text-white placeholder-slate-400'
                        : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                    } focus:outline-none focus:ring-2 focus:ring-blue-500`}
                  />
                </div>
              </div>
              
              {/* 时区列表 */}
              <div className="overflow-y-auto max-h-[50vh] p-4">
                {(() => {
                  const searchLower = timezoneSearch.toLowerCase();
                  const filteredTimezones = MORE_TIMEZONES.filter(tz => {
                    const cityName = locale === 'zh' ? tz.name : tz.nameEn;
                    const countryName = locale === 'zh' ? tz.country : tz.countryEn;
                    return cityName.toLowerCase().includes(searchLower) || 
                           countryName.toLowerCase().includes(searchLower) ||
                           tz.timezone.toLowerCase().includes(searchLower);
                  });
                  
                  if (filteredTimezones.length === 0) {
                    return (
                      <div className="text-center py-12">
                        <Globe className={`w-16 h-16 mx-auto mb-4 ${
                          theme === 'dark' ? 'text-slate-600' : 'text-gray-300'
                        }`} />
                        <p className={`text-lg ${
                          theme === 'dark' ? 'text-slate-400' : 'text-gray-500'
                        }`}>
                          {t('worldclock.no_results')}
                        </p>
                      </div>
                    );
                  }
                  
                  return (
                    <div className="grid gap-2">
                      {filteredTimezones.map((tz, index) => {
                        const cityName = locale === 'zh' ? tz.name : tz.nameEn;
                        const countryName = locale === 'zh' ? tz.country : tz.countryEn;
                        
                        return (
                          <button
                            key={index}
                            onClick={() => {
                              const alreadyExists = customCities.some(
                                city => city.timezone === tz.timezone
                              );
                              
                              if (!alreadyExists) {
                                setCustomCities([...customCities, {
                                  name: cityName,
                                  timezone: tz.timezone,
                                  country: countryName
                                }]);
                              }
                              
                              setShowTimezoneModal(false);
                              setTimezoneSearch('');
                            }}
                            className={`w-full p-4 rounded-lg text-left transition-colors ${
                              theme === 'dark'
                                ? 'hover:bg-slate-700 border border-slate-700'
                                : 'hover:bg-gray-50 border border-gray-200'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <div>
                                <h3 className={`text-lg font-semibold ${
                                  theme === 'dark' ? 'text-white' : 'text-gray-900'
                                }`}>
                                  {cityName}
                                </h3>
                                <p className={`text-sm ${
                                  theme === 'dark' ? 'text-slate-400' : 'text-gray-600'
                                }`}>
                                  {countryName} • {tz.timezone}
                                </p>
                              </div>
                              <Plus className={`w-5 h-5 ${
                                theme === 'dark' ? 'text-slate-400' : 'text-gray-400'
                              }`} />
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  );
                })()}
              </div>
                </>
              ) : (
                /* 手动输入模式 - 移动端优化 */
                <div className="p-4 sm:p-6">
                  <div className="space-y-4">
                    {/* 城市名称输入 */}
                    <div>
                      <label className={`block text-sm font-medium mb-2 ${
                        theme === 'dark' ? 'text-slate-300' : 'text-gray-700'
                      }`}>
                        {t('worldclock.city_name')} <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={manualCityName}
                        onChange={(e) => setManualCityName(e.target.value)}
                        placeholder={t('worldclock.city_placeholder')}
                        className={`w-full px-4 py-3.5 sm:py-3 text-base rounded-lg border ${
                          theme === 'dark'
                            ? 'bg-slate-700 border-slate-600 text-white placeholder-slate-400'
                            : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                        } focus:outline-none focus:ring-2 focus:ring-blue-500`}
                      />
                    </div>
                    
                    {/* 国家/地区输入 */}
                    <div>
                      <label className={`block text-sm font-medium mb-2 ${
                        theme === 'dark' ? 'text-slate-300' : 'text-gray-700'
                      }`}>
                        {t('worldclock.country_name')} <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={manualCountryName}
                        onChange={(e) => setManualCountryName(e.target.value)}
                        placeholder={t('worldclock.country_placeholder')}
                        className={`w-full px-4 py-3.5 sm:py-3 text-base rounded-lg border ${
                          theme === 'dark'
                            ? 'bg-slate-700 border-slate-600 text-white placeholder-slate-400'
                            : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                        } focus:outline-none focus:ring-2 focus:ring-blue-500`}
                      />
                    </div>
                    
                    {/* 时区输入 */}
                    <div>
                      <label className={`block text-sm font-medium mb-2 ${
                        theme === 'dark' ? 'text-slate-300' : 'text-gray-700'
                      }`}>
                        {t('worldclock.timezone_label')} <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={manualTimezone}
                        onChange={(e) => setManualTimezone(e.target.value)}
                        placeholder={t('worldclock.timezone_placeholder')}
                        className={`w-full px-4 py-3.5 sm:py-3 text-base rounded-lg border ${
                          theme === 'dark'
                            ? 'bg-slate-700 border-slate-600 text-white placeholder-slate-400'
                            : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                        } focus:outline-none focus:ring-2 focus:ring-blue-500`}
                      />
                      <p className={`mt-2 text-sm ${
                        theme === 'dark' ? 'text-slate-400' : 'text-gray-500'
                      }`}>
                        {t('worldclock.timezone_hint')}
                      </p>
                    </div>
                    
                    {/* 常用时区参考 */}
                    <div className={`p-4 rounded-lg ${
                      theme === 'dark' ? 'bg-slate-700/50' : 'bg-gray-100'
                    }`}>
                      <p className={`text-sm font-medium mb-2 ${
                        theme === 'dark' ? 'text-slate-300' : 'text-gray-700'
                      }`}>
                        {t('worldclock.common_timezone_references')}
                      </p>
                      <div className={`text-xs space-y-1 ${
                        theme === 'dark' ? 'text-slate-400' : 'text-gray-600'
                      }`}>
                        <p>• {t('worldclock.timezone_reference_shanghai')}</p>
                        <p>• {t('worldclock.timezone_reference_newyork')}</p>
                        <p>• {t('worldclock.timezone_reference_london')}</p>
                        <p>• {t('worldclock.timezone_reference_tokyo')}</p>
                        <p>• {t('worldclock.timezone_reference_sydney')}</p>
                      </div>
                    </div>
                    
                    {/* 添加按钮 - 移动端优化 */}
                    <button
                      onClick={() => {
                        if (!manualCityName || !manualCountryName || !manualTimezone) {
                          toast.error(t('worldclock.required_fields'));
                          return;
                        }
                        
                        // 验证时区格式
                        try {
                          new Date().toLocaleString('en-US', { timeZone: manualTimezone });
                          
                          setCustomCities([...customCities, {
                            name: manualCityName,
                            timezone: manualTimezone,
                            country: manualCountryName
                          }]);
                          
                          setShowTimezoneModal(false);
                          setManualCityName('');
                          setManualCountryName('');
                          setManualTimezone('');
                          setInputMode('search');
                          
                          toast.success(t('settings_panel.timezone_added', { cityName: manualCityName }));
                        } catch (error) {
                          toast.error(t('settings_panel.invalid_timezone_format'));
                        }
                      }}
                      className={`w-full py-3.5 sm:py-3 px-4 rounded-lg font-medium text-base transition-all ${
                        theme === 'dark'
                          ? 'bg-blue-600 hover:bg-blue-700 text-white'
                          : 'bg-blue-500 hover:bg-blue-600 text-white'
                      }`}
                    >
                      {t('worldclock.add_custom')}
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
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
            className="fixed inset-0 z-[60] flex items-center justify-center p-3 xs:p-4 sm:p-6 md:p-8 bg-black/70 backdrop-blur-lg"
            onClick={closeTimerEndModal}
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0, y: 30 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.8, opacity: 0, y: 30 }}
              transition={{ type: 'spring', damping: 20, stiffness: 200 }}
              onClick={(e) => e.stopPropagation()}
              className={`relative w-full max-w-[95vw] xs:max-w-lg sm:max-w-xl md:max-w-2xl rounded-2xl xs:rounded-3xl shadow-2xl overflow-hidden ${
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
                className={`absolute top-3 right-3 xs:top-4 xs:right-4 sm:top-6 sm:right-6 p-1.5 xs:p-2 sm:p-2.5 rounded-full transition-all z-10 ${
                  theme === 'dark'
                    ? 'bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white'
                    : 'bg-gray-100 hover:bg-gray-200 text-gray-500 hover:text-gray-700'
                } shadow-lg`}
              >
                <X className="w-4 h-4 xs:w-5 xs:h-5 sm:w-6 sm:h-6" />
              </button>

              <div className="p-5 xs:p-6 sm:p-10 md:p-12 lg:p-16">
                {/* 顶部图标和标题 */}
                <div className="text-center mb-6 xs:mb-8 sm:mb-10 md:mb-12">
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
                    className="inline-flex items-center justify-center w-20 h-20 xs:w-24 xs:h-24 sm:w-32 sm:h-32 md:w-40 md:h-40 rounded-full bg-gradient-to-br from-green-400 via-emerald-500 to-teal-500 shadow-xl xs:shadow-2xl shadow-green-500/40 mb-4 xs:mb-6 sm:mb-8"
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
                      <Clock className="w-10 h-10 xs:w-12 xs:h-12 sm:w-16 sm:h-16 md:w-20 md:h-20 text-white" strokeWidth={2.5} />
                    </motion.div>
                  </motion.div>
                  
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                  >
                    <h2 className={`text-2xl xs:text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-2 xs:mb-3 sm:mb-4 px-2 ${
                      theme === 'dark' ? 'text-white' : 'text-gray-900'
                    }`}>
                      {(() => {
                        const hours = Math.floor(initialTime / 3600);
                        const mins = Math.floor((initialTime % 3600) / 60);
                        const secs = initialTime % 60;
                        
                        if (hours > 0) {
                          if (mins > 0) {
                            return `${hours}小时${mins}分钟`;
                          }
                          return `${hours}小时`;
                        } else if (mins > 0) {
                          if (secs > 0) {
                            return `${mins}分${secs}秒`;
                          }
                          return `${mins}分钟`;
                        } else {
                          return `${secs}秒`;
                        }
                      })()}
                    </h2>
                    <p className={`text-sm xs:text-base sm:text-lg md:text-xl ${
                      theme === 'dark' ? 'text-slate-400' : 'text-gray-600'
                    }`}>
                      倒计时已完成
                    </p>
                  </motion.div>
                </div>

                {/* 超时计时器 - 大卡片 */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.2 }}
                  className={`relative text-center p-6 xs:p-8 sm:p-10 md:p-12 rounded-2xl xs:rounded-3xl overflow-hidden mb-6 xs:mb-8 sm:mb-10 ${
                    theme === 'dark' 
                      ? 'bg-gradient-to-br from-red-500/20 to-orange-500/20 border border-red-500/30 xs:border-2' 
                      : 'bg-gradient-to-br from-red-50 to-orange-50 border border-red-200 xs:border-2'
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
                    <p className={`text-xs xs:text-sm sm:text-base font-bold uppercase tracking-wider xs:tracking-widest mb-3 xs:mb-4 sm:mb-6 ${
                      theme === 'dark' ? 'text-red-400' : 'text-red-600'
                    }`}>
                      已超时
                    </p>
                    <motion.div 
                      className={`text-4xl xs:text-5xl sm:text-6xl md:text-7xl lg:text-8xl xl:text-9xl font-black ${
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
                  className={`w-full py-3.5 xs:py-4 sm:py-5 md:py-6 px-6 xs:px-8 rounded-xl xs:rounded-2xl font-bold text-base xs:text-lg sm:text-xl transition-all shadow-lg xs:shadow-xl hover:shadow-2xl ${
                    theme === 'dark'
                      ? 'bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white'
                      : 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white'
                  }`}
                >
                  知道了
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 世界时间颜色修改确认对话框 */}
      <AnimatePresence>
        {showWorldClockColorConfirm && pendingWorldClockColor && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[9999] p-4"
            onClick={() => {
              setShowWorldClockColorConfirm(false);
              setPendingWorldClockColor(null);
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
                {t('settings_panel.confirm_modify_color')}
              </h3>
              
              {/* 颜色预览 */}
              <div className={`mb-6 p-4 rounded-lg ${theme === 'dark' ? 'bg-slate-900' : 'bg-gray-50'}`}>
                <p className={`text-sm mb-3 ${theme === 'dark' ? 'text-slate-400' : 'text-gray-600'}`}>
                  {t('settings_panel.preview_new_color')}
                </p>
                <div 
                  className="text-5xl font-bold text-center mb-2"
                  style={{
                    fontFamily: '"Rajdhani", sans-serif',
                    color: (() => {
                      const previewColor = THEME_COLORS.find(c => c.id === pendingWorldClockColor);
                      return previewColor?.gradient ? previewColor.color : previewColor?.color;
                    })(),
                  }}
                >
                  {currentDate.getHours().toString().padStart(2, '0')}:{currentDate.getMinutes().toString().padStart(2, '0')}:{currentDate.getSeconds().toString().padStart(2, '0')}
                </div>
                <p className={`text-xs text-center ${theme === 'dark' ? 'text-slate-500' : 'text-gray-500'}`}>
                  {THEME_COLORS.find(c => c.id === pendingWorldClockColor)?.key && t(`colors.${THEME_COLORS.find(c => c.id === pendingWorldClockColor)?.key}`)}
                </p>
              </div>
              
              <p className={`text-base mb-6 ${theme === 'dark' ? 'text-slate-300' : 'text-gray-700'}`}>
                {t('settings_panel.modify_small_cards_question')}
              </p>
              <div className="flex flex-col gap-3">
                <div className="flex gap-3">
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      // 同时修改大卡片和小卡片
                      if (pendingWorldClockColor) {
                        setWorldClockColor(pendingWorldClockColor);
                        setWorldClockSmallCardColor(pendingWorldClockColor);
                      }
                      setShowWorldClockColorConfirm(false);
                      setPendingWorldClockColor(null);
                    }}
                    className={`flex-1 py-3 px-4 rounded-lg font-medium transition-all ${
                      theme === 'dark'
                        ? 'bg-blue-600 hover:bg-blue-700 text-white'
                        : 'bg-blue-500 hover:bg-blue-600 text-white'
                    }`}
                  >
                    {t('settings_panel.yes_modify_together')}
                  </button>
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      // 只修改大卡片
                      if (pendingWorldClockColor) {
                        setWorldClockColor(pendingWorldClockColor);
                      }
                      setShowWorldClockColorConfirm(false);
                      setPendingWorldClockColor(null);
                    }}
                    className={`flex-1 py-3 px-4 rounded-lg font-medium transition-all ${
                      theme === 'dark'
                        ? 'bg-slate-700 hover:bg-slate-600 text-white'
                        : 'bg-gray-200 hover:bg-gray-300 text-gray-900'
                    }`}
                  >
                    {t('settings_panel.no_only_large_card')}
                  </button>
                </div>
                <button
                  onClick={() => {
                    setShowWorldClockColorConfirm(false);
                    setPendingWorldClockColor(null);
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

      {/* 主题颜色设置确认对话框 - 保留原有逻辑，因为world-clock页面有特殊需求 */}
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
                  suppressHydrationWarning
                >
                  {String(currentDate.getHours()).padStart(2, '0')}:{String(currentDate.getMinutes()).padStart(2, '0')}:{String(currentDate.getSeconds()).padStart(2, '0')}
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
                {t('settings_panel.worldclock_color_confirm_message', { default: '请选择要修改的卡片：' })}
              </p>
              <div className="flex flex-col gap-3">
                <div className="flex flex-col gap-2">
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      // 应用到所有页面
                      if (pendingThemeColor) {
                        // 应用到所有功能页面
                        localStorage.setItem('timer-timer-color', pendingThemeColor);
                        localStorage.setItem('timer-stopwatch-color', pendingThemeColor);
                        localStorage.setItem('timer-alarm-color', pendingThemeColor);
                        localStorage.setItem('timer-worldclock-color', pendingThemeColor);
                        localStorage.setItem('timer-worldclock-smallcard-color', pendingThemeColor);
                        setTimerColor(pendingThemeColor);
                        setStopwatchColor(pendingThemeColor);
                        setWorldClockColor(pendingThemeColor);
                        setWorldClockSmallCardColor(pendingThemeColor);
                        // 触发自定义事件，通知其他页面更新颜色
                        if (typeof window !== 'undefined') {
                          window.dispatchEvent(new CustomEvent('color-change'));
                        }
                      }
                      setShowThemeColorConfirm(false);
                      setPendingThemeColor(null);
                    }}
                    className={`w-full py-3 px-4 rounded-lg font-medium transition-all ${
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
                      // 修改大卡片颜色
                      if (pendingThemeColor) {
                        localStorage.setItem('timer-worldclock-color', pendingThemeColor);
                        setWorldClockColor(pendingThemeColor);
                        // 触发自定义事件，通知其他页面更新颜色
                        if (typeof window !== 'undefined') {
                          window.dispatchEvent(new CustomEvent('color-change'));
                        }
                      }
                      setShowThemeColorConfirm(false);
                      setPendingThemeColor(null);
                    }}
                    className={`w-full py-3 px-4 rounded-lg font-medium transition-all ${
                      theme === 'dark'
                        ? 'bg-indigo-600 hover:bg-indigo-700 text-white'
                        : 'bg-indigo-500 hover:bg-indigo-600 text-white'
                    }`}
                  >
                    {t('settings_panel.modify_large_card', { default: '修改大卡片颜色' })}
                  </button>
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      // 修改小卡片颜色
                      if (pendingThemeColor) {
                        localStorage.setItem('timer-worldclock-smallcard-color', pendingThemeColor);
                        setWorldClockSmallCardColor(pendingThemeColor);
                        // 触发自定义事件，通知其他页面更新颜色
                        if (typeof window !== 'undefined') {
                          window.dispatchEvent(new CustomEvent('color-change'));
                        }
                      }
                      setShowThemeColorConfirm(false);
                      setPendingThemeColor(null);
                    }}
                    className={`w-full py-3 px-4 rounded-lg font-medium transition-all ${
                      theme === 'dark'
                        ? 'bg-purple-600 hover:bg-purple-700 text-white'
                        : 'bg-purple-500 hover:bg-purple-600 text-white'
                    }`}
                  >
                    {t('settings_panel.modify_small_card', { default: '修改小卡片颜色' })}
                  </button>
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      // 应用到当前页面（世界时间页面的大卡片和小卡片）
                      if (pendingThemeColor) {
                        localStorage.setItem('timer-worldclock-color', pendingThemeColor);
                        localStorage.setItem('timer-worldclock-smallcard-color', pendingThemeColor);
                        setWorldClockColor(pendingThemeColor);
                        setWorldClockSmallCardColor(pendingThemeColor);
                        // 触发自定义事件，通知其他页面更新颜色
                        if (typeof window !== 'undefined') {
                          window.dispatchEvent(new CustomEvent('color-change'));
                        }
                      }
                      setShowThemeColorConfirm(false);
                      setPendingThemeColor(null);
                    }}
                    className={`w-full py-3 px-4 rounded-lg font-medium transition-all ${
                      theme === 'dark'
                        ? 'bg-green-600 hover:bg-green-700 text-white'
                        : 'bg-green-500 hover:bg-green-600 text-white'
                    }`}
                  >
                    {t('settings_panel.apply_to_current_page', { default: '应用到当前页面' })}
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
      
      {/* 功能说明 */}
      {!isFullscreen && (
        <div className={`w-full max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-12 ${theme === 'dark' ? 'text-slate-300' : 'text-gray-700'}`}>
          <div className="space-y-4">
            <h2 className={`text-xl sm:text-2xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
              {t('page_description.worldclock.title')}
            </h2>
            <p className="text-sm sm:text-base leading-relaxed">
              {t('page_description.worldclock.description')}
            </p>
            <ul className="list-disc list-inside space-y-2 text-sm sm:text-base">
              {t.raw('page_description.worldclock.features').map((feature: string, index: number) => (
                <li key={index}>{feature}</li>
              ))}
            </ul>
          </div>
        </div>
      )}
      </div>
    </div>
  );
}
