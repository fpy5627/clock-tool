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
import { SOUND_OPTIONS, THEME_COLORS } from '@/lib/clock-constants';
import { notifySoundMetaList } from '@/lib/notify-sound';
import { compressAndResizeImage, analyzeImageBrightness, isLightColor } from '@/lib/image-utils';
import { useFullscreen } from '@/lib/hooks/useFullscreen';
import { useBackground } from '@/lib/hooks/useBackground';
import { useWeatherLocation } from '@/lib/hooks/useWeatherLocation';
import { useNotificationSound } from '@/lib/hooks/useNotificationSound';
import { useClockPageHandlers } from '@/lib/hooks/useClockPageHandlers';
import VerticalSidebar from '@/components/blocks/navigation/VerticalSidebar';
import ClockControlButtons from '@/components/ui/ClockControlButtons';
import ClockSettingsPanel from '@/components/ui/ClockSettingsPanel';
import WeatherDateDisplay from '@/components/ui/WeatherDateDisplay';
import BackgroundConfirmDialog from '@/components/ui/BackgroundConfirmDialog';
import ThemeColorConfirmDialog from '@/components/ui/ThemeColorConfirmDialog';


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
  
  // 固定模式为 alarm
  type Mode = 'timer' | 'stopwatch' | 'alarm' | 'worldclock';
  const mode = 'alarm' as Mode;
  
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
    mode: 'alarm',
    setBackgroundType,
    setBackgroundImage,
    setApplyToAllPages,
    setUserManuallySetTheme,
  });
  
  // 通用状态
  const [isRunning, setIsRunning] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [showControls, setShowControls] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [showCardBorder, setShowCardBorder] = useState(true); // 控制大卡片边框显示（全屏模式下）
  
  // 新增功能状态
  const [selectedSound, setSelectedSound] = useState('night_sky');
  const [soundUsageStats, setSoundUsageStats] = useState<Record<string, number>>({});
  const [notificationEnabled, setNotificationEnabled] = useState(false);
  const [showSettingsPanel, setShowSettingsPanel] = useState(false);
  const [progressVisible, setProgressVisible] = useState(true);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  
  // 闹钟页面颜色
  const [alarmColor, setAlarmColor] = useState('blue'); // 闹钟页面颜色
  
  // 主题颜色设置确认对话框
  const [showThemeColorConfirm, setShowThemeColorConfirm] = useState(false);
  const [pendingThemeColor, setPendingThemeColor] = useState<string | null>(null);
  
  // 显示控制状态
  const [showWeatherIcon, setShowWeatherIcon] = useState(true);
  const [showTemperature, setShowTemperature] = useState(true);
  const [showDate, setShowDate] = useState(true);
  const [showWeekday, setShowWeekday] = useState(true);
  
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
  
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const hideControlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isHoveringControls = useRef(false);
  const alarmCheckIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastToastRef = useRef<{ id: string; time: number } | null>(null);
  const lastClickRef = useRef<{ action: string; time: number } | null>(null);
  const currentRingingAlarmRef = useRef<string | null>(null);
  const alarmRingStartTimeRef = useRef<number | null>(null);
  const colorInitializedRef = useRef(false); // 跟踪颜色是否已初始化
  const lastBackgroundColorRef = useRef<string>(''); // 跟踪上一次的背景颜色
  const userInitiatedThemeChangeRef = useRef(false); // 跟踪用户是否刚刚手动切换了主题

  // 注意：背景颜色变化自动切换主题的逻辑已在 useBackground hook 中处理

  useEffect(() => {
    // Note: In alarm mode, this useEffect doesn't need to handle timer or stopwatch logic
    // since mode is fixed to 'alarm'. This code is kept for potential future use or shared logic.
    // The interval is only used for alarm-related functionality, not countdown or stopwatch.
    if (isRunning && mode === 'alarm') {
      // Alarm mode specific logic can be added here if needed
      // For now, we just clear the interval if it exists
    }
    
    if (!isRunning && intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isRunning, mode]);

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
          // 使用 useFullscreen hook 提供的 enterFullscreen 函数
          await enterFullscreen();
        }, 100);
        
        return () => {
          clearTimeout(timer);
        };
      }
    }
  }, []);

  // 鼠标移动和触摸显示控制按钮（仅在全屏模式下自动隐藏）
  useEffect(() => {
    const handleInteraction = () => {
      setShowControls(true);
      
      // 清除之前的定时器
      if (hideControlsTimeoutRef.current) {
        clearTimeout(hideControlsTimeoutRef.current);
      }
      
      // 只在全屏且不是闹钟模式时，1.5秒后隐藏控制按钮
      if (isFullscreen && mode !== 'alarm') {
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
  }, [isFullscreen, mode]);

  // 非全屏模式或闹钟模式下始终显示控制按钮
  useEffect(() => {
    if (!isFullscreen || mode === 'alarm') {
      setShowControls(true);
      if (hideControlsTimeoutRef.current) {
        clearTimeout(hideControlsTimeoutRef.current);
      }
    }
  }, [isFullscreen, mode]);


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
      const savedNotification = localStorage.getItem('timer-notification');
      const savedProgress = localStorage.getItem('timer-progress');
      const savedShowWeatherIcon = localStorage.getItem('timer-show-weather-icon');
      const savedShowTemperature = localStorage.getItem('timer-show-temperature');
      const savedShowDate = localStorage.getItem('timer-show-date');
      const savedShowWeekday = localStorage.getItem('timer-show-weekday');
      const savedAlarms = localStorage.getItem('timer-alarms');
      
      // theme 由 next-themes 自动管理，无需手动加载
      if (savedSound) setSelectedSound(savedSound);
      
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
    }
  }, []);

  // 保存设置到 localStorage (背景相关设置已在 useBackground hook 中处理)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('timer-sound', selectedSound);
      localStorage.setItem('timer-notification', String(notificationEnabled));
      localStorage.setItem('timer-progress', String(progressVisible));
      localStorage.setItem('timer-show-weather-icon', String(showWeatherIcon));
      localStorage.setItem('timer-show-temperature', String(showTemperature));
      localStorage.setItem('timer-show-date', String(showDate));
      localStorage.setItem('timer-show-weekday', String(showWeekday));
    }
  }, [selectedSound, notificationEnabled, progressVisible, showWeatherIcon, showTemperature, showDate, showWeekday]);

  // 注意：背景相关的useEffect逻辑已在 useBackground hook 中处理




  // 请求桌面通知权限
  useEffect(() => {
    if (typeof window !== 'undefined' && notificationEnabled && 'Notification' in window) {
      if (Notification.permission === 'default') {
        Notification.requestPermission();
      }
    }
  }, [notificationEnabled]);

  // 动态计算并设置闹钟列表宽度
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
    
    // 使用 MutationObserver 监听内容变化
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
  }, [mode, isFullscreen]);

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
    
    // 非全屏模式时始终显示边框
    setShowCardBorder(true);
  }, [isFullscreen]);

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
        }
        // 注释掉自动关闭过期单次闹钟的逻辑
        // 因为用户设置已过时间的闹钟时，应该理解为次日响铃
        // 单次闹钟会在响铃后自动删除
        // else if (alarm.repeat === 'once' && alarm.enabled) {
        //   // 自动关闭过期的单次闹钟
        //   const alarmTimeInMinutes = alarm.hour * 60 + alarm.minute;
        //   const currentTimeInMinutes = currentHour * 60 + currentMinute;
        //   
        //   // 如果当前时间已经超过闹钟时间，自动关闭闹钟
        //   if (currentTimeInMinutes > alarmTimeInMinutes) {
        //     toggleAlarm(alarm.id);
        //   }
        // }
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
    if (lastAddedAlarmId && mode === 'alarm') {
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
  }, [lastAddedAlarmId, alarms, mode]);

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
        // 设置循环播放（闹钟音效应循环播放直到用户关闭弹窗）
        audio.loop = true;
        // 保存音频元素引用，以便后续停止
        notificationAudioElementRef.current = audio;
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
    // 停止提示音
    stopNotificationSound();
    try { (window as any).__alarmNotifyStop?.(); } catch {}
    // 计算响铃时长
    if (alarmRingStartTimeRef.current) {
      const duration = Math.floor((Date.now() - alarmRingStartTimeRef.current) / 1000);
      const durationText = formatDuration(duration);
      
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
    
    // 停止提示音
    stopNotificationSound();
    try { (window as any).__alarmNotifyStop?.(); } catch {}
    
    // 计算响铃时长
    if (alarmRingStartTimeRef.current) {
      const duration = Math.floor((Date.now() - alarmRingStartTimeRef.current) / 1000);
      const durationText = formatDuration(duration);
      
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



  // 格式化时长（仅返回时长字符串，不包含前缀）
  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    
    if (minutes > 0) {
      const minuteText = minutes === 1 ? t('alarm.minute_unit') : t('alarm.minutes_unit');
      const secondText = secs === 1 ? t('alarm.second_unit') : t('alarm.seconds_unit');
      return `${minutes} ${minuteText} ${secs} ${secondText}`;
    } else {
      const secondText = secs === 1 ? t('alarm.second_unit') : t('alarm.seconds_unit');
      return `${secs} ${secondText}`;
    }
  };


  // 格式化响铃时长
  const formatRingingDuration = (seconds: number) => {
    const duration = formatDuration(seconds);
    return t('alarm.ringing', { duration });
  };


  // 根据当前模式选择对应的颜色
  // Note: In alarm mode, mode is fixed to 'alarm', so timer/stopwatch checks are never true
  // Use alarmColor state for alarm mode
  const currentColorId = alarmColor; // Use alarmColor state
  const themeColor = THEME_COLORS.find(c => c.id === currentColorId) || THEME_COLORS[0];
  
  // 从localStorage加载闹钟颜色
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedColor = localStorage.getItem('timer-alarm-color');
      if (savedColor) {
        setAlarmColor(savedColor);
      }
    }
  }, []);
  
  // 保存闹钟颜色到localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('timer-alarm-color', alarmColor);
    }
  }, [alarmColor]);

  return (
    <div 
      className={`${isFullscreen ? 'fixed inset-0 z-50 h-screen' : 'min-h-screen'} ${
        backgroundType === 'default' ? (theme === 'dark' ? 'bg-black' : 'bg-gray-100') : ''
      } flex flex-col ${isFullscreen ? 'p-0' : 'p-0 sm:p-4'} transition-colors duration-300 relative`}
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
                // Note: In alarm mode, mode is fixed to 'alarm', so timer check is never true
                false // Always false in alarm mode
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
                // Note: In alarm mode, mode is fixed to 'alarm', so stopwatch check is never true
                false // Always false in alarm mode
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
                mode === 'alarm' 
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
                // Note: In alarm mode, mode is fixed to 'alarm', so worldclock check is never true
                false // Always false in alarm mode
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
                    onClick={() => {
                      const newTheme = theme === 'dark' ? 'light' : 'dark';
                      // 标记这是用户手动切换的主题（在 setTheme 之前设置）
                      userInitiatedThemeChangeRef.current = true;
                      
                      // 保存手动主题设置（在 setTheme 之前保存）
                      if (typeof window !== 'undefined') {
                        localStorage.setItem(`timer-manual-theme-${mode}`, newTheme);
                      }
                      
                      // 如果当前页面有专用背景颜色，清除它，让主题生效
                      if (typeof window !== 'undefined') {
                        const currentModeBackgroundColor = localStorage.getItem(`timer-background-color-${mode}`);
                        if (currentModeBackgroundColor) {
                          // 清除当前页面的背景颜色设置，让主题生效
                          localStorage.removeItem(`timer-background-color-${mode}`);
                        }
                      }
                      
                      // 更新背景颜色以匹配新主题（在 setTheme 之前）
                      setBackgroundColor(newTheme === 'dark' ? '#1e293b' : '#f8fafc');
                      
                      // 调用 setTheme
                      setTheme(newTheme);
                      
                      // 延迟重置标记，确保主题更新完成后再允许 useEffect 应用主题
                      setTimeout(() => {
                        userInitiatedThemeChangeRef.current = false;
                      }, 300);
                    }}
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
        {/* 顶部工具栏 - 只在非全屏显示 */}
        <AnimatePresence>
          {!isFullscreen && showControls && (
            <>
              {/* 左上角：模式切换 - 移动端隐藏 */}
              <VerticalSidebar
                currentMode={mode}
                isFullscreen={false}
                showControls={showControls}
                onMouseEnter={() => { isHoveringControls.current = true; }}
                onMouseLeave={() => { isHoveringControls.current = false; }}
              />

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
              <VerticalSidebar
                currentMode={mode}
                isFullscreen={true}
                showControls={showControls}
                onMouseEnter={() => { isHoveringControls.current = true; }}
                onMouseLeave={() => { isHoveringControls.current = false; }}
              />

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
          className={`w-full flex flex-col items-center ${!isFullscreen ? 'mt-16 sm:mt-20 md:mt-24 lg:mt-28' : 'pt-12 sm:pt-20'}`}
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
            className="-mt-4 mb-4 sm:mt-0 sm:mb-6 md:mb-8"
          />

          {/* Alarm List */}
          {mode === 'alarm' ? (
            /* 闹钟模式 */
            <>
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
              <div className="mt-8 space-y-6">
                {/* 相对时间快捷设置 */}
                <div>
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
                          label: t(`alarm.presets.${preset.key}`),
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
                          t('notifications.alarm_success', { preset: t(`alarm.presets.${preset.key}`) }),
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
                      {t(`alarm.presets.${preset.key}`)}
                    </motion.button>
                  ))}
                </div>
                </div>

                {/* 具体时间快捷设置 */}
                <div>
                  <p className={`text-xs sm:text-sm mb-3 sm:mb-4 text-center font-medium ${
                    theme === 'dark' ? 'text-slate-300' : 'text-gray-700'
                  }`}>
                    {t('alarm.set_specific_time')}
                  </p>
                  
                  {/* AM 整点 */}
                  <div className="mb-4">
                    <p className={`text-xs mb-2 ${theme === 'dark' ? 'text-slate-400' : 'text-gray-600'}`}>
                      {t('alarm.morning_hours')}
                    </p>
                    <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                      {[12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map((hour) => (
                        <motion.button
                          key={`am-${hour}`}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => {
                            const alarmHour = hour === 12 ? 0 : hour;
                            const existingAlarm = alarms.find(
                              alarm => alarm.hour === alarmHour && alarm.minute === 0 && alarm.repeat === 'once'
                            );
                            
                            if (existingAlarm) {
                              // 如果闹钟已存在但是关闭状态，自动开启它
                              if (!existingAlarm.enabled) {
                                const updatedAlarms = alarms.map(alarm =>
                                  alarm.id === existingAlarm.id ? { ...alarm, enabled: true } : alarm
                                );
                                setAlarms(updatedAlarms);
                                if (typeof window !== 'undefined') {
                                  localStorage.setItem('timer-alarms', JSON.stringify(updatedAlarms));
                                }
                                setLastAddedAlarmId(existingAlarm.id);
                                const timeStr = `${String(alarmHour).padStart(2, '0')}:00`;
                                
                                // 检查时间是否已过去
                                const now = new Date();
                                const currentHour = now.getHours();
                                const currentMinute = now.getMinutes();
                                const isPast = (alarmHour < currentHour) || (alarmHour === currentHour && 0 <= currentMinute);
                                
                                if (isPast) {
                                  showToast('success', t('notifications.alarm_enabled'), locale === 'zh' ? `已开启，将在次日 ${timeStr} 响铃` : `Enabled, will ring tomorrow at ${timeStr}`, `alarm-enabled-${alarmHour}-0`);
                                } else {
                                  showToast('success', t('notifications.alarm_enabled'), t('notifications.alarm_success_desc', { time: timeStr }), `alarm-enabled-${alarmHour}-0`);
                                }
                                return;
                              }
                              // 如果已存在且已开启，仅提示
                              setLastAddedAlarmId(existingAlarm.id);
                              const timeStr = `${String(alarmHour).padStart(2, '0')}:00`;
                              showToast('info', t('notifications.alarm_exists'), t('notifications.alarm_exists_desc', { time: timeStr }), `alarm-exists-${alarmHour}-0`);
                              return;
                            }
                            
                            // 检查设置的时间是否已经过去
                            const now = new Date();
                            const currentHour = now.getHours();
                            const currentMinute = now.getMinutes();
                            const isPast = (alarmHour < currentHour) || (alarmHour === currentHour && 0 <= currentMinute);
                            
                            const newAlarm: Alarm = {
                              id: Date.now().toString(),
                              hour: alarmHour,
                              minute: 0,
                              enabled: true,
                              repeat: 'once',
                              label: `${hour}:00 AM`,
                            };
                            
                            const updatedAlarms = [...alarms, newAlarm];
                            setAlarms(updatedAlarms);
                            setLastAddedAlarmId(newAlarm.id);
                            
                            if (typeof window !== 'undefined') {
                              localStorage.setItem('timer-alarms', JSON.stringify(updatedAlarms));
                            }
                            
                            const timeStr = `${String(alarmHour).padStart(2, '0')}:00`;
                            // 根据时间是否已过去显示不同的提示
                            if (isPast) {
                              showToast('success', t('notifications.alarm_success', { preset: `${hour}:00 AM` }), locale === 'zh' ? `将在次日 ${timeStr} 响铃` : `Will ring tomorrow at ${timeStr}`, `alarm-success-${alarmHour}-0`);
                            } else {
                              showToast('success', t('notifications.alarm_success', { preset: `${hour}:00 AM` }), t('notifications.alarm_success_desc', { time: timeStr }), `alarm-success-${alarmHour}-0`);
                            }
                          }}
                          className={`px-3 py-2 rounded-[8px] text-xs font-medium transition-all backdrop-blur-sm ${
                            theme === 'dark'
                              ? 'bg-slate-700/80 text-slate-200 hover:bg-slate-600/80 border border-slate-600/50'
                              : 'bg-white/80 text-slate-700 hover:bg-gray-50/80 border border-slate-200/50 shadow-sm'
                          }`}
                        >
                          {hour}:00 AM
                        </motion.button>
                      ))}
                    </div>
                  </div>

                  {/* PM 整点 */}
                  <div>
                    <p className={`text-xs mb-2 ${theme === 'dark' ? 'text-slate-400' : 'text-gray-600'}`}>
                      {t('alarm.afternoon_evening_hours')}
                    </p>
                    <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                      {[12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map((hour) => (
                        <motion.button
                          key={`pm-${hour}`}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => {
                            const alarmHour = hour === 12 ? 12 : hour + 12;
                            const existingAlarm = alarms.find(
                              alarm => alarm.hour === alarmHour && alarm.minute === 0 && alarm.repeat === 'once'
                            );
                            
                            if (existingAlarm) {
                              // 如果闹钟已存在但是关闭状态，自动开启它
                              if (!existingAlarm.enabled) {
                                const updatedAlarms = alarms.map(alarm =>
                                  alarm.id === existingAlarm.id ? { ...alarm, enabled: true } : alarm
                                );
                                setAlarms(updatedAlarms);
                                if (typeof window !== 'undefined') {
                                  localStorage.setItem('timer-alarms', JSON.stringify(updatedAlarms));
                                }
                                setLastAddedAlarmId(existingAlarm.id);
                                const timeStr = `${String(alarmHour).padStart(2, '0')}:00`;
                                
                                // 检查时间是否已过去
                                const now = new Date();
                                const currentHour = now.getHours();
                                const currentMinute = now.getMinutes();
                                const isPast = (alarmHour < currentHour) || (alarmHour === currentHour && 0 <= currentMinute);
                                
                                if (isPast) {
                                  showToast('success', t('notifications.alarm_enabled'), locale === 'zh' ? `已开启，将在次日 ${timeStr} 响铃` : `Enabled, will ring tomorrow at ${timeStr}`, `alarm-enabled-${alarmHour}-0`);
                                } else {
                                  showToast('success', t('notifications.alarm_enabled'), t('notifications.alarm_success_desc', { time: timeStr }), `alarm-enabled-${alarmHour}-0`);
                                }
                                return;
                              }
                              // 如果已存在且已开启，仅提示
                              setLastAddedAlarmId(existingAlarm.id);
                              const timeStr = `${String(alarmHour).padStart(2, '0')}:00`;
                              showToast('info', t('notifications.alarm_exists'), t('notifications.alarm_exists_desc', { time: timeStr }), `alarm-exists-${alarmHour}-0`);
                              return;
                            }
                            
                            // 检查设置的时间是否已经过去
                            const now = new Date();
                            const currentHour = now.getHours();
                            const currentMinute = now.getMinutes();
                            const isPast = (alarmHour < currentHour) || (alarmHour === currentHour && 0 <= currentMinute);
                            
                            const newAlarm: Alarm = {
                              id: Date.now().toString(),
                              hour: alarmHour,
                              minute: 0,
                              enabled: true,
                              repeat: 'once',
                              label: `${hour}:00 PM`,
                            };
                            
                            const updatedAlarms = [...alarms, newAlarm];
                            setAlarms(updatedAlarms);
                            setLastAddedAlarmId(newAlarm.id);
                            
                            if (typeof window !== 'undefined') {
                              localStorage.setItem('timer-alarms', JSON.stringify(updatedAlarms));
                            }
                            
                            const timeStr = `${String(alarmHour).padStart(2, '0')}:00`;
                            // 根据时间是否已过去显示不同的提示
                            if (isPast) {
                              showToast('success', t('notifications.alarm_success', { preset: `${hour}:00 PM` }), locale === 'zh' ? `将在次日 ${timeStr} 响铃` : `Will ring tomorrow at ${timeStr}`, `alarm-success-${alarmHour}-0`);
                            } else {
                              showToast('success', t('notifications.alarm_success', { preset: `${hour}:00 PM` }), t('notifications.alarm_success_desc', { time: timeStr }), `alarm-success-${alarmHour}-0`);
                            }
                          }}
                          className={`px-3 py-2 rounded-[8px] text-xs font-medium transition-all backdrop-blur-sm ${
                            theme === 'dark'
                              ? 'bg-slate-700/80 text-slate-200 hover:bg-slate-600/80 border border-slate-600/50'
                              : 'bg-white/80 text-slate-700 hover:bg-gray-50/80 border border-slate-200/50 shadow-sm'
                          }`}
                        >
                          {hour}:00 PM
                        </motion.button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
              )}
              </div>
            </div>
            </>
          ) : null}

          {/* 进度条 - 仅非全屏模式显示 */}
          {/* Note: In alarm mode, mode is fixed to 'alarm', so timer check is never true */}
          {false && (
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
                {/* 进度条已删除 - 闹钟模式不需要 */}
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
                className={`flex flex-wrap justify-center gap-2 sm:gap-3 md:gap-4 relative z-10 ${
                  isFullscreen 
                    ? 'px-2 pb-8 sm:pb-12 md:pb-16 lg:pb-20 w-full' 
                    : 'mt-6 sm:mt-8 md:mt-12'
                }`}
                style={isFullscreen ? {
                  marginTop: 'auto'
                } : {}}
                onMouseEnter={() => { isHoveringControls.current = true; }}
                onMouseLeave={() => { isHoveringControls.current = false; }}
              >
              </motion.div>
            )}
          </AnimatePresence>

        </motion.div>
      </div>


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
                  {/* Note: In alarm mode, mode is fixed to 'alarm', so worldclock check is never true */}
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
                    // 使用 alarmColor 状态
                    const currentColor = alarmColor;
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
                    const isSelectedPrimary = alarmColor === color.id;
                    const isSelectedSecondary = false; // 闹钟页面没有小卡片
                    
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
                    const isSelectedPrimary = alarmColor === color.id;
                    const isSelectedSecondary = false; // 闹钟页面没有小卡片
                    
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
                    const isSelectedPrimary = alarmColor === color.id;
                    const isSelectedSecondary = false; // 闹钟页面没有小卡片
                    
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
                                      
                                      // Note: In alarm mode, mode is fixed to 'alarm', so timer/stopwatch/worldclock checks are never true
                                      const pageName = t('modes.alarm'); // Always 'alarm' in alarm mode
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
          setAlarmColor(colorId);
        }}
      />
      
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
      </div>
    </div>
  );
}
