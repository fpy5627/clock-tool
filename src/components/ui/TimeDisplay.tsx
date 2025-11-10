"use client";

import { motion } from 'framer-motion';
import { ReactNode } from 'react';

/**
 * 格式化时间结果接口
 */
export interface FormattedTime {
  /** 小时数（字符串，两位数字） */
  hours: string | null;
  /** 分钟数（字符串，两位数字） */
  mins: string;
  /** 秒数（字符串，两位数字） */
  secs: string;
  /** 是否包含小时 */
  hasHours: boolean;
}

/**
 * 格式化时间函数
 * 
 * @param seconds - 总秒数
 * @param mode - 模式（stopwatch模式始终显示小时）
 * @returns 格式化后的时间对象
 */
export function formatTime(seconds: number, mode?: 'stopwatch' | 'timer'): FormattedTime {
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
}

/**
 * TimeDisplay 组件的 Props 接口
 */
export interface TimeDisplayProps {
  /** 总秒数 */
  seconds: number;
  /** 模式（stopwatch模式始终显示小时） */
  mode?: 'stopwatch' | 'timer';
  /** 是否处于全屏模式 */
  isFullscreen: boolean;
  /** 主题颜色对象 */
  themeColor: {
    id: string;
    color: string;
    gradient?: string;
  };
  /** 是否使用渐变色 */
  useGradient?: boolean;
  /** 自定义颜色（覆盖主题颜色） */
  customColor?: string;
  /** 倒计时结束时的文本（可选） */
  timeUpText?: string;
  /** 是否显示倒计时结束文本 */
  showTimeUpText?: boolean;
  /** 自定义类名 */
  className?: string;
  /** 自定义样式 */
  style?: React.CSSProperties;
  /** 对齐方式（left | center） */
  align?: 'left' | 'center';
}

/**
 * TimeDisplay 组件
 * 
 * 统一的时间显示组件，用于显示倒计时或秒表时间
 * 
 * @param seconds - 总秒数
 * @param mode - 模式（stopwatch模式始终显示小时）
 * @param isFullscreen - 是否处于全屏模式
 * @param themeColor - 主题颜色对象
 * @param useGradient - 是否使用渐变色
 * @param customColor - 自定义颜色（覆盖主题颜色）
 * @param timeUpText - 倒计时结束时的文本
 * @param showTimeUpText - 是否显示倒计时结束文本
 * @param className - 自定义类名
 * @param style - 自定义样式
 */
export default function TimeDisplay({
  seconds,
  mode = 'timer',
  isFullscreen,
  themeColor,
  useGradient = false,
  customColor,
  timeUpText,
  showTimeUpText = false,
  className = '',
  style,
  align = 'center',
}: TimeDisplayProps) {
  const time = formatTime(seconds, mode);
  
  // 检查是否使用渐变色
  const hasGradient = themeColor.gradient && useGradient;
  
  // 计算当前应该使用的颜色
  const currentColor = customColor || themeColor.color;
  
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
  
  // 根据是否有小时调整字体大小
  // 全屏模式下使用 clamp() 确保数字不会被遮挡
  const fontSizeStyle = isFullscreen
    ? time.hasHours 
      ? { fontSize: 'clamp(3rem, 12vw, 24rem)' } // 移动端最小3rem，确保完整显示
      : { fontSize: 'clamp(4rem, 18vw, 32rem)' }
    : time.hasHours
    ? { fontSize: 'clamp(4rem, 8vw, 13.5rem)' }
    : { fontSize: 'clamp(6rem, 10vw, 17rem)' };

  const fontSizeClass = isFullscreen
    ? '' // 全屏模式下使用内联样式
    : time.hasHours
    ? 'text-[4rem] xs:text-[5.5rem] sm:text-[7.5rem] md:text-[9.5rem] lg:text-[11.5rem] xl:text-[13.5rem]'
    : 'text-[6rem] xs:text-[8rem] sm:text-[10rem] md:text-[13rem] lg:text-[15rem] xl:text-[17rem]';

  return (
    <div 
      className={`w-full flex flex-col ${align === 'left' ? 'items-start' : 'items-center'} ${align === 'left' ? 'justify-start' : 'justify-center'} ${isFullscreen ? 'px-2 sm:px-4' : 'px-2 sm:px-4'} ${
        isFullscreen ? 'flex-1 min-h-0' : 'min-h-[25vh] sm:min-h-[50vh]'
      } ${className}`}
      style={style}
    >
      <div 
        id="timer-display"
        className={`${fontSizeClass} leading-none flex items-center ${align === 'left' ? 'justify-start' : 'justify-center'} whitespace-nowrap ${align === 'left' ? 'mx-0' : 'mx-auto'} ${isFullscreen ? 'overflow-visible' : ''}`}
        style={{
          fontFamily: '"Rajdhani", sans-serif',
          fontWeight: '580',
          letterSpacing: '0.05em',
          WebkitFontSmoothing: 'antialiased',
          MozOsxFontSmoothing: 'grayscale',
          ...(isFullscreen ? fontSizeStyle : {}),
          ...style,
        }}
      >
        {time.hasHours && (
          <>
            <span style={numberStyle}>{time.hours}</span>
            <span className="inline-flex flex-col justify-center gap-[0.2em] mx-[0.15em]">
              <span 
                className="w-[0.15em] h-[0.15em] rounded-sm" 
                style={{ backgroundColor: hasGradient ? themeColor.color : currentColor }}
              />
              <span 
                className="w-[0.15em] h-[0.15em] rounded-sm" 
                style={{ backgroundColor: hasGradient ? themeColor.color : currentColor }}
              />
            </span>
          </>
        )}
        <span style={numberStyle}>{time.mins}</span>
        <span className="inline-flex flex-col justify-center gap-[0.2em] mx-[0.15em]">
          <span 
            className="w-[0.15em] h-[0.15em] rounded-sm" 
            style={{ backgroundColor: hasGradient ? themeColor.color : currentColor }}
          />
          <span 
            className="w-[0.15em] h-[0.15em] rounded-sm" 
            style={{ backgroundColor: hasGradient ? themeColor.color : currentColor }}
          />
        </span>
        <span style={numberStyle}>{time.secs}</span>
      </div>
      {showTimeUpText && timeUpText && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`font-semibold mt-4 sm:mt-6 md:mt-8 text-green-500 text-center w-full flex-shrink-0 ${
            isFullscreen 
              ? 'text-3xl sm:text-4xl md:text-5xl' 
              : 'text-2xl sm:text-3xl'
          }`}
        >
          {timeUpText}
        </motion.div>
      )}
    </div>
  );
}

