"use client";

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, RotateCcw, Maximize, Volume2, VolumeX, Settings, X, Timer, Clock, Sun, Moon, Bell, BellOff, Cloud, CloudRain, CloudSnow, CloudDrizzle, Cloudy, AlarmClock, Plus, Trash2, Globe, MapPin, Search } from 'lucide-react';
import { toast } from 'sonner';
import { useTranslations, useLocale } from 'next-intl';

// 预设时间选项
const PRESET_TIMES = [
  { key: '1min', seconds: 60 },
  { key: '3min', seconds: 180 },
  { key: '5min', seconds: 300 },
  { key: '10min', seconds: 600 },
  { key: '15min', seconds: 900 },
  { key: '25min', seconds: 1500 },
  { key: '30min', seconds: 1800 },
  { key: '45min', seconds: 2700 },
  { key: '1hour', seconds: 3600 },
];

// 声音选项
const SOUND_OPTIONS = [
  { id: 'bell', key: 'bell', frequency: 800 },
  { id: 'chime', key: 'chime', frequency: 1000 },
  { id: 'beep', key: 'beep', frequency: 600 },
  { id: 'digital', key: 'digital', frequency: 1200 },
];

// 主题颜色选项
const THEME_COLORS = [
  { id: 'blue', key: 'blue', color: '#3b82f6' },
  { id: 'purple', key: 'purple', color: '#a855f7' },
  { id: 'green', key: 'green', color: '#22c55e' },
  { id: 'orange', key: 'orange', color: '#f97316' },
  { id: 'pink', key: 'pink', color: '#ec4899' },
];

// 世界时间城市列表（包含天气信息）
// 世界城市列表（按UTC时区偏移量从西到东排序）
const WORLD_CITIES = [
  { key: 'losangeles', timezone: 'America/Los_Angeles', offset: -8, weatherCode: '113', temp: 22, countryKey: 'usa' },
  { key: 'chicago', timezone: 'America/Chicago', offset: -6, weatherCode: '119', temp: 13, countryKey: 'usa' },
  { key: 'newyork', timezone: 'America/New_York', offset: -5, weatherCode: '116', temp: 15, countryKey: 'usa' },
  { key: 'greenwich', timezone: 'Europe/London', offset: 0, weatherCode: '296', temp: 10, countryKey: 'uk' },
  { key: 'london', timezone: 'Europe/London', offset: 0, weatherCode: '296', temp: 12, countryKey: 'uk' },
  { key: 'paris', timezone: 'Europe/Paris', offset: 1, weatherCode: '176', temp: 14, countryKey: 'france' },
  { key: 'moscow', timezone: 'Europe/Moscow', offset: 3, weatherCode: '122', temp: 8, countryKey: 'russia' },
  { key: 'dubai', timezone: 'Asia/Dubai', offset: 4, weatherCode: '113', temp: 32, countryKey: 'uae' },
  { key: 'mumbai', timezone: 'Asia/Kolkata', offset: 5.5, weatherCode: '116', temp: 30, countryKey: 'india' },
  { key: 'beijing', timezone: 'Asia/Shanghai', offset: 8, weatherCode: '116', temp: 22, countryKey: 'china' },
  { key: 'singapore', timezone: 'Asia/Singapore', offset: 8, weatherCode: '296', temp: 28, countryKey: 'singapore' },
  { key: 'tokyo', timezone: 'Asia/Tokyo', offset: 9, weatherCode: '113', temp: 18, countryKey: 'japan' },
  { key: 'seoul', timezone: 'Asia/Seoul', offset: 9, weatherCode: '119', temp: 16, countryKey: 'korea' },
  { key: 'sydney', timezone: 'Australia/Sydney', offset: 10, weatherCode: '113', temp: 24, countryKey: 'australia' },
];

// 更多时区选项（供用户选择）
const MORE_TIMEZONES = [
  { name: '雅加达', nameEn: 'Jakarta', timezone: 'Asia/Jakarta', country: '印度尼西亚', countryEn: 'Indonesia' },
  { name: '曼谷', nameEn: 'Bangkok', timezone: 'Asia/Bangkok', country: '泰国', countryEn: 'Thailand' },
  { name: '河内', nameEn: 'Hanoi', timezone: 'Asia/Ho_Chi_Minh', country: '越南', countryEn: 'Vietnam' },
  { name: '吉隆坡', nameEn: 'Kuala Lumpur', timezone: 'Asia/Kuala_Lumpur', country: '马来西亚', countryEn: 'Malaysia' },
  { name: '马尼拉', nameEn: 'Manila', timezone: 'Asia/Manila', country: '菲律宾', countryEn: 'Philippines' },
  { name: '台北', nameEn: 'Taipei', timezone: 'Asia/Taipei', country: '中国', countryEn: 'China' },
  { name: '香港', nameEn: 'Hong Kong', timezone: 'Asia/Hong_Kong', country: '中国', countryEn: 'China' },
  { name: '上海', nameEn: 'Shanghai', timezone: 'Asia/Shanghai', country: '中国', countryEn: 'China' },
  { name: '奥克兰', nameEn: 'Auckland', timezone: 'Pacific/Auckland', country: '新西兰', countryEn: 'New Zealand' },
  { name: '墨尔本', nameEn: 'Melbourne', timezone: 'Australia/Melbourne', country: '澳大利亚', countryEn: 'Australia' },
  { name: '布里斯班', nameEn: 'Brisbane', timezone: 'Australia/Brisbane', country: '澳大利亚', countryEn: 'Australia' },
  { name: '珀斯', nameEn: 'Perth', timezone: 'Australia/Perth', country: '澳大利亚', countryEn: 'Australia' },
  { name: '德里', nameEn: 'Delhi', timezone: 'Asia/Kolkata', country: '印度', countryEn: 'India' },
  { name: '卡拉奇', nameEn: 'Karachi', timezone: 'Asia/Karachi', country: '巴基斯坦', countryEn: 'Pakistan' },
  { name: '开罗', nameEn: 'Cairo', timezone: 'Africa/Cairo', country: '埃及', countryEn: 'Egypt' },
  { name: '伊斯坦布尔', nameEn: 'Istanbul', timezone: 'Europe/Istanbul', country: '土耳其', countryEn: 'Turkey' },
  { name: '柏林', nameEn: 'Berlin', timezone: 'Europe/Berlin', country: '德国', countryEn: 'Germany' },
  { name: '罗马', nameEn: 'Rome', timezone: 'Europe/Rome', country: '意大利', countryEn: 'Italy' },
  { name: '马德里', nameEn: 'Madrid', timezone: 'Europe/Madrid', country: '西班牙', countryEn: 'Spain' },
  { name: '阿姆斯特丹', nameEn: 'Amsterdam', timezone: 'Europe/Amsterdam', country: '荷兰', countryEn: 'Netherlands' },
  { name: '布鲁塞尔', nameEn: 'Brussels', timezone: 'Europe/Brussels', country: '比利时', countryEn: 'Belgium' },
  { name: '苏黎世', nameEn: 'Zurich', timezone: 'Europe/Zurich', country: '瑞士', countryEn: 'Switzerland' },
  { name: '斯德哥尔摩', nameEn: 'Stockholm', timezone: 'Europe/Stockholm', country: '瑞典', countryEn: 'Sweden' },
  { name: '多伦多', nameEn: 'Toronto', timezone: 'America/Toronto', country: '加拿大', countryEn: 'Canada' },
  { name: '温哥华', nameEn: 'Vancouver', timezone: 'America/Vancouver', country: '加拿大', countryEn: 'Canada' },
  { name: '蒙特利尔', nameEn: 'Montreal', timezone: 'America/Montreal', country: '加拿大', countryEn: 'Canada' },
  { name: '墨西哥城', nameEn: 'Mexico City', timezone: 'America/Mexico_City', country: '墨西哥', countryEn: 'Mexico' },
  { name: '圣保罗', nameEn: 'São Paulo', timezone: 'America/Sao_Paulo', country: '巴西', countryEn: 'Brazil' },
  { name: '布宜诺斯艾利斯', nameEn: 'Buenos Aires', timezone: 'America/Argentina/Buenos_Aires', country: '阿根廷', countryEn: 'Argentina' },
  { name: '圣地亚哥', nameEn: 'Santiago', timezone: 'America/Santiago', country: '智利', countryEn: 'Chile' },
];

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
  
  // 模式：'timer' 倒计时, 'stopwatch' 秒表, 'alarm' 闹钟, 'worldclock' 世界时间
  const [mode, setMode] = useState<'timer' | 'stopwatch' | 'alarm' | 'worldclock'>('timer');
  
  // 倒计时相关
  const [timeLeft, setTimeLeft] = useState(1800); // Default 30 minutes
  const [initialTime, setInitialTime] = useState(1800);
  
  // 秒表相关
  const [stopwatchTime, setStopwatchTime] = useState(0); // 秒表时间（秒）
  
  // 通用状态
  const [isRunning, setIsRunning] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [showEditModal, setShowEditModal] = useState(false);
  const [customMinutes, setCustomMinutes] = useState(5);
  const [customSeconds, setCustomSeconds] = useState(0);
  const [showControls, setShowControls] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [showCardBorder, setShowCardBorder] = useState(true); // 控制大卡片边框显示（全屏模式下）
  
  // 新增功能状态
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');
  const [selectedSound, setSelectedSound] = useState('bell');
  const [selectedColor, setSelectedColor] = useState('blue');
  const [notificationEnabled, setNotificationEnabled] = useState(false);
  const [showSettingsPanel, setShowSettingsPanel] = useState(false);
  const [progressVisible, setProgressVisible] = useState(true);
  
  // 显示控制状态
  const [showWeatherIcon, setShowWeatherIcon] = useState(true);
  const [showTemperature, setShowTemperature] = useState(true);
  const [showDate, setShowDate] = useState(true);
  const [showWeekday, setShowWeekday] = useState(true);
  
  // 天气相关状态
  const [weather, setWeather] = useState<{
    temp: number;
    condition: string;
    icon: string;
  } | null>(null);
  
  // 用户位置相关状态
  const [userLocation, setUserLocation] = useState<{
    city: string;
    timezone: string;
    country: string;
  } | null>(null);
  
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
  
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const hideControlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isHoveringControls = useRef(false);
  const alarmCheckIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastToastRef = useRef<{ id: string; time: number } | null>(null);
  const lastClickRef = useRef<{ action: string; time: number } | null>(null);
  const currentRingingAlarmRef = useRef<string | null>(null);
  const alarmRingStartTimeRef = useRef<number | null>(null);

  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        if (mode === 'timer') {
          // 倒计时模式
          setTimeLeft((prev) => {
            if (prev <= 1) {
              setIsRunning(false);
              if (soundEnabled) {
                playNotificationSound();
              }
              // 桌面通知
              showDesktopNotification(t('notifications.timer_end'), t('notifications.timer_end_desc'));
              return 0;
            }
            return prev - 1;
          });
        } else {
          // 秒表模式
          setStopwatchTime((prev) => prev + 1);
        }
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning, mode, soundEnabled, notificationEnabled]);

  // 全屏功能
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // 鼠标移动显示控制按钮（仅在全屏模式下自动隐藏）
  useEffect(() => {
    const handleMouseMove = () => {
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

    window.addEventListener('mousemove', handleMouseMove);
    
    // 初始显示控制按钮
    handleMouseMove();

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
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

  // 当切换离开世界时间模式时，重置选中的城市
  useEffect(() => {
    if (mode !== 'worldclock') {
      setSelectedCity(null);
    }
  }, [mode]);

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
      const savedTime = localStorage.getItem('timer-last-time');
      const savedNotification = localStorage.getItem('timer-notification');
      const savedProgress = localStorage.getItem('timer-progress');
      const savedShowWeatherIcon = localStorage.getItem('timer-show-weather-icon');
      const savedShowTemperature = localStorage.getItem('timer-show-temperature');
      const savedShowDate = localStorage.getItem('timer-show-date');
      const savedShowWeekday = localStorage.getItem('timer-show-weekday');
      const savedAlarms = localStorage.getItem('timer-alarms');
      
      if (savedTheme) setTheme(savedTheme as 'light' | 'dark');
      if (savedSound) setSelectedSound(savedSound);
      if (savedColor) setSelectedColor(savedColor);
      if (savedNotification) setNotificationEnabled(savedNotification === 'true');
      if (savedProgress !== null) setProgressVisible(savedProgress === 'true');
      if (savedShowWeatherIcon !== null) setShowWeatherIcon(savedShowWeatherIcon === 'true');
      if (savedShowTemperature !== null) setShowTemperature(savedShowTemperature === 'true');
      if (savedShowDate !== null) setShowDate(savedShowDate === 'true');
      if (savedShowWeekday !== null) setShowWeekday(savedShowWeekday === 'true');
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

  // 保存设置到 localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('timer-theme', theme);
      localStorage.setItem('timer-sound', selectedSound);
      localStorage.setItem('timer-color', selectedColor);
      localStorage.setItem('timer-notification', String(notificationEnabled));
      localStorage.setItem('timer-progress', String(progressVisible));
      localStorage.setItem('timer-show-weather-icon', String(showWeatherIcon));
      localStorage.setItem('timer-show-temperature', String(showTemperature));
      localStorage.setItem('timer-show-date', String(showDate));
      localStorage.setItem('timer-show-weekday', String(showWeekday));
    }
  }, [theme, selectedSound, selectedColor, notificationEnabled, progressVisible, showWeatherIcon, showTemperature, showDate, showWeekday]);

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
  }, [timeLeft, stopwatchTime, mode, isFullscreen]);

  // 获取天气和位置数据
  useEffect(() => {
    const fetchWeatherAndLocation = async () => {
      try {
        // 根据当前语言设置API语言参数
        const langMap: Record<string, string> = {
          'zh': 'zh-CN',
          'en': 'en',
        };
        const apiLang = langMap[locale] || 'en';
        
        // 获取IP定位 (使用支持多语言的ip-api.com)
        const locationRes = await fetch(`http://ip-api.com/json/?lang=${apiLang}`);
        const locationData = await locationRes.json();
        
        if (locationData.status === 'success') {
          const city = locationData.city || locationData.regionName || '北京';
          const timezone = locationData.timezone || 'Asia/Shanghai';
          let country = locationData.country || '中国';
          
          // 特殊地区映射到国家（根据语言）
          const regionToCountryMap: Record<string, Record<string, string>> = {
            'zh-CN': {
              '香港': '中国',
              '澳门': '中国',
              '台湾': '中国',
            },
            'en': {
              'Hong Kong': 'China',
              'Macao': 'China',
              'Taiwan': 'China',
            }
          };
          
          // 如果当前country在映射表中，则替换为对应的国家
          if (regionToCountryMap[apiLang] && regionToCountryMap[apiLang][country]) {
            country = regionToCountryMap[apiLang][country];
          }
          
          // 保存用户位置信息
          setUserLocation({
            city,
            timezone,
            country
          });
        
        // 获取天气数据 (使用wttr.in API)
          const weatherRes = await fetch(`https://wttr.in/${locationData.city || 'Beijing'}?format=j1`);
        const weatherData = await weatherRes.json();
        
        if (weatherData && weatherData.current_condition && weatherData.current_condition[0]) {
          const current = weatherData.current_condition[0];
          setWeather({
            temp: parseInt(current.temp_C),
            condition: current.weatherDesc[0].value,
            icon: current.weatherCode
          });
          }
        } else {
          throw new Error('Location API failed');
        }
      } catch (error) {
        console.error('Failed to fetch weather:', error);
        // 设置默认天气和位置（根据语言）
        const defaultLocation = locale === 'zh' 
          ? { city: '北京', country: '中国' }
          : { city: 'Beijing', country: 'China' };
        
        setWeather({
          temp: 21,
          condition: 'Partly cloudy',
          icon: '116'
        });
        setUserLocation({
          ...defaultLocation,
          timezone: 'Asia/Shanghai'
        });
      }
    };

    fetchWeatherAndLocation();
    // 每30分钟更新一次天气和位置
    const weatherInterval = setInterval(fetchWeatherAndLocation, 30 * 60 * 1000);
    
    return () => clearInterval(weatherInterval);
  }, [locale]);

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
            playNotificationSound();
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

  const playNotificationSound = () => {
    try {
      const selectedSoundOption = SOUND_OPTIONS.find(s => s.id === selectedSound) || SOUND_OPTIONS[0];
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.value = selectedSoundOption.frequency;
      oscillator.type = 'sine';
      
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 1);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 1);
    } catch (error) {
      console.log('Audio notification not available');
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
  };

  const resetTimer = () => {
    setIsRunning(false);
    if (mode === 'timer') {
      setTimeLeft(initialTime);
    } else {
      setStopwatchTime(0);
    }
  };

  const switchMode = (newMode: 'timer' | 'stopwatch' | 'alarm' | 'worldclock') => {
    setIsRunning(false);
    setMode(newMode);
    if (newMode === 'timer') {
      setTimeLeft(initialTime);
    } else if (newMode === 'stopwatch') {
      setStopwatchTime(0);
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

  const toggleFullscreen = async () => {
    if (!document.fullscreenElement) {
      try {
        await document.documentElement.requestFullscreen();
      } catch (error) {
        console.log('Fullscreen not available');
      }
    } else {
      await document.exitFullscreen();
    }
  };

  const applyCustomTime = () => {
    const totalSeconds = customMinutes * 60 + customSeconds;
    if (totalSeconds > 0 || mode === 'stopwatch') {
      setIsRunning(false);
      if (mode === 'timer') {
        setInitialTime(totalSeconds);
        setTimeLeft(totalSeconds);
      } else if (mode === 'stopwatch') {
        // 秒表模式：设置起始时间
        setStopwatchTime(totalSeconds);
      }
      setShowEditModal(false);
    }
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
    
    return {
      dateStr: `${year}年${month}月${day}日`,
      weekdayStr: weekday
    };
  };

  // 格式化响铃时长
  const formatRingingDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    
    const duration = minutes > 0 ? `${minutes}分${secs}秒` : `${secs}秒`;
    return t('alarm.ringing', { duration });
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

  const themeColor = THEME_COLORS.find(c => c.id === selectedColor) || THEME_COLORS[0];

  return (
    <div 
      className={`${isFullscreen ? 'fixed inset-0 z-50' : 'min-h-screen'} ${theme === 'dark' ? 'bg-black' : 'bg-gray-100'} flex flex-col ${isFullscreen ? 'p-0' : 'p-4'} transition-colors duration-300`}
      style={{ cursor: !showControls ? 'none' : 'default' }}
    >
      {/* 主计时器区域 */}
      <div className="flex-1 flex items-center justify-center relative">
        {/* 顶部工具栏 - 只在非全屏显示 */}
        <AnimatePresence>
          {!isFullscreen && showControls && (
            <>
              {/* 左上角：模式切换 */}
              <motion.div 
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className="absolute top-4 left-4 flex gap-2"
                onMouseEnter={() => { isHoveringControls.current = true; }}
                onMouseLeave={() => { isHoveringControls.current = false; }}
              >
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => switchMode('timer')}
                  className={`p-2 rounded-lg transition-colors ${
                    mode === 'timer' 
                      ? 'bg-blue-500 text-white' 
                      : theme === 'dark'
                      ? 'bg-white/10 hover:bg-white/20 text-white/60'
                      : 'bg-gray-800/80 hover:bg-gray-700 text-gray-300'
                  }`}
                  title={t('modes.timer')}
                >
                  <Timer className="w-5 h-5" />
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => switchMode('stopwatch')}
                  className={`p-2 rounded-lg transition-colors ${
                    mode === 'stopwatch' 
                      ? 'bg-blue-500 text-white' 
                      : theme === 'dark'
                      ? 'bg-white/10 hover:bg-white/20 text-white/60'
                      : 'bg-gray-800/80 hover:bg-gray-700 text-gray-300'
                  }`}
                  title={t('modes.stopwatch')}
                >
                  <Clock className="w-5 h-5" />
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => switchMode('alarm')}
                  className={`p-2 rounded-lg transition-colors ${
                    mode === 'alarm' 
                      ? 'bg-blue-500 text-white' 
                      : theme === 'dark'
                      ? 'bg-white/10 hover:bg-white/20 text-white/60'
                      : 'bg-gray-800/80 hover:bg-gray-700 text-gray-300'
                  }`}
                  title={t('modes.alarm')}
                >
                  <AlarmClock className="w-5 h-5" />
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => switchMode('worldclock')}
                  className={`p-2 rounded-lg transition-colors ${
                    mode === 'worldclock' 
                      ? 'bg-blue-500 text-white' 
                      : theme === 'dark'
                      ? 'bg-white/10 hover:bg-white/20 text-white/60'
                      : 'bg-gray-800/80 hover:bg-gray-700 text-gray-300'
                  }`}
                  title={t('modes.worldclock')}
                >
                  <Globe className="w-5 h-5" />
                </motion.button>
              </motion.div>

              {/* 右上角：功能按钮 */}
              <motion.div 
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className="absolute top-4 right-4 flex gap-2"
                onMouseEnter={() => { isHoveringControls.current = true; }}
                onMouseLeave={() => { isHoveringControls.current = false; }}
              >
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    if (mode === 'alarm') {
                      setShowAddAlarm(true);
                    } else {
                      // 根据当前模式设置初始值
                      const currentSeconds = mode === 'timer' ? timeLeft : stopwatchTime;
                      setCustomMinutes(Math.floor(currentSeconds / 60));
                      setCustomSeconds(currentSeconds % 60);
                      setShowEditModal(true);
                    }
                  }}
                  className={`p-2 ${theme === 'dark' ? 'bg-white/10 hover:bg-white/20' : 'bg-black/10 hover:bg-black/20'} rounded-lg transition-colors`}
                  title={mode === 'alarm' ? t('buttons.add_alarm') : t('tooltips.custom_time')}
                >
                  <Settings className={`w-5 h-5 ${theme === 'dark' ? 'text-white' : 'text-black'}`} />
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setNotificationEnabled(!notificationEnabled)}
                  className={`p-2 ${theme === 'dark' ? 'bg-white/10 hover:bg-white/20' : 'bg-black/10 hover:bg-black/20'} rounded-lg transition-colors`}
                  title={notificationEnabled ? t('tooltips.close_notification') : t('tooltips.open_notification')}
                >
                  {notificationEnabled ? (
                    <Bell className={`w-5 h-5 ${theme === 'dark' ? 'text-white' : 'text-black'}`} />
                  ) : (
                    <BellOff className={`w-5 h-5 ${theme === 'dark' ? 'text-white' : 'text-black'}`} />
                  )}
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setSoundEnabled(!soundEnabled)}
                  className={`p-2 ${theme === 'dark' ? 'bg-white/10 hover:bg-white/20' : 'bg-black/10 hover:bg-black/20'} rounded-lg transition-colors`}
                  title={soundEnabled ? t('tooltips.close_sound') : t('tooltips.open_sound')}
                >
                  {soundEnabled ? (
                    <Volume2 className={`w-5 h-5 ${theme === 'dark' ? 'text-white' : 'text-black'}`} />
                  ) : (
                    <VolumeX className={`w-5 h-5 ${theme === 'dark' ? 'text-white' : 'text-black'}`} />
                  )}
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                  className={`p-2 ${theme === 'dark' ? 'bg-white/10 hover:bg-white/20' : 'bg-black/10 hover:bg-black/20'} rounded-lg transition-colors`}
                  title={theme === 'dark' ? t('tooltips.switch_to_light') : t('tooltips.switch_to_dark')}
                >
                  {theme === 'dark' ? (
                    <Sun className="w-5 h-5 text-white" />
                  ) : (
                    <Moon className="w-5 h-5 text-black" />
                  )}
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowSettingsPanel(!showSettingsPanel)}
                  className={`p-2 ${theme === 'dark' ? 'bg-white/10 hover:bg-white/20' : 'bg-black/10 hover:bg-black/20'} rounded-lg transition-colors ${showSettingsPanel ? 'ring-2 ring-blue-500' : ''}`}
                  title={t('buttons.settings')}
                >
                  <Settings className={`w-5 h-5 ${theme === 'dark' ? 'text-white' : 'text-black'}`} />
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={toggleFullscreen}
                  className={`p-2 ${theme === 'dark' ? 'bg-white/10 hover:bg-white/20' : 'bg-black/10 hover:bg-black/20'} rounded-lg transition-colors`}
                  title={t('tooltips.fullscreen')}
                >
                  <Maximize className={`w-5 h-5 ${theme === 'dark' ? 'text-white' : 'text-black'}`} />
                </motion.button>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* 全屏模式下的浮动工具栏 */}
        <AnimatePresence>
          {isFullscreen && showControls && (
            <>
              {/* 左上角：模式切换 */}
              <motion.div 
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className="fixed top-6 left-6 flex gap-3 z-50"
                onMouseEnter={() => { isHoveringControls.current = true; }}
                onMouseLeave={() => { isHoveringControls.current = false; }}
              >
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => switchMode('timer')}
                  className={`p-4 rounded-xl transition-all backdrop-blur-md shadow-2xl ${
                    mode === 'timer' 
                      ? 'bg-blue-500 text-white shadow-blue-500/50' 
                      : 'bg-black/40 hover:bg-black/60 text-white border border-white/20'
                  }`}
                  title={t('modes.timer')}
                >
                  <Timer className="w-7 h-7" />
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => switchMode('stopwatch')}
                  className={`p-4 rounded-xl transition-all backdrop-blur-md shadow-2xl ${
                    mode === 'stopwatch' 
                      ? 'bg-blue-500 text-white shadow-blue-500/50' 
                      : 'bg-black/40 hover:bg-black/60 text-white border border-white/20'
                  }`}
                  title={t('modes.stopwatch')}
                >
                  <Clock className="w-7 h-7" />
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => switchMode('alarm')}
                  className={`p-4 rounded-xl transition-all backdrop-blur-md shadow-2xl ${
                    mode === 'alarm' 
                      ? 'bg-blue-500 text-white shadow-blue-500/50' 
                      : 'bg-black/40 hover:bg-black/60 text-white border border-white/20'
                  }`}
                  title={t('modes.alarm')}
                >
                  <AlarmClock className="w-7 h-7" />
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => switchMode('worldclock')}
                  className={`p-4 rounded-xl transition-all backdrop-blur-md shadow-2xl ${
                    mode === 'worldclock' 
                      ? 'bg-blue-500 text-white shadow-blue-500/50' 
                      : 'bg-black/40 hover:bg-black/60 text-white border border-white/20'
                  }`}
                  title={t('modes.worldclock')}
                >
                  <Globe className="w-7 h-7" />
                </motion.button>
              </motion.div>

              {/* 右上角：功能按钮 */}
              <motion.div 
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className="fixed top-6 right-6 flex gap-3 z-50"
                onMouseEnter={() => { isHoveringControls.current = true; }}
                onMouseLeave={() => { isHoveringControls.current = false; }}
              >
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setSoundEnabled(!soundEnabled)}
                  className="p-4 bg-black/40 hover:bg-black/60 backdrop-blur-md rounded-xl transition-all shadow-2xl border border-white/20"
                  title={soundEnabled ? t('tooltips.close_sound') : t('tooltips.open_sound')}
                >
                  {soundEnabled ? (
                    <Volume2 className="w-7 h-7 text-white" />
                  ) : (
                    <VolumeX className="w-7 h-7 text-white" />
                  )}
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={toggleFullscreen}
                  className="p-4 bg-black/40 hover:bg-black/60 backdrop-blur-md rounded-xl transition-all shadow-2xl border border-white/20"
                  title={t('tooltips.exit_fullscreen')}
                >
                  <X className="w-7 h-7 text-white" />
                </motion.button>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="w-full flex flex-col items-center justify-center"
        >
          {/* 日期和天气显示 - 非全屏时显示 */}
          {!isFullscreen && (mode === 'timer' || mode === 'stopwatch') && (
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
                      {showWeatherIcon && (
                        <div className="w-4 h-4 sm:w-5 sm:h-5 md:w-5 md:h-5">
                          {getWeatherIcon(weather.icon)}
                        </div>
                      )}
                      {showTemperature && (
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

          {/* Time Display or Alarm List or World Clock */}
          {(mode === 'timer' || mode === 'stopwatch') ? (
            <div className="text-center w-full flex items-center justify-center px-2 sm:px-4">
              <div 
                id="timer-display"
                className={`${
                  (() => {
                    const time = mode === 'timer' ? formatTime(timeLeft) : formatTime(stopwatchTime);
                    // 根据是否有小时调整字体大小
                    if (isFullscreen) {
                      return time.hasHours 
                        ? 'text-[7rem] sm:text-[10rem] md:text-[14rem] lg:text-[17rem] xl:text-[20rem] 2xl:text-[24rem]'
                        : 'text-[12rem] sm:text-[16rem] md:text-[20rem] lg:text-[24rem] xl:text-[28rem] 2xl:text-[32rem]';
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
                  color: mode === 'timer' 
                    ? (timeLeft === 0 
                        ? '#22c55e'
                        : timeLeft < 60 
                        ? '#ef4444'
                        : theme === 'dark' ? '#e5e7eb' : '#1f2937')
                    : theme === 'dark' ? '#e5e7eb' : '#1f2937',
                  WebkitFontSmoothing: 'antialiased',
                  MozOsxFontSmoothing: 'grayscale',
                }}
              >
                {(() => {
                  const time = mode === 'timer' ? formatTime(timeLeft) : formatTime(stopwatchTime);
                  return (
                    <>
                      {time.hasHours && (
                        <>
                          <span>{time.hours}</span>
                          <span className="inline-flex flex-col justify-center gap-[0.2em] mx-[0.15em]">
                            <span className="w-[0.15em] h-[0.15em] bg-current rounded-sm"></span>
                            <span className="w-[0.15em] h-[0.15em] bg-current rounded-sm"></span>
                          </span>
                        </>
                      )}
                      <span>{time.mins}</span>
                      <span className="inline-flex flex-col justify-center gap-[0.2em] mx-[0.15em]">
                        <span className="w-[0.15em] h-[0.15em] bg-current rounded-sm"></span>
                        <span className="w-[0.15em] h-[0.15em] bg-current rounded-sm"></span>
                      </span>
                      <span>{time.secs}</span>
                    </>
                  );
                })()}
              </div>
              {mode === 'timer' && timeLeft === 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`font-semibold mt-4 sm:mt-6 md:mt-8 text-green-500 ${
                    isFullscreen 
                      ? 'text-3xl sm:text-4xl md:text-5xl' 
                      : 'text-2xl sm:text-3xl'
                  }`}
                >
                  {t('timer.time_up')}
                </motion.div>
              )}
            </div>
          ) : mode === 'alarm' ? (
            /* 闹钟模式 */
            <>
              {/* 日期和天气显示 - 非全屏时显示 */}
              {!isFullscreen && (
                <div className="w-full flex justify-center mb-4 sm:mb-6 md:mb-8 px-4">
                  <motion.div 
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="inline-flex items-center justify-between"
                    style={{
                      width: '100%',
                      minWidth: '300px',
                      maxWidth: 'min(var(--timer-width, 672px), 90vw)'
                    }}
                  >
                    {/* 左侧：天气图标和温度 */}
                    <div className="flex items-center gap-1 sm:gap-1.5">
                      {weather && (showWeatherIcon || showTemperature) ? (
                        <>
                          {showWeatherIcon && (
                            <div className="w-4 h-4 sm:w-5 sm:h-5 md:w-5 md:h-5">
                              {getWeatherIcon(weather.icon)}
                            </div>
                          )}
                          {showTemperature && (
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
                  <div className={`text-center py-12 ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`}>
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
                          ? 'bg-white/5 hover:bg-white/10' 
                          : 'bg-gray-800/5 hover:bg-gray-800/10'
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
                className={`w-full p-4 mb-4 rounded-[8px] flex items-center justify-center gap-2 transition-colors ${
                  theme === 'dark' 
                    ? 'bg-blue-500/20 hover:bg-blue-500/30 text-blue-400' 
                    : 'bg-blue-500/20 hover:bg-blue-500/30 text-blue-600'
                }`}
              >
                <Plus className="w-5 h-5" />
                  <span className="font-medium">{t('buttons.add_alarm')}</span>
              </motion.button>

              {/* 快捷设置按钮 - 仅在闹钟模式下显示 */}
              <div className="mt-8">
                <p className={`text-xs sm:text-sm ${theme === 'dark' ? 'text-slate-400' : 'text-gray-600'} mb-3 sm:mb-4 text-center`}>
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
                      className={`px-4 py-3 rounded-[8px] text-sm font-medium transition-all ${
                        theme === 'dark'
                          ? 'bg-white/10 text-slate-300 hover:bg-white/20'
                          : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      }`}
                    >
                      {t(`presets.${preset.key}`)}
                    </motion.button>
                  ))}
                </div>
              </div>
              </div>
            </div>
            </>
          ) : mode === 'worldclock' ? (
            /* 世界时间 */
            <div className="w-full overflow-x-hidden mt-8 sm:mt-12 md:mt-16" style={{ paddingLeft: '32px', paddingRight: '32px' }}>
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
                      className={`py-14 sm:py-16 md:py-18 lg:py-20 xl:py-22 px-12 sm:px-16 md:px-20 lg:px-24 xl:px-28 rounded-3xl ${
                        showCardBorder 
                          ? (theme === 'dark' 
                              ? 'bg-slate-800/50 border border-slate-700 shadow-2xl' 
                              : 'bg-white border border-gray-200 shadow-2xl')
                          : 'bg-transparent border-0 shadow-none'
                      }`}
                      style={{
                        width: '100%',
                        minWidth: '300px',
                        maxWidth: 'min(1400px, 95vw)',
                        marginBottom: '48px',
                        transition: 'all 0.3s ease-in-out'
                      }}
                    >
                      <div className="w-full">
                        {/* 顶部：城市和白天/黑夜图标 */}
                        <div className="flex items-center justify-between mb-7">
                          <h2 className={`text-2xl sm:text-3xl md:text-4xl font-bold ${
                            theme === 'dark' ? 'text-white' : 'text-gray-900'
                          }`}>
                            {displayCity.city} | {displayCity.country}
                          </h2>
                          {(() => {
                            const now = new Date();
                            const userTime = new Date(now.toLocaleString('en-US', { timeZone: displayCity.timezone }));
                            const hours = userTime.getHours();
                            const isNight = hours < 6 || hours >= 18;
                            
                            return isNight ? (
                              <Moon className={`w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`} />
                            ) : (
                              <Sun className={`w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 ${theme === 'dark' ? 'text-yellow-500' : 'text-yellow-600'}`} />
                            );
                          })()}
                        </div>
                        
                        {/* 分隔线 */}
                        <div className={`border-t mb-8 ${theme === 'dark' ? 'border-slate-700' : 'border-gray-300'}`}></div>
                        
                        {/* 大时间显示 */}
                        <div 
                          className="text-7xl sm:text-8xl md:text-9xl lg:text-[10rem] xl:text-[11rem] font-bold text-center mb-8"
                          style={{
                            fontFamily: '"Rajdhani", sans-serif',
                            fontWeight: '700',
                            letterSpacing: '0.02em',
                            color: theme === 'dark' ? '#e5e7eb' : '#1f2937',
                          }}
                        >
                          {(() => {
                            const now = new Date();
                            const userTime = new Date(now.toLocaleString('en-US', { timeZone: displayCity.timezone }));
                            const hours = String(userTime.getHours()).padStart(2, '0');
                            const minutes = String(userTime.getMinutes()).padStart(2, '0');
                            const seconds = String(userTime.getSeconds()).padStart(2, '0');
                            return (
                              <span className="flex items-center justify-center gap-[0.08em]">
                                <span>{hours}</span>
                                <span className="inline-flex flex-col justify-center gap-[0.15em]">
                                  <span className="w-[0.12em] h-[0.12em] bg-current rounded-full"></span>
                                  <span className="w-[0.12em] h-[0.12em] bg-current rounded-full"></span>
                                </span>
                                <span>{minutes}</span>
                                <span className="inline-flex flex-col justify-center gap-[0.15em]">
                                  <span className="w-[0.12em] h-[0.12em] bg-current rounded-full"></span>
                                  <span className="w-[0.12em] h-[0.12em] bg-current rounded-full"></span>
                                </span>
                                <span className="text-[0.5em]">{seconds}</span>
                              </span>
                            );
                          })()}
                        </div>
                        
                        {/* 日期显示 */}
                        <div className={`flex items-center justify-center gap-4 sm:gap-6 md:gap-8 lg:gap-10 text-xl sm:text-2xl md:text-3xl font-medium mb-8 ${
                          theme === 'dark' ? 'text-slate-300' : 'text-gray-700'
                        }`}>
                          {(() => {
                            const now = new Date();
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
                                <span>{year}年{month}月{day}日</span>
                                <span>{weekday}</span>
                              </>
                            );
                          })()}
                        </div>
                        
                        {/* 底部：温度和定位信息 */}
                        <div className="flex items-center justify-between">
                          {(() => {
                            // 优先使用 selectedCity 的天气，否则使用 weather 状态
                            const displayWeather = selectedCity 
                              ? { temp: selectedCity.temp, icon: selectedCity.weatherCode }
                              : weather;
                            
                            return displayWeather ? (
                              <div className="flex items-center gap-2 sm:gap-3">
                                <div className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8">
                                  {getWeatherIcon(displayWeather.icon)}
                                </div>
                                <span className={`text-xl sm:text-2xl md:text-3xl font-semibold ${
                                  theme === 'dark' ? 'text-white' : 'text-gray-900'
                                }`}>
                                  {displayWeather.temp}°C
                                </span>
                              </div>
                            ) : null;
                          })()}
                          <div className="flex items-center gap-1.5 sm:gap-2">
                            <MapPin className={`w-4 h-4 sm:w-5 sm:h-5 ${
                              theme === 'dark' ? 'text-slate-400' : 'text-gray-600'
                            }`} />
                            <span className={`text-sm sm:text-base md:text-lg font-normal ${
                              theme === 'dark' ? 'text-slate-400' : 'text-gray-600'
                            }`}>
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
                      <div 
                        className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 mb-8"
                style={{
                  width: '100%',
                  minWidth: '300px',
                          maxWidth: 'min(1400px, 95vw)',
                          gap: '24px'
                }}
              >
                  {WORLD_CITIES.map((city) => {
                    const now = new Date();
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
                        className={`p-4 rounded-xl transition-all cursor-pointer ${
                          theme === 'dark' 
                              ? 'bg-slate-800/50 border border-slate-700 hover:bg-slate-800/70' 
                            : 'bg-white border border-gray-200 hover:bg-gray-50'
                        } shadow-lg hover:shadow-xl`}
                      >
                        <div className="flex items-center justify-between mb-3">
                          <h3 className={`text-base sm:text-lg font-bold ${theme === 'dark' ? 'text-slate-400' : 'text-gray-600'}`}>
                            {t(`cities.${city.key}`)} | {t(`countries.${city.countryKey}`)}
                          </h3>
                          {isNight ? (
                            <Moon className={`w-5 h-5 ${theme === 'dark' ? 'text-slate-500' : 'text-slate-500'}`} />
                          ) : (
                            <Sun className={`w-5 h-5 ${theme === 'dark' ? 'text-yellow-600/70' : 'text-yellow-600/80'}`} />
                          )}
                        </div>
                        
                        {/* 分隔线 */}
                        <div className={`border-t mb-3 ${theme === 'dark' ? 'border-slate-700' : 'border-gray-300'}`}></div>
                        
                        <div className={`text-3xl sm:text-4xl font-bold mb-4 text-center ${theme === 'dark' ? 'text-slate-300' : 'text-gray-600'}`}
                          style={{
                            fontFamily: '"Rajdhani", sans-serif',
                            letterSpacing: '0.05em',
                          }}
                        >
                          {String(hours).padStart(2, '0')}:{String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
                        </div>
                        
                        <div className={`text-sm sm:text-base font-medium mb-4 text-center ${theme === 'dark' ? 'text-slate-500' : 'text-gray-500'}`}>
                          {year}年{month}月{day}日 {weekday}
                        </div>
                        
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-1">
                            <div className="w-5 h-5">
                            {getWeatherIcon(city.weatherCode)}
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
                    const now = new Date();
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
                        className={`p-4 rounded-xl transition-all cursor-pointer relative ${
                          theme === 'dark' 
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
                            theme === 'dark'
                              ? 'hover:bg-red-900/30 text-red-400'
                              : 'hover:bg-red-100 text-red-600'
                          }`}
                        >
                          <X className="w-4 h-4" />
                        </button>
                        
                        <div className="flex items-center justify-between mb-3 pr-6">
                          <h3 className={`text-base sm:text-lg font-bold ${theme === 'dark' ? 'text-slate-400' : 'text-gray-600'}`}>
                            {customCity.name} | {customCity.country}
                          </h3>
                          {isNight ? (
                            <Moon className={`w-5 h-5 ${theme === 'dark' ? 'text-slate-500' : 'text-slate-500'}`} />
                          ) : (
                            <Sun className={`w-5 h-5 ${theme === 'dark' ? 'text-yellow-600/70' : 'text-yellow-600/80'}`} />
                          )}
                        </div>
                        
                        {/* 分隔线 */}
                        <div className={`border-t mb-3 ${theme === 'dark' ? 'border-slate-700' : 'border-gray-300'}`}></div>
                        
                        <div className={`text-3xl sm:text-4xl font-bold mb-4 text-center ${theme === 'dark' ? 'text-slate-300' : 'text-gray-600'}`}
                          style={{
                            fontFamily: '"Rajdhani", sans-serif',
                            letterSpacing: '0.05em',
                          }}
                        >
                          {String(hours).padStart(2, '0')}:{String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
                        </div>
                        
                        <div className={`text-sm sm:text-base font-medium mb-4 text-center ${theme === 'dark' ? 'text-slate-500' : 'text-gray-500'}`}>
                          {year}年{month}月{day}日 {weekday}
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
                    className={`p-4 rounded-xl transition-all cursor-pointer flex flex-col items-center justify-center min-h-[200px] ${
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
          {mode === 'timer' && progressVisible && !isFullscreen && timeLeft > 0 && initialTime > 0 && (
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
                      backgroundColor: timeLeft < 60 
                        ? '#ef4444'
                        : theme === 'dark' ? '#e5e7eb' : '#1f2937',
                      width: `${(timeLeft / initialTime) * 100}%`,
                      transition: 'width 1s linear, background-color 0.3s ease'
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
                className={`flex flex-wrap justify-center gap-3 sm:gap-4 ${
                  isFullscreen 
                    ? 'mt-8 sm:mt-12 md:mt-16 lg:mt-20' 
                    : 'mt-6 sm:mt-8 md:mt-12'
                }`}
                onMouseEnter={() => { isHoveringControls.current = true; }}
                onMouseLeave={() => { isHoveringControls.current = false; }}
              >
                {(mode === 'timer' || mode === 'stopwatch') && (
                  <>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={toggleTimer}
                      disabled={mode === 'timer' && timeLeft === 0}
                      className={`flex items-center gap-2 ${
                        isFullscreen 
                          ? 'px-6 py-3 sm:px-8 sm:py-4 md:px-10 md:py-5 lg:px-12 lg:py-6 text-base sm:text-lg md:text-xl' 
                          : 'px-4 py-2 sm:px-6 sm:py-3 md:px-8 md:py-4 text-sm sm:text-base'
                      } rounded-[10px] font-semibold text-white shadow-lg transition-all ${
                        mode === 'timer' && timeLeft === 0
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
                              ? 'w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7' 
                              : 'w-4 h-4 sm:w-5 sm:h-5'
                          } />
                          <span>{t('buttons.pause')}</span>
                        </>
                      ) : (
                        <>
                          <Play className={
                            isFullscreen 
                              ? 'w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7' 
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
                      className={`flex items-center gap-2 ${
                        isFullscreen 
                          ? 'px-6 py-3 sm:px-8 sm:py-4 md:px-10 md:py-5 lg:px-12 lg:py-6 text-base sm:text-lg md:text-xl' 
                          : 'px-4 py-2 sm:px-6 sm:py-3 md:px-8 md:py-4 text-sm sm:text-base'
                      } bg-slate-700 hover:bg-slate-600 text-white rounded-[8px] font-semibold shadow-lg transition-all`}
                    >
                      <RotateCcw className={
                        isFullscreen 
                          ? 'w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7' 
                          : 'w-4 h-4 sm:w-5 sm:h-5'
                      } />
                      <span>{t('buttons.reset')}</span>
                    </motion.button>

                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => {
                        const currentSeconds = mode === 'timer' ? timeLeft : stopwatchTime;
                        setCustomMinutes(Math.floor(currentSeconds / 60));
                        setCustomSeconds(currentSeconds % 60);
                        setShowEditModal(true);
                      }}
                      className={`flex items-center gap-2 ${
                        isFullscreen 
                          ? 'px-6 py-3 sm:px-8 sm:py-4 md:px-10 md:py-5 lg:px-12 lg:py-6 text-base sm:text-lg md:text-xl' 
                          : 'px-4 py-2 sm:px-6 sm:py-3 md:px-8 md:py-4 text-sm sm:text-base'
                      } ${theme === 'dark' ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-indigo-500 hover:bg-indigo-600'} text-white rounded-[8px] font-semibold shadow-lg transition-all`}
                    >
                      <Settings className={
                        isFullscreen 
                          ? 'w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7' 
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
            {!isFullscreen && mode === 'timer' && showControls && (
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
                            ? 'bg-blue-500 text-white shadow-md'
                            : theme === 'dark'
                            ? 'bg-white/10 text-slate-300 hover:bg-white/20'
                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
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
                      className={`w-full px-4 py-2 border rounded-[8px] focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black no-spinner ${
                        theme === 'dark' 
                          ? 'bg-slate-800 border-slate-700' 
                          : 'bg-white border-gray-300'
                      }`}
                      style={{ 
                        color: '#000000 !important',
                        WebkitTextFillColor: '#000000 !important',
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
                      className={`w-full px-4 py-2 border rounded-[8px] focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black no-spinner ${
                        theme === 'dark' 
                          ? 'bg-slate-800 border-slate-700' 
                          : 'bg-white border-gray-300'
                      }`}
                      style={{ 
                        color: '#000000 !important',
                        WebkitTextFillColor: '#000000 !important',
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
                    className={`w-full px-4 py-2 border rounded-[8px] focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black ${
                      theme === 'dark' 
                        ? 'bg-slate-800 border-slate-700 placeholder:text-slate-400' 
                        : 'bg-white border-gray-300 placeholder:text-gray-500'
                    }`}
                    style={{ 
                      color: '#000000 !important',
                      WebkitTextFillColor: '#000000 !important',
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

      {/* 设置面板 */}
      <AnimatePresence>
        {showSettingsPanel && !isFullscreen && (
          <motion.div
            initial={{ opacity: 0, x: 300 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 300 }}
            transition={{ type: "spring", damping: 20 }}
            className="fixed right-4 top-20 z-40 w-80"
          >
            <div className={`${theme === 'dark' ? 'bg-slate-900 border-slate-700' : 'bg-white border-gray-200'} border rounded-2xl shadow-2xl p-6`}>
              <div className="flex justify-between items-center mb-6">
                <h3 className={`text-xl font-bold ${theme === 'dark' ? 'text-white' : 'text-black'}`}>{t('settings_panel.title')}</h3>
                <button
                  onClick={() => setShowSettingsPanel(false)}
                  className={`p-2 ${theme === 'dark' ? 'hover:bg-slate-800' : 'hover:bg-gray-100'} rounded-lg transition-colors`}
                >
                  <X className={`w-5 h-5 ${theme === 'dark' ? 'text-slate-400' : 'text-gray-600'}`} />
                </button>
              </div>

              {/* 主题颜色选择 */}
              <div className="mb-6">
                <label className={`block text-sm font-medium ${theme === 'dark' ? 'text-slate-300' : 'text-gray-700'} mb-3`}>
                  {t('settings_panel.theme_color')}
                </label>
                <div className="grid grid-cols-5 gap-2">
                  {THEME_COLORS.map((color) => (
                    <button
                      key={color.id}
                      onClick={() => setSelectedColor(color.id)}
                      className={`w-12 h-12 rounded-lg transition-all ${
                        selectedColor === color.id ? 'ring-2 ring-offset-2 ring-blue-500 scale-110' : 'hover:scale-105'
                      }`}
                      style={{ backgroundColor: color.color }}
                      title={t(`colors.${color.key}`)}
                    />
                  ))}
                </div>
              </div>

              {/* 提示音选择 */}
              <div className="mb-6">
                <label className={`block text-sm font-medium ${theme === 'dark' ? 'text-slate-300' : 'text-gray-700'} mb-3`}>
                  {t('settings_panel.sound')}
                </label>
                <div className="space-y-2">
                  {SOUND_OPTIONS.map((sound) => (
                    <button
                      key={sound.id}
                      onClick={() => {
                        setSelectedSound(sound.id);
                        // 试听音效
                        if (soundEnabled) {
                          const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
                          const oscillator = audioContext.createOscillator();
                          const gainNode = audioContext.createGain();
                          oscillator.connect(gainNode);
                          gainNode.connect(audioContext.destination);
                          oscillator.frequency.value = sound.frequency;
                          oscillator.type = 'sine';
                          gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
                          gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
                          oscillator.start(audioContext.currentTime);
                          oscillator.stop(audioContext.currentTime + 0.5);
                        }
                      }}
                      className={`w-full px-4 py-3 rounded-lg text-left transition-all ${
                        selectedSound === sound.id
                          ? theme === 'dark'
                            ? 'bg-blue-500 text-white'
                            : 'bg-blue-500 text-white'
                          : theme === 'dark'
                          ? 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {t(`sounds.${sound.key}`)}
                    </button>
                  ))}
                </div>
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
          </motion.div>
        )}
      </AnimatePresence>
      
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
              className={`w-full max-w-2xl max-h-[80vh] rounded-2xl overflow-hidden ${
                theme === 'dark' ? 'bg-slate-800' : 'bg-white'
              }`}
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
              
              {/* 模式切换按钮 */}
              <div className={`flex gap-2 p-4 border-b ${
                theme === 'dark' ? 'border-slate-700' : 'border-gray-200'
              }`}>
                <button
                  onClick={() => setInputMode('search')}
                  className={`flex-1 py-2 px-4 rounded-lg font-medium transition-all ${
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
                  className={`flex-1 py-2 px-4 rounded-lg font-medium transition-all ${
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
                  {/* 搜索框 */}
                  <div className={`p-6 border-b ${theme === 'dark' ? 'border-slate-700' : 'border-gray-200'}`}>
                <div className="relative">
                  <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 ${
                    theme === 'dark' ? 'text-slate-400' : 'text-gray-400'
                  }`} />
                  <input
                    type="text"
                    value={timezoneSearch}
                    onChange={(e) => setTimezoneSearch(e.target.value)}
                    placeholder={t('worldclock.search_placeholder')}
                    className={`w-full pl-10 pr-4 py-3 rounded-lg border ${
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
                /* 手动输入模式 */
                <div className="p-6">
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
                        className={`w-full px-4 py-3 rounded-lg border ${
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
                        className={`w-full px-4 py-3 rounded-lg border ${
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
                        className={`w-full px-4 py-3 rounded-lg border ${
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
                        常用时区参考：
                      </p>
                      <div className={`text-xs space-y-1 ${
                        theme === 'dark' ? 'text-slate-400' : 'text-gray-600'
                      }`}>
                        <p>• 亚洲/上海: Asia/Shanghai</p>
                        <p>• 美国/纽约: America/New_York</p>
                        <p>• 欧洲/伦敦: Europe/London</p>
                        <p>• 亚洲/东京: Asia/Tokyo</p>
                        <p>• 澳洲/悉尼: Australia/Sydney</p>
                      </div>
                    </div>
                    
                    {/* 添加按钮 */}
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
                          
                          toast.success(`已添加 ${manualCityName}`);
                        } catch (error) {
                          toast.error('时区格式无效，请输入正确的 IANA 时区标识符');
                        }
                      }}
                      className={`w-full py-3 px-4 rounded-lg font-medium transition-all ${
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
    </div>
  );
}
