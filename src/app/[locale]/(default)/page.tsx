"use client";

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, RotateCcw, Maximize, Volume2, VolumeX, Settings, X, Timer, Clock, Sun, Moon, Bell, BellOff, Cloud, CloudRain, CloudSnow, CloudDrizzle, Cloudy, AlarmClock, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

// 预设时间选项
const PRESET_TIMES = [
  { label: '1分钟', seconds: 60 },
  { label: '3分钟', seconds: 180 },
  { label: '5分钟', seconds: 300 },
  { label: '10分钟', seconds: 600 },
  { label: '15分钟', seconds: 900 },
  { label: '25分钟', seconds: 1500 },
  { label: '30分钟', seconds: 1800 },
  { label: '45分钟', seconds: 2700 },
  { label: '1小时', seconds: 3600 },
];

// 声音选项
const SOUND_OPTIONS = [
  { id: 'bell', name: '铃铛', frequency: 800 },
  { id: 'chime', name: '提示音', frequency: 1000 },
  { id: 'beep', name: '哔哔声', frequency: 600 },
  { id: 'digital', name: '电子音', frequency: 1200 },
];

// 主题颜色选项
const THEME_COLORS = [
  { id: 'blue', name: '蓝色', color: '#3b82f6' },
  { id: 'purple', name: '紫色', color: '#a855f7' },
  { id: 'green', name: '绿色', color: '#22c55e' },
  { id: 'orange', name: '橙色', color: '#f97316' },
  { id: 'pink', name: '粉色', color: '#ec4899' },
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
  // 模式：'timer' 倒计时, 'stopwatch' 秒表, 'alarm' 闹钟
  const [mode, setMode] = useState<'timer' | 'stopwatch' | 'alarm'>('timer');
  
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
  
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const hideControlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isHoveringControls = useRef(false);
  const alarmCheckIntervalRef = useRef<NodeJS.Timeout | null>(null);

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
              showDesktopNotification('⏰ 倒计时结束', '您设定的倒计时已完成！');
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

  // 获取天气数据
  useEffect(() => {
    const fetchWeather = async () => {
      try {
        // 获取IP定位
        const locationRes = await fetch('https://ipapi.co/json/');
        const locationData = await locationRes.json();
        const city = locationData.city || locationData.region || 'Beijing';
        
        // 获取天气数据 (使用wttr.in API)
        const weatherRes = await fetch(`https://wttr.in/${city}?format=j1`);
        const weatherData = await weatherRes.json();
        
        if (weatherData && weatherData.current_condition && weatherData.current_condition[0]) {
          const current = weatherData.current_condition[0];
          setWeather({
            temp: parseInt(current.temp_C),
            condition: current.weatherDesc[0].value,
            icon: current.weatherCode
          });
        }
      } catch (error) {
        console.error('Failed to fetch weather:', error);
        // 设置默认天气
        setWeather({
          temp: 21,
          condition: 'Partly cloudy',
          icon: '116'
        });
      }
    };

    fetchWeather();
    // 每30分钟更新一次天气
    const weatherInterval = setInterval(fetchWeather, 30 * 60 * 1000);
    
    return () => clearInterval(weatherInterval);
  }, []);

  // 检查闹钟
  useEffect(() => {
    alarmCheckIntervalRef.current = setInterval(() => {
      const now = new Date();
      const currentHour = now.getHours();
      const currentMinute = now.getMinutes();
      
      alarms.forEach(alarm => {
        if (shouldAlarmRing(alarm, now)) {
          setRingingAlarmId(alarm.id);
          setRingingAlarm(alarm); // 保存完整的闹钟对象
          playNotificationSound();
          showDesktopNotification('闹钟', alarm.label || `${String(alarm.hour).padStart(2, '0')}:${String(alarm.minute).padStart(2, '0')}`);
          
          // 如果是单次闹钟，响铃后删除
          if (alarm.repeat === 'once') {
            setTimeout(() => {
              deleteAlarm(alarm.id);
            }, 1000);
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

  const switchMode = (newMode: 'timer' | 'stopwatch' | 'alarm') => {
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
    setRingingAlarmId(null);
    setRingingAlarm(null);
  };

  const snoozeAlarm = () => {
    if (!ringingAlarmId) return;
    
    // 关闭当前响铃
    setRingingAlarmId(null);
    setRingingAlarm(null);
    
    // 创建一个5分钟后的临时闹钟
    const now = new Date();
    const snoozeTime = new Date(now.getTime() + 5 * 60 * 1000);
    const snoozeAlarm: Alarm = {
      id: `snooze-${Date.now()}`,
      hour: snoozeTime.getHours(),
      minute: snoozeTime.getMinutes(),
      enabled: true,
      repeat: 'once',
      label: '稍后提醒',
    };
    
    const updatedAlarms = [...alarms, snoozeAlarm];
    setAlarms(updatedAlarms);
    
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
    const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
    const weekday = weekdays[currentDate.getDay()];
    
    return {
      dateStr: `${year}年${month}月${day}日`,
      weekdayStr: weekday
    };
  };

  // 根据天气代码返回图标
  const getWeatherIcon = (code: string) => {
    const iconProps = { 
      className: `w-4 h-4 sm:w-5 sm:h-5 md:w-5 md:h-5 ${theme === 'dark' ? 'text-slate-400' : 'text-gray-600'}` 
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
                  title="倒计时"
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
                  title="秒表"
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
                  title="闹钟"
                >
                  <AlarmClock className="w-5 h-5" />
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
                  title={mode === 'alarm' ? '添加闹钟' : '自定义时间'}
                >
                  <Settings className={`w-5 h-5 ${theme === 'dark' ? 'text-white' : 'text-black'}`} />
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setNotificationEnabled(!notificationEnabled)}
                  className={`p-2 ${theme === 'dark' ? 'bg-white/10 hover:bg-white/20' : 'bg-black/10 hover:bg-black/20'} rounded-lg transition-colors`}
                  title={notificationEnabled ? '关闭桌面通知' : '开启桌面通知'}
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
                  title={soundEnabled ? '关闭声音' : '开启声音'}
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
                  title={theme === 'dark' ? '切换到明亮模式' : '切换到夜间模式'}
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
                  title="设置"
                >
                  <Settings className={`w-5 h-5 ${theme === 'dark' ? 'text-white' : 'text-black'}`} />
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={toggleFullscreen}
                  className={`p-2 ${theme === 'dark' ? 'bg-white/10 hover:bg-white/20' : 'bg-black/10 hover:bg-black/20'} rounded-lg transition-colors`}
                  title="全屏模式"
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
                  title="倒计时"
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
                  title="秒表"
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
                  title="闹钟"
                >
                  <AlarmClock className="w-7 h-7" />
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
                  title={soundEnabled ? '关闭声音' : '开启声音'}
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
                  title="退出全屏"
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
                      {showWeatherIcon && getWeatherIcon(weather.icon)}
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

          {/* Time Display or Alarm List */}
          {mode !== 'alarm' ? (
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
                  时间到！
                </motion.div>
              )}
            </div>
          ) : (
            /* 闹钟列表 */
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
                    暂无闹钟，点击下方按钮添加
                  </div>
                ) : (
                  alarms.map((alarm) => (
                    <motion.div
                      key={alarm.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      className={`py-6 px-4 rounded-[8px] flex items-start justify-between overflow-hidden no-horizontal-scroll ${
                        theme === 'dark' 
                          ? 'bg-white/5 hover:bg-white/10' 
                          : 'bg-gray-800/5 hover:bg-gray-800/10'
                      } transition-colors ${alarm.id === ringingAlarmId ? 'ring-2 ring-red-500 animate-pulse' : ''}`}
                      style={{ width: '100%', maxWidth: '100%', boxSizing: 'border-box' }}
                    >
                      <div className="flex items-start gap-4" style={{ flex: '1 1 0', minWidth: 0, overflow: 'hidden' }}>
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
                        <div className="flex flex-col gap-2" style={{ flex: '1 1 0', minWidth: 0, overflow: 'hidden' }}>
                          <div 
                            className="flex items-center gap-3 cursor-pointer" 
                            onClick={() => editAlarm(alarm)}
                            style={{ overflow: 'hidden' }}
                          >
                            <div className={`text-3xl font-bold flex-shrink-0 ${theme === 'dark' ? 'text-white hover:text-blue-400' : 'text-gray-900 hover:text-blue-600'} transition-colors`}>
                              {String(alarm.hour).padStart(2, '0')}:{String(alarm.minute).padStart(2, '0')}
                            </div>
                            <div className={`text-sm flex-shrink-0 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                              {
                                alarm.repeat === 'once' ? '单次' :
                                alarm.repeat === 'daily' ? '每天' :
                                alarm.repeat === 'weekdays' ? '工作日' :
                                '周末'
                              }
                            </div>
                          </div>
                          {alarm.label && (
                            <div 
                              className={`text-sm cursor-pointer transition-all ${theme === 'dark' ? 'text-gray-400 hover:text-gray-300' : 'text-gray-600 hover:text-gray-700'}`}
                              style={{ 
                                overflow: expandedAlarmId === alarm.id ? 'visible' : 'hidden',
                                textOverflow: expandedAlarmId === alarm.id ? 'clip' : 'ellipsis',
                                whiteSpace: expandedAlarmId === alarm.id ? 'normal' : 'nowrap',
                                wordBreak: expandedAlarmId === alarm.id ? 'break-word' : 'normal',
                                overflowWrap: expandedAlarmId === alarm.id ? 'break-word' : 'normal'
                              }}
                              onClick={(e) => {
                                e.stopPropagation();
                                setExpandedAlarmId(expandedAlarmId === alarm.id ? null : alarm.id);
                              }}
                              title={expandedAlarmId === alarm.id ? '点击收起' : '点击展开'}
                            >
                              {alarm.label}
                            </div>
                          )}
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
                <span className="font-medium">添加闹钟</span>
              </motion.button>

              {/* 快捷设置按钮 - 仅在闹钟模式下显示 */}
              <div className="mt-8">
                <p className={`text-xs sm:text-sm ${theme === 'dark' ? 'text-slate-400' : 'text-gray-600'} mb-3 sm:mb-4 text-center`}>
                  快捷设置
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { label: '1分钟', seconds: 60 },
                    { label: '3分钟', seconds: 180 },
                    { label: '5分钟', seconds: 300 },
                    { label: '15分钟', seconds: 900 },
                    { label: '30分钟', seconds: 1800 },
                    { label: '1小时', seconds: 3600 },
                  ].map((preset) => (
                    <motion.button
                      key={preset.seconds}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => {
                        // 计算当前时间加上指定秒数后的时间
                        const now = new Date();
                        const futureTime = new Date(now.getTime() + preset.seconds * 1000);
                        const hour = futureTime.getHours();
                        const minute = futureTime.getMinutes();
                        
                        // 检查是否已存在相同时间的闹钟
                        const existingAlarm = alarms.find(
                          alarm => alarm.hour === hour && alarm.minute === minute && alarm.repeat === 'once'
                        );
                        
                        if (existingAlarm) {
                          // 如果已存在，显示提示信息
                          toast.info('该时间的闹钟已存在', {
                            description: `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')} 的闹钟已设置`,
                            duration: 2000,
                          });
                          return;
                        }
                        
                        // 创建新闹钟
                        const newAlarm: Alarm = {
                          id: Date.now().toString(),
                          hour: hour,
                          minute: minute,
                          enabled: true,
                          repeat: 'once',
                          label: preset.label,
                        };
                        
                        const updatedAlarms = [...alarms, newAlarm];
                        setAlarms(updatedAlarms);
                        
                        // 保存到 localStorage
                        if (typeof window !== 'undefined') {
                          localStorage.setItem('timer-alarms', JSON.stringify(updatedAlarms));
                        }
                        
                        // 显示成功提示
                        toast.success(`${preset.label}闹钟设置成功`, {
                          description: `将在 ${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')} 提醒您`,
                          duration: 2000,
                        });
                      }}
                      className={`px-4 py-3 rounded-[8px] text-sm font-medium transition-all ${
                        theme === 'dark'
                          ? 'bg-white/10 text-slate-300 hover:bg-white/20'
                          : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      }`}
                    >
                      {preset.label}
                    </motion.button>
                  ))}
                </div>
              </div>
              </div>
            </div>
          )}

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
                    进度
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
                {mode !== 'alarm' && (
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
                          <span>暂停</span>
                        </>
                      ) : (
                        <>
                          <Play className={
                            isFullscreen 
                              ? 'w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7' 
                              : 'w-4 h-4 sm:w-5 sm:h-5'
                          } />
                          <span>开始</span>
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
                      <span>重置</span>
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
                      <span>设置</span>
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
                  <p className={`text-xs sm:text-sm ${theme === 'dark' ? 'text-slate-400' : 'text-gray-600'} mb-3 sm:mb-4 text-center`}>快捷设置</p>
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
                        {preset.label}
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
                  {mode === 'timer' ? '自定义倒计时' : '设置秒表时间'}
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
                    分钟
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
                    秒
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
                  取消
                </button>
                <button
                  onClick={applyCustomTime}
                  className="flex-1 px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-semibold transition-colors"
                >
                  确定
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
                  {editingAlarmId ? '编辑闹钟' : '添加闹钟'}
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
                      小时
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
                      分钟
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
                    标签（可选）
                  </label>
                  <input
                    type="text"
                    value={newAlarmLabel}
                    onChange={(e) => setNewAlarmLabel(e.target.value)}
                    placeholder="例如：起床、运动"
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
                    重复
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { value: 'once', label: '单次' },
                      { value: 'daily', label: '每天' },
                      { value: 'weekdays', label: '工作日' },
                      { value: 'weekends', label: '周末' },
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
                        {option.label}
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
                  取消
                </button>
                <button
                  onClick={addAlarm}
                  className="flex-1 px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-[8px] transition-colors"
                  style={{
                    fontSize: '16px',
                    fontWeight: '500'
                  }}
                >
                  确定
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
              
              <div 
                className="text-lg sm:text-xl md:text-2xl text-white/90 w-full px-4 sm:px-5 md:px-6 py-4 sm:py-5 md:py-6 mb-6 sm:mb-8 md:mb-12 text-center break-words overflow-hidden"
                style={{ 
                  wordWrap: 'break-word', 
                  overflowWrap: 'break-word'
                }}
              >
                {ringingAlarm?.label || '时间到了'}
              </div>
              
              <button
                onClick={snoozeAlarm}
                className="w-full py-3 sm:py-3.5 md:py-4 bg-white text-red-500 rounded-[12px] font-black text-lg sm:text-xl hover:bg-white hover:shadow-2xl transition-all duration-300 hover:scale-105"
                style={{ letterSpacing: '0.1em', fontWeight: '950' }}
              >
                5分钟后提醒
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
                <h3 className={`text-xl font-bold ${theme === 'dark' ? 'text-white' : 'text-black'}`}>设置</h3>
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
                  主题颜色
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
                      title={color.name}
                    />
                  ))}
                </div>
              </div>

              {/* 提示音选择 */}
              <div className="mb-6">
                <label className={`block text-sm font-medium ${theme === 'dark' ? 'text-slate-300' : 'text-gray-700'} mb-3`}>
                  提示音
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
                      {sound.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* 显示控制开关组 */}
              <div className="space-y-4">
                {/* 进度环开关 */}
                <div className="flex items-center justify-between">
                  <label className={`text-sm font-medium ${theme === 'dark' ? 'text-slate-300' : 'text-gray-700'}`}>
                    显示进度条
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
                    显示天气图标
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
                    显示气温
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
                    显示日期
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
                    显示周几
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
    </div>
  );
}
