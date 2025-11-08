"use client";

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { getWeatherIcon } from '@/lib/weather-utils';

/**
 * 天气数据类型
 */
export interface WeatherData {
  icon?: string;
  temp?: number;
}

/**
 * WeatherDateDisplay 组件的 Props 接口
 */
export interface WeatherDateDisplayProps {
  /** 天气数据 */
  weather: WeatherData | null;
  /** 当前主题 ('dark' | 'light') */
  theme: string | undefined;
  /** 是否显示天气图标 */
  showWeatherIcon: boolean;
  /** 是否显示温度 */
  showTemperature: boolean;
  /** 是否显示日期 */
  showDate: boolean;
  /** 是否显示星期 */
  showWeekday: boolean;
  /** 当前日期对象 */
  currentDate: Date;
  /** 当前语言环境 */
  locale: string;
  /** 翻译函数 */
  t: (key: string) => string;
  /** 是否处于全屏模式 */
  isFullscreen?: boolean;
  /** 自定义样式类名 */
  className?: string;
}

/**
 * WeatherDateDisplay 组件
 * 
 * 显示天气图标、温度和日期信息的组件
 * 
 * @param props - 组件属性
 * @returns 天气和日期显示 UI
 */
export default function WeatherDateDisplay({
  weather,
  theme,
  showWeatherIcon,
  showTemperature,
  showDate,
  showWeekday,
  currentDate,
  locale,
  t,
  isFullscreen = false,
  className = '',
}: WeatherDateDisplayProps) {
  // 使用 mounted 状态来避免服务器端和客户端渲染不一致
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
  }, []);
  
  // 如果处于全屏模式，不显示
  if (isFullscreen) {
    return null;
  }
  
  // 在客户端挂载前，使用默认主题以避免水合错误
  const resolvedTheme = mounted ? theme : 'dark';

  /**
   * 格式化日期
   * 
   * @returns 格式化后的日期字符串和星期字符串
   */
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
    
    const dateStr = locale === 'zh' 
      ? `${year}年${month}月${day}日`
      : `${month}/${day}/${year}`;
    
    return { dateStr, weekdayStr: weekday };
  };

  return (
    <div className={`w-full flex justify-center mb-4 sm:mb-6 md:mb-8 ${className}`}>
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
                  {getWeatherIcon(weather.icon, resolvedTheme || 'dark')}
                </div>
              )}
              {showTemperature && weather.temp !== undefined && (
                <span className={`text-sm sm:text-base md:text-lg font-medium ${resolvedTheme === 'dark' ? 'text-slate-300' : 'text-gray-700'}`}>
                  {weather.temp}°C
                </span>
              )}
            </>
          ) : (
            <span className="w-4 h-4 sm:w-5 sm:h-5"></span>
          )}
        </div>
        
        {/* 右侧：日期 */}
        <div className={`flex items-center gap-1 text-sm sm:text-base md:text-lg font-normal ${resolvedTheme === 'dark' ? 'text-slate-400' : 'text-gray-600'}`}
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
  );
}

