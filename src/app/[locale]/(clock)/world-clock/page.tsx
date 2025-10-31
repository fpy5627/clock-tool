"use client";

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, RotateCcw, Maximize, Volume2, VolumeX, Settings, X, Timer, Clock, Sun, Moon, Bell, BellOff, Cloud, CloudRain, CloudSnow, CloudDrizzle, Cloudy, AlarmClock, Plus, Trash2, Globe, MapPin, Search, Languages } from 'lucide-react';
import { toast } from 'sonner';
import { useTranslations, useLocale } from 'next-intl';
import { useParams, usePathname, useRouter } from 'next/navigation';
import { localeNames } from '@/i18n/locale';
import { useTheme } from 'next-themes';

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
  { id: 'cyan', key: 'cyan', color: '#06b6d4' },
  { id: 'red', key: 'red', color: '#dc2626' },
  { id: 'magenta', key: 'magenta', color: '#d946ef' },
  { id: 'indigo', key: 'indigo', color: '#6366f1' },
  { id: 'yellow', key: 'yellow', color: '#eab308' },
  { id: 'lime', key: 'lime', color: '#84cc16' },
  { id: 'teal', key: 'teal', color: '#14b8a6' },
  { id: 'white', key: 'white', color: '#ffffff' },
  { id: 'black', key: 'black', color: '#000000' },
  // 渐变色 - gradient用于数字和进度条显示，color用于其他元素
  { id: 'sunset', key: 'sunset', color: '#ff6b6b', gradient: 'linear-gradient(135deg, #ff6b6b 0%, #ee5a6f 50%, #c44569 100%)' },
  { id: 'ocean', key: 'ocean', color: '#667eea', gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' },
  { id: 'forest', key: 'forest', color: '#0ba360', gradient: 'linear-gradient(135deg, #0ba360 0%, #3cba92 100%)' },
  { id: 'aurora', key: 'aurora', color: '#00c6ff', gradient: 'linear-gradient(135deg, #00c6ff 0%, #0072ff 100%)' },
  { id: 'fire', key: 'fire', color: '#f83600', gradient: 'linear-gradient(135deg, #f83600 0%, #f9d423 100%)' },
  { id: 'candy', key: 'candy', color: '#a8edea', gradient: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)' },
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
  const params = useParams();
  const router = useRouter();
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  
  // 固定模式为 worldclock
  const mode = 'worldclock' as const;
  
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
  const [selectedSound, setSelectedSound] = useState('bell');
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
  
  // 背景自定义
  const [backgroundType, setBackgroundType] = useState<'default' | 'color' | 'image'>('default');
  const [backgroundColor, setBackgroundColor] = useState('#1e293b'); // 默认深色背景
  const [backgroundImage, setBackgroundImage] = useState<string>('');
  const [imageOverlayOpacity, setImageOverlayOpacity] = useState(40); // 图片遮罩不透明度（0-100，数值越大遮罩越重）
  const [imagePositionX, setImagePositionX] = useState(50); // 图片水平位置 (0-100)
  const [imagePositionY, setImagePositionY] = useState(50); // 图片垂直位置 (0-100)
  
  // 背景确认对话框
  const [showBackgroundConfirm, setShowBackgroundConfirm] = useState(false);
  const [pendingBackgroundImage, setPendingBackgroundImage] = useState<string>('');
  const [applyToAllPages, setApplyToAllPages] = useState(true); // 是否应用到所有功能页面
  
  // 纯色背景确认对话框
  const [showColorBackgroundConfirm, setShowColorBackgroundConfirm] = useState(false);
  const [pendingBackgroundColor, setPendingBackgroundColor] = useState<string>('');
  const [applyColorToAllPages, setApplyColorToAllPages] = useState(true); // 是否应用到所有功能页面
  
  // 上传图片历史记录
  const [uploadedImageHistory, setUploadedImageHistory] = useState<string[]>([]);
  
  // 防止状态检测逻辑干扰的标志
  const [isSettingFromHistory, setIsSettingFromHistory] = useState(false);
  
  // 跟踪用户是否手动设置了主题（用于覆盖自动主题设置）
  const [userManuallySetTheme, setUserManuallySetTheme] = useState(false);
  
  // 显示控制状态
  const [showWeatherIcon, setShowWeatherIcon] = useState(true);
  const [showTemperature, setShowTemperature] = useState(true);
  const [showDate, setShowDate] = useState(true);
  const [showWeekday, setShowWeekday] = useState(true);
  
  // 天气相关状态 - 初始化为默认值，确保始终有数据显示
  const [weather, setWeather] = useState<{
    temp: number;
    condition: string;
    icon: string;
  } | null>({
    temp: 21,
    condition: 'Partly cloudy',
    icon: '116'
  });
  
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
  
  // 倒计时结束弹窗
  const [showTimerEndModal, setShowTimerEndModal] = useState(false);
  const [timerOvertime, setTimerOvertime] = useState(0); // 超时计时（秒）
  
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const hideControlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isHoveringControls = useRef(false);
  const alarmCheckIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastToastRef = useRef<{ id: string; time: number } | null>(null);
  const lastClickRef = useRef<{ action: string; time: number } | null>(null);
  const currentRingingAlarmRef = useRef<string | null>(null);
  const alarmRingStartTimeRef = useRef<number | null>(null);
  const overtimeIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const colorInitializedRef = useRef(false); // 跟踪颜色是否已初始化
  const lastBackgroundColorRef = useRef<string>(''); // 跟踪上一次的背景颜色

  // 添加上传图片到历史记录
  const addToImageHistory = (imageDataUrl: string) => {
    setUploadedImageHistory(prev => {
      // 如果图片已存在，先移除
      const filtered = prev.filter(img => img !== imageDataUrl);
      // 添加到开头，限制最多保存10张图片
      const newHistory = [imageDataUrl, ...filtered].slice(0, 10);
      // 保存到localStorage
      localStorage.setItem('timer-uploaded-image-history', JSON.stringify(newHistory));
      return newHistory;
    });
  };

  // 从历史记录中移除图片
  const removeFromImageHistory = (imageDataUrl: string) => {
    setUploadedImageHistory(prev => {
      const newHistory = prev.filter(img => img !== imageDataUrl);
      localStorage.setItem('timer-uploaded-image-history', JSON.stringify(newHistory));
      return newHistory;
    });
  };
  const isLightColor = (color: string): boolean => {
    // 将十六进制颜色转换为RGB
    const hex = color.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    
    // 使用感知亮度公式
    const brightness = (r * 299 + g * 587 + b * 114) / 1000;
    return brightness > 155; // 大于155认为是浅色
  };

  // 压缩和缩放图片
  const compressAndResizeImage = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          // 获取屏幕尺寸，设置最大宽高为屏幕的2倍（适配高清屏）
          const maxWidth = window.innerWidth * 2;
          const maxHeight = window.innerHeight * 2;
          
          let width = img.width;
          let height = img.height;
          
          // 计算缩放比例，保持宽高比
          if (width > maxWidth || height > maxHeight) {
            const ratio = Math.min(maxWidth / width, maxHeight / height);
            width = width * ratio;
            height = height * ratio;
          }
          
          // 创建canvas进行压缩
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            reject(new Error('无法创建canvas上下文'));
            return;
          }
          
          // 使用高质量缩放
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';
          ctx.drawImage(img, 0, 0, width, height);
          
          // 转换为base64，质量设置为0.9（90%质量）
          const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.9);
          resolve(compressedDataUrl);
        };
        img.onerror = () => {
          reject(new Error('Image loading failed'));
        };
        img.src = e.target?.result as string;
      };
      reader.onerror = () => {
        reject(new Error('File reading failed'));
      };
      reader.readAsDataURL(file);
    });
  };

  // 分析图片亮度
  const analyzeImageBrightness = (imageDataUrl: string): Promise<boolean> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(false);
          return;
        }

        // 缩小图片以加快分析速度
        const size = 50;
        canvas.width = size;
        canvas.height = size;
        ctx.drawImage(img, 0, 0, size, size);

        const imageData = ctx.getImageData(0, 0, size, size);
        const data = imageData.data;
        let totalBrightness = 0;

        // 计算所有像素的平均亮度
        for (let i = 0; i < data.length; i += 4) {
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];
          const brightness = (r * 299 + g * 587 + b * 114) / 1000;
          totalBrightness += brightness;
        }

        const avgBrightness = totalBrightness / (size * size);
        // 平均亮度大于128认为是浅色图片
        const isLight = avgBrightness > 128;
        console.log('Image brightness analysis:', {
          avgBrightness: avgBrightness.toFixed(2),
          threshold: 128,
          isLight: isLight,
          result: isLight ? 'Light image' : 'Dark image'
        });
        resolve(isLight);
      };
      img.onerror = () => {
        resolve(false);
      };
      img.src = imageDataUrl;
    });
  };

  // 监听背景颜色变化，自动切换主题
  useEffect(() => {
    // 只有在背景颜色真正改变且是颜色模式时才处理
    if (backgroundType === 'color' && backgroundColor && backgroundColor !== lastBackgroundColorRef.current) {
      lastBackgroundColorRef.current = backgroundColor;
      
      const isLight = isLightColor(backgroundColor);
      
      // 浅色背景：使用白天模式（light theme）
      // 深色背景：使用夜晚模式（dark theme）
      const targetTheme = isLight ? 'light' : 'dark';
      
      // 使用 setTimeout 延迟切换，避免状态更新冲突
      const timer = setTimeout(() => {
        setTheme(targetTheme);
      }, 0);
      
      return () => clearTimeout(timer);
    }
    
    // 当切换回默认背景时，重置追踪
    if (backgroundType === 'default') {
      lastBackgroundColorRef.current = '';
    }
  }, [backgroundColor, backgroundType, setTheme]);

  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        if (mode === 'timer') {
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
                playNotificationSound();
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
        } else {
          // 秒表模式
          setStopwatchTime((prev) => prev + 1);
        }
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

  // 全屏功能
  useEffect(() => {
    const handleFullscreenChange = () => {
      const isFullscreenActive = !!(
        document.fullscreenElement || 
        (document as any).webkitFullscreenElement || 
        (document as any).mozFullScreenElement || 
        (document as any).msFullscreenElement
      );
      setIsFullscreen(isFullscreenActive);
    };

    // 监听各种全屏事件
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('mozfullscreenchange', handleFullscreenChange);
    document.addEventListener('MSFullscreenChange', handleFullscreenChange);
    
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
      document.removeEventListener('MSFullscreenChange', handleFullscreenChange);
    };
  }, []);

  // 同步 isFullscreen 状态到 body 类名（用于隐藏 Header 和 Footer）
  useEffect(() => {
    if (isFullscreen) {
      document.body.classList.add('fullscreen-mode');
    } else {
      document.body.classList.remove('fullscreen-mode');
    }
  }, [isFullscreen]);

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
      
      // 加载背景设置
      const savedBackgroundType = localStorage.getItem('timer-background-type');
      
      // 优先加载当前功能页面的背景颜色，如果没有则加载通用背景颜色
      const currentModeBackgroundColor = localStorage.getItem(`timer-background-color-${mode}`);
      const generalBackgroundColor = localStorage.getItem('timer-background-color');
      
      // 如果当前模式有专用背景，使用专用背景；否则使用通用背景；如果都没有，使用默认背景
      let savedBackgroundColor;
      if (currentModeBackgroundColor) {
        savedBackgroundColor = currentModeBackgroundColor;
      } else if (generalBackgroundColor) {
        savedBackgroundColor = generalBackgroundColor;
      } else {
        // 使用默认背景
        savedBackgroundColor = '#1e293b';
      }
      
      // 优先加载当前功能页面的背景图片，如果没有则加载通用背景图片
      const currentModeBackgroundImage = localStorage.getItem(`timer-background-image-${mode}`);
      const generalBackgroundImage = localStorage.getItem('timer-background-image');
      
      // 如果当前模式有专用背景，使用专用背景；否则使用通用背景；如果都没有，清空背景
      let savedBackgroundImage;
      if (currentModeBackgroundImage) {
        savedBackgroundImage = currentModeBackgroundImage;
      } else if (generalBackgroundImage) {
        savedBackgroundImage = generalBackgroundImage;
      } else {
        // 清空背景图片，回到默认背景
        savedBackgroundImage = '';
      }
      
      const savedImagePositionX = localStorage.getItem('timer-image-position-x');
      const savedImagePositionY = localStorage.getItem('timer-image-position-y');
      if (savedBackgroundType) setBackgroundType(savedBackgroundType as 'default' | 'color' | 'image');
      if (savedBackgroundColor) setBackgroundColor(savedBackgroundColor);
      if (savedBackgroundImage) setBackgroundImage(savedBackgroundImage);
      if (savedImagePositionX) setImagePositionX(Number(savedImagePositionX));
      if (savedImagePositionY) setImagePositionY(Number(savedImagePositionY));
      
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

  // 保存设置到 localStorage (theme 由 next-themes 自动管理)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('timer-sound', selectedSound);
      localStorage.setItem('timer-timer-color', timerColor);
      localStorage.setItem('timer-stopwatch-color', stopwatchColor);
      localStorage.setItem('timer-worldclock-color', worldClockColor);
      localStorage.setItem('timer-worldclock-smallcard-color', worldClockSmallCardColor);
      localStorage.setItem('timer-background-type', backgroundType);
      
      // 根据应用范围保存背景颜色
      if (applyColorToAllPages) {
        // 应用到所有功能页面：保存到通用key
        console.log('保存背景颜色到所有功能页面:', backgroundColor);
        localStorage.setItem('timer-background-color', backgroundColor);
      } else {
        // 仅应用到当前功能页面：保存到特定模式的key
        console.log(`保存背景颜色到当前功能页面 (${mode}):`, backgroundColor);
        localStorage.setItem(`timer-background-color-${mode}`, backgroundColor);
      }
      
      // 根据应用范围保存背景图片
      if (applyToAllPages) {
        // 应用到所有功能页面：保存到通用key
        console.log('Saving background image to all pages:', backgroundImage);
        localStorage.setItem('timer-background-image', backgroundImage);
      } else {
        // 仅应用到当前功能页面：保存到特定模式的key
        console.log(`Saving background image to current page (${mode}):`, backgroundImage);
        localStorage.setItem(`timer-background-image-${mode}`, backgroundImage);
      }
      localStorage.setItem('timer-image-position-x', String(imagePositionX));
      localStorage.setItem('timer-image-position-y', String(imagePositionY));
      localStorage.setItem('timer-notification', String(notificationEnabled));
      localStorage.setItem('timer-progress', String(progressVisible));
      localStorage.setItem('timer-show-weather-icon', String(showWeatherIcon));
      localStorage.setItem('timer-show-temperature', String(showTemperature));
      localStorage.setItem('timer-show-date', String(showDate));
      localStorage.setItem('timer-show-weekday', String(showWeekday));
    }
  }, [selectedSound, timerColor, stopwatchColor, worldClockColor, worldClockSmallCardColor, backgroundType, backgroundColor, backgroundImage, applyToAllPages, applyColorToAllPages, imagePositionX, imagePositionY, notificationEnabled, progressVisible, showWeatherIcon, showTemperature, showDate, showWeekday]);

  // 当用户通过其他方式设置背景时，重置为应用到所有页面
  useEffect(() => {
    // 只有在背景类型不是图片模式或者没有背景图片时才重置applyToAllPages
    // 这样可以避免在历史图片点击时被自动重置
    if (backgroundType !== 'image' || backgroundImage === '') {
      setApplyToAllPages(true);
    }
    if (backgroundType !== 'color') {
      setApplyColorToAllPages(true);
    }
  }, [backgroundType]);

  // 检测当前背景的应用状态 - 暂时禁用背景图片检测，避免干扰历史图片设置
  useEffect(() => {
    if (typeof window !== 'undefined' && !isSettingFromHistory) {
      // 检测纯色背景的应用状态
      if (backgroundType === 'color' && backgroundColor) {
        const currentModeBackgroundColor = localStorage.getItem(`timer-background-color-${mode}`);
        const generalBackgroundColor = localStorage.getItem('timer-background-color');
        
        // 如果当前模式有专用背景且与当前背景相同，说明是仅应用到当前页面
        if (currentModeBackgroundColor === backgroundColor && currentModeBackgroundColor !== generalBackgroundColor) {
          setApplyColorToAllPages(false);
        } else {
          setApplyColorToAllPages(true);
        }
      }
      
      // 暂时禁用背景图片的状态检测，避免干扰历史图片设置
      // 背景图片的状态完全由用户操作控制
    }
    
    // 重置标志
    if (isSettingFromHistory) {
      setIsSettingFromHistory(false);
    }
  }, [mode, backgroundType, backgroundColor, isSettingFromHistory]);

  // 当模式切换时，重新加载对应功能页面的背景颜色和图片
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // 检查用户是否手动设置了当前模式的主题
      const userManualTheme = localStorage.getItem(`timer-manual-theme-${mode}`);
      if (userManualTheme) {
        console.log(`Mode switched to ${mode}, applying user manually set theme:`, userManualTheme);
        setTheme(userManualTheme);
      }
      
      // 重新加载背景颜色
      if (backgroundType === 'color') {
        const currentModeBackgroundColor = localStorage.getItem(`timer-background-color-${mode}`);
        const generalBackgroundColor = localStorage.getItem('timer-background-color');
        
        // 如果当前模式有专用背景，使用专用背景；否则使用通用背景；如果都没有，使用默认背景
        let newBackgroundColor;
        if (currentModeBackgroundColor) {
          newBackgroundColor = currentModeBackgroundColor;
        } else if (generalBackgroundColor) {
          newBackgroundColor = generalBackgroundColor;
        } else {
          // 使用默认背景
          newBackgroundColor = theme === 'dark' ? '#1e293b' : '#f8fafc';
        }
        
        if (newBackgroundColor !== backgroundColor) {
          setBackgroundColor(newBackgroundColor);
        }
      }
      
      // 重新加载背景图片
      if (backgroundType === 'image') {
        const currentModeBackgroundImage = localStorage.getItem(`timer-background-image-${mode}`);
        const generalBackgroundImage = localStorage.getItem('timer-background-image');
        
        // 如果当前模式有专用背景，使用专用背景；否则使用通用背景；如果都没有，清空背景
        let newBackgroundImage;
        if (currentModeBackgroundImage) {
          newBackgroundImage = currentModeBackgroundImage;
        } else if (generalBackgroundImage) {
          // 检查是否有其他模式使用了专用背景图片
          const allModes = ['timer', 'stopwatch', 'alarm', 'worldclock'];
          const hasAnyModeSpecificBackground = allModes.some(modeKey => 
            localStorage.getItem(`timer-background-image-${modeKey}`) !== null
          );
          
          // 如果有任何模式使用了专用背景图片，则不使用通用背景图片
          if (hasAnyModeSpecificBackground) {
            newBackgroundImage = '';
          } else {
            newBackgroundImage = generalBackgroundImage;
          }
        } else {
          // 清空背景图片，回到默认背景
          newBackgroundImage = '';
        }
        
        if (newBackgroundImage !== backgroundImage) {
          setBackgroundImage(newBackgroundImage);
        }
      }
    }
  }, [mode, backgroundType, backgroundColor, backgroundImage]);

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

  // 获取天气和位置数据 - 优化加载速度，添加超时处理
  useEffect(() => {
    const fetchWeatherAndLocation = async () => {
      // 创建带超时的fetch函数
      const fetchWithTimeout = (url: string, timeout = 5000) => {
        return Promise.race([
          fetch(url),
          new Promise<Response>((_, reject) =>
            setTimeout(() => reject(new Error('Request timeout')), timeout)
          )
        ]);
      };

      try {
        // 根据当前语言设置API语言参数
        const langMap: Record<string, string> = {
          'zh': 'zh-CN',
          'en': 'en',
        };
        const apiLang = langMap[locale] || 'en';
        
        // 获取IP定位 (使用支持多语言的ip-api.com) - 添加超时
        const locationRes = await fetchWithTimeout(`https://ip-api.com/json/?lang=${apiLang}`, 3000);
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
        
          // 获取天气数据 (使用wttr.in API) - 添加超时，如果失败使用默认值
          try {
            const weatherRes = await fetchWithTimeout(`https://wttr.in/${city || 'Beijing'}?format=j1`, 3000);
            const weatherData = await weatherRes.json();
            
            if (weatherData && weatherData.current_condition && weatherData.current_condition[0]) {
              const current = weatherData.current_condition[0];
              setWeather({
                temp: parseInt(current.temp_C) || 21,
                condition: current.weatherDesc[0]?.value || 'Partly cloudy',
                icon: current.weatherCode || '116'
              });
            }
          } catch (weatherError) {
            // 天气API失败时使用默认值，但保留位置信息
            console.warn('Weather API failed, using default:', weatherError);
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
        
        // 确保使用默认天气（如果还没有设置）
        setWeather(prev => prev || {
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

    // 立即显示默认天气，然后异步加载真实数据
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

  const closeTimerEndModal = () => {
    setShowTimerEndModal(false);
    setTimerOvertime(0);
    // 清除超时计时器
    if (overtimeIntervalRef.current) {
      clearInterval(overtimeIntervalRef.current);
      overtimeIntervalRef.current = null;
    }
  };

  const navigateToPage = (page: string) => {
    const currentLocale = locale || 'en';
    router.push(`/${currentLocale}/${page}`);
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
    // Check if fullscreen API is supported
    if (!document.fullscreenEnabled && !(document as any).webkitFullscreenEnabled) {
      // Use simulated fullscreen when mobile doesn't support fullscreen API
      setIsFullscreen(!isFullscreen);
      return;
    }

    if (!document.fullscreenElement && !(document as any).webkitFullscreenElement) {
      try {
        // 尝试标准全屏API
        if (document.documentElement.requestFullscreen) {
          await document.documentElement.requestFullscreen();
        } else if ((document.documentElement as any).webkitRequestFullscreen) {
          // Safari支持
          await (document.documentElement as any).webkitRequestFullscreen();
        } else if ((document.documentElement as any).mozRequestFullScreen) {
          // Firefox支持
          await (document.documentElement as any).mozRequestFullScreen();
        } else if ((document.documentElement as any).msRequestFullscreen) {
          // IE/Edge支持
          await (document.documentElement as any).msRequestFullscreen();
        }
      } catch (error) {
        console.log('Fullscreen not available, using simulated fullscreen');
        // Use simulated fullscreen if fullscreen API is not available
        setIsFullscreen(!isFullscreen);
      }
    } else {
      try {
        // Exit fullscreen
        if (document.exitFullscreen) {
          await document.exitFullscreen();
        } else if ((document as any).webkitExitFullscreen) {
          await (document as any).webkitExitFullscreen();
        } else if ((document as any).mozCancelFullScreen) {
          await (document as any).mozCancelFullScreen();
        } else if ((document as any).msExitFullscreen) {
          await (document as any).msExitFullscreen();
        }
      } catch (error) {
        console.log('Exit fullscreen failed');
        setIsFullscreen(false);
      }
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
    
    // 根据语言环境选择日期格式
    const dateStr = locale === 'zh' 
      ? `${year}年${month}月${day}日`
      : `${month}/${day}/${year}`;
    
    return {
      dateStr,
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

  // 根据当前模式选择对应的颜色
  const currentColorId = mode === 'timer' ? timerColor : stopwatchColor;
  const themeColor = THEME_COLORS.find(c => c.id === currentColorId) || THEME_COLORS[0];

  return (
    <div 
      className={`${isFullscreen ? 'fixed inset-0 z-50' : 'min-h-screen'} ${
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
      {/* 移动端顶部导航栏 - 只在移动端显示 */}
      {!isFullscreen && (
        <div className={`sm:hidden sticky top-0 left-0 right-0 w-full z-40 ${theme === 'dark' ? 'bg-slate-900/50' : 'bg-white/80'} backdrop-blur-sm border-b ${theme === 'dark' ? 'border-slate-700' : 'border-gray-200'}`}>
          {/* 主要功能按钮 */}
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
            {/* 移动端菜单按钮 */}
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
      <div className="flex-1 flex items-center justify-center relative">
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
                    mode === 'timer' 
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
                    mode === 'alarm' 
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
                    mode === 'worldclock' 
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
                      const allModes = ['timer', 'stopwatch', 'alarm', 'worldclock'];
                      
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
                        const allModes = ['timer', 'stopwatch', 'alarm', 'worldclock'];
                        
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
                  onClick={() => navigateToPage('countdown')}
                  className={`p-1.5 sm:p-4 rounded-md sm:rounded-xl transition-all backdrop-blur-md shadow-2xl ${
                    mode === 'timer' 
                      ? 'bg-blue-500 text-white shadow-blue-500/50' 
                      : 'bg-black/40 hover:bg-black/60 text-white border border-white/20'
                  }`}
                  title={t('modes.timer')}
                >
                  <Timer className="w-4 h-4 sm:w-7 sm:h-7" />
                </motion.button>
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
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => navigateToPage('alarm')}
                  className={`p-1.5 sm:p-4 rounded-md sm:rounded-xl transition-all backdrop-blur-md shadow-2xl ${
                    mode === 'alarm' 
                      ? 'bg-blue-500 text-white shadow-blue-500/50' 
                      : 'bg-black/40 hover:bg-black/60 text-white border border-white/20'
                  }`}
                  title={t('modes.alarm')}
                >
                  <AlarmClock className="w-4 h-4 sm:w-7 sm:h-7" />
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => navigateToPage('world-clock')}
                  className={`p-1.5 sm:p-4 rounded-md sm:rounded-xl transition-all backdrop-blur-md shadow-2xl ${
                    mode === 'worldclock' 
                      ? 'bg-blue-500 text-white shadow-blue-500/50' 
                      : 'bg-black/40 hover:bg-black/60 text-white border border-white/20'
                  }`}
                  title={t('modes.worldclock')}
                >
                  <Globe className="w-4 h-4 sm:w-7 sm:h-7" />
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
          className={`w-full flex flex-col items-center ${!isFullscreen ? 'justify-center' : 'pt-12 sm:pt-20'}`}
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
            <div className={`text-center w-full flex items-center justify-center px-2 sm:px-4 ${
              isFullscreen ? 'flex-1' : ''
            }`}>
              <div 
                id="timer-display"
                className={`${
                  (() => {
                    const time = mode === 'timer' ? formatTime(timeLeft) : formatTime(stopwatchTime);
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
                  const time = mode === 'timer' ? formatTime(timeLeft) : formatTime(stopwatchTime);
                  
                  // 检查是否使用渐变色
                  const hasGradient = themeColor.gradient && (
                    mode === 'stopwatch' || 
                    (mode === 'timer' && timeLeft > 60)
                  );
                  
                  // 计算当前应该使用的颜色
                  const currentColor = mode === 'timer' 
                    ? (timeLeft === 0 
                        ? '#22c55e'
                        : timeLeft < 60 
                        ? '#ef4444'
                        : themeColor.color)
                    : themeColor.color;
                  
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
                  时间到
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
                        {(() => {
                          const now = new Date();
                          const userTime = new Date(now.toLocaleString('en-US', { timeZone: displayCity.timezone }));
                          const hours = String(userTime.getHours()).padStart(2, '0');
                          const minutes = String(userTime.getMinutes()).padStart(2, '0');
                          const seconds = String(userTime.getSeconds()).padStart(2, '0');
                          
                          const worldClockThemeColor = THEME_COLORS.find(c => c.id === worldClockColor) || THEME_COLORS[0];
                          
                          return (
                        <div 
                          className="text-7xl sm:text-8xl md:text-9xl lg:text-[10rem] xl:text-[11rem] font-bold text-center mb-8"
                          style={{
                            fontFamily: '"Rajdhani", sans-serif',
                            fontWeight: '700',
                            letterSpacing: '0.02em',
                                color: worldClockThemeColor.gradient ? undefined : worldClockThemeColor.color,
                          }}
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
                          minWidth: '280px',
                          maxWidth: 'min(1400px, 95vw)',
                          gap: '16px',
                          padding: '0 8px'
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
                        className={`p-3 sm:p-4 rounded-xl transition-all cursor-pointer ${
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
                        
                        <div className={`text-3xl sm:text-4xl font-bold mb-4 text-center`}
                          style={{
                            fontFamily: '"Rajdhani", sans-serif',
                            letterSpacing: '0.05em',
                            color: (() => {
                              const smallCardThemeColor = THEME_COLORS.find(c => c.id === worldClockSmallCardColor) || THEME_COLORS[0];
                              return smallCardThemeColor.gradient ? smallCardThemeColor.color : smallCardThemeColor.color;
                            })(),
                          }}
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
                        className={`p-3 sm:p-4 rounded-xl transition-all cursor-pointer relative ${
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
                        
                        <div className={`text-3xl sm:text-4xl font-bold mb-4 text-center`}
                          style={{
                            fontFamily: '"Rajdhani", sans-serif',
                            letterSpacing: '0.05em',
                            color: (() => {
                              const smallCardThemeColor = THEME_COLORS.find(c => c.id === worldClockSmallCardColor) || THEME_COLORS[0];
                              return smallCardThemeColor.gradient ? smallCardThemeColor.color : smallCardThemeColor.color;
                            })(),
                          }}
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
                {(mode === 'timer' || mode === 'stopwatch') && (
                  <>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={toggleTimer}
                      disabled={mode === 'timer' && timeLeft === 0}
                      className={`flex items-center gap-1 sm:gap-2 ${
                        isFullscreen 
                          ? 'px-4 py-2 sm:px-8 sm:py-4 md:px-10 md:py-5 lg:px-12 lg:py-6 text-sm sm:text-lg md:text-xl' 
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
                        const currentSeconds = mode === 'timer' ? timeLeft : stopwatchTime;
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
                    const currentColor = mode === 'timer' ? timerColor : mode === 'stopwatch' ? stopwatchColor : worldClockColor;
                    const isDefault = currentColor === defaultColor;
                    
                    return (
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          // 根据当前主题设置对应的默认颜色：白天模式为黑色，夜晚模式为白色
                          const defaultColorToSet = theme === 'dark' ? 'white' : 'black';
                          if (mode === 'timer') {
                            setTimerColor(defaultColorToSet);
                          } else if (mode === 'stopwatch') {
                            setStopwatchColor(defaultColorToSet);
                          } else if (mode === 'worldclock') {
                            // 世界时间模式下，弹出确认对话框
                            setPendingWorldClockColor(defaultColorToSet);
                            setShowWorldClockColorConfirm(true);
                          }
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
                    const isSelectedPrimary = (mode === 'timer' ? timerColor : mode === 'stopwatch' ? stopwatchColor : worldClockColor) === color.id;
                    // 世界时间模式下，检查小卡片是否使用此颜色
                    const isSelectedSecondary = mode === 'worldclock' && worldClockSmallCardColor === color.id && worldClockColor !== worldClockSmallCardColor;
                    
                    return (
                    <button
                      key={color.id}
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          if (!isDisabled) {
                            // 根据当前模式设置对应的颜色
                            if (mode === 'timer') {
                              setTimerColor(color.id);
                            } else if (mode === 'stopwatch') {
                              setStopwatchColor(color.id);
                            } else if (mode === 'worldclock') {
                              // 世界时间模式下，弹出确认对话框
                              setPendingWorldClockColor(color.id);
                              setShowWorldClockColorConfirm(true);
                            }
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
                    const isSelectedPrimary = (mode === 'timer' ? timerColor : mode === 'stopwatch' ? stopwatchColor : worldClockColor) === color.id;
                    // 世界时间模式下，检查小卡片是否使用此颜色
                    const isSelectedSecondary = mode === 'worldclock' && worldClockSmallCardColor === color.id && worldClockColor !== worldClockSmallCardColor;
                    
                    return (
                      <button
                        key={color.id}
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          if (!isDisabled) {
                            // 根据当前模式设置对应的颜色
                            if (mode === 'timer') {
                              setTimerColor(color.id);
                            } else if (mode === 'stopwatch') {
                              setStopwatchColor(color.id);
                            } else if (mode === 'worldclock') {
                              // 世界时间模式下，弹出确认对话框
                              setPendingWorldClockColor(color.id);
                              setShowWorldClockColorConfirm(true);
                            }
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
                    const isSelectedPrimary = (mode === 'timer' ? timerColor : mode === 'stopwatch' ? stopwatchColor : worldClockColor) === color.id;
                    // 世界时间模式下，检查小卡片是否使用此颜色
                    const isSelectedSecondary = mode === 'worldclock' && worldClockSmallCardColor === color.id && worldClockColor !== worldClockSmallCardColor;
                    
                    return (
                      <button
                        key={color.id}
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          if (!isDisabled) {
                            // 根据当前模式设置对应的颜色
                            if (mode === 'timer') {
                              setTimerColor(color.id);
                            } else if (mode === 'stopwatch') {
                              setStopwatchColor(color.id);
                            } else if (mode === 'worldclock') {
                              // 世界时间模式下，弹出确认对话框
                              setPendingWorldClockColor(color.id);
                              setShowWorldClockColorConfirm(true);
                            }
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
                                  removeFromImageHistory(imageUrl);
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
                                  addToImageHistory(compressedImageUrl);
                                  
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
                                  addToImageHistory(compressedImageUrl);
                                  
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
                      只在{mode === 'timer' ? '计时器' : mode === 'stopwatch' ? '秒表' : mode === 'alarm' ? '闹钟' : '世界时间'}页面使用此背景
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
                    const allModes = ['timer', 'stopwatch', 'alarm', 'worldclock'];
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
                    const allModes = ['timer', 'stopwatch', 'alarm', 'worldclock'];
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
      </div>
    </div>
  );
}
